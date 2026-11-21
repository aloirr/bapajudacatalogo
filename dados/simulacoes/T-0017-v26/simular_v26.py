"""T-0017 v26 (SIMULAÇÃO, aprovada; este script só lê a base): SCE14002, CRU100, VEICULOS, CV-F35 e nomes.

Pedido: R-20261121-190649-alexandre, item 3 (e o R-20261121-190933-alexandre, que confirma o CV-F35 2010–2013).
Aprovado em R-20261121-195140-alexandre ("1 a 2 a 3 a 4 a", via po): a v26 como simulada, "Mbb" → "MB", as outras
grafias da aba FORA também ("MBB", "NEW BEETLE", "New beetle", "New Beatle" e "Vw") e o "MB … MB" fica. A gravação é
a do dados/scripts/base_v26.py, que lê a ANTES_DEPOIS e a VEICULOS_NOVA desta simulação.
Só lê a base. Monta, numa pasta temporária, a base como ficaria (para conferir com o base_comum.comparar que só mudam
as células e as linhas desta tarefa) e roda o scripts/gerar_site.py numa cópia, com a v25 e com a simulada, para dizer
o que muda no site. Nada é gravado em dados/BASE_*, em dados/versoes/ nem em site/.

1. SCE14002: "1929 · 1932 · 1934" são modelos LS da Mercedes-Benz, não anos (saem do cálculo de ano).
2. CRU100: Kia Bongo "a partir de 07/2017" → "(07/2017>)"; a VEICULOS da Bongo perde o ANO_DUVIDA (a dúvida acabou).
3. VEICULOS, como normais (separado, sem MOTIVO e sem ANO_DUVIDA), com o ano do texto: a Hyundai HR do CRU100 e os
   LS 1929, 1932 e 1934 do SCE14002 (linhas novas no fim da aba); a Parati e o Santana do CIL8546 (as linhas já
   existem como duvidoso: passam a separado, com 1983–2006).
4. CV-F35: Fiesta 2010–2013 (ANO_FIM 2013; o texto traz "05/2010–04/2013").
5. MF22: a "AUTOIMPACT MA21" fica (só conferido).
6. Nomes: "Mbb" e "MBB" → "MB"; "Vwc" e "Vw" → "VW"; "NEW Beetle", "NEW BEETLE", "New beetle" e "New Beatle" →
   "New Beetle". Só na APLICACAO, palavra inteira e com a caixa exata.

Monta SIMULACAO_v26_T-0017.xlsx (LEIA, ANTES_DEPOIS, VEICULOS_NOVA, FORA, SITE, LOG_CORRECOES_PREVISTO) e
numeros_v26.json.

Uso, na raiz do repositório:
    python3 -I dados/simulacoes/T-0017-v26/simular_v26.py dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v25.xlsx \
        dados/simulacoes/T-0017-v26
"""
import collections
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font

RAIZ = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(RAIZ / "dados" / "scripts")]
from base_comum import (CAB_LOG, CAB_VEICULOS, VAZIO, acrescentar_linhas, comparar, limpo,  # noqa: E402
                        sha, versao)

TAREFA, DATA = "T-0017", "21/11/2026"
PEDIDO = "R-20261121-190649-alexandre, item 3"
CAB = ["CODIGO_BAP", "ABA", "LINHA", "COLUNA", "ANTES", "DEPOIS", "ITEM", "FONTE", "ENTRA"]

