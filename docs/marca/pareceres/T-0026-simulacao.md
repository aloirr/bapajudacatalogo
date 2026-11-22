# T-0026 · Parecer de marca da simulação (repetições nas págs. 2 a 4 do A4, nas anotações e nos sumários)

| Campo | Valor |
|---|---|
| Tarefa | T-0026 (RD-0498 e RD-0499), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 06:35 (Manaus) |
| O que foi visto | Simulação do `catalogo-grafico`, feita a partir do main `1255bbe`: o `LEIA.md` (6 perguntas), os PNGs e o `textos_paginas.txt` e o `prova_pixel_a_pixel.txt` em `recados/anexos/T-0026/sim/` do aloirr/bapajudacatalogo-recados (commit `9c7608e`). O `T-0026-simulacao.diff` citado no `LEIA.md` não está na pasta; li o diff na worktree do `catalogo-grafico` (base `1255bbe`, sem commit: `print_cat.py`, `digital2.py` e `catalogo_moto.py`). Conferi também, no main `2ac3ec2`, a capa da Linha Moto (`catalogo_moto.py`) e o uso de "linha" e "família" nos 3 geradores |
| Base de comparação | `docs/marca/manual.md`, "Nome da marca" (decisão 10 a, R-20261122-032433-alexandre); o resto do manual ainda está "a aprovar". Meu parecer da T-0025 (`docs/marca/pareceres/T-0025-simulacao.md`), que liberou o sobretítulo "BAP AUTOPARTS" da pág. 2 do A4 |
| Regra da rodada | R-20261122-102147-po, pela delegação R-20261122-090651-alexandre: só tirar repetição e corrigir o que está errado, sem mudar a marca nem o texto institucional além disso |
| Parecer | Entrega final (PR #146, head `0985964`): **LIBERADO**, em 22/11 06:44 (seção "Entrega final"). Simulação: **LIBERADO** para o PO decidir. Concordo com as recomendações do `catalogo-grafico` nas perguntas 1, 3, 4, 5 e 6; a pergunta 2 é de layout (ver o parecer de UX). Um achado novo, baixo e fora desta rodada (MC-0015) |

Nada contra as regras do repositório: sem preço e sem estoque (o "preço acessível" do "Quem somos" é texto
institucional, sem valor, e já estava no "antes"; o "preço competitivo" sai); sem logo, símbolo ou cor de terceiros.
Nenhuma cor, fonte ou logo novo entra no "depois": o sobretítulo novo usa o mesmo estilo do de antes (Poppins Bold,
10 pt, `gdark`, espaçamento 1,6), e o logo do `topbar` não muda.

Imagens citadas (todas em `recados/anexos/T-0026/sim/`, commit `9c7608e`):
`A4_pag02_antes_depois.png`, `A4_pag02_variante_texto.png`, `A4_pag03_antes_depois.png`, `A4_pag04_antes_depois.png`,
`A4_anotacoes_antes_depois.png`, `Digital_pag02_sumario_antes_depois.png` e `Moto_pag02_sumario_antes_depois.png`.

## 1. Texto da pág. 2 do A4, "Quem somos" e "Por que vender BAP" (pergunta 1)

Recomendo **a) o texto do corretor**, como está na simulação (`A4_pag02_antes_depois.png`).

- **A frase-definição da empresa fica intacta.** "A BAP AUTOPARTS é uma empresa brasileira fundada em 2021 para oferecer
  componentes automotivos de qualidade, com segurança e preço acessível." é a frase institucional da marca, e na a) ela
  não perde nem ganha uma palavra: o "Quem somos" só perde a segunda frase, que era a repetida. Na b)
  (`A4_pag02_variante_texto.png`), essa frase ganha "nas linhas leve, pesada e moto" no fim, e é a definição da
  empresa que muda.
- **Cada argumento no seu bloco.** As linhas leve, pesada e moto são argumento de venda (amplitude do portfólio) e
  combinam com "Por que vender BAP". A qualidade com preço fica uma vez, na definição.
- **Nada se perde de marca.** Sai "da suspensão à parte elétrica", que a lista de sistemas já cobre, e "preço
  competitivo sem abrir mão da qualidade", que o "Quem somos" já diz com "qualidade" e "preço acessível". O
  posicionamento de preço continua na página, com a palavra da definição.
