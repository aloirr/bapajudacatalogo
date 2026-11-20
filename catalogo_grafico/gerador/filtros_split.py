"""Catálogo digital: FILTRAÇÃO dividida por tipo de filtro (pedido do Alexandre, 12/11/2026).
Em vez de uma linha "Filtros" com tudo junto, o sistema FILTRAÇÃO passa a ter uma linha por tipo, cada uma com
o próprio cabeçalho, 5 destaques e a lista: ar do motor, ar da cabine, combustível, óleo e outros.
O tipo vem da coluna FAMILIA da base unificada. Só o digital usa isto; o A4 continua com uma página por linha.
"""
import copy
import detalhe as DT

TIPOS = [  # (FAMILIA na base, nome da linha, eyebrow, descrição)
    ('FILTROS DE AR', 'Filtros de Ar do Motor', 'FILTRAÇÃO · AR DO MOTOR', 'Filtros de ar do motor para linha leve e pesada.'),
    ('FILTROS DE CABINE', 'Filtros de Ar da Cabine', 'FILTRAÇÃO · AR-CONDICIONADO', 'Filtros de ar-condicionado (cabine).'),
    ('FILTROS DE COMBUSTÍVEL', 'Filtros de Combustível', 'FILTRAÇÃO · COMBUSTÍVEL', 'Filtros de combustível, gasolina, flex e diesel.'),
    ('FILTROS DE ÓLEO', 'Filtros de Óleo', 'FILTRAÇÃO · ÓLEO DO MOTOR', 'Filtros de óleo lubrificante do motor.'),
    ('OUTROS FILTROS', 'Outros Filtros', 'FILTRAÇÃO · OUTROS FILTROS', 'Filtros hidráulicos e de câmbio e outros.'),
]
VENDA = 'Kit revisão: filtros de óleo, ar, combustível e cabine, com o óleo lubrificante.'


def _tipo(code):
    return DT._base10().get(code.strip().upper(), {}).get('FAMILIA', '') or 'OUTROS FILTROS'


def _foto(rows, padrao):
    try:
        import print_cat as PC, taxo
        for r in sorted(rows, key=lambda r: r['code']):   # 1ª foto própria pela ordem do código (sem estoque, T-0019)
            p = PC.IMG.get(taxo.norm(r['code']))
            if p: return p
    except Exception:
        pass
    return padrao


def dividir(fams):
    out = []
    for f in fams:
        if f['name'] != 'Filtros':
            out.append(f); continue
        por = {}
        for r in f['rows']:
            t = _tipo(r['code'])
            por.setdefault(t if t in {x[0] for x in TIPOS} else 'OUTROS FILTROS', []).append(r)
        for fam, nome, eb, desc in TIPOS:
            rows = por.get(fam, [])
            if not rows: continue
            g = {k: v for k, v in f.items() if k != 'rows'}
            g = copy.deepcopy(g)
            g.update(name=nome, eyebrow=eb, desc=desc, rows=rows, count=len(rows), venda=VENDA, img=_foto(rows, f.get('img')))
            out.append(g)
    return out


if __name__ == '__main__':
    import moto
    for f in dividir(moto.FAMS):
        if f['group'] == 'FILTRAÇÃO': print(f['name'], f['count'], f['img'])
