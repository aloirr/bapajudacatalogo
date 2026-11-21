# T-0017 · v26 da base unificada: SIMULAÇÃO aprovada e gravada

Pedido: **R-20261121-190649-alexandre**, item 3. O CV-F35 foi confirmado no **R-20261121-190933-alexandre** ("1 a": 2010–2013).
- Base de partida: v25 do main 8de7a6d (sha256 `4954ab91…ac93`).
- **Aprovada** no **R-20261121-195140-alexandre** ("1 a 2 a 3 a 4 a", recado de 21/11 ~15h45, via po):
  - a v26 sai como simulada, com "Mbb" virando "MB";
  - as outras grafias da antiga lista "fica de fora" também entram (seção 3b);
  - o "MB … MB" do BOL40041 e do TER555249 fica.
- Gravada pelo `dados/scripts/base_v26.py` sobre a v25, com a cópia em `dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v26.xlsx` (sha256 `3a9f589d…2f2a`, o mesmo da base).
- Regra fixa (R-20261120-213300): nenhuma marca nova de ano incerto, e nenhum produto sai.

## 1. Contagem
| O quê | Quantos |
|---|---|
| Células da PRODUTOS (todas APLICACAO) | 35, em 35 códigos (21 da simulação e 14 das outras grafias aprovadas) |
| Células da VEICULOS (linhas que já existem) | 10, em 5 linhas de 3 códigos |
| Linhas novas no fim da VEICULOS | 4 (17.292 → 17.296) |
| Códigos mudados | 37 |
| Produtos que saem | 0 (a PRODUTOS continua com 4.695 linhas) |
| Células com a marca de revisão (PRODUTOS + VEICULOS) | 5.122 → 5.120 (a Parati e o Santana do CIL8546 saem da revisão; nada novo marcado) |
| LOG_CORRECOES | 49 linhas, uma por célula: 35 APLICACAO, 10 VEICULOS e 4 VEICULO_NOVO |
| Site (gerar_site) | 4.419 nos dois; mudam 34 produtos (seção 7) |

Por item do pedido:
- 1 (SCE14002): 1 célula, junto com o item 6.
- 2 (CRU100 Bongo): 2 células, a APLICACAO e o ANO_DUVIDA.
- 3 (VEICULOS): 8 células (Parati e Santana) e as linhas novas (os LS do SCE14002 e a HR).
- 4 (CV-F35): 1 célula.
- 5 (MF22): nada muda, só foi conferido.
- 6 (nomes): 33 células, mais a do SCE14002. Por grafia: "Mbb" 9, "Vwc" 2, "NEW Beetle" 10, "MBB" 5, "Vw" 3, "NEW BEETLE" 5, "New beetle" 1 e "New Beatle" 1. O CL21 tem duas grafias na mesma célula, por isso as 15 trocas novas dão 14 células novas.

**Conferência:** a base simulada foi comparada célula a célula com a v25 pelo `base_comum.comparar`.
- Resultado: PRODUTOS 35 mudaram, de 35 esperadas; VEICULOS 10, de 10, mais as linhas novas no fim.
- Depois da gravação, o `base_v26.py --conferir` deu 0, com o LEIA-ME +8 linhas.
- Diferenças fora do permitido: 0.
- A marca de revisão não aparece nas linhas novas do LOG_CORRECOES nem do LEIA-ME, fora o nome da coluna ANO_DUVIDA.

## 2. Nomes de montadora (item 6): o que a base mais usa
- **Mercedes-Benz:** na APLICACAO, "MB" aparece 347 vezes; "MERCEDES-BENZ", 255; "MERCEDES BENZ", 89; "Mercedes-Benz", 32. No prefixo "MARCA - ", "MB" aparece 223 vezes e "MERCEDES-BENZ", 20.
  - **Proposta: "Mbb" → "MB".**
