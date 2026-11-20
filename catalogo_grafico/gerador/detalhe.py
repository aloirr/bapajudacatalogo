"""Texto da coluna DETALHE/POSIÇÃO: completo (nunca com "…") e enxuto.

1. Se o texto veio cortado ("…" herdado do PDF antigo), usa a descrição completa
   da base unificada.
2. Tira do começo as palavras que repetem o nome da linha
   (ex.: "Bandeja suspensão" na página Bandejas de Suspensão).
3. Abrevia termos comuns (esq., dir., compl., c/, hidr., diant., tras.).
"""
import re, os, unicodedata
import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))


def _n(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c) != 'Mn')


_DESC = None


def _desc():
    global _DESC
    if _DESC is None:
        _DESC = {}
        try:   # descrição da base unificada (dados/, no Git); o arquivo de estoque saiu (T-0019, 20/11)
            b = pd.read_excel(os.path.join(AQUI, '..', '..', 'dados', 'BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx'), 'PRODUTOS', dtype=str, usecols=['CODIGO_BAP', 'DESCRICAO'])
            _DESC.update({c: d for c, d in zip(b.CODIGO_BAP, b.DESCRICAO) if isinstance(d, str) and d.strip()})
        except Exception:
            pass
        for fn in ('BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx', 'BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx'):
            try:
                b = pd.read_excel(os.path.join(AQUI, 'entradas', fn), 'PRODUTOS', dtype=str, usecols=['CODIGO_BAP', 'DESCRICAO'])
                for c, d in zip(b.CODIGO_BAP, b.DESCRICAO):
                    _DESC.setdefault(c, d)
            except Exception:
                pass
    return _DESC


# forma curta (palavra sem acento, minúscula -> abreviação)
ABREV = {
    'esquerdo': 'esq.', 'esquerda': 'esq.', 'esq': 'esq.', 'direito': 'dir.', 'direita': 'dir.',
    'completo': 'compl.', 'completa': 'compl.', 'compl': 'compl.', 'com': 'c/', 'sem': 's/', 'para': 'p/',
    'suspensao': 'susp.', 'hidraulico': 'hidr.', 'hidraulica': 'hidr.', 'hidr': 'hidr.',
    'mecanico': 'mec.', 'mecanica': 'mec.', 'eletrico': 'elétr.', 'eletrica': 'elétr.',
    'dianteiro': 'diant.', 'dianteira': 'diant.', 'traseiro': 'tras.', 'traseira': 'tras.',
    'danteiro': 'diant.', 'inferior': 'inf.', 'automatico': 'autom.', 'automatica': 'autom.', 'auxiliar': 'aux.', 'superior': 'sup.', 'remanufaturado': 'reman.', 'remanufaturada': 'reman.',
}
# acento que falta no texto do cadastro (só troca palavra sem acento)
ACENTO = {
    'pivo': 'pivô', 'direcao': 'direção', 'cambio': 'câmbio', 'homocinetica': 'homocinética',
    'homocinetico': 'homocinético', 'lampada': 'lâmpada', 'agua': 'água', 'dagua': "d'água", 'oleo': 'óleo',
    'camara': 'câmara', 'servico': 'serviço', 'valvula': 'válvula', 'termostatica': 'termostática',
    'automatico': 'automático', 'pneumatico': 'pneumático', 'combustivel': 'combustível', 'conico': 'cônico',
    'conicos': 'cônicos', 'rigido': 'rígido', 'platô': 'platô', 'plato': 'platô', 'tripeca': 'tripeça',
    'desecontrado': 'descentrado', 'resistencia': 'resistência', 'planetaria': 'planetária', 'halogena': 'halógena',
    'ambar': 'âmbar', 'automatic': 'automático', 'pinhao': 'pinhão', 'substituido': 'substituído', 'estrias': 'estrias',
}
STOP = {'de', 'da', 'do', 'das', 'dos', 'd'}
# palavras do começo que repetem a linha; quando a linha tem 2 produtos, só o que não distingue
STEMS = {
    'Terminal Axial': ['articulacao', 'axial', 'braco'],
    'Caixa de Direção': ['mecanismo', 'caixa', 'direcao'],
    'Terminais de Direção': ['terminal', 'ponteira'],
    'Junta Homocinética': ['junta', 'homocinetica', 'homocinetico'],
    'Kit Reparo da Junta Homocinética': ['kit', 'reparo', 'junta', 'homocinetica', 'homocinetico'],
    'Semi-Eixo Homocinético': ['semi', 'semieixo', 'eixo', 'homocinetico', 'homocinetica'],
    'Palhetas Limpa-Parabrisa': ['palheta', 'limpador', 'limpa', 'parabrisa', 'para-brisa'],
    'Embreagem Remanufaturada': ['embreagem', 'kit', 'remanufaturada', 'reman'],
    'Suporte Tensor (Morcego)': ['suporte', 'barra', 'tensora', 'tensor'],
    'Pivô de Suspensão': ['pivo', 'suspensao'],
    'Bandejas de Suspensão': ['bandeja', 'suspensao'],
    'Lâmpadas': ['lampada', 'automotiva'],
    'Servo e Cilindro de Embreagem': [],
    'Polias e Tensionadores': [],
    'Interruptores e Sensores Elétricos': [],
    'Interruptores de Pressão do Óleo': ['interruptor'],
    'Cuíca de Freio': ['camara', 'cuica', 'freio'],
    'Kit de Distribuição': ['kit', 'tensor'],
    'Pneus e Câmaras de Ar Moto': [],
    'Linha Moto': [],
}


