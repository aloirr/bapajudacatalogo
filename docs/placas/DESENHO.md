# Busca por placa (API PLACAS): desenho para aprovação

| Campo | Valor |
|---|---|
| Tarefa | T-0005 (fase 3 do `docs/ROADMAP.md`) |
| Autor | `integracao-placas` |
| Data | 20/11/2026 (Manaus) |
| Situação | **PROPOSTA, sem código.** Nada é construído antes do "aprovado" do Alexandre. |
| Base | pedido R-20261120-104703-alexandre (2 abas no início, consulta básica de R$ 0,03 por veículo) |

> As suposições estão marcadas com **[SUPOSIÇÃO]**. Este documento não tem chave, token, senha nem exemplo com cara de chave real, e não vai ter.

---

## 0. Perguntas ao Alexandre (pelo `po`)

**Aviso:** não consegui ler a documentação oficial. `https://apiplacas.com.br/documentacao` (e também `/`, `/doc.php` e `/precos`) responde **403** com o desafio de robô do Cloudflare ("Just a moment..."). Não há cópia no Internet Archive. Não contornei o bloqueio. O contrato do item 3 vem de **código público de terceiros** que usa a API e serve só como pista: tudo nele é **[SUPOSIÇÃO]** até o Alexandre confirmar.

| # | Pergunta | Por quê |
|---|---|---|
| P1 | Abra a documentação **sem estar logado** e copie para o `po` a seção da **consulta básica**: endereço, como o token vai (no caminho da URL, num header ou na query) e um exemplo de resposta. **Mande o texto copiado, não print**: o texto não carrega por engano o que mais estiver na tela. **Logado, a página pode mostrar o seu token nos exemplos. Se aparecer, apague antes de mandar.** | Sem isso não dá para fechar o contrato (item 3). O endereço da API que vier aqui fica **fixo no código** (item 3.1). |
| P2 | Confirme o preço: R$ 0,03 por consulta básica? A conta é **pré-paga** (saldo/créditos) ou cobrada no fim do mês? Tem franquia ou consultas grátis? | O teto de custo mais forte é o saldo pré-pago (item 4). |
| P3 | Placa **não encontrada** também é cobrada? | Define o cache de "não achou" (item 4). |
| P4 | A consulta básica traz o **motor** (cilindrada, por exemplo "1.6")? Traz **ano de fabricação e ano do modelo**? | O motor pode só vir na consulta completa (item 3). |
| P5 | Os termos de uso deixam guardar a resposta em **cache por 24 h**? | Economia (item 4). |
| P6 | Os números do controle de custo do item 4 servem? Quantos vendedores usam a busca por placa ao mesmo tempo, e quantos saem pelo mesmo IP (a mesma internet da loja)? | O limite por IP não pode travar a loja inteira. |
| P7 | O endereço do catálogo é `https://bapajudacatalogo.onrender.com` **[SUPOSIÇÃO]**, ou tem domínio próprio? | O CORS só aceita esse endereço. |
| P8 | Plano do Render para o serviço: **grátis** (dorme e demora até cerca de 1 min para acordar) ou **pago** (US$ 7/mês, sempre acordado) **[SUPOSIÇÃO: preço atual do plano Starter]**? | Item 4, "memória no plano grátis". |

---

## 1. Explicação curta para o Alexandre

