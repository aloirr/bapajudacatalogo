"""Treinamentos BAP pelo molde do original (T-0032).

O deck novo é montado DUPLICANDO os slides do treinamento original de Baterias (o mesmo tema, layouts, formas,
ícones e molduras) e trocando só o conteúdo, que vem de treinamentos/<nome>.json:

    {"arquivo": "...pptx", "rodape": "...", "slides": [
        {"molde": 7,                                # nº do slide-modelo no original de Baterias
         "t": {"1": "Título", "4": "01  |Motor\\n02  |Arrefecimento"},
         "img": {"3": "desenho:motor_corte"},      # desenho:, foto:CÓDIGO, capa:cover_15, orig:image-6-1.png,
                                                   # montagem:foto:A+foto:B
         "icone": {"6": "FaWrench"},               # ícone branco tirado dos 3 originais
         "tabela": {"2": [["a", "b", "c"], ...]},  # troca o texto das células, linha a linha
         "mover": {"3": [x, y, w, h]},             # polegadas (null mantém)
         "preencher": {"38": "accent1"},           # cor de tema do preenchimento e do contorno
         "apagar": [9, 10],
         "copiar": [{"formas": [32, 33], "dy": 1.2}],   # cópias entram no fim (índices seguintes); "molde": N copia
                                                       # de outro slide do original
         "notas": "MENSAGEM-CHAVE\\n..."}]}

Texto: "\\n" separa parágrafos e "|" separa trechos (runs); o trecho k herda a formatação do trecho k do modelo
(ex.: "DICA DE CAMPO  |texto"). Índices = ordem das formas do slide-modelo (python inv. em LEIA_GERADOR.md).

Macros no texto e nas notas: {{cod:AMT7004}} (confere na base e escreve o código), {{oj:AMT7004}} (o OFEREÇA JUNTO
da base), {{prod:Cubo de Roda}} (confere o PRODUTO), {{n_itens}}, {{n_produtos}}, {{n_sistemas}}, {{versao_base}}.

Travas ([PARADO]): código fora da base ou não ATIVO; "estoque" ou "R$" em qualquer texto ou nota; foto de código
inexistente; slide sem notas.

Uso (dentro de catalogo_grafico/gerador/, com PYTHONHASHSEED=0):
    python treinamento_molde.py mecanica_basica                  # gera saidas/<arquivo>.pptx
    python treinamento_molde.py mecanica_basica --sim PASTA      # e também PDF, PNG 100 ppi e mosaicos em PASTA
"""
import copy
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

import pandas as pd
from lxml import etree
from PIL import Image
from pptx import Presentation
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.util import Inches

import treinamento_desenhos

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
BASE = os.path.join(RAIZ, 'dados', 'BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx')
VERSOES = os.path.join(RAIZ, 'dados', 'versoes')
ORIGINAIS = os.path.join(AQUI, '..', 'originais', 'treinamentos')
MOLDE = os.path.join(ORIGINAIS, 'Treinamento_Baterias_BAP_Vendedores.pptx')
FOTOS = os.path.join(RAIZ, 'site', 'img')
CAPAS = os.path.join(AQUI, 'dimg')

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
A = '{%s}' % NS['a']
R_ATTRS = ('{%s}embed' % NS['r'], '{%s}id' % NS['r'], '{%s}link' % NS['r'])
RE_COD = re.compile(r'\b(?:[A-Z]{2,4}\d{3,8}[A-Z]?|CV-[A-Z]\d{2,3})\b')
PROIBIDO = re.compile(r'estoque|R\$', re.I)

# cores fechadas pela marca (PADRAO_TREINAMENTO.md, seção 3)
VERDE_TEXTO = 'tx2'        # #2F7D36: texto verde sobre fundo claro
LARANJA_TEXTO = '8A3F00'   # texto laranja sobre fundo claro (ATENÇÃO, "= o que isso significa")
FONTE = 'Arial'


def parar(msg):
    sys.exit('[PARADO] ' + msg)


# ---------------------------------------------------------------- base (só leitura)

