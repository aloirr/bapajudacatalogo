# Busca por medida: pneus, rolamentos e baterias (proposta da T-0006)

- Tarefa: `.coord/tarefas/T-0006.md`. Pedido do Alexandre: "T-0006 busca por medida (pneus, rolamentos, baterias) — proposta." (20/11/2026).
- Data: 22/11/2026 (Manaus). Base: v27 (main `7e5b0ee`). Só leitura da base e simulação no navegador: **o site do main e a base não mudam**.
- Feita na sessão Cowork de 22/11 (sem os guardiões), pelos papéis web-site (proposta e tela), catalogo-dados (levantamento) e testes (simulação).

## 1. Resumo

| Tipo | Itens no site | Medida que já está na base | Preenchida | Proposta | Muda a base? |
|---|---|---|---|---|---|
| Baterias | 47 | C20(AH), CCA-18°, tensão, reserva, CA +25C (DADOS_ADICIONAIS) | 46 de 47 (falta o KTB1500, kit de terminal) | filtros "Amperagem" (opções em Ah) e "Partida a frio (CCA)" | não |
| Pneus e câmaras moto | 21 (12 pneus e 9 câmaras) | aro (TAMANHO_ARO ou ARO) e medida (no começo do código do pneu; MEDIDA nas câmaras) | 21 de 21 (aro); 12 de 12 pneus (medida) | filtros "Aro" e "Medida do pneu" | não |
| Rolamentos | 194 | nenhuma em mm; a série está no código (ROL6203-2RS → 6203) | rígidos: 77 de 78; cônicos: 52 de 96 | fase 3: filtro "Série" pelo código; diâmetros em mm só com dado novo | só se o Alexandre quiser os diâmetros |

Ordem sugerida: **1) baterias, 2) pneus, 3) rolamentos**. As duas primeiras usam só o que a base já tem.

## 2. Como a busca responde hoje (site do main, 22/11/2026)

Busca de um campo só (q), no servidor estático de `site/`:

| Busca | Resultado | Leitura |
|---|---|---|
| `90/90-18` | 3 produtos (os 2 pneus 90/90-18 e a câmara CAR18) | a medida do pneu já é achada, porque está no código |
| `pneu aro 18` | 2 produtos (só as câmaras CAJ18 e CAR18) | os 4 pneus aro 18 ficam de fora: o aro do pneu não está no texto da busca |
| `6203` | 4 produtos (3 rolamentos ROL6203 e o FCB6203) | a série do rolamento rígido já é achada pelo código |
| `rolamento 25x52x15` | 1 produto | a medida em mm quase não existe na base |
| `bateria 60` | 9 produtos | acha pelos "60 AMPERES" da descrição, com 1 a mais |
| `60ah` | 4 produtos | acha só 4 das 8 baterias de 60 Ah |
| `bateria 500 cca` | 154 produtos | o CCA não é buscável: a busca cai nos "mais próximos" |

Conclusão: o código e a descrição já levam boa parte das medidas, mas falta **filtrar** por elas (Ah, CCA, aro) e falta o aro do pneu no texto da busca.

## 3. De onde vem cada medida (levantamento do catalogo-dados, só leitura)

Script: `docs/propostas/T-0006/medidas.py` (grava `medidas.json` com os códigos por medida; nada de preço, estoque, custo ou fornecedor).

### Baterias (47)
- `C20(AH)`: 46 preenchidas, 13 valores: 40 (2), 45 (4), 50 (8), 60 (8), 70 (3), 72 (1), 75 (6), 80 (1), 90 (4), 100 (3), 150 (2), 180 (2), 220 (2). É igual à `AMPERAGEM`.
- `CCA-18°`: 46 preenchidas, de 220 a 1200, 22 valores. Na proposta, em 5 faixas: até 400 (15), 401 a 500 (6), 501 a 600 (11), 601 a 800 (8), acima de 800 (6).
- `TENSÃO NOMINAL`: 12 V em todas (escrito "12V" e "12v"): não vale um filtro.
- Polo e dimensões: **não estão na base**. A chave `(COMP X LARG X ALT)` existe nas 46, mas vazia; o polo não aparece nem na descrição.
- A `FICHA` do `gerar_site.py` já mostra AMPERAGEM, C20(AH), CCA-18°, CA +25C, reserva e tensão na ficha técnica.

### Pneus e câmaras moto (21)
- Aro: `TAMANHO_ARO` nos 12 pneus e `ARO` nas 9 câmaras: aro 10 (1), 14 (2), 17 (9), 18 (6), 19 (2), 21 (1).
- Medida do pneu (largura/perfil-aro): no começo do código dos 12 pneus (ex.: `90/90-18 51P V425R`): 80/100-14, 60/100-17, 100/80-17, 110/70-17, 110/90-17, 130/70-17, 140/70-17, 2.75-18, 80/100-18, 90/90-18 (2) e 90/90-19.
- Câmaras: `MEDIDA` (ex.: 300-18) e `PNEUS_COMPATIVEIS` nas 9.

### Rolamentos (194)
- Rígidos de esfera (78): a série está no código em 77 (ROL6000 a ROL62xx, com -2RS, -2Z ou -C3).
- Cônicos (96): série no código em 52 (ex.: ROL30205, ROL102949/102910); 4 são de cubo (ROL0xxx); o resto tem código próprio.
- Outros (20): de roda, de câmbio, de colheitadeira e de plantadeira.
- Diâmetro interno, externo e largura em mm: **não estão na base**. `ALT_CM`, `COMPR_CM` e `LARG_CM` (83 itens) parecem a medida da embalagem [SUPOSIÇÃO] e não servem para isso.

