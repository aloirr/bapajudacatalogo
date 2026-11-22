# T-0024 · Parecer de UX da página final "Catálogos e materiais" (PR #134)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 04:57 (Manaus) |
| O que foi revisto | PR #134, branch `web-site/T-0024-pagina`, head `103cf257e4161bebab52a7e55ceb7591fbf87502`: `site/admin/admin.css`, `site/admin/pdfs/index.html`, `site/admin/pdfs/pdfs.js`, `site/conta.js` e `site/styles.css` (`git diff origin/main...103cf25 -- site`) |
| Comparado com | a simulação v2 liberada no reteste de `docs/ux/pareceres/T-0024-simulacao.md` (commit 9fea924) |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

Sem preço e sem estoque: 🟢.

## 1. A página bate com a simulação v2
- 🟢 **A marcação** que o `pdfs.js` monta é a mesma do `index.html` da v2: as 2 `section` com `h2`, os cartões com `h3`, a frase de uso, a `dl`, o par de botões e as frases dos estados. A única troca é o id do grupo: era `grupo-1` e `grupo-2`, agora é `grupo-catalogos` e `grupo-materiais`, o que não muda nada na tela.
- 🟢 **O CSS** do `admin.css` é o do `sim.css` da v2, sem a faixa da simulação. A regra `.pdf h2` saiu, como o parecer pedia. A regra `.pdfs > .carregando, .pdfs > .caixa` saiu junto, e isso está certo: o `#pdfs` deixou de ser a grade.
- 🟢 **A nota do passo 2** foi atendida: o comentário do `.pdf-bts` aponta para o `.bt-mini`, e não foi criada nenhuma classe nova.
- 🟢 **Os prints** `depois_1366` e `depois_390` são iguais aos da v2, sem a faixa:
  - os 2 grupos, com 3 e 3 cartões;
  - o par "Baixar PDF" e "Baixar PowerPoint" lado a lado em 1366 px e um embaixo do outro em 390 px;
  - "824 KB" e "249 KB" abaixo de 1 MB;
  - "PDF 6,6 MB · PowerPoint 7,3 MB".
- 🟢 **Os estados** (`estado_falta`, `estado_datas`, `estado_vazio` e `estado_erro`, em 1366 e 390 px) usam os textos aprovados:
  - "O PowerPoint não está disponível agora.", e só o botão dele fica desabilitado; o nome do arquivo fica como "…Comercial (.pdf)";
  - "Este arquivo não está disponível agora. Tente de novo mais tarde." no cartão de um arquivo só;
  - "PDF 14/11/2026 15:20 · PowerPoint 10/11/2026 09:00" quando as datas são diferentes;
  - "Nenhum arquivo por enquanto.";
  - "Não foi possível carregar os arquivos agora. Atualize a página em instantes.";
  - "Carregando os arquivos…" no `index.html:37`.
- 🟢 **O nome novo** está no `<title>`, na trilha, no `h1`, no subtítulo ("Sempre a versão mais nova de cada arquivo.") e no item do menu da conta (`conta.js:71`, print `depois_menu_390`).
- 🟢 **As frases de uso** são as da v2, com a do Completo Digital: "Todos os itens, para ver na tela.".

## 2. Acessibilidade
Conferi com o Chromium (Playwright) na cópia do head 103cf25, em 1366 e em 390 px, com a API simulada:
- 🟢 **Títulos:** um `h1` ("Catálogos e materiais"), 2 `h2` (os grupos) e 6 `h3` (os cartões), sem pular nível.
- 🟢 **`aria`:**
  - cada `section` tem `aria-labelledby` apontando para o seu `h2`, e não há id repetido;
  - o ícone "PDF" do cabeçalho e os ícones dos botões têm `aria-hidden`;
  - o erro sai na `.caixa` com `role="alert"` (`F.caixa`, `entrar.js:36`).
- 🟢 **Nomes dos botões:** seguem o modelo "Baixar PDF · Completo Digital", "Baixar PDF · Lubrificantes e Químicos" e "Baixar PowerPoint · Lubrificantes e Químicos". O " do <título>" antigo saiu.
- 🟢 **Foco:**
  - a ordem do Tab segue a leitura: o topo, o menu da conta, a trilha, os 7 botões na ordem dos cartões (no par, o PDF e depois o PowerPoint) e o "Voltar ao topo";
  - todo botão de baixar, inclusive o secundário `.bt-claro`, mostra o contorno de 3 px `--verde-txt`;
  - o botão desabilitado sai do Tab, e a frase dele vem antes, na ordem de leitura.
- 🟢 **Toque:** os botões têm 48 px de altura, e o botão da conta tem 44 px no celular.
- 🟢 **Rolagem para o lado:** não há (o `scrollWidth` é 1366 e 390).

## 3. Notas (não seguram)
- O ícone do cabeçalho do cartão é sempre "PDF" (`pdfs.js:69`). Na alternativa B isso está certo, porque o .pptx só aparece dentro do par. Se um dia entrar um .pptx sozinho na lista, o ícone tem de seguir o `tipo`.
- O "Nenhum arquivo por enquanto." e o "Carregando os arquivos…" não têm `role="status"`. É o mesmo da T-0022 e não mudou neste PR.

## Prints conferidos
Em `t0024-pag/prints/`, no rascunho da sessão:
- `antes_1366`, `antes_390`, `depois_1366`, `depois_390`, `depois_menu_1366` e `depois_menu_390`;
- `estado_falta_1366`, `estado_falta_390`, `estado_datas_1366`, `estado_datas_390`, `estado_vazio_390` e `estado_erro_390`.

Para comparar, abri os prints da v2: `t0024-sim/prints/depois_1366`, `depois_390` e `estados_1366`.

**Resultado: LIBERADO** para seguir ao `revisor-codigo`.
