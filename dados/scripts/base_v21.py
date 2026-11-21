"""v21 da base unificada · T-0017 (limpeza da APLICACAO e da REFERENCIAS_CRUZADAS; 3 linhas falsas saem).

Aprovado pelo Alexandre em R-20261120-213300-alexandre: "a) aprovado, mas nao marque nem escreva nada como duvidoso."
Confirmado em R-20261120-213800-alexandre ("a) sim"). Entram as perguntas P1 a P8 e a P13 da simulação, como recomendado,
e os itens sem pergunta (1, 3, 5, 6 e 8). NÃO entram a P9 (ANO_DUVIDA das 617 linhas de variante), a P10 (JUH70010),
a P11 (os 3 "X1") e a P12 (as 50 linhas novas da VEICULOS): nada novo é marcado nem escrito como duvidoso, e a aba
VEICULOS só muda na P14 (R-20261120-213900-alexandre, "3) a"): o ANO_FIM perdido de 2 linhas, onde o texto da
APLICACAO prova. A simulação aprovada é a de dados/simulacoes/T-0017-v21/ (cópia da recados/anexos/T-0017/v21-sim/).

O que faz (regra 4 do CLAUDE.md):
1. APLICACAO: grava o FINAL da aba TODAS_AS_CELULAS da simulação, depois de conferir que o texto de hoje é o V20 dela.
2. REFERENCIAS_CRUZADAS: a simulação mostra o fornecedor como "[fornecedor omitido]", então o texto não sai dela; as
   4 trocas (P7, P8 e o Bosch do MF21) são refeitas aqui e conferidas com o V20 e o FINAL da simulação, com a mesma
   máscara.
3. P13: tira da PRODUTOS as 3 linhas falsas ("Veículo", "HYUNDAI", "KIA MOTORS"), que eram as linhas da tabela de
   aplicação do CRU100 na planilha de origem. O conteúdo inteiro de cada uma (as 18 colunas) fica no LOG_CORRECOES.
   As linhas de baixo sobem 3, e o filtro da aba termina na nova última linha.
4. Uma linha no LOG_CORRECOES por código mudado ou tirado, e o bloco da v21 no topo do LEIA-ME.
5. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v20 (base_comum.rodar): só podem
   mudar essas células, as 3 linhas tiradas e as linhas novas do LOG_CORRECOES e do LEIA-ME.
6. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v21.xlsx.

Uso: python3 dados/scripts/base_v21.py            (grava)
     python3 dados/scripts/base_v21.py --conferir (só compara a base de hoje com a v20)
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import RAIZ, acrescentar_leia_me, acrescentar_log, limpo, parar, rodar, subir, versao  # noqa: E402

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v21" / "SIMULACAO_v21_T-0017.xlsx"
TAREFA, DATA = "T-0017", "21/11/2026"
APROVACAO = "R-20261120-213300-alexandre (P1 a P8 e P13 como recomendado; P9 a P12 não entram; confirmado em " \
            "R-20261120-213800-alexandre)"
ESPERADO = {"APLICACAO": 105, "REFERENCIAS_CRUZADAS": 334}
FALSAS = ("Veículo", "HYUNDAI", "KIA MOTORS")
# P14 (R-20261120-213900-alexandre, "3) a"): o ano final perdido na VEICULOS, só onde o texto da APLICACAO prova.
# (código, modelo, ANO_INICIO de hoje, ANO_FIM novo, trecho da APLICACAO que prova). O CV-F35 (Fiesta 2010+) fica:
# o texto tem "Fiesta 1.6 16v / Sigma 05/2010–04/2013" e também "Fiesta 1.6 16v Ti-Vct/ Sigma 04/2013" (a partir de
# 04/2013), e a linha junta os dois pela faixa mais larga (V3 da v20).
APROVACAO_P14 = "R-20261120-213900-alexandre"
P14 = [
    ("ELE1084", "Gol", 1984, 1994, "Gol I 1.0/1.6/1.6D/1.8/2.0 GTI 1984->1994",
     "o '->' é a faixa: de 1984 a 1994"),
    ("KF27", "Civic", 2006, 2006, "Civic 2006;",
     "o texto dá só o ano 2006; na mesma célula, o 'em diante' vem marcado com '→' (Blazer EV 2025 →, Cruze 2017 →)"),
]

# o que cada item da simulação faz (vai na OBSERVACAO do LOG)
ITENS = {
    "1": "faixa fechada com '>' ou modelo colado no ano ('2008–20142019' -> '2008 (2014–2019)', 'Axor 1933–2005>' -> "
         "'Axor 1933 (2005>)', '3/02>' -> '03/2002>'; P1 e P2)",
    "2": "' - nan' sai e a marca fica (P3)",
    "3": "MF21: marcas trocadas na v19 corrigidas (Fortwo SMART, GR Supra TOYOTA, Boxter PORSCHE, CLS e GLB no MB; P4)",
    "4": "sem ano no fim: ' - DE' e 'em Diante' sem ano saem (P5); 'AAAA até' sem o ano final -> 'AAAA>' (P6)",
    "5": "linha ou veículo idêntico a um de antes sai; fica a 1ª vez",
    "6": "ano solto ou pedaço do veículo quebrado na linha de baixo volta para o veículo; aviso de página "
         "('Contnua...', '..continuação') sai",
    "8": "atributo repetido em seguida, no mesmo veículo, sai",
}
# as trocas da REFERENCIAS_CRUZADAS, na ordem da simulação: (item, padrão, troca)
REF_TROCAS = [
    ("3", r"BOSCH: 397016728\b", "BOSCH: 3397016728"),
    ("7", r"(,\s*)Cofap:", r"\1COFAP:"),
    ("7", r"Marca Ref\. NAKATA:", "NAKATA:"),
    ("7b", r"\bRT#:", "RT:"),
]
REF_ITEM = {"3": "Bosch sem o primeiro 3 (MF21)", "7": "rótulo da 2ª marca: 'Cofap:' -> 'COFAP:', 'Marca Ref. NAKATA:' "
            "-> 'NAKATA:' (P7)", "7b": "'RT#:' -> 'RT:' (P8)"}

LEIA_ME = [
    ("BASE BAP UNIFICADA v21 (21/11/2026)", None),
    ("APLICACAO", "105 itens: faixa fechada com '>' e modelo colado no ano ('2008–20142019' -> '2008 (2014–2019)'); "
                  "' - nan' sai; marcas do MF21; ' - DE' e 'em Diante' sem ano saem; 'AAAA até' sem o ano final -> "
                  "'AAAA>'; linhas e veículos repetidos saem (fica a 1ª vez); ano e pedaço do veículo quebrados na "
                  "linha de baixo voltam para o veículo; atributo repetido sai (T-0017)."),
    ("REFERENCIAS_CRUZADAS", "334 itens: 'Cofap:' -> 'COFAP:' (81), 'Marca Ref. NAKATA:' -> 'NAKATA:' (6), 'RT#:' -> "
                             "'RT:' (246) e o Bosch do MF21 com o 3 da frente (T-0017)."),
    ("PRODUTOS (linhas)", "Saem 3 linhas falsas das Cruzetas ('Veículo', 'HYUNDAI', 'KIA MOTORS'): eram a tabela de "
                          "aplicação do CRU100 na planilha de origem. O conteúdo inteiro está no LOG_CORRECOES (T-0017)."),
    ("VEICULOS (P14)", "ANO_FIM que se perdeu, só onde o texto da APLICACAO prova: ELE1084 Gol 1984 -> 1984–1994 "
                       "('1984->1994') e KF27 Civic 2006 -> 2006–2006 ('Civic 2006', sem o '→' dos outros) "
                       "(R-20261120-213900-alexandre) (T-0017)."),
    ("Não entram", "Nada novo marcado ou escrito como duvidoso (P9 a P12 da simulação)."),
    ("Formato", "Mesmas abas e colunas da v20 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem). 443 linhas no LOG_CORRECOES (uma por código na PRODUTOS e uma por célula na "
                "VEICULOS). Aprovado pelo Alexandre "
                "em 20/11/2026 (R-20261120-213300-alexandre e R-20261120-213800-alexandre)."),
    (None, None),
]


def mascara(t):
    """A mesma máscara da simulação (simular_v21.py): o fornecedor e o preço do histórico não aparecem lá."""
    t = re.sub(r"(?i)(AUTO\W{0,3}IMPACT|SUN\W{0,3}RISE)[^:;,]*:\s*[^;,]*", "[fornecedor omitido]", t or "")
    return re.sub(r"(?i)BAP\s+BOX\s+USD[^;|]*", "BAP BOX USD [valor omitido]", t)


def linhas_falsas() -> set[int]:
    """As linhas das 3 falsas na PRODUTOS da v20 (a base de partida)."""
    wb = openpyxl.load_workbook(versao(20), read_only=True)
    achadas = {limpo(r[0].value): r[0].row for r in wb["PRODUTOS"].iter_rows(min_row=2, max_col=1)
               if limpo(r[0].value) in FALSAS}
    wb.close()
    if sorted(achadas) != sorted(FALSAS):
        raise SystemExit(f"[PARADO] linhas falsas achadas: {sorted(achadas)}; esperado {list(FALSAS)}")
    return set(achadas.values())


REMOVIDAS = linhas_falsas()


def ler():
    """A aba TODAS_AS_CELULAS: {(código, coluna): (itens, V20, FINAL)} e as linhas da aba 11_LINHAS_FALSAS."""
    wb = openpyxl.load_workbook(SIM, read_only=True)
    it = wb["TODAS_AS_CELULAS"].iter_rows(values_only=True)
    cab = list(next(it))
    if cab != ["CODIGO_BAP", "ABA", "COLUNA", "ITENS", "V20", "FINAL"]:
        raise SystemExit(f"[PARADO] cabeçalho da TODAS_AS_CELULAS: {cab}")
    celulas = {(r[0], r[2]): (limpo(r[3]), r[4] or "", r[5] or "") for r in it if r[0]}
    falsas = [r[0] for r in wb["11_LINHAS_FALSAS"].iter_rows(min_row=2, values_only=True) if r[0]]
    wb.close()
    if sorted(falsas) != sorted(FALSAS):
        raise SystemExit(f"[PARADO] a simulação tira {falsas}; esperado {list(FALSAS)}")
    conta = {c: sum(1 for k in celulas if k[1] == c) for c in ESPERADO}
    if conta != ESPERADO:
        raise SystemExit(f"[PARADO] a simulação traz {conta}; esperado {ESPERADO}")
    return celulas


def trocar_ref(t: str) -> tuple[str, list[str]]:
    itens = []
    for item, pat, rep in REF_TROCAS:
        t, k = re.subn(pat, rep, t)
        if k and item not in itens:
            itens.append(item)
    return t, itens


def aplicar(wb, celulas):
    ws = wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    col = {c: cab.index(c) + 1 for c in ("CODIGO_BAP", "APLICACAO", "REFERENCIAS_CRUZADAS")}
    linha, repetidos = {}, set()
    for n in range(2, ws.max_row + 1):
        cod = limpo(ws.cell(n, col["CODIGO_BAP"]).value)
        if cod in linha:
            repetidos.add(cod)
        linha[cod] = n
    erros, feitas, obs = [], {}, {}
    for (cod, coluna), (itens, v20, final) in celulas.items():
        if cod in repetidos or cod not in linha:
            erros.append(f"{cod}: {'repetido' if cod in repetidos else 'não achado'} na PRODUTOS")
            continue
        n, c = linha[cod], col[coluna]
        antes = ws.cell(n, c).value or ""
        if coluna == "APLICACAO":
            if antes != v20:
                erros.append(f"{cod}: a APLICACAO de hoje não é o V20 da simulação")
                continue
            depois = final
            texto = "; ".join(ITENS[i.strip()] for i in itens.split(","))
        else:
            depois, its = trocar_ref(antes)
            if mascara(antes) != v20 or mascara(depois) != final:
                erros.append(f"{cod}: a REFERENCIAS_CRUZADAS refeita não bate com a simulação")
                continue
            texto = "; ".join(REF_ITEM[i] for i in its)
        if depois == antes or not depois:
            erros.append(f"{cod} {coluna}: o DEPOIS é igual ao de hoje ou vazio")
            continue
        feitas[(n, c)] = depois
        obs.setdefault(cod, []).append((coluna, f"{coluna}: '{antes}' -> '{depois}' ({texto})"))
    parar(erros)
    for (n, c), v in feitas.items():
        ws.cell(n, c).value = v

    origem = f"Antes e depois em dados/simulacoes/T-0017-v21/; aprovado em {APROVACAO}. {TAREFA} (v21), {DATA}"
    log = []
    for cod in sorted(obs):
        cols = {c for c, _ in obs[cod]}
        tipo = ("CORRECAO_APLICACAO_REFERENCIA" if len(cols) == 2 else
                "CORRECAO_APLICACAO" if "APLICACAO" in cols else "CORRECAO_REFERENCIA")
        log.append([tipo, "PRODUTOS", cod, None, ". ".join(t for _, t in sorted(obs[cod])) + ". " + origem])
    if sorted(REMOVIDAS) != sorted(linha[c] for c in FALSAS):
        raise SystemExit("[PARADO] as linhas falsas mudaram de lugar")
    for cod in FALSAS:
        n = linha[cod]
        conteudo = " | ".join(f"{cab[j]}={ws.cell(n, j + 1).value if ws.cell(n, j + 1).value is not None else ''}"
                              for j in range(len(cab)))
        log.append(["LINHA_REMOVIDA", "PRODUTOS", cod, "CRU100",
                    f"Linha {n} da PRODUTOS tirada (P13): não é produto; é a linha da tabela de aplicação do CRU100 na "
                    f"planilha de origem (CATALOGO_BAP_AGENTE_PRONTO.xlsx), com o código igual à aplicação. Conteúdo "
                    f"inteiro: {conteudo}. {origem}"])
    feitas_v = p14(wb, log)
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    for n in sorted(REMOVIDAS, reverse=True):
        ws.delete_rows(n)
    if ws.auto_filter.ref:
        ws.auto_filter.ref = re.sub(r"\d+$", str(ws.max_row), ws.auto_filter.ref)
    print(f"  células: PRODUTOS {len(feitas)} ({sum(1 for k in celulas if k[1] == 'APLICACAO')} APLICACAO, "
          f"{sum(1 for k in celulas if k[1] == 'REFERENCIAS_CRUZADAS')} REFERENCIAS_CRUZADAS); linhas tiradas "
          f"{len(REMOVIDAS)}; LOG_CORRECOES +{len(log)}; LEIA-ME +{leia_n}")
    return {"PRODUTOS": set(feitas), "VEICULOS": set(feitas_v)}, ult, leia_n, (feitas, feitas_v)


def p14(wb, log: list) -> dict:
    """As células ANO_FIM da P14: confere o veículo, o ano de hoje e o trecho da APLICACAO; acrescenta o LOG."""
    ws, wp = wb["VEICULOS"], wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    i = {c: cab.index(c) + 1 for c in ("CODIGO_BAP", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "SITUACAO", "ANO_DUVIDA")}
    cabp = [limpo(c.value) for c in wp[1]]
    aplic = {limpo(r[0]): str(r[cabp.index("APLICACAO")] or "") for r in wp.iter_rows(min_row=2, values_only=True)}
    feitas = {}
    for cod, modelo, ini, fim, trecho, porque in P14:
        achadas = [n for n in range(2, ws.max_row + 1) if limpo(ws.cell(n, i["CODIGO_BAP"]).value) == cod
                   and limpo(ws.cell(n, i["MODELO"]).value) == modelo and not ws.cell(n, i["VERSAO"]).value]
        if len(achadas) != 1:
            raise SystemExit(f"[PARADO] P14 {cod} {modelo}: {len(achadas)} linhas na VEICULOS; esperado 1")
        n = achadas[0]
        v = {k: ws.cell(n, c).value for k, c in i.items()}
        if (v["ANO_INICIO"], v["ANO_FIM"], v["SITUACAO"], v["ANO_DUVIDA"]) != (ini, None, "separado", None):
            raise SystemExit(f"[PARADO] P14 {cod} {modelo}: a linha {n} não é a de hoje ({v})")
        if trecho not in aplic.get(cod, ""):
            raise SystemExit(f"[PARADO] P14 {cod}: o trecho '{trecho}' não está na APLICACAO")
        feitas[(n, i["ANO_FIM"])] = fim
        log.append(["CORRECAO_VEICULO", "VEICULOS", cod, None,
                    f"ANO_FIM do {modelo} (linha {n}): vazio (= em diante, {ini}+) -> {fim} ({ini}–{fim}). Prova na "
                    f"APLICACAO: '{trecho}' ({porque}). Nada marcado como duvidoso. Aprovado em {APROVACAO_P14} "
                    f"(P14, '3) a'). {TAREFA} (v21), {DATA}"])
    for (n, c), val in feitas.items():
        ws.cell(n, c).value = val
    return feitas


def conferir_valores(p: Path, extra) -> list[str]:
    """Na base gravada, cada célula tem o valor da gravação (na linha que subiu) e as 3 falsas não estão mais."""
    feitas, feitas_v = extra
    wb = openpyxl.load_workbook(p)
    ws = wb["PRODUTOS"]
    dif_v = [f"VEICULOS {wb['VEICULOS'].cell(n, c).coordinate}: valor diferente do da gravação"
             for (n, c), v in feitas_v.items() if wb["VEICULOS"].cell(n, c).value != v]
    dif = [f"PRODUTOS {ws.cell(subir(n, REMOVIDAS), c).coordinate}: valor diferente do da gravação"
           for (n, c), v in feitas.items() if ws.cell(subir(n, REMOVIDAS), c).value != v]
    ficou = [r[0].value for r in ws.iter_rows(min_row=2, max_col=1) if limpo(r[0].value) in FALSAS]
    return dif + dif_v + ([f"PRODUTOS: as linhas falsas ainda estão lá: {ficou}"] if ficou else [])


if __name__ == "__main__":
    rodar(20, 21, ler, aplicar, conferir_valores, removidas={"PRODUTOS": REMOVIDAS})
