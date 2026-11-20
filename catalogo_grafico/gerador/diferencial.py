"""Diferencial entre itens parecidos do catálogo (ex.: AMT7014 c/ ABS × AMT7500 s/ ABS).

1. Divide a aplicação de cada item em trechos de veículo (montadora em negrito + texto).
2. Extrai atributos que mudam a peça: ABS, ar-condicionado, direção, câmbio, combustível, tração, turbo,
   barra estabilizadora, cabine, sensor, rolamento, pivô, defletor, válvulas, gás/óleo, estrias/dentes/furos.
3. "Gêmeos" = itens da mesma linha com o mesmo veículo (montadora + modelo + anos que se cruzam + mesma posição/lado).
4. O diferencial de um item é o atributo que ele tem e o gêmeo não tem (ou tem o oposto).
Resultado: r['dif'] (texto curto do diferencial) e r['gemeos'] (códigos parecidos), para a auditoria e a base_v11.
Os PDFs não mostram (T-0019, 20/11).
"""
import re, collections, unicodedata

U = lambda s: ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()

# (rótulo, grupo, regex no texto sem acento e em maiúsculas). Rótulos do mesmo grupo são opostos.
ATR = [
    ('c/ ABS', 'ABS', r'\b(?:C/|COM)\s*(?:FREIOS?\s*)?ABS\b'),
    ('s/ ABS', 'ABS', r'\b(?:S/|SEM)\s*(?:FREIOS?\s*)?ABS\b'),
    ('c/ ar', 'AR', r'\b(?:C/|COM)\s*AR(?:\s*COND(?:ICIONADO)?\.?)?\b(?!\s*COMPRIMIDO)'),
    ('s/ ar', 'AR', r'\b(?:S/|SEM)\s*AR(?:\s*COND(?:ICIONADO)?\.?)?\b'),
    ('dir. hidr.', 'DIR', r'\bDIR(?:\.|ECAO)?\s*HIDR'),
    ('dir. elétr.', 'DIR', r'\bDIR(?:\.|ECAO)?\s*ELET'),
    ('dir. mec.', 'DIR', r'\bDIR(?:\.|ECAO)?\s*MEC'),
    ('câmbio aut.', 'CAMBIO', r'\bCAMBIO\s*AUT|\bTRANSM(?:ISSAO|\.)?\s*AUT|\b(?:C/|COM)\s*CAMBIO\s*AUT'),
    ('câmbio manual', 'CAMBIO', r'\bCAMBIO\s*(?:MANUAL|MEC)|\bTRANSM(?:ISSAO|\.)?\s*MANUAL'),
    ('câmbio manual', 'CAMBIO', r'(?:^|·)\s*MANUAL\s*(?=·|$)'),
    ('câmbio aut.', 'CAMBIO', r'(?:^|·)\s*AUT(?:\.|OMATICO)\s*(?=·|$)'),
    ('diesel', 'COMB', r'\bDIESEL\b'),
    ('flex', 'COMB', r'\bFLEX\b'),
    ('4x4', 'TRACAO', r'\b4\s*X\s*4\b|\b4WD\b'),
    ('4x2', 'TRACAO', r'\b4\s*X\s*2\b'),
    ('turbo', 'TURBO', r'\bTURBO\b'),
    ('c/ barra estab.', 'BARRA', r'\b(?:C/|COM)\s*BARRA\s*ESTAB'),
    ('s/ barra estab.', 'BARRA', r'\b(?:S/|SEM)\s*BARRA\s*ESTAB'),
    ('c/ sensor', 'SENSOR', r'\b(?:C/|COM)\s*SENSOR'),
    ('s/ sensor', 'SENSOR', r'\b(?:S/|SEM)\s*SENSOR'),
    ('c/ rolamento', 'ROL', r'\b(?:C/|COM)\s*ROLAMENTO'),
    ('s/ rolamento', 'ROL', r'\b(?:S/|SEM)\s*ROLAMENTO'),
    ('c/ pivô', 'PIVO', r'\b(?:C/|COM)\s*PIVO'),
    ('s/ pivô', 'PIVO', r'\b(?:S/|SEM)\s*PIVO'),
    ('c/ defletor', 'DEFL', r'\b(?:C/|COM)\s*DEFLETOR'),
    ('s/ defletor', 'DEFL', r'\b(?:S/|SEM)\s*DEFLETOR'),
    ('cab. simples', 'CAB', r'\bCAB(?:INE|\.)?\s*SIMPLES'),
    ('cab. dupla', 'CAB', r'\bCAB(?:INE|\.)?\s*DUPLA'),
    ('c/ haste', 'HASTE', r'\b(?:C/|COM)\s*HASTE'),
    ('s/ haste', 'HASTE', r'\b(?:S/|SEM)\s*HASTE'),
    ('c/ caneca', 'CANECA', r'\b(?:C/|COM)\s*CANECA'),
    ('s/ caneca', 'CANECA', r'\b(?:S/|SEM)\s*CANECA'),
    ('kit parcial', 'KIT', r'\bKIT PARCIAL\b'),
    ('kit completo', 'KIT', r'\bKIT COMPLETO\b'),
    ('8V', 'VALV', r'\b8\s*V\b|\b8\s*VALV'),
    ('16V', 'VALV', r'\b16\s*V\b|\b16\s*VALV'),
]
ATR_RX = [(l, g, re.compile(p)) for l, g, p in ATR]
NUM = re.compile(r'\b(\d{1,3})\s*(ESTRIAS|DENTES|FUROS)\b')
STOP = {'EXC', 'C/', 'S/', 'COM', 'SEM', 'TODOS', 'TODAS', 'MOTOR', 'MOD', 'NOVO', 'NOVA', 'LINHA', 'DIANT', 'TRAS', 'DIR', 'ESQ',
        'SEDAN', 'HATCH', 'CABINE', 'DUPLA', 'SIMPLES', 'FLEX', 'DIESEL', 'TURBO', 'AUT', 'MEC', 'HIDR', 'GAS', 'ATE', 'APOS', 'VER',
        'ABS', 'AR', 'BARRA', 'ESTAB', 'PICK', 'UP', 'PICK-UP', 'ADVENTURE', 'SPORT', 'CROSS', 'WEEKEND', 'LOCKER', 'PRATO', 'PEQUENO',
        'ESTENDIDA', 'FURGAO', 'ARGENTINA', 'BRASIL', 'VALV', 'VALVULAS', 'CIL', 'POT', 'DE', 'DA', 'DO', 'E', 'EM', 'DIANTE', 'TRASEIRO',
        'DIANTEIRO', 'TRASEIRA', 'DIANTEIRA', 'LADO', 'DIREITO', 'ESQUERDO', 'POSICAO', 'TODO', 'MODELO', 'MODELOS', 'VERSAO', 'VERSOES', 'MANUAL', 'AUTOMATICO', 'HIDRAULICA', 'MECANICA', 'ELETRICA', 'EMBREAGEM', 'CILINDRO', 'MESTRE', 'AUXILIAR', 'FREIO', 'SERVICO', 'REBOQUES', 'SEMIRREBOQUES', 'REBOQUE', 'SEMIRREBOQUE', 'INFERIOR', 'SUPERIOR', 'INF', 'SUP', 'GASOLINA', 'ETANOL', 'ALCOOL', 'INJECAO', 'ELETRONICA', 'CARBURADO', 'COUPE', 'PERUA', 'CABRIO', 'CONVERSIVEL', 'VAN', 'CHASSI', 'ONIBUS', 'CAMINHAO', 'CAMINHOES', 'LEVE', 'PESADA', 'PESADO', 'POLEGADAS', 'MM', 'V', 'L', 'CV', 'HP',
        'LT', 'LTZ', 'LS', 'LX', 'EX', 'EXL', 'GL', 'GLS', 'GLX', 'ELX', 'HLX', 'SE', 'XLT', 'XL', 'XLS', 'SR', 'SRV', 'ELITE', 'ACTIV',
        'ADVANTAGE', 'PREMIER', 'PLUS', 'TITANIUM', 'FREEDOM', 'TREKKING', 'WORKING', 'ATTRACTIVE', 'ESSENCE', 'SPORTING', 'HIGHLINE',
        'COMFORTLINE', 'TRENDLINE', 'ZEN', 'INTENSE', 'EXPRESSION', 'DYNAMIQUE', 'AUTHENTIQUE', 'PRIVILEGE', 'ASPIRADO', 'X4', 'X2',
        '4X4', '4X2', 'ELX', 'ATE', 'A', 'OU', 'NOVO', 'NEW', 'SERIE', 'SERIES', 'G', 'D'}


