const pptxgen = require('pptxgenjs');
const { applyTheme } = require('./apply_theme.js');
const SZ = require('./pptimg/sizes.json');
const K = require('./apres_conteudo.json');   // textos da apresentação: um arquivo só, o mesmo do apres_bemol.py (RD-0431)
const I = f => './pptimg/' + f;
const THEME = { name: 'BAP', headFontFace: 'Arial', bodyFontFace: 'Arial',
  colors: { dk1: '141514', lt1: 'FFFFFF', dk2: '1F7A32', lt2: 'EEF4EC', accent1: '3DAE49', accent2: '5CB85F',
            accent3: 'F28C28', accent4: '4D514D', accent5: 'DFE2DC', accent6: '242624', hlink: '1F7A32', folHlink: '1F7A32' } };
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = K.doc.titulo; pres.author = K.marca;
const C = pres.SchemeColor;
const P = v => v / 72;                  // coordenadas em pontos (960 x 540) -> polegadas

pres.defineSlideMaster({ title: 'BAP_ESCURO', background: { color: C.text1 }, objects: [] });
pres.defineSlideMaster({
  title: 'BAP_CONTEUDO', background: { color: C.background1 },
  objects: [
    { image: { path: I('logo_escuro.png'), x: P(40), y: P(22), w: P(24), h: P(33) } },
    { text: { text: K.marca, options: { x: P(70), y: P(27), w: 3, h: P(20), fontSize: 9, bold: true, color: C.text2, charSpacing: 2, margin: 0 } } },
    { text: { text: K.site, options: { x: P(40), y: P(508), w: 6, h: P(18), fontSize: 10, color: C.accent4, margin: 0 } } },
  ],
  slideNumber: { x: P(880), y: P(506), w: P(40), h: P(20), fontSize: 10, bold: true, color: C.text2, align: 'right' },
});

function img(s, f, x, y, w, h, name) {
  const [iw, ih] = SZ[f]; const k = Math.min(w / iw, h / ih); const dw = iw * k, dh = ih * k;
  s.addImage({ path: I(f), x: P(x + (w - dw) / 2), y: P(y + (h - dh) / 2), w: P(dw), h: P(dh), objectName: name || f });
}
function box(s, x, y, w, h, fill, opt = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: P(x), y: P(y), w: P(w), h: P(h), rectRadius: opt.r || 0.15,
    fill: { color: fill }, line: opt.line ? { color: opt.line, width: 0.75 } : { type: 'none' }, objectName: opt.name || 'card' });
}
function txt(s, t, x, y, w, h, o = {}) {
  s.addText(t, Object.assign({ x: P(x), y: P(y), w: P(w), h: P(h), margin: 0, valign: 'top', isTextBox: true, color: C.text1, fontSize: 12 }, o));
}
function content(section, kicker, title) {
  const s = pres.addSlide({ masterName: 'BAP_CONTEUDO', sectionTitle: section });
  txt(s, kicker.toUpperCase(), 40, 62, 880, 18, { fontSize: 11, bold: true, color: C.accent1, charSpacing: 2, objectName: 'kicker' });
  txt(s, title, 38, 82, 880, 40, { fontSize: 30, bold: true, color: C.text1, objectName: 'titulo' });
  return s;
}
function table(s, x, y, header, rows, widths, fs = 11) {
  const head = header.map(h => ({ text: h.toUpperCase(), options: { bold: true, color: C.background1, fill: { color: C.text1 }, fontSize: 9, charSpacing: 1 } }));
  const body = rows.map((r, i) => r.map((v, j) => ({ text: v, options: { bold: j === 0, color: j === 0 ? C.text1 : C.accent4, fontSize: fs,
    fill: { color: i % 2 === 0 ? C.background2 : C.background1 } } })));
  s.addTable([head, ...body], { x: P(x), y: P(y), colW: widths.map(P), border: { type: 'none' }, margin: [4, 8, 4, 8], valign: 'middle', objectName: 'tabela' });
}

// 1 ─ capa
pres.addSection({ title: 'Abertura' });
let s = pres.addSlide({ masterName: 'BAP_ESCURO', sectionTitle: 'Abertura' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 80 - 330), y: P(300 - 330), w: P(660), h: P(660), fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'circulo1' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 100 - 250), y: P(300 - 250), w: P(500), h: P(500), fill: { color: C.accent2 }, line: { type: 'none' }, objectName: 'circulo2' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 100 - 185), y: P(300 - 185), w: P(370), h: P(370), fill: { color: C.text1 }, line: { type: 'none' }, objectName: 'circulo3' });
img(s, 'logo_branco.png', 60, 48, 46, 64, 'logo');
let k = K.capa;
txt(s, k.sobretitulo, 62, 150, 400, 20, { fontSize: 12, bold: true, color: C.accent2, charSpacing: 3 });
txt(s, k.titulo.join('\n'), 58, 172, 470, 120, { fontSize: 44, bold: true, color: C.background1, lineSpacingMultiple: 0.95 });
txt(s, k.texto, 62, 304, 420, 80, { fontSize: 14, color: 'CFD3CF' });
txt(s, k.data, 62, 468, 200, 18, { fontSize: 11, color: 'CFD3CF' });
box(s, 560, 150, 300, 230, C.background1, { r: 0.3, name: 'moldura_oleos' }); img(s, 'oleos.png', 575, 160, 270, 210, 'oleos');
k.fotos.forEach((c, i) => { const x = 560 + i * 77; box(s, x, 392, 69, 80, C.background1, { r: 0.15, name: 'mini_' + c }); img(s, c + '.png', x + 6, 398, 57, 68, c); });

