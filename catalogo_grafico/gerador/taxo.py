import re
import pandas as pd

import unicodedata
norm = lambda s: re.sub(r'[^A-Z0-9]', '', str(s).upper())
U = lambda s: ''.join(ch for ch in unicodedata.normalize('NFD', str(s).upper()) if unicodedata.category(ch) != 'Mn')

# PRODUTO (linha do catálogo) -> CATEGORIA, SISTEMA, FAMÍLIA, descrição da capa, lançamento 2026, foto
LINES = [
    ('Amortecedores', 'PEÇAS', 'SUSPENSÃO', 'AMORTECEDORES E KITS', 'Amortecedores a gás e a óleo, dianteiros e traseiros, com equivalência às principais marcas do mercado.', False),
    ('Kit Batente de Amortecedor', 'PEÇAS', 'SUSPENSÃO', 'AMORTECEDORES E KITS', 'Kits de batente e coifa para amortecedores dianteiros e traseiros.', False),
    ('Pivô de Suspensão', 'PEÇAS', 'SUSPENSÃO', 'BRAÇOS E ARTICULAÇÕES', 'Pivôs de suspensão superiores e inferiores para automóveis, picapes e utilitários.', False),
    ('Bandejas de Suspensão', 'PEÇAS', 'SUSPENSÃO', 'BRAÇOS E ARTICULAÇÕES', 'Bandejas de suspensão para os lados direito e esquerdo, com equivalência às principais marcas.', False),
    ('Suporte Tensor (Morcego)', 'PEÇAS', 'SUSPENSÃO', 'BRAÇOS E ARTICULAÇÕES', 'Suportes tensores (morcego) para a suspensão dianteira.', False),
    ('Bucha da Barra Estabilizadora', 'PEÇAS', 'SUSPENSÃO', 'BARRA ESTABILIZADORA', 'Buchas da barra estabilizadora em diversas medidas.', True),
    ('Bieletas', 'PEÇAS', 'SUSPENSÃO', 'BARRA ESTABILIZADORA', 'Bieletas da barra estabilizadora, dianteiras e traseiras.', False),
    ('Terminais de Direção', 'PEÇAS', 'DIREÇÃO', 'TERMINAIS E ARTICULAÇÕES', 'Terminais de direção para os lados direito e esquerdo.', False),
    ('Terminal Axial', 'PEÇAS', 'DIREÇÃO', 'TERMINAIS E ARTICULAÇÕES', 'Terminais axiais (braços axiais) da caixa de direção.', False),
    ('Caixa de Direção', 'PEÇAS', 'DIREÇÃO', 'CAIXAS DE DIREÇÃO', 'Caixas de direção mecânicas, hidráulicas e elétricas.', False),
    ('Junta Homocinética', 'PEÇAS', 'TRANSMISSÃO', 'HOMOCINÉTICAS E SEMI-EIXOS', 'Juntas homocinéticas tripoides e deslizantes.', False),
    ('Kit Reparo da Junta Homocinética', 'PEÇAS', 'TRANSMISSÃO', 'HOMOCINÉTICAS E SEMI-EIXOS', 'Kits de reparo com coifa para juntas homocinéticas.', False),
    ('Trizetas', 'PEÇAS', 'TRANSMISSÃO', 'HOMOCINÉTICAS E SEMI-EIXOS', 'Trizetas (tripeças) para juntas homocinéticas.', False),
    ('Semi-Eixo Homocinético', 'PEÇAS', 'TRANSMISSÃO', 'HOMOCINÉTICAS E SEMI-EIXOS', 'Semi-eixos homocinéticos completos.', False),
    ('Cruzetas', 'PEÇAS', 'TRANSMISSÃO', 'CARDÃ E CRUZETAS', 'Cruzetas para cardãs e eixos de transmissão.', False),
    ('Embreagem Remanufaturada', 'PEÇAS', 'TRANSMISSÃO', 'EMBREAGEM', 'Kits de embreagem remanufaturados.', False),
    ('Servo e Cilindro de Embreagem', 'PEÇAS', 'TRANSMISSÃO', 'EMBREAGEM', 'Servos e cilindros de embreagem para caminhões e ônibus.', False),
    ('Pastilha de Freio', 'PEÇAS', 'FREIO', 'PASTILHAS E SAPATAS', 'Pastilhas de freio dianteiras e traseiras, com equivalência às principais marcas do mercado.', False),
    ('Sapata de Freio', 'PEÇAS', 'FREIO', 'PASTILHAS E SAPATAS', 'Sapatas de freio para sistemas a tambor.', False),
    ('Cilindro de Roda', 'PEÇAS', 'FREIO', 'HIDRÁULICA DE FREIO', 'Cilindros de roda para sistemas de freio a tambor.', False),
    ('Cuíca de Freio', 'PEÇAS', 'FREIO', 'FREIO A AR', 'Cuícas (câmaras) de freio para caminhões, ônibus e reboques com freio a ar.', True),
    ('Catraca de Freio', 'PEÇAS', 'FREIO', 'FREIO A AR', 'Catracas de freio (ajustadores de folga) para caminhões, ônibus e reboques com freio a ar.', True),
    ('Sensor ABS', 'PEÇAS', 'FREIO', 'SENSORES DE FREIO', 'Sensores de freio ABS dianteiros e traseiros.', True),
    ('Eletroventiladores', 'PEÇAS', 'ARREFECIMENTO', 'ARREFECIMENTO DO MOTOR', 'Eletroventiladores do radiador, com e sem defletor.', False),
    ("Bomba D'Água", 'PEÇAS', 'ARREFECIMENTO', 'ARREFECIMENTO DO MOTOR', "Bombas d'água do sistema de arrefecimento.", False),
    ('Bomba de Óleo', 'PEÇAS', 'MOTOR', 'LUBRIFICAÇÃO DO MOTOR', 'Bombas de óleo para a lubrificação do motor.', False),
    ('Interruptores de Pressão do Óleo', 'PEÇAS', 'MOTOR', 'LUBRIFICAÇÃO DO MOTOR', 'Interruptores (bulbos) de pressão do óleo do motor.', False),
    ('Bomba de Combustível', 'PEÇAS', 'MOTOR', 'ALIMENTAÇÃO DE COMBUSTÍVEL', 'Refis de bomba de combustível para veículos flex e a gasolina.', False),
    ('Kit de Distribuição', 'PEÇAS', 'MOTOR', 'CORREIAS E SINCRONISMO', 'Kits de distribuição com correia dentada e tensor.', False),
    ('Polias e Tensionadores', 'PEÇAS', 'MOTOR', 'CORREIAS E SINCRONISMO', 'Polias e tensionadores para as correias do motor.', True),
    ('Velas de Ignição', 'PEÇAS', 'ELÉTRICA', 'IGNIÇÃO', 'Velas de ignição para veículos a gasolina, etanol e flex.', True),
    ('Cabo de Vela', 'PEÇAS', 'ELÉTRICA', 'IGNIÇÃO', 'Cabos de vela de ignição.', False),
    ('Lâmpadas', 'PEÇAS', 'ELÉTRICA', 'ILUMINAÇÃO', 'Lâmpadas automotivas para faróis, sinalização e iluminação interna.', False),
    ('Interruptores e Sensores Elétricos', 'PEÇAS', 'ELÉTRICA', 'INTERRUPTORES E SENSORES', 'Interruptores e sensores elétricos de sinalização: luz de ré, luz de stop, neutro e outros.', False),
    ('Baterias', 'BATERIAS', 'ELÉTRICA', 'BATERIAS E TERMINAIS', 'Baterias automotivas para linha leve e pesada, com terminais.', False),
    ('Filtros', 'PEÇAS', 'FILTRAÇÃO', None, 'Filtros de ar, de óleo, de combustível e de ar-condicionado.', True),
    ('Óleo Lubrificante', 'LUBRIFICANTES', 'LUBRIFICANTES', None, 'Óleos de motor, de transmissão e hidráulicos.', False),
    ('Fluidos e Químicos', 'QUÍMICOS', 'QUÍMICOS', None, 'Aditivos, fluidos, selantes e produtos químicos automotivos.', False),
    ('Cubo de Roda', 'PEÇAS', 'RODAGEM', 'CUBOS E ROLAMENTOS', 'Cubos de roda dianteiros e traseiros.', False),
    ('Rolamentos', 'PEÇAS', 'RODAGEM', 'CUBOS E ROLAMENTOS', 'Rolamentos de roda, rolamentos de rolos e rígidos de esferas.', False),
    ('Rodas de Aço e Alumínio', 'PEÇAS', 'RODAGEM', 'RODAS', 'Rodas de aço e alumínio para caminhões e ônibus.', False),
    ('Pneus e Câmaras de Ar Moto', 'PNEUS', 'RODAGEM', 'PNEUS E CÂMARAS', 'Pneus e câmaras de ar para motocicletas.', False),
    ('Palhetas Limpa-Parabrisa', 'ACESSÓRIOS', 'ACESSÓRIOS', 'PALHETAS', 'Palhetas limpa-parabrisa em diversos tamanhos e linhas.', False),
    ('Cintas e Catracas', 'ACESSÓRIOS', 'ACESSÓRIOS', 'AMARRAÇÃO E REBOQUE', 'Cintas de amarração e de reboque para transporte de carga.', False),
]
META = {l[0]: dict(categoria=l[1], sistema=l[2], familia=l[3], desc=l[4], lanc=l[5]) for l in LINES}
ORDER_SIS = ['SUSPENSÃO', 'DIREÇÃO', 'TRANSMISSÃO', 'FREIO', 'ARREFECIMENTO', 'MOTOR', 'ELÉTRICA', 'FILTRAÇÃO',
             'LUBRIFICANTES', 'QUÍMICOS', 'RODAGEM', 'ACESSÓRIOS', 'OUTROS']

