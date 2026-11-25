# T-0034 · Parecer de marca da simulação da aba Estoque (admin, vendedor e cliente)

| Campo | Valor |
|---|---|
| Tarefa | T-0034, passo 1: simulação da tela (aba "Estoque", só para o admin e para o bap.vendedor; decisões 1 a 5 do Alexandre de 24/11 17:20) |
| Revisor | design-de-marca |
| Data | 24/11/2026 (Manaus) |
| O que foi visto | O branch `testes/T-0034-simulacao` (head `d1284c698e3430a13e58ffc0658f917d5a6cff77`): `servicos/login/simulacao/estoque.html`, `estoque.css`, `estoque.js` e `amostra.js`; os prints de `testes/prints/T-0034/` (admin, vendedor e cliente em 1366 e 390 px, admin 390 com os cartões abertos e vendedor com a busca "manaus"). Para comparar: o `site/styles.css` (tokens, `.tag`, `.pg-cab .so-admin`) e o `erro()`/`HTML_SIMPLES` do `servicos/login/server.mjs` |
| Base de comparação | `docs/marca/manual.md`: "Nome da marca" (decisão 10 a), "Cores de estado (só no site)" (decisão 8 a). O resto (logo, paleta, tipografia, voz) ainda é levantamento "a aprovar" |
| Parecer | Simulação: **LIBERADO COM AJUSTES** para o PO levar ao Alexandre. Dois achados baixos (MC-0029 e MC-0030), nenhum segura. O MC-0029 é de 1 linha e vale corrigir antes de mandar |

A tela é **interna** (admin e vendedor), não é material para cliente. O "autorizo" do Alexandre (24/11 17:20) libera o
estoque nessa aba; para o vendedor, sem preço, custo e markup. Leitura, layout e rótulos de coluna são do
`designer-ux` (`docs/ux/pareceres/T-0034-simulacao.md`); aqui ficam a marca, a voz e as regras do repositório.

## 1. O que está certo

- **Logo:** `logo_branco.png` no topo escuro, o mesmo do site, sem esticar, recolorir nem cortar; ao lado, "CATÁLOGO
  ONLINE", igual às outras páginas. O favicon é o `logo_escuro.png`, o mesmo do `site/index.html`.
- **Cor:** o `estoque.css` só usa variáveis do `:root` (nenhum hex solto). A faixa do topo e o rodapé são os do site.
  O selo "Vendedor: sem preço, custo e markup" / "Admin: todas as colunas" é o `.so-admin` que o admin já usa:
  `--escuro` sobre `--verde`, cerca de 7,6:1. A linha sob o mouse usa o `--verde-claro`, no papel de área grande.
- **"Sem estoque":** a `.tag` neutra (cinza, contorno neutro), sem vermelho e sem verde. Está certo: estoque zero não
  é erro, e o vermelho fica para erro e desativar (decisão 8 a). A palavra é melhor que um "0" solto e é o jeito de o
  balconista falar. No celular, "12 un." deixa claro que é quantidade.
- **Tipografia:** só Poppins, nos pesos do site (400, 500, 600 e 700). O código do produto em 600, como o código BAP
  nas outras telas. O `<code>` da nota do 404 é monoespaçado, mas só existe na simulação.
- **Grafia:** "© 2026 - BAP AUTOPARTS - Componentes de qualidade - Todos os direitos reservados." no rodapé, certo
  (decisão 10 a). "Sobre a BAP" no menu e "BAP Central" na linha da posição, como nas outras telas internas.
- **Voz:** "Estoque", "Posição de 19/11/2026 às 16:48 · fonte: BAP Central", "Buscar", "Cidade / filial", "Todas",
  "21 de 21 linhas", "Nada encontrado. Confira o código ou tente outra cidade." e "Ver as outras 20 colunas": diretos,
  curtos, no jeito do vendedor. "Markup" fica: é o nome da coluna na BAP Central e a tela é interna.
