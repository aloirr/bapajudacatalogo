/* Testes da aba Estoque, versão final (T-0034, 24/11/2026). Dono: agente testes.
   DEPENDE do servicos/login/xlsx-ficticio.mjs (integracao-placas/T-0034-estoque): este script só roda depois do merge
   do branch do integracao-placas (o merge sai nessa ordem).
   Uso (da raiz do repositório, com o servidor e a tela da T-0034 juntos):
     node testes/estoque-t0034.mjs [--prints testes/prints/T-0034-final]
   Saída: 0 se tudo passou, 1 se algo falhou.

   O que faz:
     - monta, com o xlsxFicticio do servicos/login/xlsx-ficticio.mjs, um ESTOQUE_BAP.xlsx SINTÉTICO (120 linhas, 6 filiais, estoque 0 e vazio em algumas; custo, preço, markup,
       tabela, sucata e origem FICTÍCIOS) e serve em 127.0.0.1 (também um /quebrado.xlsx para o 503);
     - sobe o serviço de login de verdade (criarServico do servicos/login/server.mjs, com o site/ real) numa porta livre,
       com PASTA_DADOS temporária e senhas falsas geradas aqui a cada rodada (nunca impressas, nunca gravadas);
     - cria admin, vendedor (estoque: true) e cliente (sem a permissão) e confere no Chromium o que é da tela: menus
       e página 404 do cliente, colunas e texto visível do vendedor, 23 colunas do admin, busca, filtro, caixa,
       "Mostrar mais N", vazio, a mensagem do 503 e do outro erro, a caixa "Pode ver o estoque" da Criar usuários,
       390 px sem rolar de lado e o console. As regras da API (404, lista branca do JSON, 503 e log do estoque) são
       dos testes do serviço (servicos/login/login.test.mjs);
     - prints com deviceScaleFactor 2, em 1366 × 768 e 390 × 844 (página inteira; menu aberto, cartão aberto e janela
       só na área visível).
   Nada aqui é dado da BAP. Nenhuma rede de fora: as fontes do Google e o serviço de placas são respondidos no teste. */

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { xlsxFicticio } from "../servicos/login/xlsx-ficticio.mjs";
import { entrarUI } from "./login.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n, p) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : p; };
const PRINTS = path.resolve(RAIZ, arg("--prints", "testes/prints/T-0034-final"));
fs.mkdirSync(PRINTS, { recursive: true });

const falsa = (rot) => `${rot}-falsa-de-teste-${crypto.randomBytes(6).toString("hex")}`;
const resultados = [];
const res = (nome, ok, det) => { resultados.push({ nome, ok, det }); };
const sem = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ---------- xlsx sintético ----------
const CAB = ["DATA", "HORA", "CIDADE", "FILIAL_BAP", "ID_PRODUTO", "COD_FORNECEDOR", "FORNECEDOR", "COD_PRODUTO",
  "DESCRICAO_PRODUTO", "ESTOQUE", "FILIAL_CD", "PPEDIDO", "ORIGEM_CUSTO", "TABELA_CAPITAL", "PRECO_CAPITAL", "TABELA_INTERIOR",
  "PRECO_INTERIOR", "MARKUP_CAPITAL", "MARKUP_INTERIOR", "CATEGORIA", "SISTEMA", "FAMILIA", "LINHA", "SUCATA", "CUSTO_TOTAL"];
const FILIAIS = [["MANAUS", "90000002"], ["MATOGROSSO", "90000001"], ["BELÉM", "90000005"], ["SÃO LUIS", "90000006"], ["BOA VISTA", "90000003"], ["SANTARÉM", "90000004"]];
const PECAS = ["AMORTECEDOR DIANTEIRO TESTE", "PASTILHA DE FREIO TESTE", "ROLAMENTO DE RODA TESTE", "BIELETA TESTE", "TERMINAL DE DIREÇÃO TESTE"];
const N = 120;
const SERIE_DATA = Date.UTC(2026, 10, 24) / 86400000 + 25569;
const SERIE_HORA = (9 * 60 + 30) / 1440;
function linha(i) {
  const [cidade, filial] = FILIAIS[i % FILIAIS.length];
  const n = String(i).padStart(4, "0");
  return {
    DATA: SERIE_DATA, HORA: SERIE_HORA, CIDADE: cidade, FILIAL_BAP: filial, ID_PRODUTO: `ID-TESTE-${n}`, COD_FORNECEDOR: `CFT${n}`,
    FORNECEDOR: i % 2 ? "FORNECEDOR TESTE ALFA" : "FORNECEDOR TESTE BETA", COD_PRODUTO: `ZZT${n}`,
    DESCRICAO_PRODUTO: `${PECAS[i % PECAS.length]} ${n}`,
    ESTOQUE: i % 11 === 0 ? null : i % 4 === 0 ? 0 : (i * 7) % 90 + 1, FILIAL_CD: String(i % 3),
    PPEDIDO: 11 + i / 10, ORIGEM_CUSTO: "ORIGEM TESTE", TABELA_CAPITAL: "TAB TESTE C", PRECO_CAPITAL: 22 + i / 10,
    TABELA_INTERIOR: "TAB TESTE I", PRECO_INTERIOR: 23 + i / 10, MARKUP_CAPITAL: 1.5, MARKUP_INTERIOR: 1.75,
    CATEGORIA: "CATEGORIA TESTE", SISTEMA: "SISTEMA TESTE", FAMILIA: "FAMÍLIA TESTE", LINHA: "LEVE",
    SUCATA: i % 9 === 0 ? 3.25 : null, CUSTO_TOTAL: 12 + i / 10,
  };
}
const LINHAS = Array.from({ length: N }, (_, k) => linha(k + 1));

