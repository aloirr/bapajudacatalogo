#!/usr/bin/env node
/* Testes da T-0033 (25/11/2026): busca por veículo com ano e o fim do bloco "Outros veículos e detalhes". Dono: testes.

   Uso (na raiz do repositório, depois de gerar os dados com scripts/gerar_site.py):
     node testes/t0033_busca_ano.mjs                                   # confere o site/ (o "depois")
     node testes/t0033_busca_ano.mjs --antes <pasta> --prints testes/prints/T-0033
   Opções:
     --site <pasta>    o site a conferir (padrão: site/).
     --antes <pasta>   um site de antes da T-0033 (ex.: o site/ do origin/main copiado numa pasta, com o mesmo
                       produtos.json). Com ele: os prints de antes e as comparações antes x depois (busca sem ano, por
                       código e por referência; os produtos que saíram da busca com ano). Sem ele, essas comparações
                       ficam de fora (aparecem como "não conferido").
     --prints <pasta>  onde gravar os prints (padrão: testes/prints/ultima-t0033). deviceScaleFactor 2.
   Saída: 0 se passou e 1 se falhou.

   Regras conferidas (pedidos R-20261124-152047-po e R-20261124-152425-po):
     a) com o ano, o produto só entra se a tabela da aplicação tiver uma linha da marca e do modelo escolhidos com o ano
        batendo ("1996+" vale para 2026); a linha sem ano não entra. Casos: BCE3001 fora de Polo 2026 e de Ka 2015;
        dentro de Strada 2020 e de Escort 2000. Cada produto de Polo 2026, Gol 2010 e Strada 2020 é aberto e a linha
        que o fez entrar é procurada na tabela (e, com --antes, o que saiu não tem essa linha).
     b) nenhum "Outros veículos e detalhes" na janela da BCE3001 nem em 30 produtos que tinham o bloco (amostra fixa,
        tirada do origin/main 75fdfd8 com a base v28); a linha "Kadet 1996+" na tabela da BCE3001.
     c) a tabela (web-site 346ce3f): não inventa modelo nem marca. BCE3001: sem Modelo "Sedan", "Escort ... Sedan 1997+" e
        "Versailes" como linha; CXD13022: sem Modelo "Pick Up", "147 | Pick Up | 1985–1988"; INT16530: "Citroën Saxo" e
        "Fiat Ducato 2005+" ("após 2005"); em toda a amostra: Versão sem parêntese sem par, Marca sem "/" e sem
        "General Motors" (é Chevrolet). TER5593103 ("GENERAL MOTORS - ... Onix 01/2020 - 12/2023") em Chevrolet Onix 2021.
     Contagens medidas (Polo 2026 = 24, Gol 2010 = 45, Strada 2020 = 63; antes do "após": 21, 43 e 60): valem só para o produtos.json em que foram
     medidas (impressão digital abaixo). Com outro JSON, viram aviso para remedir, e as conferências linha a linha
     continuam valendo.
     d) perdas (escrito pelo testes, sem o código do site): numa amostra fixa de 500 produtos com "ve" (um a cada N, na
        ordem do JSON, e a TER5593103), para cada (marca, modelo) do "ve" em que o texto da aplicação dá ano ao modelo
        (o 1º ano entre 1950 e 2029 depois do nome do modelo com 2 ou mais letras, antes do próximo modelo do "ve" ou do ";"), o produto tem
        de aparecer na busca q=<código> com essa marca, modelo e ano. Com --antes, o caso que já não aparecia antes vira
        aviso (não é perda da T-0033). E toda Marca da tabela, em todos os produtos com "ve", é uma montadora dos "ve".
     e) 3b (aprovado pelo Alexandre): a regra do ano vale na busca digitada. "polo 2026" e "bomba combustivel polo 2026"
        sem a BCE3001, "strada 2020" com ela; cada resultado de "polo 2026" tem o Polo com 2026 (tabela ou texto); "polo" e
        "filtro 2010" iguais às de antes; AMT7005 em Gol 2007 ("Gol / Saveiro 01/1980–12/2009": a "/" divide o ano), pela
        faixa e em "AMORTECEDOR GOL 2007 KYB 441126" com todas as palavras; código e referência com 4 dígitos ("LAM 2010",
        "AXIOS 2025") iguais às de antes.
     E: 390 px sem rolar de lado, console sem erro, busca sem ano e por código/referência iguais às de antes. */

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url); // o Playwright do ambiente está no NODE_PATH
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------- opções ----------
const op = { site: path.join(RAIZ, "site"), antes: "", prints: path.join(RAIZ, "testes", "prints", "ultima-t0033") };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i], v = () => { const x = process.argv[++i]; if (!x) { console.error(`[ERRO] ${a} precisa de um valor`); process.exit(1); } return path.resolve(process.cwd(), x); };
  if (a === "--site") op.site = v(); else if (a === "--antes") op.antes = v(); else if (a === "--prints") op.prints = v();
  else { console.error(`[ERRO] opção desconhecida: ${a}`); process.exit(1); }
}

