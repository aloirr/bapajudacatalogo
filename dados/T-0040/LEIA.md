# T-0040 · Lista de trabalho dos anos: como usar

## Situação na v30 (27/11/2026)

A lista abaixo é a da **v29**: foi a entrada da pesquisa na internet (d3e4b8d, branch `po/T-0040-anos`). A **v30**
aplicou essa pesquisa na VEICULOS (`dados/scripts/base_v30.py`, aprovada em R-20261127-150417-alexandre). O antes e
depois linha a linha está em `v30/antes_depois_v30.xlsx`, e o aviso para a BAP Central em `AVISO_BAP_CENTRAL.md`.

- 1.117 linhas da lista receberam o ano: 930 completadas e 187 com o ano trocado. As 300 marcadas na revisão da P12
  passaram a `separado`, sem MOTIVO. O ANO_DUVIDA saiu em 90, as que ficaram com a faixa igual à da pesquisa.
- 24 ficaram com o ano atual (`manter_atual`, LOG `ANO_MANTIDO`).
- 92 não entraram e ficam para nova pesquisa: 86 conflitos novos (o ano atual fica fora da faixa pesquisada; o Taos
  do INT16501 é um deles) e 6 conflitos sem resolução (aba DIVERGENCIAS).
- 2.941 não foram resolvidas na pesquisa e ficam como estão.
- O `id_linha` continua valendo na v30: nenhuma linha entrou ou saiu da VEICULOS.

Arquivo: `pendentes_internet.csv` (a lista de trabalho; até o RD-0696 se chamava `lista_trabalho.csv`, com o mesmo
conteúdo) (UTF-8, separador `;`), uma linha por aplicação (produto × veículo) da aba VEICULOS
da base **v29** (refeita em 27/11/2026: 4.174 linhas, antes 7.293 na v28). Saíram as 3.119 linhas que receberam o ano
da Fraga (regra 1a nova, R-20261127-053555-po); ficam as que a Fraga não cobre (o modelo não está na Fraga, os 27
achados por referência e os 483 não achados) e as 472 em conflito (o ano atual fica fora da faixa da Fraga; aba
CONFLITOS da `simulacao/antes_depois.xlsx`).

## Regras da soma da Fraga (v29), para quem pesquisa

- A linha atual que tem VERSAO ou CILINDRADA absorve a Fraga do mesmo motor quando a faixa cabe ou se encosta (junta
  a faixa). A linha atual sem VERSAO e sem CILINDRADA não absorve: a Fraga entra ao lado, com o detalhe do motor. Por
  isso o Escort do BCE3001 absorveu e o Fox do CXD13062 não.
- "Se encostam" = até 1 ano de distância (ex.: 2005–2010 e 2011–2014 viram 2005–2014).
- A linha sem ano completo só recebe o ano da Fraga se não tem ano nenhum ou se o ano que tem cai na faixa da Fraga.
  Em conflito, fica como está (e continua nesta lista) e a Fraga entra como linha somada.
- O po e o Alexandre decidem se essas regras mudam. Refazer: `python3 dados/scripts/lista_T0040.py` (só lê a base).

- `id_linha` = número da linha de dados na aba VEICULOS (linha do Excel = id_linha + 1). Pula números: as linhas
  que já têm início e fim não entram. A resposta da pesquisa volta para a base por esse número.
- `tipo`: `sem_ano` (sem início e sem fim), `so_inicial` (`ano_atual` = "AAAA+") e `so_final` (`ano_atual` =
  "até AAAA").
- Sem preço, estoque ou dado interno: descrição e referências como o site mostra.

## Decisões do Alexandre (26/11/2026, via po)

1. As linhas duvidosas (veículo que pode estar errado) entram todas na pesquisa.
2. As 81 linhas só com o ano final entram (`tipo` = `so_final`).
3. Ano solto (ex.: "08/2022") vale como "em diante" até ser confirmado.
4. Veículo ainda em produção: ano final 2026, sem marca. Se o ano inicial e o final forem iguais, fica igual
   (ex.: 2019 a 2019).
5. Os 2 itens universais (FLU15001 e FLU15002) ficam sem ano e saíram da lista.

## Regra da pesquisa

Ano só com fonte: anote a URL de cada ano achado. Sem fonte, a célula fica vazia. Nada é gravado na base antes da
simulação aprovada.