IFILE = pd.read_excel('entradas/CATALOGO_BAP_INTERRUPTORES.xlsx', 'CATALOGO BAP')
INT_TIPO = {norm(c): str(d) for c, d in zip(IFILE['BAP PN'], IFILE['DESCRIÇÃO'])}


def line_of(code, desc, catalog_line=None):
    d = U(desc); c = norm(code)
    if catalog_line and catalog_line not in ('Interruptores',):
        return catalog_line
    if c.startswith('INT') or 'INTERRUPTOR' in d or catalog_line == 'Interruptores':
        t = INT_TIPO.get(c, '')
        if 'pressão do óleo' in t or (not t and 'OLEO' in d): return 'Interruptores de Pressão do Óleo'
        return 'Interruptores e Sensores Elétricos'
    if 'CATRACA FREIO' in d or 'CATRACA DE FREIO' in d: return 'Catraca de Freio'
    if 'CUICA' in d or c.startswith('CFR'): return 'Cuíca de Freio'
    if 'RODA ARO' in d or 'RODA ALUMINIO' in d or c.startswith('ROD'): return 'Rodas de Aço e Alumínio'
    if 'PNEU' in d and 'PNEUMAT' not in d or 'CAMARA AR MOTO' in d: return 'Pneus e Câmaras de Ar Moto'
    if 'CINTA' in d: return 'Cintas e Catracas'
    if 'BATERIA' in d or c.startswith('KTB'): return 'Baterias'
    if 'PALHETA' in d: return 'Palhetas Limpa-Parabrisa'
    if 'FILTRO' in d: return 'Filtros'
    if re.search(r'\b(OLEO|BALDE OLEO|LITRO OLEO|TAMBOR OLEO)\b', d) and 'BOMBA' not in d and 'FLUIDO' not in d and 'FILTRO' not in d: return 'Óleo Lubrificante'
    if re.search(r'ADITIVO|FLUIDO|SILICONE|DESENGRIPANTE|DESCARBONIZANTE|AGUA DESMINERALIZADA|ARLA', d): return 'Fluidos e Químicos'
    if 'AMORTECEDOR' in d and ('KIT' in d or 'BATENTE' in d): return 'Kit Batente de Amortecedor'
    if 'AMORTECEDOR' in d: return 'Amortecedores'
    pref = [('KAP', 'Kit Batente de Amortecedor'), ('KAC', 'Kit Batente de Amortecedor'), ('PIV', 'Pivô de Suspensão'),
            ('BAN95', 'Suporte Tensor (Morcego)'), ('BAN', 'Bandejas de Suspensão'), ('BOR', 'Bucha da Barra Estabilizadora'),
            ('BIE', 'Bieletas'), ('TAX', 'Terminal Axial'), ('TER', 'Terminais de Direção'), ('CXD', 'Caixa de Direção'),
            ('BAR15', 'Caixa de Direção'), ('JUH', 'Junta Homocinética'), ('KHC', 'Kit Reparo da Junta Homocinética'),
            ('CRU', 'Cruzetas'), ('TRI', 'Trizetas'), ('SEH', 'Semi-Eixo Homocinético'), ('EMB', 'Embreagem Remanufaturada'),
            ('SCE', 'Servo e Cilindro de Embreagem'), ('PAF', 'Pastilha de Freio'), ('SFR', 'Sapata de Freio'),
            ('CIL', 'Cilindro de Roda'), ('ABS', 'Sensor ABS'), ('BDA', "Bomba D'Água"), ('BOL', 'Bomba de Óleo'),
            ('BCE', 'Bomba de Combustível'), ('KCD', 'Kit de Distribuição'), ('POL', 'Polias e Tensionadores'),
            ('TEN', 'Polias e Tensionadores'), ('LAM', 'Lâmpadas'), ('ELE', 'Eletroventiladores'), ('VEL', 'Velas de Ignição'),
            ('CV', 'Cabo de Vela'), ('CUB', 'Cubo de Roda'), ('ROL', 'Rolamentos')]
    for p, l in pref:
        if c.startswith(p): return l
    kw = [('PASTILHA', 'Pastilha de Freio'), ('SAPATA', 'Sapata de Freio'), ('PIVO', 'Pivô de Suspensão'),
          ('BANDEJA', 'Bandejas de Suspensão'), ('BIELETA', 'Bieletas'), ('BUCHA', 'Bucha da Barra Estabilizadora'),
          ('TERMINAL AXIAL', 'Terminal Axial'), ('ARTICULACAO AXIAL', 'Terminal Axial'), ('TERMINAL', 'Terminais de Direção'),
          ('CAIXA DIRECAO', 'Caixa de Direção'), ('HOMOCINETICA', 'Junta Homocinética'), ('SEMI EIXO', 'Semi-Eixo Homocinético'),
          ('CRUZETA', 'Cruzetas'), ('TRIZETA', 'Trizetas'), ('TRIPECA', 'Trizetas'), ('EMBREAGEM', 'Servo e Cilindro de Embreagem'),
          ('CILINDRO RODA', 'Cilindro de Roda'), ('SENSOR FREIO', 'Sensor ABS'), ('ABS', 'Sensor ABS'),
          ('ELETROVENTILADOR', 'Eletroventiladores'), ('BOMBA AGUA', "Bomba D'Água"), ('BOMBA OLEO', 'Bomba de Óleo'),
          ('BOMBA COMBUST', 'Bomba de Combustível'), ('KIT TENSOR', 'Kit de Distribuição'), ('POLIA', 'Polias e Tensionadores'),
          ('TENSIONADOR', 'Polias e Tensionadores'), ('LAMPADA', 'Lâmpadas'), ('VELA', 'Velas de Ignição'), ('CABO', 'Cabo de Vela'),
          ('CUBO', 'Cubo de Roda'), ('ROLAMENTO', 'Rolamentos')]
    for k, l in kw:
        if k in d: return l
    return None


