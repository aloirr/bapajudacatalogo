#!/usr/bin/env node
/* Testes automáticos do catálogo online BAP (T-0002, 20/11/2026). Dono: agente testes.

   Uso (na raiz do repositório, depois de gerar os dados com scripts/gerar_site.py):
     node scripts/testar_site.mjs                                     # tudo conta
     node scripts/testar_site.mjs --conhecidos testes/conhecidos.json # ignora só os achados já abertos em tarefa
   Opções:
     --conhecidos <arquivo>  lista dos achados já abertos em tarefa (ver testes/conhecidos.json). Eles aparecem
                             como "CONHECIDO (T-nnnn)" e não mudam o código de saída. Sem a opção, tudo conta.
     --json <arquivo>        testa outro produtos.json no lugar de site/data/produtos.json (o servidor entrega
                             esse arquivo em data/produtos.json). Serve para as provas com cópia temporária.
     --prints <pasta>        onde gravar os prints (padrão: testes/prints/ultima).
     --sem-navegador         só os testes do JSON (palavra interna, campos, total), sem abrir o Chromium.

   O que testa: palavra interna no JSON; campos e total do JSON; servidor estático de site/ numa porta livre;
   a busca de um campo só (q) da T-0011, palavra por palavra: código (exato em 1º, com e sem espaço ou hífen),
   referência cruzada, veículo (montadora + modelo + ano, sem Golf no Gol), geral (texto livre), os exemplos da
   diretriz (lista estrita, outra ordem, minúsculas, os mais próximos, marca concorrente, código BAP e EAN exatos)
   e sem resultado; os links antigos (#/busca?cod=, mo=, modelo=, ano=) viram q; as 2 abas (código, descrição ou
   aplicação; placa com campo e botão, sem consultar o serviço) com setas, Home e End; página do produto (foto, aplicação, referências, ficha
   técnica, ofereça junto, sem preço nem estoque); 390 px sem rolar de lado; console sem erro; acessibilidade
   básica; prints em 1366 × 768 e 390 × 844.
   Saída: 0 se passou (ou se só sobraram os conhecidos, com --conhecidos) e 1 se falhou. */

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url); // o Playwright do ambiente está no NODE_PATH (só o require o enxerga)
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(RAIZ, "site");
const PRINTS_PADRAO = path.join(RAIZ, "testes", "prints", "ultima");

// ---------- opções ----------
const erroUso = (msg) => Object.assign(new Error(msg), { uso: true }); // erro de uso: sai sem a pilha
function lerOpcoes(argv) {
  const o = { conhecidos: "", json: "", prints: PRINTS_PADRAO, semNavegador: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const valor = () => {
      const v = argv[++i];
      if (!v) throw erroUso(`a opção ${a} precisa de um valor`);
      return path.resolve(process.cwd(), v);
    };
    if (a === "--conhecidos") o.conhecidos = valor();
    else if (a === "--json") o.json = valor();
    else if (a === "--prints") o.prints = valor();
    else if (a === "--sem-navegador") o.semNavegador = true;
    else if (a === "-h" || a === "--help") { console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]); process.exit(0); }
    else throw erroUso(`opção desconhecida: ${a}`);
  }
  return o;
}

// ---------- utilidades ----------
const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s) => semAcento(s).toUpperCase().replace(/\s+/g, " ").trim();
const normCod = (s) => semAcento(s).toUpperCase().replace(/[^A-Z0-9]/g, "");
const fmt = (n) => Number(n).toLocaleString("pt-BR");
const agoraManaus = () => new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Manaus", dateStyle: "short", timeStyle: "short" }).format(new Date()).replace(",", "");
const cortar = (s, n = 70) => { s = String(s ?? "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

// Palavra interna (sem acento e sem diferença de maiúscula). A fronteira "(?<![A-Z0-9])…(?![A-Z0-9])" trata o "_"
// como separador, para "CUSTO_COMPRA" também ser pego.
// "custo" só como palavra inteira (decisão 5a do Alexandre, recado R-20261120-093235-alexandre: "Custom" não conta).
// [SUPOSIÇÃO] o plural "custos" conta como a mesma palavra. As outras palavras valem em qualquer lugar do texto.
const PALAVRAS = [
  ["estoque", /ESTOQUE/],
  ["preço", /PRECO/],
  ["FOB", /FOB/],
  ["USD", /USD/],
  ["MOQ", /MOQ/],
  ["BAP BOX", /BAP\s*BOX/],
  ["custo", /(?<![A-Z0-9])CUSTOS?(?![A-Z0-9])/],
  ["ranking", /RANKING/],
  ["fornecedor", /FORNECEDOR/],
  ["LINHA_ORIGEM", /LINHA[_ ]?ORIGEM/],
  ["OBS_INTERNA", /OBS[_ ]?INTERNA/],
  ["R$", /R\s?\$/],
];
// Texto de um produto para a varredura: as chaves e os valores JÁ DECODIFICADOS, percorrendo o objeto. Não use o
// JSON.stringify: nele a quebra de linha vira os caracteres "\n", colados na palavra seguinte ("\nCUSTO" escaparia
// da fronteira de palavra). Cada valor fica separado por " | ".
function textoDe(v) {
  const partes = [];
  (function andar(x) {
    if (x == null) return;
    if (Array.isArray(x)) x.forEach(andar);
    else if (typeof x === "object") for (const [k, y] of Object.entries(x)) { partes.push(k); andar(y); }
    else partes.push(String(x));
  })(v);
  return partes.join(" | ");
}
// vale para o texto do JSON (textoDe) e para o texto da tela do produto; quebra de linha e tab viram espaço
function palavrasInternas(texto) {
  const t = semAcento(texto).toUpperCase().replace(/\s+/g, " ");
  const achou = [];
  for (const [nome, rx] of PALAVRAS) {
    const m = t.match(rx);
    if (m) {
      const i = m.index;
      achou.push({ nome, trecho: cortar(t.slice(Math.max(0, i - 25), i + m[0].length + 25), 80) });
    }
  }
  return achou;
}
// campos que o gerar_site.py grava em cada produto (docs/DADOS_DO_SITE.md); campo novo = conferir antes
const CAMPOS = new Set(["c", "d", "a", "r", "x", "mo", "p", "ca", "si", "fa", "li", "po", "la", "de", "df", "oj", "ip", "an", "i"]);
const palavraInteira = (texto, palavra) => new RegExp(`(?<![A-Z0-9])${palavra}(?![A-Z0-9])`).test(norm(texto));

// ---------- resultados ----------
const TESTES = []; // { id, nome, detalhe, falhas: [{chave, txt}], avisos: [] }
function teste(id, nome) {
  let t = TESTES.find((x) => x.id === id);
  if (!t) { t = { id, nome, detalhe: "", falhas: [], avisos: [] }; TESTES.push(t); }
  return t;
}
function falha(id, nome, chave, txt) {
  const t = teste(id, nome);
  const ja = t.falhas.find((f) => f.chave === chave);
  if (ja) { if (!ja.txt.includes(txt)) ja.txt += " | " + txt; } else t.falhas.push({ chave, txt });
}
const aviso = (id, nome, txt) => { const t = teste(id, nome); if (!t.avisos.includes(txt)) t.avisos.push(txt); };
const detalhe = (id, nome, txt) => { teste(id, nome).detalhe = txt; };

// ---------- servidor estático ----------
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp" };
function subirServidor(jsonTroca) {
  const srv = createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { res.writeHead(400).end(); return; }
    if (rel.endsWith("/")) rel += "index.html";
    let arq = path.join(SITE, rel);
    if (arq !== SITE && !arq.startsWith(SITE + path.sep)) { res.writeHead(403).end(); return; }
    if (jsonTroca && rel === "/data/produtos.json") arq = jsonTroca;
    fs.readFile(arq, (err, buf) => {
      if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("não achei"); return; }
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(arq).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" }).end(buf);
    });
  });
  return new Promise((ok, erro) => { srv.once("error", erro); srv.listen(0, "127.0.0.1", () => ok(srv)); });
}

