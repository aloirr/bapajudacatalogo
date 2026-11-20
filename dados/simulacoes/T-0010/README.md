# T-0010 · Pastilhas com dois códigos (PAFnnnn × PAF.nnnn): SIMULAÇÃO

Simulação de 20/11/2026 (Manaus), feita pelo `catalogo-dados`. **Nada foi gravado na base, em `dados/versoes/` nem no `site/`.**
A base fica como está até o "aprovado" do Alexandre. Depois do aprovado, a mudança segue a regra 4 do CLAUDE.md:
nova versão, LOG_CORRECOES e campos digitados conservados.

- Tarefa: R-20261120-095221-alexandre, opção 4a.
- **Regra:** R-20261120-100733-alexandre, item 2: *"É que internamente trocamos de fabricante. mas é o mesmo produto. acredito que o melhor seja unificar aparecer os dois."*
  - um produto por par no site, na ficha do PAFnnnn;
  - o código PAF.nnnn aparece na ficha e a busca acha;
  - o link de um código não abre a página de outro produto;
  - na base, o PAF.nnnn continua ATIVO.
- **PAF0116:** R-20261120-100937-alexandre, item 2, *"2) a"*. A pastilha é dianteira e traseira e entra na unificação com os outros 102 pares.
- **Base medida:** a **v15**, do `main` em 56d313c (PR #11, T-0007 + T-0009). O sha256 da base é o mesmo antes e depois da simulação: `4ed41ae25bd5fd530a74e6e3d13877fef3a4e3147cb5221480c0394d93ca5f33`.
  - A simulação foi feita sobre a v14 (sha256 `0309fc8f…ddc37`).
  - O "antes" das 209 células é **o mesmo na v14 e na v15**: o script confere isso com `--antes-de dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v14.xlsx`. A v15 não mexeu em nenhuma delas.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `Simulacao_T-0010_PAF.xlsx` | Abas `PARES` (os 103 pares, campo a campo, com o antes e o depois e o efeito no site), `ANTES_DEPOIS` (cada célula que muda), `RESUMO` (A, B, C, totais e as provas do JSON) e `LOG_CORRECOES_PREVISTO` (uma linha por código, com o cabeçalho do LOG real) |
| `simular_T-0010.py` | O script que refaz tudo. Só lê a base e o `produtos.json`. As cópias e os JSON simulados vão para um diretório temporário: `python3 dados/simulacoes/T-0010/simular_T-0010.py --trabalho <dir_temporario> --antes-de dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v14.xlsx`. A planilha só é gravada depois de todas as conferências: se uma falhar, ela não é gravada |
| `prints/` | 32 prints do site, antes e depois, em 1366 e 390 px (ver "Prints") |

## Como os dois códigos ficam ligados

**O formato da base NÃO muda.** Não entra coluna nem aba nova, e as 5 primeiras colunas ficam na mesma ordem. Não é preciso avisar a BAP Central sobre formato.

- **A ligação:** `; BAP: PAF.nnnn` entra no fim das `REFERENCIAS_CRUZADAS` de cada PAFnnnn. Nenhuma referência é tirada.
  - Exemplo do PAF0013: `FRAS-LE: PD/13-NA; SYL: 1404` → `FRAS-LE: PD/13-NA; SYL: 1404; BAP: PAF.0013`.
  - No `produtos.json`, a ficha ganha a referência `{"m": "BAP", "c": "PAF.0013"}`.
- **Por que nas referências, e não num campo novo:**
  - o site já mostra as referências na ficha e já busca por elas, então a ligação aparece sem mexer no `site/` nem no `gerar_site.py`;
  - a base já guarda código da própria BAP nas referências: "BAPTA PN" aparece em 170 produtos;
  - o BAP Ajuda e a BAP Central leem a coluna 4 (REFERENCIAS_CRUZADAS) e também passam a ver o outro código;
  - um campo novo mudaria o formato da base, pediria o aviso à BAP Central e uma mudança do `web-site` no gerador e na ficha.
- **O que não vai para a ficha:** nada dos DADOS_ADICIONAIS do PAF.nnnn. O código interno do ERP, as quantidades e os avisos de herança ficam só na base.
  - A ficha do PAFnnnn continua a ler só os DADOS_ADICIONAIS dele, pela lista branca `FICHA`.
  - O código de barras já era igual nos dois.
- Se o Alexandre preferir um campo próprio (ex.: `CODIGO_ANTERIOR`), dá para trocar depois. Nesse caso, é **mudança de formato**, com aviso à BAP Central.

## O que a conferência achou

São **103 pares**: 98 `PAF.9999` e 5 `PAF.9999S` (0498S, 0652S, 1439S, 1440S, 1490S). Todo PAF.nnnn tem o seu PAFnnnn, e não há outra colisão de código na base.

| Campo | O que deu nos 103 pares |
|---|---|
| Descrição | Diferente em todos. O PAFnnnn diz só "PASTILHA DE FREIO". O PAF.nnnn traz a descrição do ERP: "JOGO PASTILHA FREIO DIANTEIRO" (ou TRASEIRO), e 10 deles têm o prefixo "(980 - PAF.nnnn) -". Em todos, a posição dessa descrição é compatível com a POSICAO do PAFnnnn, fora o PAF0116 (ver abaixo). No PAF0013, o ERP diz só DIANTEIRO e a POSICAO diz DIANTEIRO E TRASEIRO, porque a aplicação do catálogo tem itens dianteiros e traseiros |
| Aplicação | Igual em 91. Em 12, a do PAF.nnnn é o começo da do PAFnnnn: o que falta é o complemento Fraga de 13/11, que só entrou no PAFnnnn. Nenhuma aplicação diferente |
| Referências | Iguais em 18. Em 85, o PAFnnnn tem referências a mais (as do Fraga, como ECOPADS). **Nenhuma referência existe só no PAF.nnnn** |
| Código de barras | Igual nos 103 |
| STATUS_CADASTRO e NO_CATALOGO_DIGITAL | ATIVO e SIM nos 206 códigos |
| Campos de venda | Só o PAFnnnn tem: OFERECA_JUNTO (103), DIFERENCIAL (7) e ITEM_PARECIDO (2). Outros itens apontam 63 vezes para um PAFnnnn e nenhuma vez para um PAF.nnnn |
| Foto | Nenhum dos 206 tem foto em `site/img` |

## Proposta

| Destino | Qtd | O que muda |
|---|---|---|
| **A** · mesmo produto: unificar e mostrar os dois códigos | **103** | No PAFnnnn, `REFERENCIAS_CRUZADAS` ganha "; BAP: PAF.nnnn" no fim. O PAF.nnnn sai do site (`NO_CATALOGO_DIGITAL` SIM → NÃO) e fica na base, ATIVO, com todos os campos como estão |
| &nbsp;&nbsp;PAF0054 · **item à parte** | 1 | `DETALHE_CATALOGO`: "Diant." → "Diant. · Sistema Vargas TRW pequena". A informação está só na descrição do PAF.0054 e sairia do site com ele. **O Alexandre aprova ou tira este item sozinho, sem mexer no resto** |
| &nbsp;&nbsp;PAF0116 | 1 | `POSICAO`: "DIANTEIRO" → "DIANTEIRO E TRASEIRO". `DETALHE_CATALOGO`: "Diant." → "Diant./Tras.". É a decisão do Alexandre. A DESCRICAO não muda |
| **B** · produtos diferentes | **0** | — |
| **C** · dúvida | **0** | — |

**Por que fica o PAFnnnn:**
- é o código do catálogo impresso e digital;
- tem tudo o que o PAF.nnnn tem, e mais;
- é o código para onde os outros itens apontam.

**Células que mudam na base: 209.**
- 103 na NO_CATALOGO_DIGITAL;
- 103 nas REFERENCIAS_CRUZADAS;
- 2 no DETALHE_CATALOGO (PAF0054 e PAF0116);
- 1 na POSICAO (PAF0116).

Nenhuma outra coluna muda e nenhum campo é apagado. A comparação célula a célula da cópia simulada com a base deu só essas 209, todas na aba PRODUTOS, com as mesmas abas, cabeçalhos e número de linhas.

**LOG_CORRECOES: 206 linhas, uma por código.**
- 103 `NO_CATALOGO_DIGITAL`, uma para cada PAF.nnnn;
- 103 `CODIGO_UNIFICADO`, uma para cada PAFnnnn. As linhas do PAF0054 e do PAF0116 descrevem também as outras células que mudam.

## Efeito no `produtos.json`

Medido com cópias da base e uma cópia do `gerar_site.py`, todas no scratchpad. O `site/` do repositório não foi tocado.

| | Hoje (v15) | Com a T-0010 (sobre a v15) |
|---|---|---|
| Produtos no site (`total`) | **4.522** | **4.419** (−103 PAF.nnnn) |
| Códigos que colidem no site (`normCod` do `app.js`) | 103 | **0** |
| Fichas de PAFnnnn com "BAP PAF.nnnn" nas referências | 0 | **103** |
| Valores dos DADOS_ADICIONAIS do PAF.nnnn na ficha do PAFnnnn | — | **0** |
| Dado interno no JSON (palavras da `TRAVA`, código interno do ERP) | 0 | **0** |
| Produtos com foto | 1.413 | 1.413 |
| Fichas que mudam (fora as que saem) | — | 103 PAFnnnn: só a referência nova. No PAF0054 muda também a chave `de`, no PAF0116 também `po` e `de` |

- Sobre a v14, a primeira medição deu 4.679 → 4.576, com as mesmas 209 células e o mesmo efeito nas fichas.
- O `site/data/produtos.json` do `main` ainda está com 4.679 produtos: não foi gerado de novo depois da v15. É assunto do `web-site`; com a v15 ele vai a 4.522.

Como o script confere:
- a última referência de cada uma das 103 fichas é `{"m": "BAP", "c": "PAF.nnnn"}`, e as anteriores ficam iguais;
- nenhuma outra chave muda, fora as do PAF0054 e do PAF0116;
- valor a valor, nenhum valor dos DADOS_ADICIONAIS do PAF.nnnn aparece na ficha do PAFnnnn, fora o código de barras, que já era igual. Os valores não são copiados nem impressos;
- o JSON não tem palavra da `TRAVA`, código interno do ERP nem aviso de herança;
- o gerador da cópia roda sem `[PARADO]`.

No site:
- **Hoje:** o PAF.nnnn vem depois no JSON e apaga o PAFnnnn no `POR_COD`. A página do PAF0013 abre o PAF.0013, sem as referências do Fraga e sem os campos de venda, e a busca mostra dois cartões.
- **Depois:**
  - um cartão por par, o PAFnnnn com todos os dados e "BAP PAF.nnnn" nas referências cruzadas;
  - a busca por qualquer um dos dois códigos acha só ele;
  - `#/produto/PAF.0013` abre o PAF0013, que é o mesmo produto. Nenhum link abre outro produto, e o código não colide com nenhum outro.
- **Para o `web-site`:** conferir com prints a ficha (referência "BAP PAF.nnnn"), a busca pelos dois códigos e o link `#/produto/PAF.nnnn`. O site não precisa mudar.
- **Para o `testes`:** depois do aprovado, saem do `testes/conhecidos.json` as 103 chaves `colide:` da T-0010.

## Cruzamento com a T-0007 (+ T-0009)

**Nenhum código cruza.** A T-0007 mexeu nos 154 códigos só de número, nas 3 Cruzetas ("Veículo", "HYUNDAI", "KIA MOTORS"), no TAX10116, no CRU100 e no TER556556. Nenhum deles é PAF; conferido também na planilha da T-0007: 160 códigos, nenhum PAF.

A T-0007 já está na v15 (PR #11). As duas se somam: **4.679 − 157 − 103 = 4.419** produtos no site. A T-0010, depois do aprovado, vira a **v16**.

## Prints

Feitos pelo `testes` em `prints/`, nas larguras 1366 e 390 px. O "antes" é o site de hoje; o "depois" é o JSON simulado. Os prints foram feitos sobre a v14, por isso o rodapé do depois mostra 4.576 produtos; sobre a v15, o número é 4.419.

| Tela | Antes | Depois |
|---|---|---|
| Início | `antes-inicio-1366.png`, `antes-inicio-390.png` | `depois-inicio-1366.png`, `depois-inicio-390.png` |
| Ficha `#/produto/PAF0013` | `antes-produto-PAF0013-1366.png`, `antes-produto-PAF0013-390.png` | `depois-produto-PAF0013-1366.png`, `depois-produto-PAF0013-390.png` |
| Link `#/produto/PAF.0013` | `antes-produto-PAF.0013-1366.png`, `antes-produto-PAF.0013-390.png` | `depois-produto-PAF.0013-1366.png`, `depois-produto-PAF.0013-390.png` |
| Ficha `#/produto/PAF0116` | `antes-produto-PAF0116-1366.png`, `antes-produto-PAF0116-390.png` | `depois-produto-PAF0116-1366.png`, `depois-produto-PAF0116-390.png` |
| Busca por código "PAF0013" | `antes-cod-PAF0013-1366.png`, `antes-cod-PAF0013-390.png` | `depois-cod-PAF0013-1366.png`, `depois-cod-PAF0013-390.png` |
| Busca por código "PAF.0013" | `antes-cod-PAF.0013-1366.png`, `antes-cod-PAF.0013-390.png` | `depois-cod-PAF.0013-1366.png`, `depois-cod-PAF.0013-390.png` |
| Busca por código "PAF 0013" (com espaço) | `antes-cod-PAF_espaco_0013-1366.png`, `antes-cod-PAF_espaco_0013-390.png` | `depois-cod-PAF_espaco_0013-1366.png`, `depois-cod-PAF_espaco_0013-390.png` |
| Busca geral "PAF.0013" | `antes-geral-PAF.0013-1366.png`, `antes-geral-PAF.0013-390.png` | `depois-geral-PAF.0013-1366.png`, `depois-geral-PAF.0013-390.png` |

## Catálogo PDF (`catalogo_grafico/`)

- **O "BAP: PAF.nnnn" não aparece no catálogo PDF impresso.** O `catalogo_grafico/gerador/montar.py:83` (`refs_from_base`) descarta as referências de marca "bap". O "aparecer os dois" vale para o site.
  - Se o Alexandre quiser os dois códigos no PDF, isso é uma tarefa do `catalogo-grafico`.

## LOG_CORRECOES previsto (exemplos; a lista completa está na planilha)

- `NO_CATALOGO_DIGITAL | PRODUTOS | PAF.0013 | PAF0013 | NO_CATALOGO_DIGITAL SIM -> NÃO: mesmo produto do PAF0013 (troca interna de fabricante; código com ponto do ERP, aplicação herdada do PAF0013 na v3). No site fica o PAF0013, com 'BAP: PAF.0013' nas referências. Continua ATIVO; STATUS_CADASTRO e os outros campos sem mudança; nenhum campo apagado. T-0010, 20/11/2026`
- `CODIGO_UNIFICADO | PRODUTOS | PAF0013 | PAF.0013 | REFERENCIAS_CRUZADAS: 'BAP: PAF.0013' acrescentado no fim (o PAF.0013 é o mesmo produto, código com ponto do ERP, e sai do site); nenhuma referência tirada. T-0010, 20/11/2026`
- `CODIGO_UNIFICADO | PRODUTOS | PAF0116 | PAF.0116 | REFERENCIAS_CRUZADAS: 'BAP: PAF.0116' acrescentado no fim (...). POSICAO "DIANTEIRO" -> "DIANTEIRO E TRASEIRO" (decisão do Alexandre, R-20261120-100937-alexandre: ...). DETALHE_CATALOGO "Diant." -> "Diant./Tras." (...). T-0010, 20/11/2026`

## [SUPOSIÇÕES]

- **[SUPOSIÇÃO]** "Sair do site" = `NO_CATALOGO_DIGITAL` = NÃO, como na T-0007.
  - O PAF.nnnn continua ATIVO e com todos os campos, como pede a regra.
  - É uma exceção à regra da v12/v13 ("SIM em todos os itens que não são INATIVO"). Um script futuro que reaplique essa regra precisa respeitar a T-0010.
- **[SUPOSIÇÃO]** O `catalogo_grafico/gerador/montar.py:214` recalcula o NO_CATALOGO_DIGITAL (`'SIM' if c in APP_CAT else 'NÃO'`). Se ele for rodado de novo para montar a base, pode voltar os 103 PAF.nnnn para SIM. Ele precisa respeitar a T-0010: fica para uma tarefa futura do `catalogo-grafico`.
- **[SUPOSIÇÃO]** A marca da ligação é "BAP", sem texto a mais. Não entra "fabricante novo" nem nada parecido, para não levar ao site informação interna de compra.
- **[SUPOSIÇÃO]** "Diant./Tras." no DETALHE_CATALOGO do PAF0116 segue o texto da decisão. Na base, os outros itens com DIANTEIRO E TRASEIRO não têm um padrão único de DETALHE.
- **[SUPOSIÇÃO]** O texto "Sistema Vargas TRW pequena" fica como no ERP, que escreve "Vargas". A marca costuma ser escrita "Varga", e o Alexandre pode corrigir no aprovado. É o item à parte do PAF0054: se ele tirar o item, saem 1 célula (209 → 208) e o trecho do DETALHE na linha do LOG do PAF0054. O resto não muda.
- **[SUPOSIÇÃO]** A DESCRICAO do PAFnnnn ("PASTILHA DE FREIO") não muda: é uma das 5 primeiras colunas e vem do cadastro. A do PAF0116 também não muda, como pede a decisão.
- **[SUPOSIÇÃO]** A data do LOG_CORRECOES está como 20/11/2026. Na gravação, vale a data do "aprovado".

## Anotado, fora do escopo (nada foi mexido)

- 41 PAFnnnn têm "FLU15002 (fluido DOT 4)" no OFERECA_JUNTO: o código vem com um texto entre parênteses. Na base toda são 95 OFERECA_JUNTO com parênteses.
  - No print `depois-produto-PAF.0013-1366.png`, o "Ofereça junto" mostra um botão "4)". O site leu o "4)" do texto como o código 4, um Terminal Axial que a v15 já tirou do site.
- 10 descrições de PAF.nnnn com o prefixo "(980 - PAF.nnnn) -" do ERP. Não aparecem no site depois da T-0010.
