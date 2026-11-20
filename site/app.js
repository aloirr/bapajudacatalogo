/* Catálogo BAP online · site estático (sem servidor).
   Os dados vêm de data/produtos.json, gerado por scripts/gerar_site.py a partir da base unificada.
   Rotas: #/  ·  #/busca?q=&ve=&si=&fa=&li=&ca=  ·  #/produto/<CODIGO>  ·  #/sobre
   (os links antigos com cod=, mo=, modelo= e ano= viram q=: ver rotaAntiga; ve = o veículo achado pela placa, nunca
   a placa; si, fa, li e ca podem vir repetidos, um por opção marcada na barra de filtros)
   Busca por placa (T-0005): chama o serviço bapajudacatalogo-placas (integracao-placas), que guarda a chave da
   API PLACAS. O site só conhece a URL pública abaixo; nenhuma chave entra aqui. LGPD: a placa não vai para o
   endereço (#/...), nem para o localStorage/sessionStorage, nem para o console. */
(function () {
  "use strict";

  // endereço confirmado do serviço bapajudacatalogo-placas no Render (contrato: POST {"placa":"ABC1D23"})
  const PLACAS_URL = "https://bapajudacatalogo-placas.onrender.com/veiculo";
  // O plano starter do Render não dorme. O aviso "Acordando o serviço" fica só para a consulta que passa de 5 s
  // (serviço reiniciando depois de um deploy ou a API PLACAS lenta); o limite de espera continua folgado.
  const PLACAS_TIMEOUT_MS = 75000;
  const PLACAS_ACORDANDO_MS = 5000;
  // SIMULAÇÃO T-0014 (R-20261120-122100; sai na entrega, fica o modelo escolhido pelo Alexandre). Substitui ?f= e ?v=.
  //   ?m=A vertical: coluna à esquerda com o título, o cartão "Meu veículo" (chave e listas Marca › Modelo › Ano ›
  //        Motor/Versão) e os outros filtros; no celular, botão "Meu veículo e filtros" que abre o painel por cima.
  //   ?m=B horizontal: o cartão "Meu veículo" deitado numa faixa abaixo do quadro da busca e os filtros na 2ª linha;
  //        no celular, as 4 listas em 2×2 e os filtros no botão "Filtrar (n)".
  //   Nos dois, o menu "Departamentos" (os sistemas) e o caminho ("Suspensão › Amortecedores e Kits").
  //   Sem parâmetro: a tela de hoje.
  const SIM_M = /^[AB]$/.test(new URLSearchParams(location.search).get("m") || "") ? new URLSearchParams(location.search).get("m") : "";
  if (SIM_M) document.documentElement.classList.add("sim-m-" + SIM_M.toLowerCase());
  const CELULAR_SIM = () => window.matchMedia("(max-width: 900px)").matches;
  const VEI_K = ["vm", "vmo", "va", "vmt"]; // marca, modelo, ano e motor/versão do "Meu veículo" (no endereço vai o veículo, nunca a placa)
  const chaveVeiculo = (pr) => VEI_K.map((k) => (pr && pr.get(k)) || "").join("|");
  const POR_PAGINA = 50; // T-0014: 10 linhas de 5 cartões no computador (25 de 2 no celular)
  // { q, texto, partes, placa } do último veículo achado pela placa. Só em memória: nunca no endereço, no
  // localStorage/sessionStorage, no console ou no título. A placa vive só no fluxo da busca (lista, janela do produto e
  // volta à lista) e some no X dela (no quadro da busca), numa busca nova de texto, ao ir para qualquer tela fora da
  // busca (início, sobre, página do produto) e ao recarregar a página. O "Limpar tudo" não mexe nela: tira só o termo
  // e os filtros, abaixo da barra.
  let VEICULO_PLACA = null;
  const app = document.getElementById("app");
  let BASE = null;           // { gerado_em, total, produtos }
  let POR_COD = new Map();   // código → produto
  let INDICE = [];           // [{ p, desc, apl, marcas, outros, cods, mcods, eans, faixas }]
  const PALAVRAS = new Set(); // palavras (letras e números) que aparecem nas aplicações, para achar os modelos derivados
  const DERIVADOS = new Map(); // modelo → palavras derivadas (cache)
  // nome de veículo: palavra que está em pelo menos 5 vezes mais aplicações que descrições (POLO 154 x 7; ROLAMENTO
  // 221 x 194 não é). Contagem por produto.
  const EM_APL = new Map(), EM_DESC = new Map();
  const ehVeiculo = (w) => (EM_APL.get(w) || 0) >= 5 * (EM_DESC.get(w) || 0) && EM_APL.has(w);

  // ---------- utilidades ----------
  const semAcento = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const norm = (s) => semAcento(String(s || "")).toUpperCase().replace(/\s+/g, " ").trim();
  const normCod = (s) => semAcento(String(s || "")).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MINUSC = new Set(["e", "de", "da", "do", "das", "dos", "com", "sem", "para", "p/", "c/", "s/"]);
  const titulo = (s) => String(s || "").toLowerCase().replace(/(^|[\s/(-])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase())
    .replace(/(\s)(E|De|Da|Do|Das|Dos|Com|Sem|Para)(?=\s)/g, (m, a, b) => a + b.toLowerCase());
  const fmt = (n) => Number(n).toLocaleString("pt-BR");
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function lerRota() {
    const h = location.hash.replace(/^#/, "") || "/";
    const [caminho, qs] = h.split("?");
    return { caminho, params: new URLSearchParams(qs || "") };
  }
  function irPara(caminho, params) {
    const pares = params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params || {});
    const qs = new URLSearchParams(pares.filter(([, v]) => v !== "" && v != null)).toString();
    location.hash = "#" + caminho + (qs ? "?" + qs : "");
  }

  // ---------- dados ----------
  async function carregar() {
    const r = await fetch("data/produtos.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    BASE = await r.json();
    // 1ª passada: palavras da aplicação e da descrição (ehVeiculo, derivados), antes de montar os códigos
    const textos = BASE.produtos.map((p) => {
      const desc = norm([p.d, p.p].join(" | ")), apl = norm(p.a);
      for (const w of new Set(apl.match(/[A-Z0-9]+/g) || [])) { PALAVRAS.add(w); EM_APL.set(w, (EM_APL.get(w) || 0) + 1); }
      for (const w of new Set(desc.match(/[A-Z0-9]+/g) || [])) EM_DESC.set(w, (EM_DESC.get(w) || 0) + 1);
      return { desc, apl };
    });
    // Códigos de uma referência (T-0011, B2): só o que tem cara de código, nunca palavra de aplicação.
    // - Nakata dos kits KHC traz a aplicação inteira depois de "APLICAÇÃO REVISADA": dali em diante não é código.
    // - Pedaços separados por / ; , | = ( ) e "OU"; o rótulo antes de ":" sai ("Cofap: KJH04202" → KJH04202).
    // - O pedaço inteiro vira um código só se tem número e cada palavra tem número ou é sigla de até 4 letras que
    //   não é veículo ("NJH07 5123" → NJH075123, "BTC 39115", "6309 2RS C3"; "Corsa 1.0" não vira CORSA10).
    // - Senão (pedaço com texto), só a palavra com número e pelo menos 5 caracteres ("Cofap GP33190" → GP33190;
    //   16V e 4X4 não são código).
    const partes = (x) => {
      const out = [];
      for (let pd of String(x.c || "").split(/APLICA[ÇC][ÃA]O/i)[0].split(/[\/;,|=()\n]| OU /i)) {
        const ws = norm(pd.replace(/^.*:/, "")).split(" ").filter((w) => normCod(w));
        if (!ws.length || !ws.some((w) => /\d/.test(w))) continue;
        if (ws.every((w) => /\d/.test(w) || (normCod(w).length <= 4 && !ehVeiculo(normCod(w))))) out.push(normCod(ws.join("")));
        else if (ws.length > 1) for (const w of ws) { const c = normCod(w); if (c.length >= 5 && /\d/.test(c) && !ehVeiculo(c)) out.push(c); }
      }
      return out;
    };
    BASE.produtos.forEach((p, ix) => {
      POR_COD.set(normCod(p.c), p);
      const e = {
        p,
        // campos da busca (T-0011), com a chave do produtos.json de cada um:
        desc: textos[ix].desc,                                               // descrição: d (DESCRICAO) e p (PRODUTO)
        apl: textos[ix].apl,                                                 // aplicação (veículo, motor e ano): a
        // marca concorrente: r[].m, e o texto da referência r[].c, onde às vezes vem a marca ("Cofap GP33190");
        // a marca do produto é BAP
        marcas: norm((p.r || []).map((x) => x.m + " " + x.c).join(" | ")),
        outros: norm([p.ca, p.fa, p.si, p.li, p.de, p.df, p.mo, p.po, p.la].join(" | ")), // categoria ca, família fa e os outros
        // código BAP c (o 1º) e referências cruzadas r[].c, sem espaço, ponto e hífen
        cods: [...new Set([normCod(p.c)].concat((p.r || []).flatMap(partes).filter((c) => c.length >= 3)))],
        // referência com a marca na frente ("TRW 16900255S" → "TRW16900255S")
        mcods: [...new Set((p.r || []).filter((x) => normCod(x.m)).flatMap((x) => partes(x).filter((c) => c.length >= 3).map((c) => normCod(x.m) + c)))],
        eans: (p.x || []).filter(([k]) => k === "Código de barras").map(([, v]) => normCod(v)).filter(Boolean), // EAN: x["Código de barras"]
        faixas: faixasDoTexto(p.a || ""),                                    // anos da aplicação
      };
      // montadora com o outro nome ("vw gol" acha o Gol da VOLKSWAGEN, como a antiga aba Veículo): vale a montadora
      // do campo mo e também a escrita como palavra na aplicação ou na descrição ("VOLKSWAGEN GOL 1.6")
      const apelidos = Object.keys(APELIDOS).filter((m) => norm(p.mo).split(/\s*[\/,]\s*/).includes(m)
        || RX_MONTADORA[m].test(e.apl) || RX_MONTADORA[m].test(e.desc)).map((m) => APELIDOS[m]);
      if (apelidos.length) e.outros += " | " + apelidos.join(" ");
      e.tudo = [e.desc, e.apl, e.marcas, e.outros].join(" | ");
      e.codsTxt = e.cods.concat(e.mcods, e.eans).join(" ");
      INDICE.push(e);
    });
    const info = document.getElementById("info-base");
    if (info && BASE.gerado_em) info.textContent = fmt(BASE.total) + " produtos · base atualizada em " + BASE.gerado_em;
  }

  // ---------- busca palavra por palavra (T-0011) ----------
  // A regra mora SÓ aqui: casador() é a função única de toda busca do site (o campo "código, descrição ou aplicação",
  // os links antigos das abas Veículo e Código, que viram esse campo, e os filtros, que refazem a mesma busca).
  // 1. O termo vira palavras (espaço, vírgula e ponto e vírgula; hífen entre letras também, como no modelo da T-0008).
  // 2. Cada palavra casa com pelo menos um campo do produto (OU entre campos); o produto entra se todas casarem
  //    (E entre palavras). A ordem não importa; caixa e acento não importam (norm).
  // 3. Palavras vizinhas também valem juntas: "SPACE FOX" casa com SPACEFOX, "CXD 13062" com CXD13062,
  //    "33 000" com 33000, "TRW 16900255S" com TRW + 16900255S. Juntas, só valem como código inteiro ou texto,
  //    nunca como pedaço de código: assim a ordem das palavras não muda a lista ("gol 1.0" = "1.0 gol").
  // 4. Se nenhum produto casa com todas as palavras, a lista mostra os mais próximos (os que casam com mais
  //    palavras), em vez de lista vazia. Ver buscar().

  // Ano da aplicação: cada data vira uma faixa [de, até]. Formas lidas (norm, maiúsculo e sem acento):
  //   "2014 ATE 2017", "1989–1996", "2004 A 2011", "2015/2021", "1991 / 1996", "1998>2009", "2018 2021"  → faixa
  //   "06/2008–06/2012", "01/1993 - 12/2012", "01/198309/1984" (grudado)                                 → faixa
  //   "01/89 - 12/97", "12/97 12/03" (mês/ano com 2 dígitos)                                             → faixa
  //   "05-10", "(83-92)" (ano-ano, até 30 anos), "84/97" (ano/ano, com o 1º maior que 12)                  → faixa
  //   "2018>", "2005 EM DIANTE", "2025 →", "2000 +", "2012/...", "1998 / ...", "2018 ATE" (sem fim)        → de ano em diante
  //   "../08", ".../1977" (sem começo)                                                                     → até o ano
  //   "2007", "08/2022"                                                                                    → só o ano
  //   "07/17" sozinho (sem outra data do lado): mês/ano ou ano/ano, as duas leituras (2007 a 2017)          → faixa
  //   não é ano: 13/16" (polegada), 2500 e 1938 (motor ou modelo)
  // Ano com 2 dígitos: até 35 = 20xx; depois = 19xx. Ano de 4 dígitos só entre 1950 e o ano atual + 2 (fora disso
  // é número de motor ou de modelo, como 2500, 1938 ou o Axor 2035).
  const ANO_MIN = 1950, ANO_MAX = new Date().getFullYear() + 2, SEM_FIM = 2100, SEM_INICIO = 1900; // "Axor 2035" não é ano
  const ano2 = (s) => { const n = +s; return n <= 35 ? 2000 + n : 1900 + n; };
  const anoOk = (n) => n >= ANO_MIN && n <= ANO_MAX;
  function faixasDoTexto(texto) {
    const s = norm(texto).replace(/(\d{2}\/(?:19|20)\d{2})(?=\d{2}\/(?:19|20)\d{2})/g, "$1 ");
    const datas = []; // { i, f, de, ate }
    const re = /(?<!\d|\d[.,])(?:(\d{1,2})\/)?((?:19|20)\d{2})(?!\d|[.,]\d)|(?<!\d|\d[.,\/])(\d{2})\/(\d{2})(?!\d|[.,\/]\d|\s*(?:"|''|POL))|(?<![\d.,\/-])(\d{2})-(\d{2})(?![\d.,\/-])|(?:\.{2,}|…)\s*\/\s*(\d{2})(?!\d)/g;
    let m;
    while ((m = re.exec(s))) {
      const i = m.index, f = m.index + m[0].length;
      if (m[2]) { const a = +m[2]; if (anoOk(a)) datas.push({ i, f, de: a, ate: a }); }
      else if (m[3]) {
        const x = +m[3];
        // mês/ano; sozinho (sem outra data para formar faixa) também pode ser ano/ano: "Punto 07/17", "Camry 06/12"
        if (x >= 1 && x <= 12) datas.push({ i, f, de: ano2(m[4]), ate: ano2(m[4]), dupla: ano2(m[3]) <= ano2(m[4]) ? ano2(m[3]) : 0 });
        else { const a = ano2(m[3]), b = ano2(m[4]); if (a <= b) datas.push({ i, f, de: a, ate: b, faixa: true }); } // ano/ano
      } else if (m[5]) { const a = ano2(m[5]), b = ano2(m[6]); if (a <= b && b - a <= 30) datas.push({ i, f, de: a, ate: b, faixa: true }); } // "05-10", "(83-92)"
      else if (m[7]) datas.push({ i, f, de: SEM_INICIO, ate: ano2(m[7]), faixa: true });
    }
    const faixas = [];
    const SEP = /^[\s·]*(?:-|–|—|A|AO|ATE|\/|>|→)?[\s·]*$/;
    const ABERTO = /^\s*(?:>|\+|→|EM DIANTE|\/\s*(?:\.{2,}|…)|…|\.{3}|ATE(?![\s·]*\d))/;
    const SEM_COMECO = /(?:\.{2,}|…)\s*\/?\s*$/;
    for (let k = 0; k < datas.length; k++) {
      const d = datas[k], prox = datas[k + 1];
      if (!d.faixa && prox && !prox.faixa) {
        const meio = s.slice(d.f, prox.i);
        // dois anos seguidos só com espaço também são faixa ("2018 2021"), mas com "·" no meio, só com separador
        if (SEP.test(meio) && (!meio.includes("·") || /[-–—\/>→]|A|ATE/.test(meio)) && d.de <= prox.ate) {
          faixas.push([d.de, prox.ate]); k++; continue;
        }
      }
      if (!d.faixa && ABERTO.test(s.slice(d.f))) faixas.push([d.de, SEM_FIM]);
      else if (!d.faixa && SEM_COMECO.test(s.slice(Math.max(0, d.i - 5), d.i))) faixas.push([SEM_INICIO, d.ate]);
      else faixas.push([d.dupla || d.de, d.ate]);
    }
    return faixas;
  }
  // 1 = casa, 0 = não casa, -1 = a aplicação não diz o ano. ANO_INICIO e ANO_FIM da base (an) vêm primeiro.
  function casaAno(e, ano) {
    const an = e.p.an;
    if (an && (an[0] || an[1])) return (!an[0] || ano >= an[0]) && (!an[1] || ano <= an[1]) ? 1 : 0;
    if (!e.faixas.length) return -1;
    return e.faixas.some(([a, b]) => ano >= a && ano <= b) ? 1 : 0;
  }

  // Modelo derivado (regra do Alexandre, 20/11/2026: "é regra para todos"): a palavra da aplicação é o modelo
  // grudado, na frente ou atrás, em outro nome que também aparece sozinho nas aplicações (TRAIL+BLAZER, CROSS+FOX,
  // SPACE+FOX, SPACE+CROSS, POLO+CLASSIC). O modelo e o outro nome têm pelo menos 3 caracteres e o outro nome tem
  // letra, então só coincidir nas letras não vale: GOL+F, C+ARGO, A+POLO, KA+NGOO, S+UP+ER, PICK+UP.
  const NAO_E_NOME = new Set(["CAPA"]); // palavra comum, não nome: CAPA+CITY (CAPACITY) não é derivado do City
  const ehNome = (x) => x.length >= 3 && /[A-Z]/.test(x) && PALAVRAS.has(x) && !NAO_E_NOME.has(x);
  function derivados(t) {
    t = t.replace(/-/g, "");
    if (t.length < 3 || !/^[A-Z0-9]+$/.test(t)) return [];
    if (!DERIVADOS.has(t)) {
      const r = [];
      for (const w of PALAVRAS) {
        if (w.length <= t.length) continue;
        if ((w.startsWith(t) && ehNome(w.slice(t.length))) || (w.endsWith(t) && ehNome(w.slice(0, -t.length)))) r.push(w);
      }
      DERIVADOS.set(t, r);
    }
    return DERIVADOS.get(t);
  }

  // Palavra inteira (T-0008): "GOL" não casa com "GOLF" (letra depois de letra), mas "1.6" casa com "1.6L" e "HB20"
  // com "HB20X" (a palavra só não pode continuar com o mesmo tipo de caractere: letra ou número). Com hífen, as
  // partes ficam vizinhas: "T-CROSS" casa com "T-CROSS", "T CROSS" e "TCROSS". Com "inicio", vale o começo da
  // palavra ("HOMOC" casa com "HOMOCINÉTICA", "ROLAMENTO" com "ROLAMENTOS"), nos campos de texto do produto, nunca na
  // aplicação, e nunca para nome de veículo (ver ehVeiculo: POLO não vira POLOS, CORSA não vira CORSARIO).
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const classe = (c) => (/[A-Z]/.test(c) ? "A-Z" : /[0-9]/.test(c) ? "0-9" : "");
  function palavra(t, inicio) {
    const a = classe(t[0]), b = classe(t[t.length - 1]);
    const corpo = t.split("-").filter(Boolean).map(reEsc).join("[\\s-]?") || reEsc(t);
    return new RegExp((a ? "(^|[^" + a + "])" : "") + corpo + (b && !inicio ? "(?![" + b + "])" : ""));
  }

  // Campos do produto (todos entram em toda busca) e a nota de cada um, por palavra (decisão do Alexandre, 20/11/2026:
  // código ou referência > descrição > aplicação > marca > categoria e família):
  //   código BAP igual 1000; EAN, referência ou marca+referência iguais 800 (código exato: sempre em 1º, ver buscar);
  //   começo do código BAP 600; pedaço de código, referência ou EAN 400; descrição 50; aplicação e ano 40; marca 30;
  //   categoria, família e os outros campos de texto 20; ano em aplicação que não diz o ano 5 (ver casaPeca).
  // conectivo não precisa casar ("amortecedor para gol" = "amortecedor gol")
  const CONECTIVOS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E", "A", "O", "AS", "OS", "EM", "NO", "NA", "NOS", "NAS", "PARA", "PRA", "P/"]);
  const MARCA_PRODUTO = "BAP"; // todo produto do catálogo é BAP
  const APELIDOS = { CHEVROLET: "GM CHEVY", VOLKSWAGEN: "VW VOLKS", "MERCEDES-BENZ": "MB MERCEDES BENZ", "MERCEDES BENZ": "MB MERCEDES" };
  const RX_MONTADORA = Object.fromEntries(Object.keys(APELIDOS).map((m) => [m, new RegExp("(^|[^A-Z])" + m.replace(/[-\s]/g, "[\\s-]?") + "(?![A-Z])")]));

  // multi = peça de 2 ou mais palavras vizinhas: casa como código inteiro (BAP, referência, EAN) ou como texto; como
  // pedaço de código, só se toda palavra é um grupo de código (tem número e não é veículo, motor nem ano: "33 000",
  // "16900 255S"). Assim "GOL 1.0", "S10 1.4" e "HB20 2015" não viram pedaço de referência e a ordem não muda a lista.
  const grupoDeCodigo = (w) => /\d/.test(w) && !/^\d+[.,]\d+$/.test(w) && !(/[A-Z]/.test(w) && ehVeiculo(normCod(w))) && !(/^\d{4}$/.test(w) && anoOk(+w));
  function peca(t, multi) {
    const limpo = t.replace(/-/g, "");
    const n = /^\d{4}$/.test(limpo) ? +limpo : 0;
    return {
      t, limpo, pc: normCod(t), ano: anoOk(n) ? n : 0, pedaco: !multi || t.split("-").every(grupoDeCodigo),
      agulha: t.split("-").reduce((x, y) => (y.length > x.length ? y : x), ""), // teste rápido antes da regex
      rx: palavra(t),
      rxIni: limpo.length >= 4 && /[A-Z]/.test(limpo) && !ehVeiculo(limpo) ? palavra(t, true) : null,
      rxApl: null, // com os derivados, montado na 1ª vez que precisa
    };
  }
  // nota da peça no produto, ou 0; "parcial" = só casou como pedaço de código
  function casaPeca(e, k, livreAno) {
    let nota = 0, parcial = false;
    if (k.pc.length >= 2 && e.codsTxt.includes(k.pc)) { // codsTxt: teste rápido (todos os códigos juntos)
      if (e.cods[0] === k.pc) nota = 1000;
      else if (e.cods.includes(k.pc) || e.mcods.includes(k.pc) || e.eans.includes(k.pc)) nota = 800;
      else if (!k.ano && k.pedaco && k.pc.length >= 3 && !ehVeiculo(k.limpo)) { // nome de veículo (HB20) não é pedaço de código
        if (e.cods[0].startsWith(k.pc)) nota = 600;
        else if (/\d/.test(k.pc) && (e.cods.some((x) => x.includes(k.pc)) || (k.pc.length >= 6 && e.eans.some((x) => x.includes(k.pc))))) nota = 400;
        parcial = nota > 0;
      }
    }
    let txt = 0;
    if (k.limpo === MARCA_PRODUTO) txt = 30;
    else if (k.ano) {
      const r = casaAno(e, k.ano);
      // a aplicação não diz o ano, mas outra palavra casou com ela ("gol 2018" e "Gol G1 a G4 todos"): entra no fim
      // da lista, como na antiga aba Veículo ("o cliente confere")
      if (r === 1) txt = 40;
      else if (r === -1 && livreAno) txt = 5;
    }
    if (!txt && k.agulha && e.tudo.includes(k.agulha)) { // tudo: teste rápido (todos os campos de texto juntos)
      const casa = (s) => s.includes(k.agulha) && (k.rx.test(s) || (k.rxIni && k.rxIni.test(s)));
      if (casa(e.desc)) txt = 50;
      else if (!k.ano && e.apl.includes(k.agulha)) {
        if (!k.rxApl) k.rxApl = [k.t].concat(derivados(k.t)).map((x) => palavra(x));
        if (k.rxApl.some((rx) => rx.test(e.apl))) txt = 40;
      }
      if (!txt && casa(e.marcas)) txt = 30;
      if (!txt && casa(e.outros)) txt = 20;
    }
    if (txt) parcial = false;
    return nota || txt ? { nota: Math.max(nota, txt), parcial } : null;
  }

  // A função única. Devolve { palavras, total, testar(e) }: testar dá { n: palavras que casaram, nota, bits: quais }.
  function casador(texto) {
    // hífen entre letras = espaço, como no modelo da T-0008 ("SPACE-FOX" = "SPACE FOX"); com número, fica junto
    // ("33-000" = "33000", "F-1000", "15W-40")
    let ps = norm(texto).replace(/([A-Z])-+(?=[A-Z])/g, "$1 ").split(/[\s,;]+/).filter((w) => w.replace(/-/g, ""));
    if (ps.some((w) => !CONECTIVOS.has(w))) ps = ps.filter((w) => !CONECTIVOS.has(w));
    // cada palavra digitada é uma palavra (B1: nada é juntado antes; as peças de palavras vizinhas, abaixo, já
    // cobrem "33 000" e "TRW 16900255S", e a ordem das palavras não muda a lista)
    const toks = ps.map((t) => ({ t, w: 1 }));
    const n = toks.length;
    const palavras = toks.map((x) => x.t);
    // Peça = palavras vizinhas juntas. Com mais de 6 palavras, só sozinhas (como na T-0008). Letra solta (1 caractere)
    // não vale sozinha quando há mais palavras: "L 200" só casa com "L200", "L 200" ou "L-200".
    const vao = n > 6 ? 1 : n;
    const pecas = [];
    for (let i = 0; i < n; i++) {
      pecas.push([]);
      for (let j = i + 1; j <= Math.min(n, i + vao); j++) {
        const t = toks.slice(i, j).map((x) => x.t).join("-");
        pecas[i].push({ t, j, multi: j - i > 1, w: toks.slice(i, j).reduce((s, x) => s + x.w, 0), curta: t.replace(/-/g, "").length < 2 });
      }
    }
    // se não há jeito de cobrir tudo sem letra solta, a letra solta vale (nunca fica sem filtro)
    const cobre = [true];
    for (let i = 0; i < n; i++) if (cobre[i]) for (const q of pecas[i]) if (!q.curta) cobre[q.j] = true;
    const soltaVale = n === 1 || !cobre[n];
    const total = toks.reduce((s, x) => s + x.w, 0);
    // teste rápido por produto: cada "agulha" (o pedaço mais longo da peça) é procurada uma vez só no texto todo
    const agulhas = [];
    for (const lin of pecas) for (const q of lin) {
      q.k = peca(q.t, q.multi);
      q.ag = agulhas.indexOf(q.k.agulha);
      if (q.ag < 0) q.ag = agulhas.push(q.k.agulha) - 1;
      q.livre = q.k.limpo === MARCA_PRODUTO || q.k.ano; // não depende do texto
    }
    const tem = new Uint8Array(agulhas.length);
    const anoAg = agulhas.map((a) => anoOk(/^\d{4}$/.test(a) ? +a : 0));
    const M = n + 1; // melhor caminho por posição e estado (s = 1: a última peça foi só pedaço de código)
    const bn = new Int32Array(2 * M), bnota = new Float64Array(2 * M), bbits = new Int32Array(2 * M);
    const res = pecas.map((lin) => new Array(lin.length));
    function testar(e) {
      let algum = false, aplOutra = false;
      for (let x = 0; x < agulhas.length; x++) {
        tem[x] = agulhas[x] && e.tudo.includes(agulhas[x]) ? 1 : 0;
        if (tem[x]) algum = true;
        if (tem[x] && !anoAg[x] && e.apl.includes(agulhas[x])) aplOutra = true;
      }
      for (let i = 0; i < n; i++) for (let x = 0; x < pecas[i].length; x++) {
        const q = pecas[i][x];
        let r = null;
        if (!(q.curta && !soltaVale) && (tem[q.ag] || q.livre || (q.k.pc.length >= 2 && e.codsTxt.includes(q.k.pc)))) r = casaPeca(e, q.k, aplOutra);
        res[i][x] = r;
        if (r) algum = true;
      }
      if (!algum) return { n: 0, nota: 0, bits: 0, exato: false };
      // alguma palavra (ou palavras juntas) é o código BAP, o EAN ou uma referência, inteiro. Ano (2018) só conta
      // quando é a única palavra: em "gol 2018", a referência AXIOS 2018 não passa na frente.
      let exato = false;
      for (let i = 0; i < n; i++) for (let x = 0; x < pecas[i].length; x++) if (res[i][x] && res[i][x].nota >= 800 && (n === 1 || !pecas[i][x].k.ano)) exato = true;
      // melhor caminho: mais palavras que casaram, depois a nota. Dois pedaços de código vizinhos não valem
      // ("16900 255S" é um código digitado com espaço).
      bn.fill(-1); bn[0] = 0; bnota[0] = 0; bbits[0] = 0;
      const poe = (pos, n2, nota, bits) => {
        if (n2 > bn[pos] || (n2 === bn[pos] && nota > bnota[pos])) { bn[pos] = n2; bnota[pos] = nota; bbits[pos] = bits; }
      };
      for (let i = 0; i < n; i++) for (let s = 0; s < 2; s++) {
        const o = i * 2 + s;
        if (bn[o] < 0) continue;
        poe((i + 1) * 2, bn[o], bnota[o], bbits[o]); // palavra que não casou
        for (let x = 0; x < pecas[i].length; x++) {
          const m = res[i][x];
          if (!m || (s && m.parcial)) continue;
          const q = pecas[i][x];
          let bits = bbits[o];
          for (let y = i; y < q.j; y++) bits |= 1 << Math.min(y, 30);
          poe(q.j * 2 + (m.parcial ? 1 : 0), bn[o] + q.w, bnota[o] + m.nota * q.w, bits);
        }
      }
      const f = bn[2 * n] > bn[2 * n + 1] || (bn[2 * n] === bn[2 * n + 1] && bnota[2 * n] >= bnota[2 * n + 1]) ? 2 * n : 2 * n + 1;
      return { n: bn[f], nota: bnota[f], bits: bbits[f], exato };
    }
    return { palavras, total, testar };
  }

  // A busca da tela: as palavras (casador) e os filtros (sistema, família, linha e categoria, que tiram da lista).
  // Se algum produto casa com todas as palavras, só eles; se nenhum, os que casam com mais palavras (os mais
  // próximos). O produto com o código exato (BAP, EAN ou referência) entra sempre e vem em 1º.
  function buscar(pr) {
    // ve = o veículo que veio da placa (no endereço vai só o veículo, nunca a placa), somado ao termo digitado (q)
    const texto = [pr.get("ve"), pr.get("q")].filter(Boolean).join(" ");
    const cs = texto ? casador(texto) : null;
    const total = cs ? cs.total : 0;
    const sel = (k) => { const v = pr.getAll(k).filter(Boolean); return v.length ? new Set(v) : null; };
    const filtros = { si: sel("si"), fa: sel("fa"), li: sel("li"), ca: sel("ca") };
    // "Meu veículo" (SIMULAÇÃO ?m=): com a chave ligada (vl diferente de 0), só o que serve na marca, modelo, ano e motor
    const vei = SIM_M && pr.get("vm") && pr.get("vl") !== "0" ? { vm: pr.get("vm"), vmo: pr.get("vmo") || "", va: +pr.get("va") || 0, vmt: pr.get("vmt") || "" } : null;
    let out = [], maxN = 0;
    for (const e of INDICE) {
      const p = e.p;
      if (filtros.si && !filtros.si.has(p.si)) continue;
      if (filtros.fa && !filtros.fa.has(p.fa)) continue;
      if (filtros.li && !filtros.li.has(p.li)) continue;
      if (filtros.ca && !filtros.ca.has(p.ca)) continue;
      if (vei && !casaVeiculo(e, vei)) continue;
      const r = cs ? cs.testar(e) : { n: 0, nota: 0, bits: 0, exato: false };
      if (total && !r.n) continue;
      if (r.n > maxN) maxN = r.n;
      out.push([r.n, r.nota, p, r.bits, r.exato ? 1 : 0, p.i ? 1 : 0]);
    }
    // o código exato entra sempre, mesmo casando com menos palavras
    if (total) out = out.filter((x) => x[0] === maxN || x[4]);
    // ordem: código exato, palavras que casaram, nota (o campo em que casou), com foto, código
    out.sort((a, b) => b[4] - a[4] || b[0] - a[0] || b[1] - a[1] || b[5] - a[5] || a[2].c.localeCompare(b[2].c));
    const lista = out.map((x) => x[2]);
    lista.palavras = total;
    lista.casaram = total ? maxN : 0; // menor que palavras: são os mais próximos
    lista.faltam = [];
    if (total && maxN < total && out.length) {
      // palavras que nenhum produto da lista casou (para o aviso na tela)
      let alguma = 0;
      for (const r of out) alguma |= r[3];
      cs.palavras.forEach((t, i) => { if (!(alguma & (1 << Math.min(i, 30)))) lista.faltam.push(t); });
    }
    return lista;
  }

  // Links antigos (aba Veículo e aba Código, até a T-0011) viram a busca nova: #/busca?mo=VOLKSWAGEN&modelo=Gol&ano=2018
  // → #/busca?q=Volkswagen Gol 2018; #/busca?cod=AMT7115 → #/busca?q=AMT7115. Sistema e filtros continuam.
  function rotaAntiga(pr) {
    if (!["cod", "mo", "modelo", "ano"].some((k) => pr.get(k))) return null;
    const n = new URLSearchParams(pr);
    const q = [pr.get("q"), pr.get("cod"), pr.get("mo") && titulo(pr.get("mo")), pr.get("modelo"), pr.get("ano")].filter(Boolean).join(" ");
    ["cod", "mo", "modelo", "ano"].forEach((k) => n.delete(k));
    n.delete("q");
    return Object.assign({ q }, Object.fromEntries(n));
  }

  function contar(lista, campo) {
    const c = new Map();
    for (const p of lista) if (p[campo]) c.set(p[campo], (c.get(p[campo]) || 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }

  // ---------- pedaços de tela ----------
  function fotoHtml(p, grande) {
    if (p.i) return `<img src="img/${encodeURIComponent(p.i)}" alt="${esc(p.c + " · " + p.d)}" loading="${grande ? "eager" : "lazy"}" onerror="(this.closest('.foto-zoom')||this).replaceWith(Object.assign(document.createElement('div'),{className:'sem-foto',innerHTML:'<img src=&quot;assets/logo_escuro.png&quot; alt=&quot;&quot;>Foto em breve'}))">`;
    return `<div class="sem-foto"><img src="assets/logo_escuro.png" alt="">Foto em breve</div>`;
  }
  // Cartão do resultado (T-0014, R-20261120-112520). Na SIMULAÇÃO ?m= (R-20261120-122300), o código vai sobre a foto,
  // no canto inferior direito (não é botão; o código continua no alt da foto e no link do cartão, para leitor de tela).
  // Sem parâmetro fica na linha de texto: a bateria 6dc1d73 procura o link pelo .cod (passo "janela do produto"). a foto só amplia (botão; sem foto, nada); o código e o nome
  // são o link que abre a janela do produto; "+ Detalhes" também abre a janela. Sem botão dentro de link.
  function itemHtml(p) {
    const href = "#/produto/" + encodeURIComponent(p.c);
    return `<article class="item" data-cod="${esc(p.c)}">
      <div class="foto">${p.i ? `<button class="foto-zoom" type="button" aria-haspopup="dialog" aria-label="Ampliar a foto do ${esc(p.c)}">${fotoHtml(p)}</button>` : fotoHtml(p)}
        ${SIM_M ? `<span class="foto-cod" aria-hidden="true">${esc(p.c)}</span>` : ""}</div>
      <div class="corpo">
        <a class="item-link" href="${href}">${SIM_M ? `<span class="cod vh">${esc(p.c)} · </span>` : `<span class="cod">${esc(p.c)}</span>`}
        <span class="desc">${esc(p.d)}</span></a>
        ${p.a ? `<span class="apl">${esc(p.a)}</span>` : ""}
        <div class="item-pe">${refsHtml(p)}
          <a class="bt bt-claro bt-detalhes" href="${href}">+ Detalhes<span class="vh"> do ${esc(p.c)}</span></a></div>
      </div></article>`;
  }

  // Etiquetas do cartão (T-0014): "Ref. Cruzada:" e os códigos. Primeiro o código original da montadora (marca "OEM"
  // ou "CÓD. ORIGINAL", que aparece como "Original"), depois as referências da concorrência, na ordem da base. Cada
  // código é um botão: passar o mouse, focar ou tocar mostra o balão com a marca (R-20261120-120700), sem abrir o produto.
  // Fica fora o código da própria BAP (marca "BAP PN_2", "BAPTA PN" e o código igual ao do produto).
  const MAX_ETIQUETAS = 2; // R-20261120-122300: só 2 no cartão (o OEM primeiro); o resto vira "+N" e fica na janela e na busca
  function codigosConcorrencia(p) {
    const vistos = new Set([normCod(p.c)]);
    const out = [];
    const OEM = /^\s*(OEM|C[ÓO]D(IGO)?\.?\s*ORIGINAL|ORIGINAL)\b\s*[-:/]?\s*/i;
    const ehOem = (x) => OEM.test(x.m || "");
    // nome da marca para o balão: sem " PN", " PN_2" e "CROSS REFERENCIAS - "; o OEM vira "Original" (com a montadora, se vier)
    const marca = (x) => {
      const m = String(x.m || "").trim();
      if (ehOem(x)) { const resto = m.replace(OEM, "").trim(); return "Original" + (resto ? " " + bonito(resto) : ""); }
      const limpa = m.replace(/^CROSS\s+REFER[ÊE]NCIAS?\s*-\s*/i, "").replace(/\s+PN(_\d+)?$/i, "").trim();
      return limpa ? bonito(limpa, true) : "";
    };
    const refs = (p.r || []).filter((x) => x.c && !/^BAP/i.test(x.m || ""));
    for (const x of [...refs.filter(ehOem), ...refs.filter((x) => !ehOem(x))]) {
      // vários códigos no mesmo campo: " / ", ",", ";", "|", quebra de linha ou " OU " (a "/" grudada fica: CU20006/1)
      const pedacos = String(x.c).split(/\s*[;,|\n]\s*|\s+\/\s*|\/\s+|\s+OU\s+/i)
        .map((c) => c.replace(/^[^:]*:\s*/, "").replace(/\s*\([^)]*\)\s*$/, "").trim()) // tira "REFERENCIAS ...:" e "(SCANIA)"
        // separados só por espaço: são vários códigos se todo pedaço tem 5+ caracteres e número ("95941670 90498745");
        // "AK 8071A" e "1 421 186" ficam inteiros
        .flatMap((c) => { const w = c.split(/\s+/); return w.length > 1 && w.every((t) => t.length >= 5 && /\d/.test(t)) ? w : [c]; });
      for (const c of pedacos) {
        const k = normCod(c);
        if (k.length < 3 || vistos.has(k)) continue;
        vistos.add(k);
        out.push({ c, m: marca(x) });
      }
    }
    return out;
  }
  function refsHtml(p) {
    const cods = codigosConcorrencia(p);
    if (!cods.length) return "";
    const extra = Math.max(0, cods.length - MAX_ETIQUETAS);
    return `<div class="refs" data-extra="${extra}"><span class="refs-rot">Ref. Cruzada:</span>${cods.slice(0, MAX_ETIQUETAS).map(({ c, m }) =>
      `<button type="button" class="ref" data-m="${esc(m || "Marca não informada")}" aria-label="Referência cruzada: ${esc((m ? m + " " : "") + c)}"><span>${esc(c)}</span></button>`).join("")}<span class="ref ref-mais"${extra ? "" : " hidden"}>+${extra}</span></div>`;
  }
  // balão da marca da referência cruzada: um só na página, posto junto da etiqueta (mouse, foco ou toque)
  let BALAO = null, BALAO_DE = null;
  function mostrarBalao(bt) {
    if (!BALAO) {
      BALAO = document.createElement("div");
      BALAO.id = "balao-ref"; BALAO.className = "balao"; BALAO.setAttribute("role", "tooltip"); BALAO.hidden = true;
      document.body.appendChild(BALAO);
    }
    if (BALAO_DE && BALAO_DE !== bt) BALAO_DE.removeAttribute("aria-describedby");
    BALAO_DE = bt;
    BALAO.textContent = bt.dataset.m;
    BALAO.hidden = false;
    bt.setAttribute("aria-describedby", "balao-ref");
    const r = bt.getBoundingClientRect(), b = BALAO.getBoundingClientRect();
    const x = Math.max(8, Math.min(window.innerWidth - b.width - 8, r.left + r.width / 2 - b.width / 2));
    const y = r.top - b.height - 8 < 8 ? r.bottom + 8 : r.top - b.height - 8;
    BALAO.style.left = x + window.scrollX + "px"; BALAO.style.top = y + window.scrollY + "px";
  }
  function esconderBalao() {
    if (!BALAO || BALAO.hidden) return;
    BALAO.hidden = true;
    if (BALAO_DE) BALAO_DE.removeAttribute("aria-describedby");
    BALAO_DE = null;
  }
  document.addEventListener("mouseover", (ev) => { const b = ev.target.closest && ev.target.closest(".refs .ref:not(.ref-mais)"); if (b) mostrarBalao(b); });
  document.addEventListener("mouseout", (ev) => { const b = ev.target.closest && ev.target.closest(".refs .ref:not(.ref-mais)"); if (b && b === BALAO_DE && document.activeElement !== b) esconderBalao(); });
  document.addEventListener("focusin", (ev) => { if (ev.target.matches(".refs .ref")) mostrarBalao(ev.target); else esconderBalao(); });
  document.addEventListener("click", (ev) => { const b = ev.target.closest(".refs .ref:not(.ref-mais)"); if (b) mostrarBalao(b); else esconderBalao(); });
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && BALAO && !BALAO.hidden) esconderBalao(); });
  window.addEventListener("scroll", esconderBalao, { passive: true });

  // Mostra as etiquetas que cabem em 2 linhas e troca o resto por "+N". Desempenho (revisão da T-0014): recebe só as
  // caixas que precisam (os cartões novos do "Carregar mais"; no resize, todas) e trabalha em lotes, sem alternar
  // leitura e escrita de layout por cartão: 1) escreve (mostra tudo), 2) lê todas as posições, 3) escreve (esconde e
  // põe o "+N"), 4) confere o "+N" de todas de uma vez e tira mais uma etiqueta só onde ele passou da 2ª linha.
  function ajustarEtiquetas(caixas) {
    const itens = [...caixas].map((box) => ({ box, tags: [...box.querySelectorAll(".ref:not(.ref-mais)")], mais: box.querySelector(".ref-mais"), extra: +box.dataset.extra || 0 }))
      .filter((x) => x.tags.length && x.mais);
    for (const x of itens) { for (const t of x.tags) t.hidden = false; x.mais.hidden = true; } // 1) escrita
    for (const x of itens) { // 2) leitura
      x.limite = x.tags[0].offsetTop + x.tags[0].offsetHeight * 1.5 + 4; // fim da 2ª linha (o topo dela)
      x.vis = x.tags.filter((t) => t.offsetTop <= x.limite);
      x.escondidas = x.tags.length - x.vis.length;
    }
    let abertos = [];
    for (const x of itens) { // 3) escrita
      for (const t of x.tags.slice(x.vis.length)) t.hidden = true;
      if (!x.escondidas && !x.extra) continue;
      x.mais.hidden = false;
      x.mais.textContent = "+" + (x.escondidas + x.extra);
      abertos.push(x);
    }
    for (let volta = 0; abertos.length && volta < MAX_ETIQUETAS; volta++) { // 4) leitura de todas, depois escrita
      const passou = abertos.filter((x) => x.mais.offsetTop > x.limite && x.vis.length > 1);
      for (const x of passou) { x.vis.pop().hidden = true; x.escondidas++; x.mais.textContent = "+" + (x.escondidas + x.extra); }
      abertos = passou;
    }
    for (const x of itens) if (!x.mais.hidden) x.mais.setAttribute("aria-label", "e mais " + (x.escondidas + x.extra));
  }
  let tAjuste = 0;
  window.addEventListener("resize", () => {
    clearTimeout(tAjuste);
    tAjuste = setTimeout(() => requestAnimationFrame(() => ajustarEtiquetas(app.querySelectorAll(".lista .refs"))), 150);
  });

  // Quadro da busca sem abas (R-20261120-112950 e R-20261120-115432, Alexandre): o campo geral (q) e, ao lado, o campo
  // menor da placa, com UM botão "Buscar" para os dois (o Enter em qualquer campo faz o mesmo): só texto → busca o
  // texto; só placa → consulta a placa; os dois → consulta a placa e filtra pelo texto. A placa consultada e o veículo
  // em partes ficam dentro do quadro, embaixo do campo da placa, com o X que tira o veículo da busca.
  const AVISO_PLACA = "Digite a placa e veja as peças do veículo.";
  function montarBusca(container, pr) {
    container.insertAdjacentHTML("beforeend", `<section class="cartao-busca" aria-label="Buscar produtos">
      <form class="form-busca" autocomplete="off" role="search" aria-label="Buscar produtos">
        <div class="bq-campo bq-q">
          <label class="campo-rot" for="campo-q">Código, descrição ou aplicação</label>
          <input id="campo-q" name="q" type="search" enterkeyhint="search" placeholder="Ex.: gol 2007 amortecedor, AMT7115, TRW 16900255S, 15W40">
        </div>
        <div class="bq-campo bq-placa">
          <label class="campo-rot" for="campo-placa">Placa do veículo</label>
          <input id="campo-placa" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="8" enterkeyhint="search" placeholder="Ex.: ABC1D23" aria-describedby="status-placa">
          <div class="placa-veiculo" hidden></div>
          <p class="status-placa" id="status-placa" role="status" aria-live="polite">${AVISO_PLACA}</p>
        </div>
        <div class="bq-bt"><button type="submit" class="bt">Buscar</button></div>
      </form>
    </section>`);
    const cartao = container.querySelector(".cartao-busca");
    const form = cartao.querySelector("form");
    const campoPlaca = cartao.querySelector("#campo-placa");
    const statusPlaca = cartao.querySelector("#status-placa");
    const caixaVeiculo = cartao.querySelector(".placa-veiculo");
    const btBuscar = form.querySelector('button[type="submit"]');
    if (pr && pr.get("q")) form.elements.q.value = pr.get("q");
    // o veículo da busca na tela (ve=): a etiqueta da placa (só da memória desta busca) ou "Veículo", com o X, e as partes
    const ve = (pr && pr.get("ve")) || "";
    if (VEICULO_PLACA && (SIM_M ? chaveVeiculo(pr) !== VEICULO_PLACA.chave : ve !== VEICULO_PLACA.q)) VEICULO_PLACA = null; // a busca na tela já não tem esse veículo (o X dele no quadro): placa e veículo somem da memória
    if (ve) {
      const mem = VEICULO_PLACA;
      const partes = mem && mem.partes;
      const nome = mem && mem.placa ? "Placa: " + mem.placa : "Veículo: " + bonito(ve); // sem a placa: "Veículo: Honda Civic 2008"
      const info = partes ? [partes.marcaModelo, partes.ano, partes.cil, partes.versao].filter(Boolean) : [];
      const tirar = (paraPlaca) => {
        const n = new URLSearchParams(pr); n.delete("ve");
        FILTRO_FOCO = paraPlaca ? { y: 0, sel: "#campo-placa" } : { y: window.scrollY };
        irPara("/busca", n);
      };
      const completo = info.length ? info.join(" ") : bonito(ve);
      const placaTxt = mem && mem.placa ? mem.placa : "";
      {
        caixaVeiculo.innerHTML = `<span class="etq etq-placa"><span>${esc(nome)}</span><button type="button" aria-label="${mem && mem.placa ? "Tirar a placa e o veículo" : "Tirar o veículo"}">✕</button></span>`
          + (info.length ? `<ul class="veiculo" aria-label="Veículo da placa">${info.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
        caixaVeiculo.hidden = false;
        caixaVeiculo.querySelector("button").addEventListener("click", () => tirar(false));
      }
      statusPlaca.hidden = true;
    }
    const aviso = (html) => { statusPlaca.hidden = false; statusPlaca.innerHTML = html; };
    campoPlaca.addEventListener("input", () => { campoPlaca.value = campoPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7); });
    // o termo novo fica com o veículo da placa que já está na tela (a etiqueta "Placa" sai pelo X dela)
    const veAtual = () => (lerRota().caminho === "/busca" ? lerRota().params.get("ve") : "") || "";
    // SIMULAÇÃO ?m=: a busca nova de texto fica com o "Meu veículo" da tela (marca, modelo, ano, motor e a chave)
    const veiAtual = () => { const r = lerRota(); const o = {}; if (r.caminho === "/busca") for (const k of [...VEI_K, "vl"]) if (r.params.get(k)) o[k] = r.params.get(k); return o; };
    let consultando = false;
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (consultando) return;
      if (!campoPlaca.value.trim()) { // só texto (ou nada): busca o texto
        if (VEICULO_PLACA) VEICULO_PLACA.placa = null; // outra busca: a placa some da memória (o veículo continua no filtro)
        irPara("/busca", Object.assign({ ve: veAtual() }, SIM_M ? veiAtual() : {}, { q: form.elements.q.value.trim() }));
        return;
      }
      const placa = campoPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!PLACA_OK.test(placa)) { aviso("<b>Placa inválida.</b> Use o formato ABC1234 ou ABC1D23."); campoPlaca.focus(); return; }
      consultando = true;
      btBuscar.disabled = true;
      cartao.setAttribute("aria-busy", "true");
      aviso("Consultando…");
      const acordando = setTimeout(() => { aviso("Acordando o serviço, aguarde…"); }, PLACAS_ACORDANDO_MS);
      consultarPlaca(placa).then((v) => {
        const achado = veiculoDaPlaca(v);
        if (!achado.q) throw Object.assign(new Error("vazio"), { status: 404 });
        VEICULO_PLACA = Object.assign(achado, { placa }); // a placa fica só aqui, em memória, para a etiqueta
        campoPlaca.value = "";
        // o veículo vai para ve= (a placa não); o termo que está no campo continua junto
        // SIMULAÇÃO ?m=: a placa preenche as listas do "Meu veículo" (marca, modelo, ano, motor) e liga a chave
        const daPlaca = SIM_M ? { vm: achado.bruto.mo, vmo: achado.bruto.modelo, va: achado.bruto.ano, vmt: achado.bruto.cil } : { ve: achado.q };
        if (SIM_M) VEICULO_PLACA.chave = VEI_K.map((k) => daPlaca[k] || "").join("|");
        const novo = new URLSearchParams(Object.entries(Object.assign(daPlaca, { q: form.elements.q.value.trim() })).filter(([, v]) => v));
        if (lerRota().caminho === "/busca" && lerRota().params.toString() === novo.toString()) render();
        else irPara("/busca", novo);
      }).catch((e) => {
        const msg = { 400: "<b>Placa inválida.</b> Use o formato ABC1234 ou ABC1D23.", 404: "<b>Placa não encontrada.</b>",
          429: "<b>Muitas consultas, tente em alguns minutos.</b>" }[e && e.status]
          || "<b>Busca por placa indisponível agora;</b> use a busca por código, descrição ou aplicação.";
        aviso(msg);
      }).finally(() => {
        clearTimeout(acordando);
        consultando = false;
        btBuscar.disabled = false;
        cartao.removeAttribute("aria-busy");
      });
    });
  }

  // ---------- busca por placa (T-0005) ----------
  const PLACA_OK = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/; // ABC1234 (antiga) e ABC1D23 (Mercosul)
  // POST ao serviço; erro HTTP vira { status }; rede, timeout ou resposta estranha vira status 503.
  async function consultarPlaca(placa) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), PLACAS_TIMEOUT_MS);
    try {
      let r;
      try {
        r = await fetch(PLACAS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placa }),
          signal: ctl.signal, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
      } catch (e) { throw Object.assign(new Error("rede"), { status: 503 }); }
      if (!r.ok) throw Object.assign(new Error("HTTP"), { status: [400, 404, 429].includes(r.status) ? r.status : 503 });
      try { return await r.json(); } catch (e) { throw Object.assign(new Error("json"), { status: 503 }); }
    } finally { clearTimeout(t); }
  }
  // Versão do modelo: cilindrada (1.6), válvulas (16V) e siglas de motor/câmbio/acabamento ficam fora do nome.
  const VERSAO = /^(?:\d+[.,]\d+|\d+V|FLEX|TOTALFLEX|TOTAL|MSI|TSI|MPI|MPFI|TFSI|TDI|TURBO|AT|MT|CVT|AUT|MEC|GASOLINA|ALCOOL|DIESEL|CD|CS|CE|4X4|4X2)$/;
  function nomeDoModelo(txt, montadora) {
    let s = norm(txt);
    if (s.includes("/")) s = s.slice(s.indexOf("/") + 1).trim(); // "VW/GOL 1.6 MSI" → "GOL 1.6 MSI"
    const mo = norm(montadora);
    if (mo && s.startsWith(mo + " ")) s = s.slice(mo.length + 1);
    const nome = [];
    for (const w of s.split(/[\s-]+/).filter(Boolean)) {
      if (VERSAO.test(w)) break;
      if (nome.length && !ehVeiculo(w)) break; // 2ª palavra só se for nome de veículo ("GRAND SIENA"; "GOL TRENDLINE" fica GOL)
      nome.push(w);
      if (nome.length === 2) break;
    }
    return nome.join(" ");
  }
  // Montadora como a API manda → nome do catálogo: a tabela MONTADORAS do scripts/gerar_site.py, mais M.BENZ e MBENZ
  // (docs/placas/DESENHO.md, item 7). Nome que não está na tabela fica como veio.
  const MONTADORAS = { "GM": "CHEVROLET", "GENERAL MOTORS": "CHEVROLET", "CHEVROLET/GM": "CHEVROLET", "GM/CHEVROLET": "CHEVROLET",
    "CHEVROLET / GM": "CHEVROLET", "GM / CHEVROLET": "CHEVROLET", "VW": "VOLKSWAGEN", "VOLKS": "VOLKSWAGEN",
    "MB": "MERCEDES-BENZ", "MERCEDES": "MERCEDES-BENZ", "MERCEDES BENZ": "MERCEDES-BENZ", "M.BENZ": "MERCEDES-BENZ",
    "M. BENZ": "MERCEDES-BENZ", "MBENZ": "MERCEDES-BENZ", "CITROEN": "CITROËN", "HYUNDAI / KIA": "HYUNDAI/KIA",
    "HYUNDAI/KIA MOTORS": "HYUNDAI/KIA", "KIA/HYUNDAI": "HYUNDAI/KIA" };
  function montadoraDoCatalogo(txt) {
    const s = norm(txt);
    if (MONTADORAS[s]) return MONTADORAS[s];
    const parte = s.split(/\s*\/\s*|\s+-\s+/)[0]; // "VW - VOLKSWAGEN" → VW
    return MONTADORAS[parte] || parte;
  }
  // Resposta 200 → texto para mostrar ("VOLKSWAGEN GOL 2018/2019 1.6") e q da busca (montadora + modelo + ano_modelo).
  // Cada nome da modelo_lista é uma alternativa (OU): vale o 1º, na ordem, com que algum produto casa com todas as
  // palavras; se nenhum, o 1º da lista. O modelo só entra se a lista vier vazia.
  function veiculoDaPlaca(v) {
    v = v || {};
    const bruta = norm(v.montadora), montadora = montadoraDoCatalogo(v.montadora);
    const lista = Array.isArray(v.modelo_lista) ? v.modelo_lista : String(v.modelo_lista || "").split(/\s*[;,|]\s*/);
    const nome = (x) => { let s = norm(x); for (const m of [bruta, montadora]) if (m && s.startsWith(m + " ")) s = s.slice(m.length + 1); return nomeDoModelo(s, montadora); };
    let nomes = [...new Set(lista.map(nome).filter(Boolean))];
    if (!nomes.length) nomes = [nome(v.modelo)].filter(Boolean);
    const ano = (String(v.ano || "").match(/\d{4}/) || [""])[0];
    const anoModelo = (String(v.ano_modelo || "").match(/\d{4}/) || [""])[0] || ano;
    const qDe = (modelo) => [montadora, modelo, anoModelo].filter(Boolean).join(" ");
    const modelo = nomes.find((m) => { const l = buscar(new URLSearchParams({ q: qDe(m) })); return l.length && l.casaram === l.palavras; }) || nomes[0] || "";
    let cil = String(v.motor || v.cilindradas || "").trim();
    if (/^\d{3,4}$/.test(cil)) cil = (Number(cil) / 1000).toFixed(1); // 1598 (cm³) → 1.6 (o serviço já manda motor "1.6")
    // versão (R-20261120-113625): as palavras do modelo que sobram depois do nome base e sem a cilindrada
    // ("CIVIC LXS 1.8" com modelo_lista ["CIVIC"] → "LXS"); combustível também fica fora
    let resto = norm(v.modelo);
    if (resto.includes("/")) resto = resto.slice(resto.indexOf("/") + 1).trim();
    for (const m of [bruta, montadora]) if (m && resto.startsWith(m + " ")) resto = resto.slice(m.length + 1);
    const base = new Set([modelo, ...lista.map((x) => norm(x))].join(" ").split(/\s+/).filter(Boolean));
    const versao = resto.split(/\s+/).filter((w) => w && !base.has(w) && w !== norm(cil) && !/^\d+[.,]\d+$/.test(w)
      && !/^(FLEX|TOTALFLEX|GASOLINA|ALCOOL|ÁLCOOL|DIESEL|GNV)$/.test(w)).join(" ");
    const partes = { marcaModelo: bonito([montadora, modelo].filter(Boolean).join(" ")), ano: anoModelo, cil, versao: bonito(versao, true) };
    return {
      q: qDe(modelo),
      texto: [partes.marcaModelo, partes.ano, partes.cil, partes.versao].filter(Boolean).join(" "),
      partes,
      bruto: { mo: montadora, modelo, ano: anoModelo, cil: /^\d+[.,]\d$/.test(cil) ? cil.replace(",", ".") : "" }, // para o "Meu veículo" (SIMULAÇÃO ?m=)
    };
  }
  // Exibição sem caixa alta ("Honda Civic", "Volkswagen Gol", "Mercedes-Benz Atego"); siglas ficam: VW, GM, BMW...,
  // palavra com número (HB20, 16V, 208), pedaço curto com hífen (CR-V) e, na versão, as de 2 a 4 letras (LXS, HX, GLI).
  // Só para mostrar: a busca continua com o texto da base.
  const SIGLAS = new Set(["VW", "GM", "BMW", "BYD", "JAC", "GWM", "MG", "DS", "RAM", "CAOA", "JCB", "DAF", "MAN", "AGCO"]);
  function bonito(txt, versao) {
    return String(txt || "").toUpperCase().replace(/\s+/g, " ").trim().replace(/[A-ZÀ-Ý0-9.]+/g, (w, i, todo) => {
      if (SIGLAS.has(w) || /\d/.test(w)) return w;
      if (versao && w.length <= 4) return w;
      if (w.length <= 2 && (todo[i - 1] === "-" || todo[i + w.length] === "-")) return w;
      return w.charAt(0) + w.slice(1).toLowerCase();
    });
  }

  // ---------- telas ----------
  function telaInicio() {
    const sistemas = contar(BASE.produtos, "si");
    const comFoto = BASE.produtos.filter((p) => p.i).length;
    app.innerHTML = `
      <section class="hero">
        <div class="hero-in">
          <div>
            <h1>Encontre a peça certa<br>com a <em>qualidade BAP</em></h1>
            <p>Busque pelo código BAP, pela referência do concorrente ou do original, pelo veículo ou pela aplicação.</p>
            <div class="hero-num">
              <div><b>${fmt(BASE.total)}</b><span>produtos no catálogo</span></div>
              <div><b>${fmt(sistemas.length)}</b><span>sistemas</span></div>
              <div><b>${fmt(comFoto)}</b><span>com foto</span></div>
            </div>
          </div>
          <div class="hero-fotos" aria-hidden="true">
            <img class="f1" src="assets/hero.png" alt="">
            <img class="f2" src="assets/card2.png" alt="">
          </div>
        </div>
      </section>
      <div id="busca-home"></div>
      <section class="bloco">
        <h2>Navegue por sistema</h2>
        <p class="sub">Toque em um sistema para ver todos os produtos dele.</p>
        <div class="sistemas">${sistemas.map(([s, n]) => `<a class="sistema" href="#/busca?si=${encodeURIComponent(s)}"><i></i><b>${esc(titulo(s))}</b><span>${fmt(n)} produtos</span></a>`).join("")}</div>
      </section>
      <section class="bloco">
        <h2>Fique por dentro</h2>
        <p class="sub">Linhas em destaque no portfólio BAP.</p>
        <div class="novidades">
          <a class="novidade" href="#/busca?si=TRANSMISS%C3%83O"><div class="img"><img src="assets/card2.png" alt="Kit de embreagem BAP" loading="lazy"></div><div class="txt"><h3>Transmissão e embreagem</h3><p>Kits de embreagem, atuadores e rolamentos para linha leve e pesada.</p><span class="ver">Ver produtos →</span></div></a>
          <a class="novidade" href="#/busca?ca=LUBRIFICANTES"><div class="img"><img src="assets/card3.png" alt="Óleos BAP ProActive" loading="lazy"></div><div class="txt"><h3>Lubrificantes BAP ProActive</h3><p>Óleos sintéticos, semissintéticos e minerais para o seu motor.</p><span class="ver">Ver produtos →</span></div></a>
          <a class="novidade" href="#/busca?si=FREIO"><div class="img"><img src="assets/card4.png" alt="Catraca de freio BAP" loading="lazy"></div><div class="txt"><h3>Freio</h3><p>Pastilhas, discos, tambores e catracas com a garantia BAP.</p><span class="ver">Ver produtos →</span></div></a>
        </div>
      </section>`;
    montarBusca(document.getElementById("busca-home"));
  }

  function telaBusca(pr) {
    const todos = buscar(pr);
    let mostrando = 0;
    const desc = [];
    if (pr.get("ve")) desc.push(VEICULO_PLACA && VEICULO_PLACA.q === pr.get("ve") ? VEICULO_PLACA.texto : pr.get("ve"));
    if (pr.get("q")) desc.push(`“${pr.get("q")}”`);
    app.innerHTML = `<div class="pagina-busca"><div id="busca-topo"></div>
      <div class="barra-filtros" role="group" aria-label="Filtros"></div>
      <div class="etiquetas" role="group" aria-label="Filtros da pesquisa" hidden></div>
      <div class="res-topo"><h1>${desc.length ? "Resultados para " + esc(desc.join(" · ")) : "Todos os produtos"}</h1>
        <span class="total" aria-live="polite">${fmt(todos.length)} produto${todos.length === 1 ? "" : "s"}</span></div>
      ${todos.length && todos.casaram < todos.palavras ? `<p class="aviso proximos" role="status" style="margin:0 0 14px;font-size:14px"><b>Nenhum produto tem todas as palavras.</b> Estes são os mais próximos: casam com ${fmt(todos.casaram)} de ${fmt(todos.palavras)} palavras${todos.faltam.length ? `. Não casou: ${todos.faltam.map((t) => `“${esc(t.toLowerCase())}”`).join(", ")}` : ""}.</p>` : ""}
      <div class="lista"></div><div class="mais"></div></div>`;
    montarBusca(document.getElementById("busca-topo"), pr);
    montarFiltros(pr, todos);
    if (SIM_M) arrumarModelo(pr, todos);
    const lista = app.querySelector(".lista");
    const mais = app.querySelector(".mais");
    // insere os próximos cartões e ajusta as etiquetas só deles (a volta à lista insere todos de uma vez)
    function pagina(qtd = POR_PAGINA) {
      const ini = lista.children.length;
      lista.insertAdjacentHTML("beforeend", todos.slice(mostrando, mostrando + qtd).map(itemHtml).join(""));
      mostrando = Math.min(todos.length, mostrando + qtd);
      ajustarEtiquetas([...lista.children].slice(ini).map((c) => c.querySelector(".refs")).filter(Boolean));
      mais.innerHTML = mostrando < todos.length ? `<button class="bt bt-claro" type="button">Carregar mais (${fmt(todos.length - mostrando)} restantes)</button>` : "";
    }
    mais.addEventListener("click", () => pagina());
    lista.addEventListener("click", (ev) => { const bz = ev.target.closest(".foto-zoom"); if (bz) abrirZoom(bz); });
    if (!todos.length) {
      lista.outerHTML = `<div class="vazio"><b>Nenhum produto encontrado</b>Confira o código ou tente menos palavras (sem o ano, por exemplo).</div>`;
    } else pagina();
    // volta do produto (T-0014): reabre a mesma lista com os mesmos cartões carregados e a mesma rolagem
    const volta = VOLTA_LISTA && VOLTA_LISTA.hash === location.hash ? VOLTA_LISTA : null;
    VOLTA_LISTA = null;
    if (volta && volta.n > mostrando) pagina(Math.min(volta.n, todos.length) - mostrando);
    ESTADO_LISTA = { hash: location.hash, n: () => mostrando };
    // depois de marcar um filtro ou tirar uma etiqueta: a página fica onde estava e o foco volta à barra
    const ff = FILTRO_FOCO; FILTRO_FOCO = null;
    if (ff && !volta) {
      let alvo = null;
      if (ff.painel) abrirPainel();
      if (ff.sel) alvo = app.querySelector(ff.sel);
      else if (ff.k) {
        const box = app.querySelector(`.filtro[data-k="${ff.k}"]`);
        if (box) { abrirFiltro(box); alvo = [...box.querySelectorAll("input")].find((x) => x.value === ff.v) || box.querySelector(".filtro-bt"); }
      } else alvo = app.querySelector(".etiquetas:not([hidden]) button") || app.querySelector(".barra-filtros .filtro-bt") || app.querySelector("#campo-q");
      return { y: ff.y, alvo };
    }
    return volta;
  }

  // ---------- barra de filtros e etiquetas (R-20261120-113148, Alexandre) ----------
  // No lugar do painel lateral: uma barra horizontal abaixo da busca, um botão por grupo (Sistema, Família, Linha,
  // Categoria) que abre a lista de opções com a contagem e caixas de marcar (uma ou mais). Mesma lógica de antes:
  // si=, fa=, li= e ca= no endereço (repetidos quando há mais de um) e a contagem sobre o resultado sem o próprio
  // filtro. Abaixo, as etiquetas do termo (q) e de cada filtro marcado, com o X, e o "Limpar tudo". A placa e o
  // veículo ficam no quadro da busca (montarBusca).
  const ROT_FILTRO = { si: "Sistema", fa: "Família", li: "Linha", ca: "Categoria" };
  let FILTRO_FOCO = null; // { k, v, y }: o que reabrir e focar depois de refazer a lista
  const fixo = (box) => !!box.closest(".lado-filtros, dialog.painel-c"); // na coluna ou no painel: grupos sempre abertos
  function abrirFiltro(box) {
    if (!fixo(box)) fecharFiltros(box);
    box.querySelector(".filtro-lista").hidden = false;
    box.querySelector(".filtro-bt").setAttribute("aria-expanded", "true");
  }
  function fecharFiltros(menos) {
    for (const b of app.querySelectorAll(".filtro")) {
      if (b === menos || fixo(b)) continue;
      b.querySelector(".filtro-lista").hidden = true;
      b.querySelector(".filtro-bt").setAttribute("aria-expanded", "false");
    }
  }
  document.addEventListener("click", (ev) => { if (!ev.target.closest(".filtro")) fecharFiltros(); });
  function montarFiltros(pr, todos) {
    const barra = app.querySelector(".barra-filtros");
    barra.innerHTML = Object.keys(ROT_FILTRO).map((k) => {
      const marcados = pr.getAll(k).filter(Boolean);
      const semEste = new URLSearchParams(pr); semEste.delete(k);
      const base = marcados.length ? buscar(semEste) : todos;
      const op = contar(base, k).slice(0, 40);
      for (const v of marcados) if (!op.some(([x]) => x === v)) op.push([v, 0]);
      if (!op.length) return "";
      return `<div class="filtro" data-k="${k}">
        <button class="filtro-bt${marcados.length ? " ativo" : ""}" type="button" aria-expanded="false" aria-controls="filtro-${k}"><span>${ROT_FILTRO[k]}${marcados.length ? ` <b>(${marcados.length})</b>` : ""}</span><span class="seta" aria-hidden="true">▾</span></button>
        <div class="filtro-lista" id="filtro-${k}" role="group" aria-label="${ROT_FILTRO[k]}" hidden>${op.map(([v, n]) =>
          `<label><input type="checkbox" value="${esc(v)}"${marcados.includes(v) ? " checked" : ""}><span>${esc(titulo(v))}</span><em>${fmt(n)}</em></label>`).join("")}</div></div>`;
    }).join("");
    for (const box of barra.querySelectorAll(".filtro")) {
      const k = box.dataset.k, bt = box.querySelector(".filtro-bt");
      bt.addEventListener("click", () => {
        const aberto = bt.getAttribute("aria-expanded") === "true";
        if (fixo(box)) { box.querySelector(".filtro-lista").hidden = aberto; bt.setAttribute("aria-expanded", String(!aberto)); return; } // recolhe só este grupo
        if (aberto) fecharFiltros(); else { abrirFiltro(box); const c = box.querySelector("input"); if (c) c.focus(); }
      });
      box.addEventListener("keydown", (ev) => { if (!fixo(box) && ev.key === "Escape" && bt.getAttribute("aria-expanded") === "true") { ev.preventDefault(); fecharFiltros(); bt.focus(); } });
      box.addEventListener("change", (ev) => {
        const n = new URLSearchParams(pr);
        const vals = [...box.querySelectorAll("input:checked")].map((x) => x.value);
        n.delete(k); vals.forEach((v) => n.append(k, v));
        if (k === "si" && n.getAll("fa").length) { // a família que não existe nos sistemas marcados sai (como antes, ao trocar o sistema)
          const semFa = new URLSearchParams(n); semFa.delete("fa");
          const fas = new Set(buscar(semFa).map((p) => p.fa));
          const manter = n.getAll("fa").filter((v) => fas.has(v));
          n.delete("fa"); manter.forEach((v) => n.append("fa", v));
        }
        FILTRO_FOCO = { k, v: ev.target.value, y: window.scrollY, painel: painelAberto() };
        irPara("/busca", n);
      });
    }
    // etiquetas abaixo da barra: só o termo e os filtros marcados (a placa e o veículo ficam no quadro da busca)
    const etq = app.querySelector(".etiquetas");
    const itens = [];
    const q = pr.get("q");
    if (q) itens.push({ nome: "Busca: “" + q + "”", tirar: (n) => n.delete("q") });
    for (const k of Object.keys(ROT_FILTRO)) for (const v of pr.getAll(k).filter(Boolean))
      itens.push({ nome: ROT_FILTRO[k] + ": " + titulo(v), tirar: (n) => { const r = n.getAll(k).filter((x) => x !== v); n.delete(k); r.forEach((x) => n.append(k, x)); } });
    if (!itens.length) return;
    etq.hidden = false;
    etq.innerHTML = itens.map((it, i) => `<span class="etq"><span>${esc(it.nome)}</span><button type="button" data-i="${i}" aria-label="${esc("Tirar " + it.nome)}">✕</button></span>`).join("")
      + (itens.length >= 2 ? `<button class="limpar-tudo" type="button">Limpar tudo</button>` : "");
    etq.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      const n = new URLSearchParams(pr);
      if (b.classList.contains("limpar-tudo")) { n.delete("q"); Object.keys(ROT_FILTRO).forEach((k) => n.delete(k)); } // o veículo sai pelo X dele, no quadro
      else itens[+b.dataset.i].tirar(n);
      FILTRO_FOCO = { y: window.scrollY };
      irPara("/busca", n);
    });
  }

  // ---------- SIMULAÇÃO do modelo de filtros (?m=A|B, R-20261120-122100) ----------
  // As listas do "Meu veículo" são montadas aqui, em JavaScript, a partir do produtos.json de hoje: a marca do campo
  // mo, o modelo das palavras de veículo da aplicação (a), o ano das faixas da aplicação e o motor dos números "1.8"
  // da aplicação. É SÓ PARA A SIMULAÇÃO: o filtro de verdade virá da coluna de veículo da base (T-0017).
  const painelAberto = () => !!app.querySelector("dialog.painel-c[open]");
  function abrirPainel() {
    const dlg = app.querySelector("dialog.painel-c");
    if (dlg && !dlg.open) dlg.showModal(); // fundo escurecido e foco preso
  }
  function fecharPainel() {
    const dlg = app.querySelector("dialog.painel-c");
    if (dlg && dlg.open) dlg.close();
    const b = app.querySelector(".bt-filtrar");
    if (b) b.focus();
  }
  const ANO_HOJE = 2026;
  const PARA_FORA = new Set(["EXC", "FURGAO", "PICK", "UP", "SEDAN", "HATCH", "CHASSI", "MOD", "NOVO", "NOVA", "CABINE", "TODOS",
    "TODAS", "DIANT", "TRAS", "LINHA", "MOTOR", "GERACAO", "FASE", "SERIE", "VERSAO", "COM", "SEM", "ATE", "DIESEL", "FLEX",
    "GASOLINA", "TURBO", "AUT", "MEC", "WAGON", "VAN", "CARGO", "DUPLA", "SIMPLES", "CAB", "ESQ", "DIR", "SPORT", "CLASSIC",
    "AGRICOLA", "TRATOR", "ONIBUS", "CAMINHAO", "MICRO", "UTILITARIO", "MODELOS", "ANO", "ANOS", "APOS", "ANTES", "DESDE", "EM", "DIANTE"]);
  const RX_PALAVRA = new Map();
  const temPalavra = (txt, w) => { if (!RX_PALAVRA.has(w)) RX_PALAVRA.set(w, new RegExp("(^|[^A-Z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^A-Z0-9])")); return RX_PALAVRA.get(w).test(txt); };
  const marcasDe = (e) => norm(e.p.mo).split(/\s*[\/,]\s*/).filter(Boolean);
  const motoresDe = (e) => [...new Set((e.apl.match(/\b\d[.,]\d\b/g) || []).map((m) => m.replace(",", ".")))];
  const anoServe = (e, ano) => !e.faixas.length || e.faixas.some(([de, ate]) => (de || 0) <= ano && ano <= (ate || ANO_HOJE));
  function casaVeiculo(e, v) {
    if (!marcasDe(e).includes(v.vm) && !temPalavra(e.apl, v.vm)) return false;
    if (v.vmo && !temPalavra(e.apl, v.vmo)) return false;
    if (v.va && !anoServe(e, v.va)) return false;
    if (v.vmt) { const m = motoresDe(e); if (m.length && !m.includes(v.vmt)) return false; } // sem motor na aplicação: serve
    return true;
  }
  // opções de cada lista, só com o que existe para a escolha anterior, com a contagem de produtos
  function opcoesVeiculo(v) {
    const conta = (lista) => { const c = new Map(); for (const [k, n] of lista) c.set(k, (c.get(k) || 0) + n); return c; };
    const marcas = new Map(), modelos = new Map(), anos = new Map(), motores = new Map();
    let semMotor = 0;
    for (const e of INDICE) {
      for (const m of marcasDe(e)) marcas.set(m, (marcas.get(m) || 0) + 1);
      if (!v.vm || !(marcasDe(e).includes(v.vm) || temPalavra(e.apl, v.vm))) continue;
      // modelo: o que vem logo depois da marca na aplicação ("HONDA - Civic · ...", "VW - Gol / Saveiro · ..."), 1ª palavra de cada pedaço
      const ws = new Set();
      for (const mt of e.apl.matchAll(new RegExp("(?:^|[^A-Z])" + v.vm + "\\s*[-:]?\\s*([^·;(]+)", "g")))
        for (const pd of mt[1].split("/")) { const w = (pd.trim().match(/^[A-Z][A-Z0-9]+/) || [""])[0]; if (w.length >= 2 && !VERSAO.test(w) && !PARA_FORA.has(w) && w !== v.vm) ws.add(w); }
      for (const w of ws) modelos.set(w, (modelos.get(w) || 0) + 1);
      if (!v.vmo || !temPalavra(e.apl, v.vmo)) continue;
      const fx = e.faixas.length ? e.faixas : [[1980, ANO_HOJE]];
      const vistos = new Set();
      for (const [de, ate] of fx) for (let a = Math.max(1980, de || 1980); a <= Math.min(ANO_HOJE, ate || ANO_HOJE); a++) vistos.add(a);
      for (const a of vistos) anos.set(a, (anos.get(a) || 0) + 1);
      if (!v.va || !anoServe(e, v.va)) continue;
      const ms = motoresDe(e);
      if (!ms.length) semMotor++;
      for (const m of ms) motores.set(m, (motores.get(m) || 0) + 1);
    }
    // motor que veio da placa e não está escrito na aplicação: entra com os produtos que não dizem o motor
    if (v.vmt && !motores.has(v.vmt)) motores.set(v.vmt, 0);
    if (semMotor) for (const k of motores.keys()) motores.set(k, motores.get(k) + semMotor);
    const top = (m, n) => [...m.entries()].filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1]).slice(0, n);
    return {
      vm: top(marcas, 60).sort((a, b) => a[0].localeCompare(b[0])),
      vmo: top(modelos, 80).filter(([x, q]) => q >= 2 || x === v.vmo).sort((a, b) => a[0].localeCompare(b[0])), // SIMULAÇÃO: tira o que aparece 1 vez só
      va: [...anos.entries()].sort((a, b) => b[0] - a[0]),
      vmt: [...motores.entries()].filter(([, q]) => q > 0).sort((a, b) => a[0].localeCompare(b[0])),
    };
  }
  function meuVeiculoHtml(pr) {
    const v = { vm: pr.get("vm") || "", vmo: pr.get("vmo") || "", va: +pr.get("va") || 0, vmt: pr.get("vmt") || "" };
    const ligado = !!v.vm && pr.get("vl") !== "0";
    const op = opcoesVeiculo(v);
    const mem = VEICULO_PLACA && VEICULO_PLACA.chave === chaveVeiculo(pr) ? VEICULO_PLACA : null;
    const lista = (k, rot, todos, valor, ativo, fmtV) => `<label class="mv-campo"><span>${rot}</span>
      <select data-k="${k}"${ativo ? "" : " disabled"}><option value="">${todos}</option>${op[k].map(([x, n]) =>
        `<option value="${esc(String(x))}"${String(x) === String(valor) ? " selected" : ""}>${esc(fmtV(x))} (${fmt(n)})</option>`).join("")}</select></label>`;
    return `<section class="meu-veiculo${ligado ? " ligado" : ""}" aria-label="Meu veículo">
      <div class="mv-cab"><span class="mv-tit">Meu veículo</span>
        <label class="chave"><input type="checkbox" role="switch" class="mv-chave"${ligado ? " checked" : ""}${v.vm ? "" : " disabled"}><span class="chave-trilho" aria-hidden="true"></span><span class="vh">Filtrar pelo meu veículo</span></label></div>
      ${mem && mem.placa ? `<p class="mv-placa">Pela placa <b>${esc(mem.placa)}</b>${mem.partes && mem.partes.versao ? ` · versão ${esc(mem.partes.versao)}` : ""}</p>` : ""}
      <div class="mv-listas">
        ${lista("vm", "Marca", "Todas as marcas", v.vm, true, (x) => bonito(x))}
        ${lista("vmo", "Modelo", "Todos os modelos", v.vmo, !!v.vm, (x) => bonito(x))}
        ${lista("va", "Ano", "Todos os anos", v.va || "", !!v.vmo, (x) => String(x))}
        ${lista("vmt", "Motor/Versão", "Todos os motores", v.vmt, !!v.va, (x) => String(x))}
      </div>
      ${v.vm ? `<button type="button" class="mv-trocar">Trocar veículo <span aria-hidden="true">✕</span></button>` : ""}
    </section>`;
  }
  function ligarMeuVeiculo(raiz, pr) {
    const sec = raiz.querySelector(".meu-veiculo");
    if (!sec) return;
    sec.addEventListener("change", (ev) => {
      const n = new URLSearchParams(pr);
      if (ev.target.matches(".mv-chave")) {
        if (ev.target.checked) n.delete("vl"); else n.set("vl", "0"); // desligada: mostra tudo sem perder as escolhas
        FILTRO_FOCO = { y: window.scrollY, sel: ".mv-chave", painel: painelAberto() };
        irPara("/busca", n);
        return;
      }
      const k = ev.target.dataset.k;
      if (!k) return;
      const i = VEI_K.indexOf(k);
      VEI_K.slice(i).forEach((x) => n.delete(x)); // a escolha nova limpa as listas de baixo
      if (ev.target.value) n.set(k, ev.target.value);
      n.delete("vl");
      FILTRO_FOCO = { y: window.scrollY, sel: `select[data-k="${VEI_K[Math.min(i + 1, 3)]}"]:not([disabled]), select[data-k="${k}"]`, painel: painelAberto() };
      irPara("/busca", n);
    });
    const tr = sec.querySelector(".mv-trocar");
    if (tr) tr.addEventListener("click", () => { // "Trocar veículo": limpa as listas (e a placa some da memória)
      const n = new URLSearchParams(pr);
      [...VEI_K, "vl"].forEach((x) => n.delete(x));
      FILTRO_FOCO = { y: 0, sel: "#campo-placa" };
      irPara("/busca", n);
    });
  }
  function departamentosHtml(pr) {
    const base = new URLSearchParams(pr); ["si", "fa"].forEach((k) => base.delete(k));
    const link = (extra) => { const n = new URLSearchParams(base); for (const [k, v] of Object.entries(extra)) n.set(k, v); const qs = n.toString(); return "#/busca" + (qs ? "?" + qs : ""); };
    const sis = contar(INDICE.map((e) => e.p), "si");
    const si = pr.getAll("si"), fa = pr.getAll("fa");
    const caminho = [`<a href="${link({})}">Todos</a>`];
    if (si.length === 1) caminho.push(`<a href="${link({ si: si[0] })}">${esc(titulo(si[0]))}</a>`);
    if (si.length === 1 && fa.length === 1) caminho.push(`<span>${esc(titulo(fa[0]))}</span>`);
    return `<div class="deptos-linha">
      <div class="deptos"><button type="button" class="deptos-bt" aria-expanded="false" aria-controls="deptos-lista">Departamentos <span aria-hidden="true">▾</span></button>
        <ul class="deptos-lista" id="deptos-lista" hidden>
          <li><a href="${link({})}"${si.length ? "" : ' aria-current="true"'}>Todos <em>${fmt(INDICE.length)}</em></a></li>
          ${sis.map(([v, n]) => `<li><a href="${link({ si: v })}"${si.length === 1 && si[0] === v ? ' aria-current="true"' : ""}>${esc(titulo(v))} <em>${fmt(n)}</em></a></li>`).join("")}
        </ul></div>
      <nav class="trilha deptos-trilha" aria-label="Você está em">${caminho.join('<span aria-hidden="true">›</span>')}</nav></div>`;
  }
  function arrumarModelo(pr, todos) {
    const pagina = app.querySelector(".pagina-busca");
    const barra = app.querySelector(".barra-filtros");
    const etqs = app.querySelector(".pagina-busca .etiquetas");
    const topo = app.querySelector(".res-topo");
    const cel = CELULAR_SIM();
    const nMarcados = Object.keys(ROT_FILTRO).reduce((t, k) => t + pr.getAll(k).filter(Boolean).length, 0);
    // "N produtos encontrados"
    const total = topo.querySelector(".total");
    total.textContent = fmt(todos.length) + " produto" + (todos.length === 1 ? "" : "s") + " encontrado" + (todos.length === 1 ? "" : "s");
    // Departamentos e o caminho, no alto
    pagina.insertAdjacentHTML("afterbegin", departamentosHtml(pr));
    const dbt = pagina.querySelector(".deptos-bt"), dl = pagina.querySelector(".deptos-lista");
    const fecharDeptos = () => { dl.hidden = true; dbt.setAttribute("aria-expanded", "false"); };
    dbt.addEventListener("click", (ev) => { ev.stopPropagation(); const a = dl.hidden; dl.hidden = !a; dbt.setAttribute("aria-expanded", String(a)); if (a) dl.querySelector("a").focus(); });
    pagina.querySelector(".deptos").addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !dl.hidden) { fecharDeptos(); dbt.focus(); } });
    document.addEventListener("click", (ev) => { if (dl.isConnected && !ev.target.closest(".deptos")) fecharDeptos(); });
    // faixa curta do veículo (celular no A): acima da lista
    const v = { vm: pr.get("vm"), vmo: pr.get("vmo"), va: pr.get("va"), vmt: pr.get("vmt") };
    const faixaCurta = () => {
      if (!v.vm) return;
      const mem = VEICULO_PLACA && VEICULO_PLACA.chave === chaveVeiculo(pr) ? VEICULO_PLACA : null;
      const txt = [bonito(v.vm), v.vmo && bonito(v.vmo), v.va, v.vmt].filter(Boolean).join(" ");
      topo.insertAdjacentHTML("beforebegin", `<div class="faixa-veiculo"><span>${pr.get("vl") === "0" ? "Mostrando tudo (veículo desligado): " : "Peças para "}<b>${esc(txt)}</b>${mem && mem.placa ? ` · Placa <b class="placa-txt">${esc(mem.placa)}</b>` : ""}</span><button type="button" class="faixa-x">Trocar veículo <span aria-hidden="true">✕</span></button></div>`);
      topo.previousElementSibling.querySelector(".faixa-x").addEventListener("click", () => { const n = new URLSearchParams(pr); [...VEI_K, "vl"].forEach((x) => n.delete(x)); FILTRO_FOCO = { y: 0, sel: "#campo-placa" }; irPara("/busca", n); });
    };
    // o painel por cima (celular): "Meu veículo e filtros" no A, "Filtrar (n)" no B
    const painel = (rotulo, corpo) => {
      topo.querySelector("h1").insertAdjacentHTML("afterend", `<button type="button" class="bt bt-claro bt-mini bt-filtrar" aria-haspopup="dialog">${rotulo}</button>`);
      const dlg = document.createElement("dialog");
      dlg.className = "painel-c";
      dlg.setAttribute("aria-labelledby", "painel-c-tit");
      dlg.innerHTML = `<div class="painel-cab"><b id="painel-c-tit">${rotulo.replace(/\s*\(\d+\)$/, "")}</b><button type="button" class="painel-x" aria-label="Fechar">✕</button></div>
        <div class="painel-corpo"></div>
        <div class="painel-pe"><button type="button" class="bt painel-ok">Ver ${fmt(todos.length)} produto${todos.length === 1 ? "" : "s"}</button></div>`;
      corpo.forEach((el) => dlg.querySelector(".painel-corpo").appendChild(el));
      pagina.appendChild(dlg);
      topo.querySelector(".bt-filtrar").addEventListener("click", abrirPainel);
      dlg.querySelector(".painel-x").addEventListener("click", fecharPainel);
      dlg.querySelector(".painel-ok").addEventListener("click", fecharPainel);
      dlg.addEventListener("click", (ev) => { if (ev.target === dlg) fecharPainel(); });
      dlg.addEventListener("cancel", (ev) => { ev.preventDefault(); fecharPainel(); });
      return dlg;
    };
    const abrirGrupos = (raiz) => raiz.querySelectorAll(".filtro").forEach((b) => { b.querySelector(".filtro-lista").hidden = false; b.querySelector(".filtro-bt").setAttribute("aria-expanded", "true"); });
    const tituloLado = pr.getAll("si").length === 1 ? titulo(pr.get("si")) : "Todos os produtos";
    if (SIM_M === "A") {
      const lado = document.createElement("aside");
      lado.className = "lado-filtros";
      lado.setAttribute("aria-label", "Meu veículo e filtros");
      lado.innerHTML = `<p class="lado-tit">${esc(tituloLado)}</p>${meuVeiculoHtml(pr)}<p class="lado-sub">Filtros</p>`;
      lado.appendChild(barra);
      ligarMeuVeiculo(lado, pr);
      if (cel) {
        faixaCurta();
        painel("Meu veículo e filtros" + (nMarcados ? ` (${nMarcados})` : ""), [lado]);
      } else {
        const grade = document.createElement("div");
        grade.className = "res-grade";
        const conteudo = document.createElement("div");
        conteudo.className = "res-conteudo";
        const depois = [...pagina.children].filter((el) => el.compareDocumentPosition(etqs) & Node.DOCUMENT_POSITION_PRECEDING && !el.matches("dialog"));
        etqs.after(grade);
        grade.appendChild(lado);
        grade.appendChild(conteudo);
        depois.forEach((el) => conteudo.appendChild(el));
      }
      abrirGrupos(lado);
      return;
    }
    // B: o "Meu veículo" deitado numa faixa abaixo do quadro da busca; os filtros na 2ª linha (no celular, no botão)
    const faixa = document.createElement("section");
    faixa.className = "faixa-modelo";
    faixa.setAttribute("aria-label", "Meu veículo e filtros");
    faixa.innerHTML = meuVeiculoHtml(pr);
    ligarMeuVeiculo(faixa, pr);
    document.getElementById("busca-topo").after(faixa);
    if (cel) { const dlg = painel("Filtrar" + (nMarcados ? ` (${nMarcados})` : ""), [barra]); abrirGrupos(dlg); }
    else faixa.appendChild(barra);
  }

  function listaCodigos(txt) {
    return String(txt || "").split(/\s*[·,;/|]\s*|\s+/).map((c) => c.trim()).filter((c) => c && POR_COD.has(normCod(c)));
  }

  // Conteúdo do produto (T-0014), igual na página e na janela. Na janela os títulos descem um nível
  // (h2 e h3), porque a lista por trás já tem o h1. A ficha de impressão (A4) sai deste mesmo conteúdo.
  function produtoHtml(p, naJanela) {
    const H = naJanela ? "h2" : "h1", H2 = naJanela ? "h3" : "h2";
    const aplicacoes = String(p.a || "").split(/\s+·\s+(?=[A-ZÀ-Úa-zà-ú0-9])/).length > 1 && (p.a || "").length > 160
      ? `<ul class="aplic">${p.a.split(/\s+·\s+/).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${esc(p.a)}</p>`;
    const refs = (p.r || []).filter((x) => x.c);
    const ficha = [];
    if (p.po) ficha.push(["Posição", titulo(p.po)]);
    if (p.la) ficha.push(["Lado", titulo(p.la)]);
    if (p.de) ficha.push(["Detalhe", p.de]);
    (p.x || []).forEach(([k, v]) => ficha.push([k, v]));
    const junto = listaCodigos(p.oj), parecido = listaCodigos(p.ip);
    const link = location.origin + location.pathname + "#/produto/" + encodeURIComponent(p.c);
    const secApl = p.a ? `<section class="secao"><${H2} class="secao-tit">Aplicação</${H2}>${aplicacoes}<div class="aviso">Confira sempre a aplicação no veículo antes da compra.</div></section>` : "";
    const secRefs = refs.length ? `<section class="secao"><${H2} class="secao-tit">Referências cruzadas</${H2}><table class="t"><tbody>${refs.map((x) => `<tr><th>${esc(x.m || "Referência")}</th><td class="c">${esc(x.c)}</td></tr>`).join("")}</tbody></table></section>` : "";
    const secFicha = ficha.length ? `<section class="secao"><${H2} class="secao-tit">Ficha técnica</${H2}><table class="t"><tbody>${ficha.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></section>` : "";
    const dados = secApl && (secRefs || secFicha)
      ? `<div class="prod-dados"><div class="col-apl">${secApl}</div><div class="col-tab">${secRefs}${secFicha}</div></div>`
      : `<div class="prod-dados um"><div class="col-apl">${secApl}</div><div class="col-tab">${secRefs}${secFicha}</div></div>`;
    return `<div class="so-impressao cab-pdf"><img src="assets/logo_escuro.png" alt="BAP componentes de qualidade"><span>Ficha do produto · Catálogo BAP</span></div>
      <div class="prod">
        <div class="prod-foto-box">${p.i
          ? `<div class="prod-foto"><button class="foto-zoom" type="button" aria-haspopup="dialog" aria-label="Ampliar a foto do ${esc(p.c)}">${fotoHtml(p, true)}</button></div>
            <p class="foto-dica nao-imprime">Clique na foto para ampliar.</p>`
          : `<div class="prod-foto">${fotoHtml(p, true)}</div>`}</div>
        <div class="prod-info">
          <div class="prod-cab">
            <${H} id="${naJanela ? "janela-tit" : "produto-tit"}">${esc(p.c)}</${H}>
            <div class="desc">${esc(p.d)}</div>
            <div class="selos">${[p.ca, p.si, p.fa, p.li].filter(Boolean).map((s, i) => `<span class="selo ${i === 1 ? "v" : ""}">${esc(titulo(s))}</span>`).join("")}${p.p ? `<span class="selo">${esc(p.p)}</span>` : ""}</div>
            <div class="acoes">
              <button class="bt bt-mini" type="button" data-copiar="${esc(p.c)}">Copiar código</button>
              <button class="bt bt-claro bt-mini bt-pdf" type="button">Salvar em PDF</button>
            </div>
          </div>
          ${dados}
          ${p.df ? `<section class="secao"><${H2} class="secao-tit">Diferencial BAP</${H2}><p>${esc(p.df)}</p></section>` : ""}
          ${junto.length ? `<section class="secao nao-imprime"><${H2} class="secao-tit">Ofereça junto</${H2}><div class="links-cod">${junto.map((c) => `<a href="#/produto/${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}</div></section>` : ""}
          ${parecido.length ? `<section class="secao nao-imprime"><${H2} class="secao-tit">Itens parecidos</${H2}><div class="links-cod">${parecido.map((c) => `<a href="#/produto/${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}</div></section>` : ""}
        </div>
      </div>
      <div class="so-impressao rod-pdf">As fotos são ilustrativas. Confira sempre a aplicação antes da compra.<br>${esc(link)}${BASE.gerado_em ? " · base atualizada em " + esc(BASE.gerado_em) : ""}</div>`;
  }
  function ligarAcoes(raiz) {
    raiz.querySelector("[data-copiar]").addEventListener("click", (ev) => {
      const c = ev.currentTarget.dataset.copiar;
      (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => toast("Código " + c + " copiado"), () => toast(c));
    });
    // "Salvar em PDF": a impressão do navegador, com a folha A4 do styles.css (@media print); o vendedor escolhe
    // "Salvar como PDF". Sem biblioteca e sem servidor.
    raiz.querySelector(".bt-pdf").addEventListener("click", () => window.print());
    const bz = raiz.querySelector(".foto-zoom");
    if (bz) bz.addEventListener("click", () => abrirZoom(bz));
  }

  // ---------- foto ampliada (T-0014) ----------
  // Clicar na foto do produto (na página, na janela ou no cartão da lista) abre a foto em tela cheia. <dialog> com
  // showModal(): o fundo fica inerte e o foco fica no X. Fecha com o X, o Esc, o clique fora da foto e o voltar
  // do celular (uma entrada no histórico com o mesmo endereço; o voltar não muda a rota). O foco volta à foto.
  let ZOOM = null; // { dlg, volta: botão da foto }
  function abrirZoom(bt) {
    const img = bt.querySelector("img:not(.sem-foto img)");
    if (!img || ZOOM) return;
    let dlg = document.getElementById("zoom-foto");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "zoom-foto";
      dlg.className = "zoom";
      dlg.setAttribute("aria-modal", "true");
      document.body.appendChild(dlg);
      dlg.addEventListener("cancel", (ev) => { ev.preventDefault(); fecharZoom(true); }); // Esc
      dlg.addEventListener("click", (ev) => { if (!ev.target.closest(".zoom-img, .zoom-leg, .zoom-x")) fecharZoom(true); }); // fora da foto
      dlg.addEventListener("close", () => { if (ZOOM) fecharZoom(true); }); // fechou sem passar pelo cancel
    }
    dlg.setAttribute("aria-label", "Foto ampliada: " + img.alt);
    dlg.innerHTML = `<button class="zoom-x" type="button" aria-label="Fechar a foto ampliada">✕</button>
      <figure class="zoom-fig"><img class="zoom-img" src="${esc(img.getAttribute("src"))}" alt="${esc(img.alt)}"><figcaption class="zoom-leg">${esc(img.alt)}</figcaption></figure>`;
    dlg.querySelector(".zoom-x").addEventListener("click", () => fecharZoom(true));
    history.pushState({ zoom: true }, "", location.href);
    ZOOM = { dlg, volta: bt };
    document.documentElement.classList.add("com-zoom");
    dlg.showModal();
    dlg.querySelector(".zoom-x").focus();
  }
  // pelo X, Esc ou clique fora: volta a entrada do histórico e o popstate fecha (igual ao voltar do celular)
  function fecharZoom(pelaTela) {
    if (!ZOOM) return;
    if (pelaTela) { history.back(); return; }
    const { dlg, volta } = ZOOM;
    ZOOM = null;
    if (dlg.open) dlg.close();
    document.documentElement.classList.remove("com-zoom");
    if (volta.isConnected) volta.focus({ preventScroll: true });
  }
  window.addEventListener("popstate", () => { if (ZOOM) fecharZoom(false); });

  function telaProduto(codigo) {
    const p = POR_COD.get(normCod(codigo));
    if (!p) {
      app.innerHTML = `<div class="pagina-produto"><div class="vazio"><b>Produto ${esc(codigo)} não encontrado</b><a href="#/busca?cod=${encodeURIComponent(codigo)}">Buscar como referência cruzada</a></div></div>`;
      return;
    }
    document.title = p.c + " · " + p.d + " · Catálogo BAP";
    const daLista = ROTA_ANTERIOR && ROTA_ANTERIOR.startsWith("#/busca");
    app.innerHTML = `<div class="pagina-produto produto-conteudo">
      <div class="prod-topo nao-imprime">
        <button class="bt bt-claro bt-voltar" type="button"><span aria-hidden="true">←</span> ${daLista ? "Voltar aos resultados" : "Voltar"}</button>
        <nav class="trilha" aria-label="Você está em"><a href="#/">Início</a>›<a href="#/busca?si=${encodeURIComponent(p.si || "")}">${esc(titulo(p.si || "Produtos"))}</a>${p.fa ? `›<a href="#/busca?si=${encodeURIComponent(p.si || "")}&fa=${encodeURIComponent(p.fa)}">${esc(titulo(p.fa))}</a>` : ""}›<span>${esc(p.c)}</span></nav>
      </div>
      ${produtoHtml(p, false)}</div>`;
    // Voltar: volta no histórico quando veio de outra tela do catálogo; com o link aberto direto, vai ao início
    app.querySelector(".bt-voltar").addEventListener("click", () => { if (ROTA_ANTERIOR) history.back(); else irPara("/"); });
    ligarAcoes(app);
  }

  // ---------- janela do produto (computador e celular; "Letra A", R-20261120-112520) ----------
  // Abre por cima da lista sem sair dela (pelo código e nome do cartão ou pelo "+ Detalhes"). A rota continua #/produto/<CODIGO> (o endereço serve para mandar o
  // link), então o voltar do celular fecha a janela. <dialog> com showModal(): o fundo fica inerte (o foco
  // não sai da janela) e o Esc fecha. Ao fechar, o foco volta ao link do cartão que abriu.
  let JANELA = null; // { dlg, pilha: [hash dos produtos abertos na janela], cod }
  function abrirJanela(codigo) {
    const p = POR_COD.get(normCod(codigo));
    if (!p) return false;
    let dlg = document.getElementById("janela-produto");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "janela-produto";
      dlg.className = "janela";
      dlg.setAttribute("aria-modal", "true");
      dlg.setAttribute("aria-labelledby", "janela-tit");
      document.body.appendChild(dlg);
      dlg.addEventListener("cancel", (ev) => { ev.preventDefault(); fecharJanela(true); }); // Esc
      dlg.addEventListener("click", (ev) => { if (ev.target === dlg) fecharJanela(true); }); // clique no fundo
      dlg.addEventListener("close", () => { if (JANELA) fecharJanela(true); }); // fechou sem passar pelo cancel
    }
    if (!JANELA) JANELA = { dlg, pilha: [], cod: p.c };
    const pilha = JANELA.pilha;
    if (pilha.length > 1 && pilha[pilha.length - 2] === location.hash) pilha.pop(); // voltar do celular
    else if (pilha[pilha.length - 1] !== location.hash) pilha.push(location.hash);
    dlg.innerHTML = `<div class="janela-barra nao-imprime"><span>Produto</span><button class="janela-x" type="button" aria-label="Fechar a janela do produto">✕</button></div>
      <div class="janela-corpo produto-conteudo">${produtoHtml(p, true)}</div>`;
    dlg.querySelector(".janela-x").addEventListener("click", () => fecharJanela(true));
    ligarAcoes(dlg);
    document.title = p.c + " · " + p.d + " · Catálogo BAP";
    document.documentElement.classList.add("com-janela");
    if (!dlg.open) dlg.showModal();
    dlg.querySelector(".janela-corpo").scrollTop = 0;
    dlg.querySelector(".janela-x").focus();
    return true;
  }
  // pelo X, Esc ou fundo: volta no histórico (todos os produtos abertos dentro da janela); o hashchange fecha
  function fecharJanela(peloBotao) {
    if (!JANELA) return;
    if (peloBotao) { history.go(-JANELA.pilha.length); return; }
    const { dlg, cod } = JANELA;
    JANELA = null;
    dlg.close();
    document.documentElement.classList.remove("com-janela");
    document.title = "Catálogo BAP · Componentes de qualidade";
    const quem = LINK_CARTAO && LINK_CARTAO.isConnected ? LINK_CARTAO : linkDoCartao(cod);
    LINK_CARTAO = null;
    if (quem) quem.focus({ preventScroll: true });
  }
  const linkDoCartao = (cod) => [...app.querySelectorAll(".lista .item")].find((e) => e.dataset.cod === cod)?.querySelector(".item-link") || null;

  function telaSobre() {
    app.innerHTML = `<div class="texto-pagina"><h1>BAP · componentes de qualidade</h1>
      <p>A BAP Autoparts oferece peças de reposição para a linha leve, pesada e moto: suspensão, direção, transmissão, freio, rodagem, filtração, elétrica, motor, arrefecimento, lubrificantes, químicos e acessórios.</p>
      <p>Este catálogo mostra os produtos ativos da base unificada BAP, com aplicação, referências cruzadas e ficha técnica. Para preço e disponibilidade, fale com o seu representante.</p>
      <p><a class="bt" href="#/busca">Ver todos os produtos</a></p></div>`;
  }

  let ROTA_ATUAL = null, ROTA_ANTERIOR = null; // hash da tela na frente e da anterior (para o Voltar)
  let ESTADO_LISTA = null; // a lista na tela: { hash, n() }
  let VOLTA_LISTA = null;  // a lista que ficou para trás: { hash, n, y, cod }
  function render() {
    if (!BASE) return;
    const { caminho, params } = lerRota();
    const ehProduto = caminho.startsWith("/produto/");
    const cod = ehProduto ? decodeURIComponent(caminho.slice(9)) : "";
    // janela (computador e celular): da lista, o produto abre na janela e a lista fica por baixo, do jeito que estava.
    // Só o clique no cartão abre a janela; o endereço digitado ou colado (#/produto/CODIGO) abre a página.
    const listaNaTela = ESTADO_LISTA && ESTADO_LISTA.hash === ROTA_ATUAL && CLICOU_CARTAO;
    CLICOU_CARTAO = false;
    if (ehProduto && (JANELA || listaNaTela) && abrirJanela(cod)) return;
    if (JANELA) {
      const voltouNaLista = ESTADO_LISTA && location.hash === ESTADO_LISTA.hash;
      fecharJanela(false);
      if (voltouNaLista) { ROTA_ATUAL = location.hash; return; }
    }
    if (caminho !== "/busca") VEICULO_PLACA = null; // tela fora da busca (início, sobre, página do produto): a placa some
    if (ESTADO_LISTA && ESTADO_LISTA.hash === ROTA_ATUAL && ehProduto) VOLTA_LISTA = { hash: ROTA_ATUAL, n: ESTADO_LISTA.n(), y: window.scrollY, cod };
    ESTADO_LISTA = null;
    ROTA_ANTERIOR = ROTA_ATUAL;
    ROTA_ATUAL = location.hash || "#/";
    document.title = "Catálogo BAP · Componentes de qualidade";
    let volta = null;
    if (ehProduto) telaProduto(cod);
    else if (caminho === "/busca") {
      const nova = rotaAntiga(params);
      if (nova) { const qs = new URLSearchParams(nova).toString(); location.replace("#/busca?" + qs); return; } // hashchange chama de novo
      volta = telaBusca(params);
    }
    else if (caminho === "/sobre") telaSobre();
    else telaInicio();
    if (volta) {
      window.scrollTo({ top: volta.y, behavior: "instant" });
      (volta.alvo || linkDoCartao(volta.cod) || app).focus({ preventScroll: true });
      return;
    }
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener("hashchange", render);
  // o código e nome ou o "+ Detalhes" do cartão foi clicado (mouse, toque ou Enter) sem Ctrl, Shift ou Cmd
  let CLICOU_CARTAO = false, LINK_CARTAO = null;
  document.addEventListener("click", (ev) => {
    const lk = ev.target.closest('.lista .item a[href^="#/produto/"]');
    CLICOU_CARTAO = !!lk && !(ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) && ev.button === 0;
    if (CLICOU_CARTAO) LINK_CARTAO = lk;
    const a = ev.target.closest('a[href="#contato"]');
    if (a) { ev.preventDefault(); document.getElementById("contato").scrollIntoView({ behavior: "smooth" }); }
  });
  carregar().then(render).catch((e) => {
    app.innerHTML = `<div class="carregando">Não foi possível carregar o catálogo (${esc(e.message)}). Atualize a página.</div>`;
  });
})();
