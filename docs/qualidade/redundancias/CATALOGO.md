# Catálogo de redundâncias (RD-nnnn)

Situação: `ABERTO`, `EM CORREÇÃO`, `CORRIGIDO` ou `MANTIDO`. Os relatórios de cada PR ficam em `T-nnnn.md`, a varredura do site no ar em `VARREDURA-aaaa-mm-dd.md` e as regras em `GUIA.md`, nesta pasta.

O próximo número livre é o **RD-0448**.

[SUPOSIÇÃO] As rodadas até o RD-0119 não deixaram catálogo no repositório. Esta tabela começa no RD-0120 e cresce a partir daqui.

Do RD-0134 ao RD-0145, os achados são do parecer do PR #34 (T-0016, governança), registrado no R-20261120-160330-po, sem relatório no Git. As linhas abaixo resumem cada um.

| ID | Sev. | Tipo | Onde | Resumo | Tarefa | Dono | Situação |
|---|---|---|---|---|---|---|---|
| RD-0120 | — | código | site/styles.css | `.mf-foto` em 2 regras | T-0018 | web-site | CORRIGIDO (6d174e4) |
| RD-0121 | — | código | site/styles.css | CSS morto da home antiga no `.cartao-busca` | T-0018 | web-site | CORRIGIDO (6d174e4) |
| RD-0122 | — | código | site/styles.css | fundo da faixa e da Sobre repetido (vira `--fundo-faixa`) | T-0018 | web-site | CORRIGIDO (6d174e4); sobra no RD-0130 |
| RD-0123 | — | código | site/styles.css | `h1 em` e selos repetidos | T-0018 | web-site | CORRIGIDO (6d174e4) |
| RD-0124 | — | código | site/styles.css | `@media 640` repetida para o rodapé | T-0018 | web-site | CORRIGIDO (6d174e4); recaída no RD-0127 |
| RD-0125 | — | código | site/app.js | submit da placa repetido nas 2 telas (vira `submitPlaca`) | T-0018 | web-site | CORRIGIDO (6d174e4) |
| RD-0126 | média | código | site/styles.css:312-313 | hover do Voltar ao topo repete o `--verde`; transição no background-color morta | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0127 | média | código | site/styles.css:41-42, 198 | `84px` do cabeçalho em 2 lugares sem token; `@media 640` de uma linha | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0128 | média | código | site/app.js:1572; site/styles.css:43 | regra do reduce do Voltar ao topo no JS e no CSS | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0129 | baixa | código | site/styles.css:117 | `.off em` repete a `--texto-2` do `em` | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0130 | baixa | código | site/styles.css:463, 473-476 | reserva `background: var(--escuro)` morta com o `var(--fundo-faixa)` | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0131 | baixa | texto | site/app.js:1420, 1456, 1472, 1544 | título da aba em 4 cópias sem constante | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0132 | baixa | código (comentário) | site/app.js:924-935 | comentário com a ordem e a contagem 2 vezes (não segura) | T-0018 | web-site | CORRIGIDO (b189091) |
| RD-0133 | baixa | código | site/app.js:45 | `MINUSC` sem uso, pré-existente, fora do diff (não segura) | — | web-site | ABERTO |
| RD-0134 | — | doc | .coord/README.md:40 e os 3 agentes | o Caminho em 5 lugares | T-0016 | alexandre | CORRIGIDO (d20359f, #48; dae45f5, #34) |
| RD-0135 | — | código | ponte (PR #34) | PONTE duplicada | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0136 | — | código | PR #34 | o domínio do autor em 3 formas | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0137 | — | código | PR #34 | o `motivoIdentidade` duplicado | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0138 | — | código | PR #34 | o `SHA_COMPLETO` | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0139 | — | código | PR #34 | o bloco `conferirMerge` e `conferirMergeMcp` | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0140 | — | código | PR #34 | a linha inalcançável | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0141 | — | código | PR #34 | "de: alexandre" e "de: po" à mão | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0142 | — | código (comentário) | PR #34 | os comentários do guarda-bash e do mcp | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0143 | — | código (comentário) | PR #34 | a ponte em 4 comentários | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0144 | — | código (comentário) | PR #34 | o comentário do guarda-bash-lib | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0145 | — | teste | PR #34 | o env repetido nos testes | T-0016 | alexandre | CORRIGIDO (dae45f5) |
| RD-0146 | média | texto (R3) | site/app.js, início (1366 e 390 px), no ar desde o #46 | subtítulo "Toque em um sistema para ver todos os produtos dele." repete o título e o "N produtos" dos botões | T-0018 | web-site | CORRIGIDO (c626c33, #50) |
| RD-0147 | média | código | site/styles.css:633-634 | `.sistema` e `.sistema:hover` refazem o cartão `.item` (`:139-140`) | T-0018 | web-site | CORRIGIDO (b0550e1) |
| RD-0148 | baixa | código | site/styles.css:633 | `min-height: 44px` do `.sistema` morto (o botão mede 94 e 85 px) | T-0018 | web-site | CORRIGIDO (b0550e1) |
| RD-0149 | baixa | código | site/styles.css:46 | `.topo button, .topo input` sem elemento no cabeçalho | T-0018 | web-site | CORRIGIDO (b0550e1) |
| RD-0150 | baixa | código | site/styles.css:516, 561, 631, 639 | fim de seção 44/28 px repetido no `.recentes-bloco` e no `.sistemas-bloco` | T-0018 | web-site | CORRIGIDO (b0550e1) |
| RD-0151 | média | código | site/styles.css:333 (e :379, :508, :563) | regra dos 16 px: `.mv-campo select` vencido pela :379 (fica 14 px) e `.mf-geral input` repete a :508 | T-0018 | web-site | CORRIGIDO (43e76e2) |
| RD-0152 | — | código | catalogo_grafico/gerador/detalhe.py, montar.py | base unificada lida 2 vezes, caminho repetido e reserva para a cópia antiga em `entradas/` | T-0019 | catalogo-grafico | CORRIGIDO (4d76f53) |
| RD-0153 | — | código | catalogo_grafico/gerador/montar.py, print_cat.py | regra INATIVO em 2 lugares (vira `inativo(code)` no `montar.py`) | T-0019 | catalogo-grafico | CORRIGIDO (4d76f53) |
| RD-0154 | — | código | catalogo_grafico/gerador/montar.py | lista `SPEC` repetida (tupla em linha e conjunto depois do laço) | T-0019 | catalogo-grafico | CORRIGIDO (4d76f53) |
| RD-0155 | — | doc | catalogo_grafico/gerador/LEIA_GERADOR.md:15, :36 | as linhas 15 e 36 do LEIA | T-0019 | catalogo-grafico | CORRIGIDO (4d76f53) |
| RD-0156 | — | doc | catalogo_grafico/gerador/LEIA_GERADOR.md; destaques_fixos.json (`_sobre`) | regra dos destaques descrita no LEIA e no `_sobre` (o `_sobre` passa a apontar para o LEIA) | T-0019 | catalogo-grafico | CORRIGIDO (4d76f53) |
| RD-0157 | — | texto (PDF) | A4, página 3 | a frase da página 3 do A4 | T-0019 | catalogo-grafico | MANTIDO (Alexandre, R-20261120-155600, item 3) |
| RD-0158 | — | código (comentário) | catalogo_grafico/gerador/cross.py, oferta.py | comentário do par "Leve também" ("par só com item em estoque") nos 2 arquivos | T-0019 | catalogo-grafico | CORRIGIDO (4d76f53) |
| RD-0159 | — | dado | catalogo_grafico/gerador/destaques_fixos.json | "Filtros" (A4) e "Filtros de Óleo" (digital) com a mesma lista (FLU6001, FLU6002, FLU6004, FLU6011, FLU6005); são páginas diferentes | T-0019 | catalogo-grafico | MANTIDO |
| RD-0160 | — | doc | catalogo_grafico/gerador/LEIA_GERADOR.md | o LEIA dizia que o `montar.py` lê a base mais alta de `saidas/`; ele lê a de `dados/` | T-0019 | catalogo-grafico | CORRIGIDO (fbf5f82) |
| RD-0161 | baixa | código (comentário) | site/styles.css:5-6, 97-98, 117 | contraste 5,36:1 em 3 comentários; "cinza claro" e R-20261120-151700 em 2 (não segura). **Era o RD-0135 da T-0018**, renumerado em 20/11/2026 | T-0018 | web-site | ABERTO (no main f91d671, os 3 comentários continuam) |
| RD-0162 | — | texto (R1) | início, faixa (site/app.js:828) | etiqueta "BAP AUTO PARTS" abaixo do cabeçalho com o logo | varredura 20/11 | web-site | CORRIGIDO (c626c33, #50) |
| RD-0163 | — | texto (R2) | início, faixa (site/app.js:831) | "Busque por código, referência, veículo ou placa." repete os rótulos dos campos | varredura 20/11 | web-site | CORRIGIDO (c626c33, #50) |
| RD-0164 | alta | texto (R4) | início, bloco da lista (site/app.js:804-805) | "Pesquisas recentes" × "As mais pesquisadas nos últimos 7 dias"; o dado são aberturas; o #46 só troca o subtítulo | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0165 | média | texto (R1) | Sobre, topo (site/app.js:1487) | etiqueta "A BAP" abaixo do cabeçalho com o logo | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0166 | média | texto (R2) | Sobre, chamada (site/app.js:1509) | "Acesse nosso catálogo completo." repete o botão "Ver o catálogo" | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0167 | média | texto (R3) | produto (site/app.js:1336) | "Clique na foto para ampliar." ensina a usar (e diz "Clique" no celular) | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0168 | média | texto (R3) | busca (site/app.js:879) | "Resultados para “termo”" repete o campo e a etiqueta | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0169 | baixa | texto | busca vazia (site/app.js:880, 903) | "0 produtos" e "Nenhum produto encontrado" juntos | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0170 | baixa | texto | produto (site/app.js:1326; site/index.html:34) | "Confira sempre a aplicação…" na seção Aplicação e no rodapé | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0171 | média | texto | produto (site/app.js:1342) | os selos repetem o sistema e a família da trilha | varredura 20/11 | web-site | CORRIGIDO (750a2c9, #53) |
| RD-0172 | baixa | texto | site/app.js:1488, 1499, 1503-1504 (Sobre) | h2 repetido no começo do parágrafo e no h1; texto aprovado do PDF Empresa. **Era o RD-0134 da T-0018**, renumerado em 20/11/2026 | T-0018 | web-site | MANTIDO (decisão do po) |
| RD-0173 | baixa | código (comentário) | guarda-merge-lib.mjs (PR #34) | cabeçalho c/d sem a regra "Alexandre só pelo clone"; JSDoc do `lerRecadosDoGerente` separado da função. **Saiu como RD-0146 no reteste do #34**, renumerado em 20/11/2026 | T-0016 | alexandre | ABERTO (próximo PR de governança) |
| RD-0193 | — | texto e código | scripts/gerar_site.py:104; catalogo_grafico/gerador/montar.py:92 | "#N/A" e "APLICAÇÃO REVISADA" nas referências cruzadas (site e PDF); os PDFs passam a usar o `refs_de` do site | T-0019 | web-site, catalogo-grafico | CORRIGIDO (ad63e05, #64; fc62222, #70) |
| RD-0194 | — | texto (PDF) | catalogo_grafico/gerador/montar.py:122-124 | "EQUIVALE A" com a mesma referência repetida nos PDFs (vira `refs_unicas`) | T-0019 | catalogo-grafico | CORRIGIDO (3ceffef, #61) |
| RD-0199 | — | texto | scripts/gerar_site.py:90 | histórico interno "\| ANTERIOR" nas referências cruzadas | T-0017 | web-site | CORRIGIDO (9347ce5, #55) |
| RD-0200 | — | texto | scripts/gerar_site.py:79 | rótulo da referência com " PN" e prefixos (CROSS REFERENCES, REF. CRUZADA...): fica só a marca | T-0017 | web-site | CORRIGIDO (9347ce5, #55) |
| RD-0201 | — | texto | scripts/gerar_site.py:116 | a mesma referência (marca e código) repetida na célula | T-0017 | web-site | CORRIGIDO (9347ce5, #55) |
| RD-0202 | baixa | código (comentário) | scripts/gerar_site.py | comentário longo | T-0017 | web-site | CORRIGIDO (9347ce5, #55) |
| RD-0207 | — | — | parecer do PR #58 ("Leve também" só do veículo escolhido) | achado do parecer do #58 | T-0018 | web-site | CORRIGIDO (ef4d027, #58) |
| RD-0208 | — | — | parecer do PR #58 | achado do parecer do #58 | T-0018 | web-site | CORRIGIDO (ef4d027, #58) |
| RD-0209 | — | — | parecer do PR #54 (coluna Ano na aplicação) | achado do parecer do #54 | T-0017 | web-site | CORRIGIDO (22c342e, #54) |
| RD-0210 | — | — | parecer do PR #54 | achado do parecer do #54 | T-0017 | web-site | CORRIGIDO (22c342e, #54) |
| RD-0211 | — | — | parecer do PR #54 | achado do parecer do #54 | T-0017 | web-site | CORRIGIDO (22c342e, #54) |
| RD-0212 | baixa | código (comentário) | site/app.js, servemNoVeiculo | o comentário repetia a origem do VEI_LEVE explicada no render; termina em "O VEI_LEVE vem do render." (parecer do PR #58) | T-0018 | web-site | CORRIGIDO (f4636ec, #81) |
| RD-0213 | — | — | parecer do PR #59 (AUTOIMPACT fora do site, TRAVA) | achado do parecer do #59 | T-0017 | web-site | CORRIGIDO (4943a0f, #59) |
| RD-0214 | — | — | parecer do PR #59 | achado do parecer do #59 | T-0017 | web-site | CORRIGIDO (4943a0f, #59) |
| RD-0215 | — | texto (R1) | site, cartões com veículo | a tag "✓ Compatível" repete a faixa do veículo nos cartões. **Era o RD-0175 do parecer da tag**, renumerado | T-0018 | web-site | MANTIDO (Alexandre, R-20261120-191700, "3) a") |
| RD-0216 | — | texto (R1) | site, "Leve também" | a tag no "Leve também" repete a faixa do veículo. **Era o RD-0176 do parecer da tag**, renumerado | T-0018 | web-site | MANTIDO (Alexandre, R-20261120-191700, "3) a") |
| RD-0217 | — | código | dados/scripts/base_vNN.py | o main() repetido em cada `base_vNN.py` (vira `base_comum.rodar`) | T-0017 | catalogo-dados | CORRIGIDO (b8f84b0, #67) |
| RD-0218 | — | doc | README da v19 | README da v19 repetindo o que já está em outro lugar | T-0017 | catalogo-dados | CORRIGIDO (b8f84b0, #67) |
| RD-0219 | — | dado | base unificada, APLICACAO | linhas repetidas na mesma célula da APLICACAO | T-0017 | catalogo-dados | ABERTO (destino: simulação da v21) |
| RD-0220 | — | código | catalogo_grafico/gerador/site_regras.py | regras do site copiadas nos PDFs (os PDFs carregam o `gerar_site.py`, sem cópia) | T-0019 | catalogo-grafico | CORRIGIDO (3ceffef, #61) |
| RD-0221 | — | código | catalogo_grafico/gerador/datas.py:62 | `fix_text` e `em_diante` repetidos no desenho (vira uma função) | T-0019 | catalogo-grafico | CORRIGIDO (3ceffef, #61) |
| RD-0222 | — | texto (PDF) | catalogo_grafico/gerador/fraga_complementos.py:54, 147 | a mesma aplicação repetida no item (109 itens): `aplicacao_unica` | T-0019 | catalogo-grafico | CORRIGIDO (fc62222, #70) |
| RD-0223 | — | — | parecer do PR #62 (tag "✓ Compatível" e UNIVERSAL do "Leve também") | achado do parecer do #62 | T-0018 | web-site | CORRIGIDO (841d874, #62) |
| RD-0224 | — | — | parecer do PR #62 | achado do parecer do #62 | T-0018 | web-site | CORRIGIDO (841d874, #62) |
| RD-0225 | — | — | parecer do PR #62 | achado do parecer do #62 | T-0018 | web-site | CORRIGIDO (841d874, #62) |
| RD-0226 | — | código | scripts/gerar_site.py; catalogo_grafico/gerador/digital2.py:503 | regra do nome do fornecedor repetida (os PDFs usam o `G.FORNECEDOR_RE` do site) | T-0019 | web-site, catalogo-grafico | CORRIGIDO (ad63e05, #64; fc62222, #70) |
| RD-0227 | — | código | catalogo_grafico/gerador/digital2.py:502 | lista de fornecedores repetida (usa o `G.FORNECEDORES`) | T-0019 | catalogo-grafico | CORRIGIDO (fc62222, #70) |
| RD-0228 | — | — | parecer do PR #66 ("AAAA+" no site) | achado do parecer do #66 | T-0018 | web-site | CORRIGIDO (a6cd50b, #66) |
| RD-0229 | — | — | parecer do PR #66 | achado do parecer do #66 | T-0018 | web-site | CORRIGIDO (a6cd50b, #66) |
| RD-0230 | — | — | parecer do PR #70 (PDFs 2027 com a v19) | achado do parecer do #70 | T-0019 | catalogo-grafico | CORRIGIDO (fc62222, #70) |
| RD-0231 | — | doc | CLAUDE.md (PR #69, graphify) | achado do parecer do #69 | T-0020 | alexandre | CORRIGIDO (374dd14, #69) |
| RD-0232 | — | doc | CLAUDE.md (PR #69) | achado do parecer do #69 | T-0020 | alexandre | CORRIGIDO (374dd14, #69) |
| RD-0233 | — | — | parecer do PR #70 | achado do parecer do #70 | T-0019 | catalogo-grafico | CORRIGIDO (fc62222, #70) |
| RD-0234 | — | — | parecer do PR #70 | achado do parecer do #70 | T-0019 | catalogo-grafico | CORRIGIDO (fc62222, #70) |
| RD-0235 | — | código | catalogo_grafico/gerador/datas.py:53 | "AAAA>" tratado depois do "Leve também" (passa a `montar._em_diante`, antes do `cross.py`) | T-0019 | catalogo-grafico | CORRIGIDO (fc62222, #70) |
| RD-0236 | baixa | doc | .coord/tarefas/T-0017.md | repetição nos docs do #73 | T-0017 | gerente-projetos | CORRIGIDO (11f2353, #73) |
| RD-0237 | baixa | doc | .coord/tarefas/T-0020.md | repetição nos docs do #73 | T-0020 | gerente-projetos | CORRIGIDO (11f2353, #73) |
| RD-0238 | baixa | doc | .coord/tarefas/T-nnnn.md, linha Branch | repetição nos docs do #73 | — | gerente-projetos | CORRIGIDO (11f2353, #73) |
| RD-0239 | — | código | base_comum.py, comparar; base_v21.py, conferir_valores | a conta da linha que sobe depois das removidas escrita 2 vezes (vira `subir(r, removidas)` no base_comum) | T-0017 | catalogo-dados | CORRIGIDO (117c2b0; 92170da, #75) |
| RD-0240 | — | código | dados/scripts/base_v21.py, aplicar | o bloco "[PARADO] nada foi gravado" escrito no script (vira `parar(erros)` no base_comum, da v21 em diante) | T-0017 | catalogo-dados | CORRIGIDO (117c2b0; 92170da, #75) |
| RD-0241 | — | texto (base) | base v21, aba LEIA-ME (dados/scripts/base_v21.py, LEIA_ME) | 2 frases repetidas: "na VEICULOS só mudam as 2 células da P14" e "A PRODUTOS tem 3 linhas a menos" | T-0017 | catalogo-dados | CORRIGIDO (117c2b0; 92170da, #75) |
| RD-0242 | — | doc | dados/simulacoes/T-0017-v21/README.md, P14 | o bloco [SUPOSIÇÃO] repetia o KF27 e o CV-F35 da lista logo acima (vira uma frase em cada item) | T-0017 | catalogo-dados | CORRIGIDO (e1e185d; 92170da, #75) |
| RD-0243 | — | código | catalogo_grafico/gerador/print_cat.py; tags.py | o subtítulo do cartão de destaque com as constantes (7 + 16.5 + 2, 7.4/9.6, 2 linhas) e a altura das tags repetidas na medida e no desenho (viram `SB_Y`, `SB_FS`/`SB_LH`, `TAG_LINHAS` e `tags.altura`) | T-0019 | catalogo-grafico | CORRIGIDO (f87ed94; 7f063a9, #77) |
| RD-0244 | — | código | dados/scripts/base_v22.py, conferir_valores | `subir()` com `SEM_REMOVIDAS` vazio, sem efeito (sai; usa `ws.cell(n, c)` direto) | T-0017 | catalogo-dados | CORRIGIDO (9f9dbfc; bfad64e, #78) |
| RD-0245 | média | doc | dados/simulacoes/T-0017-v23/README.md | o README repetia o RESUMO e a seção Arquivos | T-0017 | catalogo-dados | CORRIGIDO (84b9e6f, fb3f533; 2945a37, #82) |
| RD-0246 | baixa | doc | dados/simulacoes/T-0017-v23/RESUMO.md | o trecho da Kia dito 2 vezes | T-0017 | catalogo-dados | CORRIGIDO (84b9e6f; 2945a37, #82) |
| RD-0247 | média | código | dados/scripts/base_v23.py | `vazio`, `conferir_valores` e a leitura da ANTES_DEPOIS copiados da v22 (vão para o base_comum) | T-0017 | catalogo-dados | CORRIGIDO (2165c8c; 2945a37, #82) |
| RD-0248 | baixa | texto (base) | base v23, aba LEIA-ME | a linha "SCE14002: nada muda" à parte; o LEIA-ME ficou +6 | T-0017 | catalogo-dados | CORRIGIDO (2165c8c; 2945a37, #82) |
| RD-0249 | média | doc | catalogo_grafico/simulacoes/T-0019-pdf-v23/README.md | o antes e o depois repetidos, a Linha Moto 2 vezes e "Nenhum script mudou" contra o 2fe2940 | T-0019 | catalogo-grafico | CORRIGIDO (1aa3f82; 6d5ac4c, #84) |
| RD-0250 | baixa | doc | catalogo_grafico/LEIA-ME.md:85 | o histórico da rodada dentro do guia | T-0019 | catalogo-grafico | CORRIGIDO (1aa3f82; 6d5ac4c, #84) |
| RD-0251 | baixa | código (docstring de teste) | catalogo_grafico/gerador/teste_fraga_complementos.py | a docstring repetia a regra do "DE" e o comando | T-0019 | catalogo-grafico | CORRIGIDO (1aa3f82; 6d5ac4c, #84) |
| RD-0252 | média | texto (PDF) | A4 p21 e Digital p110, SCE14002: catalogo_grafico/gerador/detalhe.py (aplicar/compacto/_tail), print_cat.py:261 | o subtítulo do cartão repete a aplicação e estica a faixa dos 5 cartões; já existia antes da v23 | T-0019 | catalogo-grafico | ABERTO (Simule; fora da rodada R-20261120-235000-alexandre, que não muda layout) |
| RD-0253 | baixa | código (teste) | scripts/testar_site.mjs, palavrasInternas e autoimpactForaDaRef | o recorte em volta do achado (`t.slice(m.index - 25 … + 25)`) escrito 2 vezes (vira `trechoEm`) | T-0017 | testes | CORRIGIDO (8eaddab; 366b55c, #86) |
| RD-0254 | baixa | código (teste) | scripts/testar_site.mjs, textoDe e autoimpactForaDaRef | 2 varreduras do objeto do produto, cada uma com o seu `andar` (vira `folhas(v, f, onde)`, a única) | T-0017 | testes | CORRIGIDO (8eaddab; 366b55c, #86) |
| RD-0255 | média | código | scripts/gerar_site.py, FORNECEDOR_RE e CONCORRENTE_RE | a mesma montagem da regex (até 3 sinais entre as letras) escrita 2 vezes (vira `nomes_re(nomes)`; as regex não mudam) | T-0017 | web-site | CORRIGIDO (069a4e6; be7efe8, #87) |
| RD-0256 | média | código (regra) | scripts/gerar_site.py, refs_de (rótulo e sort) e sem_marca_concorrente | `so_codigo(marca) in CONCORRENTES_SO_NA_REF` em 3 lugares (vira `e_concorrente(marca)`) | T-0017 | web-site | CORRIGIDO (069a4e6; be7efe8, #87) |
| RD-0257 | baixa | código (comentário) | scripts/gerar_site.py, CONCORRENTES_SO_NA_REF, refs_de e TRAVA | onde o nome do concorrente pode estar, dito em 4 comentários (fica na docstring do `sem_marca_concorrente`; os outros apontam para ela) | T-0017 | web-site | CORRIGIDO (069a4e6; be7efe8, #87) |
| RD-0258 | baixa | doc | docs/DADOS_DO_SITE.md, seção da TRAVA | a passagem da AUTOIMPACT de fornecedor a concorrente contada de novo no fim do parágrafo (fica 1 vez, com "ver o campo `r`") | T-0017 | web-site | CORRIGIDO (069a4e6; be7efe8, #87) |
| RD-0259 | baixa | código (comentário) | catalogo_grafico/gerador/digital2.py (trava) e fraga_complementos.py (fim do aplicar) | comentários que ainda diziam que a AUTOIMPACT é fornecedor ("os FORNECEDORES (AUTOIMPACT, SUNRISE)"; "trazem AUTOIMPACT, fornecedor") | T-0017 | catalogo-grafico | CORRIGIDO (9e203da; 8de7a6d, #90) |
| RD-0260 | média | código | dados/scripts/base_v24.py, aplicar | as linhas novas da VEICULOS (cópia do formato da última linha e filtro estendido) reescritas à mão, igual ao `base_comum.acrescentar_linhas` (sai o `copy`; usa o `acrescentar_linhas`) | T-0017 | catalogo-dados | CORRIGIDO (ab3d6c4; 6819c7b, #88) |
| RD-0261 | baixa | código | dados/scripts/base_v24.py e base_v25.py | o cabeçalho da VEICULOS (`COLS_V`, 11 colunas) copiado nos 2 scripts (vira `base_comum.CAB_VEICULOS`) | T-0017 | catalogo-dados | CORRIGIDO (ab3d6c4; 6819c7b, #88) |
| RD-0262 | baixa | texto (base) | base v24 e v25, aba LEIA-ME (linha Formato) | "A VEICULOS ganha 21 linhas no fim" (v24) e "ganha 1 linha no fim" (v25) repetiam a linha da VEICULOS do mesmo LEIA-ME | T-0017 | catalogo-dados | CORRIGIDO (ab3d6c4; 6819c7b, #88) |
| RD-0263 | média | doc | dados/simulacoes/T-0017-v24/README.md e T-0017-v25/README.md | o sha256 no título e de novo na Base de partida; a regra fixa e as regras da 2ª rodada (v24) e o pedido literal (v25), que o RESUMO já traz | T-0017 | catalogo-dados | CORRIGIDO (ab3d6c4; 6819c7b, #88) |
| RD-0264 | baixa | código (docstring) | dados/scripts/base_comum.py, docstring do módulo, ler_antes_depois e acrescentar_linhas | as docstrings contavam de novo o histórico da v24 e da v25 ("na v24, VALIDOS"; "da v25; o base_v24.py fica como rodou") | T-0017 | catalogo-dados | CORRIGIDO (ab3d6c4; 6819c7b, #88) |
| RD-0265 | média | doc | catalogo_grafico/gerador/LEIA_GERADOR.md, linha do fornecedor e da concorrência | o como funciona da trava (Doc.ref, caixa, TRAVA_PDF_REF, "AUTO IMPACT") repetia o comentário do `digital2.trava_pdf` (fica a regra e onde ela mora) | T-0017 | catalogo-grafico | CORRIGIDO (3aff7e0; 8de7a6d, #90) |
| RD-0266 | baixa | código | catalogo_grafico/gerador/montar.py, refs_pela_regra e refs_unicas | o `concorrente_por_ultimo` chamado nos 2 (o `refs_unicas` já ordena o que passa pelo `refs_pela_regra`) | T-0017 | catalogo-grafico | MANTIDO (o `site_aplicacoes._refs_antes`, lido pelo `lista_aplicacoes_site.py`, sai do `refs_pela_regra` sem passar pelo `refs_unicas`) |
| RD-0267 | baixa | código (comentário) | catalogo_grafico/gerador/fraga_complementos.py, fim do aplicar | o comentário repetia a regra da AUTOIMPACT (concorrência, por último), que é do `montar.refs_unicas` | T-0017 | catalogo-grafico | CORRIGIDO (3aff7e0; 8de7a6d, #90) |
| RD-0284 | — | texto (base e site) | dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx, SCE14002 (APLICACAO) | a APLICACAO do SCE14002 repetia no site os modelos LS no bloco "Outros veículos e detalhes"; fica "LS 1630 · LS 1929 · LS 1932 · LS 1934 · LS 1941 · VW 16210 17240 1730 · 111693" (R-20261121-210229-po) | T-0017 | catalogo-dados | CORRIGIDO (b8fc1a7; 9268f42, #104) |
| RD-0285 | — | código | catalogo_grafico/gerador/oferta.py, sistemas | a POSICAO dos DADOS_ADICIONAIS lida por uma cópia (`oferta._posicao`), e não pelo `pares_de` do site | T-0019 | catalogo-grafico | CORRIGIDO (f52e409; 57bdc2a, #99, com o `pares_de` do #100) |
| RD-0286 | — | código | catalogo_grafico/gerador/oferta.py e digital2.py | o `oferta._txt` repetia o `G.limpar`; o código da oferta era tirado do parêntese em 2 lugares; o `sem_viuva` partia o texto 2 vezes | T-0019 | catalogo-grafico | CORRIGIDO (f52e409; 57bdc2a, #99) |
| RD-0287 | — | código | catalogo_grafico/gerador/detalhe.py, oferta.py e digital2.py | logs mortos (`TAIL_LOG`, `SIS_LOG`) e ramo morto no `refs_juntas` | T-0019 | catalogo-grafico | CORRIGIDO (f52e409; 57bdc2a, #99) |
| RD-0288 | — | doc | catalogo_grafico/gerador/LEIA_GERADOR.md | faltavam no LEIA_GERADOR o `digital_data.json`, o B8, o B10 e o "Leve também" pelo site | T-0019 | catalogo-grafico | CORRIGIDO (f52e409; 57bdc2a, #99) |
| RD-0289 | média | código | catalogo_grafico/gerador/digital2.py:271, :279 e :286 (com Doc.tag:223 e tags.medir:85) | a largura da tag (`lw(...) + 2 * pad`) reescrita no `novo_desce` e no `novo_na_sobra`; o `NOVO_TAG = 6.2` repete o tamanho padrão do `tags.py` | T-0019 | catalogo-grafico | CORRIGIDO (b002d22; 57bdc2a, #99) |
| RD-0290 | média | código | catalogo_grafico/gerador/digital2.py:305-308 e :407; print_cat.py:312-315 e :360 | a cola do B10 (encolher o código, `novo_desce`, `novo_na_sobra`, a tag NOVO na descrição) escrita nos 2 PDFs | T-0019 | catalogo-grafico | CORRIGIDO (b002d22; 57bdc2a, #99) |
| RD-0291 | baixa | código | catalogo_grafico/gerador/oferta.py:189 e :206 | o conjunto `cods` montado no `_por_sistema` e de novo no `_so_codigo`, na mesma rodada | T-0019 | catalogo-grafico | CORRIGIDO (b002d22; 57bdc2a, #99) |
| RD-0292 | baixa | código (comentário) | catalogo_grafico/gerador/oferta.py:11 e :67-72 | o "Leve também" pelas regras do site dito no import, no bloco de baixo e em mais 3 lugares; o bloco repete o docstring do `sistemas_de` | T-0019 | catalogo-grafico | CORRIGIDO (b002d22; 57bdc2a, #99) |
| RD-0293 | média | texto (PDF) | A4 p. 20 e Digital p. 112-113, embreagem pesada (ex.: EMB3400700639R) | "plato/disco/mancal · c/ platô, disco, rol. e mancal": a composição do kit 2 vezes (anterior ao PR #99, igual no main 3d6a730) | T-0019 | catalogo-grafico | CORRIGIDO (simulação 540b1df aprovada, R-20261122-030552-alexandre; PDFs oficiais f29da61; c9975a5, #109) |
| RD-0294 | média | código (teste) | scripts/testar_site.mjs:507-509, :1245-1296 e :1516 | o ramo da tela de 2 abas (cerca de 50 linhas) sobra depois do aperto: a :505 já falha com abas | T-0014 | testes | CORRIGIDO (d7fdc20; 590209e, #101) |
| RD-0295 | média | código (teste) | scripts/testar_site.mjs:929-945, :1009-1055, :1115 e :1517-1520 | filtros "lateral" e "barra" ainda percorridos (já falham na :945); `detalhe("filtros")` gravado 2 vezes, com o texto do `si` repetido | T-0014 | testes | CORRIGIDO (d7fdc20; 590209e, #101) |
| RD-0296 | baixa | código (comentário) | scripts/testar_site.mjs:21-23 e as marcas "Aperto …" | a lista das transições que saíram, no cabeçalho e de novo em cada ponto apertado | T-0014 | testes | CORRIGIDO (d7fdc20; 590209e, #101) |
| RD-0297 | baixa | texto (saída do teste) | scripts/testar_site.mjs:996 e :1525; resumo.txt, linha "filtros da busca" | `"CXD13062" (1 opção por grupo):` 2 vezes na mesma linha do resumo | T-0014 | testes | CORRIGIDO (d7fdc20; 590209e, #101) |
| RD-0298 | média | código | catalogo_grafico/gerador/quebra.py:16-17, varredura_quebras.py:13-14 e digital2.py:97 | `NBSP` definido 3 vezes e `SEP` 2 vezes, com listas diferentes (`,/;)·` no quebra, `,/-–);·\|+` na varredura) | T-0019 | catalogo-grafico | CORRIGIDO (dbbef37; 57bdc2a, #99) |
| RD-0299 | média | código | catalogo_grafico/gerador/print_cat.py:164 e :301; LEIA_GERADOR.md:18 | `REF_MAIS = 0`, sobra do teste com 12, soma 0 à coluna; a história do teste no comentário e no LEIA | T-0019 | catalogo-grafico | CORRIGIDO (dbbef37; 57bdc2a, #99) |
| RD-0300 | baixa | doc | catalogo_grafico/gerador/LEIA_GERADOR.md:18 e :52 | o comando do `varredura_quebras.py` no item do B8 e na tabela de comandos | T-0019 | catalogo-grafico | CORRIGIDO (dbbef37; 57bdc2a, #99) |
| RD-0301 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0016 a T-0019.md (commit 1649d37) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0302 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0016 a T-0019.md (commit 1649d37) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0303 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0016 a T-0019.md (commit 1649d37) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0304 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0016 a T-0019.md (commit 1649d37) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0305 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0016 a T-0019.md (commit 1649d37) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0306 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0016 a T-0019.md (commit 1649d37) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0307 | — | — | — | número não usado (pulado): nenhum recado nem branch o cita; o #103 lista "RD-0301 a RD-0306, RD-0308 e RD-0309" | — | — | número não usado (pulado) |
| RD-0308 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0018 e T-0019.md (commit cceb0b9) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0309 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0018 e T-0019.md (commit cceb0b9) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #103 conforme R-20261122-013101-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (cceb0b9; 67bcfc4, #103) |
| RD-0310 | — | código | dados/scripts/base_comum.py e dados/simulacoes/T-0017/v27/simular_v27.py | o `gerar_site_copia` (com "sc") e o `contar_duvidoso` copiados de uma simulação para a outra (passam ao `base_comum`; o `simular_v26.py` fica como rodou) | T-0017 | catalogo-dados | CORRIGIDO (b8fc1a7; 9268f42, #104) |
| RD-0311 | — | código | dados/scripts/base_v27.py, LEIA-ME do SCE14002 | o item do LEIA-ME reescrevia o texto do SCE14002 em vez de usar o `TEXTO['SCE14002']` | T-0017 | catalogo-dados | CORRIGIDO (b8fc1a7; 9268f42, #104) |
| RD-0312 | — | doc | dados/simulacoes/T-0017/v27/README.md | o README repetia os arquivos, o uso e o sha do LEIA.md (passa a apontar o LEIA.md) | T-0017 | catalogo-dados | CORRIGIDO (b8fc1a7; 9268f42, #104) |
| RD-0313 | — | código (comentário) | scripts/gerar_site.py, ROL_SISTEMAS | o comentário repetia a contagem e o exemplo do docs/DADOS_DO_SITE.md (ROL32008/ROL32009 em RODAGEM, já desatualizado na v27) | T-0017 | web-site | CORRIGIDO (fce3541; b1c5aaa, #106) |
| RD-0314 | — | código (comentário) | site/app.js, comentário do cartão | "não é botão" e "(botão)" juntos no mesmo comentário | T-0017 | web-site | CORRIGIDO (fce3541; b1c5aaa, #106) |
| RD-0315 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0017, T-0019 e T-0021.md (commit 9060a5c) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #107 conforme R-20261122-024743-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (41d4b40; 3dd4850, #107) |
| RD-0316 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0017, T-0019 e T-0021.md (commit 9060a5c) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #107 conforme R-20261122-024743-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (41d4b40; 3dd4850, #107) |
| RD-0317 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0017, T-0019 e T-0021.md (commit 9060a5c) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #107 conforme R-20261122-024743-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (41d4b40; 3dd4850, #107) |
| RD-0318 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0017, T-0019 e T-0021.md (commit 9060a5c) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #107 conforme R-20261122-024743-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (41d4b40; 3dd4850, #107) |
| RD-0319 | — | tarefa | .coord/quadro.md e .coord/tarefas/T-0014, T-0017, T-0019 e T-0021.md (commit 9060a5c) | [SUPOSIÇÃO] texto do achado não guardado; corrigido no #107 conforme R-20261122-024743-gerente-projetos (repetição nos registros do gerente) | T-0017 | gerente-projetos | CORRIGIDO (41d4b40; 3dd4850, #107) |
| RD-0320 | — | tarefa | .coord/tarefas/T-0014.md, critério do cartão do resultado | a nota [SUPOSIÇÃO] do critério recontava a conferência de 21/11, que o Registro já traz (fica só o ponteiro "ver o Registro de 21/11 21:25 e 21:35") | T-0014 | gerente-projetos | CORRIGIDO (41d4b40; 3dd4850, #107) |
| RD-0321 | — | tarefa | .coord/tarefas/T-0022.md | a regra 1 do CLAUDE.md copiada na Especificação ("sem preço e sem estoque; a FICHA e a TRAVA não mudam") [SUPOSIÇÃO: o número de cada corte segue a ordem do R-20261122-025725-gerente-projetos] | T-0022 | gerente-projetos | CORRIGIDO (1b84fbf; 18ad4cd, #108) |
| RD-0322 | — | tarefa | .coord/tarefas/T-0022.md | a regra 2 do CLAUDE.md copiada na Especificação (senha "nunca no Git, no chat ou num doc") [SUPOSIÇÃO: o número de cada corte segue a ordem do R-20261122-025725-gerente-projetos] | T-0022 | gerente-projetos | CORRIGIDO (1b84fbf; 18ad4cd, #108) |
| RD-0323 | — | tarefa | .coord/tarefas/T-0022.md | o BAP Ajuda 2.0 repetido no "Não entra" (a regra 5 do CLAUDE.md já diz) [SUPOSIÇÃO: o número de cada corte segue a ordem do R-20261122-025725-gerente-projetos] | T-0022 | gerente-projetos | CORRIGIDO (1b84fbf; 18ad4cd, #108) |
| RD-0324 | — | tarefa | .coord/tarefas/T-0022.md | a frase dos passos do Alexandre no painel do Render na Especificação e de novo no Passo 3 (fica completa no Passo 3) [SUPOSIÇÃO: o número de cada corte segue a ordem do R-20261122-025725-gerente-projetos] | T-0022 | gerente-projetos | CORRIGIDO (1b84fbf; 18ad4cd, #108) |
| RD-0325 | — | tarefa | .coord/tarefas/T-0022.md | o Registro copiava as respostas do Alexandre que o Pedido já traz (passa a apontar o Pedido) [SUPOSIÇÃO: o número de cada corte segue a ordem do R-20261122-025725-gerente-projetos] | T-0022 | gerente-projetos | CORRIGIDO (1b84fbf; 18ad4cd, #108) |
| RD-0326 | média | doc | .claude/agents/gerente-projetos.md:25, CLAUDE.md:33 e .coord/README.md:14 | as pastas do `integracao-placas` sem `servicos/login/` em 3 dos 5 lugares (diverge do `.coord/donos.json:119`) | T-0022 | alexandre (via po); gerente-projetos (README) | CORRIGIDO (7a6ba83; 8efb879, #110; 5a344ba; f9fcc35, #111) |
| RD-0327 | média | código | catalogo_grafico/gerador/detalhe.py:311-312 e teste_bloco_b_pdf.py | o `ESS_TROCA` com os 2 rótulos do `ESSENCIAL` como chave, os 2 com o mesmo `_KIT_CRU`; o teste refazia a lista (vira chave pela família) | T-0019 | catalogo-grafico | CORRIGIDO (1953f02; c9975a5, #109) |
| RD-0328 | média | doc | catalogo_grafico/gerador/LEIA_GERADOR.md:14 | a linha do RD-0293 contava de novo as sobras cruas, o exemplo e as páginas (fica só a regra e o lugar do código) | T-0019 | catalogo-grafico | CORRIGIDO (1953f02; c9975a5, #109) |
| RD-0329 | média | doc | catalogo_grafico/simulacoes/T-0019/rd0293/LEIA.md:3 e :44 | as contagens de páginas na abertura e a frase da opção b repetiam a tabela e a pergunta | T-0019 | catalogo-grafico | CORRIGIDO (1953f02; c9975a5, #109) |
| RD-0330 | baixa | código (docstring de teste) | catalogo_grafico/gerador/teste_bloco_b_pdf.py:1-5 | a docstring não citava o teste novo do RD-0293 | T-0019 | catalogo-grafico | CORRIGIDO (1953f02; c9975a5, #109) |
| RD-0331 | baixa | doc | .coord/tarefas/T-0022.md:62 | o Registro dizia "sem logo, a da BAP", diferente da leitura do PO no R-20261122-032433 ("logo inteiro da BAP, pequeno") | T-0022 | gerente-projetos | CORRIGIDO (5a344ba; f9fcc35, #111) |
| RD-0332 | baixa | doc | .coord/tarefas/T-0022.md:62 | o Registro dizia "5 h depois do login", sem o "mesmo em uso" da leitura do PO | T-0022 | gerente-projetos | CORRIGIDO (5a344ba; f9fcc35, #111) |
| RD-0333 | baixa | tarefa | .coord/tarefas/T-0022.md:5 e .coord/quadro.md:28 | a Situação repetia "desenho e telas aprovados", que o Registro já diz (fica "EM ANDAMENTO (serviço e telas em código)") | T-0022 | gerente-projetos | CORRIGIDO (5a344ba; f9fcc35, #111) |
| RD-0334 | baixa | código | servicos/login/server.mjs:306 × servicos/placas/server.mjs:138 | `ipDoPedido`, `lerCorpo` e `json` repetidos entre os 2 serviços | T-0022 | integracao-placas | MANTIDO (o `rootDir` da placa impede um arquivo comum; 008b9d7, #118) |
| RD-0335 | média | código | servicos/login/server.mjs | 4 mensagens de erro escritas 2 vezes, sem constante (vão para o `MSG`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0336 | média | código | servicos/login/server.mjs:356, :522 e :588 | a normalização do usuário 3 vezes (vira `normUsuario`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0337 | média | código | servicos/login/server.mjs:385 e :601 | o registro do usuário novo 2 vezes (vira `novoUsuario`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0338 | média | código | servicos/login/server.mjs:173 e :193 | a gravação segura 2 vezes (vira `gravarSeguro`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0339 | baixa | código | servicos/login/server.mjs | os cabeçalhos de resposta 4 vezes (vira `enviar`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0340 | baixa | código | servicos/login/server.mjs | o 405 com o `Allow` 13 vezes (vira `metodoErrado`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0341 | baixa | código | servicos/login/server.mjs:526 e :547 | o `Retry-After` 2 vezes (vira `RETRY`) | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0342 | baixa | código | servicos/login/server.mjs:97-98 | o `LOGO_TIPOS` é o `LOGO_MIME` invertido, escrito à mão | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0343 | baixa | código | servicos/login/server.mjs:68-88 | 10 extensões sem nenhum arquivo delas no `site/` | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0344 | baixa | código | servicos/login/server.mjs:846 | `srv.fechado` morto; 6 exports sem uso | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0345 | baixa | doc | servicos/placas/README.md:33 | a regra das 2 variáveis escrita 3 vezes | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0346 | baixa | doc | servicos/login/LEIA.md:14 | a regra do log repetida | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0347 | baixa | código (comentário) | servicos/placas/server.mjs:45-47 | o comentário repete o README | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0348 | baixa | teste (título) | servicos/login/login.test.mjs:181 | o título repete o do teste da linha 230 | T-0022 | integracao-placas | CORRIGIDO (ea90b99; 008b9d7, #118) |
| RD-0349 | baixa | código | servicos/placas/server.mjs:59 | o caminho pelo `produtos.json` publicado | T-0022 | integracao-placas | MANTIDO (fica na transição para o serviço de login; 008b9d7, #118) |
| RD-0350 | baixa | teste | servicos/login/login.test.mjs:171 | a checagem direta da `voltaSegura` repetia os casos `%09`, `%0a` e `%0d%5C` que o laço HTTP do mesmo teste já cobre (ficam só `/%7f/x`, `/%E0%A4%A` e `/\t/x`) | T-0022 | integracao-placas | CORRIGIDO (bee1dbe; 008b9d7, #118) |
| RD-0351 | baixa | código | servicos/login/server.mjs:757, rota `/api/eu` | a resposta do `/api/eu` remontava à mão os campos que o `publico()` já monta (passa a usar o `publico()`, sem `ativo` e `ultimoAcesso`, mais `expiraEm`; o contrato não muda) | T-0022 | integracao-placas | CORRIGIDO (bee1dbe; 008b9d7, #118) |
| RD-0352 | média | código | site/entrar/entrar.js, site/conta.js, site/admin/usuarios/usuarios.js e site/admin/pdfs/pdfs.js | `esc`, `expirou`, a chamada à API e o `LOGO_BAP` escritos em cada página (vão para `/entrar/comum.js`, `window.BAP`, carregado antes dos outros scripts nas 5 páginas) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0353 | média | código | site/app.js e site/conta.js | o catálogo com um aviso próprio ao lado do aviso do `conta.js` (fica o do `conta.js`: um tempo só, `role="status"`) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0354 | média | código | site/entrar/entrar.js, site/admin/usuarios/usuarios.js e site/admin/pdfs/pdfs.js | o tratamento do 401 repetido em cada chamada (o `BAP.api` leva o 401 ao login, fora do `/api/entrar`) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0355 | média | código | site/entrar/entrar.js | `DICA_MIN` e a conferência da senha nova escritas 2 vezes; a frase da senha igual à atual diferente da do servidor (vão para o `BAPForm`, com "A nova senha precisa ser diferente da atual.") | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0356 | média | texto | site/admin/usuarios/usuarios.js | a regra do usuário escrita na dica e de novo na mensagem de erro (vira `REGRA_US` na dica; erro "Confira o usuário: ele não segue a regra acima.") | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0357 | baixa | código | site/admin/usuarios/usuarios.js e site/admin/pdfs/pdfs.js | a data "dd/mm/aaaa hh:mm" formatada em mais de um lugar (vira `F.quando`) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0358 | baixa | código | site/conta.js e site/admin/pdfs/pdfs.js | o ícone do PDF desenhado 2 vezes (vira `BAPConta.IC.pdf`) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0359 | média | código | site/styles.css e site/admin/admin.css | o campo e o rótulo da busca refeitos no login e no admin (o da busca do site serve aos dois) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0360 | média | código | site/admin/admin.css e site/admin/usuarios/usuarios.js | a janela do admin refeita ao lado da janela do produto (a `dialog.dlg` passa a ser a `dialog.janela` do produto) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0361 | baixa | código | site/entrar/entrar.css e site/admin/admin.css | CSS morto das telas do login (sai) | T-0022 | web-site | CORRIGIDO (87ec078; c895acc, #114) |
| RD-0362 | baixa | código | site/admin/admin.css:46 e :102 | a largura da janela do admin escrita para a tela e desfeita de novo no `@media print` (os 560 px ficam só em `@media screen and (min-width: 641px)`; na impressão fica só a regra que esconde o `main > div`) | T-0022 | web-site | CORRIGIDO (8e529f5; c895acc, #114) |
| RD-0363 | baixa | código | site/admin/usuarios/usuarios.js:89-90 | o `forEach` que movia os avisos da janela para a página ao fechar, sobra depois do R2 (todo aviso já vem depois do `close`) | T-0022 | web-site | CORRIGIDO (8e529f5; c895acc, #114) |
| RD-0364 | média | teste | testes/login.mjs, sessão de 5 h | o relógio de 5 h por HTTP copiava os testes do serviço (o relógio passa a ser feito pela tela e o cookie é conferido uma vez) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0365 | média | teste | testes/login.mjs, passe sem login | o passe com cookie falsificado, o `/interno` com a chave errada e a raiz por HTTP, que os testes do serviço já cobrem (saem) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0366 | média | teste | testes/login.mjs, usuário comum | o GET, o POST e o PATCH do usuário comum por `ctx.request`, que os testes do serviço já cobrem (saem) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0367 | média | teste | testes/login.mjs, volta | o `//host` e o `/\host` conferidos no servidor, que os testes do serviço já cobrem (saem) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0368 | média | código (teste) | testes/login.mjs | o `entrarParaBuscas` refazia a entrada pela tela (passa a usar o `entrarUI`) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0369 | — | — | — | número não usado | — | — | número não usado |
| RD-0370 | baixa | código (comentário de teste) | servicos/login/login.test.mjs:176 | o comentário das rotas abertas repetia a lista `ABERTOS` do `server.mjs` (fica "Abertos: a lista ABERTOS do server.mjs e a saúde.") | T-0022 | integracao-placas | CORRIGIDO (b3e5500; 008b9d7, #118) |
| RD-0371 | média | código (teste) | scripts/testar_site.mjs e testes/login.mjs | o `vigiar`, o `RX_PLACAS`, o `cortar` e os `CASOS` escritos nos 2 arquivos (ficam num lugar só, no `testar_site.mjs`, e vão ao `login.mjs` pelo `reg`) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0372 | baixa | código (teste) | testes/login.mjs | variáveis mortas (saem) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0373 | baixa | código (teste) | testes/login.mjs | a conferência de acessibilidade em dobro e a leitura das linhas da lista de usuários em dobro (fica uma de cada; a das linhas vira `linhasUsuarios`) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0374 | baixa | doc (ajuda) | scripts/testar_site.mjs, ajuda do `--login` | a ajuda do `--login` repetia o cabeçalho do `testes/login.mjs` (passa a remeter a ele) | T-0022 | testes | CORRIGIDO (eec6010; 2067077, #117) |
| RD-0375 | baixa | teste | servicos/login/login.test.mjs:587 | `SENHA_INICIAL`, `SEGREDO` e `CHAVE_INTERNA` na lista do que não pode aparecer no log, já cobertos pelo prefixo `falsa-` (saem) | T-0022 | integracao-placas | CORRIGIDO (e5e665b; 008b9d7, #118) |
| RD-0376 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0377 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0378 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0379 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0380 | média | doc | docs/marca/decisoes.md, decisão 8 a | a decisão repetia "só no site, para erro e para o botão de desativar", que a coluna da pergunta e o `manual.md` já dizem (fica "Aprovadas.") | T-0022 | design-de-marca | CORRIGIDO (8095c87; 188e720, #116) |
| RD-0381 | média | doc | docs/marca/decisoes.md, decisão 7 a | "Não se corta o logo nem se usa o símbolo solto." repetia a escolha da opção a (fica "Logo inteiro da BAP, pequeno.") | T-0022 | design-de-marca | CORRIGIDO (8095c87; 188e720, #116) |
| RD-0382 | baixa | doc | docs/marca/manual.md:7-8 | a frase "Até lá, as seções abaixo têm só as regras já aprovadas." repetia a abertura do manual ("Só entra" o aprovado) (sai) | T-0022 | design-de-marca | CORRIGIDO (8095c87; 188e720, #116) |
| RD-0383 | baixa | doc | docs/marca/manual.md, "Cores de estado (só no site)" | "Só na interface do site." repetia o título da seção (sai) | T-0022 | design-de-marca | CORRIGIDO (8095c87; 188e720, #116) |
| RD-0384 | média | doc | docs/marca/pareceres/T-0022-simulacao.md, Reteste | a lista do que conferir e a tabela "fechado em 21/11 23:11" repetiam a seção do reteste de 23:11 (fica só ela) | T-0022 | design-de-marca | CORRIGIDO (8095c87; 188e720, #116) |
| RD-0385 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0386 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0387 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0388 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0389 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0390 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0391 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0392 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0393 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0394 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0395 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0396 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0397 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0398 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0399 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0400 | baixa | doc | docs/marca/pareceres/T-0022-simulacao.md:149 | o título "## Reteste" vazio seguido de "### Reteste · …" (vira uma linha só, "## Reteste · 21/11/2026 23:11 (Manaus) · **LIBERADO**") | T-0022 | design-de-marca | CORRIGIDO (1044dbf; 188e720, #116) |
| RD-0401 | baixa | código (comentário) | render.yaml:42-44 | o comentário do serviço de login repete o `servicos/login/LEIA.md` | T-0022 | alexandre | MANTIDO (explica o "sem rootDir" e o `sync:false` no próprio Blueprint; 582c38b, #120) |
| RD-0402 | baixa | rotina | .github/workflows/testes.yml:47-48 | o `testar_site.mjs --login` repete o `testarJson` e as buscas do passo sem login | T-0022 | testes; alexandre (`.github`) | MANTIDO (na fase A as duas telas estão no ar; rever na fase B; 582c38b, #120) |
| RD-0403 | baixa | código | render.yaml:68-69 | `ADMIN_USUARIO=admin` igual ao padrão do `servicos/login/server.mjs:354` | T-0022 | alexandre | MANTIDO (a variável fica visível no painel; 582c38b, #120) |
| RD-0404 | baixa | tarefa | .coord/tarefas/T-0022.md:9 | o campo Branch repete a Situação | T-0022 | gerente-projetos | CORRIGIDO (b803e58; d900add, #121) |
| RD-0405 | baixa | tarefa | .coord/tarefas/T-0022.md:5 e .coord/quadro.md:28 | a Situação repete os critérios abertos e a fila | T-0022 | gerente-projetos | CORRIGIDO (b803e58; d900add, #121) |
| RD-0406 | baixa | tarefa | .coord/quadro.md, linha da T-0023 | "depois da fase A" na Situação e na fila | T-0023 | gerente-projetos | CORRIGIDO (9a65146; 16fbe12, #122) |
| RD-0407 | baixa | tarefa | .coord/tarefas/T-0023.md, Situação e Registro | "depois da fase A" na Situação e no Registro | T-0023 | gerente-projetos | CORRIGIDO (9a65146; 16fbe12, #122) |
| RD-0408 | baixa | tarefa | .coord/tarefas/T-0023.md, Registro | o Registro reconta a decisão 10 a | T-0023 | gerente-projetos | CORRIGIDO (9a65146; 16fbe12, #122) |
| RD-0409 | baixa | código (comentário) | site/app.js:793 e site/entrar/comum.js:26 | o comentário sobre o Chrome 153 nos 2 arquivos | T-0022 | web-site | MANTIDO (641b5d9, #123) |
| RD-0410 | baixa | código | site/app.js:794-795 e site/entrar/comum.js:26 | a leitura do corpo do 204 em 2 lugares | T-0022 | web-site | MANTIDO (o `BAP.api` não serve ao `/contar`; 641b5d9, #123) |
| RD-0411 | baixa | tarefa | .coord/tarefas/T-0023.md, Registro | o Registro repete as 3 formas da Especificação | T-0023 | gerente-projetos | CORRIGIDO (a66d915; 16fbe12, #122) |
| RD-0412 | baixa | tarefa | .coord/quadro.md:28 | a Situação "EM ANDAMENTO (fase A no main)" repetia a fila e divergia da `.coord/tarefas/T-0022.md:5` (passa a "EM ANDAMENTO (código no main)") | T-0022 | gerente-projetos | CORRIGIDO (480b157; c1898b1, #124) |
| RD-0413 | baixa | tarefa | .coord/tarefas/T-0022.md:48 | o critério trazia o andamento ("feito; falta a fase B") (passa a "(fase A: #120; fase B)") | T-0022 | gerente-projetos | CORRIGIDO (480b157; c1898b1, #124) |
| RD-0414 | baixa | tarefa | .coord/tarefas/T-0022.md:75 | "fica na B" repetia o Registro das 01:53 e a fila (passa a "(a placa poderia ir na A)") | T-0022 | gerente-projetos | CORRIGIDO (480b157; c1898b1, #124) |
| RD-0415 | baixa | código (comentário) | render.yaml:1-2 | o cabeçalho repetia os comentários de cada serviço (passa a "# Catálogo BAP online no Render: 3 serviços (abaixo). A base .xlsx NÃO vai para o ar.") | T-0022 | alexandre | CORRIGIDO (acc8432; 548ce73, #126) |
| RD-0416 | baixa | rotina | render.yaml, serviço bapajudacatalogo | o estático, que só redireciona, refazia o build a cada push no main (entra `buildFilter: paths: [render.yaml]`) | T-0022 | alexandre | CORRIGIDO (acc8432; 548ce73, #126) |
| RD-0417 | baixa | doc | .claude/agents/web-site.md:16 | o endereço bapajudacatalogo-login.onrender.com repetia o `CLAUDE.md:6` (passa a "endereço no `CLAUDE.md`") | T-0022 | alexandre | CORRIGIDO (acc8432; 548ce73, #126) |
| RD-0418 | baixa | teste | servicos/login/login.test.mjs, teste "serviço fechado com a chave certa" | sem chave, chave vazia, chave quase certa e a chave fora do log repetiam o teste do /interno/codigos e o do log (fica um 401 com a chave errada; a "chave quase certa" vai para o teste do /interno/codigos) | T-0022 | integracao-placas | CORRIGIDO (d3ebb65; d49fc95, #127) |
| RD-0419 | média | código | servicos/placas/contador.mjs:178-180 | o ramo `{produtos:[{c}]}` só servia ao catálogo falso dos testes (fica só `{codigos}`; o falso responde nesse formato) | T-0022 | integracao-placas | CORRIGIDO (d3ebb65; d49fc95, #127) |
| RD-0420 | baixa | código (comentário) | servicos/placas/server.mjs:56 | "um produtos.json falso. Sem as duas variáveis, não há lista e o /contar dá 503." (passa a "um catálogo falso (CATALOGO_URL_TESTE).") | T-0022 | integracao-placas | CORRIGIDO (d3ebb65; d49fc95, #127) |
| RD-0421 | baixa | código (comentário) | servicos/placas/contador.mjs:17 | "o produtos.json tem uns 3 MB" (passa a "teto do corpo da lista de códigos (/interno/codigos)") | T-0022 | integracao-placas | CORRIGIDO (d3ebb65; d49fc95, #127) |
| RD-0422 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0423 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0424 | — | — | — | número não usado (reserva de numeração) | — | — | número não usado (reserva de numeração) |
| RD-0425 | média | doc | catalogo_grafico/LEIA-ME.md:54-56 e :82 | as fotos de `entradas/bap/`, que nenhum gerador em uso lê mais (sai o parágrafo; o `print_cat.py` fica sem "fotos da pasta `bap`") | T-0023 | catalogo-grafico | CORRIGIDO (4a86467; bbf29ad, #128) |
| RD-0426 | baixa | código | catalogo_grafico/gerador/apres_bemol.py:60-61 | o recorte de `.jpg`, morto com as fotos do `pptimg/` (fica o recorte pelo canal alfa) | T-0023 | catalogo-grafico | CORRIGIDO (4a86467; bbf29ad, #128) |
| RD-0427 | baixa | doc | catalogo_grafico/LEIA-ME.md:91 e gerador/LEIA_GERADOR.md:21 | o `jszip` e o tema "BAP" do .pptx nos 2 docs (o tema fica no `LEIA-ME.md`, Observações; o `LEIA_GERADOR.md` aponta para lá) | T-0023 | catalogo-grafico | CORRIGIDO (4a86467; bbf29ad, #128) |
| RD-0428 | média | layout | Lubrificantes PDF e .pptx, cabeçalho das págs. 2 a 10 (`apres_bemol.py:67`, `apres_ppt.js:20`) | a etiqueta "BAP AUTOPARTS" ao lado do logo escuro, que já mostra o "bap" (MC-0010) | T-0023 | catalogo-grafico | ABERTO (T-0025, com simulação; R-20261122-080833-po) |
| RD-0429 | média | layout | A4, pág. 2 | a marca 2 vezes, a garantia 3 vezes e o subtítulo repetindo o texto ao lado | T-0023 | catalogo-grafico | ABERTO (T-0025) |
| RD-0430 | baixa | layout | Lubrificantes, pág. 2 | o cartão do SAC repete a caixa de garantia | T-0023 | catalogo-grafico | ABERTO (T-0025) |
| RD-0431 | média | código | catalogo_grafico/gerador/apres_bemol.py e apres_ppt.js | a apresentação de Lubrificantes em 2 cópias inteiras (PDF e .pptx) | T-0023 | catalogo-grafico | ABERTO (T-0025) |
| RD-0432 | baixa | código | catalogo_grafico/gerador/simulacao_detalhe/ e kitfiltros/kit_v1_32pag.py | cópias históricas do gerador | T-0023 | catalogo-grafico | ABERTO (T-0025) |
| RD-0433 | baixa | código (comentário) | catalogo_grafico/gerador/apres_ppt.js:2 e apply_theme.js:3 | o comentário do `require` e a linha 3 repetiam o cabeçalho do `apply_theme.js` | T-0023 | catalogo-grafico | CORRIGIDO (4a86467; bbf29ad, #128) |
| RD-0434 | média | doc | docs/ux/pareceres/T-0023-simulacao.md, §4 e §5 | a frase do §4 que a nota já diz; o §5 repetia grafia, metadados, domínio e capas do parecer de marca (passa a "ver o parecer de marca") | T-0023 | designer-ux | CORRIGIDO (363281d; d34694f, #129) |
| RD-0435 | média | doc | docs/ux/pareceres/T-0023-entregas.md, abertura, §1, §2 e §4 | o "antes" da legibilidade, a medida do .pptx, o Author dos metadados e a linha do §4 que repetia o alinhamento (cores e tema do .pptx passam a "ver o parecer de marca") | T-0023 | designer-ux | CORRIGIDO (363281d; d34694f, #129) |
| RD-0436 | baixa | doc | docs/ux/pareceres/T-0023-entregas.md, §1 | as págs. "2 a 10" e "3 a 10" sem dizer o que muda em cada (passa a "O logo escuro está nas págs. 2 a 10. Nas págs. 3 a 10, só o cabeçalho muda; […] A pág. 2 muda também no título (§2).") | T-0023 | designer-ux | CORRIGIDO (363281d; d34694f, #129) |
| RD-0437 | média | doc | docs/marca/pareceres/T-0023-simulacao.md, título de 30 pt | a largura, a quebra e a hierarquia do título repetiam o parecer de UX (passa a "ver o parecer de UX […], §3 e §4") | T-0023 | design-de-marca | CORRIGIDO (ce29e41; d856f9b, #130) |
| RD-0438 | média | doc | docs/marca/pareceres/T-0023-entregas.md, grafia | as 3 linhas de cabeçalhos, endereços e `git grep` repetiam a simulação (passam a uma linha "como na simulação") | T-0023 | design-de-marca | CORRIGIDO (ce29e41; d856f9b, #130) |
| RD-0439 | baixa | doc | docs/marca/pareceres/T-0023-entregas.md, §1 e "Observação" | a altura do logo (30 pt × 33 pt) na "Observação" e a linha repetida "MC-0010: fechado." (a altura vai para a célula "Posição"; sai a "Observação") | T-0023 | design-de-marca | CORRIGIDO (ce29e41; d856f9b, #130) |
| RD-0440 | baixa | doc | docs/marca/pareceres/T-0023-simulacao.md × T-0023-entregas.md | a causa da fonte do .pptx contada nos 2 (a simulação passa a "a fonte é Arial desde o gerador, MC-0011"; sai a "Correção ao parecer da simulação") | T-0023 | design-de-marca | CORRIGIDO (ce29e41; d856f9b, #130) |
| RD-0441 | baixa | doc | docs/marca/pareceres/T-0023-entregas.md, §1, célula "Posição" | "fica para o manual "a aprovar", com o tamanho mínimo do logo" repetia o MC-0012 (passa a "(tamanho mínimo: MC-0012)") | T-0023 | design-de-marca | CORRIGIDO (c09f6e7; d856f9b, #130) |
| RD-0442 | baixa | tarefa | .coord/tarefas/T-0022.md:5 e .coord/quadro.md:28 | a Situação "CONCLUÍDA (falta [só] o previews.generation, governança)" repetia a fila 3 e o Registro, e as 2 divergiam (passa a "CONCLUÍDA") | T-0022 | gerente-projetos | CORRIGIDO (e66b8db; 942cf1c, #131) |
| RD-0443 | baixa | tarefa | .coord/tarefas/T-0025.md:5 | a Situação "NOVA (depois da T-0024)" repetia a fila 2 e o Registro (passa a "NOVA") | T-0025 | gerente-projetos | CORRIGIDO (e66b8db; 942cf1c, #131) |
| RD-0444 | baixa | tarefa | .coord/tarefas/T-0025.md:29 | o Registro repetia o Pedido (passa a "R-20261122-080833 (ver o Pedido)") | T-0025 | gerente-projetos | CORRIGIDO (e66b8db; 942cf1c, #131) |
| RD-0445 | baixa | doc | README.md:65 e .coord/tarefas/T-0022.md:85 | a "decisão do Alexandre" sobre o repositório privado repetia o Registro das 03:36 (o README passa a "o repositório vai ficar **privado**; até a troca, ele está **público** (…)") | T-0022 | gerente-projetos | CORRIGIDO (e66b8db; 942cf1c, #131) |
| RD-0446 | baixa | doc | README.md:65 | "nada de segredo nem de dado interno novo no Git" repetia a regra da linha 67 e parecia provisória (passa a "nada de dado interno novo no Git") | T-0022 | gerente-projetos | CORRIGIDO (d7c8e82; 942cf1c, #131) |
| RD-0447 | baixa | tarefa | .coord/tarefas/T-0024.md:13 | o Pedido dizia "~04:00" e o Registro "~03:57" para o mesmo R-20261122-075711 (passa a "~03:57") | T-0024 | gerente-projetos | CORRIGIDO (d7c8e82; 942cf1c, #131) |

## Notas

### T-0022 a T-0025, madrugada de 22/11/2026 (PRs #126 a #131)
- RD-0415 ao RD-0417: corrigidos no acc8432 (head do #126, governança, parte 2, fase B; squash 548ce73).
- RD-0418 ao RD-0421: corrigidos no d3ebb65 (head do #127; squash d49fc95).
- RD-0422 ao RD-0424: número não usado (reserva de numeração).
- RD-0425 ao RD-0427 e RD-0433: corrigidos no 4a86467 (head do #128; squash bbf29ad). As entregas não mudam.
- RD-0428 ao RD-0432: ficam ABERTOS sem segurar o #128 (R-20261122-080833-po, opção a). Vão para a T-0025, com simulação ao Alexandre, depois da T-0024, junto com o MC-0011, o MC-0012 e o título da Linha Moto (R-20261122-080833-po e R-20261122-082826-po). O RD-0429 ao RD-0432 já estavam lá antes da T-0023.
- RD-0434 ao RD-0436: corrigidos no 363281d (head do #129; squash d34694f).
- RD-0437 ao RD-0440: corrigidos no ce29e41; RD-0441, no c09f6e7 (heads do #130; squash d856f9b).
- RD-0442 ao RD-0447: registro do gerente (PR #131). O RD-0442 ao RD-0445 foram corrigidos no e66b8db e o RD-0446 e o RD-0447, no d7c8e82 (squash 942cf1c).
- O #124 (RD-0412 ao RD-0414) entrou no main com o squash c1898b1.
- [SUPOSIÇÃO] As linhas citadas são as do parecer, conferidas no diff do commit de correção; algumas mudaram com a correção. Os textos do RD-0428 ao RD-0432 vêm do recado R-20261122-080737-gerente-projetos (ainda não há commit de correção).
- Relatórios: `T-0022.md`, do §16 ao §18, e `T-0023.md`, do §3 ao §6.

### T-0022 e T-0023, manhã de 22/11/2026 (PRs #120 a #124)
- RD-0401 ao RD-0403: parecer do #120 (governança, parte 2, fase A; squash 582c38b). Os 3 ficam MANTIDOS; o RD-0402 é revisto na fase B (redirecionamento do site atual).
- RD-0404 e RD-0405: corrigidos no b803e58 (head do #121, squash d900add).
- RD-0406 ao RD-0408 e RD-0411: corrigidos no 9a65146 e no a66d915 (heads do #122, squash 16fbe12).
- RD-0409 e RD-0410: parecer do #123 (squash 641b5d9). Ficam MANTIDOS.
- RD-0412 ao RD-0414: corrigidos no 480b157 (PR #124); o squash entra depois.
- [SUPOSIÇÃO] As linhas citadas são as do parecer; as da `.coord/` mudaram com a correção. Os textos vêm do recado do gerente com os achados já decididos.
- Relatórios: `T-0022.md`, do §12 ao §15, e `T-0023.md`.

### T-0022, noite de 21/11 para 22/11/2026 (PRs #110, #111 e #114 a #118)
- RD-0326 e RD-0331 ao RD-0333: CORRIGIDOS, com o #110 (squash 8efb879) e o #111 (squash f9fcc35) no main.
- Serviço de login: o PR #118 (squash 008b9d7) substituiu o #113; os commits de correção estão no `T-0022.md`, §7.
- Telas: o RD-0352 ao RD-0363 entraram no main com o #114 (squash c895acc).
- Bateria: o RD-0364 ao RD-0368 e o RD-0371 ao RD-0374 entraram no main com o #117 (squash 2067077).
- Pareceres: o #115 (squash e48a5f5) não teve achado; o RD-0380 ao RD-0384 e o RD-0400 entraram no main com o #116 (squash 188e720).
- RD-0369: a auditoria da bateria pulou do RD-0368 ao RD-0371, sem achado com esse número.
- RD-0376 ao RD-0379 e RD-0385 ao RD-0399: número não usado (reserva de numeração).
- [SUPOSIÇÃO] Do RD-0350 ao RD-0400, os textos do serviço, das telas e do #116 foram montados pela mensagem e pelo diff dos commits de correção; a origem de cada texto e da severidade está no `T-0022.md`, linha 5.
- Relatório: `T-0022.md`, do §7 ao §11.

### T-0019 e T-0022, noite de 21/11/2026 (PRs #103 a #111 e o serviço de login)
- RD-0293: corrigido pelo PR #109 (squash c9975a5, no main), pela opção "a" do Alexandre (R-20261122-030552-alexandre): simulação no 540b1df e PDFs oficiais no f29da61. O RD-0327 ao RD-0330 saíram no parecer do #109 (head f29da61) e foram corrigidos no 1953f02. Relatório: `T-0019.md`, seção "PR #109".
- RD-0326: corrigido no #110 (7a6ba83) e no #111 (5a344ba). RD-0331 ao RD-0333: corrigidos só no #111 (5a344ba). Os 2 já estão no main (ver a nota acima). Relatório: `T-0022.md`.
- RD-0334 ao RD-0349: auditoria do serviço de login (branch `integracao-placas/T-0022-login`, head 427a73a). O RD-0334 e o RD-0349 ficam MANTIDOS; o RD-0335 ao RD-0348 foram corrigidos no ea90b99 (ver a nota acima). Relatório: `T-0022.md`.
- RD-0284 e RD-0301 ao RD-0325: os pareceres não deixaram relatório no Git. As linhas vêm dos recados do gerente ao po (R-20261122-013101, R-20261122-014756, R-20261122-015345, R-20261122-024743 e R-20261122-025725) e das mensagens dos commits de correção (1649d37 e cceb0b9 no #103; b8fc1a7 no #104; fce3541 no #106; 9060a5c e 41d4b40 no #107; 1b84fbf no #108). [SUPOSIÇÃO] A severidade não ficou guardada: fica "—". O RD-0301 ao RD-0306, o RD-0308, o RD-0309 e o RD-0315 ao RD-0319 ficam sem o texto do achado (o commit só cita o número).
- RD-0307: número não usado (pulado). Nenhum recado nem branch o cita.

### T-0019, PR #99 (21/11/2026, Manaus)
- [SUPOSIÇÃO] O RD-0268 ao RD-0283 são dos pareceres de 21/11/2026, sem relatório no Git, e não estão nesta tabela (o RD-0284 ganhou linha depois, junto com o RD-0301 ao RD-0325). O RD-0285 ao RD-0288 entram pela descrição do commit f52e409, sem severidade versionada.
- Na época do PR #99, o RD-0252 e o RD-0284 ficaram ABERTOS, com dispensa de escopo do po (v27), e não seguraram o PR. O RD-0284 foi corrigido depois, no #104 (b8fc1a7; 9268f42); o RD-0252 segue como está na tabela.
- Relatório: `T-0019.md`.

### Registros de 21/11/2026, tarde (PRs #86 a #90)
- O git confirma o número e a correção de cada achado nos commits do dono (8eaddab, 069a4e6, 9e203da, ab3d6c4, 3aff7e0) e nos squashes do main: 366b55c (#86), be7efe8 (#87), 6819c7b (#88) e 8de7a6d (#90). O #89 (45320cf, produtos.json da v25) não teve achado.
- RD-0259, RD-0265 e RD-0267: corrigidos no PR #90 (T-0017 e T-0019); o RD-0259 é do commit da trava (9e203da), e o RD-0265 e o RD-0267, do 3aff7e0.
- RD-0266 fica MANTIDO: a ordem dupla protege o `_refs_antes` do `lista_aplicacoes_site.py`, que não passa pelo `refs_unicas` (3aff7e0; LIBERADO "RD-0266 mantido, sem segurar" no R-20261121-185939-po).
- Severidades: conferidas pelo gerente-projetos contra os pareceres entregues em 21/11 (não versionados); os recados do po (R-20261121-155407, R-20261121-160331, R-20261121-180352 e R-20261121-185939) só citam os números. O texto de cada linha, e a divisão do RD-0260 ao RD-0264 por item, segue o diff da correção (ab3d6c4).

### Registros de 20/11/2026, noite
- Do RD-0193 ao RD-0235, os achados vêm dos pareceres dos PRs #54 a #70, sem relatório por PR no Git; a coluna Resumo diz só "achado do parecer do #N" quando o recado não guardou o texto.
- O RD-0175 e o RD-0176 do parecer da tag passaram a RD-0215 e RD-0216. [SUPOSIÇÃO] Os números do RD-0174 ao RD-0192, do RD-0195 ao RD-0198 e do RD-0203 ao RD-0206 saíram em pareceres sem linha aqui (o RD-0196 ao RD-0198 corrigidos no #53; o RD-0203 e o RD-0204, no PR do celular).

### Registros de 20/11/2026, fim da noite (PRs #75 a #84)
- RD-0212: fechado pelo #81 (f4636ec). O achado era do parecer do PR #58 (T-0018); a linha antiga dizia T-0017 e "PRs #54 a #59".
- RD-0239 a RD-0244: o git confirma o número, o arquivo e a correção em cada commit (117c2b0, e1e185d, f87ed94, 9f9dbfc), e os squashes 92170da (#75), 7f063a9 (#77) e bfad64e (#78) têm o mesmo conteúdo dos heads aprovados. [SUPOSIÇÃO] A severidade não ficou no git nem nos recados; fica "—".
- RD-0245 a RD-0248: corrigidos antes do merge do #82 (LIBERADO no fb3f533, R-20261121-010800-po).
- RD-0249 a RD-0252: na reconferência dos PDFs, a numeração do RD-0249 ao RD-0251 saiu trocada; vale a do parecer original, a desta tabela.
- RD-0252 mexe no layout do PDF: é "Simule" (o catalogo-grafico mostra antes, e a simulação vai ao Alexandre pelo po).
- Severidades do RD-0212 e do RD-0245 ao RD-0252 e numeração do RD-0249 ao RD-0251: dos pareceres do corretor-redundancias entregues ao gerente-projetos em 21/11/2026, não versionados [SUPOSIÇÃO quanto à fonte versionada].

### Renumerações (20/11/2026)

**RD-0134:** o do PR #34 (o Caminho do `.coord/README.md:40`, citado no título do #48 e no R-20261120-160330-po) fica com o número. O h2 repetido da Sobre (T-0018) passa a **RD-0172**. O `T-0018.md` e a `VARREDURA-2026-11-20.md` já usam o número novo.

**RD-0146:** o da T-0018 (o "Toque em…", citado nos recados do Alexandre) fica com o número. O do reteste do #34 (os comentários do `guarda-merge-lib.mjs`) passa a **RD-0173**.

**RD-0135:**
- Havia dois RD-0135: o da T-0016 (a constante da ponte, PR #34) e o da T-0018 (o comentário do contraste repetido).
- O da T-0016 fica com o número. O da T-0018 passa a **RD-0161**, o primeiro livre depois do RD-0160 da T-0019 (commit fbf5f82). O `T-0018.md` já usa o número novo.

### T-0019 (PR #47, `catalogo-grafico/T-0019-nuvem`)
- A numeração do RD-0152 ao RD-0159 segue o reteste do PR #47, passado pelo gerente em 20/11/2026.
- O RD-0152 ao RD-0156 e o RD-0158 foram corrigidos no 4d76f53; o RD-0160, no fbf5f82.
- O RD-0157 (a frase da página 3 do A4) fica como está, por decisão do Alexandre (R-20261120-155600, item 3).
- O RD-0159 fica MANTIDO: as duas famílias têm a mesma lista, mas saem em páginas diferentes ("Filtros" no A4 e "Filtros de Óleo" no digital).
