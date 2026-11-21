import re
def yy(y):
    y = int(y); return 2000 + y if y <= 30 else 1900 + y
Y = r'(?:19|20)\d{2}'
FLAG = []
def fix_text(t):
    o = t
    t = t.replace('11/2015–12/2010', '11/2005–12/2010').replace('11/2015-12/2010', '11/2005-12/2010')
    t = t.replace('1990-1990-19', '90/90-19')
    t = re.sub(r'>>', '>', t)
    t = re.sub(r'\((\d{2})\.(\d{2})>\)', lambda m: f'({m.group(1)}/{yy(m.group(2))}>)', t)
    def r3(m):
        a, b, y1, y2 = m.group(1), m.group(2), int(m.group(3)), yy(m.group(4))
        if y2 < y1:
            FLAG.append(m.group(0)); y1, y2 = y2, y1   # anos trocados no cadastro: assume a ordem crescente
        return f'({a}/{y1}–{b}/{y2})'
    t = re.sub(r'\((\d{2})-(\d{2})/(' + Y + r')-(\d{2})\)', r3, t)
    t = re.sub(r'(\d{2}/' + Y + r')-(\d{2})(?![\d/])', lambda m: f'{m.group(1)}–{yy(m.group(2))}', t)
    t = re.sub(r'((?:\d{2}/)?' + Y + r')\s*>\s*((?:\d{2}/)?' + Y + r')', r'\1–\2', t)
    t = re.sub(r'(' + Y + r')\s*>\s*(\d{2})(?![\d/])', lambda m: f'{m.group(1)}–{yy(m.group(2))}', t)
    def r5(m):
        return m.group(1) if m.group(1) == m.group(2) else f'{m.group(1)}–{m.group(2)}'
    t = re.sub(r'(?<![\d/])(' + Y + r')/(' + Y + r')(?![\d/])', r5, t)
    t = re.sub(r'((?:\d{2}/)?' + Y + r')-((?:\d{2}/)?' + Y + r')(?![\d/])', r'\1–\2', t)
    t = re.sub(r'\s*·?\s*\(\s*(?:\.\.\.|…)\s*/\s*(?:\.\.\.|…)\s*\)', '', t)
    t = re.sub(r'(?<![\d./])00/(\d{2})(?:-\d{2})?(?![\d/])', lambda m: f'2000–{yy(m.group(1))}', t)
    def inv(m):
        if int(m.group(3)) < int(m.group(2)):
            FLAG.append(m.group(0)); return f'{m.group(1)}/{m.group(3)}–{m.group(2)}'
        return m.group(0)
    t = re.sub(r'(\d{2})/(' + Y + r')–(' + Y + r')(?![\d/])', inv, t)
    return t
if __name__ == '__main__':
    for s in ['FIAT Palio 1.0 03/1998>09/2009 D · Palio 1.4 2006>09/2009 D','Cobalt LS 1.4 8V s/ABS 2012>2016 D','Golf 1.8/2.0 1995>98 · Polo','Gol 1.0 1995>> ·',
              'Uno Attractive 1.4 (01-10/2006-11), Uno','GM Corsa 1.8 8V (02/2006-08)','SpaceFox 1.6 8V (01-07/2012-07) ·','Punto 2007/2017 Linea','Polo · (2005/2005) =',
              'Fox 1.0 · (.../...) · Gol G5','Gol 1.6 L (10.94>) /','pneu Bap 1990-1990-19 52P','Palio 1.8R · 11/2015–12/2010 /','Celta 2001-2005 e 01/2001-12/2005','S10, Flex, 2012>20 · Dupla','2016>']:
        print(f'{s:55} -> {fix_text(s)}')
    print('sinalizados', FLAG)

_fix_base = fix_text
def fix_text(t):
    t = re.sub(r'\b19(\d{2})[-–]19(\d{2})W', r'\1/\2W', t)
    return _fix_base(t)


def em_diante(t):
    """"em diante" = "AAAA+" nos PDFs (R-20261120-194600-alexandre, item 4: "troque por 2015+"; R-20261120-195900 e
    R-20261120-201100-alexandre), num lugar só: '2015 em Diante', '2015>', '03/2015>', '2008->' e '2025 →' sem ano depois
    -> '2015+' (antes "2015–", da R-20261120-175000); letra ou "(" logo depois ganha um espaço ("2001+ GM"). É a mesma
    regra do site (site/app.js, anoMaisHtml): "AAAA+", com o espaço depois do "+" antes de uma letra ou de "(".
    '1999->2008' e '1999 → 2008' são faixa -> '1999–2008'; '>1994' ("até") fica. Só no desenho do PDF (aplicação,
    DETALHE e subtítulo), depois do fix_text: a base e o fix_text não mudam."""
    t = re.sub(r'((?:\d{2}/)?' + Y + r')\s*(?:->|→)\s*((?:\d{2}/)?' + Y + r')', r'\1–\2', t)
    t = re.sub(r'((?:\d{2}/)?' + Y + r')\s+em\s+diante\b', r'\1+', t, flags=re.I)
    t = re.sub(r'((?:\d{2}/)?' + Y + r')\s*(?:-?>|→)(?!\s*\d+(?![\dA-Za-z]))', r'\1+', t)
    t = re.sub(r'(' + Y + r'\+)(?=[^\W\d_]|\()', r'\1 ', t)   # "2001>GM" -> "2001+ GM" (designer-ux)
    return re.sub(r'((?:\d{2}/)?' + Y + r')\s*>', r'\1–', t)   # número que não é ano depois ("09/1993>1201"): como antes


def para_pdf(t):
    """texto do desenho dos PDFs: fix_text e depois em_diante (RD-0221)"""
    return em_diante(fix_text(t))
