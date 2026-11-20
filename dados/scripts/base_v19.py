"""v19 da base unificada · T-0017 (APLICACAO, REFERENCIAS_CRUZADAS e OFERECA_JUNTO da aba PRODUTOS).

Aprovado pelo Alexandre em R-20261120-184000-alexandre (item 4): "p3 1960 quer dizer 1996, corrigir. p9 quero entender
melhor demais recomendações, pode seguir"; e a P9 em R-20261120-184600-alexandre ("1) a": CFR9006 com SCHULZ
816.5028-0 e o 815.5028-0 no histórico, como na proposta). A simulação aprovada é a de dados/simulacoes/T-0017-v19/
(cópia da recados/anexos/T-0017/v19-sim/), com 1 exceção:
- P3: o "1960" é 1996 digitado errado. Nas 35 células da P3, o "1960–2026" (e as variantes, como "1960 ATÉ 2026")
  vira "1996–2026"; o veículo não fica sem ano.
A parte da aba VEICULOS não entra (tem simulação à parte).

O que faz (regra 4 do CLAUDE.md):
1. Lê a aba TODAS_AS_CELULAS da simulação (CODIGO_BAP, LINHA_EXCEL, COLUNA, ANTES (v18), DEPOIS) e confere, célula a
   célula, que a base de hoje (v18) ainda tem na linha o mesmo código e o mesmo ANTES. Se algo não bater, para sem
   gravar. O ANTES da simulação esconde o preço antigo do histórico ("BAP BOX USD [valor omitido]"); a conferência
   esconde o da base do mesmo jeito.
2. Grava o DEPOIS em cada célula (com a exceção acima). O histórico "| ANTERIOR" não se reescreve: só o preço sai
   dele (P7), e o CFR9006 ganha o seu (P9); o script confere isso em toda célula de referência.
3. Acrescenta no fim do LOG_CORRECOES uma linha por código mudado, com a regra, a T-0017 e a data. O LEIA-ME não muda.
4. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v18: só podem mudar essas
   células (colunas APLICACAO, REFERENCIAS_CRUZADAS e OFERECA_JUNTO da PRODUTOS) e as linhas novas do LOG_CORRECOES.
5. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v19.xlsx.

Uso: python3 dados/scripts/base_v19.py            (grava)
     python3 dados/scripts/base_v19.py --conferir (só compara a base de hoje com a v18)
"""
from __future__ import annotations

import argparse
import collections
import re
import sys
import tempfile
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import BASE, RAIZ, acrescentar_log, comparar, gravar, limpo, sha, versao  # noqa: E402

V18, V19 = versao(18), versao(19)
SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v19" / "SIMULACAO_v19_T-0017.xlsx"
TAREFA, DATA, APROVACAO = "T-0017", "20/11/2026", "R-20261120-184000-alexandre"
APROVACAO_P9 = "R-20261120-184600-alexandre"
COLUNAS = ("APLICACAO", "REFERENCIAS_CRUZADAS", "OFERECA_JUNTO")

# o que a gravação tem de dar (as mesmas células da simulação)
ESPERADO = {"APLICACAO": 2105, "REFERENCIAS_CRUZADAS": 549, "OFERECA_JUNTO": 224}
P3_CELULAS = 35
# P9: o único histórico "| ANTERIOR" novo (o 815 vai para o histórico); os outros só podem perder o preço
HISTORICO_NOVO = {"CFR9006": ["| ANTERIOR: SCHULZ: 815.5028-0"]}
P9_OBS = ("REFERENCIAS_CRUZADAS 'SCHULZ: 815.5028-0 | Schulz 816.5028-0' -> 'SCHULZ: 816.5028-0 | ANTERIOR: SCHULZ: "
          "815.5028-0' (P9: a família CFR90xx é SCHULZ 816.50xx-0; o 815 vai para o histórico; " + APROVACAO_P9 + ").")

# P3 · a faixa "1960–2026" da simulação (o que a simulação tirava) e as variantes que ficaram no texto
FALSO_1960 = re.compile(r"\s*(?:\(|·\s*)?1960\s*(?:–|até)\s*2026\)?")        # o mesmo do simular_v19.py
FAIXA_1960 = re.compile(r"1960\s*(?:–|-|at[ée])\s*2026", re.I)
SEM_FAIXA = re.compile(r"\s*(?:\(|·\s*)?(?:1960\s*(?:–|-|at[ée])\s*2026|1996–2026)\)?", re.I)
ANO_CERTO = "1996–2026"

ILEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
PRECO_HIST = re.compile(r"\s*BAP\s*BOX\s*USD\s*[\d.,]+", re.I)
ANTERIOR = re.compile(r"\|\s*ANTERIOR[^|]*")

