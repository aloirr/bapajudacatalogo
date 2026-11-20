# Busca por placa (API PLACAS): desenho para aprovação

| Campo | Valor |
|---|---|
| Tarefa | T-0005 (fase 3 do `docs/ROADMAP.md`) |
| Autor | `integracao-placas` |
| Data | 20/11/2026 (Manaus) |
| Situação | **PROPOSTA, sem código.** Nada é construído antes do "aprovado" do Alexandre. |
| Base | pedido R-20261120-104703-alexandre (2 abas no início, consulta básica de R$ 0,03 por veículo) e resposta da P1, R-20261120-105734-alexandre (contrato da consulta básica) |

> As suposições estão marcadas com **[SUPOSIÇÃO]**. Este documento não tem chave, token, senha nem exemplo com cara de chave real, e não vai ter.

---

## 0. Perguntas ao Alexandre (pelo `po`)

A documentação oficial (`https://apiplacas.com.br/documentacao`) não abre para leitura automática: responde 403, com o desafio de robô do Cloudflare. O bloqueio não foi contornado. **O contrato do item 3.1 vem do exemplo da documentação que o Alexandre colou** (P1, recado R-20261120-105734-alexandre). O exemplo não tem chave.

| # | Pergunta | Por quê |
|---|---|---|
| P1 | ~~Contrato da consulta básica~~ **RESPONDIDA** em 20/11, 10h57 (R-20261120-105734-alexandre): `GET https://wdapi2.com.br/v3/basico/{PLACA}`, com a chave no header `Authorization`. Ver o item 3.1. | — |
| P1b | **Nova.** A documentação lista as **mensagens de erro** da consulta básica (placa não encontrada, chave inválida, sem saldo) e os **códigos HTTP** de cada uma? Se listar, mande **o texto, não print**, e sem a chave. | Hoje o erro vem em `error` e `message`. Para separar "não achou" (404) de "sem saldo" (503), o serviço precisa do texto ou do código de cada um (item 3.1). |
| P2 | Confirme o preço: R$ 0,03 por consulta básica? A conta é **pré-paga** (saldo/créditos) ou cobrada no fim do mês? Tem franquia ou consultas grátis? | O teto de custo mais forte é o saldo pré-pago (item 4). |
| P3 | Placa **não encontrada** também é cobrada? | Define o cache de "não achou" (item 4). |
| P4 | **Respondida em parte.** A básica traz `ano` (fabricação) e `anoModelo`, e também `cilindradas`, `potencia` e `motor`. No exemplo, porém, esses três vêm como "exemplo", vazio e "MOTOR000000". **Falta saber:** em que formato vêm as `cilindradas` (1599? 1.6?) e a `potencia` (cv?) numa consulta real, e se o `motor` é o **número de série do motor**. | Define se o motor ajuda a busca (item 7). A 1ª consulta real do Alexandre (item 6) responde sem custo extra. |
| P5 | Os termos de uso deixam guardar a resposta em **cache por 24 h**? | Economia (item 4). |
| P6 | Os números do controle de custo do item 4 servem? Quantos vendedores usam a busca por placa ao mesmo tempo, e quantos saem pelo mesmo IP (a mesma internet da loja)? | O limite por IP não pode travar a loja inteira. |
| P7 | O endereço do catálogo é `https://bapajudacatalogo.onrender.com` **[SUPOSIÇÃO]**, ou tem domínio próprio? | O CORS só aceita esse endereço. |
| P8 | Plano do Render para o serviço: **grátis** (dorme e demora até cerca de 1 min para acordar) ou **pago** (US$ 7/mês, sempre acordado) **[SUPOSIÇÃO: preço atual do plano Starter]**? | Item 4, "memória no plano grátis". |
| P9 | **Nova.** Carro CROSSFOX (ou SPACEFOX): mostrar também as peças escritas só "Fox"? Hoje a regra vai do curto para o derivado, não o contrário. **Recomendo não**: o catálogo escreve CrossFox quando a peça serve. | Item 7, `modelo_lista`. |

---

## 1. Explicação curta para o Alexandre

- O início do site fica com 2 abas: **"Busca por código, descrição ou aplicação"** (a busca palavra por palavra da T-0011) e **"Busca por placa"**.
- Na aba da placa, o vendedor digita a placa e o site pede o veículo a um **serviço pequeno da BAP no Render**. O serviço consulta a API PLACAS **com a sua chave, que fica só no Render**, e devolve só dados do veículo: **montadora, modelo, ano, combustível e cilindrada**. O site mostra o veículo e lista os produtos que servem, com a mesma lista de resultados da aba 1.
- **A chave nunca vai para o site, o Git, um recado ou o chat.** Você mesmo a cola no painel do Render, numa variável chamada `API_PLACAS_TOKEN` (item 6). Ninguém do time vê a chave.
- **Custo controlado:** a mesma placa é consultada só uma vez em 24 h, há um limite por internet (IP) e um teto por dia e por mês. Com os números do item 4, o máximo é **R$ 150,00 por mês**. O uso esperado é de cerca de **R$ 60,00 por mês** **[SUPOSIÇÃO]**.
- **LGPD:** a placa não fica gravada em log nem em arquivo. Só os dados do veículo voltam para a tela, nunca os do dono.
- **O que falta de você:** responder às perguntas P1b a P9 (a P1 já foi respondida), dar o "aprovado" neste desenho e, mais tarde, criar a variável no Render.

---

## 2. Desenho

