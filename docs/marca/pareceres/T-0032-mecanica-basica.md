# T-0032 · Parecer de marca do treinamento completo de Mecânica Básica (simulação)

| Campo | Valor |
|---|---|
| Tarefa | T-0032: o modelo completo pedido pelo Alexandre ("CRIE UM MODELO ASSIM. QUERO VER UM MODELO COMPLETO. PODE SER O DE MECANICA BASICA", R-20261123-153249-po), feito sobre o molde do `Treinamento_Baterias_BAP_Vendedores.pptx` original |
| Revisor | design-de-marca |
| Data | 23/11/2026 (Manaus) |
| O que foi visto | O branch `catalogo-grafico/T-0032-padrao-treinamento`, head `8f5fd2a6fc6a8d465c0171e882a9373c33f797f1`. Na pasta `sim-T-0032-mecanica`: o .pptx (o tema, as fontes e as cores do XML dos 45 slides e as 31 imagens inseridas), o texto do PDF, o `mosaico_8_slides.png`, os slides 18 e 30 e o `LEIA-ME.md` |
| Base de comparação | `docs/marca/pareceres/T-0032-padrao-treinamento.md` (MC-0018 a MC-0020); a decisão 7 a (Arial); o verde do logo (`#59BA61`); a regra de marca de terceiros |
| Parecer | **LIBERADO COM AJUSTES** (MC-0022, baixo). Nada segura a ida ao Alexandre |

Layout, leitura e comparação com o original: ver o parecer de UX.

## Conferência

- **Logo:** na capa e no Obrigado, o logo inteiro num quadro branco, sobre o padrão verde. No cabeçalho, o logo inteiro e
  pequeno. É a versão certa para o fundo claro, e o logo não está distorcido nem recolorido.
- **Cores:** o tema é o dos originais: escuro `#1E2B22`, verde do logo `#59BA61`, verde-escuro `#2F7D36`, verde-claro
  `#EEF7EF`, laranja `#F28C28` e cinza `#6B7570`. O texto verde sobre fundo claro sai em `#2F7D36`, e o texto laranja
  em `#8A3F00`, como fechado no MC-0020. A exceção é o vermelho do item 3 do MC-0022, abaixo.
- **Fonte:** Arial no tema (título e corpo) e em todos os textos. As outras fontes do XML são só as fontes de reserva
  do tema do Office para outros alfabetos. Nenhum "Calibri".
- **Fotos e desenhos (31 imagens):** todas as fotos são de peça BAP, e as caixas mostram o logo da BAP (Kit de
  Distribuição, Bomba D'Água, Trizeta, Cruzeta, Semieixo Homocinético, Sapata de Freio, Cilindro de Roda, ProActive). O
  tensor do kit tem "bap" gravado. Os 10 desenhos em vetor não têm marca nenhuma. A troca da lâmpada (64193 no vidro) e
  da vela pelo desenho foi a decisão certa. A exceção é a foto da embreagem (item 4 do MC-0022).
- **Voz:** direta e de balcão ("Pergunte: o carro balança ou 'flutua' depois da lombada?", "Não peça para trocar tudo"),
  sem prometer diagnóstico e no mesmo tom dos originais. "Catálogo BAP" sai com maiúscula quando é o nome do material.
  "ProActive" sai certo (slide 35).
- **Nomes de produto:** na tabela "Sintoma → sistema → peça BAP" (slide 37) e nos slides de sinais, saem do PRODUTO da base
  ("Eletroventiladores · Bomba D'Água", "Junta Homocinética · Kit Reparo da Junta Homocinética"). A exceção é o item 2
  do MC-0022.
- **Regras:** sem preço com valor e sem "estoque". A alçada e o Price ficam, porque o material é só do admin. O rodapé
  já sai com "uso interno": é a S12, que ainda espera o "aprovado" do Alexandre.

## Achado

| ID | Onde | Tipo | Fere | Gravidade | Correção | Dono |
|---|---|---|---|---|---|---|
| MC-0022 | Slides 1, 17, 18, 30, 39 e 40 e o tema do .pptx | voz · cor · terceiros | manual a aprovar (MC-0019 e MC-0020; regra de marca de terceiros) | baixa | Ver abaixo | catalogo-grafico |

### MC-0022 · 4 ajustes no modelo completo

1. **Capa (slide 1):** "Novembro 2026" → **"Novembro de 2026"**. É a volta do que o MC-0019 já tinha corrigido no
   outro gerador.
2. **Nomes de produto nos combos e no cross-sell (slides 39 e 40):** usar o PRODUTO da base, como na tabela do
   slide 37:
   - "Kit do amortecedor" e o "Kit" do Combo 1 → "Kit Batente de Amortecedor";
   - "Kit de correia + Bomba d'água" (Combo 3) → "Kit de Distribuição + Bomba D'Água";
   - "Sapata + Cilindro de roda + Fluido" (Combo 2) → "Sapata de Freio + Cilindro de Roda + Fluido de Freio".

   Se o nome completo não couber no cartão, o `designer-ux` decide o corte. No texto que ensina mecânica ("a bomba
   d'água gira pela correia"), a peça é o componente do carro e fica em minúsculas.
3. **Cor:** com o molde, o tema voltou a ter o `accent5 #D64545` (vermelho) e o `accent6 #F2C14E` (amarelo), que
   tinham saído no MC-0020. O vermelho pinta 2 ícones de "sinal grave" (slides 18 e 30: coifa rasgada e folga na roda).
   - Recomendo **registrar no guia** o "vermelho de sinal grave, `#D64545`, só em ícone", porque está nos originais que
     o Alexandre deu como modelo. Ele aprova junto do padrão.
   - Se ele não aprovar, os 2 ícones passam ao laranja dos outros sinais.
   - O amarelo `#F2C14E` não tem uso e sai do tema.
   - Cuidado: não basta trocar o `accent5` do tema, porque os ícones pegam a cor dele.
4. **Foto da embreagem (slide 17, `ppt/media/image14.png`):** o platô tem um emblema oval gravado ao lado do número da
   peça. É ilegível a 100 ppi, mas é marca do fabricante, como o texto da vela que já saiu. Pelo mesmo critério, troque
   por uma foto sem o emblema à mostra ou peça ao Alexandre o "pode ficar". A foto é a mesma do site, então o `web-site`
   fica avisado.

## Reteste

Na próxima rodada: a capa, os slides 17, 18, 30, 39 e 40 e o tema (`ppt/theme/theme1.xml`). Fechar o MC-0022.
