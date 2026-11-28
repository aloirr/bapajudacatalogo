"""Treinamentos BAP pelo molde do original (T-0032).

O deck novo é montado DUPLICANDO os slides do treinamento original de Baterias (o mesmo tema, layouts, formas,
ícones e molduras) e trocando só o conteúdo, que vem de treinamentos/<nome>.json:

    {"arquivo": "...pptx", "rodape": "...", "slides": [
        {"molde": 7,                                # nº do slide-modelo no original de Baterias
         "t": {"1": "Título", "4": "01  |Motor\\n02  |Arrefecimento"},
         "img": {"3": "desenho:motor_corte"},      # desenho:, foto:CÓDIGO, capa:cover_15, orig:image-6-1.png,
                                                   # montagem:foto:A+foto:B, girar:-30:capa:catraca
         "icone": {"6": "FaWrench"},               # ícone branco tirado dos 3 originais
         "tabela": {"2": [["a", "b", "c"], ...]},  # troca o texto das células, linha a linha
         "mover": {"3": [x, y, w, h]},             # polegadas (null mantém)
         "preencher": {"38": "accent1"},           # cor de tema do preenchimento e do contorno
         "apagar": [9, 10],
         "copiar": [{"formas": [32, 33], "dy": 1.2}],   # cópias entram no fim (índices seguintes); "molde": N copia
                                                       # de outro slide do original
         "italico": {"4": ["0,2"]},                # na célula, os trechos depois do 1.º ficam em itálico
         "respiro": {"6": 0.08},                   # margem de cima e de baixo das células da tabela (polegadas)
         "altura_linhas": {"3": [0.65]},           # altura de cada linha da tabela (polegadas; null mantém)
         "notas": "MENSAGEM-CHAVE\\n..."}],
     "negrito_uma_coluna": true,                   # corpo da tabela com negrito só na 1.ª coluna que não é só número
     "nota_base": false}                           # ver Travas

Texto: "\\n" separa parágrafos e "|" separa trechos (runs); o trecho k herda a formatação do trecho k do modelo
(ex.: "DICA DE CAMPO  |texto"). Índices = ordem das formas do slide-modelo (python inv. em LEIA_GERADOR.md).

Macros no texto e nas notas: {{cod:AMT7004}} (confere na base e escreve o código), {{oj:AMT7004}} (o OFEREÇA JUNTO
da base), {{prod:Cubo de Roda}} (confere o PRODUTO), {{n_itens}}, {{n_produtos}}, {{n_sistemas}}, {{versao_base}}.

Travas ([PARADO]): código fora da base ou não ATIVO; "estoque" ou "R$" em qualquer texto ou nota; foto de código
inexistente; slide sem notas; bloco BASE num deck sem código (use "nota_base": false).

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
import treinamento_tipos
from detalhe import BASE_UNIFICADA as BASE      # o caminho da base unificada, o mesmo do Portfólio e dos 3 PDFs
from plural import fmt
from taxo import grafia_bap

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.normpath(os.path.join(AQUI, '..', '..'))
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
# o que tem cara de código: varrido no deck inteiro (textos, tabelas e notas); fora da base, para
RE_PARECE = re.compile(r'\b(?:[A-Z]{2,4}\d{2,8}[A-Z]?|\d{2,3}A?[DE]-[A-Z]{1,5}-\d{2}|\d{4}-2(?:RS|Z)|CV-[A-Z]\d{2,3})\b')

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
            'n_itens': fmt(len(cat)),
            'n_produtos': str(cat.PRODUTO.nunique()),
            'n_sistemas': str(cat[cat.SISTEMA.ne('OUTROS') & cat.SISTEMA.ne('')].SISTEMA.nunique()),
            'versao_base': re.search(r'_(v\d+)\.xlsx$', vs[-1]).group(1) if vs else '?',
        }
        self.citados = set()
        cods = sorted((c for c in self.idx if len(c) >= 4), key=len, reverse=True)
        self.rx_base = re.compile('|'.join(r'(?<![\w-])' + re.escape(c) + r'(?![\w-])' for c in cods))

    def campo(self, cod, nome):
        m = re.search(re.escape(nome) + r'\s*:\s*([^|]+)', self.ativo(cod).DADOS_ADICIONAIS)
        if not m:
            parar(f'campo "{nome}" não está nos DADOS_ADICIONAIS de {cod}')
        return m.group(1).strip()

    def faixa_ah(self, padrao, linha=None):
        b = self.df[(self.df.PRODUTO == 'Baterias') & (self.df.STATUS_CADASTRO == 'ATIVO')
                    & self.df.CODIGO_BAP.str.contains(padrao, regex=True)]
        if linha:
            b = b[b.LINHA == linha]
        if b.empty:
            parar(f'nenhuma bateria ATIVA casa com {padrao} {linha or ""}')
        ah = sorted(int(re.match(r'\d+', c).group(0)) for c in b.CODIGO_BAP)
        return f'{ah[0]} Ah' if ah[0] == ah[-1] else f'{ah[0]} a {ah[-1]} Ah'

    def conferir_deck(self, txt, onde, nao_codigo=()):
        """Varredura final: todo código citado existe e está ATIVO; o que parece código e não está na base para."""
        if PROIBIDO.search(txt):
            parar(f'palavra proibida ("estoque" ou "R$") em {onde}: ...{txt[max(0, PROIBIDO.search(txt).start() - 40):][:90]!r}')
        for m in self.rx_base.finditer(txt):
            self.ativo(m.group(0))
        resto = self.rx_base.sub(' ', txt)
        for m in RE_PARECE.finditer(resto):
            t = m.group(0)
            if t in nao_codigo:
                continue
            if 'ROL' + t in self.idx:          # rolamento citado pela designação (6201-2RS = ROL6201-2RS)
                self.ativo('ROL' + t)
                continue
            parar(f'"{t}" parece código, mas não está na base ({onde}); se não for código, ponha em "nao_codigo"')

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
                cods = []
                for x in oj:   # o código inteiro da base (ex.: ROL102949/102910) ou o que tem cara de código
                    m = self.rx_base.search(x) or RE_COD.search(x)
                    if m:
                        cods.append(m.group(0))
                for c in cods:
                    self.ativo(c)
                return ' · '.join(cods) if cods else '—'
            if tipo == 'dado':
                cod, nome = arg.split(';', 1)
                return self.campo(cod, nome)
            if tipo == 'metade':
                cod, nome = arg.split(';', 1)
                v = float(self.campo(cod, nome).replace(',', '.'))
                return str(int(v / 2 + 0.5))
            if tipo == 'ah':
                padrao, _, linha = arg.partition(';')
                return self.faixa_ah(padrao, linha or None)
            if tipo == 'api':          # norma API da DESCRICAO (ex.: "API SN")
                m = re.search(r'API ([A-Z]{2}(?:/[A-Z]{2})?|GL-\d)', self.ativo(arg).DESCRICAO)
                if not m:
                    parar(f'{arg}: a DESCRICAO não tem a norma API')
                return 'API ' + m.group(1)
            if tipo == 'oleo_base':    # Mineral, Semissintético ou Sintético, pela DESCRICAO
                d = self.ativo(arg).DESCRICAO
                for k, v in (('SEMISSINT', 'Semissintético'), ('SINT', 'Sintético'), ('MINERAL', 'Mineral')):
                    if k in d:
                        return v
                parar(f'{arg}: a DESCRICAO não diz a base do óleo')
            if tipo == 'n':            # quantos itens ATIVOS há no PRODUTO
                n = int(((self.df.PRODUTO == arg) & (self.df.STATUS_CADASTRO == 'ATIVO')).sum())
                if not n:
                    parar(f'nenhum item ATIVO no produto "{arg}"')
                return str(n)
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
        for m in self.rx_base.finditer(txt):
            self.ativo(m.group(0))
        for cod in RE_COD.findall(self.rx_base.sub(' ', txt)):
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
        if ref.startswith('girar:'):     # girar:-30:capa:catraca (graus, anti-horário; peça comprida fica mais alta)
            _, graus, resto = ref.split(':', 2)
            im = Image.open(self.caminho(resto)).convert('RGBA').rotate(float(graus), expand=True, resample=Image.BICUBIC)
            p = os.path.join(self.tmp, 'girada_%d.png' % len(self.usadas))
            aparar(im).save(p)
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

def relacionar(destino, rel, mesmo_pacote):
    """Relação no slide novo para o alvo da relação do slide de origem (imagem de outro arquivo vira parte nova)."""
    if rel.is_external:
        return destino.relate_to(rel.target_ref, rel.reltype, is_external=True)
    if mesmo_pacote:
        return destino.relate_to(rel.target_part, rel.reltype)
    if rel.reltype != RT.IMAGE:
        parar(f'o slide de outro arquivo tem uma relação que não é imagem ({rel.reltype})')
    return destino.get_or_add_image_part(io.BytesIO(rel.target_part.blob))[1]


def clonar(prs, src):
    mesmo = src.part.package is prs.part.package
    layout = src.slide_layout if mesmo else next(
        (l for l in prs.slide_layouts if l.name == src.slide_layout.name), None)
    if layout is None:
        parar(f'o layout {src.slide_layout.name} não existe no original')
    novo = prs.slides.add_slide(layout)
    arvore = novo.shapes._spTree
    for el in list(arvore)[2:]:
        arvore.remove(el)
    mapa = {}
    for rid, rel in src.part.rels.items():
        if rel.reltype in (RT.SLIDE_LAYOUT, RT.NOTES_SLIDE):
            continue
        mapa[rid] = relacionar(novo.part, rel, mesmo)
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
                        no.set(at, relacionar(s.part, origem.part.rels[rid],
                                              origem.part.package is s.part.package))
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


def tirar_coluna(forma, j):
    """Tira a coluna j da tabela e reparte a largura dela entre as outras (a tabela fica com a mesma largura)."""
    tbl = forma._element.find('.//' + A + 'tbl')
    grade = tbl.find(A + 'tblGrid')
    cols = grade.findall(A + 'gridCol')
    w = int(cols[j].get('w'))
    grade.remove(cols[j])
    resto = [c for k, c in enumerate(cols) if k != j]
    tot = sum(int(c.get('w')) for c in resto)
    for c in resto:
        c.set('w', str(int(c.get('w')) + int(w * int(c.get('w')) / tot)))
    for tr in tbl.findall(A + 'tr'):
        tr.remove(tr.findall(A + 'tc')[j])


def negrito_uma_coluna(formas):
    """Negrito no corpo da tabela numa coluna só: a 1.ª que não é só número (T-0038, O6). O cabeçalho (linha 0 da
    1.ª tabela do slide) fica como está. Vale para o slide inteiro, que pode ter uma tabela por linha."""
    tabs = [f for f in formas if getattr(f, 'has_table', False) and f.has_table]
    if not tabs:
        return
    corpo = [(t, i) for n, t in enumerate(tabs) for i in range(len(t.table.rows)) if n or i]
    ncol = len(tabs[0].table.columns)
    alvo = next((j for j in range(ncol)
                 if not all(re.fullmatch(r'\d*', t.table.cell(i, j).text_frame.text.strip()) for t, i in corpo)), 0)
    for t, i in corpo:
        for j in range(ncol):
            for rpr in t.table.cell(i, j).text_frame._txBody.iter(A + 'rPr'):
                rpr.set('b', '1' if j == alvo else '0')


def trocar_textos(elemento, pares, onde, contagem):
    """Troca trechos de texto (dentro de um mesmo trecho de formatação) em todos os a:t do elemento."""
    for t in elemento.iter(A + 't'):
        if not t.text:
            continue
        for velho, novo in pares:
            if velho in t.text:
                t.text = t.text.replace(velho, novo)
                contagem[velho] = contagem.get(velho, 0) + 1


def formatar_notas(texto):
    """Nota solta (sem os blocos) vira MENSAGEM-CHAVE + COMO CONDUZIR (+ RESPOSTAS ou FONTES), sem mudar o conteúdo."""
    if texto.startswith('MENSAGEM-CHAVE'):
        return texto
    texto = re.sub(r'(?<!\.)\.\.(?!\.)', '.', texto.strip())
    if texto.startswith('Respostas:'):
        return ('MENSAGEM-CHAVE\nO teste fixa os pontos principais do treinamento.\n\nCOMO CONDUZIR\n'
                'Leia uma pergunta por vez e peça a resposta a alguém diferente.\n\nRESPOSTAS\n' + texto[10:].strip())
    frases = re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9“"])', texto)
    fontes = [f for f in frases if f.startswith(('Fonte', 'Fontes'))]
    frases = [f for f in frases if f not in fontes]
    out = 'MENSAGEM-CHAVE\n' + frases[0]
    if len(frases) > 1:
        out += '\n\nCOMO CONDUZIR\n' + ' '.join(frases[1:])
    if fontes:
        out += '\n\nFONTES\n' + ' '.join(fontes)
    return out


def expandir_slides(cfg, n_original):
    """Treinamento atualizado: todos os slides do original, na ordem, com "editar" e "inserir_depois" (nº do original)."""
    if 'slides' in cfg:
        return cfg
    editar, inserir = cfg.get('editar', {}), cfg.get('inserir_depois', {})
    tirar = set(cfg.get('remover', []))
    slides, nova = [], {}
    for i in range(1, n_original + 1):
        if i not in tirar:
            slides.append(dict({'molde': i}, **editar.get(str(i), {})))
            nova[i] = len(slides)
        slides += inserir.get(str(i), [])
    cfg['slides'] = slides
    cfg['pares'] = [nova[i] for i in cfg.get('pares_original', [])]
    cfg['mosaico'] = [nova[i] for i in cfg.get('mosaico_original', [])] + cfg.get('mosaico_novos', [])
    return cfg


def kicker(sh):
    return sh.is_placeholder and sh.placeholder_format.idx == 102


def aplicar_grafia(slide):
    """Grafia dos nomes de linha (ProActive, Shiftease, Effitech; taxo.LINHA_BAP): fora do kicker, que é todo em caixa
    alta."""
    for sh in slide.shapes:
        if not kicker(sh):
            for t in sh._element.iter(A + 't'):
                if t.text:
                    t.text = grafia_bap(t.text)
    if slide.has_notes_slide:
        for t in slide.notes_slide._element.iter(A + 't'):
            if t.text:
                t.text = grafia_bap(t.text)


def renumerar(slide, mapa):
    """Renumera os módulos (kicker "MÓDULO 04 ·" e o número da divisória) quando entra um módulo novo."""
    for t in slide._element.iter(A + 't'):
        if t.text:
            t.text = re.sub(r'MÓDULO (\d\d)', lambda m: 'MÓDULO ' + mapa.get(m.group(1), m.group(1)), t.text)
    if slide.slide_layout.name == 'SECTION':
        sh = list(slide.shapes)[0]
        if sh.has_text_frame and sh.text_frame.text.strip() in mapa:
            for t in sh._element.iter(A + 't'):
                if t.text and t.text.strip() in mapa:
                    t.text = mapa[t.text.strip()]


def textos_do_slide(slide):
    """Todos os textos do slide (formas, grupos, tabelas) e das notas, lidos do XML sem alterá-lo."""
    def texto(el):
        return '\n'.join(''.join(t.text or '' for t in p.iter(A + 't')) for p in el.iter(A + 'p'))
    out = [texto(tb) for tb in slide._element.iter('{%s}txBody' % NS['p'], A + 'txBody')]
    if slide.has_notes_slide:
        out.append(slide.notes_slide.notes_text_frame.text)
    return out


def link_por_palavra(txBody):
    """Divide o trecho com hyperlink em uma palavra por trecho (o espaço fica fora do link): no LibreOffice o
    link vira um campo que não quebra entre palavras."""
    for r in list(txBody.iter(A + 'r')):
        rpr = r.find(A + 'rPr')
        if rpr is None or rpr.find(A + 'hlinkClick') is None:
            continue
        partes = re.split(r'( )', r.find(A + 't').text or '')
        pai, pos = r.getparent(), r.getparent().index(r)
        pai.remove(r)
        for k, parte in enumerate(p for p in partes if p):
            novo = copy.deepcopy(r)
            novo.find(A + 't').text = parte
            if parte == ' ':
                h = novo.find(A + 'rPr').find(A + 'hlinkClick')
                novo.find(A + 'rPr').remove(h)
            pai.insert(pos + k, novo)


def cor_do_texto(forma, cor):
    """Pinta todos os trechos da forma: cor de tema (tx2...) ou hex."""
    for rpr in forma._element.iter(A + 'rPr'):
        for f in rpr.findall(A + 'solidFill'):
            rpr.remove(f)
        sf = etree.Element(A + 'solidFill')
        etree.SubElement(sf, A + ('srgbClr' if re.fullmatch(r'[0-9A-F]{6}', cor) else 'schemeClr'), val=cor)
        rpr.insert(0, sf)


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
        if getattr(sh, 'has_table', False) and sh.has_table:
            # tabela: fundo claro; texto vermelho vira laranja-escuro (MC-0024); cabeçalho fica como está
            for clr in sh._element.iter(A + 'schemeClr'):
                pai = clr.getparent()
                if clr.get('val') == 'accent5' and pai.tag == A + 'solidFill' and pai.getparent().tag == A + 'rPr':
                    pai.replace(clr, etree.Element(A + 'srgbClr', val=LARANJA_TEXTO))
            continue
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
            elif not escuro and v == 'accent5' and fundo != 'accent5':   # texto vermelho em fundo claro (MC-0024)
                pai.replace(clr, etree.Element(A + 'srgbClr', val=LARANJA_TEXTO))
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
        elif 'theme' in ct or 'extended-properties' in ct:   # tema e a lista de fontes do docProps/app.xml
            part._blob = part.blob.replace(b'typeface="Calibri"', b'typeface="Arial"').replace(
                b'typeface="Calibri Light"', b'typeface="Arial"').replace(b'>Calibri<', b'>Arial<')


def ajustar_tema(prs):
    """Tema só com as cores do padrão (MC-0020 e MC-0022): accent5 vira a borda e accent6 o laranja-escuro.
    O vermelho #D64545 (sinal grave) e o amarelo #F2C14E saem do tema e ficam gravados direto só onde o original
    os usa (os ícones de sinal grave; nos atualizados, as faixas de leitura de tensão), para não mudarem de cor."""
    troca_tema = {'D64545': 'D9E6DA', 'F2C14E': '8A3F00'}
    fixo = {'accent5': 'D64545', 'accent6': 'F2C14E'}
    usados = {}
    for s in prs.slides:
        for clr in list(s._element.iter(A + 'schemeClr')):
            v = clr.get('val')
            if v in fixo:
                clr.getparent().replace(clr, etree.Element(A + 'srgbClr', val=fixo[v]))
                usados[fixo[v]] = usados.get(fixo[v], 0) + 1
    for part in prs.part.package.iter_parts():
        if 'theme' in part.content_type and not hasattr(part, '_element'):
            b = part.blob
            for velho, novo in troca_tema.items():
                b = b.replace(f'<a:srgbClr val="{velho}"/>'.encode(), f'<a:srgbClr val="{novo}"/>'.encode())
            part._blob = b
    return usados


def trocar_rodape(prs, rodape):
    achou = 0
    for lay in prs.slide_layouts:
        for t in lay._element.iter(A + 't'):
            if t.text and t.text.startswith('Treinamento ') and 'Equipe Comercial' in t.text:
                t.text = rodape
                achou += 1
    if not achou:
        parar('rodapé do layout não encontrado')


def tirar_midia_orfa(prs):
    """Solta as relações de mídia que o XML da parte não cita (imagem trocada ou forma apagada). Sem a relação,
    o arquivo não vai para o pacote: nenhuma imagem escondida (ex.: logo de terceiro do original)."""
    ns_r = '{%s}' % NS['r']
    soltas = 0
    for part in prs.part.package.iter_parts():
        el = getattr(part, '_element', None)
        if el is None:
            continue
        citados = {v for no in el.iter() for k, v in no.attrib.items() if k.startswith(ns_r)}
        for rid, rel in list(part.rels.items()):
            if rel.is_external or rid in citados:
                continue
            if rel.reltype in (RT.IMAGE, RT.MEDIA, RT.VIDEO, 'http://schemas.microsoft.com/office/2007/relationships/media'):
                part.rels.pop(rid)
                soltas += 1
    return soltas


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
    arq_original = os.path.join(ORIGINAIS, cfg.get('original', os.path.basename(MOLDE)))
    prs = Presentation(arq_original)
    molde_ref = Presentation(arq_original)
    originais = list(prs.slides)
    cfg = expandir_slides(cfg, len(originais))
    cfg = treinamento_tipos.expandir_cfg(cfg)
    outros = {}
    contagem = {}
    nao_codigo = set(cfg.get('nao_codigo', []))
    nota_base = cfg.get('nota_base', True)
    icones = indice_icones()
    tmp = tempfile.mkdtemp(prefix='trein_')
    imgs = Imagens(base, molde_ref, tmp)

    for n, spec in enumerate(cfg['slides'], 1):
        if 'de' in spec:
            if spec['de'] not in outros:
                outros[spec['de']] = Presentation(os.path.join(ORIGINAIS, spec['de']))
            src = list(outros[spec['de']].slides)[spec['molde'] - 1]
        else:
            src = originais[spec['molde'] - 1]
        s = clonar(prs, src)
        if cfg.get('renumerar') and 'de' not in spec and not spec.get('nao_renumerar'):
            renumerar(s, cfg['renumerar'])
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
        for k, cols in spec.get('tirar_coluna', {}).items():
            # "*" = todas as tabelas do slide (há slides com uma tabela por linha)
            alvos = [f for f in formas if getattr(f, 'has_table', False) and f.has_table] if k == '*' else [formas[int(k)]]
            for f in alvos:
                for j in sorted(cols, reverse=True):
                    tirar_coluna(f, j)
        for k, larg in spec.get('larguras', {}).items():   # largura das colunas, em polegadas
            cols = formas[int(k)]._element.find('.//' + A + 'tblGrid').findall(A + 'gridCol')
            if len(cols) != len(larg):
                parar(f'{onde}: a tabela {k} tem {len(cols)} colunas')
            for c, w in zip(cols, larg):
                c.set('w', str(int(Inches(w))))
        for k, cels in spec.get('cor_celulas', {}).items():
            tab = formas[int(k)].table
            for rc, cor in cels.items():
                i, j = (int(x) for x in rc.split(','))
                for rpr in tab.cell(i, j).text_frame._txBody.iter(A + 'rPr'):
                    for f in rpr.findall(A + 'solidFill'):
                        rpr.remove(f)
                    rpr.insert(0, etree.Element(A + 'solidFill'))
                    etree.SubElement(rpr[0], A + 'schemeClr', val=cor)
        for k, linhas in spec.get('tabela', {}).items():
            tab = formas[int(k)].table
            for i, linha in enumerate(linhas):
                for j, v in enumerate(linha):
                    v = base.expandir(v)
                    base.conferir(v, onde)
                    escrever(tab.cell(i, j).text_frame._txBody, v)
        for k, cels in spec.get('celulas', {}).items():
            tab = formas[int(k)].table
            for rc, v in cels.items():
                i, j = (int(x) for x in rc.split(','))
                v = base.expandir(v)
                base.conferir(v, onde)
                escrever(tab.cell(i, j).text_frame._txBody, v)
        for k, alts in spec.get('altura_linhas', {}).items():   # altura de cada linha da tabela (pol.; null mantém)
            trs = formas[int(k)]._element.findall('.//' + A + 'tr')
            if len(trs) != len(alts):
                parar(f'{onde}: a tabela {k} tem {len(trs)} linhas')
            for tr, h in zip(trs, alts):
                if h is not None:
                    tr.set('h', str(int(Inches(h))))
        for k, cels in spec.get('italico', {}).items():
            tab = formas[int(k)].table
            for rc in cels:
                i, j = (int(x) for x in rc.split(','))
                for p in tab.cell(i, j).text_frame._txBody.findall(A + 'p'):
                    for r in p.findall(A + 'r')[1:]:
                        rpr = r.find(A + 'rPr')
                        if rpr is None:
                            rpr = etree.Element(A + 'rPr')
                            r.insert(0, rpr)
                        rpr.set('i', '1')
        for k, m in spec.get('respiro', {}).items():
            for tcpr in formas[int(k)]._element.iter(A + 'tcPr'):
                tcpr.set('marT', str(int(Inches(m))))
                tcpr.set('marB', str(int(Inches(m))))
        if cfg.get('negrito_uma_coluna'):
            negrito_uma_coluna(formas)
        for k in spec.get('link_por_palavra', []):
            link_por_palavra(formas[int(k)].text_frame._txBody)
        for k, pt in spec.get('tamanho', {}).items():      # tamanho da fonte (pt) de todos os trechos da forma
            for rpr in formas[int(k)]._element.iter(A + 'rPr', A + 'endParaRPr'):
                rpr.set('sz', str(int(pt * 100)))
        for k, cor in spec.get('cor_texto', {}).items():
            cor_do_texto(formas[int(k)], cor)
        for k, ref in spec.get('img', {}).items():
            trocar_imagem(s, formas[int(k)], imgs.caminho(ref))
        for k, nome_ic in spec.get('icone', {}).items():
            if nome_ic not in icones:
                parar(f'ícone {nome_ic} não existe nos originais ({onde})')
            trocar_imagem(s, formas[int(k)], io.BytesIO(icones[nome_ic]), conter=False)
        for k in sorted((int(x) for x in spec.get('apagar', [])), reverse=True):
            el = formas[k]._element
            el.getparent().remove(el)
        if 'notas' in spec:
            notas = base.expandir(spec['notas']).strip()
        else:   # atualizado: as notas do original ficam (com as trocas abaixo), no formato do original
            notas = src.notes_slide.notes_text_frame.text.strip() if src.has_notes_slide else ''
            if notas and cfg.get('formatar_notas'):
                notas = formatar_notas(notas)
        if not notas:
            parar(f'{onde} sem notas')
        if n == 1 and nota_base:
            notas = re.sub(r'\n*BASE\n.*$', '', notas, flags=re.S)
            notas += f'\n\nBASE\nCódigos e "Ofereça junto" conferidos na base unificada {base.vars["versao_base"]}.'
        s.notes_slide.notes_text_frame.text = notas
        pares = [(base.expandir(a), base.expandir(b)) for a, b in spec.get('trocar', [])]
        trocar_textos(s._element, pares, onde, contagem)
        trocar_textos(s.notes_slide._element, pares, onde, contagem)
        for a, _ in spec.get('trocar', []):
            if not contagem.get(base.expandir(a)):
                parar(f'{onde}: o trecho a trocar não foi achado: {a!r}')
        globais = cfg.get('trocar', [])
        trocar_textos(s._element, globais, onde, contagem)
        trocar_textos(s.notes_slide._element, globais, onde, contagem)
        aplicar_grafia(s)
        for txt in textos_do_slide(s):
            base.conferir_deck(txt, onde, nao_codigo)
        if s.slide_layout.name == 'CONTENT':
            corrigir_cores(s)

    for a, _ in cfg.get('trocar', []):
        if not contagem.get(a):
            parar(f'troca global sem efeito: {a!r}')
    if nota_base and not base.citados:
        parar('o bloco BASE da capa diz "códigos conferidos", mas o deck não cita código; use "nota_base": false')

    # tira os slides do original
    lista = prs.slides._sldIdLst
    for sid in list(lista)[:len(originais)]:
        prs.part.drop_rel(sid.rId)
        lista.remove(sid)
    trocar_fontes(prs)
    vermelho = ajustar_tema(prs).get('D64545', 0)
    trocar_rodape(prs, cfg['rodape'])
    orfas = tirar_midia_orfa(prs)
    destino = saida or os.path.join(AQUI, 'saidas', cfg['arquivo'])
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    prs.save(destino)
    zip_fixo(destino)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'{destino}: {len(cfg["slides"])} slides; códigos conferidos: {len(base.citados)}; base {base.vars["versao_base"]}; '
          f'vermelho de sinal grave em {vermelho} preenchimento(s); relações de mídia sem uso tiradas: {orfas}')
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
    """PDF de apoio (S9), PNG a 100 ppi, mosaico de 8 slides e comparativo original × novo (pares do JSON)."""
    os.makedirs(pasta, exist_ok=True)
    with open(os.path.join(AQUI, 'treinamentos', nome + '.json'), encoding='utf-8') as f:
        arquivo = json.load(f)['arquivo']
    pptx, cfg, base = montar(nome, os.path.join(pasta, arquivo))
    pdf = pdf_de(pptx, pasta)
    shutil.rmtree(os.path.join(pasta, 'slides'), ignore_errors=True)
    novos = pngs_de(pdf, os.path.join(pasta, 'slides'), 'slide')
    tmp = tempfile.mkdtemp(prefix='orig_')
    origens = {}

    def png_original(arq, k):
        if arq not in origens:
            pasta_o = os.path.join(tmp, str(len(origens)))
            os.makedirs(pasta_o)
            origens[arq] = pngs_de(pdf_de(os.path.join(ORIGINAIS, arq), pasta_o), pasta_o, 'orig')
        return origens[arq][k - 1]

    rep = cfg.get('mosaico', [1, 2, 6, 10, 21, 28, 39, 43])
    mosaico([novos[i - 1] for i in rep], os.path.join(pasta, 'mosaico_8_slides.png'), 2, larg=900,
            rotulos=[f'Slide {i}' for i in rep])
    titulo = cfg.get('titulo', nome)
    arqs, rot = [], []
    for i in cfg.get('pares', []):
        spec = cfg['slides'][i - 1]
        arq = spec.get('de', cfg.get('original', os.path.basename(MOLDE)))
        nome_o = re.sub(r'^Treinamento_|_BAP.*$', '', arq).replace('_', ' ')
        arqs += [png_original(arq, spec['molde']), novos[i - 1]]
        rot += [f'ORIGINAL {nome_o} · slide {spec["molde"]}', f'NOVO {titulo} · slide {i}']
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