// ---------- 1. o JSON ----------
function testarJson(arqJson) {
  const N_TOTAL = "total do JSON", N_PAL = "palavra interna", N_CAMPOS = "campos do JSON";
  teste("json", N_TOTAL);
  let dados;
  try { dados = JSON.parse(fs.readFileSync(arqJson, "utf8")); }
  catch (e) { falha("json", N_TOTAL, "leitura", `não li ${path.relative(RAIZ, arqJson) || arqJson}: ${e.message}`); return null; }
  const prods = Array.isArray(dados.produtos) ? dados.produtos : [];
  if (!prods.length) falha("json", N_TOTAL, "vazio", "o JSON não tem produtos");
  if (dados.total !== prods.length) falha("json", N_TOTAL, "total", `"total" diz ${dados.total}, mas há ${prods.length} produtos`);
  // queda grande sem a tarefa pedir = falha. Compara com o JSON do commit (HEAD). [SUPOSIÇÃO] limite de 5%.
  let antes = null;
  try {
    const txt = execFileSync("git", ["-C", RAIZ, "show", "HEAD:site/data/produtos.json"], { maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8");
    antes = (JSON.parse(txt).produtos || []).length;
  } catch { aviso("json", N_TOTAL, "não comparei com o JSON do commit (sem git ou sem o arquivo no HEAD)"); }
  if (antes && prods.length < antes * 0.95) falha("json", N_TOTAL, "queda", `caiu de ${fmt(antes)} (HEAD) para ${fmt(prods.length)} produtos, mais de 5%`);
  // o site acha o produto pelo código sem espaço, ponto e hífen (normCod do app.js): dois códigos iguais depois
  // disso dividem a mesma página, e o link de um abre o outro. Chave: "colide:<código>=<código>", em ordem alfabética
  // (não depende da ordem do JSON)
  const N_UNI = "código único no site", vistos = new Map();
  for (const p of prods) {
    const k = normCod(p.c);
    if (!p.c) falha("unico", N_UNI, "sem-codigo", "produto sem código: " + cortar(JSON.stringify(p), 60));
    else if (vistos.has(k)) falha("unico", N_UNI, "colide:" + [vistos.get(k), p.c].sort().join("="), `${vistos.get(k)} e ${p.c} viram "${k}": #/produto/${vistos.get(k)} abre o ${p.c}`);
    vistos.set(k, p.c);
  }
  teste("unico", N_UNI);
  detalhe("json", N_TOTAL, `${fmt(prods.length)} produtos, gerado em ${dados.gerado_em || "?"}` + (antes != null ? `; no commit: ${fmt(antes)}` : ""));
  // campos
  const novos = new Map();
  for (const p of prods) for (const k of Object.keys(p)) if (!CAMPOS.has(k)) novos.set(k, (novos.get(k) || []).concat(p.c));
  for (const [k, cods] of novos) falha("campos", N_CAMPOS, "campo:" + k, `campo "${k}" fora da lista em ${cods.length} produto(s), ex.: ${cods.slice(0, 3).join(", ")}`);
  detalhe("campos", N_CAMPOS, novos.size ? "" : `só os ${CAMPOS.size} campos conhecidos`);
  // palavra interna: cabeçalho e cada produto
  const cab = { ...dados }; delete cab.produtos;
  for (const a of palavrasInternas(textoDe(cab))) falha("palavra", N_PAL, `${a.nome}:(cabeçalho)`, `(cabeçalho do JSON) "${a.nome}": …${a.trecho}…`);
  for (const p of prods) {
    for (const a of palavrasInternas(textoDe(p))) falha("palavra", N_PAL, `${a.nome}:${p.c}`, `${p.c} "${a.nome}": …${a.trecho}…`);
  }
  teste("palavra", N_PAL);
  return { dados, prods, porCod: new Map(prods.map((p) => [normCod(p.c), p])) };
}

// ---------- 2. o site no navegador ----------
async function testarSite(base, ctxJson, dirPrints) {
  const { chromium } = require("playwright");
  const { prods, porCod } = ctxJson;
  const existe = (c) => porCod.has(normCod(c));
  fs.mkdirSync(dirPrints, { recursive: true });
  if (path.resolve(dirPrints) === PRINTS_PADRAO) for (const f of fs.readdirSync(dirPrints)) if (f.endsWith(".png")) fs.rmSync(path.join(dirPrints, f));

  // casos tirados do JSON do dia; se um sumir, o teste diz qual
  const COD = "CXD13062";
  const pCod = porCod.get(normCod(COD));
  const refTrw = pCod && (pCod.r || []).find((r) => norm(r.m) === "TRW");
  const refNak = pCod && (pCod.r || []).find((r) => norm(r.m).startsWith("NAKATA"));
  const comFoto = porCod.get(normCod("AMT7115"))?.i ? porCod.get(normCod("AMT7115"))
    : prods.find((p) => p.i && p.a && p.r && p.x && p.oj);
  // exemplos da diretriz da T-0011: AMT7005 (Gol 1980 a 2009, KYB 441126) e o EAN do TER551011
  const pAmt = porCod.get(normCod("AMT7005"));
  const temKyb = pAmt && (pAmt.r || []).some((r) => norm(r.m) === "KYB" && String(r.c).split(/[,;]\s*/).map(normCod).includes("441126"));
  const pTer = porCod.get(normCod("TER551011"));
  const ean = pTer && ((pTer.x || []).find(([k]) => norm(k) === "CODIGO DE BARRAS") || [])[1];
  const casosSumidos = [];
  if (!pCod) casosSumidos.push(COD);
  if (!pAmt || !temKyb) casosSumidos.push("AMT7005 com a referência KYB 441126");
  if (!ean) casosSumidos.push("TER551011 com o código de barras");
  if (!existe("CL14")) casosSumidos.push("CL14");
  if (!refTrw) casosSumidos.push(`referência TRW do ${COD}`);
  if (!existe("TER556556")) casosSumidos.push("TER556556");
  for (const c of casosSumidos) falha("casos", "casos do JSON", c, `o caso ${c} não está mais no JSON: escolher outro no scripts/testar_site.mjs`);
  // amostra de códigos espalhados pelo catálogo (sem os que colidem depois de tirar espaço e hífen)
  const vezes = new Map();
  for (const p of prods) vezes.set(normCod(p.c), (vezes.get(normCod(p.c)) || 0) + 1);
  const unicos = prods.filter((p) => vezes.get(normCod(p.c)) === 1);
  const passo = Math.max(1, Math.floor(unicos.length / 8));
  const amostra = unicos.filter((_, i) => i % passo === Math.floor(passo / 2)).slice(0, 8).map((p) => p.c);
  detalhe("casos", "casos do JSON", `código ${COD}; referência ${refTrw ? "TRW " + refTrw.c : "?"}${refNak ? " e " + refNak.m + " " + refNak.c : ""}; veículo VOLKSWAGEN/Gol/2018; diretriz AMT7005 (KYB 441126), CL14 e EAN ${ean || "?"} (TER551011); ` +
    `geral "amortecedor dianteiro Onix" e "15W40"; produto com foto ${comFoto ? comFoto.c : "?"}; amostra ${amostra.join(", ")}`);

  const browser = await chromium.launch();
  try {
    for (const [larg, alt] of [[1366, 768], [390, 844]]) {
      const L = `${larg} px`;
      const ctx = await browser.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: 1 });
      // o serviço de placas (T-0005) nunca é chamado de verdade no teste: a rota responde 503 aqui mesmo
      // [SUPOSIÇÃO] o site só chama o serviço quando o cliente busca uma placa; chamada sem a busca vira aviso.
      await ctx.route(/bapajudacatalogo-placas\.onrender\.com|\/veiculo(\?|$)/, (rota) => {
        aviso("abas", "abas da busca", `o site chamou o serviço de placas sem busca de placa: ${cortar(rota.request().url().replace(/[?#].*$/, ""), 70)} (respondido 503 no teste, sem rede)`);
        return rota.fulfill({ status: 503, contentType: "application/json", body: '{"erro":"teste: serviço de placas desligado"}' });
      });
      const page = await ctx.newPage();
      let erros = [];
      const local = (u) => String(u || "").startsWith(base);
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const u = (m.location() || {}).url || "";
        if (u && !local(u)) aviso("console", "console sem erro", `erro de recurso de fora (${cortar(u, 60)}): ${cortar(m.text(), 80)}`);
        else erros.push(cortar(m.text(), 120));
      });
      page.on("pageerror", (e) => erros.push("erro de script: " + cortar(e.message, 120)));
      page.on("requestfailed", (r) => {
        const txt = `requisição falhou: ${cortar(r.url(), 80)} ${(r.failure() || {}).errorText || ""}`;
        if (local(r.url())) erros.push(txt); else aviso("console", "console sem erro", txt);
      });

      const esperarImagens = () => page.evaluate(() => Promise.race([
        Promise.all([...document.images].filter((i) => !i.complete && i.loading !== "lazy").map((i) => new Promise((r) => { i.addEventListener("load", r); i.addEventListener("error", r); }))),
        new Promise((r) => setTimeout(r, 3000)),
      ]));
      // abre uma rota do site (#/...) e confere console e largura
      async function abrir(nome, hash) {
        erros = [];
        await page.evaluate((h) => new Promise((ok) => {
          if (location.hash === h) { ok(); return; }
          window.addEventListener("hashchange", () => setTimeout(ok, 30), { once: true });
          location.hash = h;
        }), hash);
        // link antigo (#/busca?cod=, mo=, modelo=, ano=, até a T-0011): o site troca para #/busca?q=... (location.replace)
        if (/^#\/busca\?(.*&)?(cod|mo|modelo|ano)=/.test(hash)) {
          const ok = await page.waitForFunction(() => !/[?&](cod|mo|modelo|ano)=/.test(location.hash) && /[?&]q=/.test(location.hash), null, { timeout: 5000 }).then(() => true, () => false);
          if (!ok) falha("rota-antiga", "link antigo redireciona", nome + ":" + hash, `${L}: "${hash}" não virou #/busca?q=... (ficou "${await page.evaluate(() => location.hash)}")`);
          await page.waitForTimeout(50);
        }
        await esperarImagens();
        const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, carregando: !!document.getElementById("carregando") }));
        if (info.carregando) falha("abrir", "site abre", nome, `${L}: "${hash}" ficou em "Carregando o catálogo"`);
        if (larg === 390 && info.sw > 390) falha("largura", "390 px sem rolar de lado", nome, `${nome}: scrollWidth = ${info.sw}`);
        return info;
      }
      function conferirConsole(nome) {
        for (const e of erros) falha("console", "console sem erro", `${nome}:${e}`, `${L} ${nome}: ${e}`);
        erros = [];
      }
      const print = (nome) => page.screenshot({ path: path.join(dirPrints, `${nome}-${larg}.png`) });
      const listaTodos = async () => {
        for (let i = 0; i < 400; i++) { const b = await page.$(".mais button"); if (!b) break; await b.click(); }
        return page.evaluate(() => ({
          total: (document.querySelector(".total") || {}).textContent || "",
          vazio: (document.querySelector(".vazio") || {}).textContent || "",
          proximos: (document.querySelector(".proximos") || {}).textContent || "", // aviso "Estes são os mais próximos"
          itens: [...document.querySelectorAll(".lista .item")].map((e) => ({ c: (e.querySelector(".cod") || {}).textContent || "", t: e.innerText })),
        }));
      };
      const primeiros = () => page.evaluate(() => [...document.querySelectorAll(".lista .item .cod")].slice(0, 5).map((e) => e.textContent));
      const totalTela = () => page.evaluate(() => parseInt(((document.querySelector(".total") || {}).textContent || "").replace(/\D/g, ""), 10) || 0);

      // ---- início ----
      erros = [];
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 15000 }).catch(() => {});
      await abrir("inicio", "#/");
      const hero = await page.evaluate(() => (document.querySelector(".hero-num b") || {}).textContent || "");
      if (parseInt(hero.replace(/\D/g, ""), 10) !== prods.length) falha("abrir", "site abre", "inicio-total", `${L}: o início mostra "${hero}" produtos, o JSON tem ${prods.length}`);
      conferirConsole("inicio");
      await print("inicio");

      // ---- busca por código (T-0011: um campo só, q; o código exato vem sempre em 1º, decisão 4a) ----
      const N_COD = "busca código";
      if (pCod) {
        const variantes = [COD, COD.replace(/^([A-Z]+)(\d+)$/, "$1 $2"), COD.replace(/^([A-Z]+)(\d+)$/, "$1-$2"), COD.toLowerCase()];
        for (const v of variantes) {
          await abrir("busca-codigo", "#/busca?q=" + encodeURIComponent(v));
          const pr = await primeiros();
          if (pr[0] !== COD) falha("codigo", N_COD, v, `"${v}": 1º = ${pr[0] || "nada"} (esperado ${COD})`);
          if (v === COD) await print("busca-codigo");
          conferirConsole("busca-codigo");
        }
        // link antigo da aba Código: #/busca?cod= vira #/busca?q= e dá o mesmo 1º
        for (const v of [COD, COD.replace(/^([A-Z]+)(\d+)$/, "$1-$2")]) {
          await abrir("busca-codigo-antiga", "#/busca?cod=" + encodeURIComponent(v));
          const pr = await primeiros();
          if (pr[0] !== COD) falha("codigo", N_COD, "antiga:" + v, `link antigo #/busca?cod=${v}: 1º = ${pr[0] || "nada"} (esperado ${COD})`);
          conferirConsole("busca-codigo-antiga");
        }
        // pelo formulário, como o cliente: digita no campo q e Enter
        await abrir("inicio", "#/");
        await page.fill('input[name="q"]', "cxd-13062");
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => location.hash.startsWith("#/busca"), null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(100);
        const pf = await primeiros();
        if (pf[0] !== COD) falha("codigo", N_COD, "formulário:cxd-13062", `formulário (campo q, "cxd-13062" + Enter): 1º = ${pf[0] || "nada"}`);
        conferirConsole("form-codigo");
      }
      const amostraRuim = [];
      for (const c of amostra) {
        await abrir("busca-codigo-amostra", "#/busca?q=" + encodeURIComponent(c));
        const pr = await primeiros();
        if (pr[0] !== c) { amostraRuim.push(c); falha("codigo", N_COD, "amostra:" + c, `"${c}": 1º = ${pr[0] || "nada"}`); }
        conferirConsole("busca-codigo-amostra");
      }
      detalhe("codigo", N_COD, `${COD}, "${COD.replace(/^([A-Z]+)(\d+)$/, "$1 $2")}", "${COD.replace(/^([A-Z]+)(\d+)$/, "$1-$2")}", minúsculo, link antigo cod=, formulário e ${amostra.length - amostraRuim.length} de ${amostra.length} da amostra em 1º`);

      // ---- busca por referência cruzada ----
      const N_REF = "busca referência";
      if (refTrw) {
        const casos = [
          ["q", refTrw.c],
          ["q", "TRW " + refTrw.c],
          ["q", refTrw.c + " TRW"],
          ["cod", refTrw.c], // link antigo da aba Código
        ];
        if (refNak) casos.push(["q", refNak.c]);
        for (const [k, v] of casos) {
          await abrir("busca-referencia", `#/busca?${k}=${encodeURIComponent(v)}`);
          const todos = await listaTodos();
          const cods = todos.itens.map((i) => i.c);
          if (!cods.includes(COD)) falha("referencia", N_REF, `${k}:${v}`, `${k === "cod" ? "link antigo cod=" : "busca"} "${v}": ${cods.length} resultado(s), sem o ${COD}`);
          if (v === "TRW " + refTrw.c) await print("busca-referencia");
          conferirConsole("busca-referencia");
        }
        detalhe("referencia", N_REF, casos.map(([k, v]) => `${k === "cod" ? "cod=" : ""}"${v}"`).join("; ") + ` → ${COD}`);
      }

      // ---- busca por veículo (T-0011: no campo q; o link antigo mo=&modelo=&ano= vira q) ----
      const N_VEI = "busca veículo";
      // confere uma lista de "Gol 2018" com montadora VW: não vazia, todas as palavras casaram (sem o aviso dos mais
      // próximos), Gol como palavra inteira na aplicação (Golf sozinho não serve, T-0008) e montadora VOLKSWAGEN
      const conferirGol = async (rotulo) => {
        const r = await listaTodos();
        if (!r.itens.length) falha("veiculo", N_VEI, "vazio:" + rotulo, `${rotulo} não trouxe nada`);
        if (r.proximos) falha("veiculo", N_VEI, "proximos:" + rotulo, `${rotulo}: mostrou os "mais próximos" (${cortar(r.proximos, 80)}), esperado todas as palavras`);
        let semGol = 0;
        for (const it of r.itens) {
          const p = porCod.get(normCod(it.c));
          if (!p) { falha("veiculo", N_VEI, "desconhecido:" + it.c, `${it.c} não está no JSON`); continue; }
          if (!palavraInteira(p.a || "", "GOL")) { semGol++; falha("veiculo", N_VEI, "modelo:" + p.c, `${rotulo}: ${p.c} sem "Gol" como palavra: ${cortar(p.a, 60) || "(sem aplicação)"}`); }
          const mo = norm(p.mo);
          // a montadora: o campo mo, ou VOLKSWAGEN/VW como palavra na aplicação ou na descrição ("BOMBA DE AGUA ... - VW")
          const vw = (t) => palavraInteira(t || "", "VOLKSWAGEN") || palavraInteira(t || "", "VW");
          if (!(mo === "VOLKSWAGEN" || mo.split("/").includes("VOLKSWAGEN") || vw(p.a) || vw(p.d))) falha("veiculo", N_VEI, "montadora:" + p.c, `${rotulo}: ${p.c} não é VOLKSWAGEN (${p.mo || "sem montadora"})`);
        }
        return { n: r.itens.length, semGol, cods: r.itens.map((i) => i.c).join(",") };
      };
      await abrir("busca-veiculo", "#/busca?mo=VOLKSWAGEN&modelo=Gol&ano=2018");
      const vei = await conferirGol("link antigo VOLKSWAGEN/Gol/2018");
      await page.evaluate(() => window.scrollTo(0, 0));
      await print("busca-veiculo");
      conferirConsole("busca-veiculo");
      await abrir("busca-veiculo-q", "#/busca?q=" + encodeURIComponent("Volkswagen Gol 2018"));
      const veiQ = await conferirGol('"Volkswagen Gol 2018"');
      if (veiQ.cods !== vei.cods) falha("veiculo", N_VEI, "rota=q", `link antigo = ${vei.n}, "Volkswagen Gol 2018" = ${veiQ.n} (listas diferentes)`);
      conferirConsole("busca-veiculo-q");
      // pelo formulário: "gol 2018 volkswagen" (outra ordem) dá a mesma lista; "vw gol 2018" (a montadora com o outro
      // nome) traz todos os do link antigo e pode trazer mais, porque "VW" também casa com a descrição (diretriz:
      // cada palavra casa com qualquer campo), ex.: BDA50000 "BOMBA DE AGUA LINHA LEVE - VW", sem montadora
      const forms = [];
      for (const txt of ["gol 2018 volkswagen", "vw gol 2018"]) {
        await abrir("inicio", "#/");
        await page.fill('input[name="q"]', txt);
        await page.click('.form-busca button[type="submit"]');
        await page.waitForFunction(() => location.hash.startsWith("#/busca"), null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(100);
        const f = await conferirGol(`formulário "${txt}"`);
        if (txt.startsWith("vw ")) {
          const tem = new Set(f.cods.split(",")), faltam = vei.cods.split(",").filter((c) => c && !tem.has(c));
          if (faltam.length) falha("veiculo", N_VEI, "formulário:" + txt, `formulário "${txt}" = ${f.n}, sem ${faltam.length} do link antigo (ex.: ${faltam.slice(0, 5).join(", ")})`);
        } else if (f.cods !== vei.cods) falha("veiculo", N_VEI, "formulário:" + txt, `formulário "${txt}" = ${f.n}, link antigo = ${vei.n} (listas diferentes)`);
        forms.push(`"${txt}" = ${f.n}`);
        conferirConsole("form-veiculo");
      }
      detalhe("veiculo", N_VEI, `link antigo VOLKSWAGEN/Gol/2018 = ${vei.n}; "Volkswagen Gol 2018" = ${veiQ.n}; ${forms.join("; ")}; sem Golf sozinho` + (vei.semGol ? `, ${vei.semGol} sem "Gol" como palavra` : ""));

      // ---- exemplos da diretriz da busca palavra por palavra (R-20261120-103509 e R-20261120-104933) ----
      // O "Mahle 33000" do texto não existe junto na base: o equivalente real é o AMT7005 (Gol 1980 a 2009, KYB 441126).
      const N_PAL2 = "busca palavra por palavra";
      if (pAmt && temKyb) {
        const tudo = "AMORTECEDOR GOL 2007 KYB 441126";
        await abrir("busca-diretriz", "#/busca?q=" + encodeURIComponent(tudo));
        const e1 = await listaTodos();
        const c1 = e1.itens.map((i) => i.c);
        if (c1[0] !== "AMT7005") falha("palavra2", N_PAL2, "1:primeiro", `"${tudo}": 1º = ${c1[0] || "nada"} (esperado AMT7005)`);
        if (e1.proximos) falha("palavra2", N_PAL2, "1:proximos", `"${tudo}": mostrou os "mais próximos", mas o AMT7005 casa com tudo`);
        // lista estrita: quem casa só com GOL ou só com KYB não aparece (as palavras de texto têm de estar no produto)
        for (const it of e1.itens) {
          const p = porCod.get(normCod(it.c)), txt = norm(textoDe(p || {}));
          const falta = ["AMORTECEDOR", "KYB"].filter((t) => !txt.includes(t)).concat(palavraInteira(p?.a || "", "GOL") ? [] : ["GOL"])
            .concat((p?.r || []).some((r) => normCod(r.c).includes("441126")) ? [] : ["441126"]);
          if (!p || falta.length) falha("palavra2", N_PAL2, "1:estrita:" + it.c, `"${tudo}" trouxe ${it.c}, que não tem ${falta.join(", ")}`);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await print("busca-diretriz");
        conferirConsole("busca-diretriz");
        for (const q of ["gol 2007 amortecedor 441126 kyb", "amortecedor gol 2007 kyb 441126", "441126 Kyb 2007 Gol Amortecedor"]) {
          await abrir("busca-diretriz-ordem", "#/busca?q=" + encodeURIComponent(q));
          const r = await listaTodos(), c = r.itens.map((i) => i.c);
          if (c.join() !== c1.join()) falha("palavra2", N_PAL2, "2:" + q, `"${q}" = ${c.join(",") || "nada"}; "${tudo}" = ${c1.join(",") || "nada"}`);
          conferirConsole("busca-diretriz-ordem");
        }
        const fora = "AMORTECEDOR GOL 2015 KYB 441126"; // 2015 fora da faixa (1980 a 2009): ninguém casa com tudo
        await abrir("busca-diretriz-proximos", "#/busca?q=" + encodeURIComponent(fora));
        const e4 = await listaTodos();
        if (!e4.itens.length) falha("palavra2", N_PAL2, "4:vazia", `"${fora}": lista vazia (esperado os mais próximos)`);
        else if (e4.itens[0].c !== "AMT7005") falha("palavra2", N_PAL2, "4:primeiro", `"${fora}": 1º = ${e4.itens[0].c} (esperado AMT7005 como o mais próximo)`);
        if (!e4.proximos) falha("palavra2", N_PAL2, "4:aviso", `"${fora}": sem o aviso dos "mais próximos"`);
        if (e4.vazio) falha("palavra2", N_PAL2, "4:nada", `"${fora}": mostrou "${cortar(e4.vazio, 40)}"`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await print("busca-diretriz-proximos");
        conferirConsole("busca-diretriz-proximos");
        await abrir("busca-diretriz-ref", "#/busca?q=" + encodeURIComponent("KYB 441126"));
        const e5 = await primeiros();
        if (e5[0] !== "AMT7005") falha("palavra2", N_PAL2, "5:KYB 441126", `"KYB 441126": 1º = ${e5[0] || "nada"} (esperado AMT7005, que tem a KYB só como concorrente)`);
        conferirConsole("busca-diretriz-ref");
      }
      // o texto literal da diretriz (Mahle 33000): nunca lista vazia
      for (const q of ["AMORTECEDOR GOL 2007 MAHLE 33000", "AMORTECEDOR GOL 2015 MAHLE 33000", "MAHLE 33000"]) {
        await abrir("busca-diretriz-mahle", "#/busca?q=" + encodeURIComponent(q));
        const r = await listaTodos();
        if (!r.itens.length) falha("palavra2", N_PAL2, "literal:" + q, `"${q}": lista vazia (a diretriz manda mostrar os mais próximos)`);
        conferirConsole("busca-diretriz-mahle");
      }
      // código exato em 1º (decisão 4a): código BAP e EAN
      const exatos = [["CL14", "CL14"]];
      if (ean) exatos.push([ean, "TER551011"]);
      for (const [q, esperado] of exatos) {
        if (!existe(esperado)) continue;
        await abrir("busca-exato", "#/busca?q=" + encodeURIComponent(q));
        const pr = await primeiros();
        if (pr[0] !== esperado) falha("palavra2", N_PAL2, "exato:" + q, `"${q}": 1º = ${pr[0] || "nada"} (esperado ${esperado})`);
        conferirConsole("busca-exato");
      }
      detalhe("palavra2", N_PAL2, `"AMORTECEDOR GOL 2007 KYB 441126" → AMT7005 em 1º, lista estrita; outra ordem e minúsculas iguais; ` +
        `2015 → AMT7005 como o mais próximo; "KYB 441126" → AMT7005; Mahle 33000 literal não vazio; "CL14" → CL14; EAN ${ean || "?"} → TER551011`);

      // ---- busca geral ----
      const N_GER = "busca geral";
      const gerais = [["amortecedor dianteiro Onix", "AMORTECEDOR"], ["15W40", "15W40"]];
      const contas = [];
      for (const [q, noPrimeiro] of gerais) {
        await abrir("busca-geral", "#/busca?q=" + encodeURIComponent(q));
        const r = await listaTodos();
        contas.push(`"${q}" = ${r.itens.length}`);
        if (!r.itens.length) { falha("geral", N_GER, q, `"${q}" não trouxe nada`); continue; }
        const termos = norm(q).split(" ");
        for (const it of r.itens) {
          const p = porCod.get(normCod(it.c));
          const txt = norm(textoDe(p || {}));
          const falta = termos.filter((t) => !txt.includes(t));
          if (!p || falta.length) falha("geral", N_GER, `${q}:${it.c}`, `"${q}" trouxe ${it.c}, que não tem ${falta.join(", ")}`);
        }
        const p0 = porCod.get(normCod(r.itens[0].c));
        if (!norm([p0?.d, p0?.p].join(" ")).includes(noPrimeiro)) falha("geral", N_GER, `${q}:primeiro`, `"${q}": o 1º (${r.itens[0].c}) não é ${noPrimeiro}`);
        await page.evaluate(() => window.scrollTo(0, 0));
        if (q === gerais[0][0]) await print("busca-geral");
        conferirConsole("busca-geral");
      }
      detalhe("geral", N_GER, contas.join("; "));

      // ---- busca sem resultado ----
      const N_VAZ = "busca sem resultado";
      for (const [k, v] of [["q", "xyzqwk nadaexiste"], ["q", "ZZQ999999"], ["cod", "ZZQ999999"]]) {
        await abrir("busca-vazia", `#/busca?${k}=${encodeURIComponent(v)}`);
        const r = await listaTodos();
        if (r.itens.length || !/Nenhum produto encontrado/.test(r.vazio) || !/^0 produtos?$/.test(r.total.trim()))
          falha("vazia", N_VAZ, `${k}:${v}`, `"${v}": ${r.itens.length} item(ns), total "${r.total}", mensagem "${cortar(r.vazio, 40)}"`);
        if (r.proximos) falha("vazia", N_VAZ, `${k}:${v}:proximos`, `"${v}": aviso dos "mais próximos" sem nenhum produto parecido`);
        if (v === "xyzqwk nadaexiste") await print("busca-vazia");
        conferirConsole("busca-vazia");
      }
      detalhe("vazia", N_VAZ, `"xyzqwk nadaexiste", "ZZQ999999" e o link antigo cod=ZZQ999999 → "Nenhum produto encontrado"`);

      // ---- página do produto ----
      const N_PROD = "página do produto", N_PRECO = "produto sem preço nem estoque";
      const paginas = [];
      if (pCod) paginas.push([pCod, "produto", ["Aplicação", "Referências cruzadas", "Ficha técnica", "Ofereça junto"]]);
      if (comFoto) paginas.push([comFoto, "produto-com-foto", ["Aplicação", "Referências cruzadas", "Ficha técnica", "Ofereça junto"]]);
      for (const c of ["TER556556", "1"]) if (existe(c)) paginas.push([porCod.get(normCod(c)), "produto-" + c, []]);
      for (const [p, nome, secoesEsperadas] of paginas) {
        await abrir(nome, "#/produto/" + encodeURIComponent(p.c));
        const info = await page.evaluate(() => {
          const img = document.querySelector(".prod-foto img:not(.sem-foto img)");
          return {
            h1: ((document.querySelector(".prod-info h1") || {}).textContent || "").trim(),
            secoes: [...document.querySelectorAll(".prod-info .secao h2")].map((e) => e.textContent.trim()),
            semFoto: ((document.querySelector(".prod-foto .sem-foto") || {}).textContent || "").trim(),
            foto: img ? { src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0 } : null,
            texto: document.body.innerText,
          };
        });
        if (info.h1 !== p.c) falha("produto", N_PROD, `${p.c}:h1`, `${L} ${p.c}: título "${info.h1}"`);
        if (p.i) { if (!info.foto || !info.foto.ok) falha("produto", N_PROD, `${p.c}:foto`, `${L} ${p.c}: a foto ${p.i} não carregou`); }
        else if (!/Foto em breve/.test(info.semFoto)) falha("produto", N_PROD, `${p.c}:sem-foto`, `${L} ${p.c}: sem foto e sem "Foto em breve"`);
        for (const s of secoesEsperadas) if (!info.secoes.includes(s)) falha("produto", N_PROD, `${p.c}:${s}`, `${L} ${p.c}: sem a seção "${s}"`);
        for (const a of palavrasInternas(info.texto)) falha("tela-preco", N_PRECO, `${a.nome}:${p.c}`, `#/produto/${p.c} mostra "${a.nome}": …${a.trecho}…`);
        if (nome === "produto" || nome === "produto-com-foto") await print(nome);
        conferirConsole(nome);
      }
      teste("tela-preco", N_PRECO);
      detalhe("produto", N_PROD, paginas.slice(0, 2).map(([p]) => p.c + (p.i ? " (com foto)" : " (Foto em breve)")).join(" e ") + ": foto, aplicação, referências, ficha técnica, ofereça junto");
      detalhe("tela-preco", N_PRECO, paginas.map(([p]) => p.c).join(", "));
      await abrir("produto-inexistente", "#/produto/ZZQ999999");
      if (!/não encontrado/.test(await page.evaluate(() => document.body.innerText))) falha("produto", N_PROD, "inexistente", `${L} #/produto/ZZQ999999 sem a mensagem "não encontrado"`);
      conferirConsole("produto-inexistente");

      // ---- acessibilidade básica ----
      const N_A11Y = "acessibilidade básica";
      for (const [nome, hash] of [["inicio", "#/"], ["busca-geral", "#/busca?q=15W40"], ["produto", "#/produto/" + encodeURIComponent(comFoto ? comFoto.c : COD)]]) {
        await abrir(nome, hash);
        const a = await page.evaluate(() => ({
          semAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.getAttribute("src")),
          semRotulo: [...document.querySelectorAll("input,select,textarea")].filter((el) => !((el.labels && el.labels.length) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"))).map((el) => el.name || el.type),
        }));
        for (const s of a.semAlt) falha("a11y", N_A11Y, `alt:${nome}:${s}`, `${L} ${nome}: imagem sem alt (${s})`);
        for (const s of a.semRotulo) falha("a11y", N_A11Y, `rotulo:${nome}:${s}`, `${L} ${nome}: campo sem rótulo (${s})`);
        conferirConsole(nome);
      }
      // teclado: Tab até as abas, foco visível, Enter abre a aba
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 15000 }).catch(() => {});
      let passos = 0;
      for (let i = 1; i <= 30; i++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement.matches(".abas button"))) { passos = i; break; } }
      if (!passos) falha("a11y", N_A11Y, "tab", `${L}: o Tab não chega às abas da busca em 30 passos`);
      else {
        const foco = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { o: cs.outlineStyle, w: parseFloat(cs.outlineWidth) || 0, s: cs.boxShadow }; });
        if ((foco.o === "none" || foco.w === 0) && (!foco.s || foco.s === "none")) falha("a11y", N_A11Y, "foco", `${L}: foco nas abas sem contorno visível`);
        if (larg === 1366) await page.screenshot({ path: path.join(dirPrints, `foco-teclado-${larg}.png`) });
      }
      // as 2 abas da T-0011 (R-20261120-104703): "Busca por código, descrição ou aplicação" e "Busca por placa" (Em breve)
      const abasTela = await page.evaluate(() => [...document.querySelectorAll(".abas button")].map((b) => ({ aba: b.dataset.aba, txt: b.textContent.replace(/\s+/g, " ").trim(), role: b.getAttribute("role") })));
      const nomesAbas = abasTela.map((x) => x.txt);
      if (abasTela.length !== 2 || !/c[oó]digo, descri[cç][aã]o ou aplica[cç][aã]o/i.test(nomesAbas[0] || "") || !/placa/i.test(nomesAbas[1] || ""))
        falha("abas", "abas da busca", "nomes", `${L}: abas = ${nomesAbas.map((t) => `"${t}"`).join(", ") || "nenhuma"} (esperado 2: código, descrição ou aplicação; placa)`);
      if (abasTela.some((x) => x.role !== "tab")) falha("abas", "abas da busca", "role", `${L}: aba sem role="tab"`);
      const abaAtiva = () => page.evaluate(() => {
        const sel = [...document.querySelectorAll(".abas button")].filter((b) => b.getAttribute("aria-selected") === "true").map((b) => b.dataset.aba);
        const vis = [...document.querySelectorAll(".form-busca [data-campos]")].filter((c) => !c.hidden).map((c) => c.dataset.campos);
        const painel = document.querySelector('.form-busca [data-campos="placa"]');
        const visivel = (el) => !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
        const campo = painel && painel.querySelector("input");
        const botao = [...document.querySelectorAll(".form-busca button, .cartao-busca button")].filter((b) => !b.closest(".abas")).find((b) => visivel(b) && /buscar/i.test(b.textContent));
        return { foco: document.activeElement?.dataset?.aba || "", sel: sel.join(","), vis: vis.join(","), campo: visivel(campo), botao: !!botao };
      });
      const [aT, aP] = [abasTela[0]?.aba, abasTela[1]?.aba];
      if (aT && aP) {
        // Enter na aba Placa abre o painel, com o campo da placa e o botão "Buscar". Não digita placa nem busca:
        // o serviço de placas não existe no CI nem na sessão (aviso do gerente, 20/11/2026), e placa real não entra em teste.
        await page.focus(`.abas button[data-aba="${aP}"]`);
        await page.keyboard.press("Enter");
        const e = await abaAtiva();
        if (e.sel !== aP || e.vis !== aP) falha("a11y", N_A11Y, "enter", `${L}: Enter na aba Placa: selecionada "${e.sel}", painel "${e.vis}"`);
        else {
          if (!e.campo) falha("abas", "abas da busca", "placa:campo", `${L}: a aba Placa não mostra o campo da placa`);
          if (!e.botao) falha("abas", "abas da busca", "placa:botao", `${L}: a aba Placa não mostra o botão "Buscar"`);
        }
        // setas, Home e End trocam entre as 2 abas (padrão ARIA): a aba com foco é a selecionada e o painel dela aparece.
        // Começa com o foco na aba Placa (o Enter na aba de texto leva o foco para o campo q, de propósito).
        await page.focus(`.abas button[data-aba="${aP}"]`);
        for (const [tecla, esperada] of [["ArrowRight", aT], ["ArrowLeft", aP], ["ArrowLeft", aT], ["ArrowRight", aP], ["Home", aT], ["End", aP], ["Home", aT]]) {
          await page.keyboard.press(tecla);
          const r = await abaAtiva();
          if (r.foco !== esperada || r.sel !== esperada || r.vis !== esperada)
            falha("a11y", N_A11Y, "tecla:" + tecla + ">" + esperada, `${L}: ${tecla} devia ir para a aba "${esperada}": foco "${r.foco}", selecionada "${r.sel}", painel "${r.vis}"`);
        }
      }
      conferirConsole("teclado");
      detalhe("abas", "abas da busca", nomesAbas.map((t) => `"${t}"`).join(" e ") + '; a de placa abre com o campo e o botão "Buscar" (sem consultar o serviço)');
      detalhe("a11y", N_A11Y, `campos com rótulo, imagens com alt, Tab chega às abas${passos ? ` (${passos} passos)` : ""}, foco visível, Enter abre a aba, setas, Home e End trocam entre as 2 abas`);

      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  detalhe("largura", "390 px sem rolar de lado", "scrollWidth <= 390 em todas as telas abertas");
  detalhe("console", "console sem erro", "0 erro do site nas telas abertas, nas 2 larguras");
  teste("largura", "390 px sem rolar de lado");
  teste("console", "console sem erro");
  teste("rota-antiga", "link antigo redireciona");
  detalhe("rota-antiga", "link antigo redireciona", "#/busca?cod= e #/busca?mo=&modelo=&ano= viram #/busca?q=");
}

