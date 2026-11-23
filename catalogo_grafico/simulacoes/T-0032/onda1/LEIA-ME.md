# T-0032 · Onda 1: os 8 portfólios com as 11 melhorias altas (simulação)

Isto é só simulação: nada foi para `entregas/`.

- **Decisões:** R-20261123-162032-po, decisões 8b, 9a, 10a a 17a e 6b.
- **Como foi gerado:** em 23/11/2026, com a base v28 de `dados/`, `PYTHONHASHSEED=0` e o `gerador/portfolio.py`.
- **Comparação ("antes"):** o Portfólio geral aprovado na T-0029 (ee49e32, 87 páginas) e os portfólios por linha da simulação anterior.

## Os 8 PDFs (nomes finais)

| Arquivo | Páginas |
|---|---|
| `Portfolio_Produtos_BAP_AUTOPARTS.pdf` (geral) | 87 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Leve.pdf` | 44 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Pesada.pdf` | 28 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Moto.pdf` | 11 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Lubrificantes.pdf` | 10 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Acessorios.pdf` | 7 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Baterias.pdf` | 6 |
| `Portfolio_Produtos_BAP_AUTOPARTS_Linha_Autocenter.pdf` | 24 |

O geral continua com 87 páginas, mas a composição mudou:
- entrou 1 página com a tabela das baterias da Linha Leve;
- saiu 1 página, porque Fluidos DOT e Água Desmineralizada passaram a dividir a mesma página.

## Antes e depois (`antes_depois/`): uma página por melhoria

| # | Melhoria | Página-exemplo (antes → depois) |
|---|---|---|
| 1 | Modelo dos 7 | geral p44 (divisória da Pesada) → Linha Pesada p03 (divisória única com página) |
| 2 | Cada linha só com os veículos dela | geral p39 → p40, Linha Leve, Filtros de Combustível |
| 3 | Caixa de filtro: nenhuma foto errada | geral p63 → p64, Linha Pesada, Filtros de Óleo (ícone) |
| 4 | Tirar o que não é veículo | geral p85 → p85, Universal, Rolamentos ("Uso universal: …") |
| 5 | Cabeçalho com menos níveis | geral p05 → p05, Amortecedores |
| 6 | Corte só com "…" | geral p25 → p25, Bomba d'Água |
| 7 | Glossário de "linha" e 15a | geral p02 → p02, Quem somos |
| 8 | Aplicações por montadora | geral p14 → p14, Terminal Axial |
| 9 | Especificações em 2 colunas e tabela da Bateria (14a) | geral p32 → p33 (tabela com o código BAP); Óleos de Motor (Universal) |
| 10 | Índice com página e link | geral p04 → p04, divisória da Linha Leve |
| 11 | 2 produtos por página | geral p82 → p83, Universal, Fluidos DOT e Água Desmineralizada |
| 17a | Capa com "N produtos · N itens" | Linha Lubrificantes p01 |

As pastas `png/<pdf>/` têm todas as páginas, a 100 ppi. Elas ficam só na pasta de trabalho, fora do Git.

`INDICE_ONDA1.txt` traz as páginas, as seções, as famílias e os produtos dos 7 portfólios.

## Limites e suposições

- **3 (foto da caixa de filtro):**
  - Não existe foto das caixas de filtro de óleo, de combustível, de cabine nem de "outros filtros".
  - Pela decisão 6b, essas páginas mostram um ícone de filtro.
  - Só a página de Filtros de Ar continua com a foto da caixa.
- **11 (meia página):**
  - Juntam-se só 2 produtos da mesma seção (sistema).
  - Um produto cabe em meia página com até 4 especificações ou até 3 montadoras.
  - [SUPOSIÇÃO] O limite de 3 montadoras é o que cabe em meia página.
  - Com essa regra, só estas páginas juntaram produtos:
    - no geral, os Químicos (Fluidos DOT e Água Desmineralizada);
    - na Lubrificantes, o Óleo 4T com o Óleo Hidráulico, e os Químicos.
  - A Pesada e a Moto têm produtos com pouca aplicação, mas cada um está sozinho no seu sistema.
- **2 (só os veículos da linha):** a regra junta o `taxo.HEAVY` da T-0029 com um complemento local (`PESADO_EXTRA`: Volvo VM, D-40 a D-70, A-40 e 6-80).
  - Na Linha Leve, a Embreagem Remanufaturada ficou sem aplicação, porque todas as aplicações dela são de caminhão.
  - A aplicação que mistura leve e pesado numa linha só da base (por exemplo, "D10/D20/D40/D60") continua.
  - O ideal é corrigir isso na base (`catalogo-dados`).
- **8 (montadora):**
  - Quando falta a montadora, ela vem da palavra do modelo, tirada das aplicações que trazem montadora (`mapa_modelos`).
  - O que não tem montadora conhecida sai no fim da lista, sem negrito.
- **Texto de aplicação da base:** "Caminhões, Ônibus" e "Utilitários leves" continuam como estão. A correção é na base (`catalogo-dados`).
- **Vela de ignição (`dimg/cover_29.png`):** a foto tem uma gravação pequena no sextavado. Vale o `design-de-marca` conferir se é marca de outro fabricante.
- **Linha Baterias, capa:** continua "Linha Leve e Linha Pesada · 47 itens" (MC-0021, aprovada no modelo da 9a). Nos outros portfólios, a capa diz "N produtos · N itens" (17a).
