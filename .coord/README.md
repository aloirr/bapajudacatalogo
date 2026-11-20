# Como o time de agentes trabalha (20/11/2026)

O repositório `aloirr/bapajudacatalogo` tem um time de 8 agentes do Claude Code, definidos em `.claude/agents/`. Esta pasta, `.coord/`, é o **quadro** do time.

## O time

| Agente | Papel | É dono de |
|---|---|---|
| `po` | **Único que conversa com o Alexandre.** Transforma pedido em tarefa, entrega e colhe o "aprovado". | `.coord/quadro.md`, `.coord/tarefas/`, `docs/propostas/`, `docs/ROADMAP.md`, `README.md` |
| `gerente-projetos` | Divide a tarefa em passos, chama os agentes, cobra testes e revisão, abre o PR e devolve ao `po`. | `.coord/README.md` |
| `catalogo-dados` | Base unificada: versões, `LOG_CORRECOES`, taxonomia, aplicações, referências, fotos que faltam. | `dados/` |
| `catalogo-grafico` | PDFs: impresso A4, digital, Linha Moto, portfólio, Kit Filtros. Sempre simula antes. | `catalogo_grafico/` |
| `web-site` | Catálogo online estático e o gerador do JSON. Guarda a `FICHA` e a `TRAVA`. | `site/`, `scripts/gerar_site.py`, `ATUALIZAR_CATALOGO.bat`, `requirements.txt`, `docs/DADOS_DO_SITE.md` |
| `integracao-placas` | Consulta por placa (fase 3): serviço no Render, chave só em variável de ambiente, LGPD. | `servicos/placas/`, `docs/placas/` |
| `testes` | `gerar_site.py`, testes de busca, prints 1366 px e 390 px, 0 palavra interna. | `testes/`, `scripts/testar_site.*` |
| `revisor-codigo` | Revisão independente de cada PR. Só lê e aponta. | — |

O dono de cada caminho está em **`.coord/donos.json`** (vale o primeiro padrão que casar). Dono `alexandre`: `.claude/**`, `.coord/donos.json`, `render.yaml`, `.github/**`, `CLAUDE.md` e `.gitignore`.

## O caminho de um pedido

```
Alexandre ──pedido──▶ po ──T-nnnn──▶ gerente-projetos ──passos──▶ donos das pastas
                                          │                         │
                                          │◀──────── testes ◀───────┘
                                          │◀──── revisor-codigo
                                          ▼
                                     PR aberto (sem merge)
                                          │
Alexandre ◀──entrega + prints + PR── po ◀─┘
    │
    └── "aprovado" ──▶ o Alexandre faz o merge no main
```

1. **Pedido.** O Alexandre fala com o `po`. O `po` cria `.coord/tarefas/T-nnnn.md` (modelo abaixo) e a linha no `quadro.md`.
2. **Plano.** O `gerente-projetos` escreve os passos na tarefa e abre o branch.
3. **Trabalho.** Cada dono mexe só na sua pasta.
4. **Testes.** O `testes` roda a bateria e escreve o resultado na tarefa.
5. **Revisão.** O `revisor-codigo` lê o diff inteiro e escreve o resultado na tarefa.
6. **PR.** O `gerente-projetos` abre o PR para o `main`, **sem merge**, e devolve ao `po`.
7. **Entrega.** O `po` mostra ao Alexandre o que foi feito, os prints e o link do PR.
8. **Aprovação.** Só com **"aprovado"** do Alexandre a tarefa vai para o `main`. O merge é dele.

Como chamar: na sessão principal do Claude Code, fale como o `po` (ou rode `claude --agent po` [SUPOSIÇÃO: o recurso de agente principal existe na versão instalada]). Os outros agentes são chamados pelo nome, ex.: "use o agente testes na T-0001".

[SUPOSIÇÃO] Se um agente não puder chamar outro no ambiente, o `gerente-projetos` escreve os passos na tarefa e a sessão principal chama cada agente na ordem.

## Palavras do Alexandre

| Palavra | Efeito |
|---|---|
| **"simule"** | Mostrar antes: a primeira entrega é a simulação (prints, páginas em imagem, planilha de antes e depois). Vale sempre para base unificada, layout de página e PDF de catálogo, mesmo sem a palavra. |
| **"aprovado"** | Pode ir para o `main`. Anotar data e hora na tarefa. |
| **"autorizo"** | Libera, só naquela tarefa, algo que a regra trava (ex.: mexer na `TRAVA` ou na `FICHA`). |

## Situações do quadro

| Situação | Quer dizer |
|---|---|
| `NOVA` | O `po` escreveu; ninguém começou. |
| `PLANEJADA` | O gerente escreveu os passos. |
| `EM ANDAMENTO` | Um dono está trabalhando. |
| `EM TESTE` | Com o `testes`. |
| `EM REVISÃO` | Com o `revisor-codigo`. |
| `EM APROVAÇÃO` | PR aberto; o `po` levou ao Alexandre. |
| `APROVADA` | O Alexandre disse "aprovado"; falta o merge. |
| `FEITA` | No `main`. |
| `PARADA` | Bloqueada. Dizer por quê e o que falta. |
| `CANCELADA` | O Alexandre desistiu. |

## Modelo da tarefa (`.coord/tarefas/T-nnnn.md`)

```markdown
# T-nnnn · Título curto

| Campo | Valor |
|---|---|
| Situação | NOVA |
| Dono | <agente> |
| Ajudantes | <agentes> |
| Aberta em | dd/mm/aaaa hh:mm (Manaus) |
| Branch | — |
| PR | — |

## Pedido do Alexandre (literal)
> "texto exato, sem corrigir" — dd/mm/aaaa hh:mm

## Especificação
- o que entra
- **Não entra:** ...

## Critérios de aceite
- [ ] ...

## Passos (gerente-projetos)
1. ...

## Registro
- dd/mm hh:mm · agente · o que aconteceu
```

## Regras do time

- Tudo em **português do Brasil**: tarefas, commits, PRs, docs.
- Suposição sempre marcada com **[SUPOSIÇÃO]**.
- **Sem preço e sem estoque** no site e em material para cliente. A `FICHA` e a `TRAVA` do `gerar_site.py` não são afrouxadas sem "autorizo".
- **Nunca guardar, digitar ou imprimir senha, chave ou token.** Chave só em variável de ambiente (Render).
- A base unificada muda com nova versão em `dados/versoes/`, linha no `LOG_CORRECOES` e o digitado preservado.
- O BAP Ajuda 2.0 (`aloirr/bapajuda2.0`) **não é mexido daqui**. A BAP Central (`aloirr/bapcentral`) só lê a base: avisar o Alexandre quando o formato mudar.
- `docs/legado/` é congelado.
