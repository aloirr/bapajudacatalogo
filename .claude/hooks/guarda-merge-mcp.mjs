#!/usr/bin/env node
// Guardião do merge pela integração do GitHub (T-0016) — hook PreToolUse das ferramentas MCP com "merge" no nome
// (matcher no .claude/settings.json; a ferramenta de verdade é mcp__github__merge_pull_request).
// Regra R-20261120-111308-alexandre: o po autoriza todos os merges, inclusive os de governança; o gerente-projetos
// executa. Antes do merge o hook confere (conferirMergeMcp em guarda-merge-lib.mjs; casos em guarda-merge-mcp.test.mjs):
//  - só o gerente-projetos, na sessão principal, com identidade confiável (BAP_AGENTE ou sessão local);
//  - owner/repo aloirr/bapajudacatalogo, merge_method "squash" e expectedHeadSha de 40 caracteres;
//  - pela API REST do GitHub (gh api, só leitura): PR aberto, head = expectedHeadSha e CI do PR verde;
//  - recado do po (ou do Alexandre) "autorizo o merge do PR #N no commit <sha>" publicado no main do
//    aloirr/bapajudacatalogo-recados (recados/gerente-projetos), com o mesmo N e o SHA do head.
// Qualquer falha de consulta = BLOQUEADO (exit 2, falha fechada). Ferramenta que não é merge passa sem consultar nada.
// Desligar: variável BAP_GUARDA=off (do processo do Claude Code, que o agente não altera), como nos outros guardiões.
import { RAIZ, agenteDaSessao } from '../../scripts/coord-lib.mjs';
import { conferirMergeMcp, consultarPrRest, lerRecadosDoGerente, tipoFerramentaMerge } from './guarda-merge-lib.mjs';

function lerEntrada() {
  return new Promise((ok) => {
    let txt = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => (txt += d));
    process.stdin.on('end', () => {
      try { ok(JSON.parse(txt || '{}')); } catch { ok({}); }
    });
  });
}

if ((process.env.BAP_GUARDA || '').toLowerCase() === 'off') process.exit(0);

const entrada = await lerEntrada();
const ferramenta = String(entrada.tool_name || '');
if (!tipoFerramentaMerge(ferramenta)) process.exit(0);
if ((entrada.hook_event_name || 'PreToolUse') !== 'PreToolUse') process.exit(0);

const { agente, origem } = agenteDaSessao({ argumento: process.argv[2], entrada });
const r = conferirMergeMcp({
  ferramenta, entrada: entrada.tool_input, agente, origem,
  subagente: Boolean(String(entrada.agent_id || '').trim()),
  consultarPr: (pr) => consultarPrRest(pr),
  lerRecados: () => lerRecadosDoGerente(RAIZ),
});
if (!r.ok) {
  process.stderr.write(r.mensagem + '\n');
  process.exit(2);
}
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    additionalContext: `[guardião BAP] merge do PR #${r.pr} conferido: head = expectedHeadSha, CI do PR verde e autorização ${r.autorizacao} (de ${r.autorizadoPor}).`,
  },
}) + '\n');
process.exit(0);
