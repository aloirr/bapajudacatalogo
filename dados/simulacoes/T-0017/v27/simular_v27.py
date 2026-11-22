"""T-0017 v27 (SIMULAÇÃO; este script só lê a base): SCE14002, SISTEMA dos rolamentos, TER55227 e TER5597056.

Pedido: R-20261121-210229-po (a v27 do SCE14002, com o RD-0284, e, na mesma v27, o SISTEMA dos 194 rolamentos e os
textos do TER55227 e do TER5597056) e R-20261121-200058-alexandre, item 4 (o SISTEMA dos rolamentos gravado na base,
numa v27, com simulação). Nada é gravado em dados/BASE_*, em dados/versoes/ nem em site/.

1. SCE14002, APLICACAO: o texto do R-20261121-210229-po ("LS1941" com espaço, sem o "Servo Embreagem MB" do começo,
   as linhas LS em ordem).
2. SISTEMA dos rolamentos (PRODUTO = "Rolamentos", hoje todos RODAGEM): o sistema que o site e o PDF já leem do texto
   (gerar_site.sistemas_de, carregado do scripts/gerar_site.py, sem cópia). Com um sistema só, ele vai para a base.
   Com mais de um, a pergunta 2 do LEIA.md. O nome do sistema de câmbio e diferencial é a pergunta 1.
3. TER55227 e TER5597056, APLICACAO: o ano junto do veículo e a posição como detalhe dele (o que o "Outros veículos e
   detalhes" do site mostrava torto, recados/anexos/T-0018/sim-b-site/outros-veiculos.csv).
6. Embreagens pesadas, DETALHE_CATALOGO (RD-0293): a composição do kit dita duas vezes ("plato/disco/mancal · c/
   platô, disco, rol. e mancal"); fica a forma completa. No PDF, a repetição é montada pelo gerador (detalhe.essencial),
   corrigida pelo catalogo-grafico; aqui é só o campo da base, que o site mostra na ficha.
4. CIL8546: só confere (a VEICULOS da v26 está certa; nada muda).

Monta a base como ficaria (pasta temporária), confere com o base_comum.comparar que só mudam as células desta tarefa,
roda o scripts/gerar_site.py numa cópia (v26 e simulada) e confere que o "Leve também" (site e PDF) fica igual.
Escreve SIMULACAO_v27_T-0017.xlsx e numeros_v27.json.

Uso, na raiz do repositório:
    python3 -I dados/simulacoes/T-0017/v27/simular_v27.py dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v26.xlsx \
        dados/simulacoes/T-0017/v27
"""
import collections
import importlib.util
import json
import re
import sys
import tempfile
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font

RAIZ = Path(__file__).resolve().parents[4]
sys.path[:0] = [str(RAIZ / "dados" / "scripts")]
from base_comum import (CAB_LOG, CAB_VEICULOS, comparar, conferir_cabecalho, contar_duvidoso,  # noqa: E402
                        gerar_site_copia, limpo, linhas_por_codigo, sha, versao)

_spec = importlib.util.spec_from_file_location("gerar_site", RAIZ / "scripts" / "gerar_site.py")
G = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(G)

TAREFA, DATA = "T-0017", "22/11/2026"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "ANTES", "DEPOIS", "ITEM", "FONTE"]

# 1. SCE14002 (R-20261121-210229-po, item 1, literal)
SCE_HOJE = "Servo Embreagem MB LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS1941 VW 16210 17240 1730 · 111693"
SCE_DEPOIS = "LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS 1941 · VW 16210 17240 1730 · 111693"
FONTE_SCE = ("Texto do R-20261121-210229-po, item 1 (fecha o RD-0284): 'LS1941' com espaço, sem o 'Servo Embreagem MB' "
             "do começo (o nome do produto e a marca já estão na DESCRICAO, no PRODUTO e na VEICULOS), linhas LS em ordem.")

