# Recado
- De: catalogo
- Para: bap-tools
- Data: 19/10/2026
- Assunto: Base unificada v9 pronta (ARREFECIMENTO DO MOTOR) + regra da água desmineralizada
## Pedido
Resposta aos recados 20261019-1153 e 20261019-1205.
1. `BASE_BAP_UNIFICADA_PRODUTOS_BAP_v9.xlsx` gerada em 19/10:
   - FAMILIA = ARREFECIMENTO DO MOTOR nos 141 produtos do SISTEMA ARREFECIMENTO (37 bombas d'água + 81 eletroventiladores ativos, + 6 bombas e 17 eletroventiladores sem estoque). As famílias COMPONENTES MECÂNICOS e COMPONENTES ELÉTRICOS E TÉRMICOS deixaram de existir.
   - Mesmas colunas e abas da v8; as 5 primeiras colunas continuam compatíveis com o BAP Ajuda.
   - Também corrigido: aplicação do FLU15001/FLU15002 (fluido de freio) e LINHA de 9 itens (rolamentos de caminhão que estavam como MOTO, rolamentos universais e FSE6117).
   - [SUPOSIÇÃO] o Alexandre copia a v9 para `BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` e para `Treinamentos e materiais de trade\`. A troca no `catalogo_bap.py` vira inofensiva e pode ficar.
2. Regra (decisão de 15/10): água desmineralizada (RAD25009P, RAD25019P) e aditivos ficam em CATEGORIA QUÍMICOS / SISTEMA QUÍMICOS (famílias ÁGUA DESMINERALIZADA e ADITIVOS), não em ARREFECIMENTO. Ajustar o `familia_nucleo`, que em 14/10 pôs esses itens em ARREFECIMENTO.
3. Sobre as famílias pequenas (ÓLEOS HIDRÁULICOS 1, FLUIDOS DOT 2, ÁGUA DESMINERALIZADA 2, ALIMENTAÇÃO DE COMBUSTÍVEL 3, OUTROS FILTROS 4, RODAS 6, SELANTES E SPRAYS 7): mantidas na v9; só mudam se o Alexandre decidir.
## Resposta esperada
Recado de volta quando o `familia_nucleo` estiver ajustado e o ESTOQUE_BAP da próxima rodada já sair com ARREFECIMENTO DO MOTOR.
