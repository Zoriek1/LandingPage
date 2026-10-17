# Marco A — registro de execução local (A01–A13)

**Status honesto (13/10/2026):** código-fonte, backend, coletor e UI estão **implementados e com gates técnicos locais em PASS** (seção 6). **O Marco A completo continua bloqueado**: faltam VPS, DNS, TLS, CookieHub real e admin de produção (A11–A13), além de p95 e capacidade não medidos. **Não é produção pronta.** Escopo atual: produção bloqueada; **B/C não iniciados e não devem prosseguir** até o aceite do Marco A. As revisões independentes dos trechos fornecidos estão encerradas, com achados corrigidos; não equivalem a auditoria integral do diff. Specs de origem: [`01`](01-coleta-eventos-e-metricas.md), [`02`](02-api-banco-seguranca-e-deploy.md), [`03`](03-dashboard-produto-e-decisoes.md), [`04`](04-execucao-validacao-e-operacao.md). Tracking comercial atual: [`../../tracking.md`](../../tracking.md).

## 1. A01 — Inventário e decisões

| Item | Estado | Observação |
| --- | --- | --- |
| Runtime | Decidido (usuário) | Node 24 LTS, Fastify, `pg`, PostgreSQL 16 |
| Banco local | Docker funcional | Container `landing-analytics-local`, usuário/banco `analytics`, `127.0.0.1:55432`. Isolado dos serviços do Gestor (5432/5000). Senha **não** registrada aqui |
| Deploy atual do repositório | Comprovado | Só estático por FTPS (GitHub Actions → Hostinger) |
| Fluxo WhatsApp atual | Confirmado no código | Não há modal de captura de telefone. `openWhatsAppModal` é um helper: gera token, chama `trackWhatsAppClick`, abre o WhatsApp (`location.assign`). `docs/tracking.md` corrigido |
| Entradas com `trackPageView` | Confirmado | `src/main.tsx`, `features/ad-lps/entry-client.tsx`, `mothers-day/main.tsx`, `namorados/main.tsx`. `loja-fisica/main.ts` **não** chama PageView |
| Código legado | Confirmado | `src/features/mothers-day/` e `src/features/namorados/` não são prova de cobertura |
| CookieHub/GTM | **Pendente** | Sem integração no código; API de consentimento não verificada (sem acesso) |
| VPS, DNS, TLS, admin real | **Pendente** | Sem acesso |

### Divergências documentais encontradas
- `docs/tracking.md` descrevia modal, `whatsapp_modal_open`, `lead_phone`, `phone` e Meta `Lead`; nada disso existe no código. Corrigido.
- Em `/loja-fisica/` o clique de WhatsApp usa o mesmo helper (não "tracking direto").
- `Contact` e o POST em `/api/leads/` do `whatsapp_click` são suprimidos por 4 h/campanha; o `dataLayer` não. O clique comportamental do coletor novo conta sempre.
- O CI (`deploy.yml`) não roda `typecheck` (somente test, lint, build).

## 2. A02 — Contrato V1 (resumo; fonte: doc 01 §4/§6.1 e doc 02)

Código compartilhado: `shared/analytics-contract.ts` e `shared/analytics-fixtures.ts` (sem dependências, Node 24): 10 eventos A com schemas por tipo e contrato de ACK. Estão no working tree; **commit não é garantia de estado** — o estado confiável é o do SHA que vier a ser validado no gate final.

**Envelope** `POST /collect`, JSON: `schema_version: 1`, `project_id: "plante-uma-flor-lp"`, `batch_id` (UUID), `events[]` (1–50).

**Evento** (campos por evento, não por lote): `schema_version`, `event_id`, `event_type`, `occurred_at` (UTC), `session_id`, `tab_id`, `pageview_id`, `client_seq`, `release_sha`, `path` (canônico, sem query/fragmento/domínio, ≤200), opcionais `lp_slug`, `entry_type`, `device_class`, `attribution`, e `props` (allowlist por tipo).
- `attribution` **por evento**: `session_entry`, `current` (só `utm_source/medium/campaign` saneadas) e `referrer_host`. Nunca click IDs, cookies GA/Meta, `token_rastreio`, telefone ou texto.
- `consent` **por evento**: `analytics` = exatamente `granted`, `policy_version`, `scope_id` (UUID do ciclo), `collected_at`. Não prova validade jurídica.
- IDs relacionais UUID.

