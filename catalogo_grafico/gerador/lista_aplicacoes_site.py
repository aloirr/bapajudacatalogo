"""Lista ANTES × DEPOIS dos itens que estavam sem aplicação e receberam a aplicação do catálogo online da BAP
(catalogobap.catalogofraga.com.br), 12/11/2026. Uso interno. Uso (dentro de gerador/):
    python lista_aplicacoes_site.py [saida.pdf]
"""
import sys, html, re, json, collections
import openpyxl
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Table, TableStyle, Spacer, PageBreak)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import moto
import site_aplicacoes as S

OUT = sys.argv[1] if len(sys.argv) > 1 else 'saidas/Aplicacoes_Catalogo_Online_Antes_Depois_12112026.pdf'
for n, f in [('PR', 'Poppins-Regular'), ('PM', 'Poppins-Medium'), ('PB', 'Poppins-Bold')]:
    pdfmetrics.registerFont(TTFont(n, 'fontes/' + f + '.ttf'))
pdfmetrics.registerFontFamily('PR', normal='PR', bold='PB', italic='PR', boldItalic='PB')
VERDE, VERDE2, PRETO, CINZA, CLARO, VERM = colors.HexColor('#3dae49'), colors.HexColor('#1f6b2c'), colors.HexColor('#141514'), \
    colors.HexColor('#5b5f5b'), colors.HexColor('#eef4ec'), colors.HexColor('#a8200d')
st = lambda n, **k: ParagraphStyle(n, fontName=k.pop('f', 'PR'), fontSize=k.pop('s', 7.4), leading=k.pop('l', 9.6), **k)
P_COD, P_TXT, P_ANT, P_SM = st('c', f='PB', s=8.4, l=10.4), st('t'), st('a', textColor=CINZA), st('sm', s=6.6, l=8.4, textColor=CINZA)
P_H = st('h', f='PB', s=7.4, l=9, textColor=colors.white)
P_T1, P_T2, P_N = st('t1', f='PB', s=20, l=24), st('t2', f='PB', s=12, l=15, textColor=VERDE2), st('n', s=9.5, l=13.5)

# ---------------------------------------------------------------- dados
SITE = S.carregar()
LIN = {}
for f in moto.FAMS:
    if f.get('moto'): continue
    for r in f['rows']:
        if r.get('_fonte_apl') == 'site': LIN[r['code']] = (f['name'], r)
wb = openpyxl.load_workbook('saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v11.xlsx', read_only=True)
B11 = {r[0]: r for r in wb['PRODUTOS'].iter_rows(min_row=2, values_only=True)}
wb13 = openpyxl.load_workbook('saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v13.xlsx', read_only=True)
B13 = {r[0]: r for r in wb13['PRODUTOS'].iter_rows(min_row=2, values_only=True)}
SEM = [(f['name'], r) for f in moto.FAMS if not f.get('moto') and not f.get('spec') for r in f['rows'] if not r.get('segs')]
NOTA = {
    'FLU6186': 'Filtro de óleo de MOTO: entrou também em Filtros Moto (Linha Moto).',
    'FLU6240': 'Filtro de óleo de MOTO: entrou também em Filtros Moto (Linha Moto).',
    'FHD6087': 'Cadastro diz "filtro hidráulico"; o site diz "filtro de óleo do câmbio" (Scania). Conferir.',
    'CIL8522': 'O site diz CILINDRO MESTRE DE FREIO; no catálogo está na linha Cilindro de Roda. Conferir.',
    'CIL8542': 'O site diz CILINDRO MESTRE DE FREIO; no catálogo está na linha Cilindro de Roda. Conferir.',
    'KAP119301': 'O site diz KIT DE REPARO DO AMORTECEDOR (linha Kit Batente no catálogo).',
    'KAP11985': 'O site diz KIT DE REPARO DO AMORTECEDOR (linha Kit Batente no catálogo).',
    'BAR15001': 'O site diz BRAÇO PITMAN (linha Caixa de Direção no catálogo).',
    'BAR15002': 'O site diz BRAÇO AUXILIAR (linha Caixa de Direção no catálogo).',
    'BAR15012': 'O site diz BRAÇO AUXILIAR (linha Caixa de Direção no catálogo).',
    'BAR15005': 'O site diz BARRA DE DIREÇÃO (linha Caixa de Direção no catálogo).',
}


def mk(segs):
    out = []
    for t, b in segs:
        out.append(f'<b>{html.escape(t)}</b>' if b else html.escape(t))
    return ''.join(out).strip(' ·')


def txt(v):
    return '' if v is None else str(v).strip()


ORDEM = ['Filtros', 'Amortecedores', 'Kit Batente de Amortecedor', 'Pivô de Suspensão', 'Bieletas', 'Caixa de Direção',
         'Semi-Eixo Homocinético', 'Sapata de Freio', 'Cilindro de Roda', 'Sensor ABS', 'Palhetas Limpa-Parabrisa']
