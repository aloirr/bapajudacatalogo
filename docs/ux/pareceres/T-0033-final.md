# T-0033 · Parecer de UX da versão final (busca por veículo com ano; fim do "Outros veículos e detalhes")

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 25/11/2026 (Manaus) |
| O que foi revisto | Tela: `origin/web-site/T-0033-busca-ano`, head `f4e1a0e4dc13198ba1c06860814a9c2562552072` (`site/app.js` e `docs/DADOS_DO_SITE.md`, comparados com a simulação `51781da`). Prints: `origin/testes/T-0033-busca-ano`, `6fb9139`, `testes/prints/T-0033/` (33 prints, feitos sobre o `ac79a65`) |
| Base | Parecer da simulação (`docs/ux/pareceres/T-0033-simulacao.md`, U1 a U4) e as decisões do Alexandre 1a, 2a, 3b, 4a e 5a (R-20261125-095049-alexandre, R-20261125-095052-po); a 3b leva a regra do ano também para a busca digitada |
| Resultado | **LIBERADO COM AJUSTES**: nenhum 🔴. U1 a U4 atendidos. 2 🟡 na leitura do texto (R1 e R2, `web-site`), 1 🟡 de texto da base (R3, `catalogo-dados`, fora deste PR) e o reteste dos prints da busca digitada com a contagem nova |

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
