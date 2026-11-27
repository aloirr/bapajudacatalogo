"""v29 da base unificada · T-0040 (aplicação da Fraga na aba VEICULOS).

Decisões do Alexandre (pelo po, 27/11/2026, "1) a / 2) a / 3) a"):
- 1a: os 3.909 códigos achados pela Fraga pelo código BAP ('bap') ficam com a aplicação da Fraga na VEICULOS;
- 2a: uma linha por código + montadora + modelo + motor, com o ano mínimo e o máximo;
- 3a: os 27 achados por referência não trocam nada; os 483 não achados ficam como estão.
A simulação é a de dados/T-0040/simulacao/ (commit 9b11dd1, dados/scripts/simular_T0040.py), com a correção do
sufixo "1" no motor da Fraga (commit 6b32eb8: "MONOCILÍNDRICO1" -> "MONOCILÍNDRICO", 16 códigos): a VEICULOS da v29
é, linha a linha, a da BASE_simulada_v29.xlsx.

AUTORIZAÇÃO: pendente do aprovado do Alexandre (simulação 9b11dd1). Depois do aprovado, só se troca o texto de
AUTORIZACAO (abaixo, no LOG_CORRECOES e no LEIA-ME).

O que faz (regra 4 do CLAUDE.md):
1. VEICULOS: as linhas dos 3.909 códigos saem e entram as da Fraga (ORIGEM "Fraga T-0040"), no lugar em que o código
   aparecia; as linhas dos outros códigos ficam iguais e na mesma ordem. As mesmas 11 colunas; o filtro vai até a nova
   última linha;
2. PRODUTOS e as outras abas não mudam. A APLICACAO (campo digitado) NÃO é reescrita: o site passa a ler a VEICULOS;
3. uma linha no LOG_CORRECOES por código trocado (TIPO VEICULO_TROCADO) e o bloco da v29 no topo do LEIA-ME;
4. compara a base nova com a v28 (base_comum.comparar, fora a VEICULOS) e a VEICULOS com a da simulação, célula a
   célula (valor e formatação), e grava a base e a cópia em dados/versoes/.

Uso: python3 dados/scripts/base_v29.py
"""
from __future__ import annotations

import sys
import tempfile
from copy import copy
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (BASE, CAB_VEICULOS, RAIZ, acrescentar_leia_me, acrescentar_log, assinatura,  # noqa: E402
                        comparar, conferir_cabecalho, gravar, limpo, linhas_novas, parar, sha, versao)
from simular_T0040 import faixa  # noqa: E402

SIM = RAIZ / "dados" / "T-0040" / "simulacao" / "BASE_simulada_v29.xlsx"
TAREFA, DATA, ORIGEM = "T-0040", "27/11/2026", "Fraga T-0040"
SIM_COMMIT = "9b11dd1"
AUTORIZACAO = f"pendente do aprovado do Alexandre (simulação {SIM_COMMIT})"
SIM_CORRECAO = "6b32eb8"
N_TROCADOS = 3909
# os 16 códigos em que a simulação 9b11dd1 tinha o motor com o "1" da Fraga (aba SUFIXO_1 da antes_depois)
COM_SUFIXO = ["110/70-17 54S V456F", "110/90-17 60P V307", "130/70-17 62S V456R", "140/70-17 66S V456R",
              "2.75-18 42P V250F", "60/100-17 33P V250F", "80/100-14 49P V250R", "80/100-18 47P V425F",
              "90/90-18 51P V425R", "90/90-18 57P V250R", "90/90-19 52P V307", "CAR10", "FAR6365", "FLU6112",
              "ROL6004-2Z", "ROL6202-2Z"]
SUFIXO = ("motor sem o '1' grudado no fim que vem no CSV da Fraga ('MONOCILÍNDRICO1' -> 'MONOCILÍNDRICO'; "
          f"simulação corrigida em {SIM_CORRECAO})")