- **Voz da marca:** continua direta e confiante, no tom do vendedor ("Portfólio robusto…", "padrão OEM, testados para
  máxima performance"). Nenhuma palavra nova além do "as linhas leve, pesada e moto", que vem do próprio "antes".
- **Grafia:** certa. "BAP AUTOPARTS", "OEM", "SAC BAP" e "Garantia Expressa BAP" como antes; acentos e crases certos.
- **Observação, sem pedido de mudança:** em "Portfólio robusto para as linhas leve, pesada e moto: suspensão, direção…",
  os dois-pontos podem ser lidos como se a lista fossem as linhas, mas o sentido (os sistemas que o portfólio cobre nas
  três linhas) fica claro no contexto. Pela regra da rodada, não proponho texto novo.

## 2. Sobretítulo "BAP AUTOPARTS" no Sumário e nas Anotações (pergunta 4)

Recomendo **a) "BAP AUTOPARTS"**, como está na simulação. É uso certo da marca:

- **É o padrão que já existe e já foi liberado.** A pág. 2 do A4 tem o sobretítulo "BAP AUTOPARTS" (T-0025). Com a a),
  as páginas institucionais do A4 (pág. 2, Sumário e Anotações) e os sumários do Completo e da Linha Moto ficam com o
  mesmo sobretítulo, no mesmo estilo. O "GUIA RÁPIDO" da pág. 3 é rótulo de função e fica, como diz a simulação.
- **Não é repetição de texto.** O `topbar` tem o logo (que diz "bap") e o nome do catálogo com o ano; o sobretítulo tem
  o nome da empresa. Logo + nome escrito é a assinatura normal de marca, e é o único lugar legível do "AUTOPARTS" nessas
  páginas, fora do endereço no rodapé (o mesmo raciocínio da etiqueta do MC-0014, na T-0025).
- **O nome de cada catálogo continua uma vez por página**, à esquerda da barra: "CATÁLOGO DE PRODUTOS 2027",
  "CATÁLOGO COMPLETO 2027" e "CATÁLOGO LINHA MOTO 2027". O ano fica uma vez.
- **A b) (sem sobretítulo) muda o layout** em 2 lugares (o `hero` do A4 e o título e o texto do digital), e a c) deixa o
  ano repetido. As duas ficam fora da regra conservadora.
- **Cuidado para depois (não é pedido desta rodada):** o "BAP AUTOPARTS" como sobretítulo serve para as páginas
  institucionais (Por que BAP, Sumário, Anotações). Nas páginas de sistema e de linha, o sobretítulo continua a ser o
  sistema ou a seção, e não deve virar "BAP AUTOPARTS". Vai como proposta no manual "a aprovar".

## 3. Texto do Sumário da Linha Moto (pergunta 5)

Recomendo **a) "Todas as linhas BAP para motocicletas com as aplicações completas. Toque no nome da linha para ir
direto à página."**

- **"Linha" é o termo da marca para o cliente.** Ele está no Sumário do Completo ("Todas as linhas BAP…"), no do A4
  ("Linhas de produtos BAP…"), no Guia Rápido ("Cada página traz uma linha de produtos BAP") e no cartão "+40 linhas de
  produtos". "Família" só aparece para o cliente num lugar: a capa da Linha Moto ("7 famílias · 80 itens para
  motocicletas"). Nos dados, "FAMILIA" é o nome da coluna da base, não termo de venda.
- **A a) é a menor correção:** só entra "para motocicletas", e o "Toque no nome da linha" fica igual ao do Completo. A
  b) troca 2 palavras e leva o termo da capa para o sumário, quando o certo é o contrário (ver o MC-0015).
