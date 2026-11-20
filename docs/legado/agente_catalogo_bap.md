# Agente Catálogo BAP

Conversa: **AGENTE - CATALOGO BAP** no **Claude Cowork** (código `catalogo`). Atualizado em 23/10/2026.

A conversa antiga do claude.ai (27/09 a 20/10) foi encerrada e passou para esta. Histórico completo em `claude/historico_catalogo_bap.md`.

## Papel

- Catálogo de Produtos BAP 2026: versão impressa A4 para gráfica (uma página por linha) e versão digital completa com todas as aplicações.
- Dono da classificação de produto: `BASE_BAP_UNIFICADA_PRODUTOS_BAP` (CATEGORIA, SISTEMA, FAMÍLIA, LINHA), que vale para todos os relatórios.
- Listas de produto para o marketing (encartelados, fotos pendentes).
- Materiais comerciais de produto para cliente (ex.: apresentação de lubrificantes e químicos).
- O catálogo é só para uso interno do time BAP. Nunca vai para cliente nem terceiro.
- O catálogo é informativo, com foco em venda: lacuna de portfólio e pauta de Compras não entram aqui (vão para o `analista`).

## Como trabalhar no Cowork

**A cada pedido do Alexandre**

1. `project_info`, ler este documento e os recados `claude/recados/*_para-catalogo.md` e `*_para-todos.md`.
2. Recado tratado: anotar no Registro e apagar o arquivo (`para-todos` não se apaga).
3. Ao fechar decisão, entrega ou pendência: ler este documento de novo e gravar na hora (Estado atual, Decisões, Pendências, Registro).

**Onde ficam as coisas**

