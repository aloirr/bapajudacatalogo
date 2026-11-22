"""v27 da base unificada · T-0017 (SCE14002, SISTEMA dos rolamentos, TER55227, TER5597056 e DETALHE das embreagens).

Pedido: R-20261121-210229-po (SCE14002, RD-0284; o SISTEMA dos rolamentos e os textos do TER55227 e do TER5597056),
R-20261121-200058-alexandre, item 4 (o SISTEMA dos rolamentos gravado na base) e o RD-0293 (embreagens pesadas).
Aprovado em R-20261122-012933-alexandre ("Seguir o recomendado pelo gerente", via po): 1 b (TRANSMISSÃO), 2 a (o uso
citado primeiro), 3 a (2010–2019 nos 4 veículos do TER5597056), 4 a (Amarok fica "Diant. Dir."), tirar a repetição do
DETALHE_CATALOGO das 13 embreagens e gravar como simulada. A simulação é a de dados/simulacoes/T-0017/v27/.
Regra fixa (R-20261120-213300): nenhuma marca nova de ano incerto; nenhum produto sai.

O que faz (regra 4 do CLAUDE.md):
1. PRODUTOS: as 124 células da ANTES_DEPOIS da simulação (3 APLICACAO, 108 SISTEMA e 13 DETALHE_CATALOGO);
2. uma linha no LOG_CORRECOES por célula e o bloco da v27 no topo do LEIA-ME;
3. compara célula a célula a base nova com a v26 (base_comum.rodar) e grava a base e a cópia em dados/versoes/.

Uso: python3 dados/scripts/base_v27.py            (grava)
     python3 dados/scripts/base_v27.py --conferir (só compara a base de hoje com a v26)
"""
from __future__ import annotations

import collections
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (RAIZ, acrescentar_leia_me, acrescentar_log, conferir_celulas, ler_antes_depois,  # noqa: E402
                        limpo, linhas_por_codigo, parar, rodar)

SIM = RAIZ / "dados" / "simulacoes" / "T-0017" / "v27" / "SIMULACAO_v27_T-0017.xlsx"
TAREFA, DATA = "T-0017", "22/11/2026"
APROVACAO = "R-20261122-012933-alexandre ('Seguir o recomendado pelo gerente', via po)"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "ANTES", "DEPOIS", "ITEM", "FONTE"]

# o que foi aprovado
TEXTO = {
    "SCE14002": "LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS 1941 · VW 16210 17240 1730 · 111693",
    "TER55227": ("FORD/VW - 1113 Cargo / 1117 Cargo / 12-140 / 1215 Cargo / 1218 Cargo / 1313 Cargo / 1317 Cargo / "
                 "14-150 / 14-220 / 1415 Cargo / 1418 Cargo / 1420 Cargo / 1422 Cargo / 1519 Cargo / 1521 Cargo / "
                 "16-170 / 16-220 / 1615 Cargo / 1617 Cargo / 1618 Cargo / 1621 Cargo / 1622 Cargo / 1623 Cargo / "
                 "1624 Cargo / 1729 Cargo / 2218 Cargo / 2319 Cargo / 2321 Cargo / 2322 Cargo / 2334 Cargo / "
                 "3021 Cargo / 3224 Cargo / B1618 / B1621 01/1970–06/2012 · Tractor · Diant."),
    "TER5597056": ("AUDI - Q7 2010–2019 · Diant. Esq. ; PORSCHE - Cayenne 2010–2019 · Diant. Esq. ; VW - Amarok "
                   "2010–2019 · Diant. Dir. ; VW - Touareg 2010–2019 · Diant. Esq."),
}
SISTEMAS = {"TRANSMISSÃO": 88, "MOTOR": 20}            # pergunta 1 b e 2 a: 108 rolamentos, de RODAGEM
EMB_RX = re.compile(r"\s+plato/disco[/ ]mancal(?= · c/ platô, disco, rol\. e mancal)")
N_EMB = 13
TIPO = {"APLICACAO": "CORRECAO_APLICACAO", "SISTEMA": "CORRECAO_SISTEMA", "DETALHE_CATALOGO": "CORRECAO_DETALHE"}