- **O "Todas" fica verdadeiro:** as 7 linhas do sumário somam os itens de moto do Completo (o "Pneus e Câmaras de Ar
  Moto", 21 itens, da Rodagem do Completo, é o mesmo conjunto que a Linha Moto divide em "Pneus Moto", 12, e "Câmaras de
  Ar Moto", 9).
- **Saem os 2 erros de nome:** o "CATÁLOGO COMPLETO" na barra de um catálogo só de moto e o texto que falava de todas
  as linhas BAP. Isso é correção de nome do catálogo, não mudança de marca.

## 4. Grafia "BAP AUTOPARTS" em tudo o que muda

Certa em tudo (decisão 10 a). Conferi no diff e nos PNGs:

- A4: o sobretítulo do Sumário (pág. 4) e das Anotações (`hero(dc, 'BAP AUTOPARTS', …)`) e o "A BAP AUTOPARTS é…" do
  "Quem somos" (pág. 2), que não muda.
- Completo Digital e Linha Moto: o sobretítulo do Sumário (`dc.label(…, 'BAP AUTOPARTS', …)` em `digital2.py`, que a
  Linha Moto herda).
- Não há "BAP AUTO PARTS" nem "BAP Autoparts" no diff nem no texto das 6 páginas. O espaço entre as letras no
  `textos_paginas.txt` ("B A P A U T O P A R T S") é só o espaçamento do estilo do sobretítulo; nos PNGs, a leitura é
  "BAP AUTOPARTS".

## 5. Perguntas 2, 3 e 6

- **Pergunta 2 (vazio embaixo da pág. 2):** é layout e espaço; ver o parecer de UX
  (`docs/ux/pareceres/T-0026-simulacao.md`). Sem objeção de marca à a) nem à b): nenhuma das duas tem texto novo, cor ou
  fonte nova.
- **Pergunta 3 (lado direito da barra):** concordo com **a) vazio**, como na pág. 2 (RD-0429, T-0025). O lado direito
  era navegação, não marca; a assinatura da barra (logo + nome do catálogo) fica igual em todas as páginas. O espaço:
  ver o parecer de UX.
- **Pergunta 6 ("1 itens"):** concordo com **a) fora desta rodada**, com um achado (RD) próprio para o singular "1 item"
  nos 3 PDFs. É erro de português visível ao vendedor, mas não é de marca, e corrigir agora muda mais páginas e pede
  nova simulação.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono | Situação |
|---|---|---|---|---|---|---|---|
| MC-0015 | Linha Moto, capa (`catalogo_moto.py:30`, "7 famílias · 75 itens para motocicletas") comparada com o Sumário da Linha Moto e do Completo, o A4 (Sumário, Guia Rápido e cartão "+40 linhas de produtos") | voz | manual a aprovar (mesmo termo para o cliente em todos os materiais) | baixa (a capa se entende; só o termo difere) | Fora desta rodada: levar ao Alexandre, pelo `po`, a troca de "famílias" por "linhas" na capa da Linha Moto ("7 linhas · 75 itens para motocicletas"), com simulação da capa. Entra no manual "a aprovar" como glossário de voz: "linha" = linha de produtos; "leve, pesada e moto" = segmentos | design-de-marca (proposta), depois catalogo-grafico; pergunta pelo `po` | ABERTO, fora da T-0026; na fila do Alexandre (R-20261122-103726-po) |
| MC-0011 | (T-0023) | tipografia | manual a aprovar | baixa | Sem mudança; vai ao Alexandre | design-de-marca, depois catalogo-grafico | ABERTO, como na T-0023 (não é afetado por esta tarefa) |
| MC-0012 | (T-0023) | logo | manual a aprovar | baixa | Sem mudança; vai ao Alexandre | design-de-marca, depois catalogo-grafico e web-site | ABERTO, como na T-0023 (não é afetado por esta tarefa) |

## Reteste

Depois da decisão do PO e da aplicação: conferir no PR as entregas novas (A4 págs. 2, 3 e 4; Sumário do Completo
Digital e da Linha Moto; a página de Anotações, se o A4 voltar a usá-la) contra esta simulação: o texto escolhido na
pergunta 1, o sobretítulo escolhido na pergunta 4, o texto escolhido na pergunta 5 e a grafia "BAP AUTOPARTS". Conferir
também que nenhuma outra página muda e que o `T-0026-simulacao.diff` (ou o diff do PR) bate com o que li na worktree.

## Entrega final (PR #146)

