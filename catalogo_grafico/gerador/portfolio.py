"""Portfólio de Produtos BAP AUTOPARTS — catálogo de apresentação (16:9) para quem quer conhecer a BAP.

Organização (Alexandre, 23/10): LINHA (Leve, Pesada, Moto, Universal) → SISTEMA → FAMÍLIA → produto,
conforme a classificação da base unificada e do Catálogo BAP.
Material para cliente/prospect: sem estoque, sem preço, sem aviso de uso interno, sem nome de cliente.
Uso (dentro de gerador/):  python portfolio.py [saida.pdf] [base.xlsx]
"""
import sys, os, re, collections, html, datetime
import pandas as pd
import apres_bemol as A
from apres_bemol import S, W, H
from taxo import ORDER_SIS, META, HEAVY, LIGHT_BR, LIGHT_MODELS, MOTO as TX_MOTO
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
    def header(self, kicker, title, right=None, ts=30, volta=None):
        self.rect(0, 0, W, 6, fill='green')
        self.img(A.LOGO, 40, 26, 22, 30)
        self.t(72, 34, NOME, 8.5, 'gdark', 'PB', ls=1.6)
        wk = self.t(40, 66, kicker.upper(), 10, 'green', 'PB', ls=1.6)
        if volta: self.link(40, 62, wk, 18, volta)                 # sobretítulo → divisória da linha (designer-ux, item 2)
        self.t(38, 84 if ts == 30 else 88, title, ts, 'ink', 'PB', ls=-.5)
        if right:
            self.t(W - 40, 34, right, 9.5, 'grey', 'PM', 'right')

    def link(self, x, y, w, h, pag):
        """área clicável que leva à página `pag` (o marcador p<nº> de cada página)"""
        self.c.linkRect('', f'p{pag}', (x, self.Y(y + h), x + w, self.Y(y)), relative=0, thickness=0)

    def footer(self, volta=None):
        self.n += 1
        if volta: self.link(W - 80, H - 32, 40, 20, volta)
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
        if path == 'icone:filtro':          # sem a foto da caixa certa, um ícone (decisão 6b)
            k = min(w * .5, h * .62); cx, cy = x + w / 2, y + h / 2
            self.rect(cx - k * .3, cy - k * .42, k * .6, k * .84, fill='green', r=k * .05)
            self.rect(cx - k * .34, cy - k * .46, k * .68, k * .09, fill='gdark', r=k * .03)
            self.rect(cx - k * .34, cy + k * .37, k * .68, k * .09, fill='gdark', r=k * .03)
            for i in range(1, 8): self.rect(cx - k * .3 + i * k * .075, cy - k * .33, k * .012, k * .66, fill='white')
        elif path and os.path.exists(path):
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


def sai_da_pesada(m, t):
    """16a: na Linha Pesada, o item LEVE E PESADA fica só com a aplicação que o `taxo.HEAVY` reconhece como pesada"""
    return not HEAVY.search((m + ' ' + t).upper())          # em maiúsculas, como no taxo.linha_of


def aplicacoes(rows, n=12, so_pesado=(), linha=None):
    """principais aplicações na ordem do catálogo (ranking): montadora + modelos, sem repetir. Nos códigos de
    `so_pesado`, fica só a aplicação que o `taxo.HEAVY` reconhece como pesada (`sai_da_pesada`, no veículo que a linha
    mostra)"""
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
            mod = re.split(r'\s·\s|;\s|\s\(', t.strip(' ·;'))[0].strip(' ,·/')
            # o ano ("2014–2015") ou o mês/ano da base ("12/97 12/03"), e o " - " antes dele. O mês vai de 01 a 12: o par
            # de anos curto ("Monza 82/96") e a medida ("60/55W", "90/90-19", '13/16"') não são data
            ano = re.search(r'(?:\s+[-–])?\s*(?:(?<!\d)(?:\d{2}/)?(?:19|20)\d{2}|(?<![\w/.,])(?:0[1-9]|1[0-2])/\d{2}(?![\d/"\'”%A-Za-z])).*$', mod)
            if ano and re.search(r'(?:^|\s)(?<!\d\s)[A-Za-z]-?$', mod[:ano.start()]): continue   # "FORD F 2000": não é ano, o corte partiria o modelo
            if ano: mod = mod[:ano.start()].strip(' ,·/')                                       # tira anos
            if not mod and not m: continue
            if pesado and sai_da_pesada(m, mod): continue        # o veículo que a linha mostra, não a linha inteira
            mod = limpa(mod, linha)
            if not da_linha(linha, m, mod): continue                 # só veículo, e só da linha (T-0032, melhorias 2 e 4)
            if len(mod) > 46:                                                # corta no separador; sem ele, na palavra inteira
                c = mod[:46] if re.search(r'[/,]', mod[:46]) else mod[:46].rsplit(' ', 1)[0]
                mod = c.rsplit('/', 1)[0].rsplit(',', 1)[0].strip(' ,/') + '…'
            mod = re.sub(r'(?i)\s*\b(?:diant|tras|dir|esq|sup|inf)(?:eir[oa]|eit[oa]|uerd[oa]|erior)?\.?(?=\s|$)', '', mod).strip(' ,·/+')
            if not mod: continue
            k = carro(mod, m)                                                # não repetir o mesmo carro
            if k in vistos or (k[0], k[1].split(' ')[0]) in vistos: continue   # "Dodge RAM" já cobre o "RAM 2500"
            vistos.add(k); out.append((m, mod))
            if len(out) >= n: return out
    return out