def _key(t):
    t = _n(t).strip('.,;:()')
    t = re.sub(r"^d'", '', t)
    return t


def _stems(name):
    if name in STEMS:
        return {_key(w) for w in STEMS[name]}
    return {_key(w) for w in re.findall(r"[\wÀ-ú'-]+", name) if len(w) >= 4}


def _sing(w):
    return w[:-2] if w.endswith('es') and len(w) > 5 else w[:-1] if w.endswith('s') else w


def _in(k, st):
    return k in st or _sing(k) in {_sing(x) for x in st}


def _tail(code, s):
    """texto cortado em '…': mantém o começo (com acento) e completa com o cadastro"""
    base = s.rstrip('.… ').strip()
    toks = base.split()
    d = _desc().get(code)
    if not (d and isinstance(d, str)):
        return ' '.join(toks)
    db = [t for t in re.split(r'\s+', d.replace('/', '/ ').strip()) if t and t not in ('*',)]
    dbk = [_key(t) for t in db]
    pos = -1
    for t in toks:
        k = _key(t)
        for j in range(pos + 1, len(dbk)):
            if dbk[j] == k or (len(k) >= 4 and dbk[j].startswith(k[:4])):
                pos = j; break
    rest = db[pos + 1:] if pos >= 0 else []
    rest2 = []
    for t in rest:
        if any(ch.isdigit() for ch in t) or (t.isupper() and len(t) <= 3 and t.isalpha() and _key(t) not in ABREV and _key(t) not in STOP):
            rest2.append(t)
        else:
            rest2.append(t.lower())
    out = ' '.join(toks + rest2)
    out = out.replace('/ ', '/').replace('( ', '(').replace(' )', ')')
    return out


def compacto(name, code, sub):
    s = str(sub or '').strip()
    if not s:
        return s
    if s.endswith('…') or s.endswith('...'):
        s = _tail(code, s)
    s = re.sub(r'(?i)servi[cç]o\s*/\s*estacionamento(\s+estacionamento)?', 'serv./estac.', s)
    s = re.sub(r'(?i)\b([cs])/(?=\w)', r'\1/ ', s)
    toks = s.split()
    st = _stems(name)
    i = 0
    while i < len(toks) and (_in(_key(toks[i]), st) or _key(toks[i]) in STOP):
        i += 1
    if i == len(toks):
        return '—'
    toks = toks[i:]
    out = []
    for k, t in enumerate(toks):
        nt = _key(t)
        if nt == 'sistema' and k + 1 < len(toks) and _key(toks[k + 1]).startswith('eletric'):
            continue
        m = re.match(r'^([(\[]*)(.*?)([)\],;:]*)$', t)
        pre, core, suf = m.group(1), m.group(2), m.group(3)
        if nt in ABREV:
            out.append(pre + ABREV[nt] + suf); continue
        if nt in ACENTO and _n(core) == core.lower() and ACENTO[nt] != core.lower():
            a = ACENTO[nt]
            out.append(pre + (a[:1].upper() + a[1:] if core[:1].isupper() else a) + suf); continue
        out.append(t)
    ded = []
    for t in out:
        if ded and (_key(t) == _key(ded[-1]) or _key(ded[-1]).endswith('/' + _key(t))):
            continue
        ded.append(t)
    r = re.sub(r'\s+', ' ', ' '.join(ded)).strip()
    if r.count('(') > r.count(')'):
        r += ')'

    r = r.replace('( ', '(').replace(' )', ')')
    return r[:1].upper() + r[1:] if r else '—'


