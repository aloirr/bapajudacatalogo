# T-0023 · Parecer de marca das entregas finais (grafia "BAP AUTOPARTS", MC-0010, fotos e tema do .pptx)

| Campo | Valor |
|---|---|
| Tarefa | T-0023, entregas geradas de novo depois do "aprovado" da simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 04:05 (Manaus) |
| O que foi visto | PR #128, branch `catalogo-grafico/T-0023-grafia`, head `1380e9fc8faaf0a7ed7d376fcf9f5482a15f1e9c` (commits `c9fbf3e`, `f0f5ea5` e `1380e9f` depois da simulação); as 6 entregas de `catalogo_grafico/entregas/` contra as anteriores; os 3 pares de conferência do dono (A4 pág. 2, Lubrificantes PDF pág. 7, .pptx slide 2 no LibreOffice); páginas 1, 2, 10 e 11 do PDF de Lubrificantes renderizadas por mim e o cabeçalho da pág. 10 a 300 ppi |
| Base de comparação | `docs/marca/manual.md` ("Nome da marca"); o resto do levantamento ainda é "a aprovar" |
| Parecer | **LIBERADO**. MC-0010 fechado. Dois achados novos, baixos e anteriores à tarefa (MC-0011 e MC-0012), que não seguram |

## 1. Logo no cabeçalho de Lubrificantes (MC-0010)

| Item | PDF (`apres_bemol.py`) | .pptx (`apres_ppt.js`) |
|---|---|---|
| Págs./slides 2 a 10, fundo branco | `pptimg/logo_escuro.png`, o mesmo arquivo do site (`site/assets/logo_escuro.png`, SHA-256 igual), nas 9 páginas | o mesmo `logo_escuro.png`, no mestre BAP_CONTEUDO |
| Tamanho | 21,8 × 30 pt, proporção do original (226 × 312 px); não esticado | 24 × 33 pt (diferença de 0,4 % na proporção, invisível) |
| Posição | x 40, y 26: a mesma caixa do logo de antes; só trocou o arquivo. A altura do PDF (30 pt) e a do .pptx (33 pt) já eram diferentes: fica para o manual "a aprovar", com o tamanho mínimo do logo. | x 40, y 22, igual à entrega anterior |
| Capa (pág./slide 1) e "Obrigado!" (pág./slide 11), fundo escuro | logo branco (`dimg/capa_0.png`), mesma caixa e mesmos pixels de antes; o `logo_grande` da pág. 11 também igual | logo branco (`pptimg/logo_branco.png`, igual ao `site/assets/logo_branco.png`) e `logo_grande`, como antes |

No cabeçalho, o "bap" e a assinatura "componentes de qualidade" agora aparecem em preto sobre o branco, com o círculo
verde; antes só o círculo aparecia (a assinatura, nesse tamanho, não se lê: MC-0012). Nenhum outro pixel das págs. 2 a
10 mudou fora do logo e da grafia.

## 2. Fotos de Lubrificantes vindas de `pptimg/`

As 13 imagens do PDF novo são as mesmas da entrega anterior, pixel a pixel; a única imagem nova é o logo escuro. Para a
marca, nada muda nos cartões de produto.

## 3. Cores do .pptx (tema gravado pelo `apply_theme.js`)

- O tema sai com o nome "BAP" (tema, cores e fontes) e o `theme1.xml` é igual, byte a byte, ao da entrega anterior.
- As 12 cores do tema são as da paleta em uso no PDF da mesma apresentação (dicionário `C` do `apres_bemol.py`, as mesmas
  do `digital2.py`):

| Tema | Hex | Cor da BAP no PDF | Usada nos slides |
|---|---|---|---|
| dk1 / tx1 | `#141514` | `black` | sim (texto, cartões escuros) |
| lt1 / bg1 | `#FFFFFF` | `white` | sim |
| dk2 / tx2 | `#1F7A32` | `gdark` | sim (nome no topo, número do slide) |
| lt2 / bg2 | `#EEF4EC` | `hero` | sim (faixas claras) |
| accent1 | `#3DAE49` | `green` | sim (sobretítulos) |
| accent2 | `#5CB85F` | `green2` | sim (números grandes) |
| accent3 | `#F28C28` | `orange` | não |
| accent4 | `#4D514D` | `sec` | sim (texto secundário, rodapé) |
| accent5 | `#DFE2DC` | `line` | não |
| accent6 | `#242624` | `card` | sim (1 cartão) |
| hlink / folHlink | `#1F7A32` | `gdark` | links |

