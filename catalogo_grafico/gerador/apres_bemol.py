import html, json, os
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FD = 'fontes/'
for n, f in [('PR', 'Poppins-Regular'), ('PM', 'Poppins-Medium'), ('PB', 'Poppins-Bold')]:
    pdfmetrics.registerFont(TTFont(n, FD + f + '.ttf'))
pdfmetrics.registerFontFamily('PR', normal='PR', bold='PB', italic='PR', boldItalic='PB')

W, H = 960, 540
C = dict(black='#141514', ink='#1a1c1a', sec='#4d514d', grey='#7a7f7a', green='#3dae49', green2='#5cb85f', gdark='#1f7a32',
         hero='#eef4ec', line='#dfe2dc', zebra='#f6f8f5', white='#ffffff', card='#242624', orange='#f28c28', lgrey='#cfd3cf')
LOGO = 'dimg/capa_0.png'; LOGO_G = 'dimg/logo_grande.png'
LOGO_ESC = 'pptimg/logo_escuro.png'   # cabeçalho em fundo claro: o mesmo logo escuro do apres_ppt.js (MC-0010)
OIL = 'dimg/cover_26.png'
P = lambda c: f'pptimg/{c}.png'           # fotos já recortadas, as mesmas do apres_ppt.js (T-0023)
# textos da apresentação: um arquivo só, o mesmo do apres_ppt.js (RD-0431)
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apres_conteudo.json'), encoding='utf-8') as _f:
    K = json.load(_f)
_ic = {}


class S:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=(W, H)); self.n = 0
        self.c.setTitle(K['doc']['titulo']); self.c.setAuthor(K['doc']['autor'])

    def Y(self, y): return H - y

    def rect(self, x, y, w, h, fill=None, stroke=None, r=0, sw=1):
        c = self.c
        if fill: c.setFillColor(HexColor(C[fill]))
        if stroke: c.setStrokeColor(HexColor(C[stroke])); c.setLineWidth(sw)
        if r: c.roundRect(x, self.Y(y + h), w, h, r, stroke=1 if stroke else 0, fill=1 if fill else 0)
        else: c.rect(x, self.Y(y + h), w, h, stroke=1 if stroke else 0, fill=1 if fill else 0)

    def circle(self, cx, cy, r, fill):
        self.c.setFillColor(HexColor(C[fill])); self.c.circle(cx, self.Y(cy), r, stroke=0, fill=1)

    def t(self, x, y, s, size, color='ink', font='PB', align='left', ls=0):
        w = pdfmetrics.stringWidth(s, font, size) + ls * len(s)
        if align == 'right': x -= w
        elif align == 'center': x -= w / 2
        o = self.c.beginText(); o.setFont(font, size); o.setCharSpace(ls); o.setFillColor(HexColor(C[color]))
        o.setTextOrigin(x, self.Y(y + .95 * size)); o.textLine(s); o.setCharSpace(0); self.c.drawText(o)
        return w

    def p(self, x, y, w, mk, size, lead, color='sec', font='PR', align=0):
        pp = Paragraph(mk, ParagraphStyle('x', fontName=font, fontSize=size, leading=lead, textColor=HexColor(C[color]), alignment=align))
        pw, ph = pp.wrap(w, 1e5); pp.drawOn(self.c, x, self.Y(y) - ph); return ph

    def img(self, path, x, y, w, h):
        if path not in _ic:
            im = Image.open(path).convert('RGBA')
            bb = im.getchannel('A').getbbox()
            if bb: im = im.crop(bb)
            _ic[path] = im
        im = _ic[path]; iw, ih = im.size; k = min(w / iw, h / ih); dw, dh = iw * k, ih * k
        self.c.drawImage(ImageReader(im), x + (w - dw) / 2, self.Y(y + (h + dh) / 2), dw, dh, mask='auto')

    def header(self, kicker, title):
        self.rect(0, 0, W, 6, fill='green')
        self.img(LOGO_ESC, 40, 26, 22, 30)
        self.t(72, 34, K['marca'], 8.5, 'gdark', 'PB', ls=1.6)
        self.t(40, 66, kicker.upper(), 10, 'green', 'PB', ls=1.6)
        self.t(38, 84, title, 30, 'ink', 'PB', ls=-.5)

    def footer(self):
        self.n += 1
        self.rect(40, H - 34, W - 80, .8, fill='line')
        self.t(40, H - 26, K['site'], 8.5, 'grey', 'PR')
        self.t(W - 40, H - 26, f'{self.n:02d}', 9, 'gdark', 'PB', 'right')
        self.c.showPage()


