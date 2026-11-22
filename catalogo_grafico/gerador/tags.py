"""Tags curtas embaixo do código (DIANT., TRAS., C/ ABS, 4X4...), sem repetir; o que não vira tag fica como texto curto."""
import re
import unicodedata

_n = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower()

# (regex sobre o texto sem acento e minúsculo, tag, linhas em que vale — None = todas). Ordem importa: o mais longo antes.
PAD = [
    (r'dire[cç][aã]o\s+hidr\.?', 'DIR. HIDR.', None), (r'dire[cç][aã]o\s+mec\.?', 'DIR. MEC.', None),
    (r'dire[cç][aã]o\s+el[eé]tr\.?', 'DIR. ELÉTR.', None), (r'dir\.\s*hidr\.?', 'DIR. HIDR.', None),
    (r'dir\.\s*mec\.?', 'DIR. MEC.', None), (r'dir\.\s*el[eé]tr\.?', 'DIR. ELÉTR.', None),
    (r'\bc/\s*abs\b', 'C/ ABS', None), (r'\bs/\s*abs\b', 'S/ ABS', None),
    (r'\bc/\s*ar\b', 'C/ AR', None), (r'\bs/\s*ar\b', 'S/ AR', None),
    (r'\bc/\s*barra\s*estab\.?', 'C/ BARRA', None), (r'\bs/\s*barra\s*estab\.?', 'S/ BARRA', None),
    (r'\bc/\s*piv[oô]', 'C/ PIVÔ', None), (r'\bs/\s*piv[oô]', 'S/ PIVÔ', None),
    (r'\bc/\s*haste', 'C/ HASTE', None), (r'\bs/\s*haste', 'S/ HASTE', None),
    (r'\bc/\s*caneca', 'C/ CANECA', None), (r'\bs/\s*caneca', 'S/ CANECA', None),
    (r'\bc/\s*rolamento', 'C/ ROLAMENTO', None), (r'\bs/\s*rolamento', 'S/ ROLAMENTO', None),
    (r'\bc/\s*sensor', 'C/ SENSOR', None), (r'\bs/\s*sensor', 'S/ SENSOR', None),
    (r'\bc/\s*defletor', 'C/ DEFLETOR', None), (r'\bs/\s*defletor', 'S/ DEFLETOR', None),
    (r'\bc/\s*parafuso', 'C/ PARAFUSO', None),
    (r'\bc/\s*camara\b', 'C/ CÂMARA', None), (r'\bs/\s*camara\b', 'S/ CÂMARA', None),
    (r'\bkit\s+parcial\b', 'PARCIAL', None), (r'\bkit\s+completo\b', 'COMPLETO', None),
    (r'c[aâ]mbio\s+manual', 'CÂMB. MANUAL', None), (r'c[aâ]mbio\s+aut(?:om)?(?:[aá]tico)?\.?', 'CÂMB. AUT.', None),
    (r'serv\./\s*estac\.', 'SERV./ESTAC.', None),
    (r'\bdiant(?:eir[oa]s?|\.)?(?![a-z])', 'DIANT.', None), (r'\btras(?:eir[oa]s?|\.)?(?![a-z])', 'TRAS.', None),
    (r'\besq(?:uerd[oa]|\.)?(?![a-z])', 'ESQ.', None), (r'\bdir(?:eit[oa]|\.)?(?![a-zçã])', 'DIR.', None),
    (r'\bsup(?:erior|\.)?(?![a-z])', 'SUP.', None), (r'\binf(?:erior|\.)?(?![a-z])', 'INF.', None),
    (r'\bcompl(?:et[oa]|\.)?(?![a-z])', 'COMPLETO', None),
    (r'\bgas\b', 'GÁS', {'Amortecedores'}), (r'\boleo\b', 'ÓLEO', {'Amortecedores'}),
    (r'\b4\s*x\s*4\b', '4X4', None), (r'\b4\s*x\s*2\b', '4X2', None), (r'\bturbo\b', 'TURBO', None),
    (r'\bdiesel\b', 'DIESEL', None), (r'\bflex\b', 'FLEX', None),
    (r'\bautomatic[ao]\b', 'AUTOMÁTICA', None), (r'\bmanual\b', 'MANUAL', None),
    (r'\bhidr\.', 'HIDR.', None), (r'\bmec\.', 'MEC.', None), (r'\beletr\.', 'ELÉTR.', None),
    (r'\b(\d{2})\s*estrias\b', r'\1 ESTRIAS', {'Catraca de Freio'}),
    (r'\b(\d{2})\s*e\b', r'\1 ESTRIAS', {'Catraca de Freio'}), (r'\bch\s?(\d{2})\b', r'CH\1', None),
    (r'\b(\d)f\b', r'\1F', {'Catraca de Freio'}), (r'\b(\d{2})\s*mm\b', r'\1 MM', {'Bucha da Barra Estabilizadora'}),
    (r'\btirante\b', 'TIRANTE', {'Bucha da Barra Estabilizadora'}),
    (r'\binterno\b', 'INTERNO', None), (r'\bexterno\b', 'EXTERNO', None),
    (r'\brolos\s+conicos\b', 'ROLOS CÔNICOS', None), (r'\brigido\s+de\s+esferas\b', 'RÍGIDO DE ESFERAS', None),
    (r'\b(\d)pr\b', r'\1PR', None), (r'\b(8|12|16)v\b', r'\1V', None),
]
PAD_RX = [(re.compile(p), t, ls) for p, t, ls in PAD]
SOBRA_INUTIL = {'', 'direcao', 'direção', 'kit', 'gas', 'oleo', '-', '·', 'e', 'p/', 'c/', 's/'}


