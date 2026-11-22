// Testes do serviço de login (T-0022). Só valores claramente falsos; nada de senha ou chave real.
// Rodam no próprio processo, com relógio injetável e um site/ falso numa pasta temporária.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarServico, caminhoLogico, tipoDaImagem, SESSAO_MS, JANELA_ERROS_MS } from './server.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ORIGEM = 'https://catalogo.exemplo.invalid';
const SENHA_INICIAL = 'senha-inicial-falsa-1';
const SEGREDO = 'segredo-de-sessao-falso-para-teste-0123456789';
const CHAVE_INTERNA = 'chave-interna-falsa-de-teste';
const XLSX = 'CONTEUDO-DA-BASE-XLSX-NAO-PODE-SAIR';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('resto-png-falso')]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('resto-jpg-falso')]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 resto')]);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

// ---------- pastas temporárias ----------
const temporarias = [];
const pastaTemp = (prefixo = 'login-') => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  temporarias.push(d);
  return d;
};
after(() => { for (const d of temporarias) fs.rmSync(d, { recursive: true, force: true }); });

// Raiz falsa: site/, dados/ (a base que nunca pode sair) e entregas/ (PDFs).
let RAIZ_FALSA;
function escrever(rel, conteudo) {
  const f = path.join(RAIZ_FALSA, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, conteudo);
}
before(() => {
  RAIZ_FALSA = pastaTemp('login-raiz-');
  escrever('site/index.html', '<!doctype html><title>catalogo</title>');
  escrever('site/app.js', 'console.log("app")');
  escrever('site/styles.css', 'body{}');
  escrever('site/data/produtos.json', JSON.stringify({ total: 3, produtos: [{ c: 'AMT7183', d: 'PECA', a: 'X' }, { c: 'ROL3204-2RS', d: 'PECA' }, { c: 'CXD13062' }] }));
  escrever('site/img/AMT7183.jpg', JPG);
  escrever('site/assets/logo_escuro.png', PNG);
  escrever('site/entrar/index.html', '<!doctype html><title>entrar</title>');
  escrever('site/entrar/entrar.css', 'form{}');
  escrever('site/entrar/entrar.js', 'console.log("entrar")');
  escrever('site/trocar-senha/index.html', '<!doctype html><title>trocar</title>');
  escrever('site/admin/usuarios/index.html', '<!doctype html><title>usuarios</title>');
  escrever('site/admin/pdfs/index.html', '<!doctype html><title>pdfs</title>');
  escrever('site/.oculto.json', '{"oculto":true}');
  escrever('dados/BASE.xlsx', XLSX);
  escrever('entregas/Catalogo_BAP_2026_Completo_Digital.pdf', '%PDF-velho');
  escrever('entregas/Catalogo_BAP_2027_Completo_Digital.pdf', '%PDF-completo-falso');
  escrever('entregas/Catalogo_BAP_2027_A4_grafica.pdf', '%PDF-a4-falso');
  escrever('entregas/Outro.pdf', '%PDF-outro');
  // Link de dentro do site para fora (a base): nunca pode ser seguido.
  fs.symlinkSync(path.join(RAIZ_FALSA, 'dados', 'BASE.xlsx'), path.join(RAIZ_FALSA, 'site', 'img', 'atalho.jpg'));
});

