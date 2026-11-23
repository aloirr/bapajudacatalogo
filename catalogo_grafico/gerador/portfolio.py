"""Portfólio de Produtos BAP AUTOPARTS — catálogo de apresentação (16:9) para quem quer conhecer a BAP.

Organização (Alexandre, 23/10): LINHA (Leve, Pesada, Moto, Universal) → SISTEMA → FAMÍLIA → produto,
conforme a classificação da base unificada / Catálogo BAP 2026.
Material para cliente/prospect: sem estoque, sem preço, sem aviso de uso interno, sem nome de cliente.
Uso (dentro de gerador/):  python portfolio.py [saida.pdf] [base.xlsx]
"""
import sys, os, collections, html
import pandas as pd
import apres_bemol as A
from apres_bemol import S, W, H
from taxo import ORDER_SIS, META
from plural import plural
from detalhe import BASE_UNIFICADA as BASE   # a base unificada do Git (dados/), como nos 3 PDFs

NOME = 'BAP AUTOPARTS'
SITE = 'www.bapautoparts.com.br  ·  @bapautoparts'
A.C.update(dict(ochip='#fdeedd', gchip='#e3f1e0', soft='#f3f6f2'))
pw = A.pdfmetrics.stringWidth

LINHAS = [('LEVE', 'Linha Leve', 'Automóveis, picapes e utilitários.'),
          ('PESADA', 'Linha Pesada', 'Caminhões, ônibus, implementos e reboques.'),
          ('MOTO', 'Linha Moto', 'Motocicletas.'),
          ('UNIVERSAL', 'Universal', 'Lubrificantes, químicos e acessórios para qualquer veículo.')]
MINIMO = {'LEVE': 3, 'PESADA': 3, 'MOTO': 1, 'UNIVERSAL': 1}     # nº mínimo de itens para o produto aparecer na linha
TITULO = {'SUSPENSÃO': 'Suspensão', 'DIREÇÃO': 'Direção', 'TRANSMISSÃO': 'Transmissão', 'FREIO': 'Freio',
          'ARREFECIMENTO': 'Arrefecimento', 'MOTOR': 'Motor', 'ELÉTRICA': 'Elétrica', 'FILTRAÇÃO': 'Filtração',
          'LUBRIFICANTES': 'Lubrificantes', 'QUÍMICOS': 'Químicos', 'RODAGEM': 'Rodagem', 'ACESSÓRIOS': 'Acessórios'}
FRASE = {'SUSPENSÃO': 'Conforto, estabilidade e segurança.', 'DIREÇÃO': 'Precisão e firmeza no controle.',
         'TRANSMISSÃO': 'Força do motor chegando às rodas.', 'FREIO': 'Frenagem segura.',
         'ARREFECIMENTO': 'Motor na temperatura certa.', 'MOTOR': 'Lubrificação, alimentação e sincronismo.',
         'ELÉTRICA': 'Partida, ignição, iluminação e sinalização.', 'FILTRAÇÃO': 'Ar, óleo, combustível e cabine limpos.',
         'LUBRIFICANTES': 'Óleos para motor, transmissão e hidráulico.', 'QUÍMICOS': 'Manutenção e proteção do veículo.',
         'RODAGEM': 'Cubos, rolamentos, rodas e pneus.', 'ACESSÓRIOS': 'Visibilidade e transporte de carga.'}