LEIA_ME = [
    ("BASE BAP UNIFICADA v29 (27/11/2026)", None),
    ("VEICULOS (3.909 códigos)", "A aplicação dos 3.909 códigos achados pela Fraga pelo código BAP passa a ser a da "
                                 "Fraga: uma linha por montadora + modelo + motor, com o ano mínimo e o máximo "
                                 "(ORIGEM 'Fraga T-0040', valor novo). Os 27 achados por referência e os 483 não "
                                 "achados ficam como estavam (T-0040)."),
    ("APLICACAO", "O texto da APLICACAO na PRODUTOS não muda (campo digitado; reescrever depende de decisão do "
                  "Alexandre). O site lê a VEICULOS."),
    ("Correção da Fraga", "Em 16 códigos (motos), o motor vem da Fraga com um '1' grudado no fim "
                          "('MONOCILÍNDRICO1'): na VEICULOS entra sem o '1' (T-0040)."),
    ("Formato", f"Mesmas abas e colunas da v28 (VEICULOS com 11 colunas). Uma linha por código trocado no "
                f"LOG_CORRECOES. Simulação em dados/T-0040/simulacao/ ({SIM_COMMIT}). Autorização: {AUTORIZACAO}."),
    (None, None),
]


def ler_sim() -> tuple[list[tuple], set[str]]:
    """As linhas da VEICULOS da simulação e os códigos trocados (os com ORIGEM 'Fraga T-0040')."""
    wb = openpyxl.load_workbook(SIM, read_only=True)
    linhas = list(wb["VEICULOS"].iter_rows(values_only=True))
    wb.close()
    if [limpo(c) for c in linhas[0]] != CAB_VEICULOS:
        raise SystemExit("[PARADO] cabeçalho da VEICULOS da simulação mudou")
    io = CAB_VEICULOS.index("ORIGEM")
    trocados = {limpo(r[0]).upper() for r in linhas[1:] if r[io] == ORIGEM}
    if len(trocados) != N_TROCADOS:
        raise SystemExit(f"[PARADO] a simulação tem {len(trocados)} códigos trocados; esperado {N_TROCADOS}")
    return linhas[1:], trocados


