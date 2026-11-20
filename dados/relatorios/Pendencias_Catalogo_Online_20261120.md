# Pendências do catálogo online · 20/11/2026 (T-0004)

Fonte: `site/data/produtos.json` (gerado em 20/11/2026 09:19), 4679 produtos no site. Planilha: `dados/relatorios/Pendencias_Catalogo_Online_20261120.xlsx`. Só dados de catálogo; nenhum dado interno ou comercial.

| Aba | Total | Detalhe |
|---|---:|---|
| FOTOS_QUE_FALTAM | 3266 | sem arquivo: 3266; arte indisponível: 0 |
| SEM_APLICACAO | 106 | APLICACAO vazia: 105; texto que não é aplicação: 1 (TER556556) |
| SEM_REFERENCIA | 170 | REFERENCIAS_CRUZADAS vazia no site |

Os 154 códigos só de número (numerados de 1 a 164; 152 Terminal Axial e 2 Cubo de Roda) estão com OBS "em revisão na T-0007".

[SUPOSIÇÃO] o MOTIVO sai todo "sem arquivo", porque o commit 4414fa7 do main tirou a arte e o `i` desses produtos; dos 3.266, 1.007 eram a arte antes (efb39e9).

Os códigos HYUNDAI, KIA MOTORS, VEÍCULO (Cruzetas) estão com OBS "CODIGO_BAP parece título de tabela, não código: conferir na base".

## FOTOS_QUE_FALTAM · top 10 por PRODUTO

| PRODUTO | Qtd |
|---|---:|
| Filtros | 374 |
| Terminal Axial | 226 |
| Pastilha de Freio | 206 |
| Caixa de Direção | 205 |
| Rolamentos | 194 |
| Amortecedores | 182 |
| Junta Homocinética | 166 |
| Terminais de Direção | 158 |
| Bandejas de Suspensão | 145 |
| Cubo de Roda | 143 |

## FOTOS_QUE_FALTAM · top 10 por SISTEMA

| SISTEMA | Qtd |
|---|---:|
| DIREÇÃO | 589 |
| SUSPENSÃO | 538 |
| FREIO | 406 |
| FILTRAÇÃO | 374 |
| RODAGEM | 368 |
| TRANSMISSÃO | 367 |
| ELÉTRICA | 264 |
| MOTOR | 203 |
| ACESSÓRIOS | 71 |
| ARREFECIMENTO | 44 |

## SEM_APLICACAO · top 10 por PRODUTO

| PRODUTO | Qtd |
|---|---:|
| Baterias | 47 |
| Cilindro de Roda | 14 |
| Cintas e Catracas | 14 |
| Catraca de Freio | 13 |
| Rodas de Aço e Alumínio | 10 |
| Fluidos e Químicos | 3 |
| Caixa de Direção | 2 |
| Kit Batente de Amortecedor | 1 |
| Palhetas Limpa-Parabrisa | 1 |
| Terminais de Direção | 1 |

## SEM_APLICACAO · top 10 por SISTEMA

| SISTEMA | Qtd |
|---|---:|
| ELÉTRICA | 47 |
| FREIO | 27 |
| ACESSÓRIOS | 15 |
| RODAGEM | 10 |
| DIREÇÃO | 3 |
| QUÍMICOS | 3 |
| SUSPENSÃO | 1 |

## SEM_REFERENCIA · top 10 por PRODUTO

| PRODUTO | Qtd |
|---|---:|
| Baterias | 47 |
| Fluidos e Químicos | 30 |
| Óleo Lubrificante | 24 |
| Amortecedores | 20 |
| Cintas e Catracas | 14 |
| Catraca de Freio | 13 |
| Filtros | 8 |
| Cruzetas | 3 |
| Caixa de Direção | 2 |
| Kit Batente de Amortecedor | 2 |

## SEM_REFERENCIA · top 10 por SISTEMA

| SISTEMA | Qtd |
|---|---:|
| ELÉTRICA | 47 |
| QUÍMICOS | 30 |
| LUBRIFICANTES | 24 |
| SUSPENSÃO | 23 |
| ACESSÓRIOS | 14 |
| FREIO | 13 |
| FILTRAÇÃO | 8 |
| RODAGEM | 6 |
| TRANSMISSÃO | 3 |
| DIREÇÃO | 2 |

## Base unificada (não mudou)

- sha256 antes: `0309fc8faa15984ac6ea3bc10d7ec8f7fd6c6342c5a652186452b834ad6ddc37`
- sha256 depois: `0309fc8faa15984ac6ea3bc10d7ec8f7fd6c6342c5a652186452b834ad6ddc37`
