"""T-0017 · SIMULAÇÃO da v19 (APLICACAO e REFERENCIAS_CRUZADAS da aba PRODUTOS). Só lê a base.

Uso:
    python3 simular_v19.py <base.xlsx> <pasta_de_saida>

Saídas na pasta:
    SIMULACAO_v19_T-0017.xlsx      uma aba por item (CODIGO_BAP, COLUNA, ANTES, DEPOIS, REGRA, TIPO, PERGUNTA)
    BASE_v19_SIMULADA.xlsx         cópia da base com a simulação (fora do dados/; só para medir o site)
    mudancas.json, numeros.json

- ANTES e DEPOIS de cada aba são do PASSO daquela regra (as regras rodam em sequência); a aba TODAS_AS_CELULAS
  tem o valor original (v18) e o final.
- TIPO: AUTOMÁTICO (regra mecânica), CASO A CASO (correção proposta célula a célula) ou DÚVIDA (depende da
  pergunta Pn ao Alexandre; o DEPOIS é a recomendação).
- Nunca lê nem escreve preço, custo ou estoque: só as colunas APLICACAO e REFERENCIAS_CRUZADAS (e, para os
  contadores, CATEGORIA, SISTEMA, NO_CATALOGO_DIGITAL, STATUS_CADASTRO e a aba VEICULOS/MODELOS_VEICULO).
"""
from __future__ import annotations

import collections
import json
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl

BASE = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OJ_PARES = Path(sys.argv[3]) if len(sys.argv) > 3 else None
OUT.mkdir(parents=True, exist_ok=True)
TAREFA, DATA = "T-0017", "20/11/2026"


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm(s) -> str:
    return re.sub(r"\s+", " ", sem_acento(str(s or "")).upper()).strip()


