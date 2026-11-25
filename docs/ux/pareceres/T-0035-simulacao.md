# T-0035 · Parecer de UX da simulação (filtros Categoria, Sistema e Família na aba Estoque)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 25/11/2026 (Manaus) |
| O que foi revisto | Tarefa: `origin/po/T-0035-filtros:.coord/tarefas/T-0035.md`. Tela: `origin/web-site/T-0035-filtros`, `4c6d8d2` (`site/estoque/index.html`, `estoque.css`, `estoque.js`). Servidor: `origin/integracao-placas/T-0035-filtros`, `f19931f` (`servicos/login/estoque.mjs`: `cascata()` e `consultar()`). Prints: `origin/testes/T-0035-filtros`, `748a963`, os 9 de `testes/prints/T-0035/`, com dados sintéticos |
| Pedido | "Coloque o filtro por sistema, familia, categoria." (24/11/2026 21:20) |
| Resultado | **LIBERADO COM AJUSTES**: nenhum 🔴; 2 🟡 na tela (U1 e U2), a corrigir antes de os prints irem ao Alexandre, e 1 pergunta ao Alexandre (U3). As 4 decisões do `web-site` estão aprovadas |

**Exceção autorizada de "sem estoque":** a aba é interna (T-0034, com o "autorizo" do Alexandre). Este parecer não repete nenhum valor de estoque, preço ou custo.

## 1. Hierarquia, toque e 3 toques

Prints: `vendedor-1366-sem-filtro.png`, `admin-1366-sem-filtro.png`, `*-categoria-sistema.png`, `*-390-filtros-fechado.png`, `*-390-filtros-aberto.png`.

- 🟢 **Computador.** A 1ª linha tem Buscar, Filial, Categoria, Sistema e Família; a 2ª, a caixa "Somente produtos com estoque" e o "Limpar filtros", que só aparece com filtro ativo. A ordem segue a cascata, da esquerda para a direita. No vendedor (1200 px) e no admin (largura do site), tudo cabe numa linha, e a tabela começa na mesma altura de antes, mais uma linha.
- 🟢 **Celular, fechado.** Busca, caixa e o botão "Filtros". A lista começa mais acima que na T-0034, porque a Filial saiu da frente.
- 🟢 **Toque.** Os selects têm 44 px; o botão "Filtros" tem 44 px; o "Limpar filtros" tem 44 px de altura (`.limpar-tudo`, `styles.css:156`).
- 🟢 **3 toques.** Filtrar por categoria no celular leva 2 toques ("Filtros" e Categoria), mais a escolha. No computador, 1 toque e a escolha.
- 🟢 **Cascata.** Escolher a Categoria zera Sistema e Família, e escolher o Sistema zera a Família (`estoque.js`, `change` de `cat` e `sis`). As opções chegam do servidor já limitadas. Um nível sem opção fica desabilitado, com o fundo `--fundo`.
- 🟢 **Vazio.** `vazio-filtros-1366.png`: "Nada encontrado para “xyzsemnada” com os filtros escolhidos." É uma frase e diz que os filtros contam.
- 🟢 **Movimento.** A seta gira em 150 ms e respeita o `prefers-reduced-motion`.

## 2. Decisões do `web-site`

| Decisão | Parecer |
|---|---|
| A Filial também entrou no "Filtros" do celular | 🟢 **Aprovo.** Os quatro são filtros da mesma natureza, e o "(N)" conta os quatro. A busca e a caixa ficam à vista, que é o que o vendedor usa a toda hora. A lista sobe. |
| O Sistema usa "Todos" | 🟢 **Aprovo.** É a concordância certa ("todos os sistemas"); Filial, Categoria e Família ficam com "Todas". |
| "Limpar filtros" zera só os 4 selects | 🟢 **Aprovo.** A busca tem o seu "×" e a caixa é um liga-desliga à vista; o botão faz o que o nome diz. Depois de limpar, o foco vai para o "Filtros" (celular) ou para a Filial (computador): está certo. |
| Busca com 320 px e Filial com 220 px no computador | 🟢 **Aprovo.** O placeholder "Código, fornecedor ou descrição" cabe inteiro e as 5 caixas ficam numa linha em 1366 px. |

