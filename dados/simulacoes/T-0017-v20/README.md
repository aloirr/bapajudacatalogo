# T-0017 · v20 da base unificada: simulação da aba VEICULOS APROVADA e gravada

Aprovada em **R-20261120-191700-alexandre**, resposta à pergunta 4. Texto literal: "4) a". A opção era: "a) seguir as 9 recomendações (V1 a V9), 'aprovado', e gravar como v20".

Na mesma v20, o Alexandre decidiu em **R-20261120-194600-alexandre** (texto literal: "2) 1996") que o "1960" da APLICACAO do CXD13179, do ELE1018 e do ELE1030 é 1996.

Gravada na v20 pelo `dados/scripts/base_v20.py`, depois da v19 (PR #60).

## O que foi gravado
- **Fonte:** a v19 (sha256 `f4a610c9…8668`).
- **Mudam a aba VEICULOS e 3 células da APLICACAO**, mais as linhas novas do LOG_CORRECOES (uma por código e aba) e do topo do LEIA-ME.
  - As outras abas não mudam.
- **As células são as da aba `VEICULOS_DEPOIS` desta simulação**, com as 9 recomendações (V1 a V9):
  - ANO_INICIO e ANO_FIM preenchidos (ANO_FIM vazio = em diante; ANO_INICIO vazio = até);
  - 2 colunas novas no fim, depois de MOTIVO: **CILINDRADA** e **ANO_DUVIDA**;
  - V5: SITUACAO e MOTIVO do FLU15001 e do FLU15002.
- **Única troca no texto:** o MOTIVO da V5 dizia "(T-0017, v19)" e foi gravado como "(T-0017, v20)", a versão em que entrou.
- **Nenhuma linha entra nem sai:** são 17.270, e o veículo de cada uma (código, fabricante, modelo, versão e origem) não muda.
- **Partida:** a simulação foi feita sobre a v19 recriada numa cópia. Refeita sobre a v19 gravada (PR #60), a VEICULOS sai idêntica: a P9 (CFR9006) só mexe na REFERENCIAS_CRUZADAS.
- **O LEIA-ME** ganha no topo o bloco da v20 e o da v19, que a v19 não escreveu.

## O 1960 que é 1996 (R-20261120-194600-alexandre)
Como na P3 da v19, o "1960" era 1996 digitado errado. Muda só o ano; o resto do texto fica.

| Código | APLICACAO antes (fim do texto) | APLICACAO depois (fim do texto) |
|---|---|---|
| CXD13179 | FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1960> | FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1996> |
| ELE1018 | FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1960> | FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1996> |
| ELE1030 | FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1960> | FORA DA FROTA BRASILEIRA - Fora DA Frota Nacional 1996> |

- Na VEICULOS desses 3 códigos não há ano 1960: o bloco "Fora da frota" não tem veículo. Lá nada muda por isso.

## Números da gravação

| Coluna da VEICULOS | Células |
|---|---|
| ANO_INICIO | 13.851 |
| ANO_FIM | 10.027 |
| CILINDRADA (nova) | 6.997 |
| ANO_DUVIDA (nova) | 2.236 |
| SITUACAO (V5) | 2 |
| MOTIVO (V5) | 2 |

Na PRODUTOS, mudam 3 células da APLICACAO (o 1996).

O LOG_CORRECOES ganha 3.818 linhas: 3.815 da VEICULOS (uma por código) e 3 da APLICACAO. O LEIA-ME ganha 13.

## Fica para depois
- **V6, APLICACAO do TER5599096 e do TER5599097** ("New Civic 06/2011" → "2006–2011"): é texto da PRODUTOS e não entrou nesta versão (além do 1996, só a VEICULOS muda).
- **V7, JUH70010:** a v19 deixou "02/2009>" no texto. Se for "2002–2009", também é texto da PRODUTOS.
- **V8:** o conjunto de veículos que o texto da v19 mudaria (44 produtos), o "BMW X1" lido de "M14 X 1,5" e o "ml" lido como o modelo ML no extrator.
- Tudo isso precisa de simulação própria (regra 3).

## Arquivos

| Arquivo | O que tem |
|---|---|
| `SIMULACAO_VEICULOS_v19_T-0017.xlsx` | A simulação aprovada, igual à de `recados/anexos/T-0017/veiculos-sim/`. A aba LEIA traz as contagens; as outras: EFEITO_SITE, AMOSTRA_50, ANTES_E_DEPOIS (as 17.270 linhas), VEICULOS_DEPOIS (a aba como ficou), PAR_SE_PERDE, V7_ANO_SOLTO_MM, CASOS_DO_TESTES, CONJUNTO_V19, DUVIDAS, FORMATO_REGRA6 e LOG_CORRECOES_PREVISTO |
| `simular_veiculos.py` | Refaz a simulação (só leitura): `python3 -I -B simular_veiculos.py <worktree com a base v18> <base_v19.xlsx> <saida>`. Usa o extrator do `dados/scripts/base_v17.py` e o `scripts/gerar_site.py` do worktree |
| `numeros_veiculos.json` | Os números da simulação |

O resumo com as perguntas e as recomendações está em `recados/anexos/T-0017/veiculos-sim/RESUMO_VEICULOS_v19_T-0017.md`.

## Formato (regra 6)
**Muda o formato da aba VEICULOS:**
- 2 colunas novas no fim: a 10 (CILINDRADA, texto: "1.6", "1.0 / 1.6", "125cc") e a 11 (ANO_DUVIDA, texto: vazio = ano firme; preenchido = o motivo da dúvida, e o ano aparece mas não filtra);
- ANO_INICIO e ANO_FIM passam a vir preenchidos (número de 4 dígitos).

**Não muda:**
- as 9 colunas de antes da VEICULOS, com a mesma ordem e o mesmo nome, e as 17.270 linhas;
- o formato da aba PRODUTOS, com as 5 primeiras colunas que a BAP Central lê. O conteúdo da APLICACAO (coluna 3) muda em 3 células;
- a MODELOS_VEICULO e as outras abas.
