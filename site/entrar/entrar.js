/* Login do catálogo (T-0022): a tela de entrar (/entrar) e a de trocar a senha (/trocar-senha, normal e obrigatória
   no 1º acesso), mais os ajudantes dos formulários que as páginas do admin também usam (window.BAPForm).
   A segurança é toda do servidor (serviço de login): o navegador só envia o formulário e mostra a resposta. Nada de
   segredo aqui; a senha nunca é guardada nem vai para o console, o endereço ou o storage.
   Rotas da API: POST /api/entrar, GET /api/eu, POST /api/trocar-senha e POST /api/sair (contrato T-0022). */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ic = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="${d}"/></svg>`;
  const IC = { erro: ic("M12 7v6M12 16.5v.5"), info: ic("M12 7v1M12 11v6"), relogio: ic("M12 7v5l3 2") };
  const MIN_SENHA = 8; // só o tamanho, sem regra de símbolo (desenho do serviço); quem confere de verdade é o servidor
  const FALHA_REDE = "Não foi possível falar com o catálogo agora. Tente de novo em instantes.";

  // ---------- ajudantes (também do admin) ----------
  // JSON na mesma origem, com o cookie de sessão; um Blob vai cru, com o tipo dele (a logo)
  async function api(metodo, url, corpo) {
    const op = { method: metodo, credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } };
    if (corpo instanceof Blob) { op.body = corpo; op.headers["Content-Type"] = corpo.type; }
    else if (corpo !== undefined) { op.body = JSON.stringify(corpo); op.headers["Content-Type"] = "application/json"; }
    let r;
    try { r = await fetch(url, op); } catch (e) { return { status: 0, dados: null }; }
    let dados = null;
    if (r.status !== 204) { try { dados = await r.json(); } catch (e) { dados = null; } }
    return { status: r.status, dados };
  }
  const erroDe = (res, padrao) => (res.dados && typeof res.dados.erro === "string" && res.dados.erro) || padrao;

  // a sessão terminou no meio do uso: o login avisa e volta para esta tela
  function expirou() {
    location.replace("/entrar?expirou=1&volta=" + encodeURIComponent(location.pathname + location.search) + location.hash);
  }

  // "Usuário ou senha incorretos." → a 1ª frase em negrito, como nas telas aprovadas
  function frase(t, resto) {
    const m = String(t).match(/^(.+?[.!?])(\s[\s\S]*)?$/);
    const [a, b] = m ? [m[1], m[2] || ""] : [String(t), ""];
    return `<b>${esc(a)}</b>${esc(b)}${resto ? " " + esc(resto) : ""}`;
  }
  // caixa de erro (role="alert") ou de aviso (role="status") no lugar marcado; sem html, limpa
  function caixa(lugar, tipo, html, icone) {
    if (!lugar) return;
    lugar.innerHTML = html ? `<div class="caixa caixa-${tipo}" role="${tipo === "erro" ? "alert" : "status"}">${icone || (tipo === "erro" ? IC.erro : IC.info)}<span>${html}</span></div>` : "";
  }
  // erro no próprio campo: aria-invalid e a mensagem ligada pelo aria-describedby
  function erroCampo(input, msg) {
    const campo = input.closest(".campo");
    const id = input.id + "-erro";
    let p = document.getElementById(id);
    if (!p) {
      p = Object.assign(document.createElement("p"), { id, className: "msg-erro" });
      campo.appendChild(p);
      input.setAttribute("aria-describedby", ((input.getAttribute("aria-describedby") || "") + " " + id).trim());
    }
    p.textContent = msg || "";
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }
  function limparErros(raiz) {
    raiz.querySelectorAll("[aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
    raiz.querySelectorAll(".msg-erro").forEach((p) => { p.textContent = ""; });
  }
  // "Mostrar"/"Ocultar": o texto visível muda; sem aria-label nem aria-pressed (o rótulo do campo diz qual senha é)
  function mostrar(input, sim) {
    input.type = sim ? "text" : "password";
    const b = input.parentElement.querySelector(".ver:not(.gerar)");
    if (b) b.textContent = sim ? "Ocultar" : "Mostrar";
  }
  function ligarMostrar(raiz) {
    (raiz || document).querySelectorAll(".ver:not(.gerar)").forEach((b) => {
      if (b.dataset.ligado) return;
      b.dataset.ligado = "1";
      b.addEventListener("click", () => { const i = document.getElementById(b.getAttribute("aria-controls")); mostrar(i, i.type === "password"); });
    });
  }
  // o primeiro campo com erro recebe o foco
  const focarErro = (raiz) => { const i = raiz.querySelector('[aria-invalid="true"]'); if (i) i.focus(); return !!i; };

  window.BAPForm = { api, erroDe, expirou, esc, IC, MIN_SENHA, FALHA_REDE, frase, caixa, erroCampo, limparErros, mostrar, ligarMostrar, focarErro };

  // ---------- volta depois do login ----------
  // Só um caminho deste site, para não virar redirecionamento aberto; em qualquer dúvida, "/".
  // - sem caractere de controle: o navegador apaga tab, LF e CR da URL ("/\t/evil.com" viraria "//evil.com");
  // - começa com uma única "/" (nem "//" nem "/\") e, montado com new URL, fica na mesma origem;
  // - o caminho normalizado ("/./entrar", "/x/../api/eu") também não pode começar com "//" ou "/\" nem ser o login,
  //   a API ou a troca de senha. O #/produto/... vem no hash desta página, não no volta.
  function voltaSegura(v) {
    v = String(v || "").split("#")[0];
    if (!v || /[\x00-\x1f\x7f]/.test(v) || !/^\/(?![/\\])/.test(v)) return "/";
    let u;
    try { u = new URL(v, location.origin); } catch (e) { return "/"; }
    if (u.origin !== location.origin || /^\/[/\\]/.test(u.pathname)) return "/";
    let p;
    try { p = decodeURIComponent(u.pathname); } catch (e) { return "/"; }
    if (/[\x00-\x1f\x7f]/.test(p) || /^\/[/\\]/.test(p) || /^\/(entrar|api|trocar-senha)(?=[/\\?]|$)/i.test(p)) return "/";
    return u.pathname + u.search;
  }
  const PR = new URLSearchParams(location.search);
  const VOLTA = voltaSegura(PR.get("volta"));
  const destino = () => VOLTA + location.hash;
  const paraTroca = () => "/trocar-senha?volta=" + encodeURIComponent(VOLTA) + location.hash;

  // ---------- /entrar ----------
  const fEntrar = $("#form-entrar");
  if (fEntrar) {
    const aviso = $("#aviso"), u = $("#usuario"), s = $("#senha"), bt = $('button[type="submit"]', fEntrar);
    ligarMostrar(fEntrar);
    if (PR.get("expirou") === "1") {
      caixa(aviso, "info", "<b>Sua sessão terminou.</b> O acesso vale 5 horas. Entre de novo para continuar de onde parou.", IC.relogio);
    }
    u.focus();
    fEntrar.addEventListener("submit", async (e) => {
      e.preventDefault();
      limparErros(fEntrar);
      const usuario = u.value.trim().toLowerCase();
      if (!usuario) erroCampo(u, "Digite o seu usuário.");
      if (!s.value) erroCampo(s, "Digite a sua senha.");
      if (focarErro(fEntrar)) return;
      bt.disabled = true;
      const r = await api("POST", "/api/entrar", { usuario, senha: s.value });
      bt.disabled = false;
      if (r.status === 200) { location.replace(r.dados && r.dados.trocarSenha ? paraTroca() : destino()); return; }
      if (r.status === 401) caixa(aviso, "erro", frase(erroDe(r, "Usuário ou senha incorretos."), "Confira e tente de novo."));
      else if (r.status === 429) caixa(aviso, "erro", frase(erroDe(r, "Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.")));
      else caixa(aviso, "erro", frase("Não foi possível entrar agora. Tente de novo em instantes."));
      mostrar(s, false);
      s.value = "";
      s.focus();
    });
  }

  // ---------- /trocar-senha (normal, com o cabeçalho; obrigatória no 1º acesso, no cartão) ----------
  const pgTroca = document.body.dataset.pagina === "trocar-senha" && $("#app");
  if (pgTroca) {
    const campoSenha = (id, rot, auto, dica) => `<div class="campo"><label for="${id}">${rot}</label>
        <div class="senha-box"><input id="${id}" type="password" autocomplete="${auto}" required${dica ? ` aria-describedby="${id}-dica"` : ""}><button type="button" class="ver" aria-controls="${id}">Mostrar</button></div>${dica ? `<p class="dica" id="${id}-dica">${dica}</p>` : ""}</div>`;
    const usuarioOculto = (eu) => `<input type="text" name="username" autocomplete="username" value="${esc(eu ? eu.usuario : "")}" hidden>`;

    function normal(eu) {
      $(".topo").hidden = false;
      // o botão do canto (conta.js) só na troca normal: com a troca pendente, o serviço só abre /trocar-senha/** e /entrar/**
      if (eu) document.body.appendChild(Object.assign(document.createElement("script"), { src: "/conta.js" }));
      pgTroca.innerHTML = `
        <div class="pg-cab"><div class="pg-cab-in">
          <p class="trilha"><a href="/#/">Catálogo</a> › Trocar senha</p>
          <h1>Trocar senha</h1>
        </div></div>
        <div class="pg pg-estreita"><div class="painel">
          <div id="aviso"></div>
          <form class="form" id="form-senha" novalidate>
            ${usuarioOculto(eu)}
            ${campoSenha("atual", "Senha atual", "current-password")}
            ${campoSenha("nova", "Nova senha", "new-password", "Pelo menos 8 caracteres. Não repita a senha atual.")}
            ${campoSenha("conf", "Confirmar a nova senha", "new-password")}
            <div class="form-acoes"><button type="submit" class="bt">Salvar nova senha</button><a class="bt-texto" href="${esc(destino())}">Cancelar</a></div>
          </form>
        </div></div>`;
    }
    function obrigatoria(eu) {
      $(".topo").remove();
      document.body.className = "pg-login";
      pgTroca.className = "login-faixa";
      pgTroca.innerHTML = `
        <div class="login-cartao largo">
          <div class="login-marca"><img src="/assets/logo_escuro.png" alt="bap componentes de qualidade"><span>Catálogo online</span></div>
          <h1>Crie a sua senha</h1>
          <p class="sub">Olá, ${esc(eu.nome)}. No primeiro acesso, crie uma senha só sua.</p>
          <div id="aviso"></div>
          <form class="form" id="form-senha" novalidate>
            ${usuarioOculto(eu)}
            ${campoSenha("nova", "Nova senha", "new-password", "Pelo menos 8 caracteres. Não use a senha inicial.")}
            ${campoSenha("conf", "Confirmar a nova senha", "new-password")}
            <button type="submit" class="bt">Salvar e entrar no catálogo</button>
          </form>
          <p class="login-ajuda"><button type="button" class="bt-texto" id="sair">Sair</button></p>
        </div>`;
      $("#sair").addEventListener("click", async () => { await api("POST", "/api/sair"); location.replace("/entrar"); });
    }

    api("GET", "/api/eu").then((r) => {
      if (r.status === 401) { expirou(); return; }
      const eu = r.status === 200 && r.dados && r.dados.usuario ? r.dados : null; // sem o serviço: a tela normal, para conferir
      const forcada = !!(eu && eu.trocarSenha);
      if (forcada) obrigatoria(eu); else normal(eu);
      const f = $("#form-senha"), aviso = $("#aviso"), atual = $("#atual"), nova = $("#nova"), conf = $("#conf");
      const bt = $('button[type="submit"]', f);
      ligarMostrar(f);
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        limparErros(f);
        caixa(aviso, "", "");
        if (atual && !atual.value) erroCampo(atual, "Digite a senha atual.");
        if (nova.value.length < MIN_SENHA) erroCampo(nova, "Use pelo menos 8 caracteres.");
        else if (atual && nova.value === atual.value) erroCampo(nova, "A nova senha não pode ser igual à atual.");
        if (conf.value !== nova.value) erroCampo(conf, "As duas senhas novas não são iguais.");
        if (focarErro(f)) return;
        bt.disabled = true;
        const res = await api("POST", "/api/trocar-senha", atual ? { senhaAtual: atual.value, senhaNova: nova.value } : { senhaNova: nova.value });
        bt.disabled = false;
        if (res.status === 204 || res.status === 200) {
          try { sessionStorage.setItem("bap-aviso", "Senha trocada."); } catch (x) { /* sem storage: só não mostra o aviso */ }
          location.replace(destino());
          return;
        }
        if (res.status === 401) { expirou(); return; }
        const msg = erroDe(res, res.status === 400 ? "Confira as senhas e tente de novo." : "Não foi possível trocar a senha agora. Tente de novo em instantes.");
        // 400 do serviço: "A nova senha precisa ser diferente da atual." e o mínimo de 8 caracteres vão para a nova senha;
        // a senha atual errada, para a senha atual; o resto (429 do limite de tentativas, falha) fica na caixa do alto
        if (res.status === 400 && /diferente|caracteres/i.test(msg)) erroCampo(nova, msg);
        else if (res.status === 400 && atual && /atual/i.test(msg)) { erroCampo(atual, msg); atual.value = ""; }
        else caixa(aviso, "erro", frase(msg));
        if (!focarErro(f)) (atual || nova).focus();
      });
    });
  }
})();
