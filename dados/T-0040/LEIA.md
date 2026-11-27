# T-0040 · Lista de trabalho dos anos: como usar

Arquivo: `lista_trabalho.csv` (UTF-8, separador `;`), uma linha por aplicação (produto × veículo) da aba VEICULOS
da base **v29** (refeita em 27/11/2026: 3.978 linhas, antes 7.293 na v28). Saíram as 3.315 linhas que receberam o ano
da Fraga (regra 1a nova, R-20261127-053555-po); ficam as que a Fraga não cobre (o modelo não está na Fraga, os 27
achados por referência e os 483 não achados). Refazer: `python3 dados/scripts/lista_T0040.py` (só lê a base).

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
