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

## Time e quadro
- **8 agentes** em `.claude/agents/`; como trabalham: `.coord/README.md`.
  - `po`: o **único** que conversa com o Alexandre. Transforma o pedido em tarefa e colhe o "aprovado".
  - `gerente-projetos`: divide em passos, chama os agentes, cobra testes e revisão, abre o PR.
  - Donos de pasta: `catalogo-dados` (`dados/`), `catalogo-grafico` (`catalogo_grafico/`), `web-site` (`site/` e `scripts/gerar_site.py`), `integracao-placas` (`servicos/placas/`, fase 3).
  - Conferência: `testes` (gerar_site, buscas, prints 1366 e 390 px) e `revisor-codigo` (revisão independente de cada PR).
- **Quadro:** `.coord/quadro.md`, uma tarefa por arquivo em `.coord/tarefas/T-nnnn.md`.
  - Cada tarefa tem o pedido **literal** do Alexandre, a especificação e os critérios de aceite.
- **Donos:** `.coord/donos.json`. Só o dono mexe na pasta.
  - `.claude/**`, `.coord/donos.json`, `render.yaml`, `.github/**`, `CLAUDE.md` e `.gitignore` são do **Alexandre**.
- **Caminho:** pedido → `po` → tarefa → `gerente-projetos` → donos → `testes` → `revisor-codigo` → PR → `po` → Alexandre.
  - Nenhum PR vai para o `main` sem o **"aprovado"** do Alexandre. O merge é dele.
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
  - **Nunca grave pela API do GitHub:** o proxy da nuvem bloqueia ("Write access to this GitHub API path is not permitted through this proxy").
  - **Autorizado pelo Alexandre (20/11/2026):** gravar direto no `main` do `bapajudacatalogo-recados`, só em `recados/` e `lidos/`. O código deste repositório continua indo por branch e PR.
- **Donos:** `.coord/donos.json` (a primeira regra que casa manda). Governança (`.claude`, `donos.json`, `coord*.mjs`, `.github`, `render.yaml`, `CLAUDE.md`, `.gitignore`) só com o recado do Alexandre "autorizo o merge do PR #N no commit <sha>".
- Recado do celular: issue com o formulário **Recado** no `aloirr/bapajudacatalogo-recados` (conta domontecristo).
<!-- /SESSOES-E-RECADOS -->