```
 ┌──────────────────────────────┐
 │ Navegador do vendedor        │
 │ site estático (site/)        │
 │ aba "Busca por placa"        │
 │ - valida a placa             │
 │ - não guarda a placa         │
 └──────────────┬───────────────┘
                │ HTTPS, só do domínio do catálogo (CORS)
                │ POST /veiculo   corpo {"placa":"ABC1D23"}
                │ (a placa nunca vai no endereço)
                ▼
 ┌──────────────────────────────────────────────┐
 │ Serviço "bapajudacatalogo-placas" no Render  │
 │ servicos/placas/  (Node, sem dependências)   │
 │ 1. valida a placa (AAA9999 ou AAA9A99)       │
 │ 2. IP = ÚLTIMO valor do X-Forwarded-For      │
 │ 3. cache em memória por 24 h                 │
 │ 4. limite por IP e teto diário/mensal,       │
 │    contados ANTES de chamar a API            │
 │ 5. mesma placa ao mesmo tempo = 1 chamada só │
 │ 6. chama a API (endereço FIXO no código)     │
 │    com API_PLACAS_TOKEN no header            │
 │    Authorization (variável do Render)        │
 │ 7. devolve só os 9 campos do veículo (3.2)   │
 │ log: só contagens e códigos, sem placa/chave │
 └──────────────┬───────────────────────────────┘
                │ HTTPS, GET /v3/basico/{PLACA}
                │ header "Authorization: Bearer ..."
                │ (a chave nunca sai daqui e só vai
                │ para o endereço fixo; sem redirect)
                ▼
 ┌──────────────────────────────────────────────┐
 │ API PLACAS: https://wdapi2.com.br/v3/basico/ │
 │ consulta básica, R$ 0,03                     │
 │ [SUPOSIÇÃO: preço a conferir, P2]            │
 └──────────────┬───────────────────────────────┘
                │ basico.dados (o serviço descarta
                │ placa, chassi, cor, município...)
                ▼
 ┌──────────────────────────────────────────────┐
 │ No navegador: produtos.json (já carregado)   │
 │ montadora → "mo"; modelo_lista, ano e        │
 │ cilindrada → aplicação "a" e "an" → mesma    │
 │ função de busca da T-0011 → mesma lista      │
 └──────────────────────────────────────────────┘
```

- **Por que um serviço e não só o site:** o site é estático. Tudo o que está nele vai para o navegador de qualquer pessoa. Se a chave estivesse no site, qualquer um poderia copiá-la e gastar o seu saldo.
- **Governança:** para criar o serviço no Render, é preciso acrescentar um bloco ao `render.yaml`. O `render.yaml` é do Alexandre, então esse bloco vai num **PR de governança** separado, que só entra com o recado dele "autorizo o merge do PR #N no commit <sha>". O código de `servicos/placas/` vai num PR comum (dono: `integracao-placas`). A tela vai num PR do `web-site`.
- **Bloco proposto para o PR de governança** (é texto de configuração, não é código do serviço; o valor da chave **não** aparece):

  | Campo | Valor proposto |
  |---|---|
  | `type` / `runtime` | `web` / `node` |
  | `name` | `bapajudacatalogo-placas` |
  | `rootDir` | `servicos/placas` |
  | `buildCommand` | nenhum pacote para instalar (`echo` simples) |
  | `startCommand` | `node servidor.mjs` **[SUPOSIÇÃO: nome do arquivo]** |
  | `plan` | `free` ou `starter` (pergunta P8) |
  | `healthCheckPath` | `/saude` |
  | `envVars` | `API_PLACAS_TOKEN` com `sync: false` (o Render **pede o valor no painel** e não guarda no arquivo); `CORS_ORIGEM` = endereço do catálogo (P7); `LIMITE_IP_MINUTO`, `LIMITE_IP_DIA`, `TETO_DIA`, `TETO_MES` (os números do item 4; nenhum deles é segredo). **Não há variável com o endereço da API**: ele fica fixo no código (item 3.1). |
  | `pullRequestPreviewsEnabled` | `false`, como no site |

- **Runtime proposto: Node.js, sem nenhuma dependência.**
  - O Node 18+ já tem o servidor HTTP (`node:http`), o `fetch` para chamar a API e o `node:test` para os testes. Não precisa de `npm install`.
  - Sem pacote de terceiros não há **cadeia de dependências** para auditar nem atualização de segurança para acompanhar. Isso importa num serviço que segura uma chave paga.
  - O time já usa Node (`scripts/coord.mjs`).
  - Gasta pouca memória e acorda rápido no plano grátis.
  - O Python também serviria, mas pediria um framework (Flask ou FastAPI), com `requirements.txt` próprio. O `requirements.txt` da raiz também é governança.

---

## 3. Contrato

### 3.1 Contrato da API PLACAS (do exemplo da documentação, P1 respondida)

Fonte: o exemplo da documentação que o Alexandre colou no recado R-20261120-105734-alexandre. O exemplo usa `$API_PLACAS_TOKEN` no lugar da chave e uma placa pública de exemplo.

| Ponto | Contrato |
|---|---|
| Endereço | `GET https://wdapi2.com.br/v3/basico/{PLACA}`. O host é `wdapi2.com.br`, não `apiplacas.com.br`. |
| Chave | header **`Authorization: Bearer <chave>`**, mais `Accept: application/json`. A chave **não** vai no caminho nem na query. |
| Placa | no caminho, em maiúsculas. Aceita o padrão antigo e o Mercosul (a resposta traz as duas formas). |
| Sucesso | `error: false` no topo e em `basico`, e o veículo em `basico.dados` |
| Erro | `error` (true/false) e `message`, **no topo e dentro de `basico`**. Os textos e os códigos HTTP de cada erro (não encontrada, chave inválida, sem saldo) **não estão no exemplo** (pergunta P1b) **[SUPOSIÇÃO: chave e saldo dão HTTP 401, 402 ou 403; não encontrada dá `error: true` sem `dados`]**. |

