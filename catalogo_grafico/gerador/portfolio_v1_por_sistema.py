"""Portfólio de Produtos BAP AUTOPARTS — catálogo de apresentação (16:9) para quem quer conhecer a BAP.

Material para cliente/prospect: sem estoque, sem preço, sem aviso de uso interno, sem nome de cliente.
Usa as linhas do catálogo (moto.FAMS), a descrição de taxo.py, as imagens dimg/ e a LINHA da base v10.
Uso (dentro de gerador/):  python portfolio.py [saida.pdf] [base_v10.xlsx]
"""
import sys, os, collections, html
import pandas as pd
import apres_bemol as A
from apres_bemol import S, W, H

BASE = 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx'
NOME = 'BAP AUTOPARTS'
SITE = 'www.bapautoparts.com.br  ·  @bapautoparts'
A.C.update(dict(ochip='#fdeedd', gchip='#e3f1e0', soft='#f3f6f2'))

TITULO = {'SUSPENSÃO': 'Suspensão', 'DIREÇÃO': 'Direção', 'TRANSMISSÃO': 'Transmissão', 'FREIO': 'Freio',
          'ARREFECIMENTO': 'Arrefecimento', 'MOTOR': 'Motor', 'ELÉTRICA': 'Elétrica', 'FILTRAÇÃO': 'Filtração',
          'LUBRIFICANTES': 'Lubrificantes', 'QUÍMICOS': 'Químicos', 'RODAGEM': 'Rodagem', 'ACESSÓRIOS': 'Acessórios'}
FRASE = {'SUSPENSÃO': 'Conforto, estabilidade e segurança ao dirigir.',
         'DIREÇÃO': 'Precisão e firmeza no controle do veículo.',
         'TRANSMISSÃO': 'Força do motor chegando às rodas, sem folgas.',
         'FREIO': 'Frenagem segura para a linha leve e pesada.',
         'ARREFECIMENTO': 'Motor na temperatura certa.',
         'MOTOR': 'Lubrificação, alimentação e sincronismo do motor.',
         'ELÉTRICA': 'Partida, ignição, iluminação e sinalização.',
         'FILTRAÇÃO': 'Ar, óleo, combustível e cabine sempre limpos.',
         'LUBRIFICANTES': 'Óleos para motor, transmissão e sistema hidráulico.',
         'QUÍMICOS': 'Manutenção e proteção do veículo.',
         'RODAGEM': 'Cubos, rolamentos, rodas e pneus.',
         'ACESSÓRIOS': 'Visibilidade e transporte de carga.'}
# imagem que mostra marca de terceiro: não usar em material para cliente
SEM_IMAGEM = {'Cuíca de Freio'}
# subtipos (família da base) mostrados nas páginas de linha única
SUBTIPO = {'FILTROS DE AR': 'Filtros de ar', 'FILTROS DE ÓLEO': 'Filtros de óleo', 'FILTROS DE COMBUSTÍVEL': 'Filtros de combustível',
           'FILTROS DE CABINE': 'Filtros de cabine (ar-condicionado)', 'ÓLEOS DE MOTOR': 'Óleos de motor',
           'ÓLEOS DE TRANSMISSÃO': 'Óleos de transmissão', 'ÓLEOS HIDRÁULICOS': 'Óleo hidráulico', 'ADITIVOS': 'Aditivos para radiador',
           'FLUIDOS DOT': 'Fluidos de freio DOT', 'SELANTES E SPRAYS': 'Selantes e sprays', 'ÁGUA DESMINERALIZADA': 'Água desmineralizada'}
MOTO = [('Pneus e Câmaras de Ar', 'PNEUS E CÂMARAS', 'dimg/cover_41.png', 'Pneus e câmaras de ar para motocicletas de uso urbano e misto.'),
        ('Velas de Ignição', 'IGNIÇÃO', 'dimg/cover_29.png', 'Velas de ignição para motores de motocicleta.'),
        ('Rolamentos', 'CUBOS E ROLAMENTOS', 'dimg/cover_37.png', 'Rolamentos de roda e de direção para motocicletas.'),
        ('Óleo 4T', 'ÓLEOS DE MOTOR', 'dimg/cover_26.png', 'Óleo para motores de motocicleta 4 tempos.')]


