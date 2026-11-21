"""T-0017 · SIMULAÇÃO da parte da aba VEICULOS da v19 (R-20261120-184000-alexandre, item 6 "b"). Só lê.

Pedidos de origem: R-20261120-132200-alexandre (uma linha por VEÍCULO; ano com dúvida marcado: aparece, não filtra)
e R-20261120-132230-alexandre (ano solto "(09/2014)" = "a partir de 2014").

Uso:
    python3 -I -B simular_veiculos.py <worktree_main> <base_v19_simulada.xlsx> <pasta_saida>

- <worktree_main>: só leitura. Dele vêm a base de hoje (v18: aba VEICULOS "antes"), o extrator de veículos de
  dados/scripts/base_v17.py (com um gancho que guarda onde cada modelo foi achado) e o scripts/gerar_site.py.
- <base_v19_simulada.xlsx>: a v19 aprovada recriada (P3 1960 → 1996; P9 CFR9006 como na v18). A APLICACAO de lá é a
  fonte do ano e da cilindrada de cada veículo.
- A identidade de cada linha da VEICULOS (CODIGO_BAP, FABRICANTE, MODELO, VERSAO, ORIGEM, SITUACAO, MOTIVO) NÃO muda:
  só se preenchem ANO_INICIO e ANO_FIM (vazios na v18) e as 2 colunas novas no fim (CILINDRADA e ANO_DUVIDA).
  Os 2 casos do testes (FLU15001/FLU15002 e TER5599096/TER5599097) ficam como pergunta (DEPOIS = recomendação).
- Nunca lê preço, custo nem estoque; a saída tem só código, veículo, ano, cilindrada e o trecho da APLICACAO, e passa
  pela TRAVA do gerar_site.py.
"""
from __future__ import annotations

import collections
import importlib.util
import inspect
import json
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
WT = Path(sys.argv[1])
V19 = Path(sys.argv[2])
OUT = Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
V18 = WT / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
TAREFA, DATA = "T-0017", "20/11/2026"
ANO_MAX = 2028           # o mesmo teto do site (ano de hoje + 2)

spec = importlib.util.spec_from_file_location("bv", WT / "dados" / "scripts" / "base_v17.py")
bv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bv)
gs = bv.gs

# gancho (o mesmo da estimativa T-0017b): cada ocorrência de modelo (trecho, início, fim, veículo)
POS: list = []
src = inspect.getsource(bv.extrair)
gancho = "                for v in novos:\n                    if v not in"
assert gancho in src
src = src.replace(gancho, "                for v in novos:\n                    POS.append((seg, a, b, v))\n                    if v not in")
bv.__dict__["POS"] = POS
exec(compile(src, "extrair_pos", "exec"), bv.__dict__)

import openpyxl  # noqa: E402

# ------------------------------------------------------------------ ano e cilindrada de um pedaço de texto
ANO4 = r"(19[5-9]\d|20[0-2]\d)"
YY = r"(\d{2})"


def yy(s: str) -> int:
    n = int(s)
    return 1900 + n if n >= 50 else 2000 + n


def ok(a):
    return a is None or 1950 <= a <= ANO_MAX


PADROES = [
    (re.compile(r"(?<![\d/])\d{2}/" + ANO4 + r"\s*(?:-|A|ATE|/)?\s*\d{2}/" + ANO4 + r"(?!\d)"),
     lambda m: (int(m[1]), int(m[2]), "MM/AAAA-MM/AAAA")),
    (re.compile(r"(?<![\d/])" + ANO4 + r"\s*(?:-|A|ATE)\s*\d{2}/" + ANO4 + r"(?!\d)"), lambda m: (int(m[1]), int(m[2]), "AAAA-AAAA")),
    (re.compile(r"(?<![\d/.,])(?:\d{2}/)?" + ANO4 + r"\s*(?:·\s*)?(?:-|A|ATE|/|AO|>)\s*(?:\d{2}/)?" + ANO4 + r"(?!\d|[.,]\d)"),
     lambda m: (int(m[1]), int(m[2]), "AAAA-AAAA")),
    # "2014 2019" (dois anos só com espaço, o 2º maior: faixa, como no site)
    (re.compile(r"(?<![\d/.,])" + ANO4 + r"\s+" + ANO4 + r"(?!\d|[.,]\d)"),
     lambda m: (int(m[1]), int(m[2]), "AAAA AAAA") if int(m[1]) < int(m[2]) else None),
    (re.compile(r"(?<![\d/.])(0[1-9]|1[0-2])/" + YY + r"\s*(?:-|A)?\s*(0[1-9]|1[0-2])/" + YY + r"(?![\d/])"),
     lambda m: (yy(m[2]), yy(m[4]), "MM/AA MM/AA")),
    (re.compile(r"(?<![\d/.,])" + YY + r"\s?/\s?" + YY + r"(?!\d|/|[.,]\d|\s*(?:\"|''|POL|MM))"),
     lambda m: (yy(m[1]), yy(m[2]), "AA/AA ambíguo" if int(m[1]) <= 12 else "AA/AA")
     if yy(m[1]) <= yy(m[2]) and int(m[1]) not in range(36, 50) else None),
]
ABERTO = [
    (re.compile(r"(?<![\d.,])(?:\d{2}/)?" + ANO4 + r"\s*(?:>|EM DIANTE|/\s?\.{2,3}|-\s?>|\.{2,3}|→)"), "AAAA>"),
    (re.compile(r"(?:APOS|A PARTIR DE|DESDE)\s*(?:\d{2}/)?" + ANO4), "após AAAA"),
    (re.compile(r"(?<![\d/.])\(?" + YY + r"/\s?\.{2,3}"), "AA/..."),
]
ATE = [(re.compile(r"(?:ATE|\.{2,3}\s?/\s?)\s*(?:\d{2}/)?" + ANO4 + r"(?!\d)"), "até AAAA")]
SOLTO = re.compile(r"(?<![A-Z\d.,/\-])(?:(\d{2})/)?" + ANO4 + r"(?!\d|[.,]\d|[A-Z]|\s*(?:L|CC|MM|CV|KG)\b)")
ABERTOS = {"AAAA>", "após AAAA", "AA/...", "ano solto MM/AAAA", "ano solto AAAA"}
CIL = re.compile(r"(?<![\d.,])([0-9])\.([0-9])(?![\d])(?!\s*(?:MM|KG|M\b|BAR|A\b|V\b|T\b|TON))")
CC = re.compile(r"(?<!\d)(\d{2,4})\s?CC\b")


