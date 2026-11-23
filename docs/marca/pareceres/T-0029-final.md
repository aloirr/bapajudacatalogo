# T-0029 · Parecer de marca da rodada final (Portfólio 2027, base v28)

| Campo | Valor |
|---|---|
| Tarefa | T-0029, rodada final: as decisões 9 a (selo "NOVIDADE 2026"), 10 a (ProActive e Shiftease) e 16 a (Linha Pesada só com veículo pesado), com a base v28 |
| Revisor | design-de-marca |
| Data | 23/11/2026 10:53 (Manaus) |
| O que foi visto | O branch `catalogo-grafico/T-0029-portfolio-2027`, head `71977dc0c1a5fca14d91f9c194ffbc7e57cd7076`. O PDF foi gerado no `bf89f50`; o `71977dc` só acrescenta a `REGRA_16A`, com a variante a como padrão. O `Portfolio_Produtos_BAP_AUTOPARTS.pdf` da pasta `sim-T-0029-final` (`pdfinfo` e `pdftotext`), os PNGs antes e depois e a variante b do 16a |
| Base de comparação | `docs/marca/pareceres/T-0029-simulacao.md` (a simulação aprovada) e o MC-0017 |
| Parecer | **LIBERADO**. O MC-0017 fecha com a entrega. Nenhum achado novo de marca |

Layout e comparação página a página: ver o parecer de UX da rodada final.

## Conferência

- **Metadados:** título "Portfólio de Produtos BAP AUTOPARTS", autor "BAP AUTOPARTS" e 87 págs. (sai a pág. de
  Bieletas da Pesada).
- **Datas:** "PORTFÓLIO DE PRODUTOS 2027" na capa e na contracapa, "Novembro de 2026" na capa e "conforme o Catálogo BAP
  2027" na p03, iguais à simulação.
- **Selo:** "NOVIDADE 2026" nas 19 páginas, e nenhum "NOVIDADE 2027". O ano do selo é o do lançamento, como no A4.
- **ProActive e Shiftease:** 7 vezes cada (p74, p78 e p79), nenhuma em minúsculas. **Effitech:** 1 vez, certo.
- **Siglas:** nenhum "Vw", "Gm" nem "Mb" no texto do PDF. Nas páginas do 16a (p47, 53, 54, 56, 60, 61, 63, 66 e 68), as
  montadoras que entram saem com a grafia do MC-0017: "VW", "MB", "GMC", "Ford", "Scania", "Volvo", "Iveco" e "Agrale".
- **Contagens:** p03 com "10 sistemas · 39 produtos · 4.050 itens" na Leve e "9 sistemas · 24 produtos · 508 itens" na
  Pesada. Os números das divisórias (p04 e p44) batem com a p03. A p02 continua com "+4.500".
- **Sem preço e sem estoque:** a busca no texto do PDF não acha valor, estoque nem palavra interna. O "preço acessível"
  do Quem somos é o item 21 da lista de melhorias, à espera da decisão do Alexandre.

## MC-0017

**Fecha com a entrega**, desde que o PDF gravado em `entregas/` seja este. As grafias certas ("VW", "GM", "Effitech",
"ProActive" e "Shiftease") saem iguais às da simulação aprovada.

Continua como antes, sem achado novo: as aplicações que vêm da base em caixa alta e sem a montadora separada
("MERCEDES-BENZ AXOR", "SCANIA G 410 A…", "VOLVO FH12…", "MARCOPOLO Ônibus") e o "Nielson Onibus" sem acento. Já
estavam no Portfólio e são o item 8 da lista de melhorias.

## Fora da marca (para o `gerente-projetos` encaminhar; não catalogo)

- **16 a, variante a:** a p68 (Pesada) ainda mostra "Toyota Etios 1.3 L 16V", que é carro. A variante b tira esse
  carro. A p54 mostra "300C" nas duas variantes, e o 300C também é carro (`catalogo-grafico` e `catalogo-dados`).
- **p74:** "API sljaso MA" na descrição da base (item 13 da lista de melhorias; `catalogo-dados`).

## Reteste

No PR: o `pdftotext` do PDF de `entregas/` igual ao desta pasta (87 págs., 19 "NOVIDADE 2026", 7 "ProActive", 7
"Shiftease", 1 "Effitech", nenhum "Vw", "Gm" nem "Mb"). Com isso, fechar o MC-0017.

| ID | Situação |
|---|---|
| MC-0017 | Corrigido; fecha com a entrega deste PDF |
| MC-0016 | Ver `docs/marca/pareceres/T-0030-simulacao.md` (outro branch) |
