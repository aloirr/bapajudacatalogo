# Gerador do Catálogo BAP — scripts em sintonia (PC EMPRESA e PC PESSOAL)

## Na nuvem, sem o PC do Alexandre (T-0019, 20/11/2026)
- O A4 e o digital rodam só com o que está no Git: base `dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` (e a v10 de `dados/versoes/` para a FAMÍLIA dos filtros e o DETALHE), fotos dos destaques em `site/img/*.jpg` (pelo código com `taxo.norm`).
- Sem `ESTOQUE_BAP.xlsx` e sem `entradas/bap/`. Destaques: lista fixa em `destaques_fixos.json` (os 5 de 13/11, A4 e digital, só códigos; R-20261120-153200). Item que saiu da base ou ficou INATIVO, e família sem lista: completa pela regra 1) com foto própria; 2) com aplicação ou especificação; 3) pelo código. O gerador lista no log (`[destaques] ...`). A lista: com aplicação primeiro, depois pelo código.
- Sem "Diferencial BAP" e sem "Itens parecidos" nos PDFs (A4, digital e Linha Moto; R-20261120-160300, T-0019). Os campos DIFERENCIAL e ITEM_PARECIDO continuam na base.
- Referências cruzadas sem o histórico ("| ANTERIOR: ...") e sem o preço de compra ("BAP BOX USD ..."), pelo critério do `scripts/gerar_site.py` (`montar.ref_cod`).
- Tag NOVO e "Leve também" seguem o `STATUS_CADASTRO` da base (ATIVO = NOVO quando o item não estava no catálogo; os demais ficam fora do par do "Leve também").
- As seções abaixo sobre o OneDrive e o estoque valem só para os scripts que ainda leem o estoque (`encartelados.py`, `kitfiltros/parse.py`). O `apres_bemol.py` ainda lê as fotos de `entradas/bap/`.
- `auditoria_catalogo.py`: não lê mais o estoque (a descrição vem do `detalhe._desc()`, da base unificada). A comparação "base × ESTOQUE_BAP" dele (aba `CONFLITO_BASE_X_ESTOQUE`) ficou sem sentido até ser refeita.

