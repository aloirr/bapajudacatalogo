"""T-0017 v25 (SIMULAÇÃO, nada é gravado na base): o Palio Weekend Adventure no AMT7500.

Pedido: R-20261121-112900-alexandre, item 4 ("coloque o palio no amt7500 assim como na internet. Olhe os catalagos
unificados antigos para validar"). Só lê. Primeiro procura o AMT7500 e as referências dele (Nakata HG33004, Cofap
GP30120, Monroe 94176 e SP176) nos catálogos antigos do repositório. Sem Palio nos antigos, entra o que o anúncio da
Cofap GP30120 diz, que o Alexandre aceitou neste caso: "Palio Weekend Adventure 2000–2007 s/ ABS". Só no AMT7500 (o
AMT7014 c/ ABS não entra); "Palio, Siena" (anúncio da Nakata) só com catálogo antigo que confirme; nada duvidoso.

Monta SIMULACAO_v25_T-0017.xlsx (LEIA, ANTES_DEPOIS, VEICULOS_NOVA, BUSCA) e numeros_v25.json.

Uso: python3 -I simular_v25.py <base.xlsx> <pasta_saida>   (rodar na raiz do repositório: a busca usa caminhos dela)
"""
import glob
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font

RAIZ = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(RAIZ / "dados" / "scripts")]
from base_comum import VAZIO, limpo, sha  # noqa: E402

COD = "AMT7500"
CHAVES = {"AMT7500": r"AMT\W?7500", "HG33004": r"HG\W?33\W?004", "GP30120": r"GP\W?30\W?120",
          "94176": r"(?<![\dA-Z])94176(?!\d)", "SP176": r"(?<![A-Z])SP\W?176(?!\d)"}
PALIO = re.compile(r"P[AÁ]LIO|SIENA", re.I)
APL_HOJE = ("FIAT - Strada 01/2001–12/2020 · Adventure · s/ ABS · exc. Locker / Cabine Dupla / Prato Pequeno · "
            "c/ barra estab.")
TRECHO = " ; FIAT - Palio Weekend Adventure 2000–2007 · s/ ABS"
NOVA = {"CODIGO_BAP": COD, "FABRICANTE": "FIAT", "MODELO": "Palio Weekend", "VERSAO": "Adventure", "ANO_INICIO": 2000,
        "ANO_FIM": 2007, "ORIGEM": "automático", "SITUACAO": "separado", "MOTIVO": None, "CILINDRADA": None,
        "ANO_DUVIDA": None}
FONTE = ("Anúncios na internet da Cofap GP30120 (a mesma Cofap do AMT7500): 'Palio Weekend Adventure 2000/2007'. "
         "Fonte aceita pelo Alexandre neste caso (R-20261121-112900-alexandre, item 4: 'coloque o palio no amt7500 "
         "assim como na internet'). Nenhum catálogo antigo do repositório tem Palio no AMT7500 ou nas referências dele.")
# os catálogos antigos (não entram a base de hoje, as versões v13 em diante nem as simulações, que já são da T-0017)
FONTES = (["dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v%d.xlsx" % n for n in range(8, 13)]
          + ["docs/legado/**/*.md", "catalogo_grafico/gerador/entradas/*", "catalogo_grafico/gerador/digital_data.json",
             "catalogo_grafico/entregas/*.xlsx", "catalogo_grafico/entregas/*.pdf"])


def achou(t):
    return [k for k, rx in CHAVES.items() if re.search(rx, t, re.I)]


def registros(f):
    """(onde, texto) de cada registro do arquivo: linha da planilha, registro do JSON, linha do .md ou do PDF."""
    if f.endswith(".xlsx"):
        wb = openpyxl.load_workbook(f, read_only=True)
        for ws in wb.worksheets:
            for i, r in enumerate(ws.iter_rows(values_only=True), 1):
                yield f"{ws.title}:{i}", " | ".join(str(x) for x in r if x is not None)
        wb.close()
    elif f.endswith(".json"):
        def andar(o, cam):
            if isinstance(o, dict):
                for k, v in o.items():
                    if achou(k) or isinstance(v, str) and achou(v) or (
                            isinstance(v, list) and any(isinstance(x, str) and achou(x) for x in v)):
                        yield f"{cam}/{k}", json.dumps(v if achou(k) else o, ensure_ascii=False)
                    yield from andar(v, f"{cam}/{k}")
            elif isinstance(o, list):
                for i, v in enumerate(o):
                    yield from andar(v, f"{cam}[{i}]")
        yield from andar(json.load(open(f, encoding="utf-8")), "")
    elif f.endswith(".pdf") and shutil.which("pdftotext"):        # PDF: linha a linha do texto com layout
        t = subprocess.run(["pdftotext", "-q", "-layout", f, "-"], capture_output=True, text=True).stdout
        yield from ((f"linha {i}", x) for i, x in enumerate(t.splitlines(), 1))
    elif f.endswith(".md"):
        yield from ((f"linha {i}", x) for i, x in enumerate(open(f, encoding="utf-8").read().splitlines(), 1))


