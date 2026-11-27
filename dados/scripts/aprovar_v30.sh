#!/usr/bin/env bash
# T-0040 · depois do aprovado do Alexandre: grava a v30 (base e dados/versoes) com o recado do aprovado e tira a cópia
# da simulação.
#
# Uso (no branch catalogo-dados/T-0040-v30, com a árvore limpa e o origin/main ainda na v29):
#   bash dados/scripts/aprovar_v30.sh R-AAAAMMDD-HHMMSS-<autor>
# Rodou uma vez (660a591). A BASE_simulada_v30.xlsx saiu nesse commit: para gravar de novo, use direto o
#   python3 dados/scripts/base_v30.py --refazer --autorizacao "<recado>"
# Faz:
#   1. python3 dados/scripts/base_v30.py --refazer --autorizacao "<recado>" (ver o docstring do base_v30.py);
#   2. git rm da dados/T-0040/v30/BASE_simulada_v30.xlsx (a antes_depois_v30.xlsx fica como registro);
#   3. commit com os trailers. O push fica para quem roda: git push origin catalogo-dados/T-0040-v30
# A pesquisa é lida do commit d3e4b8d (branch po/T-0040-anos) pelo git show; sem ele, use
#   python3 dados/scripts/base_v30.py --refazer --autorizacao "<recado>" --pesquisa-dir /pasta/fora/do/repo
set -euo pipefail
RECADO="${1:?uso: bash dados/scripts/aprovar_v30.sh R-AAAAMMDD-HHMMSS-autor}"
[[ "$RECADO" =~ ^R-[0-9]{8}-[0-9]{6}-[a-z-]+$ ]] || { echo "[PARADO] recado fora do padrão R-AAAAMMDD-HHMMSS-autor: $RECADO"; exit 2; }
cd "$(git rev-parse --show-toplevel)"
[[ "$(git branch --show-current)" == "catalogo-dados/T-0040-v30" ]] || { echo "[PARADO] não é o branch catalogo-dados/T-0040-v30"; exit 2; }
[[ -z "$(git status --porcelain)" ]] || { echo "[PARADO] a árvore não está limpa"; exit 2; }
git fetch -q origin main po/T-0040-anos || git fetch -q origin main
python3 dados/scripts/base_v30.py --refazer --autorizacao "$RECADO"
git rm -q dados/T-0040/v30/BASE_simulada_v30.xlsx
git add dados/BASE_BAP_UNIFICADA_PRODUTOS_BAP.xlsx dados/versoes/BASE_BAP_UNIFICADA_PRODUTOS_BAP_v30.xlsx
git -c user.name=catalogo-dados -c user.email=catalogo-dados@bapajuda.invalid commit -q -F - <<MSG
T-0040: v30 aprovada ($RECADO)

- base e versoes/v30 gravadas (base_v30.py --refazer): iguais à simulação, só com o texto da
  autorização trocado, "pendente do aprovado do Alexandre" -> "aprovado em $RECADO",
  no LOG_CORRECOES e no LEIA-ME.
- sai a dados/T-0040/v30/BASE_simulada_v30.xlsx (fica no histórico do branch).

Tarefa: T-0040
Agente: catalogo-dados
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0157qAhjP9skRpvtYmiCFtzz
MSG
git log --oneline -1
echo "Falta o push: git push origin catalogo-dados/T-0040-v30"
