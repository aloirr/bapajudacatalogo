// Testes do serviço de placas com uma API FALSA local (nunca a real).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { diaManaus, nomeDoDia } from './contador.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CHAVE = 'chave-falsa-de-teste';
const ORIGEM = 'https://catalogo.exemplo.invalid';
const CAMPOS = ['montadora', 'modelo', 'modelo_lista', 'ano', 'ano_modelo', 'combustivel', 'cilindradas', 'potencia', 'motor'];

// ---------- API falsa (simula a wdapi2) ----------
const chamadas = [];
let apiUrl;
let api;
const dadosExemplo = (placa) => ({
  basico: {
    error: false, message: '',
    dados: {
      marcamodelo: 'VW/CROSSFOX', modelo: 'CROSSFOX', marca: 'VW', cor: 'PRATA',
      ano: '2007', anoModelo: '2007', municipio: 'Sao Leopoldo', uf: 'RS',
      placa_modelo_novo: placa, placa_modelo_antigo: placa, final_chassi: '98765',
      combustivel: 'Alcool / Gasolina', data: '21/10/2026', motor: 'MOTOR123456',
      cilindradas: '1599', potencia: '101', modelo_lista: ['CROSSFOX'], logo: 'x',
    },
  },
  error: false, message: 'Consulta efetuada com sucesso',
});

before(async () => {
  api = http.createServer((req, res) => {
    const placa = decodeURIComponent(req.url.replace('/v3/basico/', ''));
    chamadas.push({ placa, auth: req.headers.authorization, accept: req.headers.accept });
    const json = (st, o) => { res.writeHead(st, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (placa === 'NAO0A00') return json(200, { error: true, message: 'Placa não encontrada', basico: { error: true, message: 'Placa não encontrada' } });
    if (placa === 'RED1R23') { res.writeHead(302, { Location: '/v3/basico/ALV0A00' }); return res.end(); }
    if (placa === 'ERR0A00') return json(500, { error: true, message: 'erro interno SEGREDO-DA-API' });
    return json(200, dadosExemplo(placa));
  });
  await new Promise((r) => api.listen(0, '127.0.0.1', r));
  apiUrl = `http://127.0.0.1:${api.address().port}/v3/basico/`;
});
after(() => api.close());

// ---------- catálogo falso (no formato do /interno/codigos, só nos testes: CATALOGO_URL_TESTE) ----------
const CODIGOS = ['AMT7183', 'CXD13062', 'CXD13027', 'ROL3204-2RS', 'ROL2780/2720', 'TER5597000', 'PST0001', 'PST0002', 'PST0003', 'PST0004', 'SAIU0001'];
let catalogoUrl;
let catalogoSrv;
before(async () => {
  catalogoSrv = http.createServer((req, res) => {
    if (req.url !== '/data/produtos.json') { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const codigos = CODIGOS.filter((c) => c !== 'SAIU0001');
    res.end(JSON.stringify({ total: codigos.length, codigos }));
  });
  await new Promise((r) => catalogoSrv.listen(0, '127.0.0.1', r));
  catalogoUrl = `http://127.0.0.1:${catalogoSrv.address().port}/data/produtos.json`;
});
after(() => catalogoSrv.close());

// ---------- login falso (simula o /interno/codigos do serviço de login, T-0022) ----------
const CHAVE_INTERNA = 'chave-interna-falsa-de-teste';
const pedidosInternos = [];
let loginUrl;
let loginSrv;
before(async () => {
  loginSrv = http.createServer((req, res) => {
    pedidosInternos.push({ url: req.url, chave: req.headers['x-chave-interna'], cookie: req.headers.cookie });
    if (req.url !== '/interno/codigos') { res.writeHead(404); return res.end(); }
    if (req.headers['x-chave-interna'] !== CHAVE_INTERNA) { res.writeHead(401); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ total: 2, codigos: ['AMT7183', 'ROL3204-2RS'] }));
  });
  await new Promise((r) => loginSrv.listen(0, '127.0.0.1', r));
  loginUrl = `http://127.0.0.1:${loginSrv.address().port}`;
});
after(() => loginSrv.close());

const chamadasDe = (placa) => chamadas.filter((c) => c.placa === placa).length;

// Pastas temporárias: todas apagadas no fim.
const temporarias = [];
const pastaTemp = (prefixo = 'placas-') => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  temporarias.push(d);
  return d;
};

