// Contador de aberturas de produto por código BAP (T-0018). Node 18+, sem dependências.
// Privacidade: guarda SÓ {codigo: n} por dia. Nada de IP, placa, texto digitado,
// cookie, hora ou origem. O log só leva contagens.
import fs from 'node:fs';
import path from 'node:path';

export const H24 = 24 * 60 * 60 * 1000;
export const FUSO_MANAUS = -4 * 60 * 60 * 1000;
const GUARDA_DIAS = 30;                 // arquivo com mais de 30 dias é apagado
export const JANELA_MAX = 30;           // /mais-vistos aceita dias de 1 a 30
export const JANELA_PADRAO = 7;         // /mais-vistos sem dias
const MAIS_VISTOS = 8;           // quantos códigos o /mais-vistos devolve (R-20261120-144530-alexandre)
const RENOVAR_MS = 6 * 60 * 60 * 1000;  // lê a lista de códigos de novo a cada 6 h
const TENTAR_DE_NOVO_MS = 60 * 1000;    // se a leitura falhou, tenta em 1 min
const ESPERA_GRAVAR_MS = 5000;          // junta as aberturas antes de gravar
const CODIGO_MAX = 40;
const CATALOGO_MAX = 32 * 1024 * 1024;  // o produtos.json tem uns 3 MB
const RE_ARQ = /^(\d{4}-\d{2}-\d{2})\.json$/;
const RE_TMP = /^\d{4}-\d{2}-\d{2}\.json\.tmp$/;

export const diaManaus = (t) => Math.floor((t + FUSO_MANAUS) / H24);
export const nomeDoDia = (d) => new Date(d * H24).toISOString().slice(0, 10);
function diaDoNome(nome) {
  const m = RE_ARQ.exec(nome);
  if (!m) return null;
  const t = Date.parse(m[1] + 'T00:00:00Z');
  if (!Number.isFinite(t)) return null;
  const d = Math.floor(t / H24);
  return nomeDoDia(d) === m[1] ? d : null;
}

// Código como chega do site: texto curto, sem espaço nas pontas, em maiúsculas.
export function normalizarCodigo(bruto) {
  if (typeof bruto !== 'string') return null;
  const c = bruto.trim().toUpperCase();
  return c && c.length <= CODIGO_MAX ? c : null;
}

