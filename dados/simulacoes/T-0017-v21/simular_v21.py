"""SIMULAÇÃO da v21 da base unificada (T-0017). Só lê: não grava a base, não cria versão.

Uso: python3 -I simular_v21.py <d.pkl> <antigas.json> <variante.json> <dif_conjunto.json> <saida>
- d.pkl: PRODUTOS (sem DADOS_ADICIONAIS) e VEICULOS da v20, tirados por carregar.py;
- antigas.json: APLICACAO e REFERENCIAS_CRUZADAS da v8, v18 e v19 (antigas.py);
- variante.json: as linhas da tabela de veículos do site pelo caminho de 1 faixa (variante.cjs);
- dif_conjunto.json: a lista da V8 da simulação da v20 (veiculos-sim/rerun_pr60).
Os passos seguem a ordem 6, 1, 2, 3, 4, 5, 8 na APLICACAO; 3 e 7 na REFERENCIAS_CRUZADAS; 9 e 10 na VEICULOS; 11 nas linhas.
O ANTES e o DEPOIS de cada aba são os daquele passo; a aba TODAS_AS_CELULAS traz v20 -> final.
"""
from __future__ import annotations

import collections
import json
import pickle
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

DATA = "21/11/2026"
TAREFA = "T-0017"
PKL, ANTIGAS, VARIANTE, DIF, SAIDA = sys.argv[1:6]
SAIDA = Path(SAIDA)
SAIDA.mkdir(parents=True, exist_ok=True)

d = pickle.load(open(PKL, "rb"))
CAB = list(d["PRODUTOS"][0])
IA, IR = CAB.index("APLICACAO"), CAB.index("REFERENCIAS_CRUZADAS")
PROD = [list(r) for r in d["PRODUTOS"][1:]]
POR_COD = {r[0]: r for r in PROD}
CABV = list(d["VEICULOS"][0])
VEIC = [list(r) for r in d["VEICULOS"][1:]]
antigas = json.load(open(ANTIGAS))

# estado atual de cada célula (passo a passo) e o valor da v20
apl = {r[0]: (r[IA] or "") for r in PROD}
ref = {r[0]: (r[IR] or "") for r in PROD}
APL0, REF0 = dict(apl), dict(ref)

MUD = collections.defaultdict(list)   # item -> [linhas]
PERG = {}


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s or "") if unicodedata.category(c) != "Mn")


def n(s):
    return re.sub(r"\s+", " ", sem_acento(s).upper()).strip()


# o fornecedor (AUTOIMPACT, SUNRISE) e o preço do histórico não aparecem na planilha
def mascara(t):
    t = re.sub(r"(?i)(AUTO\W{0,3}IMPACT|SUN\W{0,3}RISE)[^:;,]*:\s*[^;,]*", "[fornecedor omitido]", t or "")
    return re.sub(r"(?i)BAP\s+BOX\s+USD[^;|]*", "BAP BOX USD [valor omitido]", t)


def registrar(item, cod, coluna, antes, depois, regra, tipo, pergunta="", aba="PRODUTOS"):
    MUD[item].append({"CODIGO_BAP": cod, "ABA": aba, "COLUNA": coluna, "ANTES": antes, "DEPOIS": depois,
                      "REGRA": regra, "TIPO": tipo, "PERGUNTA": pergunta})


def trocar(item, cod, novo, regra, tipo, pergunta=""):
    velho = apl[cod]
    if novo != velho:
        registrar(item, cod, "APLICACAO", velho, novo, regra, tipo, pergunta)
        apl[cod] = novo


# ---------------------------------------------------------------- item 6: ano solto por quebra de linha
RX6 = re.compile(r"\s*-\s*\n\s*((?:19|20)\d{2}(?:–(?:19|20)\d{2})?>?)(?=\s*(?:\n|$))")
cont6 = 0
for cod in apl:
    a = apl[cod]
    k = len(RX6.findall(a))
    if k:
        cont6 += k
        trocar(6, cod, RX6.sub(r" - \1", a), f"o ano da linha seguinte volta para o veículo ({k} anos)", "AUTOMÁTICO")

# 6b: o mesmo tipo de quebra no meio do veículo (a quebra da página do PDF de origem): "(510⏎CV) - 2015–2018",
# "METÁLICA⏎4X2 12.0 24V …", "E-⏎2 P-4 - 2002–2005". Junta quando a linha de antes não termina em ano e a de baixo não
# começa com a marca (3 letras maiúsculas) nem com outro veículo em caixa mista
RX6B = re.compile(r"(?<!19\d\d)(?<!20\d\d)(?<![>;])\n(?=(?:CV\)|\(?\d{2,3}(?:-\d{3})? CV\)|\d+X\d|\d P-\d|\d{4} CABINE|\d\.\d \d+V))")
cont6b = 0
for cod in apl:
    a = apl[cod]
    k = len(RX6B.findall(a))
    if k:
        cont6b += k
        novo = RX6B.sub(lambda m: "" if a[m.start() - 1] in "-(" else " ", a)
        trocar(6, cod, novo, f"pedaço do veículo quebrado no meio volta para a linha de cima ({k})", "AUTOMÁTICO")
