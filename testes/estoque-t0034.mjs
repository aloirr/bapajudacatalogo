/* Testes da aba Estoque, versão final (T-0034, 24/11/2026). Dono: agente testes.
   DEPENDE do servicos/login/xlsx-ficticio.mjs (integracao-placas/T-0034-estoque): este script só roda depois do merge
   do branch do integracao-placas (o merge sai nessa ordem).
   Uso (da raiz do repositório, com o servidor e a tela da T-0034 juntos):
     node testes/estoque-t0034.mjs [--prints testes/prints/T-0034-final]
   Saída: 0 se tudo passou, 1 se algo falhou.

   O que faz (a fonte sintética, o serviço, o navegador e o relatório vêm do testes/estoque-comum.mjs):
     - cria admin, vendedor (estoque: true) e cliente (sem a permissão) e confere no Chromium o que é da tela: menus
       e página 404 do cliente, colunas e texto visível do vendedor, 23 colunas do admin, busca, filtro, caixa,
       "Mostrar mais N", vazio, a mensagem do 503 e do outro erro, a caixa "Pode ver o estoque" da Criar usuários,
       390 px sem rolar de lado e o console. As regras da API (404, lista branca do JSON, 503 e log do estoque) são
       dos testes do serviço (servicos/login/login.test.mjs);
     - prints com deviceScaleFactor 2, em 1366 × 768 e 390 × 844 (página inteira; menu aberto, cartão aberto e janela
       só na área visível). */

import {
  res, sem, porCidade, comEstoqueN, COLS_VENDEDOR, COLS_ADMIN, RX_TELA_INTERNA, pedir, falsa, criarUsuario, iniciar,
  contexto, print, semTemplate, larguraOk, abrirEstoque, cabecalhos, totalTxt, esperarLista, menuConta, menuCima, fechar,
} from "./estoque-comum.mjs";

const { S, S503 } = await iniciar({ printsPadrao: "testes/prints/T-0034-final", com503: true });
await criarUsuario(S, "vend.teste", true);
const cli = await criarUsuario(S, "cli.teste");

// celular: a largura do rótulo (::before) do Fornecedor no 1º cartão e quantas linhas o valor ocupa
const larguraRotulo = (page) => page.$eval("table.est tbody tr:first-child td.est-c-fornecedor", (td) => {
  const r = document.createRange(); r.selectNodeContents(td);
  const tops = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
  return { base: getComputedStyle(td, "::before").flexBasis, linhasFornecedor: tops.size, fornecedor: td.textContent.trim() };
});

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

} catch (e) {
  await fechar(e);
}
await fechar(null, "0 erro (404 do cliente e 503 da fonte quebrada esperados e descontados)");
