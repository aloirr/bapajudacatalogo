# Guia do corretor de redundâncias

O `corretor-redundancias` procura o que se repete ou sobra no site, nos PDFs, no texto, no código, nas rotinas, nos testes, nos docs e nas tarefas. Este guia junta as regras que ele cobra. A definição completa do agente está em `.claude/agents/corretor-redundancias.md`.

- **Enxuto:** fica só o que o cliente usa para achar e escolher a peça, ou o que o Alexandre precisa para decidir.
- **3 toques:** da tela inicial ao produto certo em até 3 toques.
- **Onde se olha:** no print real. O site em 1366 e 390 px; o PDF em A4.

## Regras de texto R1 a R4

- **Origem:** pedido do Alexandre, R-20261120-155430-alexandre (20/11/2026 ~15h54, Manaus): "na verdade tire ela, pois é redundante. passe essas regras para o corretor de redundancia".
- **Vale desde:** 20/11/2026.
- **Onde vale:** toda tela do site, todo PDF de catálogo e todo texto para cliente.

### R1 · nome da marca repetido
- **Regra:** um selo ou uma etiqueta com o nome da empresa ao lado do logo ou do cabeçalho, que já mostram a marca, é redundante e sai.
- **Exemplo:** a etiqueta "BAP AUTO PARTS" acima do título da faixa da home, logo abaixo do cabeçalho com o logo `bap`.
- **Como conferir:** no print, se o logo ou o nome da marca já está à vista na mesma dobra, nenhum selo repete o nome.

### R2 · frase que repete os rótulos
- **Regra:** uma frase de instrução que só repete o que os rótulos dos campos ou dos botões já dizem é redundante e sai.
- **Exemplo:** "Busque por código, referência, veículo ou placa." acima dos campos "Código, descrição ou aplicação" e "Placa do veículo".
- **Como conferir:** leia a frase e os rótulos logo abaixo. Se a frase não acrescenta nada que o cliente use para agir, ela sai.

### R3 · subtítulo que repete o título ou ensina a usar
- **Regra:** um subtítulo que repete o título, ou que explica o óbvio, sai.
- **Exemplo:** "Toque em um sistema para ver todos os produtos dele." abaixo de "Navegue por sistema", em botões que já mostram "N produtos" (RD-0146).
- **Como conferir:** o subtítulo só fica se der um dado novo que o cliente usa para escolher. Explicação de como clicar, tocar ou ampliar é excesso.

### R4 · título e subtítulo que se contradizem
- **Regra:** se o subtítulo mede outra coisa, o texto é revisto.
- **Exemplo:** "Pesquisas recentes" × "As mais abertas". O título fala de pesquisas recentes, e o subtítulo, das mais abertas. São medidas diferentes.
- **Como conferir:** o título, o subtítulo e o dado que a tela mostra falam da mesma medida (o quê, quanto, em qual período).

### Como as regras são aplicadas
- **Em todo PR:** o parecer confere R1 a R4 junto com o checklist da definição do agente.
- **No que já está no ar:** quando o corretor acha um caso novo, ele abre um RD no `CATALOGO.md` e manda ao `gerente-projetos`.
- **Texto que o Alexandre vê:** a mudança vai a ele antes, pelo `po`, com os prints de 1366 e 390 px (ou a página A4), como sempre.
- **Cada achado leva:** a regra (R1 a R4) no campo "Tipo" e o texto final pronto (antes → depois).

## As 4 regras de tela (site e PDF)

1. **Uma informação, um lugar.** O que uma seção já mostra não aparece de novo na mesma tela ou página.
2. **Aviso só na área de aviso.** No site, ele fica no bloco de aviso da tela, nunca solto no meio do cartão.
3. **Só o que o cliente usa para agir.** O que ele não usa para achar, comparar ou pedir a peça agora sai, mesmo certo e sem repetição.
4. **Texto só com o problema e a ação.** Ex.: "Nenhum produto encontrado · Confira o código ou tente menos palavras".

As R1 a R4 são casos frequentes das regras 1 e 3.

## Redundância útil (não sai)

- O `alt` e o `aria-label` que repetem o texto da tela.
- A busca que aceita o código com e sem hífen.
- O código BAP no cartão e na página do produto: é a chave do pedido.
- O aviso de "mais próximos" quando nenhum produto casa com todas as palavras.
- A trava `TRAVA` e a lista branca `FICHA`: são proteção. Nunca se propõe afrouxar.

Na dúvida, o achado sai como `manter?`, com a explicação.

## Gravidade e liberação

- **Alta:** confunde. **Média:** polui. **Baixa:** estética.
- O PR só vai ao `po` sem achado em aberto, de qualquer gravidade.
- Exceção: achado baixo só em comentário de código ou em título de teste não segura o PR e entra no seguinte.

## Arquivos desta pasta

- `GUIA.md`: este guia.
- `CATALOGO.md`: todos os achados (`RD-nnnn`), com a situação.
- `T-nnnn.md`: o relatório de cada PR.
- `VARREDURA-aaaa-mm-dd.md`: a varredura do site no ar.
