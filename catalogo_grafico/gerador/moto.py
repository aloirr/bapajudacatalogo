import re, copy
import cross as X
import digital2 as D2

F = X.F
import site_aplicacoes as _SITE
_SITE.aplicar(X.PF.M.fams)   # 49 filtros sem aplicação: aplicação e ref. cruzada do catálogo online BAP (12/11)
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

# ---------------------------------------------------------------- Linha Moto por SISTEMA e FAMÍLIA (Alexandre, 23/10)
def _copia(r, sub=None, segs=None):
    rr = copy.deepcopy(r)
    if sub is not None: rr['sub'] = sub
    if segs is not None: rr['segs'] = segs
    return rr


def _eh_moto(r):
    return bool(re.search(r'(?i)motocic|\bmotos?\b', ''.join(x for x, b in r['segs']) + ' ' + (r.get('sub') or '')))


pc = F['Pneus e Câmaras de Ar Moto']['rows']
_velas = [_copia(r, 'Vela de ignição', moto_only(r['segs'])) for r in F['Velas de Ignição']['rows']
          if _eh_moto(r) or r['code'] in ('VEL7500', 'VEL7507', 'VEL7517', 'VEL7523', 'VEL7525')]
_lamp = [_copia(r) for r in F['Lâmpadas']['rows'] if _eh_moto(r)]
_oleo = []
for r in F['Óleo Lubrificante']['rows']:
    if r['code'] in ('20W50 4T PROACTIVE', '10W30 PROACTIVE210'):
        _oleo.append(_copia(r, '',
                            [['Motores 4 tempos de motocicleta · ' + ''.join(x for x, b in r['segs']).replace('Óleo lubrificante ', ''), False]]))
_pneus = [_copia(r) for r in pc if not r['code'].startswith('CA')]
_cam = [_copia(r) for r in pc if r['code'].startswith('CA')]
_rol = [_copia(r, 'Rolamento', moto_only(r['segs'])) for r in F['Rolamentos']['rows'] if _eh_moto(r)]
# filtros de moto (Alexandre, 27/10) + filtros de óleo de moto achados no catálogo online (12/11: FLU6186 Suzuki,
# FLU6240 Honda/Kawasaki/Yamaha/Triumph). Ficam também em Filtros (como o FAR6365).
FILTROS_MOTO = ('FLU6186', 'FLU6240')
_filt = [_copia(r) for r in F['Filtros']['rows'] if _eh_moto(r) or r['code'] in FILTROS_MOTO]

MOTO_DEF = [  # (nome, sistema · família, descrição, imagem, linhas, spec, faixa "leve também")
    ('Velas de Ignição Moto', 'ELÉTRICA · IGNIÇÃO', 'Velas de ignição para motores de motocicleta.', F['Velas de Ignição']['img'], _velas, False,
     'Óleo 4T na revisão da moto.'),
    ('Lâmpadas Moto', 'ELÉTRICA · ILUMINAÇÃO', 'Lâmpadas de sinalização para motocicletas.', F['Lâmpadas']['img'], _lamp, bool(F['Lâmpadas'].get('spec')), None),
    ('Filtros Moto', 'FILTRAÇÃO · FILTROS DE AR E DE ÓLEO', 'Filtros de ar e de óleo para motocicletas.', F['Filtros']['img'], _filt, False,
     'Óleo 4T na troca do filtro de óleo.'),
    ('Óleo 4T', 'LUBRIFICANTES · ÓLEOS DE MOTOR', 'Óleo para motores de motocicleta 4 tempos.', F['Óleo Lubrificante']['img'], _oleo, False,
     'Vela de ignição na revisão da moto.'),
    ('Pneus Moto', 'RODAGEM · PNEUS E CÂMARAS', 'Pneus para motocicletas, com e sem câmara, dianteiros e traseiros.', F['Pneus e Câmaras de Ar Moto']['img'], _pneus, False,
     'Câmara de ar indicada para cada pneu (coluna Leve também).'),
    ('Câmaras de Ar Moto', 'RODAGEM · PNEUS E CÂMARAS', 'Câmaras de ar para motocicletas, por aro e medida.', F['Pneus e Câmaras de Ar Moto']['img'], _cam, False,
     'Pneus BAP compatíveis (coluna Leve também).'),
    ('Rolamentos Moto', 'RODAGEM · CUBOS E ROLAMENTOS', 'Rolamentos de roda e de direção para motocicletas.', F['Rolamentos']['img'], _rol, False, None),
]
MOTO_FAMS = []
for nome, eb, desc, img, rows_, spec_, venda in MOTO_DEF:
    if not rows_: continue
    d = dict(name=nome, group='LINHA MOTO', eyebrow='LINHA MOTO · ' + eb, desc=desc, count=len(rows_), lanc=False, img=img,
             spec=spec_, rows=rows_, extra_col='LEVE TAMBÉM', moto=True)
    if venda: d['venda'] = venda
    MOTO_FAMS.append(d)
MOTO_ROWS = [r for f in MOTO_FAMS for r in f['rows']]
FAMS = [f for f in X.PF.M.fams if f['name'] != 'Linha Moto'] + MOTO_FAMS
for f_ in FAMS:   # eyebrow simplificado: família que já contém o nome do sistema
    if ' · ' in f_.get('eyebrow', ''):
        sis, fam = f_['eyebrow'].split(' · ', 1)
        if sis in fam: f_['eyebrow'] = fam
import detalhe as _DET
_DET.aplicar(FAMS)   # DETALHE inteiro e enxuto (sem '…')
_DET.limpar_datas(FAMS)
_DET.preencher_aplicacao(FAMS)
_DET.essencial(FAMS)              # informação essencial da descrição no DETALHE (auditoria 23/10)
import diferencial as _DIF
_DIF.aplicar(FAMS)                # selo de diferencial ao lado do código (ex.: c/ ABS × s/ ABS)
_SITE_COD = set(_SITE.LOG.get('preenchidos', []))
for f_ in FAMS:                   # aplicação do site (resumida por motor) não serve para achar "item parecido": sem selo
    for r_ in f_['rows']:
        g_ = {c: v for c, v in (r_.get('gemeos') or {}).items() if c not in _SITE_COD}
        if r_['code'] in _SITE_COD or (r_.get('gemeos') and not g_):
            r_['dif'] = ''; r_['gemeos'] = {}
        elif r_.get('gemeos') and len(g_) != len(r_['gemeos']):
            r_['gemeos'] = g_
import oferta as _OF
_OF.aplicar(FAMS)                 # OFEREÇA JUNTO em todos os itens
import fraga_complementos as _FC
_FC.aplicar(FAMS, moto_only)   # complementos do Fraga aprovados em 13/11, depois do OFEREÇA JUNTO e do selo: só aplicação e referência mudam (refs a mais e veículos a mais)
D2.fams = FAMS

if __name__ == '__main__':
    import collections
    print('itens na Linha Moto', len(MOTO_ROWS), {f['name']: f['count'] for f in MOTO_FAMS})
    D2.build('digital_v7.pdf')
    import pymupdf
    d = pymupdf.open('digital_v7.pdf'); print('páginas', len(d))
    print([i + 1 for i, p in enumerate(d) if 'Linha Moto' in p.get_text() and ('APLICAÇÃO' in p.get_text() or 'ITENS NESTA' in p.get_text())])