| Campo | Valor |
|---|---|
| Data | 22/11/2026 06:44 (Manaus) |
| Decisão do PO | R-20261122-103726-po: 1a 2a 3a 4a 5a 6a; o MC-0015 foi para a fila do Alexandre |
| O que foi visto | O PR #146 (branch `catalogo-grafico/T-0026-entregas`, head `09859641823cc6daf50a34eb6de01318d73bc86d`): o diff do gerador (`print_cat.py`, `digital2.py`, `catalogo_moto.py` e `LEIA_GERADOR.md`) e as 3 entregas que mudam (A4, Completo Digital e Linha Moto), comparadas com as do main `2ac3ec2`: as páginas renderizadas, o texto de cada página com `pdftotext` e os metadados com `pdfinfo`. Também vi as pranchas finais e a prova pixel a pixel em `recados/anexos/T-0026/final/` do aloirr/bapajudacatalogo-recados (commit `18412ec`), em especial `A4_pag02_antes_depois.png`, `A4_pag04_antes_depois.png`, `Digital_pag02_sumario_antes_depois.png` e `Moto_pag02_sumario_antes_depois.png` |
| Parecer | **LIBERADO**. Nenhum achado novo |

- **Texto da pág. 2 do A4 (1a):** igual ao da simulação. O "Quem somos" fica só com a frase-definição, sem nenhuma
  palavra mudada ("A BAP AUTOPARTS é uma empresa brasileira fundada em 2021 para oferecer componentes automotivos de
  qualidade, com segurança e preço acessível."). "Por que vender BAP" começa com "Portfólio robusto para as linhas leve,
  pesada e moto:" e termina em "testados para máxima performance.". "Garantia Expressa BAP" não muda. O vazio maior
  embaixo (2a) é o da simulação; o espaço: ver o parecer de UX.
- **Sobretítulo "BAP AUTOPARTS" (4a):** está no Sumário do A4 (pág. 4), no do Completo Digital (pág. 2) e no da Linha
  Moto (pág. 2), no mesmo estilo do de antes (Poppins Bold, 10 pt, `gdark`, espaçamento 1,6). O A4 entregue continua
  com 56 páginas e sem página de Anotações; no código, a `anotacoes()` usa o mesmo sobretítulo. A pág. 3 continua com
  "GUIA RÁPIDO". A barra tem só o logo e o nome do catálogo com o ano, uma vez, e o lado direito fica vazio (3a).
- **Sumário da Linha Moto (5a):** "Todas as linhas BAP para motocicletas com as aplicações completas. Toque no nome da
  linha para ir direto à página." Saiu o "CATÁLOGO COMPLETO" da barra. A capa continua com "7 famílias" (MC-0015, na
  fila do Alexandre). O "1 itens" fica para um RD próprio (6a).
- **Grafia:** "BAP AUTOPARTS" certa em tudo o que muda. Não há "BAP AUTO PARTS" nem "BAP Autoparts" no diff nem no texto
  dos 3 PDFs entregues.
- **Metadados iguais:** fora as datas e o tamanho do arquivo, o `pdfinfo` dos 3 PDFs é igual ao do main. Título:
  `Catálogo BAP 2027 — Impressão A4 (uso interno)`, `— Completo (uso interno)` e `— Linha Moto (uso interno)`. Autor
  "BAP AUTOPARTS" nos 3. O número de páginas não muda (56, 311 e 17).
- **Nada de marca mudou fora do pedido:** comparei as 384 páginas dos 3 PDFs, renderizadas, com as do main. Só mudam a
  pág. 2 (texto), a pág. 3 (lado direito da barra) e a pág. 4 (barra e sobretítulo) do A4, e a pág. 2 do Completo Digital
  e da Linha Moto (barra, sobretítulo e, na Linha Moto, o texto). O texto, página a página, muda só nessas mesmas
  páginas. As caixas da diferença batem com as da prova pixel a pixel do `catalogo-grafico`. O diff dos `.py` é o mesmo
  que li na simulação. Nenhuma cor, fonte, logo ou tamanho de logo mudou; capas e contracapas iguais. O PR não muda
  `docs/marca/`.
- **Regras do repositório:** sem preço e sem estoque (busca por "R$" com número, "estoque" e "saldo" nos 3 PDFs: 0); sem
  marca de terceiros.
- **Achados:** nenhum novo. O MC-0015 segue ABERTO, na fila do Alexandre. O MC-0011 e o MC-0012 seguem abertos, como na
  T-0023.