def so_codigo(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", sem_acento(s).upper())


# ---------------------------------------------------------------- leitura
wb_l = openpyxl.load_workbook(BASE, read_only=True)
ws = wb_l["PRODUTOS"]
it = ws.iter_rows(values_only=True)
CAB = list(next(it))
POS = {c: i for i, c in enumerate(CAB)}
LINHAS = []          # (n_linha_excel, dict)
for n, r in enumerate(it, start=2):
    LINHAS.append((n, dict(zip(CAB, r))))
VE = list(wb_l["VEICULOS"].iter_rows(values_only=True))
MV = list(wb_l["MODELOS_VEICULO"].iter_rows(values_only=True))
wb_l.close()


def no_site(r) -> bool:
    return str(r.get("NO_CATALOGO_DIGITAL") or "").upper() != "NÃO" and str(r.get("STATUS_CADASTRO") or "").upper() != "INATIVO"


# veículos de cada produto (todas as linhas, separado ou duvidoso) e o dicionário
VE_PROD: dict[str, dict[str, set]] = collections.defaultdict(lambda: collections.defaultdict(set))
for r in VE[1:]:
    if r[0] and r[1] and r[2]:
        VE_PROD[str(r[0]).strip().upper()][norm(r[2])].add(str(r[1]).strip())
DIC: dict[str, set] = collections.defaultdict(set)
for r in MV[1:]:
    if not r[0] or not r[1]:
        continue
    for ap in [r[1]] + re.split(r"\s*,\s*", str(r[2] or "")):
        if ap and str(ap).strip():
            DIC[norm(ap)].add(str(r[0]).strip())
PREFIXO = {"CHEVROLET": "GM", "VOLKSWAGEN": "VW", "MERCEDES-BENZ": "MB"}

MUD = []             # cada passo: dict(item, codigo, coluna, antes, depois, regra, tipo, pergunta)


def registra(item, cod, col, antes, depois, regra, tipo="AUTOMÁTICO", pergunta=""):
    if antes != depois:
        MUD.append(dict(item=item, codigo=cod, coluna=col, antes=antes, depois=depois, regra=regra, tipo=tipo,
                        pergunta=pergunta))
    return depois


# ---------------------------------------------------------------- APLICACAO: regras
ANO_APL = r"(?:\d{2}/){0,2}(?:19|20)\d{2}"
FAIXA_APL = rf"{ANO_APL}(?:\s*(?:at[ée]|a|–|-)\s*{ANO_APL})?(?:\s*(?:>|→|em diante|at[ée]))?"
SO_ANO = re.compile(rf"^(?:\(?(?:[-–]\s*|at[ée]\s+)?{FAIXA_APL}(?:\s*/\s*{FAIXA_APL})?\)?|{ANO_APL}(?:\s*,\s*{ANO_APL})+)$", re.I)
TEM_ANO = re.compile(r"(?<![\d.,])(?:\d{1,2}/)?(?:19[5-9]\d|20[01]\d|202[0-8])(?![\d.,])|(?<![\d/])\d{2}/\d{2}(?![\d/\"])|\d{2}/\.{2,}|\.{2,}/\d{2}|>\s*$")
MARCA_INI = re.compile(r"^\s*[A-ZÀ-Ú][A-ZÀ-Ú0-9 /&.\-]{0,30}?\s+-\s+")
SEP_SEG = re.compile(r"\s+·\s+")
SEP_BLOCO = re.compile(r"\s+;\s+")


def ano_fmt(s: str) -> str:
    """'2011 até 2014' → '2011–2014'; '2012 em Diante' → '2012>'; '2002 à 2010' → '2002–2010' (só 4 dígitos)."""
    def faixa(m):
        a, b = int(m.group(1)), int(m.group(2))
        return f"{a}–{b}" if 1950 <= a <= b else m.group(0)
    s = re.sub(r"(?<![\d.,/])((?:19|20)\d{2})\s*(?:at[ée]|à|-|–)\s*((?:19|20)\d{2})(?![\d.,])", faixa, s, flags=re.I)
    s = re.sub(r"(?<![\d.,/])((?:19|20)\d{2})\s+em\s+diante\b", r"\1>", s, flags=re.I)
    return s


def numero_puro(seg: str) -> bool:
    return bool(re.fullmatch(r"(?:[A-ZÀ-Ú][A-ZÀ-Ú0-9 /&.\-]{0,30}?\s+-\s+)?\d{3,5}", seg.strip()))


# 1 · modelo colado no ano pelo "–" ("1924–1979 até 2026", "F2000–2001 até 2026", "1938–1999–2026", "F-2000–1980–1985")
COLADO = re.compile(r"(?<![\d/.,])((?:F-?)?\d{3,5}S?)–((?:19|20)\d{2})(\s*(?:até|–)\s*)((?:19|20)\d{2})(?![\d])")


def descolar(a: str) -> tuple[str, list[str]]:
    achados = []

    def troca(m):
        mod, a1, sep, a2 = m.group(1), m.group(2), m.group(3), m.group(4)
        achados.append(m.group(0))
        if re.fullmatch(r"\d{3,5}", mod):            # número puro: o ano vai entre parênteses
            return f"{mod} ({a1}–{a2})"
        return f"{mod} {a1}–{a2}"
    a = COLADO.sub(troca, a)

    def p2008(m):
        achados.append(m.group(0))
        return f"PEUGEOT - 2008 ({m.group(1)}>)"
    a = re.sub(r"PEUGEOT - 2008–((?:19|20)\d{2})\s*(?:em diante|>)", p2008, a, flags=re.I)
    return a, achados


FIM_ANO = re.compile(r"(?:(?<![\d.,])(?:\d{1,2}/)?(?:19[5-9]\d|20[01]\d|202[0-8])|(?<![\d/])\d{2}/\d{2})\s*(?:>|\)|em diante|\*)?\s*$", re.I)
CONTINUA = re.compile(r"(?i)^(?:at[ée]|a|–|-)\s")
MARCAS_CONHECIDAS = {norm(r[0]) for r in MV[1:] if r[0]} | {"GM", "VW", "MB", "GENERAL MOTORS", "RAM", "CITROEN"}
MARCA_SO = re.compile(r"^\s*([A-ZÀ-Ú][A-ZÀ-Ú /&.\-]{0,25}?)\s+-\s+(.*)$")


def termina_com_ano(seg: str) -> bool:
    return bool(FIM_ANO.search(seg)) and not numero_puro(seg)


def marca_e_ano(st: str) -> bool:
    """'RAM - 2009–2020', 'PEUGEOT - 2013>': marca conhecida e só o ano (o modelo se perdeu)."""
    m = MARCA_SO.match(st)
    return bool(m and norm(m.group(1)) in MARCAS_CONHECIDAS and SO_ANO.match(m.group(2).strip()) and not re.fullmatch(r"\d{3,5}(?:\s*,\s*\d{3,5})+", m.group(2).strip()))


def juntar(cod: str, a: str) -> tuple[str, list[str], list[str]]:
    """Uma linha por veículo: o pedaço só de ano entra no veículo de antes. Devolve (texto, juntados, órfãos)."""
    juntados, orfaos, blocos = [], [], []
    for bloco in SEP_BLOCO.split(a):
        saida: list[str] = []
        for s in SEP_SEG.split(bloco):
            st = s.strip()
            if st and SO_ANO.match(st) and saida:
                ante = saida[-1]
                if CONTINUA.match(st) and termina_com_ano(ante):      # "· 2005 · até 2010", "01/1991 · - 12/2020"
                    saida[-1] = ano_fmt(f"{ante} {st}")
                    juntados.append(st)
                    continue
                if numero_puro(ante) or (not termina_com_ano(ante) and re.search(r"[A-Za-zÀ-ú0-9]", ante)):
                    y = ano_fmt(st)
                    if numero_puro(ante) and not y.startswith("("):
                        y = f"({y})"
                    saida[-1] = f"{ante} {y}"
                    juntados.append(f"{ante} · {st}")
                    continue
            if st and SO_ANO.match(st):
                orfaos.append(st)
            saida.append(s)
        blocos.append(" · ".join(saida))
    return " ; ".join(blocos), juntados, orfaos


def tirar_orfaos(a: str) -> tuple[str, list[str]]:
    """Ano sem veículo: no começo do bloco, depois de um veículo que já tem ano, ou 'MARCA - ano'."""
    tirados, blocos = [], []
    for bloco in SEP_BLOCO.split(a):
        segs = SEP_SEG.split(bloco)
        saida = []
        i = 0
        while i < len(segs):
            st = segs[i].strip()
            ante = saida[-1] if saida else ""
            if SO_ANO.match(st) and not re.fullmatch(r"(?:19|20)\d{2}(?:\s*,\s*(?:19|20)\d{2})+", st) and (not ante or termina_com_ano(ante)):
                tirados.append(st)
                i += 1
                continue
            if marca_e_ano(st) and not saida:
                tirados.append(st)
                if i + 1 < len(segs):
                    segs[i + 1] = MARCA_SO.match(st).group(1) + " - " + segs[i + 1].strip()
                i += 1
                continue
            saida.append(segs[i])
            i += 1
        if saida:
            blocos.append(" · ".join(saida))
    return " ; ".join(blocos), tirados


# 3 · marca que falta no começo do bloco
def marca_do_segmento(cod: str, seg: str) -> tuple[set, str]:
    u = " " + re.sub(r"[^A-Z0-9]+", " ", norm(seg)) + " "
    melhor, pos, onde = set(), 10 ** 6, ""
    fontes = [(VE_PROD.get(cod, {}), "VEICULOS do produto"), (DIC, "dicionário MODELOS_VEICULO")]
    for fonte, nome in fontes:
        for mod, fabs in fonte.items():
            k = " " + re.sub(r"[^A-Z0-9]+", " ", mod).strip() + " "
            if len(k.strip()) < 2:
                continue
            i = u.find(k)
            if i >= 0 and (i < pos or (i == pos and len(k) > len(onde))):
                melhor, pos, onde = set(fabs), i, k
        if melhor:
            return melhor, nome
    return set(), ""


def pref(fab: str) -> str:
    return PREFIXO.get(fab.upper(), fab.upper())


def por_marca(cod: str, bloco: str) -> tuple[str | None, list[str], list[str]]:
    segs = SEP_SEG.split(bloco)
    marcas, notas = [], []
    for s in segs:
        fabs, fonte = marca_do_segmento(cod, s)
        marcas.append(next(iter(fabs)) if len(fabs) == 1 else None)
        if len(fabs) > 1:
            notas.append(f"'{s}': mais de uma marca ({', '.join(sorted(fabs))})")
    for i in range(1, len(marcas) - 1):           # marca diferente dos dois vizinhos, que concordam: fica a dos vizinhos
        a_, d_ = marcas[i - 1], marcas[i + 1]
        if marcas[i] and a_ and a_ == d_ and marcas[i] != a_:
            notas.append(f"'{segs[i]}': {marcas[i]} pelo dicionário, {a_} pelos vizinhos (fica {a_})")
            marcas[i] = a_
    for i, m in enumerate(marcas):               # vizinhos da mesma marca (a lista vem em ordem de marca)
        if m is None:
            antes = next((marcas[j] for j in range(i - 1, -1, -1) if marcas[j]), None)
            depois = next((marcas[j] for j in range(i + 1, len(marcas)) if marcas[j]), None)
            if antes and antes == depois:
                marcas[i] = antes
                notas.append(f"'{segs[i]}': marca pelos vizinhos ({antes})")
    for i, m in enumerate(marcas):
        ws_ = set(re.findall(r"[A-Z]+(?:[ -][A-Z]+)?", norm(segs[i])))
        outra = sorted(w for w in ws_ if w in MARCAS_CONHECIDAS and m and norm(pref(m)) != w and norm(m) != w and w not in ("GM", "VW", "MB"))
        if outra:
            notas.append(f"'{segs[i]}': o texto cita {', '.join(outra)} e o bloco ficou {pref(m)}")
    faltam = [segs[i] for i, m in enumerate(marcas) if not m]
    achou = len(segs) - len(faltam)
    if achou < 2 or achou < 0.6 * len(segs):
        return None, notas, faltam
    grupos = []
    for s, m in zip(segs, marcas):
        k = pref(m) if m else ""
        if grupos and grupos[-1][0] == k:
            grupos[-1][1].append(s)
        else:
            grupos.append([k, [s]])
    if faltam:
        notas.append("sem marca achada (ficam num bloco sem marca, na mesma ordem): " + " · ".join(faltam))
    return " ; ".join((f"{m} - " if m else "") + " · ".join(ss) for m, ss in grupos), notas, faltam


# 4 · casos (texto proposto célula a célula)
CASOS = {
    "AMT7036": ("GM - Corsa Hatch / Sedan (Enc. Mod. Antigo) 04/2002–07/2012 · Meriva 08/2002–07/2012",
                "CASO A CASO", "o ano de cada veículo junto dele: o '/ Meriva' estava dentro do pedaço do ano", ""),
    "FCB6121": (None, "CASO A CASO", "marca escrita como veículo ('Asia Motors ·', 'Daihatsu ·', 'Mazda ·') vira começo de bloco", ""),
    "BIE20006": ("FIAT - Stilo 2003–2010 · Punto 2007–2017 · Linea 2008–2016 · Bravo 2010–2016 · Argo 2017> · Cronos 2017> · Strada 2020> ; FIAT - Fastback 1.0 L 12V 2022> · Fastback 1.3 L 16V 2022> · Pulse 1.0 L 12V 2021> · Pulse 1.3 L 8V 2021>",
                 "DÚVIDA", "embaralhado: '2010–2016–2007>Argo' e '2020>/20'. Proposta: sai o '–2007>' (sem veículo) e o '/20'; um veículo por pedaço, com a marca", "P4"),
    "CIL8500": ("FIAT - Brava 2000–2003 · Doblô 2002> · D/e Tras · 13/16\" (20,64 mm)", "DÚVIDA",
                "os anos na ordem dos veículos (Brava 2000–2003, Doblô 2002>); a medida 13/16\" fica", "P5"),
}


def caso_fcb6121(a: str) -> str:
    a = a.replace("Asia Motors · Rocsta", "ASIA MOTORS - Rocsta").replace("· Asia Motors · Topic", "· Topic")
    a = a.replace(" · Daihatsu · Rocky", " ; DAIHATSU - Rocky").replace(" · Mazda · B2200", " ; MAZDA - B2200")
    return a


# 4 · formatos de ano com 2 dígitos (só os sem dúvida)
def ano2(s: str) -> int:
    n = int(s)
    return 2000 + n if n <= 35 else 1900 + n


def anos_2dig(a: str) -> tuple[str, list[str]]:
    feitos = []

    def mm_aa(m):                         # "01/95 - 12/12" → "01/1995–12/2012"
        m1, a1, m2, a2 = m.group(1), m.group(2), m.group(3), m.group(4)
        if 1 <= int(m1) <= 12 and 1 <= int(m2) <= 12 and ano2(a1) <= ano2(a2):
            feitos.append(m.group(0))
            return f"{m1}/{ano2(a1)}–{m2}/{ano2(a2)}"
        return m.group(0)
    a = re.sub(r"(?<![\d/.,])(\d{2})/(\d{2})\s*(?:-|–|a|até)\s*(\d{2})/(\d{2})(?![\d/\"'])", mm_aa, a)

    def aa_aa(m):                         # "(92/96)" → "(1992–1996)", só com o 1º número > 12 (não é mês)
        x, y = m.group(1), m.group(2)
        if int(x) > 12 and ano2(x) <= ano2(y) and ano2(y) - ano2(x) <= 40:
            feitos.append(m.group(0))
            return f"({ano2(x)}–{ano2(y)})"
        return m.group(0)
    a = re.sub(r"\(\s*(\d{2})\s*/\s*(\d{2})\s*\)", aa_aa, a)

    def ate_aa(m):                        # "../95", ".../08" → "até 1995"
        feitos.append(m.group(0))
        return f"até {ano2(m.group(1))}"
    a = re.sub(r"(?<![\w])\.{2,3}\s*/\s*(\d{2})(?![\d/])", ate_aa, a)
    return a, feitos


# 4 · caixa dos modelos (só em texto de caixa mista; a diferença é só de maiúscula)
CAIXA = {}
SIGLAS_MODELO = {"GLA", "GLB", "GLC", "GLE", "GLS", "CLA", "CLS", "ASX", "CBX", "NXR", "YBR", "FMX", "WRX", "RAV4", "WR-V", "SW4", "DS3"}
for r in MV[1:]:
    m_ = str(r[1] or "")
    if m_.upper() == m_ and len(m_) >= 3 and (re.search(r"\d|-", m_) or m_ in SIGLAS_MODELO) and re.search(r"[A-Z]{2}", m_):
        CAIXA[m_.lower()] = m_
for m_ in SIGLAS_MODELO:
    CAIXA.setdefault(m_.lower(), m_)


LIGA = {}
for _k in list(DIC):
    for _lig in ("FI", "FL"):
        _i = _k.find(_lig)
        while _i > 0:
            LIGA[(_k[:_i] + " " + _k[_i + 2:]).strip()] = _k
            _i = _k.find(_lig, _i + 1)


def caixa(a: str) -> tuple[str, list[str]]:
    feitos = []

    def lig(m):                       # "Za ra" → "Zafira", "Paci ca" → "Pacifica" (o "fi" perdido na importação)
        w = m.group(0)
        alvo = LIGA.get(norm(w))
        if alvo and norm(w) not in DIC:
            novo = w.replace(" ", "fi" if "FI" in alvo else "fl", 1)
            if norm(novo) == alvo:
                feitos.append(f"{w} → {novo}")
                return novo
        return w
    a = re.sub(r"(?<![\wÀ-ú])[A-Z][a-zà-ú]{1,8} [a-zà-ú]{1,8}(?![\wÀ-ú])", lig, a)
    out = []
    for bloco in SEP_BLOCO.split(a):
        segs = []
        for s in SEP_SEG.split(bloco):
            corpo = MARCA_INI.sub("", s)
            if re.search(r"[a-zà-ú]", corpo):
                def tr(m):
                    w = m.group(0)
                    alvo = CAIXA.get(w.lower())
                    if alvo and alvo != w and alvo.lower() == w.lower() and not w.isupper():
                        feitos.append(f"{w} → {alvo}")
                        return alvo
                    return w
                ini = s[: len(s) - len(corpo)]
                corpo = re.sub(r"(?<![\wÀ-ú-])[A-Za-zÀ-ú][\wÀ-ú-]*(?:\s[A-Za-z]\b)?", tr, corpo)
                s = ini + corpo
            segs.append(s)
        out.append(" · ".join(segs))
    return " ; ".join(out), feitos


FALSO_1960 = re.compile(r"\s*(?:\(|·\s*)?1960\s*(?:–|até)\s*2026\)?")

# ---------------------------------------------------------------- REFERENCIAS_CRUZADAS: regras
PROPRIAS = ("BAP PN_2", "BAPTA PN")
PLACEHOLDER = re.compile(r"^(?:NT|N[ÃA]O TEM|S/\s*REF\.?|S/N|S/ ref[ºo°]? original|#N/A)$", re.I)


def partes_vivas(t: str):
    """Divide a célula em trechos 'vivos' (fora do histórico '| ...') para trabalhar só neles."""
    return re.split(r"(\s*;\s*)", t)


def tira_ref(t: str, pred) -> tuple[str, list[str]]:
    """Tira 'RÓTULO: código' (do trecho vivo) quando pred(rotulo, codigo). O separador de depois sai junto."""
    tirados = []
    pedacos = partes_vivas(t)
    novo = []
    for p in pedacos:
        if re.fullmatch(r"\s*;\s*", p):
            novo.append(p)
            continue
        vivo, _, hist = p.partition(" | ")
        itens = re.split(r"(,\s*)", vivo)
        keep = []
        for i in range(0, len(itens), 2):
            x = itens[i]
            m = re.match(r"^(\s*(?:(?:CROSS\s+)?REFER[ÊE]NC[IE]AS?(?:\s+CRUZADAS?)?\s*-\s*)?)([^:]{1,60}?)\s*:\s*(.+?)\s*$", x)
            if m and pred(m.group(2).strip(), m.group(3).strip()):
                tirados.append(x.strip())
                if m.group(1).strip():          # o "REFERENCIAS CRUZADAS - " passa para o próximo
                    if i + 2 < len(itens):
                        itens[i + 2] = m.group(1) + itens[i + 2].lstrip()
                continue
            keep.append(x)
        vivo = ", ".join(k.strip() for k in keep if k.strip())
        novo.append(vivo + (" | " + hist if hist else ""))
    # tira os ";" que sobraram vazios
    s = "".join(novo)
    s = re.sub(r"^\s*;\s*|\s*;\s*$", "", s)
    s = re.sub(r"(\s*;\s*){2,}", "; ", s)
    return s.strip(), tirados


def dedup(t: str) -> tuple[str, list[str]]:
    vistos, tirados = set(), []

    def pred(rot, cod):
        k = (norm(re.sub(r"\s+PN$", "", rot)), so_codigo(cod))
        if k in vistos:
            tirados.append(f"{rot}: {cod}")
            return True
        vistos.add(k)
        return False
    s, _ = tira_ref(t, pred)
    return s, tirados


# ---------------------------------------------------------------- roda
FINAL_APL, FINAL_REF = {}, {}
ORFAOS, JUNTADOS = collections.Counter(), collections.Counter()
SEM_MARCA_FORA = []
SEM_MARCA_PARCIAL = []
for n, r in LINHAS:
    cod = str(r.get("CODIGO_BAP") or "").strip()
    if not cod:
        continue
    COD = cod.upper()
    # ---------------- APLICACAO
    a0 = r.get("APLICACAO")
    if isinstance(a0, str) and a0.strip():
        a = a0
        if cod in CASOS and CASOS[cod][0]:
            txt, tipo, regra, perg = CASOS[cod]
            a = registra("4_CASOS", cod, "APLICACAO", a, txt, regra, tipo, perg)
        else:
            if cod == "FCB6121":
                a = registra("4_CASOS", cod, "APLICACAO", a, caso_fcb6121(a), CASOS[cod][2], CASOS[cod][1])
            # 1a · modelo colado no ano
            b, ach = descolar(a)
            a = registra("1_SO_ANO", cod, "APLICACAO", a, b, "modelo colado no ano pelo '–' (" + "; ".join(ach) + "): o 1º número é o modelo")
            # 1b · uma linha por veículo
            b, junt, orf = juntar(cod, a)
            if junt:
                JUNTADOS[cod] = len(junt)
                a = registra("1_LINHA_POR_VEICULO", cod, "APLICACAO", a, b,
                             f"uma linha por veículo: {len(junt)} pedaço(s) só de ano juntado(s) ao veículo de antes"
                             " ('Modelo · AAAA até AAAA' → 'Modelo AAAA–AAAA'; modelo só de número: 'NNNN (AAAA–AAAA)')")
            # 1c · ano sem veículo (órfão): sai (P1)
            b, tir = tirar_orfaos(a)
            if tir:
                ORFAOS[cod] = len(tir)
                a = registra("1_SO_ANO", cod, "APLICACAO", a, b,
                             f"ano sem veículo (o modelo se perdeu na importação, já assim na v8): sai {', '.join(repr(x) for x in tir)}",
                             "DÚVIDA", "P1")
            # 3 · marca que falta no 1º bloco
            blocos = SEP_BLOCO.split(a)
            if len(blocos) > 1 and not MARCA_INI.match(blocos[0]) and len(SEP_SEG.split(blocos[0])) >= 2:
                novo, notas, faltam = por_marca(COD, blocos[0])
                if novo and faltam:
                    SEM_MARCA_PARCIAL.append((cod, faltam))
                if novo:
                    b = " ; ".join([novo] + blocos[1:])
                    a = registra("3_MARCA_QUE_FALTA", cod, "APLICACAO", a, b,
                                 "marca no começo de cada bloco, pela aba VEICULOS do produto e pelo dicionário"
                                 + (" · " + " · ".join(notas) if notas else ""),
                                 "DÚVIDA" if notas else "AUTOMÁTICO", "P2" if notas else "")
                else:
                    SEM_MARCA_FORA.append((cod, faltam[:6]))
            # 4 · data colada sem o traço ("01/201112/2021" → "01/2011–12/2021")
            b = re.sub(r"(?<!\d)(\d{2}/(?:19|20)\d{2})(\d{2}/(?:19|20)\d{2})(?!\d)", r"\1–\2", a)
            a = registra("13_DATA_SEM_TRACO", cod, "APLICACAO", a, b, "data colada sem o traço: 'MM/AAAAMM/AAAA' → 'MM/AAAA–MM/AAAA'")
            # 4 · ano solto "(MM/AAAA)" = a partir de (R-20261120-132230-alexandre, "1) a")
            if cod == "JUH70010":
                b = re.sub(r"\((\d{2}/(?:19|20)\d{2})\)", r"\1>", a)
                a = registra("14_JUH70010", cod, "APLICACAO", a, b,
                             "ano solto '(MM/AAAA)' → 'MM/AAAA>': a partir de (R-20261120-132230-alexandre, '1) a')", "CASO A CASO")
            # 4 · formatos de ano
            b, f2 = anos_2dig(a)
            b2 = ano_fmt(b)
            if b2 != a:
                a = registra("4_FORMATO_ANO", cod, "APLICACAO", a, b2,
                             "ano com 4 dígitos, intervalo com '–', 'em diante' com '>'" + (f" ({'; '.join(f2[:4])})" if f2 else ""))
            # 4 · 1960–2026 (faixa falsa)
            if FALSO_1960.search(a):
                b = FALSO_1960.sub("", a)
                a = registra("4_FORMATO_ANO", cod, "APLICACAO", a, b,
                             "'1960–2026' não é ano de verdade (enche o 'todos os anos'): sai, o veículo fica sem ano", "DÚVIDA", "P3")
            # 4 · caixa
            b, fc = caixa(a)
            if fc:
                a = registra("4_CAIXA", cod, "APLICACAO", a, b, "caixa do modelo como no dicionário: " + "; ".join(sorted(set(fc))[:6]), "CASO A CASO")
        if a != a0:
            FINAL_APL[cod] = (n, a0, a)
    # ---------------- REFERENCIAS_CRUZADAS
    t0 = r.get("REFERENCIAS_CRUZADAS")
    if isinstance(t0, str) and t0.strip():
        t = t0
        # 7 · BDA50024: o bloco repetido inteiro
        if cod == "BDA50024":
            t = registra("7_REPETIDAS", cod, "REFERENCIAS_CRUZADAS", t,
                         "REFERENCIAS CRUZADAS - INDISA PN: 452506, SCHADEK PN: 20256-A, URBA PN: UB0639, URBA PN: UB0638; INDISA: 452508",
                         "o bloco 'REFERENCIAS CRUZADAS - INDISA, SCHADEK, URBA' vinha duas vezes; fica uma vez, com as duas URBA (UB0639 e UB0638)",
                         "CASO A CASO")
        # 10 · casos
        sehs = {
            "SEH80042": "AXIOS: LT30383; OEM: 391008165R; NAKATA: NJH29-475S",
            "SEH80043": "OEM: 391018617R; NAKATA: NJH30-476S",
            "SEH80044": "NAKATA: NJH15-463S",
            "SEH80045": "IMA: AL-1450; NAKATA: NJH12-450S",
            "SEH80046": "AXIOS: LT30274; NAKATA: NJH24-575S",
            "SEH80048": "OEM: 26300294; NAKATA: NJH28-284S",
            "SEH80049": "OEM: 26300293; NAKATA: NJH28-285S",
            "SEH80056": "NAKATA: NJH19-489S",
            "SEH80057": "NAKATA: NJH20-490S",
        }
        if cod in sehs:
            t = registra("10_CODIGOS_ESTRANHOS", cod, "REFERENCIAS_CRUZADAS", t, sehs[cod],
                         "'Nakata' / 'Spicer' sem código saem; 'Axios LT…', 'Ima AL-…' e 'OEM …' viram 'MARCA: código'; o '| Original' repetia o OEM",
                         "CASO A CASO")
        if cod == "CFR9006":
            t = registra("10_CODIGOS_ESTRANHOS", cod, "REFERENCIAS_CRUZADAS", t, "SCHULZ: 816.5028-0 | ANTERIOR: SCHULZ: 815.5028-0",
                         "a família CFR90xx é toda SCHULZ 816.50xx-0 e a correção '816.5028-0' já estava no histórico; o 815 vai para o histórico",
                         "DÚVIDA", "P9")
        if re.search(r"Pruduct PN SUNRISE", t):
            t = registra("10_CODIGOS_ESTRANHOS", cod, "REFERENCIAS_CRUZADAS", t, "",
                         "'Pruduct PN SUNRISE' é o número da fábrica da roda [SUPOSIÇÃO: SUNRISE é o fornecedor]; sai da referência",
                         "DÚVIDA", "P10")
        # 10 · texto de aplicação dentro da referência ("APLICAÇÃO REVISADA (Conforme catálogo NAKATA).: …")
        m_ap = re.search(r",?\s*APLICA[ÇC][ÃA]O REVISADA[^:]*:\s*([^;|]*)", t, re.I)
        if m_ap:
            apl = norm(r.get("APLICACAO") or "")
            mods = [w for w in re.findall(r"[A-Za-zÀ-ú][\wÀ-ú-]{2,}", m_ap.group(1))]
            falta = sorted({w for w in mods if norm(w) not in apl})
            b = (t[:m_ap.start()] + t[m_ap.end():]).strip(" ,;")
            t = registra("12_APLICACAO_NA_REF", cod, "REFERENCIAS_CRUZADAS", t, b,
                         "o texto de aplicação estava dentro da referência; a APLICACAO já tem esse texto" if not falta else
                         "o texto de aplicação estava dentro da referência; a APLICACAO não cita: " + ", ".join(falta[:6]),
                         "AUTOMÁTICO" if not falta else "DÚVIDA", "" if not falta else "P15")
        # 10 · "SKF / PERFEC PN: VKJA …": o código é da SKF (o prefixo VKJA é da SKF)
        b = re.sub(r"SKF\s*/\s*PERFEC\s+PN:\s*(VKJA)", r"SKF: \1", t)
        t = registra("14_JUH70010", cod, "REFERENCIAS_CRUZADAS", t, b,
                     "'SKF / PERFEC PN: VKJA…' → 'SKF: VKJA…' (o site lia 'SKF' como código sem marca)")
        # 5 · referência própria
        b, tir = tira_ref(t, lambda rot, c: re.sub(r"\s+", " ", rot.upper()) in PROPRIAS and so_codigo(c) == so_codigo(cod))
        if tir:
            t = registra("5_REF_PROPRIA", cod, "REFERENCIAS_CRUZADAS", t, b, "sai a referência ao próprio código: " + "; ".join(tir))
        b, tir = tira_ref(t, lambda rot, c: re.sub(r"\s+", " ", rot.upper()) not in PROPRIAS + ("BAP",) and so_codigo(c) == so_codigo(cod))
        if tir:
            t = registra("5_REF_PROPRIA", cod, "REFERENCIAS_CRUZADAS", t, b, "sai a referência de outra marca com o próprio código BAP: " + "; ".join(tir))
        # 6 · preço no histórico
        if re.search(r"BAP\s*BOX", t, re.I):
            b = re.sub(r"\s*BAP\s*BOX\s*USD\s*[\d.,]+", "", t, flags=re.I)
            t = registra("6_USD", cod, "REFERENCIAS_CRUZADAS", t, b,
                         "sai o preço de compra ('BAP BOX USD …') do histórico '| ANTERIOR'; o resto do histórico fica", "DÚVIDA", "P7")
        # 10 · #N/A e "não tem"
        b, tir = tira_ref(t, lambda rot, c: bool(PLACEHOLDER.match(c.strip())))
        if tir:
            eh_na = all("#N/A" in x for x in tir)
            t = registra("10_CODIGOS_ESTRANHOS", cod, "REFERENCIAS_CRUZADAS", t, b,
                         ("'#N/A' é erro de planilha, não código: sai " if eh_na else "sem código ('NT', 'NÃO TEM', 'S/REF', 'S/N'): sai ") + "; ".join(tir),
                         "AUTOMÁTICO" if eh_na else "DÚVIDA", "" if eh_na else "P11")
        # 7 · repetidas (mesma marca e mesmo código no trecho vivo)
        b, tir = dedup(t)
        if tir:
            t = registra("7_REPETIDAS", cod, "REFERENCIAS_CRUZADAS", t, b, "sai a 2ª vez da mesma referência: " + "; ".join(tir))
        # 9 · caixa da marca Nakata
        b = re.sub(r"(?<![\w])Nakata(?=\s*(?:PN\s*)?:)", "NAKATA", t)
        t = registra("9_NAKATA", cod, "REFERENCIAS_CRUZADAS", t, b, "rótulo 'Nakata' → 'NAKATA' (padrão da base)", "DÚVIDA", "P8")
        if t != t0:
            FINAL_REF[cod] = (n, t0, t)

# ---------------------------------------------------------------- 11 · OFERECA_JUNTO × veículo
FINAL_OJ, OJ = {}, []
if OJ_PARES and OJ_PARES.exists():
    OJ = json.load(open(OJ_PARES))
    ruins = collections.defaultdict(list)
    for x in OJ:
        if x["nivel"] in ("sem_veiculo_em_comum", "modelo_em_comum_motor_ou_ano_nao"):
            ruins[x["c"]].append(x)
    LIN = {str(r.get("CODIGO_BAP") or "").strip().upper(): (n, r) for n, r in LINHAS}
    for cod, xs in sorted(ruins.items()):
        n, r = LIN[cod.upper()]
        o0 = str(r.get("OFERECA_JUNTO") or "")
        toks = [x for x in re.split(r"\s*·\s*", o0) if x.strip()]
        novo, ja = [], {so_codigo(x) for x in toks}
        notas = []
        for tk in toks:
            ruim = next((x for x in xs if so_codigo(x["oj"]) == so_codigo(tk)), None)
            if not ruim:
                novo.append(tk)
                continue
            if ruim.get("troca") and so_codigo(ruim["troca"]) not in ja:
                novo.append(ruim["troca"])
                ja.add(so_codigo(ruim["troca"]))
                notas.append(f"{tk} → {ruim['troca']} (mesmo {'PRODUTO' if ruim.get('troca_grupo') == 'produto' else 'FAMILIA'}, {ruim['troca_veiculos']} veículo(s) em comum{', com cilindrada e ano' if ruim.get('troca_exata') else ', sem cilindrada ou ano para conferir'})")
            else:
                notas.append(f"{tk} sai")
        o1 = " · ".join(novo)
        nivel = "; ".join(sorted({x["nivel"] for x in xs}))
        # R-20261120-182200-alexandre ("2) a"): a varredura vira PROPOSTA; trocar por um item da mesma família com o mesmo
        # veículo (marca, modelo, cilindrada e ano) ou tirar, quando não há um.
        registra("11_OFERECA_JUNTO", cod, "OFERECA_JUNTO", o0, o1,
                 f"item do 'Leve também' sem o mesmo veículo ({nivel}): " + "; ".join(notas), "DÚVIDA", "P13")
        FINAL_OJ[cod] = (n, o0, o1)

# ---------------------------------------------------------------- contagens que não mudam a base
CONTA = {}
P = [r for _, r in LINHAS if r.get("CODIGO_BAP")]
CONTA["usd_refs"] = sum(1 for r in P if re.search(r"\bUSD\b", str(r.get("REFERENCIAS_CRUZADAS") or "")))
CONTA["usd_dados_adicionais"] = sum(1 for r in P if re.search(r"(?i)usd", str(r.get("DADOS_ADICIONAIS") or "")))
CONTA["tinken_vivo"] = sum(len(re.findall(r"TINKEN", str(r.get("REFERENCIAS_CRUZADAS") or "").split(" | ")[0])) for r in P)
tk = 0
for r in P:
    for parte in re.split(r"\s*;\s*", str(r.get("REFERENCIAS_CRUZADAS") or "")):
        tk += parte.split(" | ")[0].count("TINKEN")
CONTA["tinken_vivo_por_trecho"] = tk
CONTA["tinken_historico"] = sum(str(r.get("REFERENCIAS_CRUZADAS") or "").count("TINKEN") for r in P) - tk
CONTA["bap_paf"] = sum(1 for r in P if re.search(r"(?:^|;\s*)BAP:\s*PAF\.", str(r.get("REFERENCIAS_CRUZADAS") or "")))
CONTA["cat_igual_sistema_site"] = dict(collections.Counter(
    str(r.get("CATEGORIA")) for r in P if no_site(r) and str(r.get("CATEGORIA") or "").upper() == str(r.get("SISTEMA") or "").upper()))
CONTA["terminal_axial_numericos"] = sum(1 for r in P if re.fullmatch(r"\d+", str(r.get("CODIGO_BAP")).strip()))
CONTA["terminal_axial_numericos_no_site"] = sum(1 for r in P if re.fullmatch(r"\d+", str(r.get("CODIGO_BAP")).strip()) and no_site(r))
lab = collections.Counter()
for r in P:
    for parte in re.split(r"\s*;\s*", str(r.get("REFERENCIAS_CRUZADAS") or "")):
        for m in re.finditer(r"(?:^|,\s*|\s-\s)(Nakata|NAKATA)(\s+PN)?\s*:", parte.split(" | ")[0]):
            lab[m.group(1) + (m.group(2) or "")] += 1
CONTA["rotulos_nakata"] = dict(lab)
CONTA["celulas_nakata_minusc"] = sum(1 for r in P if re.search(r"(?<![\w])Nakata(?=\s*(?:PN\s*)?:)", str(r.get("REFERENCIAS_CRUZADAS") or "")))
CONTA["sem_marca_fora"] = len(SEM_MARCA_FORA)
CONTA["sem_marca_parcial"] = len(SEM_MARCA_PARCIAL)
CONTA["sem_marca_parcial_modelos"] = sum(len(f) for _, f in SEM_MARCA_PARCIAL)
CONTA["orfaos"] = sum(ORFAOS.values())
CONTA["orfaos_produtos"] = len(ORFAOS)
CONTA["juntados"] = sum(JUNTADOS.values())
CONTA["juntados_produtos"] = len(JUNTADOS)
CONTA["ano_solto_mm_aaaa"] = sum(len(re.findall(r"\(\d{2}/(?:19|20)\d{2}\)", str(r.get("APLICACAO") or ""))) for r in P)
CONTA["ano_solto_produtos"] = sum(1 for r in P if re.search(r"\(\d{2}/(?:19|20)\d{2}\)", str(r.get("APLICACAO") or "")))

# ---------------------------------------------------------------- planilha da simulação
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

ILEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def limpa(v):
    """Tira caractere inválido e esconde o valor do preço antigo ('BAP BOX USD n' → 'BAP BOX USD [valor omitido]')."""
    if not isinstance(v, str):
        return v
    return re.sub(r"(BAP\s*BOX\s*USD\s*)[\d.,]+", r"\1[valor omitido]", ILEGAL.sub(" ", v), flags=re.I)


ITENS = [
    ("1_SO_ANO", "Item 1 · linhas só de ano: modelo colado no ano e ano sem veículo"),
    ("1_LINHA_POR_VEICULO", "Item 1 · uma linha por veículo: o pedaço só de ano junto do veículo"),
    ("3_MARCA_QUE_FALTA", "Item 3 · marca que falta no começo do bloco"),
    ("4_CASOS", "Item 4 · casos (AMT7036, FCB6121, BIE20006, CIL8500)"),
    ("4_FORMATO_ANO", "Item 4 · formatos de ano (4 dígitos, '–', '>') e a faixa falsa 1960–2026"),
    ("4_CAIXA", "Item 4 · caixa do modelo e o 'fi' perdido (Za ra → Zafira)"),
    ("5_REF_PROPRIA", "Item 5 · referência própria"),
    ("6_USD", "Item 6 · preço (BAP BOX USD) no histórico"),
    ("7_REPETIDAS", "Item 7 · referências repetidas"),
    ("9_NAKATA", "Item 9 · caixa da marca Nakata"),
    ("10_CODIGOS_ESTRANHOS", "Item 10 · códigos estranhos"),
    ("11_OFERECA_JUNTO", "Item 11 · OFERECA_JUNTO sem o mesmo veículo (proposta)"),
    ("12_APLICACAO_NA_REF", "Item 12 · texto de aplicação dentro da referência (KHC12428D e outros)"),
    ("13_DATA_SEM_TRACO", "Item 13 · datas sem o traço (01/201112/2021)"),
    ("14_JUH70010", "Item 14 · JUH70010: o (02/2009) e o SKF sem código (e o mesmo SKF nos outros JUH)"),
]
CORES = {"AUTOMÁTICO": "E2EFDA", "CASO A CASO": "FFF2CC", "DÚVIDA": "FCE4D6"}
wb = openpyxl.Workbook()
w0 = wb.active
w0.title = "LEIA"
leia = [
    ["SIMULAÇÃO da v19 · T-0017 · " + DATA + " · nada foi gravado na base"],
    ["Fonte: " + BASE.name + " (v18), aba PRODUTOS, colunas APLICACAO, REFERENCIAS_CRUZADAS e OFERECA_JUNTO"],
    ["Cada aba de item mostra o passo daquela regra (ANTES e DEPOIS do passo). A aba TODAS_AS_CELULAS tem o valor da v18 e o final."],
    ["TIPO: AUTOMÁTICO = regra mecânica; CASO A CASO = correção proposta célula a célula; DÚVIDA = depende da pergunta Pn (o DEPOIS é a recomendação)."],
    ["Sem preço, sem custo, sem estoque: o valor do 'BAP BOX USD' aparece só como texto antigo do histórico na aba 6_USD, na coluna ANTES, para mostrar o que sai."],
    [],
    ["Item", "Células (passos)", "Produtos", "AUTOMÁTICO", "CASO A CASO", "DÚVIDA"],
]
for k, nome in ITENS:
    xs = [m for m in MUD if m["item"] == k]
    leia.append([nome, len(xs), len({m["codigo"] for m in xs}),
                 sum(m["tipo"] == "AUTOMÁTICO" for m in xs), sum(m["tipo"] == "CASO A CASO" for m in xs), sum(m["tipo"] == "DÚVIDA" for m in xs)])
leia += [[], ["Final", "Células", "Produtos"],
         ["APLICACAO", len(FINAL_APL), len(FINAL_APL)],
         ["REFERENCIAS_CRUZADAS", len(FINAL_REF), len(FINAL_REF)],
         ["OFERECA_JUNTO", len(FINAL_OJ), len(FINAL_OJ)],
         ["Total", len(FINAL_APL) + len(FINAL_REF) + len(FINAL_OJ), len(set(FINAL_APL) | set(FINAL_REF) | set(FINAL_OJ))]]
for l in leia:
    w0.append(l)
w0["A1"].font = Font(bold=True, size=12)
w0.column_dimensions["A"].width = 80
for k, nome in ITENS:
    w = wb.create_sheet(k[:31])
    w.append(["CODIGO_BAP", "COLUNA", "ANTES", "DEPOIS", "REGRA", "TIPO", "PERGUNTA"])
    for m in (m for m in MUD if m["item"] == k):
        w.append([limpa(m["codigo"]), m["coluna"], limpa(m["antes"]), limpa(m["depois"]), limpa(m["regra"]), m["tipo"], m["pergunta"]])
        w.cell(w.max_row, 6).fill = PatternFill("solid", fgColor=CORES[m["tipo"]])
w = wb.create_sheet("TODAS_AS_CELULAS")
w.append(["CODIGO_BAP", "LINHA_EXCEL", "COLUNA", "ANTES (v18)", "DEPOIS (v19 simulada)", "ITENS", "TEM DÚVIDA"])
for col, fin in (("APLICACAO", FINAL_APL), ("REFERENCIAS_CRUZADAS", FINAL_REF), ("OFERECA_JUNTO", FINAL_OJ)):
    for cod, (n, a0, a1) in sorted(fin.items()):
        ms = [m for m in MUD if m["codigo"] == cod and m["coluna"] == col]
        w.append([cod, n, col, limpa(a0), limpa(a1), ", ".join(sorted({m["item"] for m in ms})),
                  ", ".join(sorted({m["pergunta"] for m in ms if m["pergunta"]}))])
w = wb.create_sheet("11_PARES_OJ")
w.append(["CODIGO_BAP", "ITEM_OFERECA_JUNTO", "SEM VEÍCULO EM COMUM", "SITUAÇÃO", "MODELO EM COMUM", "VEÍCULOS DO PRODUTO", "VEÍCULOS DO ITEM", "FAMÍLIA DO ITEM", "PROPOSTA (troca ou tirar)"])
NOMES_OJ = {"sem_veiculo_em_comum": "nenhum modelo em comum", "modelo_em_comum_motor_ou_ano_nao": "modelo em comum, mas motor ou ano não batem",
            "compativel": "compatível", "universal": "universal (não se compara)", "sem_veiculo_separado": "sem veículo separado (não dá para comparar)",
            "fora_do_site": "item fora do site"}
for x in sorted(OJ, key=lambda x: (x["nivel"] not in ("sem_veiculo_em_comum", "modelo_em_comum_motor_ou_ano_nao"), x["c"])):
    w.append([x["c"], x["oj"], "SIM" if x["nivel"] in ("sem_veiculo_em_comum", "modelo_em_comum_motor_ou_ano_nao") else ("NÃO" if x["nivel"] in ("compativel", "universal") else "?"),
              NOMES_OJ[x["nivel"]], x.get("comum_modelo", ""), x.get("ve_c", ""), x.get("ve_o", ""), x.get("fa_o", ""), x.get("troca", "") or ("(tirar)" if x["nivel"] in ("sem_veiculo_em_comum", "modelo_em_comum_motor_ou_ano_nao") else "")])
w = wb.create_sheet("FICA_DE_FORA")
w.append(["CODIGO_BAP", "O QUE", "POR QUÊ"])
for cod, faltam in SEM_MARCA_FORA:
    w.append([cod, "1º bloco sem marca, não mexido", "poucos pedaços com marca achada (não é lista de veículos ou o modelo não está no dicionário): " + " · ".join(limpa(x) for x in faltam[:8])])
for cod, faltam in SEM_MARCA_PARCIAL:
    w.append([cod, "marca posta em parte do 1º bloco", f"{len(faltam)} modelo(s) sem marca achada ficam num bloco sem marca (P2): " + " · ".join(limpa(x) for x in faltam[:12])])
w.append(["INT16533", "APLICACAO não mexida", "colunas misturadas (Delivery): só dá para refazer pela fonte (catálogo do fornecedor)"])
w.append(["(TINKEN)", f"{CONTA['tinken_historico']} 'TINKEN' só no histórico '| ANTERIOR'",
          "o trecho vivo já diz TIMKEN (0 'TINKEN' vivo); o histórico guarda o valor antigo e não se reescreve"])
w.append(["(DADOS_ADICIONAIS)", f"{CONTA['usd_dados_adicionais']} células com USD", "dado interno por desenho (custo, FOB): a FICHA do site não leva; fora da v19"])
w.append(["(1 a 164)", f"{CONTA['terminal_axial_numericos']} códigos só de número do Terminal Axial (os '1' e '10')",
          f"fora do site desde a v15 (T-0007; {CONTA['terminal_axial_numericos_no_site']} no site); a T-0007 decidiu manter a linha com o texto original"])
w.append(["(BAP: PAF.nnnn)", f"{CONTA['bap_paf']} 'BAP: PAF.nnnn' nos PAFnnnn", "decisão da T-0010 (v16): o código do ERP; o site já não mostra (marca BAP); fica na base (P6)"])
w.append(["(Acessórios)", f"CATEGORIA = SISTEMA no site: {CONTA['cat_igual_sistema_site']}", "a etiqueta repetida é da tela; trocar o SISTEMA é decisão de taxonomia (P12)"])
w = wb.create_sheet("LOG_CORRECOES_PREVISTO")
w.append(["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"])
for cod in sorted(set(FINAL_APL) | set(FINAL_REF) | set(FINAL_OJ)):
    cols = [c for c, fin in (("APLICACAO", FINAL_APL), ("REFERENCIAS_CRUZADAS", FINAL_REF), ("OFERECA_JUNTO", FINAL_OJ)) if cod in fin]
    its = sorted({m["item"] for m in MUD if m["codigo"] == cod})
    w.append(["CORRECAO_" + "_".join({"APLICACAO": "APLICACAO", "REFERENCIAS_CRUZADAS": "REFERENCIA", "OFERECA_JUNTO": "OFERECA_JUNTO"}[c] for c in cols),
              "PRODUTOS", cod, None,
              f"{' e '.join(cols)}: {', '.join(its)} (antes e depois na simulação da v19). {TAREFA} (v19), {DATA}"])
for wsx in wb.worksheets[1:]:
    for i, wd in enumerate([14, 22, 70, 70, 60, 14, 10], start=1):
        wsx.column_dimensions[get_column_letter(i)].width = wd
    for c in wsx[1]:
        c.font = Font(bold=True)
    wsx.freeze_panes = "A2"
    for row in wsx.iter_rows(min_row=2):
        for c in row:
            c.alignment = Alignment(wrap_text=False, vertical="top")
wb.save(OUT / "SIMULACAO_v19_T-0017.xlsx")

# ---------------------------------------------------------------- cópia simulada (só para medir o site)
wbc = openpyxl.load_workbook(BASE)
wsc = wbc["PRODUTOS"]
ca, cr = POS["APLICACAO"] + 1, POS["REFERENCIAS_CRUZADAS"] + 1
for cod, (n, a0, a1) in FINAL_APL.items():
    assert wsc.cell(n, POS["CODIGO_BAP"] + 1).value.strip() == cod and wsc.cell(n, ca).value == a0
    wsc.cell(n, ca).value = a1
for cod, (n, t0, t1) in FINAL_REF.items():
    assert wsc.cell(n, POS["CODIGO_BAP"] + 1).value.strip() == cod and wsc.cell(n, cr).value == t0
    wsc.cell(n, cr).value = t1 if t1 else None
co = POS["OFERECA_JUNTO"] + 1
for cod, (n, o0, o1) in FINAL_OJ.items():
    assert wsc.cell(n, POS["CODIGO_BAP"] + 1).value.strip() == cod and (wsc.cell(n, co).value or "") == o0
    wsc.cell(n, co).value = o1 if o1 else None
wbc.save(OUT / "BASE_v19_SIMULADA.xlsx")

json.dump([{k: limpa(v) for k, v in m.items()} for m in MUD], open(OUT / "mudancas.json", "w"), ensure_ascii=False, indent=0)
num = {"itens": {k: {"passos": sum(m["item"] == k for m in MUD), "produtos": len({m["codigo"] for m in MUD if m["item"] == k}),
                     "por_tipo": dict(collections.Counter(m["tipo"] for m in MUD if m["item"] == k)),
                     "por_pergunta": dict(collections.Counter(m["pergunta"] for m in MUD if m["item"] == k and m["pergunta"]))}
                 for k, _ in ITENS},
       "final": {"aplicacao_celulas": len(FINAL_APL), "referencias_celulas": len(FINAL_REF), "ofereca_junto_celulas": len(FINAL_OJ),
                 "produtos": len(set(FINAL_APL) | set(FINAL_REF) | set(FINAL_OJ))},
       "oj_pares": dict(collections.Counter(x["nivel"] for x in OJ)),
       "contas": CONTA, "sem_marca_fora": SEM_MARCA_FORA[:50]}
json.dump(num, open(OUT / "numeros.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(num["itens"], ensure_ascii=False, indent=1))
print(json.dumps(num["final"], ensure_ascii=False), json.dumps(CONTA, ensure_ascii=False))
