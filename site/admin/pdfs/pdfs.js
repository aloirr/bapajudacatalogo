/* Catálogos em PDF (T-0022): os 2 cartões lidos de GET /api/pdfs, cada um com o "Baixar PDF"
   (GET /admin/pdfs/baixar/:id). Só o admin abre esta página: quem decide é o servidor (os outros recebem 404). */
(function () {
  "use strict";
  const F = window.BAPForm;
  const { esc, api } = window.BAP;
  const lugar = document.getElementById("pdfs");
  const USO = { // o uso de cada PDF, em uma frase (a lista é fixa no serviço)
    "completo-digital": "Para enviar aos clientes e ver na tela.",
    "a4-grafica": "Para mandar imprimir na gráfica.",
  };
  const IC_BAIXAR = window.BAPConta.IC.pdf;
  // 5917348 → "5,6 MB" (o número em bytes; um texto pronto passa como veio)
  const tamanho = (t) => (typeof t === "number" && t > 0 ? (t / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " MB" : String(t || ""));
  // o nome do arquivo quebra depois do "_" no celular, nunca no meio da palavra
  const arquivo = (a) => esc(a).replace(/_/g, "_<wbr>");

  function cartao(p) {
    const ok = p.disponivel !== false && !!p.tamanho;
    const titulo = esc(p.titulo || p.id);
    const bt = ok
      ? `<a class="bt" href="/admin/pdfs/baixar/${encodeURIComponent(p.id)}" download>${IC_BAIXAR}Baixar PDF<span class="vh"> do ${titulo}</span></a>`
      : `<p class="pdf-fora">Este PDF não está disponível agora. Tente de novo mais tarde.</p><button type="button" class="bt" disabled>${IC_BAIXAR}Baixar PDF<span class="vh"> do ${titulo}</span></button>`;
    return `<article class="painel pdf">
      <div class="pdf-cab"><span class="pdf-ic" aria-hidden="true">PDF</span><div><h2>${titulo}</h2>${USO[p.id] ? `<p class="pdf-uso">${USO[p.id]}</p>` : ""}</div></div>
      ${ok ? `<dl><dt>Arquivo</dt><dd>${arquivo(p.arquivo)}</dd><dt>Tamanho</dt><dd>${esc(tamanho(p.tamanho))}</dd><dt>Atualizado em</dt><dd>${esc(F.quando(p.data))}</dd></dl>` : ""}
      ${bt}
    </article>`;
  }

  api("GET", "/api/pdfs").then((r) => { // o 401 o api leva ao login
    if (r.status !== 200 || !Array.isArray(r.dados)) {
      F.caixa(lugar, "erro", F.frase("Não foi possível carregar os catálogos agora.", "Atualize a página em instantes."));
      return;
    }
    lugar.innerHTML = r.dados.length ? r.dados.map(cartao).join("") : '<p class="carregando">Nenhum catálogo em PDF por enquanto.</p>';
  });
})();
