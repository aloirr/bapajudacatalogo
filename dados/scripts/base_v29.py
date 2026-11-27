"""v29 da base unificada · T-0040 (aplicação da Fraga somada à aba VEICULOS).

Decisões do Alexandre (pelo po, 27/11/2026): 2a (código + montadora + modelo + motor, ano mínimo e máximo), 3a (os 27
achados por referência não trocam nada; os 483 não achados ficam como estão) e a 1a nova, de R-20261127-053555-po: a
Fraga SE SOMA à aplicação atual (somar() do simular_T0040.py):
- a linha atual com ano completo fica; do mesmo motor ou versão e com faixa que se encosta, junta a faixa;
- a linha atual sem ano ou só com um ano recebe os anos da Fraga do mesmo código + montadora + modelo (ORIGEM continua
  "automático"; a fonte do ano vai para o LOG), só se não tem ano nenhum ou se o ano que tem cai dentro da faixa da
  Fraga; em conflito, fica como está e a Fraga entra como linha somada (aba CONFLITOS); sem o modelo na Fraga, fica e
  continua na lista de trabalho;
- os outros grupos da Fraga entram como linhas novas (ORIGEM "Fraga T-0040").
A simulação é a de dados/T-0040/simulacao/ (commit cf9db10, dados/scripts/simular_T0040.py, com o sufixo "1" do motor
e a limpeza MC-0048 a MC-0050): a VEICULOS da v29 é, linha a linha, a da BASE_simulada_v29.xlsx (gerada pelo
simular_T0040.py; não fica no repositório depois da v29).

AUTORIZAÇÃO: o padrão é "pendente do aprovado do Alexandre". Depois do aprovado, roda-se de novo com
--refazer --autorizacao "R-…" (o texto fica "aprovado em R-…"): a base e a v29 voltam à v28 do origin/main e a v29 é
gravada outra vez, igual, só com o texto da autorização trocado no LOG_CORRECOES, no LEIA-ME e no AVISO_BAP_CENTRAL.md.

O que faz (regra 4 do CLAUDE.md):
1. VEICULOS: as linhas da v28 ficam todas, na ordem (só ANO_INICIO e ANO_FIM mudam, pela regra); as da Fraga entram
   logo depois da última linha do código. As mesmas 11 colunas; o filtro vai até a nova última linha;
2. PRODUTOS e as outras abas não mudam. A APLICACAO (campo digitado) NÃO é reescrita;
3. LOG_CORRECOES: uma linha por código e tipo (VEICULO_SOMADO, ANO_COMPLETADO, FAIXA_JUNTADA); o bloco da v29 no topo
   do LEIA-ME;
4. compara a base nova com a v28 (base_comum.comparar, fora a VEICULOS) e a VEICULOS com a da simulação, célula a
   célula (valor e formatação), e grava a base e a cópia em dados/versoes/.

Uso: python3 dados/scripts/base_v29.py                                    (grava, com a autorização pendente)
     python3 dados/scripts/base_v29.py --refazer --autorizacao "R-…"      (depois do aprovado)
"""
from __future__ import annotations

import argparse
from collections import Counter
import re
import subprocess
import sys
import tempfile
from copy import copy
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (BASE, CAB_VEICULOS, RAIZ, acrescentar_leia_me, acrescentar_log, assinatura,  # noqa: E402
                        comparar, conferir_cabecalho, gravar, limpo, linhas_novas, parar, sha, versao)
from simular_T0040 import ORIGEM, SIM, SUFIXO_1, ano, conferir_soma, faixa, tipo_ano  # noqa: E402

TAREFA, DATA = "T-0040", "27/11/2026"
SIM_COMMIT = "cf9db10"                                  # a simulação com a 1a nova
AUTORIZACAO = "pendente do aprovado do Alexandre"                                 # sem o --autorizacao
SHA_SIM = "fd45b6197a44d72ec4e9f4b8f7df0405287d26462b26d9f937459e8e2c559688"   # BASE_simulada_v29.xlsx (cf9db10)
AVISO = RAIZ / "dados" / "T-0040" / "AVISO_BAP_CENTRAL.md"
SITUACAO_AVISO = re.compile(r"(## Situação\n\n).*\Z", re.S)
REGRA = "decisão 1a nova, R-20261127-053555-po: a Fraga se soma"

