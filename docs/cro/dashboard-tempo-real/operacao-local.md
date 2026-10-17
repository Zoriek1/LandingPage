# Operação local do backend de analytics

Escopo: desenvolvimento e validação **locais**. Publicação remota (VPS, DNS, TLS, registry, deploy) está **bloqueada** até haver acessos e o inventário do doc 02 §2.2. Nada aqui foi aplicado em servidor remoto.

Artefatos em [`infra/analytics/`](../../../infra/analytics/): `Dockerfile`, `Dockerfile.dockerignore`, `compose.yaml`, `.env.example`, `scripts/{backup,restore}.sh`, `nginx/*.example`.

## 1. Status de validação

| Item | Status |
| --- | --- |
| `docker compose config -q` (env fictício, profiles `tools` e `restore`), repetido em 13/10 | Rodado, OK |
| Compose falha sem variáveis obrigatórias (sem defaults de produção) | Rodado, OK |
| `docker build --check` do Dockerfile | Rodado, sem avisos (lint apenas) |
| Build real da imagem com o código atual | Rodado em 13/10 por mim, OK. Execução com type stripping e healthcheck validados em container (§6.1 item 6) |
| Backup `pg_dump -Fc` do schema real `analytics_preview` (migrations 001/002, 9 eventos), origem só leitura | Rodado em 13/10, OK (§6.1) |
| Restore em NOVO banco, container descartável com volume novo | Rodado, OK; tabelas, revisão 6, migrações, contagens (eventos > 0) e md5 idênticos à origem (§6.1) |
| Restart do container de restore e nova comparação | Rodado, idêntico antes/depois |
| Imagem (HEAD) em `NODE_ENV=production`, cookie seguro, contra o banco restaurado: `/health` e `/health/ready` 200, `healthy` | Rodado, OK. Login/CSRF/SSE/`/collect` **não** exercitados |
| Guardas do restore (alvo = origem; banco alvo existente) | Rodadas, ambas recusaram sem escrever |
| Restart/persistência da stack `compose.yaml` completa (`down` sem `-v` e `up`) | **Não rodado** |
| Nginx (`nginx -t`), TLS, SSE por proxy | **Bloqueado/Não rodado** (nginx não instalado; remoto bloqueado) |
| `shellcheck` | **Não rodado** (não instalado); só `bash -n` |
| Criptografia de backup, rotação, cópia fora da máquina, deploy remoto, rollback | **Não implementados / não rodados** |

## 2. Isolamento

- Projeto Compose `landing-analytics-dev`: rede e volumes próprios (`analytics_pgdata`, `analytics_pgdata_restore`).
- Não usar nem alterar: serviços do Gestor (5000/5432), o container `landing-analytics-local` (127.0.0.1:55432) e seus bancos `analytics` e `analytics_preview`, exceto leitura (`pg_dump`) quando explicitamente pedido.
- Portas no host, sempre em loopback: Postgres **55433**, restore **55434**, API **8788** → container 8787. Sobrescreva com `ANALYTICS_PG_HOST_PORT`, `ANALYTICS_PG_RESTORE_HOST_PORT`, `ANALYTICS_HOST_PORT`.

## 3. Contrato de ambiente

| Variável | Observação |
| --- | --- |
| `DATABASE_URL` | No compose é montada a partir de `ANALYTICS_POSTGRES_*`. Fora do compose, defina diretamente. `migrate.ts` aceita também `ANALYTICS_TEST_DATABASE_URL` como fallback (uso de testes) |
| `ANALYTICS_PORT` | 8787 |
| `ANALYTICS_HOST` | `127.0.0.1` direto no host; `0.0.0.0` no container (fixado no compose; publicação só em loopback) |
| `ANALYTICS_PUBLIC_ORIGINS` | CSV de origins de `/collect` (sem path nem `/` final) |
| `ANALYTICS_ADMIN_ORIGIN` | Um origin |
| `ANALYTICS_SECURE_COOKIE` | Cookie é `Secure` só se o valor for exatamente `true` |
| `RELEASE_SHA` | Tag da imagem; exposto em `/health` |
| `NODE_ENV` | Explícito, sem default |
| `ANALYTICS_ADMIN_PASSWORD` | Só para a CLI admin, inline no comando; **não** vai no `.env` |

Com `NODE_ENV=production`, o servidor **recusa iniciar** (erro "Incomplete analytics production configuration") se faltar `DATABASE_URL`, se `ANALYTICS_SECURE_COOKIE` não for `true`, se `RELEASE_SHA` não tiver 40 hex, ou se admin/public origins não forem `https://` exatos. `main.ts` também exige `ANALYTICS_ADMIN_ORIGIN` e `ANALYTICS_PUBLIC_ORIGINS`. Sem `RELEASE_SHA`, o runtime usa `development`.

