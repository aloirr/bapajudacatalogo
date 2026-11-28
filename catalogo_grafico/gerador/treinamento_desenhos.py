"""Ilustrações vetoriais dos treinamentos BAP (T-0032): esquemas em corte, no estilo dos ícones dos originais.

Cada função devolve um SVG (texto). O treinamento_molde.py chama `gerar(nome, pasta)`, que grava o .svg e o .png
(cairosvg). Traço simples, cinza e verde; os números das legendas ficam em círculos verde-escuros (#2F7D36), e o texto
da legenda fica no slide, não no desenho.

Uso avulso (dentro de catalogo_grafico/gerador/):
    python treinamento_desenhos.py PASTA            # grava todos os desenhos em PASTA
"""
import math
import os
import sys

# Paleta do padrão de treinamento (PADRAO_TREINAMENTO.md, seção 3)
ESC = '#1E2B22'      # escuro
VERDE = '#59BA61'    # verde do logo
VESC = '#2F7D36'     # verde-escuro
VCLARO = '#EEF7EF'   # verde-claro
CINZA = '#6B7570'    # cinza de apoio
LINHA = '#4A524D'    # traço
C1 = '#E4E8E5'       # cinza-claro (peça)
C2 = '#C9D0CB'       # cinza-médio
C3 = '#9AA39D'       # cinza (peça escura)
LAR = '#F28C28'      # laranja (quente, atrito)
BRANCO = '#FFFFFF'


def svg(w, h, corpo):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<g stroke-linejoin="round" stroke-linecap="round" font-family="Arial, Liberation Sans, sans-serif">{corpo}</g></svg>')


R = 27  # raio do marcador; os desenhos que entram menores no slide usam um maior


def num(n, x, y, r=None):
    """Marcador numerado da legenda (o número do slide: 1 -> "1")."""
    r = r or R
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{VESC}" stroke="{BRANCO}" stroke-width="4"/>'
            f'<text x="{x}" y="{y + r * 0.36:.1f}" font-size="{r * 1.05:.0f}" font-weight="bold" fill="{BRANCO}" '
            f'text-anchor="middle">{n}</text>')


def guia(x1, y1, x2, y2):
    """Linha-guia fina do marcador até a peça, com um ponto na ponta."""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{VESC}" stroke-width="2.5"/>'
            f'<circle cx="{x2}" cy="{y2}" r="5" fill="{VESC}"/>')


def marca(n, xm, ym, xp, yp, r=None):
    return guia(xm, ym, xp, yp) + num(n, xm, ym, r)


def rect(x, y, w, h, fill=C1, stroke=LINHA, sw=4, rx=0, extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def circ(x, y, r, fill=C1, stroke=LINHA, sw=4, extra=''):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def path(d, fill='none', stroke=LINHA, sw=4, extra=''):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def mola(x1, y1, x2, y2, largura, voltas, cor=VERDE, sw=9):
    """Mola helicoidal vista de lado, de (x1,y1) a (x2,y2)."""
    dx, dy = x2 - x1, y2 - y1
    comp = math.hypot(dx, dy)
    ux, uy = dx / comp, dy / comp
    nx, ny = -uy, ux
    pts = []
    n = voltas * 2
    for i in range(n + 1):
        t = i / n
        lado = (largura / 2) * (1 if i % 2 else -1) if 0 < i < n else 0
        pts.append((x1 + ux * comp * t + nx * lado, y1 + uy * comp * t + ny * lado))
    d = 'M' + ' L'.join(f'{px:.1f},{py:.1f}' for px, py in pts)
    return path(d, stroke=cor, sw=sw)


def seta(x1, y1, x2, y2, cor=VESC, sw=6, cab=16):
    ang = math.atan2(y2 - y1, x2 - x1)
    a1 = (x2 - cab * math.cos(ang - 0.45), y2 - cab * math.sin(ang - 0.45))
    a2 = (x2 - cab * math.cos(ang + 0.45), y2 - cab * math.sin(ang + 0.45))
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2 - cab * 0.6 * math.cos(ang):.1f}" y2="{y2 - cab * 0.6 * math.sin(ang):.1f}" '
            f'stroke="{cor}" stroke-width="{sw}"/>'
            f'<path d="M{x2},{y2} L{a1[0]:.1f},{a1[1]:.1f} L{a2[0]:.1f},{a2[1]:.1f} Z" fill="{cor}" stroke="{cor}" stroke-width="2"/>')


def correia(polias, sw=12, cor=ESC):
    """Correia por fora das polias, na ordem horária da tela. polias = [(x, y, r), ...]."""
    n = len(polias)
    cx = sum(p[0] for p in polias) / n
    cy = sum(p[1] for p in polias) / n
    tang = []
    for i in range(n):
        (x1, y1, r1), (x2, y2, r2) = polias[i], polias[(i + 1) % n]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        base = math.atan2(dy, dx)
        a = math.acos((r1 - r2) / L)
        melhor = None
        for s in (1, -1):
            ang = base + s * a
            p1 = (x1 + r1 * math.cos(ang), y1 + r1 * math.sin(ang))
            p2 = (x2 + r2 * math.cos(ang), y2 + r2 * math.sin(ang))
            mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
            dist = math.hypot(mx - cx, my - cy)
            if melhor is None or dist > melhor[0]:
                melhor = (dist, p1, p2)
        tang.append((melhor[1], melhor[2]))
    d = f'M{tang[0][0][0]:.1f},{tang[0][0][1]:.1f}'
    for i in range(n):
        p1, p2 = tang[i]
        d += f' L{p2[0]:.1f},{p2[1]:.1f}'
        nxt = tang[(i + 1) % n][0]
        x, y, r = polias[(i + 1) % n]
        a1 = math.atan2(p2[1] - y, p2[0] - x)
        a2 = math.atan2(nxt[1] - y, nxt[0] - x)
        dif = (a2 - a1) % (2 * math.pi)
        d += f' A{r},{r} 0 {1 if dif > math.pi else 0} 1 {nxt[0]:.1f},{nxt[1]:.1f}'
    return path(d + ' Z', stroke=cor, sw=sw)


# ---------------------------------------------------------------- desenhos

