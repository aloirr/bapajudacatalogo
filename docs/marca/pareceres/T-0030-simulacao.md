# T-0030 · Parecer de marca da simulação (rótulos da ficha da bateria)

| Campo | Valor |
|---|---|
| Tarefa | T-0030, passo 1: simulação. Item 2 a do R-20261123-135656-po ("Ah" e "CCA" na ficha da bateria, MC-0016) |
| Revisor | design-de-marca |
| Data | 23/11/2026 10:08 (Manaus) |
| O que foi visto | O branch `web-site/T-0030-rotulos-bateria`, head `3da35c1e8ed67bb5f1d80b203c3101cc9d4b851f` (diff de `site/app.js` e `docs/DADOS_DO_SITE.md`); o `LEIA-ME.md` e os 8 prints (60D-EFB-24 e 72D-EFB-24, antes e depois, 1366 e 390 px) |
| Base de comparação | O MC-0016 (`docs/marca/pareceres/T-0006-fase1-simulacao.md`); o manual ainda "a aprovar" no tom de voz |
| Parecer | Simulação: **LIBERADO** para o PO levar ao Alexandre. Nenhum ajuste |

Layout e leitura da ficha: ver o parecer de UX (`docs/ux/pareceres/T-0030-simulacao.md`). Aqui fica a voz.

## 1. O que muda

- "C20(ah)" → **"Ah"** e "Cca-18°" → **"CCA"**, na página do produto, na janela "+ Detalhes" e na ficha impressa, nas
  2 larguras. É o texto do filtro ("Amperagem" em Ah e "Partida a frio (CCA)"): o cliente lê a mesma sigla no filtro e
  na ficha, que era o que o MC-0016 pedia. A grafia das siglas está certa ("Ah", com o h minúsculo; "CCA" em
  maiúsculas).
- Só o rótulo da tela muda (`ROTULO_FICHA`, pela chave sem sinais): os valores, a `FICHA`, a `TRAVA` e o JSON ficam
  iguais. Os filtros continuam achando a medida, que era o cuidado que eu tinha pedido ao dono.
- Mesma fonte, cor e peso dos outros rótulos da ficha. Nenhuma cor ou fonte nova.

## 2. O que continua (não segura)

- **"Amperagem 60" ao lado de "Ah 60":** são 2 campos da base com o mesmo número. A repetição é do
  `corretor-redundancias`; não catalogo.
- **"Ca +25c"**, logo abaixo de "CCA", e o valor "12v" da tensão: ficaram fora do item 2 a. Com o "CCA" certo ao lado,
  o "Ca +25c" destoa mais. Para a fila (MC-0016, resto): "Ca +25c" → "CA (+25 °C)" e "12v" → "12 V" (o valor é dado da
  base, do `catalogo-dados`). Vai ao Alexandre só se ele quiser, numa próxima rodada.

## Achados

| ID | Situação |
|---|---|
| MC-0016 | "Ah" e "CCA" corrigidos nesta simulação; fecha na entrega final igual a ela. Ficam na fila, sem gravidade nova: "Ca +25c" e "12v" |

Nenhum achado novo.

## Reteste

Depois do "aprovado": no PR, conferir a ficha da 60D-EFB-24 e da 72D-EFB-24 em 1366 e 390 px (página, "+ Detalhes" e
ficha impressa), os filtros "Amperagem" e "Partida a frio (CCA)" e a busca "60ah". Fechar o MC-0016 nos 2 rótulos.
