"""Base unificada v10 (20/10/2026) — tudo conforme o Catálogo BAP 2026.

Entrada : BASE_BAP_UNIFICADA_PRODUTOS_BAP (v9, a instalada no BAP Ajuda 2.0)
Saída   : saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx

1. APLICACAO dos itens do catálogo = a aplicação que o catálogo mostra
   (mesmo texto do Catálogo Digital, no formato 'MONTADORA - modelos ; ...').
   Corrige as medidas de cilindro de roda que viraram ano (13/16" -> "2013–2016").
2. REFERENCIAS_CRUZADAS: acrescenta a equivalência que o catálogo mostra e a base não tinha.
3. Colunas novas no FIM (PRODUTOS e PRODUTOS_MOTO): POSICAO, LADO, DETALHE_CATALOGO.
4. CXD13200 incluído; linha repetida do 2.75-18 42P V250F retirada.
5. PAF.00xx (código com ponto, mesmo produto do PAF00xx do catálogo): mesma aplicação e
   referências do catálogo; DADOS_ADICIONAIS avisa o código do catálogo.
"""
import re, sys, os, unicodedata, collections, datetime
import openpyxl
from openpyxl.styles import PatternFill, Font
from copy import copy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import moto, montar, taxo, datas  # noqa: E402

ENTRADA = sys.argv[1]
SAIDA = sys.argv[2] if len(sys.argv) > 2 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx'
ESTOQUE = sys.argv[3] if len(sys.argv) > 3 else 'entradas/ESTOQUE_BAP.xlsx'


def N(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s or '').upper()) if unicodedata.category(c) != 'Mn')


# ---------------- o que o catálogo mostra, por código
CAT = {}
for f in moto.FAMS:
    if f['name'] == 'Linha Moto':
        continue
    for r in f['rows']:
        CAT[r['code'].strip().upper()] = (f, r)
SPEC = {f['name'] for f in moto.FAMS if f.get('spec')}

# ---------------- posição e lado
R_DIANT = re.compile(r'\bDIANTEIR|\bDIANT\b\.?(?!E)|\bDIANT\.')
R_TRAS = re.compile(r'\bTRASEIR|\bTRAS\b|\bTRAS\.|EIXOS? TRASEIRO')
R_AMBOS = re.compile(r'\bD\s*/\s*E\b|\bDIR\.?\s*(?:/|E)\s*ESQ|\bESQ\.?\s*(?:/|E)\s*DIR|DIREITO\s*(?:/|E)\s*ESQUERDO|ESQUERDO\s*(?:/|E)\s*DIREITO|AMBOS OS LADOS|LADO DIREITO E ESQUERDO')
R_ESQ = re.compile(r'\bESQUERD|\bESQ\b\.?')
R_DIR = re.compile(r'\bDIREIT|\bDIR\b\.?(?![A-Z])')
KIT_DE = {'KAC11844D': 'DIREITO', 'KAC11844E': 'ESQUERDO', 'KAC11966D': 'DIREITO', 'KAC11966E': 'ESQUERDO',
          'KAP11968D': 'DIREITO', 'KAP11968E': 'ESQUERDO'}   # [SUPOSIÇÃO] sufixo D/E = direito/esquerdo


def posicao_lado(code, textos):
    t = N(' | '.join(x for x in textos if x))
    t = re.sub(r'EM\s*·?\s*DIANTE|DIANTE\b', ' ', t)          # "em diante" não é dianteiro
    d, tr = bool(R_DIANT.search(t)), bool(R_TRAS.search(t))
    pos = 'DIANTEIRO E TRASEIRO' if d and tr else 'DIANTEIRO' if d else 'TRASEIRO' if tr else ''
    t2 = re.sub(r'DIRE[CÇ][AÃ]O|DIRECAO', ' ', t)               # direção não é lado
    t2 = re.sub(r'\bDIR\.?\s*(?=HIDR|MEC|ELET|ASSIST)', ' ', t2)   # 'Dir. Hidráulica' = direção
    t2 = re.sub(r'ROSCA\s+(?:DIR|ESQ)\w*\.?', ' ', t2)   # rosca direita/esquerda é a rosca, não o lado
    if R_AMBOS.search(t2):
        lado = 'ESQUERDO E DIREITO'
    else:
        e, di = bool(R_ESQ.search(t2)), bool(R_DIR.search(t2))
        lado = 'ESQUERDO E DIREITO' if e and di else 'ESQUERDO' if e else 'DIREITO' if di else ''
    if not lado and code in KIT_DE:
        lado = KIT_DE[code]
    return pos, lado


