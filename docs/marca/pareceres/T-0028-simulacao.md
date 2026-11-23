# T-0028 · Parecer de marca da simulação (Portfólio pela v27 e capa da Linha Moto)

| Campo | Valor |
|---|---|
| Tarefa | T-0028, passo 1: simulação. Decisões 9 a (Portfólio gerado de novo, "1 item", `plural()` num módulo comum) e 11 a ("linhas" na capa da Linha Moto, MC-0015) do R-20261123-112006-alexandre |
| Revisor | design-de-marca |
| Data | 23/11/2026 07:37 (Manaus) |
| O que foi visto | A simulação do `catalogo-grafico` em `recados/anexos/T-0028/sim/` do aloirr/bapajudacatalogo-recados (commit `59bdf6f`): o `LEIA.md`, o `diff-gerador.patch`, o `diff-variante-b.patch` e os PNGs. Na capa da Linha Moto: `moto-p01-capa-*`. No Portfólio: a pág. 2 ("Quem somos"), os sumários, as 3 páginas de "1 item" e as páginas novas, em "antes" (a entrega de 23/10), "depois-a" (a v27 como está, 94 págs.) e "depois-b" (a variante b, 88 págs.). O diff do branch `catalogo-grafico/T-0028-entregas` (head `223ce6b`). A capa, a pág. 3 e a contracapa do Portfólio, pelo texto do `portfolio.py` do branch e pelo `pdftotext` da entrega |
| Base de comparação | `docs/marca/manual.md`, "Nome da marca" (decisão 10 a); a decisão 6 a do R-20261123-112006-alexandre (a etiqueta "BAP AUTOPARTS" ao lado do logo fica); o resto do manual ainda está "a aprovar". O MC-0015 (`docs/marca/pareceres/T-0026-simulacao.md`) e o "1 itens" do Portfólio (`docs/marca/pareceres/T-0027-simulacao.md`, pergunta 2) |
| Parecer | Simulação: **LIBERADO** para o PO levar ao Alexandre. Recomendo **1 b** (como o `catalogo-grafico`) e **2 a** (como o `catalogo-grafico`, com a fila logo em seguida). Um achado novo, baixo e anterior à tarefa (MC-0017), que não segura |

Leitura e layout (a lista da Linha Leve que encosta no rodapé na variante a, a comparação página a página, os
cartões novos): ver o parecer de UX (`docs/ux/pareceres/T-0028-simulacao.md`). Aqui ficam só a voz, a grafia, a marca e
as regras do repositório.

## 1. Capa da Linha Moto: "7 linhas" (MC-0015)

- **A troca é a do MC-0015, e só ela:** "7 famílias · 75 itens para motocicletas" → "7 linhas · 75 itens para
  motocicletas" (`moto-p01-capa-zoom-antes.png` × `-depois.png`). As 7 linhas são as que a capa lista nas 2 linhas de
  cima (Pneus, Câmaras de ar, Rolamentos, Óleo 4T, Filtros, Velas de ignição e Lâmpadas), e o termo agora é o mesmo do
  Sumário da Linha Moto, do Completo e do A4 ("+40 linhas de produtos").
- **Mesmo estilo:** Poppins Regular, 14 pt, branco, no mesmo lugar. O texto ficou mais curto, e nada mais se mexe; a prova
  pixel a pixel do `LEIA.md` mostra que só a pág. 1 muda.
- **O `plural()` também vale para "linha":** com 1 linha, sairia "1 linha". Não acontece hoje, mas não volta o erro
  do "1 itens".
- O selo "LINHA MOTO · USO INTERNO", o "CATÁLOGO DE PRODUTOS 2027", o logo e o rodapé são iguais aos de antes.
- **Fecha o MC-0015** quando a entrega final sair igual a esta simulação. Depois disso, entra no manual o glossário de
  voz ("linha" = linha de produtos), com o "aprovado" do Alexandre.

## 2. Portfólio: voz e grafia do que muda