class Base:
    def __init__(self):
        df = pd.read_excel(BASE, sheet_name='PRODUTOS', dtype=str).fillna('')
        self.df = df
        self.idx = {r.CODIGO_BAP: r for r in df.itertuples()}
        cat = df[(df.NO_CATALOGO_DIGITAL == 'SIM') & (df.STATUS_CADASTRO != 'INATIVO')]
        vs = sorted((f for f in os.listdir(VERSOES) if re.search(r'_v(\d+)\.xlsx$', f)),
                    key=lambda f: int(re.search(r'_v(\d+)\.xlsx$', f).group(1)))
        self.vars = {
            'n_itens': f'{len(cat):,}'.replace(',', '.'),
            'n_produtos': str(cat.PRODUTO.nunique()),
            'n_sistemas': str(cat[cat.SISTEMA.ne('OUTROS') & cat.SISTEMA.ne('')].SISTEMA.nunique()),
            'versao_base': re.search(r'_(v\d+)\.xlsx$', vs[-1]).group(1) if vs else '?',
        }
        self.citados = set()

    def ativo(self, cod):
        r = self.idx.get(cod)
        if r is None:
            parar(f'código {cod} não está na base')
        if r.STATUS_CADASTRO != 'ATIVO':
            parar(f'código {cod} está {r.STATUS_CADASTRO} na base')
        self.citados.add(cod)
        return r

    def expandir(self, txt):
        def troca(m):
            tipo, arg = m.group(1), m.group(2)
            if tipo == 'cod':
                return self.ativo(arg).CODIGO_BAP
            if tipo == 'oj':
                oj = [x.strip() for x in self.ativo(arg).OFERECA_JUNTO.split('·') if x.strip()]
                cods = [RE_COD.search(x).group(0) for x in oj if RE_COD.search(x)]
                for c in cods:
                    self.ativo(c)
                return ' · '.join(cods) if cods else '—'
            if tipo == 'prod':
                if arg not in set(self.df.PRODUTO):
                    parar(f'produto "{arg}" não é um PRODUTO da base')
                return arg
            if tipo in self.vars and arg is None:
                return self.vars[tipo]
            parar('macro desconhecida: ' + m.group(0))
        return re.sub(r'\{\{(\w+)(?::([^}]+))?\}\}', troca, txt)

    def conferir(self, txt, onde):
        if PROIBIDO.search(txt):
            parar(f'palavra proibida ("estoque" ou "R$") em {onde}: {PROIBIDO.search(txt).group(0)}')
        for cod in RE_COD.findall(txt):
            self.ativo(cod)


# ---------------------------------------------------------------- imagens e ícones

def indice_icones():
    """Ícones brancos dos 3 originais, pelo nome da forma (icon-FaWrench -> FaWrench)."""
    ic = {}
    for f in sorted(os.listdir(ORIGINAIS)):
        if not f.endswith('.pptx'):
            continue
        for s in Presentation(os.path.join(ORIGINAIS, f)).slides:
            pilha = list(s.shapes)
            while pilha:
                sh = pilha.pop()
                if sh.shape_type == 6:
                    pilha.extend(sh.shapes)
                elif sh.shape_type == 13 and sh.name.startswith('icon-'):
                    nome = sh.name[5:]
                    blob = sh.image.blob
                    if nome not in ic or len(blob) > len(ic[nome]):
                        ic[nome] = blob
    return ic


def aparar(im, fundo=(255, 255, 255)):
    im = im.convert('RGBA')
    bg = Image.new('RGBA', im.size, fundo + (255,))
    comp = Image.alpha_composite(bg, im).convert('RGB')
    from PIL import ImageChops
    diff = ImageChops.difference(comp, Image.new('RGB', im.size, fundo))
    diff = ImageChops.add(diff, diff, 2.0, -20)
    box = diff.getbbox()
    return im.crop(box) if box else im


