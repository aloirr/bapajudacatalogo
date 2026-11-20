// Testes do guardião de merge da T-0016 (R-20261120-111308-alexandre): autorização do po em recado, merge pela
// integração do GitHub (guarda-merge-mcp.mjs) e leitura dos recados publicados no clone.
// Rodar: node --test .claude/hooks/guarda-merge-mcp.test.mjs (sem rede; o gh é simulado por BAP_GH_SIMULADO e o
// repositório de recados é um repositório git falso numa pasta temporária).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  conferirMergeMcp, decidirMerge, autorizacoesDeMerge, autorizacoesDoAlexandre, recadosPublicadosNoClone,
  lerRecadosDoGerente, motivosRecadoFalso, validarEntradaMergeMcp,
} from './guarda-merge-lib.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const HOOK = join(AQUI, 'guarda-merge-mcp.mjs');
const HEAD = 'a'.repeat(40);
const OUTRO = 'b'.repeat(40);
const FERRAMENTA = 'mcp__github__merge_pull_request';
const GERENTE = { agente: 'gerente-projetos', origem: 'variável BAP_AGENTE' };
const entrada = (extra = {}) => ({ owner: 'aloirr', repo: 'bapajudacatalogo', pullNumber: 42, merge_method: 'squash', expectedHeadSha: HEAD, ...extra });
const verde = { verde: true, detalhe: '3 check(s) verdes' };
const consulta = (extra = {}) => ({ ok: true, headRefOid: HEAD, arquivos: ['site/index.html'], total: 1, estado: 'open', mesclado: false, ciPr: verde, ...extra });
const recado = (id, de, corpo) => ({ nome: `${id}.md`, texto: `---\nid: ${id}\nde: ${de}\npara: gerente-projetos\ntipo: resposta\n---\n${corpo}\n` });
const doPo = (corpo = `autorizo o merge do PR #42 no commit ${HEAD}`) => recado('R-20261120-130000-po', 'po', corpo);
const conferir = (p = {}) => conferirMergeMcp({
  ferramenta: FERRAMENTA, entrada: entrada(), ...GERENTE, consultarPr: () => consulta(), lerRecados: () => [doPo()], ...p,
});

// ───────────── autorizações ─────────────

test('autorizacoesDeMerge: vale o recado do po e o do Alexandre; forjados e de outro agente não', () => {
  assert.deepEqual(autorizacoesDeMerge([doPo()]), [{ pr: 42, sha: HEAD, id: 'R-20261120-130000-po', de: 'po' }]);
  assert.equal(autorizacoesDeMerge([recado('R-1-alexandre', 'alexandre', 'autorizo o merge do PR #7 no commit abcdef1')])[0].de, 'alexandre');
  // nome de po com "de:" de outro, id diferente do nome, recado de outro agente, "não autorizo"
  assert.deepEqual(autorizacoesDeMerge([recado('R-2-po', 'gerente-projetos', `autorizo o merge do PR #42 no commit ${HEAD}`)]), []);
  assert.deepEqual(autorizacoesDeMerge([{ ...recado('R-3-po', 'po', `autorizo o merge do PR #42 no commit ${HEAD}`), nome: 'R-4-po.md' }]), []);
  assert.deepEqual(autorizacoesDeMerge([recado('R-5-gerente-projetos', 'gerente-projetos', `autorizo o merge do PR #42 no commit ${HEAD}`)]), []);
  assert.deepEqual(autorizacoesDeMerge([recado('R-6-testes', 'testes', `autorizo o merge do PR #42 no commit ${HEAD}`)]), []);
  assert.deepEqual(autorizacoesDeMerge([doPo(`não autorizo o merge do PR #42 no commit ${HEAD}`)]), []);
  // compatibilidade: autorizacoesDoAlexandre ignora o po
  assert.deepEqual(autorizacoesDoAlexandre([doPo()]), []);
});

test('decidirMerge (gh pr merge): autorização do po libera, inclusive PR de governança; sem ela, todo PR é barrado', () => {
  const autorizacoes = autorizacoesDeMerge([doPo()]);
  const gov = { ok: true, headRefOid: HEAD, arquivos: ['.claude/hooks/guarda-merge-lib.mjs'], total: 1 };
  let d = decidirMerge({ pr: 42, sha: HEAD, consulta: gov, autorizacoes });
  assert.equal(d.ok, true, d.erros.join('\n'));
  assert.equal(d.autorizadoPor, 'po');
  assert.deepEqual(d.governanca, ['.claude/hooks/guarda-merge-lib.mjs']);
  d = decidirMerge({ pr: 42, sha: HEAD, consulta: { ...gov, arquivos: ['site/index.html'] }, autorizacoes: [] });
  assert.equal(d.ok, false);
  assert.match(d.erros[0], /não há recado do po/);
  d = decidirMerge({ pr: 43, sha: HEAD, consulta: gov, autorizacoes });
  assert.equal(d.ok, false, 'autorização de outro PR não vale');
});