- O início do site fica com 2 abas: **"Busca por código, descrição ou aplicação"** (a busca palavra por palavra da T-0011) e **"Busca por placa"**.
- Na aba da placa, o vendedor digita a placa e o site pede o veículo a um **serviço pequeno da BAP no Render**. O serviço consulta a API PLACAS **com a sua chave, que fica só no Render**, e devolve **montadora, modelo, ano e motor**. O site mostra o veículo e lista os produtos que servem, com a mesma lista de resultados da aba 1.
- **A chave nunca vai para o site, o Git, um recado ou o chat.** Você mesmo a cola no painel do Render, numa variável chamada `API_PLACAS_TOKEN` (item 6). Ninguém do time vê a chave.
- **Custo controlado:** a mesma placa é consultada só uma vez em 24 h, há um limite por internet (IP) e um teto por dia e por mês. Com os números do item 4, o máximo é **R$ 150,00 por mês**. O uso esperado é de cerca de **R$ 60,00 por mês** **[SUPOSIÇÃO]**.
- **LGPD:** a placa não fica gravada em log nem em arquivo. Só os dados do veículo voltam para a tela, nunca os do dono.
- **O que falta de você:** responder às perguntas P1 a P8, dar o "aprovado" neste desenho e, mais tarde, criar a variável no Render.

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
 │    com API_PLACAS_TOKEN (variável do Render) │
 │ 7. devolve só {montadora, modelo, ano, motor}│
 │ log: só contagens e códigos, sem placa/chave │
 └──────────────┬───────────────────────────────┘
                │ HTTPS, com a chave (nunca sai daqui
                │ e só vai para o endereço fixo)
                ▼
 ┌──────────────────────────────┐
 │ API PLACAS (apiplacas.com.br)│
 │ consulta básica, R$ 0,03     │
 │ [SUPOSIÇÃO: preço a conferir]│
 └──────────────────────────────┘
                │ veículo
                ▼
 ┌──────────────────────────────────────────────┐
 │ No navegador: produtos.json (já carregado)   │
 │ montadora + modelo + ano → mesma função de   │
 │ busca da T-0011 → mesma lista de resultados  │
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

### 3.1 Contrato da API PLACAS (lido em código de terceiros, **não** na documentação oficial)

**Tudo nesta seção é [SUPOSIÇÃO] até a resposta da P1.** Achei 2 formatos diferentes em projetos públicos no GitHub:

| Ponto | Formato A (vários projetos que citam apiplacas.com.br) | Formato B (um projeto: "PuxaPlaca, ex-apiplacas.com.br") |
|---|---|---|
| Endereço | `GET https://wdapi2.com.br/consulta/{placa}/{token}` | `GET https://api.puxaplaca.app/v2/consulta/{placa}` |
| Chave | **no caminho da URL** | no header `token` |
| Montadora | `MARCA` (ou `marca`) | `basico.dados.marca` |
| Modelo | `MODELO`, `SUBMODELO`, `VERSAO` e `marcaModelo` | `basico.dados.modelo` |
| Ano | `ano` (fabricação) e `anoModelo` (modelo) | `basico.dados.ano` |
| Motor | `extra.cilindradas` (ex.: "1599", ou seja, 1.6). Pode só vir na consulta completa. | não aparece na básica |
| Outros campos que vêm e **vamos descartar** | cor, chassi (às vezes mascarado), município, UF, situação, `fipe.dados` (valor FIPE), logo | cor |
| Não encontrada | HTTP 200 com `mensagemRetorno` "Placa nao encontrada na base." e sem veículo; às vezes 404 ou 406 | 404/406, ou `error: true` |
| Erros de chave e saldo | não documentado nas fontes **[SUPOSIÇÃO: 401/403 ou mensagem no corpo]** | status diferente de 200 |

- **Custo:** R$ 0,03 por consulta básica, conforme o Alexandre. **Não confirmei na documentação** (P2). Um projeto público cita "5 consultas grátis por conta" **[SUPOSIÇÃO]**.
- **Limite de requisições da API:** não achei **[SUPOSIÇÃO: existe, ver P1]**.
- **Cuidado, se for o formato A (chave no caminho):** a URL inteira passa a ser segredo. O serviço nunca registra a URL chamada e nunca repassa a mensagem de erro da biblioteca, que pode trazer a URL. Ele só registra a categoria do erro ("tempo esgotado", "API fora", "sem saldo"). Há um teste para isso (item 9).
- **O código só começa depois da P1.** O ponto que chama a API fica num único lugar do serviço, para trocar de formato A para B sem mexer no resto.
- **Endereço da API fixo no código.** O endereço confirmado pela P1 fica escrito no código do serviço, **não** numa variável de ambiente. Assim, quem mexer nas variáveis do Render não consegue fazer a chave ser mandada a outro servidor. Trocar o endereço exige um PR, com revisão.

### 3.2 Contrato do nosso serviço

