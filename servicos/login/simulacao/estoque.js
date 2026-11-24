// T-0034 · SIMULAÇÃO da aba Estoque. Só mostra a tela; não é a implementação.
// ?visao=admin (22 colunas na tela; 4 no cartão fechado do celular e 18 no "+ Detalhes"), ?visao=vendedor (5 colunas) ou ?visao=cliente (404). ?q= preenche a busca, ?filial= a cidade
// e ?abrir=1 abre todos os cartões do admin no celular (para o print).
// Admin: as 25 colunas do xlsx viram 22 na tela: CIDADE e FILIAL_BAP juntas, e DATA e HORA só no cabeçalho ("Posição de …"; B5).
// Na versão final o corte das colunas é feito NO SERVIDOR: o vendedor nem recebe preço, custo ou markup.
// Aqui o corte imita o servidor logo ao carregar: na visão vendedor as outras colunas são apagadas da memória.
(function () {
  "use strict";
  const sim = window.SIM_ESTOQUE;
  const pars = new URLSearchParams(location.search);
  const visao = ["admin", "vendedor", "cliente"].includes(pars.get("visao")) ? pars.get("visao") : "admin";

  // Cliente (sem a permissão): o 404 de verdade, igual ao HTML_SIMPLES do server.mjs (MC-0030): página branca, sem a marca.
  if (visao === "cliente") {
    document.title = "Não encontrado.";
    document.querySelectorAll('link[rel="stylesheet"], link[rel="icon"]').forEach((l) => l.remove());
    document.body.removeAttribute("class");
    document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem">Não encontrado.</p>';
    return;
  }
  document.querySelectorAll(".sim-visoes a").forEach((a) => {
    if (a.dataset.visao === visao) a.setAttribute("aria-current", "page");
  });
  document.getElementById("menu-estoque").hidden = false;
  document.body.classList.add("est-" + visao);

  // As 5 colunas do vendedor (decisão 2a). "Cidade / filial" junta CIDADE e FILIAL_BAP.
  const VENDEDOR = ["CIDADE", "FILIAL_BAP", "COD_PRODUTO", "DESCRICAO_PRODUTO", "FORNECEDOR", "ESTOQUE"];
  const linhas = visao === "admin" ? sim.linhas
    : sim.linhas.map((l) => Object.fromEntries(VENDEDOR.map((c) => [c, l[c]])));
  // DATA e HORA da posição: só no cabeçalho, uma vez (na final, o servidor manda à parte).
  document.getElementById("est-data").textContent = sim.linhas[0].DATA;
  document.getElementById("est-hora").textContent = sim.linhas[0].HORA;

  // Nome de exibição das cidades (B8; "Mato Grosso": R-20261124-213943-alexandre). A busca acha os dois jeitos.
  const CIDADE = {
    "BELÉM": "Belém", "BOA VISTA": "Boa Vista", "MACAPÁ": "Macapá", "MANAUS": "Manaus",
    "MATOGROSSO": "Mato Grosso", "SANTARÉM": "Santarém", "SÃO LUIS": "São Luís",
  };
  const cidade = (c) => CIDADE[c] || c;

  const ROT = {
    COD_PRODUTO: "Código", DESCRICAO_PRODUTO: "Descrição", FORNECEDOR: "Fornecedor", CIDADE: "Cidade / filial", ESTOQUE: "Estoque",
    ID_PRODUTO: "ID do produto", COD_FORNECEDOR: "Cód. fornecedor", FILIAL_CD: "Filial CD",
    PPEDIDO: "Custo do produto", ORIGEM_CUSTO: "Origem do custo", TABELA_CAPITAL: "Tabela capital", PRECO_CAPITAL: "Preço capital",
    TABELA_INTERIOR: "Tabela interior", PRECO_INTERIOR: "Preço interior", MARKUP_CAPITAL: "Markup capital",
    MARKUP_INTERIOR: "Markup interior", CATEGORIA: "Categoria", SISTEMA: "Sistema", FAMILIA: "Família", LINHA: "Linha",
    SUCATA: "Sucata", CUSTO_TOTAL: "Custo total",
  };
  // Ordem do Alexandre (R-20261124-214135-alexandre; especificação do po em R-20261124-214137-po):
  // Filial, Código, Descrição, Estoque, Custo do produto, Custo total, Preço capital, Preço interior, Markup capital,
  // Markup interior e depois as demais. PRINCIPAIS = o que o cartão fechado mostra no celular; EXTRAS = o "+ Detalhes".
  // Admin: 4 + 18 = 22 colunas na tela. Vendedor: a mesma ordem, sem custo, preço e markup [SUPOSIÇÃO do po].
  const PRINCIPAIS = visao === "admin"
    ? ["CIDADE", "COD_PRODUTO", "DESCRICAO_PRODUTO", "ESTOQUE"]
    : ["CIDADE", "COD_PRODUTO", "DESCRICAO_PRODUTO", "FORNECEDOR", "ESTOQUE"];
  const EXTRAS = visao === "admin" ? [
    "PPEDIDO", "CUSTO_TOTAL", "PRECO_CAPITAL", "PRECO_INTERIOR", "MARKUP_CAPITAL", "MARKUP_INTERIOR",
    "FORNECEDOR", "TABELA_CAPITAL", "TABELA_INTERIOR", "SUCATA", "ORIGEM_CUSTO",
    "ID_PRODUTO", "COD_FORNECEDOR", "FILIAL_CD", "CATEGORIA", "SISTEMA", "FAMILIA", "LINHA",
  ] : [];
  // PPEDIDO é o custo do produto e CUSTO_TOTAL = custo do produto + sucata (R-20261124-213943-alexandre): os três em R$.
  const DINHEIRO = new Set(["PPEDIDO", "CUSTO_TOTAL", "SUCATA", "PRECO_CAPITAL", "PRECO_INTERIOR"]);
  const NUMERO = new Set(["ESTOQUE", "MARKUP_CAPITAL", "MARKUP_INTERIOR", ...DINHEIRO]);

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

  // Filtro de cidade / filial: as 7 da amostra, em ordem alfabética do nome de exibição.
  const sel = document.getElementById("est-filial");
  [...new Map(linhas.map((l) => [l.FILIAL_BAP, l])).values()]
    .sort((a, b) => cidade(a.CIDADE).localeCompare(cidade(b.CIDADE), "pt-BR"))
    .forEach((l) => sel.insertAdjacentHTML("beforeend", `<option value="${esc(l.FILIAL_BAP)}">${esc(`${cidade(l.CIDADE)} · ${l.FILIAL_BAP}`)}</option>`));

  // Busca: código BAP, código do fornecedor, descrição e cidade/filial (sem acento, sem maiúscula, todas as palavras).
  const indice = linhas.map((l) => norm([l.COD_PRODUTO, l.ID_PRODUTO, l.COD_FORNECEDOR, l.DESCRICAO_PRODUTO, l.FORNECEDOR,
    l.CIDADE, cidade(l.CIDADE), l.FILIAL_BAP].join(" ")));
  const busca = document.getElementById("est-busca");
  busca.value = pars.get("q") || "";
  if (pars.get("filial")) sel.value = pars.get("filial");

  function celula(c, l, extra) {
    const cls = [NUMERO.has(c) ? "est-num" : "", extra ? "est-extra" : ""].filter(Boolean).join(" ");
    let v;
    if (c === "COD_PRODUTO") v = `<b class="est-cod">${esc(l.COD_PRODUTO)}</b>`;
    else if (c === "CIDADE") v = `<span class="est-cid">${esc(cidade(l.CIDADE))}</span> <small>${esc(l.FILIAL_BAP)}</small>`;
    else if (c === "ESTOQUE") v = Number(l.ESTOQUE) === 0 ? '<span class="tag">Sem estoque</span>' : `<b>${esc(l.ESTOQUE)}</b>`;
    else v = valor(c, l[c]);
    return `<td class="${cls} est-c-${c.toLowerCase()}" data-rot="${esc(ROT[c])}">${v}</td>`;
  }
  const rotMais = (aberto) => (aberto ? "− Menos detalhes" : "+ Detalhes");

  function mostrar() {
    const termo = busca.value.trim();
    const termos = norm(termo).split(/\s+/).filter(Boolean);
    const fil = sel.value;
    const achadas = linhas.filter((l, i) => (!fil || l.FILIAL_BAP === fil) && termos.every((t) => indice[i].includes(t)));
    document.getElementById("est-total").textContent = `${achadas.length} de ${linhas.length}`;
    const lista = document.getElementById("est-lista");
    if (!achadas.length) {
      const onde = fil ? cidade(linhas.find((l) => l.FILIAL_BAP === fil).CIDADE) : "";
      const txt = termo ? `Nada encontrado para “${termo}”${onde ? ` em ${onde}` : ""}.` : `Nada encontrado em ${onde}.`;
      lista.innerHTML = `<p class="est-nada">${esc(txt)}</p>`;
      return;
    }
    const cab = [...PRINCIPAIS, ...EXTRAS].map((c) => `<th scope="col" class="${NUMERO.has(c) ? "est-num" : ""}">${esc(ROT[c])}</th>`).join("");
    const abrir = EXTRAS.length > 0 && pars.get("abrir") === "1";
    const corpo = achadas.map((l) => `<tr${abrir ? ' class="aberta"' : ""}>${PRINCIPAIS.map((c) => celula(c, l, false)).join("")}${EXTRAS.map((c) => celula(c, l, true)).join("")}${
      EXTRAS.length ? `<td class="est-td-mais"><button type="button" class="bt est-bt-mais" aria-expanded="${abrir}">${rotMais(abrir)}</button></td>` : ""}</tr>`).join("");
    lista.innerHTML = `<div class="est-rolar" tabindex="0" role="region" aria-label="Tabela de estoque"><table class="us est"><thead><tr>${cab}</tr></thead><tbody>${corpo}</tbody></table></div>`;
  }
  // Celular, visão admin: o cartão mostra as 5 principais; o "+ Detalhes" abre as outras 18, começando pelos custos.
  document.getElementById("est-lista").addEventListener("click", (e) => {
    const b = e.target.closest(".est-bt-mais");
    if (!b) return;
    const aberto = b.closest("tr").classList.toggle("aberta");
    b.setAttribute("aria-expanded", String(aberto));
    b.textContent = rotMais(aberto);
  });
  busca.addEventListener("input", mostrar);
  sel.addEventListener("change", mostrar);
  mostrar();
})();