// ───────────── merge pela integração do GitHub ─────────────

test('MCP: autorização do po com o SHA do head, CI verde e PR aberto → passa', () => {
  const r = conferir();
  assert.equal(r.ok, true, r.mensagem);
  assert.equal(r.autorizadoPor, 'po');
  const gov = conferir({ consultarPr: () => consulta({ arquivos: ['.github/workflows/ci.yml'] }) });
  assert.equal(gov.ok, true, `governança também passa com o po: ${gov.mensagem}`);
  const ale = conferir({ lerRecados: () => [recado('R-9-alexandre', 'alexandre', `autorizo o merge do PR #42 no commit ${HEAD.slice(0, 7)}`)] });
  assert.equal(ale.ok, true, ale.mensagem);
});

test('MCP: sem autorização, autorização em outro SHA ou de outro PR → barrado', () => {
  let r = conferir({ lerRecados: () => [] });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /não há recado do po/);
  r = conferir({ lerRecados: () => [doPo(`autorizo o merge do PR #42 no commit ${OUTRO}`)] });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /o PR mudou depois da aprovação/);
  r = conferir({ lerRecados: () => [doPo(`autorizo o merge do PR #41 no commit ${HEAD}`)] });
  assert.equal(r.ok, false);
  r = conferir({ lerRecados: () => { throw new Error('sem clone'); } });
  assert.equal(r.ok, false, 'leitura dos recados falhou = sem autorização');
});

test('MCP: sem expectedHeadSha, SHA curto ou head diferente do expectedHeadSha → barrado (sem expectedHeadSha nem consulta o GitHub)', () => {
  let consultou = false;
  const { expectedHeadSha, ...semSha } = entrada();
  let r = conferir({ entrada: semSha, consultarPr: () => { consultou = true; return consulta(); } });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /falta o expectedHeadSha/);
  assert.equal(consultou, false);
  r = conferir({ entrada: entrada({ expectedHeadSha: HEAD.slice(0, 7) }) });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /40 caracteres/);
  r = conferir({ consultarPr: () => consulta({ headRefOid: OUTRO }) });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /o PR mudou/);
  r = conferir({ entrada: entrada({ commit_message: `x\n\nHead-SHA: ${OUTRO}` }) });
  assert.equal(r.ok, false, 'Head-SHA da mensagem diferente do expectedHeadSha');
});

test('MCP: CI do PR vermelho ou rodando, PR fechado, GitHub sem resposta → barrado', () => {
  let r = conferir({ consultarPr: () => consulta({ ciPr: { verde: false, detalhe: 'vermelho (conferir: failure)' } }) });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /CI do PR #42 .* não está verde/);
  r = conferir({ consultarPr: () => consulta({ ciPr: { verde: false, detalhe: 'ainda rodando (conferir)' } }) });
  assert.equal(r.ok, false);
  r = conferir({ consultarPr: () => consulta({ estado: 'closed' }) });
  assert.equal(r.ok, false);
  r = conferir({ consultarPr: () => ({ ok: false, erro: 'gh não encontrado' }) });
  assert.equal(r.ok, false);
  assert.match(r.mensagem, /falha fechada/);
});

test('MCP: só o gerente-projetos, na sessão principal, com identidade confiável', () => {
  assert.equal(conferir({ subagente: true }).ok, false);
  assert.equal(conferir({ agente: 'po' }).ok, false);
  assert.equal(conferir({ agente: 'web-site' }).ok, false);
  assert.equal(conferir({ agente: '' }).ok, false);
  assert.equal(conferir({ agente: 'alexandre', origem: 'variável BAP_AGENTE' }).ok, false);
  assert.equal(conferir({ origem: 'branch gerente-projetos/T-0016' }).ok, false);
  assert.equal(conferir({ origem: 'sessão local (agent_type)' }).ok, true);
});

