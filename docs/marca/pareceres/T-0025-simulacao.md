# T-0025 · Parecer de marca da simulação (repetições e ajustes de marca no catálogo gráfico)

| Campo | Valor |
|---|---|
| Tarefa | T-0025 (RD-0428 a RD-0432, MC-0011, MC-0012 e o título dos metadados da Linha Moto), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 05:48 (Manaus) |
| O que foi visto | Simulação do `catalogo-grafico`, feita a partir do main `5c0ddda`: o `LEIA.md` (10 perguntas) e os 16 PNGs em `recados/anexos/T-0025/sim/` do aloirr/bapajudacatalogo-recados (commit `5402d30`), e o diff do gerador (5 arquivos, +17 −16). Conferi também, no main `0994bab`, o `portfolio.py`, o `print_cat.py` (capa, contracapa, `topbar`, `hero`) e o `apres_bemol.py`/`apres_ppt.js` (capa, pág. 2 e pág. 11) |
| Base de comparação | `docs/marca/manual.md`, "Nome da marca" (decisão 10 a, R-20261122-032433-alexandre); o resto do manual ainda está "a aprovar". Meus achados MC-0011 e MC-0012 (`docs/marca/pareceres/T-0023-entregas.md`) |
| Regra da rodada | R-20261122-090651-alexandre: com o Alexandre dormindo, o PO decide de forma conservadora, só tirar repetição, sem mudar a marca |
| Parecer | **LIBERADO** para o PO decidir. Uma divergência com a recomendação do `catalogo-grafico`: na pergunta 1 (RD-0428), recomendo **b) fica como está** (MC-0014). Nas perguntas 2 a 7, concordo com as recomendações |

Nada contra as regras do repositório: sem preço e sem estoque ("preço acessível" e "preço competitivo" são texto
institucional, sem valor, e já estavam no "antes"); sem logo, símbolo ou cor de terceiros. Nenhuma cor, fonte ou logo
novo entra no "depois": só sai texto e os cartões se redistribuem na mesma largura, com as mesmas cores do dicionário `C`.

Imagens citadas (todas em `recados/anexos/T-0025/sim/`, commit `5402d30`):
`RD0428_cabecalho_zoom_antes_depois.png`, `RD0428_Lub_PDF_pag03_antes_depois.png`,
`RD0428_RD0430_Lub_pag02_antes_depois.png`, `RD0429_A4_pag02_antes_depois.png`,
`MC0011_pptx_fonte_arial_poppins.png` e `MC0012_cabecalho_logo_30_48_72pt.png`.

## 1. RD-0428: a etiqueta "BAP AUTOPARTS" ao lado do logo (pergunta 1)

**A etiqueta não é a assinatura do MC-0012.** A assinatura é o "componentes de qualidade" que faz parte do desenho do
logo (dentro do PNG), com cerca de 2,5 pt no cabeçalho. A etiqueta é o **nome da empresa**, em texto, 8,5 pt no PDF e
9 pt no .pptx, e se lê bem (`RD0428_cabecalho_zoom_antes_depois.png`).

**O logo sozinho garante o reconhecimento.** O círculo verde e o "bap" continuam legíveis a 30 pt, no mesmo lugar e no
mesmo tamanho; nenhum pixel do logo muda. Como sinal visual, a marca continua presente nas págs. 2 a 10.

**Mas a etiqueta não é só repetição.** Por isso recomendo b):

- **Repetição de verdade só na pág. 2**, onde o título é "A BAP AUTOPARTS" (logo + etiqueta + título em uns 180 pt).
  Nas págs. 3 a 10 o título é do conteúdo, e a etiqueta é o **único lugar legível do nome completo**: o logo diz só
  "bap", e o resto é o endereço `bapautoparts.com.br` no rodapé. Sem ela, o "AUTOPARTS" some das págs. 3 a 10.
- **O cabeçalho é um padrão compartilhado.** O Portfólio usa o mesmo cabeçalho, com a mesma etiqueta, na mesma posição,
  no mesmo corpo e na mesma cor (`portfolio.py:69`, `NOME = 'BAP AUTOPARTS'`), e ele não muda nesta simulação. Tirar a
  etiqueta só de Lubrificantes separa as duas apresentações comerciais, que hoje têm o mesmo cabeçalho. Isso é mudar a
  aplicação da marca, e a regra da rodada pede o contrário.
