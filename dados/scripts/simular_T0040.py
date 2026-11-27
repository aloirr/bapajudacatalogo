"""T-0040 · SIMULAÇÃO da aba VEICULOS com a aplicação da Fraga (nada é gravado na base real).

Decisões do Alexandre (pelo po, 27/11/2026, "1) a / 2) a / 3) a"):
- 1a: os códigos achados pela Fraga pelo código BAP ('bap') ficam com a aplicação da Fraga na aba VEICULOS (as linhas
  de antes desses códigos saem; as dos outros códigos ficam como estão, na mesma ordem);
- 2a: uma linha por código + montadora + modelo + motor, com o ano mínimo e o máximo. A observação da Fraga ('DIANT',
  'COM FREIO ABS'...) vai para a VERSAO, depois do motor;
- 3a: os achados por referência ('ref:') NÃO trocam nada: vão à parte (aba REF da antes_depois), com o produto BAP em
  que cada um cai (o código achado pela Fraga na mesma página de produto);
- os não achados ficam como estão (aba NAO_ACHADOS).

Formato da VEICULOS: as mesmas 11 colunas (CAB_VEICULOS). A fonte vai no valor da ORIGEM ("Fraga T-0040"), sem coluna
nova. CILINDRADA: o "N.N L" do motor (fora da linha MOTO, em que o motor da Fraga vem em litros: "0.15 L").
Montadora e modelo: a grafia que a base já usa (MERCEDES-BENZ, CITROËN, "Gol"), quando casa sem acento e sem
espaço/hífen; senão, a da Fraga. Montadora UNIVERSAL, FORA DA FROTA BRASILEIRA, NAO VEICULAR e
SEM APLICAÇÃO NO CATÁLOGO: SITUACAO duvidoso (fora do filtro), com o MOTIVO.

Correção (testes, 27/11/2026): em 96 linhas da Fraga o motor vem com um "1" grudado no fim ("0.16 L 2V OHC
MONOCILÍNDRICO1"); está no CSV da Fraga, não no agrupamento. Só no motor, o "1" final grudado em letra sai
(SUFIXO_1); no modelo e na versão ("X1", "A1", "G1", "L1H1") o "1" faz parte do nome e fica. A aba SUFIXO_1 da
antes_depois lista as linhas da Fraga corrigidas, e a PONTOS_ALEXANDRE, o que o Alexandre precisa ver.

Limpeza dos complementos da VERSAO (design-de-marca, MC-0048 a MC-0050, 27/11/2026), por regra (obs_limpas):
- sai o "CATALOGO NÃO INFORMA ANO/MODELO" (a coluna Ano já mostra "—"; o ANO_DUVIDA continua dizendo);
- " | " vira " · ";
- a observação em caixa alta, como as outras ("Exceto Locker / ..." -> "EXCETO LOCKER / ...");
- sai a observação que é um pedaço (separado por " - ") de outra do mesmo grupo
  ("SEM AR CONDICIONADO - COM DIREÇÃO HIDRÁULICA · SEM AR CONDICIONADO" -> "SEM AR CONDICIONADO - COM DIREÇÃO
  HIDRÁULICA").
A aba LIMPEZA da antes_depois mostra cada linha da VEICULOS que mudou. Complementos com ano ou com outro veículo
("A PARTIR DE 02 / 1995 - ATÉ 07 / 1998", "FORD - C 60") ficam como estão e vão para a PONTOS_ALEXANDRE.

Saída (dados/T-0040/simulacao/): BASE_simulada_v29.xlsx (cópia da v28 com a VEICULOS nova) e antes_depois.xlsx.
A base real é conferida pelo sha256 antes e depois (e tem de ser a v28).

Uso: python3 dados/scripts/simular_T0040.py --fraga <resultado_fraga.csv>
"""
from __future__ import annotations

import argparse
import csv
import html
import re
import shutil
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl
from openpyxl.styles import Font

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import BASE, CAB_VEICULOS, RAIZ, limpo, sha, versao  # noqa: E402

