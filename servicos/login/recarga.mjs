// Recarga diária do estoque (T-0036). Node 20+, sem dependências.
// Todo dia às 06:00 de Manaus (UTC−4, sem horário de verão) [SUPOSIÇÃO do po] o serviço chama recarregar().
// Enquanto a aba estiver em 503 (a carga falhou e não há base nenhuma), tenta também a cada 1 h [SUPOSIÇÃO].
// O timer usa unref(): não segura o processo nem os testes. Reagenda depois de cada tentativa, com sucesso ou não.

const HORA_MS = 3600000;
const DIA_MS = 24 * HORA_MS;
export const HORA_RECARGA = 6;        // 06:00 no horário de Manaus
export const FUSO_MANAUS_H = -4;      // UTC−4 o ano todo
export const RETENTAR_MS = HORA_MS;   // só enquanto a aba está em 503

// Próximo instante (ms UTC) com hora:00 no fuso dado, ESTRITAMENTE depois de t.
export function proximaRecarga(t, { hora = HORA_RECARGA, fusoH = FUSO_MANAUS_H } = {}) {
  const local = t + fusoH * HORA_MS;
  let alvo = Math.floor(local / DIA_MS) * DIA_MS + hora * HORA_MS;
  if (alvo <= local) alvo += DIA_MS;
  return alvo - fusoH * HORA_MS;
}

// recarregar: () => Promise (nunca rejeita; se rejeitar, a falha é engolida e o agendamento segue).
// falhou: () => boolean, true enquanto a aba está em 503 (liga a nova tentativa a cada 1 h).
// depoisDe: promessa da carga da partida; o 1º agendamento só é feito depois dela (para saber se falhou).
// agora, agendar, cancelar: os testes trocam (relógio e setTimeout falsos).
export function agendarRecarga({
  recarregar, falhou = () => false, depoisDe = Promise.resolve(),
  agora = Date.now, agendar = setTimeout, cancelar = clearTimeout,
  hora = HORA_RECARGA, fusoH = FUSO_MANAUS_H, retentarMs = RETENTAR_MS,
} = {}) {
  let timer = null;
  let parado = false;
  let alvo = null;
  function programar() {
    if (parado) return;
    const t = agora();
    // A partir do alvo anterior também: se o timer disparar um pouco antes da hora, não repete a mesma 06:00.
    alvo = proximaRecarga(Math.max(t, alvo ?? t), { hora, fusoH });
    if (falhou()) alvo = Math.min(alvo, t + retentarMs);
    timer = agendar(disparar, Math.max(0, alvo - t));
    if (timer && typeof timer.unref === 'function') timer.unref();
  }
  async function disparar() {
    timer = null;
    if (parado) return;
    try { await recarregar(); } catch { /* recarregar() não rejeita; se rejeitar, segue */ }
    programar();
  }
  Promise.resolve(depoisDe).catch(() => {}).then(programar);
  return {
    parar() { parado = true; if (timer) cancelar(timer); timer = null; },
    proxima: () => (parado ? null : alvo),
    timer: () => timer,
  };
}