def aplicar(fams):
    """troca r['sub'] em todas as linhas (impresso e digital usam a mesma lista)"""
    n = 0
    for f in fams:
        for r in f['rows']:
            if r.get('sub'):
                novo = compacto(f['name'], r['code'], r['sub'])
                if novo != r['sub']:
                    r['sub_orig'] = r['sub']; r['sub'] = novo; n += 1
    return n


def limpar_datas(fams):
    """aplicação com 'em diante' quebrado na origem: 'de 2020 em · Diante', '2015 Emm Diante'"""
    n = 0
    for f in fams:
        for r in f['rows']:
            for sg in r.get('segs') or []:
                t0 = sg[0]
                t = re.sub(r'(?i)\b(\d{4})\s+em+\s*·\s*diante', r'\1 em Diante', t0)
                t = re.sub(r'(?i)\bde\s+(\d{4})\s+em+\s+diante', r'\1 em Diante', t)
                t = re.sub(r'(?i)\b(\d{4})\s+emm\s+diante', r'\1 em Diante', t)
                if t != t0:
                    sg[0] = t; n += 1
    return n


def preencher_aplicacao(fams):
    """item sem aplicação no catálogo, mas com aplicação na base: usa a da base (fica igual ao BAP Ajuda)"""
    n = 0
    base = {}
    for fn in ('BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx',):
        try:
            b = pd.read_excel(os.path.join(AQUI, 'entradas', fn), 'PRODUTOS', dtype=str, usecols=['CODIGO_BAP', 'APLICACAO'])
            base.update({str(c).strip().upper(): str(a).strip() for c, a in zip(b.CODIGO_BAP, b.APLICACAO)
                         if isinstance(a, str) and a.strip() and 'R$' not in a})   # preço nunca entra (v8 do TER556556: 'R$ 103.88+ Detalhes')
        except Exception:
            pass
    for f in fams:
        if f.get('spec'):
            continue
        for r in f['rows']:
            if not r.get('segs') and base.get(r['code'].strip().upper()):
                r['segs'] = [[base[r['code'].strip().upper()], False]]; n += 1
    return n


# ---------------------------------------------------------------- informação essencial da descrição (auditoria 23/10)
_BASE10 = None


def _base10():
    global _BASE10
    if _BASE10 is None:
        _BASE10 = {}
        for fn in ('saidas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx', 'entradas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx',
                   '../../dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v10.xlsx'):   # a v10 está no Git em dados/versoes
            p = os.path.join(AQUI, fn)
            if os.path.exists(p):
                b = pd.read_excel(p, 'PRODUTOS', dtype=str).fillna('')
                _BASE10 = {c.strip().upper(): r for c, r in zip(b.CODIGO_BAP, b.to_dict('records'))}
                break
    return _BASE10


def _txt(code):
    c = code.strip().upper()
    b = _base10().get(c, {})
    return _n(' · '.join([b.get('DESCRICAO', ''), str(_desc().get(code) or '')])).upper()


