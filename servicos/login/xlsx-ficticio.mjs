// xlsx FICTÍCIO para testes (T-0034). Só para teste: o serviço não importa este arquivo.
// Usado por servicos/login/login.test.mjs e testes/estoque-t0034.mjs. Node 20+, só zlib.
//
// API:
//   zipar(arquivos) -> Buffer
//     arquivos: { "caminho/no/zip": string | Buffer, ... }. Cada parte vai com deflate e CRC-32.
//   xlsxFicticio(cabecalho, linhas, { inline = [] } = {}) -> Buffer
//     cabecalho: ["DATA", "HORA", "CIDADE", ...] (a 1ª linha da aba);
//     linhas: [{ DATA: ..., CIDADE: ..., ... }, ...] (chave = nome da coluna do cabeçalho);
//     valor número -> célula numérica; texto -> sharedStrings (t="s"); null ou ausente -> célula vazia (autofechada);
//     inline: colunas cujo texto vai em inlineStr (os dois jeitos do Excel), ex.: ["DESCRICAO_PRODUTO"].
//   A aba se chama ESTOQUE_BAP e fica em xl/worksheets/sheet1.xml, achada pelo workbook.xml e pelo .rels.
// Nunca ponha aqui dado real da BAP (preço, custo, estoque): o repositório é público.
import zlib from 'node:zlib';

const TAB_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = TAB_CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

export function zipar(arquivos) {
  const locais = [];
  const centrais = [];
  let off = 0;
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const cru = Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo, 'utf8');
    const comp = zlib.deflateRawSync(cru);
    const n = Buffer.from(nome);
    const crc = crc32(cru);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(cru.length, 22); h.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(cru.length, 24); c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(off, 42);
    locais.push(h, n, comp);
    centrais.push(c, n);
    off += 30 + n.length + comp.length;
  }
  const dir = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0); fim.writeUInt16LE(centrais.length / 2, 8); fim.writeUInt16LE(centrais.length / 2, 10);
  fim.writeUInt32LE(dir.length, 12); fim.writeUInt32LE(off, 16);
  return Buffer.concat([...locais, dir, fim]);
}

const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Índice (0 = A) -> letra da coluna (A..Z, AA..AZ, ...).
const letra = (i) => (i < 26 ? String.fromCharCode(65 + i) : letra(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)));

export function xlsxFicticio(cabecalho, linhas, { inline = [] } = {}) {
  const emLinha = new Set(inline);
  const ss = [];
  const idx = new Map();
  const comp = (s) => { if (!idx.has(s)) { idx.set(s, ss.length); ss.push(s); } return idx.get(s); };
  const cel = (ref, v, col) => {
    if (v === null || v === undefined) return `<c r="${ref}"/>`;
    if (typeof v === 'number') return `<c r="${ref}" t="n"><v>${v}</v></c>`;
    if (emLinha.has(col)) return `<c r="${ref}" t="inlineStr"><is><t>${xmlEsc(v)}</t></is></c>`;
    return `<c r="${ref}" t="s"><v>${comp(String(v))}</v></c>`;
  };
  const rows = [cabecalho.map((h, i) => cel(`${letra(i)}1`, h, null)).join('')];
  linhas.forEach((l, k) => rows.push(cabecalho.map((h, i) => cel(`${letra(i)}${k + 2}`, l[h], h)).join('')));
  const sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
    + rows.map((r, i) => `<row r="${i + 1}">${r}</row>`).join('') + '</sheetData></worksheet>';
  return zipar({
    '[Content_Types].xml': '<Types/>',
    'xl/workbook.xml': '<workbook xmlns:r="r"><sheets><sheet name="ESTOQUE_BAP" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/sharedStrings.xml': `<sst>${ss.map((s) => `<si><t>${xmlEsc(s)}</t></si>`).join('')}</sst>`,
    'xl/worksheets/sheet1.xml': sheet,
  });
}