**`POST /veiculo`**, com `Content-Type: application/json` e o corpo `{"placa":"ABC1D23"}` (placa já sem espaço nem hífen, em maiúsculas; o site limpa antes de mandar).

- A placa vai **só no corpo**, nunca no endereço. O endereço (`/veiculo`) é igual para todas as consultas, então os registros de acesso do Render não mostram a placa. Isso fecha a regra "nenhum log tem a placa" (item 5).
- Pedido com a placa no endereço (`?placa=`), ou com outro método, recebe 400 ou 405 e **não** é consultado.
- Corpo maior que 1 KB é recusado (400).

Resposta **200**:

```json
{ "montadora": "VOLKSWAGEN", "modelo": "GOL 1.0 GIV", "ano": 2013, "ano_fabricacao": 2012, "motor": "1.0" }
```

- Os valores acima são **ilustrativos**, não são de uma placa real.
- `montadora`: a marca como veio da API, só limpa (maiúsculas, sem o prefixo "I/" de importado). A troca para o nome do catálogo (VW → VOLKSWAGEN, GM → CHEVROLET) é feita no site, com a **mesma tabela** do `gerar_site.py` (item 7). Assim só existe uma tabela, e o dono dela é o `web-site`.
- `ano`: o ano do **modelo**. `ano_fabricacao` é um campo **extra proposto**, opcional (item 7).
- `motor`: `null` quando a consulta básica não traz (P4).
- **Nenhum outro campo** volta: nem chassi, cor, município, UF, situação, FIPE, nem a própria placa.

| Código | Quando | Corpo (`{erro, mensagem}`) | Cobra consulta? |
|---|---|---|---|
| 400 | no corpo do `POST`, placa fora de `AAA9999` e `AAA9A99`; corpo sem JSON, vazio ou grande demais; placa no endereço | `placa_invalida`, "Placa inválida. Use 7 caracteres, como ABC1234 ou ABC1D23." | não (nem chama a API) |
| 405 | método diferente de `POST` (e de `OPTIONS`, do CORS) em `/veiculo` | `metodo`, "Use POST." | não |
| 404 | a API não achou o veículo | `nao_encontrada`, "Não achamos esta placa. Confira as letras e os números." | depende da P3 |
| 429 | limite por IP, teto do dia ou teto do mês | `limite_ip`, `teto_dia` ou `teto_mes`, com a mensagem do item 4, e header `Retry-After` | não |
| 503 | sem `API_PLACAS_TOKEN`, chave recusada, sem saldo, API fora ou tempo esgotado (8 s) | `indisponivel`, "Consulta por placa indisponível no momento. Use a busca por código, descrição ou aplicação." | não |

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
| Resposta só do veículo | Lista branca de 5 campos (montadora, modelo, ano, ano de fabricação e motor). Tudo o mais que a API mandar é jogado fora: chassi, cor, município, UF, situação e FIPE. |
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

O site já tem tudo no navegador: `mo` (montadora normalizada), `a` (aplicação) e `an` (ANO_INICIO e ANO_FIM, quando existem). A busca roda no navegador, sem nova chamada.

