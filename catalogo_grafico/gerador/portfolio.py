"""Portfólio de Produtos BAP AUTOPARTS — catálogo de apresentação (16:9) para quem quer conhecer a BAP.

Organização (Alexandre, 23/10): LINHA (Leve, Pesada, Moto, Universal) → SISTEMA → FAMÍLIA → produto,
conforme a classificação da base unificada / Catálogo BAP 2026.
Material para cliente/prospect: sem estoque, sem preço, sem aviso de uso interno, sem nome de cliente.
Uso (dentro de gerador/):  python portfolio.py [saida.pdf] [base.xlsx]
"""
import sys, os, re, collections, html, datetime
import pandas as pd
import apres_bemol as A
from apres_bemol import S, W, H
from taxo import ORDER_SIS, META, HEAVY
from plural import plural
from detalhe import BASE_UNIFICADA as BASE   # a base unificada do Git (dados/), como nos 3 PDFs
from digital2 import ANO                     # o ano do Catálogo BAP (2027): capa, contracapa e pág. 3
from montar import KEEPU                     # siglas que ficam em maiúsculas (VW, GM, MB), as mesmas do montar.tcase

NOME = 'BAP AUTOPARTS'
SITE = 'www.bapautoparts.com.br  ·  @bapautoparts'
A.C.update(dict(gchip='#e3f1e0', soft='#f3f6f2'))
pw = A.pdfmetrics.stringWidth

LINHAS = [('LEVE', 'Linha Leve', 'Automóveis, picapes e utilitários.'),
          ('PESADA', 'Linha Pesada', 'Caminhões, ônibus, implementos e reboques.'),
          ('MOTO', 'Linha Moto', 'Motocicletas.'),
          ('UNIVERSAL', 'Universal', 'Lubrificantes, químicos e acessórios para qualquer veículo.')]
MINIMO = {'LEVE': 3, 'PESADA': 3, 'MOTO': 1, 'UNIVERSAL': 1}     # nº mínimo de itens para o produto aparecer na linha
TITULO = {'SUSPENSÃO': 'Suspensão', 'DIREÇÃO': 'Direção', 'TRANSMISSÃO': 'Transmissão', 'FREIO': 'Freio',
          'ARREFECIMENTO': 'Arrefecimento', 'MOTOR': 'Motor', 'ELÉTRICA': 'Elétrica', 'FILTRAÇÃO': 'Filtração',
          'LUBRIFICANTES': 'Lubrificantes', 'QUÍMICOS': 'Químicos', 'RODAGEM': 'Rodagem', 'ACESSÓRIOS': 'Acessórios'}
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
MESES = ('Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro')
# nome de linha da BAP com a grafia da apresentação de Lubrificantes (MC-0017 b; T-0029, 10a)
LINHA_BAP = {'effitech': 'Effitech', 'proactive': 'ProActive', 'shiftease': 'Shiftease'}
MOTO_CARD = {'Óleo Lubrificante': ('Óleo 4T', 'Óleo para motores de motocicleta 4 tempos.'),
             'Velas de Ignição': ('Velas de Ignição', 'Velas de ignição para motores de motocicleta.'),
             'Rolamentos': ('Rolamentos', 'Rolamentos de roda e de direção para motocicletas.'),
             'Lâmpadas': ('Lâmpadas', 'Lâmpadas para farol e sinalização de motocicletas.')}


def fmt(n):
    return f'{n:,}'.replace(',', '.')


def edicao():
    """mês e ano da capa: o mês em que o PDF é gerado, por extenso, no horário de Manaus (T-0029)"""
    d = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-4)))
    return f'{MESES[d.month - 1]} de {d.year}'


def montadora(m):
    """grafia da montadora nas aplicações: até 3 letras fica como veio ("VW", "KIA"); maior, cada nome com a inicial
    maiúscula ("Ford/Audi") e a sigla do KEEPU em maiúsculas ("VW/Audi", "Ford/GM", "MB"; MC-0017 a)"""
    if len(m) <= 3: return m
    return re.sub(r'[^\W\d_]+', lambda w: w.group().upper() if w.group().upper() in KEEPU else w.group(), m.title())


