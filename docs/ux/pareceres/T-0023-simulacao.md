# T-0023 · Parecer de UX da simulação da grafia "BAP AUTOPARTS"

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 03:12 (Manaus) |
| O que foi revisto | Simulação do catalogo-grafico (pasta `t0023-sim/` no rascunho da sessão do gerente, branch `catalogo-grafico/T-0023-grafia`): `LEIA.md`, `comparacao.txt` e os 8 pares em `png/` (a, b, c1 a c6) |
| Pedido | T-0023 (R-20261122-032433-alexandre, resposta 10 a; ampliação R-20261122-063647-po) |
| Base da grafia | `docs/marca/manual.md:10-14`: "BAP AUTOPARTS", tudo em maiúsculas, sem espaço; "BAP Autoparts" está na lista do errado |
| Resultado | **LIBERADO** para ir ao Alexandre, sem 🔴 e sem 🟡 que segure |

Sem preço e sem estoque: 🟢 (nenhum valor nem quantidade nas páginas; "preço acessível" e "preço competitivo" são texto institucional que já estava lá).

Já sabido e fora da revisão (igual no antes e no depois): os quadros cinza no lugar das fotos (c1) e as cores do tema padrão do LibreOffice no .pptx (c4 a c6).

## 1. Legibilidade
- 🟢 (a) Barra do topo do A4: "BAP AUTOPARTS" no mesmo cinza claro sobre o preto, mesmo corpo e mesmo espaçamento entre letras; o contraste não muda. Sem o espaço, a palavra fica inteira e se lê melhor que "AUTO PARTS" espaçado, que parecia três palavras.
- 🟢 (a, b) Sobretítulo verde "BAP AUTOPARTS" sobre o verde claro: mesma cor e mesmo corpo de antes.
- 🟢 (c2, c5) Cabeçalho "BAP AUTOPARTS" ao lado do símbolo: igual ao antes, só 3,4 pt (PDF) e 4,6 pt (.pptx) mais curto.
- 🟢 (c3, c6) "Gerente Comercial · BAP AUTOPARTS": mesmo corpo e mesma cor; as maiúsculas são um pouco mais altas, mas a linha continua abaixo do nome em negrito e não briga com ele.

## 2. Alinhamento
- 🟢 (a) A barra continua alinhada à direita: o texto termina em x = 575,7 pt no antes e no depois (`comparacao.txt`); só o começo anda 3 pt para a direita. No par a 300 ppi, a última letra fica na mesma vertical nos dois.
- 🟢 (b, c2, c3, c5, c6) Tudo o que é alinhado à esquerda começa no mesmo x de antes (46,0; 72,0; 38,0; 84,0 pt).

## 3. Quebra de linha e bordas
- 🟢 (b) "Quem somos" do A4: a 1ª linha fica 5,3 pt mais larga e termina em 545,9 pt, dentro da coluna (os cartões terminam por volta de 560 pt); o parágrafo continua com 3 linhas e as mesmas quebras ("…automotivos de" / "…suspensão à" / "parte elétrica.").
- 🟢 (c2, c5) Título "A BAP AUTOPARTS" (30 pt): 20,8 pt (PDF) e 32,2 pt (.pptx) mais largo, termina em 307,6 e 320,5 pt, numa linha só e longe da borda (o texto corrido abaixo vai até mais que o dobro disso). Não encosta no cabeçalho nem no parágrafo: o espaço acima e abaixo é o mesmo.
- 🟢 (c3, c6) "Gerente Comercial · BAP AUTOPARTS" termina em 273,4 pt (PDF) e 293,4 pt (.pptx); o cartão vai até cerca de metade da largura do slide: sobra bem mais que a largura da linha toda até a borda do cartão.
- 🟢 Mesmo número de linhas em todas as páginas (29, 19, 10, 18, 10) e nenhuma sobreposição.

## 4. Ritmo do texto corrido
- 🟢 (b) "A BAP AUTOPARTS é uma empresa brasileira…": uma palavra só em maiúsculas, uma vez, no começo do parágrafo, logo depois do título "QUEM SOMOS". No corpo de ~9 pt ela pesa um pouco mais que o resto, mas funciona como a marca escrita, não como grito, e não se repete no parágrafo. O manual da marca não abre exceção para o texto corrido e a decisão 10 a vale para todas as formas.
- 🟢 (c2, c5) "A BAP AUTOPARTS" vira título todo em maiúsculas. Continua sendo o maior texto da página e a hierarquia não muda (sobretítulo "QUEM SOMOS" pequeno e espaçado acima, texto corrido abaixo).
- Nota (não segura): a regra "sem caixa alta feia em nome e texto" desta revisão não vale para a grafia da marca, porque a grafia é decisão do Alexandre (10 a) e está no manual. O que vale daqui para a frente: o nome em maiúsculas uma vez por parágrafo, sem repetir "BAP AUTOPARTS" em frases seguidas (no texto, "a BAP" basta depois da primeira vez, como já está em "Por que vender BAP" e "SAC BAP").

## 5. Consistência
- 🟢 Mesma grafia nas três peças (A4, Lubrificantes PDF e .pptx) e no Author dos metadados; o domínio `bapautoparts.com.br` e o `@bapautoparts` ficam como estão (endereço, não grafia).
- 🟢 Capas (c1, c4): nenhum pixel muda; a capa não tem o nome escrito.

## 6. Fora do escopo da T-0023 (só registro, não segura)
Já estavam lá antes e a tarefa pede "páginas iguais às de antes, fora a grafia"; se o Alexandre quiser, vira outra tarefa:
- A4 pág. 2: "Garantia Expressa BAP" e "Prazos de garantia conforme o certificado…" repetem a mesma informação na página (texto e nota de rodapé).
- Lubrificantes pág. 2: o cartão "SAC · garantia direto com a fábrica" e a caixa "Garantia Expressa BAP" logo abaixo dizem o mesmo.

## Prints conferidos
`png/a_A4_barra_do_topo_par.png`, `png/b_A4_pag02_institucional_par.png`, `png/c1_Lubrificantes_PDF_capa_par.png`, `png/c2_Lubrificantes_PDF_quem_somos_par.png`, `png/c3_Lubrificantes_PDF_gerente_comercial_par.png`, `png/c4_Lubrificantes_PPTX_capa_par.png`, `png/c5_Lubrificantes_PPTX_quem_somos_par.png`, `png/c6_Lubrificantes_PPTX_gerente_comercial_par.png`.
