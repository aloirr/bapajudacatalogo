"""v16 da base unificada · T-0010 (pastilhas PAFnnnn x PAF.nnnn: unificar e mostrar os dois códigos).

Aprovado pelo Alexandre em 20/11/2026 10h27 (Manaus), R-20261120-102732-alexandre, "1a": "aprovado" na
simulação da T-0010 (PR #13, dados/simulacoes/T-0010/Simulacao_T-0010_PAF.xlsx). Decisões que a simulação já
traz: R-20261120-100733-alexandre (unificar e mostrar os dois), R-20261120-100937-alexandre (PAF0116 dianteira e
traseira) e R-20261120-102312-alexandre (texto do PAF0054 aceito).

O que faz (regra 4 do CLAUDE.md), como o base_v15.py:
1. Aplica na aba PRODUTOS exatamente as 209 células da aba ANTES_DEPOIS da simulação aprovada, conferindo antes
   que o "antes" de cada uma ainda é o valor da base (v15). Se algum não bater, para sem gravar nada.
2. Acrescenta no fim da aba LOG_CORRECOES as 206 linhas da aba LOG_CORRECOES_PREVISTO (nenhuma linha antiga sai).
3. Acrescenta no topo da aba LEIA-ME o título da v16 com o resumo; nada sai, as linhas antigas descem junto com a
   altura de linha delas.
4. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v16.xlsx.
5. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v15: só podem mudar as
   células da simulação, as linhas novas do LOG_CORRECOES e as do LEIA-ME.

Uso: python3 dados/scripts/base_v16.py            (grava)
     python3 dados/scripts/base_v16.py --conferir (só compara a base de hoje com a v15)
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
import tempfile
from copy import copy
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
V15 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v15.xlsx"
V16 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v16.xlsx"
SIM = RAIZ / "dados" / "simulacoes" / "T-0010" / "Simulacao_T-0010_PAF.xlsx"

CELULAS = 209  # aprovadas: 103 NO_CATALOGO_DIGITAL + 103 REFERENCIAS_CRUZADAS + 2 DETALHE_CATALOGO + 1 POSICAO
ESPERADO = {"NO_CATALOGO_DIGITAL": 103, "REFERENCIAS_CRUZADAS": 103, "DETALHE_CATALOGO": 2, "POSICAO": 1}
LINHAS_LOG = 206  # uma por código: 103 PAF.nnnn (NO_CATALOGO_DIGITAL) + 103 PAFnnnn (CODIGO_UNIFICADO)

LEIA_ME = [
    ("BASE BAP UNIFICADA v16 (20/11/2026)", None),
    ("NO_CATALOGO_DIGITAL", "103 pastilhas de freio PAF.nnnn (98 PAF.nnnn e 5 PAF.nnnnS, código com ponto do ERP) "
                            "saem do site (SIM -> NÃO): são o mesmo produto do PAFnnnn (troca interna de "
                            "fabricante). Continuam ATIVO na base, com todos os campos como estavam (T-0010)."),
    ("REFERENCIAS_CRUZADAS", "103 PAFnnnn: \"BAP: PAF.nnnn\" acrescentado no fim, para o site mostrar os dois "
                             "códigos na ficha e achar o produto pelos dois; nenhuma referência tirada (T-0010)."),
    ("POSICAO", "PAF0116: DIANTEIRO -> DIANTEIRO E TRASEIRO, decisão do Alexandre (T-0010)."),
    ("DETALHE_CATALOGO", "PAF0054: \"Diant.\" -> \"Diant. · Sistema Vargas TRW pequena\" (da descrição do ERP do "
                         "PAF.0054). PAF0116: \"Diant.\" -> \"Diant./Tras.\" (T-0010)."),
    ("Formato", "Formato igual ao da v15 (mesmas abas e colunas). 209 células mudadas, 206 linhas no "
                "LOG_CORRECOES (uma por código). Das 5 primeiras colunas, que a BAP Central lê, mudam 103 células: "
                "REFERENCIAS_CRUZADAS (coluna 4) dos 103 PAFnnnn. Aprovado pelo Alexandre em 20/11/2026."),
    (None, None),
]


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def ler_simulacao():
    wb = openpyxl.load_workbook(SIM, read_only=True)
    ad = list(wb["ANTES_DEPOIS"].iter_rows(values_only=True))
    cab = list(ad[0])
    muds = [dict(zip(cab, r)) for r in ad[1:] if any(v is not None for v in r)]
    log = [list(r) for r in list(wb["LOG_CORRECOES_PREVISTO"].iter_rows(values_only=True))[1:]
           if any(v is not None for v in r)]
    wb.close()
    return muds, log


def aplicar(wb, muds, log):
    ws = wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    col = {c: i + 1 for i, c in enumerate(cab)}
    linha = {limpo(ws.cell(r, 1).value): r for r in range(2, ws.max_row + 1)}
    erros, feitas = [], []
    for m in muds:
        cod, coluna = limpo(m["CODIGO"]), m["COLUNA"]
        r = linha.get(cod)
        if r is None:
            erros.append(f"{cod}: não está na PRODUTOS")
            continue
        if m["LINHA_NA_BASE"] != r:
            erros.append(f"{cod}: linha {r} na base, {m['LINHA_NA_BASE']} na simulação")
        atual = ws.cell(r, col[coluna]).value
        antes = limpo(m["VALOR_ANTES"])
        if not (limpo(atual) == antes and (atual is None or str(atual) == antes)):
            erros.append(f"{cod} {coluna}: o 'antes' da simulação não é mais o valor da base")
        if coluna == "REFERENCIAS_CRUZADAS" and m["VALOR_DEPOIS"] != f"{antes}; BAP: {limpo(m['PAR'])}":
            erros.append(f"{cod}: o 'depois' das REFERENCIAS_CRUZADAS não é o 'antes' + '; BAP: {m['PAR']}'")
        feitas.append((r, col[coluna], m["VALOR_DEPOIS"] if limpo(m["VALOR_DEPOIS"]) else None, cod, coluna))
    conta = {}
    for *_, coluna in feitas:
        conta[coluna] = conta.get(coluna, 0) + 1
    if len(feitas) != CELULAS or conta != ESPERADO:
        erros.append(f"células: {len(feitas)} {conta}; esperado {CELULAS} {ESPERADO}")
    if len({(r, c) for r, c, *_ in feitas}) != len(feitas):
        erros.append("célula repetida na simulação")
    if len(log) != LINHAS_LOG:
        erros.append(f"LOG_CORRECOES_PREVISTO com {len(log)} linhas; esperado {LINHAS_LOG}")
    if sorted(limpo(l[2]) for l in log) != sorted({cod for *_, cod, _ in feitas}):
        erros.append("LOG_CORRECOES_PREVISTO não tem uma linha por código mudado")
    if any("20/11/2026" not in limpo(l[4]) or "T-0010" not in limpo(l[4]) for l in log):
        erros.append("LOG_CORRECOES_PREVISTO com linha sem a tarefa (T-0010) ou a data do aprovado (20/11/2026)")
    if erros:
        print("[PARADO] nada foi gravado:")
        for e in erros:
            print("   ", e)
        sys.exit(2)
    for r, c, depois, *_ in feitas:
        ws.cell(r, c).value = depois

    lg = wb["LOG_CORRECOES"]
    ult = lg.max_row
    for i, l in enumerate(log, 1):
        for j, v in enumerate(l[:5], 1):
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
    return {(r, c) for r, c, *_ in feitas}, ult, n


def assinatura(c):
    # o StyleProxy do openpyxl não compara por valor: copy() devolve o objeto de estilo, que compara por valor
    return tuple(copy(getattr(c, k)) for k in ("font", "fill", "border", "alignment", "protection")) + (
        c.number_format,)


def comparar(novo: Path, velho: Path, celulas=None, log_ult=None, leia_n=None) -> list[str]:
    """Diferenças entre a base nova e a v15, fora das permitidas. Lista vazia = só o que a tarefa pede."""
    a, b = openpyxl.load_workbook(novo), openpyxl.load_workbook(velho)
    dif = []
    if a.sheetnames != b.sheetnames:
        return [f"abas: {a.sheetnames} x {b.sheetnames}"]
    mudou = {"PRODUTOS": 0, "LOG_CORRECOES": 0, "LEIA-ME": 0}
    for nome in a.sheetnames:
        wa, wb_ = a[nome], b[nome]
        desloc, extra = 0, set()
        if nome == "LEIA-ME" and leia_n:
            desloc = leia_n
            extra = set(range(1, leia_n + 1))
        if nome == "LOG_CORRECOES" and log_ult:
            extra = set(range(log_ult + 1, wa.max_row + 1))
        if wa.max_column != wb_.max_column:
            dif.append(f"{nome}: colunas {wa.max_column} x {wb_.max_column}")
        if wa.max_row != wb_.max_row + len(extra):
            dif.append(f"{nome}: linhas {wa.max_row} x {wb_.max_row} + {len(extra)}")
        for attr in ("freeze_panes",):
            if getattr(wa, attr) != getattr(wb_, attr):
                dif.append(f"{nome}: {attr}")
        if wa.auto_filter.ref != wb_.auto_filter.ref:
            dif.append(f"{nome}: auto_filter")
        la = {k: d.width for k, d in wa.column_dimensions.items()}
        lb = {k: d.width for k, d in wb_.column_dimensions.items()}
        if la != lb:
            dif.append(f"{nome}: larguras de coluna")
        ha = {r: d.height for r, d in wa.row_dimensions.items() if d.height and r not in extra}
        hb = {r + desloc: d.height for r, d in wb_.row_dimensions.items() if d.height}
        if ha != hb:
            dif.append(f"{nome}: alturas de linha")
        for r in range(1, wb_.max_row + 1):
            for c in range(1, wb_.max_column + 1):
                ca, cb = wa.cell(r + desloc, c), wb_.cell(r, c)
                if nome == "PRODUTOS" and celulas and (r, c) in celulas:
                    if ca.value != cb.value:
                        mudou["PRODUTOS"] += 1
                    else:
                        dif.append(f"PRODUTOS {ca.coordinate}: devia mudar e não mudou")
                    if assinatura(ca) != assinatura(cb):
                        dif.append(f"PRODUTOS {ca.coordinate}: formatação mudou")
                    continue
                if ca.value != cb.value:
                    dif.append(f"{nome} {ca.coordinate}: valor mudou")
                elif assinatura(ca) != assinatura(cb):
                    dif.append(f"{nome} {ca.coordinate}: formatação mudou")
        if nome in ("LOG_CORRECOES", "LEIA-ME"):
            mudou[nome] = len(extra)
    if celulas is not None and mudou["PRODUTOS"] != len(celulas):
        dif.append(f"PRODUTOS: {mudou['PRODUTOS']} células mudaram; esperado {len(celulas)}")
    print(f"  comparação com a v15: PRODUTOS {mudou['PRODUTOS']} células, LOG_CORRECOES +{mudou['LOG_CORRECOES']} "
          f"linhas, LEIA-ME +{mudou['LEIA-ME']} linhas; diferenças fora disso: {len(dif)}")
    return dif


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conferir", action="store_true", help="só compara a base de hoje com a v15")
    a = ap.parse_args()
    muds, log = ler_simulacao()
    if a.conferir:
        # refaz a aplicação na memória, a partir da v15 (sem gravar), só para saber quais células podem mudar
        celulas, ult, n = aplicar(openpyxl.load_workbook(V15), muds, log)
        dif = comparar(BASE, V15, celulas, ult, n)
        for d in dif[:30]:
            print("   ", d)
        sys.exit(1 if dif else 0)
    if V16.exists():
        raise SystemExit(f"[PARADO] {V16.name} já existe: a v16 já foi gravada")
    if sha(BASE) != sha(V15):
        raise SystemExit("[PARADO] a base de hoje não é a v15: refaça a simulação")
    wb = openpyxl.load_workbook(BASE)
    celulas, ult, n = aplicar(wb, muds, log)
    with tempfile.TemporaryDirectory() as tmp:
        nova = Path(tmp) / BASE.name
        wb.save(nova)
        dif = comparar(nova, V15, celulas, ult, n)
        if dif:
            print("[PARADO] a base nova difere da v15 fora do que a tarefa pede (nada foi gravado):")
            for d in dif[:30]:
                print("   ", d)
            sys.exit(2)
        shutil.copyfile(nova, BASE)
        shutil.copyfile(nova, V16)
    print(f"  {BASE.relative_to(RAIZ)}: sha256 {sha(BASE)}")
    print(f"  {V16.relative_to(RAIZ)}: sha256 {sha(V16)}")


if __name__ == "__main__":
    main()
