# T-0027 · Parecer de UX da simulação ("1 itens" passa a "1 item", RD-0510)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 07:19 (Manaus) |
| O que foi revisto | A simulação do `catalogo-grafico`, no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0027/sim/` (commit bc5058f): o `LEIA.md`, com a tabela das 7 páginas, a prova pixel a pixel e as 2 perguntas, o `diff-gerador.patch` e os 28 PNGs (página inteira a 150 ppi e recorte a 300 ppi, antes e depois). Também o commit do gerador `2164a2d` (3 arquivos, +8 −48: `digital2.py`, `print_cat.py` e `catalogo_moto.py`), sobre o main `ab9b8f0` |
| Pedido | T-0027 (R-20261122-110411-po, pela delegação R-20261122-090651) |
| Regra da rodada | Correção de erro, no critério conservador: muda só a palavra, sem mexer na marca, no texto institucional nem no layout |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. O "N itens" é o tamanho da linha no catálogo, não estoque.

A grafia ("item", "ITEM") e os termos ficam com o `design-de-marca` (ver o parecer de marca da T-0027). Aqui só falo de leitura e layout.

## 1. A mudança fica só na palavra
Comparei por conta própria cada par antes e depois (diferença de pixels nos 14 pares de PNG):

| PDF | Pág. | Caixa que muda (página inteira, 150 ppi) |
|---|---|---|
| Linha Moto | 2 (Sumário) | 39 × 12 px, só o "1 item" da linha Lâmpadas Moto |
| Linha Moto | 3 (Sistema Elétrica) | 44 × 13 px, só o "1 item" |
| Linha Moto | 5 (painel) | 46 × 11 px, só o "ITEM" |
| Completo Digital | 2 (Sumário) | 40 × 12 px, só o "1 item" |
| Completo Digital | 300 (Seção Linha Moto) | 44 × 13 px, só o "1 item" |
| Completo Digital | 302 (painel) | 46 × 11 px, só o "ITEM" |
| A4 gráfica | 50 (painel) | 46 × 11 px, só o "ITEM" |

- 🟢 Nenhum outro elemento das 7 páginas se move: título, número da página, linhas divisórias, foto e destaques ficam iguais pixel a pixel. Bate com a prova do `LEIA.md` (7 de 384 páginas).

## 2. Painel do cabeçalho: "1 / ITEM" (A4 pág. 50, Completo pág. 302, Moto pág. 5)
Prints: `a4-p50-zoom-*`, `completo-p302-zoom-*`, `moto-p05-zoom-*` e as páginas inteiras.

- 🟢 **Alinhamento à direita.** No recorte a 300 ppi, a borda direita do "ITEM" fica onde estava a do "ITENS" (x 741 no A4, 740 nos digitais; antes 741), e o "1" não se move (x 719 a 740). A pilha "1 / ITEM" continua com a mesma borda direita.
- 🟢 **Sem sobreposição.** O "ITEM" fica mais curto (cerca de 6,1 mm contra 7,4 mm do "ITENS") e cresce para dentro do círculo verde-claro. Não encosta na foto nem na borda do painel.
- 🟢 **Equilíbrio.** O número continua o elemento forte do painel, e o rótulo continua mais largo que o "1", como antes. A diferença de 1,3 mm some ao lado da foto e do título "Lâmpadas Moto". O contraste do branco sobre o verde não muda.
- 🟢 **Leitura.** Agora o painel diz "1 ITEM", e o destaque logo abaixo mostra 1 cartão (LAM2020). O número e o rótulo concordam com o que o leitor vê na página.

## 3. Sumário e página de sistema (Moto págs. 2 e 3, Completo págs. 2 e 300)
Prints: `moto-p02-zoom-*`, `moto-p03-zoom-*`, `completo-p002-zoom-*`, `completo-p300-zoom-*` e as páginas inteiras.

- 🟢 **A coluna de contagem continua alinhada.** O "1 item" termina na mesma borda do "5 itens" e do "3 itens" das linhas vizinhas (diferença de até 1 px a 300 ppi, menos de 0,1 mm, do desenho da letra "m" contra o "s"). O número da página, à direita, não se move.
- 🟢 **Sem sobreposição** com o nome da linha, à esquerda, nem com o número da página.
- 🟢 **A página de sistema já estava certa no resto.** "2 linhas · 6 itens" (Moto pág. 3) não muda; só o "1 item" da Lâmpadas Moto.

## 4. O gerador
- 🟢 **O singular fica num lugar só** (`plural()` no `digital2.py`) e vale para os 7 pontos que escrevem "N itens" ou "N linhas" nos 3 PDFs, inclusive os que hoje não caem no 1 (capa da Linha Moto, continuação da tabela, "Mais N … desta linha"). Isso atende ao que pedi na pergunta 6 da T-0026.
- 🟢 **O `cover_page` sai** sem mudar página nenhuma: nenhum arquivo o chama (conferi no worktree do `2164a2d`), e a prova pixel a pixel confirma.

## 5. Recomendação por pergunta
| # | Pergunta | Recomendação de UX | Por quê |
|---|---|---|---|
| 1 | Painel do cabeçalho com 1 item | **a) "1 / ITEM"** | §2. A b) deixaria o erro em 3 páginas e tiraria o singular de "um lugar só" |
| 2 | "1 itens" no Portfólio (`portfolio.py:154`, `:180` e `:257`; págs. 69 e 76) | **a) Fora da T-0027, num RD novo** | O Portfólio não está nos 3 PDFs desta tarefa (material para cliente, com simulação própria: ver o parecer de marca, pergunta 2). Juntar agora misturaria duas provas pixel a pixel. Peço que o RD já saia com os 3 pontos e as 2 páginas, e com uma observação: o `portfolio.py` não importa o `digital2.py` (importa o `apres_bemol` e o `taxo`). Para o singular continuar num lugar só, a correção do Portfólio deve usar o mesmo `plural()`, num módulo que os dois geradores importem, e não uma segunda cópia |

## 6. Nota (não segura)
1. **A página da Lâmpadas Moto fica quase vazia** nos 3 PDFs (A4 pág. 50, Completo pág. 302, Moto pág. 5): 1 cartão e cerca de 2/3 da página em branco. Já era assim no antes e está fora do escopo da T-0027 (só muda a palavra). Fica registrado para uma tarefa futura de layout, com simulação ao Alexandre, se ele quiser.

## Prints conferidos
Todos estão no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0027/sim/` (commit bc5058f):
- **Linha Moto:** `moto-p02-antes.png`, `moto-p02-depois.png`, `moto-p02-zoom-antes.png`, `moto-p02-zoom-depois.png`, e os mesmos 4 da `moto-p03` e da `moto-p05`.
- **Completo Digital:** os 4 da `completo-p002`, da `completo-p300` e da `completo-p302`.
- **A4 gráfica:** `a4-p50-antes.png`, `a4-p50-depois.png`, `a4-p50-zoom-antes.png` e `a4-p50-zoom-depois.png`.
- **Gerador:** `diff-gerador.patch` e o commit `2164a2d` (branch local `catalogo-grafico/T-0027-entregas`).

