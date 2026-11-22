/* Comum (T-0022): o que o catálogo, o login, a conta e o admin dividem (window.BAP). Fica em /entrar/, que o serviço de
   login abre sem sessão e também com a troca de senha pendente. Vem antes dos outros scripts nas 5 páginas.
   A segurança é toda do servidor; aqui não há segredo. */
(function () {
  "use strict";
  const LOGO_BAP = "/assets/logo_escuro.png"; // sem logo própria: o logo inteiro da BAP, pequeno (7 a)
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // a sessão terminou (ela vale 5 h desde o login): o login avisa e, depois de entrar, volta para esta tela
  // (o #/produto/... vai junto)
  function expirou() {
    location.replace("/entrar?expirou=1&volta=" + encodeURIComponent(location.pathname + location.search) + location.hash);
  }

  // JSON na mesma origem, com o cookie de sessão; um Blob vai cru, com o tipo dele (a logo). Um 401 (fora do próprio
  // login, onde ele quer dizer senha errada) leva ao login e a promessa não volta: quem chamou não trata o 401.
  async function api(metodo, url, corpo) {
    const op = { method: metodo, credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } };
    if (corpo instanceof Blob) { op.body = corpo; op.headers["Content-Type"] = corpo.type; }
    else if (corpo !== undefined) { op.body = JSON.stringify(corpo); op.headers["Content-Type"] = "application/json"; }
    let r;
    try { r = await fetch(url, op); } catch (e) { return { status: 0, dados: null }; }
    if (r.status === 401 && url !== "/api/entrar") { expirou(); return new Promise(() => {}); }
    let dados = null;
    if (r.status !== 204) { try { dados = await r.json(); } catch (e) { dados = null; } }
    return { status: r.status, dados };
  }

  window.BAP = { esc, expirou, api, LOGO_BAP };
})();
