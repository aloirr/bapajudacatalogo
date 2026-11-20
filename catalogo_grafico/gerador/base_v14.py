"""Base unificada v14 (13/11/2026) = v13 + complementos do catálogo online Fraga aprovados pelo Alexandre em 13/11:
- REFERENCIAS_CRUZADAS: referências do Fraga que não estavam na base, acrescentadas no fim (nada é tirado);
- APLICACAO: veículos do Fraga que a base não cita, acrescentados no fim (só item com pelo menos 1 veículo em comum);
- o resto não muda. Fonte marcada em DADOS_ADICIONAIS (COMPLEMENTO_FRAGA).
Também vale para a aba PRODUTOS_MOTO. As 5 primeiras colunas não mudam de lugar (compatível com o BAP Ajuda).
Uso (dentro de gerador/):  python base_v14.py [v13.xlsx] [saida.xlsx]
"""
import sys, re
import openpyxl
import fraga_complementos as FC

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v13.xlsx'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else 'saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v14.xlsx'
HOJE = '13/11/2026'


def ref_base(p):
    """'SAMPEL SK2518' -> 'SAMPEL: SK2518' (padrão da base, ex.: TECFIL: ACP906)"""
    f = FC.ref_fmt(p)
    marca = next((d for d in FC.DUAS if p.upper().startswith(d + ' ')), p.split(' ')[0])
    return f'{marca.upper()}: {p[len(marca):].strip()}'


def main():
    import montar as M
    J = FC.carregar()
    wb = openpyxl.load_workbook(ENTRADA)
    n = {'apl': 0, 'ref': 0, 'refs_total': 0}
    for aba in ('PRODUTOS', 'PRODUTOS_MOTO'):
        ws = wb[aba]
        H = {c.value: i + 1 for i, c in enumerate(ws[1])}
        for r in range(2, ws.max_row + 1):
            c = str(ws.cell(r, H['CODIGO_BAP']).value or '').strip().upper()
            v = J.get(c)
            if not v: continue
            marcas = []
            if v.get('apl'):
                add = M.app_base_fmt(FC.segs_de(v['apl']))
                atual = str(ws.cell(r, H['APLICACAO']).value or '').strip()
                ws.cell(r, H['APLICACAO']).value = (atual.rstrip(' ;·,') + ' ; ' + add) if atual else add
                marcas.append('aplicação'); n['apl'] += aba == 'PRODUTOS'
            atual = str(ws.cell(r, H['REFERENCIAS_CRUZADAS']).value or '').strip()
            ca = re.sub(r'[^A-Z0-9]', '', atual.upper())
            novas = [x for x in v.get('refs', []) if not (len(re.sub(r'[^A-Z0-9]', '', ref_base(x).split(':', 1)[1].upper())) >= 4
                                                        and re.sub(r'[^A-Z0-9]', '', ref_base(x).split(':', 1)[1].upper()) in ca)]
            if novas:                                   # a base pode ter referência que o catálogo não mostra: não repetir
                add = '; '.join(ref_base(x) for x in novas)
                ws.cell(r, H['REFERENCIAS_CRUZADAS']).value = (atual.rstrip(' ;·,') + '; ' + add) if atual else add
                marcas.append('referência'); n['ref'] += aba == 'PRODUTOS'
                n['refs_total'] += len(novas) if aba == 'PRODUTOS' else 0
            da = str(ws.cell(r, H['DADOS_ADICIONAIS']).value or '')
            ws.cell(r, H['DADOS_ADICIONAIS']).value = (da + ' | ' if da else '') + f"COMPLEMENTO_FRAGA: {' e '.join(marcas)} do catálogo online BAP (catalogofraga) {HOJE}"
    wl = wb['LOG_CORRECOES']
    wl.append(('APLICACAO_COMPLEMENTO_FRAGA', 'PRODUTOS', f"{n['apl']} códigos", f'Catálogo online BAP ({HOJE}), aprovado pelo Alexandre',
               'Veículos do Fraga que a base não citava, acrescentados no fim da aplicação (item com pelo menos 1 veículo em comum). Aplicação anterior mantida.'))
    wl.append(('REFERENCIA_COMPLEMENTO_FRAGA', 'PRODUTOS', f"{n['ref']} códigos", f'Catálogo online BAP ({HOJE}), aprovado pelo Alexandre',
               f"{n['refs_total']} referências do Fraga que não estavam na base, acrescentadas no fim. Nenhuma referência foi tirada."))
    wr = wb['LEIA-ME']
    wr.insert_rows(1, 4)
    txt = [('BASE BAP UNIFICADA v14 (13/11/2026)', None),
           ('APLICACAO', f"{n['apl']} itens com veículos a mais do catálogo online da BAP (catalogofraga), acrescentados no fim; o texto anterior ficou."),
           ('REFERENCIAS_CRUZADAS', f"{n['ref']} itens com {n['refs_total']} referências a mais do catálogo online, acrescentadas no fim; nenhuma foi tirada."),
           (None, None)]
    for i, (a, b) in enumerate(txt, start=1):
        wr.cell(i, 1, a); wr.cell(i, 2, b)
    wb.save(SAIDA)
    print(n, SAIDA)


if __name__ == '__main__':
    main()
