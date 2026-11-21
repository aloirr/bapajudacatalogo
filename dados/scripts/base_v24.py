"""v24 da base unificada · T-0017 (21 veículos das referências cruzadas repetidas).

Pedido: R-20261121-102700-alexandre ("reveja tudo e valide os casos iguais"). Aprovado em R-20261121-112900-alexandre
("1) a": a v24 com os 21 veículos; "2) a": as regras de segurança ficam). A simulação é a da aba VALIDOS de
dados/simulacoes/T-0017-v24/ (commit bdcd5e9). Regra fixa (R-20261120-213300): nada novo marcado nem escrito como
duvidoso; nenhum produto sai.

O que faz (regra 4 do CLAUDE.md):
1. Para cada linha da VALIDOS (21 veículos em 12 códigos), depois de conferir o valor de hoje:
   - APLICACAO do código A: acrescenta no fim " ; " e o trecho de V copiado, literal, da APLICACAO do código B (o
     resto da célula não muda). As linhas do mesmo código somam: o ANTES de cada uma é o DEPOIS da anterior;
   - VEICULOS: uma linha nova no fim da aba, a linha de V do código B com o CODIGO_BAP de A e a CILINDRADA do trecho
     copiado ("separado", sem MOTIVO e sem ANO_DUVIDA). O filtro da aba vai até a nova última linha.
2. Duas linhas no LOG_CORRECOES por veículo (APLICACAO_HERDADA e VEICULO_NOVO) e o bloco da v24 no topo do LEIA-ME.
3. Compara célula a célula (valor e formatação), em todas as abas, a base nova com a v23 (base_comum.rodar): só podem
   mudar as 12 células APLICACAO, as 21 linhas novas no fim da VEICULOS e as linhas novas do LOG_CORRECOES e do LEIA-ME.
4. Grava a base e uma cópia idêntica em dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v24.xlsx.

Uso: python3 dados/scripts/base_v24.py            (grava)
     python3 dados/scripts/base_v24.py --conferir (só compara a base de hoje com a v23)
"""
from __future__ import annotations

import sys
from copy import copy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (RAIZ, acrescentar_leia_me, acrescentar_log, conferir_celulas, ler_antes_depois,  # noqa: E402
                        limpo, parar, rodar, vazio)

SIM = RAIZ / "dados" / "simulacoes" / "T-0017-v24" / "SIMULACAO_v24_T-0017.xlsx"
TAREFA, DATA = "T-0017", "21/11/2026"
APROVACAO = "R-20261121-112900-alexandre ('1) a': v24 com os 21 veículos; '2) a': as regras de segurança ficam)"
COLS_V = ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "ORIGEM", "SITUACAO", "MOTIVO",
          "CILINDRADA", "ANO_DUVIDA"]
CAB = ["CODIGO_A", "LINHA_PRODUTOS", "FABRICANTE", "MODELO_V", "ANOS (de B)", "TRECHO_COPIADO_DE_B", "REFERENCIA_PROVA",
       "CODIGO_B", "OUTROS_B", "FAMILIA", "POSICAO", "LADO", "APLICACAO_ANTES", "APLICACAO_DEPOIS",
       "VEICULOS_LINHA_NOVA (" + " | ".join(COLS_V) + ")", "OBS", "NO_SITE"]
N_VEICULOS, N_CODIGOS = 21, 12
DE_B = ("FABRICANTE", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "ORIGEM", "SITUACAO")   # iguais à linha de V em B

LEIA_ME = [
    ("BASE BAP UNIFICADA v24 (21/11/2026)", None),
    ("APLICACAO (12 códigos)", "21 veículos das referências cruzadas repetidas (regra de prova de "
                               "R-20261121-102700-alexandre): no fim da APLICACAO do código A entra ' ; ' e o trecho do "
                               "veículo copiado, literal, da APLICACAO do código B com a mesma referência, família, "
                               "peça, posição e lado; o resto da célula não muda (T-0017)."),
    ("VEICULOS (21 linhas novas)", "Uma linha por veículo no fim da aba: a linha do código B com o CODIGO_BAP do A e a "
                                   "CILINDRADA do trecho copiado; 'separado', sem MOTIVO e sem ANO_DUVIDA (T-0017)."),
    ("Não entram", "Os 3.296 casos da aba FORA da simulação (dados/simulacoes/T-0017-v24/), com o motivo de cada um; "
                   "o Palio no AMT7500 e no AMT7014 (só anúncio como prova nesta rodada); nenhuma marca nova de ano "
                   "incerto; nenhum produto sai."),
    ("Formato", "Mesmas abas e colunas da v23 (as 5 primeiras da PRODUTOS, que a BAP Central lê, na mesma ordem). A "
                "VEICULOS ganha 21 linhas no fim. 42 linhas no LOG_CORRECOES (duas por veículo). Aprovado em "
                "R-20261121-112900-alexandre."),
    (None, None),
]


def ler() -> list[dict]:
    """A aba VALIDOS da simulação: 21 veículos em 12 códigos."""
    linhas = ler_antes_depois(SIM, CAB, "VALIDOS")
    if len(linhas) != N_VEICULOS or len({x["CODIGO_A"] for x in linhas}) != N_CODIGOS:
        raise SystemExit(f"[PARADO] a simulação traz {len(linhas)} veículos em "
                         f"{len({x['CODIGO_A'] for x in linhas})} códigos; esperado {N_VEICULOS} em {N_CODIGOS}")
    return linhas


