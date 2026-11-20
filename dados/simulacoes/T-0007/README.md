# T-0007 · Terminal Axial com código só de número e Cruzetas (+ T-0009 · TER556556): SIMULAÇÃO

Simulação de 20/11/2026 (Manaus), feita pelo `catalogo-dados`. **Nada foi gravado na base nem em `dados/versoes/`.**
A base fica como está até o "aprovado" do Alexandre. Depois do aprovado, as duas tarefas saem juntas na **v15**,
com a regra 4 do CLAUDE.md: nova versão, LOG_CORRECOES e campos digitados conservados.

- Decisão: R-20261120-093235-alexandre ("1a, 2a, 3a, 4a, 5a, 6a; sim, só do Bap Ajuda"), opção 4a.
- T-0009: R-20261120-093745-alexandre ("1a, 2a, 3a"), opção 2a.
- Cruzetas na T-0007: R-20261120-094416-alexandre ("2a, 3a, 4a"), opção 3a.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `Simulacao_T-0007_Terminal_Axial.xlsx` | Abas `ANTES_DEPOIS` (cada célula que muda), `CRUZETAS`, `CONFERENCIA_154` (a conferência código a código), `RESUMO`, `LOG_CORRECOES_PREVISTO` (uma linha por código) e `T-0009_TER556556` |
| `simular_T-0007.py` | Script que refaz a simulação. Só lê a base. A cópia simulada vai para um diretório temporário: `python3 dados/simulacoes/T-0007/simular_T-0007.py --copia <dir_temporario>`. Ele recusa um `--copia` dentro do repositório e só regrava a planilha desta pasta |

## O que a conferência achou

Os 154 códigos só de número (1 a 164; não existem 88, 101, 111, 119, 135, 140, 146, 149, 151 e 163) **não são produtos novos**.
São linhas de planilhas de origem importadas com o número da linha no lugar do código BAP:

- **152 linhas do "CADASTRO MASTER TERMINAL AXIAL"**. Cada uma diz qual é o TAX dela no próprio cabeçalho (`BAPTA PN: TAXnnnnn`), e os 152 TAX existem na base e estão no site.
  - Em todos, o código de barras é o mesmo do TAX.
  - Todas as referências da parte do terminal (VIEMAR, NAKATA N…, AMPRI, TRW) já estão no TAX.
  - Nenhum TAX é apontado por dois códigos.
- **81 dessas 152 também trazem um cubo de roda juntado na mesma linha**, pelo número da linha da outra planilha (`BAP: CUB6nnnn` nos DADOS_ADICIONAIS):
  - a descrição vira "Terminal Axial | CUBO DE RODA";
  - a 2ª metade da aplicação, a POSICAO (DIANTEIRO/TRASEIRO) e as referências NAKATA NKF… e IMA AL-… são desse cubo;
  - os 81 CUB existem, estão no site e já têm essas referências.
- **2 linhas (74 e 83) são só o cubo de roda**, sem o cabeçalho: são os CUB60074 e CUB60084, com a mesma descrição, aplicação e referências.
  - O 83 é o **CUB60084**, e não o CUB60083, que é outro produto (Nissan Sentra 2.0 16V, dianteiro).
  - O número da linha nem sempre bate com o final do CUB (o 1 é o CUB60000, o 76 é o CUB60077, e o 59 e o 60 estão trocados). Por isso o par de cada linha foi achado pelo `BAP: CUBnnnnn` dos DADOS_ADICIONAIS, e não pelo número.

## Proposta

| Destino | Qtd | O que muda |
|---|---|---|
| **A** · duplicata de um TAX | **152** | `NO_CATALOGO_DIGITAL` SIM → NÃO. As referências boas já estão no TAX: **nada a passar** |
| **B** · sem TAX correspondente (fica, só limpa o cabeçalho) | **0** | — |
| **C** · não é terminal: duplicata de um CUB (códigos 74 e 83) | **2** | `NO_CATALOGO_DIGITAL` SIM → NÃO. As referências já estão no CUB60074 e no CUB60084 |
| **EXTRA APROVADO (R-20261120-095221-alexandre, 2a)** · TAX10116 | 1 | `APLICACAO` "2001–2009 · 2008–2013 · Hoggar 2010>" → "206 2001–2009 · 207 2008–2013 · Hoggar 2010>". A padronização tirou os modelos 206 e 207, e o código 18 mostra que eles existem |
| **Cruzetas** · "Veículo", "HYUNDAI" e "KIA MOTORS" | 3 | `NO_CATALOGO_DIGITAL` SIM → NÃO (ver a seção Cruzetas) |
| **EXTRA APROVADO (R-20261120-095221-alexandre, 2a)** · CRU100 | 1 | `REFERENCIAS_CRUZADAS`: "; HYUNDAI: 491404A500" acrescentado no fim |
| **T-0009** · TER556556 | 1 | `APLICACAO`: o texto de preço sai e o campo fica vazio (ver abaixo) |

