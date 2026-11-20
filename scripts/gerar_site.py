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
- Trava: se o JSON sair com palavra de dado interno (estoque, FOB, USD, MOQ, preço, custo de compra), o script
  PARA e não grava (ver TRAVA abaixo).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
SAIDA = RAIZ / "site" / "data" / "produtos.json"
IMG = RAIZ / "site" / "img"
LADO_MAX = 700

# chaves dos DADOS_ADICIONAIS que são de controle interno (não vão para o site)
INTERNAS = {"LINHA_ORIGEM", "FONTE", "QTD_APLICACOES", "ABA_ORIGEM", "ORIGEM", "OBS_INTERNA"}


def limpar(v) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    return "" if s.lower() in ("nan", "none", "-") else s


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def refs_de(texto: str) -> list[dict]:
    """'REFERENCIAS CRUZADAS - AMPRI: 24125, TRW: X' → [{'m': 'AMPRI', 'c': '24125'}, ...]."""
    t = re.sub(r"^\s*REFER[ÊE]NCIAS?\s+CRUZADAS?\s*[-:]\s*", "", texto, flags=re.I)
    saida = []
    for parte in re.split(r"\s*[;,]\s*(?=[A-ZÀ-Ú0-9 .&/\-]{2,30}:)|\s+/\s+(?=[A-ZÀ-Úa-z][\w .&-]{1,30}\s+\S)", t):
        parte = parte.strip(" ;,")
        if not parte:
            continue
        m = re.match(r"^([^:]{1,40}):\s*(.+)$", parte)
        if m:
            cod = m.group(2).split(" | ")[0]                       # tira o "| ANTERIOR: ..." (histórico interno)
            cod = re.sub(r"\s*BAP\s+BOX\b.*$", "", cod, flags=re.I).strip()   # e o preço de compra
            if cod and cod not in ("-", "0", "--", "N/A"):
                saida.append({"m": m.group(1).strip(), "c": cod})
        else:
            saida.append({"m": "", "c": parte})
    return saida


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
            "r": refs_de(g(r, "REFERENCIAS_CRUZADAS")),
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
            "df": g(r, "DIFERENCIAL"),
            "ip": g(r, "ITEM_PARECIDO"),
            "oj": g(r, "OFERECA_JUNTO"),
        })
    return produtos


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
    feitas = 0
    for i, p in enumerate(produtos, 1):
        f = origem.get(p["c"].replace(" ", ""))
        if not f:
            continue
        nome = re.sub(r"[^A-Z0-9._-]", "_", p["c"]) + ".jpg"
        alvo = IMG / nome
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


# TRAVA: dado interno nunca vai para o site público
TRAVA = re.compile(r"ESTOQUE|\bFOB\b|\bUSD\b|\bMOQ\b|PRE[CÇ]O|BAP\s+BOX|CUSTO\s+(DE\s+)?(COMPRA|IMPORT)", re.I)


def conferir(produtos: list[dict]) -> list[str]:
    achados = []
    for p in produtos:
        m = TRAVA.search(json.dumps(p, ensure_ascii=False))
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
        for p in produtos:
            nome = re.sub(r"[^A-Z0-9._-]", "_", p["c"]) + ".jpg"
            if nome in tem:
                p["i"] = nome
    for p in produtos:                       # tira os campos vazios (JSON menor)
        for k in [k for k, v in p.items() if v in ("", [], None)]:
            del p[k]
    achados = conferir(produtos)
    if achados:
        print("[PARADO] o JSON sairia com dado interno (nada foi gravado):")
        for a_ in achados[:20]:
            print("   ", a_)
        sys.exit(2)
    dados = {"gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M"), "fonte": Path(a.base).name,
             "total": len(produtos), "produtos": produtos}
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  {SAIDA.relative_to(RAIZ)}: {SAIDA.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
