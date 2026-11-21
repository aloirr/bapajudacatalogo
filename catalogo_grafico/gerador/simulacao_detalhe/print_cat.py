"""Catálogo BAP 2026 — versão impressa A4 para gráfica (CMYK, sangria 3 mm), no novo modelo por sistema."""
import re, html, collections
from PIL import Image
from reportlab.lib.colors import CMYKColor
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import moto as MO
import digital2 as D2
from digital2 import W, H, MX, CW, TOP, FOOT, HERO, S, lw, para_h
import taxo

M = MO.X.PF.M
STK = M.STK
FAMS = MO.FAMS
BPX = 3 * mm / S
CMYK = dict(black=(0, 0, 0, 1), ink=(0, 0, 0, .95), sec=(0, 0, 0, .75), grey=(0, 0, 0, .68), green=(.75, 0, 1, 0),
            green2=(.62, 0, .8, 0), gdark=(.8, .15, 1, .3), gtext=(.82, .2, 1, .38), hero=(.05, 0, .07, 0),
            heroline=(.12, 0, .14, .02), line=(0, 0, 0, .13), line2=(0, 0, 0, .11), zebra=(0, 0, 0, .03),
            white=(0, 0, 0, 0), lgrey=(0, 0, 0, .2), fgrey=(0, 0, 0, .25), otag=(0, .08, .16, 0), otext=(0, .6, 1, .45),
            orange=(0, .55, 1, 0), divider=(0, 0, 0, .8), card=(0, 0, 0, .88), cta=(.03, 0, .04, .03))
col = lambda k: CMYKColor(*CMYK[k])
LEGAL_B = D2.LEGAL_B
LEGAL_R = ' — material exclusivo do time BAP. Proibida a distribuição a clientes e terceiros. Imagens ilustrativas.'


import os
import hashlib
_D = 'entradas/bap'
os.makedirs(_D, exist_ok=True)
def _h(f):
    with open(os.path.join(_D, f), 'rb') as _fh:
        return hashlib.md5(_fh.read()).hexdigest()
PLACEHOLDER = _h('FLU15002.jpg') if os.path.exists(os.path.join(_D, 'FLU15002.jpg')) else None          # arte "IMAGEM INDISPONÍVEL" (1.031 arquivos iguais)
IMG = {taxo.norm(os.path.splitext(f)[0]): os.path.join(_D, f)
       for f in os.listdir(_D) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and _h(f) != PLACEHOLDER}


def est_of(code):
    c = taxo.norm(code)
    return int(STK.loc[c, 'est']) if c in STK.index else 0