def familia_of(line, desc):
    m = META.get(line)
    if m is None: return 'OUTROS'
    if m['familia']: return m['familia']
    d = U(desc)
    if line == 'Filtros':
        if 'CONDICIONADO' in d or 'CABINE' in d: return 'FILTROS DE CABINE'
        if 'AR' in d.split() or 'FILTRO AR' in d: return 'FILTROS DE AR'
        if 'OLEO' in d: return 'FILTROS DE ÓLEO'
        if 'COMBUST' in d or 'SEDIMENTADOR' in d or 'SEPARADOR' in d: return 'FILTROS DE COMBUSTÍVEL'
        return 'OUTROS FILTROS'
    if line == 'Óleo Lubrificante':
        if 'SHIFTEASE' in d or 'ATF' in d or 'GL' in d.split() or re.search(r'\bGL[345]\b|80W|85W|75W', d): return 'ÓLEOS DE TRANSMISSÃO'
        if 'EFFITECH' in d or 'HIDRAULICO' in d: return 'ÓLEOS HIDRÁULICOS'
        return 'ÓLEOS DE MOTOR'
    if line == 'Fluidos e Químicos':
        if 'AGUA' in d: return 'ÁGUA DESMINERALIZADA'
        if 'FREIO' in d or 'DOT' in d: return 'FLUIDOS DOT'
        if 'SILICONE' in d or 'DESENGRIPANTE' in d or 'DESCARBONIZANTE' in d or 'SPRAY' in d: return 'SELANTES E SPRAYS'
        return 'ADITIVOS'
    return 'OUTROS'


