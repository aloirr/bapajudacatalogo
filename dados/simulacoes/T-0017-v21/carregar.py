import openpyxl, pickle, sys
wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
out = {}
for ws in wb.worksheets:
    print(ws.title, ws.max_row, ws.max_column)
for nome in ("PRODUTOS", "VEICULOS"):
    ws = wb[nome]
    rows = list(ws.iter_rows(values_only=True))
    cab = list(rows[0])
    if nome == "PRODUTOS":
        i = cab.index("DADOS_ADICIONAIS")
        rows = [tuple(v for j, v in enumerate(r) if j != i) for r in rows]
    out[nome] = rows
pickle.dump(out, open(sys.argv[2], "wb"))
print(out["PRODUTOS"][0]); print(out["VEICULOS"][0])
