#!/usr/bin/env bash
# Restaura um dump em banco/instância SEPARADOS. Nunca sobrescreve o banco de origem.
# Uso: infra/analytics/scripts/restore.sh <arquivo.dump>
#
# Modo compose (padrão): origem = serviço `postgres`; alvo = serviço `postgres-restore`
#   (instância e volume próprios), banco $RESTORE_DB (padrão analytics_restore).
#   Variáveis opcionais: RESTORE_SERVICE (padrão postgres-restore) | RESTORE_DB
#
# Modo avulso (containers Postgres já existentes, sem compose): defina
#   RESTORE_SOURCE_CONTAINER, RESTORE_TARGET_CONTAINER, ANALYTICS_SOURCE_DB, ANALYTICS_POSTGRES_USER
#   e RESTORE_DB (obrigatório). Usa o socket local do container (sem senha em argv/env).
#
# Guardas (abortam antes de qualquer escrita):
#   1. alvo == origem (mesma instância por system_identifier E mesmo nome de banco) -> recusa;
#   2. banco alvo já existe -> recusa (nunca faz DROP/sobrescrita);
#   3. checksum .sha256 ao lado do dump, se existir, precisa conferir.
set -Eeuo pipefail

dump="${1:-}"
if [ -n "${RESTORE_TARGET_CONTAINER:-}" ]; then
  die() { echo "ERRO: $*" >&2; exit 1; }
  SRC="${RESTORE_SOURCE_CONTAINER:?defina RESTORE_SOURCE_CONTAINER}"
  TGT="$RESTORE_TARGET_CONTAINER"
  PG_DB="${ANALYTICS_SOURCE_DB:?defina ANALYTICS_SOURCE_DB}"
  PG_USER="${ANALYTICS_POSTGRES_USER:?defina ANALYTICS_POSTGRES_USER}"
  TARGET_DB="${RESTORE_DB:?defina RESTORE_DB}"
  for c in "$SRC" "$TGT"; do
    [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = true ] || die "container $c não está em execução"
  done
  psql_src() { local db="$1"; shift; docker exec -i "$SRC" psql -X -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$db" "$@"; }
  psql_tgt() { local db="$1"; shift; docker exec -i "$TGT" psql -X -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$db" "$@"; }
  exec_tgt() { docker exec -i "$TGT" "$@"; }
  start_target() { :; }
else
  source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"
  TGT="${RESTORE_SERVICE:-postgres-restore}"
  TARGET_DB="${RESTORE_DB:-analytics_restore}"
  dc ps --status running --services | grep -qx postgres || die "origem (postgres) não está em execução; guarda não pode ser avaliada"
  psql_src() { psql_in postgres "$@"; }
  psql_tgt() { psql_in "$TGT" "$@"; }
  exec_tgt() { dc exec -T "$TGT" "$@"; }
  start_target() { dc up -d --wait "$TGT" >/dev/null; }
fi

[ -n "$dump" ] && [ -f "$dump" ] || die "uso: $0 <arquivo.dump>"
[[ "$TARGET_DB" =~ ^[a-z_][a-z0-9_]*$ ]] || die "RESTORE_DB inválido (use [a-z0-9_])"
if [ -f "$dump.sha256" ]; then
  (cd "$(dirname "$dump")" && sha256sum -c "$(basename "$dump").sha256" >/dev/null) || die "checksum não confere"
fi

start_target
sysid() { "$1" postgres -Atqc "select system_identifier from pg_control_system()"; }
src_id="$(sysid psql_src)"; tgt_id="$(sysid psql_tgt)"
[ -n "$src_id" ] && [ -n "$tgt_id" ] || die "não foi possível ler system_identifier"
if [ "$src_id" = "$tgt_id" ] && [ "$TARGET_DB" = "$PG_DB" ]; then
  die "RECUSADO: o alvo é o banco de origem ($PG_DB na mesma instância)"
fi

exists="$(psql_tgt postgres -Atqc "select 1 from pg_database where datname='$TARGET_DB'")"
[ -z "$exists" ] || die "RECUSADO: banco $TARGET_DB já existe no alvo; não sobrescrevo"

psql_tgt postgres -qc "create database $TARGET_DB"
exec_tgt pg_restore -U "${PG_USER}" -d "$TARGET_DB" --exit-on-error --no-owner --no-acl <"$dump"
echo "restaurado em $TGT / $TARGET_DB"

echo "--- contagem de linhas (public) ---"
psql_tgt "$TARGET_DB" -At -F ' = ' -c "
select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1"
echo "Conferência de migrações/autorização/ingestão sintética: manual (ver operacao-local.md)."
