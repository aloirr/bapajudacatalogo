# T-0022 · Parecer de UX da simulação das telas do login

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 22/11/2026 (Manaus) |
| O que foi revisto | Simulação do web-site (pasta `t0022-sim/` no rascunho da sessão do gerente): `LEIA.md`, 9 páginas HTML, `sim.css`, `sim.js` e os 34 prints (17 telas em 1366 e 390 px) |
| Pedido | R-20261122-024937-po (pedido literal do Alexandre e respostas 1a a 7a) |
| Resultado | **LIBERADO** para ir ao Alexandre, com 🟡 a corrigir antes do código (os marcados com ★ mudam o que ele vê: melhor já entrarem nos prints) |

Conferi também no navegador sem tela (Chromium, 1366 e 390 px): o foco por teclado dentro do botão do canto aberto, a cor calculada da etiqueta "Admin" e os atributos do campo "Usuário". Os contrastes foram calculados com a fórmula da WCAG 2.1 sobre os tokens do `:root`.

Sem preço e sem estoque em nenhuma tela: 🟢.

## 1. Telas e fluxo

### Login, erro, bloqueio e sessão expirada (prints 01, 02, 03 e 17)
- 🟢 Cartão único, acima da dobra em 390 × 844 (o "Entrar" fica a ~365 px). Um só botão principal. `autocomplete="username"` e `current-password` certos: o gerenciador de senhas do navegador preenche, e o login custa um toque a cada 5 horas.
- 🟢 O erro não diz qual dos dois está errado, fica acima dos campos, com `role="alert"`, ícone e texto (a cor nunca vem sozinha).
- 🟡 ★ **Bloqueio repete a ajuda** (`login-bloqueado.html`, caixa de erro): "…ou peça ao administrador da BAP para trocar a sua senha" e, logo abaixo, "Esqueceu a senha? Peça ao administrador da BAP para trocá-la." Uma informação, um lugar. Texto proposto da caixa: **"Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo."**
- 🟡 **Campo "Usuário" no celular** (`login.html`, `login-erro.html`, `login-bloqueado.html`, `sessao-expirada.html`, `#usuario`): sem `autocapitalize="none"`, `autocorrect="off"` e `spellcheck="false"`. O teclado do celular põe maiúscula na primeira letra ("Maria.exemplo") e o corretor troca o texto: o login falha sem o cliente entender por quê. Pedir também ao dono do serviço que compare o usuário em minúsculas. Falta `required` no "Usuário" (o "Senha" tem).
- 🟡 **Sessão que termina no meio do uso**: o catálogo carrega o JSON uma vez; depois das 5 horas, as fotos e o próximo pedido voltam 401. Hoje a foto que falha mostra "Foto em breve", o que seria falso. Especificar: qualquer 401 leva à tela de sessão expirada, que mantém a busca no endereço. O texto "Entre de novo para continuar de onde parou" só vale se a volta à busca for feita de verdade ([SUPOSIÇÃO] do LEIA); se não for, cortar a frase.
- 🟢 Sessão expirada em caixa verde de aviso (`role="status"`), não de erro. "O acesso vale 5 horas." pode ficar: responde ao "por que me tirou?".

