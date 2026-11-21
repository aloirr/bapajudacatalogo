"""T-0017 v24 (SIMULAÇÃO, nada é gravado na base): auditoria das referências cruzadas repetidas.

Pedido: R-20261121-102700-alexandre ("reveja tudo e valide os casos iguais"). Só lê a base. Monta
SIMULACAO_v24_T-0017.xlsx (LEIA, VALIDOS, FORA, GENERICAS, AMT7500_AMT7014) e numeros_v24.json.

Regra de prova: o veículo V entra no produto A quando outro produto B tem a MESMA referência (marca + código, que
não seja genérica), a mesma FAMILIA, peça, medida e POSICAO, LADO compatível, nada que os separe (outra referência
da mesma marca, ABS, Locker, cabine, c/ ou s/, DIFERENCIAL, ITEM_PARECIDO) e o trecho de V na APLICACAO de B se
isola sem ambiguidade, com ano que bate com a VEICULOS de B. O trecho entra em A COPIADO de B, literal; o ano nunca
vem da internet. Cada teste que falha é um motivo da aba FORA.

Uso: python3 -I simular_v24.py <base.xlsx> <pasta_saida>
"""
import collections
import itertools
import json
import re
import sys
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font

RAIZ = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(RAIZ / "dados" / "scripts"), str(RAIZ / "scripts")]
from base_comum import VAZIO, limpo, sha  # noqa: E402
from gerar_site import refs_de, sem_acento, so_codigo  # noqa: E402  (a mesma leitura das referências do site)

GENERICA_CODIGOS = 5        # [SUPOSIÇÃO] referência em 5 ou mais códigos BAP é "muitos códigos"
SEM_MARCA = re.compile(r"^([A-Za-zÀ-ú][A-Za-zÀ-ú&-]{1,20})\s+((?:[A-Za-z]{1,4}\s+)?\S*\d\S*)$")   # "Nakata HG 33010"
LADO_OS_DOIS = {"", "ESQUERDO E DIREITO"}        # [SUPOSIÇÃO] sem lado = os dois lados
MARCAS = {"ABS": r"[cs]/ abs", "Locker": r"locker",
          "cabine": r"cab(?:ine|\.)\s*(?:dupla|simples|estendida)", "c/ ou s/": r"\b[cs]/\s*[a-zà-ú][a-zà-ú.]*"}
# palavras da DESCRICAO que não mudam a peça: embalagem ("JOGO VELA" = "VELA UNIDADE"), ligação, posição e lado
NEUTRAS = {"JOGO", "PAR", "UNIDADE", "UND", "UN", "DE", "DA", "DO", "DAS", "DOS", "E", "DIANTEIRO", "DIANTEIRA",
           "TRASEIRO", "TRASEIRA", "DIR", "ESQ", "DIREITO", "DIREITA", "ESQUERDO", "ESQUERDA", "LD", "LE"}
MOTIVOS = ["referência genérica (suspeita)", "outra referência da mesma marca diverge (item diferente)",
           "família diferente", "produto ou peça diferente (PRODUTO/DESCRICAO)",
           "medida diferente (DESCRICAO/DETALHE_CATALOGO)", "montadoras sem nada em comum entre A e B (suspeita)",
           "posição diferente", "lado diferente", "muda ABS/s/ ABS", "muda Locker", "muda cabine",
           "muda c/ ou s/ (ex.: c/ parafuso, c/ pivô)", "diferença no DIFERENCIAL/ITEM_PARECIDO",
           "veículo já está na APLICACAO de A", "trecho de V em B não isolável", "V sem ano no trecho de B",
           "ano de V na VEICULOS de B não bate com o trecho de V em B",
           "as faixas do trecho de V em B têm intervalo (a VEICULOS juntaria)", "linha de V em B é duvidosa ou tem ANO_DUVIDA",
           "trechos diferentes entre os produtos B",
           "[SUPOSIÇÃO] V já está em A com outro trecho: somar trecho a veículo que já existe fica sem método",
           "só há anúncio da internet como prova"]