def ano_de(t: str):
    """Primeira faixa de ano do texto: (ini, fim, tipo, trecho) ou None."""
    achados = []
    for rx, f in PADROES:
        for m in rx.finditer(t):
            r = f(m)
            if r and ok(r[0]) and ok(r[1]):
                achados.append((m.start(), r[0], r[1], r[2], m.group(0)))
    for rx, tipo in ABERTO:
        for m in rx.finditer(t):
            a = yy(m[1]) if len(m[1]) == 2 else int(m[1])
            if ok(a):
                achados.append((m.start(), a, None, tipo, m.group(0)))
    for rx, tipo in ATE:
        for m in rx.finditer(t):
            if ok(int(m[1])):
                achados.append((m.start(), None, int(m[1]), tipo, m.group(0)))
    if not achados:
        for m in SOLTO.finditer(t):
            if ok(int(m[2])):
                return (int(m[2]), None, "ano solto MM/AAAA" if m[1] else "ano solto AAAA", m.group(0))
        return None
    achados.sort(key=lambda x: (x[0], -len(x[4])))
    return achados[0][1:]   # (ini, fim, tipo, trecho)


def cil_de(t: str) -> list[str]:
    out = []
    for m in CIL.finditer(t):
        v = f"{m[1]}.{m[2]}"
        if 0.6 <= float(v) <= 9.9 and v not in out:
            out.append(v)
    for m in CC.finditer(t):
        v = f"{m[1]}cc"
        if 50 <= int(m[1]) <= 1800 and v not in out:
            out.append(v)
    return out


def ordem_cil(c: str):
    return (1, int(c[:-2])) if c.endswith("cc") else (0, float(c))


def fmt_ano(ini, fim) -> str:
    if ini is None and fim is None:
        return ""
    if ini is None:
        return f"até {fim}"
    if fim is None:
        return f"{ini}–"
    return str(ini) if ini == fim else f"{ini}–{fim}"


# ------------------------------------------------------------------ leitura
def ler_veiculos(caminho: Path):
    wb = openpyxl.load_workbook(caminho, read_only=True)
    rows = list(wb["VEICULOS"].iter_rows(values_only=True))
    wb.close()
    return list(rows[0]), [list(r) for r in rows[1:]]


CAB18, VE18 = ler_veiculos(V18)
assert CAB18 == ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "ORIGEM", "SITUACAO", "MOTIVO"], CAB18
CAB19_V, VE19_V = ler_veiculos(V19)
assert CAB19_V == CAB18 and VE19_V == VE18, "a VEICULOS da cópia da v19 tem de ser igual à da v18 (a v19 aprovada não mexe nela)"
P19 = {p["c"]: p for p in gs.ler_base(V19)}
IGNORAR = collections.defaultdict(set)
for r in VE18:
    if "modelo numérico" in str(r[8] or ""):
        IGNORAR[str(r[0]).strip().upper()].add((str(r[1] or "").strip(), str(r[2] or "").strip(), str(r[3] or "").strip()))
P18 = {p["c"]: p for p in gs.ler_base(V18)}


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


# ------------------------------------------------------------------ ocorrências por produto (texto da v19)
def ocorrencias(p) -> tuple[dict, list]:
    POS.clear()
    ve, sit, _ = bv.extrair(p["a"], p["mo"], p["li"])
    # o modelo numérico lido de data ou medida (v18: Renault 12 de "12/2016", 21 de "21 dentes") não corta o trecho
    POS[:] = [x for x in POS if x[3] not in IGNORAR.get(p["c"], set())]
    occ = collections.defaultdict(list)
    inicios = collections.defaultdict(set)
    for seg, a, b, v in POS:
        inicios[seg].add(a)
    versoes_num = {bv.norm(v[2]) for _, _, _, v in POS if v[2] and re.search(r"\d", v[2])}
    for seg, a, b, v in POS:
        prox = min([x for x in inicios[seg] if x > a] or [len(seg)])
        resto = seg[b:prox]
        # o número de caminhão/versão (Axor 2035, Cargo 1722) não é ano nem cilindrada
        for vn in versoes_num:
            resto = re.sub(r"(?<![A-Z0-9.])" + re.escape(vn) + r"(?![A-Z0-9])", " " * len(vn), resto)
        an = ano_de(resto)
        origem = "próprio" if an else None
        if not an:
            an = ano_de(seg[prox:])
            origem = "herdado" if an else None
        occ[v].append(dict(trecho=seg[a:prox].strip(), ano=an, origem=origem, cils=cil_de(resto)))
    return occ, [tuple(x) for x in ve]


def juntar(occs: list[dict]):
    """Uma linha por veículo: as cilindradas juntas ("1.0 / 1.6") e a faixa mais larga."""
    cils = []
    for o in occs:
        cils += [c for c in o["cils"] if c not in cils]
    cils.sort(key=ordem_cil)
    proprios = [o for o in occs if o["origem"] == "próprio"]
    usar = proprios or [o for o in occs if o["origem"] == "herdado"]
    anos = [o["ano"] for o in usar]
    ini = fim = None
    tipos = sorted({a[2] for a in anos})
    if anos:
        inis = [a[0] for a in anos]
        ini = None if any(x is None for x in inis) else min(inis)
        aberto = any(a[1] is None and a[2] in ABERTOS for a in anos)
        fims = [a[1] if a[1] is not None else a[0] for a in anos]
        fim = None if aberto else max(x for x in fims if x is not None)
    duv = []
    if usar and not proprios:
        duv.append("herdado: o ano vem depois de outro modelo da lista")
    amb = [a[3].strip() for a in anos if a[2] == "AA/AA ambíguo"]
    if amb:
        duv.append(f"AA/AA ambíguo ('{amb[0]}' pode ser mês/ano)")
    if ini is not None and fim is not None and fim < ini:
        duv.append("fim antes do início")
    pares = {(tuple(o["cils"]), (o["ano"] or (None, None))[:2]) for o in occs}
    return dict(cil=" / ".join(cils), ini=ini, fim=fim, tipos=tipos, origem="/".join(sorted({o["origem"] for o in usar if o["origem"]})),
                duv="; ".join(duv), vezes=len(occs), par_perdido=len(occs) > 1 and len(pares) > 1,
                trecho=" ¦ ".join(o["trecho"] for o in occs)[:400], pares=sorted(pares, key=str))


