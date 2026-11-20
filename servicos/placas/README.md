# Serviço de consulta por placa (T-0005)

Serviço pequeno, em Node 18+ e **sem dependências**, que recebe a placa do site e devolve só os dados do veículo. Desenho: `docs/placas/DESENHO.md` (PR #22).

## Como roda

- No Render: `node server.mjs` (pasta `servicos/placas`). Ele escuta em `PORT`.
- Local, só com a API falsa dos testes: `node --test servicos/placas/teste.test.mjs`. **Nunca teste com a chave real.**

## Rotas

- `GET /saude`: `{"ok":true}`. Não chama a API.
- `POST /veiculo`, corpo `{"placa":"ABC1D23"}` (até 1 KB). Aceita o padrão antigo (`ABC1234`) e o Mercosul (`ABC1D23`).
  - 200: `{montadora, modelo, modelo_lista, ano, ano_modelo, combustivel, cilindradas, potencia, motor}`. O `motor` é montado das cilindradas (1599 → "1.6"); o campo `motor` da API (número de série) é descartado.
  - 400 placa inválida · 404 não encontrada · 413 corpo grande demais · 429 limite (`{"erro":"limite"}` por IP ou `{"erro":"teto"}` do dia, com `Retry-After`) · 503 indisponível.

## Variáveis de ambiente (no painel do Render)

| Variável | Quem põe | Para quê |
|---|---|---|
| `API_PLACAS_TOKEN` | **o Alexandre**, no painel do Render | a chave da API PLACAS. Nunca vai para o Git, um doc, um recado ou o chat. Sem ela, `/veiculo` responde 503. |
| `ORIGEM_PERMITIDA` | `render.yaml` | o endereço do catálogo (CORS). Outra origem recebe 403. |
| `PASTA_GUARDA` | `render.yaml` (disco em `/var/data`) | onde fica a guarda permanente. Sem ela, só memória. |

O endereço da API (`https://wdapi2.com.br/v3/basico/`) é **fixo no código**, não é variável.

## O que fica guardado e onde

- **Disco** (`$PASTA_GUARDA/veiculos.jsonl`, uma linha por placa, permanente, decisão do Alexandre em R-20261120-110140): **só** a placa na forma Mercosul e os 9 campos do veículo. Nada de data, hora, IP, chassi, cor, município, UF, motor da API ou chave. A mesma placa não é consultada (nem cobrada) de novo.
- **Memória** (some quando o serviço reinicia): o cache de 24 h, a "placa não encontrada" por 24 h **[SUPOSIÇÃO: o desenho falava em 1 h; ficou 24 h, só em memória, para o mesmo erro não ser cobrado de novo no dia]** (não vai para o disco) e os contadores dos limites. Nada fica à vista: a placa e o IP viram um HMAC com uma semente sorteada a cada partida do serviço, que não fica em lugar nenhum.
- Se o disco falhar, o serviço segue só com a memória.

## Limites (contra abuso)

- **Só conta o pedido que chega à API.** Placa guardada no disco, no cache, "não encontrada" já na memória, pedido igual em andamento e erro 400 nunca contam nem são barrados. A loja inteira sai por um IP só: as placas já consultadas seguem respondendo mesmo com o limite batido.
- Por IP (o último valor do `X-Forwarded-For`, guardado só como HMAC): 10 consultas novas por minuto e 150 por dia.
- Teto do serviço: 300 consultas à API por dia (dia de Manaus). A vaga é reservada **antes** de chamar a API; a 301ª placa nova do dia recebe 429 sem chamar.
- O teto diário e os contadores ficam **só em memória e zeram quando o serviço reinicia** (deploy ou reinício no Render).
- **Não há teto mensal.** O teto de 5.000 por mês do desenho saiu pela decisão do Alexandre (R-20261120-110140): "é pre paga, mas nao se preocupe com isso". O saldo pré-pago da API PLACAS é o limite real.

## Log

Só `veiculo <status> <tempo>ms`. Nunca a placa, o IP, os headers, a URL da API, a chave ou a mensagem de erro.
