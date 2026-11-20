"""v17 da base unificada · T-0017 (filtro por veículo: FABRICANTE, MODELO e VERSAO).

Pedido do Alexandre (R-20261120-121242-alexandre): "Incluir o filtro veiculo, com base no catalogo. criar a coluna
veiculo no catalogo para ficar mais facil de filtrar: FABRICANTE (MARCA), MODELO e VERSAO (SE TIVER)."
Decisões (R-20261120-122800-alexandre, 12:27): forma C (aba VEICULOS + aba MODELOS_VEICULO; a aba PRODUTOS não
muda); carroceria (Hatch, Sedan, Pick-Up, SW) é VERSAO; número de
caminhão (Cargo 1722) é VERSAO; ano fica para a etapa 2 (ANO_INICIO e ANO_FIM vazios); o PO avisa a BAP Central.
R-20261120-122930-alexandre ("2) colocar do jeito que ta. vamos revisar depois"): os duvidosos entram na VEICULOS
como estão, com SITUACAO=duvidoso e o motivo na coluna MOTIVO; ficam fora do filtro "Meu veículo" do site até a
revisão (o gerar_site.py só leva ao campo "ve" as linhas SITUACAO=separado).

Modos:
  python3 dados/scripts/base_v17.py --simular
      NÃO grava a base. Lê a APLICACAO dos produtos do catálogo digital (mesmo filtro do scripts/gerar_site.py),
      separa os veículos e grava dados/simulacoes/T-0017/SIMULACAO_T-0017.xlsx (abas VEICULOS, MODELOS_VEICULO,
      DUVIDOSOS (só lista de revisão, uma linha por produto; não vai para a base), RESUMO e
      LOG_CORRECOES_PREVISTO). Depois monta a v17 num diretório temporário e confere, célula a
      célula (valor e formatação), que todas as abas que já existem ficariam iguais às da v16, fora as linhas novas
      do LOG_CORRECOES e do LEIA-ME.
  python3 dados/scripts/base_v17.py
      Grava a v17 (só depois do "aprovado"): copia para a base as abas VEICULOS e MODELOS_VEICULO da simulação
      aprovada, exatamente como estão nela, acrescenta as linhas do LOG_CORRECOES_PREVISTO no fim do LOG_CORRECOES
      e o título da v17 no topo do LEIA-ME, faz a mesma conferência e grava a base e
      dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v17.xlsx. Se algo não bater, para sem gravar.

Nunca grava preço, custo, estoque, fornecedor nem DADOS_ADICIONAIS: as saídas têm só código, aplicação e veículo,
e passam pela TRAVA do gerar_site.py.
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
from openpyxl.styles import Font, PatternFill

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "scripts"))
import gerar_site as gs  # noqa: E402  (mesmo filtro do site, mesma tabela MONTADORAS e a TRAVA)

BASE = RAIZ / "dados" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx"
V16 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v16.xlsx"
V17 = RAIZ / "dados" / "versoes" / "BASE_BAP_UNIFICADA_PRODUTOS_BAP_v17.xlsx"
PASTA_SIM = RAIZ / "dados" / "simulacoes" / "T-0017"
SIM = PASTA_SIM / "SIMULACAO_T-0017.xlsx"
DATA = "20/11/2026"  # [SUPOSIÇÃO] data do aprovado; troque aqui se o aprovado vier em outro dia e rode --simular de novo

CAB_VEICULOS = ["CODIGO_BAP", "FABRICANTE", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "ORIGEM", "SITUACAO",
                "MOTIVO"]
CAB_MODELOS = ["FABRICANTE", "MODELO", "APELIDOS", "LINHA", "PRECISA_MARCA"]
CAB_LOG = ["TIPO", "ABA", "CODIGO_ANTES_OU_NOVO", "CODIGO_REFERENCIA", "OBSERVACAO"]
ABAS_NOVAS = ["VEICULOS", "MODELOS_VEICULO"]

# ------------------------------------------------------------------ dicionário (vira a aba MODELOS_VEICULO)
# "FABRICANTE | LINHA: modelo, modelo*, ..."   * = PRECISA_MARCA (nome curto ou numérico: só vale com a marca no
# mesmo trecho ou na montadora do produto). "+n" = série de caminhão: a letra é o MODELO e o número a VERSAO.
# LINHA do modelo: LEVE (carro, picape, van), PESADA (caminhão, ônibus), MOTO [SUPOSIÇÃO: vans e F-4000 como estão].
MODELOS_TXT = """
FIAT | LEVE: Uno, Mille, Palio Weekend, Palio, Grand Siena, Siena, Strada, Fiorino, Doblo, Idea, Punto, Linea, Stilo, Bravo, Brava, Marea Weekend, Marea, Tempra, Tipo*, Elba, Premio, Oggi, 147*, Panorama, Duna, Mobi, Argo, Cronos, Toro, Pulse, Fastback, Ducato, 500*, 500L*, 500X*, Freemont, Weekend, Titano, Spazio, Coupe*
CHEVROLET | LEVE: Corsa Classic, Corsa, Celta, Prisma, Classic, Onix Plus, Onix, Cobalt, Spin, Montana, Meriva, Zafira, Agile, Sonic, Cruze, Tracker, Equinox, Captiva, S10, Blazer, Trailblazer, Silverado, D20, D10, D40, C10, C20, A10, A20, Veraneio, Bonanza, Ipanema, Kadett, Marajo, Chevy 500, Chevette, Caravan, Tigra, Calibra, Suprema, Astra, Vectra, Omega, Monza, Opala, Camaro, Malibu, Joy*, Chevy*
FORD | LEVE: Ka, Fiesta, Escort, Focus, Fusion, EcoSport, Ranger, Courier, Belina, Corcel, Del Rey, Pampa, Verona, Versailles, Royale, Mondeo, Edge, Explorer, F-100, F-1000, F-250, F-350, Transit, Maverick, Territory, Bronco, Galaxie, Landau, Ka+
FORD | PESADA: F-4000, F-600, F-11000, F-12000, F-14000, F-22000, Cargo, C-1215
VOLKSWAGEN | LEVE: Gol, Parati, Saveiro, Voyage, CrossFox, SpaceFox, Space Cross, Fox, Polo Sedan, Polo, Golf, Jetta, Bora, Passat, Santana, Quantum, Fusca, Brasilia, Variant, TL*, Kombi, Up*, Virtus, Nivus, T-Cross, Tiguan, Amarok, Logus, Pointer, Apollo, Beetle, New Beetle, Taos, Touareg, Saveiro Cross, Gol Cross, Golf Variant, Jetta Variant, Polo Track, Kombi Carat
VOLKSWAGEN | PESADA: Titan*, Constellation, Worker, Delivery, Titan Tractor
AUDI | LEVE: A1, A3, A4, A5, A6, A7, A8, Q3, Q5, Q7, Q8, TT, S3, S4, RS3, RS4, RS6
RENAULT | LEVE: Clio, Sandero, Logan, Duster Oroch, Oroch, Duster, Kwid, Captur, Megane, Scenic, Grand Scenic, Fluence, Kangoo, Master, Symbol, Twingo, Laguna, Trafic, Kardian, Stepway, R19*, 19*, 21*, 12*, R12*
PEUGEOT | LEVE: 106*, 205*, 206*, 207*, 208*, 2008*, 306*, 307*, 308*, 3008*, 405*, 406*, 408*, 504*, 505*, 5008*, Partner, Boxer, Hoggar, Expert
CITROËN | LEVE: C3 Aircross, C3 Picasso, C3, C4 Picasso, C4 Grand Picasso, C4 Lounge, C4 Cactus, C4 Pallas, C4, C5, Xsara Picasso, Xsara, Xantia, ZX, Berlingo, Jumper, Jumpy, Aircross, DS3, DS4, DS5, Evasion, C-Elysee
TOYOTA | LEVE: Corolla Cross, Corolla, Fielder, Etios, Yaris, Hilux, SW4, Camry, RAV4, Bandeirante, Land Cruiser, Prius, Prado
HONDA | LEVE: Civic, Fit, City, HR-V, WR-V, CR-V, Accord, Odyssey
HONDA | MOTO: CG Titan*, CG Fan*, NXR Bros*, CG*, Titan*, Fan*, Biz*, Bros*, XRE*, CB 300*, CB 500*, CBX*, Twister*, Hornet*, NXR*, Pop*, Start*, XR*, Falcon*, Lead*, PCX*, Elite*, NX*
YAMAHA | MOTO: Fazer*, Factor*, YBR*, XTZ*, Lander*, Crosser*, Neo*, Crypton*, MT-03*, R3*, XJ6*, DT*, RD*, TDM*, Tenere*
SUZUKI | LEVE: Grand Vitara, Vitara, Jimny, Swift, SX4, Samurai
SUZUKI | MOTO: Yes*, Intruder*
HYUNDAI | LEVE: HB20S, HB20X, HB20, i30, ix35, Tucson, Creta, Santa Fe, Azera, Elantra, Sonata, Veloster, Vera Cruz, HR*, H100, H-1, Accent, Atos, Galloper, Terracan, Genesis
KIA | LEVE: Sportage, Sorento, Cerato, Picanto, Soul, Carnival, Bongo, Besta, Optima, Mohave, Cadenza, Rio*, Stonic, Magentis, Opirus, Sephia
NISSAN | LEVE: Frontier, Navara, March, Versa, Sentra, Tiida, Livina, Grand Livina, Kicks, X-Trail, Pathfinder, X-Terra, Murano, Altima, Primera
MITSUBISHI | LEVE: L200, Triton, Pajero, TR4, Lancer, Outlander, ASX, Airtrek, Eclipse Cross, L300, Galant, Space Wagon, Eclipse
JEEP | LEVE: Renegade, Compass, Commander, Grand Cherokee, Cherokee, Wrangler, Willys
DODGE | LEVE: Ram*, Journey, Dakota, Durango, Dart
CHRYSLER | LEVE: PT Cruiser, Town & Country, 300C, Neon
LAND ROVER | LEVE: Freelander, Discovery, Defender, Range Rover Evoque, Range Rover Sport, Range Rover, Evoque
VOLVO | LEVE: XC40, XC60, XC90, S40, S60, S80, V40, V60, C30
VOLVO | PESADA: FH12, FH16, FH, FM12, FM, FMX, NH12, NL10, NL12, N10, N12, VM, B58, B10M, B12, EDC*
BMW | LEVE: X1, X3, X5, X6, 118i, 120i, 320i, 328i, 325i, 330i, 528i, 530i, Serie 1, Serie 3, Serie 5, Z4
MERCEDES-BENZ | LEVE: Sprinter, Vito, Classe A, Classe B, Classe C, Classe E, A-Class, C-Class, E-Class, ML, GLA
MERCEDES-BENZ | PESADA: Atego, Axor, Accelo, Actros, Atron, O400, O500, OF+n, OH+n, LO+n, LPK+n, L+n, LS+n, LK+n
IVECO | LEVE: Daily
IVECO | PESADA: Stralis, Tector, Eurocargo, Eurotech, Vertis, Hi-Way
SCANIA | PESADA: 111*, 112*, 113*, 124*, 142*, 143*, TL+n, R+n, P+n, G+n, T+n, K+n, S+n, F+n, L+n
AGRALE | LEVE: Marrua
AGRALE | PESADA: 1600*, 1800*, 6000*, 8500*, 9200*, 10000*
TROLLER | LEVE: T4
CHERY | LEVE: Tiggo, QQ, Celer, Face, Arrizo
JAC | LEVE: J2, J3, J5, J6, T40, T50, T5
MINI | LEVE: Cooper
PORSCHE | LEVE: Cayenne, Macan, Panamera, Boxster, 911*
SUBARU | LEVE: Forester, Impreza, Outback, Legacy, XV
SEAT | LEVE: Ibiza, Cordoba, Leon, Toledo, Inca
DAEWOO | LEVE: Espero, Lanos, Nubira, Leganza
ALFA ROMEO | LEVE: 145*, 146*, 155*, 156*, 164*, 166*
JAGUAR | LEVE: XF, XE, XJ
LEXUS | LEVE: RX*, ES*, IS*
ASIA | LEVE: Towner, Topic
MARCOPOLO | PESADA: Volare
"""

# marca escrita no texto → fabricante (completa a tabela MONTADORAS do gerar_site.py)
MARCAS_TXT = {
    "FIAT": "FIAT", "FORD": "FORD", "VW": "VOLKSWAGEN", "VOLKSWAGEN": "VOLKSWAGEN", "VOLKS": "VOLKSWAGEN",
    "GM": "CHEVROLET", "CHEVROLET": "CHEVROLET", "GENERAL MOTORS": "CHEVROLET", "RENAULT": "RENAULT",
    "PEUGEOT": "PEUGEOT", "CITROEN": "CITROËN", "TOYOTA": "TOYOTA", "HONDA": "HONDA", "HYUNDAI": "HYUNDAI",
    "KIA": "KIA", "NISSAN": "NISSAN", "MITSUBISHI": "MITSUBISHI", "JEEP": "JEEP", "DODGE": "DODGE",
    "CHRYSLER": "CHRYSLER", "AUDI": "AUDI", "BMW": "BMW", "MERCEDES-BENZ": "MERCEDES-BENZ",
    "MERCEDES BENZ": "MERCEDES-BENZ", "MERCEDES": "MERCEDES-BENZ", "MB": "MERCEDES-BENZ", "MBB": "MERCEDES-BENZ",
    "VOLVO": "VOLVO", "SCANIA": "SCANIA", "IVECO": "IVECO", "AGRALE": "AGRALE", "CHERY": "CHERY", "JAC": "JAC",
    "LAND ROVER": "LAND ROVER", "SUZUKI": "SUZUKI", "YAMAHA": "YAMAHA", "TROLLER": "TROLLER", "SUBARU": "SUBARU",
    "MAZDA": "MAZDA", "PORSCHE": "PORSCHE", "MINI": "MINI", "SEAT": "SEAT", "DAEWOO": "DAEWOO",
    "ALFA ROMEO": "ALFA ROMEO", "JAGUAR": "JAGUAR", "LEXUS": "LEXUS", "LIFAN": "LIFAN", "EFFA": "EFFA", "ASIA": "ASIA",
    "MAN": "VOLKSWAGEN",  # [SUPOSIÇÃO] caminhão MAN no Brasil = VW Caminhões
    "DAF": "DAF", "INTERNATIONAL": "INTERNATIONAL", "KAWASAKI": "KAWASAKI", "DAFRA": "DAFRA", "SHINERAY": "SHINERAY",
    "KASINSKI": "KASINSKI", "MARCOPOLO": "MARCOPOLO", "GMC": "GMC", "RAM": "RAM",
}
# fabricante de motor, câmbio, eixo, implemento ou máquina agrícola: não é veículo do filtro
NAO_VEICULO = ["CUMMINS", "MWM", "PERKINS", "EATON", "ZF", "DANA", "MERITOR", "ROCKWELL", "BOSCH", "VALEO", "DELCO",
               "DENSO", "RANDON", "GUERRA", "FACCHINI", "NOMA", "JOHN DEERE", "MASSEY FERGUSON", "VALTRA",
               "NEW HOLLAND", "CASE IH", "CASE", "CATERPILLAR", "KOMATSU", "MAXION"]
GENERICO = re.compile(r"\b(UNIVERSAL|TODOS OS|DIVERSOS|LINHA (LEVE|PESADA)|CAMINHOES|ONIBUS|UTILITARIOS|MOTOS|"
                      r"MOTOCICLETAS|AGRICOLA|TRATORES|INDUSTRIA|VEICULOS)\b")

# versões: acabamento, série e (decisão 3) carroceria. Motor (1.6 16V, Fire, EVO, Zetec) e diferencial (4x4,
# c/ ABS) NÃO são versão.
VERSOES = ["LX", "LXS", "LXL", "EX", "EXS", "EXL", "EXR", "DX", "GL", "GLS", "GLX", "GLI", "GT", "GTI", "GTS", "GSI",
           "SX", "XLS", "XLT", "XL", "XS", "XR", "XEI", "SEL", "LS", "LT", "LTZ", "LTX", "SS", "RS", "ELX", "HLX",
           "CROSS", "ADVENTURE", "SPORT", "YOUNG", "TREKKING", "WAY", "ATTRACTIVE", "ESSENCE", "SPORTING", "HIGHLINE",
           "COMFORTLINE", "TRENDLINE", "TITANIUM", "FREESTYLE", "EXPRESSION", "DYNAMIQUE", "PRIVILEGE", "AUTHENTIQUE",
           "INTENSE", "ZEN", "ICONIC", "DAKAR", "FULL", "HPE", "OUTDOOR", "SAVANA", "TROPICAL", "MILLE", "PLUS", "JOY",
           "ACTIVE", "LIMITED", "PREMIER", "MIDNIGHT", "RANCH", "FREEDOM", "ENDURANCE", "G2", "G3", "G4", "G5", "G6",
           "G7", "EXPRESS", "ECONOMY", "VIVACE", "ELECTRONIC", "CELEBRATION"]
CARROCERIA = {"HATCH": "Hatch", "SEDAN": "Sedan", "PICK-UP": "Pick-Up", "PICKUP": "Pick-Up", "PICK UP": "Pick-Up",
              "SW": "SW", "FURGAO": "Furgão", "WAGON": "Wagon", "CABINE DUPLA": "Cabine Dupla",
              "CABINE SIMPLES": "Cabine Simples"}
SIGLAS_MAIUSC = {"WAY": "Way", "JOY": "Joy", "ZEN": "Zen"}
# modelos em que o número logo depois é a versão (decisão 4: "Cargo 1722")
CAMINHAO_NUM = {"TITAN", "CG TITAN", "CARGO", "ATEGO", "AXOR", "ACCELO", "ACTROS", "CONSTELLATION", "WORKER",
                "DELIVERY", "TECTOR", "STRALIS", "EUROCARGO", "TITAN TRACTOR", "DAILY", "ATRON", "VOLARE", "EUROTECH",
                "VERTIS", "SPRINTER"}


def norm(s: str) -> str:
    return gs.sem_acento(s).upper().replace("–", "-").replace("—", "-")


def padrao_modelo(nome: str) -> str:
    n = norm(nome)
    partes = []
    for i, ch in enumerate(n):
        if ch in " -":
            partes.append(r"[\s\-]?")
            continue
        if i and n[i - 1].isalnum() and ch.isalnum() and n[i - 1].isdigit() != ch.isdigit():
            partes.append(r"[\s\-]?")
        partes.append(re.escape(ch))
    return r"(?<![A-Z0-9])" + "".join(partes) + r"(?![A-Z0-9])"


def apelidos(nome: str, serie: bool) -> str:
    if serie:
        return f"{nome} + número ({nome} 1620, {nome}-1620, {nome}1620)"
    n = norm(nome)
    junto = re.sub(r"[\s\-]", "", n)
    com_espaco = re.sub(r"(?<=[A-Z])(?=\d)|(?<=\d)(?=[A-Z])", " ", junto)
    com_hifen = re.sub(r"(?<=[A-Z])(?=\d)|(?<=\d)(?=[A-Z])", "-", junto)
    vs = []
    for v in (nome, gs.sem_acento(nome) if gs.sem_acento(nome) != nome else "", junto, com_espaco, com_hifen):
        if v and v.upper() not in {x.upper() for x in vs}:
            vs.append(v)
    return ", ".join(vs)


DICIONARIO = []   # linhas da aba MODELOS_VEICULO
MODELOS = []      # (regex, fabricante, nome, precisa_marca, serie)
for _linha in MODELOS_TXT.strip().splitlines():
    _cab, _lista = _linha.split(":", 1)
    _fab, _lin = [x.strip() for x in _cab.split("|")]
    for _nome in [x.strip() for x in _lista.split(",") if x.strip()]:
        _serie = _nome.endswith("+n")
        _ctx = _nome.endswith("*") or _serie
        _nome = _nome.rstrip("*").replace("+n", "")
        if _serie:
            _pad = r"(?<![A-Z0-9])" + _nome + (r"[\s\-]?(\d{3,4})(?![\d.])" if _fab == "MERCEDES-BENZ"
                                               else r"[\s\-]?(\d{3})(?![\d.])")
        else:
            _pad = padrao_modelo(_nome)
        MODELOS.append((re.compile(_pad), _fab, _nome, _ctx, _serie))
        if _nome != "Mille":   # "Mille" vira Uno, versão Mille
            DICIONARIO.append([_fab, _nome, apelidos(_nome, _serie), _lin, "SIM" if _ctx else "NÃO"])
MODELOS.sort(key=lambda m: len(m[2]), reverse=True)

MARCA_RX = re.compile(r"(?<![A-Z0-9])(" + "|".join(sorted((re.escape(k) for k in MARCAS_TXT), key=len, reverse=True))
                      + r")(?![A-Z0-9])")
NAOV_RX = re.compile(r"(?<![A-Z0-9])(" + "|".join(re.escape(k) for k in NAO_VEICULO) + r")(?![A-Z0-9])")
_TODAS_VERSOES = sorted(set(VERSOES) | set(CARROCERIA), key=len, reverse=True)
VERS_RX = re.compile(r"^(" + "|".join(re.escape(v).replace(r"\ ", r"\s") for v in _TODAS_VERSOES) + r")(?![A-Z0-9])")
SEP = re.compile(r"\s*(?:;|\n|\s\+\s|\|)\s*")


def rotulo_versao(v: str) -> str:
    v = re.sub(r"\s+", " ", v)
    if v in CARROCERIA:
        return CARROCERIA[v]
    if v in SIGLAS_MAIUSC:
        return SIGLAS_MAIUSC[v]
    return v.title() if len(v) > 3 and not re.search(r"\d", v) else v


def fabricantes_da_coluna(mo: str) -> set[str]:
    out = set()
    for parte in re.split(r"[/,]", mo or ""):
        p = parte.strip().upper()
        if p:
            p = gs.MONTADORAS.get(p, p)
            out.add(MARCAS_TXT.get(norm(p), p))
    return out


def versoes_apos(t: str, fim: int, nome: str) -> list[str]:
    """Versões logo depois do modelo. Lista com mais de uma = um veículo para cada (ex.: Hatch / Sedan)."""
    if norm(nome) in CAMINHAO_NUM:
        resto, nums, pos = t[fim:fim + 80], [], 0
        while True:
            m = re.match(r"^(\s*[,/]\s*(?:" + re.escape(norm(nome)) + r"\s*)?|\s*-?\s*)(\d{1,2}\.\d{3}|\d{3,4})"
                         r"([A-Z]{0,2})(?![\d.]|\s*(L|CC|MM|CV)\b)", resto[pos:])
            if not m:
                break
            num = m.group(2)
            # 4 dígitos entre 1950 e 2035 sem sufixo é ano, não versão (2035S é versão: Axor 2035S)
            if "." not in num and 1950 <= int(num) <= 2035 and not m.group(3):
                break
            nums.append(num)
            pos += m.end()
        if nums:
            return nums
    resto, vs, pos, barra = t[fim:fim + 40], [], 0, False
    while len(vs) < 3:
        m = re.match(r"^[\s/]*", resto[pos:])
        if "/" in m.group(0) and vs:
            barra = True
        pos += m.end()
        mv = VERS_RX.match(resto[pos:])
        if not mv:
            break
        vs.append(rotulo_versao(mv.group(1)))
        pos += mv.end()
    if not vs:
        return [""]
    return vs if barra else [" ".join(vs)]


def extrair(apl: str, mo: str, linha: str):
    """APLICACAO → (veículos [(fab, modelo, versao)], situação, motivos [(tipo, texto simples)])."""
    texto = re.split(r"\|\s*DETALHE", norm(apl))[0]
    fab_col = fabricantes_da_coluna(mo)
    veiculos, motivos = [], []
    for seg in SEP.split(texto):
        if not seg.strip():
            continue
        marcas = {MARCAS_TXT[m] for m in MARCA_RX.findall(seg)}
        ctx = marcas | (fab_col if not marcas else set())
        mascara, achados = list(seg), []
        for rx, fab, nome, precisa, serie in MODELOS:
            for m in rx.finditer("".join(mascara)):
                if precisa and fab not in ctx and not (fab in ("HONDA", "YAMAHA", "SUZUKI") and linha == "MOTO"):
                    continue
                depois = seg[m.end():]
                # "Titan 17.310" = caminhão VW; "Titan" sem número = moto Honda (exceção do legado)
                if nome in ("Titan", "CG Titan") and fab == "HONDA" and re.match(r"^\s*\d{2}\.\d{3}", depois):
                    fab = "VOLKSWAGEN"
                elif nome == "Titan" and fab == "VOLKSWAGEN" and not re.match(r"^\s*\d{2}\.\d{3}", depois):
                    continue
                a, b = m.span()
                if nome == "Strada" and re.search(r"CBX\s*\d*\s*$", seg[:a]):   # Honda CBX 200 Strada
                    continue
                if serie:   # decisão 4: série de caminhão = MODELO, número = VERSAO (MB L 1620, Scania R 440)
                    if fab == "MERCEDES-BENZ" and 1950 <= int(m.group(1)) <= 2035:
                        continue
                    novos = [(fab, nome, m.group(1))]
                else:
                    modelo, vs = nome, versoes_apos(seg, b, nome)
                    if nome == "Mille":
                        modelo, vs = "Uno", ["Mille"]
                    novos = [(fab, modelo, v) for v in vs]
                    if marcas and fab not in marcas and len(marcas) == 1 and not precisa:
                        motivos.append(("marca diferente", f"o texto diz {next(iter(marcas))}, mas {modelo} é "
                                                           f"{fab}: pode ser erro do texto ou leitura errada"))
                for v in novos:
                    if v not in [x[1] for x in achados]:
                        achados.append((a, v))
                for i in range(a, b):
                    mascara[i] = "#"
        for _, v in sorted(achados, key=lambda x: x[0]):
            if v not in veiculos:
                veiculos.append(v)
        if not achados:
            if marcas:
                for f in sorted(marcas):
                    if (f, "", "") not in veiculos:
                        veiculos.append((f, "", ""))
                trecho = seg.strip()[:60]
                motivos.append(("marca sem modelo", f"cita {', '.join(sorted(marcas))} sem dizer o modelo "
                                                    f"(ou só com número): \"{trecho}\""))
            elif NAOV_RX.search(seg):
                motivos.append(("motor/câmbio/agrícola", f"cita só fabricante de motor, câmbio, eixo ou máquina "
                                                         f"agrícola ({NAOV_RX.search(seg).group(1)}), que não é "
                                                         f"veículo do filtro"))
    completos = [v for v in veiculos if v[1]]
    so_marca = [v for v in veiculos if not v[1] and not any(c[0] == v[0] for c in completos)]
    veiculos = completos + so_marca
    vistos, mot = set(), []
    for t, x in motivos:
        if (t, x) not in vistos:
            vistos.add((t, x))
            mot.append((t, x))
    if not veiculos:
        sit = "duvidoso" if mot else "sem veículo"
    elif mot or so_marca:
        sit = "duvidoso"
    else:
        sit = "separado"
    return veiculos, sit, mot


def motivo_sem_veiculo(apl: str, linha: str) -> str:
    if not apl.strip():
        return "aplicação vazia"
    if GENERICO.search(norm(apl)) or linha == "UNIVERSAL":
        return "universal ou genérico (óleo, químico, caminhões, motos, agrícola...)"
    return "texto sem marca nem modelo conhecido"


# ------------------------------------------------------------------ simulação
def extrair_todos():
    produtos = gs.ler_base(BASE)
    out = []
    for p in produtos:
        ve, sit, mot = extrair(p["a"], p["mo"], p["li"])
        out.append((p, ve, sit, mot))
    return out


def cabecalho(ws, cab, larguras):
    ws.append(cab)
    for c in ws[1]:
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = PatternFill("solid", fgColor="1F3864")
    ws.freeze_panes = "A2"
    for i, w in enumerate(larguras):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i + 1)].width = w


def linhas_log(por_codigo: dict[str, tuple]) -> list[list[str]]:
    log = []
    for cod, (sit, ves) in por_codigo.items():
        nomes = [" ".join(x for x in v[:3] if x) for v in ves]
        lista = "; ".join(nomes[:8]) + (f"; e mais {len(nomes) - 8}" if len(nomes) > 8 else "")
        if sit == "separado":
            obs = f"{len(ves)} veículo(s) separado(s) da APLICACAO ({lista})"
        else:
            obs = (f"linhas SITUACAO=duvidoso para revisão, fora do filtro do site ({lista or 'sem modelo achado'})")
        log.append(["VEICULO_NOVO", "VEICULOS", cod, "",
                    f"VEICULOS: {obs}, ORIGEM automático; aba PRODUTOS sem mudança. T-0017, {DATA}"])
    return log


def simular():
    todos = extrair_todos()
    sep = [(p, ve) for p, ve, s, _ in todos if s == "separado"]
    duv = [(p, ve, mot) for p, ve, s, mot in todos if s == "duvidoso"]
    sem = [p for p, ve, s, _ in todos if s == "sem veículo"]
    def motivo_curto(mot):
        return " | ".join(x for _, x in mot) or "uma das marcas citadas ficou sem modelo"

    veic, por_cod = [], collections.OrderedDict()
    for p, ve, s, mot in todos:
        if s == "separado":
            linhas_p = [[p["c"], v[0], v[1], v[2], None, None, "automático", "separado", None] for v in ve]
        elif s == "duvidoso":   # como está (decisão 2): inclusive marca sem modelo e produto sem veículo achado
            linhas_p = [[p["c"], v[0] or None, v[1] or None, v[2] or None, None, None, "automático", "duvidoso",
                         motivo_curto(mot)] for v in (ve or [("", "", "")])]
        else:
            continue
        veic += linhas_p
        por_cod[p["c"]] = (s, [v for v in ve if v[1]])
    log = linhas_log(por_cod)

    # conferências antes de gravar a planilha
    erros = []
    dic = {(d[0], d[1]) for d in DICIONARIO}
    fora = {(v[1], v[2]) for v in veic if v[2] and (v[1], v[2]) not in dic}
    if fora:
        erros.append(f"veículos com modelo fora do MODELOS_VEICULO: {sorted(fora)[:10]}")
    if any(not v[1] or not v[2] for v in veic if v[7] == "separado"):
        erros.append("linha separado da VEICULOS sem FABRICANTE ou sem MODELO")
    if len({tuple(v[:4]) for v in veic}) != len(veic):
        erros.append("linha repetida na VEICULOS")
    txt = repr([[p["c"], p["a"], ve] for p, ve, _, _ in todos])
    m = gs.TRAVA.search(txt + repr(DICIONARIO) + repr(log))
    if m:
        erros.append(f"TRAVA: dado interno na saída ({m.group(0)})")
    if erros:
        print("[PARADO] a simulação não foi gravada:")
        for e in erros:
            print("   ", e)
        sys.exit(2)

    PASTA_SIM.mkdir(parents=True, exist_ok=True)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "VEICULOS"
    cabecalho(ws, CAB_VEICULOS, (16, 18, 24, 16, 12, 10, 12, 12, 80))
    for v in veic:
        ws.append(v)
    ws.auto_filter.ref = ws.dimensions

    wm = wb.create_sheet("MODELOS_VEICULO")
    cabecalho(wm, CAB_MODELOS, (18, 22, 50, 10, 15))
    for d in sorted(DICIONARIO, key=lambda d: (d[0], d[1])):
        wm.append(d)
    wm.auto_filter.ref = wm.dimensions

    wd = wb.create_sheet("DUVIDOSOS")
    cabecalho(wd, ["CODIGO_BAP", "APLICACAO", "VEICULOS_ACHADOS", "TIPO_DA_DUVIDA", "POR_QUE"], (16, 80, 60, 26, 80))
    for p, ve, mot in duv:
        wd.append([p["c"], p["a"], "; ".join(" ".join(x for x in v if x) for v in ve),
                   " / ".join(sorted({t for t, _ in mot})) or "marca sem modelo",
                   " | ".join(x for _, x in mot) or "uma das marcas citadas ficou sem modelo"])
    wd.auto_filter.ref = wd.dimensions

    # resumo
    fabs, mods, vers = collections.Counter(), collections.Counter(), collections.Counter()
    for p, ve in sep:
        for f in {v[0] for v in ve}:
            fabs[f] += 1
        for k in {(v[0], v[1]) for v in ve}:
            mods[k] += 1
        for k in {v for v in ve if v[2]}:
            vers[k] += 1
    tipos = collections.Counter(t for _, _, mot in duv for t in {t for t, _ in mot} or {"marca sem modelo"})
    motsem = collections.Counter(motivo_sem_veiculo(p["a"], p["li"]) for p in sem)
    com_modelo = sum(1 for _, ve, _, _ in todos if any(v[1] for v in ve))
    wr = wb.create_sheet("RESUMO")
    cabecalho(wr, ["INDICADOR", "VALOR", "", "", ""], (60, 12, 4, 14, 80))
    linhas = [
        ["Produtos do catálogo digital (filtro do gerar_site.py)", len(todos)],
        ["Com pelo menos 1 veículo FABRICANTE + MODELO (separado + duvidoso)", com_modelo],
        ["SEPARADO: na VEICULOS e no filtro do site", len(sep)],
        ["DUVIDOSO: na VEICULOS como está (SITUACAO=duvidoso), fora do filtro até a revisão", len(duv)],
        ["SEM VEÍCULO", len(sem)],
        ["Linhas da aba VEICULOS (produto × veículo)", len(veic)],
        ["  separado", sum(1 for v in veic if v[7] == "separado")],
        ["  duvidoso", sum(1 for v in veic if v[7] == "duvidoso")],
        ["  duvidoso com FABRICANTE + MODELO", sum(1 for v in veic if v[7] == "duvidoso" and v[2])],
        ["  duvidoso só com a marca (MODELO vazio)", sum(1 for v in veic if v[7] == "duvidoso" and v[1] and not v[2])],
        ["  duvidoso sem veículo achado (só o código e o MOTIVO)", sum(1 for v in veic if v[7] == "duvidoso" and not v[1])],
        ["Linhas separado com VERSAO preenchida", sum(1 for v in veic if v[7] == "separado" and v[3])],
        ["Fabricantes distintos (separados)", len(fabs)],
        ["Modelos distintos (separados; fabricante + modelo)", len(mods)],
        ["Versões distintas (separados; fabricante + modelo + versão)", len(vers)],
        ["Modelos no dicionário MODELOS_VEICULO", len(DICIONARIO)],
        [], ["DUVIDOSOS por tipo de dúvida (um produto pode ter mais de um)", ""],
    ] + [[f"  {k}", n] for k, n in tipos.most_common()] + [
        [], ["SEM VEÍCULO por motivo", ""],
    ] + [[f"  {k}", n] for k, n in motsem.most_common()] + [
        [], ["As contagens abaixo são só dos SEPARADOS (os que vão ao filtro do site)", ""],
        [], ["POR FABRICANTE (produtos separados)", "PRODUTOS"],
    ] + [[f, n] for f, n in fabs.most_common()] + [
        [], ["POR MODELO (produtos separados)", "PRODUTOS"],
    ] + [[f"{f} {m}", n] for (f, m), n in mods.most_common()] + [
        [], ["POR VERSÃO (produtos separados)", "PRODUTOS"],
    ] + [[" ".join(k), n] for k, n in vers.most_common()] + [
        [], ["OS QUE NÃO SEPARAM: SEM VEÍCULO (código e motivo; os duvidosos estão na aba DUVIDOSOS)", ""],
    ] + [[p["c"], "", "", "", motivo_sem_veiculo(p["a"], p["li"])] for p in sem]
    for l in linhas:
        wr.append(l)
    for c in wr["A"]:
        if c.value and isinstance(c.value, str) and c.value.isupper() and wr.cell(c.row, 2).value in ("", "PRODUTOS"):
            c.font = Font(bold=True)

    wl = wb.create_sheet("LOG_CORRECOES_PREVISTO")
    cabecalho(wl, CAB_LOG, (16, 12, 22, 18, 120))
    for l in log:
        wl.append(l)
    wb.save(SIM)

    print(f"  {SIM.relative_to(RAIZ)}: VEICULOS {len(veic)} linhas ({len(por_cod)} produtos: {len(sep)} separados, "
          f"{len(duv)} duvidosos; linhas separado {sum(1 for v in veic if v[7] == 'separado')}, duvidoso "
          f"{sum(1 for v in veic if v[7] == 'duvidoso')}), MODELOS_VEICULO "
          f"{len(DICIONARIO)}, DUVIDOSOS {len(duv)}, sem veículo {len(sem)}, LOG previsto {len(log)}")
    print(f"  com >=1 fabricante+modelo {com_modelo}; fabricantes {len(fabs)}, modelos {len(mods)}, versões "
          f"{len(vers)}; linhas separado com versão {sum(1 for v in veic if v[7] == 'separado' and v[3])}")
    print(f"  dúvidas por tipo {dict(tipos)}; sem veículo {dict(motsem)}")
    print(f"  top fabricantes {fabs.most_common(10)}")
    print(f"  top modelos {[(f + ' ' + m, n) for (f, m), n in mods.most_common(10)]}")
    print(f"  top versões {[(' '.join(k), n) for k, n in vers.most_common(12)]}")


# ------------------------------------------------------------------ montar a v17 e conferir
LEIA_ME_V17 = [
    ("BASE BAP UNIFICADA v17 ({data})", None),
    ("VEICULOS (aba nova)", "Uma linha por produto x veículo: CODIGO_BAP, FABRICANTE, MODELO, VERSAO, ANO_INICIO, "
                            "ANO_FIM, ORIGEM (automático/manual), SITUACAO (separado/duvidoso), MOTIVO. {n} linhas de "
                            "{p} produtos, separadas da APLICACAO (ORIGEM automático). As linhas duvidoso ficam para "
                            "revisão e fora do filtro do site até lá. "
                            "Carroceria (Hatch, Sedan, Pick-Up, SW) e número de caminhão (Cargo 1722) são VERSAO. "
                            "Anos vazios: etapa 2 (T-0017)."),
    ("MODELOS_VEICULO (aba nova)", "Dicionário de modelos: FABRICANTE, MODELO, APELIDOS, LINHA, PRECISA_MARCA "
                                   "({m} modelos). Modelo novo ou apelido novo entra aqui (T-0017)."),
    ("Formato", "Aba PRODUTOS igual à da v16 (nenhuma célula mudou; as 5 primeiras colunas, que a BAP Central lê, "
                "não mudam). Duas abas novas no fim (VEICULOS e MODELOS_VEICULO). {p} linhas no LOG_CORRECOES (uma "
                "por código que ganhou veículos). Aprovado pelo Alexandre em {data}."),
    (None, None),
]


def ler_sim():
    wb = openpyxl.load_workbook(SIM, read_only=True)
    abas = {}
    for nome in ABAS_NOVAS + ["LOG_CORRECOES_PREVISTO"]:
        rows = [list(r) for r in wb[nome].iter_rows(values_only=True)]
        abas[nome] = [rows[0]] + [r for r in rows[1:] if any(v is not None for v in r)]
    wb.close()
    return abas


def montar(wb, abas):
    """Aplica na base aberta: abas novas no fim, linhas no fim do LOG_CORRECOES e título no topo do LEIA-ME."""
    erros = []
    if any(n in wb.sheetnames for n in ABAS_NOVAS):
        erros.append(f"a base já tem {ABAS_NOVAS}")
    if abas["VEICULOS"][0] != CAB_VEICULOS or abas["MODELOS_VEICULO"][0] != CAB_MODELOS:
        erros.append("cabeçalho das abas novas diferente do previsto")
    if abas["LOG_CORRECOES_PREVISTO"][0] != CAB_LOG or [limpo(c.value) for c in wb["LOG_CORRECOES"][1]] != CAB_LOG:
        erros.append("cabeçalho do LOG_CORRECOES diferente do previsto")
    codigos_base = {limpo(r[0]).upper() for r in wb["PRODUTOS"].iter_rows(min_row=2, max_col=1, values_only=True)}
    cods = [r[0] for r in abas["VEICULOS"][1:]]
    if set(cods) - codigos_base:
        erros.append(f"códigos da VEICULOS fora da PRODUTOS: {sorted(set(cods) - codigos_base)[:10]}")
    log = abas["LOG_CORRECOES_PREVISTO"][1:]
    if sorted(limpo(l[2]) for l in log) != sorted(set(cods)):
        erros.append("LOG_CORRECOES_PREVISTO não tem uma linha por código da VEICULOS")
    if any(DATA not in limpo(l[4]) or "T-0017" not in limpo(l[4]) for l in log):
        erros.append(f"linha do LOG sem a tarefa (T-0017) ou a data ({DATA})")
    if erros:
        print("[PARADO] nada foi gravado:")
        for e in erros:
            print("   ", e)
        sys.exit(2)
    for nome, larg in (("VEICULOS", (16, 18, 24, 16, 12, 10, 12, 12, 80)), ("MODELOS_VEICULO", (18, 22, 50, 10, 15))):
        ws = wb.create_sheet(nome)
        for r in abas[nome]:
            ws.append(r)
        for c in ws[1]:
            c.font = Font(bold=True)
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        for i, w in enumerate(larg):
            ws.column_dimensions[openpyxl.utils.get_column_letter(i + 1)].width = w
    lg = wb["LOG_CORRECOES"]
    ult = lg.max_row
    for i, l in enumerate(log, 1):
        for j, v in enumerate(l[:5], 1):
            lg.cell(ult + i, j).value = v if limpo(v) else None
    lm = wb["LEIA-ME"]
    n = len(LEIA_ME_V17)
    alturas = {r: d.height for r, d in lm.row_dimensions.items() if d.height}
    lm.insert_rows(1, n)
    for r in list(lm.row_dimensions):
        lm.row_dimensions[r].height = None
    for r, h in alturas.items():
        lm.row_dimensions[r + n].height = h
    fmt = dict(data=DATA, n=len(cods), p=len(set(cods)), m=len(abas["MODELOS_VEICULO"]) - 1)
    for i, (a, b) in enumerate(LEIA_ME_V17, 1):
        lm.cell(i, 1).value = a.format(**fmt) if a else None
        lm.cell(i, 2).value = b.format(**fmt) if b else None
    return ult, n


def limpo(v) -> str:
    return "" if v is None else str(v).strip()


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def assinatura(c):
    return tuple(copy(getattr(c, k)) for k in ("font", "fill", "border", "alignment", "protection")) + (
        c.number_format,)


def comparar(novo: Path, velho: Path, abas, log_ult: int, leia_n: int) -> list[str]:
    """Diferenças entre a v17 montada e a v16 fora do permitido. Lista vazia = só o que a T-0017 pede."""
    a, b = openpyxl.load_workbook(novo), openpyxl.load_workbook(velho)
    dif = []
    if a.sheetnames != b.sheetnames + ABAS_NOVAS:
        return [f"abas: {a.sheetnames} x {b.sheetnames} + {ABAS_NOVAS}"]
    celulas = 0
    for nome in b.sheetnames:
        wa, wb_ = a[nome], b[nome]
        desloc, extra = 0, set()
        if nome == "LEIA-ME":
            desloc, extra = leia_n, set(range(1, leia_n + 1))
        if nome == "LOG_CORRECOES":
            extra = set(range(log_ult + 1, wa.max_row + 1))
        if wa.max_column != wb_.max_column:
            dif.append(f"{nome}: colunas {wa.max_column} x {wb_.max_column}")
        if wa.max_row != wb_.max_row + len(extra):
            dif.append(f"{nome}: linhas {wa.max_row} x {wb_.max_row} + {len(extra)}")
        if wa.freeze_panes != wb_.freeze_panes:
            dif.append(f"{nome}: freeze_panes")
        if wa.auto_filter.ref != wb_.auto_filter.ref:
            dif.append(f"{nome}: auto_filter")
        if {k: d.width for k, d in wa.column_dimensions.items()} != {k: d.width for k, d in wb_.column_dimensions.items()}:
            dif.append(f"{nome}: larguras de coluna")
        ha = {r: d.height for r, d in wa.row_dimensions.items() if d.height and r not in extra}
        hb = {r + desloc: d.height for r, d in wb_.row_dimensions.items() if d.height}
        if ha != hb:
            dif.append(f"{nome}: alturas de linha")
        for r in range(1, wb_.max_row + 1):
            for c in range(1, wb_.max_column + 1):
                ca, cb = wa.cell(r + desloc, c), wb_.cell(r, c)
                if nome == "PRODUTOS":
                    celulas += 1
                if ca.value != cb.value:
                    dif.append(f"{nome} {cb.coordinate}: valor mudou")
                elif assinatura(ca) != assinatura(cb):
                    dif.append(f"{nome} {cb.coordinate}: formatação mudou")
    for nome in ABAS_NOVAS:
        vals = [list(r) for r in a[nome].iter_rows(values_only=True)]
        if vals != abas[nome]:
            dif.append(f"{nome}: diferente da simulação")
    prod_dif = sum(1 for d in dif if d.startswith("PRODUTOS"))
    print(f"  comparação com a v16: PRODUTOS {celulas} células conferidas (valor e formatação), {prod_dif} "
          f"diferentes; LOG_CORRECOES +{a['LOG_CORRECOES'].max_row - log_ult} linhas; LEIA-ME +{leia_n} linhas; "
          f"abas novas {ABAS_NOVAS} iguais à simulação: {'sim' if not any(d.split(':')[0] in ABAS_NOVAS for d in dif) else 'NÃO'}; "
          f"diferenças fora do permitido: {len(dif)}")
    return dif


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--simular", action="store_true", help="não grava a base: gera a simulação e confere")
    arg = ap.parse_args()
    if sha(BASE) != sha(V16):
        raise SystemExit("[PARADO] a base de hoje não é a v16: refaça a simulação")
    if arg.simular:
        simular()
    elif V17.exists():
        raise SystemExit(f"[PARADO] {V17.name} já existe: a v17 já foi gravada")
    abas = ler_sim()
    wb = openpyxl.load_workbook(BASE)
    ult, n = montar(wb, abas)
    with tempfile.TemporaryDirectory() as tmp:
        nova = Path(tmp) / BASE.name
        wb.save(nova)
        dif = comparar(nova, V16, abas, ult, n)
        for d in dif[:30]:
            print("   ", d)
        if dif:
            print("[PARADO] a v17 difere da v16 fora do que a tarefa pede (nada foi gravado)")
            sys.exit(2)
        if arg.simular:
            print(f"  [SIMULAÇÃO] a base não foi gravada; sha256 da base (= v16): {sha(BASE)}")
            return
        shutil.copyfile(nova, BASE)
        shutil.copyfile(nova, V17)
    print(f"  {BASE.relative_to(RAIZ)}: sha256 {sha(BASE)}")
    print(f"  {V17.relative_to(RAIZ)}: sha256 {sha(V17)}")


if __name__ == "__main__":
    main()
