# BAP Ajuda · Catálogo BAP: guia do repositório para o Claude Code

Catálogo da **BAP AUTOPARTS**. Tudo é em **português do Brasil**: respostas, recados, commits e docs. Horário: Manaus (UTC−4). As suposições são marcadas como **[SUPOSIÇÃO]**.

## O que mora aqui
- **Catálogo online:** `site/`. É estático e publicado no Render (`render.yaml`, só a pasta `site`).
  - Dados: `site/data/produtos.json`, gerado por `scripts/gerar_site.py` a partir da base unificada.
- **Base unificada:** `dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` é a fonte única.
  - Aba `PRODUTOS`: CODIGO_BAP, DESCRICAO, APLICACAO, REFERENCIAS_CRUZADAS, DADOS_ADICIONAIS, PRODUTO, CATEGORIA, SISTEMA, FAMILIA, LINHA, NO_CATALOGO_DIGITAL, STATUS_CADASTRO, POSICAO, LADO, DETALHE_CATALOGO, DIFERENCIAL, ITEM_PARECIDO, OFERECA_JUNTO.
  - Versões anteriores: `dados/versoes/`.
- **Catálogo gráfico e digital:** `catalogo_grafico/gerador/` (scripts Python) e as entregas em `catalogo_grafico/entregas/`.
- **Memória:** `docs/legado/` (agente do catálogo no Cowork, histórico e recados). É congelada.

## Regras que não mudam
1. **Sem preço e sem estoque** no site e em qualquer material para cliente.
   - A ficha técnica só usa a lista branca `FICHA` do `gerar_site.py`.
   - A trava `TRAVA` não deixa gravar JSON com dado interno.
   - Nunca afrouxe a trava sem o "autorizo" do Alexandre.
2. **Chaves** (API PLACAS, Google...) nunca vão para o Git, para um doc ou para o chat: só em variável de ambiente.
   - Nunca guardar, digitar ou imprimir senha, chave ou token.
3. **"Simule" quer dizer mostrar antes.** Mudança na base unificada, em layout de página ou em PDF de catálogo: a primeira entrega é a simulação, que vai para aprovação.
4. **A base unificada é dado.** Toda mudança faz três coisas:
   - gera uma nova versão em `dados/versoes/` (v15, v16...);
   - registra na aba `LOG_CORRECOES`;
   - conserva os campos digitados.
5. O BAP Ajuda 2.0 (`aloirr/bapajuda2.0`) **não é mexido daqui**: ele vai ser reformulado como aplicativo.
6. A BAP Central (`aloirr/bapcentral`) só lê a base. Avise o Alexandre quando a base mudar de formato.

## Testar antes de entregar
- `py -3 scripts/gerar_site.py` deve rodar sem erro e sem `[PARADO]`.
- Abra o site com `py -3 -m http.server 8000 -d site`.
- Teste a busca geral, a busca por veículo e a busca por código ou referência, no computador e no celular (390 px).
- Ao mudar a tela, entregue os prints.