# o aviso de página do PDF de origem ("Contnua...", "..continuação") não é veículo: sai
cont6c = 0
for cod in apl:
    a = apl[cod]
    novo = re.sub(r"\nContnua\.\.\.(?=\n)", "", a)
    novo = re.sub(r" · \.\.continuação(?= ;)", "", novo)
    if novo != a:
        cont6c += 1
        trocar(6, cod, novo, "o aviso de página do PDF de origem ('Contnua...', '..continuação') sai", "CASO")

# ---------------------------------------------------------------- item 1: faixa fechada com ">" e anos colados
def sub1(cod, pat, rep, regra, tipo, pergunta="", conta=None):
    a = apl[cod]
    novo, k = re.subn(pat, rep, a)
    if conta is not None and k != conta:
        raise SystemExit(f"[PARADO] item 1 {cod}: esperava {conta} troca(s) de {pat!r}, achei {k}")
    trocar(1, cod, novo, regra, tipo, pergunta)


def peugeot_2008(cod):
    def bloco(m):
        b = re.sub(r"(?<![\d(])2008–(20\d{2})(20\d{2})\b", r"2008 (\1–\2)", m.group(0))
        b = re.sub(r"(?<![\d(])2008–(20\d{2})>", r"2008 (\1>)", b)
        return re.sub(r"\) 2008 \(", ") · 2008 (", b)
    trocar(1, cod, re.sub(r"PEUGEOT - [^;]*", bloco, apl[cod]),
           "Peugeot 2008: o modelo colou no ano ('2008–20142019' é 2008 de 2014 a 2019); o modelo só de número leva o ano "
           "entre parênteses, como o '1924 (1979–2026)' da v19", "CASO")


for cod in ("BV11", "BV12", "MF16"):
    peugeot_2008(cod)
for cod in ("PAF0116", "PAF.0116"):
    sub1(cod, r"Axor 1933–2005>", "Axor 1933 (2005>)", "Axor 1933 é o modelo: '1933–2005>' é 1933 a partir de 2005",
         "CASO", conta=1)
sub1("CRUSPL250", r"\+ 19382000> \+", "+ 1938 (2000>) +", "1938 é o modelo (MB 1938): '19382000>' é 1938 a partir de 2000",
     "CASO", conta=1)
for cod in ("POL1648", "POL1705"):
    sub1(cod, r"(?<!\d)19381999–2006", "1938 (1999–2006)", "1938 é o modelo: '19381999–2006' é 1938 de 1999 a 2006",
         "CASO", conta=1)
sub1("POL1705", r"(?<!\d)194403/2005", "1944 (03/2005)", "1944 é o modelo: '194403/2005' é 1944 de 03/2005", "CASO", conta=1)
sub1("INT16506", r"\((20\d{2})(20\d{2})\)", r"(\1–\2)", "faixa sem o traço: '(20092013)' é 2009–2013", "AUTOMÁTICO", conta=2)
for cod in ("ELE1076", "ELE1079"):
    sub1(cod, r"2015–20162017", "2015–2017", "'2015–20162017': duas faixas coladas", "DÚVIDA", "P1", conta=1)
sub1("SCE14002", r"1929–19321934", "1929 · 1932 · 1934",
     "lista de modelos MB (LS 1630, 1929, 1932, 1934, LS1941) lida como faixa de anos", "DÚVIDA", "P2", conta=1)
trocar(1, "KAC11931", "NISSAN - Kicks 2016> · March 2011> · Versa 2011>"
       if apl["KAC11931"] == "Kicks 2016>- March 2011>- Versa 2011>" else apl["KAC11931"],
       "'>-' separava os veículos; a marca (os 3 são Nissan) entra no começo, como no item 3 da v19", "CASO")
for cod in ("PAF0635", "PAF.0635"):
    sub1(cod, r"(?<![\d/])3/02>", "03/2002>", "ano com 2 dígitos: '3/02>' é 03/2002 em diante", "AUTOMÁTICO", conta=3)

