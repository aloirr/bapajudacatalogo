// Aba Estoque (T-0034). Node 20+, sem dependências: o xlsx é lido só com zlib.
// A fonte é o ESTOQUE_BAP.xlsx da BAP Central (repositório público, leitura sem chave), baixado uma vez a cada
// publicação e guardado SÓ na memória. Nada daqui vai para o disco, para o site/ nem para o log.
// O corte das colunas é feito aqui, no servidor, por lista branca: o vendedor nunca recebe custo, preço nem markup.
import zlib from 'node:zlib';

export const FONTE_ESTOQUE = 'https://raw.githubusercontent.com/aloirr/bapcentral/main/RELATORIOS/ESTOQUE_BAP.xlsx';
const DOWNLOAD_MAX = 50 * 1024 * 1024;      // o xlsx real tem ~2,3 MB
const XML_MAX = 300 * 1024 * 1024;          // descompactado (~25 MB hoje); trava contra zip-bomba
const DOWNLOAD_MS = 60000;
export const LIMITE_PADRAO = 50;
export const LIMITE_MAX = 200;
const BUSCA_MAX = 200;                      // caracteres da busca
const TERMOS_MAX = 20;

// Rótulos e tipos (iguais aos da simulação aprovada, f92b7b6). tipo: texto | numero | dinheiro | markup.
const COLUNAS = {
  CIDADE: ['Filial', 'texto'],
  FILIAL_BAP: ['Nº filial', 'texto'],
  COD_PRODUTO: ['Código', 'texto'],
  DESCRICAO_PRODUTO: ['Descrição', 'texto'],
  FORNECEDOR: ['Fornecedor', 'texto'],
  ESTOQUE: ['Estoque', 'numero'],
  PPEDIDO: ['Custo do produto', 'dinheiro'],
  CUSTO_TOTAL: ['Custo total', 'dinheiro'],
  PRECO_CAPITAL: ['Preço capital', 'dinheiro'],
  PRECO_INTERIOR: ['Preço interior', 'dinheiro'],
  MARKUP_CAPITAL: ['Markup capital', 'markup'],
  MARKUP_INTERIOR: ['Markup interior', 'markup'],
  TABELA_CAPITAL: ['Tabela capital', 'texto'],
  TABELA_INTERIOR: ['Tabela interior', 'texto'],
  SUCATA: ['Sucata', 'dinheiro'],
  ORIGEM_CUSTO: ['Origem do custo', 'texto'],
  ID_PRODUTO: ['ID do produto', 'texto'],
  COD_FORNECEDOR: ['Cód. fornecedor', 'texto'],
  FILIAL_CD: ['Filial CD', 'texto'],
  CATEGORIA: ['Categoria', 'texto'],
  SISTEMA: ['Sistema', 'texto'],
  FAMILIA: ['Família', 'texto'],
  LINHA: ['Linha', 'texto'],
};
// Lista branca do vendedor (decisão 2a), nesta ordem. Nenhuma outra coluna sai para quem não é admin.
export const COLUNAS_VENDEDOR = ['CIDADE', 'FILIAL_BAP', 'COD_PRODUTO', 'DESCRICAO_PRODUTO', 'FORNECEDOR', 'ESTOQUE'];
// Admin: Filial, Nº filial, Código, Descrição, Estoque, os custos, preços e markups e depois as demais (sem DATA e HORA).
export const COLUNAS_ADMIN = [
  'CIDADE', 'FILIAL_BAP', 'COD_PRODUTO', 'DESCRICAO_PRODUTO', 'ESTOQUE',
  'PPEDIDO', 'CUSTO_TOTAL', 'PRECO_CAPITAL', 'PRECO_INTERIOR', 'MARKUP_CAPITAL', 'MARKUP_INTERIOR',
  'FORNECEDOR', 'TABELA_CAPITAL', 'TABELA_INTERIOR', 'SUCATA', 'ORIGEM_CUSTO',
  'ID_PRODUTO', 'COD_FORNECEDOR', 'FILIAL_CD', 'CATEGORIA', 'SISTEMA', 'FAMILIA', 'LINHA',
];
// Sem estas a aba não tem sentido: a carga falha (503). As outras, se sumirem da planilha, vão como null.
const OBRIGATORIAS = ['DATA', 'HORA', 'CIDADE', 'FILIAL_BAP', 'COD_PRODUTO', 'DESCRICAO_PRODUTO', 'ESTOQUE'];
const NUMERICAS = new Set(Object.keys(COLUNAS).filter((c) => COLUNAS[c][1] !== 'texto'));

// Nome de exibição das cidades (mapa da simulação; "Mato Grosso": R-20261124-213943-alexandre).
const CIDADES = {
  'BELÉM': 'Belém', 'BOA VISTA': 'Boa Vista', 'MACAPÁ': 'Macapá', 'MANAUS': 'Manaus',
  'MATOGROSSO': 'Mato Grosso', 'SANTARÉM': 'Santarém', 'SÃO LUIS': 'São Luís',
};
export const nomeCidade = (c) => (c == null ? null : CIDADES[c] || String(c));

