# T-0022 · Parecer de marca da simulação das telas do login

| Campo | Valor |
|---|---|
| Tarefa | T-0022 (login, botão do canto, "Criar usuários" e "Catálogos em PDF"), passo 1: simulação |
| Revisor | design-de-marca |
| Data | 21/11/2026 23:05 (Manaus) |
| O que foi visto | `LEIA.md`, `login*.html`, `sessao-expirada.html`, `trocar-senha*.html`, `catalogo*.html`, `usuarios.html`, `pdfs.html`, `sim.css` e os 34 prints (17 telas em 1366 e 390 px) da simulação do `web-site` (scratchpad do gerente, `t0022-sim/`) |
| Base de comparação | `site/styles.css` do `main` (3dd4850). A cópia da simulação é igual, byte a byte. O manual da marca ainda está "a aprovar" |
| Parecer | **LIBERADO** no reteste de 21/11 23:11 (ver o fim). Primeira leitura: **LIBERADO COM AJUSTES**: a simulação pode ir ao Alexandre. Os achados MC-0002 e MC-0003 devem ser corrigidos na simulação antes do envio, porque ele vai julgar o que vê. Os outros podem entrar no código, no passo 2 |

Enquanto o manual estiver "a aprovar", nenhum achado daqui segura a tarefa. Não há nada contra as regras do repositório:
não aparece preço nem estoque; não há logo, cor nem tipografia de montadora ou de concorrente; as logos de cliente são
fictícias e aparecem só na sessão do próprio cliente e na lista do admin, como o Alexandre pediu (resposta 4 b).

## O que está certo (manter)

- **Logo da BAP:** o `logo_branco` fica no fundo escuro do cabeçalho, com 46 px no computador e 38 px no celular, como
  no site. O `logo_escuro` fica no cartão branco do login, com 56 px (46 px no celular). Em todos os casos, a versão está
  certa para o fundo. O logo não aparece esticado, girado, com sombra nem com contorno. O conjunto logo + "CATÁLOGO ONLINE"
  é o mesmo do cabeçalho do site. O favicon é o `logo_escuro.png`, igual ao do site.
- **Fundo do login:** o `--fundo-faixa` com a linha `--verde` de 6 px embaixo é o mesmo da faixa do início (T-0018).
  O cabeçalho e as faixas do admin usam o `--g-catalogo`, e o rodapé é o de sempre, com o grafismo de ícones do site.
  Não há grafismo novo nem grafismo de origem cultural.
- **Cor:** o `sim.css` usa só os tokens do `:root`. O único hex novo está nos dois tokens propostos, `--erro` e
  `--erro-claro`. Os botões são os `.bt` e `.bt-claro` do site (`--escuro` no `--verde`: 7,58:1), e o verde de texto
  é o `--verde-txt`. O aviso de sessão expirada usa `--verde-txt` no `--verde-claro` (5,81:1), sem vermelho, porque
  não é erro. Isso está certo: o verde da marca não vira cor de erro, e o vermelho não entra num aviso neutro.
- **Tipografia:** Poppins 400, 500, 600 e 700 (Google Fonts), os mesmos pesos do site. Os rótulos em caixa alta com
  espaçamento seguem o `.campo-rot` do site. A exceção é o MC-0005.
- **Tom de voz:** os textos são diretos e curtos. "Entrar no catálogo", "Usuário ou senha incorretos. Confira e tente
  de novo.", "Sua sessão terminou. O acesso vale 5 horas.", "Crie a sua senha" e "Salvar e entrar no catálogo" estão
  certos para quem está no balcão. O nome dos PDFs ("Completo Digital" e "A4 gráfica") é o mesmo das entregas
  (`Catalogo_BAP_2027_Completo_Digital.pdf` e `Catalogo_BAP_2027_A4_grafica.pdf`). A exceção é o MC-0007.

## As duas cores novas: `--erro #B42318` e `--erro-claro #FDECEA`

**Recomendação: entram, como cores de estado (funcionais), e não como cores da marca.** Mas cor nova só entra com o
"aprovado" do Alexandre, então elas vão no pacote, com esta recomendação.