- **Marca de terceiros:** nenhuma. Os fornecedores da amostra ("BAP LUB", "BAP MOTOS", "BAP FILTROS", "BAP") são dado
  da BAP Central, em texto, na fonte e na cor do catálogo.
- **Preço e estoque:** a visão vendedor não mostra preço, custo, markup, tabela nem PPEDIDO (5 colunas). A visão
  cliente não mostra a aba no menu e cai no 404. A página está fora do `site/` e o servidor de login não a serve.

## 2. O selo vermelho "SIMULAÇÃO · valores fictícios"

**Aceito, só na simulação.** A faixa do topo, o selo flutuante e a etiqueta "SIMULAÇÃO" usam o `--erro`, que pela
decisão 8 a é só para erro e para o botão de desativar. Aqui o vermelho cumpre uma função de alerta: deixa claro para o
Alexandre que os números são de mentira e que a tela não é a final. Nessa função, o uso é aceitável.

Condição para a versão final: **nenhum** destes elementos entra na aba de verdade, nem o `--erro` fora de mensagem de
erro: `.sim-faixa`, `.sim-selo`, `.est-sim-nota` (com a `tag-escura` "SIMULAÇÃO") e o "(SIMULAÇÃO)" do `<title>`. O
título final fica "Estoque · Catálogo online BAP", no padrão de "Entrar · Catálogo online BAP". Vou conferir no
parecer da entrega.

O selo flutuante cobre o código de uma linha (1366 px, admin e vendedor) e um cartão (390 px). Isso é de leitura e
fica com o `designer-ux`; não catalogo aqui.

## 3. Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0029 | Visão vendedor, 1366 e 390 px, nota sob a tabela; `servicos/login/simulacao/estoque.html`, linha 64 | voz | manual a aprovar (voz) | baixa | Na visão vendedor, a frase fica "…cidade e filial são reais; estoque são fictícios." (erro de concordância, num texto que vai ao Alexandre). Antes → depois: "são reais; estoque<span class="so-admin-txt">, preço, custo, markup, tabela, PPEDIDO e sucata</span> são fictícios." → "são reais; os números de estoque<span class="so-admin-txt">, preço, custo, markup, tabela, PPEDIDO e sucata</span> são fictícios." (vale nas duas visões) | `integracao-placas` |
| MC-0030 | Visão cliente, 1366 e 390 px (`cliente-1366.png`, `cliente-390.png`); `estoque.html`, linhas 44 a 48 | aplicação | manual a aprovar (aplicações: site) | baixa | A simulação mostra o 404 dentro do topo e do rodapé da BAP, com o "404" em `--erro` e em Poppins. O 404 de verdade (`HTML_SIMPLES` do `server.mjs`, linha 288) é uma página branca, só "Não encontrado.", em `sans-serif`, sem logo. Para a marca, a página simples está certa aqui: é a mesma das outras páginas protegidas, e não confirma que a aba existe. A simulação não deve prometer ao Alexandre um 404 com a marca que não vai existir. Antes → depois: trocar o bloco `#sem-acesso` por uma frase da faixa de simulação, "Visão cliente: o servidor responde a página simples de 404 ('Não encontrado.'), a mesma das outras páginas protegidas", ou pôr o print do 404 real ao lado. Não pedir 404 com a marca na versão final: seria novidade sem motivo de negócio | `integracao-placas` (prints novos: `testes`) |

## 4. Para a entrega (o que vou conferir)

- Sem nenhum elemento de simulação e sem o `--erro` fora de erro (seção 2).
- A mesma `.tag` neutra para "Sem estoque", o mesmo selo `.so-admin` e só tokens do `:root`, sem hex novo.
- O vendedor sem preço, custo e markup na tela **e** na resposta da API (critério de aceite; a conferência é do
  `testes`), e nenhum dado de estoque no `site/` nem no `produtos.json`.
- O item "Estoque" no menu da conta no celular é [SUPOSIÇÃO] do autor (o `estoque.css`, linhas 76 e 77): a decisão é
  do `designer-ux`; para a marca, vale o mesmo rótulo "Estoque" nos dois lugares.