def main():
    v28, v29 = versao(28), versao(29)
    if v29.exists():
        raise SystemExit(f"[PARADO] {v29.name} já existe: a v29 já foi gravada")
    sha_antes = sha(BASE)
    if sha_antes != sha(v28):
        raise SystemExit("[PARADO] a base de hoje não é a v28: refaça a simulação")
    novas, trocados = ler_sim()

    wb = openpyxl.load_workbook(BASE)
    ws = wb["VEICULOS"]
    conferir_cabecalho(ws, CAB_VEICULOS)
    io, isit = CAB_VEICULOS.index("ORIGEM"), CAB_VEICULOS.index("SITUACAO")
    antigas = [tuple(r) for r in ws.iter_rows(min_row=2, values_only=True)]
    cods_prod = {limpo(r[0]).upper() for r in wb["PRODUTOS"].iter_rows(min_row=2, values_only=True) if limpo(r[0])}

    erros = []
    if trocados - cods_prod:
        erros.append(f"códigos trocados fora da PRODUTOS: {sorted(trocados - cods_prod)[:10]}")
    if [r for r in antigas if limpo(r[0]).upper() not in trocados] != \
            [r for r in novas if limpo(r[0]).upper() not in trocados]:
        erros.append("as linhas dos códigos fora da troca não são iguais às da v28 (mesma ordem)")
    if any(r[io] != ORIGEM for r in novas if limpo(r[0]).upper() in trocados):
        erros.append("código trocado com linha de ORIGEM diferente de 'Fraga T-0040'")
    if any(r[io] == ORIGEM for r in antigas):
        erros.append("a v28 já tem ORIGEM 'Fraga T-0040'")
    parar(erros)

    # 1. VEICULOS: os valores da simulação, com a formatação da linha 2 da v28 em cada coluna
    modelo = [copy(ws.cell(2, c)._style) for c in range(1, 12)]
    if ws.max_row > len(novas) + 1:
        ws.delete_rows(len(novas) + 2, ws.max_row - len(novas) - 1)
    for i, r in enumerate(novas, 2):
        for c, v in enumerate(r, 1):
            cel = ws.cell(i, c)
            cel.value = v
            cel._style = copy(modelo[c - 1])
    ws.auto_filter.ref = f"A1:K{len(novas) + 1}"

    # 3. LOG_CORRECOES: uma linha por código trocado
    antes_c, depois_c = {}, {}
    for r in antigas:
        antes_c.setdefault(limpo(r[0]).upper(), []).append(r)
    for r in novas:
        depois_c.setdefault(limpo(r[0]).upper(), []).append(r)
    sufixo = set(COM_SUFIXO)
    if not sufixo <= trocados or any(r[3] and "MONOCILÍNDRICO1" in r[3] for r in novas):
        parar(["correção do sufixo '1': código fora da troca ou ainda há 'MONOCILÍNDRICO1' na simulação"])
    log = []
    for cod in sorted(trocados):
        an, de = antes_c.get(cod, []), depois_c[cod]
        sep = sum(1 for r in de if r[isit] == "separado")
        anos_antes = faixa([(r[4], r[5]) for r in an]) if an else "sem linha"
        log.append(["VEICULO_TROCADO", "VEICULOS", cod, None,
                    f"VEICULOS: {len(an)} linha(s) de antes trocada(s) por {len(de)} da Fraga ({sep} separada(s), "
                    f"{len(de) - sep} duvidosa(s)), uma por montadora + modelo + motor, com o ano mínimo e o máximo "
                    f"(decisões 1a e 2a); ORIGEM 'Fraga T-0040'; anos antes {anos_antes}, depois "
                    f"{faixa([(r[4], r[5]) for r in de])}{'; ' + SUFIXO if cod in sufixo else ''}. APLICACAO da PRODUTOS sem mudança. Fonte: Fraga T-0040. "
                    f"Simulação em dados/T-0040/simulacao/ ({SIM_COMMIT}). Autorização: {AUTORIZACAO}. "
                    f"{TAREFA} (v29), {DATA}"])
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  VEICULOS: {len(antigas)} linhas antes, {len(novas)} depois; códigos trocados: {len(trocados)}; "
          f"LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")

    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / BASE.name
        wb.save(p)
        # 4. fora da VEICULOS: só o LOG_CORRECOES (no fim) e o LEIA-ME (no topo) mudam
        dif = [d for d in comparar(p, v28, {}, ult, "v28", leia_n=leia_n) if not d.startswith("VEICULOS")]
        esperado, achado = linhas_novas(wb, ult, leia_n), linhas_novas(openpyxl.load_workbook(p), ult, leia_n)
        dif += [f"{aba}: o texto das linhas novas não é o que o script escreve" for aba in esperado
                if achado[aba] != esperado[aba]]
        # a VEICULOS gravada: igual à da simulação, com a formatação, as larguras e o congelamento da v28
        a, b = openpyxl.load_workbook(p)["VEICULOS"], openpyxl.load_workbook(v28)["VEICULOS"]
        if [tuple(r) for r in a.iter_rows(min_row=2, values_only=True)] != novas:
            dif.append("VEICULOS: as linhas não são as da simulação")
        if [c.value for c in a[1]] != [c.value for c in b[1]] or a.max_column != 11:
            dif.append("VEICULOS: cabeçalho ou número de colunas mudou")
        if a.freeze_panes != b.freeze_panes or a.auto_filter.ref != f"A1:K{len(novas) + 1}":
            dif.append("VEICULOS: congelamento ou filtro")
        if {k: d.width for k, d in a.column_dimensions.items()} != {k: d.width for k, d in b.column_dimensions.items()}:
            dif.append("VEICULOS: larguras de coluna")
        forma = [assinatura(b.cell(2, c)) for c in range(1, 12)]
        if any(assinatura(a.cell(r, c)) != forma[c - 1] for r in range(2, a.max_row + 1) for c in range(1, 12)):
            dif.append("VEICULOS: formatação de célula diferente da v28")
        if sha(BASE) != sha_antes:
            dif.append("a base mudou durante a gravação")
        parar(dif)
        gravar(p, v29)
    print(f"  sha256 antes (v28): {sha_antes}")


if __name__ == "__main__":
    main()