M = {m: i for i, m in enumerate(MOTIVOS)}
BLOCO_FAB = re.compile(r"^([A-ZÀ-Ú][A-ZÀ-Ú0-9/&. -]*?)\s+-\s+(.*)$")     # "VW - Polo ...", "VW/FORD/SEAT - Parati"
ANO = re.compile(r"(?<!\d)(?:19|20)\d\d(?!\d)")
ANUNCIO = ("COFAP", "GP30120", "Palio Weekend Adventure", "anúncios ligam a Cofap GP30120 ao 'Palio Weekend Adventure "
           "2000/2007'; nenhum produto BAP com essa referência tem o Palio")
FOCO = ("AMT7500", "AMT7014", "AMT7506", "AMT7510")


def norm(s):
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9]", " ", sem_acento(limpo(s)).upper())).strip()


def chaves(texto, codigo):
    """Referências (MARCA, CÓDIGO) sem espaço, hífen e ponto; o código precisa de um dígito."""
    out = set()
    for x in refs_de(limpo(texto), codigo):
        m, c = x["m"], x["c"]
        if not m:
            achou = SEM_MARCA.match(c.strip())
            if not achou:
                continue
            m, c = achou.groups()
        for cc in re.split(r"\s+/\s+|\s*,\s*", c):      # lista de códigos: " / " ou ","
            k = so_codigo(cc)
            # código com "/" (medida de pneu "HB37 110/70-17", "PD/62-NA", "ARL4152 /1") não vira referência
            if "/" not in cc and re.search(r"\d", k) and len(k) >= 3:
                out.add((so_codigo(m), k))
    return out


def padrao(t):
    """"com abs", "c/abs" e "c/ abs" são o mesmo; "sem abs", "s/abs" e "s/ abs" também (vale para todo c/ e s/)."""
    t = re.sub(r"\bsem\s+", "s/ ", re.sub(r"\bcom\s+", "c/ ", re.sub(r"\s+", " ", t)))
    return re.sub(r"\b([cs])/\s*", r"\1/ ", t)


def marcas(p):
    """ABS, Locker e cabine do texto do produto; o que vem depois de "exc."/"exceto" no trecho é exclusão."""
    t = padrao(" · ".join(limpo(p[k]) for k in ("DESCRICAO", "APLICACAO", "DIFERENCIAL", "DETALHE_CATALOGO")).lower())
    sai = {}
    for nome, rx in MARCAS.items():
        achados = set()
        for trecho in re.split(r"[·|;]", t):
            corte = re.search(r"\bexc(?:eto|\.)", trecho)
            for m in re.finditer(rx, trecho):
                exc = corte and m.start() > corte.start()
                achados.add(("exc. " if exc else "") + m.group(0))
        sai[nome] = tuple(sorted(achados))
    return sai


def peca(p):
    """O tipo da peça: PRODUTO e as palavras da DESCRICAO, sem as NEUTRAS e sem número (a medida é vista à parte)."""
    palavras = {w for w in norm(p["DESCRICAO"]).split() if w not in NEUTRAS and not re.search(r"\d", w)}
    return limpo(p["PRODUTO"]), palavras


def medidas(p):
    """As medidas do texto do produto (17 mm, 21", 21 polegadas), sem o espaço."""
    t = " ".join(limpo(p[k]) for k in ("DESCRICAO", "DETALHE_CATALOGO")).lower()
    return {re.sub(r"\s|,", ".", m.group(1)) + ("mm" if m.group(2) == "mm" else '"')
            for m in re.finditer(r"(\d+(?:[.,]\d+)?)\s*(mm|\"|pol(?:egadas?)?\b)", t)}


def diverge(ra, rb):
    """A e B citam a mesma marca com códigos que não se cruzam: são itens diferentes (ex.: NAKATA HG33004 x HG33093)."""
    ma, mb = collections.defaultdict(set), collections.defaultdict(set)
    for m, c in ra:
        ma[m].add(c)
    for m, c in rb:
        mb[m].add(c)
    return any(not ma[m] & mb[m] for m in set(ma) & set(mb))