SEM_IMAGEM = {'Cuíca de Freio'}          # a imagem da linha mostra marca de terceiro
# produtos com mais de uma família (Filtros, Óleo, Químicos): o card leva o nome da família
FAM_CARD = {
    'FILTROS DE AR': ('Filtros de Ar', 'Filtros de ar do motor.', None),
    'FILTROS DE ÓLEO': ('Filtros de Óleo', 'Filtros de óleo do motor.', None),
    'FILTROS DE COMBUSTÍVEL': ('Filtros de Combustível', 'Filtros de combustível para motores flex, gasolina e diesel.', None),
    'FILTROS DE CABINE': ('Filtros de Cabine', 'Filtros do ar-condicionado (cabine).', None),
    'OUTROS FILTROS': ('Outros Filtros', 'Filtros especiais da linha pesada.', None),
    'ÓLEOS DE MOTOR': ('Óleos de Motor', 'Óleos de motor sintéticos, semissintéticos e minerais.', None),
    'ÓLEOS DE TRANSMISSÃO': ('Óleos de Transmissão', 'Óleos para câmbio e diferencial (API GL-4 e GL-5).', None),
    'ÓLEOS HIDRÁULICOS': ('Óleo Hidráulico', 'Óleo para sistemas hidráulicos.', None),
    'ADITIVOS': ('Aditivos para Radiador', 'Fluidos para radiador, concentrados e prontos para uso.', 'pptimg/RAD25005P.png'),
    'FLUIDOS DOT': ('Fluidos de Freio DOT', 'Fluidos de freio DOT 3 e DOT 4.', ''),
    'SELANTES E SPRAYS': ('Selantes e Sprays', 'Adesivos de silicone, desengripante, descarbonizante e silicone spray.', 'pptimg/SIL3502.png'),
    'ÁGUA DESMINERALIZADA': ('Água Desmineralizada', 'Água desmineralizada para o sistema de arrefecimento.', 'pptimg/RAD25009P.png'),
}
MOTO_CARD = {'Óleo Lubrificante': ('Óleo 4T', 'Óleo para motores de motocicleta 4 tempos.'),
             'Velas de Ignição': ('Velas de Ignição', 'Velas de ignição para motores de motocicleta.'),
             'Rolamentos': ('Rolamentos', 'Rolamentos de roda e de direção para motocicletas.'),
             'Lâmpadas': ('Lâmpadas', 'Lâmpadas para farol e sinalização de motocicletas.')}


def fmt(n):
    return f'{n:,}'.replace(',', '.')


def tit(s):
    ws = s.split()
    return ' '.join(w.lower() if (i and w in ('E', 'DE', 'DO', 'DA', 'DOS', 'DAS')) else w.capitalize() for i, w in enumerate(ws))


class P(S):
    def header(self, kicker, title, right=None):
        self.rect(0, 0, W, 6, fill='green')
        self.img(A.LOGO, 40, 26, 22, 30)
        self.t(72, 34, NOME, 8.5, 'gdark', 'PB', ls=1.6)
        self.t(40, 66, kicker.upper(), 10, 'green', 'PB', ls=1.6)
        self.t(38, 84, title, 30, 'ink', 'PB', ls=-.5)
        if right:
            self.t(W - 40, 34, right, 9.5, 'grey', 'PM', 'right')

    def footer(self):
        self.n += 1
        self.rect(40, H - 34, W - 80, .8, fill='line')
        self.t(40, H - 26, SITE, 8.5, 'grey', 'PR')
        self.t(W / 2, H - 26, 'Imagens ilustrativas.', 7.5, 'grey', 'PR', 'center')
        self.t(W - 40, H - 26, f'{self.n:02d}', 9, 'gdark', 'PB', 'right')
        self.c.showPage()

    def chip(self, x, y, txt, fg='gdark', bg='gchip', size=7.5):
        w = pw(txt, 'PB', size) + size * .12 * len(txt) + 14
        self.rect(x, y, w, size + 9, fill=bg, r=(size + 9) / 2)
        self.t(x + 7, y + 4.3, txt, size, fg, 'PB', ls=size * .12)
        return w + 5

    def foto(self, path, x, y, w, h, bg='soft'):
        self.rect(x, y, w, h, fill=bg, r=10)
        if path and os.path.exists(path):
            self.img(path, x + 8, y + 6, w - 16, h - 12)
        else:
            k = min(w, h)
            self.img(A.LOGO_G, x + w / 2 - k * .2, y + h / 2 - k * .3, k * .4, k * .6)


