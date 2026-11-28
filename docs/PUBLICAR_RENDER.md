# Publicar o catálogo no Render (T-0003)

Este é o passo a passo do painel do Render para o **Alexandre**. Os agentes não têm acesso à conta do Render. Quem cria e guarda as chaves e as senhas é só o Alexandre: elas nunca vão para o Git, para um documento ou para o chat.

O arquivo que manda é o `render.yaml`, na raiz do repositório, e ele é governança (do Alexandre). Este guia explica o que ele faz. Quando os dois divergirem, vale o `render.yaml`.

[SUPOSIÇÃO: os nomes dos menus do painel são os de 27/11/2026 e podem mudar no Render.]

## O que está no ar
São três serviços, todos do mesmo Blueprint (`aloirr/bapajudacatalogo`):

| Serviço | O que faz | Endereço |
|---|---|---|
| `bapajudacatalogo-login` | Serve o catálogo (`site/`) só com login, os usuários do admin e a página "Catálogos em PDF" (T-0022) | https://bapajudacatalogo-login.onrender.com |
| `bapajudacatalogo` | Endereço antigo: só redireciona para o login. Os links `#/produto/...` continuam valendo | https://bapajudacatalogo.onrender.com |
| `bapajudacatalogo-placas` | Busca por placa (T-0005): consulta a API PLACAS com a chave guardada no Render | (interno, chamado pelo site) |

A base `.xlsx` não vai para o ar. O login serve só a pasta `site/` e os PDFs da lista do admin.

## Como uma mudança chega ao ar
1. O PR é aprovado pelo po e mergeado no `main` (regra de merge do CLAUDE.md).
2. O Render publica sozinho a cada merge no `main`. Cada serviço só é refeito quando muda um dos caminhos do `buildFilter` dele, no `render.yaml`.
3. Os PRs **não** criam prévias no Render: nenhum serviço tem o bloco `previews` (T-0022).

## Passo a passo no painel (só quando o `render.yaml` mudar)
1. Entre em https://dashboard.render.com com a conta da BAP.
2. Abra **Blueprints** e escolha `aloirr/bapajudacatalogo`.
3. Clique em **Sync** (ou **Manual sync**). O Render mostra o que vai mudar: confira se são só os serviços e os campos que o PR mudou.
4. Confirme. Espere os três serviços ficarem com **Live**.

## Chaves e senhas (só o Alexandre, no painel)
No `render.yaml`, as variáveis com `sync: false` não têm valor no Git. Elas são digitadas no painel, em cada serviço, em **Environment**:

| Serviço | Variável | O que é |
|---|---|---|
| `bapajudacatalogo-placas` | `API_PLACAS_TOKEN` | A chave da API PLACAS |
| `bapajudacatalogo-login` | `ADMIN_SENHA_INICIAL` | A senha inicial do usuário `admin` |

O `SESSAO_SEGREDO` e a `CHAVE_INTERNA` são gerados pelo próprio Render (`generateValue: true`). Ninguém digita esses valores, e eles não aparecem em lugar nenhum fora do painel.

## Conferir depois de publicar
1. `https://bapajudacatalogo-login.onrender.com/saude` responde sem erro.
2. `https://bapajudacatalogo.onrender.com` leva para a tela de login.
3. Com o login, faça a busca geral, a busca por veículo e a busca por código ou referência, no computador e no celular.
4. Tente abrir a base pelo navegador, por exemplo `https://bapajudacatalogo-login.onrender.com/dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`. Não pode abrir.
5. Se algo falhar, abra o serviço no painel e veja **Logs** e **Events**. Nunca copie uma chave ou uma senha do painel para o chat.

## Domínio próprio
Fica para depois, por decisão do Alexandre (R-20261127-200014-alexandre, item 10). O catálogo segue no endereço do Render.