SAIDA = RAIZ / "dados" / "T-0040" / "simulacao"
SIM = SAIDA / "BASE_simulada_v29.xlsx"
AD = SAIDA / "antes_depois.xlsx"
ORIGEM = "Fraga T-0040"
DUVIDOSAS = {"UNIVERSAL": "a Fraga diz montadora UNIVERSAL (não é veículo do filtro)",
             "FORA DA FROTA BRASILEIRA": "a Fraga diz FORA DA FROTA BRASILEIRA (não é veículo do filtro)",
             "NAO VEICULAR": "a Fraga diz NAO VEICULAR (não é veículo do filtro)",
             "SEM APLICAÇÃO NO CATÁLOGO": "a Fraga diz SEM APLICAÇÃO NO CATÁLOGO (não é veículo do filtro)"}
APELIDO_FAB = {"ASIAMOTORS": "ASIA", "EFFAMOTORS": "EFFA"}
SUFIXO_1 = re.compile(r"(?<=[A-Za-zÀ-ÿ])1$")      # "MONOCILÍNDRICO1" -> "MONOCILÍNDRICO" (só no motor)


def motor_limpo(m: str) -> str:
    """O motor da Fraga sem o "- " do começo e sem o "1" grudado no fim."""
    return SUFIXO_1.sub("", re.sub(r"^-\s*", "", m).strip())


SEM_ANO = "CATALOGO NÃO INFORMA ANO/MODELO"
ANO_NO_TEXTO = re.compile(r"\b(19|20)\d{2}\b")


def obs_limpas(obs: list[str]) -> list[str]:
    """As observações do grupo como entram na VERSAO (MC-0048 a MC-0050)."""
    o2 = [o.replace(" | ", " · ").upper() for o in obs if o.upper() != SEM_ANO]
    o2 = list(dict.fromkeys(o2))
    partes = {p.strip() for o in o2 for p in o.split(" - ") if " - " in o}
    return [o for o in o2 if " - " in o or o not in partes]


# pontos conferidos na Fraga (testes, 27/11/2026): código -> o que o Alexandre precisa saber
PONTOS = {
    "FAC6194": "Perde o modelo 'Titan Tractor': na Fraga ele é versão do Constellation ('19-320 E TITAN TRACTOR', "
               "INTERACT 8.3 L, 2005–2012), não modelo. Na v28 o 'Titan Tractor' veio da leitura do texto "
               "'Constellation 19-320 e Titan Tractor'. Com a Fraga fica Constellation e Worker; a APLICACAO não muda.",
    "VEL7507": "A Fraga só tem 1 aplicação (KTM EXC 250, 0.2 L). Saem YAMAHA DT e YAMAHA RD (1980–2015), que a "
               "APLICACAO cita ('Yamaha DT 180, RD 135, Tdr 180'). Pela decisão 1a fica só a da Fraga; se o "
               "Alexandre quiser manter as da Yamaha, é exceção à 1a.",
}
AMOSTRA_FIXA = ["BCE3001", "CXD13062"]
N_AMOSTRA = 50


def chave(s: str) -> str:
    s = unicodedata.normalize("NFKD", limpo(s)).encode("ascii", "ignore").decode().upper()
    return re.sub(r"[^A-Z0-9]", "", s)


def ler_fraga(p: Path) -> list[dict]:
    with p.open(encoding="utf-8-sig", newline="") as f:
        return [{k: limpo(v) for k, v in r.items()} for r in csv.DictReader(f, delimiter=";")]


