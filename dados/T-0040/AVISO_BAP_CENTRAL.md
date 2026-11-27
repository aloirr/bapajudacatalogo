# Aviso para a BAP Central · base v29 (T-0040)

A BAP Central lê a base unificada (`dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`). Na v29 a aba VEICULOS ganha um **valor novo** e mais que dobra de tamanho; abas e colunas ficam iguais (abaixo).

## O que muda

- **VEICULOS, coluna ORIGEM:** valor novo **`Fraga T-0040`** nas 23.602 linhas que entram da Fraga. As 17.296 linhas da v28 continuam todas, com `automático`, na mesma ordem; as da Fraga entram logo depois da última linha de cada código.
  - Quem filtra ou valida a ORIGEM por uma lista fechada de valores tem de aceitar o novo.
- **VEICULOS, anos das linhas `automático`:** 3.119 linhas sem ano completo receberam o ano inicial e o final da Fraga, e 913 tiveram a faixa aumentada (juntada com a da Fraga). A ORIGEM delas continua `automático`; a fonte do ano está no LOG_CORRECOES. Outras 472 linhas sem ano completo ficaram como estavam, porque o ano delas conflita com a faixa da Fraga.
- **VEICULOS, tamanho:** de 17.296 para 40.902 linhas de dados (4 delas são as linhas VOLKSWAGEN Gol do JUH70025 e do SFR30017, ORIGEM `automático`, no fim da aba; LOG `VEICULO_NOVO`, tipo que já existe).
- **Regras da soma:** a linha atual que tem VERSAO ou CILINDRADA absorve a Fraga do mesmo motor quando a faixa cabe ou se encosta (até 1 ano de distância: 2005–2010 e 2011–2014 viram 2005–2014); a linha atual sem VERSAO e sem CILINDRADA não absorve, e a Fraga entra ao lado, com o motor. Por isso pode haver, no mesmo código, uma linha `automático` sem versão e linhas `Fraga T-0040` do mesmo modelo com o motor.
  - Nas linhas da Fraga, a VERSAO traz o motor e, quando houver, a observação (ex.: `EA111 VHT 1.6 L 8V SOHC L4 · DIANT`).
- **VEICULOS, grafia das linhas da Fraga:** montadora e modelo seguem a da base. VOLARE vira `MARCOPOLO` / `Volare`; o modelo da Fraga que começa por um modelo da base da mesma montadora vira o da base ("SPRINTER FURGÃO" → `Sprinter`), e o resto vai para o começo da VERSAO. O que não casa fica como veio da Fraga.
- **LOG_CORRECOES, coluna TIPO:** valores novos **`VEICULO_SOMADO`**, **`ANO_COMPLETADO`** e **`FAIXA_JUNTADA`** (uma linha por código e tipo).

## O que não muda

- As abas, a ordem delas e as colunas: a VEICULOS continua com as mesmas 11 colunas, na mesma ordem (CODIGO_BAP, FABRICANTE, MODELO, VERSAO, ANO_INICIO, ANO_FIM, ORIGEM, SITUACAO, MOTIVO, CILINDRADA, ANO_DUVIDA).
- A aba PRODUTOS não muda (as 5 primeiras colunas e o texto da APLICACAO ficam como estavam).
- Os valores da SITUACAO continuam `separado` e `duvidoso`.

## Situação

A v29 está no branch `catalogo-dados/T-0040-v29`, **pendente do aprovado do Alexandre** (simulação cf9db10). Só vale depois do merge no `main`.
