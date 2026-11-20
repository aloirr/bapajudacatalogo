# O que vai e o que nunca vai para o site (20/11/2026)

**Entra no site** (`site/data/produtos.json`): os produtos com `NO_CATALOGO_DIGITAL` diferente de "NÃO" e `STATUS_CADASTRO` diferente de "INATIVO".

| Chave no JSON | Coluna da base |
|---|---|
| `c` | CODIGO_BAP |
| `d` | DESCRICAO |
| `a` | APLICACAO |
| `r` | REFERENCIAS_CRUZADAS, separadas em marca e código. O histórico interno sai de todos os códigos da célula (RD-0199): em cada trecho entre ";", o que vem depois de " \| " ("\| ANTERIOR: ...") sai antes da divisão pela vírgula; o "BAP BOX USD" também sai. O rótulo `m` fica só com a marca, na caixa da base (RD-0200): sem o " PN" do fim e sem o prefixo "CROSS REFERENCES - ", "CROSS REFERENCIAS - ", "REFERENCIAS CRUZADAS - ", "REF. CRUZADA - " ou "REFERENCIAS CROSS " ("NAKATA PN" → "NAKATA", "REFERENCIAS CROSS FARJ" → "FARJ"). Esse prefixo também separa uma referência da outra no meio da célula ("URBA PN: UB0639, REFERENCIAS CRUZADAS - INDISA PN: 452506"), e a quebra de linha vale como vírgula (códigos da mesma marca; "970 051 431 0" fica inteiro). Também saem as referências do próprio produto (T-0017): as marcas "BAP", "BAP PN_2" e "BAPTA PN" (conferidas antes e depois da limpeza do rótulo) e todo código igual ao CODIGO_BAP, sem espaço e sem pontuação (374 referências em 372 produtos na v18). Na v18, o RD-0199 tira 217 referências de histórico em 115 produtos e, em mais 4, a nota "| Original ..." do texto do código. |
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