# ---------------------------------------------------------------- aplicações: só veículo da linha, por montadora (T-0032)
NAO_VEICULO = re.compile(r'(?i)\buniversa(?:l|is)\b|industria|n[áa]utica|ciclomotor|\buso (?:sem|com) c[âa]mara|\blinha (?:leve|pesada)\b'
                         r'|\b(?:bosch|valeo|delco|eaton)\b|estacion[áa]rio|geradores'
                         r'|^(?:pode ser|em alguns|aplicad[oa]|bloqueio|freio motor|controle de|servo |cilindro |bomba de|l[âa]mpada|lado\b)')
PESADO_EXTRA = re.compile(r'\bVM\s?\d{3}\b|\bVOLVO\s+VM\b|\bD-?[4-7]0\b|\bA-?40\b|\b[5-9]-[89]0\b')   # o que o taxo.HEAVY ainda não pega
CODIGO = re.compile(r'(?=[A-Z0-9]{6,}$)[A-Z0-9]*\d[A-Z]+\d[A-Z0-9]*|\d{7,}')                    # código de peça, não modelo ("7S7G8501A2A")
MARCAS = (r'VOLKSWAGEN|FORD|NISSAN|CHEVROLET|FIAT|RENAULT|TOYOTA|HONDA|HYUNDAI|PEUGEOT|CITRO[EË]N|JEEP|KIA|MITSUBISHI|MERCEDES[ -]BENZ'
          r'|LAND ROVER|AUDI|BMW|VOLVO|SCANIA|IVECO|AGRALE|JAC|CHERY|SUZUKI|DODGE|RAM|TROLLER|INTERNATIONAL|GM|VW|MB|SEAT|CHRYSLER'
          r'|DAEWOO|ALFA ROMEO|PORSCHE|MAZDA|SUBARU|LIFAN|BYD|GWM|YAMAHA|DAFRA|SHINERAY|KAWASAKI|SUNDOWN|KASINSKI|TRAXX|HAOJUE'
          r'|TRIUMPH|KTM|ROYAL ENFIELD|VALTRA|MASSEY FERGUSON|NEW HOLLAND|CUMMINS|MWM|PERKINS|RANDON|GUERRA|FACCHINI|DAF|MAN|ZF')
GENERICO = re.compile(r'(?i)\b(?:automotivo|automotiva|linha|compressores|agr[íi]cola|motos?|tratores|carretas?|pesad[oa]s|m[ée]dios|caminh[õo]es|truck|benz|mercedes|e)\b')
CARRO_MOTO = re.compile(r'\b(CIVIC|FIT|CITY|ACCORD|HR-?V|CR-?V|WR-?V|JIMNY|VITARA|SWIFT|SX4|S-CROSS)\b')   # carro de marca de moto


def limpa(mod, linha=None):
    """o que não é modelo no fim da aplicação: o sufixo "- DE", o código de vela de outra marca ("G BP6FS-D") e, na
    Linha Moto, o motor em litros ("Turuna 125 0.1 L 2V": a cilindrada já está no modelo; marca, item 6)"""
    mod = re.sub(r'\s+-\s*DE$', '', mod)
    cab, fim = (re.split(r'\s[-—]\s', mod, maxsplit=1) + [''])[:2]
    if '/' in cab and not re.search(r'[A-Z0-9]{2}', GENERICO.sub('', re.sub(rf'\b(?:{MARCAS})\b', '', cab.upper()))):
        mod = fim                                                       # "VOLKSWAGEN / FIAT / AGRÍCOLA - VW Gol, Fusca": o modelo
    if linha == 'MOTO': mod = re.sub(r'\s+\d\.\d\s?L\b(?:\s+\d+V)?', '', mod)
    mod = re.sub(r'\s+(?:G\s+)?B[PR]{1,2}\d{1,2}[A-Z]{0,4}(?:-[A-Z0-9]{1,3})?\b.*$', '', mod)
    return mod.strip(' ,·/-')


