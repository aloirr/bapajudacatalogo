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
const PROIBIDAS = ["preco", "custo", "markup", "tabela", "ppedido", "pedido pend", "sucata", "origem", "r$"];
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
    const selo = await page.evaluate(() => {
      const el = document.querySelector(".sim-selo"); const f = document.querySelector(".sim-faixa b");
      const vis = (e) => !!e && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden" && e.getBoundingClientRect().width > 0;
      return { selo: vis(el) && el.textContent.trim(), faixa: vis(f) && f.textContent.trim() };
    });
    ok(`selo SIMULAÇÃO ${nome} ${larg}`, selo.selo === "SIMULAÇÃO · valores fictícios" && selo.faixa === "SIMULAÇÃO · valores fictícios", JSON.stringify(selo));

    if (nome === "vendedor") {
      // O rótulo explicativo "Vendedor: sem preço, custo e markup" (#est-quem) cita as palavras de propósito: fica de fora,
      // mas é conferido à parte. Todo o resto do texto visível não pode ter nenhuma delas.
      const quem = await page.$eval("#est-quem", (e) => e.innerText.trim());
      ok(`vendedor rótulo do cabeçalho ${larg}`, quem === "Vendedor: sem preço, custo e markup", quem);
      const txt = semAcento(await page.evaluate(() => { const q = document.getElementById("est-quem"); const v = q.textContent; q.textContent = ""; const t = document.body.innerText; q.textContent = v; return t; }));
      const achou = PROIBIDAS.filter((p) => txt.includes(p));
      ok(`vendedor sem preço/custo/markup/tabela/PPEDIDO/sucata/origem (texto visível, fora o rótulo) ${larg}`, achou.length === 0, achou.join(", ") || "0 achados");
      const cab = await page.$$eval("table.est thead th", (ths) => ths.map((t) => t.textContent.trim()));
      ok(`vendedor cabeçalho ${larg}`, JSON.stringify(cab) === JSON.stringify(["Código", "Descrição", "Fornecedor", "Cidade / filial", "Estoque"]), cab.join(" | "));
      const extras = await page.$$eval("td.est-extra, .est-td-mais", (e) => e.length);
      ok(`vendedor sem colunas extras no DOM ${larg}`, extras === 0, `extras=${extras}`);
      // HTML da tabela sem o aria-label "Tabela de estoque" (é o nome da região, não uma coluna).
      const html = semAcento(await page.$eval("#est-lista table", (e) => e.outerHTML));
      const noHtml = ["preco", "custo", "markup", "tabela", "ppedido", "sucata", "origem"].filter((p) => html.includes(p));
      ok(`vendedor sem termos proibidos no HTML da tabela ${larg}`, noHtml.length === 0, noHtml.join(", ") || "0 achados");
    }
    if (nome === "admin") {
      // 25 campos do xlsx em 24 colunas: CIDADE e FILIAL_BAP dividem a coluna "Cidade / filial".
      const r = await page.evaluate(() => ({
        th: document.querySelectorAll("table.est thead th").length,
        tds: [...document.querySelectorAll("table.est tbody tr:first-child td")].map((t) => t.className),
        filial: document.querySelector("table.est tbody td.est-c-cidade small")?.textContent || "",
      }));
      ok(`admin mostra os 25 campos (24 colunas, cidade+filial juntas) ${larg}`, r.th === 24 && /^\d{8}$/.test(r.filial), `th=${r.th}; filial=${r.filial}`);
    }
    if (nome === "cliente") {
      const r = await page.evaluate(() => {
        const vis = (e) => !!e && !e.closest("[hidden]") && e.getBoundingClientRect().width > 0;
        return {
          t404: vis(document.querySelector("#sem-acesso")) && document.querySelector("#sem-acesso .est-404").textContent.trim(),
          menu: [...document.querySelectorAll("nav.menu a")].filter(vis).map((a) => a.textContent.trim()),
          tabela: !!document.querySelector("table.est"),
          comAcesso: vis(document.querySelector("#com-acesso")),
        };
      });
      ok(`cliente mostra 404 ${larg}`, r.t404 === "404 Não encontrado." && !r.tabela && !r.comAcesso, JSON.stringify(r));
      ok(`cliente sem "Estoque" no menu ${larg}`, !r.menu.includes("Estoque"), r.menu.join(" | "));
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
  const ab = await page.$$eval("tbody tr", (trs) => [trs.length, trs.filter((t) => t.classList.contains("aberta")).length]);
  ok("admin 390 &abrir=1 abre todos os cartões", ab[0] > 0 && ab[0] === ab[1], `${ab[1]} de ${ab[0]}`);
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
  ok(`busca "manaus" filtra ${larg}`, n > 0 && n < de && r.cidades.length === n && r.cidades.every((c) => /manaus/i.test(c)), `${r.total}; ${[...new Set(r.cidades)].join(" | ")}`);
  if (larg === 390) ok("sem rolagem lateral vendedor &q=manaus 390", r.sw <= 390, `scrollWidth=${r.sw}`);
  await ctx.close();
}

// busca digitada (sem parâmetro) e busca sem resultado
{
  const { ctx, page } = await abrir("visao=vendedor", 1366);
  await page.fill("#est-busca", "bateria");
  const t1 = await page.textContent("#est-total");
  const descr = await page.$$eval("tbody td.est-c-descricao_produto", (t) => t.map((x) => x.textContent));
  const [b1, b2] = t1.split(" de ").map((s) => parseInt(s, 10));
  ok("busca digitada \"bateria\" filtra", b1 > 0 && b1 < b2 && descr.length === b1 && descr.every((d) => /bateria/i.test(d)), `${t1}; ${descr.join(" | ")}`);
  await page.fill("#est-busca", "zzzqqq");
  const nada = await page.textContent("#est-lista");
  ok("busca sem resultado mostra \"Nada encontrado\"", /Nada encontrado/.test(nada), nada.trim());
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