// ---------- sobe o serviço no próprio processo ----------
const vivos = [];
after(() => { for (const s of vivos) s.close(); });
async function subir({ env = {}, dados = pastaTemp('login-dados-'), raiz = 'falsa' } = {}) {
  const logs = [];
  const rel = { t: Date.UTC(2026, 10, 22, 12, 0, 0) };
  const base = {
    PASTA_DADOS: dados, ADMIN_USUARIO: 'admin', ADMIN_SENHA_INICIAL: SENHA_INICIAL,
    SESSAO_SEGREDO: SEGREDO, CHAVE_INTERNA, ORIGEM_SITE: ORIGEM,
  };
  const opc = {
    env: Object.fromEntries(Object.entries({ ...base, ...env }).filter(([, v]) => v !== undefined)),
    agora: () => rel.t,
    log: (m) => logs.push(m),
  };
  if (raiz === 'falsa') { opc.pastaSite = path.join(RAIZ_FALSA, 'site'); opc.pastaPdfs = path.join(RAIZ_FALSA, 'entregas'); }
  const srv = await criarServico(opc);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  vivos.push(srv);
  const porta = srv.address().port;
  return {
    srv, dados, logs, rel,
    avancar: (ms) => { rel.t += ms; },
    // Pedido cru (o caminho vai como está: "../" e "%2e" chegam ao serviço).
    pedir(caminho, { metodo = 'GET', corpo, cookie, origem = ORIGEM, accept = 'application/json', headers = {} } = {}) {
      return new Promise((resolve, reject) => {
        const h = { Accept: accept, ...headers };
        if (cookie) h.Cookie = cookie;
        if (origem && metodo !== 'GET' && metodo !== 'HEAD') h.Origin = origem;
        let b = null;
        if (corpo !== undefined) {
          b = Buffer.isBuffer(corpo) ? corpo : Buffer.from(typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
          if (!h['Content-Type']) h['Content-Type'] = 'application/json';
          h['Content-Length'] = b.length;
        }
        const req = http.request({ host: '127.0.0.1', port: porta, path: caminho, method: metodo, headers: h }, (res) => {
          const partes = [];
          res.on('data', (x) => partes.push(x));
          res.on('end', () => {
            const buf = Buffer.concat(partes);
            const texto = buf.toString('utf8');
            let json = null;
            try { json = JSON.parse(texto); } catch { /* não é JSON */ }
            resolve({ status: res.statusCode, headers: res.headers, buf, texto, json });
          });
        });
        req.on('error', reject);
        if (b) req.write(b);
        req.end();
      });
    },
  };
}
const cookieDe = (r) => {
  const sc = r.headers['set-cookie'];
  const linha = Array.isArray(sc) ? sc.find((x) => x.startsWith('bap_sessao=')) : null;
  return linha ? linha.split(';')[0] : null;
};
async function entrar(s, usuario, senha, extra = {}) {
  const r = await s.pedir('/api/entrar', { metodo: 'POST', corpo: { usuario, senha }, ...extra });
  return { ...r, cookie: cookieDe(r) };
}
// Admin já com a senha trocada.
async function adminPronto(s, nova = 'senha-admin-falsa-2') {
  const a = await entrar(s, 'admin', SENHA_INICIAL);
  assert.equal(a.status, 200);
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: nova } });
  assert.equal(t.status, 204);
  return cookieDe(t);
}
// Usuário comum criado pelo admin e já com a senha trocada.
async function clientePronto(s, adm, usuario = 'loja.exemplo', nova = 'senha-cliente-falsa-2') {
  const c = await s.pedir('/api/usuarios', { metodo: 'POST', cookie: adm, corpo: { usuario, nome: 'Maria Exemplo', empresa: 'Loja Exemplo', senha: 'senha-cliente-falsa-1' } });
  assert.equal(c.status, 201);
  const e = await entrar(s, usuario, 'senha-cliente-falsa-1');
  assert.equal(e.status, 200);
  assert.deepEqual(e.json, { trocarSenha: true });
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: e.cookie, corpo: { senhaNova: nova } });
  assert.equal(t.status, 204);
  return cookieDe(t);
}

// ---------- testes ----------
test('sem login nada abre: página leva a /entrar, o resto dá 401', async () => {
  const s = await subir();
  const HTML = 'text/html,application/xhtml+xml,*/*;q=0.8';
  for (const [caminho, volta] of [['/', '%2F'], ['/index.html', '%2Findex.html'], ['/admin/usuarios?x=1', '%2Fadmin%2Fusuarios%3Fx%3D1'], ['/trocar-senha', '%2Ftrocar-senha']]) {
    const r = await s.pedir(caminho, { accept: HTML });
    assert.equal(r.status, 302, caminho);
    assert.equal(r.headers.location, `/entrar?volta=${volta}`, caminho);
  }
  for (const caminho of ['/data/produtos.json', '/img/AMT7183.jpg', '/app.js', '/admin/pdfs/baixar/completo-digital', '/api/eu', '/api/usuarios', '/api/pdfs', '/api/eu/logo', '/nao-existe.png']) {
    const r = await s.pedir(caminho);
    assert.equal(r.status, 401, caminho);
    assert.deepEqual(r.json, { erro: 'Entre de novo para continuar.' }, caminho);
    assert.ok(!r.texto.includes('AMT7183'), caminho);
  }
  // "volta" nunca aponta para outro site ("//host" ou "/\\host").
  for (const caminho of ['//evil.invalid/x', '/\\evil.invalid/x', '//evil.invalid', '/\\/evil.invalid']) {
    const r = await s.pedir(caminho, { accept: HTML });
    assert.equal(r.status, 302, caminho);
    assert.equal(r.headers.location, '/entrar?volta=%2F', caminho);
  }
  assert.equal((await s.pedir(`/${'a'.repeat(600)}.html`, { accept: HTML })).headers.location, '/entrar?volta=%2F', 'longo demais');
  const pdf = await s.pedir('/admin/pdfs/baixar/a4-grafica', { accept: HTML });
  assert.equal(pdf.status, 302);
  assert.match(pdf.headers.location, /^\/entrar\?volta=/);
  // Abertos: só a tela de login, o CSS dela, a logo da BAP e a saúde.
  for (const caminho of ['/entrar', '/entrar/', '/entrar/entrar.css', '/entrar/entrar.js', '/styles.css', '/assets/logo_escuro.png']) {
    assert.equal((await s.pedir(caminho, { accept: HTML })).status, 200, caminho);
  }
  const saude = await s.pedir('/saude');
  assert.equal(saude.status, 200);
  assert.equal(saude.texto, 'ok');
  assert.equal((await s.pedir('/entrar/../data/produtos.json')).status, 401, 'o aberto não abre caminho para o resto');
});

