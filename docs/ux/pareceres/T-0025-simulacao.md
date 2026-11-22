# T-0025 · Parecer de UX da simulação (repetições no A4 pág. 2 e em Lubrificantes, PDF e .pptx)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 05:47 (Manaus) |
| O que foi revisto | A simulação do `catalogo-grafico`, no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0025/sim/` (commit 5402d30): o `LEIA.md`, com as 10 perguntas, e os 16 PNGs de antes e depois. Também o diff do gerador (5 arquivos, +17 −16: `apres_bemol.py`, `apres_ppt.js`, `print_cat.py`, `digital2.py` e `catalogo_moto.py`), sobre o main `5c0ddda`, que o gerente me passou e que ficou fora dos anexos |
| Pedido | T-0025 (R-20261122-080833-po e R-20261122-082826-po) |
| Regra da rodada | R-20261122-090651-alexandre: o PO decide de forma conservadora, só tirando repetição e sem mudar a marca |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. Nenhuma página mostra valor ou quantidade.

## 1. A4, pág. 2 "Por que BAP?" (RD-0429)
Prints: `RD0429_A4_pag02_antes_depois.png` e, avulsos, `RD0429_A4_antes_pag02.png` e `RD0429_A4_depois_pag02.png`.

- 🟢 **Hierarquia.** A ordem de leitura não muda: a barra, a faixa com o sobretítulo e o título, "Quem somos", "Por que vender BAP", "Garantia Expressa BAP" e os números. Sem o subtítulo, o sobretítulo e o título se centralizam na faixa (`hero` em `print_cat.py:131-133`, sem descrição). A faixa mantém a altura das outras páginas, e "Por que BAP?" fica mais forte, sem uma linha pequena encostada embaixo.
- 🟢 **A barra com o lado direito vazio.** Nas páginas de família, o lado direito da barra diz em que grupo o leitor está (`topbar(dc, f['group'])`, `print_cat.py:414`). A pág. 2 não pertence a nenhum grupo. Escrever "BAP AUTOPARTS" ali repetia o sobretítulo, e escrever "CATÁLOGO 2027" repetiria o "CATÁLOGO DE PRODUTOS 2027" da esquerda. O vazio não deixa a barra torta: o logo e o nome do catálogo seguem ancorados à esquerda, como na capa interna de qualquer catálogo.
- 🟢 **Os números.** Com 3 cartões na mesma largura total, cada um fica cerca de 35% mais largo. Os números e os rótulos seguem centralizados, em uma linha só, sem nada encostar na borda.
- 🟢 **A garantia.** Antes, ela aparecia 3 vezes na página: no bloco, no cartão "SAC" e na linha de baixo. Agora fica só no bloco "Garantia Expressa BAP".
- 🟢 **Nenhuma informação útil se perde.**
  - O SAC continua escrito na página, no bloco da garantia (`print_cat.py:485`, "…direto com a fábrica pelo SAC BAP").
  - O cartão "SAC" não trazia telefone nem endereço, só "garantia direto na fábrica". Por isso não era o único lugar de nenhum dado de contato.
  - A linha "Prazos de garantia conforme o certificado da embalagem de cada produto." diz o mesmo que o "Prazos conforme o certificado da embalagem" do bloco.
  - O subtítulo "Componentes de qualidade, com segurança e preço acessível." está palavra por palavra no "Quem somos", logo abaixo.
- 🟢 **Equilíbrio.** Ver a nota 5.1.

## 2. Lubrificantes, cabeçalho das págs. 2 a 10 (RD-0428)
Prints: `RD0428_cabecalho_zoom_antes_depois.png`, `RD0428_Lub_PDF_pag03_antes_depois.png`, `Lub_PDF_antes_p03.png`, `Lub_PDF_depois_p03.png`, `Lub_PPTX_antes_p03.png` e `Lub_PPTX_depois_p03.png`.

- 🟢 **Hierarquia.** O cabeçalho passa a ter só o logo, o sobretítulo e o título. A etiqueta pequena em verde-escuro ao lado do logo competia com o sobretítulo verde logo abaixo, porque os dois tinham o mesmo estilo de letra espaçada em caixa alta. Sem ela, o olho vai direto do logo ao sobretítulo e ao título.
- 🟢 **O nome da empresa continua presente.**
  - O "bap" do logo se lê.
  - "A BAP AUTOPARTS" é o título da pág. 2 e do slide 2.
  - O rodapé de todas as páginas traz "www.bapautoparts.com.br".
  - O que fica ilegível é só a assinatura do logo, que já era ilegível antes. Isso é o MC-0012, pergunta 7.
- 🟢 **Equilíbrio.** O logo fica no mesmo lugar e no mesmo tamanho. O lado direito do cabeçalho já era vazio antes. A capa (pág. 1) e o "Obrigado!" (pág. 11) não mudam.
- 🟢 **PDF e .pptx iguais.** A etiqueta sai dos dois, e o cabeçalho fica igual no PDF e no .pptx.

## 3. Lubrificantes, pág. 2 e slide 2 (RD-0430)
Prints: `RD0428_RD0430_Lub_pag02_antes_depois.png`, `Lub_PDF_antes_p02.png`, `Lub_PDF_depois_p02.png`, `Lub_PPTX_antes_p02.png` e `Lub_PPTX_depois_p02.png`.

- 🟢 **Hierarquia.** A página segue com o título, o parágrafo, os números e a caixa da garantia. Os 3 cartões ocupam a mesma largura total dos 4 de antes e se alinham com a caixa da garantia, que tem 880 de largura, nas duas bordas. O rótulo "presença em todos os estados", o mais longo, ganha folga dentro do cartão.
- 🟢 **Nenhuma informação útil se perde.** O SAC continua na caixa "Garantia Expressa BAP" ("…pelo SAC BAP, sem intermediários, conforme o certificado da embalagem."). Também continua mais adiante na apresentação, no item "Garantia sem burocracia" (`apres_bemol.py:238` e `apres_ppt.js:186`). O cartão não tinha contato próprio.
- 🟢 **Uma informação, um lugar.** O cartão "SAC · garantia direto com a fábrica" repetia a primeira metade da frase da caixa, que fica logo abaixo.
- 🟢 **Equilíbrio.** Três blocos pretos largos sobre uma faixa clara de largura inteira dão uma página mais calma que quatro blocos estreitos. O vão entre o parágrafo e os números não muda.

## 4. Recomendação por pergunta
| # | Pergunta | Recomendação de UX | Por quê |
|---|---|---|---|
| 1 | RD-0428, tirar a etiqueta do cabeçalho | **a) Sim** | §2 |
| 2 | RD-0429, barra da pág. 2 do A4 | **a) Lado direito vazio** | §1 |
| 3 | RD-0429, subtítulo, cartão SAC e linha de prazos | **a) Sim** | §1 |
| 4 | RD-0430, Lubrificantes pág. 2 | **a) Sai o cartão do SAC e fica a caixa** | A opção b) perderia o nome "Garantia Expressa BAP" e o "conforme o certificado da embalagem" (§3) |
| 5 | Título dos metadados da Linha Moto | **b) "Catálogo BAP 2027 — Linha Moto (uso interno)"** | O título aparece na aba e na janela do leitor de PDF e tira só o "Completo", que está errado (padrão dos títulos: ver o parecer de marca, §4) |
| 6 | MC-0011, .pptx em Poppins | **b) Deixar para o Alexandre** | No `MC0011_pptx_fonte_arial_poppins.png`, a Poppins com a fonte instalada quebra "Fluido de freio DOT 4" e deixa o "4" sozinho (slide 8). Fonte: ver o parecer de marca, §5 |
| 7 | MC-0012, tamanho do logo | **b) Deixar para o Alexandre** | No `MC0012_cabecalho_logo_30_48_72pt.png`, com 48 pt o logo já encosta no sobretítulo e com 72 pt cobre o título. Isso pede refazer o cabeçalho de 9 páginas e 9 slides (saída de marca: ver o parecer de marca, §5) |
| 8 | RD-0431, conteúdo em 2 cópias | **a) Um arquivo de conteúdo só** | Não muda nada na tela, se as páginas saírem iguais pixel a pixel, como o `LEIA.md` promete. Peço que essa conferência venha na entrega. A opção c) tiraria um material editável que o time usa, e isso não é tirar repetição |
| 9 | RD-0432, apagar as cópias históricas | **a) Sim** | Não muda nada na tela. Apagar evita corrigir o mesmo texto em 2 lugares, como foi preciso na T-0023 |
| 10 | `portfolio_v1_por_sistema.py` | **a) Sim, com um RD novo** | Não muda nada na tela. O arquivo ainda traz o texto da garantia com o SAC (`portfolio_v1_por_sistema.py:205`), que seria uma 3ª cópia para manter em dia |

## 5. Notas (não seguram)
1. **O espaço branco na pág. 2 do A4.** No antes e no depois, a metade de baixo da página fica vazia, cerca de 1/3 da altura entre os números e o rodapé. Com os cortes, esse espaço cresce uma linha. Isso já existia, e preencher o espaço é mudança de layout, fora da regra desta rodada. Fica como sugestão para uma tarefa futura, com simulação ao Alexandre. Por exemplo, os números podem descer, ou a página pode ganhar uma foto institucional.
2. **A caixa da garantia no .pptx não tem o filete verde à esquerda, e a do PDF tem** (`RD0428_RD0430_Lub_pag02_antes_depois.png`, pág. 2 e slide 2). A diferença já estava no antes e não é repetição. Fica para o `design-de-marca`, se ele achar que vale.

## Prints conferidos
Todos estão no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0025/sim/` (commit 5402d30):
- **A4:** `RD0429_A4_pag02_antes_depois.png`, `RD0429_A4_antes_pag02.png` e `RD0429_A4_depois_pag02.png`.
- **Lubrificantes, pág. 2:** `RD0428_RD0430_Lub_pag02_antes_depois.png` e `Lub_PDF_*_p02.png` e `Lub_PPTX_*_p02.png`, antes e depois.
- **Lubrificantes, cabeçalho:** `RD0428_cabecalho_zoom_antes_depois.png`, `RD0428_Lub_PDF_pag03_antes_depois.png` e `Lub_PDF_*_p03.png` e `Lub_PPTX_*_p03.png`, antes e depois.
- **Só mostrar:** `MC0011_pptx_fonte_arial_poppins.png` e `MC0012_cabecalho_logo_30_48_72pt.png`.

