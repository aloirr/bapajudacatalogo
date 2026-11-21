"""v26 da base unificada · T-0017 (SCE14002 LS, CRU100, VEICULOS, CV-F35 e nomes de montadora).

Pedido: R-20261121-190649-alexandre, item 3 (o CV-F35 2010–2013 confirmado no R-20261121-190933-alexandre). Aprovado
em R-20261121-195140-alexandre ("1 a 2 a 3 a 4 a", via po): a v26 como simulada, "Mbb" → "MB", as outras grafias da
aba FORA também ("MBB" → "MB", "NEW BEETLE" / "New beetle" / "New Beatle" → "New Beetle", "Vw" → "VW") e o "MB … MB"
do BOL40041 e do TER555249 fica. A simulação é a de dados/simulacoes/T-0017-v26/. Regra fixa (R-20261120-213300):
nenhuma marca nova de ano incerto; nenhum produto sai.

O que faz (regra 4 do CLAUDE.md):
1. PRODUTOS, APLICACAO: as células da ANTES_DEPOIS da simulação (SCE14002 com os LS 1929, 1932 e 1934; CRU100 com a
   Bongo "07/2017>"; os nomes de montadora, só a palavra inteira);
2. VEICULOS: as células da ANTES_DEPOIS (Bongo sem ANO_DUVIDA; Parati e Santana do CIL8546 separado, 1983–2006;
   Fiesta do CV-F35 até 2013) e as 4 linhas novas da VEICULOS_NOVA no fim da aba (LS 1929, 1932, 1934 e a HR);
3. uma linha no LOG_CORRECOES por célula e por linha nova, e o bloco da v26 no topo do LEIA-ME;
4. compara célula a célula a base nova com a v25 (base_comum.rodar) e grava a base e a cópia em dados/versoes/.

Uso: python3 dados/scripts/base_v26.py            (grava)
     python3 dados/scripts/base_v26.py --conferir (só compara a base de hoje com a v25)
"""
from __future__ import annotations

import difflib
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (CAB_VEICULOS, RAIZ, acrescentar_leia_me, acrescentar_linhas,  # noqa: E402
                        acrescentar_log, antes_log, conferir_cabecalho, conferir_celulas, ler_antes_depois, limpo,
                        linhas_por_codigo, parar, rodar, vazio)

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v26" / "SIMULACAO_v26_T-0017.xlsx"
TAREFA, DATA = "T-0017", "21/11/2026"
APROVACAO = "R-20261121-195140-alexandre ('1 a 2 a 3 a 4 a', via po)"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "ANTES", "DEPOIS", "ITEM", "FONTE", "ENTRA"]

# o que foi aprovado: as duas células de texto, as trocas de palavra permitidas nos nomes e as células da VEICULOS
TEXTO = {"SCE14002": "Servo Embreagem MB LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS1941 VW 16210 17240 1730 · 111693",
         "CRU100": "Hyundai HR 2.5 4x2 (04/2007–12/2017), Kia Motors Bongo 2500 (07/2017>)"}
TROCAS = {("Mbb", "MB"), ("MBB", "MB"), ("Vwc", "VW"), ("Vw", "VW"), ("NEW", "New"), ("BEETLE", "Beetle"),
          ("beetle", "Beetle"), ("Beatle", "Beetle")}
N_NOMES = 33                                   # células da APLICACAO só com troca de nome (35 com SCE14002 e CRU100)
VEIC = {("CRU100", "KIA", "Bongo", "ANO_DUVIDA"): None,
        ("CIL8546", "VOLKSWAGEN", "Parati", "ANO_INICIO"): 1983, ("CIL8546", "VOLKSWAGEN", "Parati", "ANO_FIM"): 2006,
        ("CIL8546", "VOLKSWAGEN", "Parati", "SITUACAO"): "separado", ("CIL8546", "VOLKSWAGEN", "Parati", "MOTIVO"): None,
        ("CIL8546", "VOLKSWAGEN", "Santana", "ANO_INICIO"): 1983, ("CIL8546", "VOLKSWAGEN", "Santana", "ANO_FIM"): 2006,
        ("CIL8546", "VOLKSWAGEN", "Santana", "SITUACAO"): "separado",
        ("CIL8546", "VOLKSWAGEN", "Santana", "MOTIVO"): None,
        ("CV-F35", "FORD", "Fiesta", "ANO_FIM"): 2013}
