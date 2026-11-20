"""Base unificada v13 (12/11/2026). Em entregas a v12 (27/10) = v11 + NO_CATALOGO_DIGITAL = SIM em todos os itens
que não são INATIVO (itens sem estoque nos catálogos). Esta v13 refaz essa regra a partir da v11 e acrescenta,
para os 49 filtros que estavam sem aplicação:
- APLICACAO e REFERENCIAS_CRUZADAS (Tecfil) tiradas do catálogo online da BAP (catalogobap.catalogofraga.com.br);
- LINHA revista pela aplicação (ex.: FLU6186 e FLU6240 são filtros de óleo de MOTO; FHD6087 só Scania = PESADA);
- FLU6186 e FLU6240 também entram na aba PRODUTOS_MOTO;
- OFERECA_JUNTO desses itens = o mesmo do catálogo.
As 5 primeiras colunas não mudam de lugar (compatível com o BAP Ajuda).
Uso (dentro de gerador/):  python base_v13.py [v11.xlsx] [saida.xlsx]
"""
import sys, re
from copy import copy
import openpyxl
import site_aplicacoes as S

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v11.xlsx'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v13.xlsx'
HOJE = '12/11/2026'

LINHA = {  # [SUPOSIÇÃO] trator e máquina agrícola contam como PESADA (a base não tem linha agrícola)
    'FLU6186': 'MOTO', 'FLU6240': 'MOTO',
    'FHD6087': 'PESADA', 'FCB6262': 'PESADA', 'FLU6138': 'PESADA', 'FLU6155': 'PESADA', 'FLU6268': 'PESADA', 'FLU6283': 'PESADA',
    'FLU6021': 'LEVE E PESADA', 'FLU6031': 'LEVE E PESADA', 'FLU6032': 'LEVE E PESADA', 'FLU6145': 'LEVE E PESADA',
    'FLU6242': 'LEVE E PESADA', 'FLU6112': 'LEVE E PESADA',
    'HD27': 'PESADA',                                    # palheta Scania S
}


def texto(segs):
    return re.sub(r'\s+', ' ', ''.join(t for t, b in segs)).strip(' ·')


