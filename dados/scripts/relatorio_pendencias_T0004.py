"""T-0004 · Relatório de pendências do catálogo online (fotos, aplicação, referência).

Só lê: site/data/produtos.json (os produtos do site) e site/img/. A base unificada não é aberta para gravar;
o sha256 dela é tirado antes e depois para provar que não mudou.

Sem preço, estoque, custo, fornecedor ou ranking: as colunas são só CODIGO_BAP, DESCRICAO, PRODUTO, SISTEMA,
LINHA e marcas (MOTIVO, TEM_..., OBS). Não copia APLICACAO nem REFERENCIAS_CRUZADAS (o TER556556 tem preço na
APLICACAO e os Terminais Axiais trazem o fornecedor nas referências).

Uso: python3 dados/scripts/relatorio_pendencias_T0004.py [AAAAMMDD]
"""
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
JSON = RAIZ / "site" / "data" / "produtos.json"
IMG = RAIZ / "site" / "img"
SAIDA = RAIZ / "dados" / "relatorios"
DATA = sys.argv[1] if len(sys.argv) > 1 else "20261120"

ARTE_BLOB = "64806dc5685e812fd7fd59f02bac3393b10bd507"   # git blob do FLU15002.jpg (arte "IMAGEM INDISPONÍVEL")
TRAVA = re.compile(r"ESTOQUE|\bFOB\b|\bUSD\b|\bMOQ\b|PRE[CÇ]O|R\$|BAP\s+BOX|CUSTO|FORNECEDOR|RANKING", re.I)

# APLICACAO preenchida com texto que não é aplicação (achado da T-0001). O texto não vai para a planilha.
APLICACAO_INVALIDA = {"TER556556"}
OBS_APLICACAO = "APLICACAO com texto que não é aplicação"
OBS_T0007 = "em revisão na T-0007"
# CODIGO_BAP que parece título da tabela de cruzetas, não código (só apontado; a base não muda aqui)
CODIGO_SUSPEITO = {"VEÍCULO", "HYUNDAI", "KIA MOTORS"}
OBS_CODIGO = "CODIGO_BAP parece título de tabela, não código: conferir na base"


