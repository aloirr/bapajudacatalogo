# Pacote do Agente Catálogo BAP para o Claude Cowork

Exportado em 20/10/2026 da conversa **AGENTE - CATALOGO BAP** (claude.ai).

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| `claude/agente_catalogo_bap.md` | Documento atual do agente: papel, estado, decisões, pendências e registro. Substitui o do projeto. |
| `claude/recados/` | 4 recados enviados pelo `catalogo` que ainda não estavam no projeto. |
| `historico/HISTORICO_CATALOGO_BAP.md` | Resumo completo da conversa: linha do tempo, decisões, entregas, pendências e lições. |
| `historico/transcricao_parte1_ate_15-10.txt` | Transcrição bruta da primeira parte da conversa (até 15/10). |
| `entregas/` | Arquivos finais: catálogos impresso e digital, base v9 (e v8), apresentação comercial, encartelados e listas. |
| `gerador/` | Scripts que geram os catálogos, a base v9 e a apresentação, com imagens, fontes e entradas. |
| `originais/treinamentos/` | Os 3 treinamentos originais (.pptx de Baterias, Linha Moto e Lubrificantes, out/2026), modelo do padrão (T-0032). Não editar: os novos saem pelo gerador. |
| `treinamentos/` | `PADRAO_TREINAMENTO.md` (guia do padrão de treinamento, T-0032) e `referencia/` (tipos de slide dos originais). |

## Como instalar

1. Copie a pasta `catalogo_bap` para a pasta do projeto BAP no OneDrive. [SUPOSIÇÃO] Sugestão de local: `Treinamentos e materiais de trade\catalogo_bap\`.
2. Copie `claude/agente_catalogo_bap.md` para a pasta `claude\` do projeto, substituindo a versão antiga.
3. Copie os arquivos de `claude/recados/` para a pasta `claude\recados\` do projeto.
4. Na pasta `claude\recados\`, apague os 2 recados já tratados:
   - `20261019-1153_de-bap-tools_para-catalogo.md`
   - `20261019-1205_de-bap-tools_para-catalogo.md`
5. Copie a `entregas/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v9.xlsx`:
   - para `BAP Ajuda 2.0\BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx`, substituindo a atual, se for adotar a v9;
   - para a pasta de trade.

## Primeira mensagem sugerida na nova conversa do Cowork

> Você é o agente Catálogo BAP (código `catalogo`) do projeto BAP. Leia `claude/INDICE_AGENTES.md`, o seu documento `claude/agente_catalogo_bap.md` e `catalogo_bap/historico/HISTORICO_CATALOGO_BAP.md`. Liste os documentos do projeto e trate os recados em `claude/recados/` com `para-catalogo` ou `para-todos`. Os scripts que geram os catálogos estão em `catalogo_bap/gerador/` (veja o `LEIA-ME.md`). Responda em português.

## Como regerar os arquivos (pasta `gerador/`)

**Requisitos**

- Python 3.10+ com `reportlab`, `pandas`, `openpyxl`, `pillow` e `pymupdf`.
- Node.js com `pptxgenjs` (traz o `jszip`, que o `apply_theme.js` usa), só para o PowerPoint.

```
pip install reportlab pandas openpyxl pillow pymupdf
npm install pptxgenjs
```

**Entradas** (pasta `gerador/entradas/`)

Já incluídas:
- `ESTOQUE_BAP.xlsx` (13/10)
- `BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx`
- `BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` (v7)
- `CATALOGO_BAP_INTERRUPTORES.xlsx`
- `CATALOGO_BAP_CUICA_DE_FREIO.xlsx`
- `Cata_logo_PIVO_-_2026_.pdf`

Para atualizar o estoque, troque o `ESTOQUE_BAP.xlsx` pelo arquivo do dia, com as mesmas colunas.

**Comandos** (rodar dentro da pasta `gerador/`; os arquivos saem em `gerador/saidas/`)

| O que gerar | Comando |
|---|---|
| Catálogo impresso (gráfica) | `python -c "import print_cat as PC; PC.build('saidas/Catalogo_BAP_2027_A4_grafica.pdf')"` |
| Catálogo digital | `python -c "import moto, digital2 as D2; D2.build('saidas/Catalogo_BAP_2027_Completo_Digital.pdf')"` |
| Base v9 (a partir da v8) | `python base_v9.py` |
| Apresentação comercial (PDF) | `python apres_bemol.py` |
| Apresentação comercial (PowerPoint) | `node apres_ppt.js` |
| Encartelados moto | `python encartelados.py` |

Os dois scripts da apresentação leem o texto do `apres_conteudo.json` (RD-0431): mudou um texto, mude só lá e gere o PDF e o .pptx.

**Mapa dos scripts**

- **Classificação:**
  - `taxo.py`: classificação (PRODUTO → CATEGORIA, SISTEMA, FAMÍLIA, regras de LINHA, descrições das capas).
  - `datas.py`: padronização de datas e exceções (medidas que não são data).
- **Montagem dos dados:**
  - `montar.py`: junta estoque, base e dados do catálogo; inclui itens novos; gera a base classificada.
  - `pneus_fix.py`: aplicações de pneus e câmaras e a coluna "Ofereça junto" deles.
  - `cross.py`: encurta as aplicações e calcula a venda casada ("Ofereça junto").
  - `moto.py`: monta a seção Linha Moto e corrige o fluido de freio.
- **Geração dos arquivos:**
  - `digital2.py`: desenho e montagem do catálogo digital.
  - `print_cat.py`: desenho e montagem do catálogo impresso (CMYK, sangria de 3 mm).
- **Dados de apoio:**
  - `digital_data.json`: dados de todos os itens do catálogo (aplicações completas e equivalências), extraídos do catálogo digital de 13/10.
    - É entrada fixa: a aplicação dos itens que já estavam no catálogo vem daqui, não da base. Correção da base em item antigo é feita também aqui (T-0019).
  - `parse_digital.py`: refaz esse arquivo a partir de um PDF digital.
- **Correções em PDF pronto:** `fixpdf.py` e `aplicar_datas.py`. Só para ajuste pontual.

**Observações**

- **Tema de cores do PowerPoint:** o `apres_ppt.js` grava o tema "BAP" com o `apply_theme.js`. Sem ele, as cores dos slides sairiam as do tema "Office" (azul, laranja, amarelo); por isso o script para com erro se o `apply_theme.js` faltar.
- **Treinamentos (T-0032):** o `treinamento_ppt.js` usa o mesmo `apply_theme.js`, com o tema "BAP Treinamento" e Arial; o `treinamento.py` chama o Node e, com `--png`, o LibreOffice (`soffice`) para os PNGs.
- **Nomes de arquivo:** os scripts usam caminhos relativos à pasta `gerador/`. Não mude os nomes das subpastas.
