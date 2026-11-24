// Testes da trava do graphify (pedido do Alexandre em 24/11/2026; portada do aloirr/macuxierp, T-0064).
// Rodar: node --test .claude/hooks/guarda-graphify.test.mjs
// Parte 1: funções puras (guarda-graphify-lib.mjs) com repositórios simulados.
// Parte 2: os hooks de verdade (guarda-graphify.mjs para Read/Grep e guarda-bash.mjs para Bash, stdin → exit code)
// em repositórios git temporários (catálogo + worktree); um caso por caminho.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  MENSAGEM, MENSAGEM_TRECHO, tipoPorRemotes, classificar, caminhosDoLeitor, analisarBash,
  decidirRead, decidirGrep, globSoLivre,
} from './guarda-graphify-lib.mjs';
import { tokenizar, comandosSimples } from './guarda-bash-lib.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ_REAL = join(AQUI, '..', '..');

// ───────────────────────────── Parte 1: puras ─────────────────────────────

const BAP = '/w/bap';
const WT = '/w/bap-wt';
const REC = '/w/recados';
/** repoDe simulado: catálogo (principal e worktree) e recados; o resto fora de repo. */
const repoDe = (abs) => {
  for (const [top, tipo] of [[BAP, 'bap'], [WT, 'bap'], [REC, 'recados']]) {
    if (abs === top || abs.startsWith(`${top}/`)) return { top, tipo };
  }
  return null;
};
const SEM = { bap: false };
const COM = { bap: true };
const bash = (comando, marcas = SEM, cwd = BAP) => analisarBash({ comando, cwd, marcas, repoDe });

test('mensagens exatas', () => {
  assert.equal(MENSAGEM, 'Consulte o graphify antes: GRAPHIFY_BACKEND=none graphify explain "<símbolo>", graphify query "<pergunta>" ou leia graphify-out/GRAPH_REPORT.md (CLAUDE.md, seção Graphify)');
  assert.equal(MENSAGEM_TRECHO, 'leia só o trecho: use offset e limit');
});

test('tipoPorRemotes: catálogo e recados pelo remote (https, ssh, com e sem .git)', () => {
  assert.equal(tipoPorRemotes(['https://github.com/aloirr/bapajudacatalogo.git']), 'bap');
  assert.equal(tipoPorRemotes(['git@github.com:aloirr/bapajudacatalogo']), 'bap');
  assert.equal(tipoPorRemotes(['http://127.0.0.1:1234/git/aloirr/bapajudacatalogo/']), 'bap');
  assert.equal(tipoPorRemotes(['https://github.com/aloirr/bapajudacatalogo-recados.git']), 'recados');
  assert.equal(tipoPorRemotes(['https://github.com/aloirr/macuxierp.git']), null);
  assert.equal(tipoPorRemotes([]), null);
});

test('classificar: código do catálogo e livres (docs, .md, dados, PDFs, .coord, graphify-out, recados, fora de repo)', () => {
  for (const p of ['site/app.js', 'site/styles.css', 'site/index.html', 'scripts/gerar_site.py', 'scripts/coord.mjs',
    'catalogo_grafico/gerador/portfolio.py', 'dados/scripts/base_v28.py', 'servicos/login/server.mjs', '.github/workflows/ci.yml',
    'site', 'catalogo_grafico/gerador']) {
    assert.equal(classificar(`${BAP}/${p}`, repoDe).tipo, 'bap', p);
    assert.equal(classificar(`${WT}/${p}`, repoDe).tipo, 'bap', `worktree ${p}`);
  }
  assert.equal(classificar(BAP, repoDe).tipo, 'bap', 'a raiz contém o código');
  for (const p of ['docs/ux/a.md', 'servicos/login/LEIA.md', '.coord/quadro.md', '.coord/donos.json', 'graphify-out/graph.json',
    'site/data/produtos.json', 'dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx', 'catalogo_grafico/entregas/Kit_Filtros_BAP.pdf',
    'site/assets/logo.png', 'testes/prints/T-0032/resumo.txt', '.claude/settings.json', 'render.yaml', 'CLAUDE.md']) {
    assert.equal(classificar(`${BAP}/${p}`, repoDe).tipo, 'livre', p);
  }
  assert.equal(classificar(`${REC}/recados/R-1.md`, repoDe).tipo, 'livre');
  assert.equal(classificar(`${REC}/scripts/x.mjs`, repoDe).tipo, 'livre', 'o clone de recados é livre');
  assert.equal(classificar('/etc/passwd', repoDe).tipo, 'livre');
});

