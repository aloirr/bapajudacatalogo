# Quadro do time · Catálogo BAP

Atualizado em 20/11/2026 15:00 (Manaus). Como usar: `.coord/README.md`. Uma linha por tarefa; o detalhe fica em `.coord/tarefas/`.

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
| [T-0014](tarefas/T-0014.md) | Cartão com as referências, "Salvar em PDF" (A4), produto em janela e foto menor com ampliação | web-site | testes | EM ANDAMENTO (filtros f1 no PR da home; falta o aperto do testes) | #29, #35, #36, #39, #41 |
| [T-0015](tarefas/T-0015.md) | Três agentes novos: corretor-redundancias, design-de-marca e designer-ux | gerente-projetos | po, revisor-codigo | CONCLUÍDA | #30 |
| [T-0016](tarefas/T-0016.md) | Guardião com a regra de merge do PO, conferência dos merges pelo GitHub e limpeza do CI e do coord.mjs | alexandre | gerente-projetos, testes, revisor-codigo | EM ANDAMENTO (pacote d na sessão filha) | #34 |
| [T-0017](tarefas/T-0017.md) | Veículo na base e filtro "Meu veículo" | catalogo-dados | web-site, testes | EM ANDAMENTO (v18 no ar; v19 a simular) | #32, #33, #37, #38 |
| [T-0018](tarefas/T-0018.md) | Página inicial nova (opção 4) e contador das peças mais abertas | web-site | integracao-placas, testes | EM ANDAMENTO (contador no ar; home em revisão) | #42, #43 |
| [T-0019](tarefas/T-0019.md) | "Leve também" no catálogo gráfico em PDF | catalogo-grafico | design-de-marca | EM ANDAMENTO (PDFs no PC do Alexandre) | #40 |

## Fila

1. T-0018: o PR da home (com o contador ligado e a imagem B da op4f); depois, o aperto do testes. Prazo do Alexandre: 15:00 (R-20261120-142100).
2. T-0014: os filtros f1 (no PR da home) e o PR de aperto do testes.
3. T-0016: o pacote d na sessão filha e o merge do #34.
4. T-0017: a simulação da v19, para o "aprovado".
5. T-0019: os PDFs novos, quando o Alexandre rodar o gerador no PC dele.
6. T-0006: a proposta para aprovação (não há código).

## Regras novas de hoje
- Merge: o PO autoriza todos os merges, inclusive os de governança, conferindo número, head, arquivos, CI verde e revisão LIBERADO; o gerente executa (R-20261120-111133 e R-20261120-111308-alexandre). As simulações de tela e de PDF continuam indo ao Alexandre.
- Publicação: o Render publica sozinho a cada merge no `main` (regra 5a, R-20261120-100005-alexandre).
- Horas nas tarefas: no "Pedido (literal)" vai a hora do chat; no Registro, a hora do recado (`criado_em`) e, nos merges, a do `git log origin/main`. Por isso pode haver 1 minuto de diferença.
