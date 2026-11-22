/* Botão do canto (T-0022): a conta de quem entrou no catálogo, lida de GET /api/eu (serviço de login).
   Mostra a logo da empresa (ou a da BAP, sem logo ou com 404), o nome e a empresa; aberto, "Trocar senha" e "Sair" e,
   para o admin, o grupo Administração ("Criar usuários" e "Catálogos em PDF").
   A segurança é toda do servidor: o navegador não decide acesso e aqui não há segredo. Sem o serviço (site aberto com
   http.server, /api/eu responde 404), o botão não aparece e o catálogo funciona como antes.
   Um 401 (sessão vencida: ela vale 5 h desde o login) leva a /entrar?expirou=1, com a volta para a mesma tela. */
(function () {
  "use strict";
  const LOGO_BAP = "/assets/logo_escuro.png"; // sem logo própria: o logo inteiro da BAP, pequeno (7 a)
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    usuarios: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M19 8v6M16 11h6"/>'),
    pdf: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15l3 3 3-3"/>'),
    chave: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'),
    sair: svg('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/>'),
  };
  const SETA = '<svg class="conta-seta" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  // a sessão terminou: o login avisa e, depois de entrar, volta para esta tela (o #/produto/... vai junto)
  function expirou() {
    location.replace("/entrar?expirou=1&volta=" + encodeURIComponent(location.pathname + location.search) + location.hash);
  }

  // o aviso entra vazio, com role="status", e o texto vem depois (assim o leitor de tela anuncia); com uma janela
  // aberta (showModal), ele entra nela, senão ficaria escondido atrás
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status");
    (document.querySelector("dialog[open]") || document.body).appendChild(t);
    setTimeout(() => { t.textContent = msg; }, 50);
    setTimeout(() => t.remove(), 3200);
  }

  // GET /api/eu: os dados da conta (200), a sessão vencida (401) ou nada (sem o serviço)
  async function lerEu() {
    let r;
    try { r = await fetch("/api/eu", { cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json" } }); }
    catch (e) { return null; }
    if (r.status === 401) { expirou(); return null; }
    if (!r.ok) return null;
    try { const d = await r.json(); return d && typeof d === "object" && d.usuario ? d : null; } catch (e) { return null; }
  }
  const EU = lerEu();

  // confere a sessão quando uma foto falha ou o horário dela passou (uma vez a cada 15 s, no máximo)
  let ultima = 0;
  function conferir(forcar) {
    const agora = Date.now();
    if (!forcar && agora - ultima < 15000) return;
    ultima = agora;
    fetch("/api/eu", { cache: "no-store", credentials: "same-origin" }).then((r) => { if (r.status === 401) expirou(); }, () => {});
  }

  function logoHtml(eu, alt) {
    const src = eu.temLogo ? "/api/eu/logo" : LOGO_BAP;
    // com 404, a da BAP; no menu aberto, com o alt do site
    const troca = alt ? `;this.alt='bap componentes de qualidade'` : "";
    return `<span class="conta-logo"><img src="${src}" alt="${esc(alt)}" onerror="this.onerror=null;this.src='${LOGO_BAP}'${troca}"></span>`;
  }

  function montar(eu) {
    const caixa = document.getElementById("conta");
    if (!caixa || eu.trocarSenha) return; // na troca obrigatória não há menu: a página só tem o "Sair"
    const aqui = location.pathname.replace(/\/+$/, "") || "/";
    const item = (href, ic, txt) => `<li><a href="${href}"${aqui === href ? ' aria-current="page"' : ""}>${ic}${txt}</a></li>`;
    const altLogo = eu.temLogo ? "Logo da " + (eu.empresa || eu.nome) : "bap componentes de qualidade"; // o logo da BAP com o alt do site (MC-0007)
    caixa.innerHTML = `
      <button type="button" class="conta-bt" aria-expanded="false" aria-controls="conta-menu">
        ${logoHtml(eu, "")}
        <span class="conta-nome"><b>${esc(eu.nome)}</b><small>${esc(eu.empresa)}</small><span class="vh"> · menu da conta</span></span>
        ${SETA}
      </button>
      <div class="conta-menu" id="conta-menu" hidden>
        <div class="conta-cab">${logoHtml(eu, altLogo)}<div><b>${esc(eu.nome)}</b><span>${esc(eu.empresa)}</span><span>Usuário: ${esc(eu.usuario)}</span>${eu.admin ? '<span class="tag tag-escura">Admin</span>' : ""}</div></div>
        <ul>
          ${eu.admin ? `<li class="rot-grupo" aria-hidden="true">Administração</li>
          ${item("/admin/usuarios", IC.usuarios, "Criar usuários")}
          ${item("/admin/pdfs", IC.pdf, "Catálogos em PDF")}
          <li class="sep" role="separator"></li>` : ""}
          ${item("/trocar-senha", IC.chave, "Trocar senha")}
          <li><button type="button" class="sair">${IC.sair}Sair</button></li>
        </ul>
      </div>`;
    caixa.hidden = false;
    document.body.classList.add("logado");

    const bt = caixa.querySelector(".conta-bt");
    const menu = caixa.querySelector(".conta-menu");
    const abrir = (sim) => { bt.setAttribute("aria-expanded", sim ? "true" : "false"); menu.hidden = !sim; };
    bt.addEventListener("click", () => abrir(bt.getAttribute("aria-expanded") !== "true"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { abrir(false); bt.focus(); } });
    document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest("#conta")) abrir(false); });
    caixa.addEventListener("focusout", (e) => { if (!menu.hidden && e.relatedTarget && !caixa.contains(e.relatedTarget)) abrir(false); });
    window.addEventListener("hashchange", () => abrir(false));
    caixa.querySelector(".sair").addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      try { await fetch("/api/sair", { method: "POST", credentials: "same-origin" }); } catch (x) { /* o cookie vence sozinho */ }
      location.replace("/entrar");
    });

    // a sessão vence 5 h depois do login (2 a): no horário, confere e leva ao login
    const fim = Date.parse(eu.expiraEm);
    if (fim) {
      setTimeout(() => conferir(true), Math.max(0, fim - Date.now()) + 1500);
      document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() > fim) conferir(true); });
    }
    // uma foto que falha pode ser a sessão vencida (401): o "Foto em breve" não pode enganar
    document.addEventListener("error", (e) => { if (e.target && e.target.tagName === "IMG") conferir(false); }, true);
  }
  EU.then((eu) => { if (eu) montar(eu); });

  // aviso deixado pela página anterior (ex.: "Senha trocada.")
  try {
    const aviso = sessionStorage.getItem("bap-aviso");
    if (aviso) { sessionStorage.removeItem("bap-aviso"); toast(aviso); }
  } catch (e) { /* sem sessionStorage */ }

  // o botão verde do rodapé (op4e) volta ao topo; o foco vai para o conteúdo
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".rodape-topo")) return;
    window.scrollTo({ top: 0 }); // suave ou direto pelo scroll-behavior do CSS (reduce)
    const app = document.getElementById("app");
    if (app) app.focus({ preventScroll: true });
  });

  window.BAPConta = { eu: EU, expirou, toast };
})();
