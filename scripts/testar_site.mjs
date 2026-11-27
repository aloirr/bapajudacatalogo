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
     --sem-navegador         só os testes do JSON (palavra interna, AUTOIMPACT, campos, total), sem abrir o Chromium.
     --login                 (T-0022) o site atrás do login: os testes do cabeçalho de testes/login.mjs e depois as
                             buscas de sempre, como o usuário comum. Sem --login: o servidor estático de site/.
     --comparar <arquivo>    o produtos.json tem de ser igual a este (ex.: o do main), fora o "gerado_em".

   O que testa: palavra interna no JSON (a SUNRISE também); a AUTOIMPACT só na marca da referência cruzada; campos e total do JSON; servidor estático de site/ numa porta livre;
   a busca de um campo só (q) da T-0011, palavra por palavra: código (exato em 1º, com e sem espaço ou hífen),
   referência cruzada, veículo (montadora + modelo + ano, sem Golf no Gol), geral (texto livre), os exemplos da
   diretriz (lista estrita, outra ordem, minúsculas, os mais próximos, marca concorrente, código BAP e EAN exatos)
   e sem resultado; a palavra inteira do veículo e a moto primeiro (T-0039: "filtro titan", "titan", "biz",
   "focus titanium", prefixo de código e código de moto); os links antigos (#/busca?cod=, mo=, modelo=, ano=) viram q; os 2 campos (q e placa com botão,
   sem consultar o serviço de verdade); página do produto (foto, aplicação, referências, ficha
   técnica, "Leve também", sem preço nem estoque); 390 px sem rolar de lado; console sem erro; acessibilidade
   básica; prints em 1366 × 768 e 390 × 844.
   Saída: 0 se passou (ou se só sobraram os conhecidos, com --conhecidos) e 1 se falhou.

   T-0014 e T-0018 (22/11/2026, site no main em 3d6a730): a bateria só aceita a tela aprovada e no ar.
     - Página inicial (#/, R-20261120-143900): ".mf-total" com "+" e o total arredondado para baixo à centena; 2 botões
       "Buscar" no quadro (o do q e o da placa).
     - Tela da busca ("campos", modelo B escolhido pelo Alexandre: R-20261120-122100, 122300, 123630 e 123800): sem abas, 2
       campos lado a lado (q e placa; no celular um embaixo do outro) com UM só botão "Buscar" e Enter nos 2 (os 2
       preenchidos: o veículo da placa filtrado pelo texto); faixa do veículo logo abaixo do quadro da busca na ordem Placa · Marca · Modelo · Ano · Motor · Versão (5 listas
       em cascata; R-20261120-124800: sai o "Meu veículo", que vira o rótulo "Placa" em cima da placa, e sai o "Trocar
       veículo"; p1, R-20261120-175400 e R-20261120-181200: acima de 640 px o rótulo à vista; até 640 px, com a placa e a
       faixa fechada, só para o leitor de tela, com as declarações da .vh, no DOM e apontado pelo aria-labelledby da placa), sem chave liga/desliga e sem o menu
       "Departamentos"; a placa consultada em destaque (etiqueta com X) na faixa, que preenche as listas; o "Limpar tudo"
       não tira o veículo; filtros numa coluna fina à ESQUERDA dos cartões, de cima a baixo (1366 e 1536 px), e no celular
       no botão "Filtrar (n)" com o painel; cartões (fA2, R-20261120-140900): 4 na 1ª linha em 1366 e 1536 px, 5 em 1920
       (a partir de 1680 px) e 2 em 390 px; os da 1ª e 2ª linha com a mesma altura; texto >= 12 px; o código BAP sobre a foto (canto inferior direito, etiqueta que não
       é botão nem link), no rótulo do link do cartão e no alt da foto; no máximo 2 etiquetas de referência à vista
       ("Ref. Cruzada:" e "+N"); "+ Detalhes". A placa só com o serviço interceptado (503 ou veículo falso) e nunca no
       endereço, título, storage ou console. Busca sem resultado: "Nenhum produto encontrado" e o total vazio (RD-0169).
     - Página do produto: a seção "Leve também" (R-20261120-141100b); "Ofereça junto" na página = falha.
     - Janela do produto (<dialog>, "+ Detalhes"): conferida só se existir no site. A página do produto é sempre
       conferida pelo link direto #/produto/CODIGO.

   T-0006, fase 1 (23/11/2026; R-20261123-095435, 112006 e 122814-po): medida da bateria.
     - "bateria": os grupos "Amperagem" (opções em Ah, do menor ao maior, todas à vista, sem "Ver mais") e "Partida a frio
       (CCA)" (até 400, 401 a 500, 501 a 600, 601 a 800, acima de 800) depois da Família, em 1366 px (coluna) e no painel
       do "Filtrar" em 390 px; opções e contagens iguais às do x do JSON ("C20(ah)" e "Cca-18°"). Sem os grupos = falha
       (pega o rótulo da FICHA mudado; a âncora 60D-EFB-24 também).
     - ah=60 e cca=401-500 (com e sem q=bateria): a lista igual à do JSON, a etiqueta do filtro.
     - "60ah", "60 ah", "60Ah", "60-Ah" e "bateria 60ah": as baterias de 60 Ah. "amortecedor": nenhum grupo de medida.
*/

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url); // o Playwright do ambiente está no NODE_PATH (só o require o enxerga)
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(RAIZ, "site");
const PRINTS_PADRAO = path.join(RAIZ, "testes", "prints", "ultima");

// ---------- opções ----------
const erroUso = (msg) => Object.assign(new Error(msg), { uso: true }); // erro de uso: sai sem a pilha
function lerOpcoes(argv) {
  const o = { conhecidos: "", json: "", prints: PRINTS_PADRAO, semNavegador: false, login: false, comparar: "" };
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
    else if (a === "--login") o.login = true;
    else if (a === "--comparar") o.comparar = valor();
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
// Nome com até 3 sinais (espaço, hífen, ponto, "_"...) entre cada letra, como o FORNECEDOR_RE da TRAVA do gerar_site.py
// ("AUTO.IMPACT", "Sun-Rise"). Recebe o nome em maiúsculas; o texto já vem sem acento e em maiúsculas.
// Os nomes com sinais são conferidos TEXTO POR TEXTO (folhas), nunca no textoDe: o " | " entre os campos são 3 sinais
// e juntaria "SUN" de um campo com "RISE" do seguinte.
const comSinais = (nome) => new RegExp([...nome].join("[\\W_]{0,3}"));
// SUNRISE: fornecedor (T-0019), falha em qualquer lugar do JSON (chave ou valor, r[].m também)
const PALAVRAS_SINAIS = [["SUNRISE", comSinais("SUNRISE")]];
// o trecho em volta do achado (m = resultado do match)
const trechoEm = (t, m) => cortar(t.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25), 80);
// Cada texto do objeto, com o lugar: f(onde, texto) para cada chave ("r[0].m (chave)") e cada valor ("r[0].m"), já
// decodificados. Não use o JSON.stringify: nele a quebra de linha vira os caracteres "\n", colados na palavra seguinte
// ("\nCUSTO" escaparia da fronteira de palavra).
function folhas(v, f, onde = "") {
  if (v == null) return;
  if (Array.isArray(v)) return v.forEach((y, i) => folhas(y, f, `${onde}[${i}]`));
  if (typeof v === "object") { for (const [k, y] of Object.entries(v)) { const aqui = onde ? `${onde}.${k}` : k; f(aqui + " (chave)", k); folhas(y, f, aqui); } return; }
  f(onde || "(valor)", String(v));
}
// Texto de um produto para a varredura da PALAVRAS: as chaves e os valores, separados por " | ".
function textoDe(v) {
  const partes = [];
  folhas(v, (_, t) => partes.push(t));
  return partes.join(" | ");
}
// AUTOIMPACT (R-20261121-113400-alexandre, T-0017): marca concorrente, pode aparecer só no rótulo da marca da
// referência cruzada (r[].m), e lá só o nome inteiro: "AUTOIMPACT" ou "AUTOIMPACT PN" ("AUTOIMPACT LINHA" é falha).
// Em qualquer outro lugar do produto (chave ou valor: d, a, x, de, ve, r[].c, p, ca, si, fa, li, oj, po...) é falha.
// [SUPOSIÇÃO] em r[].m o nome inteiro é escrito sem sinais no meio: "AUTO IMPACT" ou "Auto-Impact PN" ali também é falha.
const RX_AUTOIMPACT = comSinais("AUTOIMPACT");
const RX_RF_MARCA = /^r\[\d+\]\.m$/;
const AUTOIMPACT_INTEIRO = new Set(["AUTOIMPACT", "AUTOIMPACT PN"]);
function autoimpactForaDaRef(v) {
  const achou = [];
  folhas(v, (onde, x) => {
    const t = norm(x);
    const m = t.match(RX_AUTOIMPACT);
    if (!m || (RX_RF_MARCA.test(onde) && AUTOIMPACT_INTEIRO.has(t))) return;
    achou.push({ onde: RX_RF_MARCA.test(onde) ? onde + " (rótulo composto)" : onde, trecho: trechoEm(t, m) });
  });
  return achou;
}
// vale para o texto do JSON (textoDe) e para o texto da tela do produto; quebra de linha e tab viram espaço
function palavrasInternas(texto, lista = PALAVRAS) {
  const t = semAcento(texto).toUpperCase().replace(/\s+/g, " ");
  const achou = [];
  for (const [nome, rx] of lista) {
    const m = t.match(rx);
    if (m) achou.push({ nome, trecho: trechoEm(t, m) });
  }
  return achou;
}
// as palavras com sinais, texto por texto (folhas) de um objeto do JSON
function palavrasSinais(v) {
  const achou = [];
  folhas(v, (onde, t) => { for (const a of palavrasInternas(t, PALAVRAS_SINAIS)) achou.push({ ...a, onde }); });
  return achou;
}
// campos que o gerar_site.py grava em cada produto (docs/DADOS_DO_SITE.md); campo novo = conferir antes
// É a lista do que é PERMITIDO, não do que é obrigatório: produto sem um destes campos não falha ("df" e "ip" saíram no
// PR #50, T-0017: se voltarem, falha).
// "ve" (T-0017, v17): veículos da aba VEICULOS, lista de [FABRICANTE, MODELO] ou [FABRICANTE, MODELO, VERSAO], textos não vazios
// "ss" (T-0018, R-20261121-200058): sistema da peça para o "Leve também", opcional, lista de textos não vazios
// "ve" com ano (T-0040, Fraga soma): a linha da aba VEICULOS que tem ano vai como [FABRICANTE, MODELO, VERSAO, ANO_INICIO,
// ANO_FIM], com a versão em texto (pode ser "") e os anos inteiros (0 quando faltam); sem ano, como antes. Os dois no mesmo produto
const CAMPOS = new Set(["c", "d", "a", "r", "x", "mo", "p", "ca", "si", "fa", "li", "po", "la", "de", "oj", "an", "i", "ve", "ss"]);
// lista não vazia de textos não vazios (formato do "ve" e do "ss")
const textosOk = (l) => Array.isArray(l) && l.length > 0 && l.every((t) => typeof t === "string" && t.trim());
// ano do "ve" (T-0040): inteiro, 0 (falta) ou de 1900 a 2100 [SUPOSIÇÃO: na v29 os anos vão de 1950 a 2026]
const anoVeOk = (n) => Number.isInteger(n) && (n === 0 || (n >= 1900 && n <= 2100));
// um veículo do "ve": [fab, mod] ou [fab, mod, ver] (textos não vazios), ou, com ano, [fab, mod, ver, ini, fim]: fab e mod não
// vazios, ver texto, ini e fim inteiros (0 quando faltam), ini <= fim quando os dois existem
const veAnoOk = (x) => Array.isArray(x) && x.length === 5 && textosOk(x.slice(0, 2)) && typeof x[2] === "string"
  && anoVeOk(x[3]) && anoVeOk(x[4]) && !(x[3] && x[4] && x[3] > x[4]);
const veOk = (x) => veAnoOk(x) || (textosOk(x) && (x.length === 2 || x.length === 3));
const palavraInteira = (texto, palavra) => new RegExp(`(?<![A-Z0-9])${palavra}(?![A-Z0-9])`).test(norm(texto));

// ---------- serviço de placas no teste (T-0005, T-0014) ----------
// Nunca há consulta real: a rota do serviço é interceptada aqui (503, ou o veículo falso abaixo) e qualquer outro
// pedido para fora da máquina com a placa é barrado e vira falha.
// [SUPOSIÇÃO] ZZZ9Z99 é uma placa inventada no formato Mercosul; ela nunca sai da máquina.
const RX_PLACAS = /bapajudacatalogo-placas\.onrender\.com|\/veiculo(\?|$)/;
const PLACA_FALSA = "ZZZ9Z99";
// resposta 200 no contrato do serviço (docs/placas/DESENHO.md, item 6): só dados do veículo
const VEICULO_FALSO = { montadora: "VW", modelo: "GOL", modelo_lista: ["GOL"], ano: 2018, ano_modelo: 2018, combustivel: "FLEX", cilindradas: 1598, potencia: null, motor: "1.6" };