LEIA_ME = [
    ("BASE BAP UNIFICADA v27 (22/11/2026)", None),
    ("APLICACAO (SCE14002)", "'LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS 1941 · VW 16210 17240 1730 · 111693': 'LS1941' "
                             "com espaço, linhas LS em ordem, sem o 'Servo Embreagem MB' do começo (RD-0284) (T-0017)."),
    ("APLICACAO (TER55227 e TER5597056)", "O ano junto do veículo e a posição como detalhe dele. TER5597056: um bloco por "
                                          "veículo, 2010–2019 nos 4, o Amarok 'Diant. Dir.' como no texto (T-0017)."),
    ("SISTEMA (108 rolamentos)", "RODAGEM → o sistema que o site e o PDF leem do texto (gerar_site.sistemas_de): "
                                 "TRANSMISSÃO 88 (câmbio, diferencial, cardã, semi-eixo, embreagem) e MOTOR 20 "
                                 "(alternador, polia, tensor). Com mais de um uso, o citado primeiro. Os outros 86 "
                                 "ficam RODAGEM; a TAXONOMIA não muda (T-0017)."),
    ("DETALHE_CATALOGO (13 embreagens)", "A composição do kit dita uma vez: '… plato/disco/mancal · c/ platô, disco, rol. "
                                         "e mancal' → '… · c/ platô, disco, rol. e mancal' (RD-0293) (T-0017)."),
    ("Formato", "Mesmas abas e colunas da v26 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem); "
                "nenhum valor novo de SISTEMA. 124 linhas no LOG_CORRECOES (uma por célula). "
                f"Aprovado em {APROVACAO}."),
    (None, None),
]


def ler() -> list[dict]:
    """As células da ANTES_DEPOIS da simulação, conferidas com o que foi aprovado."""
    cel = ler_antes_depois(SIM, CAB)
    erros = []
    if any(x["ABA"] != "PRODUTOS" for x in cel) or len({(x["CODIGO_BAP"], x["COLUNA"]) for x in cel}) != len(cel):
        erros.append("só a PRODUTOS, uma célula por código e coluna")
    por = collections.defaultdict(list)
    for x in cel:
        por[x["COLUNA"]].append(x)
    if {x["CODIGO_BAP"]: x["DEPOIS"] for x in por["APLICACAO"]} != TEXTO:
        erros.append("APLICACAO: o DEPOIS não é o aprovado")
    sis = por["SISTEMA"]
    if any(x["ANTES"] != "RODAGEM" for x in sis) or dict(collections.Counter(x["DEPOIS"] for x in sis)) != SISTEMAS:
        erros.append(f"SISTEMA: não é o aprovado ({collections.Counter(x['DEPOIS'] for x in sis)})")
    emb = por["DETALHE_CATALOGO"]
    erros += [f"{x['CODIGO_BAP']}: o DETALHE não é só sem a repetição" for x in emb
              if EMB_RX.sub("", x["ANTES"]) != x["DEPOIS"] or x["ANTES"] == x["DEPOIS"]]
    if len(emb) != N_EMB:
        erros.append(f"DETALHE_CATALOGO: {len(emb)} células; aprovado {N_EMB}")
    if set(por) != set(TIPO):
        erros.append(f"colunas: {sorted(por)}")
    parar(erros)
    return cel


def aplicar(wb, cel):
    wp = wb["PRODUTOS"]
    cp = [limpo(c.value) for c in wp[1]]
    col = {k: cp.index(k) + 1 for k in TIPO}
    ip = cp.index("PRODUTO") + 1
    linha_p = linhas_por_codigo(wp)
    origem = f"Simulação em dados/simulacoes/T-0017/v27/; aprovado em {APROVACAO}. {TAREFA} (v27), {DATA}"
    erros, fp, log = [], {}, []
    for x in cel:
        cod, n, c, antes, depois = x["CODIGO_BAP"], x["LINHA"], x["COLUNA"], x["ANTES"], x["DEPOIS"]
        if linha_p.get(cod) != [n] or wp.cell(n, col[c]).value != antes:
            erros.append(f"{cod}: a linha ou o {c} de hoje não é o da simulação ({linha_p.get(cod)})")
            continue
        if c == "SISTEMA" and limpo(wp.cell(n, ip).value) != "Rolamentos":
            erros.append(f"{cod}: SISTEMA fora dos rolamentos")
            continue
        fp[(n, col[c])] = depois
        log.append([TIPO[c], "PRODUTOS", cod, None,
                    f"{c}: '{antes}' -> '{depois}' (item {x['ITEM']}; o resto da célula não muda). {x['FONTE']} {origem}"])
    parar(erros)
    for (n, c), v in fp.items():
        wp.cell(n, c).value = v
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: PRODUTOS {len(fp)}; LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")
    return {"PRODUTOS": set(fp)}, ult, leia_n, (fp, {})


if __name__ == "__main__":
    rodar(26, 27, ler, aplicar, conferir_celulas)
