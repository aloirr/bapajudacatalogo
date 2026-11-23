# O que vai e o que nunca vai para o site (20/11/2026)

**Entra no site** (`site/data/produtos.json`): os produtos com `NO_CATALOGO_DIGITAL` diferente de "NÃO" e `STATUS_CADASTRO` diferente de "INATIVO".

| Chave no JSON | Coluna da base |
|---|---|
| `c` | CODIGO_BAP |
| `d` | DESCRICAO |
| `a` | APLICACAO |
| `r` | REFERENCIAS_CRUZADAS, separadas em marca e código. O histórico interno sai de todos os códigos da célula (RD-0199): em cada trecho entre ";", o que vem depois de " \| " ("\| ANTERIOR: ...") sai antes da divisão pela vírgula; o "BAP BOX USD" também sai. O rótulo `m` fica só com a marca, na caixa da base (RD-0200): sem o " PN" do fim e sem o prefixo "CROSS REFERENCES - ", "CROSS REFERENCIAS - ", "REFERENCIAS CRUZADAS - ", "REF. CRUZADA - " ou "REFERENCIAS CROSS " ("NAKATA PN" → "NAKATA", "REFERENCIAS CROSS FARJ" → "FARJ"). Esse prefixo também separa uma referência da outra no meio da célula ("URBA PN: UB0639, REFERENCIAS CRUZADAS - INDISA PN: 452506"), e a quebra de linha vale como vírgula (códigos da mesma marca; "970 051 431 0" fica inteiro). Também saem as referências do próprio produto (T-0017): as marcas "BAP", "BAP PN_2" e "BAPTA PN" (conferidas antes e depois da limpeza do rótulo) e todo código igual ao CODIGO_BAP, sem espaço e sem pontuação (374 referências em 372 produtos na v18). A referência de fornecedor também sai (lista `FORNECEDORES`): a "SUNRISE" (P10 da v19, R-20261120-194900-po, T-0019). O nome é procurado em qualquer ponto do rótulo, sem espaço e sem pontuação: "SUNRISE PN: 1" e "Pruduct Pn Sunrise: 123" saem (a v23 não tem SUNRISE nas referências). A "AUTOIMPACT" é marca da concorrência (lista `CONCORRENTES_SO_NA_REF`; R-20261121-112900-alexandre, com o "autorizo" do R-20261121-113400-alexandre, T-0017): a referência dela fica no site, com o rótulo `m` sempre no nome canônico "AUTOIMPACT", comparado sem espaço e sem pontuação depois de sair o " PN" ("AUTOIMPACT PN: TR10" → AUTOIMPACT TR10; "Auto-Impact PN: 9" → AUTOIMPACT 9), e o nome só pode estar aí (ver a `TRAVA`, abaixo). Na v23 são 113 referências AUTOIMPACT em 99 palhetas; 75 delas não tinham outra referência. AUTOIMPACT por último no `r` (T-0017, "1 a"): a referência da concorrência vai para o fim da lista, na ordem da célula, para a Bosch e a Tecfil ficarem à vista (24 palhetas mudam de ordem na v23; ex.: CL14 → Bosch 3397006888, Tecfil TPB14, Autoimpact PA14, Autoimpact PU14). A "AMPRI" também é concorrência e sempre ficou no `r`, sem lista. Sai também o código vazio: "-", "0", "--", "N/A" e "#N/A" (erro de fórmula da planilha; RD-0193, T-0019). A referência repetida na célula (mesma marca e mesmo código) aparece uma vez. Na v18, o RD-0199 tira 217 referências de histórico em 115 produtos e, em mais 4, a nota "| Original ..." do texto do código. |
| `x` | ficha técnica: só a lista branca `FICHA` dos DADOS_ADICIONAIS. Resto de ponto flutuante da planilha (T-0017): o valor que é só um número com mais de 6 casas depois do ponto sai com no máximo 6 casas, meio para cima, e sem zeros à direita: "0.12000000000000001" → "0.12" (peso líquido do CL18). A casa de verdade fica: "0.1265" (BV10) não muda. Na v25 são 28 valores em 28 produtos, todos de peso; o número dentro de um texto ("2,7252") não muda. |
| `mo` | montadora (dos DADOS_ADICIONAIS ou do começo da aplicação, normalizada: GM → CHEVROLET, VW → VOLKSWAGEN...) |
| `an` | ANO_INICIO e ANO_FIM, quando existem |
| `p`, `ca`, `si`, `fa`, `li` | PRODUTO, CATEGORIA, SISTEMA, FAMILIA, LINHA |
| `po`, `la`, `de` | POSICAO, LADO, DETALHE_CATALOGO |
| `oj` | OFERECA_JUNTO |
| `ss` | Sistemas do item para o "Leve também" (T-0018, R-20261121-200058-alexandre), só quando diferem do `si`. Hoje, só nos rolamentos (PRODUTO = "Rolamentos", 121 na v27): os que o texto diz (DESCRICAO, DETALHE_CATALOGO e a POSICAO dos DADOS_ADICIONAIS) entre "CÂMBIO E DIFERENCIAL", "TRANSMISSÃO", "RODAGEM" e "MOTOR"; sem nada no texto, fica o SISTEMA. Ex.: ROL32009 → `["CÂMBIO E DIFERENCIAL"]`. Vai só o nome do sistema, nunca o texto da POSICAO. |
| `sc` | fora dos produtos, uma vez no arquivo (T-0018): a tabela dos sistemas compatíveis do "Leve também", `SIS_COMPAT` do `gerar_site.py` (origem → sistemas aceitos, com o próprio; não é simétrica; sistema fora da tabela aceita só ele mesmo). Os PDFs leem a mesma tabela do `gerar_site.py` (`site_regras`), sem cópia. Ex.: `"RODAGEM": ["RODAGEM", "FREIO"]`. |
| `i` | foto em `site/img/` |
| `gerado_em` | data e hora da geração, em hora de Manaus (`America/Manaus`; sem os dados de fuso, UTC−4 fixo). O site mostra "base atualizada em". |
| `ve` | veículos do filtro "Meu veículo", da aba `VEICULOS` (desde a v17, T-0017): lista de `[FABRICANTE, MODELO, VERSAO]`, a VERSAO só quando existe. Ex.: `[["VOLKSWAGEN","Gol","G5"],["VOLKSWAGEN","Saveiro"]]`. |

