# T-0017 · v24 da base unificada: SIMULAÇÃO (nada gravado)

Pedido: R-20261121-102700-alexandre ("reveja tudo e valide os casos iguais"). Base de partida: v23 (sha256 `05eeb19a…d129`).

## Como foi feito
- **Índice:** cada REFERENCIAS_CRUZADAS da PRODUTOS vira pares (MARCA, CÓDIGO), sem espaço, hífen ou ponto e em maiúsculas.
  - A leitura é a do site (`refs_de`): sem o "| ANTERIOR", sem o "BAP BOX", sem as marcas da BAP e sem fornecedor.
  - Também entra a forma sem dois-pontos ("Cofap GP32675 / Nakata HG 33010").
  - Sai o que não é código: "-", "#N/A", "N/A", texto sem dígito ("DESCRIÇÃO DO PRODUTO AMPRI: Articulação Axial") e código sem marca.
  - "ARL4152 /1" e "PSC80/2" contam como um código só. São outro filtro: não são o ARL4152 e o PSC80.
- **Caso:** um par de códigos BAP com a mesma referência e veículos diferentes na VEICULOS (fabricante e modelo).
  - Em cada caso, cada veículo V que B tem e A não tem é testado.
  - O teste segue a ordem abaixo, e o primeiro que falha é o motivo da aba FORA.
- **Válido** só quando passa em tudo:
  1. a referência não é genérica;
  2. nenhuma outra referência da mesma marca diverge entre A e B (ex.: Nakata HG33004 x HG33093);
  3. mesma FAMILIA;
  4. mesma peça: o mesmo PRODUTO e as mesmas palavras da DESCRICAO, sem contar embalagem (JOGO, UNIDADE), posição e lado;
  5. a mesma medida, quando as duas citam medida (17 mm x 18 mm, 21" x 22");
  6. pelo menos uma montadora em comum na VEICULOS;
  7. a mesma POSICAO e LADO compatível;
  8. nada muda entre A e B em ABS, Locker, cabine ou "c/"/"s/" (c/ parafuso, c/ pivô...), nem no DIFERENCIAL ou no ITEM_PARECIDO;
  9. V ainda não está no texto de A (com os apelidos da MODELOS_VEICULO);
  10. B tem ano para V, o ano bate com a APLICACAO de B, e a linha de V em B é "separado" e sem ANO_DUVIDA.
- **[SUPOSIÇÃO] genérica:** a referência que está em 2 ou mais famílias, ou em 5 ou mais códigos BAP (166 referências, na aba GENERICAS).
- **[SUPOSIÇÃO] LADO vazio** = os dois lados.
- **[SUPOSIÇÃO]** Os testes 2, 4, 5, 6 e "c/ ou s/" vão além do recado.
  - Sem eles, a regra aceitava casos errados. Exemplos:
    - vela de grau térmico 6 recebendo os carros da vela de grau 5, porque só a Bosch coincide;
    - palheta de 21" recebendo os carros da de 22";
    - amortecedor do Mitsubishi ASX recebendo o Uno Sporting por uma Cofap só.
  - Com eles, nada que tenha só indício entra.
- O ano vem da VEICULOS de B (que bate com a APLICACAO de B), nunca da internet.
- A linha nova da VEICULOS é a de B com o CODIGO_BAP de A. Fica "separado", sem MOTIVO e sem ANO_DUVIDA.
- Na APLICACAO, só se acrescenta no fim: " ; FABRICANTE - Modelo cilindrada anos". Nada do texto digitado sai.

## Contagens
| | |
|---|---|
| Referências lidas | 12.373 |
| Referências repetidas (2 ou mais códigos) | 1.369 |
| … delas, genéricas (suspeitas) | 166 |
| Pares de códigos com referência em comum | 755 |
| **Casos** (pares com veículos diferentes) | **626** |
| Veículos testados (código A + veículo V) | 3.239 |
| **Válidos** | **22** veículos em 12 códigos |
| **Fora** | **3.219** (3.217 da auditoria e o Palio do AMT7500 e do AMT7014) |

## Fora, por motivo
| Motivo | Veículos |
|---|---|
| outra referência da mesma marca diverge (item diferente) | 1.693 |
| referência genérica (suspeita) | 569 |
| veículo já está na APLICACAO de A (só falta a linha na VEICULOS) | 442 |
| produto ou peça diferente (PRODUTO/DESCRICAO) | 395 |
| medida diferente | 47 |
| montadoras sem nada em comum entre A e B (suspeita) | 34 |
| linha de V em B é duvidosa ou tem ANO_DUVIDA | 18 |
| muda ABS/s/ ABS | 7 |
| posição diferente | 5 |
| muda c/ ou s/ (c/ parafuso...) | 4 |
| ano de V na VEICULOS de B não bate com a APLICACAO de B | 2 |
| só há anúncio da internet como prova (Palio no AMT7500 e no AMT7014) | 2 |
| V sem ano em B | 1 |

- Os motivos lado, Locker, cabine, DIFERENCIAL/ITEM_PARECIDO e "anos diferentes entre os B" não aparecem sozinhos. Os veículos que cairiam neles já ficaram fora por um teste anterior.

