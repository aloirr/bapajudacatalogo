// Testes do serviço de login (T-0022, T-0024). Só valores claramente falsos; nada de senha ou chave real.
// Rodam no próprio processo, com relógio injetável e um site/ falso numa pasta temporária.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarServico, caminhoLogico, tipoDaImagem, voltaSegura, SESSAO_MS, JANELA_ERROS_MS } from './server.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ORIGEM = 'https://catalogo.exemplo.invalid';
// Valores de teste montados por falsa(): claramente falsos e sem forma de credencial.
const falsa = (rotulo) => `falsa-${rotulo}-${'x'.repeat(8)}`;
const SENHA_INICIAL = falsa('inicial-1');
const SEGREDO = falsa('segredo-de-sessao');
const CHAVE_INTERNA = falsa('chave-interna');
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

// Raiz falsa: site/, dados/ (a base que nunca pode sair) e entregas/ (os 22 arquivos da lista e os internos).
let RAIZ_FALSA;
const MIME_ESPERADO = { pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
// A lista fixa, na ordem da tela: [id, arquivo no disco, conteúdo falso, tipo, grupo, par].
// Os 7 da T-0024 (já no main).
const SETE = [
  ['completo-digital', 'Catalogo_BAP_2027_Completo_Digital.pdf', '%PDF-completo-falso', 'pdf', 'catalogos', null],
  ['a4-grafica', 'Catalogo_BAP_2027_A4_grafica.pdf', '%PDF-a4-falso', 'pdf', 'catalogos', null],
  ['linha-moto', 'Catalogo_BAP_2027_Linha_Moto.pdf', '%PDF-moto-falso', 'pdf', 'catalogos', null],
  ['portfolio', 'Portfolio_Produtos_BAP_AUTOPARTS.pdf', '%PDF-portfolio-falso', 'pdf', 'materiais', null],
  ['lubrificantes-pdf', 'BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf', '%PDF-lubri-falso', 'pdf', 'materiais', 'lubrificantes'],
  ['lubrificantes-pptx', 'BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pptx', 'PK-pptx-lubri-falso', 'pptx', 'materiais', 'lubrificantes'],
  ['kit-filtros', 'Kit_Filtros_BAP.pdf', '%PDF-kit-falso', 'pdf', 'materiais', null],
];
// Os 15 da T-0032: o portfólio por linha (materiais) e os treinamentos (PDF e PowerPoint, em par).
const NOVOS = [
  ['portfolio-leve', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Leve.pdf', '%PDF-port-leve-falso', 'pdf', 'materiais', null],
  ['portfolio-pesada', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Pesada.pdf', '%PDF-port-pesada-falso', 'pdf', 'materiais', null],
  ['portfolio-moto', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Moto.pdf', '%PDF-port-moto-falso', 'pdf', 'materiais', null],
  ['portfolio-lubrificantes', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Lubrificantes.pdf', '%PDF-port-lubri-falso', 'pdf', 'materiais', null],
  ['portfolio-acessorios', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Acessorios.pdf', '%PDF-port-acess-falso', 'pdf', 'materiais', null],
  ['portfolio-baterias', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Baterias.pdf', '%PDF-port-bat-falso', 'pdf', 'materiais', null],
  ['portfolio-autocenter', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Autocenter.pdf', '%PDF-port-auto-falso', 'pdf', 'materiais', null],
  ['treinamento-mecanica-basica-pdf', 'Treinamento_Mecanica_Basica_BAP_Vendedores.pdf', '%PDF-trein-mec-falso', 'pdf', 'treinamentos', 'treinamento-mecanica-basica'],
  ['treinamento-mecanica-basica-pptx', 'Treinamento_Mecanica_Basica_BAP_Vendedores.pptx', 'PK-pptx-trein-mec-falso', 'pptx', 'treinamentos', 'treinamento-mecanica-basica'],
  ['treinamento-baterias-pdf', 'Treinamento_Baterias_BAP_Vendedores.pdf', '%PDF-trein-bat-falso', 'pdf', 'treinamentos', 'treinamento-baterias'],
  ['treinamento-baterias-pptx', 'Treinamento_Baterias_BAP_Vendedores.pptx', 'PK-pptx-trein-bat-falso', 'pptx', 'treinamentos', 'treinamento-baterias'],
  ['treinamento-linha-moto-pdf', 'Treinamento_Linha_Moto_BAP_Vendedores.pdf', '%PDF-trein-moto-falso', 'pdf', 'treinamentos', 'treinamento-linha-moto'],
  ['treinamento-linha-moto-pptx', 'Treinamento_Linha_Moto_BAP_Vendedores.pptx', 'PK-pptx-trein-moto-falso', 'pptx', 'treinamentos', 'treinamento-linha-moto'],
  ['treinamento-lubrificantes-pdf', 'Treinamento_Lubrificantes_BAP_Vendedores.pdf', '%PDF-trein-lubri-falso', 'pdf', 'treinamentos', 'treinamento-lubrificantes'],
  ['treinamento-lubrificantes-pptx', 'Treinamento_Lubrificantes_BAP_Vendedores.pptx', 'PK-pptx-trein-lubri-falso', 'pptx', 'treinamentos', 'treinamento-lubrificantes'],
];
// Os títulos da T-0032, como saem na tela (no par, o PDF e o PowerPoint têm o mesmo título: é um cartão só).
const TITULOS_NOVOS = {
  'portfolio-leve': 'Portfólio · Linha Leve', 'portfolio-pesada': 'Portfólio · Linha Pesada', 'portfolio-moto': 'Portfólio · Linha Moto',
  'portfolio-lubrificantes': 'Portfólio · Linha Lubrificantes', 'portfolio-acessorios': 'Portfólio · Linha Acessórios',
  'portfolio-baterias': 'Portfólio · Linha Baterias', 'portfolio-autocenter': 'Portfólio · Linha Autocenter',
  'treinamento-mecanica-basica-pdf': 'Treinamento · Mecânica Básica', 'treinamento-mecanica-basica-pptx': 'Treinamento · Mecânica Básica',
  'treinamento-baterias-pdf': 'Treinamento · Baterias', 'treinamento-baterias-pptx': 'Treinamento · Baterias',
  'treinamento-linha-moto-pdf': 'Treinamento · Linha Moto', 'treinamento-linha-moto-pptx': 'Treinamento · Linha Moto',
  'treinamento-lubrificantes-pdf': 'Treinamento · Lubrificantes', 'treinamento-lubrificantes-pptx': 'Treinamento · Lubrificantes',
};
// A ordem da tela (revisão de UX da T-0032): os 8 portfólios juntos no começo de 'materiais' (o geral e depois os 7 por
// linha), então os outros materiais e, no fim, os treinamentos.
const LISTA = [...SETE.slice(0, 4), ...NOVOS.slice(0, 7), ...SETE.slice(4), ...NOVOS.slice(7)];
// Os internos de entregas/ (nomes reais de hoje): nunca podem sair.
const INTERNOS = [
  'Alteracoes_Catalogo_Complementos_Fraga_13112026.xlsx', 'Auditoria_Catalogo_BAP_23102026.xlsx',
  'Conferencia_Catalogo_x_Fraga_13112026.xlsx', 'Encartelados_Moto_BAP.xlsx', 'Fotos_pendentes_destaques_catalogo.xlsx',
  'Itens_sem_aplicacao_BAP.xlsx', 'Simulacao_pagina_Pneus_e_Camaras.png', 'Simulacao_venda_casada.png',
  'Aplicacoes_Catalogo_Online_Antes_Depois_12112026.pdf',
];
const INTERNO = 'CONTEUDO-INTERNO-DE-ENTREGAS-NAO-PODE-SAIR';
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
  escrever('site/entrar/comum.js', 'console.log("comum")');
  escrever('site/trocar-senha/index.html', '<!doctype html><title>trocar</title>');
  escrever('site/admin/usuarios/index.html', '<!doctype html><title>usuarios</title>');
  escrever('site/admin/pdfs/index.html', '<!doctype html><title>pdfs</title>');
  escrever('site/.oculto.json', '{"oculto":true}');
  escrever('dados/BASE.xlsx', XLSX);
  escrever('dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx', XLSX);
  escrever('entregas/Catalogo_BAP_2026_Completo_Digital.pdf', '%PDF-velho');
  escrever('entregas/Catalogo_BAP_2026_Linha_Moto.pdf', '%PDF-velho');
  for (const [, arquivo, conteudo] of LISTA) escrever('entregas/' + arquivo, conteudo);
  for (const n of INTERNOS) escrever('entregas/' + n, INTERNO);
  // Quase iguais aos da lista: a regex ancorada não pode casar.
  for (const n of ['Outro.pdf', 'xKit_Filtros_BAP.pdf', 'Kit_Filtros_BAP.pdf.bak', 'Kit_Filtros_BAP.PDF', 'Catalogo_BAP_27_Linha_Moto.pdf']) escrever('entregas/' + n, INTERNO);
  // Link de dentro do site para fora (a base): nunca pode ser seguido.
  fs.symlinkSync(path.join(RAIZ_FALSA, 'dados', 'BASE.xlsx'), path.join(RAIZ_FALSA, 'site', 'img', 'atalho.jpg'));
});

// ---------- sobe o serviço no próprio processo ----------
const vivos = [];
after(() => { for (const s of vivos) s.close(); });
async function subir({ env = {}, dados = pastaTemp('login-dados-'), raiz = 'falsa', pdfs } = {}) {
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
  if (pdfs) opc.pastaPdfs = pdfs;
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
async function adminPronto(s, nova = falsa('admin-2')) {
  const a = await entrar(s, 'admin', SENHA_INICIAL);
  assert.equal(a.status, 200);
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: nova } });
  assert.equal(t.status, 204);
  return cookieDe(t);
}
// Usuário comum criado pelo admin e já com a senha trocada.
async function clientePronto(s, adm, usuario = 'loja.exemplo', nova = falsa('cliente-2')) {
  const c = await s.pedir('/api/usuarios', { metodo: 'POST', cookie: adm, corpo: { usuario, nome: 'Maria Exemplo', empresa: 'Loja Exemplo', senha: falsa('cliente-1') } });
  assert.equal(c.status, 201);
  const e = await entrar(s, usuario, falsa('cliente-1'));
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
  for (const caminho of ['//evil.invalid/x', '/\\evil.invalid/x', '//evil.invalid', '/\\/evil.invalid', '/%09/evil.com', '/%0a/evil.com', '/%0d%5Cevil.com', '/%2F%2Fevil.com', '/%5C%5Cevil.com']) {
    const r = await s.pedir(caminho, { accept: HTML });
    assert.equal(r.status, 302, caminho);
    assert.equal(r.headers.location, '/entrar?volta=%2F', caminho);
  }
  assert.equal((await s.pedir(`/${'a'.repeat(600)}.html`, { accept: HTML })).headers.location, '/entrar?volta=%2F', 'longo demais');
  for (const v of ['/%7f/x', '/%E0%A4%A', '/\t/x']) assert.equal(voltaSegura(v), '/', v);
  for (const v of ['/', '/index.html?x=1', '/admin/usuarios', '/busca/%C3%B3leo']) assert.equal(voltaSegura(v), v, v);
  const pdf = await s.pedir('/admin/pdfs/baixar/a4-grafica', { accept: HTML });
  assert.equal(pdf.status, 302);
  assert.match(pdf.headers.location, /^\/entrar\?volta=/);
  // Abertos: a lista ABERTOS do server.mjs e a saúde.
  for (const caminho of ['/entrar', '/entrar/', '/entrar/entrar.css', '/entrar/entrar.js', '/entrar/comum.js', '/styles.css', '/assets/logo_escuro.png']) {
    assert.equal((await s.pedir(caminho, { accept: HTML })).status, 200, caminho);
  }
  const saude = await s.pedir('/saude');
  assert.equal(saude.status, 200);
  assert.equal(saude.texto, 'ok');
  assert.equal((await s.pedir('/entrar/../data/produtos.json')).status, 401, 'o aberto não abre caminho para o resto');
});

test('login do admin: troca obrigatória no 1º acesso, cookie seguro', async () => {
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
  assert.equal((await s.pedir('/entrar/comum.js', { cookie: a.cookie })).status, 200, 'o comum das telas abre na troca pendente');
  assert.equal((await s.pedir('/data/produtos.json', { cookie: a.cookie })).status, 403);
  assert.equal((await s.pedir('/api/usuarios', { cookie: a.cookie })).status, 403);
  assert.equal((await s.pedir('/admin/pdfs/baixar/a4-grafica', { cookie: a.cookie, accept: 'text/html' })).headers.location, '/trocar-senha');
  const eu = await s.pedir('/api/eu', { cookie: a.cookie });
  assert.equal(eu.status, 200);
  assert.deepEqual(eu.json, {
    usuario: 'admin', nome: 'Administrador', empresa: 'BAP AUTOPARTS', admin: true, temLogo: false,
    trocarSenha: true, expiraEm: new Date(s.rel.t + SESSAO_MS).toISOString(),
  });
  assert.deepEqual(Object.keys(eu.json), ['usuario', 'nome', 'empresa', 'admin', 'temLogo', 'trocarSenha', 'expiraEm']);

  // Regras da senha nova.
  const curta = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: 'x'.repeat(7) } });
  assert.equal(curta.status, 400);
  assert.match(curta.json.erro, /pelo menos 8/);
  const igual = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: SENHA_INICIAL } });
  assert.equal(igual.status, 400);

  s.avancar(60 * 60 * 1000); // 1 h depois do login
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: a.cookie, corpo: { senhaNova: falsa('admin-2') } });
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
  const de2 = await entrar(s, 'admin', falsa('admin-2'));
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