- **Volkswagen:** "VW" aparece 896 vezes; "VOLKSWAGEN", 506; "Volkswagen", 15. No prefixo, "VW" aparece 609 vezes e "VOLKSWAGEN", 8.
  - **Proposta: "Vwc" → "VW".**
  - [SUPOSIÇÃO] O "c" de caminhões some; o número do modelo (13180, 16210...) já diz que é caminhão.
- **"NEW Beetle" → "New Beetle"**, como em todas as linhas da VEICULOS e da MODELOS_VEICULO.
- A troca é só da palavra inteira, com a caixa exata. Nada muda dentro de outra palavra.

## 3. Antes e depois (PRODUTOS · APLICACAO)
Nas células longas vai só o trecho que muda. A célula inteira está na aba ANTES_DEPOIS da planilha.

| Código | Linha | Antes | Depois | Item |
|---|---|---|---|---|
| SCE14002 | 1317 | Servo Embreagem Mbb LS 1630 1929 · 1932 · 1934 LS1941 Vwc 16210 17240 1730 · 111693 | Servo Embreagem **MB** LS 1630 **· LS** 1929 **· LS** 1932 **· LS** 1934 **·** LS1941 **VW** 16210 17240 1730 · 111693 | 1 e 6 |
| CRU100 | 2447 | Hyundai HR 2.5 4x2 (04/2007–12/2017), Kia Motors Bongo 2500 (07/2017) | Hyundai HR 2.5 4x2 (04/2007–12/2017), Kia Motors Bongo 2500 (07/2017**>**) | 2 |
| TER555249 | 292 | MB - Accelo 1016C Mbb 816 Accelo Esq 01/2002–12/2015 | MB - Accelo 1016C **MB** 816 Accelo Esq 01/2002–12/2015 | 6 |
| ROL33019 | 499 | …eixo tubular Mbb) | …eixo tubular **MB**) | 6 |
| ROL6204-2RS | 578 | …(caminhões Mbb, Scania, Volvo)… | …(caminhões **MB**, Scania, Volvo)… | 6 |
| ROL6204-2Z | 580 | …(caminhões Mbb, Scania, Volvo)… | …(caminhões **MB**, Scania, Volvo)… | 6 |
| BOL40041 | 1265 | MB - Mbb/Diesel | MB - **MB**/Diesel | 6 |
| SCE14008 | 1318 | Servo Embreagem Mbb Actros 2546 2646 2655 4844 2013> Axor= 9701500080 | Servo Embreagem **MB** Actros … | 6 |
| SCE14000 | 1319 | Servo Embreagem Mbb O500R O500RS O500RSD 1938S 1944S 2638S AT · 111696 | Servo Embreagem **MB** O500R … | 6 |
| SCE14007 | 1327 | Cilindro Auxiliar Embreagem Vwc 13180 15180 17260 24250 26260 · 119452 ; VW - Constellation… | Cilindro Auxiliar Embreagem **VW** 13180 … | 6 |
| LAM2007 | 4610 | …Curta para Sinaleira Mbb 1113 1313 | …Curta para Sinaleira **MB** 1113 1313 | 6 |
| BDA50028 | 1190 | …; VW - NEW Beetle 2.0 L 8V 1999–2010… | …; VW - **New Beetle** 2.0 L 8V 1999–2010… | 6 |
| CL21 | 1343 | …Golf 2.8 L 24V 2002–2003 · NEW Beetle 2.0 L 8V 2000–2010… | …· **New Beetle** 2.0 L 8V 2000–2010… | 6 |
| KG22 | 1397 | …; VW - NEW Beetle 1.4 L 16V 2013–2017 | …; VW - **New Beetle** 1.4 L 16V 2013–2017 | 6 |
| JUH70232 | 3249 | …· NEW Beetle 2.0 L 8V 2000–2003… | …· **New Beetle** 2.0 L 8V 2000–2003… | 6 |
| CUB60039 | 3344 | …; VW - NEW Beetle 2.0 L 8V 2000–2003… | …; VW - **New Beetle** 2.0 L 8V 2000–2003… | 6 |
| CUB60235 | 3538 | …; VW - NEW Beetle 2.0 L 8V 2000–2003 | …; VW - **New Beetle** 2.0 L 8V 2000–2003 | 6 |
| CV-V28 | 3686 | …· NEW Beetle 2.0 L 8V 1999–2010… | …· **New Beetle** 2.0 L 8V 1999–2010… | 6 |
| POL1625 | 3714 | …· NEW Beetle 2.0 L 8V 1999–2010 | …· **New Beetle** 2.0 L 8V 1999–2010 | 6 |
| PAF0362 | 3897 | …· NEW Beetle 2.0 L 8V 1999–2005… | …· **New Beetle** 2.0 L 8V 1999–2005… | 6 |
| VEL7544 | 4041 | …; VW - NEW Beetle 2.0 L 8V 1999–2010… | …; VW - **New Beetle** 2.0 L 8V 1999–2010… | 6 |

