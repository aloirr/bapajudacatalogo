import re, json, html, collections
import pandas as pd
import digital2 as D2
import datas, taxo
from taxo import norm, META, LINES, ORDER_SIS

# ---------------------------------------------------------------- fontes
old = D2.fams                                   # catálogo digital atual (já com os interruptores pneumáticos movidos)
cat_row, cat_line, old_img = {}, {}, {}
for f in old:
    old_img[f['name']] = f['img']
    for r in f['rows']:
        cat_row[norm(r['code'])] = r; cat_line[norm(r['code'])] = f['name']
old_img['Catraca de Freio'] = 'dimg/catraca.png'
old_img['Interruptores de Pressão do Óleo'] = None
old_img['Interruptores e Sensores Elétricos'] = None

e = pd.read_excel('entradas/ESTOQUE_BAP.xlsx'); e['code'] = e.COD_PRODUTO.map(norm)
STK = e.groupby('code').agg(est=('ESTOQUE', 'sum'), desc=('DESCRICAO_PRODUTO', 'first'), cod=('COD_PRODUTO', 'first'),
                            forn=('FORNECEDOR', 'first'), cod_forn=('COD_FORNECEDOR', 'first'), cat_atual=('CATEGORIA', 'first'))
BASE = pd.read_excel('entradas/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx', 'PRODUTOS')
BASE['code'] = BASE.CODIGO_BAP.map(norm)
BASE_D = {r.code: r for r in BASE.itertuples()}

BR_SHORT = {'VOLKSWAGEN': 'VW', 'CHEVROLET': 'GM', 'GENERAL MOTORS': 'GM', 'MERCEDES-BENZ': 'MB', 'MERCEDES BENZ': 'MB',
            'CITROEN': 'CITROËN', 'KIA MOTORS': 'KIA'}


BRANDS_RX = r'(VOLKSWAGEN|FORD|NISSAN|CHEVROLET|FIAT|RENAULT|TOYOTA|HONDA|HYUNDAI|PEUGEOT|CITRO[EË]N|JEEP|KIA MOTORS|KIA|MITSUBISHI|MERCEDES[ -]BENZ|LAND ROVER|AUDI|BMW|VOLVO|SCANIA|IVECO|AGRALE|JAC|CHERY|SUZUKI|DODGE|RAM|TROLLER|INTERNATIONAL|GM)'
KEEPU = {'GM', 'VW', 'MB', 'AUT.', 'MEC.', 'GSI', 'ELX', 'HLX', 'ESP', 'TDI', 'GTI', 'TSI', 'MPI', 'GNV', 'SW4', 'CRV', 'HRV', 'GLS', 'GLX', 'XLS', 'XLT', 'LTZ', 'ABS'}


def tcase(t):
    out = []
    for w in t.split(' '):
        if w.isalpha() and w.isupper() and len(w) >= 3 and w not in KEEPU and w not in ('III','VII'): out.append(w.capitalize())
        elif w in ('DE', 'EM', 'E', 'COM', 'SEM'): out.append(w.lower())
        else: out.append(w)
    return ' '.join(out)


def segs_from_vehicle_list(app):
    t = re.sub(r'\s+', ' ', app).strip()
    t = re.sub(r'(?i)\s*-?\s*\bde\s+(\d{4})\s+at[ée]\s+(\d{4})', r' \1–\2', t)
    t = re.sub(r'\s*-\s*(\d{4})\s+AT[ÉE]\s+(\d{4})', r' \1–\2', t)
    t = re.sub(r'\s*-?\s*(\d{4})\s+EM\s+DIANTE', r' \1>', t)
    chunks = [c.strip() for c in re.split(r'\s(?=' + BRANDS_RX + r'\b)', ' ' + t) if c and c.strip() and not re.fullmatch(BRANDS_RX, c.strip())]
    blocks = []
    for ch in re.finditer(BRANDS_RX + r'\b\s*(.*?)(?=\s' + BRANDS_RX + r'\b|$)', t):
        b = ch.group(1).upper().replace('MERCEDES BENZ', 'MERCEDES-BENZ'); b = BR_SHORT.get(b, b)
        rest = tcase(ch.group(2).strip(' -'))
        if blocks and blocks[-1][0] == b: blocks[-1][1].append(rest)
        else: blocks.append([b, [rest]])
    segs = []
    for k, (b, rs) in enumerate(blocks):
        if k: segs.append([' · ', False])
        segs += [[b, True], [' ' + '; '.join(x for x in rs if x), False]]
    return segs