test('usuário comum: 404 nas rotas de admin; o admin baixa os 22 arquivos da lista', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  const eu = await s.pedir('/api/eu', { cookie: cli });
  assert.equal(eu.json.admin, false);
  assert.equal(eu.json.empresa, 'Loja Exemplo');
  assert.equal((await s.pedir('/', { cookie: cli, accept: 'text/html' })).status, 200);
  for (const caminho of ['/admin/usuarios', '/admin/pdfs', '/admin/pdfs/', '/admin/usuarios/index.html', ...LISTA.map(([id]) => '/admin/pdfs/baixar/' + id)]) {
    for (const metodo of ['GET', 'HEAD']) {
      const r = await s.pedir(caminho, { metodo, cookie: cli, accept: 'text/html' });
      assert.equal(r.status, 404, `${metodo} ${caminho}`);
      assert.ok(!r.texto.includes('-falso'), 'vazou para o comum: ' + caminho);
    }
  }
  for (const [caminho, metodo, corpo] of [
    ['/api/usuarios', 'GET'], ['/api/usuarios', 'POST', { usuario: 'intruso', nome: 'X', senha: falsa('99') }],
    ['/api/usuarios/admin', 'PATCH', { nome: 'X' }], ['/api/usuarios/admin/senha', 'POST', { senha: falsa('99') }],
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
  // Contrato com o web-site (T-0024, T-0032): os itens da LISTA, na ordem dela, com estes campos e só estes.
  assert.deepEqual(lista.json.map((x) => [x.id, x.arquivo, x.tamanho, x.tipo, x.grupo, x.par]),
    LISTA.map(([id, arquivo, conteudo, tipo, grupo, par]) => [id, arquivo, conteudo.length, tipo, grupo, par]));
  for (const x of lista.json) {
    assert.deepEqual(Object.keys(x).sort(), ['arquivo', 'data', 'grupo', 'id', 'par', 'tamanho', 'tipo', 'titulo']);
    assert.ok(x.titulo && !Number.isNaN(Date.parse(x.data)));
  }
  assert.equal(lista.json.find((x) => x.id === 'portfolio').titulo, 'Portfólio de Produtos');
  assert.equal(lista.json.find((x) => x.id === 'lubrificantes-pdf').titulo, lista.json.find((x) => x.id === 'lubrificantes-pptx').titulo);
  for (const [id, arquivo, conteudo, tipo] of LISTA) {
    const b = await s.pedir('/admin/pdfs/baixar/' + id, { cookie: adm, accept: 'text/html' });
    assert.equal(b.status, 200, id);
    assert.equal(b.headers['content-type'], MIME_ESPERADO[tipo], id);
    assert.equal(b.headers['content-disposition'], `attachment; filename="${arquivo}"`, id);
    assert.equal(b.headers['cache-control'], 'private, no-store', id);
    assert.equal(b.headers['x-content-type-options'], 'nosniff', id);
    assert.equal(b.texto, conteudo, id);
    const h = await s.pedir('/admin/pdfs/baixar/' + id, { metodo: 'HEAD', cookie: adm });
    assert.equal(h.status, 200, 'HEAD ' + id);
    assert.equal(h.headers['content-type'], b.headers['content-type'], 'HEAD ' + id);
    assert.equal(Number(h.headers['content-length']), conteudo.length, 'HEAD ' + id);
  }
});

test('T-0032: os 15 materiais novos só para o admin, com título, grupo e par; o PowerPoint baixa como pptx', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  const lista = await s.pedir('/api/pdfs', { cookie: adm });
  assert.equal(lista.status, 200);
  assert.equal(lista.json.length, 22);
  const porId = Object.fromEntries(lista.json.map((x) => [x.id, x]));
  // Os 15 novos estão na lista do admin, com o arquivo, o título e o grupo certos.
  assert.equal(NOVOS.length, 15);
  for (const [id, arquivo, conteudo, tipo, grupo, par] of NOVOS) {
    const x = porId[id];
    assert.ok(x, 'fora da lista: ' + id);
    assert.deepEqual([x.arquivo, x.tamanho, x.tipo, x.grupo, x.par, x.titulo], [arquivo, conteudo.length, tipo, grupo, par, TITULOS_NOVOS[id]], id);
  }
  // O portfólio geral continua um só, no grupo dos materiais: a regex dele não casa com o de cada linha.
  assert.deepEqual([porId.portfolio.arquivo, porId.portfolio.grupo], ['Portfolio_Produtos_BAP_AUTOPARTS.pdf', 'materiais']);
  // Grupo 'treinamentos': os 8 dos treinamentos, só eles, juntos e no fim da lista; 4 pares de PDF (principal) e PowerPoint.
  const trein = lista.json.filter((x) => x.grupo === 'treinamentos');
  assert.deepEqual(trein.map((x) => x.id), NOVOS.filter(([, , , , g]) => g === 'treinamentos').map(([id]) => id));
  assert.deepEqual(lista.json.slice(-8).map((x) => x.grupo), Array(8).fill('treinamentos'));
  assert.deepEqual([...new Set(lista.json.map((x) => x.grupo))], ['catalogos', 'materiais', 'treinamentos']);
  const pares = new Map();
  for (const x of trein) pares.set(x.par, [...(pares.get(x.par) || []), x]);
  assert.equal(pares.size, 4);
  for (const [par, itens] of pares) {
    assert.deepEqual(itens.map((x) => x.tipo), ['pdf', 'pptx'], par);
    assert.equal(itens[0].titulo, itens[1].titulo, par);
  }
  // Os 8 portfólios abrem 'materiais', juntos e seguidos: o geral e os 7 por linha (Leve ... Autocenter); depois, o resto.
  const mat = lista.json.filter((x) => x.grupo === 'materiais').map((x) => x.id);
  assert.deepEqual(mat, ['portfolio', 'portfolio-leve', 'portfolio-pesada', 'portfolio-moto', 'portfolio-lubrificantes',
    'portfolio-acessorios', 'portfolio-baterias', 'portfolio-autocenter', 'lubrificantes-pdf', 'lubrificantes-pptx', 'kit-filtros']);
  // Os 7 do portfólio por linha ficam em 'materiais', sem par (um cartão cada).
  for (const [id] of NOVOS.slice(0, 7)) assert.deepEqual([porId[id].grupo, porId[id].par], ['materiais', null], id);
  // O PowerPoint: Content-Type do pptx e download (attachment), no GET e no HEAD.
  for (const [id, arquivo, conteudo, tipo] of NOVOS) {
    for (const metodo of ['GET', 'HEAD']) {
      const r = await s.pedir('/admin/pdfs/baixar/' + id, { metodo, cookie: adm });
      assert.equal(r.status, 200, `${metodo} ${id}`);
      assert.equal(r.headers['content-type'], MIME_ESPERADO[tipo], `${metodo} ${id}`);
      assert.equal(r.headers['content-disposition'], `attachment; filename="${arquivo}"`, `${metodo} ${id}`);
      assert.equal(r.headers['cache-control'], 'private, no-store', `${metodo} ${id}`);
      if (metodo === 'GET') assert.equal(r.texto, conteudo, id);
    }
  }
  for (const id of ['treinamento-mecanica-basica-pptx', 'treinamento-baterias-pptx', 'treinamento-linha-moto-pptx', 'treinamento-lubrificantes-pptx']) {
    const r = await s.pedir('/admin/pdfs/baixar/' + id, { metodo: 'HEAD', cookie: adm });
    assert.equal(r.headers['content-type'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation', id);
  }
  // Quem não é admin: 404 na lista e em cada um dos novos; sem login: 401. Nada dos arquivos sai.
  for (const [cookie, esperado, quem] of [[cli, 404, 'comum'], [undefined, 401, 'sem login']]) {
    const l = await s.pedir('/api/pdfs', { cookie });
    assert.equal(l.status, esperado, `${quem} /api/pdfs`);
    for (const [id, arquivo] of NOVOS) assert.ok(!l.texto.includes(id) && !l.texto.includes(arquivo), `${quem} vê ${id}`);
    for (const [id, arquivo] of NOVOS) {
      for (const metodo of ['GET', 'HEAD']) {
        const r = await s.pedir('/admin/pdfs/baixar/' + id, { metodo, cookie });
        assert.equal(r.status, esperado, `${quem} ${metodo} ${id}`);
        assert.equal(r.headers['content-disposition'], undefined, `${quem} ${metodo} ${id}`);
        assert.ok(!r.texto.includes('-falso') && !r.texto.includes(arquivo), `${quem} ${metodo} ${id}`);
      }
    }
  }
});

test('só a lista fixa abre: id fora da lista, os internos de entregas/ e dados/ dão 404 (T-0024)', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const BASE = 'BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx';
  const ids = [
    // fora da lista
    'nao-existe', 'Outro', 'Outro.pdf', 'COMPLETO-DIGITAL', 'kit_filtros', 'lubrificantes', 'pptx', '__proto__', 'constructor', 'toString',
    'completo-digital%00', 'kit-filtros%20', 'kit-filtros.pdf', '%6Bit-filtros',
    // os quase iguais
    'xKit_Filtros_BAP.pdf', 'Kit_Filtros_BAP.pdf.bak', 'Kit_Filtros_BAP.PDF', 'Catalogo_BAP_27_Linha_Moto.pdf',
    // os nomes da lista (o id é que vale, nunca o nome)
    ...LISTA.map(([, arquivo]) => arquivo),
    // os internos de entregas/, com e sem extensão, e codificados
    ...INTERNOS, ...INTERNOS.map((n) => n.replace(/\.[a-z]+$/, '')), ...INTERNOS.map((n) => encodeURIComponent('../entregas/' + n)),
    // a base e dados/, com "..", "%2F" e "%2e%2e"
    BASE, 'BASE.xlsx', '..', '.', '%2e%2e', '%2E%2E',
    `..%2Fdados%2F${BASE}`, `..%2F..%2Fdados%2F${BASE}`, `%2e%2e%2fdados%2f${BASE}`, `%2E%2E%2F%2E%2E%2Fdados%2F${BASE}`,
    `..%5Cdados%5C${BASE}`, `%252e%252e%252fdados%252f${BASE}`, `kit-filtros%2F..%2F..%2Fdados%2F${BASE}`, '..%2Fdados%2FBASE.xlsx',
    `dados%2F${BASE}`, `%2Fdados%2F${BASE}`, `%c0%ae%c0%ae%2fdados%2f${BASE}`,
  ];
  const caminhos = [
    ...ids.map((id) => '/admin/pdfs/baixar/' + id),
    `/admin/pdfs/baixar/../../../dados/${BASE}`, `/admin/pdfs/baixar/%2e%2e/%2e%2e/%2e%2e/dados/${BASE}`,
    `/admin/pdfs/baixar/kit-filtros/../../../../dados/${BASE}`, '/admin/pdfs/baixar/kit-filtros/', '/admin/pdfs/baixar/',
    '/admin/pdfs/baixar', `/admin/pdfs/baixar/dados/${BASE}`, ...INTERNOS.map((n) => '/admin/pdfs/baixar/../../entregas/' + n),
    ...INTERNOS.map((n) => '/entregas/' + n), ...INTERNOS.map((n) => '/../entregas/' + n), ...INTERNOS.map((n) => '/%2e%2e/entregas/' + n),
  ];
  for (const c of caminhos) {
    for (const metodo of ['GET', 'HEAD']) {
      const r = await s.pedir(c, { metodo, cookie: adm });
      assert.equal(r.status, 404, `${metodo} ${c}`);
      assert.ok(!r.texto.includes(INTERNO) && !r.texto.includes(XLSX) && !r.texto.includes('-falso'), 'vazou: ' + c);
      assert.equal(r.headers['content-disposition'], undefined, 'download em ' + c);
    }
  }
  // A lista da API só traz os da lista fixa, nunca um interno nem a base.
  const lista = await s.pedir('/api/pdfs', { cookie: adm });
  const corpo = JSON.stringify(lista.json);
  for (const n of [...INTERNOS, BASE, 'BASE.xlsx', 'Outro.pdf', 'xKit', '.bak', '.PDF', '_27_', '_2026_']) assert.ok(!corpo.includes(n), 'na lista: ' + n);
});

test('arquivo em falta continua na lista (null) e dá 404; link e pasta não abrem; vale o de ano mais alto (T-0024)', async () => {
  const pasta = pastaTemp('login-entregas-');
  const por = (n, c) => fs.writeFileSync(path.join(pasta, n), c);
  por('Catalogo_BAP_2026_Completo_Digital.pdf', '%PDF-2026');
  por('Catalogo_BAP_2028_Completo_Digital.pdf', '%PDF-2028');
  por('Catalogo_BAP_2027_Completo_Digital.pdf', '%PDF-2027');
  por('BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf', '%PDF-lubri');
  // Só o PowerPoint dos Lubrificantes falta. O Kit Filtros é um link para a base: não pode abrir.
  fs.symlinkSync(path.join(RAIZ_FALSA, 'dados', 'BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx'), path.join(pasta, 'Kit_Filtros_BAP.pdf'));
  // O Portfólio é uma pasta com o nome certo: não é arquivo.
  fs.mkdirSync(path.join(pasta, 'Portfolio_Produtos_BAP_AUTOPARTS.pdf'));
  const s = await subir({ pdfs: pasta });
  const adm = await adminPronto(s);
  const lista = await s.pedir('/api/pdfs', { cookie: adm });
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.json.map((x) => x.id), LISTA.map(([id]) => id));
  const porId = Object.fromEntries(lista.json.map((x) => [x.id, x]));
  assert.equal(porId['completo-digital'].arquivo, 'Catalogo_BAP_2028_Completo_Digital.pdf');
  assert.equal(porId['lubrificantes-pdf'].arquivo, 'BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf');
  // Os da T-0032 ainda não estão nesta pasta: seguem na lista, em falta, como os outros.
  for (const id of ['a4-grafica', 'linha-moto', 'portfolio', 'lubrificantes-pptx', 'kit-filtros', ...NOVOS.map(([i]) => i)]) {
    const x = porId[id];
    assert.deepEqual([x.arquivo, x.tamanho, x.data], [null, null, null], id);
    assert.deepEqual([x.tipo, x.grupo, x.par], LISTA.find(([i]) => i === id).slice(3), id);
    const r = await s.pedir('/admin/pdfs/baixar/' + id, { cookie: adm });
    assert.equal(r.status, 404, id);
    assert.ok(!r.texto.includes(XLSX), id);
  }
  assert.equal((await s.pedir('/admin/pdfs/baixar/completo-digital', { cookie: adm })).texto, '%PDF-2028');

  // Pasta inexistente: os 22 seguem na lista, todos em falta.
  const s2 = await subir({ pdfs: path.join(pasta, 'nao-existe') });
  const adm2 = await adminPronto(s2);
  const l2 = await s2.pedir('/api/pdfs', { cookie: adm2 });
  assert.equal(l2.status, 200);
  assert.deepEqual(l2.json.map((x) => [x.id, x.arquivo]), LISTA.map(([id]) => [id, null]));
});