test('caminhosDoLeitor: padrão/script não é caminho; -e/-f fazem tudo ser caminho', () => {
  const arq = (cmd) => {
    const [c] = comandosSimples(tokenizar(cmd));
    const r = caminhosDoLeitor(c.palavras[0].valor, c.palavras.slice(1));
    return { arquivos: r.arquivos.map((a) => a.valor), recursivo: r.recursivo };
  };
  assert.deepEqual(arq('grep -rn "site/app.js" docs').arquivos, ['docs']);
  assert.deepEqual(arq('grep -A 3 -e foo site/app.js').arquivos, ['site/app.js']);
  assert.deepEqual(arq("sed -n '1,20p' scripts/gerar_site.py").arquivos, ['scripts/gerar_site.py']);
  assert.deepEqual(arq('head -n 5 servicos/login/server.mjs').arquivos, ['servicos/login/server.mjs']);
  assert.deepEqual(arq('rg -g "*.js" foo').recursivo, true);
  assert.deepEqual(arq('grep -rn foo').recursivo, true);
  assert.deepEqual(arq('grep foo').recursivo, false);
});

test('Bash sem marca: leitura de código bloqueia (simples, pipeline, composto, $(...), <(...), bash -c, eval, <, cd)', () => {
  const bloqueados = [
    'cat site/app.js',
    'sed -n 1,40p scripts/gerar_site.py',
    'head -20 catalogo_grafico/gerador/portfolio.py',
    'tail -5 dados/scripts/base_v28.py',
    'grep -n foo servicos/login/server.mjs',
    'rg buscar site',
    "awk 'NR<10' scripts/coord.mjs",
    'cat .github/workflows/ci.yml',
    'git status && cat site/app.js | wc -l',
    'ls; grep -rn foo site/ | head',
    'echo $(head -3 site/app.js)',
    'bash -c "cat site/app.js"',
    'wc -l < site/app.js; head < site/app.js',
    'cd site && cat app.js',
    'grep -rn TRAVA',
    'rg foo',
    `cat ${BAP}/site/app.js`,
    `cat ${WT}/site/app.js`,
    'sudo cat site/app.js',
    'FOO=1 cat site/app.js',
    'diff <(cat site/app.js) x',
    'eval "cat site/app.js"',
    'nice -n 10 cat site/app.js',
    'timeout 5 cat site/app.js',
    'echo x | xargs -n1 cat site/app.js',
    'if true; then cat site/app.js; fi',
    '/usr/bin/CAT site/app.js',
  ];
  for (const c of bloqueados) assert.equal(bash(c).mensagem, MENSAGEM, c);
  for (const c of ['diff <(cat site/app.js) x', 'eval "cat site/app.js"']) assert.equal(bash(c, COM).mensagem, null, `${c} com a marca`);
});

test('Bash sem marca: docs, .md, dados, recados e comandos que não leem passam', () => {
  const livres = [
    'cat docs/ux/pareceres/a.md',
    'grep -rn "site/app.js" docs',
    'head -40 servicos/login/LEIA.md',
    'cat .coord/tarefas/T-0032.md .coord/donos.json',
    'head -c 300 site/data/produtos.json',
    `cat ${REC}/recados/R-1.md`,
    'node scripts/coord.mjs caixa po',
    'py -3 scripts/gerar_site.py',
    'ls site scripts',
    'git diff -- site',
    'cat /etc/hosts',
    'wc -l site/app.js',
    'eval "cat docs/a.txt"',
  ];
  for (const c of livres) assert.equal(bash(c).mensagem, null, c);
});

test('Bash: graphify query/explain/path/section/update marcam e liberam a leitura no mesmo comando', () => {
  for (const g of ['graphify explain "RAIZ"', 'GRAPHIFY_BACKEND=none graphify query "como a busca acha 60ah"', 'graphify path "A" "B"',
    'graphify section "docs/x.md#Seção"', 'GRAPHIFY_BACKEND=none graphify update .', 'python3 -m graphify explain x']) {
    const r = bash(g);
    assert.deepEqual(r.marcar, ['bap'], g);
    assert.equal(r.mensagem, null, g);
    assert.equal(bash(`${g} && sed -n 1,20p site/app.js`).mensagem, null, `${g} && leitura`);
  }
  assert.equal(bash('graphify --help').marcar.length, 0, 'graphify sem subcomando de consulta não marca');
  assert.equal(bash('cat site/app.js; graphify explain x').mensagem, MENSAGEM, 'leitura antes do graphify continua bloqueada');
  assert.deepEqual(bash('cat graphify-out/GRAPH_REPORT.md | head -60').marcar, ['bap'], 'ler o relatório pelo Bash marca');
  assert.deepEqual(bash(`head -60 ${BAP}/graphify-out/GRAPH_REPORT.md`, SEM, WT).marcar, ['bap'], 'o relatório do principal vale no worktree');
  assert.equal(bash('cat site/app.js', COM).mensagem, null, 'com a marca passa');
});