# ---------------------------------------------------------------- item 2: " - nan"
cont2 = 0
for cod in apl:
    a = apl[cod]
    k = len(re.findall(r"\s+-\s+nan\b", a))
    if k:
        cont2 += k
        trocar(2, cod, re.sub(r"\s+-\s+nan\b", "", a), f"' - nan' (célula vazia da planilha de origem) sai; a marca fica ({k})",
               "DÚVIDA", "P3")

# ---------------------------------------------------------------- item 3: MF21
MF21_ANTES = ("AUDI - A6 2013> · A7 2012> · Q3 2011> · TT 2008–2014 · TT 2015> ; GM - Malibu 2010–2013 · Montana 2011–2019 · "
              "Montana 2020–2022 ; FORD - Bronco Sport 2021 · Maverick 2022> ; LAND ROVER - Evoque 2012–2018 · Evoque 2019> ; "
              "CLS 2020> ; MB - Classe C 2016–2021 · Classe e 2015> · Classe e Cabrio 2018> · Eqa 2023> · Eqc 2023> · GLA 2023> ; "
              "GLB 2020> · GLC 2016> · GLE 2020–2023 · GLS 2019> ; MINI - Cooper Roadster S 2012–2015 · Cooper S ; 2 Lugares 2012> · "
              "Boxter 2011> ; PORSCHE - Cayenne 2018–2020 · Panamera 2013> · Panamera Turismo 2017> ; PEUGEOT - Fortwo 2008 ; "
              "GR Supra 2019> ; VW - Tiguan 2010 · Tiguan Allspace 2018 ; ")
MF21_DEPOIS = ("AUDI - A6 2013> · A7 2012> · Q3 2011> · TT 2008–2014 · TT 2015> ; GM - Malibu 2010–2013 · Montana 2011–2019 · "
               "Montana 2020–2022 ; FORD - Bronco Sport 2021 · Maverick 2022> ; LAND ROVER - Evoque 2012–2018 · Evoque 2019> ; "
               "MB - CLS 2020> · Classe C 2016–2021 · Classe e 2015> · Classe e Cabrio 2018> · Eqa 2023> · Eqc 2023> · GLA 2023> · "
               "GLB 2020> · GLC 2016> · GLE 2020–2023 · GLS 2019> ; MINI - Cooper Roadster S 2012–2015 · Cooper S 2 Lugares 2012> ; "
               "PORSCHE - Boxter 2011> · Cayenne 2018–2020 · Panamera 2013> · Panamera Turismo 2017> ; SMART - Fortwo 2008 ; "
               "TOYOTA - GR Supra 2019> ; VW - Tiguan 2010 · Tiguan Allspace 2018 ; ")
if not apl["MF21"].startswith(MF21_ANTES):
    raise SystemExit("[PARADO] MF21 mudou desde a v20")
trocar(3, "MF21", MF21_DEPOIS + apl["MF21"][len(MF21_ANTES):],
       "marcas trocadas na v19: Fortwo é SMART, GR Supra é TOYOTA, Boxter é PORSCHE; CLS e GLB voltam para o bloco MB; "
       "'Cooper S ; 2 Lugares 2012>' vira 'Cooper S 2 Lugares 2012>' (P4)", "CASO", "P4")
r_mf21 = ref["MF21"]
if "BOSCH: 397016728" in r_mf21 and "3397016728" not in r_mf21:
    novo = r_mf21.replace("BOSCH: 397016728", "BOSCH: 3397016728")
    registrar(3, "MF21", "REFERENCIAS_CRUZADAS", r_mf21, novo,
              "Bosch sem o primeiro 3: os códigos Bosch de palheta têm 10 dígitos (3397…), como o 3397016728 do MF22", "CASO")
    ref["MF21"] = novo
# VEICULOS do MF21: a marca do Fortwo e do GR Supra
for v in VEIC:
    if v[0] == "MF21" and v[2] in ("Fortwo", "GR Supra") and v[1] not in ("SMART", "TOYOTA"):
        novo = "SMART" if v[2] == "Fortwo" else "TOYOTA"
        registrar(3, "MF21", "FABRICANTE", f"{v[1]} {v[2]}", f"{novo} {v[2]}", "a mesma marca trocada, na aba VEICULOS", "CASO",
                  aba="VEICULOS")
        v[1] = novo
# a VEICULOS do MF21 não tem o Fortwo nem o GR Supra: entram na lista de linhas novas (10b)
for f, mo in (("SMART", "Fortwo"), ("TOYOTA", "GR Supra")):
    if not any(v[0] == "MF21" and v[2] == mo for v in VEIC):
        registrar("10b", "MF21", "VEICULOS (linha nova?)", "", f"{f} {mo}",
                  "o texto (item 3) cita o veículo; a VEICULOS não tem", "DÚVIDA", "P12", aba="VEICULOS")
