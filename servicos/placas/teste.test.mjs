// Testes do serviço de placas com uma API FALSA local (nunca a real).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

function subir({ token = CHAVE, guarda, cwd = AQUI } = {}) {
  const env = { PATH: process.env.PATH, NODE_ENV: 'test', PLACAS_API_TESTE: apiUrl, PORT: '0', ORIGEM_PERMITIDA: ORIGEM };
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