// ---------- sobe o serviço num processo novo ----------
const vivos = [];
after(() => {
  vivos.forEach((p) => p.kill());
  for (const d of temporarias) fs.rmSync(d, { recursive: true, force: true });
});

function subir({ token = CHAVE, guarda, cwd = AQUI, catalogo = catalogoUrl, extra = {} } = {}) {
  const env = { PATH: process.env.PATH, NODE_ENV: 'test', PLACAS_API_TESTE: apiUrl, PORT: '0', ORIGEM_PERMITIDA: ORIGEM, ...extra };
  if (catalogo) env.CATALOGO_URL_TESTE = catalogo;
  if (token) env.API_PLACAS_TOKEN = token;
  if (guarda) env.PASTA_GUARDA = guarda;
  const filho = spawn(process.execPath, [path.join(AQUI, 'server.mjs')], { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  vivos.push(filho);
  let saida = '';
  filho.stderr.on('data', (b) => { saida += b; });
  return new Promise((resolve, reject) => {
    filho.stdout.on('data', (b) => {
      saida += b;
      const m = /placas ouvindo (\d+)/.exec(saida);
      if (m && !filho._pronto) {
        filho._pronto = true;
        resolve({
          url: `http://127.0.0.1:${m[1]}`,
          logs: () => saida,
          parar: () => new Promise((r) => { filho.once('exit', r); filho.kill(); }),
        });
      }
    });
    filho.once('exit', () => reject(new Error('servico saiu: ' + saida)));
  });
}

const veiculo = (s, placa, { ip = '198.51.100.1', origem, corpo } = {}) => fetch(s.url + '/veiculo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip, ...(origem ? { Origin: origem } : {}) },
  body: corpo ?? JSON.stringify({ placa }),
});

// ---------- testes ----------
test('placa válida devolve só os 9 campos, motor das cilindradas', async () => {
  const s = await subir();
  const r = await veiculo(s, 'ABC1D23');
  assert.equal(r.status, 200);
  const txt = await r.text();
  const j = JSON.parse(txt);
  assert.deepEqual(Object.keys(j), CAMPOS);
  assert.deepEqual(j, {
    montadora: 'VW', modelo: 'CROSSFOX', modelo_lista: ['CROSSFOX'], ano: '2007', ano_modelo: '2007',
    combustivel: 'Alcool / Gasolina', cilindradas: '1599', potencia: '101', motor: '1.6',
  });
  for (const proibido of ['PRATA', 'Leopoldo', 'RS', '98765', 'MOTOR123456', 'ABC1D23', CHAVE, '21/10/2026']) {
    assert.ok(!txt.includes(proibido), 'vazou: ' + proibido);
  }
  const c = chamadas.find((x) => x.placa === 'ABC1D23');
  assert.equal(c.auth, `Bearer ${CHAVE}`);
  assert.equal(c.accept, 'application/json');
  await s.parar();
});

test('placa não encontrada dá 404 (e fica só na memória)', async () => {
  const dir = pastaTemp();
  const s = await subir({ guarda: dir });
  assert.equal((await veiculo(s, 'NAO0A00')).status, 404);
  assert.equal((await veiculo(s, 'NAO0A00')).status, 404);
  assert.equal(chamadasDe('NAO0A00'), 1);
  const arq = path.join(dir, 'veiculos.jsonl');
  assert.ok(!fs.existsSync(arq) || !fs.readFileSync(arq, 'utf8').includes('NAO0A00'));
  await s.parar();
});

test('placa inválida dá 400 e não chama a API', async () => {
  const s = await subir();
  const antes = chamadas.length;
  for (const p of ['AB12345', 'ABCD123', '', 'ABC1D234', 'A'.repeat(30)]) {
    assert.equal((await veiculo(s, p, { ip: '198.51.100.2' })).status, 400, p);
  }
  assert.equal((await veiculo(s, null, { ip: '198.51.100.2', corpo: 'nao-e-json' })).status, 400);
  assert.equal((await veiculo(s, null, { ip: '198.51.100.2', corpo: JSON.stringify({ placa: 'x'.repeat(2000) }) })).status, 413);
  assert.equal(chamadas.length, antes);
  await s.parar();
});

test('sem API_PLACAS_TOKEN dá 503 indisponivel', async () => {
  const s = await subir({ token: null });
  const r = await veiculo(s, 'SEM1A23');
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { erro: 'indisponivel' });
  assert.equal(chamadasDe('SEM1A23'), 0);
  assert.equal((await fetch(s.url + '/saude')).status, 200);
  await s.parar();
});