def tokens(s):
    return set(re.findall(r'[A-Z0-9]{3,}', N(s)))


wb = openpyxl.load_workbook(ENTRADA)
ws = wb['PRODUTOS']
H = {c.value: i + 1 for i, c in enumerate(ws[1])}
log = []
cnt = collections.Counter()
verde = PatternFill('solid', fgColor='E2EFDA')

# ---- 4a. linha repetida do 2.75-18 42P V250F
vistos = {}
apagar = []
for r in range(2, ws.max_row + 1):
    c = str(ws.cell(r, H['CODIGO_BAP']).value or '').strip().upper()
    if not c:
        continue
    if c in vistos:
        a = [ws.cell(vistos[c], j).value for j in range(1, ws.max_column + 1)]
        b = [ws.cell(r, j).value for j in range(1, ws.max_column + 1)]
        if a == b:
            apagar.append(r)
        else:
            cnt['dup_diferente'] += 1
    else:
        vistos[c] = r
for r in reversed(apagar):
    ws.delete_rows(r)
    cnt['dup_removida'] += 1
log += [('LINHA_REPETIDA_REMOVIDA', 'PRODUTOS', '2.75-18 42P V250F', 'v9', 'Linha idêntica repetida (troca de código de 15/10)')] * len(apagar)

# ---- colunas novas
ncol = ws.max_column
NOVAS = ['POSICAO', 'LADO', 'DETALHE_CATALOGO']
for k, nome in enumerate(NOVAS):
    cel = ws.cell(1, ncol + 1 + k, nome)
    src = ws.cell(1, ncol)
    cel.font = copy(src.font); cel.fill = copy(src.fill); cel.alignment = copy(src.alignment); cel.border = copy(src.border)
    ws.column_dimensions[openpyxl.utils.get_column_letter(ncol + 1 + k)].width = 22 if k < 2 else 34
H.update({n: ncol + 1 + k for k, n in enumerate(NOVAS)})

cat_por_norm = {re.sub(r'[^A-Z0-9]', '', k): k for k in CAT}