**Campos de `basico.dados` e o que o serviço faz com cada um:**

| Campo da API | Exemplo da documentação | Usa? | Vira, no nosso serviço |
|---|---|---|---|
| `marca` | "VW" | **sim** | `montadora` |
| `modelo` | "CROSSFOX" | **sim** | `modelo` |
| `modelo_lista` | ["CROSSFOX"] | **sim** | `modelo_lista` |
| `ano` | "2007" (ano de **fabricação**) | **sim** | `ano` (número) |
| `anoModelo` | "2007" | **sim** | `ano_modelo` (número) |
| `combustivel` | "Alcool / Gasolina" | **sim** | `combustivel` |
| `cilindradas` | "exemplo" | **sim** | `cilindradas` (número em cm³, ou `null`) e `motor` (ver abaixo) |
| `potencia` | "" | **sim** | `potencia` (número em cv, ou `null`) |
| `motor` | "MOTOR000000" | **não repassa** (ver a resposta sobre o motor, no item 7) | — |
| `marcamodelo`, `mensagemRetorno`, `origem`, `especie`, `tipo`, `tipoVeiculo`, `segmento`, `sub_segmento`, `procedencia`, `tipoCarroceria`, `cmc`, `cmt`, `lotacao`, `qtdEixos`, `pbt`, `marca_alternativa`, `logo`, `atualizado`, `execucao` | — | não | descartados (não servem para a busca) |
| `placa_modelo_novo`, `placa_modelo_antigo`, `final_chassi`, `cor`, `municipio`, `uf`, `data` | — | **não** | **descartados pela LGPD** |

- **Formato real de `cilindradas` e `potencia`:** o exemplo só tem "exemplo" e vazio **[SUPOSIÇÃO: cilindradas em cm³, por exemplo "1599", e potência em cv, por exemplo "101"]**. O serviço aceita só número; o que não for número vira `null`. A 1ª consulta real do Alexandre confirma (P4).
- **Custo:** R$ 0,03 por consulta básica, conforme o Alexandre. Não confirmei na documentação (P2).
- **Limite de requisições da API:** o exemplo não diz **[SUPOSIÇÃO: existe; P1b]**.

**Riscos da chave, revistos com o contrato real:**
- **Bom:** a chave vai no header `Authorization`, **não no endereço**. Ela não aparece em URL, histórico nem registro de acesso de quem só guarda o endereço. O risco "a URL inteira vira segredo", que existia no formato antigo, saiu.
- **Fica:** o serviço nunca registra os headers do pedido, nunca registra o objeto do pedido nem o da resposta e nunca repassa a mensagem de erro da biblioteca. No log vai só a categoria ("tempo esgotado", "API fora", "chave recusada", "sem saldo").
- **Sem redirecionamento:** a chamada recusa redirect (`redirect: "error"`). Se o endereço fixo um dia mandar para outro lugar, a chave não vai junto: a consulta falha com 503.
- **Endereço fixo no código: `https://wdapi2.com.br/v3/basico/`**, mais a placa já validada. Ele fica escrito no código do serviço, **não** numa variável de ambiente. Assim, quem mexer nas variáveis do Render não consegue fazer a chave ser mandada a outro servidor. Trocar o endereço exige um PR, com revisão.
- **Placa para a API:** a placa vai no caminho da chamada à `wdapi2.com.br`. É o fornecedor que faz a consulta, e isso não tem como evitar. Do nosso lado, a placa não aparece em log nenhum.

### 3.2 Contrato do nosso serviço

**`POST /veiculo`**, com `Content-Type: application/json` e o corpo `{"placa":"ABC1D23"}` (placa já sem espaço nem hífen, em maiúsculas; o site limpa antes de mandar).

- A placa vai **só no corpo**, nunca no endereço. O endereço (`/veiculo`) é igual para todas as consultas, então os registros de acesso do Render não mostram a placa. Isso fecha a regra "nenhum log tem a placa" (item 5).
- Pedido com a placa no endereço (`?placa=`), ou com outro método, recebe 400 ou 405 e **não** é consultado.
- Corpo maior que 1 KB é recusado (400).

Resposta **200**:

```json
{ "montadora": "VW", "modelo": "CROSSFOX", "modelo_lista": ["CROSSFOX"], "ano": 2007, "ano_modelo": 2007,
  "combustivel": "Alcool / Gasolina", "cilindradas": 1599, "potencia": null, "motor": "1.6" }
```

- Os valores vêm do exemplo público da documentação, menos `cilindradas` e `motor`, que lá estão como "exemplo" e aqui são **ilustrativos**. Não são de uma placa real.
- **São só estes 9 campos**, que o gerente liberou. A lista é branca: campo novo que a API mandar não passa.
- `montadora`: a `marca` como veio, só limpa (maiúsculas, sem espaço sobrando). A troca para o nome do catálogo (VW → VOLKSWAGEN) é feita no site, com a **mesma tabela** `MONTADORAS` do `gerar_site.py` (item 7). Assim só existe uma tabela, e o dono dela é o `web-site`.
- `modelo` e `modelo_lista`: como vieram, em maiúsculas. A lista tem no máximo 10 nomes, cada um com até 40 caracteres.
- `ano` = ano de **fabricação**; `ano_modelo` = ano do **modelo**. Os dois são números, ou `null` se não vierem.
- `combustivel`: como veio ("Alcool / Gasolina", "Diesel"...).
- `cilindradas` (cm³) e `potencia` (cv): número ou `null`.
- `motor`: **não é o campo `motor` da API.** É um texto que o serviço monta das cilindradas, em litros com 1 casa (1599 → "1.6", 999 → "1.0"), porque é assim que a aplicação do catálogo escreve. Sem cilindradas, fica `null`. O código que a API manda em `motor` é descartado (item 7, "Resposta sobre o motor").
- **Nenhum outro campo** volta: nem placa, chassi, cor, município, UF, data, nem o `motor` da API.
- **Cache pela placa Mercosul:** o serviço converte a placa antiga na forma Mercosul antes de procurar no cache (a 5ª posição, de 0 a 9, vira de A a J). Assim, ABC1234 e ABC1C34 são a mesma consulta e pagam uma vez só.