# ---------------------------------------------------------------- dados: linha → sistema → família → produto
def dados(base):
    import moto
    b = pd.read_excel(base, 'PRODUTOS', dtype=str).fillna('')
    B = {c.strip().upper(): r for c, r in zip(b.CODIGO_BAP, b.to_dict('records'))}
    moto_cod = {r['code'].strip().upper() for f in moto.FAMS if f.get('moto') for r in f['rows']}
    img = {f['name']: (None if f['name'] in SEM_IMAGEM else f.get('img')) for f in moto.FAMS}
    lanc = {f['name']: bool(f.get('lanc')) for f in moto.FAMS}
    spec = {f['name']: bool(f.get('spec')) for f in moto.FAMS}
    nfam = collections.defaultdict(set)
    acc = collections.defaultdict(set)          # (linha, sistema, familia, produto) -> códigos
    ordem = collections.defaultdict(list)       # mesma chave -> linhas do catálogo na ordem do catálogo (ranking)
    todos = set()
    for f in moto.FAMS:
        if f.get('moto'): continue
        for r in f['rows']:
            c = r['code'].strip().upper(); x = B.get(c, {})
            if not x: continue
            todos.add(c)
            L = x['LINHA']; ls = set()
            if L in ('LEVE', 'LEVE E PESADA'): ls.add('LEVE')
            if L in ('PESADA', 'LEVE E PESADA'): ls.add('PESADA')
            if L == 'MOTO' or c in moto_cod: ls.add('MOTO')
            if L == 'UNIVERSAL': ls.add('UNIVERSAL')
            nfam[f['name']].add(x['FAMILIA'])
            for l in ls:
                acc[(l, x['SISTEMA'], x['FAMILIA'], f['name'])].add(c)
                ordem[(l, x['SISTEMA'], x['FAMILIA'], f['name'])].append(r)
    arv = {l: collections.OrderedDict() for l, _, _ in LINHAS}
    for (l, sis, fam, prod), cs in sorted(acc.items(), key=lambda kv: (ORDER_SIS.index(kv[0][1]) if kv[0][1] in ORDER_SIS else 99, kv[0][2], kv[0][3])):
        if len(cs) < MINIMO[l]: continue
        if l == 'MOTO' and prod in MOTO_CARD:
            nome, desc = MOTO_CARD[prod]; im = img.get(prod)
        elif len(nfam[prod]) > 1 and fam in FAM_CARD:
            nome, desc, im = FAM_CARD[fam]
            if im is None: im = img.get(prod)
        else:
            nome, desc, im = prod, META.get(prod, {}).get('desc', ''), img.get(prod)
        card = dict(nome=nome, desc=desc, img=im, n=len(cs), lanc=lanc.get(prod, False), prod=prod,
                    rows=ordem[(l, sis, fam, prod)], linha=l, spec=spec.get(prod, False))
        arv[l].setdefault(sis, collections.OrderedDict()).setdefault(fam, []).append(card)
    return arv, len(todos)


# ---------------------------------------------------------------- desenho
def card_v(s, c, x, y, w, h):
    """card vertical: foto em cima, nome, descrição e nº de itens"""
    s.rect(x, y, w, h, fill='white', stroke='line', r=12, sw=.8)
    ih = h - 80
    s.foto(c['img'], x + 7, y + 7, w - 14, ih)
    if c['lanc']: s.chip(x + 14, y + 14, 'NOVIDADE 2026', 'white', 'orange', 6.8)
    size = 13
    while size > 9.5 and pw(c['nome'], 'PB', size) > w - 26: size -= .25
    yy = y + 7 + ih + 10
    s.t(x + 13, yy, c['nome'], size, 'ink', 'PB')
    s.p(x + 13, yy + 18, w - 26, html.escape(curto(c['desc'], w - 26, 8.2, 2)), 8.2, 10.6, 'sec')
    s.t(x + 13, y + h - 20, f"{c['n']} {plural(c['n'])}", 8, 'grey', 'PM')


def curto(t, w, size, n):
    """corta a descrição em n linhas (termina em '…' se precisar)"""
    from reportlab.lib.utils import simpleSplit
    ls = simpleSplit(t, 'PR', size, w)
    if len(ls) <= n: return t
    r = ' '.join(ls[:n])
    while simpleSplit(r + '…', 'PR', size, w).__len__() > n: r = r.rsplit(' ', 1)[0]
    return r.rstrip(',;') + '…'


