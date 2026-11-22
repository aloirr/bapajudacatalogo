# T-0026 · Parecer de UX da simulação (repetições nas págs. 2 a 4 do A4, nas anotações e nos sumários do Completo Digital e da Linha Moto)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 06:34 (Manaus) |
| O que foi revisto | A simulação do `catalogo-grafico`, no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0026/sim/` (commit 9c7608e): o `LEIA.md`, com as 6 perguntas, os 19 PNGs (antes, depois, lado a lado e as 2 variantes da pág. 2), o `prova_pixel_a_pixel.txt` e o `textos_paginas.txt`. Também o diff do gerador (3 arquivos, +13 −10: `print_cat.py`, `digital2.py` e `catalogo_moto.py`), sobre o main `1255bbe` |
| Pedido | T-0026 (R-20261122-102147-po, pela delegação R-20261122-090651) |
| Regra da rodada | O PO decide de forma conservadora: só tirar repetição e corrigir o que está errado, sem mudar a marca nem o texto institucional além disso |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. Nenhuma das 6 páginas mostra valor ou quantidade em estoque. O "preço acessível" do "Quem somos" é texto institucional, sem valor. Os "N itens" do sumário são o tamanho da linha no catálogo, não estoque.

A grafia, o sobretítulo "BAP AUTOPARTS" como elemento de marca e o padrão dos títulos ficam com o `design-de-marca` (ver o parecer de marca da T-0026). Aqui só falo de leitura, hierarquia e repetição.

## 1. A4, pág. 2 "Por que BAP?" (RD-0498)
Prints: `A4_pag02_antes_depois.png`, `A4_pag02_opcoes.png` e, avulsos, `A4_pag02_antes.png`, `A4_pag02_depois.png`, `A4_pag02_variante_espacamento.png` e `A4_pag02_variante_texto.png`.

- 🟢 **Hierarquia.** A ordem de leitura não muda: a barra, a faixa ("BAP AUTOPARTS" e "Por que BAP?"), "Quem somos", "Por que vender BAP", "Garantia Expressa BAP" e os números. A faixa e a barra são as mesmas da T-0025.
- 🟢 **Cada bloco responde a uma pergunta.** "Quem somos" diz quem é a empresa (fundada em 2021, qualidade, segurança e preço acessível), em 2 linhas. "Por que vender BAP" diz o que a empresa vende (as linhas leve, pesada e moto e os sistemas) e o padrão OEM. Antes, as linhas estavam no "Quem somos" e os sistemas no "Por que vender", e a qualidade com preço aparecia nos dois.
- 🟢 **Nenhuma informação útil se perde.**
  - "da suspensão à parte elétrica" está coberto pela lista de sistemas, que vai da suspensão aos acessórios.
  - "preço competitivo sem abrir mão da qualidade" diz o mesmo que "qualidade, com segurança e preço acessível", 4 linhas acima.
- 🟢 **Leitura da frase nova.** "Portfólio robusto para as linhas leve, pesada e moto: suspensão, direção, freio…" se lê de uma vez: primeiro o alcance, depois o detalhe. O texto é o do corretor, e o resto do texto institucional não muda.
- 🟢 **O vazio embaixo.** Cresce de 324 pt (38% da altura) para 352 pt (41%), 2 linhas de texto. Ver a pergunta 2 e a nota 5.1.

## 2. A4, pág. 3 "Como consultar" (RD-0499)
Prints: `A4_pag03_antes_depois.png`, `A4_pag03_antes.png` e `A4_pag03_depois.png`.

- 🟢 **Só a barra muda.** Sai o "CATÁLOGO 2027" da direita, que repetia o "CATÁLOGO DE PRODUTOS 2027" da esquerda, a 2 cm de distância. A prova mostra 797 pixels numa caixa só na direita da barra.
- 🟢 **O sobretítulo "GUIA RÁPIDO" fica**, e isso está certo: ele diz o tipo da página e não repete nada da barra nem do título.

## 3. A4, pág. 4 "Sumário" e Anotações (RD-0499)
Prints: `A4_pag04_antes_depois.png`, `A4_pag04_antes.png`, `A4_pag04_depois.png`, `A4_anotacoes_antes_depois.png`, `A4_anotacoes_antes.png` e `A4_anotacoes_depois.png`.

- 🟢 **O ano fica uma vez por página.** Antes, "2027" aparecia 3 vezes no topo (a esquerda da barra, a direita da barra e o sobretítulo). Agora fica só no "CATÁLOGO DE PRODUTOS 2027", à esquerda da barra.
- 🟢 **Hierarquia.** O sobretítulo troca só o texto, no mesmo lugar, no mesmo tamanho e com a mesma cor. O título "Sumário" e o subtítulo não se movem, e as 2 colunas do sumário ficam iguais pixel a pixel (a caixa da prova vai só até y 155 a 150 ppi, o topo da faixa).
- 🟢 **Anotações.** O mesmo, sem subtítulo. As linhas de escrever não mudam. O "57" do rodapé é só de exemplo, porque o A4 de hoje (56 págs.) não usa a página.
- 🟢 **Agora as págs. 2, 4 e as anotações têm o mesmo topo**: a barra só com o catálogo à esquerda e o sobretítulo "BAP AUTOPARTS". A pág. 3 tem o "GUIA RÁPIDO" porque é um guia. O leitor vê o mesmo padrão nas páginas de abertura.

## 4. Sumário do Completo Digital e da Linha Moto (RD-0499)
Prints: `Digital_pag02_sumario_antes_depois.png`, `Digital_pag02_sumario_antes.png`, `Digital_pag02_sumario_depois.png`, `Moto_pag02_sumario_antes_depois.png`, `Moto_pag02_sumario_antes.png` e `Moto_pag02_sumario_depois.png`.

- 🟢 **Completo.** Antes, o topo dizia "Catálogo completo" 3 vezes: "CATÁLOGO COMPLETO 2027" à esquerda da barra, "CATÁLOGO COMPLETO" à direita e "CATÁLOGO COMPLETO 2027" no sobretítulo. Agora fica uma vez, à esquerda. O texto, as 2 colunas, os itens e as páginas não mudam.
- 🟢 **O lado direito vazio é coerente no digital.** Nas páginas de linha do digital, a direita da barra é o botão "VOLTAR AO SUMÁRIO" (`digital2.py:251`, `back_button`). No próprio Sumário não há para onde voltar, e a direita vazia diz isso sem texto.
- 🟢 **Linha Moto, os 2 erros saem.**
  - A barra dizia "CATÁLOGO COMPLETO" num catálogo só de moto, ao lado de "CATÁLOGO LINHA MOTO 2027". Isso confundia o leitor sobre qual PDF ele abriu. Agora fica só "CATÁLOGO LINHA MOTO 2027".
  - O texto dizia "Todas as linhas BAP", e o PDF tem só 7. Agora diz "Todas as linhas BAP para motocicletas". O texto continua em 2 linhas, e a faixa não muda de altura.
- 🟢 **A mudança no gerador é pequena e fica num lugar só.** A frase do sumário vira a variável `SUM_DESC` (`digital2.py`), e a Linha Moto só troca a primeira frase (`catalogo_moto.py`). A segunda frase ("Toque no nome da linha…") continua escrita uma vez.

## 5. Recomendação por pergunta
| # | Pergunta | Recomendação de UX | Por quê |
|---|---|---|---|
| 1 | RD-0498, texto de "Quem somos" e "Por que vender BAP" | **a) O do corretor** | Cada bloco responde a uma pergunta (§1). Na b), "…com segurança e preço acessível, nas linhas leve, pesada e moto" junta o preço e as linhas na mesma oração, e a vírgula faz parecer que o preço é acessível só nessas linhas. Na a), as linhas abrem a lista de sistemas, que é onde o vendedor procura o que a BAP tem. A c) mantém a repetição |
| 2 | RD-0498, o vazio maior embaixo da pág. 2 | **a) Deixar como sai** | São 2 linhas a mais (de 38% para 41%). A b) abre 13 pt entre os blocos, mas o vazio continua em 323 pt, cerca de 1/3 da página: não resolve a nota 5.1 da T-0025 e põe uma medida própria nesta página, diferente do espaço entre blocos das outras. Preencher a página fica para a tarefa futura da nota 5.1, com simulação ao Alexandre |
| 3 | RD-0499, lado direito da barra | **a) Vazio** | É o padrão já aprovado na pág. 2 (RD-0429). Nas páginas de linha, a direita continua com o grupo (A4) ou com o "Voltar ao sumário" (digital). Nas páginas de abertura não há grupo nem para onde voltar. A b) repetiria o título ("Sumário") ou o sobretítulo ("GUIA RÁPIDO") que estão logo abaixo |
| 4 | RD-0499, sobretítulo do Sumário e das Anotações | **a) "BAP AUTOPARTS"** | Troca só o texto, sem mexer no layout, e deixa as págs. 2, 4 e as anotações com o mesmo topo (§3). A b) muda o layout de 2 faixas, o que sai da regra da rodada. A c) mantém o ano 2 vezes. Se a marca preferir outro sobretítulo, isso é do parecer de marca |
| 5 | RD-0499, texto do Sumário da Linha Moto | **a) "Todas as linhas BAP para motocicletas…"** | "Linha" é o termo do Sumário do Completo, do Sumário do A4 ("Linhas de produtos BAP…"), do "Encontre a linha" da pág. 3 e da segunda frase ("Toque no nome da linha"). Com a b), a primeira frase diria "famílias" e a segunda continuaria "linha", ou as duas mudariam, e o Sumário da Linha Moto ficaria diferente do Completo, que usa o mesmo gerador. Ver a nota 6.2 |
| 6 | "1 itens" | **a) Fora desta rodada, com um RD novo** | Está errado e deve ser corrigido, mas muda 6 páginas em 2 PDFs (sumários, páginas de sistema e capa da família), e isso pede outra prova pixel a pixel. Juntar aqui misturaria a correção com as repetições. Peço que o RD já saia aberto, com as 6 páginas, e que a correção trate o singular num lugar só no gerador ("1 item", "1 ITEM"), valendo para o A4, o Completo e a Linha Moto |

## 6. Notas (não seguram)
1. **O vazio da pág. 2 do A4** (nota 5.1 da T-0025). Continua valendo, agora com 41% da altura. Fica para a tarefa futura, com simulação ao Alexandre.
2. **"Famílias" na capa da Linha Moto e "linhas" no Sumário.** A capa diz "7 famílias", e o Sumário, logo na página seguinte, diz "linhas". É o mesmo conjunto com 2 nomes. Isso já estava no antes e não é repetição. Se o PO quiser um termo só, a troca menor é na capa ("7 linhas"), porque "linha" é o termo dos 3 PDFs. Fica para um RD, fora desta rodada.
3. **"Linhas" com 2 sentidos na pág. 2 do A4.** "As linhas leve, pesada e moto" (segmento de veículo) e "+40 linhas de produtos" (família de produto) estão na mesma página. Já estava no antes, com o mesmo texto, e o leitor entende pelo contexto. Não peço mudança agora.
4. **As mesmas peças em 2 linhas do Completo Digital** (achado novo, fora da T-0026). "Pneus e Câmaras de Ar Moto" (Rodagem, pág. 279, 21 itens) tem os mesmos itens de "Pneus Moto" (pág. 306, 12 itens) mais "Câmaras de Ar Moto" (pág. 307, 9 itens), na Linha Moto: os destaques CAR18, CAR14, CAG17, CAR10 e o pneu 90/90-18 57P V250R aparecem nas duas. No A4, o Sumário também lista as duas (págs. 46, 53 e 54). Conferi com o `pdftotext` no `Catalogo_BAP_2027_Completo_Digital.pdf` do main. Pode ser de propósito (a Linha Moto como seção própria do Completo). Fica para o gerente passar ao `corretor-redundancias`, que decide se abre um RD.
5. **O diff do gerador não está nos anexos.** O `LEIA.md` cita o `T-0026-simulacao.diff`, mas ele não está em `recados/anexos/T-0026/sim/` (9c7608e). Li a cópia que o `catalogo-grafico` deixou na área de trabalho da sessão. Para o `revisor-codigo` e para o registro, vale anexá-lo junto à simulação.

## Prints conferidos
Todos estão no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0026/sim/` (commit 9c7608e):
- **A4, pág. 2:** `A4_pag02_antes_depois.png`, `A4_pag02_opcoes.png`, `A4_pag02_variante_espacamento.png`, `A4_pag02_variante_texto.png`, `A4_pag02_antes.png` e `A4_pag02_depois.png`.
- **A4, pág. 3:** `A4_pag03_antes_depois.png`, `A4_pag03_antes.png` e `A4_pag03_depois.png`.
- **A4, pág. 4:** `A4_pag04_antes_depois.png`, `A4_pag04_antes.png` e `A4_pag04_depois.png`.
- **A4, anotações:** `A4_anotacoes_antes_depois.png`, `A4_anotacoes_antes.png` e `A4_anotacoes_depois.png`.
- **Completo Digital:** `Digital_pag02_sumario_antes_depois.png`, `Digital_pag02_sumario_antes.png` e `Digital_pag02_sumario_depois.png`.
- **Linha Moto:** `Moto_pag02_sumario_antes_depois.png`, `Moto_pag02_sumario_antes.png` e `Moto_pag02_sumario_depois.png`.
- **Prova e textos:** `prova_pixel_a_pixel.txt` (A4: 53 de 56 iguais, mudam 2, 3 e 4; Completo: 310 de 311, muda a 2; Linha Moto: 16 de 17, muda a 2) e `textos_paginas.txt`.

**Resultado: LIBERADO.** A simulação pode seguir para a decisão do PO, com as recomendações do §5.