# ------------------------------------------------------------------ roda
CASOS = {   # os 2 casos do testes (R do gerente-projetos, 20/11 ~18h50): DEPOIS = recomendação, TIPO = DÚVIDA
    "FLU15001": dict(pergunta="V5", sit="duvidoso",
                     motivo="'ML' é mililitro ('500 ml'), não o Mercedes-Benz ML: fluido DOT 3 universal (LINHA UNIVERSAL), serve em qualquer veículo que pede DOT 3 (T-0017, v19)"),
    "FLU15002": dict(pergunta="V5", sit="duvidoso",
                     motivo="'ML' é mililitro ('500 ml'), não o Mercedes-Benz ML: fluido DOT 4 universal (LINHA UNIVERSAL), serve em qualquer veículo que pede DOT 4 (T-0017, v19)"),
    "TER5599096": dict(pergunta="V6", ini=2006, fim=2011),
    "TER5599097": dict(pergunta="V6", ini=2006, fim=2011),
}
cache = {}
linhas = []
sem_produto, nao_achado = 0, []
dif_conjunto = []
for i, r in enumerate(VE18, start=2):
    cod, fab, mod, ver = limpo(r[0]).upper(), limpo(r[1]), limpo(r[2]), limpo(r[3])
    sit, origem_linha = limpo(r[7]), limpo(r[6])
    l = dict(linha=i, cod=cod, fab=fab, mod=mod, ver=ver, ano_ini_antes=r[4], ano_fim_antes=r[5], origem_linha=origem_linha,
             sit=sit, motivo=limpo(r[8]), cil="", ini=None, fim=None, duv="", tipos=[], origem="", vezes=0,
             par_perdido=False, trecho="", fonte="", obs="", leitura_texto="", sit_depois=sit, motivo_depois=limpo(r[8]), pergunta="", tipo="AUTOMÁTICO")
    linhas.append(l)
    if origem_linha != "automático" or not mod:      # digitado nunca; sem modelo não tem ano
        continue
    p = P19.get(cod)
    if not p:
        sem_produto += 1
        continue
    if cod not in cache:
        cache[cod] = ocorrencias(p)
    occ, ve19 = cache[cod]
    v = (fab, mod, ver)
    oc = occ.get(v)
    fonte = "APLICACAO da v19"
    if not oc and cod in P18:                       # o texto da v19 mudou e o modelo não é mais achado igual: v18
        k = cod + "#18"
        if k not in cache:
            cache[k] = ocorrencias(P18[cod])
        oc = cache[k][0].get(v)
        fonte = "APLICACAO da v18 (o extrator não acha o veículo no texto da v19)"
    if not oc:
        nao_achado.append(l)
        continue
    j = juntar(oc)
    l.update(cil=j["cil"], ini=j["ini"], fim=j["fim"], duv=j["duv"], tipos=j["tipos"], origem=j["origem"], vezes=j["vezes"],
             par_perdido=j["par_perdido"], trecho=j["trecho"], fonte=fonte, pares=j["pares"])

# conjunto de veículos: v18 (linhas) x o que o extrator acharia no texto da v19 (só informação; a identidade não muda)
por_cod18 = collections.defaultdict(set)
for l in linhas:
    if l["mod"]:
        por_cod18[l["cod"]].add((l["fab"], l["mod"], l["ver"]))
for cod, vs in por_cod18.items():
    if cod in cache:
        v19 = {v for v in cache[cod][1] if v[1]}
        if v19 != vs:
            dif_conjunto.append((cod, sorted(vs - v19), sorted(v19 - vs)))

# casos do testes
for l in linhas:
    c = CASOS.get(l["cod"])
    if not c:
        continue
    l["pergunta"], l["tipo"] = c["pergunta"], "DÚVIDA"
    if "sit" in c:
        l["sit_depois"], l["motivo_depois"] = c["sit"], c["motivo"]
    else:
        l["leitura_texto"] = fmt_ano(l["ini"], l["fim"])
        l["ini"], l["fim"], l["duv"] = c["ini"], c["fim"], ""

# ano solto MM/AAAA que pode ser AA/AAAA (V7): o item do OFERECA_JUNTO com o mesmo modelo tem a faixa 20AA–AAAA
SO_SOLTO_MM = ["ano solto MM/AAAA"]
FAIXA = collections.defaultdict(set)
for l in linhas:
    if l["mod"] and (l["ini"] or l["fim"]) and l["tipos"] != SO_SOLTO_MM and l["cod"] not in CASOS:
        FAIXA[(l["cod"], l["fab"], l["mod"])].add((l["ini"], l["fim"]))
suspeitos = []
for l in linhas:
    if not l["mod"] or l["tipos"] != SO_SOLTO_MM or l["cod"] in CASOS:
        continue
    m = re.search(r"(?<![\d/])(\d{2})/((?:19|20)\d{2})(?!\d)", bv.norm(l["trecho"]))
    p = P19.get(l["cod"])
    alt = (yy(m[1]), int(m[2])) if m else None
    par = None
    if alt and alt[0] < alt[1] and p:
        for oj in re.split(r"[\s·,;/|]+", p.get("oj", "")):
            if alt in FAIXA.get((oj.strip().upper(), l["fab"], l["mod"]), set()):
                par = oj.strip().upper()
                break
    l["pergunta"], l["tipo"] = "V7", "DÚVIDA"
    l["leitura_texto"] = fmt_ano(l["ini"], l["fim"])
    if par:      # recomendação: a faixa do par (ano firme)
        suspeitos.append((l, par, alt))
        l["ini"], l["fim"] = alt
        l["obs"] = f"o par {par} (Leve também) tem {l['mod']} {alt[0]}–{alt[1]}: '{m.group(0)}' é AA/AAAA"
    else:        # recomendação: aparece como 'a partir de', mas não filtra
        l["duv"] = "; ".join(x for x in (l["duv"], f"ano solto '{m.group(0) if m else ''}': pode ser 'a partir de' ou AA/AAAA (faixa)") if x)

