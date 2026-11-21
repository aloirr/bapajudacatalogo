# T-0017 · v19 da base unificada: simulação APROVADA e gravada

Aprovada em **R-20261120-184000-alexandre** (item 4). Texto literal: "p3 1960 quer dizer 1996, corrigir. p9 quero entender melhor demais recomendações, pode seguir".

A P9 foi decidida depois, em **R-20261120-184600-alexandre** ("1) a"): vale a proposta da planilha.

Gravada na v19 pelo `dados/scripts/base_v19.py`.

## O que foi gravado
- **Fonte:** a v18 (sha256 `2bfac384…9d9b`).
- **Mudam só 3 colunas da aba PRODUTOS:** APLICACAO, REFERENCIAS_CRUZADAS e OFERECA_JUNTO.
  - Mais as linhas novas do LOG_CORRECOES, uma por código.
  - O LEIA-ME e as outras abas não mudam.
- **As células são as da aba `TODAS_AS_CELULAS` desta simulação, com 1 exceção:**
  - **P3:** o "1960" era 1996 digitado errado. Nas 35 células da P3, o "1960–2026" vira **"1996–2026"**, e o veículo fica com o ano.
    - Isso vale também para as variantes, como o "1960 ATÉ 2026" do FAR6531.
    - A simulação tirava a faixa.
- **P9 (CFR9006):** a referência fica "SCHULZ: 816.5028-0", e o 815.5028-0 vai para o histórico "| ANTERIOR", como na proposta.
- **As outras perguntas** (P1, P2, P4 a P8, P10 a P13 e P15) seguem a recomendação da simulação.
- **A parte da aba VEICULOS não entra.** Ela tem simulação à parte.

## Números da gravação

| Coluna | Células |
|---|---|
| APLICACAO | 2.105 (35 com a P3) |
| REFERENCIAS_CRUZADAS | 549 (com o CFR9006) |
| OFERECA_JUNTO | 224 |

## Arquivos

| Arquivo | O que tem |
|---|---|
| `SIMULACAO_v19_T-0017.xlsx` | A simulação aprovada, igual à de `recados/anexos/T-0017/v19-sim/`. A aba LEIA traz as contagens, e há uma aba por item. As outras abas: TODAS_AS_CELULAS (v18 → final), 11_PARES_OJ, FICA_DE_FORA e LOG_CORRECOES_PREVISTO. O preço antigo do histórico aparece como "BAP BOX USD [valor omitido]" |
| `simular_v19.py` | Refaz a simulação (só leitura): `python3 -I simular_v19.py <base_v18.xlsx> <saida> <oj_pares.json>`. Sem o `oj_pares.json` (os pares do OFERECA_JUNTO medidos no site, que não estão no repositório), ele refaz só a APLICACAO e a REFERENCIAS_CRUZADAS. Os pares estão na aba 11_PARES_OJ |
| `numeros.json` | Os números da simulação |

O resumo com as perguntas e as recomendações está em `recados/anexos/T-0017/v19-sim/RESUMO_v19_T-0017.md`.

## P15: nada a acrescentar na APLICACAO
- A P15 recomendava acrescentar na APLICACAO o que faltasse. A conferência deu:
  - no KHC12779, o "Automático" do A3 e do Bora já está como "Aut.";
  - no KHC12464D, o "Câmbio Direito" do Logan e do Sandero já está como "Câmbio Dir.".
- Por isso só sai o texto da referência, como na simulação.

## Formato (regra 6)
**O formato não muda:** as abas e as colunas são as mesmas, na mesma ordem.
- A BAP Central lê as 5 primeiras colunas da PRODUTOS: CODIGO_BAP, DESCRICAO, APLICACAO, REFERENCIAS_CRUZADAS e DADOS_ADICIONAIS.
  - CODIGO_BAP, DESCRICAO e DADOS_ADICIONAIS não mudam.
  - O **conteúdo** da APLICACAO e da REFERENCIAS_CRUZADAS muda. Isso pede um aviso de conteúdo, e não de formato.
- O histórico "| ANTERIOR" fica na REFERENCIAS_CRUZADAS (só sai o preço dele) e o site o corta no `refs_de` do `gerar_site.py`.
  - A base também é lida pela BAP Central e pelo PDF, que não passam pelo refs_de; o filtro do site fica como proteção.
