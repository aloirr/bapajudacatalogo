// T-0034 · SIMULAÇÃO da aba Estoque. Só mostra a tela; não é a implementação.
// ?visao=admin (todas as 25 colunas), ?visao=vendedor (5 colunas) ou ?visao=cliente (404). ?q= preenche a busca, ?filial= a cidade
// e ?abrir=1 abre todos os cartões do admin no celular (para o print).
// Na versão final o corte das colunas é feito NO SERVIDOR: o vendedor nem recebe preço, custo ou markup.
// Aqui o corte imita o servidor logo ao carregar: na visão vendedor as outras colunas são apagadas da memória.
(function () {
  "use strict";
  const sim = window.SIM_ESTOQUE;
  const pars = new URLSearchParams(location.search);
  const visao = ["admin", "vendedor", "cliente"].includes(pars.get("visao")) ? pars.get("visao") : "admin";
  document.querySelectorAll(".sim-visoes a").forEach((a) => {
    if (a.dataset.visao === visao) a.setAttribute("aria-current", "page");
  });

  if (visao === "cliente") {
    document.title = "Não encontrado.";
    document.getElementById("sem-acesso").hidden = false;
    return;
  }
  document.getElementById("menu-estoque").hidden = false;
  document.getElementById("com-acesso").hidden = false;
  document.body.classList.add("est-" + visao);

  // As 5 colunas do vendedor (decisão 2a). "Cidade / filial" junta CIDADE e FILIAL_BAP.
  const VENDEDOR = ["COD_PRODUTO", "DESCRICAO_PRODUTO", "FORNECEDOR", "CIDADE", "FILIAL_BAP", "ESTOQUE"];
  const linhas = visao === "admin" ? sim.linhas
    : sim.linhas.map((l) => Object.fromEntries(VENDEDOR.map((c) => [c, l[c]])));
  // DATA e HORA da posição: vão no cabeçalho, uma vez (na final, o servidor manda à parte).
  document.getElementById("est-data").textContent = sim.linhas[0].DATA;
  document.getElementById("est-hora").textContent = sim.linhas[0].HORA;
  document.getElementById("est-quem").textContent = visao === "admin"
    ? "Admin: todas as colunas" : "Vendedor: sem preço, custo e markup";

  const ROT = {
    COD_PRODUTO: "Código", DESCRICAO_PRODUTO: "Descrição", FORNECEDOR: "Fornecedor", CIDADE: "Cidade / filial", ESTOQUE: "Estoque",
    DATA: "Data", HORA: "Hora", ID_PRODUTO: "ID do produto", COD_FORNECEDOR: "Cód. fornecedor", FILIAL_CD: "Filial CD",
    PPEDIDO: "Pedido pend.", ORIGEM_CUSTO: "Origem do custo", TABELA_CAPITAL: "Tabela capital", PRECO_CAPITAL: "Preço capital",
    TABELA_INTERIOR: "Tabela interior", PRECO_INTERIOR: "Preço interior", MARKUP_CAPITAL: "Markup capital",
    MARKUP_INTERIOR: "Markup interior", CATEGORIA: "Categoria", SISTEMA: "Sistema", FAMILIA: "Família", LINHA: "Linha",
    SUCATA: "Sucata", CUSTO_TOTAL: "Custo total",
  };
  // Colunas da tela: as 5 principais primeiro; o admin ganha as outras 20 na ordem do xlsx (25 no total, com CIDADE e FILIAL_BAP juntas).
  const PRINCIPAIS = ["COD_PRODUTO", "DESCRICAO_PRODUTO", "FORNECEDOR", "CIDADE", "ESTOQUE"];
  const JUNTAS = new Set([...PRINCIPAIS, "FILIAL_BAP"]);
  const EXTRAS = visao === "admin" ? sim.colunas.filter((c) => !JUNTAS.has(c)) : [];
  const DINHEIRO = new Set(["PRECO_CAPITAL", "PRECO_INTERIOR", "CUSTO_TOTAL", "SUCATA"]);
  const NUMERO = new Set(["ESTOQUE", "PPEDIDO", "MARKUP_CAPITAL", "MARKUP_INTERIOR", ...DINHEIRO]);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const real = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dec = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function valor(c, v) {
    if (v === "" || v == null) return '<span class="est-vazio">—</span>';
    if (DINHEIRO.has(c)) return real.format(v);
    if (c === "MARKUP_CAPITAL" || c === "MARKUP_INTERIOR") return dec.format(v);
    return esc(v);
  }
  const filialTxt = (l) => `${l.CIDADE} · ${l.FILIAL_BAP}`;

  // Filtro de cidade / filial: as 7 da amostra, em ordem alfabética.
  const sel = document.getElementById("est-filial");
  [...new Map(linhas.map((l) => [l.FILIAL_BAP, l])).values()]
    .sort((a, b) => a.CIDADE.localeCompare(b.CIDADE, "pt-BR"))
    .forEach((l) => sel.insertAdjacentHTML("beforeend", `<option value="${esc(l.FILIAL_BAP)}">${esc(filialTxt(l))}</option>`));

  // Busca: código BAP, código do fornecedor, descrição e cidade/filial (sem acento, sem maiúscula, todas as palavras).
  const indice = linhas.map((l) => norm([l.COD_PRODUTO, l.ID_PRODUTO, l.COD_FORNECEDOR, l.DESCRICAO_PRODUTO, l.FORNECEDOR, l.CIDADE, l.FILIAL_BAP].join(" ")));
  const busca = document.getElementById("est-busca");
  busca.value = pars.get("q") || "";
  if (pars.get("filial")) sel.value = pars.get("filial");

  function celula(c, l, extra) {
    const cls = [NUMERO.has(c) ? "est-num" : "", extra ? "est-extra" : "", c === "ESTOQUE" && Number(l.ESTOQUE) === 0 ? "est-zero" : ""].filter(Boolean).join(" ");
    let v;
    if (c === "COD_PRODUTO") v = `<b class="est-cod">${esc(l.COD_PRODUTO)}</b>`;
    else if (c === "CIDADE") v = `<span class="est-cid">${esc(l.CIDADE)}</span> <small>${esc(l.FILIAL_BAP)}</small>`;
    else if (c === "ESTOQUE") v = Number(l.ESTOQUE) === 0 ? '<span class="tag">Sem estoque</span>' : `<b>${esc(l.ESTOQUE)}</b>`;
    else v = valor(c, l[c]);
    return `<td class="${cls} est-c-${c.toLowerCase()}" data-rot="${esc(ROT[c])}">${v}</td>`;
  }

  function mostrar() {
    const termos = norm(busca.value).split(/\s+/).filter(Boolean);
    const fil = sel.value;
    const achadas = linhas.filter((l, i) => (!fil || l.FILIAL_BAP === fil) && termos.every((t) => indice[i].includes(t)));
    document.getElementById("est-total").textContent = `${achadas.length} de ${linhas.length} linhas`;
    const lista = document.getElementById("est-lista");
    if (!achadas.length) {
      lista.innerHTML = '<p class="est-nada">Nada encontrado. Confira o código ou tente outra cidade.</p>';
      return;
    }
    const cab = [...PRINCIPAIS, ...EXTRAS].map((c) => `<th scope="col" class="${NUMERO.has(c) ? "est-num" : ""}">${esc(ROT[c])}</th>`).join("");
    const abrir = EXTRAS.length && pars.get("abrir") === "1";
    const corpo = achadas.map((l, i) => `<tr${abrir ? ' class="aberta"' : ""}>${PRINCIPAIS.map((c) => celula(c, l, false)).join("")}${EXTRAS.map((c) => celula(c, l, true)).join("")}${
      EXTRAS.length ? `<td class="est-td-mais"><button type="button" class="bt bt-claro bt-mini" aria-expanded="${abrir}">${abrir ? "Esconder as outras colunas" : `Ver as outras ${EXTRAS.length} colunas`}</button></td>` : ""}</tr>`).join("");
    lista.innerHTML = `<div class="est-rolar" tabindex="0" role="region" aria-label="Tabela de estoque"><table class="us est"><thead><tr>${cab}</tr></thead><tbody>${corpo}</tbody></table></div>`;
  }
  // Celular, visão admin: o cartão mostra as 5 principais; o botão abre as outras 20.
  document.getElementById("est-lista").addEventListener("click", (e) => {
    const b = e.target.closest(".est-td-mais .bt");
    if (!b) return;
    const tr = b.closest("tr");
    const aberto = tr.classList.toggle("aberta");
    b.setAttribute("aria-expanded", String(aberto));
    b.textContent = aberto ? "Esconder as outras colunas" : `Ver as outras ${EXTRAS.length} colunas`;
  });
  busca.addEventListener("input", mostrar);
  sel.addEventListener("change", mostrar);
  mostrar();
})();