test('limite por IP: só conta o que chega à API, usa o ÚLTIMO X-Forwarded-For', async () => {
  await longeDaVirada();
  const s = await subir();
  // 400 não conta: 20 placas inválidas e depois uma nova ainda passa.
  for (let i = 0; i < 20; i++) assert.equal((await veiculo(s, 'XX', { ip: '203.0.113.9' })).status, 400);
  // 10 placas novas (cada uma chama a API) com o 1º valor forjado.
  for (let i = 0; i < 10; i++) {
    const r = await veiculo(s, `LIM${i}A23`, { ip: `10.0.0.${i}, 203.0.113.9` });
    assert.equal(r.status, 200, `LIM${i}A23`);
  }
  // A 11ª placa nova do mesmo IP: 429 sem chamar a API.
  const r = await veiculo(s, 'LIM0B23', { ip: '10.9.9.9, 203.0.113.9' });
  assert.equal(r.status, 429);
  assert.deepEqual(await r.json(), { erro: 'limite' });
  assert.ok(Number(r.headers.get('retry-after')) >= 1);
  assert.equal(chamadasDe('LIM0B23'), 0);
  // Placa no cache não é barrada, mesmo com o IP no limite.
  assert.equal((await veiculo(s, 'LIM0A23', { ip: '203.0.113.9' })).status, 200);
  assert.equal(chamadasDe('LIM0A23'), 1);
  // Outro IP segue livre.
  assert.equal((await veiculo(s, 'LIM0B23', { ip: '203.0.113.10' })).status, 200);
  await s.parar();
});

test('placa guardada repetida 200 vezes do mesmo IP: sempre 200, 1 chamada só', async () => {
  const dir = pastaTemp();
  const s = await subir({ guarda: dir });
  for (let i = 0; i < 200; i++) {
    assert.equal((await veiculo(s, 'REP1A23', { ip: '198.51.100.50' })).status, 200, `pedido ${i + 1}`);
  }
  assert.equal(chamadasDe('REP1A23'), 1);
  await s.parar();
});

test('teto de 300 por dia: o 301º pedido novo dá 429 sem chamar a API; guardada segue 200', async () => {
  const s = await subir();
  const placa = (i) => `TET${Math.floor(i / 100)}A${String(i % 100).padStart(2, '0')}`;
  const ip = (i) => `198.18.${Math.floor(i / 10)}.${i % 10}`; // 10 por IP: não bate no limite por IP
  for (let i = 0; i < 300; i++) assert.equal((await veiculo(s, placa(i), { ip: ip(i) })).status, 200, placa(i));
  const antes = chamadas.length;
  const r = await veiculo(s, 'TET9Z99', { ip: '198.18.99.1' });
  assert.equal(r.status, 429);
  assert.deepEqual(await r.json(), { erro: 'teto' });
  assert.ok(Number(r.headers.get('retry-after')) >= 1);
  assert.equal(chamadasDe('TET9Z99'), 0);
  assert.equal(chamadas.length, antes);
  assert.equal((await veiculo(s, placa(0), { ip: '198.18.99.1' })).status, 200);
  assert.equal(chamadas.length, antes);
  await s.parar();
});

test('arquivo de guarda corrompido: sobe e carrega só as linhas válidas', async () => {
  const dir = pastaTemp();
  const arq = path.join(dir, 'veiculos.jsonl');
  const boa = { placa: 'BOA1A23', montadora: 'FIAT', modelo: 'UNO', modelo_lista: ['UNO'], ano: '2010', ano_modelo: '2011',
    combustivel: 'Flex', cilindradas: '999', potencia: '75', motor: null };
  fs.writeFileSync(arq, [
    JSON.stringify(boa),
    '{quebrada',
    JSON.stringify({ ...boa, placa: 'ruim' }),
    'null',
    '',
    '{"placa":"CRT1A23","montadora":"FI', // última linha cortada, sem \n
  ].join('\n'));
  const s = await subir({ guarda: dir });
  assert.match(s.logs(), /guarda ok 1\b/);
  const r = await veiculo(s, 'BOA1A23');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).motor, '1.0');
  assert.equal(chamadasDe('BOA1A23'), 0);
  assert.equal((await veiculo(s, 'CRT1A23')).status, 200);
  assert.equal(chamadasDe('CRT1A23'), 1);
  await s.parar();
  const ultima = fs.readFileSync(arq, 'utf8').trim().split('\n').pop();
  assert.equal(JSON.parse(ultima).placa, 'CRT1A23', 'a linha nova não grudou na linha cortada');
  const b = await subir({ guarda: dir });
  assert.match(b.logs(), /guarda ok 2\b/);
  await b.parar();
});

