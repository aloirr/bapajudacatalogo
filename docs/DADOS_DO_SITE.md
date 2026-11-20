# O que vai e o que nunca vai para o site (20/11/2026)

**Entra no site** (`site/data/produtos.json`): os produtos com `NO_CATALOGO_DIGITAL` diferente de "NÃO" e `STATUS_CADASTRO` diferente de "INATIVO".

| Chave no JSON | Coluna da base |
|---|---|
| `c` | CODIGO_BAP |
| `d` | DESCRICAO |
| `a` | APLICACAO |
| `r` | REFERENCIAS_CRUZADAS, separadas em marca e código. O que vem depois de "\| ANTERIOR" e o "BAP BOX USD" saem. Também saem as referências do próprio produto (T-0017): as marcas "BAP", "BAP PN_2" e "BAPTA PN" e todo código igual ao CODIGO_BAP, sem espaço e sem pontuação (374 referências em 372 produtos na v18). |
| `x` | ficha técnica: só a lista branca `FICHA` dos DADOS_ADICIONAIS |
| `mo` | montadora (dos DADOS_ADICIONAIS ou do começo da aplicação, normalizada: GM → CHEVROLET, VW → VOLKSWAGEN...) |
| `an` | ANO_INICIO e ANO_FIM, quando existem |
| `p`, `ca`, `si`, `fa`, `li` | PRODUTO, CATEGORIA, SISTEMA, FAMILIA, LINHA |
| `po`, `la`, `de` | POSICAO, LADO, DETALHE_CATALOGO |
| `oj` | OFERECA_JUNTO |
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

- **Tabela da aplicação:** uma linha por veículo do `ve`, com Marca · Modelo · Cilindrada · Versão · Ano. Marca, modelo e versão vêm do `ve`; a cilindrada (com a válvula, quando o texto diz: "2.0 16V") e o ano ainda são lidos do texto da aplicação (o `an`, se houver, vale primeiro), até a v19. Sem achar: "—".
  - **Ano com várias faixas** (R-20261120-165900-alexandre): a célula nunca mostra um ano em que a peça possa não servir; um ano a menos pode, porque "Outros veículos e detalhes" mostra tudo. Com mais de uma faixa no trecho do modelo (ou o modelo repetido), só entram as entradas puras do mesmo modelo: sem nada além do que a linha já tem (modelo, versão do `ve`, a cilindrada da linha e o ano). Lado, outra cilindrada, a válvula que a linha não tem ou palavra de variante ("Dualogic", "Locker", "4x4", "com A/C", "2035" antes de "Axor") deixam a entrada de fora; sem nenhuma pura, "—" (com uma faixa só no trecho, ela continua como antes). As faixas vão sem repetir, em ordem crescente e separadas por ", " ("Montana 2011–2019, 2020–2022"); a faixa inteira dentro de outra não aparece. O nome dentro de um modelo mais longo do `ve` ("Siena" em "Grand Siena") é do longo. Sem a versão da linha no pedaço ou com o modelo numa lista antes dos anos ("Brava, Doblô · 2000–2003 / 2002>"): "—". A faixa sem fim só vem do ">" ou do "em diante" ("2014 até" sem o ano final não conta); "(01-88/06-92)" é mês-ano. A célula quebra só entre as faixas. A linha do texto sai de "Outros veículos e detalhes" só quando cada veículo dela mostra, na própria linha da tabela, o ano que o texto dá a ele. É só a tela: o JSON não muda.
- **Outros veículos e detalhes:** abaixo da tabela, aberto, as linhas do texto da aplicação que a tabela não cobre (T-0017). O texto inteiro continua na ficha impressa.
- **Leve também** (`oj`, da coluna OFERECA_JUNTO; o título era "Ofereça junto" até a R-20261120-141100b): cada item com o código e a descrição (`d`) do catálogo, abrindo o produto; o código fora do catálogo aparece com a nota "fora do catálogo", sem link.
- DIFERENCIAL e ITEM_PARECIDO não vão mais para o site (R-20261120-155900-alexandre e R-20261120-161500-alexandre): saíram da tela, da ficha impressa e do JSON.

**Nunca vai para o site:**

- preço;
- estoque;
- custo FOB/USD;
- MOQ;
- ranking;
- fornecedor;
- origem da linha;
- observações internas.

A `TRAVA` do `gerar_site.py` para a geração (código 2, nada é gravado) se o JSON sair com uma destas palavras: estoque, FOB, USD, MOQ, preço, "R$", BAP BOX, custo de compra ou de importação, fornecedor. "Fornecedor" e "R$" entraram na v15 (T-0007 e T-0009, com o "autorizo" do Alexandre no recado R-20261120-100005-alexandre).

A `TRAVA` varre cada produto inteiro, com o `ve`. Desde a T-0017 ela também varre o arquivo inteiro, como vai ser gravado, antes de gravar.
