# T-0027 · Parecer de marca da simulação ("1 item", RD-0510)

| Campo | Valor |
|---|---|
| Tarefa | T-0027 (RD-0510), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 07:19 (Manaus) |
| O que foi visto | Simulação do `catalogo-grafico` em `recados/anexos/T-0027/sim/` do aloirr/bapajudacatalogo-recados (commit `bc5058f`): o `LEIA.md` (tabela das 7 páginas, prova pixel a pixel e 2 perguntas), o `diff-gerador.patch` e os PNGs antes e depois (página inteira e recorte), em especial `a4-p50-zoom-depois.png`, `moto-p02-zoom-depois.png` e `moto-p03-zoom-depois.png`. Conferi o diff no commit `2164a2d` (branch local `catalogo-grafico/T-0027-entregas`, sobre o main `ab9b8f0`) e, no mesmo commit, os "N itens" que ficam no `portfolio.py` |
| Base de comparação | `docs/marca/manual.md`, "Nome da marca" (decisão 10 a, R-20261122-032433-alexandre); o resto do manual ainda está "a aprovar". Meu parecer da T-0026 (`docs/marca/pareceres/T-0026-simulacao.md`), pergunta 6 |
| Regra da rodada | R-20261122-110411-po, pela delegação R-20261122-090651-alexandre: correção de erro, no critério conservador, sem mudar a marca nem o texto institucional |
| Parecer | Simulação: **LIBERADO** para o PO decidir. Concordo com as recomendações do `catalogo-grafico` nas perguntas 1 (a) e 2 (a). Nenhum achado novo |

Leitura, layout e a comparação página a página das 7 páginas: ver o parecer de UX
(`docs/ux/pareceres/T-0027-simulacao.md`). Aqui fica só a voz, a grafia e o que não pode mudar de marca.

## 1. Voz, texto e grafia

- **"1 item" é a correção certa, e só ela.** É o singular do português, e o catálogo já o usava num lugar: "Mais 1 item
  desta linha no Catálogo Digital Completo" (`print_cat.py`, `cta_box`). Agora vale nos 7 pontos (a função: ver o
  parecer de UX, §4); o "linha / linhas" da página de sistema não muda de texto.
- **"1 / ITEM" no painel do cabeçalho:** a caixa alta e o estilo são os do "ITENS" de antes (Poppins Bold, 9 pt,
  branco, espaçamento 1,1, alinhado à direita). Só a palavra muda (a posição: ver o parecer de UX, §2).
- **"item" em caixa baixa no Sumário e nas páginas de sistema** (`moto-p02-zoom-depois.png`, `moto-p03-zoom-depois.png`):
  mesma fonte, peso, tamanho e cor do "itens" da linha de cima. Coerente com o resto do catálogo: caixa alta só no
  painel, caixa baixa nas listas, como antes.
- **Nenhuma palavra nova:** "item" e "ITEM" já são do vocabulário do catálogo ("Mais 1 item…", "TODOS OS ITENS DA
  LINHA"). O tom continua o mesmo, de contagem seca, sem enfeite.
- **A capa da Linha Moto** não muda de texto ("7 famílias · 75 itens para motocicletas"). O "famílias" da capa segue
  como o MC-0015, fora desta tarefa.

## 2. O que não muda de marca

Conferido no diff (o `MARCA`, o `DOC_TITULO` e o `DOC_META` do `digital2.py` aparecem só como contexto, sem mudança) e
na prova pixel a pixel (ver o parecer de UX, §1):

- **Marca e logo:** nenhuma cor, fonte, logo ou tamanho de logo muda. A grafia "BAP AUTOPARTS" (decisão 10 a) não é
  tocada.
- **Texto institucional:** capas, "Quem somos", "Por que vender BAP", Garantia, rodapés e textos legais iguais.
- **Metadados:** o título e o autor dos PDFs vêm do `DOC_META` e do `MARCA`, que não mudam; os nomes das entregas também
  não (critério de aceite da tarefa).
- **O `cover_page` que sai** desenhava uma capa de linha que nenhum PDF usa (código morto: ver o parecer de UX, §4).
- **Regras do repositório:** sem preço e sem estoque; sem marca de terceiros. O diff não toca em nada disso.

## 3. Perguntas do `LEIA.md`

- **Pergunta 1 (painel com 1 item):** recomendo **a) "1 / ITEM"**. É o singular certo (§1);
  manter "1 / ITENS" deixaria o erro no lugar mais visível da página da linha (o painel verde do cabeçalho), que é
  justamente o que a tarefa corrige. O alinhamento: ver o parecer de UX.
