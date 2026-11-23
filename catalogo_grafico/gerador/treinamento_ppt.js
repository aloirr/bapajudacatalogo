// Padrão de treinamento BAP (T-0032): desenha o .pptx a partir do JSON que o treinamento.py completa com a base.
// Uso: node treinamento_ppt.js <conteudo_resolvido.json> <saida.pptx>   (normalmente chamado pelo treinamento.py)
// Medidas em polegadas (16:9, 13,333 x 7,5). Grade, cores e tamanhos: catalogo_grafico/treinamentos/PADRAO_TREINAMENTO.md.
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const { applyTheme } = require('./apply_theme.js');

const [, , ENTRADA, SAIDA] = process.argv;
const K = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'));
const IMG = f => './treinamento_img/' + f;
const ICO = n => IMG('icones/' + n + '.png');

// Paleta dos 3 originais (tema "BAP Baterias", out/2026), agora com o nome do padrão. O tema só usa cores desta paleta
// (o vermelho D64545 e o amarelo F2C14E dos originais saíram: nenhum slide os usava).
const COR = { esc: '1E2B22', verde: '59BA61', verdeEsc: '2F7D36', claro: 'EEF7EF', borda: 'D9E6DA', cinza: '6B7570',
              laranja: 'F28C28', laranjaEsc: '8A3F00', laranjaClaro: 'FDF1E6', branco: 'FFFFFF', capaTexto: 'D5DED7' };
// Contraste (parecer de UX da T-0032): o verde #59BA61 só em fundo, ícone e número sobre o escuro; texto e número
// sobre fundo claro em verde-escuro #2F7D36 ou escuro; ATENÇÃO em #8A3F00 (o otext do digital2.py); número do quiz escuro sobre o laranja.
const THEME = { name: 'BAP Treinamento', headFontFace: 'Arial', bodyFontFace: 'Arial',
  colors: { dk1: COR.esc, lt1: COR.branco, dk2: COR.verdeEsc, lt2: COR.claro, accent1: COR.verde, accent2: COR.laranja,
            accent3: COR.esc, accent4: COR.cinza, accent5: COR.borda, accent6: COR.laranjaEsc, hlink: COR.verdeEsc, folHlink: COR.verde } };
const W = 13.333, M = 0.6, LARG = 12.13;   // margem lateral e largura útil

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
pres.title = 'Treinamento ' + K.nome + ' BAP'; pres.author = 'BAP AUTOPARTS'; pres.company = 'BAP AUTOPARTS';

pres.defineSlideMaster({ title: 'BAP_CAPA', background: { path: IMG('fundo_padrao.jpg') }, objects: [
  { rect: { x: 0, y: 0, w: 8.3, h: 7.5, fill: { color: COR.esc, transparency: 4 } } },
  { rect: { x: 9.3, y: 2.3, w: 2.7, h: 2.9, fill: { color: COR.branco } } },
  { image: { path: IMG('logo_bap.png'), x: 9.88, y: 2.55, w: 1.54, h: 2.08 } },
] });
pres.defineSlideMaster({ title: 'BAP_CONTEUDO', background: { color: COR.branco }, objects: [
  { image: { path: IMG('logo_bap.png'), x: 12.2, y: 0.3, w: 0.53, h: 0.72 } },
  { text: { text: K.rodape, options: { x: M, y: 7.0, w: 8, h: 0.3, fontFace: 'Arial', fontSize: 10, color: COR.cinza, margin: 0 } } },
], slideNumber: { x: 12.13, y: 7.0, w: 0.6, h: 0.3, fontFace: 'Arial', fontSize: 10, color: COR.cinza, align: 'right' } });

function txt(s, t, x, y, w, h, o = {}) {
  s.addText(t, Object.assign({ x, y, w, h, margin: 0, valign: 'top', fontFace: 'Arial', fontSize: 14, color: COR.esc }, o));
}
function card(s, x, y, w, h, fill = COR.branco) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: COR.borda, width: 0.75 },
    shadow: { type: 'outer', blur: 6, offset: 2, angle: 90, color: '000000', opacity: 0.10 } });
}
function icone(s, nome, x, y, d, cor = COR.verde) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: cor }, line: { type: 'none' } });
  const k = d * 0.56; s.addImage({ path: ICO(nome), x: x + (d - k) / 2, y: y + (d - k) / 2, w: k, h: k });
}
function notas(s, n, extra) {
  const t = Object.entries(n || {}).map(([k, v]) => k + '\n' + v).join('\n\n') + (extra ? '\n\n' + extra : '');
  if (t) s.addNotes(t);
}
function conteudo(sl) {
  const s = pres.addSlide({ masterName: 'BAP_CONTEUDO' });
  txt(s, sl.kicker, M, 0.32, 10.5, 0.32, { fontSize: 12, bold: true, color: COR.verdeEsc, charSpacing: 2 });
  txt(s, sl.titulo, M, 0.64, 11.2, 0.75, { fontSize: 30, bold: true, valign: 'middle' });
  return s;
}
// Faixa de rodapé do conteúdo: DICA DE CAMPO (verde) ou ATENÇÃO (laranja). Uma por slide, no máximo.
function faixa(s, texto, tipo = 'dica', y = 5.8, h = 0.8) {
  const at = tipo === 'atencao';
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: LARG, h, rectRadius: 0.08, fill: { color: at ? COR.laranjaClaro : COR.claro }, line: { type: 'none' } });
  icone(s, at ? 'alerta' : 'lampada', M + 0.22, y + (h - 0.42) / 2, 0.42, at ? COR.laranja : COR.verde);
  txt(s, [{ text: (at ? 'ATENÇÃO' : 'DICA DE CAMPO') + '  ', options: { bold: true, color: at ? COR.laranjaEsc : COR.verdeEsc } },
          { text: texto }], 1.45, y, 11.08, h, { valign: 'middle' });
}

