"""Catálogo BAP 2026 — versão digital completa (regerada a partir dos dados do PDF digital, com correções)."""
import json, re, html
import pandas as pd
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import datas
import tags as TG
from quebra import NBSP  # B8: o import também instala a quebra (palavra longa no espaço inseparável ou no separador, não no meio)

FD = 'fontes/'
for n, f in [('PR', 'Poppins-Regular'), ('PM', 'Poppins-Medium'), ('PB', 'Poppins-Bold')]:
    pdfmetrics.registerFont(TTFont(n, FD + f + '.ttf'))
pdfmetrics.registerFontFamily('PR', normal='PR', bold='PB', italic='PR', boldItalic='PB')

W, H, MX = 794, 1123, 36
ANO = '2027'                               # ano da capa e dos títulos (Alexandre, 29/10: catálogo 2027)
DOC_TITULO = f'CATÁLOGO COMPLETO {ANO}'   # o catálogo só de moto troca este título
CW = W - 2 * MX
TOP, FOOT, HERO = 54, 56, 132
S = 595.2756 / W
C = dict(black='#141514', ink='#161816', sec='#4d514d', grey='#5b5f5b', green='#3dae49', green2='#5cb85f',
         gdark='#1f7a32', gtext='#1f6b2c', hero='#eef4ec', heroline='#dbe6d7', line='#dfe2dc', line2='#e3e6e0',
         zebra='#f7f8f6', white='#ffffff', lgrey='#d5d8d5', fgrey='#c9ccc9', otag='#fdebd6', otext='#8a3f00',
         orange='#f28c28', divider='#3a3d3a', card='#242624')
FS, LEAD, RF, RL, SF, SL, RPAD = 8.6, 11.1, 7.8, 10.3, 7.2, 9.3, 4.5
CODE_W, REF_W, GAP, PAD = 122, 130, 10, 8
APP_W = CW - CODE_W - REF_W - 2 * GAP - 2 * PAD
EXTRA_W = 74


def app_w(f):
    return APP_W - (EXTRA_W + GAP if f.get('extra_col') else 0)
YMAX = H - FOOT - 14
SITE = 'https://www.bapautoparts.com.br'
LOGO = 'dimg/capa_0.png'
LEGAL_B = 'USO INTERNO E CONFIDENCIAL'
SITE_IG = 'www.bapautoparts.com.br  ·  @bapautoparts'
OBS_DISP = 'Consulte a disponibilidade na sua região.'   # rodapé das páginas (R-20261120-212000-alexandre, "3) a")
LEGAL_R = ' — material exclusivo do time BAP. Proibida a distribuição a clientes e terceiros. Imagens ilustrativas.'

# ---------------------------------------------------------------- dados + correções
with open('digital_data.json') as _fdd:
    fams = json.load(_fdd)
for _f in fams:                                  # " nan" (célula vazia) depois da montadora: sai e a marca fica (P3 da v21)
    for _r in _f['rows']:
        for _sg in _r.get('segs') or []:
            if not _sg[1]: _sg[0] = re.sub(r'^(\s*)nan(?=\s*(?:·|;|$))', r'\1', _sg[0]).replace('  ·', ' ·')
byname = {f['name']: f for f in fams}
pneus, inter = byname['Pneus e Câmaras de Ar Moto'], byname['Interruptores']
mov = [r for r in pneus['rows'] if r['code'].startswith('INT16')]
pneus['rows'] = [r for r in pneus['rows'] if not r['code'].startswith('INT16')]
IF = pd.read_excel('entradas/CATALOGO_BAP_INTERRUPTORES.xlsx', 'APLICACAO POR MARCA')
BR = {'MERCEDES-BENZ': 'MB', 'VW': 'VW', 'VOLKSWAGEN': 'VW', 'VOLVO': 'VOLVO'}
for r in mov:
    g = IF[IF['BAP PN'] == r['code']]
    segs = []
    for k, (_, x) in enumerate(g.iterrows()):
        app = re.sub(r'\s+', ' ', str(x['APLICAÇÃO'])).strip(' .')
        app = re.sub(r'\((\d{4})\s*-\s*(\d{4})\)', r'(\1–\2)', app)
        if k: segs.append([' · ', False])
        segs += [[BR.get(str(x['MARCA']).upper(), str(x['MARCA']).upper()), True], [' ' + app, False]]
    x = g.iloc[0]
    refs = [f'M. Marelli {x["MARELLI PN"]}', f'3-RHO {x["3RHO PN"]}', f'Intermec {x["INTERMEC PN"]}', f'Marflex {x["MARFLEX PN"]}']
    inter['rows'].append(dict(code=r['code'], nov=False, sub='Interruptor pneumático', segs=segs, refs=' · '.join(refs)))
inter['rows'].sort(key=lambda r: r['code'])
for f in fams: f['count'] = len(f['rows'])
CORR = 0