- **Por que entram:** a paleta da BAP não tem cor para erro, e usar o verde da marca para um erro confundiria o cliente.
  O vermelho escolhido passa com folga: 6,57:1 no branco, 6,02:1 no `--fundo` e 5,75:1 no `--erro-claro`. O texto
  branco no botão "Desativar" também tem 6,57:1. É um vermelho fechado, que não briga com o verde nem com o laranja das
  etiquetas "NOVO" e "LANÇAMENTO" do PDF (`orange #f28c28`, `otext #8a3f00`). Hoje o PDF não tem nenhum vermelho no
  dicionário `C`, então não aparece um "quase igual".
- **Condições de uso, para o manual:**
  1. Só para mensagem de erro, campo com erro, etiqueta de alerta e botão de ação destrutiva, como na confirmação de
     "Desativar". Nunca como decoração, fundo de faixa, destaque de produto ou chamada comercial.
  2. Só na interface do site. Elas não entram nos PDFs, na Linha Moto, no portfólio, no Kit Filtros nem nas
     apresentações.
  3. Elas ficam no `:root` do `site/styles.css`, com o comentário dos contrastes, como os outros tokens. Nada de hex
     solto (`#B42318` escrito direto numa regra).
  4. O `--erro-claro` só serve de fundo para o `--erro`. Não serve de fundo para texto verde nem para texto cinza.

## Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0002 | Botão do canto, cliente com logo: `04` e `05` em 1366 e 390 px; `sim.css`, regra `:root` (`--conta-logo-l: 64px; --conta-logo: 40px`) e `@media (max-width: 640px)` (`.conta-bt .conta-logo { --conta-logo: 38px; --conta-logo-l: 60px; }`) | logo | manual a aprovar, logo (a logo do cliente não compete com a da BAP no mesmo nível) | média | Ver abaixo | web-site |
| MC-0003 | Lista de usuários, linha desativada: `10` e `14` em 1366 e 390 px; `sim.css`, `table.us tr.off .conta-logo img { filter: grayscale(1); opacity: .6; }` | logo | manual a aprovar, logo (nunca recolorido) | média | Ver abaixo | web-site |
| MC-0004 | Menu aberto do admin, etiqueta "Admin": `07` e `16` em 1366 e 390 px; `sim.css`, `.conta-cab span { color: var(--texto-2) }`, que ganha da `.tag-escura` | cor | manual a aprovar, cor (contraste ≥ 4,5:1) | baixa | Ver abaixo | web-site |
| MC-0005 | Coluna "Usuário" da lista: `10` a `14` em 1366 e 390 px; `sim.css`, `.us-login { font-family: ui-monospace, Menlo, Consolas, monospace; }` | tipografia | manual a aprovar, tipografia (só Poppins) | baixa | Ver abaixo | web-site |
| MC-0006 | Logo do cartão do login: `login.html`, `login-erro.html`, `login-bloqueado.html`, `sessao-expirada.html` e `trocar-senha-obrigatoria.html`, `<img src="assets/logo_escuro.png" alt="BAP Autoparts">` | logo | manual a aprovar, logo (texto alternativo "bap componentes de qualidade") | baixa | Ver abaixo | web-site |
| MC-0007 | Ajuda e bloqueio do login: `01`, `02`, `03` e `17`, "Esqueceu a senha? Peça ao administrador da BAP para trocá-la." e "…ou peça ao administrador da BAP para trocar a sua senha." | voz | manual a aprovar, tom de voz | baixa | Ver abaixo | designer-ux (texto) e web-site (aplica) |

### MC-0002 · A logo do cliente pesa mais que a da BAP no cabeçalho

No cabeçalho escuro, a moldura branca é o ponto mais claro da barra, e ela é maior que o logo da BAP. O logo da BAP
(226 × 312 px, em pé) ocupa cerca de 33 × 46 px no computador (cerca de 1.530 px²). A moldura do cliente tem 64 × 40 px
(2.560 px², 1,7 vez maior). No celular é pior: o "Catálogo online" some quando a pessoa está logada, e o logo da BAP fica
com cerca de 27 × 38 px (cerca de 1.050 px²), ao lado de uma moldura branca de 60 × 38 px (2.280 px², 2,2 vezes maior).
Nos prints de 390 px, a logo do cliente chama mais a atenção que a da BAP.

Regra proposta para o manual: **no mesmo cabeçalho, a moldura da logo do cliente não passa da área do logo da BAP, e a
logo do cliente não passa de dois terços da altura do logo da BAP.**

