# Varredura do site no ar pelas regras R1 a R4 · 20/11/2026

- **Pedido:** R-20261120-155430-alexandre ("passe essas regras para o corretor de redundancia"). As regras estão no `GUIA.md`.
- **Data:** 20/11/2026, ~16h10 (Manaus). **Auditor:** `corretor-redundancias`.
- **Site:** https://bapajudacatalogo.onrender.com. O `app.js` no ar é igual ao do `origin/main` f91d671 (o md5 bate).
- **Telas:** início, busca "amortecedor", busca sem resultado ("zzzqqq"), todos os produtos, produto AMT7000 e Sobre, em 1366 e 390 px (Playwright, Chrome).
- **Serviço de placas:** interceptado (a resposta é 503), então nenhuma chamada saiu.
  - No RD-0164, a resposta do `/mais-vistos` foi **simulada só no navegador** (8 códigos e total 40) para mostrar o bloco "Pesquisas recentes". Sem a simulação, o bloco sai como "Destaques".
- **Prints:** `/tmp/claude-0/-home-user/903b747d-fcfb-5a75-b107-affc4b1c6eae/scratchpad/varredura-R/`. São temporários e ficam fora do Git: um recorte por RD (`RD-nnnn-*-1366.png` e `-390.png`) e as telas inteiras (`<tela>-1366.png`, `<tela>-390.png` e `-dobra`).
- Toda proposta abaixo muda texto que o Alexandre vê, então vai a ele antes, pelo `po`, com os prints de 1366 e 390 px.
- [SUPOSIÇÃO] O catálogo do RD-0001 ao RD-0119 não está no Git. Algum dos casos abaixo pode já ter sido decidido nessas rodadas. Se for o caso, o `po` avisa e o achado vira MANTIDO.

## 1. Já em correção no PR da aplicação (só marcados)

| ID | Regra | Onde | Texto | Situação |
|---|---|---|---|---|
| RD-0162 | R1 | início, faixa (`site/app.js:828`, `.mf-selo`) | etiqueta "BAP AUTO PARTS" logo abaixo do cabeçalho com o logo | EM CORREÇÃO (PR da aplicação; R-20261120-155400, item 1) |
| RD-0163 | R2 | início, faixa (`site/app.js:831`) | "Busque por código, referência, veículo ou placa." acima dos campos "Código, descrição ou aplicação" e "Placa do veículo" | EM CORREÇÃO (PR da aplicação; R-20261120-155430 e R-20261120-155600, item 2) |
| RD-0146 | R3 | início, "Navegue por sistema" | "Toque em um sistema para ver todos os produtos dele." | EM CORREÇÃO (PR da aplicação). Não está no ar: o texto só existe no PR #46 (head 43e76e2), ainda aberto. |

## 2. Casos novos pelas R1 a R4

### RD-0164 · alta · R4 · início, bloco da lista (`site/app.js:804-805`)
- **O que se contradiz:** "Pesquisas recentes" × "As mais pesquisadas nos últimos 7 dias". O título fala de recência, e o subtítulo, de frequência.
  - O dado não é nenhum dos dois: o contador soma as **aberturas de produto** (`contarAbertura`, `/contar` e `/mais-vistos`), não as pesquisas.
  - O PR #46 troca só o subtítulo, para "As mais abertas nos últimos 7 dias". O título continua "Pesquisas recentes", e esse é justamente o par que o Alexandre deu como exemplo da R4.
  - Hoje o bloco sai como "Destaques", porque o contador ainda não chegou ao mínimo de 20 aberturas. O texto já está no ar e aparece sozinho quando o mínimo chegar.
- **Impacto:** leitura. O cliente acha que vê o que pesquisou há pouco, mas é o que todos mais abriram.
- **Proposta (o título e o subtítulo medem a mesma coisa):**
  - antes: `<h2>Pesquisas recentes</h2>` · `<p class="sub">As mais pesquisadas nos últimos 7 dias</p>`
  - depois: `<h2>Mais vistas</h2>` · `<p class="sub">Peças mais abertas nos últimos 7 dias</p>`
- **Dono:** `web-site`. Se o PR da aplicação já revir o título, o achado fecha com o reteste.
- **Prints:** `RD-0164-Pesquisas-recentes-simulado-1366.png` e `-390.png`.

