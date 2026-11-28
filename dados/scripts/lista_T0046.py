"""T-0046 · Lista de trabalho da nova pesquisa de anos (só lê a base; não grava nada nela).

Entram as linhas da aba VEICULOS da v31 que ainda faltam (o que a T-0040 não fechou), de seis origens:
  4 códigos           = Taos do INT16501, Ranger do INT16529 (2019–2016), FCB6266 (Van 310 D e Silverado Conquest,
                        1997+ no texto) e INT16639/INT16652 (os veículos do texto sem linha na VEICULOS e o TL sem ano)
  v30 conflito novo   = os 86 da aba DIVERGENCIAS da dados/T-0040/v30/antes_depois_v30.xlsx (o ano atual fica fora
                        da faixa pesquisada)
  v30 sem resolução   = os 6 da mesma aba (a faixa pesquisada não concorda com o ano atual nem com a Fraga)
  fora da Fraga       = as linhas sem ano completo dos 483 códigos da aba NAO_ACHADOS da simulacao/antes_depois.xlsx
  não resolvida       = as 2.941 linhas com decisao nao_resolvido na pesquisa da T-0040 (anos_pesquisa_T0040.csv do
                        commit fixo da base_v30.py, conferido pelo sha256)
  DE_PARA             = as linhas sem ano completo dos 1.187 pares sem_casamento da aba DE_PARA (linhas da Fraga)
Uma linha por linha da VEICULOS, sem duplicata: a origem é a primeira da lista acima em que a linha cai. Os ids da
T-0040 são da v30 (= v29) e passam para a v31 pelo alinhamento das duas abas (a v31 tirou 2 linhas e pôs 6 no fim);
cada id passado é conferido (CODIGO_BAP, FABRICANTE e MODELO iguais).

Só campos públicos, como na lista da T-0040: descrição e referências do site/data/produtos.json (já passaram pela FICHA
e pela TRAVA); montadora, modelo, versão e cilindrada da VEICULOS. A APLICACAO só é lida para os veículos do texto sem
linha (INT16639, INT16652 e FCB6266), e o trecho passa pelo INTERNO. A planilha passa pelo sem_interno e o CSV pelo
INTERNO; o sha256 da base é conferido antes e depois.

Saída: dados/T-0046/lista_trabalho_T0046.xlsx (LISTA, RESUMO, PARA_A_SESSAO_LOCAL) e lista_trabalho_T0046.csv (UTF-8
com BOM, ";").

Uso: python3 dados/scripts/lista_T0046.py
"""
from __future__ import annotations

import csv
import difflib
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import BASE, INTERNO, RAIZ, aba, sem_interno, sha, versao  # noqa: E402
from base_v30 import ler_pesquisa  # noqa: E402
from simular_T0040 import AD as SIM_T0040, ORIGEM as ORIGEM_FRAGA, tipo_ano  # noqa: E402

V_ANTES, V_AGORA = 30, 31
AD_V30 = RAIZ / "dados" / "T-0040" / "v30" / "antes_depois_v30.xlsx"
JSON = RAIZ / "site" / "data" / "produtos.json"
SAIDA = RAIZ / "dados" / "T-0046"
XLSX = SAIDA / "lista_trabalho_T0046.xlsx"
CSV = SAIDA / "lista_trabalho_T0046.csv"
COLS = ["id_linha", "codigo_bap", "descricao", "montadora", "modelo", "versao", "motor", "ano_atual", "o_que_falta",
        "origem", "referencias_cruzadas"]
COLS_VOLTA = ["id_linha", "codigo_bap", "montadora", "modelo", "motor", "ano_inicial", "ano_final", "decisao",
              "fonte_url", "observacao", "tipo_fonte", "em_conflito"]

O4, OCN, OSR, OFF, ONR, ODP = ("4 códigos", "v30 conflito novo", "v30 sem resolução", "fora da Fraga",
                               "não resolvida", "DE_PARA")
ORDEM = [O4, OCN, OSR, OFF, ONR, ODP]
ESPERADO = {OCN: 86, OSR: 6, ONR: 2941, OFF: 483, ODP: 1187}     # números da tarefa (v30)
FALTA = {"sem_ano": "os dois", "so_inicial": "fim", "so_final": "início"}