class Imagens:
    def __init__(self, base, molde, tmp):
        self.base, self.molde, self.tmp = base, molde, tmp
        self.usadas = []

    def caminho(self, ref):
        """Devolve um arquivo de imagem para a referência do JSON."""
        if ref.startswith('montagem:'):
            partes = [self.caminho(x) for x in ref[9:].split('+')]
            ims = [aparar(Image.open(p)) for p in partes]
            alt = 700
            ims = [im.resize((int(im.width * alt / im.height), alt), Image.LANCZOS) for im in ims]
            vao = 70
            larg = sum(im.width for im in ims) + vao * (len(ims) - 1)
            tela = Image.new('RGBA', (larg, alt), (255, 255, 255, 0))
            x = 0
            for im in ims:
                tela.paste(im, (x, 0), im)
                x += im.width + vao
            p = os.path.join(self.tmp, 'montagem_%d.png' % len(self.usadas))
            tela.save(p)
            self.usadas.append(ref)
            return p
        tipo, nome = ref.split(':', 1)
        self.usadas.append(ref)
        if tipo == 'desenho':
            return treinamento_desenhos.gerar(nome, os.path.join(self.tmp, 'desenhos'), largura_px=2000)
        if tipo in ('foto', 'capa'):
            if tipo == 'foto':
                self.base.ativo(nome)
                p = os.path.join(FOTOS, nome + '.jpg')
                if not os.path.exists(p):
                    parar(f'foto do código {nome} não existe em site/img')
            else:
                p = os.path.join(CAPAS, nome + '.png')
            # recorta o branco em volta, para a peça ocupar o quadro
            saida = os.path.join(self.tmp, f'{tipo}_{nome}.png')
            aparar(Image.open(p)).save(saida)
            return saida
        if tipo == 'orig':
            p = os.path.join(self.tmp, nome)
            with open(p, 'wb') as f:
                f.write(self._blob_orig(nome))
            return p
        parar('imagem desconhecida: ' + ref)

    def _blob_orig(self, nome):
        for part in self.molde.part.package.iter_parts():
            if str(part.partname).endswith('/media/' + nome):
                return part.blob
        parar('imagem do original não encontrada: ' + nome)


def trocar_imagem(slide, pic, arquivo, conter=True):
    _, rid = slide.part.get_or_add_image_part(arquivo)
    pic._element.blipFill.find(A + 'blip').set(R_ATTRS[0], rid)
    if conter:
        with Image.open(arquivo) as im:
            w, h = im.size
        bw, bh = pic.width, pic.height
        esc = min(bw / w, bh / h)
        nw, nh = int(w * esc), int(h * esc)
        pic.left, pic.top = pic.left + (bw - nw) // 2, pic.top + (bh - nh) // 2
        pic.width, pic.height = nw, nh
        src = pic._element.blipFill.find(A + 'srcRect')
        if src is not None:
            pic._element.blipFill.remove(src)


# ---------------------------------------------------------------- slides

def clonar(prs, src):
    novo = prs.slides.add_slide(src.slide_layout)
    arvore = novo.shapes._spTree
    for el in list(arvore)[2:]:
        arvore.remove(el)
    mapa = {}
    for rid, rel in src.part.rels.items():
        if rel.reltype in (RT.SLIDE_LAYOUT, RT.NOTES_SLIDE):
            continue
        if rel.is_external:
            mapa[rid] = novo.part.relate_to(rel.target_ref, rel.reltype, is_external=True)
        else:
            mapa[rid] = novo.part.relate_to(rel.target_part, rel.reltype)
    for el in list(src.shapes._spTree)[2:]:
        e = copy.deepcopy(el)
        for no in e.iter():
            for at in R_ATTRS:
                if no.get(at) in mapa:
                    no.set(at, mapa[no.get(at)])
        arvore.append(e)
    bg = src._element.cSld.find('{%s}bg' % NS['p'])
    if bg is not None:
        novo._element.cSld.insert(0, copy.deepcopy(bg))
    return novo


def copiar_formas(s, origem, indices, dx=0.0, dy=0.0):
    """Copia formas (do mesmo slide ou de outro slide do original) para o fim do slide s, deslocadas de dx, dy pol."""
    arvore = s.shapes._spTree
    prox = max(int(n.get('id')) for n in arvore.iter('{%s}cNvPr' % NS['p'])) + 1
    formas = list(origem.shapes)
    for k in indices:
        e = copy.deepcopy(formas[k]._element)
        if origem.part is not s.part:
            for no in e.iter():
                for at in R_ATTRS:
                    rid = no.get(at)
                    if rid:
                        rel = origem.part.rels[rid]
                        no.set(at, s.part.relate_to(rel.target_part, rel.reltype))
        for no in e.iter('{%s}cNvPr' % NS['p']):
            no.set('id', str(prox))
            prox += 1
        off = e.find('.//' + A + 'off')
        if off is not None:
            off.set('x', str(int(off.get('x')) + int(Inches(dx))))
            off.set('y', str(int(off.get('y')) + int(Inches(dy))))
        arvore.append(e)