def tit(s):
    ws = s.split()
    return ' '.join(w.lower() if (i and w in ('A', 'E', 'DE', 'DO', 'DA', 'DOS', 'DAS')) else w.capitalize() for i, w in enumerate(ws))


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
        sis_cat = f['eyebrow'].split(' · ')[0]      # o sistema do produto no Catálogo BAP (Rolamentos: RODAGEM)
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
            sis = sis_cat if sis_cat in ORDER_SIS else x['SISTEMA']   # um produto, um sistema por linha
            for l in ls:
                acc[(l, sis, x['FAMILIA'], f['name'])].add(c)
                ordem[(l, sis, x['FAMILIA'], f['name'])].append(r)
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
        # na Linha Pesada, o item LEVE E PESADA mostra só os veículos pesados (T-0029, 16a)
        so_pesado = {c for c in cs if B[c]['LINHA'] == 'LEVE E PESADA'} if l == 'PESADA' else set()
        card = dict(nome=nome, desc=desc, img=im, n=len(cs), lanc=lanc.get(prod, False), prod=prod,
                    rows=ordem[(l, sis, fam, prod)], linha=l, spec=spec.get(prod, False), so_pesado=so_pesado)
        arv[l].setdefault(sis, collections.OrderedDict()).setdefault(fam, []).append(card)
    return arv, len(todos)


# ---------------------------------------------------------------- desenho
def carro(mod, m):
    """o "mesmo carro" de uma aplicação: a montadora (a 1ª, se forem várias) e o modelo, com o número quando o nome
    é uma sigla (CG 125, G 400). Na linha da base v27 a montadora vem na frente: "FORD ECOSPORT 1.6 L" = "Ford" +
    "Ecosport 1.6 L 16V"."""
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