// ---------- conhecidos ----------
function lerConhecidos(arq) {
  if (!arq) return [];
  const d = JSON.parse(fs.readFileSync(arq, "utf8"));
  const lista = Array.isArray(d) ? d : d.conhecidos;
  if (!Array.isArray(lista)) throw new Error(`${arq}: falta a lista "conhecidos"`);
  for (const c of lista) if (!c.teste || !c.tarefa || !Array.isArray(c.chaves) || !c.chaves.length) throw new Error(`${arq}: cada item precisa de "teste", "tarefa" e "chaves" (lista não vazia)`);
  return lista;
}

// ---------- resumo ----------
function resumo(conhecidos, opcoes) {
  const linhas = [`Testes T-0002 · ${agoraManaus()} (Manaus)` + (opcoes.json ? ` · JSON: ${opcoes.json}` : "")];
  let novas = 0, conh = 0;
  const usados = new Set();
  const detalhes = [];
  for (const t of TESTES) {
    const marcadas = t.falhas.map((f) => {
      const k = conhecidos.find((c) => c.teste === t.id && c.chaves.includes(f.chave));
      if (k) usados.add(k);
      return { ...f, conhecido: k };
    });
    const n = marcadas.filter((f) => !f.conhecido).length, m = marcadas.length - n;
    novas += n; conh += m;
    const porT = new Map();
    for (const f of marcadas.filter((x) => x.conhecido)) porT.set(f.conhecido.tarefa, (porT.get(f.conhecido.tarefa) || 0) + 1);
    const tarefas = [...porT].map(([t, q]) => (porT.size > 1 ? `${t}: ${q}` : t)).join("; ");
    let sit;
    if (!marcadas.length) sit = `PASSOU${t.detalhe ? ` (${t.detalhe})` : ""}`;
    else if (!n) sit = `CONHECIDO (${tarefas}) · ${m} achado(s)`;
    else sit = `FALHOU (${n} novo(s)${m ? `; mais ${m} CONHECIDO (${tarefas})` : ""})`;
    linhas.push(`${(t.nome + " ").padEnd(30, ".")} ${sit}`);
    if (marcadas.length || t.avisos.length) {
      detalhes.push(`\n[${t.nome}]` + (t.detalhe && marcadas.length ? ` ${t.detalhe}` : ""));
      const mostrar = (lst, rot) => {
        lst.slice(0, 25).forEach((f) => detalhes.push(`  ${rot} ${f.txt}`));
        if (lst.length > 25) detalhes.push(`  ${rot} … e mais ${lst.length - 25}`);
      };
      mostrar(marcadas.filter((f) => !f.conhecido), "FALHA     ");
      const porTarefa = new Map();
      for (const f of marcadas.filter((x) => x.conhecido)) porTarefa.set(f.conhecido, (porTarefa.get(f.conhecido) || []).concat(f));
      for (const [k, lst] of porTarefa) {
        detalhes.push(`  CONHECIDO (${k.tarefa}) ${k.motivo || ""}: ${lst.length} achado(s)`);
        lst.slice(0, 3).forEach((f) => detalhes.push(`      ex.: ${f.txt}`));
      }
      t.avisos.forEach((a) => detalhes.push(`  AVISO      ${a}`));
    }
  }
  for (const k of conhecidos) {
    if (usados.has(k)) {
      const t = TESTES.find((x) => x.id === k.teste);
      const vistos = new Set((t ? t.falhas : []).map((f) => f.chave));
      const sumiram = k.chaves.filter((c) => !vistos.has(c));
      if (sumiram.length && t && !opcoes.semNavegador) detalhes.push(`\n[conhecidos] AVISO ${k.tarefa}: ${sumiram.length} de ${k.chaves.length} não aparecem mais (resolvidos? tire de ${path.relative(RAIZ, opcoes.conhecidos)})`);
    } else if (!(opcoes.semNavegador && !["palavra", "json", "campos", "unico"].includes(k.teste))) {
      detalhes.push(`\n[conhecidos] AVISO ${k.tarefa} (${k.teste}): nenhum achado aparece mais. Resolvido? Tire de ${path.relative(RAIZ, opcoes.conhecidos)}.`);
    }
  }
  if (opcoes.semNavegador) linhas.push(`${"navegador ".padEnd(30, ".")} NÃO RODOU (--sem-navegador)`);
  else { const r = path.relative(RAIZ, opcoes.prints); linhas.push(`${"prints ".padEnd(30, ".")} ${r && !r.startsWith("..") ? r : opcoes.prints}/`); }
  const ok = novas === 0;
  linhas.push("", `Resultado: ${ok ? "PASSOU" : "FALHOU"} (${novas} falha(s) nova(s)` + (opcoes.conhecidos ? `, ${conh} CONHECIDO(S) ignorado(s) por ${path.relative(RAIZ, opcoes.conhecidos)}` : conh ? "" : "") + ")");
  if (!opcoes.conhecidos && novas) linhas.push("(sem --conhecidos: todo achado conta, inclusive os já abertos em tarefa)");
  return { texto: linhas.join("\n") + (detalhes.length ? "\n\nDetalhe:" + detalhes.join("\n") : ""), ok };
}

