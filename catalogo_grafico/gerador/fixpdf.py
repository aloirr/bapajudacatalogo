import pymupdf, re
FD='fontes/'
FONT={'PR':FD+'Poppins-Regular.ttf','PB':FD+'Poppins-Bold.ttf','PM':FD+'Poppins-Medium.ttf'}
FO={k:pymupdf.Font(fontfile=v) for k,v in FONT.items()}
def fkey(span): 
    f=span['font']; return 'PB' if 'Bold' in f else ('PM' if 'Medium' in f else 'PR')
def kcol(span):
    c=span['color']; r,g,b=(c>>16)&255,(c>>8)&255,c&255
    if abs(r-g)<12 and abs(g-b)<12: return (0,0,0,round(1-max(r,g,b)/255,2))
    return None
def prep(pg):
    for k,v in FONT.items(): pg.insert_font(fontname=k, fontfile=v)
def lines(pg):
    for b in pg.get_text('dict')['blocks']:
        for l in b.get('lines',[]): yield l
def find_line(pg, contains):
    for l in lines(pg):
        if contains in ''.join(s['text'] for s in l['spans']): return l
    raise ValueError(contains)
def find_span(pg, text, exact=True):
    for l in lines(pg):
        for s in l['spans']:
            if (s['text'].strip()==text if exact else text in s['text']): return s
    raise ValueError(text)
def redact(pg, rect, graphics=0):
    pg.add_redact_annot(rect, fill=False); pg.apply_redactions(images=0, graphics=graphics, text=0)
def put(pg, x, base, text, key, size, color):
    pg.insert_text((x, base), text, fontsize=size, fontname=key, fontfile=FONT[key], color=color)
    return FO[key].text_length(text, fontsize=size)
