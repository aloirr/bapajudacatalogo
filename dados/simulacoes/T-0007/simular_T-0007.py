"""T-0007 (Terminal Axial com código só de número e Cruzetas) + T-0009 (TER556556): SÓ SIMULAÇÃO.

Lê a base unificada (sem gravar nada nela) e gera:
- dados/simulacoes/T-0007/Simulacao_T-0007_Terminal_Axial.xlsx (antes e depois, resumo, LOG_CORRECOES, T-0009);
- uma CÓPIA da base com a simulação aplicada, no diretório passado em --copia (fora do repositório),
  para medir o efeito no produtos.json com uma cópia do gerar_site.py.

Uso: python3 dados/simulacoes/T-0007/simular_T-0007.py --copia <dir_temporario>
"""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

RAIZ = Path(__file__).resolve().parents[3]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
SAIDA = Path(__file__).resolve().parent / "Simulacao_T-0007_Terminal_Axial.xlsx"
DATA = "20/11/2026"  # [SUPOSIÇÃO] na gravação de verdade, vale a data do "aprovado"

# Cabeçalho da planilha de origem colado no começo da REFERENCIAS_CRUZADAS (padrão genérico; acha os 152)
CABECALHO = re.compile(r"^CADASTRO MASTER TERMINAL AXIAL .*?BAPTA PN: (?P<tax>\S+), .*?REFERENCIAS CRUZADAS - (?P<refs>.*)$")

# Extras aprovados pelo Alexandre (R-20261120-095221-alexandre, 2a): entram na v15 junto com a T-0007
EXTRA = "EXTRA APROVADO (R-20261120-095221-alexandre, 2a)"
# TAX10116: a aplicação perdeu os modelos 206 e 207 na padronização
EXTRAS = {"TAX10116": ("APLICACAO", "206 2001–2009 · 207 2008–2013 · Hoggar 2010>")}

# Cruzetas (R-20261120-094416-alexandre, 3a): linhas da tabela de aplicação do CRU100 importadas como produto.
# código na base -> (o que é, código que já tem o dado)
CRUZETAS = {
    "Veículo": "Linha de título da tabela de aplicação do CRU100 (Veículo, Modelo, Ano, Tração, Motor, Observações, "
               "Cardan). Não é produto.",
    "HYUNDAI": "Linha da tabela de aplicação do CRU100: Hyundai HR, 04/07 a 12/17, 4x2, 2.5, ref. HYUNDAI 491404A500. "
               "O CRU100 já cita a Hyundai HR.",
    "KIA MOTORS": "Linha da tabela de aplicação do CRU100: Kia Bongo K2500. O CRU100 já cita a Kia Bongo 2500.",
}
REF_CRU100 = "HYUNDAI: 491404A500"  # extra aprovado: referência original que só está na linha HYUNDAI


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def norm(s: str) -> str:
    return re.sub(r"[\s.\-/]", "", s.upper())


def refs(texto: str) -> list[tuple[str, str]]:
    saida = []
    for p in re.split(r",\s*", texto or ""):
        p = p.strip()
        if not p:
            continue
        m = re.match(r"^([^:]+):\s*(.*)$", p)
        saida.append((m.group(1).strip(), m.group(2).strip()) if m else ("", p))
    return saida


def ler():
    wb = openpyxl.load_workbook(BASE, read_only=True, data_only=True)
    linhas = list(wb["PRODUTOS"].iter_rows(values_only=True))
    cab = [limpo(c) for c in linhas[0]]
    dados = [dict(zip(cab, r), _linha=i + 2) for i, r in enumerate(linhas[1:])]
    return cab, dados


