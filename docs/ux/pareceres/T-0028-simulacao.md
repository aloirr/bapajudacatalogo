# T-0028 · Parecer de UX da simulação (Portfólio pela v27 e capa da Linha Moto com "linhas")

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 07:37 (Manaus) |
| O que foi revisto | A simulação do `catalogo-grafico` no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0028/sim/` (commit 59bdf6f): o `LEIA.md`, o `diff-gerador.patch`, o `diff-variante-b.patch` e os 36 PNGs. Também os PDFs gerados na nuvem (antes: código do main; depois: código do branch, e a variante b) e o gerador do branch `catalogo-grafico/T-0028-entregas`, head `223ce6b`, sobre o main `15c3d8d`. A entrega comparada é a do main (`catalogo_grafico/entregas/`) |
| Pedido | R-20261123-112006-alexandre, decisões 9a (Portfólio regerado, "1 item", o `plural()` num módulo comum) e 11a (capa da Linha Moto com "linhas", MC-0015) |
| Resultado | **VOLTA PARA AJUSTE**: 1 🟡, sem 🔴. O ajuste vale para as duas variantes, e as 2 perguntas podem seguir ao Alexandre em paralelo (§6) |

Sem preço e sem estoque: 🟢. Os "N itens" e os totais das divisórias são o tamanho do portfólio, não estoque.

A voz, o texto e a grafia ficam com o `design-de-marca` (ver o parecer de marca da T-0028): "linhas" e "famílias", as datas, "+4.500", a grafia das aplicações ("Gm/Gm Corsa", a caixa alta da base) e o texto institucional. Aqui só falo de leitura, layout e consistência.

## 1. A4, Completo Digital e Linha Moto: a prova
Conferi por conta própria os PDFs gerados pelo código do branch contra as entregas do main, página a página, no texto e no pixel (PyMuPDF; A4 a 50 ppi, Digital a 40 ppi, Moto a 100 ppi):

| PDF | Págs. (entrega = gerado) | Páginas que mudam |
|---|---|---|
| A4 gráfica | 56 = 56 | nenhuma |
| Completo Digital | 311 = 311 | nenhuma |
| Linha Moto | 17 = 17 | só a pág. 1 (capa), numa caixa só: a 3ª linha do texto da capa |
| Lista de aplicações do site (código do main × do branch) | 21 = 21 | nenhuma |

- 🟢 **Bate com a prova do `LEIA.md`.** Os bytes do A4 diferem só nos metadados (data de geração); o texto e o pixel são iguais.
- 🟢 **O Kit Filtros não roda nesta nuvem** (`LEIA.md`). Fica com a prova do `plural()` de 0 a 4.999, que é de código: o `revisor-codigo` confere.

## 2. Capa da Linha Moto (pág. 1)
Prints: `moto-p01-capa-antes.png`, `moto-p01-capa-depois.png` e os 2 `zoom`.

- 🟢 **Só a linha muda.** "7 famílias · 75 itens para motocicletas" passa a "7 linhas · 75 itens para motocicletas". O texto é alinhado à esquerda, encurta 1 palavra e nada mais se move: logo, título, chip "LINHA MOTO · USO INTERNO", fotos e arco ficam iguais.
- 🟢 **A capa passa a falar como o miolo.** O sumário e as páginas de sistema da Linha Moto já contam em "linhas" ("2 linhas · 6 itens", T-0027), e as 7 da capa são as 7 linhas do sumário. Quem abre o PDF lê o mesmo número com o mesmo nome na capa e dentro.

## 3. Portfólio: "1 item"
Prints: `port-1item-*` (antes, depois-a e depois-b) e `port-*-1item-filtro-ar-moto-nova.png`.

- 🟢 **Muda só o "s".** No código do main contra o do branch, as duas na v27 (variante a, 94 págs.), mudam só as págs. 78, 79 e 88, cada uma numa caixa de 4 × 5 px a 50 ppi: o fim da palavra embaixo da foto. O rótulo é alinhado à esquerda: nada se move.
- 🟢 **Agora o número e a palavra concordam** com o que o leitor vê: 1 foto, 1 produto, "1 item" (Lâmpadas Moto, Óleo Hidráulico e o Filtro de Ar Moto, página nova).
- 🟢 **O singular fica num lugar só.** O `plural()` do módulo comum vale nos cartões (`card_v`, `card_h`), na página de produto único (`heroi`) e no subtítulo da página de sistema, que antes tinha o seu próprio "família/famílias". Atende ao que pedi na pergunta 2 da T-0027.

## 4. Portfólio regerado pela v27: página a página
Conferi a ordem das páginas da entrega (82), da variante a (94) e da variante b (88) pelo texto de cada página, e os PNGs da simulação.

### Variante b (88 págs.)
- 🟢 **As páginas seguem o padrão de hoje.** As 6 novas (Pesada Bieletas, Caixa de Direção e Cubo de Roda; Moto Filtros de Ar e Filtros de Óleo; Universal Rolamentos) usam os mesmos modelos de página (foto e "Principais aplicações", ou cartões), e nenhuma página sai.
- 🟢 **Divisória da Linha Leve (pág. 4):** o layout fica igual ao da entrega, linha por linha (`port-sumario-linha-leve-antes-p04` × `-depois-b-p04`); só muda o total de itens. A lista termina onde terminava (481 pt, 59 pt acima da borda), longe do rodapé.
- 🟢 **Divisórias da Pesada, da Moto e do Universal (págs. 44, 70 e 78):** os sistemas novos (Filtração na Moto, Rodagem no Universal) entram na ordem dos sistemas e em colunas que já existiam. Nada encosta na borda.
- 🟢 **"Nosso portfólio" (pág. 3):** as listas da Moto e do Universal crescem 1 linha (4 sistemas) dentro da mesma altura do cartão, e os números novos cabem sem quebrar. **"Quem somos" (pág. 2):** só o número do 2º cartão muda ("+4.500") e cabe no cartão.
- 🟢 **Os Rolamentos ficam num lugar só em cada linha, em Rodagem**, como no Catálogo BAP (A4 e Digital). Quem conhece o catálogo acha a família no mesmo lugar no Portfólio.

### Variante a (94 págs.)
- **Divisória da Linha Leve (pág. 4):** "Cubos e Rolamentos · Rolamentos" aparece 3 vezes (em Transmissão, Motor e Rodagem). A coluna 03 cresce 2 linhas, empurra Freio e Arrefecimento e a lista ("Eletroventiladores") termina a 519 pt, 21 pt (cerca de 0,7 cm) da borda de baixo da página de 540 pt e abaixo do topo do número da página (513 pt): é o aviso `lista passou da página`. Não cobre o número, que fica em outra coluna, mas quebra a margem que as outras divisórias respeitam (na b e na entrega, a lista termina a 481 pt).
- **A mesma família em 3 lugares.** Em cada linha, quem procura um rolamento tem de olhar 3 sistemas, e a Linha Moto e o Universal passam a abrir pelos rolamentos (Moto "01 · Transmissão" com 7 itens e "02 · Motor" com 19; Universal "01 · Transmissão" com 2, antes dos Lubrificantes que o subtítulo anuncia). É uma informação em 3 lugares, e diferente do catálogo.
- Por isso a recomendação do §6, pergunta 1, é a b).

### 🟡 O ajuste: a quebra de linha da aplicação some e cola duas aplicações (as duas variantes)
Na v27, alguns produtos trazem a aplicação em linhas ("HONDA CG 125 CARGO ESD - 2014–2015⏎HONDA CG 125 CARGO KS - …"). O `aplicacoes()` do `portfolio.py` (:227-248) não separa as linhas: a quebra vai para o PDF como um caractere que a fonte não tem, desenhado como nada. O leitor vê duas aplicações coladas, com o ano, cortadas no meio:

| Variante b | Variante a | Página | O que se lê |
|---|---|---|---|
| 37 | 39 | Linha Leve · Filtração · Filtros de Ar | "FORD ECOSPORT 1.6 L - 2003–2012FO…" |
| 62 | 66 | Linha Pesada · Filtração · Filtros de Cabine | "MERCEDES-BENZ 1315 ATEGO - 2005>…" |
| 73 | 79 | Linha Moto · Filtração · Filtros de Ar (página nova; `port-b-p73-…`) | "HONDA CG 125 CARGO ESD - 2014–2015HONDA CG 12…", a única aplicação da página |

- Na entrega, nenhuma página tem isso: é novo da regeração.
- No Filtro de Ar Moto, é a única linha da página: o leitor não consegue ler a aplicação.
- **Pedido ao `catalogo-grafico`:** no `aplicacoes()`, tratar cada linha da aplicação como uma aplicação, que passa pelo mesmo corte de ano e de tamanho das outras, nas duas variantes. Depois, nova prova só dessas 3 páginas (antes × depois) e a busca do caractere vazio no texto de todo o Portfólio, que deve dar zero.
- A caixa alta e a grafia dessas linhas ficam com o parecer de marca.

## 5. Notas (não seguram)
1. **A seta da pág. 3 também some.** "Dentro da linha: sistema do veículo → família → produto." sai "sistema do veículo  família  produto" (`portfolio.py:406`): a fonte não tem o "→". Já era assim na entrega, mas a pág. 3 muda nesta regeração. Sugiro corrigir no mesmo ajuste do §4, com o caractere escolhido pela marca.
2. **Aplicações que não ajudam o cliente a decidir** (dado da base, para o `catalogo-dados`, fora desta tarefa): "Doblo" na Linha Pesada · Bieletas (pág. 46 da b); "Ford Focus" e "Volvo V40" na Linha Pesada · Filtros de Cabine (pág. 62); "UNIVERSAL / MOTO / LINHA LEVE…" e "Universal / Motos / Industrial" nos Rolamentos do Universal (pág. 86), que não são veículos. Vêm da LINHA e da APLICACAO da base, não do layout.
3. **A divisória da Linha Moto e a do Universal ficam com ~3/4 da área da lista em branco** (págs. 70 e 78 da b). Já era assim na entrega e não muda aqui.

## 6. Recomendação por pergunta
| # | Pergunta | Recomendação de UX | Por quê |
|---|---|---|---|
| 1 | Como agrupar os Rolamentos no Portfólio | **b) Rolamentos em Rodagem, como no Catálogo BAP (88 págs.)** | §4. A família fica num lugar só em cada linha e no mesmo lugar do catálogo; a divisória da Linha Leve mantém o layout e a margem da entrega; a Moto e o Universal abrem pelo que o subtítulo anuncia. A a) põe a mesma família em 3 sistemas, invade a margem da pág. 4 (pedindo um ajuste de layout com simulação própria) e soma 6 páginas para os mesmos itens. A c) traria de volta números de outubro, diferentes dos do catálogo que o cliente consulta |
| 2 | Datas do Portfólio ("2026", "Outubro de 2026", "conforme o Catálogo BAP 2026") | **a) Ficam como estão; a troca vai para a fila, com simulação própria** | É texto (ver o parecer de marca). Para o layout, a) não muda nada. Fica registrado que a pág. 3 diz "conforme o Catálogo BAP 2026" sobre números que agora vêm da base do Catálogo BAP 2027: na rodada da fila, a referência e os números devem falar do mesmo catálogo |

As 2 perguntas não dependem do ajuste do §4: podem ir ao Alexandre agora, e o ajuste volta para a prova das 3 páginas na variante escolhida.

## Prints e arquivos conferidos
- **No aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0028/sim/` (commit 59bdf6f):** `LEIA.md`, `diff-gerador.patch`, `diff-variante-b.patch`; `moto-p01-capa-*` (4); `port-quem-somos-*` (3); `port-sumario-nosso-portfolio-*`, `-linha-leve-*`, `-linha-pesada-*`, `-linha-moto-*` e `-universal-*` (3 de cada); `port-1item-*` (6); `port-a-p16`, `-p31`, `-p76`, `-p79` e `-p85`; `port-b-p46`, `-p66`, `-p73`, `-p74` e `-p86`.
- **PDFs da simulação (fora do Git):** A4, Completo Digital, Linha Moto e Lista de aplicações (código do main e do branch), Portfólio da variante a (código do main e do branch) e da variante b; renderizei as págs. 37 e 62 da b e a 37 da entrega.
- **Entregas do main:** `Catalogo_BAP_2027_A4_grafica.pdf`, `Catalogo_BAP_2027_Completo_Digital.pdf`, `Catalogo_BAP_2027_Linha_Moto.pdf` e `Portfolio_Produtos_BAP_AUTOPARTS.pdf` (82 págs.).
- **Gerador:** o diff do `223ce6b` (`plural.py`, `portfolio.py`, `digital2.py`, `catalogo_moto.py`, `lista_aplicacoes_site.py`, `kitfiltros/kit.py` e `LEIA_GERADOR.md`).

