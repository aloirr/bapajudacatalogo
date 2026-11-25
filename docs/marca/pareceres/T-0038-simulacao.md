# T-0038 · Parecer de marca da simulação do Onboarding do Vendedor

| Campo | Valor |
|---|---|
| Tarefa | T-0038, passo 1: simulação ("Preciso do onboard do vendedor atualizado o atual nao tem os 10 passos do vendedor", 25/11/2026) |
| Revisor | design-de-marca |
| Data | 25/11/2026 (Manaus) |
| O que foi visto | `origin/catalogo-grafico/T-0038-onboarding` (`cecc002`): os 26 slides de `catalogo_grafico/simulacoes/T-0038/` (e o mosaico), o `catalogo_grafico/gerador/treinamentos/onboarding_vendedor.json` (texto e notas) e o `catalogo_grafico/treinamentos/PADRAO_TREINAMENTO.md` (cores, fonte e tipos de slide da T-0032) |
| Base de comparação | `docs/marca/manual.md` ("Nome da marca", decisão 10 a; "Fonte do .pptx", decisão 7 a) e o padrão dos treinamentos da T-0032 |
| Parecer | Simulação: **LIBERADO COM AJUSTES** para o PO levar ao Alexandre. 4 achados baixos (MC-0042 a MC-0045), nenhum segura |

Material **interno** (só no admin, `/admin/pdfs/`), para o vendedor. Leitura e ordem dos slides são do `designer-ux`.
A conferência dos 10 passos com a fonte é do `testes`. Aqui ficam a marca, a voz e as regras do repositório.

## 1. O que está certo

- **Logo:** o logo inteiro, sem corte nem recolor, num quadro branco na capa, nas aberturas de módulo e no Obrigado; o
  logo pequeno no canto dos slides claros, como nos 4 treinamentos da T-0032.
- **Cores:** as do padrão (`#1E2B22` escuro, `#59BA61` verde do logo só em fundo, ícone e texto sobre o escuro,
  `#2F7D36` no texto verde sobre o claro, `#EEF7EF` na dica). O laranja aparece fora do papel em alguns lugares
  (MC-0043).
- **Fonte: vale a Arial.** A especificação da T-0038 fala em "Poppins", mas o padrão dos treinamentos
  (`PADRAO_TREINAMENTO.md`, "Fonte: Arial em tudo") segue a decisão 7 a (`docs/marca/manual.md`, "Fonte do .pptx"): o
  .pptx abre igual em qualquer computador, sem instalar fonte. O Onboarding é o mesmo tipo de material e sai pelo
  mesmo gerador, então fica em Arial, como os outros 4. [SUPOSIÇÃO: a 7 a foi decidida para Lubrificantes e o padrão da
  T-0032 a estendeu a todos os treinamentos. O PO corrige o texto "Poppins" na tarefa ou leva a dúvida ao Alexandre.]
- **Grafia:** "BAP AUTOPARTS" está certo nas notas (2 vezes; nenhum "BAP Autoparts" nem "BAP AUTO PARTS"). Nos
  slides, "BAP" sozinho ("Vendedor BAP", "nossa marca BAP", "mochila exclusiva BAP"), como nos outros treinamentos.
  "www.bapautoparts.com.br · @bapautoparts" no Obrigado é o mesmo que o catálogo digital usa.
- **Sobretítulo "ONBOARDING COMERCIAL":** aceito. "Onboarding" é a palavra do próprio pedido do Alexandre e o nome
  do material antigo ("Onboarding_Vendedor_BAP.pptx"); o sobretítulo diz o tipo de material, e o onboarding não é um
  treinamento de produto. O resto da capa segue o padrão: título, subtítulo e "Equipe Comercial Externa · Novembro de
  2026".
- **Rodapé "Onboarding do Vendedor BAP | Equipe Comercial Externa · uso interno":** certo, é a regra S12 do padrão
  (sugestão da marca na T-0032): o slide pode ser mostrado ao cliente, e o rodapé avisa.
- **Voz:** direta, no "você", com o jeito do vendedor de rota: "Hoje você sai daqui sabendo…", "Nenhum passo é
  pulado", "Bem-vindo ao time. Agora é levar os 10 passos para a rota.". As falas ao cliente são curtas e naturais.
  Os termos internos ("check-in", "share", "follow-up", "RPS", "Dia Foco") são os que o time já usa nas rotinas, e o
  material é interno.
