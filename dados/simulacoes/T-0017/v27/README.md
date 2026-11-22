# T-0017 · v27 da base unificada: SIMULAÇÃO aprovada (R-20261122-012933-alexandre) e gravada

Pedido: **R-20261121-210229-po** e **R-20261121-200058-alexandre**, item 4, mais o RD-0293 (as contagens e as perguntas estão no `LEIA.md`).
- Aprovada no **R-20261122-012933-alexandre** ("Seguir o recomendado pelo gerente", via po):
  - 1 b, TRANSMISSÃO;
  - 2 a, o uso citado primeiro;
  - 3 a, 2010–2019 nos 4 veículos do TER5597056;
  - 4 a, o Amarok fica "Diant. Dir.";
  - tirar a repetição do DETALHE_CATALOGO das 13 embreagens;
  - gravar como simulada.
  - Na leitura do PO, as embreagens são o item 5 e a gravação é o 6; no `LEIA.md`, é o contrário. As duas respostas são "a".
- Base de partida: v26 (sha256 `3a9f589d…2f2a`). A simulação aprovada é o commit bb4de8d.
- Gravada pelo `dados/scripts/base_v27.py` sobre a v26, com a cópia em `dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v27.xlsx` (sha256 `30028442…2018`).
  - Mudaram 124 células da PRODUTOS: 3 APLICACAO, 108 SISTEMA e 13 DETALHE_CATALOGO.
  - O LOG_CORRECOES ganhou 124 linhas e o LEIA-ME, 7.
  - O `--conferir` dá 0 diferença fora do permitido.
  - A marca de revisão segue em 5.120 células.
  - O formato e os valores de SISTEMA da casa não mudam.

## Arquivos
- `LEIA.md`: a simulação como foi ao Alexandre (contagens, antes e depois, perguntas).
- `SIMULACAO_v27_T-0017.xlsx`, com as abas:
  - ANTES_DEPOIS, lida pelo `base_v27.py` na gravação;
  - ROLAMENTOS;
  - TER5597056_OPCOES;
  - SITE;
  - LOG_CORRECOES_PREVISTO.
- `numeros_v27.json`: as contagens.
- `simular_v27.py`: o script. Ele só lê e roda o `scripts/gerar_site.py` numa cópia. Uso, na raiz do repositório: `python3 -I dados/simulacoes/T-0017/v27/simular_v27.py dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v26.xlsx dados/simulacoes/T-0017/v27`.
