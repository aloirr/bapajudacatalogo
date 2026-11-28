# Parecer de marca: T-0045, PR curto (RD-0767, RD-0769 e toque na trilha)

- **Agente:** design-de-marca
- **Data:** 27/11/2026 23:30 (hora de Manaus)
- **Branch avaliado:** `web-site/T-0045-rd0767`, head `9b334f2033c41310e5bcda4ff3cb0ccf85bbee13`, sobre o main `faadcc7` (#247)
- **Diff:** 4 commits, só `site/styles.css` (8 linhas entram, 4 saem)
- **Prints:** `bapajudacatalogo-recados/recados/anexos/T-0045/pr-curto/` (antes e depois em 1366, 390 e 1920 px: VEL7520 e BIE20014 no topo, no meio e no fim, e a janela do TER552120), mais `medidas-antes.json`, `medidas-depois.json` e `toque-trilha.json`
- **UX:** designer-ux 🟢 no `9b334f2`
- **Parecer:** **LIBERADO**. Nenhum achado.

## O que muda
1. **RD-0767:** sai o `min-height: 44px` do `.prod-topo`, e o `padding` da `.pagina-produto` passa de `16px 16px 40px` para `16px 16px 0`. A faixa da trilha vai de 44 px para 19,5 px, e o espaço entre a barra de botões e o rodapé vai de 96 para 56 px no computador e de 80 para 40 px no celular. Fica só o `margin-top` do `.rodape`, o mesmo das outras telas.
2. **RD-0769:** sai o `font-size: inherit` do `.aplic` no `@media print`, e o `overflow-x: clip` do `#app` passa a valer só em `@media screen`. O A4 sai igual ao do main (conferência do `web-site`: VEL7520, CXD13055 e CIL8548).
3. **Toque de 44 px na trilha:** um `::after` invisível nos links "Início", sistema e família, preso pela base, que termina no topo do `.prod` e não cobre a foto.

## Checklist
| Item | Resultado |
|---|---|
| A. Cor | Nenhuma cor nova e nenhum hex solto. A trilha continua em `--texto-2` e, no hover, em `--verde-txt`. O `::after` não tem fundo, borda nem sombra |
| B. Logo e favicon | Sem mudança. O logo do topo (46 px, versão para fundo escuro) e o do rodapé aparecem iguais nos prints antes e depois |
| C. Tipografia | Só Poppins, sem mudança de peso ou tamanho. A trilha continua no `--fs-tab` (13 px); a Aplicação na tela continua no `--fs-tab` e, no A4, os itens seguem em 7,5 pt |
| D. Grafismos | Sem mudança. O grafismo do rodapé está igual |
| E. Aplicações | **Espaços padrão:** a margem de 16 px nas laterais e no topo continua; entre a trilha e o bloco do produto ficam os 10 px de sempre; entre a barra e o rodapé, os 56 px (40 px no celular) do `margin-top` do `.rodape`, iguais aos das outras telas. **MENOS É MAIS:** a página fica 64 px mais curta, a faixa vazia do lugar antigo dos botões some, e o conteúdo continua na largura útil, sem rolagem para o lado (1366, 390 e 1920). **Botões embaixo e juntos:** a barra continua única e no rodapé (Copiar código, Salvar em PDF, Voltar), na página e na janela; a trilha é link de linha e pode ficar fora da barra. A janela do TER552120 não muda. Nenhum print mostra preço, estoque, logo de terceiros ou visual de montadora; as marcas concorrentes aparecem só em texto |
| F. Voz | Sem mudança de texto |

## Observação (não é achado)
- Com a faixa mais baixa, a trilha fica 16 px abaixo do topo escuro, a mesma distância da margem lateral. Para a marca isso é melhor: o código BAP sobe e aparece antes no celular (VEL7520, 390 px), sem perder o respiro em volta do logo.
