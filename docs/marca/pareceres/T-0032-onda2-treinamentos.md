# T-0032 · Parecer de marca da onda 2 dos treinamentos (5 de sistema)

| Campo | Valor |
|---|---|
| Tarefa | T-0032, onda 2: Suspensão, Direção, Transmissão, Freio e Arrefecimento, com 40 slides cada, no padrão aprovado (R-20261123-162032-po, 1 a) |
| Revisor | design-de-marca |
| Data | 23/11/2026 (Manaus) |
| O que foi visto | O branch `catalogo-grafico/T-0032-padrao-treinamento`, head `b209f82940a48c28c9c8e2b20f90703d8eefe25e`, na pasta `onda2-treinamentos`. Nos 5 .pptx: o tema, as fontes, as cores e onde o vermelho é usado. Uma folha de contato com as 58 imagens que não são ícone. O texto dos 5 PDFs, os combos (slide 35 de cada) e o `mosaico_8_slides.png` do Freio. Os nomes de produto conferidos na aba PRODUTOS da base |
| Base de comparação | O guia do padrão e os pareceres `T-0032-mecanica-basica.md` e `T-0032-onda1-treinamentos.md` (o vermelho "a aprovar" só no ícone, na faixa que reprova e na escala de leitura; o 2 a da embreagem) |
| Parecer | **Suspensão e Direção: LIBERADO. Transmissão, Freio e Arrefecimento: LIBERADO COM AJUSTES** (MC-0028, baixo, de texto). Nada segura a ida ao Alexandre |

Layout e leitura: ver o parecer de UX.

## O que está certo nos 5

- **Tema:** igual ao aprovado: `#59BA61`, `#2F7D36`, `#F28C28`, `#1E2B22`, `#6B7570`, `accent5 #D9E6DA` e
  `accent6 #8A3F00`. O texto laranja sai em `#8A3F00`.
- **Vermelho `#D64545`:** só em ícone de sinal grave, 2 ou 3 por deck, e nunca em texto. Está dentro do uso "a aprovar".
- **Fonte:** Arial em tudo (324 a 432 trechos por deck). Nenhum "Calibri".
- **Logo:** certo na capa, no Obrigado e no cabeçalho.
- **Rodapé e capa:** "uso interno" nos 31 slides de conteúdo de cada deck, e "Novembro de 2026" na capa.
- **Voz:** de balcão e no tom do Mecânica Básica ("Pastilha: o teste do balcão", "Para o cliente: o freio de mão volta
  a segurar", "Sangria", perguntas-gatilho entre aspas). Ela não promete diagnóstico. "Catálogo BAP" sai com
  maiúscula.
- **Sem preço com valor e sem estoque.** A alçada e o Price ficam, como nos originais.
- **Remissões a Lubrificantes:** certas e curtas.
  - Freio: "Fluido de freio: ver o treinamento de Lubrificantes".
  - Arrefecimento: "Fluido e aditivo do radiador: ver o treinamento de Lubrificantes".
  - Direção e Transmissão também remetem, pelo fluido da direção e pelo óleo de câmbio.
  - Na Direção, "o Shiftease ATF Dexron III… Detalhes no treinamento de Lubrificantes" escreve "Shiftease" certo.
- **Imagens:** as fotos são de peça BAP, com caixa BAP. Os desenhos são próprios e não têm marca. As capas do catálogo
  são as mesmas dos PDFs (caixa de direção, bandeja, pastilha, cuíca, catraca, rolamentos e a embreagem do 2 a).
  - A cuíca e a catraca têm gravação em relevo no corpo, ilegível no tamanho do slide. O servo de embreagem tem uma
    etiqueta de aviso em inglês ("DANGER! WARNING!"), sem logo.
  - Pelo mesmo critério do 2 a (gravação da própria peça, ilegível, em material interno), podem ficar. O PO informa o
    Alexandre junto com o resto da onda.
  - Nenhum logo de montadora ou de concorrente.

## MC-0028 · Nomes de produto nos combos (dono: `catalogo-grafico`)

| ID | Onde | Tipo | Fere | Gravidade | Dono |
|---|---|---|---|---|---|
| MC-0028 | Slide 35 (combos) de Transmissão, Freio e Arrefecimento | voz (nome de produto) | regra do guia: o nome do produto vem do PRODUTO da base (MC-0019/MC-0022) | baixa | catalogo-grafico |

Os combos usam o nome da base, menos estes (antes → depois):

| Deck | Antes | Depois |
|---|---|---|
| Transmissão, Combo 3 | "Embreagem Remanufaturada + servo" | **"Embreagem Remanufaturada + Servo e Cilindro de Embreagem"** (PRODUTO do SCE14012) |
| Freio, Combo 2 | "Sapata de Freio + Cilindro de Roda + fluido" | **"… + Fluido de Freio"** |
| Freio, Combo 3 | "Cilindro de Roda + fluido DOT" | **"Cilindro de Roda + Fluido de Freio"** |
| Arrefecimento, Combo 3 | "Fluido concentrado + água desmineralizada" | **"Fluido de Radiador + Água Desmineralizada"** |

O PRODUTO do FLU15001, do RAD25000P e do RAD25009P é genérico na base ("Fluidos e Químicos"). Por isso o nome vem da
família, como já está no Mecânica Básica ("Fluido de Freio") e no Portfólio ("Água Desmineralizada").

No texto corrido, a peça escrita em minúsculas como componente ("a caixa de direção vaza", "o kit reparo") está certa,
e fica.

## Para a fila (sem achado)

- "Semi-Eixo Homocinético" (Transmissão, Combo 2) é o nome que está na base. Ele muda junto com o item 23 da lista de
  melhorias ("Semieixo"), no `catalogo-dados`.
- "pastilhas ATIVAS na base" e "sensores ABS ATIVOS" (o quadro escuro): o termo da base em caixa alta. Num material
  interno, pode ficar. Se o Alexandre quiser o tom de balcão também aí, fica "pastilhas ativas no catálogo".

## Reteste

Na próxima rodada: o slide 35 de Transmissão, Freio e Arrefecimento. Fechar o MC-0028.