def aplicacoes(rows, n=12, so_pesado=(), so_leve=False):
    """principais aplicações na ordem do catálogo (ranking): montadora + modelos, sem repetir. Nos códigos de
    `so_pesado`, só a aplicação de veículo pesado (a regra `taxo.HEAVY`, a mesma que dá a LINHA)"""
    out, vistos = [], set()
    for r in rows:
        pesado = r['code'].strip().upper() in so_pesado
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
            if pesado and not HEAVY.search((m + ' ' + t).upper()): continue   # como no taxo.linha_of
            if so_leve and HEAVY.search((m + ' ' + t).upper()): continue      # Autocenter: só veículo leve (T-0032)
            mod = re.split(r'\s·\s|;\s|\s\(', t.strip(' ·;'))[0].strip(' ,·/')
            # o ano ("2014–2015") ou o mês/ano da base ("12/97 12/03"), e o " - " antes dele. O mês vai de 01 a 12: o par
            # de anos curto ("Monza 82/96") e a medida ("60/55W", "90/90-19", '13/16"') não são data
            ano = re.search(r'(?:\s+[-–])?\s*(?:(?:\d{2}/)?(?:19|20)\d{2}|(?<![\w/.,])(?:0[1-9]|1[0-2])/\d{2}(?![\d/"\'”%A-Za-z])).*$', mod)
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
    ih = bot - top - 30
    s.foto(c['img'], 40, top, 400, ih)
    if c['lanc']: s.chip(56, top + 16, 'NOVIDADE 2026', 'white', 'orange', 7.5)   # o ano do lançamento, como o LANÇAMENTO 2026 do A4 (T-0029, 9a)
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
            t = re.sub(r'\b(' + '|'.join(LINHA_BAP) + r')\b', lambda w: LINHA_BAP[w.group(1)], t)
            if t and t.upper() not in vist: vist.add(t.upper()); ap.append(('', t))
            if len(ap) >= 12: break
        titulo, nota = 'ESPECIFICAÇÕES', ''
    else:
        ap = aplicacoes(c.get('rows') or [], so_pesado=c.get('so_pesado', ()), so_leve=c.get('so_leve', False))
        titulo, nota = 'PRINCIPAIS APLICAÇÕES', ''
    if not ap: return
    s.t(x, y, titulo, 9.5, 'gdark', 'PB', ls=1.4)
    s.rect(x, y + 16, wr, 1.2, fill='green'); y += 28
    cols = 1 if ((c.get('spec') and not c.get('spec2')) or len(ap) <= 6) else 2   # spec2: 2 colunas nos portfólios por linha (T-0032)
    if cols == 1: ap = ap[:9]
    cw = (wr - 18 * (cols - 1)) / cols
    lin = (len(ap) + cols - 1) // cols
    FS = 10.2; LD = 23
    for k, (m, mod) in enumerate(ap):
        cx = x + (k // lin) * (cw + 18); cy = y + (k % lin) * LD
        s.circle(cx + 3.2, cy + 5.2, 2.1, 'green')
        mm = montadora(m) if m else ''
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


def pagina_linha(s, cod, nome, desc, arv, pags=None):
    """divisória da linha: lista sistema → família → produtos, estilo menu (sem fundo, com marcador). Nos portfólios por
    linha (T-0032), `pags` dá a página de cada produto (id do card → nº), a lista usa só as colunas que precisa e a
    contagem fica só na capa"""
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
    fs = next((f for f in (32, 26, 22, 20) if pw(nome, 'PB', f) < PW - (60 if f == 32 else 45)), 18)   # nome longo (Linha Lubrificantes): menor
    s.t(36, 170, nome, fs, 'white', 'PB', ls=-.6)
    s.p(38, 220, PW - 70, html.escape(desc), 11.5, 16, 'lgrey')
    for i, (a, b) in enumerate([] if pags else [(len(sis), 'sistemas'), (n_fam, 'famílias'), (n_pr, 'produtos'), (fmt(n_it), 'itens')]):
        yy = 292 + i * 32
        s.t(38, yy, str(a), 19, 'green2', 'PB'); s.t(38 + pw(str(a), 'PB', 19) + 8, yy + 6, b, 10.5, 'white', 'PR')
    # lista em 4 colunas (bloco do sistema vai para a coluna mais curta)
    cols, gap = (4 if pags is None else min(4, len(sis))), 18
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
        s.t(x, y, f'{i:02d}', 9.5, 'green', 'PB'); s.t(x + 20, y, TITULO.get(sn, sn).upper(), 9.5, 'ink', 'PB', ls=1.1)
        s.rect(x, y + 16, cw, 1.4, fill='green')
        yy = y + 26
        for fam, cs in f.items():
            s.t(x, yy, tit(fam).upper(), 6.9, 'gdark', 'PB', ls=1); yy += 16
            for c in cs:
                s.circle(x + 3.2, yy + 4.6, 1.9, 'green')            # marcador
                ls_ = simpleSplit(c['nome'], 'PM', FS, cw - IND - 2 - (30 if c['lanc'] else 0) - (22 if pags else 0))
                if pags: s.t(x + cw, yy, f"{pags[id(c)]:02d}", FS, 'gdark', 'PB', 'right')   # página do produto
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


# ---------------------------------------------------------------- portfólios por linha (T-0032, decisões 2a e 3a)
# Cada portfólio é um filtro da mesma árvore do Portfólio geral. Seção: (título, linha, sistema, produtos), em ordem;
# sistema None = todos os sistemas da linha (título = o sistema); produtos None = todos. Seções de mesmo título se juntam.
_SUSP_AC = {'Amortecedores', 'Kit Batente de Amortecedor', 'Bieletas', 'Bucha da Barra Estabilizadora', 'Bandejas de Suspensão', 'Pivô de Suspensão'}
_FREIO_AC = {'Pastilha de Freio', 'Sapata de Freio', 'Cilindro de Roda', 'Sensor ABS'}
DESC_LINHA = {('Baterias', 'LEVE'): 'Baterias para automóveis, picapes e utilitários, e kit de terminais.',   # a descrição segue a linha
              ('Baterias', 'PESADA'): 'Baterias para caminhões, ônibus e máquinas.'}                         # (marca, item 9)
FILTROS = {
    'leve': dict(nome='Linha Leve', secoes=[(None, 'LEVE', None, None)],
                 frase='Suspensão, direção, freio, motor, elétrica e filtros para automóveis, picapes e utilitários.'),
    'pesada': dict(nome='Linha Pesada', secoes=[(None, 'PESADA', None, None)], fim='para a sua loja, oficina ou frota',
                   frase='Peças, filtros e baterias para caminhões, ônibus, implementos e reboques.'),
    'moto': dict(nome='Linha Moto', secoes=[(None, 'MOTO', None, None)],
                 frase='Pneus, câmaras, rolamentos, óleo, filtros, velas e lâmpadas para motocicletas.'),
    'lubrificantes': dict(nome='Linha Lubrificantes',
                          secoes=[('Lubrificantes', 'UNIVERSAL', 'LUBRIFICANTES', None), ('Lubrificantes', 'MOTO', 'LUBRIFICANTES', None),
                                  ('Químicos', 'UNIVERSAL', 'QUÍMICOS', None)],
                          frase='Óleos ProActive, Shiftease e Effitech, e químicos para motor, câmbio, freio e arrefecimento.'),
    'acessorios': dict(nome='Linha Acessórios',
                       secoes=[('Palhetas · Linha Leve', 'LEVE', 'ACESSÓRIOS', None), ('Palhetas · Linha Pesada', 'PESADA', 'ACESSÓRIOS', None),
                               ('Amarração e Reboque', 'UNIVERSAL', 'ACESSÓRIOS', None)],
                       frase='Palhetas, cintas de amarração e reboque, e outros acessórios para qualquer veículo.'),
    'baterias': dict(nome='Linha Baterias', secoes=[('Linha Leve', 'LEVE', 'ELÉTRICA', {'Baterias'}), ('Linha Pesada', 'PESADA', 'ELÉTRICA', {'Baterias'})],
                     frase='Baterias para automóveis, utilitários, caminhões e ônibus, com garantia da fábrica.',
                     divisoria=False, conta='Linha Leve e Linha Pesada'),     # 2 produtos só: a divisória ficaria vazia (designer-ux, item 6)
    'autocenter': dict(nome='Linha Autocenter',
                       secoes=[('Filtração', 'LEVE', 'FILTRAÇÃO', None), ('Palhetas', 'LEVE', 'ACESSÓRIOS', None),
                               ('Suspensão', 'LEVE', 'SUSPENSÃO', _SUSP_AC), ('Freio', 'LEVE', 'FREIO', _FREIO_AC),
                               ('Lubrificantes', 'UNIVERSAL', 'LUBRIFICANTES', None), ('Baterias', 'LEVE', 'ELÉTRICA', {'Baterias'})],
                       frase='Os itens de troca rápida do autocenter: filtros, palhetas, suspensão, freio, lubrificantes e baterias.',
                       desc='Itens de troca rápida para automóveis, picapes e utilitários.', fim='para o seu autocenter',
                       so_leve=True),       # cada linha só mostra veículos dela (marca, item 4): aqui, só leve
}
ARQUIVO = 'Portfolio_Produtos_BAP_AUTOPARTS_{}.pdf'     # Portfolio_Produtos_BAP_AUTOPARTS_Linha_Autocenter.pdf
NOME_LINHA = {cod: nome for cod, nome, _ in LINHAS}
TAB_BAT = 12                                            # mais baterias que isso: página de tabela depois do produto


def filtrar(arv, cfg):
    """a árvore de um portfólio por linha: seção → família → cards (cópias, com as especificações em 2 colunas)"""
    out = collections.OrderedDict()
    for titulo, l, sis, prods in cfg['secoes']:
        for sn in ([sis] if sis else list(arv[l])):
            for fam, cs in arv[l].get(sn, {}).items():
                for c in cs:
                    if prods and c['prod'] not in prods: continue
                    d = dict(c, spec2=True, desc=DESC_LINHA.get((c['prod'], l), c['desc']), so_leve=cfg.get('so_leve', False))
                    if c['prod'] == 'Baterias':      # a bateria no padrão da marca: "45 Ah LP · 18 meses"
                        d['rows'] = [dict(r, bat=bateria(r), segs=[(bateria(r)[0], False)]) for r in c['rows']]
                        if c['n'] > TAB_BAT: d['tab'] = d['rows']     # a lista vai para a página de tabela (UX)
                    elif c['spec']:                  # óleos sem "Litro óleo"; em 2 colunas, corte só em fim de palavra
                        ts = [oleo(t) if c['prod'] == 'Óleo Lubrificante' else t
                              for t in (''.join(x for x, _ in r.get('segs') or []).split(' — ')[0].strip() for r in c['rows'])]
                        larg = (W - 40 - 476 - 18) / 2 - 14 if len({t.upper() for t in ts}) > 6 else W
                        d['rows'] = [dict(r, segs=[(corta(t, larg), False)]) for r, t in zip(c['rows'], ts)]
                    out.setdefault(titulo or TITULO[sn], collections.OrderedDict()).setdefault(fam, []).append(d)
    return out


def oleo(t):
    """o óleo sem "Litro óleo" / "Óleo lubrificante" / "Balde óleo" no começo, com viscosidade, API e litro num padrão
    só ("Shiftease 100 80W API GL4 mineral 20 L"; marca, item 7)"""
    t = re.sub(r'(?i)^(?:litro\s+|balde\s+)?óleo(?:\s+lubrificante)?\s+', '', t)
    t = re.sub(r'\b(' + '|'.join(LINHA_BAP) + r')\b', lambda w: LINHA_BAP[w.group(1)], t)
    t = re.sub(r'(?i)\b(\d+)w(\d*)\b', lambda m: m.group(0).upper(), t)
    t = re.sub(r'(?i)\bsljaso\b', 'SL JASO', t)
    t = re.sub(r'(?i)\bapi\s+([a-z]{2}(?:/[a-z]{2})?)\b', lambda m: 'API ' + m.group(1).upper(), t)
    t = re.sub(r'(?i)\s*-\s*tambor\s+(\d+)\s*l\b', r' · \1 L', t)
    t = re.sub(r'(?i)\bdexron\b', 'Dexron', re.sub(r'\b(\d+)L\b', r'\1 L', t))
    return t[:1].upper() + t[1:]


def corta(t, larg, fs=10.2):
    """o texto na largura, cortado em fim de palavra e com "…" (designer-ux, item 6). O volume do fim ("20 L",
    "· 200 L") fica, porque é o que separa o balde do litro"""
    if pw(t, 'PR', fs) <= larg: return t
    m = re.search(r'\s(?:·\s)?[\d.,]+ L$', t); fim = m.group(0) if m else ''
    ws = t[:len(t) - len(fim)].split()
    while len(ws) > 1 and pw(' '.join(ws) + '…' + fim, 'PR', fs) > larg: ws.pop()
    return ' '.join(ws).rstrip(' ,/-·') + '…' + fim


def bateria(r):
    """(texto, capacidade, garantia, observação) da bateria, com a unidade e a sigla num padrão só (marca, item 7)"""
    t = ''.join(x for x, _ in r.get('segs') or [])
    a = re.search(r'(\d+)\s*amperes', t, re.I); g = re.search(r'(\d+)\s*meses', t, re.I)
    if not a: return t[:1].upper() + t[1:], '—', '—', 'Kit de terminais' if 'positivo' in t.lower() else ''
    obs = []
    if re.search(r'start\s*stop|EFB', t, re.I): obs.append('start-stop (EFB)')
    cx = re.search(r'caixa (alta|baixa)|caixa tamanho (\d+)A', t, re.I)
    if cx: obs.append(f'caixa {cx.group(1).lower()}' if cx.group(1) else f'caixa de {cx.group(2)} Ah')
    serie = r['code'].split('-')[1].upper() if r['code'].count('-') >= 2 else ''
    cap, gar = f'{a.group(1)} Ah', (f'{g.group(1)} meses' if g else '—')
    obs = ', '.join(obs)
    return f"{cap} {serie} · {gar}", cap, gar, obs[:1].upper() + obs[1:]


def indice(arv_f, cfg):
    """páginas de cada produto num portfólio por linha: capa, quem somos, divisória (opcional), produtos (+ tabela) e contato"""
    pags, n = {}, 3 + cfg.get('divisoria', True)
    for sn, fams in arv_f.items():
        for cs in fams.values():
            for c in cs:
                pags[id(c)] = n; n += 1 + ('tab' in c)
    return pags, n           # n = nº da contracapa = total de páginas


def tabela_baterias(s, c):
    """todas as baterias do card, em 2 blocos de colunas (designer-ux, item 7)"""
    rows = [(r['code'].strip(),) + r['bat'][1:] for r in c['tab']]
    meio = (len(rows) + 1) // 2; LD = 17; bw = (W - 80 - 24) / 2
    cols = [('CÓDIGO', 0), ('CAPACIDADE', 120), ('GARANTIA', 210), ('OBSERVAÇÃO', 290)]
    for b, bloco in enumerate((rows[:meio], rows[meio:])):
        x = 40 + b * (bw + 24); y = 128
        for nm, dx in cols: s.t(x + 8 + dx, y, nm, 8, 'gdark', 'PB', ls=1)
        s.rect(x, y + 14, bw, 1.2, fill='green'); y += 22
        for k, row in enumerate(bloco):
            if k % 2: s.rect(x, y - 3, bw, LD, fill='soft')
            for (nm, dx), v in zip(cols, row): s.t(x + 8 + dx, y, v, 9.5, 'ink', 'PB' if nm == 'CÓDIGO' else 'PR')
            y += LD


def capa(s, l1, l2, frase, fotos, conta=None):
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 60, 290, 330, 'green'); s.circle(W - 80, 290, 255, 'green2'); s.circle(W - 80, 290, 190, 'black')
    s.img(A.LOGO, 60, 52, 46, 64)
    s.t(62, 150, f'PORTFÓLIO DE PRODUTOS {ANO}', 11, 'green2', 'PB', ls=2)
    s.t(58, 172, l1, 50, 'white', 'PB', ls=-1)
    s.t(58, 228, l2, 50, 'white', 'PB', ls=-1)
    h = s.p(62, 300, 410, frase, 13, 19, 'lgrey')
    if conta: s.t(62, 300 + h + 18, conta, 12, 'green2', 'PM')
    s.t(62, 470, edicao(), 10, 'lgrey', 'PM')
    if len(fotos) >= 6:                       # 6 fotos: grade 3 × 2
        for i, f in enumerate(fotos[:6]):
            r_, c_ = divmod(i, 3); x = 560 + c_ * 120; y = 120 + r_ * 150
            s.rect(x, y, 110, 138, fill='white', r=16); s.img(f, x + 8, y + 10, 94, 118)
    elif fotos:                               # poucas fotos (Baterias): uma só, grande, no lugar da grade
        s.rect(560, 120, 350, 288, fill='white', r=16); s.img(fotos[0], 580, 140, 310, 248)
    s.c.showPage(); s.n += 1