def markup(segs):
    """segmentos -> marcação ReportLab: montadora em negrito, datas em cinza, datas padronizadas"""
    global CORR
    s = ''.join(('\x01' + t + '\x02') if b else t for t, b in segs)
    s = re.sub(r'\s+', ' ', s).strip()
    n = datas.para_pdf(s)
    if n != s: CORR += 1
    out = []
    for part in re.split(r'(\x01.*?\x02)', n):
        if part.startswith('\x01'):
            out.append('<b>' + html.escape(part[1:-1], quote=False) + '</b>')
        else:
            last = 0
            for m in datas_re.finditer(part):
                out.append(html.escape(part[last:m.start()], quote=False))
                out.append(f'<font color="{C["grey"]}">' + html.escape(m.group(0), quote=False) + '</font>')
                last = m.end()
            out.append(html.escape(part[last:], quote=False))
    return sem_viuva(''.join(out))


_SEPW = {'·', '/', '-', '–', '|', '+'}


def sem_viuva(mk):
    """B8 (T-0019): a última palavra não fica sozinha na última linha. Troca por espaço inseparável o último espaço do
    texto (fora das marcas <...>); se a palavra de antes é só um separador ("·", "/", "-"), prende mais um espaço, para a
    última linha não começar com o separador ("1730 · 111693")."""
    partes = re.split(r'(<[^>]*>)', mk)
    txt = [k for k, t in enumerate(partes) if not t.startswith('<')]
    pos = [(k, j) for k in txt for j in range(len(partes[k]))]        # cada letra do texto, fora das marcas
    while pos and partes[pos[-1][0]][pos[-1][1]].isspace(): pos.pop()  # sem o espaço do fim
    s = ''.join(partes[k][j] for k, j in pos)
    trocar, i = [], len(s)
    while len(trocar) < 3:
        i = s.rfind(' ', 0, i)
        if i <= 0: break
        trocar.append(i)
        antes = s[:i].rstrip().rsplit(' ', 1)[-1]
        if antes not in _SEPW: break
    if not trocar or (len(trocar) == 1 and s[:trocar[0]].strip() == ''): return mk
    for i in trocar:
        k, j = pos[i]; partes[k] = partes[k][:j] + NBSP + partes[k][j + 1:]
    return ''.join(partes)


def refs_juntas(refs):
    """B8 (T-0019): a marca e o código da referência na mesma linha ("Autoimpact PU14", "Cofap GP32986"): o espaço
    entre a marca (1 palavra; 2 nas marcas de 2 nomes, como "Magneti Marelli") e o código vira espaço inseparável. O
    resto continua quebrando como antes (entre as referências e dentro de código com espaço, "3400 700 639")."""
    if not refs: return refs
    import fraga_complementos as _FC
    out = []
    for x in refs.split(' · '):
        x = re.sub(r'\s+', ' ', x.strip())
        n = 2 if any(x.upper().startswith(d + ' ') for d in _FC.DUAS) else 1
        p = x.split(' ')
        if len(p) > n: x = ' '.join(p[:n]) + NBSP + ' '.join(p[n:])
        out.append(x)
    return ' · '.join(out)


datas_re = re.compile(r'(?<![\w/])((?:\d{2}/)?' + datas.Y + r')((?:–(?:\d{2}/)?' + datas.Y + r')|–|\+)?(?![\w/])')

# ---------------------------------------------------------------- desenho
_pc = {}


def para_h(mk, size, lead, width, font='PR', ind=0):
    k = (mk, size, lead, width, font, ind)
    if k not in _pc:
        p = Paragraph(mk, ParagraphStyle('m', fontName=font, fontSize=size, leading=lead, firstLineIndent=ind))
        _pc[k] = p.wrap(width, 1e6)[1]
    return _pc[k]


def lw(s, size, font='PB', ls=0): return pdfmetrics.stringWidth(s, font, size) + ls * len(s)


