// Serviço de login do catálogo (T-0022). Node 20+, sem dependências.
// Serve o site/ inteiro atrás de login (sessão de 5 h a partir do login), mais a
// API das telas (contrato T-0022), os 7 arquivos do admin (T-0024) e /interno/codigos para a placa.
// Regras: senha só com hash scrypt; o log nunca leva senha, hash, cookie, segredo,
// chave, usuário, caminho pedido nem IP. Fora de site/ só saem os 7 arquivos da lista.
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');
// Pastas FIXAS. Só os testes trocam, pela chamada de criarServico (nunca por variável).
const PASTA_SITE = path.join(RAIZ, 'site');
const PASTA_PDFS = path.join(RAIZ, 'catalogo_grafico', 'entregas');

export const SESSAO_MS = 5 * 60 * 60 * 1000;          // 5 h a partir do login, mesmo em uso (resposta 2 a)
export const JANELA_ERROS_MS = 15 * 60 * 1000;        // limite de tentativas: 15 min
const MAX_ERROS_USUARIO = 5;
const MAX_ERROS_IP = 20;
const LOGO_MAX = 1024 * 1024;                         // 1 MB (contrato)
const JSON_MAX = 8 * 1024;
const SENHA_MIN = 8;
const SENHA_MAX = 200;
const TEXTO_MAX = 80;
const VOLTA_MAX = 512;
const GZIP_CACHE_MAX = 64 * 1024 * 1024;
const RE_USUARIO = /^[a-z0-9._-]{3,32}$/;
const COOKIE = 'bap_sessao';
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SCRYPT_LEN = 64;
const scrypt = promisify(crypto.scrypt);
const gzip = promisify(zlib.gzip);

const MSG = {
  login: 'Usuário ou senha incorretos.',
  limite: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.',
  sessao: 'Entre de novo para continuar.',
  origem: 'Origem não permitida.',
  indisponivel: 'Catálogo indisponível no momento. Tente de novo em alguns minutos.',
  trocar: 'Troque a senha para continuar.',
  naoEncontrado: 'Não encontrado.',
  pedido: 'Pedido inválido.',
  metodo: 'Método não permitido.',
  gravar: 'Não foi possível salvar. Tente de novo.',
  chave: 'Chave interna ausente ou errada.',
  nomeInvalido: `Informe o nome (até ${TEXTO_MAX} caracteres).`,
  empresaLonga: `A empresa pode ter até ${TEXTO_MAX} caracteres.`,
  usuarioExiste: 'Esse usuário já existe.',
  logoTipo: 'Envie a logo em PNG, JPG ou WEBP.',
};
const RETRY = { 'Retry-After': String(JANELA_ERROS_MS / 1000) };

// Abertos sem sessão (caminho lógico, depois de /entrar -> /entrar/index.html).
// [SUPOSIÇÃO] /styles.css e as 2 logos da BAP entram para a tela de login poder usar o visual do site.
const ABERTOS = new Set([
  '/entrar/index.html', '/entrar/entrar.css', '/entrar/entrar.js', '/entrar/comum.js',
  '/styles.css', '/assets/logo_escuro.png', '/assets/logo_branco.png',
]);
// Páginas sem a barra no fim.
const PAGINAS = {
  '/': '/index.html',
  '/entrar': '/entrar/index.html',
  '/trocar-senha': '/trocar-senha/index.html',
  '/admin/usuarios': '/admin/usuarios/index.html',
  '/admin/pdfs': '/admin/pdfs/index.html',
};
// Só as extensões que o site/ usa (git ls-files site). Extensão nova no site: entra aqui.
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};
const COMPRIMIR = new Set(['.html', '.css', '.js', '.json']);
const LONGO = new Set(['.png', '.jpg', '.webp']);

// Arquivos do admin (T-0024): lista FIXA de 7, só de catalogo_grafico/entregas/, na ordem da tela.
// O navegador só manda o id; o nome do arquivo nunca vem do pedido. Regex ancorada, sem "/" nem curinga.
// Os 3 catálogos têm o ano no nome: vale o de ano mais alto. Os outros 4 têm o nome exato.
// [SUPOSIÇÃO] O catalogo-grafico mantém esses nomes; se o ano entrar no nome, a regex ganha o (\d{4}).
// "par": os itens com o mesmo par viram um cartão só na tela (o 1º é o principal).
const PDFS = [
  { id: 'completo-digital', titulo: 'Completo Digital', grupo: 'catalogos', tipo: 'pdf', re: /^Catalogo_BAP_(\d{4})_Completo_Digital\.pdf$/ },
  { id: 'a4-grafica', titulo: 'A4 gráfica', grupo: 'catalogos', tipo: 'pdf', re: /^Catalogo_BAP_(\d{4})_A4_grafica\.pdf$/ },
  { id: 'linha-moto', titulo: 'Linha Moto', grupo: 'catalogos', tipo: 'pdf', re: /^Catalogo_BAP_(\d{4})_Linha_Moto\.pdf$/ },
  { id: 'portfolio', titulo: 'Portfólio de Produtos', grupo: 'materiais', tipo: 'pdf', re: /^Portfolio_Produtos_BAP_AUTOPARTS\.pdf$/ },
  { id: 'lubrificantes-pdf', titulo: 'Lubrificantes e Químicos', grupo: 'materiais', tipo: 'pdf', par: 'lubrificantes', re: /^BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial\.pdf$/ },
  { id: 'lubrificantes-pptx', titulo: 'Lubrificantes e Químicos', grupo: 'materiais', tipo: 'pptx', par: 'lubrificantes', re: /^BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial\.pptx$/ },
  { id: 'kit-filtros', titulo: 'Kit Filtros', grupo: 'materiais', tipo: 'pdf', re: /^Kit_Filtros_BAP\.pdf$/ },
];
// Content-Type do download: pelo tipo da lista, nunca pela extensão do pedido.
const TIPO_MIME = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const LOGO_MIME = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };
// Tipo pelos primeiros bytes. SVG e o resto: null.
export function tipoDaImagem(b) {
  if (!Buffer.isBuffer(b)) return null;
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

// ---------- senha (scrypt, sal de 16 bytes, comparação em tempo constante) ----------
async function gerarHash(senha) {
  const sal = crypto.randomBytes(16);
  const h = await scrypt(senha.normalize('NFC'), sal, SCRYPT_LEN, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, sal.toString('base64url'), h.toString('base64url')].join('$');
}
async function conferirSenha(senha, guardado) {
  if (typeof senha !== 'string' || typeof guardado !== 'string') return false;
  const [alg, n, r, p, salB, hB] = guardado.split('$');
  if (alg !== 'scrypt' || !salB || !hB) return false;
  const N = Number(n), R = Number(r), P = Number(p);
  if (![N, R, P].every(Number.isInteger) || N < 1024 || N > 1048576 || R < 1 || R > 32 || P < 1 || P > 16) return false;
  const esperado = Buffer.from(hB, 'base64url');
  if (esperado.length !== SCRYPT_LEN) return false;
  try {
    const h = await scrypt(senha.normalize('NFC'), Buffer.from(salB, 'base64url'), SCRYPT_LEN, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 });
    return crypto.timingSafeEqual(h, esperado);
  } catch {
    return false;
  }
}

