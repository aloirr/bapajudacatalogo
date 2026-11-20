"""T-0017 v18 (correção): SIMULAÇÃO, só leitura. Modelo numérico lido de data ou medida passa a 'duvidoso'.

Regra (R-20261120-131800-alexandre, item 3 "a"): um modelo numérico (MODELO que começa por dígito: Renault 12/19/21,
Peugeot 206/2008, Fiat 147/500, Scania 112...) só continua 'separado' se pelo menos UMA das vezes em que ele aparece
na APLICACAO não vem seguida de "/", ",", "dentes", "mm" nem de data, e não é um ano.

Uso: python3 -I simular_v18.py <base.xlsx> <base_v17.py>
"""
from __future__ import annotations

import collections
import importlib.util
import inspect
import json
import re
import sys
from pathlib import Path

BASE = Path(sys.argv[1])
BV = Path(sys.argv[2])
AQUI = Path(__file__).resolve().parent

spec = importlib.util.spec_from_file_location("bv", BV)
bv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bv)
POS: list = []
src = inspect.getsource(bv.extrair)
g = "                for v in novos:\n                    if v not in"
assert g in src
bv.__dict__["POS"] = POS
exec(compile(src.replace(g, "                for v in novos:\n                    POS.append((seg, a, b, v))\n"
                            "                    if v not in"), "extrair_pos", "exec"), bv.__dict__)

ANO = r"(?:19[5-9]\d|20[0-3]\d)"
DEPOIS_RUIM = [
    # "/" de data: 12/2016, 12/16, 12/... (uma lista "206 / 207" ou "145/146" não é data)
    (re.compile(r"^/\s?(?:" + ANO + r"|\d{2}(?!\d)|\.{2,3})"), "seguido de \"/\" e ano (é data, ex.: 12/2016)"),
    (re.compile(r"^,\d"), "seguido de \",\" e número (é medida, ex.: 19,05 mm)"),
    (re.compile(r"^\s*(?:\d+\s*)?DENTES\b"), "seguido de \"dentes\" (é medida)"),
    (re.compile(r"^\s*(?:,\d+\s*)?MM\b"), "seguido de \"mm\" (é medida)"),
]
SO_ANO = [   # só para modelo que é um ano (Peugeot 2008)
    (re.compile(r"^\s*(?:-|A|ATE)\s*(?:\d{2}/)?" + ANO + r"\b"), "é um ano (seguido de outra data: faixa de anos)"),
    (re.compile(r"^\s*(?:>|EM DIANTE|/\s?\.{2,3})"), "é um ano (seguido de \">\" ou \"em diante\")"),
]
ANTES_DATA = re.compile(r"(?:\d{2}/|(?<!\d)" + ANO + r"\s*(?:-|A|ATE)\s*|ATE\s*|DE\s*|>\s*)$")


def julgar(seg: str, a: int, b: int, modelo: str) -> str | None:
    """None = ocorrência boa (é modelo). Texto = por que não é."""
    depois, antes = seg[b:], seg[:a]
    for rx, motivo in DEPOIS_RUIM:
        if rx.search(depois):
            return motivo
    if re.fullmatch(r"\d{1,2}", modelo) and re.search(r"\d\s?[/\-]\s?$", antes):
        return "vem depois de \"/\" ou \"-\" com número (é o ano de uma data, ex.: 04/12, 08-12)"
    if re.fullmatch(ANO, modelo) and re.search(r"PEUGEOT\s*[-:]?\s*$", antes):
        return None   # "PEUGEOT - 2008 - 05/2015": a marca logo antes, é o modelo
    if re.fullmatch(ANO, modelo):
        for rx, motivo in SO_ANO:
            if rx.search(depois):
                return motivo
        if ANTES_DATA.search(antes):
            return "é um ano (vem depois de data, \"-\" ou \"até\")"
        if re.match(r"^\s*(?:\.|$|·)", depois) and re.search(ANO + r"\s*[-A]\s*$", antes):
            return "é um ano (fim de uma faixa)"
    return None