test('Read/Grep puros: marca, relatório, trecho acima de 300 linhas e glob de arquivos livres', () => {
  const linhas = (n) => () => n;
  const read = (arquivo, marcas, extra = {}) => decidirRead({ arquivo, cwd: BAP, marcas, repoDe, contarLinhas: linhas(500), ...extra });
  assert.equal(read('site/app.js', SEM).mensagem, MENSAGEM);
  assert.equal(read(`${BAP}/graphify-out/GRAPH_REPORT.md`, SEM).marcar, 'bap');
  assert.ok(read('site/app.js', COM).mensagem.startsWith(MENSAGEM_TRECHO));
  assert.equal(read('site/app.js', COM, { offset: 10 }).mensagem, null);
  assert.equal(read('site/app.js', COM, { limit: 50 }).mensagem, null);
  assert.equal(read('site/app.js', COM, { contarLinhas: linhas(300) }).mensagem, null, '300 linhas cabem');
  assert.equal(read('docs/grande.txt', SEM).mensagem, null);
  assert.equal(read('site/data/produtos.json', SEM).mensagem, null, 'dado não é código');
  assert.ok(globSoLivre('**/*.md') && globSoLivre('*.{md,json}') && !globSoLivre('*.{md,js}') && !globSoLivre('*.py'));
  const grep = (x) => decidirGrep({ cwd: BAP, repoDe, marcas: SEM, ...x }).mensagem;
  assert.equal(grep({}), MENSAGEM, 'Grep sem path na raiz do catálogo');
  assert.equal(grep({ path: 'site' }), MENSAGEM);
  assert.equal(grep({ glob: '**/*.md' }), null);
  assert.equal(grep({ type: 'md' }), null);
  assert.equal(grep({ type: 'json' }), null);
  assert.equal(grep({ path: 'docs' }), null);
  assert.equal(grep({ path: '.coord' }), null);
});

// ───────────────────────────── Parte 2: hooks de verdade ─────────────────────────────

const temporarios = [];
after(() => { for (const d of temporarios) rmSync(d, { recursive: true, force: true }); });

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const escrever = (dir, rel, txt = 'x\n') => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), txt); };

function criarAmbiente() {
  const base = mkdtempSync(join(tmpdir(), 'guarda-graphify-'));
  temporarios.push(base);
  const bap = join(base, 'bapajudacatalogo');
  mkdirSync(bap, { recursive: true });
  git(bap, 'init', '-q', '-b', 'main');
  git(bap, 'config', 'user.name', 'Teste');
  git(bap, 'config', 'user.email', 'teste@exemplo.invalid');
  git(bap, 'config', 'commit.gpgsign', 'false');
  git(bap, 'remote', 'add', 'origin', 'https://github.com/aloirr/bapajudacatalogo.git');
  escrever(bap, '.coord/donos.json', readFileSync(join(RAIZ_REAL, '.coord', 'donos.json'), 'utf8'));
  escrever(bap, 'site/app.js', 'export const a = 1;\n');
  escrever(bap, 'scripts/grande.py', Array.from({ length: 400 }, (_, i) => `# linha ${i + 1}`).join('\n') + '\n');
  escrever(bap, '.gitignore', 'graphify-out/\n');
  for (const f of ['coord-lib.mjs', 'coord.mjs']) copyFileSync(join(RAIZ_REAL, 'scripts', f), join(bap, 'scripts', f));
  mkdirSync(join(bap, '.claude', 'hooks'), { recursive: true });
  for (const f of ['guarda-graphify.mjs', 'guarda-graphify-lib.mjs', 'guarda-bash.mjs', 'guarda-bash-lib.mjs', 'guarda-merge-lib.mjs']) {
    copyFileSync(join(AQUI, f), join(bap, '.claude', 'hooks', f));
  }
  git(bap, 'add', '-A');
  git(bap, 'commit', '-q', '-m', 'inicial\n\nAgente: alexandre');
  escrever(bap, 'graphify-out/GRAPH_REPORT.md', '# Graph Report\n'); // fora do versionamento, só no principal
  const wt = join(base, 'bap-wt');
  git(bap, 'worktree', 'add', '-q', '-b', 'nuvem/teste-wt', wt);
  return { base, bap, wt };
}

const ENV_LIMPO = (() => {
  const e = { ...process.env };
  for (const k of ['BAP_AGENTE', 'CLAUDE_CODE_REMOTE', 'BAP_GUARDA', 'CLAUDECODE']) delete e[k];
  return e;
})();

