# Aviso para a BAP Central · base v29 (T-0040)

A BAP Central lê a base unificada (`dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`). Na v29 o formato das abas não muda, mas a aba VEICULOS ganha um **valor novo** e mais que dobra de tamanho.

## O que muda

- **VEICULOS, coluna ORIGEM:** valor novo **`Fraga T-0040`**. Até a v28 a coluna só tinha `automático`. Na v29 são 35.758 linhas `Fraga T-0040` e 1.992 `automático`.
  - Quem filtra ou valida a ORIGEM por uma lista fechada de valores tem de aceitar o novo.
- **VEICULOS, tamanho:** de 17.296 para 37.750 linhas de dados. Os 3.909 códigos achados pela Fraga pelo código BAP trocaram as linhas antigas pelas da Fraga: uma linha por código, montadora, modelo e motor, com o ano mínimo (ANO_INICIO) e o máximo (ANO_FIM).
  - A VERSAO passa a trazer o motor da Fraga e, quando houver, a observação (ex.: `EA111 VHT 1.6 L 8V SOHC L4 · DIANT`).
  - A grafia das montadoras e dos modelos é a da base quando casa sem acento e sem espaço; senão, vem da Fraga (em maiúsculas).
- **LOG_CORRECOES, coluna TIPO:** valor novo **`VEICULO_TROCADO`** (3.909 linhas, uma por código).

## O que não muda

- As abas, a ordem delas e as colunas: a VEICULOS continua com as mesmas 11 colunas, na mesma ordem (CODIGO_BAP, FABRICANTE, MODELO, VERSAO, ANO_INICIO, ANO_FIM, ORIGEM, SITUACAO, MOTIVO, CILINDRADA, ANO_DUVIDA).
- A aba PRODUTOS não muda (as 5 primeiras colunas e o texto da APLICACAO ficam como estavam).
- Os valores da SITUACAO continuam `separado` e `duvidoso`.

## Situação

A v29 está no branch `catalogo-dados/T-0040-v29`, **pendente do aprovado do Alexandre** (simulação 9b11dd1, corrigida em 6b32eb8). Só vale depois do merge no `main`.