def da_linha(linha, m, mod):
    """a aplicação fica na página? Não fica o que não é veículo; na Linha Leve, o que o taxo.HEAVY reconhece como pesado;
    na Linha Moto, o que não é moto (caminhão, carro). A Linha Pesada segue o 16a da T-0029 (sai_da_pesada)"""
    import moto
    from pneus_fix import BR
    a = (m + ' ' + mod).upper()
    if NAO_VEICULO.search(mod) or NAO_VEICULO.search(m) or CODIGO.fullmatch(mod.upper().strip()) or re.search(r'\S{25,}', mod): return False
    resto = re.sub(rf'\b(?:{MARCAS})\b', '', mod.upper())
    if not re.search(r'[A-Z0-9]{2}', GENERICO.sub('', resto)): return False     # só montadora ou categoria ("Volvo / Mercedes-Benz")
    moto_ = bool(TX_MOTO.search(a) or re.search(r'\bMOTOS\b', a))
    if linha == 'LEVE': return not (HEAVY.search(a) or PESADO_EXTRA.search(a) or moto_)
    if linha == 'PESADA' and moto_: return False
    if linha == 'PESADA': return not ((LIGHT_BR.search(a) or LIGHT_MODELS.search(a)) and not HEAVY.search(a))   # sai o leve reconhecido
    if linha == 'MOTO':
        if moto.MOTO_KW.search(a) or TX_MOTO.search(a): return True
        if HEAVY.search(a) or LIGHT_MODELS.search(a) or CARRO_MOTO.search(a): return False
        return bool(re.search(rf'\b{BR}\b', a))
    return True


_MAPA = {}


def mapa_modelos():
    """1ª palavra do modelo → montadora, tirada das aplicações que trazem a montadora ("UNO" → FIAT), para pôr a
    montadora na aplicação que veio sem ela (marca, item 6). Só fica a palavra com uma montadora clara (80% ou mais)"""
    if not _MAPA:
        import moto
        cnt = collections.defaultdict(collections.Counter)
        for f in moto.FAMS:
            for m, mod in aplicacoes(f['rows'], n=10 ** 6):
                b, t = marca_modelo(m, mod, inferir=False)
                w = re.split(r'[\s,/]+', t.upper())[0]
                if b and re.search(r'[A-Z]{2}', w): cnt[w][b] += 1
        _MAPA.update({w: c.most_common(1)[0][0] for w, c in cnt.items()
                      if sum(c.values()) >= 2 and c.most_common(1)[0][1] >= .8 * sum(c.values())})
        _MAPA['_'] = ''
    return _MAPA


def marca_modelo(m, mod, inferir=True):
    """(montadora, modelo): a montadora curta e em maiúsculas (VW, GM, MB, FORD), uma só, e o modelo com a grafia do
    montar.tcase, sem repetir a montadora ("FIAT" + "Fiat 190" = Fiat · 190)"""
    from montar import tcase
    t = re.sub(r'(?i)^motos?\s+', '', mod.strip(' |'))
    if not m:
        pre = re.match(rf'(?:{MARCAS})\b[:\s]*', t.upper())
        if pre: m, t = t[:pre.end()], t[pre.end():]
    if m: b = carro(t or m, m)[0]
    elif inferir: b = mapa_modelos().get(re.split(r'[\s,/]+', t.upper())[0], '')
    else: b = ''
    from montar import BR_SHORT
    for nm in {b, m.upper().strip(' :')} | {k for k, v in BR_SHORT.items() if v == b}:
        if nm and t.upper().startswith(nm + ' '): t = t[len(nm) + 1:]
    return b, tcase(t.strip(' :,·/-'))


def grupos(ap):
    """montadora → modelos, na ordem do ranking (a 1ª aplicação de cada montadora dá a ordem)"""
    g = collections.OrderedDict()
    for m, mod in ap:
        b, t = marca_modelo(m, mod)
        if not t or (not b and not re.search(r'[A-Za-zÀ-ý]{2,}', t)): continue   # sem montadora e sem nome ("1.0 8V")
        ms = g.setdefault(b, [])
        if t.upper() not in {x.upper() for x in ms}: ms.append(t)
    return g