def atributos(texto):
    t = U(texto)
    out = {}
    for l, g, rx in ATR_RX:
        if rx.search(t):
            out.setdefault(g, set()).add(l)
    for n, k in NUM.findall(t):
        out.setdefault(k, set()).add(f'{int(n)} {k.lower()}')
    return out


def atr_item(r):
    """atributos que valem para o item todo: descrição do cadastro, DETALHE e dados adicionais"""
    b = r['base']
    txt = ' · '.join([b.get('DESCRICAO', ''), r.get('desc_est', ''), r.get('sub', '')])
    a = atributos(txt)
    m = re.search(r'Type \(Gas or Oil\? \):\s*(\w+)', b.get('DADOS_ADICIONAIS', ''))
    if m:
        a.setdefault('TIPO', set()).add({'GAS': 'gás', 'OIL': 'óleo', 'OLEO': 'óleo'}.get(U(m.group(1)), m.group(1).lower()))
    return a


def trechos(segs):
    """[(montadora, texto)] — cada montadora em negrito abre um trecho"""
    out, cur = [], None
    for t, bold in segs:
        if bold:
            cur = [U(t).strip(), '']; out.append(cur)
        elif cur is None:
            cur = ['', t]; out.append(cur)
        else:
            cur[1] += t
    return [(m, t) for m, t in out]