def carro_sistemas():
    global R
    R = 27
    """O carro visto de cima (frente à esquerda), com os 10 sistemas numerados."""
    W, H = 1360, 790
    o = []
    # pneus (atrás da carroceria)
    for x in (270, 980):
        for y in (92, 600):
            o.append(rect(x, y, 140, 98, fill=ESC, stroke=ESC, rx=22))
            o.append(f'<line x1="{x + 18}" y1="{y + 49}" x2="{x + 122}" y2="{y + 49}" stroke="{CINZA}" stroke-width="4"/>')
    # carroceria
    o.append(rect(120, 150, 1120, 490, fill=BRANCO, stroke=LINHA, sw=5, rx=150))
    o.append(rect(560, 200, 430, 390, fill='#F4F7F5', stroke=C2, sw=3, rx=70))
    o.append(path('M560,215 Q600,395 560,575', stroke=C2, sw=3))
    # eixo dianteiro (semieixos) e traseiro
    o.append(f'<line x1="340" y1="190" x2="340" y2="600" stroke="{C3}" stroke-width="14"/>')
    o.append(f'<line x1="1050" y1="190" x2="1050" y2="600" stroke="{C3}" stroke-width="16"/>')
    for y in (205, 585):
        o.append(circ(340, y, 17, fill=C2, sw=3))
    # radiador
    o.append(rect(150, 250, 34, 290, fill=VCLARO, stroke=VESC, sw=4, rx=6))
    for y in range(270, 530, 22):
        o.append(f'<line x1="154" y1="{y}" x2="180" y2="{y}" stroke="{VESC}" stroke-width="2"/>')
    # motor (transversal) e câmbio
    o.append(rect(205, 250, 120, 205, fill=C2, stroke=LINHA, rx=12))
    for y in (285, 330, 375, 420):
        o.append(circ(265, y, 16, fill=BRANCO, sw=3))
    o.append(rect(205, 462, 120, 88, fill=C3, stroke=LINHA, rx=12))
    # óleo (vareta / tampa)
    o.append(path('M300,262 q12,18 0,30 q-12,-12 0,-30 Z', fill=LAR, stroke=LINHA, sw=2))
    # filtro de ar
    o.append(rect(372, 235, 92, 60, fill=VERDE, stroke=VESC, rx=12))
    o.append(f'<line x1="372" y1="265" x2="325" y2="300" stroke="{C3}" stroke-width="10"/>')
    # bateria
    o.append(rect(372, 470, 96, 70, fill=ESC, stroke=ESC, rx=8))
    o.append(f'<text x="392" y="515" font-size="30" font-weight="bold" fill="{BRANCO}">+</text>')
    o.append(f'<text x="436" y="513" font-size="34" font-weight="bold" fill="{BRANCO}">−</text>')
    # direção: caixa junto da parede de fogo, braços até as rodas e volante (lado do motorista embaixo)
    o.append(f'<line x1="492" y1="222" x2="492" y2="568" stroke="{LINHA}" stroke-width="12"/>')
    o.append(f'<line x1="492" y1="228" x2="356" y2="206" stroke="{LINHA}" stroke-width="8"/>')
    o.append(f'<line x1="492" y1="562" x2="356" y2="584" stroke="{LINHA}" stroke-width="8"/>')
    o.append(f'<line x1="492" y1="470" x2="610" y2="470" stroke="{LINHA}" stroke-width="7"/>')
    o.append(f'<ellipse cx="625" cy="470" rx="14" ry="58" fill="none" stroke="{LINHA}" stroke-width="9"/>')
    # suspensão: torre de mola nas 4 rodas
    for x in (340, 1050):
        for y in (235, 555):
            o.append(circ(x, y, 25, fill=VCLARO, stroke=VERDE, sw=7))
            o.append(circ(x, y, 9, fill=VERDE, stroke=VERDE, sw=2))
    # freio: cilindro-mestre e linhas até as 4 rodas
    tr = 'stroke-dasharray="12 9"'
    o.append(path('M528,395 L528,170 L398,170 M528,395 L528,620 L398,620 M528,395 L1072,395 L1072,170 M1072,395 L1072,620',
                  stroke=LAR, sw=4, extra=tr))
    o.append(rect(508, 378, 44, 34, fill=C2, stroke=LINHA, sw=3, rx=6))
    for (x, y) in ((362, 154), (362, 604), (1072, 154), (1072, 604)):
        o.append(rect(x, y, 36, 32, fill=LAR, stroke=LINHA, sw=3, rx=6))
    # marcadores (número = linha da legenda)
    o.append(num(1, 265, 355))           # motor
    o.append(marca(2, 167, 50, 167, 250))    # arrefecimento (radiador)
    o.append(marca(3, 236, 50, 300, 268))    # lubrificação
    o.append(marca(4, 470, 50, 430, 236))    # filtração
    o.append(num(5, 265, 506))           # transmissão
    o.append(marca(6, 1180, 50, 1068, 222))  # suspensão
    o.append(marca(7, 700, 740, 628, 524))   # direção
    o.append(marca(8, 400, 740, 380, 636))   # freio
    o.append(marca(9, 1180, 740, 1100, 690))  # rodagem
    o.append(marca(10, 560, 740, 440, 540))  # elétrica
    return svg(W, H, ''.join(o))


def _cilindro(x0, y0, w, h, pistao, adm, esc, extra=''):
    """Um cilindro em corte para o desenho dos 4 tempos. pistao: 0 (em cima) a 1 (embaixo)."""
    o = []
    cx = x0 + w / 2
    topo = y0 + 70
    o.append(rect(x0 + 40, topo, w - 80, h - 150, fill='#FAFBFA', stroke=LINHA, sw=5))
    o.append(rect(x0 + 20, y0 + 10, w - 40, 62, fill=C2, stroke=LINHA, sw=4, rx=8))
    # válvulas (admissão à esquerda, escape à direita)
    for lado, aberta in ((-1, adm), (1, esc)):
        vx = cx + lado * (w * 0.2)
        desce = 22 if aberta else 0
        o.append(f'<line x1="{vx}" y1="{y0}" x2="{vx}" y2="{topo + desce}" stroke="{LINHA}" stroke-width="7"/>')
        o.append(path(f'M{vx - 26},{topo + desce + 6} L{vx + 26},{topo + desce + 6} L{vx + 8},{topo + desce - 6} L{vx - 8},{topo + desce - 6} Z',
                      fill=C3, stroke=LINHA, sw=3))
    # vela
    o.append(rect(cx - 9, y0 - 14, 18, 84, fill=BRANCO, stroke=LINHA, sw=3, rx=4))
    # pistão e biela
    py = topo + 40 + pistao * (h - 330)
    o.append(rect(x0 + 46, py, w - 92, 70, fill=C3, stroke=LINHA, sw=4, rx=6))
    for k in (14, 28):
        o.append(f'<line x1="{x0 + 46}" y1="{py + k}" x2="{x0 + w - 46}" y2="{py + k}" stroke="{LINHA}" stroke-width="2"/>')
    ky = y0 + h - 40
    o.append(f'<line x1="{cx}" y1="{py + 45}" x2="{cx + 30}" y2="{ky}" stroke="{CINZA}" stroke-width="20"/>')
    o.append(circ(cx, ky, 30, fill=CINZA, stroke=LINHA, sw=3))
    o.append(extra)
    return ''.join(o)


def quatro_tempos():
    """Os 4 tempos do motor, em 2 × 2: admissão, compressão, combustão e escape."""
    W, H = 900, 900
    o = []
    cw, ch = 330, 380
    pos = [(60, 20), (510, 20), (60, 470), (510, 470)]
    pist = [0.95, 0.05, 0.95, 0.05]
    adm = [True, False, False, False]
    esc = [False, False, False, True]
    nomes = ['1 Admissão', '2 Compressão', '3 Combustão', '4 Escape']
    for i, (x, y) in enumerate(pos):
        cx = x + cw / 2
        extra = ''
        if i == 0:
            extra = seta(x - 30, y + 30, cx - 70, y + 110, cor=VERDE, sw=7)
            extra += seta(cx, y + 210, cx, y + 290, cor=VESC, sw=6)
        elif i == 1:
            extra = seta(cx, y + 300, cx, y + 215, cor=VESC, sw=6)
        elif i == 2:
            pts = []
            for k in range(16):
                r = 46 if k % 2 == 0 else 20
                a = k * math.pi / 8
                pts.append(f'{cx + r * math.cos(a):.1f},{y + 125 + r * math.sin(a) * 0.8:.1f}')
            extra = f'<polygon points="{" ".join(pts)}" fill="{LAR}" stroke="{LAR}" stroke-width="2"/>'
            extra += seta(cx, y + 210, cx, y + 290, cor=LAR, sw=7)
        else:
            extra = seta(cx + 70, y + 110, x + cw + 30, y + 30, cor=CINZA, sw=7)
            extra += seta(cx, y + 300, cx, y + 215, cor=VESC, sw=6)
        o.append(_cilindro(x, y, cw, ch, pist[i], adm[i], esc[i], extra))
        o.append(f'<text x="{cx}" y="{y + ch + 46}" font-size="38" font-weight="bold" fill="{ESC}" text-anchor="middle">{nomes[i]}</text>')
    return svg(W, H, ''.join(o))