def escrever(txBody, valor):
    """Troca o texto mantendo a formatação: \\n = parágrafo, | = trecho."""
    ps = txBody.findall(A + 'p')
    modelos = [copy.deepcopy(p) for p in ps]
    for p in ps:
        txBody.remove(p)
    for i, linha in enumerate(valor.split('\n')):
        mp = copy.deepcopy(modelos[min(i, len(modelos) - 1)])
        runs = mp.findall(A + 'r')
        ppr = mp.find(A + 'pPr')
        fim = mp.find(A + 'endParaRPr')
        for ch in list(mp):
            mp.remove(ch)
        if ppr is not None:
            mp.append(ppr)
        for k, trecho in enumerate(linha.split('|')):
            if not trecho:
                continue
            if runs:
                r = copy.deepcopy(runs[min(k, len(runs) - 1)])
            else:
                r = etree.SubElement(mp, A + 'r')
                etree.SubElement(r, A + 'rPr')
                etree.SubElement(r, A + 't')
            r.find(A + 't').text = trecho
            mp.append(r)
        if fim is not None:
            mp.append(fim)
        txBody.append(mp)


def caixa(sh):
    return sh.left, sh.top, sh.left + sh.width, sh.top + sh.height


def cor_fundo(sh):
    sp = getattr(sh._element, 'spPr', None)
    if sp is None:
        return None
    f = sp.find(A + 'solidFill')
    if f is None or not len(f):
        return None
    return f[0].get('val')


def corrigir_cores(slide):
    """Texto verde ou laranja sobre fundo claro passa para #2F7D36 e #8A3F00; sobre laranja, número escuro."""
    formas = list(slide.shapes)
    for sh in formas:
        if not sh.has_text_frame:
            continue
        x0, y0, x1, y1 = caixa(sh)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        fundo = None
        for o in formas:
            if o is sh or o.shape_type != 1:
                continue
            a0, b0, a1, b1 = caixa(o)
            if a0 <= cx <= a1 and b0 <= cy <= b1:
                fundo = cor_fundo(o) or fundo
        if cor_fundo(sh):
            fundo = cor_fundo(sh)
        escuro = fundo in ('tx1', 'dk1', 'accent3', '1E2B22')
        for clr in sh._element.iter(A + 'schemeClr'):
            pai = clr.getparent()
            if pai.tag != A + 'solidFill' or pai.getparent().tag not in (A + 'rPr', A + 'defRPr', A + 'endParaRPr'):
                continue
            v = clr.get('val')
            if not escuro and v == 'accent1':
                clr.set('val', VERDE_TEXTO)
            elif not escuro and v == 'accent2':
                novo = etree.Element(A + 'srgbClr', val=LARANJA_TEXTO)
                pai.replace(clr, novo)
            elif fundo == 'accent2' and v == 'bg1':
                clr.set('val', 'tx1')


def trocar_fontes(prs):
    for part in prs.part.package.iter_parts():
        ct = part.content_type
        if not ct.endswith('+xml'):
            continue
        if hasattr(part, '_element'):
            for no in part._element.iter(A + 'latin', A + 'ea', A + 'cs'):
                if no.get('typeface') in ('Calibri', 'Calibri Light'):
                    no.set('typeface', FONTE)
        elif 'theme' in ct:
            part._blob = part.blob.replace(b'typeface="Calibri"', b'typeface="Arial"').replace(
                b'typeface="Calibri Light"', b'typeface="Arial"')