## 4. Na tela (simulação)

O site não tem mais abas (a tela da busca aprovada tem o campo q, a placa e os filtros na coluna à esquerda). Por isso a proposta é **grupo de filtro**, no mesmo padrão dos filtros de hoje (Linha, Categoria, Sistema, Família), e não uma aba "Medida":

- os grupos só aparecem quando o resultado tem itens com aquela medida (como os filtros de hoje);
- **Baterias:** "Amperagem" (as opções em Ah: "60 Ah") e "Partida a frio (CCA)". O rótulo do grupo fica sem o "(Ah)" porque o título do grupo sai em caixa alta, e "AH" está errado (parecer de UX);
- **Pneus:** "Aro" e "Medida do pneu";
- a medida marcada vira etiqueta com o X ("Amperagem: 60 Ah"), como os outros filtros, e entra no endereço (ex.: `ah=60`, `aro=18`);
- no celular, os grupos ficam no painel "Filtrar", com o "Ver N produtos";
- na implementação, o designer-ux decide se o grupo com mais de 8 opções (Ah tem 13; Medida do pneu, 11) mostra só as 8 primeiras e um "Ver mais".

Prints da simulação (`node docs/propostas/T-0006/simular.mjs`; o selo "SIMULAÇÃO · T-0006" marca que não está no site):

| Print | O que mostra |
|---|---|
| `baterias-filtros-1366.png` e `baterias-filtros-390.png` | busca "bateria" com os grupos Ah e CCA (no celular, o painel "Filtrar") |
| `baterias-marcado-1366.png` e `baterias-marcado-390.png` | 60 Ah marcado: 8 produtos, etiqueta e "Filtrar (1)" |
| `pneus-filtros-1366.png` e `pneus-filtros-390.png` | busca "pneu moto" com os grupos Aro e Medida do pneu |
| `pneus-marcado-1366.png` e `pneus-marcado-390.png` | Aro 18 marcado: 6 produtos (4 pneus e 2 câmaras) |

[SUPOSIÇÃO] Os PNGs foram mostrados ao Alexandre no chat e ficam fora do Git nesta rodada: o editor web do GitHub (o único caminho de gravação da sessão Cowork) não sobe imagem. O script refaz os mesmos prints.

## 5. Como ficaria no código (fases 1 e 2, sem mudar a base)

- `scripts/gerar_site.py` (web-site): tira as medidas do que a base já tem (C20(AH) e CCA-18° das baterias; aro e medida dos pneus e câmaras) e grava num campo novo e curto do `produtos.json`, só nesses itens. Muda o formato do **JSON do site**, não o da base: a BAP Central não é afetada. A `TRAVA` e a `FICHA` não mudam.
- `site/app.js` (web-site): os grupos novos na barra de filtros e nas etiquetas, os parâmetros novos no endereço e a busca do q entendendo "60ah", "60 ah" e "aro 18".
- Cuidado com medida parecida com data: "90/90-18", "2.75-18" e "300-18" não podem virar ano no texto do site. No PDF, o `catalogo_grafico/gerador/datas.py` já tem a exceção do "90/90-19"; no site, conferir o tratamento de ano do `app.js` com as medidas acima.
- Testes (testes): `gerar_site.py` sem `[PARADO]`; `scripts/testar_site.mjs` com os filtros novos (Ah, CCA, aro, medida), a etiqueta, o endereço e o celular; prints em 1366 e 390 px.

## 6. Esforço e ordem

| Fase | O que | Quem | Esforço [SUPOSIÇÃO] |
|---|---|---|---|
| 1 | Baterias: filtros Ah e CCA; "60ah" no q | web-site, testes | pequeno: 1 PR do site e 1 dos testes |
| 2 | Pneus: filtros Aro e Medida; "aro 18" no q | web-site, testes | pequeno: reaproveita a fase 1 |
| 3 | Rolamentos: filtro "Série" pelo código | web-site, testes | pequeno a médio (o código dos cônicos varia) |
| 3b | Rolamentos: diâmetros em mm | catalogo-dados (dado novo), web-site, testes | grande: coluna nova ou tabela de séries; mudança de formato da base, com simulação e aviso à BAP Central |

## 7. Perguntas ao Alexandre

1. Ordem: **a) baterias, pneus e rolamentos, nessa ordem (recomendo)**; b) outra ordem.
2. CCA: **a) as 5 faixas da simulação (recomendo)**; b) a lista dos 22 valores.
3. Rolamentos: **a) só o filtro "Série", tirado do código, sem mudar a base (recomendo)**; b) também os diâmetros em mm (dado novo, com simulação e aviso à BAP Central).
4. Nome do grupo dos pneus: **a) "Medida do pneu" (recomendo)**; b) "Medida".

## 8. [SUPOSIÇÕES]

- As faixas de CCA são uma proposta para a lista não ficar longa (22 valores).
- `ALT_CM`, `COMPR_CM` e `LARG_CM` dos rolamentos são da embalagem.
- O KTB1500 (kit de terminal) aparece na busca "bateria", mas não tem Ah e fica fora dos grupos novos.
- Os números são do catálogo digital (NO_CATALOGO_DIGITAL = SIM), base v27.