Correção no `sim.css` (e depois no código):
- computador: `--conta-logo-l: 64px; --conta-logo: 40px;` → `--conta-logo-l: 48px; --conta-logo: 30px;` (1.440 px²);
- celular, no `@media (max-width: 640px)`: `.conta-bt .conta-logo { --conta-logo: 38px; --conta-logo-l: 60px; }` →
  `{ --conta-logo: 26px; --conta-logo-l: 40px; }` (1.040 px²). O botão continua com 44 px de toque pelo `min-height` e
  pelo `min-width` do `.conta-bt`;
- o `padding` da imagem: `4px` → `3px`, para a logo não ficar pequena demais na moldura menor;
- o menu aberto (`.conta-cab .conta-logo`, 84 × 52 px) e o envio da logo (104 × 64 px) ficam como estão. Eles não
  dividem o mesmo nível com o logo da BAP.

Depois da correção, refazer os prints `04` a `07` e `10` a `16`, que mostram o cabeçalho com o botão do canto.

**Pergunta para o Alexandre (pelo `po`), sem segurar a tarefa:** sem logo, o botão do canto mostra o logo inteiro da BAP
(decisão 4 b). Fica com cerca de 32 px de altura, ou 24 px com a correção acima, e aparece no mesmo cabeçalho do logo
principal. A assinatura "componentes de qualidade" não dá para ler nesse tamanho. Ele aceita assim, ou prefere, só nesse
uso pequeno, o símbolo do "b" no círculo verde? [SUPOSIÇÃO] Não há versão só do símbolo no repositório, nem vetor do logo.
Cortar o PNG seria alterar o logo, então isso precisa do arquivo e do "aprovado" dele.

### MC-0003 · O logo da BAP fica cinza na linha desativada

