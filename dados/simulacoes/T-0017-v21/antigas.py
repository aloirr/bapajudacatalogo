# Lê só CODIGO_BAP, APLICACAO e REFERENCIAS_CRUZADAS de versões antigas (nada de DADOS_ADICIONAIS sai daqui).
import openpyxl, sys, json
out = {}
for v in sys.argv[2:]:
    wb = openpyxl.load_workbook(f"/home/user/wt-v21/dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_{v}.xlsx", read_only=True)
    ws = wb["PRODUTOS"]; it = ws.iter_rows(values_only=True); cab = list(next(it))
    ia, ir = cab.index("APLICACAO"), cab.index("REFERENCIAS_CRUZADAS")
    out[v] = {r[0]: [r[ia], r[ir]] for r in it if r[0]}
json.dump(out, open(sys.argv[1], "w"), ensure_ascii=False)
