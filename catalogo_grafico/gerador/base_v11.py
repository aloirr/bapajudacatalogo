"""Base unificada v11 (23/10/2026) a partir da v10 — conforme o catálogo:
- DETALHE_CATALOGO com o detalhe novo (informação essencial da descrição: haste, kit parcial/completo, catraca...).
- Colunas novas no fim de PRODUTOS: DIFERENCIAL (selo do catálogo, ex.: c/ ABS), ITEM_PARECIDO (código parecido e o que
  muda nele, ex.: AMT7014 c/ ABS) e OFERECA_JUNTO (o mesmo do catálogo). As 5 primeiras colunas não mudam.
Uso (dentro de gerador/):  python base_v11.py [v10.xlsx] [saida.xlsx]
"""
import sys, collections
from copy import copy
import openpyxl
import moto

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v11.xlsx'

CAT = {}
for f in moto.FAMS:
    if f.get('moto'):
        continue
    for r in f['rows']:
        tw = [(c, v) for c, v in sorted((r.get('gemeos') or {}).items()) if v]
        CAT[r['code'].strip().upper()] = dict(
            spec=bool(f.get('spec')), sub=r.get('sub') or '', dif=r.get('dif') or '',
            par=' · '.join(f"{c} {'/'.join(v)}" for c, v in tw[:3]) if r.get('dif') else '',
            oj=r.get('extra') if r.get('extra') not in (None, '', '—') else '')

wb = openpyxl.load_workbook(ENTRADA)
ws = wb['PRODUTOS']
H = {c.value: i + 1 for i, c in enumerate(ws[1])}
ncol = ws.max_column
NOVAS = ['DIFERENCIAL', 'ITEM_PARECIDO', 'OFERECA_JUNTO']
for k, nome in enumerate(NOVAS):
    cel = ws.cell(1, ncol + 1 + k, nome); src = ws.cell(1, ncol)
    cel.font = copy(src.font); cel.fill = copy(src.fill); cel.alignment = copy(src.alignment); cel.border = copy(src.border)
    ws.column_dimensions[openpyxl.utils.get_column_letter(ncol + 1 + k)].width = [18, 34, 30][k]
H.update({n: ncol + 1 + k for k, n in enumerate(NOVAS)})
cnt = collections.Counter()
for r in range(2, ws.max_row + 1):
    c = str(ws.cell(r, H['CODIGO_BAP']).value or '').strip().upper()
    d = CAT.get(c)
    if not d:
        continue
    if not d['spec']:
        old = ws.cell(r, H['DETALHE_CATALOGO']).value or ''
        new = d['sub'] if d['sub'] not in ('', '—') else old
        if new != old:
            ws.cell(r, H['DETALHE_CATALOGO']).value = new; cnt['detalhe'] += 1
    if d['dif']: ws.cell(r, H['DIFERENCIAL']).value = d['dif']; cnt['dif'] += 1
    if d['par']: ws.cell(r, H['ITEM_PARECIDO']).value = d['par']; cnt['par'] += 1
    if d['oj']: ws.cell(r, H['OFERECA_JUNTO']).value = d['oj']; cnt['oj'] += 1

wl = wb['LOG_CORRECOES']
wl.append(('DETALHE_COMPLETADO', 'PRODUTOS', f"{cnt['detalhe']} códigos", 'Auditoria da descrição (23/10)', 'DETALHE_CATALOGO com a informação essencial da descrição (haste, kit parcial/completo, catraca, medida da bucha...)'))
wl.append(('COLUNAS_NOVAS', 'PRODUTOS', 'DIFERENCIAL, ITEM_PARECIDO, OFERECA_JUNTO', 'Pedido do Alexandre (23/10)', 'No fim da aba; as 5 primeiras colunas não mudam'))
wr = wb['LEIA-ME']
wr.insert_rows(1, 6)
txt = [
    ('BASE BAP UNIFICADA v11 (23/10/2026) — conforme o Catálogo BAP 2026', None),
    ('DIFERENCIAL', f"{cnt['dif']} itens têm um item parecido (mesma linha e mesmo veículo) e o selo diz o que os separa, ex.: AMT7014 c/ ABS × AMT7500 s/ ABS. É o selo que o catálogo mostra ao lado do código."),
    ('ITEM_PARECIDO', 'O código parecido e o que muda nele (ex.: na linha do AMT7500: AMT7014 c/ ABS). Use para o vendedor confirmar a versão do veículo.'),
    ('OFERECA_JUNTO', f"{cnt['oj']} itens: o mesmo \"Ofereça junto\" do catálogo (par pelo mesmo veículo, ou sugestão fixa da linha)."),
    ('DETALHE_CATALOGO', f"{cnt['detalhe']} detalhes completados com informação essencial da descrição (ex.: sapata c/ ou s/ haste, kit batente parcial ou completo)."),
    (None, None),
]
for i, (a, b) in enumerate(txt, start=1):
    wr.cell(i, 1, a); wr.cell(i, 2, b)
wb.save(SAIDA)
print(dict(cnt), SAIDA)