const DESENHO = {
  capa(sl) {
    const s = pres.addSlide({ masterName: 'BAP_CAPA' });
    txt(s, sl.sobretitulo, 0.8, 1.55, 7, 0.45, { fontSize: 16, bold: true, color: COR.verde, charSpacing: 3 });
    txt(s, sl.titulo, 0.8, 2.1, 7.2, 2.1, { fontSize: 48, bold: true, color: COR.branco, valign: 'middle' });
    txt(s, sl.texto, 0.8, 4.35, 7, 1.2, { fontSize: 20, color: COR.capaTexto });
    txt(s, sl.rodape, 0.8, 6.2, 7, 0.5, { fontSize: 14, color: COR.verde });
    return s;
  },
  secao(sl) {
    const s = pres.addSlide({ masterName: 'BAP_CAPA' });
    txt(s, sl.numero, 0.8, 1.3, 4, 1.5, { fontSize: 96, bold: true, color: COR.verde, valign: 'bottom' });
    txt(s, sl.titulo, 0.8, 3.0, 7.2, 1.5, { fontSize: 40, bold: true, color: COR.branco, valign: 'middle' });
    txt(s, sl.texto, 0.8, 4.6, 7, 1.0, { fontSize: 20, color: COR.capaTexto });
    return s;
  },
  topicos(sl) {
    const s = conteudo(sl), w = (LARG - 3 * 0.15) / 4;
    sl.itens.forEach(([n, ic, tit, desc], k) => {
      const x = M + (k % 4) * (w + 0.15), y = 1.65 + Math.floor(k / 4) * 2.3, fim = n === '✓';
      card(s, x, y, w, 2.1, fim ? COR.claro : COR.branco);
      txt(s, n, x + 0.25, y + 0.22, 1.2, 0.6, { fontSize: 28, bold: true, color: COR.verdeEsc });
      icone(s, ic, x + w - 0.7, y + 0.25, 0.45, fim ? COR.verdeEsc : COR.verde);
      txt(s, tit, x + 0.25, y + 0.85, w - 0.4, 0.6, { fontSize: 16, bold: true, valign: 'bottom' });   // até 2 linhas
      txt(s, desc, x + 0.25, y + 1.5, w - 0.4, 0.5, { fontSize: 12, color: COR.cinza });
    });
    return s;
  },
  sistemas(sl) {
    const s = conteudo(sl), w = (LARG - 3 * 0.15) / 4, h = 1.36, p = 0.18;   // grade 4 x 3: nome primeiro, quantidade de apoio
    sl.cartoes.forEach(([nome, func, n], k) => {
      const x = M + (k % 4) * (w + 0.15), y = 1.55 + Math.floor(k / 4) * (h + 0.12);
      card(s, x, y, w, h);
      txt(s, nome, x + p, y + p - 0.04, w - 2 * p, 0.3, { fontSize: 16, bold: true });
      txt(s, [{ text: n + ' ', options: { bold: true, color: COR.verdeEsc, fontSize: 12 } }, { text: sl.rotulo_numero, options: { fontSize: 10 } }],
        x + p, y + 0.44, w - 2 * p, 0.24, { color: COR.cinza });
      txt(s, func, x + p, y + 0.7, w - 2 * p, h - 0.7 - p + 0.04, { fontSize: 12, color: COR.cinza });   // até 2 linhas
    });
    faixa(s, sl.dica, 'dica', 6.0, 0.7);
    return s;
  },
  tabela(sl) {
    const s = conteudo(sl);
    const cab = sl.cabecalho.map(t => ({ text: t, options: { bold: true, color: COR.branco, fill: { color: COR.verdeEsc }, fontSize: 12 } }));
    const corpo = sl.linhas.map((l, i) => l.map((v, j) => ({ text: v, options: { bold: j === 0, color: COR.esc,
      fontSize: 13, fill: { color: i % 2 ? COR.claro : COR.branco } } })));
    s.addTable([cab, ...corpo], { x: M, y: 1.55, w: LARG, colW: sl.larguras, rowH: 0.56, fontFace: 'Arial', valign: 'middle',
      margin: [0.04, 0.12, 0.04, 0.12], border: { type: 'solid', pt: 0.5, color: COR.borda } });
    if (sl.atencao) faixa(s, sl.atencao, 'atencao', 5.85, 0.75);
    return s;
  },
  hub(sl) {
    const s = conteudo(sl), w = 4.15, d = 2.55, cx = W / 2 - d / 2, cy = 2.35;
    s.addShape(pres.shapes.OVAL, { x: cx, y: cy, w: d, h: d, fill: { color: COR.esc }, line: { type: 'none' } });
    s.addImage({ path: ICO('carro'), x: W / 2 - 0.3, y: cy + 0.35, w: 0.6, h: 0.6 });
    txt(s, sl.centro[0], cx + 0.15, cy + 1.05, d - 0.3, 0.45, { fontSize: 18, bold: true, color: COR.branco, align: 'center' });
    txt(s, sl.centro[1], cx + 0.3, cy + 1.5, d - 0.6, 0.6, { fontSize: 11, color: COR.capaTexto, align: 'center' });
    sl.cartoes.forEach((c, k) => {
      const x = k < 3 ? M : W - M - w, y = 1.55 + (k % 3) * 1.45;
      card(s, x, y, w, 1.3);
      txt(s, c.titulo, x + 0.2, y + 0.12, w - 0.35, 0.3, { fontSize: 15, bold: true });
      txt(s, c.linha_codigo, x + 0.2, y + 0.42, w - 0.35, 0.3, { fontSize: 14, bold: true, color: COR.verdeEsc });
      txt(s, [{ text: 'OFEREÇA JUNTO  ', options: { bold: true, color: COR.verdeEsc, fontSize: 10, charSpacing: 1 } }, { text: c.linha_junto }],
        x + 0.2, y + 0.76, w - 0.35, 0.48, { fontSize: 12, color: COR.cinza });
    });
    if (sl.dica) faixa(s, sl.dica, 'dica', 6.0, 0.7);
    return s;
  },
  checklist(sl) {
    const s = conteudo(sl), w = (LARG - 0.3) / 2;
    sl.itens.forEach((t, k) => {
      const x = M + Math.floor(k / 5) * (w + 0.3), y = 1.6 + (k % 5) * 1.0;
      card(s, x, y, w, 0.82);
      icone(s, 'check', x + 0.22, y + 0.18, 0.46);
      txt(s, t, x + 0.9, y, w - 1.05, 0.82, { fontSize: 16, valign: 'middle' });
    });
    return s;
  },
  quiz(sl) {
    const s = conteudo(sl);
    sl.perguntas.forEach(([p], k) => {
      const y = 1.55 + k * 0.85;
      card(s, M, y, LARG, 0.7);
      s.addShape(pres.shapes.OVAL, { x: M + 0.2, y: y + 0.12, w: 0.46, h: 0.46, fill: { color: COR.laranja }, line: { type: 'none' } });
      txt(s, String(k + 1), M + 0.2, y + 0.12, 0.46, 0.46, { fontSize: 14, bold: true, color: COR.esc, align: 'center', valign: 'middle' });
      txt(s, p, 1.55, y, 10.93, 0.7, { fontSize: 17, valign: 'middle' });
    });
    return s;
  },
};

// Tabela com mais de 6 linhas vai em mais de um slide: mesmo título com "(1 de 2)" e o cabeçalho repetido (S6).
const MAX_LINHAS = 6;
const SLIDES = K.slides.flatMap(sl => {
  if (sl.tipo !== 'tabela' || sl.linhas.length <= MAX_LINHAS) return [sl];
  const n = Math.ceil(sl.linhas.length / MAX_LINHAS);
  return Array.from({ length: n }, (_, i) => Object.assign({}, sl,
    { titulo: `${sl.titulo} (${i + 1} de ${n})`, linhas: sl.linhas.slice(i * MAX_LINHAS, (i + 1) * MAX_LINHAS) }));
});

for (const sl of SLIDES) {
  const desenhar = DESENHO[sl.tipo];
  if (!desenhar) throw new Error('tipo de slide sem desenho: ' + sl.tipo);
  const s = desenhar(sl);
  const resp = sl.tipo === 'quiz' ? 'RESPOSTAS\n' + sl.perguntas.map(([, r], i) => `${i + 1}) ${r}`).join('\n') : '';
  notas(s, sl.notas, resp);
}

(async () => {
  await pres.writeFile({ fileName: SAIDA });
  await applyTheme(SAIDA, THEME);
})();
