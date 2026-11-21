"""v20 da base unificada · T-0017 (ano e cilindrada de cada veículo na aba VEICULOS).

Aprovado pelo Alexandre em R-20261120-191700-alexandre, resposta à pergunta 4: "4) a" ("VEICULOS (cilindrada e anos por
veículo): a) seguir as 9 recomendações (V1 a V9), 'aprovado', e gravar como v20"). E, na mesma v20, em
R-20261120-194600-alexandre ("2) 1996"): na APLICACAO do CXD13179, do ELE1018 e do ELE1030, o "1960>" do bloco
"FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional" é 1996 digitado errado (como a P3 da v19) e vira "1996>".
A VEICULOS desses 3 códigos não tem o ano 1960 (o bloco não tem veículo), então lá nada muda por isso.
A V6a, aprovada no mesmo "4) a", também muda a APLICACAO: no TER5599096 e no TER5599097, "HONDA - New Civic 06/2011"
vira "HONDA - New Civic 2006–2011", como na aba CASOS_DO_TESTES da simulação ("APLICACAO proposta (v20)").
A simulação aprovada é a de dados/simulacoes/T-0017-v20/ (cópia da recados/anexos/T-0017/veiculos-sim/). Ela foi
feita sobre a v19 recriada numa cópia; refeita sobre a v19 gravada (PR #60), a VEICULOS sai idêntica (a P9 só mexe na
REFERENCIAS_CRUZADAS).

O que faz (regra 4 do CLAUDE.md):
1. Lê a aba VEICULOS_DEPOIS da simulação (as 17.270 linhas, 11 colunas) e confere, linha a linha, que a base de hoje
   (v19) tem o mesmo veículo (CODIGO_BAP, FABRICANTE, MODELO, VERSAO, ORIGEM) e que só muda o que a simulação muda:
   ANO_INICIO e ANO_FIM (vazios na v19), as 2 colunas novas no fim (CILINDRADA e ANO_DUVIDA) e, na V5, SITUACAO e MOTIVO
   do FLU15001 e do FLU15002 ("ml" é mililitro, não o Mercedes-Benz ML). Se algo não bater, para sem gravar.
   Única troca no texto da simulação: o MOTIVO da V5 diz "(T-0017, v19)" e é gravado como "(T-0017, v20)", a versão
   em que entra.
2. Troca o "1960>" por "1996>" nas 3 células da APLICACAO (confere que é a única ocorrência de 1960 no texto) e grava
   a APLICACAO proposta da V6a nas 2 células do TER (confere que a de hoje é a "APLICACAO hoje (v19)" da simulação).
   Grava as células e acrescenta no fim do LOG_CORRECOES uma linha por código e aba, com o que mudou, a T-0017 e a
   data.
   No topo do LEIA-ME entram o bloco da v20 e o da v19 (a v19 não o escreveu e o título ficou "v18"; revisor do #60),
   como da v15 à v18. Na PRODUTOS só mudam as 5 células da APLICACAO; as outras abas não mudam.
3. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v19: só podem mudar essas
   células (VEICULOS e as 5 da APLICACAO), as linhas novas do LOG_CORRECOES e as do topo do LEIA-ME (com o texto
   conferido, não só a contagem); as 2 colunas novas só têm valor nas células da simulação.
4. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v20.xlsx.

Uso: python3 dados/scripts/base_v20.py            (grava)
     python3 dados/scripts/base_v20.py --conferir (só compara a base de hoje com a v19)
"""
from __future__ import annotations

