// Item 9 da v21: as linhas da tabela de veículos do site (app.js do worktree, produtos.json da v20) que vão pelo
// caminho de 1 faixa sem entrada pura (a faixa pode ser de uma variante). Só lê.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const SITE = process.argv[2], OUT = process.argv[3];
const T = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = http.createServer((q, r) => {
  const f = path.join(SITE, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html"));
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "content-type": T[path.extname(f)] || "application/octet-stream" }); r.end(b); });
});
const A1 = "  carregar().then(render)", A2 = "const fx = n1 > 1 ? puras : repetido && puras.length ? puras : f1;";
let src = fs.readFileSync(path.join(SITE, "app.js"), "utf8");
if (!src.includes(A1) || !src.includes(A2)) throw new Error("âncora do app.js mudou");
src = src.replace(A2, A2 + `\n      if (n1 === 1 && !repetido && f1.length) { const pu = faixasDe(doModelo(tAno, m, ver, cil)); (window.__V = window.__V || []).push({ c: p.c, fab, mod, ver: ver || "", t: tAno, pura: pu.length > 0, f1: [...new Set(f1.map(fmtFaixa))].join(", ") }); }`)
         .replace(A1, "  window.__T = { linhasVeiculos, base: () => BASE };\n" + A1);
(async () => {
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  const br = await chromium.launch(), pg = await br.newPage();
  await pg.route("**/app.js", (rt) => rt.fulfill({ contentType: "text/javascript", body: src }));
  await pg.route("**/*.onrender.com/**", (rt) => rt.fulfill({ status: 503, body: "{}" }));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/`);
  await pg.waitForFunction(() => window.__T && window.__T.base() && window.__T.base().produtos);
  const r = await pg.evaluate(() => { window.__V = []; let n = 0; for (const p of window.__T.base().produtos) if (p.ve) n += window.__T.linhasVeiculos(p).length; return { n, v: window.__V }; });
  await br.close(); srv.close();
  fs.writeFileSync(OUT, JSON.stringify(r));
  const sem = r.v.filter((x) => !x.pura);
  console.log("linhas da tabela", r.n, "| caminho 1 faixa", r.v.length, "| sem entrada pura", sem.length, "produtos", new Set(sem.map((x) => x.c)).size);
})();
