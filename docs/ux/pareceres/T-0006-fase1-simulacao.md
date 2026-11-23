# T-0006, fase 1 (baterias) · Parecer de UX da simulação

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 07:33 (Manaus) |
| O que foi revisto | A simulação do `web-site` no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0006/fase1-sim/` (commit 1a09ed2): o `LEIA.md` e os 12 PNGs (1366 px e 390 px, antes e depois). Também o diff do branch `web-site/T-0006-fase1-baterias`, head `5a46510` (`site/app.js` e `docs/DADOS_DO_SITE.md`), sobre o main `15c3d8d` |
| Comparado com | A simulação aprovada no #157: `docs/propostas/BUSCA_POR_MEDIDA.md` (§4) e o `docs/propostas/T-0006/simular.mjs`, com as opções do `medidas.json` |
| Pedido | R-20261123-112006-alexandre, decisão 5a (proposta aprovada em R-20261123-095435-alexandre) |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. Os números dos grupos são a quantidade de produtos na lista, não estoque.

A voz, o texto e a grafia ("Amperagem", "Partida a frio (CCA)", "Ah", "até 400", "acima de 800") ficam com o `design-de-marca` (ver o parecer de marca da T-0006, fase 1). Aqui só falo de leitura, hierarquia e uso.

## 1. A tela bate com a simulação aprovada no #157
| Ponto | Simulação do #157 | Site do branch (prints) | |
|---|---|---|---|
| Lugar dos grupos | no fim da coluna, depois da Família; no celular, no painel "Filtrar" | igual (`02-…-1366`, `02-…-painel-390`) | 🟢 |
| Nome dos grupos | "Amperagem" e "Partida a frio (CCA)" | igual | 🟢 |
| Opções da Amperagem | 13, de 40 a 220 Ah, do menor ao maior | igual, com as mesmas contagens (2, 4, 8, 8, 3, 1, 6, 1, 4, 3, 2, 2, 2) | 🟢 |
| Opções do CCA | 5 faixas, na ordem da menor à maior | igual, com 15, 6, 11, 8 e 6 | 🟢 |
| Medida marcada | etiqueta com o X ("Amperagem: 60 Ah") e "Filtrar (1)" | igual (`04-…`, `06-…`) | 🟢 |
| Celular | "Ver N produtos" no pé do painel | "Ver 8 produtos" com 60 Ah marcado (`06-…`) | 🟢 |

- 🟢 **O que muda do #157 é só o que o site já fazia nos outros grupos:** a opção com 0 fica cinza e desabilitada, o grupo marcado ganha o "(1)" no título e o endereço guarda a escolha (`ah=60`, `cca=401-500`). A simulação desenhava os grupos por cima da tela e não tinha esses estados; agora eles vêm do mesmo código dos outros filtros (`FILTROS`, no `site/app.js`).
- 🟢 **O resto da tela não muda.** Cabeçalho, campo de busca, placa, faixa do veículo, cartões e rodapé ficam iguais ao "antes" (`01-antes-bateria-1366` contra `02-…-1366`).

## 2. Leitura e hierarquia
- 🟢 **A lista ordenada por número se lê de relance.** Do menor ao maior, o olho acha o "60 Ah" sem ler as outras. A ordem pela quantidade de produtos, a dos outros grupos, embaralharia os números (50 e 60 Ah em cima, 40 Ah no meio): a regra própria (`ordem`) está certa aqui.
- 🟢 **As faixas do CCA não se sobrepõem** e vão da menor à maior. A unidade fica no nome do grupo, e as opções ficam curtas.
- 🟢 **O título do grupo em caixa alta fica certo**, porque a unidade "Ah" está só nas opções, que não são transformadas: "AMPERAGEM", "60 Ah". Era o 🟡 do meu parecer do #157.
- 🟢 **Os grupos novos só aparecem quando a lista tem bateria com a medida** (`01-antes` não tem; em "60ah", `05-…-1366`, a Amperagem tem só "60 Ah" e o CCA, só as 3 faixas das 8 baterias). Numa busca de outro produto, a coluna não muda.
- 🟢 **Busca "60ah".** O "60ah" acha as 8 baterias de 60 Ah (`05-busca-60ah-1366` e `-390`), e a etiqueta mostra o termo como foi digitado. É o caminho mais curto para o balconista e fica no topo, no campo único de busca.

## 3. Etiquetas e o "Filtrar (n)"
- 🟢 **A etiqueta diz o grupo e a opção:** "Partida a frio (CCA): 401 a 500" (`04-…-1366` e `-390`). No celular, ela cabe numa linha só, com o X, e o "Limpar tudo" fica logo abaixo.
- 🟢 **O "Filtrar (1)"** conta a medida marcada como os outros filtros (`04-…-390`), e o título do grupo marcado ganha o "(1)" (`04-…-1366`, `06-…`).
- 🟢 **A contagem com outro filtro marcado** segue a regra de hoje: com "401 a 500" marcado, a Amperagem mostra só 60 Ah (5) e 80 Ah (1) ativos, e as outras 11 em cinza (`04-…-1366`). O cinza continua com o número 0 ao lado: a cor não fica sozinha.

## 4. O painel no celular (390 px)
- 🟢 **Toque:** cada linha de opção tem 44 px de altura, e o título do grupo, cerca de 50 px (`02-…-painel-390`, `02b-…`).
- 🟢 **Recolher:** os dois grupos recolhem pelo título, como os outros, e ficam com 2 linhas (`03-…-painel-390`). O "Ver 47 produtos" fica sempre no pé do painel, ao alcance do polegar.
- 🟢 **Nada rola para o lado** em 390 px (prints e `LEIA.md`), nem com a etiqueta mais longa, a do CCA.
- 🟢 **O comprimento do painel cresce** cerca de 13 × 44 px com a Amperagem aberta: o CCA fica a uma rolagem e meia do topo (`02-…-painel-390` e `02b-…`). Rolar não é toque, e o campo de busca ("60ah") e o recolher resolvem quem quer ir direto. Ver a recomendação do §6.

## 5. Regra dos 3 toques
- 🟢 **Achar pela medida no texto:** digita "60ah" e toca em Buscar (1), toca em "+ Detalhes" (2). Antes, a mesma busca deixava 4 das 8 baterias de fora.
- 🟢 **Achar pelo filtro** (refinar uma busca "bateria"): Filtrar (1), "60 Ah" (2), "Ver 8 produtos" (3), "+ Detalhes" (4). É o mesmo número de toques dos filtros de hoje; o filtro é refinamento, e a tarefa mais comum (achar pelo texto) continua em 2 toques.

## 6. Recomendação na pergunta do `LEIA.md` ("Ver mais" na Amperagem)
| # | Pergunta | Recomendação de UX | Por quê |
|---|---|---|---|
| 1 | Lista longa da Amperagem (13 opções) | **a) Mostrar as 13 opções, como nos prints** | 1) **Consistência:** nenhum grupo do site tem "Ver mais" hoje; Linha, Categoria e Sistema mostram a lista inteira (até 40). Um componente novo só para um grupo seria um jeito diferente de fazer a mesma coisa. 2) **A lista é curta e ordenada:** 13 linhas, do menor ao maior; o olho acha o número sem ler tudo. 3) **O corte das 8 primeiras esconderia justamente 90 a 220 Ah**, as baterias maiores (13 produtos, entre eles as 9 da Linha Pesada, de 100 a 220 Ah), e daria um toque a mais a quem procura bateria da linha pesada. 4) **O recolher já existe** (`03-…`) e a busca "60ah" vai direto. A b) só valeria com bem mais opções [SUPOSIÇÃO: acima de umas 20]; nesse caso, o "Ver mais" teria de mostrar sempre a opção marcada e entraria em todos os grupos, com simulação |

A mesma regra serve para a fase 2 (a "Medida do pneu", com 11 opções): lista inteira, sem "Ver mais".

## 7. Notas (não seguram)
1. **No computador, os grupos novos ficam perto da dobra.** Em 1366 × 768, o título "Amperagem" fica a cerca de 690 px do topo, e o CCA, a cerca de 1.100 px, abaixo de 3 grupos (Categoria, Sistema e Família) que, na busca "bateria", têm uma opção só, com os 47 produtos (`02-…-1366`). É a ordem fixa aprovada (R-20261120-145600-alexandre, e os grupos novos depois da Família, no #157), e o balconista chega com uma rolagem. Fica registrado para uma tarefa futura de layout, se o Alexandre quiser: por exemplo, recolher sozinho o grupo cuja única opção tem a lista inteira. Isso mexe numa regra aprovada e pede simulação.
2. **O título do grupo marcado fica com dois parênteses:** "PARTIDA A FRIO (CCA) (1)" (`04-…-1366`). O "(1)" sai em cinza e mais leve, e se lê como contador, igual nos outros grupos. Não peço mudança nesta fase; a grafia é do parecer de marca.

## Prints conferidos
Todos estão no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0006/fase1-sim/` (commit 1a09ed2):
- **Antes:** `01-antes-bateria-1366.png` e `01-antes-bateria-painel-390.png`.
- **Grupos abertos:** `02-bateria-grupos-abertos-1366.png`, `02-bateria-grupos-abertos-painel-390.png` e `02b-bateria-grupo-cca-painel-390.png`.
- **Grupos fechados:** `03-bateria-grupos-fechados-1366.png` e `03-bateria-grupos-fechados-painel-390.png`.
- **CCA "401 a 500" marcado:** `04-bateria-cca-401-500-1366.png` e `04-bateria-cca-401-500-390.png`.
- **Busca "60ah":** `05-busca-60ah-1366.png` e `05-busca-60ah-390.png`.
- **Painel com 60 Ah marcado:** `06-painel-filtrar-60ah-marcado-390.png`.
- **Código:** o diff do `5a46510` contra o main `15c3d8d` (`site/app.js`: `FILTROS`, `medidaDe`, `valorFiltro`, `nomeFiltro` e o "60ah" no `casador`).

**Resultado: LIBERADO.** A simulação pode seguir ao Alexandre, pelo `po`, com a recomendação a) do §6.