NOVAS = [["SCE14002", "MERCEDES-BENZ", "LS", "1929", None, None, "automático", "separado", None, None, None],
         ["SCE14002", "MERCEDES-BENZ", "LS", "1932", None, None, "automático", "separado", None, None, None],
         ["SCE14002", "MERCEDES-BENZ", "LS", "1934", None, None, "automático", "separado", None, None, None],
         ["CRU100", "HYUNDAI", "HR", None, 2007, 2017, "automático", "separado", None, "2.5", None]]

LEIA_ME = [
    ("BASE BAP UNIFICADA v26 (21/11/2026)", None),
    ("APLICACAO (SCE14002)", "'1929 · 1932 · 1934' são modelos LS da Mercedes-Benz, não anos: 'Servo Embreagem MB LS 1630 "
                             "· LS 1929 · LS 1932 · LS 1934 · LS1941 VW 16210 17240 1730 · 111693' (T-0017)."),
    ("APLICACAO (CRU100)", "Kia Bongo a partir de 07/2017: '(07/2017)' → '(07/2017>)' (T-0017)."),
    ("APLICACAO (nomes)", "Só a palavra inteira, com a caixa exata: 'Mbb' e 'MBB' → 'MB'; 'Vwc' e 'Vw' → 'VW'; 'NEW Beetle', "
                          "'NEW BEETLE', 'New beetle' e 'New Beatle' → 'New Beetle'. 33 células; o resto do texto não "
                          "muda (o 'MB … MB' do BOL40041 e do TER555249 fica) (T-0017)."),
    ("VEICULOS (10 células)", "CRU100 Bongo sem ANO_DUVIDA; CIL8546 Parati e Santana 'separado', 1983–2006, sem MOTIVO; "
                              "CV-F35 Fiesta 2010–2013 (T-0017)."),
    ("VEICULOS (4 linhas novas)", "No fim da aba, 'separado', sem MOTIVO e sem ANO_DUVIDA: SCE14002 MERCEDES-BENZ LS 1929, "
                                  "LS 1932 e LS 1934 (sem ano); CRU100 HYUNDAI HR 2007–2017, 2.5 (T-0017)."),
    ("Formato", "Mesmas abas e colunas da v25 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem). 49 "
                f"linhas no LOG_CORRECOES (uma por célula e uma por linha nova). Aprovado em {APROVACAO}."),
    (None, None),
]


