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
  const tituloProduto = (p) => p.c + " · " + anoMaisTxt(p.d) + " · " + TITULO.split(" · ")[0]; // "<código> · <descrição> · Catálogo online BAP"
  let BASE = null;           // { gerado_em, total, sc, produtos } (sc: sistemas compatíveis do "Leve também", T-0018)
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
  const esc = window.BAP.esc; // /entrar/comum.js (T-0022), que vem antes no index.html
  const bonito = window.BAP.bonito; // a exibição sem caixa alta: fica no /entrar/comum.js, que o Estoque também usa (T-0035)
  // Ano sem fim na tela, na aplicação e na descrição (T-0018, R-20261120-195900 e R-20261120-201100-alexandre):
  // "2015>", "2015 →", "2015->", "2015 em Diante" e "2015–" sem o ano final aparecem como "2015+"; o leitor de tela
  // ouve "2015 em diante" (o "+" fica escondido dele e o EM_DIANTE vai na .vh). A faixa com fim não muda. Só o
  // desenho: o JSON, a busca e a leitura dos anos continuam com o texto da base.
  // O ano da aplicação ("2011", "01/1979", "01/01/2012"); a leitura dos pedaços só de ano (FAIXA_APL) também usa.
  const ANO_APL = String.raw`(?:\d{2}\/){0,2}(?:19|20)\d{2}`;
  // Os marcadores são os do "em diante" do FAIXA_APL, mais o ">>", o "->" e o "–" sem o ano final; sem o "até" (o
  // "2014 até" sem fim não é ano aberto, PR #54). Depois do marcador, só o ano que fecha a faixa (4 dígitos, com o
  // mês ou não, ou 2 dígitos) ou o número colado no marcador fazem dele uma faixa com fim: "2012>20", "1998>2009",
  // "2012 > 2016", "2007–06/2009", "2012–2016", "2012–16", "1999->2008" e os colados "2015–20162017", "2008–20202024"
  // e "09/1993>1201". Com espaço e outro número ("2015> 3CIL", "2001> 206 1.4"), é ano aberto.
  const RX_ANO_ABERTO = new RegExp(String.raw`(?<![\d\/])(${ANO_APL})(?:\s*-?>+(?!>)|\s*→|\s+em\s+diante\b|–)(?!\d|\s*(?:${ANO_APL}|\d{2}(?!\d)))`, "gi");
  const EM_DIANTE = " em diante";
  const ANO_MAIS = `<span aria-hidden="true">+</span><span class="vh">${EM_DIANTE}</span>`;
  // o ano colado ao nome seguinte ("2001>GM: Equipa", "2014>Seat") ganha um espaço depois do "+": "2001+ GM: Equipa"
  const espacoDepois = (t, i) => (/[\p{L}(]/u.test(t.charAt(i)) ? " " : "");
  const anoMaisHtml = (s) => { const t = String(s == null ? "" : s); let h = "", k = 0;
    for (const m of t.matchAll(RX_ANO_ABERTO)) { h += esc(t.slice(k, m.index)) + esc(m[1]) + ANO_MAIS; k = m.index + m[0].length; h += espacoDepois(t, k); }
    return h + esc(t.slice(k)); };
  const anoMaisTxt = (s, fim = "+") => String(s == null ? "" : s) // o title e o título da aba ("+"); o alt (EM_DIANTE)
    .replace(RX_ANO_ABERTO, (x, ano, i, t) => ano + fim + espacoDepois(t, i + x.length));
  const MINUSC = new Set(["e", "de", "da", "do", "das", "dos", "com", "sem", "para", "p/", "c/", "s/"]);
  const titulo = (s) => bonito(s);
  const fmt = (n) => Number(n).toLocaleString("pt-BR");
  const toast = (msg) => window.BAPConta.toast(msg); // o aviso do site todo (conta.js, T-0022)

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
    // T-0022: com o serviço de login, a sessão vencida responde 401 e leva ao login (conta.js); sem ele, nada muda
    if (r.status === 401) { window.BAP.expirou(); throw new Error("a sessão terminou"); }
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
    // - Pedaços separados por / ; , | = ( ) e "OU"; o rótulo antes de ":" sai ("Cofap: KJH04202" → KJH04202).
    // - O pedaço inteiro vira um código só se tem número e cada palavra tem número ou é sigla de até 4 letras que
    //   não é veículo ("NJH07 5123" → NJH075123, "BTC 39115", "6309 2RS C3"; "Corsa 1.0" não vira CORSA10).
    // - Senão (pedaço com texto), só a palavra com número e pelo menos 5 caracteres ("Cofap GP33190" → GP33190;
    //   16V e 4X4 não são código).
    const partes = (x) => {
      const out = [];
      for (let pd of String(x.c || "").split(/[\/;,|=()\n]| OU /i)) {
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
        faixas: faixasNoTexto(textoDeAno(p.a || "", true), true),            // anos da aplicação (a leitura de antes: textoDeAno)
      };
      // montadora com o outro nome ("vw gol" acha o Gol da VOLKSWAGEN, como a antiga aba Veículo): vale a montadora
      // do campo mo e também a escrita como palavra na aplicação ou na descrição ("VOLKSWAGEN GOL 1.6")
      const apelidos = Object.keys(APELIDOS).filter((m) => norm(p.mo).split(/\s*[\/,]\s*/).includes(m)
        || RX_MONTADORA[m].test(e.apl) || RX_MONTADORA[m].test(e.desc)).map((m) => APELIDOS[m]);
      if (apelidos.length) e.outros += " | " + apelidos.join(" ");
      // T-0006: medida da bateria (filtros Amperagem e CCA); a amperagem entra no texto da busca como "60AH" (casador)
      const med = medidaDe(p);
      if (med) { MEDIDA.set(p, med); if (med.ah) e.outros += " | " + med.ah + "AH"; }
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
  //   "(01-88/06-92)" (mês-ano/mês-ano)                                                                    → faixa
  //   "2018>", "2005 EM DIANTE", "2025 →", "2000 +", "2012/...", "1998 / ...", "2018 ATE" (sem fim)        → de ano em diante
  //   "../08", ".../1977" (sem começo)                                                                     → até o ano
  //   "2007", "08/2022"                                                                                    → só o ano
  //   "07/17" sozinho (sem outra data do lado): mês/ano ou ano/ano, as duas leituras (2007 a 2017)          → faixa
  //   não é ano: 13/16" (polegada), 2500 e 1938 (motor ou modelo)
  // Ano com 2 dígitos: até 35 = 20xx; depois = 19xx. Ano de 4 dígitos só entre 1950 e o ano atual + 2 (fora disso
  // é número de motor ou de modelo, como 2500, 1938 ou o Axor 2035).
  const ANO_ATUAL = new Date().getFullYear();
  const ANO_MIN = 1950, ANO_MAX = ANO_ATUAL + 2, SEM_FIM = 2100, SEM_INICIO = 1900; // "Axor 2035" não é ano
  const RX_MES_ANO_HIFEN = /(?<![\d.,\/-])(0?[1-9]|1[0-2])-((?:19|20)\d{2})(?!\d)/g; // "01-2020" é 01/2020
  const ano2 = (s) => { const n = +s; return n <= 35 ? 2000 + n : 1900 + n; };
  const anoOk = (n) => n >= ANO_MIN && n <= ANO_MAX;
  // o texto como a leitura do ano o vê: sem acento, em maiúsculas, com o ano colado depois de vírgula ("Hdi
  // 150,2007–2013"), a faixa com ponto ("2015.2019"), o mês-ano com hífen ("01-2020") ou ponto ("08.1998") e o "após
  // 2017", "a partir de 2017" e "desde 2017", que é 2017 em diante [SUPOSIÇÃO] (T-0033)
  // "antiga": a leitura de antes da T-0033, só para a busca de texto sem modelo ("2026", "filtro 2010"), que fica como
  // era (e.faixas no carregar e casaAno)
  const textoDeAno = (texto, antiga) => {
    const t = norm(texto).replace(/(\d{2}\/(?:19|20)\d{2})(?=\d{2}\/(?:19|20)\d{2})/g, "$1 ");
    return antiga ? t : t
      .replace(/(\d),(?=(?:19|20)\d{2}(?!\d))/g, "$1, ").replace(/(?<![\d.])((?:19|20)\d{2})\.((?:19|20)\d{2})(?![\d.])/g, "$1-$2")
      .replace(RX_MES_ANO_HIFEN, "$1/$2").replace(/(?<![\d.,])(0[1-9]|1[0-2])\.((?:19|20)\d{2})\/(?![\d.])/g, "$1/$2>") // "08.1998/": 1998 em diante
      .replace(/(?<![\d.,])(0[1-9]|1[0-2])\.((?:19|20)\d{2})(?![\d.])/g, "$1/$2")
      .replace(/\b(?:APOS|A PARTIR DE|DESDE)\s+((?:\d{2}\/)?(?:19|20)\d{2})(?!\d)/g, "$1>");
  };
  const faixasDoTexto = (texto) => faixasNoTexto(textoDeAno(texto));
  // as faixas do texto já preparado (textoDeAno), cada uma com a posição (.i) da 1ª data no texto
  function faixasNoTexto(s, antiga) {
    const datas = []; // { i, f, de, ate }
    const re = /(?<!\d|\d[.,])(?:(\d{1,2})\/)?((?:19|20)\d{2})(?!\d|[.,]\d)|(?<!\d|\d[.,\/])(\d{2})\/(\d{2})(?!\d|[.,\/]\d|\s*(?:"|''|POL))|(?<![\d.,\/-])(\d{2})-(\d{2})(?![\d.,\/-])|(?:\.{2,}|…)\s*\/\s*(\d{2})(?!\d)|(?<![\d.,\/-])(\d{2})-(\d{2})\/(\d{2})-(\d{2})(?![\d.,\/-])/g;
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
      else if (m[8]) { // mês-ano/mês-ano: "(01-88/06-92)" = 01/1988 a 06/1992 (revisão do testes no PR #54)
        const a = ano2(m[9]), b = ano2(m[11]);
        if (+m[8] >= 1 && +m[8] <= 12 && +m[10] >= 1 && +m[10] <= 12 && a <= b) datas.push({ i, f, de: a, ate: b, faixa: true });
      }
    }
    const faixas = [];
    const SEP = /^[\s·]*(?:-|–|—|A|AO|ATE|\/|>|→)?[\s·]*$/;
    const ABERTO = antiga ? /^\s*(?:>|\+|→|EM DIANTE|\/\s*(?:\.{2,}|…)|…|\.{3}|ATE(?![\s·]*\d))/
      : /^\s*(?:>|\+|→|EM DIANTE|\/\s*\.(?![\d.])|\/\s*(?:\.{2,}|…)|…|\.{2,}|ATE(?![\s·]*\d))/; // "2012/.", "1996 / .", "2019..", "2007>"; "2011 / Punto" não
    const SEM_COMECO = /(?:\.{2,}|…)\s*\/?\s*$/;
    for (let k = 0; k < datas.length; k++) {
      const d = datas[k], prox = datas[k + 1];
      const poe = (de, ate) => { const x = [de, ate]; x.i = d.i; faixas.push(x); };
      if (!d.faixa && prox && !prox.faixa) {
        const meio = s.slice(d.f, prox.i);
        // dois anos seguidos só com espaço também são faixa ("2018 2021"), mas com "·" no meio, só com separador
        if (SEP.test(meio) && (!meio.includes("·") || /[-–—\/>→]|A|ATE/.test(meio)) && d.de <= prox.ate) {
          poe(d.de, prox.ate); k++; continue;
        }
      }
      if (!d.faixa && ABERTO.test(s.slice(d.f))) poe(d.de, SEM_FIM);
      else if (!antiga && !d.faixa && /\bATE\s*$/.test(s.slice(Math.max(0, d.i - 8), d.i))) poe(SEM_INICIO, d.ate); // "até 2008", "(até 1989)"
      else if (!d.faixa && SEM_COMECO.test(s.slice(Math.max(0, d.i - 5), d.i))) poe(SEM_INICIO, d.ate);
      else poe(d.dupla || d.de, d.ate);
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
  // A forma compacta do modelo (sem espaço e hífen) e o corpo da regex que acha o nome no texto com espaço ou hífen
  // opcional entre as letras ("C 3" é C3, "H-100" é H100, "F4000" é F-4000)
  const compacto = (m) => norm(m).replace(/[\s-]/g, "");
  const corpoModelo = (m) => [...compacto(m)].map(reEsc).join("[\\s-]?");
  // Índice dos "ve" do catálogo inteiro, montado uma vez: as marcas, os modelos de cada marca (do mais longo ao mais
  // curto: "Palio Weekend" antes de "Palio"), o modelo compacto → [[marca, modelo]] (sem os só de número: "2008" e
  // "147" viram ano ou código na busca digitada) e todos esses modelos (sem acento e em maiúsculas)
  let INDICE_VE = null;
  function indiceVe() {
    if (INDICE_VE) return INDICE_VE;
    const marcas = new Set(), porMarca = new Map(), porCompacto = new Map();
    for (const p of BASE.produtos) for (const [f, m] of p.ve || []) {
      const vm = norm(f), c = compacto(m);
      marcas.add(vm);
      if (c.length < 2) continue;
      if (!porMarca.has(vm)) porMarca.set(vm, new Set());
      porMarca.get(vm).add(m);
      if (/^\d+$/.test(c)) continue;
      if (!porCompacto.has(c)) porCompacto.set(c, new Map());
      porCompacto.get(c).set(vm + "|" + norm(m), [vm, norm(m)]);
    }
    const pc = new Map([...porCompacto].map(([c, mm]) => [c, [...mm.values()]]));
    const numericos = new Set([...porMarca.values()].flatMap((ms) => [...ms]).map(compacto).filter((c) => /^\d+$/.test(c)));
    INDICE_VE = { marcas, numericos, porMarca: new Map([...porMarca].map(([vm, ms]) => [vm, [...ms].sort((a, b) => b.length - a.length)])), porCompacto: pc,
      todos: [...new Set([...pc.values()].flat().map(([, mo]) => mo))] };
    return INDICE_VE;
  }
  // T-0033 3b (R-20261125-095112-po): na busca digitada com um modelo de algum "ve" e um ano (4 dígitos de 1950 ao
  // ano atual + 1), vale a regra do ano da busca por veículo. O modelo é a palavra (ou as até 3 palavras vizinhas
  // juntas: "palio weekend") igual a um modelo do índice; em mais de uma montadora ("ka"), vale qualquer uma
  // [SUPOSIÇÃO]. Sem modelo ou sem ano, a busca fica como antes.
  function modelosDigitados(ps) {
    const { porCompacto } = indiceVe(), ws = ps.map((w) => w.replace(/-/g, "")), out = [];
    for (let i = 0; i < ws.length; i++) for (let n = Math.min(3, ws.length - i); n >= 1; n--) {
      const c = ws.slice(i, i + n).join("");
      if (porCompacto.has(c)) { out.push(...porCompacto.get(c)); i += n - 1; break; }
    }
    return out;
  }
  const ANO_DIGITADO_MAX = ANO_ATUAL + 1;
  function veiculoDigitado(ps) {
    const anos = ps.filter((w) => /^\d{4}$/.test(w) && +w >= ANO_MIN && +w <= ANO_DIGITADO_MAX).map(Number);
    const mods = anos.length ? modelosDigitados(ps.filter((w) => !anos.includes(+w))) : [];
    return mods.length ? { mods, ano: anos[0] } : null;
  }
  // sem "ve": o ano do trecho do modelo (anosPorModelo, com todos os modelos do índice como fronteira)
  const ANOS_SEM_VE = new Map();
  function anosSemVe(p) {
    if (!ANOS_SEM_VE.has(p)) ANOS_SEM_VE.set(p, anosPorModelo(p.a, indiceVe().todos));
    return ANOS_SEM_VE.get(p);
  }
  // o produto serve no modelo e ano digitados: com "ve", a regra da busca por veículo, só no modelo que está no "ve"
  // dele; sem "ve", o ano do trecho do modelo na aplicação. Com o "an" da base, ele vale primeiro (só o modelo
  // escrito na aplicação e o ano no "an").
  const serveNoDigitado = (e, vd) => (veDe(e) ? vd.mods.some(([vm, vmo]) => veDe(e).some((x) => x[0] === vm && x[1] === vmo) && serveNoAno(e, { vm, vmo, va: vd.ano }))
    : anoDaBase(e.p) ? vd.mods.some(([, vmo]) => rxModeloTxt(vmo).test(textoDeAno(e.p.a))) && casaAno(e, vd.ano) === 1
      : vd.mods.some(([, vmo]) => (anosSemVe(e.p).get(vmo) || []).some(([de, ate]) => vd.ano >= de && vd.ano <= ate)));
  // nota da peça no produto, ou 0; "parcial" = só casou como pedaço de código
  function casaPeca(e, k, livreAno, anoDigitado) {
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
    else if (k.ano && anoDigitado != null && k.ano === anoDigitado.ano) txt = anoDigitado.ok ? 40 : 0; // T-0033 3b
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
    // amperagem (T-0006): "60 ah", "60-Ah" e "60ah" viram uma palavra só, "60AH", que casa com a das baterias
    let ps = norm(texto).replace(/(\d)\s*-?\s*AH\b/g, "$1AH").replace(/([A-Z])-+(?=[A-Z])/g, "$1 ").split(/[\s,;]+/).filter((w) => w.replace(/-/g, ""));
    if (ps.some((w) => !CONECTIVOS.has(w))) ps = ps.filter((w) => !CONECTIVOS.has(w));
    // cada palavra digitada é uma palavra (B1: nada é juntado antes; as peças de palavras vizinhas, abaixo, já
    // cobrem "33 000" e "TRW 16900255S", e a ordem das palavras não muda a lista)
    const toks = ps.map((t) => ({ t, w: 1 }));
    const vd = veiculoDigitado(ps); // T-0033 3b: modelo e ano digitados
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
      const anoDigitado = vd ? { ano: vd.ano, ok: serveNoDigitado(e, vd) } : null;
      for (let x = 0; x < agulhas.length; x++) {
        tem[x] = agulhas[x] && e.tudo.includes(agulhas[x]) ? 1 : 0;
        if (tem[x]) algum = true;
        if (tem[x] && !anoAg[x] && e.apl.includes(agulhas[x])) aplOutra = true;
      }
      for (let i = 0; i < n; i++) for (let x = 0; x < pecas[i].length; x++) {
        const q = pecas[i][x];
        let r = null;
        if (!(q.curta && !soltaVale) && (tem[q.ag] || q.livre || (q.k.pc.length >= 2 && e.codsTxt.includes(q.k.pc)))) r = casaPeca(e, q.k, aplOutra, anoDigitado);
        res[i][x] = r;
        if (r) algum = true;
      }
      if (!algum) return { n: 0, nota: 0, bits: 0, exato: false };
      // alguma palavra (ou palavras juntas) é o código BAP, o EAN ou uma referência, inteiro. Ano (2018) só conta
      // quando é a única palavra: em "gol 2018", a referência AXIOS 2018 não passa na frente.
      let exato = false;
      for (let i = 0; i < n; i++) for (let x = 0; x < pecas[i].length; x++) if (res[i][x] && res[i][x].nota >= 800 && (n === 1 || !pecas[i][x].k.ano)) exato = true;
      // T-0033 3b: com modelo e ano digitados, o produto sem o ano batendo nesse modelo não entra (o código exato, sim)
      if (anoDigitado && !anoDigitado.ok && !exato) return { n: 0, nota: 0, bits: 0, exato: false };
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
    return { palavras, total, testar, vd };
  }

  // A busca da tela: as palavras (casador) e os filtros (linha, categoria, sistema, família e as medidas, que tiram da lista).
  // Se algum produto casa com todas as palavras, só eles; se nenhum, os que casam com mais palavras (os mais
  // próximos). O produto com o código exato (BAP, EAN ou referência) entra sempre e vem em 1º.
  function buscar(pr) {
    const cs = pr.get("q") ? casador(pr.get("q")) : null;
    const total = cs ? cs.total : 0;
    const sel = (k) => { const v = pr.getAll(k).filter(Boolean); return v.length ? new Set(v) : null; };
    const filtros = Object.keys(FILTROS).map((k) => [k, sel(k)]).filter(([, s]) => s);
    // veículo (faixa abaixo da busca): só o que serve na marca, modelo, ano, motor e versão escolhidos
    const vei = pr.get("vm") ? veiculoDaRota(pr) : null;
    let out = [], maxN = 0;
    for (const e of INDICE) {
      const p = e.p;
      if (filtros.some(([k, s]) => !s.has(valorFiltro(p, k)))) continue;
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
    lista.vei = vei; // o veículo da lista: a tag "Compatível" dos cartões (itemHtml)
    if (total && maxN < total && out.length) {
      // palavras que nenhum produto da lista casou (para o aviso na tela)
      let alguma = 0;
      for (const r of out) alguma |= r[3];
      cs.palavras.forEach((t, i) => { if (!(alguma & (1 << Math.min(i, 30)))) lista.faltam.push(t); });
      lista.semTipo = cs.vd && semTipoNoVeiculo(lista.faltam, cs.vd);
    }
    return lista;
  }

  // T-0033 (opção a do Alexandre): modelo e ano digitados com um tipo de peça (as palavras que não casaram) e nenhuma
  // peça desse tipo serve no modelo e ano: o nome do tipo, como está no PRODUTO (p) ou na FAMILIA (fa) do produto, para
  // o aviso acima da lista. Sem produto desse tipo, ou com um que sirva, null.
  function semTipoNoVeiculo(faltam, vd) {
    if (!faltam.length) return null;
    const nomes = new Map(), doTipo = (x) => x && faltam.every((w) => temPalavra(norm(x), w));
    for (const e of INDICE) {
      const nome = doTipo(e.p.p) ? e.p.p : doTipo(e.p.fa) ? e.p.fa : "";
      if (!nome) continue;
      if (serveNoDigitado(e, vd)) return null;
      nomes.set(nome, (nomes.get(nome) || 0) + 1);
    }
    const nome = [...nomes].sort((a, b) => b[1] - a[1])[0];
    return nome ? { tipo: nome[0], modelo: bonito(vd.mods[0][1]), ano: vd.ano } : null;
  }
  // "Nenhuma bomba de combustível", "Nenhum filtro de óleo": o feminino pela 1ª palavra [SUPOSIÇÃO]
  const nenhum = (tipo) => (/^\S*(?:a|agem|ção|dade)(?=\s|$)/i.test(tipo) ? "Nenhuma " : "Nenhum ") + tipo.toLowerCase();

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
    for (const p of lista) { const v = valorFiltro(p, campo); if (v) c.set(v, (c.get(v) || 0) + 1); }
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }

  // ---------- pedaços de tela ----------
  const nProd = (n) => fmt(n) + " produto" + (n === 1 ? "" : "s"); // "3 produtos": o total e o "Ver 3 produtos"
  const SEM_FOTO = '<img src="assets/logo_escuro.png" alt="">Foto em breve'; // o miolo do "Foto em breve"
  // a foto grande (produto) carrega logo e na frente (fetchpriority); no cartão, lazy, menos os da 1ª linha (logo)
  function fotoHtml(p, grande, logo) {
    if (p.i) return `<img src="img/${encodeURIComponent(p.i)}" alt="${esc(p.c + " · " + anoMaisTxt(p.d, EM_DIANTE))}" loading="${grande || logo ? "eager" : "lazy"}"${grande ? ' fetchpriority="high"' : ""} onerror="(this.closest('.foto-zoom')||this).replaceWith(Object.assign(document.createElement('div'),{className:'sem-foto',innerHTML:${esc(JSON.stringify(SEM_FOTO)).replace(/"/g, "&quot;")}}))">`;
    return `<div class="sem-foto">${SEM_FOTO}</div>`;
  }
  // a foto com o botão de ampliar (no cartão e no produto); sem foto, só o "Foto em breve"
  const fotoZoomHtml = (p, grande, logo) => p.i ? `<button class="foto-zoom" type="button" aria-haspopup="dialog" aria-label="Ampliar a foto do ${esc(p.c)}">${fotoHtml(p, grande, logo)}</button>` : fotoHtml(p, grande);
  // Cartão do resultado (T-0014, R-20261120-112520). O código vai sobre a foto, no canto inferior direito
  // (R-20261120-122300; é só texto, sem clique próprio: o toque nele cai na foto; para leitor de tela, o código está no
  // alt da foto e no link do cartão). A foto só amplia (botão; sem foto, nada; R-20261122-013541-alexandre); só o nome
  // e o "+ Detalhes" abrem a janela do produto. Sem botão dentro de link.
  const CARTOES_LOGO = 4; // a 1ª linha no computador (4 cartões) e as 2 primeiras no celular: foto sem lazy
  // Tag "Compatível" (T-0018, R-20261120-191700-alexandre): só no cartão da busca, com veículo (placa ou listas); nunca
  // na janela, na página nem no "Leve também". O visual e o porquê do SVG: styles.css (.tag-compat)
  const TAG_COMPAT = '<span class="tag-compat"><svg aria-hidden="true" focusable="false" viewBox="0 0 12 12"><path d="M2.4 6.4 4.9 8.9 9.6 3.4"/></svg><span class="vh">Compatível</span></span>';
  function itemHtml(p, n, vei) {
    const href = "#/produto/" + encodeURIComponent(p.c);
    const compat = !!vei; // a lista (buscar) só tem o que serve no veículo
    return `<article class="item" data-cod="${esc(p.c)}">
      <div class="foto${compat ? " com-tag" : ""}">${fotoZoomHtml(p, false, n < CARTOES_LOGO)}${compat ? TAG_COMPAT : ""}
        <span class="foto-cod" aria-hidden="true">${esc(p.c)}</span></div>
      <div class="corpo">
        <a class="item-link" href="${href}"><span class="cod vh">${esc(p.c)}</span><span class="vh"> · </span>
        <span class="desc" title="${esc(anoMaisTxt(p.d))}">${anoMaisHtml(p.d)}</span></a>
        <span class="apl"${p.a ? ` title="${esc(anoMaisTxt(p.a))}"` : ""}>${anoMaisHtml(p.a)}</span>
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
      // o corpo (vazio, 204) é lido: sem isso, o Chrome 153 marca o pedido como cancelado
      fetch(SERVICO + "/contar", { method: "POST", body: JSON.stringify({ codigo: p.c }), keepalive: true, ...SEM_RASTRO })
        .then((r) => r.text()).catch(() => {});
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
      <span class="rec-txt"><b>${esc(p.c)}</b><span>${anoMaisHtml(titulo(p.d))}</span></span>
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
      ${todos.semTipo ? `<p class="aviso proximos" role="status"><b>${esc(nenhum(todos.semTipo.tipo))} para ${esc(todos.semTipo.modelo)} ${todos.semTipo.ano}.</b> Veja outras peças do ${esc(todos.semTipo.modelo)}.</p>`
        : todos.length && todos.casaram < todos.palavras ? `<p class="aviso proximos" role="status"><b>Nenhum produto tem todas as palavras.</b> Estes são os mais próximos: casam com ${fmt(todos.casaram)} de ${fmt(todos.palavras)} palavras${todos.faltam.length ? `. Não casou: ${todos.faltam.map((t) => `“${esc(t.toLowerCase())}”`).join(", ")}` : ""}.</p>` : ""}
      <div class="lista"></div><div class="mais"></div></div>`;
    montarBusca(document.getElementById("busca-topo"), pr);
    montarFiltros(pr, todos);
    montarLayout(pr, todos);
    const lista = app.querySelector(".lista");
    const mais = app.querySelector(".mais");
    // insere os próximos cartões e ajusta as etiquetas só deles (a volta à lista insere todos de uma vez)
    function pagina(qtd = POR_PAGINA) {
      const ini = lista.children.length;
      lista.insertAdjacentHTML("beforeend", todos.slice(mostrando, mostrando + qtd).map((p, i) => itemHtml(p, ini + i, todos.vei)).join(""));
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
  // Sistema, Família, Amperagem e Partida a frio (CCA), no computador e no celular (R-20261120-145600-alexandre); o
  // botão do grupo só recolhe. Ficam na coluna à esquerda dos cartões (no celular, no painel "Filtrar"). A lógica: li=,
  // ca=, si=, fa=, ah= e cca= no endereço
  // (repetidos quando há mais de um). As opções de cada grupo e a ordem delas vêm da busca sem nenhum filtro marcado
  // (não somem ao marcar outro); a contagem, da busca com os outros filtros. Com 0, a opção fica cinza e desabilitada
  // (a marcada, nunca). Abaixo, as etiquetas do termo (q) e de cada filtro marcado, com o X, e o "Limpar tudo". A
  // placa e o veículo ficam no quadro da busca (montarBusca).
  // T-0006, fase 1: Amperagem e Partida a frio (CCA) só quando a lista tem bateria com a medida, tirada da ficha técnica
  // (x): "C20(ah)" e "Cca-18°" (docs/DADOS_DO_SITE.md).
  const FAIXAS_CCA = [[400, "ate-400", "até 400"], [500, "401-500", "401 a 500"], [600, "501-600", "501 a 600"],
    [800, "601-800", "601 a 800"], [Infinity, "acima-800", "acima de 800"]];
  const NOME_CCA = new Map(FAIXAS_CCA.map(([, v, nome]) => [v, nome]));
  const ORDEM_CCA = new Map(FAIXAS_CCA.map(([, v], i) => [v, i]));
  const MEDIDA = new Map(); // produto → { ah: "60", cca: "401-500" } (só os que têm a medida; carregar)
  function medidaDe(p) {
    const x = new Map((p.x || []).map(([k, v]) => [normCod(k), String(v).trim()]));
    const m = {};
    if (/^\d+$/.test(x.get("C20AH") || "")) m.ah = String(+x.get("C20AH"));
    if (/^\d+$/.test(x.get("CCA18") || "")) { const n = +x.get("CCA18"); m.cca = FAIXAS_CCA.find(([lim]) => n <= lim)[1]; }
    return m.ah || m.cca ? m : null;
  }
  // Rótulo da ficha igual ao do filtro (T-0030, MC-0016); a chave vem da FICHA do gerar_site.py, que não muda.
  const ROTULO_FICHA = new Map([["C20AH", "Ah"], ["CCA18", "CCA"]]);
  // rot: nome do grupo; nome: a opção e a etiqueta; ordem: a das opções (sem ela, a de mais produtos primeiro)
  const FILTROS = {
    li: { rot: "Linha" }, ca: { rot: "Categoria" }, si: { rot: "Sistema" }, fa: { rot: "Família" },
    ah: { rot: "Amperagem", medida: true, nome: (v) => v + " Ah", ordem: (a, b) => a - b },
    cca: { rot: "Partida a frio (CCA)", medida: true, nome: (v) => NOME_CCA.get(v) || v, ordem: (a, b) => ORDEM_CCA.get(a) - ORDEM_CCA.get(b) },
  };
  const valorFiltro = (p, k) => (FILTROS[k] && FILTROS[k].medida ? (MEDIDA.get(p) || {})[k] : p[k]);
  const nomeFiltro = (k, v) => (FILTROS[k].nome ? FILTROS[k].nome(v) : titulo(v));
  let FILTRO_FOCO = null; // { k, v, y }: o que reabrir e focar depois de refazer a lista
  function montarFiltros(pr, todos) {
    const barra = app.querySelector(".barra-filtros");
    const semFiltros = new URLSearchParams(pr); Object.keys(FILTROS).forEach((k) => semFiltros.delete(k));
    const universo = semFiltros.toString() === pr.toString() ? todos : buscar(semFiltros);
    barra.innerHTML = Object.keys(FILTROS).map((k) => {
      const marcados = pr.getAll(k).filter(Boolean);
      const semEste = new URLSearchParams(pr); semEste.delete(k);
      const base = marcados.length ? buscar(semEste) : todos;
      const qtd = new Map(contar(base, k));
      const vals = contar(universo, k).map(([v]) => v);
      if (FILTROS[k].ordem) vals.sort(FILTROS[k].ordem);
      const op = vals.slice(0, 40).map((v) => [v, qtd.get(v) || 0]);
      for (const v of marcados) if (!op.some(([x]) => x === v)) op.push([v, qtd.get(v) || 0]);
      if (!op.length) return ""; // a coluna aparece sempre, mesmo com uma opção só (R-20261120-130300)
      return `<div class="filtro" data-k="${k}">
        <button class="filtro-bt" type="button" aria-expanded="true" aria-controls="filtro-${k}"><span>${FILTROS[k].rot}${marcados.length ? ` <b>(${marcados.length})</b>` : ""}</span><span class="seta" aria-hidden="true">▾</span></button>
        <div class="filtro-lista" id="filtro-${k}" role="group" aria-label="${FILTROS[k].rot}">${op.map(([v, n]) => {
          const marc = marcados.includes(v), off = !n && !marc;
          return `<label${off ? ' class="off"' : ""}><input type="checkbox" value="${esc(v)}"${marc ? " checked" : ""}${off ? ' disabled aria-disabled="true"' : ""}><span>${esc(nomeFiltro(k, v))}</span><em>${fmt(n)}</em></label>`;
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
    for (const k of Object.keys(FILTROS)) for (const v of pr.getAll(k).filter(Boolean))
      itens.push({ nome: FILTROS[k].rot + ": " + nomeFiltro(k, v), tirar: (n) => { const r = n.getAll(k).filter((x) => x !== v); n.delete(k); r.forEach((x) => n.append(k, x)); } });
    if (!itens.length) return;
    etq.hidden = false;
    etq.innerHTML = itens.map((it, i) => `<span class="etq"><span>${esc(it.nome)}</span><button type="button" data-i="${i}" aria-label="${esc("Tirar " + (it.leitor || it.nome))}">✕</button></span>`).join("")
      + (itens.length >= 2 ? `<button class="limpar-tudo" type="button">Limpar tudo</button>` : "");
    etq.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      const n = new URLSearchParams(pr);
      if (b.classList.contains("limpar-tudo")) { n.delete("q"); Object.keys(FILTROS).forEach((k) => n.delete(k)); } // o veículo sai pelo X dele, no quadro
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
  const ANO_HOJE = ANO_ATUAL;
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
  const marcaTela = (vm) => bonito(NOME_MARCA.get(norm(vm)) || vm); // a marca como aparece ("Mercedes-Benz", "Citroën")
  // Campo "ve" da T-0017 ([fabricante, modelo, versão?]): a cascata usa ele; sem nenhum "ve" no JSON (antigo), cai na
  // montagem pela aplicação. O ano continua vindo do an e da aplicação.
  // Com o campo "ve" no JSON (detectado uma vez em carregar(): TEM_VE), produto SEM "ve" fica fora do filtro e das
  // contagens (os duvidosos e os sem veículo; R-20261120-123130). A montagem pela aplicação só vale no JSON antigo.
  const veDe = (e) => (Array.isArray(e.p.ve) && e.p.ve.length ? e.p.ve.map((x) => [norm(x[0]), norm(x[1]), norm(x[2] || "")]) : null);
  const marcasDe = (e) => { const ve = veDe(e); return ve ? [...new Set(ve.map((x) => x[0]))] : norm(e.p.mo).split(/\s*[\/,]\s*/).filter(Boolean); };
  const motoresDe = (e) => [...new Set((e.apl.match(/\b\d[.,]\d\b/g) || []).map((m) => m.replace(",", ".")))];
  const anoServe = (e, ano) => casaAno(e, ano) !== 0; // o ano da base (an) primeiro, depois a aplicação (T-0011); sem ano: serve
  // T-0033 (R-20261124-152047-po: "se nao tiver o ano batendo com a aplicação, então nao retorne na pesquisa"): com o
  // ano escolhido, o produto com "ve" só entra se uma linha da tabela da aplicação (tabelaDe) da marca e do modelo
  // escolhidos tiver o ano na coluna Ano ("1996–2005" contém o ano; "1996+" vale de 1996 em diante). A linha sem ano
  // não entra. Sem "ve" (JSON antigo e o item do "Leve também" comparado pela aplicação), como antes (anoServe).
  const faixaDaCelula = (f) => { const m = /^(?:até (\d{4})|(\d{4})(–?)(\d{4})?)$/.exec(f); return !m ? null : m[1] ? [SEM_INICIO, +m[1]] : [+m[2], m[4] ? +m[4] : m[3] ? SEM_FIM : +m[2]]; };
  // o ano da base (ANO_INICIO e ANO_FIM, campo "an") vale primeiro: "2006–", "até 2010", "1996–2003" ou ""
  const anoDaBase = (p) => (p.an && (p.an[0] || p.an[1]) ? fmtFaixa([p.an[0] || SEM_INICIO, p.an[1] || SEM_FIM]) : "");
  // Rede de segurança: além da tabela, vale o ano que o texto da aplicação dá direto ao modelo do "ve" (anosNoTexto).
  // Sem ano no trecho, o modelo não ganha ano por aqui (BCE3001: "Polo – todos," fica sem ano e fora de Polo 2026).
  // Com o "an", só ele vale (a rede não dá ano fora do "an"). Feito uma vez por produto.
  // Grupo com "/": modelos unidos só por "/" ("Gol / Saveiro 01/1980–12/2009", "Palio/Siena 1996+") dividem o ano que
  // vem depois; na lista com vírgula ("Ka, Fiesta, Courier 1993+", decisão 1a do Alexandre), o ano é só do último. A
  // barra da cilindrada ("1.6 8V/16V"), da versão ("i/Mi"), da data (MM/AAAA) e da marca ("Fiat / Alfa Romeo") não
  // fica entre dois modelos e não conta. Vale na tabela e na rede de segurança.
  const dividemAno = (entre) => /^\s*\/\s*$/.test(entre);
  const RX_MODELO_TXT = new Map();
  const rxModeloTxt = (m) => { if (!RX_MODELO_TXT.has(m)) RX_MODELO_TXT.set(m, new RegExp("(?<![A-Z0-9])" + corpoModelo(m) + "(?![A-Z0-9])", "g")); const r = RX_MODELO_TXT.get(m); r.lastIndex = 0; return r; };
  // A leitura comum do ano por modelo: para cada modelo de "mods" (com 2 ou mais letras), as faixas do trecho depois
  // do nome até o próximo modelo de "mods" ou o ";", com o grupo "/". O ano é lido no texto inteiro (faixasNoTexto,
  // que vê o que vem antes: "A/C/D10/14/15" não é ano) e fica com o trecho onde começa. Devolve Map(modelo → faixas).
  // Serve à rede de segurança (os modelos do "ve") e à busca digitada no produto sem "ve" (todos os modelos do
  // índice: "Polo 2007 · Polo 2018" não dá 2026 ao Polo; "Pollo" não é Polo).
  function anosPorModelo(texto, mods) {
    const t = textoDeAno(texto), comp = compacto(t), out = new Map(), ocs = [];
    for (const m of mods) {
      const c = compacto(m);
      if (c.length < 2 || !comp.includes(c)) continue; // o modelo só casa se está no texto sem espaço e hífen
      for (const r of t.matchAll(rxModeloTxt(m))) ocs.push({ m, ini: r.index, fim: r.index + r[0].length });
    }
    const boas = ocs.filter((o, i) => !ocs.some((x, j) => j !== i && x.ini <= o.ini && x.fim >= o.fim && x.fim - x.ini > o.fim - o.ini)).sort((a, b) => a.ini - b.ini);
    const prox = boas.map((o, i) => boas.findIndex((x, j) => j > i && x.ini >= o.fim));
    const todas = faixasNoTexto(t);
    const fxs = boas.map((o, i) => {
      const lim = prox[i] >= 0 ? boas[prox[i]].ini : t.length, pv = t.indexOf(";", o.fim), fim = pv >= 0 && pv < lim ? pv : lim;
      return todas.filter((x) => x.i >= o.fim && x.i < fim);
    });
    for (let i = boas.length - 1; i >= 0; i--) // do fim para o começo: "Gol / Saveiro / Parati 1997>" passa o ano a todos
      if (!fxs[i].length && prox[i] >= 0 && dividemAno(t.slice(boas[i].fim, boas[prox[i]].ini))) fxs[i] = fxs[prox[i]];
    boas.forEach((o, i) => { if (fxs[i].length) out.set(o.m, (out.get(o.m) || []).concat(fxs[i])); });
    return out;
  }
  const ANOS_TEXTO = new Map();
  function anosNoTexto(p) {
    if (ANOS_TEXTO.has(p)) return ANOS_TEXTO.get(p);
    const out = new Map();
    if (!anoDaBase(p)) {
      const porModelo = anosPorModelo(p.a, [...new Set(p.ve.map((x) => x[1]))]);
      for (const [fab, mo] of p.ve) if (porModelo.has(mo)) { const k = norm(fab) + "|" + norm(mo); if (!out.has(k)) out.set(k, porModelo.get(mo)); }
    }
    ANOS_TEXTO.set(p, out);
    return out;
  }
  const faixasDoVeiculo = (p, v) => tabelaDe(p).filter((r) => norm(r[0]) === v.vm && (!v.vmo || norm(r[1]) === v.vmo))
    .flatMap((r) => faixasDaCelula(r[4]).map(faixaDaCelula).filter(Boolean))
    .concat(...[...anosNoTexto(p)].filter(([k]) => k.startsWith(v.vm + "|") && (!v.vmo || k === v.vm + "|" + v.vmo)).map(([, fx]) => fx));
  const serveNoAno = (e, v) => (veDe(e) ? faixasDoVeiculo(e.p, v).some(([de, ate]) => v.va >= de && v.va <= ate) : anoServe(e, v.va));
  // Motor = a cilindrada da aplicação ("1.8"); Versão = o 3º item do "ve" (T-0017). Produto que não diz o motor ou
  // a versão serve para qualquer um.
  // pelaAplicacao: o produto sem "ve" num JSON com "ve" é comparado pela aplicação, como no JSON antigo ("Leve também")
  function casaVeiculo(e, v, pelaAplicacao) {
    const ve = veDe(e);
    if (TEM_VE && !ve && !pelaAplicacao) return false;
    const hits = ve ? ve.filter((x) => x[0] === v.vm && (!v.vmo || x[1] === v.vmo)) : null;
    if (ve ? !hits.length : !daMarca(e, v.vm) || (v.vmo && !temPalavra(e.apl, v.vmo))) return false;
    if (v.va && !serveNoAno(e, v)) return false;
    if (v.vmt) { const m = motoresDe(e); if (m.length && !m.includes(v.vmt)) return false; }
    if (v.vv && hits) { const vs = hits.map((x) => x[2]).filter(Boolean); if (vs.length && !vs.includes(v.vv)) return false; }
    return true;
  }
  // norm: "CITROËN" e "CITROEN" são a mesma marca (a placa manda com acento; a base compara sem)
  const veiculoDaRota = (pr) => ({ vm: norm(pr.get("vm")), vmo: norm(pr.get("vmo")), va: +pr.get("va") || 0, vmt: norm(pr.get("vmt")), vv: norm(pr.get("vv")) });
  const nomeVeiculo = (pr) => [pr.get("vm") && marcaTela(pr.get("vm")), pr.get("vmo") && bonito(pr.get("vmo")), pr.get("va"), pr.get("vmt"), pr.get("vv") && bonito(pr.get("vv"), true)].filter(Boolean).join(" ");
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
  const entradaDe = (p) => (E_DE || (E_DE = new Map(INDICE.map((e) => [e.p, e])))).get(p);
  function opcoesVeiculo(v, pr) {
    const semVei = new URLSearchParams(pr); VEI_K.forEach((k) => semVei.delete(k));
    const base = buscar(semVei).map(entradaDe);
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
      // T-0033: com "ve", os anos das linhas da tabela do modelo (a linha sem ano não dá ano à lista)
      const fx = ve ? faixasDoVeiculo(e.p, v) : an || (e.faixas.length ? e.faixas : [[1980, ANO_HOJE]]);
      const vistos = new Set();
      for (const [de, ate] of fx) for (let a = Math.max(1980, de || 1980); a <= Math.min(ANO_HOJE, ate || ANO_HOJE); a++) vistos.add(a);
      for (const a of vistos) anos.set(a, (anos.get(a) || 0) + 1);
      if (!v.va || !serveNoAno(e, v)) continue;
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
      vmo: top(modelos, 80).filter(([x, q]) => TEM_VE || q >= 2 || x === v.vmo).sort((a, b) => a[0].localeCompare(b[0])), // só no JSON antigo (modelo lido da aplicação) sai o que aparece 1 vez; com o "ve", fica (T-0018: com 1 produto, a lista ficava vazia)
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
        ${lista("vm", "Marca", curto ? "Todas" : "Todas as marcas", v.vm, true, marcaTela)}
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
    const nMarcados = Object.keys(FILTROS).reduce((t, k) => t + pr.getAll(k).filter(Boolean).length, 0);
    pagina.insertAdjacentHTML("afterbegin", meuVeiculoHtml(pr)); // um bloco só (um aria-label), logo abaixo da faixa escura da busca
    ligarMeuVeiculo(app.querySelector(".pagina-busca .meu-veiculo"), pr);
    if (CELULAR.matches) {
      const rotulo = "Filtrar" + (nMarcados ? ` (${nMarcados})` : "");
      // sem resultado (total 0), sem o "Filtrar" (R-20261120-174100, item 3): os filtros marcados saem pelas etiquetas
      if (todos.length) topo.querySelector("h1").insertAdjacentHTML("afterend", `<button type="button" class="bt bt-claro bt-mini bt-filtrar" aria-haspopup="dialog">${rotulo}</button>`);
      const dlg = document.createElement("dialog");
      dlg.className = "painel-c";
      dlg.setAttribute("aria-labelledby", "painel-c-tit");
      dlg.innerHTML = `<div class="painel-cab"><b id="painel-c-tit">Filtrar</b><button type="button" class="painel-x" aria-label="Fechar">✕</button></div>
        <div class="painel-corpo"></div>
        <div class="painel-pe"><button type="button" class="bt painel-ok">Ver ${nProd(todos.length)}</button></div>`;
      dlg.querySelector(".painel-corpo").appendChild(barra);
      pagina.appendChild(dlg);
      topo.querySelector(".bt-filtrar")?.addEventListener("click", abrirPainel);
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
  // sem repetir; as observações soltas ("s/ ar", "c/ ar") ficam fora. O código do catálogo com "/" ou espaço
  // ("ROL39590/39520", "90/90-18 57P V250R") fica inteiro (T-0018); o resto se divide também no "/" e no espaço.
  let COD_COMPOSTO = null; // os códigos do catálogo com "/" ou espaço, em maiúsculas, do mais longo ao mais curto
  function listaCodigos(txt) {
    COD_COMPOSTO = COD_COMPOSTO || BASE.produtos.map((p) => String(p.c).toUpperCase()).filter((c) => /[\/\s]/.test(c)).sort((x, y) => y.length - x.length);
    const vistos = new Set(), out = [];
    const pegar = (c) => {
      const k = normCod(c);
      if (!k || vistos.has(k) || !(POR_COD.has(k) || (k.length >= 4 && /[A-Z]/.test(k) && /\d/.test(k)))) return;
      vistos.add(k);
      out.push(c);
    };
    for (const pd of String(txt || "").split(/\s*[·,;|]\s*/)) {
      const up = pd.toUpperCase();
      let fim = 0;
      for (const m of pd.matchAll(/[^\s\/]+/g)) {
        if (m.index < fim) continue; // ainda dentro do código inteiro de antes
        const c = COD_COMPOSTO.find((x) => up.startsWith(x, m.index) && !/[A-Z0-9]/.test(up.charAt(m.index + x.length)));
        if (c) { pegar(pd.substr(m.index, c.length)); fim = m.index + c.length; } else pegar(m[0]);
      }
    }
    return out;
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
        ? `<li><a class="item-rel" href="#/produto/${encodeURIComponent(p.c)}">${miniHtml(p)}<span class="rel-txt"><b>${esc(p.c)}</b><span title="${esc(anoMaisTxt(p.d))}">${anoMaisHtml(p.d)}</span></span></a></li>`
        : `<li><span class="item-rel fora">${miniHtml(null)}<span class="rel-txt"><b>${esc(c)}</b><span>fora do catálogo</span></span></span></li>`;
    }).join("")}</ul>`;
  }
  // "Leve também" (faixa verde-clara), logo abaixo dos botões e antes da aplicação (opção B, R-20261120-140600): o título
  // à esquerda no computador e em cima no celular. "Itens parecidos" e "Diferencial BAP" saíram da tela e da ficha
  // impressa do site (R-20261120-155900-alexandre e R-20261120-160300-alexandre)
  // "Leve também" conforme o veículo da placa ou das listas (R-20261120-181930-alexandre e R-20261120-182200-alexandre):
  // com veículo, fica o item que serve nele pela regra do filtro "Meu veículo" (casaVeiculo), só com a marca, o modelo e
  // o ano; o item sem "ve", pela aplicação (a marca e o modelo escritos nela, como no JSON antigo); ficam sempre o item
  // sem aplicação, o UNIVERSAL e o fora do catálogo. Sem veículo, a lista inteira do oj, menos o item UNIVERSAL
  // (sem "ve" e com "universal" na aplicação) de outra família (fa) que a do produto aberto (R-20261120-191700-alexandre
  // e R-20261120-192000-alexandre: "sem a placa"); sem nenhum, a seção some. Só na tela. O VEI_LEVE vem do render.
  let VEI_LEVE = null; // { vm, vmo, va, vmt, vv } ou null
  const veiculoDoHash = (h) => { const pr = new URLSearchParams(String(h || "").split("?")[1] || ""); return pr.get("vm") ? veiculoDaRota(pr) : null; };
  // false: com veículo (placa ou listas), o UNIVERSAL fica sempre, como no #58; true: a regra da família vale também com veículo
  const UNIVERSAL_SO_MESMA_FAMILIA_COM_VEICULO = false;
  const servemNoVeiculo = (cods, v, aberto) => {
    const comVei = !!(v && v.vm);
    return cods.filter((c) => {
      const p = POR_COD.get(normCod(c)), e = p && entradaDe(p);
      if (!e) return true; // fora do catálogo
      const semVe = !veDe(e), universal = semVe && !!e.apl && temPalavra(e.apl, "UNIVERSAL");
      if (universal && (!comVei || UNIVERSAL_SO_MESMA_FAMILIA_COM_VEICULO)) return !!p.fa && p.fa === aberto.fa;
      return !comVei || universal || (semVe && !e.apl)
        || casaVeiculo(e, { vm: v.vm, vmo: v.vmo, va: v.va }, true); // marca, modelo e ano; sem motor e sem versão
    });
  };
  // "Leve também" pelo sistema da peça (T-0018): campos sc e ss do produtos.json; regra em docs/DADOS_DO_SITE.md.
  const sistemasDe = (p) => p.ss || (p.si ? [String(p.si).toUpperCase()] : []);
  const sisOk = (aberto, p) => {
    const so = sistemasDe(aberto), sd = sistemasDe(p);
    return !so.length || !sd.length || so.some((o) => sd.some((d) => ((BASE.sc || {})[o] || [o]).includes(d)));
  };
  const doSistema = (cods, aberto) => cods.filter((c) => { const p = POR_COD.get(normCod(c)); return !p || sisOk(aberto, p); });
  const secJunto = (H2, cods) => cods.length
    ? `<section class="secao rel rel-oj"><${H2} class="secao-tit">Leve também</${H2}>${itensRelHtml(cods)}</section>` : "";

  // Tabela da aplicação: uma linha por veículo do "ve" (Marca, Modelo, Cilindrada, Versão, Ano). Marca, Modelo e
  // Versão são do "ve". SIMULAÇÃO: a base ainda não tem cilindrada nem ano por veículo; aqui eles saem do trecho da
  // aplicação onde o modelo aparece (o mesmo texto da lista Motor e do ano); o ano da base (an), se houver, vale
  // primeiro. Sem achar: "—".
  const fmtFaixa = ([de, ate]) => de <= SEM_INICIO ? "até " + ate : ate >= SEM_FIM ? de + "–" : de === ate ? String(de) : de + "–" + ate;
  // o ano sem fim fica "2006–" por dentro (as comparações da célula) e aparece "2006+" (anoMaisHtml, T-0018): o leitor
  // de tela ouve "2006 em diante". Com várias faixas na célula (R-20261120-165900-alexandre), cada uma num .faixa, com
  // a vírgula no fim ("2011–2019,")
  const SEP_FAIXAS = ", ";
  const faixasDaCelula = (an) => String(an || "").split(SEP_FAIXAS).filter(Boolean);
  const anoHtml = (an) => faixasDaCelula(an).map((f, i, l) => `<span class="faixa">${anoMaisHtml(f)}${i < l.length - 1 ? "," : ""}</span>`).join(" ");
  // pedaços do trecho para a coluna Ano (doModelo): " · ", " ; ", " : ", " | ", " + ", "94/97 Coupe", "2001> 206", a
  // vírgula antes de um número que não é ano ("Atego 1315 (2005–2010), 1418 (2004–2012)", "Axor 1933 (...), 2035") e a vírgula depois da
  // cilindrada ("EcoSport 01/2003–12/2007 1.0, 01/2003–12/2013 1.6"); a lista de anos ("(1995–1996, 1999–2009)",
  // "Monza 01/82 - 12/89, 01/90 - 12/96") fica junta
  const RX_PEDACO_ANO = /\s*[·;:|]\s*|\s+\+\s+|(?<=\b\d{2}\/\d{2}\)?)\s+(?=[A-Z])|(?<=(?:19|20)\d{2}>)\s+(?=\d)|\s*,\s*(?=\d)(?!(?:\d{2}\/)*(?:19[5-9]\d|20[0-2]\d)(?!\d)|\d{2}\/\d{2}(?!\d))|(?<=\d[.,]\d)\s*,\s*(?=\d)/;
  const RX_SO_MES_ANO = /^\(?\d{2}\/\d{2}(?:\s*[-–]\s*\d{2}\/\d{2})?\)?$/; // "01/90 - 12/96"
  const soAnoPedaco = (x) => (SO_ANO.test(x) || RX_SO_MES_ANO.test(x)) && faixasDoTexto(x).length > 0; // o pedaço só de ano
  let RX_MARCA_MEIO = null, RX_MARCA_ANTES = null;
  let ALT_MARCAS = null; // as marcas e os apelidos (GM, VW, MB…) para os regex da coluna Ano
  const altMarcas = () => ALT_MARCAS || (ALT_MARCAS = [...NOME_MARCA.keys(), ...Object.values(APELIDOS).join(" ").split(" ")].filter(Boolean).map(reEsc).join("|"));
  const rxMarcaAntes = () => RX_MARCA_ANTES || (RX_MARCA_ANTES = new RegExp(String.raw`(?:^|[^A-Z0-9])(?:${altMarcas()})\s+$`));
  // a marca no meio do pedaço ("Atego - 2005 em Diante Mercedes-Benz 1418 Atego") começa outro veículo
  const rxMarcaNoMeio = () => RX_MARCA_MEIO || (RX_MARCA_MEIO = new RegExp(String.raw`\s+(?=(?:${altMarcas()})(?![A-Z0-9]))`));
  function linhasVeiculos(p) {
    if (!Array.isArray(p.ve) || !p.ve.length) return [];
    const apl = String(p.a || ""), up = semAcento(apl).toUpperCase();
    const modelos = [...new Set(p.ve.map((x) => norm(x[1])).filter(Boolean))];
    const achar = (m, de) => { const r = rxPalavra(m, "g"); r.lastIndex = de; const x = r.exec(up); return x ? x.index + x[1].length : -1; };
    // onde o modelo começa (revisão do testes no PR #54): o nome dentro de um modelo mais longo do ve ("Siena" em "Grand
    // Siena", "Vitara" em "Grand Vitara") é do longo, nunca do curto
    const dentroDeOutro = (m, k) => modelos.some((o) => o !== m && o.includes(m) && up.startsWith(o, k - o.indexOf(m)));
    const inicioDe = (m) => { let k = achar(m, 0); while (k >= 0 && dentroDeOutro(m, k)) k = achar(m, k + m.length); return k; };
    const trecho = new Map(), inicio = new Map(), cortado = new Set();
    for (const m of modelos) {
      const i = inicioDe(m);
      inicio.set(m, i);
      if (i < 0) { trecho.set(m, ""); continue; }
      let fim = Math.min(apl.length, i + 120);
      // o fim é o próximo modelo; o nome curto dentro do longo ("Palio" em "Palio Weekend") não corta o trecho do longo
      const longo = (o, j) => modelos.some((x) => x !== o && x.includes(o) && up.startsWith(x, j));
      // o modelo mais longo que contém este também fecha o trecho, depois do começo dele ("Gol (G5…), Golf (após 2000)")
      for (const o of modelos) if (o !== m) { let j = achar(o, i + m.length); while (j > 0 && longo(o, j)) j = achar(o, j + o.length); if (j > i && j < fim) fim = j; }
      if (fim === i + 120 && /[\p{L}\d]{2}/u.test(apl.slice(fim - 1, fim + 1))) cortado.add(m); // cortado no limite, no meio de uma palavra ou número
      trecho.set(m, apl.slice(i, fim));
    }
    const anoBase = anoDaBase(p);
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
    // Coluna Ano com todas as faixas do modelo (R-20261120-165900-alexandre; a regra e os exemplos estão no
    // docs/DADOS_DO_SITE.md): o trecho vai em pedaços e em entradas (o modelo e os pedaços só de ano depois dele); só
    // entra a entrada pura, sem nada além do que a linha já tem.
    const doModelo = (t, m, ver, cil) => {
      // só o bloco do modelo (BLOCO_APL: " ; " começa outro bloco de marca, "WR-V 1.5 L 16V · 2017 até 2020 ; VW - Spacecross"); o ";" colado separa veículos do mesmo bloco ("X1 2015 2022; X1 2023 →")
      const ps = norm(t).split(BLOCO_APL)[0].split(RX_PEDACO_ANO).flatMap((x) => x.split(RX_SEP_VEICULO)).flatMap((x) => x.split(rxMarcaNoMeio()))
        .map((x) => x.trim()).filter(Boolean);
      const lista = /([^·;:|,\/]*)[,\/]\s*$/.exec(up.slice(Math.max(0, inicio.get(m) - 40), inicio.get(m)));
      const emLista = lista && !/\d/.test(lista[1]) && modelos.some((o) => o !== m && rxPalavra(o).test(lista[1])); // outro modelo do ve antes da "," ou "/"
      const V = ver ? norm(ver) : "";
      if (!ps.length || (V && !rxPalavra(V).test(ps[0])) || emLista) return "";
      const doM = (x) => x.startsWith(m) && !/[A-Z0-9]/.test(x.charAt(m.length));
      const puro = (x) => {
        let r = doM(x) ? x.slice(m.length) : x;
        if (V) { if (!rxPalavra(V).test(r)) return false; r = r.replace(rxPalavra(V, "g"), "$1 $2"); }
        if (cilDe(r).some((c) => c !== cil)) return false; // outra cilindrada, ou a válvula que a linha não tem
        // mais de uma faixa e a cilindrada no mesmo pedaço: não dá para saber de qual é ("Meriva 01/2003–12/2012, 01/2008–12/2013 1.4")
        if (cilDe(r).length && new Set(faixasDoTexto(r).map(fmtFaixa)).size > 1) return false;
        // o "em diante" escrito como ">", "→", "+" ou "»" logo depois do ano não é qualificador ("X1 2023 →", "08/2011+")
        return !r.replace(RX_CIL, " ").replace(/(?<=\d)\s*(?:\+|»)/g, " ").replace(RX_ANO, " ").replace(/\b\d{2}[\/-]\d{2}\b/g, " ").replace(SOBRA_APL, " ").trim();
      };
      // a palavra colada antes do modelo também qualifica ("2035 Axor", "Cross UP", "Grand Santa FE"); a marca, não
      const ini = inicio.get(m), antes = up.slice(Math.max(0, ini - 25), ini);
      const colada = doM(ps[0]) && /[A-Z0-9]\s+$/.test(antes) && !rxMarcaAntes().test(antes);
      const entradas = [];
      let pendente = colada;
      for (const [k, x] of ps.entries()) {
        if (k && modelos.some((o) => o !== m && o.includes(m) && x.startsWith(o))) break; // o modelo mais longo ("Palio Weekend")
        if (!k || doM(x)) { entradas.push({ partes: [x], puro: puro(x) && !pendente }); pendente = false; }
        else if (soAnoPedaco(x)) entradas[entradas.length - 1].partes.push(x);
        else if (faixasDoTexto(x).length || rxMarcaAntes().test(x + " ")) break; // outro veículo com ano ou a marca; "2036" de "2036 Axor" não é ano
        // o nome seguido do pedaço só de ano é outro veículo ("Galloper 2.5 L · 1998–2004 · H1 Starex · 2000–2026")
        else if (ps[k + 1] && soAnoPedaco(ps[k + 1])) break;
        // detalhe sem ano: qualifica a entrada de antes ("Dualogic", "Diant", "com A/C") e a de depois ("2036 · Axor")
        else { entradas[entradas.length - 1].puro = false; pendente = true; }
      }
      return entradas.filter((e) => e.puro).flatMap((e) => e.partes).join(" · ");
    };
    // só faixa de verdade; o "2014 até" sem o ano final (o texto ou o trecho cortado) não é faixa sem fim: a faixa
    // aberta só vem do ">" ou do "em diante" (decisão do gerente no PR #54)
    const faixasDe = (t) => faixasDoTexto(String(t).replace(/((?:19|20)\d{2})\s*at[ée](?![\s·]*\d)/gi, "$1")).filter(([de, ate]) => de !== ate);
    const linhas = p.ve.map(([fab, mod, ver]) => {
      const m = norm(mod), vs = versoesDe(m);
      let t = trecho.get(m) || "", repetido = false;
      const cheio = t;
      if (vs.length > 1 || (vs.length === 1 && p.ve.some((x) => norm(x[1]) === m && !x[2]))) t = pedaco(t, ver ? norm(ver) : "", vs.filter((v) => v !== norm(ver || "")));
      else if (!vs.length) { // o modelo repetido ("Pulse 1.0 L 12V · 2021 · Pulse 1.3 L 16V · 2022 até 2024"): a cilindrada da 1ª entrada
        const r = rxPalavra(m, "g"), tu = semAcento(t).toUpperCase(); r.lastIndex = m.length; const x = r.exec(tu);
        if (x) { t = t.slice(0, x.index + x[1].length); repetido = true; }
      }
      const cil = cilDe(t.replace(RX_NEGA, " "))[0] || ""; // o "Exceto 2.4" não dá cilindrada
      // só as faixas das entradas puras (doModelo); uma faixa no trecho e nenhuma pura: ela, como antes; várias e nenhuma pura: "—"
      // no trecho cortado no meio de uma palavra ou número no limite dos 120, o ano não lê o último pedaço, que está
      // partido ("Worker 17-25" de "17-250", "2015 até 20"); a cilindrada lê o trecho inteiro, como antes (testes, PR #54)
      const semPartido = (x) => { if (!cortado.has(m) || !cheio.endsWith(x)) return x; const k = Math.max(...[...x.matchAll(/[·;,]/g)].map((y) => y.index)); return k > m.length ? x.slice(0, k) : x; };
      const tAno = semPartido(t);
      // o caminho (uma faixa ou várias) se escolhe como antes, com o "2014 até" contando como faixa; o valor sai sem ela
      const f1 = faixasDe(tAno), n1 = new Set(faixasDoTexto(tAno).filter(([de, ate]) => de !== ate).map(fmtFaixa)).size;
      const puras = repetido || n1 > 1 ? faixasDe(doModelo(repetido ? semPartido(cheio) : tAno, m, ver, cil)) : [];
      const fx = n1 > 1 ? puras : repetido && puras.length ? puras : f1;
      // a faixa inteira dentro de outra da célula não aparece ("2013–2021, 2014–2017" fica "2013–2021"); a sem fim fica por último
      const fora = fx.filter(([de, ate], i) => !fx.some(([d2, a2], j) => j !== i && d2 <= de && ate <= a2 && (d2 < de || ate < a2)));
      const ano = anoBase || [...new Set(fora.sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(fmtFaixa))].join(SEP_FAIXAS);
      return [marcaTela(fab), mod, cil, ver || "", ano];
    });
    return linhas;
  }
  // várias cilindradas na célula (T-0033: "1.0 / 1.5 / 1.6 8V"): cada uma inteira, a quebra só entre elas
  const cilHtml = (c) => String(c).split(" / ").map((x) => `<span class="cil">${esc(x)}</span>`).join(" / ");
  function tabelaVeiculos(linhas) {
    if (!linhas.length) return "";
    const traco = '<span aria-label="não informado">—</span>';
    // computador e PDF: a tabela, com o "—" na coluna vazia; celular (até 480 px): uma lista por veículo, sem rolar de
    // lado, só com o que veio ("Cilindrada 1.6 · Ano 2017–", "Ano 2017–" ou "Cilindrada 1.6"; sem os dois, só o nome)
    return `<div class="tab-rola"><table class="t tab-veiculos"><thead><tr><th scope="col">Marca</th><th scope="col">Modelo</th><th scope="col">Cilindrada</th><th scope="col">Versão</th><th scope="col">Ano</th></tr></thead>
      <tbody>${linhas.map((l) => `<tr>${l.map((c, i) => `<td>${c ? (i === 4 ? anoHtml(c) : i === 2 ? cilHtml(c) : esc(c)) : traco}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <ul class="lista-veiculos">${linhas.map(([ma, mo, ci, ve, an]) => `<li><b>${esc([ma, mo].join(" ") + (ve ? (ve.startsWith(NAO_SERVE) ? " · " : " ") + ve : ""))}</b>${ci || an
        ? `<span>${[ci && `Cilindrada ${esc(ci)}`, an && `Ano ${anoHtml(an)}`].filter(Boolean).join(" · ")}</span>` : ""}</li>`).join("")}</ul>`;
  }
  // Cilindradas do texto, com a válvula quando vem junto ("2.0 L 16V" → "2.0 16V", "1.8 8v" → "1.8 8V"): a coluna
  // Cilindrada da tabela mostra as duas (decisão do gerente sobre o RD-0174)
  const RX_CIL = /\b(\d[.,]\d)\b(?:\s*L\b)?(?:\s*(\d{1,2})\s?V\b)?/gi;
  const cilDe = (t) => [...String(t || "").matchAll(RX_CIL)].map((m) => m[1].replace(",", ".") + (m[2] ? " " + m[2] + "V" : ""));
  // Ano da aplicação: "2011", "01/1979", "01/01/2012". O pedaço só de ano: "2011 até 2014", "2009>", "2007–2012",
  // "2014 em Diante", "até 2009", "- 12/2020", "01/01/2012 A 31/12/2015", "2000–2003 / 2002>", "(2009>)" e a lista
  // "2012, 2013, 2014". "1924–1979 até 2026" (modelo de caminhão na frente) não é só ano. O ANO_APL fica no começo,
  // antes do RX_ANO_ABERTO, que também usa.
  const FAIXA_APL = String.raw`${ANO_APL}(?:\s*(?:at[ée]|a|–|-)\s*${ANO_APL})?(?:\s*(?:>|→|em diante|at[ée]))?`;
  const SO_ANO = new RegExp(String.raw`^(?:\(?(?:[-–]\s*|at[ée]\s+)?${FAIXA_APL}(?:\s*\/\s*${FAIXA_APL})?\)?|${ANO_APL}(?:\s*,\s*${ANO_APL})+)$`, "i");
  const RX_ANO = new RegExp(String.raw`(?<!\d)${ANO_APL}(?<=(\d{4}))(?!\d)`, "g"); // o ANO_APL termina no ano de 4 dígitos: o grupo 1
  // Linhas da lista da aplicação (T-0017, R-20261120-153900): cada " ; " (bloco de marca) começa linha nova e, dentro do
  // bloco, cada " · " também; o pedaço só de ano fica na linha do veículo de antes ("BMW - X1 2.0 L 16V · 2011 até
  // 2014"). Só a tela: a busca continua lendo o p.a inteiro.
  const BLOCO_APL = /\s+;\s+/;                                  // separa um bloco de marca do outro
  const RX_MARCA_BLOCO = /^[A-ZÀ-Ú][A-ZÀ-Ú /&.]{0,30}?\s-\s/;   // a marca do começo do bloco ("FIAT - ")
  const linhasAplic = (a) => String(a || "").split(BLOCO_APL).flatMap((bloco) => bloco.split(/\s+·\s+/).reduce((ls, x) => {
    if (ls.length && SO_ANO.test(x.trim())) ls[ls.length - 1] += " · " + x; else ls.push(x);
    return ls;
  }, [])).filter((x) => x.trim());
  const ulAplic = (ls) => `<ul class="aplic">${ls.map((x) => `<li>${anoMaisHtml(x)}</li>`).join("")}</ul>`;
  // Linha do texto coberta pela tabela (R-20261120-155900-alexandre, RD-0174 e as revisões do PR #50; desde a T-0033,
  // o que não é coberto entra na tabela: juntarNaTabela). A comparação é por veículo: a linha se divide em " / ", na vírgula e no
  // " - " antes de um nome, e depois de um ano seguido de um nome ("Logan 2014> Sandero 2014>"). Cada veículo (sem
  // acento, sem maiúscula, com "Pick up" igual a "Pick-Up" e sem o "–" entre o modelo e o ano) só é coberto quando a
  // tabela tem o modelo (o mais longo que casa: "Duster Oroch" antes de "Duster") e a versão citada, TODAS as
  // cilindradas e válvulas dele e a faixa de anos dele, e não sobra mais nada (o "exc. Si", o "(Enc. Mod. Antigo)", o
  // "Sportback", o "Axor 2035"). O pedaço só de ano ("04/2002–07/2012 / Meriva") é coberto pela linha do veículo de antes
  // (sem veículo antes, por uma linha da tabela). A linha só sai quando todos os veículos dela são cobertos.
  const SOBRA_APL = /\b(?:L|ATE|A|EM DIANTE|DIANTE)\b|[\s·>→–\-\/().,]+/g;
  const chaveApl = (t) => norm(t).replace(/([A-Z])-(?=[A-Z0-9])|([0-9])-(?=[A-Z])/g, "$1$2 ");
  // Devolve as linhas da tabela que cobrem o veículo (ou null). A faixa do texto tem de estar na célula Ano da PRÓPRIA
  // linha do veículo, a mesma da cilindrada; com mais de uma ("Astra (1995–1996, 1999–2009)"), todas. O veículo sem
  // ano usa o ano que vem depois dele na linha ("Clio / Kangoo / … / Symbol · 01/1996–12/2018"): o "herdado". O pedaço
  // só de ano é do veículo de antes (antes) (R-20261120-165900-alexandre e a revisão do designer-ux no PR #54).
  function cobreVeiculo(v, tab, herdado, antes) {
    const fx = faixasDoTexto(v), so = SO_ANO.test(v), anos = [...new Set((fx.length || so ? fx : faixasDoTexto(herdado || "")).map(fmtFaixa))];
    const temAno = (r) => anos.every((a) => faixasDaCelula(r[4]).includes(a));
    // o pedaço só de ano usa só o ano dele: o "2035" do "2035 Axor" e o "1932" do "1932 Cargo" não são ano
    if (so) { const dono = antes || tab; return anos.length && dono.some(temAno) ? dono.filter(temAno) : null; }
    const casa = tab.filter(([, mod, , ver]) => v.startsWith(chaveApl(mod)) && rxPalavra(chaveApl(mod)).test(v) && (!ver || rxPalavra(chaveApl(ver)).test(v)));
    const longo = Math.max(0, ...casa.map((r) => chaveApl(r[1]).length)), rs = casa.filter((r) => chaveApl(r[1]).length === longo);
    const cils = cilDe(v), cilOk = (r, c) => r[2] === c || (!c.includes(" ") && r[2].split(" ")[0] === c);
    const comAno = anos.length ? rs.filter(temAno) : rs;
    if (!comAno.length || !cils.every((c) => comAno.some((r) => cilOk(r, c)))) return null;
    let u = v.replace(RX_CIL, " ");
    for (const [, mod, , ver] of rs) for (const w of [chaveApl(mod), chaveApl(ver)].filter(Boolean)) u = u.replace(rxPalavra(w, "g"), "$1 $2");
    if (fx.length) u = u.replace(RX_ANO, (x, a) => (fx.some(([de, ate]) => +a === de || +a === ate) ? " " : x)); // só os anos das faixas
    return /[A-Z0-9]/.test(u.replace(SOBRA_APL, " ")) ? null : comAno;
  }
  // o que separa um veículo do outro na linha (texto sem acento e em maiúsculas); também na coluna Ano (doModelo)
  const RX_SEP_VEICULO = /\s+\/\s*|\s*\/\s+|\s*,\s*(?=[A-Z])|\s+[–—-]\s+(?=[A-Z])|(?<=(?:19|20)\d{2}(?:>|\/?\.{3})?\)?)\s+(?=[A-Z])(?!(?:ATE|A|AO|EM DIANTE)\b)/;
  // as linhas da tabela que cobrem o último veículo do texto, ou null quando algum veículo dele não é coberto
  const linhaCoberta = (l, tab) => {
    const vs = chaveApl(l).replace(RX_MARCA_BLOCO, "") // sem a marca do começo do bloco
      .split(RX_SEP_VEICULO).map((v) => v.replace(/\s+[–—-]\s+/g, " ").trim()).filter(Boolean);
    let antes = null;
    return vs.every((v, k) => (antes = cobreVeiculo(v, tab, vs.slice(k + 1).find((x) => faixasDoTexto(x).length), SO_ANO.test(v) ? antes : null))) ? antes : null;
  };
  // T-0033 (R-20261124-152425-po: "esse outra veiculos e datalhe, nao tem que existir. tem que fazer parte da tabela
  // normalmente"): acabou o bloco "Outros veículos e detalhes". Cada veículo do texto que a tabela não cobre
  // (cobreVeiculo) vira linha da tabela (juntarNaTabela); a regra está no docs/DADOS_DO_SITE.md.
  // Separam veículos, além do RX_SEP_VEICULO: toda vírgula ("106, 206 1.4"), o ":" ("Sandero 07/2011: Logan 06/2011")
  // e o " + " ("I30 07/2012 + Elantra 11/2012"); o pedaço sem modelo volta a se juntar (veiculosDaLinha)
  const RX_SEP_VEICULO_G = new RegExp(RX_SEP_VEICULO.source + String.raw`|\s*,\s*|\s*:\s+|\s+\+\s+`, "gi");
  const RX_FAIXA_APL = new RegExp(String.raw`\(?\s*(?:[-–]\s*|at[ée]\s+)?${FAIXA_APL}\s*\)?|\b\d{2}\/\d{2}\b|\b\d{2}\s*\/\s*(?:\.{2,}|…)|(?:\.{2,}|…)`, "gi");
  const fmtFaixas = (fx) => [...new Set(fx.filter(([de, ate], i) => !fx.some(([d2, a2], j) => j !== i && d2 <= de && ate <= a2 && (d2 < de || ate < a2)))
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(fmtFaixa))].join(SEP_FAIXAS);
  // A Marca da tabela só pode ser montadora de algum "ve" do catálogo (indiceVe), pelo nome, pelo MONTADORAS
  // ("General Motors" e "GM" são Chevrolet) ou pelos APELIDOS; outro texto ("Fora da Frota Brasileira", "Motos",
  // "Belina", "Classe A") não é marca: ""
  const MARCA_DO_APELIDO = new Map(Object.entries(APELIDOS).reverse().flatMap(([m, a]) => a.split(" ").map((x) => [x, m])));
  const marcaDe = (x) => { const n = norm(x), m = norm(MONTADORAS[n] || "") || MARCA_DO_APELIDO.get(n) || n; return indiceVe().marcas.has(m) ? m : ""; };
  // "Fiat / Alfa Romeo", "Ford/Mb/VW": as marcas do texto; com uma que não é montadora, nenhuma
  const marcasDoTexto = (x) => { const ms = String(x).split(/\s*\/\s*/).map(marcaDe); return ms.every(Boolean) ? [...new Set(ms)] : []; };
  let RX_MARCA_INI = null; // a marca na frente do modelo ("Renault Sandero", "VW Kombi")
  const rxMarcaIni = () => RX_MARCA_INI || (RX_MARCA_INI = new RegExp(String.raw`^(${altMarcas()})\s*[:–-]?\s+`, "i"));
  const modelosDaMarca = (vm) => indiceVe().porMarca.get(vm) || [];
  // o modelo no começo do texto (corpoModelo): [modelo, tamanho no texto, marca] ou null (modelos: [[modelo, marca], ...])
  const RX_MODELO = new Map();
  const rxModelo = (m) => { if (!RX_MODELO.has(m)) RX_MODELO.set(m, new RegExp("^" + corpoModelo(m) + "(?![A-Z0-9])")); return RX_MODELO.get(m); };
  const modeloNoInicio = (x, modelos) => { const u = semAcento(x).toUpperCase(); for (const [m, vm] of modelos) { const r = rxModelo(m).exec(u); if (r) return [m, r[0].length, vm]; } return null; };
  // Na dúvida, a tabela não inventa modelo (U1, MC-0035). A carroceria ("Sedan 1.8 16V 1997>", "Pick Up (1985–1988)")
  // é Versão do modelo de antes; a palavra técnica ("Flex", "Manual", "Dianteiro") e a que nunca é modelo ("Motos",
  // "Caminhões", "Guerra", "Argentina") não abrem veículo
  const RX_CARROCERIA = /^(?:SEDAN|SW|HATCH|WEEKEND|PICK[\s-]?UP|PICKUP|CABINE|CUPE|COUPE|WAGON|VAN|FURGAO|PERUA|CONVERSIVEL|SPORTBACK|VARIANT|STATION)(?![A-Z0-9])/;
  const carroceria = (x) => RX_CARROCERIA.test(norm(x));
  const TECNICO = new Set([...PARA_FORA, "FLEX", "GAS", "GASOLINA", "ALCOOL", "ETANOL", "DIESEL", "ABS", "MANUAL", "AUTOMATICO", "DIANTEIRO",
    "DIANTEIRA", "TRASEIRO", "TRASEIRA", "DIREITO", "DIREITA", "ESQUERDO", "ESQUERDA", "RODA", "RODAS", "LADO", "AMBOS", "HIDRAULICA", "HIDRAULICO",
    "ELETRICA", "ELETRICO", "MECANICA", "MECANICO", "ASSIST", "SISTEMA", "INCLUSIVE", "EXCETO", "OPCIONAL", "ORIGINAL", "PARA", "MODELO", "CONVENCIONAL",
    "ADVENTURE", "LOCKER", "DUALOGIC", "ATTRACTIVE", "ESSENCE", "SPORTING", "TREKKING", "FIRE", "MILLE", "DETALHE", "UNIVERSAL", "ARO"]); // versão e técnica
  const NUNCA_MODELO = new Set(["GUERRA", "ARGENTINA", "BRASIL", "EUROPA", "MOTORS", "MOTORES", "MULTI", "ELETRODO", "CAMBIO", "CAMBIOS",
    "TRATORES", "MOTO", "MOTOS", "CAMINHOES", "CARRETA", "CARRETAS", "RANDON", "LEVE", "LEVES", "PESADA", "PESADAS", "PESADO",
    "PESADOS", "EXTRAPESADOS", "NACIONAL", "NACIONAIS", "IMPORTADO", "IMPORTADOS", "AGRICOLAS", "MAQUINA", "MAQUINAS", "EMPILHADEIRA",
    "EMPILHADEIRAS", "ESTACIONARIO", "GERADOR", "GERADORES", "ALTERNADOR", "ALTERNADORES", "VARIOS", "DIVERSOS", "GERAL", "FROTA", "FORA", "OUTROS",
    "DEMAIS", "VEICULO", "VEICULOS", "CARRO", "CARROS", "UTILITARIOS", "LINHAS", "PECA", "PECAS", "KIT", "JOGO", "CONJUNTO", "PARTIDA", "BOMBA",
    "FILTRO", "OLEO", "AR", "COMBUSTIVEL", "INJECAO", "CARBURADO", "CARBURADOR", "ELETRONICA", "ELETRONICO", "EIXO", "DIFERENCIAL", "CUBO",
    "ROLAMENTO", "CORREIA", "TENSOR", "VELA", "VELAS", "CABO", "CABOS", "SENSOR", "BOBINA", "ADAPTADOR", "SUPERIOR", "INFERIOR",
    "COMPLETO", "NEW", "FULL", "WAY", "PLUGUE", "TERMINAL", "CILINDRO", "AUXILIAR", "EMBREAGEM", "PNEUMATICA", "EIXOS", "MERITOR", "FACCHINI", "NOMA",
    "ESPECIFICACAO", "DIMENSIONAL", "PROPRIA", "PINO", "ESTENDIDA", "LONGO", "EASY", "HARD", "WORKING", "PLUS", "SUPER", "STREET", "HOBBY",
    "LASER", "PLATINUM", "INTENSE", "ULTIMATE", "TRENDLINE", "YOUNG", "FURGONETA", "BUSINESS", "PACK", "MINIBUS", "ECOTEC", "ROCAM", "MAX", "E85",
    "VVT", "SOHC", "DOHC", "MPFI", "TORQ", "MASSEY", "FERGUSON", "VALTRA", "MAN", "OPEL", "DAIHATSU", "SKODA", "IVECO", "MWM", "CUMMINS"]);
  // o nome de modelo fora do catálogo: até 3 palavras com maiúscula, a 1ª com letra, sem "/" e sem ano; nenhuma
  // palavra técnica, que nunca é modelo ou marca; não é carroceria nem código de versão ("G2", "T4")
  const RX_NOME = /^[A-ZÀ-Ý][\wÀ-ÿ-]*(?:\s+(?!(?:19|20)\d{2}(?!\d)|\d{2}\/)[A-ZÀ-Ý0-9][\wÀ-ÿ-]*){0,2}(?=[\s(,]|$)/;
  const nomeFora = (x) => {
    const m = RX_NOME.exec(x), ws = m ? norm(m[0]).split(/[^A-Z0-9]+/).filter(Boolean) : [];
    // na dúvida, fora: a palavra só de até 3 letras ("Zen", "Lkj"), a sigla de até 4 ("SOHC", "TSI", "GTI"), o código
    // de motor ("OM-366", "DSC12") e a medida ("Ø Pino 24mm") também não são modelo
    const curto = ws.length === 1 && !/\d/.test(m[0]) && (m[0].length <= 3 || /^[A-Z]{1,4}$/.test(m[0]));
    return m && !curto && !carroceria(m[0]) && !/^[A-Z]{1,2}\d{1,2}$/i.test(m[0]) && !/^(?:OM|DSC|DC)[\s-]?\d/i.test(m[0]) && !/Ø|\d\s*MM\b/i.test(m[0])
      && !ws.some((w) => TECNICO.has(w) || NUNCA_MODELO.has(w) || marcaDe(w)) && !marcaDe(m[0]) ? m[0] : "";
  };
  // o nome solto depois de vírgula, sem ano nem número com ponto ("Escort, Versailes, Royale"): veículo da lista
  const nomeSolto = (x) => nomeFora(x) === x;
  // o pedaço que começa com letra e tem o ano dele também é veículo quando é o 1º da linha ou vem depois de vírgula
  // ("New Fiesta hatch/sedan ... 2013>", "Kadet 1996>") ou tem também a cilindrada ("Novo Ka 1.0/1.5 16V 2014–2018");
  // "Fire 2000>", "s/ ABS (2002>)" e "ABS Lado Roda 02/2002" não
  const veiculoComAno = (x, primeiro) => /^[A-ZÀ-Ý]/.test(x) && !SO_ANO.test(x) && !TECNICO.has(norm(x).split(/[^A-Z0-9]/)[0])
    && faixasDoTexto(x).length > 0 && (primeiro || cilDe(x).length > 0);
  // Os veículos da linha, no texto original (o semAcento tem o mesmo tamanho), sem a marca do começo do bloco. Começa
  // veículo novo o pedaço que começa por um modelo (da tabela ou da marca), o veículo com ano, o nome solto depois de
  // vírgula e a marca sozinha ("/ Scania"); o resto ("todos", "1.6mpi 1995–2004", "Flex", "s/ ABS", "Dianteiro", o
  // pedaço só de ano) fica no veículo de antes, com o separador do texto. out.seps: o separador antes de cada veículo.
  function veiculosDaLinha(l, modelos) {
    const s = semAcento(l), t = s.length === l.length ? l : s, out = [];
    out.seps = [];
    const mb = RX_MARCA_BLOCO.exec(s.toUpperCase());
    let de = mb ? mb[0].length : 0, ini = de, sep = "";
    const cortes = [...s.slice(de).matchAll(RX_SEP_VEICULO_G)].map((m) => [de + m.index, de + m.index + m[0].length]).concat([[t.length, t.length]]);
    for (const [a, b] of cortes) {
      const x = t.slice(de, a).trim(), virgula = sep.includes(",");
      const novo = !out.length || modeloNoInicio(x.replace(rxMarcaIni(), ""), modelos) || veiculoComAno(x, virgula) || (virgula && nomeSolto(x))
        || (carroceria(x) && faixasDoTexto(x).length) || marcaDe(x);
      if (x && !novo) out[out.length - 1] = t.slice(ini, a).trim();
      else if (x) { out.push(x); out.seps.push(sep); ini = de; }
      sep = t.slice(a, b);
      de = b;
    }
    return out;
  }
  // a cilindrada colada ("1.6mpi") e as duas válvulas ("1.6 8V/16V": "1.6 8V / 1.6 16V")
  const prepCil = (x) => x.replace(/(\d[.,]\d)(?=[A-Za-z]{2})/g, "$1 ").replace(/(\d[.,]\d)\s*(\d{1,2})\s?V\s*\/\s*(\d{1,2})\s?V\b/gi, "$1 $2V / $1 $3V");
  // o texto sem o ano ("01-2020" é mês-ano), sem o "em diante" e sem os parênteses vazios; "mais": outros sinais a tirar
  const tirarAno = (x, mais = "") => x.replace(RX_MES_ANO_HIFEN, "$1/$2").replace(/\b(?:ap[oó]s|a partir de|desde)\b/gi, " ").replace(RX_FAIXA_APL, " ").replace(new RegExp("[>→»" + mais + "]|\\bem diante\\b", "gi"), " ")
    .replace(/\(\s*\)/g, " ").replace(/\s+/g, " ");
  const semPontas = (x) => x.replace(/^[\s,;:/·–—.-]+|[\s,;:/·–—.-]+$/g, "");
  // a Versão é o que sobra do nome sem a cilindrada e o ano ("Saveiro .0/1.6/1.8/2.0 Mi 1997>" fica "Mi"; "c/ ABS" fica)
  const limparVersao = (x) => semPontas(tirarAno(prepCil(x).replace(RX_CIL, " "), "+").replace(/(?:^|[\s/])[.,]\d\b/g, " ").replace(/\/(?:\s*\/)+/g, "/").replace(/\s+/g, " "));
  const semAno = (d) => semPontas(tirarAno(d));
  // a célula Ano com mais faixas (o ano que estava no detalhe ou no pedaço só de ano)
  const comAnos = (cel, fx) => fmtFaixas(faixasDaCelula(cel).map(faixaDaCelula).filter(Boolean).concat(fx));
  // o detalhe vai para a Versão da linha, depois de " · "; o "DETALHE: …" do texto nunca entra (fica na "Aplicação
  // completa" da ficha)
  const versaoSemDetalhe = (v) => String(v || "").replace(/(?:[·|]\s*)?\bDETALHE\s*:.*$/i, "");
  const comDetalhe = (r, d) => { d = versaoSemDetalhe(d).trim(); if (d) r[3] = r[3] ? r[3] + " · " + d : d; };
  // lado e posição, que a ficha já mostra (MC-0040): saem da Versão quando o produto tem Lado ou Posição
  const RX_LADO_POSICAO = /\b(?:ambos\s+os\s+lados|lado\s+roda|lados?|roda\s+(?:diant\.?|dianteira|tras\.?|traseira)|dir(?:eit[oa])?\.?|esq(?:uerd[oa])?\.?|diant(?:eir[oa])?\.?|tras(?:eir[oa])?\.?|inferior|superior)(?![\wÀ-ÿ])/gi;
  // A restrição do texto nunca some da tela (T-0033, revisão do PR): "exc. …", "exceto …", "não aplica …", "somente …"
  // e "apenas …" vão até o fim do trecho (" · ", ";", "|", ")" ou ",") e ficam inteiros na Versão; o que está depois de
  // "exc."/"não aplica" (RX_NEGA) não dá cilindrada nem modelo à linha ("Não aplica no Focus 1.6" não põe 1.6 no
  // Focus). "s/ ABS", "sem ar" e "após chassi 10310" (RX_CONDICAO) ficam na Versão comum e, quando ela sai, sozinhos;
  // o "sem"/"s/" leva as palavras seguidas ("SEM POLIA ELETROMAGNETICA E AC", "s/ Barra Estab.", "Sem Rolamento Aro 15")
  // até a cilindrada, o número, o " - ", o "/", o fim do trecho ou o FIM_CONDICAO ("S/SC/SCV" é versão).
  const NEGA = String.raw`n[ãa]o\s+(?:se\s+)?(?:aplica|serve)|exc\.|exceto|excluindo`;
  const fimRestr = String.raw`(?![\wÀ-ÿ])[^·;|),]*`;
  const RX_NEGA_INI = new RegExp(String.raw`^(?:${NEGA})\s*`, "i");
  const RX_NEGA = new RegExp(String.raw`(?<![\wÀ-ÿ])(?:${NEGA})${fimRestr}`, "gi");
  const RX_RESTR = new RegExp(String.raw`(?<![\wÀ-ÿ])(?:${NEGA}|somente|apenas)${fimRestr}`, "gi");
  // o "sem …" para antes de outra condição ("Sem ABS Sem Rolamento" são duas) e do combustível ("Sem ABS Gasolina")
  const FIM_CONDICAO = String.raw`(?:sem|com|exc\.|exceto|somente|apenas|gasolina|diesel|flex|[áa]lcool|gnv)(?![\wÀ-ÿ])`;
  const RX_CONDICAO = new RegExp(String.raw`(?<![\wÀ-ÿ])(?:(?:ap[oó]s|at[ée]|desde|a\s+partir\s+d[oa])\s+chassis?\s+[\w.]+|chassis?\s+(?:longo|curto)|(?:s\/\s|sem\s)\s*[\wÀ-ÿ]+(?:\/[\wÀ-ÿ]+)?(?:\s+(?:aro\s+\d+(?!\d)|(?!${FIM_CONDICAO})(?=([A-Za-zÀ-ÿ][\wÀ-ÿ.]*))\1(?!\/)))*)`, "gi");
  // o texto da aplicação sem o "DETALHE: …" (texto de venda, não é restrição), compactado
  const aplSemDetalhe = (p) => String(p.a || "").replace(/\bDETALHE\s*:[^|;]*/gi, " ");
  const SEM_DETALHE = new WeakMap();
  const textoRestr = (p) => SEM_DETALHE.get(p) || SEM_DETALHE.set(p, compacto(aplSemDetalhe(p))).get(p);
  // [o texto sem as restrições, as restrições]; comRestr: f no texto sem elas, que voltam no fim, inteiras, depois de " · "
  const partirRestr = (x, p) => { const rs = []; return [x.replace(RX_RESTR, (m) => (textoRestr(p).includes(compacto(m)) ? (rs.push(m.trim()), " ") : m)), rs]; };
  const comRestr = (x, f, p) => { const [resto, rs] = partirRestr(x, p); return [f(resto), ...rs].filter(Boolean).join(" · "); };
  const siglas = (x) => x.replace(/\b(?:mpi|spi|tdi|tsi|gti|gli|abs)\b/gi, (w) => w.toUpperCase());
  // a restrição como a tela mostra: sem parênteses e, quando a ficha tem Lado ou Posição, sem o lado do fim ("Exceto Si -
  // Dianteiro - Dir" fica "Exceto Si"); a palavra logo depois do "exc." fica sempre
  const limparRestr = (x, p) => {
    const ps = semPontas(x.replace(/[()]/g, " ").replace(/\s+/g, " ").trim()).split(/(\s+[-–]\s+|\s*\/\s*|\s+)/);
    while ((p.la || p.po) && ps.length > 3 && !ps[ps.length - 1].replace(RX_LADO_POSICAO, "").trim()) ps.splice(-2);
    return siglas(semPontas(ps.join("").replace(/\s+(?:e|ou)$/i, ""))); // "s/ ABS ou c/ ABS": sem o "ou" do fim
  };
  // A Versão na tela (U3, MC-0036, R1/MC-0038): sem "DETALHE: …", sem "todos"/"todas" sozinho, sem parênteses, sem
  // pontuação solta ou no fim, com as siglas em maiúsculas ("mpi" é MPI); sem lado e posição quando a ficha os tem;
  // o resto sai quando cita outro modelo do catálogo, passa de 60 letras ou é a aplicação inteira (aí ficam só o
  // "s/ …"/"sem …"); a restrição (RX_RESTR) fica sempre
  function versaoTela(v, r, p) {
    const x0 = versaoSemDetalhe(v);
    // o "sem …" como está no texto: a Versão já perdeu a cilindrada e o ano, então fica o começo que o texto tem
    const noTexto = (c) => { const ws = c.split(/\s+/), tem = () => textoRestr(p).includes(compacto(ws.join(" "))); while (ws.length > 2 && !tem()) ws.pop(); return tem() ? ws.join(" ") : ""; };
    const conds = (x) => (x.match(RX_CONDICAO) || []).map(noTexto).filter(Boolean).map((c) => limparRestr(c, p)).join(" · ");
    const [resto, rs] = partirRestr(x0, p);
    const ps = [versaoLivre(resto, r, p) || conds(resto), ...rs.map((m) => limparRestr(m, p))].join(" · ").split(" · ").filter(Boolean); // sem repetir o pedaço ("V50 · V50")
    return [...new Map(ps.map((x) => [compacto(x), x])).values()].join(" · ");
  }
  function versaoLivre(v, r, p) {
    // a cilindrada já tem a coluna dela: sai da Versão ("1.6 16V Torque" fica "Torque")
    let x = v.replace(/[()]/g, " ").replace(/(?<![\d.])\d[.,]\d(?:\s*L\b)?(?:\s*\d{1,2}\s?V\b)?/gi, " ");
    if (p.la || p.po) x = x.replace(RX_LADO_POSICAO, " ");
    x = semPontas(x.replace(/(^|\s)[!?.,;:]+(?=\s|$)/g, " ").replace(/(?:\s*[\/·–-]\s*){2,}/g, " / ").replace(/\s+/g, " ").trim());
    if (/^(?:tod[oa]s(?:\s+os\s+modelos)?|e|ou)$/i.test(x) || x.length > 60 || compacto(x) === compacto(p.a)) return "";
    // outro modelo: pelo nome ("Grand Siena") ou só de número ("605", "Alfa 145"), menos as versões do próprio
    // modelo no "ve" ("Cargo 1218")
    const ws = norm(x).split(/[^A-Z0-9]+/).filter(Boolean), proprio = compacto(r[1]), { porCompacto, numericos } = indiceVe();
    const versoes = new Set((p.ve || []).filter((y) => compacto(y[1]) === proprio && y[2]).map((y) => compacto(y[2])));
    if (/^[\d\s/·–-]+$/.test(x) && !versoes.has(compacto(x))) return ""; // só número, fora das versões do "ve" ("605")
    for (let i = 0; i < ws.length; i++) for (let n = 1; n <= 3 && i + n <= ws.length; n++) {
      const c = ws.slice(i, i + n).join("");
      if (c.length >= 3 && c !== proprio && !versoes.has(c) && !TECNICO.has(c) && !carroceria(c) && (porCompacto.has(c) || numericos.has(c))) return "";
    }
    return siglas(x);
  }
  function juntarNaTabela(p, tab) {
    const k = chaveApl, cils = (c) => String(c || "").split(" / ").filter(Boolean);
    const locais = [...new Map(tab.map((r) => [k(r[1]) + "|" + marcaDe(r[0]), [r[1], marcaDe(r[0])]])).values()];
    const marcasTab = [...new Set(tab.map((r) => marcaDe(r[0])))];
    const cheia = new Set(); // as linhas que já receberam dado (cada uma recebe uma vez)
    // a linha r recebe o dado da nova n: mesma marca e modelo; em cilindrada, versão e ano, r vazia, igual ou (cilindrada) contida
    const cabe = (r, n) => k(r[0]) === k(n[0]) && k(r[1]) === k(n[1]) && [2, 3, 4].every((c) => !r[c] || k(r[c]) === k(n[c]) || (c === 2 && cils(r[2]).every((x) => cils(n[2]).includes(x))));
    // põe a linha n (ou o dado dela na linha que cabe) e devolve a linha da tabela; a nova fica depois da última do
    // mesmo modelo (ou da mesma marca), e sem as duas, no fim
    function poeLinha(n) {
      const r = tab.find((x) => x.every((c, j) => k(c) === k(n[j]))) || tab.find((x) => !cheia.has(x) && cabe(x, n));
      if (r) { [2, 3, 4].forEach((c) => { if (n[c]) r[c] = n[c]; }); cheia.add(r); return r; }
      let ix = -1;
      tab.forEach((x, j) => { if (k(x[1]) === k(n[1]) && k(x[0]) === k(n[0])) ix = j; });
      if (ix < 0) tab.forEach((x, j) => { if (k(x[0]) === k(n[0])) ix = j; });
      tab.splice(ix < 0 ? tab.length : ix + 1, 0, n);
      cheia.add(n);
      return n;
    }
    // os modelos do começo do texto: a lista colada ("Santana/Quantum"), "L 111" (o modelo 111 do "ve", não a Versão
    // do "L"), a carroceria (o modelo de antes) e o modelo fora do catálogo, só com a marca ("Cross UP!" é Up)
    function modelosDoVeiculo(resto, vm, modelos, antes) {
      const mods = [];
      for (let m = modeloNoInicio(resto, modelos); m; m = modeloNoInicio(resto, modelos)) {
        mods.push([m[0], m[2] || vm]); // o modelo do catálogo fica com a marca dele
        resto = resto.slice(m[1]);
        if (!/^\s*\/\s*/.test(resto)) break;
        resto = resto.replace(/^\s*\/\s*/, "");
      }
      if (mods.length === 1 && norm(mods[0][0]).length === 1) {
        const t2 = /^\s+(\S+)/.exec(resto), m3 = t2 && locais.find(([m]) => norm(m).length >= 2 && k(m) === k(t2[1]));
        if (m3) { resto = " " + mods[0][0] + resto.slice(t2[0].length); mods[0] = [m3[0], m3[1] || mods[0][1]]; }
      }
      if (!mods.length && carroceria(resto) && antes) mods.push([antes[1], marcaDe(antes[0])]);
      else if (!mods.length && vm && (veiculoComAno(resto, true) || nomeSolto(resto.trim()))) {
        const nome = nomeFora(resto.trim()), w = /^(\S+)\s+/.exec(resto.trim()), m2 = w && modeloNoInicio(resto.trim().slice(w[0].length), modelos);
        if (m2) { mods.push([m2[0], vm || m2[2]]); resto = w[1] + " " + resto.trim().slice(w[0].length + m2[1]); }
        else if (nome) { mods.push([nome, vm]); resto = resto.trim().slice(nome.length); }
      }
      return { mods, resto };
    }
    for (const bloco of String(p.a || "").split(BLOCO_APL)) {
      // a marca do começo do bloco: uma montadora (vmBloco), várias ("Fiat / Alfa Romeo": cada modelo com a dele) ou
      // nenhuma conhecida (o modelo fora do catálogo não entra)
      const mb = RX_MARCA_BLOCO.exec(norm(bloco)), vmsBloco = mb ? marcasDoTexto(mb[0].replace(/\s-\s$/, "")) : [];
      const vmBloco = vmsBloco.length === 1 ? vmsBloco[0] : "", vmSem = !mb && marcasTab.length === 1 ? marcasTab[0] : "";
      const modelos = locais.concat(...(vmsBloco.length ? vmsBloco : marcasTab).map((vm) => modelosDaMarca(vm).map((m) => [m, vm]))).sort((a, b) => b[0].length - a[0].length);
      let ultimas = null; // as linhas do veículo de antes (o dono do detalhe e do ano solto); nunca passam de um bloco para outro
      let vmAqui = ""; // a marca citada sozinha no meio do bloco ("PEUGEOT - 106 · 206 · Citroën · C3") vale para o que vem depois
      let grupo = []; // as linhas dos veículos sem ano unidos por "/" ao de agora (dividemAno)
      let fechado = false; // o grupo terminou num veículo que não é só o nome ("Voyage G5"): só o ano do trecho dele vale
      for (const l of linhasAplic(bloco)) {
        const coberta = linhaCoberta(l, tab);
        // a linha coberta e com ano: o pedaço só de ano do começo ainda fecha o grupo de antes; a sem ano passa
        // veículo por veículo (pode abrir um grupo com "/" que ganha o ano depois)
        if (coberta && faixasDoTexto(l).length) {
          const p0 = veiculosDaLinha(l, modelos)[0];
          if (grupo.length && p0 && SO_ANO.test(p0.trim())) grupo.forEach((r) => { r[4] = comAnos(r[4], faixasDoTexto(p0)); });
          ultimas = coberta; grupo = []; fechado = false; continue;
        }
        // o ";" colado e a quebra de linha também separam
        const pecas = l.split(/\s*;\s*|\n/).flatMap((x, j) => {
          const vs = veiculosDaLinha(x, modelos), lista = vs.seps.some((sp) => sp.includes(","));
          return vs.map((y, i) => ({ v: y, sep: i ? vs.seps[i] : j ? ";" : "·", lista }));
        });
        for (const { v, sep, lista } of pecas) {
          // o grupo continua no "/" e no pedaço só de ano da linha seguinte ("Gol / Saveiro / Voyage G5 · (2008>)")
          if (!dividemAno(sep) && !(sep === "·" && SO_ANO.test(v.trim()))) { grupo = []; fechado = false; }
          const tipo = umVeiculo(v, lista);
          const fxV = faixasDoTexto(v);
          // como na rede de segurança: o veículo com ano dá o ano aos do grupo; o que é só o nome do modelo entra no grupo
          // ("Gol / Saveiro 1980–2009"); o que tem mais que o nome também entra, mas fecha o grupo: só o ano do trecho
          // dele vale ("Gol / Saveiro / Voyage G5 · (2008>)" dá 2008+ aos três; "Idea Adventure / Palio 2000–2018" não dá
          // o ano do Palio ao Idea)
          const soNome = ultimas && ultimas.some((r) => compacto(v.replace(rxMarcaIni(), "")) === compacto(r[1]));
          if (tipo === "marca" || tipo === "outro") { grupo = []; fechado = false; }
          else if (fxV.length) { if (!fechado || SO_ANO.test(v.trim())) grupo.forEach((r) => { r[4] = comAnos(r[4], fxV); }); grupo = []; fechado = false; }
          else if (ultimas) { if (fechado) grupo = []; grupo.push(...ultimas); fechado = !soNome; }
        }
      }
      // um veículo do texto: devolve "marca" (a marca sozinha), "outro" (detalhe que cita outro modelo) ou ""
      function umVeiculo(v, lista) {
        const cob = linhaCoberta(v, tab);
        if (cob) { ultimas = cob; return ""; }
        if (marcaDe(v)) { vmAqui = marcaDe(v); return "marca"; }
        const mi0 = rxMarcaIni().exec(v), vmi = mi0 ? marcaDe(mi0[1]) : "", mi = vmi ? mi0 : null, vm = vmi || vmAqui || vmBloco || vmSem;
        const { mods, resto } = modelosDoVeiculo((mi ? v.slice(mi[0].length) : v), vm, modelos, ultimas && ultimas[ultimas.length - 1]);
        // sem modelo: detalhe do veículo de antes (B11, T-0018: "Motores 1.0 / 1.3", "Dianteiro - Esq"). Com ano, o pedaço
        // só de ano ("Palio 1.8R · 11/2005–12/2010") e o detalhe que não cita outro modelo dão o ano à coluna Ano do
        // veículo de antes; o ano não fica na Versão. Sem veículo antes no bloco ("Caminhões: 1318 (1996–2012) …"), o
        // texto não vai para linha nenhuma (fica na "Aplicação completa")
        if (!mods.length) {
          if (!ultimas || !ultimas.length) return "";
          const donos = ultimas, fx = faixasDoTexto(v);
          const outro = donos.some((r) => modelos.some(([m]) => compacto(m).length >= 2 && k(m) !== k(r[1]) && rxPalavra(k(m)).test(k(v))));
          if (fx.length && !outro) donos.forEach((r) => { r[4] = comAnos(r[4], fx); const d = comRestr(v.trim(), semAno, p); if (d) comDetalhe(r, d); });
          else donos.forEach((r) => comDetalhe(r, v.trim()));
          return outro ? "outro" : "";
        }
        // na lista com vírgula, o qualificador com " - " ("Uno, Palio, …, 145/146 - 1984 a 2014 - … (Fiasa / Fire) - Roda
        // Dianteira") vale para a lista toda: não fica só num modelo (R1/MC-0038; o texto continua na "Aplicação
        // completa"); o "(s/ ABS)" do Doblò fica nele
        const ver = comRestr(resto.split("|")[0], (x) => { const y = limparVersao(x); return lista && /\s-\s/.test(y) ? "" : y; }, p);
        const cil = [...new Set(cilDe(prepCil(resto.replace(RX_NEGA, " "))))].join(" / "), ano = fmtFaixas(faixasDoTexto(resto));
        ultimas = [];
        for (const [mod, vmm] of mods) {
          const dono = tab.find((r) => k(r[1]) === k(mod) && (!vmm || marcaDe(r[0]) === vmm));
          const n = [dono ? dono[0] : vmm ? marcaTela(vmm) : "", dono ? dono[1] : mod, cil, ver, ano];
          ultimas.push(dono && !n[2] && !n[3] && !n[4] ? dono : poeLinha(n)); // só o nome de um modelo que a tabela já tem: a linha dele
        }
        return "";
      }
    }
    return arrumar(p, tab);
  }
  // O fim da tabela: o "an" da base vale primeiro (toda linha com ele); a Versão da tela (versaoTela); sai a linha
  // idêntica a uma de antes (TER55228) e a do mesmo modelo e versão cuja faixa está dentro da de outra, com a mesma
  // cilindrada ou sem ela (R2 UX: a cópia sem ano sai; ROL0015E); as linhas do mesmo modelo juntas, dentro da marca,
  // na ordem em que a marca e o modelo aparecem (U2)
  const NAO_SERVE = "Não serve"; // a Versão do modelo excluído (arrumar) e a lista do celular (tabelaVeiculos)
  function arrumar(p, tab) {
    const k = chaveApl, base = anoDaBase(p), fx = (r) => faixasDaCelula(r[4]).map(faixaDaCelula).filter(Boolean);
    // a linha que antes ficava sem Versão e agora só tem a restrição (T-0033) não vira veículo novo: a Versão dela vai
    // para a linha do mesmo modelo, sem Versão, que a contém (como a cópia que saía antes)
    const soRestr = new Set();
    for (const r of tab) {
      if (base) r[4] = base;
      const antes = versaoLivre(versaoSemDetalhe(r[3]), r, p);
      r[3] = versaoTela(r[3], r, p);
      if (r[3] && !antes) soRestr.add(r);
    }
    // o modelo do "ve" que o texto só cita dentro do "exc. …"/"não aplica …" ("exc. HB20 X", "exc. Stepway"): a linha
    // fica (a busca acha o produto por ele), mas a Versão diz que não serve, com a restrição do texto
    const t = aplSemDetalhe(p), negas = [...t.matchAll(RX_NEGA)].map((m) => m[0]), fora = t.replace(RX_NEGA, " ");
    const cita = (m, x) => rxPalavra(norm(m)).test(norm(x)) || rxPalavra(compacto(m)).test(compacto(x)); // "HB20X" e "HB20 X"
    for (const r of tab) {
      const nega = r[1] && !cita(r[1], fora) && negas.find((x) => cita(r[1], x));
      // só "Não serve" quando a restrição só repete o modelo da linha ("exc. HB20 X" na linha do HB20X)
      const resto = nega && limparRestr(nega, p).replace(RX_NEGA_INI, "");
      if (nega) { r[3] = compacto(resto) === compacto(r[1]) ? NAO_SERVE : `${NAO_SERVE} (${limparRestr(nega, p)})`; soRestr.delete(r); }
    }
    // mesma marca e modelo, e a cilindrada de r vazia ou igual; toda faixa de r dentro de uma de o
    const mesmo = (r, o) => k(r[0]) === k(o[0]) && k(r[1]) === k(o[1]) && (!r[2] || k(r[2]) === k(o[2]));
    const faixaDentro = (r, o) => fx(r).every(([a, b]) => fx(o).some(([c, d]) => c <= a && b <= d));
    const dentro = (r, o) => mesmo(r, o) && (!r[4] || (!!o[4] && faixaDentro(r, o)));
    for (const r of soRestr) {
      const o = tab.find((x) => x !== r && !x[3] && !soRestr.has(x) && dentro(r, x));
      if (o) { o[3] = r[3]; r[3] = null; }
    }
    tab = tab.filter((r) => r[3] !== null);
    tab = tab.filter((r, i) => !tab.slice(0, i).some((x) => x.every((c, j) => k(c) === k(r[j]))));
    const contida = (r, o) => r !== o && mesmo(r, o) && k(r[3]) === k(o[3]) && !!o[4] && (!r[4] || faixaDentro(r, o));
    tab = tab.filter((r, i) => !tab.some((o, j) => j !== i && contida(r, o) && !(contida(o, r) && j > i)));
    const ordem = new Map();
    tab.forEach((r, i) => { for (const c of [k(r[0]), k(r[0]) + "|" + k(r[1])]) if (!ordem.has(c)) ordem.set(c, i); });
    const chave = (r) => [ordem.get(k(r[0])), ordem.get(k(r[0]) + "|" + k(r[1]))];
    return tab.map((r, i) => [r, i]).sort(([a, i], [b, j]) => chave(a)[0] - chave(b)[0] || chave(a)[1] - chave(b)[1] || i - j).map(([r]) => r);
  }
  // a tabela de cada produto (as linhas do "ve" e as que vinham do bloco), feita uma vez: a tela e a busca com ano
  const TABELA = new Map();
  // a restrição do texto (RX_RESTR, RX_CONDICAO; sem o "DETALHE: …") que a tabela não mostra: vai numa linha abaixo dela
  const restricoesFora = (p, tab) => {
    const t = aplSemDetalhe(p), naTab = compacto(tab.map((r) => r.join(" ")).join(" "));
    const rs = [...t.matchAll(RX_RESTR), ...t.matchAll(RX_CONDICAO)].map((m) => limparRestr(m[0], p));
    return [...new Set(rs.filter((x) => x && !naTab.includes(compacto(x))))];
  };
  const tabelaDe = (p) => { if (!TABELA.has(p)) { const tv = linhasVeiculos(p); TABELA.set(p, tv.length && p.a ? juntarNaTabela(p, tv) : tv); } return TABELA.get(p); };
  // Conteúdo do produto (T-0014), igual na página e na janela. Na janela os títulos descem um nível
  // (h2 e h3), porque a lista por trás já tem o h1. A ficha de impressão (A4) sai deste mesmo conteúdo.
  function produtoHtml(p, naJanela) {
    const H = naJanela ? "h2" : "h1", H2 = naJanela ? "h3" : "h2", H3 = naJanela ? "h4" : "h3";
    const linhas = linhasAplic(p.a);
    const aplicacoes = linhas.length > 1 && (p.a || "").length > 160 ? ulAplic(linhas) : `<p>${anoMaisHtml(p.a)}</p>`;
    const refs = (p.r || []).filter((x) => x.c);
    const ficha = [];
    if (p.po) ficha.push(["Posição", titulo(p.po)]);
    if (p.la) ficha.push(["Lado", titulo(p.la)]);
    if (p.de) ficha.push(["Detalhe", p.de]);
    (p.x || []).forEach(([k, v]) => ficha.push([ROTULO_FICHA.get(normCod(k)) || k, v]));
    const junto = servemNoVeiculo(doSistema(listaCodigos(p.oj), p), VEI_LEVE, p);
    const link = location.origin + location.pathname + "#/produto/" + encodeURIComponent(p.c);
    // com o campo "ve": a aplicação vira tabela (R-20261120-130900), com o que o texto tem a mais (T-0033: juntarNaTabela);
    // no PDF, o texto inteiro vai embaixo da tabela, em letra pequena ("Aplicação completa"), para as restrições ("exc. Si")
    // não sumirem do material do cliente
    const tab = tabelaVeiculos(tabelaDe(p)), fora = tab ? restricoesFora(p, tabelaDe(p)) : [];
    const miolo = tab
      ? tab + (fora.length ? `<p class="restr-fora"><b>${fora.length > 1 ? "Restrições" : "Restrição"} da aplicação:</b> ${esc(fora.join(" · "))}</p>` : "") + (p.a ? `<div class="so-impressao"><${H3} class="secao-tit">Aplicação completa</${H3}><div class="aviso">${aplicacoes}</div></div>` : "")
      : p.a ? aplicacoes : "";
    const secApl = miolo ? `<section class="secao"><${H2} class="secao-tit">Aplicação</${H2}>${miolo}<div class="aviso">Confira sempre a aplicação no veículo antes da compra.</div></section>` : "";
    const secRefs = refs.length ? `<section class="secao"><${H2} class="secao-tit">Referências cruzadas</${H2}><table class="t"><tbody>${refs.map((x) => `<tr><th>${esc(x.m || "Referência")}</th><td class="c">${esc(x.c)}</td></tr>`).join("")}</tbody></table></section>` : "";
    const secFicha = ficha.length ? `<section class="secao"><${H2} class="secao-tit">Ficha técnica</${H2}><table class="t"><tbody>${ficha.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</tbody></table></section>` : "";
    const dados = secApl && (secRefs || secFicha)
      ? `<div class="prod-dados"><div class="col-apl">${secApl}</div><div class="col-tab">${secRefs}${secFicha}</div></div>`
      : `<div class="prod-dados um"><div class="col-apl">${secApl}</div><div class="col-tab">${secRefs}${secFicha}</div></div>`;
    return `<div class="so-impressao cab-pdf"><img src="assets/logo_branco.png" alt="bap componentes de qualidade"><span>Ficha do produto · Catálogo BAP</span></div>
      <div class="prod">
        <div class="prod-foto-box"><div class="prod-foto">${fotoZoomHtml(p, true)}</div></div>
        <div class="prod-info">
          <div class="prod-cab">
            <${H} id="${naJanela ? "janela-tit" : "produto-tit"}">${esc(p.c)}</${H}>
            <div class="desc">${anoMaisHtml(p.d)}</div>
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
    const porClique = CLICOU_CARTAO || CLICOU_LEVE;
    CLICOU_CARTAO = CLICOU_LEVE = false;
    // veículo do "Leve também" (servemNoVeiculo): na janela, o da lista por baixo; na página, só pelo clique (o da busca
    // ou o do produto de onde veio); fora do produto, nenhum
    VEI_LEVE = !ehProduto ? null : (JANELA || listaNaTela) && ESTADO_LISTA ? veiculoDoHash(ESTADO_LISTA.hash)
      : !porClique ? null : String(ROTA_ATUAL).startsWith("#/busca") ? veiculoDoHash(ROTA_ATUAL) : VEI_LEVE;
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
  let CLICOU_CARTAO = false, LINK_CARTAO = null, CLICOU_LEVE = false; // CLICOU_LEVE: um item do "Leve também" (VEI_LEVE)
  document.addEventListener("click", (ev) => {
    const lk = ev.target.closest('.lista .item a[href^="#/produto/"]');
    const simples = !(ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) && ev.button === 0;
    CLICOU_CARTAO = !!lk && simples;
    if (CLICOU_CARTAO) LINK_CARTAO = lk;
    CLICOU_LEVE = !!ev.target.closest('a.item-rel[href^="#/produto/"]') && simples;
    // o botão verde do rodapé (op4e) fica no conta.js, que serve também às páginas da conta e do admin (T-0022)
  });
  // a tela só é montada depois do produtos.json (~440 KB com gzip): a foto do topo do início e da Sobre começa a
  // baixar já, junto com ele, e não depois dele
  const fotoTopo = { "/": IMG_FAIXA.src, "/sobre": FOTO_SOBRE }[lerRota().caminho];
  if (fotoTopo) Object.assign(new Image(), { fetchPriority: "high", src: fotoTopo }); // o <img> da tela reaproveita a mesma
  // Desempenho (T-0033): logo depois de carregar, em segundo plano e aos poucos (para não travar a tela), o índice dos
  // "ve", a tabela da aplicação e os anos do texto de cada produto; a 1ª busca com ano já os encontra prontos
  function prepararEmSegundoPlano() {
    const ps = BASE.produtos, depois = window.requestIdleCallback || ((fn) => setTimeout(() => { const fim = Date.now() + 8; fn({ timeRemaining: () => fim - Date.now() }); }, 0));
    let i = 0;
    indiceVe();
    const passo = (prazo) => {
      while (i < ps.length && prazo.timeRemaining() > 1) {
        const p = ps[i++];
        if (Array.isArray(p.ve) && p.ve.length) { tabelaDe(p); anosNoTexto(p); } else if (p.a) anosSemVe(p);
      }
      if (i < ps.length) depois(passo);
    };
    depois(passo);
  }
  carregar().then(() => { render(); prepararEmSegundoPlano(); }).catch((e) => {
    app.innerHTML = `<div class="carregando">Não foi possível carregar o catálogo (${esc(e.message)}). Atualize a página.</div>`;
  });
})();