def faixa(linhas) -> str:
    """'1996–2014 (12 sem ano)' das linhas (ANO_INICIO, ANO_FIM)."""
    ais = [a for a, _ in linhas if isinstance(a, int)]
    afs = [b for _, b in linhas if isinstance(b, int)]
    sem = sum(1 for a, b in linhas if not isinstance(a, int) and not isinstance(b, int))
    so_ini = sum(1 for a, b in linhas if isinstance(a, int) and not isinstance(b, int))
    t = f"{min(ais) if ais else '?'}–{max(afs) if afs else '?'}" if ais or afs else "sem ano"
    extra = [f"{sem} sem ano" for _ in [0] if sem] + [f"{so_ini} só com o inicial" for _ in [0] if so_ini]
    return t + (f" ({', '.join(extra)})" if extra else "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fraga", required=True)
    a = ap.parse_args()

    sha_antes = sha(BASE)
    if sha_antes != sha(versao(28)):
        sys.exit("[PARADO] a base real não é a v28")
    fraga = ler_fraga(Path(a.fraga))

    wb = openpyxl.load_workbook(BASE)
    ws = wb["VEICULOS"]
    cab = [limpo(c.value) for c in ws[1]]
    if cab != CAB_VEICULOS:
        sys.exit(f"[PARADO] cabeçalho da VEICULOS mudou: {cab}")
    antigas = [list(r) for r in ws.iter_rows(min_row=2, values_only=True)]

    prod = {}
    pc = [limpo(c.value) for c in wb["PRODUTOS"][1]]
    for r in wb["PRODUTOS"].iter_rows(min_row=2, values_only=True):
        if limpo(r[0]):
            prod[limpo(r[0]).upper()] = dict(zip(pc, (limpo(v) for v in r)))

    # grafia da base: montadora e (montadora, modelo)
    fab_base, mod_base = {}, {}
    for f, m in [(r[1], r[2]) for r in antigas] + [
            (r[0], r[1]) for r in wb["MODELOS_VEICULO"].iter_rows(min_row=2, values_only=True)]:
        if limpo(f):
            fab_base.setdefault(chave(f), limpo(f))
            if limpo(m):
                mod_base.setdefault((chave(f), chave(m)), limpo(m))

    def fab_de(f):
        k = chave(f)
        return fab_base.get(APELIDO_FAB.get(k, k), f)

    def mod_de(f, m):
        return mod_base.get((chave(fab_de(f)), chave(m)), m)

    bap = [r for r in fraga if r["achado_por"] == "bap"]
    ref = [r for r in fraga if r["achado_por"].startswith("ref:")]
    nao = [r for r in fraga if r["achado_por"] == "nao_achado"]
    trocar = sorted({r["codigo_bap"].upper() for r in bap})
    fora = sorted({r["codigo_bap"].upper() for r in fraga} - set(prod))
    if fora:
        sys.exit(f"[PARADO] códigos da Fraga fora da PRODUTOS: {fora[:20]}")

    # 2a: código + montadora + modelo + motor, ano mínimo e máximo
    grupos: dict[tuple, dict] = {}
    for r in bap:
        cod = r["codigo_bap"].upper()
        motor = motor_limpo(r["motor"])
        k = (cod, chave(r["montadora"]), chave(r["modelo"]), chave(motor))
        g = grupos.setdefault(k, {"cod": cod, "fab": fab_de(r["montadora"]), "mod": mod_de(r["montadora"], r["modelo"]),
                                  "motor": motor, "ai": [], "af": [], "obs": [], "vers": []})
        g["ai"].append(int(r["ano_inicial"]))
        g["af"].append(int(r["ano_final"]))
        o = html.unescape(r["observacao"]).strip()
        if o and o not in g["obs"]:
            g["obs"].append(o)
        if r["versao"] and r["versao"] not in g["vers"]:
            g["vers"].append(r["versao"])
    novas_por_cod: dict[str, list[list]] = defaultdict(list)
    bruta: dict[tuple[str, int], str] = {}          # a VERSAO sem a limpeza, para a aba LIMPEZA
    for g in sorted(grupos.values(), key=lambda g: (g["cod"], chave(g["fab"]), chave(g["mod"]), min(g["ai"]),
                                                    chave(g["motor"]))):
        moto = prod[g["cod"]].get("LINHA", "").upper() == "MOTO"
        cil = re.search(r"(\d+\.\d+)\s*L\b", g["motor"])
        ver = " · ".join([g["motor"]] + obs_limpas(g["obs"]))
        bruta[(g["cod"], len(novas_por_cod[g["cod"]]))] = " · ".join([g["motor"]] + g["obs"])
        duv = DUVIDOSAS.get(g["fab"].upper())
        novas_por_cod[g["cod"]].append([
            g["cod"], g["fab"], g["mod"], ver, min(g["ai"]), max(g["af"]), ORIGEM,
            "duvidoso" if duv else "separado", duv,
            cil.group(1) if cil and not moto else None,
            "a Fraga diz 'CATALOGO NÃO INFORMA ANO/MODELO'" if any("NÃO INFORMA ANO" in o for o in g["obs"]) else None])

    # VEICULOS nova: as linhas dos outros códigos ficam na ordem; as dos códigos trocados entram onde o código
    # aparecia (os que não tinham linha entram no fim)
    sai = set(trocar)
    nova, postos = [], set()
    for r in antigas:
        cod = limpo(r[0]).upper()
        if cod in sai:
            if cod not in postos:
                nova += novas_por_cod[cod]
                postos.add(cod)
            continue
        nova.append(r)
    for cod in trocar:
        if cod not in postos:
            nova += novas_por_cod[cod]

    ws.delete_rows(2, ws.max_row)
    for r in nova:
        ws.append(r)
    SAIDA.mkdir(parents=True, exist_ok=True)
    wb.save(SIM)

    # conferência da cópia simulada: as outras abas célula a célula iguais à v28; a VEICULOS dos outros códigos igual
    erros = []
    v28 = openpyxl.load_workbook(BASE, read_only=True)
    simw = openpyxl.load_workbook(SIM, read_only=True)
    if v28.sheetnames != simw.sheetnames:
        erros.append("abas diferentes")
    for aba in v28.sheetnames:
        if aba == "VEICULOS":
            continue
        if list(v28[aba].iter_rows(values_only=True)) != list(simw[aba].iter_rows(values_only=True)):
            erros.append(f"aba {aba} mudou")
    sv = list(simw["VEICULOS"].iter_rows(values_only=True))
    if [limpo(c) for c in sv[0]] != CAB_VEICULOS:
        erros.append("cabeçalho da VEICULOS mudou")
    if [tuple(r) for r in antigas if limpo(r[0]).upper() not in sai] != \
            [tuple(r) for r in sv[1:] if limpo(r[0]).upper() not in sai]:
        erros.append("VEICULOS dos códigos fora da troca mudou")
    if erros:
        sys.exit(f"[PARADO] {erros}")

    # ---- antes_depois.xlsx
    antes_cod = defaultdict(list)
    for r in antigas:
        antes_cod[limpo(r[0]).upper()].append(r)
    out = openpyxl.Workbook()
    neg = Font(bold=True)

    def aba(nome, cab_, linhas):
        w = out.create_sheet(nome)
        w.append(cab_)
        for c in w[1]:
            c.font = neg
        for l in linhas:
            w.append(l)
        w.freeze_panes = "A2"
        return w

    cont_csv = Counter(r["codigo_bap"].upper() for r in bap)

    def saem_entram(an, de):
        """Modelos (montadora + modelo, das linhas separadas) que saem e que entram com a troca."""
        def mods(ls):
            return {(chave(r[1]), chave(r[2])): f"{limpo(r[1])} {limpo(r[2])}" for r in ls
                    if limpo(r[7]) == "separado" and limpo(r[1]) and limpo(r[2])}
        a_, d_ = mods(an), mods(de)
        saem = [a_[k] for k in sorted(a_.keys() - d_.keys())]
        return [len(saem), "; ".join(saem), len(d_.keys() - a_.keys())]
    resumo = []
    for cod in trocar:
        an, de = antes_cod.get(cod, []), novas_por_cod[cod]
        p = prod[cod]
        resumo.append([cod, p.get("DESCRICAO"), p.get("PRODUTO"), p.get("LINHA"), len(an),
                       sum(1 for r in an if limpo(r[7]) == "separado"), len(de),
                       sum(1 for r in de if r[7] == "separado"), faixa([(r[4], r[5]) for r in an]) if an else "(sem linha)",
                       faixa([(r[4], r[5]) for r in de]), cont_csv[cod]] + saem_entram(an, de))
    out.remove(out.active)
    aba("RESUMO", ["CODIGO_BAP", "DESCRICAO", "PRODUTO", "LINHA", "LINHAS_ANTES", "SEPARADAS_ANTES", "LINHAS_DEPOIS",
                   "SEPARADAS_DEPOIS", "ANOS_ANTES", "ANOS_DEPOIS", "LINHAS_DA_FRAGA (antes de agrupar)", "MODELOS_QUE_SAEM", "QUAIS_SAEM (montadora modelo)",
                   "MODELOS_QUE_ENTRAM"], resumo)

    # amostra: as fixas, uma de moto e as outras espalhadas pela lista (passo fixo, sem sorteio)
    motos = [c for c in trocar if prod[c].get("LINHA", "").upper() == "MOTO"]
    amostra = [c for c in AMOSTRA_FIXA if c in sai] + motos[:1]
    passo = max(1, len(trocar) // N_AMOSTRA)
    for c in trocar[::passo]:
        if len(amostra) >= N_AMOSTRA:
            break
        if c not in amostra:
            amostra.append(c)
    det = []
    for cod in amostra:
        for r in antes_cod.get(cod, []):
            det.append([cod, "ANTES"] + list(r[1:]))
        for r in novas_por_cod[cod]:
            det.append([cod, "DEPOIS"] + r[1:])
    aba("DETALHE", ["CODIGO_BAP", "ANTES_OU_DEPOIS"] + CAB_VEICULOS[1:], det)

    url2cod = defaultdict(set)
    for r in bap:
        url2cod[r["url_ou_endpoint"]].add(r["codigo_bap"].upper())
    refs = {}
    for r in ref:
        cod = r["codigo_bap"].upper()
        e = refs.setdefault(cod, {"ref": r["achado_por"][4:], "url": r["url_ou_endpoint"], "n": 0, "mont": Counter()})
        e["n"] += 1
        e["mont"][f'{r["montadora"]} {r["modelo"]}'] += 1
    lref = []
    for cod, e in refs.items():
        cai = sorted(url2cod.get(e["url"], set()))
        p = prod[cod]
        lref.append([cod, p.get("DESCRICAO"), p.get("PRODUTO"), e["ref"], ", ".join(cai) or "(nenhum código BAP achado "
                     "na mesma página da Fraga)", " | ".join(prod[c].get("DESCRICAO", "") for c in cai), e["n"],
                     ", ".join(m for m, _ in e["mont"].most_common(5)), len(antes_cod.get(cod, [])), e["url"],
                     "não troca (3a): conferir"])
    aba("REF_27", ["CODIGO_BAP", "DESCRICAO", "PRODUTO", "REFERENCIA_QUE_ACHOU", "PRODUTO_BAP_EM_QUE_CAI (mesma página)",
                   "DESCRICAO_DO_QUE_CAI", "APLICACOES_DA_FRAGA", "VEICULOS_PRINCIPAIS", "LINHAS_VEICULOS_HOJE",
                   "URL_FRAGA", "DECISAO"], lref)

    lnao = []
    for r in nao:
        cod = r["codigo_bap"].upper()
        p, an = prod[cod], antes_cod.get(cod, [])
        lnao.append([cod, p.get("DESCRICAO"), p.get("PRODUTO"), p.get("LINHA"), p.get("NO_CATALOGO_DIGITAL"),
                     p.get("STATUS_CADASTRO"), len(an), sum(1 for x in an if limpo(x[7]) == "separado"),
                     sum(1 for x in an if limpo(x[7]) == "duvidoso"), faixa([(x[4], x[5]) for x in an]) if an else "",
                     p.get("APLICACAO", "")[:300]])
    aba("NAO_ACHADOS", ["CODIGO_BAP", "DESCRICAO", "PRODUTO", "LINHA", "NO_CATALOGO_DIGITAL", "STATUS_CADASTRO",
                        "LINHAS_VEICULOS_HOJE", "SEPARADAS", "DUVIDOSAS", "ANOS_HOJE", "APLICACAO (300 primeiros)"],
        lnao)
    suf = [[r["codigo_bap"].upper(), r["montadora"], r["modelo"], r["versao"], r["motor"],
            motor_limpo(r["motor"]), r["ano_inicial"], r["ano_final"]]
           for r in bap if SUFIXO_1.search(r["motor"].strip())]
    aba("SUFIXO_1", ["CODIGO_BAP", "MONTADORA", "MODELO", "VERSAO_FRAGA", "MOTOR_NA_FRAGA", "MOTOR_NA_VEICULOS",
                     "ANO_INICIAL", "ANO_FINAL"], suf)
    lim = [[cod, r[1], r[2], bruta[(cod, i)], r[3]] for cod in trocar for i, r in enumerate(novas_por_cod[cod])
           if bruta[(cod, i)] != r[3]]
    aba("LIMPEZA", ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO_SEM_LIMPEZA", "VERSAO_NA_VEICULOS"], lim)
    pontos = []
    for cod, txt in PONTOS.items():
        an, de = antes_cod.get(cod, []), novas_por_cod.get(cod, [])
        pontos.append([cod, prod[cod].get("DESCRICAO"), "; ".join(f"{limpo(r[1])} {limpo(r[2])}" for r in an),
                       "; ".join(sorted({f"{r[1]} {r[2]}" for r in de})), cont_csv[cod], txt])
    # complementos com ano ou com outro veículo: ficam como estão; o Alexandre decide
    marcas = set(fab_base) | {chave(r["montadora"]) for r in bap}
    comp = defaultdict(set)
    for cod in trocar:
        for r in novas_por_cod[cod]:
            for o in limpo(r[3]).split(" · ")[1:]:
                if ANO_NO_TEXTO.search(o) or chave(re.split(r"[\s-]", o)[0]) in marcas:
                    comp[(cod, o)].add(f"{r[1]} {r[2]}")
    for (cod, o), vs in sorted(comp.items()):
        pontos.append([cod, prod[cod].get("DESCRICAO"), "", "; ".join(sorted(vs)), cont_csv[cod],
                       f"Complemento da Fraga com ano ou outro veículo, mantido na VERSAO como veio: '{o}'. "
                       "Não foi mexido (fora do pedido): decidir se vira ano, outra linha ou sai."])
    aba("PONTOS_ALEXANDRE", ["CODIGO_BAP", "DESCRICAO", "VEICULOS_ANTES (montadora modelo)",
                             "VEICULOS_DEPOIS (montadora modelo)", "LINHAS_DA_FRAGA", "O_QUE_A_FRAGA_TEM"], pontos)
    for w in out.worksheets:
        for col, larg in zip("ABCDEFGHIJKLMN", (14, 40, 26, 22, 14, 14, 14, 14, 22, 22, 40, 14, 50, 14)):
            w.column_dimensions[col].width = larg
    out.save(AD)

    if sha(BASE) != sha_antes:
        sys.exit("[PARADO] a base real mudou durante a simulação")
    print(f"  base real sha256 {sha_antes} (igual antes e depois; é a v28)")
    print(f"  VEICULOS: {len(antigas)} linhas antes, {len(nova)} depois")
    print(f"  códigos trocados (bap): {len(trocar)}; linhas da Fraga: {len(bap)} -> {len(grupos)} agrupadas")
    print(f"  por referência: {len(refs)}; não achados: {len(nao)}")
    print(f"  sufixo '1' tirado do motor: {len(suf)} linhas da Fraga, {len({x[0] for x in suf})} códigos")
    print(f"  códigos que perdem modelo: {sum(1 for l in resumo if l[11])} ({sum(l[11] for l in resumo)} modelos); "
          f"que ganham: {sum(1 for l in resumo if l[13])} ({sum(l[13] for l in resumo)})")
    print(f"  {SIM.relative_to(RAIZ)}\n  {AD.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
