"""Tipos de slide do padrão (T-0032, onda 2): traduz {"tipo": ..., conteúdo} para o slide-modelo do original de
Baterias (nº do slide) e os índices das formas, os mesmos que a Mecânica Básica usa.

Comum a todos os tipos de conteúdo: "k" (kicker), "t" (título), "dica" (faixa DICA DE CAMPO), "notas".
Textos aceitam as macros do treinamento_molde.py ({{cod:...}}, {{oj:...}}, {{prod:...}}, {{n:PRODUTO}}...).
"""
import copy

DATA = 'Equipe Comercial Externa  ·  Novembro de 2026'
DICA = 'DICA DE CAMPO  |'
MOTIVOS = ('prazo ou limite', 'preço', 'disponibilidade', 'aplicação', 'fornecedor', 'sem necessidade')   # RD-0631 (R-20261127-200014-alexandre, item 2): a mesma do Onboarding
# "Não fechou?" com os 6 motivos da faixa (R-20261127-224247-alexandre, item 5). A 6.ª linha (forma 12) é a cópia da 4.ª,
# de fundo verde, para as cores seguirem alternadas. As 6 cabem acima da faixa ATENÇÃO com 0,65 pol. (≈47 pt) cada;
# o cabeçalho fica com a altura do molde.
_LINHA = 0.65
_TOPO, _CAB = 1.6, 0.42          # topo da tabela e altura do cabeçalho no molde 44 (pol.)
NAOFECHOU_6 = {
    'copiar': [{'formas': [5]}],
    'mover': {'2': [None, None, None, _CAB + _LINHA],
              **{str(k): [None, round(_TOPO + _CAB + _LINHA * i, 2), None, _LINHA]
                 for i, k in enumerate((3, 4, 5, 6, 12), 1)}},
    'altura_linhas': {'2': [None, _LINHA], **{str(k): [_LINHA] for k in (3, 4, 5, 6, 12)}},
}
NOTAS_FECHAMENTO = ('MENSAGEM-CHAVE\nFechar é uma etapa da venda, não um susto no fim. São três frases que todo vendedor '
                    'deve saber de cor.\n\nCOMO CONDUZIR\nLeia as três frases em voz alta e peça para o time repetir. '
                    'Reforce a faixa escura: sem pedido, o motivo é anotado — é assim que a gestão descobre onde perde venda.'
                    '\n\nPERGUNTE AO TIME\nNeste sistema, qual dos 6 motivos vocês mais escutam?')
NOTAS_CHECKLIST = ('MENSAGEM-CHAVE\nO checklist resume o treinamento em 12 atitudes. Vale usar antes de cada visita.\n\n'
                   'COMO CONDUZIR\nVolte ao slide “Ao final deste treinamento” e mostre que cada verbo virou um item. '
                   'Peça para cada um marcar o que já faz e escolher um item para começar amanhã.\n\n'
                   'PERGUNTE AO TIME\nQual item faria mais diferença no seu resultado do mês?')


def _base(s, molde):
    o = {'molde': molde, 't': {}, 'icone': {}, 'img': {}, 'mover': {}}
    if 'k' in s:
        o['t']['0'] = s['k']
    if 't' in s:
        o['t']['1'] = s['t']
    for chave in ('notas', 'copiar', 'apagar', 'preencher', 'cor_texto', 'tamanho'):
        if chave in s:
            o[chave] = s[chave]
    return o


def _dica(o, idx, s):
    if 'dica' in s:
        o['t'][str(idx)] = DICA + s['dica']


def _itens(o, lista, idx_t, idx_d=None, idx_i=None):
    for k, it in enumerate(lista):
        o['t'][str(idx_t[k])] = it[0]
        if idx_d is not None:
            o['t'][str(idx_d[k])] = it[1]
        if idx_i is not None and it[-1]:
            o['icone'][str(idx_i[k])] = it[-1]


def legenda(nomes):
    meio = (len(nomes) + 1) // 2
    fmt = lambda a, b: '\n'.join(f'{k:02d}  |{n}' for k, n in enumerate(nomes[a:b], a + 1))
    return fmt(0, meio), fmt(meio, len(nomes))


