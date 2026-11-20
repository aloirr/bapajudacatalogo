import pymupdf, difflib, collections, sys
from fixpdf import FONT, FO, fkey, redact
import datas
def style_of(s):
    c=s['color']; r,g,b=(c>>16)&255,(c>>8)&255,c&255
    if abs(r-g)<12 and abs(g-b)<12: col=(0,0,0,round(1-max(r,g,b)/255,2))
    else: col=(r/255,g/255,b/255)
    return (fkey(s), round(s['size'],3), col)
def process(src, dst):
    d=pymupdf.open(src); log=[]; shrunk=[]
    for pi,pg in enumerate(d):
        lines=[l for b in pg.get_text('dict')['blocks'] for l in b.get('lines',[]) if l['spans']]
        # borda direita por coluna (x0 igual)
        right=collections.defaultdict(float)
        for l in lines: right[round(l['bbox'][0])] = max(right[round(l['bbox'][0])], l['bbox'][2])
        todo=[]
        for l in lines:
            chars=[]; 
            for s in l['spans']:
                st=style_of(s)
                for ch in s['text']: chars.append((ch,st))
            old=''.join(c for c,_ in chars)
            new=datas.fix_text(old)
            if new==old: continue
            # leva o estilo de cada caractere para o texto novo
            sm=difflib.SequenceMatcher(None, old, new, autojunk=False); nst=[]
            for op,i1,i2,j1,j2 in sm.get_opcodes():
                if op=='equal': nst+= [chars[k][1] for k in range(i1,i2)]
                else:
                    ref=chars[min(i1,len(chars)-1)][1] if i1<len(chars) else chars[-1][1]
                    if op in('replace','insert') and i2>i1: ref=chars[i1][1]
                    nst+= [ref]*(j2-j1)
            runs=[]
            for ch,st in zip(new,nst):
                if runs and runs[-1][1]==st: runs[-1][0]+=ch
                else: runs.append([ch,st])
            todo.append((l,old,new,runs))
        for l,old,new,runs in todo:
            x0=l['spans'][0]['origin'][0]; base=l['spans'][0]['origin'][1]
            w=sum(FO[st[0]].text_length(t,fontsize=st[1]) for t,st in runs)
            avail=right[round(l['bbox'][0])]-x0
            k=1.0
            if w>avail+0.3:
                k=max(0.86,(avail)/w); shrunk.append((pi+1,round(k,3),new[:60]))
            redact(pg, pymupdf.Rect(l['bbox'])+(-0.3,0.8,0.3,-0.8))
            x=x0
            for t,st in runs:
                pg.insert_text((x,base), t, fontsize=st[1]*k, fontname=st[0], fontfile=FONT[st[0]], color=st[2])
                x+=FO[st[0]].text_length(t,fontsize=st[1]*k)
            log.append((pi+1,old,new))
    d.save(dst, garbage=3, deflate=True)
    return log, shrunk
if __name__=='__main__':
    log,shrunk=process(sys.argv[1], sys.argv[2])
    print('linhas alteradas', len(log), '| linhas com fonte reduzida', len(shrunk))
    for x in shrunk: print('  reduz', x)
    for p,o,n in log[:12]: print(p,'|',o,'\n   ->',n)
    print('sinalizados', datas.FLAG)
