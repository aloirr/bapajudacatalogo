/* Testes do login do catálogo (T-0022 e T-0024, 22/11/2026; T-0032, 23/11/2026). Dono: agente testes.
   Usado por scripts/testar_site.mjs --login (não roda sozinho). As regras do serviço por HTTP (sessão, origem, rotas
   do admin, volta no servidor) são dos testes do próprio serviço (servicos/login/*.test.mjs); aqui fica o que só se vê
   com o serviço de verdade, o site/ real e o navegador.

   O que faz:
     - sobe o serviço de verdade (node servicos/login/server.mjs) numa porta livre, com uma PASTA_DADOS temporária e
       valores claramente falsos, gerados aqui a cada rodada (nunca impressos, nunca gravados);
     - sem login, num passe só contra o site/ e os PDFs reais: a página, o produtos.json, uma foto, os PDFs, as páginas
       do admin e a API respondem 401 ou levam ao /entrar; o /entrar abre sem dado do catálogo;
     - entra como admin pela tela, faz a troca obrigatória, cria pela tela "Criar usuários" um usuário comum e confere a
       etiqueta "Falta trocar a senha inicial" (some depois que ele troca);
     - o usuário comum: o link #/produto/X enviado antes do login abre o produto depois do login (com e sem a troca
       obrigatória); não vê "Criar usuários" nem "Catálogos, materiais e treinamentos" (menu e página) e as 2 páginas
       dão 404;
     - "volta" com "//", "/\", codificados, outro site, tabulação ou quebra de linha não leva para fora (no navegador);
     - sessão de 5 h: o cookie no navegador (HttpOnly, Secure, SameSite=Lax, 5 h) e, com o serviço importado com o
       relógio adiantável (criarServico({ agora })), entrando pela tela: 4 h 59 ainda vale e 5 h 01 leva ao
       /entrar?expirou=1 com o aviso;
     - console sem erro em todas as telas, inclusive na troca obrigatória (nenhum 403 nem 4xx do próprio site);
     - o log do serviço sem senha, segredo nem chave;
     - prints em 1366 × 768 e 390 × 844 (deviceScaleFactor 1): login, troca obrigatória, catálogo com o menu aberto
       (cliente e admin), Criar usuários e Catálogos, materiais e treinamentos (a página inteira), mais a sessão vencida.
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
const FORA = "example.invalid"; // o "outro site" dos testes da volta (nunca é chamado: o pedido é barrado)
const ETIQUETA = "Falta trocar a senha inicial";
// Catálogos, materiais e treinamentos (T-0024, T-0032). A expectativa da tela sai do GET /api/pdfs do admin (a lista do
// serviço, com o arquivo já resolvido) e do GRUPOS do site/admin/pdfs/pdfs.js (os grupos da tela e a ordem deles), nunca de
// números fixos: o teste vale antes e depois de cada PR, em qualquer ordem. A lista em si (ids, pares, regex do arquivo,
// Content-Type e download) é dos testes do serviço (servicos/login/login.test.mjs); aqui fica só o que a tela monta.
const TITULOS_PDFS = ["Catálogos e materiais", "Catálogos, materiais e treinamentos"]; // o nome da T-0024 e o da T-0032
const NOME_TIPO = { pdf: "PDF", pptx: "PowerPoint" };

// o GRUPOS do pdfs.js: [[chave, título]], na ordem da tela
function lerGruposTela(raiz) {
  const src = fs.readFileSync(path.join(raiz, "site", "admin", "pdfs", "pdfs.js"), "utf8");
  const ini = src.indexOf("const GRUPOS = [");
  const fim = ini < 0 ? -1 : src.indexOf("];", ini);
  if (ini < 0 || fim < 0) throw new Error("não achei o GRUPOS no site/admin/pdfs/pdfs.js");
  const grupos = [...src.slice(ini, fim).matchAll(/\[\s*"([^"]+)",\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]);
  if (!grupos.length) throw new Error("o GRUPOS do site/admin/pdfs/pdfs.js está vazio");
  return grupos;
}
// o que a tela tem de montar, com a regra do pdfs.js: o mesmo "par" vira 1 cartão (o 1º item é o principal); grupo fora
// do GRUPOS vai para o 1º. Devolve as seções na ordem do GRUPOS, só as que têm cartão: [{ g, nome, cartoes: [{ titulo, itens }] }]
function telaEsperada(lista, grupos) {
  const cartoes = [], porPar = new Map();
  for (const p of lista) {
    if (p.par && porPar.has(p.par)) { porPar.get(p.par).itens.push(p); continue; }
    const c = { grupo: grupos.some(([g]) => g === p.grupo) ? p.grupo : grupos[0][0], titulo: p.titulo, itens: [p] };
    if (p.par) porPar.set(p.par, c);
    cartoes.push(c);
  }
  return grupos.map(([g, nome]) => ({ g, nome, cartoes: cartoes.filter((c) => c.grupo === g) })).filter((x) => x.cartoes.length);
}

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
  // se o serviço não subir (saiu cedo ou passou dos 15 s): mata o filho e apaga a pasta antes de devolver o erro
  const porta = await new Promise((ok, erro) => {
    const t = setTimeout(() => erro(new Error("--login: o serviço não respondeu \"login ouvindo\" em 15 s. Log: " + log.slice(0, 300))), 15000);
    const ler = (b) => {
      log += b.toString("utf8");
      const m = log.match(/login ouvindo (\d+)/);
      if (m) { clearTimeout(t); ok(Number(m[1])); }
    };
    filho.stdout.on("data", ler);
    filho.stderr.on("data", ler);
    filho.once("exit", (c) => { clearTimeout(t); erro(new Error(`--login: o serviço saiu (código ${c}). Log: ${log.slice(0, 300)}`)); });
  }).catch((e) => {
    filho.removeAllListeners("exit");
    if (filho.exitCode === null && filho.signalCode === null) filho.kill("SIGKILL");
    fs.rmSync(pasta, { recursive: true, force: true });
    throw e;
  });
  return {
    base: `http://localhost:${porta}/`, seg,
    log: () => log,
    parar: () => new Promise((ok) => {
      filho.removeAllListeners("exit");
      const fim = () => { fs.rmSync(pasta, { recursive: true, force: true }); ok(); };
      if (filho.exitCode !== null || filho.signalCode !== null) return fim();
      filho.once("exit", fim);
      filho.kill("SIGTERM");
      setTimeout(() => filho.kill("SIGKILL"), 5000).unref();
    }),
  };
}

// pedido HTTP sem cookie e sem seguir o 302 (o passe "sem login")
function cru(base, caminho, cab) {
  const u = new URL(base);
  return new Promise((ok, erro) => {
    const req = http.request({ host: u.hostname, port: u.port, path: caminho, headers: cab }, (res) => {
      const partes = [];
      res.on("data", (b) => partes.push(b));
      res.on("end", () => ok({ status: res.statusCode, cab: res.headers, corpo: Buffer.concat(partes) }));
    });
    req.on("error", erro);
    req.end();
  });
}

// login pela tela: preenche o /entrar já aberto e espera sair dele
async function entrarUI(page, usuario, senha) {
  await page.waitForSelector("#form-entrar #usuario", { timeout: 10000 });
  await page.fill("#usuario", usuario);
  await page.fill("#senha", senha);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/entrar"), { timeout: 15000 }),
    page.click('#form-entrar button[type="submit"]'),
  ]);
}

// login pela tela, para as buscas de sempre (testar_site.mjs)
export async function entrarParaBuscas(page, base, usuario, senha) {
  await page.goto(base, { waitUntil: "networkidle" });
  await entrarUI(page, usuario, senha);
}

// ---------- a bateria do login ----------
// reg: { teste, falha, aviso, detalhe, cortar, RX_PLACAS, vigiar, casos } do testar_site.mjs. Devolve o usuário comum
// já com a senha trocada, para as buscas de sempre rodarem com login.
export async function testarLogin({ raiz, srv, dirPrints, prods, reg }) {
  const { teste, falha, aviso, detalhe, cortar, RX_PLACAS, vigiar, casos } = reg;
  const { base, seg } = srv;
  const origem = base.replace(/\/$/, "");
  const COMUM = { usuario: "cliente.teste", nome: "Cliente Teste", empresa: "Oficina Teste" };
  const N_SEM = "login: sem login fecha", N_SESSAO = "login: sessão de 5 h", N_COMUM = "login: comum sem admin",
    N_LINK = "login: link do produto", N_VOLTA = "login: volta segura", N_ETQ = "login: etiqueta da troca",
    N_CONS = "login: console sem erro", N_ADMIN = "login: telas do admin", N_LOG = "login: log sem segredo",
    N_A11Y = "login: acessibilidade";
  for (const [id, n] of [["l-sem", N_SEM], ["l-sessao", N_SESSAO], ["l-comum", N_COMUM], ["l-link", N_LINK], ["l-volta", N_VOLTA],
    ["l-etq", N_ETQ], ["l-admin", N_ADMIN], ["l-cons", N_CONS], ["l-a11y", N_A11Y], ["l-log", N_LOG]]) teste(id, n);
  const { COD, FOTO } = casos;
  const foto = (prods.find((p) => p.c === FOTO) || {}).i;

  // ---- 1. sem login: um passe, sem cookie, contra o site/ e os PDFs reais ----
  const PAG = { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" }, OUTRO = { Accept: "*/*" };
  const semLogin = [
    ["/", PAG], ["/index.html", PAG], ["/app.js", OUTRO], ["/conta.js", OUTRO], ["/data/produtos.json", OUTRO],
    ["/data/produtos.json", PAG], ...(foto ? [["/img/" + encodeURIComponent(foto), OUTRO], ["/img/" + encodeURIComponent(foto), PAG]] : []),
    ["/admin/pdfs/baixar/completo-digital", OUTRO], ["/admin/pdfs/baixar/a4-grafica", OUTRO], ["/admin/pdfs/baixar/completo-digital", PAG],
    ["/admin/usuarios", PAG], ["/admin/pdfs", PAG], ["/admin/usuarios/usuarios.js", OUTRO], ["/trocar-senha", PAG],
    ["/api/eu", OUTRO], ["/api/usuarios", OUTRO], ["/api/pdfs", OUTRO], ["/api/eu/logo", OUTRO], ["/interno/codigos", OUTRO],
  ];
  if (!foto) falha("l-sem", N_SEM, "foto", `o ${FOTO} não tem foto no JSON: escolher outro caso no scripts/testar_site.mjs`);
  for (const [cam, cab] of semLogin) {
    const r = await cru(base, cam, cab);
    const tipo = cab === PAG ? "página" : "arquivo";
    const loc = r.cab.location || "";
    const ok = r.status === 401 || (r.status === 302 && /^\/entrar(\?|$)/.test(loc));
    if (!ok) falha("l-sem", N_SEM, `${cam}:${tipo}`, `${cam} (${tipo}): respondeu ${r.status}${loc ? " → " + loc : ""} (esperado 401 ou 302 para /entrar)`);
    else if (r.corpo.length > 2048 || r.corpo.includes(COD)) falha("l-sem", N_SEM, `${cam}:${tipo}:corpo`, `${cam} (${tipo}): ${r.status} com corpo de ${r.corpo.length} bytes (dado do catálogo?)`);
  }
  {
    const r = await cru(base, "/entrar", PAG);
    if (r.status !== 200 || !r.corpo.includes("form-entrar")) falha("l-sem", N_SEM, "entrar", `/entrar respondeu ${r.status} sem o formulário`);
    if (r.corpo.includes(COD)) falha("l-sem", N_SEM, "entrar-dado", "/entrar tem dado do catálogo");
  }
  detalhe("l-sem", N_SEM, `${semLogin.length} pedidos sem cookie (página, app.js, produtos.json, foto ${foto || "?"}, 2 PDFs, admin, API): 401 ou 302 /entrar; /entrar abre sem dado do catálogo`);

  // ---- navegador ----
  const { createRequire } = await import("node:module");
  const { chromium } = createRequire(import.meta.url)("playwright");
  const browser = await chromium.launch();
  const print = (page, nome, larg) => page.screenshot({ path: path.join(dirPrints, `login-${nome}-${larg}.png`) });

  // contexto com a vigia do console (a mesma das buscas) e mais todo 4xx/5xx do próprio site (403 sempre); "esperado"
  // desliga a vigia nos erros que o teste faz de propósito (404 do comum, sessão vencida)
  async function novoCtx(larg, alt, rotulo, baseCtx = base) {
    const ctx = await browser.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: 1 });
    const origemCtx = baseCtx.replace(/\/$/, "");
    const st = { esperado: false, erros: [], fora: [] };
    // nada sai para outro site: o serviço de placas responde 503 aqui; o "outro site" da volta é barrado e anotado
    await ctx.route((u) => !String(u.href).startsWith(baseCtx), (rota) => {
      const url = rota.request().url();
      if (url.includes(FORA)) { st.fora.push(url); return rota.abort(); }
      if (RX_PLACAS.test(url)) return rota.fulfill({ status: 503, contentType: "application/json", body: '{"erro":"teste"}' });
      return rota.continue();
    });
    const page = await ctx.newPage();
    vigiar(page, {
      base: baseCtx, emErro: (t) => st.erros.push(t), id: "l-cons", nome: N_CONS, rotulo: rotulo + ": ",
      ignorar: (u) => RX_PLACAS.test(u) || String(u).includes(FORA), pausado: () => st.esperado,
    });
    page.on("response", (r) => {
      const s = r.status();
      if (s >= 400 && r.url().startsWith(baseCtx) && (s === 403 || !st.esperado)) st.erros.push(`${s} em ${cortar(r.url().slice(origemCtx.length), 70)}`);
    });
    const conferir = (onde) => {
      for (const e of st.erros) falha("l-cons", N_CONS, `${rotulo}:${onde}:${e}`, `${rotulo} ${onde}: ${e}`);
      st.erros = [];
    };
    return { ctx, page, st, conferir };
  }
  const caminho = (page) => { const u = new URL(page.url()); return u.pathname + u.search; };
  async function a11y(page, onde, larg) {
    const a = await page.evaluate(() => ({
      semAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).map((i) => i.getAttribute("src")),
      semRotulo: [...document.querySelectorAll("input:not([type=hidden]):not([hidden]),select,textarea")].filter((el) => !((el.labels && el.labels.length) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby"))).map((el) => el.id || el.name || el.type),
    })).catch((e) => { falha("l-a11y", N_A11Y, `erro:${onde}`, `${larg} px ${onde}: não conferi (${cortar(e.message, 60)})`); return { semAlt: [], semRotulo: [] }; });
    for (const s of a.semAlt) falha("l-a11y", N_A11Y, `alt:${onde}:${s}`, `${larg} px ${onde}: imagem sem alt (${s})`);
    for (const s of a.semRotulo) falha("l-a11y", N_A11Y, `rot:${onde}:${s}`, `${larg} px ${onde}: campo sem rótulo (${s})`);
  }
  // a troca obrigatória do 1º acesso, pela tela (o título, a falta da senha atual e a a11y só quando "conferir")
  async function trocaObrigatoria(page, nova, { conferir = true, printar = false } = {}) {
    await page.waitForSelector("#form-senha #nova", { timeout: 10000 });
    if (conferir) {
      const info = await page.evaluate(() => ({ atual: !!document.getElementById("atual"), h1: (document.querySelector("h1") || {}).textContent || "" }));
      if (info.atual) falha("l-admin", N_ADMIN, "troca-atual", "a troca obrigatória pede a senha atual");
      if (!/Crie a sua senha/.test(info.h1)) aviso("l-admin", N_ADMIN, `a troca obrigatória tem o título "${cortar(info.h1, 40)}"`);
      await a11y(page, "troca obrigatória", 1366);
    }
    await page.fill("#nova", nova);
    await page.fill("#conf", nova);
    if (printar) await print(page, "troca-obrigatoria", 1366);
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
  // abre o menu do canto e devolve os itens [texto, href]
  async function abrirMenu(page) {
    const bt = await page.$("#conta .conta-bt");
    if (!bt) return null;
    await bt.click();
    await page.waitForSelector("#conta-menu:not([hidden])", { timeout: 5000 }).catch(() => {});
    return page.evaluate(() => [...document.querySelectorAll("#conta-menu a, #conta-menu button")].map((a) => [a.textContent.trim(), a.getAttribute("href") || ""]));
  }
  const linhasUsuarios = (page) => page.evaluate(() => [...document.querySelectorAll("#us-lista tbody tr")].map((tr) => ({ u: (tr.querySelector(".us-login") || {}).textContent || "", t: tr.innerText })));
  // os 2 itens do admin no menu e nas páginas: "Criar usuários" e "Catálogos, materiais e treinamentos" (T-0032; casa também
  // com o nome antigo, "Catálogos e materiais")
  const ADMIN_TXT = /Criar usu[aá]rios|Cat[aá]logos(,| e) materiais/i;
  // o nome da página dos arquivos visto no menu e no h1, e o resumo do que a página mostrou (para o detalhe)
  let tituloMenu = "", tituloPdfs = "/admin/pdfs", resumoPdfs = "não conferido";
  const ehAdmin = ([t, h]) => ADMIN_TXT.test(t) || h.startsWith("/admin");

  let adminCtx = null;
  try {
    // ---- 2. admin: login pela tela, troca obrigatória, Criar usuários, Catálogos e materiais (1366) ----
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
      await trocaObrigatoria(page, seg.senhaAdmin1, { printar: true });
      c.conferir("troca obrigatória (admin)");
      await catalogoPronto(page);
      // o cookie no navegador: HttpOnly, Secure, SameSite=Lax e 5 h
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
        const hrefs = menu.map(([, h]) => h);
        for (const h of ["/admin/usuarios", "/admin/pdfs", "/trocar-senha"]) if (!hrefs.includes(h)) falha("l-admin", N_ADMIN, "menu:" + h, `1366 px: o menu do admin não tem o link ${h}`);
        if (!menu.some(([t]) => t === "Sair")) falha("l-admin", N_ADMIN, "menu:sair", "1366 px: o menu do admin não tem o \"Sair\"");
        const itemPdfs = menu.find(([, h]) => h === "/admin/pdfs");
        if (itemPdfs) tituloMenu = itemPdfs[0];
        if (itemPdfs && !TITULOS_PDFS.includes(itemPdfs[0])) falha("l-admin", N_ADMIN, "menu:titulo", `1366 px: o item /admin/pdfs do menu diz "${cortar(itemPdfs[0], 60)}" (esperado ${TITULOS_PDFS.map((t) => `"${t}"`).join(" ou ")})`);
        if (menu.some(([t, h]) => !h.startsWith("/admin") && ADMIN_TXT.test(t))) falha("l-admin", N_ADMIN, "menu:regex", "1366 px: item do menu com o nome de admin sem link /admin");
        for (const h of ["/admin/usuarios", "/admin/pdfs"]) {
          const it = menu.find(([, x]) => x === h);
          if (it && !ADMIN_TXT.test(it[0])) falha("l-admin", N_ADMIN, "menu:regex:" + h, `1366 px: o ADMIN_TXT do teste não casa com "${it[0]}" (o item ${h} do menu): a conferência do comum ficaria cega`);
        }
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
      if (!criou) falha("l-admin", N_ADMIN, "criar", `a janela "Criar usuário" não mostrou a entrega do usuário (texto: ${cortar(await page.evaluate(() => (document.querySelector("dialog.dlg") || {}).innerText || ""), 120)})`);
      await page.click("dialog.dlg[open] [data-fecha]").catch(() => {});
      await page.waitForFunction((u) => [...document.querySelectorAll("#us-lista tr")].some((tr) => tr.innerText.includes(u)), COMUM.usuario, { timeout: 10000 }).catch(() => {});
      const L1 = await linhasUsuarios(page);
      const lc = L1.find((l) => l.u === COMUM.usuario), la = L1.find((l) => l.u === "admin");
      if (!lc) falha("l-etq", N_ETQ, "lista", `a lista de usuários não tem o ${COMUM.usuario} depois de criar`);
      else if (!lc.t.includes(ETIQUETA)) falha("l-etq", N_ETQ, "sem-etiqueta", `${COMUM.usuario} (ainda não trocou): sem a etiqueta "${ETIQUETA}"`);
      if (la && la.t.includes(ETIQUETA)) falha("l-etq", N_ETQ, "admin-etiqueta", `o admin já trocou a senha e ainda aparece com "${ETIQUETA}"`);
      await a11y(page, "Criar usuários", 1366);
      await print(page, "criar-usuarios", 1366);
      c.conferir("Criar usuários");

      // Catálogos, materiais e treinamentos: o título e, na tela, os grupos e os cartões da lista do GET /api/pdfs
      await page.goto(base + "admin/pdfs", { waitUntil: "networkidle" });
      await page.waitForSelector("#pdfs article.pdf", { timeout: 10000 }).catch(() => {});
      const tela = await page.evaluate(async () => {
        const r = await fetch("/api/pdfs", { headers: { Accept: "application/json" } });
        const lista = r.ok ? await r.json() : null;
        const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
        return {
          api: r.status, lista,
          title: document.title, h1: txt(document.querySelector("main h1")), trilha: txt(document.querySelector("main .trilha")),
          soltos: document.querySelectorAll("#pdfs article.pdf").length,
          grupos: [...document.querySelectorAll("#pdfs section.pdf-grupo")].map((s) => ({
            id: (s.querySelector("h2") || {}).id || "", h2: txt(s.querySelector("h2")), sub: txt(s.querySelector(".pdf-grupo-sub")),
            cartoes: [...s.querySelectorAll("article.pdf")].map((a) => ({
              h3: txt(a.querySelector("h3")),
              bts: [...a.querySelectorAll("a.bt, button.bt")].map((b) => ({
                txt: txt(b).replace(/ ·.*$/, ""), href: b.getAttribute("href") || "", desab: b.tagName === "BUTTON" && b.disabled,
              })),
            })),
          })),
        };
      });
      // o título: um dos 2 aceitos, e o MESMO no menu, no title, na trilha e no h1
      tituloPdfs = tela.h1 || tituloPdfs;
      const titulos = { menu: tituloMenu, title: tela.title.split(" · ")[0].trim(), trilha: tela.trilha.split("›").pop().trim(), h1: tela.h1 };
      const vistos = [...new Set(Object.values(titulos))];
      if (vistos.length !== 1 || !TITULOS_PDFS.includes(vistos[0]))
        falha("l-admin", N_ADMIN, "pdf-titulo", `/admin/pdfs: o nome não bate (${Object.entries(titulos).map(([k, v]) => `${k} "${cortar(v || "", 50)}"`).join(", ")}); esperado o mesmo nos 4, ${TITULOS_PDFS.map((t) => `"${t}"`).join(" ou ")}`);
      let grupos = null;
      try { grupos = lerGruposTela(raiz); } catch (e) { falha("l-admin", N_ADMIN, "pdf-grupos-js", `não li o GRUPOS da tela: ${cortar(e.message, 120)}`); }
      const lista = Array.isArray(tela.lista) ? tela.lista : [];
      if (tela.api !== 200 || !lista.length) falha("l-admin", N_ADMIN, "pdf-lista", `GET /api/pdfs (admin) respondeu ${tela.api} com ${lista.length} itens: sem a lista, a tela não foi conferida`);
      else if (grupos) {
        // os grupos e os cartões: as seções na ordem do GRUPOS, cada uma com os cartões na ordem da lista
        const esp = telaEsperada(lista.map((p) => ({ ...p, tipo: p.tipo || "pdf", par: p.par || null })), grupos);
        const nEsp = esp.reduce((n, x) => n + x.cartoes.length, 0);
        const descrEsp = esp.map((x) => `${x.nome} ${x.cartoes.length}`).join(" | ");
        const descrTela = tela.grupos.map((g) => `${g.h2} ${g.cartoes.length}`).join(" | ") || "nenhum";
        const gruposOk = tela.grupos.length === esp.length && esp.every((x, i) => tela.grupos[i].id === "grupo-" + x.g && tela.grupos[i].h2 === x.nome);
        if (!gruposOk) falha("l-admin", N_ADMIN, "pdf-grupos", `/admin/pdfs com os grupos ${descrTela}; esperados ${descrEsp}`);
        if (tela.soltos !== nEsp) falha("l-admin", N_ADMIN, "pdf-cartoes", `/admin/pdfs com ${tela.soltos} cartões; esperados ${nEsp} (${descrEsp})`);
        // cada cartão: o título e os botões na ordem dos itens; com arquivo (p.arquivo), o link de baixar; sem, desabilitado
        const faltam = [];
        for (const x of esp) {
          const g = tela.grupos.find((k) => k.id === "grupo-" + x.g);
          const h3s = g ? g.cartoes.map((k) => k.h3) : [];
          const titulosEsp = x.cartoes.map((c) => c.titulo);
          if (h3s.join("|") !== titulosEsp.join("|")) {
            const falta = titulosEsp.filter((t) => !h3s.includes(t)), sobra = h3s.filter((t) => !titulosEsp.includes(t));
            const qual = [falta.length ? `falta ${falta.join(", ")}` : "", sobra.length ? `sobra ${sobra.join(", ")}` : ""].filter(Boolean).join("; ") || "ordem diferente";
            falha("l-admin", N_ADMIN, "pdf-ordem:" + x.g, `${x.nome}: ${h3s.length} cartões, esperados ${titulosEsp.length} (${qual}); na tela: ${cortar(h3s.join(" | ") || "nenhum", 160)}`);
          }
          for (const c of x.cartoes) {
            const k = g && g.cartoes.find((y) => y.h3 === c.titulo);
            if (!k) continue; // já contado acima
            const rotEsp = c.itens.map((p) => "Baixar " + (NOME_TIPO[p.tipo] || "PDF"));
            if (k.bts.map((b) => b.txt).join("|") !== rotEsp.join("|"))
              falha("l-admin", N_ADMIN, "pdf-bts:" + c.titulo, `${x.nome}, cartão "${c.titulo}": botões ${k.bts.map((b) => b.txt).join(", ") || "nenhum"}; esperados ${rotEsp.join(", ")}`);
            c.itens.forEach((p, i) => {
              const bt = k.bts[i];
              if (!bt) return;
              const href = "/admin/pdfs/baixar/" + p.id;
              if (p.arquivo) {
                if (bt.href !== href) falha("l-admin", N_ADMIN, "pdf-link:" + p.id, `/admin/pdfs: o ${p.id} tem o arquivo (${p.arquivo}) e está sem o link ${href}${bt.desab ? " (botão desabilitado)" : ""}`);
              } else {
                faltam.push(p.id);
                if (!bt.desab || bt.href) falha("l-admin", N_ADMIN, "pdf-fora:" + p.id, `/admin/pdfs: o ${p.id} sem arquivo e o botão não está desabilitado`);
              }
            });
          }
        }
        if (faltam.length) aviso("l-admin", N_ADMIN, `${faltam.length} arquivo(s) da lista sem arquivo em catalogo_grafico/entregas/ (botão desabilitado na tela, como esperado): ${faltam.join(", ")}`);
        // o grupo dos Treinamentos, se a tela tiver, com o subtítulo
        const gTrein = tela.grupos.find((g) => g.id === "grupo-treinamentos");
        if (gTrein && !gTrein.sub) falha("l-admin", N_ADMIN, "pdf-sub", "o grupo Treinamentos sem o subtítulo (p.pdf-grupo-sub)");
        resumoPdfs = `${lista.length} itens do GET /api/pdfs em ${nEsp} cartões e ${esp.length} grupos (${descrEsp}), botões na ordem dos itens` +
          (gTrein ? ", Treinamentos com o subtítulo" : "") +
          `; link de baixar em todo item com arquivo (${faltam.length} sem arquivo, com o botão desabilitado)`;
      }
      await a11y(page, tituloPdfs, 1366);
      await page.screenshot({ path: path.join(dirPrints, "login-pdfs-1366.png"), fullPage: true }); // a página inteira: todos os cartões
      c.conferir(tituloPdfs);
      adminCtx = c; // fica aberto para conferir a etiqueta depois da troca do comum
    }

    // ---- 3. comum: o link #/produto/X enviado antes do login, com a troca obrigatória no meio ----
    {
      const c = await novoCtx(1366, 768, "comum 1366");
      const { page } = c;
      await page.goto(base + "#/produto/" + COD, { waitUntil: "networkidle" });
      const u0 = new URL(page.url());
      if (u0.pathname !== "/entrar" || u0.hash !== "#/produto/" + COD) falha("l-link", N_LINK, "302-hash", `#/produto/${COD} sem login foi para ${u0.pathname}${u0.search}${u0.hash} (esperado /entrar com o #/produto/${COD})`);
      c.conferir("login (link do produto)");
      await entrarUI(page, COMUM.usuario, seg.senhaComum0);
      if (!caminho(page).startsWith("/trocar-senha")) falha("l-comum", N_COMUM, "troca-1o", `o 1º acesso do comum foi para ${caminho(page)} (esperado /trocar-senha)`);
      await trocaObrigatoria(page, seg.senhaComum1);
      c.conferir("troca obrigatória (comum)");
      await catalogoPronto(page);
      await page.waitForSelector("#app .prod-info h1", { timeout: 10000 }).catch(() => {});
      const h1 = await page.evaluate(() => ({ h: location.hash, t: ((document.querySelector("#app .prod-info h1") || {}).textContent || "").trim() }));
      if (h1.h !== "#/produto/" + COD || h1.t !== COD) falha("l-link", N_LINK, "troca", `depois do login e da troca obrigatória: ${h1.h || "(sem hash)"}, título "${h1.t}" (esperado a página do ${COD})`);
      c.conferir("produto depois do login (comum)");

      // não vê nem abre o que é do admin
      const menu = await abrirMenu(page);
      if (!menu) falha("l-comum", N_COMUM, "menu", "1366 px: o comum entrou e não há o botão do canto");
      else {
        if (menu.some(ehAdmin)) falha("l-comum", N_COMUM, "menu-admin", `1366 px: o menu do comum mostra ${menu.filter(ehAdmin).map(([t]) => t).join(", ")}`);
        if (!menu.some(([, h]) => h === "/trocar-senha") || !menu.some(([t]) => t === "Sair")) falha("l-comum", N_COMUM, "menu-conta", "1366 px: o menu do comum sem \"Trocar senha\" ou \"Sair\"");
      }
      const dom = await page.evaluate(() => ({ txt: document.body.innerText, html: document.documentElement.outerHTML }));
      if (ADMIN_TXT.test(dom.txt) || /href="\/admin/.test(dom.html)) falha("l-comum", N_COMUM, "dom", `1366 px: a página do comum tem "Criar usuários", "${tituloPdfs}" ou link para /admin`);
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
      c.st.esperado = false;
      await c.ctx.close();
    }

    // a etiqueta some depois que o comum troca a senha
    {
      const c = adminCtx;
      await c.page.goto(base + "admin/usuarios", { waitUntil: "networkidle" });
      await c.page.waitForSelector("#us-lista table", { timeout: 10000 }).catch(() => {});
      const lc = (await linhasUsuarios(c.page)).find((l) => l.u === COMUM.usuario);
      if (!lc) falha("l-etq", N_ETQ, "lista2", `a lista não tem mais o ${COMUM.usuario}`);
      else if (lc.t.includes(ETIQUETA)) falha("l-etq", N_ETQ, "nao-saiu", `${COMUM.usuario} já trocou a senha e ainda tem a etiqueta "${ETIQUETA}"`);
      c.conferir("Criar usuários (depois da troca)");
      await c.ctx.close();
    }
    detalhe("l-etq", N_ETQ, `${COMUM.usuario} com a etiqueta "${ETIQUETA}" logo depois de criado e sem ela depois da troca; admin sem a etiqueta`);

    // ---- 4. 390 px: login, admin (menu, Criar usuários, Catálogos, materiais e treinamentos) e comum (link direto sem troca, menu) ----
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
      if (!menu || !menu.some(([, h]) => h === "/admin/usuarios") || !menu.some(([, h]) => h === "/admin/pdfs")) falha("l-admin", N_ADMIN, "menu-390", `390 px: o menu do admin sem "Criar usuários" ou "${tituloPdfs}"`);
      await print(page, "menu-admin", 390);
      c.conferir("catálogo com o menu (admin)");
      for (const [cam, sel, nome] of [["admin/usuarios", "#us-lista table", "criar-usuarios"], ["admin/pdfs", "#pdfs article.pdf", "pdfs"]]) {
        await page.goto(base + cam, { waitUntil: "networkidle" });
        await page.waitForSelector(sel, { timeout: 10000 }).catch(() => falha("l-admin", N_ADMIN, "390:" + cam, `390 px: /${cam} sem ${sel}`));
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        if (sw > 390) falha("l-admin", N_ADMIN, "largura:" + cam, `390 px: /${cam} rola de lado (scrollWidth = ${sw})`);
        await a11y(page, cam, 390);
        if (nome === "pdfs") await page.screenshot({ path: path.join(dirPrints, "login-pdfs-390.png"), fullPage: true });
        else await print(page, nome, 390);
        c.conferir("/" + cam);
      }
      await c.ctx.close();
    }
    {
      const c = await novoCtx(390, 844, "comum 390");
      const { page } = c;
      await page.goto(base + "#/produto/" + FOTO, { waitUntil: "networkidle" });
      await entrarUI(page, COMUM.usuario, seg.senhaComum1);
      await catalogoPronto(page);
      await page.waitForSelector("#app .prod-info h1", { timeout: 10000 }).catch(() => {});
      const h1 = await page.evaluate(() => ({ h: location.hash, t: ((document.querySelector("#app .prod-info h1") || {}).textContent || "").trim() }));
      if (h1.h !== "#/produto/" + FOTO || h1.t !== FOTO) falha("l-link", N_LINK, "direto", `390 px: #/produto/${FOTO} antes do login abriu ${h1.h || "(sem hash)"}, título "${h1.t}"`);
      c.conferir("produto depois do login (comum)");
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await catalogoPronto(page);
      const menu = await abrirMenu(page);
      if (!menu) falha("l-comum", N_COMUM, "menu-390", "390 px: o comum sem o botão do canto");
      else if (menu.some(ehAdmin)) falha("l-comum", N_COMUM, "menu-admin-390", "390 px: o menu do comum mostra item do admin");
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > 390) falha("l-comum", N_COMUM, "largura", `390 px: o catálogo com o menu aberto rola de lado (scrollWidth = ${sw})`);
      await print(page, "menu-cliente", 390);
      c.conferir("catálogo com o menu (comum)");
      await c.ctx.close();
    }
    detalhe("l-link", N_LINK, `#/produto/${COD} antes do login abre o produto depois do login e da troca obrigatória (1366); #/produto/${FOTO} depois do login direto (390)`);
    detalhe("l-comum", N_COMUM, "menu e página sem os itens do admin (1366 e 390); /admin/usuarios e /admin/pdfs 404 sem a tela");
    detalhe("l-admin", N_ADMIN, `1º acesso → troca obrigatória (sem a senha atual) → catálogo; menu com Criar usuários, "${tituloPdfs}", Trocar senha e Sair; usuário criado pela tela; "${tituloPdfs}" igual no menu, title, trilha e h1; ${resumoPdfs}`);

    // ---- 5. volta no navegador: "//", "/\", codificados, outro site, tabulação e quebra de linha não levam para fora ----
    {
      const casosVolta = ["//" + FORA + "/x", "/\\" + FORA + "/x", "%2F%2F" + FORA + "%2Fx", "%2F%5C" + FORA, "/%5C" + FORA, "https://" + FORA + "/", "/%09/" + FORA, "/%0A/" + FORA];
      for (const v of casosVolta) {
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
      detalhe("l-volta", N_VOLTA, `${casosVolta.length} volta(s) no navegador (${casosVolta.map((v) => JSON.stringify(v)).join(", ")}) ficam em ${origem}`);
    }

    // ---- 6. sessão de 5 h com o relógio adiantado (o serviço importado com criarServico({ agora })), pela tela ----
    {
      let mod = null;
      try { mod = await import(pathToFileURL(path.join(raiz, "servicos", "login", "server.mjs")).href); } catch (e) { falha("l-sessao", N_SESSAO, "import", `não importei o server.mjs: ${cortar(e.message, 90)}`); }
      if (mod && typeof mod.criarServico === "function") {
        let desvio = 0, pasta = null, svc = null;
        const s0 = falsa("admin-relogio"), s1 = falsa("admin-relogio2");
        try {
          // a pasta e o serviço dentro do try: o finally limpa também quando criarServico ou listen falham
          pasta = fs.mkdtempSync(path.join(os.tmpdir(), "bap-login-relogio-"));
          svc = await mod.criarServico({ env: { PASTA_DADOS: pasta, SESSAO_SEGREDO: falsa("segredo-relogio"), ADMIN_USUARIO: "admin", ADMIN_SENHA_INICIAL: s0 }, agora: () => Date.now() + desvio, log: () => {} });
          await new Promise((ok, erro) => { svc.once("error", erro); svc.listen(0, ok); });
          const b2 = `http://localhost:${svc.address().port}/`;
          const c = await novoCtx(1366, 768, "sessão 1366", b2);
          const { page } = c;
          await page.goto(b2 + "#/produto/" + COD, { waitUntil: "networkidle" });
          await entrarUI(page, "admin", s0);
          await trocaObrigatoria(page, s1, { conferir: false });
          await catalogoPronto(page);
          c.conferir("antes de vencer");
          desvio = SESSAO_H * HORA - 60e3; // 4 h 59: ainda vale
          await page.reload({ waitUntil: "networkidle" });
          await catalogoPronto(page);
          const v0 = await page.evaluate(() => ({ p: location.pathname, conta: !!document.querySelector("#conta .conta-bt") }));
          if (v0.p !== "/" || !v0.conta) falha("l-sessao", N_SESSAO, "4h59", `com 4 h 59 a página recarregada foi para ${v0.p}${v0.conta ? "" : " sem o botão do canto"} (esperado o catálogo)`);
          c.conferir("4 h 59");
          desvio = SESSAO_H * HORA + 60e3; // 5 h 01: venceu
          c.st.esperado = true;
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForSelector("#form-entrar", { timeout: 10000 }).catch(() => {});
          const v = await page.evaluate(() => ({ p: location.pathname + location.search, t: document.body.innerText }));
          const avisou = /sess[aã]o terminou/i.test(v.t);
          if (v.p !== "/entrar?expirou=1" || !avisou) falha("l-sessao", N_SESSAO, "navegador", `com 5 h 01 a página recarregada foi para ${v.p}${avisou ? "" : ' sem o aviso "Sua sessão terminou"'} (esperado /entrar?expirou=1 com o aviso)`);
          await print(page, "sessao-vencida", 1366);
          c.st.esperado = false;
          c.conferir("sessão vencida");
          await c.ctx.close();
          detalhe("l-sessao", N_SESSAO, "cookie no navegador HttpOnly, Secure, SameSite=Lax e 5 h; relógio adiantado, pela tela: 4 h 59 o catálogo abre; 5 h 01 leva a /entrar?expirou=1 com o aviso");
        } finally {
          if (svc && svc.listening) {
            const fechou = new Promise((ok) => svc.close(ok));
            svc.closeAllConnections();
            await fechou;
          }
          if (pasta) fs.rmSync(pasta, { recursive: true, force: true });
        }
      } else if (mod) falha("l-sessao", N_SESSAO, "criarServico", "o server.mjs não exporta criarServico (o teste do relógio precisa dele)");
    }
    detalhe("l-cons", N_CONS, `0 erro de script, 0 console.error do site, 0 403 e 0 4xx/5xx não esperados em login, troca obrigatória (admin e comum), catálogo, menu, Criar usuários, ${tituloPdfs}, volta e sessão`);
    detalhe("l-a11y", N_A11Y, `login, troca obrigatória, janela Criar usuário, Criar usuários e ${tituloPdfs}: campos com rótulo e imagens com alt`);
  } finally {
    await browser.close();
  }

  // ---- 7. o log do serviço sem senha, segredo nem chave ----
  const log = srv.log();
  for (const [k, v] of Object.entries(seg)) if (log.includes(v)) falha("l-log", N_LOG, k, `o log do serviço mostra ${k.replace(/\d$/, "")} (valor de teste)`);
  if (log.includes(COMUM.usuario)) aviso("l-log", N_LOG, `o log do serviço mostra o usuário ${COMUM.usuario} (o LEIA.md diz que não mostra)`);
  detalhe("l-log", N_LOG, `${log.split("\n").filter(Boolean).length} linhas de log, sem as 4 senhas, o segredo da sessão e a chave interna`);
  return { usuario: COMUM.usuario, senha: seg.senhaComum1 };
}