def expandir(s):
    tp = s['tipo']
    if tp in ('capa', 'obrigado'):
        o = _base(s, 1 if tp == 'capa' else 47)
        o['t'] = {'0': s.get('sobre', 'TREINAMENTO COMERCIAL'), '1': s['titulo'], '2': s['sub']}
        if tp == 'capa':
            o['t']['3'] = DATA
    elif tp == 'aprender':
        o = _base(s, 2)
        o['t'].update({'2': s['frase'], '3': s['apoio']})
        _itens(o, s['pilares'], [7, 12, 17], [8, 13, 18], [6, 11, 16])
    elif tp == 'topicos':
        o = _base(s, 3)
        _itens(o, s['itens'] + [['Fechamento', 'Checklist do vendedor e teste de conhecimentos', 'FaListCheck']],
               [6, 12, 18, 24, 30, 36, 42, 48], [7, 13, 19, 25, 31, 37, 43, 49], [5, 11, 17, 23, 29, 35, 41, 47])
        o['mover'] = {str(k): [None, 3.38, None, None] for k in (7, 13, 19, 25)}
        o['mover'].update({str(k): [None, 5.98, None, None] for k in (31, 37, 43, 49)})
    elif tp == 'preparado':
        o = _base(s, 4)
        _itens(o, s['itens'], [5, 10, 15, 20, 25, 30], [6, 11, 16, 21, 26, 31], [4, 9, 14, 19, 24, 29])
    elif tp == 'secao':
        o = _base(s, 5)
        o['t'] = {'0': s['n'], '1': s['titulo'], '2': s['sub']}
    elif tp == 'desenho':
        o = _base(s, 7)
        o['img']['3'] = s['img']
        o['t']['4'], o['t']['5'] = legenda(s['legenda'])
        _dica(o, 9, s)
    elif tp == 'definicao':
        o = _base(s, 6)
        o['t'].update({'2': s.get('rotulo', 'DEFINIÇÃO'), '3': s['def'], '4': s['n1'], '5': s['d1'], '6': s['n2'],
                       '7': s['d2'], '10': s['pergunta'], '11': s['resposta']})
        if 'img' in s:
            o['img']['9'] = s['img']
        _dica(o, 15, s)
    elif tp == 'cartoes8':
        o = _base(s, 31)
        _itens(o, s['cartoes'], [5 + 5 * k for k in range(8)], [6 + 5 * k for k in range(8)], [4 + 5 * k for k in range(8)])
        (n1, d1), (n2, d2) = s['painel']
        o['t'].update({'43': n1, '44': d1, '45': n2, '46': d2, '47': s.get('fonte', '')})
    elif tp == 'passos5':
        o = _base(s, 28)
        _itens(o, s['passos'], [7, 15, 23, 31, 39], [8, 16, 24, 32, 40], [6, 14, 22, 30, 38])
        _dica(o, 44, s)
    elif tp == 'paineis':
        o = _base(s, 8)
        (t1, i1, img1), (t2, i2, img2) = s['paineis']
        o['t'].update({'3': t1, '5': i1, '7': t2, '9': i2})
        o['img'].update({'4': img1, '8': img2})
        o['mover'] = {'4': [0.85, 2.35, 3.05, 3.2], '8': [7.03, 2.35, 3.05, 3.2]}
        if 'legendas' in s:   # legenda numerada sob cada desenho (texto copiado do slide 12 do original)
            o['copiar'] = [{'molde': 12, 'formas': [4, 4]}]
            o['mover'].update({'4': [0.85, 2.3, 3.05, 2.7], '8': [7.03, 2.3, 3.05, 2.7], '5': [None, None, None, 2.55],
                               '9': [None, None, None, 2.55], '15': [0.90, 5.05, 5.40, 0.60], '16': [7.08, 5.05, 5.40, 0.60]})
            o['t']['15'], o['t']['16'] = s['legendas']
        _dica(o, 13, s)
    elif tp == 'foto2':
        o = _base(s, 13)
        o['img']['3'] = s['img']
        (ia, da, ca), (ib, db, cb) = s['itens']
        o['img'].update({'4': ia, '7': ib})
        o['t'].update({'5': da, '6': ca, '8': db, '9': cb})
        # cada item numa linha: foto de 2,1" x 1,9" e o texto ao lado, até a margem (MENOS É MAIS, T-0045)
        o['mover'] = {'4': [6.2, 1.66, 2.1, 1.9], '5': [8.5, 1.9, 4.23, 0.85], '6': [8.5, 2.8, 4.23, 0.45],
                      '7': [6.2, 3.8, 2.1, 1.9], '8': [8.5, 4.04, 4.23, 0.85], '9': [8.5, 4.94, 4.23, 0.45]}
        _dica(o, 13, s)
    elif tp == 'lista4':
        o = _base(s, 12)
        o['img']['3'] = s['img']
        o['t']['4'] = s['legenda']
        _itens(o, s['itens'], [7, 10, 13, 16], None, [6, 9, 12, 15])
        _dica(o, 20, s)
    elif tp == 'sinais':
        o = _base(s, 40)
        o['t'].update({'3': s['t1'], '17': s['t2']})
        _itens(o, s['itens1'], [6, 9, 12, 15], None, [5, 8, 11, 14])
        for k, txt in enumerate(s['itens2']):
            o['t'][str([20, 23, 26][k])] = txt
        _dica(o, 30, s)
    elif tp == 'numero':
        o = _base(s, 24)
        o['img']['3'] = s['img']
        o['t'].update({'4': s['numero'], '5': s['desc'], '19': 'Exemplo:  |' + s['exemplo']})
        for k, txt in enumerate(s['passos']):
            o['t'][str([8, 11, 14, 17][k])] = txt
    elif tp == 'indicadores':
        o = _base(s, 17)
        for k, (ic, grande, sub, desc, sig) in enumerate(s['cards']):
            b = 4 + 7 * k
            o['icone'][str(b)] = ic
            o['t'].update({str(b + 1): grande, str(b + 2): sub, str(b + 3): desc, str(b + 4): sig})
        if any(len(w) > 9 for c in s['cards'] for w in c[1].replace('-', ' ').split()) or any('-' in c[1] for c in s['cards']):
            o['tamanho'] = {str(4 + 7 * k + 1): 22 for k in range(4)}   # palavra longa: título menor, sem quebrar
        if any(len(c[1]) > 10 for c in s['cards']):   # título em 2 linhas (Arial): o resto do cartão desce
            for k in range(4):
                b = 4 + 7 * k
                o['mover'].update({str(b + 1): [None, None, None, 1.0], str(b + 2): [None, 3.42, None, None],
                                   str(b + 3): [None, 3.86, None, 1.12], str(b + 4): [None, 5.05, None, None]})
        _dica(o, 33, s)
    elif tp == 'barulhos':
        o = _base(s, 41)
        o['t'].update({'3': s['t1'], '17': s['numero'], '18': s['desc'], '20': s['t2'], '21': s['texto2']})
        _itens(o, s['itens'], [6, 9, 12, 15], None, [5, 8, 11, 14])
        _dica(o, 25, s)
    elif tp == 'numero3':
        o = _base(s, 30)
        o['icone']['3'] = s['icone']
        o['t'].update({'4': s['numero'], '5': s['desc']})
        _itens(o, s['cards'], [9, 14, 19], [10, 15, 20], [8, 13, 18])
        _dica(o, 24, s)
    elif tp in ('tabela', 'naofechou'):
        o = _base(s, 44)
        cab = s.get('cabecalho', ['Motivo', 'Responda com prova', 'Volte ao pedido'])
        linhas = s['linhas']
        o['tabela'] = {'2': [cab, linhas[0]], '3': [linhas[1]], '4': [linhas[2]], '5': [linhas[3]], '6': [linhas[4]]}
        if tp == 'naofechou':
            o.update(copy.deepcopy(NAOFECHOU_6))
            o['tabela']['12'] = [linhas[5]]
            nomes = [ln[0] for ln in linhas]
            if nomes != [m[0].upper() + m[1:] for m in MOTIVOS]:
                raise SystemExit(f'[PARADO] "Não fechou?": as linhas {nomes} fogem da faixa {MOTIVOS}')
        o['t']['10'] = 'ATENÇÃO  |' + s.get('atencao', 'Desconto só dentro da alçada de 15%; acima disso, o Price aprova. '
                                                      'Prazo e limite: nunca prometa fora da regra.')
    elif tp == 'spin':
        o = _base(s, 37)
        for k, (sub, perg) in enumerate(s['spin']):
            o['t'].update({str(6 + 6 * k): sub, str(7 + 6 * k): perg})
        _dica(o, 29, s)
    elif tp == 'hub':
        o = _base(s, 39)
        _itens(o, s['itens'], [4, 9, 14], [5, 10, 15], [3, 8, 13])
        _itens(o, s['cards'], [19, 24, 29], [20, 25, 30], [18, 23, 28])
        _dica(o, 34, s)
    elif tp == 'combos':
        o = _base(s, 42)
        for k, (nome, itens, ex) in enumerate(s['combos']):
            o['t'].update({str(5 + 6 * k): nome, str(6 + 6 * k): itens, str(7 + 6 * k): ex})
        for k, p in enumerate(s['pergunte']):
            o['t'][str(22 + k)] = p
        o['mover'] = {str(k): [None, 2.85, None, 1.05] for k in (6, 12, 18)}
        o['mover'].update({str(k): [None, 3.95, None, 0.55] for k in (7, 13, 19)})
        _dica(o, 28, s)
    elif tp == 'fechamento':
        o = _base(s, 43)
        o['t'].update({
            '6': '“Fechamos com esses itens?”',
            '7': 'Direto, logo depois de mostrar a aplicação no catálogo. Não espere o cliente pedir.',
            '12': '“O que falta pra fechar hoje?”',
            '13': f'Escute até o fim: o motivo é um dos {len(MOTIVOS)} da faixa abaixo.',
            '18': '“Se eu resolver isso, fechamos?”',
            '19': 'Prenda o cliente antes de resolver. Só resolva o que está dentro da regra.',
            '21': 'Sem pedido? Anote o motivo:  |' + ' · '.join(MOTIVOS)})
        o['tamanho'] = {'21': 15}   # a lista dos 6 motivos numa linha só
        _dica(o, 25, s)
        o.setdefault('notas', NOTAS_FECHAMENTO)
    elif tp == 'checklist':
        o = _base(s, 45)
        o['t']['0'] = 'FECHAMENTO'
        for k, txt in enumerate(s['itens']):
            o['t'][str(5 + 4 * k)] = txt
        o.setdefault('notas', NOTAS_CHECKLIST)
    elif tp == 'quiz':
        o = _base(s, 46)
        o['t'].update({'0': 'FECHAMENTO', '1': 'Teste seus conhecimentos'})
        for k, p in enumerate(s['perguntas']):
            o['t'][str(5 + 4 * k)] = p
        o['notas'] = ('MENSAGEM-CHAVE\nO teste fixa os pontos principais. Faça em duplas ou em voz alta, sem consultar.'
                      '\n\nCOMO CONDUZIR\nLeia uma pergunta por vez, dê 30 segundos e peça a resposta a alguém diferente.'
                      '\n\nRESPOSTAS\n' + '\n'.join(f'{k}. {r}' for k, r in enumerate(s['respostas'], 1)))
    else:
        raise SystemExit('[PARADO] tipo de slide desconhecido: ' + tp)
    for chave in ('icone', 'img', 'mover'):
        if not o[chave]:
            del o[chave]
    if 'mover_extra' in s:
        o.setdefault('mover', {}).update(s['mover_extra'])
    if 't_extra' in s:
        o['t'].update(s['t_extra'])
    o['tipo'] = tp
    return o


def expandir_cfg(cfg):
    if not any('tipo' in s for s in cfg.get('slides', [])):
        return cfg
    cfg['slides'] = [expandir(s) if 'tipo' in s else s for s in cfg['slides']]
    tipos = [s.get('tipo') for s in cfg['slides']]

    def primeiro(*ts):
        for t in ts:
            if t in tipos:
                return tipos.index(t) + 1
    if 'pares' not in cfg:
        cfg['pares'] = [p for p in (primeiro(t) for t in ('aprender', 'desenho', 'cartoes8', 'foto2', 'sinais', 'numero',
                                                            'hub', 'combos')) if p]
    if 'mosaico' not in cfg:
        cfg['mosaico'] = [p for p in (primeiro(t) for t in ('capa', 'topicos', 'desenho', 'foto2', 'cartoes8', 'numero',
                                                            'hub', 'combos')) if p]
    return cfg
