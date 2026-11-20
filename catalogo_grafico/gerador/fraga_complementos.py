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
    # no fim, em todos os itens dos 3 PDFs: a regra do site nas que vieram escritas (o Fraga e o site de 12/11 trazem
    # AUTOIMPACT, fornecedor; montar.refs_pela_regra) e cada referência uma vez, na ordem da 1ª (o Fraga repete as do
    # catálogo; a base às vezes também; RD-0194)
    import montar as _M
    LOG['fora'], LOG['repetidas'], feitos = [], [], set()
    n = lambda s: len(s.split(' · ')) if s else 0
    for f in fams:
        for r in f['rows']:
            if id(r) in feitos: continue
            feitos.add(id(r)); antes = r.get('refs') or ''
            regra = _M.refs_pela_regra(antes); r['refs'] = _M.refs_unicas(regra)
            if regra != antes: LOG['fora'].append((r['code'], n(antes) - n(regra)))
            if r['refs'] != regra: LOG['repetidas'].append((r['code'], n(regra) - n(r['refs'])))
    return LOG
