"""Complementos do catálogo online Fraga (catalogobap.catalogofraga.com.br) aprovados pelo Alexandre em 13/11/2026:
  - referência cruzada do Fraga que não está no catálogo: acrescentada no fim, sem tirar nenhuma;
  - veículos do Fraga que o catálogo não cita (item com pelo menos 1 veículo em comum): acrescentados no fim da aplicação;
  - item sem aplicação: recebe a do Fraga (nenhum caso em 13/11: os 31 sem aplicação não estão no Fraga);
  - o resto (anos diferentes, veículo só no catálogo, texto atual) não muda.
Fonte: entradas/complementos_fraga_13112026.json (gerado por aud/complementos.py a partir da conferência de 13/11).
Formato da aplicação igual ao de 12/11 (site_aplicacoes): montadora em negrito + "Veículo motor · anos".
No A4 (print_cat) a aplicação fica a de antes: o impresso já corta a aplicação e mostra 2 referências; com o complemento
28 itens sairiam das tabelas. [SUPOSIÇÃO]
Guarda a aplicação de antes em r['_segs_antes_fraga']: o diferencial.py (auditoria) usa essa, não a do Fraga.
"""
import json, os, re
import datas
import site_aplicacoes as _S

ARQ = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'entradas', 'complementos_fraga_13112026.json')
LOG = {'apl': [], 'ref': [], 'nova': []}


def segs_de(apl):
    segs = []
    for bloco in apl.split('¦'):
        if '§' not in bloco: continue
        marca, txt = bloco.split('§', 1)
        partes, itens, k = txt.split(' · '), [], 0
        while k < len(partes):
            if k + 1 < len(partes) and re.match(r'^\d{4}', partes[k + 1]):
                itens.append(_S._modelo(partes[k]) + ' · ' + partes[k + 1]); k += 2
            else:
                itens.append(_S._modelo(partes[k])); k += 1
        segs += [[marca, True], [' ' + ' · '.join(itens) + ' · ', False]]
    if segs: segs[-1][0] = segs[-1][0].rstrip(' ·') + ' '
    return segs


def _norm(s):
    """texto para comparar: as datas como no PDF (datas.para_pdf: "1993-1995" e "1993>1995" = "1993–1995", "2015 em Diante"
    = "2015+"), sem acento, maiúsculo, só palavras, números e "+", sem o "DE" antes do ano ("DE 1999–2002" = "1999–2002")
    e sem o "até" entre dois anos ("1993 até 1995" = "1993–1995"). O "até" sem ano antes (">1994" e "até 1995") fica como
    o marcador "ATE": "Gol >1994" e "Gol até 1995" não são "Gol 1994" e "Gol 1995" (T-0019)."""
    import unicodedata
    s = datas.para_pdf(s)
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').upper()
    t = re.findall(r'[A-Z0-9]+|\+|>', s)
    eano = lambda k: 0 <= k < len(t) and re.fullmatch(datas.Y, t[k])
    t = ['ATE' if x == '>' else x for k, x in enumerate(t) if x != '>' or eano(k + 1)]   # ">1994" = "até 1994"
    t = [x for k, x in enumerate(t)
         if not (eano(k + 1) and (x == 'DE' or (x == 'ATE' and eano(k - 1))))]
    return ' ' + ' '.join(t) + ' '


_ANO = re.compile(r'(?<!\d)' + datas.Y + r'(?!\d)')
_SEP = re.compile(r'((?:\s*[·;\n]\s*)+)')


