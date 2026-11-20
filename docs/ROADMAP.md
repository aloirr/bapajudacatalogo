# Roadmap do catálogo BAP online (20/11/2026)

| Fase | Entrega | Situação |
|---|---|---|
| 1 | Site estático com a busca geral, por veículo (montadora, modelo, ano, sistema) e por código ou referência cruzada. A página do produto tem foto, aplicação, referências, ficha técnica e leve também. | **Feito** (20/11) |
| 2 | Publicar no Render: Blueprint do `render.yaml`, depois domínio (ex.: `catalogo.bapautoparts.com.br`) [SUPOSIÇÃO] | Render **feito** (T-0003); domínio a fazer |
| 3 | **Consulta por placa (API PLACAS)** | **Feito** (T-0005, em uso desde 20/11 11:29). Detalhe abaixo. |
| 4 | Fotos que faltam (lista no `site/data/produtos.json`: produtos sem `i`). Busca por medida (pneus, rolamentos, baterias). | A fazer |
| 5 | BAP Ajuda 2.0 como aplicativo, lendo os mesmos dados deste repositório | Planejar |

## Fase 3 em detalhe: a consulta por placa

1. **Serviço web pequeno** no Render (uma função ou um Web Service):
   - Recebe a placa e chama a API PLACAS com a chave guardada em variável de ambiente (`API_PLACAS_TOKEN`).
   - Devolve montadora, modelo, ano e motor.
   - A chave **nunca** vai para o navegador.
2. **Cache** por placa (24 h), para economizar consultas. Limite de chamadas por IP.
3. No site, o campo **Placa**, ao lado da busca, chama o serviço e preenche a busca por veículo (montadora, modelo e ano).
4. **Antes de ligar:** confirmar com o Alexandre o contrato e o custo por consulta, o formato da resposta e a LGPD (não guardar placa ligada a pessoa).

## Sincronização

- Hoje: a base oficial está no repositório. As mudanças entram por PR com "aprovado", e o Render publica a cada merge. As fotos novas chegam pelo "Upload files" em `fotos-novas/` (T-0012). O `ATUALIZAR_CATALOGO.bat` foi aposentado.
- Depois: rodar todo dia, junto com a sincronização da BAP Central feita pelas assistentes.
