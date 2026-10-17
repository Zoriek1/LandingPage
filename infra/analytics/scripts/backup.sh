#!/usr/bin/env bash
# Backup lógico (pg_dump -Fc) do banco do serviço `postgres` do compose local.
# Uso: infra/analytics/scripts/backup.sh
# Saída: $BACKUP_DIR/analytics-<UTC>.dump (+ .sha256), modo 0600, dentro de diretório 0700.
# LIMITAÇÃO: NÃO criptografa. A política de produção (docs 02 §11) exige criptografia e cópia fora da VPS;
# isso não é feito aqui.
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

dc ps --status running --services | grep -qx postgres || die "serviço postgres não está em execução"

umask 077
mkdir -p "$BACKUP_DIR"; chmod 700 "$BACKUP_DIR"
ts="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/analytics-$ts.dump"
tmp="$out.partial"
trap 'rm -f "$tmp"' EXIT

dc exec -T postgres pg_dump -U "$PG_USER" -d "$PG_DB" -Fc --no-owner --no-acl >"$tmp"
# Confere que o arquivo é um archive legível antes de publicá-lo.
dc exec -T postgres pg_restore -l <"$tmp" >/dev/null || die "dump inválido (pg_restore -l falhou)"
mv "$tmp" "$out"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$out")" >"$(basename "$out").sha256")
trap - EXIT
echo "backup: $out ($(stat -c %s "$out") bytes)"