### RD-0165 · média · R1 · Sobre, topo (`site/app.js:1487`, `.sb-selo`)
- **O que se repete:** a etiqueta "A BAP" acima do h1 "Tradição e inovação em componentes de qualidade", logo abaixo do cabeçalho com o logo `bap`. O menu ativo ("Sobre a BAP") também já diz onde o cliente está.
  - É o mesmo caso do "BAP AUTO PARTS" da home (RD-0162). Sai uma etiqueta e fica a outra.
- **Impacto:** leitura (3 marcas da empresa na mesma dobra).
- **Proposta:**
  - antes: `<span class="sb-selo">A BAP</span>`
  - depois: sai a linha. Se a etiqueta sair também da home, a regra `.mf-selo, .sb-selo` do `styles.css` fica sem uso e sai junto.
- **Dono:** `web-site`.
- **Prints:** `RD-0165-selo-A-BAP-1366.png` e `-390.png`.

### RD-0166 · média · R2 · Sobre, chamada final (`site/app.js:1509`)
- **O que se repete:** "Acesse nosso catálogo completo." logo acima do botão "Ver o catálogo". A frase só repete o rótulo do botão.
- **Impacto:** leitura.
- **Proposta:**
  - antes: `<div><h2>Quer conhecer nossas soluções?</h2><p>Acesse nosso catálogo completo.</p></div>`
  - depois: `<div><h2>Quer conhecer nossas soluções?</h2></div>`
- **Dono:** `web-site`.
- **Observação:** se a frase for do texto aprovado do PDF Empresa (como no RD-0134), a decisão é do `po` com o Alexandre. Até lá, fica `manter?`.
- **Prints:** `RD-0166-CTA-Acesse-1366.png` e `-390.png`.

### RD-0167 · média · R3 · produto, abaixo da foto (`site/app.js:1336`, `.foto-dica`)
- **O que sobra:** "Clique na foto para ampliar." Ensina a usar e sai igual no celular, onde não se clica, se toca.
- **Impacto:** leitura. No celular, empurra para baixo o "Copiar código" e o "Leve também".
- **Proposta:**
  - antes: `<p class="foto-dica nao-imprime">Clique na foto para ampliar.</p>`
  - depois: sai a linha, e a regra `.foto-dica` do CSS sai junto.
  - Se o `designer-ux` quiser um sinal de que a foto amplia, entra um ícone de lupa no canto da foto, com `aria-label="Ampliar foto"`. Não entra texto.
- **Dono:** `web-site`. O `designer-ux` decide o sinal.
- **Prints:** `RD-0167-Clique-na-foto-1366.png` e `-390.png`.

### RD-0168 · média · R3 (título que repete) · busca, topo do resultado (`site/app.js:879`)
- **O que se repete:** o termo "amortecedor" aparece 3 vezes na dobra: no campo de busca, na etiqueta "“amortecedor” ✕" e no h1 "Resultados para “amortecedor”". No celular (390 px), o campo, a etiqueta e o h1 ficam um embaixo do outro.
- **Impacto:** leitura. No celular, a repetição empurra o primeiro cartão para baixo.
- **Proposta:** o termo fica no campo e na etiqueta, que é onde o cliente o tira.
  - antes: `<h1>${desc.length ? "Resultados para " + esc(desc.join(" · ")) : "Todos os produtos"}</h1>`
  - depois: `<h1>${desc.length ? "Resultados" : "Todos os produtos"}</h1>`
- **Dono:** `web-site`.
- **Prints:** `RD-0168-Resultados-para-1366.png` e `-390.png`.

## 3. Fora das R1 a R4 (checklist A, achados na mesma varredura)

### RD-0169 · baixa · estado vazio duplicado · busca sem resultado (`site/app.js:880` e `:903`)
- **O que se repete:** "0 produtos" e "Nenhum produto encontrado" juntos. Estado vazio tem uma frase só.
- **Proposta:** com 0 resultados, o total não aparece e a frase do vazio fica sozinha.
  - antes: `<span class="total" aria-live="polite">${nProd(todos.length)}</span>`
  - depois: `<span class="total" aria-live="polite">${todos.length ? nProd(todos.length) : ""}</span>`
- **Dono:** `web-site`. O `testes` confere que o leitor de tela ainda anuncia o vazio pelo `.vazio`.
- **Prints:** `RD-0169-vazio-0-produtos-1366.png` e `-390.png`.