def ajustar_tema(prs):
    """Tema só com as cores do padrão (MC-0020 e MC-0022): accent5 vira a borda e accent6 o laranja-escuro.
    O vermelho #D64545 (sinal grave) fica fixo só onde o original o usa (ícones) e o amarelo #F2C14E sai."""
    troca_tema = {'D64545': 'D9E6DA', 'F2C14E': '8A3F00'}
    fixo = {'accent5': 'D64545', 'accent6': 'F2C14E'}
    usados = {}
    for s in prs.slides:
        for clr in list(s._element.iter(A + 'schemeClr')):
            v = clr.get('val')
            if v in fixo:
                clr.getparent().replace(clr, etree.Element(A + 'srgbClr', val=fixo[v]))
                usados[fixo[v]] = usados.get(fixo[v], 0) + 1
    if usados.get('F2C14E'):
        parar('o amarelo #F2C14E saiu do padrão, mas um slide ainda o usa')
    for part in prs.part.package.iter_parts():
        if 'theme' in part.content_type and not hasattr(part, '_element'):
            b = part.blob
            for velho, novo in troca_tema.items():
                b = b.replace(f'<a:srgbClr val="{velho}"/>'.encode(), f'<a:srgbClr val="{novo}"/>'.encode())
            part._blob = b
    return usados


def trocar_rodape(prs, rodape):
    for lay in prs.slide_layouts:
        for t in lay._element.iter(A + 't'):
            if t.text and t.text.startswith('Treinamento Baterias BAP'):
                t.text = rodape


def zip_fixo(caminho):
    """Regrava o .pptx com data fixa nas entradas do zip: a mesma entrada dá o mesmo arquivo, byte a byte."""
    import zipfile
    with zipfile.ZipFile(caminho) as z:
        partes = [(i.filename, z.read(i.filename)) for i in z.infolist()]
    with zipfile.ZipFile(caminho, 'w', zipfile.ZIP_DEFLATED) as z:
        for nome, dados in partes:
            z.writestr(zipfile.ZipInfo(nome, date_time=(2026, 1, 1, 0, 0, 0)), dados, zipfile.ZIP_DEFLATED)


def montar(nome, saida=None):
    with open(os.path.join(AQUI, 'treinamentos', nome + '.json'), encoding='utf-8') as f:
        cfg = json.load(f)
    base = Base()
    prs = Presentation(MOLDE)
    molde_ref = Presentation(MOLDE)
    originais = list(prs.slides)
    icones = indice_icones()
    tmp = tempfile.mkdtemp(prefix='trein_')
    imgs = Imagens(base, molde_ref, tmp)

    for n, spec in enumerate(cfg['slides'], 1):
        src = originais[spec['molde'] - 1]
        s = clonar(prs, src)
        for c in spec.get('copiar', []):
            origem = originais[c['molde'] - 1] if 'molde' in c else s
            copiar_formas(s, origem, c['formas'], c.get('dx', 0), c.get('dy', 0))
        formas = list(s.shapes)
        onde = f'slide {n} (molde {spec["molde"]})'
        for k, v in spec.get('mover', {}).items():
            sh = formas[int(k)]
            for attr, val in zip(('left', 'top', 'width', 'height'), v):
                if val is not None:
                    setattr(sh, attr, Inches(val))
        for k, cor in spec.get('preencher', {}).items():
            sppr = formas[int(k)]._element.spPr
            for f in (sppr.find(A + 'solidFill'), sppr.find(A + 'ln/' + A + 'solidFill')):
                if f is None:
                    continue
                for ch in list(f):
                    f.remove(ch)
                etree.SubElement(f, A + 'schemeClr', val=cor)
        for k, v in spec.get('t', {}).items():
            v = base.expandir(v)
            base.conferir(v, onde)
            escrever(formas[int(k)].text_frame._txBody, v)
        for k, linhas in spec.get('tabela', {}).items():
            tab = formas[int(k)].table
            for i, linha in enumerate(linhas):
                for j, v in enumerate(linha):
                    v = base.expandir(v)
                    base.conferir(v, onde)
                    escrever(tab.cell(i, j).text_frame._txBody, v)
        for k, ref in spec.get('img', {}).items():
            trocar_imagem(s, formas[int(k)], imgs.caminho(ref))
        for k, nome_ic in spec.get('icone', {}).items():
            if nome_ic not in icones:
                parar(f'ícone {nome_ic} não existe nos originais ({onde})')
            trocar_imagem(s, formas[int(k)], io.BytesIO(icones[nome_ic]), conter=False)
        for k in sorted((int(x) for x in spec.get('apagar', [])), reverse=True):
            el = formas[k]._element
            el.getparent().remove(el)
        notas = base.expandir(spec.get('notas', '')).strip()
        if not notas:
            parar(f'{onde} sem notas')
        base.conferir(notas, onde + ' (notas)')
        if n == 1:
            notas += f'\n\nBASE\nCódigos e "Ofereça junto" conferidos na base unificada {base.vars["versao_base"]}.'
        s.notes_slide.notes_text_frame.text = notas
        if s.slide_layout.name == 'CONTENT':
            corrigir_cores(s)

    # tira os slides do original
    lista = prs.slides._sldIdLst
    for sid in list(lista)[:len(originais)]:
        prs.part.drop_rel(sid.rId)
        lista.remove(sid)
    trocar_fontes(prs)
    vermelho = ajustar_tema(prs).get('D64545', 0)
    trocar_rodape(prs, cfg['rodape'])
    destino = saida or os.path.join(AQUI, 'saidas', cfg['arquivo'])
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    prs.save(destino)
    zip_fixo(destino)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'{destino}: {len(cfg["slides"])} slides; códigos conferidos: {len(base.citados)}; base {base.vars["versao_base"]}; '
          f'vermelho de sinal grave em {vermelho} preenchimento(s)')
    return destino, cfg, base