class PDoc(D2.Doc):
    def __init__(self, path):
        from reportlab.pdfgen import canvas
        self.c = canvas.Canvas(path, pagesize=((W + 2 * BPX) * S, (H + 2 * BPX) * S), initialFontName='PR')
        self.c.setTitle('Catálogo BAP 2026 — Impressão A4 (uso interno)'); self.c.setAuthor('BAP Auto Parts')

    def X(self, x): return (x + BPX) * S
    def Y(self, y): return (H - y + BPX) * S

    def boxes(self):
        self.c.setTrimBox((BPX * S, BPX * S, (W + BPX) * S, (H + BPX) * S))
        self.c.setBleedBox((0, 0, (W + 2 * BPX) * S, (H + 2 * BPX) * S))

    def rect(self, x, y, w, h, fill=None, stroke=None, sw=1, r=0):
        if not r:   # retângulos encostados na borda entram na sangria
            x0 = -BPX if x <= 0 else x; x1 = W + BPX if x + w >= W else x + w
            y0 = -BPX if y <= 0 else y; y1 = H + BPX if y + h >= H else y + h
            x, y, w, h = x0, y0, x1 - x0, y1 - y0
        c = self.c
        if fill: c.setFillColor(col(fill))
        if stroke: c.setStrokeColor(col(stroke)); c.setLineWidth(sw * S)
        if r: c.roundRect(self.X(x), self.Y(y + h), w * S, h * S, r * S, stroke=1 if stroke else 0, fill=1 if fill else 0)
        else: c.rect(self.X(x), self.Y(y + h), w * S, h * S, stroke=1 if stroke else 0, fill=1 if fill else 0)

    def circle(self, cx, cy, r, fill):
        self.c.setFillColor(col(fill)); self.c.circle(self.X(cx), self.Y(cy), r * S, stroke=0, fill=1)

    def label(self, x, y, s, size, color, font='PB', ls=0, align='left'):
        w = lw(s, size, font, ls)
        if align == 'right': x -= w
        elif align == 'center': x -= w / 2
        t = self.c.beginText(); t.setFont(font, size * S); t.setCharSpace(ls * S); t.setFillColor(col(color))
        t.setTextOrigin(self.X(x), self.Y(y + .95 * size)); t.textLine(s); t.setCharSpace(0); self.c.drawText(t)
        return w

    def text(self, x, y, w, mk, size, lead, color='ink', font='PR'):
        mk = mk.replace('#5b5f5b', 'cmyk(0,0,0,0.68)')
        p = Paragraph(mk, ParagraphStyle('t', fontName=font, fontSize=size * S, leading=lead * S, textColor=col(color)))
        pw, ph = p.wrap(w * S, 1e6); p.drawOn(self.c, self.X(x), self.Y(y) - ph)

    _cache = {}

    def image(self, path, x, y, w, h):
        if path not in self._cache:
            im = Image.open(path).convert('RGBA')
            bb = im.getchannel('A').getbbox()
            if bb: im = im.crop(bb)
            if path.lower().endswith(('.jpg', '.jpeg')):      # fotos com fundo branco: recorta a margem
                g = im.convert('L').point(lambda v: 255 if v < 238 else 0).getbbox()
                if g:
                    pad = 8; im = im.crop((max(0, g[0] - pad), max(0, g[1] - pad), min(im.size[0], g[2] + pad), min(im.size[1], g[3] + pad)))
            self._cache[path] = im
        im = self._cache[path]
        iw, ih = im.size; k = min(w / iw, h / ih); dw, dh = iw * k, ih * k
        ppi = iw / (dw * S / 72)
        if ppi < 260:
            f = 300 / ppi; im = im.resize((int(iw * f), int(ih * f)), Image.LANCZOS)
        elif ppi > 360:
            f = 330 / ppi; im = im.resize((max(1, int(iw * f)), max(1, int(ih * f))), Image.LANCZOS)
        self.c.drawImage(ImageReader(im), self.X(x + (w - dw) / 2), self.Y(y + (h + dh) / 2), dw * S, dh * S, mask='auto')

    def end(self):
        self.boxes(); self.c.showPage()


# ---------------------------------------------------------------- blocos de página
def topbar(dc, right):
    dc.rect(0, 0, W, TOP, fill='black')
    dc.image(D2.LOGO, MX, 10, 24.7, 34)
    dc.rect(MX + 24.7 + 14, 16, 1, 22, fill='divider')
    dc.label(MX + 24.7 + 29, 21, 'CATÁLOGO DE PRODUTOS 2026', 10, 'green2', 'PB', 1.4)
    dc.label(W - MX, 21, right.upper(), 10, 'lgrey', 'PM', 1.4, 'right')


def footer(dc, pg):
    y0 = H - FOOT
    dc.rect(0, y0, W, FOOT, fill='black'); dc.rect(0, y0, W, 3, fill='green')
    dc.label(MX, y0 + 13, 'www.bapautoparts.com.br', 11, 'white', 'PB')
    dc.label(W / 2, y0 + 12, f'{pg:02d}', 13, 'green2', 'PB', 0, 'center')
    dc.label(W - MX, y0 + 13, '@bapautoparts', 11, 'white', 'PM', 0, 'right')
    w = lw(LEGAL_B, 9, 'PB') + lw(LEGAL_R, 9, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, y0 + 33, LEGAL_B, 9, 'white', 'PB'); dc.label(x, y0 + 33, LEGAL_R, 9, 'fgrey', 'PR')


