# T-0038 · Parecer de UX da simulação (Onboarding do Vendedor, com os 10 passos da visita)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 25/11/2026 (Manaus) |
| O que foi revisto | Tarefa: `origin/po/T-0038-onboarding:.coord/tarefas/T-0038.md`. Simulação: `origin/catalogo-grafico/T-0038-onboarding`, `cecc002`: os 26 slides (`catalogo_grafico/simulacoes/T-0038/slide_01.png` a `slide_26.png`, 2001 × 1125 px), o `mosaico_8_slides.png` e o `catalogo_grafico/gerador/treinamentos/onboarding_vendedor.json`. Comparação: `catalogo_grafico/treinamentos/PADRAO_TREINAMENTO.md` (T-0032) e o catálogo online real (prints da T-0033, T-0034 e T-0035) |
| Pedido | "Preciso do onboard do vendedor atualizado o atual nao tem os 10 passos do vendedor" (25/11/2026) |
| Resultado | **LIBERADO COM AJUSTES**: nenhum 🔴; 6 🟡 (O1 a O6), todos do `catalogo-grafico`, a corrigir antes de as páginas irem ao Alexandre. O slide 21 precisa ser reescrito (O1). Vão 3 perguntas ao Alexandre (P1 a P3) |

Sem preço e sem estoque em número: 🟢. Nenhum nome de colaborador, só cargos: 🟢.

A cor, a fonte e os tipos novos de slide ficam com o `design-de-marca`. Nos PNGs a fonte não é a Poppins, porque a renderização usou uma fonte de substituição; quem confere é ele. Aqui falo de leitura, hierarquia e consistência com o site.

## 1. Hierarquia e legibilidade

- 🟢 **Estrutura do padrão.** Capa, 3 slides de abertura, módulos com seção e conteúdo, checklist (10 itens), teste (6 perguntas) e obrigado. Kicker, título, dica de campo e rodapé seguem o padrão em todos os slides.
- 🟢 **Leitura.** O corpo dos cartões e das tabelas está no tamanho do padrão (S6, 12 pt ou mais), com o texto escuro sobre o fundo claro. O verde-claro fica só no fundo, nunca no texto.
- 🟢 **Checklist (24) e teste (25).** Os 10 itens do checklist seguem os 10 passos e as perguntas do teste cobrem o conteúdo. Boa amarração.
- 🟡 **O2. Os cartões pequenos não pertencem à coluna em que estão.** Nos slides 6, 17 e 21, três cartões escuros com uma palavra grande ("Segunda / Quarta / Todo dia", "3·2·1 / Feedback / Segunda", "Veículo / Código / Sem preço") ficam em cima de 6 cartões brancos. O desenho diz que cada cartão branco é da coluna de cima, mas não é:
  - no slide 6, "Quarta: pedidos do dia transmitidos antes das 16:00" está embaixo de "Segunda", e "RPS: performance…" embaixo de "Todo dia";
  - no slide 17, "Na RPS, os motivos entram…" está embaixo de "3·2·1";
  - no slide 21, "Acesso só com login" está embaixo de "Veículo".

  Correção: cada cartão vai para a coluna do seu tema (slide 6: os 3 itens da RPS sob Segunda, o pedido das 16:00 e a capacitação sob Quarta, os 2 de análise de mercado sob Todo dia). Quando o cartão não for de nenhuma coluna, a faixa de baixo precisa se separar dos cartões escuros (um respiro maior ou um rótulo "Na prática"). Dono: `catalogo-grafico`.
- 🟡 **O3. Slide 19: cartão quase vazio.** O cartão "A indicação conta como prospecção?" ocupa toda a altura do slide e tem só 2 linhas de resposta; a metade de baixo fica em branco. A altura do cartão deve acompanhar o texto, ou o slide usa a largura toda para a regra e os números ("10" e "Mochila"). Dono: `catalogo-grafico`.

## 2. As tabelas dos 10 passos (slides 10 e 11)

