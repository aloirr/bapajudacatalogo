#!/usr/bin/env node
/* T-0006 · Simulação da busca por medida (proposta; o site do main não muda).

   Uso, na raiz do repositório, depois de "python3 scripts/gerar_site.py" e "python3 docs/propostas/T-0006/medidas.py":
     node docs/propostas/T-0006/simular.mjs [pasta dos prints]      (padrão: testes/prints/T-0006)
   Abre o site de site/ (servidor estático), faz a busca "bateria" e "pneu moto" e põe na coluna de filtros (no
   celular, no painel "Filtrar") os grupos propostos, com as contagens de medidas.json. Só desenha a página no
   navegador do teste: nenhum arquivo do site é alterado. Prints em 1366 × 1300 e 390 × 844 (o marcado, 390 × 1500),
   com o selo "SIMULAÇÃO · T-0006". Precisa do Playwright (o mesmo do scripts/testar_site.mjs). */
import { createRequire } from "module";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
const { chromium } = createRequire(import.meta.url)("playwright");

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const D = JSON.parse(fs.readFileSync(path.join(AQUI, "medidas.json"), "utf8"));
const OUT = process.argv[2] || "testes/prints/T-0006";
const PORTA = 8766;
fs.mkdirSync(OUT, { recursive: true });

const CENARIOS = {
  baterias: {
    url: "#/busca?q=bateria",
    grupos: [
      { k: "ah", rot: "Amperagem", op: Object.entries(D.ah).map(([v, c]) => [v, v + " Ah", c]) },
      { k: "cca", rot: "Partida a frio (CCA)", op: Object.entries(D.cca).map(([v, c]) => [v, v, c]) },
    ],
    marca: { k: "ah", v: "60", etq: "Amperagem: 60 Ah" },
  },
  pneus: {
    url: "#/busca?q=pneu%20moto",
    grupos: [
      { k: "aro", rot: "Aro", op: Object.entries(D.aro).map(([v, c]) => [v, "Aro " + v, c]) },
      { k: "med", rot: "Medida do pneu", op: Object.entries(D.med).map(([v, c]) => [v, v, c]) },
    ],
    marca: { k: "aro", v: "18", etq: "Aro: 18" },
  },
};

// Desenha os grupos no fim da barra de filtros e, se "marcar", marca a medida, esconde os outros cartões,
// acerta o total, a etiqueta e o "Filtrar (1)". Antes, rola até o fim para carregar todos os cartões.
async function desenhar(p, cen, marcar) {
  await p.evaluate(async ({ cen, marcar }) => {
    for (let i = 0; i < 15; i++) { window.scrollTo(0, document.body.scrollHeight); await new Promise((r) => setTimeout(r, 250)); }
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 800));
    const sel = marcar ? cen.marca : null;
    const html = cen.grupos.map((g) => `<div class="filtro sim-medida" data-k="${g.k}">
        <button class="filtro-bt" type="button" aria-expanded="true" aria-controls="filtro-${g.k}"><span>${g.rot}</span><span class="seta" aria-hidden="true">▾</span></button>
        <div class="filtro-lista" id="filtro-${g.k}" role="group" aria-label="${g.rot}">${g.op.map(([v, t, c]) =>
          `<label><input type="checkbox" value="${v}"${sel && sel.k === g.k && sel.v === v ? " checked" : ""}><span>${t}</span><em>${c.length}</em></label>`).join("")}</div></div>`).join("");
    document.querySelectorAll(".barra-filtros").forEach((bf) => bf.insertAdjacentHTML("beforeend", html));
    if (!document.getElementById("sim-selo")) document.body.insertAdjacentHTML("beforeend",
      `<div id="sim-selo" style="position:absolute;left:50%;transform:translateX(-50%);top:${innerWidth < 600 ? 298 : 20}px;z-index:9999;background:#fff3cd;color:#5c4400;border:1px solid #e0c060;border-radius:8px;padding:6px 10px;font:600 12px/1.3 Poppins,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.15)">SIMULAÇÃO · T-0006 · não está no site</div>`);
    if (!sel) return;
    const cods = new Set(cen.grupos.find((g) => g.k === sel.k).op.find((o) => o[0] === sel.v)[2]);
    let n = 0;
    document.querySelectorAll("article.item").forEach((a) => { if (cods.has(a.dataset.cod)) n++; else a.style.display = "none"; });
    const tot = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /^\d[\d.]* produtos?$/.test(e.textContent.trim()));
    if (tot) tot.textContent = n + (n === 1 ? " produto" : " produtos");
    const etq = document.querySelector(".etiquetas");
    if (etq) {
      etq.hidden = false;
      const nova = `<span class="etq"><span>${sel.etq}</span><button type="button" aria-label="Tirar ${sel.etq}">✕</button></span>`;
      const lt = etq.querySelector(".limpar-tudo");
      if (lt) lt.insertAdjacentHTML("beforebegin", nova);
      else etq.insertAdjacentHTML("beforeend", nova + '<button class="limpar-tudo" type="button">Limpar tudo</button>');
    }
    const bf = document.querySelector(".bt-filtrar");
    if (bf) bf.textContent = "Filtrar (1)";
  }, { cen, marcar });
}

const srv = spawn("python3", ["-m", "http.server", String(PORTA), "-d", "site"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1500));
const nav = await chromium.launch();
try {
  for (const [nome, cen] of Object.entries(CENARIOS)) {
    for (const w of [1366, 390]) {
      const ctx = await nav.newContext({ viewport: { width: w, height: w === 390 ? 844 : 1300 }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.route(/onrender\.com|googleapis|gstatic/, (r) => r.abort()); // sem rede: placas, contador e fonte de fora
      const abrir = async () => { await p.goto(`http://localhost:${PORTA}/`); await p.goto(`http://localhost:${PORTA}/${cen.url}`); await p.waitForTimeout(1500); };
      // 1) os grupos novos (no celular, com o painel "Filtrar" aberto)
      await abrir();
      await desenhar(p, cen, false);
      if (w === 390) { await p.click(".bt-filtrar"); await p.waitForTimeout(600); }
      await p.screenshot({ path: `${OUT}/${nome}-filtros-${w}.png` });
      // 2) com uma medida marcada (no celular, a tela mais alta mostra a lista inteira)
      await abrir();
      await desenhar(p, cen, true);
      if (w === 390) {
        await p.setViewportSize({ width: 390, height: 1500 });
        await p.waitForTimeout(800);
        if (!(await p.evaluate(() => !!document.querySelector(".sim-medida")))) await desenhar(p, cen, true); // a tela redesenha no resize
      }
      await p.screenshot({ path: `${OUT}/${nome}-marcado-${w}.png` });
      await ctx.close();
    }
  }
} finally {
  await nav.close();
  srv.kill();
}
console.log("prints em " + OUT);