**Resultado: VOLTA PARA AJUSTE** (1 🟡, §4). A capa da Linha Moto e o "1 item" estão 🟢. Depois do ajuste, refaço a conferência das 3 páginas.

---

## Reteste do 🟡 (head `6c035be`)

| Campo | Valor |
|---|---|
| Data | 23/11/2026 07:51 (Manaus) |
| O que foi revisto | O diff `223ce6b..6c035be` (só o `aplicacoes()` do `portfolio.py`), a seção "Ajuste do parecer de UX" do `LEIA.md` e os 24 PNGs `port-aplic-a-*` e `port-aplic-b-*` (recados, commit e1d7b49). Também os PDFs gerados pelo `6c035be` (as 2 variantes do Portfólio, antes e depois do ajuste, e o A4, o Digital, a Linha Moto e a Lista); conferi que o `portfolio.py` usado é o do branch |
| Resultado | **VOLTA PARA AJUSTE**: o 🟡 da 1ª rodada fica 🟢; sobra 1 🟡 novo e pequeno, no Filtro de Ar Moto |

### O 🟡 da 1ª rodada: 🟢
- 🟢 **O caractere vazio sumiu das aplicações.** A busca no texto das 2 variantes acha 0 nas aplicações; sobram só os 2 da seta da pág. 3 (nota 1 do §5, com a marca).
- 🟢 **Mudam só 6 páginas em cada variante**, as do `LEIA.md` (a: 39, 42, 47, 66, 68 e 79; b: 37, 40, 45, 62, 64 e 73). Conferi no texto e no pixel; cada diferença fica na coluna das aplicações.
- 🟢 **As linhas se leem.** Filtros de Ar da Leve (pág. 37 da b): "FORD ECOSPORT 1.6 L", sem ano e sem cola. Filtros de Cabine da Pesada (62): "MERCEDES-BENZ 1315 ATEGO". Amortecedores da Pesada (45): "MB OF1724", sem o " -" pendurado. Filtros de Óleo da Leve e da Pesada (40 e 64): as aplicações que estavam escondidas pelo "…" viram linhas próprias, na mesma grade de 2 colunas, sem estourar a área.
- 🟢 **Os outros PDFs não mudam.** No `6c035be`, A4 (56 págs.), Completo Digital (311) e Lista (21) ficam iguais às entregas e ao código do main; na Linha Moto, só a capa, na mesma caixa da 1ª rodada.

