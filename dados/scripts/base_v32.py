"""v32 da base unificada · T-0047 (BIE20014, TER552120, VEL7520 e ROL84888).

Pedido: R-20261127-192108-alexandre, item 18 (BIE20014 "05 /15 ou", TER552120 com o lado duas vezes na Ficha, VEL7520
com "Modelos" igual à Aplicação e "Especificacoes" sem acento), aberto pelo po em R-20261127-194205-po (item 2); e
R-20261127-200014-alexandre, item 4 (ROL84888: os anos do Strada e do Doblò). Regras: cada correção com a fonte; o que
não tem fonte fica listado (SEM_FONTE) e não muda; o que é do site fica listado (DO_SITE) e não muda a base; nada é
marcado nem escrito como duvidoso (R-20261127-161035-alexandre, item 3; R-20261120-213300).

Mudam só células (nenhuma linha entra nem sai; a numeração é a da v31):
- PRODUTOS 2282 (BIE20014): a APLICACAO ("05 /15" -> "2005–2015", o resto da célula fica) e as REFERENCIAS_CRUZADAS
  (sai só a repetição ", AXIOS PN: BR10053102707");
- VEICULOS 21510 (BIE20014 Tucson): sai o ANO_DUVIDA (o ano 2005–2015 já está na linha desde a v20);
- VEICULOS 6369 e 6371 (ROL84888 Strada e Doblo): o ano do próprio modelo no texto, sem o ANO_DUVIDA "herdado".
Os itens TER552120 e VEL7520 são do site (gerar_site.py, lista FICHA): a base não muda (DO_SITE).
Cada mudança leva o ponto da aba PONTOS_ALEXANDRE que a decide; a simulação mostra a opção a) de todos.

A conferência é o base_comum.comparar contra a v31 (só as células da lista, o LOG_CORRECOES e o LEIA-ME mudam), o texto
das linhas novas e o "duvidoso", que não sobe.

AUTORIZAÇÃO: sem --refazer, grava só em dados/T-0047/v32/ (BASE_simulada_v32.xlsx e antes_depois_v32.xlsx, com
"pendente do aprovado do Alexandre"); com --refazer e --autorizacao, parte da v31 do origin/main e grava a base e a v32.

Uso: python3 dados/scripts/base_v32.py                                (simulação)
     python3 dados/scripts/base_v32.py --refazer --autorizacao "R-…"  (depois do aprovado)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (BASE, CAB_VEICULOS, RAIZ, aba, acrescentar_leia_me, acrescentar_log, antes_log,  # noqa: E402
                        comparar, conferir_cabecalho, contar_duvidoso, gerar_site_copia, gravar, limpo, parar,
                        refazer, sem_interno, sha, texto_novo_difere, versao)

TAREFA, DATA = "T-0047", "28/11/2026"
ANTERIOR, NOVA = 31, 32
AUTORIZACAO = "pendente do aprovado do Alexandre"
SAIDA = RAIZ / "dados" / "T-0047" / "v32"
SIM = SAIDA / "BASE_simulada_v32.xlsx"
AD = SAIDA / "antes_depois_v32.xlsx"
CAB_PRODUTOS = ["CODIGO_BAP", "DESCRICAO", "APLICACAO", "REFERENCIAS_CRUZADAS", "DADOS_ADICIONAIS", "PRODUTO",
                "CATEGORIA", "SISTEMA", "FAMILIA", "LINHA", "NO_CATALOGO_DIGITAL", "STATUS_CADASTRO", "POSICAO", "LADO",
                "DETALHE_CATALOGO", "DIFERENCIAL", "ITEM_PARECIDO", "OFERECA_JUNTO"]
CAB = {"PRODUTOS": CAB_PRODUTOS, "VEICULOS": CAB_VEICULOS}
CODIGOS = ["BIE20014", "TER552120", "VEL7520", "ROL84888"]

# ---------------------------------------------------------------- fontes (citadas em cada mudança e no LOG)
F_TUC = ("APLICACAO (digitada desde a v8, 'Tucson 05 /15 (dianteira Direita ou Esquerda)', igual até a v31) e VEICULOS "
         "21510 (desde a v20: HYUNDAI Tucson 2005–2015). Na mesma fonte das bieletas (CATALOGO_BAP_AGENTE_PRONTO.xlsx), o "
         "'AA /AA' é ano a ano: 'XSARA 98 /03' (BIE20044), '206 99 /12' (BIE20003), 'SPRINTER 97 /12' (BIE20075), em que o "
         "primeiro número não pode ser mês. Regra de datas do catálogo (docs/legado/agente_catalogo_bap.md): ano com 4 "
         "dígitos, intervalo com '–'. A Fraga não traz o Tucson para o BIE20014 (só o HB20, VEICULOS 21511 e 21512)")
F_REF = ("REFERENCIAS_CRUZADAS (digitada desde a v8): 'TRW/AXIOS: BR10053102707' e, no fim do mesmo bloco, "
         "'AXIOS PN: BR10053102707' são o mesmo código da AXIOS. Fica o primeiro (que diz as duas marcas); as outras "
         "referências não mudam")
F_ROL = ("DETALHE da APLICACAO (digitado desde a v8) e aba ROLAMENTOS_INTEGRADOS, linha 187 (cadastro master de "
         "rolamentos, aplicação confirmada): 'Strada 1.6/1.8 (1999-2020), Doblò 1.6/1.8 (2001-2021)'. A linha tem hoje a "
         "faixa do produto inteiro (1996–2021), herdada da lista na v20 (por isso o ANO_DUVIDA 'herdado')")

TUC_ANTES = "Tucson 05 /15 (diant. Direita ou Esquerda)"
REF_ANTES = ("CROSS REFERENCIAS - PDX PN: 07.10, TRW/AXIOS: BR10053102707, OEM: 548303W300, NAKATA PN: N99150, COFAP PN: "
             "BTC32108, BTC33110, TRW PN: 0, AXIOS PN: BR10053102707; AXIOS: 2681; GRAZZIMETAL: AK 8071A; GRAZZIMETAL: HY "
             "9087A; KIT & CIA: 50440; SAMPEL: SK8238; ZM: 37011810")
REF_REPETIDA = ", AXIOS PN: BR10053102707"
HERDADO = "herdado: o ano vem depois de outro modelo da lista"

# (código, aba, linha do Excel na v31, coluna, antes, depois, fonte, ponto)
CELULAS: list[tuple] = [
    ("BIE20014", "PRODUTOS", 2282, "APLICACAO", TUC_ANTES, TUC_ANTES.replace("05 /15", "2005–2015"), F_TUC, "P1"),
    ("BIE20014", "VEICULOS", 21510, "ANO_DUVIDA", "AA/AA ambíguo ('05 /15' pode ser mês/ano)", None, F_TUC, "P1"),
    ("BIE20014", "PRODUTOS", 2282, "REFERENCIAS_CRUZADAS", REF_ANTES, REF_ANTES.replace(REF_REPETIDA, "", 1), F_REF,
     "P2"),
    ("ROL84888", "VEICULOS", 6369, "ANO_INICIO", 1996, 1999, F_ROL, "P3"),
    ("ROL84888", "VEICULOS", 6369, "ANO_FIM", 2021, 2020, F_ROL, "P3"),
    ("ROL84888", "VEICULOS", 6369, "ANO_DUVIDA", HERDADO, None, F_ROL, "P3"),
    ("ROL84888", "VEICULOS", 6371, "ANO_INICIO", 1996, 2001, F_ROL, "P3"),
    ("ROL84888", "VEICULOS", 6371, "ANO_DUVIDA", HERDADO, None, F_ROL, "P3"),
]

# (código, o que, por que fica, o que falta)
SEM_FONTE = [
    ("ROL84888", "VEICULOS 6367 Palio, 6368 Siena, 6370 Weekend, 6372 Idea, 6373 Brava e 6374 Marea: 1996–2021 "
                 "herdado da lista (o ano aparece, mas não filtra)",
     "o DETALHE e o cadastro master só citam o Palio, a Idea, o Brava e o Marea, sem ano; o Siena e a Weekend nem "
     "aparecem no DETALHE. Só o Tipo tem a faixa 1996–2021 direto do texto",
     "os anos de cada modelo (um catálogo da FAG F-110731 ou da SKF VKJP84888)"),
    ("ROL84888", "VEICULOS 6369 Strada e 6371 Doblo: a cilindrada (o DETALHE diz '1.6/1.8')",
     "a tarefa pede os anos; a cilindrada fica vazia, como hoje", "a decisão de acrescentar (fora da tarefa)"),
    ("BIE20014", "'TRW PN: 0' nas REFERENCIAS_CRUZADAS", "o '0' não é código (o site já não mostra); não há fonte para "
                 "o código TRW", "o código TRW da bieleta"),
    ("BIE20062", "a APLICACAO tem o mesmo 'Tucson 05 /15 (diant. Direita ou Esquerda)' e a VEICULOS 21800 o mesmo "
                 "ANO_DUVIDA; a Fraga dá a esta peça o Tucson TRASEIRO (21802 a 21804)",
     "fora da tarefa (visto de passagem)", "a decisão do P1 vale também para ele? (nova tarefa)"),
]

# (código, o que se perde ou sai repetido na tela, causa no site, o que mudaria no site)
DO_SITE = [
    ("TER552120", "Ficha: 'Lado: Esquerdo e direito' e 'Posição e lado: DIR. / ESQ.' (o mesmo lado duas vezes). O "
                  "BIE20014 tem o mesmo: 'Posição: Dianteiro', 'Lado' e 'Posição e lado: Dianteira'. No JSON da v31, "
                  "439 produtos têm 'Posição e lado' e também a POSICAO ou o LADO",
     "não é a base: a coluna LADO (taxonomia) e a chave POSICAO_LADO dos DADOS_ADICIONAIS (texto da fonte do catálogo, "
     "digitado) são campos diferentes, cada um com o seu uso. O gerar_site.py leva a POSICAO_LADO para a ficha (FICHA: "
     "'^(POSICAO_?LADO|LADO_ESQUERDO_/_DIREITO)$' -> 'Posição e lado'), e o app.js (produtoHtml) põe 'Posição' e 'Lado' "
     "das colunas",
     "web-site: no gerar_site, não levar 'Posição e lado' para o x quando o produto tem POSICAO ou LADO. É tirar da "
     "ficha, não pôr: a FICHA não fica mais larga e a TRAVA não muda"),
    ("VEL7520", "Ficha: 'Modelos' repete a Aplicação (o ROL84888 também). No JSON da v31, 285 produtos têm 'Modelos'",
     "não é a base: a chave MODELOS dos DADOS_ADICIONAIS (cadastro master) é digitada e o gerar_site também a lê para "
     "a montadora e os anos. A FICHA a leva para a ficha ('^MODELOS?$' -> 'Modelos')",
     "web-site: no gerar_site, não levar 'Modelos' para o x quando o produto tem APLICACAO (ou tirar a linha da FICHA)"),
    ("VEL7520", "Ficha: o rótulo 'Especificacoes' sem acento (51 produtos; 'Especificacao', 24). Outros rótulos saem "
                "sem acento pelo mesmo motivo: 'Espec tecnica' (73), 'Camara' (12), 'Pneus compativeis' (9)",
     "não é a base: as chaves dos DADOS_ADICIONAIS são sem acento e maiúsculas, como todas (ESPECIFICACOES). Na FICHA, a "
     "linha desses rótulos não tem nome (None), e o rotulo() só troca o '_' por espaço e a caixa",
     "web-site: dar o rótulo com acento na FICHA ('Especificações', 'Especificação', 'Câmara', 'Pneus compatíveis'…), "
     "como os outros rótulos já têm. Trocar a chave na base mudaria o campo digitado de 75 produtos (e o que a BAP "
     "Central lê)"),
]

# (ponto, código, pergunta, a, b)
PONTOS = [
    ("P1", "BIE20014", "O Tucson tem '05 /15' no texto (desde a v8). A VEICULOS já tem 2005–2015 desde a v20, marcado "
                       "no ANO_DUVIDA porque '05 /15' podia ser mês/ano; por isso o site mostra o Ano '—'. Na mesma fonte "
                       "das bieletas, o 'AA /AA' é ano a ano (98 /03, 99 /12, 97 /12).",
     "a) ler como 2005–2015: a APLICACAO fica 'Tucson 2005–2015 (diant. Direita ou Esquerda)' e o ANO_DUVIDA sai da "
     "linha 21510 (o Tucson 2005–2015 passa a filtrar)",
     "b) não mudar (fica para a nova pesquisa)"),
    ("P2", "BIE20014", "BR10053102707 aparece em 'TRW/AXIOS' e de novo em 'AXIOS PN'.",
     "a) tirar o 'AXIOS PN: BR10053102707' (fica 'TRW/AXIOS: BR10053102707'; as outras referências não mudam)",
     "b) não mudar"),
    ("P3", "ROL84888", "Strada e Doblo têm hoje 1996–2021 (a faixa do produto, herdada da lista, que não filtra). O "
                       "DETALHE e o cadastro master dão Strada 1999–2020 e Doblò 2001–2021. O texto principal "
                       "('1996 a 2021') é a faixa do produto inteiro e fica.",
     "a) Strada 1999–2020 e Doblo 2001–2021 na VEICULOS, sem o ANO_DUVIDA (o ano passa a filtrar: 'Fiat Strada 1997' "
     "e 'Fiat Doblo 2000' deixam de achar o rolamento)",
     "b) não mudar"),
    ("P4", "TER552120", "A Ficha mostra o lado duas vezes ('Lado' e 'Posição e lado'): 439 produtos têm o mesmo. É do "
                        "site, não da base.",
     "a) o web-site tira o 'Posição e lado' da ficha quando o produto tem Posição ou Lado (todos os 439)",
     "b) manter como está"),
    ("P5", "VEL7520", "A linha 'Modelos' da Ficha repete a Aplicação (285 produtos). É do site, não da base.",
     "a) o web-site tira o 'Modelos' da ficha quando o produto tem Aplicação", "b) manter como está"),
    ("P6", "VEL7520", "O rótulo 'Especificacoes' sai sem acento (e 'Especificacao', 'Espec tecnica', 'Camara', 'Pneus "
                      "compativeis'). É do site, não da base.",
     "a) o web-site põe o acento em todos esses rótulos da ficha",
     "b) só 'Especificações' e 'Especificação'"),
]


def fmt(v) -> str:
    """O valor como a planilha mostra: "(vazio)" e, no lugar da marca da revisão da P12, o antes_log."""
    return "(vazio)" if v in (None, "") else antes_log(v) if limpo(v).lower() == "duvidoso" else str(v)


def veiculo(r) -> str:
    """FABRICANTE MODELO [VERSAO] ini–fim de uma linha da VEICULOS."""
    ini, fim = r[CAB_VEICULOS.index("ANO_INICIO")], r[CAB_VEICULOS.index("ANO_FIM")]
    ano = f"{ini or '?'}–{fim or '?'}" if ini or fim else "sem ano"
    return " ".join(limpo(x) for x in (r[1], r[2], r[3]) if limpo(x)) + f" {ano}"


# ---------------------------------------------------------------- montagem
def montar(wb, autorizacao: str) -> dict:
    """As CELULAS, o LOG e o LEIA-ME no wb (a v31 carregada), depois de conferir o valor de hoje de cada célula."""
    for nome, cab in CAB.items():
        conferir_cabecalho(wb[nome], cab)
    erros, mud, celulas = [], [], {"PRODUTOS": set(), "VEICULOS": set()}
    for cod, nome, n, col, antes, depois, fonte, ponto in CELULAS:
        ws, c = wb[nome], CAB[nome].index(col) + 1
        hoje = ws.cell(n, c).value
        if limpo(ws.cell(n, 1).value).upper() != cod or hoje != antes or hoje == depois:
            erros.append(f"{cod} {nome} {n} {col}: hoje {hoje!r}, a simulação espera {antes!r}")
            continue
        quem = veiculo([x.value for x in ws[n]]) if nome == "VEICULOS" else ""
        mud.append((cod, nome, n, col, hoje, depois, fonte, ponto, quem))
        celulas[nome].add((n, c))
    parar(erros)
    for cod, nome, n, col, antes, depois, *_ in CELULAS:
        wb[nome].cell(n, CAB[nome].index(col) + 1).value = depois
    fim = f"Autorização: {autorizacao}. {TAREFA} (v{NOVA}), {DATA}"
    tipos = {"APLICACAO": "CORRECAO_APLICACAO", "REFERENCIAS_CRUZADAS": "CORRECAO_REFERENCIA"}
    log, por = [], {}
    for cod, nome, n, col, antes, depois, fonte, ponto, quem in mud:
        tipo = tipos.get(col, "CORRECAO_VEICULO")
        if col == "REFERENCIAS_CRUZADAS":
            txt = f"REFERENCIAS_CRUZADAS: sai a repetição '{REF_REPETIDA.lstrip(', ')}' (o resto da célula não muda)"
        else:
            txt = f"{col} {antes_log(antes)} -> {antes_log(depois)}"
        x = por.setdefault((cod, nome, tipo), {"txt": {}, "fonte": []})
        x["txt"].setdefault((n, quem), []).append(txt)
        if fonte not in x["fonte"]:
            x["fonte"].append(fonte)
    for (cod, nome, tipo), x in por.items():
        partes = [(f"linha {n} ({quem}): " if quem else "") + ", ".join(t) for (n, quem), t in x["txt"].items()]
        log.append([tipo, nome, cod, None, f"{nome}: {'; '.join(partes)}. Fonte: {' | '.join(x['fonte'])}. {fim}"])
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, leia_me(autorizacao))
    return {"mud": mud, "celulas": celulas, "ult": ult, "leia_n": leia_n, "log": log}


def leia_me(autorizacao: str) -> list[tuple]:
    n_p = sum(x[1] == "PRODUTOS" for x in CELULAS)
    return [
        (f"BASE BAP UNIFICADA v{NOVA} ({DATA})", None),
        ("Correções pontuais", f"Com fonte ({TAREFA}, R-20261127-192108-alexandre item 18 e R-20261127-200014-alexandre "
                               f"item 4): {n_p} células na PRODUTOS (BIE20014: APLICACAO e REFERENCIAS_CRUZADAS) e "
                               f"{len(CELULAS) - n_p} na VEICULOS (BIE20014 Tucson; ROL84888 Strada e Doblo). A fonte "
                               f"de cada uma está no LOG_CORRECOES."),
        ("Site", "TER552120 e VEL7520: a repetição da Ficha e o rótulo sem acento são do gerar_site.py (web-site); a "
                 "base não muda."),
        ("Formato", f"Mesmas abas e colunas da v{ANTERIOR}. Antes e depois: dados/T-0047/v{NOVA}/antes_depois_v{NOVA}.xlsx. "
                    f"Autorização: {autorizacao}."),
        (None, None),
    ]


def conferir(p: Path, wb, r: dict) -> tuple[list[str], dict, dict]:
    """A base nova contra a v31 (só as CELULAS, o LOG e o LEIA-ME); o valor gravado; o 'duvidoso' não sobe."""
    dif = comparar(p, versao(ANTERIOR), r["celulas"], r["ult"], f"v{ANTERIOR}", leia_n=r["leia_n"])
    dif += texto_novo_difere(p, wb, r["ult"], r["leia_n"])
    salva = openpyxl.load_workbook(p)
    dif += [f"{nome} {n} {col}: valor gravado diferente" for cod, nome, n, col, antes, depois, *_ in CELULAS
            if salva[nome].cell(n, CAB[nome].index(col) + 1).value != depois]
    d0, d1 = contar_duvidoso(openpyxl.load_workbook(versao(ANTERIOR), read_only=True)), contar_duvidoso(salva)
    dif += [f"{a}: 'duvidoso' subiu ({d0[a]} -> {d1[a]})" for a in d0 if d1[a] > d0[a]]
    return dif, d0, d1


# ---------------------------------------------------------------- efeito no site
def efeito_site(antes: dict, depois: dict) -> list[list]:
    """Por código: os campos do JSON que mudam (a aplicação, as referências, os veículos e a ficha)."""
    saida = []
    for c in CODIGOS:
        a, d = antes["produtos"].get(c, {}), depois["produtos"].get(c, {})
        for k in ("a", "r", "ve", "vo", "an", "x", "po", "la"):
            if a.get(k) != d.get(k):
                saida.append([c, k] + [json.dumps(x[k], ensure_ascii=False) if x.get(k) else "(não tem)" for x in (a, d)])
        if not any(x[0] == c for x in saida):
            saida.append([c, "(nada muda no JSON)", "", ""])
    return saida


def gravar_ad(r: dict, site: list[list], autorizacao: str, aprovado: bool, d0: dict, d1: dict, total: tuple) -> None:
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    rot = f"v{NOVA}" if aprovado else f"v{NOVA} simulada"
    resumo = [("Tarefa", TAREFA, ""),
              ("Pedido", "R-20261127-192108-alexandre (item 18) e R-20261127-200014-alexandre (item 4)", ""),
              ("Autorização", autorizacao, ""), ("Base de partida", f"v{ANTERIOR} (sha256 {sha(versao(ANTERIOR))})", ""),
              ("Numeração das linhas", f"a da v{ANTERIOR} (nenhuma linha entra nem sai)", ""),
              ("Códigos olhados", len(CODIGOS), ", ".join(CODIGOS)),
              ("Células trocadas (PRODUTOS)", sum(x[1] == "PRODUTOS" for x in CELULAS), "BIE20014"),
              ("Células trocadas (VEICULOS)", sum(x[1] == "VEICULOS" for x in CELULAS), "BIE20014, ROL84888"),
              ("Linhas no LOG_CORRECOES", len(r["log"]), "; ".join(f"{x[0]} {x[2]}" for x in r["log"])),
              ("Linhas no LEIA-ME", r["leia_n"], ""),
              ("TER552120 e VEL7520", "a base não muda", "a causa é o gerar_site.py (aba DO_SITE, web-site)"),
              ("Sem fonte (não mudam)", len(SEM_FONTE), ", ".join(dict.fromkeys(x[0] for x in SEM_FONTE))),
              ("É do site (web-site; a base não muda)", len(DO_SITE), ", ".join(dict.fromkeys(x[0] for x in DO_SITE))),
              ("Pontos para o Alexandre", len(PONTOS),
               "aprovada a opção a) de todos" if aprovado else "a simulação mostra a opção a) de todos"),
              (f"Células com a marca da revisão da P12, PRODUTOS (v{ANTERIOR} -> v{NOVA})", d0["PRODUTOS"], d1["PRODUTOS"]),
              (f"Células com a marca da revisão da P12, VEICULOS (v{ANTERIOR} -> v{NOVA})", d0["VEICULOS"], d1["VEICULOS"]),
              (f"Produtos no site (gerar_site do main, v{ANTERIOR} -> {rot})", total[0], total[1])]
    aba(wb, "RESUMO", ["ITEM", "VALOR / ANTES", "DEPOIS / OBS"], resumo)
    aba(wb, "MUDANCAS", ["CODIGO_BAP", "ABA", f"LINHA (v{ANTERIOR})", "COLUNA", "ANTES", "DEPOIS", "FONTE", "PONTO",
                         f"VEICULO (v{ANTERIOR})"],
        [[cod, nome, n, col, fmt(antes), fmt(depois), fonte, ponto, quem]
         for cod, nome, n, col, antes, depois, fonte, ponto, quem in r["mud"]])
    aba(wb, "SEM_FONTE", ["CODIGO_BAP", "O QUE", "POR QUE NÃO MUDA", "O QUE FALTA"], SEM_FONTE)
    aba(wb, "DO_SITE", ["CODIGO_BAP", "O QUE SE VÊ NA TELA", "CAUSA (por que não é a base)", "O QUE MUDARIA (web-site)"],
        DO_SITE)
    aba(wb, "PONTOS_ALEXANDRE", ["PONTO", "CODIGO_BAP", "PERGUNTA", "OPÇÃO a", "OPÇÃO b"], PONTOS)
    aba(wb, "EFEITO_SITE", ["CODIGO_BAP", "CAMPO DO JSON", f"ANTES (v{ANTERIOR})", f"DEPOIS ({rot})"], site)
    sem_interno(wb)
    SAIDA.mkdir(parents=True, exist_ok=True)
    wb.save(AD)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--autorizacao", default=AUTORIZACAO, help="o recado do aprovado (padrão: pendente)")
    ap.add_argument("--refazer", action="store_true", help=f"depois do aprovado: grava a base e a v{NOVA}")
    ap.add_argument("--json", help="pasta onde ficam os JSON do site da v31 e da simulada (para os prints)")
    arg = ap.parse_args()
    aprovado = arg.autorizacao != AUTORIZACAO
    if aprovado != arg.refazer:
        raise SystemExit("[PARADO] --refazer e --autorizacao 'R-…' vão juntos (sem os dois: simulação)")
    if aprovado and not re.fullmatch(r"R-\d{8}-\d{6}-[a-z-]+", limpo(arg.autorizacao)):
        raise SystemExit(f"[PARADO] recado fora do padrão: {arg.autorizacao}")
    autorizacao = f"aprovado em {limpo(arg.autorizacao)}" if aprovado else AUTORIZACAO
    if arg.refazer:
        refazer(ANTERIOR, NOVA)
    if versao(NOVA).exists():
        raise SystemExit(f"[PARADO] a v{NOVA} já existe em dados/versoes")
    sha_antes = sha(BASE)
    if sha_antes != sha(versao(ANTERIOR)):
        raise SystemExit(f"[PARADO] a base de hoje não é a v{ANTERIOR}")

    wb = openpyxl.load_workbook(BASE)
    r = montar(wb, autorizacao)
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / BASE.name
        wb.save(p)
        dif, d0, d1 = conferir(p, wb, r)
        parar(dif)
        if sha(BASE) != sha_antes:
            parar(["a base mudou durante a montagem"])
        pastas = (Path(arg.json) / f"v{ANTERIOR}", Path(arg.json) / f"v{NOVA}") if arg.json else \
            (Path(tmp) / f"gs{ANTERIOR}", Path(tmp) / f"gs{NOVA}")
        g0 = gerar_site_copia(versao(ANTERIOR), pastas[0])
        g1 = gerar_site_copia(p, pastas[1])
        gravar_ad(r, efeito_site(g0, g1), autorizacao, aprovado, d0, d1, (g0["total"], g1["total"]))
        if aprovado:
            gravar(p, versao(NOVA))
        else:
            SIM.write_bytes(p.read_bytes())
            print(f"  {SIM.relative_to(RAIZ)}: sha256 {sha(SIM)}")
    print(f"  {AD.relative_to(RAIZ)}")
    print(f"  PRODUTOS e VEICULOS: {len(CELULAS)} células; LOG_CORRECOES +{len(r['log'])}; LEIA-ME +{r['leia_n']}; "
          f"duvidoso {d0} -> {d1}; site {g0['total']} -> {g1['total']}")
    print(f"  autorização: {autorizacao}; sha256 da base (v{ANTERIOR}) antes: {sha_antes}; agora: {sha(BASE)}")


if __name__ == "__main__":
    main()
