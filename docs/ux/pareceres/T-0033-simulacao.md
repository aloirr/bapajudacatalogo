# T-0033 · Parecer de UX da simulação (busca por veículo com ano; fim do "Outros veículos e detalhes")

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 25/11/2026 (Manaus) |
| O que foi revisto | Tarefa: `origin/po/T-0033-busca-ano:.coord/tarefas/T-0033.md`. Tela: `origin/web-site/T-0033-busca-ano`, `51781da` (`site/app.js`: `serveNoAno`, `juntarNaTabela`, `tabelaDe`, `cilHtml`; `site/styles.css`; `docs/DADOS_DO_SITE.md`). Prints: `origin/testes/T-0033-busca-ano`, `09985c3`, os 12 de `testes/prints/T-0033/` (antes e depois, 1366 e 390 px: janela da BCE3001, busca Polo 2026 e busca "BCE3001" com Polo 2026) |
| Pedido | "aplicações sem ano não deve aparecer na pesquisa…" (R-20261124-152047-po) e "esse outra veiculos e datalhe, nao tem que existir. tem que fazer parte da tabela normalmente" (R-20261124-152425-po) |
| Resultado | **LIBERADO COM AJUSTES** para a simulação seguir ao Alexandre, com 2 perguntas (P1 e P2) e a lista dos erros de leitura que já são conhecidos. **U1 é 🔴 para a versão final**: com erros de leitura, a tabela mostra veículo que não existe. U2 a U4 são 🟡 |

## 1. Busca por veículo com ano

Prints: `antes-/depois-1366-busca-polo-2026.png`, `antes-/depois-390-busca-polo-2026.png`, `*-busca-BCE3001-polo-2026.png`.

- 🟢 **A regra pedida aparece na tela.** Em Volkswagen Polo 2026 a BCE3001 não aparece mais. A lista Ano mostra "2026 (0)" quando se busca "BCE3001", e o selo "Compatível" continua nos cartões que ficam.
- 🟢 **Impacto, para o Alexandre saber (não é pergunta):** Polo 2026 cai de **56 para 21 produtos** (`antes-1366-busca-polo-2026.png` × `depois-…`). Os 35 que saem não têm o ano do Polo na aplicação, e a lista deles já está com o Alexandre (3.340 linhas, 1.007 códigos). O `po` deve mostrar essa contagem junto com os prints.
- 🟢 **Mensagem de busca vazia** (`depois-1366-busca-BCE3001-polo-2026.png`, `depois-390-…`): "Nada para Volkswagen Polo 2026 com essa busca. Tente outra busca ou veja tudo sem o veículo." e o botão "Tirar o veículo".
  - A mensagem já existia (`app.js`, o `.vazio` da busca com veículo) e serve aqui. Diz o veículo e o ano e dá uma ação.
  - Não recomendo explicar que "o ano não está confirmado". Seria texto sobre o funcionamento do site, e o Alexandre pediu justamente que o produto não aparecesse.
  - Em 390 px a mensagem e o botão ficam acima da dobra.

## 2. A tabela de aplicação maior

Prints: `depois-1366-janela-BCE3001.png`, `depois-390-janela-BCE3001.png` (e os de antes).

- 🟢 **No celular está legível.** As 29 linhas da BCE3001 viram 29 itens de "Marca Modelo Versão", com "Cilindrada … · Ano …" embaixo. Dá cerca de 2 telas e meia, sem rolar para o lado, e cada item é fácil de achar pelo nome. Antes, eram a tabela e mais um bloco de texto corrido com tudo repetido. Agora a informação está num lugar só, como manda o checklist.
- 🟢 **No computador**, as cilindradas múltiplas quebram só entre elas ("1.0 / 1.5 / 1.6 8V / 1.6 16V" em 3 linhas no Palio, `cilHtml`), sem cortar "1.6 16V" ao meio. A janela não rola para o lado.
- 🟢 Indo de 12 mil para 18 mil linhas no catálogo todo, o componente não muda: cada produto só fica mais longo onde o texto tinha mais veículos.
- 🟡 **U2. O mesmo modelo fica espalhado.** Na BCE3001, o Ford Escort aparece em 3 linhas que não ficam juntas: "Escort 1.6", depois "Verona", depois "Escort SW" e "Escort 1.8 16V" (`depois-1366-janela-BCE3001.png`). Quem procura "Escort" lê a primeira linha e pode parar nela. Dentro da marca, as linhas do mesmo modelo devem ficar juntas, na ordem em que aparecem; a ordem das marcas continua a mesma. Dono: `web-site` (`juntarNaTabela`, o `splice` da linha nova).