def analisar(dados):
    por = {limpo(d["CODIGO_BAP"]): d for d in dados}
    num = sorted((d for d in dados if limpo(d["CODIGO_BAP"]).isdigit()), key=lambda d: int(d["CODIGO_BAP"]))
    usados_tax, usados_cub, itens = {}, {}, []
    for d in num:
        cod = limpo(d["CODIGO_BAP"])
        ref = limpo(d["REFERENCIAS_CRUZADAS"])
        m = CABECALHO.match(ref)
        cub = re.search(r"\bBAP: (CUB\d+)", limpo(d["DADOS_ADICIONAIS"]))
        cub = cub.group(1) if cub else ""
        tax = m.group("tax") if m else ""
        T, C = por.get(tax), por.get(cub)
        lista = refs(m.group("refs") if m else ref)
        no_tax = no_cub = vazias = 0
        faltam = []
        for marca, c in lista:
            if c in ("", "-", "0"):
                vazias += 1
                continue
            if T is not None and norm(c) in norm(limpo(T["REFERENCIAS_CRUZADAS"])):
                no_tax += 1
            elif C is not None and norm(c) in norm(limpo(C["REFERENCIAS_CRUZADAS"])):
                no_cub += 1
            else:
                faltam.append(f"{marca}: {c}")
        bc = re.search(r"CODIGO_BARRAS: (\d+)", limpo(d["DADOS_ADICIONAIS"]))
        bc_tax = re.search(r"CODIGO_BARRAS: (\d+)", limpo(T["DADOS_ADICIONAIS"])) if T is not None else None
        if T is not None:
            destino, par = "A", tax
            motivo = (f"Duplicata do {tax}: o cabeçalho do cadastro master aponta o {tax} (BAPTA PN), o código de "
                      f"barras é o mesmo e as referências da parte do terminal já estão no {tax}.")
            if cub:
                motivo += (f" A linha também traz um cubo de roda juntado por engano ({cub}): a 2ª parte da "
                           f"descrição e da aplicação, a POSICAO e as refs NAKATA NKF/IMA são do {cub}, que já as tem.")
            usados_tax.setdefault(tax, []).append(cod)
        elif C is not None and not m:
            destino, par = "C", cub
            motivo = (f"Não é terminal axial: é o cubo de roda {cub} (sem cabeçalho do cadastro master). Mesma "
                      f"descrição, aplicação e referências do {cub}. Sai do site como duplicata do {cub}.")
        else:
            destino, par = "B", ""
            motivo = "Sem TAX correspondente: fica no site, só sai o texto de cabeçalho da referência."
        if cub:
            usados_cub.setdefault(cub, []).append(cod)
        itens.append({
            "cod": cod, "linha": d["_linha"], "d": d, "destino": destino, "par": par, "tax": tax, "cub": cub,
            "motivo": motivo, "no_tax": no_tax, "no_cub": no_cub, "vazias": vazias, "faltam": faltam,
            "bc_igual": ("SIM" if bc and bc_tax and bc.group(1) == bc_tax.group(1) else ("—" if not bc else "NÃO")),
            "tax_site": (limpo(T["NO_CATALOGO_DIGITAL"]) if T is not None else ""),
            "cub_site": (limpo(C["NO_CATALOGO_DIGITAL"]) if C is not None else ""),
        })
    repetidos = {k: v for k, v in {**usados_tax, **usados_cub}.items() if len(v) > 1}
    return por, itens, repetidos


def mudancas(itens, por):
    """[(codigo, coluna, antes, depois, tarefa, destino, motivo)] — só as células que mudam."""
    out = []
    for it in itens:
        if it["destino"] in ("A", "C"):
            out.append((it["cod"], "NO_CATALOGO_DIGITAL", limpo(it["d"]["NO_CATALOGO_DIGITAL"]), "NÃO", "T-0007",
                        it["destino"], it["motivo"]))
        elif it["destino"] == "B":
            ref = limpo(it["d"]["REFERENCIAS_CRUZADAS"])
            m = CABECALHO.match(ref)
            out.append((it["cod"], "REFERENCIAS_CRUZADAS", ref, m.group("refs") if m else ref, "T-0007", "B",
                        it["motivo"]))
        for faltou in it["faltam"]:  # referência boa que falta no par: acrescenta no fim (nada é tirado)
            alvo = it["par"]
            antes = limpo(por[alvo]["REFERENCIAS_CRUZADAS"])
            out.append((alvo, "REFERENCIAS_CRUZADAS", antes, f"{antes}; {faltou}", "T-0007", it["destino"],
                        f"Referência {faltou} do código {it['cod']} que faltava no {alvo}"))
    for cod, motivo in CRUZETAS.items():
        d = por[cod]
        out.append((cod, "NO_CATALOGO_DIGITAL", limpo(d["NO_CATALOGO_DIGITAL"]), "NÃO", "T-0007 (Cruzetas)",
                    "CRUZETAS", motivo + " Sai do site como linha de tabela do CRU100; a linha fica na base."))
    antes = limpo(por["CRU100"]["REFERENCIAS_CRUZADAS"])
    assert "491404A500" not in antes
    out.append(("CRU100", "REFERENCIAS_CRUZADAS", antes, f"{antes}; {REF_CRU100}", "T-0007 (Cruzetas)",
                EXTRA, "A referência original HYUNDAI 491404A500 só está na linha HYUNDAI (DADOS_ADICIONAIS), "
                "que sai do site; acrescentada no fim das referências do CRU100. " + EXTRA + "."))
    for cod, (col, depois) in EXTRAS.items():
        out.append((cod, col, limpo(por[cod][col]), depois, "T-0007", EXTRA,
                    "Conferência do código 18: a aplicação da linha importada diz '206 2001/2009; 207 2008/2013; "
                    "Hoggar 2010/...' e a do TAX10116 perdeu os modelos 206 e 207 na padronização. " + EXTRA + "."))
    t = por["TER556556"]
    out.append(("TER556556", "APLICACAO", "texto de preço, R$ nnn.nn+ Detalhes", "", "T-0009", "T-0009",
                "Não é aplicação: é preço copiado da origem (CATALOGO_BAP_AGENTE_PRONTO.xlsx). Nenhuma outra fonte "
                "da base (abas e versões v8 a v14) tem a aplicação do TER556556: o campo fica vazio."))
    assert "R$" in limpo(t["APLICACAO"])
    return out