# os outros itens com pergunta (o DEPOIS é a recomendação)
for l in linhas:
    if l["pergunta"] or not l["mod"]:
        continue
    if "ano solto AAAA" in l["tipos"] and l["ini"] and not l["fim"] and "AAAA>" not in l["tipos"]:
        l["pergunta"], l["tipo"] = "V4", "DÚVIDA"
    elif l["par_perdido"]:
        l["pergunta"], l["tipo"] = "V3", "DÚVIDA"
    elif l["sit"] == "duvidoso" and (l["cil"] or l["ini"] or l["fim"]):
        l["pergunta"], l["tipo"] = "V9", "DÚVIDA"

# ------------------------------------------------------------------ contagens
mod_lin = [l for l in linhas if l["mod"]]
sep = [l for l in linhas if l["sit_depois"] == "separado"]
def conta(ls):
    return dict(
        linhas=len(ls), produtos=len({l["cod"] for l in ls}),
        com_cilindrada=sum(1 for l in ls if l["cil"]), sem_cilindrada=sum(1 for l in ls if not l["cil"]),
        cilindrada_varias=sum(1 for l in ls if " / " in l["cil"]),
        com_ano=sum(1 for l in ls if l["ini"] or l["fim"]), sem_ano=sum(1 for l in ls if not (l["ini"] or l["fim"])),
        faixa_completa=sum(1 for l in ls if l["ini"] and l["fim"]),
        so_inicio_em_diante=sum(1 for l in ls if l["ini"] and not l["fim"]),
        so_fim_ate=sum(1 for l in ls if not l["ini"] and l["fim"]),
        ano_duvidoso=sum(1 for l in ls if l["duv"]),
        ano_duvidoso_herdado=sum(1 for l in ls if "herdado" in l["duv"]),
        ano_duvidoso_aa_aa=sum(1 for l in ls if "AA/AA ambíguo" in l["duv"]),
        ano_duvidoso_fim_antes=sum(1 for l in ls if "fim antes" in l["duv"]),
        ano_duvidoso_solto_mm_aaaa=sum(1 for l in ls if "ano solto '" in l["duv"]),
        ano_firme=sum(1 for l in ls if (l["ini"] or l["fim"]) and not l["duv"]),
        com_os_dois=sum(1 for l in ls if l["cil"] and (l["ini"] or l["fim"])),
        par_cil_ano_perdido=sum(1 for l in ls if l["par_perdido"]),
        veiculo_repetido_no_texto=sum(1 for l in ls if l["vezes"] > 1),
        ano_solto_mm_aaaa=sum(1 for l in ls if "ano solto MM/AAAA" in l["tipos"]),
        ano_solto_aaaa=sum(1 for l in ls if "ano solto AAAA" in l["tipos"]),
        fonte_v18=sum(1 for l in ls if l["fonte"].startswith("APLICACAO da v18")),
        nao_achado_no_texto=sum(1 for l in ls if l["mod"] and not l["fonte"] and l["origem_linha"] == "automático"),
    )
NUM = dict(
    total=dict(linhas_antes=len(VE18), linhas_depois=len(linhas), produtos=len({l["cod"] for l in linhas}),
               linhas_com_modelo=len(mod_lin), linhas_sem_modelo=len(linhas) - len(mod_lin),
               repetidas_cod_fab_mod_ver=len(linhas) - len({(l["cod"], l["fab"], l["mod"], l["ver"]) for l in linhas}),
               situacao=dict(collections.Counter(l["sit"] for l in linhas)), origem=dict(collections.Counter(l["origem_linha"] for l in linhas))),
    separado=conta(sep),
    duvidoso_com_modelo=conta([l for l in linhas if l["sit_depois"] == "duvidoso" and l["mod"]]),
    todas_com_modelo=conta(mod_lin),
    tipos_de_ano_separado=collections.Counter(t for l in sep for t in l["tipos"]).most_common(),
    cilindradas_separado=collections.Counter(c for l in sep for c in l["cil"].split(" / ") if c).most_common(20),
    produtos_com_conjunto_diferente_no_texto_v19=len(dif_conjunto),
    suspeitos_aa_aaaa=len(suspeitos),
    perguntas={k: dict(linhas=sum(1 for l in linhas if l["pergunta"] == k), separado=sum(1 for l in sep if l["pergunta"] == k), produtos=len({l["cod"] for l in linhas if l["pergunta"] == k})) for k in sorted({l["pergunta"] for l in linhas if l["pergunta"]})},
    sem_produto_no_site=sem_produto,
)

# ------------------------------------------------------------------ saídas
json.dump(NUM, open(OUT / "numeros_veiculos.json", "w"), ensure_ascii=False, indent=1)
# para o site: só as linhas separado (as que vão ao "ve"), sem dado interno
VB = collections.defaultdict(list)
for l in sep:   # sit_depois = separado
    if l["fab"] and l["mod"]:
        VB[l["cod"]].append([l["fab"], l["mod"], l["ver"], l["cil"], l["ini"], l["fim"], 1 if l["duv"] else 0])
txt = json.dumps(VB, ensure_ascii=False)
m = gs.TRAVA.search(txt)
assert not m, f"TRAVA: {m.group(0)}"
(OUT / "veiculos_base_v19.json").write_text(txt, encoding="utf-8")
json.dump([{k: v for k, v in l.items() if k != "pares"} | {"pares": [list(map(list, x)) for x in l.get("pares", [])]} for l in linhas],
          open(OUT / "_linhas.json", "w"), ensure_ascii=False, default=str)
json.dump([[c, a, b] for c, a, b in dif_conjunto], open(OUT / "_dif_conjunto.json", "w"), ensure_ascii=False)
json.dump([[l["cod"], l["fab"], l["mod"], l["ver"], l["trecho"][:200], oj, list(alt)] for l, oj, alt in suspeitos],
          open(OUT / "_suspeitos_aa_aaaa.json", "w"), ensure_ascii=False)
print(json.dumps({k: NUM[k] for k in ("total", "separado", "perguntas")}, ensure_ascii=False, default=str))


