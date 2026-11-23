# T-0029 · Parecer de UX da rodada final (Portfólio 2027 com a v28, 87 páginas)

| Campo | Valor |
|---|---|
| Revisor | designer-ux |
| Data | 23/11/2026 10:55 (Manaus) |
| O que foi revisto | Branch `catalogo-grafico/T-0029-portfolio-2027`, head `71977dc0c1a5fca14d91f9c194ffbc7e57cd7076`, com o diff `bf89f50..71977dc` (`REGRA_16A`). Também o `LEIA-ME.md`, os 63 PNGs de `sim-T-0029-final/` (31 pares e a página que sai), o PDF de 87 páginas e a variante b (`16a-variante-b/`, PNGs e PDF). O "antes" é a simulação aprovada (`61ac7ed`, v27) |
| Pedido | R-20261123-135656-po e as decisões da rodada (9a, 10a, 16a) |
| Resultado | **VOLTA PARA AJUSTE**: 1 🟡, pequeno, sem 🔴. Recomendo a variante a |

Sem preço e sem estoque: 🟢. A grafia ("ProActive", "Shiftease", caixa alta das aplicações) fica com o parecer de marca da T-0029.

## 1. Onde muda
- 🟢 **Selo "NOVIDADE 2026" (9a):** a caixa da diferença é a mesma da 1ª rodada, só os 2 dígitos. O selo não cresce.
- 🟢 **Contagens da v28 (p03, p04, p07, p08):** muda só o número, no lugar.
- 🟢 **Divisória da Pesada (p44):** a coluna 01 perde Bieletas, e as colunas 02 e 03 sobem juntas. Nada passa da margem, e a lista termina mais acima.
- 🟢 **Amortecedores da Pesada (p45):** "3 itens" e 2 aplicações, só MB. O "Fiat Dobló" sai: resolve a nota 2 do §5 do parecer da T-0028.
- 🟢 **ProActive e Shiftease (p74, 78 e 79):** muda só a palavra, sem mexer na linha.
- 🟢 **Renumeração:** são 87 páginas, e o número do rodapé de cada uma bate com a posição dela no PDF (conferi as 87). Nenhuma página cita outra pelo número.

## 2. 16a: a lista da Pesada
| Pág. | Linhas (a) | Linhas (b) |
|---|---|---|
| 47, 53, 54, 60, 61, 63, 66, 68 | 12 | 12 |
| 56 | 11 | 12 |

- 🟢 **Sem buraco no meio.** Na p56 da a, a 12ª vaga fica vazia no fim da 2ª coluna (6 + 5); a grade e as outras linhas não se movem. Nas outras páginas, as 12 vagas ficam cheias.
- 🟢 **A variante a é a certa.** Na p68 (Palhetas), a "a" troca os carros (Citroën C2, Daihatsu Cuore, Jaguar S-Type, Honda CR-X…) por caminhão e ônibus. A "b" mantém Daihatsu, Jaguar, Lexus, Mini Cooper e Subaru numa página da Linha Pesada, e põe o "VW Variant" (p47), o "Ssangyong Actyon" (p54) e o "Volvo V40" (p61). A "b" só ganha na p56, onde guarda tratores e colheitadeira, que a "a" tira.

### 🟡 "Ford F-1" na p56 (as 2 variantes)
- A linha nova "Ford F-1" é um modelo partido, como o "Ford F-" que saiu na T-0028. O leitor não sabe que caminhão é. Vem do "FORD - Caminhão, F-1000, F-4000…" do INT16579.
- **Pedido ao `catalogo-grafico` (o resultado; o como é dele):** a linha sai, como na regra da T-0028 (a vaga vai para a próxima), ou fica inteira ("Ford F-1000, F-4000…"). Depois, a prova só da p56.

## 3. Notas (não seguram)
1. **Carro de passeio na Pesada, mesmo na variante a:**
   - "300C" na p54 (Polias): o item é LEVE E PESADA, e o "300C" parece passar pelo `HEAVY` por engano, como "915C". É para o `catalogo-grafico` conferir;
   - "Toyota Etios 1.3" na p68: vem do HC26, marcado só PESADA na base. É para o `catalogo-dados`.
2. **Linha sem montadora:** "13000", "Topic" e "Daily" (p68) e "CUMMINS" (p56). Vão para o item 8 da lista de melhorias da T-0032.
3. **Corte sem "…", que já estava na simulação aprovada:** "Range Rover Evoque 2.0 L 1" (p43) e "Agrale Caminhões: 6500, 8500, 8700, 1" (p59). Vão para o item 6 da lista da T-0032.

