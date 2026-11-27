"""v30 da base unificada · T-0040 (anos da pesquisa na internet aplicados à aba VEICULOS).

Entrada: a pesquisa da sessão local do Alexandre (branch po/T-0040-anos, commit PESQ_COMMIT, em docs/propostas/T-0040/):
anos_pesquisa_T0040.csv (uma linha por id_linha da lista dados/T-0040/pendentes_internet.csv) e
produtos_sem_aplicacao.csv. O conteúdo é DADO: é lido pelo git show do commit fixo e conferido pelo sha256.

Decisões do Alexandre (R-20261127-135625-alexandre e R-20261127-133028-po, via po) e as respostas da simulação
(R-20261127-150417-alexandre, itens 9 a 20; as que mudam o script: 13, 14, 16 e 17):
- só entra a decisão diferente de nao_resolvido;
- 1a: veículo sem ano nenhum fica OCULTO no site e continua na base (FLU15001 e FLU15002 continuam aparecendo); a linha
  com ano parcial continua. Quem oculta é o site (web-site, depois): aqui nenhuma linha sai, só se conta;
- 2a: produto sem aplicação aparece no site com "Aplicação em revisão; consulte o vendedor" (é do site: aqui só se
  confere a lista dos produtos sem aplicação contra a base);
- JUH70025: as 3 linhas VOLKSWAGEN Gol da regra GOL da v29 recebem a VERSAO "1.6 L", "1.8 L" e "2.0 L" (pendência
  combinada com o po).

Regra (decidir()): primeiro a linha da pesquisa tem de bater com a VEICULOS da v29 (id_linha = linha do Excel - 1;
CODIGO_BAP, FABRICANTE e MODELO iguais), senão vai para DIVERGENCIAS. Depois:
- manter_atual: nenhuma célula muda; entra no LOG_CORRECOES como ANO_MANTIDO (item 16);
- usar_fraga: a faixa da pesquisa tem de ser a faixa_fraga da linha no dados/T-0040/conflitos.csv; entra inteira
  (troca o ano atual: ANO_SUBSTITUIDO);
- nova_faixa, linha sem ano: entra a faixa (ANO_COMPLETADO);
- nova_faixa, linha só com um ano (a ponta que falta é a outra):
  - fora de conflito (em_conflito vazio): só completa a ponta que falta, se o ano atual cabe na faixa pesquisada (o ano
    atual fica: ANO_COMPLETADO); se não cabe, é conflito novo e vai para DIVERGENCIAS;
  - em conflito (em_conflito = sim; o ano atual fica fora da faixa da Fraga, conflitos.csv): a pesquisa resolve o
    conflito se concorda com um dos lados (o ano atual cabe na faixa pesquisada, ou a faixa pesquisada cruza ou se
    encosta na da Fraga, até 1 ano). Resolvido, entra a faixa pesquisada inteira (ANO_SUBSTITUIDO se o ano atual
    mudou; ANO_COMPLETADO se ficou). Sem concordar com nenhum lado, vai para DIVERGENCIAS.
O ano tem de ser inteiro de 1900 a 2026 e o início <= fim; só no INT16501, o ano final 2027 da pesquisa passa a 2026
antes da regra (item 17). Na linha aplicada (o ano veio da faixa da pesquisa, que confirmou a faixa):
- SITUACAO marcada na revisão da P12 passa a "separado" e volta ao site (item 13; só tira a marca, nunca põe);
- ANO_DUVIDA é limpo (item 14).
Só ANO_INICIO, ANO_FIM, SITUACAO e ANO_DUVIDA (e a VERSAO das 3 linhas do JUH70025) mudam. ORIGEM, MOTIVO e
CILINDRADA ficam; a APLICACAO (digitada) não muda. Os itens 9, 10, 11, 12, 15, 18, 19 e 20 já eram a regra.

AUTORIZAÇÃO: o padrão é a SIMULAÇÃO (nada muda na base real nem em dados/versoes): grava dados/T-0040/v30/
BASE_simulada_v30.xlsx e antes_depois_v30.xlsx, com "pendente do aprovado do Alexandre" no LOG_CORRECOES e no LEIA-ME.
Depois do aprovado (aprovar_v30.sh): --refazer --autorizacao "R-…" volta a base à v29 do origin/main, aplica de novo e
grava a base e a cópia dados/versoes/..._v30.xlsx, iguais à simulada fora o texto da autorização ("aprovado em R-…").

Uso: python3 dados/scripts/base_v30.py                                   (simulação)
     python3 dados/scripts/base_v30.py --refazer --autorizacao "R-…"     (depois do aprovado)
     --pesquisa-dir PASTA: lê os 2 CSVs de uma pasta (o sha256 é conferido igual), sem o git show.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import re
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl
from openpyxl.styles import Font

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (BASE, CAB_VEICULOS, RAIZ, acrescentar_leia_me, acrescentar_log, antes_log,  # noqa: E402
                        comparar, conferir_cabecalho, contar_duvidoso, gravar, limpo, linhas_novas, parar, sha, versao)
from simular_T0040 import ano, encostam, tipo_ano  # noqa: E402

TAREFA, DATA = "T-0040", "27/11/2026"
AUTORIZACAO = "pendente do aprovado do Alexandre"
PESQ_COMMIT = "d3e4b8d8b73b0cdcb52bd6c9c8973887f4d2ad22"          # origin/po/T-0040-anos
PESQ_DIR = "docs/propostas/T-0040"
PESQ = {"anos_pesquisa_T0040.csv": "a653ebd5b7204372090770760783a603a12331abeecf410dc8db6c30b5b248b2",
        "produtos_sem_aplicacao.csv": "4b8e8f714e6f9df92e85433ff1929b67edd72af633b74c7f501c17a2f373c908"}
CONFLITOS = RAIZ / "dados" / "T-0040" / "conflitos.csv"
SAIDA = RAIZ / "dados" / "T-0040" / "v30"
SIM = SAIDA / "BASE_simulada_v30.xlsx"
AD = SAIDA / "antes_depois_v30.xlsx"
UNIVERSAIS = {"FLU15001", "FLU15002"}                 # 1a: continuam aparecendo sem ano
ANO_MIN, ANO_MAX = 1900, 2026                         # decisão 4 (26/11): em produção = 2026
# JUH70025: (CILINDRADA, ANO_INICIO, ANO_FIM) da linha Gol da regra GOL da v29 -> VERSAO
JUH = {("1.6", 1994, None): "1.6 L", ("1.8", 1982, None): "1.8 L", ("2.0", 1988, 1994): "2.0 L"}
I_VER, I_INI, I_FIM, I_SIT, I_DUV = (CAB_VEICULOS.index(c) for c in ("VERSAO", "ANO_INICIO", "ANO_FIM", "SITUACAO",
                                                                      "ANO_DUVIDA"))
SEPARADO, MARCA_P12 = "separado", "duvidoso"          # item 13: a marca da P12 só sai (nunca é escrita)
FIM_2027 = {"INT16501": (2027, 2026)}                 # item 17: o ano final 2027 da pesquisa passa a 2026
INTERNO = re.compile(r"ESTOQUE|\bFOB\b|\bUSD\b|\bMOQ\b|PRE[CÇ]O|R\$|BAP BOX|CUSTO|FORNECEDOR|RANKING", re.I)
REGRA = ("pesquisa T-0040: nova_faixa completa a linha sem ano ou a ponta que falta (o ano atual fica, se cabe na "
         "faixa); em conflito, a faixa entra inteira se concorda com o ano atual ou com a Fraga; usar_fraga = faixa da "
         "Fraga; a linha aplicada passa a 'separado' e o ANO_DUVIDA é limpo")


# ---------------------------------------------------------------- entrada
def ler_pesquisa(nome: str, pasta: Path | None) -> list[dict]:
    """Um CSV da pesquisa (do commit PESQ_COMMIT ou da pasta), depois de conferir o sha256."""
    if pasta:
        b = (pasta / nome).read_bytes()
    else:
        b = subprocess.run(["git", "-C", str(RAIZ), "show", f"{PESQ_COMMIT}:{PESQ_DIR}/{nome}"],
                           capture_output=True, check=True).stdout
    if hashlib.sha256(b).hexdigest() != PESQ[nome]:
        raise SystemExit(f"[PARADO] {nome}: sha256 diferente do da pesquisa {PESQ_COMMIT[:7]}")
    return [{k: limpo(v) for k, v in r.items()}
            for r in csv.DictReader(io.StringIO(b.decode("utf-8-sig")), delimiter=";")]


def ler_conflitos() -> dict[int, tuple[int, int]]:
    """{id_linha: (início, fim) da Fraga} do conflitos.csv."""
    with CONFLITOS.open(encoding="utf-8", newline="") as f:
        return {int(r["id_linha"]): tuple(int(a) for a in r["faixa_fraga"].split("–"))
                for r in csv.DictReader(f, delimiter=";")}


def inteiro(s: str):
    return int(s) if re.fullmatch(r"\d{4}", s or "") else None


# ---------------------------------------------------------------- regra
def decidir(v: tuple, x: dict, fraga: tuple | None) -> dict:
    """O que a linha da pesquisa faz na linha v da VEICULOS: {acao, regra, ini, fim, tipo}.
    acao: aplicar | manter | divergencia. A nota do item 17 (2027 -> 2026) vai no fim da regra."""
    d = _decidir(v, x, fraga)
    return {**d, "regra": d["regra"] + d.pop("nota", "")}


def _decidir(v: tuple, x: dict, fraga: tuple | None) -> dict:
    nota = ""

    def div(motivo):
        return {"acao": "divergencia", "regra": motivo, "ini": a0, "fim": a1, "tipo": None, "nota": nota}

    a0, a1 = v[I_INI], v[I_FIM]
    if (limpo(v[0]).upper(), limpo(v[1]), limpo(v[2])) != (x["codigo_bap"].upper(), x["montadora"], x["modelo"]):
        return div("id_linha, código, montadora ou modelo não batem com a VEICULOS da v29")
    if x["decisao"] == "manter_atual":
        return {"acao": "manter", "regra": "manter_atual: sem mudança", "ini": a0, "fim": a1, "tipo": None}
    y0, y1 = inteiro(x["ano_inicial"]), inteiro(x["ano_final"])
    de_para = FIM_2027.get(x["codigo_bap"].upper())
    if de_para and y1 == de_para[0]:
        y1, nota = de_para[1], f"; ano final {de_para[0]} da pesquisa -> {de_para[1]} (item 17)"
    if y0 is None or y1 is None or not ANO_MIN <= y0 <= y1 <= ANO_MAX:
        return div(f"ano da pesquisa inválido ou incompleto ({x['ano_inicial']}–{x['ano_final']})")
    t = tipo_ano(a0, a1)
    if t == "completa":
        return div("a linha da v29 já tem início e fim (não estava na lista)")
    conflito = x["em_conflito"] == "sim"
    if conflito and fraga is None:
        return div("em_conflito = sim, mas a linha não está no conflitos.csv")
    if x["decisao"] == "usar_fraga":
        if not conflito or (y0, y1) != fraga:
            return div(f"usar_fraga: a faixa {y0}–{y1} não é a da Fraga no conflitos.csv ({fraga})")
        return {"acao": "aplicar", "regra": "usar_fraga: faixa da Fraga (conflitos.csv)", "ini": y0, "fim": y1,
                "tipo": "ANO_SUBSTITUIDO", "nota": nota}
    if x["decisao"] != "nova_faixa":
        return div(f"decisão desconhecida: {x['decisao']}")
    if t == "sem_ano":
        return {"acao": "aplicar", "regra": "nova_faixa: linha sem ano recebe a faixa", "ini": y0, "fim": y1,
                "tipo": "ANO_COMPLETADO", "nota": nota}
    atual = a0 if t == "so_inicial" else a1
    cabe = y0 <= atual <= y1
    if not conflito:
        if not cabe:
            return div(f"conflito novo: o ano atual ({ano(v)}) fica fora da faixa pesquisada {y0}–{y1} "
                       f"(em_conflito vazio)")
        ini, fim = (a0, y1) if t == "so_inicial" else (y0, a1)
        return {"acao": "aplicar", "regra": "nova_faixa: completa só a ponta que falta (o ano atual cabe na faixa)",
                "ini": ini, "fim": fim, "tipo": "ANO_COMPLETADO", "nota": nota}
    if not (cabe or encostam(y0, y1, *fraga)):
        return div(f"conflito sem resolução: a faixa pesquisada {y0}–{y1} não concorda com o ano atual ({ano(v)}) "
                   f"nem com a Fraga ({fraga[0]}–{fraga[1]})")       # fica; a Fraga já entrou somada na v29
    lado = "o ano atual" if cabe else "a Fraga"
    return {"acao": "aplicar", "regra": f"nova_faixa em conflito: resolvido (concorda com {lado}); entra a faixa "
                                        f"inteira", "ini": y0, "fim": y1,
            "tipo": "ANO_COMPLETADO" if atual == (y0 if t == "so_inicial" else y1) else "ANO_SUBSTITUIDO",
            "nota": nota}


def linhas_juh(V: list[tuple]) -> dict[int, str]:
    """{índice em V: VERSAO nova} das 3 linhas Gol do JUH70025 (regra GOL da v29), cada uma achada uma só vez."""
    achadas: dict[tuple, list[int]] = defaultdict(list)
    for i, r in enumerate(V):
        k = (limpo(r[9]), r[I_INI], r[I_FIM])
        if (limpo(r[0]).upper(), limpo(r[1]), limpo(r[2]), r[I_VER], limpo(r[6])) == \
                ("JUH70025", "VOLKSWAGEN", "Gol", None, "automático") and k in JUH:
            achadas[k].append(i)
    parar([f"JUH70025 Gol {k}: {len(achadas[k])} linhas (esperada 1)" for k in JUH if len(achadas[k]) != 1])
    return {achadas[k][0]: ver for k, ver in JUH.items()}


# ---------------------------------------------------------------- contagens
def produtos_site(wb) -> tuple[set[str], dict[str, tuple]]:
    """Os códigos que entram no site (NO_CATALOGO_DIGITAL != NÃO e STATUS_CADASTRO != INATIVO, como o gerar_site) e
    {código: linha da PRODUTOS}."""
    it = wb["PRODUTOS"].iter_rows(values_only=True)
    cab = [limpo(c) for c in next(it)]
    p = {c: cab.index(c) for c in ("CODIGO_BAP", "NO_CATALOGO_DIGITAL", "STATUS_CADASTRO")}
    prods = {limpo(r[0]).upper(): r for r in it if limpo(r[0])}
    site = {c for c, r in prods.items() if limpo(r[p["NO_CATALOGO_DIGITAL"]]).upper() != "NÃO"
            and limpo(r[p["STATUS_CADASTRO"]]).upper() != "INATIVO"}
    return site, prods


def contar(V: list[tuple], site: set[str]) -> dict:
    """Tipos de ano (toda a aba e só as linhas que o site mostra hoje) e o efeito da 1a."""
    visiveis = [r for r in V if limpo(r[0]).upper() in site and limpo(r[7]).lower() == "separado"
                and limpo(r[1]) and limpo(r[2])]
    oculta = [r for r in visiveis if tipo_ano(r[I_INI], r[I_FIM]) == "sem_ano" and limpo(r[0]).upper() not in UNIVERSAIS]
    com_linha = {limpo(r[0]).upper() for r in visiveis}
    ids_ocultas = {id(r) for r in oculta}
    fica = {limpo(r[0]).upper() for r in visiveis if id(r) not in ids_ocultas}
    return {"aba": Counter(tipo_ano(r[I_INI], r[I_FIM]) for r in V),
            "site": Counter(tipo_ano(r[I_INI], r[I_FIM]) for r in visiveis),
            "visiveis": len(visiveis), "ocultas": len(oculta),
            "prod_com_oculta": len({limpo(r[0]).upper() for r in oculta}),
            "prod_com_linha": len(com_linha), "prod_sem_visivel": len(com_linha - fica),
            "sem_visivel": com_linha - fica,
            "prod_site_sem_linha": len(site - com_linha), "prod_site": len(site)}


# ---------------------------------------------------------------- simulação
def veiculo(v: tuple) -> str:
    """FABRICANTE MODELO [VERSAO] [CILINDRADA] da linha, como no LOG."""
    return " ".join(limpo(c) for c in (v[1], v[2], v[3], v[9]) if limpo(c))


def extra(v: tuple, d: dict) -> str:
    """O que mais muda na linha aplicada (itens 13 e 14), sem escrever a marca da P12 (R-20261120-213300)."""
    return "".join([f"; SITUACAO {antes_log(v[I_SIT])} -> '{SEPARADO}'" if d.get("sit") else "",
                    f"; ANO_DUVIDA {antes_log(v[I_DUV])} -> vazio" if d.get("duv") else ""])


def montar(wb, pesq: list[dict], fraga: dict[int, tuple], autorizacao: str) -> dict:
    """Aplica a regra no wb (a v29 carregada) e devolve o que a simulação mostra e o comparar confere."""
    ws = wb["VEICULOS"]
    conferir_cabecalho(ws, CAB_VEICULOS)
    V = [tuple(r) for r in ws.iter_rows(min_row=2, values_only=True)]
    cods_prod = {limpo(r[0]).upper() for r in wb["PRODUTOS"].iter_rows(min_row=2, values_only=True) if limpo(r[0])}
    vistos, linhas = set(), []
    for x in pesq:
        if x["decisao"] == "nao_resolvido":
            continue
        i = int(x["id_linha"]) if x["id_linha"].isdigit() else -1
        if i in vistos:
            parar([f"id_linha {i} repetido na pesquisa"])
        vistos.add(i)
        v = V[i - 1] if 1 <= i <= len(V) else (None,) * 11
        d = decidir(v, x, fraga.get(i))
        if d["acao"] == "aplicar" and limpo(v[0]).upper() not in cods_prod:
            d = {**d, "acao": "divergencia", "regra": "código fora da PRODUTOS"}
        linhas.append((i, v, x, d))
    juh = linhas_juh(V)
    if set(juh) & {i - 1 for i, *_ in linhas}:
        parar(["a pesquisa mexe numa linha Gol do JUH70025"])

    celulas, mud = set(), defaultdict(lambda: defaultdict(list))
    for i, v, x, d in linhas:
        if d["acao"] == "manter":                     # item 16: só o registro no LOG
            mud[limpo(v[0]).upper()]["ANO_MANTIDO"].append((v, d, x))
        if d["acao"] != "aplicar":
            continue
        if (v[I_INI], v[I_FIM]) == (d["ini"], d["fim"]):
            parar([f"id_linha {i}: a regra mandou aplicar e nada mudou"])
        sit = limpo(v[I_SIT]).lower() == MARCA_P12    # item 13: a marca sai, a linha volta ao site
        d["sit"], d["duv"] = sit, v[I_DUV] is not None   # item 14: a pesquisa confirmou a faixa
        for c, val, muda in ((I_INI, d["ini"], v[I_INI] != d["ini"]), (I_FIM, d["fim"], v[I_FIM] != d["fim"]),
                             (I_SIT, SEPARADO, sit), (I_DUV, None, d["duv"])):
            if muda:
                ws.cell(i + 1, c + 1).value = val
                celulas.add((i + 1, c + 1))
        mud[limpo(v[0]).upper()][d["tipo"]].append((v, d, x))
    for j, ver in juh.items():
        ws.cell(j + 2, I_VER + 1).value = ver
        celulas.add((j + 2, I_VER + 1))
        mud["JUH70025"]["CORRECAO_VEICULO"].append((V[j], {"versao": ver}, None))

    fim = (f"APLICACAO da PRODUTOS sem mudança. Simulação em dados/T-0040/v30/. Autorização: {autorizacao}. "
           f"{TAREFA} (v30), {DATA}")
    log = []
    for cod in sorted(mud):
        for tipo, itens in sorted(mud[cod].items()):
            if tipo == "CORRECAO_VEICULO":
                quais = "; ".join(f"Gol {limpo(v[9])} {ano(v)}: VERSAO vazia -> '{d['versao']}'" for v, d, _ in itens)
                txt = (f"VEICULOS: {len(itens)} linha(s) VOLKSWAGEN Gol da regra GOL da v29 com a cilindrada na "
                       f"VERSAO ({quais}), para a tela não trocar a cilindrada (pendência combinada com o po).")
            elif tipo == "ANO_MANTIDO":
                quais = "; ".join(f"{veiculo(v)} {ano(v)} (manter_atual; pesquisa {x['ano_inicial']}–"
                                  f"{x['ano_final']}; fonte: {x['fonte_url']})" for v, d, x in itens)
                txt = (f"VEICULOS: {len(itens)} linha(s) com o ano atual mantido pela pesquisa ({quais}); nenhuma "
                       f"célula muda (registro pedido no item 16 do R-20261127-150417-alexandre).")
            else:
                quais = "; ".join(f"{veiculo(v)} {ano(v)} -> {d['ini']}–{d['fim']}{extra(v, d)} "
                                  f"({x['decisao']}; fonte: {x['fonte_url']})" for v, d, x in itens)
                acao = "completada(s)" if tipo == "ANO_COMPLETADO" else "com o ano atual trocado"
                txt = f"VEICULOS: {len(itens)} linha(s) {acao} pelos anos da pesquisa ({quais}); ({REGRA})."
            obs = f"{txt} {fim}"
            if len(obs) > 32000:
                parar([f"{cod} {tipo}: observação do LOG com {len(obs)} caracteres"])
            log.append([tipo, "VEICULOS", cod, None, obs])
    n = Counter(d["tipo"] for *_, d in linhas if d["acao"] == "aplicar")
    n.update(SITUACAO=sum(d.get("sit", False) for *_, d in linhas), ANO_DUVIDA=sum(d.get("duv", False)
                                                                                   for *_, d in linhas))
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, leia_me(autorizacao, n, Counter(d["acao"] for *_, d in linhas)))
    return {"linhas": linhas, "V": V, "juh": juh, "celulas": celulas, "ult": ult, "leia_n": leia_n, "log": log}


def leia_me(autorizacao: str, n: Counter, acoes: Counter) -> list[tuple]:
    return [
        ("BASE BAP UNIFICADA v30 (27/11/2026)", None),
        ("VEICULOS (anos da pesquisa)", f"Os anos da pesquisa na internet da lista dados/T-0040/pendentes_internet.csv "
                                        f"(pesquisa {PESQ_COMMIT[:7]}, só a decisão diferente de nao_resolvido): "
                                        f"{n['ANO_COMPLETADO']} linhas com o ano completado e {n['ANO_SUBSTITUIDO']} "
                                        f"com o ano atual trocado (conflito resolvido ou faixa da Fraga); "
                                        f"{acoes['manter']} mantidas (no LOG como ANO_MANTIDO); "
                                        f"{acoes['divergencia']} não aplicadas (divergência ou conflito, ficam para "
                                        f"nova pesquisa). Nas aplicadas, {n['SITUACAO']} linhas marcadas na revisão "
                                        f"da P12 passam a 'separado' e {n['ANO_DUVIDA']} têm o ANO_DUVIDA limpo. "
                                        f"Nenhuma linha entra ou sai (T-0040)."),
        ("Regra do ano", "Linha sem ano recebe a faixa. Linha só com um ano: fora de conflito, só a ponta que falta "
                         "(o ano atual fica, se cabe na faixa pesquisada); em conflito com a Fraga, a faixa pesquisada "
                         "entra inteira se concorda com o ano atual ou com a Fraga (cruza ou se encosta, até 1 ano). "
                         "usar_fraga: a faixa da Fraga. INT16501: o ano final 2027 da pesquisa passa a 2026. Na "
                         "linha aplicada, a SITUACAO passa a 'separado' (volta ao site) e o ANO_DUVIDA é limpo. "
                         "ORIGEM, MOTIVO e CILINDRADA ficam (R-20261127-150417-alexandre)."),
        ("JUH70025", "As 3 linhas VOLKSWAGEN Gol da regra GOL da v29 recebem a VERSAO '1.6 L', '1.8 L' e '2.0 L'."),
        ("APLICACAO", "O texto da APLICACAO na PRODUTOS não muda (campo digitado)."),
        ("Formato", f"Mesmas abas e colunas da v29 (VEICULOS com 11 colunas). Uma linha por código e tipo no "
                    f"LOG_CORRECOES (ANO_COMPLETADO, ANO_SUBSTITUIDO, ANO_MANTIDO, CORRECAO_VEICULO), com a "
                    f"fonte_url. Simulação em dados/T-0040/v30/. Autorização: {autorizacao}."),
        (None, None),
    ]


def conferir(p: Path, wb, r: dict, autorizacao: str, extra_ref: Path | None = None) -> list[str]:
    """A base salva em p contra a v29: só as células da regra, o LOG (fim) e o LEIA-ME (topo) mudam."""
    dif = comparar(p, versao(29), {"VEICULOS": r["celulas"]}, r["ult"], "v29", leia_n=r["leia_n"])
    esperado, achado = linhas_novas(wb, r["ult"], r["leia_n"]), linhas_novas(openpyxl.load_workbook(p), r["ult"],
                                                                             r["leia_n"])
    dif += [f"{aba}: o texto das linhas novas não é o que o script escreve" for aba in esperado
            if achado[aba] != esperado[aba]]
    d0, d1 = contar_duvidoso(openpyxl.load_workbook(versao(29))), contar_duvidoso(openpyxl.load_workbook(p))
    dif += [f"{aba}: 'duvidoso' subiu ({d0[aba]} -> {d1[aba]})" for aba in d0 if d1[aba] > d0[aba]]
    if extra_ref:                                 # depois do aprovado: igual à simulada, fora a autorização
        a, b = openpyxl.load_workbook(p), openpyxl.load_workbook(extra_ref)
        if [tuple(x) for x in a["VEICULOS"].values] != [tuple(x) for x in b["VEICULOS"].values]:
            dif.append("VEICULOS: diferente da BASE_simulada_v30.xlsx")
        for aba in ("LOG_CORRECOES", "LEIA-ME"):
            tb = [tuple(c.replace(AUTORIZACAO, autorizacao) if isinstance(c, str) else c for c in x)
                  for x in b[aba].values]
            if [tuple(x) for x in a[aba].values] != tb:
                dif.append(f"{aba}: diferente da simulada fora o texto da autorização")
    return dif


# ---------------------------------------------------------------- antes_depois_v30.xlsx
def aba(wb, nome: str, cab: list[str], linhas: list) -> None:
    ws = wb.create_sheet(nome)
    ws.append(cab)
    for c in ws[1]:
        c.font = Font(bold=True)
    for lin in linhas:
        ws.append(list(lin))
    ws.freeze_panes = "A2"
    if linhas:
        ws.auto_filter.ref = ws.dimensions


def sem_aplicacao(lista: list[dict], prods: dict, V0: list, V1: list) -> list[list]:
    """Cada produto do produtos_sem_aplicacao.csv conferido contra a v29 (e o que a v30 muda)."""
    cab = ["CODIGO_BAP", "DESCRICAO", "FAMILIA", "LINHA", "NO_CATALOGO_DIGITAL"]
    pos = {c: i for i, c in enumerate(["CODIGO_BAP", "DESCRICAO", "APLICACAO", "REFERENCIAS_CRUZADAS",
                                       "DADOS_ADICIONAIS", "PRODUTO", "CATEGORIA", "SISTEMA", "FAMILIA", "LINHA",
                                       "NO_CATALOGO_DIGITAL"])}

    def por_cod(V):
        d = defaultdict(list)
        for r in V:
            d[limpo(r[0]).upper()].append(r)
        return d
    v0, v1, saida = por_cod(V0), por_cod(V1), []
    for x in lista:
        cod = x["codigo_bap"].upper()
        p = prods.get(cod)
        if not p:
            saida.append([x["codigo_bap"], x["descricao"], x["motivo"], "NÃO", "código fora da PRODUTOS", "", "", ""])
            continue
        difs = [c for c, k in zip(cab[1:], ("descricao", "familia", "linha", "no_catalogo_digital"))
                if limpo(p[pos[c]]) != x[k]]
        ls0, ls1 = v0.get(cod, []), v1.get(cod, [])
        com0 = sum(tipo_ano(r[I_INI], r[I_FIM]) != "sem_ano" for r in ls0)
        com1 = sum(tipo_ano(r[I_INI], r[I_FIM]) != "sem_ano" for r in ls1)
        motivo = "sem nenhum veículo na v29" if not ls0 else f"os {len(ls0)} veículos estão sem ano" if not com0 \
            else f"{com0} de {len(ls0)} veículos com ano"
        if motivo != x["motivo"]:
            difs.append(f"motivo (na v29: {motivo})")
        saida.append([x["codigo_bap"], x["descricao"], x["motivo"], "SIM" if not difs else "NÃO", "; ".join(difs),
                      "SIM" if not limpo(p[pos["APLICACAO"]]) else "NÃO", len(ls0), com1])
    return saida


def motivo_nr(x: dict) -> str:
    o = x["observacao"]
    if o.startswith("nenhum catálogo público"):
        return "nenhum catálogo público de fabricante trouxe o veículo para as referências"
    if o.startswith("fontes divergem"):
        return "fontes divergem"
    return "outro: " + o[:60]


def antes_depois(r: dict, pesq: list[dict], lista_sa: list[dict], prods: dict, site: set[str], V1: list,
                 fraga: dict) -> dict:
    V0, linhas = r["V"], r["linhas"]
    c0, c1 = contar(V0, site), contar(V1, site)
    sa = sem_aplicacao(lista_sa, prods, V0, V1)
    sa_bate = sum(1 for s in sa if s[3] == "SIM")
    acoes = Counter(d["acao"] for *_, d in linhas)
    tipos = Counter(d["tipo"] for *_, d in linhas if d["acao"] == "aplicar")
    regras = Counter(re.split(r"[:(]", d["regra"])[0].strip() if d["acao"] == "divergencia" else d["regra"]
                     for *_, d in linhas)
    dec = Counter(x["decisao"] for x in pesq)
    sem_vis_lista = len(c1["sem_visivel"] & {x["codigo_bap"].upper() for x in lista_sa})
    resumo = [("Pesquisa (linhas)", len(pesq), ""), *((f"  decisao = {k}", v, "") for k, v in sorted(dec.items())),
              ("Linhas aplicadas", acoes["aplicar"], ""),
              ("  ANO_COMPLETADO", tipos["ANO_COMPLETADO"], ""), ("  ANO_SUBSTITUIDO", tipos["ANO_SUBSTITUIDO"], ""),
              ("  SITUACAO marcada na P12 -> 'separado' (item 13)", sum(d.get("sit", False) for *_, d in linhas), ""),
              ("  ANO_DUVIDA limpo (item 14)", sum(d.get("duv", False) for *_, d in linhas), ""),
              ("Linhas mantidas (manter_atual; no LOG como ANO_MANTIDO, item 16)", acoes["manter"], ""),
              ("Linhas não aplicadas (DIVERGENCIAS)", acoes["divergencia"], ""),
              *((f"  regra: {k}", v, "") for k, v in sorted(regras.items())),
              ("JUH70025: linhas Gol com VERSAO", len(r["juh"]), ""), ("", "", ""),
              ("CONTAGEM", "ANTES (v29)", "DEPOIS (v30 simulada)")]
    for rot, k in (("aba VEICULOS inteira", "aba"), ("linhas que o site mostra hoje (separado, no site)", "site")):
        resumo += [(f"{rot}: {t}", c0[k][t], c1[k][t]) for t in ("sem_ano", "so_inicial", "so_final", "completa")]
        resumo += [(f"{rot}: total", sum(c0[k].values()), sum(c1[k].values()))]
    resumo += [("1a: linhas que o site mostra hoje", c0["visiveis"], c1["visiveis"]),
               ("1a: linhas que ficariam ocultas (sem ano; fora FLU15001/FLU15002)", c0["ocultas"], c1["ocultas"]),
               ("1a: produtos com ao menos 1 linha oculta", c0["prod_com_oculta"], c1["prod_com_oculta"]),
               ("1a: produtos do site com linha de veículo hoje", c0["prod_com_linha"], c1["prod_com_linha"]),
               ("1a: produtos que ficariam sem nenhuma linha visível", c0["prod_sem_visivel"],
                c1["prod_sem_visivel"]),
               ("   destes, na lista produtos_sem_aplicacao.csv", len(c0["sem_visivel"] & {x["codigo_bap"].upper()
                                                                                     for x in lista_sa}),
                sem_vis_lista),
               ("Produtos do site sem nenhuma linha de veículo (já hoje)", c0["prod_site_sem_linha"],
                c1["prod_site_sem_linha"]),
               ("2a: produtos do site que mostrariam 'Aplicação em revisão' (sem linha + sem linha visível)",
                c0["prod_site_sem_linha"] + c0["prod_sem_visivel"], c1["prod_site_sem_linha"] + c1["prod_sem_visivel"]),
               ("Produtos no site", c0["prod_site"], c1["prod_site"]), ("", "", ""),
               ("SEM_APLICACAO: produtos na lista", len(sa), ""), ("SEM_APLICACAO: batem com a base", sa_bate, ""),
               ("SEM_APLICACAO: não batem", len(sa) - sa_bate, ""),
               ("SEM_APLICACAO: ganham ano na v30", sum(1 for s in sa if isinstance(s[7], int) and s[7] > 0), "")]

    ap, dv = [], []
    for i, v, x, d in linhas:
        lin = [i, i + 1, limpo(v[0]), limpo(v[1]), limpo(v[2]), limpo(v[3]), limpo(v[9]), limpo(v[7]),
               x["decisao"], x["em_conflito"], "–".join(map(str, fraga[i])) if i in fraga else "", ano(v),
               f"{x['ano_inicial']}–{x['ano_final']}", d["regra"]]
        if d["acao"] == "divergencia":
            dv.append(lin + [x["tipo_fonte"], x["fonte_url"], x["observacao"]])
        else:
            ap.append(lin + [f"{d['ini'] if d['ini'] is not None else '?'}–{d['fim'] if d['fim'] is not None else '?'}"
                             if d["acao"] == "aplicar" else "(sem mudança)", d["tipo"] or "ANO_MANTIDO",
                             x["tipo_fonte"], x["fonte_url"], x["observacao"],
                             SEPARADO if d.get("sit") else limpo(v[I_SIT]), limpo(v[I_DUV]),
                             "" if d.get("duv") else limpo(v[I_DUV])])
    for j, ver in r["juh"].items():
        v = V0[j]
        ap.append([j + 1, j + 2, limpo(v[0]), limpo(v[1]), limpo(v[2]), "(vazio) -> " + ver, limpo(v[9]), limpo(v[7]),
                   "pendência po", "", "", ano(v), "", "VERSAO da linha Gol da regra GOL da v29", ano(v),
                   "CORRECAO_VEICULO", "", "", "", limpo(v[I_SIT]), limpo(v[I_DUV]), limpo(v[I_DUV])])
    nr = Counter((motivo_nr(x), x["em_conflito"] or "não") for x in pesq if x["decisao"] == "nao_resolvido")
    return {"resumo": resumo, "ap": ap, "dv": dv, "nr": sorted(nr.items(), key=lambda t: -t[1]), "sa": sa,
            "c0": c0, "c1": c1, "sa_bate": sa_bate, "acoes": acoes, "tipos": tipos, "regras": regras}


PONTOS = [
    "1. Regra de conflito (base_v30.decidir): fora de conflito, a pesquisa só completa a ponta que falta e o ano atual "
    "fica (ex.: 1985+ e pesquisa 1984–1994 -> 1985–1994). Em conflito com a Fraga, a faixa pesquisada entra inteira "
    "quando concorda com o ano atual ou com a Fraga. Aprova assim?",
    "2. DIVERGENCIAS 'conflito novo': a pesquisa contradiz o ano atual numa linha que não estava em conflito com a "
    "Fraga (ex.: CXD13007 Classic 2016+ e pesquisa 2002–2012). Ficam como estão. Trocar pelo ano da pesquisa, manter "
    "ou mandar para nova pesquisa?",
    "3. DIVERGENCIAS 'conflito sem resolução': a pesquisa não concorda nem com o ano atual nem com a Fraga. Ficam "
    "como estão (a Fraga já entrou somada na v29). Manter?",
    "4. Faixa que termina em 2025 ou 2026 (veículo ainda em produção): entra como veio (decisão 4 de 26/11: em "
    "produção = 2026). Confirma?",
    "5. As linhas com SITUACAO 'duvidoso' que ganharam ano continuam duvidosas (fora do site). Passar a 'separado' "
    "quando a pesquisa achou o veículo pelo código ou pela referência?",
    "6. O ANO_DUVIDA das linhas que ganharam ano ('herdado...', 'ano solto...') fica como estava. Limpar quando a "
    "pesquisa confirmou a faixa?",
    "7. Fonte de loja (marketplace) vale igual à de fabricante? Hoje vale (a pesquisa já decidiu 'nova_faixa').",
    "8. manter_atual: não muda nada e não vai para o LOG_CORRECOES (só consta na aba APLICADAS). Quer uma linha de "
    "registro no LOG também?",
    "9. 1a no site: ver no RESUMO quantos produtos ficariam sem nenhuma linha visível (vão mostrar 'Aplicação em "
    "revisão; consulte o vendedor', 2a). É do web-site, depois do aprovado.",
    "10. Ano final 2027 (INT16501 Nivus, T-Cross e Taos, fonte 3-RHO): fora da regra (em produção = 2026), não "
    "entrou (DIVERGENCIAS). Pôr 2026?",
    "11. Faixa de um ano só (início = fim, ex.: ELE1006 Idea 2010–2010) entrou como veio (decisão 4 de 26/11). E as "
    "faixas muito longas da 3-RHO (ex.: INT16509 Civic 1991–2024) também. Confirma?",
    "12. Os produtos com linha de veículo que ficam sem nenhuma linha visível pela 1a não batem com a lista "
    "produtos_sem_aplicacao.csv (ver RESUMO): a lista conta também as linhas duvidosas e os produtos fora do site. Qual "
    "das duas o web-site usa?",
    "13. JUH70025: as 3 linhas Gol ganham a VERSAO '1.6 L', '1.8 L' e '2.0 L'; as linhas Gol duvidosas de antes "
    "ficam. Confirma?",
]


# as respostas do Alexandre (itens 9 a 20 do R-20261127-144829-gerente-projetos), na ordem dos PONTOS
RESPOSTAS = [
    "9. Aprovada.",
    "10. Ficam como estão e vão para nova pesquisa depois.",
    "11. Ficam como estão.",
    "12. Entra como veio.",
    "13. Passa a 'separado' e volta ao site (aplicado na linha que ganhou ano).",
    "14. Limpar quando a pesquisa confirmou a faixa (aplicado na linha que ganhou ano).",
    "15. Vale igual à de fabricante.",
    "16. Também entram no LOG_CORRECOES (ANO_MANTIDO).",
    "1 (site): ocultar só as linhas sem ano nenhum; 19: vale a conta do site.",
    "17. Passa a 2026 (aplicado nas linhas do INT16501).",
    "18. Entram como vieram.",
    "19. Vale a conta do site (199 produtos com o aviso).",
    "20. Confirmado.",
]


def gravar_ad(res: dict) -> None:
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    aba(wb, "RESUMO", ["ITEM", "ANTES / VALOR", "DEPOIS"], res["resumo"])
    base = ["id_linha", "linha_excel", "CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "CILINDRADA", "SITUACAO",
            "decisao", "em_conflito", "faixa_fraga", "ano_antes", "ano_pesquisa", "regra"]
    aba(wb, "APLICADAS", base + ["ano_depois", "tipo_LOG", "tipo_fonte", "fonte_url", "observacao",
                                 "SITUACAO_depois", "ANO_DUVIDA_antes", "ANO_DUVIDA_depois"], res["ap"])
    aba(wb, "DIVERGENCIAS", base + ["tipo_fonte", "fonte_url", "observacao"], res["dv"])
    aba(wb, "NAO_RESOLVIDO", ["motivo", "em_conflito", "linhas"], [(m, c, n) for (m, c), n in res["nr"]])
    aba(wb, "SEM_APLICACAO", ["codigo_bap", "descricao (lista)", "motivo (lista)", "bate com a base", "o que difere",
                              "APLICACAO vazia na base", "linhas VEICULOS v29", "linhas com ano v30"], res["sa"])
    aba(wb, "PONTOS_ALEXANDRE", ["ponto", "resposta (R-20261127-150417-alexandre)"], list(zip(PONTOS, RESPOSTAS)))
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and INTERNO.search(c.value):
                    raise SystemExit(f"[PARADO] palavra interna na {ws.title} {c.coordinate}")
    SAIDA.mkdir(parents=True, exist_ok=True)
    wb.save(AD)


# ---------------------------------------------------------------- main
def refazer() -> None:
    """Volta a base para a v29 do origin/main (a v30 de versoes sai), para gravar depois do aprovado."""
    b = subprocess.run(["git", "-C", str(RAIZ), "show", "origin/main:dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"],
                       capture_output=True, check=True).stdout
    BASE.write_bytes(b)
    if sha(BASE) != sha(versao(29)):
        raise SystemExit("[PARADO] a base do origin/main não é a v29: o main mudou, refaça a simulação")
    versao(30).unlink(missing_ok=True)
    print(f"  --refazer: base de volta à v29 do origin/main ({sha(BASE)})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--autorizacao", default=AUTORIZACAO, help="o recado do aprovado (padrão: pendente)")
    ap.add_argument("--refazer", action="store_true", help="depois do aprovado: grava a base e a v30")
    ap.add_argument("--pesquisa-dir", type=Path, help="pasta com os 2 CSVs da pesquisa (sem o git show)")
    arg = ap.parse_args()
    aprovado = arg.autorizacao != AUTORIZACAO
    if aprovado != arg.refazer:
        raise SystemExit("[PARADO] --refazer e --autorizacao 'R-…' vão juntos (sem os dois: simulação)")
    if aprovado and not re.fullmatch(r"R-\d{8}-\d{6}-[a-z-]+", limpo(arg.autorizacao)):
        raise SystemExit(f"[PARADO] recado fora do padrão: {arg.autorizacao}")
    autorizacao = f"aprovado em {limpo(arg.autorizacao)}" if aprovado else AUTORIZACAO
    pesq = ler_pesquisa("anos_pesquisa_T0040.csv", arg.pesquisa_dir)
    lista_sa = ler_pesquisa("produtos_sem_aplicacao.csv", arg.pesquisa_dir)
    fraga = ler_conflitos()
    if aprovado:
        if not SIM.exists():
            raise SystemExit("[PARADO] falta a BASE_simulada_v30.xlsx da simulação aprovada")
        refazer()
    if versao(30).exists():
        raise SystemExit("[PARADO] a v30 já existe em dados/versoes")
    sha_antes = sha(BASE)
    if sha_antes != sha(versao(29)):
        raise SystemExit("[PARADO] a base de hoje não é a v29")

    wb = openpyxl.load_workbook(BASE)
    r = montar(wb, pesq, fraga, autorizacao)
    site, prods = produtos_site(wb)
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / BASE.name
        wb.save(p)
        parar(conferir(p, wb, r, autorizacao, SIM if aprovado else None))
        if sha(BASE) != sha_antes:
            parar(["a base mudou durante a montagem"])
        V1 = [tuple(x) for x in openpyxl.load_workbook(p, read_only=True)["VEICULOS"].iter_rows(min_row=2,
                                                                                                values_only=True)]
        if aprovado:
            gravar(p, versao(30))
        else:
            SAIDA.mkdir(parents=True, exist_ok=True)
            SIM.write_bytes(p.read_bytes())
            res = antes_depois(r, pesq, lista_sa, prods, site, V1, fraga)
            gravar_ad(res)
            print(f"  {SIM.relative_to(RAIZ)}: sha256 {sha(SIM)}")
            print(f"  {AD.relative_to(RAIZ)}")
            print(f"  ações {dict(res['acoes'])}; tipos {dict(res['tipos'])}; SEM_APLICACAO batem {res['sa_bate']}")
            for lin in res["resumo"]:
                print("   ", *lin)
    print(f"  LOG_CORRECOES +{len(r['log'])} ({dict(Counter(x[0] for x in r['log']))}); LEIA-ME +{r['leia_n']}")
    print(f"  autorização: {autorizacao}; sha256 da base (v29) antes: {sha_antes}; agora: {sha(BASE)}")


if __name__ == "__main__":
    main()