# anos soltos do MF21 e do MF22: na v20 já não existem (saíram na v19, P1); a aba mostra onde estavam
for cod, solto in (("MF21", "· 2011> ·"), ("MF22", "· 2019> · 2011> ·")):
    registrar(3, cod, "APLICACAO", f"v18: '…{solto}…'", "(nada: já saiu na v19, P1 aprovada)",
              "ano solto sem veículo: conferido na v20, não há mais", "INFORMAÇÃO")

# ---------------------------------------------------------------- item 4: aplicação sem ano no fim
sub_fag = apl["FAG6317"]
if sub_fag.endswith(" ; VW - 17-220 8.3 L 12V - DE"):
    trocar(4, "FAG6317", sub_fag[:-len(" - DE")], "o ' - DE' sem ano (o ano se perdeu já na v8) sai; o veículo fica sem ano",
           "DÚVIDA", "P5")
trocar(4, "FAC6108", apl["FAC6108"].replace("Eclipse Cross 1.5 L 16V · em Diante ·", "Eclipse Cross 1.5 L 16V ·"),
       "o 'em Diante' sem ano (já assim na v8) sai; o veículo fica sem ano", "DÚVIDA", "P5")
RX4 = re.compile(r"\b((?:19|20)\d{2}) até(?=\s*(?:·|;|$|\n))")
cont4 = 0
for cod in apl:
    a = apl[cod]
    k = len(RX4.findall(a))
    if k:
        cont4 += k
        trocar(4, cod, RX4.sub(r"\1>", a), f"'AAAA até' sem o ano final vira 'AAAA>' (em diante) ({k})", "DÚVIDA", "P6")


# ---------------------------------------------------------------- item 5: linhas iguais repetidas na mesma APLICACAO
def dedup(a):
    tiradas = []
    partes = re.split(r"(\s*;\s*\n|\n|\s+;\s+)", a)
    vistos, saida = set(), []
    for i in range(0, len(partes), 2):
        seg, sep = partes[i], (partes[i - 1] if i else "")
        chave = n(seg.strip(" ;"))
        if chave and chave in vistos:
            tiradas.append(seg.strip(" ;"))
            continue
        if chave:
            vistos.add(chave)
        pedacos, ja, fica = seg.split(" · "), set(), []
        for j, p in enumerate(pedacos):
            kp = n(p.strip(" ;"))
            # só o veículo inteiro: com ano, começando pelo nome (não por "(", "C/", "S/") e com o pedaço de antes
            # fechado por um ano (senão ele é o detalhe do modelo de antes: "Fox · (Teves) 2010> · Gol · (Teves) 2010>")
            inteiro = (re.search(r"(?:19|20)\d{2}", p) and re.match(r"\s*[A-Za-zÀ-ú0-9]", p) and not re.match(r"\s*([CS]/|\d\.\d)", p)
                       and re.search(r"[A-Za-zÀ-ú]", p) and (j == 0 or re.search(r"(?:19|20)\d{2}>?\s*\w{0,3}\.?\s*$", pedacos[j - 1])))
            if inteiro and kp in ja:
                tiradas.append(p.strip())
                continue
            if inteiro:
                ja.add(kp)
            fica.append(p)
        saida.append(sep + " · ".join(fica))
    novo = "".join(saida)
    # o fim da 1ª cópia levava ";" antes da quebra: se a cópia saiu, o ";" solto do fim também sai
    novo = re.sub(r";\s*$", "", novo) if not a.rstrip().endswith(";") else novo
    return novo, tiradas


cont5 = [0, 0]
for cod in apl:
    novo, tiradas = dedup(apl[cod])
    if tiradas:
        cont5[0] += 1
        cont5[1] += len(tiradas)
        trocar(5, cod, novo, f"{len(tiradas)} linha(s) ou veículo(s) iguais a um de antes saem; fica a 1ª vez", "AUTOMÁTICO")

# ---------------------------------------------------------------- item 8: atributo repetido no mesmo veículo
RX8 = re.compile(r"(?<=· )([^·;\n]{1,40}?) · \1(?= ·| ;|$|\n)")
cont8 = 0
for cod in apl:
    a = apl[cod]
    k = 0
    while True:
        m = next((x for x in RX8.finditer(a) if not re.search(r"(?:19|20)\d{2}", x.group(1))), None)
        if not m:
            break
        a = a[:m.start()] + m.group(1) + a[m.end():]
        k += 1
    if k:
        cont8 += k
        trocar(8, cod, a, f"o atributo repetido em seguida, no mesmo veículo, sai ({k})", "AUTOMÁTICO")

