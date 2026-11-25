# T-0034 · Parecer de UX da versão final (aba Estoque)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 24/11/2026 (Manaus) |
| O que foi revisto | Tela: `origin/web-site/T-0034-estoque`, `7a4a9df` (`site/estoque/index.html`, `estoque.css`, `estoque.js`; `site/conta.js`; `site/admin/usuarios/usuarios.js`; as regras de `table.us`, `.us-barra` e `.opcao` levadas do `admin.css` para o `styles.css`). Servidor: `origin/integracao-placas/T-0034-estoque`, `ced89ab` (`servicos/login/estoque.mjs`: rótulos, ordem das colunas, nomes das cidades). Prints: `origin/testes/T-0034-estoque`, `cee5ec9`, `testes/prints/T-0034-final/` (14, com dados sintéticos) |
| Base | Parecer da simulação (`docs/ux/pareceres/T-0034-simulacao.md`, achados B1 a B9) e a aprovação do Alexandre com duas mudanças: Filial e Nº filial em colunas separadas; caixa "Somente produtos com estoque", que começa desmarcada |
| Resultado | **LIBERADO COM AJUSTES**: nenhum 🔴; 4 🟡 pequenos (F1 a F4) e 1 pedido de print (F5). B1 a B9 atendidos |
| Desfecho (25/11/2026) | F1 recusado pelo gerente: a ordem das colunas é decisão do Alexandre. F2 a F5 feitos. Entrega no ar nos #194, #195 e #196 |

**Exceção autorizada de "sem estoque":** a aba é interna, com o "autorizo" do Alexandre (24/11 17:20). Os prints usam dados sintéticos (`ZZT…`, "TESTE"). Este parecer não repete nenhum valor de estoque, preço, custo ou markup.

## 1. Achados da simulação (B1 a B9)

| Achado | Situação | Onde conferi |
|---|---|---|
| B1 · "Estoque" no menu da conta, antes e fora de "Administração"; no menu de cima só no computador | 🟢 | `menu-conta-admin-390.png`, `menu-conta-vendedor-390.png`; `conta.js` (+12 linhas); `styles.css` (`.menu .menu-estoque` some no celular) |
| B2 · Sem a etiqueta "Admin/Vendedor: …" e sem "fonte: BAP Central" | 🟢 | `index.html:36`: só "Posição de … às …" |
| B3 · Título alinhado com a busca no admin | 🟢 | `admin-1366.png` (título e busca a 16 px); `estoque.css:8` |
| B4 · Placeholder "Código, fornecedor ou descrição" | 🟢 | `admin-390.png`, `vendedor-390.png`: cabe inteiro |
| B5 · "+ Detalhes" / "− Menos detalhes", sem DATA e HORA, ordem pelo que decide, botão neutro | 🟢, com o F1 | `admin-390-detalhes.png`; `estoque.js:43`; `estoque.css:72-74`; `estoque.mjs:44-49` |
| B6 · Altura máxima, cabeçalho fixo, 1ª coluna parada, ID sem quebrar no hífen | 🟢 | `admin-1366.png`; `estoque.css:35-43, 66` |
| B7 · Filial numa linha só | 🟢 | `admin-1366.png`, `vendedor-1366.png`; `estoque.css:23` |
| B8 · Cidades sem caixa alta ("Belém", "São Luís", "Mato Grosso") | 🟢 | `estoque.mjs:56-59`; prints de 1366 e 390 |
| B9 · Carregando, erro, vazio, "Mostrar mais 50", contagem sem "linhas", 404 do cliente | 🟢, com F2 e F3 | ver §2 |

Rótulos do servidor: "Custo do produto" (PPEDIDO) e "Sucata" em dinheiro seguem a simulação aprovada (`estoque.mjs:15`). Não reabro.

## 2. Estados

- 🟢 **Carregando:** "Carregando o estoque…" no lugar da lista (`index.html:46`, `estoque.js:90`); no "Mostrar mais" o botão vira "Carregando…" e fica desabilitado (`estoque.js:89`). Não há print, porque o estado passa rápido; conferi pelo código.
- 🟢 **Vazio:** `busca-vazia-1366.png`: "Nada encontrado para “xyzsemnada”." Uma frase, sem contagem e sem botão. Com filial: "… em Belém." (`estoque.js:68-73`).
- 🟡 **Erro e 503** (`503-1366.png`, `503-390.png`): a caixa de erro e o botão principal "Tentar de novo" estão certos, e o botão é o único principal da tela. **F2:** a frase repete a ação do botão: "Estoque indisponível no momento. **Tente de novo.**" logo acima de "**Tentar de novo**". A ação já está no botão; a frase fica só com o problema: **"Estoque indisponível no momento."** (e, no erro genérico, "Não deu para carregar o estoque."). Dono: `web-site` (`estoque.js:80`, o 2º argumento de `F.frase`).
- 🟢 **Cliente (404)** (`cliente-404-1366.png`): é a mesma resposta seca das páginas do admin, que não revela que a aba existe. Mantém.

## 3. "Mostrar mais 50"

- 🟢 Botão secundário centralizado no fim da lista, largura toda no celular (`admin-1366.png`, `vendedor-390.png`). A contagem diz "50 de 120" e o botão some no fim (o teste confere 50, 100, 120).
- 🟡 **F3. O rótulo promete 50 quando faltam menos.** De 100 para 120 o botão diz "Mostrar mais 50" e traz 20. Use o número real: **"Mostrar mais N"**, com N = o menor entre 50 e o que falta (`estoque.js:47` e `:93`, a partir de `totalAtual - mostradas`). Dono: `web-site`.