const igualSeguro = (a, b) => crypto.timingSafeEqual(
  crypto.createHash('sha256').update(String(a)).digest(),
  crypto.createHash('sha256').update(String(b)).digest(),
);

// Texto de nome e empresa: sem caractere de controle, espaços juntos, até 80.
function texto(v, { obrigatorio }) {
  if (v === undefined || v === null) return obrigatorio ? null : '';
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (obrigatorio && !s) return null;
  if ([...s].length > TEXTO_MAX) return null;
  return s;
}
const normUsuario = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const senhaValida = (s) => typeof s === 'string' && [...s].length >= SENHA_MIN && s.length <= SENHA_MAX;
const MSG_SENHA = `A senha precisa ter pelo menos ${SENHA_MIN} caracteres (e no máximo ${SENHA_MAX}).`;

// ---------- usuarios.json (gravação segura: .tmp + fsync + rename, uma por vez) ----------
const NADA = Symbol('nada');
async function gravarSeguro(arq, dados) {
  const tmp = arq + '.tmp';
  const fh = await fsp.open(tmp, 'w', 0o600);
  try { await fh.writeFile(dados); await fh.sync(); } finally { await fh.close(); }
  await fsp.rename(tmp, arq);
}
function criarLoja(pasta) {
  const arq = path.join(pasta, 'usuarios.json');
  const pastaLogos = path.join(pasta, 'logos');
  let usuarios = new Map(); // Map: nome de usuário nunca vira chave de objeto (sem __proto__)
  let fila = Promise.resolve();

  function abrir() {
    fs.mkdirSync(pasta, { recursive: true, mode: 0o700 });
    fs.mkdirSync(pastaLogos, { recursive: true, mode: 0o700 });
    fs.accessSync(pasta, fs.constants.W_OK);
    try { fs.rmSync(arq + '.tmp', { force: true }); } catch { /* sobra de queda: ignora */ }
    if (!fs.existsSync(arq)) return;
    const j = JSON.parse(fs.readFileSync(arq, 'utf8'));
    if (!j || j.versao !== 1 || !Array.isArray(j.usuarios)) throw new Error('formato');
    const m = new Map();
    for (const u of j.usuarios) {
      if (!u || !RE_USUARIO.test(u.usuario) || typeof u.hash !== 'string') throw new Error('formato');
      const { usuario, ...resto } = u;
      m.set(usuario, resto);
    }
    usuarios = m;
  }
  async function gravar(m) {
    const corpo = JSON.stringify({ versao: 1, usuarios: [...m].map(([usuario, u]) => ({ usuario, ...u })) }, null, 1);
    await gravarSeguro(arq, corpo);
    try { const d = await fsp.open(pasta, 'r'); try { await d.sync(); } finally { await d.close(); } } catch { /* fsync da pasta: melhor esforço */ }
  }
  // fn recebe uma cópia; devolve NADA para não gravar. Só troca a memória depois de gravar no disco.
  function alterar(fn) {
    const r = fila.then(async () => {
      const copia = structuredClone(usuarios);
      const valor = fn(copia);
      if (valor === NADA) return NADA;
      await gravar(copia);
      usuarios = copia;
      return valor;
    });
    fila = r.catch(() => {});
    return r;
  }
  const arqLogo = (nome, ext) => path.join(pastaLogos, `${nome}.${ext}`);
  const gravarLogo = (nome, ext, buf) => gravarSeguro(arqLogo(nome, ext), buf);
  async function apagarLogos(nome, menos = null) {
    for (const ext of Object.keys(LOGO_MIME)) if (ext !== menos) await fsp.rm(arqLogo(nome, ext), { force: true });
  }
  return {
    abrir, alterar, gravarLogo, apagarLogos, arqLogo,
    get: (nome) => usuarios.get(nome),
    tamanho: () => usuarios.size,
    todos: () => [...usuarios],
  };
}