- **"+4.500 itens no catálogo"** (pág. 2, antes "+2.700"). O número é verdadeiro: são 4.573 códigos do Catálogo BAP na
  v27, arredondados para baixo na centena, com o mesmo "+" e o mesmo ponto de milhar de antes. O rótulo não muda. O A4
  diz "+6.500 itens e aplicações", que conta outra coisa e tem outro rótulo, então os dois números não se contradizem.
  O "44 linhas de produtos" não muda.
- **"1 item"** nas 3 páginas de produto que têm 1 item (Lâmpadas da Linha Moto, Filtros de Ar da Linha Moto, que é
  página nova, e Óleo Hidráulico do Universal): é o singular certo, com a mesma fonte, o mesmo tamanho e o mesmo cinza
  do "N itens" das outras páginas. Corrige o que eu tinha apontado na T-0027 (pergunta 2). O `plural()` passa a ser um
  só para o Portfólio, os 3 PDFs, a lista do site e o Kit Filtros, e a regra do singular é a mesma em todos os materiais.
- **"Cubos e Rolamentos"** é o nome da família no Catálogo BAP, sempre no sistema **Rodagem** (`taxo.py`, linhas 48 e
  49), com a descrição "Rolamentos de roda, rolamentos de rolos e rígidos de esferas.". O nome está certo, e a pergunta é
  onde ele aparece (ver a pergunta 1, abaixo).
- **Nenhum texto institucional muda:** a capa ("Conheça a BAP AUTOPARTS"), o "Quem somos", a "Garantia Expressa BAP",
  a contracapa, o rodapé e o título do PDF ("Portfólio de Produtos BAP AUTOPARTS") são iguais aos da entrega. A grafia
  "BAP AUTOPARTS" está certa em tudo (decisão 10 a), e a etiqueta ao lado do logo no cabeçalho fica como está (a
  6 a é de Lubrificantes).
- **Cor, fonte e logo:** o diff do Portfólio só troca de onde vem a base e o "itens" fixo pelo `plural()`. Nenhuma cor,
  fonte, logo ou chip novo. As páginas novas usam o mesmo modelo das outras ("NOVIDADE 2026" e "NOVO" já existiam).

## 3. Regras do repositório (material para cliente)

- **Sem preço e sem estoque:** a busca do `catalogo-grafico` (R$, preço com valor, estoque, custo, margem, MOQ, FOB,
  fornecedor, ranking, vendedor, uso interno) não acha nada nas 2 variantes. O "preço acessível" do "Quem somos" é a
  frase institucional, sem valor, que a marca já aceitou na T-0026.
- **Marca de terceiros:** as montadoras aparecem só como dado, em texto, na fonte e na cor do catálogo, nas "Principais
  aplicações". Nenhum logo, símbolo ou cor de terceiros. A grafia delas é o MC-0017, abaixo. "Effitech" é linha de
  lubrificante da própria BAP, não de terceiros.
- **Nenhum aviso de uso interno** entra no Portfólio. A capa da Linha Moto continua com "USO INTERNO", como antes:
  aquele PDF é interno.

## 4. Perguntas do `LEIA.md`

- **Pergunta 1 (Rolamentos):** recomendo **b) Rolamentos em Rodagem, como no Catálogo BAP; 88 págs.**
  - É a consistência entre os materiais que o mesmo cliente recebe. No Catálogo BAP (A4 e Digital), "Cubos e
    Rolamentos" é família de **Rodagem**. Na a), a mesma família aparece também em Transmissão e em Motor, até 3 vezes
    na Linha Leve (`port-sumario-linha-leve-depois-a-p04.png`), e o cartão de Transmissão diz "Rolamentos de roda…"
    (`port-a-p16-…`). Para o cliente, o Portfólio passaria a dizer uma coisa e o Catálogo outra.
  - A b) tem as 88 págs. que a decisão 9 a anunciou ao Alexandre e não tem a lista que encosta no rodapé (layout: ver o
    parecer de UX).
  - A c) volta à classificação e aos números de outubro (v11): o "+4.500" e as aplicações novas não entram, e o
    Portfólio fica para trás do catálogo que ele apresenta.