- **SCE14002:** os números 1929, 1932 e 1934 ganham o "LS" e passam a ser modelos. Na base, nenhum desses números vira ano: as linhas LS da VEICULOS ficam sem ano.
  - O site já descarta ano de 4 dígitos antes de 1950, então a busca não muda.
- **CRU100:** "a partir de 07/2017" no formato da casa ("em diante" com ">"), como o "02/2009>" e o "2013>" da base.

## 3b. Antes e depois: as outras grafias aprovadas ("3 a")
| Código | Linha | Antes | Depois | Troca |
|---|---|---|---|---|
| TER555082 | 279 | MBB Ônibus OF 1418 + … | **MB** Ônibus OF 1418 + … | MBB → MB |
| TER555218 | 286 | MBB Sprinter (95/...) … | **MB** Sprinter (95/...) … | MBB → MB |
| ROL32011 | 488 | …Caminhões médios MBB, VW Worker… | …Caminhões médios **MB**, VW Worker… | MBB → MB |
| ROL6204-2RS-C3 | 579 | …(caminhões MBB, Scania, Volvo)… | …(caminhões **MB**, Scania, Volvo)… | MBB → MB |
| ROL683/672 | 624 | …caminhões Scania, Volvo e MBB. ; VOLVO… | …caminhões Scania, Volvo e **MB**. ; VOLVO… | MBB → MB |
| CXD13055 | 36 | …/ Vw Touareg 04/... /… | …/ **VW** Touareg 04/... /… | Vw → VW |
| 116 | 2226 | …Verona 1990/1992; Vw Apollo 1990/1992… | …; **VW** Apollo 1990/1992… | Vw → VW |
| TAX10007 | 3058 | …Verona 1990/1992; Vw Apollo 1990/1992… | …; **VW** Apollo 1990/1992… | Vw → VW |
| 42 | 2157 | …VW BORA, NEW BEETLE, GOLF 1999/2002… | …VW BORA, **New Beetle**, GOLF… | NEW BEETLE → New Beetle |
| FAC6249 | 2635 | …VOLKSWAGEN NEW BEETLE 2.0 L 8V - 1999–2010… | …VOLKSWAGEN **New Beetle** 2.0 L 8V… | NEW BEETLE → New Beetle |
| FAC6301 | 2637 | …VOLKSWAGEN NEW BEETLE MI MEC. … / VOLKSWAGEN NEW BEETLE MI AUT. … | …VOLKSWAGEN **New Beetle** MI MEC. … / VOLKSWAGEN **New Beetle** MI AUT. … | NEW BEETLE → New Beetle (2 vezes) |
| FAR6210 | 2694 | …VOLKSWAGEN NEW BEETLE 2.0 L - 1998–2026… | …VOLKSWAGEN **New Beetle** 2.0 L… | NEW BEETLE → New Beetle |
| CUB60042 | 3347 | VW BORA, NEW BEETLE, GOLF 1999/2002 C/ ABS… | VW BORA, **New Beetle**, GOLF… | NEW BEETLE → New Beetle |
| ELE1049 | 689 | …1.9 TDi, New beetle 1.6/2.0/1.9 TDi… | …1.9 TDi, **New Beetle** 1.6/2.0/1.9 TDi… | New beetle → New Beetle |
| CL21 | 1343 | …VW - Bora 2000–2010 · New Beatle 1999–2012… (e o NEW Beetle da seção 3) | …· **New Beetle** 1999–2012… | New Beatle → New Beetle (na mesma célula do NEW Beetle) |

