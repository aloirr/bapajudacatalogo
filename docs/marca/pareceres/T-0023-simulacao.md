# T-0023 · Parecer de marca da simulação da grafia "BAP AUTOPARTS"

| Campo | Valor |
|---|---|
| Tarefa | T-0023 (grafia "BAP AUTOPARTS" no gerador do catálogo gráfico), simulação antes × depois |
| Revisor | design-de-marca |
| Data | 22/11/2026 03:11 (Manaus) |
| O que foi visto | Branch `catalogo-grafico/T-0023-grafia`, commit `7c7c4db` (7 arquivos, 19 linhas trocadas); a simulação do dono (LEIA, comparação de texto e pixels, diff e os pares a, b, c1 a c6); as entregas atuais em `catalogo_grafico/entregas/` |
| Base de comparação | `docs/marca/manual.md`, "Nome da marca" (decisão 10 a, R-20261122-032433-alexandre) |
| Parecer | **LIBERADO**. Um achado de logo, anterior à tarefa e fora do escopo dela (MC-0010), vai em separado |

## Grafia, lugar por lugar

| Lugar | Antes | Depois | Confere com o manual |
|---|---|---|---|
| A4 pág. 2, barra do topo (`print_cat.py:480`) | BAP AUTO PARTS | BAP AUTOPARTS | sim |
| A4 pág. 2, sobretítulo verde (`print_cat.py:481`) | BAP AUTO PARTS | BAP AUTOPARTS | sim |
| A4 pág. 2, texto corrido "Quem somos" (`print_cat.py:483`) | A BAP Auto Parts é… | A BAP AUTOPARTS é… | sim: o manual não abre exceção para o texto corrido e lista "BAP Autoparts" como errado |
| Lubrificantes PDF, cabeçalho das págs. 2 a 10 (`apres_bemol.py:68`) | BAP AUTO PARTS | BAP AUTOPARTS | sim |
| Lubrificantes PDF, título 30 pt (`apres_bemol.py:119`) | A BAP Auto Parts | A BAP AUTOPARTS | sim |
| Lubrificantes PDF, cartão do contato (`apres_bemol.py:257`) | Gerente Comercial · BAP Auto Parts | Gerente Comercial · BAP AUTOPARTS | sim |
| Lubrificantes .pptx, mestre, slide 2 e slide 11 (`apres_ppt.js:20`, `:66`, `:208`) | idem | idem | sim |
| Autor nos metadados (8 scripts) | BAP Auto Parts | BAP AUTOPARTS | sim (o Portfólio e a lista de aplicações já estavam certos) |
| Domínio e rede social | www.bapautoparts.com.br · @bapautoparts | sem mudança | correto: é endereço, não é a grafia da marca |

Grafia antiga que sobrou no gerador do branch: **nenhuma** (`git grep -niE "auto[ _-]?parts"` em
`catalogo_grafico/gerador/` só acha "BAP AUTOPARTS", o domínio e o @).

## A largura mexe na marca?

Não.
- **Barra do topo do A4:** fica 3 pt mais curta, alinhada à direita, com o mesmo corpo, peso, espaçamento entre letras e
  cor. O logo, a divisória e o "CATÁLOGO DE PRODUTOS 2027" não se movem.
- **Sobretítulo verde:** 2,8 pt mais curto, no mesmo verde escuro e com o mesmo espaçamento.
- **Título de 30 pt de Lubrificantes:** "A BAP AUTOPARTS" fica 20,8 pt mais largo no PDF e 32,2 pt no .pptx. Continua numa
  linha só, em Poppins Bold, longe da margem, e não encosta em nada. As maiúsculas dão mais peso ao nome que ao "A"; é o
  efeito esperado da grafia aprovada e não muda a hierarquia da página (o sobretítulo "QUEM SOMOS" continua acima, o
  título continua o maior texto).
- **Texto corrido e cartão do contato:** as linhas não quebram de outro jeito e nada sai da coluna ou do cartão.
- Logo, cores e fontes: iguais no antes e no depois. A capa (c1, c4) não muda nenhum pixel.

## O que a simulação não mostra (não é da tarefa)

- Os quadros cinza no PDF de Lubrificantes (fotos que não estão na nuvem) e as cores e a fonte do .pptx (sem o
  `apply_theme.js` e sem a Poppins no LibreOffice) são iguais no antes e no depois.
- As entregas em `catalogo_grafico/entregas/` ainda têm a grafia antiga (A4: 2 no texto e o autor; Lubrificantes PDF:
  2 no texto e o autor; .pptx: o mestre, 2 no texto e o autor; Digital, Linha Moto e Kit Filtros: o autor). É o esperado:
  elas só são geradas de novo depois do "aprovado".

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0010 | Lubrificantes PDF, cabeçalho das págs. 2 a 10 (`apres_bemol.py:67`, `self.img(LOGO, …)` com `LOGO = 'dimg/capa_0.png'`, linha 19) | logo | manual a aprovar (logo certo para cada fundo; checklist B) | alta, mas **anterior à T-0023** (igual no antes e no depois e na entrega atual) | O `capa_0.png` é o logo branco: no fundo branco do cabeçalho só aparece o círculo verde, e o "bap" e a assinatura somem. Trocar, só no `header()`, para o logo escuro (o mesmo `logo_escuro.png` que o .pptx já usa no mestre, `apres_ppt.js:19`). Os usos em fundo escuro (`apres_bemol.py:105` e `:251`, capa e "Obrigado!") ficam com o branco | catalogo-grafico |

O MC-0010 **não segura** a T-0023: a regra da tarefa é "páginas iguais às de antes, fora a grafia". Sugestão ao
gerente: tarefa própria, com simulação ao Alexandre, ou entrar na mesma geração das entregas depois do "aprovado", se o PO
quiser juntar.

**Reteste (22/11/2026 04:05, Manaus):** MC-0010 fechado nas entregas do head `1380e9f`; ver `T-0023-entregas.md`.
