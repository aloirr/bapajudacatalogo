"""T-0040 · Lista de trabalho dos anos (só lê a base; não grava nada nela).

Fonte: aba VEICULOS da base unificada (uma linha por produto x veículo, com ANO_INICIO e ANO_FIM).
  sem_ano    = ANO_INICIO e ANO_FIM vazios
  so_inicial = ANO_INICIO preenchido e ANO_FIM vazio ("1996+", "após 2003", "2012/.", ano solto "08/2022")
  so_final   = ANO_FIM preenchido e ANO_INICIO vazio ("até 2008")
Fica fora: as linhas com início e fim e os itens de LINHA UNIVERSAL (decisão do Alexandre: ficam sem ano).

Saída: dados/T-0040/lista_trabalho.csv (UTF-8, ";"). id_linha = ordem das linhas da aba VEICULOS (estável enquanto a
aba não mudar). Só campos públicos: descrição (d) e referências (r) do site/data/produtos.json, que já passaram pela
FICHA e pela TRAVA do gerar_site; fabricante, modelo, versão e cilindrada da VEICULOS. Não copia APLICACAO (pode ter
preço, como o TER556556). O sha256 da base é conferido antes e depois.

Uso: python3 dados/scripts/lista_T0040.py
"""
import csv
import hashlib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from openpyxl import load_workbook

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
JSON = RAIZ / "site" / "data" / "produtos.json"
SAIDA = RAIZ / "dados" / "T-0040" / "lista_trabalho.csv"
COLS = ["id_linha", "codigo_bap", "descricao", "montadora", "modelo", "versao", "motor", "ano_atual", "tipo",
        "referencias_cruzadas"]
INTERNO = re.compile(r"ESTOQUE|\bFOB\b|\bUSD\b|\bMOQ\b|PRE[CÇ]O|R\$|BAP BOX|CUSTO|FORNECEDOR|RANKING|ANTERIOR", re.I)


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def txt(v):
    return "" if v is None else re.sub(r"\s+", " ", str(v)).strip()


def main():
    antes = sha(BASE)
    wb = load_workbook(BASE, read_only=True)
    prods = {r[0]: r for r in list(wb["PRODUTOS"].iter_rows(values_only=True))[1:] if r[0]}
    linhas = wb["VEICULOS"].iter_rows(values_only=True)
    cab = next(linhas)
    pos = {c: i for i, c in enumerate(cab)}
    site = {p["c"]: p for p in json.loads(JSON.read_text(encoding="utf-8"))["produtos"]}

    saida, universal = [], 0
    for n, r in enumerate(linhas, start=1):
        cod = txt(r[pos["CODIGO_BAP"]])
        if not cod:
            continue
        ini, fim = r[pos["ANO_INICIO"]], r[pos["ANO_FIM"]]
        if ini is None and fim is None:
            tipo, ano = "sem_ano", ""
        elif fim is None:
            tipo, ano = "so_inicial", f"{int(ini)}+"
        elif ini is None:
            tipo, ano = "so_final", f"até {int(fim)}"
        else:
            continue
        if txt(prods[cod][9]) == "UNIVERSAL":
            universal += 1
            continue
        p = site.get(cod)
        desc = p["d"] if p else txt(prods[cod][pos_p("DESCRICAO")])
        refs = ", ".join(f"{x['m']}: {x['c']}" if x.get("m") else x["c"] for x in (p or {}).get("r", []))
        saida.append([n, cod, desc, txt(r[pos["FABRICANTE"]]), txt(r[pos["MODELO"]]), txt(r[pos["VERSAO"]]),
                      txt(r[pos["CILINDRADA"]]), ano, tipo, refs])

    for lin in saida:
        if any(INTERNO.search(str(c)) for c in lin):
            sys.exit(f"[PARADO] dado interno na linha {lin[0]} ({lin[1]})")
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with SAIDA.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";", quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writerow(COLS)
        w.writerows(saida)
    assert sha(BASE) == antes, "a base mudou"

    # contagem por LINHA
    li = {c: txt(r[9]) for c, r in prods.items()}
    tab = defaultdict(lambda: [0, set()])
    for lin in saida:
        for k in ((lin[8], li[lin[1]]), (lin[8], "TOTAL")):
            tab[k][0] += 1
            tab[k][1].add(lin[1])
    print(f"linhas: {len(saida)} | códigos: {len({l[1] for l in saida})} | UNIVERSAL (fora): {universal}")
    for k in sorted(tab):
        print(f"  {k[0]:<11} {k[1]:<14} linhas {tab[k][0]:>5}  códigos {len(tab[k][1]):>5}")
    cods = {l[1] for l in saida}
    print("códigos com ao menos 1 referência:", len({l[1] for l in saida if l[9]}), "de", len(cods))
    print("códigos fora do site:", sorted(c for c in cods if c not in site))
    print("sha256 base:", antes, "(sem mudança)")


def pos_p(nome):
    return ["CODIGO_BAP", "DESCRICAO", "APLICACAO", "REFERENCIAS_CRUZADAS"].index(nome)


if __name__ == "__main__":
    main()
