# Parecer de marca: T-0045, simulação do site (barra de botões, largura única e escala de letra)

- **Agente:** design-de-marca
- **Data:** 27/11/2026 19:54 (hora de Manaus)
- **Branch avaliado:** `web-site/T-0045-sim-site`. Primeira rodada no commit `10233202e82daa486df0a5378a7355f3ccb03bc7`; reteste no `ec9c7fb6ce76aa92f86c600677bb781b549eaa83`
- **Decisão de origem:** R-20261127-192108-alexandre, itens 14 a 17 (a barra no rodapé substitui a opB2 de R-20261120-141100; a letra 30% menor da T-0014 entra na escala única)
- **Prints:** antes e depois em 1366, 390 e 1920 px (página do produto VEL7520 e BIE20014, janela TER552120, início, busca, Sobre, vazio, não encontrado), mais a ficha A4 (TER552120 e VEL7520) e as medidas da página (`medidas-depois.json`)
- **Parecer:** **LIBERADO** para ir ao Alexandre como simulação. O MC-0053 e o MC-0054 foram corrigidos e conferidos no print novo.
- **Ajuste das tabelas (reteste no `31451b9ae51b303228533a196583465d4c92c6c2`):** **LIBERADO**. Os detalhes estão na seção "Ajuste aprovado: tabelas do produto", no fim.

## O que muda
- `site/styles.css` e `site/app.js`.
- **Barra de botões:** os botões do produto saem da linha do código e vão para uma barra só, no rodapé do bloco: Copiar código, Salvar em PDF e Voltar (este só na página). Na janela, a barra fica no rodapé dela.
- **Largura única:** 1880 px em todas as telas.
- **Escala de letra no produto:** 12, 13, 15, 17 e 20 px (`--fs-rot`, `--fs-tab`, `--fs-txt`, `--fs-sub`, `--fs-h1`).
- **Botão neutro:** o novo `.bt-neutro`, usado no Voltar.
- **No reteste:** a barra da página passou a ficar presa no fim da tela em todas as larguras (ajuste de UX).

## Contrastes (medidos pela fórmula da WCAG sobre os hex dos tokens)
| Combinação | Contraste | Mínimo |
|---|---|---|
| Copiar código: `--escuro` no `--verde` | 7,58:1 | 4,5:1 |
| Copiar código, hover: branco no `--verde-txt` | 6,48:1 | 4,5:1 |
| Salvar em PDF: `--verde-txt` no branco | 6,48:1 | 4,5:1 |
| Salvar em PDF, hover: `--verde-txt` no `--verde-claro` | 5,81:1 | 4,5:1 |
| Voltar: `--texto` no branco | 15,75:1 | 4,5:1 |
| Voltar, hover: `--texto` no `--fundo` | 14,41:1 | 4,5:1 |
| Borda do Voltar, depois do MC-0053: `--texto-2` no branco e no `--fundo` | 6,26:1 e 5,73:1 | 3:1 |
| Borda do Voltar, antes do MC-0053: `--borda-campo` no branco e no `--fundo` | 1,49:1 e 1,36:1 | 3:1 |
| Rótulo de 12 px: `--texto-2` no `--fundo` | 5,73:1 | 4,5:1 |

## Checklist
| Item | Resultado |
|---|---|
| A. Cor | Nenhum hex solto novo. A `--sombra-barra` é o `--escuro` em rgba, como a `--sombra`. O Voltar passou a ter contorno visível (MC-0053) |
| B. Logo e favicon | Sem mudança: o logo branco no topo escuro (46 px) e o branco no cabeçalho do PDF. O conteúdo começa na mesma linha do logo: 16 px em 1366 e 390, 36 px em 1920 |
| C. Tipografia | Só Poppins, nos pesos de sempre (500, 600, 700). No produto, só 12, 13, 15, 17 e 20 px. O código BAP (20 px, 700) volta a se destacar da descrição (15 px, 500), depois do MC-0054 |
| D. Grafismos | Sem mudança |
| E. Aplicações | Uma barra só, no rodapé, com os botões juntos. A ordem é principal, secundário e neutro. A ficha A4 sai sem botão e igual à de antes. Nenhum print tem preço, estoque, logo de terceiros ou visual de montadora |
| F. Voz | "Copiar código", "Salvar em PDF", "Voltar aos resultados" e "Voltar": diretos, verbo de ação, na voz do balcão |

## Achados
| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono | Situação |
|---|---|---|---|---|---|---|---|
| MC-0053 | `site/styles.css`, `.bt-neutro` (Voltar da página do produto), 1366, 390 e 1920 px | cor | manual a aprovar (contraste de componente, 3:1) | média | Borda: `var(--borda-campo)` → `var(--texto-2)`. Hover: borda `var(--texto-2)` → `var(--texto)`, fundo `var(--fundo)` | `web-site` | **Fechado** em `ec9c7fb`. Conferido nos prints de 1366, 1920 e 390 px (no celular, o botão só com a seta) |
| MC-0054 | `site/styles.css`, `.prod-info .desc` (cabeçalho do produto, página e janela), 1366, 390 e 1920 px | tipografia | manual a aprovar (hierarquia do código BAP) | baixa | `var(--fs-sub)` (17 px) → `var(--fs-txt)` (15 px), peso 500. A proporção entre o código e a descrição sobe de 1,18 para 1,33 | `web-site` | **Fechado** em `ec9c7fb`. Conferido nos prints de 1366, 1920 e 390 px |

