# Histórico do Agente Catálogo BAP (conversa no claude.ai, 27/09 a 20/10/2026)

Resumo do que foi feito, decidido e entregue na conversa **AGENTE - CATALOGO BAP**, para continuar o trabalho no Claude Cowork.

- A transcrição bruta da primeira parte, até 15/10, está em `historico/transcricao_parte1_ate_15-10.txt`.
- A parte de 15/10 a 20/10 não tem transcrição exportável. Ela está registrada neste documento.

---

## 1. Contexto

- **Quem pede:** Alexandre Guerreiro, Gerente Comercial BAP (Grupo PMZ, Manaus).
- **Projeto BAP com agentes que se falam por recados:**
  - Índice dos agentes: `claude/INDICE_AGENTES.md`.
  - Regras oficiais: `processo_bap_out2026.md`, `rotinas_time_comercial_out2026.md`, `INSTALACAO_ROTA_1710.md`.
- **Código deste agente:** `catalogo`.
  - Recados recebidos: `claude/recados/*_para-catalogo.md` e `*_para-todos.md`.
  - Recados enviados: arquivo novo `AAAAMMDD-HHMM_de-catalogo_para-<código>.md`.
  - Nunca editar o documento de outro agente.
- **O que o agente faz:**
  - O Catálogo de Produtos BAP 2026 (impresso para gráfica e digital completo).
  - A base unificada de produtos (dono da classificação CATEGORIA/SISTEMA/FAMÍLIA/LINHA).
  - Listas de produto para o marketing.
  - Materiais comerciais de produto, como a apresentação de lubrificantes e químicos.
- **Regras de uso:**
  - O catálogo é de uso interno: nunca vai para cliente nem terceiro.
  - É informativo, com foco em venda: lacuna de portfólio e pauta de Compras vão para o `analista`, não para o catálogo.

## 2. Linha do tempo

