# T-0017 · v26 da base unificada: SIMULAÇÃO aprovada (recado de 21/11 ~15:45, via po) e gravada

Pedido: **R-20261121-190649-alexandre**, item 3 (o CV-F35 confirmado no R-20261121-190933-alexandre). Junta o SCE14002 (LS da Mercedes-Benz), a Bongo do CRU100, as linhas normais da VEICULOS (HR, LS, Parati e Santana), o fim 2013 do CV-F35 e os nomes "Mbb", "Vwc" e "NEW Beetle".
- Aprovada no **R-20261121-195140-alexandre** ("1 a 2 a 3 a 4 a", via po): "Mbb" → "MB"; também entram as outras grafias ("MBB" → "MB", "NEW BEETLE" / "New beetle" / "New Beatle" → "New Beetle", "Vw" → "VW"); o "MB … MB" fica.
- Base de partida: v25 do main 8de7a6d (sha256 `4954ab91…ac93`). Gravada pelo `dados/scripts/base_v26.py` sobre a v25, com a cópia em `dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v26.xlsx` (sha256 `8e0c222e…47cc`).
- A simulação aprovada é o commit 267a7c9. Depois do "aprovado", a planilha foi refeita com as 14 células das outras grafias, para o registro bater com o gravado.

## Arquivos
- `RESUMO.md`: a contagem, o antes e o depois de cada célula, as linhas novas da VEICULOS, o que fica de fora e o que muda no site.
- `SIMULACAO_v26_T-0017.xlsx`, com as abas:
  - LEIA;
  - ANTES_DEPOIS: as 45 células (35 da PRODUTOS e 10 da VEICULOS), uma por linha, com a célula inteira (lida pelo `base_v26.py` na gravação);
  - VEICULOS_NOVA: as 4 linhas novas;
  - FORA: o que fica como está, e por quê;
  - SITE: cada chave do `produtos.json` que muda;
  - LOG_CORRECOES_PREVISTO: o resumo das 49 linhas (o texto inteiro está na base).
- `numeros_v26.json`: as contagens.
- `simular_v26.py`: o script. Rodado sobre a v25, ele só lê, usa o `base_comum` e confere a base simulada com a v25 célula a célula. Roda o `scripts/gerar_site.py` numa cópia, em pasta temporária. Uso, na raiz do repositório: `python3 -I dados/simulacoes/T-0017-v26/simular_v26.py dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v25.xlsx dados/simulacoes/T-0017-v26`.

## Conferência da gravação
- `base_v26.py --conferir`: saída 0. A PRODUTOS tem 35 células mudadas e a VEICULOS, 10, mais 4 linhas no fim. O LOG_CORRECOES ganhou 49 linhas e o LEIA-ME, 8. Nenhuma diferença fora do permitido.
- A marca de revisão não aparece em nenhum valor novo (células, linhas novas, LOG e LEIA-ME), fora o nome da coluna ANO_DUVIDA.
- `scripts/gerar_site.py` com a v26: 4.419 produtos, sem `[PARADO]`. Mudam 34 produtos: 33 no "a" e 3 no "ve" (SCE14002, CRU100 e CIL8546). O `produtos.json` vai em PR do `web-site`.
