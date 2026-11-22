# T-0024 · Parecer de UX da simulação da página "Catálogos em PDF" com os 7 materiais

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | v1: 22/11/2026 04:38 (Manaus; o commit f88b952 dizia 04:45 por engano) · reteste da v2: 22/11/2026 04:45 (Manaus) |
| O que foi revisto | Simulação do `web-site` (pasta `t0024-sim/` no rascunho da sessão do gerente, a partir do main 942cf1c): `LEIA.md`, `admin/pdfs/index.html`, `admin/pdfs/sim.css`, `admin/pdfs/pdfs.js` e os 4 prints de `prints/` |
| Pedido | T-0024 (R-20261122-075711-alexandre, resposta "1) a") |
| Resultado | v1: VOLTA PARA AJUSTE (sem 🔴; 4 🟡 e a alternativa B). **Reteste da v2: LIBERADO** para ir ao Alexandre, sem 🔴 e sem 🟡 que segure (ver "Reteste da v2", no fim) |

Sem preço e sem estoque: 🟢 (nenhum valor nem quantidade na tela; o tamanho do arquivo e a data não são dado interno).

## 1. Os 2 grupos
- 🟢 A divisão "Catálogos" (3) e "Apresentações e materiais" (4) é a certa: o admin escolhe primeiro o tipo de material, depois o arquivo. Os catálogos, que são os mais usados, ficam no topo.
- 🟢 Um `h1`, `h2` por grupo, `h3` por cartão, com `aria-labelledby` na `section`.
- 🟡 Tirar o contador "3 arquivos" e "4 arquivos" (`index.html:40` e `:60`). Ele não ajuda a decidir nada e entra no nome acessível do `h2` ("Catálogos 3 arquivos"). Com a alternativa B (item 5), o grupo 2 teria 3 cartões e 4 arquivos, e o número passaria a confundir.
- 🟡 Tirar a frase de cada grupo ("Os catálogos de produtos, com as aplicações." e "Para apresentar a BAP e as linhas de produto."). O nome do grupo já diz isso, e cada cartão tem a sua frase de uso. São 2 linhas a menos numa página que tem 2.914 px de altura no celular.

## 2. Os cartões
- 🟢 A ordem dentro do cartão está certa: o ícone e o título, a frase de uso, os dados e o botão. O botão fica sempre no pé do cartão (`margin-top: auto`), na mesma altura em toda a linha.
- 🟢 O tamanho em KB abaixo de 1 MB ("824 KB", "249 KB") e a data no formato do site ("20/11/2026 10:12").
- 🟡 **Tirar a linha "Tipo"** (`index.html:44, 49, 54, 64, 69, 74, 79`). O tipo já aparece no ícone ("PDF" ou "PPT"), na extensão do arquivo e no botão ("Baixar PDF" ou "Baixar PowerPoint"). No cartão "Lubrificantes e Químicos (PDF)", a palavra PDF aparece 5 vezes. Uma informação deve ficar num lugar só. Para o leitor de tela, o botão basta, porque o ícone tem `aria-hidden`.
- Nota (não segura, é do PO): a frase do Completo Digital ("Para enviar aos clientes e ver na tela.") contradiz o "USO INTERNO E CONFIDENCIAL" das páginas. Se o PO confirmar o uso interno, o texto fica "Para ver na tela.", que é o mesmo modelo da Linha Moto.

## 3. O cartão do .pptx
- 🟢 O ícone "PPT" segue o mesmo desenho do ícone "PDF", com o fundo `--verde-txt` e o texto branco (6,5:1). A diferença não está só na cor, porque a sigla muda junto. A cor fica para o `design-de-marca` validar.
- 🟢 O botão diz "Baixar PowerPoint", com o mesmo componente e o mesmo nível do "Baixar PDF".
- 🟡 Os estados ainda falam só de PDF (`pdfs.js:23, 33, 36`). Com o .pptx na lista, os textos passam a ser:
  - arquivo que falta: "Este arquivo não está disponível agora. Tente de novo mais tarde.";
  - lista vazia: "Nenhum arquivo por enquanto.";
  - erro: "Não foi possível carregar os arquivos agora. Atualize a página em instantes.";
  - carregando (`site/admin/pdfs/index.html:37`): "Carregando os arquivos…".