// ---------- limite de tentativas (só memória; IP só como HMAC) ----------
function criarLimite(agora) {
  const porUsuario = new Map();
  const porIp = new Map();
  const recentes = (m, k) => {
    if (k === null) return [];
    const t = agora();
    const l = (m.get(k) || []).filter((x) => t - x < JANELA_ERROS_MS);
    if (l.length) m.set(k, l); else m.delete(k);
    return l;
  };
  const tirar = (m, k, marca) => {
    const l = m.get(k);
    if (!l) return;
    const i = l.lastIndexOf(marca);
    if (i >= 0) l.splice(i, 1);
    if (!l.length) m.delete(k);
  };
  return {
    bloqueado: (uk, ik) => recentes(porUsuario, uk).length >= MAX_ERROS_USUARIO || recentes(porIp, ik).length >= MAX_ERROS_IP,
    // Conta como erro ANTES de conferir (dois pedidos ao mesmo tempo não furam o limite).
    reservar(uk, ik) {
      const marca = agora();
      if (uk !== null) porUsuario.set(uk, [...recentes(porUsuario, uk), marca]);
      porIp.set(ik, [...recentes(porIp, ik), marca]);
      return marca;
    },
    acertou(uk, ik, marca, { zerarUsuario }) {
      if (uk !== null) { if (zerarUsuario) porUsuario.delete(uk); else tirar(porUsuario, uk, marca); }
      tirar(porIp, ik, marca);
    },
    zerarUsuario: (uk) => porUsuario.delete(uk),
    faxina() { for (const m of [porUsuario, porIp]) for (const k of [...m.keys()]) recentes(m, k); },
  };
}

