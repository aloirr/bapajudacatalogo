"""T-0031 (item 4a): simulação, só leitura da base. Uso: python3 -I simular_T-0031.py <base.xlsx> <saida.xlsx>"""
import sys, openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
base, saida = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(base, read_only=True)

def produto(cod):
    ws = wb['PRODUTOS']
    for i, r in enumerate(ws.iter_rows(values_only=True), 1):
        if r[0] == cod: return i, r
def veiculo(cod, fab, mod):
    ws = wb['VEICULOS']
    for i, r in enumerate(ws.iter_rows(values_only=True), 1):
        if r[0] == cod and r[1] == fab and r[2] == mod: return i, r
P = ['CODIGO_BAP','DESCRICAO','APLICACAO','REFERENCIAS_CRUZADAS','DADOS_ADICIONAIS','PRODUTO','CATEGORIA','SISTEMA','FAMILIA','LINHA']
V = ['CODIGO_BAP','FABRICANTE','MODELO','VERSAO','ANO_INICIO','ANO_FIM','ORIGEM','SITUACAO','MOTIVO','CILINDRADA','ANO_DUVIDA']
MOT_V = ("'Cargo' aqui é o Doblò Cargo (versão do Fiat), não o caminhão Ford Cargo; sai do filtro do site até a revisão")

def lin_prod(cod, depois, porque):
    i, r = produto(cod); a = r[P.index('LINHA')]
    return ['PRODUTOS', i, cod, r[P.index('PRODUTO')], 'LINHA', a, depois, r[2], porque]
def lin_veic(cod, porque):
    i, r = veiculo(cod, 'FORD', 'Cargo')
    return [['VEICULOS', i, cod, 'FORD Cargo', 'SITUACAO', r[V.index('SITUACAO')], 'duvidoso', '', porque],
            ['VEICULOS', i, cod, 'FORD Cargo', 'MOTIVO', r[V.index('MOTIVO')] or '', MOT_V, '', porque]]

CAB = ['ABA','LINHA_NA_PLANILHA','CODIGO_BAP','PRODUTO_OU_VEICULO','COLUNA','ANTES','DEPOIS','APLICACAO (não muda)','MOTIVO_E_FONTE']
F_BIE = ("Doblò é utilitário leve. Fontes da própria base: refs só de linha leve (OEM Fiat 46836399, Nakata N96003, "
         "Cofap BTC03201, TRW JTSB0036, Axios BR19353102157); o gerador antigo (catalogo_grafico/gerador/taxo.py, HEAVY) "
         "marca PESADA ao ler a palavra 'Cargo' e não conhece o modelo Doblò. Regra do legado: só veículo pesado = PESADA.")
F_VBIE = "A APLICACAO diz 'Doblo (exc. Cargo)': o Cargo é excluído, e é a versão do Doblò. A leitura automática da T-0017 criou 'FORD Cargo'."

pedido = [lin_prod('BIE20042', 'LEVE', F_BIE)] + lin_veic('BIE20042', F_VBIE)

F_MESMA = "Mesma causa do BIE20042: 'Cargo' do Doblò/Fiat lido como caminhão Ford Cargo; aplicação só de Fiat leve."
extra = [lin_prod('BOR11030', 'LEVE', F_MESMA + " Aplicação: Doblô Cargo, Fiorino, Strada, Palio Weekend, Siena, Grand Siena.")]
extra += lin_veic('BOR11030', "A APLICACAO diz 'Doblô Cargo 1.3 / 1.6 / 1.8': a linha FIAT Doblo já existe na aba VEICULOS.")
for c in ['AMT7084', 'AMT7115', 'BAN9513', 'BAN9516']:
    extra.append(lin_prod(c, 'LEVE', F_MESMA + " Na aba VEICULOS a linha 'FORD Cargo' deste código já está 'duvidoso' (fora do site): sem mudança lá."))