test('entregas/ de verdade: os 7 da T-0024 existem; os que existem baixam com o tipo certo (T-0024, T-0032)', async () => {
  const pasta = path.join(AQUI, '..', '..', 'catalogo_grafico', 'entregas');
  const s = await subir({ raiz: 'real' });
  const adm = await adminPronto(s);
  const lista = await s.pedir('/api/pdfs', { cookie: adm });
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.json.map((x) => x.id), LISTA.map(([id]) => id));
  const daT24 = new Set(SETE.map(([id]) => id));
  for (const x of lista.json) {
    // [SUPOSIÇÃO] os 15 da T-0032 chegam ao main num PR à parte do catalogo-grafico: até lá, em falta (null e 404).
    if (!daT24.has(x.id) && !x.arquivo) {
      assert.deepEqual([x.tamanho, x.data], [null, null], x.id);
      assert.equal((await s.pedir('/admin/pdfs/baixar/' + x.id, { metodo: 'HEAD', cookie: adm })).status, 404, x.id);
      continue;
    }
    assert.ok(x.arquivo, 'em falta no main: ' + x.id);
    assert.equal(x.tamanho, fs.statSync(path.join(pasta, x.arquivo)).size, x.id);
    // HEAD: confere o tipo e o nome sem baixar os 44 MB.
    const h = await s.pedir('/admin/pdfs/baixar/' + x.id, { metodo: 'HEAD', cookie: adm });
    assert.equal(h.status, 200, x.id);
    assert.equal(h.headers['content-type'], MIME_ESPERADO[x.tipo], x.id);
    assert.equal(h.headers['content-disposition'], `attachment; filename="${x.arquivo}"`, x.id);
  }
  // Os internos de verdade de entregas/ não abrem.
  for (const n of INTERNOS.filter((n) => fs.existsSync(path.join(pasta, n)))) {
    for (const c of ['/admin/pdfs/baixar/' + n, '/admin/pdfs/baixar/' + encodeURIComponent('../../catalogo_grafico/entregas/' + n), '/../catalogo_grafico/entregas/' + n]) {
      const r = await s.pedir(c, { metodo: 'HEAD', cookie: adm });
      assert.equal(r.status, 404, c);
    }
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
  const r1 = await entrar(s, 'loja.exemplo', falsa('errada-1'), ip);
  const r2 = await entrar(s, 'nao.existe', falsa('errada-1'), ip);
  assert.equal(r1.status, 401);
  assert.deepEqual(r1.json, r2.json, 'usuário inexistente e senha errada: mesma resposta');
  assert.deepEqual(r1.json, { erro: 'Usuário ou senha incorretos.' });
  for (let i = 0; i < 4; i++) assert.equal((await entrar(s, 'loja.exemplo', falsa('errada-x'), ip)).status, 401);
  const bloq = await entrar(s, 'loja.exemplo', falsa('cliente-2'), { headers: { 'X-Forwarded-For': '192.0.2.99' } });
  assert.equal(bloq.status, 429, 'bloqueado mesmo com a senha certa e outro IP');
  assert.deepEqual(bloq.json, { erro: 'Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.' });
  assert.equal(bloq.cookie, null);
  s.avancar(JANELA_ERROS_MS);
  assert.equal((await entrar(s, 'loja.exemplo', falsa('cliente-2'), ip)).status, 200, 'depois de 15 min, entra');

  // 20 por IP, espalhados por usuários diferentes.
  const outro = { headers: { 'X-Forwarded-For': '198.51.100.7' } };
  for (let i = 0; i < 20; i++) assert.equal((await entrar(s, `robo${i}`, falsa('errada'), outro)).status, 401);
  assert.equal((await entrar(s, 'admin', falsa('admin-2'), outro)).status, 429);
  assert.equal((await entrar(s, 'admin', falsa('admin-2'), ip)).status, 200, 'outro IP segue entrando');

  // O admin troca a senha do bloqueado: o limite dele zera.
  for (let i = 0; i < 5; i++) await entrar(s, 'loja.exemplo', falsa('errada'), ip);
  assert.equal((await entrar(s, 'loja.exemplo', falsa('cliente-2'), ip)).status, 429);
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo/senha', { metodo: 'POST', cookie: adm, corpo: { senha: falsa('nova-3') } })).status, 204);
  assert.equal((await entrar(s, 'loja.exemplo', falsa('nova-3'), { headers: { 'X-Forwarded-For': '203.0.113.5' } })).status, 200);
});

