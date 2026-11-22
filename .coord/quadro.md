# Quadro do time · Catálogo BAP

Atualizado em 21/11/2026 22:40 (Manaus). Como usar: `.coord/README.md`. Uma linha por tarefa; o detalhe fica em `.coord/tarefas/`.

| ID | Tarefa | Dono | Ajudantes | Situação | PR |
|---|---|---|---|---|---|
| [T-0001](tarefas/T-0001.md) | Conferir a montagem do repositório (contagens, fotos, site abrindo) | testes | catalogo-dados, web-site | CONCLUÍDA | #2, #3 |
| [T-0002](tarefas/T-0002.md) | Testes automáticos do site e CI no GitHub Actions | testes | web-site, revisor-codigo | CONCLUÍDA | #9, #10 |
| [T-0003](tarefas/T-0003.md) | Publicar no Render (Blueprint) e checklist do domínio | web-site | gerente-projetos, testes | CONCLUÍDA em parte (Render no ar; doc e domínio a fazer) | #7 |
| [T-0004](tarefas/T-0004.md) | Relatório de fotos que faltam e de produtos sem aplicação ou referência | catalogo-dados | testes | CONCLUÍDA | #5 |
| [T-0005](tarefas/T-0005.md) | Consulta por placa (API PLACAS): desenho e serviço no Render | integracao-placas | web-site, revisor-codigo | CONCLUÍDA (em uso desde 11:29) | #22, #23, #24, #25 |
| [T-0006](tarefas/T-0006.md) | Proposta de busca por medida (pneus, rolamentos, baterias) | web-site | catalogo-dados | NOVA | — |
| [T-0007](tarefas/T-0007.md) | Terminal Axial com "FORNECEDOR AMPRI": simulação da limpeza e "fornecedor" na TRAVA | catalogo-dados | web-site, testes | CONCLUÍDA | #8, #11, #12 |
| [T-0008](tarefas/T-0008.md) | Busca por veículo ("Gol" × "Golf") e aba Código com a marca na frente | web-site | testes | CONCLUÍDA | #14, #15 |
| [T-0009](tarefas/T-0009.md) | Preço no site: TER556556 com "R$" na APLICACAO, e "R$" na TRAVA | catalogo-dados | web-site, testes | CONCLUÍDA | #11, #12 |
| [T-0010](tarefas/T-0010.md) | Pastilhas com dois códigos: PAFnnnn × PAF.nnnn (103 pares) | catalogo-dados | web-site, testes | CONCLUÍDA | #13, #18, #19, #21 |
| [T-0011](tarefas/T-0011.md) | Busca palavra por palavra no catálogo online (só produtos) e aba Placa | web-site | testes | CONCLUÍDA | #26, #27 |
| [T-0012](tarefas/T-0012.md) | Fim do ATUALIZAR_CATALOGO.bat: o repositório é a base oficial | gerente-projetos | po, web-site | CONCLUÍDA | #16, #17 |
| [T-0013](tarefas/T-0013.md) | Filtros do resultado abrem todos expandidos | web-site | testes | CONCLUÍDA | #20 |
| [T-0014](tarefas/T-0014.md) | Cartão com as referências, "Salvar em PDF" (A4), produto em janela e foto menor com ampliação | web-site | testes | CONCLUÍDA | #29, #35, #36, #39, #41, #45, #101 |
| [T-0015](tarefas/T-0015.md) | Três agentes novos: corretor-redundancias, design-de-marca e designer-ux | gerente-projetos | po, revisor-codigo | CONCLUÍDA | #30 |
| [T-0016](tarefas/T-0016.md) | Guardião com a regra de merge do PO, conferência dos merges pelo GitHub e limpeza do CI e do coord.mjs | alexandre | gerente-projetos, testes, revisor-codigo | CONCLUÍDA | #34, #48 |
| [T-0017](tarefas/T-0017.md) | Veículo na base e filtro "Meu veículo" | catalogo-dados | web-site, testes | EM ANDAMENTO (v27 e o JSON da v27 no ar) | #32, #33, #37, #38, #50, #54, #55, #59, #60, #63, #67, #71, #75, #76, #78, #79, #82, #83, #86, #87, #88, #89, #90, #91, #92, #93, #96, #98, #104, #106 |
| [T-0018](tarefas/T-0018.md) | Página inicial nova (opção 4) e contador das peças mais abertas | web-site | integracao-placas, testes | CONCLUÍDA | #42, #43, #45, #46, #49, #50, #52, #53, #56, #57, #58, #62, #65, #66, #74, #81, #95, #97, #101 |
| [T-0019](tarefas/T-0019.md) | "Leve também" no catálogo gráfico em PDF | catalogo-grafico | design-de-marca | CONCLUÍDA | #40, #47, #51, #61, #64, #70, #77, #84, #90, #94, #99, #100 |
| [T-0020](tarefas/T-0020.md) | Graphify no projeto para o time todo | alexandre | gerente-projetos, po | CONCLUÍDA | #69 |
| [T-0021](tarefas/T-0021.md) | Governança: .claude/worktrees/ no .gitignore e commit do designer-ux e do design-de-marca nas suas pastas | alexandre | po, gerente-projetos | CONCLUÍDA | #105 |

## Fila
Main 409d137 (#105).

1. **RD-0293 no PDF (catalogo-grafico):** a composição do kit repetida nas embreagens pesadas vem do `detalhe.essencial` do gerador (A4 p.20, Digital p.112-113, EMB1047071R incluído). Simulação ao Alexandre antes do PR.
2. **Pareceres a gravar:** o do designer-ux da B8 (branch `designer-ux/T-0019-parecer-b8`) e os do corretor (`corretor-redundancias/T-0019-pr99` e `/T-0014-aperto`, com os RD-0289 a RD-0314).
3. **Fora da fila, para decidir depois:**
   - embreagens pesadas: a medida e as estrias aparecem em DESCRICAO, DETALHE_CATALOGO e APLICACAO (catalogo-dados, com simulação);
   - Portfólio: muda se for gerado de novo, porque agrupa pelo SISTEMA da v27 (catalogo-grafico);
   - CIL8546: o "—" no ano do site vem de o site ler o texto (web-site);
   - "(coluna Leve também)" aparece com e sem aspas nos PDFs de pneus;
   - EQUIVALE A ainda pode começar uma linha com "·";
   - o quebra.py usa funções internas do ReportLab (fixar a versão).

## Regras novas (20 e 21/11)
- Merge: como no CLAUDE.md (seção Merge). Nenhum merge vai ao Alexandre (R-20261122-015249-alexandre).
- Perguntas ao Alexandre: todas num bloco só, numeradas, com a recomendação marcada, para ele copiar e colar (R-20261122-015249-alexandre).
- Publicação: o Render publica sozinho a cada merge no `main` (regra 5a, R-20261120-100005-alexandre).
- Horas nas tarefas: no "Pedido (literal)" vai a hora do chat; no Registro, a hora do recado (`criado_em`) e, nos merges, a do `git log origin/main`. Por isso pode haver 1 minuto de diferença.
- Rondas do PO e do gerente a cada 30 min; graphify antes de explorar código (R-20261120-203700-alexandre, T-0020).
- BAP Central: não segura a v19 nem a v20 por enquanto (R-20261120-192100-alexandre).
- AUTOIMPACT e AMPRI são concorrentes: só na referência cruzada, e a AUTOIMPACT por último, no site e nos PDFs (R-20261121-112900, o "autorizo" do R-20261121-113400 e o R-20261121-154314-alexandre). A SUNRISE continua como fornecedor, barrada em tudo.