def linha_nova(texto: str) -> dict:
    """A linha nova da VEICULOS como a simulação a mostra ("-" = vazio; os anos são números)."""
    v = dict(zip(COLS_V, (None if x == "-" else x for x in texto.split(" | "))))
    for k in ("ANO_INICIO", "ANO_FIM"):
        v[k] = int(v[k]) if v[k] is not None else None
    return v


def aplicar(wb, linhas):
    wv, wp = wb["VEICULOS"], wb["PRODUTOS"]
    cv = [limpo(c.value) for c in wv[1]]
    if cv != COLS_V:
        raise SystemExit(f"[PARADO] cabeçalho da VEICULOS: {cv}")
    cp = [limpo(c.value) for c in wp[1]]
    ip = {c: cp.index(c) + 1 for c in ("CODIGO_BAP", "APLICACAO")}
    linha_p: dict[str, list[int]] = {}
    for n in range(2, wp.max_row + 1):
        linha_p.setdefault(limpo(wp.cell(n, ip["CODIGO_BAP"]).value), []).append(n)
    veic: dict[str, list[dict]] = {}
    for r in wv.iter_rows(min_row=2, max_row=wv.max_row, values_only=True):
        veic.setdefault(limpo(r[0]), []).append(dict(zip(COLS_V, r)))

    erros, fp, novas, log = [], {}, [], []
    origem = (f"Simulação em dados/simulacoes/T-0017-v24/ (aba VALIDOS); aprovado em {APROVACAO}. {TAREFA} (v24), "
              f"{DATA}")
    for x in linhas:
        a, b, n, trecho = x["CODIGO_A"], x["CODIGO_B"], x["LINHA_PRODUTOS"], x["TRECHO_COPIADO_DE_B"]
        antes, depois = vazio(x["APLICACAO_ANTES"]), x["APLICACAO_DEPOIS"]
        if linha_p.get(a) != [n] or len(linha_p.get(b, [])) != 1:
            erros.append(f"{a}: a linha na PRODUTOS não é a da simulação ({linha_p.get(a)}), ou {b} não é único")
            continue
        hoje = fp.get((n, ip["APLICACAO"]), wp.cell(n, ip["APLICACAO"]).value)   # as linhas do mesmo código somam
        aplic_b = limpo(wp.cell(linha_p[b][0], ip["APLICACAO"]).value)
        itens = trecho.split(" - ", 1)[1].split(" · ")
        if hoje != antes or depois != (antes + " ; " if antes else "") + trecho or any(i not in aplic_b for i in itens):
            erros.append(f"{a} APLICACAO: o valor de hoje, o DEPOIS ou o trecho de {b} não é o da simulação")
            continue
        v = linha_nova(x[CAB[14]])
        em_b = [r for r in veic.get(b, []) if all(r[k] == v[k] for k in DE_B)]
        if (v["CODIGO_BAP"] != a or v["FABRICANTE"] != x["FABRICANTE"] or len(em_b) != 1 or v["SITUACAO"] != "separado"
                or v["MOTIVO"] or v["ANO_DUVIDA"] or em_b[0]["MOTIVO"] or em_b[0]["ANO_DUVIDA"]
                or any(r["FABRICANTE"] == v["FABRICANTE"] and r["MODELO"] == v["MODELO"] for r in veic.get(a, []))):
            erros.append(f"{a} VEICULOS {v['MODELO']}: a linha nova não é a linha de V em {b} ou o veículo já está em A")
            continue
        fp[(n, ip["APLICACAO"])] = depois
        novas.append(v)
        anos = f"{v['ANO_INICIO']}" + (f"–{v['ANO_FIM']}" if v["ANO_FIM"] else ">")
        log.append(["APLICACAO_HERDADA", "PRODUTOS", a, b,
                    f"APLICACAO: acrescentado no fim ' ; {trecho}', copiado literal da APLICACAO do {b} (mesma "
                    f"referência {x['REFERENCIA_PROVA']}; mesma família, peça, posição e lado). O resto da célula não "
                    f"muda. {origem}"])
        log.append(["VEICULO_NOVO", "VEICULOS", a, b,
                    f"VEICULOS: linha nova no fim da aba, {v['FABRICANTE']} {v['MODELO']} {anos}, CILINDRADA "
                    f"{v['CILINDRADA'] or 'vazia'} (a linha do {b}, com a CILINDRADA do trecho copiado), separado, "
                    f"sem MOTIVO e sem ANO_DUVIDA. Nada marcado como duvidoso. {origem}"])
    parar(erros)
    for (n, c), val in fp.items():
        wp.cell(n, c).value = val
    ult_v, fv = wv.max_row, {}
    for i, v in enumerate(novas, 1):
        for c, k in enumerate(COLS_V, 1):
            cel, modelo = wv.cell(ult_v + i, c), wv.cell(ult_v, c)
            cel.value = v[k]
            cel._style = copy(modelo._style)            # o formato da última linha de hoje
            fv[(ult_v + i, c)] = v[k]
    if wv.auto_filter.ref:
        wv.auto_filter.ref = f"A1:{wv.auto_filter.ref.split(':')[1].rstrip('0123456789')}{wv.max_row}"
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, LEIA_ME)
    print(f"  células: PRODUTOS {len(fp)}; VEICULOS +{len(novas)} linhas; LOG_CORRECOES +{len(log)}; "
          f"LEIA-ME +{leia_n}")
    return {"PRODUTOS": set(fp), "VEICULOS": set()}, ult, leia_n, (fp, fv)


if __name__ == "__main__":
    rodar(23, 24, ler, aplicar, conferir_celulas, novas_no_fim={"VEICULOS": N_VEICULOS})
