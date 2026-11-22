# T-0024 · Parecer de marca da simulação da página "Catálogos em PDF" com os 7 materiais

| Campo | Valor |
|---|---|
| Tarefa | T-0024 (downloads de todos os materiais na página "Catálogos em PDF", só o admin vê), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 04:36 (Manaus) |
| O que foi visto | Simulação do `web-site` (scratchpad do gerente, `t0024-sim/`, feita a partir do main 942cf1c): `LEIA.md`, `admin/pdfs/index.html`, `admin/pdfs/sim.css`, `admin/pdfs/antes.html` e os 4 prints (antes e depois, em 1366 e 390 px). Também os 7 materiais de `catalogo_grafico/entregas/` no 942cf1c (texto com `pdftotext`, metadados com `pdfinfo` e o XML do .pptx) |
| Base de comparação | `docs/marca/manual.md` ("Nome da marca", decisão 10 a, R-20261122-032433-alexandre) e o `site/styles.css` e o `site/admin/admin.css` do main. As cópias da simulação são iguais, byte a byte. O resto do manual ainda está "a aprovar" |
| Parecer | Página final (PR #134, head 103cf25): **LIBERADO**, em 22/11 04:57. Simulação: **LIBERADO** no reteste da v2, em 22/11 04:44. Primeira leitura (v1): **VOLTA PARA AJUSTE**, só por uma frase (MC-0013). Cor, tipografia, ícones e grafia estavam certos |

Não há nada contra as regras do repositório: a tela não mostra preço nem estoque; não há logo, símbolo nem cor de
terceiros. O "PowerPoint" aparece só como texto (nome do tipo de arquivo), e o ícone não usa o laranja nem o desenho da
Microsoft.

## O que está certo (manter)

- **Cor:** o `sim.css` só usa tokens do `:root`. Não há hex novo.
  - Ícone do PDF: o de hoje (`--escuro`, faixa `--verde`, "PDF" em branco, 18,26:1).
  - Ícone do PowerPoint: fundo `--verde-txt` (`#2E6B1F`), faixa e "PPT" em `--branco`. Branco no `--verde-txt` dá
    6,48:1. É o verde escuro que o site já usa para texto e para o `:hover` do botão, e não uma cor "quase igual".
    A faixa branca, e não a `--verde`, está certa: o `--verde` no `--verde-txt` daria 2,69:1 e a faixa sumiria.
  - Os dois ícones são o mesmo desenho e só trocam o fundo. Dá para distinguir o tipo sem trazer a cor da Microsoft.
  - Botões: os `.bt` do site (`--escuro` no `--verde`, 7,58:1), iguais aos de hoje. A etiqueta "Só o administrador vê
    esta página" e a faixa escura do alto são as da T-0022, já aprovadas (decisão 9 a).
  - O contador "3 arquivos" e as frases dos grupos usam `--texto-2` no `--fundo` (5,7:1).
- **Tipografia:** Poppins nos pesos do site. Os h2 dos grupos (20 px) e os h3 dos cartões (18 px) ficam na escala da
  página (h1 maior, cartão menor). O título do cartão era um h2 de 19 px e agora é um h3 de 18 px: fica quase igual.
  Não há fonte nova.
- **Logo e rodapé:** o `logo_branco` no cabeçalho escuro, o logo inteiro da BAP, pequeno, no botão do canto do admin
  (decisão 7 a) e o rodapé de sempre. Nada muda em relação ao "antes".
- **Grafia "BAP AUTOPARTS":** está certa nos três lugares da tela. São a empresa do admin no botão do canto, o rodapé
  ("© 2026 - BAP AUTOPARTS - Componentes de qualidade…") e o nome do arquivo `Portfolio_Produtos_BAP_AUTOPARTS.pdf`.
  - Não aparece "BAP AUTO PARTS" nem "BAP Autoparts".
  - As frases usam a forma curta "a BAP" ("A BAP e todas as linhas…", "Para apresentar a BAP…"), como o menu do site
    ("Sobre a BAP"). O manual não proíbe a forma curta.
  - Nos 7 materiais, a grafia também está certa depois da T-0023: texto, metadados (autor "BAP AUTOPARTS" nos 6 PDFs)
    e o .pptx (5 ocorrências, nenhuma errada).
- **Tom de voz:** as frases são curtas e dizem para que serve cada arquivo, que é o que o admin precisa no balcão ou
  no escritório:
  - "Para mandar imprimir na gráfica." · "Só os itens de moto, para ver na tela." · "A BAP e todas as linhas, por sistema
    e família." · "A apresentação comercial, para ver ou enviar." · "A mesma apresentação, para editar ou apresentar." ·
    "Os kits de filtros de cada veículo."
  - As frases dos grupos ("Os catálogos de produtos, com as aplicações." e "Para apresentar a BAP e as linhas de
    produto.") seguem o mesmo tom.
  - Os nomes dos cartões são os nomes das entregas: Completo Digital, A4 gráfica, Linha Moto, Portfólio de Produtos,
    Lubrificantes e Químicos, Kit Filtros. A exceção é o MC-0013.
  - "Para ver ou enviar" nos Lubrificantes (PDF) está certo: essa apresentação não tem a marca de uso interno.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0013 | Cartão "Completo Digital", 1366 e 390 px; `admin/pdfs/index.html` da simulação e, no site, `site/admin/pdfs/pdfs.js:9` (`USO["completo-digital"]`) | voz | manual a aprovar (tom de voz; a mensagem da tela tem de bater com a do material) | média | Ver abaixo | web-site (aplica); designer-ux (texto de interface) |

### MC-0013 · O cartão manda enviar aos clientes um material que diz "uso interno e confidencial"

O Completo Digital traz, em 309 das 311 páginas, "USO INTERNO E CONFIDENCIAL — material exclusivo do time BAP". O título
dele nos metadados é "Catálogo BAP 2027 — Completo (uso interno)". O cartão diz "Para enviar aos clientes e ver na
tela.". Uma tela da BAP manda fazer o que o próprio material proíbe.
- Se o admin seguir a tela, o cliente recebe um arquivo carimbado "confidencial". Isso passa a impressão de
  descuido, ou de que o cliente viu algo que não devia ver.
- O A4 e a Linha Moto têm a mesma marca, mas as frases deles não falam em cliente. Não há conflito neles.

**Texto recomendado:** "Para enviar aos clientes e ver na tela." → **"Todos os itens, para ver na tela."**
- Ele anda junto com o da Linha Moto ("Só os itens de moto, para ver na tela.") e mostra a diferença entre os dois em
  poucas palavras.
- Ele não promete envio ao cliente e não repete "uso interno" no cartão. Quem precisa do aviso já o recebe no material,
  e a página só o admin vê.

**Por que não "Para ver na tela."**, a outra opção do `web-site`: ela fica igual ao fim da frase da Linha Moto e não
diz o que o Completo tem a mais.

**Ponto para o Alexandre (pelo `po`), na mesma simulação:**
- A frase de hoje já esteve nas telas da T-0022, aprovadas como simuladas (decisão 9 a). A troca tem de aparecer no
  pacote como mudança, com o antes e o depois.
- Também é bom perguntar: **ele quer um catálogo completo para mandar aos clientes?**
  - Se quiser, isso é outro material, sem a marca de uso interno. O dono é o `catalogo-grafico`, numa tarefa própria,
    com simulação.
  - Até lá, a frase do cartão segue o que o PDF diz.

**O que o `web-site` corrige na simulação:** a frase do cartão (o `index.html` da simulação e, no passo 2, o
`USO["completo-digital"]` do `pdfs.js`). Depois, refazer os prints `depois_1366.png` e `depois_390.png`. Nada mais muda.

## O que a simulação não mostra (não é da T-0024)

Os materiais vão para a página do jeito que estão. Os ajustes de marca neles já estão na T-0025 (dono `catalogo-grafico`).
Lá estão o .pptx em Arial e o PDF em Poppins (MC-0011), o tamanho do logo no cabeçalho de Lubrificantes (MC-0012,
[SUPOSIÇÃO] se o PO confirmar) e o título "Completo (uso interno)" nos metadados da Linha Moto. Nenhum desses pontos
segura a T-0024.

## Reteste da v2 (22/11/2026 04:44, Manaus)

O que foi visto: o `LEIA.md` da v2, os arquivos `admin/pdfs/index.html`, `estados.html` e `sim.css`, o `conta-sim.js`
e os prints `depois_*`, `depois_menu_*` e `estados_*`, em 1366 e 390 px. A v2 aplica o MC-0013 e os ajustes de UX:
- o nome "Catálogos e materiais";
- um cartão só para os Lubrificantes, com 2 botões;
- os cartões sem a linha "Tipo";
- os grupos sem o contador e sem a frase.

**Parecer: LIBERADO.** A simulação pode ir ao Alexandre.

- **MC-0013: fechado.** O cartão do Completo Digital diz "Todos os itens, para ver na tela.", em 1366 e 390 px.
  - O `LEIA.md` leva a troca ao Alexandre como mudança da frase aprovada na T-0022, com os prints de antes.
  - A pergunta sobre um catálogo para clientes também vai junto.
- **Cor:**
  - Só tokens. O `sim.css` da v2 não tem nenhum hex.
  - O "Baixar PowerPoint" é o `.bt-claro` que o site já usa: fundo `--branco`, borda `--verde` e texto `--verde-txt`
    (6,48:1). Como botão secundário ao lado do `.bt` verde, fica a hierarquia certa, com as cores da marca.
  - Botão desabilitado (arquivo em falta): o `opacity: .6` que já existe (`entrar.css:44`). Não é cor nova.
  - Erro ao carregar: `--erro` no `--erro-claro`, que é o papel aprovado na decisão 8 a. O vermelho não aparece em nenhum
    outro lugar da tela.
  - O ícone do PowerPoint saiu. O cartão dos Lubrificantes usa o ícone "PDF", igual aos outros. Para a marca, isso
    é neutro: o desenho é um só, e o tipo aparece no botão e na extensão do arquivo.
- **Tipografia:**
  - Só Poppins.
  - No par de botões dos Lubrificantes, o texto cai para 14 px no computador, a mesma medida do `.bt-mini` do site, com
    o mesmo peso. Volta a 16 px no celular.
  - Os botões dos outros cartões ficam com 16 px. É uma diferença pequena e de uma medida que já existe no site,
    então não abro achado. Se o `designer-ux` preferir 16 px em todos, também está certo para a marca.
- **Grafia "BAP AUTOPARTS":** está certa no botão do canto, no menu aberto (empresa do admin), no rodapé e no nome do
  arquivo do Portfólio. Não aparece grafia errada.
- **Tom de voz:**
  - "Catálogos e materiais" e "Sempre a versão mais nova de cada arquivo." são diretos e dizem o que a página tem.
    O nome fica certo também com o .pptx. Escolher entre ele e "Catálogos em PDF" é decisão do Alexandre: os dois servem
    para a marca.
  - "A apresentação comercial: em PDF para ver ou enviar, em PowerPoint para editar." segue o tom das outras frases.
  - Textos de estado:
    - "Este arquivo não está disponível agora. Tente de novo mais tarde.";
    - "Nenhum arquivo por enquanto.";
    - "Não foi possível carregar os arquivos agora. Atualize a página em instantes.".
  - Esses textos são do `designer-ux`. Na voz da marca, estão certos: são curtos, calmos e sem culpar quem usa.
- **Regras do repositório:** sem preço, sem estoque e sem marca de terceiros. O "PowerPoint" aparece só como texto.

Nenhum achado novo. Os pontos dos materiais (MC-0011 e MC-0012) continuam na T-0025.

## Página final (PR #134, 22/11/2026 04:57, Manaus)

O que foi visto:
- o branch `web-site/T-0024-pagina`, head `103cf257e4161bebab52a7e55ceb7591fbf87502`;
- o diff `origin/main...103cf25 -- site`: `site/admin/admin.css`, `site/admin/pdfs/index.html`, `site/admin/pdfs/pdfs.js`,
  `site/conta.js` e `site/styles.css` (só um comentário);
- os 14 prints da página (scratchpad do gerente, `t0024-pag/prints/`): antes, depois, menu aberto e os estados de arquivo
  em falta, datas diferentes, lista vazia e erro, em 1366 e 390 px.

A base de comparação é a simulação v2 liberada acima (o `sim.css`, o `index.html`, o `estados.html` e os prints dela).

**Parecer: LIBERADO.** A página é a simulação v2, sem desvio de marca.

- **Cor:**
  - O bloco novo do `admin.css` é o `sim.css` da v2, regra por regra, e só usa tokens. O diff não traz nenhum hex.
  - No print de 1366 px, o "Baixar PDF" mede `#62BB47` (`--verde`), com o texto `--escuro`. O "Baixar PowerPoint" tem
    fundo `#FFFFFF`, borda `--verde` e texto `--verde-txt` (o `.bt-claro` de `styles.css:103`). O ícone "PDF" é
    `#151515` com a faixa `--verde`, e o fundo da página é `#F4F5F4`. É igual à simulação.
  - O botão desabilitado usa o `opacity` que já existe. O erro usa `--erro` no `--erro-claro` (decisão 8 a).
- **Tipografia:**
  - Só Poppins. Os títulos dos grupos têm 20 px, os dos cartões 18 px (h3), e os botões do par têm 14 px no computador
    e 16 px no celular. As medidas são as da v2.
  - A regra antiga `.pdf h2` (19 px) saiu, como a simulação pedia.
- **Grafia "BAP AUTOPARTS":**
  - Está certa no botão do canto, no menu aberto, no rodapé e no nome do arquivo do Portfólio.
  - O diff não traz "BAP AUTO PARTS" nem "BAP Autoparts". A forma curta "a BAP" continua nas frases.
- **A frase do Completo Digital:** "Todos os itens, para ver na tela." está no `pdfs.js` (`USO["completo-digital"]`) e
  aparece nos prints de 1366 e 390 px. É o texto do MC-0013, que continua fechado.
  - A frase antiga ("Para enviar aos clientes e ver na tela.") saiu do site.
- **O nome "Catálogos e materiais":**
  - Está igual nos 5 lugares: o título da aba, a trilha, o h1, o item do menu da conta (`conta.js`) e os comentários.
  - Nenhum "Catálogos em PDF" ficou em `site/` (`git grep` no 103cf25).
  - Os nomes dos grupos ("Catálogos" e "Apresentações e materiais") e os textos de estado são os da v2, palavra por
    palavra.
- **Regras do repositório:** sem preço, sem estoque e sem marca de terceiros. O "PowerPoint" aparece só como texto, e o
  ícone continua o "PDF" da BAP.

Nenhum achado novo. O MC-0011 e o MC-0012 (nos materiais) continuam na T-0025 e não seguram a T-0024.
