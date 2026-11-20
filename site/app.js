/* Catálogo BAP online · site estático (sem servidor).
   Os dados vêm de data/produtos.json, gerado por scripts/gerar_site.py a partir da base unificada.
   Rotas: #/  ·  #/busca?q=&cod=&mo=&modelo=&ano=&si=&fa=&li=&ca=  ·  #/produto/<CODIGO>  ·  #/sobre
   Consulta por placa (API PLACAS): reservada para a próxima fase (ver docs/ROADMAP.md). */
(function () {
  "use strict";

  const POR_PAGINA = 24;
  const app = document.getElementById("app");
  let BASE = null;           // { gerado_em, total, produtos }
  let POR_COD = new Map();   // código → produto
  let INDICE = [];           // [{ p, txt, cods, apl }]
  const PALAVRAS = new Set(); // palavras (letras e números) que aparecem nas aplicações, para achar os modelos derivados
  const DERIVADOS = new Map(); // modelo → palavras derivadas (cache)

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
    for (const p of BASE.produtos) {
      POR_COD.set(normCod(p.c), p);
      const refs = (p.r || []).map((x) => (x.m || "") + " " + (x.c || "")).join(" ");
      const partes = (x) => String(x.c || "").split(/[\/;,|]| OU /i).map(normCod);
      INDICE.push({
        p,
        txt: norm([p.c, p.d, p.a, refs, p.p, p.si, p.fa, p.li, p.ca, p.de, p.df, p.mo, p.po, p.la].join(" | ")),
        apl: norm(p.a),
        cods: [normCod(p.c)].concat((p.r || []).flatMap(partes).filter((c) => c.length >= 3)),
        // referência com a marca na frente ("TRW 16900255S" → "TRW16900255S"), só para a aba Código (casa exato)
        mcods: (p.r || []).filter((x) => normCod(x.m)).flatMap((x) => partes(x).filter((c) => c.length >= 3).map((c) => normCod(x.m) + c)),
      });
      for (const w of INDICE[INDICE.length - 1].apl.match(/[A-Z0-9]+/g) || []) PALAVRAS.add(w);
    }
    const info = document.getElementById("info-base");
    if (info && BASE.gerado_em) info.textContent = fmt(BASE.total) + " produtos · base atualizada em " + BASE.gerado_em;
  }

  // ---------- busca ----------
  function anosDaAplicacao(apl) {
    const faixas = [];
    const re = /(\b(?:19|20)\d{2})\s*(?:–|-|até|a|\/)\s*((?:19|20)\d{2})\b/gi;
    let m;
    while ((m = re.exec(apl))) faixas.push([+m[1], +m[2]]);
    const re2 = /(\b(?:19|20)\d{2})\s*(?:>|em diante|\+)/gi;
    while ((m = re2.exec(apl))) faixas.push([+m[1], 2100]);
    if (!faixas.length) (apl.match(/\b(?:19|20)\d{2}\b/g) || []).forEach((a) => faixas.push([+a, +a]));
    return faixas;
  }
  function serveNoAno(p, ano) {
    if (!ano) return true;
    if (p.an && (p.an[0] || p.an[1])) return (!p.an[0] || ano >= p.an[0]) && (!p.an[1] || ano <= p.an[1]);
    const f = anosDaAplicacao(p.a || "");
    if (!f.length) return true; // sem ano na aplicação: mostra (o cliente confere)
    return f.some(([a, b]) => ano >= a && ano <= b);
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

  function buscar(pr) {
    const q = norm(pr.get("q"));
    const cod = normCod(pr.get("cod"));
    const mo = pr.get("mo") || "";
    const moN = norm(mo);
    const modelo = norm(pr.get("modelo"));
    const ano = parseInt(pr.get("ano"), 10) || 0;
    const filtros = { si: pr.get("si"), fa: pr.get("fa"), li: pr.get("li"), ca: pr.get("ca") };
    const termos = q ? q.split(" ").filter(Boolean) : [];
    // modelo por palavra inteira: "GOL" não casa com "GOLF" (letra depois de letra), mas "1.6" casa com "1.6L"
    // e "HB20" com "HB20X" (a palavra só não pode continuar com o mesmo tipo de caractere: letra ou número)
    const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const classe = (c) => (/[A-Z]/.test(c) ? "A-Z" : /[0-9]/.test(c) ? "0-9" : "");
    // com hífen, as partes ficam vizinhas: "T-CROSS" casa com "T-CROSS", "T CROSS" e "TCROSS"
    const palavra = (t) => {
      const a = classe(t[0]), b = classe(t[t.length - 1]);
      const corpo = t.split("-").filter(Boolean).map(reEsc).join("[\\s-]?") || reEsc(t);
      return new RegExp((a ? "(^|[^" + a + "])" : "") + corpo + (b ? "(?![" + b + "])" : ""));
    };
    const alternativas = (t) => [t].concat(derivados(t)).map(palavra);
    // modelo de várias palavras também casa com as palavras juntas e vizinhas: "SPACE FOX" casa com "SPACEFOX".
    // Cada modo é um jeito de juntar palavras vizinhas; o produto entra se algum modo casar inteiro.
    // Palavra de 1 caractere não vale solta: "L-200" e "L 200" só casam com "L200", "L 200" ou "L-200", e não com um
    // L qualquer da aplicação mais um 200 em outro lugar.
    const palavrasMod = modelo ? modelo.split(/[\s-]+/).filter(Boolean) : []; // hífen digitado = espaço
    const modosMod = [];
    const nMod = palavrasMod.length;
    for (let mask = 0; nMod && mask < (nMod > 6 ? 1 : 1 << (nMod - 1)); mask++) {
      const pedacos = [palavrasMod[0]];
      for (let i = 1; i < nMod; i++) {
        if (mask & (1 << (i - 1))) pedacos[pedacos.length - 1] += "-" + palavrasMod[i];
        else pedacos.push(palavrasMod[i]);
      }
      if (nMod > 1 && pedacos.some((x) => x.replace(/-/g, "").length < 2)) continue;
      modosMod.push(pedacos.map(alternativas));
    }
    if (nMod && !modosMod.length) modosMod.push(palavrasMod.map(alternativas)); // nunca fica sem filtro de modelo
    const out = [];
    for (const e of INDICE) {
      const p = e.p;
      let nota = 0;
      if (cod) {
        if (e.cods[0] === cod) nota = 1000;
        else if (e.cods.includes(cod)) nota = 800;
        else if (e.mcods.includes(cod)) nota = 800;
        else if (e.cods[0].startsWith(cod)) nota = 600;
        else if (e.cods.some((c) => c.includes(cod))) nota = 400;
        else continue;
      }
      if (termos.length) {
        const qc = normCod(q);
        if (qc.length >= 3 && e.cods.includes(qc)) nota += 900;
        else if (termos.every((t) => e.txt.includes(t))) {
          nota += 100;
          if (norm(p.d).includes(termos[0])) nota += 30;
          if (norm(p.p).includes(termos[0])) nota += 20;
        } else if (qc.length >= 4 && e.cods.some((c) => c.includes(qc))) nota += 300;
        else continue;
      }
      if (moN) {
        const m = norm(p.mo);
        if (!(m === moN || m.split("/").includes(moN) || e.apl.includes(moN))) continue;
      }
      if (modosMod.length && !modosMod.some((modo) => modo.every((alt) => alt.some((rx) => rx.test(e.apl))))) continue;
      if (ano && !serveNoAno(p, ano)) continue;
      if (filtros.si && p.si !== filtros.si) continue;
      if (filtros.fa && p.fa !== filtros.fa) continue;
      if (filtros.li && p.li !== filtros.li) continue;
      if (filtros.ca && p.ca !== filtros.ca) continue;
      if (p.i) nota += 5; // com foto primeiro, no empate
      out.push([nota, p]);
    }
    out.sort((a, b) => b[0] - a[0] || a[1].c.localeCompare(b[1].c));
    return out.map((x) => x[1]);
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

  function montarBusca(container, pr, abaInicial) {
    const tpl = document.getElementById("tpl-busca").content.cloneNode(true);
    container.appendChild(tpl);
    const cartao = container.querySelector(".cartao-busca");
    const form = cartao.querySelector("form");
    // montadoras (as que mais aparecem) e sistemas
    const selMo = form.elements.mo;
    const montadoras = contar(BASE.produtos, "mo").filter(([m, n]) => n >= 3 && !m.includes("/")).map(([m]) => m).sort();
    selMo.insertAdjacentHTML("beforeend", montadoras.map((m) => `<option value="${esc(m)}">${esc(titulo(m))}</option>`).join(""));
    const selSi = form.elements.si;
    selSi.insertAdjacentHTML("beforeend", contar(BASE.produtos, "si").map(([s]) => `<option value="${esc(s)}">${esc(titulo(s))}</option>`).join(""));
    let aba = abaInicial || "geral";
    const mostrar = (a) => {
      aba = a;
      cartao.querySelectorAll(".abas button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === a)));
      cartao.querySelectorAll(".campos").forEach((c) => (c.hidden = c.dataset.campos !== a));
    };
    cartao.querySelectorAll(".abas button").forEach((b) => b.addEventListener("click", () => { mostrar(b.dataset.aba); const i = form.querySelector(`[data-campos="${b.dataset.aba}"] input, [data-campos="${b.dataset.aba}"] select`); i && i.focus(); }));
    if (pr) {
      ["q", "cod", "modelo", "ano"].forEach((k) => pr.get(k) && (form.elements[k].value = pr.get(k)));
      if (pr.get("mo")) selMo.value = pr.get("mo");
      if (pr.get("si")) selSi.value = pr.get("si");
      if (!abaInicial) mostrar(pr.get("cod") ? "codigo" : (pr.get("mo") || pr.get("modelo") || pr.get("ano")) ? "veiculo" : "geral");
    }
    mostrar(aba);
    form.addEventListener("reset", () => setTimeout(() => { if (lerRota().caminho === "/busca") irPara("/busca"); }, 0));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const f = form.elements;
      if (aba === "geral") irPara("/busca", { q: f.q.value.trim() });
      else if (aba === "codigo") irPara("/busca", { cod: f.cod.value.trim() });
      else irPara("/busca", { mo: f.mo.value, modelo: f.modelo.value.trim(), ano: f.ano.value, si: f.si.value });
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
    if (pr.get("q")) desc.push(`“${pr.get("q")}”`);
    if (pr.get("cod")) desc.push(`código ${pr.get("cod")}`);
    if (pr.get("mo")) desc.push(titulo(pr.get("mo")));
    if (pr.get("modelo")) desc.push(pr.get("modelo"));
    if (pr.get("ano")) desc.push(pr.get("ano"));
    app.innerHTML = `<div class="pagina-busca"><div id="busca-topo"></div>
      <div class="res-topo"><h1>${desc.length ? "Resultados para " + esc(desc.join(" · ")) : "Todos os produtos"}</h1>
        <span class="total">${fmt(todos.length)} produto${todos.length === 1 ? "" : "s"}</span>
        <button class="bt bt-claro bt-mini bt-filtros" type="button" aria-expanded="false">Filtrar</button></div>
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
      return `<details ${k === "si" || k === "fa" || pr.get(k) ? "open" : ""}><summary>${ROT[k]}</summary>${op.map(([v, n]) =>
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
      lista.outerHTML = `<div class="vazio"><b>Nenhum produto encontrado</b>Confira o código ou tente menos palavras. Na busca por veículo, deixe o ano em branco para ver todas as versões.</div>`;
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
    else if (caminho === "/busca") telaBusca(params);
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