def segs_from_base(app):
    if isinstance(app, str) and ';' not in app and len(re.findall(BRANDS_RX + r'\b', app)) >= 1 and re.search(r'AT[ÉE] \d{4}|EM DIANTE', app):
        return segs_from_vehicle_list(app)
    """'FIAT - Palio 2010 ; VOLKSWAGEN - Gol' -> segmentos [('FIAT',True),(' Palio 2010',False),(' · ',False),...]"""
    if not isinstance(app, str) or not app.strip(): return []
    app = re.split(r'\|\s*DETALHE:', app)[0]
    segs = []
    for k, blk in enumerate([b.strip() for b in re.split(r'\s;\s|;\s(?=[A-ZÀ-Ü])', app) if b.strip()]):
        if k: segs.append([' · ', False])
        m = re.match(r'^([A-ZÀ-Ü][A-ZÀ-Ü /\-]{1,30}?)\s+-\s+(.*)$', blk)
        if m:
            b = m.group(1).strip(); segs += [[BR_SHORT.get(b, b), True], [' ' + m.group(2).strip(), False]]
        else:
            segs.append([blk, False])
    return segs


def refs_from_base(s):
    if not isinstance(s, str) or not s.strip(): return ''
    out = []
    for p in re.split(r';\s*', s):
        m = re.match(r'^\s*([^:]+?)\s*:\s*(.+)$', p)
        if m and not re.search(r'(?i)bap|similar|aplica', m.group(1)):
            b = m.group(1).strip(); out.append(f"{b.title() if len(b) > 4 else b.upper()} {m.group(2).strip()}")
    return ' · '.join(out[:6])


def pos_sub(desc):
    d = str(desc).upper()
    p = 'Dianteiro' if 'DIANTEIR' in d else 'Traseiro' if 'TRASEIR' in d else ''
    if not p: return str(desc).strip().capitalize()
    s = ' esq.' if 'ESQUERD' in d else ' dir.' if 'DIREIT' in d else ''
    return p + s


def plain(segs):
    return re.sub(r'\s+', ' ', ''.join(t for t, b in segs)).strip()


# ---------------------------------------------------------------- itens do catálogo (estoque atual)
rows_by_line = collections.defaultdict(list); novos, sem_linha, sairam = [], [], []
# 1) todos os itens do catálogo digital atual permanecem (inclusive as cuícas sem estoque, pedidas por completo)
for code, r in cat_row.items():
    desc = STK.loc[code, 'desc'] if code in STK.index else ''
    rows_by_line[taxo.line_of(code, desc, cat_line[code])].append(dict(r))
# 2) itens novos com estoque que ainda não estavam no catálogo
for code, s in STK.iterrows():
    if code in cat_row: continue
    if s.est <= 0 or 'INATIVO' in str(s.desc).upper(): continue
    line = taxo.line_of(code, s.desc, cat_line.get(code))
    if line is None: sem_linha.append((s.cod, s.desc)); continue
    if True:
        b = BASE_D.get(code)
        r = dict(code=str(s.cod), nov=True, sub=pos_sub(s.desc), segs=segs_from_base(b.APLICACAO) if b is not None else [],
                 refs=refs_from_base(b.REFERENCIAS_CRUZADAS) if b is not None else '')
        if line in ('Óleo Lubrificante', 'Baterias', 'Fluidos e Químicos', 'Rodas de Aço e Alumínio', 'Cintas e Catracas', 'Pneus e Câmaras de Ar Moto'):
            r['segs'] = [[str(s.desc).strip().capitalize(), False]]; r['sub'] = ''
        novos.append((s.cod, line))
    rows_by_line[line].append(r)