| Data | O que aconteceu |
|---|---|
| 27/09 | Primeiro catálogo impresso A4 (48 páginas, layout com fotos por família). Base v6 com 154 interruptores, 25 cuícas e correções de pivô. |
| 29/09 | Base v7: 381 produtos do catálogo que faltavam na base. Rodapé maior e cores em CMYK. |
| 30/09 | Novo layout aprovado no Claude Design: faixa de cabeçalho verde-clara, destaques com divisórias, tabela compacta. Canvas com as 48 páginas. |
| 01/10 | Ajustes de colunas, padronização de aplicações e datas, junção de linhas pequenas. Simulação do anexo de aplicações (156 páginas): decidido fazer um catálogo digital à parte. |
| 07/10 | Catálogo digital completo (sumário clicável, botão "Voltar ao sumário", marcadores, até 200 páginas). Lista de 101 itens sem aplicação para compras. |
| 13/10 | Especificação para a gráfica. Auditoria do impresso (6 erros corrigidos). Aviso legal "USO INTERNO E CONFIDENCIAL" em todas as páginas. Datas padronizadas (AAAA, "–", ">"). |
| 15/10 | Nova classificação CATEGORIA / SISTEMA / FAMÍLIA / LINHA e base v8. Sistema Arrefecimento separado. Catálogo digital reorganizado por sistema. Pneus e câmaras de moto com aplicação. |
| 16/10 | "Ofereça junto" (venda casada), fontes menores, aplicações encurtadas, seção Linha Moto. Impresso refeito no modelo novo (52 páginas, estoque 13/10) com fotos da pasta `bap\`. Encartelados de moto para o marketing. |
| 18/10 | Nova forma de trabalho por recados. Documento do agente reescrito. |
| 19/10 | Recados do `bap-tools` tratados: família ARREFECIMENTO DO MOTOR e base v9. Achado: 1.031 fotos da pasta `bap\` são a arte "IMAGEM INDISPONÍVEL"; foram excluídas do catálogo. Apresentação comercial de lubrificantes e químicos (PDF e PowerPoint, genérica, sem nome de cliente). |
| 20/10 | Verificação de recados (nenhum novo). Exportação para o Cowork (este pacote). |

## 3. Decisões em vigor

**Classificação (base v9)**

- Hierarquia: CATEGORIA > SISTEMA > FAMÍLIA, mais a coluna LINHA. A coluna PRODUTO é o tipo/linha do produto, igual à página do catálogo. O item é o CODIGO_BAP.
- **CATEGORIA:** PEÇAS, BATERIAS, LUBRIFICANTES, QUÍMICOS, PNEUS, ACESSÓRIOS.
- **SISTEMA:** Suspensão, Direção, Transmissão, Freio, Arrefecimento, Motor, Elétrica, Filtração, Lubrificantes, Químicos, Rodagem, Acessórios. Inativos sem regra ficam em OUTROS.
- **Arrefecimento:** família única ARREFECIMENTO DO MOTOR (eletroventiladores e bombas d'água; 141 produtos). Decisão de 19/10.
- **Aditivos e água desmineralizada:** ficam em QUÍMICOS (15/10).
- **Interruptores:**
  - Pressão do óleo → Motor (Lubrificação do motor).
  - Os demais → Elétrica (Interruptores e sensores).
- **Outros sistemas:**
  - Sensor ABS → Freio.
  - Servo e cilindro de embreagem → Transmissão.
  - Catraca de freio → Freio (Freio a ar).
- **Regras de LINHA:**
  - Pela aplicação: só veículo pesado = PESADA; leve e pesado = LEVE E PESADA.
  - Sempre PESADA: cuíca, catraca, servo e rodas.
  - Baterias: PESADA a partir de 100 Ah.
  - Lâmpadas: 24V = PESADA.
  - Pneus e câmaras: MOTO.
  - UNIVERSAL: químicos e cintas. Óleo é UNIVERSAL, exceto o 4T, que é MOTO.
  - "Titan 17.310" é caminhão VW, não Honda Titan.
- **Coerência:** um produto ou página não pode citar dois sistemas.

**Catálogo**

- Organizado por SISTEMA, mais a seção Linha Moto (pneus, câmaras, óleos 4T, velas e rolamentos com aplicação moto).
- **Destaques (5 por página):** maior estoque com aplicação, dando preferência a item com foto real.
- **Lista da página:** em ordem de estoque. Itens sem aplicação vão para o fim.
- **"Ofereça junto":**
  - Coluna por item:
    - kit de distribuição → bomba d'água
    - bomba de óleo → interruptor de pressão do óleo
    - sapata → cilindro de roda
    - vela → cabo de vela
    - pneu ↔ câmara
  - O par só entra se bater montadora, modelo, motor e anos.
  - Faixa de texto por linha nas demais páginas.
- **Datas:**
  - Ano com 4 dígitos; "–" entre início e fim; ">" para "em diante".
  - Medidas não são data (60/55W, 13/16", 90/90-19).
  - Abreviações: exc., s/ ABS, c/ barra estab., Diant., Tras.
- **Aviso legal em todas as páginas do catálogo:** "USO INTERNO E CONFIDENCIAL — material exclusivo do time BAP. Proibida a distribuição a clientes e terceiros."
- **Impressão:** 15 exemplares.
  - A4, 4x4.
  - Capa couché 300 g com laminação BOPP fosca.
  - Miolo couché fosco 150 g.
  - Wire-o.
  - Impressão digital.
  - Preto 100% K.
  - Sangria de 3 mm.
  - Prova física antes da tiragem.

**Materiais para cliente (apresentação comercial)**

- Sem estoque, sem preço, sem aviso de uso interno e sem nome de cliente.
- Contato: Alexandre Guerreiro · Gerente Comercial · alexandre.guerreiro@bapautoparts.com.br · (92) 99250-8980.

## 4. Estado das entregas (pasta `entregas/`)

| Arquivo | Situação |
|---|---|
| `Catalogo_BAP_2026_A4_grafica.pdf` | 52 páginas, estoque 13/10, 128 de 223 destaques com foto real, ARREFECIMENTO DO MOTOR. Pronto para prova na gráfica. |
| `Catalogo_BAP_2026_Completo_Digital.pdf` | 197 páginas, 2.787 itens, todas as aplicações, Linha Moto, sumário clicável. |
| `BASE_BAP_UNIFICADA_PRODUTOS_BAP_v9.xlsx` | Base atual (19/10). Mesmas abas e colunas da v8. As 5 primeiras colunas são compatíveis com o BAP Ajuda. |
| `BASE_BAP_UNIFICADA_PRODUTOS_BAP_v8.xlsx` | Histórico (versão enviada pelo Alexandre em 15/10, base da v9). |
| `BAP_Lubrificantes_e_Quimicos_Apresentacao_Comercial.pdf` / `.pptx` | 11 slides, genérica para qualquer cliente. |
| `Encartelados_Moto_BAP.xlsx` | 4 encartelados de 6 itens (pneus sem/com câmara, câmaras, lubrificantes/químicos/filtros moto). |
| `Fotos_pendentes_destaques_catalogo.xlsx` | 95 destaques sem foto real, para pedir ao marketing. |
| `Itens_sem_aplicacao_BAP.xlsx` | 101 itens sem aplicação, só 4 com equivalente. |

## 5. Pendências

- [ ] Foto da linha Cuíca de Freio (capa e cards) tem gravação "BENDIX BRASIL". Trocar antes de imprimir.
- [ ] 95 destaques sem foto real. Pedir ao marketing.
- [ ] Classificar o CXD13200 (não está na v8/v9 nem no ESTOQUE_BAP de 13/10).
- [ ] Confirmar no cadastro as datas ajustadas no catálogo:
  - AMT7001 Palio 1.8R: virou 11/2005.
  - SpaceFox na Junta Homocinética: virou 01/2007–07/2012.
  - Intervalos invertidos colocados em ordem: 06/2008–2011, 02/2009–2011, 08/2008–2011, 01/2007–2008.
- [ ] Câmaras CAR21 e CAJ18 marcadas "CONFIRMAR MEDIDA".
- [ ] Validar uma amostra de cerca de 30 pares do "Ofereça junto" com especialista de produto.
- [ ] Gráfica: orçamento e prova física.
- [ ] Adaptar para o vendedor os textos do impresso escritos para cliente. Aguardando aprovação.
- [ ] Retorno do marketing sobre os encartelados de moto.
- [ ] Especificações divergentes no cadastro:
  - 10W40 ProActive 200: API SM no estoque, SN na base.
  - Shiftease 120 85W140: mineral no estoque, sintético na base.
- [ ] Aguardando recado de volta:
  - `bap-tools`: ajuste do `familia_nucleo` para a água desmineralizada; ESTOQUE_BAP com ARREFECIMENTO DO MOTOR.
  - `bap-ajuda`: v9 em uso.

## 6. Recados

**Recebidos e tratados** (apagar do projeto):

- `20261019-1153_de-bap-tools_para-catalogo.md`
- `20261019-1205_de-bap-tools_para-catalogo.md`

**Enviados** (em `claude/recados/`; ainda não estavam no projeto em 20/10):

- `20261019-1830_de-catalogo_para-bap-tools.md`: v9 pronta e regra da água desmineralizada.
- `20261019-1831_de-catalogo_para-bap-ajuda.md`: usar a v9, com as correções.
- `20261019-1832_de-catalogo_para-analista.md`: lacunas de portfólio da linha moto.
- `20261019-1833_de-catalogo_para-treinamentos.md`: catálogo novo e argumento "Ofereça junto".

## 7. Lições aprendidas

- **Regras de padronização de data** podem corromper medidas. Já aconteceu com 60/55W, 13/16", 90/90-19 e "Titan 17.310". Revisar a lista de exceções ao mudar regras.
- **Pasta de fotos `bap\`:** 1.031 arquivos são a arte "IMAGEM INDISPONÍVEL" (todos com o mesmo conteúdo). O gerador já os descarta pelo hash do FLU15002.jpg.
- **Arquivos de outros agentes:** antes de alterar algo, conferir o documento do agente dono. Exemplo: a base é do `catalogo`; o `familia_nucleo` dos programas é do `bap-tools`.