def tipo(r):
    """tipo de peça dentro da linha: família da base + 1ª palavra da descrição (POLIA × TENSOR, AR × CABINE...)"""
    b = r['base']
    w = re.findall(r'[A-Z]+', U(b.get('DESCRICAO', '') or r.get('desc_est', '')))
    return (b.get('FAMILIA', ''), w[0] if w else '')


def anos(t):
    ys = [int(y) for y in re.findall(r'(?<!\d)(19[5-9]\d|20[0-3]\d)(?!\d)', t)]
    return (min(ys), max(ys)) if ys else None


def modelos(t):
    t = U(re.sub(r'\(.*?\)', ' ', t))
    t = re.split(r'\bEXC\.?\b', t)[0]                      # o que vem depois de "exc." não é o veículo do item
    ws = re.findall(r"[A-Z][A-Z0-9\-]+", t)
    return {w for w in ws if w not in STOP and not re.fullmatch(r'\d+', w) and len(w) >= 2}


def modelo_anos(t):
    """{modelo: (ano_ini, ano_fim)} — o ano que vem depois do modelo (até o próximo modelo) vale para ele"""
    out, pend, mot, geral = {}, set(), set(), anos(t)
    for tok in re.split(r'\s·\s|;\s|,\s', re.sub(r'(?i)\b(?:exc|exceto)\.?[^·;]*', ' ', t)):
        ms = modelos(tok); a = anos(tok)
        if ms and not pend: mot = set()
        pend |= ms; mot |= motores(tok)
        if a:
            for m in pend: out[m] = (a, frozenset(mot))
            pend, mot = set(), set()
    for m in pend: out.setdefault(m, (geral, frozenset(mot)))
    return out


def motores(t):
    return set(re.findall(r'\b([1-9]\.\d)\b', t))


def pos_ok(a, b):
    if not a or not b: return True
    A, B = set(a.split(' E ')), set(b.split(' E '))
    return bool(A & B)


def analisar(rows):
    """rows: dicts com linha, code, segs, sub, base, desc_est, spec. Preenche dif, gemeos, sem_dif."""
    por = collections.defaultdict(list)
    for r in rows:
        r['dif'] = ''; r['gemeos'] = {}; r['sem_dif'] = []
        if r['spec'] or not r['segs']:
            continue
        ai = atr_item(r)
        r['_tr'] = []
        for m, t in trechos(r['segs']):
            a = {g: set(v) for g, v in ai.items()}
            for g, v in atributos(re.sub(r'(?i)\b(?:exc|exceto)\.?[^·;]*', ' ', t)).items(): a.setdefault(g, set()).update(v)
            r['_tr'].append(dict(m=m, mod=modelo_anos(t), mot=motores(t), a=a, t=t))
        por[(r['linha'], tipo(r))].append(r)
    for linha, rs in por.items():
        idx = collections.defaultdict(list)
        for r in rs:
            for k, tr in enumerate(r['_tr']):
                for md, an in tr['mod'].items(): idx[(tr['m'], md)].append((r, k, an))
        vistos = set()
        for key, lst in idx.items():
            for i in range(len(lst)):
                for j in range(i + 1, len(lst)):
                    (ra, ka, (ya, ma)), (rb, kb, (yb, mb)) = lst[i], lst[j]
                    if ra['code'] == rb['code']: continue
                    par = (ra['code'], ka, rb['code'], kb)
                    if par in vistos: continue
                    vistos.add(par)
                    ta, tb = ra['_tr'][ka], rb['_tr'][kb]
                    if not (ya and yb) or min(ya[1], yb[1]) - max(ya[0], yb[0]) < 1 and not (ya == yb): continue
                    if ma and mb and not (ma & mb): continue
                    ba, bb = ra['base'], rb['base']
                    if not pos_ok(ba.get('POSICAO', ''), bb.get('POSICAO', '')): continue
                    if not pos_ok(ba.get('LADO', ''), bb.get('LADO', '')): continue
                    da = diff(ta['a'], tb['a']); db = diff(tb['a'], ta['a'])
                    veic = (ta['m'] + ' ' + key[1]).strip()
                    if da or db:
                        ra['gemeos'].setdefault(rb['code'], set()).update(db or {'?'})
                        rb['gemeos'].setdefault(ra['code'], set()).update(da or {'?'})
                        ra.setdefault('_dif', set()).update(da); rb.setdefault('_dif', set()).update(db)
                        if da and db:                      # oposto dos dois lados (c/ ABS × s/ ABS): é o que mais distingue
                            ra.setdefault('_dif2', set()).update(da); rb.setdefault('_dif2', set()).update(db)
                    elif U(ra.get('sub', '')).strip(' .') == U(rb.get('sub', '')).strip(' .'):
                        ra['sem_dif'].append((rb['code'], veic)); rb['sem_dif'].append((ra['code'], veic))
    for r in rows:
        d = r.pop('_dif', set())
        d2 = r.pop('_dif2', set())
        if d2: d = d2
        gl = collections.Counter(G.get(l) for l in d)
        d = {l for l in d if not (G.get(l) and gl[G.get(l)] > 1)}
        r['dif'] = ' · '.join(sorted(d, key=ordem))
        r.pop('_tr', None)
    return rows


