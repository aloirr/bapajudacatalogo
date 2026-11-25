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
    else { try { await r.text(); } catch (e) {} } // o 204 também é lido: sem isso, o Chrome 153 marca o pedido como cancelado
    return { status: r.status, dados };
  }

  // Exibição sem caixa alta ("Honda Civic", "Volkswagen Gol", "Mercedes-Benz Atego"); siglas ficam: VW, GM, BMW...,
  // palavra com número (HB20, 16V, 208), pedaço curto com hífen (CR-V) e, na versão, as de 2 a 4 letras (LXS, HX, GLI).
  // Só para mostrar: a busca e os filtros continuam com o texto da base. Do catálogo (app.js) e do Estoque (T-0035).
  const SIGLAS = new Set(["VW", "GM", "BMW", "BYD", "JAC", "GWM", "MG", "DS", "RAM", "CAOA", "JCB", "DAF", "MAN", "AGCO",
    "DOT"]); // DOT: fluido de freio (T-0035, nomes do ESTOQUE_BAP)
  const LIGA = new Set(["E", "DE", "DA", "DO", "DAS", "DOS", "COM", "SEM", "PARA"]); // "Amortecedores e Kits"
  function bonito(txt, versao) {
    return String(txt || "").toUpperCase().replace(/\s+/g, " ").trim().replace(/[A-ZÀ-Ý0-9.]+/g, (w, i, todo) => {
      if (SIGLAS.has(w) || /\d/.test(w)) return w;
      if (!versao && i > 0 && LIGA.has(w) && todo[i - 1] === " ") return w.toLowerCase();
      if (versao && w.length <= 4) return w;
      if (w.length <= 2 && (todo[i - 1] === "-" || todo[i + w.length] === "-")) return w;
      return w.charAt(0) + w.slice(1).toLowerCase();
    });
  }

  // a seta (chevron) de 18 px dos botões que abrem e fecham: a conta e o "Filtros" do Estoque (T-0035); o CSS gira 180°
  const seta = (classe) => `<svg class="${classe}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;

  window.BAP = { esc, expirou, api, LOGO_BAP, bonito, seta };
})();
