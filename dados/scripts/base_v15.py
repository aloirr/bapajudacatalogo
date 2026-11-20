"""v15 da base unificada · T-0007 (Terminal Axial com código só de número e Cruzetas) + T-0009 (TER556556).

Aprovado pelo Alexandre em 20/11/2026 10h00 (Manaus), R-20261120-100005-alexandre, opção 2a:
"PR #8 aprovado na simulação da v15 (T-0007 + T-0009 + Cruzetas + os 2 extras)".

O que faz (regra 4 do CLAUDE.md):
1. Aplica na aba PRODUTOS exatamente as células da aba ANTES_DEPOIS da simulação aprovada
   (dados/simulacoes/T-0007/Simulacao_T-0007_Terminal_Axial.xlsx), conferindo antes que o "antes" de cada uma
   ainda é o valor da base. Se algum não bater, para sem gravar nada.
2. Acrescenta no fim da aba LOG_CORRECOES as linhas da aba LOG_CORRECOES_PREVISTO (nenhuma linha antiga sai).
3. Acrescenta no topo da aba LEIA-ME o título da v15 com o resumo (como a v14 fez); nada sai, as linhas
   antigas descem junto com a altura de linha delas.
4. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v15.xlsx.
5. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v14: só podem mudar as
   células da simulação, as linhas novas do LOG_CORRECOES e as do LEIA-ME.

Uso: python3 dados/scripts/base_v15.py            (grava)
     python3 dados/scripts/base_v15.py --conferir (só compara a base de hoje com a v14)
"""
from __future__ import annotations

import argparse
import hashlib
import re
import shutil
import sys
import tempfile
from copy import copy
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
V14 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v14.xlsx"
V15 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v15.xlsx"
SIM = RAIZ / "dados" / "simulacoes" / "T-0007" / "Simulacao_T-0007_Terminal_Axial.xlsx"

CELULAS = 160  # aprovadas: 157 NO_CATALOGO_DIGITAL + 2 APLICACAO + 1 REFERENCIAS_CRUZADAS
ESPERADO = {"NO_CATALOGO_DIGITAL": 157, "APLICACAO": 2, "REFERENCIAS_CRUZADAS": 1}

# O "antes" do TER556556 na simulação não copia o preço (é um marcador): confere-se que o texto da base é
# o texto de preço ("R$ ...+ Detalhes") e não o valor literal.
MARCADOR_PRECO = "texto de preço, R$ nnn.nn+ Detalhes"
PRECO = re.compile(r"R\$ \d+[.,]\d{2}\+ Detalhes")  # a célula inteira tem de ser só esse texto

LEIA_ME = [
    ("BASE BAP UNIFICADA v15 (20/11/2026)", None),
    ("NO_CATALOGO_DIGITAL", "157 linhas saem do site (SIM -> NÃO) e ficam na base com o texto original (T-0007): "
                            "152 terminais axiais com código só de número (duplicatas do TAX do cabeçalho "
                            "\"BAPTA PN\"), 2 cubos de roda (74 e 83 = CUB60074 e CUB60084) e 3 linhas da tabela de "
                            "aplicação do CRU100 (Veículo, HYUNDAI e KIA MOTORS)."),
    ("APLICACAO", "TER556556: o texto de preço saiu e o campo ficou vazio (T-0009). TAX10116: voltaram os modelos "
                  "206 e 207 (T-0007)."),
    ("REFERENCIAS_CRUZADAS", "CRU100: HYUNDAI: 491404A500 acrescentada no fim; nenhuma referência tirada (T-0007)."),
    ("Formato", "Formato igual ao da v14 (mesmas abas e colunas). 160 células mudadas, uma linha por código no "
                "LOG_CORRECOES. Das 5 primeiras colunas, que a BAP Central lê, mudam 3 células: APLICACAO do "
                "TER556556 e do TAX10116 e REFERENCIAS_CRUZADAS do CRU100. Aprovado pelo Alexandre em 20/11/2026."),
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
        if antes == MARCADOR_PRECO:
            ok = (cod == "TER556556" and coluna == "APLICACAO" and isinstance(atual, str)
                  and PRECO.fullmatch(atual) is not None)
        else:
            ok = limpo(atual) == antes and (atual is None or str(atual) == antes)
        if not ok:
            erros.append(f"{cod} {coluna}: o 'antes' da simulação não é mais o valor da base")
        feitas.append((r, col[coluna], m["VALOR_DEPOIS"] if limpo(m["VALOR_DEPOIS"]) else None, cod, coluna))
    conta = {}
    for *_, coluna in feitas:
        conta[coluna] = conta.get(coluna, 0) + 1
    if len(feitas) != CELULAS or conta != ESPERADO:
        erros.append(f"células: {len(feitas)} {conta}; esperado {CELULAS} {ESPERADO}")
    if len({(r, c) for r, c, *_ in feitas}) != len(feitas):
        erros.append("célula repetida na simulação")
    if len(log) != CELULAS:
        erros.append(f"LOG_CORRECOES_PREVISTO com {len(log)} linhas; esperado {CELULAS}")
    if sorted(limpo(l[2]) for l in log) != sorted(cod for *_, cod, _ in feitas):
        erros.append("LOG_CORRECOES_PREVISTO não tem uma linha por célula mudada")
    if any("20/11/2026" not in limpo(l[4]) for l in log):
        erros.append("LOG_CORRECOES_PREVISTO com linha sem a data do aprovado (20/11/2026)")
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
    """Diferenças entre a base nova e a v14, fora das permitidas. Lista vazia = só o que a tarefa pede."""
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
    print(f"  comparação com a v14: PRODUTOS {mudou['PRODUTOS']} células, LOG_CORRECOES +{mudou['LOG_CORRECOES']} "
          f"linhas, LEIA-ME +{mudou['LEIA-ME']} linhas; diferenças fora disso: {len(dif)}")
    return dif


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conferir", action="store_true", help="só compara a base de hoje com a v14")
    a = ap.parse_args()
    muds, log = ler_simulacao()
    if a.conferir:
        # refaz a aplicação na memória, a partir da v14 (sem gravar), só para saber quais células podem mudar
        celulas, ult, n = aplicar(openpyxl.load_workbook(V14), muds, log)
        dif = comparar(BASE, V14, celulas, ult, n)
        for d in dif[:30]:
            print("   ", d)
        sys.exit(1 if dif else 0)
    if V15.exists():
        raise SystemExit(f"[PARADO] {V15.name} já existe: a v15 já foi gravada")
    if sha(BASE) != sha(V14):
        raise SystemExit("[PARADO] a base de hoje não é a v14: refaça a simulação")
    wb = openpyxl.load_workbook(BASE)
    celulas, ult, n = aplicar(wb, muds, log)
    with tempfile.TemporaryDirectory() as tmp:
        nova = Path(tmp) / BASE.name
        wb.save(nova)
        dif = comparar(nova, V14, celulas, ult, n)
        if dif:
            print("[PARADO] a base nova difere da v14 fora do que a tarefa pede (nada foi gravado):")
            for d in dif[:30]:
                print("   ", d)
            sys.exit(2)
        shutil.copyfile(nova, BASE)
        shutil.copyfile(nova, V15)
    print(f"  {BASE.relative_to(RAIZ)}: sha256 {sha(BASE)}")
    print(f"  {V15.relative_to(RAIZ)}: sha256 {sha(V15)}")


if __name__ == "__main__":
    main()