def motor_corte():
    global R
    R = 27
    """Motor em corte (um cilindro) e a distribuição por correia dentada, com 11 peças numeradas."""
    W, H = 1360, 790
    o = []
    # bloco e cárter
    o.append(path('M250,250 L650,250 L650,560 L615,575 L285,575 L250,560 Z', fill=C1, stroke=LINHA, sw=5))
    o.append(path('M285,575 L300,740 L600,740 L615,575 Z', fill=BRANCO, stroke=LINHA, sw=5))
    o.append(path('M296,690 L604,690 L600,740 L300,740 Z', fill=LAR, stroke='none', sw=0, extra='opacity="0.55"'))
    # camisa d'água
    for x in (272, 600):
        o.append(rect(x, 275, 28, 230, fill=VCLARO, stroke=VERDE, sw=3, rx=10))
    # cilindro
    o.append(rect(330, 262, 240, 270, fill='#FAFBFA', stroke=LINHA, sw=4))
    # cabeçote
    o.append(path('M230,100 L670,100 L670,262 L230,262 Z', fill=C2, stroke=LINHA, sw=5))
    o.append(path('M330,262 L390,215 L510,215 L570,262 Z', fill='#FAFBFA', stroke=LINHA, sw=4))
    # comandos de válvula
    for x in (345, 555):
        o.append(path(f'M{x},{118} a34,34 0 1,1 0.1,0 Z M{x - 22},{148} q22,40 44,0', fill=C3, stroke=LINHA, sw=3))
        o.append(circ(x, 150, 34, fill=C3, stroke=LINHA, sw=3))
        o.append(path(f'M{x - 20},{176} Q{x},{214} {x + 20},{176}', fill=C3, stroke=LINHA, sw=3))
    # válvulas
    for (x1, x2) in ((360, 395), (540, 505)):
        o.append(f'<line x1="{x1}" y1="190" x2="{x2}" y2="236" stroke="{LINHA}" stroke-width="9"/>')
        o.append(mola(x1 - 6, 192, (x1 + x2) / 2 - 3, 214, 30, 3, cor=CINZA, sw=4))
        o.append(path(f'M{x2 - 28},{240} L{x2 + 28},{240} L{x2 + 10},{228} L{x2 - 10},{228} Z', fill=C3, stroke=LINHA, sw=3))
    # vela
    o.append(rect(438, 60, 24, 150, fill=BRANCO, stroke=LINHA, sw=3, rx=5))
    o.append(rect(432, 160, 36, 28, fill=C3, stroke=LINHA, sw=3, rx=3))
    # pistão, anéis, pino
    o.append(rect(336, 330, 228, 96, fill=C3, stroke=LINHA, sw=4, rx=8))
    for y in (344, 358, 372):
        o.append(f'<line x1="336" y1="{y}" x2="564" y2="{y}" stroke="{LINHA}" stroke-width="2.5"/>')
    # biela e virabrequim
    o.append(path('M432,398 L468,398 L520,612 L484,622 Z', fill=CINZA, stroke=LINHA, sw=3))
    o.append(circ(450, 400, 14, fill=BRANCO, sw=3))
    o.append(path('M450,640 m-75,0 a75,75 0 0,0 150,0 Z', fill=CINZA, stroke=LINHA, sw=3))
    o.append(circ(450, 640, 34, fill=LINHA, stroke=LINHA, sw=2))
    o.append(circ(502, 616, 22, fill=C3, stroke=LINHA, sw=3))
    # distribuição (à direita)
    pol = [(1010, 190, 82), (1150, 420, 32), (1010, 660, 48), (880, 450, 42)]
    o.append(correia(pol, sw=14))
    o.append(circ(1010, 190, 82, fill=C1, stroke=LINHA, sw=4))
    o.append(circ(1010, 190, 68, fill='none', stroke=C3, sw=3, extra='stroke-dasharray="6 6"'))
    o.append(circ(1010, 190, 16, fill=C3, stroke=LINHA, sw=3))
    o.append(circ(1150, 420, 32, fill=VERDE, stroke=VESC, sw=4))
    o.append(circ(1150, 420, 10, fill=BRANCO, stroke=VESC, sw=3))
    o.append(circ(1010, 660, 48, fill=C1, stroke=LINHA, sw=4))
    o.append(circ(1010, 660, 12, fill=C3, stroke=LINHA, sw=3))
    o.append(circ(880, 450, 42, fill=VCLARO, stroke=VESC, sw=4))
    o.append(circ(880, 450, 12, fill=BRANCO, stroke=VESC, sw=3))
    o.append(path('M760,190 L928,190', stroke=C2, sw=4, extra='stroke-dasharray="10 8"'))
    o.append(path('M760,650 L962,650', stroke=C2, sw=4, extra='stroke-dasharray="10 8"'))
    # marcadores
    o.append(marca(1, 180, 130, 232, 130))
    o.append(marca(2, 180, 225, 352, 218))
    o.append(marca(3, 300, 40, 345, 120))
    o.append(marca(4, 520, 40, 460, 70))
    o.append(marca(5, 180, 350, 336, 380))
    o.append(marca(6, 700, 470, 500, 520))
    o.append(marca(7, 700, 640, 525, 640))
    o.append(marca(8, 180, 715, 300, 715))
    o.append(marca(9, 1230, 250, 1078, 300))
    o.append(marca(10, 1250, 420, 1182, 420))
    o.append(marca(11, 790, 380, 850, 420))
    return svg(W, H, ''.join(o))


