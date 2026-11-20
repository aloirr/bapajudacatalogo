// Serviço de consulta por placa (T-0005) e contador de aberturas (T-0018).
// Node 18+, sem dependências.
// Regras: a chave só vem de API_PLACAS_TOKEN; o log nunca leva placa, IP,
// código aberto, headers, URL da API, chave ou mensagem de erro.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  criarContador, criarCatalogo, normalizarCodigo, diaManaus, H24, FUSO_MANAUS, JANELA_MAX, JANELA_PADRAO,
} from './contador.mjs';

// Endereço FIXO. Só os testes (NODE_ENV=test) podem trocar.
const API_FIXA = 'https://wdapi2.com.br/v3/basico/';
const API_BASE = process.env.NODE_ENV === 'test' && process.env.PLACAS_API_TESTE
  ? process.env.PLACAS_API_TESTE
  : API_FIXA;

const LIMITE_IP_MINUTO = 10;
const LIMITE_IP_DIA = 150;
const TETO_DIA = 300;
const TIMEOUT_MS = 8000;
const CORPO_MAX = 1024;
const RESPOSTA_MAX = 256 * 1024;
const PASTA_GUARDA = process.env.PASTA_GUARDA || null;
// Contador (T-0018) [SUPOSIÇÃO: números a confirmar com o Alexandre].
const CONTAR_IP_MINUTO = 30;    // aberturas contadas por IP por minuto
const CONTAR_TETO_MINUTO = 120; // aberturas contadas no serviço inteiro por minuto

const semente = crypto.randomBytes(32);
const chave = (placa) => crypto.createHmac('sha256', semente).update(placa).digest('hex');

const cache = new Map();     // chave -> { status, dados, expira }
const guardados = new Map(); // chave -> dados (vindos do disco)
const emVoo = new Map();     // chave -> Promise
const porIp = new Map();     // HMAC(ip) -> { min, contMin, dia, contDia } (IP nunca cru)
let teto = { dia: -1, cont: 0 };
const contarPorIp = new Map(); // HMAC(ip) -> { min, cont } (só memória, nunca em disco nem log)
let contarTeto = { min: -1, cont: 0 };

const log = (msg) => console.log(msg);

const contador = criarContador({ pasta: PASTA_GUARDA, log });
function urlDoCatalogo() {
  if (process.env.NODE_ENV === 'test' && process.env.CATALOGO_URL_TESTE) return process.env.CATALOGO_URL_TESTE;
  try { return new URL('/data/produtos.json', process.env.ORIGEM_PERMITIDA).href; } catch { return null; }
}
const catalogo = criarCatalogo({ url: urlDoCatalogo(), log });

// ---------- guarda em disco (opcional) ----------
let arquivoGuarda = null;
function abrirGuarda() {
  if (!PASTA_GUARDA) return;
  try {
    fs.accessSync(PASTA_GUARDA, fs.constants.W_OK);
    const arq = path.join(PASTA_GUARDA, 'veiculos.jsonl');
    if (fs.existsSync(arq)) {
      const texto = fs.readFileSync(arq, 'utf8');
      for (const linha of texto.split('\n')) {
        if (!linha.trim()) continue;
        try {
          const r = JSON.parse(linha);
          if (validarPlaca(r.placa) === r.placa) guardados.set(chave(r.placa), soCampos(r));
        } catch { /* linha quebrada: ignora */ }
      }
      if (texto.length && !texto.endsWith('\n')) fs.appendFileSync(arq, '\n');
    }
    arquivoGuarda = arq;
    log(`guarda ok ${guardados.size}`);
  } catch {
    arquivoGuarda = null;
    log('guarda indisponivel, so memoria');
  }
}
function gravarGuarda(placa, dados) {
  if (!arquivoGuarda) return;
  try {
    // Uma linha pequena com O_APPEND: append atômico no disco local.
    fs.appendFileSync(arquivoGuarda, JSON.stringify({ placa, ...soCampos(dados) }) + '\n', { mode: 0o600 });
  } catch {
    log('guarda falhou');
  }
}

// ---------- placa ----------
// Antigo AAA9999 ou Mercosul AAA9A99. Devolve a forma Mercosul ou null.
export function validarPlaca(bruta) {
  if (typeof bruta !== 'string' || bruta.length > 20) return null;
  const p = bruta.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p)) return null;
  const c5 = p[4];
  return /[0-9]/.test(c5) ? p.slice(0, 4) + 'ABCDEFGHIJ'[Number(c5)] + p.slice(5) : p;
}

