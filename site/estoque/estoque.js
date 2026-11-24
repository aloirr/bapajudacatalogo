/* T-0034 · aba Estoque. A página não traz dado nenhum: tudo vem de GET /api/estoque (serviço de login), que confere
   o usuário e já corta as colunas (o vendedor nem recebe as de valor). Aqui não há lista de colunas: a tela desenha as
   que chegarem, na ordem em que chegarem, e formata pelo "tipo" (texto, numero, dinheiro ou markup).
   Resposta: { posicao:{data,hora}, colunas:[{campo,rotulo,tipo}], total, desde, limite, linhas:[{campo:valor}],
   filiais:[{numero,nome}] }. 50 linhas por vez, com o "Mostrar mais N" (N: o que falta, até 50).
   Celular: o cartão fechado mostra as colunas até a do estoque; as que vêm depois dela ficam no "+ Detalhes". */
(function () {
  "use strict";
  const { esc, api } = window.BAP; // o api leva o 401 ao login
  const F = window.BAPForm;
  const $ = (s) => document.querySelector(s);
  const LIMITE = 50;
  const ESPERA = 300; // ms entre a última tecla e a busca

  const busca = $("#est-busca"), sel = $("#est-filial"), com = $("#est-com");
  const lista = $("#est-lista"), total = $("#est-total"), mais = $("#est-mais"), maisBt = $("#est-mais-bt");

  const inteiro = new Intl.NumberFormat("pt-BR");
  const real = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dec = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
  const classe = (campo) => "est-c-" + String(campo).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const ehEstoque = (c) => String(c.campo).toLowerCase() === "estoque";

  let COLS = [], PRINC = [], EXTRAS = [], mostradas = 0, totalAtual = 0, pedido = 0;

  function valor(c, v) {
    if (v === "" || v == null) return '<span class="est-vazio">—</span>';
    const n = num(v);
    if (ehEstoque(c)) return n === 0 ? '<span class="tag">Sem estoque</span>' : `<b>${esc(Number.isFinite(n) ? inteiro.format(n) : v)}</b>`;
    if (!Number.isFinite(n)) return esc(v);
    if (c.tipo === "dinheiro") return esc(real.format(n));
    if (c.tipo === "markup") return esc(dec.format(n));
    if (c.tipo === "numero") return esc(inteiro.format(n));
    return esc(v);
  }
  function celula(c, l, extra) {
    const cls = [c.tipo && c.tipo !== "texto" ? "est-num" : "", extra ? "est-extra" : "", classe(c.campo)].filter(Boolean).join(" ");
    const v = String(c.campo).toLowerCase() === "cod_produto" && l[c.campo] != null && l[c.campo] !== ""
      ? `<b class="est-cod">${esc(l[c.campo])}</b>` : valor(c, l[c.campo]);
    return `<td class="${cls}" data-rot="${esc(c.rotulo)}">${v}</td>`;
  }
  const rotMais = (aberto) => (aberto ? "− Menos detalhes" : "+ Detalhes");
  const linhaHtml = (l) => `<tr>${PRINC.map((c) => celula(c, l, false)).join("")}${EXTRAS.map((c) => celula(c, l, true)).join("")}${
    EXTRAS.length ? '<td class="est-td-mais"><button type="button" class="bt est-bt-mais" aria-expanded="false">${rotMais(false)}</button></td>' : ""}</tr>`;

  function colunas(cols) {
    COLS = Array.isArray(cols) ? cols.filter((c) => c && c.campo) : [];
    const i = COLS.findIndex(ehEstoque);
    PRINC = i < 0 ? COLS : COLS.slice(0, i + 1);
    EXTRAS = i < 0 ? [] : COLS.slice(i + 1);
    document.body.classList.toggle("est-larga", COLS.length > 8);
  }
  function filiais(fs) {
    if (sel.options.length > 1 || !Array.isArray(fs)) return; // monta uma vez; a escolha fica
    fs.forEach((f) => sel.insertAdjacentHTML("beforeend", `<option value="${esc(f.numero)}" data-nome="${esc(f.nome || f.numero)}">${esc(f.nome ? `${f.nome} · ${f.numero}` : f.numero)}</option>`));
  }
  function posicao(p) {
    if (!p || !p.data) return;
    $("#est-data").textContent = p.data;
    $("#est-hora").textContent = p.hora || "";
    $("#est-posicao").hidden = false;
  }
  function contagem() {
    total.textContent = totalAtual ? `${inteiro.format(mostradas)} de ${inteiro.format(totalAtual)}` : "";
    mais.hidden = mostradas >= totalAtual;
    maisBt.textContent = `Mostrar mais ${Math.min(LIMITE, Math.max(0, totalAtual - mostradas))}`;
  }
  function vazio() {
    const termo = busca.value.trim();
    const onde = sel.value ? sel.options[sel.selectedIndex].dataset.nome : "";
    const txt = termo ? `Nada encontrado para “${termo}”${onde ? ` em ${onde}` : ""}.` : onde ? `Nada encontrado em ${onde}.` : "Nada encontrado.";
    lista.innerHTML = `<p class="est-nada">${esc(txt)}</p>`;
  }
  function erro(r) {
    total.textContent = "";
    mais.hidden = true;
    const msg = F.erroDe(r, "Não foi possível carregar o estoque."); // 404 e 503: o texto do servidor
    lista.innerHTML = '<div class="est-erro"><div></div><button type="button" class="bt" id="est-tentar">Tentar de novo</button></div>';
    F.caixa(lista.querySelector(".est-erro > div"), "erro", F.frase(msg));
    lista.querySelector("#est-tentar").addEventListener("click", () => carregar(false));
  }

  // pede uma página; "continuar" acrescenta à lista (Mostrar mais). Uma resposta velha (busca já mudou) é jogada fora.
  async function carregar(continuar) {
    const n = ++pedido;
    const p = new URLSearchParams({ q: busca.value.trim(), filial: sel.value, desde: String(continuar ? mostradas : 0), limite: String(LIMITE) });
    if (com.checked) p.set("com_estoque", "1");
    if (continuar) { maisBt.disabled = true; maisBt.textContent = "Carregando…"; }
    else lista.innerHTML = '<div class="carregando est-lista-carregando">Carregando o estoque…</div>';
    const r = await api("GET", "/api/estoque?" + p.toString());
    if (n !== pedido) return;
    maisBt.disabled = false; // o texto volta na contagem()
    const d = r.dados;
    if (r.status !== 200 || !d || !Array.isArray(d.linhas)) { erro(r); return; }
    posicao(d.posicao);
    filiais(d.filiais);
    totalAtual = Number(d.total) || 0;
    const corpo = continuar && lista.querySelector("table.est tbody");
    if (corpo) {
      corpo.insertAdjacentHTML("beforeend", d.linhas.map(linhaHtml).join(""));
      mostradas += d.linhas.length;
    } else {
      colunas(d.colunas);
      mostradas = d.linhas.length;
      if (!mostradas) { vazio(); contagem(); return; }
      const cab = COLS.map((c) => `<th scope="col"${c.tipo && c.tipo !== "texto" ? ' class="est-num"' : ""}>${esc(c.rotulo)}</th>`).join("");
      lista.innerHTML = `<div class="est-rolar" tabindex="0" role="region" aria-label="Tabela de estoque"><table class="us est">
        <caption class="vh">Estoque</caption><thead><tr>${cab}</tr></thead><tbody>${d.linhas.map(linhaHtml).join("")}</tbody></table></div>`;
    }
    if (!d.linhas.length) totalAtual = mostradas; // o servidor não tem mais: o botão some
    contagem();
  }

  // celular, com colunas depois do estoque: o "+ Detalhes" abre as outras dentro do cartão
  lista.addEventListener("click", (e) => {
    const b = e.target.closest(".est-bt-mais");
    if (!b) return;
    const aberto = b.closest("tr").classList.toggle("aberta");
    b.setAttribute("aria-expanded", String(aberto));
    b.textContent = rotMais(aberto);
  });
  let espera = null;
  busca.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(() => carregar(false), ESPERA); });
  sel.addEventListener("change", () => { clearTimeout(espera); carregar(false); });
  com.addEventListener("change", () => { clearTimeout(espera); carregar(false); });
  maisBt.addEventListener("click", () => carregar(true));
  carregar(false);
})();