# ---------------------------------------------------------------- item 7: duas marcas no mesmo trecho da referência
cont7 = collections.Counter()
for cod in ref:
    r = ref[cod]
    novo = re.sub(r"(,\s*)Cofap:", r"\1COFAP:", r)
    novo = re.sub(r"Marca Ref\. NAKATA:", "NAKATA:", novo)
    k1 = len(re.findall(r",\s*Cofap:", r))
    k2 = len(re.findall(r"Marca Ref\. NAKATA:", r))
    if novo != r:
        cont7["COFAP"] += k1
        cont7["NAKATA"] += k2
        registrar(7, cod, "REFERENCIAS_CRUZADAS", mascara(r), mascara(novo),
                  "rótulo da 2ª marca em maiúsculas ('Cofap:' -> 'COFAP:') ou sem o prefixo ('Marca Ref. NAKATA:' -> "
                  "'NAKATA:'), como a P8 da v19; o site passa a separar as duas", "DÚVIDA", "P7")
        ref[cod] = novo
for cod in ref:
    r = ref[cod]
    k = len(re.findall(r"\bRT#:", r))
    if k:
        cont7["RT#"] += k
        novo = r.replace("RT#:", "RT:")
        registrar("7b", cod, "REFERENCIAS_CRUZADAS", mascara(r), mascara(novo),
                  "'RT#:' -> 'RT:' (o '#' impede o site de separar a marca RT da NAKATA; o PDF já mostra 'RT')", "DÚVIDA", "P8")
        ref[cod] = novo

# ---------------------------------------------------------------- item 9: ano de variante no caminho de 1 faixa
var = json.load(open(VARIANTE))["v"]
ANO = re.compile(r"(?<!\d)(\d{1,2}/)?(19|20)\d\d(?!\d)")
CIL = re.compile(r"\b\d\.\d\s*(L\b)?|\b\d{1,2}V\b|\b\d{2,4}\s*CC\b")
IDX = {}
for v in VEIC:
    if v[7] == "separado":
        IDX.setdefault((v[0], n(v[2]), n(v[3] or "")), []).append(v)
cont9 = collections.Counter()
for x in var:
    if x["pura"]:
        continue
    t, m = n(x["t"]), n(x["mod"])
    i = t.find(m)
    a = ANO.search(t, i + len(m)) if i >= 0 else None
    if not a:
        continue
    meio = x["t"][i + len(m):a.start()] if i >= 0 else ""
    q = CIL.sub(" ", n(meio))
    if x["ver"]:
        q = re.sub(r"\b" + re.escape(n(x["ver"])).replace(r"\-", r"[\s\-]?") + r"\b", " ", q)
    q = re.sub(r"[\s·\-–(),/;:]+", " ", q).strip()
    if not q or ";" in meio:
        continue
    variante = re.sub(r"\s+", " ", meio).strip(" -–·,(/")
    linhas = IDX.get((x["c"], n(x["mod"]), n(x["ver"])), [])
    cont9["linhas do site"] += 1
    if not linhas:
        cont9["sem linha na VEICULOS"] += 1
        continue
    for v in linhas:
        if v[10] and "variante" in str(v[10]):
            continue
        motivo = f"a faixa {x['f1']} é da variante '{x['mod']} {variante}' do texto, não do {x['mod']} inteiro ({TAREFA}, v21)"
        novo = (str(v[10]) + " | " + motivo) if v[10] else motivo
        registrar(9, v[0], "ANO_DUVIDA", v[10] or "", novo,
                  f"o site mostra {x['f1']} como ano do {x['mod']}; a faixa vem de '{variante}'", "DÚVIDA", "P9", aba="VEICULOS")
        v[10] = novo
        cont9["células ANO_DUVIDA"] += 1

# ---------------------------------------------------------------- item 10: pendências da v20 (V7 e V8)
# V7: JUH70010
oj = str(POR_COD["JUH70010"][CAB.index("OFERECA_JUNTO")] or "")
pares = [c.strip() for c in re.split(r"[;,\s]+", oj) if c.strip() in POR_COD]
faixas_par = sorted({f"{v[4]}–{v[5] or ''}" for v in VEIC if v[0] in pares and v[2] in ("Fiesta", "Ka", "EcoSport", "Focus")})
for v in VEIC:
    if v[0] == "JUH70010":
        motivo = (f"ano solto com mês '(02/2009)' na origem (v8): pode ser 2002–2009 (AA/AAAA), como os 17 casos da V7; "
                  f"o par do 'Leve também' ({', '.join(pares) or 'nenhum'}) tem {', '.join(faixas_par) or 'nenhuma faixa'} ({TAREFA}, v21)")
        novo = (str(v[10]) + " | " + motivo) if v[10] else motivo
        registrar(10, "JUH70010", "ANO_DUVIDA", v[10] or "", novo, f"V7 ({v[2]})", "DÚVIDA", "P10", aba="VEICULOS")
        v[10] = novo