// ---------- utilidades HTTP ----------
const SEGURANCA = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
};
// Resposta curta, sem cache. Corpo vazio vai sem Content-Type; head = true manda só os cabeçalhos.
function enviar(res, status, corpo, tipo, extra = {}, head = false) {
  res.writeHead(status, {
    ...SEGURANCA,
    'Cache-Control': 'no-store',
    ...(corpo ? { 'Content-Type': tipo } : {}),
    'Content-Length': Buffer.byteLength(corpo),
    ...extra,
  });
  res.end(head ? undefined : corpo);
}
const json = (res, status, obj, extra) => enviar(res, status, obj === undefined ? '' : JSON.stringify(obj), 'application/json; charset=utf-8', extra);
const HTML_SIMPLES = (titulo) => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title><p style="font-family:sans-serif;padding:2rem">${titulo}</p></html>`;
const html = (res, status, titulo, extra) => enviar(res, status, HTML_SIMPLES(titulo), 'text/html; charset=utf-8', extra);
const metodoErrado = (res, allow) => json(res, 405, { erro: MSG.metodo }, { Allow: allow });
function redirecionar(res, destino, extra = {}) {
  res.writeHead(302, { ...SEGURANCA, 'Cache-Control': 'no-store', Location: destino, 'Content-Length': 0, ...extra });
  res.end();
}
// "volta" do login. O navegador apaga tab, LF e CR da URL ("/%09/x" vira "//x") e lê "//host" e "/\host"
// como outro site. Caractere de controle, "//" ou "/\" (cru ou decodificado), longo demais ou quebrado: "/".
export function voltaSegura(url) {
  if (typeof url !== 'string' || url.length > VOLTA_MAX) return '/';
  let dec;
  try { dec = decodeURIComponent(url); } catch { return '/'; }
  for (const v of [url, dec]) if (/[\x00-\x1f\x7f]/.test(v) || /^\/[\/\\]/.test(v)) return '/';
  return url;
}
const querPagina = (req) => /\btext\/html\b/i.test(req.headers.accept || '');
function erro(req, res, status, msg, extra) {
  return querPagina(req) && req.method === 'GET' ? html(res, status, msg, extra) : json(res, status, { erro: msg }, extra);
}

function lerCorpo(req, max) {
  return new Promise((resolve) => {
    const decl = Number(req.headers['content-length']);
    if (Number.isFinite(decl) && decl > max) { req.resume(); return resolve({ grande: true }); }
    let tam = 0; const partes = []; let feito = false;
    req.on('data', (b) => {
      if (feito) return;
      tam += b.length;
      if (tam > max) { feito = true; partes.length = 0; req.resume(); resolve({ grande: true }); return; }
      partes.push(b);
    });
    req.on('end', () => { if (!feito) { feito = true; resolve({ buf: Buffer.concat(partes) }); } });
    req.on('error', () => { if (!feito) { feito = true; resolve({ erro: true }); } });
  });
}
async function lerJson(req) {
  const r = await lerCorpo(req, JSON_MAX);
  if (!r.buf) return null;
  try {
    const j = JSON.parse(r.buf.toString('utf8') || 'null');
    return j && typeof j === 'object' && !Array.isArray(j) ? j : null;
  } catch { return null; }
}

function ipDoPedido(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const partes = xff.split(',');
    const ultimo = partes[partes.length - 1].trim();
    if (ultimo) return ultimo;
  }
  return req.socket.remoteAddress || '?';
}
function lerCookie(cabecalho, nome) {
  if (typeof cabecalho !== 'string') return null;
  for (const parte of cabecalho.split(';')) {
    const i = parte.indexOf('=');
    if (i > 0 && parte.slice(0, i).trim() === nome) return parte.slice(i + 1).trim();
  }
  return null;
}

// Caminho do pedido -> caminho lógico dentro de site/, ou null.
// Recusa: "..", ".", segmento que começa com ponto, barra invertida, byte nulo, "//", codificação quebrada.
export function caminhoLogico(bruto) {
  if (typeof bruto !== 'string' || !bruto.startsWith('/') || bruto.length > 1024) return null;
  let dec;
  try { dec = decodeURIComponent(bruto); } catch { return null; }
  if (dec.includes('\0') || dec.includes('\\') || dec.includes('//')) return null;
  const partes = dec.split('/').slice(1);
  for (let i = 0; i < partes.length; i++) {
    const s = partes[i];
    if (s === '' && i === partes.length - 1) continue;
    if (s === '' || s.startsWith('.')) return null;
  }
  if (PAGINAS[dec]) return PAGINAS[dec];
  if (dec.endsWith('/')) return dec + 'index.html';
  return dec;
}

// ---------- serviço ----------
export async function criarServico(opcoes = {}) {
  const env = opcoes.env ?? process.env;
  const agora = opcoes.agora ?? Date.now;
  const log = opcoes.log ?? ((m) => console.log(m));
  const pastaSite = opcoes.pastaSite ?? PASTA_SITE;
  const pastaPdfs = opcoes.pastaPdfs ?? PASTA_PDFS;
  let siteReal;
  try { siteReal = fs.realpathSync(pastaSite); } catch { siteReal = path.resolve(pastaSite); }
  let pdfsReal;
  try { pdfsReal = fs.realpathSync(pastaPdfs); } catch { pdfsReal = path.resolve(pastaPdfs); }

  const segredo = env.SESSAO_SEGREDO || '';
  const chaveInterna = env.CHAVE_INTERNA || '';
  const adminUsuario = normUsuario(env.ADMIN_USUARIO || 'admin');
  const origens = new Set(
    [...String(env.ORIGEM_SITE || '').split(','), env.RENDER_EXTERNAL_URL || '']
      .map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean),
  );
  const semente = crypto.randomBytes(32);
  const chaveIp = (req) => crypto.createHmac('sha256', semente).update(ipDoPedido(req)).digest('hex');
  const limite = criarLimite(agora);
  const novoUsuario = ({ nome, empresa, admin, hash }) => ({
    nome, empresa, admin, ativo: true, hash, trocarSenha: true, geracao: 1, logo: null,
    criadoEm: new Date(agora()).toISOString(), ultimoAcesso: null,
  });
  const hashFalso = await gerarHash(crypto.randomBytes(18).toString('base64url'));

  // Abre fechado (503) se faltar o que torna o login seguro.
  let fechado = null;
  const fechar = (motivo) => { if (!fechado) { fechado = motivo; log(`fechado: ${motivo}`); } };
  let loja = null;
  if (!env.PASTA_DADOS) fechar('sem PASTA_DADOS');
  else {
    loja = criarLoja(env.PASTA_DADOS);
    try { loja.abrir(); log(`usuarios ok ${loja.tamanho()}`); } catch { fechar('usuarios.json ou pasta de dados com erro'); }
  }
  if (segredo.length < 16) fechar('sem SESSAO_SEGREDO');
  if (!fechado && loja.tamanho() === 0) {
    const inicial = env.ADMIN_SENHA_INICIAL || '';
    if (!RE_USUARIO.test(adminUsuario)) fechar('ADMIN_USUARIO invalido');
    else if (!inicial) fechar('sem ADMIN_SENHA_INICIAL e sem usuarios');
    else if (!senhaValida(inicial)) fechar('ADMIN_SENHA_INICIAL curta');
    else {
      const hash = await gerarHash(inicial);
      try {
        await loja.alterar((m) => {
          // Empresa do admin inicial: a grafia oficial "BAP AUTOPARTS" (resposta 10 a, MC-0008).
          m.set(adminUsuario, novoUsuario({ nome: 'Administrador', empresa: 'BAP AUTOPARTS', admin: true, hash }));
        });
        log('admin inicial criado');
      } catch { fechar('usuarios.json nao gravou'); }
    }
  }

  // ---------- sessão: cookie assinado (HMAC-SHA256) ----------
  const assinar = (corpo) => crypto.createHmac('sha256', segredo).update(corpo).digest('base64url');
  function cookieSessao(nome, geracao, expira) {
    const corpo = Buffer.from(JSON.stringify({ u: nome, g: geracao, e: expira })).toString('base64url');
    const maxAge = Math.max(0, Math.floor((expira - agora()) / 1000));
    return `${COOKIE}=${corpo}.${assinar(corpo)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  }
  const COOKIE_APAGA = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  function lerSessao(req) {
    const v = lerCookie(req.headers.cookie, COOKIE);
    if (!v) return { estado: 'nenhuma' };
    const [corpo, assin, sobra] = v.split('.');
    if (!corpo || !assin || sobra !== undefined || !igualSeguro(assin, assinar(corpo))) return { estado: 'invalida' };
    let d;
    try { d = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8')); } catch { return { estado: 'invalida' }; }
    if (!d || typeof d.u !== 'string' || !Number.isInteger(d.g) || !Number.isFinite(d.e)) return { estado: 'invalida' };
    const t = agora();
    if (t >= d.e) return { estado: 'vencida' };
    if (d.e - t > SESSAO_MS) return { estado: 'invalida' };
    const u = loja.get(d.u);
    if (!u || !u.ativo || u.geracao !== d.g) return { estado: 'invalida' };
    return { estado: 'ok', nome: d.u, u, e: d.e };
  }

  // Nos POST/PATCH/PUT/DELETE: Origin igual ao do serviço.
  function origemCerta(req) {
    const o = req.headers.origin;
    if (typeof o !== 'string' || !o) return false;
    if (origens.size) return origens.has(o);
    const host = req.headers.host;
    return Boolean(host) && (o === `http://${host}` || o === `https://${host}`);
  }

  const publico = (nome, u) => ({
    usuario: nome, nome: u.nome, empresa: u.empresa, admin: u.admin === true, ativo: u.ativo === true,
    temLogo: Boolean(u.logo), trocarSenha: u.trocarSenha === true, ultimoAcesso: u.ultimoAcesso || null,
  });

  // ---------- arquivos de site/ ----------
  async function acharNoSite(logico) {
    const alvo = path.join(siteReal, logico);
    if (!alvo.startsWith(siteReal + path.sep)) return null;
    const ext = path.extname(alvo).toLowerCase();
    if (!TIPOS[ext]) return null;
    let real, st;
    try { real = await fsp.realpath(alvo); st = await fsp.stat(real); } catch { return null; }
    // Nada de link para fora, nem para outro lugar dentro: o real tem que ser o pedido.
    if (real !== alvo || !st.isFile()) return null;
    return { arquivo: real, st, ext };
  }
  const gzCache = new Map();
  let gzTotal = 0;
  async function comprimido(a) {
    const k = `${a.arquivo}|${a.st.size}|${a.st.mtimeMs}`;
    let b = gzCache.get(k);
    if (b) return b;
    b = await gzip(await fsp.readFile(a.arquivo), { level: 6 });
    if (gzTotal + b.length > GZIP_CACHE_MAX) { gzCache.clear(); gzTotal = 0; }
    gzCache.set(k, b); gzTotal += b.length;
    return b;
  }
  async function servirArquivo(req, res, a) {
    const etag = `W/"${a.st.size.toString(16)}-${Math.floor(a.st.mtimeMs).toString(16)}"`;
    const cab = {
      ...SEGURANCA,
      'Content-Type': TIPOS[a.ext],
      'Cache-Control': LONGO.has(a.ext) ? 'private, max-age=86400' : 'private, no-cache',
      ETag: etag,
      Vary: 'Cookie, Accept-Encoding',
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, cab); return res.end(); }
    if (COMPRIMIR.has(a.ext) && a.st.size > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      const b = await comprimido(a);
      res.writeHead(200, { ...cab, 'Content-Encoding': 'gzip', 'Content-Length': b.length });
      return res.end(req.method === 'HEAD' ? undefined : b);
    }
    res.writeHead(200, { ...cab, 'Content-Length': a.st.size });
    if (req.method === 'HEAD') return res.end();
    pipeline(fs.createReadStream(a.arquivo), res, () => {});
  }

  // ---------- arquivos do admin (lista fixa; fora de site/ só estes) ----------
  async function acharPdf(item) {
    let nomes;
    try { nomes = await fsp.readdir(pdfsReal); } catch { return null; }
    const casados = nomes.map((n) => ({ n, m: item.re.exec(n) })).filter((x) => x.m).sort((a, b) => Number(b.m[1] || 0) - Number(a.m[1] || 0));
    for (const { n } of casados) {
      const alvo = path.join(pdfsReal, n);
      try {
        const real = await fsp.realpath(alvo);
        const st = await fsp.stat(real);
        if (real === alvo && st.isFile()) return { arquivo: real, nome: n, st };
      } catch { /* tenta o próximo */ }
    }
    return null;
  }

  // ---------- códigos para a placa ----------
  let codigosCache = null;
  async function codigos() {
    const arq = path.join(siteReal, 'data', 'produtos.json');
    const st = await fsp.stat(arq);
    const k = `${st.size}|${st.mtimeMs}`;
    if (codigosCache && codigosCache.k === k) return codigosCache.corpo;
    const j = JSON.parse(await fsp.readFile(arq, 'utf8'));
    const lista = [];
    for (const p of Array.isArray(j?.produtos) ? j.produtos : []) if (p && typeof p.c === 'string' && p.c.trim()) lista.push(p.c);
    const corpo = JSON.stringify({ total: lista.length, codigos: lista });
    codigosCache = { k, corpo };
    return corpo;
  }

  // ---------- rotas da API ----------
  function semSessao(req, res, s) {
    const extra = s.estado === 'nenhuma' ? {} : { 'Set-Cookie': COOKIE_APAGA };
    if (querPagina(req) && (req.method === 'GET' || req.method === 'HEAD')) {
      const volta = voltaSegura(req.url);
      const destino = s.estado === 'vencida' ? '/entrar?expirou=1' : `/entrar?volta=${encodeURIComponent(volta)}`;
      return redirecionar(res, destino, extra);
    }
    return json(res, 401, { erro: MSG.sessao }, extra);
  }

  async function apiEntrar(req, res) {
    const c = await lerJson(req);
    if (!c) return json(res, 400, { erro: MSG.pedido });
    const usuario = normUsuario(c.usuario);
    const senha = typeof c.senha === 'string' ? c.senha : '';
    const uk = RE_USUARIO.test(usuario) ? usuario : null;
    const ik = chaveIp(req);
    if (limite.bloqueado(uk, ik)) return json(res, 429, { erro: MSG.limite }, RETRY);
    const marca = limite.reservar(uk, ik);
    const antes = uk ? loja.get(uk) : null;
    const ok = await conferirSenha(senha, antes ? antes.hash : hashFalso);
    const u = uk ? loja.get(uk) : null;
    if (!ok || !u || !u.ativo || u.hash !== antes.hash) return json(res, 401, { erro: MSG.login });
    limite.acertou(uk, ik, marca, { zerarUsuario: true });
    const t = agora();
    try {
      await loja.alterar((m) => { const x = m.get(uk); if (!x) return NADA; x.ultimoAcesso = new Date(t).toISOString(); return true; });
    } catch { log('ultimo acesso nao gravou'); }
    return json(res, 200, { trocarSenha: u.trocarSenha === true }, { 'Set-Cookie': cookieSessao(uk, u.geracao, t + SESSAO_MS) });
  }

  async function apiTrocarSenha(req, res, s) {
    const c = await lerJson(req);
    if (!c) return json(res, 400, { erro: MSG.pedido });
    const nova = c.senhaNova;
    if (!senhaValida(nova)) return json(res, 400, { erro: MSG_SENHA });
    if (!s.u.trocarSenha) {
      const ik = chaveIp(req);
      if (limite.bloqueado(s.nome, ik)) return json(res, 429, { erro: MSG.limite }, RETRY);
      const marca = limite.reservar(s.nome, ik);
      if (!(await conferirSenha(c.senhaAtual, s.u.hash))) return json(res, 400, { erro: 'A senha atual está incorreta.' });
      limite.acertou(s.nome, ik, marca, { zerarUsuario: false });
    }
    if (await conferirSenha(nova, s.u.hash)) return json(res, 400, { erro: 'A nova senha precisa ser diferente da atual.' });
    const hash = await gerarHash(nova);
    let g;
    try {
      g = await loja.alterar((m) => {
        const x = m.get(s.nome);
        if (!x || !x.ativo || x.geracao !== s.u.geracao) return NADA;
        x.hash = hash; x.trocarSenha = false; x.geracao += 1;
        return x.geracao;
      });
    } catch { return json(res, 503, { erro: MSG.gravar }); }
    if (g === NADA) return json(res, 401, { erro: MSG.sessao }, { 'Set-Cookie': COOKIE_APAGA });
    // As outras sessões do usuário caem (geração nova); esta ganha um cookie novo, com o MESMO vencimento.
    return json(res, 204, undefined, { 'Set-Cookie': cookieSessao(s.nome, g, s.e) });
  }

  async function servirLogo(req, res, nome) {
    const u = loja.get(nome);
    if (!u || !u.logo) return json(res, 404, { erro: MSG.naoEncontrado });
    let b;
    try { b = await fsp.readFile(loja.arqLogo(nome, u.logo)); } catch { return json(res, 404, { erro: MSG.naoEncontrado }); }
    res.writeHead(200, {
      ...SEGURANCA, 'Content-Type': LOGO_MIME[u.logo], 'Content-Length': b.length,
      'Cache-Control': 'private, no-cache', 'Content-Security-Policy': "default-src 'none'", Vary: 'Cookie',
    });
    return res.end(req.method === 'HEAD' ? undefined : b);
  }

  async function apiUsuarios(req, res, s, alvo, sub) {
    if (alvo === null) {
      if (req.method === 'GET') {
        return json(res, 200, loja.todos().sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([n, u]) => publico(n, u)));
      }
      if (req.method !== 'POST') return metodoErrado(res, 'GET, POST');
      const c = await lerJson(req);
      if (!c) return json(res, 400, { erro: MSG.pedido });
      const usuario = normUsuario(c.usuario);
      if (!RE_USUARIO.test(usuario)) return json(res, 400, { erro: 'Usuário: de 3 a 32 caracteres, só letras minúsculas, números, ponto, hífen e sublinhado.' });
      const nome = texto(c.nome, { obrigatorio: true });
      if (nome === null) return json(res, 400, { erro: MSG.nomeInvalido });
      const empresa = texto(c.empresa, { obrigatorio: false });
      if (empresa === null) return json(res, 400, { erro: MSG.empresaLonga });
      if (!senhaValida(c.senha)) return json(res, 400, { erro: MSG_SENHA });
      if (loja.get(usuario)) return json(res, 409, { erro: MSG.usuarioExiste });
      const hash = await gerarHash(c.senha);
      let r;
      try {
        r = await loja.alterar((m) => {
          if (m.has(usuario)) return NADA;
          const novo = novoUsuario({ nome, empresa, admin: false, hash });
          m.set(usuario, novo);
          return publico(usuario, novo);
        });
      } catch { return json(res, 503, { erro: MSG.gravar }); }
      if (r === NADA) return json(res, 409, { erro: MSG.usuarioExiste });
      return json(res, 201, r);
    }

    if (!RE_USUARIO.test(alvo) || !loja.get(alvo)) { req.resume(); return json(res, 404, { erro: MSG.naoEncontrado }); }

    if (sub === null) {
      if (req.method !== 'PATCH') return metodoErrado(res, 'PATCH');
      const c = await lerJson(req);
      if (!c) return json(res, 400, { erro: MSG.pedido });
      const mud = {};
      if ('nome' in c) { mud.nome = texto(c.nome, { obrigatorio: true }); if (mud.nome === null) return json(res, 400, { erro: MSG.nomeInvalido }); }
      if ('empresa' in c) { mud.empresa = texto(c.empresa, { obrigatorio: false }); if (mud.empresa === null) return json(res, 400, { erro: MSG.empresaLonga }); }
      if ('ativo' in c) {
        if (typeof c.ativo !== 'boolean') return json(res, 400, { erro: MSG.pedido });
        if (!c.ativo && alvo === s.nome) return json(res, 400, { erro: 'O administrador não pode se desativar.' });
        mud.ativo = c.ativo;
      }
      if (!Object.keys(mud).length) return json(res, 400, { erro: 'Nada para alterar.' });
      let r;
      try {
        r = await loja.alterar((m) => {
          const x = m.get(alvo);
          if (!x) return NADA;
          if ('nome' in mud) x.nome = mud.nome;
          if ('empresa' in mud) x.empresa = mud.empresa;
          // Desativar (ou reativar) derruba as sessões abertas: geração nova.
          if ('ativo' in mud && mud.ativo !== x.ativo) { x.ativo = mud.ativo; x.geracao += 1; }
          return publico(alvo, x);
        });
      } catch { return json(res, 503, { erro: MSG.gravar }); }
      if (r === NADA) return json(res, 404, { erro: MSG.naoEncontrado });
      return json(res, 200, r);
    }

    if (sub === 'senha') {
      if (req.method !== 'POST') return metodoErrado(res, 'POST');
      const c = await lerJson(req);
      if (!c) return json(res, 400, { erro: MSG.pedido });
      if (alvo === s.nome) return json(res, 400, { erro: 'Para a sua própria senha, use "Trocar senha".' });
      if (!senhaValida(c.senha)) return json(res, 400, { erro: MSG_SENHA });
      const hash = await gerarHash(c.senha);
      let r;
      try {
        r = await loja.alterar((m) => {
          const x = m.get(alvo);
          if (!x) return NADA;
          x.hash = hash; x.trocarSenha = true; x.geracao += 1;
          return true;
        });
      } catch { return json(res, 503, { erro: MSG.gravar }); }
      if (r === NADA) return json(res, 404, { erro: MSG.naoEncontrado });
      limite.zerarUsuario(alvo);
      return json(res, 204);
    }

    if (sub === 'logo') {
      if (req.method === 'GET' || req.method === 'HEAD') return servirLogo(req, res, alvo);
      if (req.method === 'DELETE') {
        try {
          await loja.alterar((m) => { const x = m.get(alvo); if (!x) return NADA; x.logo = null; return true; });
          await loja.apagarLogos(alvo);
        } catch { return json(res, 503, { erro: MSG.gravar }); }
        return json(res, 204);
      }
      if (req.method !== 'PUT') return metodoErrado(res, 'GET, PUT, DELETE');
      const tipoPedido = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      const declarado = Object.keys(LOGO_MIME).find((ext) => LOGO_MIME[ext] === tipoPedido);
      if (!declarado) { req.resume(); return json(res, 400, { erro: MSG.logoTipo }); }
      const r = await lerCorpo(req, LOGO_MAX);
      if (r.grande) return json(res, 413, { erro: 'A logo passa de 1 MB.' }, { Connection: 'close' });
      if (!r.buf || !r.buf.length) return json(res, 400, { erro: MSG.logoTipo });
      if (tipoDaImagem(r.buf) !== declarado) return json(res, 400, { erro: 'O arquivo não é uma imagem PNG, JPG ou WEBP.' });
      try {
        await loja.gravarLogo(alvo, declarado, r.buf);
        await loja.alterar((m) => { const x = m.get(alvo); if (!x) return NADA; x.logo = declarado; return true; });
        await loja.apagarLogos(alvo, declarado);
      } catch { return json(res, 503, { erro: MSG.gravar }); }
      return json(res, 204);
    }
    return json(res, 404, { erro: MSG.naoEncontrado });
  }

  async function apiPdfs(req, res) {
    if (req.method !== 'GET') return metodoErrado(res, 'GET');
    const lista = [];
    for (const item of PDFS) {
      const a = await acharPdf(item);
      // [SUPOSIÇÃO] "data" é a data do arquivo no disco: no Render, a do deploy.
      // Arquivo em falta: continua na lista, com arquivo, tamanho e data null.
      lista.push({
        id: item.id, titulo: item.titulo, grupo: item.grupo, tipo: item.tipo, par: item.par ?? null,
        arquivo: a ? a.nome : null, tamanho: a ? a.st.size : null, data: a ? new Date(a.st.mtimeMs).toISOString() : null,
      });
    }
    return json(res, 200, lista);
  }
  async function baixarPdf(req, res, id) {
    const item = PDFS.find((x) => x.id === id);
    const a = item ? await acharPdf(item) : null;
    if (!a) return erro(req, res, 404, MSG.naoEncontrado);
    res.writeHead(200, {
      ...SEGURANCA,
      'Content-Type': TIPO_MIME[item.tipo],
      'Content-Disposition': `attachment; filename="${a.nome}"`,
      'Content-Length': a.st.size,
      'Cache-Control': 'private, no-store',
    });
    if (req.method === 'HEAD') return res.end();
    pipeline(fs.createReadStream(a.arquivo), res, () => {});
  }

  // ---------- roteador ----------
  const MUDA = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
  async function tratar(req, res, p) {
    const url = req.url || '';
    if (!url.startsWith('/')) { p.nome = 'rota'; return json(res, 400, { erro: MSG.pedido }); }
    const [rota] = url.split('?');

    if (rota === '/saude') {
      p.nome = 'saude';
      if (req.method !== 'GET' && req.method !== 'HEAD') return metodoErrado(res, 'GET');
      return enviar(res, 200, 'ok', 'text/plain; charset=utf-8', {}, req.method === 'HEAD');
    }
    if (rota === '/interno/codigos') {
      p.nome = 'interno';
      if (req.method !== 'GET') return metodoErrado(res, 'GET');
      const dada = req.headers['x-chave-interna'];
      if (!chaveInterna || typeof dada !== 'string' || !igualSeguro(dada, chaveInterna)) return json(res, 401, { erro: MSG.chave });
      let corpo;
      try { corpo = await codigos(); } catch { return json(res, 503, { erro: MSG.indisponivel }); }
      return enviar(res, 200, corpo, 'application/json; charset=utf-8');
    }
    if (fechado) { p.nome = 'fechado'; req.resume(); return erro(req, res, 503, MSG.indisponivel); }

    const api = rota.startsWith('/api/') || rota === '/api';
    const baixar = /^\/admin\/pdfs\/baixar\/([^/]+)$/.exec(rota);
    if (api) {
      p.nome = 'api';
      if (MUDA.has(req.method) && !origemCerta(req)) { req.resume(); return json(res, 403, { erro: MSG.origem }); }
      if (rota === '/api/entrar') {
        p.nome = 'entrar';
        if (req.method !== 'POST') return metodoErrado(res, 'POST');
        return apiEntrar(req, res);
      }
      if (rota === '/api/sair') {
        p.nome = 'sair';
        if (req.method !== 'POST') return metodoErrado(res, 'POST');
        req.resume();
        return json(res, 204, undefined, { 'Set-Cookie': COOKIE_APAGA });
      }
      const s = lerSessao(req);
      if (s.estado !== 'ok') { req.resume(); return semSessao(req, res, s); }
      if (rota === '/api/eu') {
        p.nome = 'eu';
        if (req.method !== 'GET') return metodoErrado(res, 'GET');
        const { ativo, ultimoAcesso, ...eu } = publico(s.nome, s.u);
        return json(res, 200, { ...eu, expiraEm: new Date(s.e).toISOString() });
      }
      if (rota === '/api/trocar-senha') {
        p.nome = 'trocar-senha';
        if (req.method !== 'POST') return metodoErrado(res, 'POST');
        return apiTrocarSenha(req, res, s);
      }
      if (s.u.trocarSenha) { req.resume(); return json(res, 403, { erro: MSG.trocar }); }
      if (rota === '/api/eu/logo') {
        p.nome = 'logo';
        if (req.method !== 'GET' && req.method !== 'HEAD') return metodoErrado(res, 'GET');
        return servirLogo(req, res, s.nome);
      }
      const mu = /^\/api\/usuarios(?:\/([^/]+)(?:\/(senha|logo))?)?$/.exec(rota);
      if (mu) {
        p.nome = 'usuarios';
        if (!s.u.admin) { req.resume(); return json(res, 404, { erro: MSG.naoEncontrado }); }
        let alvo = null;
        if (mu[1] !== undefined) { try { alvo = decodeURIComponent(mu[1]); } catch { alvo = ''; } }
        return apiUsuarios(req, res, s, alvo, mu[2] ?? null);
      }
      if (rota === '/api/pdfs') {
        p.nome = 'pdfs';
        if (!s.u.admin) return json(res, 404, { erro: MSG.naoEncontrado });
        return apiPdfs(req, res);
      }
      req.resume();
      return json(res, 404, { erro: MSG.naoEncontrado });
    }

    // Daqui para baixo: só GET e HEAD.
    if (req.method !== 'GET' && req.method !== 'HEAD') { p.nome = 'arquivo'; req.resume(); return metodoErrado(res, 'GET, HEAD'); }

    if (baixar) {
      p.nome = 'baixar';
      const s = lerSessao(req);
      if (s.estado !== 'ok') return semSessao(req, res, s);
      if (s.u.trocarSenha) return redirecionar(res, '/trocar-senha');
      if (!s.u.admin) return erro(req, res, 404, MSG.naoEncontrado);
      return baixarPdf(req, res, baixar[1]);
    }

    // Arquivos de site/.
    const logico = caminhoLogico(rota);
    p.nome = logico && logico.endsWith('.html') ? 'pagina' : 'arquivo';
    if (logico && ABERTOS.has(logico)) {
      const a = await acharNoSite(logico);
      return a ? servirArquivo(req, res, a) : erro(req, res, 404, MSG.naoEncontrado);
    }
    const s = lerSessao(req);
    if (s.estado !== 'ok') return semSessao(req, res, s);
    if (!logico) return erro(req, res, 404, MSG.naoEncontrado);
    if (s.u.trocarSenha && !logico.startsWith('/trocar-senha/')) {
      return querPagina(req) ? redirecionar(res, '/trocar-senha') : json(res, 403, { erro: MSG.trocar });
    }
    if ((logico === '/admin' || logico.startsWith('/admin/')) && !s.u.admin) return erro(req, res, 404, MSG.naoEncontrado);
    const a = await acharNoSite(logico);
    if (!a) return erro(req, res, 404, MSG.naoEncontrado);
    return servirArquivo(req, res, a);
  }

  const faxina = setInterval(() => limite.faxina(), 60000);
  faxina.unref();

  const srv = http.createServer((req, res) => {
    const p = { nome: 'rota', inicio: Date.now() };
    // Log: só o tipo da rota, o status e o tempo. Saúde e arquivo servido com sucesso não entram.
    res.on('finish', () => {
      if (p.nome === 'saude' || (p.nome === 'arquivo' && res.statusCode < 400)) return;
      log(`${p.nome} ${res.statusCode} ${Date.now() - p.inicio}ms`);
    });
    tratar(req, res, p).catch(() => {
      if (!res.headersSent) json(res, 503, { erro: MSG.indisponivel });
      else res.destroy();
    });
  });
  srv.on('clientError', (_e, sock) => sock.destroy());
  srv.on('close', () => clearInterval(faxina));
  srv.requestTimeout = 30000;
  srv.headersTimeout = 10000;
  return srv;
}

export async function iniciar(porta = process.env.PORT !== undefined ? Number(process.env.PORT) : 10000) {
  const srv = await criarServico();
  srv.listen(porta, () => console.log(`login ouvindo ${srv.address().port}`));
  const sair = () => {
    srv.close(() => process.exit(0));
    srv.closeIdleConnections();
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.once('SIGTERM', sair);
  process.once('SIGINT', sair);
  return srv;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) iniciar();
