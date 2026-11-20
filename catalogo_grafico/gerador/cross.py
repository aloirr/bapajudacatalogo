import re, collections
import pneus_fix as PF
import digital2 as D2

F = {f['name']: f for f in PF.M.fams}

# ------------------------------------------------------------- 1) correções de texto
INCH = re.compile(r'\b(?:19|20)(\d\d)–(?:19|20)(\d\d)(?=")')          # 13/16" virou 2013–2016"
INCH2 = re.compile(r'\b(\d{1,2})/20(\d\d)(?=")')                         # 11/16" virou 11/2016"
SUBFIX = {"Bomba água d'água": "Bomba d'água"}
fix_inch = 0


def merge(segs):
    out = []
    for t, b in segs:
        if out and not b and not out[-1][1]: out[-1][0] += t
        else: out.append([t, b])
    return out


for f in PF.M.fams:
    for r in f['rows']:
        r['segs'] = merge(r['segs'])
        if r.get('sub') in SUBFIX: r['sub'] = SUBFIX[r['sub']]
        new = []
        for t, b in r['segs']:
            t2 = INCH2.sub(r'\1/\2', INCH.sub(r'\1/\2', t))
            if t2 != t: fix_inch += 1
            new.append([t2, b])
        r['segs'] = new

# ------------------------------------------------------------- 2) encurtar aplicações sem perder informação
ABBR = [(r'\bExe?ce?to\b', 'exc.'), (r'\bExceto\b', 'exc.'), (r'\bexceto\b', 'exc.'), (r'\bSem ABS\b', 's/ ABS'), (r'\bsem ABS\b', 's/ ABS'),
        (r'\bCom ABS\b', 'c/ ABS'), (r'\bcom ABS\b', 'c/ ABS'), (r'\b[Ss]em [Aa]r\b', 's/ ar'), (r'\b[Cc]om [Aa]r\b', 'c/ ar'),
        (r'\b[Cc]om [Bb]arra [Ee]stabilizadora\b', 'c/ barra estab.'), (r'\b[Ss]em [Bb]arra [Ee]stabilizadora\b', 's/ barra estab.'),
        (r'\bAutomático\b', 'Aut.'), (r'\bautomático\b', 'aut.'), (r'\bHidráulica\b', 'Hidr.'), (r'\bhidráulica\b', 'hidr.'),
        (r'\bMecânica\b', 'Mec.'), (r'\bmecânica\b', 'mec.'), (r'\bGasolina\b', 'Gas.'), (r'\bDiesel\b', 'Diesel'),
        (r'\b((?:\d{2}/)?(?:19|20)\d{2})\s+em diante\b', r'\1>'), (r'\bDianteiro\b', 'Diant.'), (r'\bTraseiro\b', 'Tras.'),
        (r'\bdianteiro\b', 'diant.'), (r'\btraseiro\b', 'tras.'), (r'\bdianteira\b', 'diant.'), (r'\btraseira\b', 'tras.'),
        (r'\bDianteira\b', 'Diant.'), (r'\bTraseira\b', 'Tras.'), (r'\bEsquerdo\b', 'Esq.'), (r'\bDireito\b', 'Dir.'),
        (r'\bTodos os modelos\b', 'todos'), (r'\s+/\s+', ' / '), (r'\s+,', ','), (r'\s{2,}', ' '), (r'\.\.(?!\.)', '.')]
POSW = r'(?:Dianteir[oa]s?|Traseir[oa]s?|Diant\.?|Tras\.?|Dir(?:eito)?\.?|Esq(?:uerdo)?\.?|D/[Ee]|Dir\s*/\s*Esq|Direito e Esquerdo|Lado (?:Direito|Esquerdo)|Ambos os lados)'
TAIL = re.compile(r'(?:\s*·\s*' + POSW + r'(?:\s*[·/]\s*' + POSW + r')*)+\s*$')
before = after = 0
for f in PF.M.fams:
    if f['spec'] or f['name'] == 'Pneus e Câmaras de Ar Moto': continue
    for r in f['rows']:
        has_pos = bool(re.match(r'(Dianteiro|Traseiro)', r.get('sub') or ''))
        segs = []
        for k, (t, b) in enumerate(r['segs']):
            before += len(t)
            if not b:
                for p, q in ABBR: t = re.sub(p, q, t)
                if has_pos:
                    t = re.sub(r'\s*·\s*(?:Diant\.|Tras\.)\s*·\s*(?:Dir / Esq|D/E)\b', '', t)
                    if k == len(r['segs']) - 1: t = TAIL.sub('', t)
            after += len(t)
            segs.append([t, b])
        r['segs'] = segs