Não há segredo de runtime para sessão/CSRF: a chave HMAC do CSRF é gerada em memória a cada start (reiniciar invalida tokens CSRF; `GET /admin/session` emite novo). Nenhuma senha ou origin tem default no compose ou na imagem; `.env.local` é ignorado pelo git. Senha do Postgres em formato URL-safe (`openssl rand -hex 24`), pois entra na `DATABASE_URL`. Não reutilize a senha do container `landing-analytics-local`.

## 4. Subir localmente

```bash
cp infra/analytics/.env.example infra/analytics/.env.local   # preencher
DC="docker compose --env-file infra/analytics/.env.local -f infra/analytics/compose.yaml"

$DC config -q
$DC up -d --wait postgres
$DC run --rm migrate                # node server/analytics/migrate.ts (Node 24, na imagem)
$DC up -d --build --wait api        # espera o healthcheck (/health/ready)
curl -fsS http://127.0.0.1:8788/health/ready
```

- **Migração é passo separado**: a API não migra ao iniciar. `migrate.ts` aplica `server/analytics/migrations/NNN-*.sql` em ordem, cada arquivo em transação com `pg_advisory_xact_lock`, registrando em `schema_migrations`; é idempotente (pula versões já aplicadas). Não há down migrations.
- **`/health/ready`** responde 200 só se `max(schema_migrations.version) >= 2` **e** existir a linha do projeto em `analytics_meta`; senão 503. `/health` responde `{ok, release, schema}` sem consultar o banco.
- `down` sem `-v` preserva dados; `down -v` **apaga os volumes**.
- Sem Docker: exporte as variáveis do §3 e rode `node server/analytics/migrate.ts` e `node server/analytics/main.ts`.

## 5. Administrador (CLI `server/analytics/admin.ts`)

Não há senha padrão, endpoint de bootstrap nem cadastro público. Uso:

```
node server/analytics/admin.ts create|reset|revoke|disable USER
```

`USER` casa `^[a-zA-Z0-9_.-]{1,80}$`. Para `create` e `reset` a senha vem de **stdin** (preferido; máx. 1024 bytes; a CLI recusa ler de terminal interativo) ou de `ANALYTICS_ADMIN_PASSWORD`. `revoke` e `disable` não usam senha. A CLI usa `DATABASE_URL`.

| Comando | Efeito |
| --- | --- |
| `create` | Insere o usuário. **Não sobrescreve**: se já existir, falha (chave primária) e nada muda |
| `reset` | Troca a senha de usuário existente e **revoga todas as sessões** dele (apaga as linhas em `analytics_admin_sessions`) |
| `revoke` | Revoga todas as sessões do usuário, sem trocar senha |
| `disable` | Marca `disabled=true` (login e sessões deixam de valer) e revoga as sessões |

Exemplos (compose; `-T` é necessário para stdin):

```bash
printf '%s' "$SENHA" | $DC run --rm -T admin create local-admin     # primeiro admin, após migrar
printf '%s' "$NOVA"  | $DC run --rm -T admin reset  local-admin
$DC run --rm admin revoke  local-admin
$DC run --rm admin disable local-admin
```

Sessões: token opaco no cookie `analytics_session` (`HttpOnly; SameSite=Strict; Path=/admin; Max-Age`, com `Secure` quando `ANALYTICS_SECURE_COOKIE=true`; em produção é obrigatório). O banco guarda apenas o **hash** do token e o hash do CSRF; o CSRF é HMAC com chave de runtime. Revogação via CLI vale no banco imediatamente: o próximo request com o cookie volta 401. Streams SSE já abertos são fechados na checagem periódica do stream (**até ~15 s**).

Cuidados: não passar senha em argumento de linha de comando nem em log; preferir stdin a `ANALYTICS_ADMIN_PASSWORD` (variável aparece em `docker inspect`/histórico do shell se exportada). Não há comando para **reabilitar** usuário desabilitado: `reset` não limpa `disabled` (ver §10). Registrar quem executou e quando, sem a senha.

## 6. Backup e restauração

### 6.1 Evidência de 13/10/2026 (schema real `analytics_preview`, com eventos, local)

Origem: banco `analytics_preview` no container `landing-analytics-local` (127.0.0.1:55432), migrations 001/002, com eventos sintéticos de navegador (origin 8082) gerados após o restart da origem feito por outro worker (início do container `2026-10-13T15:26:41Z`). Esta rodada não reiniciou a origem nem escreveu nela: as consultas usaram `default_transaction_read_only=on` e o dump é leitura. O banco `analytics` e o Gestor não foram tocados.

