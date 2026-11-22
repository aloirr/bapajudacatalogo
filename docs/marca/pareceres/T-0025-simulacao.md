# T-0025 · Parecer de marca da simulação (repetições e ajustes de marca no catálogo gráfico)

| Campo | Valor |
|---|---|
| Tarefa | T-0025 (RD-0428 a RD-0432, MC-0011, MC-0012 e o título dos metadados da Linha Moto), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 05:48 (Manaus) |
| O que foi visto | Simulação do `catalogo-grafico`, feita a partir do main `5c0ddda`: o `LEIA.md` (10 perguntas) e os 16 PNGs em `recados/anexos/T-0025/sim/` do aloirr/bapajudacatalogo-recados (commit `5402d30`), e o diff do gerador (5 arquivos, +17 −16). Conferi também, no main `0994bab`, o `portfolio.py`, o `print_cat.py` (capa, contracapa, `topbar`, `hero`) e o `apres_bemol.py`/`apres_ppt.js` (capa, pág. 2 e pág. 11) |
| Base de comparação | `docs/marca/manual.md`, "Nome da marca" (decisão 10 a, R-20261122-032433-alexandre); o resto do manual ainda está "a aprovar". Meus achados MC-0011 e MC-0012 (`docs/marca/pareceres/T-0023-entregas.md`) |
| Regra da rodada | R-20261122-090651-alexandre: com o Alexandre dormindo, o PO decide de forma conservadora, só tirar repetição, sem mudar a marca |
| Parecer | Entrega final (PR #141, head `a00b55d`): **LIBERADO**, em 22/11 06:00 (seção "Entrega final"). Simulação: **LIBERADO** para o PO decidir. Uma divergência com a recomendação do `catalogo-grafico`: na pergunta 1 (RD-0428), recomendo **b) fica como está** (MC-0014). Nas perguntas 2 a 7, concordo com as recomendações |

Nada contra as regras do repositório: sem preço e sem estoque ("preço acessível" e "preço competitivo" são texto
institucional, sem valor, e já estavam no "antes"); sem logo, símbolo ou cor de terceiros. Nenhuma cor, fonte ou logo
novo entra no "depois": só sai texto e os cartões se redistribuem na mesma largura, com as mesmas cores do dicionário `C`.

Imagens citadas (todas em `recados/anexos/T-0025/sim/`, commit `5402d30`):
`RD0428_cabecalho_zoom_antes_depois.png`, `RD0428_Lub_PDF_pag03_antes_depois.png`,
`RD0428_RD0430_Lub_pag02_antes_depois.png`, `RD0429_A4_pag02_antes_depois.png`,
`MC0011_pptx_fonte_arial_poppins.png` e `MC0012_cabecalho_logo_30_48_72pt.png`.

## 1. RD-0428: a etiqueta "BAP AUTOPARTS" ao lado do logo (pergunta 1)

**A etiqueta não é a assinatura do MC-0012.** A assinatura é o "componentes de qualidade" que faz parte do desenho do
logo (dentro do PNG), com cerca de 2,5 pt no cabeçalho. A etiqueta é o **nome da empresa**, em texto, 8,5 pt no PDF e
9 pt no .pptx, e se lê bem (`RD0428_cabecalho_zoom_antes_depois.png`).

**O logo sozinho garante o reconhecimento.** O círculo verde e o "bap" continuam legíveis a 30 pt, no mesmo lugar e no
mesmo tamanho; nenhum pixel do logo muda. Como sinal visual, a marca continua presente nas págs. 2 a 10.

**Mas a etiqueta não é só repetição.** Por isso recomendo b):

- **Repetição de verdade só na pág. 2**, onde o título é "A BAP AUTOPARTS" (logo + etiqueta + título em uns 180 pt).
  Nas págs. 3 a 10 o título é do conteúdo, e a etiqueta é o **único lugar legível do nome completo**: o logo diz só
  "bap", e o resto é o endereço `bapautoparts.com.br` no rodapé. Sem ela, o "AUTOPARTS" some das págs. 3 a 10.
- **O cabeçalho é um padrão compartilhado.** O Portfólio usa o mesmo cabeçalho, com a mesma etiqueta, na mesma posição,
  no mesmo corpo e na mesma cor (`portfolio.py:69`, `NOME = 'BAP AUTOPARTS'`), e ele não muda nesta simulação. Tirar a
  etiqueta só de Lubrificantes separa as duas apresentações comerciais, que hoje têm o mesmo cabeçalho. Isso é mudar a
  aplicação da marca, e a regra da rodada pede o contrário.
- **A etiqueta depende do MC-0012.** A saída de marca do MC-0012 é uma versão oficial do logo sem a assinatura para usos
  pequenos. Nesse caso, o cabeçalho natural é "símbolo + nome legível", e a etiqueta passa a ser justamente o nome. Decidir
  a etiqueta agora, antes do MC-0012, pode obrigar a voltar atrás.