## 3. Detalhes na coluna Versão (" · ")

- 🟢 **A ideia funciona.** O detalhe sem veículo ("s/ ABS", "Dianteiro") fica junto do veículo a que pertence, numa coluna que já existe. No celular ele entra no nome ("Ford Ka s/ ABS · Dianteiro"), que é onde se lê primeiro.
- 🟡 **U3. Versão com sobras do texto.**
  - "todos" em minúscula ("Volkswagen Polo todos", na lista do celular) parece um pedaço do texto, não uma versão. Versão vazia já quer dizer "sem restrição", então o "todos" (e o "todas") sai.
  - Os parênteses que cercam a versão inteira saem: "(A160/190)" fica "A160/190".
  - O "(após" que sobra (problema conhecido) entra na mesma limpeza: parêntese sem par não fica na célula.

  Dono: `web-site` (`limparVersao`).
- 🟡 **U4. Falta o print de um caso pesado.** A BCE3001 não tem detalhe sem veículo, então os prints não mostram o " · " na Versão. Pedido ao `testes`: a janela, em 1366 e 390 px, de um produto com detalhe longo (ex.: "(Inclusive Adventure) Todos lado Roda Dir/Esq.", citado em `docs/DADOS_DO_SITE.md`) e de um com "s/ ABS". A coluna Versão é estreita no computador; se o detalhe esticar a linha para 4 ou mais linhas de texto, revejo.

## 4. Erros de leitura do texto livre

- 🔴 **U1 (segura a versão final, não a simulação).** Quando a leitura erra, a tabela afirma um veículo que não existe. No texto corrido o erro ficava visível; na tabela, o dado parece conferido. Os casos conhecidos:
  - BCE3001: "Ford **Sedan** · Versão **Versailes** · 1.8 16V · 1997+" (`depois-1366-janela-BCE3001.png`). O texto é "Sedan 1.8 16V 1997+, Versailes": o Versailles é outro modelo, e "Sedan" não é modelo Ford.
  - CXD13022: "Pick Up (1985–1988)" vira versão do Fiat 147.
  - INT16530: "Saxo" vira versão do Jumper.
  - Sobra "(após" na Versão (ver U3).

  O caso da BCE3001 está no próprio exemplo que vai ao Alexandre. **A simulação pode seguir, mas o `po` manda junto a lista dos 4 casos, como "erros já achados, a corrigir"**, para não parecer que passaram despercebidos. A forma de corrigir é a P2. Donos: `web-site` (a leitura) ou `catalogo-dados` (a base), conforme a resposta da P2.

## 5. Perguntas ao Alexandre (pelo `po`, com a simulação)

- **P1. O ano no fim de uma lista vale para todos os veículos dela?** Na BCE3001 o texto é "Ka, Fiesta, Courier 1993+". A simulação dá o ano só ao Courier: Ka e Fiesta ficam sem ano e **somem da busca com ano**, pela regra nova. Pergunta: "Em 'Ka, Fiesta, Courier 1993+', o 1993+ vale para os três ou só para o Courier?" Se valer para os três, a regra muda em todo o catálogo. Dono: `web-site`.
- **P2. Os veículos que estão só no texto: leitura automática ou correção na base?** A leitura automática pega a maior parte, mas sempre vai sobrar erro (U1). Opções:
  - (a) A tela continua lendo o texto, e os casos errados se corrigem um a um no texto da base.
  - (b) O `catalogo-dados` passa esses veículos para o campo de veículos da base (v29, com LOG_CORRECOES e simulação da base antes), e a tela deixa de adivinhar.

  **Recomendo (a) agora**, com a lista dos erros conhecidos corrigida antes da versão final, e (b) como tarefa à parte se os erros forem muitos.

## Donos

| Achado | O quê | Dono |
|---|---|---|
| U1 🔴 | Erros de leitura (Versailes, Pick Up, Saxo, "(após") corrigidos antes da versão final | `web-site` ou `catalogo-dados`, conforme a P2 |
| U2 🟡 | Linhas do mesmo modelo juntas | `web-site` |
| U3 🟡 | Versão sem "todos", sem parênteses em volta e sem parêntese solto | `web-site` |
| U4 🟡 | Prints de produto com detalhe longo e com "s/ ABS" | `testes` |
| P1, P2 | Perguntas ao Alexandre; a contagem de Polo 2026 (de 56 para 21) vai como informação | `po` |

## Reteste

Depois das respostas e de U1 a U3: `depois-1366-janela-BCE3001.png` e `depois-390-janela-BCE3001.png` refeitos, as janelas da CXD13022 e da INT16530, e os prints do U4.