| Código | Quando | Corpo (`{erro, mensagem}`) | Cobra consulta? |
|---|---|---|---|
| 400 | no corpo do `POST`, placa fora de `AAA9999` e `AAA9A99`; corpo sem JSON, vazio ou grande demais; placa no endereço | `placa_invalida`, "Placa inválida. Use 7 caracteres, como ABC1234 ou ABC1D23." | não (nem chama a API) |
| 405 | método diferente de `POST` (e de `OPTIONS`, do CORS) em `/veiculo` | `metodo`, "Use POST." | não |
| 404 | a API respondeu `error: true` (no topo ou em `basico`) sem `basico.dados`, com a mensagem de "não encontrada" (P1b) | `nao_encontrada`, "Não achamos esta placa. Confira as letras e os números." | depende da P3 |
| 429 | limite por IP, teto do dia ou teto do mês | `limite_ip`, `teto_dia` ou `teto_mes`, com a mensagem do item 4, e header `Retry-After` | não |
| 503 | sem `API_PLACAS_TOKEN`, chave recusada, sem saldo, API fora, redirect, resposta que não é JSON, `error: true` com outra mensagem, ou tempo esgotado (8 s) | `indisponivel`, "Consulta por placa indisponível no momento. Use a busca por código, descrição ou aplicação." | não |

- O 503 é **igual para todos os motivos**: a tela não precisa saber se é falta de chave ou de saldo. O motivo fica só no log interno, sem placa.
- Sem `API_PLACAS_TOKEN`, o serviço **sobe normalmente** e responde 503. Não quebra.
- **`GET /saude`**: `{ "ok": true, "consulta": "disponivel" | "indisponivel" }`. Não chama a API e não custa nada. Serve para o Render ver se o serviço está vivo e para o site **acordar** o serviço quando o vendedor abre a aba da placa.
- Não há nova tentativa automática: cada tentativa poderia ser cobrada.
- **Por que `POST` e não `GET`:** com `GET`, a placa iria no endereço, e o painel do Render pode mostrar o endereço completo nos registros de acesso. Com `POST`, o endereço não tem a placa.
- **IP do cliente:** no Render, o IP chega no header `X-Forwarded-For`. O serviço usa **só o ÚLTIMO valor**, o que o proxy do Render acrescenta. **Nunca usa o primeiro**, que vem do próprio navegador e pode ser forjado para fugir do limite por IP. Há um teste com o header forjado (item 9) **[SUPOSIÇÃO: o Render acrescenta o IP real no fim do `X-Forwarded-For`; conferir no primeiro deploy, com um pedido de teste]**.

---

## 4. Controle de custo (o site é público)

| Controle | Proposta | Ajuste |
|---|---|---|
| Cache da mesma placa | **24 h** em memória. A segunda consulta da mesma placa no dia não chama a API e não custa. | P5 |
| Cache de "não encontrada" | **1 h**, para o vendedor que erra e tenta de novo não pagar 2 vezes | P3 |
| Limite por IP | **10 por minuto** e **150 por dia** | P6. A loja inteira costuma sair por um IP só, então o limite por dia é alto. |
| Teto do serviço por dia | **300 consultas**, ou seja, **R$ 9,00 por dia** no máximo | variável `TETO_DIA` |
| Teto do serviço por mês | **5.000 consultas**, ou seja, **R$ 150,00 por mês** no máximo | variável `TETO_MES` |
| Uso esperado | cerca de 100 consultas pagas por dia útil × 20 dias = 2.000, ou seja, **cerca de R$ 60,00 por mês** **[SUPOSIÇÃO]** | P6 |
| Teto "de verdade" | **saldo pré-pago na API PLACAS**, se a conta for pré-paga: com R$ 150,00 de saldo, não há como gastar mais | P2 |
| Só do catálogo | CORS só para o domínio do catálogo (P7) | variável `CORS_ORIGEM` |

- Só a consulta que chega à API conta para o limite por IP e para os tetos. As respostas do cache e os erros 400 não contam.
- **O teto é contado ANTES de chamar a API.** O serviço reserva a vaga no limite por IP e no teto do dia e do mês e só então chama a API. Se a conta bater, responde 429 sem chamar. Contar depois deixaria vários pedidos ao mesmo tempo passarem do teto.
- **Mesma placa ao mesmo tempo = 1 chamada só (deduplicação).** Se chegarem 2 pedidos da mesma placa enquanto a primeira consulta ainda está a caminho, o segundo **espera a mesma chamada** e recebe a mesma resposta. Não há 2 cobranças, e o segundo não conta no teto.
- **CORS não é tranca.** Ele impede outro **site** de usar o serviço pelo navegador, mas não impede um robô. Contra robô, quem segura é o limite por IP, os tetos e o saldo pré-pago.

**O que a tela mostra quando o limite bate** (texto para o `web-site`; a aba 1 continua funcionando):