test('cache: antigo e Mercosul da mesma placa fazem 1 chamada; pedidos simultâneos esperam a mesma', async () => {
  const s = await subir();
  assert.equal((await veiculo(s, 'EST1234')).status, 200);
  assert.equal((await veiculo(s, 'est-1c34')).status, 200);
  assert.equal(chamadasDe('EST1C34'), 1);
  const rs = await Promise.all([1, 2, 3].map(() => veiculo(s, 'SIM1A23', { ip: '198.51.100.3' })));
  rs.forEach((r) => assert.equal(r.status, 200));
  assert.equal(chamadasDe('SIM1A23'), 1);
  await s.parar();
});

test('nenhum log tem a placa, o IP, a chave, a URL da API ou a mensagem de erro', async () => {
  const s = await subir();
  await veiculo(s, 'LOG1A23', { ip: '192.0.2.77' });
  await veiculo(s, 'NAO0A00', { ip: '192.0.2.77' });
  await veiculo(s, 'ERR0A00', { ip: '192.0.2.77' });
  await veiculo(s, 'XX', { ip: '192.0.2.77' });
  const log = s.logs();
  for (const proibido of ['LOG1A23', 'NAO0A00', 'ERR0A00', '192.0.2.77', '127.0.0.1', CHAVE, 'Bearer', '/v3/basico', 'SEGREDO', 'não encontrada']) {
    assert.ok(!log.includes(proibido), 'log vazou: ' + proibido);
  }
  assert.match(log, /veiculo 200 \d+ms/);
  assert.match(log, /veiculo 404 \d+ms/);
  assert.match(log, /veiculo 503 \d+ms/);
  await s.parar();
});

test('erro da API dá 503 sem repassar a mensagem', async () => {
  const s = await subir();
  const r = await veiculo(s, 'ERR0A00');
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { erro: 'indisponivel' });
  await s.parar();
});

test('redirect da API é recusado: 503 e a chave não segue', async () => {
  const s = await subir();
  const r = await veiculo(s, 'RED1R23');
  assert.equal(r.status, 503);
  assert.equal(chamadasDe('ALV0A00'), 0);
  await s.parar();
});

test('guarda em disco: sobrevive ao reinício e só tem a placa e os 9 campos', async () => {
  const dir = pastaTemp();
  const a = await subir({ guarda: dir });
  assert.equal((await veiculo(a, 'DSK1234')).status, 200);
  await a.parar();
  assert.equal(chamadasDe('DSK1C34'), 1);
  const b = await subir({ guarda: dir });
  const r = await veiculo(b, 'DSK1C34');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).motor, '1.6');
  assert.equal(chamadasDe('DSK1C34'), 1, 'a 2ª consulta, depois do reinício, não chama a API');
  await b.parar();
  const linhas = fs.readFileSync(path.join(dir, 'veiculos.jsonl'), 'utf8').trim().split('\n');
  assert.equal(linhas.length, 1);
  const reg = JSON.parse(linhas[0]);
  assert.deepEqual(Object.keys(reg), ['placa', ...CAMPOS]);
  assert.equal(reg.placa, 'DSK1C34');
  for (const proibido of ['PRATA', 'Leopoldo', '98765', 'MOTOR123456', '2026', '198.51', CHAVE]) {
    assert.ok(!linhas[0].includes(proibido), 'disco vazou: ' + proibido);
  }
});

test('sem PASTA_GUARDA nada é gravado em disco', async () => {
  const dir = pastaTemp('placas-vazia-');
  const s = await subir({ cwd: dir });
  assert.equal((await veiculo(s, 'MEM1A23')).status, 200);
  await s.parar();
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('CORS só para a origem permitida; /saude não chama a API; outra rota 404, outro método 405', async () => {
  const s = await subir();
  const ok = await fetch(s.url + '/veiculo', { method: 'OPTIONS', headers: { Origin: ORIGEM } });
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('access-control-allow-origin'), ORIGEM);
  const ruim = await fetch(s.url + '/veiculo', { method: 'OPTIONS', headers: { Origin: 'https://outro.invalid' } });
  assert.equal(ruim.status, 403);
  assert.equal(ruim.headers.get('access-control-allow-origin'), null);
  assert.equal((await veiculo(s, 'COR1A23', { origem: 'https://outro.invalid' })).status, 403);
  const r = await veiculo(s, 'COR1A23', { origem: ORIGEM });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGEM);
  const antes = chamadas.length;
  const sd = await fetch(s.url + '/saude');
  assert.equal(sd.status, 200);
  assert.deepEqual(await sd.json(), { ok: true });
  assert.equal(chamadas.length, antes);
  assert.equal((await fetch(s.url + '/outra')).status, 404);
  assert.equal((await fetch(s.url + '/veiculo')).status, 405);
  assert.equal((await fetch(s.url + '/veiculo?placa=ABC1D23', { method: 'POST', body: '{"placa":"ABC1D23"}' })).status, 400);
  await s.parar();
});