### RD-0170 · baixa · aviso repetido · produto (`site/app.js:1326` e `site/index.html:34`) · `manter?`
- **O que se repete:** na mesma tela, "Confira sempre a aplicação no veículo antes da compra." (no aviso da seção Aplicação) e "Confira sempre a aplicação antes da compra." (no rodapé).
- **Por que `manter?`:** é um aviso de segurança da compra. O da seção fica onde o cliente confere a aplicação, e o do rodapé vale para todas as telas.
- **Proposta (se o `po` decidir tirar a repetição):** o da seção Aplicação fica. Na página do produto, o rodapé mostra só "As fotos são ilustrativas.".
- **Dono:** `web-site`. A decisão é do `po`.
- **Prints:** `RD-0170-Confira-aplicacao-1366.png` e `-390.png` (página inteira).

### RD-0171 · média · uma informação, um lugar · produto, selos abaixo do nome (`site/app.js:1342`)
- **O que se repete:** os selos "Peças · Suspensão · Amortecedores e Kits · Leve · Amortecedores" ficam logo abaixo da trilha "Início › Suspensão › Amortecedores e Kits › AMT7000".
  - Repetem o sistema e a família da trilha (2 de 5 selos).
  - "Amortecedores" (o PRODUTO) é quase igual à família "Amortecedores e Kits".
  - No celular, os selos ocupam 3 linhas acima do "Copiar código".
- **Proposta:** ficam só os selos que a trilha não mostra.
  - antes: `${[p.ca, p.si, p.fa, p.li].filter(Boolean).map(...)}${p.p ? `<span class="selo">${esc(p.p)}</span>` : ""}`
  - depois: `${[p.ca, p.li].filter(Boolean).map(...)}`, o que dá "Peças · Leve".
  - O sistema e a família seguem na trilha, onde são links.
- **Dono:** `web-site`. O `designer-ux` confirma que o selo verde do sistema não tem outro uso.
- **Prints:** `RD-0171-selos-trilha-1366.png` e `-390.png`.

## 4. Conferido sem achado

- **R1:** "CATÁLOGO ONLINE" ao lado do logo é o nome do produto, não o da empresa, e fica. O "© 2026 - BAP AUTO PARTS" do rodapé é texto legal e fica.
- **R2:** na busca, os rótulos "Código, descrição ou aplicação" e "Placa do veículo" não têm frase de instrução acima.
- **R3 e R4:** "Destaques" × "Peças com foto e ficha completa" fica: o subtítulo diz o critério da lista e não contradiz o título. A Sobre segue o RD-0134 (MANTIDO).
- **Redundância útil (fica):** o código no selo da foto do cartão e no texto do cartão para o leitor de tela; o "do AMT7000" escondido no "+ Detalhes"; o "nenhuma placa consultada" escondido.

## Resultado

```
Redundâncias varredura no ar (R1 a R4) · 20/11/2026 16:10 (Manaus) · VOLTA PARA AJUSTE
- RD-0162 R1 início etiqueta "BAP AUTO PARTS" (dono web-site) · EM CORREÇÃO (PR da aplicação)
- RD-0163 R2 início "Busque por código, referência, veículo ou placa." (dono web-site) · EM CORREÇÃO (PR da aplicação)
- RD-0146 R3 "Toque em um sistema…" (dono web-site) · EM CORREÇÃO (PR da aplicação; não está no ar)
- RD-0164 alta R4 site/app.js:804-805 "Pesquisas recentes" × "As mais pesquisadas…", e o dado são aberturas (dono web-site) · ABERTO
- RD-0165 média R1 site/app.js:1487 Sobre, etiqueta "A BAP" (dono web-site) · ABERTO
- RD-0166 média R2 site/app.js:1509 Sobre, "Acesse nosso catálogo completo." sobre o "Ver o catálogo" (dono web-site) · ABERTO, manter? se for texto do PDF Empresa
- RD-0167 média R3 site/app.js:1336 produto, "Clique na foto para ampliar." (dono web-site) · ABERTO
- RD-0168 média R3 site/app.js:879 busca, "Resultados para “termo”" repete o campo e a etiqueta (dono web-site) · ABERTO
- RD-0169 baixa site/app.js:880,903 busca vazia, "0 produtos" e "Nenhum produto encontrado" (dono web-site) · ABERTO
- RD-0170 baixa site/app.js:1326 + index.html:34 "Confira sempre a aplicação…" 2 vezes no produto (dono web-site) · manter? (decisão do po)
- RD-0171 média site/app.js:1342 produto, selos repetem a trilha (dono web-site) · ABERTO
- OK: "CATÁLOGO ONLINE", rodapé legal, rótulos da busca, "Destaques" × "Peças com foto e ficha completa"
```