| Passo | Regra proposta |
|---|---|
| Montadora | A `montadora` da API passa pela mesma tabela `MONTADORAS` do `gerar_site.py`, que já tem VW → VOLKSWAGEN, GM → CHEVROLET, MERCEDES BENZ → MERCEDES-BENZ e CITROEN → CITROËN. **Faltam só M.BENZ e MBENZ → MERCEDES-BENZ** (pedido ao `web-site`) **[SUPOSIÇÃO: grafias da API]**. Casa com `mo`, ou com a montadora escrita na aplicação, como na T-0011 ("vw gol" acha o Gol da VOLKSWAGEN). |
| Modelo | A API manda o modelo com a versão, por exemplo "GOL 1.0 GIV" ou "ONIX 10MT LT" **[SUPOSIÇÃO]**. Como a busca da T-0011 é **E entre palavras**, mandar "1.0", "GIV" ou "10MT" zeraria o resultado. **Usa-se só o nome do modelo:** a 1ª palavra, pulando "NOVO", "NOVA", "NEW" e o prefixo da marca ("VW/"). Se a 1ª palavra tiver 1 caractere ("L 200"), junta com a 2ª, como na T-0008. |
| Regra da T-0008 | Palavra inteira (GOL não traz GOLF, BORA nem JETTA), derivados entram (FOX traz CROSSFOX e SPACEFOX) e o hífen vale como espaço (T-CROSS). É a mesma função, sem regra nova. |
| Ano | O `ano` (ano do modelo) entra na busca e casa com a faixa da T-0011: `an`, "2005 a 2010", "05-10" e "2005>". **Proposta extra:** se o veículo tiver ano de fabricação diferente (2012/2013), o produto entra se servir em **um dos dois anos**, para não perder peça na virada do ano. Precisa do `ano_fabricacao` do item 3.2. |
| Motor | **Só aparece na tela, não filtra.** Muitas aplicações não citam o motor, e o filtro esconderia peças boas. Mais tarde, pode virar um botão "só 1.0". |
| Busca final | Vira `#/busca?q=Volkswagen Gol 2013`, a mesma rota que a T-0011 já usa para os links antigos da aba Veículo. Acima da lista aparece: "Veículo da placa: VOLKSWAGEN GOL 1.0 GIV · 2012/2013 · motor 1.0". |

**Riscos:**
1. **38% dos produtos não têm `mo`** (1.725 de 4.522 no `produtos.json` de hoje). Para eles, a montadora só casa se estiver escrita na aplicação. Se a aplicação diz "GM" e a API diz "CHEVROLET", pode faltar peça. A busca deve aceitar os dois nomes (pedido ao `web-site`).
2. **Nome do modelo diferente** entre a API e o catálogo, como "SPACEFOX" × "SPACE FOX" (a T-0008 já cobre), "HB20S" × "HB20 S" e "S10" × "S-10". Mitigação: lista de apelidos, mantida pelo `web-site`, que cresce com os casos reais.
3. **Ano que não é lido** (aplicação sem ano, ou com "04/16" em mês/ano): o produto **aparece** ("o cliente confere", regra atual). Pode vir peça a mais, nunca a menos.
4. **Caminhão e utilitário** (Scania, Mercedes, Iveco): o modelo da API costuma ser código ("L 1620", "ATEGO 1719") **[SUPOSIÇÃO]**. O risco de não casar é maior, e vale um teste com placas reais na implantação.
5. **Zero resultado:** a tela mostra o veículo e o aviso "Nenhum produto com esse veículo. Tente sem o ano", com 1 clique para buscar só montadora e modelo. A busca fica editável na aba 1.

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
| 1 | `POST /veiculo` com placa antiga e Mercosul válidas | 200, só com os 5 campos |
| 2 | placa inválida (6 ou 8 caracteres, com hífen, com símbolo, vazia), corpo sem JSON ou maior que 1 KB, placa em `?placa=` | 400, e a API simulada **não** é chamada |
| 2b | `GET`, `PUT` ou `DELETE` em `/veiculo` | 405, e a API simulada **não** é chamada |
| 3 | placa não encontrada (pelo formato da API confirmado na P1) | 404 |
| 4 | sem `API_PLACAS_TOKEN` | o serviço sobe e responde 503 |
| 5 | chave recusada, sem saldo, API fora (500) e tempo esgotado | 503, igual para todos |
| 6 | 11ª consulta do mesmo IP no minuto | 429 `limite_ip` com `Retry-After` |
| 6b | **header forjado:** 11 consultas com o mesmo último valor do `X-Forwarded-For` e um primeiro valor diferente a cada vez (como faria quem quer fugir do limite) | a 11ª dá 429 `limite_ip`: o primeiro valor é ignorado |
| 7 | teto do dia e do mês (com números pequenos no teste) | 429 `teto_dia` / `teto_mes` |
| 7b | teto contado antes: com 1 vaga sobrando, 5 pedidos de placas diferentes ao mesmo tempo | a API simulada é chamada **1 vez só**; os outros 4 recebem 429 |
| 8 | cache: 2ª consulta da mesma placa | a API simulada é chamada **uma vez só**; não conta no teto |
| 8b | deduplicação: 3 pedidos da mesma placa ao mesmo tempo, com a API simulada lenta | a API simulada é chamada **1 vez só**; os 3 recebem a mesma resposta; o teto sobe 1 |
| 9 | cache vence em 24 h (relógio simulado) | chama a API de novo |
| 10 | resposta da API com chassi, cor, município, UF, FIPE e outros | nenhum deles aparece na resposta |
| 11 | **chave falsa de teste** (texto óbvio, como `chave-falsa-de-teste`) | não aparece em **nenhuma** resposta, em nenhum log nem em nenhuma mensagem de erro, inclusive quando vai no caminho da URL e a chamada falha |
| 12 | placa de teste | não aparece em nenhuma linha de log |
| 13 | CORS | só o domínio do catálogo recebe o header de permissão |
| 14 | `/saude` | 200 e não chama a API |
| 15 | endereço da API fixo: variável de ambiente com outro endereço qualquer | a API simulada no endereço fixo do teste continua sendo a única chamada; nenhuma variável muda o destino da chave |

