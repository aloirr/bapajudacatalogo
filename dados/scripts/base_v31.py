"""v31 da base unificada · T-0042 (correções pontuais da base), SIMULAÇÃO.

Pedido: R-20261127-161035-alexandre ("25 · BapAjuda, próxima tarefa: b (correções pontuais da base)"). Códigos:
INT16529, LAM2004, CRU5280, CRU512022, ROL15106/15250, INT16639, INT16652, SFR30034, VEL7520, POL1712 e FCB6266.
Regras do pedido: cada correção com a fonte (base antiga, catálogo, referência cruzada), sem inventar; o que não tem
fonte fica listado (SEM_FONTE) e não muda; o que é do site fica listado (DO_SITE) e não muda a base; nada é marcado
nem escrito como duvidoso (R-20261120-213300: a marca da revisão da P12 só sai, nunca entra).

Só a aba VEICULOS muda (a APLICACAO e os outros campos digitados da PRODUTOS ficam como estão):
- CELULAS: as células trocadas, cada uma com o valor de hoje conferido antes;
- REMOVIDAS: as linhas que saem (o veículo que não existe na aplicação), com a linha de hoje conferida antes;
- NOVAS: as linhas novas no fim da aba (ORIGEM 'automático', como as linhas do texto da APLICACAO na v29).
Cada mudança leva o ponto da aba PONTOS_ALEXANDRE que a decide; a simulação mostra a opção a) de todos.

A conferência é em duas etapas, com o base_comum.comparar: (1) a base com as CELULAS, as REMOVIDAS, o LOG_CORRECOES e o
LEIA-ME contra a v30 (removidas); (2) a base final contra a da etapa 1 (novas_no_fim). O "duvidoso" não sobe.

AUTORIZAÇÃO: a simulação não mexe na base nem em dados/versoes; grava a dados/T-0042/v31/BASE_simulada_v31.xlsx e a
antes_depois_v31.xlsx com "pendente do aprovado do Alexandre". Depois do aprovado (e das respostas dos PONTOS, que
podem tirar mudanças desta lista), o --refazer parte da v30 do origin/main e grava a base e a v31.

Uso: python3 dados/scripts/base_v31.py                                (simulação)
     python3 dados/scripts/base_v31.py --refazer --autorizacao "R-…"  (depois do aprovado)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent))
from base_comum import (BASE, CAB_VEICULOS, INTERNO, RAIZ, aba, acrescentar_leia_me, acrescentar_linhas,  # noqa: E402
                        acrescentar_log, antes_log, comparar, conferir_cabecalho, contar_duvidoso, gerar_site_copia,
                        gravar, limpo, parar, refazer, sha, texto_novo_difere, versao)

TAREFA, DATA = "T-0042", "27/11/2026"
AUTORIZACAO = "pendente do aprovado do Alexandre"
SAIDA = RAIZ / "dados" / "T-0042" / "v31"
SIM = SAIDA / "BASE_simulada_v31.xlsx"
AD = SAIDA / "antes_depois_v31.xlsx"
COL = {c: CAB_VEICULOS.index(c) + 1 for c in CAB_VEICULOS}          # coluna do Excel (1 = CODIGO_BAP)
SEPARADO, ORIGEM_TEXTO = "separado", "automático"
CODIGOS = ["INT16529", "LAM2004", "CRU5280", "CRU512022", "ROL15106/15250", "INT16639", "INT16652", "SFR30034",
           "VEL7520", "POL1712", "FCB6266"]

# ---------------------------------------------------------------- fontes (citadas em cada mudança e no LOG)
F_VEL = ("APLICACAO da v8 (a faixa vale para o produto inteiro): 'FIAT/GM/VW - Fiat Uno, Palio, Siena, Strada, Punto "
         "(Motores Fire Flex e T-Jet 1.4 Turbo) ; GM - Astra, Vectra 2.0 Flexpower / GNV ; VW - Gol/Fox 1.0 Flex GNV · "
         "2004–2020 · 1.0, 1.4, 1.8, 2.0 8V Flex / GNV / Motores Turbo · Green Plug (Sulco em V)'; aba VELAS_INTEGRADAS "
         "(cadastro master de velas, aplicação confirmada): '… VW Gol/Fox 1.0 Flex GNV - 2004 a 2020 - …'")
F_VEL_V8 = "APLICACAO (digitada desde a v8): 'VW - Gol/Fox 1.0 Flex GNV · 2004–2020', o mesmo modelo e a mesma faixa"
F_VEL_V14 = "APLICACAO (trecho que entrou na v14): o mesmo modelo e a mesma faixa"
F_ROL = ("DADOS_ADICIONAIS do ROL15106/15250 e aba ROLAMENTOS_INTEGRADOS (cadastro master de rolamentos, aplicação "
         "confirmada): MODELOS 'Ford F-4000, F-350; GM D40, A40, C40; Iveco Daily 35.10, 49.12; Agrale 6000', "
         "ANO_INICIO 1978, ANO_FIM 2012")
F_SFR = ("APLICACAO (digitada desde a v8): 'Bongo K-2400 2.4 1993–1997 T · Bongo K-2700 1997>'; pesquisa da T-0040 "
         "(id_linha 20975, SYL 204603: 'BONGO K-2400: 1993-1997')")

# (código, linha do Excel, coluna, antes, depois, fonte, ponto)
CELULAS: list[tuple] = [
    ("SFR30034", 20976, "VERSAO", None, "K-2400", F_SFR, "P10"),
    ("SFR30034", 20976, "CILINDRADA", "2.4 / 2.7", "2.4", F_SFR, "P10"),
]
for _n in range(4674, 4678):                                          # F-4000, F-350, D40 e Daily, sem ano
    CELULAS += [("ROL15106/15250", _n, "ANO_INICIO", None, 1978, F_ROL, "P4"),
                ("ROL15106/15250", _n, "ANO_FIM", None, 2012, F_ROL, "P4")]
# a Versão do texto na linha do Daily: com o ano, sem ela o site mostra o Daily duas vezes (com e sem '35.10, 49.12')
CELULAS.append(("ROL15106/15250", 4677, "VERSAO", None, "35.10, 49.12",
                "APLICACAO (digitada desde a v8): 'IVECO - Daily 35.10, 49.12'", "P4"))
# VEL7520: as 7 linhas do texto da v8 (Uno, Palio, Siena, Strada, Punto, Astra e Vectra: o ano de hoje é a soma da
# Fraga da v29, que tem linha própria, ou nenhum) recebem a faixa do produto, 2004–2020; as 8 linhas cujo ano já é o da
# APLICACAO ficam com ele; todas marcadas na revisão da P12 pela LIFAN e pela VOLVO sem modelo (as linhas 35056 e 35057
# continuam marcadas): a marca e o MOTIVO saem (como no item 13 da v30)
for _n, _ini, _fim in ((35041, 1998, 2003), (35042, 1999, 2019), (35043, 2010, 2019), (35044, 2010, 2019)):
    CELULAS += [("VEL7520", _n, "VERSAO", None, "Fire Flex", F_VEL, "P3"),
                ("VEL7520", _n, "ANO_INICIO", _ini, 2004, F_VEL, "P3"),
                ("VEL7520", _n, "ANO_FIM", _fim, 2020, F_VEL, "P3")]
# Punto, Astra e Vectra: a mesma faixa do produto; a Versão é o trecho do texto que o site já põe na linha deles (com
# outra Versão, o site mostra o Punto duas vezes)
for _n, _ver, _ini, _fim in ((35045, "Motores Fire Flex e T-Jet 1.4 Turbo", 2010, 2017), (35046, None, None, None),
                             (35047, "2.0 Flexpower / GNV", 2005, 2009)):
    CELULAS += [("VEL7520", _n, "ANO_INICIO", _ini, 2004, F_VEL, "P3"), ("VEL7520", _n, "ANO_FIM", _fim, 2020, F_VEL, "P3")]
    CELULAS += [("VEL7520", _n, "VERSAO", None, _ver, F_VEL, "P3")] if _ver else []
for _n in (35041, 35042, 35043, 35044, 35045, 35046, 35047, 35048, 35049, 35050, 35051, 35052, 35053, 35054, 35055):
    _f = F_VEL if _n < 35048 else F_VEL_V8 if _n < 35050 else F_VEL_V14     # Gol e Fox: v8; Bravo a Captur: v14
    CELULAS += [("VEL7520", _n, "SITUACAO", "duvidoso", SEPARADO, _f, "P3"),
                ("VEL7520", _n, "MOTIVO", "*", None, _f, "P3")]   # "*": o MOTIVO de hoje

# (código, linha do Excel, (FABRICANTE, MODELO, VERSAO, ANO_INICIO, ANO_FIM, SITUACAO) de hoje, fonte, ponto)
REMOVIDAS: list[tuple] = [
    ("POL1712", 33828, ("AUDI", "A6", None, 1998, 2001, SEPARADO),
     "APLICACAO (digitada desde a v8): 'Volare A6 4.07TCA 1998–2001 Mwm Sprint' (o A6 é a versão do Volare; nenhuma "
     "Audi no texto); linha 33834 da Fraga: MARCOPOLO Volare 'A6 · SPRINT EURO 2 2.8 L' 1998–2001", "P2"),
    ("LAM2004", 40101, ("VOLKSWAGEN", "Polo", None, None, None, SEPARADO),
     "DESCRICAO 'LAMPADA AUTOMOTIVA BAP 1141 01 POLO GRANDE 21W 12V' e APLICACAO 'Lâmpada 1 Polo Pino Encontrado 12V "
     "21W…' (aba INCLUIDOS_V7: Catálogo BAP 12_Lâmpadas): o 'polo' é o polo elétrico; pesquisa da T-0040 (id_linha "
     "40100): nenhum catálogo traz o VW Polo", "P1"),
]

# (código, FABRICANTE, MODELO, VERSAO, ANO_INICIO, ANO_FIM, fonte, ponto); ORIGEM 'automático', 'separado'
NOVAS: list[tuple] = [
    ("CRU5280", "VOLKSWAGEN", "31-310", "entre eixos 6X4", 2007, None,
     "APLICACAO (digitada desde a v8): 'VW 31-310 (2007>) entre eixos 6X4.' (o modelo como nas outras linhas "
     "VOLKSWAGEN 31-310 da VEICULOS)", "P6"),
    ("CRU512022", "VOLVO", "FM10", None, 1999, None,
     "APLICACAO (digitada desde a v8): 'Volvo FM12/ NH12/ FM10/ FM12/, MBenz 2418 6x4 1999' (o ano solto é o início, "
     "como no FM12 desde a v20)", "P5"),
    ("CRU512022", "MERCEDES-BENZ", "2418", "6x4", 1999, None,
     "APLICACAO (digitada desde a v8): 'Volvo FM12/ NH12/ FM10/ FM12/, MBenz 2418 6x4 1999' (o ano solto é o início, "
     "como no FM12 desde a v20; o modelo como nas outras linhas MERCEDES-BENZ 2418 da VEICULOS)", "P5"),
    ("ROL15106/15250", "CHEVROLET", "A-40", None, 1978, 2012,
     F_ROL + "; APLICACAO: 'GM - D40, A40, C40' (o modelo como nas outras linhas CHEVROLET A-40 da VEICULOS)", "P4"),
    ("ROL15106/15250", "CHEVROLET", "C40", None, 1978, 2012,
     F_ROL + "; APLICACAO: 'GM - D40, A40, C40' (como o D40; nenhuma linha C40 na VEICULOS)", "P4"),
    ("SFR30034", "KIA", "Bongo", "K-2700", 1997, None,
     "APLICACAO (digitada desde a v8): 'Bongo K-2700 1997>' (só o nome e o ano: a cilindrada fica vazia)", "P10"),
]

# (código, o que, por que fica, o que falta)
SEM_FONTE = [
    ("INT16529", "VEICULOS 36679 FORD Ranger 2019–2016 (SITUACAO da revisão da P12, fora do site) e o texto "
                 "'Ranger (2019–2016)' da APLICACAO",
     "a fonte da APLICACAO (aba INTEGRADOS_V6: catálogo de interruptores, aplicação 3-RHO 2026) e a página da 3-RHO "
     "do 411 (www.3rho.com.br/pt-br/produtos-detalhes/interruptor-de-luz-de-freio-120/411, lida em 27/11/2026) "
     "escrevem 'Ranger (2019 - 2016)'; a tabela de veículos da 3-RHO não traz a Ranger",
     "um catálogo com a Ranger do MARELLI ILF411, MARFLEX 7022 ou INTERMEC 2411 (ponto P7)"),
    ("FCB6266", "APLICACAO 'Sprinter Van 310 D … 1997>' (o site mostra 1997+) e 'Silverado Conquest … 1997>'",
     "da v8 à v19 o texto era '1997 até', sem o ano final (catálogo de filtros, FILTROS_TABELA_APLICACAO_2026.pdf, "
     "p. 63); a v21 leu o 'até' sem ano como 'em diante' (1997>). Nenhuma base antiga, referência ou linha da Fraga "
     "traz o fim da Van 310 D",
     "a página 63 do catálogo de filtros ou um catálogo das referências (ponto P8)"),
    ("INT16639", "Gurgel BR800, Karmann Ghia, Puma, SP2 e TC: estão na APLICACAO e não têm linha na VEICULOS",
     "nenhuma base antiga nem a pesquisa da T-0040 traz o ano deles; pela regra 1b da v30, o veículo do texto sem ano "
     "não aparece na tabela do site", "os anos (ponto P9)"),
    ("INT16652", "Puma, SP2 e TC (sem linha na VEICULOS) e VOLKSWAGEN TL (linha 37538, sem ano)",
     "nenhuma base antiga traz o ano; a pesquisa da T-0040 deixou o TL como nao_resolvido (id_linha 37537)",
     "os anos (ponto P9)"),
    ("SFR30034", "Bongo K-2700: a cilindrada e o ano final",
     "o texto só diz 'Bongo K-2700 1997>'; a linha 20980 da Fraga (KIA Bongo '2.7 D 2.7 L', 1997–2004) tem o 2.7, que "
     "continua na base, mas não diz K-2700",
     "um catálogo da SYL 204603 ou das outras referências com o K-2700 (ponto P10)"),
    ("SFR30034", "KIA Besta, linha 20974: 1992–1999 na VEICULOS; o texto diz 'Besta Est/Furgão/Std … 1993–1998'. "
                 "Qual faixa vale?",
     "as duas faixas têm fonte: 1993–1998 é a do texto (digitado desde a v8); 1992–1999 é a junção dele com a Fraga do "
     "mesmo motor, feita na v29 pela regra aprovada (R-20261127-132222-alexandre; LOG FAIXA_JUNTADA), e contém a do "
     "texto. Não há uma terceira fonte para escolher uma das duas; trocar desfaria a regra aprovada sem fonte nova",
     "um catálogo da SYL 204603 (ou das outras referências) com a Besta, para a nova pesquisa"),
    ("VEL7574", "JEEP Grand Cherokee 4.7 1998–2004 (linha 35639 da Fraga e o trecho da APLICACAO que veio dela)",
     "só a Fraga traz a Grand Cherokee para esta vela, com 1998–2004; nenhuma base antiga, linha da VEICULOS deste "
     "código ou referência cruzada (NGK BKR7EIX e as outras) dá o 4.7 de 2005 em diante. As linhas Grand Cherokee 4.7 "
     "de outros códigos (CL21 1998–2006, JUH70209 2001–2017) são de outras peças e não valem para a vela",
     "um catálogo da NGK BKR7EIX (ou das outras referências) com a Grand Cherokee 4.7 (pedido do designer-ux, T-0043)"),
    ("VEL7503", "DAIHATSU Terios 1.3 16V 1998–2002 (linha 34784 da Fraga e o trecho da APLICACAO que veio dela)",
     "só a Fraga traz o Terios para esta vela, com 1998–2002; nenhuma outra linha da VEICULOS tem o Terios",
     "um catálogo da NGK BKR6E (ou das outras referências) com o Terios (pedido do designer-ux, T-0043)"),
]

# (código, o que se perde ou sai errado na tela, onde está a causa no site)
DO_SITE = [
    ("POL1712", "'Volare A6 4.07TCA' aparece como Versão 'A6 7TCA Mwm Sprint', sem a cilindrada: o '4.07TCA' é o nome "
                "do motor MWM Sprint (2.8 L, linha 33834 da Fraga)",
     "app.js, limparVersao/RX_CIL: o '4.0' do começo de '4.07TCA' é lido como cilindrada e sai da Versão"),
    ("ROL15106/15250", "a linha Agrale 6000 mostra a cilindrada 2.8 (é a do 'Iveco 2.8 Turbo Diesel'); os motores "
                       "'Mwm D229-4, Cummins 4BT' e o 'Cubo de Roda Diant. (Externo/Interno) / Diferencial' só saem "
                       "na impressão ('Aplicação completa')",
     "app.js, juntarNaTabela: o trecho sem modelo depois do 'AGRALE - 6000 (1978–2012)' vira detalhe da Agrale; a "
     "tabela não tem lugar para o motor nem para a posição do texto (a CILINDRADA da VEICULOS não vai para o JSON)"),
    ("CRU512022", "sem a linha nova (P5): o 'FM10' vira Versão do NH12 e o 'MBenz 2418 6x4' some",
     "app.js, juntarNaTabela: o FM10 não é modelo do catálogo (vira detalhe do NH12) e o 'MBenz' não é lido como "
     "Mercedes-Benz (marcaDe; o MONTADORAS do gerar_site também não tem 'MBENZ')"),
    ("CRU5280", "sem a linha nova (P6): 'VW 31-310 (2007>) entre eixos 6X4' não vira linha (só sai na impressão)",
     "app.js, juntarNaTabela: o trecho do texto não vira linha da tabela"),
    ("SFR30034", "o 'K-2400' do Bongo não aparece: a linha 'Kia Bongo 2.4 1993–1997' fica com a Versão '—', mesmo "
                 "com a Versão 'K-2400' na VEICULOS (P10, a v31 simulada já põe); a linha K-2700 da P10 aparece com "
                 "a cilindrada '2.7', que vem do site e não da base (a cilindrada dela fica vazia); o 'T' do fim de 'Besta Est 2.7 1993–1998 T' vai para a Versão ('Est T', 'Furgão T', "
                 "'Std T'); a linha Besta da VEICULOS (cilindrada '2.2 / 2.7') aparece só com 2.7",
     "app.js, junção do texto com a tabela: versaoTela/versaoLivre tira o 'K-2400' [SUPOSIÇÃO: lido como número de "
     "outro modelo]; juntarNaTabela/poeLinha põe uma cilindrada do texto na linha K-2700 e troca a cilindrada da linha "
     "que recebe a do texto; limparVersao deixa o 'T'"),
    ("VEL7520", "as linhas que vêm do texto mostram 2004–2020 no lugar do ano do texto (Lifan 320 1.3 16V, texto "
                "2010–2015; Bravo, Doblo, Idea, Linea, Captur enquanto as linhas deles estiverem fora do site)",
     "app.js, arrumar: o 'an' do produto (DADOS_ADICIONAIS: 2004–2020) vale primeiro para toda linha sem ano da "
     "VEICULOS"),
    ("INT16639 / INT16652", "Gurgel BR800, Karmann Ghia, Puma, SP2, TC (e o TL do INT16652) não aparecem",
     "app.js, tabelaDe: a linha do texto sem ano não aparece (regra 1b da v30, R-20261127-150417); a base não tem o ano "
     "(SEM_FONTE)"),
]

# (ponto, código, pergunta, a, b)
PONTOS = [
    ("P1", "LAM2004", "O 'Polo' da lâmpada é o polo elétrico. A linha VOLKSWAGEN Polo da VEICULOS (40101) faz o site "
                      "mostrar 'Aplicação em revisão; consulte o vendedor.' no lugar do texto.",
     "a) tirar a linha VW Polo: o site volta a mostrar o texto da lâmpada", "b) manter a linha como está"),
    ("P2", "POL1712", "A linha AUDI A6 1998–2001 (33828) veio do 'Volare A6' do texto: não há Audi na aplicação. O "
                      "Volare A6 1998–2001 continua (linha 33834 e texto).",
     "a) tirar a linha AUDI A6", "b) manter a linha como está"),
    ("P3", "VEL7520", "Palio Fire 2005 não acha a vela: as linhas Uno, Palio, Siena, Strada, Punto e Vectra têm os "
                      "anos da soma da Fraga (ex.: Palio 1999–2019), o Astra não tem ano, e as 15 linhas do texto estão "
                      "fora do site pela revisão da P12 (por causa da LIFAN e da VOLVO sem modelo). O texto da v8 e o "
                      "cadastro master dão 2004–2020 para o produto inteiro (Fire Flex, T-Jet, Flexpower).",
     "a) TROCA os anos da soma da Fraga, aprovados na v29 (R-20261127-132222-alexandre), pela faixa do produto no "
     "cadastro: Uno, Palio, Siena e Strada 'Fire Flex', Punto 'Motores Fire Flex e T-Jet 1.4 Turbo', Astra, sem "
     "Versão, e Vectra '2.0 Flexpower / GNV', todos 2004–2020 e de volta ao site (as linhas próprias da Fraga ficam); "
     "e as 8 linhas com o ano igual ao texto (Gol, Fox, Bravo, Doblo, Grand Siena, Idea, Linea, Captur) de volta ao "
     "site (o Gol, linha 35048, volta sem ano: o ANO_DUVIDA 'herdado' dele fica)",
     "b) só o Palio 'Fire Flex' 2004–2020 de volta ao site; o resto fica como está"),
    ("P4", "ROL15106/15250", "F-4000, F-350, D40 e Daily estão sem ano (ficam ocultos; o site mostra 1978–2012 pelo "
                             "cadastro); o A40 e o C40 do texto e do cadastro não têm linha (o site mostra o A-40 pelo "
                             "texto e perde o C40).",
     "a) os 4 recebem 1978–2012 do cadastro master (o Daily com a Versão '35.10, 49.12' do texto) e entram as linhas "
     "CHEVROLET A-40 e C40 1978–2012",
     "b) não mudar"),
    ("P5", "CRU512022", "O FM10 e o 'MBenz 2418 6x4' do texto não têm linha: no site o FM10 vira Versão do NH12 e o "
                        "2418 some.",
     "a) entram VOLVO FM10 e MERCEDES-BENZ 2418 '6x4', 1999 em diante (o ano solto do texto, como o FM12)",
     "b) não mudar (ficam só no texto)"),
    ("P6", "CRU5280", "O 'VW 31-310 (2007>) entre eixos 6X4' do texto não tem linha e não aparece no site.",
     "a) entra VOLKSWAGEN 31-310 'entre eixos 6X4', 2007 em diante", "b) não mudar (fica só no texto)"),
    ("P7", "INT16529", "Ranger 2019–2016: a própria 3-RHO escreve assim; nenhuma fonte diz qual é a faixa certa. A "
                       "linha está fora do site; o texto mostra '(2019–2016)'.",
     "a) manter e levar para a nova pesquisa",
     "b) ler como inversão: Ranger 2016–2019 na VEICULOS e no texto, sem fonte que confirme"),
    ("P8", "FCB6266", "Sprinter Van 310 D sai 1997+: o catálogo de filtros dizia '1997 até', sem o fim, e a v21 leu "
                      "como 'em diante'. Chassi e Furgão 310 D são 1997–2000 no mesmo texto.",
     "a) manter 1997+ e levar para a nova pesquisa", "b) mandar a página 63 do catálogo de filtros para conferir"),
    ("P9", "INT16639 / INT16652", "Gurgel BR800, Karmann Ghia, Puma, SP2, TC e TL estão no texto, sem ano: pela regra "
                                  "1b não aparecem na tabela do site.",
     "a) levar os anos para a nova pesquisa (a base não muda agora)",
     "b) o site mostra o veículo do texto sem ano nesses casos (é do web-site: muda a regra 1b)"),
    ("P10", "SFR30034", "A linha KIA Bongo 20976 (1993–1997) junta o K-2400 e o K-2700 (sem Versão, cilindrada "
                        "'2.4 / 2.7'); o ano 1993–1997 é o do K-2400 (texto e pesquisa da T-0040). O 'Bongo K-2700 "
                        "1997>' do texto não tem linha própria; o 2.7 continua na linha 20980 da Fraga (Bongo 2.7 D, "
                        "1997–2004). Na tela, até o web-site corrigir a junção do texto com a tabela (DO_SITE), o "
                        "print do 'depois' NÃO mostra o K-2400: a linha 'Kia Bongo 2.4 1993–1997' continua com a "
                        "Versão '—', e a linha K-2700 aparece com a cilindrada '2.7', que é o site que põe (a base "
                        "deixa a cilindrada dela vazia).",
     "a) a linha 20976 vira K-2400, cilindrada 2.4, e entra a linha KIA Bongo 'K-2700' 1997 em diante (sem "
     "cilindrada: o texto não dá)",
     "b) não mudar"),
]


def fmt(v) -> str:
    """O valor como a planilha mostra: "(vazio)" e, no lugar da marca da revisão da P12, o antes_log (R-20261120-213300)."""
    return "(vazio)" if v in (None, "") else antes_log(v) if limpo(v).lower() == "duvidoso" else str(v)


def veiculo(r) -> str:
    """FABRICANTE MODELO [VERSAO] ini–fim de uma linha da VEICULOS (tupla com as 11 colunas)."""
    ini, fim = r[COL["ANO_INICIO"] - 1], r[COL["ANO_FIM"] - 1]
    ano = f"{ini or '?'}–{fim or '?'}" if ini or fim else "sem ano"
    return " ".join(limpo(x) for x in (r[1], r[2], r[3]) if limpo(x)) + f" {ano}"


# ---------------------------------------------------------------- montagem
def montar(wb, autorizacao: str) -> dict:
    """Etapa 1 no wb (a v30 carregada): CELULAS, LOG, LEIA-ME e REMOVIDAS. Devolve o que a conferência e a planilha
    usam; as NOVAS entram depois (novas())."""
    ws = wb["VEICULOS"]
    conferir_cabecalho(ws, CAB_VEICULOS)
    erros, mud, celulas = [], [], set()
    fim = f"Autorização: {autorizacao}. {TAREFA} (v31), {DATA}"
    log = []
    for cod, n, col, antes, depois, fonte, ponto in CELULAS:
        c = COL[col]
        hoje = ws.cell(n, c).value
        if limpo(ws.cell(n, 1).value).upper() != cod or (antes != "*" and hoje != antes) or (antes == "*" and not hoje):
            erros.append(f"{cod} VEICULOS {n} {col}: hoje {hoje!r}, a simulação espera {antes!r}")
            continue
        mud.append((cod, "VEICULOS", n, col, hoje, depois, fonte, ponto, veiculo([x.value for x in ws[n]])))
        celulas.add((n, c))
    for cod, n, esperado, fonte, ponto in REMOVIDAS:
        r = [x.value for x in ws[n]]
        hoje = tuple(r[COL[k] - 1] for k in ("FABRICANTE", "MODELO", "VERSAO", "ANO_INICIO", "ANO_FIM", "SITUACAO"))
        if limpo(r[0]).upper() != cod or hoje != esperado:
            erros.append(f"{cod} VEICULOS {n}: a linha de hoje {hoje} não é a da simulação {esperado}")
            continue
        inteira = " | ".join(f"{k}={fmt(v)}" for k, v in zip(CAB_VEICULOS, r))
        mud.append((cod, "VEICULOS", n, "(linha inteira)", inteira, "(a linha sai)", fonte, ponto, veiculo(r)))
    parar(erros)
    for cod, n, col, antes, depois, *_ in CELULAS:
        ws.cell(n, COL[col]).value = depois
    # LOG: uma linha por código e tipo; dentro dela, uma parte por linha da VEICULOS
    por_tipo: dict[tuple, dict] = {}
    for cod, _, n, col, antes, depois, fonte, ponto, vei in mud:
        tipo = "LINHA_REMOVIDA" if col == "(linha inteira)" else \
            "ANO_COMPLETADO" if col.startswith("ANO_") and antes is None else "CORRECAO_VEICULO"
        txt = f"sai (conteúdo inteiro: {antes})" if tipo == "LINHA_REMOVIDA" else \
            f"{col} {antes_log(antes)} -> {antes_log(depois)}"
        linha = por_tipo.setdefault((cod, tipo), {}).setdefault((n, vei), {"txt": [], "fonte": []})
        linha["txt"].append(txt)
        linha["fonte"].append(fonte)
    for (cod, tipo), linhas in sorted(por_tipo.items()):
        partes = [f"linha {n} ({vei}): {', '.join(x['txt'])}" for (n, vei), x in linhas.items()]
        fontes = dict.fromkeys(f for x in linhas.values() for f in x["fonte"])
        log.append([tipo, "VEICULOS", cod, None, f"VEICULOS: {'; '.join(partes)}. Fonte: {' | '.join(fontes)}. {fim}"])
    for cod, fab, mod, ver, ini, fim_ano, fonte, ponto in NOVAS:
        anos = f"{ini}–{fim_ano}" if fim_ano else f"{ini} em diante"
        log.append(["VEICULO_NOVO", "VEICULOS", cod, None,
                    f"VEICULOS: linha nova no fim da aba, {fab} {mod}{' ' + ver if ver else ''} {anos}, ORIGEM "
                    f"'{ORIGEM_TEXTO}', separado, sem MOTIVO e sem ANO_DUVIDA. Fonte: {fonte}. {fim}"])
    ult = acrescentar_log(wb, log)
    leia_n = acrescentar_leia_me(wb, leia_me(autorizacao))
    removidas = sorted(n for _, n, *_ in REMOVIDAS)
    for n in reversed(removidas):
        ws.delete_rows(n)
    if ws.auto_filter.ref:
        ws.auto_filter.ref = re.sub(r"\d+$", str(ws.max_row), ws.auto_filter.ref)
    return {"mud": mud, "celulas": celulas, "ult": ult, "leia_n": leia_n, "log": log, "removidas": set(removidas)}


def novas(wb) -> tuple[list[list], dict]:
    """Etapa 2: as NOVAS no fim da VEICULOS. Devolve as linhas e {(linha, coluna): valor}."""
    linhas = [[cod, fab, mod, ver, ini, fim, ORIGEM_TEXTO, SEPARADO, None, None, None]
              for cod, fab, mod, ver, ini, fim, *_ in NOVAS]
    return linhas, acrescentar_linhas(wb["VEICULOS"], linhas)


def leia_me(autorizacao: str) -> list[tuple]:
    n_cel = len({(c, n) for c, n, *_ in CELULAS})
    return [
        ("BASE BAP UNIFICADA v31 (27/11/2026)", None),
        ("VEICULOS (correções pontuais)", f"Correções pontuais com fonte (T-0042, R-20261127-161035-alexandre): "
                                          f"{len(CELULAS)} células em {n_cel} linhas (SFR30034, ROL15106/15250, "
                                          f"VEL7520), {len(REMOVIDAS)} linhas que saem (POL1712 AUDI A6, LAM2004 "
                                          f"VOLKSWAGEN Polo) e {len(NOVAS)} linhas novas no fim da aba (CRU5280, "
                                          f"CRU512022, ROL15106/15250, SFR30034). A fonte de cada uma está no LOG_CORRECOES."),
        ("Marca da P12", "Nas linhas do VEL7520 que voltam ao site, a marca da revisão da P12 sai com o MOTIVO (o texto "
                         "de antes fica no LOG); nenhuma marca entra (R-20261120-213300)."),
        ("APLICACAO", "O texto da APLICACAO na PRODUTOS não muda (campo digitado)."),
        ("Formato", f"Mesmas abas e colunas da v30 (VEICULOS com 11 colunas). Antes e depois: "
                    f"dados/T-0042/v31/antes_depois_v31.xlsx. Autorização: {autorizacao}."),
        (None, None),
    ]


def conferir(p1: Path, p2: Path, wb, r: dict, feitas: dict) -> list[str]:
    """Etapa 1 (p1) contra a v30 e etapa 2 (p2) contra a p1; o valor das linhas novas; o 'duvidoso' não sobe."""
    dif = comparar(p1, versao(30), {"VEICULOS": r["celulas"]}, r["ult"], "v30", leia_n=r["leia_n"],
                   removidas={"VEICULOS": r["removidas"]})
    dif += texto_novo_difere(p1, wb, r["ult"], r["leia_n"])
    ult2 = openpyxl.load_workbook(p1, read_only=True)["LOG_CORRECOES"].max_row
    dif += comparar(p2, p1, {"VEICULOS": set()}, ult2, "etapa 1", novas_no_fim={"VEICULOS": len(NOVAS)})
    salva = openpyxl.load_workbook(p2)
    dif += [f"VEICULOS {salva['VEICULOS'].cell(n, c).coordinate}: valor da linha nova diferente"
            for (n, c), v in feitas.items() if salva["VEICULOS"].cell(n, c).value != v]
    d0, d1 = contar_duvidoso(openpyxl.load_workbook(versao(30), read_only=True)), contar_duvidoso(salva)
    dif += [f"{a}: 'duvidoso' subiu ({d0[a]} -> {d1[a]})" for a in d0 if d1[a] > d0[a]]
    return dif


# ---------------------------------------------------------------- efeito no site
def efeito_site(antes: dict, depois: dict) -> list[list]:
    """Por código: os campos do JSON que mudam (ve, vo, an; o 'a' não muda)."""
    saida = []
    for c in CODIGOS:
        a, d = antes["produtos"].get(c, {}), depois["produtos"].get(c, {})
        for k in ("ve", "vo", "an", "a"):
            if a.get(k) != d.get(k):
                saida.append([c, k] + [json.dumps(x[k], ensure_ascii=False) if x.get(k) else "(não tem)" for x in (a, d)])
        if not any(x[0] == c for x in saida):
            saida.append([c, "(nada muda no JSON)", "", ""])
    return saida


def gravar_ad(r: dict, site: list[list], autorizacao: str, d0: dict, d1: dict, total: tuple) -> None:
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    n_tipo = {}
    for x in r["log"]:
        n_tipo[x[0]] = n_tipo.get(x[0], 0) + 1
    resumo = [("Tarefa", TAREFA, ""), ("Pedido", "R-20261127-161035-alexandre (25 b: correções pontuais da base)", ""),
              ("Autorização", autorizacao, ""), ("Base de partida", f"v30 (sha256 {sha(versao(30))})", ""),
              ("Códigos olhados", len(CODIGOS), ", ".join(CODIGOS)),
              ("Células trocadas (VEICULOS)", len(CELULAS), ""), ("Linhas que saem (VEICULOS)", len(REMOVIDAS), ""),
              ("Linhas novas no fim (VEICULOS)", len(NOVAS), ""),
              ("Linhas no LOG_CORRECOES", len(r["log"]), "; ".join(f"{k} {v}" for k, v in sorted(n_tipo.items()))),
              ("Linhas no LEIA-ME", r["leia_n"], ""), ("APLICACAO e outros campos digitados", "não mudam", ""),
              ("Sem fonte (não mudam)", len(SEM_FONTE), ", ".join(x[0] for x in SEM_FONTE)),
              ("É do site (web-site; a base não muda)", len(DO_SITE), ", ".join(x[0] for x in DO_SITE)),
              ("Pontos para o Alexandre", len(PONTOS), "a simulação mostra a opção a) de todos"),
              ("Células com a marca da revisão da P12, PRODUTOS (v30 -> v31)", d0["PRODUTOS"], d1["PRODUTOS"]),
              ("Células com a marca da revisão da P12, VEICULOS (v30 -> v31)", d0["VEICULOS"], d1["VEICULOS"]),
              ("Produtos no site (gerar_site do main, v30 -> v31)", total[0], total[1])]
    aba(wb, "RESUMO", ["ITEM", "VALOR / ANTES", "DEPOIS / OBS"], resumo)
    aba(wb, "MUDANCAS", ["CODIGO_BAP", "ABA", "LINHA (v30)", "COLUNA", "ANTES", "DEPOIS", "FONTE", "PONTO",
                         "VEICULO (v30)"],
        [[cod, a, n, col, fmt(antes), fmt(depois), fonte, ponto, vei]
         for cod, a, n, col, antes, depois, fonte, ponto, vei in r["mud"]]
        + [[cod, "VEICULOS", "nova (fim da aba)", "(linha nova)", "(não existe)",
            f"{fab} | {mod} | {fmt(ver)} | {ini}–{fmt(fim)} | {ORIGEM_TEXTO} | {SEPARADO}", fonte, ponto, ""]
           for cod, fab, mod, ver, ini, fim, fonte, ponto in NOVAS])
    aba(wb, "SEM_FONTE", ["CODIGO_BAP", "O QUE", "POR QUE NÃO MUDA", "O QUE FALTA"], SEM_FONTE)
    aba(wb, "DO_SITE", ["CODIGO_BAP", "O QUE SE PERDE NA TELA", "CAUSA NO SITE (web-site)"], DO_SITE)
    aba(wb, "PONTOS_ALEXANDRE", ["PONTO", "CODIGO_BAP", "PERGUNTA", "OPÇÃO a", "OPÇÃO b"], PONTOS)
    aba(wb, "EFEITO_SITE", ["CODIGO_BAP", "CAMPO DO JSON", "ANTES (v30)", "DEPOIS (v31 simulada)"], site)
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and INTERNO.search(c.value):
                    raise SystemExit(f"[PARADO] palavra interna na {ws.title} {c.coordinate}")
    SAIDA.mkdir(parents=True, exist_ok=True)
    wb.save(AD)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--autorizacao", default=AUTORIZACAO, help="o recado do aprovado (padrão: pendente)")
    ap.add_argument("--refazer", action="store_true", help="depois do aprovado: grava a base e a v31")
    arg = ap.parse_args()
    aprovado = arg.autorizacao != AUTORIZACAO
    if aprovado != arg.refazer:
        raise SystemExit("[PARADO] --refazer e --autorizacao 'R-…' vão juntos (sem os dois: simulação)")
    if aprovado and not re.fullmatch(r"R-\d{8}-\d{6}-[a-z-]+", limpo(arg.autorizacao)):
        raise SystemExit(f"[PARADO] recado fora do padrão: {arg.autorizacao}")
    autorizacao = f"aprovado em {limpo(arg.autorizacao)}" if aprovado else AUTORIZACAO
    if arg.refazer:
        refazer(30, 31)
    if versao(31).exists():
        raise SystemExit("[PARADO] a v31 já existe em dados/versoes")
    sha_antes = sha(BASE)
    if sha_antes != sha(versao(30)):
        raise SystemExit("[PARADO] a base de hoje não é a v30")

    wb = openpyxl.load_workbook(BASE)
    r = montar(wb, autorizacao)
    with tempfile.TemporaryDirectory() as tmp:
        p1, p2 = Path(tmp) / "etapa1.xlsx", Path(tmp) / BASE.name
        wb.save(p1)
        _, feitas = novas(wb)
        wb.save(p2)
        parar(conferir(p1, p2, wb, r, feitas))
        if sha(BASE) != sha_antes:
            parar(["a base mudou durante a montagem"])
        g0 = gerar_site_copia(versao(30), Path(tmp) / "gs30")
        g1 = gerar_site_copia(p2, Path(tmp) / "gs31")
        d0 = contar_duvidoso(openpyxl.load_workbook(versao(30), read_only=True))
        d1 = contar_duvidoso(openpyxl.load_workbook(p2, read_only=True))
        gravar_ad(r, efeito_site(g0, g1), autorizacao, d0, d1, (g0["total"], g1["total"]))
        if aprovado:
            gravar(p2, versao(31))
        else:
            SIM.write_bytes(p2.read_bytes())
            print(f"  {SIM.relative_to(RAIZ)}: sha256 {sha(SIM)}")
    print(f"  {AD.relative_to(RAIZ)}")
    print(f"  VEICULOS: {len(CELULAS)} células, -{len(REMOVIDAS)} linhas, +{len(NOVAS)} linhas; LOG_CORRECOES "
          f"+{len(r['log'])}; LEIA-ME +{r['leia_n']}; duvidoso {d0} -> {d1}; site {g0['total']} -> {g1['total']}")
    print(f"  autorização: {autorizacao}; sha256 da base (v30) antes: {sha_antes}; agora: {sha(BASE)}")


if __name__ == "__main__":
    main()