def extrair(texto, linha):
    """(tags na ordem em que aparecem, sobra de texto)"""
    t = texto or ''
    if t.strip() in ('—', '-'): return [], ''
    low = _n(t)
    achadas = []
    mask = list(low)
    for rx, tag, ls in PAD_RX:
        if ls and linha not in ls: continue
        for m in rx.finditer(''.join(mask)):
            achadas.append((m.start(), m.expand(tag) if '\\' in tag else tag))
            for i in range(m.start(), m.end()): mask[i] = '\x00'
    tags = []
    for _, tg in sorted(achadas):
        if tg not in tags: tags.append(tg)
    sobra = ''.join(c if mask[i] != '\x00' else ' ' for i, c in enumerate(t))
    sobra = re.sub(r'\s*·\s*', ' · ', sobra)
    sobra = re.sub(r'(?:\s*·\s*)+', ' · ', sobra)
    sobra = re.sub(r'(?:\s*/\s*){2,}', ' / ', sobra)
    sobra = re.sub(r'^[\s/·,;]+|[\s/·,;]+$', '', sobra)
    sobra = re.sub(r'\s{2,}', ' ', sobra).strip(' ·,;/-–')
    sobra = re.sub(r'\(\s*\)', '', sobra).strip(' ·,;/-–')
    if _n(sobra).strip(' .') in SOBRA_INUTIL: sobra = ''
    if sobra: sobra = sobra[:1].upper() + sobra[1:]
    return tags, sobra


def do_item(fname, r, spec=False):
    """(tags, sobra)"""
    if spec:
        return [], ''
    return extrair(r.get('sub') or '', fname)


TAM = 6.2             # tamanho das tags embaixo do código (e da tag NOVO que desce, B10)


def largura(lw, t, size=TAM, pad=3):
    """largura de uma tag (texto em negrito com espaçamento e a folga dos dois lados), a mesma do Doc.tag"""
    return lw(t, size, 'PB', size * .08) + 2 * pad


def medir(lw, tags, largura_max, size=TAM, pad=3, gap=2.5, lh=10):
    """posições (linha, x) de cada tag dentro da largura; devolve lista e altura"""
    pos, x, ln = [], 0, 0
    for t in tags:
        w = largura(lw, t, size, pad)
        if x and x + w > largura_max:
            ln += 1; x = 0
        pos.append((t, x, ln, w)); x += w + gap
    return pos, (ln + 1) * lh if tags else 0


def altura(lw, tags, largura_max, size=TAM, pad=3, gap=2.5, lh=10, max_linhas=9):
    """altura que o desenhar ocupa (até max_linhas), sem desenhar"""
    return min(medir(lw, tags, largura_max, size, pad, gap, lh)[1], max_linhas * lh)


def desenhar(dc, lw, x, y, tags, largura_max, size=TAM, pad=3, gap=2.5, lh=10, max_linhas=9):
    pos, h = medir(lw, tags, largura_max, size, pad, gap, lh)
    for t, dx, ln, w in pos:
        if ln >= max_linhas: break
        cor = ('otag', 'otext') if t == 'NOVO' else ('hero', 'gtext')   # B10: a tag NOVO que desceu fica com a cor dela
        dc.tag(x + dx, y + ln * lh, t, size, *cor, pad)
    return altura(lw, tags, largura_max, size, pad, gap, lh, max_linhas)
