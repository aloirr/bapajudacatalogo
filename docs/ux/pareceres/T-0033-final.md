# T-0033 · Parecer de UX da versão final (busca por veículo com ano; fim do "Outros veículos e detalhes")

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 25/11/2026 (Manaus) |
| O que foi revisto | Tela: `origin/web-site/T-0033-busca-ano`, head `f4e1a0e4dc13198ba1c06860814a9c2562552072` (`site/app.js` e `docs/DADOS_DO_SITE.md`, comparados com a simulação `51781da`). Prints: `origin/testes/T-0033-busca-ano`, `6fb9139`, `testes/prints/T-0033/` (33 prints, feitos sobre o `ac79a65`) |
| Base | Parecer da simulação (`docs/ux/pareceres/T-0033-simulacao.md`, U1 a U4) e as decisões do Alexandre 1a, 2a, 3b, 4a e 5a (R-20261125-095049-alexandre, R-20261125-095052-po); a 3b leva a regra do ano também para a busca digitada |
| Resultado da 2ª rodada (`28b3b3a`) | **LIBERADO**: nenhum 🔴. A restrição do texto volta para a tela sem mudar o layout aprovado. 3 🟡 de texto e estilo para o `web-site` (U5 a U7), que cabem neste PR; 1 🟡 da base (U8, `catalogo-dados`, fora do PR). Ver a seção 4 |
| Resultado da 1ª rodada (`f4e1a0e`) | **LIBERADO COM AJUSTES**: nenhum 🔴. U1 a U4 atendidos. 2 🟡 na leitura do texto (R1 e R2, `web-site`), 1 🟡 de texto da base (R3, `catalogo-dados`, fora deste PR) e o reteste dos prints da busca digitada com a contagem nova |

## 1. Achados da simulação

| Achado | Situação | Onde conferi |
|---|---|---|
| U1 · erros de leitura do texto | 🟢 | `depois-1366-janela-BCE3001.png`: o "Versailes" virou modelo (Ford Versailes) e o "Sedan" é versão do Escort (Escort 1.8 16V Sedan 1997+). `depois-1366-janela-INT16530.png`: Citroën Saxo, com marca e modelo certos. `depois-1366-janela-CXD13022.png`: "147 · Pick Up · 1985–1988" está certo, porque o 147 Pick-Up é uma versão do 147. O "(após" virou ano ("após 2005" vale "2005+", `docs/DADOS_DO_SITE.md`). A Marca só pode ser montadora conhecida, então a tabela não inventa marca |
| U2 · o mesmo modelo junto | 🟢 | BCE3001: as 4 linhas do Escort em seguida, depois Verona e Royale |
| U3 · Versão limpa | 🟢 | BCE3001: o Polo sem "todos", "A160/190" sem parênteses, "MPI" em maiúsculas; ROL0015E: nenhum parêntese solto |
| U4 · prints de detalhe longo | 🟢 | `depois-1366-janela-JUH70013.png`: "s/ ABS · (Inclusive Adventure) Todos lado Roda Dir/Esq." ocupa 3 linhas na Versão, a tabela não rola para o lado e a linha fica legível. Em 390 px (`depois-390-janela-JUH70013.png`), o detalhe vai no nome do item, como especificado |

## 2. Busca digitada com ano (decisão 3b)

Prints: `antes-/depois-1366-digitada-polo-2026.png`, `antes-/depois-390-digitada-polo-2026.png`.

- 🟢 **Resultados.** "polo 2026" digitado não traz mais a BCE3001, nem nenhum produto que não tenha o ano do Polo batendo. É a mesma regra da faixa de veículo (`serveNoAno`), e o print cai de 74 para 37 produtos. O código exato continua entrando sempre ("BCE3001 polo 2026" mostra a BCE3001), como em toda busca do site. Está certo: quem digita o código quer aquele produto.
- 🟢 **"Mais próximos".** O produto sem o ano batendo sai com nota zero (`app.js`, `testar`, o retorno com `n: 0`), então também não entra entre os mais próximos. O aviso "Nenhum produto tem todas as palavras. Estes são os mais próximos…" continua igual e só aparece quando nada casa com todas as palavras. Não há caminho para o produto sem ano voltar por ele.
- 🟢 **Mobile e computador.** O contador e a lista estão no mesmo lugar de antes, e nada muda na hierarquia.
- 🟡 **Reteste.** Os prints `depois-*-digitada-polo-2026.png` são do `ac79a65` e mostram 37 produtos. Com o `f4e1a0e`, a contagem passa a 27. O `testes` refaz os dois prints (1366 e 390 px). Eu confiro só a contagem e o topo da lista, e não precisa de nova rodada de UX se o resto ficar igual.
- **Observação, para uma tarefa futura (não segura este PR):** na busca digitada, o cartão não mostra por que o produto serve no Polo. O trecho da aplicação começa por outra marca ("BMW - Série 1…" numa palheta), e o selo "Compatível" só aparece quando o veículo vem da faixa (listas ou placa). Já era assim antes da T-0033. Se o Alexandre quiser, uma tarefa nova pode mostrar o trecho do modelo digitado no cartão, ou levar "polo 2026" para a faixa de veículo.