### 🟡 novo: o Filtro de Ar Moto mostra 1 aplicação de 27 (pág. 73 da b, 79 da a)
Print: `port-aplic-b-p73-moto-filtros-de-ar-depois.png`.

- A página mostra só "HONDA CG 125 CARGO ESD". O produto tem 27 aplicações, em 3 modelos: CG 125, CG 150 e CG 160 (conferi no `produtos.json`).
- **Não é aceitável como está.** "Principais aplicações" serve para o cliente saber se a peça serve. Com 1 linha, o balconista lê que o filtro é da CG 125 Cargo ESD e deixa de oferecer para a CG 150 e a CG 160, que o mesmo filtro atende. A página é nova e tem espaço para 12 linhas.
- **A causa** é a regra de "não repetir o mesmo carro" do `aplicacoes()`: nas linhas da v27, a 1ª palavra é a montadora, e as 27 linhas caem como uma só ("HONDA"). A mesma causa repete o carro nos Filtros de Ar da Leve (pág. 37 da b): "Ford Ecosport 1.6 L 16V" e "FORD ECOSPORT 1.6 L", na mesma lista.
- **Pedido ao `catalogo-grafico` (o resultado; o como é dele):**
  1. nas linhas da v27, a montadora é a 1ª palavra e o "mesmo carro" é o modelo com o número (CG 125, CG 150, CG 160), como o modelo das linhas com a montadora em negrito;
  2. o Filtro de Ar Moto passa a mostrar os 3 modelos, e o Ecosport aparece uma vez só na pág. 37;
  3. nova prova das páginas que mudarem, nas 2 variantes, com a lista delas.