# 3. Textos dos terminais (só a célula pedida; os veículos, os anos e as posições são os do texto de hoje)
LISTA_CARGO = ("FORD/VW - 1113 Cargo / 1117 Cargo / 12-140 / 1215 Cargo / 1218 Cargo / 1313 Cargo / 1317 Cargo / "
               "14-150 / 14-220 / 1415 Cargo / 1418 Cargo / 1420 Cargo / 1422 Cargo / 1519 Cargo / 1521 Cargo / 16-170 / "
               "16-220 / 1615 Cargo / 1617 Cargo / 1618 Cargo / 1621 Cargo / 1622 Cargo / 1623 Cargo / 1624 Cargo / "
               "1729 Cargo / 2218 Cargo / 2319 Cargo / 2321 Cargo / 2322 Cargo / 2334 Cargo / 3021 Cargo / 3224 Cargo / "
               "B1618 / B1621")
TER227_HOJE = LISTA_CARGO + " · 01/1970–06/2012 Tractor · Diant."
TER227_DEPOIS = LISTA_CARGO + " 01/1970–06/2012 · Tractor · Diant."
FONTE_TER227 = ("Apontado na simulação do B11 (recados/anexos/T-0018/sim-b-site/outros-veiculos.csv): o site lia "
                "'01/1970–06/2012 Tractor' como outro veículo, com o 'Diant.' de detalhe. O ano volta para junto da "
                "lista (como a VEICULOS já tem: Cargo 1970–2012) e 'Tractor' e 'Diant.' viram detalhes dela.")
TER056_HOJE = ("AUDI - Q7 · Diant Esq / Porsche Cayenne · Diant Esq / Volkswagen Amarok · Diant Dir / Volkswagen Touareg "
               "Diant Esq / 01/2010–12/2019")
TER056_DEPOIS = {   # pergunta 3: a) o ano em cada veículo (como a VEICULOS); b) o ano só no Touareg, como o texto de hoje
    "a": ("AUDI - Q7 2010–2019 · Diant. Esq. ; PORSCHE - Cayenne 2010–2019 · Diant. Esq. ; VW - Amarok 2010–2019 · "
          "Diant. Dir. ; VW - Touareg 2010–2019 · Diant. Esq."),
    "b": ("AUDI - Q7 · Diant. Esq. ; PORSCHE - Cayenne · Diant. Esq. ; VW - Amarok · Diant. Dir. ; VW - Touareg "
          "01/2010–12/2019 · Diant. Esq."),
}
FONTE_TER056 = ("Apontado na simulação do B11 (recados/anexos/T-0018/sim-b-site/LEIA-ME.md): o site lia 'Diant Esq / "
                "Porsche Cayenne' como detalhe do Q7. Um bloco por veículo (' ; '), com a marca no começo, e a posição "
                "como detalhe; 'Diant Dir' do Amarok fica como está no texto (pergunta 4).")
# 6. Embreagens (RD-0293): o pedaço curto antes da forma completa sai; o resto da célula não muda
EMB_RX = re.compile(r"\s+plato/disco[/ ]mancal(?= · c/ platô, disco, rol\. e mancal)")
EMB_ESPERADOS = 13
FONTE_EMB = ("RD-0293 (docs/qualidade/redundancias/T-0019.md, 1fbb29c): a composição do kit estava dita duas vezes; fica "
             "a forma completa 'c/ platô, disco, rol. e mancal'. O resto da célula não muda.")
CIL_TEXTO = "VW / Ford / Seat | Parati, Quantum, Santana, Saveiro / Royale, Versailles / Cordoba, Ibiza | 1983 a 2006"

# 2. Rolamentos: pergunta 1 (o nome do sistema de câmbio e diferencial) e pergunta 2 (rolamento com mais de um uso)
CAMBIO = "CÂMBIO E DIFERENCIAL"
NOME_CAMBIO = {"a": CAMBIO, "b": "TRANSMISSÃO"}
RECOMENDADO = {"p1": "b", "p2": "a", "p3": "a", "p6": "a"}
FONTE_ROL = ("Pedido: R-20261121-200058-alexandre, item 4 (o SISTEMA dos rolamentos gravado na base). O sistema é o que o "
             "site e o PDF já leem do texto (gerar_site.sistemas_de: DESCRICAO, DETALHE_CATALOGO e a POSICAO dos "
             "DADOS_ADICIONAIS).")


def primeiro_citado(t: str) -> str:
    """O sistema do uso citado primeiro no texto (o mesmo texto e as mesmas expressões do gerar_site.sistemas_de)."""
    achados = [(m.start(), nome) for rx, nome in G.ROL_SISTEMAS for m in [rx.search(t)] if m]
    return min(achados)[1]