class Doc:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=(W * S, H * S), initialFontName='PR')
        self.c.setTitle(f'Catálogo BAP {ANO} — Completo (uso interno)'); self.c.setAuthor('BAP AUTOPARTS')
        self.c.setPageCompression(1)
        self.areas_ref = []

    def X(self, x): return x * S
    def Y(self, y): return (H - y) * S

    def rect(self, x, y, w, h, fill=None, stroke=None, sw=1, r=0):
        c = self.c
        if fill: c.setFillColor(HexColor(C[fill]))
        if stroke: c.setStrokeColor(HexColor(C[stroke])); c.setLineWidth(sw * S)
        if r: c.roundRect(self.X(x), self.Y(y + h), w * S, h * S, r * S, stroke=1 if stroke else 0, fill=1 if fill else 0)
        else: c.rect(self.X(x), self.Y(y + h), w * S, h * S, stroke=1 if stroke else 0, fill=1 if fill else 0)

    def circle(self, cx, cy, r, fill):
        self.c.setFillColor(HexColor(C[fill])); self.c.circle(self.X(cx), self.Y(cy), r * S, stroke=0, fill=1)

    def label(self, x, y, s, size, color, font='PB', ls=0, align='left'):
        w = lw(s, size, font, ls)
        if align == 'right': x -= w
        elif align == 'center': x -= w / 2
        t = self.c.beginText(); t.setFont(font, size * S); t.setCharSpace(ls * S); t.setFillColor(HexColor(C[color]))
        t.setTextOrigin(self.X(x), self.Y(y + .95 * size)); t.textLine(s); t.setCharSpace(0); self.c.drawText(t)
        return w

    def text(self, x, y, w, mk, size, lead, color='ink', font='PR', ind=0):
        p = Paragraph(mk, ParagraphStyle('t', fontName=font, fontSize=size * S, leading=lead * S, textColor=HexColor(C[color]),
                                         firstLineIndent=ind * S))
        pw, ph = p.wrap(w * S, 1e6); p.drawOn(self.c, self.X(x), self.Y(y) - ph)
        return ph

    def ref(self, x, y, w, mk, size, lead, color='sec', font='PR'):
        """referências cruzadas: desenha como o text e guarda a caixa (página, x0, y0, x1, y1 em pontos, com o y de cima
        para baixo, como no PyMuPDF), para a trava_pdf deixar a concorrência só ali (T-0017)"""
        ph = self.text(x, y, w, mk, size, lead, color, font)
        y0 = self.c._pagesize[1] - self.Y(y)
        self.areas_ref.append((self.c.getPageNumber() - 1, (self.X(x), y0, self.X(x + w), y0 + ph)))
        return ph

    _cache = {}

    def image(self, path, x, y, w, h):
        """imagem leve para tela: no máximo ~200 ppi; foto (jpg) vira JPEG comprimido e é reaproveitada"""
        import io
        im = Image.open(path).convert('RGBA')
        bb = im.getchannel('A').getbbox()
        if bb: im = im.crop(bb)
        foto = path.lower().endswith(('.jpg', '.jpeg'))
        if foto:
            g = im.convert('L').point(lambda v: 255 if v < 238 else 0).getbbox()
            if g: im = im.crop((max(0, g[0] - 8), max(0, g[1] - 8), min(im.size[0], g[2] + 8), min(im.size[1], g[3] + 8)))
        iw, ih = im.size; k = min(w / iw, h / ih); dw, dh = iw * k, ih * k
        alvo = (int(dw * S / 72 * 200), int(dh * S / 72 * 200))
        chave = (path, alvo)
        if chave not in Doc._cache:
            if iw > alvo[0] > 0: im = im.resize(alvo, Image.LANCZOS)
            if foto:
                bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.getchannel('A'))
                buf = io.BytesIO(); bg.save(buf, 'JPEG', quality=82); buf.seek(0)
                Doc._cache[chave] = (ImageReader(buf), None)
            else:
                Doc._cache[chave] = (ImageReader(im), 'auto')
        rd, mk = Doc._cache[chave]
        self.c.drawImage(rd, self.X(x + (w - dw) / 2), self.Y(y + (h + dh) / 2), dw * S, dh * S, mask=mk)

    def tag(self, x, y, s, size, bg, fg, pad):
        w = TG.largura(lw, s, size, pad); h = size * 1.5
        self.rect(x, y, w, h, fill=bg, r=h / 2)
        self.label(x + w / 2, y + (h - size * 1.2) / 2 + .2, s, size, fg, 'PB', size * .08, 'center')
        return w

    def link(self, x, y, w, h, key):
        self.c.linkRect('', key, (self.X(x), self.Y(y + h), self.X(x + w), self.Y(y)), relative=0, thickness=0)

    def url(self, x, y, w, h, u):
        self.c.linkURL(u, (self.X(x), self.Y(y + h), self.X(x + w), self.Y(y)), relative=0, thickness=0)

    def bookmark(self, key, title, level):
        self.c.bookmarkPage(key); self.c.addOutlineEntry(title, key, level=level, closed=True)

    # -------- blocos
    def back_button(self, y=15):
        t = 'VOLTAR AO SUMÁRIO'; w = lw(t, 8.5, 'PB', .8) + 26; x = W - MX - w
        self.rect(x, y, w, 24, fill='green2', r=12)
        self.label(x + w / 2, y + 7, t, 8.5, 'black', 'PB', .8, 'center')
        self.link(x - 4, y - 4, w + 8, 32, 'sumario')

    def top(self, right=None, back=True):
        self.rect(0, 0, W, TOP, fill='black')
        self.image(LOGO, MX, 10, 24.7, 34)
        self.rect(MX + 24.7 + 14, 16, 1, 22, fill='divider')
        self.label(MX + 24.7 + 29, 21, DOC_TITULO, 10, 'green2', 'PB', 1.4)
        if back: self.back_button()
        elif right: self.label(W - MX, 21, right.upper(), 10, 'lgrey', 'PM', 1.4, 'right')

    def legal(self, cy, size=9, color='fgrey'):
        w = lw(LEGAL_B, size, 'PB') + lw(LEGAL_R, size, 'PR')
        x = W / 2 - w / 2
        x += self.label(x, cy, LEGAL_B, size, 'white', 'PB')
        self.label(x, cy, LEGAL_R, size, color, 'PR')

    def footer(self, pg):
        y0 = H - FOOT
        self.rect(0, y0, W, FOOT, fill='black'); self.rect(0, y0, W, 3, fill='green')
        self.label(MX, y0 + 13, SITE_IG, 9.5, 'white', 'PB')
        self.label(W / 2, y0 + 12, f'{pg:02d}', 13, 'green2', 'PB', 0, 'center')
        self.label(W - MX, y0 + 13 + .5, OBS_DISP, 9.5, 'white', 'PB', 0, 'right')
        self.legal(y0 + 33)
        self.url(MX, y0 + 8, 200, 20, SITE)

    def end(self): self.c.showPage()


