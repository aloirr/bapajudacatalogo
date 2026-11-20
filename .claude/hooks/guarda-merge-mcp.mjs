#!/usr/bin/env node
// Guardião do merge pela integração do GitHub (T-0016) — hook PreToolUse das ferramentas MCP com "merge" no nome
// (matcher no .claude/settings.json; a ferramenta de verdade é mcp__github__merge_pull_request).
// Regra R-20261120-111308-alexandre: o po autoriza todos os merges, inclusive os de governança; o gerente-projetos
// executa. Antes do merge o hook confere (conferirMergeMcp em guarda-merge-lib.mjs; casos em guarda-merge-mcp.test.mjs):
//  - só o gerente-projetos, na sessão principal, com identidade confiável (BAP_AGENTE ou sessão local);
//  - owner/repo aloirr/bapajudacatalogo, merge_method "squash", expectedHeadSha de 40 caracteres e commit_message com a
//    tarefa (T-nnnn) e "Agente: <dono>" (R-20261120-131230-alexandre);
//  - pela API REST do GitHub (gh api, só leitura): PR aberto, head = expectedHeadSha e CI do PR verde;
//  - recado do po (ou do Alexandre) "autorizo o merge do PR #N no commit <sha>" publicado no main do
//    aloirr/bapajudacatalogo-recados (recados/gerente-projetos), com o mesmo N e o SHA do head.
// Falha fechada: consulta que falha, entrada ilegível ou exceção = BLOQUEADO (exit 2; exit 1 não bloquearia).
// Ferramenta que não é merge passa sem consultar nada. Desligar: BAP_GUARDA=off, como nos outros guardiões.
const bloquear = (msg) => {
  process.stderr.write(`${msg}\n`);
  process.exit(2);
};

try {
  const { RAIZ, agenteDaSessao } = await import('../../scripts/coord-lib.mjs');
  const { conferirMergeMcp, consultarPrRest, lerRecadosDoGerente, tipoFerramentaMerge } = await import('./guarda-merge-lib.mjs');
  const { lerEntradaDoHook, guardaDesligada } = await import('./guarda-bash-lib.mjs');

  if (guardaDesligada()) process.exit(0);
  const entrada = await lerEntradaDoHook();
  // O matcher só chama este hook nas ferramentas de merge: sem ler a entrada, não dá para conferir.
  if (!entrada) bloquear('[guardião BAP] BLOQUEADO (merge pelo MCP do GitHub): entrada do hook ilegível; sem a conferência não há merge (falha fechada).');
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
  if (!r.ok) bloquear(r.mensagem);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: `[guardião BAP] merge do PR #${r.pr} conferido: head = expectedHeadSha, CI do PR verde, squash com "Agente: ${r.agenteDoCommit}" e autorização ${r.autorizacao} (de ${r.autorizadoPor}).`,
    },
  }) + '\n');
  process.exit(0);
} catch (e) {
  bloquear(`[guardião BAP] BLOQUEADO (merge pelo MCP do GitHub): erro no guardião (${String(e?.message || e).split(/\r?\n/)[0].slice(0, 200)}); sem a conferência não há merge (falha fechada).`);
}
