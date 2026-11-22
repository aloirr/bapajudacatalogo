"""Catálogo só da Linha Moto (pedido do Alexandre, 27/10/2026) — mesmo formato do catálogo digital:
capa da Linha Moto, sumário, uma página por sistema (Elétrica, Lubrificantes, Rodagem) e, em cada família,
cabeçalho com imagem + 5 destaques + todos os itens com aplicação, tags, Ofereça junto e equivalências.
Material de uso interno do time BAP (mesmo aviso do catálogo).
Uso (dentro de gerador/):  python catalogo_moto.py [saida.pdf]
"""
import sys
import moto, digital2 as D2

D2.DOC_TITULO = f'CATÁLOGO LINHA MOTO {D2.ANO}'
D2.DOC_META = f'Catálogo BAP {D2.ANO} — Linha Moto (uso interno)'
D2.SUM_DESC = 'Todas as linhas BAP para motocicletas com as aplicações completas.'
FAMS = []
for f in moto.MOTO_FAMS:
    g = dict(f)
    g['group'] = f['eyebrow'].split(' · ')[1]          # ELÉTRICA / LUBRIFICANTES / RODAGEM
    FAMS.append(g)
D2.fams = FAMS


def capa_moto(dc):
    W, H, MX, lw = D2.W, D2.H, D2.MX, D2.lw
    dc.bookmark('capa', 'Capa', 0)
    dc.rect(0, 0, W, H, fill='black')
    dc.circle(W + 60, 640, 420, 'green'); dc.circle(W + 20, 640, 310, 'green2'); dc.circle(W + 20, 640, 220, 'black')
    dc.image(D2.LOGO, MX + 20, 110, 150 * 1420 / 1955, 150)
    dc.label(MX + 20, 320, f'CATÁLOGO DE PRODUTOS {D2.ANO}', 16, 'green2', 'PB', 2.4)
    dc.label(MX + 16, 350, 'Linha Moto', 76, 'white', 'PB', -1.5)
    n = sum(f['count'] for f in FAMS)
    for i, t in enumerate(['Pneus · Câmaras de ar · Rolamentos', 'Óleo 4T · Filtros · Velas de ignição · Lâmpadas',
                           f'{len(FAMS)} famílias · {n} itens para motocicletas']):
        dc.label(MX + 20, 470 + i * 24, t, 14, 'white', 'PR')
    dc.tag(MX + 20, 560, 'LINHA MOTO · USO INTERNO', 9, 'orange', 'white', 9)
    imgs = [f['img'] for f in FAMS if f.get('img')][:6]
    for i, im in enumerate(imgs):
        x = MX + 20 + (i % 3) * 142; y = 620 + (i // 3) * 122
        dc.rect(x, y, 130, 110, fill='white', r=14)
        dc.image(im, x + 10, y + 12, 110, 86)
    dc.rect(0, H - 56, W, 56, fill='green')
    dc.label(MX + 20, H - 56 + 20, 'www.bapautoparts.com.br', 12, 'white', 'PB')
    dc.label(W - MX, H - 56 + 20, '@bapautoparts', 12, 'white', 'PM', 0, 'right')
    w = lw(D2.LEGAL_B, 10, 'PB') + lw(' · exclusivo do time BAP', 10, 'PR'); x = W / 2 - w / 2
    x += dc.label(x, H - 56 + 21, D2.LEGAL_B, 10, 'white', 'PB'); dc.label(x, H - 56 + 21, ' · exclusivo do time BAP', 10, 'white', 'PR')
    dc.end()


D2.capa = capa_moto

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else f'saidas/Catalogo_BAP_{D2.ANO}_Linha_Moto.pdf'
    n, entries = D2.build(out)
    print(n, [(e['name'], e['count'], e['pg']) for e in entries])