# ---------------------------------------------------------------- linhas da tabela
def novo_desce(r, cs, largura, size, pad, gap):
    """B10 (T-0019, proposta do designer-ux): o código e a tag NOVO não cabem juntos antes da coluna de aplicação (A4
    p. 20: EMB3400700639R, 648R e 649R): a tag desce para a linha de baixo, a das tags e da descrição curta, sem mudar a
    largura das colunas."""
    if not r.get('nov'): return False
    return lw(r['code'], cs, 'PB') + gap + TG.largura(lw, 'NOVO', size, pad) > largura


def novo_na_sobra(tl, sm):
    """tag NOVO que desceu: com tags, vai na frente delas; sem tags e com descrição curta, na 1ª linha da descrição
    (recuo do tamanho da tag); sem as duas, sozinha. Devolve (tags, recuo da descrição curta)"""
    if tl or not sm: return ['NOVO'] + list(tl or []), 0
    return [], TG.largura(lw, 'NOVO') + 3   # o recuo é a tag e um espaço


def codigo_e_novo(r, tl, sm, largura, cs, folga, size, pad, gap):
    """B10, igual no A4 e no Digital: tamanho do código (de cs até 7.5) e lugar da tag NOVO. Devolve as tags."""
    while cs > 7.5 and lw(r['code'], cs, 'PB') > largura - folga: cs -= .25
    r['_cs'], r['_novo_baixo'], r['_ind'] = cs, novo_desce(r, cs, largura, size, pad, gap), 0
    if r['_novo_baixo']: tl, r['_ind'] = novo_na_sobra(tl, sm)
    return tl


def novo_na_descricao(dc, x, y):
    dc.tag(x, y, 'NOVO', TG.TAM, 'otag', 'otext', 3)   # B10: na 1ª linha da descrição curta


def tags_e_sobra(f, r):
    """(tags, texto que sobra já escapado) embaixo do código"""
    tl, sobra = TG.do_item(f['name'], r, f['spec'])
    return tl, html.escape(datas.para_pdf(sobra), quote=False) if sobra else ''


def prep_rows(f, linhas=None):
    out = []
    for r in (f['rows'] if linhas is None else linhas):
        if r['segs']:
            mk = markup(r['segs'])
        else:
            mk = f'<font color="{C["grey"]}">Aplicação em cadastro — consulte o vendedor BAP</font>'
        refs = html.escape(refs_juntas(r['refs'] or '—'), quote=False)
        tl, sm = tags_e_sobra(f, r)
        r['_tl'] = tl = codigo_e_novo(r, tl, sm, CODE_W, 9.5, 40 if r['nov'] else 0, 6.8, 4, 6)
        ch = 12.5 + (para_h(sm, SF, SL, CODE_W, 'PM', r['_ind']) + 1.5 if sm else 0)
        if tl: ch += TG.medir(lw, tl, CODE_W)[1] + 1
        r['_ch'] = ch + RPAD
        aw = app_w(f)
        ex = html.escape(r.get('extra', '') or '—', quote=False) if f.get('extra_col') else ''
        r['_extra_mk'] = ex
        h = max(ch, para_h(mk, FS, LEAD, aw), para_h(refs, RF, RL, REF_W), para_h(ex, RF, RL, EXTRA_W, 'PM') if ex else 0) + RPAD
        out.append((r, mk, refs, sm, h))
    return out


def paginate(rows, y0, AW=APP_W, y_first=None):
    """quebra em páginas; linha maior que uma página tem a aplicação dividida entre páginas"""
    pages, cur, y = [], [], (y0 if y_first is None else y_first)
    for (r, mk, refs, sm, h) in rows:
        if y + h <= YMAX:
            cur.append(dict(r=r, mk=mk, para=None, refs=refs, sm=sm, h=h, cont=False)); y += h; continue
        if h <= YMAX - y0:
            pages.append(cur); cur, y = [], y0
            cur.append(dict(r=r, mk=mk, para=None, refs=refs, sm=sm, h=h, cont=False)); y += h; continue
        # linha muito longa: divide a aplicação
        if YMAX - y < 140:
            pages.append(cur); cur, y = [], y0
        P = Paragraph(mk, ParagraphStyle('m', fontName='PR', fontSize=FS, leading=LEAD))
        first = True
        while P is not None:
            avail = YMAX - y - RPAD - 4
            P.wrap(AW, 1e6)
            parts = P.split(AW, avail)
            if len(parts) >= 2:
                a, P = parts[0], parts[1]
            else:
                a, P = P, None
            ah = a.wrap(AW, 1e6)[1]
            hh = max(ah + RPAD, r.get('_ch', 26 + RPAD) if first else 14 + RPAD)
            cur.append(dict(r=r, mk=None, para=a, refs=refs if first else '', sm=sm if first else '', h=hh, cont=not first))
            y += hh; first = False
            if P is not None:
                pages.append(cur); cur, y = [], y0
    pages.append(cur)
    # última página de continuação com 1 ou 2 linhas (pág. 292 do digital, 20/11): recebe as últimas 3 (ou 2) da página
    # anterior; com 2 linhas, as últimas 2. Só linha inteira (a de aplicação dividida não se move) e a anterior fica com
    # pelo menos 1 linha.
    if len(pages) >= 2 and 1 <= len(pages[-1]) <= 2:
        for k in ((3, 2) if len(pages[-1]) == 1 else (2,)):
            mov = pages[-2][-k:]
            if (len(pages[-2]) > k and not any(it['cont'] or it['para'] is not None for it in mov + pages[-1])
                    and sum(it['h'] for it in mov + pages[-1]) <= YMAX - y0):
                pages[-2], pages[-1] = pages[-2][:-k], mov + pages[-1]
                break
    return pages