i, r = produto('FAC6260')
conf = [['FAC6260', r[P.index('LINHA')], r[2], r[3], 'Fonte: FILTROS_TABELA_APLICACAO_2026.pdf (DADOS_ADICIONAIS), Tecfil ACP213',
         'Certo segundo a fonte. Focus e V40 (2013>) são leves e o VW Delivery 2018> é pesado: LEVE E PESADA está pela regra. '
         'Focus III e Volvo V40 (2012–2019) são da mesma plataforma Ford (C1) [SUPOSIÇÃO: conhecimento geral, não conferido no catálogo Tecfil]. '
         'Não deu para conferir o catálogo Tecfil fora da base (o acesso à internet é bloqueado neste ambiente).',
         'Nada na base. O estranho é a página da Linha Pesada do Portfólio listar os carros leves do item LEVE E PESADA (é do gerador, catalogo-grafico).',
         'Atenção: FAC6227 (Tecfil ACP206) também diz Focus 2.0 2014–2015 (Titanium Plus Powershift). Duas cabines para o mesmo Focus: pode ser versão diferente ou uma estar errada; sem certeza.']]
CAB_C = ['CODIGO_BAP','LINHA (fica)','APLICACAO','REFERENCIAS_CRUZADAS','FONTE','VEREDITO','CORRECAO','OBSERVACAO']

pdf = [
 ['Portfólio', 'p. 46 (Linha Pesada · Suspensão · Bieletas, 3 itens)', 'Some: fica com 2 itens (F4000), abaixo do mínimo de 3 (portfolio.py, MINIMO). A divisória da Linha Pesada perde Bieletas, e a capa passa de 25 para 24 produtos na Pesada; o PDF fica com 1 página a menos.', 'BIE20042'],
 ['Portfólio', 'p. 7 (Linha Leve · Bieletas, 124 itens)', 'Passa a 125 itens.', 'BIE20042'],
 ['Portfólio', 'p. 62 (Linha Pesada · Filtros de Cabine)', 'Sem mudança pela base: Ford Focus e Volvo V40 continuam, porque o FAC6260 é LEVE E PESADA. Para sair, o gerador precisa listar na Pesada só os veículos pesados (decisão e trabalho do catalogo-grafico).', 'FAC6260'],
 ['Portfólio (só se aprovar a aba MESMA_CAUSA)', 'p. 45 (Linha Pesada · Amortecedores, 5 itens)', 'Passa a 3 itens (MB OF1721/OF1722/OF1724) e sai o "Fiat Dobló" das principais aplicações.', 'AMT7084, AMT7115'],
 ['Portfólio (só se aprovar a aba MESMA_CAUSA)', 'p. 8 (Linha Leve · Bucha da Barra Estabilizadora, 30 itens)', 'Passa a 31 itens.', 'BOR11030'],
 ['Catálogo BAP 2027 (gráfica, digital, Moto)', '—', 'Sem mudança: é organizado por sistema e não usa a LINHA.', '—'],
 ['Kit Filtros', '—', 'Sem mudança: o FAC6260 não muda.', '—'],
 ['Site (web-site regera)', '—', 'Muda o campo de linha do BIE20042 e sai o "Ford Cargo" do filtro Meu veículo para o BIE20042.', 'BIE20042'],
]

out = openpyxl.Workbook()
def aba(nome, cab, linhas, larg):
    ws = out.create_sheet(nome); ws.append(cab)
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor='1F5F3A')
    for l in linhas: ws.append(l)
    for j, w in enumerate(larg, 1): ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = w
    for row in ws.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(wrap_text=True, vertical='top')
    ws.freeze_panes = 'A2'
out.remove(out.active)
L = [10, 10, 12, 22, 10, 16, 22, 40, 70]
aba('ANTES_E_DEPOIS', CAB, pedido, L)
aba('CONFERIDO_SEM_MUDANCA', CAB_C, conf, [10, 14, 45, 16, 30, 60, 45, 50])
aba('MESMA_CAUSA_FORA_DO_PEDIDO', CAB, extra, L)
aba('EFEITO_NOS_PDFS', ['MATERIAL', 'PAGINA', 'O QUE MUDA', 'CODIGOS'], pdf, [26, 40, 80, 18])
out.save(saida)
print('ok', len(pedido), len(extra))