def leia_me(autorizacao: str, n: dict) -> list[tuple]:
    return [
        ("BASE BAP UNIFICADA v29 (27/11/2026)", None),
        ("VEICULOS (Fraga somada)", f"A aplicação da Fraga dos códigos achados pelo código BAP SE SOMA à atual "
                                    "(decisão 1a nova, R-20261127-053555-po): " f"{n['somadas']} linhas novas (ORIGEM 'Fraga T-0040', valor novo), uma "
                                    f"por montadora + modelo + motor, com o ano mínimo e o máximo; {n['completadas']} "
                                    f"linhas atuais com o ano completado pela Fraga e {n['juntadas']} com a faixa "
                                    f"junta (ORIGEM continua 'automático'). Nenhuma linha atual sai. Os 27 achados por "
                                    f"referência e os 483 não achados ficam como estavam (T-0040)."),
        ("Regras da soma", "A linha atual que tem VERSAO ou CILINDRADA absorve a Fraga do mesmo motor quando a "
                           "faixa cabe ou se encosta (junta a faixa); a linha atual sem VERSAO e sem CILINDRADA não "
                           "absorve: a Fraga entra ao lado, com o detalhe do motor (por isso o Escort do BCE3001 "
                           "absorveu e o Fox do CXD13062 não). 'Se encostam' = até 1 ano de distância (2010 e 2011). "
                           "A linha da Fraga sem motor com a mesma faixa de uma atual sem VERSAO não entra. A linha "
                           "incompleta só recebe o ano da Fraga se não tem ano ou se o ano que tem cai na faixa da "
                           "Fraga; em conflito fica como está e a Fraga entra somada. O po e o Alexandre decidem se "
                           "mudam."),
        ("Grafia da Fraga", "Nas linhas da Fraga, a montadora e o modelo seguem a grafia da base: VOLARE vira "
                            "MARCOPOLO Volare e o modelo da Fraga ('A6', 'WFLY') vai para o começo da VERSAO; o modelo "
                            "da Fraga que começa (por palavra inteira) por um modelo da base da mesma montadora vira o "
                            "da base, e o resto vai para o começo da VERSAO ('SPRINTER FURGÃO' -> Sprinter, 'FURGÃO'). "
                            "O que não casa fica como veio (T-0040, RD-0695)."),
        ("APLICACAO", "O texto da APLICACAO na PRODUTOS não muda (campo digitado; reescrever depende de decisão do "
                      "Alexandre)."),
        ("Limpeza da Fraga", "Nas linhas da Fraga: motor sem o '1' grudado no fim ('MONOCILÍNDRICO1'); nos "
                             "complementos sai o 'CATALOGO NÃO INFORMA ANO/MODELO' (o ANO_DUVIDA diz), ' | ' vira "
                             "' · ', caixa alta e sai o complemento repetido (T-0040)."),
        ("Formato", f"Mesmas abas e colunas da v28 (VEICULOS com 11 colunas). Uma linha por código e tipo no "
                    f"LOG_CORRECOES (VEICULO_SOMADO, ANO_COMPLETADO, FAIXA_JUNTADA). Simulação em "
                    f"dados/T-0040/simulacao/ ({SIM_COMMIT}). Autorização: {autorizacao}."),
        (None, None),
    ]


def ler_sim() -> list[tuple]:
    """As linhas da VEICULOS da simulação."""
    wb = openpyxl.load_workbook(SIM, read_only=True)
    linhas = list(wb["VEICULOS"].iter_rows(values_only=True))
    wb.close()
    if [limpo(c) for c in linhas[0]] != CAB_VEICULOS:
        raise SystemExit("[PARADO] cabeçalho da VEICULOS da simulação mudou")
    return [tuple(r) for r in linhas[1:]]


def mudancas(antigas: list[tuple], novas: list[tuple]) -> dict[str, dict[str, list]]:
    """{código: {tipo: [(linha antes, linha depois)]}}: as linhas da v28 são as de ORIGEM diferente de 'Fraga T-0040',
    na ordem; ANO_COMPLETADO = sem ano completo e agora com; FAIXA_JUNTADA = ano completo e a faixa cresceu;
    VEICULO_SOMADO = linha nova da Fraga."""
    io = CAB_VEICULOS.index("ORIGEM")
    velhas = [r for r in novas if r[io] != ORIGEM]
    if len(velhas) != len(antigas):
        parar([f"a simulação tem {len(velhas)} linhas que não são da Fraga; a v28 tem {len(antigas)}"])
    m: dict[str, dict[str, list]] = {}
    for a, d in zip(antigas, velhas):
        if a[4:6] != d[4:6]:
            t = "FAIXA_JUNTADA" if tipo_ano(a[4], a[5]) == "completa" else "ANO_COMPLETADO"
            m.setdefault(limpo(a[0]).upper(), {}).setdefault(t, []).append((a, d))
    for d in novas:
        if d[io] == ORIGEM:
            m.setdefault(limpo(d[0]).upper(), {}).setdefault("VEICULO_SOMADO", []).append((None, d))
    return m