HEAD_Y = TOP + 14 + 26 + 20


def table_page(dc, f, rows, pg, cont, primeira=None):
    dc.top()
    if primeira is not None:                     # 1ª página da linha: cabeçalho com imagem + 5 destaques (igual ao A4)
        PC, top, key = primeira
        dc.bookmark(key, f['name'], 1)
        PC.hero(dc, f.get('eyebrow', f['group']), f['name'], f['desc'], f.get('img'), f['count'], f.get('lanc'))
        y = PC.section_title(dc, TOP + HERO + 12, 'DESTAQUES DA LINHA')
        y = PC.cards(dc, f, top, y) + 14
        if not rows:
            dc.footer(pg); dc.end(); return
        y = PC.section_title(dc, y, 'TODOS OS ITENS DA LINHA')
        x = MX + PAD
    else:
        y = TOP + 14
        dc.label(MX, y, f['name'] + ' (continuação)', 15, 'black', 'PB')
        dc.label(W - MX, y + 3, f"{f['count']} itens", 9.5, 'sec', 'PM', 0, 'right')
        y += 26; x = MX + PAD
    aw = app_w(f)
    heads = [('CÓDIGO', CODE_W), ('PRODUTO / ESPECIFICAÇÃO' if f['spec'] else 'APLICAÇÃO', aw)]
    if f.get('extra_col'): heads.append((f['extra_col'], EXTRA_W))
    heads.append(('EQUIVALE A', REF_W))
    for t, w in heads:
        dc.label(x, y + 1, t, 8, 'sec', 'PB', .8); x += w + GAP
    dc.rect(MX, y + 16.5, CW, 1.5, fill='black')
    y += 20
    for j, it in enumerate(rows):
        r, mk, refs, sm, h = it['r'], it['mk'], it['refs'], it['sm'], it['h']
        if j % 2: dc.rect(MX, y, CW, h, fill='zebra')
        dc.rect(MX, y + h - 1, CW, 1, fill='line2')
        x = MX + PAD
        cs = r.get('_cs', 9.5)
        dc.label(x, y + 3.5, r['code'], cs, 'grey' if it['cont'] else 'black', 'PB')
        if it['cont']:
            dc.label(x, y + 16, '(continuação)', SF, 'grey', 'PM')
        elif r['nov'] and not r.get('_novo_baixo'): dc.tag(x + lw(r['code'], cs, 'PB') + 6, y + 3.5, 'NOVO', 6.8, 'otag', 'otext', 4)
        ys = y + 16
        if not it['cont'] and r['_tl']:           # tags embaixo do código
            ys += TG.desenhar(dc, lw, x, y + 16, r['_tl'], CODE_W) + 1
        ind = r.get('_ind', 0) if sm else 0
        if ind: novo_na_descricao(dc, x, ys + .2)
        if sm: dc.text(x, ys, CODE_W, sm, SF, SL, 'gtext', 'PM', ind)
        if it['para'] is not None:
            c = dc.c; c.saveState(); c.scale(S, S)
            ph = it['para'].wrap(aw, 1e6)[1]
            it['para'].drawOn(c, x + CODE_W + GAP, H - (y + 3.5) - ph); c.restoreState()
        else:
            dc.text(x + CODE_W + GAP, y + 3.5, aw, mk, FS, LEAD, 'ink')
        xr = x + CODE_W + aw + 2 * GAP
        if f.get('extra_col'):
            if not it['cont']: dc.text(xr, y + 3.5, EXTRA_W, r.get('_extra_mk', '—'), RF, RL, 'gtext', 'PM')
            xr += EXTRA_W + GAP
        if refs: dc.ref(xr, y + 3.5, REF_W, refs, RF, RL, 'sec')
        y += h
    dc.footer(pg); dc.end()


