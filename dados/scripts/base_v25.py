"""v25 da base unificada · T-0017 (Palio Weekend Adventure 2000–2007 s/ ABS no AMT7500).

Pedido: R-20261121-112900-alexandre, item 4 ("coloque o palio no amt7500 assim como na internet. Olhe os catalagos
unificados antigos para validar"). Aprovado em R-20261121-154533-alexandre ("1) a", via po). A simulação é a de
dados/simulacoes/T-0017-v25/: nenhum catálogo antigo tem Palio no AMT7500 ou nas referências dele, e a fonte é o anúncio
da Cofap GP30120, aceito pelo Alexandre neste caso. Ficam de fora o "Palio, Siena" e o AMT7014. Regra fixa
(R-20261120-213300): nenhuma marca nova de ano incerto.

O que faz (regra 4 do CLAUDE.md):
1. AMT7500, APLICACAO: acrescenta no fim " ; FIAT - Palio Weekend Adventure 2000–2007 · s/ ABS" (o resto não muda);
2. VEICULOS: uma linha nova no fim (FIAT | Palio Weekend | Adventure | 2000 | 2007, separado, sem ANO_DUVIDA);
3. duas linhas no LOG_CORRECOES e o bloco da v25 no topo do LEIA-ME;
4. compara célula a célula a base nova com a v24 (base_comum.rodar) e grava a base e a cópia em dados/versoes/.

Uso: python3 dados/scripts/base_v25.py            (grava)
     python3 dados/scripts/base_v25.py --conferir (só compara a base de hoje com a v24)
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (CAB_VEICULOS, RAIZ, acrescentar_leia_me, acrescentar_linhas, acrescentar_log,  # noqa: E402
                        conferir_celulas, ler_antes_depois, limpo, parar, rodar, vazio)

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v25" / "SIMULACAO_v25_T-0017.xlsx"
TAREFA, DATA = "T-0017", "21/11/2026"
APROVACAO = "R-20261121-154533-alexandre ('1) a', via po)"
COD, TRECHO = "AMT7500", " ; FIAT - Palio Weekend Adventure 2000–2007 · s/ ABS"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "ANTES", "DEPOIS", "FONTE", "ENTRA"]
NOVA = [COD, "FIAT", "Palio Weekend", "Adventure", 2000, 2007, "automático", "separado", None, None, None]

LEIA_ME = [
    ("BASE BAP UNIFICADA v25 (21/11/2026)", None),
    ("APLICACAO (AMT7500)", "Acrescentado no fim ' ; FIAT - Palio Weekend Adventure 2000–2007 · s/ ABS', como no anúncio "
                            "da Cofap GP30120 (fonte aceita pelo Alexandre neste caso); nenhum catálogo antigo tem "
                            "Palio no AMT7500 (T-0017)."),
    ("VEICULOS (1 linha nova)", "AMT7500 | FIAT | Palio Weekend | Adventure | 2000–2007, separado, sem MOTIVO e sem "
                                "ANO_DUVIDA, no fim da aba (T-0017)."),
    ("Não entram", "O 'Palio, Siena' do anúncio da Nakata (nenhum catálogo antigo confirma) e o AMT7014 (c/ ABS); "
                   "nenhuma marca nova de ano incerto; nenhum produto sai."),
    ("Formato", "Mesmas abas e colunas da v24 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem). 2 "
                f"linhas no LOG_CORRECOES. Aprovado em {APROVACAO}."),
    (None, None),
]


def ler() -> tuple[dict, list]:
    """A célula da ANTES_DEPOIS e a linha da VEICULOS_NOVA da simulação, conferidas com o que foi aprovado."""
    cel = ler_antes_depois(SIM, CAB)
    nova = ler_antes_depois(SIM, CAB_VEICULOS + ["FONTE"], "VEICULOS_NOVA")
    if (len(cel) != 1 or (cel[0]["CODIGO_BAP"], cel[0]["ABA"], cel[0]["COLUNA"], cel[0]["ENTRA"])
            != (COD, "PRODUTOS", "APLICACAO", "sim") or cel[0]["DEPOIS"] != cel[0]["ANTES"] + TRECHO):
        raise SystemExit(f"[PARADO] a ANTES_DEPOIS da simulação não é a aprovada: {cel}")
    if len(nova) != 1 or [vazio(nova[0][k]) for k in CAB_VEICULOS] != NOVA:
        raise SystemExit(f"[PARADO] a VEICULOS_NOVA da simulação não é a aprovada: {nova}")
    return cel[0], NOVA


def aplicar(wb, dados):
    x, nova = dados
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    if [limpo(c.value) for c in wv[1]] != CAB_VEICULOS:
        raise SystemExit("[PARADO] cabeçalho da VEICULOS mudou")
    cp = [limpo(c.value) for c in wp[1]]
    ic, ia = cp.index("CODIGO_BAP") + 1, cp.index("APLICACAO") + 1
    linhas = [n for n in range(2, wp.max_row + 1) if limpo(wp.cell(n, ic).value) == COD]
    ja = [r for r in wv.iter_rows(min_row=2, values_only=True) if r[0] == COD and r[1] == "FIAT" and r[2] == nova[2]]
    erros = []
    if linhas != [x["LINHA"]] or wp.cell(x["LINHA"], ia).value != x["ANTES"]:
        erros.append(f"{COD}: a linha ou a APLICACAO de hoje não é a da simulação ({linhas})")
    if ja:
        erros.append(f"{COD}: o Palio Weekend já está na VEICULOS ({ja})")
    parar(erros)
    n = x["LINHA"]
    wp.cell(n, ia).value = x["DEPOIS"]
    fv = acrescentar_linhas(wv, [nova])
    origem = (f"Fonte: anúncio da Cofap GP30120 ('Palio Weekend Adventure 2000/2007'), aceito pelo Alexandre neste caso "
              f"(R-20261121-112900-alexandre, item 4); nenhum catálogo antigo tem Palio no AMT7500 (busca na "
              f"simulação). Simulação em dados/simulacoes/T-0017-v25/; aprovado em {APROVACAO}. {TAREFA} (v25), {DATA}")
    log = [["CORRECAO_APLICACAO", "PRODUTOS", COD, None,
            f"APLICACAO: acrescentado no fim '{TRECHO}' (o resto da célula não muda; o AMT7014 c/ ABS não recebe). "
            f"{origem}"],
           ["VEICULO_NOVO", "VEICULOS", COD, None,
            f"VEICULOS: linha nova no fim da aba (linha {wv.max_row}), FIAT Palio Weekend Adventure 2000–2007, "
            f"separado, sem MOTIVO e sem ANO_DUVIDA. {origem}"]]
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: PRODUTOS 1; VEICULOS +1 linha; LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")
    return {"PRODUTOS": {(n, ia)}, "VEICULOS": set()}, ult, leia_n, ({(n, ia): x["DEPOIS"]}, fv)


if __name__ == "__main__":
    rodar(24, 25, ler, aplicar, conferir_celulas, novas_no_fim={"VEICULOS": 1})