## 3. Achados novos (prints do U4)

`depois-1366-janela-ROL0015E.png` e `depois-390-janela-ROL0015E.png`:

- 🟡 **R1. Versão com outro veículo dentro.** Uma linha sai "Fiat Doblo · s/ ABS e Alfa 145." na Versão: o "e Alfa 145." é outro veículo, que já tem linha própria logo abaixo, e vem com ponto no fim. Para o cliente, parece uma versão do Doblo. A Versão não pode levar o nome de um modelo da tabela ("e Alfa 145" sai, porque o 145 já é linha) nem a pontuação final. Dono: `web-site` (`limparVersao` / `juntarNaTabela`).
- 🟡 **R2. Linhas repetidas por faixa contida ou sem ano.**
  - Na ROL0015E aparecem "Fiat Palio 1984–2014" e "Fiat Palio 1996–2002", e o mesmo no Siena: a 2ª faixa está dentro da 1ª e não acrescenta nada.
  - "Fiat Uno Mille —" vem logo abaixo de "Fiat Uno Mille 1984–2014".
  - "Fiat Doblo s/ ABS —" convive com "Fiat Doblo 1984–2014".
  - A regra de hoje tira só a linha idêntica (`docs/DADOS_DO_SITE.md`). Proposta: sai a linha do mesmo modelo e da mesma versão (ou sem versão) cuja faixa está dentro da faixa de outra, e sai a linha sem ano quando o mesmo modelo com a mesma versão já tem ano. Fica menor e diz o mesmo.

  Cuidado: a linha com versão diferente fica ("Doblo s/ ABS" é outra informação que "Doblo"); só some quando ela é cópia sem ano. Dono: `web-site`.
- 🟡 **R3 (fora deste PR). Detalhe do produto inteiro preso num veículo.** Nas linhas do Alfa Romeo 145 e 146, a Versão diz "(Fiasa / Fire) - Roda Dianteira (Direita / Esquerda)". O texto da base vale para a aplicação toda (a Ficha técnica já diz Motorização Fiasa / Fire, Posição Dianteiro, Lado Esquerdo e Direito), mas, pela regra B11, gruda no último veículo. Parece que só o Alfa é Fiasa/Fire. A leitura não tem como saber disso; quem corrige é o texto da APLICACAO da ROL0015E na base (tirar a parte que repete a ficha). Dono: `catalogo-dados`, numa próxima versão da base. Também na base: "Versailes" está grafado com um L só (o modelo é Versailles).

## Donos

| Achado | O quê | Dono |
|---|---|---|
| R1 | A Versão sem o nome de outro modelo da tabela nem pontuação final | `web-site` |
| R2 | Sem linha de faixa contida nem cópia sem ano do mesmo modelo e versão | `web-site` |
| R3 | Texto da APLICACAO da ROL0015E e grafia "Versailles" (próxima versão da base) | `catalogo-dados` |
| Reteste | `depois-1366-digitada-polo-2026.png` e `depois-390-…` com a contagem nova (27) | `testes` |

## Reteste

Depois de R1 e R2: `depois-1366-janela-ROL0015E.png` e `depois-390-janela-ROL0015E.png`, mais a BCE3001 em 1366 px, para confirmar que nada mais mudou. E os dois prints da busca digitada.

## 4. Segunda rodada: a restrição do texto na tabela e o aviso de tipo sem peça (`28b3b3a`)