No total mudam **160 células**, já contando os 2 extras aprovados:
- 157 na NO_CATALOGO_DIGITAL (154 + 3 Cruzetas);
- 2 na APLICACAO: TER556556 e TAX10116 (extra aprovado);
- 1 na REFERENCIAS_CRUZADAS: CRU100 (extra aprovado).

Os 2 extras foram aprovados pelo Alexandre para entrar na v15 (R-20261120-095221-alexandre, 2a). A v15 em si continua dependendo do "aprovado" da simulação da T-0007 + T-0009.

Nenhuma outra coluna muda e nenhum campo é apagado. As 157 linhas que saem do site continuam na base com o texto original.

## Cruzetas

Os códigos "Veículo" (o site mostra "VEÍCULO"), "HYUNDAI" e "KIA MOTORS", linhas 2460 a 2462 da aba PRODUTOS, **não são produtos**.
São as 3 linhas da tabela de aplicação do **CRU100**, importadas como produto (`CATEGORIA: CRU100` nos DADOS_ADICIONAIS, PRODUTO Cruzetas):

| Código | O que é | Destino |
|---|---|---|
| Veículo | O título da tabela (Veículo, Modelo, Ano, Tração, Motor, Observações, Cardan) | Sai do site (`NO_CATALOGO_DIGITAL` = NÃO) |
| HYUNDAI | Hyundai HR, 04/07 a 12/17, 4x2, 2.5, ref. HYUNDAI 491404A500. O CRU100 já cita a Hyundai HR | Sai do site (`NO_CATALOGO_DIGITAL` = NÃO) |
| KIA MOTORS | Kia Bongo K2500. O CRU100 já cita a Kia Bongo 2500 | Sai do site (`NO_CATALOGO_DIGITAL` = NÃO) |

- **Proponho tirar do site e manter a linha na base**, em vez de apagar a linha. Por quê:
  - a regra é conservar o que foi digitado;
  - é a mesma solução dos Terminais Axiais;
  - a linha HYUNDAI guarda a única cópia da referência original HYUNDAI 491404A500.
- Se o Alexandre preferir apagar as 3 linhas, a v15 registra isso como `LINHA_REMOVIDA` no LOG_CORRECOES, e a v14 guarda o original. O efeito no site é o mesmo.
- **EXTRA APROVADO (R-20261120-095221-alexandre, 2a):** passar a referência HYUNDAI 491404A500 para o CRU100, no fim das referências dele, para não perdê-la no site.

## Efeito no `produtos.json`

Medido com uma cópia da base (com a simulação aplicada) e uma cópia do `gerar_site.py`, as duas no scratchpad. O `site/` do repositório não foi tocado.

| | Antes | Depois |
|---|---|---|
| Produtos no site (`total`) | **4.679** | **4.522** (−154 dos Terminais Axiais e cubos, −3 das Cruzetas; o TER556556 fica) |
| Produtos com "fornecedor" no JSON | 152 | **0** |
| Produtos com o cabeçalho "CADASTRO MASTER" | 152 | 0 |
| Produtos com "R$" no JSON | 1 (TER556556) | **0** |
| Produtos com código só de número | 154 | 0 |
| Cruzetas que são linha de tabela ("VEÍCULO", "HYUNDAI", "KIA MOTORS") | 3 | 0 |
| Produtos com foto | 1.413 | 1.413 (os 157 que saem não tinham foto) |
| Produtos alterados (fora os que saem) | — | 3: TER556556 (sem a chave `a`) e os 2 extras aprovados, TAX10116 (aplicação) e CRU100 (mais a ref. HYUNDAI 491404A500) |

