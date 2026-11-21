# T-0017 · v26 da base unificada: SIMULAÇÃO aprovada (R-20261121-195140-alexandre) e gravada

Pedido: **R-20261121-190649-alexandre**, item 3 (o CV-F35 no R-20261121-190933-alexandre; a aprovação está no RESUMO).
- Base de partida: v25 do main 8de7a6d (sha256 `4954ab91…ac93`). Gravada pelo `dados/scripts/base_v26.py` sobre a v25, com a cópia em `dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v26.xlsx` (sha256 `3a9f589d…2f2a`).
- A simulação aprovada é o commit 267a7c9. Depois do "aprovado", a planilha foi refeita com as 14 células das outras grafias, para o registro bater com o gravado (e, no RD-0271, só na coluna FONTE).

## Arquivos
- `RESUMO.md`: a contagem, o antes e o depois de cada célula, as linhas novas da VEICULOS, o que fica de fora e o que muda no site.
- `SIMULACAO_v26_T-0017.xlsx`, com as abas:
  - LEIA;
  - ANTES_DEPOIS: uma célula por linha (PRODUTOS e VEICULOS), com a célula inteira (lida pelo `base_v26.py` na gravação);
  - VEICULOS_NOVA: as linhas novas;
  - FORA: o que fica como está, e por quê;
  - SITE: cada chave do `produtos.json` que muda;
  - LOG_CORRECOES_PREVISTO: o resumo de cada linha (o texto inteiro está na base).
- `numeros_v26.json`: as contagens.
- `simular_v26.py`: o script. Ele só lê, usa o `base_comum` e roda o `scripts/gerar_site.py` numa cópia. Uso, na raiz do repositório: `python3 -I dados/simulacoes/T-0017-v26/simular_v26.py dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v25.xlsx dados/simulacoes/T-0017-v26`.