| Erro | Mensagem na tela |
|---|---|
| `limite_ip` | "Muitas consultas seguidas. Espere 1 minuto e tente de novo." |
| `teto_dia` | "A consulta por placa atingiu o limite de hoje. Use a busca por código, descrição ou aplicação, por exemplo: gol 2013." |
| `teto_mes` | "A consulta por placa atingiu o limite do mês. Use a busca por código, descrição ou aplicação." |

**Memória no plano grátis do Render (limitação)** **[SUPOSIÇÃO: regras atuais do Render, a conferir no painel]**:
- O serviço grátis **dorme depois de 15 min sem uso** e leva **até cerca de 1 minuto para acordar**. O vendedor espera na primeira consulta depois de um tempo parado. Para aliviar, o site chama `/saude` quando o vendedor abre a aba da placa e mostra "Preparando a consulta...".
- Ao dormir, reiniciar ou receber uma atualização, **a memória zera**: o cache e as contagens de IP, dia e mês voltam a zero. O plano grátis não tem disco.
- O efeito: o **teto diário e o mensal do serviço não são garantidos**. Um robô que pare 15 min e volte ganha a cota de novo. O cache perdido só custa uma consulta a mais por placa.
- **Saídas, da mais simples para a mais completa:**
  1. **Recomendada para começar:** saldo pré-pago na API PLACAS como teto real, mais os limites em memória. Custo extra: zero.
  2. Plano pago Starter (US$ 7/mês **[SUPOSIÇÃO]**): não dorme e a espera some. A memória ainda zera em cada atualização, o que é raro.
  3. Guardar as contagens num Key Value (Redis) do Render: mais um serviço e uma dependência. **Não recomendo agora.**

---

## 5. LGPD

A placa sozinha não diz o nome do dono, mas junto de outras bases pode chegar nele. Por isso, este desenho trata a placa como **dado pessoal** **[SUPOSIÇÃO: leitura cautelosa da LGPD, sem parecer jurídico]**.

| Regra | Como fica |
|---|---|
| Placa sem log | **Nenhum log tem a placa**, nem os 3 primeiros caracteres. O log do serviço só tem contagens, o código da resposta (200/400/404/405/429/503), o motivo do 503 e o tempo de resposta. Como a placa vai **no corpo do `POST`** e o endereço é sempre `/veiculo`, ela também não aparece nos registros de acesso do Render. |
| Placa sem arquivo | Não há disco nem banco. O cache fica **só em memória**, com a placa guardada como **resumo embaralhado** (HMAC com uma semente sorteada a cada partida do serviço, que não fica em lugar nenhum). Ninguém consegue tirar uma lista de placas dele. Cada item apaga sozinho em 24 h (1 h no "não encontrada"). |
| IP | Vem do **último** valor do `X-Forwarded-For` (item 3.2). Usado **só em memória**, para o limite. É **truncado** (IPv4 sem o último número, IPv6 só o começo, /48) e embaralhado do mesmo jeito. Apaga em 24 h. Nunca vai para o log do serviço. **[SUPOSIÇÃO: os registros de acesso do próprio Render não guardam o IP inteiro do visitante, ou não por muito tempo. Isso não depende de nós; conferir no painel no primeiro deploy.]** |
| Nada ligado a pessoa | O serviço não recebe nome, CPF, telefone nem login. Não grava a placa junto do IP: o cache é por placa e o limite é por IP, separados. |
| Resposta só do veículo | Lista branca de 9 campos: montadora, modelo, modelo_lista, ano, ano_modelo, combustivel, cilindradas, potencia e motor (este montado das cilindradas). Tudo o mais que a API manda é jogado fora no serviço, antes do cache: `placa_modelo_novo`, `placa_modelo_antigo`, `final_chassi`, `cor`, `municipio`, `uf`, `data` e o `motor` da API, que pode ser o número de série do motor **[SUPOSIÇÃO]**. |
| Placa fora do endereço do site | Depois da consulta, o endereço da tela fica `#/busca?q=Volkswagen Gol 2013`, **sem a placa**. Não entra no histórico do navegador nem num link copiado. O site não grava a placa no navegador (nem `localStorage` nem `sessionStorage`). |
| Chave | Só em `API_PLACAS_TOKEN`. Nunca no log, na resposta, na mensagem de erro, no Git, no navegador ou no chat. |
| Painel do Render | O Render pode registrar o endereço das chamadas. Com `POST /veiculo`, o endereço não tem a placa. O IP nesses registros é do Render, não nosso **[SUPOSIÇÃO, ver a linha "IP"]**. |

---

## 6. O passo que só o Alexandre faz

- **O quê:** criar a variável de ambiente **`API_PLACAS_TOKEN`** com a chave da API PLACAS.
- **Onde:** no painel do Render, no serviço novo **`bapajudacatalogo-placas`**. **Não** no site `bapajudacatalogo`: o site estático publica tudo para o navegador.
  - Caminho: Dashboard → `bapajudacatalogo-placas` → **Environment** → **Add Environment Variable** → Key `API_PLACAS_TOKEN` → cole a chave em Value → **Save Changes** (e o redeploy que o Render oferecer).
  - Com `sync: false` no `render.yaml`, o Render pode pedir o valor sozinho na sincronização do Blueprint **[SUPOSIÇÃO: em Blueprint já existente, a variável nova talvez tenha de ser criada à mão, pelo caminho acima]**.