def diff(a, b):
    """o que a tem e b não tem, só em grupos em que os dois disseram algo ou em que a diz e b é diferente"""
    out = set()
    for g, va in a.items():
        vb = b.get(g, set())
        if va - vb and (vb or g in ('ABS', 'AR', 'TURBO', 'TRACAO', 'COMB', 'BARRA', 'SENSOR', 'ROL', 'PIVO', 'DEFL', 'CAMBIO', 'DIR', 'CAB', 'HASTE', 'CANECA', 'KIT')):
            out |= (va - vb)
    return out


ORD = [l for l, g, p in ATR]
G = {l: g for l, g, p in ATR}


def ordem(l):
    return (ORD.index(l) if l in ORD else 99, l)


def _segs_antes(r):
    """aplicação de antes dos complementos do Fraga (o texto resumido do Fraga não gera diferencial)"""
    import fraga_complementos as FC
    if r['code'] in FC.LOG['nova']: return []           # aplicação toda do Fraga: não havia aplicação antes
    return r.get('_segs_antes_fraga') or r.get('segs') or []


def aplicar_catalogo(fams):
    """aplicar() nas famílias do moto.py, sem os itens com a aplicação do site (resumida por motor)"""
    import site_aplicacoes as SITE
    aplicar(fams)
    cod = set(SITE.LOG.get('preenchidos', []))
    for f in fams:
        for r in f['rows']:
            g = {c: v for c, v in (r.get('gemeos') or {}).items() if c not in cod}
            if r['code'] in cod or (r.get('gemeos') and not g):
                r['dif'] = ''; r['gemeos'] = {}
            elif r.get('gemeos') and len(g) != len(r['gemeos']):
                r['gemeos'] = g


def aplicar(fams, max_selo=2):
    """roda a análise sobre as famílias do catálogo e grava r['dif'] (selo) e r['gemeos'] em cada linha"""
    import detalhe as DT
    B, E = DT._base10(), DT._desc()
    rows, ref = [], []
    for f in fams:
        if f.get('moto'):
            continue
        for r in f['rows']:
            c = r['code'].strip().upper()
            d = dict(linha=f['name'], spec=bool(f.get('spec')), code=c, sub=r.get('sub') or '',
                     segs=_segs_antes(r), base=B.get(c, {}), desc_est=str(E.get(r['code']) or ''))
            rows.append(d); ref.append(r)
    analisar(rows)
    por_cod = {}
    for d, r in zip(rows, ref):
        sel = [x for x in d['dif'].split(' · ') if x][:max_selo]
        r['dif'] = ' · '.join(sel)
        r['gemeos'] = {k: sorted(v - {'?'}) for k, v in d['gemeos'].items()}
        r['sem_dif'] = d['sem_dif']
        por_cod[d['code']] = r
    for f in fams:                       # Linha Moto: copia do item original
        if f.get('moto'):
            for r in f['rows']:
                o = por_cod.get(r['code'].strip().upper())
                if o: r['dif'] = o.get('dif', ''); r['gemeos'] = o.get('gemeos', {})
    return rows
