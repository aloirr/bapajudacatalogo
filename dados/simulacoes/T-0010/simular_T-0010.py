"""T-0010 · Pastilhas com dois códigos (PAFnnnn × PAF.nnnn): SÓ SIMULAÇÃO.

Regra do Alexandre (R-20261120-100733-alexandre): "É que internamente trocamos de fabricante. mas é o mesmo
produto. acredito que o melhor seja unificar aparecer os dois." Ou seja: um produto por par no site, na ficha do
PAFnnnn, com o código PAF.nnnn visível na ficha e achável na busca; o PAF.nnnn continua ATIVO na base.
PAF0116 (R-20261120-100937-alexandre, "2) a"): é dianteira e traseira e entra na unificação com os outros 102 pares.

Lê a base unificada e o site/data/produtos.json (sem gravar nada neles) e:
- confere os 103 pares, campo a campo, e classifica cada um (A duplicata, B produtos diferentes, C dúvida);
- grava dados/simulacoes/T-0010/Simulacao_T-0010_PAF.xlsx (PARES, ANTES_DEPOIS, RESUMO, LOG_CORRECOES_PREVISTO), só
  DEPOIS de todas as conferências (se uma falhar, a planilha não é gravada);
- grava no diretório de trabalho (fora do repositório) cópias da base com a simulação aplicada e roda uma CÓPIA
  do scripts/gerar_site.py em cada uma, para medir o efeito no produtos.json:
    * atual        -> a base de hoje, sem mudança (tem de dar o mesmo JSON do site, fora o gerado_em);
    * t0010        -> só a T-0010;
    * t0010_t0007  -> a T-0010 somada à saída do site da T-0007 (157 códigos com NO_CATALOGO_DIGITAL = NÃO);
- confere no JSON simulado: a ficha do PAFnnnn traz "BAP: PAF.nnnn" nas referências; nada dos DADOS_ADICIONAIS do
  PAF.nnnn foi para o PAFnnnn; 0 dado interno; 0 colisão de código;
- confere que a base continua com o mesmo sha256 do começo;
- com --antes-de <base anterior>, confere que o "antes" das células da simulação é o mesmo nas duas bases
  (ex.: a simulação foi feita sobre a v14 e a base de hoje é a v15).

Uso: python3 dados/simulacoes/T-0010/simular_T-0010.py --trabalho <dir_temporario>
         [--antes-de dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v14.xlsx] [--planilha <xlsx>]
Nenhum dado interno sai daqui: dos DADOS_ADICIONAIS só se lê o CODIGO_BARRAS (que já é público na ficha do site);
os outros valores só são lidos para provar que não chegaram ao JSON, e não são impressos nem copiados.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

RAIZ = Path(__file__).resolve().parents[3]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
JSON_SITE = RAIZ / "site" / "data" / "produtos.json"
GERADOR = RAIZ / "scripts" / "gerar_site.py"
SAIDA = Path(__file__).resolve().parent / "Simulacao_T-0010_PAF.xlsx"
DATA = "20/11/2026"  # [SUPOSIÇÃO] na gravação de verdade, vale a data do "aprovado"
TAREFA = "T-0010"
MARCA = "BAP"        # ligação: "BAP: PAF.nnnn" no fim das REFERENCIAS_CRUZADAS do PAFnnnn (formato da base igual)

# Células do PAFnnnn que mudam além da ligação: (coluna, modo, valor, motivo).
# - "acrescenta": o valor vai no fim do que já está (" · "); "troca": o valor substitui o que está.
# - PAF0054: dado bom que só o PAF.0054 tem (descrição do ERP). DETALHE_CATALOGO = "informação essencial da
#   descrição" (regra da v11). [SUPOSIÇÃO] texto como no ERP.
# - PAF0116: decisão do Alexandre (R-20261120-100937-alexandre, "2) a"): dianteira e traseira, como a aplicação diz
#   em todos os veículos ("D/T") e como o PAF.0116 diz.
PASSAR = {
    "PAF0054": [("DETALHE_CATALOGO", "acrescenta", "Sistema Vargas TRW pequena",
                 "Descrição do ERP do PAF.0054 ('JOGO PASTILHA FREIO DIANTEIRO SISTEMA VARGAS TRW PEQUENA'): a "
                 "informação 'Sistema Vargas TRW pequena' só existe nele e sairia do site com ele; acrescentada no fim "
                 "do DETALHE_CATALOGO. ITEM À PARTE: o Alexandre aprova ou tira este item.")],
    "PAF0116": [("POSICAO", "troca", "DIANTEIRO E TRASEIRO",
                 "Decisão do Alexandre (R-20261120-100937-alexandre, '2) a'): a PAF0116 é dianteira e traseira, como "
                 "a aplicação diz em todos os veículos ('D/T') e como o PAF.0116 diz (descrição do ERP "
                 "'DIANTEIRO/TRASEIRO' e POSICAO DIANTEIRO E TRASEIRO)."),
                ("DETALHE_CATALOGO", "troca", "Diant./Tras.",
                 "Decisão do Alexandre (R-20261120-100937-alexandre, '2) a'): o DETALHE_CATALOGO fica coerente com "
                 "a POSICAO DIANTEIRO E TRASEIRO.")],
}
JSON_DE = {"DETALHE_CATALOGO": "de", "POSICAO": "po"}   # coluna da base -> chave do produtos.json

# Códigos que a T-0007 + T-0009 (em revisão) mexem, pela regra da simulação delas: códigos só de número (154),
# as 3 Cruzetas e os 3 avulsos. Saem do site os 154 + 3 Cruzetas = 157.
T0007_SAEM_EXTRA = {"VEÍCULO", "HYUNDAI", "KIA MOTORS"}
T0007_MUDAM = {"TAX10116", "CRU100", "TER556556"}

# Dado interno que nunca pode aparecer no JSON
INTERNO = re.compile(r"ESTOQUE|ID_PRODUTO|HERDADA_CONFIRMAR|SKU DISTINTO|APLICACAO_HERDADA", re.I)


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def norm(s: str) -> str:
    return re.sub(r"[\s.\-/]", "", s.upper())


def norm_cod(s: str) -> str:            # igual ao normCod do site/app.js
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def da(texto: str) -> dict[str, str]:
    return {k.strip(): v.strip() for k, v in (p.split(":", 1) for p in (texto or "").split("|") if ":" in p)}


def barras(dados_adicionais: str) -> str:
    m = re.search(r"CODIGO_BARRAS:\s*(\d+)", dados_adicionais or "")
    return m.group(1) if m else ""


def refs(texto: str) -> list[str]:
    return [p.strip() for p in re.split(r"\s*;\s*", texto or "") if p.strip()]


def pos_da_descricao(desc: str) -> set[str]:
    d = desc.upper()
    return ({"DIANTEIRO"} if re.search(r"\bDIANTEIR[OA]\b", d) else set()) | \
           ({"TRASEIRO"} if re.search(r"\bTRASEIR[OA]\b", d) else set())


def sobra_da_descricao(desc: str) -> str:
    """O que a descrição do ERP diz além de 'JOGO PASTILHA FREIO DIANTEIRO/TRASEIRO' (e do prefixo '(980 - ...) -')."""
    s = re.sub(r"^\(\d+\s*-\s*[^)]*\)\s*-\s*", "", desc.upper())
    s = re.sub(r"^JOGO PASTILHA FREIO\s*", "", s)
    s = re.sub(r"\b(DIANTEIRO|DIANTEIRA|TRASEIRO|TRASEIRA)\b", "", s)
    return re.sub(r"\s+", " ", s.replace("/", " ")).strip()


def ler(caminho: Path = BASE):
    wb = openpyxl.load_workbook(caminho, read_only=True, data_only=True)
    linhas = list(wb["PRODUTOS"].iter_rows(values_only=True))
    cab = [limpo(c) for c in linhas[0]]
    dados = [dict(zip(cab, r), _linha=i + 2) for i, r in enumerate(linhas[1:])]
    return cab, dados


def analisar(dados, site):
    por = {limpo(d["CODIGO_BAP"]).upper(): d for d in dados if limpo(d["CODIGO_BAP"])}
    ordem_site = [p["c"] for p in site["produtos"]]
    pos_site = {c: i for i, c in enumerate(ordem_site)}
    foto = {p["c"]: p.get("i", "") for p in site["produtos"]}
    aponta = Counter()                  # quem aponta para PAF (ITEM_PARECIDO e OFERECA_JUNTO)
    for d in dados:
        for col in ("ITEM_PARECIDO", "OFERECA_JUNTO"):
            for m in re.findall(r"\bPAF\.?\d+S?\b", limpo(d[col]).upper()):
                aponta[m] += 1
    pares = []
    for cod in sorted(c for c in por if c.startswith("PAF.")):
        sem = cod.replace(".", "")
        if sem not in por:
            continue
        P, D = por[sem], por[cod]          # P = sem ponto (catálogo), D = com ponto (ERP)
        difs = [c for c in P if c not in ("CODIGO_BAP", "DADOS_ADICIONAIS", "_linha") and limpo(P[c]) != limpo(D[c])]
        ap, ad = limpo(P["APLICACAO"]), limpo(D["APLICACAO"])
        if ap == ad:
            apl = "igual"
        elif ap.startswith(ad):
            extra = len([x for x in ap[len(ad):].split(" ; ") if x.strip()])
            apl = f"a do {cod} é o começo da do {sem}; o {sem} tem {extra} trecho(s) a mais (complemento Fraga)"
        else:
            apl = "diferente"
        rp, rd = limpo(P["REFERENCIAS_CRUZADAS"]), limpo(D["REFERENCIAS_CRUZADAS"])
        so_d = [r for r in refs(rd) if norm(r.split(":", 1)[-1]) not in norm(rp)]
        so_p = [r for r in refs(rp) if norm(r.split(":", 1)[-1]) not in norm(rd)]
        bp, bd = barras(limpo(P["DADOS_ADICIONAIS"])), barras(limpo(D["DADOS_ADICIONAIS"]))
        sobra = sobra_da_descricao(limpo(D["DESCRICAO"]))
        coberta = (not sobra or (sobra == "COM ABS" and "ABS" in limpo(P["DIFERENCIAL"]).upper())
                   or sem in PASSAR)
        so_no_sem = [c for c in ("DIFERENCIAL", "ITEM_PARECIDO", "OFERECA_JUNTO") if limpo(P[c]) and not limpo(D[c])]
        conflito = [c for c in ("POSICAO", "LADO", "DETALHE_CATALOGO", "PRODUTO", "CATEGORIA", "SISTEMA", "FAMILIA",
                                "LINHA", "STATUS_CADASTRO") if c in difs]
        # a posição que a descrição do ERP do PAF.nnnn diz tem de estar na POSICAO do PAFnnnn
        pos_erp = pos_da_descricao(limpo(D["DESCRICAO"]))
        pos_p = limpo(P["POSICAO"]).upper()
        if any(x not in pos_p for x in pos_erp):
            conflito = conflito or ["POSICAO"]
        resolvidas = {col for col, *_ in PASSAR.get(sem, [])}         # conflito que a decisão já resolve
        conflito = [c for c in conflito if c not in resolvidas]
        # compatível, mas não igual: o ERP diz uma posição e a POSICAO do PAFnnnn diz as duas
        pos_nota = ""
        if sem not in PASSAR and pos_erp and all(x in pos_p for x in pos_erp) and {"DIANTEIRO", "TRASEIRO"} - pos_erp and \
                "DIANTEIRO" in pos_p and "TRASEIRO" in pos_p:
            pos_nota = (f" (o ERP diz só {', '.join(sorted(pos_erp))}; a POSICAO do {sem}, tirada do catálogo, é "
                        f"{limpo(P['POSICAO'])}, porque a aplicação dele tem itens dianteiros e traseiros)")
        if bp and bd and bp != bd:
            destino = "B"
        elif conflito or apl == "diferente" or not coberta:
            destino = "C"
        else:
            destino = "A"
        if destino == "A":
            motivo = (f"Mesmo produto (o Alexandre confirmou: troca interna de fabricante): o {cod} é o código com "
                      f"ponto do ERP, entrou na base (v3) com a aplicação copiada do {sem} e com o mesmo código de "
                      f"barras e a mesma página do catálogo; a descrição do ERP ({limpo(D['DESCRICAO'])}) "
                      + (f"diz a posição que a POSICAO do {sem} passa a ter" if "POSICAO" in resolvidas
                         else f"é compatível com a posição do {sem}{pos_nota}") + f". Fica no site o {sem}: é o código do catálogo e tem todos os "
                      f"dados (aplicação, referências e campos de venda). O {cod} aparece na ficha do {sem} como "
                      f"referência '{MARCA}: {cod}' e continua ATIVO na base. O {cod} não tem nada que o {sem} não "
                      f"tenha")
            if sem == "PAF0054":
                motivo += f", fora a descrição '{sobra.lower()}', que passa para o DETALHE_CATALOGO do {sem}."
            elif sem == "PAF0116":
                motivo += (f", fora a posição: por decisão do Alexandre (R-20261120-100937-alexandre, '2) a'), a "
                           f"{sem} é dianteira e traseira, como a aplicação diz em todos os veículos ('D/T') e como "
                           f"o {cod} diz; a POSICAO do {sem} passa a DIANTEIRO E TRASEIRO e o DETALHE_CATALOGO a "
                           f"'Diant./Tras.'.")
            else:
                motivo += "."
        elif destino == "C":
            motivo = "Conflito em " + ", ".join(conflito or ["descrição/aplicação"])
        else:
            motivo = "Códigos de barras diferentes: produtos diferentes; os dois ficam e o site tem de usar o código exato."
        ganha = cod if pos_site[cod] > pos_site[sem] else sem
        site_hoje = (f"2 cartões na busca; #/produto/{sem} e #/produto/{cod} abrem os dois o {ganha} "
                     f"(o último do JSON apaga o outro no POR_COD)")
        if destino == "A":
            site_depois = (f"1 cartão ({sem}), com '{MARCA} {cod}' nas referências cruzadas; a busca por {sem} ou "
                           f"{cod} acha só ele; #/produto/{sem} e #/produto/{cod} abrem o {sem}, o mesmo produto")
        elif destino == "B":
            site_depois = "os 2 ficam; o web-site faz a página usar o código exato"
        else:
            site_depois = "sem mudança até a decisão (a colisão continua na lista de conhecidos do testes)"
        pares.append({
            "sem": sem, "com": cod, "tipo": "PAF.9999S" if cod.endswith("S") else "PAF.9999", "destino": destino,
            "P": P, "D": D, "difs": difs, "apl": apl, "so_d": so_d, "so_p": so_p, "bp": bp, "bd": bd,
            "sobra": sobra, "so_no_sem": so_no_sem, "conflito": conflito, "motivo": motivo, "pos_nota": pos_nota,
            "foto_sem": foto.get(sem, ""), "foto_com": foto.get(cod, ""),
            "site_hoje": site_hoje, "site_depois": site_depois,
            "aponta_sem": aponta[sem], "aponta_com": aponta[cod],
        })
    return por, pares


def mudancas(pares):
    """[(codigo, coluna, antes, depois, destino, par, motivo)]: só as células que mudam."""
    out = []
    for p in pares:
        if p["destino"] != "A":
            continue
        out.append((p["com"], "NO_CATALOGO_DIGITAL", limpo(p["D"]["NO_CATALOGO_DIGITAL"]), "NÃO", "A", p["sem"],
                    p["motivo"]))
        antes = limpo(p["P"]["REFERENCIAS_CRUZADAS"])
        liga = f"{MARCA}: {p['com']}"
        assert norm_cod(p["com"]) not in [norm_cod(r.split(":", 1)[-1]) for r in refs(antes)]
        out.append((p["sem"], "REFERENCIAS_CRUZADAS", antes, f"{antes}; {liga}" if antes else liga, "A", p["com"],
                    f"Ligação dos dois códigos (unificar e mostrar os dois): '{liga}' acrescentado no fim das "
                    f"referências do {p['sem']}; nenhuma referência tirada."))
        for col, modo, txt, motivo in PASSAR.get(p["sem"], []):
            antes = limpo(p["P"][col])
            depois = (f"{antes} · {txt}" if antes else txt) if modo == "acrescenta" else txt
            out.append((p["sem"], col, antes, depois, "A", p["com"], motivo))
    return out


def log_linhas(muds):
    """Uma linha do LOG_CORRECOES por código mudado."""
    por_cod: dict[str, list] = {}
    for m in muds:
        por_cod.setdefault(m[0], []).append(m)
    linhas = []
    for cod, ms in por_cod.items():
        par = ms[0][5]
        cols = {m[1]: m for m in ms}
        if "NO_CATALOGO_DIGITAL" in cols:
            m = cols["NO_CATALOGO_DIGITAL"]
            linhas.append(("NO_CATALOGO_DIGITAL", "PRODUTOS", cod, par,
                           f"NO_CATALOGO_DIGITAL {m[2]} -> {m[3]}: mesmo produto do {par} (troca interna de "
                           f"fabricante; código com ponto do ERP, aplicação herdada do {par} na v3). No site fica o "
                           f"{par}, com '{MARCA}: {cod}' nas referências. Continua ATIVO; STATUS_CADASTRO e os outros "
                           f"campos sem mudança; nenhum campo apagado. {TAREFA}, {DATA}"))
            continue
        partes = [f"REFERENCIAS_CRUZADAS: '{MARCA}: {par}' acrescentado no fim (o {par} é o mesmo produto, código "
                  f"com ponto do ERP, e sai do site); nenhuma referência tirada"]
        for col, modo, txt, _ in PASSAR.get(cod, []):
            m = cols[col]
            if modo == "acrescenta":
                partes.append(f'{col} "{m[2]}" -> "{m[3]}": acrescentado no fim o que a descrição do ERP do {par} '
                              f"diz ('{txt}'); nada tirado")
            else:
                partes.append(f'{col} "{m[2]}" -> "{m[3]}" (decisão do Alexandre, R-20261120-100937-alexandre: '
                              f"dianteira e traseira, como a aplicação diz em todos os veículos e como o {par} diz)")
        linhas.append(("CODIGO_UNIFICADO", "PRODUTOS", cod, par, ". ".join(partes) + f". {TAREFA}, {DATA}"))
    return linhas


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


def planilha(pares, muds, medidas, cruza, prova, saida: Path):
    muda_de = {(c, col): (a, d) for c, col, a, d, *_ in muds}
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "PARES"
    ws.append(["PAR", "CODIGO_SEM_PONTO", "CODIGO_COM_PONTO", "FORMATO", "DESTINO", "FICA_NO_SITE",
               "DESCRICAO_SEM_PONTO", "DESCRICAO_COM_PONTO", "APLICACAO (comparação)",
               "REFERENCIAS_SEM_PONTO (antes)", "REFERENCIAS_SEM_PONTO (depois)", "REFERENCIAS_COM_PONTO",
               "REFS_SO_NO_COM_PONTO", "REFS_SO_NO_SEM_PONTO",
               "COD_BARRAS_SEM_PONTO", "COD_BARRAS_COM_PONTO", "COD_BARRAS_IGUAL",
               "STATUS_SEM_PONTO", "STATUS_COM_PONTO (antes = depois)", "POSICAO_SEM_PONTO", "POSICAO_COM_PONTO",
               "NOTA_DA_POSICAO", "CAMPOS_DE_VENDA_SO_NO_SEM_PONTO", "COLUNAS_DIFERENTES", "FOTO_SEM_PONTO",
               "FOTO_COM_PONTO", "APONTADO_POR (outros itens, sem ponto / com ponto)",
               "NO_CATALOGO_DIGITAL_COM_PONTO (antes -> depois)", "NO_CATALOGO_DIGITAL_SEM_PONTO (antes -> depois)",
               "POSICAO_SEM_PONTO (antes -> depois)", "DETALHE_CATALOGO_SEM_PONTO (antes -> depois)", "SITE_HOJE", "SITE_DEPOIS", "MOTIVO"])
    for i, p in enumerate(pares, 1):
        P, D = p["P"], p["D"]
        nd = muda_de.get((p["com"], "NO_CATALOGO_DIGITAL"))
        rf = muda_de.get((p["sem"], "REFERENCIAS_CRUZADAS"))
        dt = muda_de.get((p["sem"], "DETALHE_CATALOGO"))
        po = muda_de.get((p["sem"], "POSICAO"))
        ws.append([
            i, p["sem"], p["com"], p["tipo"], p["destino"],
            {"A": f"{p['sem']} (com {p['com']} nas referências)", "B": "os dois", "C": "os dois (até a resposta)"}[p["destino"]],
            limpo(P["DESCRICAO"]), limpo(D["DESCRICAO"]), p["apl"],
            limpo(P["REFERENCIAS_CRUZADAS"]), rf[1] if rf else "(sem mudança)", limpo(D["REFERENCIAS_CRUZADAS"]),
            ", ".join(p["so_d"]) or "—", ", ".join(p["so_p"]) or "—",
            p["bp"], p["bd"], "SIM" if p["bp"] and p["bp"] == p["bd"] else "NÃO",
            limpo(P["STATUS_CADASTRO"]), limpo(D["STATUS_CADASTRO"]), limpo(P["POSICAO"]), limpo(D["POSICAO"]),
            p["pos_nota"].strip(" ()") or "—",
            ", ".join(f"{c}: {limpo(P[c])}" for c in p["so_no_sem"]) or "—",
            ", ".join(p["difs"]),
            p["foto_sem"] or "sem foto", p["foto_com"] or "sem foto",
            f"{p['aponta_sem']} / {p['aponta_com']}",
            f"{nd[0]} -> {nd[1]}" if nd else f"{limpo(D['NO_CATALOGO_DIGITAL'])} (sem mudança)",
            f"{limpo(P['NO_CATALOGO_DIGITAL'])} (sem mudança)",
            f'"{po[0]}" -> "{po[1]}"' if po else "(sem mudança)",
            f'"{dt[0]}" -> "{dt[1]}"' if dt else "(sem mudança)",
            p["site_hoje"], p["site_depois"], p["motivo"],
        ])
    estilo(ws, [5, 11, 11, 10, 10, 18, 18, 30, 40, 40, 40, 40, 14, 30, 15, 15, 8, 9, 9, 16, 16, 40, 40, 40, 10, 10,
                12, 16, 16, 30, 30, 50, 60, 90])

    ws = wb.create_sheet("ANTES_DEPOIS")
    ws.append(["CODIGO", "LINHA_NA_BASE", "DESTINO", "PAR", "COLUNA", "VALOR_ANTES", "VALOR_DEPOIS", "TAREFA",
               "MOTIVO"])
    linha = {p["com"]: p["D"]["_linha"] for p in pares} | {p["sem"]: p["P"]["_linha"] for p in pares}
    for cod, col, antes, depois, destino, par, motivo in muds:
        ws.append([cod, linha[cod], destino, par, col, antes, depois, TAREFA, motivo])
    estilo(ws, [11, 9, 8, 11, 22, 40, 50, 8, 100])

    ws = wb.create_sheet("RESUMO")
    c = Counter(p["destino"] for p in pares)
    nc = Counter(m[1] for m in muds)
    ws.append(["ITEM", "QTD", "O QUE ACONTECE"])
    linhas = [
        ("Pares PAFnnnn × PAF.nnnn na aba PRODUTOS", len(pares),
         f"{sum(p['tipo'] == 'PAF.9999' for p in pares)} PAF.9999 e {sum(p['tipo'] == 'PAF.9999S' for p in pares)} "
         "PAF.9999S; nenhum PAF.nnnn sem o par sem ponto"),
        ("Regra", "", "Alexandre, R-20261120-100733-alexandre: \"É que internamente trocamos de fabricante. mas é o "
                      "mesmo produto. acredito que o melhor seja unificar aparecer os dois.\" PAF0116: R-20261120-100937-"
                      "alexandre, \"2) a\" (dianteira e traseira; entra na unificação)."),
        ("A · mesmo produto: unificar e mostrar os dois códigos", c["A"],
         f"Fica no site o PAFnnnn, com '{MARCA}: PAF.nnnn' no fim das REFERENCIAS_CRUZADAS; o PAF.nnnn sai do site "
         "(NO_CATALOGO_DIGITAL SIM -> NÃO) e fica na base, ATIVO"),
        ("   dos quais com outra célula que muda no PAFnnnn", sum(1 for p in pares if p["destino"] == "A"
                                                                  and p["sem"] in PASSAR),
         "; ".join(f"{c} {col}: '{a}' -> '{d}'" for c, col, a, d, *_ in muds
                   if col not in ("NO_CATALOGO_DIGITAL", "REFERENCIAS_CRUZADAS"))
         + " (PAF0054: da descrição do PAF.0054, item à parte para o Alexandre aprovar ou tirar; PAF0116: decisão do Alexandre, R-20261120-100937-alexandre)"),
        ("   dos quais com a posição compatível, mas não igual", sum(1 for p in pares if p["destino"] == "A"
                                                                     and p["pos_nota"]),
         "; ".join(f"{p['sem']}{p['pos_nota']}" for p in pares if p["destino"] == "A" and p["pos_nota"]) or "—"),
        ("B · produtos diferentes (os dois valem; problema só no site)", c["B"], "—"),
        ("C · dúvida", c["C"], "—"),
        ("Pares com o mesmo código de barras", sum(1 for p in pares if p["bp"] and p["bp"] == p["bd"]), ""),
        ("Pares com o mesmo STATUS_CADASTRO (ATIVO) e NO_CATALOGO_DIGITAL (SIM)",
         sum(1 for p in pares if limpo(p["P"]["STATUS_CADASTRO"]) == limpo(p["D"]["STATUS_CADASTRO"]) == "ATIVO"
             and limpo(p["P"]["NO_CATALOGO_DIGITAL"]) == limpo(p["D"]["NO_CATALOGO_DIGITAL"]) == "SIM"), ""),
        ("Referências que só o PAF.nnnn tem", sum(len(p["so_d"]) for p in pares), "Nada a passar"),
        ("Pares em que o PAFnnnn tem referências a mais", sum(1 for p in pares if p["so_p"]),
         "Complemento Fraga (13/11) e equivalências do catálogo, só no PAFnnnn"),
        ("Pares em que o PAFnnnn tem aplicação a mais", sum(1 for p in pares if "começo" in p["apl"]),
         "Complemento Fraga, só no PAFnnnn"),
        ("Pares com foto (site/img)", sum(1 for p in pares if p["foto_sem"] or p["foto_com"]), "Nenhum dos 206 tem foto"),
        ("Itens que apontam para um PAFnnnn / PAF.nnnn (ITEM_PARECIDO, OFERECA_JUNTO)",
         f"{sum(p['aponta_sem'] for p in pares)} / {sum(p['aponta_com'] for p in pares)}", ""),
        ("Células que mudam na base", len(muds),
         ", ".join(f"{k}: {v}" for k, v in nc.items())),
        ("Linhas no LOG_CORRECOES (uma por código)", len(log_linhas(muds)), ""),
        ("Formato da base", "igual", "Nenhuma coluna ou aba nova; as 5 primeiras colunas na mesma ordem"),
        ("Códigos em comum com a T-0007 + T-0009", len(cruza), ", ".join(sorted(cruza)) or "nenhum"),
    ]
    for nome, k in (("atual", "Produtos no produtos.json hoje (cópia da base sem mudança)"),
                    ("t0010", "Produtos no produtos.json com a T-0010"),
                    ("t0010_t0007", "Produtos no produtos.json com a T-0010 e a T-0007")):
        m = medidas[nome]
        col = (f"{m['colisoes']}" if nome == "atual" else f"{medidas['atual']['colisoes']} → {m['colisoes']}")
        linhas.append((k, m["total"], f"colisões: {col}; com foto: {m['fotos']}"))
    linhas += [
        (f"Fichas de PAFnnnn com '{MARCA} PAF.nnnn' nas referências (JSON simulado)", prova["com_ligacao"],
         "A última referência da ficha é {\"m\": \"BAP\", \"c\": \"PAF.nnnn\"}"),
        ("Fichas de PAFnnnn que mudaram além da ligação (JSON simulado)", prova["alem"],
         "PAF0054 (chave de) e PAF0116 (chaves po e de)"),
        ("Valores dos DADOS_ADICIONAIS do PAF.nnnn que chegaram ao PAFnnnn (fora o código de barras, já igual)",
         prova["vazou"], "Conferido valor a valor, sem copiar nenhum aqui"),
        ("Dado interno no JSON simulado (código interno do ERP, aviso de herança)", prova["interno"], ""),
    ]
    for ln in linhas:
        ws.append(list(ln))
    estilo(ws, [62, 12, 100])

    ws = wb.create_sheet("LOG_CORRECOES_PREVISTO")
    ws.append(["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"])
    for ln in log_linhas(muds):
        ws.append(list(ln))
    estilo(ws, [22, 10, 20, 18, 120])
    wb.save(saida)


def copia(destino: Path, muds, saem_extra=()):
    destino.mkdir(parents=True, exist_ok=True)
    alvo = destino / BASE.name
    shutil.copy2(BASE, alvo)
    if not muds and not saem_extra:
        return alvo
    wb = openpyxl.load_workbook(alvo)
    ws = wb["PRODUTOS"]
    cab = [limpo(c.value) for c in ws[1]]
    col = {c: i + 1 for i, c in enumerate(cab)}
    linha = {limpo(ws.cell(r, 1).value).upper(): r for r in range(2, ws.max_row + 1)}
    for cod, coluna, antes, depois, *_ in muds:
        cel = ws.cell(linha[cod], col[coluna])
        assert limpo(cel.value) == antes, (cod, coluna, cel.value, antes)
        cel.value = depois or None
    for cod in saem_extra:
        ws.cell(linha[cod], col["NO_CATALOGO_DIGITAL"]).value = "NÃO"
    wb.save(alvo)
    return alvo


def gerar(trab: Path, base: Path, nome: str) -> dict:
    """Roda a CÓPIA do gerar_site.py (RAIZ = trab) e guarda o JSON como produtos_<nome>.json."""
    (trab / "scripts").mkdir(parents=True, exist_ok=True)
    shutil.copy2(GERADOR, trab / "scripts" / "gerar_site.py")
    img = trab / "site" / "img"
    img.parent.mkdir(parents=True, exist_ok=True)
    if not img.exists():
        img.symlink_to(RAIZ / "site" / "img")          # só leitura: o gerador sem --fotos só lista as fotos
    r = subprocess.run([sys.executable, str(trab / "scripts" / "gerar_site.py"), "--base", str(base)],
                       capture_output=True, text=True)
    print(f"  [{nome}]", r.stdout.strip().replace("\n", " | "), r.stderr.strip())
    if r.returncode != 0 or "[PARADO]" in r.stdout:
        sys.exit(f"[ERRO] gerador da cópia parou no cenário {nome}")
    saida = trab / "site" / "data" / "produtos.json"
    final = trab / f"produtos_{nome}.json"
    shutil.move(saida, final)
    texto = final.read_text(encoding="utf-8")
    j = json.loads(texto)
    grupos: dict[str, list] = {}
    for p in j["produtos"]:
        grupos.setdefault(norm_cod(p["c"]), []).append(p["c"])
    col = [v for v in grupos.values() if len(v) > 1]
    return {"json": j, "texto": texto, "arquivo": final, "total": j["total"], "colisoes": len(col),
            "fotos": sum(1 for p in j["produtos"] if p.get("i"))}


def provar(pares, medidas):
    """Confere no JSON simulado a ligação e que nada dos DADOS_ADICIONAIS do PAF.nnnn foi para o PAFnnnn."""
    antes = {p["c"]: p for p in medidas["atual"]["json"]["produtos"]}
    depois = {p["c"]: p for p in medidas["t0010"]["json"]["produtos"]}
    com_ligacao = alem = vazou = 0
    for p in pares:
        if p["destino"] != "A":
            assert depois[p["sem"]] == antes[p["sem"]] and depois.get(p["com"]) == antes[p["com"]], p["sem"]
            continue
        a, d = antes[p["sem"]], depois[p["sem"]]
        assert p["com"] not in depois
        if d.get("r", [])[-1:] == [{"m": MARCA, "c": p["com"]}] and d["r"][:-1] == a.get("r", []):
            com_ligacao += 1
        outras = sorted(k for k in set(a) | set(d) if k != "r" and a.get(k) != d.get(k))
        if outras:
            alem += 1
            esperado = sorted(JSON_DE[col] for col, *_ in PASSAR.get(p["sem"], []))
            assert outras == esperado, (p["sem"], outras)
        # valor a valor: o que só o PAF.nnnn tem nos DADOS_ADICIONAIS não pode estar na ficha do PAFnnnn
        dd, dp = da(limpo(p["D"]["DADOS_ADICIONAIS"])), da(limpo(p["P"]["DADOS_ADICIONAIS"]))
        ficha = json.dumps(d, ensure_ascii=False)
        for k, v in dd.items():
            if dp.get(k) == v or len(v) < 3 or v.upper() == p["sem"]:   # APLICACAO_HERDADA_DE = o próprio código
                continue
            if re.search(r"(?<![0-9A-Za-z])" + re.escape(v) + r"(?![0-9A-Za-z])", ficha):
                vazou += 1
    interno = len(INTERNO.findall(medidas["t0010"]["texto"]))
    return {"com_ligacao": com_ligacao, "alem": alem, "vazou": vazou, "interno": interno}


def celulas_diferentes(a: Path, b: Path) -> list[tuple]:
    """Compara as duas bases, aba por aba e célula por célula (valores)."""
    wa = openpyxl.load_workbook(a, read_only=True, data_only=True)
    wb = openpyxl.load_workbook(b, read_only=True, data_only=True)
    assert wa.sheetnames == wb.sheetnames, "as abas mudaram"
    difs = []
    for nome in wa.sheetnames:
        la = list(wa[nome].iter_rows(values_only=True))
        lb = list(wb[nome].iter_rows(values_only=True))
        assert len(la) == len(lb), f"o número de linhas da aba {nome} mudou"
        assert la[0] == lb[0], f"o cabeçalho da aba {nome} mudou"
        for i, (ra, rb) in enumerate(zip(la, lb), 1):
            for j in range(max(len(ra), len(rb))):
                va = ra[j] if j < len(ra) else None
                vb = rb[j] if j < len(rb) else None
                if limpo(va) != limpo(vb):
                    difs.append((nome, i, la[0][j] if nome == "PRODUTOS" else j + 1, limpo(ra[0]).upper()))
    return difs


PROIBIDO = re.compile(r"PRE[CÇ]O|ESTOQUE|CUSTO|FORNECEDOR|RANKING|\bFOB\b|\bUSD\b|\bMOQ\b|R\$", re.I)


def conferir_planilha(caminho: Path) -> list[str]:
    wb = openpyxl.load_workbook(caminho, read_only=True)
    return [f"{ws.title}: {v}" for ws in wb.worksheets for r in ws.iter_rows(values_only=True) for v in r
            if v is not None and PROIBIDO.search(str(v))]


def sem_data(j):
    return {k: v for k, v in j.items() if k != "gerado_em"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--trabalho", required=True, help="diretório temporário (fora do repositório)")
    ap.add_argument("--antes-de", default="", help="base anterior: confere que o 'antes' das células é o mesmo")
    ap.add_argument("--planilha", default=str(SAIDA), help="onde gravar a planilha (padrão: a da simulação)")
    a = ap.parse_args()
    trab = Path(a.trabalho).resolve()
    if RAIZ in trab.parents or trab == RAIZ:
        sys.exit("[ERRO] o diretório de trabalho tem de ficar fora do repositório")
    hash_antes = sha256(BASE)
    site = json.loads(JSON_SITE.read_text(encoding="utf-8"))
    _, dados = ler()
    por, pares = analisar(dados, site)
    muds = mudancas(pares)
    antes_ok = None
    if a.antes_de:                       # o "antes" das células tem de ser o mesmo na base anterior
        _, dados_ant = ler(Path(a.antes_de))
        _, pares_ant = analisar(dados_ant, site)
        chave = lambda ms: sorted((c, col, an, de) for c, col, an, de, *_ in ms)
        antes_ok = chave(mudancas(pares_ant)) == chave(muds)
        assert antes_ok, "o 'antes' das células mudou entre a base anterior e a de hoje"

    t7_saem = {c for c in por if c.isdigit()} | T0007_SAEM_EXTRA
    t7 = t7_saem | T0007_MUDAM
    meus = {p["sem"] for p in pares} | {p["com"] for p in pares}
    cruza = meus & t7

    medidas = {
        "atual": gerar(trab, copia(trab / "base_atual", []), "atual"),
        "t0010": gerar(trab, copia(trab / "base_t0010", muds), "t0010"),
        "t0010_t0007": gerar(trab, copia(trab / "base_t0010_t0007", muds, sorted(t7_saem)), "t0010_t0007"),
    }
    igual_site = sem_data(medidas["atual"]["json"]) == sem_data(site)
    antes = {p["c"]: p for p in medidas["atual"]["json"]["produtos"]}
    depois = {p["c"]: p for p in medidas["t0010"]["json"]["produtos"]}
    sairam = sorted(set(antes) - set(depois))
    mudaram = sorted(c for c in depois if c in antes and depois[c] != antes[c])
    assert sairam == sorted(c for c, col, *_ in muds if col == "NO_CATALOGO_DIGITAL"), "saiu algo fora da simulação"
    assert mudaram == sorted({c for c, col, *_ in muds if col != "NO_CATALOGO_DIGITAL"}), "mudou algo fora"
    prova = provar(pares, medidas)
    assert prova["vazou"] == 0 and prova["interno"] == 0
    assert prova["com_ligacao"] == sum(1 for p in pares if p["destino"] == "A")
    difs = celulas_diferentes(BASE, trab / "base_t0010" / BASE.name)
    assert sorted((d[3], d[2]) for d in difs) == sorted((c, col) for c, col, *_ in muds) and \
        all(d[0] == "PRODUTOS" for d in difs), difs
    rascunho = trab / "planilha_rascunho.xlsx"           # a planilha só vai para o lugar depois das conferências
    planilha(pares, muds, medidas, cruza, prova, rascunho)
    proibidas = conferir_planilha(rascunho)
    assert not proibidas, proibidas
    hash_depois = sha256(BASE)
    assert hash_antes == hash_depois, "a base mudou!"
    saida = Path(a.planilha).resolve()
    shutil.move(rascunho, saida)

    c = Counter(p["destino"] for p in pares)
    print("pares:", len(pares), "| destinos:", dict(c), "| células:", len(muds), dict(Counter(m[1] for m in muds)),
          "| linhas no LOG:", len(log_linhas(muds)), "| cruza com T-0007:", sorted(cruza))
    print("JSON da cópia sem mudança igual ao site (fora o gerado_em):", igual_site)
    if antes_ok is not None:
        print(f"'antes' das {len(muds)} células igual na base anterior ({Path(a.antes_de).name}):", antes_ok)
    for k, m in medidas.items():
        print(f"  {k}: total {m['total']} | colisões normCod {m['colisoes']} "
              f"| com foto {m['fotos']} | 'estoque' no JSON: {len(re.findall('estoque', m['texto'], re.I))}")
    print("saem do JSON:", len(sairam), "| fichas que mudam:", len(mudaram), "| prova:", prova)
    print("células diferentes entre a cópia da T-0010 e a base:", len(difs), "(só PRODUTOS, só as da simulação)")
    print("palavras proibidas na planilha:", len(proibidas))
    print("sha256 da base antes :", hash_antes)
    print("sha256 da base depois:", hash_depois)
    print("planilha:", saida)


if __name__ == "__main__":
    main()