def main():
    import openpyxl
    wb = openpyxl.load_workbook(BASE, read_only=True)
    rows = list(wb["VEICULOS"].iter_rows(values_only=True))
    cab, dados = list(rows[0]), [list(r) for r in rows[1:]]
    ix = {c: i for i, c in enumerate(cab)}
    produtos = {p["c"]: p for p in bv.gs.ler_base(BASE)}

    ocorr_por_cod = {}

    def ocorrencias(cod):
        if cod not in ocorr_por_cod:
            p = produtos[cod]
            POS.clear()
            bv.extrair(p["a"], p["mo"], p["li"])
            ocorr_por_cod[cod] = list(POS)
        return ocorr_por_cod[cod]

    mudam, ficam = [], []
    for i, r in enumerate(dados):
        if r[ix["SITUACAO"]] != "separado" or r[ix["ORIGEM"]] != "automático":
            continue   # o digitado (ORIGEM manual) nunca é tocado
        mod = str(r[ix["MODELO"]] or "")
        if not re.match(r"^\d", mod):
            continue
        cod, fab, ver = r[ix["CODIGO_BAP"]], r[ix["FABRICANTE"]], r[ix["VERSAO"]] or ""
        oc = [(s, a, b) for s, a, b, v in ocorrencias(cod) if v[0] == fab and v[1] == mod and (v[2] or "") == ver]
        juizos = [(s, a, b, julgar(s, a, b, mod)) for s, a, b in oc]
        boas = [j for j in juizos if j[3] is None]
        trecho = " ¦ ".join(s[max(0, a - 25):b + 35].strip() for s, a, b, _ in juizos)[:300]
        if boas:
            s, a, b, _ = boas[0]
            ficam.append([cod, fab, mod, ver or None, "separado",
                          f"{len(boas)} de {len(juizos)} ocorrência(s) boa(s): \"{s[max(0, a - 15):b + 25].strip()}\"", trecho])
        else:
            mot = juizos[0][3] if juizos else "ocorrência não encontrada"
            novo = f"modelo numérico {mod} lido de data ou medida: {mot} (v18, T-0017)"
            mudam.append([i + 2, cod, fab, mod, ver or None, "separado", "duvidoso", novo, trecho])

    # contagens antes e depois
    sit = collections.Counter(r[ix["SITUACAO"]] for r in dados)
    depois = collections.Counter(sit)
    depois["separado"] -= len(mudam)
    depois["duvidoso"] += len(mudam)
    sep_por_cod = collections.Counter(r[0] for r in dados if r[ix["SITUACAO"]] == "separado")
    tira = collections.Counter(m[1] for m in mudam)
    perde_ve = sorted(c for c, n in tira.items() if sep_por_cod[c] == n)
    perde_um = sorted(c for c, n in tira.items() if sep_por_cod[c] > n)
    prod_com_ve = len(sep_por_cod)
    por_modelo = collections.Counter((m[2], m[3]) for m in mudam)
    por_modelo_fica = collections.Counter((f[1], f[2]) for f in ficam)
    nums = {
        "linhas_veiculos": len(dados), "separado_antes": sit["separado"], "duvidoso_antes": sit["duvidoso"],
        "separado_depois": depois["separado"], "duvidoso_depois": depois["duvidoso"],
        "linhas_numericas_conferidas": len(mudam) + len(ficam), "mudam": len(mudam), "ficam": len(ficam),
        "produtos_afetados": len(tira), "produtos_perdem_ve": len(perde_ve), "produtos_perdem_parte": len(perde_um),
        "produtos_com_ve_antes": prod_com_ve, "produtos_com_ve_depois": prod_com_ve - len(perde_ve),
        "mudam_por_modelo": [[f"{a} {b}", n] for (a, b), n in por_modelo.most_common()],
        "ficam_por_modelo": [[f"{a} {b}", n] for (a, b), n in por_modelo_fica.most_common()],
        "mudam_por_motivo": collections.Counter(m[7].split(": ", 1)[1].rsplit(" (v18", 1)[0] for m in mudam).most_common(),
        "perde_ve": perde_ve,
    }
    txt = json.dumps([mudam, ficam], ensure_ascii=False)
    m = bv.gs.TRAVA.search(txt)
    if m:
        sys.exit(f"[PARADO] TRAVA: {m.group(0)}")

    from openpyxl.styles import Font, PatternFill
    out = openpyxl.Workbook()

    def aba(ws, cab_, larg):
        ws.append(cab_)
        for c in ws[1]:
            c.font = Font(bold=True, color="FFFFFF")
            c.fill = PatternFill("solid", fgColor="1F3864")
        ws.freeze_panes = "A2"
        for k, w in enumerate(larg):
            ws.column_dimensions[openpyxl.utils.get_column_letter(k + 1)].width = w

    ws = out.active
    ws.title = "MUDAM"
    aba(ws, ["LINHA_NA_VEICULOS", "CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "SITUACAO_ANTES",
             "SITUACAO_DEPOIS", "MOTIVO_NOVO", "TRECHO_DA_APLICACAO"], (10, 14, 14, 10, 10, 12, 12, 70, 90))
    for r in mudam:
        ws.append(r)
    ws.auto_filter.ref = ws.dimensions
    wf = out.create_sheet("FICAM_SEPARADO")
    aba(wf, ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "SITUACAO", "POR_QUE_FICA", "TRECHO_DA_APLICACAO"],
        (14, 14, 10, 10, 10, 70, 90))
    for r in ficam:
        wf.append(r)
    wf.auto_filter.ref = wf.dimensions
    wc = out.create_sheet("CONTAGENS")
    aba(wc, ["INDICADOR", "ANTES (v17)", "DEPOIS (v18)"], (55, 14, 14))
    for lin in (["Linhas da VEICULOS", len(dados), len(dados)],
                ["  separado", sit["separado"], depois["separado"]],
                ["  duvidoso", sit["duvidoso"], depois["duvidoso"]],
                ["Linhas com modelo numérico conferidas (separado)", len(mudam) + len(ficam), ""],
                ["  passam a duvidoso", "", len(mudam)],
                ["  continuam separado", "", len(ficam)],
                ["Produtos com \"ve\" no site", prod_com_ve, prod_com_ve - len(perde_ve)],
                ["Produtos que perdem o \"ve\" inteiro", "", len(perde_ve)],
                ["Produtos que perdem só parte dos veículos", "", len(perde_um)],
                [], ["MUDAM POR MODELO", "LINHAS", ""]):
        wc.append(lin)
    for k, n in nums["mudam_por_modelo"]:
        wc.append([k, n])
    wc.append([])
    wc.append(["FICAM POR MODELO", "LINHAS", ""])
    for k, n in nums["ficam_por_modelo"]:
        wc.append([k, n])
    wc.append([])
    wc.append(["MUDAM POR MOTIVO", "LINHAS", ""])
    for k, n in nums["mudam_por_motivo"]:
        wc.append([k, n])
    out.save(AQUI / "SIMULACAO_v18_T-0017.xlsx")
    (AQUI / "numeros.json").write_text(json.dumps(nums, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps({k: v for k, v in nums.items() if k != "perde_ve"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
