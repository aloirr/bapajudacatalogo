# Serviço de login do catálogo (T-0022, T-0024, T-0034)

Node 20+, **sem dependências**. Serve o `site/` inteiro atrás de login, a API das telas (contrato da T-0022), os arquivos do admin (lista fixa, T-0024), a aba Estoque (T-0034) e a lista de códigos para o serviço da placa.
Roda da raiz do repositório (sem `rootDir`): `node servicos/login/server.mjs`, na porta `PORT` (padrão 10000).

## Variáveis de ambiente

| Variável | Quem põe | Para quê |
|---|---|---|
| `PASTA_DADOS` | `render.yaml` (disco em `/var/data`) | `usuarios.json` e `logos/`. Sem ela: 503. |
| `SESSAO_SEGREDO` | `render.yaml` (`generateValue`) | assina o cookie da sessão (HMAC). Sem ela (ou com menos de 16 caracteres): 503. Trocar o valor derruba todas as sessões. |
| `ADMIN_USUARIO` | `render.yaml` | usuário do 1º admin (padrão `admin`). O 1º admin nasce com o nome "Administrador" e a empresa "BAP AUTOPARTS", a grafia oficial aprovada (resposta 10 a, MC-0008). |
| `ADMIN_SENHA_INICIAL` | **o Alexandre**, no painel (`sync: false`) | senha do 1º admin, só enquanto não há usuários. Troca obrigatória no 1º acesso. Depois do 1º usuário, é ignorada (pode ser apagada do painel). Sem ela e sem usuários: 503. |
| `CHAVE_INTERNA` | `render.yaml` (`generateValue`; a placa recebe por `fromService`) | libera o `GET /interno/codigos`. Sem ela, essa rota sempre dá 401. |
| `ORIGEM_SITE` | opcional | origens aceitas nos POST/PATCH/PUT/DELETE, separadas por vírgula (ex.: um domínio próprio). O Render já dá `RENDER_EXTERNAL_URL`, que também vale. Sem nenhuma das duas (local): vale a origem do próprio `Host`. |

Nenhuma senha, chave ou segredo vai para o Git, um doc ou um recado.

## Rodar local

```
ADMIN_SENHA_INICIAL=<de teste> SESSAO_SEGREDO=<de teste, 16+ caracteres> PASTA_DADOS=<pasta temporária> node servicos/login/server.mjs
```

Abra http://localhost:10000/ (leva a `/entrar`). Testes: `node --test servicos/login/*.test.mjs` (o Node 22 não aceita só a pasta).

## Rotas

- **Abertas:** `/entrar` (e `/entrar/`), `/entrar/entrar.css`, `/entrar/entrar.js`, `/entrar/comum.js` (o comum da tela de login e da troca de senha), `/styles.css`, `/assets/logo_escuro.png`, `/assets/logo_branco.png` e `GET /saude` (200 `ok`).
  - **[SUPOSIÇÃO]** `/styles.css` e as 2 logos da BAP (`/assets/logo_*.png`) abrem sem login para a tela de login usar o visual do site (a simulação usa o `styles.css`). Não têm dado do catálogo. O contrato só listava os arquivos de `/entrar/` e as logos (em outro caminho).
- **Com sessão:** todo o resto do `site/`. Sem sessão, pedido de página (`Accept: text/html`) → 302 `/entrar?volta=<caminho>` (ou `/entrar?expirou=1` se o cookie venceu); o resto → 401.
- **Troca pendente:** página → 302 `/trocar-senha`; outros arquivos e API → 403. Só abrem `/trocar-senha/**`, `/api/eu`, `/api/sair` e `/api/trocar-senha`.
- **Só admin** (os outros recebem 404): `/admin/**`, `/api/usuarios/**`, `/api/pdfs` e `GET /admin/pdfs/baixar/<id>` (os da lista abaixo).
- **Só com a permissão do estoque** (os outros recebem 404): `/estoque` (e `/estoque/**`) e `GET /api/estoque`. Ver **Aba Estoque**, abaixo.
- **API** (JSON; erro sempre `{"erro": "..."}`): `POST /api/entrar`, `POST /api/sair`, `GET /api/eu`, `GET /api/eu/logo`, `POST /api/trocar-senha`, `GET|POST /api/usuarios`, `PATCH /api/usuarios/<u>`, `POST /api/usuarios/<u>/senha`, `GET|PUT|DELETE /api/usuarios/<u>/logo`, `GET /api/pdfs`, `GET /api/estoque`. Detalhes no contrato da T-0022. Cada usuário da lista (`GET /api/usuarios`) traz `usuario, nome, empresa, admin, estoque, ativo, temLogo, trocarSenha, ultimoAcesso`; o `GET /api/eu` traz `usuario, nome, empresa, admin, estoque, temLogo, trocarSenha, expiraEm`.
- **Interna:** `GET /interno/codigos` com o cabeçalho `X-Chave-Interna` → `{"total": n, "codigos": [...]}`; sem a chave certa, 401.