# 1. SCE14002 (com o item 6: "Mbb" → "MB" e "Vwc" → "VW" na mesma célula)
SCE_HOJE = "Servo Embreagem Mbb LS 1630 1929 · 1932 · 1934 LS1941 Vwc 16210 17240 1730 · 111693"
SCE_DEPOIS = "Servo Embreagem MB LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS1941 VW 16210 17240 1730 · 111693"
# 2. CRU100
CRU_HOJE = "Hyundai HR 2.5 4x2 (04/2007–12/2017), Kia Motors Bongo 2500 (07/2017)"
CRU_DEPOIS = "Hyundai HR 2.5 4x2 (04/2007–12/2017), Kia Motors Bongo 2500 (07/2017>)"
CRU_DUVIDA = "ano solto '07/2017': pode ser 'a partir de' ou AA/AAAA (faixa)"
# 3. CIL8546
CIL_TEXTO = "Parati, Quantum, Santana, Saveiro / Royale, Versailles / Cordoba, Ibiza | 1983 a 2006"
CIL_MOTIVO = 'cita FORD, SEAT, VOLKSWAGEN sem dizer o modelo (ou só com número): "VW / FORD / SEAT"'
# 4. CV-F35
CVF_TRECHO = "Fiesta 1.6 16v / Sigma 05/2010–04/2013"
# 6. nomes: palavra inteira, caixa exata (não troca "MBB", "NEW BEETLE" nem dentro de outra palavra)
NOMES = [("Mbb", re.compile(r"(?<![A-Za-zÀ-ú0-9])Mbb(?![A-Za-zÀ-ú0-9])"), "MB"),
         ("Vwc", re.compile(r"(?<![A-Za-zÀ-ú0-9])Vwc(?![A-Za-zÀ-ú0-9])"), "VW"),
         ("NEW Beetle", re.compile(r"(?<![A-Za-zÀ-ú0-9])NEW Beetle(?![A-Za-zÀ-ú0-9])"), "New Beetle"),
         # as outras grafias, aprovadas no R-20261121-195140-alexandre ("3 a")
         ("MBB", re.compile(r"(?<![A-Za-zÀ-ú0-9])MBB(?![A-Za-zÀ-ú0-9])"), "MB"),
         ("Vw", re.compile(r"(?<![A-Za-zÀ-ú0-9])Vw(?![A-Za-zÀ-ú0-9])"), "VW"),
         ("NEW BEETLE", re.compile(r"(?<![A-Za-zÀ-ú0-9])NEW BEETLE(?![A-Za-zÀ-ú0-9])"), "New Beetle"),
         ("New beetle", re.compile(r"(?<![A-Za-zÀ-ú0-9])New beetle(?![A-Za-zÀ-ú0-9])"), "New Beetle"),
         ("New Beatle", re.compile(r"(?<![A-Za-zÀ-ú0-9])New Beatle(?![A-Za-zÀ-ú0-9])"), "New Beetle")]
ESPERADO_NOMES = {"Mbb": 9, "Vwc": 2, "NEW Beetle": 10,          # células da APLICACAO de hoje (v25) com cada grafia
                  "MBB": 5, "Vw": 3, "NEW BEETLE": 5, "New beetle": 1, "New Beatle": 1}
# variações que NÃO entram (vão para a aba FORA, para o Alexandre decidir se quer)
PARECIDOS = re.compile(r"(?i)(?<![A-Za-zÀ-ú0-9])(mbb|vwc|vw|new\s*be[ea]tle)(?![A-Za-zÀ-ú0-9])")

FONTE_SCE = ("Decidido pelo Alexandre (R-20261121-190649-alexandre, item 3: '1929 · 1932 · 1934' são modelos LS da "
             "Mercedes-Benz, não anos; R-20261121-195140-alexandre, '2 a': 'Mbb' vira 'MB'). 'MB' e 'VW' como a base mais escreve a montadora.")
FONTE_CRU = "Decidido pelo Alexandre (R-20261121-190649-alexandre, item 3: Kia Bongo a partir de 07/2017, '2017+')."
FONTE_VEI = ("Decidido pelo Alexandre (R-20261121-190649-alexandre, item 3: entram como normais, separado e sem "
             "MOTIVO e sem ANO_DUVIDA, com o ano do texto; só estes casos, sem reabrir a P12).")
FONTE_CVF = ("Decidido pelo Alexandre (R-20261121-190933-alexandre, '1 a': 2010–2013, como no texto "
             "'05/2010–04/2013').")
