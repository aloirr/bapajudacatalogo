# T-0024 · Parecer de marca da simulação da página "Catálogos em PDF" com os 7 materiais

| Campo | Valor |
|---|---|
| Tarefa | T-0024 (downloads de todos os materiais na página "Catálogos em PDF", só o admin vê), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 22/11/2026 04:36 (Manaus) |
| O que foi visto | Simulação do `web-site` (scratchpad do gerente, `t0024-sim/`, feita a partir do main 942cf1c): `LEIA.md`, `admin/pdfs/index.html`, `admin/pdfs/sim.css`, `admin/pdfs/antes.html` e os 4 prints (antes e depois, em 1366 e 390 px). Também os 7 materiais de `catalogo_grafico/entregas/` no 942cf1c (texto com `pdftotext`, metadados com `pdfinfo` e o XML do .pptx) |
| Base de comparação | `docs/marca/manual.md` ("Nome da marca", decisão 10 a, R-20261122-032433-alexandre) e o `site/styles.css` e o `site/admin/admin.css` do main. As cópias da simulação são iguais, byte a byte. O resto do manual ainda está "a aprovar" |
| Parecer | **VOLTA PARA AJUSTE**, só por uma frase (MC-0013). Cor, tipografia, ícones e grafia estão certos. Corrigida a frase, a simulação pode ir ao Alexandre |

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