def arrefecimento():
    global R
    R = 27
    """Circuito de arrefecimento: motor, válvula, mangueiras, radiador, eletroventilador, bomba e reservatório."""
    W, H = 1360, 790
    o = []
    # mangueiras (quente: laranja; fria: verde)
    o.append(path('M590,300 C700,300 760,232 900,232', stroke=LAR, sw=26))
    o.append(path('M900,612 C760,612 700,560 612,560', stroke=VERDE, sw=26))
    o.append(path('M740,190 L740,262', stroke=C3, sw=9))
    # motor
    o.append(rect(160, 220, 420, 400, fill=C1, stroke=LINHA, sw=5, rx=22))
    o.append(path('M205,300 C260,250 330,350 390,300 C450,250 500,330 540,290 L540,560 C480,600 420,520 360,570 '
                  'C300,620 250,540 205,580 Z', fill=VCLARO, stroke=VERDE, sw=4))
    for x in (270, 370, 470):
        o.append(rect(x - 34, 350, 68, 150, fill=BRANCO, stroke=LINHA, sw=3, rx=8))
    o.append(seta(300, 590, 220, 450, cor=VESC, sw=5))
    o.append(seta(420, 310, 520, 300, cor=LAR, sw=5))
    # válvula termostática
    o.append(circ(588, 300, 32, fill=BRANCO, stroke=LINHA, sw=4))
    o.append(mola(574, 300, 602, 300, 22, 3, cor=LINHA, sw=3))
    # sensor de temperatura
    o.append(rect(470, 196, 34, 30, fill=C3, stroke=LINHA, sw=3, rx=4))
    o.append(f'<line x1="487" y1="196" x2="487" y2="168" stroke="{LINHA}" stroke-width="5"/>')
    # bomba d'água
    o.append(circ(600, 560, 40, fill=VERDE, stroke=VESC, sw=4))
    for k in range(6):
        a = k * math.pi / 3
        o.append(f'<line x1="600" y1="560" x2="{600 + 30 * math.cos(a):.1f}" y2="{560 + 30 * math.sin(a):.1f}" stroke="{BRANCO}" stroke-width="5"/>')
    # radiador
    o.append(rect(900, 180, 190, 470, fill=VCLARO, stroke=VESC, sw=5, rx=10))
    o.append(rect(900, 180, 190, 56, fill=C2, stroke=LINHA, sw=4, rx=10))
    o.append(rect(900, 596, 190, 54, fill=C2, stroke=LINHA, sw=4, rx=10))
    for x in range(918, 1090, 18):
        o.append(f'<line x1="{x}" y1="240" x2="{x}" y2="592" stroke="{VESC}" stroke-width="2"/>')
    o.append(seta(995, 300, 995, 520, cor=VESC, sw=6))
    # eletroventilador
    o.append(circ(1205, 415, 112, fill=BRANCO, stroke=LINHA, sw=5))
    for k in range(5):
        a = k * 2 * math.pi / 5
        x1, y1 = 1205 + 30 * math.cos(a), 415 + 30 * math.sin(a)
        x2, y2 = 1205 + 98 * math.cos(a + 0.35), 415 + 98 * math.sin(a + 0.35)
        x3, y3 = 1205 + 92 * math.cos(a + 0.95), 415 + 92 * math.sin(a + 0.95)
        o.append(path(f'M{x1:.1f},{y1:.1f} Q{x2:.1f},{y2:.1f} {x3:.1f},{y3:.1f} Z', fill=C2, stroke=LINHA, sw=3))
    o.append(circ(1205, 415, 30, fill=LINHA, stroke=LINHA, sw=2))
    # reservatório de expansão
    o.append(rect(680, 70, 120, 122, fill=BRANCO, stroke=LINHA, sw=4, rx=14))
    o.append(rect(684, 122, 112, 66, fill=VERDE, stroke='none', sw=0, rx=10, extra='opacity="0.55"'))
    o.append(rect(718, 48, 44, 26, fill=C3, stroke=LINHA, sw=3, rx=5))
    # marcadores
    o.append(marca(1, 995, 720, 995, 640))
    o.append(marca(2, 1300, 600, 1260, 500))
    o.append(marca(3, 600, 720, 600, 600))
    o.append(marca(4, 650, 160, 600, 280))
    o.append(marca(5, 860, 90, 800, 110))
    o.append(marca(6, 790, 430, 760, 590))
    o.append(marca(7, 400, 140, 470, 190))
    o.append(marca(8, 120, 680, 240, 560))
    return svg(W, H, ''.join(o))


def transmissao():
    global R
    R = 27
    """Transmissão de tração dianteira vista de cima: motor, embreagem, câmbio, diferencial, semieixos e juntas."""
    W, H = 1360, 790
    o = []
    # semieixos
    o.append(f'<line x1="160" y1="560" x2="740" y2="548" stroke="{CINZA}" stroke-width="20"/>')
    o.append(f'<line x1="900" y1="548" x2="1200" y2="560" stroke="{CINZA}" stroke-width="20"/>')
    # rodas
    for x in (40, 1210):
        o.append(rect(x, 420, 110, 280, fill=ESC, stroke=ESC, rx=26))
        o.append(rect(x + (60 if x < 600 else 0) - 0, 470, 50, 180, fill=C3, stroke=LINHA, sw=3, rx=10))
    # juntas homocinéticas (lado roda) com coifa
    for x, d in ((200, 1), (1160, -1)):
        o.append(circ(x, 558, 40, fill=C2, stroke=LINHA, sw=4))
        o.append(path(f'M{x + d * 30},{530} L{x + d * 60},{535} L{x + d * 50},{545} L{x + d * 80},{548} L{x + d * 70},{555} '
                      f'L{x + d * 100},{556} L{x + d * 100},{562} L{x + d * 70},{563} L{x + d * 80},{570} L{x + d * 50},{573} '
                      f'L{x + d * 60},{583} L{x + d * 30},{588} Z', fill=ESC, stroke=ESC, sw=3))
    # trizetas (lado câmbio)
    for x in (740, 900):
        o.append(rect(x - 36, 518, 72, 62, fill=C2, stroke=LINHA, sw=4, rx=14))
        o.append(path(f'M{x},{532} L{x + 16},{562} L{x - 16},{562} Z', fill=VERDE, stroke=VESC, sw=3))
    # motor
    o.append(rect(250, 130, 360, 300, fill=C1, stroke=LINHA, sw=5, rx=24))
    for x in (310, 390, 470, 550):
        o.append(circ(x, 250, 30, fill=BRANCO, stroke=LINHA, sw=3))
    # volante + embreagem (caixa seca)
    o.append(path('M610,170 L700,190 L700,420 L610,440 Z', fill=C2, stroke=LINHA, sw=5))
    o.append(rect(622, 210, 22, 200, fill=C3, stroke=LINHA, sw=3, rx=4))
    o.append(rect(652, 230, 16, 160, fill=VERDE, stroke=VESC, sw=3, rx=4))
    o.append(rect(674, 220, 18, 180, fill=LINHA, stroke=LINHA, sw=2, rx=4))
    # atuador da embreagem
    o.append(rect(668, 120, 66, 50, fill=C3, stroke=LINHA, sw=3, rx=8))
    o.append(f'<line x1="700" y1="170" x2="690" y2="215" stroke="{LINHA}" stroke-width="7"/>')
    # câmbio e diferencial
    o.append(rect(700, 170, 280, 280, fill=C2, stroke=LINHA, sw=5, rx=24))
    for y in (230, 290, 350):
        o.append(f'<line x1="740" y1="{y}" x2="940" y2="{y}" stroke="{LINHA}" stroke-width="3" stroke-dasharray="14 10"/>')
    o.append(circ(820, 548, 62, fill=C3, stroke=LINHA, sw=5))
    o.append(circ(820, 548, 22, fill=C1, stroke=LINHA, sw=3))
    o.append(f'<line x1="820" y1="450" x2="820" y2="486" stroke="{LINHA}" stroke-width="10"/>')
    # marcadores
    o.append(marca(1, 430, 60, 430, 130))
    o.append(marca(2, 600, 60, 660, 236))
    o.append(marca(3, 790, 60, 715, 130))
    o.append(marca(4, 1060, 230, 980, 260))
    o.append(marca(5, 820, 720, 820, 610))
    o.append(marca(6, 960, 720, 905, 580))
    o.append(marca(7, 480, 720, 480, 555))
    o.append(marca(8, 200, 720, 200, 598))
    o.append(marca(9, 330, 720, 272, 575))
    o.append(marca(10, 95, 330, 95, 420))
    return svg(W, H, ''.join(o))