# ------------------------------------------------------------- 3) venda casada item a item (pares confiáveis)
STOP = set('Exc Com Sem Motor Motores Flex Todos Todas Turbo Diant Tras Dir Esq Mod Novo Nova Modelo Linha Gas Aut Hidr Mec Sedan Hatch Cabine Dupla Simples Até Após Diesel Gasolina Fire Evo Zetec Rocam Rocan Supercharger Powertrain Hi Etorq Torq Cil Válvulas Jogo Kit Unidade Bomba Vela Cabo Trás Frente Ambos Lado Lados Original Exceto Pick Up Weekend Adventure Sport Sporting Attractive Essence Way Cross'.split())
NORM_MODEL = {'ONIX': 'Onix', 'ÔNIX': 'Onix', 'KA': 'Ka', 'UP': 'Up', 'HB20': 'Hb20', 'SPACEFOX': 'Spacefox', 'SPACE': 'Spacefox', 'DOBLÒ': 'Doblo', 'DOBLÔ': 'Doblo'}


BRANDS = {'Fiat', 'Vw', 'Volkswagen', 'Gm', 'Chevrolet', 'Ford', 'Renault', 'Toyota', 'Honda', 'Hyundai', 'Nissan', 'Peugeot', 'Citroën',
          'Citroen', 'Jeep', 'Kia', 'Mitsubishi', 'Audi', 'Bmw', 'Volvo', 'Scania', 'Iveco', 'Mb', 'Mercedes', 'Benz', 'Mercedes-benz',
          'Lexus', 'Chery', 'Jac', 'Suzuki', 'Dodge', 'Ram', 'Troller', 'Agrale', 'Psa', 'Daewoo', 'Asia', 'Land', 'Rover', 'Subaru', 'Mazda'}
STOP |= BRANDS
BMAP = {'VW': 'VOLKSWAGEN', 'GM': 'CHEVROLET', 'MB': 'MERCEDES', 'PSA': 'PEUGEOT', 'CITROËN': 'CITROEN'}


def brands(r):
    out = set()
    for x, b in r['segs']:
        if b:
            for p in re.split(r'[/ ]+', x.upper()):
                if p: out.add(BMAP.get(p, p))
    return out


def feats(r):
    t = ' '.join(x for x, b in r['segs'])
    words = re.findall(r"[A-Za-zÀ-ü][A-Za-zÀ-ü0-9\-]+", t)
    models = set()
    for w in words:
        W = w.upper()
        if W in NORM_MODEL: models.add(NORM_MODEL[W]); continue
        if w[0].isupper() and len(w) >= 2 and w.capitalize() not in STOP and not re.fullmatch(r'[A-Z]{1,3}', w):
            models.add(w.capitalize().replace('Doblò', 'Doblo').replace('Doblô', 'Doblo'))
    eng = set(re.findall(r'\b([1-6]\.\d)\b', t)) | {f'{a}.{b}' for a, b in re.findall(r'\b([1-6])\s*\.\s*(\d)\b', t)}
    val = set(re.findall(r'\b(8|12|16|20|24)\s*[Vv]\b', t))
    yrs = [int(y) for y in re.findall(r'(?:19|20)\d{2}', t)]
    return models, eng, val, (min(yrs), max(yrs) if yrs else None) if yrs else None


def match(a_name, b_name, maxn=2, need_engine=True):
    A, B = F[a_name]['rows'], F[b_name]['rows']
    FB = [(r, feats(r), brands(r)) for r in B if not r.get('sem_estoque')]   # par só com item em estoque (27/10)
    res, stats = {}, collections.Counter()
    for r in A:
        m, e, v, y = feats(r); ba = brands(r)
        cands = []
        for rb, (mb, eb, vb, yb), bb in FB:
            mi = m & mb
            if not mi: continue
            if ba and bb and not (ba & bb): continue
            if need_engine == 'strict' and not (e & eb): continue
            if need_engine and e and eb and not (e & eb): continue
            if v and vb and not (v & vb): continue
            if y and yb and (y[1] < yb[0] - 1 or yb[1] < y[0] - 1): continue
            sc = 3 * len(mi) + 2 * len(e & eb) + len(v & vb)
            cands.append((sc, rb['code']))
        if not cands: stats['sem par'] += 1; continue
        cands.sort(key=lambda x: (-x[0], x[1]))
        top = cands[0][0]
        best = [c for s, c in cands if s >= top * 0.85][:maxn]
        res[r['code']] = best; stats['com par'] += 1
    return res, stats


