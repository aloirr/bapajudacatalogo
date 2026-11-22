/* Catálogos em PDF (T-0022): os 2 cartões lidos de GET /api/pdfs, cada um com o "Baixar PDF"
   (GET /admin/pdfs/baixar/:id). Só o admin abre esta página: quem decide é o servidor (os outros recebem 404). */
(function () {
  "use strict";
  const F = window.BAPForm;
  const lugar = document.getElementById("pdfs");
  const USO = { // o uso de cada PDF, em uma frase (a lista é fixa no serviço)
    "completo-digital": "Para enviar aos clientes e ver na tela.",
    "a4-grafica": "Para mandar imprimir na gráfica.",
  };
  const IC_BAIXAR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15l3 3 3-3"/></svg>';
  // 5917348 → "5,6 MB" (o número em bytes; um texto pronto passa como veio)
  const tamanho = (t) => (typeof t === "number" && t > 0 ? (t / 1048576).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + " MB" : String(t || ""));
  const quando = (d) => {
    const x = new Date(d);
    if (!d || isNaN(x)) return String(d || "");
    const o = { timeZone: "America/Manaus" };
    return x.toLocaleDateString("pt-BR", o) + " às " + x.toLocaleTimeString("pt-BR", { ...o, hour: "2-digit", minute: "2-digit" });
  };
  // o nome do arquivo quebra depois do "_" no celular, nunca no meio da palavra
  const arquivo = (a) => F.esc(a).replace(/_/g, "_<wbr>");

  function cartao(p) {
    const ok = p.disponivel !== false && !!p.tamanho;
    const titulo = F.esc(p.titulo || p.id);
    const bt = ok
      ? `<a class="bt" href="/admin/pdfs/baixar/${encodeURIComponent(p.id)}" download>${IC_BAIXAR}Baixar PDF<span class="vh"> do ${titulo}</span></a>`
      : `<p class="pdf-fora">Este PDF não está disponível agora. Tente de novo mais tarde.</p><button type="button" class="bt" disabled>${IC_BAIXAR}Baixar PDF<span class="vh"> do ${titulo}</span></button>`;
    return `<article class="painel pdf">
      <div class="pdf-cab"><span class="pdf-ic" aria-hidden="true">PDF</span><div><h2>${titulo}</h2>${USO[p.id] ? `<p class="pdf-uso">${USO[p.id]}</p>` : ""}</div></div>
      ${ok ? `<dl><dt>Arquivo</dt><dd>${arquivo(p.arquivo)}</dd><dt>Tamanho</dt><dd>${F.esc(tamanho(p.tamanho))}</dd><dt>Atualizado em</dt><dd>${F.esc(quando(p.data))}</dd></dl>` : ""}
      ${bt}
    </article>`;
  }

  F.api("GET", "/api/pdfs").then((r) => {
    if (r.status === 401) { F.expirou(); return; }
    if (r.status !== 200 || !Array.isArray(r.dados)) {
      F.caixa(lugar, "erro", F.frase("Não foi possível carregar os catálogos agora.", "Atualize a página em instantes."));
      return;
    }
    lugar.innerHTML = r.dados.length ? r.dados.map(cartao).join("") : '<p class="carregando">Nenhum catálogo em PDF por enquanto.</p>';
  });
})();