function texto(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const s = String(v).replace(/\s+/g, ' ').trim().slice(0, 80);
  return s || null;
}
// Motor em litros, montado das cilindradas: 1599 -> "1.6", 999 -> "1.0".
// Nunca o campo "motor" da API (é número de série).
export function motorDasCilindradas(cil) {
  const s = texto(cil);
  if (!s || !/^[0-9]{2,5}$/.test(s)) return null;
  const cc = Number(s);
  if (cc < 50 || cc > 20000) return null;
  return (cc / 1000).toFixed(1);
}
// Só os 9 campos do veículo, nesta ordem. Nada mais sai nem é guardado.
function soCampos(d) {
  const lista = Array.isArray(d.modelo_lista) ? d.modelo_lista.map(texto).filter(Boolean).slice(0, 20) : [];
  const cilindradas = texto(d.cilindradas);
  return {
    montadora: texto(d.montadora), modelo: texto(d.modelo), modelo_lista: lista,
    ano: texto(d.ano), ano_modelo: texto(d.ano_modelo), combustivel: texto(d.combustivel),
    cilindradas, potencia: texto(d.potencia), motor: motorDasCilindradas(cilindradas),
  };
}

// ---------- limites ----------
const segAteFimDoMinuto = (t) => Math.max(1, Math.ceil((60000 - (t % 60000)) / 1000));
const segAteFimDoDia = (t) => Math.max(1, Math.ceil(((diaManaus(t) + 1) * H24 - (t + FUSO_MANAUS)) / 1000));

function ipDoPedido(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const partes = xff.split(',');
    const ultimo = partes[partes.length - 1].trim();
    if (ultimo) return ultimo;
  }
  return req.socket.remoteAddress || '?';
}
// Só conta o pedido que vai chamar a API (ver consultar). O IP entra já embaralhado.
function limiteIp(ipChave, agora) {
  const min = Math.floor(agora / 60000);
  const dia = diaManaus(agora);
  let r = porIp.get(ipChave);
  if (!r) { r = { min, contMin: 0, dia, contDia: 0 }; porIp.set(ipChave, r); }
  if (r.min !== min) { r.min = min; r.contMin = 0; }
  if (r.dia !== dia) { r.dia = dia; r.contDia = 0; }
  if (r.contDia >= LIMITE_IP_DIA) return segAteFimDoDia(agora);
  if (r.contMin >= LIMITE_IP_MINUTO) return segAteFimDoMinuto(agora);
  r.contMin++; r.contDia++;
  return 0;
}
function reservarTeto(agora) {
  const dia = diaManaus(agora);
  if (teto.dia !== dia) teto = { dia, cont: 0 };
  if (teto.cont >= TETO_DIA) return false;
  teto.cont++;
  return true;
}
const faxina = setInterval(() => {
  const agora = Date.now();
  for (const [k, v] of cache) if (v.expira <= agora) cache.delete(k);
  const min = Math.floor(agora / 60000), dia = diaManaus(agora);
  for (const [k, v] of porIp) if (v.dia !== dia || (v.min !== min && v.contDia === 0)) porIp.delete(k);
  for (const [k, v] of contarPorIp) if (v.min !== min) contarPorIp.delete(k);
  contador.faxina(agora);
}, 60000);
faxina.unref();