# 3) itens da base unificada (versão mais alta em saidas/) que não têm estoque mas estão no cadastro:
#    entram no catálogo também (Alexandre, 27/10: "todos os produtos que não tiverem estoque mas tiverem no
#    catálogo devem aparecer"). Fora: INATIVO. Linha = coluna PRODUTO da base.
import glob as _glob
SEM_ESTOQUE = []


def _em_diante(app):
    """'2011/...' -> '2011>' ; '06/...' -> '2006>' (ano com 4 dígitos, '>' = em diante)"""
    if not isinstance(app, str): return app
    app = re.sub(r'\b((?:19|20)\d{2})\s*/\s*\.{2,}', r'\1>', app)
    return re.sub(r'(?<![\d/])(\d{2})\s*/\s*\.{2,}', lambda m: ('20' if int(m.group(1)) <= 30 else '19') + m.group(1) + '>', app)
_bases = sorted(_glob.glob('saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v*.xlsx'), key=lambda p: int(re.search(r'_v(\d+)\.xlsx$', p).group(1)))
if _bases:
    _BU = pd.read_excel(_bases[-1], 'PRODUTOS')
    _ja = {norm(r['code']) for rs in rows_by_line.values() for r in rs}
    _linhas = {l[0] for l in LINES}
    for b in _BU.itertuples():
        code = norm(b.CODIGO_BAP)
        if code in _ja or 'INATIVO' in str(b.STATUS_CADASTRO).upper(): continue
        if code in STK.index and STK.loc[code, 'est'] > 0: continue      # com estoque já entrou no passo 2
        line = b.PRODUTO if b.PRODUTO in _linhas else taxo.line_of(code, str(b.DESCRICAO), None)
        if line is None: sem_linha.append((b.CODIGO_BAP, b.DESCRICAO)); continue
        r = dict(code=str(b.CODIGO_BAP).strip(), nov=False, sub=pos_sub(b.DESCRICAO), segs=segs_from_base(_em_diante(b.APLICACAO)),
                 refs=refs_from_base(b.REFERENCIAS_CRUZADAS), sem_estoque=True)
        if line in ('Óleo Lubrificante', 'Baterias', 'Fluidos e Químicos', 'Rodas de Aço e Alumínio', 'Cintas e Catracas', 'Pneus e Câmaras de Ar Moto'):
            r['segs'] = [[str(b.DESCRICAO).strip().capitalize(), False]]; r['sub'] = ''
        rows_by_line[line].append(r); _ja.add(code); SEM_ESTOQUE.append((r['code'], line))
sairam = [c for c in cat_row if c not in STK.index or STK.loc[c, 'est'] <= 0]

SPEC = {'Óleo Lubrificante', 'Baterias', 'Fluidos e Químicos', 'Rodas de Aço e Alumínio', 'Cintas e Catracas', 'Pneus e Câmaras de Ar Moto'}
fams = []
for name, *_ in sorted(LINES, key=lambda l: ORDER_SIS.index(l[2])):
    rows = sorted(rows_by_line.get(name, []), key=lambda r: r['code'])
    if not rows: continue
    m = META[name]
    fam_set = {taxo.familia_of(name, STK.loc[norm(r['code']), 'desc'] if norm(r['code']) in STK.index else '') for r in rows}
    eyebrow = m['sistema'] + (' · ' + next(iter(fam_set)) if len(fam_set) == 1 else '')
    fams.append(dict(name=name, group=m['sistema'], eyebrow=eyebrow, desc=m['desc'], count=len(rows), lanc=m['lanc'],
                     img=old_img.get(name), spec=name in SPEC, rows=rows))