## 3. Pontos do `testes`

- 🟢 **1º cartão em y = 756 com os filtros abertos em 390 px.** O topo do cartão (filial, código e estoque) ainda aparece antes da dobra de 844 px, e o painel só abre quando o usuário pede (começa fechado). Com um filtro por linha, o nome inteiro fica à vista, e os nomes da planilha são longos ("Peças linha moto", "Filtros de óleo"). Duas colunas em 390 px cortariam esses nomes. **Fica como está.**
- 🟡 **U1. A seta do botão "Filtros".** Fechada, a seta tem só 8 px; aberta, vira um gancho torto ("⌐") ao lado do "(2)" (`*-390-filtros-aberto.png`). O motivo é a borda girada com `margin-top` (`estoque.css`, `.est-bt-filtros::after`). Use o mesmo chevron em SVG do botão da conta (`SETA` de `site/conta.js`, 18 px, traço 2,4), girando 180° quando aberto. Assim fica um só desenho de seta no site. Dono: `web-site`.

## 4. Ordem do teclado

- 🟡 **U2. No computador, o Tab não segue a ordem da tela.** O HTML vem nesta ordem: busca, caixa, "Filtros", "Limpar filtros", Filial, Categoria, Sistema, Família. O CSS (`order`) mostra outra: busca, Filial, Categoria, Sistema, Família, caixa, Limpar. Quem usa teclado salta da busca para a caixa e o Limpar, e só depois volta aos selects. A ordem do HTML deve ser a mesma da tela nas duas larguras, sem `order`. Sugestão:
  - HTML: busca, botão "Filtros", painel (Filial, Categoria, Sistema, Família), caixa, "Limpar filtros";
  - computador: a 1ª linha fica igual, e a 2ª tem a caixa e o Limpar;
  - celular: busca, "Filtros", o painel (quando aberto), a caixa e o Limpar. O "Limpar filtros" pode ir dentro do painel, no fim. A caixa fica logo abaixo do botão quando o painel está fechado.

  Dono: `web-site`.

## 5. Para o Alexandre (pelo `po`, junto com a simulação)

- 🟡 **U3. Caixa alta nos nomes dos filtros.** As opções vêm da planilha em caixa alta ("SUSPENSÃO", "ARREFECIMENTO", "MOTOR"), e um select inteiro assim fica pesado. Os nomes da planilha já trazem acento ("FILTRAÇÃO", "ÓLEOS DE MOTOR"), então dá para mostrar só a 1ª letra maiúscula ("Suspensão", "Filtros de óleo"), como já foi feito com as cidades na T-0034.
  - **Recomendo a conversão.**
  - Ela deve ser feita **no servidor**, para valer igual no select e nas colunas Categoria, Sistema e Família do admin.
  - Precisa de uma lista curta de siglas que ficam em maiúscula [SUPOSIÇÃO: há siglas como ABS; o `integracao-placas` confere na planilha].
  - Como muda o texto da planilha na tela, a decisão é do Alexandre. Pergunta: "Os nomes de Categoria, Sistema e Família aparecem como na planilha (SUSPENSÃO) ou com só a 1ª letra maiúscula (Suspensão)?"
  - Dono, se for aprovado: `integracao-placas` (`estoque.mjs`, o mapa `nomes`).

## Donos

| Achado | O quê | Dono |
|---|---|---|
| U1 | Seta do "Filtros" com o chevron SVG da conta | `web-site` |
| U2 | Ordem do HTML igual à da tela (Tab) | `web-site` |
| U3 | Caixa alta nos nomes dos filtros: pergunta ao Alexandre | `po`; se aprovado, `integracao-placas` |

## Reteste

Depois de U1 e U2: `vendedor-390-filtros-aberto.png`, `vendedor-390-filtros-fechado.png` e `vendedor-1366-categoria-sistema.png`, mais a ordem do Tab conferida pelo `testes` em 1366 e 390 px.