def itens(texto):
    """(prefixo, item) da APLICACAO: blocos pelo ";" (com o "FAB - " do começo) e itens pelo "·" e pela ","."""
    for bloco in re.split(r"\s*;\s*|\n+", limpo(texto)):
        m = BLOCO_FAB.match(bloco)
        pref, corpo = (m.group(1), m.group(2)) if m else ("", bloco)
        for it in re.split(r"\s+·\s+|,\s+", corpo):
            if it.strip():
                yield pref, it.strip()


def trecho(texto, nomes, maiores):
    """Os itens de V, literais: começam pelo nome (ou apelido) de V e não por um modelo maior ("Polo Sedan" não é
    "Polo"). None quando V aparece fora do começo de um item (não isolável) ou em blocos de prefixo diferente."""
    comeca = lambda n, xs: any(n == x or n.startswith(x + " ") for x in xs)      # noqa: E731
    achados = [(p, it) for p, it in itens(texto) if comeca(norm(it), nomes) and not comeca(norm(it), maiores)]
    t = norm(texto)
    def pos(xs):
        return {m.start() for x in xs for m in re.finditer(rf"(?<![A-Z0-9]){re.escape(x)}(?![A-Z0-9])", t)}

    if not achados or len(pos(nomes) - pos(maiores)) != len(achados) or len({p for p, _ in achados}) > 1:
        return None
    return achados[0][0], [it for _, it in achados]


def faixa(its):
    """(início, fim, buraco) do trecho: o menor e o maior ano (fim None quando um item é "AAAA>" ou "em diante") e se
    as faixas deixam anos de fora no meio (2002–2006 e 2012–2014: a VEICULOS juntaria em 2002–2014)."""
    faixas = []
    for it in its:
        a = [int(x) for x in ANO.findall(it)]
        if not a:
            return None
        faixas.append((min(a), 9999 if re.search(rf"{max(a)}\s*>|em diante", it, re.I) else max(a)))
    faixas.sort()
    ini, fim, buraco = faixas[0][0], faixas[0][1], False
    for i, f in faixas[1:]:
        buraco |= i > fim + 1
        fim = max(fim, f)
    return ini, None if fim == 9999 else fim, buraco


def cilindradas(its):
    achadas = re.findall(r"(?<![\d.,])(\d[.,]\d)(?![\d.,])", " ".join(its))
    return " / ".join(sorted({x.replace(",", ".") for x in achadas}))


def anos(v):
    i, f = v["ANO_INICIO"], v["ANO_FIM"]
    return f"{i}>" if f in (None, "") else (f"{i}" if i == f else f"{i}–{f}")