grupos = collections.OrderedDict((k, []) for k in ORDEM)
for c, (linha, r) in sorted(LIN.items()):
    grupos.setdefault(linha, []).append((c, r))


# ---------------------------------------------------------------- páginas
def deco(c, doc):
    W, H = landscape(A4)
    c.saveState()
    c.setFillColor(PRETO); c.rect(0, H - 13 * mm, W, 13 * mm, fill=1, stroke=0)
    c.setFillColor(VERDE); c.setFont('PB', 9.5)
    c.drawString(12 * mm, H - 8.5 * mm, 'BAP AUTOPARTS  ·  APLICAÇÕES DO CATÁLOGO ONLINE  ·  ANTES × DEPOIS')
    c.setFillColor(colors.white); c.setFont('PR', 8)
    c.drawRightString(W - 12 * mm, H - 8.5 * mm, '12/11/2026')
    c.setFillColor(CINZA); c.setFont('PB', 7)
    c.drawString(12 * mm, 7 * mm, 'USO INTERNO E CONFIDENCIAL')
    c.setFont('PR', 7)
    c.drawString(12 * mm + pdfmetrics.stringWidth('USO INTERNO E CONFIDENCIAL', 'PB', 7), 7 * mm,
                 ' — material exclusivo do time BAP. Fonte: catalogobap.catalogofraga.com.br')
    c.drawRightString(W - 12 * mm, 7 * mm, f'{doc.page}')
    c.restoreState()


doc = BaseDocTemplate(OUT, pagesize=landscape(A4), leftMargin=12 * mm, rightMargin=12 * mm, topMargin=18 * mm, bottomMargin=13 * mm,
                      title='Aplicações do catálogo online — antes × depois (uso interno)', author='BAP AUTOPARTS')
