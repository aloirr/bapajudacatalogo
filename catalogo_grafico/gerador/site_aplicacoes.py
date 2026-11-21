"""Aplicações tiradas do catálogo online da BAP (catalogobap.catalogofraga.com.br), 12/11/2026.

Uso: itens do catálogo SEM aplicação (49 filtros) recebem a aplicação e a referência cruzada (Tecfil) do site.
Fonte: entradas/aplicacoes_site_bap.json  {código: [ref cruzada, "MONTADORA§Modelo motor · anos · ...¦MONTADORA§..."]}
O site traz a aplicação detalhada (montadora, veículo, versão, motor, anos). Aqui ela vem resumida por
montadora + veículo + motor (cilindrada e válvulas), com o primeiro e o último ano. Fim 2026 no site = "em Diante".
"""
import json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
ARQS = [os.path.join(AQUI, 'entradas', n) for n in ('aplicacoes_site_bap.json',      # 49 filtros (12/11)
                                                    'aplicacoes_site_bap_2.json')]   # 70 itens de outras linhas (12/11): [ref, aplicação, título no site]
NAO = {'até', 'em'}


def _tok(w):
    if w in NAO: return w
    if re.search(r'\d', w) or len(re.sub(r'[^A-Za-zÀ-ú]', '', w)) <= 3: return w.upper()
    return w[:1].upper() + w[1:].lower()


def _modelo(t):
    """'Hb20 S 1.0 L 12V · 2012 até 2023' -> 'HB20 S 1.0 L 12V · 2012 até 2023' (só o nome do modelo muda)"""
    m = re.match(r'^(.*?)(\s\d+(?:\.\d+)?\sL\b.*)$', t)
    nome, resto = (m.group(1), m.group(2)) if m else (t, '')
    if ' · ' in nome and not resto: nome, resto = nome.split(' · ', 1)[0], ' · ' + nome.split(' · ', 1)[1]
    nome = ' '.join('-'.join(_tok(p) for p in w.split('-')) for w in nome.split(' '))
    return nome + resto


def carregar():
    d = {}
    for arq in ARQS:
        if os.path.exists(arq):
            with open(arq, encoding='utf-8') as f:
                d.update(json.load(f))
    out = {}
    for c, v in d.items():
        ref, apl = v[0], v[1]
        segs = []
        for bloco in apl.split('¦'):
            if '§' not in bloco: continue
            marca, txt = bloco.split('§', 1)
            # junta "Modelo motor · anos" em itens e normaliza o nome do modelo
            partes = txt.split(' · ')
            itens, k = [], 0
            while k < len(partes):
                if k + 1 < len(partes) and re.match(r'^\d{4}', partes[k + 1]):
                    itens.append(_modelo(partes[k]) + ' · ' + partes[k + 1]); k += 2
                else:
                    itens.append(_modelo(partes[k])); k += 1
            segs += [[marca, True], [' ' + ' · '.join(itens) + ' · ', False]]
        if segs: segs[-1][0] = segs[-1][0].rstrip(' ·') + ' '
        out[c.upper()] = dict(segs=segs, ref=ref or '', titulo=v[2] if len(v) > 2 else '')
    return out


def _ref_fmt(ref):
    # "TECFIL PSL56 / MAGNETI MARELLI 9865" -> "Tecfil PSL56 · Magneti Marelli 9865" (mesmo padrão do catálogo)
    out = []
    for x in ref.split(' / '):
        x = x.strip()
        if not x: continue
        marca, cod = x.rsplit(' ', 1) if ' ' in x else ('', x)
        marca = marca.title() if len(marca) > 4 else marca.upper()
        out.append((marca + ' ' + cod).strip())
    return ' · '.join(out[:6])


LOG = {}


def aplicar(fams):
    """preenche aplicação e referência cruzada dos itens sem aplicação; devolve os códigos preenchidos"""
    S = carregar()
    feitos = []
    for f in fams:
        if f.get('spec'): continue
        for r in f['rows']:
            s = S.get(r['code'].strip().upper())
            if not s or (r.get('segs') and not r.get('sem_estoque')): continue   # item sem estoque vem da base: o site vale
            r['_refs_antes'] = '' if r.get('sem_estoque') else (r.get('refs') or '')
            r['segs'] = [list(x) for x in s['segs']]
            if s['ref'] and (r.get('sem_estoque') or not r.get('refs') or r['refs'].strip() in ('—', '-', '')):
                r['refs'] = _ref_fmt(s['ref'])
            r['_fonte_apl'] = 'site'
            feitos.append(r['code'])
    LOG['preenchidos'] = feitos
    return feitos


if __name__ == '__main__':
    S = carregar()
    print(len(S))
    for c in ('FLU6001', 'FLU6021', 'FLU6240'):
        print(c, S[c]['ref'], S[c]['segs'][:4])
