"""Funções comuns dos dados/scripts/base_vNN.py (RD-0041), a partir da v19.

Os base_v15 a base_v18 ficam como rodaram (são o registro de cada versão); da v19 em diante, o que se repetia neles
mora aqui: limpo, sha, a assinatura de formatação da célula, a conferência célula a célula contra a versão anterior,
a linha nova no LOG_CORRECOES e a gravação da base com a cópia em dados/versoes/.
"""
from __future__ import annotations

import collections
import hashlib
import shutil
from copy import copy
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parents[2]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
VERSOES = RAIZ / "dados" / "versoes"
CAB_LOG = ["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"]


def versao(n: int) -> Path:
    return VERSOES / f"BASE_BAP_UNIFICADA_PRODUTOS_BAP_v{n}.xlsx"


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def assinatura(c):
    return tuple(copy(getattr(c, k)) for k in ("font", "fill", "border", "alignment", "protection")) + (
        c.number_format,)


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


def comparar(novo: Path, velho: Path, celulas: dict[str, set], log_ult: int, rotulo: str) -> list[str]:
    """Diferenças entre a base nova e a versão anterior fora das permitidas. Lista vazia = só o que a tarefa pede.

    celulas: {aba: {(linha, coluna), ...}} que TÊM de mudar de valor (a formatação delas não pode mudar).
    log_ult: última linha do LOG_CORRECOES antes das linhas novas (só elas podem aparecer no fim da aba).
    """
    a, b = openpyxl.load_workbook(novo), openpyxl.load_workbook(velho)
    if a.sheetnames != b.sheetnames:
        return [f"abas: {a.sheetnames} x {b.sheetnames}"]
    dif, conta = [], collections.Counter()
    for nome in b.sheetnames:
        wa, wb_ = a[nome], b[nome]
        extra = set(range(log_ult + 1, wa.max_row + 1)) if nome == "LOG_CORRECOES" else set()
        pode = celulas.get(nome, set())
        if wa.max_column != wb_.max_column:
            dif.append(f"{nome}: colunas {wa.max_column} x {wb_.max_column}")
        if [c.value for c in wa[1]] != [c.value for c in wb_[1]]:
            dif.append(f"{nome}: cabeçalho mudou")
        if wa.max_row != wb_.max_row + len(extra):
            dif.append(f"{nome}: linhas {wa.max_row} x {wb_.max_row} + {len(extra)}")
        if wa.freeze_panes != wb_.freeze_panes:
            dif.append(f"{nome}: freeze_panes")
        if wa.auto_filter.ref != wb_.auto_filter.ref:
            dif.append(f"{nome}: auto_filter")
        if {k: d.width for k, d in wa.column_dimensions.items()} != {k: d.width for k, d in wb_.column_dimensions.items()}:
            dif.append(f"{nome}: larguras de coluna")
        ha = {r: d.height for r, d in wa.row_dimensions.items() if d.height and r not in extra}
        hb = {r: d.height for r, d in wb_.row_dimensions.items() if d.height}
        if ha != hb:
            dif.append(f"{nome}: alturas de linha")
        for r in range(1, wb_.max_row + 1):
            for c in range(1, wb_.max_column + 1):
                ca, cb = wa.cell(r, c), wb_.cell(r, c)
                conta[nome] += 1
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
          f"+{a['LOG_CORRECOES'].max_row - log_ult} linhas; diferenças fora do permitido: {len(dif)}")
    for n, cs in celulas.items():
        if conta[n + "_mudou"] != len(cs):
            dif.append(f"{n}: {conta[n + '_mudou']} células mudaram; esperado {len(cs)}")
    return dif


def gravar(nova: Path, destino_versao: Path) -> None:
    """Copia a base nova (já conferida) para a base principal e para a versão em dados/versoes/."""
    shutil.copyfile(nova, BASE)
    shutil.copyfile(nova, destino_versao)
    print(f"  {BASE.relative_to(RAIZ)}: sha256 {sha(BASE)}")
    print(f"  {destino_versao.relative_to(RAIZ)}: sha256 {sha(destino_versao)}")
