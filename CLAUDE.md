# BAP Ajuda · Catálogo BAP: guia do repositório para o Claude Code

Catálogo da **BAP AUTOPARTS**. Tudo é em **português do Brasil**: respostas, recados, commits e docs. Horário: Manaus (UTC−4). As suposições são marcadas como **[SUPOSIÇÃO]**.

## O que mora aqui
- **Catálogo online:** `site/`, servido só com login pelo serviço `servicos/login/` (T-0022) em bapajudacatalogo-login.onrender.com (`render.yaml`); o endereço antigo redireciona para o novo.
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

## Time e quadro
- **11 agentes** em `.claude/agents/`; como trabalham: `.coord/README.md`.
  - `po`: o **único** que conversa com o Alexandre. Transforma o pedido em tarefa e colhe o "aprovado".
  - `gerente-projetos`: divide em passos, chama os agentes, cobra testes e revisão, abre o PR.
  - Donos de pasta: `catalogo-dados` (`dados/`), `catalogo-grafico` (`catalogo_grafico/`), `web-site` (`site/` e `scripts/gerar_site.py`), `integracao-placas` (`servicos/placas/` e `servicos/login/`).
  - Conferência: `testes` (gerar_site, buscas, prints 1366 e 390 px), `designer-ux` (especificação e revisão de UX de tela e PDF; dono de `docs/ux/`), `design-de-marca` (guarda a marca BAP no site e nos PDFs; dono de `docs/marca/`), `revisor-codigo` (revisão independente de cada PR) e `corretor-redundancias` (excesso e repetição em todo PR que muda código, site, base ou PDF, antes do fechamento; PR só de documentos passa só pelo `revisor-codigo`, R-20261123-112006-alexandre; achados RD-nnnn em `docs/qualidade/redundancias/`).
  - `designer-ux`, `design-de-marca` e `corretor-redundancias` só leem e apontam: cada um escreve só na sua pasta.
- **Quadro:** `.coord/quadro.md`, uma tarefa por arquivo em `.coord/tarefas/T-nnnn.md`.
  - Cada tarefa tem o pedido **literal** do Alexandre, a especificação e os critérios de aceite.
- **Donos:** `.coord/donos.json`. Só o dono mexe na pasta.
  - `.claude/**`, `.coord/donos.json`, `render.yaml`, `.github/**`, `CLAUDE.md` e `.gitignore` são do **Alexandre**.
- **Caminho:** pedido → `po` → tarefa → `gerente-projetos` → donos → `testes` → `designer-ux` e `design-de-marca` (em mudança de tela, PDF ou marca) → `revisor-codigo` → `corretor-redundancias` (só em PR que muda código, site, base ou PDF) → PR → `po`.
  - **Merge (R-20261120-111308-alexandre):** o `po` autoriza todos os merges, inclusive os de governança, depois de conferir o número, o SHA do head, os arquivos, o CI verde e as revisões LIBERADO; cada autorização fica em recado, com o número e o SHA. O `gerente-projetos` executa o merge.
  - Todo merge é squash, com expectedHeadSha e, no corpo, 'Agente: <dono>' e a tarefa (R-20261120-131230-alexandre).
  - O guardião confere todo merge (pelo terminal e pela integração do GitHub): o SHA do head (40 caracteres), o CI do PR verde e esse recado do `po` (ou do Alexandre), publicado no `bapajudacatalogo-recados` (T-0016).
  - As simulações de tela e de PDF continuam indo ao Alexandre.
  - **"autorizo"** libera, só naquela tarefa, o que a regra trava (ex.: a `TRAVA` ou a `FICHA`).

## Testar antes de entregar
- `py -3 scripts/gerar_site.py` deve rodar sem erro e sem `[PARADO]`.
- Abra o site com `py -3 -m http.server 8000 -d site`.
- Teste a busca geral, a busca por veículo e a busca por código ou referência, no computador e no celular (390 px).
- Ao mudar a tela, entregue os prints.

<!-- SESSOES-E-RECADOS (20/11/2026) -->
## Sessões e recados (igual à BAP Central)
- A variável **`BAP_AGENTE`** do ambiente do claude.ai/code define o papel da sessão (hook `SessionStart` `.claude/hooks/papel-da-sessao.mjs`):
  - **BapAjuda-PO** → `po`: é onde o Alexandre conversa;
  - **BapAjuda-GP** → `gerente-projetos`: sessão fixa do gerente, que chama os outros agentes como subagentes.
  - Sem a variável, a sessão é **restrita**: os guardiões não deixam alterar nada.
- **Recados** ficam no **`aloirr/bapajudacatalogo-recados`**. A sessão abre com **os dois repositórios anexados** (este e o de recados).
  - Leia e grave **só com `node scripts/coord.mjs`** (`caixa`, `pendencias`, `ler`, `fio`, `enviar`, `lido`). Com o clone anexado, ele grava **com git**: `pull --rebase`, commit com o nome do agente (`<agente>@bapajuda.invalid`) e `push origin HEAD:main`, pela integração de GitHub do próprio Claude. Nenhum token entra.
  - **Ponte do po (R-20261120-150200-alexandre):** só o `po` grava recado do Alexandre, com `node scripts/coord.mjs enviar --de alexandre --ponte …` (cabeçalho "via: po", autor `po@bapajuda.invalid`); esse recado nunca vale como autorização de merge.
  - **Nunca grave pela API do GitHub:** o proxy da nuvem bloqueia ("Write access to this GitHub API path is not permitted through this proxy").
  - **Autorizado pelo Alexandre (20/11/2026):** gravar direto no `main` do `bapajudacatalogo-recados`, só em `recados/` e `lidos/`. O código deste repositório continua indo por branch e PR.
- **Donos:** `.coord/donos.json` (a primeira regra que casa manda). Governança (`.claude`, `donos.json`, `coord*.mjs`, `.github`, `render.yaml`, `CLAUDE.md`, `.gitignore`): merge como em **Merge**, acima.
- Recado do celular: issue com o formulário **Recado** no `aloirr/bapajudacatalogo-recados` (conta domontecristo).
<!-- /SESSOES-E-RECADOS -->

## Graphify (mapa do código, T-0020)
- O mapa fica em `graphify-out/` (fora do Git). Ele é montado no setup do ambiente, só com o código: `GRAPHIFY_BACKEND=none graphify extract . --code-only` e depois `graphify cluster-only .` (sem `GRAPHIFY_BACKEND=none` ele chama um LLM e gasta token: nunca rode sem).
- **Antes de procurar no código**, use o mapa: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"` ou `graphify explain "<conceito>"`. Abra o arquivo só nas linhas que o mapa apontar. Ponha esta regra no prompt de todo subagente que explora código.
- **Trava (pedido do Alexandre, 24/11/2026):** `Read`, `Grep` e a leitura pelo Bash (`cat`, `sed`, `grep`, `rg`...) em arquivo de código só depois de a sessão rodar `graphify query`, `explain` ou `path` (ou ler `graphify-out/GRAPH_REPORT.md`); arquivo grande só com offset/limit. Não desliga com `BAP_GUARDA=off`. Pastas, extensões e limite: `.claude/hooks/guarda-graphify-lib.mjs`.
- **Depois de mudar código**, rode `graphify update .`.
- PDFs, imagens e docs ficam fora do mapa.