export function criarContador({ pasta = null, log = () => {} } = {}) {
  const dias = new Map();   // dia (número) -> Map(codigo -> n)
  const sujos = new Set();  // dias com mudança ainda não gravada
  let timer = null;
  let disco = null;
  let ultimoDia = diaManaus(Date.now());

  function limpar(hoje) {
    ultimoDia = hoje;
    for (const d of dias.keys()) if (hoje - d > GUARDA_DIAS) { dias.delete(d); sujos.delete(d); }
    if (!disco) return;
    try {
      for (const nome of fs.readdirSync(disco)) {
        const d = diaDoNome(nome);
        if (d !== null && hoje - d > GUARDA_DIAS) fs.rmSync(path.join(disco, nome), { force: true });
      }
    } catch {
      log('contador limpeza falhou');
    }
  }

  function abrir() {
    if (!pasta) { log('contador so memoria'); return; }
    try {
      fs.accessSync(pasta, fs.constants.W_OK);
      for (const nome of fs.readdirSync(pasta)) {
        if (RE_TMP.test(nome)) { fs.rmSync(path.join(pasta, nome), { force: true }); continue; }
        const d = diaDoNome(nome);
        if (d === null) continue;
        let obj = null;
        try { obj = JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8')); } catch { obj = null; }
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;
        const m = new Map();
        for (const [k, v] of Object.entries(obj)) {
          const c = normalizarCodigo(k);
          if (c && Number.isSafeInteger(v) && v > 0) m.set(c, (m.get(c) || 0) + v);
        }
        if (m.size) dias.set(d, m);
      }
      disco = pasta;
    } catch {
      disco = null;
      log('contador disco indisponivel, so memoria');
      return;
    }
    limpar(diaManaus(Date.now()));
    log(`contador ok ${dias.size} dias`);
  }

  // Escrita atômica: arquivo .tmp e depois rename por cima do do dia.
  function gravarJa() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!disco) { sujos.clear(); return; }
    for (const d of [...sujos]) {
      const m = dias.get(d);
      sujos.delete(d);
      if (!m) continue;
      const final = path.join(disco, nomeDoDia(d) + '.json');
      const tmp = final + '.tmp';
      try {
        fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(m)), { mode: 0o600 });
        fs.renameSync(tmp, final);
      } catch {
        log('contador gravacao falhou');
        try { fs.rmSync(tmp, { force: true }); } catch { /* nada */ }
      }
    }
  }

  function contar(codigo) {
    faxina();
    const hoje = ultimoDia;
    let m = dias.get(hoje);
    if (!m) { m = new Map(); dias.set(hoje, m); }
    m.set(codigo, (m.get(codigo) || 0) + 1);
    sujos.add(hoje);
    if (disco && !timer) { timer = setTimeout(gravarJa, ESPERA_GRAVAR_MS); timer.unref(); }
  }

  // Janela de N dias: hoje (dia de Manaus) e os N-1 dias antes.
  // Se o catálogo já foi lido, código que saiu do catálogo não entra.
  function maisVistos(n, { valido = null } = {}) {
    const hoje = diaManaus(Date.now());
    const soma = new Map();
    let total = 0;
    for (let d = hoje - n + 1; d <= hoje; d++) {
      const m = dias.get(d);
      if (!m) continue;
      for (const [c, v] of m) {
        if (valido && !valido(c)) continue;
        soma.set(c, (soma.get(c) || 0) + v);
        total += v;
      }
    }
    const itens = [...soma]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .slice(0, MAIS_VISTOS)
      .map(([codigo, v]) => ({ codigo, n: v }));
    return { total, itens };
  }

  function faxina(agora = Date.now()) {
    const hoje = diaManaus(agora);
    if (hoje !== ultimoDia) limpar(hoje);
  }

  return { abrir, contar, maisVistos, gravarJa, faxina };
}

// ---------- lista de códigos do catálogo ----------
// Lida do /interno/codigos do login ({codigos:[...]}, T-0022); nos testes, de um produtos.json falso ({produtos:[{c}]}).
// Motivo: README, "Lista de códigos do catálogo". headers leva a chave interna; nunca vai para o log.
export function criarCatalogo({ url, headers = {}, log = () => {} }) {
  let codigos = null;
  // Corpo lido em pedaços, contando bytes; passou de CATALOGO_MAX, desiste.
  async function lerAte(res) {
    if (Number(res.headers.get('content-length')) > CATALOGO_MAX) { await res.body?.cancel(); return null; }
    if (!res.body) return '';
    const partes = [];
    let tam = 0;
    for await (const b of res.body) {
      tam += b.length;
      if (tam > CATALOGO_MAX) return null; // sair do for await cancela o resto do corpo
      partes.push(b);
    }
    return Buffer.concat(partes).toString('utf8');
  }
  async function baixar() {
    if (!url) return false;
    try {
      const res = await fetch(url, {
        headers: { ...headers, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) { await res.body?.cancel(); return false; }
      const t = await lerAte(res);
      if (t === null) return false;
      const j = JSON.parse(t);
      const lista = !j ? null
        : Array.isArray(j.codigos) ? j.codigos
          : Array.isArray(j.produtos) ? j.produtos.map((p) => p && p.c) : null;
      if (!lista) return false;
      const s = new Set();
      for (const v of lista) {
        const c = normalizarCodigo(v);
        if (c) s.add(c);
      }
      if (!s.size) return false;
      codigos = s;
      return true;
    } catch {
      return false;
    }
  }

  async function ciclo() {
    const ok = await baixar();
    log(ok ? `catalogo ok ${codigos.size}` : 'catalogo indisponivel');
    setTimeout(ciclo, ok ? RENOVAR_MS : TENTAR_DE_NOVO_MS).unref();
  }

  return {
    iniciar() { if (url) ciclo(); else log('catalogo indisponivel'); },
    pronto: () => codigos !== null,
    tem: (c) => codigos !== null && codigos.has(c),
  };
}