- **"Indicou, ganhou" e a mochila** (slide 19): "Se o indicado se cadastrar e comprar, quem indicou ganha uma mochila
  exclusiva BAP." A mochila é a marca indo junto com o cliente, e "exclusiva BAP" valoriza o brinde. A fala ao
  cliente ("Conhece alguém que trabalha com a linha de produtos que te apresentei e ainda não compra BAP?") é a da
  fonte, no tom próximo do balcão. A regra da prospecção ("Não. Só conta quando o vendedor vai ao indicado…") é clara.
  Não há foto nem desenho da mochila, e não precisa. [SUPOSIÇÃO: o brinde existe hoje; se mudar, o slide muda junto.]
- **Regras do repositório:** sem nome de pessoa (só cargos: vendedor, supervisor, gerente, time); sem preço em valor
  ("preço" só como motivo de não fechar e "Sem preço" na tela); sem estoque em número ("disponibilidade" no lugar, pela
  trava); sem meta numérica ("meta de giro do expositor" aparece sem número; "check-in a 100 m" e "Top 30 clientes" não
  são meta de venda). Nenhum logo, cor ou nome de terceiros.

## 2. Achados

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0042 | Slide 21 ("O catálogo online na visita"), cartão "Ofereça junto: o item que vai com a peça"; `onboarding_vendedor.json`, linha 736 | voz | manual a aprovar (voz) | baixa | No site, a seção se chama **"Leve também"** desde a R-20261120-141100b. O vendedor procura um nome que a tela não tem. Antes → depois: "Ofereça junto: o item que vai com a peça" → "Leve também: o item que vai com a peça" | `catalogo-grafico` |
| MC-0043 | Laranja fora do papel: slide 9 (seta "Fechar"), slide 23 (seta "Passo 8"), slide 14 (título "Feito quando" no cartão escuro), slide 16 (ícone e "3 · VOCÊ RESOLVE") e slide 19 ("Mochila" em `#8A3F00`, grande) | cor | padrão dos treinamentos (T-0032), "Cores": laranja `#F28C28` só no ícone de alerta e no círculo do quiz; `#8A3F00` só na palavra "ATENÇÃO" | baixa | Nos treinamentos, o laranja quer dizer "atenção". Usado como destaque, ele gasta esse sinal: o vendedor lê "Fechar" e "Mochila" como alerta. Antes → depois: a seta em destaque em verde-escuro `#2F7D36` (ou a seta cheia em `#1E2B22`); "Feito quando" em `#59BA61` sobre o escuro, como o "Foto" do mesmo cartão; "Mochila" em `#2F7D36`, como o "10" ao lado. No slide 16, se o laranja de "Você resolve" vier do original aprovado do "Fechamento em 3 etapas", ele fica [SUPOSIÇÃO: o `catalogo-grafico` confirma] | `catalogo-grafico` |
| MC-0044 | Slide 3 (tópicos): "04 · Fechamento" (o módulo) e o cartão final "✓ Fechamento" (checklist e teste); slides 24 e 25 com o kicker "FECHAMENTO" | voz | manual a aprovar (voz) | baixa | Aqui "fechamento" é o nome do módulo 04 (fechar o pedido), e a mesma palavra também nomeia o fim do material. Antes → depois, só neste material: o cartão final "✓ Encerramento" ("Checklist do vendedor e teste de conhecimentos") e o kicker "ENCERRAMENTO" nos slides 24 e 25. Nos treinamentos de produto, "✓ Fechamento" continua como no padrão | `catalogo-grafico` |
| MC-0045 | Slide 21, cartão "Disponibilidade: consulte na aba própria antes de ofertar"; `onboarding_vendedor.json`, linha 739 | voz | manual a aprovar (voz) | baixa | No catálogo, a aba se chama "Estoque" (menu de cima no computador; menu da conta no celular, com o ícone de caixa). "Aba própria" não diz onde ela fica, e a trava não deixa escrever "estoque". Antes → depois, sem a palavra travada: "Disponibilidade: consulte no menu da sua conta, no catálogo, antes de ofertar". Se o Alexandre quiser o nome da aba escrito no material interno, é um "autorizo" dele (pelo `po`) só nesta tarefa | `catalogo-grafico` (o "autorizo", se houver: `po`) |

## 3. Para a entrega

- Os 4 ajustes; nada de cor, fonte ou logo novo.
- PDF e .pptx com o mesmo rodapé "uso interno" e o mesmo sobretítulo da simulação.
- O PO corrige "Poppins" → "Arial" na especificação da T-0038 (ou leva a dúvida ao Alexandre).
