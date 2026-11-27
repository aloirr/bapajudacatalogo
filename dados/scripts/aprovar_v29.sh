#!/usr/bin/env bash
# T-0040 · depois do aprovado do Alexandre: grava a v29 de novo com o recado do aprovado e tira a cópia da simulação.
#
# Uso (no branch catalogo-dados/T-0040-v29, com a árvore limpa):
#   bash dados/scripts/aprovar_v29.sh R-AAAAMMDD-HHMMSS-<autor>
# Faz:
#   1. python3 dados/scripts/base_v29.py --refazer --autorizacao "<recado>"  (base e v29 voltam à v28 do origin/main
#      e são gravadas de novo, iguais, só com "aprovado em <recado>" no LOG_CORRECOES, no LEIA-ME e no AVISO);
#   2. git rm da dados/T-0040/simulacao/BASE_simulada_v29.xlsx (RD-0670);
#   3. commit com os trailers. O push fica para quem roda: git push origin catalogo-dados/T-0040-v29
#
# Para refazer a BASE_simulada_v29.xlsx um dia (ela fica no commit cf9db10): com a base na v28,
#   git show origin/po/T-0040-anos:docs/propostas/T-0040/resultado_fraga.csv > /caminho/fora/do/repo/fraga.csv
#   python3 dados/scripts/simular_T0040.py --fraga /caminho/fora/do/repo/fraga.csv
set -euo pipefail
RECADO="${1:?uso: bash dados/scripts/aprovar_v29.sh R-AAAAMMDD-HHMMSS-autor}"
[[ "$RECADO" =~ ^R-[0-9]{8}-[0-9]{6}-[a-z-]+$ ]] || { echo "[PARADO] recado fora do padrão R-AAAAMMDD-HHMMSS-autor: $RECADO"; exit 2; }
cd "$(git rev-parse --show-toplevel)"
[[ "$(git branch --show-current)" == "catalogo-dados/T-0040-v29" ]] || { echo "[PARADO] não é o branch catalogo-dados/T-0040-v29"; exit 2; }
[[ -z "$(git status --porcelain)" ]] || { echo "[PARADO] a árvore não está limpa"; exit 2; }
git fetch -q origin main
python3 dados/scripts/base_v29.py --refazer --autorizacao "$RECADO"
git rm -q dados/T-0040/simulacao/BASE_simulada_v29.xlsx
git add dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v29.xlsx \
        dados/T-0040/AVISO_BAP_CENTRAL.md
git -c user.name=catalogo-dados -c user.email=catalogo-dados@bapajuda.invalid commit -q -F - <<EOF
T-0040: v29 aprovada ($RECADO)

- base e versoes/v29 gravadas de novo (base_v29.py --refazer): só o texto da autorização muda,
  "pendente do aprovado do Alexandre" -> "aprovado em $RECADO", no LOG_CORRECOES,
  no LEIA-ME e no dados/T-0040/AVISO_BAP_CENTRAL.md.
- sai a dados/T-0040/simulacao/BASE_simulada_v29.xlsx (RD-0670; fica no commit cf9db10).

Agente: catalogo-dados
Tarefa: T-0040

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QvB2SQd3z8iEh3oSYx56vn
EOF
git log --oneline -1
echo "Falta o push: git push origin catalogo-dados/T-0040-v29"