// ---------- contador de aberturas (T-0018) ----------
const nomeDia = (atras) => nomeDoDia(diaManaus(Date.now()) - atras) + '.json';

const contar = (s, codigo, { ip = '198.51.100.20', origem = ORIGEM, corpo } = {}) => fetch(s.url + '/contar', {
  method: 'POST',
  headers: { 'X-Forwarded-For': ip, ...(origem ? { Origin: origem } : {}) },
  body: corpo ?? JSON.stringify({ codigo }),
});
const maisVistos = async (s, dias) => {
  const r = await fetch(s.url + '/mais-vistos' + (dias === undefined ? '' : `?dias=${dias}`), { headers: { Origin: ORIGEM } });
  return { status: r.status, corpo: await r.json(), cors: r.headers.get('access-control-allow-origin') };
};
async function esperarLog(s, re) {
  for (let i = 0; i < 100 && !re.test(s.logs()); i++) await new Promise((r) => setTimeout(r, 20));
}
async function esperarCatalogo(s) {
  await esperarLog(s, /catalogo (ok|indisponivel)/);
  assert.match(s.logs(), /catalogo ok 10\b/);
}
// Os limites (placa e contador) usam a janela do minuto do relógio: não começa nos últimos 8 s do minuto.
async function longeDaVirada() {
  const resto = 60000 - (Date.now() % 60000);
  if (resto < 8000) await new Promise((r) => setTimeout(r, resto + 50));
}

test('contar: código do catálogo dá 204; inválido, fora do catálogo ou na query dá 400', async () => {
  const s = await subir();
  await esperarCatalogo(s);
  const r = await contar(s, 'AMT7183');
  assert.equal(r.status, 204);
  assert.equal(await r.text(), '');
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGEM);
  assert.equal((await contar(s, ' amt7183 ')).status, 204, 'aceita espaço nas pontas e minúsculas');
  assert.equal((await contar(s, 'ROL2780/2720')).status, 204);
  for (const c of ['NAOEXISTE1', 'SAIU0001', '', 'A'.repeat(60), 123, null]) {
    const x = await contar(s, c);
    assert.equal(x.status, 400, String(c));
    assert.deepEqual(await x.json(), { erro: 'codigo_invalido' });
  }
  assert.equal((await contar(s, null, { corpo: 'nao-e-json' })).status, 400);
  const g = await contar(s, null, { corpo: '{"codigo":"' + 'x'.repeat(2000) + '"}' });
  assert.equal(g.status, 413);
  assert.deepEqual(await g.json(), { erro: 'grande' });
  const q = await fetch(s.url + '/contar?codigo=AMT7183', { method: 'POST', headers: { Origin: ORIGEM }, body: '{"codigo":"AMT7183"}' });
  assert.equal(q.status, 400);
  assert.equal((await fetch(s.url + '/contar', { headers: { Origin: ORIGEM } })).status, 405);
  const m = await maisVistos(s, 7);
  assert.deepEqual(m.corpo, { total: 3, itens: [{ codigo: 'AMT7183', n: 2 }, { codigo: 'ROL2780/2720', n: 1 }] });
  await s.parar();
});

test('contar: origem errada ou sem Origin dá 403 e não conta', async () => {
  const s = await subir();
  await esperarCatalogo(s);
  const r = await contar(s, 'AMT7183', { origem: 'https://outro.invalid' });
  assert.equal(r.status, 403);
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  assert.equal((await contar(s, 'AMT7183', { origem: null })).status, 403);
  const pre = await fetch(s.url + '/contar', { method: 'OPTIONS', headers: { Origin: 'https://outro.invalid' } });
  assert.equal(pre.status, 403);
  const preOk = await fetch(s.url + '/contar', { method: 'OPTIONS', headers: { Origin: ORIGEM } });
  assert.equal(preOk.status, 204);
  assert.equal(preOk.headers.get('access-control-allow-origin'), ORIGEM);
  assert.equal((await fetch(s.url + '/mais-vistos', { headers: { Origin: 'https://outro.invalid' } })).status, 403);
  assert.deepEqual((await maisVistos(s, 7)).corpo, { total: 0, itens: [] });
  await s.parar();
});

