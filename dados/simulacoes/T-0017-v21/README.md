# T-0017 · v21 da base unificada: simulação APROVADA e gravada

Aprovada em **R-20261120-213300-alexandre**. Texto literal: "a) aprovado, mas nao marque nem escreva nada como duvidoso."
- **R-20261120-213800-alexandre** ("a) sim") confirmou que a P11 e a P12 não entram.
- **R-20261120-213900-alexandre** ("3) a") pôs a P14 na mesma v21.

Gravada pelo `dados/scripts/base_v21.py` sobre a v20 (sha256 `4372f449…d24b`).

## Arquivos
- `SIMULACAO_v21_T-0017.xlsx`: a simulação mostrada ao Alexandre, igual à de `recados/anexos/T-0017/v21-sim/`.
- `RESUMO_v21_T-0017.md`: as perguntas P1 a P13, com a recomendação de cada uma.
- `numeros_v21.json`: as contagens.
- Os scripts, que só leem: `carregar.py` (a base sem os DADOS_ADICIONAIS), `antigas.py`, `variante.cjs` e `simular_v21.py`.

## O que entrou
- **P1 a P8 e P13, como recomendado,** e os itens sem pergunta (1, 3, 5, 6 e 8):
  - 105 células da APLICACAO;
  - 334 da REFERENCIAS_CRUZADAS.
- As células da APLICACAO são as da aba **TODAS_AS_CELULAS** (de V20 para FINAL).
  - Na REFERENCIAS_CRUZADAS, a simulação mostra o fornecedor como "[fornecedor omitido]". Por isso as 4 trocas foram refeitas no script ("Cofap:" → "COFAP:", "Marca Ref. NAKATA:" → "NAKATA:", "RT#:" → "RT:" e o Bosch do MF21), e o resultado foi conferido com a mesma máscara.
- **P13:** saíram da PRODUTOS as 3 linhas falsas ("Veículo", "HYUNDAI", "KIA MOTORS").
  - Eram as linhas da tabela de aplicação do CRU100 na planilha de origem.
  - O conteúdo inteiro das 18 colunas de cada uma está no LOG_CORRECOES.
  - As linhas de baixo subiram 3, e o filtro da aba termina na nova última linha.
- **P14** (fora da planilha; pedida depois): o ANO_FIM perdido na VEICULOS, só onde o texto da APLICACAO prova.
  - **ELE1084 Gol:** fica 1984–1994, porque o texto diz "1984->1994".
  - **KF27 Civic:** fica 2006–2006, porque o texto diz "Civic 2006", sem o "→" que a mesma célula usa para "em diante".
  - **CV-F35 Fiesta:** ficou 2010 em diante. O texto tem "Fiesta … 05/2010–04/2013" e também "Fiesta … Ti-Vct/ Sigma 04/2013" (a partir de 04/2013), e a linha junta os dois pela faixa mais larga (V3 da v20).

## O que NÃO entrou, e por quê
Pela decisão "nao marque nem escreva nada como duvidoso", nada novo foi marcado ou escrito como duvidoso. As abas da planilha continuam aqui como foram mostradas:
- **P9 (aba 09_ANO_DE_VARIANTE):** o ANO_DUVIDA das 617 linhas de variante ficou como estava.
- **P10 (aba 10_V7_V8, JUH70010):** ficou como estava.
- **P11 (aba 10_V7_V8, os 3 "X1"):** ficaram como estavam (R-20261120-213800-alexandre).
- **P12 (aba 10b_V8_VEICULOS_NOVOS):** as 50 linhas não entraram (R-20261120-213800-alexandre).

## Formato
- As abas e as colunas são as mesmas da v20.
- A PRODUTOS tem 3 linhas a menos.
- O LOG_CORRECOES ganha 443 linhas:
  - uma por código na PRODUTOS;
  - as 3 linhas tiradas;
  - uma por célula da VEICULOS.
- O LEIA-ME ganha o bloco da v21.