def fmt(n):
    return f'{n:,}'.replace(',', '.')


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
        w = A.pdfmetrics.stringWidth(txt, 'PB', size) + size * .12 * len(txt) + 14
        self.rect(x, y, w, size + 9, fill=bg, r=(size + 9) / 2)
        self.t(x + 7, y + 4.3, txt, size, fg, 'PB', ls=size * .12)
        return w + 5

    def foto(self, path, x, y, w, h, bg='soft'):
        self.rect(x, y, w, h, fill=bg, r=12)
        if path and os.path.exists(path):
            self.img(path, x + 10, y + 8, w - 20, h - 16)
        else:
            self.img(A.LOGO_G, x + w / 2 - h * .2, y + h * .2, h * .4, h * .6)


def dados(base):
    import moto
    b = pd.read_excel(base, 'PRODUTOS', dtype=str)
    k = b.CODIGO_BAP.str.strip().str.upper()
    lin, fam = dict(zip(k, b.LINHA)), dict(zip(k, b.FAMILIA))
    linhas, moto_l = [], None
    for f in moto.FAMS:
        cods = [r['code'].strip().upper() for r in f['rows']]
        cov = collections.Counter(lin.get(c, '') for c in cods)
        fc = collections.Counter(fam.get(c, '') for c in cods)
        d = dict(nome=f['name'], sis=f['group'], n=len(cods), img=None if f['name'] in SEM_IMAGEM else f.get('img'),
                 lanc=bool(f.get('lanc')), desc=f.get('desc', ''), fam=fc, cods=set(cods), tags=tags(cov, len(cods)))
        if f['group'] == 'LINHA MOTO':
            moto_l = d
        else:
            linhas.append(d)
    total = len(set().union(*[l['cods'] for l in linhas]) | (moto_l['cods'] if moto_l else set()))
    return linhas, moto_l, total


def tags(cov, n):
    lim = max(3, n * .05)
    leve = cov['LEVE'] + cov['LEVE E PESADA']; pes = cov['PESADA'] + cov['LEVE E PESADA']
    t = []
    if leve >= lim: t.append('LEVE')
    if pes >= lim: t.append('PESADA')
    if cov['MOTO'] >= lim: t.append('MOTO')
    if cov['UNIVERSAL'] >= lim: t.append('UNIVERSAL')
    return t


def card(s, l, x, y, w, h, img_h):
    s.rect(x, y, w, h, fill='white', stroke='line', r=14, sw=.8)
    s.foto(l['img'], x + 8, y + 8, w - 16, img_h)
    if l['lanc']:
        s.chip(x + 16, y + 16, 'NOVIDADE 2026', 'white', 'orange', 6.8)
    yy = y + 8 + img_h + 10
    size = 13.5
    while size > 9.5 and A.pdfmetrics.stringWidth(l['nome'], 'PB', size) > w - 28: size -= .25
    s.t(x + 14, yy, l['nome'], size, 'ink', 'PB'); yy += 19
    s.p(x + 14, yy, w - 28, html.escape(l['desc']), 8.4, 11, 'sec', 'PR')
    xx = x + 14; yb = y + h - 26
    for t in l['tags']:
        xx += s.chip(xx, yb, t)
    s.t(x + w - 14, yb + 4, f"{l['n']} itens", 8, 'grey', 'PM', 'right')


