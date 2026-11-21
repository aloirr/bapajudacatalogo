"""Funções comuns dos dados/scripts/base_vNN.py (RD-0041), a partir da v19.

Os base_v15 a base_v19 ficam como rodaram (são o registro de cada versão); da v19 em diante, o que se repetia neles
mora aqui: limpo, sha, a assinatura de formatação da célula, a conferência célula a célula contra a versão anterior,
a linha nova no LOG_CORRECOES e a gravação da base com a cópia em dados/versoes/. Da v20 em diante, também o fluxo
do main() (--conferir, "vNN já existe", sha da versão anterior, pasta temporária, comparar e gravar): rodar() (RD-0217).
Da v23 em diante, também a leitura da aba ANTES_DEPOIS da simulação, o "(vazio)" e a conferência do valor gravado em
cada célula (RD-0247; o base_v22.py fica como rodou). Da v24 em diante, as linhas novas no fim de uma aba (ex.: a
VEICULOS), com o filtro estendido até a nova última linha (novas_no_fim).
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import re
import shutil
import sys
import tempfile
from copy import copy
from pathlib import Path

import openpyxl
from openpyxl.utils import get_column_letter

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
VERSOES = RAIZ / "dados" / "versoes"
CAB_LOG = ["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"]
VAZIO = "(vazio)"                     # como a simulação mostra a célula vazia


def versao(n: int) -> Path:
    return VERSOES / f"BASE_BAP_UNIFICADA_PRODUTOS_BAP_v{n}.xlsx"


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def assinatura(c):
    return tuple(copy(getattr(c, k)) for k in ("font", "fill", "border", "alignment", "protection")) + (
        c.number_format,)


def subir(r: int, removidas) -> int:
    """A linha r da versão anterior na versão nova, depois de tiradas as linhas de removidas (as de baixo sobem)."""
    return r - sum(x < r for x in removidas)


def parar(erros: list[str]) -> None:
    """Para sem gravar, mostrando até 30 erros (da v21 em diante; os scripts antigos ficam como rodaram)."""
    if erros:
        print("[PARADO] nada foi gravado:")
        for e in erros[:30]:
            print("   ", e)
        sys.exit(2)


def vazio(v):
    """O valor da simulação na base: "(vazio)" é a célula vazia."""
    return None if v == VAZIO else v


def ler_antes_depois(sim: Path, cab: list[str], aba: str = "ANTES_DEPOIS") -> list[dict]:
    """A aba da simulação (ANTES_DEPOIS; na v24, VALIDOS), uma linha por mudança, depois de conferir o cabeçalho."""
    wb = openpyxl.load_workbook(sim, read_only=True)
    it = wb[aba].iter_rows(values_only=True)
    achado = list(next(it))
    if achado != cab:
        raise SystemExit(f"[PARADO] cabeçalho da {aba}: {achado}")
    linhas = [dict(zip(cab, r)) for r in it if r[0]]
    wb.close()
    return linhas


def conferir_celulas(p: Path, extra) -> list[str]:
    """Na base gravada, cada célula tem o valor da gravação. extra = (feitas na PRODUTOS, feitas na VEICULOS)."""
    fp, fv = extra
    wb = openpyxl.load_workbook(p, read_only=False)
    dif = []
    for aba, feitas in (("PRODUTOS", fp), ("VEICULOS", fv)):
        ws = wb[aba]
        dif += [f"{aba} {ws.cell(n, c).coordinate}: valor diferente do da gravação"
                for (n, c), v in feitas.items() if ws.cell(n, c).value != v]
    return dif


def acrescentar_log(wb, linhas: list[list]) -> int:
    """Acrescenta as linhas no fim do LOG_CORRECOES (nenhuma linha antiga sai). Devolve a última linha de antes."""
    lg = wb["LOG_CORRECOES"]
    if [limpo(c.value) for c in lg[1]][:5] != CAB_LOG:
        raise SystemExit("[PARADO] cabeçalho do LOG_CORRECOES mudou: nada foi gravado")
    ult = lg.max_row
    for i, linha in enumerate(linhas, 1):
        for j, v in enumerate(linha, 1):
            lg.cell(ult + i, j).value = v
    return ult


def acrescentar_leia_me(wb, linhas: list[tuple]) -> int:
    """Põe as linhas no topo do LEIA-ME, como da v15 à v18 (nada sai; as antigas descem com a altura).

    Devolve quantas linhas entraram."""
    lm = wb["LEIA-ME"]
    n = len(linhas)
    alturas = {r: d.height for r, d in lm.row_dimensions.items() if d.height}
    lm.insert_rows(1, n)
    for r in list(lm.row_dimensions):
        lm.row_dimensions[r].height = None
    for r, h in alturas.items():
        lm.row_dimensions[r + n].height = h
    for i, linha in enumerate(linhas, 1):
        for j, v in enumerate(linha, 1):
            lm.cell(i, j).value = v
    return n


def linhas_novas(wb, log_ult: int, leia_n: int) -> dict[str, list[tuple]]:
    """O texto das linhas novas: as do fim do LOG_CORRECOES e as do topo do LEIA-ME."""
    lg, lm = wb["LOG_CORRECOES"], wb["LEIA-ME"]
    return {"LOG_CORRECOES": [tuple(c.value for c in r) for r in lg.iter_rows(min_row=log_ult + 1, max_row=lg.max_row,
                                                                             max_col=len(CAB_LOG))],
            "LEIA-ME": [tuple(c.value for c in r) for r in lm.iter_rows(min_row=1, max_row=leia_n, max_col=2)]}


def comparar(novo: Path, velho: Path, celulas: dict[str, set], log_ult: int, rotulo: str,
             colunas_novas: dict[str, list[str]] | None = None, leia_n: int = 0,
             removidas: dict[str, set[int]] | None = None, novas_no_fim: dict[str, int] | None = None) -> list[str]:
    """Diferenças entre a base nova e a versão anterior fora das permitidas. Lista vazia = só o que a tarefa pede.

    celulas: {aba: {(linha, coluna), ...}} que TÊM de mudar de valor (a formatação delas não pode mudar).
    log_ult: última linha do LOG_CORRECOES antes das linhas novas (só elas podem aparecer no fim da aba).
    colunas_novas: {aba: [nomes]} das colunas acrescentadas no fim da aba (regra 6). O cabeçalho delas tem de ser
    esses nomes; fora das células permitidas, ficam vazias; a formatação, a largura e o filtro delas são novos.
    leia_n: linhas novas no topo do LEIA-ME (as antigas descem leia_n linhas).
    removidas: {aba: {linhas da versão anterior que saem}} (da v21); as de baixo sobem, e o filtro termina na nova
    última linha. As células de celulas ficam na numeração da versão anterior.
    novas_no_fim: {aba: quantas linhas novas no fim da aba} (da v24). As linhas de cima não mudam de lugar; o filtro
    termina na nova última linha; o valor das linhas novas é conferido à parte (conferir_extra do rodar()).
    """
    colunas_novas = colunas_novas or {}
    removidas = removidas or {}
    novas_no_fim = novas_no_fim or {}
    if set(novas_no_fim) & ({"LOG_CORRECOES", "LEIA-ME"} | set(removidas)):
        raise ValueError("novas_no_fim não vale para o LOG_CORRECOES, o LEIA-ME nem aba com linhas removidas")
    a, b = openpyxl.load_workbook(novo), openpyxl.load_workbook(velho)
    if a.sheetnames != b.sheetnames:
        return [f"abas: {a.sheetnames} x {b.sheetnames}"]
    dif, conta = [], collections.Counter()
    for nome in b.sheetnames:
        wa, wb_ = a[nome], b[nome]
        desloc, extra = 0, set()
        if nome == "LOG_CORRECOES":
            extra = set(range(log_ult + 1, wa.max_row + 1))
        if nome == "LEIA-ME" and leia_n:
            desloc, extra = leia_n, set(range(1, leia_n + 1))
        n_fim = novas_no_fim.get(nome, 0)
        if n_fim:
            extra = set(range(wb_.max_row + 1, wb_.max_row + n_fim + 1))
        pode = celulas.get(nome, set())
        fora = removidas.get(nome, set())
        novas = colunas_novas.get(nome, [])
        mc = wb_.max_column                  # guardado: ler wb_.cell() além dele aumenta o max_column
        ncol = mc + len(novas)
        letras_novas = {get_column_letter(c) for c in range(mc + 1, ncol + 1)}
        if wa.max_column != ncol:
            dif.append(f"{nome}: colunas {wa.max_column} x {mc} + {len(novas)}")
        if [c.value for c in wa[1 + desloc]] != [c.value for c in wb_[1]] + novas:
            dif.append(f"{nome}: cabeçalho mudou")
        if wa.max_row != wb_.max_row + len(extra) - len(fora):
            dif.append(f"{nome}: linhas {wa.max_row} x {wb_.max_row} + {len(extra)} - {len(fora)}")
        if wa.freeze_panes != wb_.freeze_panes:
            dif.append(f"{nome}: freeze_panes")
        filtro = wb_.auto_filter.ref
        if novas and filtro:
            filtro = filtro.replace(get_column_letter(mc), get_column_letter(ncol))
        if fora and filtro:
            filtro = re.sub(r"\d+$", lambda m: str(subir(int(m.group(0)) + 1, fora) - 1), filtro)
        if n_fim and filtro:
            filtro = re.sub(r"\d+$", lambda m: str(int(m.group(0)) + n_fim), filtro)
        if wa.auto_filter.ref != filtro:
            dif.append(f"{nome}: auto_filter")
        if ({k: d.width for k, d in wa.column_dimensions.items() if k not in letras_novas}
                != {k: d.width for k, d in wb_.column_dimensions.items()}):
            dif.append(f"{nome}: larguras de coluna")
        ha = {r: d.height for r, d in wa.row_dimensions.items() if d.height and r not in extra}
        hb = {subir(r, fora) + desloc: d.height for r, d in wb_.row_dimensions.items() if d.height and r not in fora}
        if ha != hb:
            dif.append(f"{nome}: alturas de linha")
        for r in range(1, wb_.max_row + 1):
            if r in fora:
                continue
            for c in range(1, ncol + 1):
                ca, cb = wa.cell(subir(r, fora) + desloc, c), wb_.cell(r, c)
                conta[nome] += 1
                if c > mc:                             # coluna nova: só as células permitidas têm valor
                    if (r, c) in pode:
                        conta[nome + "_mudou"] += ca.value not in (None, "")
                        if ca.value in (None, ""):
                            dif.append(f"{nome} {ca.coordinate}: devia ter valor e está vazia")
                    elif r > 1 and ca.value is not None:
                        dif.append(f"{nome} {ca.coordinate}: valor na coluna nova fora do permitido")
                    continue
                if (r, c) in pode:
                    if ca.value != cb.value:
                        conta[nome + "_mudou"] += 1
                    else:
                        dif.append(f"{nome} {cb.coordinate}: devia mudar e não mudou")
                    if assinatura(ca) != assinatura(cb):
                        dif.append(f"{nome} {cb.coordinate}: formatação mudou")
                    continue
                if ca.value != cb.value:
                    dif.append(f"{nome} {cb.coordinate}: valor mudou")
                elif assinatura(ca) != assinatura(cb):
                    dif.append(f"{nome} {cb.coordinate}: formatação mudou")
    partes = [f"{n} {conta[n]} células conferidas, {conta[n + '_mudou']} mudaram (esperado {len(celulas[n])})"
              for n in celulas]
    print(f"  comparação com a {rotulo}: " + "; ".join(partes) + f"; LOG_CORRECOES "
          f"+{a['LOG_CORRECOES'].max_row - log_ult} linhas; LEIA-ME +{leia_n} linhas; diferenças fora do permitido: "
          f"{len(dif)}")
    for n, cs in celulas.items():
        if conta[n + "_mudou"] != len(cs):
            dif.append(f"{n}: {conta[n + '_mudou']} células mudaram; esperado {len(cs)}")
    return dif


def rodar(anterior: int, nova: int, ler, aplicar, conferir_extra=None,
          colunas_novas: dict[str, list[str]] | None = None, removidas: dict[str, set[int]] | None = None,
          novas_no_fim: dict[str, int] | None = None) -> None:
    """O main() de cada base_vNN.py (RD-0217): grava a v<nova> a partir da v<anterior>, ou, com --conferir, só compara.

    ler() -> dados da simulação aprovada; aplicar(wb, dados) -> (celulas, log_ult, leia_n, extra), como em comparar();
    conferir_extra(base, extra) -> lista de diferenças a mais (ex.: o valor gravado em cada célula).
    Além da contagem, confere o TEXTO das linhas novas do LOG_CORRECOES e do LEIA-ME com o que aplicar() escreve.
    """
    va, vn = versao(anterior), versao(nova)
    ap = argparse.ArgumentParser()
    ap.add_argument("--conferir", action="store_true", help=f"só compara a base de hoje com a v{anterior}")
    arg = ap.parse_args()
    dados = ler()

    def diferencas(p: Path, wb, celulas, ult, leia_n, extra) -> list[str]:
        dif = comparar(p, va, celulas, ult, f"v{anterior}", colunas_novas, leia_n, removidas, novas_no_fim)
        esperado, achado = linhas_novas(wb, ult, leia_n), linhas_novas(openpyxl.load_workbook(p), ult, leia_n)
        for aba in esperado:
            if achado[aba] != esperado[aba]:
                n = sum(x != y for x, y in zip(achado[aba], esperado[aba]))
                dif.append(f"{aba}: o texto das linhas novas não é o que o script escreve ({n} diferentes, "
                           f"{len(achado[aba])} x {len(esperado[aba])} linhas)")
        return dif + (conferir_extra(p, extra) if conferir_extra else [])

    if arg.conferir:
        wb = openpyxl.load_workbook(va)
        dif = diferencas(BASE, wb, *aplicar(wb, dados))
        for d in dif[:30]:
            print("   ", d)
        sys.exit(1 if dif else 0)
    if vn.exists():
        raise SystemExit(f"[PARADO] {vn.name} já existe: a v{nova} já foi gravada")
    if sha(BASE) != sha(va):
        raise SystemExit(f"[PARADO] a base de hoje não é a v{anterior}: refaça a simulação")
    wb = openpyxl.load_workbook(BASE)
    resultado = aplicar(wb, dados)
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / BASE.name
        wb.save(p)
        dif = diferencas(p, wb, *resultado)
        if dif:
            print(f"[PARADO] a base nova difere da v{anterior} fora do que a tarefa pede (nada foi gravado):")
            for d in dif[:30]:
                print("   ", d)
            sys.exit(2)
        gravar(p, vn)


def gravar(nova: Path, destino_versao: Path) -> None:
    """Copia a base nova (já conferida) para a base principal e para a versão em dados/versoes/."""
    shutil.copyfile(nova, BASE)
    shutil.copyfile(nova, destino_versao)
    print(f"  {BASE.relative_to(RAIZ)}: sha256 {sha(BASE)}")
    print(f"  {destino_versao.relative_to(RAIZ)}: sha256 {sha(destino_versao)}")