for r in range(2, ws.max_row + 1):
    code = str(ws.cell(r, H['CODIGO_BAP']).value or '').strip().upper()
    if not code:
        continue
    desc = str(ws.cell(r, H['DESCRICAO']).value or '')
    app0 = str(ws.cell(r, H['APLICACAO']).value or '')
    dados = str(ws.cell(r, H['DADOS_ADICIONAIS']).value or '')
    refs0 = str(ws.cell(r, H['REFERENCIAS_CRUZADAS']).value or '')
    alvo = code if code in CAT else None
    gemeo = None
    if alvo is None and '.' in code and cat_por_norm.get(re.sub(r'[^A-Z0-9]', '', code)):
        gemeo = cat_por_norm[re.sub(r'[^A-Z0-9]', '', code)]   # PAF.0013 -> PAF0013
        alvo = gemeo
    sub = ''
    if alvo:
        f, rr = CAT[alvo]
        sub = rr.get('sub') or ''
        if f['name'] in SPEC and rr['segs']:      # linha de especificação: o texto do catálogo vai no DETALHE_CATALOGO
            sub = re.sub(r'\s+', ' ', ' '.join(t.strip() for t, _ in rr['segs'])).strip()
        # 1. aplicação = a do catálogo
        if rr['segs'] and f['name'] not in SPEC:
            novo = montar.app_base_fmt(rr['segs'])
            if novo and novo != app0:
                ws.cell(r, H['APLICACAO']).value = novo
                cnt['app_catalogo'] += 1
                if re.search(r'20\d\d–20\d\d"', app0) and not re.search(r'20\d\d–20\d\d"', novo):
                    cnt['medida_corrigida'] += 1
                    log.append(('APLICACAO_CORRIGIDA', 'PRODUTOS', code, 'Catálogo 2026', 'Medida em polegada tinha virado ano (ex.: 13/16" -> 2013–2016")'))
        # 2. referências do catálogo que faltam
        crefs = [x.strip() for x in (rr.get('refs') or '').split(' · ') if x.strip()]
        crefs = [re.sub(r'^Equiv\.\s*', '', x) for x in crefs]
        falta = [x for x in crefs if not tokens(x) <= tokens(refs0)]
        if falta:
            ws.cell(r, H['REFERENCIAS_CRUZADAS']).value = (refs0 + ' | ' if refs0 else 'REFERENCIAS CRUZADAS: ') + ', '.join(falta)
            cnt['refs_acrescentadas'] += 1
        if gemeo:
            if 'MESMO PRODUTO' not in N(dados):
                ws.cell(r, H['DADOS_ADICIONAIS']).value = (dados + ' | ' if dados else '') + f'MESMO PRODUTO DO CÓDIGO {gemeo} (no catálogo como {gemeo})'
            cnt['codigo_com_ponto'] += 1
    # 3. posição, lado e detalhe
    pos, lado = posicao_lado(code, [desc, app0, dados, sub, (CAT[alvo][1].get('sub_orig') if alvo else '')])
    ws.cell(r, H['POSICAO']).value = pos or None
    ws.cell(r, H['LADO']).value = lado or None
    ws.cell(r, H['DETALHE_CATALOGO']).value = (datas.fix_text(sub) if sub and sub != '—' else None)
    cnt['pos'] += bool(pos); cnt['lado'] += bool(lado)

# ---- 4b. CXD13200
if 'CXD13200' not in vistos:
    est = openpyxl.load_workbook(ESTOQUE, read_only=True)
    e = est.active; it = e.iter_rows(values_only=True); cab = next(it)
    ic, idsc = cab.index('COD_PRODUTO'), cab.index('DESCRICAO_PRODUTO')
    dsc = next((x[idsc] for x in it if str(x[ic]).strip().upper() == 'CXD13200'), 'MECANISMO CAIXA DIRECAO MECANICA')
    nova = ws.max_row + 1
    modelo = vistos.get('CXD13023') or 2
    vals = {'CODIGO_BAP': 'CXD13200', 'DESCRICAO': dsc, 'APLICACAO': None, 'REFERENCIAS_CRUZADAS': None,
            'DADOS_ADICIONAIS': 'INCLUÍDO NA v10 (20/10/2026) — aplicação a cadastrar', 'PRODUTO': 'Caixa de Direção',
            'CATEGORIA': 'PEÇAS', 'SISTEMA': 'DIREÇÃO', 'FAMILIA': 'CAIXAS DE DIREÇÃO', 'LINHA': 'LEVE',
            'NO_CATALOGO_DIGITAL': 'NÃO', 'STATUS_CADASTRO': 'ATIVO', 'POSICAO': None, 'LADO': None, 'DETALHE_CATALOGO': None}
    for k, v in vals.items():
        c = ws.cell(nova, H[k], v); m = ws.cell(modelo, H[k])
        c.font = copy(m.font); c.fill = copy(m.fill); c.alignment = copy(m.alignment); c.border = copy(m.border)
    log.append(('PRODUTO_INCLUIDO', 'PRODUTOS', 'CXD13200', 'ESTOQUE_BAP', 'Caixa de direção mecânica: PEÇAS · DIREÇÃO · CAIXAS DE DIREÇÃO · LEVE ([SUPOSIÇÃO] LINHA por analogia)'))
    cnt['cxd'] += 1