REGRA = {
    "1_SO_ANO": "modelo separado do ano colado nele e ano sem veículo tirado (item 1, P1)",
    "1_LINHA_POR_VEICULO": "uma linha por veículo, com o ano junto do veículo (item 1)",
    "3_MARCA_QUE_FALTA": "marca no começo de cada bloco (item 3, P2)",
    "4_CASOS": "texto corrigido caso a caso (item 4, P4 e P5)",
    "4_FORMATO_ANO": "ano com 4 dígitos, intervalo com '–' e 'em diante' com '>' (item 4)",
    "4_CAIXA": "caixa do modelo como no dicionário (item 4)",
    "5_REF_PROPRIA": "sai a referência ao próprio código BAP (item 5)",
    "6_USD": "sai o preço de compra do histórico '| ANTERIOR', o resto do histórico fica (item 6, P7)",
    "7_REPETIDAS": "sai a referência repetida (item 7)",
    "9_NAKATA": "rótulo 'Nakata' -> 'NAKATA' (item 9, P8)",
    "10_CODIGOS_ESTRANHOS": "código estranho corrigido ou tirado: '#N/A', 'NT', 'S/REF', SUNRISE, 'Axios'/'Ima'/'OEM', "
                            "SCHULZ (item 10, P9, P10 e P11)",
    "11_OFERECA_JUNTO": "item do 'Leve também' sem o mesmo veículo trocado ou tirado (item 11, P13)",
    "12_APLICACAO_NA_REF": "sai da referência o texto de aplicação que a APLICACAO já tem (item 12, P15)",
    "13_DATA_SEM_TRACO": "data com o traço: 'MM/AAAA–MM/AAAA' (item 13)",
    "14_JUH70010": "'(MM/AAAA)' -> 'MM/AAAA>' e 'SKF / PERFEC PN: VKJA' -> 'SKF: VKJA' (item 14)",
}
SIGLA = {"APLICACAO": "APLICACAO", "REFERENCIAS_CRUZADAS": "REFERENCIA", "OFERECA_JUNTO": "OFERECA_JUNTO"}


def limpa(v) -> str:
    """Igual ao limpa() do simular_v19.py: tira caractere inválido e esconde o valor do preço antigo."""
    s = "" if v is None else str(v)
    return re.sub(r"(BAP\s*BOX\s*USD\s*)[\d.,]+", r"\1[valor omitido]", ILEGAL.sub(" ", s), flags=re.I)


def ler_simulacao():
    wb = openpyxl.load_workbook(SIM, read_only=True)
    rows = list(wb["TODAS_AS_CELULAS"].iter_rows(values_only=True))
    cab = list(rows[0])
    todas = [dict(zip(cab, r)) for r in rows[1:] if any(v is not None for v in r)]
    p3 = {}
    for r in list(wb["4_FORMATO_ANO"].iter_rows(values_only=True))[1:]:
        if r and r[6] == "P3":
            p3[str(r[0])] = (str(r[2]), str(r[3]))           # ANTES e DEPOIS do passo da P3
    wb.close()
    return todas, p3


def corrigir_p3(cod: str, passo: tuple[str, str], final_sim: str) -> str:
    """Põe "1996–2026" onde a simulação tirava o "1960–2026", sem mexer no resto do texto final da simulação."""
    antes, depois = passo
    if FALSO_1960.sub("", antes) != depois:
        raise SystemExit(f"[PARADO] {cod}: o passo da P3 na simulação não é só a faixa 1960–2026")
    if len(final_sim) != len(depois):          # depois da P3 só pode vir a caixa do modelo (mesmo tamanho)
        raise SystemExit(f"[PARADO] {cod}: o texto mudou de tamanho depois da P3; refazer à mão")
    partes, ia, iff = [], 0, 0
    for m in FALSO_1960.finditer(antes):
        n = m.start() - ia
        partes.append(final_sim[iff:iff + n])
        partes.append(FAIXA_1960.sub(ANO_CERTO, m.group(0)))
        iff, ia = iff + n, m.end()
    partes.append(final_sim[iff:])
    novo = FAIXA_1960.sub(ANO_CERTO, "".join(partes))        # e as variantes que a simulação não tirou
    feitas = len(FALSO_1960.findall(antes)) + len(FAIXA_1960.findall(final_sim))
    if (FAIXA_1960.search(novo) or SEM_FAIXA.sub("", novo) != SEM_FAIXA.sub("", final_sim)
            or novo.count(ANO_CERTO) != final_sim.count(ANO_CERTO) + feitas):
        raise SystemExit(f"[PARADO] {cod}: a troca 1960 -> 1996 mexeu em outra parte do texto")
    return novo


def obs_log(cod: str, cols: list[str], itens: list[str], p3: bool, oj: tuple[str, str] | None) -> str:
    regras = [REGRA[i] for i in itens]
    if p3:
        regras.append("'1960–2026' -> '1996–2026' (P3: o 1960 era 1996 digitado errado)")
    txt = f"{' e '.join(cols)}: " + "; ".join(regras) + "."
    if oj:
        txt += f" OFERECA_JUNTO '{oj[0]}' -> '{oj[1] or 'vazio'}'."
    if cod in HISTORICO_NOVO and "REFERENCIAS_CRUZADAS" in cols:
        txt += " " + P9_OBS
    return (txt + f" Antes e depois em dados/simulacoes/T-0017-v19/ (aba TODAS_AS_CELULAS); aprovado em {APROVACAO}. "
            f"{TAREFA} (v19), {DATA}")


