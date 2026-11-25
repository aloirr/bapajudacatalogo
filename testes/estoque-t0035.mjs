/* Testes dos filtros Categoria, Sistema e Família da aba Estoque (T-0035, 25/11/2026). Dono: agente testes.
   Uso (da raiz do repositório, com o servidor e a tela da T-0035 juntos):
     node testes/estoque-t0035.mjs [--prints testes/prints/T-0035]
   Saída: 0 se tudo passou, 1 se algo falhou.

   A fonte sintética (120 linhas, 3 categorias, 5 sistemas, 10 famílias), o serviço, o navegador e o relatório vêm do
   testes/estoque-comum.mjs. As regras da API (parâmetros, opções em cascata, filtro incoerente, lista branca do
   vendedor) são dos testes do serviço (servicos/login/login.test.mjs); aqui fica o que é da tela:
     - a cascata nos selects (as opções do Sistema mudam com a Categoria; trocar a Categoria zera Sistema e Família);
     - a contagem cai ao filtrar; os filtros somam com a busca, a caixa e a Filial; "Limpar filtros"; vazio com filtros;
     - o vendedor filtra e continua com as 6 colunas, sem custo, preço, markup nem "R$" na tela;
     - 390 px: o botão "Filtros (N)" com o N certo, os filtros escondidos até abrir, a lista na 1ª tela com tudo
       fechado e sem rolar de lado;
     - console sem erro e nenhum "${" à vista.
   Prints (deviceScaleFactor 2): 1366 em página inteira; 390 só na área visível (o que importa é a 1ª tela). */

import {
  res, sem, LINHAS, N, COLS_VENDEDOR, RX_TELA_INTERNA, criarUsuario, iniciar, contexto, print, semTemplate, abrirEstoque,
  cabecalhos, totalTxt, esperarLista, fechar,
} from "./estoque-comum.mjs";

const { S } = await iniciar({ printsPadrao: "testes/prints/T-0035" });
await criarUsuario(S, "vend.teste", true);

