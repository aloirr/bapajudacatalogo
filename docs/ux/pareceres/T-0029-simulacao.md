# T-0029 · Parecer de UX da simulação (Portfólio 2027 e siglas de montadora)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 10:07 (Manaus) |
| O que foi revisto | Os 52 PNGs (26 páginas, antes × depois) e o `LEIA-ME.md` da simulação do `catalogo-grafico`; o diff do branch `catalogo-grafico/T-0029-portfolio-2027`, head `61ac7ed2b769ab4230a10e81ca21080d6a3a4bb4`, sobre o main `9f37e19` |
| Pedido | R-20261123-135656-po, itens 1a (datas do Portfólio para 2027) e 3a (siglas "VW", "GM" e "Effitech") |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢.

A voz, o texto e a grafia ficam com o `design-de-marca` (ver o parecer de marca da T-0029): "Novembro de 2026" na capa de 2027, a nova frase da pág. 3, "VW", "GM" e "Effitech". Aqui só falo de layout e da comparação página a página.

## 1. Onde muda: só o que foi pedido
Medi a caixa da diferença de cada par de PNGs (150 ppi):

- 🟢 **Selo NOVIDADE 2027 (19 páginas):** a diferença fica, nas 19, na mesma caixa de 27 × 35 px, os 2 últimos dígitos do selo. O selo não cresce nem encosta na foto.
- 🟢 **Capa (pág. 1) e contracapa (pág. 88):** muda só o "2027" do sobretítulo e, na capa, o mês. "Novembro de 2026" é mais longo que "Outubro de 2026" e fica na mesma linha, longe do título e da borda.
- 🟢 **Pág. 3:** "conforme o Catálogo BAP 2027" fica alinhado à direita, na mesma linha. A frase do rodapé sai sem os espaços duplos da seta que faltava ("sistema do veículo, família e produto.") e cabe em 1 linha; os cartões não mudam. Resolve a nota 1 do §5 do parecer da T-0028.
- 🟢 **Siglas (págs. 21, 34, 42 e 67) e Effitech (pág. 81):** muda só a palavra, no lugar. Nas 3 primeiras, nada se move além do fim da linha.
- 🟢 **O diff toca só o `portfolio.py`** (e o `LEIA_GERADOR.md`): bate com a prova do `LEIA-ME.md` de que A4, Completo Digital e Linha Moto saem iguais ao main.

## 2. O efeito da pág. 67: 🟢, aceitável
"GM" é mais largo que "Gm", e a lista de modelos de "Ford/GM/Dodge/Troller" perde 1 caractere: antes "Ford F-1000, F" (cortado sem aviso), agora "Ford F-1000, F…". O leitor perde o mesmo modelo que já não lia, e agora o "…" avisa o corte. Não peço outro ajuste.

## 3. Notas (não seguram; já existiam no main)
1. **Modelo cortado sem "…"** na lista das aplicações: "Fiat Uno, Palio, Sie" (pág. 34) e "VW Fus" (pág. 42). É o corte do `heroi()` quando a linha não tem "/" nem ",": para a fila do `catalogo-grafico`.
2. **A mesma montadora escrita de 2 jeitos na mesma página** (pág. 42): "VW/Ford" e "Volkswagen / Chevrolet / Ford"; e "GM/GM" (pág. 42) e "Ford/GM/… Ford F-1000" (pág. 67) repetem a montadora. Vem da APLICACAO da base: para o `catalogo-dados`; a grafia, com o parecer de marca.

**Resultado: LIBERADO** para seguir ao Alexandre (pelo `po`).
