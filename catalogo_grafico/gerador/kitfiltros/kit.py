import re, collections, sys, os, datetime
import pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import parse
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Table, TableStyle, Spacer,
                                KeepTogether, NextPageTemplate, PageBreak, Image)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm

G = '/home/claude/catalogo/gerador/'
for n, f in [('PR', 'Poppins-Regular.ttf'), ('PM', 'Poppins-Medium.ttf'), ('PB', 'Poppins-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(n, G + 'fontes/' + f))
VERDE = colors.HexColor('#62BB47'); PRETO = colors.HexColor('#1D1D1B'); CINZA = colors.HexColor('#6B6F6B')
CLARO = colors.HexColor('#EEF6EA'); LINHA = colors.HexColor('#D9DED8'); ZEBRA = colors.HexColor('#F6F7F6')
W, H = A4
MX = 10 * mm

PES_LINHAS = {'CARGO', 'AXOR', 'ATEGO', 'ACCELO', 'ACTROS', 'ATRON', 'WORKER', 'CONSTELLATION', 'DELIVERY', 'TECTOR',
              'STRALIS', 'EUROCARGO', 'VERTIS', 'HI-WAY', 'TRAKKER', 'VOLARE', 'METEOR'}
MARCA_PESADA = {'SCANIA', 'VOLVO', 'IVECO', 'AGRALE', 'DAF', 'INTERNATIONAL', 'MAN', 'MARCOPOLO', 'CUMMINS', 'MWM', 'PERKINS'}
TIPOS = ['AR', 'ÓLEO', 'COMBUSTÍVEL', 'CABINE']
MONT = {'VW': 'Volkswagen', 'GM': 'Chevrolet', 'MB': 'Mercedes-Benz'}


def chave(r):
    w = r['mod'].split()
    if len(w) >= 2 and re.match(r'^[\d-]+$', w[0]) and parse.N(w[1]) in PES_LINHAS:
        return w[1].title(), w[0]
    if len(w) >= 2 and re.match(r'^[\d-]{3,}$', w[0]):          # MB 1620, VW 8-100: o número é a versão
        return 'Caminhões', w[0]
    return r['base'], r['motor']


def anos_txt(a):
    if not a: return ''
    i, f = a
    if i <= 1960 and f >= 2026: return 'todos'
    if i <= 1960: return f'até {f}'
    if f >= 2026: return f'{i}>'
    return str(i) if i == f else f'{i}–{f}'


def ref_txt(s):
    m = re.search(r'TECFIL[:\s]+([A-Z0-9-]+)', str(s), re.I)
    if m: return 'Tecfil ' + m.group(1)
    m = re.search(r'([A-Z][A-Za-z]+)[:\s]+([A-Z0-9-]{4,})', str(s))
    return f'{m.group(1).title()} {m.group(2)}' if m else ''


def montar():
    f, d = parse.carregar()
    d[['grp', 'ver']] = pd.DataFrame([chave(r) for _, r in d.iterrows()], index=d.index)
    d['grp'] = d.grp.str.strip(' .,-')
    kit = collections.OrderedDict()
    for _, r in d.iterrows():
        k = (r.mont, r.grp, r.ver)
        e = kit.setdefault(k, {'linhas': set(), 'tipos': collections.defaultdict(dict)})
        e['linhas'].add(r.linha)
        a = r.anos
        cel = e['tipos'][r.tipo].setdefault(r.cod, {'ref': ref_txt(r.refs), 'anos': None})
        if isinstance(a, tuple):
            cel['anos'] = a if not cel['anos'] else (min(cel['anos'][0], a[0]), max(cel['anos'][1], a[1]))
    linhas = []
    for (mont, grp, ver), e in kit.items():
        if len(e['tipos']) < 2:
            continue
        pes = (mont in MARCA_PESADA or parse.N(grp) in PES_LINHAS or grp == 'Caminhões' or e['linhas'] == {'PESADA'})
        if e['linhas'] == {'LEVE'}: pes = False
        linhas.append(dict(sec='PESADA' if pes else 'LEVE', mont=mont, grp=grp, ver=ver, tipos=e['tipos']))
    return f, d, linhas


ST = {
    'cod': ParagraphStyle('cod', fontName='PB', fontSize=7.2, leading=8.4, textColor=PRETO),
    'cel': ParagraphStyle('cel', fontName='PR', fontSize=5.9, leading=7.1, textColor=CINZA),
    'mod': ParagraphStyle('mod', fontName='PB', fontSize=7.4, leading=8.6, textColor=PRETO),
    'ver': ParagraphStyle('ver', fontName='PM', fontSize=7, leading=8.4, textColor=PRETO),
    'th': ParagraphStyle('th', fontName='PB', fontSize=6.2, leading=7.4, textColor=colors.white),
    'mont': ParagraphStyle('mont', fontName='PB', fontSize=10, leading=12, textColor=PRETO),
    'txt': ParagraphStyle('txt', fontName='PR', fontSize=9.5, leading=13.5, textColor=PRETO),
}


def celula(dic):
    if not dic:
        return Paragraph('<font color="#B9BDB8">—</font>', ST['cel'])
    partes = []
    for cod, v in sorted(dic.items(), key=lambda x: (x[1]['anos'] or (0, 0))):
        a = anos_txt(v['anos'])
        ref = re.sub(r'(?i)^tecfil\s*', '', v['ref'] or '')
        l1 = f'<font name="PB" size="7.2" color="#1D1D1B">{cod}</font>'
        if ref: l1 += f' <font color="#4F534F">{ref}</font>'
        if a: l1 += f' <font name="PM" color="#1D1D1B">{a}</font>'
        partes.append(l1)
    return Paragraph('<br/>'.join(partes), ST['cel'])


def logo(c, x, y, h):
    try:
        c.drawImage(G + 'dimg/logo_grande.png', x, y, height=h, width=h * 2.2, preserveAspectRatio=True, mask='auto', anchor='sw')
    except Exception:
        c.setFont('PB', 14); c.setFillColor(colors.white); c.drawString(x, y + 4, 'BAP')


def topo(c, doc):
    c.saveState()
    c.setFillColor(PRETO); c.rect(0, H - 11 * mm, W, 11 * mm, stroke=0, fill=1)
    c.setFillColor(VERDE); c.rect(0, H - 11.8 * mm, W, 0.8 * mm, stroke=0, fill=1)
    logo(c, MX, H - 9 * mm, 7 * mm)
    c.setFillColor(colors.white); c.setFont('PB', 8.5)
    c.drawRightString(W - MX, H - 6.8 * mm, 'KIT FILTROS BAP · ' + ('LINHA PESADA' if getattr(doc, 'sec', 'LEVE') == 'PESADA' else 'LINHA LEVE'))
    c.setFillColor(PRETO); c.rect(0, 0, W, 8 * mm, stroke=0, fill=1)
    c.setFillColor(colors.white); c.setFont('PM', 7)
    c.drawString(MX, 3 * mm, 'www.bapautoparts.com.br')
    c.setFont('PR', 6); c.setFillColor(CINZA)
    c.drawString(MX, 9.3 * mm, 'Confirme sempre a aplicação pelo filtro original ou pelo manual do veículo. Imagens ilustrativas.')
    c.setFont('PR', 7); c.setFillColor(colors.HexColor('#C8CCC7')); c.drawRightString(W - MX - 9 * mm, 3 * mm, CONTATO)
    c.setFillColor(VERDE); c.setFont('PB', 9); c.drawRightString(W - MX, 3 * mm, f'{doc.page:02d}')
    c.restoreState()


CONTATO = 'Alexandre Guerreiro · Gerente Comercial · alexandre.guerreiro@bapautoparts.com.br · (92) 99250-8980'


def capa(c, doc):
    c.saveState()
    c.setFillColor(PRETO); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(VERDE); c.rect(0, H * 0.42, W, 2 * mm, stroke=0, fill=1)
    logo(c, MX, H - 34 * mm, 20 * mm)
    c.setFillColor(VERDE); c.setFont('PB', 13); c.drawString(MX, H - 58 * mm, 'FILTROS BAP')
    c.setFillColor(colors.white); c.setFont('PB', 46); c.drawString(MX, H - 78 * mm, 'Kit Filtros')
    c.setFont('PR', 15); c.setFillColor(colors.HexColor('#DADDD9'))
    c.drawString(MX, H - 90 * mm, 'Ar, óleo, combustível e cabine')
    c.drawString(MX, H - 98 * mm, 'no mesmo kit, para cada veículo.')
    try:
        c.drawImage(G + 'dimg/cover_34.png', W * 0.36, H * 0.43 + 4 * mm, width=W * 0.6, height=H * 0.22, preserveAspectRatio=True, mask='auto')
    except Exception:
        pass
    y = H * 0.42 - 16 * mm
    c.setFillColor(colors.white); c.setFont('PB', 13); c.drawString(MX, y, 'Por que trocar os filtros juntos?')
    itens = [('Motor protegido', ['Ar e óleo limpos reduzem', 'o desgaste do motor.']),
             ('Economia', ['Combustível filtrado evita falhas', 'de injeção e consumo alto.']),
             ('Conforto e saúde', ['O filtro de cabine segura poeira', 'e pólen do ar-condicionado.']),
             ('Uma parada só', ['Na troca de óleo, o kit completo', 'resolve tudo de uma vez.'])]
    y -= 12 * mm
    for i, (t, s) in enumerate(itens):
        x = MX + (i % 2) * (W - 2 * MX) / 2; yy = y - (i // 2) * 22 * mm
        c.setFillColor(VERDE); c.circle(x + 3 * mm, yy + 1.5 * mm, 1.8 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white); c.setFont('PB', 10.5); c.drawString(x + 8 * mm, yy, t)
        c.setFont('PR', 8.5); c.setFillColor(colors.HexColor('#C8CCC7'))
        for j, linha in enumerate(s): c.drawString(x + 8 * mm, yy - (5 + 4 * j) * mm, linha)
    y -= 48 * mm
    c.setFillColor(colors.white); c.setFont('PB', 13); c.drawString(MX, y, 'Como consultar')
    passos = ['Escolha a linha (leve ou pesada) e a montadora.', 'Ache o modelo e o motor do veículo.',
              'Cada filtro traz numa linha: código BAP, equivalente Tecfil e anos de aplicação.']
    for i, p in enumerate(passos):
        c.setFillColor(VERDE); c.setFont('PB', 11); c.drawString(MX, y - (10 + 7 * i) * mm, f'{i + 1}')
        c.setFillColor(colors.HexColor('#DADDD9')); c.setFont('PR', 9.5); c.drawString(MX + 7 * mm, y - (10 + 7 * i) * mm, p)
    c.setFillColor(VERDE); c.rect(0, 0, W, 17 * mm, stroke=0, fill=1)
    c.setFillColor(PRETO); c.setFont('PB', 9); c.drawString(MX, 10.5 * mm, 'Contato comercial')
    c.setFont('PR', 9); c.drawString(MX, 5 * mm, CONTATO)
    c.setFont('PB', 8); c.drawRightString(W - MX, 10.5 * mm, 'www.bapautoparts.com.br  ·  @bapautoparts')
    c.restoreState()


class Doc(BaseDocTemplate):
    def handle_flowable(self, flowables):
        f = flowables[0] if flowables else None
        if getattr(f, '_sec', None):
            self.sec = f._sec
        super().handle_flowable(flowables)


class Marca(Spacer):
    def __init__(self, sec):
        super().__init__(0, 0); self._sec = sec


def secao_titulo(txt, sub):
    t = Table([[Paragraph(f'<font name="PB" size="15" color="#1D1D1B">{txt}</font>', ParagraphStyle('t', parent=ST['txt'], leading=18))],
               [Paragraph(sub, ST['txt'])]], colWidths=[W - 2 * MX])
    t.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, 0), 2, VERDE), ('BOTTOMPADDING', (0, 0), (-1, 0), 4), ('TOPPADDING', (0, 1), (-1, 1), 3), ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
    return t


def construir(saida):
    f, d, linhas = montar()
    doc = Doc(saida, pagesize=A4, leftMargin=MX, rightMargin=MX, topMargin=22 * mm, bottomMargin=18 * mm,
              title='Kit Filtros BAP', author='BAP Auto Parts')
    fr = Frame(MX, 13 * mm, W - 2 * MX, H - 29 * mm, id='f', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate('capa', frames=[Frame(0, 0, W, H, id='c')], onPage=capa),
                          PageTemplate('miolo', frames=[fr], onPage=topo)])
    cw = [27 * mm, 13 * mm]
    resto = (W - 2 * MX - sum(cw)) / 4
    cw += [resto] * 4
    SUBH = '<br/><font name="PR" size="5.2" color="#BFC4BE">BAP · Tecfil · anos</font>'
    head = [Paragraph(x, ST['th']) for x in ['MODELO', 'MOTOR / VERSÃO']] + [Paragraph(x + SUBH, ST['th']) for x in ['FILTRO DE AR', 'FILTRO DE ÓLEO', 'FILTRO DE COMBUSTÍVEL', 'FILTRO DE CABINE']]
    story = [NextPageTemplate('miolo'), PageBreak()]
    stats = collections.Counter()
    for sec, titulo, sub in [('LEVE', 'Linha leve', 'Automóveis, picapes e utilitários.'),
                             ('PESADA', 'Linha pesada', 'Caminhões, ônibus e máquinas.')]:
        L = [r for r in linhas if r['sec'] == sec]
        if not L:
            continue
        if sec == 'PESADA':
            story.append(Spacer(0, 4 * mm))
        story += [Marca(sec), secao_titulo(titulo, sub), Spacer(0, 3 * mm)]
        por_mont = collections.defaultdict(list)
        for r in L:
            por_mont[r['mont']].append(r)
        for mont in sorted(por_mont, key=lambda m: MONT.get(m, m.title())):
            rows = sorted(por_mont[mont], key=lambda r: (r['grp'].upper(), [float(x) if re.match(r'^\d+(\.\d+)?$', x) else 0 for x in [r['ver'] or '0']], r['ver']))
            data = [head]
            ant = None
            for r in rows:
                data.append([Paragraph(r['grp'], ST['mod']), Paragraph(r['ver'] or '—', ST['ver'])]
                            + [celula(r['tipos'].get(t)) for t in TIPOS])
                ant = r['grp']
                stats[sec] += 1
                stats[(sec, len(r['tipos']))] += 1
            t = Table(data, colWidths=cw, repeatRows=1)
            sty = [('BACKGROUND', (0, 0), (-1, 0), PRETO), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                   ('TOPPADDING', (0, 0), (-1, -1), 2), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2),
                   ('LEFTPADDING', (0, 0), (-1, -1), 3.5), ('RIGHTPADDING', (0, 0), (-1, -1), 2.5),
                   ('LINEBELOW', (0, 1), (-1, -1), 0.4, LINHA), ('LINEBEFORE', (2, 1), (-1, -1), 0.4, LINHA)]
            for i in range(1, len(data)):
                if i % 2 == 0:
                    sty.append(('BACKGROUND', (0, i), (-1, i), ZEBRA))
            t.setStyle(TableStyle(sty))
            nome = MONT.get(mont, mont.title() if len(mont) > 3 else mont)
            hdr = Table([[Paragraph(nome.upper(), ST['mont']), Paragraph(f'<font color="#6B6F6B">{len(rows)} {"veículo" if len(rows) == 1 else "veículos"}</font>', ParagraphStyle('r', parent=ST['cel'], alignment=2, fontSize=7))]],
                        colWidths=[(W - 2 * MX) * 0.7, (W - 2 * MX) * 0.3])
            hdr.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), CLARO), ('LINEBEFORE', (0, 0), (0, 0), 3, VERDE),
                                     ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('TOPPADDING', (0, 0), (-1, -1), 2.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5)]))
            story += [KeepTogether([hdr, Spacer(0, 1 * mm), t]) if len(rows) <= 4 else hdr, ]
            if len(rows) > 4:
                story += [Spacer(0, 1 * mm), t]
            story.append(Spacer(0, 3 * mm))
    doc.build(story)
    return stats, len(f)


if __name__ == '__main__':
    s, nf = construir(sys.argv[1])
    print(dict(s), 'filtros usados', nf)
