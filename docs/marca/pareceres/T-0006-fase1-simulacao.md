# T-0006, fase 1 · Parecer de marca da simulação (baterias: Amperagem e Partida a frio)

| Campo | Valor |
|---|---|
| Tarefa | T-0006, fase 1 (baterias), passo da simulação |
| Pedido | R-20261123-112006-alexandre, decisão 5a; proposta aprovada em R-20261123-095435-alexandre (PR #157, `docs/propostas/BUSCA_POR_MEDIDA.md`) |
| Revisor | design-de-marca |
| Data | 23/11/2026 07:32 (Manaus) |
| O que foi visto | Os 12 prints e o `LEIA.md` em `recados/anexos/T-0006/fase1-sim/` do aloirr/bapajudacatalogo-recados (commit `1a09ed2`), em 1366 e 390 px, em especial `02-bateria-grupos-abertos-1366.png`, `02b-bateria-grupo-cca-painel-390.png`, `04-bateria-cca-401-500-1366.png`, `05-busca-60ah-390.png` e `06-painel-filtrar-60ah-marcado-390.png`. O diff do branch `web-site/T-0006-fase1-baterias` (head `5a46510`) contra o main `15c3d8d`: só `site/app.js` e `docs/DADOS_DO_SITE.md`. O texto das faixas na simulação aprovada (`docs/propostas/T-0006/medidas.py`, `FAIXAS_CCA`, e `simular.mjs`) |
| Base de comparação | `docs/marca/manual.md`: "Nome da marca" (decisão 10 a) e "Cores de estado"; o resto do manual (paleta, tipografia, tom de voz) ainda está "a aprovar". O parecer de marca dos prints da proposta, no Registro da `.coord/tarefas/T-0006.md` (22/11 19:12) |
| Parecer | Simulação: **LIBERADO** para o PO levar ao Alexandre. Nenhum ajuste nesta entrega. Um achado novo, baixo e fora da fase 1 (MC-0016), para a fila |

Leitura, layout, a lista longa da Amperagem (pergunta 1 do `LEIA.md`), o painel "Filtrar" e o celular: ver o parecer
de UX (`docs/ux/pareceres/T-0006-fase1-simulacao.md`). Aqui ficam só a voz, a grafia, a cor, a fonte e as regras do
repositório.

## 1. Voz, texto e grafia

- **"Amperagem"** (título do grupo): é a palavra do balcão ("bateria de 60 amperes"), e o mecânico a entende sem
  explicação. Sem o "(Ah)" no título, como pediu o parecer de UX da proposta: em caixa alta, "AMPERAGEM (AH)" sairia com
  a unidade errada. Igual à simulação aprovada.
- **"60 Ah"** (as 13 opções e a etiqueta "Amperagem: 60 Ah"): o símbolo certo do ampère-hora, com o "A" maiúsculo, o
  "h" minúsculo e o espaço entre o número e a unidade. Nas opções e na etiqueta, a grafia não passa pela caixa alta, e
  o "Ah" fica certo nos dois tamanhos (1366 e 390 px).
- **"Partida a frio (CCA)"**: o nome em português e, entre parênteses, a sigla que vem no rótulo da bateria e que o
  vendedor procura. Em caixa alta, no título do grupo, "PARTIDA A FRIO (CCA)" continua certo, porque a sigla já é
  maiúscula. A etiqueta "Partida a frio (CCA): 401 a 500" lê bem de uma vez.
- **As faixas "até 400", "401 a 500", "501 a 600", "601 a 800" e "acima de 800"**: em português corrido, com "a" entre
  os números (não "401-500", que fica só no endereço). É o texto das 5 faixas da simulação aprovada (decisão 2 a do
  R-20261123-095435-alexandre), letra por letra, inclusive o "até" e o "acima de" em minúscula. A minúscula é coerente:
  a faixa é a continuação do nome do grupo ("Partida a frio (CCA): até 400"), e as opções das medidas começam por número
  ou por preposição, não por nome próprio, como "Leve" ou "Baterias".
- **A busca "60ah"** acha as 8 baterias de 60 Ah, do jeito que o balconista digita ("60ah", "60 ah", "60Ah"). É a
  promessa da marca de achar a peça rápido. O texto da tela não muda: o "60ah" fica só na etiqueta da busca, entre
  aspas, como o cliente digitou.
- **Nenhuma palavra nova fora destas:** "Filtrar (1)", "Ver 8 produtos", "Limpar tudo" e o "(1)" no título do grupo são
  os de hoje. O rodapé continua "© 2026 - BAP AUTOPARTS - Componentes de qualidade", na grafia oficial (decisão 10 a).
- A descrição das baterias diz "60 AMPERES" e o filtro diz "60 Ah". As duas convivem: a descrição é dado da base, e a
  busca "bateria 60" já acha pela descrição. Não é achado.

## 2. Cor, fonte e tokens

- **O diff não toca no `site/styles.css`.** Os grupos novos usam as mesmas classes dos grupos de hoje (`.filtro`,
  `.filtro-bt`, `.filtro-lista`, a opção cinza com `off`) e nenhum estilo solto: nenhum hex novo, nenhum token novo.
- **Nos prints**, os títulos dos grupos novos têm a mesma fonte, o mesmo peso e a mesma caixa alta de "LINHA",
  "CATEGORIA", "SISTEMA" e "FAMÍLIA"; as opções e as contagens, o mesmo tamanho e a mesma cor dos outros grupos;
  a caixa marcada, o mesmo verde da marcação de hoje. Tudo em Poppins.
- **O verde:** nada muda nesta tarefa. O botão "Buscar" e o "Ver N produtos" (verde claro com texto escuro) são os de
  hoje; a troca para a versão escura do verde do logo segue com a simulação própria (R-20261120-115646-alexandre), fora
  da T-0006.
- **Logo, topo e rodapé:** iguais ao print "antes" (`01-antes-bateria-1366.png`). O "Foto em breve" com o logo claro nos
  cartões sem foto é o de hoje.

## 3. Regras do repositório

- **Sem preço e sem estoque:** o diff não muda o `scripts/gerar_site.py`, a `FICHA` nem a `TRAVA`, e o `produtos.json`
  não ganha campo (o site lê o C20(AH) e o CCA-18° da ficha técnica que já passa pela `FICHA`). Nos prints, nenhum "R$",
  "estoque" ou "saldo".
- **Sem marca de terceiros:** os grupos e as etiquetas não trazem nome, logo nem cor de fabricante de bateria.
- **Nada de dado interno na grafia nova:** as faixas e as opções vêm do valor da ficha, que já é público no site.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0016 | Página do produto das baterias, ficha técnica, 1366 e 390 px; rótulos gerados pelo `rotulo()` de `scripts/gerar_site.py:174` (as chaves `C20\(AH\)`, `CCA-18°` e `CA_\+25C` da `FICHA`, linha 158) | voz | manual a aprovar (tom de voz; a mesma grafia no filtro e na ficha) | baixa | Ver abaixo | web-site |

### MC-0016 · A ficha da bateria escreve "Cca-18°" e "C20(ah)", e o filtro novo escreve "CCA" e "Ah"

Fora da fase 1: a fase 1 não muda a ficha, e o achado **não segura** esta entrega. Fica para a fila do Alexandre,
pelo `gerente-projetos` e pelo `po`.

- **O que acontece:** o `rotulo()` põe só a primeira letra em maiúscula quando a chave da base é toda maiúscula. Na
  ficha das baterias saem "C20(ah)", "Cca-18°" e "Ca +25c" (conferido no `site/data/produtos.json` do main). Com a
  fase 1, o cliente vê "Partida a frio (CCA)" e "60 Ah" na coluna de filtros e, ao abrir o produto, "Cca-18°" e
  "C20(ah)" na ficha.
- **Correção (antes → depois), [SUPOSIÇÃO] a confirmar com o designer-ux:** "C20(ah)" → "C20 (Ah)"; "Cca-18°" →
  "CCA a −18 °C"; "Ca +25c" → "CA a +25 °C". Um rótulo fixo para cada um na `FICHA` (como já é o "Peso líquido (kg)").
- **Cuidado para o dono:** os filtros da fase 1 acham a medida pela chave do rótulo, sem acento, caixa e sinais
  (`C20AH` e `CCA18`, `docs/DADOS_DO_SITE.md`). "C20 (Ah)" continua `C20AH`, mas "CCA a −18 °C" vira `CCAA18C`, e o
  filtro sumiria. Quem corrigir o rótulo ajusta a chave no `site/app.js` no mesmo PR, e o `testes` confere os filtros.
- O valor "12v" da tensão nominal (→ "12 V") é dado da base, do `catalogo-dados`; vai junto no mesmo pedido, se o
  Alexandre quiser.

| ID | Situação |
|---|---|
| MC-0016 | ABERTO, fora da fase 1; a encaminhar pelo `gerente-projetos` |
| MC-0015, MC-0011, MC-0012 | ABERTOS, como antes; esta tarefa não os afeta |

## Reteste

Depois do "aprovado" do Alexandre e da resposta à pergunta 1 do `LEIA.md`: conferir no PR os prints contra esta
simulação (os rótulos "Amperagem" e "Partida a frio (CCA)", as opções "N Ah" e as 5 faixas, letra por letra; a etiqueta;
o "Filtrar (N)"), que o diff continua sem mudar o `site/styles.css`, o `gerar_site.py` e o `produtos.json`, e, se a
resposta for b), o texto do botão "Ver mais" (voz e grafia).