test('contar: sem o catálogo carregado dá 503 (não conta às cegas)', async () => {
  const s = await subir({ catalogo: 'http://127.0.0.1:9/data/produtos.json' });
  await esperarLog(s, /catalogo indisponivel/);
  const r = await contar(s, 'AMT7183');
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { erro: 'indisponivel' });
  assert.equal((await veiculo(s, 'CAT1A23')).status, 200, 'a placa segue funcionando');
  await s.parar();
});

test('contar: limite de 30 por IP e 120 no serviço, por minuto, com 429 e Retry-After', async () => {
  await longeDaVirada();
  const s = await subir();
  await esperarCatalogo(s);
  for (let i = 0; i < 30; i++) assert.equal((await contar(s, 'CXD13062', { ip: '203.0.113.1' })).status, 204, `pedido ${i + 1}`);
  const r = await contar(s, 'CXD13062', { ip: '10.1.1.1, 203.0.113.1' }); // vale o ÚLTIMO X-Forwarded-For
  assert.equal(r.status, 429);
  assert.deepEqual(await r.json(), { erro: 'limite' });
  assert.ok(Number(r.headers.get('retry-after')) >= 1);
  // Outros IPs até o teto do serviço (120 no minuto).
  for (let i = 0; i < 90; i++) assert.equal((await contar(s, 'CXD13062', { ip: `203.0.113.${10 + Math.floor(i / 30)}` })).status, 204);
  const t = await contar(s, 'CXD13062', { ip: '203.0.113.99' });
  assert.equal(t.status, 429);
  assert.deepEqual(await t.json(), { erro: 'teto' });
  assert.equal((await maisVistos(s, 1)).corpo.total, 120, 'o 429 não contou');
  await s.parar();
});

test('mais-vistos: janela de 7 dias, até 8 itens (10 códigos na janela), dias de 1 a 30', async () => {
  const dir = pastaTemp();
  fs.writeFileSync(path.join(dir, nomeDia(1)), JSON.stringify({ AMT7183: 5, CXD13062: 1 }));
  fs.writeFileSync(path.join(dir, nomeDia(3)), JSON.stringify({ PST0001: 3, PST0002: 3, PST0003: 1, PST0004: 1, 'ROL2780/2720': 1 }));
  fs.writeFileSync(path.join(dir, nomeDia(6)), JSON.stringify({ CXD13027: 4, TER5597000: 2, 'ROL3204-2RS': 2 }));
  fs.writeFileSync(path.join(dir, nomeDia(7)), JSON.stringify({ CXD13062: 50 }));
  fs.writeFileSync(path.join(dir, nomeDia(20)), JSON.stringify({ SAIU0001: 99, TER5597000: 10 }));
  const s = await subir({ guarda: dir });
  await esperarCatalogo(s);
  assert.equal((await contar(s, 'AMT7183')).status, 204);
  const m = await maisVistos(s, 7);
  assert.equal(m.status, 200);
  assert.equal(m.cors, ORIGEM);
  // 10 códigos distintos na janela: saem os 8 primeiros; o empate em 1 vai pela ordem do código.
  assert.deepEqual(m.corpo, {
    total: 24,
    itens: [
      { codigo: 'AMT7183', n: 6 }, { codigo: 'CXD13027', n: 4 }, { codigo: 'PST0001', n: 3 }, { codigo: 'PST0002', n: 3 },
      { codigo: 'ROL3204-2RS', n: 2 }, { codigo: 'TER5597000', n: 2 }, { codigo: 'CXD13062', n: 1 }, { codigo: 'PST0003', n: 1 },
    ],
  });
  assert.ok(!JSON.stringify(m.corpo).includes('PST0004') && !JSON.stringify(m.corpo).includes('ROL2780'), 'o 9º e o 10º ficam de fora');
  assert.deepEqual(await maisVistos(s), m, 'sem dias = 7');
  const m8 = await maisVistos(s, 8);
  assert.equal(m8.corpo.total, 74);
  assert.deepEqual(m8.corpo.itens[0], { codigo: 'CXD13062', n: 51 });
  const m30 = await maisVistos(s, 30);
  assert.equal(m30.corpo.total, 84, 'código que saiu do catálogo não entra');
  assert.ok(!JSON.stringify(m30.corpo).includes('SAIU0001'));
  assert.deepEqual((await maisVistos(s, 1)).corpo, { total: 1, itens: [{ codigo: 'AMT7183', n: 1 }] });
  for (const d of ['0', '31', '-1', 'abc', '7.5', '']) {
    const x = await fetch(s.url + '/mais-vistos?dias=' + d);
    assert.equal(x.status, 400, d);
    assert.deepEqual(await x.json(), { erro: 'dias_invalido' });
  }
  await s.parar();
});