def lista_montadoras(s, x, y, w, hmax, g, cols, FS=10.2):
    """as aplicações agrupadas: a montadora em negrito uma vez e os modelos depois, até 2 linhas, com "…" quando sobra
    modelo (o corte é no último modelo inteiro). Entram as montadoras do ranking enquanto cabem; a lista sai em ordem
    alfabética, em colunas de cima para baixo (designer-ux, itens 3 e 4)"""
    LD, GAP = 15, 9
    cw = (w - 18 * (cols - 1)) / cols
    def bloco(b, ms):
        nome = montadora(b) if b else ''
        larg = [cw - 12 - (pw(nome + ' ', 'PB', FS) if nome else 0), cw - 12]
        lns, cur, i = [], '', 0
        while i < len(ms) and len(lns) < 2:
            cand = (cur + ', ' if cur else '') + ms[i]
            if pw(cand, 'PR', FS) <= larg[len(lns)]: cur = cand; i += 1; continue
            if not cur: cur = corta(ms[i], larg[len(lns)], FS); i += 1     # o modelo sozinho não cabe: fim de palavra e …
            lns.append(cur); cur = ''
        if cur and len(lns) < 2: lns.append(cur)
        if i < len(ms) and lns and not lns[-1].endswith('…'):            # sobrou modelo: … no fim
            u = lns[-1]
            while pw(u + '…', 'PR', FS) > larg[len(lns) - 1] and ', ' in u: u = u.rsplit(', ', 1)[0]
            lns[-1] = u + '…' if pw(u + '…', 'PR', FS) <= larg[len(lns) - 1] else corta(u + ' x', larg[len(lns) - 1], FS)
        return nome, [re.sub('…+', '…', ln) for ln in lns if ln.strip('… ')]
    def arruma(sel):                                                    # coluna de cada bloco; None se não couber
        col, yy, pos = 0, 0, []
        for nome, lns in sel:
            h = LD * len(lns) + GAP
            if yy + h - GAP > hmax: col, yy = col + 1, 0
            if col >= cols: return None
            pos.append((col, yy)); yy += h
        return pos
    chave = lambda bl: (not bl[0], bl[0].upper())                        # sem montadora por último
    sel = []
    for bl in (bloco(b, ms) for b, ms in g.items()):
        if not bl[1]: continue                                          # a linha que fica sem modelo sai
        teste = sorted(sel + [bl], key=chave)
        if arruma(teste) is None: break
        sel = teste
    pos = arruma(sel) or []
    for (nome, lns), (col, yy) in zip(sel, pos):
        cx = x + col * (cw + 18); cy = y + yy
        s.circle(cx + 3.2, cy + 5.2, 2.1, 'green')
        if nome: s.t(cx + 12, cy, nome, FS, 'ink', 'PB')
        for k, ln in enumerate(lns):
            s.t(cx + 12 + (pw(nome + ' ', 'PB', FS) if nome and not k else 0), cy + k * LD, ln, FS, 'ink', 'PR')
    return max([yy + LD * len(lns) for (_, lns), (_, yy) in zip(sel, pos)] or [0])


def especificacoes(c, n=12):
    ap, vist = [], set()
    for r in c.get('rows') or []:
        t = ''.join(x_ for x_, b in r.get('segs') or []).split(' — ')[0].strip()
        t = t[:1].upper() + t[1:]
        t = re.sub(r'\b(' + '|'.join(LINHA_BAP) + r')\b', lambda w: LINHA_BAP[w.group(1)], t)
        if t and t.upper() not in vist: vist.add(t.upper()); ap.append(t)
        if len(ap) >= n: break
    return ap