def aviso(autorizacao: str) -> str:
    """O AVISO_BAP_CENTRAL.md com a seção Situação da autorização."""
    if autorizacao == AUTORIZACAO:
        sit = (f"A v29 está no branch `catalogo-dados/T-0040-v29`, **pendente do aprovado do Alexandre** (simulação "
               f"{SIM_COMMIT}). Só vale depois do merge no `main`.\n")
    else:
        sit = (f"A v29 foi {autorizacao.replace('aprovado', 'aprovada', 1)} (simulação {SIM_COMMIT}). Vale a partir "
               f"do merge no `main`.\n")
    texto = AVISO.read_text(encoding="utf-8")
    if not SITUACAO_AVISO.search(texto):
        raise SystemExit("[PARADO] o AVISO_BAP_CENTRAL.md não tem a seção '## Situação' no fim")
    return SITUACAO_AVISO.sub(lambda m: m.group(1) + sit, texto)


def refazer() -> None:
    """Volta a base e a v29 para a v28 do origin/main (a v29 de versoes sai), para gravar de novo."""
    b = subprocess.run(["git", "-C", str(RAIZ), "show", "origin/main:dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"],
                       capture_output=True, check=True).stdout
    BASE.write_bytes(b)
    if sha(BASE) != sha(versao(28)):
        raise SystemExit("[PARADO] a base do origin/main não é a v28: o main mudou, refaça a simulação")
    versao(29).unlink(missing_ok=True)
    print(f"  --refazer: base de volta à v28 do origin/main ({sha(BASE)}); a v29 de versoes saiu")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--autorizacao", default=AUTORIZACAO, help="o recado do aprovado (padrão: pendente)")
    ap.add_argument("--refazer", action="store_true", help="volta a base à v28 do origin/main e grava a v29 de novo")
    arg = ap.parse_args()
    if not limpo(arg.autorizacao):
        raise SystemExit("[PARADO] --autorizacao vazia")
    autorizacao = AUTORIZACAO if arg.autorizacao == AUTORIZACAO else f"aprovado em {limpo(arg.autorizacao)}"
    if sha(SIM) != SHA_SIM:
        raise SystemExit(f"[PARADO] a BASE_simulada_v29.xlsx não é a da simulação {SIM_COMMIT} (sha256 diferente)")
    texto_aviso = aviso(autorizacao)
    if arg.refazer:
        refazer()
    v28, v29 = versao(28), versao(29)
    if v29.exists():
        raise SystemExit(f"[PARADO] {v29.name} já existe: a v29 já foi gravada")
    sha_antes = sha(BASE)
    if sha_antes != sha(v28):
        raise SystemExit("[PARADO] a base de hoje não é a v28: refaça a simulação")
    novas = ler_sim()

    wb = openpyxl.load_workbook(BASE)
    ws = wb["VEICULOS"]
    conferir_cabecalho(ws, CAB_VEICULOS)
    io, isit = CAB_VEICULOS.index("ORIGEM"), CAB_VEICULOS.index("SITUACAO")
    antigas = [tuple(r) for r in ws.iter_rows(min_row=2, values_only=True)]
    cods_prod = {limpo(r[0]).upper() for r in wb["PRODUTOS"].iter_rows(min_row=2, values_only=True) if limpo(r[0])}

    mud = mudancas(antigas, novas)
    erros = [f"códigos fora da PRODUTOS: {sorted(set(mud) - cods_prod)[:10]}"] if set(mud) - cods_prod else []
    erros += conferir_soma(list(antigas), novas, set(mud))
    if any(r[io] == ORIGEM for r in antigas):
        erros.append("a v28 já tem ORIGEM 'Fraga T-0040'")
    if any(SUFIXO_1.search(limpo(r[3]).split(" · ")[0]) for r in novas if r[io] == ORIGEM):
        erros.append("ainda há motor com o '1' grudado na simulação")
    parar(erros)

    # 1. VEICULOS: os valores da simulação, com a formatação da linha 2 da v28 em cada coluna
    modelo = [copy(ws.cell(2, c)._style) for c in range(1, 12)]
    if ws.max_row > len(novas) + 1:
        ws.delete_rows(len(novas) + 2, ws.max_row - len(novas) - 1)
    for i, r in enumerate(novas, 2):
        for c, v in enumerate(r, 1):
            cel = ws.cell(i, c)
            cel.value = v
            cel._style = copy(modelo[c - 1])
    ws.auto_filter.ref = f"A1:K{len(novas) + 1}"

    # 3. LOG_CORRECOES: uma linha por código e tipo
    fim = (f"APLICACAO da PRODUTOS sem mudança. Simulação em dados/T-0040/simulacao/ ({SIM_COMMIT}). "
           f"Autorização: {autorizacao}. {TAREFA} (v29), {DATA}")
    log, n = [], {"somadas": 0, "completadas": 0, "juntadas": 0}
    for cod in sorted(mud):
        for tipo in ("VEICULO_SOMADO", "ANO_COMPLETADO", "FAIXA_JUNTADA"):
            pares = mud[cod].get(tipo)
            if not pares:
                continue
            if tipo == "VEICULO_SOMADO":
                de = [d for _, d in pares]
                sep = sum(1 for r in de if r[isit] == "separado")
                n["somadas"] += len(de)
                txt = (f"VEICULOS: +{len(de)} linha(s) da Fraga ({sep} separada(s), {len(de) - sep} duvidosa(s)), "
                       f"uma por montadora + modelo + motor, com o ano mínimo e o máximo, ORIGEM 'Fraga T-0040'; "
                       f"anos {faixa([(r[4], r[5]) for r in de])}; as linhas atuais ficam ({REGRA}).")
            else:
                quais = "; ".join(f"{limpo(a[1])} {limpo(a[2])}{' ' + limpo(a[3]) if limpo(a[3]) else ''} "
                                  f"{ano(a)} -> {ano(d)}" for a, d in pares)
                if tipo == "ANO_COMPLETADO":
                    n["completadas"] += len(pares)
                    txt = (f"VEICULOS: {len(pares)} linha(s) sem ano completo com os anos da Fraga T-0040 da mesma "
                           f"montadora e do mesmo modelo ({quais}); ORIGEM continua 'automático' ({REGRA}).")
                else:
                    n["juntadas"] += len(pares)
                    txt = (f"VEICULOS: {len(pares)} linha(s) com a faixa junta com a da Fraga T-0040 do mesmo motor "
                           f"ou versão ({quais}); ORIGEM continua 'automático' ({REGRA}).")
            log.append([tipo, "VEICULOS", cod, None, f"{txt} {fim}"])
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, leia_me(autorizacao, n))
    print(f"  VEICULOS: {len(antigas)} linhas antes, {len(novas)} depois; {n}; códigos com mudança: {len(mud)}; "
          f"LOG_CORRECOES +{len(log)} ({dict(Counter(x[0] for x in log))}); LEIA-ME +{leia_n}")

    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / BASE.name
        wb.save(p)
        # 4. fora da VEICULOS: só o LOG_CORRECOES (no fim) e o LEIA-ME (no topo) mudam
        dif = [d for d in comparar(p, v28, {}, ult, "v28", leia_n=leia_n) if not d.startswith("VEICULOS")]
        esperado, achado = linhas_novas(wb, ult, leia_n), linhas_novas(openpyxl.load_workbook(p), ult, leia_n)
        dif += [f"{aba}: o texto das linhas novas não é o que o script escreve" for aba in esperado
                if achado[aba] != esperado[aba]]
        # a VEICULOS gravada: igual à da simulação, com a formatação, as larguras e o congelamento da v28
        a, b = openpyxl.load_workbook(p)["VEICULOS"], openpyxl.load_workbook(v28)["VEICULOS"]
        if [tuple(r) for r in a.iter_rows(min_row=2, values_only=True)] != novas:
            dif.append("VEICULOS: as linhas não são as da simulação")
        if [c.value for c in a[1]] != [c.value for c in b[1]] or a.max_column != 11:
            dif.append("VEICULOS: cabeçalho ou número de colunas mudou")
        if a.freeze_panes != b.freeze_panes or a.auto_filter.ref != f"A1:K{len(novas) + 1}":
            dif.append("VEICULOS: congelamento ou filtro")
        if {k: d.width for k, d in a.column_dimensions.items()} != {k: d.width for k, d in b.column_dimensions.items()}:
            dif.append("VEICULOS: larguras de coluna")
        forma = [assinatura(b.cell(2, c)) for c in range(1, 12)]
        if any(assinatura(a.cell(r, c)) != forma[c - 1] for r in range(2, a.max_row + 1) for c in range(1, 12)):
            dif.append("VEICULOS: formatação de célula diferente da v28")
        if sha(BASE) != sha_antes:
            dif.append("a base mudou durante a gravação")
        parar(dif)
        gravar(p, v29)
    AVISO.write_text(texto_aviso, encoding="utf-8")
    print(f"  autorização: {autorizacao}")
    print(f"  sha256 antes (v28): {sha_antes}")


if __name__ == "__main__":
    main()