def suspensao():
    global R
    R = 27
    """Suspensão dianteira McPherson vista de frente (roda esquerda), com 10 peças numeradas."""
    W, H = 1360, 790
    o = []
    # carroceria e subchassi
    o.append(path('M520,40 L1320,40 L1320,150 L640,150 Q590,150 575,110 Z', fill=C1, stroke=LINHA, sw=4))
    o.append(rect(860, 560, 460, 120, fill=C1, stroke=LINHA, sw=4, rx=16))
    # roda e manga
    o.append(rect(120, 330, 170, 420, fill=ESC, stroke=ESC, rx=40))
    o.append(rect(250, 420, 70, 240, fill=C3, stroke=LINHA, sw=4, rx=12))
    o.append(path('M320,470 L390,450 L410,560 L380,650 L320,640 Z', fill=C2, stroke=LINHA, sw=4))
    # barra estabilizadora e bieleta
    o.append(path('M1290,470 L700,470 Q640,470 600,520', stroke=LINHA, sw=16))
    o.append(rect(1010, 448, 60, 46, fill=ESC, stroke=ESC, rx=8))
    o.append(rect(1000, 440, 80, 14, fill=C3, stroke=LINHA, sw=3, rx=4))
    o.append(f'<line x1="600" y1="520" x2="470" y2="380" stroke="{VESC}" stroke-width="12"/>')
    o.append(circ(600, 520, 14, fill=VERDE, stroke=VESC, sw=4))
    o.append(circ(470, 380, 14, fill=VERDE, stroke=VESC, sw=4))
    # bandeja, pivô e buchas
    o.append(path('M380,630 L870,590 L880,665 L390,668 Z', fill=C3, stroke=LINHA, sw=4))
    o.append(circ(388, 648, 24, fill=VCLARO, stroke=VESC, sw=6))
    o.append(circ(388, 648, 8, fill=VESC, stroke=VESC, sw=2))
    o.append(circ(880, 628, 34, fill=ESC, stroke=ESC, sw=2))
    o.append(circ(880, 628, 14, fill=C1, stroke=LINHA, sw=3))
    # amortecedor (corpo inclinado), haste, coifa e batente, mola e coxim
    ax0, ay0, ax1, ay1 = 380, 470, 480, 110
    o.append(f'<line x1="{ax0}" y1="{ay0}" x2="425" y2="270" stroke="{LINHA}" stroke-width="44"/>')
    o.append(f'<line x1="{ax0}" y1="{ay0}" x2="425" y2="270" stroke="{CINZA}" stroke-width="36"/>')
    o.append(f'<line x1="425" y1="270" x2="{ax1}" y2="{ay1}" stroke="{C3}" stroke-width="12"/>')
    o.append(path('M425,270 L458,165', stroke=ESC, sw=34, extra='stroke-dasharray="9 5" stroke-linecap="butt"'))
    o.append(rect(447, 150, 30, 26, fill='#E9D79A', stroke=LINHA, sw=3, rx=6, extra='transform="rotate(17 462 163)"'))
    o.append(mola(418, 300, 470, 140, 110, 6, cor=VERDE, sw=10))
    o.append(path('M360,300 L470,330', stroke=LINHA, sw=8))
    o.append(path('M420,130 L530,160', stroke=LINHA, sw=8))
    o.append(rect(420, 82, 140, 40, fill=ESC, stroke=ESC, rx=10, extra='transform="rotate(17 490 102)"'))
    # marcadores
    o.append(marca(1, 640, 100, 540, 110))
    o.append(marca(2, 600, 220, 462, 190))
    o.append(marca(3, 320, 170, 420, 210))
    o.append(marca(4, 250, 300, 395, 400))
    o.append(marca(5, 620, 380, 540, 455))
    o.append(marca(6, 760, 400, 760, 470))
    o.append(marca(7, 1040, 380, 1040, 446))
    o.append(marca(8, 640, 730, 640, 645))
    o.append(marca(9, 420, 740, 392, 672))
    o.append(marca(10, 960, 740, 895, 655))
    return svg(W, H, ''.join(o))


def freio_disco():
    global R
    R = 34
    """Freio a disco em corte: a pinça aperta as pastilhas contra o disco."""
    W, H = 900, 900
    o = []
    o.append(rect(420, 230, 60, 600, fill=C2, stroke=LINHA, sw=5, rx=6))
    o.append(rect(480, 640, 160, 190, fill=C1, stroke=LINHA, sw=4, rx=10))
    o.append(path('M290,560 L290,140 Q290,100 330,100 L570,100 Q610,100 610,140 L610,560 L560,560 L560,190 '
                  'L340,190 L340,560 Z', fill=VESC, stroke=ESC, sw=4))
    o.append(rect(292, 300, 30, 160, fill=VERDE, stroke='none', sw=0))
    o.append(rect(322, 300, 30, 160, fill=BRANCO, stroke=LINHA, sw=3, rx=4))
    for x0, x1 in ((352, 372), (528, 548)):
        o.append(rect(x0, 250, 20, 260, fill=C3, stroke=LINHA, sw=3, rx=3))
    o.append(rect(372, 260, 46, 240, fill=LAR, stroke=LINHA, sw=3, rx=4))
    o.append(rect(482, 260, 46, 240, fill=LAR, stroke=LINHA, sw=3, rx=4))
    o.append(path('M120,380 L292,380', stroke=VERDE, sw=12))
    o.append(seta(200, 330, 300, 330, cor=VESC, sw=6))
    o.append(marca(1, 450, 870, 450, 790))
    o.append(marca(2, 740, 300, 505, 300))
    o.append(marca(3, 740, 150, 600, 150))
    o.append(marca(4, 150, 470, 330, 440))
    o.append(marca(5, 110, 290, 170, 380))
    return svg(W, H, ''.join(o))


def freio_tambor():
    global R
    R = 34
    """Freio a tambor de frente: o cilindro de roda abre as sapatas contra o tambor."""
    W, H = 900, 900
    o = []
    cx, cy = 450, 470
    o.append(circ(cx, cy, 360, fill='#F4F7F5', stroke=LINHA, sw=14))
    o.append(circ(cx, cy, 70, fill=C1, stroke=LINHA, sw=4))

    def sapata(a0, a1):
        def p(r, a):
            return cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))
        d1 = p(345, a0), p(345, a1), p(312, a1), p(312, a0)
        lona = (f'M{d1[0][0]:.1f},{d1[0][1]:.1f} A345,345 0 0,1 {d1[1][0]:.1f},{d1[1][1]:.1f} '
                f'L{d1[2][0]:.1f},{d1[2][1]:.1f} A312,312 0 0,0 {d1[3][0]:.1f},{d1[3][1]:.1f} Z')
        d2 = p(312, a0), p(312, a1), p(270, a1), p(270, a0)
        metal = (f'M{d2[0][0]:.1f},{d2[0][1]:.1f} A312,312 0 0,1 {d2[1][0]:.1f},{d2[1][1]:.1f} '
                 f'L{d2[2][0]:.1f},{d2[2][1]:.1f} A270,270 0 0,0 {d2[3][0]:.1f},{d2[3][1]:.1f} Z')
        return path(lona, fill=LAR, stroke=LINHA, sw=3) + path(metal, fill=C3, stroke=LINHA, sw=3)
    o.append(sapata(-70, 70 + 0))
    o.append(sapata(110, 250))
    o.append(rect(330, 150, 240, 60, fill=VERDE, stroke=VESC, sw=4, rx=10))
    o.append(seta(400, 180, 330, 180, cor=BRANCO, sw=6, cab=14))
    o.append(seta(500, 180, 570, 180, cor=BRANCO, sw=6, cab=14))
    o.append(mola(350, 260, 550, 260, 26, 7, cor=LINHA, sw=5))
    o.append(rect(400, 735, 100, 50, fill=C2, stroke=LINHA, sw=4, rx=8))
    o.append(mola(360, 700, 540, 700, 22, 6, cor=LINHA, sw=5))
    o.append(marca(1, 820, 120, 700, 210))
    o.append(marca(2, 110, 470, 175, 470))
    o.append(marca(3, 820, 470, 790, 470))
    o.append(marca(4, 450, 60, 450, 150))
    o.append(marca(5, 650, 330, 545, 262))
    return svg(W, H, ''.join(o))