test('desativar, o admin trocar a senha e o próprio usuário trocar a senha derrubam a sessão', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  const outraAba = (await entrar(s, 'loja.exemplo', falsa('cliente-2'))).cookie;

  // Troca pela própria pessoa: exige a senha atual; a outra sessão cai, esta continua.
  const semAtual = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: cli, corpo: { senhaNova: falsa('cliente-3') } });
  assert.equal(semAtual.status, 400);
  const errada = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: cli, corpo: { senhaAtual: falsa('nao-e-esta'), senhaNova: falsa('cliente-3') } });
  assert.equal(errada.status, 400);
  assert.equal(errada.json.erro, 'A senha atual está incorreta.');
  const t = await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: cli, corpo: { senhaAtual: falsa('cliente-2'), senhaNova: falsa('cliente-3') } });
  assert.equal(t.status, 204);
  const cli2 = cookieDe(t);
  assert.equal((await s.pedir('/api/eu', { cookie: outraAba })).status, 401, 'a outra sessão caiu');
  assert.equal((await s.pedir('/api/eu', { cookie: cli })).status, 401, 'o cookie velho caiu');
  assert.equal((await s.pedir('/api/eu', { cookie: cli2 })).status, 200);

  // Admin troca a senha dele: a sessão cai e o próximo acesso pede troca.
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo/senha', { metodo: 'POST', cookie: adm, corpo: { senha: falsa('inicial-9') } })).status, 204);
  assert.equal((await s.pedir('/data/produtos.json', { cookie: cli2 })).status, 401);
  const e = await entrar(s, 'loja.exemplo', falsa('inicial-9'));
  assert.deepEqual(e.json, { trocarSenha: true });
  const cli3 = cookieDe(await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: e.cookie, corpo: { senhaNova: falsa('cliente-4') } }));
  assert.equal((await s.pedir('/api/eu', { cookie: cli3 })).status, 200);

  // Desativar: cai na hora e não entra mais (mesma mensagem). Reativar não ressuscita o cookie velho.
  const d = await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { ativo: false } });
  assert.equal(d.status, 200);
  assert.equal(d.json.ativo, false);
  const pag = await s.pedir('/', { cookie: cli3, accept: 'text/html' });
  assert.equal(pag.status, 302);
  assert.match(pag.headers.location, /^\/entrar\?volta=/);
  const neg = await entrar(s, 'loja.exemplo', falsa('cliente-4'));
  assert.equal(neg.status, 401);
  assert.deepEqual(neg.json, { erro: 'Usuário ou senha incorretos.' });
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { ativo: true } })).status, 200);
  assert.equal((await s.pedir('/api/eu', { cookie: cli3 })).status, 401);
  assert.equal((await entrar(s, 'loja.exemplo', falsa('cliente-4'))).status, 200);

  // O admin não se desativa nem troca a própria senha por aqui.
  assert.equal((await s.pedir('/api/usuarios/admin', { metodo: 'PATCH', cookie: adm, corpo: { ativo: false } })).status, 400);
  assert.equal((await s.pedir('/api/usuarios/admin/senha', { metodo: 'POST', cookie: adm, corpo: { senha: falsa('77') } })).status, 400);
});