## 4. Antes e depois (VEICULOS, linhas que já existem)
| Código | Linha | Veículo | Coluna | Antes | Depois | Item |
|---|---|---|---|---|---|---|
| CRU100 | 8257 | KIA Bongo | ANO_DUVIDA | ano solto '07/2017': pode ser 'a partir de' ou AA/AAAA (faixa) | (vazio) | 2 |
| CIL8546 | 6282 | VOLKSWAGEN Parati | ANO_INICIO | (vazio) | 1983 | 3 |
| CIL8546 | 6282 | VOLKSWAGEN Parati | ANO_FIM | (vazio) | 2006 | 3 |
| CIL8546 | 6282 | VOLKSWAGEN Parati | SITUACAO | duvidoso | separado | 3 |
| CIL8546 | 6282 | VOLKSWAGEN Parati | MOTIVO | cita FORD, SEAT, VOLKSWAGEN sem dizer o modelo (ou só com número): "VW / FORD / SEAT" | (vazio) | 3 |
| CIL8546 | 6284 | VOLKSWAGEN Santana | ANO_INICIO | (vazio) | 1983 | 3 |
| CIL8546 | 6284 | VOLKSWAGEN Santana | ANO_FIM | (vazio) | 2006 | 3 |
| CIL8546 | 6284 | VOLKSWAGEN Santana | SITUACAO | duvidoso | separado | 3 |
| CIL8546 | 6284 | VOLKSWAGEN Santana | MOTIVO | (o mesmo da Parati) | (vazio) | 3 |
| CV-F35 | 12536 | FORD Fiesta | ANO_FIM | (vazio) | 2013 | 4 |

- **CRU100 Bongo:** o ANO_INICIO 2017 e o ANO_FIM vazio já estão certos. Só sai a dúvida, que o Alexandre resolveu.
- **CIL8546:** a Parati e o Santana **já têm linha** na VEICULOS, mas como duvidoso, e por isso não aparecem no site.
  - [SUPOSIÇÃO] "Entram como normais" quer dizer trocar essas duas linhas, e não pôr outra igual. Uma linha nova deixaria o mesmo veículo duas vezes, uma delas duvidosa.
  - O ano vem do texto: "Parati, Quantum, Santana, Saveiro / … | 1983 a 2006".
- **CV-F35:** o fim 04/2013 **está no texto**: "Fiesta 1.6 16v / Sigma 05/2010–04/2013 LT".
  - A linha do Fiesta fica 2010–2013. O ANO_INICIO 2010 já estava lá.
  - A APLICACAO não muda, nem o trecho "Fiesta 1.6 16v Ti-Vct/ Sigma 04/2013", conforme a leitura do PO.

## 5. Linhas novas da VEICULOS (no fim da aba)
| CODIGO_BAP | FABRICANTE | MODELO | VERSAO | ANO_INICIO | ANO_FIM | ORIGEM | SITUACAO | MOTIVO | CILINDRADA | ANO_DUVIDA |
|---|---|---|---|---|---|---|---|---|---|---|
| SCE14002 | MERCEDES-BENZ | LS | 1929 | (vazio) | (vazio) | automático | separado | (vazio) | (vazio) | (vazio) |
| SCE14002 | MERCEDES-BENZ | LS | 1932 | (vazio) | (vazio) | automático | separado | (vazio) | (vazio) | (vazio) |
| SCE14002 | MERCEDES-BENZ | LS | 1934 | (vazio) | (vazio) | automático | separado | (vazio) | (vazio) | (vazio) |
| CRU100 | HYUNDAI | HR | (vazio) | 2007 | 2017 | automático | separado | (vazio) | 2.5 | (vazio) |