// ---------- casos ----------
const ALVO = "BCE3001";
const VEIC = {
  polo2026: { vm: "VOLKSWAGEN", vmo: "POLO", va: 2026 },
  ka2015: { vm: "FORD", vmo: "KA", va: 2015 },
  onix2021: { vm: "CHEVROLET", vmo: "ONIX", va: 2021 },
  strada2020: { vm: "FIAT", vmo: "STRADA", va: 2020 },
  escort2000: { vm: "FORD", vmo: "ESCORT", va: 2000 },
  gol2010: { vm: "VOLKSWAGEN", vmo: "GOL", va: 2010 },
  polo: { vm: "VOLKSWAGEN", vmo: "POLO" },
};
// medidas pelo web-site e conferidas pelo testes no JSON abaixo
const CONTAGENS = { polo2026: 24, gol2010: 54, strada2020: 64 }; // web-site ac79a65 ("após AAAA" é AAAA+; "Gol / Saveiro ano" dá o ano aos dois)
// 3b (aprovado pelo Alexandre): a regra do ano vale na busca digitada. [texto, BCE3001 dentro?]; contagens medidas no f4e1a0e (sem "ve": só o ano do trecho do modelo)
const DIGITADAS = [["polo 2026", false], ["bomba combustivel polo 2026", false], ["strada 2020", true]];
const CONT_DIGITADAS = { "polo 2026": 27, "gol 2010": 67, "strada 2020": 69, polo: 156, "filtro 2010": 241 }; // web-site f4e1a0e
const DIGITADAS_IGUAIS = ["polo", "filtro 2010"]; // sem ano de veículo: iguais às de antes
const DIGITAL_MEDIDA = "4419 produtos / 12158 veículos"; // total e soma do "ve" do JSON das medidas (base v28)
// 30 dos 3.089 produtos que mostravam "Outros veículos e detalhes" no origin/main 75fdfd8 (um a cada 103, na ordem do JSON)
const AMOSTRA_BLOCO = ["CXD13062", "CXD13078", "TER555185", "TER5599208", "ROL6304-2Z", "AMT7003", "AMT7151", "AMT7320", "AMT7477",
  "BOL40013", "KB28", "BOR11117", "KAC11928", "KHC129420", "SFR30057", "BIE20093", "JUH70018", "FAC6218", "FAR6127", "TAX10652",
  "JUH70175", "JUH70281", "CUB60101", "CUB60206", "PIV5082", "POL1674", "PAF1346", "INT16512", "ABS4541", "BAN14548DP"];
// código e referência: o 1º resultado
const BUSCAS_COD = [["CXD13062", "CXD13062"], ["CXD 13062", "CXD13062"], ["CXD-13062", "CXD13062"], ["TRW 16900255S", "CXD13062"], ["GI3103", ALVO], ["F000.TE0.103", ALVO],
  // código e referência com 4 dígitos que parecem ano: iguais às de antes (null: só a comparação)
  ["LAM2010", "LAM2010"], ["LAM 2010", null], ["AXIOS 2025", "KAP11227"], ["AXIOS 2018", null], ["2026", null]];
