# T-0033 · Parecer de marca da versão final: busca por veículo com ano e tabela de aplicação sem o bloco

| Campo | Valor |
|---|---|
| Tarefa | T-0033, versão final (simulação aprovada pelo Alexandre; decisão 3b: a regra do ano vale também na busca digitada) |
| Revisor | design-de-marca |
| Data | 25/11/2026 (Manaus) |
| O que foi visto | Tela: `origin/web-site/T-0033-busca-ano` (`f4e1a0e4dc13198ba1c06860814a9c2562552072`), diff de `site/app.js` desde a simulação (`51781da`): `marcaDe()` (só montadora de algum `ve`, com "General Motors"/"GM" → Chevrolet), `RX_CARROCERIA` e `versaoTela()`. Os prints "depois" de `testes/prints/T-0033/` em `origin/testes/T-0033-busca-ano` (`6fb9139`): janelas BCE3001, JUH70013, JUH70041, ROL0015E, TER5593103, TER5599085, CXD13022 e INT16530; busca BCE3001 em Polo 2026, TER5593103 em Onix 2021, lista de Polo 2026 e a busca digitada "polo 2026". [SUPOSIÇÃO: os prints são da `ac79a65`; a `f4e1a0e` só muda a busca digitada no produto sem `ve`, e a tabela não muda.] |
| Base de comparação | `docs/marca/manual.md` e o parecer da simulação (`docs/marca/pareceres/T-0033-simulacao.md`) |
| Parecer | **LIBERADO COM AJUSTES.** O MC-0035 e o MC-0036 foram atendidos e estão fechados. Há dois achados médios novos (MC-0038 e MC-0039), que recomendo corrigir neste PR; um baixo (MC-0040); e um baixo para a fila (MC-0041). Nenhum segura |

## 1. Achados da simulação

- **MC-0035: fechado.** Na BCE3001, "Sedan" virou a Versão do Escort ("Ford · Escort · 1.8 16V · Sedan · 1997+") e
  "Versailes" ganhou linha própria. A tabela não inventa mais o "Ford Sedan". A regra (`RX_CARROCERIA`: Sedan, SW,
  Hatch, Weekend, Pick-Up…) vale para o catálogo todo. Na CXD13022, "Pick Up" virou a Versão do 147.
- **MC-0036: fechado.** "mpi" → "MPI"; "(A160/190)" → "A160/190"; "todos" sai e a célula fica "—" (Polo). "—" no
  lugar de "Todos" é aceitável: a coluna Versão vazia já quer dizer "todas", e assim não sobra palavra solta.
- **MC-0037** (Versailes, Kadet na base): continua na fila do `catalogo-dados`.

## 2. O que está certo

- **Marcas:** a Marca da tabela é só montadora conhecida, na grafia do catálogo: "General Motors" e "GM" saem como
  **Chevrolet** (TER5593103), "Mercedes" como **Mercedes-Benz**, "Volks" como **Volkswagen**. Texto que não é
  montadora ("Motos", "Fora da Frota Brasileira") não vira marca. Citroën com trema (INT16530) e Alfa Romeo
  (ROL0015E) certos. Todos em texto, na fonte e na cor do catálogo, como dado.
- **Tabela sem o bloco:** em nenhum print aparece "Outros veículos e detalhes". A frase "Confira sempre a aplicação no
  veículo antes da compra." continua.
- **Busca digitada** ("polo 2026", `depois-1366-digitada-polo-2026.png`): a tela é a mesma de antes (chip "“polo 2026”",
  "Resultados", "37 produtos"), sem texto novo. A busca por veículo vazia continua com "Nada para Volkswagen Polo
  2026 com essa busca." e "Tirar o veículo".
- **Cor, fonte e logo:** nenhum token, cor ou fonte nova desde a simulação. A Poppins carrega nos prints. Logo,
  topo e rodapé ("BAP AUTOPARTS") estão iguais.
