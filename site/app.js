/* Catálogo BAP online · site estático (sem servidor).
   Os dados vêm de data/produtos.json, gerado por scripts/gerar_site.py a partir da base unificada.
   Rotas: #/  ·  #/busca?q=&vm=&vmo=&va=&vmt=&vv=&si=&fa=&li=&ca=  ·  #/produto/<CODIGO>  ·  #/sobre
   (os links antigos com cod=, mo=, modelo= e ano= viram q=: ver rotaAntiga; vm, vmo, va, vmt e vv = marca, modelo,
   ano, motor e versão do veículo, nunca a placa; si, fa, li e ca podem vir repetidos, um por opção marcada)
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
  const VEI_K = ["vm", "vmo", "va", "vmt", "vv"]; // marca, modelo, ano, motor e versão do veículo (no endereço vai o veículo, nunca a placa)
  const chaveVeiculo = (pr) => VEI_K.map((k) => (pr ? (pr instanceof URLSearchParams ? pr.get(k) : pr[k]) : "") || "").join("|"); // rota ou objeto da placa
  const POR_PAGINA = 50; // T-0014: 10 linhas de 5 cartões no computador (25 de 2 no celular)
  // { q, texto, partes, placa } do último veículo achado pela placa. Só em memória: nunca no endereço, no
  // localStorage/sessionStorage, no console ou no título. A placa vive só no fluxo da busca (lista, janela do produto e
  // volta à lista) e some no X dela (no quadro da busca), numa busca nova de texto, ao ir para qualquer tela fora da
  // busca (início, sobre, página do produto) e ao recarregar a página. O "Limpar tudo" não mexe nela: tira só o termo
  // e os filtros, abaixo da barra.
  let VEICULO_PLACA = null;
  const app = document.getElementById("app");
  const TITULO = document.title; // o do index.html: "Catálogo online BAP · Componentes de qualidade"
  const tituloProduto = (p) => p.c + " · " + p.d + " · " + TITULO.split(" · ")[0]; // "<código> · <descrição> · Catálogo online BAP"
  let BASE = null;           // { gerado_em, total, produtos }
  const NOME_MARCA = new Map(); // marca sem acento → como a base escreve
  let TEM_VE = false;        // o produtos.json tem o campo "ve" (T-0017) em algum produto
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
  const titulo = (s) => bonito(s); // um nome sem caixa alta só (bonito, mais abaixo)
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
    TEM_VE = BASE.produtos.some((p) => Array.isArray(p.ve) && p.ve.length);
    // nome da marca como a base escreve (com acento: "CITROËN"), para mostrar na lista; a comparação é sem acento
    for (const p of BASE.produtos) for (const m of [...(p.ve || []).map((x) => x[0]), ...String(p.mo || "").split(/\s*[\/,]\s*/)])
      if (m && (!NOME_MARCA.has(norm(m)) || /[À-ÿ]/.test(m))) NOME_MARCA.set(norm(m), String(m).toUpperCase());
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
        outros: norm([p.ca, p.fa, p.si, p.li, p.de, p.mo, p.po, p.la].join(" | ")), // categoria ca, família fa e os outros
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
    if (info && BASE.gerado_em) info.textContent = " Base atualizada em " + BASE.gerado_em + "."; // T-0018 op4e: sem o total (o início mostra o "+4.400")
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
    const sel = (k) => { const v = pr.getAll(k).filter(Boolean); return v.length ? new Set(v) : null; };
    const filtros = { si: sel("si"), fa: sel("fa"), li: sel("li"), ca: sel("ca") };
    // veículo (faixa abaixo da busca): só o que serve na marca, modelo, ano, motor e versão escolhidos
    const vei = pr.get("vm") ? veiculoDaRota(pr) : null;
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
  const nProd = (n) => fmt(n) + " produto" + (n === 1 ? "" : "s"); // "3 produtos": o total e o "Ver 3 produtos"
  const SEM_FOTO = '<img src="assets/logo_escuro.png" alt="">Foto em breve'; // o miolo do "Foto em breve"
  // a foto grande (produto) carrega logo e na frente (fetchpriority); no cartão, lazy, menos os da 1ª linha (logo)
  function fotoHtml(p, grande, logo) {
    if (p.i) return `<img src="img/${encodeURIComponent(p.i)}" alt="${esc(p.c + " · " + p.d)}" loading="${grande || logo ? "eager" : "lazy"}"${grande ? ' fetchpriority="high"' : ""} onerror="(this.closest('.foto-zoom')||this).replaceWith(Object.assign(document.createElement('div'),{className:'sem-foto',innerHTML:${esc(JSON.stringify(SEM_FOTO)).replace(/"/g, "&quot;")}}))">`;
    return `<div class="sem-foto">${SEM_FOTO}</div>`;
  }
  // a foto com o botão de ampliar (no cartão e no produto); sem foto, só o "Foto em breve"
  const fotoZoomHtml = (p, grande, logo) => p.i ? `<button class="foto-zoom" type="button" aria-haspopup="dialog" aria-label="Ampliar a foto do ${esc(p.c)}">${fotoHtml(p, grande, logo)}</button>` : fotoHtml(p, grande);
  // Cartão do resultado (T-0014, R-20261120-112520). O código vai sobre a foto, no canto inferior direito
  // (R-20261120-122300; não é botão; o código continua no alt da foto e no link do cartão, para leitor de tela). a foto só amplia (botão; sem foto, nada); o código e o nome
  // são o link que abre a janela do produto; "+ Detalhes" também abre a janela. Sem botão dentro de link.
  const CARTOES_LOGO = 4; // a 1ª linha no computador (4 cartões) e as 2 primeiras no celular: foto sem lazy
  function itemHtml(p, n) {
    const href = "#/produto/" + encodeURIComponent(p.c);
    return `<article class="item" data-cod="${esc(p.c)}">
      <div class="foto">${fotoZoomHtml(p, false, n < CARTOES_LOGO)}
        <span class="foto-cod" aria-hidden="true">${esc(p.c)}</span></div>
      <div class="corpo">
        <a class="item-link" href="${href}"><span class="cod vh">${esc(p.c)}</span><span class="vh"> · </span>
        <span class="desc" title="${esc(p.d)}">${esc(p.d)}</span></a>
        <span class="apl"${p.a ? ` title="${esc(p.a)}"` : ""}>${esc(p.a || "")}</span>
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
    if (!cods.length) return `<div class="refs refs-vazio" aria-hidden="true"></div>`; // guarda a linha: mesma altura
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
  const UMA_LINHA = () => window.matchMedia("(min-width: 901px)").matches; // mesmo corte do CELULAR (coluna de filtros)
  function ajustarEtiquetas(caixas) {
    const itens = [...caixas].map((box) => ({ box, tags: [...box.querySelectorAll(".ref:not(.ref-mais)")], mais: box.querySelector(".ref-mais"), extra: +box.dataset.extra || 0 }))
      .filter((x) => x.tags.length && x.mais);
    for (const x of itens) { for (const t of x.tags) t.hidden = false; x.mais.hidden = true; } // 1) escrita
    for (const x of itens) { // 2) leitura
      // computador: 1 linha só (R-20261120-123630, cartão mais baixo); celular: até 2 linhas. A 1ª linha é a do "Ref. Cruzada:".
      const rot = x.box.querySelector(".refs-rot") || x.tags[0];
      x.limite = rot.offsetTop + (UMA_LINHA() ? 6 : x.tags[0].offsetHeight * 1.5 + 4);
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
      const passou = abertos.filter((x) => x.mais.offsetTop > x.limite && x.vis.length > (UMA_LINHA() ? 0 : 1));
      for (const x of passou) { x.vis.pop().hidden = true; x.escondidas++; x.mais.textContent = "+" + (x.escondidas + x.extra); }
      abertos = passou;
    }
  }
  let tAjuste = 0;
  window.addEventListener("resize", () => {
    clearTimeout(tAjuste);
    tAjuste = setTimeout(() => requestAnimationFrame(() => ajustarEtiquetas(app.querySelectorAll(".lista .refs"))), 150);
  });

  // Quadro da busca sem abas (R-20261120-112950 e R-20261120-115432, Alexandre): o campo geral (q) e, ao lado, o campo
  // menor da placa, com UM botão "Buscar" para os dois (o Enter em qualquer campo faz o mesmo): só texto → busca o
  // texto; só placa → consulta a placa; os dois → consulta a placa e filtra pelo texto. A placa consultada e o veículo
  // vão para a faixa abaixo do quadro (montarLayout). O aviso embaixo da placa só aparece quando há algo a dizer.
  // celular (até 640 px): o exemplo do campo geral (R-20261120-155000-alexandre) e o texto inicial das 5 listas do veículo
  // (R-20261120-155600-alexandre) são curtos, para não saírem cortados com a fonte de 16 px
  const EX_CURTO = () => window.matchMedia("(max-width: 640px)").matches;
  const EX_Q = "Ex.: gol 2007", EX_Q_LONGO = "Ex.: gol 2007 amortecedor, AMT7115, TRW 16900255S"; // celular e computador
  function montarBusca(container, pr) {
    container.insertAdjacentHTML("beforeend", `<section class="cartao-busca" aria-label="Buscar produtos">
      <form class="form-busca" autocomplete="off" role="search" aria-label="Buscar produtos">
        <div class="bq-campo bq-q">
          <label class="campo-rot" for="campo-q">Código, descrição ou aplicação</label>
          <input id="campo-q" name="q" type="search" enterkeyhint="search" placeholder="${EX_CURTO() ? EX_Q : EX_Q_LONGO + ", 15W40"}">
        </div>
        <div class="bq-campo bq-placa">
          <label class="campo-rot" for="campo-placa">Placa do veículo</label>
          <input id="campo-placa" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="8" enterkeyhint="search" placeholder="Ex.: ABC1D23" aria-describedby="status-placa">
          <p class="status-placa" id="status-placa" role="status" aria-live="polite" hidden></p>
        </div>
        <div class="bq-bt"><button type="submit" class="bt">Buscar</button></div>
      </form>
    </section>`);
    const cartao = container.querySelector(".cartao-busca");
    const form = cartao.querySelector("form");
    const campoPlaca = cartao.querySelector("#campo-placa");
    const statusPlaca = cartao.querySelector("#status-placa");
    const btBuscar = form.querySelector('button[type="submit"]');
    if (pr && pr.get("q")) form.elements.q.value = pr.get("q");
    // a busca na tela já não tem o veículo da placa (o X dela, outra marca ou modelo): a placa some da memória
    if (VEICULO_PLACA && chaveVeiculo(pr) !== VEICULO_PLACA.chave) VEICULO_PLACA = null;
    // a busca nova de texto fica com o veículo da tela (marca, modelo, ano, motor e versão)
    const veiAtual = () => { const r = lerRota(); const o = {}; if (r.caminho === "/busca") for (const k of VEI_K) if (r.params.get(k)) o[k] = r.params.get(k); return o; };
    form.addEventListener("submit", submitPlaca(campoPlaca, statusPlaca, {
      q: () => form.elements.q.value.trim(), botoes: [btBuscar], ocupado: cartao,
      texto: (q) => irPara("/busca", Object.assign(veiAtual(), { q })) }));
  }

  // ---------- busca por placa (T-0005) ----------
  const PLACA_OK = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/; // ABC1234 (antiga) e ABC1D23 (Mercosul)
  const soPlaca = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const MSG_PLACA = { 400: "<b>Placa inválida.</b> Use o formato ABC1234 ou ABC1D23.", 404: "<b>Placa não encontrada.</b>",
    429: "<b>Muitas consultas, tente em alguns minutos.</b>", outro: "<b>Busca por placa indisponível agora;</b> use a busca por código, descrição ou aplicação." };
  // pedido ao serviço sem cookie, sem cache e sem a página de origem (placa, /contar e /mais-vistos)
  const SEM_RASTRO = { cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" };
  // A busca pela placa das 2 telas (quadro da busca e início): valida, consulta e, achado o veículo, vai para a busca
  // com ele e com o texto q. LGPD: a placa vai só no corpo do POST e fica só em memória (VEICULO_PLACA, com a chave
  // do veículo que ela preencheu); no endereço vai o veículo, nunca a placa. travar(true/false): botões e aria-busy.
  // O submit das 2 telas: o campo da placa fica em maiúsculas, só letras e números; com a placa vazia, busca o texto
  // (a placa some da memória e as listas destravam; o veículo continua pela rota); com a placa, buscarPelaPlaca.
  // botoes: os "Buscar" que travam na consulta; ocupado: o elemento que ganha aria-busy.
  function submitPlaca(campo, status, { q, botoes, ocupado, texto }) {
    const aviso = (html) => { status.hidden = false; status.innerHTML = html; };
    const travar = (sim) => { botoes.forEach((b) => { b.disabled = sim; }); if (sim) ocupado.setAttribute("aria-busy", "true"); else ocupado.removeAttribute("aria-busy"); };
    campo.addEventListener("input", () => { campo.value = soPlaca(campo.value).slice(0, 7); });
    return (ev) => {
      ev.preventDefault();
      if (botoes[0].disabled) return; // consultando
      if (!campo.value.trim()) { VEICULO_PLACA = null; texto(q()); return; }
      buscarPelaPlaca(campo.value, q(), { aviso, travar, campo });
    };
  }
  function buscarPelaPlaca(placaBruta, q, { aviso, travar, campo }) {
    const placa = soPlaca(placaBruta);
    if (!PLACA_OK.test(placa)) { aviso(MSG_PLACA[400]); if (campo) campo.focus(); return; }
    travar(true);
    aviso("Consultando…");
    const acordando = setTimeout(() => { aviso("Acordando o serviço, aguarde…"); }, PLACAS_ACORDANDO_MS);
    consultarPlaca(placa).then((v) => {
      const achado = veiculoDaPlaca(v);
      if (!achado.q) throw Object.assign(new Error("vazio"), { status: 404 });
      if (campo) campo.value = "";
      const daPlaca = { vm: achado.bruto.mo, vmo: achado.bruto.modelo, va: achado.bruto.ano, vmt: achado.bruto.cil, vv: achado.bruto.versao };
      VEICULO_PLACA = { placa, chave: chaveVeiculo(daPlaca) };
      const novo = new URLSearchParams(Object.entries(Object.assign(daPlaca, { q })).filter(([, x]) => x));
      if (lerRota().caminho === "/busca" && lerRota().params.toString() === novo.toString()) render();
      else irPara("/busca", novo);
    }).catch((e) => { aviso(MSG_PLACA[e && e.status] || MSG_PLACA.outro); })
      .finally(() => { clearTimeout(acordando); travar(false); });
  }
  // POST ao serviço; erro HTTP vira { status }; rede, timeout ou resposta estranha vira status 503.
  async function consultarPlaca(placa) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), PLACAS_TIMEOUT_MS);
    try {
      let r;
      try {
        r = await fetch(PLACAS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placa }),
          signal: ctl.signal, ...SEM_RASTRO });
      } catch (e) { throw Object.assign(new Error("rede"), { status: 503 }); }
      if (!r.ok) throw Object.assign(new Error("HTTP"), { status: [400, 404, 429].includes(r.status) ? r.status : 503 });
      try { return await r.json(); } catch (e) { throw Object.assign(new Error("json"), { status: 503 }); }
    } finally { clearTimeout(t); }
  }
  const COMBUSTIVEL = /^(FLEX|TOTALFLEX|TOTAL|GASOLINA|ALCOOL|ÁLCOOL|DIESEL|GNV)$/; // um lugar só (nome do modelo, versão da placa, listas)
  // Versão do modelo: cilindrada (1.6), válvulas (16V) e siglas de motor/câmbio/acabamento ficam fora do nome.
  const VERSAO = /^(?:\d+[.,]\d+|\d+V|MSI|TSI|MPI|MPFI|TFSI|TDI|TURBO|AT|MT|CVT|AUT|MEC|CD|CS|CE|4X4|4X2)$/;
  const ehVersao = (w) => VERSAO.test(w) || COMBUSTIVEL.test(w);
  function nomeDoModelo(txt, montadora) {
    let s = norm(txt);
    if (s.includes("/")) s = s.slice(s.indexOf("/") + 1).trim(); // "VW/GOL 1.6 MSI" → "GOL 1.6 MSI"
    const mo = norm(montadora);
    if (mo && s.startsWith(mo + " ")) s = s.slice(mo.length + 1);
    const nome = [];
    for (const w of s.split(/[\s-]+/).filter(Boolean)) {
      if (ehVersao(w)) break;
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
    const versao = resto.split(/\s+/).filter((w) => w && !base.has(w) && w !== norm(cil) && !/^\d+[.,]\d+$/.test(w) && !COMBUSTIVEL.test(w)).join(" ");
    return {
      q: qDe(modelo),
      bruto: { mo: montadora, modelo, ano: anoModelo, cil: /^\d+[.,]\d$/.test(cil) ? cil.replace(",", ".") : "", versao: norm(versao) }, // para as listas do veículo
    };
  }
  // Exibição sem caixa alta ("Honda Civic", "Volkswagen Gol", "Mercedes-Benz Atego"); siglas ficam: VW, GM, BMW...,
  // palavra com número (HB20, 16V, 208), pedaço curto com hífen (CR-V) e, na versão, as de 2 a 4 letras (LXS, HX, GLI).
  // Só para mostrar: a busca continua com o texto da base.
  const SIGLAS = new Set(["VW", "GM", "BMW", "BYD", "JAC", "GWM", "MG", "DS", "RAM", "CAOA", "JCB", "DAF", "MAN", "AGCO"]);
  const LIGA = new Set(["E", "DE", "DA", "DO", "DAS", "DOS", "COM", "SEM", "PARA"]); // "Amortecedores e Kits"
  function bonito(txt, versao) {
    return String(txt || "").toUpperCase().replace(/\s+/g, " ").trim().replace(/[A-ZÀ-Ý0-9.]+/g, (w, i, todo) => {
      if (SIGLAS.has(w) || /\d/.test(w)) return w;
      if (!versao && i > 0 && LIGA.has(w) && todo[i - 1] === " ") return w.toLowerCase();
      if (versao && w.length <= 4) return w;
      if (w.length <= 2 && (todo[i - 1] === "-" || todo[i + w.length] === "-")) return w;
      return w.charAt(0) + w.slice(1).toLowerCase();
    });
  }

  // ---------- telas ----------
  // Início (T-0018, opção 4c aprovada e op4d, R-20261120-143900): cabeçalho integrado à faixa da marca, "+4.400 produtos
  // no portfólio", a busca geral e, ao lado, a placa Mercosul; embaixo, a lista tabelada de 8 peças (2 colunas no
  // computador) e os botões de sistema, que abrem a busca do sistema (R-20261120-152800). Sem preço e sem estoque.
  // Contador (R-20261120-141600, "2) a"): o serviço bapajudacatalogo-placas conta a abertura do produto pelo código
  // (POST /contar) e devolve os mais vistos (GET /mais-vistos?dias=7). Ligado com o serviço v1.1.0 no ar
  // (R-20261120-144530); com false, nenhuma chamada sai e o bloco é sempre "Destaques".
  // Contrato confirmado pelo integracao-placas: POST /contar {"codigo"} → 204; GET /mais-vistos?dias=7 → 200
  // {"total":N,"itens":[{"codigo","n"}]}, até 8 itens (decisão "1) B"), do mais aberto para o menos aberto.
  const CONTADOR_LIGADO = true;
  const SERVICO = PLACAS_URL.replace(/\/veiculo$/, ""); // a mesma URL base da placa
  const RECENTES_MIN = 20, RECENTES_MS = 3000; // menos de 20 aberturas em 7 dias, erro ou mais de 3 s: "Destaques"
  const N_LISTA = 8; // linhas da lista do início (op4c; o serviço devolve até 8)
  // a imagem da faixa do início (e do convite ao catálogo na Sobre): um lugar só para trocar
  const IMG_FAIXA = { src: "assets/hero_faixa.webp", w: 979, h: 661, alt: "Amortecedor, kit batente, óleos, bateria e peças de freio BAP" }; // a B (R-20261120-145600)
  const FOTO_SOBRE = "assets/card3.webp"; // a 1ª foto do topo da Sobre (a maior, no meio)
  let MAIS_VISTOS = null; // a resposta, uma vez por carga da página (só em memória)
  const CONTADOS = new Set(); // [SUPOSIÇÃO] cada código conta uma vez por carga da página
  // fire-and-forget: sem credenciais, sem esperar a resposta e sem travar a tela; a falha não aparece
  function contarAbertura(p) {
    if (!CONTADOR_LIGADO || !p || CONTADOS.has(p.c)) return;
    CONTADOS.add(p.c);
    try {
      // sem Content-Type (text/plain): sem a pré-checagem do CORS; keepalive: o pedido segue se a página sair
      fetch(SERVICO + "/contar", { method: "POST", body: JSON.stringify({ codigo: p.c }), keepalive: true, ...SEM_RASTRO }).catch(() => {});
    } catch (e) { /* sem contador */ }
  }
  // os mais vistos que estão no catálogo (até N_LISTA), ou null (desligado, erro, mais de 3 s, total < 20 ou menos de 4 no catálogo)
  function maisVistos() {
    if (!CONTADOR_LIGADO) return Promise.resolve(null);
    if (!MAIS_VISTOS) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), RECENTES_MS);
      MAIS_VISTOS = fetch(SERVICO + "/mais-vistos?dias=7", { signal: ctl.signal, ...SEM_RASTRO })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!j || !(Number(j.total) >= RECENTES_MIN) || !Array.isArray(j.itens)) return null;
          const lst = [...new Set(j.itens.map((x) => POR_COD.get(normCod(x && x.codigo))).filter(Boolean))].slice(0, N_LISTA);
          return lst.length >= 4 ? lst : null;
        })
        .catch(() => null)
        .finally(() => clearTimeout(t));
    }
    return MAIS_VISTOS;
  }
  // Destaques (critério fixo): foto, aplicação, referência cruzada, ficha técnica e ofereça junto; um por sistema, dos
  // sistemas com mais produtos; no sistema, o menor código. Sem N_LISTA assim, afrouxa nessa ordem: sem o ofereça
  // junto, e depois repete sistema. O diferencial BAP saiu da tela, da ficha impressa do site e do critério (R-20261120-155900 e -160300).
  let DESTAQUES = null;
  function destaques() {
    if (DESTAQUES) return DESTAQUES;
    const ordemSi = new Map(contar(BASE.produtos, "si").map(([s], i) => [s, i]));
    const base = BASE.produtos.filter((p) => p.i && p.a && (p.r || []).some((x) => x.c) && (p.x || []).length)
      .sort((a, b) => (ordemSi.get(a.si) - ordemSi.get(b.si)) || (a.c < b.c ? -1 : a.c > b.c ? 1 : 0));
    const niveis = [(p) => p.oj, () => true];
    const escolha = [];
    for (const ok of niveis) {
      for (const p of base) if (escolha.length < N_LISTA && ok(p) && !escolha.some((e) => e.si === p.si)) escolha.push(p);
      if (escolha.length === N_LISTA) break;
    }
    for (const p of base) if (escolha.length < N_LISTA && !escolha.includes(p)) escolha.push(p);
    return (DESTAQUES = escolha);
  }
  // a linha da lista: miniatura, código, descrição de 1 linha, sistema (só no computador) e a seta
  const pecaHtml = (p) => `<li><a class="rec-item" href="#/produto/${encodeURIComponent(p.c)}">
      <span class="rec-foto">${fotoHtml(p)}</span>
      <span class="rec-txt"><b>${esc(p.c)}</b><span>${esc(titulo(p.d))}</span></span>
      <span class="rec-si">${esc(titulo(p.si))}</span><span class="rec-seta" aria-hidden="true">›</span></a></li>`;
  function blocoPecas(sec, recentes) {
    const lst = recentes || destaques();
    sec.removeAttribute("aria-busy");
    sec.innerHTML = `<div class="rec-topo"><div><h2>${recentes ? "Mais vistas" : "Destaques"}</h2>
        <p class="sub">${recentes ? "Peças mais abertas nos últimos 7 dias" : "Peças com foto e ficha completa"}</p></div>
        <a class="rec-todos" href="#/busca">Ver todos<span class="so-pc"> os produtos</span> <span aria-hidden="true">›</span></a></div>
      <ul class="rec-lista">${lst.map(pecaHtml).join("")}</ul>`;
  }
  // op4d e s2: no início e na Sobre o cabeçalho fica transparente sobre a faixa; ao rolar, ganha o fundo --escuro. Nas outras telas
  // ele é escuro (T-0018, opção b), com o mesmo logo branco (a troca de rota tira as classes antes do render)
  const marcarRolagem = () => document.body.classList.toggle("topo-rolou", window.scrollY > 8);
  window.addEventListener("scroll", marcarRolagem, { passive: true });
  const topoInicio = (sim) => { document.body.classList.toggle("inicio-marca", sim); marcarRolagem(); };
  const topoSobre = (sim) => document.body.classList.toggle("sobre-marca", sim); // s2: o cabeçalho transparente da Sobre
  window.addEventListener("hashchange", () => { topoInicio(false); topoSobre(false); });
  function telaInicio() {
    const portfolio = Math.floor(BASE.total / 100) * 100; // op4d: o total arredondado para baixo à centena (4.419 → +4.400)
    const celular = EX_CURTO(); // o exemplo da busca geral e o título em 1 linha (R-20261120-155400) cabem no celular
    topoInicio(true);
    app.innerHTML = `
      <section class="marca-faixa">
        <div class="marca-faixa-in">
          <div class="mf-texto">
            <h1>${celular ? "A peça certa pro seu" : "A peça certa <br>para o seu"} <em>veículo</em>.</h1>
            <p class="mf-num"><b class="mf-total">+${fmt(portfolio)}</b><span>produtos <br>no portfólio</span></p>
          </div>
          <div class="mf-foto"><img src="${IMG_FAIXA.src}" width="${IMG_FAIXA.w}" height="${IMG_FAIXA.h}" alt="${esc(IMG_FAIXA.alt)}" fetchpriority="high"></div>
          <div class="mf-busca">
            <form class="mf-bloco mf-geral" id="form-geral" role="search" autocomplete="off" aria-label="Buscar produtos">
              <label class="campo-rot v-rot" for="campo-q">Código, descrição ou aplicação</label>
              <div class="mf-linha">
                <input id="campo-q" name="q" type="search" enterkeyhint="search" placeholder="${celular ? EX_Q : EX_Q_LONGO}">
                <button type="submit" class="bt">Buscar</button>
              </div>
            </form>
            <form class="mf-bloco v-placa" id="form-placa" autocomplete="off" aria-label="Buscar pela placa">
              <label class="campo-rot v-rot" for="campo-placa">Placa do veículo</label>
              <div class="mf-linha">
                <div class="v-placa-campo">
                  <span class="v-placa-faixa" aria-hidden="true">BR</span>
                  <input id="campo-placa" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="8" enterkeyhint="search" placeholder="Ex.: ABC1D23" aria-describedby="status-placa">
                </div>
                <button type="submit" class="bt">Buscar</button>
              </div>
              <p class="status-placa" id="status-placa" role="status" aria-live="polite" hidden></p>
            </form>
          </div>
        </div>
      </section>
      <section class="bloco recentes-bloco" aria-busy="true"><ul class="rec-lista espera" aria-hidden="true">${"<li><span class=\"rec-item\"><span class=\"rec-foto\"></span></span></li>".repeat(N_LISTA)}</ul></section>
      <section class="bloco sistemas-bloco" aria-labelledby="tit-sistemas">
        <h2 id="tit-sistemas">Navegue por sistema</h2>
        <div class="sistemas">${contar(BASE.produtos, "si").map(([si, n]) => `<a class="sistema" href="#/busca?si=${encodeURIComponent(si)}"><i aria-hidden="true"></i><b>${esc(titulo(si))}</b><span>${nProd(n)}</span></a>`).join("")}</div>
      </section>`;
    const sec = app.querySelector(".recentes-bloco");
    if (!CONTADOR_LIGADO) blocoPecas(sec, null);
    else maisVistos().then((lst) => { if (sec.isConnected) blocoPecas(sec, lst); });

    // os 2 botões fazem a mesma busca do quadro da busca (montarBusca): placa vazia, busca o texto; com a placa,
    // buscarPelaPlaca (o veículo e o texto q juntos)
    const fG = app.querySelector("#form-geral");
    const fP = app.querySelector("#form-placa"), cP = fP.querySelector("#campo-placa"), st = fP.querySelector("#status-placa");
    const buscarInicio = submitPlaca(cP, st, { q: () => fG.elements.q.value.trim(), botoes: [...app.querySelectorAll(".mf-busca button")],
      ocupado: fP, texto: (q) => irPara("/busca", { q }) });
    fG.addEventListener("submit", buscarInicio);
    fP.addEventListener("submit", buscarInicio);
  }

  function telaBusca(pr) {
    const todos = buscar(pr);
    let mostrando = 0;
    app.innerHTML = `<div class="busca-faixa"><div id="busca-topo"></div></div><div class="pagina-busca">
      <div class="barra-filtros" role="group" aria-label="Filtros"></div>
      <div class="etiquetas" role="group" aria-label="Filtros da pesquisa" hidden></div>
      <div class="res-topo"><h1>${pr.get("q") ? "Resultados" : "Todos os produtos"}</h1>
        <span class="total" aria-live="polite">${todos.length ? nProd(todos.length) : ""}</span></div>
      ${todos.length && todos.casaram < todos.palavras ? `<p class="aviso proximos" role="status" style="margin:0 0 14px;font-size:14px"><b>Nenhum produto tem todas as palavras.</b> Estes são os mais próximos: casam com ${fmt(todos.casaram)} de ${fmt(todos.palavras)} palavras${todos.faltam.length ? `. Não casou: ${todos.faltam.map((t) => `“${esc(t.toLowerCase())}”`).join(", ")}` : ""}.</p>` : ""}
      <div class="lista"></div><div class="mais"></div></div>`;
    montarBusca(document.getElementById("busca-topo"), pr);
    montarFiltros(pr, todos);
    montarLayout(pr, todos);
    const lista = app.querySelector(".lista");
    const mais = app.querySelector(".mais");
    // insere os próximos cartões e ajusta as etiquetas só deles (a volta à lista insere todos de uma vez)
    function pagina(qtd = POR_PAGINA) {
      const ini = lista.children.length;
      lista.insertAdjacentHTML("beforeend", todos.slice(mostrando, mostrando + qtd).map((p, i) => itemHtml(p, ini + i)).join(""));
      mostrando = Math.min(todos.length, mostrando + qtd);
      ajustarEtiquetas([...lista.children].slice(ini).map((c) => c.querySelector(".refs")).filter(Boolean));
      mais.innerHTML = mostrando < todos.length ? `<button class="bt bt-claro" type="button">Carregar mais (${fmt(todos.length - mostrando)} restantes)</button>` : "";
    }
    mais.addEventListener("click", () => pagina());
    lista.addEventListener("click", (ev) => { const bz = ev.target.closest(".foto-zoom"); if (bz) abrirZoom(bz); });
    if (!todos.length) {
      if (pr.get("vm")) {
        lista.outerHTML = `<div class="vazio"><b>Nada para ${esc(nomeVeiculo(pr))} com essa busca.</b>Tente outra busca ou veja tudo sem o veículo.<p><button type="button" class="bt bt-claro vazio-tirar">Tirar o veículo</button></p></div>`;
        app.querySelector(".vazio-tirar").addEventListener("click", () => tirarVeiculo(pr));
      } else
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
        if (box) { alvo = [...box.querySelectorAll("input")].find((x) => x.value === ff.v) || box.querySelector(".filtro-bt"); }
      } else alvo = app.querySelector(".etiquetas:not([hidden]) button") || app.querySelector(".barra-filtros .filtro-bt") || app.querySelector("#campo-q");
      return { y: ff.y, alvo };
    }
    return volta;
  }

  // ---------- filtros e etiquetas (R-20261120-113148 e R-20261120-123800, Alexandre) ----------
  // Um grupo por filtro, aberto, com caixas de marcar (uma ou mais) e a contagem, na ordem fixa Linha, Categoria,
  // Sistema, Família, no computador e no celular (R-20261120-145600-alexandre); o botão do grupo só recolhe. Ficam na
  // coluna à esquerda dos cartões (no celular, no painel "Filtrar"). A lógica: si=, fa=, li= e ca= no endereço
  // (repetidos quando há mais de um). As opções de cada grupo e a ordem delas vêm da busca sem nenhum filtro marcado
  // (não somem ao marcar outro); a contagem, da busca com os outros filtros. Com 0, a opção fica cinza e desabilitada
  // (a marcada, nunca). Abaixo, as etiquetas do termo (q) e de cada filtro marcado, com o X, e o "Limpar tudo". A
  // placa e o veículo ficam no quadro da busca (montarBusca).
  const ROT_FILTRO = { li: "Linha", ca: "Categoria", si: "Sistema", fa: "Família" };
  let FILTRO_FOCO = null; // { k, v, y }: o que reabrir e focar depois de refazer a lista
  function montarFiltros(pr, todos) {
    const barra = app.querySelector(".barra-filtros");
    const semFiltros = new URLSearchParams(pr); Object.keys(ROT_FILTRO).forEach((k) => semFiltros.delete(k));
    const universo = semFiltros.toString() === pr.toString() ? todos : buscar(semFiltros);
    barra.innerHTML = Object.keys(ROT_FILTRO).map((k) => {
      const marcados = pr.getAll(k).filter(Boolean);
      const semEste = new URLSearchParams(pr); semEste.delete(k);
      const base = marcados.length ? buscar(semEste) : todos;
      const qtd = new Map(contar(base, k));
      const op = contar(universo, k).slice(0, 40).map(([v]) => [v, qtd.get(v) || 0]);
      for (const v of marcados) if (!op.some(([x]) => x === v)) op.push([v, qtd.get(v) || 0]);
      if (!op.length) return ""; // a coluna aparece sempre, mesmo com uma opção só (R-20261120-130300)
      return `<div class="filtro" data-k="${k}">
        <button class="filtro-bt" type="button" aria-expanded="true" aria-controls="filtro-${k}"><span>${ROT_FILTRO[k]}${marcados.length ? ` <b>(${marcados.length})</b>` : ""}</span><span class="seta" aria-hidden="true">▾</span></button>
        <div class="filtro-lista" id="filtro-${k}" role="group" aria-label="${ROT_FILTRO[k]}">${op.map(([v, n]) => {
          const marc = marcados.includes(v), off = !n && !marc;
          return `<label${off ? ' class="off"' : ""}><input type="checkbox" value="${esc(v)}"${marc ? " checked" : ""}${off ? ' disabled aria-disabled="true"' : ""}><span>${esc(titulo(v))}</span><em>${fmt(n)}</em></label>`;
        }).join("")}</div></div>`;
    }).join("");
    for (const box of barra.querySelectorAll(".filtro")) {
      const k = box.dataset.k, bt = box.querySelector(".filtro-bt");
      bt.addEventListener("click", () => { // recolhe ou abre só este grupo
        const aberto = bt.getAttribute("aria-expanded") === "true";
        box.querySelector(".filtro-lista").hidden = aberto;
        bt.setAttribute("aria-expanded", String(!aberto));
      });
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
    // a etiqueta da busca mostra só o termo entre aspas (R-20261120-141300); o ✕ continua dizendo "Busca" ao leitor de tela
    if (q) itens.push({ nome: "“" + q + "”", leitor: "Busca: “" + q + "”", tirar: (n) => n.delete("q") });
    for (const k of Object.keys(ROT_FILTRO)) for (const v of pr.getAll(k).filter(Boolean))
      itens.push({ nome: ROT_FILTRO[k] + ": " + titulo(v), tirar: (n) => { const r = n.getAll(k).filter((x) => x !== v); n.delete(k); r.forEach((x) => n.append(k, x)); } });
    if (!itens.length) return;
    etq.hidden = false;
    etq.innerHTML = itens.map((it, i) => `<span class="etq"><span>${esc(it.nome)}</span><button type="button" data-i="${i}" aria-label="${esc("Tirar " + (it.leitor || it.nome))}">✕</button></span>`).join("")
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

  // ---------- faixa do veículo e filtros à esquerda (R-20261120-122100, 123630, 123800, 124800 e 130300) ----------
  // As listas do veículo saem do campo "ve" do produtos.json (T-0017: marca, modelo e versão), o ano do an e das
  // faixas da aplicação e o motor dos números "1.8" da aplicação. Num JSON sem nenhum "ve" (antigo), marca e modelo
  // saem do campo mo e da aplicação.
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
    "TODAS", "DIANT", "TRAS", "LINHA", "MOTOR", "GERACAO", "FASE", "SERIE", "VERSAO", "COM", "SEM", "ATE", 
    "TURBO", "AUT", "MEC", "WAGON", "VAN", "CARGO", "DUPLA", "SIMPLES", "CAB", "ESQ", "DIR", "SPORT", "CLASSIC",
    "AGRICOLA", "TRATOR", "ONIBUS", "CAMINHAO", "MICRO", "UTILITARIO", "MODELOS", "ANO", "ANOS", "APOS", "ANTES", "DESDE", "EM", "DIANTE"]);
  // JSON antigo: a marca escrita na aplicação, com os apelidos ("VW - Gol" é Volkswagen, "GM - Corsa" é Chevrolet)
  const RX_MARCA = new Map();
  const nomesDaMarca = (vm) => [vm, ...String(APELIDOS[vm] || "").split(" ").filter(Boolean)];
  const rxMarcaNaApl = (vm) => { if (!RX_MARCA.has(vm)) RX_MARCA.set(vm, new RegExp("(?:^|[^A-Z])(?:" + nomesDaMarca(vm).map(reEsc).join("|") + ")\\s*[-:]?\\s*([^·;(]+)", "g")); return RX_MARCA.get(vm); };
  // o produto é da marca (JSON antigo): pelo campo mo ou pela marca (e os apelidos) escrita na aplicação
  const daMarca = (e, vm) => marcasDe(e).includes(vm) || nomesDaMarca(vm).some((n) => temPalavra(e.apl, n));
  // a palavra inteira (texto em maiúsculas e sem acento), guardada por palavra e flags; com "g", quem usa acerta o lastIndex
  const RX_PALAVRA = new Map();
  const rxPalavra = (w, flags = "") => {
    const k = flags + "|" + w;
    if (!RX_PALAVRA.has(k)) RX_PALAVRA.set(k, new RegExp("(^|[^A-Z0-9])" + reEsc(w) + "($|[^A-Z0-9])", flags));
    const r = RX_PALAVRA.get(k);
    r.lastIndex = 0;
    return r;
  };
  const temPalavra = (txt, w) => rxPalavra(w).test(txt);
  // Campo "ve" da T-0017 ([fabricante, modelo, versão?]): a cascata usa ele; sem nenhum "ve" no JSON (antigo), cai na
  // montagem pela aplicação. O ano continua vindo do an e da aplicação.
  // Com o campo "ve" no JSON (detectado uma vez em carregar(): TEM_VE), produto SEM "ve" fica fora do filtro e das
  // contagens (os duvidosos e os sem veículo; R-20261120-123130). A montagem pela aplicação só vale no JSON antigo.
  const veDe = (e) => (Array.isArray(e.p.ve) && e.p.ve.length ? e.p.ve.map((x) => [norm(x[0]), norm(x[1]), norm(x[2] || "")]) : null);
  const marcasDe = (e) => { const ve = veDe(e); return ve ? [...new Set(ve.map((x) => x[0]))] : norm(e.p.mo).split(/\s*[\/,]\s*/).filter(Boolean); };
  const motoresDe = (e) => [...new Set((e.apl.match(/\b\d[.,]\d\b/g) || []).map((m) => m.replace(",", ".")))];
  const anoServe = (e, ano) => casaAno(e, ano) !== 0; // o ano da base (an) primeiro, depois a aplicação (T-0011); sem ano: serve
  // Motor = a cilindrada da aplicação ("1.8"); Versão = o 3º item do "ve" (T-0017). Produto que não diz o motor ou
  // a versão serve para qualquer um.
  function casaVeiculo(e, v) {
    const ve = veDe(e);
    if (TEM_VE && !ve) return false;
    const hits = ve ? ve.filter((x) => x[0] === v.vm && (!v.vmo || x[1] === v.vmo)) : null;
    if (ve ? !hits.length : !daMarca(e, v.vm) || (v.vmo && !temPalavra(e.apl, v.vmo))) return false;
    if (v.va && !anoServe(e, v.va)) return false;
    if (v.vmt) { const m = motoresDe(e); if (m.length && !m.includes(v.vmt)) return false; }
    if (v.vv && hits) { const vs = hits.map((x) => x[2]).filter(Boolean); if (vs.length && !vs.includes(v.vv)) return false; }
    return true;
  }
  // norm: "CITROËN" e "CITROEN" são a mesma marca (a placa manda com acento; a base compara sem)
  const veiculoDaRota = (pr) => ({ vm: norm(pr.get("vm")), vmo: norm(pr.get("vmo")), va: +pr.get("va") || 0, vmt: norm(pr.get("vmt")), vv: norm(pr.get("vv")) });
  const nomeVeiculo = (pr) => [pr.get("vm") && bonito(NOME_MARCA.get(norm(pr.get("vm"))) || pr.get("vm")), pr.get("vmo") && bonito(pr.get("vmo")), pr.get("va"), pr.get("vmt"), pr.get("vv") && bonito(pr.get("vv"), true)].filter(Boolean).join(" ");
  // tira o veículo da busca (o ✕ da placa e o "Tirar o veículo" do estado vazio); o foco vai para o campo da placa
  function tirarVeiculo(pr) {
    const n = new URLSearchParams(pr);
    VEI_K.forEach((k) => n.delete(k));
    FILTRO_FOCO = { y: 0, sel: "#campo-placa" };
    irPara("/busca", n);
  }

  // opções de cada lista, só com o que existe para a escolha anterior, com a contagem de produtos
  // (designer-ux: a contagem é só dentro do resultado da busca e dos filtros atuais, sem o próprio veículo)
  let E_DE = null; // produto → entrada do INDICE
  function opcoesVeiculo(v, pr) {
    if (!E_DE) E_DE = new Map(INDICE.map((e) => [e.p, e]));
    const semVei = new URLSearchParams(pr); VEI_K.forEach((k) => semVei.delete(k));
    const base = buscar(semVei).map((p) => E_DE.get(p));
    const marcas = new Map(), modelos = new Map(), anos = new Map(), motores = new Map(), versoes = new Map();
    let semMotor = 0, semVersao = 0;
    for (const e of base) {
      if (TEM_VE && !veDe(e)) continue;
      for (const m of marcasDe(e)) marcas.set(m, (marcas.get(m) || 0) + 1);
      const ve = veDe(e);
      if (!v.vm || !(ve ? ve.some((x) => x[0] === v.vm) : daMarca(e, v.vm))) continue;
      // modelo: do "ve" (T-0017) ou, sem ele, o que vem logo depois da marca na aplicação ("HONDA - Civic · ...",
      // "VW - Gol / Saveiro · ..."), 1ª palavra de cada pedaço (só no JSON antigo)
      const ws = new Set(ve ? ve.filter((x) => x[0] === v.vm).map((x) => x[1]) : []);
      if (!ve) for (const mt of e.apl.matchAll(rxMarcaNaApl(v.vm)))
        for (const pd of mt[1].split("/")) { const w = (pd.trim().match(/^[A-Z][A-Z0-9]+/) || [""])[0]; if (w.length >= 2 && !ehVersao(w) && !PARA_FORA.has(w) && w !== v.vm) ws.add(w); }
      for (const w of ws) modelos.set(w, (modelos.get(w) || 0) + 1);
      if (!v.vmo || !(ve ? ve.some((x) => x[0] === v.vm && x[1] === v.vmo) : temPalavra(e.apl, v.vmo))) continue;
      const an = e.p.an && (e.p.an[0] || e.p.an[1]) ? [[e.p.an[0] || 1980, e.p.an[1] || ANO_HOJE]] : null;
      const fx = an || (e.faixas.length ? e.faixas : [[1980, ANO_HOJE]]);
      const vistos = new Set();
      for (const [de, ate] of fx) for (let a = Math.max(1980, de || 1980); a <= Math.min(ANO_HOJE, ate || ANO_HOJE); a++) vistos.add(a);
      for (const a of vistos) anos.set(a, (anos.get(a) || 0) + 1);
      if (!v.va || !anoServe(e, v.va)) continue;
      const ms = motoresDe(e); // Motor: a cilindrada da aplicação
      if (!ms.length) semMotor++;
      for (const m of ms) motores.set(m, (motores.get(m) || 0) + 1);
      if (v.vmt && ms.length && !ms.includes(v.vmt)) continue;
      const vs = ve ? [...new Set(ve.filter((x) => x[0] === v.vm && x[1] === v.vmo && x[2]).map((x) => x[2]))] : []; // Versão: o "ve"
      if (!vs.length) semVersao++;
      for (const x of vs) versoes.set(x, (versoes.get(x) || 0) + 1);
    }
    const temVersao = versoes.size > 0; // sem dado de versão para o modelo: a lista fica desabilitada com "—"
    if (v.vv && !versoes.has(v.vv)) versoes.set(v.vv, 0); // a versão que veio da placa entra pré-escolhida
    if (semVersao) for (const k of versoes.keys()) versoes.set(k, versoes.get(k) + semVersao);
    // motor que veio da placa e não está escrito na aplicação: entra com os produtos que não dizem o motor
    if (v.vmt && !motores.has(v.vmt)) motores.set(v.vmt, 0);
    if (semMotor) for (const k of motores.keys()) motores.set(k, motores.get(k) + semMotor);
    // a escolha que está na tela fica na lista mesmo com 0 (o estado vazio avisa e oferece "Tirar o veículo")
    const ficar = (m, x) => { if (x && !m.has(x)) m.set(x, 0); };
    ficar(marcas, v.vm); ficar(modelos, v.vmo); ficar(anos, v.va || 0); anos.delete(0);
    const top = (m, n) => [...m.entries()].filter(([x, q]) => q > 0 || x === v.vm || x === v.vmo).sort((a, b) => b[1] - a[1]).slice(0, n);
    return {
      vm: top(marcas, 60).sort((a, b) => a[0].localeCompare(b[0])),
      vmo: top(modelos, 80).filter(([x, q]) => q >= 2 || x === v.vmo).sort((a, b) => a[0].localeCompare(b[0])), // JSON antigo: tira o que aparece 1 vez só
      va: [...anos.entries()].filter(([x, q]) => q > 0 || x === v.va).sort((a, b) => b[0] - a[0]),
      vmt: [...motores.entries()].filter(([x, q]) => q > 0 || x === v.vmt).sort((a, b) => a[0].localeCompare(b[0])),
      vv: [...versoes.entries()].filter(([x, q]) => q > 0 || x === v.vv).sort((a, b) => a[0].localeCompare(b[0])),
      temVersao,
    };
  }
  let MV_ABERTO = false; // celular: as listas do veículo abertas (continua aberto ao escolher a próxima lista)
  // Faixa do veículo (R-20261120-124800): Placa · Marca · Modelo · Ano · Motor · Versão, cada um com o rótulo em cima.
  // A placa consultada em destaque (só da memória desta busca) com o ✕ que tira o veículo; sem placa, a caixa com "—".
  // Trocar o veículo é escolher outra marca ou modelo (ou consultar outra placa no quadro de cima).
  function meuVeiculoHtml(pr) {
    const v = veiculoDaRota(pr);
    const op = opcoesVeiculo(v, pr);
    const mem = VEICULO_PLACA && VEICULO_PLACA.placa && VEICULO_PLACA.chave === chaveVeiculo(pr) ? VEICULO_PLACA : null;
    // com a placa consultada (R-20261120-130300): as 5 listas travadas, em cinza, com os valores da placa; o ✕ destrava
    const lista = (k, rot, todos, valor, ativo0, fmtV) => {
      if (mem) return `<label class="mv-campo"><span>${rot}</span><select data-k="${k}" class="travada" disabled><option>${valor ? esc(fmtV(valor)) : "—"}</option></select></label>`;
      const ativo = ativo0 && (op[k].length > 0 || !!valor); return `<label class="mv-campo"><span>${rot}</span>
      <select data-k="${k}"${ativo ? "" : " disabled"}><option value="">${todos}</option>${ativo ? op[k].map(([x, n]) =>
        `<option value="${esc(String(x))}"${String(x) === String(valor) ? " selected" : ""}>${esc(fmtV(x))} (${fmt(n)})</option>`).join("") : ""}</select></label>`; }; // lista sem opção: desabilitada com "—"
    const curto = EX_CURTO(); // "Todas"/"Todos" no celular; no computador, "Todas as marcas" etc.
    const resumo = nomeVeiculo(pr);
    // celular: o resumo vai no DOM na ordem da tela (Tab sem tabindex): fechada, a placa e o ✕ à esquerda e o resumo
    // ao lado (depois das listas); aberta, o resumo em cima (antes das listas). ligarMeuVeiculo move ao alternar.
    const resumoHtml = `<div class="mv-resumo">${resumo ? `<span class="mv-resumo-txt">${esc(resumo)}</span>` : ""}
        <button type="button" class="mv-alterar" aria-expanded="${MV_ABERTO}" aria-controls="mv-listas">${resumo ? "Alterar veículo" : "Escolher veículo"}</button></div>`;
    return `<section class="meu-veiculo faixa-modelo${MV_ABERTO ? " aberto" : ""}" aria-label="Veículo">
      ${MV_ABERTO ? resumoHtml : ""}
      <div class="mv-listas" id="mv-listas">
        <div class="mv-campo mv-campo-placa"><span id="mv-placa-rot">Placa</span>${mem
          ? `<span class="mv-placa-grande" aria-labelledby="mv-placa-rot"><b>${esc(mem.placa)}</b><button type="button" class="mv-tirar" aria-label="Tirar a placa e o veículo">✕</button></span>`
          : `<span class="mv-placa-grande vazia" aria-labelledby="mv-placa-rot"><b aria-hidden="true">—</b><span class="vh">nenhuma placa consultada</span></span>`}</div>
        ${lista("vm", "Marca", curto ? "Todas" : "Todas as marcas", v.vm, true, (x) => bonito(NOME_MARCA.get(x) || x))}
        ${lista("vmo", "Modelo", curto ? "Todos" : "Todos os modelos", v.vmo, !!v.vm, (x) => bonito(x))}
        ${lista("va", "Ano", curto ? "Todos" : "Todos os anos", v.va || "", !!v.vmo, (x) => String(x))}
        ${lista("vmt", "Motor", curto ? "Todos" : "Todos os motores", v.vmt, !!v.va, (x) => String(x))}
        ${lista("vv", "Versão", curto ? "Todas" : "Todas as versões", v.vv, !!v.va && (op.temVersao || !!v.vv), (x) => bonito(String(x), true))}
      </div>
      ${MV_ABERTO ? "" : resumoHtml}
    </section>`;
  }
  function ligarMeuVeiculo(sec, pr) {
    sec.addEventListener("change", (ev) => {
      const k = ev.target.dataset.k;
      if (!k) return;
      const n = new URLSearchParams(pr);
      const i = VEI_K.indexOf(k);
      VEI_K.slice(i).forEach((x) => n.delete(x)); // a escolha nova limpa as listas de baixo
      if (ev.target.value) n.set(k, ev.target.value);
      FILTRO_FOCO = { y: window.scrollY, sel: `select[data-k="${VEI_K[Math.min(i + 1, VEI_K.length - 1)]}"]:not([disabled]), select[data-k="${k}"]` };
      irPara("/busca", n);
    });
    const x = sec.querySelector(".mv-tirar");
    if (x) x.addEventListener("click", () => tirarVeiculo(pr));
    // celular: a faixa fica numa linha; "Alterar veículo" (ou "Escolher veículo") abre as listas
    const alt = sec.querySelector(".mv-alterar"), res = sec.querySelector(".mv-resumo");
    alt.addEventListener("click", () => {
      MV_ABERTO = !sec.classList.contains("aberto");
      sec.classList.toggle("aberto", MV_ABERTO);
      alt.setAttribute("aria-expanded", String(MV_ABERTO));
      if (MV_ABERTO) { sec.prepend(res); (sec.querySelector("select:not([disabled])") || alt).focus(); } else { sec.append(res); alt.focus(); } // DOM na ordem da tela
    });
  }
  // a faixa do veículo abaixo do quadro da busca; os filtros numa coluna fina à esquerda dos cartões, de cima a baixo (R-20261120-123800)
  // (no celular, no botão "Filtrar (n)", que abre o painel por cima)
  const CELULAR = window.matchMedia("(max-width: 900px)"); // coluna de filtros ou botão "Filtrar"
  CELULAR.addEventListener("change", () => { if (lerRota().caminho === "/busca" && !JANELA && !ZOOM) render(); }); // girar o tablet
  function montarLayout(pr, todos) {
    const pagina = app.querySelector(".pagina-busca");
    const barra = app.querySelector(".barra-filtros");
    const etqs = app.querySelector(".pagina-busca .etiquetas");
    const topo = app.querySelector(".res-topo");
    const nMarcados = Object.keys(ROT_FILTRO).reduce((t, k) => t + pr.getAll(k).filter(Boolean).length, 0);
    pagina.insertAdjacentHTML("afterbegin", meuVeiculoHtml(pr)); // um bloco só (um aria-label), logo abaixo da faixa escura da busca
    ligarMeuVeiculo(app.querySelector(".pagina-busca .meu-veiculo"), pr);
    if (CELULAR.matches) {
      const rotulo = "Filtrar" + (nMarcados ? ` (${nMarcados})` : "");
      topo.querySelector("h1").insertAdjacentHTML("afterend", `<button type="button" class="bt bt-claro bt-mini bt-filtrar" aria-haspopup="dialog">${rotulo}</button>`);
      const dlg = document.createElement("dialog");
      dlg.className = "painel-c";
      dlg.setAttribute("aria-labelledby", "painel-c-tit");
      dlg.innerHTML = `<div class="painel-cab"><b id="painel-c-tit">Filtrar</b><button type="button" class="painel-x" aria-label="Fechar">✕</button></div>
        <div class="painel-corpo"></div>
        <div class="painel-pe"><button type="button" class="bt painel-ok">Ver ${nProd(todos.length)}</button></div>`;
      dlg.querySelector(".painel-corpo").appendChild(barra);
      pagina.appendChild(dlg);
      topo.querySelector(".bt-filtrar").addEventListener("click", abrirPainel);
      dlg.querySelector(".painel-x").addEventListener("click", fecharPainel);
      dlg.querySelector(".painel-ok").addEventListener("click", fecharPainel);
      dlg.addEventListener("click", (ev) => { if (ev.target === dlg) fecharPainel(); });
      dlg.addEventListener("cancel", (ev) => { ev.preventDefault(); fecharPainel(); });
      return;
    }
    const grade = document.createElement("div");
    grade.className = "res-grade";
    const conteudo = document.createElement("div");
    conteudo.className = "res-conteudo";
    const lado = document.createElement("aside");
    lado.className = "lado-filtros";
    lado.setAttribute("aria-label", "Filtros");
    lado.innerHTML = `<p class="lado-sub">Filtros</p>`;
    lado.appendChild(barra);
    const depois = [...pagina.children].filter((el) => el.compareDocumentPosition(etqs) & Node.DOCUMENT_POSITION_PRECEDING);
    etqs.after(grade);
    grade.appendChild(lado);
    grade.appendChild(conteudo);
    depois.forEach((el) => conteudo.appendChild(el));
  }

  // códigos de "Leve também" (campo oj): os do catálogo e os que têm cara de código (letra e número),
  // sem repetir; as observações soltas ("s/ ar", "c/ ar") ficam fora
  function listaCodigos(txt) {
    const vistos = new Set();
    return String(txt || "").split(/\s*[·,;/|]\s*|\s+/).map((c) => c.trim()).filter((c) => {
      const k = normCod(c);
      if (!k || vistos.has(k) || !(POR_COD.has(k) || (k.length >= 4 && /[A-Z]/.test(k) && /\d/.test(k)))) return false;
      vistos.add(k);
      return true;
    });
  }
  // cada item (opção B, R-20261120-140600): a miniatura da foto (até 48 px), o código em negrito e a descrição (d) do
  // catálogo, num cartão que abre o produto (R-20261120-132000 e 132200); fora do catálogo: o código e a nota
  // "fora do catálogo", sem link. A miniatura é enfeite (alt vazio): o código e a descrição já dizem o item.
  // No PDF vai o texto, sem link e sem miniatura.
  const miniHtml = (p) => `<span class="rel-foto" aria-hidden="true">${p && p.i
    ? `<img src="img/${encodeURIComponent(p.i)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='assets/logo_escuro.png';this.className='sem'">`
    : '<img class="sem" src="assets/logo_escuro.png" alt="">'}</span>`;
  function itensRelHtml(cods) {
    return `<ul class="itens-rel">${cods.map((c) => {
      const p = POR_COD.get(normCod(c));
      return p
        ? `<li><a class="item-rel" href="#/produto/${encodeURIComponent(p.c)}">${miniHtml(p)}<span class="rel-txt"><b>${esc(p.c)}</b><span title="${esc(p.d)}">${esc(p.d)}</span></span></a></li>`
        : `<li><span class="item-rel fora">${miniHtml(null)}<span class="rel-txt"><b>${esc(c)}</b><span>fora do catálogo</span></span></span></li>`;
    }).join("")}</ul>`;
  }
  // "Leve também" (faixa verde-clara), logo abaixo dos botões e antes da aplicação (opção B, R-20261120-140600): o título
  // à esquerda no computador e em cima no celular. "Itens parecidos" e "Diferencial BAP" saíram da tela e da ficha
  // impressa do site (R-20261120-155900-alexandre e R-20261120-160300-alexandre)
  const secJunto = (H2, cods) => cods.length
    ? `<section class="secao rel rel-oj"><${H2} class="secao-tit">Leve também</${H2}>${itensRelHtml(cods)}</section>` : "";

  // Tabela da aplicação: uma linha por veículo do "ve" (Marca, Modelo, Cilindrada, Versão, Ano). Marca, Modelo e
  // Versão são do "ve". SIMULAÇÃO: a base ainda não tem cilindrada nem ano por veículo; aqui eles saem do trecho da
  // aplicação onde o modelo aparece (o mesmo texto da lista Motor e do ano); o ano da base (an), se houver, vale
  // primeiro. Sem achar: "—".
  const fmtFaixa = ([de, ate]) => de <= SEM_INICIO ? "até " + ate : ate >= SEM_FIM ? de + "–" : de === ate ? String(de) : de + "–" + ate;
  // o ano sem fim ("2006–"): o leitor de tela ouve "2006 em diante" (o " em diante" fica só para ele, na .vh)
  const anoHtml = (an) => esc(an) + (/–$/.test(an) ? '<span class="vh"> em diante</span>' : "");
  function linhasVeiculos(p) {
    if (!Array.isArray(p.ve) || !p.ve.length) return [];
    const apl = String(p.a || ""), up = semAcento(apl).toUpperCase();
    const modelos = [...new Set(p.ve.map((x) => norm(x[1])).filter(Boolean))];
    const achar = (m, de) => { const r = rxPalavra(m, "g"); r.lastIndex = de; const x = r.exec(up); return x ? x.index + x[1].length : -1; };
    const trecho = new Map();
    for (const m of modelos) {
      const i = achar(m, 0);
      if (i < 0) { trecho.set(m, ""); continue; }
      let fim = Math.min(apl.length, i + 120);
      // o fim é o próximo modelo; o nome curto dentro do longo ("Palio" em "Palio Weekend") não corta o trecho do longo
      const longo = (o, j) => modelos.some((x) => x !== o && x.includes(o) && up.startsWith(x, j));
      for (const o of modelos) if (o !== m && !o.includes(m)) { let j = achar(o, i + m.length); while (j > 0 && longo(o, j)) j = achar(o, j + o.length); if (j > i && j < fim) fim = j; }
      trecho.set(m, apl.slice(i, fim));
    }
    const anoBase = p.an && (p.an[0] || p.an[1]) ? fmtFaixa([p.an[0] || SEM_INICIO, p.an[1] || SEM_FIM]) : "";
    // versões do mesmo modelo (Gol G5, G6, G7): o ano e a cilindrada só valem no pedaço da versão (da versão até a
    // próxima); a linha do modelo sem versão fica com o pedaço antes da 1ª versão ("Idea 1.4 2006> / Idea Adventure").
    // Ano solto ("08/2022") não é faixa: "—" (decisão da v19).
    const versoesDe = (m) => [...new Set(p.ve.filter((x) => norm(x[1]) === m && x[2]).map((x) => norm(x[2])))];
    const pedaco = (t, ver, outras) => {
      const tu = semAcento(t).toUpperCase();
      let ini = 0;
      if (ver) { const r = rxPalavra(ver).exec(tu); if (!r) return ""; ini = r.index + r[1].length + ver.length; }
      let fim = t.length;
      for (const o of outras) { const x = rxPalavra(o, "g"); x.lastIndex = ini; const y = x.exec(tu); if (y && y.index < fim) fim = y.index; }
      return t.slice(ver ? ini - ver.length : 0, fim);
    };
    const linhas = p.ve.map(([fab, mod, ver]) => {
      const m = norm(mod), vs = versoesDe(m);
      let t = trecho.get(m) || "";
      if (vs.length > 1 || (vs.length === 1 && p.ve.some((x) => norm(x[1]) === m && !x[2]))) t = pedaco(t, ver ? norm(ver) : "", vs.filter((v) => v !== norm(ver || "")));
      else if (!vs.length) { // o modelo repetido ("Pulse 1.0 L 12V · 2021 · Pulse 1.3 L 16V · 2022 até 2024"): só a 1ª entrada
        const r = rxPalavra(m, "g"), tu = semAcento(t).toUpperCase(); r.lastIndex = m.length; const x = r.exec(tu);
        if (x) t = t.slice(0, x.index + x[1].length);
      }
      const cil = cilDe(t)[0] || "";
      // só faixa de verdade; mais de uma faixa no trecho é dúvida: "—" (não se mostra ano errado)
      const fx = [...new Set(faixasDoTexto(t).filter(([de, ate]) => de !== ate).map(fmtFaixa))];
      const ano = anoBase || (fx.length === 1 ? fx[0] : "");
      return [bonito(NOME_MARCA.get(norm(fab)) || fab), mod, cil, ver || "", ano];
    });
    return linhas;
  }
  function tabelaVeiculos(linhas) {
    if (!linhas.length) return "";
    const traco = '<span aria-label="não informado">—</span>';
    // computador e PDF: a tabela; celular (até 480 px): uma lista por veículo, sem rolar de lado
    return `<div class="tab-rola"><table class="t tab-veiculos"><thead><tr><th scope="col">Marca</th><th scope="col">Modelo</th><th scope="col">Cilindrada</th><th scope="col">Versão</th><th scope="col">Ano</th></tr></thead>
      <tbody>${linhas.map((l) => `<tr>${l.map((c, i) => `<td>${c ? (i === 4 ? anoHtml(c) : esc(c)) : traco}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <ul class="lista-veiculos">${linhas.map(([ma, mo, ci, ve, an]) => `<li><b>${esc([ma, mo, ve].filter(Boolean).join(" "))}</b>${ci || an
        ? `<span>Cilindrada ${ci ? esc(ci) : traco} · Ano ${an ? anoHtml(an) : traco}</span>` : ""}</li>`).join("")}</ul>`;
  }
  // Cilindradas do texto, com a válvula quando vem junto ("2.0 L 16V" → "2.0 16V", "1.8 8v" → "1.8 8V"): a coluna
  // Cilindrada da tabela mostra as duas (decisão do gerente sobre o RD-0174)
  const RX_CIL = /\b(\d[.,]\d)\b(?:\s*L\b)?(?:\s*(\d{1,2})\s?V\b)?/gi;
  const cilDe = (t) => [...String(t || "").matchAll(RX_CIL)].map((m) => m[1].replace(",", ".") + (m[2] ? " " + m[2] + "V" : ""));
  // Ano da aplicação: "2011", "01/1979", "01/01/2012". O pedaço só de ano: "2011 até 2014", "2009>", "2007–2012",
  // "2014 em Diante", "até 2009", "- 12/2020", "01/01/2012 A 31/12/2015", "2000–2003 / 2002>", "(2009>)" e a lista
  // "2012, 2013, 2014". "1924–1979 até 2026" (modelo de caminhão na frente) não é só ano.
  const ANO_APL = String.raw`(?:\d{2}\/){0,2}(?:19|20)\d{2}`;
  const FAIXA_APL = String.raw`${ANO_APL}(?:\s*(?:at[ée]|a|–|-)\s*${ANO_APL})?(?:\s*(?:>|→|em diante|at[ée]))?`;
  const SO_ANO = new RegExp(String.raw`^(?:\(?(?:[-–]\s*|at[ée]\s+)?${FAIXA_APL}(?:\s*\/\s*${FAIXA_APL})?\)?|${ANO_APL}(?:\s*,\s*${ANO_APL})+)$`, "i");
  const RX_ANO = new RegExp(String.raw`(?<!\d)(?:\d{2}\/){0,2}((?:19|20)\d{2})(?!\d)`, "g");
  // Linhas da lista da aplicação (T-0017, R-20261120-153900): cada " ; " (bloco de marca) começa linha nova e, dentro do
  // bloco, cada " · " também; o pedaço só de ano fica na linha do veículo de antes ("BMW - X1 2.0 L 16V · 2011 até
  // 2014"). Só a tela: a busca continua lendo o p.a inteiro.
  const linhasAplic = (a) => String(a || "").split(/\s+;\s+/).flatMap((bloco) => bloco.split(/\s+·\s+/).reduce((ls, x) => {
    if (ls.length && SO_ANO.test(x.trim())) ls[ls.length - 1] += " · " + x; else ls.push(x);
    return ls;
  }, [])).filter((x) => x.trim());
  const ulAplic = (ls) => `<ul class="aplic">${ls.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  // "Outros veículos e detalhes" (R-20261120-155900-alexandre, RD-0174 e as revisões do PR #50): abaixo da tabela, só
  // as linhas do texto que a tabela não cobre. A comparação é por veículo: a linha se divide em " / ", na vírgula e no
  // " - " antes de um nome, e depois de um ano seguido de um nome ("Logan 2014> Sandero 2014>"). Cada veículo (sem
  // acento, sem maiúscula, com "Pick up" igual a "Pick-Up" e sem o "–" entre o modelo e o ano) só é coberto quando a
  // tabela tem o modelo (o mais longo que casa: "Duster Oroch" antes de "Duster") e a versão citada, TODAS as
  // cilindradas e válvulas dele e a faixa de anos dele, e não sobra mais nada (o "exc. Si", o "(Enc. Mod. Antigo)", o
  // "Sportback", o "Axor 2035"). O pedaço só de ano ("04/2002–07/2012 / Meriva") é coberto pela faixa de uma linha da
  // tabela. A linha só sai quando todos os veículos dela são cobertos.
  const SOBRA_APL = /\b(?:L|ATE|A|EM DIANTE|DIANTE)\b|[\s·>→–\-\/().,]+/g;
  const chaveApl = (t) => norm(t).replace(/([A-Z])-(?=[A-Z0-9])|([0-9])-(?=[A-Z])/g, "$1$2 ");
  function cobreVeiculo(v, tab) {
    const fx = faixasDoTexto(v);
    if (fx.length > 1) return false;
    const ano = fx.length ? fmtFaixa(fx[0]) : "";
    if (SO_ANO.test(v)) return !!ano && tab.some((r) => r[4] === ano);
    const casa = tab.filter(([, mod, , ver]) => v.startsWith(chaveApl(mod)) && rxPalavra(chaveApl(mod)).test(v) && (!ver || rxPalavra(chaveApl(ver)).test(v)));
    const longo = Math.max(0, ...casa.map((r) => chaveApl(r[1]).length)), rs = casa.filter((r) => chaveApl(r[1]).length === longo);
    if (!rs.length || (ano && !rs.some((r) => r[4] === ano))) return false;
    const cils = cilDe(v);
    if (!cils.every((c) => rs.some((r) => r[2] === c || (!c.includes(" ") && r[2].split(" ")[0] === c)))) return false;
    let u = v.replace(RX_CIL, " ");
    for (const [, mod, , ver] of rs) for (const w of [chaveApl(mod), chaveApl(ver)].filter(Boolean)) u = u.replace(rxPalavra(w, "g"), "$1 $2");
    if (fx.length) u = u.replace(RX_ANO, (x, a) => (+a === fx[0][0] || +a === fx[0][1] ? " " : x)); // só os anos da faixa
    return !/[A-Z0-9]/.test(u.replace(SOBRA_APL, " "));
  }
  const restoAplicacao = (p, tab) => linhasAplic(p.a).filter((l) => !chaveApl(l).replace(/^[A-Z][A-Z /&.]{0,30}?\s-\s/, "") // sem a marca do começo do bloco
    .split(/\s+\/\s*|\s*\/\s+|\s*,\s*(?=[A-Z])|\s+[–—-]\s+(?=[A-Z])|(?<=(?:19|20)\d{2}(?:>|\/?\.{3})?\)?)\s+(?=[A-Z])(?!(?:ATE|A|AO|EM DIANTE)\b)/).map((v) => v.replace(/\s+[–—-]\s+/g, " ").trim()).filter(Boolean)
    .every((v) => cobreVeiculo(v, tab)));
  // Conteúdo do produto (T-0014), igual na página e na janela. Na janela os títulos descem um nível
  // (h2 e h3), porque a lista por trás já tem o h1. A ficha de impressão (A4) sai deste mesmo conteúdo.
  function produtoHtml(p, naJanela) {
    const H = naJanela ? "h2" : "h1", H2 = naJanela ? "h3" : "h2", H3 = naJanela ? "h4" : "h3";
    const linhas = linhasAplic(p.a);
    const aplicacoes = linhas.length > 1 && (p.a || "").length > 160 ? ulAplic(linhas) : `<p>${esc(p.a)}</p>`;
    const refs = (p.r || []).filter((x) => x.c);
    const ficha = [];
    if (p.po) ficha.push(["Posição", titulo(p.po)]);
    if (p.la) ficha.push(["Lado", titulo(p.la)]);
    if (p.de) ficha.push(["Detalhe", p.de]);
    (p.x || []).forEach(([k, v]) => ficha.push([k, v]));
    const junto = listaCodigos(p.oj);
    const link = location.origin + location.pathname + "#/produto/" + encodeURIComponent(p.c);
    // com o campo "ve": a aplicação vira tabela (R-20261120-130900) e, embaixo, "Outros veículos e detalhes" (restoAplicacao);
    // no PDF, o texto inteiro vai embaixo da tabela, em letra pequena ("Aplicação completa"), para as restrições ("exc. Si")
    // não sumirem do material do cliente
    const tv = linhasVeiculos(p), tab = tabelaVeiculos(tv), resto = tab && p.a ? restoAplicacao(p, tv) : [];
    const miolo = tab
      ? tab + (resto.length ? `<div class="apl-resto nao-imprime"><${H3} class="secao-tit">Outros veículos e detalhes</${H3}>${ulAplic(resto)}</div>` : "")
        + (p.a ? `<div class="so-impressao"><${H3} class="secao-tit">Aplicação completa</${H3}><div class="aviso">${aplicacoes}</div></div>` : "")
      : p.a ? aplicacoes : "";
    const secApl = miolo ? `<section class="secao"><${H2} class="secao-tit">Aplicação</${H2}>${miolo}<div class="aviso">Confira sempre a aplicação no veículo antes da compra.</div></section>` : "";
    const secRefs = refs.length ? `<section class="secao"><${H2} class="secao-tit">Referências cruzadas</${H2}><table class="t"><tbody>${refs.map((x) => `<tr><th>${esc(x.m || "Referência")}</th><td class="c">${esc(x.c)}</td></tr>`).join("")}</tbody></table></section>` : "";
    const secFicha = ficha.length ? `<section class="secao"><${H2} class="secao-tit">Ficha técnica</${H2}><table class="t"><tbody>${ficha.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></section>` : "";
    const dados = secApl && (secRefs || secFicha)
      ? `<div class="prod-dados"><div class="col-apl">${secApl}</div><div class="col-tab">${secRefs}${secFicha}</div></div>`
      : `<div class="prod-dados um"><div class="col-apl">${secApl}</div><div class="col-tab">${secRefs}${secFicha}</div></div>`;
    return `<div class="so-impressao cab-pdf"><img src="assets/logo_escuro.png" alt="bap componentes de qualidade"><span>Ficha do produto · Catálogo BAP</span></div>
      <div class="prod">
        <div class="prod-foto-box"><div class="prod-foto">${fotoZoomHtml(p, true)}</div></div>
        <div class="prod-info">
          <div class="prod-cab">
            <${H} id="${naJanela ? "janela-tit" : "produto-tit"}">${esc(p.c)}</${H}>
            <div class="desc">${esc(p.d)}</div>
            <div class="selos">${[p.ca, p.li].filter(Boolean).map((s) => `<span class="selo">${esc(titulo(s))}</span>`).join("")}</div>
            <div class="acoes">
              <button class="bt bt-mini" type="button" data-copiar="${esc(p.c)}">Copiar código</button>
              <button class="bt bt-claro bt-mini bt-pdf" type="button">Salvar em PDF</button>
            </div>
          </div>
          ${secJunto(H2, junto)}
          ${dados}
        </div>
      </div>
      <div class="so-impressao rod-pdf">As fotos são ilustrativas.<span class="rodape-confira"> Confira sempre a aplicação antes da compra.</span><br>${esc(link)}${BASE.gerado_em ? " · base atualizada em " + esc(BASE.gerado_em) : ""}</div>`;
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

  // <dialog> com showModal(): o Esc passa pelo aoFechar (cancel) e o fechamento sem cancel também (close)
  function criarDialogo(id, classe, aoFechar, aoClose) {
    const dlg = document.createElement("dialog");
    dlg.id = id;
    dlg.className = classe;
    dlg.setAttribute("aria-modal", "true");
    document.body.appendChild(dlg);
    dlg.addEventListener("cancel", (ev) => { ev.preventDefault(); aoFechar(); }); // Esc
    dlg.addEventListener("close", aoClose); // fechou sem passar pelo cancel
    return dlg;
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
      dlg = criarDialogo("zoom-foto", "zoom", () => fecharZoom(true), () => { if (ZOOM) fecharZoom(true); });
      dlg.addEventListener("click", (ev) => { if (!ev.target.closest(".zoom-img, .zoom-leg, .zoom-x")) fecharZoom(true); }); // fora da foto
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
    document.title = tituloProduto(p);
    contarAbertura(p); // T-0018: conta a abertura do produto
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
      dlg = criarDialogo("janela-produto", "janela", () => fecharJanela(true), () => { if (JANELA) fecharJanela(true); });
      dlg.setAttribute("aria-labelledby", "janela-tit");
      dlg.addEventListener("click", (ev) => { if (ev.target === dlg) fecharJanela(true); }); // clique no fundo
    }
    if (!JANELA) JANELA = { dlg, pilha: [], cod: p.c };
    const pilha = JANELA.pilha;
    if (pilha.length > 1 && pilha[pilha.length - 2] === location.hash) pilha.pop(); // voltar do celular
    else if (pilha[pilha.length - 1] !== location.hash) { pilha.push(location.hash); contarAbertura(p); } // T-0018
    dlg.innerHTML = `<div class="janela-barra nao-imprime"><span>Produto</span><button class="janela-x" type="button" aria-label="Fechar a janela do produto">✕</button></div>
      <div class="janela-corpo produto-conteudo">${produtoHtml(p, true)}</div>`;
    dlg.querySelector(".janela-x").addEventListener("click", () => fecharJanela(true));
    ligarAcoes(dlg);
    document.title = tituloProduto(p);
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
    dlg.innerHTML = ""; // a janela fechada fica vazia: não sobra produto para o PDF
    document.documentElement.classList.remove("com-janela");
    document.title = TITULO;
    const quem = LINK_CARTAO && LINK_CARTAO.isConnected ? LINK_CARTAO : linkDoCartao(cod);
    LINK_CARTAO = null;
    if (quem) quem.focus({ preventScroll: true });
  }
  const linkDoCartao = (cod) => [...app.querySelectorAll(".lista .item")].find((e) => e.dataset.cod === cod)?.querySelector(".item-link") || null;

  // Sobre a BAP (T-0018, sobre1 do PO): o texto e os dados da empresa vêm do PDF da página "Empresa" do site
  // institucional (recados/anexos/T-0018/sobre/HISTORIA_BAP.pdf), palavra por palavra; os títulos dos 3 blocos são da
  // simulação. As fotos são de produtos BAP (assets/card2 a card4, em WebP, e a IMG_FAIXA do início), sem foto de banco.
  function telaSobre() {
    topoSobre(true);
    app.innerHTML = `<div class="sobre">
      <section class="sb-topo"><div class="sb-topo-in">
        <div class="sb-txt">
          <h1>Tradição e inovação em <em>componentes de qualidade</em></h1>
          <p>A BAP chega ao mercado de autopeças com dois desejos: seguir as tradições que ditam o sucesso do setor e inovar com seus produtos e serviços.</p>
        </div>
        <div class="sb-fotos" aria-hidden="true">
          <img class="sf1" src="${FOTO_SOBRE}" alt="" fetchpriority="high">
          <img class="sf2" src="assets/card2.webp" alt="">
          <img class="sf3" src="assets/card4.webp" alt="">
        </div>
      </div></section>
      <section class="sb-corpo">
        <div class="sb-hist">
          <div class="sb-bloco"><h2>Tradição e inovação</h2>
            <p>Acreditamos que as tradições existem, pois dão bons resultados. Elas definiram o caminho que trouxe o setor até aqui. Porém, tão importante quanto vislumbrar o passado é sonhar com o futuro.</p></div>
          <div class="sb-bloco"><h2>Qualidade com valor acessível</h2>
            <p>Somos uma marca jovem e pretendemos agir assim: trazendo novidades e acompanhando as tendências do mercado. O setor automotivo apresenta constantes evoluções e visamos atendê-las com peças de qualidade e valor acessível.</p></div>
          <div class="sb-bloco"><h2>Brasileira em sua essência</h2>
            <p>Brasileira em sua essência, a BAP traz toda a qualidade esperada de marcas internacionais sem penalizar o bolso de nossos consumidores. Além disso, toda essa proximidade com o mercado brasileiro nos permite acompanhá-lo de perto. O contato e treinamentos constantes são parte de nossas práticas.</p></div>
        </div>
        <blockquote class="sb-frase"><p>Temos um pé nas tradições e outro nas inovações.</p><span>Somos a BAP: <b>Componentes de qualidade.</b></span></blockquote>
        <div class="sb-cta">
          <img src="${IMG_FAIXA.src}" width="${IMG_FAIXA.w}" height="${IMG_FAIXA.h}" alt="" aria-hidden="true" loading="lazy">
          <h2>Quer conhecer nossas soluções?</h2>
          <a class="bt" href="#/busca">Ver o catálogo <span aria-hidden="true">›</span></a>
        </div>
        <dl class="sb-dados">
          <div><dt>Razão social</dt><dd>BRASIL AUTOPARTS S.A</dd></div>
          <div><dt>CNPJ</dt><dd>61.558.903/0001-87</dd></div>
          <div><dt>Atendimento</dt><dd>Seg - Sex das 8h às 18hs</dd></div>
          <div><dt>E-mail</dt><dd><a href="mailto:sac@bapautoparts.com.br">sac@bapautoparts.com.br</a></dd></div>
        </dl>
      </section>
    </div>`;
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
    document.title = TITULO;
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
    // o botão verde do rodapé (op4e) volta ao topo; o foco vai para o conteúdo
    if (ev.target.closest(".rodape-topo")) {
      window.scrollTo({ top: 0 }); // suave ou direto pelo scroll-behavior do CSS (reduce)
      app.focus({ preventScroll: true });
    }
  });
  // a tela só é montada depois do produtos.json (~440 KB com gzip): a foto do topo do início e da Sobre começa a
  // baixar já, junto com ele, e não depois dele
  const fotoTopo = { "/": IMG_FAIXA.src, "/sobre": FOTO_SOBRE }[lerRota().caminho];
  if (fotoTopo) Object.assign(new Image(), { fetchPriority: "high", src: fotoTopo }); // o <img> da tela reaproveita a mesma
  carregar().then(render).catch((e) => {
    app.innerHTML = `<div class="carregando">Não foi possível carregar o catálogo (${esc(e.message)}). Atualize a página.</div>`;
  });
})();