| Campo | Valor |
|---|---|
| O que foi revisto | `origin/web-site/T-0033-busca-ano`, head `28b3b3a87c5cec4fc3e90bfe008eef1116bab6b2` (`site/app.js`: `tabelaVeiculos`, `restricoesFora`, o aviso `semTipo`; `site/styles.css`: `.restr-fora`) |
| Prints (escala 2) | CXD13090, AMT7050, AMT7014, AMT7134, JUH70244, POL1678 e a busca "bomba combustivel polo 2026", cada um em 1366 e 390 px (prints do `testes` para esta rodada) |
| Motivo | O revisor achou que o fim do bloco "Outros veículos e detalhes" escondia a restrição do texto: a CXD13090 chegou a mostrar "Focus 2.0 / 1.6" para uma peça que "não aplica no Focus 1.6" |

### 4.1 A restrição na Versão

- 🟢 **Não some mais.** CXD13090 (1366): a linha do Focus fica com a Cilindrada 2.0 e a Versão "Motor Duratec SISTEMA ELETRO HIDRAULICO · Não aplica no Focus 1.6 - Motor Sigma". O "1.6" não aparece mais como cilindrada que serve. O defeito do revisor está fechado.
- 🟢 **Lugar certo.** A restrição vem no fim da Versão, depois de " · ", inteira e com o texto da base (AMT7014: "Adventure · c/ ABS / c/ barra estab · exc. Locker / Cabine Dupla / Prato Pequeno"; AMT7134: "Sport · exc. Triton"; JUH70244: "Exceto turbo"). Quem lê a linha da esquerda para a direita vê primeiro o veículo e termina na restrição, junto do ano.
- 🟢 **Celular (390 px).** A restrição entra no nome em negrito do item ("Mitsubishi L200 Sport · exc. Triton"), com o ano na linha de baixo. Nada rola para o lado. Mesmo na CXD13090, com 3 linhas de nome, o item continua legível.
- 🟢 **Leitor de tela.** É texto comum na célula Versão (e no nome do item no celular), sem ícone nem cor. O leitor lê a restrição na ordem da linha. Não depende de cor.

### 4.2 A linha "Não serve (exc. …)"

AMT7050 ("Hyundai HB20X · Não serve (exc. HB20 X)") e AMT7134 ("Mitsubishi Triton · Não serve (exc. Triton)").

- 🟢 **A decisão está certa.** O veículo excluído está na lista de veículos da peça (a busca acha o produto por ele). Sem essa linha, quem chega pela busca "HB20X" abre o produto e não vê o modelo na tabela; com ela, vê na hora que não serve. "Não serve" é claro, curto e vem antes do parêntese.
- 🟡 **U5. O parêntese repete o modelo e, no celular, "Não serve" parece nome de versão.**
  - Em 1366 px, "Não serve (exc. Triton)" na linha do Triton diz duas vezes a mesma coisa: o modelo já está na coluna Modelo.
  - Em 390 px, o item vira "Mitsubishi Triton Não serve (exc. Triton)", tudo em negrito e sem separação, e lê como se "Não serve" fosse uma versão do Triton.
  - Proposta: quando a restrição só repete o modelo da linha (com ou sem espaço: "HB20 X" e "HB20X"), a Versão fica só "Não serve". Quando a restrição diz mais que o modelo (ex.: "exc. Triton 4x4"), o parêntese fica. No celular, o nome leva " · " antes de "Não serve": "Mitsubishi Triton · Não serve", igual às outras restrições.
  - Dono: `web-site` (`tabelaVeiculos`, `app.js:1987`, e a lista do celular).

### 4.3 A linha "Restrições da aplicação"

POL1678 ("Restrições da aplicação: Somente para o motor EW10J4"), em 1366 e 390 px.

- 🟢 **Lugar e texto.** Fica logo abaixo da tabela e acima do "Confira sempre a aplicação…", num lugar só e com a frase da base. Ninguém precisa abrir nada para ver. Contraste: texto `--texto` sobre branco, acima de 4,5:1. No celular quebra sem rolar (`overflow-wrap: anywhere`).
- 🟡 **U6. Rótulo e número.**
  - O rótulo não se separa do texto e some na leitura rápida. Proposta: o rótulo em negrito (`<b>`), como o "Nenhum produto tem todas as palavras." do aviso.
  - Com uma restrição só, o rótulo fica "Restrição da aplicação:"; com mais de uma, "Restrições da aplicação:".
  - Dono: `web-site` (`app.js:2033`).

### 4.4 O aviso de tipo sem peça (decisão "a" do Alexandre)

Busca "bomba combustivel polo 2026", em 1366 e 390 px.