# ------------------------------------------------------------------ planilha da simulação
import random  # noqa: E402

from openpyxl.styles import Alignment, Font, PatternFill  # noqa: E402
from openpyxl.utils import get_column_letter  # noqa: E402

ILEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
CORES = {"AUTOMÁTICO": "E2EFDA", "CASO A CASO": "FFF2CC", "DÚVIDA": "FCE4D6"}
CAB19 = CAB18 + ["CILINDRADA", "ANO_DUVIDA"]


def lp(v):
    return ILEGAL.sub(" ", v) if isinstance(v, str) else v


def nv(v):
    return v if v not in ("", None) else None


def de_onde(l):
    if not l["tipos"]:
        return None
    return ", ".join(l["tipos"]) + (f" ({l['origem']})" if l["origem"] else "")


def linha_depois(l):
    return [l["cod"], nv(l["fab"]), nv(l["mod"]), nv(l["ver"]), l["ini"], l["fim"], l["origem_linha"], l["sit_depois"],
            nv(l["motivo_depois"]), nv(l["cil"]), nv(l["duv"])]


CAB_AD = ["LINHA_NA_VEICULOS", "CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "SITUACAO (antes)", "SITUACAO (depois)",
          "ANO_INICIO (antes)", "ANO_FIM (antes)", "ANO_INICIO (depois)", "ANO_FIM (depois)", "CILINDRADA (nova)",
          "ANO_DUVIDA (nova)", "ANO COMO APARECE", "LEITURA DO TEXTO (se a pergunta muda)", "DE ONDE VEIO O ANO",
          "VEZES NO TEXTO", "PAR CILINDRADA-ANO SE PERDE", "TIPO", "PERGUNTA", "OBSERVAÇÃO", "TRECHO DA APLICACAO (v19)"]


def linha_ad(l):
    return [l["linha"], l["cod"], nv(l["fab"]), nv(l["mod"]), nv(l["ver"]), l["sit"], l["sit_depois"], l["ano_ini_antes"],
            l["ano_fim_antes"], l["ini"], l["fim"], nv(l["cil"]), nv(l["duv"]), nv(fmt_ano(l["ini"], l["fim"])),
            nv(l["leitura_texto"]), de_onde(l), l["vezes"] or None, "SIM" if l["par_perdido"] else None, l["tipo"],
            nv(l["pergunta"]), nv(l["obs"] or (l["motivo_depois"] if l["motivo_depois"] != l["motivo"] else "")), lp(nv(l["trecho"]))]