- A caixa alta dessas linhas ("HONDA CG 125 CARGO ESD") fica com o parecer de marca.

### Notas do reteste (não seguram)
1. **A repetição do mesmo carro já existia em outras páginas** e vem da mesma regra, com grafias diferentes da base: "Ford Royale" e "FORD Royale…" (pág. 13 da b), "Ford Ranger 2.8…" e "Ford Ranger" (19), "FORD Courier 1.3…" e "Ford Courier 1.6…" (33). Se o ajuste do 🟡 também as resolver, melhor; se não, ficam para o `corretor-redundancias`.
2. **Os Filtros de Óleo da Linha Leve (pág. 40 da b) abrem com 3 máquinas** ("DYNAPAC CC21 – PERKINS 4236", "MULLER 26 – MB OM321" e "PUTSMEISTER BSA1003 – MWM D229.4"), antes dos carros. A Dynapac já abria a lista na 1ª rodada; o ajuste só separou as outras 2, que estavam coladas. É a ordem e a LINHA da base: para o `catalogo-dados`, junto da nota 2 do §5.

**Resultado do reteste: VOLTA PARA AJUSTE** (1 🟡 novo, no Filtro de Ar Moto). O 🟡 da 1ª rodada está 🟢. As recomendações do §6 não mudam (1b e 2a), e as perguntas podem seguir ao Alexandre.