// U4 da UX: detalhe longo na Versão ("Roda Dir/Esq", "(Inclusive Adventure)") e "s/ ABS"; janelas só do depois em 1366
const U4 = ["JUH70013", "ROL0015E"];
const JANELAS_1366 = ["CXD13022", "INT16530", "TER5593103", "TER5599085", "JUH70041"];
// c) linhas que a tabela tem de ter: [código, descrição, (linha) => bool]; e as que não pode ter
const TEM = [
  [ALVO, 'Ford Escort, Versão Sedan, 1997+', (l) => norm(l[0]) === "FORD" && norm(l[1]) === "ESCORT" && /\bSEDAN\b/.test(norm(l[3])) && /^1997\+/.test(l[5])],
  [ALVO, 'Ford Versailes (linha própria)', (l) => norm(l[0]) === "FORD" && norm(l[1]) === "VERSAILES"],
  ["CXD13022", 'Fiat 147, Versão Pick Up, 1985–1988', (l) => norm(l[0]) === "FIAT" && norm(l[1]) === "147" && /^PICK[- ]?UP$/.test(norm(l[3])) && l[5] === "1985–1988"],
  ["INT16530", 'Citroën Saxo (linha própria)', (l) => norm(l[0]) === "CITROEN" && norm(l[1]) === "SAXO"],
  ["INT16530", 'Fiat Ducato 2005+', (l) => norm(l[0]) === "FIAT" && norm(l[1]) === "DUCATO" && /^2005\+/.test(l[5])],
];
const NAO_TEM = [[ALVO, 'Modelo "Sedan"', (l) => norm(l[1]) === "SEDAN"], ["CXD13022", 'Modelo "Pick Up"', (l) => /^PICK[- ]?UP$/.test(norm(l[1]))]];
const parOk = (s) => { let n = 0; for (const ch of s) { if (ch === "(") n++; else if (ch === ")" && --n < 0) return false; } return n === 0; };
// d) perdas: os casos (código, marca, modelo, ano) tirados do texto da aplicação
const N_PERDAS = 500;
const semSinal = (s) => norm(s).replace(/[\s-]/g, "");
const rxModeloTxt = (m) => new RegExp("(?<![A-Z0-9])" + [...semSinal(m)].map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s-]?") + "(?![A-Z0-9])", "g");
const RX_ANO_TXT = /(?<!\d)(19[5-9]\d|20[0-2]\d)(?!\d)/;
// as faixas de ano de um pedaço do texto (sem acento, maiúsculas): "1996–2005", "01/2020 - 12-2023", "1996>", "1996+",
// "APOS 2005", "ATE 2005", "2012/." e o ano sozinho
const RX_FAIXA_TXT = /(?:(APOS|A PARTIR DE|DESDE|ATE)\s+)?(?:\d{2}[\/-])?(19[5-9]\d|20[0-2]\d)(?!\d)(?:\s*(?:–|—|-|\bA\b|\bATE\b)\s*(?:\d{2}[\/-])?(19[5-9]\d|20[0-2]\d)(?!\d)|\s*(>|\+|EM DIANTE|\/\.|\.{2,}|…))?/g;
const faixasDoPedaco = (t) => [...t.matchAll(RX_FAIXA_TXT)].map((m) => m[3] ? [+m[2], +m[3]] : m[4] || /APOS|A PARTIR|DESDE/.test(m[1] || "") ? [+m[2], 9999] : m[1] === "ATE" ? [0, +m[2]] : [+m[2], +m[2]]);
// as ocorrências dos modelos no texto, cada uma com o pedaço até o próximo modelo (ou o ";") e as faixas dele. Modelos
// unidos por "/" ("Gol / Saveiro 1980–2009", "Santana/Quantum 1996>") dividem as faixas do último (decisão do gerente,
// 4ª rodada); na lista com vírgula, não (decisão 1a). O modelo de 1 letra ("L" da Scania, que casa com o "L" de litro)
// fica de fora.
function ocorrencias(p, extra = []) {
  const txt = norm(p.a || ""), mods = [...new Set([...(p.ve || []).map((v) => v[1]), ...extra])].filter((m) => semSinal(m).length >= 2);
  const ocs = [];
  for (const m of mods) for (const r of txt.matchAll(rxModeloTxt(m))) ocs.push({ m, ini: r.index, fim: r.index + r[0].length });
  ocs.sort((a, b) => a.ini - b.ini || b.fim - a.fim);
  // o mais longo vence no mesmo trecho ("Palio Weekend" e não "Palio")
  const boas = ocs.filter((o, i) => !ocs.some((x, j) => j !== i && x.ini <= o.ini && x.fim >= o.fim && x.fim - x.ini > o.fim - o.ini));
  for (const [i, o] of boas.entries()) {
    const prox = boas.slice(i + 1).find((x) => x.ini >= o.fim);
    const ate = prox ? prox.ini : txt.length, pv = txt.indexOf(";", o.fim);
    o.pedaco = txt.slice(o.fim, pv >= 0 && pv < ate ? pv : ate);
    o.prox = pv >= 0 && pv < ate ? null : prox;
    o.faixas = faixasDoPedaco(o.pedaco);
  }
  for (let i = boas.length - 1; i >= 0; i--) {
    const o = boas[i];
    if (!o.faixas.length && o.prox && /^\s*\/\s*$/.test(o.pedaco)) { o.faixas = o.prox.faixas; o.barra = o.prox; }
  }
  return boas;
}
function casosDoTexto(p) {
  const casos = new Map();
  for (const o of ocorrencias(p)) {
    if (!o.faixas.length) continue;
    for (const [vm, vmo] of p.ve.filter((v) => v[1] === o.m).map((v) => [v[0], v[1]])) {
      const [de0, ate0] = o.faixas[0], k = vm + "|" + vmo, va = de0 > 0 ? de0 : ate0; // "até 2008": 2008
      const trecho = (o.m + (o.barra ? " /" + " " + o.barra.m + o.barra.pedaco : o.pedaco)).slice(0, 60).trim();
      if (!casos.has(k)) casos.set(k, { c: p.c, vm, vmo, va, trecho, barra: !!o.barra });
    }
  }
  return [...casos.values()];
}
// o texto dá o ano ao modelo (pela faixa de alguma ocorrência dele)
const textoServe = (p, modelo, ano) => ocorrencias(p, [modelo]).some((o) => semSinal(o.m) === semSinal(modelo) && o.faixas.some(([de, a]) => ano >= de && ano <= a));

const LARGURAS = [[1366, 768], [390, 844]];

const hashVei = (v, q) => "#/busca?" + new URLSearchParams({ ...(q ? { q } : {}), vm: v.vm, vmo: v.vmo, ...(v.va ? { va: String(v.va) } : {}) });
const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s) => semAcento(s).toUpperCase().replace(/\s+/g, " ").trim();
const RX_BLOCO = /outros\s+ve[ií]culos\s+e\s+detalhes/i;

// ---------- resultados ----------
const R = []; // { item, ok: true|false|null, txt }
const conta = (item, ok, txt) => { R.push({ item, ok, txt }); };
const errosConsole = [];
const avisosConsole = new Set();
const largos = [];