def aplicacao_unica(segs):
    """cada veículo uma vez na aplicação, na ordem do 1º (RD-0222, R-20261120-195900-alexandre: "cada aplicação aparece
    UMA vez só"): a base já traz o texto do Fraga em 109 itens, e às vezes repete o veículo nela mesma (FSE6167).
    Veículo = os trechos entre "·", ";" ou quebra de linha até o que tem o ano ("Fiorino 1.0 L 8V · 1993 até 1995",
    "LS 1632 10.0 L 10V - DE 1999–2002"); o que sobra no fim do trecho vai com o último ("S10 ... 2012>20 · Dupla").
    Compara pela montadora (a última em negrito, com o BR_SHORT) e pelo _norm do texto. Trecho sem ano e trecho só com
    o ano ficam sempre. Montadora que fica sem veículo sai junto."""
    import montar as _M
    vistos, out, marca, mudou = set(), [], '', False
    for t, b in segs:
        if b: marca = _M.BR_SHORT.get(t.strip().upper(), t.strip().upper())
        if b or not t.strip(' ·;\n'):
            if not b and out and not out[-1][1] and out[-1][0].rstrip().endswith('·'): continue   # um separador só
            out.append([t, b]); continue
        p = _SEP.split(t)                    # texto, separador, texto, ..., texto
        txt = p[0::2]
        ents, ent = [], []
        for k, x in enumerate(txt):
            if not x.strip(): continue
            ent.append(k)
            if _ANO.search(x): ents.append(ent); ent = []
        if ent and ents: ents[-1] += ent   # o que sobra no fim é do último ("S10 ... 2012>20 · Dupla")
        tira = set()
        for ent in ents:
            ch = _norm(' '.join(txt[i] for i in ent))
            if any(not re.fullmatch(datas.Y + r'|\+|ATE', w) for w in ch.split()):   # só o ano (ou "até 2008"): fica
                if (marca, ch) in vistos: tira.update(ent)
                vistos.add((marca, ch))
        if not tira:
            out.append([t, b]); continue
        mudou = True
        # sai o veículo repetido e o separador depois de cada trecho dele
        novo = ''.join(x for k, x in enumerate(p) if k // 2 not in tira)
        if t[:1].isspace() and not novo[:1].isspace(): novo = ' ' + novo
        if not novo.strip(' ·;\n'):
            if out and out[-1][1]: out.pop()     # montadora sem veículo
            if not out or out[-1][0].rstrip().endswith('·'): continue
            novo = ' · '
        out.append([novo, b])
    if not mudou: return segs
    while out and not out[-1][1] and not out[-1][0].strip(' ·;\n'): out.pop()
    if out and not out[-1][1]: out[-1][0] = out[-1][0].rstrip(' ·;\n') + ' '
    return out


DUAS = ('MAGNETI MARELLI', 'KIT & CIA', 'ORIGINAL OEM', 'LS AUTOMOTIVE')


def ref_fmt(p):
    """'GRAZZIMETAL FO 3168GG' -> 'Grazzimetal FO 3168GG' ; 'MAGNETI MARELLI 9865' -> 'Magneti Marelli 9865'"""
    p = re.sub(r'\s+', ' ', p.strip())
    marca = next((d for d in DUAS if p.upper().startswith(d + ' ')), p.split(' ')[0])
    cod = p[len(marca):].strip()
    m = ' '.join(w.title() if len(w) > 4 else w.upper() for w in marca.split(' '))
    return (m + ' ' + cod).strip()


def carregar():
    if not os.path.exists(ARQ): return {}
    return {c.upper(): v for c, v in json.load(open(ARQ, encoding='utf-8')).items()}


def aplicar(fams, filtro_moto=None):
    J = carregar()
    vistos = set()
    for f in fams:
        if f.get('spec'): continue
        for r in f['rows']:
            v = J.get(r['code'].strip().upper())
            if not v or id(r) in vistos: continue
            vistos.add(id(r))
            add = None
            if v.get('apl'):
                add = segs_de(v['apl'])
                if f.get('moto') and filtro_moto:
                    add2 = filtro_moto(add)
                    add = None if add2 is add else add2          # na Linha Moto só entra veículo de moto
            if v.get('apl') and add:
                txt = ''.join(t for t, b in (r.get('segs') or [])).strip()
                if v.get('tipo') == 'nova' or not txt:
                    r['segs'] = add; LOG['nova'].append(r['code'])
                else:
                    r['_segs_antes_fraga'] = [list(x) for x in r['segs']]
                    base = [list(x) for x in r['segs']]
                    base[-1][0] = base[-1][0].rstrip(' ·;,') + ' '
                    r['segs'] = base + [['· ', False]] + add
                    LOG['apl'].append(r['code'])
                r['_fonte_compl'] = 'fraga'
            if v.get('refs'):
                atual = (r.get('refs') or '').strip()
                novas = ' · '.join(ref_fmt(x) for x in v['refs'])
                r['_refs_antes_fraga'] = atual
                r['refs'] = novas if atual in ('', '—', '-') else atual.rstrip(' ·,') + ' · ' + novas
                LOG['ref'].append(r['code'])
    # no fim, em todos os itens dos 3 PDFs: cada veículo uma vez na aplicação (aplicacao_unica, RD-0222); a regra do
    # site nas referências que vieram escritas (o Fraga e o site de 12/11 trazem AUTOIMPACT, fornecedor;
    # montar.refs_pela_regra) e cada referência uma vez, na ordem da 1ª (o Fraga repete as do catálogo; a base às vezes
    # também; RD-0194)
    import montar as _M
    LOG['fora'], LOG['repetidas'], LOG['apl_repetida'], feitos = [], [], [], set()
    n = lambda s: len(s.split(' · ')) if s else 0
    for f in fams:
        for r in f['rows']:
            if id(r) in feitos: continue
            feitos.add(id(r)); antes = r.get('refs') or ''
            regra = _M.refs_pela_regra(antes); r['refs'] = _M.refs_unicas(regra)
            if regra != antes: LOG['fora'].append((r['code'], n(antes) - n(regra)))
            if r['refs'] != regra: LOG['repetidas'].append((r['code'], n(regra) - n(r['refs'])))
            for k in ('segs', '_segs_antes_fraga'):          # o A4 usa a de antes do Fraga (print_cat)
                if r.get(k):
                    u = aplicacao_unica(r[k])
                    if u != r[k]: r[k] = u; LOG['apl_repetida'].append((r['code'], k))
    return LOG