- 🟢 **Texto.** "**Nenhuma bomba de combustível para Polo 2026**; veja outras peças do Polo." Diz o problema e a ação numa frase, sem jargão, em caixa normal e com o acento que o cliente não digitou. Segue a decisão do Alexandre ao pé da letra.
- 🟢 **Lugar e estilo.** Fica abaixo de "Resultados" e do contador e acima da lista, no lugar e com o estilo do aviso dos "mais próximos" (mesma classe `aviso proximos`, mesmo negrito). Os dois avisos nunca aparecem juntos (`app.js:1002–1003`). Em 390 px, fica acima da dobra, logo depois do botão Filtrar. `role="status"`: o leitor de tela anuncia o aviso quando a lista muda.
- 🟢 **Contagem.** "27 produtos" bate com a contagem da busca digitada "polo 2026" da 1ª rodada (reteste do § 2 fechado nesta contagem).
- 🟡 **U7. Valor solto no estilo.** Os dois avisos levam `style="margin:0 0 14px;font-size:14px"` no HTML (`app.js:1002` e `1003`). O dos "mais próximos" já era assim; o novo copiou. Pela regra dos tokens, o estilo vai para uma regra `.aviso.proximos` no `styles.css`. A tela fica igual. Dono: `web-site`.

### 4.5 Fora deste PR

- 🟡 **U8. Caixa alta da base.** "SISTEMA ELETRO HIDRAULICO" (CXD13090) e "PICASSO" (POL1678, na coluna Modelo, entre "C4 Picasso" e os outros modelos em caixa normal) vêm do texto da base. A leitura do site não deve mexer nisso. Dono: `catalogo-dados`, na próxima versão da base, junto com o R3.

### 4.6 Foge da simulação aprovada?

Não precisa de nova simulação.
- O layout é o mesmo: a tabela de 5 colunas, a lista no celular, o "Confira sempre…" e nenhum bloco a mais.
- O que muda é o texto dentro da Versão. Também entram uma linha curta abaixo da tabela, em 9 produtos, e a linha "Não serve" quando o veículo excluído está na lista.
- O aviso de tipo sem peça é a opção "a" que o próprio Alexandre escolheu.

**Recomendação ao `po`:** ao apresentar o PR, mostre ao Alexandre 3 prints que ele não viu na simulação: AMT7050 (a linha "Não serve"), POL1678 ("Restrições da aplicação") e CXD13090 (a restrição na Versão). Isso informa, não segura o PR.

### 4.7 Pendências da 1ª rodada

Não reconferi R1 e R2 (ROL0015E) nesta rodada: os prints desta rodada não trazem a ROL0015E. Se o `web-site` mexeu neles, o `testes` manda os prints `depois-*-janela-ROL0015E.png` com o `28b3b3a`.

### Donos (2ª rodada)

| Achado | O quê | Dono |
|---|---|---|
| U5 | "Não serve" sem o parêntese que só repete o modelo; " · " antes de "Não serve" no celular | `web-site` |
| U6 | Rótulo "Restrição(ões) da aplicação:" em negrito e no número certo | `web-site` |
| U7 | O estilo dos dois avisos numa regra `.aviso.proximos` do `styles.css`, sem `style=` no HTML | `web-site` |
| U8 | Caixa alta "SISTEMA ELETRO HIDRAULICO" e "PICASSO" (próxima versão da base) | `catalogo-dados` |

Reteste depois de U5 a U7: AMT7134 e AMT7050 em 390 px, POL1678 em 1366 px. Basta o print, sem nova rodada completa.

## 5. Situação no 22bc129 (entrou no main pelo #217)

Conferi no código do `22bc129` (head do #217, que entrou no main em `7dd0d1b`):

| Achado | Situação | Onde |
|---|---|---|
| U5 | 🟢 Fechado: a Versão é só `NAO_SERVE` ("Não serve") quando a restrição repete o modelo; o parêntese fica só quando diz mais. No celular, o nome leva " · Não serve" | `site/app.js:1978`, `1998` e `1638` |
| U6 | 🟢 Fechado: "Restrição da aplicação:" ou "Restrições da aplicação:" em negrito, conforme o número | `site/app.js:2045` |
| U7 | 🟢 Fechado: a regra `.aviso.proximos` no `styles.css`, sem `style=` no HTML | `site/styles.css:290` |
| R1 e R2 (ROL0015E) | Vão para a fila da T-0037 (`catalogo-dados`): a correção no site estragava cerca de 20 produtos, e o certo é corrigir o texto da base | T-0037 |
| U8 e R3 | Continuam na fila do `catalogo-dados` (próxima versão da base) | — |

Nada mais segura a T-0033 do lado da UX.