# 4 códigos: as linhas da VEICULOS (código, fabricante, modelo) e os veículos do texto sem linha
LINHAS_4 = [("INT16501", "VOLKSWAGEN", "Taos"), ("INT16529", "FORD", "Ranger"), ("INT16652", "VOLKSWAGEN", "TL")]
# (código, montadora, modelo, versão, motor, ano_atual, trecho da APLICACAO que tem de estar no texto)
TEXTO_4 = [
    ("FCB6266", "MERCEDES-BENZ", "Sprinter", "Van 310 D", "2.5", "1997+", "Sprinter Van 310 D 2.5 L 8V SOHC L4 1997>"),
    ("FCB6266", "CHEVROLET", "Silverado", "Conquest", "4.2", "1997+", "Silverado Conquest 4.2 L 18V SOHC L6 1997>"),
    ("INT16639", "VOLKSWAGEN", "Gurgel BR800", "", "", "", "Gurgel BR800"),
    ("INT16639", "VOLKSWAGEN", "Karmann Ghia", "", "", "", "Karmann Ghia"),
    ("INT16639", "VOLKSWAGEN", "Puma", "", "", "", "Puma"),
    ("INT16639", "VOLKSWAGEN", "SP2", "", "", "", "SP2"),
    ("INT16639", "VOLKSWAGEN", "TC", "", "", "", "TC"),
    ("INT16652", "VOLKSWAGEN", "Puma", "", "", "", "Puma"),
    ("INT16652", "VOLKSWAGEN", "SP2", "", "", "", "SP2"),
    ("INT16652", "VOLKSWAGEN", "TC", "", "", "", "TC"),
]


def txt(v) -> str:
    return "" if v is None else re.sub(r"\s+", " ", str(v)).strip()


def parar(msg: str):
    raise SystemExit(f"[PARADO] {msg}")


def veiculos(n: int) -> list[tuple]:
    ws = load_workbook(versao(n), read_only=True)["VEICULOS"]
    return list(ws.iter_rows(values_only=True))[1:]


def ano_atual(ini, fim) -> str:
    if isinstance(ini, int) and isinstance(fim, int):
        return f"{ini}–{fim}"
    return "" if ini is None and fim is None else f"{ini}+" if fim is None else f"até {fim}"


def passar(v30: list[tuple], v31: list[tuple]) -> dict[int, int | None]:
    """{id_linha da v30: id_linha da v31 (None = a linha saiu na v31)}, pelo alinhamento (código, fabricante, modelo)."""
    k = lambda r: (r[0], r[1], r[2])  # noqa: E731
    sm = difflib.SequenceMatcher(None, [k(r) for r in v30], [k(r) for r in v31], autojunk=False)
    mapa = {}
    for op, a1, a2, b1, b2 in sm.get_opcodes():
        if op == "equal":
            mapa.update({a1 + i + 1: b1 + i + 1 for i in range(a2 - a1)})
        elif op == "delete":
            mapa.update({i + 1: None for i in range(a1, a2)})
        elif op != "insert":
            parar(f"a VEICULOS da v31 trocou linhas da v30 ({op} {a1}–{a2}); refaça o alinhamento")
    if len(mapa) != len(v30):
        parar("o alinhamento v30 -> v31 não cobre todas as linhas da v30")
    return mapa