- 🟢 **Divisão em 5 + 5** com "(1 de 2)" e "(2 de 2)", o cabeçalho repetido e a fonte no pé, como manda o S6. Os 10 passos estão na ordem da fonte, com o Passo em negrito (é o nome), o número à esquerda e a pergunta entre aspas.
- 🟡 **O4. A linha do passo 5 encosta nas bordas.** No slide 10, a pergunta-chave do passo 5 tem 4 linhas e toca o topo e o pé da célula, sem respiro. Sobra espaço no slide, entre a fonte e a dica. A linha deve crescer com o texto e manter o mesmo respiro das outras (cerca de 0,08" em cima e embaixo). Dono: `catalogo-grafico`.
- 🟡 **O5. "—" seguido de explicação (slide 11, passos 7, 8 e 9).** "— (cartazete, adesivo de visita de rota…)" mistura dois sinais: o "—" quer dizer "sem pergunta", e o parêntese diz o que fazer. Na leitura, parece que falta texto. O texto é o da fonte e não muda, mas a forma pode deixar a diferença clara:
  - o "—" sai e o que está no parêntese vai sem parênteses, em itálico e na mesma cor escura do corpo (o cinza de apoio é proibido no corpo da tabela);
  - ou o "—" fica sozinho e a explicação passa para a coluna Passo, numa 2.ª linha menor.

  O `testes` confere que as palavras continuam iguais à fonte. Dono: `catalogo-grafico`.

## 3. O negrito errado do slide 7

- 🟡 **O6.** Na tabela do Dia Foco, as colunas "Dia" **e** "Semana 1" estão em negrito, enquanto "Semana 2" e "Semana 3" não estão. Parece que a semana 1 é mais importante. O padrão manda negrito só na 1.ª coluna. Nos slides 10 e 11, a 1.ª coluna é o "#", e o negrito certo vai no "Passo". Pelo jeito, o gerador põe negrito nas 2 primeiras colunas sempre. Regra proposta: negrito numa coluna só, que é a 1.ª que não é só número. Dono: `catalogo-grafico`.

## 4. Tamanho e módulos de um slide

- 🟢 **26 slides** é a medida certa para um onboarding: os treinamentos originais têm de 40 a 47, para 1h45 a 2h15, e este é um roteiro de visita, não um curso técnico.
- 🟡 **Módulos 05, 06 e 07 têm um slide de conteúdo cada** (19, 21 e 23). O padrão pede de 2 a 6 por módulo; com um só, o slide de seção pesa tanto quanto o conteúdo. **Recomendação (P1):**
  - o **05 "Indicou, ganhou"** entra no **04 "Fechamento"**. É o passo 10, que fecha a visita, e o slide 16 já fala do fechamento. O 04 fica com 3 slides: 3 etapas, acompanhamento e Indicou, ganhou;
  - o **06 "Catálogo online"** e o **07 "Ferramentas na rota"** viram um módulo só, **"Ferramentas na rota"**, com 2 slides: o catálogo online (21) e onde cada ferramenta entra (23).

  O onboarding fica com 24 slides e 5 módulos, dentro do padrão (5 a 7), e os Tópicos (slide 3) ficam com 5 cartões e o do Fechamento.

## 5. Slide 21 (catálogo online) conferido com o site real

- 🟡 **O1. O slide não bate com o site em 5 pontos.**

  | No slide | No site | Fonte |
  |---|---|---|
  | "Veículo: busca pela montadora, pelo modelo e pelo ano" | Falta a **placa**: o site tem o campo "Placa do veículo" ao lado da busca, que é a forma mais rápida no balcão. Depois da placa, ou sem ela, há as listas Marca, Modelo, Ano, Motor e Versão. Desde a T-0033, com ano escolhido, só aparece o que tem o ano batendo | prints da T-0033 |
  | "Código: código BAP ou referência cruzada" | Certo, e o mesmo campo também acha pelo código de barras (EAN) | `site/app.js`, código exato |
  | "Busca geral pelo nome do produto" | O campo é um só, "Código, descrição ou aplicação": busca a descrição e a aplicação juntas, com o exemplo "gol 2007 amortecedor" | prints da T-0033 |
  | "Ofereça junto: o item que vai com a peça" | No site o nome é **"Leve também"** desde a R-20261120-141100b. Usar o nome que o vendedor vai ver na tela | janela do produto, T-0033 |
  | "Acesso só com login de vendedor" | Todo usuário entra com login, e o cliente também tem o dele (criado pelo admin em "Criar usuários") | T-0022, T-0034 |
  | "Disponibilidade: consulte na aba própria" | A aba se chama **"Estoque"** e fica no menu da conta. Só a vê quem tem "Pode ver o estoque" (ver P2) | T-0034 |

  Além disso, "Sem preço: a ficha do produto pode ser mostrada ao cliente" e "Ao cliente, só a ficha do produto, nunca a disponibilidade" dizem quase a mesma coisa em dois cartões. Uma informação, um lugar: junte os dois num só.

  **Texto proposto para o slide 21** (o `catalogo-grafico` ajusta ao tamanho dos cartões):
  - Cartões grandes:
    - "**Placa ou veículo**: placa, ou Marca, Modelo, Ano, Motor e Versão";
    - "**Código**: código BAP, referência cruzada ou código de barras";
    - "**Um campo só**: descrição e aplicação juntas ('gol 2007 amortecedor')".
  - Cartões pequenos:
    - "Aplicação em tabela: marca, modelo, cilindrada, versão e ano";
    - "Leve também: o item que vai com a peça";
    - "Copiar código e Salvar em PDF na ficha do produto";
    - "Cada usuário com o seu login; o cliente também tem o dele";
    - "Estoque: aba interna, no menu da conta; nunca mostre ao cliente";
    - "Sem preço: a ficha pode ser mostrada ao cliente".

  Dono: `catalogo-grafico`. Se a P2 disser que nem todo vendedor vê a aba Estoque, o cartão vira "Estoque: peça ao supervisor".
- 🟢 O slide 23 ("Onde cada ferramenta entra na visita") bate com o site e com os passos.

## 6. Perguntas ao Alexandre (pelo `po`, com a simulação)

- **P1.** "Posso juntar o 'Indicou, ganhou' ao módulo Fechamento e o 'Catálogo online' ao 'Ferramentas na rota'? O onboarding fica com 24 slides e 5 módulos." Recomendo que sim.
- **P2.** "Todo vendedor externo vai ter a aba Estoque (a permissão 'Pode ver o estoque'), ou só o usuário bap.vendedor?" O slide 21 muda conforme a resposta.
- **P3.** "Os slides 9 e 23 usam um desenho novo, o fluxo em setas com o passo destacado em laranja. O padrão da T-0032 deixou o 'passo a passo numerado' para desenhar depois. Aprova esse desenho para entrar no padrão?" A cor e a forma ficam com o `design-de-marca`. Pela UX, o fluxo é claro e mostra bem os 5 blocos e os 10 passos.

## Donos

| Achado | O quê | Dono |
|---|---|---|
| O1 | Slide 21 reescrito conforme o site real | `catalogo-grafico` |
| O2 | Cartões dos slides 6, 17 e 21 na coluna do seu tema | `catalogo-grafico` |
| O3 | Cartão do slide 19 na altura do texto | `catalogo-grafico` |
| O4 | Respiro da linha do passo 5 (slide 10) | `catalogo-grafico` |
| O5 | "—" e a explicação dos passos 7, 8 e 9 (slide 11), sem mudar as palavras | `catalogo-grafico`; o `testes` confere o texto |
| O6 | Negrito numa coluna só (slide 7 e no gerador) | `catalogo-grafico` |
| P1 a P3 | Perguntas ao Alexandre | `po` |
| Fonte e tipos novos | Poppins na renderização; fluxo em setas, números grandes e laranja de destaque | `design-de-marca` |

## Reteste

Depois de O1 a O6 (e da P1, se aprovada): os slides 6, 7, 10, 11, 17, 19 e 21 de novo, os Tópicos (slide 3) e um mosaico com todos os slides para conferir a numeração.
