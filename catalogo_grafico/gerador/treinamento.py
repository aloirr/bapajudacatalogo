"""Treinamentos BAP no padrão (T-0032): lê o conteúdo em treinamentos/<nome>.json, completa com a base
unificada (só leitura) e chama o treinamento_ppt.js, que desenha o .pptx.

Uso (dentro de catalogo_grafico/gerador/):
    python treinamento.py mecanica_basica                 # gera saidas/<arquivo>.pptx
    python treinamento.py mecanica_basica --png PASTA     # e também os PNGs de cada slide (LibreOffice + PyMuPDF, 150 ppi)

O que vem da base:
- slide "sistemas": a quantidade de itens no catálogo por SISTEMA (NO_CATALOGO_DIGITAL = SIM e fora de INATIVO);
- slide "hub": os códigos de cada cartão e o OFEREÇA JUNTO, filtrado pelo veículo do slide;
- todo código citado em qualquer texto é conferido: tem de existir na base e estar ATIVO, senão o script para.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(AQUI, '..', '..', 'dados', 'BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx')
RE_COD = re.compile(r'\b[A-Z]{2,4}-?[A-Z]?\d{3,6}[A-Z]?\b')
NAO_CODIGO = {'SPE4', 'CV'}


def parar(msg):
    sys.exit('[PARADO] ' + msg)


def carregar_base():
    df = pd.read_excel(BASE, sheet_name='PRODUTOS', dtype=str).fillna('')
    return df, {r.CODIGO_BAP: r for r in df.itertuples()}


def ativo(cod, idx):
    r = idx.get(cod)
    if r is None:
        parar(f'código {cod} não está na base')
    if r.STATUS_CADASTRO != 'ATIVO':
        parar(f'código {cod} está {r.STATUS_CADASTRO} na base')
    return r


def sistemas(s, df):
    cat = df[(df.NO_CATALOGO_DIGITAL == 'SIM') & (df.STATUS_CADASTRO != 'INATIVO')]
    n = cat.groupby('SISTEMA').size()
    faltam = set(n.index) - set(s['funcoes']) - {'OUTROS'}
    if faltam:
        parar('sistema novo na base sem texto no slide: ' + ', '.join(sorted(faltam)))
    s['cartoes'] = [[nome.capitalize(), txt, f'{int(n.get(nome, 0)):,}'.replace(',', '.')]
                    for nome, txt in s['funcoes'].items()]


def hub(s, idx):
    vei = s['veiculo'].upper()
    for c in s['cartoes']:
        for cod in c['codigos']:
            if vei not in ativo(cod, idx).APLICACAO.upper():
                parar(f'{cod} não tem {vei} na aplicação')
        if c['junto'] == 'base':
            oj = []
            for cod in c['codigos']:
                oj += [x.strip() for x in idx[cod].OFERECA_JUNTO.split('·') if x.strip()]
            oj = [x for x in dict.fromkeys(oj) if x in idx and idx[x].STATUS_CADASTRO == 'ATIVO'
                  and vei in idx[x].APLICACAO.upper() and x not in c['codigos']]
        else:
            oj = [ativo(x, idx).CODIGO_BAP for x in c['junto']]
        if not oj:
            parar(f'cartão {c["titulo"]}: sem OFEREÇA JUNTO real para {vei} (regra: sem item, não entra)')
        # nome do produto do Catálogo BAP (PRODUTO da base); o JSON só detalha o que o PRODUTO não diz (ex.: Filtros)
        grupos = {}
        for x in oj:
            grupos.setdefault(s.get('nomes', {}).get(x) or idx[x].PRODUTO, []).append(x)
        c['linha_codigo'] = ' · '.join(c['codigos'])
        c['linha_junto'] = '; '.join(f'{nome} {" · ".join(cs)}' for nome, cs in grupos.items()) + (f' ({c["obs_junto"]})' if c.get('obs_junto') else '')


def versao_base():
    vs = [int(m.group(1)) for f in os.listdir(os.path.join(os.path.dirname(BASE), 'versoes'))
          if (m := re.search(r'_v(\d+)\.xlsx$', f))]
    return f'v{max(vs)}' if vs else 'sem versão em dados/versoes'


def textos(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, list):
        for x in o:
            yield from textos(x)
    elif isinstance(o, dict):
        for k, x in o.items():
            if k not in ('nomes', 'funcoes', 'tipo', 'veiculo'):
                yield from textos(x)


def conferir_codigos(spec, idx):
    for t in textos(spec['slides']):
        for cod in RE_COD.findall(t):
            if cod not in NAO_CODIGO and not cod.startswith(('API', 'SAE', 'DOT')):
                ativo(cod, idx)


def png(pptx, pasta):
    os.makedirs(pasta, exist_ok=True)
    tmp = tempfile.mkdtemp()
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', tmp, pptx], check=True, capture_output=True)
    import pymupdf as fitz
    pdf = fitz.open(os.path.join(tmp, os.path.basename(pptx)[:-5] + '.pdf'))
    for i, p in enumerate(pdf, 1):
        p.get_pixmap(dpi=150).save(os.path.join(pasta, f'slide_{i:02d}.png'))
    shutil.rmtree(tmp)
    return len(pdf)


def main():
    if len(sys.argv) < 2:
        parar('uso: python treinamento.py <nome> [--png PASTA]')
    nome = sys.argv[1]
    spec = json.load(open(os.path.join(AQUI, 'treinamentos', nome + '.json'), encoding='utf-8'))
    df, idx = carregar_base()
    for s in spec['slides']:
        if s['tipo'] == 'sistemas':
            sistemas(s, df)
        elif s['tipo'] == 'hub':
            hub(s, idx)
    conferir_codigos(spec, idx)
    # S11: a versão da base vai nas notas da capa, não no slide
    capa = next(s for s in spec['slides'] if s['tipo'] == 'capa')
    capa.setdefault('notas', {})['BASE'] = f'Números e códigos da base unificada {versao_base()}, lida na geração.'
    os.makedirs(os.path.join(AQUI, 'saidas'), exist_ok=True)
    resolvido = os.path.join(AQUI, 'saidas', f'treinamento_{nome}.json')
    json.dump(spec, open(resolvido, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    pptx = os.path.join(AQUI, 'saidas', spec['arquivo'] + '.pptx')
    subprocess.run(['node', os.path.join(AQUI, 'treinamento_ppt.js'), resolvido, pptx], check=True, cwd=AQUI)
    print('ok', pptx)
    if '--png' in sys.argv:
        print('png', png(pptx, sys.argv[sys.argv.index('--png') + 1]), 'slides')


if __name__ == '__main__':
    main()