**Campo `ve` (T-0017):**

- Vêm só as linhas com `SITUACAO` = "separado", sem repetir e na ordem da aba.
- As linhas "duvidoso" ficam fora do `ve` até a revisão (decisão do Alexandre, R-20261120-123130), entre elas, desde a v18, os modelos numéricos lidos de data ou medida. A busca geral continua achando esses produtos pela APLICACAO.
- Fabricante, modelo e versão vão como estão na aba, sem caixa alta forçada: o site formata.
- O produto sem linha "separado" não ganha o campo. Se a base não tem a aba `VEICULOS`, nenhum produto ganha o campo e o JSON sai como antes.
- Da aba `VEICULOS` **não vão** para o site: `ORIGEM`, `SITUACAO`, `MOTIVO`, `ANO_INICIO` e `ANO_FIM`. A aba `MODELOS_VEICULO` (dicionário) também não vai.

**No detalhe do produto** (o site monta a partir do JSON, sem campo novo):

- **Tabela da aplicação:** uma linha por veículo do `ve`, com Marca · Modelo · Cilindrada · Versão · Ano. Marca, modelo e versão vêm do `ve`; a cilindrada (com a válvula, quando o texto diz: "2.0 16V") e o ano ainda são lidos do texto da aplicação (o `an`, se houver, vale primeiro), até o site passar a ler a CILINDRADA e o ano da aba VEICULOS (v20). Sem achar: "—".
  - **Ano com várias faixas** (R-20261120-165900-alexandre): a célula nunca mostra um ano em que a peça possa não servir; um ano a menos pode, porque "Outros veículos e detalhes" mostra tudo. Com mais de uma faixa no trecho do modelo (ou o modelo repetido), só entram as entradas puras do mesmo modelo: sem nada além do que a linha já tem (modelo, versão do `ve`, a cilindrada da linha e o ano). Lado, outra cilindrada, a válvula que a linha não tem ou palavra de variante ("Dualogic", "Locker", "4x4", "com A/C", "2035" antes de "Axor") deixam a entrada de fora; sem nenhuma pura, "—" (com uma faixa só no trecho, ela continua como antes). As faixas vão sem repetir, em ordem crescente e separadas por ", " ("Montana 2011–2019, 2020–2022"); a faixa inteira dentro de outra não aparece. O nome dentro de um modelo mais longo do `ve` ("Siena" em "Grand Siena") é do longo. Sem a versão da linha no pedaço ou com o modelo numa lista antes dos anos ("Brava, Doblô · 2000–2003 / 2002>"): "—". A faixa sem fim só vem do ">" ou do "em diante" ("2014 até" sem o ano final não conta); "(01-88/06-92)" é mês-ano. A célula quebra só entre as faixas. A linha do texto sai de "Outros veículos e detalhes" só quando cada veículo dela mostra, na própria linha da tabela, o ano que o texto dá a ele. É só a tela: o JSON não muda.