- **Quando:** depois do merge do PR de governança do `render.yaml` (passo 4 do item 9), quando o serviço já existe e responde 503 "consulta por placa indisponível". O `po` avisa a hora.
- **Depois:** o Alexandre (ou um vendedor) faz **uma** consulta com a placa de um veículo da própria empresa, que custa cerca de R$ 0,03. Nenhum agente faz consulta real.
- **Ninguém pede a chave.** Ela não vai para recado, chat, print, issue, PR nem doc. Se algum dia ela aparecer num desses lugares, o certo é **gerar uma chave nova** na API PLACAS e trocar a variável no Render.

---

## 7. Como casar o retorno da API com o `produtos.json`

O site já tem tudo no navegador: `mo` (montadora normalizada), `a` (aplicação, com modelo, ano e motor no texto) e `an` (ANO_INICIO e ANO_FIM, quando existem). A busca roda no navegador, sem nova chamada. Os números abaixo são do `produtos.json` do `main` de hoje (4.419 produtos, 4.313 com aplicação).

| Campo do serviço | Casa com | Regra proposta |
|---|---|---|
| `montadora` ("VW") | `mo` e o começo de `a` | Passa pela tabela `MONTADORAS` do `gerar_site.py`, que já tem VW → VOLKSWAGEN, GM → CHEVROLET, MERCEDES BENZ → MERCEDES-BENZ e CITROEN → CITROËN. **Faltam só M.BENZ e MBENZ → MERCEDES-BENZ** (pedido ao `web-site`) **[SUPOSIÇÃO: grafias da API]**. Casa com `mo`, ou com a montadora escrita na aplicação, como na T-0011 ("vw gol" acha o Gol da VOLKSWAGEN). |
| `modelo_lista` (["CROSSFOX"]) e `modelo` | o modelo dentro de `a` | **Cada nome da `modelo_lista` é uma alternativa (OU)**, e cada um passa pela função da T-0008: palavra inteira, derivados e hífen. O `modelo` só entra se a lista vier vazia. Ver "Como o `modelo_lista` ajuda", abaixo. |
| `ano` e `ano_modelo` | `an` e os anos escritos em `a` | Casa com a faixa da T-0011 (`an`, "2005 a 2010", "05-10", "2005>"). **O produto entra se servir no ano de fabricação OU no ano do modelo**, para não perder peça na virada (carro 2012/2013). Pedido ao `web-site`: a função da T-0011 aceitar 2 anos com OU. |
| `motor` ("1.6", das cilindradas) | a cilindrada escrita em `a` | **Não filtra; ordena.** Produto cuja aplicação cita "1.6" vem primeiro; os outros continuam na lista. Um botão "só motor 1.6" deixa o vendedor filtrar. |
| `potencia` | — | **Só exibição.** Só 46 aplicações (1%) citam cv ou hp. |
| `combustivel` | "Flex", "Diesel", "Gasolina" em `a` | **Só exibição e ordem.** "Alcool / Gasolina" é mostrado como Flex. Só 181 aplicações citam flex e 143 citam diesel. Filtrar esconderia peças boas. |
| Busca final | — | Vira `#/busca?q=Volkswagen Crossfox 2007`, a mesma rota que a T-0011 já usa para os links antigos da aba Veículo. Acima da lista aparece: "Veículo da placa: VOLKSWAGEN CROSSFOX · 2007/2007 · 1.6 · Flex". |

**Resposta sobre o motor:**
- **O `motor` da API não dá para casar com a aplicação.** No exemplo, ele é "MOTOR000000": um código no mesmo jeito do `final_chassi` ("00000"). Isso indica que é o **número de série do motor**, como o que fica no documento do carro **[SUPOSIÇÃO; a 1ª consulta real confirma]**. Um número de série é único de cada carro e não aparece em nenhuma aplicação do catálogo.
- Por isso proponho **não repassar nem exibir** o `motor` da API. Se for número de série, ele identifica aquele carro, como o chassi, e vale o mesmo cuidado de LGPD. Se a 1ª consulta mostrar que é a família do motor (por exemplo "EA111" ou "FIRE", que 206 aplicações citam), ele volta como campo de exibição, num PR pequeno.
- **O que casa é a cilindrada.** 2.233 aplicações (52%) citam a cilindrada em litros ("1.0", "1.6"). O serviço converte `cilindradas` em litros (1599 → "1.6") e o site usa isso para ordenar.
- **"1.0 8V" só casa pela metade.** O "1.0" vem das cilindradas, mas as válvulas (8V/16V, citadas em 1.598 aplicações) **não vêm** na consulta básica. A `potencia` em cv não diz as válvulas com segurança. O "8V" fica para o vendedor conferir.
- **Por que o motor não filtra:** a aplicação junta vários carros num texto só ("Celta 1.0 ... Corsa 1.6"). O "1.0" pode ser de outro carro do mesmo texto, e metade das aplicações não cita a cilindrada. Filtrar esconderia peças certas.

**Como o `modelo_lista` ajuda nos derivados (regra da T-0008):**
1. **Nome limpo.** Ele traz só o nome do modelo, sem versão nem marca ("CROSSFOX", e não "VW/CROSSFOX" do `marcamodelo`). Como a busca da T-0011 é **E entre palavras**, um "1.0 GIV" a mais zeraria o resultado. A lista evita ter de "adivinhar" a 1ª palavra.
2. **Mais de um nome = OU.** Se a lista vier com mais de um nome (por exemplo o modelo e a geração **[SUPOSIÇÃO: o exemplo só tem um]**), qualquer um deles serve.
3. **Derivados como na T-0008.** Cada nome passa pela mesma função: um "FOX" na lista traz também CROSSFOX e SPACEFOX (regra R-20261120-100105, "é regra para todos").
4. **Nome junto × separado.** No catálogo, o CrossFox aparece como "Crossfox" (47 aplicações), "CrossFox" (8) e "**Cross Fox**" (5). A palavra inteira "CROSSFOX" não casa com "Cross Fox". **Pedido ao `web-site`:** quando o nome da lista é a junção de 2 nomes que aparecem sozinhos nas aplicações (CROSS + FOX, com o mesmo teste `ehNome` dos derivados), procurar também as 2 palavras vizinhas. Sem isso, essas 5 peças ficam de fora.
5. **O contrário não entra.** Um carro CROSSFOX **não** traz peça escrita só "Fox": a T-0008 vai do nome curto para o derivado, não o contrário. Se o Alexandre quiser, é uma regra nova (pergunta P9).