test('cadastro: validação, 409 para usuário repetido, lista sem hash', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const criar = (corpo) => s.pedir('/api/usuarios', { metodo: 'POST', cookie: adm, corpo });
  const ok = { usuario: 'oficina_1', nome: 'João Exemplo', empresa: 'Oficina Exemplo', senha: falsa('12') };
  for (const ruim of [
    { ...ok, usuario: 'ab' }, { ...ok, usuario: 'tem espaco' }, { ...ok, usuario: 'barra/x' }, { ...ok, usuario: 'x'.repeat(33) },
    { ...ok, nome: '' }, { ...ok, nome: 'n'.repeat(81) }, { ...ok, empresa: 'e'.repeat(81) }, { ...ok, senha: 'x'.repeat(7) }, // curta demais (7 caracteres)
  ]) assert.equal((await criar(ruim)).status, 400, JSON.stringify(ruim).slice(0, 60));
  const c = await criar(ok);
  assert.equal(c.status, 201);
  assert.deepEqual(c.json, { usuario: 'oficina_1', nome: 'João Exemplo', empresa: 'Oficina Exemplo', admin: false, ativo: true, temLogo: false, trocarSenha: true, ultimoAcesso: null });
  assert.equal((await criar(ok)).status, 409);
  assert.equal((await criar({ ...ok, usuario: '__proto__' })).status, 201, 'nome estranho não quebra nada');
  const lista = await s.pedir('/api/usuarios', { cookie: adm });
  assert.deepEqual(lista.json.map((u) => u.usuario), ['__proto__', 'admin', 'oficina_1']);
  assert.ok(!lista.texto.includes('scrypt') && !lista.texto.includes('hash'));
  assert.ok(lista.json.find((u) => u.usuario === 'admin').ultimoAcesso);
  // "Falta trocar a senha inicial": trocarSenha (booleano) em cada usuário da lista.
  assert.deepEqual(lista.json.map((u) => [u.usuario, u.trocarSenha]), [['__proto__', true], ['admin', false], ['oficina_1', true]]);
  const ent = await entrar(s, 'oficina_1', falsa('12'));
  assert.equal((await s.pedir('/api/trocar-senha', { metodo: 'POST', cookie: ent.cookie, corpo: { senhaNova: falsa('13') } })).status, 204);
  assert.equal((await s.pedir('/api/usuarios', { cookie: adm })).json.find((u) => u.usuario === 'oficina_1').trocarSenha, false, 'trocou: some a etiqueta');
  assert.equal((await s.pedir('/api/usuarios/oficina_1/senha', { metodo: 'POST', cookie: adm, corpo: { senha: falsa('14') } })).status, 204);
  assert.equal((await s.pedir('/api/usuarios', { cookie: adm })).json.find((u) => u.usuario === 'oficina_1').trocarSenha, true, 'o admin trocou: volta a etiqueta');
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
    const e = await s.pedir('/api/entrar', { metodo: 'POST', origem, corpo: { usuario: 'admin', senha: falsa('admin-2') } });
    assert.equal(e.status, 403, String(origem));
    assert.deepEqual(e.json, { erro: 'Origem não permitida.' });
    assert.equal(cookieDe(e), null);
    const c = await s.pedir('/api/usuarios', { metodo: 'POST', origem, cookie: adm, corpo: { usuario: 'csrf1', nome: 'X', senha: falsa('12') } });
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
  assert.equal((await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': CHAVE_INTERNA.slice(0, -1) } })).status, 401, 'chave quase certa');
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
    { ADMIN_SENHA_INICIAL: undefined }, { ADMIN_SENHA_INICIAL: '' }, { ADMIN_SENHA_INICIAL: 'x'.repeat(7) }, // curta demais (7 caracteres)
    { SESSAO_SEGREDO: undefined }, { PASTA_DADOS: undefined }, { ADMIN_USUARIO: 'Admin Errado' },
  ]) {
    const s = await subir({ env });
    const rotulo = JSON.stringify(env);
    assert.equal((await s.pedir('/', { accept: 'text/html' })).status, 503, rotulo);
    assert.equal((await s.pedir('/entrar', { accept: 'text/html' })).status, 503, rotulo);
    assert.equal((await s.pedir('/data/produtos.json')).status, 503, rotulo);
    const e = await entrar(s, 'admin', falsa('qualquer-coisa'));
    assert.equal(e.status, 503, rotulo);
    assert.equal(e.cookie, null);
    assert.equal((await s.pedir('/saude')).status, 200, rotulo);
    assert.match(s.logs.join('\n'), /fechado: /, rotulo);
  }
});