// ---------- API ----------
// [SUPOSIÇÃO] "não encontrada": HTTP 404, ou error:true sem basico.dados com
// mensagem de "não encontrad". Tudo o mais é 503.
async function chamarApi(placa) {
  const token = process.env.API_PLACAS_TOKEN;
  let res;
  try {
    res = await fetch(API_BASE + encodeURIComponent(placa), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { status: 503 };
  }
  let corpo = null;
  try {
    const t = await res.text();
    if (t.length <= RESPOSTA_MAX) corpo = JSON.parse(t);
  } catch { corpo = null; }
  const b = corpo && typeof corpo === 'object' ? corpo.basico : null;
  const dados = b && typeof b === 'object' && b.dados && typeof b.dados === 'object' ? b.dados : null;
  const erro = !corpo || corpo.error === true || (b && b.error === true);
  if (res.ok && !erro && dados) {
    return {
      status: 200,
      dados: soCampos({
        montadora: dados.marca, modelo: dados.modelo, modelo_lista: dados.modelo_lista,
        ano: dados.ano, ano_modelo: dados.anoModelo, combustivel: dados.combustivel,
        cilindradas: dados.cilindradas, potencia: dados.potencia,
      }),
    };
  }
  const msg = [corpo?.message, b?.message].filter((m) => typeof m === 'string').join(' ');
  if (res.status === 404 || (!dados && /n[ãa]o\s+(foi\s+)?encontrad/i.test(msg))) return { status: 404 };
  return { status: 503 };
}

// Cache, guarda e pedido em voo nunca contam nem são barrados por limite.
// Só o pedido que vai chamar a API reserva a vaga no limite por IP e no teto,
// ANTES de chamar.
async function consultar(placa, ipChave, agora) {
  const k = chave(placa);
  const c = cache.get(k);
  if (c && c.expira > agora) return c;
  const g = guardados.get(k);
  if (g) return { status: 200, dados: g };
  if (emVoo.has(k)) return emVoo.get(k);
  const espera = limiteIp(ipChave, agora);
  if (espera) return { status: 429, erro: 'limite', espera };
  if (!reservarTeto(agora)) return { status: 429, erro: 'teto', espera: segAteFimDoDia(agora) };
  const p = chamarApi(placa).then((r) => {
    if (r.status === 200) {
      cache.set(k, { ...r, expira: Date.now() + H24 });
      if (arquivoGuarda) { guardados.set(k, r.dados); gravarGuarda(placa, r.dados); }
    } else if (r.status === 404) {
      cache.set(k, { ...r, expira: Date.now() + H24 }); // 404: só memória, 24 h
    }
    return r;
  }).finally(() => emVoo.delete(k));
  emVoo.set(k, p);
  return p;
}

// Limite do /contar: janela de 1 minuto, por IP (HMAC, só memória) e do serviço.
// Todo pedido de origem certa conta, até o inválido.
function limiteContar(ipChave, agora) {
  const min = Math.floor(agora / 60000);
  const espera = segAteFimDoMinuto(agora);
  if (contarTeto.min !== min) contarTeto = { min, cont: 0 };
  let r = contarPorIp.get(ipChave);
  if (!r || r.min !== min) { r = { min, cont: 0 }; contarPorIp.set(ipChave, r); }
  if (r.cont >= CONTAR_IP_MINUTO) return { erro: 'limite', espera };
  if (contarTeto.cont >= CONTAR_TETO_MINUTO) return { erro: 'teto', espera };
  r.cont++; contarTeto.cont++;
  return null;
}

// ---------- HTTP ----------
function responder(res, status, obj, extra = {}) {
  const corpo = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(corpo),
    ...extra,
  });
  res.end(corpo);
}

function lerCorpo(req) {
  return new Promise((resolve) => {
    let tam = 0; const partes = []; let feito = false;
    req.on('data', (b) => {
      if (feito) return;
      tam += b.length;
      if (tam > CORPO_MAX) { feito = true; resolve(null); req.resume(); return; }
      partes.push(b);
    });
    req.on('end', () => { if (!feito) { feito = true; resolve(Buffer.concat(partes).toString('utf8')); } });
    req.on('error', () => { if (!feito) { feito = true; resolve(null); } });
  });
}

// Pré-checagem do CORS (OPTIONS) das rotas POST.
const SO_POST = { Allow: 'POST, OPTIONS' };
function preChecagem(res, p) {
  if (!p.origemCerta) return responder(res, 403, { erro: 'origem' }, p.cors);
  res.writeHead(204, {
    ...p.cors,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '600',
  });
  return res.end();
}
// Fecha o pedido com o log só de rota, status e tempo.
function fimDe(res, p) {
  return (status, obj, extra = {}) => {
    log(`${p.nome} ${status} ${Date.now() - p.inicio}ms`);
    if (status !== 204) return responder(res, status, obj, { ...p.cors, ...extra });
    res.writeHead(204, { ...p.cors, 'Cache-Control': 'no-store', ...extra });
    return res.end();
  };
}

// Uma tabela só: rota -> função. O nome no log sai da rota (nunca o endereço cru).
const ROTAS = { '/saude': tratarSaude, '/veiculo': tratarVeiculo, '/contar': tratarContar, '/mais-vistos': tratarMaisVistos };

function pedido(req) {
  const origemOk = process.env.ORIGEM_PERMITIDA || null;
  const origem = req.headers.origin;
  const origemCerta = Boolean(origemOk && origem === origemOk);
  const [rota, query] = (req.url || '').split('?');
  return {
    rota,
    nome: ROTAS[rota] ? rota.slice(1) : 'rota',
    inicio: Date.now(),
    origem,
    origemCerta,
    cors: origemCerta ? { 'Access-Control-Allow-Origin': origemOk, Vary: 'Origin' } : { Vary: 'Origin' },
    temQuery: query !== undefined,
    query: query || '',
  };
}

async function tratar(req, res, p) {
  const h = ROTAS[p.rota];
  if (!h) return responder(res, 404, { erro: 'rota' });
  return h(req, res, p);
}