function rodar(raizHook, hook, json, env = {}) {
  const r = spawnSync(process.execPath, [join(raizHook, '.claude', 'hooks', hook)], {
    cwd: raizHook, input: typeof json === 'string' ? json : JSON.stringify(json), encoding: 'utf8', env: { ...ENV_LIMPO, ...env },
  });
  return { codigo: r.status, erro: r.stderr };
}
const ler = (amb, sessao, file_path, extra = {}, raiz = amb.bap, env) =>
  rodar(raiz, 'guarda-graphify.mjs', { session_id: sessao, hook_event_name: 'PreToolUse', tool_name: 'Read', tool_input: { file_path, ...extra }, cwd: raiz }, env);
const procurar = (amb, sessao, tool_input, raiz = amb.bap, env) =>
  rodar(raiz, 'guarda-graphify.mjs', { session_id: sessao, hook_event_name: 'PreToolUse', tool_name: 'Grep', tool_input, cwd: raiz }, env);
const sh = (amb, sessao, command, cwd = amb.bap, raiz = amb.bap, env) =>
  rodar(raiz, 'guarda-bash.mjs', { session_id: sessao, tool_use_id: `t-${Math.random()}`, hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command }, cwd }, env);

const AMB = criarAmbiente();

test('hook: sem marca bloqueia com a mensagem exata; graphify (Bash) e Read do relatório marcam', () => {
  const a = join(AMB.bap, 'site/app.js');
  for (const r of [ler(AMB, 's-explain', a), procurar(AMB, 's-explain', { pattern: 'x' }), sh(AMB, 's-explain', 'cat site/app.js')]) {
    assert.equal(r.codigo, 2, r.erro);
    assert.equal(r.erro.trim(), MENSAGEM);
  }
  assert.equal(sh(AMB, 's-explain', 'GRAPHIFY_BACKEND=none graphify explain "RAIZ"').codigo, 0);
  assert.equal(ler(AMB, 's-explain', a).codigo, 0, 'Read liberado');
  assert.equal(procurar(AMB, 's-explain', { pattern: 'x', path: join(AMB.bap, 'site') }).codigo, 0, 'Grep liberado');
  assert.equal(sh(AMB, 's-explain', 'cat site/app.js').codigo, 0, 'Bash liberado');
  assert.equal(ler(AMB, 's-relatorio', join(AMB.bap, 'graphify-out/GRAPH_REPORT.md'), { limit: 60 }).codigo, 0);
  assert.equal(ler(AMB, 's-relatorio', a).codigo, 0, 'Read do relatório marca');
  assert.ok(existsSync(join(AMB.bap, '.git', 'bap-graphify')), 'marca no git common dir');
  assert.equal(git(AMB.bap, 'status', '--porcelain'), '', 'a marca fica fora do versionamento');
});

test('hook: worktree usa a marca do principal', () => {
  const wtA = join(AMB.wt, 'site/app.js');
  assert.equal(ler(AMB, 's-wt', wtA, {}, AMB.wt).codigo, 2, 'worktree sem marca bloqueia');
  assert.equal(sh(AMB, 's-wt', 'graphify explain x').codigo, 0, 'marca gravada pelo principal');
  assert.equal(ler(AMB, 's-wt', wtA, {}, AMB.wt).codigo, 0, 'vale no hook do worktree');
});

test('hook: marca de outra session_id não libera', () => {
  assert.equal(sh(AMB, 's-dona', 'graphify explain x').codigo, 0);
  assert.equal(ler(AMB, 's-outra', join(AMB.bap, 'site/app.js')).codigo, 2);
});

test('hook: BAP_GUARDA=off não desliga a trava', () => {
  const env = { BAP_GUARDA: 'off' };
  assert.equal(ler(AMB, 's-off', join(AMB.bap, 'site/app.js'), {}, AMB.bap, env).codigo, 2);
  assert.equal(sh(AMB, 's-off', 'cat site/app.js', AMB.bap, AMB.bap, env).codigo, 2);
  for (const f of ['guarda-graphify.mjs', 'guarda-graphify-lib.mjs']) {
    assert.ok(!/process\.env/.test(readFileSync(join(AQUI, f), 'utf8')), `${f} não lê variável de ambiente`);
  }
});

test('hook: entrada ilegível passa (padrão dos guardas)', () => {
  assert.equal(rodar(AMB.bap, 'guarda-graphify.mjs', '{isto não é json', {}).codigo, 0);
});

test('hook: Read acima de 300 linhas bloqueia sem offset/limit e passa com limit', () => {
  const grande = join(AMB.bap, 'scripts/grande.py');
  assert.equal(sh(AMB, 's-trecho', 'graphify explain grande').codigo, 0);
  const r = ler(AMB, 's-trecho', grande);
  assert.equal(r.codigo, 2);
  assert.ok(r.erro.startsWith(MENSAGEM_TRECHO), r.erro);
  assert.equal(ler(AMB, 's-trecho', grande, { limit: 50 }).codigo, 0);
});