def freio_hidraulico():
    global R
    R = 27
    """O caminho do pé até a roda: pedal, servo, cilindro-mestre, fluido, tubos, disco e tambor."""
    W, H = 1360, 790
    o = []
    # pedal
    o.append(f'<line x1="150" y1="170" x2="120" y2="560" stroke="{LINHA}" stroke-width="16"/>')
    o.append(circ(150, 170, 16, fill=C3, stroke=LINHA, sw=4))
    o.append(rect(70, 550, 110, 36, fill=ESC, stroke=ESC, rx=8))
    o.append(f'<line x1="142" y1="300" x2="260" y2="330" stroke="{LINHA}" stroke-width="10"/>')
    # servo-freio
    o.append(circ(365, 330, 110, fill=C1, stroke=LINHA, sw=5))
    o.append(circ(365, 330, 70, fill='none', stroke=C3, sw=3))
    # cilindro-mestre e reservatório
    o.append(rect(470, 300, 190, 62, fill=C2, stroke=LINHA, sw=4, rx=10))
    o.append(rect(495, 200, 120, 96, fill=BRANCO, stroke=LINHA, sw=4, rx=12))
    o.append(rect(499, 240, 112, 52, fill=LAR, stroke='none', sw=0, rx=8, extra='opacity="0.5"'))
    o.append(rect(530, 180, 50, 22, fill=C3, stroke=LINHA, sw=3, rx=4))
    # tubos (rígido em verde) e flexíveis (escuro)
    o.append(path('M660,315 L820,315 L820,230 L880,230', stroke=VESC, sw=7))
    o.append(path('M880,230 C900,200 920,260 940,230', stroke=ESC, sw=10))
    o.append(path('M660,350 L1000,350 L1000,560 L1050,560', stroke=VESC, sw=7))
    o.append(path('M1050,560 C1065,535 1080,585 1095,560', stroke=ESC, sw=10))
    # disco (dianteiro)
    o.append(circ(1060, 240, 120, fill=C2, stroke=LINHA, sw=5))
    o.append(circ(1060, 240, 45, fill=C1, stroke=LINHA, sw=4))
    o.append(path('M940,200 Q950,140 1000,125 L1020,160 Q985,172 978,210 Z', fill=VESC, stroke=ESC, sw=3))
    # tambor (traseiro)
    o.append(circ(1200, 580, 120, fill='#F4F7F5', stroke=LINHA, sw=10))
    o.append(path('M1110,560 A92,92 0 0,1 1170,490', stroke=LAR, sw=16))
    o.append(path('M1290,560 A92,92 0 0,0 1230,490', stroke=LAR, sw=16))
    o.append(rect(1160, 475, 80, 30, fill=VERDE, stroke=VESC, sw=3, rx=6))
    o.append(circ(1200, 580, 36, fill=C1, stroke=LINHA, sw=3))
    # marcadores
    o.append(marca(1, 60, 680, 110, 585))
    o.append(marca(2, 365, 520, 365, 440))
    o.append(marca(3, 565, 450, 565, 362))
    o.append(marca(4, 420, 140, 500, 220))
    o.append(marca(5, 740, 450, 740, 350))
    o.append(marca(6, 880, 90, 975, 150))
    o.append(marca(7, 1230, 110, 1150, 175))
    o.append(marca(8, 1300, 730, 1260, 670))
    o.append(marca(9, 1100, 420, 1170, 478))
    return svg(W, H, ''.join(o))


def ignicao():
    global R
    R = 27
    """Ignição: a bobina gera a alta tensão, o cabo leva e a vela faz a faísca."""
    W, H = 1400, 594
    o = []
    # bobina
    o.append(rect(70, 170, 230, 250, fill=C1, stroke=LINHA, sw=5, rx=20))
    for y in range(205, 395, 22):
        o.append(f'<line x1="105" y1="{y}" x2="265" y2="{y}" stroke="{C3}" stroke-width="6"/>')
    o.append(rect(220, 120, 60, 54, fill=C3, stroke=LINHA, sw=4, rx=8))
    o.append(path('M140,90 L175,140 L155,140 L185,190', stroke=LAR, sw=8))
    # cabo
    o.append(path('M250,125 C330,30 520,40 600,180 C640,250 660,290 700,300', stroke=ESC, sw=22))
    o.append(path('M650,275 L712,268 L730,332 L668,340 Z', fill=ESC, stroke=ESC, sw=3))
    # vela (deitada)
    o.append(rect(712, 284, 40, 32, fill=C3, stroke=LINHA, sw=3, rx=4))
    o.append(path('M752,272 L960,262 L960,338 L752,328 Z', fill=BRANCO, stroke=LINHA, sw=4))
    for x in (790, 830, 870, 910):
        o.append(f'<line x1="{x}" y1="272" x2="{x}" y2="328" stroke="{C2}" stroke-width="4"/>')
    o.append(path('M960,240 L1060,240 L1060,360 L960,360 Z', fill=C3, stroke=LINHA, sw=4))
    o.append(f'<line x1="960" y1="300" x2="1060" y2="300" stroke="{LINHA}" stroke-width="3"/>')
    o.append(rect(1060, 262, 150, 76, fill=C2, stroke=LINHA, sw=4))
    for x in range(1072, 1210, 14):
        o.append(f'<line x1="{x}" y1="262" x2="{x + 8}" y2="338" stroke="{LINHA}" stroke-width="3"/>')
    o.append(path('M1210,300 L1255,300', stroke=LINHA, sw=10))
    o.append(path('M1220,270 L1275,270 L1275,292', stroke=LINHA, sw=10))
    pts = []
    for k in range(14):
        r = 46 if k % 2 == 0 else 16
        a = k * math.pi / 7
        pts.append(f'{1290 + r * math.cos(a):.1f},{300 + r * math.sin(a):.1f}')
    o.append(f'<polygon points="{" ".join(pts)}" fill="{LAR}" stroke="{LAR}" stroke-width="2"/>')
    o.append(marca(1, 185, 520, 185, 420))
    o.append(marca(2, 450, 160, 450, 60))
    o.append(marca(3, 860, 470, 860, 330))
    o.append(marca(4, 1290, 470, 1290, 350))
    return svg(W, H, ''.join(o))



def icone_video():
    """Ícone de vídeo do padrão: câmera branca no círculo verde do logo (no lugar de logo de terceiro)."""
    o = [circ(100, 100, 98, fill=VERDE, stroke='none', sw=0)]
    o.append(rect(42, 66, 80, 68, fill=BRANCO, stroke='none', sw=0, rx=12))
    o.append(path('M128,88 L160,68 L160,132 L128,112 Z', fill=BRANCO, stroke=BRANCO, sw=4))
    return svg(200, 200, ''.join(o))