def card_h(s, c, x, y, w, h):
    """card horizontal (pouca altura): foto à esquerda"""
    s.rect(x, y, w, h, fill='white', stroke='line', r=12, sw=.8)
    iw = min(h - 14, w * .42)
    s.foto(c['img'], x + 7, y + 7, iw, h - 14)
    tx = x + 7 + iw + 10; tw = w - (tx - x) - 10
    size = 11.5
    nm = c['nome']
    while size > 8.8 and pw(nm, 'PB', size) > tw * 2 - 10: size -= .25
    hn = s.p(tx, y + 9, tw, html.escape(nm), size, size * 1.15, 'ink', 'PB')
    if c['lanc']:
        s.chip(tx, y + 12 + hn, 'NOVIDADE', 'white', 'orange', 6.2); hn += 16
    s.p(tx, y + 12 + hn, tw, html.escape(c['desc']), 7.6, 9.8, 'sec')
    s.t(tx, y + h - 17, f"{c['n']} {plural(c['n'])}", 7.8, 'grey', 'PM')


def pacote(fams, cols):
    """agrupa as famílias em fileiras de até `cols` cards (família grande ocupa fileiras inteiras)"""
    rows, cur, usado = [], [], 0
    for fam, cards in fams.items():
        k = len(cards)
        if k > cols:
            if cur: rows.append(cur); cur, usado = [], 0
            for i in range(0, k, cols): rows.append([(fam if i == 0 else fam + ' (cont.)', cards[i:i + cols])])
            continue
        if usado + k > cols:
            rows.append(cur); cur, usado = [], 0
        cur.append((fam, cards)); usado += k
    if cur: rows.append(cur)
    return rows


def pagina_sistema(s, lin_nome, num, sis, fams):
    n_it = sum(c['n'] for cs in fams.values() for c in cs); n_pr = sum(len(cs) for cs in fams.values())
    s.header(f'{lin_nome} · {num:02d} · {FRASE[sis]}', TITULO[sis],
             f"{len(fams)} {plural(len(fams), 'família', 'famílias')} · {n_pr} {plural(n_pr, 'produto', 'produtos')} · {fmt(n_it)} {plural(n_it)}")
    top, bot = 128, H - 46
    if n_pr == 1:
        fam, cards = next(iter(fams.items())); heroi(s, fam, cards[0], top, bot); s.footer(); return
    cols = 4 if max(len(cs) for cs in fams.values()) >= 4 or n_pr >= 7 else 3
    rows = pacote(fams, cols)
    gap, lab = 12, 20
    ch = min(300, (bot - top - len(rows) * (lab + gap) + gap) / len(rows))
    cw = (W - 80 - gap * (cols - 1)) / cols
    y = top
    for row in rows:
        x = 40
        for fam, cards in row:
            gw = len(cards) * cw + (len(cards) - 1) * gap
            s.rect(x, y + 13, gw, 1.2, fill='green')
            s.t(x, y, tit(fam.replace(' (cont.)', '')).upper() + (' (cont.)' if '(cont.)' in fam else ''), 8.5, 'gdark', 'PB', ls=1.3)
            for k, c in enumerate(cards):
                cx = x + k * (cw + gap)
                (card_v if ch >= 150 else card_h)(s, c, cx, y + lab, cw, ch)
            x += gw + gap
        y += lab + ch + gap
    s.footer()


def carro(mod, m):
    """o "mesmo carro" de uma aplicação: a montadora (a 1ª, se forem várias) e o modelo, com o número quando o nome
    é uma sigla (CG 125, G 400). Na linha da base v27 a montadora vem na frente: "FORD ECOSPORT 1.6 L" = "Ford" +
    "Ecosport 1.6 L 16V"."""
    import re
    from montar import BRANDS_RX, BR_SHORT
    from pneus_fix import BR
    t = mod.upper()
    if not m:
        pre = re.match(rf'(?:{BRANDS_RX}|{BR}|VW|MB)\b[:\s]*', t)
        if pre: m, t = pre.group(0), t[pre.end():]
    mt = re.split(r'\s*[/+]\s*', m.upper().strip(' :'))[0]
    mt = BR_SHORT.get(mt.replace('Ë', 'E'), mt)
    ws = [w.strip(':;.') for w in re.split(r'[\s/,]+', t) if w.strip(':;.')] or ['']
    if re.fullmatch(r'\d+', ws[0]) and len(ws) > 1 and re.fullmatch(r'[A-ZÀ-Ý]{3,}', ws[1]):
        return mt, ws[1]                                                # MB 1315 ATEGO: o modelo é o Atego
    if re.fullmatch(r'[A-Z]{1,3}', ws[0]) and len(ws) > 1 and re.fullmatch(r'\d{2,4}', ws[1]):
        return mt, ws[0] + ' ' + ws[1]                                  # sigla + número: CG 125 ≠ CG 150 (o Atego 1315 é Atego)
    return mt, ws[0]