def sha256(f: Path) -> str:
    h = hashlib.sha256()
    with f.open("rb") as a:
        for b in iter(lambda: a.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def blob(f: Path) -> str:
    dado = f.read_bytes()
    return hashlib.sha1(b"blob %d\0" % len(dado) + dado).hexdigest()


def natural(c: str):
    return [(0, int(t), "") if t.isdigit() else (1, 0, t) for t in re.findall(r"\d+|\D+", c)]


def obs(p: dict, extra: str = "") -> str:
    partes = [extra] if extra else []
    if p["c"].isdigit():
        partes.append(OBS_T0007)
    if p["c"] in CODIGO_SUSPEITO:
        partes.append(OBS_CODIGO)
    return "; ".join(partes)


def linha(p: dict) -> list:
    return [p["c"], p.get("d", ""), p.get("p", ""), p.get("si", ""), p.get("li", "")]


def ordem(p: dict):
    return (p.get("p", "").casefold(), natural(p["c"]))


def aba(wb, nome, cab, linhas):
    ws = wb.create_sheet(nome)
    ws.append(cab)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F3864")
    for l in linhas:
        ws.append(l)
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    for i, c in enumerate(cab, 1):
        larg = max([len(str(c))] + [len(str(l[i - 1] or "")) for l in linhas])
        ws.column_dimensions[get_column_letter(i)].width = min(max(larg + 2, 10), 60)
    return ws


def main():
    hash_antes = sha256(BASE)
    dados = json.loads(JSON.read_text(encoding="utf-8"))
    ps = dados["produtos"]

    # fotos: sem "i" = sem arquivo; "i" com o mesmo conteúdo do FLU15002 = arte indisponível
    fotos = []
    for p in ps:
        if not p.get("i"):
            fotos.append((p, "sem arquivo"))
        elif blob(IMG / p["i"]) == ARTE_BLOB:
            fotos.append((p, "arte indisponível"))
    sem_a = [p for p in ps if not p.get("a") or p["c"] in APLICACAO_INVALIDA]
    sem_r = [p for p in ps if not p.get("r")]

    f_l = [linha(p) + [m, obs(p)] for p, m in sorted(fotos, key=lambda t: ordem(t[0]))]
    a_l = [linha(p) + ["SIM" if p.get("r") else "NÃO",
                       obs(p, OBS_APLICACAO if p["c"] in APLICACAO_INVALIDA else "")] for p in sorted(sem_a, key=ordem)]
    r_l = [linha(p) + ["SIM" if p.get("a") and p["c"] not in APLICACAO_INVALIDA else "NÃO", obs(p)]
           for p in sorted(sem_r, key=ordem)]

    cab = ["CODIGO_BAP", "DESCRICAO", "PRODUTO", "SISTEMA", "LINHA"]
    wb = Workbook()
    wb.remove(wb.active)
    aba(wb, "FOTOS_QUE_FALTAM", cab + ["MOTIVO", "OBS"], f_l)
    aba(wb, "SEM_APLICACAO", cab + ["TEM_REFERENCIA", "OBS"], a_l)
    aba(wb, "SEM_REFERENCIA", cab + ["TEM_APLICACAO", "OBS"], r_l)

    grupos = {"FOTOS_QUE_FALTAM": [p for p, _ in fotos], "SEM_APLICACAO": sem_a, "SEM_REFERENCIA": sem_r}
    motivos = Counter(m for _, m in fotos)
    res = [
        ["RESUMO", "T-0004 · pendências do catálogo online"],
        ["Fonte", f"site/data/produtos.json (gerado em {dados.get('gerado_em', '')})"],
        ["Produtos no site", len(ps)],
        ["Com foto real (chave i)", sum(1 for p in ps if p.get("i")) - motivos["arte indisponível"]],
        ["", ""],
        ["ABA", "TOTAL"],
        ["FOTOS_QUE_FALTAM", len(fotos)],
        ["  · sem arquivo", motivos["sem arquivo"]],
        ["  · arte indisponível", motivos["arte indisponível"]],
        ["SEM_APLICACAO", len(sem_a)],
        ["  · APLICACAO vazia", sum(1 for p in sem_a if not p.get("a"))],
        ["  · " + OBS_APLICACAO, sum(1 for p in sem_a if p.get("a"))],
        ["SEM_REFERENCIA", len(sem_r)],
        ["Códigos só de número (" + OBS_T0007 + ")", sum(1 for p in ps if p["c"].isdigit())],
        ["", ""],
    ]
    blocos = {}
    for nome, lista in grupos.items():
        for campo, chave in (("PRODUTO", "p"), ("SISTEMA", "si")):
            cont = Counter(p.get(chave, "") for p in lista)
            blocos[(nome, campo)] = cont
            res.append([f"{nome} por {campo}", "QTD"])
            res.extend([k, v] for k, v in sorted(cont.items(), key=lambda t: (-t[1], t[0])))
            res.append(["", ""])
    res += [["sha256 da base antes", hash_antes]]
    ws = aba(wb, "RESUMO", res[0], res[1:])
    for c in ws["A"]:
        if c.value and (c.value.startswith(("FOTOS_QUE", "SEM_")) and " por " in c.value or c.value == "ABA"):
            c.font = Font(bold=True)
    ws.column_dimensions["B"].width = 70

    # nenhum dado interno em nenhuma célula
    for w in wb.worksheets:
        for row in w.iter_rows(values_only=True):
            for v in row:
                if isinstance(v, str) and TRAVA.search(v):
                    sys.exit(f"[PARADO] dado interno na aba {w.title}: {v!r}")

    SAIDA.mkdir(parents=True, exist_ok=True)
    xlsx = SAIDA / f"Pendencias_Catalogo_Online_{DATA}.xlsx"
    hash_depois = sha256(BASE)
    ws.append(["sha256 da base depois", hash_depois])
    wb.save(xlsx)
    if hash_antes != hash_depois:
        sys.exit("[PARADO] a base mudou durante o relatório")

    md = [f"# Pendências do catálogo online · {DATA[6:]}/{DATA[4:6]}/{DATA[:4]} (T-0004)", "",
          f"Fonte: `site/data/produtos.json` (gerado em {dados.get('gerado_em', '')}), {len(ps)} produtos no site. "
          f"Planilha: `dados/relatorios/{xlsx.name}`. Só dados de catálogo; nenhum dado interno ou comercial.", "",
          "| Aba | Total | Detalhe |", "|---|---:|---|",
          f"| FOTOS_QUE_FALTAM | {len(fotos)} | sem arquivo: {motivos['sem arquivo']}; arte indisponível: "
          f"{motivos['arte indisponível']} |",
          f"| SEM_APLICACAO | {len(sem_a)} | APLICACAO vazia: {sum(1 for p in sem_a if not p.get('a'))}; "
          f"texto que não é aplicação: {sum(1 for p in sem_a if p.get('a'))} (TER556556) |",
          f"| SEM_REFERENCIA | {len(sem_r)} | REFERENCIAS_CRUZADAS vazia no site |", "",
          f"Os {sum(1 for p in ps if p['c'].isdigit())} códigos só de número (numerados de 1 a 164; "
          f"{sum(1 for p in ps if p['c'].isdigit() and p.get('p') == 'Terminal Axial')} Terminal Axial e "
          f"{sum(1 for p in ps if p['c'].isdigit() and p.get('p') != 'Terminal Axial')} Cubo de Roda) estão com OBS "
          f"\"{OBS_T0007}\".", "",
          "[SUPOSIÇÃO] o MOTIVO sai todo \"sem arquivo\", porque o commit 4414fa7 do main tirou a arte e o `i` "
          "desses produtos; dos 3.266, 1.007 eram a arte antes (efb39e9).", "",
          f"Os códigos {', '.join(sorted(CODIGO_SUSPEITO))} (Cruzetas) estão com OBS \"{OBS_CODIGO}\".", ""]
    for nome in grupos:
        for campo in ("PRODUTO", "SISTEMA"):
            top = sorted(blocos[(nome, campo)].items(), key=lambda t: (-t[1], t[0]))[:10]
            md += [f"## {nome} · top 10 por {campo}", "", f"| {campo} | Qtd |", "|---|---:|"]
            md += [f"| {k} | {v} |" for k, v in top] + [""]
    md += ["## Base unificada (não mudou)", "", f"- sha256 antes: `{hash_antes}`", f"- sha256 depois: `{hash_depois}`", ""]
    (SAIDA / f"Pendencias_Catalogo_Online_{DATA}.md").write_text("\n".join(md), encoding="utf-8")

    print(f"  {len(ps)} produtos; fotos {len(fotos)} {dict(motivos)}; sem aplicação {len(sem_a)}; "
          f"sem referência {len(sem_r)}")
    print(f"  sha256 base antes  {hash_antes}\n  sha256 base depois {hash_depois}")
    print(f"  {xlsx}")


if __name__ == "__main__":
    main()
