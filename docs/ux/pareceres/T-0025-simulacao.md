# T-0025 · Parecer de UX da simulação (repetições no A4 pág. 2 e em Lubrificantes, PDF e .pptx)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 05:47 (Manaus) |
| O que foi revisto | A simulação do `catalogo-grafico`, no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0025/sim/` (commit 5402d30): o `LEIA.md`, com as 10 perguntas, e os 17 PNGs de antes e depois. Também o diff do gerador (5 arquivos, +17 −16: `apres_bemol.py`, `apres_ppt.js`, `print_cat.py`, `digital2.py` e `catalogo_moto.py`), sobre o main `5c0ddda` |
| Pedido | T-0025 (R-20261122-080833-po e R-20261122-082826-po) |
| Regra da rodada | R-20261122-090651-alexandre: o PO decide de forma conservadora, só tirando repetição e sem mudar a marca |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. Nenhuma página mostra valor ou quantidade. "Preço acessível" e "preço competitivo" são o texto institucional que já estava no antes.

## 1. A4, pág. 2 "Por que BAP?" (RD-0429)
Prints: `RD0429_A4_pag02_antes_depois.png` e, avulsos, `RD0429_A4_antes_pag02.png` e `RD0429_A4_depois_pag02.png`.

- 🟢 **Hierarquia.** A ordem de leitura não muda: a barra, a faixa com o sobretítulo e o título, "Quem somos", "Por que vender BAP", "Garantia Expressa BAP" e os números. Sem o subtítulo, o sobretítulo e o título se centralizam na faixa (`hero` em `print_cat.py:131-133`, sem descrição). A faixa mantém a altura das outras páginas, e "Por que BAP?" fica mais forte, sem uma linha pequena encostada embaixo.
- 🟢 **A barra com o lado direito vazio.** Nas páginas de família, o lado direito da barra diz em que grupo o leitor está (`topbar(dc, f['group'])`, `print_cat.py:414`). A pág. 2 não pertence a nenhum grupo. Escrever "BAP AUTOPARTS" ali repetia o sobretítulo, e escrever "CATÁLOGO 2027" repetiria o "CATÁLOGO DE PRODUTOS 2027" da esquerda. O vazio não deixa a barra torta: o logo e o nome do catálogo seguem ancorados à esquerda, como na capa interna de qualquer catálogo.
- 🟢 **Os números.** Com 3 cartões na mesma largura total, cada um fica cerca de 35% mais largo. Os números e os rótulos seguem centralizados, em uma linha só, sem nada encostar na borda.
- 🟢 **A garantia.** Antes, ela aparecia 3 vezes na página: no bloco, no cartão "SAC" e na linha de baixo. Agora fica só no bloco "Garantia Expressa BAP", que é o lugar mais completo, com o nome, o "pelo SAC BAP", o "Prazos conforme o certificado da embalagem" e o "sem intermediários".
- 🟢 **Nenhuma informação útil se perde.**
  - O SAC continua escrito na página, no bloco da garantia (`print_cat.py:485`, "…direto com a fábrica pelo SAC BAP").
  - O cartão "SAC" não trazia telefone nem endereço, só "garantia direto na fábrica". Por isso não era o único lugar de nenhum dado de contato.
  - A linha "Prazos de garantia conforme o certificado da embalagem de cada produto." diz o mesmo que o "Prazos conforme o certificado da embalagem" do bloco.
  - O subtítulo "Componentes de qualidade, com segurança e preço acessível." está palavra por palavra no "Quem somos", logo abaixo.
- 🟢 **Equilíbrio.** O espaço branco embaixo dos números cresce só a altura de uma linha, porque a linha de garantia saiu. Veja a nota 5.1.

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
| 1 | RD-0428, tirar a etiqueta do cabeçalho | **a) Sim** | A etiqueta competia com o sobretítulo, e o nome segue no logo, no título da pág. 2 e no rodapé (§2) |
| 2 | RD-0429, barra da pág. 2 do A4 | **a) Lado direito vazio** | O lado direito diz o grupo, e a pág. 2 não tem grupo. A opção b) repete o "CATÁLOGO DE PRODUTOS 2027" da esquerda na mesma barra (§1) |
| 3 | RD-0429, subtítulo, cartão SAC e linha de prazos | **a) Sim** | Os 3 trechos estão palavra por palavra ou com o mesmo sentido no "Quem somos" e no bloco "Garantia Expressa BAP", na mesma página (§1) |
| 4 | RD-0430, Lubrificantes pág. 2 | **a) Sai o cartão do SAC e fica a caixa** | A caixa é o lugar mais completo. A opção b) perderia o nome "Garantia Expressa BAP" e o "conforme o certificado da embalagem" (§3) |
| 5 | Título dos metadados da Linha Moto | **b) "Catálogo BAP 2027 — Linha Moto (uso interno)"** | O título aparece na aba e na janela do leitor de PDF e deve dizer o mesmo que a capa ("LINHA MOTO · USO INTERNO") e o aviso das páginas. Segue o padrão do A4 e do Completo Digital e tira só o "Completo", que está errado |
| 6 | MC-0011, .pptx em Poppins | **b) Deixar para o Alexandre** | No `MC0011_pptx_fonte_arial_poppins.png`, a Poppins com a fonte instalada quebra "Fluido de freio DOT 4" e deixa o "4" sozinho (slide 8). Sem a fonte, o arquivo muda de máquina para máquina. É mudança de marca, fora da regra conservadora |
| 7 | MC-0012, tamanho do logo | **b) Deixar para o Alexandre** | No `MC0012_cabecalho_logo_30_48_72pt.png`, com 48 pt o logo já encosta no sobretítulo e com 72 pt cobre o título. Isso pede refazer o cabeçalho de 9 páginas e 9 slides, e a saída de marca (o logo sem a assinatura) só o Alexandre fornece |
| 8 | RD-0431, conteúdo em 2 cópias | **a) Um arquivo de conteúdo só** | Não muda nada na tela, se as páginas saírem iguais pixel a pixel, como o `LEIA.md` promete. Peço que essa conferência venha na entrega. A opção c) tiraria um material editável que o time usa, e isso não é tirar repetição |
| 9 | RD-0432, apagar as cópias históricas | **a) Sim** | Não muda nada na tela. Apagar evita corrigir o mesmo texto em 2 lugares, como foi preciso na T-0023 |
| 10 | `portfolio_v1_por_sistema.py` | **a) Sim, com um RD novo** | Não muda nada na tela. O arquivo ainda traz o texto da garantia com o SAC (`portfolio_v1_por_sistema.py:205`), que seria uma 3ª cópia para manter em dia |

## 5. Notas (não seguram)
1. **O espaço branco na pág. 2 do A4.** No antes e no depois, a metade de baixo da página fica vazia, cerca de 1/3 da altura entre os números e o rodapé. Com os cortes, esse espaço cresce uma linha. Isso já existia, e preencher o espaço é mudança de layout, fora da regra desta rodada. Fica como sugestão para uma tarefa futura, com simulação ao Alexandre. Por exemplo, os números podem descer, ou a página pode ganhar uma foto institucional.
2. **A caixa da garantia no .pptx não tem o filete verde à esquerda, e a do PDF tem** (`RD0428_RD0430_Lub_pag02_antes_depois.png`, pág. 2 e slide 2). A diferença já estava no antes e não é repetição. Fica para o `design-de-marca`, se ele achar que vale.
3. **O site.** O topo do site tem o mesmo problema de assinatura do logo do MC-0012, como diz o `LEIA.md`. Se a pergunta 7 for decidida, o `web-site` tem de entrar na mesma decisão.

## Prints conferidos
Todos estão no aloirr/bapajudacatalogo-recados, em `recados/anexos/T-0025/sim/` (commit 5402d30):
- **A4:** `RD0429_A4_pag02_antes_depois.png`, `RD0429_A4_antes_pag02.png` e `RD0429_A4_depois_pag02.png`.
- **Lubrificantes, pág. 2:** `RD0428_RD0430_Lub_pag02_antes_depois.png` e `Lub_PDF_*_p02.png` e `Lub_PPTX_*_p02.png`, antes e depois.
- **Lubrificantes, cabeçalho:** `RD0428_cabecalho_zoom_antes_depois.png`, `RD0428_Lub_PDF_pag03_antes_depois.png` e `Lub_PDF_*_p03.png` e `Lub_PPTX_*_p03.png`, antes e depois.
- **Só mostrar:** `MC0011_pptx_fonte_arial_poppins.png` e `MC0012_cabecalho_logo_30_48_72pt.png`.

**Resultado: LIBERADO.** A simulação pode seguir para a decisão do PO, com as recomendações do §4.
