# Catálogo de redundâncias (RD-nnnn)

Situação: `ABERTO`, `EM CORREÇÃO`, `CORRIGIDO` ou `MANTIDO`. Os relatórios de cada PR ficam em `T-nnnn.md`, a varredura do site no ar em `VARREDURA-aaaa-mm-dd.md` e as regras em `GUIA.md`, nesta pasta.

O próximo número livre é o **RD-0253**.

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
| RD-0239 | — | código | dados/scripts/base_v21.py (comparar e conferir_valores) | a conta da linha que sobe depois das removidas escrita 2 vezes (vira `subir(r, removidas)` no base_comum) | T-0017 | catalogo-dados | CORRIGIDO (117c2b0; 92170da, #75) |
| RD-0240 | — | código | dados/scripts/base_v21.py, aplicar | o bloco "[PARADO] nada foi gravado" escrito no script (vira `parar(erros)` no base_comum, da v21 em diante) | T-0017 | catalogo-dados | CORRIGIDO (117c2b0; 92170da, #75) |
| RD-0241 | — | texto (base) | base v21, aba LEIA-ME (dados/scripts/base_v21.py, LEIA_ME) | 2 frases repetidas: "na VEICULOS só mudam as 2 células da P14" e "A PRODUTOS tem 3 linhas a menos" | T-0017 | catalogo-dados | CORRIGIDO (117c2b0; 92170da, #75) |
| RD-0242 | — | doc | dados/simulacoes/T-0017-v21/README.md, P14 | o bloco [SUPOSIÇÃO] repetia o KF27 e o CV-F35 da lista logo acima (vira uma frase em cada item) | T-0017 | catalogo-dados | CORRIGIDO (e1e185d; 92170da, #75) |
| RD-0243 | — | código | catalogo_grafico/gerador/print_cat.py; tags.py | o subtítulo do cartão de destaque com as constantes (7 + 16.5 + 2, 7.4/9.6, 2 linhas) e a altura das tags repetidas na medida e no desenho (viram `SB_Y`, `SB_FS`/`SB_LH`, `TAG_LINHAS` e `tags.altura`) | T-0019 | catalogo-grafico | CORRIGIDO (f87ed94; 7f063a9, #77) |
| RD-0244 | — | código | dados/scripts/base_v22.py, conferir_valores | `subir()` com `SEM_REMOVIDAS` vazio, sem efeito (sai; usa `ws.cell(n, c)` direto) | T-0017 | catalogo-dados | CORRIGIDO (9f9dbfc; bfad64e, #78) |
| RD-0245 | média | doc | dados/simulacoes/T-0017-v23/README.md | o README repetia o RESUMO e a seção Arquivos | T-0017 | catalogo-dados | CORRIGIDO (84b9e6f, fb3f533; 2945a37, #82) |
| RD-0246 | baixa | doc | dados/simulacoes/T-0017-v23/RESUMO.md | o trecho da Kia dito 2 vezes | T-0017 | catalogo-dados | CORRIGIDO (84b9e6f; 2945a37, #82) |
| RD-0247 | média | código | dados/scripts/base_v23.py | `vazio`, `conferir_valores` e a leitura da ANTES_DEPOIS copiados da v22 (vão para o base_comum) | T-0017 | catalogo-dados | CORRIGIDO (2165c8c; 2945a37, #82) |
| RD-0248 | baixa | texto (base) | base v23, aba LEIA-ME | a linha "SCE14002: nada muda" à parte; o LEIA-ME ficou +6 | T-0017 | catalogo-dados | CORRIGIDO (2165c8c; 2945a37, #82) |
| RD-0249 | média | doc | catalogo_grafico/simulacoes/T-0019-pdf-v23/README.md | o antes e o depois repetidos, a Linha Moto 2 vezes e "Nenhum script mudou" contra o 2fe2940 | T-0019 | catalogo-grafico | CORRIGIDO (1aa3f82, #84) |
| RD-0250 | baixa | doc | catalogo_grafico/LEIA-ME.md:85 | o histórico da rodada dentro do guia | T-0019 | catalogo-grafico | CORRIGIDO (1aa3f82, #84) |
| RD-0251 | baixa | código (docstring de teste) | catalogo_grafico/gerador/teste_fraga_complementos.py | a docstring repetia a regra do "DE" e o comando | T-0019 | catalogo-grafico | CORRIGIDO (1aa3f82, #84) |
| RD-0252 | média | texto (PDF) | A4 p21 e Digital p110, SCE14002 (detalhe.essencial; catalogo_grafico/gerador/print_cat.py:261) | o subtítulo do cartão repete a aplicação e estica a faixa dos 5 cartões; já existia antes da v23 | T-0019 | catalogo-grafico | ABERTO (Simule; fora da rodada R-20261120-235000-alexandre, que não muda layout) |

## Notas

### Registros de 20/11/2026, noite
- Do RD-0193 ao RD-0235, os achados vêm dos pareceres dos PRs #54 a #70, sem relatório por PR no Git; a coluna Resumo diz só "achado do parecer do #N" quando o recado não guardou o texto.
- O RD-0175 e o RD-0176 do parecer da tag passaram a RD-0215 e RD-0216. [SUPOSIÇÃO] Os números do RD-0174 ao RD-0192, do RD-0195 ao RD-0198 e do RD-0203 ao RD-0206 saíram em pareceres sem linha aqui (o RD-0196 ao RD-0198 corrigidos no #53; o RD-0203 e o RD-0204, no PR do celular).

### Registros de 20/11/2026, fim da noite (PRs #75 a #84)
- RD-0212: fechado pelo #81 (f4636ec). O achado era do parecer do PR #58 (T-0018); a linha antiga dizia T-0017 e "PRs #54 a #59".
- RD-0239 a RD-0244: o git confirma o número, o arquivo e a correção em cada commit (117c2b0, e1e185d, f87ed94, 9f9dbfc), e os squashes 92170da (#75), 7f063a9 (#77) e bfad64e (#78) têm o mesmo conteúdo dos heads aprovados. [SUPOSIÇÃO] A severidade não ficou no git nem nos recados; fica "—".
- RD-0245 a RD-0248: corrigidos antes do merge do #82 (LIBERADO no fb3f533, R-20261121-010800-po).
- RD-0249 a RD-0252: o PR #84 (head 1aa3f82) ainda está aberto; os CORRIGIDO valem pelo commit da branch até o merge. Na reconferência dos PDFs, a numeração do RD-0249 ao RD-0251 saiu trocada; vale a do parecer original, a desta tabela.
- RD-0252 mexe no layout do PDF: é "Simule" (o catalogo-grafico mostra antes, e a simulação vai ao Alexandre pelo po).

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
