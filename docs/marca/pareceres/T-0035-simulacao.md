# T-0035 · Parecer de marca da simulação dos filtros Categoria, Sistema e Família na aba Estoque

| Campo | Valor |
|---|---|
| Tarefa | T-0035, passo 1: simulação ("Coloque o filtro por sistema, familia, categoria.", 24/11/2026 21:20) |
| Revisor | design-de-marca |
| Data | 25/11/2026 (Manaus) |
| O que foi visto | Tela: `origin/web-site/T-0035-filtros` (`4c6d8d2`), diff de `site/estoque/index.html`, `estoque.css` e `estoque.js`. Os 9 prints de `testes/prints/T-0035/` em `origin/testes/T-0035-filtros` (`748a963`), com dados fictícios. Para comparar: os filtros do catálogo (`site/app.js`, `FILTROS` e `titulo()`/`bonito()`) e o `.limpar-tudo` do `site/styles.css` |
| Base de comparação | `docs/marca/manual.md` (o que foi aprovado; o resto ainda é levantamento "a aprovar") e o parecer da versão final da T-0034 (`docs/marca/pareceres/T-0034-final.md`) |
| Parecer | Simulação: **LIBERADO COM AJUSTES** para o PO levar ao Alexandre. Dois achados baixos (MC-0033 e MC-0034); nenhum segura |

Tela interna (admin e quem tem "Pode ver o estoque"). Layout, ordem dos campos e o que fica atrás do botão no
celular são do `designer-ux`. Aqui ficam marca, voz e regras do repositório.

## 1. O que está certo

- **Rótulos:** "Categoria", "Sistema" e "Família" são os mesmos nomes dos filtros do catálogo (`FILTROS` do `app.js`),
  com acento, na mesma ordem. O vendedor e o balconista reconhecem os nomes do catálogo na aba Estoque.
- **"Todas" e "Todos":** concordância certa: "Todas" em Filial, Categoria e Família; "Todos" em Sistema.
- **"Filtros (N)":** curto, e o número diz quantos filtros estão escolhidos (conta a Filial também, que está atrás do
  mesmo botão). Botão `bt-claro` do site; aberto, fundo `--verde-claro` e borda verde, como os outros botões claros.
- **"Limpar filtros":** usa o `.limpar-tudo` do catálogo (texto em `--verde-txt`, sublinhado, 600). O texto é
  diferente do "Limpar tudo" do catálogo, e está certo: aqui o botão limpa só os 4 filtros, não a busca nem a caixa
  "Somente produtos com estoque". Só aparece quando há filtro escolhido.
- **"Nada encontrado para “…” com os filtros escolhidos.":** na mesma voz do "Nada encontrado para “…” em <filial>." da
  T-0034, e diz ao vendedor onde mexer.
- **Seta do botão:** desenhada com a borda em `currentColor` (a cor do texto do botão, `--verde-txt`), sem ícone novo
  e sem cor nova. Fechado, aponta para baixo, como as setas dos `select` ao lado. Respeita o "reduzir movimento". Ver o
  MC-0034 para o print do estado aberto.
- **Cor:** só variáveis do `:root`. Filtro sem opção fica em `--fundo` com texto `--texto-2`. Nenhum hex novo.
- **Grafia e logo:** "BAP AUTOPARTS" no rodapé e na empresa do admin; logo e topo iguais aos da T-0034.
- **Preço e estoque:** o vendedor só filtra. Categoria, Sistema e Família não viram colunas na tabela dele, que
  continua com as 6 colunas da T-0034. Nada de custo, preço ou markup na tela do vendedor.
- **Marca de terceiros:** nenhuma.

**Poppins:** os prints saem em fonte de reserva porque o teste responde o Google Fonts vazio (como na T-0034). O
código não mexe na fonte: a página carrega a Poppins 400 a 700 como as outras. Não é achado. [SUPOSIÇÃO: avisar o
Alexandre que a fonte do print não é a do site, como na T-0034.]

O "×" azul do campo "Buscar" (`vazio-filtros-1366.png`) é o MC-0032, já na fila (`T-0034-final.md`); não abro achado
novo.

## 2. Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0033 | Opções de Categoria, Sistema e Família, 1366 e 390 px (`vendedor-1366-categoria-sistema.png`: "SUSPENSÃO", "DIANTEIRA"; `vendedor-390-filtros-aberto.png`: "MOTOR", "ARREFECIMENTO"); `site/estoque/estoque.js`, função `opcoes()`, o texto do `<option>` | aplicação | manual a aprovar (aplicações: site) | baixa | No catálogo, os mesmos nomes saem sem caixa alta ("Suspensão", "Arrefecimento"), pelo `titulo()` → `bonito()` do `app.js`. Na aba Estoque saem em maiúsculas, cru da planilha, e a mesma classificação fica com duas caras no mesmo site (na T-0034, as cidades já foram para "Mato Grosso", "São Luís"). Antes → depois: o texto da opção passa pelo mesmo `bonito()` do catálogo (ex.: "SUSPENSÃO" → "Suspensão"). O `value` continua o da planilha, para o filtro no servidor não mudar. Onde pôr o `bonito()` para as duas páginas usarem (sem cópia) fica com o `web-site` e o `corretor-redundancias` | `web-site` |
| MC-0034 | Botão "Filtros (2)" aberto, 390 px (`vendedor-390-filtros-aberto.png` e `admin-390-filtros-aberto.png`): a seta sai torta, nem para cima nem para baixo | aplicação | manual a aprovar (aplicações: site) | baixa | [SUPOSIÇÃO: o print foi tirado no meio da animação de 0,15 s da seta (`transition: transform .15s`); o CSS do estado aberto, `rotate(-135deg)`, dá a seta para cima.] Antes → depois: refazer os 2 prints depois da animação (ou com "reduzir movimento") e mostrar a seta para cima ao Alexandre. Se no print novo ela continuar torta, o ajuste é do `web-site` no `.est-aberta .est-bt-filtros::after` | `testes` (se persistir: `web-site`) |

## 3. Para a entrega

- Os rótulos e textos desta simulação, sem mudança, e o MC-0033 aplicado (ou a decisão do Alexandre de manter as
  maiúsculas, anotada).
- A seta para cima no estado aberto (MC-0034) e a mesma seta nas duas visões.
- Só tokens do `:root`, sem hex novo; o vendedor sem as colunas novas na tabela e sem valor na API.