# ---------------------------------------------------------------- simulação (PDF, PNG e mosaicos)

def pdf_de(pptx, pasta):
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', pasta, pptx],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return os.path.join(pasta, os.path.splitext(os.path.basename(pptx))[0] + '.pdf')


def pngs_de(pdf, pasta, prefixo, ppi=100):
    import pymupdf
    os.makedirs(pasta, exist_ok=True)
    saida = []
    for i, pg in enumerate(pymupdf.open(pdf), 1):
        p = os.path.join(pasta, f'{prefixo}_{i:02d}.png')
        pg.get_pixmap(dpi=ppi).save(p)
        saida.append(p)
    return saida


def mosaico(arquivos, destino, colunas, larg=667, rotulos=None):
    from PIL import ImageDraw, ImageFont
    alt = int(larg * 7.5 / 13.333)
    faixa = 34 if rotulos else 0
    linhas = (len(arquivos) + colunas - 1) // colunas
    m = 14
    tela = Image.new('RGB', (colunas * (larg + m) + m, linhas * (alt + faixa + m) + m), (225, 230, 226))
    d = ImageDraw.Draw(tela)
    try:
        fonte = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 20)
    except OSError:
        fonte = None
    for k, f in enumerate(arquivos):
        im = Image.open(f).convert('RGB').resize((larg, alt), Image.LANCZOS)
        x = m + (k % colunas) * (larg + m)
        y = m + (k // colunas) * (alt + faixa + m)
        if rotulos:
            d.text((x + 4, y + 6), rotulos[k], fill=(30, 43, 34), font=fonte)
        tela.paste(im, (x, y + faixa))
    tela.save(destino)


def simular(nome, pasta):
    os.makedirs(pasta, exist_ok=True)
    pptx, cfg, base = montar(nome, os.path.join(pasta, json.load(open(os.path.join(AQUI, 'treinamentos', nome + '.json'),
                                                                        encoding='utf-8'))['arquivo']))
    pdf = pdf_de(pptx, pasta)
    novos = pngs_de(pdf, os.path.join(pasta, 'slides'), 'slide')
    tmp = tempfile.mkdtemp(prefix='orig_')
    orig = pngs_de(pdf_de(MOLDE, tmp), tmp, 'orig')
    rep = cfg.get('mosaico', [1, 2, 6, 10, 21, 28, 39, 43])
    mosaico([novos[i - 1] for i in rep], os.path.join(pasta, 'mosaico_8_slides.png'), 2, larg=900,
            rotulos=[f'Slide {i}' for i in rep])
    pares = cfg.get('pares', [])
    arqs, rot = [], []
    for i in pares:
        mo = cfg['slides'][i - 1]['molde']
        arqs += [orig[mo - 1], novos[i - 1]]
        rot += [f'ORIGINAL Baterias · slide {mo}', f'NOVO Mecânica Básica · slide {i}']
    if arqs:
        mosaico(arqs, os.path.join(pasta, 'comparativo_original_x_novo.png'), 2, larg=800, rotulos=rot)
    shutil.rmtree(tmp, ignore_errors=True)
    print(pdf)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if '--sim' in sys.argv:
        simular(sys.argv[1], sys.argv[sys.argv.index('--sim') + 1])
    else:
        montar(sys.argv[1])
