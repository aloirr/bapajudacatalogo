# O que vai e o que nunca vai para o site (20/11/2026)

**Entra no site** (`site/data/produtos.json`): os produtos com `NO_CATALOGO_DIGITAL` diferente de "NÃO" e `STATUS_CADASTRO` diferente de "INATIVO".

| Chave no JSON | Coluna da base |
|---|---|
| `c` | CODIGO_BAP |
| `d` | DESCRICAO |
| `a` | APLICACAO |
| `r` | REFERENCIAS_CRUZADAS, separadas em marca e código. O que vem depois de "\| ANTERIOR" e o "BAP BOX USD" saem. |
| `x` | ficha técnica: só a lista branca `FICHA` dos DADOS_ADICIONAIS |
| `mo` | montadora (dos DADOS_ADICIONAIS ou do começo da aplicação, normalizada: GM → CHEVROLET, VW → VOLKSWAGEN...) |
| `an` | ANO_INICIO e ANO_FIM, quando existem |
| `p`, `ca`, `si`, `fa`, `li` | PRODUTO, CATEGORIA, SISTEMA, FAMILIA, LINHA |
| `po`, `la`, `de`, `df` | POSICAO, LADO, DETALHE_CATALOGO, DIFERENCIAL |
| `ip`, `oj` | ITEM_PARECIDO, OFERECA_JUNTO |
| `i` | foto em `site/img/` |

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
