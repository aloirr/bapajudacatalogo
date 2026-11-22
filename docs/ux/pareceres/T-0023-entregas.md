# T-0023 · Parecer de UX das entregas finais (grafia "BAP AUTOPARTS", logo escuro e fotos do `pptimg/`)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 04:03 (Manaus) |
| O que foi revisto | PR #128, branch `catalogo-grafico/T-0023-grafia`, head `1380e9fc8faaf0a7ed7d376fcf9f5482a15f1e9c`: as 6 entregas em `catalogo_grafico/entregas/` (A4, Digital, Linha Moto, Kit Filtros, PDF e .pptx de Lubrificantes), comparadas com as de antes, e os 3 pares PNG do gerente |
| Novidades desde a simulação | logo escuro no cabeçalho das págs. 2 a 10 do PDF de Lubrificantes (MC-0010); fotos do PDF de Lubrificantes lidas de `pptimg/<código>.png` |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢 (nada novo; "preço acessível" e "preço competitivo" são o texto institucional que já estava lá).

## Como foi conferido
- Comparação pixel a pixel (60 ppi em todas as páginas; 110 ppi em Lubrificantes) e do texto extraído, página por página, antes × depois. O .pptx foi convertido em PDF no LibreOffice, antes e depois, e comparado do mesmo jeito.
- Cabeçalho da pág. 7 de Lubrificantes a 300 ppi, antes e depois.

## 1. Cabeçalho com o logo escuro (Lubrificantes PDF, págs. 2 a 10)
- 🟢 Legibilidade: antes, o "bap" do logo saía branco sobre o fundo branco e só o símbolo verde aparecia. Agora o logo escuro se lê inteiro; contraste do preto (#141514) sobre o branco 18,3:1. O "BAP AUTOPARTS" ao lado segue no verde escuro (#1f7a32), 5,4:1.
- 🟢 Alinhamento: o logo começa em x = 40 pt, a mesma vertical do sobretítulo e do título; ocupa de 26 a 56 pt de altura. "BAP AUTOPARTS" fica com o centro das maiúsculas a cerca de 2 pt do centro do logo, a ~10 pt do logo. É a mesma composição do slide-mestre do .pptx (`apres_ppt.js`, logo 24 × 33 pt em 40/22), agora igual nas duas peças.
- 🟢 Respiro: entre o pé do logo e o sobretítulo ficam ~11 pt; nada encosta.
- 🟢 A mudança fica só no retângulo do cabeçalho (págs. 3 a 10); nenhum outro pixel da página muda.
- Nota (não segura, é do `design-de-marca`): a linha "componentes de qualidade" do logo sai com ~2,5 pt de altura e não se lê no tamanho do cabeçalho. Já é assim no .pptx aprovado; funciona como parte do desenho do logo.

## 2. Quebra de linha e bordas
- 🟢 A4: só a pág. 2 muda (sobretítulo e "Quem somos"), com as mesmas 3 linhas e as mesmas quebras da simulação.
- 🟢 Digital (311 págs.), Linha Moto (17) e Kit Filtros (18): nenhum pixel muda; só o Author dos metadados ("BAP AUTOPARTS").
- 🟢 Lubrificantes PDF e .pptx: além do cabeçalho, só a pág. 2 (título "A BAP AUTOPARTS", numa linha) e a pág. 11 ("Gerente Comercial · BAP AUTOPARTS", dentro do cartão), iguais à simulação.
- 🟢 Mesmo número de páginas em todas as peças; nenhuma quebra nova, nada encostando na borda.

## 3. Pág. 7 de Lubrificantes (fotos do `pptimg/`)
- 🟢 As 5 fotos (RAD25005P, RAD25001P, RAD25000P, RAD25002P, RAD25009P) saem iguais às de antes: o corpo da página não tem nenhum pixel diferente. Mesmo tamanho, centradas no cartão, com o mesmo respiro até a borda e até o código.
- 🟢 O mesmo vale para as fotos das págs. 4, 5 e 8.

## 4. Consistência
- 🟢 O PDF de Lubrificantes agora tem o mesmo cabeçalho do .pptx (logo escuro + "BAP AUTOPARTS").
- 🟢 O .pptx fica igual ao de antes, fora a grafia: as cores dos slides não mudam com o tema "BAP" gravado pelo `apply_theme.js`.

## Prints conferidos
- Do gerente: `t0023-entregas-png/1_A4_pag02_par.png`, `2_Lubrificantes_PDF_pag07_par.png` e `3_Lubrificantes_PPTX_slide02_LibreOffice_par.png`.
- Do designer-ux: todas as páginas de Lubrificantes (PDF a 110 ppi, pág. 7 a 300 ppi), os slides do .pptx no LibreOffice e as comparações pixel a pixel das 6 entregas.