// ---------- o que a tela tem de mostrar, tirado das LINHAS ----------
const ordem = (l) => [...new Set(l.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
const com = LINHAS.filter((l) => l.CATEGORIA);
const esperado = {
  categorias: () => ordem(com.map((l) => l.CATEGORIA)),
  sistemas: (cat) => ordem(com.filter((l) => !cat || l.CATEGORIA === cat).map((l) => l.SISTEMA)),
  familias: (cat, sis) => ordem(com.filter((l) => (!cat || l.CATEGORIA === cat) && (!sis || l.SISTEMA === sis)).map((l) => l.FAMILIA)),
};
// quantas linhas a API acha. q: só palavras do fornecedor (ex.: "alfa"), que não aparecem em outro campo da fonte
const contar = ({ cat = "", sis = "", fam = "", q = "", comEstoque = false, filial = "" } = {}) => LINHAS.filter((l) =>
  (!cat || l.CATEGORIA === cat) && (!sis || l.SISTEMA === sis) && (!fam || l.FAMILIA === fam)
  && (!q || sem(l.FORNECEDOR).includes(sem(q))) && (!comEstoque || (l.ESTOQUE != null && l.ESTOQUE !== 0))
  && (!filial || l.FILIAL_BAP === filial)).length;

// ---------- tela ----------
// as opções de um filtro: o value (o texto da planilha, que vai ao servidor) e o rótulo exibido
const opcoesDe = (page, id) => page.$$eval(`#${id} option`, (os) => os.slice(1).map((o) => o.value));
const rotulosDe = (page, id) => page.$$eval(`#${id} option`, (os) => os.slice(1).map((o) => [o.value, o.textContent.trim()]));
// o rótulo esperado de cada valor da fonte sintética: sem caixa alta, "de" minúsculo, "D'Água" (U3, bonito do catálogo)
const ROTULO = {
  FREIO: "Freio", MOTOR: "Motor", "SUSPENSÃO": "Suspensão", ARREFECIMENTO: "Arrefecimento", DIANTEIRA: "Dianteira", "ELÉTRICO": "Elétrico",
  "HIDRÁULICO": "Hidráulico", TRASEIRA: "Traseira", AMORTECEDOR: "Amortecedor", BIELETA: "Bieleta", "BOMBA D'ÁGUA": "Bomba D'Água",
  CHICOTE: "Chicote", DISCO: "Disco", MOLA: "Mola", PASTILHA: "Pastilha", RADIADOR: "Radiador", SENSOR: "Sensor", "SENSOR DE ROTAÇÃO": "Sensor de Rotação",
};
// a ordem do Tab a partir da busca: os ids que recebem o foco, um a um
async function ordemTab(page, n) {
  await page.focus("#est-busca");
  const ids = [];
  for (let k = 0; k < n; k++) { await page.keyboard.press("Tab"); ids.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
  await page.evaluate(() => document.activeElement.blur()); // sem o anel de foco nos prints seguintes
  return ids;
}
const TAB_1366 = ["est-filial", "est-categoria", "est-sistema", "est-familia", "est-com", "est-limpar"];
const valor = (page, id) => page.$eval(`#${id}`, (s) => s.value);
// o total achado: "50 de 120" → 120; vazio → 0
const total = async (page) => { const t = await totalTxt(page); const m = /de ([\d.]+)$/.exec(t); return m ? Number(m[1].replace(/\./g, "")) : 0; };
// cada troca de filtro ou de busca é uma tela nova: confere também que nenhum "${" ficou à vista
async function escolher(page, id, v) { await page.selectOption(`#${id}`, v); await esperarLista(page); await semTemplate(page, `${id}=${v}`); }
async function buscar(page, t) { await page.fill("#est-busca", t); await page.waitForTimeout(450); await esperarLista(page); await semTemplate(page, `busca "${t}"`); }
const iguais = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const lista = (l) => `[${l.join(", ")}]`;

try {
  // ---- 1. admin 1366: cascata, contagem, soma com busca/caixa/Filial, "Limpar filtros" e vazio ----
  {
    const { ctx, page } = await contexto(S, "admin", 1366, 768);
    await abrirEstoque(page, S.base);
    const ini = { cat: await opcoesDe(page, "est-categoria"), sis: await opcoesDe(page, "est-sistema"), fam: await opcoesDe(page, "est-familia"), tot: await total(page) };
    const rot = [...await rotulosDe(page, "est-categoria"), ...await rotulosDe(page, "est-sistema"), ...await rotulosDe(page, "est-familia")];
    const rotErrados = rot.filter(([v, t]) => ROTULO[v] !== t);
    const susp = rot.find(([v]) => v === "SUSPENSÃO");
    res("opções sem caixa alta e o value com o texto da planilha", rot.length === 18 && !rotErrados.length && susp && susp[1] === "Suspensão",
      `${rot.length} opções; Categoria ${rot.slice(0, 3).map(([v, t]) => `"${t}" (value "${v}")`).join(", ")}; ${rot.filter(([v]) => /'|ROTAÇÃO/.test(v)).map(([v, t]) => `"${t}" (value "${v}")`).join(", ")}${rotErrados.length ? `; ERRADOS: ${rotErrados.map(([v, t]) => `"${v}" → "${t}" (esperado "${ROTULO[v]}")`).join(", ")}` : ""}`);
    const limparIni = await page.isVisible("#est-limpar");
    const btFiltros1366 = await page.isVisible("#est-bt-filtros");
    const rotulos = await page.$$eval(".est-barra select, .est-barra input", (els) => els.map((e) => [e.id, !!(e.labels && e.labels.length)]));
    await print(page, "admin-1366-sem-filtro");

    // cascata: FREIO → ELÉTRICO → CHICOTE, depois troca a Categoria para MOTOR
    const passos = [ini.tot];
    await escolher(page, "est-categoria", "FREIO");
    const sisFreio = await opcoesDe(page, "est-sistema"), famFreio = await opcoesDe(page, "est-familia");
    passos.push(await total(page));
    await escolher(page, "est-sistema", "ELÉTRICO");
    const famFreioEl = await opcoesDe(page, "est-familia");
    passos.push(await total(page));
    await escolher(page, "est-familia", "CHICOTE");
    passos.push(await total(page));
    const limparCom = await page.isVisible("#est-limpar");
    await escolher(page, "est-categoria", "MOTOR");
    const troca = { sis: await valor(page, "est-sistema"), fam: await valor(page, "est-familia"), opSis: await opcoesDe(page, "est-sistema"), tot: await total(page) };

    res("cascata: opções do Sistema e da Família seguem a Categoria",
      iguais(ini.cat, esperado.categorias()) && iguais(ini.sis, esperado.sistemas()) && iguais(ini.fam, esperado.familias())
        && iguais(sisFreio, esperado.sistemas("FREIO")) && iguais(famFreio, esperado.familias("FREIO"))
        && iguais(famFreioEl, esperado.familias("FREIO", "ELÉTRICO")),
      `sem filtro: Categoria ${lista(ini.cat)}, Sistema ${lista(ini.sis)}, ${ini.fam.length} famílias; FREIO: Sistema ${lista(sisFreio)}, Família ${lista(famFreio)}; FREIO + ELÉTRICO: Família ${lista(famFreioEl)}`);
    res("cascata: trocar a Categoria zera Sistema e Família",
      troca.sis === "" && troca.fam === "" && iguais(troca.opSis, esperado.sistemas("MOTOR")) && troca.tot === contar({ cat: "MOTOR" }),
      `FREIO › ELÉTRICO › CHICOTE → Categoria MOTOR: Sistema "${troca.sis || "Todos"}", Família "${troca.fam || "Todas"}", Sistema ${lista(troca.opSis)}, ${troca.tot} linhas (esperado ${contar({ cat: "MOTOR" })})`);
    const esp = [N, contar({ cat: "FREIO" }), contar({ cat: "FREIO", sis: "ELÉTRICO" }), contar({ cat: "FREIO", sis: "ELÉTRICO", fam: "CHICOTE" })];
    res("a contagem cai ao filtrar", iguais(passos, esp) && passos.every((v, k) => k === 0 || v < passos[k - 1]),
      `${passos.join(" → ")} (sem filtro → FREIO → + ELÉTRICO → + CHICOTE; esperado ${esp.join(" → ")})`);

    // soma com a busca, a caixa e a Filial
    await escolher(page, "est-categoria", "SUSPENSÃO");
    await escolher(page, "est-sistema", "DIANTEIRA");
    await print(page, "admin-1366-categoria-sistema");
    const f = { cat: "SUSPENSÃO", sis: "DIANTEIRA" };
    const soma = [];
    await buscar(page, "alfa");
    soma.push([await total(page), contar({ ...f, q: "alfa" }), "+ busca \"alfa\""]);
    await page.check("#est-com"); await esperarLista(page);
    soma.push([await total(page), contar({ ...f, q: "alfa", comEstoque: true }), "+ caixa"]);
    // a 1ª filial (pela ordem do número) que ainda tem linha com tudo isso: a soma não termina no vazio
    const fil = [...new Set(LINHAS.map((l) => l.FILIAL_BAP))].sort().find((x) => contar({ ...f, q: "alfa", comEstoque: true, filial: x }) > 0);
    await escolher(page, "est-filial", fil);
    soma.push([await total(page), contar({ ...f, q: "alfa", comEstoque: true, filial: fil }), `+ Filial ${fil}`]);
    res("os filtros somam com a busca, a caixa e a Filial", soma.every(([a, b]) => a === b) && soma.every(([a], k) => a > 0 && a < (k ? soma[k - 1][0] : contar(f))),
      `SUSPENSÃO › DIANTEIRA = ${contar(f)}; ${soma.map(([a, b, o]) => `${o} = ${a} (esperado ${b})`).join("; ")}`);

    const tab1366 = await ordemTab(page, TAB_1366.length);
    res("ordem do Tab em 1366: busca > Filial > Categoria > Sistema > Família > caixa > Limpar", iguais(tab1366, TAB_1366),
      `depois da busca: ${tab1366.join(" > ")}`);

    // "Limpar filtros": zera Filial, Categoria, Sistema e Família; a busca e a caixa ficam
    await page.click("#est-limpar"); await esperarLista(page);
    await semTemplate(page, "admin 1366 depois do Limpar filtros");
    const depois = { vals: await Promise.all(["est-filial", "est-categoria", "est-sistema", "est-familia"].map((id) => valor(page, id))),
      q: await page.inputValue("#est-busca"), caixa: await page.isChecked("#est-com"), tot: await total(page), limpar: await page.isVisible("#est-limpar") };
    const espLimpo = contar({ q: "alfa", comEstoque: true });
    res("\"Limpar filtros\"", !limparIni && limparCom && depois.vals.every((v) => v === "") && depois.q === "alfa" && depois.caixa && depois.tot === espLimpo && !depois.limpar,
      `escondido sem filtro: ${!limparIni}; à vista com filtro: ${limparCom}; depois do clique: os 4 em "Todas" ${depois.vals.every((v) => v === "")}, busca "${depois.q}" e caixa ${depois.caixa ? "marcada" : "desmarcada"} ficam, ${depois.tot} linhas (esperado ${espLimpo}), o botão some: ${!depois.limpar}`);

    // vazio com filtros
    await page.uncheck("#est-com"); await esperarLista(page);
    await escolher(page, "est-categoria", "FREIO");
    await buscar(page, "xyzsemnada");
    const nada = await page.$eval(".est-nada", (e) => e.textContent.trim()).catch(() => "");
    await print(page, "vazio-filtros-1366");
    res("mensagem de vazio com filtros", nada === "Nada encontrado para “xyzsemnada” com os filtros escolhidos.", `"${nada}"`);
    res("1366: filtros à vista, sem o botão \"Filtros\", e todos os campos com rótulo", !btFiltros1366 && rotulos.every(([, r]) => r),
      `botão "Filtros" à vista: ${btFiltros1366}; campos ${rotulos.map(([id, r]) => `${id}${r ? "" : " SEM RÓTULO"}`).join(", ")}`);
    await ctx.close();
  }

  // ---- 2. vendedor 1366: filtra e continua sem dado interno ----
  {
    const { ctx, page } = await contexto(S, "vend.teste", 1366, 768);
    await abrirEstoque(page, S.base);
    const cab1 = await cabecalhos(page);
    const opCat = await opcoesDe(page, "est-categoria");
    await print(page, "vendedor-1366-sem-filtro");
    await escolher(page, "est-categoria", "SUSPENSÃO");
    await escolher(page, "est-sistema", "DIANTEIRA");
    const cab2 = await cabecalhos(page);
    const tot = await total(page);
    const corpo = sem(await page.evaluate(() => document.body.innerText));
    await print(page, "vendedor-1366-categoria-sistema");
    await ctx.close();
    const achado = corpo.match(RX_TELA_INTERNA);
    res("vendedor: filtra e continua com as 6 colunas, sem custo, preço, markup nem R$",
      iguais(cab1, COLS_VENDEDOR) && iguais(cab2, COLS_VENDEDOR) && !achado && iguais(opCat, esperado.categorias()) && tot === contar({ cat: "SUSPENSÃO", sis: "DIANTEIRA" }),
      `colunas ${lista(cab2)}; Categoria ${lista(opCat)}; SUSPENSÃO › DIANTEIRA = ${tot} (esperado ${contar({ cat: "SUSPENSÃO", sis: "DIANTEIRA" })}); ${achado ? `achei "${achado[0]}" na tela` : "texto da página sem nenhuma dessas palavras"}`);
  }

  // ---- 3. 390 px: o fluxo do painel "Filtros" no vendedor; o admin confere o "Filtros (N)" fechado ----
  // o estado da barra: texto do botão, N, aria-expanded, o que está à vista, onde começa a lista e a largura
  const estado = (page) => page.evaluate(() => {
    const bt = document.getElementById("est-bt-filtros");
    const vis = (id) => { const e = document.getElementById(id); return !!(e && e.offsetParent); };
    const tr = document.querySelector("table.est tbody tr");
    return {
      bt: bt.innerText.replace(/\s+/g, " ").trim(), n: document.getElementById("est-n-filtros").textContent.trim(), exp: bt.getAttribute("aria-expanded"),
      filtros: ["est-filial", "est-categoria", "est-sistema", "est-familia"].map(vis), busca: vis("est-busca"), caixa: vis("est-com"),
      topoLista: tr ? Math.round(tr.getBoundingClientRect().top + window.scrollY) : null, largura: document.documentElement.scrollWidth,
    };
  });
  const nada = (l) => l.every((v) => !v);
  const fechadoOk = (e) => e.exp === "false" && nada(e.filtros) && e.busca && e.caixa;
  const larguras = (l) => [...new Set(l.map((e) => e.largura))].join("/");
  const ESP3 = contar({ cat: "MOTOR", sis: "ARREFECIMENTO", filial: "90000002" });

  // vendedor: o painel inteiro (seta, Tab, N de 1 a 3, fechar, "Limpar filtros")
  {
    const { ctx, page } = await contexto(S, "vend.teste", 390, 844);
    await abrirEstoque(page, S.base);
    const fechado = await estado(page);
    // a seta do "Filtros": conferida pelo estado final (espera o fim da transição), não pelo meio da animação
    const giro = () => page.$eval("#est-bt-filtros svg.seta", (svg) => { const m = new DOMMatrix(getComputedStyle(svg).transform); return Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI); }).catch(() => null);
    const esperarGiro = (graus) => page.waitForFunction((g) => {
      const svg = document.querySelector("#est-bt-filtros svg.seta");
      if (!svg) return false;
      const m = new DOMMatrix(getComputedStyle(svg).transform);
      return Math.abs(Math.abs(Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI)) - g) < 1;
    }, graus, { timeout: 3000 }).then(() => true).catch(() => false);
    const seta0 = { ok: await esperarGiro(0), graus: await giro() };
    const tabFechado = await ordemTab(page, 2);
    await print(page, "vendedor-390-filtros-fechado", false);
    await page.click("#est-bt-filtros");
    const seta1 = { ok: await esperarGiro(180), graus: await giro() };
    const aberto0 = await estado(page);
    await escolher(page, "est-categoria", "MOTOR");
    const um = await estado(page);
    await escolher(page, "est-sistema", "ARREFECIMENTO");
    const dois = await estado(page);
    // o nome acessível (o que o leitor de tela lê): um só botão chamado exatamente "Filtros (2)"
    const nome2 = await page.getByRole("button", { name: "Filtros (2)", exact: true }).count();
    const tabAberto = await ordemTab(page, 7);
    await print(page, "vendedor-390-filtros-aberto", false);
    await escolher(page, "est-filial", "90000002");
    const tres = await estado(page);
    await page.click("#est-bt-filtros");
    const seta2 = { ok: await esperarGiro(0), graus: await giro() };
    const fechado3 = await estado(page);
    const tot3 = await total(page);
    await page.click("#est-limpar"); await esperarLista(page);
    await semTemplate(page, "vendedor 390 depois do Limpar filtros");
    const limpo = await estado(page);
    await ctx.close();
    const TAB_390 = ["est-bt-filtros", "est-filial", "est-categoria", "est-sistema", "est-familia", "est-com", "est-limpar"];
    res("390 vendedor: ordem do Tab (busca > Filtros > Filial > Categoria > Sistema > Família > caixa > Limpar)",
      iguais(tabAberto, TAB_390) && iguais(tabFechado, ["est-bt-filtros", "est-com"]),
      `aberto, com 2 filtros: ${tabAberto.join(" > ")}; fechado, sem filtro (o "Limpar" escondido): ${tabFechado.join(" > ")}`);
    res("390 vendedor: a seta do \"Filtros\" gira ao abrir e volta ao fechar", seta0.ok && seta1.ok && seta2.ok,
      `fechado ${seta0.graus}°, aberto ${seta1.graus}°, fechado de novo ${seta2.graus}° (lidos depois do fim da transição)`);
    res("390 vendedor: \"Filtros (N)\" com o N certo e os filtros só quando aberto",
      fechado.bt === "Filtros" && fechadoOk(fechado) && aberto0.exp === "true" && aberto0.filtros.every(Boolean)
        && um.n === "(1)" && dois.n === "(2)" && dois.bt === "Filtros (2)" && nome2 === 1 && tres.n === "(3)"
        && fechadoOk(fechado3) && fechado3.n === "(3)" && tot3 === ESP3 && limpo.n === "" && limpo.bt === "Filtros",
      `fechado: botão "${fechado.bt}", aria-expanded ${fechado.exp}, filtros à vista ${fechado.filtros.filter(Boolean).length} de 4, busca e caixa à vista ${fechado.busca && fechado.caixa}; aberto: ${aberto0.filtros.filter(Boolean).length} de 4; MOTOR "${um.bt}"; + ARREFECIMENTO "${dois.bt}" (nome acessível "Filtros (2)": ${nome2} botão); + Filial Manaus "${tres.bt}"; fechado de novo "${fechado3.bt}" com ${tot3} linhas (esperado ${ESP3}); "Limpar filtros" → "${limpo.bt}"`);
    res("390 vendedor: a lista na 1ª tela e sem rolar de lado",
      fechado.topoLista !== null && fechado.topoLista < 844 && [fechado, aberto0, dois, tres, fechado3, limpo].every((e) => e.largura <= 390),
      `1º cartão em y=${fechado.topoLista} px com os filtros fechados (y=${dois.topoLista} px aberto com 2 filtros); scrollWidth ${larguras([fechado, aberto0, dois, tres, fechado3, limpo])}`);
  }

  // admin: só o "Filtros (N)" fechado (sem filtro e com 2 filtros), a lista na 1ª tela e a largura
  {
    const { ctx, page } = await contexto(S, "admin", 390, 844);
    await abrirEstoque(page, S.base);
    const fechado = await estado(page);
    await print(page, "admin-390-filtros-fechado", false);
    await page.click("#est-bt-filtros");
    await escolher(page, "est-categoria", "MOTOR");
    await escolher(page, "est-sistema", "ARREFECIMENTO");
    await page.click("#est-bt-filtros");
    const fechado2 = await estado(page);
    const tot2 = await total(page);
    await ctx.close();
    const esp2 = contar({ cat: "MOTOR", sis: "ARREFECIMENTO" });
    res("390 admin: \"Filtros (N)\" fechado, a lista na 1ª tela e sem rolar de lado",
      fechado.bt === "Filtros" && fechadoOk(fechado) && fechadoOk(fechado2) && fechado2.bt === "Filtros (2)" && tot2 === esp2
        && fechado.topoLista !== null && fechado.topoLista < 844 && fechado.largura <= 390 && fechado2.largura <= 390,
      `sem filtro: "${fechado.bt}", filtros à vista ${fechado.filtros.filter(Boolean).length} de 4, 1º cartão em y=${fechado.topoLista} px; com MOTOR › ARREFECIMENTO e o painel fechado: "${fechado2.bt}", ${tot2} linhas (esperado ${esp2}); scrollWidth ${larguras([fechado, fechado2])}`);
  }
} catch (e) {
  await fechar(e);
}
await fechar(null);