def aba(wb, nome, cab, rows, larg=None, cor_tipo=None):
    w = wb.create_sheet(nome)
    w.append(cab)
    for c in w[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F3864")
        c.alignment = Alignment(wrap_text=True, vertical="top")
    for r in rows:
        w.append([lp(x) for x in r])
        if cor_tipo is not None and r[cor_tipo] in CORES:
            w.cell(w.max_row, cor_tipo + 1).fill = PatternFill("solid", fgColor=CORES[r[cor_tipo]])
    w.freeze_panes = "A2"
    w.auto_filter.ref = w.dimensions
    for i, wd in enumerate(larg or [], start=1):
        w.column_dimensions[get_column_letter(i)].width = wd
    return w


LARG_AD = [9, 14, 14, 16, 10, 10, 10, 8, 8, 9, 9, 12, 34, 12, 12, 26, 7, 8, 12, 8, 40, 90]

# amostra: 50 produtos de marcas diferentes (o 1º veículo separado de marca ainda não vista), até 12 linhas cada
random.seed(20261120)
por_cod = collections.defaultdict(list)
for l in linhas:
    por_cod[l["cod"]].append(l)
fabs = collections.Counter(l["fab"] for l in sep)
escolhidos, vistas = [], set()
cods = sorted(c for c, ls in por_cod.items() if len(ls) <= 12 and any(x["sit"] == "separado" for x in ls) and c not in CASOS)
random.shuffle(cods)
for fab, _ in fabs.most_common():
    if len(escolhidos) >= 50:
        break
    for c in cods:
        if c in escolhidos:
            continue
        ls = [x for x in por_cod[c] if x["sit"] == "separado"]
        if ls and ls[0]["fab"] == fab and (ls[0]["cil"] or ls[0]["ini"] or ls[0]["fim"] or fab not in vistas):
            escolhidos.append(c)
            vistas.add(fab)
            break
for c in cods:      # completa até 50 com marcas variadas (se faltar marca com produto pequeno)
    if len(escolhidos) >= 50:
        break
    if c not in escolhidos and any(x["pergunta"] for x in por_cod[c]):
        escolhidos.append(c)
AMOSTRA = [l for c in escolhidos for l in por_cod[c]]

wb = openpyxl.Workbook()
w0 = wb.active
w0.title = "LEIA"
S, D, T = NUM["separado"], NUM["duvidoso_com_modelo"], NUM["total"]
leia = [
    ["SIMULAÇÃO da aba VEICULOS da v19 · T-0017 · " + DATA + " · nada foi gravado na base"],
    ["Base de partida: a v19 aprovada (R-20261120-184000-alexandre) recriada numa cópia: P3 '1960' → 1996; P9 CFR9006 como na v18. A aba VEICULOS de partida é a da v18 (a v19 aprovada não mexe nela)."],
    ["Ano e cilindrada de cada veículo: do trecho da APLICACAO da v19 onde o modelo aparece (do modelo até o próximo modelo). A identidade da linha (código, fabricante, modelo, versão, origem) não muda; nenhuma linha entra nem sai."],
    ["Colunas novas no fim: CILINDRADA ('1.6'; várias: '1.0 / 1.6'; moto: '125cc') e ANO_DUVIDA (vazio = ano firme; texto = o motivo da dúvida: o ano aparece, mas não filtra)."],
    ["ANO_FIM vazio com ANO_INICIO = 'em diante'; ANO_INICIO vazio com ANO_FIM = 'até'. TIPO: AUTOMÁTICO = regra já decidida; DÚVIDA = depende da pergunta Vn (o DEPOIS é a recomendação)."],
    ["Só código, veículo, ano, cilindrada e o trecho da APLICACAO; nenhum dado interno e nada dos DADOS_ADICIONAIS (a TRAVA do gerar_site.py passou em tudo)."],
    [],
    ["CONTAGEM", "SEPARADO (vai ao site)", "DUVIDOSO com modelo (fora do site)", "TODAS com modelo"],
]
A = NUM["todas_com_modelo"]
for k, nome in [("linhas", "Linhas (uma por veículo)"), ("produtos", "Produtos"),
                ("com_cilindrada", "Com cilindrada achada"), ("sem_cilindrada", "Sem cilindrada"),
                ("cilindrada_varias", "  com mais de uma ('1.0 / 1.6')"),
                ("com_ano", "Com ano achado"), ("sem_ano", "Sem ano"), ("faixa_completa", "  faixa completa (início e fim)"),
                ("so_inicio_em_diante", "  só início (em diante)"), ("so_fim_ate", "  só fim (até)"),
                ("ano_firme", "  ano firme (filtra)"), ("ano_duvidoso", "  ano DUVIDOSO marcado (aparece, não filtra)"),
                ("ano_duvidoso_herdado", "    herdado de lista"), ("ano_duvidoso_aa_aa", "    AA/AA ambíguo"),
                ("ano_duvidoso_solto_mm_aaaa", "    ano solto MM/AAAA (V7)"), ("ano_duvidoso_fim_antes", "    fim antes do início"),
                ("com_os_dois", "Com cilindrada e ano"), ("veiculo_repetido_no_texto", "Veículo repetido no texto (juntado numa linha)"),
                ("par_cil_ano_perdido", "  par cilindrada-ano que se perde ao juntar (V3)")]:
    leia.append([nome, S[k], D[k], A[k]])
leia += [[], ["Aba VEICULOS inteira", "antes", "depois"], ["Linhas", T["linhas_antes"], T["linhas_depois"]],
         ["Colunas", len(CAB18), len(CAB19)], ["Linhas repetidas (código + fabricante + modelo + versão)", T["repetidas_cod_fab_mod_ver"], T["repetidas_cod_fab_mod_ver"]],
         ["Linhas sem modelo (só a marca ou sem veículo: ficam sem ano)", T["linhas_sem_modelo"], T["linhas_sem_modelo"]],
         [], ["Abas desta planilha", ""],
         ["AMOSTRA_50", f"{len(escolhidos)} produtos de {len({por_cod[c][0]['fab'] for c in escolhidos})} marcas, todas as linhas de cada um, antes e depois"],
         ["ANTES_E_DEPOIS", "as 17.270 linhas da VEICULOS, antes e depois, com de onde veio o ano e o trecho"],
         ["VEICULOS_DEPOIS", "a aba como ficaria (11 colunas, na ordem da base)"],
         ["PAR_SE_PERDE", "os veículos repetidos no texto em que o par cilindrada-ano se perde ao juntar (V3)"],
         ["V7_ANO_SOLTO_MM", "o ano solto '(MM/AAAA)' e os 17 em que o par do Leve também mostra que é AA/AAAA"],
         ["CASOS_DO_TESTES", "FLU15001/FLU15002 (V5) e TER5599096/TER5599097 (V6)"],
         ["CONJUNTO_V19", "veículos que o extrator acharia diferente no texto da v19 (V8, só informação)"],
         ["DUVIDAS", "as perguntas V1 a V9, com as opções e a recomendação"],
         ["FORMATO_REGRA6", "o que muda no formato e o aviso à BAP Central"],
         ["LOG_CORRECOES_PREVISTO", "uma linha por código mudado"]]
for l_ in leia:
    w0.append(l_)
w0["A1"].font = Font(bold=True, size=12)
w0.column_dimensions["A"].width = 62
for c in "BCD":
    w0.column_dimensions[c].width = 22

aba(wb, "AMOSTRA_50", CAB_AD, [linha_ad(l) for l in AMOSTRA], LARG_AD, CAB_AD.index("TIPO"))
aba(wb, "ANTES_E_DEPOIS", CAB_AD, [linha_ad(l) for l in linhas], LARG_AD, CAB_AD.index("TIPO"))
aba(wb, "VEICULOS_DEPOIS", CAB19, [linha_depois(l) for l in linhas], [16, 18, 24, 16, 12, 10, 12, 12, 80, 14, 50])
pp = [l for l in sep if l["par_perdido"]]
aba(wb, "PAR_SE_PERDE", ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "CILINDRADA (junta)", "ANO (faixa mais larga)",
                         "VEZES NO TEXTO", "OS PARES NO TEXTO (cilindrada · ano)", "TRECHO DA APLICACAO (v19)"],
    [[l["cod"], l["fab"], l["mod"], nv(l["ver"]), nv(l["cil"]), nv(fmt_ano(l["ini"], l["fim"])), l["vezes"],
      " | ".join(f"{'/'.join(c) or '—'} · {fmt_ano(*a) or '—'}" for c, a in l["pares"]), l["trecho"]] for l in pp],
    [14, 14, 16, 10, 16, 14, 8, 60, 90])
v7 = [l for l in linhas if l["pergunta"] == "V7"]
aba(wb, "V7_ANO_SOLTO_MM", ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "SITUACAO", "LEITURA 'a partir de'", "RECOMENDAÇÃO",
                            "ANO_DUVIDA (depois)", "POR QUÊ", "TRECHO DA APLICACAO (v19)"],
    sorted([[l["cod"], l["fab"], l["mod"], nv(l["ver"]), l["sit_depois"], l["leitura_texto"],
             fmt_ano(l["ini"], l["fim"]) + (" (faixa do par)" if l["obs"] else " (aparece, não filtra)"), nv(l["duv"]),
             nv(l["obs"]), l["trecho"]] for l in v7], key=lambda r: (r[8] is None, r[0])),
    [14, 14, 16, 10, 10, 14, 26, 40, 60, 80])