A regra `table.us tr.off .conta-logo img { filter: grayscale(1); opacity: .6; }` recolore o logo da BAP (a "Oficina
Teste" usa a da BAP) e as logos dos clientes. Logo não se recolore, nem o nosso nem o do cliente.

Correção: tirar a regra inteira. A linha desativada já se distingue pela etiqueta "Desativado", pelo texto em
`--texto-2` (`table.us tr.off td`) e pelo botão "Reativar".

### MC-0004 · A etiqueta "Admin" fica com o texto apagado no menu aberto

Dentro do `.conta-cab`, a regra `.conta-cab span { color: var(--texto-2) }` é mais forte que a `.tag-escura { color:
var(--branco) }`. Por isso o "Admin" sai em `#5B625E` sobre `#151515`, com 2,92:1, e não passa nem como texto grande.
Na lista de usuários, a mesma etiqueta está certa (branco no `--escuro`, 18,26:1).

Correção: `.conta-cab span { … }` → `.conta-cab span:not(.tag) { … }` (ou acrescentar `.conta-cab .tag-escura { color:
var(--branco); }`). Resultado: `--branco` no `--escuro`, 18,26:1.

### MC-0005 · A coluna "Usuário" sai em fonte monoespaçada

A `.us-login` usa `ui-monospace, Menlo, Consolas`, que é uma terceira família, fora da Poppins. Só o admin vê essa coluna,
mas é a única tela do catálogo fora da Poppins.

Correção: tirar o `font-family` da `.us-login`. Ela fica em Poppins 500, 13 px. Se o `designer-ux` quiser distinguir
o usuário do nome, pode usar o peso ou a cor (`--texto-2`), nunca outra família.

### MC-0006 · O texto alternativo do logo do login não é o do site

No site, o logo tem o texto alternativo "bap componentes de qualidade" (topo, `site/index.html`). No cartão do login,
ele virou "BAP Autoparts". O leitor de tela tem de ouvir o mesmo nome da marca em todas as telas.

Correção: `alt="BAP Autoparts"` → `alt="bap componentes de qualidade"` nas cinco páginas do cartão (`login`,
`login-erro`, `login-bloqueado`, `sessao-expirada` e `trocar-senha-obrigatoria`). O "Logo da BAP", no botão do canto
e na lista, pode ficar: ali o logo faz o papel da imagem da empresa do usuário.

### MC-0007 · "Administrador da BAP" soa como sistema, não como a BAP

O cliente do balcão não conhece "o administrador". Ele conhece a BAP e o vendedor dele. A voz da marca é direta e
próxima, e "trocá-la" é formal demais para a tela.

Correção sugerida (o texto final é do `designer-ux`):
- "Esqueceu a senha? Peça ao administrador da BAP para trocá-la." → "Esqueceu a senha? Fale com a BAP para receber
  uma nova.";
- "…Aguarde 15 minutos e tente de novo, ou peça ao administrador da BAP para trocar a sua senha." → "…Aguarde 15
  minutos e tente de novo, ou fale com a BAP para receber uma nova senha.".

Nas telas que só o admin vê, "administrador" pode ficar ("Só o administrador vê esta página").

## Observação fora desta tarefa (para o manual, não é achado da T-0022)

- O rodapé do site diz "BAP AUTO PARTS", com espaço. A simulação, o portfólio (`Portfolio_Produtos_BAP_AUTOPARTS.pdf`)
  e o nome da empresa usam "BAP AUTOPARTS". Na tela do admin, as duas grafias aparecem juntas. [SUPOSIÇÃO] A grafia
  oficial é "BAP AUTOPARTS". Fica como pergunta ao Alexandre no manual "a aprovar". Não mexer no rodapé dentro da
  T-0022.

## Reteste

Depois da correção do `web-site`, conferir os prints novos em 1366 e 390 px:
- MC-0002: a moldura com 48 × 30 px (computador) e 40 × 26 px (celular), e o toque do botão com 44 px;
- MC-0003: as logos coloridas na linha desativada;
- MC-0004: o "Admin" branco no menu aberto;
- MC-0005: a coluna "Usuário" em Poppins;
- MC-0006: o `alt` nas cinco páginas;
- MC-0007: os dois textos novos.

| ID | Situação |
|---|---|
| MC-0002 | fechado em 21/11 23:11 |
| MC-0003 | fechado em 21/11 23:11 |
| MC-0004 | fechado em 21/11 23:11 |
| MC-0005 | fechado em 21/11 23:11 |
| MC-0006 | fechado em 21/11 23:11 |
| MC-0007 | fechado em 21/11 23:11 |

### Reteste · 21/11/2026 23:11 (Manaus) · **LIBERADO**

Conferido nos 34 prints novos (refeitos às 23:09) e no `sim.css` e nos HTML da simulação:

- **MC-0002:** a moldura ficou com 48 × 30 px no computador e 40 × 26 px no celular, com 3 px de folga (`sim.css`,
  `:root` e o `@media (max-width: 640px)`). Nos prints `04` a `07` e `10` a `16`, a moldura do cliente ficou menor que
  o logo da BAP, nas duas larguras. Em 390 px, o logo da BAP voltou a ser o primeiro ponto do cabeçalho. Fechado.
- **MC-0003:** a regra do `grayscale` saiu. Na "Oficina Teste", o logo da BAP aparece com as cores certas, e a linha
  se distingue pela etiqueta "Desativado" e pelo texto `--texto-2`. Fechado.
- **MC-0004:** `.conta-cab span:not(.tag)`. O "Admin" do menu aberto ficou branco no `--escuro` (18,26:1), no `07` e
  no `16`. Fechado.
- **MC-0005:** a `.us-login` ficou em Poppins 500, 13 px, sem família monoespaçada. Fechado.
- **MC-0006:** o `alt="bap componentes de qualidade"` está nas cinco páginas do cartão do login, e não sobrou nenhum
  "BAP Autoparts" no `alt`. Fechado.
- **MC-0007:** a ajuda ficou "Esqueceu a senha? Fale com a BAP para receber uma nova senha.". No bloqueio, ficou só
  "Muitas tentativas seguidas. Aguarde 15 minutos e tente de novo.", porque a ajuda logo abaixo já diz com quem falar.
  O "administrador" ficou só nas telas do admin. Fechado.

**Pergunta do `web-site`: a regra do MC-0002 vale também para a logo da lista de usuários (64 × 40 px)?** Não. A regra
vale para o mesmo nível do logo principal da BAP: o cabeçalho. Na lista, a logo é dado da linha (qual empresa é aquele
usuário), dentro do conteúdo e só para o admin. Ela não divide o nível com o logo da BAP do cabeçalho, como o menu
aberto (84 × 52 px) e o envio da logo (104 × 64 px). Os 64 × 40 px da lista ficam como estão.

**Observação nova, para o manual (não é achado da T-0022):** o nome da empresa do admin passou de "BAP AUTOPARTS" para
"BAP Autoparts". Na mesma tela, o rodapé diz "BAP AUTO PARTS". Isso entra na pergunta da grafia oficial, já anotada
acima. A simulação pode ir assim.