**Resultado: VOLTA PARA AJUSTE** (1 🟡, "Ford F-1" na p56). O resto da rodada está 🟢, e a variante a é a recomendada. Depois do ajuste, confiro só a p56.

---

## Reteste, rodada 3 (head `6d8f143`)

| Campo | Valor |
|---|---|
| Data | 23/11/2026 11:20 (Manaus) |
| O que foi revisto | O `LEIA-ME.md` e os 48 PNGs de `sim-T-0029-final/rodada3/` (24 páginas, antes `71977dc` × depois). Também o PDF de 87 páginas: comparei, no texto, cada linha de "Principais aplicações" das 24 páginas com a rodada anterior |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

- 🟢 **O 🟡 da p56 está resolvido.** Sai "Ford F-12000, F14000", inteiro, e a p59 passa a "Ford Caminhões F12000, F14000, F16000". O "2000" deixou de ser lido como ano.
- 🟢 **Todo corte agora tem "…" e termina em palavra inteira** (18 páginas): "VW Fus" vira "VW…" (p42), "Sie" vira "Palio…" (p34), "Evoque 2.0 L 1" vira "Evoque 2.0 L…" (p43), "Agrale … 8700, 1" vira "8700…" (p59), "Motocicl" vira "Motocicletas…" (p75). Na busca em todo o PDF, não sobra pedaço de palavra sem "…" nas aplicações.
- 🟢 **Sem buraco no meio.** As 24 páginas mantêm a quantidade de linhas, menos 2:
  - a p53 passa de 12 para 11 (saem Ducato e Expert, entra VW Delivery), e a vaga fica no fim da 2ª coluna (6 + 5);
  - a p56 volta a 12.
  A grade de 2 colunas não muda, e nada passa da área.
- 🟢 **A Pesada fica com veículo pesado.** Saem "300C" (p54), Ducato Cargo (p53 e p61), Expert (p53), Topic e Daily (p68). Voltam máquinas e caminhões (Dynapac, Muller e Putzmeister na p63; CBT, New Holland e Valmet na p56; GM C-60 e D40). A Leve, a Moto e a Universal mudam só no corte.
- 🟢 **Numeração:** as 87 páginas batem com o número do rodapé.

### Notas do reteste (não seguram)
1. **Corte no meio do modelo.** Com o "…", o corte às vezes cai entre 2 palavras do mesmo modelo: "Novo Palio, Grand…" (p42, de "Grand Siena") e "Strada, Palio…" (p34, de "Palio Weekend"). Também sobra a linha "Volkswagen / Chevrolet / Ford VW…" (p42), sem modelo nenhum. O "…" avisa o corte, e por isso não seguro. Para o item 6 da lista da T-0032: cortar no último modelo inteiro ("Novo Uno, Novo Palio…"); sem modelo inteiro, a linha sai.
2. **Notas que continuam:** "Toyota Etios 1.3" na p68 (HC26 na base, para o `catalogo-dados`) e o " - DE" em "Iveco STRALIS - DE" (p62, já estava antes; item 4 da lista da T-0032).

**Resultado da rodada 3: LIBERADO.** A T-0029 fica sem 🔴 e sem 🟡, com a variante a.

---

## Entrega final (PR #179, head `0133f6f`)

| Campo | Valor |
|---|---|
| Data | 23/11/2026 12:27 (Manaus) |
| O que foi revisto | O `catalogo_grafico/entregas/Portfolio_Produtos_BAP_AUTOPARTS.pdf`, tirado do próprio commit `0133f6f726084443bbd705deeb0352d2a2737c66`, comparado com o PDF da rodada 3 liberada (`6d8f143`), página a página, no texto e no pixel (50 ppi). Também o diff `6d8f143..0133f6f` do `portfolio.py` e os PNGs de `final-T-0029/` |
| Decisão do Alexandre | 15a: "bom custo-benefício" no lugar de "preço acessível" |
| Resultado | **LIBERADO**, sem 🔴 e sem 🟡 |

- 🟢 **A entrega é a simulação liberada.** São 87 páginas nas 2 versões, e só a pág. 2 muda, no texto e no pixel. As outras 86 são iguais às da rodada 3.
- 🟢 **Pág. 2 ("Quem somos"):** muda só a frase do 15a. "passando" desce para a 3ª linha, e o parágrafo continua com 3 linhas, na mesma caixa. Os 4 cartões e a faixa da garantia não se movem.
- 🟢 **O diff do gerador** é só essa frase. O resto do diff `6d8f143..0133f6f` é o merge do main (governança), fora do PDF.
- 🟢 **No PDF entregue não aparece "preço" nem "estoque".** O 15a tirou a única ocorrência (item 21 da lista da T-0032).

**Resultado da entrega final: LIBERADO** para seguir ao `revisor-codigo`.
