"""v22 da base unificada · T-0017 (o ANO_FIM da faixa com seta 'AAAA->AAAA' na VEICULOS).

Pedido: R-20261120-221700-alexandre ("1) a"). Aprovado em R-20261120-223000-alexandre: "Siga recomendação do gerente"
(P1 = a e P2 = a, como recomendado na simulação). A simulação aprovada é a de dados/simulacoes/T-0017-v22/ (cópia da
recados/anexos/T-0017/v22-sim/). Regra fixa (R-20261120-213300): nada novo marcado nem escrito como duvidoso.

O que faz (regra 4 do CLAUDE.md):
1. VEICULOS: grava as 30 linhas da aba ANTES_DEPOIS da simulação (a coluna ENTRA: 23 "sim", 4 "só com P1 = a" e 3
   "só com P2 = a"), depois de conferir na linha o código, o modelo, a versão, o ANO_INICIO, o valor de hoje, a
   SITUACAO e o trecho da APLICACAO que prova a faixa.
   - P1 (ELE1092): só o ANO_FIM; a SITUACAO e o MOTIVO que já existem ficam.
   - P2 (ELE1068 Uno): na APLICACAO, só o trecho "19/84" vira "1984"; na VEICULOS, o Uno fica 1984–1995.
2. Uma linha no LOG_CORRECOES por célula mudada e o bloco da v22 no topo do LEIA-ME.
3. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v21 (base_comum.rodar): só podem
   mudar essas células e as linhas novas do LOG_CORRECOES e do LEIA-ME.
4. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v22.xlsx.

Uso: python3 dados/scripts/base_v22.py            (grava)
     python3 dados/scripts/base_v22.py --conferir (só compara a base de hoje com a v21)
"""
from __future__ import annotations

import sys
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import RAIZ, acrescentar_leia_me, acrescentar_log, limpo, parar, rodar  # noqa: E402

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v22" / "SIMULACAO_v22_T-0017.xlsx"
TAREFA, DATA = "T-0017", "21/11/2026"
APROVACAO = "R-20261120-223000-alexandre ('Siga recomendação do gerente': P1 = a, P2 = a)"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "FABRICANTE", "MODELO", "VERSAO", "ANO_INICIO_HOJE", "ANTES", "DEPOIS",
       "FORMA", "PROVA_NA_APLICACAO", "SITUACAO", "ENTRA"]
ESPERADO = {"sim": 23, "só com P1 = a": 4, "só com P2 = a": 3}

