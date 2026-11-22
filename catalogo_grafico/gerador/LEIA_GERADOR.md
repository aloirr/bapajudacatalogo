# Gerador do Catálogo BAP — scripts em sintonia (PC EMPRESA e PC PESSOAL)

## Na nuvem, sem o PC do Alexandre (T-0019, 20/11/2026)
- O A4 e o digital rodam só com o que está no Git: base `dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx` (e a v10 de `dados/versoes/` para a FAMÍLIA dos filtros e o DETALHE), fotos dos destaques em `site/img/*.jpg` (pelo código com `taxo.norm`).
- Sem `ESTOQUE_BAP.xlsx` e sem `entradas/bap/`. Destaques: lista fixa em `destaques_fixos.json` (os 5 de 13/11, A4 e digital, só códigos; R-20261120-153200). Item que saiu da base ou ficou INATIVO, e família sem lista: completa pela regra 1) com foto própria; 2) com aplicação ou especificação; 3) pelo código. O gerador lista no log (`[destaques] ...`). A lista: com aplicação primeiro, depois pelo código.
- Sem "Diferencial BAP" e sem "Itens parecidos" nos PDFs (A4, digital e Linha Moto; R-20261120-160300, T-0019). Os campos DIFERENCIAL e ITEM_PARECIDO continuam na base.
- Referências cruzadas: uma regra só com o site (RD-0193). As da base (`montar.refs_from_base` e `pneus_fix.refs_moto`) passam pelo `refs_de` do `scripts/gerar_site.py`, carregado pelo `site_regras.py` (`site_regras.G`, sem cópia; usado pelo `montar.py` e pelo `digital2.py`): separa por ";" e por ",", tira o histórico ("| ANTERIOR: ..."), o preço de compra, o código vazio ("-", "0", "--", "N/A", "#N/A"), a marca própria e o fornecedor, e o rótulo fica só com a marca ("Nakata", sem " Pn" e sem "CROSS REFERENCES - "). Por cima, só no PDF (`montar.ref_lista`): trecho sem marca só fica se for código, e o rótulo com "bap", "similar", "aplica" ou "descri" fica fora; até 10 por item. As que vêm escritas (catálogo antigo, site de 12/11, Fraga de 13/11: "Marca Código") passam pelo `refs_de` com a marca (`montar.refs_pela_regra`). No fim do `fraga_complementos.aplicar`, em todos os itens dos 3 PDFs: `refs_pela_regra` e cada referência uma vez, na ordem da 1ª (`montar.refs_unicas`, RD-0194).
- Fornecedor e concorrência nos PDFs (regras do site, `site_regras.G`): o fornecedor (`FORNECEDORES`: SUNRISE, R-20261120-194900-po) não sai em nenhum texto; a referência sai pelo `refs_de` (também com o nome dentro do rótulo: "Pruduct Pn Sunrise"). A concorrência (`CONCORRENTES_SO_NA_REF`: AUTOIMPACT; T-0017, "autorizo" do R-20261121-113400-alexandre) só sai na referência cruzada e por último ("1 a"; `montar.refs_unicas`). Trava: `digital2.trava_pdf` (como funciona: comentário acima dela), no fim do `print_cat.build` e do `digital2.build` (que também faz a Linha Moto). Se um nome passar onde não pode, o build para com `[PARADO]` e o arquivo fica com o fim `.BLOQUEADO` (não entregar). Na base o dado fica.
- "Em diante" = "AAAA+" nos PDFs (R-20261120-194600-alexandre, item 4, R-20261120-195900 e R-20261120-201100-alexandre): `datas.em_diante`, no desenho (aplicação, DETALHE e subtítulo), sempre depois do `fix_text` (`datas.para_pdf`): "2015 em Diante", "2015>", "03/2015>", "2008->" e "2025 →" sem ano depois viram "2015+" (R-20261120-201100-alexandre), colado ao ano; letra ou "(" logo depois ganha um espaço ("2001>GM" = "2001+ GM", designer-ux); "1999->2008" e "1999 → 2008" são faixa ("1999–2008"); ">1994" ("até") fica. O "2011/..." (ano com reticências) vira "2011>" antes, no `montar._em_diante`, antes do `cross.py`, porque o "Leve também" depende dele (RD-0235). A base não muda.
- Aplicação: cada veículo uma vez (RD-0222; R-20261120-195900-alexandre). No fim do `fraga_complementos.aplicar`, em todos os itens dos 3 PDFs, `aplicacao_unica` tira o veículo que já apareceu na mesma aplicação (mesma montadora e mesmo texto, com as datas comparadas como no PDF), na ordem do 1º; o complemento do Fraga só fica com o que a base ainda não tem.
- `entradas/complementos_fraga_13112026.json`: no MF21 a referência Bosch veio do Fraga sem o 3 do começo ("397016728"); ficou "3397016728", como na base (T-0019). Conferidas as 57 referências Bosch do arquivo contra a base: só essa tinha perdido o 3.
- `digital_data.json` é entrada fixa dos itens antigos (a aplicação deles vem de lá, não da base): correção da base em item antigo entra lá também, só no texto antigo, com palavra inteira e caixa exata (a v26 nos 13 itens: PR #99). POL1625, PAF0362 e VEL7544 não têm lá o texto antigo e ficam.
- Subtítulo (B9, `detalhe._tail`): a grafia antiga da montadora que a v26 trocou só na APLICACAO conta como a mesma palavra (`detalhe.MONT_ANTIGA`: MBB = MB, VWC = VW); a DESCRICAO do SCE14002 ainda diz "MBB ... VWC".
- "Leve também" por sistema: a regra e a tabela são as do site (`G.sistemas_de` e `G.SIS_COMPAT`; `docs/DADOS_DO_SITE.md`, campos `sc` e `ss`); o `oferta.sis_ok` só aplica, nos 3 PDFs.
- Digital e Linha Moto: a última página de continuação de uma família com 1 ou 2 linhas recebe as últimas 3 (ou 2) da página anterior (`digital2.paginate`).
- Tag NOVO e "Leve também" seguem o `STATUS_CADASTRO` da base (ATIVO = NOVO quando o item não estava no catálogo; os demais ficam fora do par do "Leve também").
- B8 (`digital2.sem_viuva` e `digital2.refs_juntas`): a última palavra não fica sozinha na última linha; a marca e o código da referência ficam juntos, com espaço inseparável (`_FC.DUAS` para marca de duas palavras). Também no `print_cat.cta_box`.
- B8 sem corte no meio (`quebra.py`, importado pelo `digital2`): quando o bloco preso (marca + código, ou a palavra do `sem_viuva`) ou uma palavra sem espaço ("Fiesta,KA,Courier,Ecosport,Focus") não cabe na coluna, a quebra vai para o espaço inseparável (a marca numa linha e o código inteiro na de baixo), senão logo depois de "," "/" ";" ")" "·", senão a palavra desce inteira; na letra, só sem nenhum deles. O texto não muda. No A4, a coluna EQUIVALE A ganha `print_cat.REF_MAIS` (12 = ~3 mm) da APLICAÇÃO. Conferência: `python varredura_quebras.py a4|digital|moto saida.pdf` lista cada quebra de palavra com a página ("meio" = partiu entre letras).
- B10 (`digital2.novo_desce` e `digital2.novo_na_sobra`): a tag NOVO desce para a linha de baixo quando o código é longo.
- As seções abaixo sobre o OneDrive e o estoque valem só para os scripts que ainda leem o estoque (`encartelados.py`, `kitfiltros/parse.py`). O `apres_bemol.py` ainda lê as fotos de `entradas/bap/`.
- `auditoria_catalogo.py`: não lê mais o estoque (a descrição vem do `detalhe._desc()`, da base unificada). A comparação "base × ESTOQUE_BAP" dele (aba `CONFLITO_BASE_X_ESTOQUE`) ficou sem sentido até ser refeita.

Versão de 12/11/2026 (atualizada pelo PC EMPRESA; antes 27/10 pelo PC PESSOAL). **Os scripts deste pacote do projeto são a versão oficial.** Se o script do OneDrive (`Treinamentos e materiais de trade\catalogo_bap\gerador\`) ou o da nuvem da conversa for diferente, vale o do projeto.

## Montar o ambiente na nuvem do Cowork (cada sessão)
1. Puxar do OneDrive (as duas máquinas veem a mesma pasta) a pasta `catalogo_bap\gerador\` com o que **não** está no projeto:
   - `entradas\` (ESTOQUE_BAP.xlsx, bases v8/v10, CATALOGO_BAP_INTERRUPTORES.xlsx, CATALOGO_BAP_CUICA_DE_FREIO.xlsx, catálogo de pivô), `dimg\`, `pptimg\`, `fontes\`, `digital_data.json`.
   - Base mais nova: `catalogo_bap\entregas\BASE_BAP_UNIFICADA_PRODUTOS_BAP_vNN.xlsx` (a de número mais alto) → copiar para `gerador\saidas\` (os scripts leem a v10/v11 de lá; o `montar.py` lê a base de `dados/`, ver acima).
   - Fotos do `apres_bemol.py` (o A4 e o digital usam `site/img`): puxar da pasta `Regionais - Leandro\bap\` só os códigos dos destaques (lista tirada do A4 entregue: card sem "imagem ilustrativa") e o `FLU15002.jpg`, em lotes de 50, para `gerador\entradas\bap\`. O `bap.7z` (346 MB) é pesado para a ponte.
2. Copiar por cima **todos os scripts deste pacote** (`claude/pacotes/catalogo_gerador/`), inclusive `kitfiltros/` e `entradas/aplicacoes_site_bap.json`.
   - Agora é preciso também o `../../scripts/gerar_site.py` (do repositório, fora do pacote do gerador): o `site_regras.py` carrega dele a regra das referências, a lista dos fornecedores e a do "Leve também" por sistema. Sem ele o A4, o digital e a Linha Moto não rodam.
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
| Teste do `_norm`/`aplicacao_unica` (Fraga) | `python -m unittest -v teste_fraga_complementos` |
| Teste da AUTOIMPACT (trava só fora da referência e ordem) | `python -m unittest -v teste_autoimpact_pdf` |
| Teste do bloco B (B9 subtítulo, B10 tag NOVO, "Leve também" pelo sistema) | `python -m unittest -v teste_bloco_b_pdf` |
| Varredura das quebras de palavra (B8) | `python varredura_quebras.py a4 saidas/A4.pdf` (ou `digital`, `moto`) |

## Mapa
`taxo.py` classificação · `datas.py` datas · `montar.py` junta a base unificada e o catálogo (item novo pelo STATUS_CADASTRO) · `pneus_fix.py` · `cross.py` "Leve também" (antes "Ofereça junto"; 4 linhas antigas) · `moto.py` famílias e Linha Moto por sistema/família; chama `site_aplicacoes.py` · `site_aplicacoes.py` aplicações e Tecfil do catálogo online (`entradas/aplicacoes_site_bap.json`, 49 filtros, 12/11) · `fraga_complementos.py` complementos do Fraga aprovados em 13/11 (veículos e referências a mais, `entradas/complementos_fraga_13112026.json`; chamado no `moto.py` depois do OFEREÇA JUNTO; no A4 a aplicação fica a de antes) · `filtros_split.py` FILTRAÇÃO por tipo no digital (ar do motor, ar da cabine, combustível, óleo, outros) · `detalhe.py` DETALHE + descrição essencial · `diferencial.py` itens parecidos (c/ × s/ ABS...) da auditoria · `tags.py` tags embaixo do código, tiradas do DETALHE · `oferta.py` "Leve também" (antes "Ofereça junto") em todos (só código real, do mesmo sistema ou de um compatível) · `digital2.py` digital (formato A4, página por sistema, imagens comprimidas, `ANO`, `DOC_TITULO`; rodapé com `SITE_IG` e `OBS_DISP`) · `print_cat.py` A4 (usa o mesmo rodapé) · `catalogo_moto.py` · `base_v11.py` · `base_v13.py` · `base_v14.py` · `auditoria_catalogo.py` · `portfolio.py` · `kitfiltros/`.

## Catálogo online da BAP
`https://catalogobap.catalogofraga.com.br` → aba CÓDIGO DA PEÇA → Buscar → Ver detalhes: Aplicação Detalhada (montadora, veículo, versão, motor, anos) e Produtos Similares (Tecfil). A nuvem do Cowork não acessa (proxy); usar o navegador do app. Novo código achado lá: acrescentar em `entradas/aplicacoes_site_bap.json` no mesmo formato (`{código: [ref, "MONTADORA§Modelo motor · anos · ...¦MONTADORA§..."]}`).

## Rodapé (27/10)
Páginas internas dos três catálogos: esquerda "www.bapautoparts.com.br · @bapautoparts", centro o nº da página, direita "Consulte a disponibilidade na sua região." (`digital2.OBS_DISP`, R-20261120-212000-alexandre); embaixo o aviso de uso interno. Capa e contracapa sem a observação.

## Regra de sintonia
Mudou um script: gravar a versão nova **aqui** (mesmo nome) e no OneDrive `catalogo_bap\gerador\`, e anotar no Registro do `agente_catalogo_bap.md` com o nome da conversa.
