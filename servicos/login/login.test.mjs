// Testes do serviço de login (T-0022, T-0024, T-0034). Só valores claramente falsos; nada de senha ou chave real.
// Rodam no próprio processo, com relógio injetável e um site/ falso numa pasta temporária.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarServico, caminhoLogico, tipoDaImagem, voltaSegura, podeVerEstoque, SESSAO_MS, JANELA_ERROS_MS } from './server.mjs';
import { lerXlsx, criarEstoque, DESCOMPACTADO_MAX, LINHAS_MAX } from './estoque.mjs';
import { zipar, xlsxFicticio } from './xlsx-ficticio.mjs';
import { proximaRecarga, agendarRecarga } from './recarga.mjs';
import { execFile } from 'node:child_process';

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

// Raiz falsa: site/, dados/ (a base que nunca pode sair) e entregas/ (os arquivos da lista e os internos).
let RAIZ_FALSA;
const MIME_ESPERADO = { pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
// A lista fixa: [id, arquivo no disco, conteúdo falso, tipo, grupo, par, título]. No par, o PDF e o PowerPoint têm o mesmo
// título (um cartão só na tela).
// Os 7 da T-0024 (já no main).
const SETE = [
  ['completo-digital', 'Catalogo_BAP_2027_Completo_Digital.pdf', '%PDF-completo-falso', 'pdf', 'catalogos', null, 'Completo Digital'],
  ['a4-grafica', 'Catalogo_BAP_2027_A4_grafica.pdf', '%PDF-a4-falso', 'pdf', 'catalogos', null, 'A4 gráfica'],
  ['linha-moto', 'Catalogo_BAP_2027_Linha_Moto.pdf', '%PDF-moto-falso', 'pdf', 'catalogos', null, 'Linha Moto'],
  ['portfolio', 'Portfolio_Produtos_BAP_AUTOPARTS.pdf', '%PDF-portfolio-falso', 'pdf', 'materiais', null, 'Portfólio de Produtos'],
  ['lubrificantes-pdf', 'BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf', '%PDF-lubri-falso', 'pdf', 'materiais', 'lubrificantes', 'Lubrificantes e Químicos'],
  ['lubrificantes-pptx', 'BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pptx', 'PK-pptx-lubri-falso', 'pptx', 'materiais', 'lubrificantes', 'Lubrificantes e Químicos'],
  ['kit-filtros', 'Kit_Filtros_BAP.pdf', '%PDF-kit-falso', 'pdf', 'materiais', null, 'Kit Filtros'],
];
// Os da T-0032 e T-0038: o portfólio por linha (materiais) e os treinamentos (PDF e PowerPoint, em par).
const NOVOS = [
  ['portfolio-leve', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Leve.pdf', '%PDF-port-leve-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Leve'],
  ['portfolio-pesada', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Pesada.pdf', '%PDF-port-pesada-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Pesada'],
  ['portfolio-moto', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Moto.pdf', '%PDF-port-moto-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Moto'],
  ['portfolio-lubrificantes', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Lubrificantes.pdf', '%PDF-port-lubri-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Lubrificantes'],
  ['portfolio-acessorios', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Acessorios.pdf', '%PDF-port-acess-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Acessórios'],
  ['portfolio-baterias', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Baterias.pdf', '%PDF-port-bat-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Baterias'],
  ['portfolio-autocenter', 'Portfolio_Produtos_BAP_AUTOPARTS_Linha_Autocenter.pdf', '%PDF-port-auto-falso', 'pdf', 'materiais', null, 'Portfólio · Linha Autocenter'],
  // T-0038: o Onboarding do Vendedor, no topo dos treinamentos.
  ['treinamento-onboarding-vendedor-pdf', 'Treinamento_Onboarding_Vendedor_BAP_Vendedores.pdf', '%PDF-trein-onb-falso', 'pdf', 'treinamentos', 'treinamento-onboarding-vendedor', 'Treinamento · Onboarding do Vendedor'],
  ['treinamento-onboarding-vendedor-pptx', 'Treinamento_Onboarding_Vendedor_BAP_Vendedores.pptx', 'PK-pptx-trein-onb-falso', 'pptx', 'treinamentos', 'treinamento-onboarding-vendedor', 'Treinamento · Onboarding do Vendedor'],
  ['treinamento-mecanica-basica-pdf', 'Treinamento_Mecanica_Basica_BAP_Vendedores.pdf', '%PDF-trein-mec-falso', 'pdf', 'treinamentos', 'treinamento-mecanica-basica', 'Treinamento · Mecânica Básica'],
  ['treinamento-mecanica-basica-pptx', 'Treinamento_Mecanica_Basica_BAP_Vendedores.pptx', 'PK-pptx-trein-mec-falso', 'pptx', 'treinamentos', 'treinamento-mecanica-basica', 'Treinamento · Mecânica Básica'],
  ['treinamento-baterias-pdf', 'Treinamento_Baterias_BAP_Vendedores.pdf', '%PDF-trein-bat-falso', 'pdf', 'treinamentos', 'treinamento-baterias', 'Treinamento · Baterias'],
  ['treinamento-baterias-pptx', 'Treinamento_Baterias_BAP_Vendedores.pptx', 'PK-pptx-trein-bat-falso', 'pptx', 'treinamentos', 'treinamento-baterias', 'Treinamento · Baterias'],
  ['treinamento-linha-moto-pdf', 'Treinamento_Linha_Moto_BAP_Vendedores.pdf', '%PDF-trein-moto-falso', 'pdf', 'treinamentos', 'treinamento-linha-moto', 'Treinamento · Linha Moto'],
  ['treinamento-linha-moto-pptx', 'Treinamento_Linha_Moto_BAP_Vendedores.pptx', 'PK-pptx-trein-moto-falso', 'pptx', 'treinamentos', 'treinamento-linha-moto', 'Treinamento · Linha Moto'],
  ['treinamento-lubrificantes-pdf', 'Treinamento_Lubrificantes_BAP_Vendedores.pdf', '%PDF-trein-lubri-falso', 'pdf', 'treinamentos', 'treinamento-lubrificantes', 'Treinamento · Lubrificantes'],
  ['treinamento-lubrificantes-pptx', 'Treinamento_Lubrificantes_BAP_Vendedores.pptx', 'PK-pptx-trein-lubri-falso', 'pptx', 'treinamentos', 'treinamento-lubrificantes', 'Treinamento · Lubrificantes'],
];
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
  escrever('site/estoque/index.html', '<!doctype html><title>estoque</title>');
  escrever('site/estoque/estoque.js', 'console.log("estoque")');
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
// estoqueUrl: a fonte da aba Estoque (T-0034). Padrão null: nenhum teste vai à rede.
// agendar: troca o setTimeout da recarga diária do estoque (T-0036); padrão: o de verdade (com unref).
async function subir({ env = {}, dados = pastaTemp('login-dados-'), raiz = 'falsa', pdfs, estoqueUrl = null, agendar } = {}) {
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
    estoqueUrl,
    agendar,
  };
  if (raiz === 'falsa') { opc.pastaSite = path.join(RAIZ_FALSA, 'site'); opc.pastaPdfs = path.join(RAIZ_FALSA, 'entregas'); }
  if (pdfs) opc.pastaPdfs = pdfs;
  const srv = await criarServico(opc);
  await srv.estoquePronto;
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
  // Os arquivos do admin, um a um: 401, sem download e sem nada do arquivo.
  for (const [id, arquivo] of LISTA) {
    for (const metodo of ['GET', 'HEAD']) {
      const r = await s.pedir('/admin/pdfs/baixar/' + id, { metodo });
      assert.equal(r.status, 401, `${metodo} ${id}`);
      assert.equal(r.headers['content-disposition'], undefined, `${metodo} ${id}`);
      assert.ok(!r.texto.includes('-falso') && !r.texto.includes(arquivo), `${metodo} ${id}`);
    }
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
    usuario: 'admin', nome: 'Administrador', empresa: 'BAP AUTOPARTS', admin: true, estoque: true, temLogo: false,
    trocarSenha: true, expiraEm: new Date(s.rel.t + SESSAO_MS).toISOString(),
  });
  assert.deepEqual(Object.keys(eu.json), ['usuario', 'nome', 'empresa', 'admin', 'estoque', 'temLogo', 'trocarSenha', 'expiraEm']);

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

test('usuário comum: 404 nas rotas de admin; o admin baixa os arquivos da lista', async () => {
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
      assert.equal(r.headers['content-disposition'], undefined, `${metodo} ${caminho}`);
      assert.ok(!r.texto.includes('-falso') && !LISTA.some(([, a]) => r.texto.includes(a)), 'vazou para o comum: ' + caminho);
    }
  }
  for (const [caminho, metodo, corpo] of [
    ['/api/usuarios', 'GET'], ['/api/usuarios', 'POST', { usuario: 'intruso', nome: 'X', senha: falsa('99') }],
    ['/api/usuarios/admin', 'PATCH', { nome: 'X' }], ['/api/usuarios/admin/senha', 'POST', { senha: falsa('99') }],
    ['/api/usuarios/loja.exemplo/logo', 'PUT', PNG], ['/api/usuarios/loja.exemplo/logo', 'GET'], ['/api/pdfs', 'GET'],
  ]) {
    const r = await s.pedir(caminho, { metodo, cookie: cli, corpo, headers: Buffer.isBuffer(corpo) ? { 'Content-Type': 'image/png' } : {} });
    assert.equal(r.status, 404, `${metodo} ${caminho}`);
    assert.ok(!LISTA.some(([id, a]) => r.texto.includes(id) || r.texto.includes(a)), 'vazou para o comum: ' + caminho);
  }
  assert.equal((await s.pedir('/api/usuarios', { cookie: adm })).json.length, 2, 'ninguém foi criado pelo comum');

  // Admin.
  assert.equal((await s.pedir('/admin/usuarios', { cookie: adm, accept: 'text/html' })).status, 200);
  assert.equal((await s.pedir('/admin/pdfs', { cookie: adm, accept: 'text/html' })).status, 200);
  const lista = await s.pedir('/api/pdfs', { cookie: adm });
  assert.equal(lista.status, 200);
  // Contrato com o web-site (T-0024, T-0032): os itens da LISTA, na ordem dela, com estes campos e só estes.
  assert.deepEqual(lista.json.map((x) => [x.id, x.arquivo, x.tamanho, x.tipo, x.grupo, x.par, x.titulo]),
    LISTA.map(([id, arquivo, conteudo, tipo, grupo, par, titulo]) => [id, arquivo, conteudo.length, tipo, grupo, par, titulo]));
  for (const x of lista.json) {
    assert.deepEqual(Object.keys(x).sort(), ['arquivo', 'data', 'grupo', 'id', 'par', 'tamanho', 'tipo', 'titulo']);
    assert.ok(!Number.isNaN(Date.parse(x.data)));
  }
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
    assert.equal(h.headers['content-disposition'], b.headers['content-disposition'], 'HEAD ' + id);
    assert.equal(h.headers['cache-control'], 'private, no-store', 'HEAD ' + id);
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
    assert.deepEqual([x.tipo, x.grupo, x.par], LISTA.find(([i]) => i === id).slice(3, 6), id);
    const r = await s.pedir('/admin/pdfs/baixar/' + id, { cookie: adm });
    assert.equal(r.status, 404, id);
    assert.ok(!r.texto.includes(XLSX), id);
  }
  assert.equal((await s.pedir('/admin/pdfs/baixar/completo-digital', { cookie: adm })).texto, '%PDF-2028');

  // Pasta inexistente: todos seguem na lista, em falta.
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
    // [SUPOSIÇÃO] os da T-0032 chegam ao main num PR à parte do catalogo-grafico: até lá, em falta (null e 404).
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
  assert.deepEqual(c.json, { usuario: 'oficina_1', nome: 'João Exemplo', empresa: 'Oficina Exemplo', admin: false, estoque: false, ativo: true, temLogo: false, trocarSenha: true, ultimoAcesso: null });
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

// ---------- aba Estoque (T-0034): xlsx SINTÉTICO, montado aqui, com valores fictícios ----------
// Nada aqui é dado da BAP. Os campos internos (custo, preço, markup, tabela, sucata, origem) levam marcas
// fáceis de achar ("SECRET", 91xx, 92xx...): a resposta ao vendedor não pode ter nenhuma delas.
const CAB_ESTOQUE = ['DATA', 'HORA', 'CIDADE', 'FILIAL_BAP', 'ID_PRODUTO', 'COD_FORNECEDOR', 'FORNECEDOR', 'COD_PRODUTO',
  'DESCRICAO_PRODUTO', 'ESTOQUE', 'FILIAL_CD', 'PPEDIDO', 'ORIGEM_CUSTO', 'TABELA_CAPITAL', 'PRECO_CAPITAL', 'TABELA_INTERIOR',
  'PRECO_INTERIOR', 'MARKUP_CAPITAL', 'MARKUP_INTERIOR', 'CATEGORIA', 'SISTEMA', 'FAMILIA', 'LINHA', 'SUCATA', 'CUSTO_TOTAL'];
const FILIAIS_FICT = [['MANAUS', '90000002'], ['MATOGROSSO', '90000001'], ['SÃO LUIS', '90000006'], ['BELÉM', '90000005']];
const N_ESTOQUE = 260;
// Série do Excel para 01/01/2000 08:00 (fictícia) (a data entra como número, a hora como fração: o leitor converte).
const SERIE_DATA = Date.UTC(2000, 0, 1) / 86400000 + 25569;
const SERIE_HORA = (8 * 60) / 1440;
// Classificação fictícia (T-0035), pela linha (i % 10): três categorias; ELÉTRICO e SENSOR aparecem em duas
// categorias (a cascata não pode misturar); "Motor Ficticio" é a mesma categoria com outra caixa e sem acento; 0 = vazio.
const CLASSES_FICT = [
  [null, null, null],
  ['MOTOR FICTÍCIO', 'ARREFECIMENTO', "BOMBA D'ÁGUA"],
  ['MOTOR FICTÍCIO', 'ARREFECIMENTO', 'RADIADOR'],
  ['MOTOR FICTÍCIO', 'LUBRIFICAÇÃO', 'FILTRO'],
  ['Motor Ficticio', 'ELÉTRICO', 'SENSOR'],
  ['FREIO FICTÍCIO', 'HIDRÁULICO', 'CILINDRO'],
  ['FREIO FICTÍCIO', 'ELÉTRICO', 'SENSOR'],
  ['FREIO FICTÍCIO', 'ELÉTRICO', 'CHICOTE'],
  ['SUSPENSÃO FICTÍCIA', 'DIANTEIRA', 'AMORTECEDOR'],
  ['SUSPENSÃO FICTÍCIA', 'TRASEIRA', 'AMORTECEDOR'],
];
function linhaFicticia(i) {
  const [cidade, filial] = FILIAIS_FICT[i % 4];
  const n = String(i).padStart(4, '0');
  return {
    DATA: SERIE_DATA, HORA: SERIE_HORA, CIDADE: cidade, FILIAL_BAP: filial, ID_PRODUTO: `IDFICT${n}`, COD_FORNECEDOR: `CF${n}`,
    FORNECEDOR: i % 2 ? 'FORNECEDOR ALFA' : 'FORNECEDOR BETA', COD_PRODUTO: `FICT-${n}`,
    DESCRICAO_PRODUTO: i % 3 ? `PEÇA FICTÍCIA ${n} ROLAMENTO` : `ÓLEO FICTÍCIO ${n} 5W30`,
    ESTOQUE: i % 7 === 0 ? null : i % 5 === 0 ? 0 : i, FILIAL_CD: String(i % 4),
    PPEDIDO: 9101 + i / 100, ORIGEM_CUSTO: 'ORIGEM-SECRET', TABELA_CAPITAL: 'TABCAP-SECRET', PRECO_CAPITAL: 9201 + i / 100,
    TABELA_INTERIOR: 'TABINT-SECRET', PRECO_INTERIOR: 9301 + i / 100, MARKUP_CAPITAL: 94.0123, MARKUP_INTERIOR: 95.0123,
    CATEGORIA: CLASSES_FICT[i % 10][0], SISTEMA: CLASSES_FICT[i % 10][1], FAMILIA: CLASSES_FICT[i % 10][2], LINHA: 'LEVE',
    SUCATA: 9601 + i / 100, CUSTO_TOTAL: 9701 + i / 100,
  };
}
const LINHAS_FICT = Array.from({ length: N_ESTOQUE }, (_, i) => linhaFicticia(i + 1));
const MARCAS_INTERNAS = ['SECRET', '9101', '9201', '9301', '94.01', '95.01', '9601', '9701'];
const CHAVES_INTERNAS = /PPEDIDO|CUSTO|PRECO|PREÇO|MARKUP|TABELA|SUCATA|ORIGEM/i;

// O xlsx sintético vem de xlsx-ficticio.mjs (o mesmo do testes/estoque-t0034.mjs, RD-0593).
// Texto em sharedStrings; a descrição em inlineStr (os dois jeitos do Excel); vazio: célula autofechada.
const xlsxEstoque = (linhas = LINHAS_FICT) => xlsxFicticio(CAB_ESTOQUE, linhas, { inline: ['DESCRICAO_PRODUTO'] });

// Fonte local (127.0.0.1): /ESTOQUE_BAP.xlsx responde o xlsx fictício, /quebrado.xlsx bytes sem sentido, o resto 404.
let FONTE;
before(async () => {
  const xlsx = xlsxEstoque();
  // Zip-bomba: duas partes, cada uma ABAIXO do limite, que juntas passam do limite TOTAL de descompressão.
  const metade = Buffer.alloc(Math.ceil(DESCOMPACTADO_MAX / 2) + 1024, 0x20);
  const bomba = zipar({
    'xl/workbook.xml': '<workbook/>',
    'xl/sharedStrings.xml': Buffer.concat([Buffer.from('<sst>'), metade, Buffer.from('</sst>')]),
    'xl/worksheets/sheet1.xml': Buffer.concat([Buffer.from('<worksheet><sheetData>'), metade, Buffer.from('</sheetData></worksheet>')]),
  });
  const MB = Buffer.alloc(1024 * 1024, 0x41);
  const srv = http.createServer((req, res) => {
    res.on('error', () => {});
    if (req.url === '/ESTOQUE_BAP.xlsx') return res.writeHead(200, { 'Content-Length': xlsx.length }).end(xlsx);
    if (req.url === '/bomba.xlsx') return res.writeHead(200, { 'Content-Length': bomba.length }).end(bomba);
    // Sem Content-Length (chunked), 51 MB: o serviço tem de parar ao passar de 50 MB.
    if (req.url === '/sem-tamanho.xlsx') {
      res.writeHead(200);
      let n = 0;
      const mandar = () => { while (n < 51 && !res.destroyed) { n++; if (!res.write(MB)) return res.once('drain', mandar); } if (!res.destroyed) res.end(); };
      req.socket.on('close', () => { n = 99; });
      return mandar();
    }
    if (req.url === '/quebrado.xlsx') return res.writeHead(200).end('isto-nao-e-um-zip');
    res.writeHead(404).end();
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  vivos.push(srv);
  FONTE = `http://127.0.0.1:${srv.address().port}`;
});
async function comEstoque(extra = {}) {
  const s = await subir({ estoqueUrl: `${FONTE}/ESTOQUE_BAP.xlsx`, ...extra });
  const adm = await adminPronto(s);
  const vend = await clientePronto(s, adm, 'vend.exemplo');
  const pat = await s.pedir('/api/usuarios/vend.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { estoque: true } });
  assert.equal(pat.status, 200);
  assert.equal(pat.json.estoque, true);
  const cli = await clientePronto(s, adm, 'loja.exemplo');
  return { s, adm, vend, cli };
}
// Todas as chaves de um JSON, em qualquer profundidade.
const chavesDe = (v, acc = []) => {
  if (Array.isArray(v)) v.forEach((x) => chavesDe(x, acc));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { acc.push(k); chavesDe(x, acc); }
  return acc;
};

test('leitor de xlsx: sharedStrings, inlineStr, número, célula vazia e data/hora do Excel (T-0034)', () => {
  const t = lerXlsx(xlsxEstoque(LINHAS_FICT.slice(0, 3)));
  assert.equal(t.length, 4);
  assert.deepEqual(t[0], CAB_ESTOQUE);
  assert.equal(t[1][2], 'MATOGROSSO');
  assert.equal(t[1][8], 'PEÇA FICTÍCIA 0001 ROLAMENTO');
  assert.equal(t[1][9], 1);
  assert.equal(t[1][0], SERIE_DATA);
  assert.throws(() => lerXlsx(Buffer.from('isto-nao-e-um-zip')));
  // A aba é achada pelo workbook.xml e pelo .rels, mesmo com outro nome de arquivo.
  const outra = lerXlsx(zipar({
    'xl/workbook.xml': '<workbook xmlns:r="r"><sheets><sheet name="X" sheetId="1" r:id="rId7"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId7" Target="worksheets/aba.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>ERRADA</t></is></c></row></sheetData></worksheet>',
    'xl/worksheets/aba.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>CERTA &amp; ok</t></is></c></row></sheetData></worksheet>',
  }));
  assert.deepEqual(outra, [['CERTA & ok']]);
});

test('permissão do estoque: admin sempre; os outros pelo campo; antigo sem o campo = false, menos o bap.vendedor (T-0034)', () => {
  assert.equal(podeVerEstoque('admin', { admin: true }), true);
  assert.equal(podeVerEstoque('admin', { admin: true, estoque: false }), true);
  assert.equal(podeVerEstoque('loja.exemplo', { admin: false }), false);
  assert.equal(podeVerEstoque('loja.exemplo', { admin: false, estoque: true }), true);
  assert.equal(podeVerEstoque('bap.vendedor', { admin: false }), true);
  assert.equal(podeVerEstoque('bap.vendedor', { admin: false, estoque: false }), false);
  assert.equal(podeVerEstoque('x', null), false);
});

test('estoque: cliente sem a permissão recebe 404 na página e na API; sem sessão, como as outras (T-0034)', async () => {
  const { s, cli, vend } = await comEstoque();
  for (const rota of ['/estoque', '/estoque/', '/estoque/index.html', '/estoque/estoque.js']) {
    const p = await s.pedir(rota, { cookie: cli, accept: 'text/html' });
    assert.equal(p.status, 404, rota);
    assert.match(p.texto, /Não encontrado\./);
    assert.ok(!p.texto.includes('estoque'), 'o 404 não mostra a página: ' + rota);
  }
  const api = await s.pedir('/api/estoque', { cookie: cli });
  assert.equal(api.status, 404);
  assert.deepEqual(api.json, { erro: 'Não encontrado.' });
  assert.equal((await s.pedir('/api/estoque?q=FICT', { cookie: cli })).texto.includes('FICT-'), false);
  // Sem sessão: a página leva ao /entrar (com a volta); a API dá 401.
  const semP = await s.pedir('/estoque', { accept: 'text/html' });
  assert.equal(semP.status, 302);
  assert.equal(semP.headers.location, '/entrar?volta=%2Festoque');
  assert.equal((await s.pedir('/api/estoque')).status, 401);
  // Com a permissão: a página abre, sem cache.
  for (const rota of ['/estoque', '/estoque/']) {
    const ok = await s.pedir(rota, { cookie: vend, accept: 'text/html' });
    assert.equal(ok.status, 200, rota);
    assert.match(ok.texto, /<title>estoque<\/title>/);
    assert.equal(ok.headers['cache-control'], 'no-store');
  }
});

test('estoque: o vendedor recebe só a lista branca; nenhuma chave nem valor de custo, preço, markup, tabela, sucata ou origem (T-0034)', async () => {
  const { s, vend } = await comEstoque();
  for (const q of ['', '?limite=200', '?limite=200&desde=200', '?q=secret', '?q=9101', '?com_estoque=1&limite=200',
    '?categoria=freio%20ficticio&sistema=eletrico&familia=sensor&limite=200', '?categoria=MOTOR%20FICT%C3%8DCIO&sistema=HIDRAULICO']) {
    const r = await s.pedir('/api/estoque' + q, { cookie: vend });
    assert.equal(r.status, 200, q);
    assert.equal(r.headers['cache-control'], 'no-store');
    assert.deepEqual(r.json.colunas.map((c) => c.campo), ['CIDADE', 'FILIAL_BAP', 'COD_PRODUTO', 'DESCRICAO_PRODUTO', 'FORNECEDOR', 'ESTOQUE']);
    assert.deepEqual(r.json.colunas.map((c) => c.rotulo), ['Filial', 'Nº filial', 'Código', 'Descrição', 'Fornecedor', 'Estoque']);
    // A resposta inteira: nenhuma chave interna, em nenhum nível; nenhum valor interno, em nenhum lugar.
    const chaves = chavesDe(r.json);
    assert.deepEqual(chaves.filter((k) => CHAVES_INTERNAS.test(k)), [], q);
    for (const c of r.json.colunas) assert.ok(!CHAVES_INTERNAS.test(c.campo) && !CHAVES_INTERNAS.test(c.rotulo), c.campo);
    for (const m of MARCAS_INTERNAS) assert.ok(!r.texto.includes(m), `vazou ${m} em ${q}`);
    for (const l of r.json.linhas) assert.deepEqual(Object.keys(l), ['CIDADE', 'FILIAL_BAP', 'COD_PRODUTO', 'DESCRICAO_PRODUTO', 'FORNECEDOR', 'ESTOQUE']);
    assert.deepEqual(Object.keys(r.json).sort(), ['colunas', 'desde', 'filiais', 'limite', 'linhas', 'opcoes', 'posicao', 'total']);
    // As opções (T-0035) são só nomes de classificação: listas de texto, sem nenhum valor interno.
    assert.deepEqual(Object.keys(r.json.opcoes), ['categorias', 'sistemas', 'familias']);
    for (const lista of Object.values(r.json.opcoes)) assert.ok(lista.every((x) => typeof x === 'string'));
  }
  // "secret" e "9101" estão só nos campos internos: a busca do vendedor não acha nada por eles.
  assert.equal((await s.pedir('/api/estoque?q=secret', { cookie: vend })).json.total, 0);
  assert.equal((await s.pedir('/api/estoque?q=9101', { cookie: vend })).json.total, 0);
});

test('estoque: o admin recebe as 23 colunas na ordem, com os valores crus (T-0034)', async () => {
  const { s, adm } = await comEstoque();
  const r = await s.pedir('/api/estoque?limite=1', { cookie: adm });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.colunas.map((c) => c.campo), [
    'CIDADE', 'FILIAL_BAP', 'COD_PRODUTO', 'DESCRICAO_PRODUTO', 'ESTOQUE', 'PPEDIDO', 'CUSTO_TOTAL', 'PRECO_CAPITAL', 'PRECO_INTERIOR',
    'MARKUP_CAPITAL', 'MARKUP_INTERIOR', 'FORNECEDOR', 'TABELA_CAPITAL', 'TABELA_INTERIOR', 'SUCATA', 'ORIGEM_CUSTO',
    'ID_PRODUTO', 'COD_FORNECEDOR', 'FILIAL_CD', 'CATEGORIA', 'SISTEMA', 'FAMILIA', 'LINHA']);
  assert.equal(r.json.colunas.length, 23);
  assert.deepEqual(r.json.colunas.slice(0, 11).map((c) => c.rotulo), ['Filial', 'Nº filial', 'Código', 'Descrição', 'Estoque',
    'Custo do produto', 'Custo total', 'Preço capital', 'Preço interior', 'Markup capital', 'Markup interior']);
  assert.deepEqual(Object.fromEntries(r.json.colunas.map((c) => [c.campo, c.tipo])), {
    CIDADE: 'texto', FILIAL_BAP: 'texto', COD_PRODUTO: 'texto', DESCRICAO_PRODUTO: 'texto', ESTOQUE: 'numero', PPEDIDO: 'dinheiro',
    CUSTO_TOTAL: 'dinheiro', PRECO_CAPITAL: 'dinheiro', PRECO_INTERIOR: 'dinheiro', MARKUP_CAPITAL: 'markup', MARKUP_INTERIOR: 'markup',
    FORNECEDOR: 'texto', TABELA_CAPITAL: 'texto', TABELA_INTERIOR: 'texto', SUCATA: 'dinheiro', ORIGEM_CUSTO: 'texto',
    ID_PRODUTO: 'texto', COD_FORNECEDOR: 'texto', FILIAL_CD: 'texto', CATEGORIA: 'texto', SISTEMA: 'texto', FAMILIA: 'texto', LINHA: 'texto',
  });
  assert.ok(!r.json.colunas.some((c) => c.campo === 'DATA' || c.campo === 'HORA'));
  const l = r.json.linhas[0];
  assert.deepEqual(Object.keys(l), r.json.colunas.map((c) => c.campo));
  assert.equal(l.CIDADE, 'Mato Grosso');
  assert.equal(l.FILIAL_BAP, '90000001');
  assert.equal(l.COD_PRODUTO, 'FICT-0001');
  assert.equal(l.ESTOQUE, 1);
  assert.equal(l.PPEDIDO, 9101.01);
  assert.equal(l.MARKUP_CAPITAL, 94.0123);
  assert.equal(typeof l.PRECO_CAPITAL, 'number');
  assert.deepEqual(r.json.posicao, { data: '01/01/2000', hora: '08:00' });
  assert.equal(r.json.total, N_ESTOQUE);
  assert.deepEqual(r.json.filiais, [
    { numero: '90000005', nome: 'Belém' }, { numero: '90000002', nome: 'Manaus' },
    { numero: '90000001', nome: 'Mato Grosso' }, { numero: '90000006', nome: 'São Luís' }]);
});

test('estoque: busca palavra por palavra, filial, com_estoque e paginação (T-0034)', async () => {
  const { s, vend } = await comEstoque();
  const q = async (qs) => (await s.pedir('/api/estoque?' + qs, { cookie: vend })).json;
  const porFilial = (f) => LINHAS_FICT.filter((l) => l.FILIAL_BAP === f).length;
  // Sem acento e sem caixa; "matogrosso" e "mato grosso" acham os dois jeitos.
  assert.equal((await q('q=matogrosso')).total, porFilial('90000001'));
  assert.equal((await q('q=Mato%20Grosso')).total, porFilial('90000001'));
  assert.equal((await q('q=sao%20luis')).total, porFilial('90000006'));
  assert.equal((await q('q=BELEM')).total, porFilial('90000005'));
  assert.equal((await q('q=90000002')).total, porFilial('90000002'));
  // Código, código do fornecedor, ID, descrição e fornecedor.
  assert.equal((await q('q=fict-0042')).linhas[0].COD_PRODUTO, 'FICT-0042');
  assert.equal((await q('q=cf0042')).total, 1);
  assert.equal((await q('q=idfict0042')).total, 1);
  const oleo = LINHAS_FICT.filter((l) => l.DESCRICAO_PRODUTO.startsWith('ÓLEO')).length;
  assert.equal((await q('q=oleo')).total, oleo);
  assert.equal((await q('q=oleo%20alfa')).total, LINHAS_FICT.filter((l) => l.DESCRICAO_PRODUTO.startsWith('ÓLEO') && l.FORNECEDOR.endsWith('ALFA')).length);
  assert.equal((await q('q=oleo%20rolamento')).total, 0, 'todas as palavras');
  // Filial (número) e com_estoque (esconde 0 e vazio).
  const f = await q('filial=90000006&limite=200');
  assert.equal(f.total, porFilial('90000006'));
  assert.ok(f.linhas.every((l) => l.FILIAL_BAP === '90000006' && l.CIDADE === 'São Luís'));
  assert.equal((await q('filial=99999999')).total, 0);
  const com = await q('com_estoque=1&limite=200');
  assert.equal(com.total, LINHAS_FICT.filter((l) => l.ESTOQUE).length);
  assert.ok(com.linhas.every((l) => typeof l.ESTOQUE === 'number' && l.ESTOQUE !== 0));
  assert.ok((await q('limite=200')).linhas.some((l) => l.ESTOQUE === null), 'sem o filtro, o vazio vem como null');
  assert.equal((await q('filial=90000002&com_estoque=1&q=rolamento')).total,
    LINHAS_FICT.filter((l) => l.FILIAL_BAP === '90000002' && l.ESTOQUE && l.DESCRICAO_PRODUTO.includes('ROLAMENTO')).length);
  // Paginação: 50 por padrão, no máximo 200; desde segue a ordem da planilha.
  const p1 = await q('');
  assert.equal(p1.limite, 50); assert.equal(p1.desde, 0); assert.equal(p1.linhas.length, 50); assert.equal(p1.total, N_ESTOQUE);
  const p2 = await q('desde=50');
  assert.equal(p2.linhas[0].COD_PRODUTO, 'FICT-0051');
  const grande = await q('limite=5000');
  assert.equal(grande.limite, 200); assert.equal(grande.linhas.length, 200);
  const fim = await q('desde=250&limite=50');
  assert.equal(fim.linhas.length, N_ESTOQUE - 250);
  assert.equal((await q('desde=9999')).linhas.length, 0);
  for (const ruim of ['limite=-3', 'limite=abc', 'desde=-1', 'limite=0']) {
    const r = await q(ruim);
    assert.ok(r.limite >= 1 && r.limite <= 200 && r.desde >= 0, ruim);
  }
  // Só GET.
  const post = await s.pedir('/api/estoque', { metodo: 'POST', cookie: vend, corpo: {} });
  assert.equal(post.status, 405);
});

test('estoque: filtros Categoria, Sistema e Família, em cascata, somados à busca, à filial e ao com_estoque (T-0035)', async () => {
  const { s, vend, adm } = await comEstoque();
  const q = async (qs, cookie = vend) => (await s.pedir('/api/estoque?' + qs, { cookie })).json;
  const norm = (x) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const conta = (f) => LINHAS_FICT.filter(f).length;
  const de = (l, cat, sis, fam) => (!cat || norm(l.CATEGORIA) === norm(cat)) && (!sis || norm(l.SISTEMA) === norm(sis))
    && (!fam || norm(l.FAMILIA) === norm(fam));
  const enc = encodeURIComponent;
  const CATS = ['FREIO FICTÍCIO', 'MOTOR FICTÍCIO', 'SUSPENSÃO FICTÍCIA'];
  const SISTEMAS = ['ARREFECIMENTO', 'DIANTEIRA', 'ELÉTRICO', 'HIDRÁULICO', 'LUBRIFICAÇÃO', 'TRASEIRA'];
  const FAMILIAS = ['AMORTECEDOR', "BOMBA D'ÁGUA", 'CHICOTE', 'CILINDRO', 'FILTRO', 'RADIADOR', 'SENSOR'];

  // Sem filtro: todas as opções, em ordem, sem vazio e sem repetição ("Motor Ficticio" é a mesma de "MOTOR FICTÍCIO").
  const todas = await q('');
  assert.deepEqual(todas.opcoes, { categorias: CATS, sistemas: SISTEMAS, familias: FAMILIAS });
  assert.equal(todas.total, N_ESTOQUE);
  // O admin recebe as mesmas opções; as colunas dele seguem as 23.
  const a = await q('categoria=' + enc('FREIO FICTÍCIO') + '&limite=200', adm);
  assert.equal(a.colunas.length, 23);
  assert.deepEqual(a.opcoes.sistemas, ['ELÉTRICO', 'HIDRÁULICO']);
  assert.ok(a.linhas.length > 0 && a.linhas.every((l) => l.CATEGORIA === 'FREIO FICTÍCIO'));

  // Cada filtro sozinho (texto exato da opção; sem caixa e sem acento também vale).
  for (const [qs, f] of [
    ['categoria=' + enc('MOTOR FICTÍCIO'), (l) => de(l, 'MOTOR FICTÍCIO')],
    ['categoria=motor%20ficticio', (l) => de(l, 'MOTOR FICTÍCIO')],
    ['sistema=' + enc('ELÉTRICO'), (l) => de(l, null, 'ELÉTRICO')],
    ['sistema=eletrico', (l) => de(l, null, 'ELÉTRICO')],
    ['familia=AMORTECEDOR', (l) => de(l, null, null, 'AMORTECEDOR')],
    ['familia=' + enc("bomba d'agua"), (l) => de(l, null, null, "BOMBA D'ÁGUA")],
  ]) {
    const r = await q(qs + '&limite=200');
    assert.equal(r.total, conta(f), qs);
    assert.ok(r.total > 0 && r.total < N_ESTOQUE, qs);
    assert.ok(r.linhas.every((l) => Object.keys(l).length === 6), 'o vendedor segue com as 6 colunas: ' + qs);
  }
  // A categoria pega também as linhas com outra caixa e sem acento ("Motor Ficticio").
  assert.ok(conta((l) => l.CATEGORIA === 'Motor Ficticio') > 0);
  assert.equal((await q('categoria=' + enc('MOTOR FICTÍCIO'))).total,
    conta((l) => l.CATEGORIA === 'MOTOR FICTÍCIO' || l.CATEGORIA === 'Motor Ficticio'));

  // Cascata: as opções mudam conforme a escolha.
  const motor = await q('categoria=' + enc('MOTOR FICTÍCIO'));
  assert.deepEqual(motor.opcoes, { categorias: CATS, sistemas: ['ARREFECIMENTO', 'ELÉTRICO', 'LUBRIFICAÇÃO'],
    familias: ["BOMBA D'ÁGUA", 'FILTRO', 'RADIADOR', 'SENSOR'] });
  const freioEl = await q('categoria=' + enc('FREIO FICTÍCIO') + '&sistema=' + enc('ELÉTRICO'));
  assert.deepEqual(freioEl.opcoes, { categorias: CATS, sistemas: ['ELÉTRICO', 'HIDRÁULICO'], familias: ['CHICOTE', 'SENSOR'] });
  assert.equal(freioEl.total, conta((l) => de(l, 'FREIO FICTÍCIO', 'ELÉTRICO')));
  // Só o sistema: as famílias dele em todas as categorias; os sistemas seguem todos.
  const el = await q('sistema=' + enc('ELÉTRICO'));
  assert.deepEqual(el.opcoes, { categorias: CATS, sistemas: SISTEMAS, familias: ['CHICOTE', 'SENSOR'] });
  // Os três: o SENSOR de FREIO/ELÉTRICO não traz o SENSOR de MOTOR/ELÉTRICO.
  const sensor = await q('categoria=' + enc('FREIO FICTÍCIO') + '&sistema=' + enc('ELÉTRICO') + '&familia=SENSOR&limite=200');
  assert.equal(sensor.total, conta((l) => de(l, 'FREIO FICTÍCIO', 'ELÉTRICO', 'SENSOR')));
  assert.ok(sensor.total > 0 && sensor.total < conta((l) => de(l, null, 'ELÉTRICO', 'SENSOR')));
  assert.deepEqual(sensor.opcoes, freioEl.opcoes, 'a família escolhida não estreita a própria lista');

  // As opções vêm da planilha inteira: a busca, a filial e o com_estoque não mudam as listas.
  for (const extra of ['q=FICT-0001', 'filial=90000006', 'com_estoque=1', 'q=nada-acha-isto']) {
    assert.deepEqual((await q(extra + '&categoria=' + enc('MOTOR FICTÍCIO'))).opcoes, motor.opcoes, extra);
  }

  // Somados com a busca, a filial e o com_estoque (e a paginação).
  const soma = await q('categoria=' + enc('SUSPENSÃO FICTÍCIA') + '&familia=AMORTECEDOR&filial=90000002&com_estoque=1&q=rolamento&limite=200');
  const esperado = LINHAS_FICT.filter((l) => de(l, 'SUSPENSÃO FICTÍCIA', null, 'AMORTECEDOR') && l.FILIAL_BAP === '90000002' && l.ESTOQUE
    && l.DESCRICAO_PRODUTO.includes('ROLAMENTO'));
  assert.ok(esperado.length > 0);
  assert.equal(soma.total, esperado.length);
  assert.deepEqual(soma.linhas.map((l) => l.COD_PRODUTO), esperado.map((l) => l.COD_PRODUTO));
  const pag = await q('categoria=' + enc('MOTOR FICTÍCIO') + '&limite=10&desde=10');
  const todosMotor = LINHAS_FICT.filter((l) => de(l, 'MOTOR FICTÍCIO'));
  assert.equal(pag.total, todosMotor.length);
  assert.deepEqual(pag.linhas.map((l) => l.COD_PRODUTO), todosMotor.slice(10, 20).map((l) => l.COD_PRODUTO));

  // Incoerente: ignorado junto com os níveis abaixo; as opções vêm coerentes com o que valeu.
  const r1 = await q('categoria=' + enc('MOTOR FICTÍCIO') + '&sistema=' + enc('HIDRÁULICO') + '&familia=CILINDRO');
  assert.equal(r1.total, todosMotor.length, 'vale só a categoria');
  assert.deepEqual(r1.opcoes, motor.opcoes);
  const r2 = await q('categoria=INEXISTENTE&sistema=' + enc('ELÉTRICO'));
  assert.equal(r2.total, N_ESTOQUE, 'categoria que não existe: nada filtra');
  assert.deepEqual(r2.opcoes, todas.opcoes);
  const r3 = await q('categoria=' + enc('FREIO FICTÍCIO') + '&sistema=' + enc('ELÉTRICO') + '&familia=AMORTECEDOR');
  assert.equal(r3.total, freioEl.total, 'família de outra categoria: valem a categoria e o sistema');
  assert.deepEqual(r3.opcoes, freioEl.opcoes);
  // Vazio = Todas; espaço em volta não atrapalha.
  assert.equal((await q('categoria=&sistema=&familia=')).total, N_ESTOQUE);
  assert.equal((await q('familia=%20amortecedor%20')).total, conta((l) => de(l, null, null, 'AMORTECEDOR')));
});

test('estoque: falha no download (404, arquivo quebrado ou sem fonte) dá 503 só na aba; o catálogo segue (T-0034)', async () => {
  for (const estoqueUrl of [`${FONTE}/falta.xlsx`, `${FONTE}/quebrado.xlsx`, null]) {
    const s = await subir({ estoqueUrl });
    const adm = await adminPronto(s);
    const r = await s.pedir('/api/estoque', { cookie: adm });
    assert.equal(r.status, 503, String(estoqueUrl));
    assert.deepEqual(r.json, { erro: 'Estoque indisponível no momento.' });
    assert.equal(r.headers['cache-control'], 'no-store');
    assert.equal((await s.pedir('/', { cookie: adm, accept: 'text/html' })).status, 200, 'o catálogo segue no ar');
    assert.equal((await s.pedir('/saude')).status, 200);
    assert.ok(s.logs.includes('estoque indisponivel'));
    assert.ok(!s.logs.join('\n').includes('127.0.0.1'), 'o log não leva a fonte');
  }
  const ok = await subir({ estoqueUrl: `${FONTE}/ESTOQUE_BAP.xlsx` });
  assert.ok(ok.logs.some((m) => new RegExp(`^estoque ok ${N_ESTOQUE} linhas \\d+ms$`).test(m)));
});

test('estoque: /api/eu e /api/usuarios mostram o campo; só o admin muda; usuário antigo sem o campo (T-0034)', async () => {
  const { s, adm, vend, cli } = await comEstoque();
  assert.equal((await s.pedir('/api/eu', { cookie: adm })).json.estoque, true);
  assert.equal((await s.pedir('/api/eu', { cookie: vend })).json.estoque, true);
  assert.equal((await s.pedir('/api/eu', { cookie: cli })).json.estoque, false);
  const lista = (await s.pedir('/api/usuarios', { cookie: adm })).json;
  assert.deepEqual(lista.map((u) => [u.usuario, u.estoque]), [['admin', true], ['loja.exemplo', false], ['vend.exemplo', true]]);
  // Só o admin muda: o próprio vendedor (com a permissão) e o cliente recebem 404.
  for (const c of [vend, cli]) {
    const r = await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: c, corpo: { estoque: true } });
    assert.equal(r.status, 404);
  }
  assert.equal((await s.pedir('/api/eu', { cookie: cli })).json.estoque, false);
  // Valor que não é booleano: 400.
  for (const v of ['sim', 1, null]) {
    assert.equal((await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { estoque: v } })).status, 400);
  }
  // O admin dá e tira; vale no pedido seguinte, sem derrubar a sessão.
  assert.equal((await s.pedir('/api/usuarios/loja.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { estoque: true } })).json.estoque, true);
  assert.equal((await s.pedir('/api/estoque', { cookie: cli })).status, 200);
  assert.equal((await s.pedir('/api/usuarios/vend.exemplo', { metodo: 'PATCH', cookie: adm, corpo: { estoque: false } })).json.estoque, false);
  assert.equal((await s.pedir('/api/estoque', { cookie: vend })).status, 404);
  assert.equal((await s.pedir('/estoque', { cookie: vend, accept: 'text/html' })).status, 404);
  assert.equal((await s.pedir('/api/eu', { cookie: vend })).json.estoque, false);
  // Criação com o campo (só o admin cria); valor errado: 400.
  const novo = await s.pedir('/api/usuarios', { metodo: 'POST', cookie: adm, corpo: { usuario: 'vend.dois', nome: 'Vendedor Exemplo', senha: falsa('vend-1'), estoque: true } });
  assert.equal(novo.status, 201);
  assert.equal(novo.json.estoque, true);
  assert.equal((await s.pedir('/api/usuarios', { metodo: 'POST', cookie: adm, corpo: { usuario: 'vend.tres', nome: 'X', senha: falsa('vend-1'), estoque: 'sim' } })).status, 400);
  assert.equal((await s.pedir('/api/usuarios', { metodo: 'POST', cookie: cli, corpo: { usuario: 'vend.quatro', nome: 'X', senha: falsa('vend-1'), estoque: true } })).status, 404);
  // Usuário antigo (usuarios.json sem o campo): false; o bap.vendedor sem o campo começa com true.
  const arq = path.join(s.dados, 'usuarios.json');
  const j = JSON.parse(fs.readFileSync(arq, 'utf8'));
  for (const u of j.usuarios) delete u.estoque;
  j.usuarios.push({ ...j.usuarios.find((u) => u.usuario === 'loja.exemplo'), usuario: 'bap.vendedor' });
  fs.writeFileSync(arq, JSON.stringify(j));
  const s2 = await subir({ dados: s.dados });
  const l2 = (await s2.pedir('/api/usuarios', { cookie: adm })).json;
  assert.deepEqual(l2.map((u) => [u.usuario, u.estoque]),
    [['admin', true], ['bap.vendedor', true], ['loja.exemplo', false], ['vend.dois', false], ['vend.exemplo', false]]);
  // O admin pode tirar a permissão do bap.vendedor: o campo gravado (false) passa a valer.
  assert.equal((await s2.pedir('/api/usuarios/bap.vendedor', { metodo: 'PATCH', cookie: adm, corpo: { estoque: false } })).json.estoque, false);
});

test('estoque: limites contra planilha ruim (descompressão total, linhas, XML sem fechamento) (T-0034)', () => {
  // Limite TOTAL: duas partes de 600 KB passam de um limite de 1 MB, mesmo cada uma estando abaixo dele.
  const parte = Buffer.alloc(600 * 1024, 0x20);
  const duas = zipar({ 'xl/sharedStrings.xml': Buffer.concat([Buffer.from('<sst>'), parte, Buffer.from('</sst>')]),
    'xl/worksheets/sheet1.xml': Buffer.concat([Buffer.from('<worksheet><sheetData>'), parte, Buffer.from('</sheetData></worksheet>')]) });
  assert.throws(() => lerXlsx(duas, { descompactadoMax: 1024 * 1024 }));
  assert.doesNotThrow(() => lerXlsx(duas, { descompactadoMax: 2 * 1024 * 1024 }));
  // Teto de linhas (o padrão é 200 mil): 11 linhas com teto de 10 dão erro.
  assert.equal(LINHAS_MAX, 200000);
  const onze = xlsxEstoque(LINHAS_FICT.slice(0, 10));
  assert.throws(() => lerXlsx(onze, { linhasMax: 10 }));
  assert.equal(lerXlsx(onze, { linhasMax: 11 }).length, 11);
  // XML sem fechamento: erro rápido (varredura linear, sem retrocesso), nunca trava.
  const aberto = '<worksheet><sheetData>' + '<row r="1"><c r="A1" t="n"><v>1'.repeat(200000);
  const t0 = Date.now();
  assert.throws(() => lerXlsx(zipar({ 'xl/worksheets/sheet1.xml': aberto })));
  assert.ok(Date.now() - t0 < 2000, 'a leitura do XML sem fechamento demorou demais');
  // Coluna fora do limite do Excel: erro (não cria um array gigante).
  assert.throws(() => lerXlsx(zipar({ 'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="ZZZ1" t="n"><v>1</v></c></row></sheetData></worksheet>' })));
});

test('estoque: xlsx que estoura a descompressão total e resposta sem Content-Length acima do limite dão 503 só na aba (T-0034)', async () => {
  for (const rota of ['/bomba.xlsx', '/sem-tamanho.xlsx']) {
    const s = await subir({ estoqueUrl: FONTE + rota });
    const adm = await adminPronto(s);
    const r = await s.pedir('/api/estoque', { cookie: adm });
    assert.equal(r.status, 503, rota);
    assert.deepEqual(r.json, { erro: 'Estoque indisponível no momento.' });
    assert.equal((await s.pedir('/', { cookie: adm, accept: 'text/html' })).status, 200, 'o catálogo segue no ar: ' + rota);
    assert.ok(s.logs.includes('estoque indisponivel'), rota);
  }
});

test('estoque: contorno de caminho (codificado, "..", barra dupla ou invertida, byte nulo, maiúscula) sem a permissão dá 404 (T-0034)', async () => {
  const { s, cli, vend } = await comEstoque();
  const rotas = [
    '/%65stoque', '/%65stoque/', '/estoque%2f', '/estoque%2F', '/estoque%2findex.html', '//estoque', '//estoque/',
    '/x/../estoque', '/x/..%2festoque', '/%2e%2e/estoque', '/%2E%2E/estoque/', '/./estoque', '/.%2festoque', '/%2e/estoque',
    '/estoque/./index.html', '/estoque/../estoque/', '/estoque\\index.html', '/estoque%5cindex.html', '\\estoque',
    '/estoque%00', '/estoque/%00', '/estoque%00/index.html', '/Estoque', '/ESTOQUE', '/ESTOQUE/', '/Estoque/index.html',
    '/ESTOQUE/index.html', '/estoque/INDEX.HTML', '/EsToQuE/estoque.js', '/estoque/index.html?x=1', '/estoque#x',
  ];
  for (const rota of rotas) {
    for (const accept of ['text/html', 'application/json']) {
      let r;
      // Alvo que o HTTP não aceita (ex.: sem "/" no início): o Node fecha a conexão; também não serve nada.
      try { r = await s.pedir(rota, { cookie: cli, accept }); } catch (e) { assert.equal(e.code, 'ECONNRESET', rota); continue; }
      assert.ok([400, 404].includes(r.status), `${rota} (${accept}) deu ${r.status}`);
      assert.ok(!r.texto.includes('<title>estoque</title>') && !r.texto.includes('console.log("estoque")'), 'serviu a página: ' + rota);
    }
  }
  // O controle: com a permissão, o caminho normal abre.
  assert.equal((await s.pedir('/estoque', { cookie: vend, accept: 'text/html' })).status, 200);
});

// ---------- recarga diária do estoque (T-0036): relógio e setTimeout falsos, nada espera o relógio de verdade ----------
// Fonte local que troca de conteúdo: atual.corpo (Buffer) ou atual.status (404). Conta os pedidos.
async function fonteVariavel() {
  const atual = { corpo: null, status: 200, pedidos: 0, segurar: null };
  const srv = http.createServer(async (req, res) => {
    res.on('error', () => {});
    atual.pedidos++;
    if (atual.segurar) await atual.segurar;
    if (atual.status !== 200 || !atual.corpo) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Length': atual.corpo.length }).end(atual.corpo);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  vivos.push(srv);
  return { atual, url: `http://127.0.0.1:${srv.address().port}/ESTOQUE_BAP.xlsx` };
}
// Posição em texto (dd/mm/aaaa, hh:mm), como a BAP Central também pode mandar.
const xlsxPosicao = (data, hora, n) => xlsxEstoque(LINHAS_FICT.slice(0, n).map((l) => ({ ...l, DATA: data, HORA: hora })));
// setTimeout falso: guarda [função, ms] e devolve um objeto com unref() que registra a chamada.
function agendadorFalso() {
  const chamadas = [];
  const agendar = (fn, ms) => { const h = { fn, ms, unref() { h.solto = true; return h; } }; chamadas.push(h); return h; };
  return { chamadas, agendar, ultima: () => chamadas[chamadas.length - 1] };
}
const tique = () => new Promise((r) => setImmediate(r));

test('recarga: a próxima 06:00 de Manaus (antes e depois das 06:00, na hora exata, virada de dia, mês e ano) (T-0036)', () => {
  const Z = (...a) => Date.UTC(...a); // 06:00 em Manaus = 10:00 UTC
  assert.equal(proximaRecarga(Z(2026, 10, 25, 9, 30)), Z(2026, 10, 25, 10, 0), '05:30 -> hoje 06:00');
  assert.equal(proximaRecarga(Z(2026, 10, 25, 9, 59, 59, 999)), Z(2026, 10, 25, 10, 0));
  assert.equal(proximaRecarga(Z(2026, 10, 25, 10, 0)), Z(2026, 10, 26, 10, 0), 'na hora exata: amanhã');
  assert.equal(proximaRecarga(Z(2026, 10, 25, 11, 0)), Z(2026, 10, 26, 10, 0), '07:00 -> amanhã 06:00');
  // 21:00 de Manaus já é o dia seguinte em UTC: continua valendo o dia de Manaus.
  assert.equal(proximaRecarga(Z(2026, 10, 26, 1, 0)), Z(2026, 10, 26, 10, 0), '25/11 21:00 -> 26/11 06:00');
  assert.equal(proximaRecarga(Z(2026, 11, 1, 3, 30)), Z(2026, 11, 1, 10, 0), '30/11 23:30 -> 01/12 06:00');
  assert.equal(proximaRecarga(Z(2027, 0, 1, 2, 0)), Z(2027, 0, 1, 10, 0), '31/12 22:00 -> 01/01 06:00');
  assert.equal(proximaRecarga(Z(2026, 10, 25, 4, 0)), Z(2026, 10, 25, 10, 0), '25/11 00:00 -> 25/11 06:00');
});

test('recarga: agenda a 06:00, reagenda depois de cada tentativa (com sucesso ou não), solta o timer e para (T-0036)', async () => {
  const rel = { t: Date.UTC(2026, 10, 25, 12, 0) }; // 08:00 de Manaus
  const ag = agendadorFalso();
  let falhou = false;
  let chamadas = 0;
  const recarregar = async () => { chamadas++; if (chamadas === 2) throw new Error('x'); };
  const r = agendarRecarga({ recarregar, falhou: () => falhou, agora: () => rel.t, agendar: ag.agendar, cancelar: () => {} });
  await tique();
  assert.equal(ag.chamadas.length, 1);
  assert.equal(ag.ultima().ms, 22 * 3600000, '08:00 -> 06:00 do dia seguinte');
  assert.equal(ag.ultima().solto, true, 'unref() chamado');
  assert.equal(r.proxima(), Date.UTC(2026, 10, 26, 10, 0));
  // Dispara (um pouco antes da hora, como um timer pode fazer): recarrega e agenda a 06:00 SEGUINTE, não a mesma.
  rel.t = Date.UTC(2026, 10, 26, 9, 59, 59, 990);
  await ag.ultima().fn();
  assert.equal(chamadas, 1);
  assert.equal(r.proxima(), Date.UTC(2026, 10, 27, 10, 0));
  assert.equal(ag.chamadas.length, 2);
  // Recarga que rejeita: o agendamento segue.
  rel.t = Date.UTC(2026, 10, 27, 10, 0);
  await ag.ultima().fn();
  assert.equal(chamadas, 2);
  assert.equal(r.proxima(), Date.UTC(2026, 10, 28, 10, 0));
  // Aba em 503: nova tentativa em 1 h, até voltar.
  falhou = true;
  rel.t = Date.UTC(2026, 10, 28, 10, 0);
  await ag.ultima().fn();
  assert.equal(ag.ultima().ms, 3600000);
  falhou = false;
  rel.t += 3600000;
  await ag.ultima().fn();
  assert.equal(r.proxima(), Date.UTC(2026, 10, 29, 10, 0), 'voltou: só a 06:00');
  // parar(): cancela e não agenda mais.
  const antes = ag.chamadas.length;
  r.parar();
  await ag.ultima().fn();
  assert.equal(ag.chamadas.length, antes);
  assert.equal(r.proxima(), null);
});

test('recarga: com sucesso troca as linhas e a posição; com falha (404, quebrado, acima do limite, sem colunas, vazia) mantém a anterior (T-0036)', async () => {
  const { atual, url } = await fonteVariavel();
  atual.corpo = xlsxPosicao('24/11/2026', '06:00', 10);
  const logs = [];
  const est = criarEstoque({ url, log: (m) => logs.push(m), limites: { linhasMax: 50 } });
  await est.pronto;
  const c1 = est.consultar({ admin: true });
  assert.deepEqual(c1.posicao, { data: '24/11/2026', hora: '06:00' });
  assert.equal(c1.total, 10);
  // Planilha nova válida: troca tudo.
  atual.corpo = xlsxPosicao('25/11/2026', '06:05', 20);
  await est.recarregar();
  const c2 = est.consultar({ admin: true });
  assert.deepEqual(c2.posicao, { data: '25/11/2026', hora: '06:05' });
  assert.equal(c2.total, 20);
  assert.equal(est.estado(), 'ok');
  // Falhas: a posição e as linhas ficam as de antes; a aba não cai.
  const semColuna = xlsxFicticio(CAB_ESTOQUE.filter((c) => c !== 'ESTOQUE'), LINHAS_FICT.slice(0, 5));
  const ruins = [['404', null], ['quebrado', Buffer.from('isto-nao-e-um-zip')], ['acima do limite', xlsxPosicao('26/11/2026', '06:00', 60)],
    ['sem coluna', semColuna], ['vazia', xlsxFicticio(CAB_ESTOQUE, [])]];
  for (const [nome, corpo] of ruins) {
    atual.corpo = corpo;
    atual.status = corpo ? 200 : 404;
    logs.length = 0;
    await est.recarregar();
    const c = est.consultar({ admin: true });
    assert.deepEqual(c.posicao, { data: '25/11/2026', hora: '06:05' }, nome);
    assert.equal(c.total, 20, nome);
    assert.equal(est.estado(), 'ok', nome);
    assert.deepEqual(logs, ['estoque recarga falhou, mantida a anterior'], nome);
  }
});

test('recarga: a partida falhou (503) e a recarga seguinte põe a aba no ar (T-0036)', async () => {
  const { atual, url } = await fonteVariavel();
  atual.status = 404;
  const est = criarEstoque({ url });
  await est.pronto;
  assert.equal(est.estado(), 'falhou');
  assert.equal(est.consultar({}), null);
  atual.status = 200;
  atual.corpo = xlsxPosicao('25/11/2026', '07:00', 3);
  await est.recarregar();
  assert.equal(est.estado(), 'ok');
  assert.deepEqual(est.consultar({}).posicao, { data: '25/11/2026', hora: '07:00' });
});

test('recarga: duas ao mesmo tempo viram uma só; a consulta durante a recarga vê a base anterior inteira (T-0036)', async () => {
  const { atual, url } = await fonteVariavel();
  atual.corpo = xlsxPosicao('24/11/2026', '06:00', 10);
  const est = criarEstoque({ url });
  await est.pronto;
  assert.equal(atual.pedidos, 1);
  let soltar;
  atual.segurar = new Promise((r) => { soltar = r; });
  atual.corpo = xlsxPosicao('25/11/2026', '06:00', 30);
  const p1 = est.recarregar();
  const p2 = est.recarregar();
  assert.equal(p1, p2, 'a mesma promessa');
  while (atual.pedidos < 2) await tique();
  const meio = est.consultar({ admin: true, limite: 200 });
  assert.deepEqual(meio.posicao, { data: '24/11/2026', hora: '06:00' });
  assert.equal(meio.total, 10);
  assert.equal(meio.linhas.length, 10);
  atual.segurar = null;
  soltar();
  await Promise.all([p1, p2]);
  assert.equal(atual.pedidos, 2, 'um download só');
  assert.equal(est.consultar({}).total, 30);
  // Acabou: a próxima chamada é uma recarga nova.
  await est.recarregar();
  assert.equal(atual.pedidos, 3);
});

test('recarga no serviço: às 06:00 a aba passa a mostrar a planilha nova; se a nova falha, segue a anterior (T-0036)', async () => {
  const { atual, url } = await fonteVariavel();
  atual.corpo = xlsxPosicao('21/11/2026', '06:00', 12);
  const ag = agendadorFalso();
  const s = await subir({ estoqueUrl: url, agendar: ag.agendar });
  await tique();
  // O relógio do teste está em 22/11 12:00 UTC (08:00 de Manaus): a próxima é 23/11 06:00, daqui a 22 h.
  assert.equal(ag.chamadas.length, 1);
  assert.equal(ag.ultima().ms, 22 * 3600000);
  const adm = await adminPronto(s);
  const antes = (await s.pedir('/api/estoque', { cookie: adm })).json;
  assert.deepEqual(antes.posicao, { data: '21/11/2026', hora: '06:00' });
  assert.equal(antes.total, 12);
  // O disparo é o timer falso (o relógio do teste fica parado: a sessão do admin vence em 5 h).
  atual.corpo = xlsxPosicao('23/11/2026', '05:50', 25);
  await ag.ultima().fn();
  const depois = (await s.pedir('/api/estoque', { cookie: adm })).json;
  assert.deepEqual(depois.posicao, { data: '23/11/2026', hora: '05:50' });
  assert.equal(depois.total, 25);
  assert.equal(ag.chamadas.length, 2, 'reagendou');
  atual.status = 404;
  await ag.ultima().fn();
  const r = await s.pedir('/api/estoque', { cookie: adm });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.posicao, { data: '23/11/2026', hora: '05:50' });
  assert.ok(s.logs.includes('estoque recarga falhou, mantida a anterior'));
  assert.ok(!s.logs.join('\n').includes('127.0.0.1'), 'o log não leva a fonte');
  // Fechar o serviço para o agendamento.
  const n = ag.chamadas.length;
  await new Promise((res) => s.srv.close(res));
  await ag.ultima().fn();
  assert.equal(ag.chamadas.length, n);
});

test('recarga: o timer de verdade não segura o processo (T-0036)', async () => {
  // Um processo que só tem o agendamento (inclusive a nova tentativa de 1 h) termina sozinho.
  const modulo = new URL('./recarga.mjs', import.meta.url).href;
  const codigo = `const { agendarRecarga } = await import(${JSON.stringify(modulo)});
    agendarRecarga({ recarregar: async () => {}, falhou: () => true });`;
  await new Promise((resolve, reject) => {
    execFile(process.execPath, ['--input-type=module', '-e', codigo], { timeout: 10000 }, (e) => (e ? reject(e) : resolve()));
  });
});
