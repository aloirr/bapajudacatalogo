const pptxgen = require('pptxgenjs');
let applyTheme = null; try { ({ applyTheme } = require('./apply_theme.js')); } catch (e) { /* opcional */ }
const SZ = require('./pptimg/sizes.json');
const I = f => './pptimg/' + f;
const THEME = { name: 'BAP', headFontFace: 'Arial', bodyFontFace: 'Arial',
  colors: { dk1: '141514', lt1: 'FFFFFF', dk2: '1F7A32', lt2: 'EEF4EC', accent1: '3DAE49', accent2: '5CB85F',
            accent3: 'F28C28', accent4: '4D514D', accent5: 'DFE2DC', accent6: '242624', hlink: '1F7A32', folHlink: '1F7A32' } };
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'BAP · Lubrificantes e Químicos · Apresentação Comercial'; pres.author = 'BAP AUTOPARTS';
const C = pres.SchemeColor;
const P = v => v / 72;                  // coordenadas em pontos (960 x 540) -> polegadas

pres.defineSlideMaster({ title: 'BAP_ESCURO', background: { color: C.text1 }, objects: [] });
pres.defineSlideMaster({
  title: 'BAP_CONTEUDO', background: { color: C.background1 },
  objects: [
    { image: { path: I('logo_escuro.png'), x: P(40), y: P(22), w: P(24), h: P(33) } },
    { text: { text: 'BAP AUTOPARTS', options: { x: P(70), y: P(27), w: 3, h: P(20), fontSize: 9, bold: true, color: C.text2, charSpacing: 2, margin: 0 } } },
    { text: { text: 'www.bapautoparts.com.br  ·  @bapautoparts', options: { x: P(40), y: P(508), w: 6, h: P(18), fontSize: 10, color: C.accent4, margin: 0 } } },
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
s.addShape(pres.shapes.OVAL, { x: P(W_ = 960 - 80 - 330), y: P(300 - 330), w: P(660), h: P(660), fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'circulo1' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 100 - 250), y: P(300 - 250), w: P(500), h: P(500), fill: { color: C.accent2 }, line: { type: 'none' }, objectName: 'circulo2' });
s.addShape(pres.shapes.OVAL, { x: P(960 - 100 - 185), y: P(300 - 185), w: P(370), h: P(370), fill: { color: C.text1 }, line: { type: 'none' }, objectName: 'circulo3' });
img(s, 'logo_branco.png', 60, 48, 46, 64, 'logo');
txt(s, 'APRESENTAÇÃO COMERCIAL', 62, 150, 400, 20, { fontSize: 12, bold: true, color: C.accent2, charSpacing: 3 });
txt(s, 'Lubrificantes\ne Químicos BAP', 58, 172, 470, 120, { fontSize: 44, bold: true, color: C.background1, lineSpacingMultiple: 0.95 });
txt(s, 'Óleos para carro, moto e transmissão, aditivos de radiador, fluido de freio e produtos de manutenção, com qualidade padrão OEM e Garantia Expressa BAP.', 62, 304, 420, 80, { fontSize: 14, color: 'CFD3CF' });
txt(s, 'Outubro de 2026', 62, 468, 200, 18, { fontSize: 11, color: 'CFD3CF' });
box(s, 560, 150, 300, 230, C.background1, { r: 0.3, name: 'moldura_oleos' }); img(s, 'oleos.png', 575, 160, 270, 210, 'oleos');
['RAD25005P', 'RAD25009P', 'AER12000', 'SIL3502'].forEach((c, i) => { const x = 560 + i * 77; box(s, x, 392, 69, 80, C.background1, { r: 0.15, name: 'mini_' + c }); img(s, c + '.png', x + 6, 398, 57, 68, c); });

// 2 ─ quem somos
pres.addSection({ title: 'A BAP' });
s = content('A BAP', 'Quem somos', 'A BAP AUTOPARTS');
txt(s, 'Empresa brasileira criada em 2021 para oferecer componentes automotivos de qualidade, com segurança e preço acessível. O portfólio vai da suspensão à parte elétrica, passando por lubrificantes e químicos, para as linhas leve, pesada e moto.', 40, 136, 640, 80, { fontSize: 15, color: C.accent4 });
[['+40', 'linhas de produtos'], ['+6.500', 'itens e aplicações'], ['Nacional', 'presença em todos os estados'], ['SAC', 'garantia direto com a fábrica']].forEach(([a, b], i) => {
  const x = 40 + i * 222; box(s, x, 246, 206, 130, C.text1, { r: 0.2, name: 'numero_' + i });
  txt(s, a, x, 272, 206, 46, { fontSize: 34, bold: true, color: C.accent2, align: 'center' });
  txt(s, b, x + 10, 328, 186, 34, { fontSize: 12, color: C.background1, align: 'center' });
});
box(s, 40, 400, 880, 78, C.background2, { r: 0.18, name: 'garantia' });
txt(s, 'GARANTIA EXPRESSA BAP', 62, 414, 400, 16, { fontSize: 10, bold: true, color: C.text2, charSpacing: 2 });
txt(s, 'Sem burocracia: o consumidor aciona a garantia direto com a fábrica pelo SAC BAP, sem intermediários, conforme o certificado da embalagem.', 62, 434, 840, 36, { fontSize: 13 });

// 3 ─ portfólio
s = content('A BAP', 'Portfólio', 'Lubrificantes e químicos em uma só marca');
[['Óleos de motor', '8 itens', 'Linha ProActive para carros: sintéticos, semissintéticos e mineral, de 0W20 a 20W50.'],
 ['Óleos para moto 4T', '2 itens', 'ProActive 110 e 210, API SL e JASO MA, para motos 4 tempos.'],
 ['Transmissão e hidráulico', '8 itens', 'Shiftease para câmbio e diferencial (GL-4 e GL-5), ATF Dexron III e Effitech hidráulico.'],
 ['Aditivos de radiador', 'do 1 L ao 200 L', 'Fluidos orgânicos e anticorrosivos, concentrados e prontos para uso, e água desmineralizada.'],
 ['Fluido de freio', 'DOT 3 e DOT 4', 'Frasco de 500 ml para a revisão do sistema de freio.'],
 ['Manutenção', 'sprays e selantes', 'Desengripante, descarbonizante, silicone spray, silicones de alta temperatura e aditivo para diesel.']].forEach(([a, b, c], i) => {
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
s = content('Lubrificantes', 'Óleos de motor · linha ProActive', 'Do carro novo ao mais rodado');
table(s, 40, 132, ['Código', 'Produto', 'Base', 'Especificação', 'Embalagem'], [
  ['0W20 PROACTIVE300', 'ProActive 300 0W20', 'Sintético', 'API SN', '1 L'],
  ['5W20 PROACTIVE300', 'ProActive 300 5W20', 'Sintético', 'API SN/RC', '1 L'],
  ['5W30 PROACTIVE300', 'ProActive 300 5W30', 'Sintético', 'API SN', '1 L'],
  ['5W30 PROACTIVE SM', 'ProActive 300 5W30', 'Sintético', 'API SM / ILSAC GF-4', '1 L'],
  ['5W40 PROACTIVE300', 'ProActive 300 5W40', 'Sintético', 'API SN', '1 L'],
  ['10W40 PROACTIVE 200', 'ProActive 200 10W40', 'Semissintético', 'API SM', '1 L'],
  ['15W40 PROACTIVE100', 'ProActive 100 15W40', 'Semissintético', 'API SL', '1 L'],
  ['20W50 PROACTIVE100', 'ProActive 100 20W50', 'Mineral', 'API SL', '1 L']], [160, 150, 108, 148, 88], 10.5);
box(s, 710, 132, 210, 340, C.background2, { r: 0.2, name: 'painel_oleos' }); img(s, 'oleos.png', 720, 146, 190, 150, 'oleos');
txt(s, 'Para motores a gasolina, etanol, GNV e flex.', 726, 316, 180, 44, { fontSize: 13, bold: true });
txt(s, 'Linhas 300 (sintético), 200 e 100: uma opção para cada perfil de cliente.', 726, 372, 180, 70, { fontSize: 12, color: C.accent4 });

// 5 ─ moto
s = content('Lubrificantes', 'Óleos para moto', 'ProActive 4T para motos 4 tempos');
table(s, 40, 132, ['Código', 'Produto', 'Base', 'Especificação', 'Embalagem'], [
  ['20W50 4T PROACTIVE', 'ProActive 110 20W50 4T', 'Mineral', 'API SL · JASO MA', '1 L'],
  ['10W30 PROACTIVE210', 'ProActive 210 10W30 4T', 'Semissintético', 'API SL · JASO MA', '1 L']], [180, 200, 140, 180, 100], 13);
box(s, 40, 270, 880, 190, C.text1, { r: 0.2, name: 'argumento' });
txt(s, 'POR QUE TER NA GÔNDOLA', 66, 292, 400, 16, { fontSize: 11, bold: true, color: C.accent2, charSpacing: 2 });
txt(s, 'A troca de óleo da moto é frequente e de compra rápida. Com o 20W50 mineral e o 10W30 semissintético, a loja atende das motos de entrada às mais exigentes, com a norma JASO MA, própria para embreagem banhada a óleo.', 66, 318, 560, 120, { fontSize: 15, color: C.background1 });
img(s, 'oleos.png', 660, 290, 240, 150, 'oleos');

// 6 ─ transmissão
s = content('Lubrificantes', 'Transmissão e hidráulico', 'Shiftease, ATF e Effitech');
table(s, 40, 132, ['Código', 'Produto', 'Uso', 'Embalagem'], [
  ['80W GL4 SHIFTEASE', 'Shiftease 100 80W', 'Câmbio manual · API GL-4 · mineral', '1 L e balde 20 L'],
  ['80W90 GL5 SHIFTEASE', 'Shiftease 110 80W90', 'Câmbio e diferencial · API GL-5 · mineral', '1 L e balde 20 L'],
  ['85W140 SHIFTEASE120', 'Shiftease 120 85W140', 'Diferencial de carga pesada · API GL-5', '1 L e balde 20 L'],
  ['ATF DEXRON III', 'Shiftease 200 ATF Dexron III', 'Transmissão automática e direção hidráulica · mineral', '1 L'],
  ['68 EFFITECH100 BD', 'Effitech 100 ISO VG 68', 'Sistemas hidráulicos · HL · mineral', 'Balde 20 L']], [190, 220, 330, 140], 12.5);

// 7 ─ radiador
pres.addSection({ title: 'Químicos' });
s = content('Químicos', 'Químicos · radiador', 'Aditivos e água desmineralizada');
[['RAD25005P', 'Anticorrosivo pronto para uso · rosa', '1 L · também 5 L, 20 L e 200 L'],
 ['RAD25001P', 'Orgânico pronto para uso · rosa', '1 L · também 5 L e 20 L'],
 ['RAD25000P', 'Orgânico concentrado · rosa', '1 L · também 20 L'],
 ['RAD25002P', 'Anticorrosivo pronto para uso · verde', '1 L'],
 ['RAD25009P', 'Água desmineralizada', '1 L · também 20 L']].forEach(([c, a, b], i) => {
  const x = 40 + i * 178; box(s, x, 130, 166, 300, C.background2, { r: 0.18, name: 'card_' + c });
  img(s, c + '.png', x + 18, 142, 130, 146, c);
  txt(s, c, x + 14, 298, 140, 18, { fontSize: 13, bold: true });
  txt(s, a, x + 14, 320, 140, 46, { fontSize: 11.5, color: C.accent4 });
  txt(s, b, x + 14, 376, 140, 40, { fontSize: 10.5, bold: true, color: C.text2 });
});
txt(s, [{ text: 'Pronto para uso: ', options: { bold: true } }, { text: 'é só completar o reservatório.  ' },
        { text: 'Concentrado: ', options: { bold: true } }, { text: 'diluir com água desmineralizada conforme a embalagem. Venda junto: aditivo + água desmineralizada.' }],
    40, 446, 880, 40, { fontSize: 12.5, color: C.accent4 });

// 8 ─ freio e manutenção
s = content('Químicos', 'Químicos · freio e manutenção', 'Itens de giro rápido para o balcão');
[['FLU15002', 'Fluido de freio DOT 4', '500 ml'], ['FLU15001', 'Fluido de freio DOT 3', '500 ml'],
 ['AER12000', 'Desengripante antiferrugem multiuso', '300 ml'], ['AER12001', 'Descarbonizante (bico, TBI, carburador)', '300 ml'],
 ['AER12002', 'Silicone spray protetivo', '300 ml'], ['SIL3502', 'Silicone selante alta temperatura black HT', '50 g · também cinza e 85 g'],
 ['DIE5500', 'Aditivo estabilizador para diesel', '500 ml · também 100 ml']].forEach(([c, a, b], i) => {
  const x = 40 + i * 126.5; box(s, x, 130, 118, 300, C.background2, { r: 0.16, name: 'card_' + c });
  if (c.startsWith('FLU')) {
    box(s, x + 14, 142, 90, 124, C.text1, { r: 0.15, name: 'selo_' + c });
    txt(s, 'DOT', x + 14, 160, 90, 22, { fontSize: 18, bold: true, color: C.accent2, align: 'center' });
    txt(s, c === 'FLU15002' ? '4' : '3', x + 14, 182, 90, 50, { fontSize: 44, bold: true, color: C.background1, align: 'center' });
    txt(s, 'FLUIDO DE FREIO', x + 14, 240, 90, 14, { fontSize: 7.5, bold: true, color: 'CFD3CF', align: 'center' });
  } else img(s, c + '.png', x + 10, 140, 98, 130, c);
  txt(s, c, x + 10, 282, 100, 16, { fontSize: 11, bold: true });
  txt(s, a, x + 10, 300, 100, 66, { fontSize: 10.5, color: C.accent4 });
  txt(s, b, x + 10, 380, 100, 40, { fontSize: 10, bold: true, color: C.text2 });
});

// 9 ─ mix
pres.addSection({ title: 'Proposta' });
s = content('Proposta', 'Proposta', 'Mix de entrada sugerido');
table(s, 40, 126, ['Código', 'Produto', 'Para quem'], [
  ['5W30 PROACTIVE SM', 'Óleo ProActive 300 5W30 sintético 1 L', 'Carros flex mais novos'],
  ['15W40 PROACTIVE100', 'Óleo ProActive 100 15W40 semissintético 1 L', 'Carros de uso geral'],
  ['20W50 PROACTIVE100', 'Óleo ProActive 100 20W50 mineral 1 L', 'Carros mais rodados'],
  ['20W50 4T PROACTIVE', 'Óleo ProActive 110 20W50 4T 1 L', 'Motos 4 tempos'],
  ['10W30 PROACTIVE210', 'Óleo ProActive 210 10W30 4T 1 L', 'Motos 4 tempos'],
  ['ATF DEXRON III', 'Óleo ATF Dexron III 1 L', 'Direção hidráulica e câmbio automático'],
  ['RAD25005P', 'Aditivo radiador pronto para uso rosa 1 L', 'Revisão do arrefecimento'],
  ['RAD25009P', 'Água desmineralizada 1 L', 'Venda junto com o aditivo'],
  ['FLU15002', 'Fluido de freio DOT 4 500 ml', 'Revisão de freio'],
  ['AER12000', 'Desengripante 300 ml', 'Uso doméstico e automotivo'],
  ['SIL3502', 'Silicone selante alta temperatura 50 g', 'Pequenos reparos']], [190, 400, 290], 10.5);

// 10 ─ apoio
s = content('Proposta', 'Parceria', 'Como a BAP apoia a venda na loja');
[['Exposição', 'Materiais de ponto de venda e encartelados para organizar a gôndola por uso: carro, moto, radiador e freio.'],
 ['Venda casada', 'Combinações simples para aumentar o ticket: óleo + aditivo, aditivo + água desmineralizada, fluido de freio na revisão.'],
 ['Equipe treinada', 'Apresentação rápida dos produtos para a equipe da loja: qual óleo para qual veículo e como indicar o aditivo certo.'],
 ['Garantia sem burocracia', 'O consumidor fala direto com a fábrica pelo SAC BAP. A loja não precisa intermediar.']].forEach(([a, b], i) => {
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
txt(s, 'APRESENTAÇÃO COMERCIAL', 62, 146, 400, 20, { fontSize: 12, bold: true, color: C.accent2, charSpacing: 3 });
txt(s, 'Obrigado!', 58, 170, 420, 70, { fontSize: 50, bold: true, color: C.background1 });
txt(s, 'Queremos construir com vocês uma parceria de longo prazo, levando lubrificantes e químicos BAP de qualidade às suas lojas, com apoio próximo do nosso time em cada etapa.', 62, 248, 420, 90, { fontSize: 15, color: 'CFD3CF' });
box(s, 62, 360, 420, 116, C.accent6, { r: 0.2, name: 'contato' });
txt(s, 'Alexandre Guerreiro', 84, 376, 380, 22, { fontSize: 17, bold: true, color: C.background1 });
txt(s, 'Gerente Comercial · BAP AUTOPARTS', 84, 400, 380, 18, { fontSize: 12, color: 'CFD3CF' });
txt(s, 'alexandre.guerreiro@bapautoparts.com.br', 84, 424, 380, 18, { fontSize: 13, color: C.accent2 });
txt(s, '(92) 99250-8980', 84, 446, 380, 18, { fontSize: 13, color: C.accent2 });
txt(s, 'www.bapautoparts.com.br  ·  @bapautoparts', 62, 496, 400, 18, { fontSize: 11, color: 'CFD3CF' });

(async () => {
  const out = 'saidas/BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pptx';
  await pres.writeFile({ fileName: out });
  if (applyTheme) await applyTheme(out, THEME);
  console.log('ok');
})();
