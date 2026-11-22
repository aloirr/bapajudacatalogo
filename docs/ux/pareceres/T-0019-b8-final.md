# Parecer de UX · T-0019 · PR #99 · páginas finais (head e33cfff088065c658ab60ea815b872badd3c7dab)

**Resultado: LIBERADO** (designer-ux, 21/11/2026, Manaus)

Base: R-20261121-200058 (B8, B9, B10, "Leve também" pelo sistema) e R-20261122-010035 ("A": a marca em cima e o código inteiro embaixo quando não cabem juntos). A coluna EQUIVALE A do A4 não foi alargada (REF_MAIS = 0).
Conferido: pranchas `recados/anexos/T-0019/b8-final-e33cfff/` (A4 p.21, 29, 44; Digital p.83, 147), simulações `sim-b/` e os PDFs do e33cfff (A4 p.20, 21, 43, 44; Digital p.110, 147, CUB60235, ROL32008 e ROL32009).

## Achados
- 🟢 **A4 p.21:** "Kongsberg 1000504869AMK" (SCE14011) antes partido em "100050486 / 9AMK"; agora "Kongsberg" em cima e o código inteiro embaixo. Segue a regra "A".
- 🟢 **A4 p.29 e Digital p.147 (cartões):** a aplicação quebra depois da vírgula ou da "/" ("Fox,Spacefox" deixa de virar ",Fox"; "Ecosport,Fo / cus" vira "Ecosport, / Focus"; "8V( / 03.)" vira "8V(03.)"). A linha não começa mais com vírgula nem com meia palavra. Leitura melhor, sem mudar a hierarquia.
- 🟢 **A4 p.44:** a diferença com a prancha aprovada (`sim-b/09`) está nos cartões. Na simulação, "FAG" ficava no fim da 1ª linha e "7136102300" sozinho na 2ª (marca separada do código, o que a B8 proíbe). No final, "FAG 7136102300" desce junto. Na tabela, "FAG" em cima e "KLM102949LM102910" inteiro embaixo é o próprio caso "A" aprovado (antes: "KLM102949LM10291 / 0"). Não é um desvio: é a regra aprovada aplicada. Só passa a valer em mais um lugar.
- 🟢 **Digital p.83:** a referência "Cód. Original YC153200AF/…" quebra só na "/", sem cortar o código.
- 🟡 **Digital p.147, cartão BDA50003 (recomendo aceitar como está):** o cartão perde "Onix 1.4 L 8V · 2012 até 2016" e termina em "… (+ outras aplicações)". Esse é o mesmo padrão dos cartões vizinhos (BDA50024) e dos destaques do A4. A aplicação inteira está na linha BDA50003 da tabela "Todos os itens da linha", na mesma página, um palmo abaixo. O cartão é vitrine, não ficha: o "(+ outras aplicações)" avisa, e o cliente acha o resto sem trocar de página. Também não recomendo diminuir a fonte, nem alargar o cartão, nem tirar o "· GM", porque isso quebraria a consistência entre os 5 cartões. Não pede mudança.
- 🟢 **B9:** o subtítulo do SCE14002 sai "Servo embreagem cilindro curto s/ indicador" no A4 p.21 e no Digital, em 2 linhas, com a faixa dos 5 cartões na mesma altura.
- 🟢 **B10 (A4 p.20):** a tag NOVO do EMB3400700639R, do 648R e do 649R desce para a linha da medida e não fica mais sobre "MB" e "VOLVO". As linhas não crescem.
- 🟢 **"Leve também" (amostra):** CUB60235 mostra "ABS4517 · ABS4557", e ROL32008 e ROL32009 mostram "—", como na simulação aprovada. No A4 p.44, ROL1000, ROL102949/102910 e ROL104949/104911 mostram "—", como no `sim-b/09`.
- Sem preço e sem estoque nas páginas vistas.

## Depois do parecer
- O #99 entrou no main com o head dbbef37 (merge 57bdc2a, 21/11 às 21:32). O dbbef37 só mexe no gerador, não nos PDFs, então o LIBERADO continua valendo.

## Pendência fora deste PR
- A [SUPOSIÇÃO] da sim-b (`recados/anexos/T-0019/sim-b/README.md:28`) continua aberta: uma linha da coluna EQUIVALE A ainda pode começar com "·" (ex.: Digital p.83, CXD13097, "· Ampri 26124"). É menor e já foi registrada.