# ---- PRODUTOS_MOTO: posição e lado
wm = wb['PRODUTOS_MOTO']
Hm = {c.value: i + 1 for i, c in enumerate(wm[1])}
nm = wm.max_column
for k, nome in enumerate(['POSICAO', 'LADO']):
    cel = wm.cell(1, nm + 1 + k, nome); src = wm.cell(1, nm)
    cel.font = copy(src.font); cel.fill = copy(src.fill); cel.alignment = copy(src.alignment); cel.border = copy(src.border)
for r in range(2, wm.max_row + 1):
    code = str(wm.cell(r, 1).value or '').strip().upper()
    if not code:
        continue
    pos, lado = posicao_lado(code, [str(wm.cell(r, Hm[x]).value or '') for x in ('DESCRICAO', 'APLICACAO', 'DADOS_ADICIONAIS')])
    wm.cell(r, nm + 1).value = pos or None
    wm.cell(r, nm + 2).value = lado or None

# ---- LOG e LEIA-ME
wl = wb['LOG_CORRECOES']
for x in log:
    wl.append(list(x))
for c in ['APLICACAO_IGUAL_CATALOGO', 'REFERENCIA_ACRESCENTADA', 'COLUNAS_NOVAS']:
    pass
wl.append(('APLICACAO_IGUAL_CATALOGO', 'PRODUTOS', f"{cnt['app_catalogo']} códigos", 'Catálogo 2026 (20/10)', 'Aplicação trocada pelo texto que o catálogo mostra'))
wl.append(('REFERENCIA_ACRESCENTADA', 'PRODUTOS', f"{cnt['refs_acrescentadas']} códigos", 'Catálogo 2026 (20/10)', 'Equivalência do catálogo que faltava na base'))
wl.append(('COLUNAS_NOVAS', 'PRODUTOS / PRODUTOS_MOTO', 'POSICAO, LADO, DETALHE_CATALOGO', 'Aprovado pelo Alexandre (20/10)', 'No fim das abas; as 5 primeiras colunas não mudam'))

wr = wb['LEIA-ME']
wr.insert_rows(1, 8)
txt = [
    ('BASE BAP UNIFICADA v10 (20/10/2026) — conforme o Catálogo BAP 2026', None),
    ('Aplicação', f"Itens do catálogo com a mesma aplicação que o catálogo mostra ({cnt['app_catalogo']} trocadas). Corrigidas {cnt['medida_corrigida']} medidas de cilindro de roda que tinham virado ano (13/16\" -> 2013–2016\")."),
    ('Colunas novas', 'No fim de PRODUTOS: POSICAO (DIANTEIRO / TRASEIRO / DIANTEIRO E TRASEIRO), LADO (ESQUERDO / DIREITO / ESQUERDO E DIREITO) e DETALHE_CATALOGO (o detalhe da tabela do catálogo). PRODUTOS_MOTO ganhou POSICAO e LADO.'),
    ('Equivalências', f"{cnt['refs_acrescentadas']} códigos ganharam a equivalência que o catálogo mostra e a base não tinha."),
    ('Códigos com ponto', f"{cnt['codigo_com_ponto']} pastilhas PAF.00xx (o mesmo produto do PAF00xx do catálogo; os dois códigos existem no Protheus com estoque) com a aplicação do catálogo e aviso em DADOS_ADICIONAIS."),
    ('Inclusões e limpeza', 'CXD13200 incluído (PEÇAS · DIREÇÃO · CAIXAS DE DIREÇÃO · LEVE). Linha repetida do 2.75-18 42P V250F retirada.'),
    ('Sem mudança', 'CATEGORIA, SISTEMA, FAMILIA, PRODUTO e LINHA já batiam com o catálogo. As 5 primeiras colunas (BAP Ajuda) não mudam.'),
    (None, None),
]
for i, (a, b) in enumerate(txt, start=1):
    wr.cell(i, 1, a); wr.cell(i, 2, b)
    if i == 1:
        wr.cell(i, 1).font = Font(bold=True, size=12)
    elif a:
        wr.cell(i, 1).font = Font(bold=True)

os.makedirs(os.path.dirname(SAIDA) or '.', exist_ok=True)
wb.save(SAIDA)
print(dict(cnt))