- **Preço e estoque:** nenhum.

## 3. Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0038 | Janela da ROL0015E, 1366 px (`depois-1366-janela-ROL0015E.png`) | voz | manual a aprovar (aplicações) e a confiança no catálogo | média | Duas coisas, na mesma família do MC-0035. **(1)** Linha "Fiat · Doblo · — · **s/ ABS e Alfa 145.** · —": outro veículo dentro da Versão. A frase vem do "DETALHE: … Doblò s/ ABS e Alfa 145." da base, e o `versaoTela()` só corta o "DETALHE:" quando ele está na mesma célula. **(2)** O trecho comum da linha ("- 1984 a 2014 - 1.0, 1.3, 1.4, 1.5, 1.6 8V (Fiasa / Fire) - Roda Dianteira (Direita / Esquerda)") vale para a lista toda, mas a tabela dá a cilindrada e a Versão "(Fiasa / Fire) - Roda Dianteira (Direita / Esquerda)" **só ao último veículo**, o Alfa Romeo 145/146. Assim o motor Fiat aparece no Alfa, e os Fiat ficam sem ele. Antes → depois, em `juntarNaTabela()`/`versaoTela()` (`site/app.js`): o texto que vem do "DETALHE:" nunca alimenta a Versão nem cria linha; o trecho que fecha uma lista de modelos vale para todos os modelos da lista ou para nenhum (na dúvida, nenhum: "—"), nunca só para o último | `web-site` (conferência na amostra: `testes`) |
| MC-0039 | Janela da TER5593103, 1366 px (`depois-1366-janela-TER5593103.png`) | voz | manual a aprovar (aplicações) e a confiança no catálogo | média | Na base: "Onix - Sedan 01/2020 - 12-2023 Esq Assist Eletrica / Tracker 01-2020 - 12/2023 Esq - Assist Eletrica". A data com hífen ("12-2023", "01-2020") não é lida como mês-ano. Sobram números soltos na Versão ("Sedan - **12** Esq Assist Eletrica", "**01** Esq - Assist Eletrica"), e o Ano do Onix Sedan sai "**2020, 2023**" em vez de "2020–2023": parece que a peça serve só nesses 2 anos. Antes → depois: "mm-aaaa" lido como "mm/aaaa" (a faixa "01/2020 - 12-2023" vira "2020–2023"); Versão "Sedan · Esq · Assist Elétrica" sem os restos de data. A grafia "Eletrica" é da base (ver MC-0041). Se a mesma data com hífen muda o resultado da busca com ano, o `testes` confere | `web-site` (conferência: `testes`) |
| MC-0040 | Coluna Versão: JUH70013 ("s/ ABS · (Inclusive Adventure) Todos lado Roda Dir/Esq."), JUH70041 ("Manual s/ ABS Lado Roda"), TER5593103 ("Esq"), TER5599085 ("Dir.") | voz | manual a aprovar (voz) | baixa | Lado e posição na coluna Versão, quando a Ficha técnica ao lado já diz "Lado: Esquerdo / Direito / Esquerdo e Direito". A Versão fica longa e repete a ficha, com abreviações cruas ("Dir.", "Esq"). Antes → depois: as palavras de lado e posição ("Lado Roda", "Roda Dir/Esq", "Dir.", "Esq", "Roda Dianteira (Direita / Esquerda)") saem da Versão quando a ficha tem Lado ou Posição; sem a ficha, ficam. "(Inclusive Adventure)" → "Inclusive Adventure" (sem os parênteses, como no MC-0036). Pode ir neste PR ou logo depois | `web-site` (o que mostrar: `designer-ux`) |
| MC-0041 | Cartão da busca (`depois-1366-busca-TER5593103-onix-2021.png`): "GENERAL MOTORS - Montana / Onix…"; também "GM - Agile", "GM - Astra" nos cartões da busca "polo 2026" | voz | manual a aprovar (voz: grafia de montadora) | baixa | A tabela diz "Chevrolet", e o resumo do cartão e o texto da aplicação dizem "GENERAL MOTORS" ou "GM", que é o texto cru da base. É **anterior à tarefa**, e a T-0033 não mexe na base. Para a fila, junto do MC-0037: na base, a montadora no texto da aplicação com o nome do catálogo ("CHEVROLET"), com versão nova, LOG_CORRECOES e simulação; também "Eletrica" → "Elétrica" | `catalogo-dados` (fila) |