- 🟢 No nome acessível do botão, ficar com o " · <título>" da simulação, e não com o " do <título>" do `pdfs.js` de hoje. O "do" não serve para "Lubrificantes" nem para "Kit Filtros".

## 4. 3 toques, acessibilidade e 390 px
- 🟢 3 toques: menu da conta, "Catálogos em PDF" e o botão de baixar. Em 390 × 844, o primeiro botão aparece sem rolar (a ~650 px, já contando a faixa da simulação).
- 🟢 Em 1366 e em 390 px não há rolagem para o lado. Os botões têm 44 px ou mais e ocupam a largura toda no celular. O nome do arquivo quebra depois do "_", nunca no meio da palavra. Toda imagem tem `alt` e o ícone decorativo tem `aria-hidden`.
- 🟢 O cartão "Kit Filtros" fica sozinho na última linha em 1366 px. Isso não segura, mas a alternativa B resolve.

## 5. Alternativa B (um cartão só para os Lubrificantes): **recomendo a B**
Por quê:
- Hoje, os dois cartões repetem o título, a frase, o nome do arquivo (menos a extensão) e a data. O admin tem de comparar 2 cartões para ver que é o mesmo material. Na B, ele escolhe o formato num lugar só.
- Os grupos ficam com 3 e 3 cartões, sem o cartão sozinho em 1366 px. No celular, é um cartão a menos, uns 330 px a menos de rolagem.
- Os 3 toques continuam iguais.

Como deve ficar (especificação para o `web-site`; a API continua com 7 itens):
- **Título:** "Lubrificantes e Químicos", sem "(PDF)" nem "(PowerPoint)".
- **Frase:** "A apresentação comercial: em PDF para ver ou enviar, em PowerPoint para editar."
- **Ícone do cabeçalho:** o "PDF", igual ao dos outros cartões. O PowerPoint aparece no botão.
- **Dados:**
  - Arquivo: "BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial (.pdf e .pptx)";
  - Tamanho: "PDF 6,6 MB · PowerPoint 7,3 MB";
  - Atualizado em: uma data só, quando as duas são iguais. Quando forem diferentes: "PDF 14/11/2026 15:20 · PowerPoint 10/11/2026 09:00".
- **Botões:**
  - "Baixar PDF" é o principal (o verde de hoje);
  - "Baixar PowerPoint" é o secundário (`.bt .bt-claro`, fundo branco, texto `--verde-txt` e borda `--verde`, que já existe em `site/styles.css:103`), lado a lado no computador;
  - em 390 px, um embaixo do outro, cada um com a largura toda e pelo menos 44 px.
  - O nome acessível é "Baixar PDF · Lubrificantes e Químicos" e "Baixar PowerPoint · Lubrificantes e Químicos".
- **Se faltar um dos arquivos:** só aquele botão fica desabilitado, com a frase "O PowerPoint não está disponível agora." (ou "O PDF …"). O outro continua funcionando.
- **Como juntar os 2 itens:** a junção deve vir da lista fixa do serviço, por exemplo com um campo de par nos 2 itens. O nome do arquivo não deve ser lido no navegador para isso. O desenho do campo é do `integracao-placas` com o `web-site`.
- Os prints da B, em 1366 e 390 px, entram na simulação antes de ela ir ao Alexandre.

## 6. O nome da página
- 🟡 "Catálogos em PDF" deixa de ser verdade com o .pptx. Recomendo **"Catálogos e materiais"**:
  - é a soma dos 2 grupos ("Catálogos" e "Apresentações e materiais");
  - cabe no menu da conta.
- O nome novo vale no `h1`, na trilha, no `<title>` e no item do menu (`site/conta.js:71`), e o subtítulo passa a ser "Sempre a versão mais nova de cada arquivo.".
- A decisão é do Alexandre, pelo PO. A simulação deve mostrar o nome proposto.

## O que volta ao `web-site`
1. Tirar a linha "Tipo", o contador e a frase dos grupos.
2. Fazer a alternativa B (item 5).
3. Trocar os textos dos estados (item 3).
4. Mostrar "Catálogos e materiais" (item 6).
5. Gerar de novo os prints em 1366 e 390 px e mandar para o reteste do designer-ux, antes de a simulação ir ao Alexandre.

Ao levar o `sim.css` para o `admin.css`: a regra `.pdf h2` (`site/admin/admin.css:86`) deixa de ser usada e sai junto. O `h3` passa a 18 px.