**Resultado: LIBERADO.** A simulação pode seguir para a decisão do PO, com as recomendações do §5.

---

## Entrega final (PR #152)

| Campo | Valor |
|---|---|
| Data | 22/11/2026 07:27 (Manaus) |
| O que foi revisto | O PR #152, branch `catalogo-grafico/T-0027-entregas`, head `33678a7`, comparado com as entregas do origin/main `0fb9453`: os 3 PDFs (`Catalogo_BAP_2027_A4_grafica.pdf`, `Catalogo_BAP_2027_Completo_Digital.pdf` e `Catalogo_BAP_2027_Linha_Moto.pdf`) e o gerador |
| Decisão do PO | 1a e 2a (R-20261122-112104-po) |
| Pranchas | No aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0027/final/` (commit 24d8bf3) |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

### A entrega bate com a simulação aprovada
- 🟢 **O código é o da simulação.** O diff do gerador no PR é o do commit `2164a2d`, linha a linha igual ao `diff-gerador.patch` da simulação.
- 🟢 **Conferi os PDFs entregues por conta própria.** Renderizei com o `pdftoppm`, a 150 ppi, as entregas do main e as do PR, página por página:

  | PDF | Páginas (main = PR) | Mudam |
  |---|---|---|
  | A4 | 56 | 50 |
  | Completo Digital | 311 | 2, 300 e 302 |
  | Linha Moto | 17 | 2, 3 e 5 |

  As caixas que mudam são as do §1, com diferença de até 1 px, que vem do renderizador. Todas as outras páginas ficam iguais pixel a pixel. Os nomes dos arquivos não mudam (metadados: ver o parecer de marca).
- 🟢 **O texto muda só na palavra:** ver o parecer de marca, entrega final.
- 🟢 **As pranchas** (`*-prancha.png` e `*-zoom.png`) mostram o mesmo antes e depois da simulação. A decisão 1a ("1 / ITEM") está nas 3 páginas de painel.
- Sem preço e sem estoque: 🟢. A busca por "R$" com número, "estoque" e "saldo" no texto dos 3 PDFs não acha nada.

### Notas
- A nota do §6 (a página da Lâmpadas Moto) foi para a fila do Alexandre como layout (R-20261122-112104-po).

**Resultado da entrega final: LIBERADO** para seguir ao `revisor-codigo`.