- **Pergunta 2 ("1 itens" no Portfólio):** recomendo **a) fica fora da T-0027, num RD novo para a fila do Alexandre**.
  - É o mesmo erro de português e, por ser material para cliente, pesa mais na percepção da marca do que nos PDFs de uso
    interno. Mesmo assim, mudar o Portfólio pede simulação própria (regra 3 do `CLAUDE.md`) e sairia do escopo
    decidido pelo PO; o critério conservador manda fechar a T-0027 sem mexer em material de cliente.
  - Para o RD novo: os 3 pontos, as 2 páginas e o `plural` num módulo comum: ver o parecer de UX (pergunta 2). O
    Portfólio já faz o singular de "família" e "produto" (`portfolio.py:202`), e o total da `:400` é sempre maior que 1
    e não precisa mudar.

## Achados

| ID | Situação |
|---|---|
| MC-0015 | ABERTO, fora da T-0027 ("famílias" na capa da Linha Moto); na fila do Alexandre (R-20261122-103726-po). Esta tarefa não o afeta |
| MC-0011, MC-0012 | ABERTOS, como na T-0023; esta tarefa não os afeta |

## Reteste

Depois da decisão do PO e da aplicação: conferir no PR as 7 páginas contra esta simulação ("1 item" e "1 / ITEM", no
mesmo estilo de antes), o `pdfinfo` dos 3 PDFs (título e autor iguais aos do main; o número de páginas não muda: 56,
311 e 17), a grafia "BAP AUTOPARTS" e que o diff do PR bate com o `diff-gerador.patch`.

## Entrega final (PR #152)

| Campo | Valor |
|---|---|
| Data | 22/11/2026 07:25 (Manaus) |
| Decisão do PO | R-20261122-112104-po: 1a 2a |
| O que foi visto | O PR #152 (branch `catalogo-grafico/T-0027-entregas`, head `33678a7`, sobre o `ab9b8f0`): o diff do gerador e as 3 entregas, comparadas com as do `ab9b8f0` pelo texto de cada página (`pdftotext`) e pelos metadados (`pdfinfo`). As pranchas em `recados/anexos/T-0027/final/` do aloirr/bapajudacatalogo-recados (commit `24d8bf3`), em especial `completo-p302-zoom.png` |
| Parecer | **LIBERADO**. Nenhum achado novo |

- **O PR muda só os 3 geradores e as 3 entregas; não muda `docs/marca/`** (o diff igual ao da simulação: ver o parecer
  de UX, entrega final).
- **Texto:** só as 7 páginas da tabela mudam, cada uma numa palavra ("itens" → "item", "ITENS" → "ITEM"). Não sobra
  nenhum "1 itens" nem "1 ITENS" nos 3 PDFs.
- **Metadados iguais:** fora as datas e o tamanho do arquivo, o `pdfinfo` dos 3 PDFs é igual ao de antes. Título:
  `Catálogo BAP 2027 — Impressão A4 (uso interno)`, `— Completo (uso interno)` e `— Linha Moto (uso interno)`. Autor
  "BAP AUTOPARTS" nos 3. O número de páginas não muda (56, 311 e 17).
- **Grafia e regras do repositório:** nenhum "BAP AUTO PARTS" nem "BAP Autoparts"; sem preço e sem estoque (busca por
  "R$" com número, "estoque" e "saldo" nos 3 PDFs: 0); sem marca de terceiros.
- **Achados:** o MC-0015, o MC-0011 e o MC-0012 seguem abertos, como acima. O "1 itens" do Portfólio fica com o RD novo,
  na fila do Alexandre, com a regeração dele e o `plural` num módulo comum (2a).