test('disco: um arquivo por dia só com {codigo: n}, sobrevive ao reinício; limpeza de 30 dias', async () => {
  const dir = pastaTemp();
  for (const atras of [29, 30, 31, 45]) fs.writeFileSync(path.join(dir, nomeDia(atras)), JSON.stringify({ TER5597000: 1 }));
  fs.writeFileSync(path.join(dir, nomeDia(2)), '{quebrado');
  fs.writeFileSync(path.join(dir, nomeDia(0) + '.tmp'), 'sobra de escrita interrompida');
  fs.writeFileSync(path.join(dir, 'veiculos.jsonl'), '');
  fs.writeFileSync(path.join(dir, 'outro.json'), '{}');
  const a = await subir({ guarda: dir });
  await esperarCatalogo(a);
  assert.ok(!fs.existsSync(path.join(dir, nomeDia(31))), '31 dias: apagado');
  assert.ok(!fs.existsSync(path.join(dir, nomeDia(45))), '45 dias: apagado');
  assert.ok(fs.existsSync(path.join(dir, nomeDia(30))), '30 dias: fica');
  assert.ok(fs.existsSync(path.join(dir, nomeDia(29))));
  assert.ok(!fs.existsSync(path.join(dir, nomeDia(0) + '.tmp')), 'sobra .tmp apagada');
  assert.ok(fs.existsSync(path.join(dir, 'veiculos.jsonl')) && fs.existsSync(path.join(dir, 'outro.json')), 'não mexe no que não é do contador');
  for (let i = 0; i < 3; i++) assert.equal((await contar(a, 'AMT7183', { ip: '192.0.2.123' })).status, 204);
  assert.equal((await contar(a, 'CXD13062', { ip: '192.0.2.124' })).status, 204);
  await a.parar(); // SIGTERM grava antes de sair
  const hoje = fs.readFileSync(path.join(dir, nomeDia(0)), 'utf8');
  assert.deepEqual(JSON.parse(hoje), { AMT7183: 3, CXD13062: 1 });
  const b = await subir({ guarda: dir });
  await esperarCatalogo(b);
  assert.equal((await contar(b, 'AMT7183', { ip: '192.0.2.123' })).status, 204);
  assert.deepEqual((await maisVistos(b, 7)).corpo, { total: 5, itens: [{ codigo: 'AMT7183', n: 4 }, { codigo: 'CXD13062', n: 1 }] });
  await b.parar();
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, nomeDia(0)), 'utf8')), { AMT7183: 4, CXD13062: 1 });
});

test('contador: nada de IP, origem, hora ou placa no disco nem no log', async () => {
  const dir = pastaTemp();
  const s = await subir({ guarda: dir });
  await esperarCatalogo(s);
  await veiculo(s, 'PRV1A23', { ip: '192.0.2.201' });
  for (const c of ['AMT7183', 'ROL3204-2RS', 'NAOEXISTE1']) await contar(s, c, { ip: '192.0.2.201' });
  await contar(s, 'AMT7183', { ip: '192.0.2.202', origem: 'https://outro.invalid' });
  await maisVistos(s, 7);
  await s.parar();
  const arquivos = fs.readdirSync(dir).sort();
  assert.deepEqual(arquivos, [nomeDia(0), 'veiculos.jsonl'].sort());
  const dia = fs.readFileSync(path.join(dir, nomeDia(0)), 'utf8');
  assert.deepEqual(JSON.parse(dia), { AMT7183: 1, 'ROL3204-2RS': 1 });
  const tudo = arquivos.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  for (const p of ['192.0.2', '127.0.0.1', 'outro.invalid', ORIGEM, 'NAOEXISTE1', CHAVE]) assert.ok(!tudo.includes(p), 'vazou no disco: ' + p);
  const log = s.logs();
  for (const proibido of ['AMT7183', 'ROL3204', 'NAOEXISTE1', 'PRV1A23', '192.0.2', 'outro.invalid', catalogoUrl]) {
    assert.ok(!log.includes(proibido), 'log vazou: ' + proibido);
  }
  assert.match(log, /contar 204 \d+ms/);
  assert.match(log, /contar 400 \d+ms/);
  assert.match(log, /contar 403 \d+ms/);
  assert.match(log, /mais-vistos 200 \d+ms/);
});

