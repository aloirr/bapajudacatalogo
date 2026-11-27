# Parecer de UX · T-0040 v30 · simulação do site (veículo sem ano oculto e aviso sem aplicação)

- **Agente:** designer-ux · 27/11/2026 (Manaus)
- **Revisado:** branch `web-site/T-0040-v30`, commit `e1f544a4ae155601c99caf623f2182d8d3a92074`, sobre o main `601d714`. Arquivos: `site/app.js` (`tabelaDe`, `semAplicacao`, `AVISO_SEM_APL`, `produtoHtml` e o cartão) e `docs/DADOS_DO_SITE.md`.
- **Decisões do Alexandre (via po, R-20261127-135625):**
  - 1a: o veículo sem ano fica oculto no site;
  - 2a: o produto sem aplicação mostra "Aplicação em revisão; consulte o vendedor."
- **Prints conferidos** (pasta de rascunho t40v30site/prints do gerente), antes e depois, em 1366 e 390 px: BCE3001, CFR9017, KI20, FLU15001, a busca "ford ka" e a busca "axor 1933".
- **Resultado: AJUSTAR.** Um ponto (o 6, abaixo). O resto está pronto para ir ao Alexandre.

## 1. O texto e o lugar do aviso (🟢)
- **Texto:** "Aplicação em revisão; consulte o vendedor." é a frase decidida pelo Alexandre. É curta, diz o problema e a ação, e não usa palavra interna.
- **Lugar:** o aviso usa o mesmo `div.aviso` do "Confira sempre a aplicação…", dentro da seção Aplicação, na página e na janela. Fica no lugar onde a aplicação estaria, e não se repete em outra seção.
- **O aviso de sempre:** no produto sem aplicação, o "Confira sempre a aplicação no veículo antes da compra." sai (`produtoHtml`). Está certo: não há o que conferir, e a página fica com um aviso só.
- **Prints:** CFR9017 e KI20, em 390 px.

## 2. Hierarquia (🟢)
- A seção Aplicação continua na mesma ordem: antes das Referências cruzadas e da Ficha técnica.
- No produto sem aplicação, a seção vira uma caixa de uma linha. As Referências e a Ficha sobem, acima da dobra do celular (CFR9017 e KI20, em 390 px). É o que o balconista usa nesse caso: a referência para cruzar.

## 3. O cartão (🟢, com a ressalva do ponto 6)
- O `span.apl` mostra o aviso no mesmo lugar e no mesmo cinza do texto da aplicação.
- O cartão não muda de altura e a lista não desalinha. Na busca "axor 1933" em 1366 px, CFR9012, CFR9017, INT16516 e INT16565 seguem o grid de 4 colunas. Em 390 px, o cartão fica com 2 colunas.
- Sem caixa alta nova e sem cor nova.

## 4. Celular (🟢)
- Em 390 px, nada rola para o lado (BCE3001, CFR9017, KI20, FLU15001 e as duas buscas).
- O aviso quebra em duas linhas no cartão estreito, sem cortar a frase.
- A tabela da BCE3001 ficou mais curta (sem Ka, Fiesta, Versailles, Parati, Logus, Polo e Palio Weekend), com a cilindrada no título e o motor e o ano na segunda linha.

## 5. Coerência quando parte dos veículos some
- **Página (🟢):**
  - a BCE3001 mostra só as linhas com ano, sem buraco nem linha vazia;
  - a impressão não traz a "Aplicação completa", que citaria os veículos ocultos. Uma informação, um lugar;
  - o FLU15001 (universal, sem linha na VEICULOS) continua com o texto, como antes.
- **Busca por veículo e lista "ford ka" (🟢):** usam só o `ve`. Um produto com o Ka oculto não aparece no filtro do Ka.
- **Busca digitada (ver o ponto 6):** continua lendo o texto. "ka" ainda acha a BCE3001, e "axor 1933" ainda acha o CFR9017.
  - No produto com tudo oculto, isso é aceitável: o cartão já diz "Aplicação em revisão; consulte o vendedor.", e o balconista sabe que precisa confirmar.
  - No produto com só parte oculta, não é aceitável (ponto 6).

## 6. 🟡 AJUSTAR: o cartão do produto `vo` mostra o texto que cita os veículos ocultos
- **Onde:** no cartão da lista (`site/app.js`, `span.apl`), quando `semAplicacao(p)` é falso e o produto tem `p.vo`.
- **O que acontece:** o cartão mostra `p.a`, o texto da APLICACAO, que cita os veículos ocultos.
- **Exemplo** (lido no código e no `DADOS_DO_SITE.md`; não há print desta busca no pacote): na busca "ka", o cartão da BCE3001 diz "… Ford Ka …". O balconista toca em "+ Detalhes" e a tabela não tem o Ka.
- Para quem tem pressa, isso parece erro do catálogo ou peça que não serve. É exatamente a contradição que a decisão 1a quis evitar.
- **Pedido ao `web-site`:** no produto `vo` com tabela, o cartão resume as linhas visíveis da tabela, e não o texto.
  - Formato: os modelos na ordem da tabela, sem repetir, no mesmo formato de hoje ("Ford – Escort / Verona / Royale · Fiat – Fiorino / Palio …"), cortado em duas linhas como o texto atual.
  - O `title` do `span.apl` segue a mesma regra.
  - O cartão e a página ficam com a mesma informação.
- [SUPOSIÇÃO] Fazer a busca digitada deixar de achar o produto pelo veículo oculto é regra de busca, do `web-site` e do Alexandre, e não da UX. Com o resumo no cartão, a contradição já some da tela: o produto aparece e o cartão não promete o Ka. Se o Alexandre preferir que "ka" não ache a BCE3001, a simulação é o lugar de perguntar.

## 7. Opinião no ponto 3: o aviso nas baterias e rodas sem texto
- **Recomendação: não mostrar o aviso nessas famílias e esconder a seção Aplicação, como era antes da v30.**
- Na bateria e na roda, o cliente escolhe pela medida e pelos dados técnicos (Ah, CCA, polo, aro, furação), que já estão na Ficha técnica.
- Ali, "Aplicação em revisão" dá a entender que falta um dado que nunca vai existir. "Consulte o vendedor" manda o balconista consultar a si mesmo, sem nada a conferir.
- A regra da tela é "só o que o cliente usa para agir", e esse aviso não ajuda a agir.
- **Pedido:** o aviso só aparece no produto que tem aplicação por veículo e está em revisão:
  - o `vo` com todos os veículos ocultos;
  - o produto sem VEICULOS e sem texto, fora das famílias escolhidas pela medida.
- A lista dessas famílias é decisão de dado: o `catalogo-dados` diz quais são, e o Alexandre aprova na simulação. Não proponho texto novo.
- Se o Alexandre preferir o aviso em tudo, para ter uma regra só, a tela aguenta. Fica coerente, só menos útil.

## 8. Simulação ao Alexandre
Pode ir com estes prints, com o ponto 6 já aplicado ou marcado como pendente, e com a pergunta do ponto 7. Ponha um print da busca "ka" com o cartão da BCE3001, antes e depois do ajuste 6.

## Para o reteste
- Um print da busca "ka" em 1366 e 390 px, com o cartão da BCE3001 já resumido pela tabela.
- Se o ponto 7 for aceito, um print de uma bateria e de uma roda sem texto, em 390 px.

Sem preço e sem estoque nos prints conferidos.