- **Pergunta 2 (datas):** recomendo **a) ficam como estão nesta tarefa, e a troca vai para a fila, com simulação
  própria**, mas logo em seguida, e não para depois:
  - a 9 a não pediu a troca, e o ano no nome do material ("PORTFÓLIO DE PRODUTOS 2026") é decisão de marca do
    Alexandre, que pede simulação (regra 3 do `CLAUDE.md`);
  - mesmo assim, o Portfólio regerado pela v27 sai com 2 sinais que já não batem: "conforme o Catálogo BAP 2026" (pág.
    3), quando os PDFs do catálogo se chamam "Catálogo BAP 2027", e "Outubro de 2026" na capa, num material com os
    números de novembro. Para o cliente, isso parece material velho.
  - Para a pergunta da fila, junto: o ano da capa e da contracapa ("PORTFÓLIO DE PRODUTOS 2026"), a data da edição na
    capa, o "Catálogo BAP 2026" da pág. 3 e o chip "NOVIDADE 2026" das páginas de produto, que segue o mesmo ano. Minha
    recomendação para essa pergunta: o Portfólio cita o catálogo pelo nome dele ("Catálogo BAP 2027"), e a data da
    edição acompanha a data em que o PDF é gerado.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0017 | Portfólio, "Principais aplicações" e "Especificações" das páginas de produto (ex.: `port-a-p16-nova-leve-transmissao-rolamentos.png`, `port-1item-oleo-hidraulico-*`); `portfolio.py:285` (`m.title()` quando a marca tem mais de 3 letras), no branch `223ce6b` | terceiros (grafia) · voz | manual a aprovar (nome de terceiro em texto, com a grafia certa; nome das linhas da BAP igual em todos os materiais) | baixa, **anterior à T-0028** (igual na entrega de 23/10) | Ver abaixo | catalogo-grafico |

### MC-0017 · "Vw", "Gm" e "Mb" no Portfólio, ao lado de "VW", "GM" e "MB"

Não segura a T-0028: o `LEIA.md` já aponta isso como observação, e a tarefa não mexe nessas linhas. Vai para a fila,
pelo `gerente-projetos` e pelo `po`.

- **a) Siglas de montadora:** o `m.title()` transforma "VW/AUDI/SEAT" em "Vw/Audi/Seat", "FORD/GM/DODGE/TROLLER" em
  "Ford/Gm/Dodge/Troller" e "FORD/VW/MB/GM/AGRALE" em "Ford/Vw/Mb/Gm/Agrale". Na mesma página saem "GM", "VW" e "MB"
  certos (quando a marca tem até 3 letras) e "FORD / CHEVROLET / AGRALE…" em caixa alta. Correção (antes → depois):
  "Vw" → "VW", "Gm" → "GM", "Mb" → "MB", com as siglas sempre em maiúsculas e os outros nomes com a inicial maiúscula
  ("Ford", "Audi", "Seat", "Dodge", "Troller", "Agrale"). Por exemplo: uma lista fixa de siglas que o `title()` não toca.
- **b) Linha da própria BAP:** "Balde óleo effitech 100 68 hidráulico HL mineral 20L" (Óleo Hidráulico, Universal). A
  apresentação de Lubrificantes escreve "Effitech 100 ISO VG 68". Correção: "effitech" → "Effitech", como os nomes de
  linha ProActive e Shiftease.

| ID | Situação |
|---|---|
| MC-0015 | Corrigido nesta simulação; fecha na entrega final igual a ela |
| MC-0017 | ABERTO, anterior à tarefa; a encaminhar pelo `gerente-projetos` |
| MC-0016 | ABERTO (T-0006, ficha da bateria no site); esta tarefa não o afeta |
| MC-0012 | PARADO (R-20261123-112006-alexandre, 8 c) |
| MC-0011 | FECHADO como MANTIDO (R-20261123-112006-alexandre, 7 a) |

## Fora da marca (para o `gerente-projetos` encaminhar; não catalogo)