| O quê | Onde |
|---|---|
| Documento, recados, histórico | Projeto BAP (`claude/`), pela ferramenta de projeto |
| Arquivos do trabalho | Notebook NT-AMADMVD13, pasta OneDrive `...\1 - PMZ\2025\IM PMZ\Regionais - Leandro` |
| Pacote do agente (gerador, entregas, histórico) | `Treinamentos e materiais de trade\catalogo_bap\` (instalado em 20/10, 109 arquivos) |
| Cópia do pacote | `Downloads\catalogo_bap_export_cowork.zip` no notebook |
| Fotos dos produtos | `Regionais - Leandro\bap\` (um JPG por código, 2.444 em 16/10) |
| Base lida pelo BAP Ajuda e programas | `BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` (abas PRODUTOS e PRODUTOS_MOTO) |

**Acesso às pastas**

- O Cowork só mexe em pasta conectada. A pasta `Regionais - Leandro` não pode ser liberada por pedido remoto (o nome tem caracteres que o aviso não mostra): o Alexandre conecta pelo botão **"Add folder"** do app, no notebook (conectada em 20/10).
- `Downloads` foi liberada em 20/10 (vale só para a sessão em que foi pedida).
- Sem shell no notebook: só listar, puxar e gravar arquivos. A gravação no notebook é lenta (~7 MB por chamada); arquivos grandes, um por vez.

**Gerar arquivos (catálogos, base, apresentação)**

- O ambiente na nuvem do Cowork é temporário: a cada sessão, puxar o `gerador/` do pacote (de preferência um .zip só), rodar lá e devolver as saídas para a pasta do OneDrive.
- Fotos: puxar a pasta `bap\` compactada (`bap.zip` ou `bap.7z`) em um arquivo só; a cópia arquivo por arquivo tem limite de 50 por vez. Sem as fotos, os destaques usam a imagem da linha.
- Requisitos: Python com `reportlab`, `pandas`, `openpyxl`, `pillow`, `pymupdf`; Node com `pptxgenjs` só para o PowerPoint. Na nuvem do Cowork só falta o `pymupdf` (`pip install pymupdf --break-system-packages`).
- Tempo: digital ~20 s, impresso ~15 s (testado em 20/10).
- Sempre conferir antes de entregar: nº de páginas, comparação de texto com a versão anterior (PyMuPDF) e as páginas mudadas em imagem.
- Comandos (dentro de `gerador/`, saídas em `gerador/saidas/`):

| O que gerar | Comando |
|---|---|
| Catálogo impresso | `python -c "import print_cat as PC; PC.build('saidas/Catalogo_BAP_2026_A4_grafica.pdf')"` |
| Catálogo digital | `python -c "import moto, digital2 as D2; D2.build('saidas/Catalogo_BAP_2026_Completo_Digital.pdf')"` |
| Base v9 a partir da v8 | `python base_v9.py` |
| Base v11 a partir da v10 (selo, item parecido, ofereça junto) | `python base_v11.py` |
| Auditoria do catálogo (parecidos, descrição, ref. repetida) | `python auditoria_catalogo.py` |
| Portfólio de apresentação (cliente/prospect) | `python portfolio.py` |
| Apresentação comercial (PDF) | `python apres_bemol.py` |
| Apresentação comercial (PowerPoint) | `node apres_ppt.js` |
| Encartelados moto | `python encartelados.py` |

- Mapa dos scripts: `taxo.py` (classificação), `datas.py` (datas e exceções), `montar.py` (junta estoque + base + catálogo), `pneus_fix.py`, `cross.py` ("Ofereça junto"), `moto.py` (Linha Moto), `detalhe.py` (DETALHE + informação essencial da descrição), `diferencial.py` (selo c/ × s/ ABS etc.), `oferta.py` (OFEREÇA JUNTO em todos os itens), `digital2.py` e `print_cat.py` (desenho), `digital_data.json` + `parse_digital.py` (aplicações completas), `fixpdf.py` e `aplicar_datas.py` (só ajuste pontual).
- Para atualizar o estoque: trocar `gerador/entradas/ESTOQUE_BAP.xlsx` pelo do dia, com as mesmas colunas.

## Estado atual

- **Catálogo impresso** (`Catalogo_BAP_2026_A4_grafica.pdf`, regerado em 23/10: selo de diferencial, OFEREÇA JUNTO em todas as linhas, DETALHE com a informação essencial da descrição):
  - 56 páginas (múltiplo de 4), estoque de 13/10. Sem a coluna DETALHE: as tags ficam embaixo do código (tabela e destaques).
  - 44 linhas organizadas por sistema, mais a Linha Moto por sistema e família (páginas 49 a 54: Velas, Lâmpadas, Óleo 4T, Pneus, Câmaras de Ar, Rolamentos).
  - 128 de 223 destaques com foto real (após excluir a arte "IMAGEM INDISPONÍVEL").
  - CMYK, sangria de 3 mm. Revisado: sem texto sobreposto. Pronto para prova na gráfica.
- **Catálogo digital** (`Catalogo_BAP_2026_Completo_Digital.pdf`, regerado em 23/10 11h): 183 páginas, ~5 MB, 2.787 itens. **Mesmo formato do A4** (Alexandre, 23/10): uma página de abertura só por SISTEMA (com a lista das linhas e as páginas, clicável); cada linha começa com o cabeçalho (nome, descrição, imagem, nº de itens) e os 5 destaques, e logo abaixo "TODOS OS ITENS DA LINHA" (o destaque só se repete na tabela se a aplicação ou as equivalências não couberam no card). Tags sempre embaixo do código (vermelho = diferencial), sem a nota "≠", OFEREÇA JUNTO só com item real (senão "—"), todas as aplicações, Linha Moto por sistema e família, sumário clicável (colunas do sumário equilibradas automaticamente).
- **Base v9** (`BASE_BAP_UNIFICADA_PRODUTOS_BAP_v9.xlsx`, 19/10), feita a partir da v8. **Instalada em `BAP Ajuda 2.0\` em 20/10** (backup da v8 em `BACKUP_RELATORIOS\ANTES_BASE_V9_OUT2026\`):
  - FAMILIA ARREFECIMENTO DO MOTOR nos 141 produtos de Arrefecimento.
  - Aplicação do FLU15001/15002 corrigida e LINHA de 9 itens corrigida.
  - 4.698 códigos na aba PRODUTOS, mais TAXONOMIA, RESUMO e DE_PARA_CATEGORIA. As 5 primeiras colunas continuam compatíveis com o BAP Ajuda.
  - Conferida contra a v8 instalada: só mudaram FAMILIA (141), APLICACAO (2) e LINHA (9); PRODUTOS_MOTO idêntica.
- **Base v10** (20/10, instalada em `BAP Ajuda 2.0\`; backup da v9 em `BACKUP_RELATORIOS\ANTES_BASE_V10_OUT2026\`): conforme o catálogo — aplicação = texto do catálogo (1.189 trocas, 21 medidas de cilindro corrigidas), 191 equivalências acrescentadas, colunas novas POSICAO, LADO, DETALHE_CATALOGO (PRODUTOS_MOTO: POSICAO e LADO), CXD13200 incluído, linha repetida do 2.75-18 retirada, PAF.00xx com a aplicação do PAF00xx. 4.698 linhas = 4.698 códigos.
- **Conformidade (20/10):** catálogo × base v10: classificação, aplicação e equivalências 100% iguais nos 2.787 itens. ESTOQUE_BAP (20/10 08h16) difere só na LINHA de 6 rolamentos e na família do CXD13200 — o robô corrige na próxima rodada.
- **Base v11** (23/10, instalada em `BAP Ajuda 2.0\`; backup da v10 em `BACKUP_RELATORIOS\ANTES_CATALOGO_DIFERENCIAL_OUT2026\`): v10 + colunas DIFERENCIAL (323), ITEM_PARECIDO (246) e OFERECA_JUNTO (1.965, vazio quando não há item; regravada 10h15, backup em `ANTES_CATALOGO_TAGS_OUT2026`) no fim da aba PRODUTOS; DETALHE_CATALOGO completado em 341 itens. 4.698 linhas; 5 primeiras colunas iguais.
- **Auditoria do catálogo** (`catalogo_bap\entregas\Auditoria_Catalogo_BAP_23102026.xlsx`): 325 itens com selo, 189 pares parecidos sem diferença no cadastro (40 de prioridade alta), 341 descrições levadas ao DETALHE, 47 conflitos base × ESTOQUE (junta "Fixa" × "Tripoide"), 107 referências de concorrente repetidas em 2+ códigos (19 ligando versões diferentes, ex.: Cofap GP30120 e Monroe 94176 no AMT7014 c/ ABS e no AMT7500 s/ ABS), OFEREÇA JUNTO de todos os itens.
- **Portfólio de Produtos BAP AUTOPARTS** (`catalogo_bap\entregas\Portfolio_Produtos_BAP_AUTOPARTS.pdf`, 23/10): apresentação 16:9 de 82 páginas para quem quer conhecer a BAP, organizada por **LINHA → SISTEMA → FAMÍLIA → produto** (decisão do Alexandre, 23/10), conforme a classificação da base/catálogo. Capa, quem somos, visão das 4 linhas (Leve 10 sistemas/39 produtos, Pesada 9/22, Moto 3/5, Universal 3/8); para cada linha, uma divisória com a árvore sistema → família → produtos e **uma página por produto** (Alexandre, 23/10): sistema no título, família, nome, descrição, foto com o nº de itens embaixo e as principais aplicações (até 12, na ordem do ranking do catálogo, sem repetir o mesmo carro) ou ESPECIFICAÇÕES quando o produto não tem aplicação; contato. Sem frase interna ("ranking", "vendedor"). Versão anterior (por sistema, 17 págs) guardada em `gerador/portfolio_v1_por_sistema.py`. Divisória de cada linha em estilo lista/menu (4 colunas na ordem 01, 02, 03…, sem fundo cinza, marcador verde, sem enfeite por baixo da lista). Página de produto único: nº de itens embaixo da foto e, no espaço livre, as principais aplicações na ordem do ranking do catálogo (para óleo e cintas, os principais itens).
  - [SUPOSIÇÃO] Produto aparece na Leve/Pesada com 3+ itens daquela linha (LEVE E PESADA conta nas duas); Moto = itens MOTO + a seção Linha Moto do catálogo; Filtros, Óleo e Químicos aparecem por família (Filtros de Ar, Óleos de Motor, Aditivos...). Material para cliente: sem estoque, sem preço, sem aviso interno. Gerador `gerador/portfolio.py`.
  - [SUPOSIÇÃO] Cuíca sem foto (a imagem da linha tem a marca "BENDIX"); 3 linhas sem imagem usam o logo BAP.
- **Base v8** (instalada em 15/10; 2.905 produtos; 1 sem classificação: CXD13200). Fica como histórico.
- **Kit Filtros BAP** (`catalogo_bap\entregas\Kit_Filtros_BAP.pdf`, 22/10): material para o vendedor mostrar ao cliente. 12 páginas (versão compacta, antes 32), 407 veículos (Leve 205, Pesada 202), 180 códigos. Por montadora: modelo, motor/versão e o filtro de ar, óleo, combustível e cabine (código BAP, equivalente Tecfil e anos). Sem estoque, sem preço, sem aviso interno, com o contato do Alexandre. Fonte: base v10 + ESTOQUE_BAP de 22/10. Gerador: `catalogo_bap\gerador\kitfiltros\` (`parse.py`, `kit.py`).
  - Decisão do Alexandre (22/10): cada filtro numa linha só: código BAP, Tecfil e anos (o cabeçalho da coluna diz "BAP · Tecfil · anos").
  - Decisão do Alexandre (22/10): o nome do modelo aparece em todas as linhas, também quando muda só o motor (sem célula em branco).
  - [SUPOSIÇÃO] Só filtros ativos, com estoque e com aplicação; só veículos com pelo menos 2 tipos de filtro; agrupamento por modelo + motor feito por regra (o vendedor confirma a versão).
- **Apresentação comercial de lubrificantes e químicos** (PDF e PowerPoint, 11 slides 16:9, genérica, sem nome de cliente).
- **Catálogo de moto no BAP Ajuda** revisado em 15/10 (12 pneus e 9 câmaras).
- **Encartelados da linha moto** pedidos ao marketing (`Encartelados_Moto_BAP.xlsx`): 4 encartelados de 6 itens.
- **Apoio:** `Fotos_pendentes_destaques_catalogo.xlsx` (95 destaques sem foto real), `Itens_sem_aplicacao_BAP.xlsx` (101 itens, só 4 com equivalente).
- **Cowork (20/10):** agente aberto no Cowork, pasta `Regionais - Leandro` conectada, pacote instalado em `Treinamentos e materiais de trade\catalogo_bap\`, gerador testado e funcionando na nuvem.

## Decisões em vigor

**Classificação (base v10)**

- **Regra-mãe (Alexandre, 20/10): tudo conforme o catálogo** — base unificada (BAP Ajuda), ESTOQUE_BAP (BAP Tools) e catálogo mostram a mesma classificação, aplicação e equivalência. Mudou o catálogo, regerar a base (`gerador/base_v10.py`) e avisar `bap-tools` e `bap-ajuda`.

- Ordem da classificação nos programas: colunas do ESTOQUE_BAP > base unificada > regra antiga.
- Hierarquia: CATEGORIA > SISTEMA > FAMÍLIA, mais a coluna LINHA.
- Coluna PRODUTO da base = tipo/linha do produto (ex.: Eletroventiladores), igual ao nome da página do catálogo. O item é o CODIGO_BAP.
- Exemplo: Eletroventilador → PEÇAS · Arrefecimento · Arrefecimento do motor · Leve.

| Coluna | Valores |
|---|---|
| CATEGORIA | PEÇAS, BATERIAS, LUBRIFICANTES, QUÍMICOS, PNEUS, ACESSÓRIOS |
| SISTEMA | Suspensão, Direção, Transmissão, Freio, Arrefecimento, Motor, Elétrica, Filtração, Lubrificantes, Químicos, Rodagem, Acessórios (inativos sem regra = OUTROS) |
| LINHA | LEVE, PESADA, LEVE E PESADA, MOTO, UNIVERSAL |

- **Arrefecimento:** só Eletroventiladores e Bomba d'Água, numa família só, ARREFECIMENTO DO MOTOR (19/10; substitui COMPONENTES MECÂNICOS e COMPONENTES ELÉTRICOS E TÉRMICOS).
- **Aditivos e água desmineralizada** ficam em QUÍMICOS (15/10). O `familia_nucleo` do `bap-tools` pôs a água em ARREFECIMENTO em 14/10: ajuste pedido por recado.
- **Interruptores:** pressão do óleo em Motor (Lubrificação do motor); os demais em Elétrica (Interruptores e sensores).
- **Outros sistemas:** Sensor ABS em Freio. Servo e cilindro de embreagem em Transmissão. Catraca de freio é linha própria em Freio (Freio a ar).
- **Regras de LINHA:**
  - Pela aplicação: só veículo pesado = PESADA; leve e pesado = LEVE E PESADA.
  - Sempre PESADA: cuíca, catraca, servo e cilindro de embreagem, rodas.
  - Baterias: PESADA a partir de 100 Ah.
  - Lâmpadas: 24V = PESADA.
  - Pneus e câmaras: MOTO.
  - UNIVERSAL: químicos e cintas. Óleo é UNIVERSAL, exceto o 4T, que é MOTO.
  - "Titan 17.310" é caminhão VW, não Honda Titan.
- Famílias pequenas (ÓLEOS HIDRÁULICOS, FLUIDOS DOT, ÁGUA DESMINERALIZADA, ALIMENTAÇÃO DE COMBUSTÍVEL, OUTROS FILTROS, RODAS, SELANTES E SPRAYS): mantidas; só mudam se o Alexandre decidir.
- Um produto (ou página) não pode citar dois sistemas.

**Catálogo**

- Organizado por SISTEMA, com a seção Linha Moto **também por sistema e família** (Alexandre, 23/10): Elétrica (Velas de Ignição Moto, Lâmpadas Moto) → Lubrificantes (Óleo 4T) → Rodagem (Pneus Moto, Câmaras de Ar Moto, Rolamentos Moto); uma página/capa por família, marcada com `moto=True` em `moto.py`. Não há filtro de moto no portfólio. Rótulo da página = "SISTEMA · FAMÍLIA"; se a família já contém o nome do sistema, mostra só a família.
- **Destaques (5 por página):** maior estoque com aplicação, dando preferência a item com foto própria. Sem foto, usa a imagem da linha com a legenda "imagem ilustrativa".
- **Lista da página:** em ordem de estoque. Itens sem aplicação vão para o fim.
- **"Ofereça junto":**
  - Coluna por item: kit de distribuição → bomba d'água; bomba de óleo → interruptor de pressão do óleo; sapata → cilindro de roda; velas → cabo de vela; pneu ↔ câmara.
  - O par só entra se bater montadora, modelo, motor e anos.
  - Faixa de texto por linha nas demais páginas (ex.: amortecedor + kit batente, eletroventilador + aditivo e água).
  - **OFEREÇA JUNTO em todas as linhas, só com item real (Alexandre, 23/10):** coluna em todas as linhas (`oferta.py`). Par pelo mesmo veículo quando acha, ou código universal (DOT FLU15001/15002, aditivo RAD25005P, água RAD25009P). Sem item no portfólio = "—" (não escrever sugestão em texto, ex.: "kit batente da mesma posição").
- **Tags em vez de texto (Alexandre, 23/10):** embaixo/ao lado do código, etiquetas curtas: DIANT., TRAS., ESQ., DIR., SUP., INF., GÁS, ÓLEO, C/ ABS, S/ ABS, 4X4, 4X2, C/ PIVÔ, PARCIAL, COMPLETO, C/ HASTE, ESTRIAS, CH, MM... Vermelho = diferencial; verde = demais; nada repetido; o que não vira tag fica em texto curto. Regras em `tags.py`. No impresso a coluna DETALHE saiu (tags no código).
- **Selo de diferencial (Alexandre, 23/10):** quando dois itens da mesma linha servem o mesmo veículo (mesma montadora, modelo, anos e posição/lado), o que os separa vai num selo vermelho ao lado do código (ex.: c/ ABS × s/ ABS, câmbio manual × aut., c/ × s/ pivô, 4x4, 8V/16V, diesel/flex) e, no digital, o item parecido embaixo (≠ AMT7014 c/ ABS). No impresso, o selo vai embaixo do código e sobre a foto do destaque. Regras em `diferencial.py`.
- **Descrição essencial no DETALHE (23/10):** sapata c/ ou s/ haste; kit batente parcial/completo e c/ ou s/ caneca; catraca manual/automática, estrias, F e CH ([SUPOSIÇÃO] "26E" = 26 estrias); amortecedor pressurizado = Gás, câmbio, 4x4, exc. Power Shock; bucha da barra em mm, tirante, c/ parafuso; rolamento interno/externo e tipo; embreagem com o que vem no kit; pneu moto PR.
- **DETALHE / POSIÇÃO (aprovado e instalado em 20/10):** texto sempre inteiro, sem "…". Texto cortado na origem é completado pela descrição do cadastro; tira do começo as palavras que repetem o nome da linha; abrevia (esq., dir., compl., c/, s/, hidr., mec., elétr., diant., tras., inf., sup., autom., aux., serv./estac.). Na tabela do impresso: 2 linhas; se não couber, letra 7,8; senão 3 linhas.
- **Datas:**
  - Ano com 4 dígitos; intervalo com "–" (2012–2016); "em diante" com ">" (2012>).
  - Medidas não são data (60/55W, 13/16", 90/90-19).
  - Abreviações padrão: exc., s/ ABS, c/ barra estab., Diant., Tras.
- **Aviso legal em todas as páginas:** "USO INTERNO E CONFIDENCIAL — material exclusivo do time BAP. Proibida a distribuição a clientes e terceiros."
- **Digital:** até 200 páginas (183 em 23/10; colunas: código 122, ofereça junto 74, equivale a 130; RPAD 4,5). Imagens do digital limitadas a ~200 ppi e fotos em JPEG (sem isso o arquivo passa de 120 MB).
- **Sem a nota "≠ item parecido" nos catálogos (Alexandre, 23/10: polui).** O item parecido fica só na base (ITEM_PARECIDO) e na auditoria.
- **Tags sempre embaixo do código, nunca ao lado (Alexandre, 23/10).**
- **Nome da empresa nos materiais (Alexandre, 23/10, recado do `analista`):** sempre "BAP AUTOPARTS" (não "BAP Distribuição").

**Impressão**

- 15 exemplares. A4, 4x4. Capa couché 300 g com laminação BOPP fosca. Miolo couché fosco 150 g. Wire-o. Impressão digital. Preto 100% K. Sangria de 3 mm. Prova física antes da tiragem.

**Material para cliente (apresentação comercial)**

- Sem estoque, sem preço, sem aviso de uso interno e sem nome de cliente.
- Contato: Alexandre Guerreiro · Gerente Comercial · alexandre.guerreiro@bapautoparts.com.br · (92) 99250-8980.

## Pendências

- [ ] **Fotos no gerador:** a pasta `bap\` tem 2.444 arquivos; para regerar o impresso com fotos, puxar só as fotos dos destaques (ou a pasta compactada).
- [ ] **Alexandre apaga no Explorer** as cópias antigas da raiz de `Treinamentos e materiais de trade\` (o Cowork não apaga arquivo nesta máquina): `Catalogo_BAP_2026_A4_grafica.pdf` (16/10), `Catalogo_BAP_2026_Completo_Digital_V15102026.pdf` (16/10) e `BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx` (15/10). As atuais estão em `catalogo_bap\entregas\`.
- [ ] **Foto da imagem da linha Cuíca de Freio** (capa e cards) tem gravação "BENDIX BRASIL". Trocar antes de imprimir.
- [ ] **95 destaques sem foto própria** (`Fotos_pendentes_destaques_catalogo.xlsx`). Pedir ao marketing. Atenção: 1.031 dos 2.444 arquivos da pasta `bap\` são a mesma arte "IMAGEM INDISPONÍVEL" (inclusive FLU15001 e FLU15002).
- [ ] **Decisão do Alexandre — pastilhas com dois códigos:** 103 pastilhas existem como `PAF00xx` (no catálogo, 37.678 un.) e `PAF.00xx` (68.094 un.) no Protheus. Qual é o oficial? Opções: o catálogo mostrar os dois códigos na mesma linha, ou unificar no Protheus. Na v10 o `PAF.00xx` já tem a aplicação do catálogo.
- [ ] **Decisão do Alexandre — 17 códigos "INATIVO" com estoque** (LUB11530 2.686 un., LUB11519 74, LUB11529 58, SF300xx, AMT7071…): cadastro sem descrição; não entram no catálogo.
- [ ] Conferir o BAR15035 (TIRANTE BARRA ESTABILIZADORA), que está em DIREÇÃO / Caixa de Direção; parece SUSPENSÃO.
- [ ] **176 ativos sem aplicação** na v9 (Filtros 49, Amortecedores 46, Baterias 25, Cintas 14, Catraca 13, outros 29). Completar quando houver catálogo do fornecedor.
- [ ] **Confirmar no cadastro as datas ajustadas no catálogo:**
  - AMT7001 Palio 1.8R: virou 11/2005.
  - SpaceFox na Junta Homocinética: virou 01/2007–07/2012.
  - Intervalos invertidos colocados em ordem: 06/2008–2011, 02/2009–2011, 08/2008–2011, 01/2007–2008.
- [ ] **Câmaras CAR21 e CAJ18** marcadas "CONFIRMAR MEDIDA".
- [ ] **Especificações divergentes no cadastro:** 10W40 ProActive 200 (API SM no estoque, SN na base); Shiftease 120 85W140 (mineral no estoque, sintético na base).
- [ ] **Validar uma amostra de cerca de 30 pares** do "Ofereça junto" com especialista de produto (agora são 1.870 pares por veículo).
- [ ] **Auditoria 23/10 — completar o cadastro com o fornecedor:** 40 pares de prioridade alta sem nada que os diferencie (aba PARECIDOS_SEM_DIFERENCA); 19 referências de concorrente repetidas em versões diferentes (ex.: Cofap GP30120 e Monroe 94176 no AMT7014 e no AMT7500); 47 juntas "Fixa" na base × "Tripoide" no ESTOQUE.
- [ ] **Gráfica:** orçamento e prova física.
- [ ] **Adaptar para o vendedor os textos do impresso** escritos para cliente ("Como consultar", chamadas de fim de página). Aguardando aprovação.
- [ ] **Retorno do marketing** sobre os encartelados de moto.
- [ ] **Kit Filtros:** validar com o time comercial (modelos, versões e anos); regerar quando mudar a base ou o estoque.
- [ ] **Aguardando recado de volta:**
  - `bap-ajuda`: v11 no ar no app web (rodar `3_SINCRONIZAR_GITHUB`; o ESTOQUE da pasta do app é de 14/09) e no Copilot Studio; selo DIFERENCIAL no app (recado `20261023-0940`).
  - `estrutura`: índice atualizado com a conversa no Cowork.

## Lições

- Regra de padronização de data pode corromper medida (60/55W, 13/16", 90/90-19, "Titan 17.310"). Revisar a lista de exceções do `datas.py` ao mudar regra.
- Pasta `bap\`: 1.031 arquivos são a arte "IMAGEM INDISPONÍVEL". O gerador descarta pelo hash do FLU15002.jpg.
- Antes de mexer em arquivo de outro agente, conferir o dono: a base é do `catalogo`; o `familia_nucleo` dos programas é do `bap-tools`.

## Recados

- Os recados para este agente ficam em `claude/recados/` com `para-catalogo` no nome. Para falar com outro agente, crie um arquivo novo `AAAAMMDD-HHMM_de-catalogo_para-<código>.md`. Não escreva no documento de outro agente.

## Registro

- 29/09/2026 · base v7: 381 produtos do catálogo que faltavam incluídos; rodapé do impresso aumentado e cores em CMYK.
- 01/10/2026 · simulado o anexo de aplicações no impresso (156 páginas); decidido ter um catálogo digital à parte.
- 07/10/2026 · catálogo digital completo (sumário clicável, botão "Voltar ao sumário").
- 13/10/2026 · auditoria do impresso (6 erros corrigidos); aviso legal de uso interno em todas as páginas; datas padronizadas.
- 15/10/2026 · classificação CATEGORIA/SISTEMA/FAMÍLIA/LINHA e base v8; Arrefecimento como sistema próprio; aditivos e água em QUÍMICOS.
- 16/10/2026 · "Ofereça junto", fontes menores e aplicações encurtadas; seção Linha Moto; impresso refeito no novo modelo (52 páginas, estoque de 13/10) com fotos da pasta `bap\`; encartelados de moto pedidos ao marketing.
- 18/10/2026 · documento criado a partir da memória do projeto e do `processo_bap_out2026.md`.
- 18/10/2026 · estrutura · recados passam a ser arquivos em `claude/recados/`.
- 18/10/2026 · nova forma de trabalho aplicada. Nenhum recado `para-catalogo` ou `para-todos` encontrado.
- 18/10/2026 · pendência de lacuna de portfólio (filtro de moto sem estoque) saiu deste documento e foi para o `analista`, conforme a nova regra.
- 19/10/2026 · recado `20261019-1153_de-bap-tools_para-catalogo.md` tratado: sugestão de juntar as famílias de Arrefecimento; decidida pelo Alexandre no recado seguinte.
- 19/10/2026 · recado `20261019-1205_de-bap-tools_para-catalogo.md` tratado: base v9 gerada com FAMILIA ARREFECIMENTO DO MOTOR (141 produtos); catálogos impresso e digital regerados com a família nova.
- 19/10/2026 · base v9: também corrigidos FLU15001/15002 (aplicação) e a LINHA de 9 itens (rolamentos de caminhão, rolamentos universais, FSE6117); regra de MOTO não confunde mais "Titan 17.310" com Honda Titan.
- 19/10/2026 · recados escritos: `20261019-1830_de-catalogo_para-bap-tools.md` (v9 pronta + regra da água), `20261019-1831_de-catalogo_para-bap-ajuda.md` (v9 e correções), `20261019-1832_de-catalogo_para-analista.md` (lacunas moto), `20261019-1833_de-catalogo_para-treinamentos.md` (catálogo novo).
- 19/10/2026 · apresentação de lubrificantes e químicos (11 slides 16:9): feita para a compradora da Bemol, depois deixada genérica, sem nome de cliente, com o contato do Alexandre; PDF e PowerPoint editável (`BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial`).
- 19/10/2026 · encontrado que 1.031 fotos da pasta `bap\` são a arte "IMAGEM INDISPONÍVEL"; excluídas do catálogo impresso (regerado, 128 destaques com foto real) e lista de fotos pendentes refeita (95 códigos).
- 20/10/2026 · verificação de recados: nenhum novo para `catalogo`. Exportado o pacote `catalogo_bap_export_cowork.zip` para continuar no Claude Cowork.
- 20/10/2026 · **Cowork** · agente aberto no Cowork com o documento de 19/10 e o `HISTORICO_CATALOGO_BAP.md`. Gravados no projeto: os 4 recados de 19/10 (não tinham chegado ao projeto) e `claude/historico_catalogo_bap.md`. Apagados os recados `20261019-1153` e `20261019-1205` (tratados em 19/10). Recado para `estrutura` sobre a conversa nova. Skill "catalogo-bap" criada e salva pelo Alexandre (rotina, regras e comandos deste agente). O zip anexado no chat chegou cortado; o completo (49 MB, 109 arquivos) foi lido de `Downloads` no notebook. Gerador testado na nuvem do Cowork: catálogo digital igual ao entregue (197 páginas, 0 diferença de texto); impresso com 52 páginas, igual exceto os 128 destaques que pedem as fotos da pasta `bap\` (sem elas saem como "imagem ilustrativa").
- 20/10/2026 · recado `20261020-1430_de-bap-ajuda_para-catalogo.md` tratado: CXD13200 classificado (entra na v10), 176 ativos sem aplicação mantêm o aviso no app, coluna POSICAO/LADO proposta e levada ao Alexandre. Resposta em `20261020-1445_de-catalogo_para-bap-ajuda.md`. Arquivo do recado apagado.
- 20/10/2026 · pasta `Regionais - Leandro` conectada. Pacote instalado em `Treinamentos e materiais de trade\catalogo_bap\` (109 arquivos, conferidos). Decisão do Alexandre: v9 instalada em `BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`, com backup da v8 em `BACKUP_RELATORIOS\ANTES_BASE_V9_OUT2026\`; diferença conferida (FAMILIA 141, APLICACAO 2, LINHA 9). Recados `20261020-1500_de-catalogo_para-bap-ajuda.md` e `20261020-1501_de-catalogo_para-bap-tools.md`. Achado: código `2.75-18 42P V250F` repetido na aba PRODUTOS.
- 20/10/2026 · Alexandre pediu para remover as cópias antigas da raiz da pasta de trade; o Cowork não tem como apagar arquivo nesta máquina (sem shell), então os 3 arquivos foram listados para ele apagar no Explorer. Catálogos de 19/10 (gráfica 52 págs e digital 197 págs) enviados no chat.
- 20/10/2026 · pedido do Alexandre: coluna DETALHE sem texto incompleto ("Bandeja suspensão esquerdo completo…"). Causa: 149 detalhes vinham cortados do PDF digital antigo e o impresso cortava em 2 linhas com "…". Criado `detalhe.py` (texto completo e enxuto) e ajustado `print_cat.py`/`moto.py`. Fotos dos 128 destaques puxadas da pasta `bap\`. SIMULADO (não instalado): impresso 52 págs com 0 cortes e +15 itens; digital 191 págs (antes 197), 0 cortes, mesmos 5.519 códigos. Imagens antes × depois e PDFs simulados enviados no chat.
- 20/10/2026 · Alexandre aprovou ("Faça o catálogo"). Instalados em `catalogo_bap\entregas\` o impresso (52 págs, 0 cortes no DETALHE) e o digital (191 págs, 0 cortes, mesmos 5.519 códigos); corrigidas também 2 datas "em · Diante" quebradas (BAN14555DP, FAC6069) e "Emm Diante". Gerador atualizado (`detalhe.py` novo, `print_cat.py`, `moto.py`). Backup dos PDFs e scripts anteriores em `BACKUP_RELATORIOS\ANTES_CATALOGO_DETALHE_OUT2026\`. PDFs enviados no chat.
- 20/10/2026 · recado `20261020-1500_de-bap-ajuda_para-catalogo.md` tratado: POSICAO/LADO e especificação aprovados pelo Alexandre; LADO dos dois lados = ESQUERDO E DIREITO; informado que a v9 já está na pasta. Resposta em `20261020-1615_de-catalogo_para-bap-ajuda.md`. Arquivo do recado apagado.
- 20/10/2026 · pergunta do Alexandre: a base está conforme o catálogo (BAP Tools, BAP Ajuda, base, ESTOQUE_BAP)? Auditoria: classificação já 100% igual; aplicação com diferença de formato em ~1.200 itens e 21 medidas de cilindro corrompidas na base; 191 equivalências do catálogo faltando na base; BOL40035 sem aplicação no catálogo; ESTOQUE_BAP com LINHA antiga em 6 rolamentos. Feita e instalada a base v10 (`base_v10.py`), catálogos regerados (só BOL40035 mudou: pág. 30 do impresso e 107 do digital). Nova auditoria: 100% igual. Recados `20261020-1640_de-catalogo_para-bap-ajuda.md` e `20261020-1641_de-catalogo_para-bap-tools.md`. Achados para o Alexandre: PAF00xx × PAF.00xx (dois códigos, mesmo produto) e 17 códigos "INATIVO" com estoque.
- 22/10/2026 · recados `20261020-1638_de-bap-tools_para-catalogo.md` e `20261021-0934_de-bap-tools_para-catalogo.md` tratados (informativos): `familia_nucleo` já põe água e aditivos em QUÍMICOS, caches arr2/t7 refeitos e o ESTOQUE_BAP de 21/10 já sai com a v10. Pendências com o `bap-tools` encerradas. Arquivos dos recados apagados.
- 22/10/2026 · pedido do Alexandre: kit filtros em PDF para o vendedor mostrar ao cliente, conforme a aplicação do veículo. Gerado `Kit_Filtros_BAP.pdf` (32 págs, 407 veículos, 180 códigos, conferido sem estoque/preço/aviso interno), gravado em `catalogo_bap\entregas\` com o gerador em `catalogo_bap\gerador\kitfiltros\` e enviado no chat.
- 22/10/2026 · pedido do Alexandre: Kit Filtros com menos páginas. Letras, margens e espaços reduzidos; código e anos na mesma linha, Tecfil embaixo; linha pesada começa logo após a leve, sem pular página. De 32 para 18 páginas, mesmo conteúdo (407 veículos), com o contato comercial na capa e no rodapé. Versão anterior do gerador guardada como `kit_v1_32pag.py`. Gravado em `catalogo_bap\entregas\` e enviado no chat.
- 22/10/2026 · pedido do Alexandre: repetir o modelo em todas as linhas do Kit Filtros, sem espaço em branco quando muda o motor. Feito; continua com 18 páginas. Gravado em `catalogo_bap\entregas\` e enviado no chat.
- 22/10/2026 · pedido do Alexandre: sem quebra de linha dentro da célula do Kit Filtros. Código BAP, Tecfil e anos na mesma linha (a palavra "Tecfil" foi para o cabeçalho); colunas de modelo e motor um pouco mais estreitas. Conferido: os 1.154 filtros cabem em uma linha. De 18 para 12 páginas. Gravado em `catalogo_bap\entregas\` e enviado no chat.
- 23/10/2026 · recado `20261023-0713_de-analista_para-todos.md` lido: nome da empresa nos materiais = "BAP AUTOPARTS". Aplicado no portfólio (para-todos não se apaga).
- 23/10/2026 · pedido do Alexandre: catálogo de portfólio com o nome dos produtos para apresentar a BAP. Feito `Portfolio_Produtos_BAP_AUTOPARTS.pdf` (17 págs 16:9, 44 linhas, 12 sistemas, +2.700 itens), sem estoque/preço/aviso interno, com o contato do Alexandre; cuíca sem foto por causa da marca "BENDIX". Gravado em `catalogo_bap\entregas\` e gerador `portfolio.py`; enviado no chat.
- 23/10/2026 · pedido do Alexandre: vendedor achou AMT7014 e AMT7500 com a mesma aplicação. Conferido: procede — base diz Strada Adventure 2001–2020 c/ ABS (AMT7014) e s/ ABS (AMT7500); ESTOQUE_BAP não distingue; Nakata diferente, mas Cofap GP30120 e Monroe 94176 iguais nos dois. Feito: selo de diferencial ao lado do código nos dois catálogos (325 itens), OFEREÇA JUNTO em todos os 2.787 itens, informação essencial da descrição no DETALHE (341 itens), auditoria em Excel e base v11. Instalados com backup em `BACKUP_RELATORIOS\ANTES_CATALOGO_DIFERENCIAL_OUT2026\` (PDFs, base v10 e scripts). Digital 198 págs (todos os 2.787 itens); impresso 52 págs (639 itens nas tabelas, antes 657). Recados `20261023-0940_de-catalogo_para-bap-ajuda.md` e `20261023-0941_de-catalogo_para-bap-tools.md`.
- 23/10/2026 · pedido do Alexandre: no portfólio, separar por linha, sistema e depois família, conforme o catálogo. Refeito: Leve, Pesada, Moto e Universal → sistema → família → produto (33 págs; antes 17 por sistema). Gravado em `catalogo_bap\entregas\` e enviado no chat.
- 23/10/2026 · pedido do Alexandre (portfólio, pág. 04): lista não pode ficar por cima da imagem, sem fundo cinza com título cinza, mais espaço, marcador em cada item; e, nas páginas de produto único, principais aplicações conforme o ranking do catálogo no espaço em branco e nº de itens embaixo da imagem. Feito (33 págs). Gravado em `catalogo_bap\entregas\` e enviado no chat.
- 23/10/2026 · pedido do Alexandre: catálogo sem "Ofereça junto" inventado (sem item = "—"); tags embaixo do código em vez de descrição, sem repetir GÁS/ÓLEO. Feito em `tags.py`, `oferta.py`, `digital2.py`, `print_cat.py`; digital 195 págs, impresso 52; base v11 e auditoria regravadas. Instalado com backup em `BACKUP_RELATORIOS\ANTES_CATALOGO_TAGS_OUT2026\`. Recado `20261023-1015_de-catalogo_para-bap-ajuda.md`.
- 23/10/2026 · pedido do Alexandre (portfólio): tirar a frase interna ("ranking", "vendedor") e fazer uma página por produto com as principais aplicações ou a especificação. Feito: 82 págs. Gravado em `catalogo_bap\entregas\` e enviado no chat.
- 23/10/2026 · pedido do Alexandre: Linha Moto no A4 e no digital por sistema e família (estava tudo junto). Separada em Velas, Lâmpadas, Óleo 4T, Pneus, Câmaras de Ar e Rolamentos (lâmpada de moto LAM2020 incluída); OFEREÇA JUNTO da moto: pneu ↔ câmara, vela ↔ óleo 4T, resto "—". Impresso 56 págs; digital 200 págs com sumário reequilibrado. Base v11, auditoria e portfólio regerados. Backup em `BACKUP_RELATORIOS\ANTES_CATALOGO_MOTO_OUT2026\`. Enviado no chat.
- 23/10/2026 · pedidos do Alexandre: tirar a nota "≠ item parecido"; tags sempre embaixo do código; digital no formato do A4 (cabeçalho com imagem + 5 destaques no começo de cada linha), sem página de abertura por família e com uma página só para separar os sistemas. Feito: digital 183 págs (~5 MB, imagens comprimidas), A4 56 págs; nenhum código perdido (destaque com aplicação/equivalência cortada se repete na tabela). Backup em `BACKUP_RELATORIOS\ANTES_CATALOGO_SISTEMAS_OUT2026\`. Enviado no chat.