import collections
import sys
from copy import copy
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import RAIZ, acrescentar_leia_me, acrescentar_log, limpo, rodar  # noqa: E402

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v20" / "SIMULACAO_VEICULOS_v19_T-0017.xlsx"
TAREFA, DATA, APROVACAO = "T-0017", "20/11/2026", "R-20261120-191700-alexandre"
ABA = "VEICULOS"
NOVAS = ["CILINDRADA", "ANO_DUVIDA"]
LARGURA = {"CILINDRADA": 14, "ANO_DUVIDA": 50}
IDENTIDADE = ("CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "ORIGEM")
V5 = {"FLU15001", "FLU15002"}
V5_TROCA = ("(T-0017, v19)", "(T-0017, v20)")

# o que a gravação tem de dar (as mesmas células da simulação)
ESPERADO = {"ANO_INICIO": 13851, "ANO_FIM": 10027, "SITUACAO": 2, "MOTIVO": 2, "CILINDRADA": 6997, "ANO_DUVIDA": 2236}
CODIGOS = 3815

# R-20261120-194600-alexandre ("2) 1996"): o 1960 do "Fora DA Frota Nacional" é 1996
APROVACAO_1960 = "R-20261120-194600-alexandre"
COD_1960 = ("CXD13179", "ELE1018", "ELE1030")
TROCA_1960 = ("Fora DA Frota Nacional 1960>", "Fora DA Frota Nacional 1996>")
COD_V6 = ("TER5599096", "TER5599097")      # V6a: a APLICACAO proposta da aba CASOS_DO_TESTES

LEIA_ME = [
    ("BASE BAP UNIFICADA v20 (20/11/2026)", None),
    ("VEICULOS (anos)", "ANO_INICIO e ANO_FIM preenchidos com o ano do trecho da APLICACAO da v19 em que o modelo "
                        "aparece (13851 e 10027 linhas; ANO_FIM vazio = em diante; ANO_INICIO vazio = até). O mesmo "
                        "veículo citado mais de uma vez fica numa linha, com as cilindradas juntas e a faixa mais "
                        "larga (V3). Ano solto sem mês = a partir de (V4). TER5599096 e TER5599097 (New Civic 06/2011)"
                        " = 2006–2011 (V6). Ano solto (MM/AAAA): 17 pela faixa do par do Leve também, os outros com "
                        "ano duvidoso (V7). Também nas linhas duvidoso (V9) (T-0017)."),
    ("Colunas novas", "No fim da VEICULOS, depois de MOTIVO: CILINDRADA (texto: '1.6', '1.0 / 1.6', moto '125cc'; 6997"
                      " linhas) e ANO_DUVIDA (vazio = ano firme; preenchido = o motivo da dúvida: o ano aparece, mas "
                      "não filtra; 2236 linhas) (V1 e V2)."),
    ("APLICACAO", "CXD13179, ELE1018 e ELE1030: 'FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1960>' -> '... "
                  "1996>' (o 1960 era 1996 digitado errado, como a P3 da v19; R-20261120-194600-alexandre) (T-0017)."),
    ("APLICACAO (V6)", "TER5599096 e TER5599097: 'HONDA - New Civic 06/2011' -> 'HONDA - New Civic 2006–2011' (o "
                       "'06' é 2006, como o par TAX10288) (T-0017)."),
    ("VEICULOS (correção)", "FLU15001 e FLU15002 (fluido DOT 3 e DOT 4, universais): o 'Mercedes-Benz ML' era o '500 "
                            "ml'; SITUACAO separado -> duvidoso, com o motivo (V5). Nenhuma linha entrou nem saiu "
                            "(17270)."),
    ("Formato", "A VEICULOS ganha 2 colunas no fim (CILINDRADA e ANO_DUVIDA); as 9 de antes ficam na mesma ordem e com"
                " o mesmo nome. Aba PRODUTOS com o formato igual ao da v19; só mudam 5 células da APLICACAO (as 5 "
                "primeiras colunas, que a BAP Central lê, ficam na mesma ordem). 3820 linhas no LOG_CORRECOES (uma por"
                " código e aba: 3815 da VEICULOS e 5 da APLICACAO). Aprovado pelo Alexandre em 20/11/2026 "
                "(R-20261120-191700-alexandre: V1 a V9 como recomendado; R-20261120-194600-alexandre: o 1996)."),
    (None, None),
    ("BASE BAP UNIFICADA v19 (20/11/2026)", None),
    ("APLICACAO", "2105 itens: uma linha por veículo, com o ano junto do veículo e a marca no começo do bloco; ano com"
                  " 4 dígitos, intervalo com '–' e 'em diante' com '>'. O '1960–2026' era 1996 digitado errado e virou"
                  " '1996–2026' (P3) (T-0017)."),
    ("REFERENCIAS_CRUZADAS", "549 itens: saem a referência ao próprio código BAP, as repetidas, o texto de aplicação e"
                             " os códigos estranhos ('#N/A', 'NT', 'S/REF'); 'Nakata' -> 'NAKATA'. O histórico '| "
                             "ANTERIOR' fica, sem o preço de compra. CFR9006: SCHULZ 816.5028-0, com o 815.5028-0 no "
                             "histórico (P9) (T-0017)."),
    ("OFERECA_JUNTO", "224 itens: o item do Leve também sem o mesmo veículo foi trocado ou tirado (T-0017)."),
    ("Formato", "Formato igual ao da v18 (mesmas abas e colunas). 2878 células mudadas na PRODUTOS (APLICACAO, "
                "REFERENCIAS_CRUZADAS e OFERECA_JUNTO; das 5 primeiras colunas, que a BAP Central lê, mudam textos da "
                "APLICACAO e da REFERENCIAS_CRUZADAS). 2485 linhas no LOG_CORRECOES (uma por código). Aprovado pelo "
                "Alexandre em 20/11/2026 (R-20261120-184000-alexandre e R-20261120-184600-alexandre). Bloco escrito na"
                " v20."),
    (None, None),
]


def ler():
    """As linhas da VEICULOS_DEPOIS e, da ANTES_E_DEPOIS, a pergunta (V1 a V9) de cada linha: {linha: (código, Vn)}."""
    wb = openpyxl.load_workbook(SIM, read_only=True)
    linhas = [list(r) for r in wb["VEICULOS_DEPOIS"].iter_rows(values_only=True)]
    ad = wb["ANTES_E_DEPOIS"].iter_rows(values_only=True)
    cab = list(next(ad))
    il, ic, ip = cab.index("LINHA_NA_VEICULOS"), cab.index("CODIGO_BAP"), cab.index("PERGUNTA")
    perguntas = {int(r[il]): (limpo(r[ic]), limpo(r[ip])) for r in ad if r[il] is not None}
    ct = wb["CASOS_DO_TESTES"].iter_rows(values_only=True)
    cab = list(next(ct))
    ih, ix = cab.index("APLICACAO hoje (v19)"), cab.index("APLICACAO proposta (v20, não entra na v19)")
    v6 = {limpo(r[0]): (r[ih], r[ix]) for r in ct if r and limpo(r[1]) == "V6"}
    wb.close()
    if sorted(v6) != sorted(COD_V6):
        raise SystemExit(f"[PARADO] V6: a simulação traz {sorted(v6)}; esperado {list(COD_V6)}")
    return linhas, perguntas, v6


def depois(cab: list[str], linhas: list[list]) -> list[list]:
    """As linhas da simulação, com a troca do rótulo de versão no MOTIVO da V5."""
    im = cab.index("MOTIVO")
    saida = []
    for r in linhas:
        r = list(r) + [None] * (len(cab) - len(r))
        if r[0] in V5 and r[im]:
            if V5_TROCA[0] not in r[im]:
                raise SystemExit(f"[PARADO] {r[0]}: o MOTIVO da V5 não traz '{V5_TROCA[0]}'")
            r[im] = r[im].replace(*V5_TROCA)
        saida.append(r)
    return saida


def aplicar(wb, dados):
    sim, perguntas, v6 = dados
    ws = wb[ABA]
    cab = [limpo(c.value) for c in ws[1]]
    cab_sim = [limpo(v) for v in sim[0]]
    if cab_sim != cab + NOVAS:
        raise SystemExit(f"[PARADO] cabeçalho da simulação {cab_sim} não é o da base + {NOVAS}")
    if len(sim) != ws.max_row:
        raise SystemExit(f"[PARADO] {len(sim) - 1} linhas na simulação e {ws.max_row - 1} na base")
    col = {c: i for i, c in enumerate(cab_sim)}
    pode = {"ANO_INICIO", "ANO_FIM"}
    erros, feitas, conta = [], {}, collections.Counter()
    por_cod = collections.defaultdict(collections.Counter)
    regras = collections.defaultdict(set)
    for n, r in enumerate(depois(cab_sim, sim[1:]), start=2):
        cod = limpo(r[0])
        atual = [ws.cell(n, j + 1).value for j in range(len(cab))]
        if [limpo(atual[col[k]]) for k in IDENTIDADE] != [limpo(r[col[k]]) for k in IDENTIDADE]:
            erros.append(f"linha {n}: o veículo da base ({atual[:4]}) não é o da simulação ({r[:4]})")
            continue
        mudou = False
        for j, nome in enumerate(cab_sim):
            v_ant = atual[j] if j < len(cab) else None
            if r[j] == v_ant or (r[j] in (None, "") and v_ant in (None, "")):
                continue
            ok = (nome in pode and v_ant in (None, "")) or nome in NOVAS or (
                cod in V5 and nome in ("SITUACAO", "MOTIVO"))
            if not ok:
                erros.append(f"{cod} linha {n}: {nome} {v_ant!r} -> {r[j]!r} fora do que a simulação muda")
                continue
            if nome in ("ANO_INICIO", "ANO_FIM") and not (isinstance(r[j], int) and 1950 <= r[j] <= 2028):
                erros.append(f"{cod} linha {n}: {nome} {r[j]!r} não é ano de 4 dígitos")
            feitas[(n, j + 1)] = r[j]
            conta[nome] += 1
            por_cod[cod][nome] += 1
            mudou = True
        if mudou:
            por_cod[cod]["_veiculos"] += 1
            pc, pv = perguntas.get(n, ("", ""))
            if pc != cod:
                erros.append(f"linha {n}: a ANTES_E_DEPOIS traz {pc!r} e a VEICULOS_DEPOIS {cod!r}")
            if pv:
                regras[cod].add(pv)
    if dict(conta) != ESPERADO or len(por_cod) != CODIGOS:
        erros.append(f"células {dict(conta)} em {len(por_cod)} códigos; esperado {ESPERADO} em {CODIGOS}")
    if erros:
        print("[PARADO] nada foi gravado:")
        for e in erros[:30]:
            print("   ", e)
        sys.exit(2)

    # as 2 colunas novas no fim: cabeçalho com a formatação do cabeçalho de antes, largura e filtro
    ult_col = len(cab)
    for k, nome in enumerate(NOVAS, start=ult_col + 1):
        h = ws.cell(1, k)
        h.value = nome
        h._style = copy(ws.cell(1, ult_col)._style)
        ws.column_dimensions[openpyxl.utils.get_column_letter(k)].width = LARGURA[nome]
    if ws.auto_filter.ref:
        ws.auto_filter.ref = f"A1:{openpyxl.utils.get_column_letter(len(cab_sim))}{ws.max_row}"
    for (n, c), v in feitas.items():
        ws.cell(n, c).value = v

    linhas = [["VEICULO_ANO_CILINDRADA", ABA, cod, None, obs_log(k, regras[cod])]
              for cod, k in sorted(por_cod.items())]
    feitas_aplic, linhas_aplic = corrigir_aplicacao(wb, v6)
    ult = acrescentar_log(wb, linhas + linhas_aplic)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: VEICULOS {dict(conta)} em {len(por_cod)} códigos; PRODUTOS APLICACAO {len(feitas_aplic)}; "
          f"LOG_CORRECOES +{len(linhas) + len(linhas_aplic)}; LEIA-ME +{leia_n}")
    return {ABA: set(feitas), "PRODUTOS": set(feitas_aplic)}, ult, leia_n, (feitas, feitas_aplic, cab_sim)