// Funções que rodam dentro da página (addInitScript): acham os campos, o botão de cada um e os grupos de filtro
// sem depender do nome da classe, para valer nas 2 telas.
function ajudaDaPagina() {
  const visivel = (el) => !!el && !el.closest("[hidden]") && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  const nome = (el) => {
    if (!el) return "";
    const partes = [];
    if (el.labels) for (const l of el.labels) partes.push(l.textContent);
    for (const id of (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean)) { const x = document.getElementById(id); if (x) partes.push(x.textContent); }
    partes.push(el.getAttribute("aria-label") || "");
    return partes.join(" ").replace(/\s+/g, " ").trim();
  };
  const raiz = () => document.querySelector(".cartao-busca") || document.querySelector("#app") || document.body;
  function campos() {
    const r = raiz();
    const q = r.querySelector('input[name="q"]');
    const placa = [...r.querySelectorAll("input")].find((i) => i !== q && /placa/i.test([nome(i), i.id, i.name].join(" "))) || null;
    return { abas: r.querySelectorAll('[role="tab"]').length, q, placa };
  }
  // o botão do campo: o 1º botão visível depois dele (sem "Limpar") e antes do outro campo, quando o outro vem depois
  function botaoDe(campo, outro) {
    if (!campo) return null;
    const segue = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    return [...raiz().querySelectorAll("button")].find((b) => visivel(b) && b.type !== "reset" && !/limpar/i.test(b.textContent)
      && segue(campo, b) && !(outro && segue(campo, outro) && segue(outro, b))) || null;
  }
  const grupos = () => [...document.querySelectorAll("#app button[aria-expanded]")]
    .filter((b) => visivel(b) && /^(Sistema|Fam[ií]lia|Linha|Categoria|Amperagem|Partida a frio)/i.test(b.textContent.trim()));
  // as opções (o rótulo de cada caixa de marcar) do grupo j (ou do 1º aberto); na coluna fixa os grupos ficam todos abertos
  function opcoes(j) {
    const bt = j != null ? grupos()[j] : grupos().find((b) => b.getAttribute("aria-expanded") === "true");
    if (bt && bt.getAttribute("aria-expanded") !== "true") return [];
    if (!bt) return [];
    const alvo = document.getElementById(bt.getAttribute("aria-controls") || "") || bt.parentElement;
    return [...alvo.querySelectorAll('input[type="checkbox"]')].map((c) => c.closest("label") || (c.labels && c.labels[0]) || c).filter(visivel);
  }
  const etiquetas = () => [...document.querySelectorAll("#app button[aria-label]")].filter((b) => visivel(b) && /^Tirar\b/i.test(b.getAttribute("aria-label")));
  // o quadro da busca: o contêiner do campo da placa (e do q); os botões "Buscar" dele (sem "Limpar" e sem os "x")
  const quadro = () => { const c = campos(), r = raiz(); return c.placa && r.contains(c.placa) && r !== document.body ? r : (c.placa && (c.placa.closest("section, form[role=search]") || c.placa.parentElement)) || r; };
  const botoesBuscar = () => [...quadro().querySelectorAll("button")].filter((b) => visivel(b) && b.type !== "reset" && !/limpar/i.test(b.textContent)
    && !/^Tirar\b/i.test(b.getAttribute("aria-label") || "") && (b.type === "submit" || /buscar/i.test(b.textContent + " " + (b.getAttribute("aria-label") || ""))));
  // T-0014 (modelo B): o código do cartão vem do data-cod, do .cod (sem o " · " do leitor de tela) ou do link do cartão
  const codDoHref = (a) => { const m = /#\/produto\/([^?#]+)/.exec((a && a.getAttribute("href")) || ""); return m ? decodeURIComponent(m[1]) : ""; };
  // o link do título do cartão (não o "+ Detalhes") e o "+ Detalhes"
  const linkDe = (it) => [...it.querySelectorAll('a[href*="#/produto/"]')].find((a) => !/\+\s*Detalhes/i.test(a.textContent)) || null;
  const detalhesDe = (it) => [...it.querySelectorAll("a,button")].find((b) => /\+\s*Detalhes/i.test(b.textContent)) || null;
  const codDe = (it) => {
    if (!it) return "";
    if (it.dataset && it.dataset.cod) return it.dataset.cod.trim();
    const c = it.querySelector(".cod");
    if (c) return c.textContent.replace(/[\s·]+$/, "").trim();
    return codDoHref(linkDe(it) || detalhesDe(it));
  };
  // faixa do veículo (R-20261120-123630 e 124800): as 5 listas Marca › Modelo › Ano › Motor › Versão e a faixa que as guarda
  function veiculo() {
    const sels = [...document.querySelectorAll("#app select")];
    // o rótulo da lista sem o texto das opções (o label pode envolver o select)
    const rot = (s) => (s.getAttribute("aria-label") || [...(s.labels || [])].map((l) => [...l.childNodes].filter((n) => n !== s && !(n.contains && n.contains(s))).map((n) => n.textContent).join(" ")).join(" ") || nome(s)).replace(/\s+/g, " ").trim();
    const ach = (rx) => sels.find((s) => rx.test(rot(s))) || null;
    const listas = [ach(/^\s*Marca/i), ach(/^\s*Modelo/i), ach(/^\s*Ano/i), ach(/^\s*Motor/i), ach(/^\s*Vers[aã]o/i)];
    let faixa = null;
    if (listas[0]) { faixa = listas[0].closest("section, [aria-label]"); while (faixa && listas.some((l) => l && !faixa.contains(l))) faixa = faixa.parentElement && faixa.parentElement.closest("section, [aria-label]"); }
    return { listas, faixa, rotulos: listas.map((l) => (l ? rot(l) : "")) };
  }
  window.__bapT = { visivel, nome, campos, botaoDe, grupos, opcoes, etiquetas, quadro, botoesBuscar, codDe, linkDe, detalhesDe, veiculo };
}

// casos tirados do JSON do dia, também usados pelos testes do login (testes/login.mjs)
const CASOS = { COD: "CXD13062", FOTO: "AMT7115" };

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

// ---------- vigia do console (as buscas e o login) ----------
// Erro de script, console.error do site e requisição do site que falhou vão para emErro(texto); os de outro site viram
// aviso no teste (id, nome). ignorar(url): o que o próprio teste provocou; pausado(): os erros que o teste faz de propósito.
function vigiar(page, { base, emErro, id = "console", nome = "console sem erro", rotulo = "", ignorar = () => false, pausado = () => false }) {
  const local = (u) => String(u || "").startsWith(base);
  page.on("console", (m) => {
    if (m.type() !== "error" || pausado()) return;
    const u = (m.location() || {}).url || "";
    if (ignorar(u)) return;
    if (u && !local(u)) aviso(id, nome, `${rotulo}erro de recurso de fora (${cortar(u, 60)}): ${cortar(m.text(), 80)}`);
    else emErro(cortar(m.text(), 120));
  });
  page.on("pageerror", (e) => emErro("erro de script: " + cortar(e.message, 120)));
  page.on("requestfailed", (r) => {
    if (pausado() || ignorar(r.url())) return;
    const txt = `requisição falhou: ${cortar(r.url(), 80)} ${(r.failure() || {}).errorText || ""}`;
    if (local(r.url())) emErro(txt); else aviso(id, nome, rotulo + txt);
  });
}

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
  // formato do "ve" (docs/DADOS_DO_SITE.md): lista não vazia de [FABRICANTE, MODELO, VERSAO?], 2 ou 3 textos não vazios, ou
  // (T-0040) [fabricante, modelo, versão, início, fim] na linha com ano (veOk)
  const veRuim = [];
  let comVe = 0, nVe = 0, nAno = 0;
  for (const p of prods) {
    if (!("ve" in p)) continue;
    comVe++;
    const ok = Array.isArray(p.ve) && p.ve.length && p.ve.every(veOk);
    if (!ok) veRuim.push(`${p.c}: ${cortar(JSON.stringify(p.ve.find ? p.ve.find((x) => !veOk(x)) : p.ve), 60)}`);
    else { nVe += p.ve.length; nAno += p.ve.filter((x) => x.length === 5).length; }
  }
  if (veRuim.length) falha("campos", N_CAMPOS, "ve:formato", `"ve" fora do formato [fabricante, modelo, versão?] ou [fabricante, modelo, versão, início, fim] (anos inteiros, 0 quando faltam) em ${veRuim.length} produto(s), ex.: ${veRuim.slice(0, 3).join("; ")}`);
  // formato do "ss" (T-0018): quando existe, lista de textos não vazios (ex.: ["CÂMBIO E DIFERENCIAL"])
  const ssRuim = [];
  let comSs = 0;
  for (const p of prods) {
    if (!("ss" in p)) continue;
    comSs++;
    if (!textosOk(p.ss)) ssRuim.push(`${p.c}: ${cortar(JSON.stringify(p.ss), 60)}`);
  }
  if (ssRuim.length) falha("campos", N_CAMPOS, "ss:formato", `"ss" fora do formato [sistema, ...] (textos não vazios) em ${ssRuim.length} produto(s), ex.: ${ssRuim.slice(0, 3).join("; ")}`);
  detalhe("campos", N_CAMPOS, novos.size ? "" : `só os ${CAMPOS.size} campos conhecidos` + (comVe ? `; "ve" em ${fmt(comVe)} produtos (${fmt(nVe)} veículos) no formato [fabricante, modelo, versão?]` : `; sem "ve"`) + (nAno ? `, ${fmt(nAno)} deles com ano [fabricante, modelo, versão, início, fim]` : `; sem ano no "ve"`) + (comSs ? `; "ss" em ${fmt(comSs)} produtos` : `; sem "ss"`));
  // palavra interna: cabeçalho e cada produto
  const cab = { ...dados }; delete cab.produtos;
  for (const a of palavrasInternas(textoDe(cab)).concat(palavrasSinais(cab))) falha("palavra", N_PAL, `${a.nome}:(cabeçalho)`, `(cabeçalho do JSON) "${a.nome}": …${a.trecho}…`);
  for (const p of prods) {
    for (const a of palavrasInternas(textoDe(p)).concat(palavrasSinais(p))) falha("palavra", N_PAL, `${a.nome}:${p.c}`, `${p.c} "${a.nome}"${a.onde ? ` em ${a.onde}` : ""}: …${a.trecho}…`);
  }
  teste("palavra", N_PAL);
  // AUTOIMPACT só no rótulo da marca da referência cruzada (r[].m); o cabeçalho do JSON não pode ter
  const N_AI = "AUTOIMPACT só na ref. cruzada";
  let naRef = 0;
  for (const a of autoimpactForaDaRef(cab)) falha("autoimpact", N_AI, `(cabeçalho):${a.onde}`, `(cabeçalho do JSON) ${a.onde}: …${a.trecho}…`);
  for (const p of prods) {
    for (const a of autoimpactForaDaRef(p)) falha("autoimpact", N_AI, `${p.c}:${a.onde}`, `${p.c} ${a.onde}: …${a.trecho}…`);
    for (const r of Array.isArray(p.r) ? p.r : []) if (r && AUTOIMPACT_INTEIRO.has(norm(r.m))) naRef++;
  }
  teste("autoimpact", N_AI);
  detalhe("autoimpact", N_AI, `${fmt(naRef)} referência(s) com a AUTOIMPACT na marca (r[].m, nome inteiro), o único lugar permitido`);
  return { dados, prods, porCod: new Map(prods.map((p) => [normCod(p.c), p])) };
}