// ---------- utilidades HTTP ----------
const portaLivre = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
function pedir(base, caminho, { metodo = "GET", corpo, cookie, accept = "application/json" } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(caminho, base);
    const h = { Accept: accept };
    if (cookie) h.Cookie = cookie;
    if (metodo !== "GET") h.Origin = base;
    let b = null;
    if (corpo !== undefined) { b = Buffer.from(JSON.stringify(corpo)); h["Content-Type"] = "application/json"; h["Content-Length"] = b.length; }
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: metodo, headers: h }, (r) => {
      const partes = []; r.on("data", (x) => partes.push(x));
      r.on("end", () => { const texto = Buffer.concat(partes).toString("utf8"); let json = null; try { json = JSON.parse(texto); } catch { /* não é JSON */ } resolve({ status: r.statusCode, headers: r.headers, texto, json }); });
    });
    req.on("error", reject); if (b) req.write(b); req.end();
  });
}
const cookieDe = (r) => { const sc = r.headers["set-cookie"] || []; const l = sc.find((x) => x.startsWith("bap_sessao=")); return l ? l.split(";")[0] : null; };

async function subirServico(estoqueUrl, nomePasta) {
  const mod = await import(pathToFileURL(path.join(RAIZ, "servicos", "login", "server.mjs")).href);
  const porta = await portaLivre();
  const base = `http://127.0.0.1:${porta}`;
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), nomePasta));
  const senhaAdmin0 = falsa("admin0");
  const logs = [];
  const srv = await mod.criarServico({
    env: { PASTA_DADOS: pasta, ADMIN_USUARIO: "admin", ADMIN_SENHA_INICIAL: senhaAdmin0, SESSAO_SEGREDO: falsa("segredo"), CHAVE_INTERNA: falsa("chave"), ORIGEM_SITE: base },
    log: (m) => logs.push(m), estoqueUrl,
  });
  await srv.estoquePronto;
  await new Promise((r) => srv.listen(porta, "127.0.0.1", r));
  // admin com a senha já trocada
  const e = await pedir(base, "/api/entrar", { metodo: "POST", corpo: { usuario: "admin", senha: senhaAdmin0 } });
  const senhaAdmin = falsa("admin1");
  const t = await pedir(base, "/api/trocar-senha", { metodo: "POST", cookie: cookieDe(e), corpo: { senhaNova: senhaAdmin } });
  if (t.status !== 204) throw new Error(`troca do admin respondeu ${t.status}`);
  return { srv, base, pasta, logs, adm: cookieDe(t), senhas: { admin: senhaAdmin } };
}
async function criarUsuario(s, usuario, estoque) {
  const s1 = falsa("ini"), s2 = falsa("fim");
  const corpo = { usuario, nome: `Pessoa ${usuario}`, empresa: "Empresa Teste", senha: s1 };
  if (estoque !== undefined) corpo.estoque = estoque;
  const c = await pedir(s.base, "/api/usuarios", { metodo: "POST", cookie: s.adm, corpo });
  if (c.status !== 201) throw new Error(`criar ${usuario}: ${c.status}`);
  const e = await pedir(s.base, "/api/entrar", { metodo: "POST", corpo: { usuario, senha: s1 } });
  const t = await pedir(s.base, "/api/trocar-senha", { metodo: "POST", cookie: cookieDe(e), corpo: { senhaNova: s2 } });
  if (t.status !== 204) throw new Error(`troca de ${usuario}: ${t.status}`);
  s.senhas[usuario] = s2;
  return cookieDe(t);
}
const COLS_VENDEDOR = ["Filial", "Nº filial", "Código", "Descrição", "Fornecedor", "Estoque"];
// admin: as 23 colunas, nesta ordem
const COLS_ADMIN = ["Filial", "Nº filial", "Código", "Descrição", "Estoque", "Custo do produto", "Custo total", "Preço capital", "Preço interior",
  "Markup capital", "Markup interior", "Fornecedor", "Tabela capital", "Tabela interior", "Sucata", "Origem do custo", "ID do produto",
  "Cód. fornecedor", "Filial CD", "Categoria", "Sistema", "Família", "Linha"];
const RX_TELA_INTERNA = /custo|preco|markup|tabela|sucata|origem|r\$/; // sobre o texto sem acento e minúsculo

// ---------- rodada ----------
const fonte = xlsxFicticio(CAB, LINHAS);
const srvFonte = http.createServer((req, r) => {
  if (req.url === "/ESTOQUE_BAP.xlsx") return r.writeHead(200, { "Content-Length": fonte.length }).end(fonte);
  if (req.url === "/quebrado.xlsx") return r.writeHead(200).end("isto-nao-e-um-zip");
  r.writeHead(404).end();
});
await new Promise((r) => srvFonte.listen(0, "127.0.0.1", r));
const FONTE = `http://127.0.0.1:${srvFonte.address().port}`;

