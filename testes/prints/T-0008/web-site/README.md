# T-0008 · Simulação da busca: modelo por palavra inteira, derivados, hífen e marca na frente na aba Código

**Só simulação.** A mudança está no `site/app.js` do branch `agente/T-0008-web-site` e só vai para o `main` com o "aprovado" do Alexandre e o CI verde. O PR leva só o `site/app.js`; esta pasta e os prints ficam fora de `site/` ("2 a", R-20261120-094828-alexandre).

- Decisões que valem: R-20261120-100005-alexandre ("7a", Fox como hoje) e R-20261120-100105-alexandre ("isso é regra para todos": derivados, sem perguntar de novo).
- Base: o `site/data/produtos.json` do `main` aa66efc, com 4.679 produtos. O JSON não foi regerado nem alterado.
- ANTES é o `site/` do `main` aa66efc. DEPOIS é o `site/` do branch. Os dois usam o mesmo JSON e as mesmas fotos.

## A regra (campo Modelo da aba Veículo)

1. **Palavra inteira.** A palavra não pode continuar com o mesmo tipo de caractere: depois de letra não pode vir letra, e depois de número não pode vir número.
   - "GOL" não casa com "GOLF".
   - "1.6" casa com "1.6L", e "HB20" casa com "HB20X" e "HB20S".
2. **Modelo derivado** (regra geral; a lista do Fox saiu). Uma palavra da aplicação é derivada do modelo quando é o modelo grudado, na frente ou atrás, em **outro nome**.
   - "Outro nome" é uma palavra que também aparece sozinha em alguma aplicação da base.
   - Exemplos: TRAIL+BLAZER, CROSS+FOX, SPACE+FOX, SPACE+CROSS, POLO+CLASSIC.
   - O modelo e o outro nome têm pelo menos 3 caracteres, e o outro nome tem pelo menos uma letra. Por isso não vale coincidir só nas letras:
     - GOL+F;
     - C+ARGO;
     - A+POLO;
     - KA+NGOO e KA+DETT (o modelo tem menos de 3 caracteres e o resto não é nome);
     - S+UP+ER (o modelo está no meio);
     - PICK+UP (UP tem menos de 3 caracteres).
   - Exceção registrada: a palavra comum **CAPA** não conta como nome. Sem isso, CAPACITY viraria derivado do City.
   - A lista de palavras sai do próprio JSON ao carregar. O resultado fica em cache por modelo.
3. **Várias palavras.** "SPACE FOX" casa com as palavras soltas (cada uma inteira ou derivada) ou com as palavras vizinhas juntas, por exemplo "SPACEFOX", "SPACE FOX" ou "SPACE-FOX".
4. **Hífen digitado = espaço.** "Cross-Fox" dá o mesmo que "Cross Fox", e "Space-Fox" o mesmo que "Space Fox".
5. **Palavra de 1 caractere não vale solta** (achado do `testes` no c50748b). Em "L-200", "L 200", "T-Cross", "HR-V" e "F-1000", valem só as formas vizinhas: "L200", "L 200" e "L-200".
   - Saem os falsos do c50748b: CL26 no L-200 ("3.3 L" + "CT 200H"), CL18 e CL20 no HR-V ("HR 2007" + "16V") e SFR30026 no T-Cross ("2017 T" + "CROSS UP!").
   - Se todas as formas forem descartadas, a busca usa as palavras separadas: o filtro de modelo nunca some.
6. **Aba Código com a marca na frente**: não mudou. O `mcods` guarda a marca e o código juntos ("TRW16900255S") e só casa o código exato.

Não mudou: a busca geral, o ano, a montadora, os filtros, o layout, a FICHA, a TRAVA e a base.

## Critérios de aceite (todos passam)

