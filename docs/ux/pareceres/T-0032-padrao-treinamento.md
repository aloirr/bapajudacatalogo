# T-0032 · Parecer de UX do padrão de treinamento (Passo 1 i)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 10:35 (Manaus) |
| O que foi revisto | Branch `catalogo-grafico/T-0032-padrao-treinamento`, head `fb29bbdcfee7611c7a0ee5d4e6e0a65432994a82`: o `catalogo_grafico/treinamentos/PADRAO_TREINAMENTO.md` (S1 a S11), a referência `referencia/tipos_de_slide_originais.png` (13 tipos, Lubrificantes) e a amostra de Mecânica Básica (`AMOSTRA_Treinamento_Mecanica_Basica_BAP.pptx` e `slide_01.png` a `slide_08.png`). Tamanhos de fonte lidos do XML do .pptx; contraste calculado pelas cores do tema |
| Pedido | T-0032, Passo 1 (i): o Alexandre aprova o padrão antes de gerar ou atualizar qualquer treinamento |
| Resultado | **VOLTA PARA AJUSTE**: 3 🟡, sem 🔴. São ajustes do padrão (cor, tamanho, guia), não da estrutura |

Voz, texto, grafia, fonte e a escolha do verde (S10) ficam com o `design-de-marca` (ver o parecer de marca do padrão de treinamento da T-0032). Aqui só falo de layout, hierarquia, legibilidade e grade.

## 1. O que está 🟢
- 🟢 **Estrutura e tipos seguem os originais.** Capa, tópicos, seção, cartões, tabela com ATENÇÃO, hub com DICA DE CAMPO, checklist e quiz têm o mesmo desenho dos tipos da referência. Quem já deu o treinamento de Lubrificantes reconhece o de Mecânica Básica.
- 🟢 **A grade é a mesma em todos os slides.** Margem de 0,6", kicker, título, logo, faixa de dica ou atenção, rodapé e número da página ficam no mesmo lugar nos slides 2 e 4 a 8. Nada encosta na borda do slide.
- 🟢 **Letra maior que nos originais.** Checklist 16 pt, quiz 17 pt, tabela 13 pt e dica 14 pt. Nos originais, o texto dos cartões e das tabelas é bem menor e some no projetor.
- 🟢 **Tópicos (slide 2):** o título de 2 linhas ("Suspensão, direção e rodagem") alinha pela base com os de 1 linha, e as descrições ficam na mesma altura. Isso resolve a S1 no próprio gerador.
- 🟢 **Hub (slide 6):** nome da peça, código e OFEREÇA JUNTO por cartão. É mais útil para vender que o ícone do original, e os 6 cartões têm a mesma altura.
- 🟢 **Sem preço e sem estoque** na amostra. Com a S2, também nos 3 atualizados. A alçada de 15% é regra comercial, não preço: decisão do `po`.

## 2. Os ajustes
### 🟡 1. Contraste de 4 pares de cor (todo o padrão)
| Onde | Cores | Contraste | Mínimo |
|---|---|---|---|
| Tabela (slide 5): texto das colunas 2 a 4, em cinza, na linha verde-clara | `#6B7570` sobre `#EEF7EF` | 4,36:1 | 4,5:1 |
| Números em verde sobre branco: tópicos e "287 itens" (slides 2 e 4) | `#59BA61` sobre `#FFFFFF` | 2,44:1 | 3:1 (texto grande) |
| Número do quiz (slide 8) | branco sobre `#F28C28` | 2,45:1 | 3:1 |
| Palavra "ATENÇÃO" (slide 5) | `#F28C28` sobre `#FDF1E6` | 2,21:1 | 3:1 |

No projetor o contraste cai ainda mais. Pedido (o resultado; a cor final passa pelo `design-de-marca`):
- texto e número sobre fundo claro em verde-escuro `#2F7D36` (5,11:1) ou escuro `#1E2B22`. O verde `#59BA61` fica para fundo, círculo de ícone e faixa (o verde `#62BB47` da S10 dá 2,41:1 e não resolve);
- corpo da tabela em escuro, como nos originais. A coluna "Na BAP", que é o que o vendedor oferece, não pode ser a mais apagada;
- número do quiz em escuro sobre laranja (6,01:1) ou em branco sobre um laranja mais escuro (ex.: `#A9530A`, 5,35:1);
- "ATENÇÃO" em laranja-escuro (ex.: `#A9530A`, 4,81:1) ou em escuro, com o ícone laranja.

