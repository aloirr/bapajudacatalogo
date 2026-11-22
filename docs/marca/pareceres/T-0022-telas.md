# T-0022 · Parecer de marca das telas reais do login (PR #114)

| Campo | Valor |
|---|---|
| Tarefa | T-0022 (login do catálogo), passo 2: as telas no site (branch `web-site/T-0022-telas`, PR #114) |
| Revisor | design-de-marca |
| Data | 1ª leitura: 21/11/2026, depois do `e83f7f7` (23:48, Manaus). Reteste: 22/11/2026, no head final `8e529f5` (00:17, Manaus). Registrado aqui em 22/11/2026 00:23 (Manaus) |
| O que foi visto | O diff do `web-site/T-0022-telas` contra o main (`site/styles.css`, `site/conta.js`, `site/entrar/`, `site/trocar-senha/`, `site/admin/usuarios/`, `site/admin/pdfs/` e o rodapé do `site/index.html`) e o admin inicial do serviço (`servicos/login/server.mjs`, branch `integracao-placas/T-0022-login`) |
| Base de comparação | A simulação aprovada pelo Alexandre (R-20261122-032433-alexandre, "1 a 10: a") e o parecer `docs/marca/pareceres/T-0022-simulacao.md` |
| Parecer | **LIBERADO** no `e83f7f7`, com MC-0007 e MC-0008 (baixos, não seguram). **LIBERADO** no head final `8e529f5`, com o MC-0007 e o MC-0008 fechados |

## O que está certo (manter)

- **As telas são as da simulação aprovada (9 a).** O logo certo para cada fundo: o `logo_branco` no cabeçalho escuro e
  o `logo_escuro` no cartão branco do login e dentro da moldura branca do botão do canto. O favicon é o `logo_escuro.png`,
  como no site. Nenhum logo esticado, girado, recolorido (não voltou o `grayscale` do MC-0003), com sombra ou contorno.
- **Logo do cliente (6 a):** moldura branca em retângulo deitado. No cabeçalho, 48 × 30 px no computador e 40 × 26 px no
  celular (`site/styles.css`, `--conta-logo-l` e `--conta-logo`, e o `@media`), menor que o logo da BAP. No menu aberto,
  84 × 52 px, fora do nível do logo principal.
- **Sem logo (7 a):** o botão do canto mostra o logo inteiro da BAP, pequeno (`site/entrar/comum.js`, `LOGO_BAP`). Nada
  de corte do PNG nem de símbolo solto.
- **Cores de erro (8 a):** `--erro #B42318` e `--erro-claro #FDECEA` estão no `:root` do `site/styles.css`, com o
  comentário dos contrastes, e são usadas só pelo token (`var(--erro…)`), no erro do login, nos campos com erro e no
  botão "Desativar". Nenhum hex solto nas regras. Nada disso entra nos PDFs.
- **Grafia (10 a):** o rodapé das telas novas e o do `site/index.html` passaram a "BAP AUTOPARTS".
- **Tipografia:** só Poppins, nos pesos do site. A coluna "Usuário" continua sem família monoespaçada (MC-0005).
- **Sem preço, sem estoque** e sem logo, cor ou tipografia de terceiros.

## Achados

> O MC-0007 desta folha **não é** o MC-0007 da simulação (texto "administrador da BAP", já fechado). O número saiu
> repetido por engano. Ele fica assim porque já está citado no código (`site/conta.js`) e nos recados. O próximo
> achado livre é o **MC-0009**.

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0007 | Botão do canto, usuário sem logo: `site/conta.js:61` (no `e83f7f7`), `const altLogo = eu.temLogo ? … : "Logo da BAP"` | logo | manual a aprovar, logo (texto alternativo "bap componentes de qualidade") | baixa | `"Logo da BAP"` → `"bap componentes de qualidade"`, o mesmo do topo do site, porque ali aparece o logo inteiro da BAP (7 a). Na lista de usuários (`site/admin/usuarios/usuarios.js`), o "Logo da BAP" pode ficar: lá a logo é dado da linha (MC-0006 da simulação) | web-site |
| MC-0008 | Nome da empresa do admin, no menu do canto e na lista de usuários: vem do admin inicial, criado no 1º uso por `servicos/login/server.mjs` | voz | decisão 10 a (grafia oficial "BAP AUTOPARTS") | baixa | Na simulação, a empresa do admin aparecia como "BAP Autoparts". O admin inicial tem de nascer com `empresa: 'BAP AUTOPARTS'`: conferir e deixar a regra escrita | integracao-placas |

## Reteste

| ID | Situação |
|---|---|
| MC-0007 | fechado em 22/11 00:23, no `8e529f5`: `site/conta.js:59`, `… : "bap componentes de qualidade"` |
| MC-0008 | fechado em 22/11 00:23: `servicos/login/server.mjs:387-388`, `empresa: 'BAP AUTOPARTS'`, com o comentário da resposta 10 a (branch `integracao-placas/T-0022-login`, `ea90b99` em diante, revisado pelo `revisor-codigo`). O `servicos/login/LEIA.md` diz o mesmo |

## Pendência fora desta tarefa: "BAP AUTO PARTS" no catálogo gráfico

A decisão 10 a vale para todo material, mas o PR #114 só mexe no site. Ainda há a grafia errada, com espaço, no
`catalogo_grafico/` (dono: `catalogo-grafico`). O gerente abre a tarefa. Como muda PDF e apresentação, a primeira
entrega é a simulação:

| Arquivo:linha | Hoje | Depois |
|---|---|---|
| `catalogo_grafico/gerador/print_cat.py:481` | `hero(dc, 'BAP AUTO PARTS', 'Por que BAP?', …)` | `'BAP AUTOPARTS'` |
| `catalogo_grafico/gerador/apres_bemol.py:68` | `self.t(72, 34, 'BAP AUTO PARTS', …)` | `'BAP AUTOPARTS'` |
| `catalogo_grafico/gerador/apres_ppt.js:20` | `text: 'BAP AUTO PARTS'` | `'BAP AUTOPARTS'` |
| `catalogo_grafico/gerador/simulacao_detalhe/print_cat.py:425` | `hero(dc, 'BAP AUTO PARTS', 'Por que BAP?', …)` | `'BAP AUTOPARTS'` |

[SUPOSIÇÃO] O `simulacao_detalhe/` é cópia de trabalho de uma simulação antiga. Se não for mais usado, o
`catalogo-grafico` pode só registrar e não regerar nada a partir dele.