FONTE_NOM = ("Decidido pelo Alexandre (R-20261121-190649-alexandre, item 3: 'Mbb' e 'Vwc' com a escrita certa da "
             "montadora e 'New Beetle'; R-20261121-195140-alexandre: '2 a' MB, '3 a' as outras grafias também, '4 a' "
             "o resto do texto fica). Na APLICACAO, a base escreve 'MB' 347 vezes (Mercedes-Benz 32, "
             "MERCEDES-BENZ 255) e 'VW' 896 (Volkswagen 15, VOLKSWAGEN 506); o prefixo 'MARCA - ' usa 'MB' 223 e 'VW' "
             "609 vezes.")

# linhas novas da VEICULOS (no fim da aba), na ordem de CAB_VEICULOS
NOVAS = [["SCE14002", "MERCEDES-BENZ", "LS", "1929", None, None, "automático", "separado", None, None, None],
         ["SCE14002", "MERCEDES-BENZ", "LS", "1932", None, None, "automático", "separado", None, None, None],
         ["SCE14002", "MERCEDES-BENZ", "LS", "1934", None, None, "automático", "separado", None, None, None],
         ["CRU100", "HYUNDAI", "HR", None, 2007, 2017, "automático", "separado", None, "2.5", None]]
FONTE_NOVAS = {"SCE14002": FONTE_VEI + " Como as linhas LS 1630 e LS 1941 do mesmo código (MODELO 'LS', VERSAO = o "
                                       "número); o texto não tem ano: ANO_INICIO e ANO_FIM vazios.",
               "CRU100": FONTE_VEI + " Ano e cilindrada do texto 'Hyundai HR 2.5 4x2 (04/2007–12/2017)' (v23); "
                                     "como as outras linhas HYUNDAI HR da aba (CILINDRADA '2.5', VERSAO vazia)."}


def vz(v):
    return VAZIO if v in (None, "") else v


def antes_log(v) -> str:
    """O valor de antes no LOG: a marca da revisão da P12 não é escrita de novo (regra R-20261120-213300)."""
    return "(o da revisão da P12)" if "duvid" in str(v).lower() else f"'{v}'"


def contar_duvidoso(wb) -> dict:
    """Células com 'duvidoso' na PRODUTOS e na VEICULOS (a conta do PO: 5.122 na v25)."""
    out = {}
    for aba in ("PRODUTOS", "VEICULOS"):
        out[aba] = sum(isinstance(v, str) and "duvidoso" in v.lower()
                       for r in wb[aba].iter_rows(min_row=2, values_only=True) for v in r)
    return out


def gerar_site(base: Path, pasta: Path) -> dict:
    """Roda o scripts/gerar_site.py numa cópia (pasta/scripts e pasta/site, com a site/img só lida) e devolve o JSON."""
    (pasta / "scripts").mkdir(parents=True, exist_ok=True)
    (pasta / "site" / "data").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(RAIZ / "scripts" / "gerar_site.py", pasta / "scripts" / "gerar_site.py")
    if not (pasta / "site" / "img").exists():
        (pasta / "site" / "img").symlink_to(RAIZ / "site" / "img")
    r = subprocess.run([sys.executable, "-I", str(pasta / "scripts" / "gerar_site.py"), "--base", str(base)],
                       capture_output=True, text=True)
    saida = r.stdout + r.stderr
    if r.returncode or "[PARADO]" in saida:
        raise SystemExit(f"[PARADO] gerar_site na cópia: {saida}")
    j = json.loads((pasta / "site" / "data" / "produtos.json").read_text(encoding="utf-8"))
    return {"total": j["total"], "produtos": {p["c"]: p for p in j["produtos"]}, "log": saida.strip()}


