# Parecer de marca: T-0045, simulação dos PDFs (barra de links no rodapé e Aplicação na largura útil)

- **Agente:** design-de-marca
- **Data:** 27/11/2026 20:25 (hora de Manaus)
- **Branch avaliado:** `catalogo-grafico/T-0045-sim-pdf`. Primeira rodada no commit `6dd084ebd66022d8756418e31b6bf75ad34a67b6`; reteste no `ed98b0d66b6bea558d72d631989d159c3079988a`
- **Achados de origem:** UX-T45-12 (botões embaixo e juntos) e UX-T45-14 (Aplicação na largura útil), regras MENOS É MAIS e "Botões sempre embaixo e juntos" do `CLAUDE.md` (R-20261127-174951-alexandre e R-20261127-175856-alexandre)
- **Material:** Catálogo Completo Digital (311 → 278 páginas) e Linha Moto (17 → 16 páginas), simulações e bases do main `68c6dfe`. Prints antes e depois do sumário, da abertura de sistema, da primeira página de linha, das continuações e da última página, e recortes do rodapé (`rodape-*-antes.png` e `rodape-*-depois.png`)
- **Parecer:** **LIBERADO** para ir ao Alexandre como simulação. O MC-0055 foi corrigido e conferido no PDF novo.

## O que muda
- `catalogo_grafico/gerador/digital2.py`, só o layout. Os dados são os do main.
- **Barra no rodapé:** o "VOLTAR AO SUMÁRIO" sai do topo e vai para o rodapé, à esquerda, junto com o link do site. Fica na mesma posição nas páginas de linha e nas aberturas. No sumário, a barra tem só o site.
- **Abertura de sistema:** na faixa verde, o botão fica escuro com a letra verde. A letra da barra passa de 10,5 para 9,5 (7,1 pt), igual ao rodapé preto.
- **Nº da página:** vai para o canto direito, com um fio antes.
- **Aplicação em "L":** a Aplicação longa desce em "L" até a margem direita.
- **No reteste:** o aviso legal da abertura passa a sair com o `legal()` (MC-0055), e as áreas de link do rodapé ficam mais altas e mais separadas. O desenho não mudou.

## Contrastes (medidos pela fórmula da WCAG sobre os hex do dicionário `C`)
| Combinação | Contraste | Mínimo |
|---|---|---|
| Botão no rodapé preto: letra `black #141514` no `green2 #5cb85f` | 7,39:1 | 4,5:1 |
| Botão no rodapé preto: `green2` contra o `black` | 7,39:1 | 3:1 |
| Botão na faixa verde: letra `green2` no `black` | 7,39:1 | 4,5:1 |
| Botão na faixa verde: `black` contra o `green #3dae49` | 6,41:1 | 3:1 |
| Nº da página no rodapé preto: `green2` no `black` | 7,39:1 | 3:1 |
| Fio do nº: `divider` no `black` e `gdark` no `green` | 1,66:1 e 1,89:1 | decorativo |
| Texto branco na faixa verde (site, disponibilidade, nº, aviso legal): `white` no `green` | 2,86:1 | 4,5:1 (pendência, abaixo) |

## Checklist
| Item | Resultado |
|---|---|
| A. Cor | Nenhum hex solto novo: o diff só usa chaves do `C`. O botão da faixa verde é a mesma pílula do rodapé preto, com as cores invertidas, e continua fácil de reconhecer |
| B. Logo e "uso interno" | O logo do topo (`dimg/capa_0.png`) não mudou. Na abertura saiu só o botão do alto. O aviso "USO INTERNO E CONFIDENCIAL" aparece em todas as páginas (278/278 e 16/16) |
| C. Tipografia | Só Poppins Regular, Medium e Bold, embutidas nos dois PDFs. A barra sai com 7,1 pt em todo lugar, o botão com 8,5 Bold e espaçamento 0,8 (como antes), o nº com 13 Bold. Depois do MC-0055, o aviso legal sai com 6,75 pt, no mesmo x, em todas as páginas |
| D. Grafismos | Sem mudança |
| E. Aplicações | Uma barra só por página, no rodapé, com o botão e o site juntos e a ação à esquerda. Os links de linha do sumário e da abertura ficam fora da barra, como a regra permite. O botão não aparece na capa, no sumário nem na contracapa (275/278 e 13/16 páginas). A Aplicação em "L" usa a largura útil sem mudar a fonte, a cor nem o destaque das montadoras. As áreas de link não têm borda (`/Border [0 0 0]`), e as caixas vermelhas dos prints de rodapé são só a marcação de conferência |
| F. Voz | "VOLTAR AO SUMÁRIO" é direto e no imperativo, como antes. "www.bapautoparts.com.br · @bapautoparts" e "Consulte a disponibilidade na sua região." (R-20261120-212000-alexandre) não mudaram. A grafia é "BAP AUTOPARTS" |
| Terceiros, preço e estoque | Concorrentes (ex.: "Tecfil PEC3015") e montadoras (ex.: "SCANIA") aparecem só em texto, na fonte e na cor do catálogo. Não há logo nem selo de terceiro. A busca por R$, preço, estoque, saldo, qtd e margem não achou nada. "custo" aparece só dentro de "Custom", nome de veículo (Gmc 3500 HD Custom, p. 205 e 208) |

## Achados
| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono | Situação |
|---|---|---|---|---|---|---|---|
| MC-0055 | Abertura de sistema (Digital p. 3, Moto p. 3), `catalogo_grafico/gerador/digital2.py`, `pagina_sistema()` | tipografia | regra MENOS É MAIS (T-0045, `CLAUDE.md`), parte 2, tamanhos padrão; manual a aprovar | baixa | O aviso legal da abertura saía com 8,5 (6,37 pt), contra 9 (6,75 pt) nas outras páginas. Antes: duas chamadas `dc.label(..., 8.5, 'white', ...)`. Depois: `dc.legal(H - 56 + 34, 9, 'white')` | `catalogo-grafico` | **Fechado** em `ed98b0d`. Conferido no PDF novo: 6,75 pt, de x 79 a 517, nas p. 2, 3 e 4 do Digital e da Moto |

## Pendência da simulação do verde (não é achado desta tarefa e não segura)
- Na faixa verde da abertura, o texto branco sobre o `green #3dae49` dá 2,86:1. Isso vale para o site, a frase de disponibilidade, o nº da página e o aviso legal. Não passa nem nos 3:1 de texto grande.
- Já era assim antes desta tarefa. Quem resolve é a simulação do verde decidido (R-20261120-115646-alexandre: texto sobre verde na versão escura, com 4,5:1 ou mais), que ainda vai ao Alexandre com o manual "a aprovar". Nada muda na cor antes do "aprovado" dela.
- Esta simulação não mexe na cor: só leva a letra da barra de 10,5 para 9,5 (7,9 pt para 7,1 pt), igual ao rodapé preto.