def hero(dc, eyebrow, title, desc, img=None, count=None, lanc=False):
    y0 = TOP
    dc.rect(0, y0, W, HERO, fill='hero'); dc.rect(0, y0 + HERO - 1, W, 1, fill='heroline')
    panel = img is not None or count is not None
    maxw = 400 if panel else CW
    ts = 40
    while ts > 24 and lw(title, ts, 'PB', -ts * .02) > maxw: ts -= 1
    es = 10
    while es > 7 and lw(eyebrow.upper(), es, 'PB', 1.6) + (130 if lanc else 0) > maxw + 20: es -= .5
    dh = para_h(html.escape(desc), 11, 16, 390) if desc else 0
    blk = 15 + 5 + ts + (8 + dh if desc else 0)
    ty = y0 + (HERO - blk) / 2
    dc.label(MX, ty, eyebrow.upper(), es, 'gdark', 'PB', 1.6)
    if lanc: dc.tag(MX + lw(eyebrow.upper(), es, 'PB', 1.6) + 10, ty - 1, 'LANÇAMENTO 2026', 8, 'orange', 'white', 6)
    dc.label(MX - 1, ty + 20, title, ts, 'black', 'PB', -ts * .02)
    if desc: dc.text(MX, ty + 20 + ts + 8, 390, html.escape(desc), 11, 16, 'sec')
    if panel:
        x, y, w, h = W - MX - 300, y0 + (HERO - 88) / 2, 300, 88
        c = dc.c; c.saveState()
        p = c.beginPath(); p.roundRect(dc.X(x), dc.Y(y + h), w * S, h * S, 14 * S); c.clipPath(p, stroke=0, fill=0)
        dc.rect(x + .01, y, w, h, fill='white', r=0.01)
        dc.circle(x + w - 61, y + 49, 95, 'green'); dc.circle(x + w - 64, y + 44, 62, 'green2')
        if img: dc.image(img, x + 14, y + 4, 160, 80)
        c.restoreState()
        if count is not None:
            dc.label(x + w - 16, y + h - 12 - 9 - 4 - 26, str(count), 26, 'white', 'PB', 0, 'right')
            dc.label(x + w - 16, y + h - 12 - 11, 'ITENS', 9, 'white', 'PB', 1.1, 'right')


def section_title(dc, y, s):
    dc.label(MX, y, s, 11.5, 'black', 'PB', 1.15)
    x2 = MX + lw(s, 11.5, 'PB', 1.15) + 12
    dc.rect(x2, y + 7, W - MX - x2, 1, fill='line')
    return y + 21


# ---------------------------------------------------------------- página de linha
APP_FS, APP_LD = 9.4, 12.6
CARD_FS = 8.2


def pick(f):
    rows = list(f['rows'])
    for r in rows:
        r['_est'] = est_of(r['code']); r['_img'] = IMG.get(taxo.norm(r['code']))
    pool = [r for r in rows if r['segs']] if not f['spec'] else rows
    if len(pool) < min(5, len(rows)): pool = rows
    # destaques: maior estoque, dando preferência a quem tem foto própria
    top = sorted(pool, key=lambda r: (0 if r['_img'] else 1, -r['_est']))[:5]
    tk = {id(r) for r in top}
    rest = sorted([r for r in rows if id(r) not in tk], key=lambda r: (0 if (r['segs'] or f['spec']) else 1, -r['_est'], r['code']))
    return top, rest


def plain(segs): return re.sub(r'\s+', ' ', ''.join(t for t, b in segs)).strip()


def mk_cut(f, r, size, width, maxl, suffix=' … (+ outras aplicações)'):
    """aplicação (markup) limitada a maxl linhas"""
    full = D2.markup(r['segs']) if r['segs'] else f'<font color="#5b5f5b">Aplicação em cadastro — consulte o vendedor BAP</font>'
    lead = size * 1.34
    if para_h(full, size, lead, width) <= maxl * lead + .5: return full, False
    txt = plain(r['segs'])
    lo, hi = 10, len(txt)
    best = txt[:10]
    while lo <= hi:
        mid = (lo + hi) // 2; cand = txt[:mid].rsplit(' ', 1)[0].rstrip(' ·,;/–-') + suffix
        segs = cut_segs(r['segs'], len(cand) - len(suffix))
        m = D2.markup(segs + [[suffix, False]])
        if para_h(m, size, lead, width) <= maxl * lead + .5: best = m; lo = mid + 1
        else: hi = mid - 1
    return best, True


def cut_segs(segs, n):
    out, k = [], 0
    for t, b in segs:
        if k >= n: break
        t2 = t[:max(0, n - k)]; k += len(t)
        if t2: out.append([t2, b])
    if out: out[-1][0] = out[-1][0].rsplit(' ', 1)[0].rstrip(' ·,;/–-') if len(out[-1][0].split(' ')) > 1 else out[-1][0]
    return out


