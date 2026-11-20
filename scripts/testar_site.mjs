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
   busca por código (exato, com e sem espaço ou hífen), por referência cruzada (aba Código e busca geral),
   por veículo (montadora + modelo + ano), geral (texto livre) e sem resultado; página do produto (foto,
   aplicação, referências, ficha técnica, ofereça junto, sem preço nem estoque); 390 px sem rolar de lado;
   console sem erro; acessibilidade básica; prints em 1366 × 768 e 390 × 844.
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
  const casosSumidos = [];
  if (!pCod) casosSumidos.push(COD);
  if (!refTrw) casosSumidos.push(`referência TRW do ${COD}`);
  if (!existe("TER556556")) casosSumidos.push("TER556556");
  for (const c of casosSumidos) falha("casos", "casos do JSON", c, `o caso ${c} não está mais no JSON: escolher outro no scripts/testar_site.mjs`);
  // amostra de códigos espalhados pelo catálogo (sem os que colidem depois de tirar espaço e hífen)
  const vezes = new Map();
  for (const p of prods) vezes.set(normCod(p.c), (vezes.get(normCod(p.c)) || 0) + 1);
  const unicos = prods.filter((p) => vezes.get(normCod(p.c)) === 1);
  const passo = Math.max(1, Math.floor(unicos.length / 8));
  const amostra = unicos.filter((_, i) => i % passo === Math.floor(passo / 2)).slice(0, 8).map((p) => p.c);
  detalhe("casos", "casos do JSON", `código ${COD}; referência ${refTrw ? "TRW " + refTrw.c : "?"}${refNak ? " e " + refNak.m + " " + refNak.c : ""}; veículo VOLKSWAGEN/Gol/2018; ` +
    `geral "amortecedor dianteiro Onix" e "15W40"; produto com foto ${comFoto ? comFoto.c : "?"}; amostra ${amostra.join(", ")}`);

  const browser = await chromium.launch();
  try {
    for (const [larg, alt] of [[1366, 768], [390, 844]]) {
      const L = `${larg} px`;
      const ctx = await browser.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: 1 });
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

      // ---- busca por código ----
      const N_COD = "busca código";
      if (pCod) {
        const variantes = [COD, COD.replace(/^([A-Z]+)(\d+)$/, "$1 $2"), COD.replace(/^([A-Z]+)(\d+)$/, "$1-$2"), COD.toLowerCase()];
        for (const v of variantes) {
          await abrir("busca-codigo", "#/busca?cod=" + encodeURIComponent(v));
          const pr = await primeiros();
          if (pr[0] !== COD) falha("codigo", N_COD, v, `aba Código "${v}": 1º = ${pr[0] || "nada"} (esperado ${COD})`);
          if (v === COD) await print("busca-codigo");
          conferirConsole("busca-codigo");
        }
        await abrir("busca-geral-codigo", "#/busca?q=" + encodeURIComponent("cxd 13062"));
        if ((await primeiros())[0] !== COD) falha("codigo", N_COD, "geral:cxd 13062", `busca geral "cxd 13062": 1º = ${(await primeiros())[0] || "nada"}`);
        conferirConsole("busca-geral-codigo");
        // pelo formulário, como o cliente: aba Código, digita e Enter
        await abrir("inicio", "#/");
        await page.click('.abas button[data-aba="codigo"]');
        await page.fill('input[name="cod"]', "cxd-13062");
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => location.hash.startsWith("#/busca"), null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(100);
        const pf = await primeiros();
        if (pf[0] !== COD) falha("codigo", N_COD, "formulário:cxd-13062", `formulário (aba Código, "cxd-13062" + Enter): 1º = ${pf[0] || "nada"}`);
        conferirConsole("form-codigo");
      }
      const amostraRuim = [];
      for (const c of amostra) {
        await abrir("busca-codigo-amostra", "#/busca?cod=" + encodeURIComponent(c));
        const pr = await primeiros();
        if (pr[0] !== c) { amostraRuim.push(c); falha("codigo", N_COD, "amostra:" + c, `aba Código "${c}": 1º = ${pr[0] || "nada"}`); }
        conferirConsole("busca-codigo-amostra");
      }
      detalhe("codigo", N_COD, `${COD}, "${COD.replace(/^([A-Z]+)(\d+)$/, "$1 $2")}", "${COD.replace(/^([A-Z]+)(\d+)$/, "$1-$2")}", minúsculo, formulário e ${amostra.length - amostraRuim.length} de ${amostra.length} da amostra`);

      // ---- busca por referência cruzada ----
      const N_REF = "busca referência";
      if (refTrw) {
        const casos = [
          ["aba Código", "cod", refTrw.c],
          ["aba Código", "cod", "TRW " + refTrw.c], // marca na frente: hoje dá 0 (T-0008)
          ["busca geral", "q", "TRW " + refTrw.c],
        ];
        if (refNak) casos.push(["aba Código", "cod", refNak.c]);
        for (const [onde, k, v] of casos) {
          await abrir("busca-referencia", `#/busca?${k}=${encodeURIComponent(v)}`);
          const todos = await listaTodos();
          const cods = todos.itens.map((i) => i.c);
          if (!cods.includes(COD)) falha("referencia", N_REF, `${onde}:${v}`, `${onde} "${v}": ${cods.length} resultado(s), sem o ${COD}`);
          if (k === "cod" && v.startsWith("TRW ")) await print("busca-referencia");
          conferirConsole("busca-referencia");
        }
        detalhe("referencia", N_REF, casos.map(([o, , v]) => `${o} "${v}"`).join("; ") + ` → ${COD}`);
      }

      // ---- busca por veículo ----
      const N_VEI = "busca veículo";
      await abrir("busca-veiculo", "#/busca?mo=VOLKSWAGEN&modelo=Gol&ano=2018");
      const vei = await listaTodos();
      await page.evaluate(() => window.scrollTo(0, 0));
      await print("busca-veiculo");
      conferirConsole("busca-veiculo");
      if (!vei.itens.length) falha("veiculo", N_VEI, "vazio", "VOLKSWAGEN/Gol/2018 não trouxe nada");
      let semGol = 0;
      for (const it of vei.itens) {
        const p = porCod.get(normCod(it.c));
        if (!p) { falha("veiculo", N_VEI, "desconhecido:" + it.c, `${it.c} não está no JSON`); continue; }
        // o modelo tem de estar na aplicação como palavra inteira: "Gol" não é "Golf" (T-0008)
        if (!palavraInteira(p.a || "", "GOL")) { semGol++; falha("veiculo", N_VEI, "modelo:" + p.c, `${p.c} sem "Gol" como palavra: ${cortar(p.a, 60) || "(sem aplicação)"}`); }
        const mo = norm(p.mo);
        if (!(mo === "VOLKSWAGEN" || mo.split("/").includes("VOLKSWAGEN") || norm(p.a).includes("VOLKSWAGEN"))) falha("veiculo", N_VEI, "montadora:" + p.c, `${p.c} não é VOLKSWAGEN (${p.mo || "sem montadora"})`);
      }
      detalhe("veiculo", N_VEI, `VOLKSWAGEN + Gol + 2018 = ${vei.itens.length}` + (semGol ? `, ${semGol} sem "Gol" como palavra` : ""));
      // pelo formulário
      await abrir("inicio", "#/");
      await page.click('.abas button[data-aba="veiculo"]');
      await page.selectOption('select[name="mo"]', "VOLKSWAGEN");
      await page.fill('input[name="modelo"]', "Gol");
      await page.fill('input[name="ano"]', "2018");
      await page.click('.form-busca button[type="submit"]');
      await page.waitForFunction(() => location.hash.startsWith("#/busca"), null, { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(100);
      const tf = await totalTela();
      if (tf !== vei.itens.length) falha("veiculo", N_VEI, "formulário", `formulário VOLKSWAGEN/Gol/2018 = ${tf}, pela rota = ${vei.itens.length}`);
      conferirConsole("form-veiculo");

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
      for (const [k, v] of [["q", "xyzqwk nadaexiste"], ["cod", "ZZQ999999"]]) {
        await abrir("busca-vazia", `#/busca?${k}=${encodeURIComponent(v)}`);
        const r = await listaTodos();
        if (r.itens.length || !/Nenhum produto encontrado/.test(r.vazio) || !/^0 produtos?$/.test(r.total.trim()))
          falha("vazia", N_VAZ, `${k}:${v}`, `"${v}": ${r.itens.length} item(ns), total "${r.total}", mensagem "${cortar(r.vazio, 40)}"`);
        if (k === "q") await print("busca-vazia");
        conferirConsole("busca-vazia");
      }
      detalhe("vazia", N_VAZ, `"xyzqwk nadaexiste" e código "ZZQ999999" → "Nenhum produto encontrado"`);

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
      await page.focus('.abas button[data-aba="veiculo"]');
      await page.keyboard.press("Enter");
      if (!(await page.evaluate(() => !document.querySelector('[data-campos="veiculo"]').hidden))) falha("a11y", N_A11Y, "enter", `${L}: Enter na aba Veículo não abre os campos`);
      await page.focus('.abas button[data-aba="geral"]');
      await page.keyboard.press("ArrowRight");
      if ((await page.evaluate(() => document.activeElement?.dataset?.aba)) === "geral")
        aviso("a11y", N_A11Y, "as setas não trocam de aba (padrão ARIA; T-0001, problema 10, ainda sem tarefa)");
      conferirConsole("teclado");
      detalhe("a11y", N_A11Y, `campos com rótulo, imagens com alt, Tab chega às abas${passos ? ` (${passos} passos)` : ""}, foco visível, Enter abre a aba`);

      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  detalhe("largura", "390 px sem rolar de lado", "scrollWidth <= 390 em todas as telas abertas");
  detalhe("console", "console sem erro", "0 erro do site nas telas abertas, nas 2 larguras");
  teste("largura", "390 px sem rolar de lado");
  teste("console", "console sem erro");
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
