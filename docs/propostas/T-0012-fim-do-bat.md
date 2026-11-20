# T-0012 · Fim do ATUALIZAR_CATALOGO.bat: o repositório é a base oficial (opção A)

Proposta do gerente-projetos, de 20/11/2026 10:40 (Manaus). Não tem código. A decisão é do Alexandre, no recado R-20261120-103111-alexandre, opção 2a: "O .bat acaba pela OPÇÃO A: o repositório é a base oficial e os agentes cuidam de tudo."

## Por que acabar com o .bat
- O .bat copia a base do OneDrive **por cima** da base do repositório e envia direto ao GitHub, sem PR, sem testes e sem "aprovado".
- Com o Render publicando a cada merge, isso põe o site no ar sem conferência.
- Hoje ele desfaria a v15 e a v16, que só existem no repositório. O preço do TER556556 e o "FORNECEDOR" voltariam.

## Como fica o dia a dia do Alexandre

| Ele quer... | O que ele faz | O que acontece sozinho |
|---|---|---|
| Corrigir ou acrescentar produto, aplicação ou referência | Pede no chat do PO, como fez hoje com a v15 e a v16. | O `catalogo-dados` simula e mostra antes. Com o "aprovado", grava a nova versão (vN), registra no LOG_CORRECOES e conserva o que foi digitado. Depois vêm o PR, o `testes`, a revisão e o merge, e o Render publica. |
| Pôr fotos novas | No celular ou no computador, abre o GitHub, entra na pasta `fotos-novas/` do `aloirr/bapajudacatalogo` e usa **Add file → Upload files**, com os arquivos de nome `CODIGO.jpg`. Ao salvar, escolhe **"Create a new branch… and start a pull request"**. Não precisa instalar nada. | Na ronda, o gerente vê o PR das fotos. O `web-site` reduz as fotos (700 px), põe em `site/img/`, tira a pasta `fotos-novas/` e gera o JSON de novo. O `testes` confere e tira os prints. O PO pede o "aprovado"; depois vêm o merge e o Render. |
| Mandar fotos pelo celular sem abrir o GitHub | Anexa as fotos no chat do PO, ou numa issue com o formulário **Recado**. | [SUPOSIÇÃO: os anexos de issue de repositório privado podem não ser baixáveis da nuvem. Por isso o caminho principal é o "Upload files" acima.] O PO grava o recado e o gerente segue como na linha anterior. |
| Saber o que mudou | Lê o relatório do PO. | Cada versão da base fica em `dados/versoes/`, e cada mudança em `LOG_CORRECOES`. |

**Ele nunca mais roda nada no computador.** O OneDrive deixa de ser a fonte da base do catálogo.

## O que roda sozinho e o custo de Actions
- **Nenhuma rotina diária.** Só o CI que já existe, nos PRs: `ci` e `testes do site`, com cerca de 1 a 1,5 min por PR.
- **Fotos:** um PR por lote de fotos. O `web-site` reduz as fotos na sessão, e não num workflow, para economizar Actions.
- [SUPOSIÇÃO] Um workflow que reduzisse as fotos sozinho no próprio PR é possível, sem segredo, usando só o `GITHUB_TOKEN`. Mas seria governança (`.github`) e gastaria Actions a cada lote. Não é recomendado agora.

## Limites que não mudam
- Nenhum segredo no Git, no chat ou em recado. Esta opção **não precisa de segredo nenhum**.
- Sem preço e sem estoque no site: a FICHA e a TRAVA continuam no `gerar_site.py`.
- O tamanho cabe no GitHub com folga. As fotos reduzidas têm em média 37 KB: com foto nos 4.419 produtos, são cerca de 160 MB de fotos, contra a recomendação de menos de 1 GB por repositório.

## Perguntas para o Alexandre (BAP Central e BAP Ajuda 2.0)
Este time não mexe nesses dois projetos. Eles leem a base do OneDrive (`BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`), que **parou na v14**.
1. A BAP Central pode passar a ler a base direto do GitHub (`dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` no `main`)? Ou ela continua no OneDrive, com o Alexandre copiando cada versão nova para lá?
2. O BAP Ajuda 2.0 vai ser reformulado como aplicativo. A base dele também passa a ser a do GitHub?
3. Até essa resposta, alguém edita a base no OneDrive? Se sim, essas edições precisam chegar aqui como pedido ao PO. Senão, uma versão apaga a outra.
4. O formato da base não mudou na v15 nem na v16. O conteúdo de 3 células (v15) e de 103 referências (v16) das 5 primeiras colunas, que a BAP Central lê, mudou. Ela precisa de aviso?

## PR de governança (o PO abre, a pedido do Alexandre, como no #4, no #7 e no #10)
Arquivos do Alexandre:
1. **Apagar `ATUALIZAR_CATALOGO.bat`.**
2. **`.coord/donos.json`:** tirar a regra `{"padrao": "ATUALIZAR_CATALOGO.bat", "dono": "alexandre"}`. Acrescentar `{"padrao": "fotos-novas/**", "dono": "alexandre"}`, para o upload dele passar no `verificar` do CI. [SUPOSIÇÃO: o PR das fotos vem com o trailer ou o branch dele. Se não vier, o `web-site` refaz o PR com as fotos reduzidas.]
3. **`.claude/agents/web-site.md`, linhas 3 e 9:** tirar "ATUALIZAR_CATALOGO.bat" dos caminhos do web-site.
4. **`.claude/agents/gerente-projetos.md`, linha 24:** tirar "e `ATUALIZAR_CATALOGO.bat`".
- O merge só sai com a frase "autorizo o merge do PR #N no commit <sha>".

## O que muda nos arquivos do gerente (PR do gerente, sem governança)
- **`README.md`:** sai o parágrafo "Atualizar o catálogo online: dê dois cliques em ATUALIZAR_CATALOGO.bat…". Entra "Atualizar o catálogo online", que diz: correções pelo chat do PO; fotos pelo "Upload files" em `fotos-novas/`; o site publica sozinho a cada merge aprovado.
- **`.coord/README.md`:** a linha do `web-site` deixa de citar o .bat.
- **`docs/ROADMAP.md`, linha 23:** sai o "Hoje: ATUALIZAR_CATALOGO.bat no PC" e entra o caminho novo.
- Essas mudanças só entram junto com o PR de governança, nunca antes, para o README não ensinar um caminho que ainda não existe.

## Previsão (Manaus)
- Proposta: entregue às 10:40.
- PR do gerente (README, ROADMAP, quadro): pronto às 11:00. O merge espera o "aprovado".
- PR de governança: o PO abre quando quiser; o conteúdo está acima.
- A primeira atualização de fotos pelo caminho novo: assim que o Alexandre subir o primeiro lote.