def main():
    antes = sha(BASE)
    if antes != sha(versao(V_AGORA)):
        parar(f"a base principal não é a v{V_AGORA}")
    v30, v31 = veiculos(V_ANTES), veiculos(V_AGORA)
    mapa = passar(v30, v31)
    wb = load_workbook(BASE, read_only=True)
    prods = {r[0]: r for r in list(wb["PRODUTOS"].iter_rows(values_only=True))[1:] if r[0]}
    cab_p = next(wb["PRODUTOS"].iter_rows(values_only=True))
    P = {c: i for i, c in enumerate(cab_p)}
    site = {p["c"]: p for p in json.loads(JSON.read_text(encoding="utf-8"))["produtos"]}

    # ---- os grupos, com os ids da v30
    pesq = ler_pesquisa("anos_pesquisa_T0040.csv", None)
    grupos: dict[str, set[int]] = {}
    grupos[ONR] = {int(x["id_linha"]) for x in pesq if x["decisao"] == "nao_resolvido"}
    for x in pesq:
        if v30[int(x["id_linha"]) - 1][0] != x["codigo_bap"]:
            parar(f"pesquisa T-0040: id_linha {x['id_linha']} não é o {x['codigo_bap']} na v30")
    adv = load_workbook(AD_V30, read_only=True)
    div = list(adv["DIVERGENCIAS"].iter_rows(values_only=True))[1:]
    grupos[OCN] = {r[0] for r in div if str(r[13]).startswith("conflito novo")}
    grupos[OSR] = {r[0] for r in div if str(r[13]).startswith("conflito sem resolução")}
    for r in div:
        if (v30[r[0] - 1][0], v30[r[0] - 1][2]) != (r[2], r[4]):
            parar(f"DIVERGENCIAS: id_linha {r[0]} não é o {r[2]} {r[4]} na v30")
    sim = load_workbook(SIM_T0040, read_only=True)
    fora = {r[0] for r in list(sim["NAO_ACHADOS"].iter_rows(values_only=True))[1:] if r[0]}
    pares = {(r[2], r[3]) for r in list(sim["DE_PARA"].iter_rows(values_only=True))[1:] if r[5] == "sem_casamento"}
    grupos[OFF] = {i for i, r in enumerate(v30, 1) if r[0] in fora}
    grupos[ODP] = {i for i, r in enumerate(v30, 1) if r[6] == ORIGEM_FRAGA and (r[1], r[2]) in pares}

    # ---- passa para a v31 e fica só o que falta (ano incompleto; os 92 e a Ranger como conflito)
    def falta31(j: int, conflito: bool) -> bool:
        return conflito or tipo_ano(v31[j - 1][4], v31[j - 1][5]) != "completa"

    por_id: dict[int, list[str]] = defaultdict(list)
    conta = {}
    for g in (OCN, OSR, OFF, ONR, ODP):
        ids = grupos[g]
        saiu = sorted(i for i in ids if mapa[i] is None)
        vivos = [mapa[i] for i in ids if mapa[i] is not None]
        for i in ids:
            j = mapa[i]
            if j and (v30[i - 1][0], v30[i - 1][1], v30[i - 1][2]) != (v31[j - 1][0], v31[j - 1][1], v31[j - 1][2]):
                parar(f"id {i} da v30 -> {j} da v31: a linha não é a mesma")
        conf = g in (OCN, OSR)
        fica = [j for j in vivos if falta31(j, conf)]
        # resolvida = tinha ano incompleto (ou conflito) na v30 e tem início e fim na v31
        resolvidas = sorted(mapa[i] for i in ids if mapa[i] is not None and not falta31(mapa[i], conf)
                            and (conf or tipo_ano(v30[i - 1][4], v30[i - 1][5]) != "completa"))
        completas_v30 = sum(1 for i in ids if tipo_ano(v30[i - 1][4], v30[i - 1][5]) == "completa")
        conta[g] = {"v30": len(ids), "saiu": saiu, "resolvidas": resolvidas, "fica": len(fica),
                    "cod_fica": len({v31[j - 1][0] for j in fica}),
                    "completas_v30": completas_v30}
        for j in fica:
            por_id[j].append(g)
    conta[OFF]["codigos"] = len(fora)
    conta[OFF]["sem_linha"] = sorted(c for c in fora if c not in {r[0] for r in v31})
    conta[ODP]["pares"] = len(pares)
    conta[ODP]["pares_sem_linha"] = sorted(p for p in pares if not any(
        r[6] == ORIGEM_FRAGA and (r[1], r[2]) == p for r in v31))

    # 4 códigos: as linhas da VEICULOS
    ids4 = []
    for c, f, m in LINHAS_4:
        js = [j for j, r in enumerate(v31, 1) if (r[0], r[1], r[2]) == (c, f, m)]
        if len(js) != 1:
            parar(f"4 códigos: {c} {f} {m} tem {len(js)} linhas na v31 (esperado 1)")
        ids4.append(js[0])
        por_id[js[0]].insert(0, O4)
    ranger = ids4[1]
    r = v31[ranger - 1]
    if not (isinstance(r[4], int) and isinstance(r[5], int) and r[4] > r[5]):
        parar("a Ranger do INT16529 não está mais com a faixa invertida")

    # ---- a LISTA
    def desc_refs(cod: str) -> tuple[str, str]:
        p = site.get(cod)
        desc = p["d"] if p else txt(prods[cod][P["DESCRICAO"]])
        refs = ", ".join(f"{x['m']}: {x['c']}" if x.get("m") else x["c"] for x in (p or {}).get("r", []))
        return desc, refs

    lista = []
    for j in sorted(por_id):
        r = v31[j - 1]
        origem = min(por_id[j], key=ORDEM.index)
        t = tipo_ano(r[4], r[5])
        conflito = origem in (OCN, OSR) or j == ranger or OCN in por_id[j] or OSR in por_id[j]
        desc, refs = desc_refs(r[0])
        lista.append([j, r[0], desc, txt(r[1]), txt(r[2]), txt(r[3]), txt(r[9]), ano_atual(r[4], r[5]),
                      "conflito" if conflito else FALTA[t], origem, refs])
    for c, f, m, ver, mot, ano, trecho in TEXTO_4:
        apl = txt(prods[c][P["APLICACAO"]])
        if trecho not in apl or INTERNO.search(trecho):
            parar(f"4 códigos: '{trecho}' não está na APLICACAO do {c}")
        if any((r[0], r[1], r[2], txt(r[3])) == (c, f, m, ver) for r in v31):
            parar(f"4 códigos: {c} {f} {m} {ver} já tem linha na VEICULOS")
        desc, refs = desc_refs(c)
        lista.append(["", c, desc, f, m, ver, mot, ano, "os dois" if not ano else "fim", O4, refs])

    for lin in lista:
        if any(INTERNO.search(str(x)) for x in lin):
            parar(f"dado interno na linha {lin[0]} ({lin[1]})")
    ids = [lin[0] for lin in lista if lin[0] != ""]
    if len(ids) != len(set(ids)):
        parar("id_linha repetido na LISTA")

    # ---- o que fica fora (sem ano completo na v31 e em nenhuma origem)
    pesq_ids = {mapa[int(x["id_linha"])] for x in pesq}
    manter = {mapa[int(x["id_linha"])] for x in pesq if x["decisao"] == "manter_atual"}
    universal = {c for c, p in prods.items() if txt(p[P["LINHA"]]) == "UNIVERSAL"}
    novas = set(range(1, len(v31) + 1)) - set(mapa.values())        # as linhas que a v31 pôs
    fora_lista = []
    for j, r in enumerate(v31, 1):
        if j in por_id or tipo_ano(r[4], r[5]) == "completa":
            continue
        motivo = ("UNIVERSAL: fica sem ano (decisão 5 de 26/11)" if r[0] in universal else
                  "manter_atual na pesquisa da T-0040 (a fonte confirmou o ano atual)" if j in manter else
                  "linha nova da v31 (T-0042), com o ano do texto" if j in novas else
                  "não estava na lista da T-0040" if j not in pesq_ids else "outro")
        fora_lista.append([j, r[0], txt(r[1]), txt(r[2]), txt(r[3]), ano_atual(r[4], r[5]), motivo])

    resumo = montar_resumo(lista, conta, fora_lista, prods, P, v30, v31)
    gravar(lista, resumo)
    if sha(BASE) != antes:
        parar("a base mudou")
    print(f"LISTA: {len(lista)} linhas ({len(ids)} da VEICULOS e {len(lista) - len(ids)} do texto sem linha); "
          f"códigos {len({l[1] for l in lista})}")
    for o, n in Counter(l[9] for l in lista).most_common():
        print(f"  origem {o}: {n}")
    for g in (OCN, OSR, ONR, OFF, ODP):
        c = conta[g]
        print(f"  grupo {g}: v30 {c['v30']} | saiu na v31 {len(c['saiu'])} | resolvidas {len(c['resolvidas'])} | "
              f"a pesquisar {c['fica']}")
    print(f"fora da lista (sem ano completo e sem origem): {len(fora_lista)}")
    print("sha256 base:", antes, "(sem mudança)")


