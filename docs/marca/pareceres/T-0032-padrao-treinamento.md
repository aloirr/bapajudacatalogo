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
