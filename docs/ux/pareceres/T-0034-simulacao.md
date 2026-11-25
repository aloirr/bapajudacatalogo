# T-0034 · Parecer de UX da simulação (aba Estoque: admin, vendedor e cliente)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 24/11/2026 (Manaus) |
| O que foi revisto | Branch `testes/T-0034-simulacao`, head `d1284c698e3430a13e58ffc0658f917d5a6cff77` (contém a simulação do `integracao-placas`, `ce31950`): `servicos/login/simulacao/estoque.html`, `estoque.css`, `estoque.js`, `amostra.js`; os 9 prints de `testes/prints/T-0034/` (admin 1366 e 390, admin 390 com `&abrir=1`, vendedor 1366 e 390, vendedor `&q=manaus` 1366 e 390, cliente 1366 e 390); `site/conta.js` e os tokens de `site/styles.css` para comparar |
| Pedido | T-0034 (pedido literal de 24/11/2026 17:10; decisões 1 "autorizo", 2a, 3a, 4b, 5a) |
| Resultado | **LIBERADO COM AJUSTES**: sem 🔴; 4 🟡 a corrigir **na simulação, antes de os prints irem ao Alexandre** (A1 a A4) e 9 🟡 que entram na especificação da versão final (B1 a B9) |

**Exceção autorizada de "sem estoque":** esta aba é interna, com o "autorizo" do Alexandre (24/11 17:20), e só aparece para o admin e para quem tem a permissão nova. Na visão cliente não aparece estoque nenhum (🟢). Este parecer não repete nenhum valor de estoque, preço, custo ou markup, nem os fictícios.

A voz, a grafia da marca e as cores ficam com o `design-de-marca`. Aqui falo de hierarquia, leitura, toque, consistência e estados.

## 1. Hierarquia, legibilidade e 3 toques

Prints: `vendedor-1366.png`, `vendedor-390.png`, `admin-1366.png`, `admin-390.png`, `vendedor-q-manaus-390.png`.

- 🟢 **Hierarquia.** Título "Estoque", a posição (data e hora) logo abaixo, e a busca com o filtro de cidade em seguida. No celular (390 × 844) a busca fica na metade de cima e o 1º cartão começa antes da dobra. Código e estoque no alto do cartão, que é o que o vendedor procura primeiro.
- 🟢 **Toque.** Campo de busca e seletor com 44 px; botão do cartão do admin com 44 px e largura toda (`estoque.css:72`).
- 🟢 **Contraste.** Texto em `--texto` e `--texto-2` (5,36:1 ou mais); a etiqueta "Sem estoque" usa `--texto-2` em `--fundo`, acima de 4,5:1. Nada depende só de cor.
- 🟢 **3 toques.** Computador: "Estoque" no menu (1), digitar (2), ler a linha. Celular, com o B1: abrir o menu da conta (1), "Estoque" (2), digitar (3). O resultado aparece sem precisar abrir o cartão.
- 🟢 **Celular.** Em 390 px nada rola para o lado nos prints.
- 🟡 **B2. Texto que explica o sistema no cabeçalho.** A etiqueta verde "Admin: todas as colunas" / "Vendedor: sem preço, custo e markup" (`estoque.html:54`, `estoque.js:31-32`) e o "· fonte: BAP Central" (`estoque.html:53`) explicam o funcionamento e não ajudam a agir. Na simulação a etiqueta pode ficar (ajuda o Alexandre a ver qual visão está olhando, mas a faixa vermelha já faz isso); **na versão final, sai**. Linha final: "Posição de 19/11/2026 às 16:48".
- 🟡 **B3. Alinhamento no admin, 1366 px** (`admin-1366.png`, topo). O cabeçalho fica na largura de 1200 px (`styles.css:743`) e a barra de busca e a tabela na de 1880 px (`estoque.css:19`, `.pg-larga`): o título começa em ~99 px e a busca em 16 px. No vendedor está alinhado. Recomendo que, no admin, o `.pg-cab-in` use a mesma largura da página (`--largura`), para a borda esquerda ser uma só.
- 🟡 **B4. Placeholder cortado no celular** (`admin-390.png`, `vendedor-390.png`): "Código BAP, código do fornecedor ou desc…". Texto final: **"Código, fornecedor ou descrição"** (cabe em 390 px). A cidade tem o seletor ao lado, não precisa estar no placeholder.

## 2. Admin no celular: cartão com 5 + "Ver as outras 19 colunas"

Prints: `admin-390.png`, `admin-390-abrir.png`.