1. Inventário da origem antes do dump, depois do dump e depois de todo o procedimento: idêntico nas três leituras.
2. `pg_dump -Fc --no-owner --no-acl` via `docker exec` → `/tmp/opencode/analytics-validation-events.dump` (10858 bytes, modo 600, sha256 `97effbb7…b464280`). Contém hash de senha do admin e eventos: sensível; não versionar.
3. Rede, container (`postgres:16-alpine`) e volume novos, dedicados à prova, com senha aleatória não registrada. Restore com `scripts/restore.sh` (modo avulso) para o NOVO banco `analytics_restore_validation`.
4. Guardas, ambas com rc=1 e sem escrever: repetir o restore no banco já criado → `RECUSADO: ... já existe`; alvo = origem (`analytics_preview`) → `RECUSADO: o alvo é o banco de origem`.
5. Comparação com o mesmo script SQL na origem e no restaurado (diff vazio):

| Verificação | Origem = restaurado |
| --- | --- |
| `schema_migrations` | versões 1, 2 |
| `analytics_meta.data_revision` (`plante-uma-flor-lp`) | 6 |
| Linhas | events **9**, presence **2**, admins 1, admin_sessions 1, schema_migrations 2, meta 1 |
| Eventos por tipo | heartbeat 5, page_view 2, whatsapp_click 2 |
| Intervalo `received_at` dos eventos | 2026-10-13 03:38:24 → 15:30:53 UTC |
| Colunas por tabela | sessions 4, admins 3, events 21, meta 2, presence 10, migrations 2 |
| Índices em `public` | 10 |
| md5 de conteúdo (`events`, `presence`, `admins`, `meta`, `schema_migrations`) | `5f5d53e4…`, `a4ff3002…`, `6c3ba3a9…`, `e8843ce2…`, `b2595e9d…` |
| md5 do schema e das definições de índice | `c442c577…`, `79c87270…` |
| Após `docker restart` do container restaurado | inventário e fingerprints idênticos |

6. **API sobre o banco restaurado.** Imagem reconstruída do código atual com `RELEASE_SHA=cb15d96cf608a1bd051bd4de9b82fe76b71e7d7c` (HEAD; `server/` e `shared/` ainda não commitados, então o SHA não identifica sozinho o código construído). Container na rede dedicada (não a do Gestor), `NODE_ENV=production`, `ANALYTICS_SECURE_COOKIE=true`, origins `https://example.invalid`, `DATABASE_URL` do banco restaurado, porta de host aleatória em 127.0.0.1, `--read-only`, `--cap-drop ALL`, `no-new-privileges`, usuário `node`. Resultado:
   - healthcheck do container `healthy` (RestartCount 0), sem logs de erro;
   - `GET /health` → 200 `{"ok":true,"release":"cb15d96c…e7d7c","schema":1}`;
   - `GET /health/ready` → 200 com `data_revision` 6.
   - Sem login nem consulta a `/admin/*`. O restaurado permaneceu idêntico depois da API.
7. Limpeza: removidos somente containers, volume, rede e imagem criados por esta prova (verificado: nada remanescente). Ficaram apenas o dump e seu `.sha256`, modo 600, em `/tmp/opencode`.

**Limites da evidência:** volume pequeno (9 eventos); sem dump grande nem carga. Sem login/CSRF/SSE e sem ingestão `/collect` contra o restaurado. Sem criptografia, rotação ou cópia fora da máquina. A rodada anterior (banco sem eventos) foi substituída por esta.

### 6.2 Scripts

```bash
infra/analytics/scripts/backup.sh          # serviço `postgres` do compose local
infra/analytics/scripts/restore.sh <dump>  # serviço `postgres-restore`, banco analytics_restore
```

`backup.sh` gera `analytics-<UTC>.dump` + `.sha256` em `$ANALYTICS_BACKUP_DIR` (padrão `~/.local/state/landing-analytics/backups`, 0700/0600) e valida com `pg_restore -l`. Não criptografa; a política de produção (doc 02 §11.1) segue pendente. Sem rotação.

`restore.sh` recusa (antes de qualquer escrita) alvo igual à origem (mesmo `system_identifier` **e** mesmo nome de banco), banco alvo já existente (nunca faz DROP) e checksum divergente. Modo avulso, para containers existentes sem compose:

```bash
RESTORE_SOURCE_CONTAINER=<origem> RESTORE_TARGET_CONTAINER=<alvo descartável> \
ANALYTICS_SOURCE_DB=<banco origem> ANALYTICS_POSTGRES_USER=<usuário> RESTORE_DB=<novo banco> \
  infra/analytics/scripts/restore.sh <dump>
```