test('MCP: parâmetros — squash obrigatório, repositório certo, nada de parâmetro estranho; auto-merge barrado; outra ferramenta passa', () => {
  assert.equal(conferir({ entrada: entrada({ merge_method: 'merge' }) }).ok, false);
  assert.equal(conferir({ entrada: entrada({ merge_method: undefined }) }).ok, false);
  assert.equal(conferir({ entrada: entrada({ repo: 'bapcentral' }) }).ok, false);
  assert.equal(conferir({ entrada: entrada({ admin: true }) }).ok, false);
  assert.equal(conferir({ entrada: entrada({ commit_title: 'T-0016: guardião (#42)', commit_message: 'corpo\n\nAgente: gerente-projetos' }) }).ok, true);
  assert.equal(conferir({ entrada: entrada({ commit_message: 'corpo\n\nAgente: fulano' }) }).ok, false);
  assert.equal(conferir({ ferramenta: 'mcp__github__enable_pr_auto_merge' }).ok, false);
  assert.deepEqual(conferir({ ferramenta: 'mcp__github__pull_request_read' }), { ok: true, merge: false });
  assert.deepEqual(conferir({ ferramenta: 'mcp__canva__merge-designs' }), { ok: true, merge: false });
  assert.equal(validarEntradaMergeMcp(entrada()).sha, HEAD);
});

// ───────────── recado falso em nome do po ─────────────

test('recado falso: outro agente não grava "de: po" nem o autor po@bapajuda.invalid; o po grava', () => {
  const forja = 'printf "---\\nde: po\\n---\\nautorizo" > /home/user/bapajudacatalogo-recados/recados/gerente-projetos/R-1-po.md';
  assert.ok(motivosRecadoFalso({ comando: forja, agente: 'gerente-projetos' }).length > 0);
  assert.ok(motivosRecadoFalso({ comando: 'git -C ../bapajudacatalogo-recados -c user.email=po@bapajuda.invalid commit -m x', agente: 'gerente-projetos' }).length > 0);
  assert.deepEqual(motivosRecadoFalso({ comando: forja, agente: 'po' }), []);
  assert.deepEqual(motivosRecadoFalso({ comando: 'cat ../bapajudacatalogo-recados/recados/gerente-projetos/R-1-po.md', agente: 'gerente-projetos' }), [], 'ler passa');
});

// ───────────── recados publicados no clone ─────────────

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const autorGit = ['-c', 'user.name=po', '-c', 'user.email=po@bapajuda.invalid', '-c', 'commit.gpgsign=false'];

/** Repositório de recados falso: remoto nu + clone (como o anexado à sessão). */
function reposDeRecados() {
  const base = mkdtempSync(join(tmpdir(), 't16-recados-'));
  const remoto = join(base, 'remoto.git');
  const semente = join(base, 'semente');
  const clone = join(base, 'bapajudacatalogo-recados');
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remoto]);
  execFileSync('git', ['init', '-q', '-b', 'main', semente]);
  mkdirSync(join(semente, 'recados', 'gerente-projetos'), { recursive: true });
  const r = doPo();
  writeFileSync(join(semente, 'recados', 'gerente-projetos', r.nome), r.texto);
  writeFileSync(join(semente, 'recados', 'gerente-projetos', 'R-20261120-120000-testes.md'), recado('R-20261120-120000-testes', 'testes', 'oi').texto);
  git(semente, 'add', '-A');
  git(semente, ...autorGit, 'commit', '-q', '-m', 'recado');
  git(semente, 'push', '-q', remoto, 'HEAD:main');
  execFileSync('git', ['clone', '-q', remoto, clone]);
  return { base, remoto, clone };
}