- **Ano sem fim** (T-0018, R-20261120-195900-alexandre e R-20261120-201100-alexandre): aparece como "2015+" na coluna Ano (tabela e lista do celular), no texto da aplicação (cartão, janela, página e ficha impressa), em "Outros veículos e detalhes" e na descrição do produto (cartão, janela, página, "Leve também", lista da página inicial, `title` e título da aba; no `alt` da foto, "2015 em diante"). No texto, valem o "2015>", o "2015 →", o "2015->", o "2015 em Diante" e o "2015–" sem o ano final; a faixa com fim ("2012–2016", "06/2008–06/2012", "1998>2009", "2012>20") não muda. O leitor de tela ouve "2015 em diante". É só a tela: o JSON e a busca continuam com o texto da base.
- **Outros veículos e detalhes:** abaixo da tabela, aberto, as linhas do texto da aplicação que a tabela não cobre (T-0017). O texto inteiro continua na ficha impressa. O detalhe sem veículo ("s/ ABS", "Adventure", "exc. Locker") vai no item do veículo a que pertence, no mesmo bloco da aplicação (B11, T-0018): o veículo em negrito e, depois dos dois-pontos, os detalhes separados por " · " (AMT7500: "Palio Weekend Adventure 2000–2007: s/ ABS").
- **Leve também** (`oj`, da coluna OFERECA_JUNTO; o título era "Ofereça junto" até a R-20261120-141100b): cada item com o código e a descrição (`d`) do catálogo, abrindo o produto; o código fora do catálogo aparece com a nota "fora do catálogo", sem link. Só fica o item do mesmo sistema da peça (`si`, ou `ss` quando existe) ou de um compatível (`sc`); sem sistema, o item fica; a seção pode ficar vazia e some.
  - **Com veículo** (placa ou listas Marca/Modelo/Ano; R-20261120-181930-alexandre e R-20261120-182200-alexandre): fica o item que serve no veículo pela regra do filtro "Meu veículo", só com a marca, o modelo e o ano; ficam sempre o item sem `ve` e sem aplicação, o item UNIVERSAL e o fora do catálogo.
  - **Sem veículo** (R-20261120-191700-alexandre e R-20261120-192000-alexandre, "sem a placa"): a lista inteira do `oj`, menos o item UNIVERSAL (sem `ve` e com "universal" na aplicação) de outra família (`fa`) que a do produto aberto. A escolha mora numa constante do `site/app.js` (`UNIVERSAL_SO_MESMA_FAMILIA_COM_VEICULO = false`); com `true`, a regra da família vale também com veículo.
  - É só a tela: o JSON não muda.