# V8: veículo lido errado pelo extrator e ainda 'separado' (ou duvidoso sem o motivo certo)
def lido_errado(v):
    a = APL0[v[0]]
    if v[2] == "X1" and not re.search(r"\bX\s?-?1\b(?!\s*[,.]\d)", a):
        m = re.search(r"(?i)M\d{2}\s*x\s*1[,.]\d|CR-X 1\.\d", a)
        return f"'X1' lido de '{m.group(0) if m else '?'}' (rosca ou outro modelo), não é o BMW X1"
    if v[1] == "RENAULT" and v[2] in ("12", "19", "21") and not re.search(r"(?i)\b(renault|R)[\s\-]?" + v[2] + r"\b(?![/–\-]\d)", a):
        return f"'RENAULT {v[2]}' lido de uma data ('…/20{v[2]}' ou '–20{v[2]}'), não é o Renault {v[2]}"
    return ""


cont10 = collections.Counter()
for v in VEIC:
    # só a linha que o site lê (separado); as duvidoso já ficam fora do filtro (as RENAULT 12/19/21 de data já têm o motivo da v18)
    if v[7] == "separado" and v[2] in ("X1", "12", "19", "21"):
        mot = lido_errado(v)
        if not mot:
            continue
        mot += f" ({TAREFA}, v21)"
        if v[7] == "separado":
            registrar(10, v[0], "SITUACAO", "separado", "duvidoso", f"V8: {v[1]} {v[2]}", "DÚVIDA", "P11", aba="VEICULOS")
        novo = (str(v[8]) + " | " + mot) if v[8] else mot
        registrar(10, v[0], "MOTIVO", v[8] or "", novo, f"V8: {v[1]} {v[2]}", "DÚVIDA", "P11", aba="VEICULOS")
        v[7], v[8] = "duvidoso", novo
        cont10["V8 lido errado"] += 1
dif = json.load(open(DIF))
for cod, sai, entra in dif:
    for f, mo, ve in entra:
        a = APL0[cod]
        ruim = (f == "RENAULT" and mo in ("12", "19", "21")) or cod.startswith("CAR")
        nome = "LEXUS NX" if (f, mo) == ("HONDA", "NX") else f"{f} {mo} {ve}".strip()
        registrar("10b", cod, "VEICULOS (linha nova?)", "", "" if ruim else nome,
                  "lido de data ou de aro, não entra" if ruim else
                  ("o texto da v19 cita o veículo; a VEICULOS não tem" + ("; a marca certa é LEXUS" if mo == "NX" else "")),
                  "INFORMAÇÃO" if ruim else "DÚVIDA", "" if ruim else "P12", aba="VEICULOS")
        cont10["V8 entra (não)" if ruim else "V8 entra (sim)"] += 1

# ---------------------------------------------------------------- item 11: linhas falsas nas Cruzetas
for cod in ("Veículo", "HYUNDAI", "KIA MOTORS"):
    r = POR_COD[cod]
    conteudo = " | ".join(f"{c}={v if c != 'STATUS_CADASTRO' else '(o status de cadastro de hoje)'}" for c, v in zip(CAB, r)
                          if v not in (None, ""))
    registrar(11, cod, "(linha inteira)", conteudo, "(a linha sai da aba PRODUTOS)",
              "não é produto: é o cabeçalho de um bloco da planilha de origem das cruzetas (código = aplicação = texto do "
              "cabeçalho; sem referência, sem veículo, NO_CATALOGO_DIGITAL = NÃO); aparece no PDF Digital, pág. 107",
              "DÚVIDA", "P13")

# ---------------------------------------------------------------- conferências
for cod in apl:
    if apl[cod] != APL0[cod] and re.search(r"\bnan\b", apl[cod]):
        raise SystemExit(f"[PARADO] sobrou nan em {cod}")
sys.path.insert(0, "/home/user/wt-v21/scripts")
import gerar_site as g  # noqa: E402  (só o refs_de, para medir o efeito do item 7 no site)

ef7 = collections.Counter()
for cod in ref:
    if ref[cod] != REF0[cod]:
        antes = [x for x in g.refs_de(REF0[cod], cod) if re.search(r"[A-Za-z#]{2,}\s*#?:", x["c"])]
        depois = [x for x in g.refs_de(ref[cod], cod) if re.search(r"[A-Za-z#]{2,}\s*#?:", x["c"])]
        ef7["trechos com 2 marcas antes"] += len(antes)
        ef7["trechos com 2 marcas depois"] += len(depois)