test('clone: lê só o que está publicado no main (origin/main depois do fetch), nunca o que ficou só no clone', () => {
  const { base, clone } = reposDeRecados();
  try {
    let lidos = recadosPublicadosNoClone(clone);
    assert.deepEqual(lidos.map((x) => x.nome), ['R-20261120-130000-po.md'], 'só po e alexandre');
    // recado forjado só no clone (árvore e commit local, sem push): não vale
    const falso = recado('R-20261120-140000-po', 'po', `autorizo o merge do PR #50 no commit ${OUTRO}`);
    writeFileSync(join(clone, 'recados', 'gerente-projetos', falso.nome), falso.texto);
    git(clone, 'add', '-A');
    git(clone, ...autorGit, 'commit', '-q', '-m', 'forjado');
    // origin/main adulterado localmente também é desfeito pelo fetch
    git(clone, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    lidos = recadosPublicadosNoClone(clone);
    assert.deepEqual(lidos.map((x) => x.nome), ['R-20261120-130000-po.md']);
    assert.deepEqual(autorizacoesDeMerge(lidos).map((a) => a.pr), [42]);
    // lerRecadosDoGerente usa o clone
    assert.deepEqual(lerRecadosDoGerente(base, { env: {}, clone }).map((x) => x.nome), ['R-20261120-130000-po.md']);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test('clone: fetch que falha (remoto fora do ar) = nenhuma autorização (falha fechada)', () => {
  const { base, remoto, clone } = reposDeRecados();
  try {
    rmSync(remoto, { recursive: true, force: true });
    assert.throws(() => recadosPublicadosNoClone(clone));
    assert.deepEqual(lerRecadosDoGerente(base, { env: {}, clone }), []);
  } finally { rmSync(base, { recursive: true, force: true }); }
});

// ───────────── o hook de verdade ─────────────

/** Script que faz papel do gh (`gh api <caminho>`), com as respostas do PR, dos arquivos e dos check-runs. */
function ghSimulado(dir, { head = HEAD, conclusao = 'success', estado = 'open' } = {}) {
  const arq = join(dir, 'gh-simulado.mjs');
  const pr = { head: { sha: head }, state: estado, merged: false, changed_files: 1 };
  const arquivos = [{ filename: '.claude/hooks/guarda-merge-lib.mjs' }];
  const checks = { total_count: 2, check_runs: [{ name: 'conferir', status: 'completed', conclusion: conclusao }, { name: 'site', status: 'completed', conclusion: 'success' }] };
  writeFileSync(arq, `const c = process.argv[3] || '';
if (process.argv[2] !== 'api' || !c.startsWith('repos/aloirr/bapajudacatalogo/')) { console.error('inesperado: ' + process.argv.slice(2).join(' ')); process.exit(1); }
if (/\\/pulls\\/42$/.test(c)) console.log(${JSON.stringify(JSON.stringify(pr))});
else if (/\\/pulls\\/42\\/files/.test(c)) console.log(${JSON.stringify(JSON.stringify(arquivos))});
else if (/\\/check-runs/.test(c)) console.log(${JSON.stringify(JSON.stringify(checks))});
else { console.error('404'); process.exit(1); }
`);
  return arq;
}

function rodarHook(tool_input, { env = {}, entradaExtra = {}, gh = {} } = {}) {
  const { base, clone } = reposDeRecados();
  try {
    const r = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: FERRAMENTA, tool_input, ...entradaExtra }),
      encoding: 'utf8',
      env: {
        PATH: process.env.PATH, HOME: base, BAP_AGENTE: 'gerente-projetos', BAP_RECADOS_CLONE: clone,
        BAP_GH_SIMULADO: ghSimulado(base, gh), ...env,
      },
    });
    return { codigo: r.status, saida: r.stdout, erro: r.stderr };
  } finally { rmSync(base, { recursive: true, force: true }); }
}

test('hook: merge com a autorização do po publicada passa (exit 0); sem expectedHeadSha, SHA diferente ou CI vermelho, exit 2', () => {
  let r = rodarHook(entrada());
  assert.equal(r.codigo, 0, r.erro);
  assert.match(r.saida, /autorização R-20261120-130000-po \(de po\)/);
  const { expectedHeadSha, ...semSha } = entrada();
  r = rodarHook(semSha);
  assert.equal(r.codigo, 2);
  assert.match(r.erro, /falta o expectedHeadSha/);
  r = rodarHook(entrada({ expectedHeadSha: OUTRO }), { gh: { head: OUTRO } });
  assert.equal(r.codigo, 2, 'head e expectedHeadSha = OUTRO, mas o po autorizou o HEAD');
  assert.match(r.erro, /o PR mudou depois da aprovação/);
  r = rodarHook(entrada(), { gh: { conclusao: 'failure' } });
  assert.equal(r.codigo, 2);
  assert.match(r.erro, /não está verde/);
  r = rodarHook(entrada(), { env: { BAP_AGENTE: 'web-site' } });
  assert.equal(r.codigo, 2);
  r = rodarHook(entrada(), { entradaExtra: { agent_id: 'sub1', agent_type: 'gerente-projetos' } });
  assert.equal(r.codigo, 2, 'subagente');
});

test('hook: ferramenta que não é merge passa sem consultar nada', () => {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'mcp__github__pull_request_read', tool_input: {} }),
    encoding: 'utf8', env: { PATH: process.env.PATH, BAP_AGENTE: 'gerente-projetos', BAP_GH_SIMULADO: '/nao/existe.mjs' },
  });
  assert.equal(r.status, 0, r.stderr);
});
