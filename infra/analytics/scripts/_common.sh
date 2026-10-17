# shellcheck shell=bash
# Funções comuns. Use com `source`. Nunca imprime segredos.
set -Eeuo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ANALYTICS_ENV_FILE:-$INFRA_DIR/.env.local}"
COMPOSE_FILE_PATH="$INFRA_DIR/compose.yaml"

die() { echo "ERRO: $*" >&2; exit 1; }

[ -f "$ENV_FILE" ] || die "env file não encontrado: $ENV_FILE (copie de .env.example ou defina ANALYTICS_ENV_FILE)"

# Carrega só as variáveis necessárias, sem eval/source do arquivo inteiro.
env_get() { awk -v key="$1" 'index($0, key "=") == 1 { value=substr($0,length(key)+2) } END { sub(/^"/,"",value); sub(/"$/,"",value); print value }' "$ENV_FILE"; }

PG_USER="$(env_get ANALYTICS_POSTGRES_USER)"
PG_DB="$(env_get ANALYTICS_POSTGRES_DB)"
[ -n "$PG_USER" ] && [ -n "$PG_DB" ] || die "ANALYTICS_POSTGRES_USER/ANALYTICS_POSTGRES_DB vazios em $ENV_FILE"

BACKUP_DIR="${ANALYTICS_BACKUP_DIR:-$(env_get ANALYTICS_BACKUP_DIR)}"
BACKUP_DIR="${BACKUP_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/landing-analytics/backups}"

# --profile restore: permite exec/up do serviço postgres-restore; nenhum comando sobe serviços sem nome.
dc() { docker compose --profile restore --env-file "$ENV_FILE" -f "$COMPOSE_FILE_PATH" "$@"; }

# psql_in <service> <db> [args...]  (SQL via stdin ou -c)
psql_in() {
  local svc="$1" db="$2"; shift 2
  dc exec -T "$svc" psql -X -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$db" "$@"
}