def pagina_sistema(s, num, sis, ls):
    n = sum(l['n'] for l in ls)
    s.header(f'{num:02d} · {FRASE[sis]}', TITULO[sis], f"{len(ls)} {'linha' if len(ls) == 1 else 'linhas'} · {fmt(n)} itens")
    top, bot, gap = 132, H - 48, 14
    if len(ls) == 1:
        heroi(s, ls[0], top, bot)
    else:
        rows = 1 if len(ls) <= 4 else 2
        cols = len(ls) if rows == 1 else (len(ls) + 1) // 2
        cols = max(cols, 3)
        w = (W - 80 - gap * (cols - 1)) / cols
        h = (bot - top - gap * (rows - 1)) / rows
        img_h = h - 102 if rows == 2 else h - 140
        for i, l in enumerate(ls):
            r_, c_ = divmod(i, cols)
            card(s, l, 40 + c_ * (w + gap), top + r_ * (h + gap), w, h, img_h)
    s.footer()


def heroi(s, l, top, bot):
    s.foto(l['img'], 40, top, 400, bot - top, 'soft')
    if l['lanc']:
        s.chip(56, top + 16, 'NOVIDADE 2026', 'white', 'orange', 7.5)
    x = 476; y = top + 6
    s.t(x, y, l['nome'], 26, 'ink', 'PB', ls=-.4); y += 40
    y += s.p(x, y, W - 40 - x, html.escape(l['desc']), 12.5, 18, 'sec') + 14
    xx = x
    for t in l['tags']:
        xx += s.chip(xx, y, t, size=8)
    s.t(W - 40, y + 4, f"{l['n']} itens", 9.5, 'grey', 'PM', 'right'); y += 34
    sub = [(SUBTIPO.get(f, f.title()), q) for f, q in l['fam'].most_common() if f in SUBTIPO]
    if sub:
        s.t(x, y, 'NA LINHA', 9, 'gdark', 'PB', ls=1.4); y += 20
        for nome, q in sub:
            s.rect(x, y, W - 40 - x, 34, fill='zebra', r=8); s.rect(x, y, 4, 34, fill='green')
            s.t(x + 16, y + 10, nome, 12, 'ink', 'PB')
            s.t(W - 54, y + 11, f'{q} itens', 9.5, 'grey', 'PM', 'right')
            y += 40


