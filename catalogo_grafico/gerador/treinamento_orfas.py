"""Mídia órfã num .pptx: arquivo em ppt/media que nenhuma relação usada (rId citado no XML da parte) aponta."""
import sys, zipfile, re, posixpath
for arq in sys.argv[1:]:
    z = zipfile.ZipFile(arq); nomes = set(z.namelist())
    usadas, rel_sem_uso = set(), 0
    for r in [n for n in nomes if n.endswith('.rels')]:
        base = posixpath.dirname(posixpath.dirname(r))
        parte = posixpath.join(base, posixpath.basename(r)[:-5])
        xml = z.read(parte).decode('utf8', 'ignore') if parte in nomes else ''
        for rid, alvo in re.findall(r'Id="([^"]+)"[^>]*Target="([^"]+)"', z.read(r).decode()) + \
                         [(b, a) for a, b in re.findall(r'Target="([^"]+)"[^>]*Id="([^"]+)"', z.read(r).decode())]:
            caminho = posixpath.normpath(posixpath.join(base, alvo)).lstrip('/')
            if 'media/' not in caminho:
                continue
            if re.search(r'"%s"' % re.escape(rid), xml):
                usadas.add(caminho)
            else:
                rel_sem_uso += 1
    media = {n for n in nomes if n.startswith('ppt/media/')}
    orfas = sorted(media - usadas)
    print(f'{arq.split("/")[-1]}: mídias {len(media)}, órfãs {len(orfas)}, relações de mídia sem uso {rel_sem_uso}', orfas[:6])