## 4. Para a entrega

- O MC-0038 e o MC-0039 neste PR, com print novo da ROL0015E e da TER5593103 (1366 e 390 px). São do mesmo tipo do
  MC-0035: a tabela afirma um dado errado com cara de dado certo.
- O MC-0040 neste PR ou logo depois. O MC-0041 e o MC-0037 vão para a fila do `catalogo-dados`.

---

## Rodada 2 (25/11/2026, Manaus): restrição na tabela e aviso "Nenhuma … para …"

| Campo | Valor |
|---|---|
| O que foi visto | `origin/web-site/T-0033-busca-ano` em `28b3b3a87c5cec4fc3e90bfe008eef1116bab6b2`: diff de `site/app.js` e `site/styles.css` contra o `origin/main`. Prints em 1366 e 390 px de AMT7014, AMT7050, AMT7134, CXD13090, JUH70244, POL1678 e da busca "bomba combustivel polo 2026" (scratchpad do `gerente-projetos`, pasta `t33restr/`) |
| Elementos novos | (1) a restrição na Versão, depois de " · " ("Motor Duratec SISTEMA ELETRO HIDRAULICO · Não aplica no Focus 1.6 - Motor Sigma", CXD13090); (2) a Versão "Não serve (exc. Triton)" (AMT7134); (3) a linha "Restrições da aplicação: Somente para o motor EW10J4" abaixo da tabela (POL1678); (4) o aviso "**Nenhuma bomba de combustível para Polo 2026**; veja outras peças do Polo." |
| Parecer | **LIBERADO.** Nenhuma cor, fonte, peso ou token novo; os quatro elementos usam os estilos que já existem. Dois achados baixos de voz (MC-0046 e MC-0047), recomendados e não bloqueiam |

### O que está certo

- **Cor:** a `.restr-fora` (`site/styles.css`, nova) não define cor: herda o `--texto` do cartão, sem hex solto. O aviso
  usa a `.aviso.proximos` dos "mais próximos" (`--texto-2`, frase em negrito), igual à mensagem que já existe.
  Nada de vermelho ou laranja para "Não serve" e "Não aplica": o aviso de restrição não vira alarme, e o `--erro`
  continua só na caixa de erro (decisão 8 a).
- **Tipografia:** Poppins nos prints, nos pesos de sempre. A restrição na Versão tem o peso da célula (400 na tabela de
  1366 px; 600 no título da linha no cartão de 390 px, como o resto do nome do veículo). A linha "Restrições da
  aplicação:" a 13 px, um pouco acima da frase "Confira sempre…" (12,5 px), na mesma família: lê-se como dado da
  aplicação, e não como rodapé. O aviso a 14 px, como o dos "mais próximos".
- **Separador " · ":** é o mesmo do catálogo (Versão "Adventure · c/ ABS…", Ficha "Diant. · Gás"). Sem caractere novo.
- **Tom de voz:** "Não aplica no…", "Somente para o motor…", "exc. …" são o texto da base, como dado; a BAP não reescreve
  restrição técnica, e está certo não reescrever. "Nenhuma bomba de combustível para Polo 2026; veja outras peças do
  Polo." é direto, diz o que falta e o que fazer, no tom do balcão. O feminino ("Nenhuma bomba", "Nenhum filtro") e o
  acento ("combustivel" digitado → "combustível" na tela) estão certos no print.