### Botão do canto (prints 04 a 07 e 16)
- 🟢 Padrão "disclosure" (`aria-expanded`, lista de links, Esc fecha e devolve o foco ao botão), não `role="menu"`. Itens com 44 px. "Sair" é um botão de formulário (POST), não um link.
- 🟢 Cabeçalho do menu com logo, nome, empresa e usuário; grupo "Administração" separado de "Trocar senha" e "Sair".
- 🟡 **Foco invisível dentro do menu aberto** (`styles.css:75`, `.topo :focus-visible { outline-color: var(--branco) }`): o `.conta-menu` fica dentro do `.topo`, então o contorno do foco sai branco sobre o cartão branco. Conferido no navegador: Tab em "Criar usuários" dá `outline: 3px solid rgb(255,255,255)`. Regra a acrescentar: `.conta-menu :focus-visible { outline-color: var(--verde-txt); }`. Foco visível não pode voltar para trás.
- 🟡 ★ **Contraste do botão fechado sobre a ponta verde do cabeçalho** (`sim.css`, `.conta-bt` com `color-mix(branco 8%)` e `.conta-nome small { opacity: .85 }`): o fundo fica ~#4D983C perto da borda direita; o nome (14 px, peso 600, não é texto grande) dá ~4,4:1 e a empresa (12 px) ~3,6:1. Mínimo 4,5:1. Ajuste: tirar o `opacity` da empresa e trocar o véu branco por um véu escuro (ex.: `color-mix(in srgb, var(--escuro) 30%, transparent)`), conferindo ≥ 4,5:1 nos dois textos.
- 🟡 ★ **Etiqueta "Admin" no menu ilegível** (`sim.css`, `.conta-cab span { color: var(--texto-2) }` vence `.tag-escura`): sai `--texto-2` sobre `--escuro`, 2,9:1 (conferido no navegador: `rgb(91,98,94)` sobre `rgb(21,21,21)`). Na tabela ela sai certa (branco sobre escuro). Ajuste: `.conta-cab .tag-escura { color: var(--branco); }`.
- 🟡 ★ **Caixa alta no nome da empresa**: "BAP AUTOPARTS" no botão, no menu e na lista de usuários. Nome não vai em caixa alta: **"BAP Autoparts"** (como no `alt` da logo).

### Trocar senha (prints 08 e 09)
- 🟢 Três campos com "Mostrar", dica de tamanho ligada ao campo (`aria-describedby`), "Salvar nova senha" principal e "Cancelar" como texto.
- 🟡 ★ **Troca obrigatória pede a senha inicial de novo** (`trocar-senha-obrigatoria.html`, campo "Senha inicial"): o cliente acabou de digitá-la no login, segundos antes. No celular, é um campo a mais e a dúvida "qual senha?". Proposta: só "Nova senha" e "Confirmar a nova senha"; o serviço sabe que a sessão está no estado "troca pendente". [SUPOSIÇÃO] sem perda de segurança, porque a sessão foi aberta com a senha inicial; o `revisor-codigo` confirma. Se o campo ficar, cortar a dica "A senha que a BAP enviou para você.", que repete o subtítulo.
- 🟡 ★ Subtítulo da troca obrigatória mais curto: **"Olá, João Modelo. No primeiro acesso, crie uma senha só sua."**
- 🟡 **Trocar senha normal**: a linha "Usuário: maria.exemplo · Auto Peças Exemplo" repete o que o botão do canto já mostra. Cortar a linha visível e pôr no formulário um campo escondido `autocomplete="username"` com o usuário, para o gerenciador de senhas salvar a senha nova no usuário certo.
- 🟡 **Estados que faltam** (especificar e simular no código): sucesso "Senha trocada." (volta ao catálogo com o aviso curto); erros no próprio campo, com `aria-invalid` e `.msg-erro`: "A senha atual não confere.", "As duas senhas novas não são iguais.", "Use pelo menos 10 caracteres.", "A nova senha não pode ser igual à atual."

### Criar usuários (prints 10 a 14)
- 🟢 Tabela no computador e cartão com rótulos abaixo de 900 px, sem rolagem lateral. Um só principal ("+ Novo usuário"). Botões das linhas com o nome no nome acessível ("Editar Maria Exemplo"). "Desativar" (não apagar) com confirmação e foco inicial no "Cancelar"; o botão de perigo usa `--erro` com texto (6,6:1). Admin sem "Desativar" na própria linha e com a etiqueta "Você". "Falta trocar a senha inicial" e "Ainda não entrou" ajudam o admin a agir.
- 🟡 ★ **Texto com gênero fixo** (`usuarios.html`, janelas `dlg-senha` e `dlg-desativar`): "Ela não consegue…", "Ela troca…", "Envie a ela…". A frase vai virar modelo para qualquer usuário. Usar o nome ou frase neutra:
  - Desativar: **"Maria Exemplo não entra mais no catálogo, e a sessão aberta termina agora. O cadastro e a logo ficam guardados: dá para reativar depois."**
  - Trocar a senha (caixa): **"No próximo acesso, Maria Exemplo cria uma senha nova. Se o catálogo estiver aberto, a sessão termina agora."**
  - Dica: **"Pelo menos 10 caracteres. Passe a senha direto para a pessoa."** ("canal seguro" é jargão.)