def cover_page(dc, f, key, first, last, pg):
    dc.bookmark(key, f['name'], 1)
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W + 40, 470, 360, 'green'); dc.circle(W + 10, 470, 268, 'green2'); dc.circle(W + 10, 470, 190, 'black')
    dc.image(LOGO, MX, 44, 34 * 1420 / 1955, 34)
    dc.label(MX + 40, 56, DOC_TITULO, 10, 'green2', 'PB', 1.4)
    dc.back_button(48)
    g = f.get('eyebrow', f['group']).upper(); gs = 13
    while gs > 9 and lw(g, gs, 'PB', 2) + (150 if f['lanc'] else 0) > CW: gs -= .5
    dc.label(MX, 300, g, gs, 'green2', 'PB', 2)
    if f['lanc']: dc.tag(MX + lw(g, gs, 'PB', 2) + 14, 299, 'LANÇAMENTO 2026', 9, 'orange', 'white', 7)
    size = 64
    while size > 34 and lw(f['name'], size, 'PB', -1) > CW - 40: size -= 2
    dc.label(MX - 2, 326, f['name'], size, 'white', 'PB', -1)
    dc.text(MX, 326 + size + 18, 430, html.escape(f['desc'], quote=False), 15, 22, 'lgrey')
    if f['img']:
        dc.rect(MX, 560, 400, 210, fill='white', r=20)
        dc.image(f['img'], MX + 20, 575, 360, 180)
    n = str(f['count'])
    dc.label(MX, 810, n, 64, 'white', 'PB', -1)
    dc.label(MX + lw(n, 64, 'PB', -1) + 14, 840, 'ITENS NESTA LINHA', 12, 'white', 'PB', 1.5)
    rng = f'Tabela completa nas páginas {first:02d} a {last:02d}' if last > first else f'Tabela completa na página {first:02d}'
    dc.label(MX, 900, rng, 13, 'lgrey', 'PM')
    if f.get('venda'):
        tw = CW - 260 - 40
        th = para_h(html.escape(f['venda'], quote=False), 12.5, 18, tw)
        bh = 20 + 14 + th + 18
        dc.rect(MX, 935, CW - 260, bh, fill='card', r=14)
        dc.rect(MX, 935, 5, bh, fill='green')
        dc.label(MX + 20, 935 + 16, 'LEVE TAMBÉM', 9, 'green2', 'PB', 1.4)
        dc.text(MX + 20, 935 + 34, tw, html.escape(f['venda'], quote=False), 12.5, 18, 'white')
    dc.rect(0, H - 56, W, 56, fill='green')
    dc.label(MX, H - 56 + 13, SITE_IG, 10.5, 'white', 'PB')
    dc.label(W / 2, H - 56 + 12, f'{pg:02d}', 13, 'white', 'PB', 0, 'center')
    dc.label(W - MX, H - 56 + 13 + .5, OBS_DISP, 10.5, 'white', 'PB', 0, 'right')
    w = lw(LEGAL_B, 8.5, 'PB') + lw(LEGAL_R, 8.5, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, H - 56 + 34, LEGAL_B, 8.5, 'white', 'PB'); dc.label(x, H - 56 + 34, LEGAL_R, 8.5, 'white', 'PR')
    dc.url(0, H - 56, W / 3, 56, SITE)
    dc.end()


def capa(dc):
    dc.bookmark('capa', 'Capa', 0)
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W + 60, 640, 420, 'green'); dc.circle(W + 20, 640, 310, 'green2'); dc.circle(W + 20, 640, 220, 'black')
    dc.image(LOGO, MX + 20, 110, 150 * 1420 / 1955, 150)
    dc.label(MX + 20, 320, 'CATÁLOGO DE PRODUTOS', 16, 'green2', 'PB', 2.4)
    dc.label(MX + 16, 346, ANO, 110, 'white', 'PB', -2)
    for i, t in enumerate(['Suspensão e direção · Transmissão · Freios', 'Motor · Elétrica e ignição · Filtros e fluidos',
                           'Rodagem e acessórios · Motocicleta']):
        dc.label(MX + 20, 490 + i * 24, t, 14, 'white', 'PR')
    dc.tag(MX + 20, 570, 'CATÁLOGO COMPLETO · USO INTERNO', 9, 'orange', 'white', 9)
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


def sumario(dc, entries, pg):
    dc.bookmark('sumario', 'Sumário', 0)
    dc.top(back=False, right='Catálogo completo')
    dc.rect(0, TOP, W, HERO, fill='hero'); dc.rect(0, TOP + HERO - 1, W, 1, fill='heroline')
    dc.label(MX, TOP + 26, DOC_TITULO, 10, 'gdark', 'PB', 1.6)
    dc.label(MX - 1, TOP + 46, 'Sumário', 40, 'black', 'PB', -.8)
    dc.text(MX, TOP + 94, 520, 'Todas as linhas BAP com as aplicações completas. Toque no nome da linha para ir direto à página.', 11, 16, 'sec')
    grupos = []
    for e in entries:
        if e['group'] not in grupos: grupos.append(e['group'])
    colw = (CW - 24) / 2
    livre = H - FOOT - 10 - (TOP + HERO + 24)
    RH = 22
    while True:                                  # divide os grupos em 2 colunas, em ordem, sem passar do rodapé
        hg = {g: 30 + RH * sum(1 for e in entries if e['group'] == g) + 12 for g in grupos}
        hs = [hg[g] for g in grupos]
        k = min(range(1, len(grupos)), key=lambda i: max(sum(hs[:i]), sum(hs[i:])))
        if max(sum(hs[:k]), sum(hs[k:])) - 12 <= livre or RH <= 18: break
        RH -= 1
    colof = {g: (0 if i < k else 1) for i, g in enumerate(grupos)}
    ys = [TOP + HERO + 24] * 2
    for g in grupos:
        es = [e for e in entries if e['group'] == g]
        col = colof[g]
        x = MX + col * (colw + 24); y = ys[col]
        dc.rect(x, y, colw, 24, fill='black', r=6)
        dc.label(x + 12, y + 6.5, g, 9.5, 'green2', 'PB', 1)
        y += 30
        for e in es:
            dc.label(x + 12, y, e['name'], 11, 'ink', 'PR')
            dc.label(x + colw - 50, y + 1, f"{e['count']} itens", 8.5, 'sec', 'PR', 0, 'right')
            dc.label(x + colw - 8, y, f"{e['pg']:02d}", 11, 'gdark', 'PB', 0, 'right')
            dc.rect(x + 12, y + RH - 4, colw - 20, 1, fill='line2')
            dc.link(x, y - 3, colw, RH, e['key'])
            y += RH
        ys[col] = y + 12
    dc.footer(pg); dc.end()


