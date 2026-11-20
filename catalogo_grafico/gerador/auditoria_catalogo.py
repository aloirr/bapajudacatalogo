"""Auditoria do catálogo (23/10/2026): itens parecidos, descrição × catálogo, conflitos de cadastro,
referência cruzada repetida e OFEREÇA JUNTO. Saída: saidas/Auditoria_Catalogo_BAP_23102026.xlsx"""
import re, collections, html, sys
import pandas as pd
import moto, detalhe as DT, oferta as OF, diferencial as DF
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

SAIDA = sys.argv[1] if len(sys.argv) > 1 else 'saidas/Auditoria_Catalogo_BAP_23102026.xlsx'
U = DF.U
B, E = DT._base10(), DT._desc()
fams = [f for f in moto.FAMS if not f.get('moto')]
ROW = {}
for f in fams:
    for r in f['rows']:
        ROW[r['code'].strip().upper()] = (f, r)


def app(r, n=220):
    t = ''.join(x for x, b in r.get('segs') or [])
    return t if len(t) <= n else t[:n] + '…'


def desc(c):
    return B.get(c, {}).get('DESCRICAO', '')


def est(c):
    return str(E.get(c) or E.get(c.upper()) or '')


# 1) itens com selo
sel = []
for f in fams:
    for r in f['rows']:
        if r.get('dif'):
            c = r['code'].strip().upper()
            tw = [(k, v) for k, v in sorted(r['gemeos'].items()) if v]
            sel.append(dict(LINHA=f['name'], CODIGO=c, SELO_NO_CATALOGO=r['dif'],
                            PARECIDO_E_O_QUE_MUDA=' · '.join(f"{k} {'/'.join(v)}" for k, v in tw[:4]),
                            DETALHE=r.get('sub', ''), APLICACAO=app(r), DESCRICAO_CADASTRO=desc(c)))

# 2) parecidos sem diferença
def toks(t):
    return set(w for w in re.findall(r'[A-Z0-9]+', U(t)) if len(w) > 1)


pares, vistos = [], set()
for f in fams:
    for r in f['rows']:
        a = r['code'].strip().upper()
        for b, veic in r.get('sem_dif') or []:
            k = tuple(sorted((a, b)))
            if k in vistos or b not in ROW: continue
            vistos.add(k)
            rb = ROW[b][1]
            ta, tb = toks(app(r, 10000)), toks(app(rb, 10000))
            sim = len(ta & tb) / max(1, len(ta | tb))
            pares.append(dict(LINHA=f['name'], CODIGO_A=k[0], CODIGO_B=k[1], VEICULO_EM_COMUM=veic.title(),
                              SEMELHANCA_APLICACAO=round(sim, 2),
                              PRIORIDADE='ALTA' if sim >= .6 else ('MÉDIA' if sim >= .35 else 'BAIXA'),
                              DETALHE_A=ROW[k[0]][1].get('sub', ''), DETALHE_B=ROW[k[1]][1].get('sub', ''),
                              APLICACAO_A=app(ROW[k[0]][1]), APLICACAO_B=app(ROW[k[1]][1]),
                              DESCRICAO_ESTOQUE_A=est(k[0]), DESCRICAO_ESTOQUE_B=est(k[1]),
                              EQUIVALE_A_A=ROW[k[0]][1].get('refs', ''), EQUIVALE_A_B=ROW[k[1]][1].get('refs', ''),
                              O_QUE_FAZER='Confirmar no fornecedor o que separa os dois (versão, motor, ano, ABS, câmbio) e completar a aplicação'))
pares.sort(key=lambda x: (-x['SEMELHANCA_APLICACAO'], x['LINHA']))

# 3) descrição que passou a aparecer no catálogo
ess = [dict(LINHA=l, CODIGO=c, DETALHE_ANTES=a or '—', DETALHE_AGORA=n, DESCRICAO_CADASTRO=desc(c.upper()), DESCRICAO_ESTOQUE=est(c))
       for l, c, a, n in DT.ESS_LOG]

