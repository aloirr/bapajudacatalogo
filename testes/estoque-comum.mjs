/* Base comum dos testes da aba Estoque (T-0034 e T-0035). Dono: agente testes. Não roda sozinho: é importado por
   testes/estoque-t0034.mjs e testes/estoque-t0035.mjs.

   O que dá:
     - LINHAS: 120 linhas de um ESTOQUE_BAP.xlsx SINTÉTICO (6 filiais, estoque 0 e vazio em algumas; custo, preço, markup,
       tabela, sucata e origem FICTÍCIOS; classificação variada em 3 categorias, 5 sistemas e 10 famílias, com o sistema
       ELÉTRICO e a família CHICOTE em mais de uma categoria, e 2 linhas sem classificação), montado com o xlsxFicticio
       do servicos/login/xlsx-ficticio.mjs e servido em 127.0.0.1 (também um /quebrado.xlsx para o 503);
     - iniciar(): sobe o serviço de login de verdade (criarServico, com o site/ real) numa porta livre, com PASTA_DADOS
       temporária e senhas falsas geradas a cada rodada (nunca impressas, nunca gravadas), e o Chromium;
     - contexto(), print() (deviceScaleFactor 2), a vigia do console e do "${", e o relatório no fim (fechar()).
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

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const falsa = (rot) => `${rot}-falsa-de-teste-${crypto.randomBytes(6).toString("hex")}`;
export const sem = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const resultados = [];
export const res = (nome, ok, det) => { resultados.push({ nome, ok, det }); };

// ---------- xlsx sintético ----------
const CAB = ["DATA", "HORA", "CIDADE", "FILIAL_BAP", "ID_PRODUTO", "COD_FORNECEDOR", "FORNECEDOR", "COD_PRODUTO",
  "DESCRICAO_PRODUTO", "ESTOQUE", "FILIAL_CD", "PPEDIDO", "ORIGEM_CUSTO", "TABELA_CAPITAL", "PRECO_CAPITAL", "TABELA_INTERIOR",
  "PRECO_INTERIOR", "MARKUP_CAPITAL", "MARKUP_INTERIOR", "CATEGORIA", "SISTEMA", "FAMILIA", "LINHA", "SUCATA", "CUSTO_TOTAL"];
const FILIAIS = [["MANAUS", "90000002"], ["MATOGROSSO", "90000001"], ["BELÉM", "90000005"], ["SÃO LUIS", "90000006"], ["BOA VISTA", "90000003"], ["SANTARÉM", "90000004"]];
const PECAS = ["AMORTECEDOR DIANTEIRO TESTE", "PASTILHA DE FREIO TESTE", "ROLAMENTO DE RODA TESTE", "BIELETA TESTE", "TERMINAL DE DIREÇÃO TESTE"];
// classificação (categoria, sistema, família): blocos de 10 linhas seguidas, cada bloco passa por todas as filiais
const CLASSES = [
  ["FREIO", "HIDRÁULICO", "PASTILHA"], ["FREIO", "HIDRÁULICO", "DISCO"], ["FREIO", "ELÉTRICO", "SENSOR ABS"], ["FREIO", "ELÉTRICO", "CHICOTE"],
  ["MOTOR", "ARREFECIMENTO", "RADIADOR"], ["MOTOR", "ARREFECIMENTO", "BOMBA D'ÁGUA"], ["MOTOR", "ELÉTRICO", "SENSOR"], ["MOTOR", "ELÉTRICO", "CHICOTE"],
  ["SUSPENSÃO", "DIANTEIRA", "AMORTECEDOR"], ["SUSPENSÃO", "DIANTEIRA", "BIELETA"], ["SUSPENSÃO", "TRASEIRA", "AMORTECEDOR"], ["SUSPENSÃO", "TRASEIRA", "MOLA"],
];
export const N = 120;
const SERIE_DATA = Date.UTC(2026, 10, 24) / 86400000 + 25569;
const SERIE_HORA = (9 * 60 + 30) / 1440;
function linha(i) {
  const [cidade, filial] = FILIAIS[i % FILIAIS.length];
  const n = String(i).padStart(4, "0");
  const [categoria, sistema, familia] = i % 60 === 0 ? [null, null, null] : CLASSES[Math.floor((i - 1) / 10) % CLASSES.length];
  return {
    DATA: SERIE_DATA, HORA: SERIE_HORA, CIDADE: cidade, FILIAL_BAP: filial, ID_PRODUTO: `ID-TESTE-${n}`, COD_FORNECEDOR: `CFT${n}`,
    FORNECEDOR: i % 2 ? "FORNECEDOR TESTE ALFA" : "FORNECEDOR TESTE BETA", COD_PRODUTO: `ZZT${n}`,
    DESCRICAO_PRODUTO: familia ? `${familia} TESTE ${n}` : `${PECAS[i % PECAS.length]} ${n}`, // a descrição segue a família
    ESTOQUE: i % 11 === 0 ? null : i % 4 === 0 ? 0 : (i * 7) % 90 + 1, FILIAL_CD: String(i % 3),
    PPEDIDO: 11 + i / 10, ORIGEM_CUSTO: "ORIGEM TESTE", TABELA_CAPITAL: "TAB TESTE C", PRECO_CAPITAL: 22 + i / 10,
    TABELA_INTERIOR: "TAB TESTE I", PRECO_INTERIOR: 23 + i / 10, MARKUP_CAPITAL: 1.5, MARKUP_INTERIOR: 1.75,
    CATEGORIA: categoria, SISTEMA: sistema, FAMILIA: familia, LINHA: "LEVE",
    SUCATA: i % 9 === 0 ? 3.25 : null, CUSTO_TOTAL: 12 + i / 10,
  };
}
export const LINHAS = Array.from({ length: N }, (_, k) => linha(k + 1));
export const porCidade = (cidade) => LINHAS.filter((l) => l.CIDADE === cidade).length;
export const comEstoqueN = LINHAS.filter((l) => l.ESTOQUE != null && l.ESTOQUE !== 0).length;

export const COLS_VENDEDOR = ["Filial", "Nº filial", "Código", "Descrição", "Fornecedor", "Estoque"];
// admin: as 23 colunas, nesta ordem
export const COLS_ADMIN = ["Filial", "Nº filial", "Código", "Descrição", "Estoque", "Custo do produto", "Custo total", "Preço capital", "Preço interior",
  "Markup capital", "Markup interior", "Fornecedor", "Tabela capital", "Tabela interior", "Sucata", "Origem do custo", "ID do produto",
  "Cód. fornecedor", "Filial CD", "Categoria", "Sistema", "Família", "Linha"];
export const RX_TELA_INTERNA = /custo|preco|markup|tabela|sucata|origem|r\$/; // sobre o texto sem acento e minúsculo

// ---------- utilidades HTTP ----------
const portaLivre = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
export function pedir(base, caminho, { metodo = "GET", corpo, cookie, accept = "application/json" } = {}) {
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
export async function criarUsuario(s, usuario, estoque) {
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

// ---------- rodada: fonte, serviços e navegador ----------
let PRINTS, browser, srvFonte;
const servicos = [];
export const errosConsole = [];
// printsPadrao: a pasta dos prints (troca com --prints); com503: sobe também o serviço com a fonte quebrada
export async function iniciar({ printsPadrao, com503 = false }) {
  const i = process.argv.indexOf("--prints");
  PRINTS = path.resolve(RAIZ, i > 0 ? process.argv[i + 1] : printsPadrao);
  fs.mkdirSync(PRINTS, { recursive: true });
  const fonte = xlsxFicticio(CAB, LINHAS);
  srvFonte = http.createServer((req, r) => {
    if (req.url === "/ESTOQUE_BAP.xlsx") return r.writeHead(200, { "Content-Length": fonte.length }).end(fonte);
    if (req.url === "/quebrado.xlsx") return r.writeHead(200).end("isto-nao-e-um-zip");
    r.writeHead(404).end();
  });
  await new Promise((r) => srvFonte.listen(0, "127.0.0.1", r));
  const FONTE = `http://127.0.0.1:${srvFonte.address().port}`;
  const S = await subirServico(`${FONTE}/ESTOQUE_BAP.xlsx`, "estoque-ok-");
  servicos.push(S);
  let S503 = null;
  if (com503) { S503 = await subirServico(`${FONTE}/quebrado.xlsx`, "estoque-503-"); servicos.push(S503); }
  const { chromium } = createRequire(import.meta.url)("playwright");
  browser = await chromium.launch();
  return { S, S503 };
}

export async function contexto(s, usuario, larg, alt) {
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
// nenhum texto visível com "${" (modelo de texto que não foi preenchido): conferido em cada print e onde mais for chamado
export const comTemplate = [];
let telasTemplate = 0;
export async function semTemplate(page, onde) {
  telasTemplate++;
  const achado = await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf("${"); return i < 0 ? null : t.slice(Math.max(0, i - 20), i + 30); }).catch(() => null);
  if (achado) comTemplate.push(`${onde}: "${achado.replace(/\s+/g, " ")}"`);
}
// página inteira; a janela (dialog modal), o menu aberto e o cartão aberto só na tela visível
export const print = async (page, nome, inteira = true) => {
  await semTemplate(page, nome);
  return page.screenshot({ path: path.join(PRINTS, nome + ".png"), fullPage: inteira });
};
export const larguraOk = async (page) => page.evaluate(() => document.documentElement.scrollWidth);
export async function abrirEstoque(page, base) {
  await page.goto(base + "/estoque", { waitUntil: "networkidle" });
  await page.waitForSelector("table.est, .est-nada, .est-erro", { timeout: 15000 });
}
export const cabecalhos = (page) => page.$$eval("table.est thead th", (ths) => ths.map((t) => t.textContent.trim()));
export const totalTxt = (page) => page.$eval("#est-total", (e) => e.textContent.trim());
export async function esperarLista(page) {
  await page.waitForFunction(() => !document.querySelector(".est-lista-carregando") && document.querySelector("table.est, .est-nada, .est-erro"), null, { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}
export async function menuConta(page) {
  await page.waitForSelector("#conta .conta-bt", { timeout: 10000 });
  await page.click("#conta .conta-bt");
  await page.waitForSelector("#conta-menu:not([hidden])", { timeout: 5000 });
  return page.$$eval("#conta-menu a, #conta-menu button", (as) => as.map((a) => a.textContent.trim()));
}
export const menuCima = (page) => page.$$eval(".topo .menu a", (as) => as.filter((a) => getComputedStyle(a).display !== "none").map((a) => a.textContent.trim()));

// fecha tudo, imprime o relatório e sai (0 se tudo passou, 1 se algo falhou). erro: a exceção que parou a rodada.
export async function fechar(erro, consoleOk = "0 erro") {
  if (erro) res("execução", false, erro.stack.split("\n").slice(0, 4).join(" / "));
  else {
    res("nenhum texto visível com \"${\"", !comTemplate.length, comTemplate.length ? comTemplate.join(" | ") : `${telasTemplate} telas conferidas`);
    res("console sem erro inesperado", !errosConsole.length, errosConsole.length ? errosConsole.join(" | ") : consoleOk);
    const logs = servicos.flatMap((s) => s.logs).join("\n");
    const vaz = servicos.flatMap((s) => Object.values(s.senhas)).some((s) => logs.includes(s)) || /ZZT\d|TESTE|127\.0\.0\.1/.test(logs);
    res("log do serviço sem dado nem senha", !vaz, servicos.map((s) => s.logs.find((l) => l.startsWith("estoque")) || "").join("; "));
  }
  if (browser) await browser.close();
  for (const s of servicos) { s.srv.close(); fs.rmSync(s.pasta, { recursive: true, force: true }); }
  if (srvFonte) srvFonte.close();
  for (const r of resultados) console.log(`${(r.nome + " ").padEnd(62, ".")} ${r.ok ? "PASSOU" : "FALHOU"}\n    ${r.det}`);
  console.log(`prints: ${path.relative(RAIZ, PRINTS)}/`);
  const falhas = resultados.filter((r) => !r.ok).length;
  console.log(falhas ? `Resultado: FALHOU (${falhas})` : "Resultado: PASSOU");
  process.exit(falhas ? 1 : 0);
}
