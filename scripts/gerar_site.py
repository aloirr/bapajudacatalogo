"""Gera os dados do catálogo online BAP Ajuda (site/data/produtos.json) e as fotos (site/img).

Uso (na raiz do repositório bapajudacatalogo):
    py -3 scripts/gerar_site.py                      # só os dados (base unificada → JSON)
    py -3 scripts/gerar_site.py --fotos "<pasta>"    # dados + fotos reduzidas (Pillow)

- Fonte dos dados: dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx, aba PRODUTOS (a base unificada é a fonte única do
  catálogo; quem altera é o agente do catálogo).
- Entra no site: NO_CATALOGO_DIGITAL = SIM e STATUS_CADASTRO diferente de INATIVO.
- O site NÃO mostra preço nem estoque (regra do BAP Ajuda, 21/10/2026).
- Fotos: <CODIGO>.jpg/png da pasta de fotos, reduzidas para no máximo 700 px (JPEG 80). Foto já gerada e mais
  nova que a original não é refeita. Sem foto, o site mostra o logo e "Foto em breve".
- Veículo do filtro "Meu veículo" (campo "ve"): da aba VEICULOS, quando a base tem essa aba (desde a v17, T-0017). Só as
  linhas SITUACAO = separado; as duvidosas ficam fora até a revisão. Sem a aba, o JSON sai como antes.
- Trava: se o JSON sair com palavra de dado interno (estoque, FOB, USD, MOQ, preço, "R$", BAP BOX, custo de compra
  ou de importação, fornecedor, o nome de cada um dos FORNECEDORES e o da concorrência fora da marca da referência
  cruzada), o script PARA e não grava (ver TRAVA abaixo).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
SAIDA = RAIZ / "site" / "data" / "produtos.json"
IMG = RAIZ / "site" / "img"
LADO_MAX = 700

# hora de Manaus no "base atualizada em". Sem os dados de fuso (Windows sem o pacote tzdata): UTC-4 fixo,
# que é a hora de Manaus (sem horário de verão).
try:
    from zoneinfo import ZoneInfo
    FUSO = ZoneInfo("America/Manaus")
except Exception:
    FUSO = timezone(timedelta(hours=-4))

# chaves dos DADOS_ADICIONAIS que são de controle interno (não vão para o site)
INTERNAS = {"LINHA_ORIGEM", "FONTE", "QTD_APLICACOES", "ABA_ORIGEM", "ORIGEM", "OBS_INTERNA"}


def limpar(v) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    return "" if s.lower() in ("nan", "none", "-") else s


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


# Referência que é o próprio produto (T-0017, R-20261120-154100): as marcas da BAP ("BAP PN_2: BS14" no BS14) e todo
# código igual ao CODIGO_BAP (sem espaço e sem pontuação) não vão para o site. É um filtro a mais: não troca o corte do
# "| ANTERIOR" nem do "BAP BOX". [SUPOSIÇÃO] "BAPTA PN" pode ser código de fornecedor; sai do mesmo jeito.
MARCAS_PROPRIAS = {"BAP", "BAP PN_2", "BAPTA PN"}

# Fornecedor da BAP é dado interno (regra 1 do CLAUDE.md): a SUNRISE (P10 da v19, R-20261120-194900-po). A referência sai do
# site quando o nome está no rótulo da marca, inteiro ou dentro dele ("SUNRISE PN", "Pruduct Pn Sunrise"); na base o dado fica.
# A TRAVA usa o FORNECEDOR_RE, montado desta lista com até 3 sinais (espaço, hífen, ponto...) entre cada letra ("Sun-Rise",
# "SUN.RISE"): se o nome voltar por qualquer campo, o script para. Só em maiúsculas, sem espaço e sem pontuação.
FORNECEDORES = {"SUNRISE"}
FORNECEDOR_RE = "|".join(r"[\W_]{0,3}".join(map(re.escape, f)) for f in sorted(FORNECEDORES))

# Marca da concorrência que só aparece na referência cruzada (T-0017): a AUTOIMPACT (R-20261121-112900-alexandre, "Auto
# impact e ampri sao marcas da concorrencia. Eles devem aparecer apenas na referencia cruzada."; saiu do FORNECEDORES com o
# "autorizo" do R-20261121-113400-alexandre). A referência vai para o site; o nome só pode estar na marca da referência
# (r[].m inteiro, sem o " PN"). Em qualquer outro campo (descrição, aplicação, ficha, código da referência, veículos...) a
# TRAVA para o script: o CONCORRENTE_RE entra nela, e só o r[].m é mascarado (sem_marca_concorrente). A AMPRI não entra
# aqui: o nome dela nunca foi barrado.
CONCORRENTES_SO_NA_REF = {"AUTOIMPACT"}
CONCORRENTE_RE = "|".join(r"[\W_]{0,3}".join(map(re.escape, f)) for f in sorted(CONCORRENTES_SO_NA_REF))


def so_codigo(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", sem_acento(s).upper())


# o refs_de procura o fornecedor no rótulo passado pelo so_codigo ("f in rot"), e o sem_marca_concorrente compara o rótulo
# do mesmo jeito: as duas listas têm de estar nesse formato
assert all(f == so_codigo(f) for f in FORNECEDORES | CONCORRENTES_SO_NA_REF), \
    "FORNECEDORES e CONCORRENTES_SO_NA_REF em maiúsculas, sem espaço e sem pontuação"
assert not FORNECEDORES & CONCORRENTES_SO_NA_REF, "a mesma marca não pode ser fornecedor e concorrente"


# Rótulo da referência só com a marca (RD-0200): os prefixos e o " PN" do fim; a lista está no docs/DADOS_DO_SITE.md (campo r).
PREFIXO = (r"(?:(?:CROSS\s+)?REFER[ÊE]NC(?:IA|E)S?(?:\s+CRUZADAS?)?\s*-|REFER[ÊE]NC(?:IA|E)S?\s+CROSS\b"
           r"|REF\.?\s+CRUZADAS?\s*-)\s*")
PREFIXO_E_PN = re.compile(r"^" + PREFIXO + r"|\s+PN$", re.I)


def refs_de(texto: str, codigo: str = "") -> list[dict]:
    """'REFERENCIAS CRUZADAS - AMPRI: 24125, TRW: X' → [{'m': 'AMPRI', 'c': '24125'}, ...], sem as do próprio produto."""
    proprio = so_codigo(codigo)
    t = re.sub(r"^\s*REFER[ÊE]NCIAS?\s+CRUZADAS?\s*[-:]\s*", "", texto, flags=re.I)
    # tira o "| ANTERIOR: ..." (histórico interno) de cada trecho, antes de separar as referências: o histórico vai até
    # o próximo ";" (RD-0199; desde a v8 o que veio depois do histórico entrou com "; ") e tem vírgula dentro
    t = "; ".join(x.split(" | ")[0] for x in re.split(r"\s*;\s*", t))
    # quebra de linha = vírgula: separa os códigos da mesma marca ("REFERENCIAS CROSS FARJ: 0002540047 (MERCEDES
    # BENZ)\n970 051 431 0 (WABCO)"); o código com espaço ("970 051 431 0") fica inteiro
    t = re.sub(r"\s*[\r\n]+\s*", ", ", t)
    saida = []
    # a referência nova começa no ";" ou na "," antes de "MARCA:", com ou sem o prefixo ("REFERENCIAS CRUZADAS - INDISA PN:")
    for parte in re.split(r"\s*[;,]\s*(?=(?i:" + PREFIXO + r")?[A-ZÀ-Ú0-9 .&/\-]{2,30}:)|\s+/\s+(?=[A-ZÀ-Úa-z][\w .&-]{1,30}\s+\S)", t):
        parte = parte.strip(" ;,")
        if not parte:
            continue
        m = re.match(r"^([^:]{1,40}):\s*(.+)$", parte)
        if m:
            cod = re.sub(r"\s*BAP\s+BOX\b.*$", "", m.group(2), flags=re.I).strip()   # tira o preço de compra
            if cod and cod.upper() not in ("-", "0", "--", "N/A", "#N/A"):   # "#N/A": erro de fórmula da planilha (RD-0193)
                bruta = m.group(1).strip()
                marca = PREFIXO_E_PN.sub("", bruta).strip()
                # a marca própria é vista antes e depois da limpeza ("BAPTA PN" e "CROSS REFERENCIAS - BAP" saem); o
                # fornecedor sai se o nome estiver em qualquer ponto do rótulo ("SUNRISE PN", "Pruduct Pn Sunrise")
                rot = so_codigo(bruta)
                if (not {re.sub(r"\s+", " ", x.upper()) for x in (bruta, marca)} & MARCAS_PROPRIAS
                        and not any(f in rot for f in FORNECEDORES)):
                    # a concorrência sai sempre com o nome canônico ("Auto-Impact PN" → "AUTOIMPACT"): a mesma forma
                    # que o sem_marca_concorrente compara na TRAVA e que o teste confere
                    canon = so_codigo(marca)
                    saida.append({"m": canon if canon in CONCORRENTES_SO_NA_REF else marca, "c": cod})
        else:
            saida.append({"m": "", "c": parte})
    vistos, unicas = set(), []
    for x in saida:                       # a referência repetida na célula (mesma marca e mesmo código) aparece uma vez (RD-0201)
        k = (re.sub(r"\W", "", sem_acento(x["m"]).upper()), so_codigo(x["c"]))
        if k not in vistos and not (proprio and k[1] == proprio):
            vistos.add(k); unicas.append(x)
    # a referência da concorrência (CONCORRENTES_SO_NA_REF) vai por último, para a Bosch e a Tecfil ficarem à vista (T-0017,
    # "1 a"); o sort é estável: a ordem da célula fica entre elas e entre as outras. Os PDFs usam este refs_de (montar.py).
    unicas.sort(key=lambda x: so_codigo(x["m"]) in CONCORRENTES_SO_NA_REF)
    return unicas


# Ficha técnica do site: SÓ o que está nesta lista (os DADOS_ADICIONAIS também têm custo de importação, MOQ,
# ranking, fornecedor e estoque, que nunca vão para o site). Padrão (sem acento, maiúsculo, _ no lugar de espaço).
FICHA = [
    (r"^(CODIGO_?(DE_?)?BARRAS?|COD\.?_?BARRAS|EAN)(_?BAP)?$", "Código de barras"),
    (r"^MODELOS?$", "Modelos"),
    (r"^MOTORIZACAO$", "Motorização"),
    (r"^(POSICAO_?LADO|LADO_ESQUERDO_/_DIREITO)$", "Posição e lado"),
    (r"^TYPE.*GAS.*OIL", "Tipo (gás ou óleo)"),
    (r"^MECANISMO_DE_DIRECAO$", "Mecanismo de direção"),
    (r"^(TIPO|TECNOLOGIA|MATERIAL|COR|NATUREZA|VISCOSIDADE|ESPECIFICACAO|ESPECIFICACOES|ESPEC_TECNICA|MEDIDA|TAMANHO|ARO|TAMANHO_ARO|CAMARA|CAMARA_BAP|PNEUS_COMPATIVEIS|DETALHES|EMBALAGEM|AMPERAGEM|GARANTIA|TENSAO_NOMINAL|C20\(AH\)|RESERVA_DE_CAPACIDADE|CCA-18°|CA_\+25C|OFFSET|P\.C\.D\._MM|C\.B\.D\._MM)$", None),
    (r"^MEDIDA_(POLEGADA|EM_MM)$", None),
    (r"^QTD_POR_CAIXA|^QUA\._POR_EMBALAGEM|^MULTIPLO_POR_CAIXA", "Qtd. por caixa"),
    (r"^PESO_LIQ(UIDO)?(_KG)?$", "Peso líquido (kg)"),
    (r"^PESO_BRUTO(_KG)?$", "Peso bruto (kg)"),
    (r"^TAMANHO_BATERIA", "Dimensões"),
    (r"^(ALT|ALTURA)_CM$", "Altura (cm)"),
    (r"^(COMPR|COMPRIMENTO)_CM$", "Comprimento (cm)"),
    (r"^(LARG|LARGURA)_CM$", "Largura (cm)"),
    (r"^ESPESSURA_DO_DISCO", "Espessura do disco (mm)"),
    (r"^NUMERO_DE_FUROS", "Número de furos"),
    (r"^CAPACIDADE_DE_CARGA", "Capacidade de carga"),
]
_FICHA = [(re.compile(p), r) for p, r in FICHA]


def rotulo(k: str) -> str:
    k = re.sub(r"\s+", " ", k.replace("_", " ")).strip()
    return k[:1].upper() + k[1:].lower() if (k.isupper() or k.islower()) else k


def extras_de(texto: str) -> list[list[str]]:
    itens, vistos = [], set()
    for parte in texto.split("|"):
        if ":" not in parte:
            continue
        k, v = parte.split(":", 1)
        k, v = k.strip(), v.strip()
        if not v or v.lower().startswith("http") or v.lower() in ("nan", "none", "-", "0"):
            continue
        chave = re.sub(r"\s+", "_", sem_acento(k).upper())
        for rx, nome in _FICHA:
            if rx.search(chave):
                r = nome or rotulo(k)
                if r not in vistos:
                    vistos.add(r)
                    itens.append([r, v])
                break
    return itens


def anos_de(texto: str) -> tuple[int, int] | None:
    ini = re.search(r"ANO_INICIO:\s*(\d{4})", texto)
    fim = re.search(r"ANO_FIM:\s*(\d{4})", texto)
    if ini:
        return int(ini.group(1)), int(fim.group(1)) if fim else 2100
    return None


MONTADORAS = {"GM": "CHEVROLET", "GENERAL MOTORS": "CHEVROLET", "CHEVROLET/GM": "CHEVROLET", "GM/CHEVROLET": "CHEVROLET",
              "VW": "VOLKSWAGEN", "VOLKS": "VOLKSWAGEN", "MB": "MERCEDES-BENZ", "MERCEDES": "MERCEDES-BENZ",
              "MERCEDES BENZ": "MERCEDES-BENZ", "CITROEN": "CITROËN", "CHEVROLET / GM": "CHEVROLET", "GM / CHEVROLET": "CHEVROLET",
              "HYUNDAI / KIA": "HYUNDAI/KIA", "HYUNDAI/KIA MOTORS": "HYUNDAI/KIA", "KIA/HYUNDAI": "HYUNDAI/KIA"}


def montadora_de(extras: list[list[str]], aplicacao: str) -> str:
    nome = ""
    for k, v in extras:
        if sem_acento(k).upper() == "MONTADORA":
            nome = v.upper()
            break
    if not nome:
        m = re.match(r"^\s*([A-ZÀ-Ú][A-ZÀ-Ú /&-]{1,25}?)\s+-\s+", aplicacao)
        nome = m.group(1).strip() if m else ""
    nome = re.sub(r"\s+", " ", nome).strip(" /-")
    nome = re.sub(r"\s*/\s*", "/", nome)
    return MONTADORAS.get(nome, nome)


# Aba VEICULOS (desde a v17, T-0017): uma linha por produto x veículo. Vai para o site SÓ fabricante, modelo e versão das
# linhas SITUACAO = separado. ORIGEM, SITUACAO, MOTIVO e os anos (ANO_INICIO/ANO_FIM) não vão.
VE_SITUACAO = "separado"


def veiculos_de(wb) -> dict[str, list[list[str]]]:
    """{CODIGO: [[fabricante, modelo, versao?], ...]}, sem repetir e na ordem da aba. Sem a aba VEICULOS: {}."""
    if "VEICULOS" not in wb.sheetnames:
        return {}
    linhas = wb["VEICULOS"].iter_rows(values_only=True)
    cab = [limpar(c).upper() for c in next(linhas, ())]
    pos = {c: i for i, c in enumerate(cab)}
    falta = {"CODIGO_BAP", "FABRICANTE", "MODELO", "SITUACAO"} - pos.keys()
    if falta:
        sys.exit(f"[ERRO] aba VEICULOS sem a coluna {', '.join(sorted(falta))}")

    def g(r, c):
        i = pos.get(c)
        return limpar(r[i]) if i is not None and i < len(r) else ""

    saida: dict[str, list[list[str]]] = {}
    vistos: set[tuple[str, str, str, str]] = set()
    sem_modelo = 0
    for r in linhas:
        cod = g(r, "CODIGO_BAP").upper()
        if not cod or g(r, "SITUACAO").lower() != VE_SITUACAO:
            continue
        fab, mod, ver = g(r, "FABRICANTE"), g(r, "MODELO"), g(r, "VERSAO")
        if not fab or not mod:
            sem_modelo += 1                      # separado sem fabricante ou modelo não serve ao filtro
            continue
        chave = (cod, fab, mod, ver)
        if chave in vistos:
            continue
        vistos.add(chave)
        saida.setdefault(cod, []).append([fab, mod, ver] if ver else [fab, mod])
    if sem_modelo:
        print(f"  [AVISO] VEICULOS: {sem_modelo} linhas 'separado' sem fabricante ou modelo ficaram fora do 've'")
    return saida


def ler_base(caminho: Path) -> list[dict]:
    try:
        import openpyxl
    except ImportError:
        sys.exit("[ERRO] falta o openpyxl: py -3 -m pip install openpyxl pillow")
    wb = openpyxl.load_workbook(caminho, read_only=True, data_only=True)
    ws = wb["PRODUTOS"]
    linhas = ws.iter_rows(values_only=True)
    cab = [limpar(c).upper() for c in next(linhas)]
    pos = {c: i for i, c in enumerate(cab)}

    def g(r, c):
        i = pos.get(c)
        return limpar(r[i]) if i is not None and i < len(r) else ""

    produtos = []
    for r in linhas:
        cod = g(r, "CODIGO_BAP").upper()
        if not cod:
            continue
        if g(r, "NO_CATALOGO_DIGITAL").upper() == "NÃO" or g(r, "STATUS_CADASTRO").upper() == "INATIVO":
            continue
        apl = g(r, "APLICACAO")
        brutos = g(r, "DADOS_ADICIONAIS")
        extras = extras_de(brutos)
        # montadora: lida antes de tirar a chave dos extras
        mont = montadora_de([[k.strip(), v.strip()] for k, v in (p.split(":", 1) for p in brutos.split("|") if ":" in p)], apl)
        produtos.append({
            "c": cod,
            "d": g(r, "DESCRICAO"),
            "a": apl,
            "r": refs_de(g(r, "REFERENCIAS_CRUZADAS"), cod),
            "x": [e for e in extras if sem_acento(e[0]).upper() not in ("CATEGORIA", "MONTADORA")],
            "mo": mont,
            "an": list(anos_de(brutos)) if anos_de(brutos) else [],
            "p": g(r, "PRODUTO"),
            "ca": g(r, "CATEGORIA"),
            "si": g(r, "SISTEMA"),
            "fa": g(r, "FAMILIA"),
            "li": g(r, "LINHA"),
            "po": g(r, "POSICAO"),
            "la": g(r, "LADO"),
            "de": g(r, "DETALHE_CATALOGO"),
            "oj": g(r, "OFERECA_JUNTO"),
        })
    ve = veiculos_de(wb)
    for p in produtos:
        if p["c"] in ve:
            p["ve"] = ve[p["c"]]
    return produtos


# Arte "IMAGEM INDISPONÍVEL": o mesmo arquivo copiado com o código de muitos produtos (20/11/2026: 1.007 das 2.420
# fotos, o mesmo arquivo do FLU15002). Arquivo idêntico em LIMITE_REPETIDA produtos ou mais = arte, não foto
# [SUPOSIÇÃO: foto de verdade igual para tantos códigos não existe]. Esses produtos ficam com "Foto em breve".
LIMITE_REPETIDA = 10


def _hash(f: Path) -> str:
    import hashlib
    h = hashlib.md5()
    with f.open("rb") as arq:
        for bloco in iter(lambda: arq.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def repetidas(por_codigo: dict[str, Path]) -> set[str]:
    """Códigos cuja foto é um arquivo idêntico ao de LIMITE_REPETIDA produtos ou mais."""
    from collections import defaultdict
    grupos: dict[str, list[str]] = defaultdict(list)
    for cod, f in por_codigo.items():
        try:
            grupos[_hash(f)].append(cod)
        except OSError:
            pass
    return {c for cods in grupos.values() if len(cods) >= LIMITE_REPETIDA for c in cods}


def fotos(produtos: list[dict], pasta: Path) -> int:
    try:
        from PIL import Image
    except ImportError:
        sys.exit("[ERRO] falta o Pillow: py -3 -m pip install pillow openpyxl")
    IMG.mkdir(parents=True, exist_ok=True)
    origem = {}
    for f in pasta.iterdir():
        if f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp") and f.is_file():
            origem.setdefault(f.stem.upper().replace(" ", ""), f)
    por_codigo = {p["c"]: origem[p["c"].replace(" ", "")] for p in produtos if p["c"].replace(" ", "") in origem}
    arte = repetidas(por_codigo)
    if arte:
        print(f"  fotos: {len(arte)} produtos com a arte 'imagem indisponível' (ficam com 'Foto em breve')")
    feitas = 0
    for i, p in enumerate(produtos, 1):
        f = por_codigo.get(p["c"])
        nome = re.sub(r"[^A-Z0-9._-]", "_", p["c"]) + ".jpg"
        alvo = IMG / nome
        if not f or p["c"] in arte:
            if p["c"] in arte and alvo.exists():
                alvo.unlink()                     # foto reduzida antiga da arte sai do site
            continue
        if not alvo.exists() or alvo.stat().st_mtime < f.stat().st_mtime:
            with Image.open(f) as im:
                im = im.convert("RGBA") if im.mode in ("P", "LA") else im
                if im.mode == "RGBA":
                    fundo = Image.new("RGB", im.size, (255, 255, 255))
                    fundo.paste(im, mask=im.split()[-1])
                    im = fundo
                else:
                    im = im.convert("RGB")
                im.thumbnail((LADO_MAX, LADO_MAX))
                im.save(alvo, "JPEG", quality=80, optimize=True, progressive=True)
            feitas += 1
        p["i"] = nome
        if i % 500 == 0:
            print(f"  fotos: {i} de {len(produtos)}")
    return feitas


# TRAVA: dado interno nunca vai para o site público (os fornecedores entram pelo FORNECEDOR_RE; o concorrente, pelo
# CONCORRENTE_RE, com só a marca da referência fora da busca: ver sem_marca_concorrente)
TRAVA = re.compile(r"ESTOQUE|\bFOB\b|\bUSD\b|\bMOQ\b|PRE[CÇ]O|BAP\s+BOX|CUSTO\s+(DE\s+)?(COMPRA|IMPORT)|FORNECEDOR|R\$|"
                   + FORNECEDOR_RE + "|" + CONCORRENTE_RE, re.I)


def sem_marca_concorrente(p: dict) -> dict:
    """Cópia do produto para a TRAVA: a marca da referência que É o concorrente (r[].m inteiro) vira "*"; o resto fica."""
    if not p.get("r"):
        return p
    q = dict(p)
    q["r"] = [dict(x, m="*") if so_codigo(x.get("m", "")) in CONCORRENTES_SO_NA_REF else x for x in p["r"]]
    return q


def conferir(produtos: list[dict]) -> list[str]:
    """Varre cada produto inteiro (todos os campos, o "ve" também; do "r", só a marca do concorrente fica de fora)."""
    achados = []
    for p in produtos:
        m = TRAVA.search(json.dumps(sem_marca_concorrente(p), ensure_ascii=False))
        if m:
            achados.append(f"{p['c']}: '{m.group(0)}'")
    return achados


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=str(BASE))
    ap.add_argument("--fotos", default="")
    a = ap.parse_args()
    produtos = ler_base(Path(a.base))
    print(f"  {len(produtos)} produtos no catálogo")
    if a.fotos:
        n = fotos(produtos, Path(a.fotos))
        com = sum(1 for p in produtos if p.get("i"))
        print(f"  fotos: {com} produtos com foto ({n} reduzidas agora)")
    elif IMG.is_dir():
        tem = {f.name for f in IMG.glob("*.jpg")}
        por_codigo = {}
        for p in produtos:
            nome = re.sub(r"[^A-Z0-9._-]", "_", p["c"]) + ".jpg"
            if nome in tem:
                por_codigo[p["c"]] = IMG / nome
        arte = repetidas(por_codigo)
        for p in produtos:
            if p["c"] in por_codigo and p["c"] not in arte:
                p["i"] = por_codigo[p["c"]].name
        if arte:
            print(f"  fotos: {len(arte)} com a arte 'imagem indisponível' fora do site (rode com --fotos para apagar)")
    for p in produtos:                       # tira os campos vazios (JSON menor)
        for k in [k for k, v in p.items() if v in ("", [], None)]:
            del p[k]
    achados = conferir(produtos)
    if achados:
        print("[PARADO] o JSON sairia com dado interno (nada foi gravado):")
        for a_ in achados[:20]:
            print("   ", a_)
        sys.exit(2)
    com_ve = sum(1 for p in produtos if "ve" in p)
    if com_ve:
        print(f"  veículos: {com_ve} produtos com 've' ({sum(len(p['ve']) for p in produtos if 've' in p)} veículos)")
    dados = {"gerado_em": datetime.now(FUSO).strftime("%d/%m/%Y %H:%M"), "fonte": Path(a.base).name,
             "total": len(produtos), "produtos": produtos}
    texto = json.dumps(dados, ensure_ascii=False, separators=(",", ":"))
    # segunda volta: o arquivo inteiro, como vai ser gravado (só a marca do concorrente na referência mascarada)
    m = TRAVA.search(json.dumps(dict(dados, produtos=[sem_marca_concorrente(p) for p in produtos]),
                                ensure_ascii=False, separators=(",", ":")))
    if m:
        print(f"[PARADO] o JSON sairia com dado interno (nada foi gravado): '{m.group(0)}'")
        sys.exit(2)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(texto, encoding="utf-8")
    print(f"  {SAIDA.relative_to(RAIZ)}: {SAIDA.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