- **A etiqueta depende do MC-0012.** A saída de marca do MC-0012 é uma versão oficial do logo sem a assinatura para usos
  pequenos. Nesse caso, o cabeçalho natural é "símbolo + nome legível", e a etiqueta passa a ser justamente o nome. Decidir
  a etiqueta agora, antes do MC-0012, pode obrigar a voltar atrás.

Se o PO escolher a), o cabeçalho de Lubrificantes fica sem a etiqueta e o do Portfólio fica com ela. Nesse caso, o MC-0014
fica aberto até o Alexandre decidir o padrão dos dois (com simulação do Portfólio, se ele também perder a etiqueta).

## 2. A4, pág. 2 ("Por que BAP?") (perguntas 2 e 3)

- **A marca continua bem presente:** o logo no `topbar` (com "CATÁLOGO DE PRODUTOS 2027" ao lado), o sobretítulo
  "BAP AUTOPARTS", o título "Por que BAP?" e o "A BAP AUTOPARTS é…" do "Quem somos". Tirar o nome da barra da direita só
  tira repetição: a barra fica com a mesma assinatura de todas as páginas (logo + nome do catálogo), e o lado direito das
  outras páginas é navegação (família ou "Catálogo 2027"), não marca.
- **Pergunta 2:** concordo com **a) lado direito vazio**. O b) repetiria "CATÁLOGO" e "2027" na mesma barra.
- **Pergunta 3:** concordo com **a)**. O subtítulo que sai ("Componentes de qualidade, com segurança e preço
  acessível.") começa com a assinatura, mas a assinatura **continua legível no logo da capa (150 pt) e da contracapa
  (220 pt)** do A4, e o "Quem somos" diz o mesmo ("componentes automotivos de qualidade, com segurança e preço
  acessível"). O nome "Garantia Expressa BAP" fica, com o "conforme o certificado da embalagem". Nenhuma palavra nova.
- Ao `designer-ux` (não é marca, só registro): no "depois", a parte de baixo da pág. 2 fica com mais espaço vazio.

## 3. Lubrificantes, pág. 2 (pergunta 4)

Concordo com **a)**. Fica a caixa "Garantia Expressa BAP", que é o nome do serviço com a marca; o cartão "SAC" não tinha
marca. Os 3 cartões mantêm o preto do cartão e o `green2` dos números; a largura total é a mesma.

## 4. Título dos metadados da Linha Moto (pergunta 5)

Concordo com **b) `Catálogo BAP 2027 — Linha Moto (uso interno)`**.

- O "Completo" está errado e sai: isso é correção, não mudança de marca.
- O "(uso interno)" é o mesmo aviso da capa ("LINHA MOTO · USO INTERNO") e das páginas, e segue o padrão dos títulos do
  A4 (`Catálogo BAP 2027 — Impressão A4 (uso interno)`) e do Completo Digital. Tirar o aviso só da Linha Moto quebraria o
  padrão dos três catálogos internos e, pela regra conservadora, não é hora de mexer nisso.
- O autor continua "BAP AUTOPARTS".

## 5. MC-0011 e MC-0012 (perguntas 6 e 7)

Concordo com **b) deixar para o Alexandre** nos dois, pelo manual "a aprovar". Os dois são mudança de marca, não tirar
repetição, e eu já tinha pedido isso na T-0023.

- **MC-0011 (`MC0011_pptx_fonte_arial_poppins.png`):** a Poppins no .pptx muda a fonte para quem não a tem instalada (sai
  outra fonte, escolhida pelo programa) e, com a fonte, quebra o "DOT 4" no slide 8. A pergunta ao Alexandre continua a
  mesma: Poppins no .pptx (instalada ou embutida à mão) ou Arial aceita como reserva só no arquivo editável.
- **MC-0012 (`MC0012_cabecalho_logo_30_48_72pt.png`):** a simulação confirma que só aumentar o logo não serve. Com 48 pt
  ele já encosta no sobretítulo, e com 72 pt cobre o sobretítulo e o título. A saída continua a mesma: uma versão oficial
  do logo sem a assinatura (de preferência em vetor), que só o Alexandre fornece, e o tamanho mínimo no manual. **Não
  cortar o PNG.** O topo do site (46 px) vai na mesma pergunta, com o `web-site`.