## Válidos (22 veículos, 12 códigos)
| Código A | Veículo V | Anos (de B) | Referência que prova | B |
|---|---|---|---|---|
| 116 | VOLKSWAGEN Logus | 1992–1996 | AMPRI 66007, NAKATA N92006, TRW JARB0067, VIEMAR 680007 | TAX10007 |
| 116 | VOLKSWAGEN Pointer | 1993–1996 | idem | TAX10007 |
| 130 | CHERY Celer | 2013–2018 | AMPRI 62653, NAKATA N93087, VIEMAR 680653 | TAX10653 |
| 141 | BMW Serie 1 | 2004–2013 | AMPRI 60298, TRW JARB0046, VIEMAR 680298 | TAX10298 |
| 144 | MERCEDES-BENZ A-Class | 2000–2011 | AMPRI 60101, NAKATA N99020, TRW JARB0131, VIEMAR 680101 | TAX10101 |
| 148 | CHEVROLET Classic | 2003–2016 | AMPRI 62169, NAKATA N93003, TRW JARB0032, VIEMAR 680169 | TAX10169 |
| CIL8546 | VOLKSWAGEN CrossFox | 2005–2014 | KATHO K1002 | CIL8511 |
| CIL8546 | VOLKSWAGEN Polo | 2002–2014 | KATHO K1002 | CIL8511 |
| CIL8546 | VOLKSWAGEN Polo Sedan | 2002–2014 | KATHO K1002 | CIL8511 |
| CUB60235 | AUDI S3 | 2001–2004 | FREMAX FWB0622 | CUB60039 |
| CUB60235 | VOLKSWAGEN New Beetle | 2000–2003 | FREMAX FWB0622 | CUB60039 |
| CUB60235 | VOLKSWAGEN Polo | 2002–2014 | FREMAX FWB0622 | CUB60039 |
| PAF.0062 | FORD F-250 | 1998–2006 | FRASLE PD62NA, SYL 1222 | PAF0062 |
| PAF.0062 | FORD F-350 | 1998–2005 | idem | PAF0062 |
| PAF.0090 | FIAT Mobi | 2016–2023 | FRASLE PD90, SYL 2184 | PAF0090 |
| PAF.0338 | RENAULT R19 | 1993–2000 | FRASLE PD338NA, SYL 1357 | PAF0338 |
| PAF.0338 | RENAULT Sandero | 2007–2014 | idem | PAF0338 |
| PAF.0338 | RENAULT Symbol | 2009–2013 | idem | PAF0338 |
| PAF.0338 | RENAULT Twingo | 1993–2002 | idem | PAF0338 |
| PAF.0554 | HONDA CR-V | 2003–2006 | FRASLE PD554, SYL 1258 | PAF0554 |
| PAF.0554 | SUZUKI SX4 | 2009–2015 | idem | PAF0554 |
| PAF.0635 | HYUNDAI Azera | 2008–2012 | FRASLE PD635, SYL 2274 | PAF0635 |

- Os códigos 116 a 148 (terminais com código numérico) e os PAF com ponto estão com NO_CATALOGO_DIGITAL = NÃO. São o cadastro antigo do mesmo item do B: o BAPTA PN do 116 é o TAX10007, e o PAF.0338 tem o texto do PAF0338.
- No site, só o CIL8546 e o CUB60235 mudam: 6 veículos.
- O texto antigo dos válidos fica inteiro, e o novo trecho entra no fim. A aba VALIDOS mostra cada texto completo; o DEPOIS da última linha de cada código é o texto final.

## AMT7500 e AMT7014: conclusão
- Os dois dividem a **Cofap GP30120** e a **Monroe 94176** e têm os mesmos veículos na VEICULOS (Strada). Por isso não formam caso.
  - Mesmo que formassem, ficariam fora: a Nakata diverge (HG33004 no AMT7500, HG33093 no AMT7014), e o ABS os separa (DIFERENCIAL s/ ABS x c/ ABS, ITEM_PARECIDO um do outro).
- Nenhum produto BAP com referência do AMT7500 ou do AMT7014 tem o Palio.
  - O AMT7506 (Cofap GP32675, Nakata HG33010 e HG41365) e o AMT7510 (Cofap GL12497, Nakata HG31139) têm o Palio Weekend Adventure Locker e o Strada Adventure Locker.
  - Não dividem referência com o AMT7500 nem com o AMT7014, e são Locker.
- A ligação da Cofap GP30120 ao "Palio Weekend Adventure 2000/2007" só existe em anúncio da internet. Fica fora: "só há anúncio da internet como prova".
- **Conclusão: o Palio NÃO entra no AMT7500 nem no AMT7014. Os dois ficam como estão na v23.**
- O script confere isso na base (assert): mesmos veículos; Nakata divergente; ABS diferente; nenhum vizinho por referência com Palio; AMT7506 e AMT7510 Locker e sem referência em comum.

## Formato e gravação (depois do "aprovado")
- As abas e as colunas não mudam. Só mudam:
  - 12 células APLICACAO na PRODUTOS;
  - 22 linhas novas no fim da VEICULOS.
- Previsto no LOG_CORRECOES: 44 linhas, uma por veículo na APLICACAO e uma por linha nova da VEICULOS.
- O LEIA-ME ganha o bloco da v24 no topo.
- [SUPOSIÇÃO] A linha nova na VEICULOS é a decisão que ficou pendente na P12 da v21. Este pedido a traz ("a linha nova da VEICULOS").
  - O `comparar()` do `base_comum` ainda não conhece linha nova no fim da VEICULOS: o `base_v24.py` vai precisar disso.
