"""T-0017 v23 (SIMULAÇÃO, nada é gravado na base): monta SIMULACAO_v23_T-0017.xlsx e numeros_v23.json.

Três casos pedidos em R-20261120-235000-alexandre (item 1.3): CRU100, SCE14002 e FAC6108. Só leem a base.

Uso: python3 -I simular_v23.py <base.xlsx> <pasta_saida>
"""
import hashlib
import json
import sys
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font

VAZIO = "(vazio)"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "FABRICANTE", "MODELO", "ANTES", "DEPOIS", "PROVA", "RECOMENDACAO",
       "ENTRA"]

# CRU100: o trecho da Hyundai HR com os dados da linha HYUNDAI da tabela de origem, guardada no LOG_CORRECOES da v21
CRU_ANTES, CRU_DEPOIS = "Hyunday HR (07/2017)", "Hyundai HR 2.5 4x2 (04/2007–12/2017)"
CRU_LOG = ("LINHA_REMOVIDA", "HYUNDAI", "CRU100")                       # TIPO, CODIGO_ANTES_OU_NOVO, REFERENCIA
CRU_PROVA = ["COLUNA_2: HR", "COLUNA_4: 04/07 - 12/17", "COLUNA_5: 4x2", "COLUNA_6: 2.5"]
# FAC6108: a Eclipse Cross herdou o ano da Outlander na VEICULOS (v20); o texto não tem ano para ela (P5 a da v21)
FAC = ("FAC6108", "MITSUBISHI", "Eclipse Cross")
FAC_HOJE = {"ANO_INICIO": 2009, "ANO_FIM": 2012, "ANO_DUVIDA": "herdado: o ano vem depois de outro modelo da lista"}
FAC_PROVA = "Eclipse Cross 1.5 L 16V · Outlander 2.0 L 16V 2009–2012"
# SCE14002: o texto quebrado já saiu da APLICACAO na v21 (P2 a)
SCE = ("SCE14002", "1929–19321934", "1929 · 1932 · 1934")


