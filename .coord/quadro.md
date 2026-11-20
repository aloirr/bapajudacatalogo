# Quadro do time · Catálogo BAP

Atualizado em 20/11/2026 11:28 (Manaus). Como usar: `.coord/README.md`. Uma linha por tarefa; o detalhe fica em `.coord/tarefas/`.

| ID | Tarefa | Dono | Ajudantes | Situação | PR |
|---|---|---|---|---|---|
| [T-0001](tarefas/T-0001.md) | Conferir a montagem do repositório (contagens, fotos, site abrindo) | testes | catalogo-dados, web-site | CONCLUÍDA | #2, #3 |
| [T-0002](tarefas/T-0002.md) | Testes automáticos do site e CI no GitHub Actions | testes | web-site, revisor-codigo | CONCLUÍDA | #9, #10 |
| [T-0003](tarefas/T-0003.md) | Publicar no Render (Blueprint) e checklist do domínio | web-site | gerente-projetos, testes | CONCLUÍDA | #7 |
| [T-0004](tarefas/T-0004.md) | Relatório de fotos que faltam e de produtos sem aplicação ou referência | catalogo-dados | testes | CONCLUÍDA | #5 |
| [T-0005](tarefas/T-0005.md) | Consulta por placa (API PLACAS): desenho e serviço no Render | integracao-placas | web-site, revisor-codigo | EM ANDAMENTO (falta a chave no Render) | #22, #23, #24, #25 |
| [T-0006](tarefas/T-0006.md) | Proposta de busca por medida (pneus, rolamentos, baterias) | web-site | catalogo-dados | NOVA | — |
| [T-0007](tarefas/T-0007.md) | Terminal Axial com "FORNECEDOR AMPRI": simulação da limpeza e "fornecedor" na TRAVA | catalogo-dados | web-site, testes | CONCLUÍDA | #8, #11, #12 |
| [T-0008](tarefas/T-0008.md) | Busca por veículo ("Gol" × "Golf") e aba Código com a marca na frente | web-site | testes | CONCLUÍDA | #14, #15 |
| [T-0009](tarefas/T-0009.md) | Preço no site: TER556556 com "R$" na APLICACAO, e "R$" na TRAVA | catalogo-dados | web-site, testes | CONCLUÍDA | #11, #12 |
| [T-0010](tarefas/T-0010.md) | Pastilhas com dois códigos: PAFnnnn × PAF.nnnn (103 pares) | catalogo-dados | web-site, testes | CONCLUÍDA | #13, #18, #19, #21 |
| [T-0011](tarefas/T-0011.md) | Busca palavra por palavra no catálogo online (só produtos) e aba Placa | web-site | testes | CONCLUÍDA | #26, #27 |
| [T-0012](tarefas/T-0012.md) | Fim do ATUALIZAR_CATALOGO.bat: o repositório é a base oficial | gerente-projetos | po, web-site | CONCLUÍDA | #16, #17 |
| [T-0013](tarefas/T-0013.md) | Filtros do resultado abrem todos expandidos | web-site | testes | CONCLUÍDA | #20 |
| [T-0014](tarefas/T-0014.md) | Cartão com as referências, "Salvar em PDF" (A4), produto em janela e foto menor com ampliação | web-site | testes | EM ANDAMENTO (aprovada; versão final) | — |

## Fila

1. T-0001 (base para as outras).
2. T-0002 e T-0004, em paralelo, logo depois da T-0001 (decisão 3a, R-20261120-093235-alexandre).
   - Também logo depois da T-0001: T-0007 (simulação primeiro) e T-0008 (simulação de tela primeiro).
3. T-0003 (depois que a T-0002 estiver no `main`).
4. T-0005 (serviço no ar; falta a 1ª consulta real) e T-0006 (proposta para aprovação; não há código).
5. T-0014: aprovada (janela também no celular; foto do cartão amplia; botão "+ Detalhes"). PR final às 12:30.

## Regras novas de hoje
- Merge: o PO autoriza todos os merges, inclusive os de governança, conferindo número, head, arquivos, CI verde e revisão LIBERADO; o gerente executa (R-20261120-111133 e R-20261120-111308-alexandre). As simulações de tela e de PDF continuam indo ao Alexandre.
- Publicação: o Render publica sozinho a cada merge no `main` (regra 5a, R-20261120-100005-alexandre).