def build(out, base=BASE):
    linhas, moto_l, total = dados(base)
    por = collections.OrderedDict()
    for sis in TITULO:
        ls = [l for l in linhas if l['sis'] == sis]
        if ls: por[sis] = ls
    s = P(out)
    s.c.setTitle('Portfólio de Produtos BAP AUTOPARTS'); s.c.setAuthor(NOME)

    # 1 ─ capa
    s.rect(0, 0, W, H, fill='black')
    s.circle(W - 60, 290, 330, 'green'); s.circle(W - 80, 290, 255, 'green2'); s.circle(W - 80, 290, 190, 'black')
    s.img(A.LOGO, 60, 52, 46, 64)
    s.t(62, 150, 'PORTFÓLIO DE PRODUTOS 2026', 11, 'green2', 'PB', ls=2)
    s.t(58, 172, 'Conheça a', 50, 'white', 'PB', ls=-1)
    s.t(58, 228, NOME, 50, 'white', 'PB', ls=-1)
    s.p(62, 300, 410, f'{len(linhas)} linhas de produtos para suspensão, direção, transmissão, freio, motor, elétrica e rodagem, '
        'além de filtros, lubrificantes, químicos e acessórios — para as linhas leve, pesada e moto.', 13, 19, 'lgrey')
    s.t(62, 470, 'Outubro de 2026', 10, 'lgrey', 'PM')
    mos = ['dimg/cover_0.png', 'dimg/cover_16.png', 'dimg/cover_34.png', 'dimg/cover_27.png', 'dimg/cover_10.png', 'dimg/cover_36.png']
    for i, f in enumerate(mos):
        r_, c_ = divmod(i, 3); x = 560 + c_ * 120; y = 120 + r_ * 150
        s.rect(x, y, 110, 138, fill='white', r=16); s.img(f, x + 8, y + 10, 94, 118)
    s.c.showPage(); s.n += 1

    # 2 ─ quem somos
    s.header('Quem somos', NOME)
    s.p(40, 132, 600, 'Empresa brasileira criada em 2021 para oferecer componentes automotivos de qualidade, com segurança e preço acessível. '
        'O portfólio vai da suspensão à parte elétrica, passando por filtros, lubrificantes e químicos, para as linhas leve, pesada e moto.', 13, 20, 'sec')
    tiles = [(str(len(linhas)), 'linhas de produtos'), (f'+{fmt(total // 100 * 100)}', 'itens no catálogo'),
             (str(len(por)), 'sistemas do veículo'), ('3', 'linhas: leve, pesada e moto')]
    for i, (a, b) in enumerate(tiles):
        x = 40 + i * 222
        s.rect(x, 250, 206, 130, fill='black', r=16)
        s.t(x + 103, 280, a, 32, 'green2', 'PB', 'center'); s.t(x + 103, 334, b, 11, 'white', 'PR', 'center')
    s.rect(40, 404, 880, 70, fill='hero', r=14); s.rect(40, 404, 5, 70, fill='green')
    s.t(62, 418, 'GARANTIA EXPRESSA BAP', 9, 'gdark', 'PB', ls=1.4)
    s.p(62, 438, 820, 'Sem burocracia: o consumidor aciona a garantia direto com a fábrica pelo SAC BAP, sem intermediários, conforme o certificado da embalagem.', 11.5, 16, 'ink')
    s.footer()

    # 3 ─ portfólio completo (nomes dos produtos)
    s.header('Nosso portfólio', 'Todos os produtos BAP', f'{len(linhas)} linhas · {len(por)} sistemas')
    cols, gap = 4, 12
    w = (W - 80 - gap * (cols - 1)) / cols
    grade = list(por.items())
    ys = [128, 128, 128, 128]
    altura = lambda ls: 34 + 13.2 * len(ls) + 10
    for i, (sis, ls) in enumerate(grade):     # coluna mais curta primeiro (masonry)
        c_ = ys.index(min(ys)); x = 40 + c_ * (w + gap); y = ys[c_]; h = altura(ls)
        s.rect(x, y, w, h, fill='zebra', r=10); s.rect(x, y, 4, h, fill='green')
        s.t(x + 14, y + 10, f'{list(por).index(sis) + 1:02d}  {TITULO[sis].upper()}', 9, 'gdark', 'PB', ls=1.2)
        for j, l in enumerate(ls):
            nm = l['nome'] + ('  •' if l['lanc'] else '')
            s.t(x + 14, y + 30 + j * 13.2, l['nome'], 9.2, 'ink', 'PM')
            if l['lanc']:
                s.t(x + 18 + A.pdfmetrics.stringWidth(l['nome'], 'PM', 9.2), y + 30 + j * 13.2, 'NOVO', 6.5, 'orange', 'PB', ls=.8)
        ys[c_] += h + gap
    s.footer()

    # 4+ ─ uma página por sistema
    for i, (sis, ls) in enumerate(por.items(), 1):
        pagina_sistema(s, i, sis, ls)

    # linha moto
    if moto_l:
        fam = moto_l['fam']
        s.header('Duas rodas', 'Linha Moto', f"{moto_l['n']} itens")
        top, bot, gap = 132, H - 48, 14
        w = (W - 80 - gap * 3) / 4
        for i, (nome, f, img, desc) in enumerate(MOTO):
            l = dict(nome=nome, img=img, lanc=False, desc=desc, tags=['MOTO'], n=fam.get(f, 0))
            if l['n']:
                card(s, l, 40 + i * (w + gap), top, w, bot - top, bot - top - 140)
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
    return len(linhas), total, s.n + 1


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'saidas/Portfolio_Produtos_BAP_AUTOPARTS.pdf'
    print(build(out, sys.argv[2] if len(sys.argv) > 2 else BASE))
