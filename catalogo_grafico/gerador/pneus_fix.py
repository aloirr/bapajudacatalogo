import re, html
import pandas as pd
import montar as M, digital2 as D2
V8U = 'entradas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx'
P = pd.read_excel(V8U, 'PRODUTOS')
p = P[P.PRODUTO == 'Pneus e Câmaras de Ar Moto'].drop_duplicates('CODIGO_BAP')
BR = r'(HONDA|YAMAHA|SUZUKI|DAFRA|SHINERAY|BULL|MVK|KAWASAKI|HAOJUE|TRAXX|KASINSKI|SUNDOWN|BMW|TRIUMPH|KTM|ROYAL ENFIELD|JTZ|AVELLOZ)'


def segs_moto(app):
    t = re.sub(r'\s+', ' ', str(app)).strip()
    t = re.sub(r'\s-\s(?=' + BR + r':)', ' · ', t)
    segs = []; last = 0
    for m in re.finditer(r'\b' + BR + r':\s*', t):
        if m.start() > last: segs.append([t[last:m.start()], False])
        segs.append([m.group(1), True]); segs.append([' ', False]); last = m.end()
    segs.append([t[last:], False])
    return [s for s in segs if s[0]]


def refs_moto(r):
    if not isinstance(r, str) or not r.strip(): return '—'
    out = []
    for part in re.split(r',\s*(?=[A-Z][A-Z ]+:)', r):
        m = re.match(r'\s*([^:]+):\s*(.+)', part)
        if m: out.append(m.group(1).strip().title().replace('Camara', 'Câmara') + ' ' + m.group(2).strip())
    return ' · '.join(out) or '—'


def sub_moto(desc):
    d = re.sub(r'\s*-\s*CONFIRMAR MEDIDA', '', str(desc), flags=re.I).strip()
    d = d.replace('PNEU PARA MOTOCICLETA ', 'Pneu ').replace('CÂMARA DE AR PARA MOTOCICLETA ', 'Câmara ')
    return d[:1] + d[1:].lower().replace('tt/tbl', 'TT/TBL')


rows = []
nov_old = {r['code']: r.get('nov', False) for f in M.fams if f['name'] == 'Pneus e Câmaras de Ar Moto' for r in f['rows']}
for r in p.itertuples():
    code = str(r.CODIGO_BAP).strip()
    rows.append(dict(code=code, nov=nov_old.get(code, False), sub=sub_moto(r.DESCRICAO), segs=segs_moto(r.APLICACAO),
                     refs=refs_moto(r.REFERENCIAS_CRUZADAS)))
rows.sort(key=lambda r: r['code'])
# ---- coluna "Câmara indicada"
cam_raiada = {}
for r in p.itertuples():
    code = str(r.CODIGO_BAP).strip(); app = str(r.APLICACAO)
    if not code.startswith('CA'): continue
    m = re.search(r'sem câmara\s+(.*?)\s+(?:quando montad\w*\s+)?em roda raiada', app, flags=re.I)
    if m:
        for size, suf in re.findall(r'(\d{2,3}/\d{2,3}-\d{2})\s+(V\d{3}[FR])', m.group(1)):
            cam_raiada[(size, suf)] = code
pneu_codes = [r['code'] for r in rows if not r['code'].startswith('CA')]
tubeless = {r['code'] for r in rows if not r['code'].startswith('CA') and 'Sem Câmara' in ''.join(x for x, b in r['segs'])}


def pneus_da_camara(txt):
    out = []
    for size, suf in re.findall(r'(\d[\d./]*-\d{2})\s+(?:\d{2,3}[A-Z]\s+)?(V\d{3}[A-Z]?)\b', txt):
        for c in pneu_codes:
            if c.startswith(size + ' ') and c.endswith(suf) and c not in out: out.append(c)
    return out


for r in rows:
    code = r['code']
    t = ''.join(x for x, b in r['segs'])
    if code.startswith('CA'):
        m = re.search(r'pneus BAP:\s*(.*?)(?=\s·\s(?:DIANTEIRO|TRASEIRO)|$)', t)
        r['extra'] = ' · '.join(c + (' (roda raiada)' if c in tubeless else '') for c in pneus_da_camara(m.group(1))) if m else ''
        r['extra'] = r['extra'] or '—'
        if m:
            r['segs'] = [[x.replace(' · pneus BAP: ' + m.group(1), '').replace('pneus BAP: ' + m.group(1), ''), b] for x, b in r['segs']]
        continue
    m = re.search(r'\(câmara BAP ([^)]+)\)', t)
    if m:
        r['extra'] = m.group(1).replace(' / ', ' · ').strip()
        r['segs'] = [[x.replace(' ' + m.group(0), '').replace(m.group(0), '').replace('Uso Com Câmara', 'Uso com câmara'), b] for x, b in r['segs']]
    else:
        size = code.split()[0]; suf = code.split()[-1]
        c = cam_raiada.get((size, suf))
        r['extra'] = f'{c} (só em roda raiada)' if c else '—'
        r['segs'] = [[x.replace('Uso Sem Câmara', 'Uso sem câmara'), b] for x, b in r['segs']]
for f in M.fams:
    if f['name'] == 'Pneus e Câmaras de Ar Moto':
        f['rows'] = rows; f['spec'] = False; f['count'] = len(rows); f['extra_col'] = 'LEVE TAMBÉM'
D2.fams = M.fams
if __name__ == '__main__':
    D2.build('digital_v4.pdf')
    import pymupdf
    d = pymupdf.open('digital_v4.pdf'); print('páginas', len(d))
    pg = [i for i, x in enumerate(d) if 'Pneus e Câmaras de Ar Moto' in x.get_text() and 'APLICAÇÃO' in x.get_text()]
    cov = [i for i, x in enumerate(d) if 'Pneus e Câmaras de Ar Moto' in x.get_text() and 'ITENS NESTA LINHA' in x.get_text()]
    print('capa', [i + 1 for i in cov], 'tabela', [i + 1 for i in pg])
