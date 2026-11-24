// T-0034 · prints e conferências da SIMULAÇÃO da aba Estoque (dono: testes).
// Uso: python3 -m http.server 8000 -d <raiz do repositório>  e depois  node testes/t0034_simulacao_estoque.mjs
// Sai com código 1 se alguma conferência falha.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, "prints", "T-0034");
const BASE = process.env.BASE_URL || "http://localhost:8000/servicos/login/simulacao/estoque.html";
mkdirSync(SAIDA, { recursive: true });

const TAMANHOS = { 1366: { width: 1366, height: 768 }, 390: { width: 390, height: 844 } };
const PROIBIDAS = ["preco", "custo", "markup", "tabela", "ppedido", "pedido pend", "pendente", "sucata", "origem", "r$", "detalhes"];
// Ordem do Alexandre (passo 6): as 10 primeiras exatas; depois "o resto" (as 12 demais, em qualquer ordem, sem faltar nenhuma).
const ADMIN_10 = ["Cidade / filial", "Código", "Descrição", "Estoque", "Custo do produto", "Custo total", "Preço capital", "Preço interior", "Markup capital", "Markup interior"];
const ADMIN_RESTO = ["Fornecedor", "Tabela capital", "Tabela interior", "Sucata", "Origem do custo", "ID do produto", "Cód. fornecedor", "Filial CD", "Categoria", "Sistema", "Família", "Linha"];
const VENDEDOR_COLS = ["Cidade / filial", "Código", "Descrição", "Fornecedor", "Estoque"];
const CARTAO_FECHADO = ["est-c-cidade", "est-c-cod_produto", "est-c-estoque", "est-c-descricao_produto"];
const resultados = [];
const ok = (item, passou, detalhe = "") => { resultados.push({ item, passou, detalhe }); };
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const browser = await chromium.launch();
async function abrir(params, larg) {
  const ctx = await browser.newContext({ viewport: TAMANHOS[larg], deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const erros = [];
  page.on("pageerror", (e) => erros.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  await page.goto(`${BASE}?${params}`, { waitUntil: "networkidle" }).catch(() => page.goto(`${BASE}?${params}`, { waitUntil: "load" }));
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return { ctx, page, erros };
}

const casos = [
  ["admin", "visao=admin"], ["vendedor", "visao=vendedor"], ["cliente", "visao=cliente"],
];
for (const larg of [1366, 390]) {
  for (const [nome, params] of casos) {
    const { ctx, page, erros } = await abrir(params, larg);
    const arq = `${nome}-${larg}.png`;
    await page.screenshot({ path: join(SAIDA, arq), fullPage: true });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (larg === 390) ok(`sem rolagem lateral ${nome} 390`, sw <= 390, `scrollWidth=${sw}`);
    const erroReal = erros.filter((e) => !/fonts\.(googleapis|gstatic)/.test(e));
    ok(`console sem erro ${nome} ${larg}`, erroReal.length === 0, erroReal.join(" | "));
    // Sem selo fixo (passo 4): nenhum elemento visível com position fixed. A faixa do topo continua (admin e vendedor).
    const selo = await page.evaluate(() => {
      const vis = (e) => !!e && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden" && e.getBoundingClientRect().width > 0;
      const fixos = [...document.querySelectorAll("body *")].filter((e) => getComputedStyle(e).position === "fixed" && vis(e)).map((e) => e.className || e.tagName);
      const f = document.querySelector(".sim-faixa b");
      return { fixos, faixa: vis(f) ? f.textContent.trim() : null, selo: !!document.querySelector(".sim-selo") };
    });
    ok(`sem selo fixo ${nome} ${larg}`, selo.fixos.length === 0 && !selo.selo, JSON.stringify(selo));
    if (nome !== "cliente") ok(`faixa "SIMULAÇÃO · valores fictícios" ${nome} ${larg}`, selo.faixa === "SIMULAÇÃO · valores fictícios", String(selo.faixa));

    if (nome === "vendedor") {
      // Todo o texto visível da página (o rótulo "Vendedor: sem preço…" saiu no passo 4: agora não há exceção).
      const txt = semAcento(await page.evaluate(() => document.body.innerText));
      const achou = PROIBIDAS.filter((p) => txt.includes(p));
      ok(`vendedor sem preço/custo/markup/tabela/pedido pendente/sucata/origem/detalhes (texto visível) ${larg}`, achou.length === 0, achou.join(", ") || "0 achados");
      const nota = await page.$eval(".est-sim-nota", (e) => e.innerText.trim());
      ok(`vendedor nota "os números de estoque são fictícios" ${larg}`, /os números de estoque são fictícios\.$/.test(nota), nota);
      const pos = await page.$eval(".pg-cab-in", (e) => e.innerText.trim().split("\n").pop());
      ok(`cabeçalho só com "Posição de … às …" ${larg}`, /^Posição de \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(pos), pos);
      const cab = await page.$$eval("table.est thead th", (ths) => ths.map((t) => t.textContent.trim()));
      ok(`vendedor cabeçalho ${larg}`, JSON.stringify(cab) === JSON.stringify(VENDEDOR_COLS), cab.join(" | "));
      const extras = await page.$$eval("td.est-extra, .est-td-mais, .est-bt-mais", (e) => e.length);
      ok(`vendedor sem colunas extras no DOM ${larg}`, extras === 0, `extras=${extras}`);
      // HTML da tabela sem o aria-label "Tabela de estoque" (é o nome da região, não uma coluna).
      const html = semAcento(await page.$eval("#est-lista table", (e) => e.outerHTML));
      const noHtml = ["preco", "custo", "markup", "tabela", "ppedido", "pendente", "sucata", "origem", "r$"].filter((p) => html.includes(p));
      ok(`vendedor sem termos proibidos no HTML da tabela ${larg}`, noHtml.length === 0, noHtml.join(", ") || "0 achados");
    }
    if (nome === "admin") {
      // 25 campos do xlsx em 22 colunas: CIDADE e FILIAL_BAP juntas; DATA e HORA só no cabeçalho. 18 no "+ Detalhes".
      const r = await page.evaluate(() => {
        const tr = document.querySelector("table.est tbody tr");
        return {
          th: [...document.querySelectorAll("table.est thead th")].map((t) => t.textContent.trim()),
          extras: tr.querySelectorAll("td.est-extra").length,
          bt: [...document.querySelectorAll(".est-bt-mais")].map((b) => b.textContent.trim()),
          linhas: document.querySelectorAll("table.est tbody tr").length,
          filial: tr.querySelector("td.est-c-cidade small")?.textContent || "",
          cidade: tr.querySelector("td.est-c-cidade .est-cid")?.textContent || "",
          pos: document.querySelector(".est-posicao").innerText.trim(),
          custo: tr.querySelector("td.est-c-ppedido")?.textContent.trim() || "",
          total: tr.querySelector("td.est-c-custo_total")?.textContent.trim() || "",
          extrasRot: [...tr.querySelectorAll("td.est-extra")].map((t) => t.dataset.rot),
        };
      });
      const resto = r.th.slice(10);
      ok(`admin ordem exata das 10 primeiras colunas ${larg}`, JSON.stringify(r.th.slice(0, 10)) === JSON.stringify(ADMIN_10), r.th.slice(0, 10).join(" | "));
      ok(`admin as 12 demais colunas depois ${larg}`, resto.length === 12 && [...resto].sort().join("|") === [...ADMIN_RESTO].sort().join("|"), resto.join(" | "));
      ok(`admin "+ Detalhes" = colunas 5 a 22, na mesma ordem ${larg}`, JSON.stringify(r.extrasRot) === JSON.stringify(r.th.slice(4)), r.extrasRot.join(" | "));
      ok(`admin custo do produto e custo total em R$ ${larg}`, /^R\$\s?\d/.test(r.custo) && /^R\$\s?\d/.test(r.total), `${r.custo}; ${r.total}`);
      ok(`admin 22 colunas, sem Data/Hora ${larg}`, r.th.length === 22 && !r.th.includes("Data") && !r.th.includes("Hora"), `th=${r.th.length}`);
      ok(`admin 18 colunas no "+ Detalhes" ${larg}`, r.extras === 18 && r.bt.length === r.linhas && r.bt.every((b) => b === "+ Detalhes"), `extras=${r.extras}; botões=${r.bt.length}/${r.linhas} "${r.bt[0]}"`);
      ok(`admin cidade sem caixa alta e filial ${larg}`, r.cidade !== r.cidade.toUpperCase() && /^\d{8}$/.test(r.filial), `${r.cidade} ${r.filial}`);
      ok(`admin cabeçalho "Posição de … às …" ${larg}`, /^Posição de \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/.test(r.pos), r.pos);
    }
    if (nome === "cliente") {
      // 404 real: página branca, só "Não encontrado.", sem tabela, sem menu e sem o CSS do site.
      const r = await page.evaluate(() => ({
        texto: document.body.innerText.trim(),
        titulo: document.title,
        tabela: !!document.querySelector("table"),
        menu: [...document.querySelectorAll("nav a")].map((a) => a.textContent.trim()),
        css: document.querySelectorAll('link[rel="stylesheet"]').length,
        fundo: getComputedStyle(document.body).backgroundColor,
      }));
      ok(`cliente mostra só "Não encontrado." ${larg}`, r.texto === "Não encontrado." && r.titulo === "Não encontrado." && !r.tabela && r.css === 0, JSON.stringify(r));
      ok(`cliente sem "Estoque" no menu ${larg}`, !r.menu.includes("Estoque") && !/estoque/i.test(r.texto), r.menu.join(" | ") || "sem menu");
    }
    await ctx.close();
  }
}

// admin 390 com os cartões abertos
{
  const { ctx, page } = await abrir("visao=admin&abrir=1", 390);
  await page.screenshot({ path: join(SAIDA, "admin-390-abrir.png"), fullPage: true });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  ok("sem rolagem lateral admin 390 &abrir=1", sw <= 390, `scrollWidth=${sw}`);
  const ab = await page.evaluate(() => {
    const trs = [...document.querySelectorAll("tbody tr")];
    const vis = (e) => getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0;
    return { n: trs.length, abertas: trs.filter((t) => t.classList.contains("aberta")).length,
      extrasVis: trs.map((t) => [...t.querySelectorAll("td.est-extra")].filter(vis).length),
      bt: [...new Set([...document.querySelectorAll(".est-bt-mais")].map((b) => b.textContent.trim() + "/" + b.getAttribute("aria-expanded")))] };
  });
  ok("admin 390 &abrir=1 abre todos os cartões (18 detalhes visíveis em cada)", ab.n > 0 && ab.n === ab.abertas && ab.extrasVis.every((x) => x === 18) && ab.bt.length === 1 && ab.bt[0] === "− Menos detalhes/true", `${ab.abertas} de ${ab.n}; ${ab.bt.join(", ")}`);
  // fechado (sem &abrir): nenhum detalhe visível no celular; o clique em "+ Detalhes" abre só aquele cartão
  const p2 = await ctx.newPage();
  await p2.goto(`${BASE}?visao=admin`, { waitUntil: "load" });
  const antes = await p2.$$eval("td.est-extra", (t) => t.filter((e) => getComputedStyle(e).display !== "none").length);
  // cartão fechado: filial, código, estoque e descrição (nessa ordem na tela: filial no alto, código e estoque lado a lado, depois a descrição)
  const fechado = await p2.evaluate(() => {
    const tr = document.querySelector("tbody tr");
    const tds = [...tr.querySelectorAll("td")].filter((e) => !e.classList.contains("est-td-mais") && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0);
    return tds.map((e) => ({ c: [...e.classList].find((k) => k.startsWith("est-c-")), y: Math.round(e.getBoundingClientRect().top), x: Math.round(e.getBoundingClientRect().left) }))
      .sort((a, b) => a.y - b.y || a.x - b.x).map((e) => e.c);
  });
  ok("admin 390 cartão fechado: filial, código, estoque e descrição", JSON.stringify(fechado) === JSON.stringify(CARTAO_FECHADO), fechado.join(" | "));
  await p2.click("tbody tr:first-child .est-bt-mais");
  const depois = await p2.evaluate(() => ({ vis: [...document.querySelectorAll("td.est-extra")].filter((e) => getComputedStyle(e).display !== "none").length,
    bt: document.querySelector("tbody tr:first-child .est-bt-mais").textContent.trim() }));
  ok("admin 390 \"+ Detalhes\" abre só o cartão clicado", antes === 0 && depois.vis === 18 && depois.bt === "− Menos detalhes", `antes=${antes}; depois=${depois.vis}; ${depois.bt}`);
  await ctx.close();
}

// vendedor com &q=manaus (busca) e conferência do filtro
for (const larg of [1366, 390]) {
  const { ctx, page } = await abrir("visao=vendedor&q=manaus", larg);
  await page.screenshot({ path: join(SAIDA, `vendedor-q-manaus-${larg}.png`), fullPage: true });
  const r = await page.evaluate(() => ({
    total: document.getElementById("est-total").textContent,
    cidades: [...document.querySelectorAll("tbody td.est-c-cidade")].map((t) => t.textContent.trim()),
    sw: document.documentElement.scrollWidth,
  }));
  const [n, de] = r.total.split(" de ").map((s) => parseInt(s, 10));
  ok(`busca "manaus" filtra ${larg}`, /^\d+ de \d+$/.test(r.total) && n > 0 && n < de && r.cidades.length === n && r.cidades.every((c) => /manaus/i.test(c)), `${r.total}; ${[...new Set(r.cidades)].join(" | ")}`);
  if (larg === 390) ok("sem rolagem lateral vendedor &q=manaus 390", r.sw <= 390, `scrollWidth=${r.sw}`);
  await ctx.close();
}

// "mato grosso" e "matogrosso" acham as linhas da filial de Mato Grosso (nas duas visões)
for (const v of ["vendedor", "admin"]) {
  const { ctx, page } = await abrir(`visao=${v}`, 1366);
  const res = {};
  for (const q of ["mato grosso", "matogrosso", "Mato Grosso", "MATOGROSSO"]) {
    await page.fill("#est-busca", q);
    res[q] = await page.evaluate(() => ({ total: document.getElementById("est-total").textContent,
      cid: [...new Set([...document.querySelectorAll("tbody td.est-c-cidade")].map((t) => t.textContent.trim()))] }));
  }
  const ok1 = Object.values(res).every((x) => /^[1-9]\d* de 21$/.test(x.total) && x.cid.length === 1 && /^Mato Grosso \d{8}$/.test(x.cid[0]));
  const iguais = new Set(Object.values(res).map((x) => x.total)).size === 1;
  ok(`busca "mato grosso" e "matogrosso" acham as linhas (${v})`, ok1 && iguais, Object.entries(res).map(([q, x]) => `${q}: ${x.total} ${x.cid.join(",")}`).join("; "));
  await ctx.close();
}

// busca vazia: vendedor &q=zzzqqq em 390
{
  const { ctx, page } = await abrir("visao=vendedor&q=zzzqqq", 390);
  await page.screenshot({ path: join(SAIDA, "vendedor-q-zzzqqq-390.png"), fullPage: true });
  const r = await page.evaluate(() => ({ nada: document.getElementById("est-lista").innerText.trim(), tabela: !!document.querySelector("table"), sw: document.documentElement.scrollWidth }));
  ok("busca vazia 390 (&q=zzzqqq)", r.nada === "Nada encontrado para “zzzqqq”." && !r.tabela, r.nada);
  ok("sem rolagem lateral vendedor &q=zzzqqq 390", r.sw <= 390, `scrollWidth=${r.sw}`);
  await ctx.close();
}

// busca digitada (sem parâmetro) e busca sem resultado
{
  const { ctx, page } = await abrir("visao=vendedor", 1366);
  const t0 = await page.textContent("#est-total");
  ok("contagem sem filtro \"21 de 21\"", t0 === "21 de 21", t0);
  await page.fill("#est-busca", "bateria");
  const t1 = await page.textContent("#est-total");
  const descr = await page.$$eval("tbody td.est-c-descricao_produto", (t) => t.map((x) => x.textContent));
  const [b1, b2] = t1.split(" de ").map((s) => parseInt(s, 10));
  ok("busca digitada \"bateria\" filtra", b1 > 0 && b1 < b2 && descr.length === b1 && descr.every((d) => /bateria/i.test(d)), `${t1}; ${descr.join(" | ")}`);
  await page.fill("#est-busca", "zzzqqq");
  const nada = (await page.textContent("#est-lista")).trim();
  ok("busca sem resultado: Nada encontrado para “zzzqqq”.", nada === "Nada encontrado para “zzzqqq”." && (await page.textContent("#est-total")) === "0 de 21", nada);
  await page.fill("#est-busca", "");
  await page.selectOption("#est-filial", "40101002");
  const t2 = await page.textContent("#est-total");
  const cid = await page.$$eval("tbody td.est-c-cidade", (t) => [...new Set(t.map((x) => x.textContent.trim()))]);
  ok("filtro de filial 40101002 filtra", parseInt(t2, 10) > 0 && cid.length === 1 && cid[0].includes("40101002"), `${t2}; ${cid.join(" | ")}`);
  await ctx.close();
}

await browser.close();
let falhas = 0;
for (const r of resultados) {
  if (!r.passou) falhas++;
  console.log(`${r.passou ? "PASSOU" : "FALHOU"}  ${r.item}${r.detalhe ? "  (" + r.detalhe + ")" : ""}`);
}
console.log(`\n${resultados.length - falhas} de ${resultados.length} conferências passaram. Prints em ${SAIDA}`);
process.exit(falhas ? 1 : 0);