test('login do admin: troca obrigatória no 1º acesso, cookie seguro, sessão de 5 h', async () => {
  const s = await subir();
  assert.match(s.logs.join('\n'), /admin inicial criado/);
  const a = await entrar(s, '  ADMIN ', SENHA_INICIAL);
  assert.equal(a.status, 200);
  assert.deepEqual(a.json, { trocarSenha: true });
  const linha = a.headers['set-cookie'][0];
  for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${SESSAO_MS / 1000}`]) assert.ok(linha.includes(attr), attr);

  // Com troca pendente: página vai para /trocar-senha; dado e API (fora as 3) dão 403.
  const pag = await s.pedir('/', { cookie: a.cookie, accept: 'text/html' });
  assert.equal(pag.status, 302);
  assert.equal(pag.headers.location, '/trocar-senha');
  assert.equal((await s.pedir('/trocar-senha', { cookie: a.cookie, accept: 'text/html' })).status, 200);
  assert.equal((await s.pedir('/data/produtos.json', { cookie: a.cookie })).status, 403);
  assert.equal((await s.pedir('/api/usuarios', { cookie: a.cookie })).status, 403);
  assert.equal((await s.pedir('/admin/pdfs/baixar/a4-grafica', { cookie: a.cookie, accept: 'text/html' })).headers.location, '/trocar-senha');
  const eu = await s.pedir('/api/eu', { cookie: a.cookie });
  assert.equal(eu.status, 200);
  assert.deepEqual(eu.json, {
    usuario: 'admin', nome: 'Administrador', empresa: 'BAP AUTOPARTS', admin: true, temLogo: false,
    trocarSenha: true, expiraEm: new Date(s.rel.t + SESSAO_MS).toISOString(),
  });

  // Regras da senha nova.
  const curta = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: '1234567' } });
  assert.equal(curta.status, 400);
  assert.match(curta.json.erro, /pelo menos 8/);
  const igual = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: SENHA_INICIAL } });
  assert.equal(igual.status, 400);

  s.avancar(60 * 60 * 1000); // 1 h depois do login
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: 'senha-admin-falsa-2' } });
  assert.equal(t.status, 204);
  const novo = cookieDe(t);
  assert.ok(novo && novo !== a.cookie);
  assert.ok(t.headers['set-cookie'][0].includes(`Max-Age=${(SESSAO_MS - 3600000) / 1000}`), 'a troca não estica a sessão');
  assert.equal((await s.pedir('/api/eu', { cookie: a.cookie })).status, 401, 'o cookie antigo caiu');
  assert.equal((await s.pedir('/', { cookie: novo, accept: 'text/html' })).status, 200);
  const dados = await s.pedir('/data/produtos.json', { cookie: novo });
  assert.equal(dados.status, 200);
  assert.equal(dados.json.produtos[0].c, 'AMT7183');
  assert.equal((await s.pedir('/img/AMT7183.jpg', { cookie: novo })).status, 200);
  // A senha inicial não vale mais; a nova vale e não pede troca.
  assert.equal((await entrar(s, 'admin', SENHA_INICIAL)).status, 401);
  const de2 = await entrar(s, 'admin', 'senha-admin-falsa-2');
  assert.deepEqual(de2.json, { trocarSenha: false });
});

test('a sessão vence 5 h depois do login, mesmo em uso', async () => {
  const s = await subir();
  const c = await adminPronto(s);
  s.avancar(4 * 60 * 60 * 1000);
  assert.equal((await s.pedir('/data/produtos.json', { cookie: c })).status, 200, 'em uso com 4 h');
  s.avancar(60 * 60 * 1000 - 1000);
  assert.equal((await s.pedir('/api/eu', { cookie: c })).status, 200, 'com 4 h 59 min 59 s');
  s.avancar(1000);
  const pag = await s.pedir('/', { cookie: c, accept: 'text/html' });
  assert.equal(pag.status, 302);
  assert.equal(pag.headers.location, '/entrar?expirou=1');
  assert.ok(String(pag.headers['set-cookie']).includes('Max-Age=0'), 'apaga o cookie vencido');
  const api = await s.pedir('/data/produtos.json', { cookie: c });
  assert.equal(api.status, 401);
  assert.equal((await s.pedir('/api/eu', { cookie: c })).status, 401);
});

test('usuário comum: 404 nas rotas de admin; o admin baixa os 2 PDFs da lista', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  const eu = await s.pedir('/api/eu', { cookie: cli });
  assert.equal(eu.json.admin, false);
  assert.equal(eu.json.empresa, 'Loja Exemplo');
  assert.equal((await s.pedir('/', { cookie: cli, accept: 'text/html' })).status, 200);
  for (const caminho of ['/admin/usuarios', '/admin/pdfs', '/admin/pdfs/', '/admin/usuarios/index.html', '/admin/pdfs/baixar/completo-digital', '/admin/pdfs/baixar/a4-grafica']) {
    assert.equal((await s.pedir(caminho, { cookie: cli, accept: 'text/html' })).status, 404, caminho);
  }
  for (const [caminho, metodo, corpo] of [
    ['/api/usuarios', 'GET'], ['/api/usuarios', 'POST', { usuario: 'intruso', nome: 'X', senha: 'senha-falsa-99' }],
    ['/api/usuarios/admin', 'PATCH', { nome: 'X' }], ['/api/usuarios/admin/senha', 'POST', { senha: 'senha-falsa-99' }],
    ['/api/usuarios/loja.exemplo/logo', 'PUT', PNG], ['/api/usuarios/loja.exemplo/logo', 'GET'], ['/api/pdfs', 'GET'],
  ]) {
    const r = await s.pedir(caminho, { metodo, cookie: cli, corpo, headers: Buffer.isBuffer(corpo) ? { 'Content-Type': 'image/png' } : {} });
    assert.equal(r.status, 404, `${metodo} ${caminho}`);
  }
  assert.equal((await s.pedir('/api/usuarios', { cookie: adm })).json.length, 2, 'ninguém foi criado pelo comum');

  // Admin.
  assert.equal((await s.pedir('/admin/usuarios', { cookie: adm, accept: 'text/html' })).status, 200);
  assert.equal((await s.pedir('/admin/pdfs', { cookie: adm, accept: 'text/html' })).status, 200);
  const lista = await s.pedir('/api/pdfs', { cookie: adm });
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.json.map((x) => [x.id, x.arquivo, x.tamanho]), [
    ['completo-digital', 'Catalogo_BAP_2027_Completo_Digital.pdf', '%PDF-completo-falso'.length],
    ['a4-grafica', 'Catalogo_BAP_2027_A4_grafica.pdf', '%PDF-a4-falso'.length],
  ]);
  for (const x of lista.json) assert.ok(x.titulo && !Number.isNaN(Date.parse(x.data)));
  const b = await s.pedir('/admin/pdfs/baixar/completo-digital', { cookie: adm, accept: 'text/html' });
  assert.equal(b.status, 200);
  assert.equal(b.headers['content-type'], 'application/pdf');
  assert.equal(b.headers['content-disposition'], 'attachment; filename="Catalogo_BAP_2027_Completo_Digital.pdf"');
  assert.equal(b.texto, '%PDF-completo-falso');
  assert.equal((await s.pedir('/admin/pdfs/baixar/a4-grafica', { cookie: adm })).texto, '%PDF-a4-falso');
  for (const id of ['Outro', 'Outro.pdf', '..%2Fdados%2FBASE.xlsx', '..', 'completo-digital%00']) {
    assert.notEqual((await s.pedir('/admin/pdfs/baixar/' + id, { cookie: adm })).status, 200, id);
  }
});

test('"../" e a base (dados/*.xlsx) nunca são servidos', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const caminhos = [
    '/../dados/BASE.xlsx', '/%2e%2e/dados/BASE.xlsx', '/%2E%2E/dados/BASE.xlsx', '/..%2fdados%2fBASE.xlsx',
    '/img/..%2f..%2fdados%2fBASE.xlsx', '/img/../../dados/BASE.xlsx', '/%2e%2e%5cdados%5cBASE.xlsx', '/..\\dados\\BASE.xlsx',
    '/dados/BASE.xlsx', '//dados/BASE.xlsx', '/img/atalho.jpg', '/.oculto.json', '/%2eoculto.json', '/data/../.oculto.json',
    '/%252e%252e/dados/BASE.xlsx', '/img/%00.jpg', '/%c0%ae%c0%ae/dados/BASE.xlsx', '/entrar/%2e%2e/%2e%2e/dados/BASE.xlsx',
  ];
  for (const c of caminhos) {
    for (const cookie of [adm, undefined]) {
      const r = await s.pedir(c, { cookie });
      assert.notEqual(r.status, 200, c);
      assert.ok(!r.texto.includes(XLSX) && !r.texto.includes('oculto'), 'vazou: ' + c);
    }
  }
  assert.equal(caminhoLogico('/a/../b'), null);
  assert.equal(caminhoLogico('/a/%2e%2e/b'), null);
  assert.equal(caminhoLogico('/img/x.jpg'), '/img/x.jpg');
  assert.equal(caminhoLogico('/entrar'), '/entrar/index.html');
});

test('"../" contra o site/ de verdade: a base e os PDFs não saem pelo caminho do site', async () => {
  const s = await subir({ raiz: 'real' });
  const adm = await adminPronto(s);
  for (const c of [
    '/../dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx', '/%2e%2e/dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx',
    '/..%2fdados%2fBASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx', '/dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx',
    '/../catalogo_grafico/entregas/Catalogo_BAP_2027_A4_grafica.pdf', '/../servicos/login/server.mjs', '/../.git/config',
  ]) {
    const r = await s.pedir(c, { cookie: adm });
    assert.notEqual(r.status, 200, c);
    assert.ok(r.buf.length < 2000, c);
  }
  const real = path.join(AQUI, '..', '..', 'site', 'data', 'produtos.json');
  if (fs.existsSync(real)) {
    const r = await s.pedir('/data/produtos.json', { cookie: adm, headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], 'gzip');
  }
});

test('limite de tentativas: 5 erros por usuário e 20 por IP em 15 min, sempre a mesma mensagem', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  await clientePronto(s, adm);
  const ip = { headers: { 'X-Forwarded-For': '192.0.2.10' } };
  const r1 = await entrar(s, 'loja.exemplo', 'errada-1', ip);
  const r2 = await entrar(s, 'nao.existe', 'errada-1', ip);
  assert.equal(r1.status, 401);
  assert.deepEqual(r1.json, r2.json, 'usuário inexistente e senha errada: mesma resposta');
  assert.deepEqual(r1.json, { erro: 'Usuário ou senha incorretos.' });
  for (let i = 0; i < 4; i++) assert.equal((await entrar(s, 'loja.exemplo', 'errada-x', ip)).status, 401);
  const bloq = await entrar(s, 'loja.exemplo', 'senha-cliente-falsa-2', { headers: { 'X-Forwarded-For': '192.0.2.99' } });
  assert.equal(bloq.status, 429, 'bloqueado mesmo com a senha certa e outro IP');
  assert.deepEqual(bloq.json, { erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' });
  assert.equal(bloq.cookie, null);
  s.avancar(JANELA_ERROS_MS);
  assert.equal((await entrar(s, 'loja.exemplo', 'senha-cliente-falsa-2', ip)).status, 200, 'depois de 15 min, entra');

  // 20 por IP, espalhados por usuários diferentes.
  const outro = { headers: { 'X-Forwarded-For': '198.51.100.7' } };
  for (let i = 0; i < 20; i++) assert.equal((await entrar(s, `robo${i}`, 'errada', outro)).status, 401);
  assert.equal((await entrar(s, 'admin', 'senha-admin-falsa-2', outro)).status, 429);
  assert.equal((await entrar(s, 'admin', 'senha-admin-falsa-2', ip)).status, 200, 'outro IP segue entrando');

  // O admin troca a senha do bloqueado: o limite dele zera.
  for (let i = 0; i < 5; i++) await entrar(s, 'loja.exemplo', 'errada', ip);
  assert.equal((await entrar(s, 'loja.exemplo', 'senha-cliente-falsa-2', ip)).status, 429);
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo/senha', { metodo: 'POST', cookie: adm, corpo: { senha: 'senha-nova-falsa-3' } })).status, 204);
  assert.equal((await entrar(s, 'loja.exemplo', 'senha-nova-falsa-3', { headers: { 'X-Forwarded-For': '203.0.113.5' } })).status, 200);
});

test('desativar, o admin trocar a senha e o próprio usuário trocar a senha derrubam a sessão', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  const outraAba = (await entrar(s, 'loja.exemplo', 'senha-cliente-falsa-2')).cookie;

  // Troca pela própria pessoa: exige a senha atual; a outra sessão cai, esta continua.
  const semAtual = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: cli, corpo: { senhaNova: 'senha-cliente-falsa-3' } });
  assert.equal(semAtual.status, 400);
  const errada = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: cli, corpo: { senhaAtual: 'nao-e-esta', senhaNova: 'senha-cliente-falsa-3' } });
  assert.equal(errada.status, 400);
  assert.equal(errada.json.erro, 'A senha atual está incorreta.');
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: cli, corpo: { senhaAtual: 'senha-cliente-falsa-2', senhaNova: 'senha-cliente-falsa-3' } });
  assert.equal(t.status, 204);
  const cli2 = cookieDe(t);
  assert.equal((await s.pedir('/api/eu', { cookie: outraAba })).status, 401, 'a outra sessão caiu');
  assert.equal((await s.pedir('/api/eu', { cookie: cli })).status, 401, 'o cookie velho caiu');
  assert.equal((await s.pedir('/api/eu', { cookie: cli2 })).status, 200);

  // Admin troca a senha dele: a sessão cai e o próximo acesso pede troca.
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo/senha', { metodo: 'POST', cookie: adm, corpo: { senha: 'senha-inicial-falsa-9' } })).status, 204);
  assert.equal((await s.pedir('/data/produtos.json', { cookie: cli2 })).status, 401);
  const e = await entrar(s, 'loja.exemplo', 'senha-inicial-falsa-9');
  assert.deepEqual(e.json, { trocarSenha: true });
  const cli3 = cookieDe(await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: e.cookie, corpo: { senhaNova: 'senha-cliente-falsa-4' } }));
  assert.equal((await s.pedir('/api/eu', { cookie: cli3 })).status, 200);

  // Desativar: cai na hora e não entra mais (mesma mensagem). Reativar não ressuscita o cookie velho.
  const d = await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { ativo: false } });
  assert.equal(d.status, 200);
  assert.equal(d.json.ativo, false);
  const pag = await s.pedir('/', { cookie: cli3, accept: 'text/html' });
  assert.equal(pag.status, 302);
  assert.match(pag.headers.location, /^\/entrar\?volta=/);
  const neg = await entrar(s, 'loja.exemplo', 'senha-cliente-falsa-4');
  assert.equal(neg.status, 401);
  assert.deepEqual(neg.json, { erro: 'Usuário ou senha incorretos.' });
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { ativo: true } })).status, 200);
  assert.equal((await s.pedir('/api/eu', { cookie: cli3 })).status, 401);
  assert.equal((await entrar(s, 'loja.exemplo', 'senha-cliente-falsa-4')).status, 200);

  // O admin não se desativa nem troca a própria senha por aqui.
  assert.equal((await s.pedir('/api/usuarios/admin', { metodo: 'PATCH', cookie: adm, corpo: { ativo: false } })).status, 400);
  assert.equal((await s.pedir('/api/usuarios/admin/senha', { metodo: 'POST', cookie: adm, corpo: { senha: 'senha-falsa-77' } })).status, 400);
});

test('cadastro: validação, 409 para usuário repetido, lista sem hash', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const criar = (corpo) => s.pedir('/api/usuarios', { metodo: 'POST', cookie: adm, corpo });
  const ok = { usuario: 'oficina_1', nome: 'João Exemplo', empresa: 'Oficina Exemplo', senha: 'senha-falsa-12' };
  for (const ruim of [
    { ...ok, usuario: 'ab' }, { ...ok, usuario: 'tem espaco' }, { ...ok, usuario: 'barra/x' }, { ...ok, usuario: 'x'.repeat(33) },
    { ...ok, nome: '' }, { ...ok, nome: 'n'.repeat(81) }, { ...ok, empresa: 'e'.repeat(81) }, { ...ok, senha: 'curta' },
  ]) assert.equal((await criar(ruim)).status, 400, JSON.stringify(ruim).slice(0, 60));
  const c = await criar(ok);
  assert.equal(c.status, 201);
  assert.deepEqual(c.json, { usuario: 'oficina_1', nome: 'João Exemplo', empresa: 'Oficina Exemplo', admin: false, ativo: true, temLogo: false, ultimoAcesso: null });
  assert.equal((await criar(ok)).status, 409);
  assert.equal((await criar({ ...ok, usuario: '__proto__' })).status, 201, 'nome estranho não quebra nada');
  const lista = await s.pedir('/api/usuarios', { cookie: adm });
  assert.deepEqual(lista.json.map((u) => u.usuario), ['__proto__', 'admin', 'oficina_1']);
  assert.ok(!lista.texto.includes('scrypt') && !lista.texto.includes('hash'));
  assert.ok(lista.json.find((u) => u.usuario === 'admin').ultimoAcesso);
  const p = await s.pedir('/api/usuarios/oficina_1', { metodo: 'PATCH', cookie: adm, corpo: { nome: 'João E.', empresa: '' } });
  assert.equal(p.status, 200);
  assert.equal(p.json.nome, 'João E.');
  assert.equal(p.json.empresa, '');
  assert.equal((await s.pedir('/api/usuarios/nao.existe', { metodo: 'PATCH', cookie: adm, corpo: { nome: 'X' } })).status, 404);
});

test('logo: tipo conferido pelos primeiros bytes, até 1 MB, SVG não entra', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  const url = '/api/usuarios/loja.exemplo/logo';
  const pôr = (buf, tipo) => s.pedir(url, { metodo: 'PUT', cookie: adm, corpo: buf, headers: { 'Content-Type': tipo } });
  assert.equal((await s.pedir('/api/eu/logo', { cookie: cli })).status, 404, 'sem logo');
  const falso = await pôr(JPG, 'image/png');
  assert.equal(falso.status, 400, 'diz PNG mas é JPG');
  assert.equal((await pôr(SVG, 'image/svg+xml')).status, 400);
  assert.equal((await pôr(SVG, 'image/png')).status, 400, 'SVG com tipo falso');
  assert.equal((await pôr(Buffer.from('<html>'), 'image/webp')).status, 400);
  assert.equal((await pôr(Buffer.alloc(0), 'image/png')).status, 400);
  const grande = Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]);
  assert.equal((await pôr(grande, 'image/png')).status, 413);
  assert.equal((await pôr(PNG, 'image/png')).status, 204);
  const eu = await s.pedir('/api/eu/logo', { cookie: cli });
  assert.equal(eu.status, 200);
  assert.equal(eu.headers['content-type'], 'image/png');
  assert.ok(eu.buf.equals(PNG));
  assert.equal((await s.pedir('/api/eu', { cookie: cli })).json.temLogo, true);
  assert.equal((await pôr(WEBP, 'image/webp')).status, 204);
  const adminVe = await s.pedir(url, { cookie: adm });
  assert.equal(adminVe.headers['content-type'], 'image/webp');
  assert.deepEqual(fs.readdirSync(path.join(s.dados, 'logos')), ['loja.exemplo.webp'], 'a logo antiga saiu do disco');
  assert.equal((await s.pedir(url, { metodo: 'DELETE', cookie: adm })).status, 204);
  assert.equal((await s.pedir('/api/eu/logo', { cookie: cli })).status, 404);
  assert.deepEqual(fs.readdirSync(path.join(s.dados, 'logos')), []);
  assert.equal(tipoDaImagem(JPG), 'jpg');
});

test('Origin errado ou ausente é recusado nos POST/PATCH/PUT/DELETE', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  for (const origem of ['https://malicioso.invalid', null, 'null', ORIGEM + '.malicioso.invalid']) {
    const e = await s.pedir('/api/entrar', { metodo: 'POST', origem, corpo: { usuario: 'admin', senha: 'senha-admin-falsa-2' } });
    assert.equal(e.status, 403, String(origem));
    assert.deepEqual(e.json, { erro: 'Origem não permitida.' });
    assert.equal(cookieDe(e), null);
    const c = await s.pedir('/api/usuarios', { metodo: 'POST', origem, cookie: adm, corpo: { usuario: 'csrf1', nome: 'X', senha: 'senha-falsa-12' } });
    assert.equal(c.status, 403);
    assert.equal((await s.pedir('/api/usuarios/admin', { metodo: 'PATCH', origem, cookie: adm, corpo: { nome: 'Hackeado' } })).status, 403);
    assert.equal((await s.pedir('/api/sair', { metodo: 'POST', origem, cookie: adm })).status, 403);
  }
  const lista = await s.pedir('/api/usuarios', { cookie: adm });
  assert.deepEqual(lista.json.map((u) => [u.usuario, u.nome]), [['admin', 'Administrador']], 'nada mudou');
  const sair = await s.pedir('/api/sair', { metodo: 'POST', cookie: adm });
  assert.equal(sair.status, 204);
  assert.ok(String(sair.headers['set-cookie']).includes('Max-Age=0'));
});

test('sem ORIGEM_SITE nem RENDER_EXTERNAL_URL vale a origem do próprio Host', async () => {
  const s = await subir({ env: { ORIGEM_SITE: undefined } });
  const host = `127.0.0.1:${s.srv.address().port}`;
  assert.equal((await entrar(s, 'admin', SENHA_INICIAL, { origem: `http://${host}` })).status, 200);
  assert.equal((await entrar(s, 'admin', SENHA_INICIAL, { origem: ORIGEM })).status, 403);
});

