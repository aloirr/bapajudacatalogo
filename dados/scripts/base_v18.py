"""v18 da base unificada · T-0017 (correção: modelo numérico lido de data ou medida passa a 'duvidoso').

Decisão R-20261120-131800-alexandre (item 3, "a"): "v18 de correção, já: as ~80 linhas com modelo numérico de data
ou medida passam a 'duvidoso'. Simulação primeiro, com a lista de antes e depois."
Aprovado R-20261120-132430-alexandre ("1 e 2: a"): a simulação de dados/simulacoes/T-0017-v18/ como está (101 linhas
de 95 produtos; as 332 numéricas conferidas continuam 'separado'; o FAR6135 fica como Peugeot 2008).

O que faz (regra 4 do CLAUDE.md):
1. Lê a aba MUDAM da simulação aprovada e confere, linha a linha, que a VEICULOS da base (v17) ainda tem naquela
   linha o mesmo CODIGO_BAP, FABRICANTE, MODELO e VERSAO, com SITUACAO=separado, ORIGEM=automático e MOTIVO vazio.
   Se algo não bater, para sem gravar.
2. Troca só 2 células por linha: SITUACAO (separado -> duvidoso) e MOTIVO (vazio -> o motivo da simulação). As linhas
   ORIGEM=manual (digitadas) nunca são tocadas.
3. Acrescenta no fim do LOG_CORRECOES uma linha por código mudado (95) e o título da v18 no topo do LEIA-ME.
4. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v17: só podem mudar as células
   da simulação na VEICULOS, as linhas novas do LOG_CORRECOES e as do LEIA-ME. A aba PRODUTOS tem de ficar igual.
5. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v18.xlsx.

Uso: python3 dados/scripts/base_v18.py            (grava)
     python3 dados/scripts/base_v18.py --conferir (só compara a base de hoje com a v17)
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import shutil
import sys
import tempfile
from copy import copy
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
V17 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v17.xlsx"
V18 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v18.xlsx"
SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v18" / "SIMULACAO_v18_T-0017.xlsx"
DATA = "20/11/2026"

LINHAS = 101   # aprovadas
CODIGOS = 95
CELULAS = 2 * LINHAS   # SITUACAO + MOTIVO

LEIA_ME = [
    ("BASE BAP UNIFICADA v18 (20/11/2026)", None),
    ("VEICULOS (correção)", "101 linhas de 95 produtos: SITUACAO separado -> duvidoso, com o motivo na coluna MOTIVO. "
                            "Eram modelos numéricos lidos de data ou medida (Renault 12 de \"12/2016\", Renault 19 de "
                            "\"19,05 mm\", Renault 21 de \"21 dentes\", Peugeot 2008 de \"2008 até 2013\"). Saem do "
                            "filtro do site até a revisão; nenhuma linha apagada (T-0017)."),
    ("Formato", "Formato igual ao da v17 (mesmas abas e colunas). 202 células mudadas na VEICULOS (101 SITUACAO e 101 "
                "MOTIVO); aba PRODUTOS igual à da v17. 95 linhas no LOG_CORRECOES (uma por código). Aprovado pelo "
                "Alexandre em 20/11/2026 (R-20261120-132430-alexandre)."),
    (None, None),
]


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def ler_simulacao() -> list[dict]:
    wb = openpyxl.load_workbook(SIM, read_only=True)
    rows = list(wb["MUDAM"].iter_rows(values_only=True))
    wb.close()
    cab = list(rows[0])
    return [dict(zip(cab, r)) for r in rows[1:] if any(v is not None for v in r)]


def aplicar(wb, muds):
    ws = wb["VEICULOS"]
    cab = [limpo(c.value) for c in ws[1]]
    col = {c: i + 1 for i, c in enumerate(cab)}
    erros, feitas = [], []
    for m in muds:
        r = int(m["LINHA_NA_VEICULOS"])
        val = {c: limpo(ws.cell(r, col[c]).value) for c in cab}
        for c in ("CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO"):
            if val[c] != limpo(m[c]):
                erros.append(f"linha {r}: {c} é {val[c]!r} na base e {limpo(m[c])!r} na simulação")
        if val["SITUACAO"] != limpo(m["SITUACAO_ANTES"]) or val["SITUACAO"] != "separado":
            erros.append(f"linha {r} ({val['CODIGO_BAP']}): SITUACAO {val['SITUACAO']!r}, esperado 'separado'")
        if val["ORIGEM"] != "automático":
            erros.append(f"linha {r} ({val['CODIGO_BAP']}): ORIGEM {val['ORIGEM']!r} (digitado não se toca)")
        if val["MOTIVO"]:
            erros.append(f"linha {r} ({val['CODIGO_BAP']}): MOTIVO já preenchido")
        if limpo(m["SITUACAO_DEPOIS"]) != "duvidoso" or not limpo(m["MOTIVO_NOVO"]):
            erros.append(f"linha {r}: depois da simulação incompleto")
        feitas.append((r, col["SITUACAO"], "duvidoso"))
        feitas.append((r, col["MOTIVO"], limpo(m["MOTIVO_NOVO"])))
    cods = collections.OrderedDict()
    for m in muds:
        cods.setdefault(limpo(m["CODIGO_BAP"]), []).append(m)
    unicas = len({(r, c) for r, c, _ in feitas})
    if len(muds) != LINHAS or len(cods) != CODIGOS or unicas != CELULAS:
        erros.append(f"{len(muds)} linhas, {len(cods)} códigos, {unicas} células únicas; esperado {LINHAS}, {CODIGOS}, "
                     f"{CELULAS}")
    if erros:
        print("[PARADO] nada foi gravado:")
        for e in erros[:30]:
            print("   ", e)
        sys.exit(2)
    for r, c, v in feitas:
        ws.cell(r, c).value = v

    lg = wb["LOG_CORRECOES"]
    if [limpo(c.value) for c in lg[1]][:5] != ["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"]:
        sys.exit("[PARADO] cabeçalho do LOG_CORRECOES mudou: nada foi gravado")
    ult = lg.max_row
    for i, (cod, ms) in enumerate(cods.items(), 1):
        veics = "; ".join(" ".join(x for x in (limpo(m["FABRICANTE"]), limpo(m["MODELO"]), limpo(m["VERSAO"])) if x)
                          for m in ms)
        obs = (f"VEICULOS: SITUACAO separado -> duvidoso em {len(ms)} linha(s) ({veics}): modelo numérico lido de data "
               f"ou medida; MOTIVO preenchido; sai do filtro do site até a revisão. T-0017 (v18), {DATA}")
        for j, v in enumerate(["VEICULO_DUVIDOSO", "VEICULOS", cod, None, obs], 1):
            lg.cell(ult + i, j).value = v

    lm = wb["LEIA-ME"]
    n = len(LEIA_ME)
    alturas = {r: d.height for r, d in lm.row_dimensions.items() if d.height}
    lm.insert_rows(1, n)
    for r in list(lm.row_dimensions):
        lm.row_dimensions[r].height = None
    for r, h in alturas.items():
        lm.row_dimensions[r + n].height = h
    for i, (a, b) in enumerate(LEIA_ME, 1):
        lm.cell(i, 1).value = a
        lm.cell(i, 2).value = b
    return {(r, c) for r, c, _ in feitas}, ult, n


def assinatura(c):
    return tuple(copy(getattr(c, k)) for k in ("font", "fill", "border", "alignment", "protection")) + (
        c.number_format,)


def comparar(novo: Path, velho: Path, celulas, log_ult, leia_n) -> list[str]:
    """Diferenças entre a base nova e a v17 fora das permitidas. Lista vazia = só o que a tarefa pede."""
    a, b = openpyxl.load_workbook(novo), openpyxl.load_workbook(velho)
    if a.sheetnames != b.sheetnames:
        return [f"abas: {a.sheetnames} x {b.sheetnames}"]
    dif, conta = [], collections.Counter()
    for nome in b.sheetnames:
        wa, wb_ = a[nome], b[nome]
        desloc, extra = 0, set()
        if nome == "LEIA-ME":
            desloc, extra = leia_n, set(range(1, leia_n + 1))
        if nome == "LOG_CORRECOES":
            extra = set(range(log_ult + 1, wa.max_row + 1))
        if wa.max_column != wb_.max_column:
            dif.append(f"{nome}: colunas {wa.max_column} x {wb_.max_column}")
        if wa.max_row != wb_.max_row + len(extra):
            dif.append(f"{nome}: linhas {wa.max_row} x {wb_.max_row} + {len(extra)}")
        if wa.freeze_panes != wb_.freeze_panes:
            dif.append(f"{nome}: freeze_panes")
        if wa.auto_filter.ref != wb_.auto_filter.ref:
            dif.append(f"{nome}: auto_filter")
        if {k: d.width for k, d in wa.column_dimensions.items()} != {k: d.width for k, d in wb_.column_dimensions.items()}:
            dif.append(f"{nome}: larguras de coluna")
        ha = {r: d.height for r, d in wa.row_dimensions.items() if d.height and r not in extra}
        hb = {r + desloc: d.height for r, d in wb_.row_dimensions.items() if d.height}
        if ha != hb:
            dif.append(f"{nome}: alturas de linha")
        for r in range(1, wb_.max_row + 1):
            for c in range(1, wb_.max_column + 1):
                ca, cb = wa.cell(r + desloc, c), wb_.cell(r, c)
                conta[nome] += 1
                if nome == "VEICULOS" and (r, c) in celulas:
                    if ca.value != cb.value:
                        conta["VEICULOS_mudou"] += 1
                    else:
                        dif.append(f"VEICULOS {cb.coordinate}: devia mudar e não mudou")
                    if assinatura(ca) != assinatura(cb):
                        dif.append(f"VEICULOS {cb.coordinate}: formatação mudou")
                    continue
                if ca.value != cb.value:
                    dif.append(f"{nome} {cb.coordinate}: valor mudou")
                elif assinatura(ca) != assinatura(cb):
                    dif.append(f"{nome} {cb.coordinate}: formatação mudou")
    prod = sum(1 for d in dif if d.startswith("PRODUTOS"))
    print(f"  comparação com a v17: PRODUTOS {conta['PRODUTOS']} células conferidas, {prod} diferentes; VEICULOS "
          f"{conta['VEICULOS']} células conferidas, {conta['VEICULOS_mudou']} mudaram (esperado {len(celulas)}); "
          f"LOG_CORRECOES +{a['LOG_CORRECOES'].max_row - log_ult} linhas; LEIA-ME +{leia_n} linhas; diferenças fora "
          f"do permitido: {len(dif)}")
    if conta["VEICULOS_mudou"] != len(celulas):
        dif.append(f"VEICULOS: {conta['VEICULOS_mudou']} células mudaram; esperado {len(celulas)}")
    return dif


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conferir", action="store_true", help="só compara a base de hoje com a v17")
    arg = ap.parse_args()
    muds = ler_simulacao()
    if arg.conferir:
        celulas, ult, n = aplicar(openpyxl.load_workbook(V17), muds)
        dif = comparar(BASE, V17, celulas, ult, n)
        for d in dif[:30]:
            print("   ", d)
        sys.exit(1 if dif else 0)
    if V18.exists():
        raise SystemExit(f"[PARADO] {V18.name} já existe: a v18 já foi gravada")
    if sha(BASE) != sha(V17):
        raise SystemExit("[PARADO] a base de hoje não é a v17: refaça a simulação")
    wb = openpyxl.load_workbook(BASE)
    celulas, ult, n = aplicar(wb, muds)
    with tempfile.TemporaryDirectory() as tmp:
        nova = Path(tmp) / BASE.name
        wb.save(nova)
        dif = comparar(nova, V17, celulas, ult, n)
        if dif:
            print("[PARADO] a base nova difere da v17 fora do que a tarefa pede (nada foi gravado):")
            for d in dif[:30]:
                print("   ", d)
            sys.exit(2)
        shutil.copyfile(nova, BASE)
        shutil.copyfile(nova, V18)
    print(f"  {BASE.relative_to(RAIZ)}: sha256 {sha(BASE)}")
    print(f"  {V18.relative_to(RAIZ)}: sha256 {sha(V18)}")


if __name__ == "__main__":
    main()
