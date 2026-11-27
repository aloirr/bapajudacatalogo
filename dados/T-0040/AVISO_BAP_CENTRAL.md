# Aviso para a BAP Central · base v30 (T-0040)

A BAP Central lê a base unificada (`dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`). A v30 aplica na aba VEICULOS os anos da pesquisa na internet (pesquisa d3e4b8d, branch `po/T-0040-anos`). Abas, colunas e número de linhas ficam iguais aos da v29; mudam só valores de células da VEICULOS, e o LOG_CORRECOES ganha TIPOs novos (abaixo).

## O que muda

- **VEICULOS, anos:** 1.117 linhas recebem o ano da pesquisa (ANO_INICIO e ANO_FIM). 930 delas tinham o ano incompleto e foram completadas; nas outras 187, o ano atual foi trocado (conflito resolvido ou faixa da Fraga). Nenhuma linha entra ou sai: continuam 40.902 linhas de dados.
- **VEICULOS, SITUACAO e MOTIVO:** 300 linhas que ganharam ano passam de `duvidoso` para `separado`, e o MOTIVO delas fica vazio, como na v26. O texto de antes do MOTIVO está no LOG_CORRECOES.
  - Os valores da SITUACAO continuam `separado` e `duvidoso`; só há menos `duvidoso` (5.697 → 5.397).
  - Quem lê o MOTIVO: na v30, toda linha `separado` continua sem MOTIVO.
- **VEICULOS, ANO_DUVIDA:** 90 linhas ficam com o ANO_DUVIDA vazio, porque a faixa final é igual à da pesquisa.
- **VEICULOS, VERSAO do JUH70025:** as 3 linhas VOLKSWAGEN Gol do JUH70025 (ORIGEM `automático`) passam de VERSAO vazia para `1.6 L`, `1.8 L` e `2.0 L`, uma por cilindrada.
- **LOG_CORRECOES, coluna TIPO:** dois valores novos, **`ANO_SUBSTITUIDO`** (o ano atual foi trocado pelo da pesquisa) e **`ANO_MANTIDO`**. O `ANO_MANTIDO` é só uma linha de registro: a pesquisa confirmou o ano atual e **nenhuma célula muda**. Também entram linhas `ANO_COMPLETADO` e `CORRECAO_VEICULO`, TIPOs que já existem. Fica uma linha por código e tipo: 440 linhas novas.

## O que não muda

- As abas, a ordem delas e as colunas: a VEICULOS continua com as mesmas 11 colunas, na mesma ordem (CODIGO_BAP, FABRICANTE, MODELO, VERSAO, ANO_INICIO, ANO_FIM, ORIGEM, SITUACAO, MOTIVO, CILINDRADA, ANO_DUVIDA).
- A aba PRODUTOS não muda (as 5 primeiras colunas e o texto da APLICACAO ficam como estavam).
- ORIGEM e CILINDRADA da VEICULOS não mudam.

## Situação

A v30 foi aprovada em R-20261127-150417-alexandre e vale a partir do merge no `main`. A v29 (soma da Fraga, ORIGEM `Fraga T-0040`) está no aviso do histórico do Git deste arquivo.