Se o PO escolher a), o cabeçalho de Lubrificantes fica sem a etiqueta e o do Portfólio fica com ela. Nesse caso, o MC-0014
fica aberto até o Alexandre decidir o padrão dos dois (com simulação do Portfólio, se ele também perder a etiqueta).

## 2. A4, pág. 2 ("Por que BAP?") (perguntas 2 e 3)

- **A marca continua bem presente:** o logo no `topbar` (com "CATÁLOGO DE PRODUTOS 2027" ao lado), o sobretítulo
  "BAP AUTOPARTS", o título "Por que BAP?" e o "A BAP AUTOPARTS é…" do "Quem somos". Tirar o nome da barra da direita só
  tira repetição: a barra fica com a mesma assinatura de todas as páginas (logo + nome do catálogo), e o lado direito das
  outras páginas é navegação (família ou "Catálogo 2027"), não marca.
- **Pergunta 2:** concordo com **a) lado direito vazio** (ver o parecer de UX, §1).
- **Pergunta 3:** concordo com **a)**. O subtítulo que sai ("Componentes de qualidade, com segurança e preço
  acessível.") começa com a assinatura, mas a assinatura **continua legível no logo da capa (150 pt) e da contracapa
  (220 pt)** do A4. O nome "Garantia Expressa BAP" fica.

## 3. Lubrificantes, pág. 2 (pergunta 4)

Concordo com **a)**. Fica a caixa "Garantia Expressa BAP", que é o nome do serviço com a marca; o cartão "SAC" não tinha
marca. Os 3 cartões mantêm o preto do cartão e o `green2` dos números; a largura total é a mesma.

## 4. Título dos metadados da Linha Moto (pergunta 5)

Concordo com **b) `Catálogo BAP 2027 — Linha Moto (uso interno)`**.

- O "Completo" está errado e sai: isso é correção, não mudança de marca.
- O "(uso interno)" é o mesmo aviso da capa ("LINHA MOTO · USO INTERNO") e das páginas, e segue o padrão dos títulos do
  A4 (`Catálogo BAP 2027 — Impressão A4 (uso interno)`) e do Completo Digital. Tirar o aviso só da Linha Moto quebraria o
  padrão dos três catálogos internos e, pela regra conservadora, não é hora de mexer nisso.
- O autor continua "BAP AUTOPARTS".

## 5. MC-0011 e MC-0012 (perguntas 6 e 7)

Concordo com **b) deixar para o Alexandre** nos dois, pelo manual "a aprovar". Os dois são mudança de marca, não tirar
repetição, e eu já tinha pedido isso na T-0023.

- **MC-0011 (`MC0011_pptx_fonte_arial_poppins.png`):** a Poppins no .pptx muda a fonte para quem não a tem instalada (sai
  outra fonte, escolhida pelo programa); a quebra do slide 8: ver o parecer de UX, pergunta 6. A pergunta ao Alexandre
  continua a mesma: Poppins no .pptx (instalada ou embutida à mão) ou Arial aceita como reserva só no arquivo editável.
- **MC-0012 (`MC0012_cabecalho_logo_30_48_72pt.png`):** a simulação confirma que só aumentar o logo não serve (ver o
  parecer de UX, pergunta 7). A saída continua a mesma: uma versão oficial do logo sem a assinatura (de preferência
  em vetor), que só o Alexandre fornece, e o tamanho mínimo no manual. **Não cortar o PNG.** O topo do site (46 px) vai na mesma pergunta, com o `web-site`.
- Levar o RD-0428 na mesma pergunta do MC-0012: o cabeçalho das apresentações (Lubrificantes e Portfólio) fica com o logo
  sozinho, ou com o símbolo e o nome "BAP AUTOPARTS" ao lado?

## 6. Grafia "BAP AUTOPARTS" em tudo o que fica

Certa em tudo (decisão 10 a). Conferi nos 6 arquivos do gerador envolvidos (`apres_bemol.py`, `apres_ppt.js`,
`print_cat.py`, `digital2.py`, `catalogo_moto.py` e `portfolio.py`): não há "BAP AUTO PARTS" nem "BAP Autoparts". O
que fica:

- A4 pág. 2: o sobretítulo "BAP AUTOPARTS" e o "A BAP AUTOPARTS é…" (§2).
- Lubrificantes pág. 2: o título "A BAP AUTOPARTS"; pág. 11: "Gerente Comercial · BAP AUTOPARTS".
- Autor dos metadados: "BAP AUTOPARTS" no A4, no Completo Digital, na Linha Moto e em Lubrificantes (PDF e .pptx).
- Portfólio: a etiqueta do cabeçalho (`NOME`).