---

## 2º reteste: o "mesmo carro" (head `e2cded4`)

| Campo | Valor |
|---|---|
| Data | 23/11/2026 08:11 (Manaus) |
| O que foi revisto | O diff `6c035be..e2cded4` (a função `carro()` e o corte do ano no `aplicacoes()`), a seção "Reteste do UX: o 'mesmo carro'" do `LEIA.md`, o `carro-aplicacoes-antes-depois.txt` e os PNGs `port-carro-*` (recados, commit 8cc82fb). Também os PDFs gerados pelo `e2cded4` (as 2 variantes do Portfólio e o A4, o Digital, a Linha Moto e a Lista), comparados com os do `6c035be` e com as entregas |
| Resultado | **VOLTA PARA AJUSTE**: o 🟡 do Filtro de Ar Moto fica 🟢; sobra 1 🟡, das datas "MM/AA" nas aplicações |

### O 🟡 do 1º reteste: 🟢
- 🟢 **O Filtro de Ar Moto mostra os 3 modelos** (pág. 73 da b, `port-carro-b-p73-depois.png`): "HONDA CG 125 CARGO ESD", "HONDA CG 150 CARGO ESD" e "HONDA CG 160 CARGO". Quem lê a página sabe que o filtro serve na CG 125, na 150 e na 160.
- 🟢 **O mesmo carro aparece uma vez só**: Ecosport (pág. 37 da b), Royale (13), Ranger (19) e Courier (33). A montadora na chave mantém separados os "Caminhões" da Agrale e os da MB.
- 🟢 **Mudam só as listas de aplicações**, nas 23 páginas da b e nas 27 da a do `LEIA.md` (conferi no texto e no pixel, contra o `6c035be`). Nenhuma lista fica vazia, nenhuma passa de 12 linhas e a grade de 2 colunas não muda.
- 🟢 **O caractere vazio dá 0 nas aplicações** das 2 variantes. Sobram só os 2 da seta da pág. 3 (nota 1 do §5, com a marca).
- 🟢 **Os outros PDFs não mudam.** No `e2cded4`, A4 (56 págs.), Completo Digital (311) e Lista (21) ficam iguais às entregas e ao código do main; na Linha Moto, só a capa, na mesma caixa da 1ª rodada.

### A aplicação que sai quando o ano partiria o modelo: 🟢, aceitável
- Saem "Clark Empilhadeira C-" (págs. 22 e 54 da b) e "Ford F-" (pág. 54). Do jeito que estavam no `6c035be`, mostravam um modelo partido: o leitor não sabe que carro é "Ford F-".
- Tirar é melhor que mostrar partido, porque a lista é das "principais" aplicações, não de todas: a vaga vai para a próxima do ranking ("Seat Leon 1.8", "Agrale MT 12.0", "MB 1726-e"), e nenhuma lista fica vazia.
- Na base, "F 2000" e "F-1998>" não dizem se o número é modelo ou ano. Não peço outra regra.