// 2 ─ quem somos
pres.addSection({ title: 'A BAP' });
k = K.quem_somos;
s = content('A BAP', k.sobretitulo, k.titulo);
txt(s, k.texto, 40, 136, 640, 80, { fontSize: 15, color: C.accent4 });
const TW = (880 - 16 * (k.numeros.length - 1)) / k.numeros.length;   // a garantia fica só na caixa de baixo (RD-0430)
k.numeros.forEach(([a, b], i) => {
  const x = 40 + i * (TW + 16); box(s, x, 246, TW, 130, C.text1, { r: 0.2, name: 'numero_' + i });
  txt(s, a, x, 272, TW, 46, { fontSize: 34, bold: true, color: C.accent2, align: 'center' });
  txt(s, b, x + 10, 328, TW - 20, 34, { fontSize: 12, color: C.background1, align: 'center' });
});
box(s, 40, 400, 880, 78, C.background2, { r: 0.18, name: 'garantia' });
txt(s, k.garantia[0], 62, 414, 400, 16, { fontSize: 10, bold: true, color: C.text2, charSpacing: 2 });
txt(s, k.garantia[1], 62, 434, 840, 36, { fontSize: 13 });

// 3 ─ portfólio
k = K.portfolio;
s = content('A BAP', k.sobretitulo, k.titulo);
k.blocos.forEach(([a, b, c], i) => {
  const x = 40 + (i % 3) * 296, y = 136 + Math.floor(i / 3) * 176;
  box(s, x, y, 280, 160, C.background2, { r: 0.18, name: 'bloco_' + i });
  s.addShape(pres.shapes.OVAL, { x: P(x + 18), y: P(y + 18), w: P(34), h: P(34), fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'icone_' + i });
  txt(s, String(i + 1), x + 18, y + 25, 34, 20, { fontSize: 13, bold: true, color: C.background1, align: 'center' });
  txt(s, a, x + 62, y + 18, 210, 22, { fontSize: 15, bold: true });
  txt(s, b.toUpperCase(), x + 62, y + 40, 210, 16, { fontSize: 9.5, bold: true, color: C.text2, charSpacing: 1 });
  txt(s, c, x + 18, y + 72, 248, 80, { fontSize: 12, color: C.accent4 });
});

// 4 ─ óleos de motor
pres.addSection({ title: 'Lubrificantes' });
k = K.oleos_motor;
s = content('Lubrificantes', k.sobretitulo, k.titulo);
table(s, 40, 132, k.colunas, k.linhas, [160, 150, 108, 148, 88], 10.5);
box(s, 710, 132, 210, 340, C.background2, { r: 0.2, name: 'painel_oleos' }); img(s, 'oleos.png', 720, 146, 190, 150, 'oleos');
txt(s, k.lado[0], 726, 316, 180, 44, { fontSize: 13, bold: true });
txt(s, k.lado[1], 726, 372, 180, 70, { fontSize: 12, color: C.accent4 });

// 5 ─ moto
k = K.moto;
s = content('Lubrificantes', k.sobretitulo, k.titulo);
table(s, 40, 132, k.colunas, k.linhas, [180, 200, 140, 180, 100], 13);
box(s, 40, 270, 880, 190, C.text1, { r: 0.2, name: 'argumento' });
txt(s, k.argumento[0], 66, 292, 400, 16, { fontSize: 11, bold: true, color: C.accent2, charSpacing: 2 });
txt(s, k.argumento[1], 66, 318, 560, 120, { fontSize: 15, color: C.background1 });
img(s, 'oleos.png', 660, 290, 240, 150, 'oleos');

// 6 ─ transmissão
k = K.transmissao;
s = content('Lubrificantes', k.sobretitulo, k.titulo);
table(s, 40, 132, k.colunas, k.linhas, [190, 220, 330, 140], 12.5);

