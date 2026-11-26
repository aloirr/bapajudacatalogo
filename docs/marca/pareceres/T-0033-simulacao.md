# T-0033 · Parecer de marca da simulação: busca por veículo com ano e fim do "Outros veículos e detalhes"

| Campo | Valor |
|---|---|
| Tarefa | T-0033, passo 1: simulação (R-20261124-152047-po, o ano tem que bater; R-20261124-152425-po, o bloco "Outros veículos e detalhes" acaba e vira tabela) |
| Revisor | design-de-marca |
| Data | 25/11/2026 (Manaus) |
| O que foi visto | Tela: `origin/web-site/T-0033-busca-ano` (`51781da`), diff de `site/app.js`, `site/styles.css` e `docs/DADOS_DO_SITE.md`. Os 12 prints de antes e depois (1366 e 390 px) de `testes/prints/T-0033/` em `origin/testes/T-0033-busca-ano` (`09985c3`): janela da BCE3001, busca "BCE3001" em Volkswagen Polo 2026 e a lista de Polo 2026 |
| Base de comparação | `docs/marca/manual.md` (o que foi aprovado; o resto ainda é levantamento "a aprovar") |
| Parecer | Simulação: **LIBERADO COM AJUSTES**. Um achado médio (MC-0035), que recomendo corrigir **antes** de a simulação ir ao Alexandre, porque está na BCE3001, o próprio exemplo dele; dois baixos (MC-0036 e MC-0037) |

A busca, a regra do ano e a leitura da tabela são do `web-site`, do `testes` e do `designer-ux`. Aqui ficam a voz, a
grafia, a marca e a confiança do que o cliente lê.

## 1. O que está certo

- **Fim do bloco:** a janela da BCE3001 (`depois-1366-janela-BCE3001.png`, `depois-390-janela-BCE3001.png`) não tem
  mais "OUTROS VEÍCULOS E DETALHES". Ficou uma tabela só, como o Alexandre pediu. Os anos que estavam só no texto
  agora aparecem na tabela (Escort SW 2000–2002, Escort 1.8 16V 1996–2002, Kadet 1996+). "Aplicação completa" continua
  na ficha impressa, e a frase "Confira sempre a aplicação no veículo antes da compra." continua embaixo da tabela.
- **Cilindradas:** "1.6 8V/16V" vira "1.6 8V / 1.6 16V", e "16v" vira "16V". É a mesma grafia das outras linhas e do
  resto do catálogo.
- **" · ":** é o mesmo separador que o site já usa nos cartões e na lista do celular ("Cilindrada 1.8 16V · Ano
  1997+"). Os prints da BCE3001 não têm uma Versão com detalhe separado por " · ", então essa forma não foi vista em
  tela. [SUPOSIÇÃO: pedir ao `testes` 1 print de um produto com detalhe, ex. AMT7500 "Palio Weekend Adventure" com
  "s/ ABS", para levar junto ao Alexandre.]
- **Busca vazia** (`depois-1366-busca-BCE3001-polo-2026.png`): "Nada para Volkswagen Polo 2026 com essa busca." /
  "Tente outra busca ou veja tudo sem o veículo." / "Tirar o veículo". É a mensagem que o site já tinha, direta e no
  jeito do balconista. O caso que o Alexandre pediu (BCE3001 fora de Polo 2026) aparece assim.
- **Marca, cor e fonte:** o `styles.css` só tira as 2 classes do bloco (`.apl-resto`, `.apl-dono`) e troca o seletor do
  "não quebra". Nenhuma cor, token ou fonte nova. Nos prints, a Poppins carrega (topo, tabela, cartões). Logo, topo e
  rodapé ("BAP AUTOPARTS") iguais.
- **Marca de terceiros:** as montadoras (Ford, Fiat, Volkswagen, Renault, Mercedes-Benz, Chevrolet) aparecem só como
  dado, em texto, na fonte e na cor do catálogo.
- **Preço e estoque:** nenhum.

## 2. Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0035 | Janela da BCE3001, 1366 e 390 px: linha "Ford · **Sedan** · 1.8 16V · **Versailes** · 1997+" (no celular, "**Ford Sedan Versailes**") | voz | manual a aprovar (aplicações: site) e a confiança no catálogo | média | O texto da base é "Escort … Sedan 1.8 16V 1997+, Versailes". "Sedan" é a carroceria do Escort, não um modelo, e "Versailes" é outro veículo. A tabela mostra um "Ford Sedan" que não existe, com outro carro na Versão. Para o mecânico, é a tabela da BAP errando o veículo, no exemplo do próprio Alexandre. Antes → depois, em `juntarNaTabela()` (`site/app.js`, o caminho do "modelo fora do catálogo"): um nome que não é modelo da marca e que é palavra de carroceria ou de versão (Sedan, SW, Hatch, Weekend, Pick-Up, Van, Furgão…) não vira Modelo; vai para a Versão do modelo de antes: "Ford · Escort · 1.8 16V · Sedan · 1997+". "Versailes" vira linha própria ("Ford · Versailes · — · — · —"), sem entrar na Versão de outra. Regra de marca: **na dúvida, a tabela não inventa modelo**. O `testes` confere na amostra de 30 se há outras linhas assim | `web-site` (conferência: `testes`) |
| MC-0036 | Janela da BCE3001, coluna Versão (e o nome em negrito no celular): "mpi" (Fiorino), "todos" (Polo), "(A160/190)" (Classe A) | voz | manual a aprovar (voz: grafia) | baixa | Na tabela, a Versão sai com a caixa e os parênteses do texto cru, ao lado de "Sedan", "Fire" e "Pick-Up". Antes → depois, só na tela (o JSON não muda): sigla de motor em maiúsculas ("mpi" → "MPI", como "MSI" e "16V" no resto do catálogo); 1ª letra maiúscula ("todos" → "Todos"); sem os parênteses em volta da Versão inteira ("(A160/190)" → "A160/190"). O `bonito()` que o site já usa para os nomes pode servir, se não mexer nas siglas | `web-site` |
| MC-0037 | Nomes de modelo da base que agora aparecem como Modelo na tabela: "Versailes" (BCE3001) e "Kadet" (BCE3001, Chevrolet) | voz | manual a aprovar (voz: grafia) | baixa | Antes, esses nomes ficavam no texto corrido do bloco. Agora entram na coluna Modelo, ao lado dos nomes certos. A grafia das montadoras é "Versailles" e "Kadett". Não entra nesta tarefa (a T-0033 não mexe na base): vai para a fila do `catalogo-dados`, com versão nova, LOG_CORRECOES e simulação, junto com a lista das aplicações que o Alexandre já tem | `catalogo-dados` (fila) |

## 3. Para a entrega

- O MC-0035 corrigido e a BCE3001 com print novo (1366 e 390 px) antes de a simulação ir ao Alexandre. Sem a
  correção, ele precisa ver o "Ford Sedan Versailes" apontado no recado.
- O MC-0036 pode entrar junto. O MC-0037 vai para a fila.
- Um print com detalhe na Versão separado por " · " (ver a seção 1).