def so_nomes(antes: str, depois: str) -> bool:
    """depois = antes com só as trocas de palavra aprovadas (palavra inteira, caixa exata)."""
    a, d = re.split(r"(\W+)", antes), re.split(r"(\W+)", depois)
    sm = difflib.SequenceMatcher(None, a, d, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        if op != "replace" or i2 - i1 != j2 - j1 or any((x, y) not in TROCAS for x, y in zip(a[i1:i2], d[j1:j2])):
            return False
    return antes != depois


def ler() -> tuple[list[dict], list[list]]:
    """As células da ANTES_DEPOIS e as linhas da VEICULOS_NOVA da simulação, conferidas com o que foi aprovado."""
    cel = ler_antes_depois(SIM, CAB)
    nova = ler_antes_depois(SIM, CAB_VEICULOS + ["FONTE"], "VEICULOS_NOVA")
    erros = [f"{x['CODIGO_BAP']}: ENTRA '{x['ENTRA']}'" for x in cel if x["ENTRA"] != "sim"]
    prod = [x for x in cel if x["ABA"] == "PRODUTOS"]
    if any(x["COLUNA"] != "APLICACAO" for x in prod) or len({x["CODIGO_BAP"] for x in prod}) != len(prod):
        erros.append("PRODUTOS: só a APLICACAO, uma célula por código")
    texto = {x["CODIGO_BAP"]: x["DEPOIS"] for x in prod if x["CODIGO_BAP"] in TEXTO}
    if texto != TEXTO:
        erros.append(f"SCE14002 e CRU100: o DEPOIS não é o aprovado ({texto})")
    nomes = [x for x in prod if x["CODIGO_BAP"] not in TEXTO]
    erros += [f"{x['CODIGO_BAP']}: a troca não é só de nome" for x in nomes if not so_nomes(x["ANTES"], x["DEPOIS"])]
    if len(nomes) != N_NOMES:
        erros.append(f"nomes: {len(nomes)} células; aprovado {N_NOMES}")
    if len([x for x in cel if x["ABA"] == "VEICULOS"]) != len(VEIC):
        erros.append("VEICULOS: o número de células não é o aprovado")
    if [[vazio(x[k]) for k in CAB_VEICULOS] for x in nova] != NOVAS:
        erros.append(f"a VEICULOS_NOVA da simulação não é a aprovada: {nova}")
    parar(erros)
    return cel, NOVAS


def aplicar(wb, dados):
    cel, novas = dados
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    conferir_cabecalho(wv, CAB_VEICULOS)
    ia = [limpo(c.value) for c in wp[1]].index("APLICACAO") + 1
    iv = {k: i + 1 for i, k in enumerate(CAB_VEICULOS)}
    linha_p = linhas_por_codigo(wp)
    origem = f"Simulação em dados/simulacoes/T-0017-v26/; aprovado em {APROVACAO}. {TAREFA} (v26), {DATA}"
    erros, fp, fv, log = [], {}, {}, []
    for x in cel:
        cod, n, col, antes, depois = x["CODIGO_BAP"], x["LINHA"], x["COLUNA"], vazio(x["ANTES"]), vazio(x["DEPOIS"])
        if x["ABA"] == "PRODUTOS":
            if linha_p.get(cod) != [n] or wp.cell(n, ia).value != antes:
                erros.append(f"{cod}: a linha ou a APLICACAO de hoje não é a da simulação ({linha_p.get(cod)})")
                continue
            fp[(n, ia)] = depois
            log.append(["CORRECAO_APLICACAO", "PRODUTOS", cod, None,
                        f"APLICACAO: '{antes}' -> '{depois}' (item {x['ITEM']}; o resto da célula não muda). "
                        f"{x['FONTE']} {origem}"])
            continue
        fab, mod = wv.cell(n, iv["FABRICANTE"]).value, wv.cell(n, iv["MODELO"]).value
        if wv.cell(n, 1).value != cod or (cod, fab, mod, col) not in VEIC or VEIC[(cod, fab, mod, col)] != depois \
                or wv.cell(n, iv[col]).value != antes:
            erros.append(f"{cod} VEICULOS linha {n} {col}: não é a da simulação ou a aprovada ({fab} {mod})")
            continue
        fv[(n, iv[col])] = depois
        log.append(["CORRECAO_VEICULO", "VEICULOS", cod, None,
                    f"VEICULOS linha {n} ({fab} {mod}), {col}: {antes_log(antes)} -> {antes_log(depois)} "
                    f"(item {x['ITEM']}). {x['FONTE']} {origem}"])
    for nv in novas:
        ja = [r for r in range(2, wv.max_row + 1)
              if [wv.cell(r, c).value for c in (1, 2, 3, 4)] == nv[:4]]
        if ja:
            erros.append(f"{nv[0]}: {nv[1]} {nv[2]} {nv[3] or ''} já está na VEICULOS (linhas {ja})")
    parar(erros)
    for (n, c), v in fp.items():
        wp.cell(n, c).value = v
    for (n, c), v in fv.items():
        wv.cell(n, c).value = v
    ult_v = wv.max_row
    fv_novas = acrescentar_linhas(wv, novas)
    for i, nv in enumerate(novas, 1):
        anos = f"{nv[4]}–{nv[5]}" if nv[4] else "sem ano (o texto não tem ano)"
        log.append(["VEICULO_NOVO", "VEICULOS", nv[0], None,
                    f"VEICULOS: linha nova no fim da aba (linha {ult_v + i}), {nv[1]} {nv[2]}"
                    f"{' ' + nv[3] if nv[3] else ''}, {anos}, CILINDRADA {nv[9] or 'vazia'}, separado, sem MOTIVO e sem "
                    f"ANO_DUVIDA (item 3, como normal). {origem}"])
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: PRODUTOS {len(fp)}; VEICULOS {len(fv)} +{len(novas)} linhas; LOG_CORRECOES +{len(log)}; "
          f"LEIA-ME +{leia_n}")
    return {"PRODUTOS": set(fp), "VEICULOS": set(fv)}, ult, leia_n, (fp, {**fv, **fv_novas})


if __name__ == "__main__":
    rodar(25, 26, ler, aplicar, conferir_celulas, novas_no_fim={"VEICULOS": len(NOVAS)})