test('serviço fechado com a chave certa: /interno/codigos segue 200; com a chave errada, 401', async () => {
  // Fechado (sem ADMIN_SENHA_INICIAL e sem usuários): a placa não pode perder a lista do /contar.
  const s = await subir({ env: { ADMIN_SENHA_INICIAL: undefined } });
  assert.equal((await s.pedir('/api/eu')).status, 503, 'está fechado');
  const r = await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': CHAVE_INTERNA } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { total: 3, codigos: ['AMT7183', 'ROL3204-2RS', 'CXD13062'] });
  assert.equal((await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': falsa('chave-errada') } })).status, 401, 'fechado não abre sem a chave certa');
});

test('usuarios.json: só hash scrypt, arquivo 0600, sobrevive ao reinício; a senha inicial nova é ignorada', async () => {
  const dados = pastaTemp('login-dados-');
  const s = await subir({ dados });
  await adminPronto(s);
  const arq = path.join(dados, 'usuarios.json');
  const txt = fs.readFileSync(arq, 'utf8');
  assert.ok(!txt.includes(SENHA_INICIAL) && !txt.includes(falsa('admin-2')), 'senha em texto');
  assert.match(txt, /"hash": "scrypt\$16384\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}"/);
  assert.equal(fs.statSync(arq).mode & 0o777, 0o600);
  assert.deepEqual(fs.readdirSync(dados).sort(), ['logos', 'usuarios.json']);
  s.srv.close();
  const s2 = await subir({ dados, env: { ADMIN_SENHA_INICIAL: falsa('outra-9') } });
  assert.equal((await entrar(s2, 'admin', falsa('outra-9'))).status, 401);
  assert.equal((await entrar(s2, 'admin', falsa('admin-2'))).status, 200);
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
  const s2 = await subir({ env: { SESSAO_SEGREDO: falsa('outro-segredo') } });
  assert.equal((await s2.pedir('/api/eu', { cookie: c })).status, 401);
});

test('o log não leva senha, hash, cookie, segredo, chave, usuário, caminho nem IP', async () => {
  const s = await subir();
  const adm = await adminPronto(s);
  const cli = await clientePronto(s, adm);
  await entrar(s, 'loja.exemplo', falsa('errada'), { headers: { 'X-Forwarded-For': '192.0.2.123' } });
  await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': CHAVE_INTERNA } });
  await s.pedir('/interno/codigos', { headers: { 'X-Chave-Interna': falsa('chave-errada') } });
  await s.pedir('/../dados/BASE.xlsx', { cookie: cli });
  await s.pedir('/admin/pdfs/baixar/a4-grafica', { cookie: adm });
  await s.pedir('/api/usuarios/loja.exemplo/logo', { metodo: 'PUT', cookie: adm, corpo: PNG, headers: { 'Content-Type': 'image/png' } });
  const log = s.logs.join('\n');
  const hash = JSON.parse(fs.readFileSync(path.join(s.dados, 'usuarios.json'), 'utf8')).usuarios[0].hash;
  for (const proibido of [
    'falsa-', // toda senha, segredo e chave de teste (falsa())
    adm.split('=')[1], cli.split('=')[1], hash.split('$')[5], '192.0.2', '127.0.0.1', 'loja.exemplo', 'BASE.xlsx', 'a4-grafica', 'Maria',
  ]) assert.ok(!log.includes(proibido), 'log vazou: ' + proibido);
  assert.match(log, /entrar 200 \d+ms/);
  assert.match(log, /entrar 401 \d+ms/);
  assert.match(log, /interno 401 \d+ms/);
});