async function tratarSaude(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, { erro: 'metodo' }, { Allow: 'GET' });
  return responder(res, 200, { ok: true });
}

async function tratarVeiculo(req, res, p) {
  if (req.method === 'OPTIONS') return preChecagem(res, p);
  if (req.method !== 'POST') return responder(res, 405, { erro: 'metodo' }, { ...p.cors, ...SO_POST });
  const fim = fimDe(res, p);
  if (p.origem && !p.origemCerta) return fim(403, { erro: 'origem' });

  const bruto = await lerCorpo(req);
  if (bruto === null) return fim(413, { erro: 'placa_invalida' });
  let placa = null;
  if (!p.temQuery) {
    try { placa = validarPlaca(JSON.parse(bruto)?.placa); } catch { placa = null; }
  }
  if (!placa) return fim(400, { erro: 'placa_invalida' });

  const agora = Date.now();
  const k = chave(placa);
  const temNaMemoria = (cache.get(k)?.expira ?? 0) > agora || guardados.has(k);
  if (!temNaMemoria && !process.env.API_PLACAS_TOKEN) return fim(503, { erro: 'indisponivel' });

  const r = await consultar(placa, chave(ipDoPedido(req)), agora);
  if (r.status === 200) return fim(200, r.dados);
  if (r.status === 404) return fim(404, { erro: 'nao_encontrada' });
  if (r.status === 429) return fim(429, { erro: r.erro }, { 'Retry-After': String(r.espera) });
  return fim(503, { erro: 'indisponivel' });
}

// POST /contar {"codigo":"AMT7183"} -> 204. Só da origem do catálogo (o Origin
// é obrigatório). Guarda só {codigo: n} do dia; nada de quem abriu.
async function tratarContar(req, res, p) {
  if (req.method === 'OPTIONS') return preChecagem(res, p);
  if (req.method !== 'POST') return responder(res, 405, { erro: 'metodo' }, { ...p.cors, ...SO_POST });
  const fim = fimDe(res, p);
  if (!p.origemCerta) { req.resume(); return fim(403, { erro: 'origem' }); }
  const lim = limiteContar(chave(ipDoPedido(req)), Date.now());
  if (lim) { req.resume(); return fim(429, { erro: lim.erro }, { 'Retry-After': String(lim.espera) }); }
  const bruto = await lerCorpo(req);
  if (bruto === null) return fim(413, { erro: 'grande' });
  let codigo = null;
  if (!p.temQuery) {
    try { codigo = normalizarCodigo(JSON.parse(bruto)?.codigo); } catch { codigo = null; }
  }
  if (!catalogo.pronto()) return fim(503, { erro: 'indisponivel' });
  if (!codigo || !catalogo.tem(codigo)) return fim(400, { erro: 'codigo_invalido' });
  contador.contar(codigo);
  return fim(204);
}

// GET /mais-vistos?dias=7 -> {"total": N, "itens": [{"codigo","n"}]} (até MAIS_VISTOS).
async function tratarMaisVistos(req, res, p) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, { erro: 'metodo' }, { ...p.cors, Allow: 'GET' });
  const fim = fimDe(res, p);
  if (p.origem && !p.origemCerta) return fim(403, { erro: 'origem' });
  let dias = JANELA_PADRAO;
  const q = new URLSearchParams(p.query);
  if (q.has('dias')) {
    const d = q.get('dias');
    dias = /^[0-9]{1,2}$/.test(d) ? Number(d) : 0;
  }
  if (dias < 1 || dias > JANELA_MAX) return fim(400, { erro: 'dias_invalido' });
  return fim(200, contador.maisVistos(dias, { valido: catalogo.pronto() ? catalogo.tem : null }));
}

export function iniciar(porta = process.env.PORT !== undefined ? Number(process.env.PORT) : 10000) {
  abrirGuarda();
  contador.abrir();
  catalogo.iniciar();
  const srv = http.createServer((req, res) => {
    const p = pedido(req);
    tratar(req, res, p).catch(() => {
      log(`${p.nome} 503 ${Date.now() - p.inicio}ms`);
      if (!res.headersSent) responder(res, 503, { erro: 'indisponivel' });
      else res.destroy();
    });
  });
  srv.on('clientError', (_e, sock) => sock.destroy());
  srv.requestTimeout = 15000;
  srv.headersTimeout = 10000;
  srv.listen(porta, () => log(`placas ouvindo ${srv.address().port}`));
  // Deploy ou reinício no Render: grava as contagens do dia antes de sair.
  const sair = () => { contador.gravarJa(); process.exit(0); };
  process.once('SIGTERM', sair);
  process.once('SIGINT', sair);
  return srv;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) iniciar();