- 🟢 **A ideia está boa**: o cartão fechado é igual ao do vendedor (mesmo componente, mesma ordem) e o resto fica a um toque, dentro do próprio cartão, sem tabela que rola para o lado.
- 🟡 **B5. Rótulo e ordem do que abre.**
  - "Ver as outras 19 colunas" fala de tabela dentro de um cartão. Use o rótulo que o site já tem para a mesma ação na janela do produto: **"+ Detalhes"** e, aberto, **"− Menos detalhes"**. Mesmo componente, mesmo rótulo.
  - DATA e HORA se repetem em cada cartão (e em cada linha no computador), e já estão no cabeçalho ("Posição de …"). Uma informação, um lugar: **saem das colunas do admin** (ficam 22 na tela e 17 no "+ Detalhes"). O admin continua vendo tudo: a data e a hora estão no alto.
  - Ordem do que abre: primeiro o que o admin usa para decidir (Preço capital, Preço interior, Custo total, Markup capital, Markup interior, Tabela capital, Tabela interior, Pedido pendente), depois os códigos (ID do produto, Cód. fornecedor, Filial CD, Origem do custo) e por fim a classificação (Categoria, Sistema, Família, Linha, Sucata). A mesma ordem vale para as colunas no computador (B6). [SUPOSIÇÃO: o admin consulta preço e custo antes dos códigos internos; confirmar com o Alexandre quando ele vir a simulação.]
  - O botão com borda verde em todos os cartões pesa na lista. Basta o estilo neutro (`bt-claro` sem a borda verde, ou link com seta), mantendo 44 px.
- 🟡 **ID do produto quebra no hífen** (`admin-1366.png` e `admin-390-abrir.png`: "…ERW-" numa linha e "37" na outra). Parece que o "37" é outro dado. No computador, `white-space: nowrap`; no celular, quebra em qualquer ponto (`overflow-wrap: anywhere`), sem preferir o hífen. Entra no B6.

## 3. Onde fica "Estoque" no celular

- 🟡 **B1. Decisão: no menu da conta, em todas as larguras, e também no menu de cima só no computador.**
  - O menu de cima do celular só tem lugar para 3 itens (`estoque.css:76-78` já esconde "Estoque" abaixo de 640 px). O menu da conta (`site/conta.js:66-75`) já é onde ficam as áreas internas ("Criar usuários", "Catálogos, materiais e treinamentos"): é o lugar natural e o mesmo em qualquer tela.
  - Item **"Estoque"** com ícone (caixa ou prateleira, traço igual aos outros do `IC`), **logo abaixo do cabeçalho da conta, antes do grupo "Administração"**, fora dele (o vendedor não é admin e não vê esse grupo). Para o vendedor o menu fica: Estoque, separador, Trocar senha, Sair. Para o admin: Estoque, separador, Administração (Criar usuários, Catálogos…), separador, Trocar senha, Sair.
  - No computador o "Estoque" também fica no menu de cima (atalho de quem usa toda hora), como na simulação. É navegação, não informação repetida.
  - Quem implementa: `web-site` (`site/conta.js`, com a permissão vinda do `/api/eu`, que é do `integracao-placas`).
  - A simulação não tem o botão da conta: **na versão final, quero o print de 390 px com o menu da conta aberto** (vendedor e admin).

## 4. "Cidade / filial" numa coluna só (vendedor)

- 🟢 **Juntar está certo**: é um dado só para quem procura (onde a peça está), economiza uma coluna e, no celular, uma linha por cartão. Cidade em destaque e o número da filial pequeno ao lado.
- 🟡 **B7. Quebra irregular no admin 1366** (`admin-1366.png`): umas linhas mostram cidade e filial na mesma linha, outras em duas, conforme o nome da cidade. A célula deve ficar numa linha só (`white-space: nowrap` na célula toda, não só na cidade, `estoque.css:35`).
- 🟡 **B8. Caixa alta nas cidades.** "BELÉM", "BOA VISTA", "SÃO LUIS", "MATOGROSSO" fogem da regra (sem caixa alta feia em nome). São 7 valores fixos: um mapa de exibição resolve, inclusive o acento que falta ("São Luís") — Belém, Boa Vista, Macapá, Manaus, Santarém, São Luís e "Mato Grosso" [SUPOSIÇÃO: "MATOGROSSO" é a filial de Mato Grosso; o nome de exibição fica com o Alexandre pelo `po`]. Vale no seletor e na lista; a busca continua achando "manaus" e "MANAUS". **Descrição e fornecedor ficam como vêm do ERP**: o texto vem sem acento ("FILTRO OLEO…") e passar para minúscula pioraria ("Filtro oleo"); é texto interno que o vendedor compara com o sistema. Registro como exceção aceita.

## 5. Estoque 0 como "Sem estoque"; "un." no celular

- 🟢 **"Sem estoque"** na etiqueta neutra (`.tag`): texto, não só cor, e mais claro que um "0" solto. Mesma etiqueta no computador e no celular.
- 🟢 **"un." no celular**: no cartão não há cabeçalho de coluna, então a unidade diz o que é o número. No computador o cabeçalho "Estoque" já diz, e "un." sairia repetido em cada linha: está certo sem.

## 6. Pontos do `testes`

