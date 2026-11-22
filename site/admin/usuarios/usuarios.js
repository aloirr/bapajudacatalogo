/* Criar usuários (T-0022): a lista dos usuários do catálogo e as janelas de criar, editar, trocar a senha e desativar
   (ou reativar), mais o envio e a remoção da logo. Só o admin abre esta página e só ele usa estas rotas: quem decide é o
   servidor (os outros recebem 404). O navegador só monta a tela e confere o formulário para ajudar quem digita.
   API: GET/POST /api/usuarios · PATCH /api/usuarios/:u · POST /api/usuarios/:u/senha · PUT/DELETE/GET /api/usuarios/:u/logo.
   A senha inicial aparece uma vez só, na janela, para o admin passar ao cliente; nunca vai para o storage ou o console. */
(function () {
  "use strict";
  const F = window.BAPForm;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = F.esc;
  const LOGO_BAP = "/assets/logo_escuro.png";
  const LOGO_MAX = 1024 * 1024; // até 1 MB (contrato); o servidor confere de novo
  const LOGO_TIPOS = ["image/png", "image/jpeg", "image/webp"];
  const RX_USUARIO = /^[a-z0-9._-]{3,32}$/; // como no contrato; o servidor confere de novo
  const DICA_LOGO = "PNG, JPG ou WEBP, até 1 MB. De preferência deitada, com fundo branco ou transparente. Sem logo, o botão do canto usa a da BAP.";
  const IC_OK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';

  const lista = $("#us-lista"), total = $("#us-total"), busca = $("#us-busca");
  let USUARIOS = [], EU = null;
  const versaoLogo = {}; // muda depois de enviar ou remover a logo, para o navegador não mostrar a antiga

  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const quando = (d) => {
    const x = new Date(d);
    if (!d || isNaN(x)) return "Ainda não entrou";
    const o = { timeZone: "America/Manaus" };
    return x.toLocaleDateString("pt-BR", o) + " " + x.toLocaleTimeString("pt-BR", { ...o, hour: "2-digit", minute: "2-digit" });
  };
  const urlLogo = (u) => `/api/usuarios/${encodeURIComponent(u.usuario)}/logo` + (versaoLogo[u.usuario] ? "?v=" + versaoLogo[u.usuario] : "");
  // sem logo: a da BAP (para o admin, ela é a logo da empresa dele)
  const semLogo = (u) => (u.admin ? "Logo da BAP" : "Sem logo: logo da BAP");
  const logoDe = (u) => (u.temLogo
    ? `<span class="conta-logo"><img src="${urlLogo(u)}" alt="Logo da ${esc(u.empresa || u.nome)}" onerror="this.onerror=null;this.src='${LOGO_BAP}';this.alt='${semLogo(u)}'"></span>`
    : `<span class="conta-logo"><img src="${LOGO_BAP}" alt="${semLogo(u)}"></span>`);

  // senha inicial gerada aqui: 10 caracteres, sem as letras e os números que confundem (l, I, 1, O, 0, o)
  function gerarSenha() {
    const ab = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const n = crypto.getRandomValues(new Uint32Array(10));
    return Array.from(n, (x) => ab[x % ab.length]).join("");
  }

  // ---------- lista ----------
  const ordem = (a, b) => (b.admin - a.admin) || (b.ativo - a.ativo) || a.nome.localeCompare(b.nome, "pt-BR");
  function linha(u) {
    const eu = EU && EU.usuario === u.usuario;
    const n = esc(u.nome), ua = esc(u.usuario);
    const bt = (acao, txt, rot) => `<button type="button" class="bt bt-claro" data-acao="${acao}" data-u="${ua}" aria-label="${rot} ${n}">${txt}</button>`;
    const acoes = eu
      ? `<span class="tag">Você</span>${bt("editar", "Editar", "Editar")}`
      : u.ativo
        ? bt("editar", "Editar", "Editar") + bt("senha", "Trocar senha", "Trocar a senha de") + bt("desativar", "Desativar", "Desativar")
        : bt("editar", "Editar", "Editar") + bt("reativar", "Reativar", "Reativar");
    return `<tr${u.ativo ? "" : ' class="off"'}>
      <td class="us-td-emp"><div class="us-emp">${logoDe(u)}<div><b>${esc(u.empresa)}</b>${u.temLogo || u.admin ? "" : "<small>Sem logo: usa a da BAP</small>"}</div></div></td>
      <td data-rot="Nome">${n}</td>
      <td data-rot="Usuário"><span class="us-login">${ua}</span></td>
      <td data-rot="Situação"><div class="us-sit">${u.admin ? '<span class="tag tag-escura">Admin</span>' : ""}${u.ativo ? '<span class="tag tag-verde">Ativo</span>' : '<span class="tag">Desativado</span>'}${u.ativo && u.trocarSenha ? '<span class="tag">Falta trocar a senha inicial</span>' : ""}</div></td>
      <td data-rot="Último acesso">${esc(quando(u.ultimoAcesso))}</td>
      <td class="us-td-acoes"><div class="us-acoes">${acoes}</div></td>
    </tr>`;
  }
  function mostrarLista() {
    const t = norm(busca.value.trim());
    const achados = t ? USUARIOS.filter((u) => norm([u.nome, u.empresa, u.usuario].join(" ")).includes(t)) : USUARIOS;
    const ativos = USUARIOS.filter((u) => u.ativo).length;
    const pl = (k, um, varios) => k + " " + (k === 1 ? um : varios);
    total.textContent = !t ? `${pl(USUARIOS.length, "usuário", "usuários")} · ${pl(ativos, "ativo", "ativos")}`
      : achados.length ? `${pl(achados.length, "usuário encontrado", "usuários encontrados")} de ${USUARIOS.length}`
        : `Nenhum usuário encontrado para “${busca.value.trim()}”.`;
    lista.innerHTML = achados.length ? `<table class="us">
      <caption class="vh">Usuários do catálogo</caption>
      <thead><tr><th scope="col">Empresa</th><th scope="col">Nome</th><th scope="col">Usuário</th><th scope="col">Situação</th><th scope="col">Último acesso</th><th scope="col"><span class="vh">Ações</span></th></tr></thead>
      <tbody>${achados.map(linha).join("")}</tbody></table>` : "";
  }
  async function carregar() {
    const r = await F.api("GET", "/api/usuarios");
    if (r.status === 401) { F.expirou(); return; }
    if (r.status !== 200 || !Array.isArray(r.dados)) {
      total.textContent = "";
      F.caixa(lista, "erro", F.frase("Não foi possível carregar os usuários agora.", "Atualize a página em instantes."));
      return;
    }
    USUARIOS = r.dados.slice().sort(ordem);
    mostrarLista();
  }
  busca.addEventListener("input", mostrarLista);

  // ---------- janela (uma só, com o conteúdo de cada ação) ----------
  const dlg = document.createElement("dialog");
  dlg.className = "dlg";
  dlg.setAttribute("aria-labelledby", "dlg-t");
  $("#app").appendChild(dlg);
  let VOLTA_FOCO = null; // { acao, u }: o botão que abriu a janela recebe o foco de volta
  dlg.addEventListener("close", () => {
    dlg.innerHTML = ""; // a senha inicial não fica na página
    const b = VOLTA_FOCO && (VOLTA_FOCO.u
      ? lista.querySelector(`[data-acao="${VOLTA_FOCO.acao}"][data-u="${CSS.escape(VOLTA_FOCO.u)}"]`) || lista.querySelector(`[data-u="${CSS.escape(VOLTA_FOCO.u)}"]`)
      : $("#us-criar"));
    if (b) b.focus();
  });
  dlg.addEventListener("click", (e) => { if (e.target.closest("[data-fecha]")) dlg.close(); });
  function abrirJanela(titulo, corpo, curta) {
    dlg.classList.toggle("dlg-curta", !!curta);
    dlg.innerHTML = `<div class="dlg-barra"><h2 id="dlg-t">${titulo}</h2><button type="button" class="janela-x" data-fecha aria-label="Fechar">✕</button></div><div class="dlg-corpo">${corpo}</div>`;
    F.ligarMostrar(dlg);
    dlg.showModal();
    return $(".dlg-corpo", dlg);
  }
  const campoTexto = (id, rot, extra, dica) => `<div class="campo"><label for="${id}">${rot}</label><input id="${id}" type="text" ${extra}${dica ? ` aria-describedby="${id}-dica"` : ""}>${dica ? `<p class="dica" id="${id}-dica">${dica}</p>` : ""}</div>`;
  const campoSenha = (id, rot, dica, foco) => `<div class="campo"><label for="${id}">${rot}</label>
    <div class="senha-box com-gerar"><input id="${id}" type="password" autocomplete="new-password" required aria-describedby="${id}-dica"${foco ? " autofocus" : ""}><button type="button" class="ver gerar" aria-label="Gerar senha" aria-controls="${id}">Gerar</button><button type="button" class="ver" aria-controls="${id}">Mostrar</button></div><p class="dica" id="${id}-dica">${dica}</p></div>`;
  const ACOES = (principal, classe) => `<div class="form-acoes"><button type="submit" class="bt${classe ? " " + classe : ""}">${principal}</button><button type="button" class="bt-texto" data-fecha>Cancelar</button></div>`;
  // "Gerar": a senha nova aparece (o campo vira texto e o botão vira "Ocultar")
  function ligarGerar(corpo) {
    corpo.querySelectorAll(".gerar").forEach((b) => b.addEventListener("click", () => {
      const i = document.getElementById(b.getAttribute("aria-controls"));
      i.value = gerarSenha();
      F.mostrar(i, true);
      F.erroCampo(i, "");
      i.focus();
    }));
  }
  function conferirSenha(i) {
    if (i.value.length < F.MIN_SENHA) F.erroCampo(i, "Use pelo menos 8 caracteres.");
  }
  // depois de criar ou de trocar a senha: o usuário e a senha à vista, com o "Copiar usuário e senha"
  function entrega(corpo, aviso, u, senha, extra) {
    corpo.innerHTML = `<div class="caixa caixa-info" role="status">${IC_OK}<span>${aviso}</span></div>${extra || ""}
      <dl class="entrega"><dt>Usuário</dt><dd>${esc(u)}</dd><dt>Senha inicial</dt><dd>${esc(senha)}</dd></dl>
      <div class="form-acoes"><button type="button" class="bt" id="copiar">Copiar usuário e senha</button><button type="button" class="bt-texto" data-fecha>Fechar</button></div>
      <p class="copia-msg" id="copia-msg" role="status"></p>`;
    const texto = `Catálogo online BAP\n${location.origin}/entrar\nUsuário: ${u}\nSenha inicial: ${senha}`;
    // a resposta da cópia fica dentro da janela (o aviso solto ficaria atrás dela); sem a área de transferência
    // moderna (endereço http), tenta o jeito antigo; se nada der, pede para anotar
    const msg = $("#copia-msg", corpo);
    function copiarAntigo() {
      const ta = Object.assign(document.createElement("textarea"), { value: texto, readOnly: true });
      ta.className = "vh"; corpo.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      $("#copiar", corpo).focus(); // o select() levou o foco para o campo escondido
      return ok ? Promise.resolve() : Promise.reject();
    }
    $("#copiar", corpo).addEventListener("click", () => {
      msg.className = "copia-msg"; msg.textContent = "";
      (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(texto).catch(copiarAntigo) : copiarAntigo())
        .then(() => { msg.textContent = "Usuário e senha copiados."; }, () => { msg.classList.add("erro"); msg.textContent = "Não foi possível copiar. Anote o usuário e a senha acima antes de fechar."; });
    });
    $("#copiar", corpo).focus();
  }
  // erro da API: 401 leva ao login; o resto aparece na caixa do alto da janela
  function falhou(r, aviso, padrao) {
    if (r.status === 401) { F.expirou(); return; }
    F.caixa(aviso, "erro", F.frase(F.erroDe(r, r.status === 0 ? F.FALHA_REDE : padrao)));
    aviso.scrollIntoView({ block: "nearest" });
  }

  // ---------- logo (envio no criar e no editar) ----------
  // estado: { arquivo: File|null, remover: bool, tem: bool (a logo que já existe) }
  function blocoLogo(u) {
    return `<div class="campo"><span class="campo-rot" id="logo-rot">Logo da empresa</span>
      <div class="logo-envio" role="group" aria-labelledby="logo-rot"><span class="conta-logo"><img id="logo-ver" src="${u && u.temLogo ? urlLogo(u) : LOGO_BAP}" alt="${u && u.temLogo ? "Logo da " + esc(u.empresa || u.nome) : "Sem logo: logo da BAP"}"></span>
        <input id="logo-arq" class="vh" type="file" accept="image/png,image/jpeg,image/webp" aria-describedby="logo-dica"><label class="bt bt-claro" for="logo-arq" id="logo-bt"></label>
        <button type="button" class="bt-texto" id="logo-tirar">Remover logo</button></div>
      <p class="dica" id="logo-dica">${DICA_LOGO}</p></div>`;
  }
  function ligarLogo(corpo, u) {
    const st = { arquivo: null, remover: false, tem: !!(u && u.temLogo) };
    const img = $("#logo-ver", corpo), arq = $("#logo-arq", corpo), bt = $("#logo-bt", corpo), tirar = $("#logo-tirar", corpo);
    let urlTemp = null;
    const atualizar = () => {
      const com = !!st.arquivo || (st.tem && !st.remover);
      bt.textContent = com ? "Trocar logo" : "Enviar logo";
      tirar.hidden = !com;
      if (urlTemp) { URL.revokeObjectURL(urlTemp); urlTemp = null; }
      if (st.arquivo) { urlTemp = URL.createObjectURL(st.arquivo); img.src = urlTemp; img.alt = "Logo escolhida: " + st.arquivo.name; }
      else if (com) { img.src = urlLogo(u); img.alt = "Logo da " + (u.empresa || u.nome); }
      else { img.src = LOGO_BAP; img.alt = "Sem logo: logo da BAP"; }
    };
    arq.addEventListener("change", () => {
      const f = arq.files[0];
      F.erroCampo(arq, "");
      if (!f) return;
      if (!LOGO_TIPOS.includes(f.type)) F.erroCampo(arq, "Envie a logo em PNG, JPG ou WEBP.");
      else if (f.size > LOGO_MAX) F.erroCampo(arq, "A logo passa de 1 MB. Envie uma imagem menor.");
      else { st.arquivo = f; st.remover = false; }
      arq.value = "";
      atualizar();
    });
    tirar.addEventListener("click", () => { st.arquivo = null; st.remover = true; atualizar(); bt.focus(); });
    atualizar();
    return st;
  }
  // grava a logo escolhida (PUT, corpo cru) ou a remoção (DELETE); devolve a resposta com erro, ou null se deu certo
  async function gravarLogo(usuario, st) {
    const url = `/api/usuarios/${encodeURIComponent(usuario)}/logo`;
    let r = null;
    if (st.arquivo) r = await F.api("PUT", url, st.arquivo);
    else if (st.remover && st.tem) r = await F.api("DELETE", url);
    if (!r) return null;
    versaoLogo[usuario] = Date.now();
    return r.status === 204 || r.status === 200 ? null : r;
  }

  // ---------- criar ----------
  function criar() {
    VOLTA_FOCO = { acao: "criar" };
    const corpo = abrirJanela("Criar usuário", `<form class="form" novalidate><div id="dlg-aviso"></div>
      <div class="duas">${campoTexto("n-nome", "Nome", 'autocomplete="off" maxlength="80" required autofocus')}${campoTexto("n-emp", "Empresa", 'autocomplete="organization" maxlength="80" required')}</div>
      ${campoTexto("n-us", "Usuário (para entrar)", 'autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="32" required', "Letras minúsculas, números e ponto. Ex.: maria.silva. Não muda depois.")}
      ${campoSenha("n-senha", "Senha inicial", "Pelo menos 8 caracteres. O usuário troca no 1º acesso.")}
      ${blocoLogo(null)}
      ${ACOES("Criar usuário")}</form>`);
    const f = $("form", corpo), aviso = $("#dlg-aviso", corpo);
    const nome = $("#n-nome", corpo), emp = $("#n-emp", corpo), us = $("#n-us", corpo), senha = $("#n-senha", corpo);
    ligarGerar(corpo);
    const logo = ligarLogo(corpo, null);
    // o usuário sugerido pelo nome ("Maria Silva" → "maria.silva"), até o admin mexer nele
    let usMexido = false;
    us.addEventListener("input", () => { usMexido = true; });
    nome.addEventListener("input", () => {
      if (usMexido) return;
      const p = norm(nome.value).match(/[a-z0-9]+/g) || [];
      us.value = (p.length > 1 ? p[0] + "." + p[p.length - 1] : p[0] || "").slice(0, 32);
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      F.limparErros(f); F.caixa(aviso, "", "");
      us.value = us.value.trim().toLowerCase();
      if (!nome.value.trim()) F.erroCampo(nome, "Digite o nome.");
      if (!emp.value.trim()) F.erroCampo(emp, "Digite a empresa.");
      if (!us.value) F.erroCampo(us, "Digite o usuário.");
      else if (!RX_USUARIO.test(us.value)) F.erroCampo(us, "Use só letras minúsculas, números, ponto, hífen ou sublinhado (3 a 32).");
      conferirSenha(senha);
      if (F.focarErro(f)) return;
      const bt = $('button[type="submit"]', f);
      bt.disabled = true;
      const r = await F.api("POST", "/api/usuarios", { usuario: us.value, nome: nome.value.trim(), empresa: emp.value.trim(), senha: senha.value });
      if (r.status !== 201 && r.status !== 200) {
        bt.disabled = false;
        if (r.status === 409) { F.erroCampo(us, F.erroDe(r, "Este usuário já existe. Escolha outro.")); us.focus(); return; }
        falhou(r, aviso, "Não foi possível criar o usuário. Confira os campos.");
        return;
      }
      const rl = await gravarLogo(us.value, logo);
      const extra = rl ? `<div class="caixa caixa-erro" role="alert">${F.IC.erro}<span>${F.frase("A logo não foi enviada.", [F.erroDe(rl, ""), "Envie de novo em Editar."].filter(Boolean).join(" "))}</span></div>` : "";
      entrega(corpo, "<b>Usuário criado.</b> Passe ao cliente o usuário e a senha abaixo.", us.value, senha.value, extra);
      carregar();
    });
  }

  // ---------- editar ----------
  function editar(u) {
    const corpo = abrirJanela("Editar usuário", `<form class="form" novalidate><div id="dlg-aviso"></div>
      <div class="duas">${campoTexto("e-nome", "Nome", `autocomplete="off" maxlength="80" required autofocus value="${esc(u.nome)}"`)}${campoTexto("e-emp", "Empresa", `autocomplete="organization" maxlength="80" required value="${esc(u.empresa)}"`)}</div>
      ${campoTexto("e-us", "Usuário (para entrar)", `autocomplete="off" readonly value="${esc(u.usuario)}"`, "O usuário não muda depois de criado.")}
      ${blocoLogo(u)}
      ${ACOES("Salvar")}</form>`);
    const f = $("form", corpo), aviso = $("#dlg-aviso", corpo), nome = $("#e-nome", corpo), emp = $("#e-emp", corpo);
    const logo = ligarLogo(corpo, u);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      F.limparErros(f); F.caixa(aviso, "", "");
      if (!nome.value.trim()) F.erroCampo(nome, "Digite o nome.");
      if (!emp.value.trim()) F.erroCampo(emp, "Digite a empresa.");
      if (F.focarErro(f)) return;
      const bt = $('button[type="submit"]', f);
      bt.disabled = true;
      const mud = {};
      if (nome.value.trim() !== u.nome) mud.nome = nome.value.trim();
      if (emp.value.trim() !== u.empresa) mud.empresa = emp.value.trim();
      if (Object.keys(mud).length) {
        const r = await F.api("PATCH", "/api/usuarios/" + encodeURIComponent(u.usuario), mud);
        if (r.status !== 200 && r.status !== 204) { bt.disabled = false; falhou(r, aviso, "Não foi possível salvar. Confira os campos."); return; }
      }
      const rl = await gravarLogo(u.usuario, logo);
      bt.disabled = false;
      if (rl) { await carregar(); falhou(rl, aviso, "A logo não foi gravada. Tente de novo."); return; }
      dlg.close();
      await carregar();
      window.BAPConta.toast("Alterações salvas.");
    });
  }

  // ---------- trocar a senha de um usuário ----------
  function trocarSenha(u) {
    const corpo = abrirJanela(`Trocar a senha de ${esc(u.nome)}`, `<form class="form" novalidate><div id="dlg-aviso"></div>
      <p>Usuário: <b>${esc(u.usuario)}</b> · ${esc(u.empresa)}</p>
      ${campoSenha("t-senha", "Nova senha inicial", "Pelo menos 8 caracteres. Passe a senha direto para a pessoa.", true)}
      <div class="caixa caixa-info">${F.IC.info}<span>No próximo acesso, ${esc(u.nome)} cria uma senha nova. Se o catálogo estiver aberto, a sessão termina agora.</span></div>
      ${ACOES("Trocar senha")}</form>`);
    const f = $("form", corpo), aviso = $("#dlg-aviso", corpo), senha = $("#t-senha", corpo);
    ligarGerar(corpo);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      F.limparErros(f); F.caixa(aviso, "", "");
      conferirSenha(senha);
      if (F.focarErro(f)) return;
      const bt = $('button[type="submit"]', f);
      bt.disabled = true;
      const r = await F.api("POST", `/api/usuarios/${encodeURIComponent(u.usuario)}/senha`, { senha: senha.value });
      if (r.status !== 204 && r.status !== 200) { bt.disabled = false; falhou(r, aviso, "Não foi possível trocar a senha. Tente de novo."); return; }
      entrega(corpo, `<b>Senha trocada.</b> Passe a nova senha inicial para ${esc(u.nome)}.`, u.usuario, senha.value);
      carregar();
    });
  }

  // ---------- desativar (com confirmação) e reativar ----------
  async function mudarAtivo(u, ativo, aviso) {
    const r = await F.api("PATCH", "/api/usuarios/" + encodeURIComponent(u.usuario), { ativo });
    if (r.status !== 200 && r.status !== 204) return r;
    await carregar();
    window.BAPConta.toast(ativo ? "Usuário reativado." : "Usuário desativado.");
    return null;
  }
  function desativar(u) {
    const corpo = abrirJanela(`Desativar ${esc(u.nome)}?`, `<form novalidate><div id="dlg-aviso"></div>
      <p>${esc(u.nome)} não entra mais no catálogo, e a sessão aberta termina agora. O cadastro e a logo ficam guardados: dá para reativar depois.</p>
      <div class="form-acoes"><button type="submit" class="bt bt-perigo">Desativar</button><button type="button" class="bt-texto" data-fecha autofocus>Cancelar</button></div></form>`, true);
    const f = $("form", corpo), aviso = $("#dlg-aviso", corpo);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bt = $('button[type="submit"]', f);
      bt.disabled = true;
      const r = await mudarAtivo(u, false);
      if (r) { bt.disabled = false; falhou(r, aviso, "Não foi possível desativar. Tente de novo."); return; }
      dlg.close();
    });
  }

  lista.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-acao]");
    if (!b) return;
    const u = USUARIOS.find((x) => x.usuario === b.dataset.u);
    if (!u) return;
    VOLTA_FOCO = { acao: b.dataset.acao, u: u.usuario };
    if (b.dataset.acao === "editar") editar(u);
    else if (b.dataset.acao === "senha") trocarSenha(u);
    else if (b.dataset.acao === "desativar") desativar(u);
    else if (b.dataset.acao === "reativar") {
      b.disabled = true;
      const r = await mudarAtivo(u, true);
      if (r) { b.disabled = false; if (r.status === 401) F.expirou(); else window.BAPConta.toast(F.erroDe(r, "Não foi possível reativar. Tente de novo.")); }
      else { const nb = lista.querySelector(`[data-u="${CSS.escape(u.usuario)}"]`); if (nb) nb.focus(); }
    }
  });
  $("#us-criar").addEventListener("click", criar);

  window.BAPConta.eu.then((eu) => { EU = eu; carregar(); });
})();
