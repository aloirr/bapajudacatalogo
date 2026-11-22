"""Varredura das quebras de palavra e de código nos PDFs (B8, T-0019).

Gera um dos 3 PDFs (a4, digital ou moto) e lista cada lugar onde o ReportLab teve de partir uma palavra (texto sem
espaço mais largo que a coluna), com a página. Tipo da quebra:
  meio       a palavra ou o código partiu entre duas letras (o que não pode);
  separador  partiu logo depois de um separador do quebra.SEP (a palavra fica inteira);
  marca      partiu no espaço inseparável (marca numa linha, código na de baixo; ou a palavra do sem_viuva).
Uso (dentro de gerador/, com PYTHONHASHSEED=0):  python varredura_quebras.py a4|digital|moto saida.pdf
"""
import re, sys
from reportlab.platypus import paragraph as _P
from quebra import NBSP, SEP

ACHADOS = {}


def _texto(p):
    if isinstance(p, str): return str(p)
    return ''.join(t for _, t in list(p)[1:])          # _SplitFrag: [largura, (frag, texto), ...]


def _anota(partes):
    tx = [_texto(p) for p in partes]
    for i in range(len(tx) - 1):
        a, b = tx[i], tx[i + 1]
        if not a or not b: continue                     # parte vazia: a palavra só desceu inteira
        k = 'marca' if a[-1] == NBSP else 'separador' if a[-1] in SEP else 'meio'
        ACHADOS.setdefault((k, a, b), ''.join(tx))


_ORIG = {}


def _sw2(*a, **kw):
    r = _ORIG['sw'](*a, **kw); _anota(r); return r


def _sfw2(*a, **kw):
    r = _ORIG['sfw'](*a, **kw); _anota(r); return r


def _liga():
    """anota as quebras do que estiver instalado no ReportLab depois do import do gerador (o quebra.py, se houver)"""
    _ORIG['sw'], _ORIG['sfw'] = _P._splitWord, _P._splitFragWord
    _P._splitWord, _P._splitFragWord = _sw2, _sfw2


def main(qual, out):
    import pymupdf
    if qual == 'a4':
        import print_cat as PC
        _liga()
        PC.build(out)
    else:
        import moto, digital2 as D2
        if qual == 'moto':
            sys.argv = [sys.argv[0]]
            import catalogo_moto  # noqa: F401  (troca o título, a capa e as famílias do D2)
        _liga()
        D2.build(out)
    _P._splitWord, _P._splitFragWord = _ORIG['sw'], _ORIG['sfw']
    d = pymupdf.open(out)
    pags = [re.sub(r' +\n', '\n', p.get_text().replace(NBSP, ' ')) for p in d]
    linhas = []
    for (k, a, b), todo in ACHADOS.items():
        fim, ini = a.replace(NBSP, ' ').rstrip()[-12:], b.replace(NBSP, ' ').lstrip()[:12]
        for i, t in enumerate(pags):
            if fim + '\n' + ini in t:
                linhas.append((i + 1, k, todo.replace(NBSP, ' '), fim + ' / ' + ini))
    print(f'{qual}: {len(d)} páginas')
    for pg, k, todo, onde in sorted(set(linhas)):
        print(f'  p.{pg:>3}  {k:<9}  {onde!r:<36}  ({todo})')
    print(f'  total: {sum(1 for x in set(linhas) if x[1] == "meio")} no meio, '
          f'{sum(1 for x in set(linhas) if x[1] == "separador")} no separador, '
          f'{sum(1 for x in set(linhas) if x[1] == "marca")} entre marca e código ou no espaço do sem_viuva')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