def contracapa(dc):
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W / 2, 500, 260, 'green'); dc.circle(W / 2, 500, 205, 'black')
    lh = 220; lwid = lh * 1420 / 1955
    dc.image('dimg/logo_grande.png', W / 2 - lwid / 2, 500 - lh / 2, lwid, lh)
    dc.label(W / 2, 840, 'Onde houver movimento, haverá uma peça BAP garantindo o caminho.', 15, 'white', 'PB', 0, 'center')
    dc.label(W / 2, 876, 'www.bapautoparts.com.br  ·  @bapautoparts', 13, 'green2', 'PM', 0, 'center')
    t1 = f'Catálogo BAP {ANO} · '; t3 = ' — exclusivo do time BAP. Proibida a distribuição a clientes e terceiros.'
    w = lw(t1, 10, 'PR') + lw(LEGAL_B, 10, 'PB') + lw(t3, 10, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, H - 70, t1, 10, 'fgrey', 'PR'); x += dc.label(x, H - 70, LEGAL_B, 10, 'white', 'PB'); dc.label(x, H - 70, t3, 10, 'fgrey', 'PR')
    dc.end()


class _Nulo:
    """dc que não desenha nada: mede a altura dos destaques antes de paginar"""
    def __getattr__(self, k): return lambda *a, **kw: 0


TIT_SIS = {'LINHA MOTO': 'Linha Moto'}


def pagina_sistema(dc, grupo, key, itens, pg):
    """uma página só para separar os sistemas (Alexandre, 23/10)"""
    titulo = TIT_SIS.get(grupo, grupo.capitalize())
    dc.bookmark(key, titulo, 0)
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W + 40, 470, 360, 'green'); dc.circle(W + 10, 470, 268, 'green2'); dc.circle(W + 10, 470, 190, 'black')
    dc.image(LOGO, MX, 44, 34 * 1420 / 1955, 34)
    dc.label(MX + 40, 56, DOC_TITULO, 10, 'green2', 'PB', 1.4)
    dc.back_button(48)
    dc.label(MX, 250, 'SISTEMA' if grupo != 'LINHA MOTO' else 'SEÇÃO', 13, 'green2', 'PB', 2)
    size = 64
    while size > 34 and lw(titulo, size, 'PB', -1) > CW - 40: size -= 2
    dc.label(MX - 2, 276, titulo, size, 'white', 'PB', -1)
    n = sum(f['count'] for f, p, k in itens)
    dc.label(MX, 276 + size + 22, f"{len(itens)} {'linha' if len(itens) == 1 else 'linhas'} · {n} itens", 14, 'lgrey', 'PM')
    y = 470
    for f, p, k in itens:
        dc.rect(MX, y + 30, 400, 1, fill='divider')
        eb = f.get('eyebrow', '').split(' · ')[-1] if ' · ' in f.get('eyebrow', '') else ''
        if eb: dc.label(MX, y - 2, eb.upper(), 7.5, 'green2', 'PB', 1.2)
        dc.label(MX, y + 9, f['name'], 15, 'white', 'PB')
        dc.label(MX + 340, y + 12, f"{f['count']} itens", 9.5, 'lgrey', 'PR', 0, 'right')
        dc.label(MX + 400, y + 9, f'{p:02d}', 15, 'green2', 'PB', 0, 'right')
        dc.link(MX, y - 4, 400, 34, k)
        y += 44
    dc.rect(0, H - 56, W, 56, fill='green')
    dc.label(MX, H - 56 + 13, SITE_IG, 10.5, 'white', 'PB')
    dc.label(W / 2, H - 56 + 12, f'{pg:02d}', 13, 'white', 'PB', 0, 'center')
    dc.label(W - MX, H - 56 + 13 + .5, OBS_DISP, 10.5, 'white', 'PB', 0, 'right')
    w = lw(LEGAL_B, 8.5, 'PB') + lw(LEGAL_R, 8.5, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, H - 56 + 34, LEGAL_B, 8.5, 'white', 'PB'); dc.label(x, H - 56 + 34, LEGAL_R, 8.5, 'white', 'PR')
    dc.end()


