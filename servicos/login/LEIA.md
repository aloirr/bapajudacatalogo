# Serviço de login do catálogo (T-0022, T-0024)

Node 20+, **sem dependências**. Serve o `site/` inteiro atrás de login, a API das telas (contrato da T-0022), os arquivos do admin (lista fixa, T-0024) e a lista de códigos para o serviço da placa.
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
- **API** (JSON; erro sempre `{"erro": "..."}`): `POST /api/entrar`, `POST /api/sair`, `GET /api/eu`, `GET /api/eu/logo`, `POST /api/trocar-senha`, `GET|POST /api/usuarios`, `PATCH /api/usuarios/<u>`, `POST /api/usuarios/<u>/senha`, `GET|PUT|DELETE /api/usuarios/<u>/logo`, `GET /api/pdfs`. Detalhes no contrato da T-0022. Cada usuário da lista (`GET /api/usuarios`) traz `usuario, nome, empresa, admin, ativo, temLogo, trocarSenha, ultimoAcesso`.
- **Interna:** `GET /interno/codigos` com o cabeçalho `X-Chave-Interna` → `{"total": n, "codigos": [...]}`; sem a chave certa, 401.

## Arquivos do admin (T-0024)

Lista **fixa** `PDFS` no `server.mjs` (id, título, arquivo por regex ancorada, tipo, grupo e par), só de `catalogo_grafico/entregas/`, na ordem da tela. O navegador manda só o `id`; o nome do arquivo nunca vem do pedido.

- Nome com ano: vale o de ano mais alto que casa. Nome sem ano: o nome exato.
  - **[SUPOSIÇÃO]** O `catalogo-grafico` mantém esses nomes. Se o ano entrar no nome, a regex ganha o `(\d{4})` e o `buildFilter` do `render.yaml` muda junto.
- Só abre arquivo comum, com o caminho real igual ao pedido (sem link simbólico).
- **`GET /api/pdfs`** devolve sempre a lista inteira, na ordem dela: `[{id, titulo, grupo, tipo, par, arquivo, tamanho, data}]`.
  - `par` é `"lubrificantes"` nos 2 dos Lubrificantes e `null` nos outros. Os itens com o mesmo `par` viram um cartão só na tela (o 1º é o principal).
  - Arquivo em falta: o item continua, com `arquivo`, `tamanho` e `data` `null`; o download dele dá 404.
  - `data` é a data do arquivo no disco (ISO 8601). **[SUPOSIÇÃO]** No Render, é a do deploy.
- **`GET /admin/pdfs/baixar/<id>`:** `Content-Type` pelo `tipo` da lista (`TIPO_MIME` no `server.mjs`), nunca pela extensão do pedido; `Content-Disposition: attachment`, `Cache-Control: private, no-store` e `nosniff`. O arquivo vai em stream.
- **Nunca saem:** os `.xlsx` e os `.png` de `entregas/`, o `Aplicacoes_Catalogo_Online_Antes_Depois_*.pdf`, qualquer outro arquivo que não case com a lista e qualquer coisa de `dados/`. Os testes conferem, também com `..`, `%2F` e `%2e%2e`.
- O `buildFilter` do `render.yaml` só decide quando o serviço é publicado de novo.

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
- Log: só o tipo da rota, o status e o tempo (`entrar 401 52ms`), mais as linhas de partida (`login ouvindo`, `usuarios ok N`, `fechado: <motivo>`). Nunca senha, hash, cookie, segredo, chave, usuário, caminho ou IP.