def quem_somos(s, arv, total):
    produtos = {c['prod'] for l in arv.values() for f in l.values() for cs in f.values() for c in cs}
    sistemas = {sn for l in arv.values() for sn in l}
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


def contato(s, fim='para a sua loja ou oficina'):
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 110, 280, 280, 'green'); s.circle(W - 125, 280, 215, 'green2'); s.circle(W - 125, 280, 160, 'black')
    s.img(A.LOGO_G, W - 125 - 62, 280 - 85, 124, 170)
    s.img(A.LOGO, 60, 52, 36, 50)
    s.t(62, 150, f'PORTFÓLIO DE PRODUTOS {ANO}', 11, 'green2', 'PB', ls=2)
    s.t(58, 178, 'Vamos conversar?', 50, 'white', 'PB', ls=-1)
    s.p(62, 252, 430, f'Fale com o nosso time comercial: mostramos as aplicações por veículo e ajudamos a montar o mix certo {fim}.', 14, 21, 'lgrey')
    s.rect(62, 366, 420, 112, fill='card', r=16); s.rect(62, 366, 5, 112, fill='green')
    s.t(84, 382, 'Alexandre Guerreiro', 16, 'white', 'PB')
    s.t(84, 404, f'Gerente Comercial · {NOME}', 10.5, 'lgrey', 'PR')
    s.t(84, 428, 'alexandre.guerreiro@bapautoparts.com.br', 11.5, 'green2', 'PM')
    s.t(84, 450, '(92) 99250-8980', 11.5, 'green2', 'PM')
    s.t(62, 500, SITE, 10, 'lgrey', 'PR')
    s.c.showPage()
    s.c.save()


