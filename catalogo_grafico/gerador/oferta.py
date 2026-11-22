"""OFEREÇA JUNTO em todos os itens do catálogo (pedido do Alexandre, 23/10/2026).

Para cada linha há uma lista de linhas-alvo, em ordem de preferência. O par só entra quando bate montadora,
modelo, motor (quando os dois informam) e anos — a mesma regra do cross.py — e, quando a base informa,
a mesma posição (dianteiro/traseiro) e o mesmo lado. Sem par por veículo, entra a sugestão fixa da linha
(produto universal com código, ou o tipo de peça a oferecer).
"""
import re, collections
import cross as X
import detalhe as DT
from site_regras import G as _G

ADITIVO, AGUA = 'RAD25005P', 'RAD25009P'
DOT3, DOT4 = 'FLU15001', 'FLU15002'

# linha -> (alvos por veículo, sugestão fixa quando não acha par)
REGRAS = {
    'Amortecedores': (['Kit Batente de Amortecedor'], 'Kit batente (mesma pos.)'),
    'Kit Batente de Amortecedor': (['Amortecedores'], 'Amortecedor (mesma pos.)'),
    'Pivô de Suspensão': (['Terminais de Direção', 'Bandejas de Suspensão'], 'Terminal de direção'),
    'Bandejas de Suspensão': (['Pivô de Suspensão', 'Bieletas', 'Bucha da Barra Estabilizadora'], 'Bieletas e buchas'),
    'Suporte Tensor (Morcego)': (['Bandejas de Suspensão', 'Pivô de Suspensão'], 'Bandeja de suspensão'),
    'Bucha da Barra Estabilizadora': (['Bieletas'], 'Bieletas da barra'),
    'Bieletas': (['Bucha da Barra Estabilizadora', 'Amortecedores'], 'Buchas da barra estabilizadora'),
    'Terminais de Direção': (['Terminal Axial'], 'Axial do mesmo lado'),
    'Terminal Axial': (['Terminais de Direção'], 'Terminal do mesmo lado'),
    'Caixa de Direção': (['Terminais de Direção', 'Terminal Axial'], 'Terminais e axiais'),
    'Junta Homocinética': (['Kit Reparo da Junta Homocinética', 'Trizetas'], 'Kit reparo (coifa)'),
    'Kit Reparo da Junta Homocinética': (['Junta Homocinética', 'Trizetas'], 'Junta homocinética'),
    'Trizetas': (['Kit Reparo da Junta Homocinética'], 'Kit reparo (coifa)'),
    'Semi-Eixo Homocinético': (['Cubo de Roda', 'Rolamentos', 'Kit Reparo da Junta Homocinética'], 'Cubo ou rolamento de roda'),
    'Cruzetas': (['Rolamentos', 'Servo e Cilindro de Embreagem'], 'Rolamentos do mesmo eixo'),
    'Embreagem Remanufaturada': (['Servo e Cilindro de Embreagem'], 'Servo/cil. embreagem'),
    'Servo e Cilindro de Embreagem': (['Embreagem Remanufaturada'], 'Kit de embreagem'),
    'Pastilha de Freio': (['Sensor ABS'], f'{DOT4} (fluido DOT 4)'),
    'Sapata de Freio': (['Cilindro de Roda'], f'{DOT3} (fluido DOT 3)'),
    'Cilindro de Roda': (['Sapata de Freio'], f'{DOT3} (fluido DOT 3)'),
    'Cuíca de Freio': (['Catraca de Freio'], 'Catraca de freio'),
    'Catraca de Freio': (['Cuíca de Freio'], 'Cuíca de freio'),
    'Sensor ABS': (['Pastilha de Freio', 'Cubo de Roda'], 'Pastilha de freio'),
    'Eletroventiladores': (["Bomba D'Água"], f'{ADITIVO} · {AGUA}'),
    "Bomba D'Água": (['Kit de Distribuição'], f'{ADITIVO} · {AGUA}'),
    'Bomba de Óleo': (['Interruptores de Pressão do Óleo'], 'Interruptor de pressão do óleo'),
    'Interruptores de Pressão do Óleo': (['Bomba de Óleo'], 'Bomba e filtro de óleo'),
    'Bomba de Combustível': (['Filtros:FILTROS DE COMBUSTÍVEL'], 'Filtro de combustível'),
    'Kit de Distribuição': (["Bomba D'Água", 'Polias e Tensionadores'], "Bomba d'água"),
    'Polias e Tensionadores': (['Kit de Distribuição'], 'Kit de distribuição'),
    'Velas de Ignição': (['Cabo de Vela'], 'Cabo de vela'),
    'Cabo de Vela': (['Velas de Ignição'], 'Velas de ignição'),
    'Lâmpadas': ([], 'Troca em par (2 un.)'),
    'Interruptores e Sensores Elétricos': ([], 'Lâmpada do mesmo circuito'),
    'Baterias': ([], 'Lâmpadas e velas'),
    'Filtros': (['Filtros:*'], 'Óleo + demais filtros'),
    'Óleo Lubrificante': ([], 'Filtro de óleo e de ar'),
    'Fluidos e Químicos': ([], ''),
    'Cubo de Roda': (['Rolamentos', 'Sensor ABS'], 'Rolamento de roda'),
    'Rolamentos': (['Cubo de Roda'], 'Troca em par (2 lados)'),
    'Rodas de Aço e Alumínio': ([], 'Cubo e rolamentos'),
    'Palhetas Limpa-Parabrisa': ([], 'Par (motorista + passag.)'),
    'Cintas e Catracas': ([], 'Cinta complementar'),
}
QUIMICO = [(r'AGUA DESMIN', f'{ADITIVO} (aditivo)'), (r'FLUIDO|ADITIVO', f'{AGUA} (água desmin.)'),
           (r'DOT', 'Pastilhas e sapatas'), (r'ADESIVO|SILICONE', "Bomba d'água e de óleo"),
           (r'DESENGRIPANTE|DESCARBONIZANTE', 'Velas e bomba de comb.')]