## 4. Caixa "Somente produtos com estoque"

- 🟢 Começa desmarcada (`vendedor-1366.png`). Marcada (`com-estoque-marcada-1366.png`): some o "Sem estoque" e a contagem acompanha. Toda a linha do rótulo é clicável, com 44 px de altura (`styles.css`, `.opcao`). No computador fica na barra, ao lado da Filial; no celular ganha uma linha própria, abaixo da Filial.
- 🟢 O texto diz o que faz, sem jargão.

## 5. Cartões no celular

- 🟡 **F1. O cartão fechado do admin não é igual ao do vendedor.** No vendedor aparecem Filial, Nº filial, Código, Estoque, Descrição e **Fornecedor** (`vendedor-390.png`). No admin, o Fornecedor foi para dentro do "+ Detalhes", entre Markup interior e Tabela capital (`admin-390-detalhes.png`), porque o cartão mostra só as colunas até a de estoque (`estoque.js:49-51`) e no admin o FORNECEDOR vem depois de ESTOQUE (`estoque.mjs:46-48`). O pedido no B5 era o mesmo cartão fechado nas duas visões. Correção: em `COLUNAS_ADMIN`, pôr `'FORNECEDOR'` logo antes de `'ESTOQUE'`, como na lista do vendedor. No computador isso só desloca uma coluna, e a ordem passa a ser a mesma nas duas visões. Dono: `integracao-placas`.
- 🟡 **F4. Rótulo largo demais no vendedor.** O rótulo do cartão ganhou 142 px (`estoque.css:53`) para "Custo do produto" caber numa linha, mas isso vale também para o vendedor, que só tem "Fornecedor": o valor quebra em duas linhas em todo cartão (`vendedor-390.png`). Aplicar os 142 px só quando há colunas de valor (`body.est-larga table.est td[data-rot]::before`); no vendedor fica o padrão de 104 px da `table.us`. Dono: `web-site`.
- 🟢 "+ Detalhes" neutro, com 44 px e largura toda. Aberto, os rótulos ficam alinhados e os valores em dinheiro e markup formatados. O ID não quebra mais no hífen.
- 🟢 Em 390 px nada rola para o lado, e a busca, a Filial, a caixa e o 1º cartão ficam acima da dobra (`admin-390.png`, `vendedor-390.png`).

## 6. Menu da conta

- 🟢 Vendedor: Estoque, separador, Trocar senha, Sair. Admin: Estoque, separador, Administração (Criar usuários, Catálogos…), separador, Trocar senha, Sair. É o que o B1 pediu. O ícone (caixa) tem o mesmo traço dos outros.
- 🟢 Os 3 toques no celular: menu da conta (1), Estoque (2), digitar (3).
- 🟢 No computador, "Estoque" fica no menu de cima, entre Produtos e Sobre a BAP (`admin-1366.png`, `vendedor-1366.png`).

## 7. "Pode ver o estoque" na Criar usuários

- 🟢 Janela "Criar usuário" (`criar-usuario-caixa-1366.png`): a caixa vem depois da senha e antes da logo, com o mesmo componente `.opcao`, desmarcada de início (`usuarios.js`, `caixaEstoque("n-estoque", false)`). O admin não tem a caixa na edição, porque vê sempre. Está certo.
- 🟢 Lista (`criar-usuarios-lista-1366.png`): a etiqueta neutra "Vê o estoque" na coluna Situação, ao lado de "Ativo", com texto e sem depender de cor. Não aparece para o admin, que já tem "Admin".
- 🟡 **F5. Falta o print da Criar usuários em 390 px.** As regras da `table.us`, da `.us-barra` e da `.opcao` saíram do `admin.css` para o `styles.css`. Pelo diff, elas foram movidas sem mudar. Mesmo assim, a lista em cartões do celular é a parte que mais quebraria. Pedido ao `testes`: print `criar-usuarios-lista-390.png` e a janela com a caixa em 390 px, para comparar com o print do main.

## 8. Observação sem ajuste

- Nos prints a fonte não é a Poppins: a nuvem dos testes não baixa o Google Fonts. O CSS carrega a Poppins como nas outras páginas, então não há o que mudar.

## Donos dos ajustes

| Achado | O quê | Dono |
|---|---|---|
| F1 | `FORNECEDOR` antes de `ESTOQUE` em `COLUNAS_ADMIN` (`servicos/login/estoque.mjs:46-48`) | `integracao-placas` |
| F2 | Frase do erro e do 503 sem "Tente de novo." (`site/estoque/estoque.js:80`) | `web-site` |
| F3 | "Mostrar mais N" com o número real (`site/estoque/estoque.js:47, 93`) | `web-site` |
| F4 | Rótulo de 142 px só no admin (`site/estoque/estoque.css:53`) | `web-site` |
| F5 | Prints da Criar usuários em 390 px (lista e janela) | `testes` |

## Reteste

Depois de F1 a F4: `admin-390.png`, `admin-390-detalhes.png`, `vendedor-390.png`, `503-390.png` e um print do último "Mostrar mais" (ex.: "Mostrar mais 20"). E os prints do F5.