doc.addPageTemplates([PageTemplate('p', [Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f')], onPage=deco)])
CW = doc.width
COLS = [24 * mm, 46 * mm, 50 * mm, CW - 120 * mm]
story = []

# resumo
n_tot = sum(len(v) for v in grupos.values())
n_ref = sum(1 for v in grupos.values() for c, r in v if r.get('refs') and r['refs'] != (r.get('_refs_antes') or '') and r['refs'] not in ('—', ''))
story += [Paragraph('Itens sem aplicação: antes × depois', P_T1), Spacer(0, 3 * mm),
          Paragraph(f'Busca no catálogo online da BAP (<b>catalogobap.catalogofraga.com.br</b>) de todos os itens que apareciam no catálogo como '
                    f'"Aplicação em cadastro". <b>{n_tot} itens ganharam aplicação</b> ({n_ref} também ganharam equivalência) e '
                    f'<b>{len(SEM)} não estão no site</b> (lista no fim). A aplicação vem resumida por montadora, veículo e motor (cilindrada e válvulas), '
                    f'com o primeiro e o último ano do site; quando o site vai até 2026, ficou "em Diante" [SUPOSIÇÃO].', P_N), Spacer(0, 4 * mm)]
res = [[Paragraph('LINHA DO CATÁLOGO', P_H), Paragraph('ITENS COM APLICAÇÃO NOVA', P_H), Paragraph('NÃO ACHADOS NO SITE', P_H)]]
nao = collections.Counter(l for l, r in SEM)
for k, v in grupos.items():
    if v or nao.get(k): res.append([Paragraph(k, P_TXT), Paragraph(str(len(v)), P_TXT), Paragraph(str(nao.get(k, 0)), P_TXT)])
for k in nao:
    if k not in grupos: res.append([Paragraph(k, P_TXT), Paragraph('0', P_TXT), Paragraph(str(nao[k]), P_TXT)])
res.append([Paragraph('<b>Total</b>', P_TXT), Paragraph(f'<b>{n_tot}</b>', P_TXT), Paragraph(f'<b>{len(SEM)}</b>', P_TXT)])
t = Table(res, colWidths=[80 * mm, 55 * mm, 45 * mm])
t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), PRETO), ('LINEBELOW', (0, 1), (-1, -1), .4, colors.HexColor('#dfe2dc')),
                       ('BACKGROUND', (0, -1), (-1, -1), CLARO), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                       ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
story += [t, Spacer(0, 5 * mm),
          Paragraph('<b>Como ler:</b> ANTES = o que o catálogo e a base mostravam (aplicação vazia, "Aplicação em cadastro"). '
                    'DEPOIS = aplicação e equivalência que passaram a constar nos catálogos 2027 e na base v13. '
                    'Achados para conferir no cadastro aparecem em vermelho embaixo do código.', P_N),
          Paragraph('<b>Já atualizado:</b> catálogos 2027 (digital, A4 e Linha Moto) e base v13.', P_N), PageBreak()]

HEAD = [Paragraph(h, P_H) for h in ('CÓDIGO', 'PRODUTO (SITE)', 'ANTES', 'DEPOIS — APLICAÇÃO E EQUIVALÊNCIA')]
for linha, itens in grupos.items():
    if not itens: continue
    story += [Paragraph(f'{linha} — {len(itens)} {"item" if len(itens) == 1 else "itens"}', P_T2), Spacer(0, 2 * mm)]
    rows = [HEAD]
    for c, r in itens:
        b11 = B11.get(c) or [None] * 18
        b13 = B13.get(c) or [None] * 18
        s = SITE.get(c.upper(), {})
        tit = s.get('titulo') or txt(b11[1])
        tit = re.sub(r'\s*BAP - \S+$', '', tit)
        cod = Paragraph(html.escape(c), P_COD)
        cel_cod = [cod]
        if c in NOTA: cel_cod.append(Paragraph(f'<font color="#a8200d">{html.escape(NOTA[c])}</font>', P_SM))
        prod = [Paragraph(html.escape(tit.capitalize()), P_TXT), Paragraph('Cadastro: ' + html.escape(txt(b11[1]).capitalize()), P_SM)]
        ref_a = txt(r.get('_refs_antes')) or txt(b11[3]) or '—'
        antes = [Paragraph('<b>Sem aplicação</b> (catálogo: "Aplicação em cadastro")', P_ANT),
                 Paragraph('Equivalência: ' + html.escape(ref_a if ref_a not in ('—', '-') else '—'), P_ANT)]
        if b11[9] and b13[9] and b11[9] != b13[9]:
            antes.append(Paragraph(f'Linha na base: {html.escape(txt(b11[9]))}', P_ANT))
        dep = [Paragraph(mk(r['segs']), P_TXT)]
        ref_d = r.get('refs') or '—'
        dep.append(Paragraph('<font color="#1f6b2c"><b>Equivalência:</b> ' + html.escape(ref_d) + '</font>', P_SM))
        extra = []
        if b11[9] and b13[9] and b11[9] != b13[9]: extra.append(f'Linha: de {b11[9]} para {b13[9]}')
        if r.get('extra') and r['extra'] != '—': extra.append(f'Ofereça junto: {r["extra"]}')
        if extra: dep.append(Paragraph('<font color="#1f6b2c">' + html.escape(' · '.join(extra)) + '</font>', P_SM))
        rows.append([cel_cod, prod, antes, dep])
    t = Table(rows, colWidths=COLS, repeatRows=1, splitInRow=1)
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), PRETO), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                           ('LINEBELOW', (0, 1), (-1, -1), .4, colors.HexColor('#dfe2dc')),
                           ('BACKGROUND', (2, 1), (2, -1), colors.HexColor('#f7f8f6')),
                           ('TOPPADDING', (0, 0), (-1, -1), 3.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                           ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4)]))
    story += [t, Spacer(0, 6 * mm)]

# não achados
story += [PageBreak(), Paragraph(f'Não encontrados no catálogo online — {len(SEM)} itens', P_T2), Spacer(0, 1.5 * mm),
          Paragraph('Buscados pelo código exato e por parte do código. Continuam como "Aplicação em cadastro" nos catálogos. '
                    'Caminho: catálogo do fornecedor (catracas, cilindros de roda) ou conferência do cadastro.', P_N), Spacer(0, 3 * mm)]
rows = [[Paragraph(h, P_H) for h in ('CÓDIGO', 'LINHA DO CATÁLOGO', 'DESCRIÇÃO NO CADASTRO', 'OBSERVAÇÃO')]]
OBS = {'KAP114951': 'Está no site, mas marcado "sem aplicação no catálogo".', 'BAR15035': 'Tirante da barra estabilizadora; pendência antiga de classificação (parece SUSPENSÃO).',
       'CXD13200': 'Mecanismo de caixa de direção mecânica.'}
for linha, r in sorted(SEM, key=lambda x: (x[0], x[1]['code'])):
    b = B11.get(r['code']) or [None] * 18
    obs = OBS.get(r['code'], 'Sem estoque (entrou pelo cadastro)' if r.get('sem_estoque') else '')
    rows.append([Paragraph(html.escape(r['code']), P_COD), Paragraph(html.escape(linha), P_TXT),
                 Paragraph(html.escape(txt(b[1])), P_TXT), Paragraph(html.escape(obs), P_SM)])
t = Table(rows, colWidths=[28 * mm, 50 * mm, 110 * mm, CW - 188 * mm], repeatRows=1)
t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), PRETO), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                       ('LINEBELOW', (0, 1), (-1, -1), .4, colors.HexColor('#dfe2dc')),
                       ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3)]))
story.append(t)
doc.build(story)
print(OUT, n_tot, len(SEM))
