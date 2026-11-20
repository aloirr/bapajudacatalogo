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
| `gerado_em` | data e hora da geração, em hora de Manaus (`America/Manaus`; sem os dados de fuso, UTC−4 fixo). O site mostra "base atualizada em". |
| `ve` | veículos do filtro "Meu veículo", da aba `VEICULOS` (desde a v17, T-0017): lista de `[FABRICANTE, MODELO, VERSAO]`, a VERSAO só quando existe. Ex.: `[["VOLKSWAGEN","Gol","G5"],["VOLKSWAGEN","Saveiro"]]`. |

**Campo `ve` (T-0017):**

- Vêm só as linhas com `SITUACAO` = "separado", sem repetir e na ordem da aba.
- As linhas "duvidoso" ficam fora do `ve` até a revisão (decisão do Alexandre, R-20261120-123130), entre elas, desde a v18, os modelos numéricos lidos de data ou medida. A busca geral continua achando esses produtos pela APLICACAO.
- Fabricante, modelo e versão vão como estão na aba, sem caixa alta forçada: o site formata.
- O produto sem linha "separado" não ganha o campo. Se a base não tem a aba `VEICULOS`, nenhum produto ganha o campo e o JSON sai como antes.
- Da aba `VEICULOS` **não vão** para o site: `ORIGEM`, `SITUACAO`, `MOTIVO`, `ANO_INICIO` e `ANO_FIM`. A aba `MODELOS_VEICULO` (dicionário) também não vai.

**No detalhe do produto** (o site monta a partir do JSON, sem campo novo):

- **Tabela da aplicação:** uma linha por veículo do `ve`, com Marca · Modelo · Cilindrada · Versão · Ano. Marca, modelo e versão vêm do `ve`; a cilindrada e o ano ainda são lidos do texto da aplicação (o `an`, se houver, vale primeiro), até a v19. Sem achar: "—".
- **Ofereça junto** (`oj`) e **Itens parecidos** (`ip`): cada item com o código e a descrição (`d`) do catálogo, abrindo o produto; o código fora do catálogo aparece com a nota "fora do catálogo", sem link.

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