def montar_resumo(lista, conta, fora_lista, prods, P, v30, v31) -> list[list]:
    R: list[list] = []
    R.append(["T-0046 · lista de trabalho da nova pesquisa de anos, sobre a base v31 (só leitura)"])
    R.append([f"{len(lista)} linhas na LISTA; {len({l[1] for l in lista})} códigos. Uma linha por linha da VEICULOS, "
              "sem duplicata; a origem é a primeira em que a linha cai (ordem da tabela 1)."])
    R.append([])
    R.append(["1. Totais por origem", "número da tarefa (v30)", "recontado na v30", "saíram na v31",
              "resolvidas entre a v30 e a v31", "a pesquisar na v31", "com esta origem na LISTA", "observação"])
    na_lista = Counter(l[9] for l in lista)
    obs = {
        OCN: "conflito: o ano atual fica fora da faixa pesquisada na T-0040 (aba DIVERGENCIAS da v30); o Taos do "
             "INT16501 é um deles e está na origem 4 códigos",
        OSR: "conflito: a faixa pesquisada não concorda com o ano atual nem com a Fraga (aba DIVERGENCIAS)",
        ONR: "decisao nao_resolvido na pesquisa da T-0040; o TL do INT16652 está na origem 4 códigos e as linhas dos "
             "códigos fora da Fraga, na origem fora da Fraga",
        OFF: f"{conta[OFF]['codigos']} códigos; o número da tarefa é de códigos e a conta da coluna C é de linhas da "
             f"VEICULOS. {len(conta[OFF]['sem_linha'])} códigos não têm linha na VEICULOS (não entram: falta a "
             f"aplicação, não o ano); {conta[OFF]['completas_v30']} linhas já tinham início e fim na v30; as "
             f"{conta[OFF]['fica']} a pesquisar são de {conta[OFF]['cod_fica']} códigos",
        ODP: f"{conta[ODP]['pares']} pares sem_casamento; o número da tarefa é de pares e a conta da coluna C é de "
             f"linhas da Fraga na VEICULOS. Todas têm início e fim (vêm da Fraga com o ano): nenhuma entra na pesquisa "
             f"de anos. {len(conta[ODP]['pares_sem_linha'])} pares não têm mais linha",
    }
    for g in (OCN, OSR, ONR, OFF, ODP):
        c = conta[g]
        R.append([g, ESPERADO[g], c["v30"], len(c["saiu"]), len(c["resolvidas"]), c["fica"], na_lista.get(g, 0),
                  obs[g]])
    n4 = [l for l in lista if l[9] == O4]
    R.append([O4, "4 códigos", "", "", "", len(n4), len(n4),
              "Taos do INT16501 (conflito, '2021+'); Ranger do INT16529 (conflito, 2019–2016); TL do INT16652 (sem "
              "ano); FCB6266 Van 310 D e Silverado Conquest (1997+ no texto, sem linha própria); INT16639 Gurgel "
              "BR800, Karmann Ghia, Puma, SP2 e TC e INT16652 Puma, SP2 e TC (no texto, sem linha e sem ano)"])
    R.append(["TOTAL", "", "", "", "", "", len(lista), "id_linha vazio = veículo do texto sem linha na VEICULOS"])
    R.append([])
    R.append(["2. Por o_que_falta", "linhas", "códigos"])
    for k in ("os dois", "início", "fim", "conflito"):
        ls = [l for l in lista if l[8] == k]
        R.append([k, len(ls), len({l[1] for l in ls})])
    R.append([])
    R.append(["3. Por família (PRODUTOS.FAMILIA)", "linhas", "códigos"] + ORDEM)
    fam = defaultdict(list)
    for l in lista:
        fam[txt(prods[l[1]][P["FAMILIA"]]) or "(sem família)"].append(l)
    for f in sorted(fam, key=lambda f: (-len(fam[f]), f)):
        ls = fam[f]
        oc = Counter(l[9] for l in ls)
        R.append([f, len(ls), len({l[1] for l in ls})] + [oc.get(o, 0) for o in ORDEM])
    R.append([])
    R.append(["4. Resolvido ou saído entre a v30 e a v31 (T-0042)", "id_linha v30", "id_linha v31", "código",
              "veículo", "ano na v31", "grupo"])
    for g in (OCN, OSR, ONR, OFF, ODP):
        for i in conta[g]["saiu"]:
            r = v30[i - 1]
            R.append(["saiu da VEICULOS na v31", i, "", r[0], f"{r[1]} {r[2]}", "", g])
        for j in conta[g]["resolvidas"]:
            r = v31[j - 1]
            R.append(["recebeu início e fim na v31", "", j, r[0], f"{r[1]} {txt(r[2])} {txt(r[3])}".strip(),
                      ano_atual(r[4], r[5]), g])
    R.append(["os 92 da v30 (DIVERGENCIAS)", "", "", "", "nenhum mudou na v31", "", ""])
    R.append([])
    R.append(["5. Sem ano completo na v31 e fora das origens da tarefa (não entram; decisão do po)", "id_linha v31",
              "código", "montadora", "modelo", "versão", "ano atual", "motivo"])
    for x in fora_lista:
        R.append([""] + x)
    R.append([])
    R.append(["6. Códigos fora da Fraga sem linha na VEICULOS (não entram: falta a aplicação)", "códigos"])
    sl = conta[OFF]["sem_linha"]
    for k in range(0, len(sl), 10):
        R.append(["", ", ".join(sl[k:k + 10])])
    return R