# ---------------------------------------------------------------- base unificada v8 (todos os códigos)
APP_CAT = {}
for f in fams:
    for r in f['rows']:
        APP_CAT[norm(r['code'])] = (f['name'], r)


def app_base_fmt(segs):
    """segmentos do catálogo (datas já padronizadas) -> 'MONTADORA - modelos ; MONTADORA - modelos'"""
    t = ''.join(('\x01' + x + '\x02') if b else x for x, b in segs)
    t = datas.fix_text(re.sub(r'\s+', ' ', t).strip())
    blocks = re.split(r'\s·\s(?=\x01)', t)
    out = []
    for bl in blocks:
        bl = bl.strip()
        m = re.match(r'^\x01(.*?)\x02\s*(.*)$', bl)
        out.append(f'{m.group(1)} - {m.group(2)}' if m else bl.replace('\x01', '').replace('\x02', ''))
    return ' ; '.join(out).replace('\x01', '').replace('\x02', '')


base_codes = set(BASE.code)
fontes = [(r.code, r) for r in BASE.itertuples()] + [(c, None) for c in STK.index if c not in base_codes]
recs = []
for c, b in fontes:
    s = STK.loc[c] if c in STK.index else None
    desc = (str(b.DESCRICAO) if b is not None and isinstance(b.DESCRICAO, str) else str(s.desc) if s is not None else '')
    sdesc = str(s.desc) if s is not None else desc
    inativo = 'INATIVO' in sdesc.upper()
    if c in APP_CAT:
        line, r = APP_CAT[c]
        app = app_base_fmt(r['segs']) if (r['segs'] and line not in SPEC) else (b.APLICACAO if b is not None else '')
        refs_src = 'CATÁLOGO DIGITAL'
    else:
        line = taxo.line_of(c, sdesc if s is not None else desc, None)
        app = b.APLICACAO if b is not None else ''
        refs_src = 'BASE v7'
    if isinstance(app, float): app = ''
    if line is None:
        categoria, sistema, familia, linha, produto = 'OUTROS', 'OUTROS', 'OUTROS', '', 'Outros'
    else:
        m = META[line]; produto = line
        categoria, sistema = m['categoria'], m['sistema']
        familia = taxo.familia_of(line, sdesc)
        linha = taxo.linha_of(line, sdesc, app, s.cat_atual if s is not None else '')
    recs.append(dict(
        CODIGO_BAP=(b.CODIGO_BAP if b is not None else s.cod),
        DESCRICAO=desc,
        PRODUTO=produto, CATEGORIA=categoria, SISTEMA=sistema, FAMILIA=familia, LINHA=linha if not inativo else (linha or ''),
        APLICACAO=app,
        REFERENCIAS_CRUZADAS=(b.REFERENCIAS_CRUZADAS if b is not None else ''),
        DADOS_ADICIONAIS=(b.DADOS_ADICIONAIS if b is not None else ''),
        CATEGORIA_ANTIGA_ESTOQUE=(s.cat_atual if s is not None else ''),
        ESTOQUE_TOTAL=(int(s.est) if s is not None else None),
        NO_CATALOGO_DIGITAL='SIM' if c in APP_CAT else 'NÃO',
        STATUS='INATIVO' if inativo else ('ATIVO' if s is not None else 'FORA DO ESTOQUE'),
    ))
BASE8 = pd.DataFrame(recs)
BASE8 = BASE8[BASE8.CODIGO_BAP.astype(str).str.strip() != 'BAP PN']

if __name__ == '__main__':
    print('linhas do catálogo', len(fams), '| itens', sum(f['count'] for f in fams), '| novos no catálogo', len(novos),
          '| saíram do estoque', len(sairam), '| sem linha (estoque)', len(sem_linha))
    print(collections.Counter(l for _, l in novos))
    print(sem_linha[:20])
    print(BASE8.groupby(['SISTEMA']).size().to_string())
    print(BASE8[BASE8.STATUS == 'ATIVO'].groupby(['SISTEMA', 'LINHA']).size().to_string())