# 4) conflito entre a descrição da base e a do ESTOQUE_BAP
OPOSTOS = [('DIANTEIRO', r'\bDIANT', 'TRASEIRO', r'\bTRAS'), ('C/ ABS', r'\b(?:C/|COM)\s*ABS', 'S/ ABS', r'\b(?:S/|SEM)\s*ABS'),
           ('C/ HASTE', r'\b(?:C/|COM)\s*HASTE', 'S/ HASTE', r'\b(?:S/|SEM)\s*HASTE'),
           ('C/ CANECA', r'\b(?:C/|COM)\s*CANECA', 'S/ CANECA', r'\b(?:S/|SEM)\s*CANECA'),
           ('C/ PIVÔ', r'\b(?:C/|COM)\s*PIVO', 'S/ PIVÔ', r'\b(?:S/|SEM)\s*PIVO'),
           ('PARCIAL', r'\bPARCIAL', 'COMPLETO', r'\bCOMPLET'), ('FIXA', r'\bFIXA\b', 'TRIPOIDE/DESLIZANTE', r'\bTRIPOIDE|\bDESLIZ'),
           ('MANUAL', r'\bMANUAL', 'AUTOMÁTICO', r'\bAUTOMAT'), ('ÓLEO', r'\bOLEO\b', 'GÁS/PRESSURIZADO', r'\bGAS\b|\bPRESSURIZ')]
conf = []
for c, (f, r) in ROW.items():
    if f['name'] in ('Óleo Lubrificante', 'Fluidos e Químicos', 'Interruptores de Pressão do Óleo', 'Bomba de Óleo', 'Filtros'): continue
    a, b = U(desc(c)), U(est(c))
    if not a or not b: continue
    for la, pa, lb, pb in OPOSTOS:
        A1, A2, B1, B2 = bool(re.search(pa, a)), bool(re.search(pb, a)), bool(re.search(pa, b)), bool(re.search(pb, b))
        if (A1 and not A2 and B2 and not B1) or (A2 and not A1 and B1 and not B2):
            conf.append(dict(LINHA=f['name'], CODIGO=c, CONFLITO=f'{la} × {lb}', DESCRICAO_BASE=desc(c), DESCRICAO_ESTOQUE=est(c),
                             DETALHE_NO_CATALOGO=r.get('sub', ''), APLICACAO=app(r)))

# 5) referência cruzada repetida em códigos BAP diferentes da mesma linha
refidx = collections.defaultdict(set)
for c, (f, r) in ROW.items():
    for p in (r.get('refs') or '').split(' · '):
        p = p.strip()
        if re.search(r'\d', p) and len(p) > 5:
            refidx[(f['name'], U(p))].add(c)
rep = []
for (l, p), cs in refidx.items():
    if len(cs) < 2: continue
    cs = sorted(cs)
    selos = {c: ROW[c][1].get('dif') or '' for c in cs}
    rep.append(dict(LINHA=l, REFERENCIA=p.title(), CODIGOS_BAP=' · '.join(cs), QTDE=len(cs),
                    SELOS=' · '.join(f'{c}: {s}' for c, s in selos.items() if s),
                    ATENCAO='Mesma referência para versões diferentes — confirmar' if len({s for s in selos.values() if s}) > 1 else '',
                    APLICACOES=' || '.join(f'{c}: {app(ROW[c][1], 90)}' for c in cs[:4])))
rep.sort(key=lambda x: (x['ATENCAO'] == '', x['LINHA'], -x['QTDE']))

# 6) ofereça junto
oj = []
for f in fams:
    for r in f['rows']:
        e = r.get('extra') or '—'
        tipo = 'par pelo mesmo veículo' if re.fullmatch(r'[A-Z0-9./\- ]+(?: · [A-Z0-9./\- ]+)*', e) and any(ch.isdigit() for ch in e) else 'sugestão da linha'
        oj.append(dict(LINHA=f['name'], CODIGO=r['code'], OFERECA_JUNTO=e, TIPO=tipo))