casos = [l for l in linhas if l["cod"] in CASOS]
APL_V20 = {"TER5599096": "HONDA - New Civic 2006–2011 · Dir", "TER5599097": "HONDA - New Civic 2006–2011 · Esq"}
aba(wb, "CASOS_DO_TESTES", ["CODIGO_BAP", "PERGUNTA", "FABRICANTE", "MODELO", "SITUACAO antes", "SITUACAO depois",
                            "MOTIVO depois", "ANO antes", "ANO depois (recomendação)", "LEITURA DO TEXTO PELA REGRA",
                            "APLICACAO hoje (v19)", "APLICACAO proposta (v20, não entra na v19)"],
    [[l["cod"], CASOS[l["cod"]]["pergunta"], l["fab"], l["mod"], l["sit"], l["sit_depois"], nv(l["motivo_depois"]),
      nv(fmt_ano(l["ano_ini_antes"], l["ano_fim_antes"])), nv(fmt_ano(l["ini"], l["fim"])), nv(l["leitura_texto"]),
      P19[l["cod"]]["a"], APL_V20.get(l["cod"], "(sem mudança; o extrator deixa de ler 'ml' como o modelo ML na v20)")] for l in casos],
    [12, 8, 14, 10, 10, 10, 60, 10, 14, 14, 60, 50])
aba(wb, "CONJUNTO_V19", ["CODIGO_BAP", "NA VEICULOS (v18) E NÃO ACHADOS NO TEXTO DA v19", "ACHADOS NO TEXTO DA v19 E FORA DA VEICULOS"],
    [[c, "; ".join(" ".join(x for x in v if x) for v in a) or None, "; ".join(" ".join(x for x in v if x) for v in b) or None] for c, a, b in dif_conjunto],
    [14, 50, 80])

PG = NUM["perguntas"]


def pg(k, c="linhas"):
    return PG.get(k, {}).get(c, 0)


DUVIDAS = [
    ["V1", "Como marcar o ano duvidoso (decidido: aparece, mas não filtra)?",
     "a) uma coluna nova ANO_DUVIDA com o motivo (vazio = ano firme) · b) duas colunas, ANO_SITUACAO (firme/duvidoso) e ANO_MOTIVO · c) usar SITUACAO e MOTIVO que já existem",
     "a: uma coluna só, e o motivo já diz por quê. A c não serve: SITUACAO=duvidoso tira o VEÍCULO do filtro, e aqui só o ano é dúvida",
     f"{S['ano_duvidoso']} linhas separado ({D['ano_duvidoso']} nas duvidoso)"],
    ["V2", "O que vai na CILINDRADA?",
     "a) só a cilindrada: '1.6'; várias: '1.0 / 1.6'; moto: '125cc' · b) com a válvula, como a tabela do site mostra hoje: '1.6 16V'",
     "a: o filtro 'Motor' do site compara só a cilindrada ('1.8'); a válvula continua no texto da aplicação",
     f"{S['com_cilindrada']} linhas separado com cilindrada ({S['cilindrada_varias']} com mais de uma)"],
    ["V3", "Uma linha por veículo (decidido, 'b'): quando o mesmo veículo aparece com motor ou ano diferentes, como juntar?",
     "a) cilindradas juntas ('1.0 / 1.6') e a faixa mais larga (o menor início e o maior fim; 'em diante' ganha) · b) igual à a, e o ano fica duvidoso (aparece, não filtra) quando o par cilindrada-ano se perde · c) só a 1ª vez que o veículo aparece",
     "a: é o pedido 'uma linha por veículo'; o vendedor confere o par no texto, que continua na tela. Ex.: Versa 1.0 2016> e Versa 1.6 2012> viram 'Versa · 1.0 / 1.6 · 2012–'",
     f"{S['par_cil_ano_perdido']} linhas separado (de {S['veiculo_repetido_no_texto']} repetidas no texto); aba PAR_SE_PERDE"],
    ["V4", "Ano solto sem mês ('Strada 2021', 'Gol 1.0 L 8V 2008 ·'): vale como 'a partir de', igual ao '(09/2014)'?",
     "a) sim, a partir de · b) só aquele ano · c) duvidoso (aparece, não filtra)",
     "a: segue a decisão do ano solto (R-20261120-132230, '1) a'); nas palhetas, a faixa vem como '2014 2019' e o ano solto é o modelo mais novo",
     f"{pg('V4', 'separado')} linhas separado"],
    ["V5", "FLU15001 (DOT 3) e FLU15002 (DOT 4): o veículo 'Mercedes-Benz ML' saiu do '500 ml'. São universais.",
     "a) a linha passa a SITUACAO=duvidoso, com o motivo ('ml' é mililitro; universal): sai do 've', fica fora do filtro 'Meu veículo' como os outros universais e volta ao 'Leve também' de todo veículo · b) deixar como está · c) apagar a linha",
     "a: nenhuma linha se apaga (regra 4), e o 'Leve também' já mantém o item sem 've'. Na v20, o extrator deixa de ler 'ml' depois de número como o modelo ML (são as 2 únicas linhas assim)",
     "2 linhas (2 produtos); são os 2 únicos produtos UNIVERSAL com veículo separado"],
    ["V6", "TER5599096 e TER5599097 ('HONDA - New Civic 06/2011'): fazem par com o TAX10288 (Civic 2006–2011).",
     "a) ANO_INICIO 2006 e ANO_FIM 2011 na VEICULOS, e na v20 a APLICACAO vira 'HONDA - New Civic 2006–2011 · Dir/Esq' · b) a regra do ano solto: 2011 em diante · c) duvidoso",
     "a: o '06' é o ano 2006 (o New Civic é de 2006 a 2011) e o par confirma. A APLICACAO fica para a v20, porque a v19 já está aprovada",
     "2 linhas (2 produtos)"],
    ["V7", "Ano solto com mês '(MM/AAAA)': 17 casos provam que às vezes é AA/AAAA (faixa). Ex.: Stilo (02/2009) com o par 2002–2009, Civic (01/2006) com 2001–2006, Fit 03/2008 com 2003–2008",
     "a) manter 'a partir de' em todos (a decisão de hoje) e só corrigir os 17 pela faixa do par · b) corrigir os 17 pela faixa do par e marcar os outros como duvidosos (aparecem como 'a partir de', mas não filtram) · c) 'a partir de' em todos, sem exceção",
     "b: nos itens com par do mesmo modelo, 19 batem com a faixa 20AA–AAAA (estes 17 e os 2 TER da V6) e 25 com 'a partir de'; não dá para saber nos outros. Duvidoso não tira o item de quem tem o carro. Atenção: o JUH70010 da v19 já ficou '02/2009>' no texto",
     f"{pg('V7', 'separado')} linhas separado: 17 pela faixa do par e {NUM['separado']['ano_duvidoso_solto_mm_aaaa']} duvidosas"],
    ["V8", "O texto da v19 (com a marca no começo do bloco) faria o extrator achar veículos diferentes em 44 produtos (55 a mais, 5 a menos).",
     "a) não mexer no conjunto de veículos nesta versão; revisar numa v20 · b) acrescentar os 55 como duvidoso",
     "a: entre os 55 voltam o Renault 12 e o Peugeot 2008 lidos de data (o erro que a v18 corrigiu). Esta simulação só preenche colunas; nenhuma linha entra nem sai",
     "44 produtos; aba CONJUNTO_V19"],
    ["V9", "Preencher ano e cilindrada também nas linhas SITUACAO=duvidoso (o site não lê essas linhas)?",
     "a) sim, em todas as linhas com modelo · b) só nas separado",
     "a: ajuda a revisão dos duvidosos e a BAP Central; o site continua só com as separado",
     f"{D['linhas']} linhas duvidoso com modelo ({D['com_ano']} com ano, {D['com_cilindrada']} com cilindrada)"],
]
aba(wb, "DUVIDAS", ["PERGUNTA", "O QUE", "OPÇÕES", "RECOMENDAÇÃO", "QUANTOS"], DUVIDAS, [8, 60, 90, 80, 40])
for row in wb["DUVIDAS"].iter_rows(min_row=2):
    for c in row:
        c.alignment = Alignment(wrap_text=True, vertical="top")