- **Marca de terceiros:** Ford, Mitsubishi, Mercedes-Benz, Citroën, Volvo só em texto, na fonte e na cor do catálogo.
- **Preço e estoque:** nenhum. Logo, topo e rodapé iguais.

### Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0046 | Aviso da busca, 1366 e 390 px (`busca-bomba-polo-2026-*.png`); `site/app.js:1002` | voz | manual a aprovar (voz: mensagens do site no mesmo padrão) | baixa | A mensagem irmã fecha a frase em negrito com ponto ("**Nenhum produto tem todas as palavras.** Estes são os mais próximos…"); a nova usa ponto e vírgula. Antes → depois: "**Nenhuma bomba de combustível para Polo 2026.** Veja outras peças do Polo." (o ponto entra dentro do `<b>`, e o "veja" vira "Veja") | `web-site` |
| MC-0047 | Janela da AMT7134, 390 px (`AMT7134-390.png`): "**Mitsubishi Triton Não serve (exc. Triton)**"; `site/app.js:1638` (lista do celular junta marca, modelo e versão com espaço) e `:1987` | voz | manual a aprovar (voz: clareza da aplicação) | baixa | No celular, "Não serve" cola no nome do modelo, no mesmo negrito, e parece parte do nome. Na tabela de 1366 px a coluna separa e lê bem. Antes → depois, só quando a Versão começa com "Não serve": "Mitsubishi Triton · Não serve (exc. Triton)", com o " · " que o catálogo já usa para a restrição. O resto da lista ("Volvo S40 V50 / C 70") fica como está. Quem decide a forma na tela é o `designer-ux` | `web-site` (forma: `designer-ux`) |

### Achados da rodada 1

Não reconferidos nesta rodada (os prints são das peças com restrição). Observação para o `testes`: no `dif.txt` da
rodada, a ROL0015E ainda dá a cilindrada "1.0 / 1.3 / 1.4 / 1.5 / 1.6 8V" só ao Alfa Romeo 145 e 146, e não aos Fiat
(MC-0038, parte 2) [SUPOSIÇÃO: o "D" do `dif.txt` é a tela em `28b3b3a`]. Os MC-0038 a MC-0041 seguem como no
item 4.

---

## Situação no 22bc129 (entrou no main pelo #217)

Conferido no código do `main` em `7dd0d1b` (squash do #217, head `22bc129`), `site/app.js`.

- **MC-0046: fechado.** O aviso termina com ponto: "**Nenhuma bomba de combustível para Polo 2026.** Veja outras peças
  do Polo." (`app.js:1002`).
- **MC-0047: fechado.** No celular, " · Não serve" depois do modelo (`app.js:1638`); só "Não serve", sem o parêntese,
  quando a restrição repete o modelo da linha (`app.js:1998`).
- **MC-0039: fechado.** `RX_MES_ANO_HIFEN` lê "01-2020" como 01/2020 (`app.js:180`, `:192`, `:1785`).
- **MC-0038, parte 1: fechado.** O "DETALHE: …" sai da Versão (`versaoSemDetalhe`, `app.js:1795`) e do texto das
  restrições (`aplSemDetalhe`, `:1815`).
- **MC-0038, parte 2 (ROL0015E, cilindrada só no Alfa 145 e 146): na fila da T-0037**, do `catalogo-dados`.
- **MC-0040: fechado no código.** `RX_LADO_POSICAO` tira lado e posição da Versão quando a ficha tem Lado ou Posição
  (`app.js:1797`, `:1826`, `:1845`), e a Versão sai sem parênteses (`:1825`, `:1844`), o que resolve o
  "(Inclusive Adventure)". [SUPOSIÇÃO: não reconferi em print novo da JUH70013, JUH70041, TER5593103 e TER5599085.]
- **MC-0037 e MC-0041: continuam na fila do `catalogo-dados`.**
