"""v28 da base unificada · T-0031, item 4a (o "Cargo" do Fiat Doblò lido como o caminhão Ford Cargo).

Aprovado em R-20261123-141744-po ("… 13) a 14) a 15) a 16) a"): 13 a (BIE20042 LEVE e a linha "FORD Cargo" dele
duvidosa), 14 a (os 5 da mesma causa: BOR11030, AMT7084, AMT7115, BAN9513 e BAN9516 LEVE) e 15 a (FAC6260 fica).
A simulação é a de dados/simulacoes/T-0031/ (abas ANTES_E_DEPOIS e MESMA_CAUSA_FORA_DO_PEDIDO, as aprovadas).

O que faz (regra 4 do CLAUDE.md):
1. PRODUTOS: a LINHA dos 6 códigos (BIE20042 e BOR11030 PESADA -> LEVE; AMT7084, AMT7115, BAN9513 e BAN9516
   LEVE E PESADA -> LEVE);
2. VEICULOS: a linha "FORD Cargo" do BIE20042 e a do BOR11030, SITUACAO separado -> duvidoso e o MOTIVO (padrão
   VEICULO_DUVIDOSO da T-0017). Nenhuma linha sai;
3. uma linha no LOG_CORRECOES por código e aba (8) e o bloco da v28 no topo do LEIA-ME, como da v20 à v27;
4. compara célula a célula a base nova com a v27 (base_comum.rodar) e grava a base e a cópia em dados/versoes/.
A conferência do ANTES e a gravação das células são as do base_comum (conferir_antes e escrever, RD-0545); a coluna
da VEICULOS vem sempre pelo nome (CAB_VEICULOS).

Uso: python3 dados/scripts/base_v28.py            (grava)
     python3 dados/scripts/base_v28.py --conferir (só compara a base de hoje com a v27)
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (CAB_VEICULOS, RAIZ, acrescentar_leia_me, acrescentar_log, conferir_antes,  # noqa: E402
                        conferir_cabecalho, conferir_celulas, escrever, ler_antes_depois, limpo, linhas_por_codigo,
                        parar, rodar)

SIM = RAIZ / "dados" / "simulacoes" / "T-0031" / "SIMULACAO_T-0031_aplicacoes_linha_pesada.xlsx"
ABAS_SIM = ("ANTES_E_DEPOIS", "MESMA_CAUSA_FORA_DO_PEDIDO")     # as duas aprovadas (13 a e 14 a)
TAREFA, DATA = "T-0031", "23/11/2026"
APROVACAO = "R-20261123-141744-po ('13) a 14) a 15) a 16) a')"
CAB = ["ABA", "LINHA_NA_PLANILHA", "CODIGO_BAP", "PRODUTO_OU_VEICULO", "COLUNA", "ANTES", "DEPOIS",
       "APLICACAO (não muda)", "MOTIVO_E_FONTE"]

# o que foi aprovado
LINHA = {"BIE20042": ("PESADA", "LEVE"), "BOR11030": ("PESADA", "LEVE"), "AMT7084": ("LEVE E PESADA", "LEVE"),
         "AMT7115": ("LEVE E PESADA", "LEVE"), "BAN9513": ("LEVE E PESADA", "LEVE"),
         "BAN9516": ("LEVE E PESADA", "LEVE")}
VEICULO = {"BIE20042": 7959, "BOR11030": 6504}                    # linha da "FORD Cargo" na VEICULOS
MOTIVO = ("'Cargo' aqui é o Doblò Cargo (versão do Fiat), não o caminhão Ford Cargo; sai do filtro do site até a "
          "revisão")

LEIA_ME = [
    ("BASE BAP UNIFICADA v28 (23/11/2026)", None),
    ("LINHA (6 itens)", "O 'Cargo' do Fiat Doblò não é o caminhão Ford Cargo: BIE20042 e BOR11030 PESADA → LEVE; "
                        "AMT7084, AMT7115, BAN9513 e BAN9516 LEVE E PESADA → LEVE (T-0031)."),
    ("VEICULOS (2 linhas)", "A linha 'FORD Cargo' do BIE20042 e a do BOR11030: separado → duvidoso, com MOTIVO; sai do "
                            "filtro do site até a revisão. Nenhuma linha sai (T-0031)."),
    ("Formato", "Mesmas abas e colunas da v27. 8 linhas no LOG_CORRECOES (uma por código e aba). "
                f"Aprovado em {APROVACAO}."),
    (None, None),
]


def ler() -> list[dict]:
    """As células das duas abas aprovadas da simulação, conferidas com o que foi aprovado."""
    cel = [x for aba in ABAS_SIM for x in ler_antes_depois(SIM, CAB, aba)]
    achado_p = {x["CODIGO_BAP"]: (x["ANTES"], x["DEPOIS"]) for x in cel if x["ABA"] == "PRODUTOS"
                and x["COLUNA"] == "LINHA"}
    achado_v = {(x["CODIGO_BAP"], x["LINHA_NA_PLANILHA"], x["COLUNA"], x["ANTES"], x["DEPOIS"])
                for x in cel if x["ABA"] == "VEICULOS"}
    esperado_v = {t for c, n in VEICULO.items() for t in ((c, n, "SITUACAO", "separado", "duvidoso"),
                                                           (c, n, "MOTIVO", None, MOTIVO))}
    erros = []
    if achado_p != LINHA or sum(x["ABA"] == "PRODUTOS" for x in cel) != len(LINHA):
        erros.append(f"PRODUTOS: não é o aprovado ({achado_p})")
    if achado_v != esperado_v or sum(x["ABA"] == "VEICULOS" for x in cel) != len(esperado_v):
        erros.append(f"VEICULOS: não é o aprovado ({achado_v})")
    if any(x["ABA"] == "VEICULOS" and x["PRODUTO_OU_VEICULO"] != "FORD Cargo" for x in cel):
        erros.append("VEICULOS: só a linha 'FORD Cargo'")
    parar(erros)
    return cel


def aplicar(wb, cel):
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    conferir_cabecalho(wv, CAB_VEICULOS)
    cp = [limpo(c.value) for c in wp[1]]
    il = cp.index("LINHA") + 1
    iv = {k: i + 1 for i, k in enumerate(CAB_VEICULOS)}
    linha_p = linhas_por_codigo(wp)
    origem = f"Simulação em dados/simulacoes/{TAREFA}/; aprovado em {APROVACAO}. {TAREFA} (v28), {DATA}"
    erros, fp, fv, log = [], {}, {}, []
    for x in cel:
        if x["ABA"] != "PRODUTOS":
            continue
        cod, n, antes, depois = x["CODIGO_BAP"], x["LINHA_NA_PLANILHA"], x["ANTES"], x["DEPOIS"]
        if e := conferir_antes(wp, linha_p, cod, n, il, antes):
            erros.append(e)
            continue
        fp[(n, il)] = depois
        log.append(["CLASSIFICACAO_ALTERADA", "PRODUTOS", cod, None,
                    f"LINHA: '{antes}' -> '{depois}' (o resto da linha não muda). {x['MOTIVO_E_FONTE']} {origem}"])
    for cod, n in VEICULO.items():
        r = {k: wv.cell(n, c).value for k, c in iv.items()}
        if (r["CODIGO_BAP"], r["FABRICANTE"], r["MODELO"], r["SITUACAO"], r["MOTIVO"]) != (
                cod, "FORD", "Cargo", "separado", None):
            erros.append(f"VEICULOS linha {n}: não é a 'FORD Cargo' separada do {cod} ({r})")
            continue
        fv[(n, iv["SITUACAO"])] = "duvidoso"
        fv[(n, iv["MOTIVO"])] = MOTIVO
        fonte = next(x["MOTIVO_E_FONTE"] for x in cel if x["ABA"] == "VEICULOS" and x["CODIGO_BAP"] == cod)
        log.append(["VEICULO_DUVIDOSO", "VEICULOS", cod, None,
                    f"VEICULOS: SITUACAO separado -> duvidoso em 1 linha(s) (FORD Cargo, linha {n}): {MOTIVO}; "
                    f"MOTIVO preenchido; nenhuma linha sai. {fonte} {origem}"])
    parar(erros)
    escrever(wb, {"PRODUTOS": fp, "VEICULOS": fv})
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: PRODUTOS {len(fp)}; VEICULOS {len(fv)}; LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")
    return {"PRODUTOS": set(fp), "VEICULOS": set(fv)}, ult, leia_n, (fp, fv)


if __name__ == "__main__":
    rodar(27, 28, ler, aplicar, conferir_celulas)