HEAVY = re.compile(
    r'CAMINH|ÔNIBUS|ONIBUS|REBOQUE|CARRETA|IMPLEMENTO|SCANIA|CONSTELLATION|WORKER|DELIVERY|\bTITAN\b|ATEGO|AXOR|ACTROS|ACCELO|AROCS|STRALIS|TECTOR|CURSOR|EUROCARGO|AGRALE|INTERNATIONAL|\bF-?(?:4|1[1-9]|2\d)000\b|\bC-?1[0-9]{3}\b|\bOF-?\d{4}\b|\bOH-?\d{4}\b|\bLS-?\d{4}\b|\bLO-?\d{3,4}\b|\bL-?\d{4}\b|\bFH\d*\b|\bFM\d+\b|\bNL\d+\b|\bNH\d+\b|\bB\d{1,2}[MR]\b|\bB58\b|LINHA PESADA|\b(?:[5-9]|[1-3]\d)\.\d{3}\b'
    # T-0029: o Cargo só é o caminhão Ford (com FORD ou com o número do modelo); "Ducato Cargo", "Scudo Cargo",
    # "Expert Cargo" e "Doblò (exc. Cargo)" são vans e utilitários
    r'|\bFORD\s+(?:\d{3,4}\s+)?CARGO\b|\b\d{3,4}[A-Z]?\s?CARGO\b|\bCARGO\s*[:,]?\s*(?!(?:19|20)\d\d\b)\d{3,4}\b'
    # máquinas agrícolas e de obra
    r'|TRATOR|COLHE(?:ITA)?DEIRA|COLHEDORA|ESCAVADEIRA|CARREGADEIRA|MOTONIVELADORA|\bPATROL\b|COMPACTADOR|EMPILHADEIRA|FORWARDER'
    r'|CATERPILLAR|CLAAS|JOHN DEERE|MASSEY FERGUSON|NEW HOLLAND|\bCASE\b|VALTRA|VALMET|\bCBT\b|DYNAPAC|MULLER'
    r'|PUTZMEISTER|PUTSMEISTER|ATLAS COPCO|TEREX|KOMATSU|\bJCB\b|JACTO|SANTA MATILDE|\bSLC\b|RANDON|INGERSOLL|WORTHINGTON'
    # motores diesel pesados (pelo modelo do motor: o Troller "MWM Sprint" e "Cummins ISF" fica leve)
    r'|MOTORES?\s+(?:CUMMINS|ISBE|MWM|PERKINS|DEUTZ)|\bISBE\b|\bN?T?A?855|\bOM-?\s?(?:3\d\d|4\d\d|9\d\d)|PERKINS\s+\d{4}|MWM\s?D-?229|DEUTZ'
    # caminhões Fiat, VW, GM e MB pelo número; Volare, DAF e Iveco
    r'|\bFIAT\s+(?:FIAT\s+)?(?:1[2-9]0|ALLIS)\b|\bFNM\b|\b(?:VW|VOLKSWAGEN)\s+(?:[5-9]|[1-3]\d)[-.]?\d{3}\b'
    r'|\b(?:GM|GMC|CHEVROLET)\s+(?:[ACD]-?[4-7]0|D-?1[1-4]000|\d-\d{3})\b'
    r'|\b(?:MB|MERCEDES[- ]BENZ)\s+(?:(?:L[ABKOPS]{0,2}|O[FH]?)[-\s]?\d{3,4}|\d{4}|[6-9]\d{2})[A-Z]{0,3}\b'
    r'|VOLARE|\bDAF\b|EUROTECH|\bVERTIS\b|\bF-?[67]00\b|\bB-?1\d{3,4}\b'
    # T-0032: Volvo VM; GM A/C/D-40 a 70 numa lista de modelos ("D20 / D40 / Bonanza"); VW 6-80 e 7-90; Bobcat e Perkins
    r'|\bVM\s?\d{3}\b|\bVOLVO\s+VM\b|[/,]\s?[ACD]-?[4-7]0\b|\b[ACD]-?[4-7]0\s?[/,]|\b[5-9]-[89]0\b|BOBCAT|\bPERKINS\b')
