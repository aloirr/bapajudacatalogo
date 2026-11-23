"""T-0006 · Levantamento das medidas (só leitura da base) para a simulação da busca por medida.

Uso, na raiz do repositório: python3 docs/propostas/T-0006/medidas.py
Grava docs/propostas/T-0006/medidas.json: só códigos BAP do catálogo digital, por valor de medida. Nada de preço,
estoque, custo ou fornecedor. Não muda a base.
"""
import collections, json, re
from pathlib import Path
import openpyxl

RAIZ = Path(__file__).resolve().parents[3]
wb = openpyxl.load_workbook(RAIZ / "dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx", read_only=True, data_only=True)
linhas = wb["PRODUTOS"].iter_rows(values_only=True)
I = {str(h): i for i, h in enumerate(next(linhas))}
prods = [r for r in linhas if r[I["CODIGO_BAP"]] and str(r[I["NO_CATALOGO_DIGITAL"]]).upper().startswith("S")]


def extras(r):  # DADOS_ADICIONAIS: "CHAVE: valor | CHAVE: valor"
    d = {}
    for parte in str(r[I["DADOS_ADICIONAIS"]] or "").split("|"):
        if ":" in parte:
            k, v = parte.split(":", 1)
            d[k.strip().upper()] = v.strip()
    return d


FAIXAS_CCA = [(400, "até 400"), (500, "401 a 500"), (600, "501 a 600"), (800, "601 a 800"), (10**6, "acima de 800")]
ah, cca, aro, med = (collections.defaultdict(list) for _ in range(4))
for r in prods:
    cod, d = r[I["CODIGO_BAP"]], extras(r)
    if r[I["CATEGORIA"]] == "BATERIAS":
        if d.get("C20(AH)", "").isdigit():
            ah[int(d["C20(AH)"])].append(cod)
        if d.get("CCA-18°", "").isdigit():
            cca[next(n for lim, n in FAIXAS_CCA if int(d["CCA-18°"]) <= lim)].append(cod)
    elif r[I["CATEGORIA"]] == "PNEUS":
        a = d.get("TAMANHO_ARO") or d.get("ARO")
        if a and a.isdigit():
            aro[int(a)].append(cod)
        m = re.match(r"^(\d+(?:\.\d+)?(?:/\d+)?-\d+)", str(cod))  # a medida está no começo do código do pneu
        if m and "PNEU" in str(r[I["DESCRICAO"]]):
            med[m.group(1)].append(cod)


def ordem_pneu(m):  # aro, largura em mm (2.75 é polegada) e perfil
    larg, a = m.split("/")[0].split("-")[0], m.split("-")[-1]
    perfil = m.split("/")[1].split("-")[0] if "/" in m else "0"
    return int(a), float(larg) * (25.4 if float(larg) < 10 else 1), int(perfil)


saida = {
    "ah": {str(k): v for k, v in sorted(ah.items())},
    "cca": {n: cca[n] for _, n in FAIXAS_CCA if n in cca},
    "aro": {str(k): v for k, v in sorted(aro.items())},
    "med": {k: med[k] for k in sorted(med, key=ordem_pneu)},
}
(Path(__file__).parent / "medidas.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print({k: {a: len(b) for a, b in v.items()} for k, v in saida.items()})