- **Site** (`web-site` e `testes`): placa com espaço e hífen é limpa; veículo → `q` certo (GOL e não "GOL 1.0 GIV"); as mensagens de 400, 404, 429 e 503; prints 1366 e 390 px; o endereço não leva a placa.
- **Revisão:** o `revisor-codigo`, com foco em segredo (chave em URL, log e erro) e LGPD.

**Plano de implantação e previsão (horas de trabalho do time, fora a espera pelo Alexandre):**

| # | Passo | Quem | Horas |
|---|---|---|---|
| 0 | Respostas P1 a P8 e "aprovado" neste desenho | Alexandre, pelo `po` | — |
| 1 | Serviço `servicos/placas/` com API simulada e os testes acima; PR comum | `integracao-placas` | 6 a 8 |
| 2 | Revisão do serviço (segredo e LGPD) | `revisor-codigo` | 1 a 2 |
| 3 | PR de governança com o bloco do `render.yaml` (item 2) | `gerente-projetos` propõe, o Alexandre autoriza | 0,5 |
| 4 | Render cria o serviço; o `/saude` responde "indisponivel" | Render | — |
| 5 | **Alexandre cria `API_PLACAS_TOKEN`** (item 6) | Alexandre | 0,1 |
| 6 | Simulação da aba 2 e prints 1366 e 390 px, depois ligar a aba ao serviço (**só depois do merge da T-0011**) | `web-site` | 3 a 4 |
| 7 | Testes do site e da busca por veículo | `testes` | 1,5 a 2 |
| 8 | Consulta real com 1 placa da empresa e conferência da lista | Alexandre | 0,1 |
| 9 | 1 semana de acompanhamento: consultas por dia, gasto e casos de "não casou" | `integracao-placas` (log sem placa) | 1 |
| | **Total do time** | | **cerca de 13 a 17 h** |

---

## 10. Recomendação do `integracao-placas`

1. **Aprovar este desenho** com: Node sem dependências, cache de 24 h em memória, limite de 10 consultas por minuto e 150 por dia por IP, teto de 300 por dia e 5.000 por mês (no máximo **R$ 150,00 por mês**, com cerca de R$ 60,00 esperados).
2. **Usar o saldo pré-pago da API PLACAS como teto real** (se a conta permitir), porque no plano grátis do Render a memória zera e os tetos do serviço não são garantidos.
3. **Usar `POST /veiculo`, com a placa no corpo** (decidido na revisão), para a placa não aparecer nos registros de acesso do Render; o IP vem só do último valor do `X-Forwarded-For`; o endereço da API fica fixo no código.
4. **Começar no plano grátis** e passar para o Starter só se a espera de até 1 minuto para acordar incomodar os vendedores.
5. **Não escrever nenhuma linha do serviço antes da resposta da P1.** Hoje, o formato da API (chave no caminho ou no header, e se o motor vem na consulta básica) é só suposição, porque a documentação oficial está bloqueada para leitura automática.