Versão de 12/11/2026 (atualizada pelo PC EMPRESA; antes 27/10 pelo PC PESSOAL). **Os scripts deste pacote do projeto são a versão oficial.** Se o script do OneDrive (`Treinamentos e materiais de trade\catalogo_bap\gerador\`) ou o da nuvem da conversa for diferente, vale o do projeto.

## Montar o ambiente na nuvem do Cowork (cada sessão)
1. Puxar do OneDrive (as duas máquinas veem a mesma pasta) a pasta `catalogo_bap\gerador\` com o que **não** está no projeto:
   - `entradas\` (ESTOQUE_BAP.xlsx, bases v8/v10, CATALOGO_BAP_INTERRUPTORES.xlsx, CATALOGO_BAP_CUICA_DE_FREIO.xlsx, catálogo de pivô), `dimg\`, `pptimg\`, `fontes\`, `digital_data.json`.
   - Base mais nova: `catalogo_bap\entregas\BASE_BAP_UNIFICADA_PRODUTOS_BAP_vNN.xlsx` (a de número mais alto) → copiar para `gerador\saidas\` (os scripts leem a v10/v11 de lá; o `montar.py` lê a base de `dados/`, ver acima).
   - Fotos do `apres_bemol.py` (o A4 e o digital usam `site/img`): puxar da pasta `Regionais - Leandro\bap\` só os códigos dos destaques (lista tirada do A4 entregue: card sem "imagem ilustrativa") e o `FLU15002.jpg`, em lotes de 50, para `gerador\entradas\bap\`. O `bap.7z` (346 MB) é pesado para a ponte.
2. Copiar por cima **todos os scripts deste pacote** (`claude/pacotes/catalogo_gerador/`), inclusive `kitfiltros/` e `entradas/aplicacoes_site_bap.json`.
3. `pip install pymupdf --break-system-packages`.
4. Rodar dentro de `gerador/`. Saídas em `gerador/saidas/`. A auditoria e a `base_v11.py` rodam com **`PYTHONHASHSEED=0`** (sem isso o diferencial muda de uma execução para outra).

## Comandos
| O que | Comando |
|---|---|
| Catálogo A4 (gráfica) | `python -c "import print_cat as PC; PC.build('saidas/Catalogo_BAP_2027_A4_grafica.pdf')"` |
| Catálogo digital | `python -c "import moto, digital2 as D2; D2.build('saidas/Catalogo_BAP_2027_Completo_Digital.pdf')"` |
| Catálogo só Linha Moto | `python catalogo_moto.py` |
| Base v11 (da v10) | `python base_v11.py` |
| Base v13 (da v11: regra da v12 + aplicações do site) | `python base_v13.py` |
| Base v14 (da v13: complementos do Fraga de 13/11) | `python base_v14.py` |
| Auditoria do catálogo | `python auditoria_catalogo.py` |
| Portfólio (cliente) | `python portfolio.py` |
| Kit Filtros (cliente) | `python kitfiltros/kit.py saidas/Kit_Filtros_BAP.pdf` (ajustar caminhos `G`/entradas no topo do `kit.py`/`parse.py` para a sua nuvem) |
| Apresentação lubrificantes | `python apres_bemol.py` / `node apres_ppt.js` |
| Encartelados moto | `python encartelados.py` |

## Mapa
`taxo.py` classificação · `datas.py` datas · `montar.py` junta a base unificada e o catálogo (item novo pelo STATUS_CADASTRO) · `pneus_fix.py` · `cross.py` "Leve também" (antes "Ofereça junto"; 4 linhas antigas) · `moto.py` famílias e Linha Moto por sistema/família; chama `site_aplicacoes.py` · `site_aplicacoes.py` aplicações e Tecfil do catálogo online (`entradas/aplicacoes_site_bap.json`, 49 filtros, 12/11) · `fraga_complementos.py` complementos do Fraga aprovados em 13/11 (veículos e referências a mais, `entradas/complementos_fraga_13112026.json`; chamado no `moto.py` depois do OFEREÇA JUNTO; no A4 a aplicação fica a de antes) · `filtros_split.py` FILTRAÇÃO por tipo no digital (ar do motor, ar da cabine, combustível, óleo, outros) · `detalhe.py` DETALHE + descrição essencial · `diferencial.py` itens parecidos (c/ × s/ ABS...) da auditoria · `tags.py` tags embaixo do código, tiradas do DETALHE · `oferta.py` "Leve também" (antes "Ofereça junto") em todos (só código real) · `digital2.py` digital (formato A4, página por sistema, imagens comprimidas, `ANO`, `DOC_TITULO`; rodapé com `SITE_IG` e `OBS_DISP`) · `print_cat.py` A4 (usa o mesmo rodapé) · `catalogo_moto.py` · `base_v11.py` · `base_v13.py` · `base_v14.py` · `auditoria_catalogo.py` · `portfolio.py` · `kitfiltros/`.

## Catálogo online da BAP
`https://catalogobap.catalogofraga.com.br` → aba CÓDIGO DA PEÇA → Buscar → Ver detalhes: Aplicação Detalhada (montadora, veículo, versão, motor, anos) e Produtos Similares (Tecfil). A nuvem do Cowork não acessa (proxy); usar o navegador do app. Novo código achado lá: acrescentar em `entradas/aplicacoes_site_bap.json` no mesmo formato (`{código: [ref, "MONTADORA§Modelo motor · anos · ...¦MONTADORA§..."]}`).

## Rodapé (27/10)
Páginas internas dos três catálogos: esquerda "www.bapautoparts.com.br · @bapautoparts", centro o nº da página, direita "Verifique a disponibilidade e estoque de sua região." (`digital2.OBS_DISP`); embaixo o aviso de uso interno. Capa e contracapa sem a observação.

## Regra de sintonia
Mudou um script: gravar a versão nova **aqui** (mesmo nome) e no OneDrive `catalogo_bap\gerador\`, e anotar no Registro do `agente_catalogo_bap.md` com o nome da conversa.