def lista_simples(s, x, y, w, ap, cols, FS=10.2, LD=23):
    cw = (w - 18 * (cols - 1)) / cols; lin = (len(ap) + cols - 1) // cols
    for k, t in enumerate(ap):
        cx = x + (k // lin) * (cw + 18); cy = y + (k % lin) * LD
        s.circle(cx + 3.2, cy + 5.2, 2.1, 'green')
        s.t(cx + 12, cy, corta(t, cw - 14, FS), FS, 'ink', 'PR')


def conteudo(c, n=60):
    """o que vai na lista do produto: ('spec', textos) ou ('apl', montadora → modelos)"""
    if c.get('spec'): return 'spec', especificacoes(c)
    ap = aplicacoes(c.get('rows') or [], n=n, so_pesado=c.get('so_pesado', ()), linha=c.get('linha'))
    return 'apl', grupos(ap)


UNIVERSAL_TXT = 'Uso universal: motocicletas, veículos leves e indústria.'


def produto(s, fam, c, x0, w, top, bot, meia=False):
    """um produto: a página inteira (foto à esquerda, texto à direita) ou meia página (foto em cima, texto embaixo;
    designer-ux, item 5). O nome do produto é o maior texto da página (item 1)"""
    tipo, cont = conteudo(c)
    if meia:
        ih = 120; s.foto(c['img'], x0, top, w, ih)
        if c['lanc']: s.chip(x0 + 16, top + 14, 'NOVIDADE 2026', 'white', 'orange', 7.5)
        x, y, wr = x0, top + ih + 14, w
        s.t(x, y, tit(fam).upper(), 9, 'gdark', 'PB', ls=1.4)
        s.t(x + w, y, f"{c['n']} {plural(c['n'])}", 10, 'grey', 'PM', 'right'); y += 18
        s.t(x, y, c['nome'], 22, 'ink', 'PB', ls=-.3); y += 32
        y += s.p(x, y, wr, html.escape(c['desc']), 11, 15, 'sec') + 10
    else:
        ih = bot - top - 30
        s.foto(c['img'], 40, top, 400, ih)
        if c['lanc']: s.chip(56, top + 16, 'NOVIDADE 2026', 'white', 'orange', 7.5)   # o ano do lançamento (T-0029, 9a)
        s.t(40, top + ih + 12, f"{c['n']} {plural(c['n'])}", 11, 'grey', 'PM')       # nº de itens embaixo da imagem
        x = 476; y = top + 6; wr = W - 40 - x
        s.t(x, y, tit(fam).upper(), 9.5, 'gdark', 'PB', ls=1.4); y += 22
        fs = next((f for f in range(28, 19, -1) if pw(c['nome'], 'PB', f) - .4 * len(c['nome']) <= wr), 20)   # nome longo: menor
        s.t(x, y, c['nome'], fs, 'ink', 'PB', ls=-.4); y += 46
        y += s.p(x, y, wr, html.escape(c['desc']), 13, 19, 'sec') + 22
    titulo = 'ESPECIFICAÇÕES' if tipo == 'spec' else 'PRINCIPAIS APLICAÇÕES'
    if not cont and not (tipo == 'apl' and c['linha'] == 'UNIVERSAL'): return
    s.t(x, y, titulo, 9 if meia else 9.5, 'gdark', 'PB', ls=1.4)
    s.rect(x, y + 16, wr, 1.2, fill='green'); y += 28
    if tipo == 'spec':
        cols = 1 if (meia or len(cont) <= 6) else 2
        lista_simples(s, x, y, wr, cont[:4 if meia else (9 if cols == 1 else 12)], cols, LD=18 if meia else 23)
    elif not cont:                                                    # item universal: uma frase (marca, item 5)
        s.circle(x + 3.2, y + 5.2, 2.1, 'green'); s.t(x + 12, y, UNIVERSAL_TXT, 10.2, 'ink', 'PR')
    else:
        lista_montadoras(s, x, y, wr, bot - y - 4, cont, 1 if (meia or len(cont) <= 4) else 2)


def poucos(c):
    """o produto cabe em meia página: até 4 especificações ou até 3 montadoras (cada uma com até 2 linhas de
    modelos; designer-ux, item 5) [SUPOSIÇÃO: o limite de 3 montadoras é o que cabe na meia página]"""
    if 'tab' in c: return False
    tipo, cont = conteudo(c)
    return len(cont) <= (4 if tipo == 'spec' else 3)


def pagina_linha(s, cod, nome, desc, arv, pags, contagem=True):
    """divisória da linha: lista sistema → família → produtos, estilo menu (sem fundo, com marcador). Nos portfólios por
    linha (T-0032), a lista usa só as colunas que precisa e a contagem fica só na capa. `pags`: a página de cada
    produto (id do card → nº), escrita ao lado do nome e com link (designer-ux, item 2)"""
    from reportlab.lib.utils import simpleSplit
    sis = arv[cod]
    s.c.bookmarkPage(f'p{s.n + 1}')
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
    for i, (a, b) in enumerate([] if not contagem else [(len(sis), 'sistemas'), (n_fam, 'famílias'), (n_pr, 'produtos'), (fmt(n_it), 'itens')]):
        yy = 292 + i * 32
        s.t(38, yy, str(a), 19, 'green2', 'PB'); s.t(38 + pw(str(a), 'PB', 19) + 8, yy + 6, b, 10.5, 'white', 'PR')
    # lista em 4 colunas (bloco do sistema vai para a coluna mais curta)
    cols, gap = (4 if contagem else min(4, len(sis))), 18
    x0 = PW + 28; cw = (W - 34 - x0 - gap * (cols - 1)) / cols
    import itertools
    IND = 11
    for FS, LD in ((8.8, 14.5), (8.4, 13.6), (8, 12.8)):      # com o nº da página, a Linha Leve não cabe em 8,8 pt
        def linhas(c): return simpleSplit(c['nome'], 'PM', FS, cw - IND - 2 - (30 if c['lanc'] else 0) - 18)
        def alt(f): return 26 + sum(16 + sum(LD * len(linhas(c)) for c in cs) + 7 for cs in f.values())
        # colunas em sequência (01, 02, 03... de cima para baixo), equilibradas pela altura
        itens = list(sis.items()); hs = [alt(f) + 14 for _, f in itens]
        melhor = None
        for cortes in itertools.combinations(range(1, len(hs)), min(cols - 1, len(hs) - 1)):
            b = (0,) + cortes + (len(hs),)
            mx = max(sum(hs[b[i]:b[i + 1]]) for i in range(len(b) - 1))
            if melhor is None or mx < melhor[0]: melhor = (mx, b)
        if 36 + melhor[0] - 14 <= H - 40: break
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
                ls_ = linhas(c)
                s.t(x + cw, yy, f"{pags[id(c)]:02d}", FS, 'gdark', 'PB', 'right')   # página do produto, com link
                s.link(x, yy - 2, cw, LD * len(ls_), pags[id(c)])
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
                       desc='Itens de troca rápida para automóveis, picapes e utilitários.', fim='para o seu autocenter'),
}
ARQUIVO = 'Portfolio_Produtos_BAP_AUTOPARTS_{}.pdf'     # Portfolio_Produtos_BAP_AUTOPARTS_Linha_Autocenter.pdf
NOME_LINHA = {cod: nome for cod, nome, _ in LINHAS}
FILTRO_SEM_CAIXA = {'Filtros de Cabine', 'Filtros de Combustível', 'Filtros de Óleo', 'Outros Filtros'}   # a foto é a caixa do filtro de ar
TAB_BAT = 12                                            # mais baterias que isso: página de tabela depois do produto


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
    ws = t[:len(t) - len(fim)].rstrip('…').split()
    while len(ws) > 1 and pw(' '.join(ws) + '…' + fim, 'PR', fs) > larg: ws.pop()
    while len(ws[0]) > 1 and pw(ws[0] + '…' + fim, 'PR', fs) > larg: ws[0] = ws[0][:-1]   # palavra só, maior que a linha
    return ' '.join(ws).rstrip(' ,/-·') + '…' + fim