def aplicar(wb, todas, p3):
    ws = wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    col = {c: i + 1 for i, c in enumerate(cab)}
    erros, feitas, por_cod = [], {}, collections.OrderedDict()
    conta, p3_feitas = collections.Counter(), 0
    for m in todas:
        cod, n, coluna = limpo(m["CODIGO_BAP"]), int(m["LINHA_EXCEL"]), limpo(m["COLUNA"])
        if coluna not in COLUNAS:
            erros.append(f"{cod}: coluna {coluna} fora da tarefa")
            continue
        c = col[coluna]
        atual = ws.cell(n, c).value
        if limpo(ws.cell(n, col["CODIGO_BAP"]).value) != cod:
            erros.append(f"linha {n}: código {ws.cell(n, 1).value!r} na base e {cod!r} na simulação")
        if limpa(atual) != limpa(m["ANTES (v18)"]):
            erros.append(f"{cod} {coluna}: o ANTES da simulação não é o valor da base de hoje")
        novo = "" if m["DEPOIS (v19 simulada)"] is None else str(m["DEPOIS (v19 simulada)"])
        if coluna == "APLICACAO" and cod in p3:
            novo = corrigir_p3(cod, p3[cod], novo)
            p3_feitas += 1
        if "valor omitido" in novo or re.search(r"\bUSD\b|R\$", novo):
            erros.append(f"{cod} {coluna}: o DEPOIS tem preço")
        if coluna == "REFERENCIAS_CRUZADAS":
            antes = [PRECO_HIST.sub("", x) for x in ANTERIOR.findall(str(atual or ""))]
            if antes + HISTORICO_NOVO.get(cod, []) != ANTERIOR.findall(novo):
                erros.append(f"{cod}: o histórico '| ANTERIOR' mudaria além do preço")
        feitas[(n, c)] = novo if novo else None
        conta[coluna] += 1
        itens = [i.strip() for i in limpo(m["ITENS"]).split(",") if i.strip()]
        reg = por_cod.setdefault(cod, {"cols": [], "itens": [], "p3": False, "oj": None})
        reg["cols"].append(coluna)
        reg["itens"] += [i for i in itens if i not in reg["itens"]]
        reg["p3"] |= coluna == "APLICACAO" and cod in p3
        if coluna == "OFERECA_JUNTO":
            reg["oj"] = (limpo(atual), novo)
    if dict(conta) != ESPERADO or p3_feitas != P3_CELULAS:
        erros.append(f"células {dict(conta)} e P3 {p3_feitas}; esperado {ESPERADO} e P3 {P3_CELULAS}")
    if erros:
        print("[PARADO] nada foi gravado:")
        for e in erros[:30]:
            print("   ", e)
        sys.exit(2)
    for (n, c), v in feitas.items():
        ws.cell(n, c).value = v

    linhas = []
    for cod, reg in sorted(por_cod.items()):
        cols = [c for c in COLUNAS if c in reg["cols"]]
        itens = sorted(reg["itens"], key=list(REGRA).index)
        linhas.append(["CORRECAO_" + "_".join(SIGLA[c] for c in cols), "PRODUTOS", cod, None,
                       obs_log(cod, cols, itens, reg["p3"], reg["oj"])])
    ult = acrescentar_log(wb, linhas)
    print(f"  células: {dict(conta)} (P3 {p3_feitas}); produtos: {len(por_cod)}; LOG_CORRECOES +{len(linhas)}")
    return {"PRODUTOS": set(feitas)}, feitas, ult


def conferir_valores(p: Path, feitas: dict) -> list[str]:
    wb = openpyxl.load_workbook(p)
    ws = wb["PRODUTOS"]
    return [f"PRODUTOS {ws.cell(n, c).coordinate}: valor diferente do da gravação"
            for (n, c), v in feitas.items() if ws.cell(n, c).value != v]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--conferir", action="store_true", help="só compara a base de hoje com a v18")
    arg = ap.parse_args()
    todas, p3 = ler_simulacao()
    if arg.conferir:
        celulas, feitas, ult = aplicar(openpyxl.load_workbook(V18), todas, p3)
        dif = comparar(BASE, V18, celulas, ult, "v18") + conferir_valores(BASE, feitas)
        for d in dif[:30]:
            print("   ", d)
        sys.exit(1 if dif else 0)
    if V19.exists():
        raise SystemExit(f"[PARADO] {V19.name} já existe: a v19 já foi gravada")
    if sha(BASE) != sha(V18):
        raise SystemExit("[PARADO] a base de hoje não é a v18: refaça a simulação")
    wb = openpyxl.load_workbook(BASE)
    celulas, feitas, ult = aplicar(wb, todas, p3)
    with tempfile.TemporaryDirectory() as tmp:
        nova = Path(tmp) / BASE.name
        wb.save(nova)
        dif = comparar(nova, V18, celulas, ult, "v18") + conferir_valores(nova, feitas)
        if dif:
            print("[PARADO] a base nova difere da v18 fora do que a tarefa pede (nada foi gravado):")
            for d in dif[:30]:
                print("   ", d)
            sys.exit(2)
        gravar(nova, V19)


if __name__ == "__main__":
    main()