O RD-0431 (conteúdo num arquivo só), o RD-0432 (cópias antigas do gerador) e a pergunta 10 (`portfolio_v1_por_sistema.py`)
não mudam nenhuma página: sem efeito na marca.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono | Situação |
|---|---|---|---|---|---|---|---|
| MC-0014 | Lubrificantes PDF e .pptx, cabeçalho das págs./slides 2 a 10 (`apres_bemol.py:67`, `apres_ppt.js:20`), comparado com o Portfólio (`portfolio.py:69`) | aplicação | manual a aprovar (mesma identidade em todos os materiais) e a regra da rodada (R-20261122-090651-alexandre) | baixa (a marca continua reconhecível; o nome completo some das págs. 3 a 10) | Manter a etiqueta nesta rodada (pergunta 1, opção b); a pergunta vai com o MC-0012 (§5). | catalogo-grafico (depois da decisão); pergunta pelo `po` | FECHADO em 22/11 06:00: o PO escolheu 1b (R-20261122-095019-po) e a entrega final mantém a etiqueta; a pergunta do cabeçalho segue com o MC-0012 |
| MC-0011 | (T-0023) | tipografia | manual a aprovar | baixa | Sem mudança; vai ao Alexandre | design-de-marca, depois catalogo-grafico | ABERTO, como na T-0023 |
| MC-0012 | (T-0023) | logo | manual a aprovar | baixa | Sem mudança; vai ao Alexandre, com o RD-0428 | design-de-marca, depois catalogo-grafico e web-site | ABERTO, como na T-0023 |

## Reteste

Depois da decisão do PO e da aplicação: conferir as entregas novas (A4 pág. 2; Lubrificantes PDF págs. 2, 3 e 11 e
.pptx slides 2, 3 e 11; metadados da Linha Moto) contra esta simulação, com a grafia e o cabeçalho escolhidos na
pergunta 1.

## Entrega final (PR #141)

| Campo | Valor |
|---|---|
| Data | 22/11/2026 06:00 (Manaus) |
| Decisão do PO | R-20261122-095019-po: 1b 2a 3a 4a 5b 6b 7b 8a 9a 10a |
| O que foi visto | O PR #141 (branch `catalogo-grafico/T-0025-entregas`, head `a00b55d7cfb5d06017bd155b3eeaabc4a4fb585c`): o diff do gerador e o `apres_conteudo.json`; as 4 entregas que mudam (Lubrificantes PDF e .pptx, A4 e Linha Moto), comparadas com as do main `0994bab` (páginas renderizadas, texto com `pdftotext`, metadados com `pdfinfo` e o XML do .pptx). O main atual, `ebf0f5b` (#140), só mudou `docs/qualidade/`, e as entregas nele são iguais às do `0994bab`. Também vi as pranchas finais em `recados/anexos/T-0025/final/` do aloirr/bapajudacatalogo-recados (commit `13207b0`): `Lubrificantes_pag02_PDF_e_PPTX_antes_depois.png` e `A4_pag02_antes_depois.png` |
| Parecer | **LIBERADO**. Nenhum achado novo |

- **Etiqueta "BAP AUTOPARTS" (1b):** fica em todo o cabeçalho de Lubrificantes.
  - PDF: o `header` escreve `K['marca']` (`"BAP AUTOPARTS"` no `apres_conteudo.json`) na mesma posição, no mesmo corpo
    (8,5 pt) e na mesma cor (`gdark`). O nome aparece nas págs. 2 a 10 (na pág. 2, duas vezes: etiqueta e título) e na
    pág. 11 (contato), como antes.
  - .pptx: o mestre `BAP_CONTEUDO` (`slideLayout3.xml`) é igual, byte a byte, ao do main, com a etiqueta, e os slides 2 a
    10 usam esse layout.
  - O cabeçalho continua igual ao do Portfólio (`portfolio.py:69`), que não mudou.
- **Grafia:** "BAP AUTOPARTS" certa em tudo. Não há "BAP AUTO PARTS" nem "BAP Autoparts" no diff nem no texto dos 3
  PDFs. No .pptx, o nome aparece nos mesmos lugares de antes (mestre, slides 2 e 11, autor).
- **Metadados:** a Linha Moto tem agora o título `Catálogo BAP 2027 — Linha Moto (uso interno)` (antes, "— Completo (uso
  interno)"). O A4 (`— Impressão A4 (uso interno)`) e Lubrificantes não mudaram. O autor continua "BAP AUTOPARTS" nos 3
  PDFs e no .pptx.
- **Nada de marca mudou fora do pedido:** só mudam a pág. 2 do A4 e de Lubrificantes (PDF e .pptx) e o título dos
  metadados da Linha Moto (comparação página a página do A4 e de Lubrificantes: ver o parecer de UX). A Linha Moto tem
  as 17 páginas iguais às do main, pixel a pixel; muda só o título dos metadados (§4). Nenhuma cor, fonte (o .pptx
  continua em Arial, 6b), logo ou tamanho de logo mudou. O Completo Digital e o Kit Filtros não mudam no PR.
- **Regras do repositório:** sem preço e sem estoque; sem marca de terceiros. As frases de Lubrificantes passaram para
  o `apres_conteudo.json` sem mudar uma palavra.
- **Achados:** o MC-0014 está fechado (a etiqueta ficou). O MC-0011 e o MC-0012 seguem abertos para o Alexandre, pelo
  manual "a aprovar". A pergunta sobre o cabeçalho das apresentações (logo sozinho, ou símbolo + "BAP AUTOPARTS") vai
  junto com o MC-0012.
