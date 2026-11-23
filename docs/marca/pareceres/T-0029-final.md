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

## Rodada 3 (head `6d8f14300b37b790ece8176fc87e6191ce35d3ca`)

| Campo | Valor |
|---|---|
| O que foi visto | O `LEIA-ME.md`, os PNGs antes e depois das 24 páginas e o `pdftotext` do PDF da pasta `rodada3` (87 págs.) |
| Parecer | **LIBERADO**. O MC-0017 continua a fechar com a entrega. Nenhum achado novo de marca |

- **Grafia que se mantém:** 19 "NOVIDADE 2026", 7 "ProActive", 7 "Shiftease", 1 "Effitech", e nenhum "Vw", "Gm" nem
  "Mb".
- **O que entra, certo:** "CBT Tratores", "New Holland Colheitadeira 4040/5050", "Valmet Tratores", "Cummins ISBe"
  (antes "Isb"), "GM C-60 4.9 L 12V", "GM D40, A40, C40", "DAF CF", "MB Axor 12.0 L 24V", "VW Delivery 4.150",
  "Ford F-12000, F14000" (p56) e "Ford Caminhões F12000, F14000, F16000" (p59).
- **Corte com "…":** nenhum modelo partido no meio da palavra. Na p42, "VW Fus" virou "VW…".
- **O que entra com a grafia da base, como as outras linhas em caixa alta (item 8 da lista; sem achado novo):**
  - "DYNAPAC CC21 – PERKINS 4236", "MULLER 26 – MB OM321" e "Iveco S-WAY" (a grafia da marca é "S-Way");
  - "PUTSMEISTER BSA1003" (p63): o nome certo da fabricante é **"Putzmeister"**. O erro já estava na Leve (rodada
    anterior) e vem da APLICACAO da base: o `catalogo-dados` corrige na origem.
- **Anteriores, para a fila (item 8 e item 4):**
  - "Mwm" em "Agrale 6000 Mwm 4-10 Tca" (p59) e "GM Blazer Mwm Sprint" (Leve) → "MWM". É a mesma falha do `title()`
    do MC-0017, mas no texto do modelo: pôr "MWM" no `montar.KEEPU` resolve as duas;
  - "Cummins Motores Cummins ISBe 3.9L" (p56) repete "Cummins" e cola a unidade ("3.9 L");
  - "MB Pode ser aplicado na ré, neutro…" (p59) não é veículo (item 4).
- **Fora da marca (para o `gerente-projetos`):** a p68 da Pesada ainda mostra "Toyota Etios 1.3 L 16V", que é carro. A
  regra nova tirou a Topic e a Daily, mas não o Etios.

## Entrega final (PR #179, head `0133f6f726084443bbd705deeb0352d2a2737c66`)

| Campo | Valor |
|---|---|
| O que foi visto | O `catalogo_grafico/entregas/Portfolio_Produtos_BAP_AUTOPARTS.pdf` do head (`pdfinfo` e `pdftotext`, comparado com o PDF da rodada 3) e os PNGs da pág. 2, antes e depois, da pasta `final-T-0029` |
| Parecer | **LIBERADO** (final). **MC-0017 FECHADO** |

- **Única diferença para a rodada 3:** a pág. 2, pelo 15 a: "…componentes automotivos de qualidade, com segurança e
  **bom custo-benefício**." A voz está certa. Diz o mesmo que "preço acessível", sem a palavra "preço" num material para
  cliente, e segue o tom institucional do "Quem somos". O parágrafo ficou 1 linha mais curto, e o resto da página não
  muda.
- **Metadados:** título "Portfólio de Produtos BAP AUTOPARTS", autor "BAP AUTOPARTS" e 87 págs.
- **Grafia:** 2 vezes "PORTFÓLIO DE PRODUTOS 2027", 19 vezes "NOVIDADE 2026", 7 "ProActive", 7 "Shiftease" e
  1 "Effitech". Nenhum "Vw", "Gm" nem "Mb".
- **Sem preço e sem estoque:** o texto não tem "preço", "R$" nem "estoque".
- **Fila (15 a nos outros materiais; não segura):** a frase "preço acessível" continua no "Quem somos" do A4
  (`print_cat.py:484`) e na apresentação de Lubrificantes (`apres_conteudo.json`). A troca é a mesma ("bom
  custo-benefício"), pelo `catalogo-grafico`, na próxima entrega de cada material.

### Controle dos achados de marca (23/11/2026)

| ID | Situação |
|---|---|
| MC-0011 | FECHADO como MANTIDO (R-20261123-112006-alexandre, 7 a) |
| MC-0012 | PARADO (R-20261123-112006-alexandre, 8 c) |
| MC-0015 | FECHADO (T-0028) |
| MC-0016 | Corrigido na simulação da T-0030 ("Ah" e "CCA"); fecha com a entrega. Na fila: "Ca +25c" e "12v" |
| MC-0017 | **FECHADO** com esta entrega (PR #179). Na fila, sem achado: as aplicações da base em caixa alta, "Mwm", "PUTSMEISTER" (item 8 da lista de melhorias) |
| MC-0018 | FECHADO (T-0032, padrão de treinamento) |
| MC-0019 | FECHADO (T-0032, padrão de treinamento) |
| MC-0020 | FECHADO (T-0032, padrão de treinamento) |
| MC-0021 | ABERTO (T-0032, Linha Baterias: títulos da tabela e da capa) |
| MC-0022 | FECHADO (T-0032, Mecânica Básica); a foto da embreagem vai como pergunta ao Alexandre |
