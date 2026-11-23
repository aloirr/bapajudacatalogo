# T-0032 · Parecer de UX da página /admin/pdfs/ (seção Treinamentos e 11 cartões novos)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 14:25 (Manaus) |
| O que foi revisto | O branch `web-site/T-0032-admin-treinamentos`, head `0d6556f6f7549e90c2394e9ff00f1e3021e804ea` (diff de `site/admin/pdfs/pdfs.js` e `admin.css`), e os prints de antes e depois em 1366 e 390 px de `sim-T-0032-admin/`. A lista do servidor (`integracao-placas/T-0032-materiais`, `6226033`) foi conferida pela ordem dos cartões nos prints |
| Pedido | T-0032, onda 1: os 7 portfólios por linha e os 4 treinamentos no admin |
| Resultado | **VOLTA PARA AJUSTE**: 2 🟡, sem 🔴 |

Voz, texto e o nome da página ficam com o `design-de-marca` (ver o parecer de marca da T-0032). Sem preço e sem estoque: 🟢.

## 1. O que está 🟢
- 🟢 **3 seções com o mesmo desenho:** título da seção, grade de 3 colunas e o mesmo cartão. "Treinamentos" fica por último, depois dos materiais de cliente, o que faz sentido para quem baixa material para o cliente.
- 🟢 **Cartão com 2 botões:** "Baixar PDF" é o principal (cheio) e "Baixar PowerPoint" o secundário (contorno), no mesmo cartão e na mesma ordem do cartão de Lubrificantes. Há um só principal por cartão.
- 🟢 **Arquivo que falta:** o botão desabilitado fica claro (verde-claro sem contraste de ação), e cada arquivo do par tem a sua frase. Até as entregas entrarem, é o esperado.
- 🟢 **390 px:** nada rola para o lado. Os 2 botões ficam um embaixo do outro, com a largura toda e altura de cerca de 48 px. O título de 2 linhas ("Treinamento · Lubrificantes") não empurra o ícone.
- 🟢 **Acessibilidade:** o nome do arquivo vai no texto escondido do botão ("Baixar PDF · Treinamento · Baterias"); nada muda no h1 nem nos rótulos.

## 2. Os ajustes
### 🟡 1. Os 8 portfólios ficam separados
- Em "Apresentações e materiais", a ordem é: Portfólio de Produtos (o geral), Lubrificantes e Químicos, Kit Filtros e, depois, os 7 "Portfólio · Linha…".
- Quem procura um portfólio acha o geral, passa por 2 materiais de outro tipo e só então acha os 7 por linha. São 10 cartões nessa seção, e em 390 px a página tem cerca de 5.300 px de altura.
- **Pedido** (a ordem vem da lista do servidor, do `integracao-placas`; o grupo é do `web-site`): os 8 portfólios juntos e seguidos, com o geral primeiro. Por exemplo, uma seção "Portfólios" própria, ou os 8 no começo de "Apresentações e materiais", antes de Lubrificantes e Kit Filtros.

### 🟡 2. A mesma frase em 4 cartões, e a mesma palavra no título e na seção
- Os 4 treinamentos repetem "…para os vendedores: em PDF para ler, em PowerPoint para apresentar." O título repete "Treinamento ·" dentro da seção "Treinamentos". Os 7 portfólios repetem "…por sistema e família."
- A frase de uso deixa de dizer o que diferencia o cartão (uma informação, um lugar).
- **Pedido:** o que é comum vai uma vez, no subtítulo da seção (por exemplo, "Em PDF para ler, em PowerPoint para apresentar"). O cartão fica com o nome ("Mecânica Básica", "Linha Leve") e, se precisar, o que só ele tem. O texto final é da marca.

## 3. O título da página
- **Recomendação de UX:** o nome tem de ser o mesmo nos 4 lugares: o item do menu da conta (`site/conta.js`), a trilha, o h1 e o `<title>` (`site/admin/pdfs/index.html`). Se mudar num, muda nos 4, no mesmo PR.
- Pelo uso, "materiais" já cobre treinamento, e um nome curto cabe melhor no menu da conta em 390 px. Se a marca escolher "Catálogos, materiais e treinamentos", que confira a quebra de linha no menu e no h1 em 390 px.
- A escolha do texto é do `design-de-marca`.

## 4. Notas (não seguram)
1. **O ícone do cartão diz "PDF"** também no par PDF + PowerPoint. Já era assim no cartão de Lubrificantes.
2. **No cartão do par sem os 2 arquivos**, saem 2 frases ("O PDF não está disponível agora." e "O PowerPoint…"). Uma só ("O PDF e o PowerPoint não estão disponíveis agora.") ocuparia menos espaço. É temporário, até as entregas.

**Resultado: VOLTA PARA AJUSTE** (2 🟡). Depois do ajuste, confiro os prints de 1366 e 390 px.
