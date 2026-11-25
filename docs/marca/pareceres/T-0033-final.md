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