- **Página nova de Filtros de Ar da Linha Moto** (`port-b-p73-…`, `port-a-p79-…`): as aplicações saem coladas,
  "HONDA CG 125 CARGO ESD - 2014–2015HONDA CG 12…", sem separador entre os 2 veículos. É texto para cliente numa página
  nova (designer-ux e catalogo-grafico).
- **Pág. 3 do Portfólio:** a nota "sistema do veículo → família → produto" sai sem as setas ("sistema do veículo
  família  produto"), também na entrega de 23/10 (a fonte não desenha o "→"; designer-ux e catalogo-grafico).
- **Bieletas na Linha Pesada** (`port-b-p46-…`): a primeira aplicação é "Doblo", que é veículo leve. É a linha do item
  na base (catalogo-dados).

## Reteste

Depois do "aprovado" do Alexandre: conferir no PR a capa da Linha Moto contra `moto-p01-capa-zoom-depois.png` e o
Portfólio contra a variante escolhida (o número de páginas, o "+4.500", as 3 páginas de "1 item", "Cubos e Rolamentos"
só em Rodagem se for a b), o `pdfinfo` (título "Portfólio de Produtos BAP AUTOPARTS" e autor "BAP AUTOPARTS" iguais aos
da entrega), a busca de preço, estoque e uso interno no texto do PDF e a grafia "BAP AUTOPARTS". Fechar o MC-0015.

## Entrega final

| Campo | Valor |
|---|---|
| Data | 23/11/2026 08:34 (Manaus) |
| Decisão | R-20261123-122814-po: 3 b (Rolamentos em Rodagem, 88 págs.), 4 a (as datas de 2026 ficam; a troca vai para a fila), 5 a (simulação aprovada com os ajustes das aplicações) |
| O que foi visto | O branch `catalogo-grafico/T-0028-entregas`, head `ac36418`: os 2 PDFs novos de `catalogo_grafico/entregas/` (`pdfinfo` e `pdftotext`), e as pranchas de `recados/anexos/T-0028/final/` (commit `dd43f4a`), em especial `moto-p01-capa.png` e `portfolio-nova-1item-filtro-ar-moto.png` |
| Parecer | **LIBERADO**. MC-0015 fechado. Nenhum achado novo |

- **Metadados:** o Portfólio tem o título "Portfólio de Produtos BAP AUTOPARTS", o autor "BAP AUTOPARTS" e 88 págs. A
  Linha Moto tem o título "Catálogo BAP 2027 — Linha Moto (uso interno)", o autor "BAP AUTOPARTS" e 17 págs. Os dois
  estão iguais aos de antes, fora o número de páginas do Portfólio.
- **Capa da Linha Moto:** a capa diz "7 linhas · 75 itens para motocicletas", igual à simulação, e só a pág. 1 muda.
  **MC-0015 fechado.**
- **Grafia:** "BAP AUTOPARTS" está certo em tudo, sem "BAP AUTO PARTS" nem "BAP Autoparts". Não sobra nenhum "1 itens".
  As páginas de produto de "Cubos e Rolamentos" saem só em Rodagem (3 b). As aplicações da página nova de Filtros de Ar
  da Linha Moto saem separadas, uma por linha, e o defeito que eu tinha apontado em "Fora da marca" saiu. As datas de
  2026 ficam como estão (4 a).
- **Sem preço e sem estoque:** a busca no texto dos 2 PDFs por "R$" com número, estoque, saldo, custo, margem, MOQ, FOB,
  ranking e fornecedor não acha nada. O Portfólio não tem aviso de uso interno. A Linha Moto segue "uso interno", como
  antes.
- **Continua para a fila:**
  - o MC-0017, com "Gm" 5 vezes, "Vw" 3 vezes e "effitech" 1 vez no texto do Portfólio;
  - as datas (4 a);
  - a seta "→" da pág. 3, que o `catalogo-grafico` passou à marca. Minha recomendação: escrever em palavras, "Dentro
    da linha: sistema do veículo, família e produto.". Assim não depende de nenhum caractere especial da Poppins.
    Como muda texto do material para cliente, vai na mesma rodada das datas, com simulação.