def build_linha(out, chave, arv, total):
    """um portfólio por linha (T-0032): capa da linha → quem somos → divisória única com página → produtos → contato.
    Sem a p3 (as 4 linhas) do Portfólio geral (designer-ux, item 8)"""
    cfg = FILTROS[chave]; nome = cfg['nome']
    arv_f = filtrar(arv, cfg); pags, total_p = indice(arv_f, cfg)
    cards = [c for f in arv_f.values() for cs in f.values() for c in cs]
    n_it = sum(c['n'] for c in cards)
    s = P(out)
    s.c.setTitle(f'Portfólio de Produtos {NOME} · {nome}'); s.c.setAuthor(NOME)
    primeiros = [next(iter(f.values()))[0] for f in arv_f.values()]          # capa: a foto do 1º produto de cada seção
    fotos = list(dict.fromkeys(c['img'] for c in primeiros + cards if c['img']))
    capa(s, nome.split(' ', 1)[0], nome.split(' ', 1)[1], html.escape(cfg['frase']), fotos,
         f"{cfg.get('conta') or f'{len(cards)} ' + plural(len(cards), 'produto', 'produtos')} · {fmt(n_it)} {plural(n_it)}")
    for c in cards:          # com a tabela, a página do produto só aponta para ela (UX)
        if 'tab' in c: c['rows'] = [dict(code='', segs=[(f"Os {c['n']} itens, com capacidade e garantia, estão na tabela da página {pags[id(c)] + 1}.", False)])]
    quem_somos(s, arv, total)
    if cfg.get('divisoria', True): pagina_linha(s, 'X', nome, cfg.get('desc', cfg['frase']), {'X': arv_f}, pags)
    for i, (sn, fams) in enumerate(arv_f.items(), 1):
        for fam, cards_ in fams.items():
            for c in cards_:
                s.header(f'{nome} · {i:02d} · {sn}', sn)
                heroi(s, fam, c, 128, H - 46)
                s.footer()
                if 'tab' in c:
                    s.header(f'{nome} · {i:02d} · {sn}', f"Baterias da {NOME_LINHA[c['linha']]} · {c['n']} {plural(c['n'])}")
                    tabela_baterias(s, c)
                    s.footer()
    contato(s, cfg.get('fim', 'para a sua loja ou oficina'))
    assert s.n + 1 == total_p, (s.n + 1, total_p)
    return arv_f, s.n + 1


