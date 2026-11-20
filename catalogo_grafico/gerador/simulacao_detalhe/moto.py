import re, copy
import cross as X
import digital2 as D2

F = X.F
MOTO_KW = re.compile(r'(?i)motocic|\bmotos?\b|\bCG\b|\bBiz\b|\bPop\b|\bYBR\b|\bBros\b|\bNXR\b|\bXRE\b|\bFazer\b|\bTwister\b|\bTitan\b(?!\s*\d{2}\.)|\bFan\b|\bFactor\b|\bCrosser\b|\bTornado\b|\bFalcon\b|\bHornet\b|\bRD\s?\d|\bDT\s?\d|Mobilete|ciclomotor|\bCBX\b|\bCB\s?\d|\bMT-0|\bLander\b')


def moto_only(segs):
    """mantém só os trechos da aplicação que falam de moto"""
    t = ''.join(('\x01' + x + '\x02') if b else x for x, b in segs)
    parts = re.split(r'\s·\s|;\s', t)
    keep = [p for p in parts if MOTO_KW.search(p.replace('\x01', '').replace('\x02', ''))]
    if not keep: return segs
    out = []
    for k, p in enumerate(keep):
        if k: out.append([' · ', False])
        for piece in re.split(r'(\x01.*?\x02)', p):
            if not piece: continue
            if piece.startswith('\x01'): out.append([piece[1:-1], True])
            else: out.append([piece.replace('\x01', '').replace('\x02', ''), False])
    return out


# correção: fluidos de freio estavam com a aplicação de aditivo de radiador
for r in F['Fluidos e Químicos']['rows']:
    if r['code'] in ('FLU15001', 'FLU15002'):
        dot = 'DOT 3' if r['code'] == 'FLU15001' else 'DOT 4'
        r['segs'] = [[f'Fluido de freio {dot} 500 ml — sistemas de freio e embreagem hidráulicos que especificam {dot}, conforme manual do fabricante', False]]

rows = []
# 1) pneus e câmaras (com "Ofereça junto")
for r in F['Pneus e Câmaras de Ar Moto']['rows']:
    rows.append((0 if not r['code'].startswith('CA') else 1, copy.deepcopy(r)))
# 2) óleos 4T
for r in F['Óleo Lubrificante']['rows']:
    if r['code'] in ('20W50 4T PROACTIVE', '10W30 PROACTIVE210'):
        rr = copy.deepcopy(r)
        rr['sub'] = 'Óleo 4T para motocicleta'
        rr['segs'] = [['Motores 4 tempos de motocicleta · ' + ''.join(x for x, b in r['segs']).replace('Óleo lubrificante ', ''), False]]
        rr['extra'] = '—'
        rows.append((2, rr))
# 3) velas e 4) rolamentos com aplicação em moto
for name, grp in (('Velas de Ignição', 3), ('Rolamentos', 4)):
    for r in F[name]['rows']:
        t = ''.join(x for x, b in r['segs'])
        if re.search(r'(?i)motocic|\bmotos?\b', t) or (name == 'Velas de Ignição' and r['code'] in ('VEL7500', 'VEL7507', 'VEL7517', 'VEL7523', 'VEL7525')):
            rr = copy.deepcopy(r)
            rr['segs'] = moto_only(r['segs'])
            rr['sub'] = 'Vela de ignição' if grp == 3 else 'Rolamento'
            rr['extra'] = '—'
            rows.append((grp, rr))
rows.sort(key=lambda x: (x[0], x[1]['code']))
MOTO_ROWS = [r for _, r in rows]
moto = dict(name='Linha Moto', group='LINHA MOTO', eyebrow='LINHA MOTO · RESUMO PARA MOTOCICLETAS',
            desc='Todos os produtos BAP para motocicletas em um só lugar: pneus, câmaras, óleos 4T, velas e rolamentos.',
            count=len(MOTO_ROWS), lanc=False, img=F['Pneus e Câmaras de Ar Moto']['img'], spec=False, rows=MOTO_ROWS,
            extra_col='OFEREÇA JUNTO',
            venda='Pneu com a câmara indicada; óleo 4T e vela na revisão da moto.')
FAMS = [f for f in X.PF.M.fams if f['name'] != 'Linha Moto'] + [moto]
for f_ in FAMS:   # eyebrow simplificado: família que já contém o nome do sistema
    if ' · ' in f_.get('eyebrow', ''):
        sis, fam = f_['eyebrow'].split(' · ', 1)
        if sis in fam: f_['eyebrow'] = fam
import detalhe as _DET
_DET.aplicar(FAMS)   # DETALHE inteiro e enxuto (sem '…')
D2.fams = FAMS

if __name__ == '__main__':
    import collections
    print('itens na Linha Moto', len(MOTO_ROWS), collections.Counter(g for g, _ in rows))
    D2.build('digital_v7.pdf')
    import pymupdf
    d = pymupdf.open('digital_v7.pdf'); print('páginas', len(d))
    print([i + 1 for i, p in enumerate(d) if 'Linha Moto' in p.get_text() and ('APLICAÇÃO' in p.get_text() or 'ITENS NESTA' in p.get_text())])