## Prints conferidos
- `prints/antes_1366.png`
- `prints/antes_390.png`
- `prints/depois_1366.png`
- `prints/depois_390.png`

Também abri `admin/pdfs/index.html`, `sim.css` e `pdfs.js`.

## Reteste da v2 (22/11/2026 04:45, Manaus)

O que foi revisto: o `LEIA.md` da v2, `admin/pdfs/index.html`, `estados.html` e `sim.css`, e os prints `depois_1366`, `depois_390`, `depois_menu_1366`, `depois_menu_390`, `estados_1366` e `estados_390`. Também abri a tela no Chrome em 1366, 1100 e 800 px, para medir o par de botões e ver o foco.

### Os ajustes da v1
- 🟢 **UX 1:** a linha "Tipo" saiu. O tipo fica no ícone, na extensão e no botão.
- 🟢 **UX 2:** o grupo é só o `h2` ("Catálogos" e "Apresentações e materiais"), sem contador e sem frase.
- 🟢 **UX 3:** os estados estão com os textos do parecer, cada um numa frase. No cartão com 2 arquivos, só o botão do arquivo que falta fica desabilitado, e a frase dele aparece acima dos botões (`estados_1366` e `estados_390`).
- 🟢 **UX 4:** "Catálogos e materiais" está no `h1`, na trilha, no `<title>` e no menu da conta (`depois_menu_390`). A decisão continua com o Alexandre.
- 🟢 **UX 5 (alternativa B):**
  - são 3 e 3 cartões, sem cartão sozinho na linha em 1366 px;
  - o cartão segue a especificação do item 5;
  - a junção vem do campo `par` da lista fixa, e a API continua com 7 itens.
- 🟢 **Frase do Completo Digital:** "Todos os itens, para ver na tela." segue o modelo da Linha Moto. A troca vai ao Alexandre como mudança, junto com a pergunta do `design-de-marca`.

### A medida do par de botões (decisão do `web-site`): 🟢 aceita
- **Medidas:** os 2 botões têm 48 px de altura e 14 px de texto. O "Baixar PDF" tem 130 px de largura e o "Baixar PowerPoint", 184 px.
  - Em 1366 e em 800 px, ficam lado a lado (`sim.css`, bloco `.pdf-bts`).
  - Em 1100 px, o segundo desce para baixo do primeiro.
  - Em 390 px, ficam um embaixo do outro, com a largura toda e o texto de 16 px.
- **O toque** continua com 48 px de altura, acima dos 44 px.
- **A hierarquia** fica clara: o principal é cheio e o secundário é contornado. O foco visível aparece no secundário (contorno `--verde-txt`).
- **O texto de 14 px no par** fica um pouco menor que o "Baixar PDF" de 16 px dos cartões vizinhos. Aceito pelos 2 motivos abaixo:
  - com 16 px, o par não cabe no cartão de 1/3 e desceria em todo computador;
  - a diferença só aparece no cartão que tem 2 ações.
- **Onde o par desce** (de 1024 a 1199 px e no tablet), os 2 botões ficam alinhados à esquerda, cada um com a sua largura. Isso não segura.
- **Nota para o passo 2** (não segura; é do `web-site`, e o `corretor-redundancias` confere):
  - o `.pdf .pdf-bts .bt` repete à mão a medida do `.bt-mini` (padding de 12 px e texto de 14 px);
  - um comentário apontando para o `.bt-mini` já basta;
  - criar uma classe nova não é preciso.

### Os critérios de sempre
- 🟢 **3 toques:** menu da conta, "Catálogos e materiais" e o botão de baixar. Em 390 × 844, o primeiro botão aparece sem rolar.
- 🟢 **Sem rolagem para o lado:** nem em 1366 px, nem em 390 px.
- 🟢 **Estrutura da página:** um `h1`, toda imagem com `alt` e os ícones com `aria-hidden`.
- 🟢 **Nome dos botões para o leitor de tela:** segue o modelo "Baixar PDF · Lubrificantes e Químicos".
- 🟢 **Sem preço e sem estoque.**
- A cor do ícone e as frases são da validação do `design-de-marca` (MC-0013).

**Resultado do reteste: LIBERADO** para a simulação ir ao Alexandre, pelo PO.