- Cor solta fora do tema nos slides: só `#CFD3CF` (texto cinza claro na capa e no "Obrigado!"), que é o `lgrey` do PDF.
  Nenhuma cor nova e nenhuma "quase igual".
- O verde ainda é o `#3DAE49` do PDF, não o verde medido do logo: é o esperado, porque a troca para o verde do logo
  (R-20261120-115646-alexandre) só vale depois do "aprovado" da simulação, que ainda não foi feita. A apresentação fica
  coerente com o PDF dela e com o catálogo digital.

## 4. Grafia em todas as entregas

Texto extraído de todas as páginas, metadados e todo o XML do .pptx:

| Entrega | "BAP AUTOPARTS" | Grafia errada ("BAP AUTO PARTS", "Auto Parts", "Autoparts") |
|---|---|---|
| A4 gráfica (56 págs.) | barra do topo, sobretítulo e texto "Quem somos" da pág. 2; autor | nenhuma |
| Digital completo (311 págs.) | autor | nenhuma |
| Linha Moto (17 págs.) | autor | nenhuma |
| Kit Filtros (18 págs.) | autor | nenhuma |
| Lubrificantes PDF (11 págs.) | cabeçalho das págs. 2 a 10, título "A BAP AUTOPARTS", cartão do contato; autor | nenhuma |
| Lubrificantes .pptx | mestre, título do slide 2, cartão do slide 11; criador e "modificado por" | nenhuma |
| Portfólio (não regerado; já estava certo) | capa, pág. 2, cabeçalhos e contato; autor | nenhuma |

- Cabeçalhos, domínio, @ e e-mail: como na simulação (só sumiu o espaço entre AUTO e PARTS; mesma fonte, mesmo corpo e mesma cor); no gerador do head, o `git grep` só acha "BAP AUTOPARTS" e os endereços.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0010 | Lubrificantes PDF, cabeçalho das págs. 2 a 10 | logo | manual a aprovar (logo certo para cada fundo) | alta | **Fechado** no reteste: `pptimg/logo_escuro.png` nas 9 páginas, mesma caixa; capa e "Obrigado!" com o branco | catalogo-grafico |
| MC-0011 | Lubrificantes .pptx, todos os slides (`apres_ppt.js:5`, `headFontFace`/`bodyFontFace: 'Arial'`) | tipografia | manual a aprovar (só Poppins) | baixa, **anterior à T-0023** (igual na entrega de outubro) | O .pptx sai em Arial, e o PDF da mesma apresentação em Poppins. Pode ser de propósito (o .pptx abre igual em qualquer computador, sem instalar fonte). Não mexer agora: levar como pergunta no manual "a aprovar" (Poppins no .pptx, com a fonte instalada ou embutida, ou Arial como fonte de reserva aceita só em arquivo editável) | design-de-marca (pergunta ao Alexandre, pelo `po`); depois, catalogo-grafico |
| MC-0012 | Lubrificantes, cabeçalho das págs./slides 2 a 10 (logo com 30 pt de altura no PDF e 33 pt no .pptx); o mesmo vale para o topo do site (46 px) | logo | manual a aprovar (tamanho mínimo do logo; ainda não definido) | baixa, **anterior à T-0023** (o .pptx já aprovado tem o mesmo logo, no mesmo tamanho) | A assinatura "componentes de qualidade" fica com cerca de 2,5 pt e não se lê (nota do designer-ux). O círculo e o "bap" continuam legíveis, então o reconhecimento da marca não cai. Não mexer agora, nem cortar o PNG para tirar a assinatura. Levar ao manual "a aprovar": o tamanho mínimo do logo com assinatura e o pedido ao Alexandre de uma versão oficial sem a assinatura (de preferência em vetor) para usos pequenos (cabeçalho, favicon) | design-de-marca (pergunta ao Alexandre, pelo `po`); depois, catalogo-grafico e web-site |