### 🟡 As datas "MM/AA" aparecem partidas nas aplicações (as 2 variantes)
Eu devia ter apontado isto na 1ª rodada: já estava no `223ce6b`, e o ajuste do "mesmo carro" trouxe mais 2 linhas. O corte do ano reconhece "2014–2015", mas não as datas "mês/ano" da base. Elas ficam na linha e são cortadas no meio, às vezes sem o "…":

| Variante b | Variante a | Página | O que se lê |
|---|---|---|---|
| 13 | 13 | Linha Leve · Terminais de Direção | "VW Gol Mec. 12/97 12…", "VW Fusca 08/65 04…", "VW Passat 01/74 12…", "VW Kombi Carat Central 01/97 12…" |
| 15 | 15 | Linha Leve · Cruzetas (`port-carro-b-p15-depois.png`) | "MB 1621 4x2 01/89 12/96 + MB 1622 4x2 0" |
| 49 | 51 | Linha Pesada · Cruzetas | "Scania R113 s/ ABS DS 10.6 L SOHV 01/91 1" |

- Na entrega, só 1 linha tinha data (pág. 53, "LO914 00/04 OM904LA"); no `e2cded4`, são 12 linhas em 6 páginas. Na tabela estão as que saem partidas ou cortadas ("12…", "0", "1").
- **Pedido ao `catalogo-grafico` (o resultado; o como é dele):**
  1. a data "mês/ano" sai da linha como sai o ano: "VW Gol Mec.", "VW Fusca", "VW Passat", "VW Kombi Carat Central", "MB 1621 4x2 + MB 1622 4x2" e "Scania R113 s/ ABS DS 10.6 L SOHV";
  2. nova prova das páginas que mudarem, nas 2 variantes.
- Fica fora do pedido o par de anos curto, que se lê inteiro ("Monza 82/96", "Kadett / Ipanema 89/98", pág. 12; "Elba 92/96 - Mille 92/13…", pág. 6). Se o ajuste também tirar esses anos, a linha continua legível.

### Notas do 2º reteste (não seguram)
1. **Os Filtros de Óleo da Pesada (pág. 64 da b) ficam com 6 Volvo em 12 linhas.** A chave nova separa, com razão, FH12, FM12, NH12, VM 260 e VM 310, e o ranking da base os põe antes de Foton, Iveco Cursor, JAC e MB LO 815, que saem. A lista fica certa, mas mostra menos montadoras. A regra de "principais" pela ordem do catálogo não muda nesta tarefa. Se o Alexandre quiser variedade de montadoras, a regra é nova e pede simulação.
2. **Vêm da base, para o `catalogo-dados`:** aplicação sem montadora ("Agile", pág. 12 da b; "GOL G IV de", pág. 13); modelo de outra linha ("Ford Focus" e "Volvo V40" nos Filtros de Cabine da Pesada, pág. 62; caminhão e ônibus nas Cruzetas da Linha Leve, pág. 15). Vão junto com a nota 2 do §5.

**Resultado do 2º reteste: VOLTA PARA AJUSTE** (1 🟡, as datas "MM/AA"). O Filtro de Ar Moto e o "mesmo carro" estão 🟢, e a regra da aplicação que sai é aceitável. As recomendações do §6 não mudam (1b e 2a).

---

## 3º reteste: a data "mês/ano" (head `fe47d1f`)

| Campo | Valor |
|---|---|
| Data | 23/11/2026 08:17 (Manaus) |
| O que foi revisto | O diff `e2cded4..fe47d1f` (só o corte do ano no `aplicacoes()`), a seção "2º reteste do UX: a data 'mês/ano'" do `LEIA.md`, o `mesano-aplicacoes-antes-depois.txt` e os 16 PNGs `port-mesano-*` (recados, commit 3597bc4). Também os PDFs gerados pelo `fe47d1f`, comparados com os do `e2cded4` e com as entregas |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