- DIFERENCIAL e ITEM_PARECIDO não vão mais para o site (R-20261120-155900-alexandre e R-20261120-161500-alexandre): saíram da tela, da ficha impressa e do JSON.

**Na busca, medida da bateria** (T-0006, fase 1; R-20261123-095435-alexandre e R-20261123-112006-alexandre):

- O `site/app.js` lê do `x` (a ficha técnica, que já passa pela `FICHA` e pela `TRAVA`) o "C20(ah)" (C20(AH) da base) e o "Cca-18°" (CCA-18°), quando o valor é um número inteiro. A chave é comparada sem acento, caixa e sinais (`C20AH` e `CCA18`): se o rótulo da `FICHA` mudar, os filtros somem, e o `testes` confere.
- Na ficha técnica da tela (página, janela e ficha impressa), esses dois aparecem como "Ah" e "CCA", o mesmo texto do filtro (T-0030, MC-0016): o mapa `ROTULO_FICHA` do `site/app.js` troca só o rótulo, pela mesma chave sem sinais. O valor, a `FICHA` e o JSON não mudam.
- Filtros "Amperagem" (opções em Ah, do menor ao maior; `ah=60` no endereço) e "Partida a frio (CCA)" (5 faixas, de "até 400" a "acima de 800", na constante `FAIXAS_CCA` do `site/app.js`; `cca=401-500` no endereço), depois da Família, só quando a lista tem bateria com a medida.
- Busca do campo q: a amperagem entra no texto da bateria como "60AH", e "60ah", "60 ah", "60Ah" e "60-Ah" viram essa palavra.
- É só a tela: o JSON não muda.

**Nunca vai para o site:**

- preço;
- estoque;
- custo FOB/USD;
- MOQ;
- ranking;
- fornecedor (nem como marca de referência cruzada: ver o campo `r`; na base o dado fica);
- origem da linha;
- observações internas.

A `TRAVA` do `gerar_site.py` para a geração (código 2, nada é gravado) se o JSON sair com uma destas palavras: estoque, FOB, USD, MOQ, preço, "R$", BAP BOX, custo de compra ou de importação, fornecedor, o nome de cada um dos `FORNECEDORES` (hoje SUNRISE) e o nome de cada um dos `CONCORRENTES_SO_NA_REF` (hoje AUTOIMPACT) fora da marca da referência cruzada. O trecho dos fornecedores é montado da lista `FORNECEDORES` (`FORNECEDOR_RE`) e o da concorrência, da lista `CONCORRENTES_SO_NA_REF` (`CONCORRENTE_RE`), com até 3 sinais (espaço, hífen, ponto...) entre cada letra ("Sun-Rise", "AUTO IMPACT", "AUTO.IMPACT", "AUTO - IMPACT"). Antes da busca, o `sem_marca_concorrente` troca por "*" só o `r[].m` que é inteiro o nome do concorrente (sem espaço e sem pontuação), nas duas voltas; o nome em qualquer outro lugar para o script: descrição, aplicação, `de`, `x` (chave ou valor), `ve`, código da referência (`r[].c`), referência sem marca ou rótulo composto ("AUTOIMPACT LINHA"). A `TRAVA_PDF` do `catalogo_grafico/gerador/digital2.py` lê o `FORNECEDOR_RE`: fornecedor novo na lista para o site e os PDFs. "Fornecedor" e "R$" entraram na v15 (T-0007 e T-0009, com o "autorizo" do Alexandre no recado R-20261120-100005-alexandre); "AUTOIMPACT" entrou na T-0017 como fornecedor (R-20261120-184000-alexandre) e passou a concorrente na mesma tarefa (ver o campo `r`, acima); "SUNRISE" entrou na T-0019, apertando a trava.

A `TRAVA` varre cada produto inteiro, com o `ve`. Desde a T-0017 ela também varre o arquivo inteiro, como vai ser gravado, antes de gravar.