LIGHT_BR = re.compile(r'\b(FIAT|GM|CHEVROLET|RENAULT|TOYOTA|HONDA|HYUNDAI|NISSAN|PEUGEOT|CITRO[ËE]N|JEEP|KIA|MITSUBISHI|AUDI|BMW|CHERY|JAC|SUZUKI|SEAT|DODGE|CHRYSLER|LAND ROVER|TROLLER|LIFAN|DAEWOO|ASIA)\b')
LIGHT_MODELS = re.compile(r'\b(GOL|SAVEIRO|VOYAGE|FOX|POLO|UP|PARATI|GOLF|JETTA|PASSAT|AMAROK|KOMBI|FUSCA|SPACEFOX|CROSSFOX|VIRTUS|NIVUS|T-CROSS|TIGUAN|FIESTA|KA|ECOSPORT|FOCUS|RANGER|COURIER|ESCORT|FUSION|SPRINTER|CLASSE|A160|A190|C180|DAILY)\b')
MOTO = re.compile(r'MOTOCICLETA|\bMOTO\b|\b4T\b|JASO MA|\bCG\s?\d{3}|\bTITAN (?:1[2-6]0|125)\b|\bBIZ\b|\bBROS\b|\bYBR\b|\bFAZER\b|\bXRE\b|\bNXR\b|\bPOP \d{3}')