def main(base, saida):
    saida = Path(saida)
    wb = openpyxl.load_workbook(base, read_only=True)
    wp, wv = wb["PRODUTOS"], wb["VEICULOS"]
    cp = [limpo(c.value) for c in next(wp.iter_rows(max_row=1))]
    cv = [limpo(c.value) for c in next(wv.iter_rows(max_row=1))]
    prod, linha = {}, {}
    for n, r in enumerate(wp.iter_rows(min_row=2, values_only=True), 2):
        if r[0]:
            prod[r[0]], linha[r[0]] = dict(zip(cp, r)), n
    veic = collections.defaultdict(lambda: collections.defaultdict(list))   # código -> (FAB, MODELO) -> linhas
    for r in wv.iter_rows(min_row=2, values_only=True):
        v = dict(zip(cv, r))
        veic[v["CODIGO_BAP"]][(limpo(v["FABRICANTE"]).upper(), norm(v["MODELO"]))].append(v)
    apelidos = {}                                   # (FAB, MODELO) -> nomes do modelo, como na MODELOS_VEICULO
    for r in wb["MODELOS_VEICULO"].iter_rows(min_row=2, values_only=True):
        apelidos[limpo(r[0]).upper(), norm(r[1])] = [norm(x) for x in [r[1], *limpo(r[2]).split(",")] if norm(x)]
    wb.close()

    # 1. índice das referências
    idx, refs_de_cod = collections.defaultdict(set), {}
    for c, p in prod.items():
        refs_de_cod[c] = chaves(p["REFERENCIAS_CRUZADAS"], c)
        for k in refs_de_cod[c]:
            idx[k].add(c)
    rep = {k: sorted(v) for k, v in idx.items() if len(v) >= 2}
    familias = {k: sorted({limpo(prod[c]["FAMILIA"]) for c in v}) for k, v in rep.items()}
    gen_familia = {k for k in rep if len(familias[k]) > 1}                  # [SUPOSIÇÃO] os dois limites
    gen_codigos = {k for k, v in rep.items() if len(v) >= GENERICA_CODIGOS}
    generica = gen_familia | gen_codigos
    comum = collections.defaultdict(set)                       # par (A, B) -> referências em comum
    for k, v in sorted(rep.items()):
        for a, b in itertools.combinations(v, 2):
            comum[a, b].add(k)

    isolados = {}

    def isolar(c, v):
        """O trecho de V na APLICACAO de c (prefixo, itens) ou None; os modelos maiores vêm da VEICULOS de c."""
        if (c, v) not in isolados:
            nomes = apelidos.get(v, [v[1]])
            outros = [n for w in veic[c] if w != v for n in apelidos.get(w, [w[1]])]
            maiores = [n for n in outros if any(n.startswith(x + " ") for x in nomes)]
            isolados[c, v] = trecho(prod[c]["APLICACAO"], nomes, maiores)
        return isolados[c, v]

    # 2. os casos: veículo novo (V em B e não em A, na VEICULOS) ou o mesmo veículo com outro trecho na APLICACAO
    candidatos, nao_comparaveis, casos = [], 0, set()
    for (x, y), refs in comum.items():
        for a, b in ((x, y), (y, x)):
            for v in sorted(set(veic[b]) - set(veic[a])):
                candidatos.append((a, b, v, refs, True))
                casos.add((x, y))
        for v in sorted(set(veic[x]) & set(veic[y])):
            tx, ty = isolar(x, v), isolar(y, v)
            if tx is None or ty is None:
                nao_comparaveis += 1                              # [SUPOSIÇÃO] sem trecho isolável, não se compara
            elif [norm(i) for i in tx[1]] != [norm(i) for i in ty[1]]:
                candidatos.append((x, y, v, refs, False))
                casos.add((x, y))
    mk = {c: marcas(prod[c]) for c in {x for par in casos for x in par} | set(FOCO)}

    def testar(a, b, v, refs, novo, gen):
        """O índice do primeiro motivo que falha (na ordem dos MOTIVOS), ou None quando passa em tudo."""
        pa, pb = prod[a], prod[b]
        if not refs - gen:
            return M["referência genérica (suspeita)"]
        fa, fb = {f for f, _ in veic[a]}, {f for f, _ in veic[b]}
        la, lb = limpo(pa["LADO"]), limpo(pb["LADO"])
        dif = {limpo(pa["DIFERENCIAL"]), limpo(pb["DIFERENCIAL"])} - {""}
        ma, mb = medidas(pa), medidas(pb)
        for i, falha in enumerate([
                diverge(refs_de_cod[a], refs_de_cod[b]), limpo(pa["FAMILIA"]) != limpo(pb["FAMILIA"]),
                peca(pa) != peca(pb), bool(ma and mb and ma != mb), bool(fa and fb and not fa & fb),
                limpo(pa["POSICAO"]) != limpo(pb["POSICAO"]), la != lb and not {la, lb} <= LADO_OS_DOIS,
                *(mk[a][n] != mk[b][n] for n in MARCAS),
                len(dif) > 1 or b in limpo(pa["ITEM_PARECIDO"]) or a in limpo(pb["ITEM_PARECIDO"])], 1):
            if falha:
                return i
        if not novo:
            return M[next(m for m in MOTIVOS if m.startswith("[SUPOSIÇÃO] V já está em A"))]
        ta = norm(pa["APLICACAO"])
        if any(re.search(rf"\b{re.escape(n)}\b", ta) or (len(so_codigo(n)) >= 5 and so_codigo(n) in so_codigo(ta))
               for n in apelidos.get(v, [v[1]])):
            return M["veículo já está na APLICACAO de A"]
        tb = isolar(b, v)
        if tb is None or len(veic[b][v]) != 1:          # [SUPOSIÇÃO] V com mais de uma linha (versões) em B
            return M["trecho de V em B não isolável"]
        f, r = faixa(tb[1]), veic[b][v][0]
        if f is None:
            return M["V sem ano no trecho de B"]
        if (r["ANO_INICIO"], r["ANO_FIM"] or None) != f[:2]:
            return M["ano de V na VEICULOS de B não bate com o trecho de V em B"]
        if f[2]:
            return M["as faixas do trecho de V em B têm intervalo (a VEICULOS juntaria)"]
        if limpo(r["SITUACAO"]) != "separado" or limpo(r["ANO_DUVIDA"]):
            return M["linha de V em B é duvidosa ou tem ANO_DUVIDA"]
        return None

    def copia(b, v):
        pref, its = isolar(b, v)
        return f"{pref or v[0]} - " + " · ".join(its)

    def avaliar(gen):
        prova = collections.defaultdict(list)                     # (A, V, novo) -> [(B, refs, resultado)]
        for a, b, v, refs, novo in candidatos:
            prova[a, v, novo].append((b, refs, testar(a, b, v, refs, novo, gen)))
        validos, fora = [], []
        for (a, v, novo), bs in sorted(prova.items()):
            ok = [x for x in bs if x[2] is None]
            if ok and len({copia(b, v) for b, _, _ in ok}) == 1:
                validos.append((a, v, ok))
            else:
                melhor = max(bs, key=lambda x: 99 if x[2] is None else x[2])
                fora.append((a, v, melhor, M["trechos diferentes entre os produtos B"] if ok else melhor[2], bs))
        return validos, fora

    validos, fora = avaliar(generica)
    sem_limite = {"sem nenhum limite": len(avaliar(set())[0]), "só o de famílias": len(avaliar(gen_familia)[0]),
                  "só o de 5 códigos": len(avaliar(gen_codigos)[0])}

    def ref_txt(refs):
        return ", ".join(f"{m}: {c}" for m, c in sorted(refs))

    no_site = {c for c, p in prod.items()
               if limpo(p["NO_CATALOGO_DIGITAL"]).upper() != "NÃO" and limpo(p["STATUS_CADASTRO"]).upper() != "INATIVO"}
    lin_val, lin_vei, texto = [], [], {}
    for a, v, ok in validos:                      # o texto vai somando: o DEPOIS da última linha de A é o final
        b, refs, _ = ok[0]
        pa, r, (_, its) = prod[a], veic[b][v][0], isolar(b, v)
        antes = texto.get(a, limpo(pa["APLICACAO"]))
        depois = texto[a] = (antes + " ; " if antes else "") + copia(b, v)
        nova = {**r, "CODIGO_BAP": a, "CILINDRADA": cilindradas(its) or None}     # bate com o trecho copiado
        obs = "" if limpo(nova["CILINDRADA"]) == limpo(r["CILINDRADA"]) else (
            f"CILINDRADA do trecho copiado; a VEICULOS de B diz '{limpo(r['CILINDRADA'])}'")
        lin_val.append([a, linha[a], v[0], limpo(r["MODELO"]), anos(r), copia(b, v), ref_txt(refs - generica), b,
                        ", ".join(x[0] for x in ok[1:]), limpo(pa["FAMILIA"]), limpo(pa["POSICAO"]) or VAZIO,
                        limpo(pa["LADO"]) or VAZIO, antes or VAZIO, depois,
                        " | ".join(limpo(nova[k]) or "-" for k in cv), obs, "sim" if a in no_site else "não"])
        lin_vei.append(nova)
    lin_fora = [[a, v[0], limpo(veic[m[0]][v][0]["MODELO"]), MOTIVOS[i], m[0], ref_txt(m[1]),
                 limpo(prod[a]["FAMILIA"]), limpo(prod[m[0]]["FAMILIA"]),
                 "; ".join(f"{b} ({'passa' if r is None else MOTIVOS[r]})" for b, _, r in bs if b != m[0])]
                for a, v, m, i, bs in fora]
    lin_gen = [[f"{m}: {c}", len(rep[m, c]), " · ".join(familias[m, c]), ", ".join(rep[m, c])]
               for m, c in sorted(generica)]

    # 3. AMT7500 e AMT7014: confere na base o que a conclusão diz
    par = ("AMT7500", "AMT7014")
    vizinhos = {x for c in par for k in refs_de_cod[c] for x in idx[k]} - set(par)
    assert set(veic["AMT7500"]) == set(veic["AMT7014"]) and par not in casos and par[::-1] not in casos
    assert diverge(refs_de_cod["AMT7500"], refs_de_cod["AMT7014"]) and mk["AMT7500"]["ABS"] != mk["AMT7014"]["ABS"]
    assert not any("PALIO" in m for c in set(par) | vizinhos for _, m in veic[c]), vizinhos
    assert all(mk[c]["Locker"] == ("locker",) and not refs_de_cod[c] & (refs_de_cod[par[0]] | refs_de_cod[par[1]])
               for c in ("AMT7506", "AMT7510"))
    lin_fora += [[c, "FIAT", ANUNCIO[2], MOTIVOS[-1], VAZIO, f"{ANUNCIO[0]}: {ANUNCIO[1]}", limpo(prod[c]["FAMILIA"]),
                  VAZIO, ANUNCIO[3]] for c in par]
    foco = []
    for c in FOCO:
        p = prod[c]
        refs = sorted(k for k, v in idx.items() if c in v)
        foco.append([c, limpo(p["APLICACAO"]), ref_txt(refs),
                     "; ".join(f"{m}: {cc} -> {', '.join(x for x in idx[m, cc] if x != c) or 'só este'}"
                               for m, cc in refs),
                     " / ".join(f"{f} {m}" for f, m in sorted(veic[c])), " ".join(sum(mk[c].values(), ())),
                     limpo(p["DIFERENCIAL"]) or VAZIO, limpo(p["ITEM_PARECIDO"]) or VAZIO])
    palio = [x for x in validos if x[0] in ("AMT7500", "AMT7014")]
    juntos = sorted(idx_k for idx_k, v in idx.items() if {"AMT7500", "AMT7014"} <= v)
    conclusao = [
        f"AMT7500 e AMT7014 dividem {ref_txt(juntos)} e têm os mesmos veículos na VEICULOS "
        f"({', '.join(m for _, m in sorted(veic['AMT7500']))}): não formam caso. Mesmo que formassem, ficariam fora: "
        "a Nakata diverge (" + " x ".join(c for p_ in par for m, c in sorted(refs_de_cod[p_]) if m == "NAKATA") +
        "), e o ABS os separa (DIFERENCIAL s/ ABS x c/ ABS e ITEM_PARECIDO um do outro).",
        "Nenhum produto BAP com referência do AMT7500 ou do AMT7014 tem o Palio. O AMT7506 e o AMT7510, que têm o "
        f"Palio Weekend Adventure Locker, usam outras referências ({ref_txt(refs_de_cod['AMT7506'])} e "
        f"{ref_txt(refs_de_cod['AMT7510'])}) e são Locker. Pela regra de prova, o Palio NÃO entra no AMT7500 nem no "
        "AMT7014.",
        "A ligação da Cofap GP30120 ao 'Palio Weekend Adventure 2000/2007' só existe em anúncio da internet: "
        "não vale como prova (fica fora: só anúncio).",
        f"Casos válidos para o AMT7500 ou o AMT7014 nesta auditoria: {len(palio)}."]

    por_motivo = collections.Counter(x[3] for x in lin_fora)
    num = {"base_sha256": sha(Path(base)), "referencias": len(idx), "referencias_repetidas": len(rep),
           "referencias_genericas": len(generica), "pares_com_a_mesma_referencia": len(comum),
           "casos": len(casos),
           "casos_so_pela_aplicacao": len({k for k in casos if set(veic[k[0]]) == set(veic[k[1]])}),
           "veiculos_comuns_nao_comparaveis_suposicao": nao_comparaveis,
           "veiculos_testados": len(validos) + len(fora),
           "veiculos_testados_por_trecho_diferente": len({(a, v) for a, _, v, _, novo in candidatos if not novo}),
           "validos": len(validos), "codigos_que_mudam": len({x[0] for x in validos}),
           "validos_se_o_limite_de_generica_mudar": sem_limite,
           "site": {"codigos": sorted({x[0] for x in validos} & no_site),
                    "veiculos": sum(x[0] in no_site for x in validos)},
           "linhas_novas_veiculos": len(lin_vei), "fora": len(lin_fora),
           "fora_por_motivo": {m: por_motivo[m] for m in MOTIVOS if por_motivo[m]},
           "log_previsto": len(validos) + len(lin_vei), "amt7500_amt7014_validos": len(palio)}

    out = openpyxl.Workbook()
    le = out.active
    le.title = "LEIA"
    for t in ["T-0017 · v24 da base unificada: SIMULAÇÃO (nada gravado)",
              f"Base de partida: v23 (sha256 {num['base_sha256'][:8]}…{num['base_sha256'][-4:]}). "
              "Pedido: R-20261121-102700-alexandre.",
              "Regra fixa (R-20261120-213300): nada novo marcado nem escrito como duvidoso. Nenhum produto sai.",
              f"{num['referencias_repetidas']} referências repetidas; {num['casos']} "
              f"casos (pares com veículos ou trechos diferentes); {num['veiculos_testados']} veículos testados: "
              f"{num['validos']} válidos e {num['fora']} fora (2 deles: o Palio do AMT7500 e do AMT7014, só anúncio).",
              "Cada linha da VALIDOS soma ao texto: o APLICACAO_DEPOIS da última linha de cada código é o texto final.",
              "O TRECHO_COPIADO_DE_B é o texto de V na APLICACAO de B, literal (só o 'FAB - ' do bloco vem junto).",
              *conclusao]:
        le.append([t])
    abas = {"VALIDOS": (["CODIGO_A", "LINHA_PRODUTOS", "FABRICANTE", "MODELO_V", "ANOS (de B)", "TRECHO_COPIADO_DE_B",
                         "REFERENCIA_PROVA", "CODIGO_B", "OUTROS_B", "FAMILIA", "POSICAO", "LADO", "APLICACAO_ANTES",
                         "APLICACAO_DEPOIS", "VEICULOS_LINHA_NOVA (" + " | ".join(cv) + ")", "OBS", "NO_SITE"],
                        lin_val),
            "FORA": (["CODIGO_A", "FABRICANTE", "MODELO_V", "MOTIVO", "CODIGO_B", "REFERENCIAS_EM_COMUM",
                      "FAMILIA_A", "FAMILIA_B", "OUTROS_B (motivo)"], lin_fora),
            "GENERICAS": (["REFERENCIA", "CODIGOS", "FAMILIAS", "CODIGOS_BAP"], lin_gen),
            "AMT7500_AMT7014": (["CODIGO", "APLICACAO", "REFERENCIAS", "QUEM_MAIS_TEM", "VEICULOS", "MARCAS",
                                 "DIFERENCIAL", "ITEM_PARECIDO"], foco + [[]] + [[t] for t in conclusao])}
    for nome, (cab, linhas) in abas.items():
        s = out.create_sheet(nome)
        s.append(cab)
        for x in linhas:
            s.append(x)
        for c in s[1]:
            c.font = Font(bold=True)
        s.freeze_panes = "A2"
        for col in s.columns:
            w = max(len(str(x.value or "")) for x in col[:200])
            s.column_dimensions[col[0].column_letter].width = min(max(10, w + 2), 60)
        for row in s.iter_rows(min_row=2):
            for x in row:
                x.alignment = Alignment(vertical="top", wrap_text=True)
    out.save(saida / "SIMULACAO_v24_T-0017.xlsx")
    json.dump(num, open(saida / "numeros_v24.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(num, ensure_ascii=False, indent=1))
    for x in lin_val[:10]:
        print(" VALIDO", x[0], "<-", x[5], "|", x[6], "| B =", x[7])
    for t in conclusao:
        print(" ", t)


if __name__ == "__main__":
    main(*sys.argv[1:3])