Validação pós-restore ainda manual (doc 02 §11.3): ingestão sintética isolada, login, `/health/ready` apontando a API para o banco restaurado, retenção. Promover o banco restaurado é decisão manual. Rollback de imagem não é restauração de banco.

## 7. Deploy planejado (não executado; remoto bloqueado)

Para cada release, **mesmo SHA** (40 hex) no backend e no frontend:

1. Validar (types, lint, testes, build) e gerar a imagem `landing-analytics-api:<sha>` (`docker build -f infra/analytics/Dockerfile --build-arg RELEASE_SHA=<sha> .`) e o `dist/` do frontend a partir do mesmo SHA; guardar manifesto/digest.
2. Backup do banco imediatamente antes de migrar.
3. Rodar `migrate` (migrações retrocompatíveis com a versão anterior da aplicação; expandir → migrar dados → retirar, doc 02 §12.4).
4. Publicar o **backend** e aguardar `/health/ready` 200 **e** `release` esperado em `/health`.
5. Só então publicar o **frontend** (FTPS) com o mesmo SHA. Backend não pronto → frontend não é publicado.
6. Verificação pós-deploy: ingestão sintética, login, painel, SSE por proxy.

Rollback: **sem down migrations**. Reimplantar a imagem e o `dist/` anteriores; o esquema permanece. Restaurar banco só em incidente de dados, aceitando perda desde o backup (RPO alvo 24 h, não medido).

Desligamento: `stop_grace_period` de 30 s no compose; `main.ts` chama `app.close()` em SIGINT/SIGTERM. Se readiness fica indisponível durante o drain e como os streams SSE são encerrados deve ser confirmado com o backend (doc 02 §10.3).

## 8. Proxy e HTTPS (documental, bloqueado)

`nginx/analytics-api.conf.example` (TLS) e `analytics-api.local.conf.example` (HTTP local 8080 → 8788) usam marcadores (`*.example.invalid`, caminhos de certificado). Não validados com `nginx -t`; TLS/DNS/certificado dependem do inventário da VPS. O template define `/collect` ≤ 32 KiB sem gzip, `/admin/stream` sem buffering e timeout > 15 s, `/health/ready` restrito a loopback/monitor.

**Pendência (trust proxy):** o servidor roda com `trustProxy: false`. Atrás de proxy, `req.ip` é o IP do proxy, então os limites por IP (coleta, login, leitura) **agregam todos os clientes num único contador**. Os cabeçalhos `X-Forwarded-*` do template são ignorados pela aplicação. Decidir e configurar em produção, depois do inventário, um `trustProxy` restrito (IP/rede do proxy real). Não usar `trustProxy: true` irrestrito e não foi inventado aqui um valor. Até lá, tratar os limites por IP como globais e manter o limite de borda do nginx.

## 9. Ambiguidades e pendências

1. **Trust proxy** (§8): configuração de produção pendente; `trustProxy` está fixo em `false`, sem variável de ambiente no contrato.
2. **Reabilitar admin**: a CLI não tem `enable`; `reset` não limpa `disabled`. Hoje só por SQL manual. Confirmar com o backend se `reset` deve reabilitar ou se falta `enable`.
3. **Cookie `Path=/admin`** e `SameSite=Strict`: divergem do doc 02 §8.1 (`__Secure-puf_admin`, `SameSite=Lax`). Confirmar qual vale; o doc 02 precisa ser reconciliado pelo seu dono.
4. **SHA da imagem**: `server/` e `shared/` não estão commitados; `RELEASE_SHA=HEAD` não identifica o código construído. Refazer build e smoke com o SHA final após o commit.
5. **Compose `admin`/`migrate`** exigem todas as variáveis do §3 mesmo que a CLI só use `DATABASE_URL` (simplicidade; sem default de produção).
6. **Ordem do SIGTERM**: `main.ts` não marca readiness indisponível antes de fechar; confirmar com backend se o drain é aceitável (doc 02 §10.3).
7. **Dependências**: `npm ci --omit=dev --ignore-scripts` exige que `fastify`, `pg` e o que o servidor importar estejam em `dependencies`. O servidor deve manter só sintaxe TS apagável e imports `.ts`; type stripping não vale dentro de `node_modules`.
8. **Segredo `ADMIN_SESSION_SECRET`** do doc 02 §10.2 não existe: sessões opacas no banco e CSRF HMAC com chave efêmera.
9. **Backup real**: criptografia, destino fora da máquina/VPS e rotação não existem; restauração com volume real de eventos não foi exercitada.