// ---------- 2. o site no navegador ----------
// entrar (T-0022, --login): async (page) => void, chamado em cada largura antes da 1ª tela, para o site atrás do login
async function testarSite(base, ctxJson, dirPrints, entrar = null) {
  const { chromium } = require("playwright");
  const { prods, porCod } = ctxJson;
  const existe = (c) => porCod.has(normCod(c));
  fs.mkdirSync(dirPrints, { recursive: true }); // os *.png antigos de testes/prints/ultima saem no main(), antes do --login

  // casos tirados do JSON do dia; se um sumir, o teste diz qual
  const { COD } = CASOS;
  const pCod = porCod.get(normCod(COD));
  const refTrw = pCod && (pCod.r || []).find((r) => norm(r.m) === "TRW");
  const refNak = pCod && (pCod.r || []).find((r) => norm(r.m).startsWith("NAKATA"));
  const comFoto = porCod.get(normCod(CASOS.FOTO))?.i ? porCod.get(normCod(CASOS.FOTO))
    : prods.find((p) => p.i && p.a && p.r && p.x && p.oj);
  // exemplos da diretriz da T-0011: AMT7005 (Gol 1980 a 2009, KYB 441126) e o EAN do TER551011. Com a Fraga (T-0040),
  // o AMT7005 tem o Gol só em 1988 e em 1990–1991: o caso da diretriz usa 1990, que vale nas duas bases
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

  const VT = { n: prods.reduce((n, p) => n + (p.ve || []).filter((x) => x.length === 5).length, 0), txt: [] }; // T-0040: veículos com ano no "ve" e o que os casos acharam
  const TELAS = new Set(), FILTROS = new Set(), JANELAS = new Set(); // o que foi detectado (T-0014), nas 2 larguras
  const CARTOES = [], FILTRO_SI = {}, CAMPOS_TELA = {}, MV = [];
  const FILTRO_SI_CASO = comFoto && comFoto.si; // o sistema do produto com foto (AMT7115: SUSPENSÃO)
  // T-0006, fase 1 (R-20261123-095435, 112006 e 122814): medida da bateria. O esperado sai do x (ficha técnica) do JSON:
  // "C20(ah)" e "Cca-18°", com a chave sem acento, caixa e sinais (C20AH e CCA18) e o valor inteiro. A âncora 60D-EFB-24
  // (60 Ah, CCA 600) pega o rótulo da FICHA mudado (aí o x não tem mais a medida e os filtros somem do site).
  const FAIXAS_CCA = [[400, "até 400"], [500, "401 a 500"], [600, "501 a 600"], [800, "601 a 800"], [Infinity, "acima de 800"]];
  const medidaJson = (p) => {
    const x = new Map(((p && p.x) || []).map(([k, v]) => [normCod(k), String(v).trim()]));
    const ah = /^\d+$/.test(x.get("C20AH") || "") ? +x.get("C20AH") : null;
    const n = /^\d+$/.test(x.get("CCA18") || "") ? +x.get("CCA18") : null;
    return { ah, cca: n == null ? null : FAIXAS_CCA.findIndex(([lim]) => n <= lim) };
  };
  const ANCORA_BAT = "60D-EFB-24";
  { const m = medidaJson(porCod.get(normCod(ANCORA_BAT))); if (m.ah !== 60 || m.cca !== 2) falha("casos", "casos do JSON", ANCORA_BAT, `o ${ANCORA_BAT} não tem mais "C20(ah)" 60 e "Cca-18°" 600 no x do JSON (o rótulo da FICHA mudou? os filtros Amperagem e CCA do site somem)`); }
  const BAT_AH60 = prods.filter((p) => medidaJson(p).ah === 60).map((p) => p.c);
  const BAT_CCA2 = prods.filter((p) => medidaJson(p).cca === 1).map((p) => p.c); // cca=401-500
  const MEDIDAS = []; // o que a bateria viu, para o detalhe
  const browser = await chromium.launch();
  try {
    for (const [larg, alt] of [[1366, 768], [390, 844]]) {
      const L = `${larg} px`;
      const ctx = await browser.newContext({ viewport: { width: larg, height: alt }, deviceScaleFactor: 1 });
      // o serviço de placas (T-0005) nunca é chamado de verdade no teste: a rota responde aqui mesmo (503, ou o
      // veículo falso quando PL.resposta está ligado). Pedido para fora com a placa falsa é barrado e vira falha.
      // [SUPOSIÇÃO] o site só chama o serviço quando o cliente busca uma placa; chamada sem a busca vira aviso.
      const PL = { esperando: false, chamadas: 0, resposta: null };
      await ctx.route((u) => RX_PLACAS.test(u.href) || !u.href.startsWith(base), (rota) => {
        const req = rota.request(), url = req.url();
        if (!RX_PLACAS.test(url)) {
          if ((url + " " + (req.postData() || "")).toUpperCase().includes(PLACA_FALSA)) {
            falha("placa", "campo da placa", "vazou:" + cortar(url.replace(/[?#].*$/, ""), 60), `${L}: a placa foi para fora da máquina (${cortar(url.replace(/[?#].*$/, ""), 70)}); pedido barrado no teste`);
            return rota.abort();
          }
          return rota.continue();
        }
        if (!PL.esperando) aviso("placa", "campo da placa", `o site chamou o serviço de placas sem busca de placa: ${cortar(url.replace(/[?#].*$/, ""), 70)} (respondido 503 no teste, sem rede)`);
        PL.chamadas++;
        if (PL.esperando && PL.resposta) return rota.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PL.resposta) });
        return rota.fulfill({ status: 503, contentType: "application/json", body: '{"erro":"teste: serviço de placas desligado"}' });
      });
      await ctx.addInitScript(ajudaDaPagina);
      const page = await ctx.newPage();
      let erros = [];
      const local = (u) => String(u || "").startsWith(base);
      // o 503 que o próprio teste deu ao serviço de placas não conta
      vigiar(page, { base, emErro: (t) => erros.push(t), ignorar: (u) => PL.esperando && RX_PLACAS.test(u) });

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
          itens: [...document.querySelectorAll(".lista .item")].map((e) => ({ c: window.__bapT.codDe(e), t: e.innerText })),
        }));
      };
      const primeiros = () => page.evaluate(() => [...document.querySelectorAll(".lista .item")].slice(0, 5).map((e) => window.__bapT.codDe(e)));
      // a página inicial é o "#/" (ou sem hash)
      const naHome = () => page.evaluate(() => /^#?\/?$/.test(location.hash));
      // botões "Buscar" no quadro (T-0018): na página inicial 2 (o do q e o da placa), na tela de busca 1 só
      const conferirBotoes = (n, onde) => {
        const quer = onde === "home" ? 2 : 1;
        if (n !== quer) falha("campos-busca", "campos da busca", "botoes", `${L}: o quadro da busca ${onde === "home" ? "da página inicial " : ""}tem ${n} botão(ões) "Buscar" (pedido: ${onde === "home" ? "2 na página inicial, o do q e o da placa" : "1 só para os 2 campos"})`);
      };
      // o botão "Buscar" da placa: o do mesmo formulário do campo da placa (página inicial, com 2) ou o 1º (1 só)
      const botaoDaPlaca = async () => (await page.evaluateHandle(() => { const T = window.__bapT, placa = T.campos().placa, bs = T.botoesBuscar(); return bs.find((b) => placa && b.form && b.form === placa.form) || bs[0] || null; })).asElement();
      const totalTela = () => page.evaluate(() => parseInt(((document.querySelector(".total") || {}).textContent || "").replace(/\D/g, ""), 10) || 0);

      // ---- início ----
      if (entrar) await entrar(page); // --login: entra pela tela (o cookie da sessão fica no contexto)
      erros = [];
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 15000 }).catch(() => {});
      await abrir("inicio", "#/");
      // a página inicial (T-0018, R-20261120-143900) mostra em ".mf-total" o "+" e o total arredondado para baixo à
      // centena ("+4.400" ou "+4400" para 4.419; os pontos não contam e o resto do texto do elemento é ignorado).
      // sem ".mf-total" é falha
      const ini = await page.evaluate(() => { const e = document.querySelector(".mf-total"); return e ? e.textContent.replace(/\s+/g, "") : null; });
      const centena = Math.floor(prods.length / 100) * 100;
      if (ini === null) falha("abrir", "site abre", "inicio-total", `${L}: o início não tem o ".mf-total" (esperado "+${fmt(centena)}")`);
      else if ((ini.match(/\+[\d.]+/) || [""])[0].replace(/\./g, "") !== "+" + centena) falha("abrir", "site abre", "inicio-total", `${L}: o início mostra "${ini}" (.mf-total), o esperado é "+${fmt(centena)}" (o total ${fmt(prods.length)} do JSON arredondado para baixo à centena, com "+")`);
      conferirConsole("inicio");
      await print("inicio");
      // qual tela o site mostra (T-0014): só a "campos" (sem abas, q e placa lado a lado) vale; com abas, falha
      const N_TELA = "tela da busca";
      const tela = await page.evaluate(() => { const c = window.__bapT.campos(); return c.abas ? "abas" : c.q && c.placa ? "campos" : "?"; });
      if (tela === "?") falha("tela", N_TELA, "?", `${L}: não reconheci a tela da busca (nem 2 abas, nem o campo q com o da placa)`);
      else if (tela === "abas") falha("tela", N_TELA, "abas", `${L}: a tela da busca tem abas (role="tab"); a aprovada (T-0014, modelo B) não tem abas: campo q e campo da placa lado a lado`);
      TELAS.add(tela);
      // o botão "Buscar" do campo q: o do formulário do próprio campo
      const clicarBuscarQ = async () => {
        // tela nova (T-0014, R-20261120-115432): UM só botão "Buscar" no quadro da busca (na página inicial, 2: T-0018)
        const n = await page.evaluate(() => window.__bapT.botoesBuscar().length);
        conferirBotoes(n, (await naHome()) ? "home" : "busca");
        // com 2 (página inicial), o do campo q: o do mesmo formulário do q, ou o 1º
        const h = n ? (await page.evaluateHandle(() => { const T = window.__bapT, q = T.campos().q, bs = T.botoesBuscar(); return bs.find((b) => q && b.form && b.form === q.form) || bs[0]; })).asElement() : null;
        if (!h) return page.press('input[name="q"]', "Enter");
        return h.click();
      };

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
        await clicarBuscarQ();
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
      // T-0040: o ano do caso era 2007; na Fraga o AMT7005 tem o Gol só em 1988 e em 1990–1991, e 2007 não serve
      // mais. O caso passou a 1990, que está nas duas (1980 a 2009 na aplicação; 1990–1991 no "ve"). A regra não mudou.
      const N_PAL2 = "busca palavra por palavra";
      if (pAmt && temKyb) {
        const tudo = "AMORTECEDOR GOL 1990 KYB 441126";
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
        for (const q of ["gol 1990 amortecedor 441126 kyb", "amortecedor gol 1990 kyb 441126", "441126 Kyb 1990 Gol Amortecedor"]) {
          await abrir("busca-diretriz-ordem", "#/busca?q=" + encodeURIComponent(q));
          const r = await listaTodos(), c = r.itens.map((i) => i.c);
          if (c.join() !== c1.join()) falha("palavra2", N_PAL2, "2:" + q, `"${q}" = ${c.join(",") || "nada"}; "${tudo}" = ${c1.join(",") || "nada"}`);
          conferirConsole("busca-diretriz-ordem");
        }
        const fora = "AMORTECEDOR GOL 2015 KYB 441126"; // 2015 fora da faixa (1980 a 2009; na Fraga, 1988 e 1990–1991): ninguém casa com tudo
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
      // aviso de tipo sem peça no ano (T-0033, decisão do Alexandre): a busca digitada com tipo + modelo + ano em que
      // nenhuma peça do tipo serve mostra, fora da lista, "Nenhuma <tipo> para <Modelo> <ano>"; com peça do tipo, não mostra
      const N_AVT = "aviso de tipo sem peça no ano";
      const avisoTipo = () => page.evaluate(() => {
        const o = [], tw = document.createTreeWalker(document.querySelector("#app"), NodeFilter.SHOW_TEXT);
        for (let n; (n = tw.nextNode()); ) { const e = n.parentElement; if (e && !e.closest(".lista .item, [data-cod], .so-impressao") && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) o.push(n.nodeValue); }
        const t = o.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
        const m = /(?<![A-Za-z])Nenhum[a]?\b[^.!]{0,120}?\bpara\b[^.!;]{0,60}/i.exec(t);
        return m ? m[0].trim() : "";
      });
      const ehBomba = (p) => /BOMBA/.test(norm(`${p.p} ${p.d}`)) && /COMBUST/.test(norm(`${p.p} ${p.d} ${p.fa}`));
      const avt = [];
      for (const [q, esperado] of [["bomba combustivel polo 2026", /^NENHUMA BOMBA DE COMBUSTIVEL PARA POLO 2026\b/], ["polo 2026", null], ["bomba combustivel onix 2015", null]]) {
        await abrir("busca-aviso-tipo", "#/busca?q=" + encodeURIComponent(q));
        const r = await listaTodos(), av = await avisoTipo();
        if (esperado && !esperado.test(norm(av))) falha("avisotipo", N_AVT, q, `"${q}": ${av ? `aviso diferente: "${cortar(av, 90)}"` : "sem o aviso"} (esperado "Nenhuma bomba de combustível para Polo 2026")`);
        if (!esperado && av) falha("avisotipo", N_AVT, q, `"${q}": aviso indevido "${cortar(av, 90)}"`);
        const bombas = r.itens.map((i) => porCod.get(normCod(i.c))).filter((p) => p && ehBomba(p)).map((p) => p.c);
        if (esperado && bombas.length) falha("avisotipo", N_AVT, q + ":bomba", `"${q}": com o aviso, a lista tem bomba: ${bombas.join(", ")}`);
        if (q.includes("onix") && existe("BCE3002") && !bombas.includes("BCE3002")) falha("avisotipo", N_AVT, q + ":BCE3002", `"${q}": sem a BCE3002 (que serve no Onix 2015)`);
        avt.push(`"${q}" = ${r.itens.length}${av ? ` com "${cortar(av, 60)}"` : ", sem aviso"}`);
        if (esperado) { await page.evaluate(() => window.scrollTo(0, 0)); await print("busca-aviso-tipo"); }
        conferirConsole("busca-aviso-tipo");
      }
      detalhe("avisotipo", N_AVT, avt.join("; "));


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
      detalhe("palavra2", N_PAL2, `"AMORTECEDOR GOL 1990 KYB 441126" → AMT7005 em 1º, lista estrita; outra ordem e minúsculas iguais; ` +
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

      // ---- T-0039 (25/11/2026, respostas "1) a 2) a 3) a"): palavra inteira do veículo e moto primeiro ----
      // 1a: "titan" não casa "titanium" (FAC6227, Ford Focus Titanium, sai de "filtro titan"); 2a: com nome de modelo de
      // moto do catálogo, os produtos de moto vêm antes e os outros logo abaixo (nada some). "De moto" aqui = o campo
      // li (LINHA) do produtos.json igual a "MOTO", regra do teste (não a do site).
      const N_TIT = "palavra inteira e moto primeiro (T-0039)";
      {
        const deMoto = (c) => norm(porCod.get(normCod(c))?.li || "") === "MOTO";
        const VW_TITAN = ["FAR6026", "FAR6082", "FSE6117", "FSE6215", "FSE6308", "FCB6028", "FAC6194"];
        const contasTit = [];
        // a ordem: nenhum produto que não é de moto antes do último de moto
        const motoPrimeiro = (q, cods) => {
          const nM = cods.filter(deMoto).length;
          if (!nM) { falha("titan", N_TIT, q + ":sem-moto", `"${q}": nenhum produto de moto (li = MOTO) na lista`); return; }
          const fora = cods.slice(0, nM).filter((c) => !deMoto(c));
          if (fora.length) falha("titan", N_TIT, q + ":ordem", `"${q}": ${nM} de moto, mas entre os ${nM} primeiros há ${fora.length} que não são de moto (${fora.slice(0, 6).join(", ")}); ordem: ${cods.slice(0, 12).join(", ")}`);
        };
        // "filtro titan": sem o FAC6227; FAR6365 antes dos 7 do VW 18-310 Titan; os 7 continuam
        const qFt = "filtro titan";
        await abrir("busca-titan", "#/busca?q=" + encodeURIComponent(qFt));
        let c = (await listaTodos()).itens.map((i) => i.c);
        contasTit.push(`"${qFt}" = ${c.length} (${c.join(", ")})`);
        if (c.includes("FAC6227")) falha("titan", N_TIT, qFt + ":FAC6227", `"${qFt}" trouxe o FAC6227 (Focus Titanium): "titan" casou dentro de "titanium"`);
        const iMoto = c.indexOf("FAR6365");
        if (iMoto < 0) falha("titan", N_TIT, qFt + ":FAR6365", `"${qFt}" não trouxe o FAR6365 (Honda CG 150 Titan)`);
        const sumidos = VW_TITAN.filter((x) => existe(x) && !c.includes(x));
        if (sumidos.length) falha("titan", N_TIT, qFt + ":sumiu", `"${qFt}" perdeu ${sumidos.join(", ")} (caminhão VW Titan: tem de continuar na lista, abaixo)`);
        const antes = VW_TITAN.filter((x) => c.includes(x) && iMoto >= 0 && c.indexOf(x) < iMoto);
        if (antes.length) falha("titan", N_TIT, qFt + ":ordem", `"${qFt}": ${antes.join(", ")} antes do FAR6365 (posição ${iMoto + 1}); ordem: ${c.join(", ")}`);
        motoPrimeiro(qFt, c);
        await page.evaluate(() => window.scrollTo(0, 0));
        await print("busca-titan");
        conferirConsole("busca-titan");
        // "titan" e "biz": todos os de moto antes dos que não são
        for (const q of ["titan", "biz"]) {
          await abrir("busca-moto", "#/busca?q=" + encodeURIComponent(q));
          c = (await listaTodos()).itens.map((i) => i.c);
          contasTit.push(`"${q}" = ${c.length}, ${c.filter(deMoto).length} de moto`);
          if (c.includes("FAC6227")) falha("titan", N_TIT, q + ":FAC6227", `"${q}" trouxe o FAC6227 (Focus Titanium)`);
          motoPrimeiro(q, c);
          await page.evaluate(() => window.scrollTo(0, 0));
          await print("busca-moto-" + q);
          conferirConsole("busca-moto");
        }
        // "focus titanium": a palavra inteira acha o FAC6227
        const qFo = "focus titanium";
        await abrir("busca-titanium", "#/busca?q=" + encodeURIComponent(qFo));
        c = (await listaTodos()).itens.map((i) => i.c);
        contasTit.push(`"${qFo}" = ${c.length}`);
        if (!c.includes("FAC6227")) falha("titan", N_TIT, qFo, `"${qFo}" não trouxe o FAC6227 (${c.length} itens: ${c.slice(0, 8).join(", ")})`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await print("busca-titanium");
        conferirConsole("busca-titanium");
        // prefixo de código e código de moto continuam como antes (código e referência: blocos "busca código" e "busca referência")
        for (const [q, esperado, primeiro] of [["CXD1306", "CXD13062", false], ["FAR6365", "FAR6365", true]]) {
          if (!existe(esperado)) continue;
          await abrir("busca-titan-cod", "#/busca?q=" + encodeURIComponent(q));
          c = (await listaTodos()).itens.map((i) => i.c);
          if (primeiro ? c[0] !== esperado : !c.includes(esperado)) falha("titan", N_TIT, "cod:" + q, `"${q}": ${primeiro ? "1º = " + (c[0] || "nada") : "sem o " + esperado} (esperado ${esperado}${primeiro ? " em 1º" : " na lista"})`);
          conferirConsole("busca-titan-cod");
        }
        detalhe("titan", N_TIT, contasTit.join("; "));
      }

      // ---- busca sem resultado ----
      const N_VAZ = "busca sem resultado";
      for (const [k, v] of [["q", "xyzqwk nadaexiste"], ["q", "ZZQ999999"], ["cod", "ZZQ999999"]]) {
        await abrir("busca-vazia", `#/busca?${k}=${encodeURIComponent(v)}`);
        const r = await listaTodos();
        // T-0018 (R-20261120-161500-alexandre, RD-0169): com 0 resultados fica só "Nenhum produto encontrado" e o total
        // vazio
        if (r.itens.length || !/Nenhum produto encontrado/.test(r.vazio) || r.total.trim())
          falha("vazia", N_VAZ, `${k}:${v}`, `"${v}": ${r.itens.length} item(ns), total "${r.total}", mensagem "${cortar(r.vazio, 40)}"`);
        if (r.proximos) falha("vazia", N_VAZ, `${k}:${v}:proximos`, `"${v}": aviso dos "mais próximos" sem nenhum produto parecido`);
        if (v === "xyzqwk nadaexiste") await print("busca-vazia");
        conferirConsole("busca-vazia");
      }
      detalhe("vazia", N_VAZ, `"xyzqwk nadaexiste", "ZZQ999999" e o link antigo cod=ZZQ999999 → "Nenhum produto encontrado"`);

      // ---- cartões da lista (T-0014, só na tela nova): 4 na 1ª linha em 1366 e 1536 px, 5 em 1920, 2 em 390; texto >= 12 px ----
      const N_CART = "cartões da lista", QF = "amortecedor";
      const medirCartoes = () => page.evaluate(() => {
        const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && getComputedStyle(el).visibility !== "hidden"; };
        const itens = [...document.querySelectorAll(".lista .item")].filter(vis);
        if (!itens.length) return { n: 0, linha1: 0, pequenos: [], nPeq: 0, foto: "?", larg: 0 };
        const t0 = itens[0].getBoundingClientRect().top;
        const linha1 = itens.filter((e) => Math.abs(e.getBoundingClientRect().top - t0) < 4).length;
        const ate = new Set(itens.slice(0, 24));
        const pequenos = [];
        const w = document.createTreeWalker(document.querySelector(".lista"), NodeFilter.SHOW_TEXT);
        for (let n; (n = w.nextNode());) {
          const el = n.parentElement;
          if (!n.textContent.trim() || !el || !ate.has(el.closest(".item")) || !vis(el)) continue;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 12) pequenos.push(`${fs} px "${n.textContent.trim().slice(0, 20)}" (${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].join(".") : ""})`);
        }
        const f = itens[0].querySelector(".foto") || itens[0].querySelector("img");
        const r = f ? f.getBoundingClientRect() : null;
        // T-0014 modelo B (R-20261120-122300): em cada cartão (até 24), o código BAP sobre a foto, no canto inferior direito,
        // numa etiqueta que não é botão nem link; o código no rótulo do link do cartão e no alt da foto; no máximo 2
        // etiquetas de referência cruzada à vista (o resto em "+N"); e o "+ Detalhes"
        const T = window.__bapT, prob = [];
        let maxRefs = 0, comMais = 0;
        for (const it of itens.slice(0, 24)) {
          const cod = T.codDe(it);
          const caixaF = it.querySelector(".foto") || (it.querySelector("img, .sem-foto") || {}).parentElement;
          const rf = caixaF ? caixaF.getBoundingClientRect() : null;
          const sobre = rf && [...it.querySelectorAll("*")].find((e) => !e.children.length && e.textContent.trim() === cod && vis(e) && (() => {
            const x = e.getBoundingClientRect();
            return x.left >= rf.left - 1 && x.right <= rf.right + 1 && x.top >= rf.top - 1 && x.bottom <= rf.bottom + 1 && (x.left + x.right) / 2 > (rf.left + rf.right) / 2 && (x.top + x.bottom) / 2 > (rf.top + rf.bottom) / 2;
          })());
          if (!sobre) prob.push(`${cod}: o código não aparece sobre a foto, no canto inferior direito`);
          else if (sobre.closest("a, button, [role=button], [role=link]")) prob.push(`${cod}: a etiqueta do código sobre a foto está dentro de ${sobre.closest("a, button, [role=button], [role=link]").tagName.toLowerCase()} (pedido: não é botão nem link)`);
          const ln = T.linkDe(it);
          const rot = ln ? ((ln.getAttribute("aria-label") || "") + " " + ln.textContent) : "";
          if (!ln) prob.push(`${cod}: sem o link do título do cartão`);
          else if (!rot.includes(cod)) prob.push(`${cod}: o rótulo do link do cartão não tem o código ("${rot.replace(/\s+/g, " ").trim().slice(0, 40)}")`);
          const img = it.querySelector(".foto img, img");
          if (img && !img.closest(".sem-foto") && !(img.getAttribute("alt") || "").includes(cod)) prob.push(`${cod}: o alt da foto não tem o código ("${img.getAttribute("alt")}")`);
          if (!T.detalhesDe(it)) prob.push(`${cod}: sem o "+ Detalhes"`);
          const refs = it.querySelector(".refs");
          if (refs) {
            const vistas = [...refs.querySelectorAll(".ref")].filter((e) => vis(e) && !/^\+\d+$/.test(e.textContent.trim()));
            maxRefs = Math.max(maxRefs, vistas.length);
            if (vistas.length > 2) prob.push(`${cod}: ${vistas.length} etiquetas de referência cruzada à vista (pedido: no máximo 2)`);
            if (!/Ref\.\s*Cruzada:/i.test(refs.textContent)) prob.push(`${cod}: as referências sem o rótulo "Ref. Cruzada:"`);
            if ([...refs.querySelectorAll(".ref")].some((e) => vis(e) && /^\+\d+$/.test(e.textContent.trim()))) comMais++;
          }
        }
        // R-20261120-124800: todos os cartões da 1ª e da 2ª linha com a MESMA altura (1 px) e o "+ Detalhes" no mesmo y
        // relativo ao topo do cartão
        const tops = [...new Set(itens.map((e) => Math.round(e.getBoundingClientRect().top)))].sort((a, b) => a - b);
        const duas = itens.filter((e) => { const t = e.getBoundingClientRect().top; return tops.slice(0, 2).some((x) => Math.abs(t - x) < 4); });
        const alts = duas.map((e) => e.getBoundingClientRect().height);
        const dets = duas.map((e) => { const d = T.detalhesDe(e); return d ? d.getBoundingClientRect().top - e.getBoundingClientRect().top : NaN; });
        const faixaDe = (l) => (l.length ? Math.max(...l) - Math.min(...l) : 0);
        const altura = { n: duas.length, min: Math.round(Math.min(...alts)), max: Math.round(Math.max(...alts)), dif: faixaDe(alts), difDet: dets.some(Number.isNaN) ? -1 : faixaDe(dets),
          maior: duas.length ? T.codDe(duas[alts.indexOf(Math.max(...alts))]) : "", menor: duas.length ? T.codDe(duas[alts.indexOf(Math.min(...alts))]) : "" };
        return { n: itens.length, linha1, altura, pequenos: [...new Set(pequenos)].slice(0, 6), nPeq: pequenos.length, foto: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : "?", larg: Math.round(itens[0].getBoundingClientRect().width),
          prob, maxRefs, comMais, vistos: Math.min(24, itens.length) };
      });
      if (tela === "campos") {
        await abrir("cartoes", "#/busca?q=" + encodeURIComponent(QF));
        for (const [w, h] of larg === 1366 ? [[1366, 768], [1536, 864], [1920, 1080]] : [[larg, alt]]) {
          if (w !== larg) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400); }
          const m = await medirCartoes();
          if (!m.n) falha("cartoes", N_CART, `vazio:${w}`, `${w} px: "${QF}" sem cartões na lista`);
          else {
            // R-20261120-140900 (fA2): 4 por linha no computador (eram 5), cartão maior; 5 a partir de 1680 px (1920) e 2 no
            // celular (menos só se a lista tiver menos); 5 em 1366 ou 1536 é falha
            const quer = w >= 1680 ? 5 : w > 640 ? 4 : 2;
            if (m.linha1 !== Math.min(quer, m.n)) falha("cartoes", N_CART, `linha:${w}`, `${w} px: "${QF}" mostra ${m.linha1} cartão(ões) na 1ª linha (pedido: ${quer}; cartão de ${m.larg} px)`);
            const A = m.altura;
            if (A.dif > 1) falha("cartoes", N_CART, `altura:${w}`, `${w} px: os ${A.n} cartões da 1ª e 2ª linha não têm a mesma altura: de ${A.min} px (${A.menor}) a ${A.max} px (${A.maior})`);
            if (A.difDet < 0) falha("cartoes", N_CART, `altura:detalhes:${w}`, `${w} px: cartão da 1ª ou 2ª linha sem o "+ Detalhes"`);
            else if (A.difDet > 1) falha("cartoes", N_CART, `altura:detalhes:${w}`, `${w} px: o "+ Detalhes" não fica no mesmo y nos cartões da 1ª e 2ª linha (diferença de ${Math.round(A.difDet)} px)`);
            for (const t of m.prob.slice(0, 25)) falha("cartoes", N_CART, `cartao:${w}:${t.split(":")[0]}`, `${w} px: ${t}`);
            if (m.prob.length > 25) falha("cartoes", N_CART, `cartao:${w}:mais`, `${w} px: … e mais ${m.prob.length - 25} problema(s) de cartão`);
          }
          if (m.nPeq) falha("cartoes", N_CART, `fonte:${w}`, `${w} px: ${m.nPeq} texto(s) do cartão abaixo de 12 px, ex.: ${m.pequenos.join("; ")}`);
          if (w === 390) { const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > 390) falha("largura", "390 px sem rolar de lado", "cartoes", `cartões: scrollWidth = ${sw}`); }
          CARTOES.push(`${w} px: ${m.linha1} na 1ª linha (cartão ${m.larg} × ${m.altura.max} px, ${m.altura.n} da 1ª e 2ª linha com a mesma altura, foto ${m.foto}; até ${m.maxRefs} ref. à vista, ${m.comMais} de ${m.vistos} com "+N")`);
          await page.screenshot({ path: path.join(dirPrints, `cartoes-${w}.png`) });
          if (w !== larg) { await page.setViewportSize({ width: larg, height: alt }); await page.waitForTimeout(300); }
        }
        conferirConsole("cartoes");
      }

      // ---- "Meu veículo" (T-0014 modelo B, R-20261120-123630 e 123800; só na tela nova): a faixa logo abaixo do quadro da
      // busca com as 4 listas em cascata Marca › Modelo › Ano › Motor/Versão e o "Trocar veículo"; sem chave liga/desliga;
      // sem o menu "Departamentos"; o "Limpar tudo" não tira o veículo ----
      const N_MV = "meu veículo";
      const etiquetasTela = () => page.evaluate(() => window.__bapT.etiquetas().map((b) => b.getAttribute("aria-label")));
      if (tela === "campos") {
        // a cascata com o caso do veículo falso da placa (Volkswagen › Gol › 2018 › 1.6) em #/busca (todos os produtos);
        // com o termo "amortecedor", cada escolha tem de deixar opções na lista seguinte
        await abrir("meu-veiculo", "#/busca");
        const mv = () => page.evaluate(() => {
          const T = window.__bapT, { listas, faixa } = T.veiculo();
          const q = T.quadro(), it = document.querySelector(".lista .item");
          const r = (e) => (e ? e.getBoundingClientRect() : null);
          const trocar = faixa && [...faixa.querySelectorAll("button")].find((b) => T.visivel(b) && /Trocar ve[ií]culo/i.test(b.textContent));
          const meuVei = !!faixa && /Meu ve[ií]culo/i.test(faixa.innerText); // R-20261120-124800: sai o "Meu veículo"
          return { n: listas.filter(Boolean).length, nomes: T.veiculo().rotulos,
            nOp: listas.map((l) => (l ? [...l.options].filter((o) => o.value).length : 0)),
            ordem: listas.every((l, i) => !l || i === 0 || !listas[i - 1] || !!(listas[i - 1].compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING)),
            val: listas.map((l) => (l ? l.value : "")), off: listas.map((l) => !!(l && l.disabled)), vis: listas.map((l) => T.visivel(l)),
            faixa: !!faixa, fTop: faixa ? r(faixa).top : 0, fBot: faixa ? r(faixa).bottom : 0, qBot: r(q).bottom, cTop: it ? r(it).top : 0,
            meuVei, chave: faixa ? faixa.querySelectorAll('[role="switch"], input[type="checkbox"], button[aria-pressed]').length : 0, trocar: !!trocar,
            dep: /Departamentos?\b/i.test(document.body.innerText), total: parseInt(((document.querySelector(".total") || {}).textContent || "").replace(/\D/g, ""), 10) || 0 };
        });
        // no celular as listas podem vir recolhidas atrás de um botão da faixa ("Escolher veículo"): abre antes de escolher
        const abrirListas = async () => {
          if ((await mv()).vis[0]) return;
          const hb = (await page.evaluateHandle(() => { const f = window.__bapT.veiculo().faixa; return f ? [...f.querySelectorAll('button[aria-expanded="false"]')].find((b) => window.__bapT.visivel(b)) || null : null; })).asElement();
          if (hb) { await hb.click(); await page.waitForTimeout(200); }
        };
        const escolher = async (i, rx) => {
          await abrirListas();
          const h = (await page.evaluateHandle((j) => window.__bapT.veiculo().listas[j] || null, i)).asElement();
          if (!h) return "";
          const valor = await h.evaluate((s, fonte) => { const o = [...s.options].find((x) => x.value && new RegExp(fonte, "i").test(x.textContent)); return o ? o.value : ""; }, rx.source);
          if (!valor) return "";
          const t0 = await totalTela();
          await h.selectOption(valor);
          await page.waitForFunction((t) => (parseInt(((document.querySelector(".total") || {}).textContent || "").replace(/\D/g, ""), 10) || 0) !== t, t0, { timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(250);
          return valor;
        };
        const m0 = await mv();
        const NOMES_MV = ["Marca", "Modelo", "Ano", "Motor", "Versão"];
        if (!m0.faixa || m0.n !== 5) falha("meuveiculo", N_MV, "listas", `${L}: a faixa do veículo tem ${m0.n} de 5 listas (${NOMES_MV.filter((_, i) => !m0.nomes[i]).join(", ") || "-"} faltando)`);
        else {
          if (!m0.ordem) falha("meuveiculo", N_MV, "ordem", `${L}: as listas fora da ordem Marca › Modelo › Ano › Motor › Versão (${m0.nomes.join(" › ")})`);
          if (!(m0.fTop >= m0.qBot - 1)) falha("meuveiculo", N_MV, "abaixo", `${L}: a faixa do veículo (y=${Math.round(m0.fTop)}) não fica abaixo do quadro da busca (termina em y=${Math.round(m0.qBot)})`);
          if (m0.cTop && !(m0.fBot <= m0.cTop + 1)) falha("meuveiculo", N_MV, "antes-cartoes", `${L}: a faixa do veículo (termina em y=${Math.round(m0.fBot)}) passa do 1º cartão (y=${Math.round(m0.cTop)})`);
          if (m0.chave) falha("meuveiculo", N_MV, "chave", `${L}: a faixa do veículo tem ${m0.chave} chave(s) liga/desliga (R-20261120-123630: tirar)`);
          if (m0.val.some(Boolean)) falha("meuveiculo", N_MV, "inicio", `${L}: sem veículo escolhido, as listas vêm com "${m0.val.join(" › ")}"`);
          if (!(m0.off[1] && m0.off[2] && m0.off[3] && m0.off[4])) falha("meuveiculo", N_MV, "cascata:inicio", `${L}: sem a marca, as listas Modelo, Ano, Motor e Versão deviam estar desativadas (desativadas: ${NOMES_MV.filter((_, i) => m0.off[i]).join(", ") || "nenhuma"})`);
          if (m0.trocar) falha("meuveiculo", N_MV, "trocar", `${L}: a faixa ainda tem o "Trocar veículo" (R-20261120-124800: tirar; limpa pelo X da placa)`);
          if (m0.meuVei) falha("meuveiculo", N_MV, "meu-veiculo", `${L}: a faixa ainda mostra "Meu veículo" (R-20261120-124800: virou "Placa")`);
          // a cascata: Volkswagen › Gol › 2018 › 1.6; cada escolha libera a lista seguinte e não aumenta a lista
          // a Versão (lista nova, R-20261120-124800) fica com a 1ª opção que houver; [SUPOSIÇÃO] sem opção de versão para o
          // veículo, a lista pode ficar vazia (vira aviso, não falha)
          const passos = [[0, /^\s*Volkswagen\b/], [1, /^\s*Gol\b/], [2, /^\s*2018\b/], [3, /^\s*1[.,]6\b/], [4, /./]];
          let antes = m0.total, cadeia = [];
          for (const [i, rx] of passos) {
            if (i === 4 && !(await mv()).nOp[4]) { aviso("meuveiculo", N_MV, `${L}: com ${cadeia.join(" › ")}, a lista Versão não tem opção`); break; }
            const val = await escolher(i, rx);
            if (!val) { falha("meuveiculo", N_MV, "opcao:" + NOMES_MV[i], `${L}: a lista ${NOMES_MV[i]} não tem a opção ${rx.source.replace(/\\[sb]|[\^*]/g, "")} (depois de ${cadeia.join(" › ") || "nada"})`); break; }
            const m = await mv();
            cadeia.push(val);
            if (m.val[i] !== val) falha("meuveiculo", N_MV, "valor:" + NOMES_MV[i], `${L}: escolhi "${val}" em ${NOMES_MV[i]}, a lista ficou com "${m.val[i]}"`);
            if (i < 4 && m.off[i + 1] && (i < 3 || m.nOp[4])) falha("meuveiculo", N_MV, "cascata:" + NOMES_MV[i + 1], `${L}: com ${cadeia.join(" › ")}, a lista ${NOMES_MV[i + 1]} continua desativada`);
            // a cascata uma de cada vez vale de Marca a Motor; a Versão (lista nova, R-20261120-124800) pode abrir junto com o
            // Motor, depois do Ano [SUPOSIÇÃO: o pedido diz a posição, "logo depois do motor", não que ela espere o Motor]
            if (i < 2 && !m.off[i + 2]) falha("meuveiculo", N_MV, "cascata:" + NOMES_MV[i + 2] + ":cedo", `${L}: com ${cadeia.join(" › ")}, a lista ${NOMES_MV[i + 2]} já está ativa (cascata: uma de cada vez)`);
            if (!m.total) falha("meuveiculo", N_MV, "vazio:" + NOMES_MV[i], `${L}: com ${cadeia.join(" › ")}: lista vazia`);
            else if (m.total > antes) falha("meuveiculo", N_MV, "aumentou:" + NOMES_MV[i], `${L}: com ${cadeia.join(" › ")}: ${m.total} produtos, mais que antes (${antes})`);
            if (m.trocar) falha("meuveiculo", N_MV, "trocar", `${L}: a faixa ainda tem o "Trocar veículo" (R-20261120-124800: tirar; limpa pelo X da placa)`);
            antes = m.total;
          }
          const m4 = await mv();
          if (m4.chave) falha("meuveiculo", N_MV, "chave", `${L}: a faixa do veículo tem ${m4.chave} chave(s) liga/desliga (R-20261120-123630: tirar)`);
          await page.evaluate(() => window.scrollTo(0, 0));
          await print("meu-veiculo");
          MV.push(`${L}: ${m0.nomes.join(" › ")}; todos os produtos ${m0.total} → ${cadeia.join(" › ")} = ${m4.total}`);
          // "Limpar tudo" (R-20261120-123630): tira o termo e os filtros, não o veículo
          if (cadeia.length && FILTRO_SI_CASO) {
            const h = await page.evaluate(() => location.hash);
            await abrir("meu-veiculo-limpar", h + (h.includes("?") ? "&" : "?") + "q=" + encodeURIComponent(QF) + "&si=" + encodeURIComponent(FILTRO_SI_CASO));
            const hl = (await page.evaluateHandle(() => [...document.querySelectorAll("#app button")].find((b) => window.__bapT.visivel(b) && /^Limpar tudo$/i.test(b.textContent.trim())) || null)).asElement();
            if (!hl) falha("meuveiculo", N_MV, "limpar:botao", `${L}: com o termo, um filtro e o veículo, sem o botão "Limpar tudo"`);
            else {
              await hl.click();
              await page.waitForTimeout(500);
              const ml = await mv(), hz = await page.evaluate(() => decodeURIComponent(location.hash));
              if (ml.val.join("|") !== m4.val.join("|")) falha("meuveiculo", N_MV, "limpar:veiculo", `${L}: o "Limpar tudo" mexeu no veículo: "${m4.val.join(" › ")}" → "${ml.val.join(" › ")}"`);
              if (/[?&](q|si)=/.test(hz) || (await etiquetasTela()).length) falha("meuveiculo", N_MV, "limpar:filtros", `${L}: depois do "Limpar tudo" ficaram o termo ou o filtro (endereço "${hz}"; etiquetas: ${(await etiquetasTela()).join(" | ") || "nenhuma"})`);
              MV.push(`${L}: "Limpar tudo" tirou o termo e o filtro e ficou ${ml.val.filter(Boolean).join(" › ")}`);
            }
          }
        }
        if (m0.faixa && m0.n === 5) {
          await abrir("meu-veiculo-termo", "#/busca?q=" + encodeURIComponent(QF));
          const cad = [];
          for (let i = 0; i < 5; i++) {
            const m = await mv();
            if (i === 4 && !m.nOp[i]) { aviso("meuveiculo", N_MV, `${L}: "${QF}" com ${cad.join(" › ")}: a lista Versão não tem opção`); break; }
            if (!m.nOp[i]) { falha("meuveiculo", N_MV, "termo:vazia:" + NOMES_MV[i], `${L}: "${QF}" (${m.total} produtos)${cad.length ? " com " + cad.join(" › ") : ""}: a lista ${NOMES_MV[i]} não tem nenhuma opção (a cascata para aqui)`); break; }
            // com o termo, Volkswagen › Gol (o caso da placa); Ano, Motor e Versão: a 1ª opção
            const val = await escolher(i, [/^\s*Volkswagen\b/i, /^\s*Gol\b/i][i] || /./);
            if (!val) { falha("meuveiculo", N_MV, "termo:opcao:" + NOMES_MV[i], `${L}: "${QF}"${cad.length ? " com " + cad.join(" › ") : ""}: a lista ${NOMES_MV[i]} não tem ${i === 0 ? "Volkswagen" : "Gol"} (opções: ${(await page.evaluate((j) => [...(window.__bapT.veiculo().listas[j] || { options: [] }).options].filter((o) => o.value).map((o) => o.textContent.trim()).slice(0, 8).join(", "), i)) || "nenhuma"})`); break; }
            cad.push(val);
          }
          if (cad.length >= 4) MV.push(`${L}: "${QF}" → ${cad.join(" › ")} = ${(await mv()).total}`);
          conferirConsole("meu-veiculo-termo");
        }
        // T-0040 (a Fraga soma): pelas listas, CXD13062 aparece em Volkswagen › Gol › 2015 (Gol de 2008 a 2022 no "ve");
        // BCE3001 continua em Ford › Ka (linha sem ano) e não aparece em Volkswagen › Polo › 2026 (Polo sem ano, T-0033);
        // VEL7507 tem Yamaha e KTM: aparece em Yamaha › RD e a tabela da aplicação tem as duas marcas. Só com ano no "ve"
        // (base com a Fraga). As listas mostram as 60 marcas com mais produtos: marca de caso fora delas vira aviso
        const N_VT = "veículo com ano (Fraga, T-0040)";
        if (m0.faixa && m0.n === 5 && VT.n) {
          const casosVt = [
            ["CXD13062", [/^\s*Volkswagen\b/i, /^\s*Gol\b/i, /^\s*2015\b/], true],
            ["BCE3001", [/^\s*Ford\b/i, /^\s*Ka\b/i], true],
            ["BCE3001", [/^\s*Volkswagen\b/i, /^\s*Polo\s*(\(|$)/i, /^\s*2026\b/], false],
            ["VEL7507", [/^\s*Yamaha\b/i, /^\s*RD\b/i], true],
          ];
          for (const [cod, passosVt, deve] of casosVt) {
            const nomeCaso = `${cod} ${deve ? "em" : "fora de"} ${passosVt.map((x) => x.source.replace(/\\[sb]|\(\\\(\|\$\)|[\^*$]/g, "")).join(" › ")}`;
            if (!porCod.get(normCod(cod))?.ve) { falha("fraga", N_VT, "caso:" + cod, `o caso ${cod} não tem mais "ve" no JSON: escolher outro no scripts/testar_site.mjs`); continue; }
            await abrir("fraga-faixa", "#/busca");
            const cad = [];
            for (let i = 0; i < passosVt.length; i++) {
              const val = await escolher(i, passosVt[i]);
              if (!val) { falha("fraga", N_VT, "opcao:" + nomeCaso, `${L}: ${nomeCaso}: a lista ${NOMES_MV[i]} não tem a opção (depois de ${cad.join(" › ") || "nada"})`); break; }
              cad.push(val);
            }
            if (cad.length !== passosVt.length) continue;
            const r = await listaTodos(), tem = r.itens.some((it) => normCod(it.c) === normCod(cod));
            if (tem !== deve) falha("fraga", N_VT, "faixa:" + nomeCaso, `${L}: ${cad.join(" › ")} (${r.itens.length} produtos): o ${cod} ${tem ? "aparece (não devia)" : "não aparece (devia)"}`);
            VT.txt.push(`${L}: ${cad.join(" › ")} = ${r.itens.length}, ${cod} ${tem ? "aparece" : "não aparece"}`);
            conferirConsole("fraga-faixa");
          }
          // VEL7507: Yamaha e KTM na tabela da aplicação (1ª coluna, Marca) da página do produto
          if (porCod.get(normCod("VEL7507"))?.ve) {
            const quer = ["YAMAHA", "KTM"];
            const noVe = quer.filter((m) => !porCod.get(normCod("VEL7507")).ve.some((x) => norm(x[0]) === m));
            if (noVe.length) falha("fraga", N_VT, "VEL7507:ve", `VEL7507 sem ${noVe.join(" e ")} no "ve" do JSON`);
            await abrir("fraga-vel7507", "#/produto/VEL7507");
            // a tabela de veículos (computador) ou a lista que a troca no celular: o que estiver à vista
            const txtTab = await page.evaluate(() => [...document.querySelectorAll("#app table, #app ul, #app ol")]
              .filter((t) => window.__bapT.visivel(t) && /veic/i.test(t.className)).map((t) => t.innerText).join(" "));
            const faltaTab = quer.filter((m) => !palavraInteira(txtTab, m));
            if (!txtTab) falha("fraga", N_VT, "VEL7507:tabela", `${L}: a página do VEL7507 não mostra a tabela (ou a lista) de veículos`);
            else if (faltaTab.length) falha("fraga", N_VT, "VEL7507:tabela", `${L}: a tabela da aplicação do VEL7507 não tem ${faltaTab.join(" e ")}: ${cortar(txtTab, 80)}`);
            const naLista = await page.evaluate(async () => { location.hash = "#/busca"; await new Promise((r) => setTimeout(r, 400)); const s = window.__bapT.veiculo().listas[0]; return s ? [...s.options].map((o) => o.value) : []; });
            if (!naLista.map(norm).includes("KTM")) aviso("fraga", N_VT, `${L}: a lista Marca não oferece a KTM (só as 60 marcas com mais produtos): o VEL7507 não é achado por KTM › EXC 250 nas listas`);
            VT.txt.push(`${L}: VEL7507 com ${quer.filter((m) => !faltaTab.includes(m)).join(" e ") || "nenhuma das marcas"} na aplicação`);
            conferirConsole("fraga-vel7507");
          }
        }
        if (m0.dep) falha("meuveiculo", N_MV, "departamentos", `${L}: a tela da busca ainda mostra "Departamentos" (R-20261120-123630: excluir)`);
        conferirConsole("meu-veiculo");
      }

      // ---- filtros: coluna à esquerda (computador) e botão "Filtrar (n)" com painel (celular); "barra" é a de antes e falha ----
      const N_FIL = "filtros da busca";
      await abrir("filtros", "#/busca?q=" + encodeURIComponent(QF));
      // modelo B (R-20261120-123800): "coluna" fina à esquerda dos cartões no computador (grupos sempre abertos) e
      // "painel" no celular (botão "Filtrar (n)" que abre por cima); o link com si=, marcar, etiqueta "Tirar" e o "x"
      const botaoFiltrar = () => page.evaluate(() => { const b = [...document.querySelectorAll("#app button")].find((x) => window.__bapT.visivel(x) && /^Filtrar\b/i.test(x.textContent.trim())); return b ? b.textContent.replace(/\s+/g, " ").trim() : ""; });
      // o painel dos filtros no celular (tipoFiltro "painel"): abre pelo botão "Filtrar"; id e nome: o teste que leva a falha
      const painelAberto = () => page.evaluate(() => !!document.querySelector("dialog[open]"));
      const abrirPainel = async (id, nome) => {
        if (tipoFiltro !== "painel" || (await painelAberto())) return;
        const hb = (await page.evaluateHandle(() => [...document.querySelectorAll("#app button")].find((x) => window.__bapT.visivel(x) && /^Filtrar\b/i.test(x.textContent.trim())) || null)).asElement();
        if (hb) await hb.click(); else falha(id, nome, "painel:botao", `${L}: sem o botão "Filtrar"`);
        await page.waitForTimeout(250);
        if (!(await painelAberto())) falha(id, nome, "painel:abrir", `${L}: o botão "Filtrar" não abriu o painel`);
      };
      const tipoFiltro = await page.evaluate(() => {
        const T = window.__bapT;
        const g = T.grupos();
        if (g.length) return g.every((b) => b.getAttribute("aria-expanded") === "true") ? "coluna" : "barra";
        return [...document.querySelectorAll("#app button")].some((x) => T.visivel(x) && /^Filtrar\b/i.test(x.textContent.trim())) ? "painel" : "?";
      });
      FILTROS.add(`${tipoFiltro} (${larg})`);
      if (tipoFiltro === "?") falha("filtros", N_FIL, "?", `${L}: não achei os filtros (nem a coluna com Sistema, Família, Linha ou Categoria, nem o botão "Filtrar")`);
      if (tela === "campos" && tipoFiltro !== "?" && tipoFiltro !== (larg >= 1000 ? "coluna" : "painel"))
        falha("filtros", N_FIL, "tipo", `${L}: os filtros estão em "${tipoFiltro}" (pedido: ${larg >= 1000 ? "coluna fina à esquerda dos cartões, com os grupos abertos" : 'botão "Filtrar (n)" que abre o painel'})`);
      // a coluna à esquerda dos cartões, de cima a baixo (x da coluna < x do 1º cartão; lado a lado), em 1366 e 1536
      if (tipoFiltro === "coluna") {
        const COLUNA = [];
        for (const [w, h] of larg === 1366 ? [[1366, 768], [1536, 864]] : [[larg, alt]]) {
          if (w !== larg) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400); }
          const c = await page.evaluate(() => {
            const g = window.__bapT.grupos();
            const col = g[0] && (g[0].closest("aside") || g[0].parentElement.parentElement);
            const it = document.querySelector(".lista .item");
            if (!col || !it) return null;
            const a = col.getBoundingClientRect(), b = it.getBoundingClientRect(), l = document.querySelector(".lista").getBoundingClientRect();
            return { x: Math.round(a.left), r: Math.round(a.right), w: Math.round(a.width), t: Math.round(a.top), cx: Math.round(b.left), ct: Math.round(b.top), cb: Math.round(b.bottom), lr: Math.round(l.right), todos: g.every((x) => col.contains(x)) };
          });
          if (!c) { falha("filtros", N_FIL, `coluna:${w}`, `${w} px: não achei a coluna dos filtros ou o 1º cartão`); continue; }
          if (!(c.x < c.cx && c.r <= c.cx + 1)) falha("filtros", N_FIL, `coluna:esquerda:${w}`, `${w} px: a coluna dos filtros (x=${c.x}..${c.r}) não fica à esquerda do 1º cartão (x=${c.cx})`);
          if (!(c.t < c.cb)) falha("filtros", N_FIL, `coluna:lado:${w}`, `${w} px: a coluna dos filtros começa em y=${c.t}, abaixo do 1º cartão (y=${c.ct}..${c.cb}): não fica ao lado dos produtos`);
          if (!c.todos) falha("filtros", N_FIL, `coluna:grupos:${w}`, `${w} px: os grupos Sistema, Família, Linha e Categoria não estão todos na mesma coluna`);
          // [SUPOSIÇÃO] "coluna fina": no máximo 1/4 da largura da tela
          if (c.w > w / 4) falha("filtros", N_FIL, `coluna:fina:${w}`, `${w} px: a coluna dos filtros tem ${c.w} px (mais de 1/4 da tela)`);
          COLUNA.push(`${w} px: coluna x=${c.x}..${c.r} (${c.w} px), 1º cartão x=${c.cx}`);
          if (w !== larg) { await page.setViewportSize({ width: larg, height: alt }); await page.waitForTimeout(300); }
        }
        FILTRO_SI.coluna = COLUNA.join("; ");
      }
      if (tipoFiltro === "painel") FILTRO_SI.painel = `${L}: botão "${await botaoFiltrar()}"`;
      // R-20261120-130300: a coluna de filtros aparece SEMPRE, mesmo com 1 opção só em cada grupo (1366 e 1536), e o
      // "Filtrar" sempre à vista no celular. Caso: "CXD13062" (1 produto: cada grupo com 1 opção)
      if (tela === "campos" && pCod) {
        const gruposProd = ["si", "fa", "li", "ca"].filter((k) => pCod[k]).length;
        await abrir("filtros-um", "#/busca?q=" + encodeURIComponent(COD));
        const UM = [];
        for (const [w, h] of larg === 1366 ? [[1366, 768], [1536, 864]] : [[larg, alt]]) {
          if (w !== larg) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400); }
          const c = await page.evaluate(() => {
            const T = window.__bapT, g = T.grupos(), it = document.querySelector(".lista .item");
            const col = g[0] && (g[0].closest("aside") || g[0].parentElement.parentElement);
            const fil = [...document.querySelectorAll("#app button")].find((x) => T.visivel(x) && /^Filtrar\b/i.test(x.textContent.trim()));
            return { g: g.length, esq: !!(col && it && col.getBoundingClientRect().right <= it.getBoundingClientRect().left + 1), filtrar: fil ? fil.textContent.replace(/\s+/g, " ").trim() : "", itens: document.querySelectorAll(".lista .item").length };
          });
          if (w >= 1000) {
            if (c.g < gruposProd) falha("filtros", N_FIL, `sempre:${w}`, `${w} px: "${COD}" (${c.itens} produto) mostra ${c.g} de ${gruposProd} grupo(s) de filtro (pedido: a coluna sempre, mesmo com 1 opção)`);
            else if (!c.esq) falha("filtros", N_FIL, `sempre:esquerda:${w}`, `${w} px: "${COD}": a coluna de filtros não fica à esquerda do cartão`);
            UM.push(`${w} px: ${c.g} grupos`);
          } else {
            if (!c.filtrar) falha("filtros", N_FIL, `sempre:${w}`, `${w} px: "${COD}" (${c.itens} produto) sem o botão "Filtrar" à vista (pedido: sempre)`);
            UM.push(`${w} px: botão "${c.filtrar}"`);
          }
          if (w !== larg) { await page.setViewportSize({ width: larg, height: alt }); await page.waitForTimeout(300); }
        }
        FILTRO_SI.sempre = [FILTRO_SI.sempre, ...UM].filter(Boolean).join(", ");
        conferirConsole("filtros-um");
        await abrir("filtros", "#/busca?q=" + encodeURIComponent(QF)); // volta ao caso dos filtros
      }
      const total0 = await totalTela();
      const siCaso = FILTRO_SI_CASO;
      if (siCaso) {
        await abrir("filtro-si", `#/busca?q=${encodeURIComponent(QF)}&si=${encodeURIComponent(siCaso)}`);
        const r = await listaTodos();
        const fora = r.itens.filter((it) => norm(porCod.get(normCod(it.c))?.si) !== norm(siCaso)).map((it) => it.c);
        if (!r.itens.length) falha("filtros", N_FIL, "si:vazio", `${L}: link "${QF}" com si=${siCaso}: lista vazia`);
        if (fora.length) falha("filtros", N_FIL, "si:fora", `${L}: link "${QF}" com si=${siCaso}: ${fora.length} de outro sistema (ex.: ${fora.slice(0, 5).join(", ")})`);
        if (r.itens.length > total0) falha("filtros", N_FIL, "si:maior", `${L}: link com si=${siCaso} = ${r.itens.length}, mais que "${QF}" sem filtro (${total0})`);
        if (["coluna", "painel"].includes(tipoFiltro)) {
          const etq = await etiquetasTela();
          if (!etq.some((t) => norm(t).includes(norm(siCaso)))) falha("filtros", N_FIL, "si:etiqueta", `${L}: link com si=${siCaso} sem a etiqueta "Tirar ..." do filtro (etiquetas: ${etq.join(" | ") || "nenhuma"})`);
        }
        FILTRO_SI.n = r.itens.length; FILTRO_SI.si = siCaso;
        conferirConsole("filtro-si");
      }
      if (["coluna", "painel"].includes(tipoFiltro)) {
        await abrir("filtros", "#/busca?q=" + encodeURIComponent(QF));
        await abrirPainel("filtros", N_FIL);
        const CAMPO_GRUPO = { SISTEMA: "si", FAMILIA: "fa", LINHA: "li", CATEGORIA: "ca" };
        const grupos = await page.evaluate(() => window.__bapT.grupos().map((b) => b.textContent.replace(/[▾▴▼▲]/g, "").replace(/\s+/g, " ").trim()));
        const pegar = async (fn, i) => (await page.evaluateHandle(fn, i)).asElement();
        const clicarGrupo = async (i) => {
          if ((await page.evaluate((j) => (window.__bapT.grupos()[j] || {}).getAttribute?.("aria-expanded") === "true", i))) return; // já aberto
          const h = await pegar((j) => window.__bapT.grupos()[j] || null, i); if (h) await h.click({ timeout: 5000 });
        };
        const estado = (i) => page.evaluate((j) => { const b = window.__bapT.grupos()[j]; return { exp: b ? b.getAttribute("aria-expanded") : "", ops: window.__bapT.opcoes(j).map((l) => l.innerText.replace(/\s+/g, " ").trim()) }; }, i);
        let marcou = null;
        for (let gi = 0; gi < grupos.length && !marcou; gi++) {
          const k = CAMPO_GRUPO[norm(grupos[gi]).split(" ")[0]];
          await clicarGrupo(gi);
          await page.waitForTimeout(150);
          const e1 = await estado(gi);
          if (e1.exp !== "true" || !e1.ops.length) { falha("filtros", N_FIL, "abrir:" + grupos[gi], `${L}: o botão "${grupos[gi]}" não abriu a lista (aria-expanded="${e1.exp}", ${e1.ops.length} opção(ões) à vista)`); continue; }
          const ops = (await estado(gi)).ops.map((t, i) => { const m = t.match(/^(.*?)\s*\(?(\d[\d.]*)\)?$/); return { i, nome: m ? m[1].trim() : t, n: m ? parseInt(m[2].replace(/\./g, ""), 10) : null }; });
          const op = ops.find((o) => o.n && o.n < total0);
          if (gi === 0) await print("filtro-aberto");
          if (!op) continue;
          marcou = { grupo: grupos[gi], ...op };
          const hOp = await pegar(([g, j]) => window.__bapT.opcoes(g)[j] || null, [gi, op.i]);
          await hOp.click({ timeout: 5000 });
          await page.waitForFunction((t) => (parseInt(((document.querySelector(".total") || {}).textContent || "").replace(/\D/g, ""), 10) || 0) !== t, total0, { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(200);
          const total1 = await totalTela();
          marcou.total1 = total1;
          if (!(total1 > 0 && total1 < total0)) falha("filtros", N_FIL, "marcar", `${L}: marcar "${op.nome}" (${grupos[gi]}) não reduziu a lista: ${total0} → ${total1}`);
          else if (op.n !== total1) falha("filtros", N_FIL, "contagem", `${L}: "${op.nome}" (${grupos[gi]}) dizia ${op.n}, a lista ficou com ${total1}`);
          await page.evaluate(() => window.scrollTo(0, 0));
          await print("filtro-marcado");
          // R-20261120-115432: o número de marcados fica na mesma linha do nome do filtro (no mesmo texto ou com o centro
          // na mesma altura)
          const linha = await page.evaluate((j) => {
            const b = window.__bapT.grupos()[j];
            if (!b) return null;
            const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
            let nome = null, num = null;
            for (let n; (n = w.nextNode());) {
              const t = n.textContent.trim();
              if (!t || n.parentElement.closest("[aria-hidden=true]")) continue;
              if (!nome && /[A-Za-zÀ-ú]{3,}/.test(t)) { nome = n; if (/\d/.test(t)) num = n; }
              else if (!num && /^\(?\d+\)?$/.test(t)) num = n;
            }
            const caixa = (n) => { const g = document.createRange(); g.selectNodeContents(n); const x = g.getBoundingClientRect(); return { c: (x.top + x.bottom) / 2, h: x.height, linhas: g.getClientRects().length }; };
            if (!nome || !num) return { txt: b.textContent.replace(/\s+/g, " ").trim(), achou: false };
            const a = caixa(nome), c = caixa(num);
            return { txt: b.textContent.replace(/\s+/g, " ").trim(), achou: true, mesmoTexto: nome === num, linhasNome: a.linhas, ok: nome === num ? a.linhas === 1 : Math.abs(a.c - c.c) < Math.max(a.h, c.h) / 2 };
          }, gi);
          if (!linha || !linha.achou) falha("filtros", N_FIL, "numero", `${L}: o botão "${grupos[gi]}" com filtro marcado não mostra o número de marcados ("${linha ? linha.txt : "?"}")`);
          else if (!linha.ok) falha("filtros", N_FIL, "numero:linha", `${L}: no botão "${linha.txt}", o número não fica na mesma linha do nome`);
          if (tipoFiltro === "painel") { // fecha o painel (Esc) e o botão mostra o número de marcados: "Filtrar (1)"
            await page.keyboard.press("Escape");
            await page.waitForTimeout(200);
            if (await painelAberto()) falha("filtros", N_FIL, "painel:esc", `${L}: o Esc não fechou o painel dos filtros`);
            const tb = await botaoFiltrar();
            if (!/^Filtrar\s*\(1\)/i.test(tb)) falha("filtros", N_FIL, "painel:numero", `${L}: com 1 filtro marcado, o botão diz "${tb}" (esperado "Filtrar (1)")`);
          }
          const etq = await etiquetasTela();
          const minha = etq.findIndex((t) => norm(t).includes(norm(op.nome)));
          if (minha < 0) falha("filtros", N_FIL, "etiqueta", `${L}: marcar "${op.nome}" não criou a etiqueta "Tirar ${op.nome}" (etiquetas: ${etq.join(" | ") || "nenhuma"})`);
          if (k && total1 > 0) {
            const r = await listaTodos();
            const fora = r.itens.filter((it) => norm(porCod.get(normCod(it.c))?.[k]) !== norm(op.nome)).map((it) => it.c);
            if (fora.length) falha("filtros", N_FIL, "marcar:fora", `${L}: com "${op.nome}" (${grupos[gi]}) marcado, ${fora.length} produto(s) de fora (ex.: ${fora.slice(0, 5).join(", ")})`);
          }
          if (minha >= 0) {
            await page.keyboard.press("Escape"); // fecha a lista aberta, para não cobrir a etiqueta
            await page.waitForTimeout(100);
            const hx = await pegar((j) => window.__bapT.etiquetas()[j] || null, minha);
            const clicou = hx ? await hx.click({ timeout: 5000 }).then(() => true, () => false) : false;
            if (!clicou) falha("filtros", N_FIL, "tirar:clique", `${L}: não consegui clicar no "x" da etiqueta "${etq[minha]}"`);
            await page.waitForFunction((t) => (parseInt(((document.querySelector(".total") || {}).textContent || "").replace(/\D/g, ""), 10) || 0) === t, total0, { timeout: 5000 }).catch(() => {});
            await page.waitForTimeout(150);
            const total2 = await totalTela();
            if (total2 !== total0) falha("filtros", N_FIL, "tirar", `${L}: o "x" de "${etq[minha]}" não devolveu a lista: ${total1} → ${total2} (sem o filtro: ${total0})`);
            if ((await etiquetasTela()).some((t) => norm(t).includes(norm(op.nome)))) falha("filtros", N_FIL, "tirar:etiqueta", `${L}: a etiqueta "${etq[minha]}" ficou depois do "x"`);
          }
        }
        if (!grupos.length) falha("filtros", N_FIL, "grupos", `${L}: os filtros não têm os grupos Sistema, Família, Linha ou Categoria`);
        else if (!marcou) falha("filtros", N_FIL, "sem-opcao", `${L}: "${QF}" (${total0}): nenhum grupo abriu com uma opção que reduza a lista`);
        else FILTRO_SI.marcou = `${L}: "${marcou.nome}" (${marcou.grupo}) ${total0} → ${marcou.total1} e o "x" volta a ${total0}`;
        conferirConsole("filtros");
      }

      // ---- T-0006, fase 1: filtros de medida da bateria ("Amperagem" e "Partida a frio (CCA)"), ah= e cca= no endereço,
      // "60ah" na busca. Em 1366 px na coluna; em 390 px no painel do "Filtrar" ----
      if (tela === "campos") {
        const N_MED = "medida da bateria (T-0006)";
        const fecharPainel = async () => { if (await painelAberto()) { await page.keyboard.press("Escape"); await page.waitForTimeout(200); } };
        // os grupos à vista (grupos), na ordem da tela, com as opções à vista (opcoes: nome e contagem) e se há "Ver mais"
        const gruposTela = () => page.evaluate(() => window.__bapT.grupos().map((b, j) => ({
          nome: b.textContent.replace(/[▾▴▼▲]/g, "").replace(/\s+/g, " ").trim(),
          ops: window.__bapT.opcoes(j).map((l) => l.innerText.replace(/\s+/g, " ").trim()),
          verMais: [...(b.parentElement || b).querySelectorAll("a,button")].some((x) => x !== b && /ver\s+mais/i.test(x.textContent)),
        })));
        const opcao = (t) => { const m = t.match(/^(.*?)\s*\(?(\d[\d.]*)\)?$/); return { nome: m ? m[1].trim() : t, n: m ? parseInt(m[2].replace(/\./g, ""), 10) : null }; };
        const conferirLista = (rot, r, esperado) => {
          const got = r.itens.map((i) => i.c), falta = esperado.filter((c) => !got.includes(c)), sobra = got.filter((c) => !esperado.includes(c));
          if (falta.length || sobra.length || got.length !== esperado.length || r.proximos.trim())
            falha("medidas", N_MED, "lista:" + rot, `${L}: ${rot}: ${got.length} produto(s), esperado ${esperado.length}` + (r.proximos.trim() ? ` (o site mostrou "${cortar(r.proximos, 50)}")` : "") +
              (falta.length ? `; faltam ${falta.slice(0, 5).join(", ")}` : "") + (sobra.length ? `; sobram ${sobra.slice(0, 5).join(", ")}` : ""));
          return got.length;
        };
        const VIU = [];
        // 1) "bateria": os 2 grupos depois da Família, com as opções do JSON (em ordem) e as contagens; sem "Ver mais"
        await abrir("medida-bateria", "#/busca?q=bateria");
        const rBat = await listaTodos();
        const lista = rBat.itens.map((i) => porCod.get(normCod(i.c))).filter(Boolean);
        const contar = (f) => { const c = new Map(); for (const p of lista) { const v = f(medidaJson(p)); if (v != null) c.set(v, (c.get(v) || 0) + 1); } return [...c].sort((a, b) => a[0] - b[0]); };
        const quer = {
          Amperagem: contar((m) => m.ah).map(([v, n]) => [`${v} Ah`, n]),
          "Partida a frio (CCA)": contar((m) => m.cca).map(([i, n]) => [FAIXAS_CCA[i][1], n]),
        };
        if (!quer.Amperagem.length || !quer["Partida a frio (CCA)"].length)
          falha("medidas", N_MED, "json", `"bateria" (${lista.length} produtos): nenhuma bateria com "C20(ah)" ou "Cca-18°" inteiro no x do JSON (o rótulo da FICHA mudou?)`);
        await page.evaluate(() => window.scrollTo(0, 0));
        await abrirPainel("medidas", N_MED);
        const gs = await gruposTela();
        const nomes = gs.map((g) => g.nome.replace(/\s*\(\d+\)$/, ""));
        const iFam = nomes.findIndex((n) => /^Fam[ií]lia$/i.test(n));
        for (const [rot, ops] of Object.entries(quer)) {
          const i = nomes.indexOf(rot), g = gs[i];
          if (i < 0) { falha("medidas", N_MED, "grupo:" + rot, `${L}: "bateria": sem o grupo "${rot}" nos filtros (grupos: ${nomes.join(", ") || "nenhum"})`); continue; }
          if (iFam < 0 || i < iFam) falha("medidas", N_MED, "ordem:" + rot, `${L}: "bateria": o grupo "${rot}" não vem depois da Família (ordem: ${nomes.join(", ")})`);
          const opsTela = g.ops.map(opcao);
          const txtTela = opsTela.map((o) => `${o.nome} (${o.n})`).join(", "), txtQuer = ops.map(([n, q]) => `${n} (${q})`).join(", ");
          if (txtTela !== txtQuer) falha("medidas", N_MED, "opcoes:" + rot, `${L}: "bateria", "${rot}": ${opsTela.length} opção(ões) "${cortar(txtTela, 200)}"; esperado ${ops.length}, do menor ao maior: "${cortar(txtQuer, 200)}"`);
          if (g.verMais) falha("medidas", N_MED, "ver-mais:" + rot, `${L}: "bateria", "${rot}" tem "Ver mais" (aprovado: todas as opções à vista, R-20261123-122814)`);
          VIU.push(`"${rot}" ${opsTela.length} opções`);
        }
        const iAh = nomes.indexOf("Amperagem"), iCca = nomes.indexOf("Partida a frio (CCA)");
        if (iAh >= 0 && iCca >= 0 && iCca < iAh) falha("medidas", N_MED, "ordem:ah-cca", `${L}: "bateria": "Partida a frio (CCA)" vem antes de "Amperagem" (ordem: ${nomes.join(", ")})`);
        await print("medida-bateria");
        // o 2º print com os grupos de medida à vista (rola até a última opção da CCA, na página ou no painel)
        await page.evaluate(() => {
          const b = [...document.querySelectorAll("#app button[aria-expanded]")].find((x) => window.__bapT.visivel(x) && /^Partida a frio/i.test(x.textContent.trim()));
          const alvo = b && (document.getElementById(b.getAttribute("aria-controls") || "") || b);
          const ult = alvo && [...alvo.querySelectorAll('input[type="checkbox"]')].pop();
          if (ult || b) (ult || b).scrollIntoView({ block: "end", behavior: "instant" });
        });
        await page.waitForTimeout(400);
        await print("medida-bateria-grupos");
        await fecharPainel();
        conferirConsole("medida-bateria");
        // 2) ah=60 (com e sem o termo): as baterias de 60 Ah e a etiqueta "Amperagem: 60 Ah"
        for (const h of ["#/busca?ah=60", "#/busca?q=bateria&ah=60"]) {
          await abrir("medida-ah", h);
          const n = conferirLista(h.slice(8), await listaTodos(), BAT_AH60);
          const etq = await etiquetasTela();
          if (!etq.some((t) => /Amperagem:\s*60\s*Ah\b/i.test(t))) falha("medidas", N_MED, "etiqueta:ah", `${L}: ${h.slice(8)}: sem a etiqueta "Amperagem: 60 Ah" (etiquetas: ${etq.join(" | ") || "nenhuma"})`);
          if (h.includes("q=")) { await page.evaluate(() => window.scrollTo(0, 0)); await print("medida-ah60"); }
          VIU.push(`${h.slice(8)} = ${n}`);
          conferirConsole("medida-ah");
        }
        // 3) cca=401-500 (com e sem o termo)
        for (const h of ["#/busca?cca=401-500", "#/busca?q=bateria&cca=401-500"]) {
          await abrir("medida-cca", h);
          const n = conferirLista(h.slice(8), await listaTodos(), BAT_CCA2);
          const etq = await etiquetasTela();
          if (!etq.some((t) => /Partida a frio \(CCA\):\s*401 a 500/i.test(t))) falha("medidas", N_MED, "etiqueta:cca", `${L}: ${h.slice(8)}: sem a etiqueta "Partida a frio (CCA): 401 a 500" (etiquetas: ${etq.join(" | ") || "nenhuma"})`);
          VIU.push(`${h.slice(8)} = ${n}`);
          conferirConsole("medida-cca");
        }
        // 4) a amperagem escrita na busca: "60ah", "60 ah", "60Ah", "60-Ah" e "bateria 60ah" = as baterias de 60 Ah
        for (const q of ["60ah", "60 ah", "60Ah", "60-Ah", "bateria 60ah"]) {
          await abrir("medida-q", "#/busca?q=" + encodeURIComponent(q));
          const n = conferirLista(`"${q}"`, await listaTodos(), BAT_AH60);
          if (q === "bateria 60ah") { await page.evaluate(() => window.scrollTo(0, 0)); await print("medida-bateria-60ah"); }
          VIU.push(`"${q}" = ${n}`);
          conferirConsole("medida-q");
        }
        // 5) "amortecedor": nenhum grupo de medida
        await abrir("medida-amortecedor", "#/busca?q=" + encodeURIComponent(QF));
        await abrirPainel("medidas", N_MED);
        const ga = (await gruposTela()).map((g) => g.nome);
        const med = ga.filter((n) => /^(Amperagem|Partida a frio)/i.test(n));
        if (!ga.length) falha("medidas", N_MED, "amortecedor:grupos", `${L}: "${QF}": não achei os grupos dos filtros`);
        if (med.length) falha("medidas", N_MED, "amortecedor", `${L}: "${QF}" mostra o(s) grupo(s) de medida ${med.join(", ")} (pedido: só quando a lista tem bateria com a medida)`);
        await fecharPainel();
        VIU.push(`"${QF}" sem grupo de medida (grupos: ${ga.join(", ")})`);
        conferirConsole("medida-amortecedor");
        MEDIDAS.push(`${L}: ${VIU.join("; ")}`);
      }

      // ---- janela do produto (T-0014, se existir no site): "+ Detalhes" e código/nome abrem; Esc fecha e devolve o foco;
      // a foto do cartão só amplia ----
      const N_JAN = "janela do produto";
      await abrir("janela", "#/busca?q=" + encodeURIComponent(QF));
      const temJanela = await page.evaluate(() => [...document.querySelectorAll(".lista .item a, .lista .item button")].some((b) => /\+\s*Detalhes/i.test(b.textContent)));
      if (temJanela) {
        JANELAS.add(L);
        const dialogo = () => page.evaluate(() => { const g = document.querySelector("dialog[open]"); return g ? { txt: g.innerText, tit: ((g.querySelector("h1,h2") || {}).textContent || "").trim(), secoes: g.querySelectorAll(".secao").length } : null; });
        const focoInfo = () => page.evaluate(() => { const a = document.activeElement; const it = a && a.closest(".item"); return { cod: it ? window.__bapT.codDe(it) : "", tag: a ? a.tagName.toLowerCase() + (a.classList && a.classList.length ? "." + a.classList[0] : "") : "", hash: location.hash }; });
        // T-0014 modelo B: o link do cartão é o do título (código e nome) ou o "+ Detalhes" do próprio cartão; o código
        // sobre a foto é só um rótulo (não é clicado)
        for (const [tipo, idx, rot] of [["detalhes", 0, '"+ Detalhes"'], ["nome", 1, "o link do título (código e nome)"]]) {
          const h = (await page.evaluateHandle(([t, i]) => {
            const it = document.querySelectorAll(".lista .item")[i];
            if (!it) return null;
            return (t === "detalhes" ? window.__bapT.detalhesDe(it) : window.__bapT.linkDe(it)) || null;
          }, [tipo, idx])).asElement();
          if (!h) { falha("janela", N_JAN, tipo + ":achar", `${L}: o cartão ${idx + 1} não tem ${rot}`); continue; }
          const cod = (await h.evaluate((e) => window.__bapT.codDe(e.closest(".item")))).trim();
          const hashAntes = await page.evaluate(() => location.hash);
          await h.click();
          const abriu = await page.waitForFunction(() => !!document.querySelector("dialog[open]"), null, { timeout: 3000 }).then(() => true, () => false);
          if (!abriu) {
            falha("janela", N_JAN, tipo + ":abrir", `${L}: clicar em ${rot} do ${cod} não abriu a janela (endereço: ${await page.evaluate(() => location.hash)})`);
            await abrir("janela", "#/busca?q=" + encodeURIComponent(QF));
            continue;
          }
          const d = await dialogo();
          if (!d.txt.includes(cod)) falha("janela", N_JAN, tipo + ":codigo", `${L}: a janela aberta por ${rot} do ${cod} não mostra o código (título "${d.tit}")`);
          for (const a of palavrasInternas(d.txt)) falha("tela-preco", "produto sem preço nem estoque", `janela:${a.nome}:${cod}`, `janela do ${cod} mostra "${a.nome}": …${a.trecho}…`);
          const sw = await page.evaluate(() => document.documentElement.scrollWidth);
          if (larg === 390 && sw > 390) falha("largura", "390 px sem rolar de lado", "janela", `janela do ${cod}: scrollWidth = ${sw}`);
          if (tipo === "detalhes") await print("janela");
          await page.keyboard.press("Escape");
          const fechou = await page.waitForFunction(() => !document.querySelector("dialog[open]"), null, { timeout: 3000 }).then(() => true, () => false);
          await page.waitForTimeout(200);
          const f = await focoInfo();
          if (!fechou) { falha("janela", N_JAN, tipo + ":esc", `${L}: o Esc não fechou a janela do ${cod}`); await abrir("janela", "#/busca?q=" + encodeURIComponent(QF)); continue; }
          if (f.cod !== cod) falha("janela", N_JAN, tipo + ":foco", `${L}: depois do Esc, o foco foi para ${f.tag || "nada"}${f.cod ? " do " + f.cod : ""} (esperado o cartão do ${cod})`);
          if (f.hash !== hashAntes) aviso("janela", N_JAN, `${L}: depois do Esc o endereço ficou "${f.hash}" (antes "${hashAntes}")`);
          conferirConsole("janela");
        }
        // a foto do cartão só amplia: não muda o endereço nem abre a janela do produto
        const hf = (await page.evaluateHandle(() => [...document.querySelectorAll(".lista .item .foto img")].find((i) => !i.closest(".sem-foto")) || null)).asElement();
        if (hf) {
          const cod = (await hf.evaluate((e) => window.__bapT.codDe(e.closest(".item")))).trim();
          const hashAntes = await page.evaluate(() => location.hash);
          await hf.scrollIntoViewIfNeeded();
          await hf.click();
          await page.waitForTimeout(400);
          const d = await dialogo();
          const hashDepois = await page.evaluate(() => location.hash);
          if (hashDepois !== hashAntes) { falha("janela", N_JAN, "foto:endereco", `${L}: clicar na foto do ${cod} mudou o endereço para "${hashDepois}"`); await abrir("janela", "#/busca?q=" + encodeURIComponent(QF)); }
          else if (!d) falha("janela", N_JAN, "foto:ampliar", `${L}: clicar na foto do ${cod} não ampliou a foto`);
          else {
            if (d.secoes || /Ficha t[eé]cnica|Refer[eê]ncias cruzadas/.test(d.txt)) falha("janela", N_JAN, "foto:janela", `${L}: clicar na foto do ${cod} abriu a janela do produto (devia só ampliar a foto)`);
            await page.keyboard.press("Escape");
            const fechou = await page.waitForFunction(() => !document.querySelector("dialog[open]"), null, { timeout: 3000 }).then(() => true, () => false);
            if (!fechou) falha("janela", N_JAN, "foto:esc", `${L}: o Esc não fechou a foto ampliada do ${cod}`);
          }
          conferirConsole("janela-foto");
        }
      }

      // ---- página do produto ----
      const N_PROD = "página do produto", N_PRECO = "produto sem preço nem estoque";
      const paginas = [];
      if (pCod) paginas.push([pCod, "produto", ["Aplicação", "Referências cruzadas", "Ficha técnica", "Leve também"]]);
      if (comFoto) paginas.push([comFoto, "produto-com-foto", ["Aplicação", "Referências cruzadas", "Ficha técnica", "Leve também"]]);
      for (const c of ["TER556556", "1"]) if (existe(c)) paginas.push([porCod.get(normCod(c)), "produto-" + c, []]);
      // R-20261120-141100b-alexandre: o bloco "Ofereça junto" passou a "Leve também" (título exato da seção, como as
      // outras); "Ofereça junto" em qualquer lugar da página é falha
      // T-0014: é a PÁGINA (link direto #/produto/CODIGO), não a janela. O 1º produto abre com o endereço colado
      // numa carga nova da página; os outros, trocando o endereço (sem clique no cartão). Janela aberta = falha.
      let primeira = true;
      for (const [p, nome, secoesEsperadas] of paginas) {
        if (primeira) {
          primeira = false;
          await page.goto("about:blank");
          erros = [];
          await page.goto(base + "#/produto/" + encodeURIComponent(p.c), { waitUntil: "networkidle" });
          await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 15000 }).catch(() => {});
        }
        await abrir(nome, "#/produto/" + encodeURIComponent(p.c));
        const info = await page.evaluate(() => {
          const img = document.querySelector("#app .prod-foto img:not(.sem-foto img)");
          return {
            janela: !!document.querySelector("dialog[open]"),
            h1: ((document.querySelector("#app .prod-info h1") || {}).textContent || "").trim(),
            secoes: [...document.querySelectorAll("#app .prod-info .secao h2")].map((e) => e.textContent.trim()),
            semFoto: ((document.querySelector("#app .prod-foto .sem-foto") || {}).textContent || "").trim(),
            foto: img ? { src: img.getAttribute("src"), ok: img.complete && img.naturalWidth > 0 } : null,
            texto: document.body.innerText,
          };
        });
        if (info.janela) falha("produto", N_PROD, `${p.c}:janela`, `${L} #/produto/${p.c}: abriu uma janela (dialog) no lugar da página`);
        if (info.h1 !== p.c) falha("produto", N_PROD, `${p.c}:h1`, `${L} ${p.c}: título "${info.h1}"`);
        if (p.i) { if (!info.foto || !info.foto.ok) falha("produto", N_PROD, `${p.c}:foto`, `${L} ${p.c}: a foto ${p.i} não carregou`); }
        else if (!/Foto em breve/.test(info.semFoto)) falha("produto", N_PROD, `${p.c}:sem-foto`, `${L} ${p.c}: sem foto e sem "Foto em breve"`);
        for (const s of secoesEsperadas) if (!info.secoes.includes(s)) falha("produto", N_PROD, `${p.c}:${s}`, `${L} ${p.c}: sem a seção "${s}"`);
        if (/ofere[cç]a junto/i.test(info.texto)) falha("produto", N_PROD, `${p.c}:ofereca-junto`, `${L} ${p.c}: a página mostra "Ofereça junto" (o nome aprovado é "Leve também")`);
        for (const a of palavrasInternas(info.texto)) falha("tela-preco", N_PRECO, `${a.nome}:${p.c}`, `#/produto/${p.c} mostra "${a.nome}": …${a.trecho}…`);
        if (nome === "produto" || nome === "produto-com-foto") await print(nome);
        conferirConsole(nome);
      }
      teste("tela-preco", N_PRECO);
      detalhe("produto", N_PROD, paginas.slice(0, 2).map(([p]) => p.c + (p.i ? " (com foto)" : " (Foto em breve)")).join(" e ") + ": foto, aplicação, referências, ficha técnica, leve também; página pelo link direto, sem janela");
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
      // teclado e campos: os 2 campos (q e placa), cada um com Enter e botão
      await page.goto(base + "#/", { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.getElementById("carregando"), null, { timeout: 15000 }).catch(() => {});
      if (tela === "campos") {
        // ---- os 2 campos (T-0014): campo q e campo da placa, cada um com botão e Enter ----
        const N_CB = "campos da busca", N_PL = "campo da placa";
        const focoVisivel = () => page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return (cs.outlineStyle !== "none" && (parseFloat(cs.outlineWidth) || 0) > 0) || (!!cs.boxShadow && cs.boxShadow !== "none"); });
        // teclado: Tab chega ao campo q e depois ao da placa, com foco visível nos 2
        let pq = 0, pp = 0;
        for (let i = 1; i <= 40 && !pp; i++) {
          await page.keyboard.press("Tab");
          const qual = await page.evaluate(() => { const c = window.__bapT.campos(); return document.activeElement === c.q ? "q" : document.activeElement === c.placa ? "placa" : ""; });
          if (qual === "q" && !pq) { pq = i; if (!(await focoVisivel())) falha("a11y", N_A11Y, "foco:q", `${L}: foco no campo q sem contorno visível`); if (larg === 1366) await page.screenshot({ path: path.join(dirPrints, `foco-teclado-${larg}.png`) }); }
          if (qual === "placa") { pp = i; if (!(await focoVisivel())) falha("a11y", N_A11Y, "foco:placa", `${L}: foco no campo da placa sem contorno visível`); }
        }
        if (!pq) falha("a11y", N_A11Y, "tab:q", `${L}: o Tab não chega ao campo q em 40 passos`);
        if (!pp) falha("a11y", N_A11Y, "tab:placa", `${L}: o Tab não chega ao campo da placa em 40 passos`);
        else if (pq && pp < pq) falha("a11y", N_A11Y, "tab:ordem", `${L}: o Tab passa na placa (${pp}) antes do q (${pq}); o q fica à esquerda`);
        // rótulo, botão próprio e posição: lado a lado no computador (q à esquerda, placa menor), um embaixo do outro no celular
        const posicao = () => page.evaluate(() => {
          const T = window.__bapT, c = T.campos();
          const r = (e) => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, r: b.right, b: b.bottom }; };
          return { nq: T.nome(c.q), np: T.nome(c.placa), q: r(c.q), p: r(c.placa), nb: T.botoesBuscar().length };
        });
        const conferirPosicao = (pos, w) => {
          if (w >= 1000) {
            const mesmaLinha = pos.p.y < pos.q.b && pos.q.y < pos.p.b;
            if (!mesmaLinha || pos.p.x < pos.q.r - 1) falha("campos-busca", N_CB, `lado:${w}`, `${w} px: o campo da placa não fica ao lado (à direita) do campo q (q x=${Math.round(pos.q.x)}..${Math.round(pos.q.r)} y=${Math.round(pos.q.y)}; placa x=${Math.round(pos.p.x)} y=${Math.round(pos.p.y)})`);
            if (pos.p.w >= pos.q.w) falha("campos-busca", N_CB, `menor:${w}`, `${w} px: o campo da placa (${Math.round(pos.p.w)} px) não é menor que o q (${Math.round(pos.q.w)} px)`);
          } else if (pos.p.y < pos.q.b - 1) falha("campos-busca", N_CB, `embaixo:${w}`, `${w} px: o campo da placa não fica embaixo do q (q termina em y=${Math.round(pos.q.b)}, placa começa em y=${Math.round(pos.p.y)})`);
        };
        const pos = await posicao();
        if (!pos.nq) falha("a11y", N_A11Y, "rotulo:q", `${L}: o campo q sem rótulo acessível`);
        if (!/placa/i.test(pos.np)) falha("a11y", N_A11Y, "rotulo:placa", `${L}: o campo da placa sem rótulo acessível com "placa" ("${pos.np}")`);
        conferirBotoes(pos.nb, (await naHome()) ? "home" : "busca");
        conferirPosicao(pos, larg);
        if (larg === 1366) {
          await page.setViewportSize({ width: 1536, height: 864 }); await page.waitForTimeout(300);
          conferirPosicao(await posicao(), 1536);
          await page.setViewportSize({ width: larg, height: alt }); await page.waitForTimeout(300);
        }
        CAMPOS_TELA.rotulos = `q "${pos.nq}" e placa "${pos.np}"`;

        // ---- campo da placa: Enter e botão chamam o serviço (interceptado, 503); com o veículo falso, a etiqueta ----
        const PL_RX = new RegExp(PLACA_FALSA.slice(0, 3) + "[\\s-]?" + PLACA_FALSA.slice(3), "i");
        const consoleTxt = [];
        const ouvirConsole = (m) => consoleTxt.push(m.text());
        page.on("console", ouvirConsole);
        const reqLocal = [];
        const ouvirReq = (r) => { if (local(r.url())) reqLocal.push(r.url()); };
        page.on("request", ouvirReq);
        // a placa fora da tela: endereço, título, localStorage, sessionStorage
        const placaFora = (onde) => page.evaluate((fonte) => {
          const rx = new RegExp(fonte, "i"), achou = [];
          if (rx.test(decodeURIComponent(location.href))) achou.push("endereço (location.href)");
          if (rx.test(document.title)) achou.push("título da página");
          for (const [nome, st] of [["localStorage", localStorage], ["sessionStorage", sessionStorage]])
            for (let i = 0; i < st.length; i++) { const k = st.key(i); if (rx.test(k + " " + st.getItem(k))) achou.push(nome); }
          return [...new Set(achou)];
        }, PL_RX.source).then((lst) => { for (const x of lst) falha("placa", N_PL, `fora:${x}`, `${L} ${onde}: a placa aparece no ${x}`); });
        const pegarPlaca = async () => (await page.evaluateHandle(() => window.__bapT.campos().placa)).asElement();
        const textoCartao = () => page.evaluate(() => (document.querySelector(".cartao-busca") || document.body).innerText);
        const esperarChamada = async (antes) => { for (let i = 0; i < 50 && PL.chamadas === antes; i++) await page.waitForTimeout(100); return PL.chamadas > antes; };
        for (const como of ["Enter", "botão"]) {
          await abrir("inicio", "#/sobre"); await abrir("inicio", "#/");
          const antesTxt = await textoCartao(), antesN = PL.chamadas;
          PL.esperando = true; PL.resposta = null;
          const hp = await pegarPlaca();
          await hp.fill(PLACA_FALSA);
          if (como === "Enter") await hp.press("Enter");
          else {
            const hb = await botaoDaPlaca();
            if (hb) await hb.click(); else falha("campos-busca", N_CB, "botoes", `${L}: o quadro da busca não tem o botão "Buscar"`);
          }
          const chamou = await esperarChamada(antesN);
          await page.waitForTimeout(400);
          PL.esperando = false;
          if (!chamou) falha("placa", N_PL, "chamou:" + como, `${L}: ${como} no campo da placa não chamou o serviço (interceptado, 503)`);
          else {
            const h = await page.evaluate(() => location.hash);
            if (h !== "#/") falha("placa", N_PL, "503:tela:" + como, `${L}: com o serviço em 503, ${como} na placa mudou a tela para "${h}"`);
            if ((await textoCartao()) === antesTxt) falha("placa", N_PL, "503:msg:" + como, `${L}: com o serviço em 503, ${como} na placa não mostrou nenhuma mensagem`);
          }
          await placaFora(`(503, ${como})`);
          if (como === "Enter" && larg === 390) await print("placa-503");
          conferirConsole("placa-503");
        }
        // veículo falso (200): a placa só na etiqueta dela, com o "x"; o veículo em etiquetas separadas, sem caixa alta
        await abrir("inicio", "#/sobre"); await abrir("inicio", "#/");
        PL.esperando = true; PL.resposta = VEICULO_FALSO;
        const antesN = PL.chamadas;
        const hp = await pegarPlaca();
        await hp.fill(PLACA_FALSA);
        await hp.press("Enter");
        const chamou = await esperarChamada(antesN);
        await page.waitForFunction(() => location.hash.startsWith("#/busca"), null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(400);
        PL.esperando = false; PL.resposta = null;
        if (!chamou) falha("placa", N_PL, "chamou:veiculo", `${L}: Enter no campo da placa não chamou o serviço (veículo falso)`);
        // T-0014 modelo B (R-20261120-123630): a placa consultada em destaque na faixa do veículo (no lugar da chave),
        // com o X; o veículo vai para as 4 listas (Marca, Modelo, Ano, Motor/Versão); a placa nunca no endereço, título,
        // storage, console nem no resto do DOM
        const v = await page.evaluate((fonte) => {
          const T = window.__bapT, rx = new RegExp(fonte, "gi"), rxT = new RegExp(fonte, "i"), conta = (s) => (String(s).match(rx) || []).length;
          const c = T.campos(), { listas, faixa } = T.veiculo();
          const xPlaca = T.etiquetas().find((b) => rxT.test(b.getAttribute("aria-label") + " " + (b.parentElement ? b.parentElement.textContent : "")));
          const etq = xPlaca ? xPlaca.parentElement : null;
          const total = conta(document.documentElement.outerHTML), naEtq = etq ? conta(etq.outerHTML) : 0, noCampo = c.placa ? conta(c.placa.outerHTML) : 0;
          const txt = (e) => e.textContent.replace(/\s+/g, " ").trim();
          // o texto da placa na etiqueta: o tamanho da fonte (destaque)
          let fonteP = 0;
          let topoP = 0, rotP = "";
          if (etq) { const w = document.createTreeWalker(etq, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) if (rxT.test(n.textContent)) { fonteP = Math.max(fonteP, parseFloat(getComputedStyle(n.parentElement).fontSize)); topoP = n.parentElement.getBoundingClientRect().top; } }
          // R-20261120-124800: o rótulo "Placa" à vista, em cima da placa
          if (etq && faixa) {
            const re = etq.getBoundingClientRect();
            const ehRotP = (e) => !e.children.length && /^Placa:?$/i.test(e.textContent.trim());
            const r = [...faixa.querySelectorAll("*")].find((e) => ehRotP(e) && T.visivel(e) && (() => { const x = e.getBoundingClientRect(); return x.width > 2 && x.bottom <= topoP + 2 && x.right > re.left && x.left < re.right; })());
            // p1 (ver o cabeçalho): até 640 px só o rótulo .vh apontado pelo aria-labelledby da placa; acima, só o rótulo à
            // vista. A conferência em 390 px é feita com a faixa fechada (como ela fica logo depois da busca da placa, sem
            // clique nela): com a faixa aberta o site mostra o rótulo, e este teste não confere esse estado
            const vh = (e) => { const cs = getComputedStyle(e), x = e.getBoundingClientRect();
              return cs.position === "absolute" && x.width <= 1 && x.height <= 1 && cs.overflow === "hidden" && /^rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)$/.test(cs.clip)
                && cs.whiteSpace === "nowrap" && T.visivel(e) && !e.closest('[aria-hidden="true"]'); };
            const ids = (etq.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean);
            const celular = window.innerWidth <= 640;
            const rVh = celular && [...faixa.querySelectorAll("[id]")].find((e) => ehRotP(e) && ids.includes(e.id) && document.getElementById(e.id) === e && vh(e));
            rotP = celular ? (rVh ? "ok-vh" : r ? "à vista (até 640 px o pedido é só para o leitor de tela)" : "") : r ? "ok" : "";
            rotP ||= [...faixa.querySelectorAll("*")].filter((e) => !e.children.length && T.visivel(e) && /placa/i.test(e.textContent)).map((e) => e.textContent.trim()).join(" | ") || "nenhum";
          }
          const antesMarca = !!etq && !!listas[0] && !!(etq.compareDocumentPosition(listas[0]) & Node.DOCUMENT_POSITION_FOLLOWING);
          const sel = listas.map((l) => (l && l.value ? (l.selectedOptions[0] || {}).textContent || l.value : ""));
          const off = listas.map((l) => !!(l && l.disabled));
          const estilo = (l) => { if (!l) return ""; const cs = getComputedStyle(l); return [cs.color, cs.backgroundColor, cs.opacity, cs.filter, cs.borderColor].join(";"); };
          return { hash: location.hash, etq: etq ? txt(etq) : "", xLabel: xPlaca ? xPlaca.getAttribute("aria-label") : "", fora: total - naEtq - noCampo,
            naFaixa: !!etq && !!faixa && faixa.contains(etq), noQuadro: !!etq && T.quadro().contains(etq), fonteP, rotP, antesMarca, sel, off, estilo0: estilo(listas[0]), temFaixa: !!faixa, itens: document.querySelectorAll(".lista .item").length };
        }, PL_RX.source);
        if (!v.hash.startsWith("#/busca")) falha("placa", N_PL, "veiculo:tela", `${L}: com o veículo falso, a placa não levou à lista (endereço "${v.hash}")`);
        if (!v.itens) falha("placa", N_PL, "veiculo:lista", `${L}: o veículo falso (VW GOL 2018) trouxe a lista vazia`);
        if (!v.etq) falha("placa", N_PL, "etiqueta", `${L}: sem a etiqueta da placa com o "x" (etiquetas "Tirar ...": ${(await page.evaluate(() => window.__bapT.etiquetas().map((b) => b.getAttribute("aria-label")))).join(" | ") || "nenhuma"})`);
        if (v.fora > 0) falha("placa", N_PL, "dom", `${L}: a placa aparece ${v.fora} vez(es) no DOM fora da etiqueta dela e do campo`);
        if (!v.temFaixa) falha("placa", N_PL, "faixa", `${L}: sem a faixa do veículo com as listas depois da placa`);
        else if (v.etq && !v.naFaixa) falha("placa", N_PL, "etiqueta:faixa", `${L}: a etiqueta da placa ("${cortar(v.etq, 40)}") fica fora da faixa do veículo${v.noQuadro ? " (no quadro da busca)" : ""} (pedido: em destaque na faixa, no lugar da chave)`);
        // [SUPOSIÇÃO] "em destaque": o texto da placa com fonte de 16 px ou mais
        if (v.etq && v.fonteP < 16) falha("placa", N_PL, "etiqueta:destaque", `${L}: a placa na faixa com fonte de ${v.fonteP} px (destaque: 16 px ou mais)`);
        if (v.etq && v.naFaixa && !/^ok/.test(v.rotP)) falha("placa", N_PL, "etiqueta:rotulo", `${L}: ${larg <= 640 ? 'sem o rótulo "Placa" só para o leitor de tela (.vh, apontado pelo aria-labelledby da placa) na faixa fechada' : 'sem o rótulo "Placa" à vista em cima da placa na faixa'} (achado: ${cortar(v.rotP, 80)})`);
        if (v.etq && v.naFaixa && !v.antesMarca) falha("placa", N_PL, "etiqueta:ordem", `${L}: a placa não vem antes da Marca na faixa (ordem pedida: Placa · Marca · Modelo · Ano · Motor · Versão)`);
        const esperadoSel = [/volkswagen|\bvw\b/i, /\bgol\b/i, /\b2018\b/, /\b1[.,]6\b/], nomesSel = ["Marca", "Modelo", "Ano", "Motor"];
        esperadoSel.forEach((rx, i) => { if (v.temFaixa && !rx.test(v.sel[i] || "")) falha("placa", N_PL, "veiculo:lista:" + nomesSel[i], `${L}: depois da placa (VW GOL 2018 1.6), a lista ${nomesSel[i]} ficou com "${v.sel[i] || "(nada)"}"`); });
        const mm = v.sel.slice(0, 4).filter(Boolean).join(" › ");
        // R-20261120-130300: com a placa, as 5 listas travadas (disabled), em cinza, com os valores da placa
        if (v.temFaixa && !v.off.every(Boolean)) falha("placa", N_PL, "veiculo:travadas", `${L}: com a placa, as listas ${["Marca", "Modelo", "Ano", "Motor", "Versão"].filter((_, i) => !v.off[i]).join(", ")} não estão travadas (pedido: as 5 travadas com os valores da placa)`);
        await placaFora("(veículo falso)");
        await page.evaluate(() => window.scrollTo(0, 0));
        await print("busca-placa");
        const listaVei = (await listaTodos()).itens.map((i) => i.c);
        // o "x" da placa: a placa some do DOM
        if (v.etq) {
          const hx = (await page.evaluateHandle((fonte) => { const rx = new RegExp(fonte, "i"); return window.__bapT.etiquetas().find((b) => rx.test(b.getAttribute("aria-label") + " " + (b.parentElement ? b.parentElement.textContent : ""))) || null; }, PL_RX.source)).asElement();
          const clicou = hx ? await hx.click({ timeout: 5000 }).then(() => true, () => false) : false;
          await page.waitForTimeout(400);
          if (!clicou) falha("placa", N_PL, "x:clique", `${L}: não consegui clicar no "x" da etiqueta da placa ("${v.xLabel}")`);
          const resta = await page.evaluate((fonte) => { const rx = new RegExp(fonte, "gi"); const c = window.__bapT.campos(); return (document.documentElement.outerHTML.match(rx) || []).length - (c.placa ? (c.placa.outerHTML.match(rx) || []).length : 0); }, PL_RX.source);
          if (resta > 0) falha("placa", N_PL, "x:some", `${L}: depois do "x", a placa continua no DOM (${resta} vez(es))`);
          const dx = await page.evaluate(() => { const l = window.__bapT.veiculo().listas; const cs = l[0] ? getComputedStyle(l[0]) : null;
            return { val: l.map((x) => (x ? x.value : "")), txt: l.map((x) => (x && x.selectedOptions[0] ? x.selectedOptions[0].textContent.trim() : "")), off: l.map((x) => !!(x && x.disabled)),
              estilo0: cs ? [cs.color, cs.backgroundColor, cs.opacity, cs.filter, cs.borderColor].join(";") : "" }; });
          // R-20261120-130300: o X volta as 5 para "Todos" e editáveis (a Marca ativa; as outras como numa busca nova, em cascata)
          if (dx.val.some(Boolean) || dx.txt.some((t) => t && !/^Tod[oa]s\b/i.test(t))) falha("placa", N_PL, "x:listas", `${L}: depois do "x" da placa, as listas do veículo ficaram com "${dx.txt.join(" › ")}" (esperado: "Todos" nas 5)`);
          if (dx.off[0]) falha("placa", N_PL, "x:travada", `${L}: depois do "x" da placa, a lista Marca continua travada`);
          // em cinza: a Marca travada (com a placa) tem outra cor que a Marca editável (depois do X)
          if (v.temFaixa && v.off[0] && !dx.off[0] && v.estilo0 === dx.estilo0) falha("placa", N_PL, "veiculo:cinza", `${L}: a lista Marca travada (com a placa) tem a mesma cor da editável (pedido: em cinza)`);
          if (v.temFaixa) CAMPOS_TELA.trava = `com a placa, as 5 listas travadas (${v.off.filter(Boolean).length} de 5) e em cinza; o X volta a "Todos" com a Marca editável`;
          await placaFora("(depois do x)");
        }
        // os 2 campos preenchidos (R-20261120-115432, 1 botão só): placa + "amortecedor" = a lista do veículo filtrada pelo
        // texto. Esperado: os produtos da lista do veículo (acima) que têm "AMORTECEDOR" no texto, nem mais nem menos.
        const TXT2 = "amortecedor";
        const esperado2 = listaVei.filter((c) => norm(textoDe(porCod.get(normCod(c)) || {})).includes(norm(TXT2)));
        const dois = [];
        for (const como of ["Enter no campo geral", "Enter no campo da placa", "botão"]) {
          await abrir("inicio", "#/sobre"); await abrir("inicio", "#/");
          PL.esperando = true; PL.resposta = VEICULO_FALSO;
          const n0 = PL.chamadas;
          await page.fill('input[name="q"]', TXT2);
          await (await pegarPlaca()).fill(PLACA_FALSA);
          // na home nova (2 botões), o da PLACA: consulta o veículo e leva o texto junto (como o 4de7bb1)
          if (como === "botão") { const hb = await botaoDaPlaca(); if (hb) await hb.click(); }
          else if (como === "Enter no campo geral") await page.press('input[name="q"]', "Enter");
          else await (await pegarPlaca()).press("Enter");
          const ch = await esperarChamada(n0);
          await page.waitForFunction(() => location.hash.startsWith("#/busca"), null, { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(400);
          PL.esperando = false; PL.resposta = null;
          if (!ch) { falha("placa", N_PL, "dois:chamou:" + como, `${L}: placa + "${TXT2}", ${como}: não consultou a placa`); continue; }
          const got = (await listaTodos()).itens.map((i) => i.c);
          const falta = esperado2.filter((c) => !got.includes(c)), sobra = got.filter((c) => !esperado2.includes(c));
          if (!got.length || falta.length || sobra.length)
            falha("placa", N_PL, "dois:lista:" + como, `${L}: placa (VW GOL 2018) + "${TXT2}", ${como}: ${got.length} produto(s), esperado ${esperado2.length} (os do veículo com "${TXT2}")` +
              (falta.length ? `; faltam ${falta.slice(0, 5).join(", ")}` : "") + (sobra.length ? `; sobram ${sobra.slice(0, 5).join(", ")}` : ""));
          await placaFora(`(placa + "${TXT2}", ${como})`);
          if (como === "botão") { await page.evaluate(() => window.scrollTo(0, 0)); await print("busca-placa-texto"); }
          dois.push(`${como} = ${got.length}`);
          conferirConsole("placa-texto");
        }
        CAMPOS_TELA.dois = `placa + "${TXT2}" = ${esperado2.length} de ${listaVei.length} do veículo (${dois.join("; ")})`;
        page.off("console", ouvirConsole);
        page.off("request", ouvirReq);
        if (consoleTxt.some((t) => PL_RX.test(t))) falha("placa", N_PL, "console", `${L}: a placa aparece no console`);
        const reqComPlaca = reqLocal.filter((u) => PL_RX.test(decodeURIComponent(u)));
        if (reqComPlaca.length) falha("placa", N_PL, "pedido-local", `${L}: a placa foi num pedido ao site: ${cortar(reqComPlaca[0], 80)}`);
        conferirConsole("placa-veiculo");
        CAMPOS_TELA.placa = v.etq ? `etiqueta "${cortar(v.etq, 40)}"` : "";
        CAMPOS_TELA.veiculo = mm || "";
        if (/^ok/.test(v.rotP)) (CAMPOS_TELA.rotulo ||= []).push(`${L}: ${v.rotP === "ok" ? "à vista" : "só para o leitor de tela (.vh, aria-labelledby)"}`);
        detalhe("a11y", N_A11Y, `campos com rótulo, imagens com alt, Tab chega ao campo q e ao da placa (${pq} e ${pp} passos), foco visível nos 2`);
      }

      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const nomeTela = { abas: "2 abas (falha)", campos: "a aprovada (sem abas: q e placa lado a lado)", "?": "não reconhecida" };
  detalhe("tela", "tela da busca", [...TELAS].map((t) => nomeTela[t] || t).join(" e ") + "; filtros: " + ([...FILTROS].map((f) => f.replace(/^(\w+|\?)/, (t) => ({ barra: "barra horizontal", coluna: "coluna à esquerda", painel: 'botão "Filtrar" com painel', "?": "não achados" })[t] || t)).join(" e ") || "?"));
  teste("tela", "tela da busca");
  if (TELAS.has("campos")) {
    detalhe("campos-busca", "campos da busca", `${CAMPOS_TELA.rotulos || "?"}; lado a lado em 1366 e 1536 px (placa à direita e menor), um embaixo do outro em 390 px; 1 só botão "Buscar" no quadro da busca (2 na página inicial: o do q e o da placa); q com Enter e botão (busca código e veículo)`);
    detalhe("placa", "campo da placa", `Enter e botão chamam o serviço (interceptado, 503) e mostram mensagem; veículo falso VW GOL 2018 1.6 → ${CAMPOS_TELA.placa || "?"} em destaque na faixa, com o rótulo "Placa" em cima (${(CAMPOS_TELA.rotulo || []).join("; ") || "?"}) e antes da Marca, e as listas "${CAMPOS_TELA.veiculo || "?"}"; ${CAMPOS_TELA.trava || ""}; ${CAMPOS_TELA.dois || ""}; placa fora do endereço, título, storage, console e do resto do DOM; o "x" tira a placa do DOM e esvazia as listas`);
    detalhe("meuveiculo", "meu veículo", MV.join("; ") + '; faixa logo abaixo do quadro da busca, 5 listas em cascata (Marca, Modelo, Ano, Motor, Versão); sem "Meu veículo", sem "Trocar veículo", sem chave liga/desliga, sem "Departamentos"');
    detalhe("filtros", "filtros da busca", [FILTRO_SI.si ? `link "amortecedor" com si=${FILTRO_SI.si} = ${FILTRO_SI.n}, só desse sistema` : "", FILTRO_SI.coluna || "", FILTRO_SI.painel || "", FILTRO_SI.sempre ? `"${COD}" (1 opção por grupo): ${FILTRO_SI.sempre}` : "", FILTRO_SI.marcou || ""].filter(Boolean).join("; "));
    teste("medidas", "medida da bateria (T-0006)");
    detalhe("medidas", "medida da bateria (T-0006)", `do JSON: ${BAT_AH60.length} de 60 Ah e ${BAT_CCA2.length} com CCA 401 a 500; ` + MEDIDAS.join(" | "));
    detalhe("cartoes", "cartões da lista", `"amortecedor": ${CARTOES.join("; ")}; 4 na 1ª linha em 1366 e 1536 (fA2), 5 em 1920 (a partir de 1680), 2 no celular; texto do cartão >= 12 px; 1ª e 2ª linha com a mesma altura e o "+ Detalhes" no mesmo y; código sobre a foto (canto inferior direito, nem botão nem link), no rótulo do link e no alt; no máximo 2 referências à vista; "+ Detalhes"`);
  }
  // T-0040: sem ano no "ve" (base sem a Fraga), os casos não se aplicam; com ano, têm de ter rodado
  const N_VT = "veículo com ano (Fraga, T-0040)";
  teste("fraga", N_VT);
  if (VT.n && !VT.txt.length) falha("fraga", N_VT, "nao-rodou", `o JSON tem ${fmt(VT.n)} veículos com ano no "ve", mas os casos da Fraga não rodaram`);
  detalhe("fraga", N_VT, VT.n ? `${fmt(VT.n)} veículos com ano no "ve"; ` + VT.txt.join("; ") : 'sem ano no "ve": os casos da Fraga não se aplicam');
  if (JANELAS.size) detalhe("janela", "janela do produto", `"+ Detalhes" e código/nome abrem o dialog com o código; Esc fecha e devolve o foco ao cartão; a foto do cartão só amplia (${[...JANELAS].join(" e ")})`);
  else { teste("janela", "janela do produto"); detalhe("janela", "janela do produto", 'o site não tem a janela (sem "+ Detalhes" no cartão): não conferida'); }
  detalhe("largura", "390 px sem rolar de lado", "scrollWidth <= 390 em todas as telas abertas");
  detalhe("console", "console sem erro", "0 erro do site nas telas abertas, nas 2 larguras");
  teste("largura", "390 px sem rolar de lado");
  teste("console", "console sem erro");
  teste("rota-antiga", "link antigo redireciona");
  detalhe("rota-antiga", "link antigo redireciona", "#/busca?cod= e #/busca?mo=&modelo=&ano= viram #/busca?q=");
}

