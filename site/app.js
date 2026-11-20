/* Catálogo BAP online · site estático (sem servidor).
   Os dados vêm de data/produtos.json, gerado por scripts/gerar_site.py a partir da base unificada.
   Rotas: #/  ·  #/busca?q=&si=&fa=&li=&ca=  ·  #/produto/<CODIGO>  ·  #/sobre
   (os links antigos com cod=, mo=, modelo= e ano= viram q=: ver rotaAntiga)
   Busca por placa (T-0005): chama o serviço bapajudacatalogo-placas (integracao-placas), que guarda a chave da
   API PLACAS. O site só conhece a URL pública abaixo; nenhuma chave entra aqui. LGPD: a placa não vai para o
   endereço (#/...), nem para o localStorage/sessionStorage, nem para o console. */
(function () {
  "use strict";

  // [SUPOSIÇÃO] endereço que o Render dá ao serviço bapajudacatalogo-placas (contrato: POST {"placa":"ABC1D23"})
  const PLACAS_URL = "https://bapajudacatalogo-placas.onrender.com/veiculo";
  const PLACAS_TIMEOUT_MS = 75000; // o serviço grátis do Render dorme; acordar pode levar quase 1 minuto
  const PLACAS_ACORDANDO_MS = 5000;
  const POR_PAGINA = 24;
  let VEICULO_PLACA = null;  // { q, texto } do último veículo achado pela placa (só em memória e sem a placa)
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
    const qs = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null)).toString() : "";
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
    const cs = pr.get("q") ? casador(pr.get("q")) : null;
    const total = cs ? cs.total : 0;
    const filtros = { si: pr.get("si"), fa: pr.get("fa"), li: pr.get("li"), ca: pr.get("ca") };
    let out = [], maxN = 0;
    for (const e of INDICE) {
      const p = e.p;
      if (filtros.si && p.si !== filtros.si) continue;
      if (filtros.fa && p.fa !== filtros.fa) continue;
      if (filtros.li && p.li !== filtros.li) continue;
      if (filtros.ca && p.ca !== filtros.ca) continue;
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
    if (p.i) return `<img src="img/${encodeURIComponent(p.i)}" alt="${esc(p.c + " · " + p.d)}" loading="${grande ? "eager" : "lazy"}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'sem-foto',innerHTML:'<img src=&quot;assets/logo_escuro.png&quot; alt=&quot;&quot;>Foto em breve'}))">`;
    return `<div class="sem-foto"><img src="assets/logo_escuro.png" alt="">Foto em breve</div>`;
  }
  function itemHtml(p) {
    return `<a class="item" href="#/produto/${encodeURIComponent(p.c)}">
      <div class="foto">${fotoHtml(p)}</div>
      <div class="corpo">
        <span class="cod">${esc(p.c)}</span>
        <span class="desc">${esc(p.d)}</span>
        ${p.a ? `<span class="apl">${esc(p.a)}</span>` : ""}
        <span class="tag">${esc([p.si, p.li].filter(Boolean).join(" · "))}</span>
      </div></a>`;
  }

  // Cartão de busca com 2 abas (decisão do Alexandre, 20/11/2026): 1) código, descrição ou aplicação, num campo só,
  // palavra por palavra; 2) placa (T-0005): o serviço devolve o veículo e ele vira o q da aba 1 (mesmo casador()).
  function montarBusca(container, pr) {
    container.insertAdjacentHTML("beforeend", `<section class="cartao-busca" aria-label="Buscar produtos">
      <div class="abas" role="tablist" aria-label="Tipo de busca">
        <button role="tab" type="button" id="aba-texto" data-aba="texto" aria-controls="painel-texto" aria-selected="true">Busca por código, descrição ou aplicação</button>
        <button role="tab" type="button" id="aba-placa" data-aba="placa" aria-controls="painel-placa" aria-selected="false" tabindex="-1">Busca por placa</button>
      </div>
      <form class="form-busca" autocomplete="off" role="search">
        <div class="campos" data-campos="texto" id="painel-texto" role="tabpanel" aria-labelledby="aba-texto">
          <label class="campo largo"><span>Código, descrição ou aplicação</span>
            <input name="q" type="search" enterkeyhint="search" placeholder="Ex.: gol 2007 amortecedor, AMT7115, TRW 16900255S, 15W40"></label>
        </div>
        <div class="campos" data-campos="placa" id="painel-placa" role="tabpanel" aria-labelledby="aba-placa" hidden>
          <label class="campo largo"><span>Placa do veículo</span>
            <input id="campo-placa" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="8" enterkeyhint="search" placeholder="Ex.: ABC1D23 ou ABC1234" aria-describedby="status-placa"></label>
          <p class="aviso" id="status-placa" role="status" aria-live="polite" style="font-size:15px;margin:4px 0 8px">Digite a placa do veículo e veja os produtos do catálogo que servem nele.</p>
        </div>
        <div class="botoes">
          <button type="reset" class="bt bt-claro">Limpar</button>
          <button type="submit" class="bt">Buscar</button>
        </div>
      </form>
    </section>`);
    const cartao = container.querySelector(".cartao-busca");
    const form = cartao.querySelector("form");
    const abas = [...cartao.querySelectorAll(".abas button")];
    const campoPlaca = cartao.querySelector("#campo-placa");
    const statusPlaca = cartao.querySelector("#status-placa");
    const btBuscar = cartao.querySelector('.botoes button[type="submit"]');
    let aba = "texto";
    const mostrar = (a, foco) => {
      aba = a;
      abas.forEach((b) => { const sel = b.dataset.aba === a; b.setAttribute("aria-selected", String(sel)); b.tabIndex = sel ? 0 : -1; if (sel && foco) b.focus(); });
      cartao.querySelectorAll(".campos").forEach((c) => (c.hidden = c.dataset.campos !== a));
    };
    abas.forEach((b, i) => {
      b.addEventListener("click", () => { mostrar(b.dataset.aba); (b.dataset.aba === "texto" ? form.elements.q : campoPlaca).focus(); });
      // teclado: setas, Home e End trocam de aba
      b.addEventListener("keydown", (ev) => {
        const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 }[ev.key];
        if (j == null) return;
        ev.preventDefault();
        mostrar(abas[(j + abas.length) % abas.length].dataset.aba, true);
      });
    });
    if (pr && pr.get("q")) form.elements.q.value = pr.get("q");
    // resultado de uma placa: volta na aba placa, com o veículo achado (a placa não fica guardada)
    const daPlaca = !!(pr && VEICULO_PLACA && pr.get("q") === VEICULO_PLACA.q);
    if (daPlaca) statusPlaca.innerHTML = `Veículo encontrado: <b>${esc(VEICULO_PLACA.texto)}</b>`;
    mostrar(daPlaca ? "placa" : "texto");
    campoPlaca.addEventListener("input", () => { campoPlaca.value = campoPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7); });
    form.addEventListener("reset", () => setTimeout(() => {
      statusPlaca.textContent = "Digite a placa do veículo e veja os produtos do catálogo que servem nele.";
      if (lerRota().caminho === "/busca") irPara("/busca");
    }, 0));
    let consultando = false;
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (aba === "texto") { irPara("/busca", { q: form.elements.q.value.trim() }); return; }
      if (consultando) return;
      const placa = campoPlaca.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!PLACA_OK.test(placa)) { statusPlaca.innerHTML = "<b>Placa inválida.</b> Use o formato ABC1234 ou ABC1D23."; campoPlaca.focus(); return; }
      consultando = true;
      btBuscar.disabled = true;
      cartao.setAttribute("aria-busy", "true");
      statusPlaca.textContent = "Consultando…";
      const acordando = setTimeout(() => { statusPlaca.textContent = "Acordando o serviço, aguarde…"; }, PLACAS_ACORDANDO_MS);
      consultarPlaca(placa).then((v) => {
        const achado = veiculoDaPlaca(v);
        if (!achado.q) throw Object.assign(new Error("vazio"), { status: 404 });
        VEICULO_PLACA = achado;
        campoPlaca.value = "";
        if (lerRota().caminho === "/busca" && lerRota().params.toString() === new URLSearchParams({ q: achado.q }).toString()) render();
        else irPara("/busca", { q: achado.q });
      }).catch((e) => {
        const msg = { 400: "<b>Placa inválida.</b> Use o formato ABC1234 ou ABC1D23.", 404: "<b>Placa não encontrada.</b>",
          429: "<b>Muitas consultas, tente em alguns minutos.</b>" }[e && e.status]
          || "<b>Busca por placa indisponível agora;</b> use a busca por código, descrição ou aplicação.";
        statusPlaca.innerHTML = msg;
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
    const anos = ano && anoModelo && ano !== anoModelo ? ano + "/" + anoModelo : anoModelo;
    return {
      q: qDe(modelo),
      texto: [montadora, modelo, anos, cil].filter(Boolean).join(" "),
    };
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
    if (pr.get("q")) desc.push(`“${pr.get("q")}”`);
    app.innerHTML = `<div class="pagina-busca"><div id="busca-topo"></div>
      <div class="res-topo"><h1>${desc.length ? "Resultados para " + esc(desc.join(" · ")) : "Todos os produtos"}</h1>
        <span class="total">${fmt(todos.length)} produto${todos.length === 1 ? "" : "s"}</span>
        <button class="bt bt-claro bt-mini bt-filtros" type="button" aria-expanded="false">Filtrar</button></div>
      ${todos.length && todos.casaram < todos.palavras ? `<p class="aviso proximos" role="status" style="margin:0 0 14px;font-size:14px"><b>Nenhum produto tem todas as palavras.</b> Estes são os mais próximos: casam com ${fmt(todos.casaram)} de ${fmt(todos.palavras)} palavras${todos.faltam.length ? `. Não casou: ${todos.faltam.map((t) => `“${esc(t.toLowerCase())}”`).join(", ")}` : ""}.</p>` : ""}
      <div class="res-grade"><aside class="filtros" aria-label="Filtros"></aside><div><div class="chips"></div><div class="lista"></div><div class="mais"></div></div></div></div>`;
    montarBusca(document.getElementById("busca-topo"), pr);
    const ROT = { si: "Sistema", fa: "Família", li: "Linha", ca: "Categoria" };
    // filtros: contagem sobre o resultado sem o próprio filtro
    const aside = app.querySelector(".filtros");
    aside.innerHTML = Object.keys(ROT).map((k) => {
      const semEste = new URLSearchParams(pr); semEste.delete(k);
      const base = pr.get(k) ? buscar(semEste) : todos;
      const op = contar(base, k).slice(0, 40);
      if (!op.length) return "";
      return `<details open><summary>${ROT[k]}</summary>${op.map(([v, n]) =>
        `<label><input type="radio" name="f-${k}" value="${esc(v)}" ${pr.get(k) === v ? "checked" : ""}><span>${esc(titulo(v))}</span><em>${fmt(n)}</em></label>`).join("")}</details>`;
    }).join("") + `<button class="limpar-f" type="button">Limpar filtros</button>`;
    aside.addEventListener("change", (ev) => {
      const k = ev.target.name.replace("f-", "");
      const n = new URLSearchParams(pr); n.set(k, ev.target.value);
      if (k === "si") n.delete("fa");
      irPara("/busca", Object.fromEntries(n));
    });
    aside.querySelector(".limpar-f").addEventListener("click", () => {
      const n = new URLSearchParams(pr); Object.keys(ROT).forEach((k) => n.delete(k)); irPara("/busca", Object.fromEntries(n));
    });
    const btF = app.querySelector(".bt-filtros");
    btF.addEventListener("click", () => { const a = aside.classList.toggle("aberto"); btF.setAttribute("aria-expanded", String(a)); });
    // chips dos filtros ativos
    const chips = app.querySelector(".chips");
    chips.innerHTML = Object.keys(ROT).filter((k) => pr.get(k)).map((k) => `<button class="chip" data-k="${k}" type="button">${ROT[k]}: ${esc(titulo(pr.get(k)))} ✕</button>`).join("");
    chips.addEventListener("click", (ev) => { const b = ev.target.closest(".chip"); if (!b) return; const n = new URLSearchParams(pr); n.delete(b.dataset.k); irPara("/busca", Object.fromEntries(n)); });
    const lista = app.querySelector(".lista");
    const mais = app.querySelector(".mais");
    function pagina() {
      lista.insertAdjacentHTML("beforeend", todos.slice(mostrando, mostrando + POR_PAGINA).map(itemHtml).join(""));
      mostrando = Math.min(todos.length, mostrando + POR_PAGINA);
      mais.innerHTML = mostrando < todos.length ? `<button class="bt bt-claro" type="button">Carregar mais (${fmt(todos.length - mostrando)} restantes)</button>` : "";
    }
    mais.addEventListener("click", pagina);
    if (!todos.length) {
      lista.outerHTML = `<div class="vazio"><b>Nenhum produto encontrado</b>Confira o código ou tente menos palavras (sem o ano, por exemplo).</div>`;
    } else pagina();
  }

  function listaCodigos(txt) {
    return String(txt || "").split(/\s*[·,;/|]\s*|\s+/).map((c) => c.trim()).filter((c) => c && POR_COD.has(normCod(c)));
  }

  function telaProduto(codigo) {
    const p = POR_COD.get(normCod(codigo));
    if (!p) {
      app.innerHTML = `<div class="pagina-produto"><div class="vazio"><b>Produto ${esc(codigo)} não encontrado</b><a href="#/busca?cod=${encodeURIComponent(codigo)}">Buscar como referência cruzada</a></div></div>`;
      return;
    }
    document.title = p.c + " · " + p.d + " · Catálogo BAP";
    const aplicacoes = String(p.a || "").split(/\s+·\s+(?=[A-ZÀ-Úa-zà-ú0-9])/).length > 1 && (p.a || "").length > 160
      ? `<ul class="aplic">${p.a.split(/\s+·\s+/).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p>${esc(p.a)}</p>`;
    const refs = (p.r || []).filter((x) => x.c);
    const ficha = [];
    if (p.po) ficha.push(["Posição", titulo(p.po)]);
    if (p.la) ficha.push(["Lado", titulo(p.la)]);
    if (p.de) ficha.push(["Detalhe", p.de]);
    (p.x || []).forEach(([k, v]) => ficha.push([k, v]));
    const junto = listaCodigos(p.oj), parecido = listaCodigos(p.ip);
    const linkTxt = location.href.split("#")[0] + "#/produto/" + encodeURIComponent(p.c);
    app.innerHTML = `<div class="pagina-produto">
      <nav class="trilha" aria-label="Você está em"><a href="#/">Início</a>›<a href="#/busca?si=${encodeURIComponent(p.si || "")}">${esc(titulo(p.si || "Produtos"))}</a>${p.fa ? `›<a href="#/busca?si=${encodeURIComponent(p.si || "")}&fa=${encodeURIComponent(p.fa)}">${esc(titulo(p.fa))}</a>` : ""}›<span>${esc(p.c)}</span></nav>
      <div class="prod">
        <div class="prod-foto">${fotoHtml(p, true)}</div>
        <div class="prod-info">
          <h1>${esc(p.c)}</h1>
          <div class="desc">${esc(p.d)}</div>
          <div class="selos">${[p.ca, p.si, p.fa, p.li].filter(Boolean).map((s, i) => `<span class="selo ${i === 1 ? "v" : ""}">${esc(titulo(s))}</span>`).join("")}${p.p ? `<span class="selo">${esc(p.p)}</span>` : ""}</div>
          <div class="acoes">
            <button class="bt bt-mini" type="button" data-copiar="${esc(p.c)}">Copiar código</button>
            <a class="bt bt-claro bt-mini" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("BAP " + p.c + " · " + p.d + "\n" + linkTxt)}">Enviar no WhatsApp</a>
          </div>
          ${p.a ? `<section class="secao"><h2>Aplicação</h2>${aplicacoes}<div class="aviso">Confira sempre a aplicação no veículo antes da compra.</div></section>` : ""}
          ${refs.length ? `<section class="secao"><h2>Referências cruzadas</h2><table class="t"><tbody>${refs.map((x) => `<tr><th>${esc(x.m || "Referência")}</th><td class="c">${esc(x.c)}</td></tr>`).join("")}</tbody></table></section>` : ""}
          ${ficha.length ? `<section class="secao"><h2>Ficha técnica</h2><table class="t"><tbody>${ficha.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></section>` : ""}
          ${p.df ? `<section class="secao"><h2>Diferencial BAP</h2><p>${esc(p.df)}</p></section>` : ""}
          ${junto.length ? `<section class="secao"><h2>Ofereça junto</h2><div class="links-cod">${junto.map((c) => `<a href="#/produto/${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}</div></section>` : ""}
          ${parecido.length ? `<section class="secao"><h2>Itens parecidos</h2><div class="links-cod">${parecido.map((c) => `<a href="#/produto/${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}</div></section>` : ""}
        </div>
      </div></div>`;
    app.querySelector("[data-copiar]").addEventListener("click", (ev) => {
      const c = ev.currentTarget.dataset.copiar;
      (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => toast("Código " + c + " copiado"), () => toast(c));
    });
  }

  function telaSobre() {
    app.innerHTML = `<div class="texto-pagina"><h1>BAP · componentes de qualidade</h1>
      <p>A BAP Autoparts oferece peças de reposição para a linha leve, pesada e moto: suspensão, direção, transmissão, freio, rodagem, filtração, elétrica, motor, arrefecimento, lubrificantes, químicos e acessórios.</p>
      <p>Este catálogo mostra os produtos ativos da base unificada BAP, com aplicação, referências cruzadas e ficha técnica. Para preço e disponibilidade, fale com o seu representante.</p>
      <p><a class="bt" href="#/busca">Ver todos os produtos</a></p></div>`;
  }

  function render() {
    if (!BASE) return;
    const { caminho, params } = lerRota();
    document.title = "Catálogo BAP · Componentes de qualidade";
    if (caminho.startsWith("/produto/")) telaProduto(decodeURIComponent(caminho.slice(9)));
    else if (caminho === "/busca") {
      const nova = rotaAntiga(params);
      if (nova) { const qs = new URLSearchParams(nova).toString(); location.replace("#/busca?" + qs); return; } // hashchange chama de novo
      telaBusca(params);
    }
    else if (caminho === "/sobre") telaSobre();
    else telaInicio();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener("hashchange", render);
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest('a[href="#contato"]');
    if (a) { ev.preventDefault(); document.getElementById("contato").scrollIntoView({ behavior: "smooth" }); }
  });
  carregar().then(render).catch((e) => {
    app.innerHTML = `<div class="carregando">Não foi possível carregar o catálogo (${esc(e.message)}). Atualize a página.</div>`;
  });
})();