def preparar(c, l=None):
    """o card no modelo aprovado (T-0032, 9a), no geral e nos 7: especificações num padrão só, baterias "45 Ah LP ·
    18 meses" (com tabela, se passar de 12), a descrição da linha e o ícone no lugar da caixa de filtro errada (6b)"""
    l = l or c['linha']
    d = dict(c, desc=DESC_LINHA.get((c['prod'], l), c['desc']))
    if c['nome'] in FILTRO_SEM_CAIXA: d['img'] = 'icone:filtro'
    if c['prod'] == 'Baterias':
        d['rows'] = [dict(r, bat=bateria(r), segs=[(bateria(r)[0], False)]) for r in c['rows']]
        if c['n'] > TAB_BAT: d['tab'] = d['rows']
    elif c['spec']:
        ts = [oleo(t) if c['prod'] == 'Óleo Lubrificante' else t
              for t in (''.join(x for x, _ in r.get('segs') or []).split(' — ')[0].strip() for r in c['rows'])]
        d['rows'] = [dict(r, segs=[(t, False)]) for r, t in zip(c['rows'], ts)]
    d['poucos'] = poucos(d)
    return d


def filtrar(arv, cfg):
    """a árvore de um portfólio por linha: seção → família → cards preparados"""
    out = collections.OrderedDict()
    for titulo, l, sis, prods in cfg['secoes']:
        for sn in ([sis] if sis else list(arv[l])):
            for fam, cs in arv[l].get(sn, {}).items():
                for c in cs:
                    if prods and c['prod'] not in prods: continue
                    out.setdefault(titulo or TITULO[sn], collections.OrderedDict()).setdefault(fam, []).append(preparar(c, l))
    return out


def plano(secoes, nome, inicio, volta=None):
    """as páginas de produto de uma linha, em ordem: (seção nº, seção, [(família, card)], tipo). Os produtos com pouca
    coisa da mesma seção vão 2 por página; a tabela das baterias vem logo depois do produto"""
    pgs = []
    for i, (sn, fams) in enumerate(secoes.items(), 1):
        par = None
        for fam, cs in fams.items():
            for c in cs:
                if c['poucos']:
                    if par: par['cards'].append((fam, c)); par = None; continue
                    par = dict(i=i, sn=sn, cards=[(fam, c)], tipo='prod'); pgs.append(par); continue
                pgs.append(dict(i=i, sn=sn, cards=[(fam, c)], tipo='prod'))
                if 'tab' in c: pgs.append(dict(i=i, sn=sn, cards=[(fam, c)], tipo='tab'))
    pags = {}
    for k, pg in enumerate(pgs):
        pg.update(n=inicio + k, nome=nome, volta=volta)
        if pg['tipo'] == 'prod':
            for _, c in pg['cards']: pags[id(c)] = pg['n']
    for pg in pgs:                     # com a tabela, a página do produto só aponta para ela (designer-ux)
        for _, c in pg['cards']:
            if 'tab' in c and pg['tipo'] == 'prod':
                c['rows'] = [dict(code='', segs=[(f"Os {c['n']} itens, com capacidade e garantia, estão na tabela da página {pags[id(c)] + 1}.", False)])]
    return pgs, pags