def aplicacoes(rows, n=12):
    """principais aplicações na ordem do catálogo (ranking): montadora + modelos, sem repetir"""
    import re
    out, vistos = [], set()
    for r in rows:
        segs = r.get('segs') or []
        tr, cur = [], None
        for t, b in segs:
            if b: cur = [t.strip(), '']; tr.append(cur); continue
            # APLICACAO da base v27: uma aplicação por linha. A linha quebrada no meio (a de cima sem ano no fim
            # e esta sem uma 1ª palavra já vista, como "SUSPENSÃO" + "PNEUMÁTICA 4X2...") continua a de cima.
            lns, vistas = t.split('\n'), set()
            for k, ln in enumerate(lns):
                p1 = (ln.split() or [''])[0]
                if cur is None or (k and (re.search(r'(?:(?:19|20)\d{2}|[>+])\s*[·;]?\s*$', lns[k - 1]) or p1 in vistas)):
                    cur = ['', ln]; tr.append(cur); vistas.add(p1)
                else: cur[1] += (' ' if k else '') + ln
        for m, t in tr:
            mod = re.split(r'\s·\s|;\s|\s\(', t.strip(' ·;'))[0].strip(' ,·/')
            ano = re.search(r'(?:\s+[-–])?\s*(?:\d{2}/)?(?:19|20)\d{2}.*$', mod)            # o ano (e o " - " antes dele)
            if ano and re.search(r'(?:^|\s)(?<!\d\s)[A-Za-z]-?$', mod[:ano.start()]): continue   # "FORD F 2000": não é ano, o corte partiria o modelo
            if ano: mod = mod[:ano.start()].strip(' ,·/')                                       # tira anos
            if not mod and not m: continue
            if len(mod) > 46: mod = mod[:46].rsplit('/', 1)[0].rsplit(',', 1)[0].strip(' ,/') + '…'
            mod = re.sub(r'(?i)\s*\b(?:diant|tras|dir|esq|sup|inf)(?:eir[oa]|eit[oa]|uerd[oa]|erior)?\.?(?=\s|$)', '', mod).strip(' ,·/+')
            if not mod: continue
            k = carro(mod, m)                                                # não repetir o mesmo carro
            if k in vistos or (k[0], k[1].split(' ')[0]) in vistos: continue   # "Dodge RAM" já cobre o "RAM 2500"
            vistos.add(k); out.append((m, mod))
            if len(out) >= n: return out
    return out


