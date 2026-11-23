/* Catálogos, materiais e treinamentos (T-0022, T-0024, T-0032): os arquivos lidos de GET /api/pdfs, em 3 grupos, cada um com o botão de
   baixar (GET /admin/pdfs/baixar/:id). Só o admin abre esta página: quem decide é o servidor (os outros recebem 404).
   Contrato: GET /api/pdfs no servicos/login/LEIA.md.
   Os itens com o mesmo "par" viram um cartão só, na ordem da lista (o 1º é o botão principal). A junção vem só desse
   campo da lista fixa do serviço: o nome do arquivo nunca decide nada aqui. */
(function () {
  "use strict";
  const F = window.BAPForm;
  const { esc, api } = window.BAP;
  const lugar = document.getElementById("pdfs");
  const GRUPOS = [["catalogos", "Catálogos"], ["materiais", "Apresentações e materiais"], ["treinamentos", "Treinamentos"]];
  const USO = { // o uso de cada cartão, em uma frase (a chave é o "par" ou o id; a lista é fixa no serviço)
    "completo-digital": "Todos os itens, para ver na tela.",
    "a4-grafica": "Para mandar imprimir na gráfica.",
    "linha-moto": "Só os itens de moto, para ver na tela.",
    portfolio: "A BAP e todas as linhas, por sistema e família.",
    lubrificantes: "A apresentação comercial: em PDF para ver ou enviar, em PowerPoint para editar.",
    "kit-filtros": "Os kits de filtros de cada veículo.",
    "portfolio-leve": "Só a linha leve, por sistema e família.",
    "portfolio-pesada": "Só a linha pesada, por sistema e família.",
    "portfolio-moto": "Só a linha de moto, por sistema e família.",
    "portfolio-lubrificantes": "Só os lubrificantes e químicos, por sistema e família.",
    "portfolio-acessorios": "Só os acessórios, por sistema e família.",
    "portfolio-baterias": "Só as baterias, por sistema e família.",
    "portfolio-autocenter": "Só a linha autocenter, por sistema e família.",
    "treinamento-mecanica-basica": "Mecânica básica para os vendedores: em PDF para ler, em PowerPoint para apresentar.",
    "treinamento-baterias": "Baterias para os vendedores: em PDF para ler, em PowerPoint para apresentar.",
    "treinamento-linha-moto": "A linha de moto para os vendedores: em PDF para ler, em PowerPoint para apresentar.",
    "treinamento-lubrificantes": "Lubrificantes para os vendedores: em PDF para ler, em PowerPoint para apresentar.",
  };
  const NOME_TIPO = { pdf: "PDF", pptx: "PowerPoint" }; // o tipo vem da lista do serviço; sem ele, é PDF
  const IC_BAIXAR = window.BAPConta.IC.pdf;
  // em bytes: 5917348 → "5,6 MB"; abaixo de 1 MB, 254976 → "249 KB"
  const tamanho = (t) => {
    if (t < 1048576) return Math.max(1, Math.round(t / 1024)) + " KB";
    return (t / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " MB";
  };
  // o nome do arquivo quebra depois do "_" no celular, nunca no meio da palavra
  const arquivo = (a) => esc(a).replace(/_/g, "_<wbr>");
  const nbsp = (s) => esc(s).replace(/ /g, "&nbsp;");
  const disponivel = (p) => !!p.tamanho; // o que falta vem com arquivo, tamanho e data nulos
  const nomeTipo = (p) => NOME_TIPO[p.tipo] || NOME_TIPO.pdf;

  // os dados do que existe; no par, cada valor leva o tipo na frente ("PDF 6,6 MB · PowerPoint 7,3 MB"), mesmo com 1 só
  function dados(tem, par) {
    if (!tem.length) return "";
    if (!par) {
      const [p] = tem;
      return `<dl><dt>Arquivo</dt><dd>${arquivo(p.arquivo)}</dd><dt>Tamanho</dt><dd>${esc(tamanho(p.tamanho))}</dd><dt>Atualizado em</dt><dd>${esc(F.quando(p.data))}</dd></dl>`;
    }
    const ext = (a) => (/\.[^.]+$/.exec(a) || [""])[0];
    const raiz = (a) => String(a).slice(0, String(a).length - ext(a).length);
    const mesmaRaiz = tem.every((p) => raiz(p.arquivo) === raiz(tem[0].arquivo));
    const arq = mesmaRaiz ? `${arquivo(raiz(tem[0].arquivo))} (${tem.map((p) => esc(ext(p.arquivo))).join(" e ")})` : tem.map((p) => arquivo(p.arquivo)).join(" · ");
    const tam = tem.map((p) => `${nomeTipo(p)}&nbsp;${nbsp(tamanho(p.tamanho))}`).join(" · ");
    const datas = tem.map((p) => F.quando(p.data));
    const data = datas.every((d) => d === datas[0]) ? esc(datas[0]) : tem.map((p, i) => `${nomeTipo(p)}&nbsp;${esc(datas[i])}`).join(" · ");
    return `<dl><dt>Arquivo</dt><dd>${arq}</dd><dt>Tamanho</dt><dd>${tam}</dd><dt>Atualizado em</dt><dd>${data}</dd></dl>`;
  }

  function cartao(c) {
    const titulo = esc(c.itens[0].titulo || c.itens[0].id);
    const uso = USO[c.chave];
    const tem = c.itens.filter(disponivel);
    const par = c.itens.length > 1;
    const botao = (p, i) => {
      const cls = i ? "bt bt-claro" : "bt"; // no par, o 2º é o secundário
      const txt = `${IC_BAIXAR}Baixar ${nomeTipo(p)}<span class="vh"> · ${titulo}</span>`;
      return disponivel(p)
        ? `<a class="${cls}" href="/admin/pdfs/baixar/${encodeURIComponent(p.id)}" download>${txt}</a>`
        : `<button type="button" class="${cls}" disabled>${txt}</button>`;
    };
    // o que falta: no cartão de 1 arquivo, a frase geral; no par, uma frase por arquivo, e só aquele botão desabilita
    const fora = par
      ? c.itens.filter((p) => !disponivel(p)).map((p) => `<p class="pdf-fora">O ${nomeTipo(p)} não está disponível agora.</p>`).join("")
      : tem.length ? "" : '<p class="pdf-fora">Este arquivo não está disponível agora. Tente de novo mais tarde.</p>';
    const bts = par ? `<div class="pdf-bts">${c.itens.map(botao).join("")}</div>` : botao(c.itens[0], 0);
    return `<article class="painel pdf">
      <div class="pdf-cab"><span class="pdf-ic" aria-hidden="true">PDF</span><div><h3>${titulo}</h3>${uso ? `<p class="pdf-uso">${uso}</p>` : ""}</div></div>
      ${dados(tem, par)}
      ${fora}${bts}
    </article>`;
  }

  function montar(lista) {
    const cartoes = [];
    const porPar = new Map();
    for (const p of lista) {
      if (p.par && porPar.has(p.par)) { porPar.get(p.par).itens.push(p); continue; }
      // [SUPOSIÇÃO] um grupo fora dos conhecidos (ou sem grupo) vai para o 1º: o arquivo aparece, em vez de sumir
      const grupo = GRUPOS.some(([g]) => g === p.grupo) ? p.grupo : GRUPOS[0][0];
      const c = { chave: p.par || p.id, grupo, itens: [p] };
      if (p.par) porPar.set(p.par, c);
      cartoes.push(c);
    }
    return GRUPOS.map(([g, nome]) => {
      const doGrupo = cartoes.filter((c) => c.grupo === g);
      if (!doGrupo.length) return "";
      return `<section class="pdf-grupo" aria-labelledby="grupo-${g}">
        <h2 class="pdf-grupo-tit" id="grupo-${g}">${nome}</h2>
        <div class="pdfs">${doGrupo.map(cartao).join("")}</div>
      </section>`;
    }).join("");
  }

  api("GET", "/api/pdfs").then((r) => { // o 401 o api leva ao login
    if (r.status !== 200 || !Array.isArray(r.dados)) {
      F.caixa(lugar, "erro", F.frase("Não foi possível carregar os arquivos agora.", "Atualize a página em instantes."));
      return;
    }
    lugar.innerHTML = r.dados.length ? montar(r.dados) : '<p class="carregando">Nenhum arquivo por enquanto.</p>';
  });
})();