- 🟡 **Senha gerada escondida**: "Gerar" preenche um campo `type="password"`; o admin precisa de mais um toque em "Mostrar" para ler e passar a senha. Ao gerar, mostrar a senha (o campo vira texto e o botão vira "Ocultar"). A senha gerada deve evitar letras que confundem (l, I, 1, O, 0), porque vai ser lida e digitada no celular.
- 🟡 **Estados que faltam**:
  - sucesso ao criar: **"Usuário criado. Passe ao cliente o usuário maria.silva e a senha inicial."** com o botão "Copiar usuário e senha" (a senha só aparece nesse momento);
  - sucesso ao salvar, trocar senha, desativar e reativar: aviso curto ("Alterações salvas.", "Senha trocada.", "Usuário desativado.", "Usuário reativado.");
  - busca sem resultado, uma frase: **"Nenhum usuário encontrado para “…”."**;
  - erros nos campos: "Este usuário já existe. Escolha outro.", "Use só letras minúsculas, números e ponto.", "A logo passa de 1 MB. Envie uma imagem menor.", "Envie a logo em PNG ou JPG.".
- 🟡 ★ **Caixa alta e texto que explica a página**: a etiqueta "SÓ O ADMINISTRADOR VÊ ESTA PÁGINA" é frase e sai em caixa alta (`.so-admin { text-transform: uppercase }`): usar "Só o administrador vê esta página". O subtítulo "Crie o acesso de cada cliente, troque a senha de quem esqueceu e desative quem não usa mais." explica o funcionamento da tela e pode sair; fica a etiqueta.
- 🟡 Rótulo: a página é "Criar usuários" (nome do Alexandre, fica), o botão é "+ Novo usuário", a janela é "Novo usuário" e o envio é "Criar usuário". Usar um verbo só: botão **"+ Criar usuário"** e janela **"Criar usuário"**.
- 🟢 Opcional: sugerir o usuário a partir do nome ("Maria Silva" → "maria.silva"), que o admin pode mudar antes de criar.

### Catálogos em PDF (prints 15 e 16)
- 🟢 Dois cartões equivalentes, cada um com o uso em uma frase ("Para enviar aos clientes e ver na tela." e "Para mandar imprimir na gráfica."), tamanho e data. Os dois "Baixar PDF" são principais: exceção aceita à regra de um principal por tela, porque são as duas únicas ações, iguais e independentes, uma por cartão. O nome acessível diz qual PDF baixa.
- 🟡 ★ **Aviso repetido**: o subtítulo "Este link não aparece para os clientes." e a etiqueta "Só o administrador vê esta página" dizem a mesma coisa. Fica só a etiqueta. "Sempre a versão mais nova de cada catálogo." pode ficar ou sair: a data "Atualizado em" já mostra.
- 🟡 Nome do arquivo quebrado no meio da palavra em 390 px ("…_Compl / eto_Digital.pdf", `overflow-wrap: anywhere`): quebrar depois do "_" (`<wbr>`) ou tirar a linha "Arquivo", que não ajuda a decidir.
- 🟡 **Estado que falta**: PDF ainda não disponível: **"Este PDF não está disponível agora. Tente de novo mais tarde."**, com o botão desabilitado.

