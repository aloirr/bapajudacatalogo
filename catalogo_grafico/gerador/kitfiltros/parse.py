import re, unicodedata, collections
import pandas as pd
U = '/mnt/user-data/uploads/Regionais - Leandro/'
YR = re.compile(r'^(?:(?:\d{2}/)?(?:19|20)\d{2}(?:\s*(?:em diante|>|até\s*(?:\d{2}/)?(?:19|20)\d{2}|[–-]\s*(?:\d{2}/)?(?:19|20)\d{2}))?|todos os anos|até\s*(?:19|20)\d{2}|em diante)$', re.I)
TIPO = {'FILTROS DE AR': 'AR', 'FILTROS DE ÓLEO': 'ÓLEO', 'FILTROS DE COMBUSTÍVEL': 'COMBUSTÍVEL', 'FILTROS DE CABINE': 'CABINE'}
TRIM = set('COMFORTLINE HIGHLINE TRENDLINE EXTREME LIMITED SRV SR SRX STD GL GLS GLX LS LT LTZ EX ELX HLX LX EXL EXS LXL LXS LXR DX SE XL XLS XLT XLE CABINE DUPLA SIMPLES 4X4 4X2 AUT AUT. MEC MEC. GAS GAS. FLEX DIESEL TURBO SPORT ADVENTURE ATTRACTIVE ESSENCE STILE WAY TREKKING ONIBUS ÔNIBUS 4P 2P 3P 5P CD CS'.split())
MULTI = {'GRAND', 'NOVO', 'NOVA', 'SPACE', 'CROSS', 'PALIO', 'GOLF', 'MONTANA', 'CR-V', 'LAND', 'RANGE', 'GRAND'}

def N(s): return ''.join(c for c in unicodedata.normalize('NFD', str(s).upper()) if unicodedata.category(c) != 'Mn')

def anos(t):
    t = t.strip()
    ys = [int(y) for y in re.findall(r'(?:19|20)\d{2}', t)]
    if re.search(r'em diante|>', t, re.I) and ys: return (ys[0], 2026)
    if re.search(r'todos', t, re.I): return (1900, 2026)
    if len(ys) >= 2: return (min(ys), max(ys))
    if len(ys) == 1:
        return (1900, ys[0]) if re.match(r'até', t, re.I) else (ys[0], ys[0])
    return None

def motor_de(m):
    d = re.search(r'\b(\d\.\d)\b', m)
    return d.group(1) if d else ''

def modelo_base(m, mont):
    t = re.split(r'\b\d\.\d\b', m)[0].strip()
    w = [x for x in t.replace('/', ' / ').split() if N(x).strip('.') not in TRIM and x != '/']
    if not w: w = m.split()[:1]
    base = w[0]
    if len(w) > 1 and len(w[0]) <= 2 and re.match(r'^\d', w[1]):   # Scania G 400, R 440
        base = w[0] + ' ' + w[1]
    if len(w) > 1 and (N(w[0]) in MULTI or N(w[1]) in {'WEEKEND', 'FOX', 'CROSS', 'SIENA', 'ROVER', 'PICK-UP', 'PLUS', 'SPORT'}):
        base = ' '.join(w[:2])
    return base.strip(' .,-')

def parse(app):
    out = []
    for bloco in re.split(r'\s;\s', app):
        m = re.match(r'^\s*([A-Z0-9ÀÂÃÉÊÍÓÔÕÚÇ &/.-]{2,}?)\s+-\s+(.*)$', bloco)
        if not m: continue
        mont, resto = m.group(1).strip(), m.group(2)
        toks = [t.strip() for t in resto.split(' · ') if t.strip()]
        cur = None
        for t in toks:
            if YR.match(t) or anos(t) and len(t) < 26 and not re.search(r'[A-Za-z]{4,}', re.sub(r'em diante|até|todos os anos', '', t, flags=re.I)):
                if cur: cur['anos'] = anos(t); out.append(cur); cur = None
                continue
            if cur and (re.match(r'^[\d(]|^\d+V\b', t) or t[:1].islower()):
                cur['mod'] += ' ' + t; continue
            if cur: out.append(cur)
            cur = {'mont': mont, 'mod': t, 'anos': None}
        if cur: out.append(cur)
    return out

def carregar():
    b = pd.read_excel(U + 'BAP Ajuda 2.0/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx', 'PRODUTOS', dtype=str).fillna('')
    e = pd.read_excel(U + 'RELATORIOS/ESTOQUE_BAP.xlsx', dtype=str).fillna('')
    e['E'] = pd.to_numeric(e.ESTOQUE.str.replace(',', '.'), errors='coerce').fillna(0)
    st = e.groupby('COD_PRODUTO').E.sum()
    f = b[(b.PRODUTO == 'Filtros') & (b.STATUS_CADASTRO == 'ATIVO') & (b.APLICACAO != '') & (b.FAMILIA.isin(TIPO))].copy()
    f['EST'] = f.CODIGO_BAP.map(st).fillna(0)
    f = f[f.EST > 0]
    linhas = []
    for _, r in f.iterrows():
        for v in parse(r.APLICACAO):
            linhas.append(dict(cod=r.CODIGO_BAP, tipo=TIPO[r.FAMILIA], linha=r.LINHA, refs=r.REFERENCIAS_CRUZADAS, desc=r.DESCRICAO,
                               mont=v['mont'], mod=v['mod'], base=modelo_base(v['mod'], v['mont']), motor=motor_de(v['mod']), anos=v['anos']))
    return f, pd.DataFrame(linhas)