### 🟡 2. Slide 4, cartões de 6 colunas: corpo em 11 pt e hierarquia invertida
- A descrição de cada sistema sai em 11 pt, abaixo do mínimo de 12 pt da própria S6. A exceção da S6 vale para rótulo ("itens no catálogo"), não para frase. Nos cartões de 4 linhas (Motor, Arrefecimento, Filtração), o texto termina a cerca de 0,1" da borda do cartão.
- O número (24 pt) vem antes do nome do sistema (15 pt). O slide ensina os sistemas: o nome tem de ser o primeiro que se lê, e a quantidade de itens é apoio.
- Pedido (o como é do `catalogo-grafico`): nome do sistema no topo do cartão; quantidade numa linha menor; corpo com 12 pt ou mais; folga igual nos 4 lados. A grade 4 × 3 (cartão de 2,92") é uma saída possível.

### 🟡 3. O guia: S6 mais precisa e tipos novos sem desenho
- **S6:** escrever "corpo com 12 pt ou mais; rótulo (itens no catálogo, OFEREÇA JUNTO, legenda do hub, rodapé) com 10 pt ou mais" e dizer o que acontece com a tabela de mais de 6 linhas: ela se divide em 2 slides com o mesmo título, "(1 de 2)", e o cabeçalho repetido.
- **§6 do guia:** "mitos e verdades" e "passo a passo numerado" são tipos novos. Não estão na tabela de tipos da §2 nem na referência dos originais. Ou entram agora na §2, com o desenho, e numa simulação antes de algum treinamento usá-los, ou ficam fora do padrão. Os outros 3 tipos "a fazer" (aprender, preparado para, fechamento em 3 etapas) têm desenho na referência e podem seguir só com ela.

## 3. As sugestões S1 a S11, pelo layout
| # | Faz sentido? | Observação de UX |
|---|---|---|
| S1 | Sim | A reserva de 2 linhas funciona na amostra (§1). A fonte é decisão de marca |
| S2 | Sim, obrigatória | Sem estoque em nenhum material. O dado envelhece e não tem como ser atualizado |
| S3 | Sim | O mesmo número no treinamento e no catálogo. A largura do número muda ("24" a "1.147"), e o cartão tem de caber o maior |
| S4 | Sim | Mesma abertura em todos: consistência |
| S5 | Sim | Não é layout: as notas não aparecem no slide |
| S6 | Sim, com o ajuste do 🟡 3 | — |
| S7 | Fora de UX | Conteúdo |
| S8 | Sim | "Uma informação, um lugar". Sem componente novo: a remissão vai na faixa DICA DE CAMPO ou nas notas |
| S9 | Sim | O PDF sai do mesmo .pptx, com a mesma hierarquia. Conferir na simulação de cada treinamento que nada muda de lugar no PDF |
| S10 | Marca | Qualquer dos 2 verdes precisa do verde-escuro para texto sobre branco (🟡 1) |
| S11 | Sim, mas no lugar certo | O vendedor não usa a versão da base para agir. Vai nas notas da capa ou no rodapé do Obrigado, não na capa. O exemplo "base v15" está desatualizado (no main, a base é a v27) |

## 4. Notas (não seguram)
1. O "componentes de qualidade" do logo pequeno (0,53") não se lê, como nos originais: com a marca.
2. Mudam 2 coisas em relação aos originais: o corpo das tabelas (cinza na amostra, escuro nos originais) e o hub (código no lugar do ícone). O 🟡 1 devolve o escuro à tabela. O hub novo fica.

**Resultado: VOLTA PARA AJUSTE** (3 🟡). Depois do ajuste, refaço a conferência dos slides 2, 4, 5 e 8 e do guia (S6 e §2).