def main(base, saida):
    base, saida = Path(base), Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    assert sha(base) == sha(versao(25)), "[PARADO] a base não é a v25: refaça a simulação a partir dela"
    wb = openpyxl.load_workbook(base)
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    cp = [limpo(c.value) for c in wp[1]]
    assert [limpo(c.value) for c in wv[1]] == CAB_VEICULOS
    ic, ia = cp.index("CODIGO_BAP") + 1, cp.index("APLICACAO") + 1
    iv = {k: i + 1 for i, k in enumerate(CAB_VEICULOS)}
    linha_de = {}
    for n in range(2, wp.max_row + 1):
        linha_de.setdefault(limpo(wp.cell(n, ic).value), []).append(n)
    duv_antes = contar_duvidoso(wb)
    n_prod, n_veic, ult_log = wp.max_row, wv.max_row, wb["LOG_CORRECOES"].max_row

    def uma(cod):
        (n,) = linha_de[cod]
        return n

    mud = []        # [CODIGO, ABA, LINHA, COLUNA, ANTES, DEPOIS, ITEM, FONTE, ENTRA]

    # --- PRODUTOS · APLICACAO: os casos de texto (1 e 2) e os nomes (6)
    apl = {}
    n = uma("SCE14002")
    assert wp.cell(n, ia).value == SCE_HOJE, wp.cell(n, ia).value
    apl["SCE14002"] = (n, SCE_HOJE, SCE_DEPOIS, "1 e 6", FONTE_SCE)
    n = uma("CRU100")
    assert wp.cell(n, ia).value == CRU_HOJE, wp.cell(n, ia).value
    apl["CRU100"] = (n, CRU_HOJE, CRU_DEPOIS, "2", FONTE_CRU)
    por_nome, parecidos = collections.Counter(), []
    for n in range(2, wp.max_row + 1):
        cod, t = limpo(wp.cell(n, ic).value), wp.cell(n, ia).value
        if not isinstance(t, str):
            continue
        achou = [nome for nome, rx, _ in NOMES if rx.search(t)]
        for nome in achou:
            por_nome[nome] += 1
        if achou and cod not in apl:
            novo = t
            for _, rx, troca in NOMES:
                novo = rx.sub(troca, novo)
            trocas = ", ".join(f"'{nome}' → '{troca}'" for nome, _, troca in NOMES if nome in achou)
            apl[cod] = (n, t, novo, "6", f"Troca: {trocas}. " + FONTE_NOM)
        for m in PARECIDOS.finditer(t):          # o que é parecido mas não entra
            if not any(rx.fullmatch(m.group(0)) for _, rx, _ in NOMES) and m.group(0) not in ("VW", "New Beetle"):
                parecidos.append([cod, "PRODUTOS", n, "APLICACAO", m.group(0),
                                  t[max(0, m.start() - 40):m.end() + 40]])
    assert dict(por_nome) == ESPERADO_NOMES, por_nome
    for cod, (n, antes, depois, item, fonte) in sorted(apl.items(), key=lambda x: x[1][0]):
        assert antes != depois and not any(rx.search(depois) for _, rx, _ in NOMES), cod
        mud.append([cod, "PRODUTOS", n, "APLICACAO", antes, depois, item, fonte, "sim"])

    # --- VEICULOS: células das linhas que já existem (2, 3 e 4)
    def linhas_veic(cod, fab, mod):
        return [r for r in range(2, wv.max_row + 1) if wv.cell(r, 1).value == cod
                and wv.cell(r, iv["FABRICANTE"]).value == fab and wv.cell(r, iv["MODELO"]).value == mod]

    def celula(r, col, antes, depois, item, fonte):
        assert wv.cell(r, iv[col]).value == antes, (r, col, wv.cell(r, iv[col]).value)
        mud.append([wv.cell(r, 1).value, "VEICULOS", r, col, vz(antes), vz(depois), item, fonte, "sim"])

    (r,) = linhas_veic("CRU100", "KIA", "Bongo")
    assert (wv.cell(r, iv["ANO_INICIO"]).value, wv.cell(r, iv["ANO_FIM"]).value) == (2017, None)
    celula(r, "ANO_DUVIDA", CRU_DUVIDA, None, "2", FONTE_CRU + " ANO_INICIO 2017 e ANO_FIM vazio já estão certos.")
    assert not linhas_veic("CRU100", "HYUNDAI", "HR")
    apl_cil = wp.cell(uma("CIL8546"), ia).value
    assert CIL_TEXTO in apl_cil, apl_cil
    for mod in ("Parati", "Santana"):
        (r,) = linhas_veic("CIL8546", "VOLKSWAGEN", mod)
        f = FONTE_VEI + f" Ano do texto: '{CIL_TEXTO}'. A linha já existe (na revisão da P12, fora do site): passa a normal, sem linha nova."
        celula(r, "ANO_INICIO", None, 1983, "3", f)
        celula(r, "ANO_FIM", None, 2006, "3", f)
        celula(r, "SITUACAO", "duvidoso", "separado", "3", f)
        celula(r, "MOTIVO", CIL_MOTIVO, None, "3", f)
        assert wv.cell(r, iv["ANO_DUVIDA"]).value is None
    ls_hoje = [wv.cell(r, iv["VERSAO"]).value for r in linhas_veic("SCE14002", "MERCEDES-BENZ", "LS")]
    assert ls_hoje == ["1630", "1941"], ls_hoje
    apl_cvf = wp.cell(uma("CV-F35"), ia).value
    assert CVF_TRECHO in apl_cvf, apl_cvf                       # o fim 04/2013 está no texto
    (r,) = linhas_veic("CV-F35", "FORD", "Fiesta")
    assert (wv.cell(r, iv["ANO_INICIO"]).value, wv.cell(r, iv["ANO_DUVIDA"]).value) == (2010, None)
    celula(r, "ANO_FIM", None, 2013, "4", FONTE_CVF + f" Trecho: '{CVF_TRECHO}'. A APLICACAO não muda.")

    # --- 5. MF22: a AUTOIMPACT MA21 fica (só conferir)
    ref_mf22 = wp.cell(uma("MF22"), cp.index("REFERENCIAS_CRUZADAS") + 1).value
    assert "AUTOIMPACT: MA21" in ref_mf22, ref_mf22

    # --- FORA: o que fica como está, e por quê
    fora = [
        ["SCE14002, SCE14008, SCE14000, SCE14007", "PRODUTOS · DESCRICAO", "'MBB' e 'VWC' ficam: a DESCRICAO é a 2ª das 5 "
         "colunas lidas pelo BAP Ajuda e pela BAP Central e vem do cadastro (ERP); o pedido é a escrita no catálogo."],
        ["vários", "PRODUTOS · DADOS_ADICIONAIS", "'MBB', 'New Beetle' etc. ficam: é a cópia da fonte (Farj, rolamentos), "
         "dado de origem."],
        ["CUB60039", "PRODUTOS · APLICACAO", "'VW BEATLE' fica: não estava na lista aprovada (R-20261121-195140-alexandre, "
         "'3 a')."],
        ["TER555249, BOL40041", "PRODUTOS · APLICACAO", "Só a palavra muda: fica 'MB - Accelo 1016C MB 816 …' e 'MB - MB/Diesel' "
         "(R-20261121-195140-alexandre, '4 a': o 'MB … MB' fica)."],
        ["SCE14002", "PRODUTOS · APLICACAO", "'LS1941' fica junto, como no exemplo do gerente e no texto de hoje; "
         "'16210 17240 1730' e '111693' (VW) ficam."],
        ["SCE14002", "VEICULOS", "Os VW do texto (16210, 17240, 1730) não entram: o pedido é só os LS."],
        ["CIL8546", "VEICULOS", "Quantum, Saveiro, Royale, Versailles, Cordoba e Ibiza ficam como estão (fora do filtro do "
         "site): o pedido é só Parati e Santana, sem reabrir a P12."],
        ["CRU100", "PRODUTOS · APLICACAO", "'Kia Motors' fica como está (não foi pedido); o mês '07/' fica, com '>' "
         "no fim, no formato da casa ('em diante' com '>')."],
        ["CRU100", "VEICULOS", "A HR entra com VERSAO vazia [SUPOSIÇÃO]: o '4x2' não tem lugar na VEICULOS (nenhuma linha "
         "da aba guarda tração na VERSAO)."],
        ["CV-F35", "PRODUTOS · APLICACAO", "O texto fica como está, com o 'Fiesta 1.6 16v Ti-Vct/ Sigma 04/2013' "
         "(leitura do PO). Só a VEICULOS ganha o fim 2013."],
        ["MF22", "PRODUTOS · REFERENCIAS_CRUZADAS", "A 'AUTOIMPACT: MA21' fica (decisão do Alexandre, item 7 'b')."],
        ["LOG_CORRECOES, INCLUIDOS_V7, ROLAMENTOS_INTEGRADOS, VELAS_INTEGRADAS, INTEGRADOS_V6, VEICULOS (MOTIVO)",
         "outras abas", "Histórico e citações literais do texto antigo: não mudam."],
        ["catalogo_grafico/gerador/digital_data.json", "fora da base", "O texto antigo do SCE14002 continua no arquivo "
         "fixo dos PDFs (dono: catalogo-grafico). Os PDFs leem '1929', '1932', '1934' e '1941' com o padrão "
         "(19|20)AA: aviso ao catalogo-grafico."],
    ]
    fora += [[c, f"{aba} · {col} (linha {n})", f"'{achado}' não entra (não está na lista aprovada): …{trecho}…"]
             for c, aba, n, col, achado, trecho in parecidos]

    # --- a base como ficaria (pasta temporária) e a conferência célula a célula com a v25
    for x in mud:
        if x[1] == "PRODUTOS":
            wp.cell(x[2], ia).value = x[5]
        else:
            wv.cell(x[2], iv[x[3]]).value = None if x[5] == VAZIO else x[5]
    acrescentar_linhas(wv, NOVAS)
    duv_depois = contar_duvidoso(wb)
    celulas = {"PRODUTOS": {(x[2], ia) for x in mud if x[1] == "PRODUTOS"},
               "VEICULOS": {(x[2], iv[x[3]]) for x in mud if x[1] == "VEICULOS"}}
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        sim = tmp / "BASE_v26_SIMULADA.xlsx"
        wb.save(sim)
        dif = comparar(sim, versao(25), celulas, ult_log, "v25", novas_no_fim={"VEICULOS": len(NOVAS)})
        assert not dif, dif
        antes, depois = gerar_site(base, tmp / "v25"), gerar_site(sim, tmp / "v26")
    assert set(antes["produtos"]) == set(depois["produtos"]), "[PARADO] produto entrou ou saiu do site"
    site = []
    for c in antes["produtos"]:
        a, d = antes["produtos"][c], depois["produtos"][c]
        for k in sorted(set(a) | set(d)):
            if a.get(k) != d.get(k):
                site.append([c, k, json.dumps(a.get(k), ensure_ascii=False), json.dumps(d.get(k), ensure_ascii=False)])

    # --- LOG_CORRECOES previsto: uma linha por célula e uma por linha nova da VEICULOS (o texto inteiro, com a fonte e
    # a aprovação, é o que o dados/scripts/base_v26.py escreve)
    log = [["CORRECAO_APLICACAO" if x[1] == "PRODUTOS" else "CORRECAO_VEICULO", x[1], x[0], None,
            f"{x[1]} linha {x[2]}, {x[3]}: {antes_log(x[4])} -> '{x[5]}' (item {x[6]})"] for x in mud]
    log += [["VEICULO_NOVO", "VEICULOS", nv[0], None,
             f"VEICULOS linha {n_veic + i}: {' | '.join(str(v) for v in nv[1:6] if v is not None)}, separado"]
            for i, nv in enumerate(NOVAS, 1)]

    num = {"base_sha256": sha(base), "pedido": PEDIDO,
           "produtos_linhas": n_prod - 1, "produtos_saem": 0,
           "celulas_produtos_aplicacao": len(celulas["PRODUTOS"]),
           "celulas_por_item": dict(collections.Counter(x[6] for x in mud)),
           "celulas_nomes_por_grafia": dict(por_nome),
           "celulas_veiculos": len(celulas["VEICULOS"]),
           "veiculos_linhas_antes": n_veic - 1, "veiculos_linhas_novas": len(NOVAS),
           "veiculos_linhas_depois": n_veic - 1 + len(NOVAS),
           "celulas_com_duvidoso_antes": duv_antes, "celulas_com_duvidoso_depois": duv_depois,
           "log_previsto": len(log), "codigos_mudados": len({x[0] for x in mud} | {x[0] for x in NOVAS}),
           "site_produtos_antes": antes["total"], "site_produtos_depois": depois["total"],
           "site_produtos_que_mudam": len({x[0] for x in site}), "site_chaves_que_mudam": len(site),
           "fora": len(fora), "parecidos_que_nao_entram": len(parecidos)}

    out = openpyxl.Workbook()
    le = out.active
    le.title = "LEIA"
    for t in ["T-0017 · v26 da base unificada: SIMULAÇÃO aprovada (R-20261121-195140-alexandre, '1 a 2 a 3 a 4 a', "
              "via po), gravada pelo dados/scripts/base_v26.py",
              f"Base de partida: v25 (sha256 {num['base_sha256'][:8]}…{num['base_sha256'][-4:]}). Pedido: {PEDIDO}; "
              "CV-F35 confirmado no R-20261121-190933-alexandre.",
              f"ANTES_DEPOIS: {len(mud)} células ({len(celulas['PRODUTOS'])} APLICACAO na PRODUTOS e "
              f"{len(celulas['VEICULOS'])} na VEICULOS), lida pelo dados/scripts/base_v26.py na gravação.",
              f"VEICULOS_NOVA: {len(NOVAS)} linhas no fim da aba (LS 1929, 1932 e 1934 do SCE14002; HR do CRU100).",
              "FORA: o que fica como está, e por quê. SITE: o que muda no produtos.json (gerar_site rodado numa cópia).",
              "Nenhuma marca nova de ano incerto; nenhum produto sai; mesmas abas e colunas.",
              f"LOG_CORRECOES previsto: {len(log)} linhas. O LEIA-ME da base ganha o bloco da v26 no topo."]:
        le.append([t])
    abas = {"ANTES_DEPOIS": (CAB, [[vz(v) if i in (4, 5) else v for i, v in enumerate(x)] for x in mud]),
            "VEICULOS_NOVA": (CAB_VEICULOS + ["FONTE"], [[vz(v) for v in nv] + [FONTE_NOVAS[nv[0]]] for nv in NOVAS]),
            "FORA": (["CODIGO_BAP", "ONDE", "POR QUE FICA"], fora),
            "SITE": (["CODIGO_BAP", "CHAVE", "ANTES (v25)", "DEPOIS (v26 simulada)"], site),
            "LOG_CORRECOES_PREVISTO": (CAB_LOG, log)}
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
                                                                              for x in col[:200]) + 2), 70)
        for row in s.iter_rows(min_row=2):
            for x in row:
                x.alignment = Alignment(vertical="top", wrap_text=True)
    out.save(saida / "SIMULACAO_v26_T-0017.xlsx")
    json.dump(num, open(saida / "numeros_v26.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(num, ensure_ascii=False, indent=1))
    print("gerar_site (v25):", antes["log"].replace("\n", " | "))
    print("gerar_site (v26):", depois["log"].replace("\n", " | "))
    for x in site:
        print(" SITE", x[0], x[1])


if __name__ == "__main__":
    main(*sys.argv[1:3])