## Observações (não são achado e não seguram)
- **Barra em 1920 px:** no `ec9c7fb`, a barra presa no fim da tela ia só até a largura de 1880 px, e sobrava uma faixa de 20 px de `--fundo` de cada lado. **Resolvido no `31451b9`:** a faixa branca, a linha e a sombra agora vão de ponta a ponta da tela, e os botões continuam alinhados com o logo (36 px em 1920).
- **Borda do Salvar em PDF:** a borda `--verde` do `.bt-claro` dá 2,41:1 no branco e 2,20:1 no `--fundo`. Já era assim antes desta tarefa e faz parte da simulação do verde decidido (R-20261120-115646-alexandre), que ainda vai ao Alexandre com o manual "a aprovar".
- **Escala fora do produto:** fora do produto ainda sobram tamanhos fora da escala: 12,5, 13,5, 14 e 19 px na busca, 14 px no aviso e no toast, 24 e 26 px nos títulos de bloco. Os tamanhos padrão vão para `docs/ux/` depois do aprovado (item 17 do R-20261127-192108-alexandre). Isso é do `designer-ux`.
- **✕ no alto da janela:** é o controle de fechar a janela, não uma ação do produto, e segue o padrão de mercado. Aparece nos prints que vão ao Alexandre.

## Ajuste aprovado: tabelas do produto (R-20261127-200014-alexandre, item 1)

- **Data do reteste:** 28/11/2026 (hora de Manaus).
- **Commit:** `31451b9ae51b303228533a196583465d4c92c6c2`. Muda `site/app.js` e `site/styles.css`.
- **Pedido do Alexandre:** o título da tabela fora da caixa e o cabeçalho das colunas com fundo e destaque, "como na Config do ERP", mas nas cores da BAP. Os tons foram decididos aqui, sem copiar a paleta do ERP: do ERP veio só a estrutura.
- **Prints:** antes (`ec9c7fb`) e depois, em 1366, 390 e 1920 px. A página do produto foi conferida com VEL7520 e BIE20014, a janela com TER552120, e a ficha A4 com VEL7520.

| Item | Especificação | Conferido no print | Contraste medido |
|---|---|---|---|
| Título fora da caixa (Aplicação, Referências cruzadas, Ficha técnica) | `--texto`, 13 px (`--fs-tab`), peso 700, caixa alta, `letter-spacing .06em`, 6 px acima da caixa | Sim, na página e na janela, em 1366, 1920 e 390 px | 14,41:1 no `--fundo` |
| Cabeçalho das colunas (Aplicação) | Fundo `--verde-claro`; texto `--verde-txt`, 13 px, peso 600, sem caixa alta; linha de baixo de 2 px em `--verde-esc`; a faixa encosta nas bordas da caixa | Sim | Texto 5,81:1; linha 3,64:1 no `--verde-claro` e 4,06:1 no branco |
| Linhas alternadas (as três tabelas) | 1ª linha branca e as pares em `--fundo`; separação de 1 px em `--linha` | Sim | `--texto` 14,41:1 e `--texto-2` 5,73:1 no `--fundo` |
| Celular, abaixo de 480 px (lista por veículo) | Sem faixa de cabeçalho; itens pares em `--fundo`, com 10 px de recuo e 1 px de `--linha` | Sim, em 390 px | `--escuro` 16,71:1 e `--texto-2` 5,73:1 no `--fundo` |
| Ficha A4 (`@media print`) | Não muda nesta tarefa (mudar o PDF pede simulação própria) | As duas páginas A4 do VEL7520 saíram iguais, pixel a pixel, antes e depois | — |

- **Cores:** nenhum hex novo. O `#F0F2F0` saiu da tela e ficou só nas regras-base, que hoje só a impressão usa (decisão do `gerente-projetos` para esta tarefa).
- **Regras do repositório:** nenhum print mostra preço, estoque, logo de terceiros ou visual de montadora. Montadoras e concorrentes aparecem só em texto.

### Recomendações que não foram aplicadas (não seguram)
- **Título do "Leve também":** continua em 12 px, enquanto os títulos das tabelas estão em 13 px, ambos em peso 700 e caixa alta. Recomendo subir para 13 px (`--fs-tab`) e manter a cor `--verde-txt` e a posição dentro da faixa, para que todos os títulos de seção do produto tenham o mesmo tamanho.
- **Cabeçalho "Marca | Código" nas Referências cruzadas:** não foi criado. A decisão do texto é do `designer-ux`. Se ele entrar, segue o estilo do cabeçalho da Aplicação.
