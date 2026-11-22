# T-0022 · Parecer de UX das telas reais do login (PR #114)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | noite de 21/11/2026 e madrugada de 22/11/2026 (Manaus) |
| O que foi revisto | PR #114 (branch `web-site/T-0022-telas`): `site/entrar/`, `site/trocar-senha/`, `site/conta.js`, `site/admin/usuarios/`, `site/admin/pdfs/`, `site/styles.css`, e os prints de 1366 e 390 px |
| Pedido | R-20261122-024937-po (pedido literal e respostas 1a a 7a) e R-20261122-032433-alexandre (respostas 1 a 10: a; desenho e telas aprovados como simulados) |
| Base | simulação LIBERADA em `docs/ux/pareceres/T-0022-simulacao.md` |
| Resultado final | **LIBERADO** no 87ec078; vale para o head final 8e529f5 |

## Histórico das revisões

O f547010 (correção do `voltaSegura`, a volta sem redirecionamento aberto) foi revisado pelo `revisor-codigo`, não pelo designer-ux.

| Head | Commit (Manaus) | Resultado | Motivo |
|---|---|---|---|
| e83f7f7 | 21/11, 23:48 | 🔴 **BLOQUEADO** | R1: a resposta do "Copiar usuário e senha" ficava escondida |
| dccaa8c | 21/11, 23:58 | 🔴 **BLOQUEADO** | R2: o aviso "Usuário desativado." não aparecia |
| 87ec078 | 22/11, 00:11 | 🟢 **LIBERADO** | R1 e R2 corrigidos |
| 8e529f5 | 22/11, 00:17 | 🟢 LIBERADO mantido | só mexe na impressão e tira código sem uso |

## 1. Bloqueio no e83f7f7: R1

- 🔴 **R1, a resposta da cópia ficava escondida** (`site/admin/usuarios/usuarios.js:134-135` e `site/conta.js:25-29`). Na janela de entrega do usuário criado, o "Copiar usuário e senha" respondia com o aviso solto da página ("Usuário e senha copiados." ou "Não foi possível copiar. Anote o usuário e a senha."). O aviso entrava no `document.body`, atrás da janela aberta com `showModal()`, e o admin não via nada: não sabia se copiou nem que precisava anotar. É o único momento em que a senha inicial aparece. Se a cópia falha sem aviso, o cliente fica sem a senha.
  - Pedido: mostrar a resposta dentro da janela, perto do botão, numa linha `role="status"`. Se der erro, avisar em vermelho e com texto: "Não foi possível copiar. Anote o usuário e a senha acima antes de fechar."

## 2. Bloqueio no dccaa8c: R2

- 🟢 R1 corrigido: a resposta aparece na linha `.copia-msg` dentro da janela (`usuarios.js`, `#copia-msg`, `role="status"`), verde quando copia e `--erro` com texto quando falha. Quando a área de transferência moderna não existe (endereço `http`), o código tenta o jeito antigo antes de pedir para anotar.
- 🔴 **R2, o aviso "Usuário desativado." não aparecia** (`site/conta.js:30`, `site/admin/usuarios/usuarios.js:315` e `:329`, e `:96`). Para corrigir o R1, o aviso solto passou a entrar na janela aberta. No "Desativar", o aviso nascia dentro da janela de confirmação (`:315`). Logo depois a janela fechava (`:329`) e o `close` apagava o conteúdo dela (`:96`), com o aviso junto. O admin confirmava o desativar e não via a confirmação. O "Alterações salvas." e o "Usuário reativado." seguiam a mesma ordem e corriam o mesmo risco.
  - Pedido: fechar a janela antes de mostrar o aviso, no desativar, no reativar e no salvar, e o aviso fica à vista na página.

## 3. Liberação no 87ec078

- 🟢 R2 corrigido: `mudarAtivo` fecha a janela antes do aviso (`if (dlg.open) dlg.close()`), e o salvar faz o mesmo depois de recarregar a lista. Assim o foco volta ao botão da linha nova. "Usuário desativado.", "Usuário reativado." e "Alterações salvas." ficam à vista, com `role="status"`.
- 🟢 Os ajustes do dccaa8c continuam: sem espaço vazio no alto da janela quando não há aviso, "Digite o usuário." com o campo vazio, a entrega "Usuário criado. Passe ao cliente o usuário e a senha abaixo.", e a logo da BAP com 44 px de toque no celular logado.
- 🟢 As redundâncias do RD-0352 ao RD-0361 não mudam o que o cliente vê. O catálogo (busca "bomba" e janela do produto) ficou igual ao do main em 1366 e 390 px. A janela do admin passou a ser a mesma janela do produto (tela cheia no celular), então o componente é um só.
- 🟢 O que a simulação deixou para o código está feito: estados de sucesso, de erro nos campos, de busca vazia ("Nenhum usuário encontrado para “…”.") e de PDF indisponível; o 401 no meio do uso leva à sessão expirada (`/entrar?expirou=1`), com a volta para a mesma tela; e o nome do PDF quebra depois do "_" em 390 px.
- Sem preço e sem estoque em nenhuma tela.

## 4. Head final 8e529f5

- 🟢 Só mexe na impressão e tira código sem uso. A largura de 560 px da janela do admin fica só na tela (`@media screen and (min-width: 641px)` em `site/admin/admin.css`). Na impressão, com a janela aberta, sai só ela, como a janela do produto (RD-0362). E sai o `forEach` que movia os avisos ao fechar a janela, porque todo aviso já vem depois do `close` (RD-0363). Nada muda na tela, e o R2 continua corrigido.

## 5. 🟡 aceitos ou que ficaram como estão

- 🟡 **"BAP AUTOPARTS" em caixa alta** (no rodapé das 5 páginas, `rodape-copy`: "© 2026 - BAP AUTOPARTS - Componentes de qualidade - Todos os direitos reservados."). Na simulação, pedi "BAP Autoparts" (★4). O Alexandre respondeu na pergunta de marca (10 a, R-20261122-032433-alexandre): a grafia oficial é "BAP AUTOPARTS", como no `CLAUDE.md`. É o nome da marca, não um texto em caixa alta, e fica como está. A regra "sem caixa alta feia" continua valendo para os outros nomes e frases.
- 🟡 **Botão "Baixar PDF" desabilitado quando o PDF não está disponível** (`site/admin/pdfs/pdfs.js:23`; `site/entrar/entrar.css:44`, `opacity: .6`; `site/admin/admin.css:92`, `cursor: not-allowed`). Era o estado pedido no parecer da simulação, e fica. O botão apagado mantém o cartão igual ao vizinho, e a frase acima dele ("Este PDF não está disponível agora. Tente de novo mais tarde.") diz o problema e a ação. A WCAG não exige contraste em controle desabilitado. Se um dia a tela mudar, a alternativa é tirar o botão e deixar só a frase. Não pede mudança agora.

## Resumo
- Pendências de UX neste PR: nenhuma.
