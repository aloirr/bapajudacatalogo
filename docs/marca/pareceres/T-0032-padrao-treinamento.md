# T-0032 · Parecer de marca do padrão de treinamento (passo 1 i)

| Campo | Valor |
|---|---|
| Tarefa | T-0032, passo 1 (i): padrão de treinamento, que o Alexandre aprova antes de qualquer treinamento ser gerado ("6) a, porem quero aprovar o material de padrão de treinamento antes de começar a gerar e atualiza todos os treinamentos") |
| Revisor | design-de-marca |
| Data | 23/11/2026 10:34 (Manaus) |
| O que foi visto | O branch `catalogo-grafico/T-0032-padrao-treinamento`, head `fb29bbdcfee7611c7a0ee5d4e6e0a65432994a82`: o `treinamentos/PADRAO_TREINAMENTO.md` (S1 a S11), o `gerador/treinamento_ppt.js`, o `gerador/treinamentos/mecanica_basica.json`, o `treinamento_img/logo_bap.png` e os 8 slides de amostra (`slide_01.png` a `slide_08.png`). O texto dos 3 originais de `originais/treinamentos/` |
| Base de comparação | `docs/marca/manual.md` (decisão 10 a, "BAP AUTOPARTS"; decisão 7 a, Arial no .pptx); a decisão do verde (R-20261120-115646-alexandre: o verde oficial é o do logo); o resto ainda "a aprovar" |
| Parecer | **LIBERADO COM AJUSTES** (MC-0018 e MC-0019, baixos, de texto). Nada segura |

Layout, grade, tamanhos e leitura no projetor: ver o parecer de UX (`docs/ux/pareceres/T-0032-padrao-treinamento.md`).
Aqui ficam a cor, o logo, a fonte, a voz e a grafia.

## 1. Cor (S10): recomendo manter `#59BA61`

Medi o verde nos 4 arquivos de logo do repositório (`site/assets/logo_escuro.png`, `site/assets/logo_branco.png`,
`gerador/dimg/logo_grande.png` e `gerador/treinamento_img/logo_bap.png`): a cor dominante é **`#59BA61`** em todos.

- Pela decisão de 20/11, o verde oficial é **o do logo**. O `#59BA61` dos originais **é** o verde do logo. O `#62BB47`
  do site é o que está fora, e a troca dele espera a simulação do manual.
- Recomendo **a) manter `#59BA61`** no padrão, com o **`#2F7D36`** como versão escura (kicker, cabeçalho de tabela,
  texto verde). O `#2F7D36` dá **5,1:1** com o branco e passa nos 4,5:1 que a decisão pede (o `#3E8F2B` do site dá 4,1:1).
  O `#59BA61` com o branco dá 2,4:1: serve para áreas grandes, ícones e números grandes, nunca para texto pequeno.
- Assim, os treinamentos já saem no verde que o site e o PDF vão seguir. Esses dois valores entram no manual "a
  aprovar" como os candidatos para todos os materiais.
- Observação, sem achado: o ícone branco no círculo `#59BA61` (2,4:1) e o número branco no círculo laranja do quiz
  (2,4:1) ficam abaixo de 3:1. Vêm dos originais e têm texto ao lado; não seguram.

O laranja `#F28C28` fica com o papel de alerta (faixa ATENÇÃO); no quiz é herdado dos originais e pode ficar.

## 2. Logo e grafismo