// ---------- servidor estático ----------
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon" };
function subir(dir) {
  const srv = createServer((req, res) => {
    let rel; try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end(); return; }
    if (rel.endsWith("/")) rel += "index.html";
    const arq = path.join(dir, rel);
    if (!arq.startsWith(dir + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(arq, (e, b) => { if (e) { res.writeHead(404).end(); return; } res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" }).end(b); });
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok({ srv, base: `http://127.0.0.1:${srv.address().port}/` })));
}

// ---------- navegador ----------
async function abrirSite(browser, dir, [w, h], rotulo) {
  const { srv, base } = await subir(dir);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // como o vigiar() do scripts/testar_site.mjs: erro do próprio site falha; recurso de fora (fonte, mapa...) vira aviso
  // O 404 do /api/eu é o esperado sem o serviço de login (site/conta.js: "Sem o serviço ... /api/eu responde 404");
  // o testar_site.mjs também não o conta (zera os erros depois da 1ª carga).
  const local = (u) => String(u || "").startsWith(base);
  const semLogin = (u, txt) => String(u || "").startsWith(base + "api/eu") && /\b404\b/.test(txt);
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const u = (m.location() || {}).url || "";
    if (semLogin(u, m.text())) return;
    if (u && !local(u)) avisosConsole.add(`recurso de fora: ${u.slice(0, 80)}`);
    else errosConsole.push(`${rotulo} ${w}px: ${m.text().slice(0, 120)}${u ? " (" + u.replace(base, "/") + ")" : ""}`);
  });
  page.on("pageerror", (e) => errosConsole.push(`${rotulo} ${w}px: erro de script: ${e.message.slice(0, 140)}`));
  page.on("requestfailed", (r) => { if (!local(r.url())) avisosConsole.add(`recurso de fora: ${r.url().slice(0, 80)}`); else errosConsole.push(`${rotulo} ${w}px: requisição falhou: ${r.url().replace(base, "/")}`); });
  await page.goto(base + "#/", { waitUntil: "networkidle" });
  await page.waitForSelector("#app *");
  // troca o endereço e espera a tela nova (a marca na tela de antes some quando o site redesenha o #app)
  const ir = async (hash) => {
    if (await page.$("dialog[open]")) { // a janela fecha voltando no histórico: espera ela fechar antes de trocar o endereço
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("dialog[open]"), null, { timeout: 4000 });
      await page.waitForTimeout(300);
    }
    const mudou = await page.evaluate((x) => {
      if (location.hash === x) return false;
      for (const el of document.querySelectorAll("#app > *")) el.dataset.t33 = "1";
      location.hash = x;
      return true;
    }, hash);
    await page.waitForFunction((m) => (!m || !document.querySelector("#app [data-t33]")) && !!document.querySelector("#app .lista, #app .vazio, #app .secao"), mudou, { timeout: 8000 });
    await page.waitForTimeout(150);
  };
  const semRolar = async (onde) => {
    if (w > 400) return;
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) largos.push(`${rotulo} ${onde}: scrollWidth ${sw}`);
  };
  return { page, ctx, ir, semRolar, fechar: async () => { await ctx.close(); srv.close(); } };
}

// a lista inteira (clica "Carregar mais" até acabar): { total, cods, vazio }
async function lista(s, hash) {
  await s.ir(hash);
  for (let i = 0; i < 200; i++) {
    const bt = await s.page.$(".mais button");
    if (!bt) break;
    await bt.click(); await s.page.waitForTimeout(80);
  }
  return s.page.evaluate(() => ({
    total: (document.querySelector(".total") || {}).textContent || "",
    cods: [...document.querySelectorAll(".lista .item")].map((x) => x.dataset.cod),
    vazio: ((document.querySelector(".vazio") || {}).innerText || "").replace(/\s+/g, " ").trim(),
    proximos: !!document.querySelector(".aviso.proximos"),
  }));
}
const numTotal = (t) => +String(t).replace(/\D/g, "") || 0;

// as linhas da tabela da aplicação da página (ou da janela): [marca, modelo, cil, versão, [faixas]] com faixa [de, ate]
async function linhasTabela(page, raiz) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel);
    const t = r && r.querySelector("table.tab-veiculos");
    if (!t) return null;
    const faixa = (x) => {
      x = x.replace(/em diante/i, "").replace(/,$/, "").trim();
      let m;
      if ((m = /^at[ée]\s+(\d{4})$/i.exec(x))) return [0, +m[1]];
      if ((m = /^(\d{4})\s*[–-]\s*(\d{4})$/.exec(x))) return [+m[1], +m[2]];
      if ((m = /^(\d{4})\s*(?:\+|–|-)$/.exec(x))) return [+m[1], 9999];
      if ((m = /^(\d{4})$/.exec(x))) return [+m[1], +m[1]];
      return ["?", x];
    };
    return [...t.querySelectorAll("tbody tr")].map((tr) => {
      const td = [...tr.querySelectorAll("td")];
      const fx = [...td[4].querySelectorAll(".faixa")].map((f) => faixa(f.textContent));
      return [...td.slice(0, 4).map((c) => c.textContent.trim()), fx, td[4].textContent.replace(/\s+/g, " ").trim()];
    });
  }, raiz);
}
const linhaServe = (ls, v) => ls.filter((l) => norm(l[0]) === norm(NOMES_MARCA[v.vm] || v.vm) && norm(l[1]) === v.vmo && l[4].some(([de, ate]) => de !== "?" && v.va >= de && v.va <= ate));
const NOMES_MARCA = { VOLKSWAGEN: "Volkswagen", FORD: "Ford", FIAT: "Fiat", CHEVROLET: "Chevrolet" };

async function abrirJanela(s, cod) {
  await s.ir("#/busca?q=" + encodeURIComponent(cod));
  const bt = s.page.locator(`.lista .item[data-cod="${cod}"]`).locator("a,button", { hasText: /\+\s*Detalhes/i }).first();
  await bt.click();
  await s.page.waitForSelector("dialog[open]", { timeout: 4000 });
  await s.page.waitForTimeout(200);
}

async function print(s, nome, { janela = false } = {}) {
  fs.mkdirSync(op.prints, { recursive: true });
  const arq = path.join(op.prints, nome + ".png");
  if (janela) { // a janela inteira: a altura da tela cresce até caber tudo (o dialog tem max-height de 100vh - 48px)
    const vp = s.page.viewportSize();
    const alt = await s.page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? [...d.children].reduce((a, c) => a + c.scrollHeight, 0) : 0; });
    await s.page.setViewportSize({ width: vp.width, height: Math.max(vp.height, alt + 120) });
    await s.page.waitForTimeout(200);
    await s.page.screenshot({ path: arq });
    await s.page.setViewportSize(vp);
  } else await s.page.screenshot({ path: arq, fullPage: true });
  return path.relative(RAIZ, arq);
}

