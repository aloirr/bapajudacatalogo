# T-0017 · v25 da base unificada: SIMULAÇÃO aprovada (R-20261121-154533-alexandre) e gravada

Pedido: **R-20261121-112900-alexandre**, item 4 (o Palio no AMT7500; o texto literal está no RESUMO).
- Base de partida: v24 (sha256 `2f57ba30…5d10`; a simulação rodou sobre a 1ª gravação da v24, `a77de850…04d2`, que diferia no texto de 21 linhas do LOG_CORRECOES e na linha "Formato" do LEIA-ME, onde a 1ª gravação ainda dizia "A VEICULOS ganha 21 linhas no fim"). Gravada pelo `dados/scripts/base_v25.py` sobre a v24, com a cópia em `dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v25.xlsx` (sha256 `4954ab91…ac93`).

## Arquivos
- `RESUMO.md`: o resultado da busca nos catálogos antigos, o antes e o depois, a linha nova da VEICULOS e a fonte.
- `SIMULACAO_v25_T-0017.xlsx`, com as abas:
  - LEIA;
  - ANTES_DEPOIS: a célula APLICACAO do AMT7500;
  - VEICULOS_NOVA;
  - BUSCA: cada registro dos catálogos antigos com o AMT7500 ou uma referência dele.
- `numeros_v25.json`: as contagens, por arquivo procurado.
- `simular_v25.py`: o script. Ele só lê e usa o `base_comum`. Uso, na raiz do repositório: `python3 -I dados/simulacoes/T-0017-v25/simular_v25.py dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx dados/simulacoes/T-0017-v25`.
