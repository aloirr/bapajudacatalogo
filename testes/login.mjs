/* Testes do login do catálogo (T-0022, 22/11/2026). Dono: agente testes.
   Usado por scripts/testar_site.mjs --login (não roda sozinho).

   O que faz:
     - sobe o serviço de verdade (node servicos/login/server.mjs) numa porta livre, com uma PASTA_DADOS temporária e
       valores claramente falsos, gerados aqui a cada rodada (nunca impressos, nunca gravados);
     - sem login: a página, o produtos.json, as fotos, os PDFs, as páginas do admin e a API respondem 401 ou levam ao
       /entrar (também com um cookie falsificado);
     - entra como admin pela tela, faz a troca obrigatória, cria pela tela "Criar usuários" um usuário comum e confere a
       etiqueta "Falta trocar a senha inicial" (some depois que ele troca);
     - o usuário comum: o link #/produto/X enviado antes do login abre o produto depois do login (com e sem a troca
       obrigatória); não vê nem abre "Criar usuários" e "Catálogos em PDF" (404 nas páginas, nos arquivos e na API);
     - "volta" com "//", "/\" (cru e codificado) ou com outro site não leva para fora (no servidor e no entrar.js);
     - sessão de 5 h: o cookie (HttpOnly, Secure, SameSite=Lax, 5 h) e, com o serviço importado com o relógio
       adiantável (criarServico({ agora })), 4 h 59 ainda vale e 5 h 01 leva a /entrar?expirou=1 (API 401);
     - console sem erro em todas as telas, inclusive na troca obrigatória (nenhum 403 nem 4xx do próprio site);
     - o log do serviço sem senha, segredo nem chave;
     - prints em 1366 × 768 e 390 × 844 (deviceScaleFactor 1): login, troca obrigatória, catálogo com o menu aberto
       (cliente e admin), Criar usuários e Catálogos em PDF, mais a sessão vencida.
*/

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const HORA = 3600e3;
const SESSAO_H = 5;
// valor falso, novo a cada rodada; só vive na memória deste processo e no ambiente do serviço de teste
const falsa = (rot) => `${rot}-falsa-de-teste-${crypto.randomBytes(6).toString("hex")}`;
const LARGURAS = [[1366, 768], [390, 844]];
const FORA = "example.invalid"; // o "outro site" dos testes da volta (nunca é chamado: o pedido é barrado)
const corta = (s, n = 90) => { s = String(s ?? "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

// ---------- o serviço ----------
// Sobe node servicos/login/server.mjs (PORT=0: porta livre) e espera o "login ouvindo <porta>".
export async function subirLogin(raiz) {
  const arq = path.join(raiz, "servicos", "login", "server.mjs");
  if (!fs.existsSync(arq)) throw new Error(`--login: não achei ${path.relative(raiz, arq)} (o serviço de login da T-0022)`);
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "bap-login-teste-"));
  const seg = {
    senhaAdmin0: falsa("admin"), senhaAdmin1: falsa("admin2"), senhaComum0: falsa("cliente"), senhaComum1: falsa("cliente2"),
    segredo: falsa("segredo-sessao"), chave: falsa("chave-interna"),
  };
  // ambiente limpo: sem RENDER_EXTERNAL_URL e ORIGEM_SITE (a origem certa é a do próprio Host) e sem nada do ambiente real
  const env = {
    PATH: process.env.PATH || "", HOME: os.tmpdir(), PORT: "0", PASTA_DADOS: pasta, ADMIN_USUARIO: "admin",
    ADMIN_SENHA_INICIAL: seg.senhaAdmin0, SESSAO_SEGREDO: seg.segredo, CHAVE_INTERNA: seg.chave,
  };
  const filho = spawn(process.execPath, [arq], { cwd: raiz, env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  const porta = await new Promise((ok, erro) => {
    const t = setTimeout(() => erro(new Error("--login: o serviço não respondeu \"login ouvindo\" em 15 s. Log: " + corta(log, 300))), 15000);
    const ler = (b) => {
      log += b.toString("utf8");
      const m = log.match(/login ouvindo (\d+)/);
      if (m) { clearTimeout(t); ok(Number(m[1])); }
    };
    filho.stdout.on("data", ler);
    filho.stderr.on("data", ler);
    filho.once("exit", (c) => { clearTimeout(t); erro(new Error(`--login: o serviço saiu (código ${c}). Log: ${corta(log, 300)}`)); });
  });
  return {
    base: `http://localhost:${porta}/`, seg, pasta,
    log: () => log,
    parar: () => new Promise((ok) => {
      filho.removeAllListeners("exit");
      const fim = () => { fs.rmSync(pasta, { recursive: true, force: true }); ok(); };
      if (filho.exitCode !== null) return fim();
      filho.once("exit", fim);
      filho.kill("SIGTERM");
      setTimeout(() => filho.kill("SIGKILL"), 5000).unref();
    }),
  };
}

// pedido HTTP cru (o caminho vai como está: "//host" e "/\host" não viram outro endereço), sem seguir o 302
function cru(base, caminho, { metodo = "GET", cab = {}, corpo } = {}) {
  const u = new URL(base);
  return new Promise((ok, erro) => {
    const req = http.request({ host: u.hostname, port: u.port, path: caminho, method: metodo, headers: cab }, (res) => {
      const partes = [];
      res.on("data", (b) => partes.push(b));
      res.on("end", () => ok({ status: res.statusCode, cab: res.headers, corpo: Buffer.concat(partes) }));
    });
    req.on("error", erro);
    req.end(corpo);
  });
}
const cookieDe = (r) => ((r.cab["set-cookie"] || [])[0] || "").split(";")[0];
async function entrarApi(base, usuario, senha) {
  const origem = base.replace(/\/$/, "");
  const r = await cru(base, "/api/entrar", { metodo: "POST", cab: { Origin: origem, "Content-Type": "application/json", Accept: "application/json" }, corpo: JSON.stringify({ usuario, senha }) });
  let dados = null;
  try { dados = JSON.parse(r.corpo.toString("utf8")); } catch { /* sem corpo */ }
  return { r, cookie: cookieDe(r), dados };
}

// ---------- a bateria do login ----------
// reg: { teste, falha, aviso, detalhe } do testar_site.mjs. Devolve o usuário comum já com a senha trocada, para as
// buscas de sempre rodarem com login.
export async function testarLogin({ raiz, srv, dirPrints, prods, reg }) {
  const { teste, falha, aviso, detalhe } = reg;
  const { base, seg } = srv;
  const origem = base.replace(/\/$/, "");
  const local = (u) => String(u || "").startsWith(origem + "/");
  const COMUM = { usuario: "cliente.teste", nome: "Cliente Teste", empresa: "Oficina Teste" };
  const N_SEM = "login: sem login fecha", N_SESSAO = "login: sessão de 5 h", N_COMUM = "login: comum sem admin",
    N_LINK = "login: link do produto", N_VOLTA = "login: volta segura", N_ETQ = "login: etiqueta da troca",
    N_CONS = "login: console sem erro", N_ADMIN = "login: telas do admin", N_LOG = "login: log sem segredo",
    N_A11Y = "login: acessibilidade";
  for (const [id, n] of [["l-sem", N_SEM], ["l-sessao", N_SESSAO], ["l-comum", N_COMUM], ["l-link", N_LINK], ["l-volta", N_VOLTA],
    ["l-etq", N_ETQ], ["l-admin", N_ADMIN], ["l-cons", N_CONS], ["l-a11y", N_A11Y], ["l-log", N_LOG]]) teste(id, n);

  // casos do JSON: uma foto que existe e 2 produtos para o link direto
  const comFoto = prods.find((p) => p.i && fs.existsSync(path.join(raiz, "site", "img", p.i)));
  const P1 = "CXD13062", P2 = prods.find((p) => p.c === "AMT7115") ? "AMT7115" : (comFoto || prods[0]).c;

  // ---- 1. sem login (HTTP cru, sem navegador) ----
  const PAG = { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" }, OUTRO = { Accept: "*/*" };
  const semLogin = [
    ["/", PAG], ["/index.html", PAG], ["/app.js", OUTRO], ["/conta.js", OUTRO], ["/data/produtos.json", OUTRO],
    ["/data/produtos.json", PAG], ...(comFoto ? [["/img/" + encodeURIComponent(comFoto.i), OUTRO], ["/img/" + encodeURIComponent(comFoto.i), PAG]] : []),
    ["/admin/pdfs/baixar/completo-digital", OUTRO], ["/admin/pdfs/baixar/a4-grafica", OUTRO], ["/admin/pdfs/baixar/completo-digital", PAG],
    ["/admin/usuarios", PAG], ["/admin/pdfs", PAG], ["/admin/usuarios/usuarios.js", OUTRO], ["/trocar-senha", PAG],
    ["/api/eu", OUTRO], ["/api/usuarios", OUTRO], ["/api/pdfs", OUTRO], ["/api/eu/logo", OUTRO], ["/interno/codigos", OUTRO],
  ];
  if (!comFoto) falha("l-sem", N_SEM, "foto", "nenhum produto do JSON tem foto em site/img/ para testar");
  let nSem = 0;
  for (const cookie of ["", "bap_sessao=eyJ1IjoiYWRtaW4ifQ.assinatura-falsa"]) {
    for (const [cam, cab] of semLogin) {
      const r = await cru(base, cam, { cab: cookie ? { ...cab, Cookie: cookie } : cab });
      nSem++;
      const tipo = cab === PAG ? "página" : "arquivo";
      const loc = r.cab.location || "";
      const okRed = r.status === 302 && /^\/entrar(\?|$)/.test(loc);
      const ok = r.status === 401 || okRed;
      const rot = `${cam} (${tipo}${cookie ? ", cookie falsificado" : ""})`;
      if (!ok) falha("l-sem", N_SEM, `${cam}:${tipo}:${!!cookie}`, `${rot}: respondeu ${r.status}${loc ? " → " + loc : ""} (esperado 401 ou 302 para /entrar)`);
      else if (r.corpo.length > 2048 || r.corpo.includes(P1)) falha("l-sem", N_SEM, `${cam}:${tipo}:${!!cookie}:corpo`, `${rot}: ${r.status} com corpo de ${r.corpo.length} bytes (dado do catálogo?)`);
      if (cam === "/" && !cookie && loc !== "/entrar?volta=%2F") falha("l-sem", N_SEM, "volta-raiz", `/ sem login leva a "${loc}" (esperado /entrar?volta=%2F)`);
    }
  }
  // a tela de login abre sem login e não tem dado do catálogo; a /interno/codigos sem a chave certa: 401
  {
    const r = await cru(base, "/entrar", { cab: PAG });
    if (r.status !== 200 || !r.corpo.includes("form-entrar")) falha("l-sem", N_SEM, "entrar", `/entrar respondeu ${r.status} sem o formulário`);
    if (r.corpo.includes(P1)) falha("l-sem", N_SEM, "entrar-dado", "/entrar tem dado do catálogo");
    const k = await cru(base, "/interno/codigos", { cab: { "X-Chave-Interna": falsa("errada") } });
    if (k.status !== 401) falha("l-sem", N_SEM, "interno", `/interno/codigos com a chave errada respondeu ${k.status}`);
  }
  detalhe("l-sem", N_SEM, `${nSem} pedidos (página, app.js, produtos.json, foto ${comFoto ? comFoto.i : "?"}, 2 PDFs, admin, API), sem cookie e com cookie falsificado: 401 ou 302 /entrar; /entrar abre sem dado do catálogo`);

  // ---- navegador ----
  const { createRequire } = await import("node:module");
  const { chromium } = createRequire(import.meta.url)("playwright");
  const browser = await chromium.launch();
  const prints = [];
  const print = async (page, nome, larg) => { const f = path.join(dirPrints, `login-${nome}-${larg}.png`); await page.screenshot({ path: f }); prints.push(path.basename(f)); };

  // contexto com vigia do console: erro de script, console.error do site, requisição do site que falhou e todo 4xx/5xx
  // do próprio site (403 sempre); "esperado" desliga a vigia nos pedidos que o teste faz de propósito (404 do comum)
  async function novoCtx(larg, alt, rotulo, baseCtx = base) {
    const ctx = await browser.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: 1 });
    const origemCtx = baseCtx.replace(/\/$/, "");
    const meu = (u) => String(u || "").startsWith(origemCtx + "/");
    const st = { esperado: false, erros: [], fora: [] };
    // nada sai para outro site: o serviço de placas responde 503 aqui; o "outro site" da volta é barrado e anotado
    await ctx.route((u) => !String(u.href).startsWith(origemCtx + "/"), (rota) => {
      const url = rota.request().url();
      if (url.includes(FORA)) { st.fora.push(url); return rota.abort(); }
      if (/bapajudacatalogo-placas\.onrender\.com/.test(url)) return rota.fulfill({ status: 503, contentType: "application/json", body: '{"erro":"teste"}' });
      return rota.continue();
    });
    const vigiar = (page) => {
      page.on("console", (m) => {
        if (m.type() !== "error" || st.esperado) return;
        const u = (m.location() || {}).url || "";
        if (u && /bapajudacatalogo-placas\.onrender\.com/.test(u)) return; // o 503 que o próprio teste deu ao serviço de placas
        if (u && !meu(u)) aviso("l-cons", N_CONS, `${rotulo}: erro de recurso de fora (${corta(u, 60)}): ${corta(m.text(), 80)}`);
        else st.erros.push(corta(m.text(), 120));
      });
      page.on("pageerror", (e) => st.erros.push("erro de script: " + corta(e.message, 120)));
      page.on("response", (r) => {
        const s = r.status();
        if (!meu(r.url()) || s < 400) return;
        if (s === 403 || !st.esperado) st.erros.push(`${s} em ${corta(r.url().slice(origemCtx.length), 70)}`);
      });
      page.on("requestfailed", (r) => {
        if (meu(r.url()) && !st.esperado) st.erros.push(`requisição falhou: ${corta(r.url().slice(origemCtx.length), 70)} ${(r.failure() || {}).errorText || ""}`);
      });
    };
    const page = await ctx.newPage();
    vigiar(page);
    const conferir = (onde) => {
      for (const e of st.erros) falha("l-cons", N_CONS, `${rotulo}:${onde}:${e}`, `${rotulo} ${onde}: ${e}`);
      st.erros = [];
    };
    return { ctx, page, st, conferir, larg };
  }
  const caminho = (page) => { const u = new URL(page.url()); return u.pathname + u.search; };
  async function entrarUI(page, usuario, senha) {
    await page.waitForSelector("#form-entrar #usuario", { timeout: 10000 });
    await page.fill("#usuario", usuario);
    await page.fill("#senha", senha);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/entrar"), { timeout: 15000 }),
      page.click('#form-entrar button[type="submit"]'),
    ]);
  }
  async function trocaObrigatoria(page, nova, c, larg) {
    await page.waitForSelector("#form-senha #nova", { timeout: 10000 });
    const info = await page.evaluate(() => ({ atual: !!document.getElementById("atual"), h1: (document.querySelector("h1") || {}).textContent || "" }));
    if (info.atual) falha("l-admin", N_ADMIN, "troca-atual", "a troca obrigatória pede a senha atual");
    if (!/Crie a sua senha/.test(info.h1)) aviso("l-admin", N_ADMIN, `a troca obrigatória tem o título "${corta(info.h1, 40)}"`);
    await a11y(page, "troca obrigatória", larg);
    await page.fill("#nova", nova);
    await page.fill("#conf", nova);
    if (c) await print(page, "troca-obrigatoria", larg);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/trocar-senha"), { timeout: 15000 }),
      page.click('#form-senha button[type="submit"]'),
    ]);
  }
  const catalogoPronto = async (page) => {
    await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 20000 }).catch(() => {});
    await page.waitForSelector("#conta .conta-bt", { timeout: 10000 }).catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
  };
  async function abrirMenu(page) {
    const bt = await page.$("#conta .conta-bt");
    if (!bt) return null;
    await bt.click();
    await page.waitForSelector("#conta-menu:not([hidden])", { timeout: 5000 }).catch(() => {});
    return page.evaluate(() => ({
      links: [...document.querySelectorAll("#conta-menu a, #conta-menu button")].map((a) => [a.textContent.trim(), a.getAttribute("href") || ""]),
      nome: (document.querySelector("#conta .conta-nome b") || {}).textContent || "",
    }));
  }
  async function a11y(page, onde, larg) {
    const a = await page.evaluate(() => ({
      semAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.getAttribute("src")),
      semRotulo: [...document.querySelectorAll("input:not([type=hidden]):not([hidden]),select,textarea")].filter((el) => !((el.labels && el.labels.length) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"))).map((el) => el.id || el.name || el.type),
    })).catch((e) => { falha("l-a11y", N_A11Y, `erro:${onde}`, `${larg} px ${onde}: não conferi (${corta(e.message, 60)})`); return { semAlt: [], semRotulo: [] }; });
    for (const s of a.semAlt) falha("l-a11y", N_A11Y, `alt:${onde}:${s}`, `${larg} px ${onde}: imagem sem alt (${s})`);
    for (const s of a.semRotulo) falha("l-a11y", N_A11Y, `rot:${onde}:${s}`, `${larg} px ${onde}: campo sem rótulo (${s})`);
  }
  const ADMIN_TXT = /Criar usu[aá]rios|Cat[aá]logos em PDF/i;

  let adminCtx = null;
  try {
    // ---- 2. admin: login pela tela, troca obrigatória, Criar usuários, Catálogos em PDF (1366) ----
    {
      const c = await novoCtx(1366, 768, "admin 1366");
      const { page } = c;
      await page.goto(base, { waitUntil: "networkidle" });
      if (caminho(page) !== "/entrar?volta=%2F") falha("l-sem", N_SEM, "nav-raiz", `o navegador sem login em / foi para ${caminho(page)} (esperado /entrar?volta=%2F)`);
      await a11y(page, "login", 1366);
      await print(page, "entrar", 1366);
      c.conferir("login");
      await entrarUI(page, "admin", seg.senhaAdmin0);
      if (!caminho(page).startsWith("/trocar-senha")) falha("l-admin", N_ADMIN, "troca-1o", `o 1º acesso do admin foi para ${caminho(page)} (esperado /trocar-senha)`);
      await trocaObrigatoria(page, seg.senhaAdmin1, c, 1366);
      c.conferir("troca obrigatória (admin)");
      await catalogoPronto(page);
      // o cookie: HttpOnly, Secure, SameSite=Lax e 5 h
      const ck = (await c.ctx.cookies(base)).find((k) => k.name === "bap_sessao");
      if (!ck) falha("l-sessao", N_SESSAO, "cookie", "depois do login não há o cookie bap_sessao");
      else {
        const resta = ck.expires - Date.now() / 1000;
        if (!ck.httpOnly || !ck.secure || ck.sameSite !== "Lax") falha("l-sessao", N_SESSAO, "cookie-flags", `cookie com httpOnly=${ck.httpOnly}, secure=${ck.secure}, sameSite=${ck.sameSite} (esperado true, true, Lax)`);
        if (Math.abs(resta - SESSAO_H * 3600) > 120) falha("l-sessao", N_SESSAO, "cookie-5h", `o cookie vence em ${(resta / 3600).toFixed(2)} h (esperado 5 h)`);
      }
      const menu = await abrirMenu(page);
      if (!menu) falha("l-admin", N_ADMIN, "menu", "1366 px: o admin entrou e não há o botão do canto (#conta .conta-bt)");
      else {
        const hrefs = menu.links.map(([, h]) => h);
        for (const h of ["/admin/usuarios", "/admin/pdfs", "/trocar-senha"]) if (!hrefs.includes(h)) falha("l-admin", N_ADMIN, "menu:" + h, `1366 px: o menu do admin não tem o link ${h}`);
        if (!menu.links.some(([t]) => /^Sair$/.test(t))) falha("l-admin", N_ADMIN, "menu:sair", "1366 px: o menu do admin não tem o \"Sair\"");
      }
      await print(page, "menu-admin", 1366);
      c.conferir("catálogo (admin)");

      // Criar usuários: cria o comum pela tela; a lista mostra a etiqueta para quem ainda não trocou
      await page.goto(base + "admin/usuarios", { waitUntil: "networkidle" });
      await page.waitForSelector("#us-lista table", { timeout: 10000 });
      await page.click("#us-criar");
      await page.waitForSelector("dialog.dlg[open] #n-nome");
      await page.fill("#n-nome", COMUM.nome);
      await page.fill("#n-emp", COMUM.empresa);
      await page.fill("#n-us", COMUM.usuario);
      await page.fill("#n-senha", seg.senhaComum0);
      await a11y(page, "criar usuário (janela)", 1366);
      await page.click('dialog.dlg[open] button[type="submit"]');
      const criou = await page.waitForSelector("dialog.dlg[open] dl.entrega", { timeout: 10000 }).then(() => true, () => false);
      if (!criou) falha("l-admin", N_ADMIN, "criar", `a janela "Criar usuário" não mostrou a entrega do usuário (texto: ${corta(await page.evaluate(() => (document.querySelector("dialog.dlg") || {}).innerText || ""), 120)})`);
      await page.click("dialog.dlg[open] [data-fecha]").catch(() => {});
      await page.waitForFunction((u) => [...document.querySelectorAll("#us-lista tr")].some((tr) => tr.innerText.includes(u)), COMUM.usuario, { timeout: 10000 }).catch(() => {});
      const linhas = () => page.evaluate(() => [...document.querySelectorAll("#us-lista tbody tr")].map((tr) => ({ u: (tr.querySelector(".us-login") || {}).textContent || "", t: tr.innerText })));
      const L1 = await linhas();
      const lc = L1.find((l) => l.u === COMUM.usuario), la = L1.find((l) => l.u === "admin");
      if (!lc) falha("l-etq", N_ETQ, "lista", `a lista de usuários não tem o ${COMUM.usuario} depois de criar`);
      else if (!lc.t.includes("Falta trocar a senha inicial")) falha("l-etq", N_ETQ, "sem-etiqueta", `${COMUM.usuario} (ainda não trocou): sem a etiqueta "Falta trocar a senha inicial"`);
      if (la && la.t.includes("Falta trocar a senha inicial")) falha("l-etq", N_ETQ, "admin-etiqueta", "o admin já trocou a senha e ainda aparece com \"Falta trocar a senha inicial\"");
      await a11y(page, "Criar usuários", 1366);
      await print(page, "criar-usuarios", 1366);
      c.conferir("Criar usuários");

      // Catálogos em PDF: 2 cartões com o "Baixar PDF"; o download responde o PDF mais novo de catalogo_grafico/entregas/
      await page.goto(base + "admin/pdfs", { waitUntil: "networkidle" });
      await page.waitForSelector("#pdfs article.pdf", { timeout: 10000 }).catch(() => {});
      const pdfs = await page.evaluate(() => [...document.querySelectorAll("#pdfs a[href*='/admin/pdfs/baixar/']")].map((a) => a.getAttribute("href")));
      const ent = path.join(raiz, "catalogo_grafico", "entregas");
      const arqs = fs.existsSync(ent) ? fs.readdirSync(ent) : [];
      for (const [id, re] of [["completo-digital", /^Catalogo_BAP_(\d{4})_Completo_Digital\.pdf$/], ["a4-grafica", /^Catalogo_BAP_(\d{4})_A4_grafica\.pdf$/]]) {
        const href = "/admin/pdfs/baixar/" + id;
        if (!pdfs.includes(href)) { falha("l-admin", N_ADMIN, "pdf-link:" + id, `Catálogos em PDF sem o link ${href}`); continue; }
        const novo = arqs.filter((f) => re.test(f)).sort((a, b) => Number(b.match(re)[1]) - Number(a.match(re)[1]))[0];
        const r = await c.ctx.request.fetch(base + href.slice(1), { method: "HEAD", maxRedirects: 0 });
        const cd = r.headers()["content-disposition"] || "";
        if (r.status() !== 200 || !/application\/pdf/.test(r.headers()["content-type"] || "") || !/^attachment/.test(cd))
          falha("l-admin", N_ADMIN, "pdf:" + id, `${href}: ${r.status()} ${r.headers()["content-type"] || ""} ${cd} (esperado 200, application/pdf, attachment)`);
        else if (novo && (!cd.includes(novo) || Number(r.headers()["content-length"]) !== fs.statSync(path.join(ent, novo)).size))
          falha("l-admin", N_ADMIN, "pdf-arq:" + id, `${href}: entrega "${cd}" (${r.headers()["content-length"]} bytes); o mais novo é ${novo}`);
      }
      await a11y(page, "Catálogos em PDF", 1366);
      await print(page, "pdfs", 1366);
      c.conferir("Catálogos em PDF");
      adminCtx = c; // fica aberto para conferir a etiqueta depois da troca do comum
    }

    // ---- 3. comum: o link #/produto/X enviado antes do login, com a troca obrigatória no meio ----
    {
      const c = await novoCtx(1366, 768, "comum 1366");
      const { page } = c;
      await page.goto(base + "#/produto/" + P1, { waitUntil: "networkidle" });
      const u0 = new URL(page.url());
      if (u0.pathname !== "/entrar" || u0.hash !== "#/produto/" + P1) falha("l-link", N_LINK, "302-hash", `#/produto/${P1} sem login foi para ${u0.pathname}${u0.search}${u0.hash} (esperado /entrar com o #/produto/${P1})`);
      c.conferir("login (link do produto)");
      await entrarUI(page, COMUM.usuario, seg.senhaComum0);
      if (!caminho(page).startsWith("/trocar-senha")) falha("l-comum", N_COMUM, "troca-1o", `o 1º acesso do comum foi para ${caminho(page)} (esperado /trocar-senha)`);
      await a11y(page, "troca obrigatória (comum)", 1366);
      await trocaObrigatoria(page, seg.senhaComum1, null, 1366);
      c.conferir("troca obrigatória (comum)");
      await catalogoPronto(page);
      await page.waitForSelector("#app .prod-info h1", { timeout: 10000 }).catch(() => {});
      const h1 = await page.evaluate(() => ({ h: location.hash, t: ((document.querySelector("#app .prod-info h1") || {}).textContent || "").trim() }));
      if (h1.h !== "#/produto/" + P1 || h1.t !== P1) falha("l-link", N_LINK, "troca", `depois do login e da troca obrigatória: ${h1.h || "(sem hash)"}, título "${h1.t}" (esperado a página do ${P1})`);
      c.conferir("produto depois do login (comum)");

      // não vê nem abre o que é do admin
      const menu = await abrirMenu(page);
      if (!menu) falha("l-comum", N_COMUM, "menu", "1366 px: o comum entrou e não há o botão do canto");
      else {
        if (menu.links.some(([t, h]) => ADMIN_TXT.test(t) || h.startsWith("/admin"))) falha("l-comum", N_COMUM, "menu-admin", `1366 px: o menu do comum mostra ${menu.links.filter(([t, h]) => ADMIN_TXT.test(t) || h.startsWith("/admin")).map(([t]) => t).join(", ")}`);
        if (!menu.links.some(([, h]) => h === "/trocar-senha") || !menu.links.some(([t]) => t === "Sair")) falha("l-comum", N_COMUM, "menu-conta", "1366 px: o menu do comum sem \"Trocar senha\" ou \"Sair\"");
      }
      const dom = await page.evaluate(() => ({ txt: document.body.innerText, html: document.documentElement.outerHTML }));
      if (ADMIN_TXT.test(dom.txt) || /href="\/admin/.test(dom.html)) falha("l-comum", N_COMUM, "dom", "1366 px: a página do comum tem \"Criar usuários\", \"Catálogos em PDF\" ou link para /admin");
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await catalogoPronto(page);
      await abrirMenu(page);
      await print(page, "menu-cliente", 1366);
      c.conferir("catálogo com o menu (comum)");
      c.st.esperado = true; // daqui: os 404 são de propósito
      for (const cam of ["admin/usuarios", "admin/pdfs"]) {
        const r = await page.goto(base + cam, { waitUntil: "load" });
        const t = await page.evaluate(() => document.body.innerText);
        if (!r || r.status() !== 404 || ADMIN_TXT.test(t)) falha("l-comum", N_COMUM, "pagina:" + cam, `o comum abriu /${cam}: ${r ? r.status() : "?"} (esperado 404, sem a tela)`);
      }
      const api = async (cam, op = {}) => (await c.ctx.request.fetch(base + cam, { maxRedirects: 0, ...op })).status();
      for (const cam of ["admin/usuarios/index.html", "admin/usuarios/usuarios.js", "admin/pdfs/pdfs.js", "admin/admin.css", "api/usuarios", "api/pdfs", "api/usuarios/admin/logo", "admin/pdfs/baixar/completo-digital", "admin/pdfs/baixar/a4-grafica"]) {
        const s = await api(cam);
        if (s !== 404) falha("l-comum", N_COMUM, "get:" + cam, `o comum pediu /${cam}: ${s} (esperado 404)`);
      }
      const post = await api("api/usuarios", { method: "POST", headers: { Origin: origem, "Content-Type": "application/json" }, data: { usuario: "intruso.teste", nome: "Intruso", empresa: "X", senha: falsa("intruso") } });
      if (post !== 404) falha("l-comum", N_COMUM, "post", `o comum tentou criar usuário (POST /api/usuarios): ${post} (esperado 404)`);
      const patch = await api("api/usuarios/admin", { method: "PATCH", headers: { Origin: origem, "Content-Type": "application/json" }, data: { ativo: false } });
      if (patch !== 404) falha("l-comum", N_COMUM, "patch", `o comum tentou desativar o admin (PATCH /api/usuarios/admin): ${patch} (esperado 404)`);
      c.st.esperado = false;
      await c.ctx.close();
    }

    // a etiqueta some depois que o comum troca a senha
    {
      const c = adminCtx;
      await c.page.goto(base + "admin/usuarios", { waitUntil: "networkidle" });
      await c.page.waitForSelector("#us-lista table", { timeout: 10000 }).catch(() => {});
      const lc = (await c.page.evaluate(() => [...document.querySelectorAll("#us-lista tbody tr")].map((tr) => ({ u: (tr.querySelector(".us-login") || {}).textContent || "", t: tr.innerText })))).find((l) => l.u === COMUM.usuario);
      if (!lc) falha("l-etq", N_ETQ, "lista2", `a lista não tem mais o ${COMUM.usuario}`);
      else if (lc.t.includes("Falta trocar a senha inicial")) falha("l-etq", N_ETQ, "nao-saiu", `${COMUM.usuario} já trocou a senha e ainda tem a etiqueta "Falta trocar a senha inicial"`);
      if (lc && /intruso/.test(await c.page.evaluate(() => document.body.innerText))) falha("l-comum", N_COMUM, "intruso", "o POST do comum criou o usuário intruso.teste");
      c.conferir("Criar usuários (depois da troca)");
      await c.ctx.close();
    }
    detalhe("l-etq", N_ETQ, `${COMUM.usuario} com a etiqueta "Falta trocar a senha inicial" logo depois de criado e sem ela depois da troca; admin sem a etiqueta`);

    // ---- 4. 390 px: login, admin (menu, Criar usuários, PDFs) e comum (link direto sem troca, menu) ----
    {
      const c = await novoCtx(390, 844, "admin 390");
      const { page } = c;
      await page.goto(base, { waitUntil: "networkidle" });
      await a11y(page, "login", 390);
      await print(page, "entrar", 390);
      c.conferir("login");
      await entrarUI(page, "admin", seg.senhaAdmin1);
      await catalogoPronto(page);
      const menu = await abrirMenu(page);
      if (!menu || !menu.links.some(([, h]) => h === "/admin/usuarios") || !menu.links.some(([, h]) => h === "/admin/pdfs")) falha("l-admin", N_ADMIN, "menu-390", "390 px: o menu do admin sem \"Criar usuários\" ou \"Catálogos em PDF\"");
      await print(page, "menu-admin", 390);
      c.conferir("catálogo com o menu (admin)");
      for (const [cam, sel, nome] of [["admin/usuarios", "#us-lista table", "criar-usuarios"], ["admin/pdfs", "#pdfs article.pdf", "pdfs"]]) {
        await page.goto(base + cam, { waitUntil: "networkidle" });
        await page.waitForSelector(sel, { timeout: 10000 }).catch(() => falha("l-admin", N_ADMIN, "390:" + cam, `390 px: /${cam} sem ${sel}`));
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        if (sw > 390) falha("l-admin", N_ADMIN, "largura:" + cam, `390 px: /${cam} rola de lado (scrollWidth = ${sw})`);
        await a11y(page, cam, 390);
        await print(page, nome, 390);
        c.conferir("/" + cam);
      }
      await c.ctx.close();
    }
    {
      const c = await novoCtx(390, 844, "comum 390");
      const { page } = c;
      await page.goto(base + "#/produto/" + P2, { waitUntil: "networkidle" });
      await entrarUI(page, COMUM.usuario, seg.senhaComum1);
      await catalogoPronto(page);
      await page.waitForSelector("#app .prod-info h1", { timeout: 10000 }).catch(() => {});
      const h1 = await page.evaluate(() => ({ h: location.hash, t: ((document.querySelector("#app .prod-info h1") || {}).textContent || "").trim(), sw: document.documentElement.scrollWidth }));
      if (h1.h !== "#/produto/" + P2 || h1.t !== P2) falha("l-link", N_LINK, "direto", `390 px: #/produto/${P2} antes do login abriu ${h1.h || "(sem hash)"}, título "${h1.t}"`);
      c.conferir("produto depois do login (comum)");
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await catalogoPronto(page);
      const menu = await abrirMenu(page);
      if (!menu) falha("l-comum", N_COMUM, "menu-390", "390 px: o comum sem o botão do canto");
      else if (menu.links.some(([t, h]) => ADMIN_TXT.test(t) || h.startsWith("/admin"))) falha("l-comum", N_COMUM, "menu-admin-390", "390 px: o menu do comum mostra item do admin");
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > 390) falha("l-comum", N_COMUM, "largura", `390 px: o catálogo com o menu aberto rola de lado (scrollWidth = ${sw})`);
      await print(page, "menu-cliente", 390);
      c.conferir("catálogo com o menu (comum)");
      await c.ctx.close();
    }
    detalhe("l-link", N_LINK, `#/produto/${P1} antes do login abre o produto depois do login e da troca obrigatória (1366); #/produto/${P2} depois do login direto (390)`);
    detalhe("l-comum", N_COMUM, "menu sem os itens do admin (1366 e 390); /admin/usuarios e /admin/pdfs 404 sem a tela; arquivos do admin, /api/usuarios, /api/pdfs e os 2 downloads 404; POST e PATCH do comum 404");
    detalhe("l-admin", N_ADMIN, "1º acesso → troca obrigatória (sem a senha atual) → catálogo; menu com Criar usuários, Catálogos em PDF, Trocar senha e Sair; usuário criado pela tela; 2 PDFs (HEAD 200, application/pdf, attachment, o arquivo mais novo)");

    // ---- 5. volta: "//", "/\", codificados e outro site não levam para fora ----
    {
      const casos = ["//" + FORA + "/x", "/\\" + FORA + "/x", "%2F%2F" + FORA + "%2Fx", "%2F%5C" + FORA, "/%5C" + FORA, "https://" + FORA + "/", "/%09/" + FORA, "/%0A/" + FORA];
      for (const v of casos) {
        const c = await novoCtx(1366, 768, "volta");
        const { page } = c;
        await page.goto(base + "entrar?volta=" + v, { waitUntil: "networkidle" });
        await entrarUI(page, COMUM.usuario, seg.senhaComum1).catch(() => {});
        await page.waitForTimeout(300);
        const u = new URL(page.url());
        if (c.st.fora.length) falha("l-volta", N_VOLTA, "fora:" + v, `/entrar?volta=${v}: depois do login o navegador foi para ${c.st.fora[0]} (outro site; pedido barrado no teste)`);
        else if (u.origin !== origem) falha("l-volta", N_VOLTA, "fora:" + v, `/entrar?volta=${v}: depois do login foi para ${page.url()}`);
        else if (u.pathname.startsWith("/entrar")) falha("l-volta", N_VOLTA, "entrar:" + v, `/entrar?volta=${v}: o login não saiu de /entrar`);
        c.conferir("volta " + v);
        await c.ctx.close();
      }
      // no servidor: a página pedida com "//host" ou "/\host" volta para "/"
      for (const cam of ["//" + FORA + "/x", "/\\" + FORA + "/x", "//" + FORA]) {
        const r = await cru(base, cam, { cab: PAG });
        const loc = r.cab.location || "";
        if (r.status !== 302 || loc !== "/entrar?volta=%2F") falha("l-volta", N_VOLTA, "srv:" + cam, `GET ${cam} sem login: ${r.status} → "${loc}" (esperado 302 → /entrar?volta=%2F)`);
      }
      detalhe("l-volta", N_VOLTA, `${casos.length} volta(s) no entrar.js (${casos.map((v) => JSON.stringify(v)).join(", ")}) ficam em ${origem}; o servidor manda "//host" e "/\\host" para /entrar?volta=%2F`);
    }

    // ---- 6. sessão de 5 h com o relógio adiantado (o serviço importado com criarServico({ agora })) ----
    {
      let mod = null;
      try { mod = await import(pathToFileURL(path.join(raiz, "servicos", "login", "server.mjs")).href); } catch (e) { falha("l-sessao", N_SESSAO, "import", `não importei o server.mjs: ${corta(e.message)}`); }
      if (mod && typeof mod.criarServico === "function") {
        let desvio = 0;
        const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "bap-login-relogio-"));
        const s0 = falsa("admin-relogio"), s1 = falsa("admin-relogio2");
        const svc = await mod.criarServico({ env: { PASTA_DADOS: pasta, SESSAO_SEGREDO: falsa("segredo-relogio"), ADMIN_USUARIO: "admin", ADMIN_SENHA_INICIAL: s0 }, agora: () => Date.now() + desvio, log: () => {} });
        await new Promise((ok) => svc.listen(0, ok));
        const b2 = `http://localhost:${svc.address().port}/`;
        try {
          const o2 = b2.replace(/\/$/, "");
          let e = await entrarApi(b2, "admin", s0);
          const tr = await cru(b2, "/api/trocar-senha", { metodo: "POST", cab: { Origin: o2, Cookie: e.cookie, "Content-Type": "application/json" }, corpo: JSON.stringify({ senhaNova: s1 }) });
          if (tr.status !== 204) falha("l-sessao", N_SESSAO, "troca", `troca pela API no serviço do relógio: ${tr.status}`);
          e = await entrarApi(b2, "admin", s1);
          const sc = (e.r.cab["set-cookie"] || [])[0] || "";
          // Max-Age: o serviço arredonda para baixo o que falta até as 5 h; 1 ou 2 s a menos é o tempo do próprio pedido
          const ma = Number((sc.match(/Max-Age=(\d+)/) || [])[1]);
          if (!(ma >= SESSAO_H * 3600 - 5 && ma <= SESSAO_H * 3600) || !/HttpOnly/i.test(sc) || !/Secure/i.test(sc) || !/SameSite=Lax/i.test(sc)) falha("l-sessao", N_SESSAO, "set-cookie", `Set-Cookie do login sem Max-Age de 5 h (18000 s), HttpOnly, Secure ou SameSite=Lax: ${corta(sc.replace(/=[^;]+/, "=…"), 100)}`);
          const eu = async () => cru(b2, "/api/eu", { cab: { Cookie: e.cookie, Accept: "application/json" } });
          const pag = async () => cru(b2, "/", { cab: { ...PAG, Cookie: e.cookie } });
          const json = async () => cru(b2, "/data/produtos.json", { cab: { Accept: "*/*", Cookie: e.cookie } });
          const r0 = await eu();
          let exp = 0;
          try { exp = Date.parse(JSON.parse(r0.corpo.toString("utf8")).expiraEm); } catch { /* vazio */ }
          if (r0.status !== 200 || Math.abs(exp - Date.now() - SESSAO_H * HORA) > 60e3) falha("l-sessao", N_SESSAO, "expiraEm", `/api/eu logo depois do login: ${r0.status}, expiraEm a ${((exp - Date.now()) / HORA).toFixed(2)} h (esperado 5 h)`);
          desvio = SESSAO_H * HORA - 60e3; // 4 h 59
          const [a1, a2, a3] = [await eu(), await pag(), await json()];
          if (a1.status !== 200 || a2.status !== 200 || a3.status !== 200) falha("l-sessao", N_SESSAO, "4h59", `com 4 h 59: /api/eu ${a1.status}, / ${a2.status}, produtos.json ${a3.status} (esperado 200 nos 3)`);
          desvio = SESSAO_H * HORA + 60e3; // 5 h 01
          const [b1, b2r, b3] = [await eu(), await pag(), await json()];
          if (b1.status !== 401) falha("l-sessao", N_SESSAO, "5h01-api", `com 5 h 01: /api/eu ${b1.status} (esperado 401)`);
          if (b2r.status !== 302 || b2r.cab.location !== "/entrar?expirou=1") falha("l-sessao", N_SESSAO, "5h01-pag", `com 5 h 01: / ${b2r.status} → "${b2r.cab.location || ""}" (esperado 302 → /entrar?expirou=1)`);
          if (b3.status !== 401) falha("l-sessao", N_SESSAO, "5h01-json", `com 5 h 01: produtos.json ${b3.status} (esperado 401)`);

          // no navegador: entra, o relógio passa de 5 h, a página recarregada leva ao login com o aviso
          desvio = 0;
          const c = await novoCtx(1366, 768, "sessão 1366", b2);
          const { page } = c;
          await page.goto(b2 + "#/produto/" + P1, { waitUntil: "networkidle" });
          await entrarUI(page, "admin", s1);
          await catalogoPronto(page);
          c.conferir("antes de vencer");
          desvio = SESSAO_H * HORA + 60e3;
          c.st.esperado = true;
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForSelector("#form-entrar", { timeout: 10000 }).catch(() => {});
          const v = await page.evaluate(() => ({ p: location.pathname + location.search, t: document.body.innerText }));
          if (v.p !== "/entrar?expirou=1" || !/sess[aã]o terminou/i.test(v.t)) falha("l-sessao", N_SESSAO, "navegador", `no navegador, com 5 h 01 a página recarregada foi para ${v.p} ${/sess[aã]o terminou/i.test(v.t) ? "" : 'sem o aviso "Sua sessão terminou"'}`);
          await print(page, "sessao-vencida", 1366);
          c.st.esperado = false;
          c.conferir("sessão vencida");
          await c.ctx.close();
          detalhe("l-sessao", N_SESSAO, "cookie HttpOnly, Secure, SameSite=Lax, Max-Age=18000; relógio adiantado: 4 h 59 vale (API, página, JSON); 5 h 01: API e JSON 401, página 302 /entrar?expirou=1 e o aviso na tela");
        } finally {
          const fechou = new Promise((ok) => svc.close(ok));
          svc.closeAllConnections();
          await fechou;
          fs.rmSync(pasta, { recursive: true, force: true });
        }
      } else if (mod) falha("l-sessao", N_SESSAO, "criarServico", "o server.mjs não exporta criarServico (o teste do relógio precisa dele)");
    }
    detalhe("l-cons", N_CONS, "0 erro de script, 0 console.error do site, 0 403 e 0 4xx/5xx não esperados em login, troca obrigatória (admin e comum), catálogo, menu, Criar usuários, Catálogos em PDF e volta");
    detalhe("l-a11y", N_A11Y, "login, troca obrigatória, janela Criar usuário, Criar usuários e Catálogos em PDF: campos com rótulo e imagens com alt");
  } finally {
    await browser.close();
  }

  // ---- 7. o log do serviço sem senha, segredo nem chave ----
  const log = srv.log();
  for (const [k, v] of Object.entries(seg)) if (log.includes(v)) falha("l-log", N_LOG, k, `o log do serviço mostra ${k.replace(/\d$/, "")} (valor de teste)`);
  if (log.includes(COMUM.usuario)) aviso("l-log", N_LOG, `o log do serviço mostra o usuário ${COMUM.usuario} (o LEIA.md diz que não mostra)`);
  detalhe("l-log", N_LOG, `${log.split("\n").filter(Boolean).length} linhas de log, sem as 4 senhas, o segredo da sessão e a chave interna`);
  return { usuario: COMUM.usuario, senha: seg.senhaComum1, prints };
}

// login pela tela, para as buscas de sempre (testar_site.mjs): abre a raiz, entra e espera o catálogo
export async function entrarParaBuscas(page, base, usuario, senha) {
  await page.goto(base, { waitUntil: "networkidle" });
  if (!new URL(page.url()).pathname.startsWith("/entrar")) throw new Error(`--login: a raiz sem login foi para ${page.url()} (esperado /entrar)`);
  await page.fill("#usuario", usuario);
  await page.fill("#senha", senha);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/entrar"), { timeout: 15000 }), page.click('#form-entrar button[type="submit"]')]);
  await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 20000 }).catch(() => {});
}