# Trava dos PDFs (T-0019, T-0017): o fornecedor não sai em nenhum dos 3 PDFs, em nenhum texto: os G.FORNECEDORES do site
# (a SUNRISE; R-20261120-194900-po), pelo G.FORNECEDOR_RE (RD-0226: até 3 sinais entre cada letra, "Sun-Rise"). A
# AUTOIMPACT é concorrência (G.CONCORRENTES_SO_NA_REF; "autorizo" do R-20261121-113400-alexandre): só pode estar nas
# referências cruzadas. O G.CONCORRENTE_RE vale em todo o texto, menos no das referências. O texto do PDF é corrido, então
# a exceção vem antes de juntar: o desenho guarda a caixa de cada referência (Doc.ref, nos destaques e nas tabelas) e a
# palavra com o centro numa dessas caixas é vista só pelo TRAVA_PDF_REF. A referência sai pelo refs_de
# (montar.refs_pela_regra). Se um nome passar onde não pode, o build para e o PDF fica com o fim ".BLOQUEADO" (não entregar).
from site_regras import G as _G
TRAVA_PDF = re.compile(_G.FORNECEDOR_RE + '|' + _G.CONCORRENTE_RE, re.I)   # fora das referências
TRAVA_PDF_REF = re.compile(_G.FORNECEDOR_RE, re.I)                          # dentro das referências


def textos_pdf(page, caixas):
    """(texto fora das referências, texto das referências) da página: cada palavra, na ordem do PDF, vai para o 2º se o
    centro dela estiver numa das caixas (x0, y0, x1, y1) do Doc.ref"""
    fora, dentro = [], []
    for x0, y0, x1, y1, w, *_ in page.get_text('words'):
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        (dentro if any(a <= cx <= c and b <= cy <= d for a, b, c, d in caixas) else fora).append(w)
    return ' '.join(fora), ' '.join(dentro)


def achados_pdf(d, areas=()):
    """[(página, trecho)] de cada nome que a trava barra no PDF aberto (pymupdf), com as caixas das referências (Doc.ref)"""
    por_pg = {}
    for pg, cx in areas: por_pg.setdefault(pg, []).append(cx)
    out = []
    for i, p in enumerate(d):
        for t, rx in zip(textos_pdf(p, por_pg.get(i, ())), (TRAVA_PDF, TRAVA_PDF_REF)):
            if (m := rx.search(t)): out.append((i + 1, t[max(0, m.start() - 40):m.end() + 20]))
    return out


def trava_pdf(out, areas=()):
    import os, pymupdf
    with pymupdf.open(out) as d:
        achados = achados_pdf(d, areas)
    if not achados: return
    os.replace(out, out + '.BLOQUEADO')
    ex = [f"pág. {pg}: ...{t}..." for pg, t in achados[:5]]
    raise SystemExit(f"[PARADO] {os.path.basename(out)} sairia com nome de fornecedor ou da concorrência fora da referência "
                     f"em {len({pg for pg, t in achados})} página(s) (ficou em {os.path.basename(out)}.BLOQUEADO):\n  "
                     + '\n  '.join(x.replace('\n', ' ') for x in ex))


def build(out):
    import print_cat as PC                       # cabeçalho e destaques iguais aos do A4
    import filtros_split as FS                   # FILTRAÇÃO por tipo de filtro (12/11)
    lista = FS.dividir(fams)
    plan, grupos, pg = [], [], 3
    for i, f in enumerate(lista):
        if not grupos or grupos[-1]['g'] != f['group']:
            grupos.append(dict(g=f['group'], key=f'sis_{len(grupos)}', pg=pg, itens=[])); pg += 1
        top, rest = PC.pick(f)
        y_tab = PC.cards(_Nulo(), f, top, TOP + HERO + 12 + 21) + 14
        fora = {id(r) for r in top if not r.get('_card_cut') and len((r.get('refs') or '').split(' · ')) <= 2}
        # destaque com aplicação e equivalências inteiras não se repete na tabela
        tab = [r for r in f['rows'] if id(r) not in fora]
        pages = paginate(prep_rows(f, tab), HEAD_Y, app_w(f), y_tab + 21 + 20) if tab else [[]]
        key = f'fam_{i}'
        plan.append((f, key, pages, pg, top, grupos[-1])); grupos[-1]['itens'].append((f, pg, key)); pg += len(pages)
    entries = [dict(name=f['name'], group=f['group'], count=f['count'], pg=p0, key=k) for f, k, pages, p0, top, g in plan]
    dc = Doc(out)
    capa(dc)
    sumario(dc, entries, 2)
    for f, k, pages, p0, top, g in plan:
        if g['itens'][0][0] is f:
            pagina_sistema(dc, g['g'], g['key'], g['itens'], g['pg'])
        for j, rows in enumerate(pages):
            table_page(dc, f, rows, p0 + j, j > 0, (PC, top, k) if j == 0 else None)
    contracapa(dc)
    dc.c.showOutline(); dc.c.save()
    trava_pdf(out, dc.areas_ref)
    PC.log_destaques()
    return pg + 1, entries


def main():
    n, entries = build('digital_novo.pdf')
    return n, entries
if __name__ == '__main__':
    main()
    print('páginas', n, '| linhas com datas ajustadas', CORR, '| sinalizados', datas.FLAG)
    print({e['name']: e['count'] for e in entries if e['name'] in ('Interruptores', 'Pneus e Câmaras de Ar Moto')})