def cards(dc, f, top, y):
    gap = 8; cw = (CW - gap * 4) / 5; tw = cw - 18
    PH = 66
    fixed_code = 7 + 16.5 + 3 + 20.8 + 6
    refsl = [html.escape(' · '.join(r['refs'].split(' · ')[:2]) if r.get('refs') else '—') for r in top]
    rh = max(para_h(x, 7.8, 10.4, tw) for x in refsl) if refsl else 10.4
    app_max = 236 - (PH + fixed_code + 1 + 6 + 6 + 1 + 5 + rh + 6)
    apps = []
    for r in top:
        m, t = mk_cut(f, r, CARD_FS, tw, int(app_max // (CARD_FS * 1.34)))
        apps.append(m)
    ah = max(para_h(m, CARD_FS, CARD_FS * 1.34, tw) for m in apps)
    ch = PH + fixed_code + 1 + 6 + ah + 6 + 1 + 5 + rh + 6
    for k, (r, m, rf) in enumerate(zip(top, apps, refsl)):
        x = MX + k * (cw + gap)
        dc.rect(x, y, cw, ch, fill='white', stroke='line', sw=1, r=10)
        img = r.get('_img') or f.get('img')
        if img: dc.image(img, x + 10, y + 6, cw - 20, PH - 18)
        dc.label(x + cw / 2, y + PH - 11, 'imagem ilustrativa' if not r.get('_img') else '', 6.5, 'grey', 'PR', 0, 'center')
        yc = y + PH
        dc.rect(x, yc, cw, 1, fill='line2')
        cs = 15
        while cs > 9 and lw(r['code'], cs, 'PB') > tw - (40 if r.get('nov') else 0): cs -= .5
        dc.label(x + 9, yc + 7 + (15 - cs) * .6, r['code'], cs, 'black', 'PB')
        if r.get('nov'): dc.tag(x + cw - 9 - 36, yc + 9, 'NOVO', 6.8, 'otag', 'otext', 4)
        sub = r.get('sub') or ''
        if sub: dc.text(x + 9, yc + 7 + 16.5 + 3, tw, html.escape(D2.datas.fix_text(sub)), 7.6, 10.4, 'gtext', 'PM')
        yb = yc + fixed_code
        dc.rect(x, yb, cw, 1, fill='line2')
        dc.text(x + 9, yb + 1 + 6, tw, m, CARD_FS, CARD_FS * 1.34, 'ink')
        yr = y + ch - (5 + rh + 6)
        dc.rect(x + 1, yr, cw - 2, 5 + rh + 6 - 1, fill='zebra')
        dc.rect(x, yr, cw, 1, fill='line2')
        dc.text(x + 9, yr + 5, tw, rf, 7.8, 10.4, 'sec')
    return y + ch


def table_cols(f):
    has_pos = sum(1 for r in f['rows'] if re.match(r'(Dianteiro|Traseiro)', r.get('sub') or '')) >= .6 * len(f['rows'])
    cols = [('CÓDIGO', 128 if f['spec'] else 70, 'code'), ('PRODUTO / ESPECIFICAÇÃO' if f['spec'] else 'APLICAÇÃO', None, 'app')]
    if not f['spec']: cols.append(('POSIÇÃO' if has_pos else 'DETALHE', 84 if has_pos else 96, 'sub'))
    if f.get('extra_col'): cols.append((f['extra_col'], 96, 'extra'))
    cols.append(('EQUIVALE A', 104, 'refs'))
    gap, pad = 10, 8
    fixed = sum(c[1] for c in cols if c[1]) + gap * (len(cols) - 1) + 2 * pad
    return cols, [c[1] if c[1] else CW - fixed for c in cols]


def row_cells(f, r, cols, widths):
    cells = []
    for (t, w0, k), w in zip(cols, widths):
        if k == 'code':
            cells.append(('code', r['code'], 13.5 + (12 if r.get('nov') else 0)))
        elif k == 'app':
            m, _ = mk_cut(f, r, APP_FS, w, 3)
            cells.append(('text', m, para_h(m, APP_FS, APP_LD, w), APP_FS, APP_LD, 'ink', 'PR'))
        elif k == 'sub':
            s_ = html.escape(D2.datas.fix_text(r.get('sub') or '—'))
            from reportlab.lib.utils import simpleSplit
            raw = html.unescape(s_)
            fs, ld = 8.4, 11.2   # texto sempre inteiro: 2 linhas; se não couber, letra 7.8; senão 3 linhas
            if len(simpleSplit(raw, 'PR', fs, w * .97)) > 2 and len(simpleSplit(raw, 'PR', 7.8, w * .97)) <= 2:
                fs, ld = 7.8, 10.4
            cells.append(('text', s_, para_h(s_, fs, ld, w), fs, ld, 'sec', 'PR'))
        elif k == 'extra':
            s_ = html.escape(r.get('extra') or '—')
            cells.append(('text', s_, para_h(s_, 8.4, 11.2, w, 'PM'), 8.4, 11.2, 'gtext', 'PM'))
        elif k == 'refs':
            s_ = '<br/>'.join(html.escape(x) for x in (r.get('refs') or '—').split(' · ')[:2])
            cells.append(('text', s_, para_h(s_, 8.4, 11.2, w), 8.4, 11.2, 'sec', 'PR'))
    return cells, max(c[2] for c in cells) + 9


def draw_rows(dc, f, rows, y, cols, widths, ymax):
    x = MX + 8
    for (t, w0, k), w in zip(cols, widths):
        dc.label(x, y + 1, t, 7.6, 'sec', 'PB', .8); x += w + 10
    dc.rect(MX, y + 16, CW, 1.5, fill='black')
    y += 18; n = 0
    for j, r in enumerate(rows):
        cells, h = row_cells(f, r, cols, widths)
        if y + h > ymax: break
        if j % 2: dc.rect(MX, y, CW, h, fill='zebra')
        dc.rect(MX, y + h - 1, CW, 1, fill='line2')
        x = MX + 8
        for c_, w in zip(cells, widths):
            if c_[0] == 'code':
                cs = 10
                while cs > 7.5 and lw(r['code'], cs, 'PB') > w: cs -= .25
                dc.label(x, y + 4.5 + (10 - cs) * .5, r['code'], cs, 'black', 'PB')
                if r.get('nov'): dc.tag(x, y + 18, 'NOVO', 6.8, 'otag', 'otext', 4)
            else:
                _, m, hh, sz, ld, cl, fn = c_
                dc.text(x, y + 4.5, w, m, sz, ld, cl, fn)
            x += w + 10
        y += h; n += 1
    return y, n


def cta_box(dc, f, rest, shown, y_bottom):
    n = len(rest) - shown
    if n > 0:
        t = f'Mais {n} {"item" if n == 1 else "itens"} desta linha no Catálogo Digital Completo'
        cnt = collections.Counter()
        for r in rest[shown:]:
            for x, b in r['segs']:
                if b:
                    for p in re.split(r'[/ ]+', x.strip()):
                        if p: cnt[{'VW': 'Volkswagen', 'GM': 'Chevrolet', 'MB': 'Mercedes-Benz'}.get(p.upper(), p.title() if len(p) > 3 else p.upper())] += 1
        mar = [b for b, _ in cnt.most_common(8)]
        body = ('Aplicações também para ' + ', '.join(mar[:-1]) + (' e ' + mar[-1] if len(mar) > 1 else (mar[0] if mar else '')) + '.') if mar else 'Consulte o catálogo digital para a lista completa com todas as aplicações.'
    else:
        t = 'Linha completa nesta página'
        body = 'Todas as aplicações detalhadas também estão no Catálogo Digital Completo.'
    bw = CW - 32 - 190 - 20
    h = 11 + 17 + 3 + para_h(html.escape(body), 10, 14.5, bw) + 11
    y = y_bottom - h
    dc.rect(MX, y, CW, h, fill='cta', r=12)
    dc.label(MX + 16, y + 11, t, 12.5, 'black', 'PB')
    dc.text(MX + 16, y + 11 + 17 + 3, bw, html.escape(body), 10, 14.5, 'sec')
    pw = lw('Veja o catálogo digital', 10, 'PM') + 32
    dc.rect(W - MX - 16 - pw, y + (h - 30) / 2, pw, 30, fill='black', r=15)
    dc.label(W - MX - 16 - pw / 2, y + (h - 30) / 2 + 9, 'Veja o catálogo digital', 10, 'white', 'PM', 0, 'center')
    return y


def venda_strip(dc, f, y_bottom):
    if not f.get('venda'): return y_bottom
    tw = CW - 150
    h = max(para_h(html.escape(f['venda']), 10, 14, tw) + 16, 32)
    y = y_bottom - h
    dc.rect(MX, y, CW, h, fill='white', stroke='green', sw=1.2, r=10)
    dc.label(MX + 14, y + (h - 12) / 2, 'OFEREÇA JUNTO', 9, 'gdark', 'PB', 1.3)
    dc.text(MX + 140, y + 8, tw, html.escape(f['venda']), 10, 14, 'ink')
    return y


def cta_height(f, rest, shown):
    n = len(rest) - shown
    body = 'x' * 160 if n > 0 else 'Todas as aplicações detalhadas também estão no Catálogo Digital Completo.'
    return 11 + 17 + 3 + para_h(body, 10, 14.5, CW - 242) + 11


def line_page(dc, f, pg):
    top, rest = pick(f)
    topbar(dc, f['group'])
    hero(dc, f['eyebrow'], f['name'], f['desc'], f.get('img'), f['count'], f.get('lanc'))
    y = section_title(dc, TOP + HERO + 12, 'DESTAQUES DA LINHA')
    y = cards(dc, f, top, y) + 14
    cols, widths = table_cols(f)
    vh = (max(para_h(html.escape(f['venda']), 10, 14, CW - 150) + 16, 32) + 8) if f.get('venda') else 0
    ymax = H - FOOT - 12 - cta_height(f, rest, 0) - 8 - vh - 6
    shown = 0
    if rest:
        y = section_title(dc, y, 'MAIS PRODUTOS DA LINHA')
        y, shown = draw_rows(dc, f, rest, y, cols, widths, ymax)
    yb = cta_box(dc, f, rest, shown, H - FOOT - 12)
    venda_strip(dc, f, yb - 8)
    footer(dc, pg); dc.end()
    return 5 + shown if len(f['rows']) >= 5 else len(f['rows'])


def moto_pages(dc, f, pg0):
    """Linha Moto: resumo completo, com continuação"""
    top, rest = pick(f)
    rest = [r for r in f['rows'] if r not in top]   # mantém a ordem por grupo (pneus, câmaras, óleos, velas, rolamentos)
    pages = 0; i = 0; first = True
    cols, widths = table_cols(f)
    while first or i < len(rest):
        topbar(dc, 'Linha Moto')
        if first:
            hero(dc, f['eyebrow'], f['name'], f['desc'], f.get('img'), f['count'])
            y = section_title(dc, TOP + HERO + 12, 'DESTAQUES DA LINHA')
            y = cards(dc, f, top, y) + 14
            y = section_title(dc, y, 'TODOS OS PRODUTOS DE MOTO')
        else:
            y = TOP + 18
            dc.label(MX, y, 'Linha Moto (continuação)', 15, 'black', 'PB'); y += 30
        ymax = H - FOOT - 14 - (60 if i + 30 >= len(rest) else 0)
        y, n = draw_rows(dc, f, rest[i:], y, cols, widths, ymax)
        i += n
        if i >= len(rest) and f.get('venda'):
            venda_strip(dc, f, H - FOOT - 12)
        footer(dc, pg0 + pages); dc.end(); pages += 1; first = False
    return pages


# ---------------------------------------------------------------- páginas institucionais
def capa(dc):
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W + 60, 640, 420, 'green'); dc.circle(W + 20, 640, 310, 'green2'); dc.circle(W + 20, 640, 220, 'black')
    dc.image(D2.LOGO, MX + 20, 110, 150 * 1420 / 1955, 150)
    dc.label(MX + 20, 320, 'CATÁLOGO DE PRODUTOS', 16, 'green2', 'PB', 2.4)
    dc.label(MX + 16, 346, '2026', 110, 'white', 'PB', -2)
    for i, t in enumerate(['Suspensão · Direção · Transmissão · Freio', 'Arrefecimento · Motor · Elétrica · Filtração',
                           'Lubrificantes · Químicos · Rodagem · Acessórios · Linha Moto']):
        dc.label(MX + 20, 490 + i * 24, t, 14, 'white', 'PR')
    dc.tag(MX + 20, 570, 'USO INTERNO', 9, 'orange', 'white', 9)
    for i in range(6):
        x = MX + 20 + (i % 3) * 142; y = 620 + (i // 3) * 122
        dc.rect(x, y, 130, 110, fill='white', r=14)
        dc.image(f'dimg/capa_{i + 1}.png', x + 10, y + 16, 110, 78)
    dc.rect(0, H - 56, W, 56, fill='green')
    dc.label(MX + 20, H - 56 + 20, 'www.bapautoparts.com.br', 12, 'white', 'PB')
    dc.label(W - MX, H - 56 + 20, '@bapautoparts', 12, 'white', 'PM', 0, 'right')
    w = lw(LEGAL_B, 10, 'PB') + lw(' · exclusivo do time BAP', 10, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, H - 56 + 21, LEGAL_B, 10, 'white', 'PB'); dc.label(x, H - 56 + 21, ' · exclusivo do time BAP', 10, 'white', 'PR')
    dc.end()


def por_que(dc, pg):
    topbar(dc, 'BAP Auto Parts')
    hero(dc, 'BAP AUTO PARTS', 'Por que BAP?', 'Componentes de qualidade, com segurança e preço acessível.')
    y = TOP + HERO + 36
    blocos = [('Quem somos', 'A BAP Auto Parts é uma empresa brasileira fundada em 2021 para oferecer componentes automotivos de qualidade, com segurança e preço acessível. O portfólio cobre as linhas leve, pesada e moto, da suspensão à parte elétrica.'),
              ('Por que vender BAP', 'Portfólio robusto para suspensão, direção, freio, arrefecimento, motor, transmissão, elétrica e acessórios. Produtos com padrão OEM, testados para máxima performance, e preço competitivo sem abrir mão da qualidade.'),
              ('Garantia Expressa BAP', 'Ativação simples e direta, sem burocracia: o cliente aciona a garantia direto com a fábrica pelo SAC BAP. Prazos conforme o certificado da embalagem, sem intermediários.')]
    for t, txt in blocos:
        dc.rect(MX, y + 2, 4, 18, fill='green')
        dc.label(MX + 14, y, t.upper(), 16, 'black', 'PB', 1)
        h = para_h(html.escape(txt), 12.5, 19, CW - 14)
        dc.text(MX + 14, y + 30, CW - 14, html.escape(txt), 12.5, 19, 'sec')
        y += 30 + h + 34
    nums = [('+40', 'linhas de produtos'), ('+6.500', 'itens e aplicações'), ('Nacional', 'em todos os estados'), ('SAC', 'garantia direto na fábrica')]
    w = (CW - 36) / 4
    for i, (n, t) in enumerate(nums):
        x = MX + i * (w + 12)
        dc.rect(x, y, w, 110, fill='black', r=14)
        dc.label(x + w / 2, y + 30, n, 28, 'green2', 'PB', 0, 'center')
        dc.label(x + w / 2, y + 72, t, 11, 'white', 'PR', 0, 'center')
    dc.label(MX, y + 128, 'Prazos de garantia conforme o certificado da embalagem de cada produto.', 10, 'sec', 'PR')
    footer(dc, pg); dc.end()


def como(dc, pg):
    topbar(dc, 'Catálogo 2026')
    hero(dc, 'GUIA RÁPIDO', 'Como consultar', 'Encontre a peça certa e aumente o ticket em poucos passos.')
    passos = [('Encontre a linha', 'O sumário organiza as linhas por sistema do veículo (suspensão, freio, arrefecimento...). Cada página traz uma linha de produtos BAP.'),
              ('Veja os destaques', 'Os cards no topo mostram os itens de maior estoque da linha, com foto, aplicação e equivalência.'),
              ('Consulte a lista', 'A tabela traz mais produtos da linha, com código, aplicação, posição e equivalência. Aplicações longas terminam em "(+ outras aplicações)".'),
              ('Ofereça junto', 'A coluna e a faixa "Ofereça junto" indicam o agregado de cada produto, como bomba d\'água com o kit de distribuição ou câmara com o pneu.'),
              ('Fique atento às tags', 'NOVO: produto recém-chegado ao portfólio BAP. LANÇAMENTO 2026: linha lançada em 2026, indicada no topo da página.'),
              ('Catálogo digital', 'Todos os itens e todas as aplicações completas estão no Catálogo Digital Completo, com busca e sumário clicável.')]
    y0 = TOP + HERO + 30; cw = (CW - 16) / 2
    hs = [para_h(html.escape(t), 11.5, 17, cw - 96) for _, t in passos]
    rowh = [max(hs[i], hs[i + 1]) + 64 + (16 if i == 4 else 0) for i in (0, 2, 4)]
    y = y0
    for r in range(3):
        for c_ in range(2):
            i = r * 2 + c_; x = MX + c_ * (cw + 16); t, txt = passos[i]
            dc.rect(x, y, cw, rowh[r], fill='zebra', stroke='line', r=14)
            dc.label(x + 20, y + 16, f'{i + 1:02d}', 26, 'green', 'PB')
            dc.label(x + 76, y + 20, t, 14, 'black', 'PB')
            dc.text(x + 76, y + 44, cw - 96, html.escape(txt), 11.5, 17, 'sec')
            if i == 4:
                w1 = dc.tag(x + 76, y + rowh[r] - 26, 'NOVO', 8, 'otag', 'otext', 6)
                dc.tag(x + 76 + w1 + 8, y + rowh[r] - 26, 'LANÇAMENTO 2026', 8, 'orange', 'white', 6)
        y += rowh[r] + 16
    footer(dc, pg); dc.end()


def sumario(dc, entries, pg):
    topbar(dc, 'Catálogo 2026')
    hero(dc, 'CATÁLOGO 2026', 'Sumário', 'Linhas de produtos BAP organizadas por sistema do veículo.')
    grupos = []
    for e in entries:
        if e['group'] not in grupos: grupos.append(e['group'])
    colw = (CW - 24) / 2
    hg = {g: 30 + 21 * sum(1 for e in entries if e['group'] == g) + 10 for g in grupos}
    tot = sum(hg.values()); acc = 0; colof = {}
    for g in grupos:
        colof[g] = 0 if acc + hg[g] / 2 <= tot / 2 else 1; acc += hg[g]
    ys = [TOP + HERO + 22] * 2
    for g in grupos:
        x = MX + colof[g] * (colw + 24); y = ys[colof[g]]
        dc.rect(x, y, colw, 24, fill='black', r=6)
        dc.label(x + 12, y + 6.5, g, 9.5, 'green2', 'PB', 1)
        y += 30
        for e in [e for e in entries if e['group'] == g]:
            dc.label(x + 12, y, e['name'], 11, 'ink', 'PR')
            if e.get('lanc'): dc.tag(x + 12 + lw(e['name'], 11, 'PR') + 8, y + 1, 'LANÇAMENTO', 7, 'orange', 'white', 5)
            dc.label(x + colw - 8, y, f"{e['pg']:02d}", 11, 'gdark', 'PB', 0, 'right')
            dc.rect(x + 12, y + 17, colw - 20, 1, fill='line2')
            y += 21
        ys[colof[g]] = y + 10
    footer(dc, pg); dc.end()


def anotacoes(dc, pg):
    topbar(dc, 'Catálogo 2026')
    hero(dc, 'CATÁLOGO 2026', 'Anotações', '')
    y = TOP + HERO + 50
    while y < H - FOOT - 30:
        dc.rect(MX, y, CW, 1, fill='line'); y += 34
    footer(dc, pg); dc.end()


def contracapa(dc):
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W / 2, 500, 260, 'green'); dc.circle(W / 2, 500, 205, 'black')
    lh = 220; lwid = lh * 1420 / 1955
    dc.image('dimg/logo_grande.png', W / 2 - lwid / 2, 500 - lh / 2, lwid, lh)
    dc.label(W / 2, 840, 'Onde houver movimento, haverá uma peça BAP garantindo o caminho.', 15, 'white', 'PB', 0, 'center')
    dc.label(W / 2, 876, 'www.bapautoparts.com.br  ·  @bapautoparts', 13, 'green2', 'PM', 0, 'center')
    t1 = 'Catálogo BAP 2026 · '; t3 = ' — exclusivo do time BAP. Proibida a distribuição a clientes e terceiros.'
    w = lw(t1, 10, 'PR') + lw(LEGAL_B, 10, 'PB') + lw(t3, 10, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, H - 70, t1, 10, 'fgrey', 'PR'); x += dc.label(x, H - 70, LEGAL_B, 10, 'white', 'PB'); dc.label(x, H - 70, t3, 10, 'fgrey', 'PR')
    dc.end()


def build(out, moto_pages_n=2):
    lines = [f for f in FAMS if f['name'] != 'Linha Moto']
    moto = [f for f in FAMS if f['name'] == 'Linha Moto'][0]
    entries, pg = [], 5
    for f in lines:
        entries.append(dict(name=f['name'], group=f['group'], pg=pg, lanc=f.get('lanc'))); pg += 1
    entries.append(dict(name='Linha Moto', group='LINHA MOTO', pg=pg, lanc=False))
    dc = PDoc(out)
    capa(dc); por_que(dc, 2); como(dc, 3); sumario(dc, entries, 4)
    shown = {}
    for f, e in zip(lines, entries):
        shown[f['name']] = line_page(dc, f, e['pg'])
    np_ = moto_pages(dc, moto, entries[-1]['pg'])
    total = 4 + len(lines) + np_ + 1
    pgn = entries[-1]['pg'] + np_
    while total % 4:
        anotacoes(dc, pgn); pgn += 1; total += 1
    contracapa(dc)
    dc.c.save()
    return total, shown, np_


if __name__ == '__main__':
    total, shown, np_ = build('impresso_v2.pdf')
    print('páginas', total, '| páginas Linha Moto', np_)
    print({k: v for k, v in shown.items()})
