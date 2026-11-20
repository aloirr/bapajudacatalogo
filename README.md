# BAP Ajuda · Catálogo BAP

Repositório **privado** do catálogo da **BAP AUTOPARTS** (Grupo PMZ, Manaus), criado em 20/11/2026.

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
| `site/` | O **catálogo online**. É um site estático: `index.html`, `app.js`, `styles.css` e `assets/`. Também tem `data/produtos.json` e `img/`, gerados pelo script. É a única pasta publicada no Render. |
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

**Atualizar o catálogo online:** dê dois cliques em `ATUALIZAR_CATALOGO.bat`. Ele faz quatro coisas:

1. traz a base e as fotos do OneDrive;
2. gera o site;
3. confere que não há dado interno;
4. envia ao GitHub. O Render publica sozinho.

## Regras

- O site **não mostra preço nem estoque**.
- A ficha técnica sai de uma **lista branca** (`FICHA` em `scripts/gerar_site.py`). Custo de importação, MOQ, ranking, fornecedor e estoque nunca saem.
- O script **para** se o JSON tiver palavra de dado interno.
- A base `.xlsx` tem dado interno. Por isso:
  - o repositório é **privado**;
  - só a pasta `site/` vai para o ar.
- Chave de API (API PLACAS, por exemplo) **nunca** entra no Git. Ela vai em variável de ambiente no Render.
- Respostas, commits e docs ficam em **português do Brasil**.