def pagina_produto(s, pg):
    s.c.bookmarkPage(f"p{pg['n']}")
    s.header(f"{pg['nome']} · {pg['i']:02d}", pg['sn'], ts=20, volta=pg['volta'])      # menos níveis (designer-ux, item 1)
    if pg['tipo'] == 'tab':
        fam, c = pg['cards'][0]
        s.t(W - 40, 92, f"Baterias da {NOME_LINHA[c['linha']]} · {c['n']} {plural(c['n'])}", 12, 'gdark', 'PB', 'right')
        tabela_baterias(s, c)
    elif len(pg['cards']) == 2:
        for k, (fam, c) in enumerate(pg['cards']):
            produto(s, fam, c, 40 + k * 456, 424, 128, H - 46, meia=True)
        s.rect(W / 2, 140, .8, H - 46 - 152, fill='line')
    else:
        fam, c = pg['cards'][0]
        produto(s, fam, c, 40, W - 80, 128, H - 46)
    s.footer(pg['volta'])


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


def tabela_baterias(s, c):
    """todas as baterias do card, com o código BAP (decisão 14a), em 2 blocos de colunas (designer-ux, item 7)"""
    rows = [(r['code'].strip(),) + r['bat'][1:] for r in c['tab']]
    meio = (len(rows) + 1) // 2; LD = 17; bw = (W - 80 - 24) / 2
    cols = [('CÓDIGO BAP', 0), ('CAPACIDADE', 120), ('GARANTIA', 210), ('OBSERVAÇÃO', 290)]
    for b, bloco in enumerate((rows[:meio], rows[meio:])):
        x = 40 + b * (bw + 24); y = 128
        for nm, dx in cols: s.t(x + 8 + dx, y, nm, 8, 'gdark', 'PB', ls=1)
        s.rect(x, y + 14, bw, 1.2, fill='green'); y += 22
        for k, row in enumerate(bloco):
            if k % 2: s.rect(x, y - 3, bw, LD, fill='soft')
            for (nm, dx), v in zip(cols, row): s.t(x + 8 + dx, y, v, 9.5, 'ink', 'PB' if nm == 'CÓDIGO BAP' else 'PR')
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
    s.p(40, 132, 600, 'Empresa brasileira criada em 2021 para oferecer componentes automotivos de qualidade, com segurança e bom '
        'custo-benefício. O portfólio vai da suspensão à parte elétrica, passando por filtros, lubrificantes e químicos, para a '
        'Linha Leve, a Linha Pesada e a Linha Moto.', 13, 20, 'sec')                  # decisão 15a; "Linha + nome" (glossário)
    tiles = [(str(len(produtos)), 'produtos'), (f'+{fmt(total // 100 * 100)}', 'itens no catálogo'),
             (str(len(sistemas)), 'sistemas do veículo'), ('3', 'linhas de veículo: leve, pesada e moto')]
    for i, (a, b) in enumerate(tiles):
        x = 40 + i * 222
        s.rect(x, 250, 206, 130, fill='black', r=16)
        s.t(x + 103, 280, a, 32, 'green2', 'PB', 'center'); s.p(x + 12, 334, 182, b, 11, 14, 'white', 'PR', 1)
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
    s.t(84, 382, 'Alexandre Guerreiro', 16, 'white', 'PB')                        # decisão 16a: o contato de hoje
    s.t(84, 404, f'Gerente Comercial · {NOME}', 10.5, 'lgrey', 'PR')
    s.t(84, 428, 'alexandre.guerreiro@bapautoparts.com.br', 11.5, 'green2', 'PM')
    s.t(84, 450, '(92) 99250-8980', 11.5, 'green2', 'PM')
    s.t(62, 500, SITE, 10, 'lgrey', 'PR')
    s.c.showPage()
    s.c.save()