- Capa e seção: o logo inteiro (`logo_escuro`) num quadro branco, sobre o padrão verde: é a versão certa para fundo
  claro. Cabeçalho: logo inteiro, pequeno, sem distorção (0,53 × 0,72" para o arquivo de 575 × 775 px, diferença de 1%).
  Nenhum logo recortado, recolorido ou com sombra.
- O fundo de ícones de peças (`fundo_padrao.jpg`) vem dos originais da BAP e não tem origem cultural: pode ficar.

## 3. Fonte (S1)

**Arial em tudo**, no tema e em cada caixa de texto do gerador. A decisão 7 a foi para o .pptx de Lubrificantes, pelo
mesmo motivo que vale aqui: arquivo editável que abre em qualquer PC. Na aprovação do padrão, ela passa a valer para
todos os treinamentos; o PO deve deixar isso explícito na pergunta.

## 4. Estoque (S2): recomendo tirar

Concordo com a S2. Mesmo só no admin, o número de estoque é foto que envelhece, e o vendedor pode mostrar o slide ao
cliente. "Consulte o estoque antes de ofertar" é a voz certa.

A alçada de 15% e o Price podem ficar (material só do admin), mas recomendo **"uso interno" no rodapé** de todos os
treinamentos ("Treinamento X BAP | Equipe Comercial Externa · uso interno"), como já faz a capa da Linha Moto. Vai como
sugestão nova para o Alexandre; não segura.

## 5. Voz

A voz da amostra está certa para a marca: direta, perto do balcão e da oficina ("Pergunte pelo sintoma e ache o
sistema", "Sintoma abre a conversa; quem confirma é o mecânico"), sem promessa que a peça não cumpre. "Cross-sell" é
termo interno do time e já estava nos originais: pode ficar. Montadora e modelo (Onix) só em texto, sem logo de
terceiros.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0018 | `PADRAO_TREINAMENTO.md`, S6 ("PROACTIVE") e seção 5, Lubrificantes ("PROACTIVE, SHIFTEASE e EFFITECH"); os originais de Lubrificantes têm 57 "PROACTIVE", 16 "SHIFTEASE" e 7 "EFFITECH" | voz (grafia de linha da BAP) | manual a aprovar (nome de linha igual em todos os materiais; ver `T-0029-simulacao.md`, pergunta 2) | baixa | No texto corrido e nas tabelas: "ProActive", "Shiftease" e "Effitech", como no rótulo do frasco e na apresentação de Lubrificantes. Caixa alta só onde todo o texto é caixa alta (kicker). Vale para o guia e para o Lubrificantes atualizado | catalogo-grafico |
| MC-0019 | Amostra, `mecanica_basica.json` | voz | manual a aprovar (o nome do produto é o do Catálogo BAP) | baixa | Ver abaixo | catalogo-grafico |

### MC-0019 · Nome do produto e datas diferentes dos do catálogo

- Slide 6 e quiz: "Kit correia dentada" e "kit de correia dentada KCD2500" → **"Kit de Distribuição"** (o nome do
  produto no Catálogo BAP, `taxo.py:38`).
- Slides 5 e 6: "kit batente", "kit amortecedor" e "kit completo" → **"Kit Batente de Amortecedor"** (`taxo.py:11`;
  KAP e KAC são o mesmo produto, e o código diferencia).
- Slide 6: "exemplo do catálogo BAP" → "exemplo do **Catálogo BAP**" (nome do material, com maiúscula).
- Capa: "Novembro 2026" → "**Novembro de 2026**", como no Portfólio. No exemplo da S11, "base v15" → a versão atual
  da base.

Regra para o gerador e para os 14 treinamentos: o nome do produto e da família sai do Catálogo BAP (S3), e não digitado.

## Reteste

Nos treinamentos gerados depois do "aprovado": o verde escolhido (`#59BA61` e `#2F7D36`, se for a recomendação), Arial
em todos os textos, o logo, sem coluna nem número de estoque, "ProActive", "Shiftease" e "Effitech", os nomes de
produto do catálogo e o rodapé (com "uso interno", se aprovado). Fechar o MC-0018 e o MC-0019.

## Reteste (head `6ab490c328a494fcd037344629195666fa9c7828`)

| Campo | Valor |
|---|---|
| Data | 23/11/2026 (Manaus) |
| O que foi visto | O diff de `fb29bbd` a `6ab490c` (`PADRAO_TREINAMENTO.md`, `mecanica_basica.json`, `treinamento_ppt.js`) e os 8 PNGs novos |
| Parecer | **LIBERADO COM AJUSTES**: MC-0018 e MC-0019 fechados; um achado novo, baixo (MC-0020) |

- **MC-0018, FECHADO:** o guia escreve "ProActive, Shiftease e Effitech" e traz a regra (caixa alta só no kicker).
- **MC-0019, FECHADO:** "Kit de Distribuição", "Kit Batente de Amortecedor KAC11358 · KAP11351", "Bomba D'Água",
  "Cilindro de Roda", "Velas de Ignição" e "Cabo de Vela" saem do PRODUTO da base; "Catálogo BAP" com maiúscula nos
  slides e nas notas; "Novembro de 2026" na capa; a S11 vai para as notas, com a versão da base do dia.
  - Resto, para a geração final, sem achado: os rótulos que ainda são digitados ("Filtro de cabine", "Filtro de ar" e
    "Fluido de freio" no slide 6; "Bomba d'água" e "Cubo de roda" no slide 5) também devem sair do PRODUTO da base, como
    manda a S3. Hoje o slide 6 tem "Bomba D'Água" e o slide 5 tem "Bomba d'água". A grafia do nome na base é o item 23 da
    lista de melhorias do Portfólio.
- **S10 e S12:** registradas como recomendação e sugestão da marca, com a escolha final do Alexandre. Certo.
- **Cor:** o verde-escuro `#2F7D36` virou a cor de todo texto e número verde sobre fundo claro, e o número do quiz ficou
  escuro sobre o laranja (6,0:1). Isso resolve a observação de contraste da primeira rodada.

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0020 | `treinamento_ppt.js:15` (`laranjaEsc: 'A9530A'`) e `PADRAO_TREINAMENTO.md`, seção 3 (a palavra "ATENÇÃO") | cor | regra "nenhuma cor nova nem quase igual sem aprovação" (manual a aprovar) | baixa | `#A9530A` → **`#8A3F00`**, o texto laranja que o PDF já usa (`otext` do dicionário `C` em `digital2.py`). Dá 6,8:1 no fundo `#FDF1E6`, contra 4,8:1 do `#A9530A`. Na mesma linha, as cores do tema `accent5 'D64545'` e `accent6 'F2C14E'` (linha 20) não estão em paleta nenhuma: trocar por cores da paleta ou registrar no guia que não se usam | catalogo-grafico |

O MC-0020 não segura: o padrão pode ir ao Alexandre com a troca feita ou com a nota de que ela entra antes de gerar.

## Reteste do MC-0020 (head `0371d28e86ede0291ad834eeeb2f45efde450ef1`)

**LIBERADO. MC-0020 FECHADO.**

- "ATENÇÃO" em `#8A3F00` (o `otext` do `digital2.py`), no `slide_05.png` novo e no `treinamento_ppt.js:15`.
- No tema, o `accent5` passou a `#D9E6DA` (a borda) e o `accent6` a `#8A3F00`. O vermelho e o amarelo saíram. Agora o
  tema só tem cores do padrão.
- No slide 5, a coluna "Na BAP" sai do PRODUTO da base ("Bomba D'Água, Eletroventiladores", "Pastilha de Freio, Sapata
  de Freio"...), e a coluna "Verificar" usa as palavras do balcão ("Bomba, ventoinha do radiador e aditivo"). A
  grafia "D'Água" é a da base, e a troca dela é o item 23 da lista de melhorias.
