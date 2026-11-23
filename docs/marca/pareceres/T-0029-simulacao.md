# T-0029 · Parecer de marca da simulação (Portfólio 2027 e siglas de montadora)

| Campo | Valor |
|---|---|
| Tarefa | T-0029, passo 1: simulação. Itens 1 a (datas do Portfólio para 2027) e 3 a ("VW", "GM" e "Effitech", MC-0017) do R-20261123-135656-po |
| Revisor | design-de-marca |
| Data | 23/11/2026 10:08 (Manaus) |
| O que foi visto | O branch `catalogo-grafico/T-0029-portfolio-2027`, head `61ac7ed2b769ab4230a10e81ca21080d6a3a4bb4` (diff de `portfolio.py` e `LEIA_GERADOR.md`); o `LEIA-ME.md` e os PNGs antes e depois das 26 páginas que mudam, em especial p01, p03, p08, p42 e p81 |
| Base de comparação | `docs/marca/manual.md` ("Nome da marca", decisão 10 a); o resto ainda "a aprovar". O MC-0017 e a pergunta 2 de `docs/marca/pareceres/T-0028-simulacao.md` |
| Parecer | Simulação: **LIBERADO** para o PO levar ao Alexandre, com 2 perguntas (selo e ProActive/Shiftease). Nenhum ajuste obrigatório |

Layout e comparação página a página: ver o parecer de UX (`docs/ux/pareceres/T-0029-simulacao.md`). Aqui ficam a voz,
a grafia, a marca e as regras do repositório.

## 1. Datas (1 a)

- **Capa e contracapa:** "PORTFÓLIO DE PRODUTOS 2027", na mesma fonte, cor e lugar. O ano vem do `digital2.ANO`, o mesmo
  dos PDFs "Catálogo BAP 2027": os materiais passam a ter o mesmo ano por construção.
- **Mês da capa, "Novembro de 2026":** recomendo **manter assim**. É a data real da edição, e o ano no nome é o ano do
  material (como o Catálogo BAP 2027, que também sai em 2026). É o que eu tinha recomendado na T-0028 (a data da edição
  acompanha a data em que o PDF é gerado). Cuidado para o dono: se a entrega final sair em dezembro, a capa diz
  "Dezembro de 2026", e isso é o esperado.
- **Pág. 3:** "conforme o Catálogo BAP 2027" cita o catálogo pelo nome certo. A frase "sistema do veículo, família e
  produto" é a que a marca recomendou na T-0028: não depende de caractere especial da Poppins. Fecha a observação da seta.

## 2. Selo "NOVIDADE 2027" (pergunta 1)

O texto e o estilo do chip não mudam, só o ano. Mas o ano do selo tem outro sentido nos outros materiais:

- o A4 explica o selo na página "Fique atento às tags": "LANÇAMENTO 2026: linha lançada em 2026"
  (`print_cat.py:510`). Ali o ano é o **ano do lançamento**, e não o da edição;
- com a simulação, o mesmo produto sai como "NOVIDADE 2027" no Portfólio e "LANÇAMENTO 2026" no Catálogo BAP 2027, que o
  mesmo cliente recebe. Antes, os dois diziam 2026.

Recomendo **b) o selo do Portfólio fica "NOVIDADE 2026"** (o ano do lançamento, como no catálogo), e só as datas da
edição passam a 2027. É uma linha (`portfolio.py:214`, `f'NOVIDADE {ANO}'` → `'NOVIDADE 2026'`, ou um `ANO_LANC`
comum aos 3 geradores). Corrige o que eu disse na T-0028 ("o chip segue o mesmo ano"): relendo a legenda do A4, o ano
do selo é fato do produto, e não data do material.

A outra saída, **c) todos os materiais com 2027**, só vale se esses produtos forem de fato lançamento de 2027; aí o A4
e o Digital mudam junto (o selo e a legenda), com simulação própria. A diferença de palavra ("NOVIDADE" no Portfólio,
"LANÇAMENTO" no catálogo) já existia e fica para a fila; não segura.

