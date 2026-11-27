"""T-0040 · Lista de trabalho dos anos (só lê a base; não grava nada nela).

Fonte: aba VEICULOS da base unificada (uma linha por produto x veículo, com ANO_INICIO e ANO_FIM).
  sem_ano    = ANO_INICIO e ANO_FIM vazios
  so_inicial = ANO_INICIO preenchido e ANO_FIM vazio ("1996+", "após 2003", "2012/.", ano solto "08/2022")
  so_final   = ANO_FIM preenchido e ANO_INICIO vazio ("até 2008")
Fica fora: as linhas com início e fim e os itens de LINHA UNIVERSAL (decisão do Alexandre: ficam sem ano).

Saída (UTF-8, ";"):
- dados/T-0040/pendentes_internet.csv: a lista de trabalho (as linhas da VEICULOS ainda sem ano completo; até a v29
  se chamava lista_trabalho.csv, RD-0696);
- dados/T-0040/conflitos.csv: as linhas da aba CONFLITOS da simulacao/antes_depois.xlsx, com o id_linha da VEICULOS
  de hoje e a faixa da Fraga (AAAA–AAAA) no lugar do tipo.
id_linha = ordem das linhas da aba VEICULOS (estável enquanto a
aba não mudar). Só campos públicos: descrição (d) e referências (r) do site/data/produtos.json, que já passaram pela
FICHA e pela TRAVA do gerar_site; fabricante, modelo, versão e cilindrada da VEICULOS. Não copia APLICACAO (pode ter
preço, como o TER556556). O sha256 da base é conferido antes e depois.

Os dois passam pelo mesmo [PARADO] de palavra interna.

Uso: python3 dados/scripts/lista_T0040.py
"""
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from openpyxl import load_workbook

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import BASE, RAIZ, sha  # noqa: E402
from simular_T0040 import AD, ORIGEM, tipo_ano  # noqa: E402

JSON = RAIZ / "site" / "data" / "produtos.json"
PENDENTES = RAIZ / "dados" / "T-0040" / "pendentes_internet.csv"
CONFLITOS = RAIZ / "dados" / "T-0040" / "conflitos.csv"
COLS_CONF = ["id_linha", "codigo_bap", "descricao", "montadora", "modelo", "versao", "motor", "ano_atual",
             "faixa_fraga", "referencias_cruzadas"]
COLS = ["id_linha", "codigo_bap", "descricao", "montadora", "modelo", "versao", "motor", "ano_atual", "tipo",
        "referencias_cruzadas"]
INTERNO = re.compile(r"ESTOQUE|\bFOB\b|\bUSD\b|\bMOQ\b|PRE[CÇ]O|R\$|BAP BOX|CUSTO|FORNECEDOR|RANKING|ANTERIOR", re.I)


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

    saida, universal, da_v28, k = [], 0, {}, 0
    for n, r in enumerate(linhas, start=1):
        if r[pos["ORIGEM"]] != ORIGEM:               # as linhas da v28 ficam na ordem (a Fraga entra no meio)
            k += 1
            da_v28[k] = n
        cod = txt(r[pos["CODIGO_BAP"]])
        if not cod:
            continue
        ini, fim = r[pos["ANO_INICIO"]], r[pos["ANO_FIM"]]
        tipo = tipo_ano(ini, fim)
        if tipo == "completa":
            continue
        ano = {"sem_ano": "", "so_inicial": f"{ini}+", "so_final": f"até {fim}"}[tipo]
        if txt(prods[cod][9]) == "UNIVERSAL":
            universal += 1
            continue
        p = site.get(cod)
        desc = p["d"] if p else txt(prods[cod][pos_p("DESCRICAO")])
        refs = ", ".join(f"{x['m']}: {x['c']}" if x.get("m") else x["c"] for x in (p or {}).get("r", []))
        saida.append([n, cod, desc, txt(r[pos["FABRICANTE"]]), txt(r[pos["MODELO"]]), txt(r[pos["VERSAO"]]),
                      txt(r[pos["CILINDRADA"]]), ano, tipo, refs])

    # conflitos: a linha da v28 (aba CONFLITOS) -> id_linha de hoje; a faixa da Fraga no lugar do tipo
    por_id = {lin[0]: lin for lin in saida}
    conf = []
    for c in list(load_workbook(AD, read_only=True)["CONFLITOS"].iter_rows(values_only=True))[1:]:
        lin = por_id.get(da_v28.get(c[5]))
        if not lin or lin[1] != c[0] or lin[4] != txt(c[3]):
            sys.exit(f"[PARADO] o conflito {c[0]} {c[3]} (linha {c[5]} da v28) não está na lista de hoje")
        conf.append(lin[:8] + [c[7]] + lin[9:])
    saidas = ((PENDENTES, COLS, saida), (CONFLITOS, COLS_CONF, conf))
    for arq, cols, dados in saidas:
        for lin in dados:
            if any(INTERNO.search(str(c)) for c in lin):
                sys.exit(f"[PARADO] dado interno na linha {lin[0]} ({lin[1]}) de {arq.name}")
    PENDENTES.parent.mkdir(parents=True, exist_ok=True)
    for arq, cols, dados in saidas:
        with arq.open("w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, delimiter=";", quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
            w.writerow(cols)
            w.writerows(dados)
        print(f"{arq.relative_to(RAIZ)}: {len(dados)} linhas")
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