def linha_of(line, desc, app, their_cat=''):
    d = str(desc).upper(); a = str(app or '').upper(); t = d + ' ' + a
    light = bool(LIGHT_BR.search(a) or LIGHT_MODELS.search(a))
    if line in ('Fluidos e Químicos', 'Cintas e Catracas'): return 'UNIVERSAL'
    if line == 'Pneus e Câmaras de Ar Moto' or MOTO.search(d) or (MOTO.search(a) and not light): return 'MOTO'
    if line in ('Fluidos e Químicos', 'Cintas e Catracas'): return 'UNIVERSAL'
    if line in ('Cuíca de Freio', 'Catraca de Freio', 'Servo e Cilindro de Embreagem', 'Rodas de Aço e Alumínio'): return 'PESADA'
    if line == 'Óleo Lubrificante': return 'UNIVERSAL'
    if line == 'Baterias':
        m = re.search(r'(\d{2,3})\s*(AMPERES|AH|AMP)', d) or re.search(r'BATERIA (?:BAP )?(\d{2,3})', d)
        return 'PESADA' if m and int(m.group(1)) >= 100 else 'LEVE'
    if line == 'Lâmpadas':
        return 'PESADA' if '24V' in t.replace(' ', '') else 'LEVE'
    if their_cat == 'LINHA PESADA': return 'PESADA'
    h, l = bool(HEAVY.search(a)), light
    if h and not l: return 'PESADA'
    if h and l: return 'LEVE E PESADA'
    return 'LEVE'


# nome de linha da BAP (ProActive, Shiftease, Effitech): a grafia da apresentação de Lubrificantes (MC-0017 b), uma tabela
# só para o Portfólio e os treinamentos (T-0032, RD-0554)
LINHA_BAP = {'EFFITECH': 'Effitech', 'PROACTIVE': 'ProActive', 'SHIFTEASE': 'Shiftease'}
_LINHA_BAP_RX = re.compile(r'\b(' + '|'.join(LINHA_BAP) + r')\b', re.I)


def grafia_bap(t):
    return _LINHA_BAP_RX.sub(lambda w: LINHA_BAP[w.group(1).upper()], t)
