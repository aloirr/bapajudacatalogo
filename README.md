# BAP Ajuda · Catálogo BAP

Repositório do catálogo da **BAP AUTOPARTS** (Grupo PMZ, Manaus), criado em 20/11/2026.

A partir de 20/11/2026, **tudo de catálogo mora aqui**:

- base unificada;
- base de produto;
- catálogo gráfico;
- catálogo digital;
- o **catálogo online**.

O BAP Ajuda 2.0 (`aloirr/bapajuda2.0`) continua como está e vai ser reformulado como aplicativo. A BAP Central (`aloirr/bapcentral`) só **lê** a base unificada.

## Pastas

| Pasta | O que tem |
|---|---|
| `site/` | O **catálogo online**. É um site estático: `index.html`, `app.js`, `styles.css` e `assets/`. Também tem `data/produtos.json` e `img/`, gerados pelo script. No ar, é servida só com login pelo `servicos/login/` (T-0022). |
| `scripts/gerar_site.py` | Lê a base unificada e gera `site/data/produtos.json` e as fotos reduzidas de `site/img/`. |
| `dados/` | `BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` é a **fonte única** do catálogo. `versoes/` guarda as versões v8 a v14. |
| `catalogo_grafico/` | O gerador do catálogo impresso e do PDF digital (`gerador/`), as entregas (PDFs 2026/2027, Linha Moto, Portfólio, Kit Filtros, conferências) e o `LEIA-ME.md`. |
| `docs/` | `ROADMAP.md` (placa, app, Render), `DADOS_DO_SITE.md` (o que vai e o que nunca vai para o site) e `legado/` (o agente do catálogo no Cowork, o histórico e os recados). |

## Rodar o site no PC

```bat
py -3 -m pip install -r requirements.txt
py -3 scripts\gerar_site.py --fotos "<pasta FOTOS DOS PRODUTOS>"
py -3 -m http.server 8000 -d site
```

Depois abra http://localhost:8000.

**Atualizar o catálogo online** (T-0012; o `ATUALIZAR_CATALOGO.bat` não existe mais):

- A base oficial é a do repositório (`dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`). O OneDrive deixou de ser a fonte.
- **Correção de produto:** peça no chat do PO. O time mostra a simulação e, com o "aprovado", grava a nova versão (`dados/versoes/`), o `LOG_CORRECOES` e o site.
- **Fotos novas:** no GitHub, na pasta `fotos-novas/`, use **Add file → Upload files**, com os arquivos `CODIGO.jpg`, e escolha **"Create a new branch… and start a pull request"**. O time reduz as fotos, gera o site, confere e pede o "aprovado".
- **Publicação:** o Render publica sozinho a cada merge no `main` (regra 5a, recado R-20261120-100005-alexandre).

## Testar antes de entregar

1. Gere os dados: `py -3 scripts/gerar_site.py` (na nuvem: `python3`). Tem de terminar sem `[ERRO]` e sem `[PARADO]`.
2. Rode os testes automáticos: `node scripts/testar_site.mjs --conhecidos testes/conhecidos.json`.
   - Eles conferem:
     - a palavra interna no `produtos.json`;
     - as buscas por código, por referência, por veículo e por texto livre, e a busca sem resultado;
     - a página do produto, sem preço nem estoque;
     - o celular: 390 px sem rolar de lado;
     - o console e a acessibilidade básica.
   - Saem com 0 se passou e com 1 se falhou, com o resumo em português. Os prints em 1366 e 390 px ficam em `testes/prints/ultima/`.
   - `testes/conhecidos.json` lista os achados que já têm tarefa aberta. Eles aparecem como CONHECIDO e não derrubam o teste. Sem `--conhecidos`, tudo conta.
   - Precisa do Node 22 e do Playwright. No PC, uma vez só: `npm install -g playwright` e `npx playwright install chromium`. [SUPOSIÇÃO: ainda não testado no Windows.]
3. Para olhar com os próprios olhos: `py -3 -m http.server 8000 -d site` e abra http://localhost:8000.
4. Em cada PR, o CI do GitHub roda os passos 1 e 2 e guarda os prints como artefato, quando o workflow da T-0002 estiver no `main`.
5. Ao mudar a tela, entregue os prints.

## Regras

- O site **não mostra preço nem estoque**.
- A ficha técnica sai de uma **lista branca** (`FICHA` em `scripts/gerar_site.py`). Custo de importação, MOQ, ranking, fornecedor e estoque nunca saem.
- O script **para** se o JSON tiver palavra de dado interno.
- A base `.xlsx` tem dado interno. Por isso:
  - o repositório vai ficar **privado**; até a troca, ele está **público**: nada de dado interno novo no Git (o de recados é público);
  - no ar só vão o `site/` (atrás do login) e os PDFs da lista fixa do serviço de login.
- Chave de API (API PLACAS, por exemplo) **nunca** entra no Git. Ela vai em variável de ambiente no Render.
- Respostas, commits e docs ficam em **português do Brasil**.