INSTRUCOES = [
    ("Para quem", "A sessão local da Fraga (computador do Alexandre). A nuvem não abre o catálogo da Fraga. A sessão "
                  "entrega um CSV e não grava no repositório (R-20261127-200014-alexandre, pergunta 29)."),
    ("Entrada", "lista_trabalho_T0046.csv (UTF-8 com BOM, separador ';'), as mesmas linhas da aba LISTA."),
    ("Ordem das fontes", "1) A Fraga: https://catalogobap.catalogofraga.com.br, pelo código BAP. 2) O que a Fraga não "
                         "achar: o código de referência cruzada (coluna referencias_cruzadas) na internet, nos "
                         "catálogos dos fabricantes (os da plataforma Fraga, a 3-RHO...) e nas lojas autorizadas pelo "
                         "Alexandre na T-0040. As linhas de origem 'fora da Fraga' já não foram achadas na Fraga: vá "
                         "direto à referência."),
    ("Ano só com fonte", "Anote a URL de cada ano achado (fonte_url). Sem fonte, as células de ano ficam vazias e a "
                         "decisao é nao_resolvido: a linha fica como está e é listada."),
    ("Nada duvidoso", "Nada é marcado como duvidoso nem com grau de confiança (T-0042, R-20261127-161035-alexandre, "
                      "item 3; regra de 20/11, R-20261120-213300). Ou tem fonte, ou fica vazio."),
    ("Ano solto", "Ano solto (ex.: '08/2022') vale como 'em diante' até ser confirmado (decisão 3 de 26/11)."),
    ("Em produção", "Veículo ainda em produção: ano final 2026, sem marca. Início e fim iguais ficam iguais (ex.: 2019 "
                    "a 2019) (decisão 4 de 26/11)."),
    ("Em revisão e só final", "As linhas com o veículo em revisão e as que têm só o ano final entram (decisões 1 e 2 de "
                              "26/11)."),
    ("Universais", "FLU15001 e FLU15002 ficam sem ano e não estão na lista (decisão 5 de 26/11)."),
    ("o_que_falta", "'os dois' = sem início e sem fim; 'fim' = só tem o início ('AAAA+'); 'início' = só tem o fim "
                    "('até AAAA'); 'conflito' = o ano atual (ano_atual) não concorda com o que a pesquisa da T-0040 "
                    "achou: traga a faixa inteira com fonte."),
    ("Conflitos", "Os 92 da v30 e a Ranger do INT16529 (2019–2016, faixa invertida). O que a T-0040 achou para cada um "
                  "está na aba DIVERGENCIAS de dados/T-0040/v30/antes_depois_v30.xlsx (faixa pesquisada, faixa da "
                  "Fraga e a URL). O Taos do INT16501 fica '2021' e a Ranger fica como está até a pesquisa."),
    ("id_linha vazio", "Veículo do texto da APLICACAO sem linha na VEICULOS (FCB6266 Van 310 D e Silverado Conquest; "
                       "INT16639 Gurgel BR800, Karmann Ghia, Puma, SP2 e TC; INT16652 Puma, SP2 e TC). Volte com o "
                       "id_linha vazio e com codigo_bap, montadora e modelo iguais aos da lista. Se a montadora certa "
                       "for outra (ex.: GURGEL, PUMA), diga na observacao, com a fonte."),
    ("Sem dado comercial", "Nada de valor de venda, quantidade disponível ou dado de quem vende no CSV de volta (nem em "
                           "trecho de loja na observacao)."),
    ("Depois", "O catalogo-dados faz a simulação (antes e depois, com a fonte de cada linha) para o Alexandre aprovar. "
               "Nada vai para a base antes do aprovado (regras 3 e 4)."),
]
VOLTA = [
    ("id_linha", "o da lista (vazio só nas linhas que vieram vazias)"),
    ("codigo_bap", "o da lista"),
    ("montadora", "a da lista"),
    ("modelo", "o da lista"),
    ("motor", "o da lista (coluna motor)"),
    ("ano_inicial", "AAAA achado na fonte, ou vazio"),
    ("ano_final", "AAAA achado na fonte, ou vazio (em produção = 2026)"),
    ("decisao", "nova_faixa (a fonte dá a faixa) | manter_atual (a fonte confirma o ano atual) | usar_fraga (vale a "
                "faixa da Fraga da linha) | nao_resolvido (sem fonte)"),
    ("fonte_url", "a URL de cada ano achado; mais de uma separadas por ' | '"),
    ("observacao", "o que a fonte diz (versão, motor, anos), sem dado comercial"),
    ("tipo_fonte", "como na T-0040: fabricante | fabricante_3rho | loja | google_loja; [SUPOSIÇÃO] 'fraga' quando o "
                   "ano vem do catalogobap.catalogofraga.com.br"),
    ("em_conflito", "sim nas linhas com o_que_falta = conflito; vazio nas outras"),
]