def log_de(m):
    cod, col, antes, depois, tarefa, destino, motivo = m
    if tarefa == "T-0009":
        return ("APLICACAO_LIMPA", "PRODUTOS", cod, "T-0009",
                f'APLICACAO: texto de preço ("R$ ...+ Detalhes") -> vazio. Não é aplicação; sem outra fonte na '
                f"base. T-0009, {DATA}")
    if col == "NO_CATALOGO_DIGITAL" and destino == "CRUZETAS":
        return ("NO_CATALOGO_DIGITAL", "PRODUTOS", cod, "CRU100",
                f"NO_CATALOGO_DIGITAL SIM -> NÃO: linha da tabela de aplicação do CRU100 importada como produto "
                f"(PRODUTO Cruzetas); nenhum campo apagado. T-0007, {DATA}")
    if col == "REFERENCIAS_CRUZADAS" and cod == "CRU100":
        return ("REFERENCIA_ACRESCENTADA", "PRODUTOS", cod, "Linha HYUNDAI (tabela do CRU100)",
                f"{REF_CRU100} acrescentada no fim; nenhuma referência tirada. {EXTRA}. T-0007, {DATA}")
    if col == "NO_CATALOGO_DIGITAL":
        par = re.search(r"(TAX\d+|CUB\d+)", motivo).group(1)
        extra = re.search(r"\((CUB\d+)\)", motivo)
        junto = f"; cubo juntado na mesma linha = {extra.group(1)}" if extra else ""
        if par.startswith("CUB"):
            origem = ("linha importada da planilha de cubos de roda, com o número da linha no lugar do código; "
                      "não é terminal axial")
        else:
            origem = f"linha importada de planilha de origem, com o número da linha no lugar do código{junto}"
        return ("NO_CATALOGO_DIGITAL", "PRODUTOS", cod, par,
                f"NO_CATALOGO_DIGITAL SIM -> NÃO: duplicata do {par} ({origem}); referências já estão no {par}; "
                f"nenhum campo apagado. T-0007, {DATA}")
    if col == "REFERENCIAS_CRUZADAS" and destino == "B":
        return ("REFERENCIA_LIMPA", "PRODUTOS", cod, "Linha importada (planilha de origem)",
                f"REFERENCIAS_CRUZADAS: tirado o texto de cabeçalho da planilha de origem; referências mantidas. "
                f"T-0007, {DATA}")
    if col == "REFERENCIAS_CRUZADAS":
        return ("REFERENCIA_ACRESCENTADA", "PRODUTOS", cod, "Linha importada (planilha de origem)",
                f"{motivo}, acrescentada no fim; nenhuma referência tirada. T-0007, {DATA}")
    return ("APLICACAO_CORRIGIDA", "PRODUTOS", cod, "código 18, linha importada",
            f'APLICACAO "{antes}" -> "{depois}" (modelos 206 e 207 que a padronização tirou). {EXTRA}. '
            f"T-0007, {DATA}")


