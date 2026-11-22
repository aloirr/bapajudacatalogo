"""B8 sem corte no meio (T-0019): onde o ReportLab parte a palavra que não cabe na coluna.

O B8 prende com espaço inseparável a marca e o código da referência (digital2.refs_juntas) e a última palavra da
aplicação (digital2.sem_viuva). Quando esse bloco, ou uma palavra sem espaço ("Fiesta,KA,Courier,Ecosport,Focus"), é
mais largo que a coluna, o ReportLab (splitLongWords) partia na letra que passasse da borda: "Kongsberg 100050486 /
9AMK", "Zetec Roca / m/Supercharger". Aqui a quebra vai para o melhor lugar antes da borda:
  1) o espaço inseparável (a marca numa linha e o código inteiro na de baixo; a palavra presa pelo sem_viuva desce);
  2) logo depois de um separador (",", "/", ";", ")", "·"), com a palavra inteira;
  3) a palavra começa na linha de baixo, se ali ela couber até o 1) ou o 2);
  4) só sem nenhum deles, na letra (o que o varredura_quebras.py lista como "meio").
Nada muda no texto: só o lugar da quebra. Vale para todo Paragraph depois do import (o digital2 importa).
"""
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import paragraph as _P

NBSP = '\xa0'
SEP = set(',/;)·')


def cortes(chars, livre, largura, parcial):
    """chars: [(letra, largura)]; livre: o que sobra na linha atual; largura: a de uma linha inteira; parcial: a linha
    atual já tem texto. Devolve os índices onde começa cada linha nova (0 = a palavra toda desce)."""
    out, ini, cab, acc, nb, sp, i = [], 0, livre, 0.0, None, None, 0
    while i < len(chars):
        c, w = chars[i]
        if acc + w > cab + 1e-6 and (i > ini or (parcial and not out)):
            b = nb if nb and nb > ini else sp if sp and sp > ini else None
            if b is None: b = 0 if parcial and not out else i       # 3) desce inteira; 4) na letra
            out.append(b); ini, cab, nb, sp = b, largura, None, None
            acc = 0.0
            for k in range(b, i):
                acc += chars[k][1]
                if chars[k][0] == NBSP: nb = k + 1
                elif chars[k][0] in SEP: sp = k + 1
            continue
        acc += w
        if c == NBSP: nb = i + 1
        elif c in SEP: sp = i + 1
        i += 1
    return out


def _split_word(w, lineWidth, maxWidths, lineno, fontName, fontSize, encoding='utf8'):
    if isinstance(w, bytes): w = w.decode(encoding)
    if _P.isBidiStr(w): return _orig_sw(w, lineWidth, maxWidths, lineno, fontName, fontSize, encoding)
    mx = len(maxWidths) - 1
    largura = maxWidths[min(mx, lineno + 1)]
    chars = [(c, stringWidth(c, fontName, fontSize, encoding)) for c in w]
    bs = cortes(chars, maxWidths[min(mx, lineno)] - lineWidth, largura, lineWidth > 1e-6)
    pts = [0] + bs + [len(w)]
    return [_P._SplitWord(w[a:b]) for a, b in zip(pts[:-2], pts[1:-1])] + [_P._SplitWordEnd(w[pts[-2]:])]


def _split_frag_word(w, maxWidth, maxWidths, lineno):
    it = list(_P._fragWordIter(w))
    mx = len(maxWidths) - 1
    f = w[1][0]
    esp = stringWidth(' ', f.fontName, f.fontSize)          # a linha "vazia" pode vir com a largura de um espaço
    parcial = maxWidths[min(mx, lineno)] - maxWidth > 1.5 * esp
    bs = set(cortes([(c if len(c) == 1 else 'x', cw) for g, cw, c in it], maxWidth, maxWidths[min(mx, lineno + 1)],
                    parcial))
    R, W, frag_txt, ww = [], [], '', 0
    for k, (g, cw, c) in enumerate(it):
        quebra = k in bs
        if g is not f or quebra:
            f = f.clone()
            if hasattr(f, 'text'): f.text = frag_txt
            W.append((f, frag_txt))
            if quebra:
                R.append(_P._SplitFrag([ww] + W)); W, ww = [], 0
            frag_txt = ''
            f = g
        ww += cw
        frag_txt += c
    W.append((f, frag_txt))
    R.append((_P._SplitFragHS if isinstance(w, _P._HSFrag) else _P._SplitFragH)([ww] + W))
    return R


_orig_sw = _P._splitWord
_P._splitWord, _P._splitFragWord = _split_word, _split_frag_word