def buscar():
    arquivos = sorted({f for p in FONTES for f in glob.glob(str(RAIZ / p), recursive=True)})
    linhas, por_arquivo = [], {}
    for f in arquivos:
        rel = str(Path(f).relative_to(RAIZ))
        n = n_palio = 0
        for onde, t in registros(f):
            k = achou(t)
            if k:
                n += 1
                pal = bool(PALIO.search(t))
                n_palio += pal
                linhas.append([rel, onde, ", ".join(k), "SIM" if pal else "não", t[:400]])
        por_arquivo[rel] = {"registros": n, "com_palio_ou_siena": n_palio}
    return linhas, por_arquivo


def main(base, saida):
    saida = Path(saida)
    wb = openpyxl.load_workbook(base, read_only=True)
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    cp = [limpo(c.value) for c in next(wp.iter_rows(max_row=1))]
    cv = [limpo(c.value) for c in next(wv.iter_rows(max_row=1))]
    achados = [(n, dict(zip(cp, r))) for n, r in enumerate(wp.iter_rows(min_row=2, values_only=True), 2) if r[0] == COD]
    veic = [dict(zip(cv, r)) for r in wv.iter_rows(min_row=2, values_only=True) if r[0] == COD]
    wb.close()
    (n, p), = achados
    assert limpo(p["APLICACAO"]) == APL_HOJE and p["DIFERENCIAL"] == "s/ ABS", p
    assert [(v["FABRICANTE"], v["MODELO"]) for v in veic] == [("FIAT", "Strada")], veic
    assert list(NOVA) == cv

    busca, por_arquivo = buscar()
    com_palio = [x for x in busca if x[3] == "SIM"]
    # a regra do Alexandre: com Palio num catálogo antigo, vale o que ele disser; sem nada, entra o anúncio da Cofap
    assert not com_palio, f"[PARADO] catálogo antigo com Palio: rever a regra antes de simular ({com_palio[:3]})"

    depois = APL_HOJE + TRECHO
    num = {"base_sha256": sha(Path(base)), "codigo": COD, "linha_produtos": n, "celulas": 1,
           "linhas_novas_veiculos": 1, "log_previsto": 2, "arquivos_procurados": len(por_arquivo),
           "registros_com_amt7500_ou_referencia": len(busca), "registros_com_palio_ou_siena": len(com_palio),
           "por_arquivo": por_arquivo}
    out = openpyxl.Workbook()
    le = out.active
    le.title = "LEIA"
    for t in ["T-0017 · v25 da base unificada: SIMULAÇÃO (nada gravado)",
              f"Base de partida: v24 (sha256 {num['base_sha256'][:8]}…{num['base_sha256'][-4:]}). "
              "Pedido: R-20261121-112900-alexandre, item 4.",
              f"Busca nos catálogos antigos: {len(por_arquivo)} arquivos, {len(busca)} registros com o AMT7500 ou uma "
              f"referência dele; {len(com_palio)} com Palio ou Siena (aba BUSCA).",
              "Por isso entra o que o anúncio da Cofap GP30120 diz (fonte aceita pelo Alexandre neste caso).",
              "Só o AMT7500 (s/ ABS). O AMT7014 (c/ ABS) não muda. 'Palio, Siena' (anúncio da Nakata) não entra: "
              "nenhum catálogo antigo confirma.",
              "Regra fixa (R-20261120-213300): nada novo marcado nem escrito como duvidoso. Nenhum produto sai."]:
        le.append([t])
    abas = {"ANTES_DEPOIS": (["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "ANTES", "DEPOIS", "FONTE", "ENTRA"],
                             [[COD, "PRODUTOS", n, "APLICACAO", APL_HOJE, depois, FONTE, "sim"]]),
            "VEICULOS_NOVA": (cv + ["FONTE"], [[NOVA[k] if NOVA[k] is not None else VAZIO for k in cv] + [FONTE]]),
            "BUSCA": (["ARQUIVO", "ONDE", "ACHOU", "PALIO_OU_SIENA", "TRECHO"], busca)}
    for nome, (cab, linhas) in abas.items():
        s = out.create_sheet(nome)
        s.append(cab)
        for x in linhas:
            s.append(x)
        for c in s[1]:
            c.font = Font(bold=True)
        s.freeze_panes = "A2"
        for col in s.columns:
            s.column_dimensions[col[0].column_letter].width = min(max(10, max(len(str(x.value or ""))
                                                                              for x in col[:200]) + 2), 60)
        for row in s.iter_rows(min_row=2):
            for x in row:
                x.alignment = Alignment(vertical="top", wrap_text=True)
    out.save(saida / "SIMULACAO_v25_T-0017.xlsx")
    json.dump(num, open(saida / "numeros_v25.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(num, ensure_ascii=False, indent=1))
    print(" ANTES :", APL_HOJE)
    print(" DEPOIS:", depois)


if __name__ == "__main__":
    main(*sys.argv[1:3])