- **LS:** seguem as linhas LS 1630 e LS 1941 do mesmo código: MODELO "LS" e VERSAO com o número.
  - O texto não tem ano, então o ano fica vazio. "Com o ano do texto" aqui é sem ano.
- **HR:** ano e cilindrada do texto "Hyundai HR 2.5 4x2 (04/2007–12/2017)". Segue as outras linhas HYUNDAI HR da aba: CILINDRADA "2.5" e VERSAO vazia.
  - [SUPOSIÇÃO] O "4x2" fica só no texto: nenhuma linha da aba guarda tração na VERSAO.
- [SUPOSIÇÃO] ORIGEM "automático", como as 17.292 linhas da aba e a linha da v25. A decisão do Alexandre fica no LOG_CORRECOES.

## 6. O que fica de fora, e por quê (aba FORA)
- **DESCRICAO** ("MBB" e "VWC" no SCE14002, SCE14008, SCE14000 e SCE14007): fica.
  - É a 2ª das 5 colunas lidas pelo BAP Ajuda e pela BAP Central, e vem do cadastro.
- **DADOS_ADICIONAIS** ("MBB" e "New Beetle"): é a cópia da fonte e fica.
- **"VW BEATLE"** no CUB60039: não estava na lista aprovada.
- **TER555249 e BOL40041:** só a palavra muda. O "MB - Accelo 1016C MB 816 …" e o "MB - MB/Diesel" ficam ("4 a").
- **SCE14002:** o "LS1941" fica junto. Os VW do texto (16210, 17240 e 1730) não entram na VEICULOS, porque o pedido é só os LS.
- **CIL8546:** Quantum, Saveiro, Royale, Versailles, Cordoba e Ibiza ficam como estão (fora do filtro do site), sem reabrir a P12.
- **CRU100:** "Kia Motors" fica como está, porque não foi pedido.
- **MF22:** a "AUTOIMPACT: MA21" fica. Conferido na REFERENCIAS_CRUZADAS.
- **Outras abas** (LOG_CORRECOES, INCLUIDOS_V7, ROLAMENTOS_INTEGRADOS, VELAS_INTEGRADAS, INTEGRADOS_V6 e o MOTIVO da VEICULOS): são histórico e citação do texto antigo. Ficam.
- **Fora da base:** o `catalogo_grafico/gerador/digital_data.json` ainda tem o texto antigo do SCE14002 ("1929–19321934"). Os PDFs leem 19AA e 20AA como ano (`datas.py`). Fica com o `catalogo-grafico`, que é o dono do arquivo, como diz o R-20261121-195140-alexandre.

## 7. No site (gerar_site.py rodado com a v26 gravada: sem `[PARADO]`, a TRAVA passa e a marca de revisão não aparece no JSON; o produtos.json voltou ao do main, porque vai em PR do web-site)
- **"ve" (filtro "Meu veículo"):**
  - SCE14002 ganha MERCEDES-BENZ LS 1929, LS 1932 e LS 1934;
  - CRU100 ganha HYUNDAI HR;
  - CIL8546 ganha VOLKSWAGEN Parati e Santana.
  - O total passa de 12.154 para 12.160 veículos.
- **"a" (aplicação):** mudam 33 códigos, os das seções 3 e 3b, menos o 42 e o 116, que não estão no site (NO_CATALOGO_DIGITAL = NÃO).
- **Não muda:**
  - o ano do CV-F35 e o da Bongo na VEICULOS, porque os anos da VEICULOS não vão para o site;
  - as referências, a ficha, a TRAVA e a FICHA.

## 8. Formato
Não há coluna nova nem aba nova, e as 5 primeiras colunas da PRODUTOS ficam iguais. O LEIA-ME ganha o bloco da v26 no topo. Gravação: `dados/scripts/base_v26.py`, que lê a ANTES_DEPOIS e a VEICULOS_NOVA desta planilha.