**Eventos A (doc 01 §6.1)**: `page_view`, `heartbeat`, `visibility_change`, `scroll_depth`, `cta_click`, `whatsapp_click`, `catalog_click`, `store_phone_click`, `store_directions_click`, `offer_variant_seen`. Desconhecidos são rejeitados. Eventos B (`section_view`, `product_view`, etc.) ficam fora.

**Limites**: lote ≤50 eventos e ≤32 KiB UTF-8; evento ≤4 KiB; estrutura JSON fechada por schema; flush 2 s; timeout 5 s; fila ≤100 eventos/128 KiB; TTL 10 min; 5 tentativas normais (inicial + 4) com backoff e jitter e IDs preservados. A redução por `413` não consome tentativas normais: reduz pela metade até um evento, que é descartado se continuar excessivo, sempre dentro do TTL. Heartbeat visível a cada 15 s; presença expira em 60 s. Limites implementados em janela fixa de um minuto: 60 requisições/IP, 300 eventos/sessão e 600 requisições globais; burst separado de 20 não implementado.

**ACK**: `200` só após commit, com resultado por item (`accepted`/`duplicate`/`rejected` + código enumerado) e `committed_at`. Duplicata equivalente não renova presença nem soma tempo; mesmo ID com conteúdo diferente = `ID_REUSE_MISMATCH`. Envelope inválido, lote excessivo ou IDs repetidos rejeitam o lote inteiro sem gravar. Erro de schema por item é parcial. Falha transacional não declara aceites. `400` sem retry, `403`, `413` (dividir/descartar), `415`, `422`, `429` (Retry-After), 5xx/timeout/rede com retry. `sendBeacon` e `response.ok` externo não são ACK.

**Consentimento**: antes do aceite, sem identidade, fila ou histórico. Aceite tardio abre o estado atual (`navigation_reason=consent_grant`), sem reconstruir o passado. Revogação interrompe sensores, limpa a fila e invalida o `scope_id`. Painel/admin nunca coletam.

**Sessão/tempo**: `session_id` por aba, renovado após 30 min sem atividade humana elegível (heartbeat, retry, animação e polling não contam). Sem `visitor_id` persistente. `page_view` por apresentação (SPA, bfcache e hidratação sem duplicar; SSR/prerender não emitem). Tempo ativo estimado = página visível com ação humana nos últimos 30 s, `performance.now()`, delta de heartbeat 0–15000 ms, somando só eventos únicos.

**SSE** (doc 02 §7): `GET /admin/stream?project_id=...` autenticado por cookie. Mensagens `ready` (release, revisão, hora do servidor) e `invalidate` (`data_revision`, hora); sem payload de eventos. O painel agrupa invalidações em 250–500 ms, consulta **snapshot novo a cada conexão/reconexão** e reconcilia a cada 30 s; em falha do stream, polling a 5 s com backoff.

**URLs propostas (não provisionadas)**: painel `https://lpb.planteumaflor.com/admin/marketing/`, API `https://analytics-api.planteumaflor.com`.

### Painel (UI)
- **Agora** é um bloco separado do **Resumo do período**: usa sempre a presença atual (janela de 60 s) e não muda com o período escolhido.
- Unidades: **sessões/visitas observadas, não pessoas**. Cliques de WhatsApp, ligação e rota **não são conversas, atendimentos, visitas nem vendas**.
- "Tempo ativo" é **estimado** (aproximação de atenção), com cobertura visível; sessão não medida não vira zero. Mostrar frescor ("Atualizado em…") e estado da conexão.

## 3. Dependências e ownership

Ordem: **contrato compartilhado primeiro**, depois pacotes isolados.

