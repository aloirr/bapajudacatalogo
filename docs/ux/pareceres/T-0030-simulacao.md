# T-0030 · Parecer de UX da simulação (rótulos da ficha da bateria)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 10:07 (Manaus) |
| O que foi revisto | Os 8 prints (60D-EFB-24 e 72D-EFB-24, 1366 e 390 px, antes × depois) e o `LEIA-ME.md` da simulação do `web-site`; o diff do branch `web-site/T-0030-rotulos-bateria`, head `3da35c1e8ed67bb5f1d80b203c3101cc9d4b851f` (`site/app.js`, mapa `ROTULO_FICHA`); o `site/data/produtos.json` do main |
| Pedido | R-20261123-135656-po, item 2a (rótulos "Ah" e "CCA") |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢. A grafia dos rótulos fica com o `design-de-marca` (ver o parecer de marca da T-0030).

## 1. A ficha
- 🟢 **Muda só o rótulo.** A diferença dos prints fica na coluna dos rótulos, nas linhas "C20(ah)" → "Ah" e "Cca-18°" → "CCA". Valores, ordem das linhas e largura da tabela não mudam (no print de 1366 da 72D, a foto difere em 1 nível de cor, ruído da imagem, invisível).
- 🟢 **Em 390 px** os rótulos novos são mais curtos, nenhuma linha quebra a mais e nada rola para o lado.
- 🟢 **Consistência:** a ficha passa a usar o mesmo termo do filtro ("Partida a frio (CCA)") e do detalhe do produto ("(60Ah)"). Quem filtra por Ah ou CCA acha o mesmo nome na ficha.
- 🟢 **Uma troca num lugar só:** o mapa vale para a página do produto, a janela "+ Detalhes" e o "Salvar em PDF", sem mexer no JSON.

## 2. Notas (não seguram; já existiam no main)
1. **"Amperagem" e "Ah" mostram o mesmo número na mesma ficha** (uma informação em 2 lugares). Com o rótulo novo isso fica mais visível. Em 44 das 46 baterias com os 2 campos, o valor é igual; em 2, diverge: **75AE-LP-18** (Amperagem 40, Ah 75) e **40D-MXWF-15** (Amperagem 45, Ah 40). O cliente vê 2 números diferentes para a mesma coisa. Pedido para a fila: os 2 valores ao `catalogo-dados`; tirar "Amperagem" da ficha quando for igual ao "Ah" é pergunta ao Alexandre, com simulação própria.
2. **Formato que varia na ficha:** "Peso líquido 19,5" e "Peso bruto 19.59" (vírgula × ponto); "Dimensões 275x175x189" e "238X175X189"; "Garantia 24" sem unidade; "Ca +25c" (fica como está, pelo pedido). Vem da base: para o `catalogo-dados`; a grafia, com o parecer de marca.

**Resultado: LIBERADO** para seguir ao Alexandre (pelo `po`).