c7 = ROW['AMT7014'][1]; c5 = ROW['AMT7500'][1]
res = [
    ('Caso do vendedor: AMT7014 × AMT7500', 'Procede. Base unificada (aplicação): AMT7014 = Strada Adventure 2001–2020 c/ ABS; AMT7500 = a mesma aplicação s/ ABS. ESTOQUE_BAP descreve os dois só como "AMORTECEDOR SUSPENSAO DIANTEIRO".'),
    ('Referências cruzadas do caso', f"Nakata diferente (AMT7014: HG33093; AMT7500: HG33004). Cofap GP30120 e Monroe 94176 aparecem NOS DOIS códigos — referência repetida para versões diferentes: confirmar com o fornecedor. KYB 340080 só no AMT7014."),
    ('No catálogo, agora', 'Selo vermelho ao lado do código (c/ ABS / s/ ABS) e, embaixo, o item parecido e o que muda nele (≠ AMT7500 s/ ABS). Mesmo selo nos destaques do impresso, sobre a foto.'),
    ('Itens com selo de diferencial', f'{len(sel)} itens (ABS, câmbio, 4x4/4x2, pivô, 8V/16V, diesel/flex, turbo, ar, direção, haste, caneca, kit parcial/completo, estrias, furos...).'),
    ('Pares parecidos SEM diferença no cadastro', f"{len(pares)} pares (prioridade ALTA {sum(p['PRIORIDADE'] == 'ALTA' for p in pares)}): mesma linha, mesmo veículo e anos, e nada no cadastro que separe. É onde o vendedor pode errar — completar com o fornecedor."),
    ('Descrição × catálogo', f'{len(ess)} itens tinham informação essencial só na descrição e agora mostram no DETALHE (kit parcial/completo, sapata c/ ou s/ haste, catraca, medida da bucha, rolamento interno/externo, amortecedor pressurizado/câmbio/4x4...).'),
    ('Conflitos de cadastro', f'{len(conf)} itens com a descrição da base dizendo uma coisa e a do ESTOQUE_BAP o oposto (ex.: junta "Fixa" na base e "Tripoide" no estoque).'),
    ('Referência cruzada repetida', f"{len(rep)} referências de concorrente em 2+ códigos BAP da mesma linha; {sum(1 for x in rep if x['ATENCAO'])} delas ligam itens com selos diferentes (versões diferentes)."),
    ('OFEREÇA JUNTO', f"Todos os {len(oj)} itens: {sum(1 for x in oj if x['TIPO'] == 'par pelo mesmo veículo')} com código pelo mesmo veículo e {sum(1 for x in oj if x['TIPO'] != 'par pelo mesmo veículo')} com sugestão da linha (universal ou tipo de peça)."),
    ('Base unificada', 'v11: DETALHE_CATALOGO atualizado e colunas novas DIFERENCIAL, ITEM_PARECIDO e OFERECA_JUNTO (as 5 primeiras colunas não mudam).'),
]
with pd.ExcelWriter(SAIDA, engine='openpyxl') as w:
    pd.DataFrame(res, columns=['ITEM', 'RESULTADO']).to_excel(w, sheet_name='RESUMO', index=False)
    pd.DataFrame(sel).to_excel(w, sheet_name='ITENS_COM_SELO', index=False)
    pd.DataFrame(pares).to_excel(w, sheet_name='PARECIDOS_SEM_DIFERENCA', index=False)
    pd.DataFrame(ess).to_excel(w, sheet_name='DESCRICAO_NO_CATALOGO', index=False)
    pd.DataFrame(conf).to_excel(w, sheet_name='CONFLITO_BASE_X_ESTOQUE', index=False)
    pd.DataFrame(rep).to_excel(w, sheet_name='REF_CRUZADA_REPETIDA', index=False)
    pd.DataFrame(oj).to_excel(w, sheet_name='OFERECA_JUNTO', index=False)
wb = load_workbook(SAIDA)
for ws in wb:
    for c in ws[1]:
        c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='1F7A32'); c.alignment = Alignment(wrap_text=True, vertical='center')
    for i, col in enumerate(ws.columns, 1):
        m = max(len(str(c.value or '')) for c in list(col)[:200])
        ws.column_dimensions[get_column_letter(i)].width = min(max(10, m * .9), 70 if ws.title != 'RESUMO' else 120)
    ws.freeze_panes = 'A2'; ws.auto_filter.ref = ws.dimensions
    for row in ws.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
wb.save(SAIDA)
print({ws.title: ws.max_row - 1 for ws in wb})
