# Serviço de consulta por placa (T-0005) e contador de aberturas (T-0018)

Serviço pequeno, em Node 18+ e **sem dependências**, que recebe a placa do site e devolve só os dados do veículo. Desenho: `docs/placas/DESENHO.md` (PR #22).

## Como roda

- No Render: `node server.mjs` (pasta `servicos/placas`). Ele escuta em `PORT`.
- Local, só com a API falsa dos testes: `node --test servicos/placas/teste.test.mjs`. **Nunca teste com a chave real.**

## Rotas

- `GET /saude`: `{"ok":true}`. Não chama a API.
- `POST /veiculo`, corpo `{"placa":"ABC1D23"}` (até 1 KB). Aceita o padrão antigo (`ABC1234`) e o Mercosul (`ABC1D23`).
  - 200: `{montadora, modelo, modelo_lista, ano, ano_modelo, combustivel, cilindradas, potencia, motor}`. O `motor` é montado das cilindradas (1599 → "1.6"); o campo `motor` da API (número de série) é descartado.
  - 400 placa inválida · 404 não encontrada · 413 corpo grande demais · 429 limite (`{"erro":"limite"}` por IP ou `{"erro":"teto"}` do dia, com `Retry-After`) · 503 indisponível.
- `POST /contar`, corpo `{"codigo":"AMT7183"}` (até 1 KB): conta **uma abertura** da página do produto (T-0018, decisão do Alexandre em R-20261120-141600).
  - Só da origem `ORIGEM_PERMITIDA`: o header `Origin` é **obrigatório** (sem ele ou com outro, 403). `OPTIONS` responde à pré-checagem do CORS.
  - O código precisa existir no catálogo (espaço nas pontas e minúsculas são aceitos). Não aceita query no endereço.
  - 204 contou (sem corpo) · 400 `{"erro":"codigo_invalido"}` · 403 `{"erro":"origem"}` · 413 `{"erro":"grande"}` (corpo acima de 1 KB) · 429 `{"erro":"limite"}` (30 por IP no minuto) ou `{"erro":"teto"}` (120 no serviço no minuto), com `Retry-After` · 503 `{"erro":"indisponivel"}` enquanto a lista de códigos não foi lida.
  - **[SUPOSIÇÃO: os números 30 e 120 são a confirmar com o Alexandre.]** O `Origin` **não é prova**: fora do navegador (curl, robô) qualquer um escreve o header que quiser. Ele só barra outro site de contar pelo navegador do visitante; contra quem quer inflar a contagem de fora, o que segura são os limites 30/120 por minuto e a lista de códigos do catálogo.
  - O site pode mandar sem `Content-Type` (vai como texto e não faz pré-checagem): `fetch(URL + '/contar', {method:'POST', body: JSON.stringify({codigo}), keepalive:true})`. Erro do contador nunca deve atrapalhar a página.
- `GET /mais-vistos?dias=7` (sem `dias`, vale 7; aceita de 1 a 30): `{"total": N, "itens": [{"codigo":"AMT7183","n":12}, ...]}`.
  - `total` é a soma das aberturas na janela; `itens` traz **até 8** códigos, os mais abertos (empate: ordem do código; decisão do Alexandre em R-20261120-144530). A janela é hoje (dia de Manaus) e os `dias − 1` dias antes.
  - Código que saiu do catálogo não entra nem no total.
  - 400 `{"erro":"dias_invalido"}` · 403 com `Origin` de outro site. Sem `Origin` (curl) responde.
  - A regra "mostrar Destaques até haver 20 aberturas em 7 dias" fica no site: `total < 20` → Destaques.

## Lista de códigos do catálogo (para o `/contar`)

O serviço baixa a lista ao subir e de novo a cada 6 h (se falhar, tenta a cada 1 min). Fica só o conjunto dos códigos, em memória.
- **Com `CATALOGO_URL` e `CHAVE_INTERNA`** (T-0022, catálogo atrás do login): `GET CATALOGO_URL/interno/codigos` com o cabeçalho `X-Chave-Interna`, sem cookie. Só `https` (fora dos testes). A chave e o endereço nunca vão para o log.
- **Sem as duas:** como antes, o `produtos.json` **publicado** (`ORIGEM_PERMITIDA` + `/data/produtos.json`). Assim a troca no Render não derruba o `/contar`.
Motivo: no Render o serviço tem `rootDir: servicos/placas`, e os arquivos fora dessa pasta **não existem para ele** (nem no build nem rodando). Ler `site/data/produtos.json` do disco não funciona lá, e um arquivo de códigos copiado aqui ficaria velho a cada `gerar_site.py`. Assim a lista é sempre a que está no ar, sem variável nova e sem mexer no `render.yaml`.

## Variáveis de ambiente (no painel do Render)

| Variável | Quem põe | Para quê |
|---|---|---|
| `API_PLACAS_TOKEN` | **o Alexandre**, no painel do Render | a chave da API PLACAS. Nunca vai para o Git, um doc, um recado ou o chat. Sem ela, `/veiculo` responde 503. |
| `ORIGEM_PERMITIDA` | `render.yaml` | o endereço do catálogo (CORS). Outra origem recebe 403. Também dá o endereço do `produtos.json` publicado (lista de códigos do `/contar`). |
| `CATALOGO_URL` | `render.yaml` | o endereço do serviço de login (T-0022), de onde vem a lista de códigos do `/contar`. Só vale junto com `CHAVE_INTERNA`. |
| `CHAVE_INTERNA` | `render.yaml` (`fromService`, gerada pelo Render no login) | a chave do `/interno/codigos`. Ninguém digita nem vê. |
| `PASTA_GUARDA` | `render.yaml` (disco em `/var/data`) | onde ficam a guarda das placas (`veiculos.jsonl`) e as contagens por dia (`AAAA-MM-DD.json`). Sem ela, só memória. |

O endereço da API (`https://wdapi2.com.br/v3/basico/`) é **fixo no código**, não é variável.

## O que fica guardado e onde

### Contador (T-0018)

- **Disco** (`$PASTA_GUARDA/AAAA-MM-DD.json`, um arquivo por dia de Manaus): **só** `{"CODIGO": n}`. Nada de IP, placa, texto digitado, cookie, origem, hora ou ordem das aberturas.
  - Escrita atômica (`.tmp` e `rename`), juntando as aberturas de até 5 s; no `SIGTERM` (deploy ou reinício) grava antes de sair. Se o serviço cair sem aviso, perde no máximo esses 5 s.
  - Arquivo com **mais de 30 dias** é apagado ao subir e na virada do dia. Sobra `.tmp` é apagada ao subir. Os outros arquivos da pasta (`veiculos.jsonl`) não são tocados.
  - Sem `PASTA_GUARDA` (ou disco com falha), conta só em memória e zera no reinício.
- **Memória:** os contadores do limite do minuto. O IP entra **só como HMAC** (a mesma semente sorteada da placa), nunca em disco nem em log, e some no minuto seguinte.

### Placa (T-0005)

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

Só status e contagens, sem dado do pedido: `<rota> <status> <tempo>ms` (veiculo, contar, mais-vistos) e as linhas de partida e falha (`placas ouvindo <porta>`, `guarda …`, `contador …`, `catalogo …`). Nunca a placa, o código aberto, o IP, os headers, a URL da API, a chave ou a mensagem de erro.
