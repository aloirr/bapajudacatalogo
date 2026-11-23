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
