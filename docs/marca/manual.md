# Manual da marca BAP AUTOPARTS

Fonte única das regras da marca no site, nos PDFs e nos materiais. **Só entra o que o Alexandre aprovou**, com a
referência em `docs/marca/decisoes.md`.

O levantamento completo do estado atual (logo, paleta, tipografia, grafismos, tom de voz e aplicações) ainda vai ao
Alexandre como manual "a aprovar", com a simulação do verde decidido em R-20261120-115646-alexandre. Até lá, as seções
abaixo têm só as regras já aprovadas.

## Nome da marca

- A grafia oficial é **"BAP AUTOPARTS"**: tudo em maiúsculas e sem espaço entre AUTO e PARTS (decisão 10 a,
  R-20261122-032433-alexandre).
- Vale no site, nos PDFs, nas apresentações e nos dados do sistema (ex.: a empresa do admin no login).
- Errado: "BAP AUTO PARTS" e "BAP Autoparts".

## Logo

### Logo da BAP no lugar da logo do cliente

- No login do catálogo, quando o usuário não tem logo própria, entra o **logo inteiro da BAP, pequeno** (decisão 7 a,
  R-20261122-032433-alexandre).
- Não se corta o PNG para tirar só o símbolo "b" no círculo verde, nem se usa o símbolo solto.

### Logo do cliente

- A logo do cliente fica numa **moldura em retângulo deitado** (decisão 6 a, R-20261122-032433-alexandre).
- As medidas são as das telas aprovadas como simuladas (decisão 9 a):

| Lugar | Moldura |
|---|---|
| Cabeçalho, botão do canto, computador | 48 × 30 px |
| Cabeçalho, botão do canto, celular | 40 × 26 px |
| Menu aberto do botão do canto | 84 × 52 px |
| Lista de usuários (só o admin vê) | 64 × 40 px |

## Cores de estado (só no site)

Não são cores da marca. Servem para avisar erro e não aparecem como decoração (decisão 8 a, R-20261122-032433-alexandre).

| Nome | Hex | Token | Papel |
|---|---|---|---|
| Erro | `#B42318` | `--erro` | Mensagem de erro, campo com erro e botão de desativar |
| Erro claro | `#FDECEA` | `--erro-claro` | Fundo da caixa de erro |

- Só na interface do site. Não entram nos PDFs, na Linha Moto, no portfólio, no Kit Filtros nem nas apresentações.
- Contraste medido: `--erro` no branco, 6,57:1; `--erro` no `--erro-claro`, 5,75:1; texto branco no botão vermelho,
  6,57:1.