test('contar (T-0022): com CATALOGO_URL e CHAVE_INTERNA lê os códigos do /interno/codigos do login', async () => {
  const antes = pedidosInternos.length;
  // O catálogo falso (catalogo) fica de lado: a fonte é o login.
  const s = await subir({ extra: { CATALOGO_URL: loginUrl, CHAVE_INTERNA } });
  await esperarLog(s, /catalogo (ok|indisponivel)/);
  assert.match(s.logs(), /catalogo ok 2\b/);
  const meus = pedidosInternos.slice(antes);
  assert.equal(meus.length, 1);
  assert.equal(meus[0].url, '/interno/codigos');
  assert.equal(meus[0].chave, CHAVE_INTERNA);
  assert.equal(meus[0].cookie, undefined, 'sem cookie');
  assert.equal((await contar(s, 'AMT7183')).status, 204);
  assert.equal((await contar(s, 'CXD13062')).status, 400, 'fora da lista do login');
  await s.parar();
  for (const proibido of [CHAVE_INTERNA, loginUrl]) assert.ok(!s.logs().includes(proibido), 'log vazou: ' + proibido);
});

test('contar (T-0022): chave interna errada deixa o /contar em 503, sem vazar a chave', async () => {
  const s = await subir({ extra: { CATALOGO_URL: loginUrl, CHAVE_INTERNA: 'outra-chave-falsa' } });
  await esperarLog(s, /catalogo (ok|indisponivel)/);
  assert.match(s.logs(), /catalogo indisponivel/);
  assert.equal((await contar(s, 'AMT7183')).status, 503);
  await s.parar();
  assert.ok(!s.logs().includes('outra-chave-falsa'));
});

test('contar (T-0022): sem as duas variáveis (ou só com uma) não há reserva: /contar 503', async () => {
  for (const extra of [{}, { CATALOGO_URL: loginUrl }, { CHAVE_INTERNA }]) {
    const antes = pedidosInternos.length;
    const s = await subir({ catalogo: null, extra });
    await esperarLog(s, /catalogo (ok|indisponivel)/);
    assert.match(s.logs(), /catalogo indisponivel/);
    assert.equal(pedidosInternos.length, antes, 'não chamou o login');
    assert.equal((await contar(s, 'AMT7183')).status, 503);
    assert.equal((await veiculo(s, 'CAT1A23')).status, 200, 'a placa segue funcionando');
    await s.parar();
  }
});

test('contar (T-0022): fora dos testes, CATALOGO_URL sem https não recebe a chave', async () => {
  const { fonteDoCatalogo } = await import('./server.mjs');
  assert.deepEqual(fonteDoCatalogo({ CATALOGO_URL: 'http://login.exemplo.invalid', CHAVE_INTERNA }), { url: null });
  assert.deepEqual(fonteDoCatalogo({ CATALOGO_URL: 'https://login.exemplo.invalid/', CHAVE_INTERNA }), {
    url: 'https://login.exemplo.invalid/interno/codigos', headers: { 'X-Chave-Interna': CHAVE_INTERNA },
  });
  // Sem reserva: o ORIGEM_PERMITIDA (CORS) não vira fonte, e o endereço de teste só vale com NODE_ENV=test.
  assert.deepEqual(fonteDoCatalogo({ ORIGEM_PERMITIDA: 'https://site.exemplo.invalid' }), { url: null });
  assert.deepEqual(fonteDoCatalogo({ ORIGEM_PERMITIDA: 'https://site.exemplo.invalid', CATALOGO_URL: 'https://login.exemplo.invalid' }), { url: null });
  assert.deepEqual(fonteDoCatalogo({ ORIGEM_PERMITIDA: 'https://site.exemplo.invalid', CHAVE_INTERNA }), { url: null });
  assert.deepEqual(fonteDoCatalogo({ CATALOGO_URL_TESTE: 'http://127.0.0.1:9/data/produtos.json' }), { url: null });
});