# ---------------------------------------------------------------- planilha
NOMES = {1: "01_FAIXAS_E_ANOS_COLADOS", 2: "02_NAN", 3: "03_MF21_MF22", 4: "04_SEM_ANO_NO_FIM", 5: "05_LINHAS_REPETIDAS",
         6: "06_ANO_SOLTO_QUEBRA", 7: "07_DUAS_MARCAS_REF", "7b": "07b_RT_REF", 8: "08_ATRIBUTO_REPETIDO",
         9: "09_ANO_DE_VARIANTE", 10: "10_V7_V8", "10b": "10b_V8_VEICULOS_NOVOS", 11: "11_LINHAS_FALSAS"}
wb = openpyxl.Workbook()
leia = wb.active
leia.title = "LEIA"
COLS = ["CODIGO_BAP", "ABA", "COLUNA", "ANTES", "DEPOIS", "REGRA", "TIPO", "PERGUNTA"]
neg = Font(bold=True)
cab_fill = PatternFill("solid", fgColor="DDEBF7")


def aba(nome, cols, linhas, larg):
    ws = wb.create_sheet(nome[:31])
    ws.append(cols)
    for c in ws[1]:
        c.font, c.fill = neg, cab_fill
    for li in linhas:
        ws.append([("" if li.get(c) is None else str(li.get(c)))[:32000] for c in cols])
    for i, w in enumerate(larg, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "A2"
    return ws


resumo = []
for item, nome in NOMES.items():
    ls = MUD.get(item, [])
    for li in ls:
        for k in ("ANTES", "DEPOIS"):
            li[k] = li[k] if li["COLUNA"] != "REFERENCIAS_CRUZADAS" else mascara(li[k])
    aba(nome, COLS, ls, [14, 11, 16, 70, 70, 50, 13, 10])
    tipos = collections.Counter(li["TIPO"] for li in ls)
    resumo.append((nome, len(ls), len({li["CODIGO_BAP"] for li in ls}), tipos.get("AUTOMÁTICO", 0), tipos.get("CASO", 0),
                   tipos.get("DÚVIDA", 0), tipos.get("INFORMAÇÃO", 0)))

# todas as células (v20 -> final)
todas = []
for cod in apl:
    if apl[cod] != APL0[cod]:
        itens = sorted({str(i) for i, ls in MUD.items() for li in ls if li["CODIGO_BAP"] == cod and li["COLUNA"] == "APLICACAO"
                        and li["TIPO"] != "INFORMAÇÃO"})
        todas.append({"CODIGO_BAP": cod, "ABA": "PRODUTOS", "COLUNA": "APLICACAO", "ITENS": ", ".join(itens),
                      "V20": APL0[cod], "FINAL": apl[cod]})
for cod in ref:
    if ref[cod] != REF0[cod]:
        itens = sorted({str(i) for i, ls in MUD.items() for li in ls if li["CODIGO_BAP"] == cod and li["COLUNA"] == "REFERENCIAS_CRUZADAS"})
        todas.append({"CODIGO_BAP": cod, "ABA": "PRODUTOS", "COLUNA": "REFERENCIAS_CRUZADAS", "ITENS": ", ".join(itens),
                      "V20": mascara(REF0[cod]), "FINAL": mascara(ref[cod])})
aba("TODAS_AS_CELULAS", ["CODIGO_BAP", "ABA", "COLUNA", "ITENS", "V20", "FINAL"], todas, [14, 11, 22, 10, 80, 80])

# LOG_CORRECOES previsto: uma linha por código e aba (as colunas do LOG da base)
TIPO_LOG = {"APLICACAO": "CORRECAO_APLICACAO", "REFERENCIAS_CRUZADAS": "CORRECAO_REFERENCIA", "ANO_DUVIDA": "VEICULO_ANO_DUVIDA",
            "SITUACAO": "VEICULO_DUVIDOSO", "MOTIVO": "VEICULO_DUVIDOSO", "FABRICANTE": "CORRECAO_VEICULO",
            "(linha inteira)": "LINHA_REMOVIDA", "VEICULOS (linha nova?)": "VEICULO_NOVO"}
grupo = collections.OrderedDict()
for item, ls in MUD.items():
    for li in ls:
        if li["TIPO"] == "INFORMAÇÃO" or (li["COLUNA"] == "VEICULOS (linha nova?)" and not li["DEPOIS"]):
            continue
        k = (TIPO_LOG[li["COLUNA"]] if li["ABA"] == "PRODUTOS" or li["COLUNA"] in TIPO_LOG else "CORRECAO_VEICULO",
             li["ABA"], li["CODIGO_BAP"])
        grupo.setdefault(k, []).append((item, li))
log = []
for (tipo, aba_, cod), ls in grupo.items():
    partes = []
    for item, li in ls:
        if li["COLUNA"] == "APLICACAO":
            continue
        partes.append(f"{li['COLUNA']}: '{str(li['ANTES'])[:120]}' -> '{str(li['DEPOIS'])[:120]}' (item {item})")
    if any(li["COLUNA"] == "APLICACAO" for _, li in ls):
        itens = ", ".join(sorted({str(i) for i, li in ls if li["COLUNA"] == "APLICACAO"}))
        partes.insert(0, f"APLICACAO: '{APL0[cod][:150]}' -> '{apl[cod][:150]}' (itens {itens})")
    log.append({"TIPO": tipo, "ABA": aba_, "CODIGO_ANTES_OU_NOVO": cod, "CODIGO_REFERENCIA": "",
                "OBSERVACAO": "; ".join(partes) + f". {TAREFA}, v21, {DATA}."})
aba("LOG_CORRECOES_PREVISTO", ["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"], log, [26, 11, 16, 12, 140])

# LEIA
linhas_leia = [
    ["SIMULAÇÃO da v21 da base unificada (T-0017). Nada foi gravado: sem versão nova, sem commit."],
    ["Fonte: v20 (main e1d9f59), sha256 4372f449…d24b. Data: " + DATA + " (Manaus)."],
    ["TIPO: AUTOMÁTICO = regra mecânica; CASO = correção célula a célula; DÚVIDA = depende da pergunta Pn (o DEPOIS é a "
     "recomendação); INFORMAÇÃO = sem mudança."],
    ["ANTES e DEPOIS de cada aba são os daquele passo (ordem 6, 1, 2, 3, 4, 5, 8; depois 7 e 9 a 11). TODAS_AS_CELULAS: v20 -> final."],
    ["Fornecedor e preço não aparecem: '[fornecedor omitido]' e 'BAP BOX USD [valor omitido]'."],
    [],
    ["ABA", "LINHAS", "CÓDIGOS", "AUTOMÁTICO", "CASO", "DÚVIDA", "INFORMAÇÃO"],
] + [list(r) for r in resumo] + [
    [],
    ["Contagens de ocorrência"],
    ["item 6 · anos soltos juntados", cont6],
    ["item 6b · pedaço do veículo quebrado no meio", cont6b],
    ["item 6c · aviso de página (células)", cont6c],
    ["item 2 · ' - nan'", cont2],
    ["item 4 · 'AAAA até' sem o ano final", cont4],
    ["item 5 · produtos / linhas ou veículos tirados", f"{cont5[0]} / {cont5[1]}"],
    ["item 8 · atributos repetidos tirados", cont8],
    ["item 7 · 'Cofap' / 'Marca Ref. NAKATA' / 'RT#'", f"{cont7['COFAP']} / {cont7['NAKATA']} / {cont7['RT#']}"],
    ["item 7 · trechos do site com 2 marcas (antes -> depois)", f"{ef7['trechos com 2 marcas antes']} -> {ef7['trechos com 2 marcas depois']}"],
    ["item 9", json.dumps(cont9, ensure_ascii=False)],
    ["item 10", json.dumps(cont10, ensure_ascii=False)],
    ["APLICACAO mudadas", sum(1 for c in apl if apl[c] != APL0[c])],
    ["REFERENCIAS_CRUZADAS mudadas", sum(1 for c in ref if ref[c] != REF0[c])],
]
for li in linhas_leia:
    leia.append(li)
leia.column_dimensions["A"].width = 60
wb.save(SAIDA / "SIMULACAO_v21_T-0017.xlsx")

numeros = {"resumo": resumo, "cont6": cont6, "cont6b": cont6b, "cont6c": cont6c, "cont2": cont2, "cont4": cont4, "cont5": cont5, "cont8": cont8, "cont7": cont7,
           "ef7": ef7, "cont9": cont9, "cont10": cont10, "pares_JUH70010": pares, "faixas_par": faixas_par,
           "apl_mudadas": sum(1 for c in apl if apl[c] != APL0[c]), "ref_mudadas": sum(1 for c in ref if ref[c] != REF0[c]),
           "veic_mudadas": sum(1 for ls in MUD.values() for li in ls if li["ABA"] == "VEICULOS" and li["TIPO"] != "INFORMAÇÃO"
                               and li["COLUNA"] != "VEICULOS (linha nova?)"),
           "log": len(log)}
json.dump(numeros, open(SAIDA / "numeros_v21.json", "w"), ensure_ascii=False, indent=1, default=str)
print(json.dumps(numeros, ensure_ascii=False, default=str, indent=1))