- Levar o RD-0428 na mesma pergunta do MC-0012: o cabeçalho das apresentações (Lubrificantes e Portfólio) fica com o logo
  sozinho, ou com o símbolo e o nome "BAP AUTOPARTS" ao lado?

## 6. Grafia "BAP AUTOPARTS" em tudo o que fica

Certa em tudo (decisão 10 a). Conferi nos 6 arquivos do gerador envolvidos (`apres_bemol.py`, `apres_ppt.js`,
`print_cat.py`, `digital2.py`, `catalogo_moto.py` e `portfolio.py`): não há "BAP AUTO PARTS" nem "BAP Autoparts". O
que fica:

- A4 pág. 2: o sobretítulo "BAP AUTOPARTS" e o "A BAP AUTOPARTS é…" do "Quem somos".
- Lubrificantes pág. 2: o título "A BAP AUTOPARTS"; pág. 11: "Gerente Comercial · BAP AUTOPARTS".
- Autor dos metadados: "BAP AUTOPARTS" no A4, no Completo Digital, na Linha Moto e em Lubrificantes (PDF e .pptx).
- Portfólio: a etiqueta do cabeçalho (`NOME`).

O RD-0431 (conteúdo num arquivo só) e o RD-0432 (cópias antigas do gerador) não mudam nenhuma página: sem efeito na marca.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono | Situação |
|---|---|---|---|---|---|---|---|
| MC-0014 | Lubrificantes PDF e .pptx, cabeçalho das págs./slides 2 a 10 (`apres_bemol.py:67`, `apres_ppt.js:20`), comparado com o Portfólio (`portfolio.py:69`) | aplicação | manual a aprovar (mesma identidade em todos os materiais) e a regra da rodada (R-20261122-090651-alexandre) | baixa (a marca continua reconhecível; o nome completo some das págs. 3 a 10) | Nesta rodada: **manter** a etiqueta "BAP AUTOPARTS" (pergunta 1, opção b). O RD-0428 vai ao Alexandre junto com o MC-0012: cabeçalho das duas apresentações com o logo sozinho ou com o símbolo + "BAP AUTOPARTS". Se o PO escolher a), registrar que Lubrificantes e Portfólio ficam diferentes até a decisão | catalogo-grafico (depois da decisão); pergunta pelo `po` | ABERTO |
| MC-0011 | (T-0023) | tipografia | manual a aprovar | baixa | Sem mudança; vai ao Alexandre | design-de-marca, depois catalogo-grafico | ABERTO, como na T-0023 |
| MC-0012 | (T-0023) | logo | manual a aprovar | baixa | Sem mudança; vai ao Alexandre, com o RD-0428 | design-de-marca, depois catalogo-grafico e web-site | ABERTO, como na T-0023 |

## Recomendação por pergunta

| Nº | Assunto | Recomendação do `catalogo-grafico` | Marca |
|---|---|---|---|
| 1 | RD-0428, etiqueta no cabeçalho de Lubrificantes | a) tirar | **b) manter**, e levar ao Alexandre com o MC-0012 (MC-0014) |
| 2 | RD-0429, barra da pág. 2 do A4 | a) lado direito vazio | a), de acordo |
| 3 | RD-0429, resto da pág. 2 do A4 | a) sim | a), de acordo |
| 4 | RD-0430, Lubrificantes pág. 2 | a) sai o SAC, fica a caixa | a), de acordo |
| 5 | Título da Linha Moto | b) "— Linha Moto (uso interno)" | b), de acordo |
| 6 | MC-0011 | b) deixar para o Alexandre | b), de acordo |
| 7 | MC-0012 | b) deixar para o Alexandre | b), de acordo |
| 8 a 10 | RD-0431, RD-0432, `portfolio_v1_por_sistema.py` | a) | sem efeito na marca |

## Reteste

Depois da decisão do PO e da aplicação: conferir as entregas novas (A4 pág. 2; Lubrificantes PDF págs. 2, 3 e 11 e
.pptx slides 2, 3 e 11; metadados da Linha Moto) contra esta simulação, com a grafia e o cabeçalho escolhidos na
pergunta 1.