def gravar(lista: list[list], resumo: list[list]) -> None:
    SAIDA.mkdir(parents=True, exist_ok=True)
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    aba(wb, "LISTA", COLS, lista)
    ws = wb.create_sheet("RESUMO")
    for lin in resumo:
        ws.append(lin)
        if lin and len(lin) > 1 and isinstance(lin[0], str) and re.match(r"\d\. ", lin[0]):
            for c in ws[ws.max_row]:
                c.font = Font(bold=True)
    ws["A1"].font = Font(bold=True)
    ws.column_dimensions["A"].width = 58
    ws.column_dimensions["H"].width = 90
    ws = wb.create_sheet("PARA_A_SESSAO_LOCAL")
    ws.append(["T-0046 · instruções da pesquisa (as da T-0040) e o formato de volta"])
    ws["A1"].font = Font(bold=True)
    ws.append([])
    ws.append(["Regra", "Como"])
    for c in ws[3]:
        c.font = Font(bold=True)
    for lin in INSTRUCOES:
        ws.append(list(lin))
    ws.append([])
    ws.append(["Formato de volta: um CSV, anos_pesquisa_T0046.csv, UTF-8, separador ';', uma linha por linha da "
               "LISTA, com estas colunas nesta ordem (as do anos_pesquisa_T0040.csv):"])
    ws.append(["coluna", "o que vai"])
    for c in ws[ws.max_row]:
        c.font = Font(bold=True)
    for lin in VOLTA:
        ws.append(list(lin))
    ws.append([])
    ws.append(["cabeçalho", ";".join(COLS_VOLTA)])
    ws.column_dimensions["A"].width = 24
    ws.column_dimensions["B"].width = 120
    for row in ws.iter_rows(min_row=4):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    lw = wb["LISTA"]
    for col, w in zip("ABCDEFGHIJK", (9, 15, 40, 16, 22, 22, 12, 11, 11, 18, 80)):
        lw.column_dimensions[col].width = w
    sem_interno(wb)
    wb.save(XLSX)
    with CSV.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";", quoting=csv.QUOTE_MINIMAL, lineterminator="\n")
        w.writerow(COLS)
        w.writerows(lista)
    print(f"{XLSX.relative_to(RAIZ)} e {CSV.relative_to(RAIZ)} gravados")


if __name__ == "__main__":
    main()