// ---------- igual ao de referência, fora o gerado_em (T-0022: o login não muda o produtos.json) ----------
function compararJson(arqJson, arqRef) {
  const N = "JSON igual ao de referência";
  let a, b;
  try { a = JSON.parse(fs.readFileSync(arqJson, "utf8")); b = JSON.parse(fs.readFileSync(arqRef, "utf8")); }
  catch (e) { falha("comparar", N, "leitura", `não li os 2 JSON: ${e.message}`); return; }
  delete a.gerado_em; delete b.gerado_em;
  const ka = Object.keys(a).sort().join(","), kb = Object.keys(b).sort().join(",");
  if (ka !== kb) falha("comparar", N, "chaves", `chaves do JSON diferentes: ${cortar(ka)} × ${cortar(kb)}`);
  for (const k of Object.keys(b)) if (k !== "produtos" && JSON.stringify(a[k]) !== JSON.stringify(b[k])) falha("comparar", N, "campo:" + k, `"${k}" mudou`);
  const pa = a.produtos || [], pb = b.produtos || [];
  if (pa.length !== pb.length) falha("comparar", N, "total", `${fmt(pa.length)} produtos × ${fmt(pb.length)} no de referência`);
  const dif = [];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if (JSON.stringify(pa[i]) !== JSON.stringify(pb[i])) dif.push((pa[i] || pb[i] || {}).c || "#" + i);
  if (dif.length) falha("comparar", N, "produtos", `${dif.length} produto(s) diferente(s): ${cortar(dif.slice(0, 10).join(", "), 120)}`);
  // o "igual a" só quando não houve diferença (com diferença, as falhas já dizem o quê)
  if (!teste("comparar", N).falhas.length) detalhe("comparar", N, `igual a ${path.relative(RAIZ, arqRef).startsWith("..") ? arqRef : path.relative(RAIZ, arqRef)}, fora o gerado_em (${fmt(pb.length)} produtos)`);
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
  const linhas = [`Testes T-0002${opcoes.login ? " e T-0022 (com login)" : ""} · ${agoraManaus()} (Manaus)` + (opcoes.json ? ` · JSON: ${opcoes.json}` : "")];
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
    } else if (!(opcoes.semNavegador && !["palavra", "json", "campos", "unico", "autoimpact"].includes(k.teste))) {
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
  if (opcoes.login && opcoes.json) throw erroUso("--login não combina com --json (o serviço de login serve o site/data/produtos.json de verdade)");
  if (opcoes.login && opcoes.semNavegador) throw erroUso("--login precisa do navegador (sem --sem-navegador)");
  const arqJson = opcoes.json || path.join(SITE, "data", "produtos.json");
  const ctxJson = testarJson(arqJson);
  if (opcoes.comparar) compararJson(arqJson, opcoes.comparar);
  if (ctxJson && !opcoes.semNavegador && path.resolve(opcoes.prints) === PRINTS_PADRAO && fs.existsSync(PRINTS_PADRAO))
    for (const f of fs.readdirSync(PRINTS_PADRAO)) if (f.endsWith(".png")) fs.rmSync(path.join(PRINTS_PADRAO, f));
  if (ctxJson && !opcoes.semNavegador && opcoes.login) {
    const { subirLogin, testarLogin, entrarParaBuscas } = await import(pathToFileURL(path.join(RAIZ, "testes", "login.mjs")).href);
    const srv = await subirLogin(RAIZ);
    fs.mkdirSync(opcoes.prints, { recursive: true });
    try {
      const comum = await testarLogin({ raiz: RAIZ, srv, dirPrints: opcoes.prints, prods: ctxJson.prods, reg: { teste, falha, aviso, detalhe, cortar, RX_PLACAS, vigiar, casos: CASOS } });
      await testarSite(srv.base, ctxJson, opcoes.prints, (page) => entrarParaBuscas(page, srv.base, comum.usuario, comum.senha));
    } finally { await srv.parar(); }
  } else if (ctxJson && !opcoes.semNavegador) {
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