- A cópia da base gerada com a versão atual dá um JSON idêntico ao `site/data/produtos.json` de hoje (fora o `gerado_em`).
- A comparação célula a célula da cópia simulada com a base deu só as 160 células acima. Os 2 extras aprovados estão aplicados na cópia e não mudam o total.
- A `TRAVA` com "fornecedor" (pedido ao `web-site`) não pararia a geração depois da limpeza: o JSON sai com 0 ocorrência.

## T-0009 · TER556556

- **Antes:** `APLICACAO` = texto de preço ("R$ nnn.nn+ Detalhes"). O valor não é copiado aqui.
- **Depois:** `APLICACAO` vazio.
  - Não há a aplicação certa em outra fonte da base: procurei o código e as referências (NAKATA N6556, RLT84088) em todas as abas e nas versões v8 a v14, e todas trazem o mesmo texto de preço.
  - O texto veio da importação do `CATALOGO_BAP_AGENTE_PRONTO.xlsx`.
- **LOG_CORRECOES:** `APLICACAO_LIMPA | PRODUTOS | TER556556 | T-0009 | APLICACAO: texto de preço ("R$ ...+ Detalhes") -> vazio. Não é aplicação; sem outra fonte na base. T-0009, 20/11/2026`
- **Ficha no `produtos.json` depois:** sai só a chave `a`, e o resto fica igual:
  `{"c":"TER556556","d":"TERMINAL PESADO","r":[{"m":"NAKATA PN","c":"N6556, RT#: RLT84088"}],"x":[["Código de barras","7908680405333"],["Posição e lado","DIR. / ESQ."]],"p":"Terminais de Direção","ca":"PEÇAS","si":"DIREÇÃO","fa":"TERMINAIS E ARTICULAÇÕES","li":"LEVE","la":"ESQUERDO E DIREITO"}`
- Para o `web-site` (proposta de "R$" na TRAVA): na base, 98 códigos ELE10nn têm "R$" nos DADOS_ADICIONAIS. Hoje isso não vai para o JSON, porque a ficha só usa a lista branca `FICHA`. Com a limpeza, o JSON fica com 0 "R$".

## [SUPOSIÇÕES]

- **[SUPOSIÇÃO]** "Sair do site" = `NO_CATALOGO_DIGITAL` = NÃO, como pede a tarefa.
  - O STATUS_CADASTRO fica como está ("SEM ESTOQUE NO ARQUIVO").
  - As linhas não são apagadas, e o texto da referência delas (com o cabeçalho) fica na base, porque é dado digitado.
  - A BAP Central e o BAP Ajuda 2.0 leem as 5 primeiras colunas e continuam vendo essas linhas. Se o Alexandre quiser, uma tarefa futura pode tirar o cabeçalho também da base ou marcar as linhas como INATIVO.
- **[SUPOSIÇÃO]** As Cruzetas não têm uma letra própria (A, B ou C). Saem do site como linhas de tabela do CRU100, e o CRU100 só ganha a referência do extra aprovado.
- **[SUPOSIÇÃO]** Os códigos 74 e 83 entram em **C**, e não em A, porque não são terminal axial: são o CUB60074 e o CUB60084. O destino é o mesmo: saem do site.
- **[SUPOSIÇÃO]** Contei uma referência como "já está no TAX/CUB" quando o código dela (sem espaço, ponto, hífen e barra) aparece no texto de referência do TAX ou do CUB. Exemplo: "TRW: JARB0017, BLS4300" do TAX10363 conta como as duas.
- **[SUPOSIÇÃO]** A data do LOG_CORRECOES está como 20/11/2026. Na gravação da v15 vale a data do "aprovado".
- **[SUPOSIÇÃO]** O formato da base não muda (nenhuma coluna ou aba nova): não há aviso de formato para a BAP Central.

## Anotado, fora do escopo (nada foi mexido)

- **TER556556:** é "TERMINAL PESADO" com LINHA = LEVE. Pode ser só o nome, mas vale conferir.
- **CRU100:** a aplicação diz "Hyunday HR (07/2017)", com a grafia "Hyunday". A tabela da origem dá 04/2007 a 12/2017, 4x2, 2.5. A aplicação não mudou aqui: corrigir pede um "aprovado" à parte.
- **CUB60008:** a aplicação tem datas coladas ("01/200012/2015", "01/200912/2015"). É um erro de formatação herdado e pede tarefa própria.
- Alguns TAX ainda têm a aplicação fora do padrão de datas, como TAX10618 ("2011/...") e TAX10649 ("2017/2021").