def main():
    import moto                                   # aplica o site e calcula o OFEREÇA JUNTO do catálogo
    M = moto.X.PF.M
    oj = {r['code']: r.get('extra') for f in moto.FAMS for r in f['rows'] if r.get('extra') not in (None, '', '—')}
    segs_cat = {r['code'].strip().upper(): r['segs'] for f in moto.FAMS if not f.get('moto') for r in f['rows'] if r.get('_fonte_apl') == 'site'}
    site = S.carregar()
    wb = openpyxl.load_workbook(ENTRADA)
    ws = wb['PRODUTOS']
    H = {c.value: i + 1 for i, c in enumerate(ws[1])}
    n = {'apl': 0, 'ref': 0, 'linha': 0, 'oj': 0, 'no_cat': 0}
    linhas_moto = []
    for r in range(2, ws.max_row + 1):
        c = str(ws.cell(r, H['CODIGO_BAP']).value or '').strip().upper()
        # regra da v12 (27/10): todo item que não é INATIVO consta nos catálogos
        if 'INATIVO' not in str(ws.cell(r, H['STATUS_CADASTRO']).value or '').upper() and ws.cell(r, H['NO_CATALOGO_DIGITAL']).value != 'SIM':
            ws.cell(r, H['NO_CATALOGO_DIGITAL']).value = 'SIM'; n['no_cat'] += 1
        if c not in site: continue
        s = site[c]
        if not str(ws.cell(r, H['APLICACAO']).value or '').strip():
            ws.cell(r, H['APLICACAO']).value = M.app_base_fmt(segs_cat.get(c, s['segs'])); n['apl'] += 1
        if s['ref'] and not str(ws.cell(r, H['REFERENCIAS_CRUZADAS']).value or '').strip():
            refs = ', '.join(': '.join(x.strip().rsplit(' ', 1)) for x in s['ref'].split(' / ') if ' ' in x.strip())
            ws.cell(r, H['REFERENCIAS_CRUZADAS']).value = refs; n['ref'] += 1   # mesmo padrão da base (ex.: TECFIL: ACP906)
        da = str(ws.cell(r, H['DADOS_ADICIONAIS']).value or '')
        da = re.sub(r'\s*\|\s*OBS: sem aplicação por veículo no catálogo BAP - pendente; sem referência cruzada no catálogo BAP', '', da)
        da = re.sub(r'QTD_APLICACOES: 0', 'QTD_APLICACOES: site', da)
        ws.cell(r, H['DADOS_ADICIONAIS']).value = (da + ' | ' if da else '') + f'FONTE_APLICACAO: catálogo online BAP (catalogofraga) {HOJE}'
        if c in LINHA and ws.cell(r, H['LINHA']).value != LINHA[c]:
            ws.cell(r, H['LINHA']).value = LINHA[c]; n['linha'] += 1
        if oj.get(c) and 'OFERECA_JUNTO' in H and not ws.cell(r, H['OFERECA_JUNTO']).value:
            ws.cell(r, H['OFERECA_JUNTO']).value = oj[c]; n['oj'] += 1
        if LINHA.get(c) == 'MOTO':
            linhas_moto.append([ws.cell(r, H[k]).value for k in ('CODIGO_BAP', 'DESCRICAO', 'APLICACAO', 'REFERENCIAS_CRUZADAS', 'DADOS_ADICIONAIS')] + [None, None])
    wm = wb['PRODUTOS_MOTO']
    ja = {str(x[0]).strip().upper() for x in wm.iter_rows(min_row=2, values_only=True) if x and x[0]}
    for lm in linhas_moto:
        if lm[0] not in ja:
            wm.append(lm)
            for k in range(1, 8):
                src, dst = wm.cell(2, k), wm.cell(wm.max_row, k)
                dst.font = copy(src.font); dst.alignment = copy(src.alignment); dst.border = copy(src.border)
    wl = wb['LOG_CORRECOES']
    wl.append(('NO_CATALOGO_DIGITAL', 'PRODUTOS', f"{n['no_cat']} códigos", 'Regra da v12 (27/10)', 'Itens sem estoque constam nos catálogos: SIM em todos os itens que não são INATIVO'))
    wl.append(('APLICACAO_SITE', 'PRODUTOS', f"{n['apl']} códigos", f'Catálogo online BAP ({HOJE})', f"{n['apl']} itens sem aplicação (49 filtros + 70 de outras linhas): aplicação e referência cruzada do catalogobap.catalogofraga.com.br, resumidas por montadora, modelo, motor e anos"))
    wl.append(('LINHA_REVISTA', 'PRODUTOS', f"{n['linha']} códigos", 'Pela aplicação do site', 'FLU6186 e FLU6240 = MOTO (também na aba PRODUTOS_MOTO); filtros só de caminhão, ônibus ou trator = PESADA; mistos = LEVE E PESADA'))
    wr = wb['LEIA-ME']
    wr.insert_rows(1, 5)
    txt = [('BASE BAP UNIFICADA v13 (12/11/2026)', None),
           ('APLICACAO', f"{n['apl']} itens que estavam sem aplicação (49 filtros e 70 de outras linhas) receberam a aplicação do catálogo online da BAP (catalogofraga), e {n['ref']} a referência cruzada. Fonte marcada em DADOS_ADICIONAIS (FONTE_APLICACAO)."),
           ('LINHA', f"{n['linha']} filtros com a LINHA revista pela aplicação. FLU6186 e FLU6240 são filtros de óleo de MOTO (aba PRODUTOS_MOTO)."),
           ('NO_CATALOGO_DIGITAL', 'Como na v12 (27/10): SIM em todos os itens que não são INATIVO.'),
           (None, None)]
    for i, (a, b) in enumerate(txt, start=1):
        wr.cell(i, 1, a); wr.cell(i, 2, b)
    wb.save(SAIDA)
    print(n, len(linhas_moto), SAIDA)


if __name__ == '__main__':
    main()