def sistema_proposto(lidos: list[str], texto: str, hoje: str, p1: str, p2: str) -> str:
    """O SISTEMA gravado: o único lido; com mais de um, o 1º citado (p2 = a) ou o de hoje (p2 = b)."""
    nomes = sorted({NOME_CAMBIO[p1] if s == CAMBIO else s for s in lidos})
    if len(nomes) == 1:
        return nomes[0]
    if p2 == "b":
        return hoje
    p = primeiro_citado(texto)
    return NOME_CAMBIO[p1] if p == CAMBIO else p


def leve_tambem(p: dict) -> list[str]:
    """Os sistemas do produto para o "Leve também" do site (o sistemasDe do site/app.js: ss, senão si)."""
    return p.get("ss") or ([str(p["si"]).upper()] if p.get("si") else [])


def main(base, saida):
    base, saida = Path(base), Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    assert sha(base) == sha(versao(26)), "[PARADO] a base não é a v26: refaça a simulação a partir dela"
    wb = openpyxl.load_workbook(base)
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    conferir_cabecalho(wv, CAB_VEICULOS)
    cp = [limpo(c.value) for c in wp[1]]
    col = {k: cp.index(k) + 1 for k in cp}
    linha_de = linhas_por_codigo(wp)
    duv_antes = contar_duvidoso(wb)
    ult_log = wb["LOG_CORRECOES"].max_row

    def uma(cod):
        (n,) = linha_de[cod]
        return n

    def val(n, k):
        return limpo(wp.cell(n, col[k]).value)

    mud = []        # [CODIGO, ABA, LINHA, COLUNA, ANTES, DEPOIS, ITEM, FONTE]

    # --- 1 e 3: APLICACAO
    for cod, hoje, depois, item, fonte in (("SCE14002", SCE_HOJE, SCE_DEPOIS, "1", FONTE_SCE),
                                           ("TER55227", TER227_HOJE, TER227_DEPOIS, "3", FONTE_TER227),
                                           ("TER5597056", TER056_HOJE, TER056_DEPOIS[RECOMENDADO["p3"]], "3",
                                            FONTE_TER056)):
        n = uma(cod)
        assert wp.cell(n, col["APLICACAO"]).value == hoje, (cod, wp.cell(n, col["APLICACAO"]).value)
        mud.append([cod, "PRODUTOS", n, "APLICACAO", hoje, depois, item, fonte])

    # --- 2: SISTEMA dos rolamentos
    rol, combos = [], collections.Counter()
    for n in range(2, wp.max_row + 1):
        if val(n, "PRODUTO") != "Rolamentos":
            continue
        hoje = val(n, "SISTEMA")
        posicao = dict(G.pares_de(val(n, "DADOS_ADICIONAIS"))).get("POSICAO", "")
        lidos = G.sistemas_de(val(n, "PRODUTO"), hoje, val(n, "DESCRICAO"), val(n, "DETALHE_CATALOGO"), posicao)
        texto = G.sem_acento(" | ".join(x for x in (val(n, "DESCRICAO"), val(n, "DETALHE_CATALOGO"), posicao) if x)).upper()
        opc = {f"{p1}{p2}": sistema_proposto(lidos, texto, hoje, p1, p2) for p1 in "ab" for p2 in "ab"}
        for k, v in opc.items():
            combos[(k, v)] += v != hoje
        rol.append([limpo(wp.cell(n, 1).value), n, hoje, " + ".join(lidos), val(n, "DESCRICAO"),
                    val(n, "DETALHE_CATALOGO"), posicao, opc])
    assert len(rol) == 194 and {r[2] for r in rol} == {"RODAGEM"}, (len(rol), {r[2] for r in rol})
    rec = RECOMENDADO["p1"] + RECOMENDADO["p2"]
    for cod, n, hoje, lidos, *_, opc in rol:
        if opc[rec] != hoje:
            mud.append([cod, "PRODUTOS", n, "SISTEMA", hoje, opc[rec], "2",
                        f"Lido do texto: {lidos}. " + FONTE_ROL])

    # --- 6: DETALHE_CATALOGO das embreagens (RD-0293)
    n_emb = 0
    for n in range(2, wp.max_row + 1):
        det = wp.cell(n, col["DETALHE_CATALOGO"]).value
        if isinstance(det, str) and EMB_RX.search(det):
            mud.append([limpo(wp.cell(n, 1).value), "PRODUTOS", n, "DETALHE_CATALOGO", det, EMB_RX.sub("", det), "6",
                        FONTE_EMB])
            n_emb += 1
    assert n_emb == EMB_ESPERADOS, n_emb

    # --- 4: CIL8546 (só conferir)
    assert CIL_TEXTO in wp.cell(uma("CIL8546"), col["APLICACAO"]).value
    cil = {r[2]: (r[4], r[5], r[7]) for r in wv.iter_rows(min_row=2, values_only=True) if r[0] == "CIL8546"
           and r[2] in ("Parati", "Santana")}
    assert cil == {"Parati": (1983, 2006, "separado"), "Santana": (1983, 2006, "separado")}, cil

    # --- a base como ficaria (pasta temporária) e a conferência célula a célula com a v26
    for x in mud:
        wp.cell(x[2], col[x[3]]).value = x[5]
    duv_depois = contar_duvidoso(wb)
    celulas = {"PRODUTOS": {(x[2], col[x[3]]) for x in mud}}
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        sim = tmp / "BASE_v27_SIMULADA.xlsx"
        wb.save(sim)
        dif = comparar(sim, versao(26), celulas, ult_log, "v26")
        assert not dif, dif
        antes, depois = gerar_site_copia(base, tmp / "v26"), gerar_site_copia(sim, tmp / "v27")
    assert set(antes["produtos"]) == set(depois["produtos"]), "[PARADO] produto entrou ou saiu do site"
    assert antes["sc"] == depois["sc"]
    site, lt_muda = [], []
    for c in antes["produtos"]:
        a, d = antes["produtos"][c], depois["produtos"][c]
        for k in sorted(set(a) | set(d)):
            if a.get(k) != d.get(k):
                site.append([c, k, json.dumps(a.get(k), ensure_ascii=False), json.dumps(d.get(k), ensure_ascii=False)])
        if leve_tambem(a) != leve_tambem(d):
            lt_muda.append(c)
    # PDF: os sistemas do item pelo G.sistemas_de, com os campos da base (como o oferta.py do catalogo-grafico), nas 4
    # combinações das perguntas 1 e 2 (a pergunta 3 não mexe em sistema)
    pdf_muda = {}
    for k in ("aa", "ab", "ba", "bb"):
        pdf_muda[k] = [cod for cod, n, hoje, lidos, d, de, pos, opc in rol
                       if G.sistemas_de("Rolamentos", hoje, d, de, pos) != G.sistemas_de("Rolamentos", opc[k], d, de, pos)]
    si = lambda js: collections.Counter(p.get("si") for p in js["produtos"].values())  # noqa: E731
    si_antes, si_depois = si(antes), si(depois)
    ss_antes = sum("ss" in p for p in antes["produtos"].values())
    ss_depois = sum("ss" in p for p in depois["produtos"].values())

    log = [["CORRECAO_" + x[3], x[1], x[0], None,
            f"{x[3]}: '{x[4]}' -> '{x[5]}' (item {x[6]}). Simulação em dados/simulacoes/T-0017/v27/. {TAREFA} (v27), {DATA}"]
           for x in mud]

    por_valor = {k: dict(sorted(collections.Counter(opc[k] for *_, opc in rol if opc[k] != "RODAGEM").items()))
                 for k in ("aa", "ab", "ba", "bb")}
    num = {"base_sha256": sha(base), "recomendado": RECOMENDADO,
           "rolamentos": len(rol),
           "rolamentos_leitura_do_texto": dict(collections.Counter(r[3] for r in rol).most_common()),
           "rolamentos_com_um_sistema_lido": sum(" + " not in r[3] for r in rol),
           "rolamentos_com_mais_de_um_sistema_lido": sum(" + " in r[3] for r in rol),
           "rolamentos_que_mudam_por_combinacao": {k: sum(opc[k] != "RODAGEM" for *_, opc in rol)
                                                    for k in ("aa", "ab", "ba", "bb")},
           "rolamentos_sistema_novo_por_combinacao": por_valor,
           "celulas_produtos": dict(collections.Counter(x[3] for x in mud)),
           "celulas_total": len(mud), "codigos_mudados": len({x[0] for x in mud}), "log_previsto": len(log),
           "celulas_com_duvidoso_antes": duv_antes, "celulas_com_duvidoso_depois": duv_depois,
           "site_produtos": depois["total"], "site_produtos_que_mudam": len({x[0] for x in site}),
           "site_chaves_que_mudam": dict(collections.Counter(x[1] for x in site)),
           "site_si_antes": dict(si_antes), "site_si_depois": dict(si_depois),
           "site_ss_antes": ss_antes, "site_ss_depois": ss_depois,
           "leve_tambem_site_produtos_que_mudam": len(lt_muda),
           "leve_tambem_pdf_itens_que_mudam_por_combinacao": {k: len(v) for k, v in pdf_muda.items()}}
    assert not lt_muda and not any(pdf_muda.values()), (lt_muda, pdf_muda)
    assert duv_antes == duv_depois

    out = openpyxl.Workbook()
    le = out.active
    le.title = "LEIA"
    for t in [f"T-0017 · v27 da base unificada: SIMULAÇÃO (nada gravado). Base de partida: v26 (sha256 "
              f"{num['base_sha256'][:8]}…{num['base_sha256'][-4:]}). As perguntas e as contagens estão no LEIA.md.",
              f"ANTES_DEPOIS: {len(mud)} células da PRODUTOS ({num['celulas_produtos']}), com a recomendação "
              f"(perguntas 1 '{RECOMENDADO['p1']}', 2 '{RECOMENDADO['p2']}', 3 '{RECOMENDADO['p3']}' e 6 "
              f"'{RECOMENDADO['p6']}').",
              "ROLAMENTOS: os que mudam em alguma resposta das perguntas 1 e 2, com o sistema lido do texto e o SISTEMA "
              "proposto em cada resposta (os outros ficam RODAGEM em todas).",
              "TER5597056_OPCOES: o texto em cada resposta da pergunta 3.",
              "SITE: cada chave do produtos.json que muda (gerar_site rodado numa cópia, com a recomendação).",
              "LOG_CORRECOES_PREVISTO: uma linha por célula. Nenhuma linha nova na VEICULOS; mesmas abas e colunas."]:
        le.append([t])
    combos_cab = ["SE 1a 2a", "SE 1a 2b", "SE 1b 2a", "SE 1b 2b"]
    abas = {"ANTES_DEPOIS": (CAB, mud),
            "ROLAMENTOS": (["CODIGO_BAP", "LINHA", "SISTEMA HOJE", "LIDO DO TEXTO (site e PDF)", "DESCRICAO",
                            "DETALHE_CATALOGO", "POSICAO (DADOS_ADICIONAIS)"] + combos_cab,
                           [r[:7] + [r[7][k] for k in ("aa", "ab", "ba", "bb")] for r in rol
                            if any(v != r[2] for v in r[7].values())]),
            "TER5597056_OPCOES": (["RESPOSTA", "APLICACAO"], [["hoje", TER056_HOJE]] +
                                  [[k, v] for k, v in TER056_DEPOIS.items()]),
            "SITE": (["CODIGO_BAP", "CHAVE", "ANTES (v26)", "DEPOIS (v27 simulada)"], site),
            "LOG_CORRECOES_PREVISTO": (CAB_LOG, log)}
    for nome, (cab, linhas) in abas.items():
        s = out.create_sheet(nome)
        s.append(cab)
        for x in linhas:
            s.append(x)
        for c in s[1]:
            c.font = Font(bold=True)
        s.freeze_panes = "A2"
        for coluna in s.columns:
            s.column_dimensions[coluna[0].column_letter].width = min(max(10, max(len(str(x.value or ""))
                                                                                 for x in coluna[:200]) + 2), 70)
        for row in s.iter_rows(min_row=2):
            for x in row:
                x.alignment = Alignment(vertical="top", wrap_text=True)
    out.save(saida / "SIMULACAO_v27_T-0017.xlsx")
    json.dump(num, open(saida / "numeros_v27.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(num, ensure_ascii=False, indent=1))
    print("gerar_site (v26):", antes["log"].replace("\n", " | "))
    print("gerar_site (v27):", depois["log"].replace("\n", " | "))


if __name__ == "__main__":
    main(*sys.argv[1:3])