| Owner | Escopo exclusivo |
| --- | --- |
| Contrato shared | `shared/` |
| Coletor | `src/analytics/` |
| Backend | `server/analytics/` |
| Painel | `src/dashboard/`, `admin/marketing/` |
| Infra | `infra/analytics/` (runbook/README é de outro worker) |
| Integração das entradas e helpers | entry points públicos, `src/lib/tracking.ts`, `whatsappModal.ts`, loja física |
| Integrador (arquivos de raiz) | `package.json`, lockfile, `tsconfig*`, `vite.config.ts`, `public/.htaccess`, workflow |

Dependências: backend/coletor/painel dependem do contrato; integração pública depende do coletor e do CMP; infra depende do inventário.

### Bloqueios de publicação
- Sem acesso a VPS, DNS, HTTPS/TLS, admin de produção e API do CookieHub: **não publicar**. Consentimento real fica por validar.
- Coletor **desligado por padrão** nas páginas públicas: `VITE_ANALYTICS_ENABLED` só liga com `'true'` (`src/analytics/collector.ts`) e o CI define `VITE_ANALYTICS_ENABLED: 'false'` explicitamente (`deploy.yml`).
- O coletor usa um **adaptador de consentimento explícito** (`src/analytics/consent.ts`); **nenhum CMP de produção está ligado**. Não há leitura do CookieHub.

### Cookie administrativo: proposto (doc 02 §8.1) vs. implementado
| Aspecto | Doc 02 (proposta) | Implementado (`server/analytics/auth.ts`) |
| --- | --- | --- |
| Nome | `__Secure-puf_admin` | `analytics_session` (token opaco, 43 caracteres base64url) |
| Path | `/admin/` | `/admin` |
| SameSite | `Lax` | `Strict` |
| Secure | sempre | condicional à configuração (`secure`); produção deve ligar |
| HttpOnly / host-only | sim / sim | HttpOnly sim; sem `Domain` (host-only) |

**Decisão local:** o cookie efetivo é `analytics_session` com `HttpOnly`, `SameSite=Strict`, `Path=/admin`, host-only, e `Secure` ligado por configuração; **`Secure` é obrigatório em produção** (e o doc 02 deve ser atualizado ou a implementação alinhada a ele). A implementação é mais restritiva em `SameSite`, mas não usa o prefixo `__Secure-` nem `Path=/admin/`. **Pendente para produção:** o cenário cross-subdomínio (painel `lpb.…` chamando a API `analytics-api.…`) não foi testado; com `SameSite=Strict` e hosts distintos, o comportamento do cookie precisa ser validado em HTTPS real antes de qualquer publicação. Nada disso foi homologado em HTTPS.

## 4. Backlog Marco A (doc 04 — A01–A13)

Estado em 13/10/2026. "Local" = código existe e passou nos gates da seção 6 em ambiente local; **não** significa aceito nem pronto para produção.

| ID | Trabalho | Estado |
| --- | --- | --- |
| A01 | Inventariar ambiente e diagnóstico do tracking | Parcial (local feito; VPS/CMP pendentes) |
| A02 | Contrato de eventos, ACK, sessão e métricas | Local concluído (`shared/`, 10 eventos, schemas e ACK) |
| A03 | Entrada Vite independente do dashboard | Local PASS (`admin/marketing`, `src/dashboard`; isolamentos 16/17/admin 5) |
| A04 | Consentimento e ciclo de sessão no coletor | Local PASS com adaptador explícito de teste; **CookieHub real não ligado nem validado** |
| A05 | Instrumentar navegação, scroll/tempo, CTAs e variantes | Local PASS; smoke de instrumentação nas 5 rotas (seção 6), **não** jornada comercial real |
| A06 | Transporte limitado, ACK e reenvio | Local PASS (testes do coletor); retry com ACK perdido em navegador não exercitado |
| A07 | Banco/migrações e ingestão transacional | Local PASS (PostgreSQL real; dedup e rollback) |
| A08 | Login/autorização administrativa | Local PASS (login, CSRF incl. Unicode→403); cookie diverge do doc 02 (seção 3) |
| A09 | Overview, histórico e sinalização SSE | Local PASS (12 testes de backend); snapshot após reconexão no navegador não exercitado |
| A10 | Tela operacional com estados reais | Local PASS; lacunas anteriores resolvidas (seção 7); revisão dos trechos encerrada |
| A11 | HTTPS, persistência, backup/restore | Parcial: backup/restore local validado; HTTPS e produção bloqueados |
| A12 | Release coordenada | Bloqueada (sem infra) |
| A13 | Validação real | Bloqueada (VPS, DNS, HTTPS, CookieHub e admin de produção) |