- 🟡 **A1. Selo fixo "SIMULAÇÃO" cobre conteúdo** (`estoque.html:76`, `estoque.css:11-12`). Nos prints de página inteira ele cai no meio da lista: em `vendedor-q-manaus-390.png` cobre o "Cidade / filial" do 2º cartão; em `admin-390-abrir.png`, o "Cód. fornecedor"; em `admin-1366.png` e `vendedor-1366.png`, o código de uma linha. A faixa vermelha do topo e a nota no fim da lista já marcam a simulação. **Tirar o `.sim-selo`** e refazer os prints (`testes`).
- 🟡 **A2. "estoque são fictícios"** (`estoque.html:64`, visão vendedor): concordância errada. Texto do vendedor: **"Amostra de 21 linhas. Código, descrição, fornecedor, cidade e filial são reais; o estoque é fictício."**
- 🟡 **A3. ORIGEM_CUSTO fora da nota do admin** e "PPEDIDO" com o nome interno, enquanto a coluna diz "Pedido pend.". Texto do admin: **"Amostra de 21 linhas. Código, descrição, fornecedor, cidade e filial são reais; estoque, pedido pendente, origem do custo, tabelas, preços, markup, sucata e custo são fictícios."**
- 🟡 **A4. Comentários com a conta errada.** Na tela são **24** colunas (25 do xlsx, com CIDADE e FILIAL_BAP juntas) e **19** no botão, mas os comentários dizem "25 colunas" (`estoque.css:45`, `estoque.js:2`, `estoque.js:42`) e "as outras 20" (`estoque.js:42`, `estoque.js:99`). Corrigir para 24 e 19 (ou 22 e 17, se o B5 tirar DATA e HORA já na simulação).

## 7. Para a versão final (especificação)

- 🟡 **B6. Colunas do admin no computador.**
  - Ordem igual à do B5 (o que decide primeiro), sem DATA e HORA.
  - **Barra de rolagem lateral alcançável.** Com 18.274 linhas, a barra de rolagem de lado da tabela (`estoque.css:29`) fica no fim da lista, longe da tela. A caixa da tabela deve ter altura máxima (`max-height: calc(100vh - <topo>)`), cabeçalho da tabela fixo (`position: sticky; top: 0`) e a coluna Código parada, como já está (`estoque.css:49-51`). Assim a barra lateral fica sempre visível.
  - "Pedido pend." vira **"Pedido pendente"** (sem abreviação) [SUPOSIÇÃO: PPEDIDO é a quantidade em pedido pendente; confirmar pelo `po`].
  - **SUCATA** sai formatada como dinheiro (`estoque.js:46`, `DINHEIRO`). [SUPOSIÇÃO: pode ser quantidade ou indicador, não valor; confirmar pelo `po` antes de fixar o formato.]
- 🟡 **B9. Estados e volume** (não estão na simulação; entram na versão final):
  - **Carregando:** "Carregando o estoque…" no lugar da lista.
  - **Erro:** "Não deu para carregar o estoque. Tente de novo." com o botão "Tentar de novo" (o único principal da tela nesse estado).
  - **Vazio:** uma frase, no padrão do site: **"Nada encontrado para “<termo>”."**; com cidade escolhida, "Nada encontrado para “<termo>” em <Cidade>." (hoje: "Nada encontrado. Confira o código ou tente outra cidade.", `estoque.js:90`).
  - **Volume:** 18.274 linhas de uma vez travam o celular. A lista mostra as **primeiras 50** e, no fim, o botão secundário **"Mostrar mais 50"**; a busca e o filtro continuam valendo sobre tudo. O total: "50 de 18.274" em vez de "21 de 21 linhas" (sem a palavra "linhas", que é de planilha).
  - **Cliente:** a página 404 é a mesma das páginas do admin (`erro()` do server.mjs), com o seu `h1`; a nota explicativa da visão cliente (`estoque.html:47`) é só da simulação e não vai para a final.

## Donos dos ajustes

| Achado | O quê | Dono |
|---|---|---|
| A1 | Tirar o selo fixo | `integracao-placas` (`servicos/login/simulacao/`); depois o `testes` refaz os 9 prints |
| A2, A3 | Textos da nota da simulação | `integracao-placas` |
| A4 | Comentários 24/19 | `integracao-placas` |
| B1 | "Estoque" no menu da conta | `web-site` (`site/conta.js`), com a permissão no `/api/eu` do `integracao-placas` |
| B2 a B9 | Página final de estoque | `integracao-placas` (página servida em `servicos/login/`), com o CSS no padrão do `site/` (`web-site` aplica tokens se a página usar `site/styles.css`) |
| Perguntas | Nome de exibição de "MATOGROSSO"; o que é PPEDIDO e SUCATA; ordem das colunas do admin | `po` (ao Alexandre, junto com a simulação) |

## Reteste

Depois de A1 a A4: os 9 prints de novo (1366 e 390 px). Na versão final: os mesmos prints, mais o menu da conta aberto em 390 px (vendedor e admin), o estado carregando, o erro, o vazio e o "Mostrar mais 50".