def table(s, x, y, cols, rows, widths, size=10.5, rowh=None, head='black'):
    s.rect(x, y, sum(widths), 26, fill=head, r=6)
    xx = x + 12
    for c_, w in zip(cols, widths):
        s.t(xx, y + 8, c_.upper(), 8, 'white', 'PB', ls=1); xx += w
    y += 30
    for i, r in enumerate(rows):
        hs = [s.p(0, 0, w - 18, html.escape(str(v)), size, size * 1.3) if False else 0 for v, w in zip(r, widths)]
        from reportlab.platypus import Paragraph as _P
        h = max(_P(html.escape(str(v)), ParagraphStyle('m', fontName='PR', fontSize=size, leading=size * 1.3)).wrap(w - 18, 1e5)[1] for v, w in zip(r, widths)) + 12
        if rowh: h = max(h, rowh)
        if i % 2 == 0: s.rect(x, y, sum(widths), h, fill='zebra', r=4)
        xx = x + 12
        for j, (v, w) in enumerate(zip(r, widths)):
            s.p(xx, y + 6, w - 18, ('<b>%s</b>' % html.escape(str(v))) if j == 0 else html.escape(str(v)), size, size * 1.3, 'ink' if j == 0 else 'sec', 'PR')
            xx += w
        y += h
    return y


