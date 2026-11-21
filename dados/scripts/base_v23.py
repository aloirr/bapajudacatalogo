"""v23 da base unificada · T-0017 (CRU100 com a tabela guardada na v21; FAC6108 Eclipse Cross sem o ano herdado).

Pedido: R-20261120-235000-alexandre (item 1.3: "CRU100 com os dados do LOG da v21, SCE14002 '1929–19321934' e FAC6108
'em Diante' sem ano"), com aprovação antecipada nesta rodada: a simulação segue a recomendação do dono e do gerente.
A simulação é a de dados/simulacoes/T-0017-v23/. Regra fixa (R-20261120-213300): nada novo marcado nem escrito como
duvidoso.

O que faz (regra 4 do CLAUDE.md):
1. Grava as 4 linhas da aba ANTES_DEPOIS da simulação, depois de conferir o valor de hoje de cada célula:
   - CRU100, APLICACAO: só o trecho 'Hyunday HR (07/2017)' vira 'Hyundai HR 2.5 4x2 (04/2007–12/2017)', com os dados
     da linha HYUNDAI da tabela de origem (guardada no LOG_CORRECOES da v21, LINHA_REMOVIDA); o trecho da Kia fica;
   - FAC6108, VEICULOS, Eclipse Cross: ANO_INICIO 2009, ANO_FIM 2012 e ANO_DUVIDA ('herdado…') ficam vazios. O ano era
     o da Outlander; o texto não tem ano para a Eclipse Cross desde a v21 (P5 a: "o veículo fica sem ano").
   - SCE14002: nada muda na base (o texto quebrado saiu na v21, P2 a).
2. Uma linha no LOG_CORRECOES por célula mudada e o bloco da v23 no topo do LEIA-ME.
3. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v22 (base_comum.rodar): só podem
   mudar essas células e as linhas novas do LOG_CORRECOES e do LEIA-ME.
4. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v23.xlsx.

Uso: python3 dados/scripts/base_v23.py            (grava)
     python3 dados/scripts/base_v23.py --conferir (só compara a base de hoje com a v22)
"""
from __future__ import annotations

import sys
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import RAIZ, acrescentar_leia_me, acrescentar_log, limpo, parar, rodar  # noqa: E402

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v23" / "SIMULACAO_v23_T-0017.xlsx"
TAREFA, DATA = "T-0017", "21/11/2026"
APROVACAO = ("R-20261120-235000-alexandre (aprovação antecipada desta rodada: segue a recomendação do dono e do "
             "gerente)")
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "FABRICANTE", "MODELO", "ANTES", "DEPOIS", "PROVA", "RECOMENDACAO",
       "ENTRA"]
ESPERADO = {("CRU100", "PRODUTOS", "APLICACAO"), ("FAC6108", "VEICULOS", "ANO_INICIO"),
            ("FAC6108", "VEICULOS", "ANO_FIM"), ("FAC6108", "VEICULOS", "ANO_DUVIDA")}
CRU_ANTES, CRU_DEPOIS = "Hyunday HR (07/2017)", "Hyundai HR 2.5 4x2 (04/2007–12/2017)"

LEIA_ME = [
    ("BASE BAP UNIFICADA v23 (21/11/2026)", None),
    ("APLICACAO (CRU100)", "Só o trecho 'Hyunday HR (07/2017)' -> 'Hyundai HR 2.5 4x2 (04/2007–12/2017)', com os dados "
                           "da linha HYUNDAI da tabela de aplicação de origem, guardada no LOG_CORRECOES da v21; o "
                           "trecho da Kia fica como está (T-0017)."),
    ("VEICULOS (FAC6108)", "Eclipse Cross: ANO_INICIO, ANO_FIM e ANO_DUVIDA ficam vazios (o 2009–2012 era o da "
                           "Outlander); o veículo fica sem ano, como a APLICACAO desde a v21 (T-0017)."),
    ("SCE14002", "Nada muda: o '1929–19321934' já tinha virado '1929 · 1932 · 1934' na v21 (T-0017)."),
    ("Não entram", "Nada novo marcado ou escrito como duvidoso; nenhuma linha nova na VEICULOS."),
    ("Formato", "Mesmas abas e colunas da v22 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem). 4 "
                "linhas no LOG_CORRECOES (uma por célula). Aprovação antecipada do Alexandre para esta rodada "
                "(R-20261120-235000-alexandre)."),
    (None, None),
]


def ler() -> list[dict]:
    """A aba ANTES_DEPOIS da simulação: uma linha por célula."""
    wb = openpyxl.load_workbook(SIM, read_only=True)
    it = wb["ANTES_DEPOIS"].iter_rows(values_only=True)
    cab = list(next(it))
    if cab != CAB:
        raise SystemExit(f"[PARADO] cabeçalho da ANTES_DEPOIS: {cab}")
    linhas = [dict(zip(CAB, r)) for r in it if r[0]]
    wb.close()
    achado = {(x["CODIGO_BAP"], x["ABA"], x["COLUNA"]) for x in linhas}
    if achado != ESPERADO or len(linhas) != len(ESPERADO) or any(x["ENTRA"] != "sim" for x in linhas):
        raise SystemExit(f"[PARADO] a simulação traz {sorted(achado)} ({len(linhas)} linhas); esperado {ESPERADO}")
    return linhas