const S = await subirServico(`${FONTE}/ESTOQUE_BAP.xlsx`, "t0034-ok-");
const S503 = await subirServico(`${FONTE}/quebrado.xlsx`, "t0034-503-");
await criarUsuario(S, "vend.teste", true);
const cli = await criarUsuario(S, "cli.teste");

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
const errosConsole = [];
async function contexto(s, usuario, larg, alt) {
  const ctx = await browser.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: 2 });
  await ctx.route((u) => !String(u.href).startsWith(s.base), (rota) => {
    const u = rota.request().url();
    if (/fonts\.googleapis\.com/.test(u)) return rota.fulfill({ status: 200, contentType: "text/css", body: "" });
    if (/placas/.test(u)) return rota.fulfill({ status: 503, contentType: "application/json", body: '{"erro":"teste"}' });
    return rota.fulfill({ status: 204, body: "" });
  });
  const page = await ctx.newPage();
  page.esperados = []; // códigos de status que o passo atual provoca de propósito (404 do cliente, 503)
  const rot = `${usuario} ${larg}`;
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (page.esperados.some((c) => t.includes(`status of ${c}`))) return;
    if (/placas/.test((m.location() || {}).url || "")) return;
    errosConsole.push(`${rot}: ${t.slice(0, 140)}`);
  });
  page.on("pageerror", (e) => errosConsole.push(`${rot}: erro de script: ${e.message.slice(0, 140)}`));
  if (usuario) {
    await page.goto(s.base + "/entrar", { waitUntil: "networkidle" });
    await entrarUI(page, usuario, s.senhas[usuario]);
  }
  return { ctx, page };
}
// página inteira; a janela (dialog modal) só na tela visível: na página inteira ela fica por cima do fim da lista
const print = async (page, nome, inteira = true) => {
  await semTemplate(page, nome);
  return page.screenshot({ path: path.join(PRINTS, nome + ".png"), fullPage: inteira });
};
// nenhum texto visível com "${" (modelo de texto que não foi preenchido): conferido em cada print e onde mais for chamado
const comTemplate = [];
let telasTemplate = 0;
async function semTemplate(page, onde) {
  telasTemplate++;
  const achado = await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("${"); return i < 0 ? null : t.slice(Math.max(0, i - 20), i + 30); }).catch(() => null);
  if (achado) comTemplate.push(`${onde}: "${achado.replace(/\s+/g, " ")}"`);
}
const larguraOk = async (page) => page.evaluate(() => document.documentElement.scrollWidth);
async function abrirEstoque(page, base) {
  await page.goto(base + "/estoque", { waitUntil: "networkidle" });
  await page.waitForSelector("table.est, .est-nada, .est-erro", { timeout: 15000 });
}
// celular: a largura do rótulo (::before) do Fornecedor no 1º cartão e quantas linhas o valor ocupa
const larguraRotulo = (page) => page.$eval("table.est tbody tr:first-child td.est-c-fornecedor", (td) => {
  const r = document.createRange(); r.selectNodeContents(td);
  const tops = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
  return { base: getComputedStyle(td, "::before").flexBasis, linhasFornecedor: tops.size, fornecedor: td.textContent.trim() };
});
const cabecalhos = (page) => page.$$eval("table.est thead th", (ths) => ths.map((t) => t.textContent.trim()));
const totalTxt = (page) => page.$eval("#est-total", (e) => e.textContent.trim());
async function esperarLista(page) {
  await page.waitForFunction(() => !document.querySelector(".est-lista-carregando") && document.querySelector("table.est, .est-nada, .est-erro"), null, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}
async function menuConta(page) {
  await page.waitForSelector("#conta .conta-bt", { timeout: 10000 });
  await page.click("#conta .conta-bt");
  await page.waitForSelector("#conta-menu:not([hidden])", { timeout: 5000 });
  return page.$$eval("#conta-menu a, #conta-menu button", (as) => as.map((a) => a.textContent.trim()));
}
const menuCima = (page) => page.$$eval(".topo .menu a", (as) => as.filter((a) => getComputedStyle(a).display !== "none").map((a) => a.textContent.trim()));
const porCidade = (cidade) => LINHAS.filter((l) => l.CIDADE === cidade).length;
const comEstoqueN = LINHAS.filter((l) => l.ESTOQUE != null && l.ESTOQUE !== 0).length;

// rodapé de cada tela (texto) e a fonte do filtro Filial (conferidos no passo 7c)
const rodape = (page) => page.$eval("footer.rodape", (f) => f.innerText).catch(() => null);
const rodapes = { estoque: null };
let fonteFilial = { sel: "", busca: "" };

try {
  // ---- 1. cliente: os menus e a página 404 no navegador (o 404 por HTTP é do login.test.mjs) ----
  {
    const { ctx, page } = await contexto(S, "cli.teste", 1366, 768);
    await page.waitForSelector("#conta .conta-bt", { timeout: 15000 });
    const cima = await menuCima(page);
    const conta = await menuConta(page);
    page.esperados.push(404);
    await page.goto(S.base + "/estoque", { waitUntil: "networkidle" });
    const txt404 = await page.evaluate(() => document.body.innerText.trim());
    await print(page, "cliente-404-1366");
    const { page: p390, ctx: c390 } = await contexto(S, "cli.teste", 390, 844);
    await p390.waitForSelector("#conta .conta-bt", { timeout: 15000 });
    const conta390 = await menuConta(p390);
    await c390.close(); await ctx.close();
    const ok = !cima.some((t) => /estoque/i.test(t))
      && !conta.some((t) => /estoque/i.test(t)) && !conta390.some((t) => /estoque/i.test(t)) && /Não encontrado/.test(txt404);
    res("cliente: página 404 e sem Estoque nos menus", ok, `menu de cima [${cima.join(", ")}]; conta 1366 [${conta.join(", ")}]; conta 390 [${conta390.join(", ")}]; tela: "${txt404.slice(0, 40)}"`);
  }

  // ---- 3. vendedor na tela ----
  {
    const { ctx, page } = await contexto(S, "vend.teste", 1366, 768);
    await abrirEstoque(page, S.base);
    const cab = await cabecalhos(page);
    const corpo = sem(await page.evaluate(() => document.body.innerText));
    const cima = await menuCima(page);
    await print(page, "vendedor-1366");
    rodapes.estoque = await rodape(page);
    fonteFilial = await page.evaluate(() => ({ sel: getComputedStyle(document.getElementById("est-filial")).fontFamily, busca: getComputedStyle(document.getElementById("est-busca")).fontFamily }));
    const conta = await menuConta(page);
    await ctx.close();
    res("vendedor: colunas exatas", JSON.stringify(cab) === JSON.stringify(COLS_VENDEDOR), `[${cab.join(", ")}]`);
    const achado = corpo.match(RX_TELA_INTERNA);
    res("vendedor: nada de custo/preço/markup/tabela/sucata/origem/R$ na tela", !achado, achado ? `achei "${achado[0]}"` : "texto da página inteira sem nenhuma dessas palavras");
    res("vendedor: Estoque no menu de cima e no da conta (1366)", cima.includes("Estoque") && conta.includes("Estoque"), `menu de cima [${cima.join(", ")}]; conta [${conta.join(", ")}]`);

    const v = await contexto(S, "vend.teste", 390, 844);
    await abrirEstoque(v.page, S.base);
    const w = await larguraOk(v.page);
    const corpo390 = sem(await v.page.evaluate(() => document.body.innerText));
    const rotV = await larguraRotulo(v.page);
    await print(v.page, "vendedor-390");
    const conta390 = await menuConta(v.page);
    const w2 = await larguraOk(v.page);
    await print(v.page, "menu-conta-vendedor-390", false);
    await v.ctx.close();
    res("vendedor 390: sem rolar de lado, sem dado interno, Estoque no menu da conta", w <= 390 && w2 <= 390 && !RX_TELA_INTERNA.test(corpo390) && conta390.includes("Estoque"),
      `scrollWidth ${w} (menu aberto ${w2}); conta [${conta390.join(", ")}]`);
    // o rótulo de 142 px vale só no admin; no vendedor fica o de 104 px (o da table.us) e o Fornecedor não quebra
    res("vendedor 390: rótulo do cartão com 104 px e Fornecedor numa linha", rotV.base === "104px" && rotV.linhasFornecedor === 1,
      `flex-basis do rótulo ${rotV.base}; o valor do Fornecedor ocupa ${rotV.linhasFornecedor} linha(s) ("${rotV.fornecedor}")`);
  }

  // ---- 4. admin ----
  {
    const api = await pedir(S.base, "/api/estoque", { cookie: S.adm });
    const { ctx, page } = await contexto(S, "admin", 1366, 768);
    await abrirEstoque(page, S.base);
    const cab = await cabecalhos(page);
    const l1 = await page.$$eval("table.est tbody tr:first-child td", (tds) => tds.map((t) => [t.getAttribute("data-rot"), t.textContent.trim()]));
    const val = Object.fromEntries(l1);
    await print(page, "admin-1366");
    await ctx.close();
    const dinheiro = ["Custo do produto", "Custo total", "Preço capital", "Preço interior"].every((k) => /^R\$\s?\d{1,3}(\.\d{3})*,\d{2}$/.test(val[k] || ""));
    const markup = ["Markup capital", "Markup interior"].every((k) => /^\d+,\d{2}$/.test(val[k] || ""));
    res("admin: 23 colunas na ordem", cab.length === 23 && JSON.stringify(cab) === JSON.stringify(COLS_ADMIN) && api.json.colunas.length === 23,
      `${cab.length} colunas na tela, ${api.json.colunas.length} na API`);
    res("admin: R$ e markup formatados", dinheiro && markup,
      `1ª linha: Custo do produto "${val["Custo do produto"]}", Custo total "${val["Custo total"]}", Preço capital "${val["Preço capital"]}", Preço interior "${val["Preço interior"]}", Markup capital "${val["Markup capital"]}", Markup interior "${val["Markup interior"]}", Sucata "${val["Sucata"]}"`);

    const a = await contexto(S, "admin", 390, 844);
    await abrirEstoque(a.page, S.base);
    const w = await larguraOk(a.page);
    await print(a.page, "admin-390");
    // o texto do botão de cada cartão, exatamente: "+ Detalhes" fechado e "− Menos detalhes" aberto
    const textosBt = (de, ate) => a.page.$$eval("table.est tbody tr .est-bt-mais", (bs, [i, j]) => bs.slice(i, j).map((b) => b.textContent.trim()), [de, ate]);
    const antes1 = await textosBt(0, 50);
    await a.page.click("table.est tbody tr:first-child .est-bt-mais");
    const rotA = await larguraRotulo(a.page);
    const aberto = await a.page.$eval("table.est tbody tr:first-child", (tr) => ({ cls: tr.classList.contains("aberta"), bt: tr.querySelector(".est-bt-mais").textContent.trim(), extras: [...tr.querySelectorAll("td.est-extra")].filter((t) => getComputedStyle(t).display !== "none").length }));
    const w2 = await larguraOk(a.page);
    await print(a.page, "admin-390-detalhes", false);
    await a.page.click("table.est tbody tr:first-child .est-bt-mais");
    const fechado1 = (await textosBt(0, 1))[0];
    // um cartão que chegou pelo "Mostrar mais"
    await a.page.click("#est-mais-bt");
    await a.page.waitForFunction(() => document.querySelectorAll("table.est tbody tr").length > 50, null, { timeout: 10000 });
    await a.page.waitForLoadState("networkidle");
    const antes2 = await textosBt(50, 100);
    await a.page.click("table.est tbody tr:nth-child(51) .est-bt-mais");
    const aberto51 = (await textosBt(50, 51))[0];
    await a.page.click("table.est tbody tr:nth-child(51) .est-bt-mais");
    const fechado51 = (await textosBt(50, 51))[0];
    await semTemplate(a.page, "admin 390 depois do Mostrar mais");
    await a.page.evaluate(() => window.scrollTo(0, 0));
    const conta = await menuConta(a.page);
    await print(a.page, "menu-conta-admin-390", false);
    await a.ctx.close();
    res("admin 390: sem rolar de lado e \"+ Detalhes\" abre", w <= 390 && w2 <= 390 && aberto.cls && aberto.extras === 18 && aberto.bt === "− Menos detalhes",
      `scrollWidth ${w} (aberto ${w2}); cartão aberto com ${aberto.extras} campos a mais, botão "${aberto.bt}"`);
    const todos = (l, t) => l.length === 50 && l.every((x) => x === t);
    res("admin 390: texto exato do botão do cartão (antes e depois do clique, também no \"Mostrar mais\")",
      todos(antes1, "+ Detalhes") && aberto.bt === "− Menos detalhes" && fechado1 === "+ Detalhes"
        && todos(antes2, "+ Detalhes") && aberto51 === "− Menos detalhes" && fechado51 === "+ Detalhes",
      `1ª página: ${antes1.length} botões, textos [${[...new Set(antes1)].join(" | ")}]; 1º cartão: "${aberto.bt}" aberto, "${fechado1}" fechado de novo; depois do "Mostrar mais": ${antes2.length} botões novos, textos [${[...new Set(antes2)].join(" | ")}]; 51º cartão: "${aberto51}" aberto, "${fechado51}" fechado de novo`);
    res("admin: Estoque no menu da conta (390)", conta[0] === "Estoque", `[${conta.join(", ")}]`);
    res("admin 390: rótulo do cartão com 142 px", rotA.base === "142px", `flex-basis do rótulo ${rotA.base}`);
  }

  // ---- 5. busca, filtro, caixa, mais 50, vazio (vendedor, 1366) ----
  {
    const { ctx, page } = await contexto(S, "vend.teste", 1366, 768);
    await abrirEstoque(page, S.base);
    const linhasTela = () => page.$$eval("table.est tbody tr", (trs) => trs.map((tr) => ({
      filial: tr.querySelector(".est-c-cidade")?.textContent.trim(), est: tr.querySelector(".est-c-estoque")?.textContent.trim() })));
    // "Mostrar mais N" até o fim: N é o que falta, até 50 (50 de 120 → "Mostrar mais 50"; 100 de 120 → "Mostrar mais 20")
    const textoBt = () => page.$eval("#est-mais-bt", (b) => b.textContent.trim());
    const passos = [await totalTxt(page)];
    const botoes = [await textoBt()];
    let n = (await linhasTela()).length;
    const contagens = [n];
    for (let k = 0; k < 5 && await page.isVisible("#est-mais-bt"); k++) {
      await page.click("#est-mais-bt");
      await page.waitForFunction((m) => document.querySelectorAll("table.est tbody tr").length > m, n, { timeout: 10000 });
      await page.waitForLoadState("networkidle");
      n = (await linhasTela()).length; contagens.push(n); passos.push(await totalTxt(page));
      if (await page.isVisible("#est-mais-bt")) {
        botoes.push(await textoBt());
        if (n === 100) await print(page, "mostrar-mais-ultimo-1366");
      }
    }
    const maisSumiu = !(await page.isVisible("#est-mais-bt"));
    res("Mostrar mais N até o fim", JSON.stringify(contagens) === JSON.stringify([50, 100, 120]) && maisSumiu
      && JSON.stringify(botoes) === JSON.stringify(["Mostrar mais 50", "Mostrar mais 20"]),
      `linhas ${contagens.join(" → ")}; contagem "${passos.join('" → "')}"; botão "${botoes.join('" → "')}"; botão some no fim: ${maisSumiu}`);

    // busca
    const buscar = async (t) => { await page.fill("#est-busca", t); await page.waitForTimeout(450); await esperarLista(page); };
    const resultadosBusca = [];
    let buscaOk = true;
    for (const t of ["mato grosso", "matogrosso", "MATO GROSSO"]) {
      await buscar(t);
      const ls = await linhasTela();
      const tot = await totalTxt(page);
      const ok = ls.length === porCidade("MATOGROSSO") && ls.every((l) => l.filial === "Mato Grosso");
      if (!ok) buscaOk = false;
      resultadosBusca.push(`"${t}" → ${ls.length} linhas (${tot}), todas Mato Grosso: ${ls.every((l) => l.filial === "Mato Grosso")}`);
    }
    await buscar("ZZT0007");
    const um = await linhasTela();
    res("busca (\"mato grosso\" e \"matogrosso\")", buscaOk && um.length === 1, `${resultadosBusca.join("; ")}; esperado ${porCidade("MATOGROSSO")}; "ZZT0007" → ${um.length}`);

    // vazio
    await buscar("xyzsemnada");
    const nada = await page.$eval(".est-nada", (e) => e.textContent.trim()).catch(() => "");
    await print(page, "busca-vazia-1366");
    res("mensagem de vazio", /^Nada encontrado para “xyzsemnada”\.$/.test(nada) && !(await page.isVisible("#est-mais-bt")), `"${nada}"`);
    await buscar("");

    // filtro Filial
    const opcoes = await page.$$eval("#est-filial option", (os) => os.map((o) => o.textContent.trim()));
    await page.selectOption("#est-filial", "90000002");
    await esperarLista(page);
    const man = await linhasTela();
    const manOk = man.length === porCidade("MANAUS") && man.every((l) => l.filial === "Manaus");
    await page.fill("#est-busca", "pastilha"); await page.waitForTimeout(450); await esperarLista(page);
    const manPast = await linhasTela();
    await page.fill("#est-busca", "xyzsemnada"); await page.waitForTimeout(450); await esperarLista(page);
    const nadaFil = await page.$eval(".est-nada", (e) => e.textContent.trim()).catch(() => "");
    res("filtro Filial", manOk && opcoes.length === 7 && opcoes[0] === "Todas" && /em Manaus\.$/.test(nadaFil),
      `opções [${opcoes.join(" | ")}]; Manaus · 90000002 → ${man.length} linhas (esperado ${porCidade("MANAUS")}); + "pastilha" → ${manPast.length}; vazio com filial: "${nadaFil}"`);
    await page.fill("#est-busca", ""); await page.waitForTimeout(450);
    await page.selectOption("#est-filial", ""); await esperarLista(page);

    // caixa "Somente produtos com estoque"
    const desmarcada = !(await page.isChecked("#est-com"));
    const antes = await linhasTela();
    const zerosAntes = antes.filter((l) => /Sem estoque|—/.test(l.est)).length;
    await page.check("#est-com"); await esperarLista(page);
    const totCom = await totalTxt(page);
    const btCom = await textoBt();
    while (await page.isVisible("#est-mais-bt")) {
      const m = (await linhasTela()).length;
      await page.click("#est-mais-bt");
      await page.waitForFunction((x) => document.querySelectorAll("table.est tbody tr").length > x, m, { timeout: 10000 });
      await page.waitForLoadState("networkidle");
    }
    const depois = await linhasTela();
    const zerosDepois = depois.filter((l) => /Sem estoque|—/.test(l.est) || !/^\d/.test(l.est)).length;
    await page.evaluate(() => window.scrollTo(0, 0));
    await print(page, "com-estoque-marcada-1366");
    res("caixa \"Somente produtos com estoque\"", desmarcada && zerosAntes > 0 && zerosDepois === 0 && depois.length === comEstoqueN
      && btCom === `Mostrar mais ${Math.min(50, comEstoqueN - 50)}`,
      `começa desmarcada: ${desmarcada}; desmarcada: ${zerosAntes} de ${antes.length} linhas da 1ª página com "Sem estoque" ou vazio; marcada: "${totCom}", botão "${btCom}", ${depois.length} linhas (esperado ${comEstoqueN}), ${zerosDepois} com 0 ou vazio`);
    await ctx.close();
  }

  // ---- 6. 503 na tela (o 503 da API e o log são do login.test.mjs) ----
  {
    const { ctx, page } = await contexto(S503, "admin", 1366, 768);
    page.esperados.push(503);
    await abrirEstoque(page, S503.base);
    const msg = await page.$eval(".est-erro", (e) => e.innerText.trim()).catch(() => "");
    const bt = await page.$eval("#est-tentar", (b) => b.textContent.trim()).catch(() => "");
    await print(page, "503-1366");
    let pedidos = 0;
    page.on("request", (r) => { if (r.url().includes("/api/estoque")) pedidos++; });
    await page.click("#est-tentar").catch(() => {});
    await page.waitForSelector("#est-tentar", { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
    const msg2 = await page.$eval(".est-erro", (e) => e.innerText.trim()).catch(() => "");
    const p390 = await contexto(S503, "admin", 390, 844);
    p390.page.esperados.push(503);
    await abrirEstoque(p390.page, S503.base);
    const w = await larguraOk(p390.page);
    await print(p390.page, "503-390");
    await p390.ctx.close(); await ctx.close();
    const cat = await pedir(S503.base, "/api/eu", { cookie: S503.adm });
    // a caixa de erro tem só a frase (sem "Tente de novo." acima do botão); o botão é "Tentar de novo"
    const ESPERADA = "Estoque indisponível no momento.\nTentar de novo";
    const limpa = (t) => t.split("\n").map((x) => x.trim()).filter(Boolean).join("\n");
    res("503 com a fonte quebrada", limpa(msg) === ESPERADA && bt === "Tentar de novo" && pedidos === 1 && limpa(msg2) === ESPERADA && w <= 390 && cat.status === 200,
      `tela "${limpa(msg).replace(/\n/g, " | ")}"; botão "${bt}"; "Tentar de novo" fez ${pedidos} pedido e mostrou "${limpa(msg2).replace(/\n/g, " | ")}"; 390 scrollWidth ${w}; o catálogo segue no ar (/api/eu ${cat.status})`);
  }

  // ---- 6b. outro erro (500, simulado no navegador): "Não foi possível carregar o estoque." ----
  {
    const { ctx, page } = await contexto(S, "vend.teste", 1366, 768);
    page.esperados.push(500);
    let falhar = true;
    await page.route("**/api/estoque?*", (r) => falhar ? r.fulfill({ status: 500, contentType: "application/json", body: '{"erro":"teste"}' }) : r.continue());
    await abrirEstoque(page, S.base);
    const limpa = (t) => t.split("\n").map((x) => x.trim()).filter(Boolean).join("\n");
    const msg = limpa(await page.$eval(".est-erro", (e) => e.innerText).catch(() => ""));
    falhar = false;
    await page.click("#est-tentar").catch(() => {});
    await esperarLista(page);
    const linhasDepois = await page.$$eval("table.est tbody tr", (trs) => trs.length).catch(() => 0);
    await ctx.close();
    res("outro erro: \"Não foi possível carregar o estoque.\" e \"Tentar de novo\" recupera", msg === "Não foi possível carregar o estoque.\nTentar de novo" && linhasDepois === 50,
      `tela "${msg.replace(/\n/g, " | ")}"; depois do "Tentar de novo" (API de volta): ${linhasDepois} linhas`);
  }

  // ---- 7. Criar usuários: a caixa "Pode ver o estoque" ----
  {
    const { ctx, page } = await contexto(S, "admin", 1366, 768);
    await page.goto(S.base + "/admin/usuarios", { waitUntil: "networkidle" });
    await page.waitForSelector("#us-lista table", { timeout: 15000 });
    const tagVend = await page.$$eval("#us-lista tbody tr", (trs) => trs.map((tr) => [tr.querySelector(".us-login")?.textContent, /Vê o estoque/.test(tr.innerText)]));
    await page.click("#us-criar");
    await page.waitForSelector("#n-estoque");
    const desm = !(await page.isChecked("#n-estoque"));
    const rotulo = await page.$eval("#n-estoque", (i) => i.closest("label").textContent.trim());
    const s1 = falsa("novo1");
    await page.fill("#n-nome", "Pessoa Nova Teste");
    await page.fill("#n-emp", "Empresa Teste");
    await page.fill("#n-us", "novo.vend");
    await page.fill("#n-senha", s1);
    await page.check("#n-estoque");
    await print(page, "criar-usuario-caixa-1366", false);
    await page.click('dialog button[type="submit"], .janela button[type="submit"]');
    await page.waitForSelector("#copiar", { timeout: 10000 });
    await page.click("[data-fecha]");
    await page.waitForLoadState("networkidle");
    const lista = await pedir(S.base, "/api/usuarios", { cookie: S.adm });
    const novo = (lista.json.usuarios || lista.json).find?.((u) => u.usuario === "novo.vend");
    // editar o cliente: marcar e, depois, desmarcar
    await page.click('[data-acao="editar"][data-u="cli.teste"]');
    await page.waitForSelector("#e-estoque");
    const eDesm = !(await page.isChecked("#e-estoque"));
    await page.check("#e-estoque");
    await page.click('dialog button[type="submit"], .janela button[type="submit"]');
    await page.waitForFunction(() => !document.querySelector("#e-estoque"), null, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    const cliApi = (await pedir(S.base, "/api/estoque", { cookie: cli })).status; // a sessão antiga do cliente, no pedido seguinte
    await page.click('[data-acao="editar"][data-u="cli.teste"]');
    await page.waitForSelector("#e-estoque");
    const eMarc = await page.isChecked("#e-estoque");
    await page.uncheck("#e-estoque");
    await page.click('dialog button[type="submit"], .janela button[type="submit"]');
    await page.waitForFunction(() => !document.querySelector("#e-estoque"), null, { timeout: 10000 });
    await page.waitForLoadState("networkidle");
    const cliApi2 = (await pedir(S.base, "/api/estoque", { cookie: cli })).status;
    await print(page, "criar-usuarios-lista-1366");
    await ctx.close();
    // o novo usuário entra, troca a senha e vê o Estoque nos menus
    S.senhas["novo.vend"] = s1;
    const n = await contexto(S, "novo.vend", 1366, 768);
    const s2 = falsa("novo2");
    await n.page.waitForSelector("#form-senha #nova", { timeout: 10000 });
    await n.page.fill("#nova", s2); await n.page.fill("#conf", s2);
    await Promise.all([n.page.waitForURL((u) => !u.pathname.startsWith("/trocar-senha"), { timeout: 15000 }), n.page.click('#form-senha button[type="submit"]')]);
    await n.page.waitForSelector("#conta .conta-bt", { timeout: 15000 });
    await n.page.waitForLoadState("networkidle");
    const cima = await menuCima(n.page);
    const conta = await menuConta(n.page);
    await n.page.click('#conta-menu a[href="/estoque"]');
    await n.page.waitForURL((u) => u.pathname === "/estoque", { timeout: 10000 });
    await esperarLista(n.page);
    const cabN = await cabecalhos(n.page);
    await n.ctx.close();
    res("Criar usuários: \"Pode ver o estoque\" grava e libera o menu",
      desm && rotulo === "Pode ver o estoque" && novo?.estoque === true && eDesm && cliApi === 200 && eMarc && cliApi2 === 404
        && cima.includes("Estoque") && conta.includes("Estoque") && JSON.stringify(cabN) === JSON.stringify(COLS_VENDEDOR)
        && tagVend.some(([u, t]) => u === "vend.teste" && t) && tagVend.some(([u, t]) => u === "cli.teste" && !t),
      `etiqueta "Vê o estoque" na lista: ${tagVend.filter(([, t]) => t).map(([u]) => u).join(", ")}; caixa "${rotulo}" começa desmarcada: ${desm}; criado novo.vend com a caixa → API estoque=${novo?.estoque}; ele entra (troca obrigatória) e vê Estoque no menu de cima [${cima.join(", ")}] e na conta [${conta.join(", ")}], abre a aba com as 6 colunas do vendedor; Editar cli.teste: caixa desmarcada ${eDesm} → marcada: /api/estoque da sessão antiga ${cliApi}; reaberta marcada ${eMarc} → desmarcada: ${cliApi2}`);
  }

  // ---- 7b. Criar usuários em 390 px (F5 da UX): a lista e a janela com a caixa ----
  {
    const { ctx, page } = await contexto(S, "admin", 390, 844);
    await page.goto(S.base + "/admin/usuarios", { waitUntil: "networkidle" });
    await page.waitForSelector("#us-lista table", { timeout: 15000 });
    const w = await larguraOk(page);
    const tag = await page.$$eval("#us-lista tbody tr", (trs) => trs.filter((tr) => /Vê o estoque/.test(tr.innerText)).map((tr) => tr.querySelector(".us-login")?.textContent));
    await print(page, "criar-usuarios-lista-390");
    await page.click("#us-criar");
    await page.waitForSelector("#n-estoque");
    await page.fill("#n-nome", "Pessoa Nova Teste");
    await page.fill("#n-emp", "Empresa Teste");
    await page.fill("#n-us", "outro.vend");
    await page.check("#n-estoque");
    const caixa = await page.$eval("#n-estoque", (i) => { const r = i.closest("label").getBoundingClientRect(); return { rot: i.closest("label").textContent.trim(), dentro: r.left >= 0 && r.right <= 390, alt: Math.round(r.height) }; });
    const w2 = await larguraOk(page);
    await print(page, "criar-usuario-caixa-390", false);
    await ctx.close();
    res("Criar usuários 390: lista e caixa sem rolar de lado", w <= 390 && w2 <= 390 && caixa.rot === "Pode ver o estoque" && caixa.dentro && tag.includes("vend.teste"),
      `scrollWidth lista ${w}, janela ${w2}; caixa "${caixa.rot}" dentro da tela: ${caixa.dentro} (altura ${caixa.alt} px); "Vê o estoque" em ${tag.join(", ")}`);
  }

  // ---- 7c. rodapé e fonte do filtro: no /estoque sai "As fotos são ilustrativas…" (a aba não tem foto) ----
  {
    const tem = (t) => /fotos s[aã]o ilustrativas/i.test(t);
    const ok = rodapes.estoque !== null && !tem(rodapes.estoque) && /BAP AUTOPARTS/.test(rodapes.estoque)
      && fonteFilial.sel === fonteFilial.busca && fonteFilial.sel !== "";
    res("rodapé do /estoque sem \"fotos ilustrativas\" e o filtro com a fonte da página", ok,
      `/estoque: "${(rodapes.estoque || "").replace(/\s+/g, " ").trim()}"; fonte do select Filial "${fonteFilial.sel}", do campo Buscar "${fonteFilial.busca}"`);
  }

  // ---- 8. console, "${" e log ----
  res("nenhum texto visível com \"${\"", !comTemplate.length, comTemplate.length ? comTemplate.join(" | ") : `${telasTemplate} telas conferidas (cada print e o admin 390 depois do "Mostrar mais")`);
  res("console sem erro inesperado", !errosConsole.length, errosConsole.length ? errosConsole.join(" | ") : "0 erro (404 do cliente e 503 da fonte quebrada esperados e descontados)");
  const logs = [...S.logs, ...S503.logs].join("\n");
  const vaz = [...Object.values(S.senhas), ...Object.values(S503.senhas)].some((s) => logs.includes(s)) || /ZZT\d|TESTE|127\.0\.0\.1/.test(logs);
  res("log do serviço sem dado nem senha", !vaz, (S.logs.find((l) => l.startsWith("estoque")) || "") + "; " + (S503.logs.find((l) => l.startsWith("estoque")) || ""));
} catch (e) {
  res("execução", false, e.stack.split("\n").slice(0, 4).join(" / "));
} finally {
  await browser.close();
  S.srv.close(); S503.srv.close(); srvFonte.close();
  for (const p of [S.pasta, S503.pasta]) fs.rmSync(p, { recursive: true, force: true });
}

for (const r of resultados) console.log(`${(r.nome + " ").padEnd(62, ".")} ${r.ok ? "PASSOU" : "FALHOU"}\n    ${r.det}`);
console.log(`prints: ${path.relative(RAIZ, PRINTS)}/`);
const falhas = resultados.filter((r) => !r.ok).length;
console.log(falhas ? `Resultado: FALHOU (${falhas})` : "Resultado: PASSOU");
process.exit(falhas ? 1 : 0);