def build(out, base=BASE, filtro=None):
    arv, total = dados(base)
    if filtro: return build_linha(out, filtro, arv, total)
    s = P(out)
    s.c.setTitle('Portfólio de Produtos BAP AUTOPARTS'); s.c.setAuthor(NOME)
    capa(s, 'Conheça a', NOME, 'Peças, baterias, filtros, lubrificantes, químicos, pneus e acessórios para as linhas leve, pesada e moto, '
         'organizados por linha, sistema do veículo e família de produto.',
         ['dimg/cover_0.png', 'dimg/cover_16.png', 'dimg/cover_34.png', 'dimg/cover_27.png', 'dimg/cover_10.png', 'dimg/cover_36.png'])
    quem_somos(s, arv, total)
    # como o portfólio está organizado
    s.header('Nosso portfólio', 'Linha, sistema e família', f'conforme o Catálogo BAP {ANO}')
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
    s.t(40, 478, 'Cada produto aparece na linha (leve, pesada, moto ou universal) em que tem aplicação. Dentro da linha: sistema do veículo, família e produto.', 9, 'grey', 'PR')
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

    contato(s)
    return {l: (len(arv[l]), sum(len(cs) for f in arv[l].values() for cs in f.values())) for l in arv}, total, s.n + 1


def imprimir_indice(arv):
    """o índice de um portfólio por linha sem gerar o PDF: páginas, grupos, famílias e produtos"""
    for chave, cfg in FILTROS.items():
        arv_f = filtrar(arv, cfg); pags, total_p = indice(arv_f, cfg)
        n_it = sum(c['n'] for f in arv_f.values() for cs in f.values() for c in cs)
        print(f"## {cfg['nome']} ({chave}): {total_p} páginas, {fmt(n_it)} {plural(n_it)}")
        for i, (sn, fams) in enumerate(arv_f.items(), 1):
            fams_ = ['{} ({})'.format(tit(fam), ', '.join(f"{c['nome']} p{pags[id(c)]:02d}" for c in cs)) for fam, cs in fams.items()]
            print(f"{i:02d} {sn}: " + '; '.join(fams_))


if __name__ == '__main__':
    # python portfolio.py [saida.pdf] [base.xlsx] [--linha=autocenter|baterias|leve|pesada|moto|lubrificantes|acessorios] [--indice]
    opc = {a.split('=')[0]: a.split('=', 1)[-1] for a in sys.argv[1:] if a.startswith('--')}
    arg = [a for a in sys.argv[1:] if not a.startswith('--')]
    base = arg[1] if len(arg) > 1 else BASE
    if '--indice' in opc: imprimir_indice(dados(base)[0]); sys.exit()
    lin = opc.get('--linha')
    out = arg[0] if arg else 'saidas/' + (ARQUIVO.format(FILTROS[lin]['nome'].replace(' ', '_').replace('ó', 'o')) if lin else 'Portfolio_Produtos_BAP_AUTOPARTS.pdf')
    r = build(out, base, lin)
    print(r if not lin else (out, r[1], 'páginas'))