def direcao():
    """Direção com cremalheira vista de cima (frente para cima): volante, coluna, caixa, coifas, axiais e terminais."""
    global R
    R = 27
    W, H = 1360, 790
    o = []
    for x in (60, 1180):   # rodas
        o.append(rect(x, 300, 120, 260, fill=ESC, stroke=ESC, rx=30))
        o.append(rect(x + (90 if x < 600 else -40), 370, 70, 120, fill=C3, stroke=LINHA, sw=3, rx=10))
    # braço da manga
    o.append(path('M220,430 L290,470', stroke=LINHA, sw=14))
    o.append(path('M1140,430 L1070,470', stroke=LINHA, sw=14))
    # terminais de direção (pivô esférico)
    for x in (300, 1060):
        o.append(circ(x, 476, 26, fill=C2, stroke=LINHA, sw=4))
        o.append(circ(x, 476, 10, fill=LINHA, stroke=LINHA, sw=2))
    # axiais
    o.append(path('M326,480 L430,500', stroke=CINZA, sw=16))
    o.append(path('M1034,480 L930,500', stroke=CINZA, sw=16))
    for x in (436, 924):
        o.append(circ(x, 500, 18, fill=C1, stroke=LINHA, sw=4))
    # coifas (sanfona)
    for x0, d in ((450, 1), (910, -1)):
        pts = ' '.join(f'L{x0 + d * k * 14},{500 + (22 if k % 2 else -22)}' for k in range(1, 9))
        o.append(path(f'M{x0},500 {pts} L{x0 + d * 120},500', fill='none', stroke=ESC, sw=12))
    # caixa (tubo da cremalheira)
    o.append(rect(570, 476, 220, 48, fill=C2, stroke=LINHA, sw=5, rx=16))
    o.append(rect(650, 450, 70, 100, fill=C1, stroke=LINHA, sw=4, rx=12))
    # coluna e volante
    o.append(path('M685,450 L760,220', stroke=LINHA, sw=14))
    o.append(path('M760,220 L800,110', stroke=LINHA, sw=10))
    o.append(f'<ellipse cx="810" cy="90" rx="110" ry="40" fill="none" stroke="{ESC}" stroke-width="16"/>')
    # bomba hidráulica, reservatório e mangueiras
    o.append(circ(360, 190, 52, fill=VERDE, stroke=VESC, sw=4))
    o.append(circ(360, 190, 16, fill=BRANCO, stroke=VESC, sw=3))
    o.append(rect(470, 120, 90, 110, fill=BRANCO, stroke=LINHA, sw=4, rx=14))
    o.append(rect(474, 165, 82, 61, fill=LAR, stroke='none', sw=0, rx=10, extra='opacity="0.45"'))
    o.append(path('M412,190 C520,260 600,330 640,460', stroke=VESC, sw=8))
    o.append(path('M515,230 C560,330 620,380 700,450', stroke=VESC, sw=8, extra='stroke-dasharray="14 9"'))
    o.append(marca(1, 960, 70, 905, 95))
    o.append(marca(2, 900, 250, 750, 250))
    o.append(marca(3, 680, 650, 680, 545))
    o.append(marca(4, 520, 640, 520, 522))
    o.append(marca(5, 400, 640, 410, 500))
    o.append(marca(6, 300, 640, 300, 502))
    o.append(marca(7, 120, 660, 120, 560))
    o.append(marca(8, 250, 120, 320, 160))
    o.append(marca(9, 620, 90, 555, 150))
    return svg(W, H, ''.join(o))


def amortecedor_corte():
    """Amortecedor em corte (bitubo): coxim, haste, coifa, batente, tubos, pistão com válvulas, óleo e base."""
    global R
    R = 27
    W, H = 1360, 790
    o = []
    cx = 560
    # coxim e prato
    o.append(rect(cx - 120, 40, 240, 46, fill=ESC, stroke=ESC, rx=14))
    o.append(rect(cx - 70, 86, 140, 24, fill=C3, stroke=LINHA, sw=3, rx=6))
    # haste
    o.append(rect(cx - 16, 100, 32, 360, fill='#E8ECEA', stroke=LINHA, sw=4))
    # coifa e batente
    pts = ' '.join(f'L{cx + (60 if k % 2 else 44)},{120 + k * 16}' for k in range(1, 12))
    o.append(path(f'M{cx + 44},120 {pts} L{cx + 44},296 L{cx - 44},296 ' +
                  ' '.join(f'L{cx - (60 if k % 2 else 44)},{296 - k * 16}' for k in range(1, 12)) + ' Z',
                  fill=ESC, stroke=ESC, sw=3, extra='opacity="0.85"'))
    o.append(rect(cx - 30, 230, 60, 50, fill='#E9D79A', stroke=LINHA, sw=3, rx=10))
    # tubo externo (reservatório) e tubo de pressão
    o.append(rect(cx - 120, 300, 240, 430, fill=C1, stroke=LINHA, sw=6, rx=18))
    o.append(rect(cx - 70, 312, 140, 380, fill=BRANCO, stroke=LINHA, sw=4, rx=6))
    o.append(rect(cx - 66, 470, 132, 218, fill=LAR, stroke='none', sw=0, extra='opacity="0.35"'))
    o.append(rect(cx - 114, 560, 44, 160, fill=LAR, stroke='none', sw=0, extra='opacity="0.35"'))
    o.append(rect(cx + 70, 560, 44, 160, fill=LAR, stroke='none', sw=0, extra='opacity="0.35"'))
    # pistão com válvulas
    o.append(rect(cx - 66, 440, 132, 40, fill=C3, stroke=LINHA, sw=4, rx=6))
    for x in (cx - 36, cx + 36):
        o.append(circ(x, 460, 9, fill=BRANCO, stroke=LINHA, sw=3))
    # válvula de base
    o.append(rect(cx - 66, 660, 132, 26, fill=C3, stroke=LINHA, sw=3, rx=4))
    # olhal
    o.append(circ(cx, 752, 26, fill=C2, stroke=LINHA, sw=5))
    o.append(circ(cx, 752, 10, fill=BRANCO, stroke=LINHA, sw=3))
    o.append(marca(1, 300, 62, cx - 120, 62))
    o.append(marca(2, 300, 160, cx - 16, 160))
    o.append(marca(3, 300, 250, cx - 46, 250))
    o.append(marca(4, 820, 200, cx + 30, 255))
    o.append(marca(5, 300, 420, cx - 120, 420))
    o.append(marca(6, 820, 470, cx + 66, 460))
    o.append(marca(7, 300, 600, cx - 66, 600))
    o.append(marca(8, 820, 673, cx + 66, 673))
    return svg(W, H, ''.join(o))


def abs_sensor():
    """ABS: a roda fônica gira junto com a roda, o sensor lê os dentes e o módulo controla a pressão do freio."""
    global R
    R = 27
    W, H = 1360, 790
    o = []
    cx, cy = 420, 400
    o.append(circ(cx, cy, 300, fill=C1, stroke=LINHA, sw=6))
    o.append(circ(cx, cy, 200, fill=BRANCO, stroke=LINHA, sw=4))
    n = 40
    for k in range(n):
        a = 2 * math.pi * k / n
        x1, y1 = cx + 205 * math.cos(a), cy + 205 * math.sin(a)
        x2, y2 = cx + 240 * math.cos(a), cy + 240 * math.sin(a)
        o.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{VESC}" stroke-width="12"/>')
    o.append(circ(cx, cy, 90, fill=C2, stroke=LINHA, sw=4))
    for k in range(5):
        a = 2 * math.pi * k / 5
        o.append(circ(cx + 50 * math.cos(a), cy + 50 * math.sin(a), 11, fill=LINHA, stroke=LINHA, sw=2))
    # sensor
    o.append(rect(cx + 250, cy - 26, 120, 52, fill=ESC, stroke=ESC, rx=10))
    o.append(rect(cx + 240, cy - 14, 20, 28, fill=VERDE, stroke=VESC, sw=3, rx=4))
    o.append(path(f'M{cx + 370},{cy} C{cx + 470},{cy} {cx + 470},{cy - 220} {cx + 560},{cy - 220} L1040,{cy - 220}', stroke=ESC, sw=10))
    # módulo ABS
    o.append(rect(1040, cy - 300, 240, 170, fill=C2, stroke=LINHA, sw=5, rx=16))
    for k in range(4):
        o.append(circ(1090 + k * 48, cy - 110, 14, fill=LAR, stroke=LINHA, sw=3))
        o.append(path(f'M{1090 + k * 48},{cy - 96} L{1090 + k * 48},{cy + 40}', stroke=LAR, sw=5, extra='stroke-dasharray="10 8"'))
    # luz do painel
    o.append(circ(1160, 620, 70, fill=ESC, stroke=ESC, sw=2))
    o.append(f'<text x="1160" y="640" font-size="52" font-weight="bold" fill="{LAR}" text-anchor="middle">ABS</text>')
    o.append(marca(1, 120, 120, cx - 160, cy - 200))
    o.append(marca(2, 120, 700, cx - 140, cy + 170))
    o.append(marca(3, 700, 520, cx + 310, cy + 26))
    o.append(marca(4, 860, 120, 900, cy - 220))
    o.append(marca(5, 1320, 160, 1280, cy - 220))
    o.append(marca(6, 960, 620, 1090, 620))
    return svg(W, H, ''.join(o))