### Geral
- 🟡 **Contraste no cabeçalho escuro das páginas novas em 390 px** (`sim.css`, `.pg-cab p` e `.trilha` com `--borda-campo`): perto da ponta verde do degradê, o texto cai para ~3,7 a 4,2:1. Usar `--branco` (5,0:1 ou mais em toda a faixa, até a ponta verde). Com os subtítulos cortados (acima), sobra só a trilha.
- 🟡 **"Mostrar"/"Ocultar" da senha** (`sim.js`, `.ver`, e o `aria-label="Mostrar a senha: senha"` em todas as páginas): o texto visível vira "Ocultar", mas o nome acessível continua "Mostrar a senha: …" e ainda tem `aria-pressed`; o nome não contém o texto visível (WCAG 2.5.3) e o estado é dito duas vezes. Ajuste: tirar o `aria-label` e o `aria-pressed`, deixar o texto visível "Mostrar"/"Ocultar" com `aria-controls` apontando o campo (o rótulo do campo já diz qual senha é). O "Gerar" ganha nome acessível "Gerar senha".
- 🟢 Opcional: o "voltar ao topo" aparece nas páginas curtas do admin e da troca de senha (prints 08, 10, 15), onde não há o que rolar; escondê-lo quando a página não rola.
- 🟢 Rótulos dos campos e dos cabeçalhos da tabela em caixa alta pequena seguem o padrão dos rótulos do site ("Código, descrição ou aplicação", filtros). Não é nome nem frase.
- 🟢 Rodapé com o aviso fixo "As fotos são ilustrativas. Confira sempre a aplicação antes da compra." no lugar de sempre, também no login.
- 🟢 Em 390 px nada rola para o lado, há um `h1` por página, `alt` em toda imagem e rótulo em todo campo (conferido pelo web-site e por amostra nos HTML).

## 2. As 3 recomendações "a" do web-site
1. **Celular: o botão do canto só com a logo.** 🟢 Concordo. Em 390 px o menu (Início, Produtos, Sobre a BAP) já ocupa a linha; a logo dá 44 px de toque, o nome e a empresa ficam no nome acessível e no menu aberto. Cuidado: sem a palavra "Catálogo online" (que some no celular logado, e agora todo uso é logado) e com o cliente sem logo, o cabeçalho mostra duas logos da BAP. Isso é decisão de marca: o `design-de-marca` precisa validar o sumiço do "Catálogo online" no celular.
2. **Menus do admin só dentro do botão do canto.** 🟢 Concordo. Segue a resposta 6a ("o link não aparece para outros usuários nem no catálogo aberto"), o menu do topo fica igual para todos e não falta espaço no celular. Chega-se a "Criar usuários" e "Catálogos em PDF" em 2 toques.
3. **Moldura da logo do cliente em retângulo deitado.** 🟢 Concordo. Logo de autopeças costuma ser larga; o círculo cortaria ou encolheria demais. Com `object-fit: contain` e o fundo branco, nada se corta. Pôr na dica do envio: "De preferência deitada, com fundo branco ou transparente."

## 3. As suposições e a UX
- **Senha com pelo menos 10 caracteres:** não atrapalha, desde que a regra seja só o tamanho (sem exigir símbolo, número ou maiúscula, que no celular do balcão vira erro e senha anotada em papel). O "Mostrar" ajuda. A senha gerada deve ser fácil de ler (acima).
- **Logo PNG ou JPG até 1 MB:** não atrapalha (logo de WhatsApp cabe). Pedir ao dono do serviço que guarde a logo reduzida (ex.: até 256 px de largura): ela aparece em toda página, e a internet do balcão às vezes é fraca. Mensagens de erro do envio estão acima.
- **Um admin só:** não atrapalha a tela. O risco é de operação: com a resposta 7a (só o admin troca senha), se o Alexandre esquecer a dele ninguém troca pela tela. O caminho de volta (a senha inicial no painel do Render) deve estar escrito nos passos que o PO leva a ele.
- **Bloqueio de 15 minutos:** não atrapalha; o texto já diz o tempo.
- **Usuário que não muda:** não atrapalha; a dica no cadastro avisa antes.
- **Voltar para a página onde estava:** ajuda muito o balconista no meio do atendimento; se não for feita, o texto da sessão expirada muda (acima).

## Resumo
- 🔴: nenhum.
- 🟡 antes de ir ao Alexandre (★, custo baixo, mudam os prints): bloqueio sem a ajuda repetida; contraste do botão do canto; etiqueta "Admin"; "BAP Autoparts"; troca obrigatória com 2 campos e subtítulo curto; textos sem "Ela"; etiqueta sem caixa alta e subtítulos cortados.
- 🟡 no código: foco visível no menu; campo "Usuário" sem maiúscula automática; "Mostrar"/"Ocultar" acessível; contraste do cabeçalho das páginas novas; estados de sucesso, erro, vazio e PDF indisponível; senha gerada visível; 401 no meio do uso leva à sessão expirada.
- Reteste: nos prints de 1366 e 390 px da versão corrigida (simulação ★) e de novo na entrega do código.