## Arquivos do admin (T-0024, T-0032)

Lista **fixa** `PDFS` no `server.mjs` (id, título, arquivo por regex ancorada, tipo, grupo e par), só de `catalogo_grafico/entregas/`, na ordem da tela. O navegador manda só o `id`; o nome do arquivo nunca vem do pedido.

- Nome com ano: vale o de ano mais alto que casa. Nome sem ano: o nome exato.
  - **[SUPOSIÇÃO]** O `catalogo-grafico` mantém esses nomes. Se o ano entrar no nome, a regex ganha o `(\d{4})` e o `buildFilter` do `render.yaml` muda junto.
- Só abre arquivo comum, com o caminho real igual ao pedido (sem link simbólico).
- **`GET /api/pdfs`** devolve sempre a lista inteira, na ordem dela: `[{id, titulo, grupo, tipo, par, arquivo, tamanho, data}]`.
  - `par`: os itens com o mesmo `par` viram um cartão só na tela (o 1º é o principal) e têm o mesmo título; sem par, `null`.
  - Arquivo em falta: o item continua, com `arquivo`, `tamanho` e `data` `null`; o download dele dá 404.
  - `data` é a data do arquivo no disco (ISO 8601). **[SUPOSIÇÃO]** No Render, é a do deploy.
- **`GET /admin/pdfs/baixar/<id>`:** `Content-Type` pelo `tipo` da lista (`TIPO_MIME` no `server.mjs`), nunca pela extensão do pedido; `Content-Disposition: attachment`, `Cache-Control: private, no-store` e `nosniff`. O arquivo vai em stream.
- **Nunca saem:** os `.xlsx` e os `.png` de `entregas/`, o `Aplicacoes_Catalogo_Online_Antes_Depois_*.pdf`, qualquer outro arquivo que não case com a lista e qualquer coisa de `dados/`. Os testes conferem, também com `..`, `%2F` e `%2e%2e`.
- O `buildFilter` do `render.yaml` só decide quando o serviço é publicado de novo.

## Aba Estoque (T-0034)

Fonte: o `ESTOQUE_BAP.xlsx` da BAP Central (`https://raw.githubusercontent.com/aloirr/bapcentral/main/RELATORIOS/ESTOQUE_BAP.xlsx`, repositório público, leitura **sem chave**). O código fica em `estoque.mjs`.

- **Carga:** no início do serviço (cada publicação) e na **Recarga diária** (abaixo). Baixa (até 60 s), lê a 1ª aba com um leitor de xlsx mínimo (só `zlib`; aceita texto inline, sharedStrings, número e data/hora como número de série do Excel) e guarda **só na memória**. Nada vai para o disco, para o `site/` nem para o `produtos.json`.
  - Falhou (rede, 404, arquivo quebrado ou sem as colunas DATA, HORA, CIDADE, FILIAL_BAP, COD_PRODUTO, DESCRICAO_PRODUTO e ESTOQUE): o catálogo segue no ar e só a aba responde **503** `{"erro": "Estoque indisponível no momento."}`. Enquanto carrega, também 503. A recarga diária tenta de novo.
  - Limites (o serviço roda com 512 MB): download até 50 MB (lido em pedaços; para ao passar, com ou sem `Content-Length`), descompressão **total** até 64 MB (somando todas as partes do xlsx), até 200 mil linhas e 16.384 colunas. O XML é lido com uma varredura linear (`indexOf`), sem regex com retrocesso; XML sem fechamento dá erro. Passou de qualquer limite: só a aba dá 503.
  - Medido localmente com a planilha atual (cerca de 18 mil linhas): leitura em menos de 1 s, ~40 MB de memória retida (pico de ~150 a 190 MB de RSS durante a leitura); o download leva ~0,1 a 0,3 s. Cada consulta leva poucos ms.
  - Log: só `estoque ok <n> linhas <ms>ms`, `estoque indisponivel` ou `estoque recarga falhou, mantida a anterior` (sem endereço nem dado).