def freio_pesado():
    """Freio a ar da linha pesada: cuíca (câmara), haste, catraca (ajustador), eixo S e sapatas no tambor."""
    global R
    R = 27
    W, H = 1360, 790
    o = []
    # tambor e sapatas
    cx, cy = 960, 420
    o.append(circ(cx, cy, 300, fill='#F4F7F5', stroke=LINHA, sw=14))
    o.append(path(f'M{cx - 240},{cy - 120} A270,270 0 0,1 {cx - 120},{cy - 245}', stroke=LAR, sw=26))
    o.append(path(f'M{cx - 240},{cy + 120} A270,270 0 0,0 {cx - 120},{cy + 245}', stroke=LAR, sw=26))
    o.append(path(f'M{cx + 240},{cy - 120} A270,270 0 0,0 {cx + 120},{cy - 245}', stroke=C3, sw=0))
    o.append(path(f'M{cx - 210},{cy - 120} A240,240 0 0,1 {cx + 200},{cy - 140}', stroke=C3, sw=22))
    o.append(path(f'M{cx - 210},{cy + 120} A240,240 0 0,0 {cx + 200},{cy + 140}', stroke=C3, sw=22))
    o.append(path(f'M{cx - 230},{cy - 110} A250,250 0 0,1 {cx + 190},{cy - 160}', stroke=LAR, sw=14))
    o.append(path(f'M{cx - 230},{cy + 110} A250,250 0 0,0 {cx + 190},{cy + 160}', stroke=LAR, sw=14))
    # came S
    o.append(path(f'M{cx - 250},{cy - 50} C{cx - 200},{cy - 60} {cx - 200},{cy} {cx - 250},{cy} C{cx - 300},{cy} {cx - 300},{cy + 60} {cx - 250},{cy + 50}',
                  stroke=VESC, sw=18))
    o.append(circ(cx, cy, 60, fill=C1, stroke=LINHA, sw=4))
    # eixo do came até a catraca
    o.append(path(f'M{cx - 250},{cy} L420,{cy}', stroke=CINZA, sw=22))
    # catraca (ajustador)
    o.append(circ(420, cy, 56, fill=C2, stroke=LINHA, sw=5))
    o.append(circ(420, cy, 26, fill=BRANCO, stroke=LINHA, sw=4))
    o.append(path(f'M420,{cy} L420,{cy - 250}', stroke=LINHA, sw=26))
    o.append(circ(420, cy - 250, 16, fill=BRANCO, stroke=LINHA, sw=4))
    # cuíca (câmara de ar) e haste
    o.append(path(f'M140,{cy - 330} C60,{cy - 330} 60,{cy - 170} 140,{cy - 170} L260,{cy - 170} C320,{cy - 170} 320,{cy - 330} 260,{cy - 330} Z',
                  fill=ESC, stroke=ESC, sw=4))
    o.append(path(f'M300,{cy - 250} L404,{cy - 250}', stroke=C3, sw=14))
    o.append(path(f'M90,{cy - 330} L40,{cy - 380}', stroke=VERDE, sw=10))
    o.append(seta(330, cy - 280, 400, cy - 280, cor=VESC, sw=6))
    o.append(marca(1, 190, 120, 190, cy - 330))
    o.append(marca(2, 360, 70, 360, cy - 250))
    o.append(marca(3, 300, 600, 400, cy + 40))
    o.append(marca(4, 600, 300, 600, cy))
    o.append(marca(5, 620, 640, cx - 255, cy + 40))
    o.append(marca(6, 1300, 300, cx + 210, cy - 140))
    o.append(marca(7, 1300, 640, cx + 230, cy + 190))
    return svg(W, H, ''.join(o))


def cuica():
    """Cuíca dupla (serviço e mola) vista de lado, sem marca: substitui a foto de capa com marca de outro fabricante.
    Proporção perto de quadrada (750 x 620), para ocupar a caixa do painel como os desenhos de 900 x 900."""
    W, H = 750, 620
    cy = 330
    o = []
    # haste com rosca e garfo, saindo da câmara de serviço
    o.append(path(f'M70,{cy} L225,{cy}', stroke=C3, sw=22))
    o.append(''.join(path(f'M{x},{cy - 13} L{x + 8},{cy + 13}', stroke=LINHA, sw=3) for x in range(92, 180, 16)))
    o.append(rect(16, cy - 34, 60, 68, fill=C2, stroke=LINHA, sw=4, rx=8))
    o.append(circ(36, cy, 12, fill=BRANCO, stroke=LINHA, sw=4))
    # 2 prisioneiros de fixação
    for dy in (-115, 115):
        o.append(path(f'M165,{cy + dy} L235,{cy + dy}', stroke=LINHA, sw=12))
    # câmara de serviço, anel central e câmara de mola (diâmetro maior que o comprimento, como a peça)
    o.append(path(f'M235,{cy - 235} L340,{cy - 235} L340,{cy + 235} L235,{cy + 235} C200,{cy + 235} 200,{cy - 235} 235,{cy - 235} Z',
                  fill=ESC, stroke=ESC, sw=4))
    o.append(rect(340, cy - 250, 56, 500, fill=C1, stroke=LINHA, sw=4, rx=10))
    o.append(path(f'M396,{cy - 265} L600,{cy - 265} C670,{cy - 265} 670,{cy + 265} 600,{cy + 265} L396,{cy + 265} Z',
                  fill=ESC, stroke=ESC, sw=4))
    # abraçadeiras
    for x in (347, 389):
        o.append(path(f'M{x},{cy - 257} L{x},{cy + 257}', stroke=C2, sw=10))
    o.append(rect(350, cy - 285, 36, 34, fill=C2, stroke=LINHA, sw=3, rx=5))
    # entradas de ar (serviço e estacionamento)
    o.append(rect(265, cy - 283, 40, 50, fill=VERDE, stroke=VESC, sw=4, rx=6))
    o.append(rect(480, cy - 313, 40, 50, fill=VERDE, stroke=VESC, sw=4, rx=6))
    # tampa da câmara de mola (parafuso de liberação)
    o.append(circ(668, cy, 26, fill=C2, stroke=LINHA, sw=4))
    o.append(path(f'M694,{cy} L736,{cy}', stroke=LINHA, sw=12))
    return svg(W, H, ''.join(o))


DESENHOS = {
    'carro_sistemas': carro_sistemas,
    'motor_corte': motor_corte,
    'quatro_tempos': quatro_tempos,
    'arrefecimento': arrefecimento,
    'transmissao': transmissao,
    'suspensao': suspensao,
    'freio_disco': freio_disco,
    'freio_tambor': freio_tambor,
    'freio_hidraulico': freio_hidraulico,
    'ignicao': ignicao,
    'icone_video': icone_video,
    'direcao': direcao,
    'amortecedor_corte': amortecedor_corte,
    'abs_sensor': abs_sensor,
    'freio_pesado': freio_pesado,
    'cuica': cuica,
}


def gerar(nome, pasta, largura_px=None):
    import cairosvg
    os.makedirs(pasta, exist_ok=True)
    s = DESENHOS[nome]()
    p_svg = os.path.join(pasta, nome + '.svg')
    p_png = os.path.join(pasta, nome + '.png')
    with open(p_svg, 'w', encoding='utf-8') as f:
        f.write(s)
    cairosvg.svg2png(bytestring=s.encode('utf-8'), write_to=p_png, output_width=largura_px)
    return p_png


if __name__ == '__main__':
    destino = sys.argv[1] if len(sys.argv) > 1 else 'saidas/desenhos'
    for n in (sys.argv[2:] or DESENHOS):
        print(gerar(n, destino))
