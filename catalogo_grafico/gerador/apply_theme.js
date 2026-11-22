// Tema "BAP" no PowerPoint (T-0023): grava o THEME do apres_ppt.js no ppt/theme/theme1.xml do arquivo gerado.
// O pptxgenjs sai com o tema "Office"; os slides usam as cores do tema (pres.SchemeColor), então sem isto as cores mudam.
// Troca o nome do tema, do esquema de cores e do esquema de fontes e as 12 cores; o resto do theme1.xml fica como veio.
// Dependência: jszip, que já vem instalado com o pptxgenjs (npm install pptxgenjs).
const fs = require('fs');
const JSZip = require('jszip');

const TEMA = 'ppt/theme/theme1.xml';
const CORES = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];

async function applyTheme(arquivo, THEME) {
  const zip = await JSZip.loadAsync(fs.readFileSync(arquivo));
  let x = await zip.file(TEMA).async('string');
  x = x.replace(/(<a:theme\b[^>]*?\bname=")[^"]*"/, `$1${THEME.name}"`)
       .replace(/<a:clrScheme name="[^"]*">/, `<a:clrScheme name="${THEME.name}">`)
       .replace(/<a:fontScheme name="[^"]*">/, `<a:fontScheme name="${THEME.name}">`);
  for (const k of CORES) {
    if (!THEME.colors[k]) throw new Error(`THEME sem a cor ${k}`);
    x = x.replace(new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`), `<a:${k}><a:srgbClr val="${THEME.colors[k]}"/></a:${k}>`);
  }
  zip.file(TEMA, x);
  fs.writeFileSync(arquivo, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

module.exports = { applyTheme };