def build_linha(out, chave, arv, total):
    """um portfólio por linha (T-0032): capa da linha → quem somos → divisória única com página → produtos → contato.
    Sem a p3 (as 4 linhas) do Portfólio geral (designer-ux, item 8)"""
    cfg = FILTROS[chave]; nome = cfg['nome']; div = cfg.get('divisoria', True)
    arv_f = filtrar(arv, cfg)
    pgs, pags = plano(arv_f, nome, 3 + div, 3 if div else None)
    cards = [c for f in arv_f.values() for cs in f.values() for c in cs]
    n_it = sum(c['n'] for c in cards)
    s = P(out)
    s.c.setTitle(f'Portfólio de Produtos {NOME} · {nome}'); s.c.setAuthor(NOME)
    primeiros = [next(iter(f.values()))[0] for f in arv_f.values()]          # capa: a foto do 1º produto de cada seção
    fotos = list(dict.fromkeys(c['img'] for c in primeiros + cards if c['img'] and not c['img'].startswith('icone:')))
    capa(s, nome.split(' ', 1)[0], nome.split(' ', 1)[1], html.escape(cfg['frase']), fotos,
         f"{cfg.get('conta') or f'{len(cards)} ' + plural(len(cards), 'produto', 'produtos')} · {fmt(n_it)} {plural(n_it)}")   # 17a
    quem_somos(s, arv, total)
    if div: pagina_linha(s, 'X', nome, cfg.get('desc', cfg['frase']), {'X': arv_f}, pags, contagem=False)
    for pg in pgs: pagina_produto(s, pg)
    contato(s, cfg.get('fim', 'para a sua loja ou oficina'))
    assert s.n + 1 == 4 + div + len(pgs) - 1, (s.n + 1, len(pgs))
    return arv_f, pgs, s.n + 1


def build(out, base=BASE, filtro=None):
    arv, total = dados(base)
    if filtro: return build_linha(out, filtro, arv, total)
    arv_p = {l: collections.OrderedDict((TITULO[sn], collections.OrderedDict((fam, [preparar(c) for c in cs]) for fam, cs in fams.items()))
                                        for sn, fams in sis.items()) for l, sis in arv.items()}
    planos, n = {}, 4                         # capa, quem somos e "nosso portfólio": a 1ª divisória é a p4
    for cod, nome, desc in LINHAS:
        if not arv_p[cod]: continue
        planos[cod] = (n,) + plano(arv_p[cod], nome, n + 1, n); n += 1 + len(planos[cod][1])
    s = P(out)
    s.c.setTitle('Portfólio de Produtos BAP AUTOPARTS'); s.c.setAuthor(NOME)
    capa(s, 'Conheça a', NOME, 'Peças, baterias, filtros, lubrificantes, químicos, pneus e acessórios para a Linha Leve, a Linha Pesada '
         'e a Linha Moto, organizados por linha, sistema do veículo e família de produto.',
         ['dimg/cover_0.png', 'dimg/cover_16.png', 'dimg/cover_34.png', 'dimg/cover_27.png', 'dimg/cover_10.png', 'dimg/cover_36.png'])
    quem_somos(s, arv, total)
    # como o portfólio está organizado, com a página de cada linha e o link (designer-ux, item 2)
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
        if cod in planos:
            s.t(x + w - 18, 434, f'página {planos[cod][0]:02d}', 9.5, 'green2', 'PB', 'right')
            s.link(x, 128, w, 330, planos[cod][0])
    s.rect(40, 470, 880, 1, fill='line')
    s.t(40, 478, 'Cada produto aparece na Linha Leve, Pesada, Moto ou Universal, conforme a aplicação. Dentro da linha: sistema do veículo, família e produto.', 9, 'grey', 'PR')
    s.footer()

    for cod, nome, desc in LINHAS:
        if cod not in planos: continue
        pdiv, pgs, pags = planos[cod]
        pagina_linha(s, cod, nome, desc, arv_p, pags)
        for pg in pgs: pagina_produto(s, pg)

    contato(s)
    return {l: (len(arv[l]), sum(len(cs) for f in arv[l].values() for cs in f.values())) for l in arv}, total, s.n + 1


def imprimir_indice(arv):
    """o índice de um portfólio por linha sem gerar o PDF: páginas, seções, famílias e produtos"""
    for chave, cfg in FILTROS.items():
        div = cfg.get('divisoria', True)
        arv_f = filtrar(arv, cfg); pgs, pags = plano(arv_f, cfg['nome'], 3 + div)
        n_it = sum(c['n'] for f in arv_f.values() for cs in f.values() for c in cs)
        print(f"## {cfg['nome']} ({chave}): {3 + div + len(pgs)} páginas, {fmt(n_it)} {plural(n_it)}")
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
    print(r if not lin else (out, r[2], 'páginas'))