- **Recarga diária (T-0036, `recarga.mjs`):** sem publicar nem reiniciar, o serviço baixa a planilha de novo **todo dia às 06:00 de Manaus** (UTC−4, sem horário de verão) **[SUPOSIÇÃO do po]**, com os mesmos limites da partida.
  - O agendamento é um `setTimeout` calculado para a próxima 06:00 (`proximaRecarga`), com `unref()` (não segura o processo nem os testes). Depois de cada tentativa, com sucesso ou não, agenda a seguinte. Ao fechar o serviço, o timer é cancelado.
  - **Troca atômica:** a base nova é lida e validada à parte (as colunas obrigatórias e pelo menos 1 linha) e só então entra, numa única atribuição. A consulta é síncrona: vê a base anterior inteira ou a nova inteira, nunca uma pela metade. A `posicao` (data e hora no alto da aba) passa a ser a da planilha nova.
  - **Falhou** (as falhas da carga, acima, ou a planilha vazia): a base anterior fica, a aba segue no ar e o log leva uma linha (`estoque recarga falhou, mantida a anterior`).
  - **Uma por vez:** se uma recarga for pedida durante outra, recebe a mesma (um download só).
  - **Aba em 503** (a carga da partida falhou): além da 06:00, uma nova tentativa a cada **1 h** até dar certo **[SUPOSIÇÃO]**.
  - Memória: durante a recarga, a base anterior e a leitura da nova convivem. Medido uma vez localmente (25/11/2026, Node 22, a planilha real de 18.274 linhas, só o `estoque.mjs`, sem o HTTP e as sessões): **257 MB de pico** (maxRSS) em 3 recargas seguidas e ~230 MB depois de cada uma. Cabe nos 512 MB, com folga menor que na partida.
  - O plano `starter` do Render não dorme, então o timer roda; uma nova publicação ou reinício refaz a carga na partida e reagenda.
- **Permissão "pode ver o estoque"** (regra única, `podeVerEstoque` no `server.mjs`): o admin **sempre** pode; os outros, pelo campo `estoque: true|false` do registro. Usuário antigo sem o campo vale `false`, menos o **`bap.vendedor`**, que começa com `true` enquanto não tiver o campo gravado. O campo `estoque` das rotas (seção **Rotas**) já segue essa regra (o admin aparece com `estoque: true`).
  - `PATCH /api/usuarios/<u>` com `{"estoque": true|false}` e `POST /api/usuarios` com `"estoque"` (opcional; padrão `false`): só o admin; valor que não é booleano → 400. A mudança vale no pedido seguinte, sem derrubar a sessão.
- **`GET /estoque`** (e `/estoque/`, que servem `site/estoque/index.html`): sem sessão, como as outras páginas (302 para o `/entrar`); sem a permissão, **404** (a página simples "Não encontrado."); com a permissão, a página. Tudo em `site/estoque/` segue a mesma regra e vai com `Cache-Control: no-store`. A conferência do caminho não diferencia maiúscula (`/ESTOQUE/` também exige a permissão).
- **`GET /api/estoque?q=&filial=&com_estoque=1&categoria=&sistema=&familia=&desde=0&limite=50`** (sem sessão: 401; sem a permissão: 404; só GET; `Cache-Control: no-store`):