- 🟢 **As datas saem das aplicações.** As 12 linhas apontadas (6 por variante) passam a "VW Gol Mec.", "VW Fusca", "VW Passat", "VW Kombi Carat Central" (pág. 13), "MB 1621 4x2" (pág. 15) e "Scania R113 s/ ABS DS 10.6 L SOHV" (pág. 49 da b, 51 da a). Também sai o "01…" de "CARGO 1217 - CARGO 1417 5.9" (pág. 55 da b, 58 da a). Nenhuma linha fica cortada no meio.
- 🟢 **Mudam só essas 4 páginas em cada variante** (a: 13, 15, 51 e 58; b: 13, 15, 49 e 55), só na lista de aplicações (conferi no texto e no pixel, contra o `e2cded4`). Nenhuma lista fica vazia, e nenhuma passa de 12 linhas.
- 🟢 **Ficam o par de anos curto e a medida**, que se leem inteiros: "Monza 82/96", "Kadett / Ipanema 89/98" e "Chevette / Chevy / Marajó 73/93" (pág. 12), "Elba 92/96…" e "Escort 84/92…" (pág. 6), "LO914 00/04 OM904LA" (pág. 55 da b, que já estava na entrega).
- 🟢 **O caractere vazio continua em 0 nas aplicações**; sobram só os 2 da seta da pág. 3 (nota 1 do §5).
- 🟢 **Os outros PDFs não mudam.** No `fe47d1f`, A4 (56 págs.), Completo Digital (311) e Lista (21) ficam iguais às entregas e ao código do main; na Linha Moto, só a capa.

### A pergunta da pág. 15: prefiro o corte, "MB 1621 4x2"
- É a regra do ano: a aplicação termina onde começa a data. Uma regra só, a mesma nas 2 variantes e em todas as páginas.
- A outra forma tiraria a data do meio e juntaria o que vem depois. Na pág. 13, daria "VW Gol Mec. + VW Gol Mi Plus + VW…", mais longa e cortada de novo pelo "…".
- O "+ MB 1622 4x2" do meu exemplo era ilustrativo. A lista é das "principais" aplicações: o MB 1622 é a versão vizinha do mesmo caminhão, e perder a linha não engana o leitor.

**Resultado do 3º reteste: LIBERADO.** Com isso, a T-0028 fica sem 🔴 e sem 🟡: a capa da Linha Moto, o "1 item" e as aplicações do Portfólio estão 🟢. As recomendações do §6 não mudam (1b e 2a). As notas do §5 e dos retestes seguem para a marca, o `catalogo-dados` e a fila, e não seguram a entrega.

---

## Entrega final

| Campo | Valor |
|---|---|
| Data | 23/11/2026 08:33 (Manaus) |
| O que foi revisto | As entregas do branch `catalogo-grafico/T-0028-entregas`, head `ac36418` (Portfólio de 88 págs. e Linha Moto), tiradas do próprio commit; o diff `fe47d1f..ac36418`; as pranchas e o `LEIA.md` de `recados/anexos/T-0028/final/` (commit dd43f4a) |
| Decisão do Alexandre | 3b, 4a e 5a (R-20261123-122814-po) |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

- 🟢 **A entrega é a simulação aprovada.** Comparei, no texto e no pixel, os PDFs do commit com os da última rodada: o Portfólio (88 = 88 págs.) é igual à variante b do `fe47d1f`, e a Linha Moto (17 = 17) é igual à da simulação. Os sha256 batem com os do `LEIA.md`.
- 🟢 **A variante b entrou como foi simulada.** O diff do `portfolio.py` no `79bcd59` é o do `diff-variante-b.patch`, linha a linha. O A4 e o Completo Digital não foram regravados: os sha256 são os das entregas do main.
- 🟢 **As pranchas** mostram o mesmo antes e depois da simulação (a divisória da Linha Leve, por exemplo, só muda nos totais).
- 🟢 **No PDF entregue:** nenhum "1 itens"; caractere vazio só nos 2 da seta da pág. 3; nada de preço nem de estoque.

**Fila (4a):** as datas de 2026 do Portfólio ("PORTFÓLIO DE PRODUTOS 2026", "Outubro de 2026", "conforme o Catálogo BAP 2026" e a contracapa) ficam como estão nesta tarefa. A troca para 2027 vai para a fila do Alexandre, com simulação própria, junto da nota do §6 (pergunta 2): a referência e os números devem falar do mesmo catálogo.

**Resultado da entrega final: LIBERADO** para seguir ao `revisor-codigo`.