AVISO = ("BAP Central: na v19 a aba VEICULOS da base unificada muda de formato. Ganha 2 colunas no fim, depois de MOTIVO: "
         "CILINDRADA (texto: '1.6', '1.0 / 1.6', '125cc') e ANO_DUVIDA (texto: vazio = ano firme; preenchido = o motivo da dúvida). "
         "ANO_INICIO e ANO_FIM, que eram vazios, passam a vir preenchidos (número de 4 dígitos; ANO_FIM vazio = em diante; "
         "ANO_INICIO vazio = até). As 9 colunas de antes ficam na mesma ordem e com o mesmo nome; continua uma linha por "
         "produto x veículo (mesmo número de linhas). A aba PRODUTOS não muda de formato (as 5 primeiras colunas ficam iguais); "
         "mudam só textos da APLICACAO, da REFERENCIAS_CRUZADAS e da OFERECA_JUNTO, como já avisado. Quem lê a VEICULOS pela "
         "posição da coluna não precisa mudar nada; quem lê pelo nome pode passar a usar as colunas novas.")
aba(wb, "FORMATO_REGRA6", ["ABA", "COLUNA", "ANTES (v18)", "DEPOIS (v19)"], [
    ["VEICULOS", "CILINDRADA", "(não existe)", "coluna nova nº 10, texto"],
    ["VEICULOS", "ANO_DUVIDA", "(não existe)", "coluna nova nº 11, texto (vazio = firme)"],
    ["VEICULOS", "ANO_INICIO", "sempre vazia", "número (4 dígitos) ou vazio"],
    ["VEICULOS", "ANO_FIM", "sempre vazia", "número (4 dígitos) ou vazio (= em diante)"],
    ["VEICULOS", "SITUACAO e MOTIVO", "—", "só FLU15001 e FLU15002 (V5), se 'a'"],
    ["VEICULOS", "as outras 7 colunas e as linhas", "—", "iguais (17.270 linhas, mesma ordem)"],
    ["PRODUTOS, MODELOS_VEICULO e as outras abas", "—", "—", "formato igual (a v19 aprovada só muda textos da PRODUTOS)"],
    ["LOG_CORRECOES e LEIA-ME", "—", "—", "linhas novas, como em toda versão"],
    [], ["AVISO À BAP CENTRAL (texto)", AVISO]], [30, 30, 20, 60])

LOG = []
for c, ls in por_cod.items():
    a_ = sum(1 for l in ls if (l["ini"], l["fim"]) != (l["ano_ini_antes"], l["ano_fim_antes"]))
    b_ = sum(1 for l in ls if l["cil"])
    d_ = sum(1 for l in ls if l["duv"])
    s_ = [l for l in ls if l["sit_depois"] != l["sit"]]
    if not (a_ or b_ or d_ or s_):
        continue
    partes = []
    if a_:
        partes.append(f"ANO_INICIO/ANO_FIM preenchidos em {a_} linha(s)")
    if b_:
        partes.append(f"CILINDRADA em {b_}")
    if d_:
        partes.append(f"ANO_DUVIDA (ano duvidoso, não filtra) em {d_}")
    for l in s_:
        partes.append(f"SITUACAO {l['sit']} -> {l['sit_depois']} ({l['fab']} {l['mod']}: 'ml' é mililitro, item universal)")
    LOG.append(["VEICULO_ANO_CILINDRADA", "VEICULOS", c, None,
                f"VEICULOS: {'; '.join(partes)}, do trecho da APLICACAO da v19 (colunas novas CILINDRADA e ANO_DUVIDA). {TAREFA} (v19), {DATA}"])
aba(wb, "LOG_CORRECOES_PREVISTO", ["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"], LOG, [24, 12, 22, 16, 140])
NUM["log_previsto"] = len(LOG)
NUM["amostra"] = dict(produtos=len(escolhidos), marcas=len({por_cod[c][0]["fab"] for c in escolhidos}), linhas=len(AMOSTRA))

# TRAVA em tudo o que vai para a planilha
tudo = []
for wsx in wb.worksheets:
    for row in wsx.iter_rows(values_only=True):
        tudo += [str(v) for v in row if isinstance(v, str)]
m = gs.TRAVA.search("\n".join(tudo))
assert not m, f"TRAVA na planilha: {m.group(0)}"
wb.save(OUT / "SIMULACAO_VEICULOS_v19_T-0017.xlsx")
json.dump(NUM, open(OUT / "numeros_veiculos.json", "w"), ensure_ascii=False, indent=1)
print("planilha:", OUT / "SIMULACAO_VEICULOS_v19_T-0017.xlsx", "LOG", len(LOG), "amostra", NUM["amostra"])
