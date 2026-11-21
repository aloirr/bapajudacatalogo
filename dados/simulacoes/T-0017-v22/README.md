# T-0017 · v22 da base unificada: simulação APROVADA e gravada

Pedido: **R-20261120-221700-alexandre** ("1) a"). Aprovada em **R-20261120-223000-alexandre**. Texto literal: "Siga recomendação do gerente" (P1 = a e P2 = a).

Gravada pelo `dados/scripts/base_v22.py` sobre a v21 (sha256 `2f1e442f…7e4e`).

## Arquivos
- `SIMULACAO_v22_T-0017.xlsx`: a simulação mostrada ao Alexandre, igual à de `recados/anexos/T-0017/v22-sim/`. O script lê a aba **ANTES_DEPOIS**.
- `RESUMO.md`: as perguntas P1 e P2, com a recomendação.
- `numeros_v22.json` e `analise_v22.json`: as contagens e as linhas analisadas.
- `analisar_v22.py` e `simular_v22.py`: os scripts, que só leem a base (os caminhos entram como argumento).

## O que entrou
- **23 células ANO_FIM** da VEICULOS em 9 códigos (ELE1060, ELE1066, ELE1068, ELE1070, ELE1071, ELE1077, ELE1080, ELE1084 e ELE1086).
- **P1 (a):** ELE1092, 4 células ANO_FIM (Escort, Verona, Logus e Pointer até 1996). A SITUACAO e o MOTIVO que já existiam ficaram.
- **P2 (a):** ELE1068 Uno. Na APLICACAO, só o trecho "19/84" virou "1984". Na VEICULOS, o Uno ficou 1984–1995 (ANO_INICIO e ANO_FIM).
- Nada novo marcado nem escrito como duvidoso (R-20261120-213300).
- As abas FICAM e SEM_VEICULOS são só informação: nada muda nelas.
- No LOG_CORRECOES previsto da simulação, o texto do ELE1068 Fiorino e Premio mostrava a faixa com início 1984. Na gravação, a faixa usa o ANO_INICIO de cada linha (Fiorino 1988–1995, Premio 1985–1992). Os valores gravados são os da simulação.

## Formato
- Mesmas abas e colunas da v21.
- O LOG_CORRECOES ganha 30 linhas, uma por célula.
- O LEIA-ME ganha o bloco da v22 no topo.