def corrigir_aplicacao(wb, v6: dict) -> tuple[dict, list[list]]:
    """As 5 células da APLICACAO: o "1960>" -> "1996>" dos 3 códigos (R-20261120-194600-alexandre) e a V6a dos 2 TER.

    Para (sem gravar) se o texto não for o esperado."""
    ws = wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    ic, ia = cab.index("CODIGO_BAP") + 1, cab.index("APLICACAO") + 1
    achados = {limpo(ws.cell(n, ic).value): n for n in range(2, ws.max_row + 1)
               if limpo(ws.cell(n, ic).value) in COD_1960 + COD_V6}
    if sorted(achados) != sorted(COD_1960 + COD_V6):
        raise SystemExit(f"[PARADO] APLICACAO: achados {sorted(achados)} na PRODUTOS; esperado {COD_1960 + COD_V6}")
    feitas, linhas = {}, []
    for cod in COD_V6:
        n, (hoje, proposta) = achados[cod], v6[cod]
        antes = ws.cell(n, ia).value
        if antes != hoje or not proposta or proposta == hoje:
            raise SystemExit(f"[PARADO] {cod}: a APLICACAO de hoje não é a 'APLICACAO hoje (v19)' da simulação")
        feitas[(n, ia)] = proposta
        linhas.append(["CORRECAO_APLICACAO", "PRODUTOS", cod, None,
                       f"APLICACAO: '{antes}' -> '{proposta}' (V6a: o '06' é 2006; o New Civic é de 2006 a 2011, como "
                       f"o par TAX10288). Antes e depois em dados/simulacoes/T-0017-v20/ (aba CASOS_DO_TESTES); "
                       f"aprovado em {APROVACAO} (V6a). {TAREFA} (v20), {DATA}"])
    for cod in COD_1960:
        n = achados[cod]
        antes = str(ws.cell(n, ia).value or "")
        if antes.count(TROCA_1960[0]) != 1 or antes.count("1960") != 1 or not antes.rstrip().endswith(TROCA_1960[0]):
            raise SystemExit(f"[PARADO] {cod}: a APLICACAO não tem um só '{TROCA_1960[0]}' no fim; nada foi gravado")
        depois_ = antes.replace(*TROCA_1960)
        feitas[(n, ia)] = depois_
        linhas.append(["CORRECAO_APLICACAO", "PRODUTOS", cod, None,
                       f"APLICACAO: 'FORA DA FROTA BRASILEIRA - {TROCA_1960[0]}' -> 'FORA DA FROTA BRASILEIRA - "
                       f"{TROCA_1960[1]}' (o 1960 era 1996 digitado errado, como a P3 da v19; o resto do texto fica). "
                       f"Decisão em {APROVACAO_1960}. {TAREFA} (v20), {DATA}"])
    for (n, c), v in feitas.items():
        ws.cell(n, c).value = v
    return feitas, linhas


