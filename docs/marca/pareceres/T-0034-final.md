# T-0034 · Parecer de marca da versão final da aba Estoque

| Campo | Valor |
|---|---|
| Tarefa | T-0034, versão final (simulação aprovada pelo Alexandre: colunas "Filial" e "Nº filial" separadas, caixa "Somente produtos com estoque", "Mato Grosso", PPEDIDO = "Custo do produto") |
| Revisor | design-de-marca |
| Data | 24/11/2026 (Manaus) |
| O que foi visto | Tela: `origin/web-site/T-0034-estoque` (`7a4a9df`): `site/estoque/` (index.html, estoque.css, estoque.js), `site/conta.js`, `site/admin/usuarios/usuarios.js`, `site/styles.css` e `site/admin/admin.css`. Servidor: `origin/integracao-placas/T-0034-estoque` (`ced89ab`), `servicos/login/estoque.mjs` (rótulos) e `server.mjs` (mensagens). Os 14 prints de `testes/prints/T-0034-final/` em `origin/testes/T-0034-estoque` (`cee5ec9`) |
| Base de comparação | `docs/marca/manual.md`: "Nome da marca" (decisão 10 a) e "Cores de estado" (decisão 8 a). O resto ainda é levantamento "a aprovar". O parecer da simulação (`docs/marca/pareceres/T-0034-simulacao.md`, MC-0029 e MC-0030, no branch `design-de-marca/T-0034-simulacao`) |
| Parecer | **LIBERADO COM AJUSTES.** Um achado baixo da tarefa (MC-0031, 1 linha) e um baixo anterior à tarefa, que vai para a fila (MC-0032). Nenhum segura |

A tela é interna (admin e quem tem "Pode ver o estoque"). Leitura e layout são do `designer-ux`; repetição é do
`corretor-redundancias`. Aqui ficam marca, voz e as regras do repositório.

## 1. Achados da simulação

- **MC-0029 (concordância na nota "estoque são fictícios"): fechado.** A nota da simulação saiu inteira; a tela final
  não tem nota de amostra.
- **MC-0030 (404 com a marca na simulação): fechado.** O 404 final (`cliente-404-1366.png`) é a página simples do
  `HTML_SIMPLES` do `server.mjs`: só "Não encontrado.", a mesma das outras páginas protegidas. É o que a marca pediu:
  não confirma que a aba existe e não promete um 404 com a marca.

## 2. Simulação fora, título certo

- Nenhum "SIMULAÇÃO", faixa vermelha, selo flutuante ou `--erro` decorativo em `site/estoque/` nem no `conta.js`
  (busca por "simula" sem resultado; prints sem selo).
- `<title>Estoque · Catálogo online BAP</title>`, no padrão de "Entrar · Catálogo online BAP".
- O `--erro` só aparece na caixa de erro (503 e falha de carga), com o `--erro-claro` de fundo: é o papel aprovado
  (decisão 8 a).

## 3. O que está certo

- **Logo e favicon:** `logo_branco.png` no topo escuro, `logo_escuro.png` no favicon, como no resto do site. No botão
  da conta e no menu, o logo inteiro da BAP para quem não tem logo própria (decisão 7 a).
- **Cor:** só variáveis do `:root`, nenhum hex novo. A caixa de marcar usa `accent-color: var(--verde-esc)`. A linha
  sob o mouse usa o `--verde-claro`. "Mostrar mais 50" e "Tentar de novo" são os botões do site, sem variação nova.
- **"Sem estoque":** continua na `.tag` neutra (cinza, contorno neutro), sem vermelho e sem verde, no computador e no
  cartão do celular. Estoque vazio (sem número) sai como "—", diferente de zero; está certo.
- **"Vê o estoque":** na lista de "Criar usuários", também na `.tag` neutra, ao lado do "Ativo" verde e do "Admin"
  escuro. Não compete com o status, e o admin não ganha a etiqueta (ele vê sempre). Par certo com a caixa "Pode ver o
  estoque" da janela de criar e editar.
- **Ícone de caixa no menu da conta:** mesmo traço, tamanho e cor dos outros ícones do menu (pessoa, PDF, chave,
  sair). É uma caixa genérica, sem símbolo de terceiros. "Estoque" fica no alto, fora do grupo "Administração": certo,
  porque o vendedor também vê. O mesmo rótulo "Estoque" no menu de cima (computador) e no menu da conta (celular).
- **Grafia:** "BAP AUTOPARTS" no rodapé e na empresa do admin (decisão 10 a). "Sobre a BAP" no menu.
- **Voz:** "Estoque", "Posição de 24/11/2026 às 09:30", "Buscar", "Filial", "Todas", "Somente produtos com estoque"
  (texto aprovado na simulação), "50 de 120", "Carregando o estoque…", "Mostrar mais 50", "Nada encontrado para
  “…”" (com "em Belém" quando há filial), "Estoque indisponível no momento. Tente de novo.", "+ Detalhes" /
  "− Menos detalhes" e "Pode ver o estoque". Curtos, diretos, no jeito do vendedor. Os nomes das cidades com
  maiúscula e acento ("Mato Grosso", "São Luís") ficaram melhores que o texto cru da planilha.
- **Preço e estoque:** o vendedor recebe só Filial, Nº filial, Código, Descrição, Fornecedor e Estoque (lista branca
  `COLUNAS_VENDEDOR` no servidor). Nada de estoque no `site/data/` (a página não traz dado; tudo vem da
  `/api/estoque`, que confere o usuário).
- **Marca de terceiros:** nenhuma.

**Poppins nos prints:** os prints finais saem em fonte de reserva porque o teste responde o Google Fonts vazio
(`testes/estoque-t0034.mjs`, linha 182: "Nenhuma rede de fora"). O código carrega a Poppins 400 a 700 como as
outras páginas, então a tela no ar sai em Poppins. Não é achado. [SUPOSIÇÃO: se o Alexandre for ver estes prints,
avisar que a fonte do print não é a do site.]

## 4. Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0031 | Erro de carga (não 404 nem 503); `site/estoque/estoque.js`, linha 78 | voz | manual a aprovar (voz) | baixa | O site diz "Não foi possível…" em 12 mensagens de erro (`usuarios.js`, `entrar.js`, `pdfs.js`, `app.js`, `server.mjs`). Antes → depois: `"Não deu para carregar o estoque."` → `"Não foi possível carregar o estoque."` (o "Tente de novo." que vem depois fica) | `web-site` |
| MC-0032 | Campo "Buscar" com texto, 1366 px (`busca-vazia-1366.png`): o "×" de limpar sai azul. É o botão padrão do navegador em `input[type="search"]`, e já aparece na busca de "Criar usuários" e na busca do catálogo (`app.js`), então é **anterior à tarefa** | cor | manual a aprovar (paleta: só cores da paleta) | baixa | Para a fila, não segura: no `site/styles.css`, esconder o botão nativo (`input[type="search"]::-webkit-search-cancel-button { -webkit-appearance: none; }`) e, se for preciso limpar, usar um botão próprio em `var(--texto-2)`. A decisão de ter ou não o botão de limpar é do `designer-ux` | `web-site` (decisão: `designer-ux`) |

## 5. Para a entrega

- O MC-0031 pode entrar neste PR (1 linha). O MC-0032 vai para a fila, junto das outras buscas do site.
- Depois do merge, confiro no ar (1366 e 390 px) a Poppins na aba Estoque e no menu da conta.

## 6. Situação (25/11/2026)

- MC-0031 feito; MC-0032 na fila; Poppins a conferir no ar; entrega nos PRs #194, #195 e #196 (main `7b4ccfd`).