| Critério | Resultado |
|---|---|
| "Blazer" traz os 27 do TrailBlazer, como hoje | GM · Blazer: 68 = 68, mesma ordem; 27 itens com TRAILBLAZER |
| "Fox" traz o CrossFox e o SpaceFox | VW · Fox: 63 = 63, mesma ordem; 25 com CROSSFOX e 25 com SPACEFOX; os 4 do CrossFox no Fox 2018 |
| "Space Fox" traz o SpaceCross | VW · Space Fox: 39 = 39, mesma ordem; AMT7076 e AMT7087 (SpaceCross) estão lá |
| Gol sem Golf, Bora ou Jetta sozinhos | VW · Gol · 2018: 61 → 48, e 0 sem "GOL" como palavra |
| Argo sem Cargo | Fiat · Argo: 67 → 48, e 0 que só têm CARGO |
| L-200, F-1000, HR-V e T-Cross só ganham itens que servem | L-200 0 → 76, F-1000 18 → 34, HR-V 25 → 29 e T-Cross 10 → 13. Todos os ganhos têm o modelo vizinho (L200 / L 200, F1000, HRV / HR V, T CROSS) |
| "TRW 16900255S" na aba Código | 0 → 2 (CXD13062 em 1º, CXD13067) |
| Busca geral, por código e sem resultado iguais | iguais e na mesma ordem (tabela abaixo) |

## Contagens: main (antes) → este branch (depois)

| Busca | Antes | Depois |
|---|---:|---:|
| VW · Gol · 2018 / sem ano | 61 / 139 | **48 / 109** |
| VW · Gol G5 / Gol G5 · 2018 | 20 / 12 | 20 / 12 |
| VW · Fox · 2018 / sem ano | 38 / 63 | 38 / 63 |
| VW · Cross Fox · 2018 / sem ano | 18 / 29 | 18 / 29 |
| VW · Cross-Fox · 2018 / sem ano | 0 / 0 | 18 / 29 (igual à forma com espaço) |
| VW · CrossFox · 2018 / sem ano | 17 / 25 | 17 / 25 |
| VW · Space Fox · 2018 / sem ano | 24 / 39 | 24 / 39 |
| VW · Space-Fox · 2018 / sem ano | 0 / 0 | 24 / 39 (igual à forma com espaço) |
| VW · SpaceFox · 2018 / sem ano | 15 / 25 | 15 / 25 |
| VW · Space Cross · 2018 / sem ano | 15 / 25 | 15 / 25 |
| GM · Blazer · 2018 / sem ano | 28 / 68 | 28 / 68 |
| Ford · Cargo · 2018 / sem ano | 60 / 95 | 60 / 95 |
| Mitsubishi · L-200 · 2018 / sem ano | 0 / 0 | 35 / 76 |
| Código "TRW 16900255S" | 0 | **2** |
| Código "16900255S" / "CXD13062" / "COFAP" / "1690" / "24125" | 2 / 1 / 87 / 9 / 1 | iguais, mesma ordem |
| Geral "amortecedor" / "TRW 16900255S" / "pastilha gol" / "kit embreagem" / "bomba de agua" / "golf" | 710 / 2 / 24 / 17 / 52 / 132 | iguais, mesma ordem |
| Sem resultado: código "XYZ999999" e geral "zzqqxx" | 0 / 0 | 0 / 0 |

### Comparação ampla: 138 modelos, sem ano e com 2018 (276 buscas)

Os 138 modelos são os 132 da rodada anterior e mais 6 grafias: L 200, Space-Fox, T Cross, HR V, F 1000 e uma busca de teste com 8 letras soltas.

- Contra o `main`: 224 buscas iguais, na mesma ordem. 40 só perdem itens e 12 só ganham. Nenhuma busca perde e ganha ao mesmo tempo.
- Contra o c50748b, a versão da rodada anterior: 252 iguais, 14 só perdem e 10 só ganham.

Ganhos e perdas por modelo, contra o `main`:

| Busca | Sem ano | Com 2018 | Por quê |
|---|---|---|---|
| VW · Gol | 139 → 109 | 61 → 48 | sai GOLF |
| VW · Gol G4 | 17 → 14 | igual | sai GOLF |
| VW · Gol 1.6 | 77 → 67 | 41 → 36 | sai GOLF |
| VW · Polo | 74 → 73 | 40 → 39 | sai APOLO |
| VW · Up | 45 → 30 | 31 → 23 | sai SUPER, COUPE, DUPLA, DUPLO, 371UP |
| VW · Cross Up | 19 → 16 | 13 → 12 | sai o "UP" de DUPLA, SUPER e DUPLO (AMT7012, AMT7037, ROL1000) |
| VW · Saveiro Cross | 14 → 13 | igual | sai AMT7037 (CROSSOVER) |
| VW · Cross-Fox | 0 → 29 | 0 → 18 | igual a "Cross Fox" |
| VW · Space-Fox | 0 → 39 | 0 → 24 | igual a "Space Fox" |
| VW · T-Cross | 10 → 13 | 7 → 10 | entra "T CROSS" (BAN14514D, BAN14514E, FAR6172) |
| VW · T Cross | 46 → 13 | 28 → 10 | sai "T" solto (igual a T-Cross) |
| GM · Corsa Classic / Classic | 32 → 31 / 37 → 36 | igual | sai ROL11749/11710 ("APLICAÇÃO UNIVERSAL CLÁSSICA") |
| Fiat · Argo | 67 → 48 | 52 → 38 | sai CARGO |
| Fiat · Strada | 162 → 161 | igual | sai "FORA DE ESTRADA" |
| Fiat · Grand Siena | 79 → 78 | igual | sai GRANDE |
| Fiat · Mobi | 52 → 51 | igual | sai AUTOMOBILISTICA |
| Ford · Ka | 118 → 107 | 69 → 63 | sai KANGOO, KADETT |
| Ford · F-1000 | 18 → 34 | 6 → 15 | entra F1000 / F 1000 |
| Ford · F 1000 | 48 → 34 | 22 → 15 | sai "F" solto (igual a F-1000) |
| Hyundai · HB 20 | 56 → 55 | 40 → 39 | sai CL14 ("HB" dentro de HATCHBACK) |
| Honda · HR-V | 25 → 29 | 18 → 20 | entra HRV / HR V |
| Honda · HR V | 33 → 29 | 23 → 20 | sai "HR" + "V" soltos (igual a HR-V) |
| Nissan · Versa | 41 → 39 | 36 → 34 | sai VERSAILLES |
| Nissan · Frontier | 54 → 53 | igual | sai FCB6266 ("NISSANFRONTIERXE", tudo junto na base) |
| Mitsubishi · L-200 | 0 → 76 | 0 → 35 | entra L200 / L 200 |
| Mitsubishi · L 200 | 106 → 76 | 52 → 35 | sai "L" solto (igual a L-200) |
| Citroën · C3 | 41 → 40 | 28 → 27 | sai C30 (Volvo) |
| Scania · 113 | 28 → 27 | 20 → 19 | sai 1113 (MB) |

Ficaram iguais aos do `main`, entre outros: Fox, CrossFox, Cross Fox, Space Fox, SpaceFox, Space Cross, Blazer, Cargo, Tracker, EcoSport, Eco Sport, Saveiro, Voyage, Golf, Jetta, Bora, Amarok, Onix, Celta, Corsa, S10, Cruze, Prisma, Palio, Uno, Siena, Toro, Fiesta, Ranger, HB20, HB20S, Creta, Corolla, Hilux, Civic, Fit, City, Sandero, Logan, Kwid e Duster.

### Todos os derivados que a regra achou nos modelos testados (modelo → derivados)

| Modelo (ou palavra do modelo) | Derivados |
|---|---|
| POLO | POLOCLASSIC |
| FOX | CROSSFOX, SPACEFOX |
| CROSS | CROSSFOX, SPACECROSS, AIRCROSS, SPORTCROSS |
| SPACE | SPACEFOX, SPACEVAN, SPACECROSS, ALLSPACE |
| BLAZER | TRAILBLAZER |
| CARGO | MAXICARGO, EUROCARGO |
| TRACKER | EUROTRACKER |
| CLASSIC | POLOCLASSIC |
| ECO | ECOSPORT, ECOTEC, ECOLINE |
| SPORT | ECOSPORT, SPORTCOUPE, SPORTLINE, SPORTCROSS |
| CITY | CITYTRUCK (CAPACITY fica de fora pela exceção CAPA) |

Os outros modelos testados não têm derivado na base: Gol, Argo, Ka, Up, Onix, Palio, Uno, Strada, Saveiro, Corsa, Celta, Fiesta, Ranger, Hilux, Corolla, Civic, Fit, Sandero, Logan, Duster, Master, March, Versa, Frontier, Sprinter, Atego, Pajero, S10, HB20...

## Casos de fronteira (decididos pela leitura do Alexandre e registrados)

