# T-0023 · Parecer de marca das entregas finais (grafia "BAP AUTOPARTS", MC-0010, fotos e tema do .pptx)

| Campo | Valor |
|---|---|
| Tarefa | T-0023, entregas geradas de novo depois do "aprovado" da simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 04:05 (Manaus) |
| O que foi visto | PR #128, branch `catalogo-grafico/T-0023-grafia`, head `1380e9fc8faaf0a7ed7d376fcf9f5482a15f1e9c` (commits `c9fbf3e`, `f0f5ea5` e `1380e9f` depois da simulação); as 6 entregas de `catalogo_grafico/entregas/` contra as anteriores; os 3 pares de conferência do dono (A4 pág. 2, Lubrificantes PDF pág. 7, .pptx slide 2 no LibreOffice); páginas 1, 2, 10 e 11 do PDF de Lubrificantes renderizadas por mim e o cabeçalho da pág. 10 a 300 ppi |
| Base de comparação | `docs/marca/manual.md` ("Nome da marca"); o resto do levantamento ainda é "a aprovar" |
| Parecer | **LIBERADO**. MC-0010 fechado. Um achado novo, baixo e anterior à tarefa (MC-0011), que não segura |

## 1. Logo no cabeçalho de Lubrificantes (MC-0010)

| Item | PDF (`apres_bemol.py`) | .pptx (`apres_ppt.js`) |
|---|---|---|
| Págs./slides 2 a 10, fundo branco | `pptimg/logo_escuro.png`, o mesmo arquivo do site (`site/assets/logo_escuro.png`, SHA-256 igual), nas 9 páginas | o mesmo `logo_escuro.png`, no mestre BAP_CONTEUDO |
| Tamanho | 21,8 × 30 pt, proporção do original (226 × 312 px); não esticado | 24 × 33 pt (diferença de 0,4 % na proporção, invisível) |
| Posição | x 40, y 26: a mesma caixa do logo de antes; só trocou o arquivo | x 40, y 22, igual à entrega anterior |
| Capa (pág./slide 1) e "Obrigado!" (pág./slide 11), fundo escuro | logo branco (`dimg/capa_0.png`), mesma caixa e mesmos pixels de antes; o `logo_grande` da pág. 11 também igual | logo branco (`pptimg/logo_branco.png`, igual ao `site/assets/logo_branco.png`) e `logo_grande`, como antes |

No cabeçalho, o "bap" e a assinatura "componentes de qualidade" agora aparecem em preto sobre o branco, com o círculo
verde; antes só o círculo aparecia. Nenhum outro pixel das págs. 2 a 10 mudou fora do logo e da grafia.
**MC-0010: fechado.**

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

- Nos cabeçalhos com espaçamento entre letras, conferi a largura: "BAP AUTOPARTS" ficou 3,4 pt mais curto em
  Lubrificantes e 2,8 a 3 pt no A4, isto é, sumiu o espaço entre AUTO e PARTS; a fonte, o corpo e a cor são os de antes
  (Poppins Bold em verde escuro nos sobretítulos; Poppins Medium em cinza claro `#D1D3D4` na barra escura do A4).
- `www.bapautoparts.com.br`, `@bapautoparts` e o e-mail ficam em minúsculas: é endereço, não é a grafia da marca.
- No gerador do head, `git grep` só acha "BAP AUTOPARTS", o domínio, o @ e o e-mail.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0010 | Lubrificantes PDF, cabeçalho das págs. 2 a 10 | logo | manual a aprovar (logo certo para cada fundo) | alta | **Fechado** no reteste: `pptimg/logo_escuro.png` nas 9 páginas, mesma caixa; capa e "Obrigado!" com o branco | catalogo-grafico |
| MC-0011 | Lubrificantes .pptx, todos os slides (`apres_ppt.js:5`, `headFontFace`/`bodyFontFace: 'Arial'`) | tipografia | manual a aprovar (só Poppins) | baixa, **anterior à T-0023** (igual na entrega de outubro) | O .pptx sai em Arial, e o PDF da mesma apresentação em Poppins. Pode ser de propósito (o .pptx abre igual em qualquer computador, sem instalar fonte). Não mexer agora: levar como pergunta no manual "a aprovar" (Poppins no .pptx, com a fonte instalada ou embutida, ou Arial como fonte de reserva aceita só em arquivo editável) | design-de-marca (pergunta ao Alexandre, pelo `po`); depois, catalogo-grafico |

Correção ao parecer da simulação (`T-0023-simulacao.md`, "O que a simulação não mostra"): a fonte diferente do .pptx não
vem só da falta da Poppins no LibreOffice; o tema e o texto do .pptx são Arial desde o gerador (MC-0011).

## Observação (não é achado)

O logo do cabeçalho tem 30 pt de altura no PDF e 33 pt no .pptx (y 26 e y 22). Já era assim antes e a diferença não se
nota na tela. Fica para o manual "a aprovar", junto com o tamanho mínimo do logo.