Não seguro a simulação: a decisão 1 a é do Alexandre, e a escolha vai a ele com esta pergunta.

## 3. Siglas de montadora e Effitech (3 a, MC-0017)

- **"VW" e "GM":** p21, p34, p42 e p67 saem com as siglas em maiúsculas e os outros nomes com a inicial maiúscula
  ("Ford/GM/Dodge/Troller", "VW/Ford", "Fiat/GM/VW/Toyota"). Em texto, na fonte e na cor do catálogo, sem logo nem cor de
  terceiros: certo pela regra de marca de terceiros. A função `montadora()` usa o `montar.KEEPU`, a mesma lista do
  catálogo, e a grafia fica igual entre o Portfólio e os PDFs.
- **"Mb":** o `LEIA-ME.md` não conta nenhum no texto de hoje. O `KEEPU` tem "MB", e ele sai em maiúsculas se aparecer
  (conferir no reteste).
- **"Effitech" (p81):** "Balde óleo Effitech 100 68 hidráulico HL mineral 20L", como na apresentação de Lubrificantes.
- **p42, "GM/GM Corsa" e "VW Fus":** já eram assim antes (repetição e corte do dado). Não é grafia de marca: fica com o
  `corretor-redundancias` e o `catalogo-dados`, pelo `gerente-projetos`. Não catalogo.

## 4. ProActive e Shiftease (pergunta 2)

O manual ainda não tem a grafia das linhas da BAP. As fontes que a marca já usa escrevem **"ProActive"** (o rótulo do
frasco, na foto da própria p81: "ProActive 300", "ProActive 100", "ProActive 110") e **"Shiftease"** (a apresentação de
Lubrificantes, `apres_conteudo.json`: "Shiftease 100 80W", "Shiftease, ATF e Effitech").

Recomendo **corrigir nesta mesma tarefa**: "proactive" → "ProActive" e "shiftease" → "Shiftease", as 7 vezes de cada,
pelo mesmo mapa `LINHA_BAP` (`{'effitech': 'Effitech', 'proactive': 'ProActive', 'shiftease': 'Shiftease'}`), com os
PNGs dessas páginas na mesma ida ao Alexandre. É o mesmo defeito do "effitech" (MC-0017 b): nome de linha da BAP
escrito como palavra comum, ao lado do frasco que mostra o nome certo.

Para a fila (fora desta tarefa): o A4 e o Digital também têm "shiftease" em minúsculas (`digital_data.json`), que vem
da DESCRICAO da base. Depois do "aprovado", proponho entrar no manual um glossário de nomes de linha da BAP: ProActive,
Shiftease, Effitech.

## 5. Regras do repositório

- Nenhum texto institucional muda além das datas. "BAP AUTOPARTS" certo em tudo (decisão 10 a).
- Nenhuma cor, fonte, logo ou chip novo no diff.
- Sem preço e sem estoque: o `LEIA-ME.md` confere o texto do PDF, e o diff não mexe em nada que leia preço ou estoque.

## Achados

| ID | Situação |
|---|---|
| MC-0017 | a) e b) corrigidos nesta simulação ("VW" 3 vezes, "GM" 5, "Effitech" 1). Fecha na entrega final igual a ela. Se o Alexandre aprovar a pergunta 2, "ProActive" e "Shiftease" entram no fechamento |
| MC-0016 | Ver `docs/marca/pareceres/T-0030-simulacao.md` |

Nenhum achado novo.

## Reteste

Depois do "aprovado": no PR, conferir a capa (ano e mês), a p03, a contracapa, o selo na opção escolhida, as siglas nas
p21, p34, p42 e p67, "Effitech" na p81 e, se aprovado, "ProActive" e "Shiftease" nas 14 ocorrências; o `pdftotext`
sem "Vw", "Gm", "Mb", "effitech" (e "proactive" e "shiftease", se aprovado), sem "2026" fora do mês da capa (e do selo,
se for a b), e sem preço e estoque. Fechar o MC-0017.