LOG = collections.Counter()

# ---------------------------------------------------------------- "Leve também" por sistema (T-0019)
# A regra e a tabela são as do site (G.sistemas_de e G.SIS_COMPAT, sem cópia; R-20261121-200058-alexandre); aqui elas
# só filtram o par calculado por veículo.
_SIS = {}


def sistemas(code):
    """sistemas do item pela regra do site (G.sistemas_de), com os campos da base unificada"""
    c = code.strip().upper()
    if c not in _SIS:
        import montar as _M, taxo
        b = _M.BASE_D.get(taxo.norm(c))
        _SIS[c] = set() if b is None else set(_G.sistemas_de(
            _G.limpar(b.PRODUTO), _G.limpar(b.SISTEMA), _G.limpar(b.DESCRICAO), _G.limpar(b.DETALHE_CATALOGO),
            dict(_G.pares_de(_G.limpar(b.DADOS_ADICIONAIS))).get("POSICAO", "")))
    return _SIS[c]


def sis_ok(origem, oferta):
    """a oferta é do mesmo sistema do item ou de um compatível (SIS_COMPAT); sem sistema na base, fica"""
    so, sd = sistemas(origem), sistemas(oferta)
    if not so or not sd: return True
    return any(d in _G.SIS_COMPAT.get(o, (o,)) for o in so for d in sd)


def _pos(code):
    b = DT._base10().get(code.strip().upper(), {})
    return b.get('POSICAO', ''), b.get('LADO', ''), b.get('FAMILIA', '')


def _compat(a, b):
    if not a or not b: return True
    return bool(set(a.split(' E ')) & set(b.split(' E ')))


def _idx(rows):
    return [(r, X.feats(r), X.brands(r), _pos(r['code'])) for r in rows if r.get('segs') and not r.get('sem_estoque')]   # par só com item ATIVO no cadastro (sem_estoque = não ATIVO, T-0019)


def _pares(r, cand, lado=True, maxn=2):
    m, e, v, y = X.feats(r); ba = X.brands(r); pa, la, fa = _pos(r['code'])
    out = []
    for rb, (mb, eb, vb, yb), bb, (pb, lb, fb) in cand:
        if rb['code'] == r['code']: continue
        if not sis_ok(r['code'], rb['code']): continue
        mi = m & mb
        if not mi: continue
        if ba and bb and not (ba & bb): continue
        if e and eb and not (e & eb): continue
        if v and vb and not (v & vb): continue
        if y and yb and (y[1] < yb[0] - 1 or yb[1] < y[0] - 1): continue
        if not _compat(pa, pb): continue
        if lado and not _compat(la, lb): continue
        out.append((3 * len(mi) + 2 * len(e & eb) + len(v & vb), rb['code']))
    if not out: return []
    out.sort(key=lambda x: (-x[0], x[1]))
    top = out[0][0]
    return [c for s, c in out if s >= top * .85][:maxn]