PAIRS = [('Kit de Distribuição', "Bomba D'Água"), ('Bomba de Óleo', 'Interruptores de Pressão do Óleo'),
         ('Sapata de Freio', 'Cilindro de Roda'), ('Velas de Ignição', 'Cabo de Vela')]
CROSS_LOG = {}
for a, b in PAIRS:
    res, st = match(a, b, need_engine='strict' if a in ('Velas de Ignição', 'Kit de Distribuição') else True)
    CROSS_LOG[a] = (b, st, res)
    F[a]['extra_col'] = 'OFEREÇA JUNTO'
    for r in F[a]['rows']:
        r['extra'] = ' · '.join(res.get(r['code'], [])) or '—'

# ------------------------------------------------------------- 4) faixa "venda casada" nas capas
VENDA = {
    'Amortecedores': 'Kit batente da mesma posição e bieletas.',
    'Kit Batente de Amortecedor': 'Amortecedores da mesma posição.',
    'Pivô de Suspensão': 'Terminais de direção e bandejas (modelos sem pivô incorporado).',
    'Bandejas de Suspensão': 'Pivô (bandejas sem pivô) e buchas da barra estabilizadora.',
    'Suporte Tensor (Morcego)': 'Bandejas e pivôs do mesmo veículo.',
    'Bucha da Barra Estabilizadora': 'Bieletas da barra estabilizadora.',
    'Bieletas': 'Buchas da barra estabilizadora.',
    'Terminais de Direção': 'Terminal axial do mesmo lado.',
    'Terminal Axial': 'Terminal de direção do mesmo lado.',
    'Caixa de Direção': 'Terminais de direção e terminais axiais.',
    'Junta Homocinética': 'Kit reparo (coifa) da junta.',
    'Kit Reparo da Junta Homocinética': 'Junta homocinética e trizeta.',
    'Trizetas': 'Kit reparo (coifa) da junta.',
    'Semi-Eixo Homocinético': 'Cubo ou rolamento de roda do mesmo lado.',
    'Embreagem Remanufaturada': 'Servo e cilindro de embreagem.',
    'Servo e Cilindro de Embreagem': 'Kit de embreagem.',
    'Pastilha de Freio': 'Fluido de freio DOT.',
    'Sapata de Freio': 'Cilindro de roda (coluna "Ofereça junto") e fluido de freio DOT.',
    'Cilindro de Roda': 'Sapatas de freio e fluido de freio DOT.',
    'Cuíca de Freio': 'Catraca de freio.',
    'Catraca de Freio': 'Cuíca de freio.',
    'Eletroventiladores': "Aditivo, água desmineralizada e bomba d'água.",
    "Bomba D'Água": 'Kit de distribuição (motores com correia dentada), aditivo e água desmineralizada.',
    'Bomba de Óleo': 'Interruptor de pressão do óleo (coluna "Ofereça junto"), óleo e filtro de óleo.',
    'Interruptores de Pressão do Óleo': 'Bomba de óleo, óleo e filtro de óleo.',
    'Bomba de Combustível': 'Filtro de combustível.',
    'Kit de Distribuição': 'Bomba d\'água (coluna "Ofereça junto") e polias e tensionadores.',
    'Polias e Tensionadores': 'Kit de distribuição.',
    'Velas de Ignição': 'Cabos de vela (coluna "Ofereça junto").',
    'Cabo de Vela': 'Velas de ignição.',
    'Filtros': 'Kit revisão: filtros de óleo, ar, combustível e cabine, com o óleo lubrificante.',
    'Óleo Lubrificante': 'Filtro de óleo e filtro de ar.',
    'Cubo de Roda': 'Rolamentos de roda.',
    'Rolamentos': 'Cubo de roda.',
    'Pneus e Câmaras de Ar Moto': 'Para cada pneu, a câmara indicada; para cada câmara, os pneus BAP compatíveis (coluna "Ofereça junto").',
}
for f in PF.M.fams:
    if f['name'] in VENDA: f['venda'] = VENDA[f['name']]
D2.fams = PF.M.fams

if __name__ == '__main__':
    print('polegadas corrigidas', fix_inch, '| caracteres de aplicação', before, '->', after, f'({(1 - after / before) * 100:.1f}% menos)')
    for a, (b, st, res) in CROSS_LOG.items():
        print(a, '->', b, dict(st))
        for k in list(res)[:4]: print('   ', k, res[k])