**Gates técnicos locais: PASS** (`npm run check:build` completo, seção 6). **Gate do Marco A completo: BLOQUEADO** por A11–A13, validação em ambiente real, p95 e capacidade.

**Gate para B/C**: só começam depois de Marco A validado. Critérios do aceite: jornada consentida → evento → PostgreSQL → consulta autenticada → painel; `npm run check` e `npm run check:build`; SHA comum; migração compatível; backend saudável antes do FTPS; rollback sem apagar dados; backup restaurado; nada consultável sem login; revogação interrompe a coleta; API indisponível não bloqueia CTA; bundle da landing sem painel e painel sem trackers. p95 ≤5 s é meta, não SLA.

## 5. Risco de regressão a vigiar
- Duplicar `page_view` (main + router + Strict Mode + hidratação).
- Quebrar o fluxo comercial (`trackWhatsAppClick`, `trackSiteClick`, dedup de 4 h, token).
- Analytics bloqueando CTA, link, telefone ou rota (especialmente `/loja-fisica/`).
- SSR/prerender tocando `window`/storage.
- `.htaccess` (fallback SPA) engolindo `/admin/`.
- Entradas duplicadas para `dia-das-maes`/`dia-dos-namorados` (SPA/prerender vs. entrada própria): definir o `path` canônico.
- Peso do bundle das LPs (`inspect:ad-bundle`) e regra de tokens do design system.

## 6. Evidências

Registradas em 13/10/2026 (execução de `npm run check:build`, sessão de shell `sh_136003d2a001NWyq4nkNjpsEKw`). Nenhum PASS abaixo equivale a aceite do Marco A.

### 6.1. Gates técnicos locais

| Verificação | Resultado |
| --- | --- |
| `npm run check:build` completo | **PASS** |
| Typecheck (inclui backend) | PASS |
| Lint | 0 erros, 7 warnings preexistentes (primitivas) |
| Testes de frontend | 51 arquivos, 403 testes PASS |
| Backend (PostgreSQL real) | 12 testes PASS, incluindo campanha, ações, scroll com primeiro toque significativo, dedup e denominador de reload |
| Coletor + dashboard, após revisão | 32 testes do coletor + 9 do dashboard = **41 PASS**; incluem as duas regressões novas após o gate global de 403. Hidratações (7) com teardown corrigido |
| Vite | 2236 módulos + SSR 82 módulos |
| Prerender | 15 páginas |
| `test:dist` | 4 testes PASS |
| Isolamento de bundle | public 16 / client 17 / admin 5 PASS |
| Testes de `inspect-ad-bundle` | 14 PASS |

O histórico de falha anterior da suíte global (timeouts de concorrência e fixtures) foi **corrigido**. Após o gate global de 403 testes, foram corrigidos os dois achados finais e acrescentadas duas regressões: reexecutados typecheck/lint, os 41 testes das áreas afetadas, build/prerender, 4 testes de dist e isolamento de bundles, todos em PASS. `git diff --check` também passou. A suíte global de 403 é a evidência anterior aos dois ajustes, não uma alegação de execução global de 405 testes.

### 6.2. Navegador, banco e backup