def build(out):
    s = S(out)
    # 1 ─ capa
    k = K['capa']
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 80, 300, 330, 'green'); s.circle(W - 100, 300, 250, 'green2'); s.circle(W - 100, 300, 185, 'black')
    s.img(LOGO, 60, 52, 46, 64)
    s.t(62, 150, k['sobretitulo'], 11, 'green2', 'PB', ls=2)
    s.t(58, 172, k['titulo'][0], 50, 'white', 'PB', ls=-1)
    s.t(58, 228, k['titulo'][1], 50, 'white', 'PB', ls=-1)
    s.p(62, 300, 400, k['texto'], 13, 19, 'lgrey')
    s.t(62, 470, k['data'], 10, 'lgrey', 'PM')
    s.rect(560, 150, 300, 230, fill='white', r=22)
    s.img(OIL, 575, 160, 270, 210)
    for i, c_ in enumerate(k['fotos']):
        x = 560 + i * 77
        s.rect(x, 392, 69, 80, fill='white', r=12); s.img(P(c_), x + 6, 398, 57, 68)
    s.c.showPage(); s.n += 1

    # 2 ─ quem é a BAP
    k = K['quem_somos']
    s.header(k['sobretitulo'], k['titulo'])
    s.p(40, 132, 560, k['texto'], 13, 20, 'sec')
    tiles = k['numeros']
    tw = (880 - 16 * (len(tiles) - 1)) / len(tiles)       # a garantia fica só na caixa de baixo (RD-0430)
    for i, (a, b) in enumerate(tiles):
        x = 40 + i * (tw + 16)
        s.rect(x, 250, tw, 130, fill='black', r=16)
        s.t(x + tw / 2, 280, a, 32, 'green2', 'PB', 'center'); s.t(x + tw / 2, 334, b, 11, 'white', 'PR', 'center')
    s.rect(40, 404, 880, 70, fill='hero', r=14); s.rect(40, 404, 5, 70, fill='green')
    s.t(62, 418, k['garantia'][0], 9, 'gdark', 'PB', ls=1.4)
    s.p(62, 438, 820, k['garantia'][1], 11.5, 16, 'ink')
    s.footer()

    # 3 ─ portfólio em números
    k = K['portfolio']
    s.header(k['sobretitulo'], k['titulo'])
    for i, (a, b, c_) in enumerate(k['blocos']):
        x = 40 + (i % 3) * 296; y = 136 + (i // 3) * 176
        s.rect(x, y, 280, 160, fill='white', stroke='line', r=16)
        s.rect(x, y, 280, 6, fill='green', r=3)
        s.t(x + 18, y + 22, a, 15, 'ink', 'PB'); s.t(x + 18, y + 46, b.upper(), 9, 'gdark', 'PB', ls=1.2)
        s.p(x + 18, y + 70, 244, c_, 11, 16, 'sec')
    s.footer()

    # 4 ─ óleos de motor
    k = K['oleos_motor']
    s.header(k['sobretitulo'], k['titulo'])
    table(s, 40, 126, k['colunas'], k['linhas'], [170, 170, 120, 150, 90], 10, rowh=34)
    s.rect(762, 126, 158, 330, fill='hero', r=16); s.img(OIL, 770, 140, 142, 160)
    s.p(776, 316, 130, k['lado'][0], 10.5, 15, 'ink', 'PM')
    s.p(776, 370, 130, k['lado'][1], 9.5, 13.5, 'sec')
    s.footer()

    # 5 ─ moto 4T
    k = K['moto']
    s.header(k['sobretitulo'], k['titulo'])
    y = table(s, 40, 126, k['colunas'], k['linhas'], [170, 180, 130, 160, 80], 11, rowh=40)
    s.rect(40, y + 26, 880, 120, fill='black', r=16)
    s.t(64, y + 46, k['argumento'][0], 9, 'green2', 'PB', ls=1.4)
    s.p(64, y + 68, 560, k['argumento'][1], 12, 18, 'white')
    s.img(OIL, 690, y + 36, 210, 100)
    s.footer()

    # 6 ─ transmissão e hidráulico
    k = K['transmissao']
    s.header(k['sobretitulo'], k['titulo'])
    table(s, 40, 126, k['colunas'], k['linhas'], [190, 220, 330, 140], 10.5, rowh=40)
    s.footer()

    # 7 ─ arrefecimento
    k = K['radiador']
    s.header(k['sobretitulo'], k['titulo'])
    for i, (c_, a, b) in enumerate(k['cartoes']):
        x = 40 + i * 178
        s.rect(x, 126, 166, 300, fill='white', stroke='line', r=16)
        s.img(P(c_), x + 18, 138, 130, 150)
        s.t(x + 14, 300, c_, 12, 'ink', 'PB'); s.p(x + 14, 322, 140, a, 10, 14, 'sec'); s.p(x + 14, 378, 140, b, 9, 13, 'gdark', 'PM')
    s.p(40, 444, 880, ' '.join(f'<b>{a}</b> {b}' for a, b in k['nota']), 11, 16, 'sec')
    s.footer()

    # 8 ─ freio e manutenção
    k = K['freio']; selo = k['selo']
    s.header(k['sobretitulo'], k['titulo'])
    for i, (c_, a, b) in enumerate(k['cartoes']):
        x = 40 + i * 126.5
        s.rect(x, 126, 118, 290, fill='white', stroke='line', r=14)
        if c_ in selo['numero']:      # sem foto do produto: selo com a especificação
            s.rect(x + 14, 140, 90, 120, fill='black', r=12)
            s.t(x + 59, 168, selo['rotulo'], 16, 'green2', 'PB', 'center'); s.t(x + 59, 190, selo['numero'][c_], 40, 'white', 'PB', 'center')
            s.t(x + 59, 240, selo['legenda'], 6.5, 'lgrey', 'PB', 'center', ls=.6)
        else:
            s.img(P(c_), x + 10, 136, 98, 130)
        s.t(x + 10, 278, c_, 10, 'ink', 'PB'); s.p(x + 10, 296, 100, a, 9, 12.5, 'sec'); s.p(x + 10, 372, 100, b, 8.5, 12, 'gdark', 'PM')
    s.footer()

    # 9 ─ mix de entrada
    k = K['mix']
    s.header(k['sobretitulo'], k['titulo'])
    table(s, 40, 120, k['colunas'], k['linhas'], [190, 400, 290], 9.5, rowh=30)
    s.footer()

    # 10 ─ como a BAP apoia
    k = K['apoio']
    s.header(k['sobretitulo'], k['titulo'])
    for i, (a, b) in enumerate(k['itens']):
        x = 40 + (i % 2) * 444; y = 128 + (i // 2) * 164
        s.rect(x, y, 432, 148, fill='zebra', stroke='line', r=16)
        s.t(x + 22, y + 20, f'{i + 1:02d}', 26, 'green', 'PB')
        s.t(x + 74, y + 26, a, 15, 'ink', 'PB'); s.p(x + 74, y + 54, 336, b, 11, 16, 'sec')
    s.footer()

    # 11 ─ agradecimento e contato
    k = K['obrigado']; nome, cargo, email, fone = k['contato']
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 110, 280, 280, 'green'); s.circle(W - 125, 280, 215, 'green2'); s.circle(W - 125, 280, 160, 'black')
    s.img(LOGO_G, W - 125 - 62, 280 - 85, 124, 170)
    s.img(LOGO, 60, 52, 36, 50)
    s.t(62, 150, k['sobretitulo'], 11, 'green2', 'PB', ls=2)
    s.t(58, 178, k['titulo'], 54, 'white', 'PB', ls=-1)
    s.p(62, 252, 430, k['texto'], 14, 21, 'lgrey')
    s.rect(62, 366, 420, 112, fill='card', r=16); s.rect(62, 366, 5, 112, fill='green')
    s.t(84, 382, nome, 16, 'white', 'PB')
    s.t(84, 404, cargo, 10.5, 'lgrey', 'PR')
    s.t(84, 428, email, 11.5, 'green2', 'PM')
    s.t(84, 450, fone, 11.5, 'green2', 'PM')
    s.t(62, 500, K['site'], 10, 'lgrey', 'PR')
    s.c.showPage()
    s.c.save()

if __name__ == '__main__':
    build('saidas/BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf'); print('ok')