def main(base, saida):
    saida = Path(saida)
    wb = openpyxl.load_workbook(base, read_only=True)
    wp = wb["PRODUTOS"]
    cp = [str(c.value).strip() for c in next(wp.iter_rows(max_row=1))]
    prod = {}
    for n, r in enumerate(wp.iter_rows(min_row=2, values_only=True), 2):
        prod.setdefault(r[0], []).append((n, dict(zip(cp, r))))
    lv = [dict(zip(("TIPO", "ABA", "COD", "REF", "OBS"), r[:5]))
          for r in wb["LOG_CORRECOES"].iter_rows(min_row=2, values_only=True)]
    wv = wb["VEICULOS"]
    cv = [str(c.value).strip() for c in next(wv.iter_rows(max_row=1))]
    veic = [(n, dict(zip(cv, r))) for n, r in enumerate(wv.iter_rows(min_row=2, values_only=True), 2)]
    wb.close()
    sha = hashlib.sha256(Path(base).read_bytes()).hexdigest()
    cel, fora = [], []

    # 1. CRU100
    (n, p), = prod["CRU100"]
    hoje = str(p["APLICACAO"])
    assert hoje.count(CRU_ANTES) == 1, hoje
    guardada = [x for x in lv if (x["TIPO"], x["COD"], x["REF"]) == CRU_LOG]
    assert len(guardada) == 1 and all(t in guardada[0]["OBS"] for t in CRU_PROVA), guardada
    cel.append(["CRU100", "PRODUTOS", n, "APLICACAO", None, None, hoje, hoje.replace(CRU_ANTES, CRU_DEPOIS),
                "Linha HYUNDAI da tabela de aplicação do CRU100 na planilha de origem, guardada no LOG_CORRECOES "
                "(LINHA_REMOVIDA, v21): " + " | ".join(CRU_PROVA) + " (Ano = 04/2007 a 12/2017)",
                "a) trocar só o trecho da Hyundai HR; o da Kia fica", "sim"])
    fora.append(["CRU100", "APLICACAO (trecho da Kia)", "'Kia Motors Bongo 2500 (07/2017)' fica: a linha KIA MOTORS "
                 "da origem (Bongo, K2500, Cardan A) não tem ano; não há fonte para o '07/2017' nem para outro ano."])
    fora.append(["CRU100", "VEICULOS (Hyundai HR)", "Não há linha da Hyundai HR na VEICULOS. Pôr linha nova é a "
                 "decisão da P12 da v21 (linhas novas na VEICULOS), que não entrou: fica para o Alexandre."])
    fora.append(["CRU100", "Embalagem e Cardan", "'Embalagem (mm) 90 x 90 x 35' e 'Cardan -/A' da tabela de origem "
                 "não são aplicação nem estão na lista branca da ficha: continuam só no LOG_CORRECOES."])

    # 2. FAC6108
    linhas = [(n, v) for n, v in veic if (v["CODIGO_BAP"], v["FABRICANTE"], v["MODELO"]) == FAC]
    assert len(linhas) == 1, linhas
    n, v = linhas[0]
    assert {k: v[k] for k in FAC_HOJE} == FAC_HOJE, v
    (_, p), = prod["FAC6108"]
    assert FAC_PROVA in str(p["APLICACAO"]) and "em Diante" not in str(p["APLICACAO"])
    for col, antes in FAC_HOJE.items():
        cel.append(["FAC6108", "VEICULOS", n, col, FAC[1], FAC[2], antes, VAZIO,
                    f"APLICACAO: '{FAC_PROVA}' (o 2009–2012 é da Outlander); o 'em Diante' sem ano saiu na v21 "
                    "(P5 a: 'o veículo fica sem ano')", "b) forma neutra: a Eclipse Cross fica sem ano", "sim"])

    # 3. SCE14002
    (_, p), = prod["SCE14002"]
    assert SCE[1] not in str(p["APLICACAO"]) and SCE[2] in str(p["APLICACAO"])
    fora.append(["SCE14002", "APLICACAO e VEICULOS", f"Nada a corrigir na base: '{SCE[1]}' virou '{SCE[2]}' na v21 "
                 "(P2 a, linha no LOG_CORRECOES). A VEICULOS tem LS 1630 e LS 1941, sem texto quebrado; os LS 1929, "
                 "1932 e 1934 seriam linhas novas (P12 da v21), que ficam para o Alexandre. O texto antigo só "
                 "continua em catalogo_grafico/gerador/digital_data.json (do catalogo-grafico)."])

    num = {"base_sha256": sha, "celulas": len(cel), "por_aba": {a: sum(c[1] == a for c in cel)
                                                                 for a in ("PRODUTOS", "VEICULOS")},
           "codigos": sorted({c[0] for c in cel}), "fora": len(fora), "log_previsto": len(cel)}
    out = openpyxl.Workbook()
    le = out.active
    le.title = "LEIA"
    for t in ["T-0017 · v23 da base unificada: SIMULAÇÃO (nada gravado)",
              f"Base de partida: v22 (sha256 {sha[:8]}…{sha[-4:]}). Pedido: R-20261120-235000-alexandre, item 1.3.",
              "Regra fixa (R-20261120-213300): nada novo marcado nem escrito como duvidoso.",
              f"{len(cel)} células mudam ({num['por_aba']['PRODUTOS']} na PRODUTOS, {num['por_aba']['VEICULOS']} na "
              f"VEICULOS); {len(fora)} pontos ficam de fora (aba FORA).",
              "O script base_v23.py lê a aba ANTES_DEPOIS."]:
        le.append([t])
    ad = out.create_sheet("ANTES_DEPOIS")
    ad.append(CAB)
    for c in cel:
        ad.append(c)
    fo = out.create_sheet("FORA")
    fo.append(["CODIGO_BAP", "ONDE", "POR QUE FICA"])
    for f in fora:
        fo.append(f)
    b = Font(bold=True)
    for s in out.worksheets[1:]:
        for c in s[1]:
            c.font = b
        s.freeze_panes = "A2"
        for col in s.columns:
            w = max(len(str(x.value or "")) for x in col)
            s.column_dimensions[col[0].column_letter].width = min(max(10, w + 2), 80)
        for row in s.iter_rows(min_row=2):
            for x in row:
                x.alignment = Alignment(vertical="top", wrap_text=True)
    out.save(saida / "SIMULACAO_v23_T-0017.xlsx")
    json.dump(num, open(saida / "numeros_v23.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(num, ensure_ascii=False))
    for c in cel:
        print(c[0], c[1], c[2], c[3], repr(c[6]), "->", repr(c[7]))


if __name__ == "__main__":
    main(*sys.argv[1:3])