def vazio(v):
    return None if v == "(vazio)" else v


def aplicar(wb, linhas):
    wv, wp = wb["VEICULOS"], wb["PRODUTOS"]
    cv = [limpo(c.value) for c in wv[1]]
    iv = {c: cv.index(c) + 1 for c in ("CODIGO_BAP", "FABRICANTE", "MODELO", "ANO_INICIO", "ANO_FIM", "ANO_DUVIDA")}
    cp = [limpo(c.value) for c in wp[1]]
    ip = {c: cp.index(c) + 1 for c in ("CODIGO_BAP", "APLICACAO")}
    linha_p: dict[str, list[int]] = {}
    for n in range(2, wp.max_row + 1):
        linha_p.setdefault(limpo(wp.cell(n, ip["CODIGO_BAP"]).value), []).append(n)

    erros, fv, fp, log = [], {}, {}, []
    origem = f"Antes e depois em dados/simulacoes/T-0017-v23/; aprovado em {APROVACAO}. {TAREFA} (v23), {DATA}"
    for x in linhas:
        cod, col, antes, depois, n = x["CODIGO_BAP"], x["COLUNA"], vazio(x["ANTES"]), vazio(x["DEPOIS"]), x["LINHA"]
        if len(linha_p.get(cod, [])) != 1 or (x["ABA"] == "PRODUTOS" and linha_p[cod] != [n]):
            erros.append(f"{cod}: a linha na PRODUTOS não é a da simulação ({linha_p.get(cod)})")
            continue
        if x["ABA"] == "PRODUTOS":
            c = ip[col]
            hoje = wp.cell(n, c).value
            if hoje != antes or antes.count(CRU_ANTES) != 1 or depois != antes.replace(CRU_ANTES, CRU_DEPOIS):
                erros.append(f"{cod} {col}: o valor de hoje ou o DEPOIS não é o da simulação")
                continue
            fp[(n, c)] = depois
            log.append(["CORRECAO_APLICACAO", "PRODUTOS", cod, "HYUNDAI",
                        f"APLICACAO: trecho '{CRU_ANTES}' -> '{CRU_DEPOIS}' (o resto da célula não muda; o trecho da "
                        f"Kia fica). Fonte: a linha HYUNDAI da tabela de aplicação do CRU100 na planilha de origem, "
                        f"guardada no LOG_CORRECOES da v21 (LINHA_REMOVIDA HYUNDAI): HR, Ano 04/07 - 12/17, Tração 4x2, "
                        f"Motor 2.5; 'Hyunday' é a grafia errada de Hyundai. {origem}"])
            continue
        v = {k: wv.cell(n, c).value for k, c in iv.items()}
        esperado = {"CODIGO_BAP": cod, "FABRICANTE": x["FABRICANTE"], "MODELO": x["MODELO"], col: antes}
        if any(v[k] != e for k, e in esperado.items()):
            erros.append(f"{cod} VEICULOS linha {n}: não é a de hoje ({v}); esperado {esperado}")
            continue
        fv[(n, iv[col])] = depois
        log.append(["CORRECAO_VEICULO", "VEICULOS", cod, None,
                    f"{col} da {x['MODELO']} (linha {n}): '{antes}' -> vazio. O 2009–2012 é o ano da Outlander, que "
                    f"vem depois na APLICACAO ('Eclipse Cross 1.5 L 16V · Outlander 2.0 L 16V 2009–2012'); o texto "
                    f"não tem ano para a Eclipse Cross desde a v21 (P5 a: 'o veículo fica sem ano'). Nada novo "
                    f"marcado. {origem}"])
    parar(erros)
    for (n, c), val in fv.items():
        wv.cell(n, c).value = val
    for (n, c), val in fp.items():
        wp.cell(n, c).value = val
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: VEICULOS {len(fv)}, PRODUTOS {len(fp)}; LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")
    return {"PRODUTOS": set(fp), "VEICULOS": set(fv)}, ult, leia_n, (fp, fv)


def conferir_valores(p: Path, extra) -> list[str]:
    """Na base gravada, cada célula tem o valor da gravação."""
    fp, fv = extra
    wb = openpyxl.load_workbook(p, read_only=False)
    dif = []
    for aba, feitas in (("PRODUTOS", fp), ("VEICULOS", fv)):
        ws = wb[aba]
        dif += [f"{aba} {ws.cell(n, c).coordinate}: valor diferente do da gravação"
                for (n, c), v in feitas.items() if ws.cell(n, c).value != v]
    return dif


if __name__ == "__main__":
    rodar(22, 23, ler, aplicar, conferir_valores)