# (linha, regex no texto sem acento, rótulo) — só entra se o DETALHE ainda não diz isso
ESSENCIAL = [
    ('Sapata de Freio', r'\b(?:C/|COM)\s*HASTE', 'c/ haste'),
    ('Sapata de Freio', r'\b(?:S/|SEM)\s*HASTE', 's/ haste'),
    ('Kit Batente de Amortecedor', r'\bPARCIAL\b', 'Kit parcial'),
    ('Kit Batente de Amortecedor', r'\bCOMPLETO\b', 'Kit completo'),
    ('Kit Batente de Amortecedor', r'\b(?:C/|COM)\s*CANECA', 'c/ caneca'),
    ('Kit Batente de Amortecedor', r'\b(?:S/|SEM)\s*CANECA', 's/ caneca'),
    ('Amortecedores', r'\bPRESSURIZADO\b', 'Gás'),
    ('Amortecedores', r'\bCAMBIO\s*MANUAL|\bTRANSMISSAO\s*MANUAL', 'câmbio manual'),
    ('Amortecedores', r'\bCAMBIO\s*AUT|\bTRANSMISSAO\s*AUT', 'câmbio aut.'),
    ('Amortecedores', r'\b4\s*X\s*4\b', '4x4'),
    ('Amortecedores', r'\bEXCETO\s+POWER\s+SHOCK', 'exc. Power Shock'),
    ('Catraca de Freio', r'\bAUTOMATIC', 'Automática'),
    ('Catraca de Freio', r'\bMANUAL', 'Manual'),
    ('Catraca de Freio', r'\b(\d{2})\s*E\b', r'\1 estrias'),
    ('Catraca de Freio', r'\b(\d)\s*F\b', r'\1F'),
    ('Catraca de Freio', r'\bCH\s*(\d{2})\b', r'CH\1'),
    ('Bucha da Barra Estabilizadora', r'\b(\d{2})\s*MM\b', r'\1 mm'),
    ('Bucha da Barra Estabilizadora', r'\bTIRANTE\b', 'tirante'),
    ('Bucha da Barra Estabilizadora', r'\b(?:C/|COM)\s*PARAFUSO', 'c/ parafuso'),
    ('Polias e Tensionadores', r'\b(?:C/|COM)\s*PARAFUSO', 'c/ parafuso'),
    ('Rolamentos', r'\bINTERNO\b', 'interno'),
    ('Rolamentos', r'\bEXTERNO\b', 'externo'),
    ('Rolamentos', r'\bROLOS\s*CONICOS\b', 'rolos cônicos'),
    ('Rolamentos', r'\bRIGIDO\s*DE\s*ESFERAS?\b', 'rígido de esferas'),
    ('Embreagem Remanufaturada', r'\bPLATO\b.*\bDISCO\b.*\bMANCAL\b', 'c/ platô, disco, rol. e mancal'),
    ('Embreagem Remanufaturada', r'\bPLATO\b.*\bDISCO\b(?!.*MANCAL)', 'c/ platô e disco'),
    ('Pneus e Câmaras de Ar Moto', r'\b(\d)\s*PR\b', r'\1PR'),
]
ESS_RX = [(l, re.compile(p), r) for l, p, r in ESSENCIAL]
ESS_LOG = []


def essencial(fams):
    """acrescenta ao DETALHE o que a descrição tem de essencial e o catálogo não mostrava"""
    n = 0
    for f in fams:
        regras = [(rx, rot) for l, rx, rot in ESS_RX if l == f['name']]
        if not regras:
            continue
        for r in f['rows']:
            t = _txt(r['code'])
            sub = r.get('sub') or ''
            if sub in ('—', '-'): sub = ''
            ns = _n(sub)
            add = []
            for rx, rot in regras:
                m = rx.search(t)
                if not m: continue
                lab = m.expand(rot) if '\\' in rot else rot
                k = _n(lab).replace('.', '').strip()
                if k in ns.replace('.', '') or (k == 'gas' and ('gas' in ns or 'oleo' in ns)): continue
                if lab not in add: add.append(lab)
            if add:
                novo = (sub + ' · ' if sub else '') + ' · '.join(add)
                novo = novo[:1].upper() + novo[1:]
                ESS_LOG.append((f['name'], r['code'], sub, novo))
                r['sub'] = novo; n += 1
    return n