export const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------- zip (só o necessário: diretório central, "stored" e "deflate") ----------
function lerZip(buf) {
  let fim = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { fim = i; break; }
  }
  if (fim < 0) throw new Error('zip');
  const total = buf.readUInt16LE(fim + 10);
  let p = buf.readUInt32LE(fim + 16);
  const entradas = new Map();
  for (let k = 0; k < total; k++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('zip');
    const metodo = buf.readUInt16LE(p + 10);
    const tamComp = buf.readUInt32LE(p + 20);
    const tamNome = buf.readUInt16LE(p + 28);
    const tamExtra = buf.readUInt16LE(p + 30);
    const tamComent = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nome = buf.toString('utf8', p + 46, p + 46 + tamNome);
    entradas.set(nome, { metodo, tamComp, local });
    p += 46 + tamNome + tamExtra + tamComent;
  }
  return (nome) => {
    const e = entradas.get(nome);
    if (!e) return null;
    const l = e.local;
    if (l + 30 > buf.length || buf.readUInt32LE(l) !== 0x04034b50) throw new Error('zip');
    const ini = l + 30 + buf.readUInt16LE(l + 26) + buf.readUInt16LE(l + 28);
    const dados = buf.subarray(ini, ini + e.tamComp);
    if (e.metodo === 0) return dados.toString('utf8');
    if (e.metodo === 8) return zlib.inflateRawSync(dados, { maxOutputLength: XML_MAX }).toString('utf8');
    throw new Error('zip');
  };
}

// ---------- xml (o mínimo do SpreadsheetML) ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const desescapar = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, e) => {
  if (e[0] !== '#') return ENT[e];
  const n = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
  return n <= 0x10ffff ? String.fromCodePoint(n) : '';
});
// Junta os <t> de um <si> ou <is> (texto com formatação vem em vários <r><t>).
const textoDe = (xml) => {
  let s = '';
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) s += m[1];
  return desescapar(s);
};
const atributo = (attrs, nome) => {
  const m = new RegExp(`(?:^|\\s)${nome}="([^"]*)"`).exec(attrs);
  return m ? m[1] : null;
};
function indiceColuna(ref) {
  const m = /^([A-Z]+)/.exec(ref || '');
  if (!m) return -1;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

// Lê a 1ª aba do xlsx: devolve as linhas como arrays (texto, número, booleano ou null).
export function lerXlsx(buf) {
  const ler = lerZip(buf);
  let alvo = 'xl/worksheets/sheet1.xml';
  const wb = ler('xl/workbook.xml');
  const rels = ler('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const sheet = /<sheet\b([^>]*)\/?>/.exec(wb);
    const rid = sheet ? atributo(sheet[1], 'r:id') : null;
    for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
      if (rid && atributo(m[1], 'Id') === rid) {
        const t = atributo(m[1], 'Target');
        if (t) alvo = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
      }
    }
  }
  const compartilhadas = [];
  const ss = ler('xl/sharedStrings.xml');
  if (ss) for (const m of ss.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) compartilhadas.push(textoDe(m[1]));
  const xml = ler(alvo);
  if (!xml) throw new Error('aba');
  const linhas = [];
  for (const r of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const linha = [];
    if (r[1]) {
      let pos = 0;
      for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1];
        const dentro = c[2] || '';
        const i = indiceColuna(atributo(attrs, 'r'));
        const col = i >= 0 ? i : pos;
        pos = col + 1;
        const t = atributo(attrs, 't') || 'n';
        const v = /<v>([\s\S]*?)<\/v>/.exec(dentro);
        let valor = null;
        if (t === 'inlineStr') valor = textoDe(dentro);
        else if (t === 's') valor = v ? compartilhadas[Number(v[1])] ?? null : null;
        else if (t === 'str') valor = v ? desescapar(v[1]) : null;
        else if (t === 'b') valor = v ? v[1] === '1' : null;
        else if (t === 'e') valor = null;
        else if (v && v[1] !== '') { const n = Number(v[1]); valor = Number.isFinite(n) ? n : null; }
        if (typeof valor === 'string' && valor === '') valor = null;
        linha[col] = valor;
      }
    }
    for (let k = 0; k < linha.length; k++) if (linha[k] === undefined) linha[k] = null;
    linhas.push(linha);
  }
  return linhas;
}