def estilo(ws, larguras):
    for i, w in enumerate(larguras, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F3864")
        c.alignment = Alignment(wrap_text=True, vertical="top")
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def planilha(itens, muds, repetidos, por):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "ANTES_DEPOIS"
    ws.append(["CODIGO", "LINHA_NA_BASE", "DESTINO", "CORRESPONDENTE", "COLUNA", "VALOR_ANTES", "VALOR_DEPOIS",
               "TAREFA", "MOTIVO"])
    linha_de = {it["cod"]: it["linha"] for it in itens}
    linha_de.update({c: por[c]["_linha"] for c, *_ in muds if c in por})
    par_de = {it["cod"]: it["par"] for it in itens}
    par_de.update({c: "CRU100" for c in CRUZETAS})
    for cod, col, antes, depois, tarefa, destino, motivo in muds:
        ws.append([cod, linha_de.get(cod), destino, par_de.get(cod, ""), col, antes, depois, tarefa, motivo])
    estilo(ws, [11, 9, 10, 15, 22, 40, 40, 16, 90])

    ws = wb.create_sheet("CRUZETAS")
    ws.append(["CODIGO_BAP (na base)", "CODIGO NO SITE", "LINHA_NA_BASE", "DESCRICAO", "APLICACAO", "O QUE É",
               "DESTINO PROPOSTO", "COLUNA", "VALOR_ANTES", "VALOR_DEPOIS", "NO_SITE_DEPOIS"])
    for cod, motivo in CRUZETAS.items():
        d = por[cod]
        ws.append([cod, cod.upper(), d["_linha"], limpo(d["DESCRICAO"]), limpo(d["APLICACAO"]), motivo,
                   "Sai do site (NO_CATALOGO_DIGITAL = NÃO). A linha fica na base, com o que foi importado.",
                   "NO_CATALOGO_DIGITAL", limpo(d["NO_CATALOGO_DIGITAL"]), "NÃO", "NÃO"])
    c100 = por["CRU100"]
    ws.append(["CRU100", "CRU100", c100["_linha"], limpo(c100["DESCRICAO"]), limpo(c100["APLICACAO"]),
               "O produto de verdade da tabela (fica no site)", EXTRA + ": acrescentar a referência original",
               "REFERENCIAS_CRUZADAS", limpo(c100["REFERENCIAS_CRUZADAS"]),
               f'{limpo(c100["REFERENCIAS_CRUZADAS"])}; {REF_CRU100}', "SIM"])
    estilo(ws, [14, 12, 9, 12, 40, 60, 40, 20, 40, 45, 9])

    ws = wb.create_sheet("CONFERENCIA_154")
    ws.append(["CODIGO", "DESTINO", "TAX_CORRESPONDENTE", "CUB_JUNTADO", "DESCRICAO", "APLICACAO",
               "REFERENCIAS_CRUZADAS (texto original na base)", "REFS_JA_NO_TAX", "REFS_JA_NO_CUB", "REFS_VAZIAS",
               "REFS_QUE_FALTAM", "COD_BARRAS_IGUAL_AO_TAX", "TAX_NO_SITE", "CUB_NO_SITE", "NO_SITE_DEPOIS"])
    for it in itens:
        d = it["d"]
        ws.append([it["cod"], it["destino"], it["tax"], it["cub"], limpo(d["DESCRICAO"]), limpo(d["APLICACAO"]),
                   limpo(d["REFERENCIAS_CRUZADAS"]), it["no_tax"], it["no_cub"], it["vazias"],
                   ", ".join(it["faltam"]), it["bc_igual"], it["tax_site"], it["cub_site"],
                   "NÃO" if it["destino"] in ("A", "C") else "SIM"])
    estilo(ws, [9, 8, 12, 12, 26, 50, 60, 9, 9, 9, 18, 10, 8, 8, 9])

    ws = wb.create_sheet("RESUMO")
    from collections import Counter
    c = Counter(it["destino"] for it in itens)
    ws.append(["ITEM", "QTD", "O QUE ACONTECE"])
    ws.append(["Códigos só de número na aba PRODUTOS", len(itens), "Todos analisados (1 a 164; faltam 88, 101, 111, "
               "119, 135, 140, 146, 149, 151 e 163)"])
    ws.append(["A · duplicata de um TAX", c["A"], "NO_CATALOGO_DIGITAL SIM -> NÃO; as referências já estão no TAX"])
    ws.append(["   dos quais com cubo de roda juntado na mesma linha", sum(1 for i in itens if i["destino"] == "A"
               and i["cub"]), "A parte do cubo (2ª metade da descrição e da aplicação, POSICAO, NAKATA NKF, IMA) já "
               "está no CUB"])
    ws.append(["B · sem TAX (fica, só limpa o cabeçalho)", c["B"], "—"])
    ws.append(["C · não é terminal: duplicata de um CUB", c["C"], "NO_CATALOGO_DIGITAL SIM -> NÃO (códigos 74 e 83 = "
               "CUB60074 e CUB60084)"])
    ws.append(["Referências que faltavam no TAX ou no CUB", sum(len(i["faltam"]) for i in itens), "Nada a passar"])
    ws.append(["TAX ou CUB apontado por mais de um código", len(repetidos), ", ".join(repetidos) or "nenhum"])
    ws.append(["Cruzetas · linhas da tabela do CRU100 (Veículo, HYUNDAI, KIA MOTORS)", len(CRUZETAS),
               "NO_CATALOGO_DIGITAL SIM -> NÃO; as linhas ficam na base"])
    ws.append([EXTRA + " · TAX10116 (aplicação sem 206 e 207)", 1, "Volta a ter os modelos 206 e 207"])
    ws.append([EXTRA + " · CRU100 (referência HYUNDAI 491404A500)", 1, "Ganha a referência HYUNDAI 491404A500"])
    ws.append(["T-0009 · TER556556 (preço na APLICACAO)", 1, "APLICACAO -> vazio"])
    ws.append(["Células que mudam na base (total)", len(muds), "NO_CATALOGO_DIGITAL (154 + 3 Cruzetas), APLICACAO do "
               "TER556556 (1) e os 2 extras aprovados: APLICACAO do TAX10116 (1) e REFERENCIAS_CRUZADAS do CRU100 (1)"])
    ws.append(["Produtos no produtos.json", "4679 -> 4522", "-154 (Terminal Axial e cubos) -3 (Cruzetas); o "
               "TER556556 fica, sem a aplicação"])
    estilo(ws, [50, 8, 90])

    ws = wb.create_sheet("LOG_CORRECOES_PREVISTO")
    ws.append(["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"])
    for m in muds:
        ws.append(list(log_de(m)))
    estilo(ws, [24, 10, 20, 26, 120])

    ws = wb.create_sheet("T-0009_TER556556")
    t = por["TER556556"]
    ws.append(["CAMPO", "ANTES", "DEPOIS"])
    ws.append(["CODIGO_BAP", "TER556556", "TER556556"])
    ws.append(["APLICACAO", "texto de preço, R$ nnn.nn+ Detalhes", "(vazio)"])
    ws.append(["Outras colunas", "sem mudança", "sem mudança"])
    ws.append([])
    ws.append(["LOG_CORRECOES (linha prevista)", " | ".join(log_de(muds[-1])), ""])
    ws.append([])
    ws.append(["Ficha no produtos.json (chave)", "ANTES", "DEPOIS"])
    ficha = [("c", "TER556556", "TER556556"), ("d", limpo(t["DESCRICAO"]), limpo(t["DESCRICAO"])),
             ("a", "texto de preço, R$ nnn.nn+ Detalhes", "(a chave sai: aplicação vazia)"),
             ("r", '[{"m": "NAKATA PN", "c": "N6556, RT#: RLT84088"}]', "igual"),
             ("x", '[["Código de barras", "7908680405333"], ["Posição e lado", "DIR. / ESQ."]]', "igual"),
             ("p / ca / si / fa / li", " / ".join(limpo(t[k]) for k in ("PRODUTO", "CATEGORIA", "SISTEMA", "FAMILIA",
                                                                          "LINHA")), "igual"),
             ("la", limpo(t["LADO"]), "igual")]
    for f in ficha:
        ws.append(list(f))
    estilo(ws, [32, 60, 40])
    wb.save(SAIDA)


def copia_simulada(muds, destino: Path):
    destino.mkdir(parents=True, exist_ok=True)
    alvo = destino / BASE.name
    shutil.copy2(BASE, alvo)
    wb = openpyxl.load_workbook(alvo)
    ws = wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    col = {c: i + 1 for i, c in enumerate(cab)}
    linha = {limpo(ws.cell(r, 1).value): r for r in range(2, ws.max_row + 1)}
    for cod, coluna, antes, depois, *_ in muds:
        ws.cell(linha[cod], col[coluna]).value = depois or None
    wb.save(alvo)
    return alvo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--copia", required=True, help="diretório temporário (fora do repositório) para a cópia da base")
    a = ap.parse_args()
    copia = Path(a.copia).resolve()
    if copia == RAIZ.resolve() or RAIZ.resolve() in copia.parents:
        raise SystemExit(f"[PARADO] --copia dentro do repositório ({copia}): use um diretório temporário fora dele")
    _, dados = ler()
    por, itens, repetidos = analisar(dados)
    muds = mudancas(itens, por)
    planilha(itens, muds, repetidos, por)
    alvo = copia_simulada(muds, copia)
    from collections import Counter
    print("destinos:", dict(Counter(i["destino"] for i in itens)), "| repetidos:", repetidos,
          "| refs que faltam:", sum(len(i["faltam"]) for i in itens), "| células:", len(muds))
    print("planilha:", SAIDA)
    print("cópia simulada:", alvo)


if __name__ == "__main__":
    main()