def aplicar(fams):
    F = {f['name']: f for f in fams}
    cache = {}

    def alvo(nome, fam_origem=None):
        if nome in cache and ':*' not in nome: return cache[nome]
        if nome.startswith('Filtros:'):
            sub = nome.split(':', 1)[1]
            rows = [r for r in F['Filtros']['rows'] if sub == '*' or _pos(r['code'])[2] == sub]
            if sub == '*': rows = [r for r in rows if _pos(r['code'])[2] != fam_origem]
            res = _idx(rows)
            if sub != '*': cache[nome] = res
            return res
        cache[nome] = _idx(F[nome]['rows']) if nome in F else []
        return cache[nome]

    for f in fams:
        nome = f['name']
        if f.get('moto'):
            _moto(f, fams); continue
        if nome == 'Pneus e Câmaras de Ar Moto':
            f['extra_col'] = 'LEVE TAMBÉM'                     # já vem do pneus_fix (pneu ↔ câmara)
            for r in f['rows']:
                if not r.get('extra') or r['extra'] == '—':
                    r['extra'] = 'Óleo 4T e vela'; LOG[(nome, 'sugestão fixa')] += 1
            continue
        if nome not in REGRAS: continue
        alvos, fixa = REGRAS[nome]
        f['extra_col'] = 'LEVE TAMBÉM'
        ja = nome in ('Kit de Distribuição', 'Bomba de Óleo', 'Sapata de Freio', 'Velas de Ignição')
        for r in f['rows']:
            if ja and r.get('extra') and r['extra'] != '—':
                LOG[(nome, 'par (cross.py)')] += 1; continue
            achou = []
            for a in alvos:
                fam_o = _pos(r['code'])[2] if a == 'Filtros:*' else None
                achou = _pares(r, alvo(a, fam_o), lado=a not in ('Cubo de Roda', 'Rolamentos'),
                               maxn=3 if a == 'Filtros:*' else 2)
                if achou: break
            if achou:
                r['extra'] = ' · '.join(achou); LOG[(nome, 'par por veículo')] += 1
            elif nome == 'Fluidos e Químicos':
                t = DT._txt(r['code'])
                r['extra'] = next((s for p, s in QUIMICO if re.search(p, t)), '—'); LOG[(nome, 'sugestão fixa')] += 1
            else:
                r['extra'] = fixa or '—'; LOG[(nome, 'sugestão fixa')] += 1
    cods = {r['code'].strip().upper() for f in fams for r in f['rows']}
    _por_sistema(fams, cods)
    _so_codigo(fams, cods)
    return LOG


def _cod(p):
    """o código de uma oferta, sem o que vem entre parênteses ("RAD25005P (aditivo)")"""
    return re.sub(r'\s*\(.*?\)', '', p).strip()


def _por_sistema(fams, cods):
    """o par que veio pronto (cross.py, sugestão fixa com código) também segue o sistema: o código de outro sistema
    sai; sem nenhum, fica o traço (o _so_codigo)"""
    for f in fams:
        if f.get('moto'): continue
        for r in f['rows']:
            e = r.get('extra')
            if not e or e == '—': continue
            ps = e.split(' · ')
            fica = [p for p in ps if _cod(p).upper() not in cods or sis_ok(r['code'], _cod(p))]
            if len(fica) != len(ps):
                r['extra'] = ' · '.join(fica) or '—'; LOG[(f['name'], 'fora do sistema')] += 1


TEM_COD = re.compile(r'\b(?=[A-Z0-9./-]*\d)[A-Z][A-Z0-9./-]{3,}|\b\d{1,3}[./]\d{2,3}-\d{2}\b')


def _so_codigo(fams, cods):
    """sem item do portfólio para oferecer, fica só o traço (Alexandre, 23/10)"""
    def tem(e):
        return any(_cod(p).upper() in cods for p in e.split(' · ')) or bool(TEM_COD.search(e))
    for f in fams:
        for r in f['rows']:
            e = r.get('extra')
            if e and e != '—' and not tem(e):
                r['extra'] = '—'; LOG[(f['name'], 'traço (sem item)')] += 1


def _moto(f, fams):
    """Linha Moto (por família): pneu ↔ câmara (já vem do pneus_fix), vela → óleo 4T, óleo 4T → vela; resto = traço"""
    todos = [r for g in fams if g.get('moto') for r in g['rows']]
    por = {g['name']: [r['code'] for r in g['rows']] for g in fams if g.get('moto')}
    oleos, velas = por.get('Óleo 4T', []), por.get('Velas de Ignição Moto', [])
    for r in f['rows']:
        if r.get('extra') and r['extra'] != '—': continue
        if f['name'] == 'Velas de Ignição Moto': r['extra'] = ' · '.join(oleos[:2]) or '—'
        elif f['name'] == 'Filtros Moto' and r['code'].startswith('FLU'): r['extra'] = ' · '.join(oleos[:2]) or '—'
        elif f['name'] == 'Óleo 4T': r['extra'] = ' · '.join(velas[:2]) or '—'
        else: r['extra'] = '—'
