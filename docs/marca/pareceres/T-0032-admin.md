# T-0032 · Parecer de marca da página /admin/pdfs/ (Treinamentos e portfólios por linha)

| Campo | Valor |
|---|---|
| Tarefa | T-0032, onda 1: os 7 portfólios por linha e o grupo novo "Treinamentos" (4 treinamentos) na página de materiais do admin |
| Revisor | design-de-marca |
| Data | 23/11/2026 (Manaus) |
| O que foi visto | O branch `web-site/T-0032-admin-treinamentos`, head `0d6556f6f7549e90c2394e9ff00f1e3021e804ea` (`site/admin/pdfs/pdfs.js`, `site/admin/pdfs/index.html` e `site/admin/admin.css`). Os títulos dos cartões no `servicos/login/server.mjs` do branch `integracao-placas/T-0032-materiais` (`6226033`). Os prints antes e depois em 1366 e 390 px da pasta `sim-T-0032-admin` |
| Base de comparação | O glossário de nomes (item 7 da lista de melhorias do Portfólio: "Linha + nome", com maiúscula, é o segmento ou o portfólio); os títulos e as frases das capas dos 7 portfólios (`T-0032-onda1-portfolios.md`) |
| Parecer | **LIBERADO COM AJUSTES** (MC-0027, baixo, de texto) |

Layout dos cartões e a página em 390 px: ver o parecer de UX.

## O que está certo

- **Títulos dos cartões:** "Portfólio · Linha Leve", "Portfólio · Linha Pesada", "Portfólio · Linha Moto", "Portfólio · Linha
  Lubrificantes", "Portfólio · Linha Acessórios", "Portfólio · Linha Baterias" e "Portfólio · Linha Autocenter". São
  iguais aos títulos dos PDFs, com "Linha" em maiúscula, como no glossário. "Treinamento · Mecânica Básica",
  "Treinamento · Baterias", "Treinamento · Linha Moto" e "Treinamento · Lubrificantes" saem iguais à capa de cada um.
- **Grupo "Treinamentos":** o nome está certo e combina com "Catálogos" e "Apresentações e materiais".
- Nenhuma cor, fonte ou logo novo. O rodapé ("BAP AUTOPARTS - Componentes de qualidade") e o selo "Só o administrador vê
  esta página" são iguais aos de antes.

## MC-0027 · Frases e título da página (dono: `web-site`)

| ID | Onde | Tipo | Fere | Gravidade | Dono |
|---|---|---|---|---|---|
| MC-0027 | `site/admin/pdfs/pdfs.js` (o mapa `USO`) e `site/admin/pdfs/index.html` (`<title>`, trilha e `<h1>`) | voz | glossário de nomes (manual a aprovar) | baixa | web-site |

**1. Título da página:** sim, passa a **"Catálogos, materiais e treinamentos"**. Agora são 3 grupos, e o vendedor
procura "treinamento" pelo nome. Vale para:
- o `<title>`: "Catálogos, materiais e treinamentos · Catálogo online BAP";
- a trilha: "Catálogo › Catálogos, materiais e treinamentos";
- o `<h1>`.

Se o atalho do menu do admin tiver o mesmo nome, ele muda junto.

**2. Frases dos portfólios (antes → depois):**

| Cartão | Antes | Depois |
|---|---|---|
| Linha Leve | "Só a linha leve, por sistema e família." | **"Só a Linha Leve, por sistema e família."** |
| Linha Pesada | "Só a linha pesada, por sistema e família." | **"Só a Linha Pesada, por sistema e família."** |
| Linha Moto | "Só a linha de moto, por sistema e família." | **"Só a Linha Moto, por sistema e família."** |
| Linha Lubrificantes | "Só os lubrificantes e químicos, por sistema e família." | fica |
| Linha Acessórios | "Só os acessórios, por sistema e família." | fica |
| Linha Baterias | "Só as baterias, por sistema e família." | **"Só as baterias da Linha Leve e da Linha Pesada, com a tabela dos códigos."** (o PDF é organizado por linha de veículo, e não por sistema e família) |
| Linha Autocenter | "Só a linha autocenter, por sistema e família." | **"Os itens de troca rápida do autocenter, por sistema e família."** (a frase da capa) |

**3. Frases dos treinamentos:** hoje as 4 repetem "…para os vendedores: em PDF para ler, em PowerPoint para
apresentar.", e só muda o assunto. O grupo "Treinamentos" já diz para quem é. A frase deve dizer o que tem dentro:

| Cartão | Depois |
|---|---|
| Mecânica Básica | **"Os sistemas do carro e a peça certa para cada sintoma: em PDF para ler, em PowerPoint para apresentar."** |
| Baterias | **"Tecnologias, teste, garantia e venda de baterias: em PDF para ler, em PowerPoint para apresentar."** |
| Linha Moto | **"Pneus, câmaras, óleo, velas e rolamentos de moto: em PDF para ler, em PowerPoint para apresentar."** |
| Lubrificantes | **"Óleos ProActive, Shiftease e Effitech e os químicos: em PDF para ler, em PowerPoint para apresentar."** |

Se o `designer-ux` achar a frase longa para o cartão em 390 px, o fim ("em PDF para ler, em PowerPoint para
apresentar") pode sair, porque os 2 botões já dizem isso. A escolha é dele.

## Para a fila (sem achado)

A página tem 3 cartões com "Linha Moto": o catálogo interno, o portfólio e o treinamento. O do catálogo interno diz "Só
os itens de moto, para ver na tela.". Como aquele PDF é "uso interno", recomendo "Só os itens de moto, para ver na tela.
Uso interno, não enviar ao cliente.", para o vendedor não mandar o PDF errado.

## Reteste

No print novo (1366 e 390 px): o título, a trilha e o `<h1>`, as 5 frases de portfólio e as 4 de treinamento.
Fechar o MC-0027.