// ---------- principal ----------
async function main() {
  const opcoes = lerOpcoes(process.argv.slice(2));
  const conhecidos = lerConhecidos(opcoes.conhecidos);
  // trava: os *.png antigos só são apagados em testes/prints/ultima; outra pasta tem de ser nova ou vazia
  if (!opcoes.semNavegador && path.resolve(opcoes.prints) !== PRINTS_PADRAO && fs.existsSync(opcoes.prints)) {
    if (!fs.statSync(opcoes.prints).isDirectory() || fs.readdirSync(opcoes.prints).length)
      throw erroUso(`--prints ${opcoes.prints}: a pasta já existe e não está vazia. Use testes/prints/ultima, uma pasta nova ou uma vazia (o teste não apaga nada fora de testes/prints/ultima).`);
  }
  const arqJson = opcoes.json || path.join(SITE, "data", "produtos.json");
  const ctxJson = testarJson(arqJson);
  if (ctxJson && !opcoes.semNavegador) {
    const srv = await subirServidor(opcoes.json);
    const base = `http://127.0.0.1:${srv.address().port}/`;
    try { await testarSite(base, ctxJson, opcoes.prints); }
    finally { srv.close(); }
  }
  const r = resumo(conhecidos, opcoes);
  console.log(r.texto);
  if (!opcoes.semNavegador) { fs.mkdirSync(opcoes.prints, { recursive: true }); fs.writeFileSync(path.join(opcoes.prints, "resumo.txt"), r.texto + "\n"); }
  process.exit(r.ok ? 0 : 1);
}

main().catch((e) => {
  console.error("[ERRO] o teste não terminou: " + (e && e.uso ? e.message : (e && e.stack) || e));
  process.exit(1);
});