// ---------- principal ----------
async function main() {
  const { chromium } = require("playwright");
  const jsonDepois = JSON.parse(fs.readFileSync(path.join(op.site, "data", "produtos.json"), "utf8"));
  const prods = jsonDepois.produtos;
  const digital = `${prods.length} produtos / ${prods.reduce((a, p) => a + (p.ve || []).length, 0)} veículos`;
  const mesmoJson = digital === DIGITAL_MEDIDA;
  if (op.antes) {
    const a = fs.readFileSync(path.join(op.antes, "data", "produtos.json")), d = fs.readFileSync(path.join(op.site, "data", "produtos.json"));
    const h = (b) => createHash("sha256").update(b).digest("hex");
    if (h(a) !== h(d)) conta("mesmo produtos.json antes e depois", false, "o produtos.json do --antes é diferente do de --site: a comparação não vale");
  }
  const browser = await chromium.launch();
  const prints = [];
  try {
    for (const tam of LARGURAS) {
      const [w] = tam;
      const D = await abrirSite(browser, op.site, tam, "depois");
      const A = op.antes ? await abrirSite(browser, op.antes, tam, "antes") : null;

      // 1. janela da BCE3001
      await abrirJanela(D, ALVO);
      const txtJ = await D.page.evaluate(() => document.querySelector("dialog[open]").textContent);
      conta(`janela ${ALVO} sem "Outros veículos e detalhes" (${w})`, !RX_BLOCO.test(txtJ) && !(await D.page.$("dialog[open] .apl-resto")), RX_BLOCO.test(txtJ) ? "o bloco ainda aparece" : "sem o bloco");
      const lsJ = await linhasTabela(D.page, "dialog[open]");
      const kadet = (lsJ || []).filter((l) => norm(l[0]) === "CHEVROLET" && norm(l[1]) === "KADET" && /^1996\+/.test(l[5]));
      if (w > 480) conta(`janela ${ALVO}: linha Chevrolet Kadet 1996+ (${w})`, kadet.length === 1, kadet.length ? `achada: ${kadet[0].slice(0, 4).join(" | ")} | ${kadet[0][5]}` : `não achada; linhas: ${(lsJ || []).map((l) => l[1] + " " + l[5]).join("; ")}`);
      else { // até 480 px a tabela vira lista (.lista-veiculos)
        const li = await D.page.evaluate(() => [...document.querySelectorAll("dialog[open] .lista-veiculos li")].map((x) => [...x.children].map((c) => c.textContent.replace(/\s+/g, " ").trim()).join(" · ")));
        const ok = li.some((x) => /^Chevrolet Kadet · Ano 1996\+/.test(x));
        conta(`janela ${ALVO}: Kadet 1996+ na lista do celular (${w})`, ok, ok ? li.find((x) => /Kadet/.test(x)) : "não achada: " + li.filter((x) => /Kadet|Chevrolet/i.test(x)).join("; "));
      }
      await D.semRolar("janela " + ALVO);
      prints.push(await print(D, `depois-${w}-janela-${ALVO}`, { janela: true }));
      if (A) {
        await abrirJanela(A, ALVO);
        const txtA = await A.page.evaluate(() => document.querySelector("dialog[open]").textContent);
        conta(`antes: janela ${ALVO} com o bloco (${w})`, RX_BLOCO.test(txtA), RX_BLOCO.test(txtA) ? "o bloco aparece antes (como esperado)" : "o bloco não aparecia antes?");
        prints.push(await print(A, `antes-${w}-janela-${ALVO}`, { janela: true }));
      }

      // U4 da UX e as janelas da CXD13022 e da INT16530
      for (const c of U4) {
        await abrirJanela(D, c); await D.semRolar("janela " + c);
        prints.push(await print(D, `depois-${w}-janela-${c}`, { janela: true }));
        if (A) { await abrirJanela(A, c); prints.push(await print(A, `antes-${w}-janela-${c}`, { janela: true })); }
      }
      const lOnix = await lista(D, hashVei(VEIC.onix2021, "TER5593103"));
      prints.push(await print(D, `depois-${w}-busca-TER5593103-onix-2021`));
      if (A) { await lista(A, hashVei(VEIC.onix2021, "TER5593103")); prints.push(await print(A, `antes-${w}-busca-TER5593103-onix-2021`)); }
      conta(`TER5593103 dentro de ONIX 2021 (${w})`, lOnix.cods.includes("TER5593103"), lOnix.cods.length ? `veio: ${lOnix.cods.join(", ")}` : lOnix.vazio);
      if (w === 1366) for (const c of JANELAS_1366) { await abrirJanela(D, c); prints.push(await print(D, `depois-${w}-janela-${c}`, { janela: true })); }

      // 2. Polo 2026 e BCE3001 com Polo 2026
      const lpD = await lista(D, hashVei(VEIC.polo2026));
      await D.semRolar("Polo 2026");
      prints.push(await print(D, `depois-${w}-busca-polo-2026`));
      conta(`Polo 2026: ${ALVO} fora da lista (${w})`, !lpD.cods.includes(ALVO), `${lpD.total}; ${ALVO} ${lpD.cods.includes(ALVO) ? "PRESENTE" : "ausente"}`);
      const lbD = await lista(D, hashVei(VEIC.polo2026, ALVO));
      await D.semRolar(`q=${ALVO} + Polo 2026`);
      prints.push(await print(D, `depois-${w}-busca-${ALVO}-polo-2026`));
      conta(`q=${ALVO} + Polo 2026: nada encontrado (${w})`, !lbD.cods.length && /^Nada para/.test(lbD.vazio), lbD.cods.length ? `veio: ${lbD.cods.join(", ")}` : lbD.vazio);
      if (A) {
        const lpA = await lista(A, hashVei(VEIC.polo2026));
        prints.push(await print(A, `antes-${w}-busca-polo-2026`));
        const lbA = await lista(A, hashVei(VEIC.polo2026, ALVO));
        prints.push(await print(A, `antes-${w}-busca-${ALVO}-polo-2026`));
        conta(`antes: Polo 2026 tinha ${ALVO} (${w})`, lpA.cods.includes(ALVO) && lbA.cods.includes(ALVO), `antes ${lpA.total}, depois ${lpD.total}`);
      }

      // busca DIGITADA "polo 2026" (3b): sem a BCE3001; prints de antes e depois
      const QD = "#/busca?q=" + encodeURIComponent("polo 2026");
      const ldD = await lista(D, QD);
      await D.semRolar('digitada "polo 2026"');
      prints.push(await print(D, `depois-${w}-digitada-polo-2026`));
      conta(`digitada "polo 2026": ${ALVO} fora (${w})`, !ldD.cods.includes(ALVO), `${ldD.total}; ${ALVO} ${ldD.cods.includes(ALVO) ? "PRESENTE" : "ausente"}`);
      if (A) {
        const ldA = await lista(A, QD);
        prints.push(await print(A, `antes-${w}-digitada-polo-2026`));
        conta(`antes: digitada "polo 2026" (${w})`, null, `antes ${ldA.total} (${ALVO} ${ldA.cods.includes(ALVO) ? "presente" : "ausente"}), depois ${ldD.total}`);
      }

      if (w !== 1366) { await D.fechar(); if (A) await A.fechar(); continue; }

      // 9. busca digitada (3b)
      const POR_COD = new Map(prods.map((p) => [p.c, p]));
      const dig = {};
      for (const q of new Set([...DIGITADAS.map((x) => x[0]), ...Object.keys(CONT_DIGITADAS)])) dig[q] = await lista(D, "#/busca?q=" + encodeURIComponent(q));
      for (const [q, dentro] of DIGITADAS) conta(`digitada "${q}": ${ALVO} ${dentro ? "dentro" : "fora"}`, dig[q].cods.includes(ALVO) === dentro, `${dig[q].total}; ${ALVO} ${dig[q].cods.includes(ALVO) ? "presente" : "ausente"}`);
      for (const [q, n] of Object.entries(CONT_DIGITADAS)) {
        const m = numTotal(dig[q].total);
        conta(`digitada "${q}" = ${n}`, mesmoJson ? m === n : null, mesmoJson ? `medido: ${m}` : `JSON diferente do da medida: ${m}. Remeça.`);
      }
      if (A) for (const q of DIGITADAS_IGUAIS) {
        const lA = await lista(A, "#/busca?q=" + encodeURIComponent(q));
        conta(`digitada "${q}" igual à de antes`, lA.cods.join() === dig[q].cods.join(), `antes ${lA.total}, depois ${dig[q].total}`);
      }
      // cada resultado de "polo 2026": o Polo tem o ano 2026 pela tabela (Modelo Polo...) ou pelo texto da aplicação
      const semPolo = [];
      for (const c of dig["polo 2026"].cods) {
        await D.ir("#/produto/" + encodeURIComponent(c));
        const ls = (await linhasTabela(D.page, "#app")) || [];
        const pelaTabela = ls.some((l) => /^POLO\b/.test(norm(l[1])) && l[4].some(([de, ate]) => de !== "?" && 2026 >= de && 2026 <= ate));
        if (!pelaTabela && !textoServe(POR_COD.get(c), "Polo", 2026)) semPolo.push(`${c} (${ls.filter((l) => /^POLO\b/.test(norm(l[1]))).map((l) => l[1] + " " + (l[5] || "sem ano")).join(", ") || "sem linha Polo"})`);
      }
      conta('digitada "polo 2026": todo resultado tem o Polo com 2026 (tabela ou texto)', !semPolo.length, semPolo.length ? semPolo.join("; ") : `${dig["polo 2026"].cods.length} produtos conferidos`);
      // AMT7005 em Gol 2007 ("Gol / Saveiro 01/1980–12/2009"), pela faixa e digitada com todas as palavras
      const lAmt = await lista(D, hashVei({ vm: "VOLKSWAGEN", vmo: "GOL", va: 2007 }, "AMT7005"));
      conta("AMT7005 em Volkswagen Gol 2007 (faixa)", lAmt.cods.includes("AMT7005"), lAmt.cods.length ? `veio: ${lAmt.cods.join(", ")}` : lAmt.vazio);
      const lAmtD = await lista(D, "#/busca?q=" + encodeURIComponent("AMORTECEDOR GOL 2007 KYB 441126"));
      conta('"AMORTECEDOR GOL 2007 KYB 441126" → AMT7005 com todas as palavras', lAmtD.cods[0] === "AMT7005" && !lAmtD.proximos, `1º = ${lAmtD.cods[0] || "nada"} (${lAmtD.total})${lAmtD.proximos ? '; com o aviso "mais próximos"' : "; todas as palavras"}`);

      // 3. os outros casos da BCE3001
      for (const [k, dentro, cod = ALVO] of [["ka2015", false], ["strada2020", true], ["escort2000", true], ["onix2021", true, "TER5593103"]]) {
        const l = await lista(D, hashVei(VEIC[k], cod));
        const v = VEIC[k];
        conta(`${cod} ${dentro ? "dentro de" : "fora de"} ${v.vmo} ${v.va}`, l.cods.includes(cod) === dentro, l.cods.length ? `veio: ${l.cods.join(", ")}` : l.vazio);
      }

      // 4. contagens e, produto a produto, a linha que o fez entrar
      const listas = {};
      for (const k of ["polo2026", "gol2010", "strada2020"]) {
        const v = VEIC[k], l = await lista(D, hashVei(v));
        listas[k] = l;
        const n = numTotal(l.total);
        if (n !== l.cods.length) conta(`${v.vmo} ${v.va}: total = cartões`, false, `total "${l.total}" e ${l.cods.length} cartões`);
        if (mesmoJson) conta(`contagem ${v.vmo} ${v.va} = ${CONTAGENS[k]}`, n === CONTAGENS[k], `medido: ${n}`);
        else conta(`contagem ${v.vmo} ${v.va} = ${CONTAGENS[k]}`, null, `JSON diferente do da medida (${digital}; medida em ${DIGITAL_MEDIDA}): ${n}. Remeça.`);
      }
      for (const k of ["polo2026", "gol2010", "strada2020"]) {
        const v = VEIC[k], sem = [];
        for (const c of listas[k].cods) {
          await D.ir("#/produto/" + encodeURIComponent(c));
          const ls = await linhasTabela(D.page, "#app");
          if (!ls || !linhaServe(ls, v).length) sem.push(`${c} (${ls ? ls.filter((l) => norm(l[1]) === v.vmo).map((l) => l[5] || "sem ano").join(", ") || "sem linha do modelo" : "sem tabela"})`);
        }
        conta(`${v.vmo} ${v.va}: todo resultado tem a linha ${v.vmo} com o ano`, !sem.length, sem.length ? `sem a linha: ${sem.join("; ")}` : `${listas[k].cods.length} produtos conferidos na tabela`);
      }

      // 5. b) a amostra de 30 que tinha o bloco
      const comBloco = [];
      for (const c of AMOSTRA_BLOCO) {
        await D.ir("#/produto/" + encodeURIComponent(c));
        const t = await D.page.evaluate(() => document.querySelector("#app").textContent);
        if (RX_BLOCO.test(t) || (await D.page.$("#app .apl-resto"))) comBloco.push(c);
      }
      conta(`nenhum "Outros veículos e detalhes" (amostra de ${AMOSTRA_BLOCO.length})`, !comBloco.length, comBloco.length ? `com o bloco: ${comBloco.join(", ")}` : `${AMOSTRA_BLOCO.length} páginas sem o bloco`);

      // 5c. c) a tabela não inventa modelo nem marca; parêntese com par
      const tabs = new Map();
      for (const c of [...new Set([ALVO, ...JANELAS_1366, ...U4, "TER5593103", ...AMOSTRA_BLOCO])]) {
        await D.ir("#/produto/" + encodeURIComponent(c));
        tabs.set(c, (await linhasTabela(D.page, "#app")) || []);
      }
      const fmtL = (l) => `${l.slice(0, 4).join(" | ")} | ${l[5]}`;
      for (const [c, txt, f] of TEM) { const ls = tabs.get(c).filter(f); conta(`${c}: linha ${txt}`, ls.length > 0, ls.length ? fmtL(ls[0]) : `não achada; linhas: ${tabs.get(c).map((l) => l[1] + " " + l[3]).join("; ")}`); }
      for (const [c, txt, f] of NAO_TEM) { const ls = tabs.get(c).filter(f); conta(`${c}: nenhum ${txt}`, !ls.length, ls.length ? ls.map(fmtL).join("; ") : "nenhum"); }
      const regra = (nome, f) => { const ruins = [...tabs].flatMap(([c, ls]) => ls.filter(f).map((l) => `${c}: ${fmtL(l)}`)); conta(`${nome} (${tabs.size} produtos)`, !ruins.length, ruins.length ? `${ruins.length} linha(s): ${ruins.slice(0, 4).join("; ")}` : "nenhuma"); };
      regra("nenhuma Versão com parêntese sem par", (l) => !parOk(l[3]) || !parOk(l[1]));
      regra('nenhuma Marca com "/" (marca inventada)', (l) => l[0].includes("/"));
      regra('nenhuma Marca "General Motors" (é Chevrolet)', (l) => norm(l[0]) === "GENERAL MOTORS");

      // 6. busca por código e por referência
      for (const [q, esp] of BUSCAS_COD) {
        const lD = await lista(D, "#/busca?q=" + encodeURIComponent(q));
        let ok = esp === null || lD.cods[0] === esp, txt = `1º = ${lD.cods[0] || "nada"} (${lD.total})`;
        if (A) {
          const lA = await lista(A, "#/busca?q=" + encodeURIComponent(q));
          const igual = lA.cods.join() === lD.cods.join();
          ok = ok && igual;
          txt += igual ? "; igual à de antes" : `; DIFERENTE da de antes (${lA.cods.slice(0, 5).join(", ")}…)`;
        }
        conta(`busca "${q}"${esp ? " → " + esp : " igual à de antes"}`, A || esp ? ok : null, A || esp ? txt : `sem --antes: ${txt}`);
      }

      // 7. sem ano: igual à de antes; e, com --antes, o que saiu de Polo 2026 / Gol 2010 / Strada 2020 não tem a linha
      const sD = await lista(D, hashVei(VEIC.polo));
      if (A) {
        const sA = await lista(A, hashVei(VEIC.polo));
        conta("Polo sem ano igual à de antes", sA.total === sD.total && sA.cods.join() === sD.cods.join(), `antes ${sA.total}, depois ${sD.total}`);
        for (const k of ["polo2026", "gol2010", "strada2020"]) {
          const v = VEIC[k], lA = await lista(A, hashVei(v));
          const sairam = lA.cods.filter((c) => !listas[k].cods.includes(c)), entraram = listas[k].cods.filter((c) => !lA.cods.includes(c));
          const indevidos = [];
          for (const c of sairam) {
            await D.ir("#/produto/" + encodeURIComponent(c));
            const ls = await linhasTabela(D.page, "#app");
            if (ls && linhaServe(ls, v).length) indevidos.push(c);
          }
          // o que entrou (ex.: "após 2005") já foi conferido na tabela no item 4
          conta(`${v.vmo} ${v.va}: o que saiu não tem a linha com o ano`, !indevidos.length,
            `antes ${lA.cods.length}, depois ${listas[k].cods.length}; saíram ${sairam.length}${entraram.length ? `; entraram ${entraram.join(", ")}` : ""}${indevidos.length ? `; saíram COM a linha: ${indevidos.join(", ")}` : ""}`);
        }
      } else conta("Polo sem ano igual à de antes", null, `sem --antes: não conferido (depois ${sD.total})`);

      // 8. d) perdas e as Marcas da tabela
      const comVe = prods.filter((p) => p.ve && p.ve.length);
      const passo = Math.max(1, Math.floor(comVe.length / N_PERDAS));
      const amostra = [...new Set([...comVe.filter((_, i) => i % passo === 0).slice(0, N_PERDAS), comVe.find((p) => p.c === "TER5593103")].filter(Boolean))];
      const casos = amostra.flatMap(casosDoTexto);
      const achou = async (S, x) => { const l = await lista(S, hashVei(x, x.c)); return l.cods.includes(x.c); };
      const perdidos = [], jaAntes = [];
      for (const x of casos) {
        if (await achou(D, x)) continue;
        if (A && !(await achou(A, x))) jaAntes.push(x); else perdidos.push(x);
      }
      const fmtC = (x) => `${x.c} ${x.vm} ${x.vmo} ${x.va} («${x.trecho}»)`;
      conta(`perdas: ${casos.length} casos (marca, modelo, ano do texto) em ${amostra.length} produtos`, !perdidos.length,
        perdidos.length ? `${perdidos.length} perdido(s): ${perdidos.slice(0, 15).map(fmtC).join("; ")}` : `0 perdido (${casos.filter((x) => x.barra).length} casos "Modelo1 / Modelo2 ano")${casos.some((x) => x.c === "TER5593103" && x.vmo === "Onix") ? " (TER5593103 Onix incluída)" : ""}`);
      if (jaAntes.length) conta("perdas: casos que já não apareciam antes", null, `${jaAntes.length}: ${jaAntes.slice(0, 5).map(fmtC).join("; ")}`);
      const montadoras = new Set(comVe.flatMap((p) => p.ve.map((v) => semSinal(v[0]))));
      const fora = [];
      for (const p of comVe) {
        await D.ir("#/produto/" + encodeURIComponent(p.c));
        for (const l of (await linhasTabela(D.page, "#app")) || []) if (!montadoras.has(semSinal(l[0]))) fora.push(`${p.c}: ${l[0]} | ${l[1]}`);
      }
      conta(`toda Marca da tabela é montadora dos "ve" (${comVe.length} produtos)`, !fora.length, fora.length ? `${fora.length} linha(s): ${fora.slice(0, 6).join("; ")}` : `0 fora das ${montadoras.size} montadoras`);
      await D.fechar(); if (A) await A.fechar();
    }
  } finally { await browser.close(); }

  conta("390 px sem rolar de lado", !largos.length, largos.length ? largos.join("; ") : "scrollWidth <= 390 em todas as telas de 390 px");
  conta("console sem erro", !errosConsole.length, errosConsole.length ? errosConsole.slice(0, 8).join(" | ") : "nenhum erro do site");
  if (avisosConsole.size) conta("console: recursos de fora", null, [...avisosConsole].slice(0, 4).join(" | "));

  const falhas = R.filter((r) => r.ok === false);
  console.log(`Testes T-0033 · ${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Manaus", dateStyle: "short", timeStyle: "short" }).format(new Date()).replace(",", "")} (Manaus) · JSON: ${digital}`);
  for (const r of R) console.log(`${r.ok === true ? "PASSOU" : r.ok === false ? "FALHOU" : "AVISO "} · ${r.item}: ${r.txt}`);
  console.log(`prints (${prints.length}): ${path.relative(RAIZ, op.prints)}/`);
  console.log(falhas.length ? `RESULTADO: FALHOU (${falhas.length})` : "RESULTADO: PASSOU");
  process.exit(falhas.length ? 1 : 0);
}

main().catch((e) => { console.error("[ERRO] o teste não terminou: " + ((e && e.stack) || e)); process.exit(1); });
