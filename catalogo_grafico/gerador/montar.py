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

from detalhe import BASE_UNIFICADA   # base unificada: a fonte única, no Git (T-0019, 20/11: sem estoque)
BASE = pd.read_excel(BASE_UNIFICADA, 'PRODUTOS')
BASE['code'] = BASE.CODIGO_BAP.map(norm)
BASE_D = {r.code: r for r in BASE.itertuples()}
DESC = {c: (str(r.DESCRICAO) if isinstance(r.DESCRICAO, str) else '') for c, r in BASE_D.items()}


def inativo(code):
    """INATIVO no STATUS_CADASTRO ou na descrição da base (regra única: montar e destaques do print_cat)"""
    c = norm(code); b = BASE_D.get(c)
    return (b is not None and 'INATIVO' in str(b.STATUS_CADASTRO).upper()) or 'INATIVO' in DESC.get(c, '').upper()


SPEC = {'Óleo Lubrificante', 'Baterias', 'Fluidos e Químicos', 'Rodas de Aço e Alumínio', 'Cintas e Catracas', 'Pneus e Câmaras de Ar Moto'}

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


VAZIO = ('-', '0', '--', 'N/A')


def ref_cod(c):
    """código da referência sem histórico, sem preço de compra e sem código vazio; '' se não sobrar código"""
    c = re.sub(r'(?i)\s*BAP\s+BOX\b.*$', '', c.split(' | ')[0]).strip()
    return '' if c in VAZIO else c


def refs_sem_vazio(s):
    """referências do catálogo antigo ('Axios 0 · Nakata N370') sem as de código vazio"""
    ps = [p for p in (s or '').split(' · ') if not (re.fullmatch(r'[^\d]+ (\S+)', p) and p.rsplit(' ', 1)[1] in VAZIO)]
    return ' · '.join(ps)


def refs_from_base(s):
    if not isinstance(s, str) or not s.strip(): return ''
    out = []
    for p in re.split(r';\s*', s):
        m = re.match(r'^\s*([^:]+?)\s*:\s*(.+)$', p)
        if m and not re.search(r'(?i)bap|similar|aplica', m.group(1)) and (c := ref_cod(m.group(2))):
            b = m.group(1).strip(); out.append(f"{b.title() if len(b) > 4 else b.upper()} {c}")
    return ' · '.join(out[:6])


def pos_sub(desc):
    d = str(desc).upper()
    p = 'Dianteiro' if 'DIANTEIR' in d else 'Traseiro' if 'TRASEIR' in d else ''
    if not p: return str(desc).strip().capitalize()
    s = ' esq.' if 'ESQUERD' in d else ' dir.' if 'DIREIT' in d else ''
    return p + s


def plain(segs):
    return re.sub(r'\s+', ' ', ''.join(t for t, b in segs)).strip()


# ---------------------------------------------------------------- itens do catálogo
rows_by_line = collections.defaultdict(list); sem_linha = []
# 1) todos os itens do catálogo digital atual permanecem
for code, r in cat_row.items():
    rows_by_line[taxo.line_of(code, DESC.get(code, ''), cat_line[code])].append(dict(r, refs=refs_sem_vazio(r.get('refs'))))
# 2) itens da base unificada que ainda não estão no catálogo (fora: INATIVO). Linha = coluna PRODUTO da base.
#    Sem o arquivo de estoque (T-0019, 20/11): STATUS_CADASTRO da base diz se o item é ATIVO (tag NOVO, como antes)
#    ou se entrou só pelo cadastro (sem_estoque: fica fora do "Leve também", como antes).
SEM_ESTOQUE, novos = [], []


def _em_diante(app):
    """'2011/...' -> '2011>' ; '06/...' -> '2006>' (ano com 4 dígitos, '>' = em diante)"""
    if not isinstance(app, str): return app
    app = re.sub(r'\b((?:19|20)\d{2})\s*/\s*\.{2,}', r'\1>', app)
    return re.sub(r'(?<![\d/])(\d{2})\s*/\s*\.{2,}', lambda m: ('20' if int(m.group(1)) <= 30 else '19') + m.group(1) + '>', app)


_ja = {norm(r['code']) for rs in rows_by_line.values() for r in rs}
_linhas = {l[0] for l in LINES}
for b in BASE.itertuples():
    code = b.code
    st = str(b.STATUS_CADASTRO).upper()
    if code in _ja or inativo(code): continue
    line = b.PRODUTO if b.PRODUTO in _linhas else taxo.line_of(code, DESC.get(code, ''), None)
    if line is None: sem_linha.append((b.CODIGO_BAP, b.DESCRICAO)); continue
    ativo = st == 'ATIVO'
    r = dict(code=str(b.CODIGO_BAP).strip(), nov=ativo, sub=pos_sub(b.DESCRICAO), segs=segs_from_base(_em_diante(b.APLICACAO)),
             refs=refs_from_base(b.REFERENCIAS_CRUZADAS))
    if not ativo: r['sem_estoque'] = True
    if line in SPEC:
        r['segs'] = [[str(b.DESCRICAO).strip().capitalize(), False]]; r['sub'] = ''
    rows_by_line[line].append(r); _ja.add(code)
    (novos if ativo else SEM_ESTOQUE).append((r['code'], line))

fams = []
for name, *_ in sorted(LINES, key=lambda l: ORDER_SIS.index(l[2])):
    rows = sorted(rows_by_line.get(name, []), key=lambda r: r['code'])
    if not rows: continue
    m = META[name]
    fam_set = {taxo.familia_of(name, DESC.get(norm(r['code']), '')) for r in rows}
    eyebrow = m['sistema'] + (' · ' + next(iter(fam_set)) if len(fam_set) == 1 else '')
    fams.append(dict(name=name, group=m['sistema'], eyebrow=eyebrow, desc=m['desc'], count=len(rows), lanc=m['lanc'],
                     img=old_img.get(name), spec=name in SPEC, rows=rows))

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


if __name__ == '__main__':
    print('linhas do catálogo', len(fams), '| itens', sum(f['count'] for f in fams), '| novos (ATIVO) no catálogo', len(novos),
          '| só do cadastro', len(SEM_ESTOQUE), '| sem linha', len(sem_linha))
    print(collections.Counter(l for _, l in novos))
    print(sem_linha[:20])