**Riscos:**
1. **39% dos produtos não têm `mo`** (1.725 de 4.419). Para eles, a montadora só casa se estiver escrita na aplicação. Se a aplicação diz "GM" e a API diz "CHEVROLET", pode faltar peça. A busca deve aceitar os dois nomes (pedido ao `web-site`).
2. **Nome do modelo diferente** entre a API e o catálogo, como "HB20S" × "HB20 S" e "S10" × "S-10". O item 4 da lista acima cobre parte. O resto entra numa lista de apelidos, mantida pelo `web-site`, que cresce com os casos reais.
3. **Ano que não é lido** (aplicação sem ano): o produto **aparece** ("o cliente confere", regra atual). Pode vir peça a mais, nunca a menos.
4. **Caminhão e utilitário** (Scania, Mercedes, Iveco): o modelo pode vir como código ("L 1620", "ATEGO 1719") **[SUPOSIÇÃO]**. O risco de não casar é maior, e vale um teste com placas reais na implantação.
5. **Formato de `cilindradas` diferente do suposto** (por exemplo "1.6" em vez de "1599"): o serviço aceita os dois; o que não for número vira `null` e o motor só não ordena.
6. **Zero resultado:** a tela mostra o veículo e o aviso "Nenhum produto com esse veículo. Tente sem o ano", com 1 clique para buscar só montadora e modelo. A busca fica editável na aba 1.

---

## 8. Encaixe com a T-0011 e a T-0014

- **T-0011 (aba 1) é DEPENDÊNCIA: ainda não está no `main`.** No worktree dela (em andamento, sem PR), o cartão já tem as 2 abas, com a aba "Busca por placa" como "Em breve", e montadora, modelo e ano já viram `q` palavra por palavra. A aba 2 **não cria outra busca**: ela só troca a placa por um `q` e usa a mesma função e a mesma lista. Por isso a aba 2 só é ligada depois do merge da T-0011. Se a T-0011 mudar nesses pontos antes do merge, o item 7 é revisto.
- **T-0014 (cartão, página e PDF):** a aba 2 usa a **mesma lista de resultados**, então tudo o que a T-0014 mudar no cartão, na página do produto ou no PDF vale também para a placa, sem trabalho em dobro. A única coisa nova na tela é a faixa "Veículo da placa: ..." acima da lista.
- **Ordem sem retrabalho:**
  1. T-0011 entra no `main` (as 2 abas, com a placa "Em breve"). **É pré-requisito do passo 4;**
  2. o serviço `servicos/placas/` é feito **em paralelo**, com API simulada (pasta separada, sem conflito com o site);
  3. a T-0014 entra quando estiver pronta;
  4. por último, o `web-site` liga a aba 2 ao serviço, sobre a T-0011 e a T-0014 já no `main`.
- **Simulação da tela (regra 3):** o `web-site` faz os prints da aba 2 em 1366 e 390 px, com o serviço simulado: veículo achado, não achado, limite e indisponível. Não mexe no site do `main` antes do "aprovado".

---

## 9. Testes previstos e plano de implantação

**Testes automáticos do serviço** (`node:test`, com a API PLACAS **simulada** num servidor local; nunca com a chave real):

| # | Caso | Esperado |
|---|---|---|
| 1 | `POST /veiculo` com placa antiga e Mercosul válidas; a API simulada responde **igual ao exemplo da documentação** (R-20261120-105734) | 200, só com os 9 campos; a chamada simulada recebe `GET /v3/basico/{PLACA}` com `Authorization: Bearer` e `Accept: application/json` |
| 1b | cilindradas "1599", "999", "1.6", "exemplo" e vazia | `motor` "1.6", "1.0", "1.6", `null` e `null` |
| 1c | placa antiga e a mesma em Mercosul (ABC1234 e ABC1C34) | a API simulada é chamada **1 vez só** (mesma chave de cache) |
| 2 | placa inválida (6 ou 8 caracteres, com hífen, com símbolo, vazia), corpo sem JSON ou maior que 1 KB, placa em `?placa=` | 400, e a API simulada **não** é chamada |
| 2b | `GET`, `PUT` ou `DELETE` em `/veiculo` | 405, e a API simulada **não** é chamada |
| 3 | `error: true` no topo e em `basico`, sem `dados`, com a mensagem de "não encontrada" | 404 |
| 3b | `error: true` com outra mensagem; HTTP 401, 402 e 403; resposta que não é JSON | 503 |
| 4 | sem `API_PLACAS_TOKEN` | o serviço sobe e responde 503 |
| 5 | chave recusada, sem saldo, API fora (500) e tempo esgotado | 503, igual para todos |
| 6 | 11ª consulta do mesmo IP no minuto | 429 `limite_ip` com `Retry-After` |
| 6b | **header forjado:** 11 consultas com o mesmo último valor do `X-Forwarded-For` e um primeiro valor diferente a cada vez (como faria quem quer fugir do limite) | a 11ª dá 429 `limite_ip`: o primeiro valor é ignorado |
| 7 | teto do dia e do mês (com números pequenos no teste) | 429 `teto_dia` / `teto_mes` |
| 7b | teto contado antes: com 1 vaga sobrando, 5 pedidos de placas diferentes ao mesmo tempo | a API simulada é chamada **1 vez só**; os outros 4 recebem 429 |
| 8 | cache: 2ª consulta da mesma placa | a API simulada é chamada **uma vez só**; não conta no teto |
| 8b | deduplicação: 3 pedidos da mesma placa ao mesmo tempo, com a API simulada lenta | a API simulada é chamada **1 vez só**; os 3 recebem a mesma resposta; o teto sobe 1 |
| 9 | cache vence em 24 h (relógio simulado) | chama a API de novo |
| 10 | resposta da API com `placa_modelo_novo`, `placa_modelo_antigo`, `final_chassi`, `cor`, `municipio`, `uf`, `data`, `motor` ("MOTOR000000") e um campo novo qualquer | nenhum deles aparece na resposta nem no cache |
| 11 | **chave falsa de teste** (texto óbvio, como `chave-falsa-de-teste`) | não aparece em **nenhuma** resposta, em nenhum log nem em nenhuma mensagem de erro, inclusive quando a chamada falha ou dá tempo esgotado |
| 11b | a API simulada responde com redirect para outro servidor simulado | 503, e o outro servidor **não** recebe o header `Authorization` |
| 12 | placa de teste | não aparece em nenhuma linha de log |
| 13 | CORS | só o domínio do catálogo recebe o header de permissão |
| 14 | `/saude` | 200 e não chama a API |
| 15 | endereço da API fixo: variável de ambiente com outro endereço qualquer | a API simulada no endereço fixo do teste continua sendo a única chamada; nenhuma variável muda o destino da chave |

