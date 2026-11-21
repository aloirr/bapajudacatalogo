import re, json, html, collections
import pandas as pd
import digital2 as D2
import datas, taxo
from taxo import norm, META, LINES, ORDER_SIS
from site_regras import G          # regra das referências do site (RD-0193): refs_de do scripts/gerar_site.py, sem cópia

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


def ref_lista(s, codigo=''):
    """referências da base [(marca, código)] pela regra do site (gerar_site.refs_de): separa por ";" e por ",", tira o
    histórico "| ANTERIOR", o preço de compra, o código vazio, o prefixo "CROSS REFERENCES - " e o " PN" da marca.
    Trecho sem marca só fica se for código (palavras com número, separadas por " / ": "REFERENCIAS CRUZADAS: SK132S"
    -> ('', 'SK132S'), "W8BC / W7BC"); nota de cadastro e pedaço de marca ("SKF" de "SKF / PERFEC PN: ...") ficam fora.
    O "#N/A" sai no refs_de (código vazio); a aplicação saiu de dentro das referências na v19 da base (RD-0193)."""
    if not isinstance(s, str) or not s.strip(): return []
    out = []
    for x in G.refs_de(s, str(codigo or '')):
        c = x['c']
        if c and (x['m'] or re.fullmatch(r'[\w.\-]*\d[\w.\-]*(?:\s*/\s*[\w.\-]*\d[\w.\-]*)*', c)):
            out.append((x['m'], c))
    return out


def ref_txt(m, c, marca=lambda m: m.title() if len(m) > 4 else m.upper()):
    """('NAKATA', 'N370') -> 'Nakata N370' ; ('', 'SK132S') -> 'SK132S'"""
    return (marca(m) + ' ' + c) if m else c


def refs_pela_regra(s):
    """referências já escritas ('Axios 0 · Autoimpact TR10 · Nakata N370': catálogo antigo, site de 12/11, Fraga de 13/11)
    sem as que o refs_de tira pela marca ou pelo código: código vazio, marca própria e fornecedor (G.FORNECEDORES). A
    AUTOIMPACT é concorrência (G.CONCORRENTES_SO_NA_REF, T-0017): fica, por último (concorrente_por_ultimo). 'Marca Código'
    vira 'Marca: Código' para o refs_de; o resto fica como está."""
    ps = [p for p in (s or '').split(' · ') if not ((m := re.fullmatch(r'([^\d]+) (\S+)', p)) and not ref_lista(f'{m[1]}: {m[2]}'))]
    return ' · '.join(concorrente_por_ultimo(ps))


def e_ref_concorrente(p):
    """'Autoimpact PA14', 'Auto Impact TR 10' -> True: as primeiras palavras, antes do código, são uma marca da
    concorrência pelo G.e_concorrente (a mesma regra do refs_de do site, sem cópia); 'SK132S' -> False"""
    ws = p.split()
    return any(G.e_concorrente(' '.join(ws[:k])) for k in range(1, len(ws)))


def concorrente_por_ultimo(ps):
    """referências já escritas ('Marca Código'): a da concorrência (e_ref_concorrente) vai para o fim, para a Bosch e a
    Tecfil ficarem à vista (T-0017, "1 a"); o sort é estável: a ordem fica entre elas e entre as outras"""
    return sorted(ps, key=e_ref_concorrente)


def refs_from_base(s, codigo=''):
    """até 10 referências, sem repetida: com a vírgula separada, cabem as que antes iam juntas nos 6 trechos entre ";"
    (com 6, 58 referências que o main mostra sairiam de 35 itens) [SUPOSIÇÃO]. A concorrência já vem por último do
    refs_de e o refs_unicas a mantém lá: o corte das 10 tira ela primeiro."""
    out = [ref_txt(m, c) for m, c in ref_lista(s, codigo) if not re.search(r'(?i)bap|similar|aplica|descri', m)]
    return ' · '.join(refs_unicas(' · '.join(out)).split(' · ')[:10])


def refs_unicas(s):
    """'Axios 1443 · Kit & Cia 10285 · Axios 1443' -> 'Axios 1443 · Kit & Cia 10285': cada referência uma vez, na ordem
    da 1ª (RD-0194), com a concorrência por último (concorrente_por_ultimo). Igual = mesma marca e código sem espaço,
    pontuação e acento (gerar_site.so_codigo)."""
    vistos, out = set(), []
    for p in (s or '').split(' · '):
        k = G.so_codigo(p)
        if k and k in vistos: continue
        vistos.add(k); out.append(p)
    return ' · '.join(concorrente_por_ultimo(out))


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
    rows_by_line[taxo.line_of(code, DESC.get(code, ''), cat_line[code])].append(dict(r, refs=refs_pela_regra(r.get('refs'))))
# 2) itens da base unificada que ainda não estão no catálogo (fora: INATIVO). Linha = coluna PRODUTO da base.
#    Sem o arquivo de estoque (T-0019, 20/11): STATUS_CADASTRO da base diz se o item é ATIVO (tag NOVO, como antes)
#    ou se entrou só pelo cadastro (sem_estoque: fica fora do "Leve também", como antes).
SEM_ESTOQUE, novos = [], []


def _em_diante(app):
    """'2011/...' -> '2011>' ; '06/...' -> '2006>' (ano com 4 dígitos, '>' = em diante)"""
    if not isinstance(app, str): return app
    app = re.sub(r'\b(' + datas.Y + r')\s*/\s*\.{2,}', r'\1>', app)
    return re.sub(r'(?<![\d/])(\d{2})\s*/\s*\.{2,}', lambda m: str(datas.yy(m.group(1))) + '>', app)


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
             refs=refs_from_base(b.REFERENCIAS_CRUZADAS, b.CODIGO_BAP))
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