LEIA_ME = [
    ("BASE BAP UNIFICADA v22 (21/11/2026)", None),
    ("VEICULOS (ANO_FIM)", "23 células em 9 códigos (ELE1060, ELE1066, ELE1068, ELE1070, ELE1071, ELE1077, ELE1080, "
                           "ELE1084 e ELE1086): o ANO_FIM que se perdeu onde a APLICACAO traz a faixa 'AAAA->AAAA' "
                           "(ex.: Bora 1998->2005 fica 1998–2005). Com várias faixas no mesmo veículo, vale o maior "
                           "fim; o veículo com outro trecho aberto no texto fica como está (T-0017)."),
    ("VEICULOS (P1)", "ELE1092 Escort, Verona, Logus e Pointer: o ANO_FIM 1996 entra; a SITUACAO e o MOTIVO que já "
                      "existiam (a dúvida é da marca) ficam como estavam (T-0017)."),
    ("APLICACAO e VEICULOS (P2)", "ELE1068 Uno: na APLICACAO, '19/84' -> '1984' (só esse trecho); na VEICULOS, o Uno "
                                  "fica 1984–1995 (ANO_INICIO 1995 -> 1984 e ANO_FIM 1995) (T-0017)."),
    ("Não entram", "Nada novo marcado ou escrito como duvidoso; nenhuma linha nova na VEICULOS."),
    ("Formato", "Mesmas abas e colunas da v21 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem). 30 "
                "linhas no LOG_CORRECOES (uma por célula). Aprovado pelo Alexandre em 20/11/2026 "
                "(R-20261120-223000-alexandre)."),
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
    conta = {e: sum(1 for x in linhas if x["ENTRA"] == e) for e in ESPERADO}
    if conta != ESPERADO or len(linhas) != sum(ESPERADO.values()):
        raise SystemExit(f"[PARADO] a simulação traz {conta} ({len(linhas)} linhas); esperado {ESPERADO}")
    return linhas


def vazio(v):
    return None if v == "(vazio)" else v


def aplicar(wb, linhas):
    wv, wp = wb["VEICULOS"], wb["PRODUTOS"]
    cv = [limpo(c.value) for c in wv[1]]
    iv = {c: cv.index(c) + 1 for c in ("CODIGO_BAP", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "SITUACAO")}
    cp = [limpo(c.value) for c in wp[1]]
    ip = {c: cp.index(c) + 1 for c in ("CODIGO_BAP", "APLICACAO")}
    linha_p: dict[str, list[int]] = {}
    for n in range(2, wp.max_row + 1):
        linha_p.setdefault(limpo(wp.cell(n, ip["CODIGO_BAP"]).value), []).append(n)
    aplic = {cod: str(wp.cell(ns[0], ip["APLICACAO"]).value or "") for cod, ns in linha_p.items()}

    erros, fv, fp, log = [], {}, {}, []
    origem = f"Antes e depois em dados/simulacoes/T-0017-v22/; aprovado em {APROVACAO}. {TAREFA} (v22), {DATA}"
    for x in linhas:
        cod, col, antes, depois = x["CODIGO_BAP"], x["COLUNA"], vazio(x["ANTES"]), x["DEPOIS"]
        if len(linha_p.get(cod, [])) != 1:
            erros.append(f"{cod}: {len(linha_p.get(cod, []))} linhas na PRODUTOS; esperado 1")
            continue
        if x["ABA"] == "PRODUTOS":
            n, c = linha_p[cod][0], ip[col]
            hoje = str(wp.cell(n, c).value or "")
            if hoje.count(antes) != 1:
                erros.append(f"{cod} {col}: o trecho '{antes}' aparece {hoje.count(antes)} vezes; esperado 1")
                continue
            fp[(n, c)] = hoje.replace(antes, depois)
            log.append(["CORRECAO_APLICACAO", "PRODUTOS", cod, None,
                        f"APLICACAO: trecho '{antes}' -> '{depois}' (ano de 4 dígitos digitado como '19/84'; o resto "
                        f"da célula não muda) (P2 = a). {origem}"])
            continue
        n = x["LINHA"]
        v = {k: wv.cell(n, c).value for k, c in iv.items()}
        esperado = {"CODIGO_BAP": cod, "MODELO": x["MODELO"], "VERSAO": x["VERSAO"],
                    "ANO_INICIO": x["ANO_INICIO_HOJE"], col: antes, "SITUACAO": x["SITUACAO"]}
        if any(v[k] != e for k, e in esperado.items()):
            erros.append(f"{cod} VEICULOS linha {n}: não é a de hoje ({v}); esperado {esperado}")
            continue
        partes = [t.strip() for t in str(x["PROVA_NA_APLICACAO"]).split("‖")]
        if x["ENTRA"] != "só com P2 = a" and any(t not in aplic[cod] for t in partes):
            erros.append(f"{cod} {x['MODELO']}: a prova não está na APLICACAO")
            continue
        if x["ENTRA"] == "só com P2 = a" and "19/84->1995" not in aplic[cod]:
            erros.append(f"{cod} Uno: '19/84->1995' não está na APLICACAO")
            continue
        fv[(n, iv[col])] = depois
        veic = " ".join(str(t) for t in (x["MODELO"], x["VERSAO"]) if t)
        if x["ENTRA"] == "só com P2 = a":
            o = (f"{col} do {veic} (linha {n}): {antes if antes is not None else 'vazio (= em diante)'} -> {depois}; "
                 f"o Uno fica 1984–1995. Prova na APLICACAO: 'Uno 1.1 Brio/1.3/1.5/1.6R 19/84->1995' ('19/84' é "
                 f"1984; a mesma célula traz 'Uno Mille 1.0 1984->1995') (P2 = a)")
        else:
            ini = x["ANO_INICIO_HOJE"]
            o = (f"ANO_FIM do {veic} (linha {n}): vazio (= em diante, {ini}+) -> {depois} ({ini}–{depois}). Prova na "
                 f"APLICACAO: '{x['PROVA_NA_APLICACAO']}' (o '->' entre dois anos é a faixa)")
            if x["ENTRA"] == "só com P1 = a":
                o += " (P1 = a; a SITUACAO e o MOTIVO que já existiam, pela marca, ficam como estavam)"
        log.append(["CORRECAO_VEICULO", "VEICULOS", cod, None, f"{o}. Nada novo marcado. {origem}"])
    parar(erros)
    for (n, c), val in fv.items():
        wv.cell(n, c).value = val
    for (n, c), val in fp.items():
        wp.cell(n, c).value = val
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: VEICULOS {len(fv)}, PRODUTOS {len(fp)}; códigos {len({x['CODIGO_BAP'] for x in linhas})}; "
          f"LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")
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
    rodar(21, 22, ler, aplicar, conferir_valores)