| Verificação | Evidência | Resultado |
| --- | --- | --- |
| Playwright, 5 rotas: `/`, `/lirios-apt?oferta=lirio`, `/dia-das-maes/`, `/dia-dos-namorados/`, `/loja-fisica/` | Contexto novo por rota, consentimento explícito: `unknown` → sem chaves analytics → `grant` → `page_view` + `heartbeat` + clique sintético de CTA → flush com ACK `true` → `denied` sem chaves | PASS local — **smoke de instrumentação, não jornada comercial real** |
| Variante | Presente nas rotas sazonais; na rota genérica a query foi consultada, mas a emissão posterior **não foi provada** | parcial |
| Painel (390 e 1440 px) | Capturas após as novas seções: sem overflow horizontal, fonte Jost, sem alertas, 7 headings | PASS local |
| Backup/restore | Ponto no tempo: banco `analytics_preview` com 9 eventos, revisão 6; conteúdo, schema e índices idênticos após restore e restart; imagem da API saudável (health/ready 200) | PASS local; **prova válida mas antiga — o banco do navegador cresceu depois**; não é backup de produção |
| Jornada anterior consentida → PostgreSQL → painel | Adaptador local: grant com ACK e fila vazia; painel 2 visitas, 2 sessões, 2 WhatsApp | PASS local |

### 6.3. Revisões

- **Backend (encerrada):** corrigidos CSRF Unicode (403), desempate de presença que preserva `hidden` e corrida de revisão no SSE; regressões incluídas nos testes PostgreSQL.
- **Coletor e UI (rechecagem encerrada):** corrigidos os dois achados dos trechos revisados: divisão de lote após `413` não consome tentativas normais, e troca de sessão reinicia a revisão do painel. O revisor confirmou as correções. As regressões de divisões sucessivas até um evento e de nova sessão com revisão menor passaram na execução final de 41 testes. A revisão foi limitada aos trechos fornecidos, não uma aprovação integral de todo o diff.
- Cursor usa horizonte `as_of` e chave `(received_at,event_id)`, vinculado aos filtros. Deriva de fronteira por transações em voo é **aceita como MVP** (doc 02); não é snapshot de exportação.
- Capturas locais em `/tmp/opencode/analytics-{mobile,desktop}-final.png` (efêmeras).
- O SHA do HEAD identifica a base, não este working tree. Publicação exige artefatos construídos do commit final e o mesmo SHA em backend e frontend.

### 6.4. Ainda não exercitado ou bloqueado

| Item | Estado |
| --- | --- |
| SPA, reload e bfcache sem views duplicadas em navegador | não exercitado |
| Presença e tempo com múltiplas abas | não exercitado |
| API indisponível em navegador (CTA não bloqueia) e WhatsApp repetido | não exercitado |
| Retry com ACK perdido em navegador | não exercitado |
| Painel vazio e dados atrasados em navegador | não exercitado |
| Ausência de dados sensíveis nos payloads (auditoria dedicada) | não exercitado |
| Famílias completas: home, LP genérica com variante emitida, sazonais, loja física em jornada real | não provado |
| p95 persistência→painel (meta ≤5 s) | **não medido** |
| Capacidade, carga e rate-limit global | **não comprovados** |
| CookieHub/GTM real | bloqueado (sem acesso) |
| VPS, DNS, HTTPS, admin de produção, deploy e restart em ambiente real | bloqueado (sem acesso) |

## 7. Lacunas anteriores da UI — resolvidas

Listadas antes como lacunas frente ao plano consolidado; agora implementadas e cobertas pelos gates locais:

| Lacuna anterior | Estado |
| --- | --- |
| Ranking de campanhas | Resolvido |
| Ações (cliques por CTA/ação) | Resolvido |
| Taxas de scroll | Resolvido |
| Série temporal | Resolvido (15 buckets) |
| Ranking com clique que aplica filtro | Resolvido |
| Frescor | Resolvido: janela, `generated_at`, `last_received_at` e cobertura exibidos |

Permanecem as pendências da seção 6.4 e o bloqueio de produção. O Marco A só pode ser declarado concluído após ambiente real, CookieHub real, p95, capacidade e a revisão final de coletor e UI. **Produção completa não deve ser afirmada.**