// Data e hora da posição: texto ("19/11/2026", "16:48") ou número de série do Excel.
const dois = (n) => String(n).padStart(2, '0');
function textoData(v) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date(Math.round((v - 25569) * 86400000));
    return `${dois(d.getUTCDate())}/${dois(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
  }
  return v == null ? null : String(v).trim();
}
function textoHora(v) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    const min = Math.round((v - Math.floor(v)) * 1440) % 1440;
    return `${dois(Math.floor(min / 60))}:${dois(min % 60)}`;
  }
  return v == null ? null : String(v).trim();
}
const textoCelula = (v) => (v == null ? null : typeof v === 'string' ? v.trim() || null : String(v));
const numeroCelula = (v) => {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Planilha (arrays) -> base em memória: linhas na ordem de COLUNAS_ADMIN, índice de busca e filiais.
export function montarBase(tabela) {
  const cab = (tabela[0] || []).map((h) => (h == null ? '' : String(h).trim().toUpperCase()));
  const pos = Object.fromEntries(cab.map((h, i) => [h, i]).filter(([h]) => h));
  const faltam = OBRIGATORIAS.filter((c) => !(c in pos));
  if (faltam.length) throw new Error('colunas');
  const linhas = [];
  const indice = [];
  const filiais = new Map();
  let posicao = null;
  for (let r = 1; r < tabela.length; r++) {
    const bruta = tabela[r];
    if (!bruta || bruta.every((v) => v == null)) continue;
    if (!posicao) posicao = { data: textoData(bruta[pos.DATA]), hora: textoHora(bruta[pos.HORA]) };
    const linha = COLUNAS_ADMIN.map((c) => {
      const v = c in pos ? bruta[pos[c]] : null;
      return NUMERICAS.has(c) ? numeroCelula(v) : textoCelula(v);
    });
    const cidadeBruta = linha[0];
    linha[0] = nomeCidade(cidadeBruta);
    const val = (c) => linha[COLUNAS_ADMIN.indexOf(c)];
    indice.push(normalizar([val('COD_PRODUTO'), val('COD_FORNECEDOR'), val('ID_PRODUTO'), val('DESCRICAO_PRODUTO'),
      val('FORNECEDOR'), cidadeBruta, linha[0], val('FILIAL_BAP')].filter((x) => x != null).join(' ')));
    if (val('FILIAL_BAP') != null && !filiais.has(val('FILIAL_BAP'))) filiais.set(val('FILIAL_BAP'), linha[0]);
    linhas.push(linha);
  }
  if (!linhas.length) throw new Error('vazia');
  const listaFiliais = [...filiais].map(([numero, nome]) => ({ numero, nome }))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR') || a.numero.localeCompare(b.numero));
  return { posicao, linhas, indice, filiais: listaFiliais };
}

// Baixa a fonte (com limite de tamanho e de tempo). Erro: exceção sem dado nenhum da resposta.
async function baixar(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_MS), redirect: 'follow' });
  if (!r.ok) throw new Error('http');
  const decl = Number(r.headers.get('content-length'));
  if (Number.isFinite(decl) && decl > DOWNLOAD_MAX) throw new Error('grande');
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length > DOWNLOAD_MAX) throw new Error('grande');
  return b;
}

// Estado da aba: 'carregando' -> 'ok' | 'falhou'. carregar() nunca rejeita (o catálogo segue no ar).
export function criarEstoque({ url = FONTE_ESTOQUE, log = () => {}, agora = Date.now } = {}) {
  let base = null;
  let estado = 'carregando';
  async function carregar() {
    const t0 = agora();
    try {
      if (!url) throw new Error('sem fonte');
      base = montarBase(lerXlsx(await baixar(url)));
      estado = 'ok';
      log(`estoque ok ${base.linhas.length} linhas ${agora() - t0}ms`);
    } catch {
      base = null;
      estado = 'falhou';
      log('estoque indisponivel');
    }
  }
  const pronto = carregar();

  // Consulta. admin = true: as 23 colunas; senão, só a lista branca do vendedor.
  function consultar({ q = '', filial = '', comEstoque = false, desde = 0, limite = LIMITE_PADRAO, admin = false }) {
    if (!base) return null;
    const campos = admin ? COLUNAS_ADMIN : COLUNAS_VENDEDOR;
    const idx = campos.map((c) => COLUNAS_ADMIN.indexOf(c));
    const iFilial = COLUNAS_ADMIN.indexOf('FILIAL_BAP');
    const iEstoque = COLUNAS_ADMIN.indexOf('ESTOQUE');
    const termos = normalizar(String(q).slice(0, BUSCA_MAX)).split(/\s+/).filter(Boolean).slice(0, TERMOS_MAX);
    const achadas = [];
    for (let i = 0; i < base.linhas.length; i++) {
      const l = base.linhas[i];
      if (filial && l[iFilial] !== filial) continue;
      if (comEstoque && (l[iEstoque] == null || l[iEstoque] === 0)) continue;
      if (termos.length && !termos.every((t) => base.indice[i].includes(t))) continue;
      achadas.push(l);
    }
    return {
      posicao: { ...base.posicao },
      colunas: campos.map((c) => ({ campo: c, rotulo: COLUNAS[c][0], tipo: COLUNAS[c][1] })),
      total: achadas.length,
      desde,
      limite,
      linhas: achadas.slice(desde, desde + limite).map((l) => Object.fromEntries(campos.map((c, k) => [c, l[idx[k]]]))),
      filiais: base.filiais.map((f) => ({ ...f })),
    };
  }
  return { pronto, consultar, estado: () => estado, tamanho: () => (base ? base.linhas.length : 0) };
}
