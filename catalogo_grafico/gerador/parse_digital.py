import pymupdf, re, json, html, os
SRC='saidas/Catalogo_BAP_2027_Completo_Digital.pdf'
d=pymupdf.open(SRC)
def spans(pg): return [s for b in pg.get_text('dict')['blocks'] for l in b.get('lines',[]) for s in l['spans'] if s['text'].strip()]
def save_img(pg, out, minw=40):
    best=None
    for im in pg.get_image_info(xrefs=True):
        w=im['bbox'][2]-im['bbox'][0]
        if w>=minw and im['bbox'][1]>100 and (best is None or w>best[0]): best=(w,im['xref'])
    if not best: return None
    pix=pymupdf.Pixmap(d,best[1])
    if pix.n-pix.alpha>3: pix=pymupdf.Pixmap(pymupdf.csRGB,pix)
    sm=d.extract_image(best[1]).get('smask')
    if sm: pix=pymupdf.Pixmap(pix,pymupdf.Pixmap(d,sm))
    pix.save(out); return out
# grupos pelo sumário
grp={}; cur=None
for s in sorted(spans(d[1]), key=lambda s:(s['bbox'][0]>300, s['bbox'][1])):
    if s['font'].endswith('Bold') and s['color']==0x5cb85f and s['size']<8 and s['text'].isupper(): cur=s['text'].strip()
    elif s['size']>8 and s['color']==0x161816 and cur: grp[s['text'].strip()]=cur
fams=[]; cur=None
for i,pg in enumerate(d):
    t=pg.get_text(); sp=spans(pg)
    if i in (0,len(d)-1) or i==1: continue
    if 'ITENS NESTA LINHA' in t:
        big=[s for s in sp if s['color']==0xffffff and s['font'].endswith('Bold') and s['size']>20 and not s['text'].strip().isdigit()]
        name=' '.join(s['text'].strip() for s in big)
        desc=' '.join(s['text'].strip() for s in sp if s['color']==0xd5d8d5 and abs(s['size']-11.25)<0.1)
        cnt=int([s['text'] for s in sp if s['text'].strip().isdigit() and s['size']>20][0])
        img=save_img(pg, f'dimg/cover_{len(fams)}.png')
        cur=dict(name=name, group=grp.get(name,''), desc=desc, count=cnt, lanc='LANÇAMENTO 2026' in t, img=img, spec=False, rows=[])
        fams.append(cur); continue
    # página de tabela
    hdr={s['text'].strip():s['bbox'][0] for s in sp if abs(s['size']-6.0)<0.1 and s['font'].endswith('Bold')}
    appx=hdr.get('APLICAÇÃO', hdr.get('PRODUTO / ESPECIFICAÇÃO')); refx=hdr.get('EQUIVALE A', 9e9)
    if 'PRODUTO / ESPECIFICAÇÃO' in hdr: cur['spec']=True
    hy=max(s['bbox'][3] for s in sp if abs(s['size']-6.0)<0.1)
    body=[s for s in sp if s['bbox'][1]>hy+1 and s['bbox'][3]<790]
    codes=[s for s in body if s['bbox'][0]<appx-5 and s['font'].endswith('Bold') and s['color']==0x141514]
    codes.sort(key=lambda s:s['bbox'][1])
    for k,c in enumerate(codes):
        y0=c['bbox'][1]-2; y1=codes[k+1]['bbox'][1]-2 if k+1<len(codes) else 9e9
        inrow=[s for s in body if y0<=s['bbox'][1]<y1]
        nov=any(s['text'].strip()=='NOVO' for s in inrow)
        sub=' '.join(s['text'].strip() for s in sorted([s for s in inrow if s['bbox'][0]<appx-5 and s['color']==0x1f6b2c], key=lambda s:(round(s['bbox'][1]),s['bbox'][0])))
        appsp=sorted([s for s in inrow if appx-1<=s['bbox'][0]<refx-2], key=lambda s:(round(s['bbox'][1],0),s['bbox'][0]))
        segs=[]; lasty=None
        for s in appsp:
            tx=s['text']
            if lasty is not None and round(s['bbox'][1])!=lasty: segs.append((' ',False))
            lasty=round(s['bbox'][1]); segs.append((tx, s['font'].endswith('Bold')))
        refs=' '.join(s['text'].strip() for s in sorted([s for s in inrow if s['bbox'][0]>=refx-1], key=lambda s:(round(s['bbox'][1]),s['bbox'][0])))
        plain=re.sub(r'\s+',' ',''.join(t for t,b in segs)).strip()
        if plain.startswith('Aplicação em cadastro'): segs=[]
        cur['rows'].append(dict(code=c['text'].strip(), nov=nov, sub=sub, segs=segs, refs=re.sub(r'\s+',' ',refs).strip()))
with open('digital_data.json','w') as _f:
    json.dump(fams, _f, ensure_ascii=False)
for f in fams: print(f"{f['name'][:30]:30} {f['group'][:22]:22} cnt={f['count']:4} rows={len(f['rows']):4} spec={f['spec']} lanc={f['lanc']} img={bool(f['img'])}")
# imagens da capa/contracapa e logo
for i,(pno) in enumerate([0]):
    pass