```
{ "posicao": {"data": "01/01/2000", "hora": "08:00"},
  "colunas": [{"campo": "CIDADE", "rotulo": "Filial", "tipo": "texto"}, ...],
  "total": 1234, "desde": 0, "limite": 50,
  "linhas": [{"CIDADE": "Mato Grosso", "FILIAL_BAP": "90000001", ...}],
  "filiais": [{"numero": "90000005", "nome": "Belém"}, ...],
  "opcoes": { "categorias": ["FREIO", "MOTOR", ...], "sistemas": [...], "familias": [...] } }
(valores fictícios)
```

  - `tipo`: `texto`, `numero`, `dinheiro` ou `markup`. Os valores vão **crus** (número como número; célula vazia como `null`); quem formata é a tela.
  - **Vendedor** (lista branca, cortada no servidor, nesta ordem): Filial (`CIDADE`, com o nome de exibição), Nº filial (`FILIAL_BAP`), Código (`COD_PRODUTO`), Descrição (`DESCRICAO_PRODUTO`), Fornecedor (`FORNECEDOR`), Estoque (`ESTOQUE`). Nenhuma outra chave sai, em nenhuma parte da resposta.
  - **Admin**: as 23 colunas de `COLUNAS_ADMIN` (`estoque.mjs`, com os rótulos e tipos em `COLUNAS`), na ordem decidida pelo Alexandre (T-0034, 24/11 17:45). DATA e HORA só vão em `posicao`.
  - Nome de exibição das cidades: `CIDADES` (`estoque.mjs`); outra cidade vai como veio.
  - `q`: todas as palavras (até 20; até 200 caracteres), sem acento e sem caixa, como trecho, em código, código do fornecedor, ID, descrição, fornecedor, cidade (como veio e o nome de exibição) e número da filial. "matogrosso" e "mato grosso" acham as duas.
  - `filial`: o número da filial (igual). `com_estoque=1`: esconde estoque 0 ou vazio.
  - `desde` (padrão 0) e `limite` (padrão 50, de 1 a 200; fora disso, vale o mais perto). Valor que não é número: o padrão. A ordem é a da planilha. `total` é o número de linhas achadas.
  - `filiais`: todas as filiais da planilha, em ordem alfabética do nome de exibição (para o filtro).
  - **Filtros de classificação (T-0035)**: `categoria`, `sistema` e `familia` (colunas CATEGORIA, SISTEMA e FAMILIA da planilha). Cada valor é o texto exato de uma opção de `opcoes`, comparado sem caixa e sem acento (até 200 caracteres); vazio ou ausente = "Todas". Somam com `q`, `filial`, `com_estoque` e a paginação. Valem para o admin e para o vendedor; o vendedor **só filtra**: as colunas dele não mudam.
  - `opcoes` (são nomes de classificação, não valores): listas de texto, como estão na planilha, em ordem alfabética, sem vazio e sem repetição, montadas **em cascata** a partir da planilha **inteira** (não dependem de `q`, `filial` nem `com_estoque`):
    - `categorias`: todas;
    - `sistemas`: os da categoria escolhida (ou todos, sem categoria);
    - `familias`: as da categoria e do sistema escolhidos (o que estiver escolhido).
  - Filtro **incoerente** [SUPOSIÇÃO, contrato da T-0035]: valor que não existe no seu nível da cascata (categoria que não há na planilha, sistema que não pertence à categoria, família que não pertence à categoria e ao sistema) é **ignorado junto com os níveis abaixo dele**, e as `opcoes` vêm coerentes com o que valeu. Ex.: `categoria=MOTOR&sistema=HIDRAULICO&familia=CILINDRO`, com HIDRÁULICO só em FREIO: vale só a categoria; `sistemas` e `familias` são os de MOTOR.
- Testes (`login.test.mjs`, sem rede): um xlsx **sintético**, com valores fictícios, montado por `xlsx-ficticio.mjs` (só de teste; o `testes/estoque-t0034.mjs` usa o mesmo), servido por um servidor local (também uma zip-bomba e uma resposta de 51 MB sem `Content-Length`); a fonte entra por `criarServico({ estoqueUrl })` (`null` = sem fonte, o padrão dos testes). A recarga (T-0036) usa relógio e `setTimeout` falsos (`criarServico({ agendar })`), e a fonte local troca de conteúdo entre uma carga e outra.

## Segurança (resumo)

- Senha: scrypt (N=16384, r=8, p=1, sal de 16 bytes), comparação em tempo constante; de 8 a 200 caracteres.
- Sessão: cookie `bap_sessao` assinado (HMAC-SHA256), `HttpOnly; Secure; SameSite=Lax`, vence **5 h depois do login**, mesmo em uso. Trocar a senha, o admin trocar a senha ou desativar o usuário derrubam as sessões dele na hora.
- Tentativas: 5 erros por usuário e 20 por IP em 15 min → 429, sempre com a mesma mensagem. O IP fica só como HMAC, em memória.
- Nos POST/PATCH/PUT/DELETE, o `Origin` precisa ser o do serviço (403 se não for).
- Arquivos: só de `site/`, sem `..`, sem arquivo oculto, sem link simbólico. Fora de `site/` só saem os arquivos da lista fixa. A base (`dados/*.xlsx`) nunca sai.
- Logo: PNG, JPG ou WEBP, até 1 MB, com o tipo conferido pelos primeiros bytes (SVG não entra). É guardada como veio (sem redução).
  - **[SUPOSIÇÃO]** O desenho aprovado falava em até 200 KB, com o serviço reduzindo a imagem. Sem dependências, não há como reduzir; por isso vale o limite de 1 MB do contrato com as telas.
- `volta` do redirecionamento ao login: vira `/` se o caminho (cru ou decodificado) tiver caractere de controle (o navegador apaga tab, LF e CR: `/%09/x` vira `//x`) ou começar com `//` ou `/\` (não leva para outro site). O `entrar.js` também confere.
- `usuarios.json`: gravação segura (`.tmp`, `fsync`, `rename`), arquivo 0600. Arquivo ilegível: o serviço fecha (503) e não sobrescreve.
- Log: só o tipo da rota, o status e o tempo (`entrar 401 52ms`), mais as linhas de partida (`login ouvindo`, `usuarios ok N`, `fechado: <motivo>`) e as do estoque (ver **Aba Estoque**). Nunca senha, hash, cookie, segredo, chave, usuário, caminho ou IP.