- **Site** (`web-site` e `testes`): placa com espaço e hífen é limpa; VW → VOLKSWAGEN; `modelo_lista` vira OU; CROSSFOX acha também "Cross Fox"; 2 anos com OU; cilindrada só ordena; as mensagens de 400, 404, 429 e 503; prints 1366 e 390 px; o endereço não leva a placa.
- **Revisão:** o `revisor-codigo`, com foco em segredo (chave no header, log, erro e redirect) e LGPD.

**Plano de implantação e previsão (horas de trabalho do time, fora a espera pelo Alexandre):**

| # | Passo | Quem | Horas |
|---|---|---|---|
| 0 | "Aprovado" neste desenho e respostas P1b a P9 (a P1 já veio; P1b e P4 podem esperar a 1ª consulta real) | Alexandre, pelo `po` | — |
| 1 | Serviço `servicos/placas/` com a API simulada no formato real da documentação e os testes acima; PR comum. Com o contrato conhecido, sai a parte de "trocar de formato" e entram os 9 campos, a conversão da cilindrada e a placa Mercosul no cache. | `integracao-placas` | **5 a 7** |
| 2 | Revisão do serviço (segredo e LGPD) | `revisor-codigo` | 1 a 2 |
| 3 | PR de governança com o bloco do `render.yaml` (item 2) | `gerente-projetos` propõe, o Alexandre autoriza | 0,5 |
| 4 | Render cria o serviço; o `/saude` responde "indisponivel" | Render | — |
| 5 | **Alexandre cria `API_PLACAS_TOKEN`** (item 6) | Alexandre | 0,1 |
| 6 | Simulação da aba 2 e prints 1366 e 390 px, depois ligar a aba ao serviço (**só depois do merge da T-0011**), com a casação do item 7 (`modelo_lista`, nome junto × separado, 2 anos, cilindrada que ordena, M.BENZ e MBENZ) | `web-site` | **4 a 5** |
| 7 | Testes do site e da busca por veículo | `testes` | 1,5 a 2 |
| 8 | Consulta real com 1 placa da empresa e conferência da lista. Responde a P4: formato das cilindradas e o que é o `motor`. | Alexandre | 0,1 |
| 9 | 1 semana de acompanhamento: consultas por dia, gasto e casos de "não casou" | `integracao-placas` (log sem placa) | 1 |
| | **Total do time** | | **cerca de 13 a 18 h** |

---

## 10. Recomendação do `integracao-placas`

1. **Aprovar este desenho** com: Node sem dependências, cache de 24 h em memória, limite de 10 consultas por minuto e 150 por dia por IP, teto de 300 por dia e 5.000 por mês (no máximo **R$ 150,00 por mês**, com cerca de R$ 60,00 esperados).
2. **Usar o saldo pré-pago da API PLACAS como teto real** (se a conta permitir), porque no plano grátis do Render a memória zera e os tetos do serviço não são garantidos.
3. **Usar `POST /veiculo`, com a placa no corpo** (decidido na revisão), para a placa não aparecer nos registros de acesso do Render; o IP vem só do último valor do `X-Forwarded-For`; o endereço da API fica fixo no código.
4. **Começar no plano grátis** e passar para o Starter só se a espera de até 1 minuto para acordar incomodar os vendedores.
5. **Com a P1 respondida, o código pode começar logo depois do "aprovado" deste desenho**, com a API simulada no formato do exemplo da documentação. A P1b (textos de erro) e a P4 (formato das cilindradas e o que é o `motor`) não seguram o código: o serviço trata o desconhecido como 503 ou `null`, e a 1ª consulta real do Alexandre confirma.
6. **Não repassar o `motor` da API.** Ele parece ser o número de série do motor, que não casa com o catálogo e identifica o carro. O motor que vai para a tela é a cilindrada em litros ("1.6"), que casa com 52% das aplicações e só ordena a lista.