// 7 ─ radiador
pres.addSection({ title: 'Químicos' });
k = K.radiador;
s = content('Químicos', k.sobretitulo, k.titulo);
k.cartoes.forEach(([c, a, b], i) => {
  const x = 40 + i * 178; box(s, x, 130, 166, 300, C.background2, { r: 0.18, name: 'card_' + c });
  img(s, c + '.png', x + 18, 142, 130, 146, c);
  txt(s, c, x + 14, 298, 140, 18, { fontSize: 13, bold: true });
  txt(s, a, x + 14, 320, 140, 46, { fontSize: 11.5, color: C.accent4 });
  txt(s, b, x + 14, 376, 140, 40, { fontSize: 10.5, bold: true, color: C.text2 });
});
txt(s, k.nota.flatMap(([a, b], i) => [{ text: a + ' ', options: { bold: true } }, { text: b + (i < k.nota.length - 1 ? '  ' : '') }]),
    40, 446, 880, 40, { fontSize: 12.5, color: C.accent4 });

// 8 ─ freio e manutenção
k = K.freio; const SELO = k.selo;
s = content('Químicos', k.sobretitulo, k.titulo);
k.cartoes.forEach(([c, a, b], i) => {
  const x = 40 + i * 126.5; box(s, x, 130, 118, 300, C.background2, { r: 0.16, name: 'card_' + c });
  if (c in SELO.numero) {
    box(s, x + 14, 142, 90, 124, C.text1, { r: 0.15, name: 'selo_' + c });
    txt(s, SELO.rotulo, x + 14, 160, 90, 22, { fontSize: 18, bold: true, color: C.accent2, align: 'center' });
    txt(s, SELO.numero[c], x + 14, 182, 90, 50, { fontSize: 44, bold: true, color: C.background1, align: 'center' });
    txt(s, SELO.legenda, x + 14, 240, 90, 14, { fontSize: 7.5, bold: true, color: 'CFD3CF', align: 'center' });
  } else img(s, c + '.png', x + 10, 140, 98, 130, c);
  txt(s, c, x + 10, 282, 100, 16, { fontSize: 11, bold: true });
  txt(s, a, x + 10, 300, 100, 66, { fontSize: 10.5, color: C.accent4 });
  txt(s, b, x + 10, 380, 100, 40, { fontSize: 10, bold: true, color: C.text2 });
});

// 9 ─ mix
pres.addSection({ title: 'Proposta' });
k = K.mix;
s = content('Proposta', k.sobretitulo, k.titulo);
table(s, 40, 126, k.colunas, k.linhas, [190, 400, 290], 10.5);

// 10 ─ apoio
k = K.apoio;
s = content('Proposta', k.sobretitulo, k.titulo);
k.itens.forEach(([a, b], i) => {
  const x = 40 + (i % 2) * 444, y = 132 + Math.floor(i / 2) * 168;
  box(s, x, y, 432, 152, C.background2, { r: 0.2, name: 'apoio_' + i });
  s.addShape(pres.shapes.OVAL, { x: P(x + 22), y: P(y + 22), w: P(44), h: P(44), fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'num_' + i });
  txt(s, String(i + 1).padStart(2, '0'), x + 22, y + 34, 44, 20, { fontSize: 14, bold: true, color: C.background1, align: 'center' });
  txt(s, a, x + 84, y + 24, 330, 24, { fontSize: 17, bold: true });
  txt(s, b, x + 84, y + 56, 330, 84, { fontSize: 13, color: C.accent4 });
});

// 11 ─ obrigado
pres.addSection({ title: 'Encerramento' });
s = pres.addSlide({ masterName: 'BAP_ESCURO', sectionTitle: 'Encerramento' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 110 - 280), y: P(280 - 280), w: P(560), h: P(560), fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'circulo1' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 125 - 215), y: P(280 - 215), w: P(430), h: P(430), fill: { color: C.accent2 }, line: { type: 'none' }, objectName: 'circulo2' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 125 - 160), y: P(280 - 160), w: P(320), h: P(320), fill: { color: C.text1 }, line: { type: 'none' }, objectName: 'circulo3' });
img(s, 'logo_grande.png', 960 - 125 - 62, 280 - 85, 124, 170, 'logo_grande');
img(s, 'logo_branco.png', 60, 48, 36, 50, 'logo');
k = K.obrigado;
txt(s, k.sobretitulo, 62, 146, 400, 20, { fontSize: 12, bold: true, color: C.accent2, charSpacing: 3 });
txt(s, k.titulo, 58, 170, 420, 70, { fontSize: 50, bold: true, color: C.background1 });
txt(s, k.texto, 62, 248, 420, 90, { fontSize: 15, color: 'CFD3CF' });
box(s, 62, 360, 420, 116, C.accent6, { r: 0.2, name: 'contato' });
txt(s, k.contato[0], 84, 376, 380, 22, { fontSize: 17, bold: true, color: C.background1 });
txt(s, k.contato[1], 84, 400, 380, 18, { fontSize: 12, color: 'CFD3CF' });
txt(s, k.contato[2], 84, 424, 380, 18, { fontSize: 13, color: C.accent2 });
txt(s, k.contato[3], 84, 446, 380, 18, { fontSize: 13, color: C.accent2 });
txt(s, K.site, 62, 496, 400, 18, { fontSize: 11, color: 'CFD3CF' });

(async () => {
  const out = 'saidas/BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pptx';
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('ok');
})();