def heroi(s, fam, c, top, bot):
    import re
    ih = bot - top - 30
    s.foto(c['img'], 40, top, 400, ih)
    if c['lanc']: s.chip(56, top + 16, 'NOVIDADE 2026', 'white', 'orange', 7.5)
    s.t(40, top + ih + 12, f"{c['n']} {plural(c['n'])}", 11, 'grey', 'PM')          # nº de itens embaixo da imagem
    x = 476; y = top + 6; wr = W - 40 - x
    s.t(x, y, tit(fam).upper(), 9.5, 'gdark', 'PB', ls=1.4); y += 22
    s.t(x, y, c['nome'], 28, 'ink', 'PB', ls=-.4); y += 46
    y += s.p(x, y, wr, html.escape(c['desc']), 13, 19, 'sec') + 22
    if c.get('spec'):                       # produto sem aplicação por veículo: mostra os principais itens
        ap, vist = [], set()
        for r in c.get('rows') or []:
            t = ''.join(x_ for x_, b in r.get('segs') or []).split(' — ')[0].strip()
            t = t[:1].upper() + t[1:]
            if t and t.upper() not in vist: vist.add(t.upper()); ap.append(('', t))
            if len(ap) >= 12: break
        titulo, nota = 'ESPECIFICAÇÕES', ''
    else:
        ap = aplicacoes(c.get('rows') or [])
        titulo, nota = 'PRINCIPAIS APLICAÇÕES', ''
    if not ap: return
    s.t(x, y, titulo, 9.5, 'gdark', 'PB', ls=1.4)
    s.rect(x, y + 16, wr, 1.2, fill='green'); y += 28
    cols = 1 if (c.get('spec') or len(ap) <= 6) else 2
    if cols == 1: ap = ap[:9]
    cw = (wr - 18 * (cols - 1)) / cols
    lin = (len(ap) + cols - 1) // cols
    FS = 10.2; LD = 23
    for k, (m, mod) in enumerate(ap):
        cx = x + (k // lin) * (cw + 18); cy = y + (k % lin) * LD
        s.circle(cx + 3.2, cy + 5.2, 2.1, 'green')
        mm = (m.title() if len(m) > 3 else m) if m else ''
        livre = cw - 14 - (pw(mm + ' ', 'PB', FS) if mm else 0)
        t = mod
        while pw(t, 'PR', FS) > livre and re.search(r'\s[/,]\s?', t):    # tira o último modelo inteiro
            t = re.split(r'\s*[/,]\s*(?=[^/,]*$)', t)[0].strip()
        while t and pw(t, 'PR', FS) > livre:                              # ainda grande: corta com …
            t = t[:-2].rstrip(' ,/-')
            if pw(t + '…', 'PR', FS) <= livre: t += '…'; break
        if mm: s.t(cx + 12, cy, mm, FS, 'ink', 'PB')
        s.t(cx + 12 + (pw(mm + ' ', 'PB', FS) if mm else 0), cy, t, FS, 'ink', 'PR')
    if nota: s.t(x, y + lin * LD + 6, nota, 8, 'grey', 'PR')


def pagina_linha(s, cod, nome, desc, arv):
    """divisória da linha: lista sistema → família → produtos, estilo menu (sem fundo, com marcador)"""
    from reportlab.lib.utils import simpleSplit
    sis = arv[cod]
    n_it = sum(c['n'] for f in sis.values() for cs in f.values() for c in cs)
    n_fam = sum(len(f) for f in sis.values()); n_pr = sum(len(cs) for f in sis.values() for cs in f.values())
    PW = 250                                           # painel escuro à esquerda
    s.rect(0, 0, W, H, fill='white')
    s.rect(0, 0, PW, H, fill='black')
    s.circle(30, H + 30, 150, 'green'); s.circle(30, H + 30, 104, 'black')   # enfeite só dentro do painel
    s.img(A.LOGO, 36, 40, 34, 48)
    s.t(38, 150, 'PORTFÓLIO DE PRODUTOS', 9, 'green2', 'PB', ls=1.8)
    s.t(36, 170, nome, 32 if pw(nome, 'PB', 32) < PW - 60 else 26, 'white', 'PB', ls=-.6)
    s.p(38, 220, PW - 70, html.escape(desc), 11.5, 16, 'lgrey')
    for i, (a, b) in enumerate([(len(sis), 'sistemas'), (n_fam, 'famílias'), (n_pr, 'produtos'), (fmt(n_it), 'itens')]):
        yy = 292 + i * 32
        s.t(38, yy, str(a), 19, 'green2', 'PB'); s.t(38 + pw(str(a), 'PB', 19) + 8, yy + 6, b, 10.5, 'white', 'PR')
    # lista em 4 colunas (bloco do sistema vai para a coluna mais curta)
    cols, gap = 4, 18
    x0 = PW + 28; cw = (W - 34 - x0 - gap * (cols - 1)) / cols
    FS, LD, IND = 8.8, 14.5, 11
    def linhas(c): return simpleSplit(c['nome'] + ('    ' if c['lanc'] else ''), 'PM', FS, cw - IND - 2)
    def alt(f): return 26 + sum(16 + sum(LD * len(linhas(c)) for c in cs) + 7 for cs in f.values())
    # colunas em sequência (01, 02, 03... de cima para baixo), equilibradas pela altura
    itens = list(sis.items()); hs = [alt(f) + 14 for _, f in itens]
    import itertools
    melhor = None
    for cortes in itertools.combinations(range(1, len(hs)), min(cols - 1, len(hs) - 1)):
        b = (0,) + cortes + (len(hs),)
        mx = max(sum(hs[b[i]:b[i + 1]]) for i in range(len(b) - 1))
        if melhor is None or mx < melhor[0]: melhor = (mx, b)
    b = melhor[1]; col_de = []
    for i in range(len(b) - 1): col_de += [i] * (b[i + 1] - b[i])
    ys = [36] * cols
    for i, (sn, f) in enumerate(itens, 1):
        c_ = col_de[i - 1]; x = x0 + c_ * (cw + gap); y = ys[c_]
        s.t(x, y, f'{i:02d}', 9.5, 'green', 'PB'); s.t(x + 20, y, TITULO[sn].upper(), 9.5, 'ink', 'PB', ls=1.1)
        s.rect(x, y + 16, cw, 1.4, fill='green')
        yy = y + 26
        for fam, cs in f.items():
            s.t(x, yy, tit(fam).upper(), 6.9, 'gdark', 'PB', ls=1); yy += 16
            for c in cs:
                s.circle(x + 3.2, yy + 4.6, 1.9, 'green')            # marcador
                ls_ = simpleSplit(c['nome'], 'PM', FS, cw - IND - 2 - (30 if c['lanc'] else 0))
                for k, ln in enumerate(ls_):
                    s.t(x + IND, yy + k * LD, ln, FS, 'ink', 'PM')
                if c['lanc']:
                    s.t(x + IND + pw(ls_[-1], 'PM', FS) + 5, yy + (len(ls_) - 1) * LD + 1.2, 'NOVO', 6, 'orange', 'PB', ls=.6)
                yy += LD * len(ls_)
            yy += 7
        ys[c_] = yy + 14
    s.n += 1
    s.t(W - 40, H - 26, f'{s.n:02d}', 9, 'gdark', 'PB', 'right')
    if max(ys) - 14 > H - 40: print('ATENÇÃO: lista passou da página na', nome, max(ys))
    s.c.showPage()


def build(out, base=BASE):
    arv, total = dados(base)
    produtos = {c['prod'] for l in arv.values() for f in l.values() for cs in f.values() for c in cs}
    sistemas = {sn for l in arv.values() for sn in l}
    s = P(out)
    s.c.setTitle('Portfólio de Produtos BAP AUTOPARTS'); s.c.setAuthor(NOME)

    # capa
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 60, 290, 330, 'green'); s.circle(W - 80, 290, 255, 'green2'); s.circle(W - 80, 290, 190, 'black')
    s.img(A.LOGO, 60, 52, 46, 64)
    s.t(62, 150, 'PORTFÓLIO DE PRODUTOS 2026', 11, 'green2', 'PB', ls=2)
    s.t(58, 172, 'Conheça a', 50, 'white', 'PB', ls=-1)
    s.t(58, 228, NOME, 50, 'white', 'PB', ls=-1)
    s.p(62, 300, 410, 'Peças, baterias, filtros, lubrificantes, químicos, pneus e acessórios para as linhas leve, pesada e moto, '
        'organizados por linha, sistema do veículo e família de produto.', 13, 19, 'lgrey')
    s.t(62, 470, 'Outubro de 2026', 10, 'lgrey', 'PM')
    for i, f in enumerate(['dimg/cover_0.png', 'dimg/cover_16.png', 'dimg/cover_34.png', 'dimg/cover_27.png', 'dimg/cover_10.png', 'dimg/cover_36.png']):
        r_, c_ = divmod(i, 3); x = 560 + c_ * 120; y = 120 + r_ * 150
        s.rect(x, y, 110, 138, fill='white', r=16); s.img(f, x + 8, y + 10, 94, 118)
    s.c.showPage(); s.n += 1

    # quem somos
    s.header('Quem somos', NOME)
    s.p(40, 132, 600, 'Empresa brasileira criada em 2021 para oferecer componentes automotivos de qualidade, com segurança e preço acessível. '
        'O portfólio vai da suspensão à parte elétrica, passando por filtros, lubrificantes e químicos, para as linhas leve, pesada e moto.', 13, 20, 'sec')
    tiles = [(str(len(produtos)), 'linhas de produtos'), (f'+{fmt(total // 100 * 100)}', 'itens no catálogo'),
             (str(len(sistemas)), 'sistemas do veículo'), ('3', 'linhas: leve, pesada e moto')]
    for i, (a, b) in enumerate(tiles):
        x = 40 + i * 222
        s.rect(x, 250, 206, 130, fill='black', r=16)
        s.t(x + 103, 280, a, 32, 'green2', 'PB', 'center'); s.t(x + 103, 334, b, 11, 'white', 'PR', 'center')
    A.garantia(s)
    s.footer()

    # como o portfólio está organizado
    s.header('Nosso portfólio', 'Linha, sistema e família', 'conforme o Catálogo BAP 2026')
    w = (W - 80 - 3 * 14) / 4
    for i, (cod, nome, desc) in enumerate(LINHAS):
        sis = arv[cod]; x = 40 + i * (w + 14)
        n_it = sum(c['n'] for f in sis.values() for cs in f.values() for c in cs)
        n_pr = sum(len(cs) for f in sis.values() for cs in f.values())
        s.rect(x, 128, w, 330, fill='black', r=16)
        s.t(x + 18, 148, nome, 20, 'white', 'PB')
        s.p(x + 18, 178, w - 36, html.escape(desc), 10, 14, 'lgrey')
        s.t(x + 18, 222, f'{len(sis)} sistemas · {n_pr} produtos', 9.5, 'green2', 'PM')
        s.t(x + 18, 238, f'{fmt(n_it)} itens', 9.5, 'green2', 'PM')
        yy = 264
        for sn in sis:
            s.t(x + 18, yy, '•  ' + TITULO[sn], 10, 'white', 'PR'); yy += 16
    s.rect(40, 470, 880, 1, fill='line')
    s.t(40, 478, 'Cada produto aparece na linha (leve, pesada, moto ou universal) em que tem aplicação. Dentro da linha: sistema do veículo → família → produto.', 9, 'grey', 'PR')
    s.footer()

    for cod, nome, desc in LINHAS:
        if not arv[cod]: continue
        pagina_linha(s, cod, nome, desc, arv)
        for i, (sn, fams) in enumerate(arv[cod].items(), 1):
            for fam, cards in fams.items():
                for c in cards:
                    s.header(f'{nome} · {i:02d} · {TITULO[sn]}', TITULO[sn])
                    heroi(s, fam, c, 128, H - 46)
                    s.footer()

    # contato
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 110, 280, 280, 'green'); s.circle(W - 125, 280, 215, 'green2'); s.circle(W - 125, 280, 160, 'black')
    s.img(A.LOGO_G, W - 125 - 62, 280 - 85, 124, 170)
    s.img(A.LOGO, 60, 52, 36, 50)
    s.t(62, 150, 'PORTFÓLIO DE PRODUTOS 2026', 11, 'green2', 'PB', ls=2)
    s.t(58, 178, 'Vamos conversar?', 50, 'white', 'PB', ls=-1)
    s.p(62, 252, 430, 'Fale com o nosso time comercial: mostramos as aplicações por veículo e ajudamos a montar o mix certo para a sua loja ou oficina.', 14, 21, 'lgrey')
    s.rect(62, 366, 420, 112, fill='card', r=16); s.rect(62, 366, 5, 112, fill='green')
    s.t(84, 382, 'Alexandre Guerreiro', 16, 'white', 'PB')
    s.t(84, 404, f'Gerente Comercial · {NOME}', 10.5, 'lgrey', 'PR')
    s.t(84, 428, 'alexandre.guerreiro@bapautoparts.com.br', 11.5, 'green2', 'PM')
    s.t(84, 450, '(92) 99250-8980', 11.5, 'green2', 'PM')
    s.t(62, 500, SITE, 10, 'lgrey', 'PR')
    s.c.showPage()
    s.c.save()
    return {l: (len(arv[l]), sum(len(cs) for f in arv[l].values() for cs in f.values())) for l in arv}, total, s.n + 1


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'saidas/Portfolio_Produtos_BAP_AUTOPARTS.pdf'
    print(build(out, sys.argv[2] if len(sys.argv) > 2 else BASE))