def obs_log(k: collections.Counter, regras: set[str]) -> str:
    partes = []
    if k["ANO_INICIO"] or k["ANO_FIM"]:
        partes.append(f"ANO_INICIO/ANO_FIM de vazio para o ano do trecho da APLICACAO da v19 em "
                      f"{max(k['ANO_INICIO'], k['ANO_FIM'])} linha(s)")
    if k["CILINDRADA"]:
        partes.append(f"CILINDRADA (coluna nova) em {k['CILINDRADA']}")
    if k["ANO_DUVIDA"]:
        partes.append(f"ANO_DUVIDA (coluna nova: o ano aparece, mas não filtra) em {k['ANO_DUVIDA']}")
    if k["SITUACAO"]:
        partes.append(f"SITUACAO separado -> duvidoso e MOTIVO preenchido em {k['SITUACAO']} ('ML' era o '500 ml'; "
                      "produto universal)")
    qual = (f"pergunta(s) {', '.join(sorted(regras, key=lambda v: int(v[1:])))} como recomendado" if regras
            else "regra já decidida")
    return (f"VEICULOS ({k['_veiculos']} veículo(s)): " + "; ".join(partes) + f" ({qual}). Antes e depois em "
            f"dados/simulacoes/T-0017-v20/ (aba ANTES_E_DEPOIS); aprovado em {APROVACAO} (V1 a V9 como recomendado). "
            f"{TAREFA} (v20), {DATA}")


def conferir_valores(p: Path, extra) -> list[str]:
    """Na base gravada, a VEICULOS inteira é a da simulação (com a troca da V5), linha a linha, e as 5 da APLICACAO."""
    feitas, feitas_aplic, cab_sim = extra
    wb = openpyxl.load_workbook(p)
    dif = [f"PRODUTOS {wb['PRODUTOS'].cell(n, c).coordinate}: valor diferente do da gravação"
           for (n, c), v in feitas_aplic.items() if wb["PRODUTOS"].cell(n, c).value != v]
    ws = wb[ABA]
    sim = depois(cab_sim, ler()[0][1:])
    base = list(ws.iter_rows(min_row=2, values_only=True))
    if len(base) != len(sim):
        dif.append(f"{ABA}: {len(base)} linhas na base e {len(sim)} na simulação")
    dif += [f"{ABA} linha {n}: diferente da simulação" for n, (a, b) in enumerate(zip(base, sim), start=2)
            if [None if v == "" else v for v in a] != [None if v == "" else v for v in b]]
    return dif[:30]


if __name__ == "__main__":
    rodar(19, 20, ler, aplicar, conferir_valores, {ABA: NOVAS})