**Resultado: LIBERADO.** A simulação pode seguir para a decisão do PO, com as recomendações do §4.

---

## Entrega final (PR #141)

| Campo | Valor |
|---|---|
| Data | 22/11/2026 06:00 (Manaus) |
| O que foi revisto | O PR #141, branch `catalogo-grafico/T-0025-entregas`, head `a00b55d7cfb5d06017bd155b3eeaabc4a4fb585c`, comparado com o origin/main `0994bab`. O main atual é o `ebf0f5b` (#140, que só mexe em `docs/qualidade/`), e as entregas e o gerador são iguais nos dois. Os arquivos conferidos foram as entregas `Catalogo_BAP_2027_A4_grafica.pdf`, `Catalogo_BAP_2027_Linha_Moto.pdf`, `BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf` e `.pptx`, e no gerador `print_cat.py`, `apres_bemol.py`, `apres_ppt.js`, `apres_conteudo.json`, `digital2.py` e `catalogo_moto.py` |
| Decisão do PO | 1b, 2a, 3a, 4a, 5b, 6b, 7b, 8a, 9a e 10a. Com o 1b, a etiqueta "BAP AUTOPARTS" do cabeçalho de Lubrificantes fica, inclusive na pág. 2 |
| Pranchas | No aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0025/final/` (commit 13207b0) |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. Nenhum valor nem quantidade aparece. O texto institucional é o mesmo do antes.

### A entrega bate com a simulação aprovada, ajustada pelo 1b
- 🟢 **A4, pág. 2** (`A4_pag02_antes_depois.png`, `a4_antes_p02.png` e `a4_depois_p02.png`)
  - O `a4_depois_p02.png` é idêntico, byte a byte, ao `RD0429_A4_depois_pag02.png` da simulação (5402d30).
  - No PR, a mudança do `print_cat.py` é a mesma linha a linha do diff da simulação: a barra com o lado direito vazio (2a), sem o subtítulo, sem o cartão do SAC e sem a linha dos prazos (3a).
  - Renderizei o PDF entregue com o `pdftoppm` e conferi: a pág. 2 é a da prancha.
  - Comparei com o main, renderizando as 56 páginas: **só a pág. 2 muda**, e o PDF continua com 56 páginas.
- 🟢 **Lubrificantes, pág. 2 do PDF e slide 2 do .pptx** (`Lubrificantes_pag02_PDF_e_PPTX_antes_depois.png`, `lpdf_antes_p02.png`, `lpdf_depois_p02.png`, `lppt_antes_p02.png` e `lppt_depois_p02.png`)
  - Comparei com o "depois" da simulação. A única diferença, no PDF e no .pptx, é a caixa da etiqueta ao lado do logo, com cerca de 1.240 pixels. Ou seja, a etiqueta voltou, como manda o 1b.
  - Comparei com o "antes". A única diferença é a faixa dos números, de y 512 a 792: os 3 cartões tomam a largura dos 4 (4a). O cabeçalho e a caixa "Garantia Expressa BAP" ficam iguais aos de hoje.
  - Os "antes" das pranchas são idênticos aos da simulação: 0 pixel diferente.
- 🟢 **Lubrificantes, as outras páginas.** Comparei com o main.
  - **PDF:** renderizei as 11 páginas, e só a pág. 2 muda. O texto das págs. 1 e 3 a 11 é igual.
  - **.pptx:** abri o pacote. Mudam só o `slide2.xml`, a data em `core.xml` e os ids das seções em `presentation.xml`, que o `pptxgenjs` sorteia a cada geração e que não aparecem na tela.
- 🟢 **O SAC continua no lugar.**
  - Na caixa da garantia da pág. 2 (`apres_conteudo.json:17`).
  - No item "Garantia sem burocracia" (`apres_conteudo.json:112`).
  - No bloco "Garantia Expressa BAP" do A4.
  - Nenhuma informação útil se perdeu.
- 🟢 **Linha Moto (5b).** O PDF continua com 17 páginas (metadados: ver o parecer de marca).
- 🟢 **6b e 7b.** Não se aplicam: o .pptx continua em Arial e o logo, no mesmo tamanho.

### Sobre o 1b
Na §2 e na pergunta 1, eu tinha recomendado tirar a etiqueta. Com o 1b, o cabeçalho fica como já era, e a etiqueta continua competindo com o sobretítulo, que tem o mesmo estilo. Isso já estava no antes e não é defeito da entrega, por isso não segura (a pergunta vai com o MC-0012: ver o parecer de marca).

As notas 5.1 e 5.2 da simulação continuam valendo e não seguram.

**Resultado da entrega final: LIBERADO** para seguir ao `revisor-codigo`.