1. **EUROCARGO e MAXICARGO no "Cargo", EUROTRACKER no "Tracker".** São nomes de modelo compostos (caminhões), então entram pela regra. Na prática, o "Cargo" fica igual ao `main` (95): o FAR6276 e o FAR6360 (IVECO EUROCARGO) já entravam por `includes`.
2. **CAPACITY não é derivado do City.** CAPA é palavra comum, e não nome. É a única exceção da lista `NAO_E_NOME`.
3. **ECOTEC, ECOLINE, SPORTLINE e SPORTCOUPE** são nomes de motor ou de versão, e a regra os trata como derivados de ECO e SPORT. Não mudou nada nas contagens: "EcoSport" e "Eco Sport" ficaram iguais ao `main` (87).
4. **CROSSOVER não é derivado do Cross**, porque OVER não aparece sozinho na base. Sai do "Saveiro Cross" e do "Cross Up" (AMT7037), e está correto.
5. **"SpaceFox" escrito junto não traz o SpaceCross** (25 = `main`). "Space Fox" com espaço traz (39 = `main`). No c50748b, a variante explícita SPACEFOX → SPACECROSS fazia "SpaceFox" dar 27. Pela regra geral, SPACECROSS não contém SPACEFOX. O critério do Alexandre fala de "Space Fox", e esse passa.
6. **"L 200", "T Cross", "HR V" e "F 1000" com espaço perdem itens em relação ao `main`.** No `main`, a letra solta casava com qualquer letra da aplicação. Agora dão o mesmo que a forma com hífen, e a forma com hífen só ganha itens que servem.
7. **NISSANFRONTIERXE** (FCB6266) está escrito tudo junto na base. O Frontier está no meio da palavra, então não é derivado e sai do "Frontier". Isso é correção de dado para o `catalogo-dados`, e não da busca.
8. **Ano de 2 dígitos** ("98 a 99") e aplicação sem ano continuam entrando em qualquer ano (`serveNoAno`), fora desta tarefa.

## Prints

Todos os prints mostram a tela visível, em 1366×768 e 390×844. Os nomes seguem o padrão `antes-<caso>-<largura>.png` e `depois-<caso>-<largura>.png`. Os de "depois" foram todos refeitos com o `site/app.js` final.

| Caso | Rota |
|---|---|
| `veiculo-vw-gol-2018` | `#/busca?mo=VOLKSWAGEN&modelo=Gol&ano=2018` |
| `veiculo-gm-blazer` | `#/busca?mo=CHEVROLET&modelo=Blazer` (68 = 68, com o TrailBlazer) |
| `veiculo-mitsubishi-l-200` | `#/busca?mo=MITSUBISHI&modelo=L-200` (0 → 76) |
| `veiculo-vw-fox-2018` | `#/busca?mo=VOLKSWAGEN&modelo=Fox&ano=2018` (topo) |
| `veiculo-vw-fox-2018-crossfox` | a mesma busca, com a lista toda carregada e a tela no AMT7076 e no AMT7087 |
| `veiculo-vw-cross-fox-2018` | `#/busca?mo=VOLKSWAGEN&modelo=Cross Fox&ano=2018` |
| `veiculo-vw-space-fox-2018` | `#/busca?mo=VOLKSWAGEN&modelo=Space Fox&ano=2018` |
| `codigo-trw-16900255s` | `#/busca?cod=TRW 16900255S` |
| `geral-amortecedor` | `#/busca?q=amortecedor` |
| `codigo-cxd13062` | `#/busca?cod=CXD13062` |
| `sem-resultado-xyz999999` | `#/busca?cod=XYZ999999` |

- Há 44 prints no total. Em 390 px, o `document.documentElement.scrollWidth` deu 390 em todos, e em 1366 px deu 1366.
- O total na tela bate com as contagens:
  - Gol 2018: 61 → 48;
  - Blazer: 68 = 68;
  - L-200: 0 → 76;
  - Fox 2018: 38 = 38, com os 4 do CrossFox;
  - Cross Fox 2018: 18 = 18;
  - Space Fox 2018: 24 = 24;
  - TRW 16900255S: 0 → 2;
  - amortecedor: 710 = 710;
  - CXD13062: 1 = 1;
  - XYZ999999: 0 = 0.