test('/interno/codigos: só com a chave interna, e só os códigos', async () => {
  const s = await subir();
  assert.equal((await s.pedir('/interno/codigos')).status, 401);
  assert.equal((await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': 'errada' } })).status, 401);
  assert.equal((await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': '' } })).status, 401);
  const adm = await adminPronto(s);
  assert.equal((await s.pedir('/interno/codigos', { cookie: adm })).status, 401, 'sessão não substitui a chave');
  const r = await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': CHAVE_INTERNA } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { total: 3, codigos: ['AMT7183', 'ROL3204-2RS', 'CXD13062'] });
  const sem = await subir({ env: { CHAVE_INTERNA: undefined } });
  assert.equal((await sem.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': '' } })).status, 401);
  assert.equal((await sem.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': 'undefined' } })).status, 401);
});

test('sem ADMIN_SENHA_INICIAL e sem usuários (ou sem segredo/pasta): 503, menos a saúde', async () => {
  for (const env of [
    { ADMIN_SENHA_INICIAL: undefined }, { ADMIN_SENHA_INICIAL: '' }, { ADMIN_SENHA_INICIAL: 'curta' },
    { SESSAO_SEGREDO: undefined }, { PASTA_DADOS: undefined }, { ADMIN_USUARIO: 'Admin Errado' },
  ]) {
    const s = await subir({ env });
    const rotulo = JSON.stringify(env);
    assert.equal((await s.pedir('/', { accept: 'text/html' })).status, 503, rotulo);
    assert.equal((await s.pedir('/entrar', { accept: 'text/html' })).status, 503, rotulo);
    assert.equal((await s.pedir('/data/produtos.json')).status, 503, rotulo);
    const e = await entrar(s, 'admin', 'qualquer-coisa-falsa');
    assert.equal(e.status, 503, rotulo);
    assert.equal(e.cookie, null);
    assert.equal((await s.pedir('/saude')).status, 200, rotulo);
    assert.match(s.logs.join('\n'), /fechado: /, rotulo);
  }
});

test('usuarios.json: só hash scrypt, arquivo 0600, sobrevive ao reinício; a senha inicial nova é ignorada', async () => {
  const dados = pastaTemp('login-dados-');
  const s = await subir({ dados });
  await adminPronto(s);
  const arq = path.join(dados, 'usuarios.json');
  const txt = fs.readFileSync(arq, 'utf8');
  assert.ok(!txt.includes(SENHA_INICIAL) && !txt.includes('senha-admin-falsa-2'), 'senha em texto');
  assert.match(txt, /"hash": "scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}"/);
  assert.equal(fs.statSync(arq).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(dados).sort(), ['logos', 'usuarios.json']);
  s.srv.close();
  const s2 = await subir({ dados, env: { ADMIN_SENHA_INICIAL: 'outra-senha-falsa-9' } });
  assert.equal((await entrar(s2, 'admin', 'outra-senha-falsa-9')).status, 401);
  assert.equal((await entrar(s2, 'admin', 'senha-admin-falsa-2')).status, 200);
  // Arquivo quebrado: fecha (503) e NÃO sobrescreve.
  fs.writeFileSync(arq, '{quebrado');
  const s3 = await subir({ dados });
  assert.equal((await s3.pedir('/api/eu')).status, 503);
  assert.equal(fs.readFileSync(arq, 'utf8'), '{quebrado');
});

test('cookie adulterado, de outro segredo ou com vencimento esticado não vale', async () => {
  const s = await subir();
  const c = await adminPronto(s);
  const [nome, valor] = c.split('=');
  const [corpo, assin] = valor.split('.');
  const d = JSON.parse(Buffer.from(corpo, 'base64url').toString());
  const esticado = Buffer.from(JSON.stringify({ ...d, e: d.e + SESSAO_MS })).toString('base64url');
  const comoAdmin = Buffer.from(JSON.stringify({ ...d, u: 'outro' })).toString('base64url');
  for (const ruim of [`${esticado}.${assin}`, `${comoAdmin}.${assin}`, `${corpo}.${assin.slice(0, -2)}AA`, corpo, `${corpo}.${assin}.x`, '']) {
    assert.equal((await s.pedir('/api/eu', { cookie: `${nome}=${ruim}` })).status, 401, ruim.slice(0, 20));
  }
  const s2 = await subir({ env: { SESSAO_SEGREDO: 'outro-segredo-falso-de-teste-987654321' } });
  assert.equal((await s2.pedir('/api/eu', { cookie: c })).status, 401);
});

test('o log não leva senha, hash, cookie, segredo, chave, usuário, caminho nem IP', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  await entrar(s, 'loja.exemplo', 'senha-errada-falsa', { headers: { 'X-Forwarded-For': '192.0.2.123' } });
  await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': CHAVE_INTERNA } });
  await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': 'chave-errada-falsa' } });
  await s.pedir('/../dados/BASE.xlsx', { cookie: cli });
  await s.pedir('/admin/pdfs/baixar/a4-grafica', { cookie: adm });
  await s.pedir('/api/usuarios/loja.exemplo/logo', { metodo: 'PUT', cookie: adm, corpo: PNG, headers: { 'Content-Type': 'image/png' } });
  const log = s.logs.join('\n');
  const hash = JSON.parse(fs.readFileSync(path.join(s.dados, 'usuarios.json'), 'utf8')).usuarios[0].hash;
  for (const proibido of [
    SENHA_INICIAL, 'senha-admin-falsa-2', 'senha-cliente-falsa', 'senha-errada-falsa', SEGREDO, CHAVE_INTERNA, 'chave-errada-falsa',
    adm.split('=')[1], cli.split('=')[1], hash.split('$')[5], '192.0.2', '127.0.0.1', 'loja.exemplo', 'BASE.xlsx', 'a4-grafica', 'Maria',
  ]) assert.ok(!log.includes(proibido), 'log vazou: ' + proibido);
  assert.match(log, /entrar 200 \d+ms/);
  assert.match(log, /entrar 401 \d+ms/);
  assert.match(log, /interno 401 \d+ms/);
});
