# Tracking — Landing Page e LPs de Anúncio

Fonte única de verdade sobre rastreamento de conversão. Substitui `TRACKING_FLUXO.md`,
`README.md` (que era na prática um cookbook de tracking) e `.claude/data-flow-anuncio.md`
(desatualizado). Fatos abaixo conferidos direto em `src/lib/tracking.ts`,
`src/lib/attribution.ts` e `index.html` em 2026-08-23.

## 1) Arquitetura atual

- **Google** — só via GTM. Eventos vão para `window.dataLayer`, container `GTM-KCRTLDV4`.
  GA4 e Google Ads **não estão no código-fonte**: qualquer tag `G-…`/`GT-…`/`AW-…` vive
  dentro do contêiner do GTM e é editada no painel do GTM, não aqui. O mesmo vale para o
  CookieHub. Não procure esses IDs no repositório — não é sinal de que sumiram, é assim
  desde a migração para GTM.
- **Meta** — `fbq` disparado direto no frontend (Pixel ID `370300471997593`).
- **Leads internos** — `POST` para `https://planteumaflor.gestaoonline.app.br/api/leads/`
  (`LEADS_ENDPOINT` em `src/lib/tracking.ts:145`).

Resumo prático: Google = GTM · Meta = `fbq` no frontend · Leads internos = endpoint acima.

## 2) Scripts carregados no `index.html`

- Meta Pixel base + `fbq("track", "PageView", ..., { eventID: window.__trackingIds.pageview })`.
- Google Tag Manager (script no `<head>` + `noscript` no `<body>`).
- Fix de debug para visibilidade do Tag Assistant quando a query string tem `_dbg`/`gtm_debug`.

Nada além disso: sem UTMify, sem `gtag.js` direto, sem IDs `AW-`/`GT-` hard-coded.
(`dia-das-maes/index.html` e `dia-dos-namorados/index.html` carregam o mesmo par
Pixel+GTM, cada um em seu próprio documento HTML — nunca os dois juntos.)

Arquivos principais: `index.html`, `src/main.tsx`, `src/lib/tracking.ts`,
`src/lib/attribution.ts`, `src/lib/whatsappModal.ts`.

## 3) Captura de atribuição (fbclid, gclid, UTMs)

Ao carregar o módulo `tracking.ts` (side effect no import, guardado por `typeof window`
porque o mesmo módulo roda no SSR em Node):

- `fbclid` e `gclid` da URL → `sessionStorage` (`fbclid`, `fbclid_ts`, `gclid`).
- UTMs da URL → `sessionStorage`, via `captureUtmsFromUrl()` em `src/lib/attribution.ts`.
- `session_first_landing_url`, `session_referrer`, `session_start_ts` → gravados uma única
  vez, no primeiro hit da sessão (aba).

**Regra de atribuição** (`attribution.ts`): a URL do clique atual sempre vence;
`sessionStorage` é só fallback dentro da mesma aba. Por quê `sessionStorage` e não
`localStorage`: evita que uma visita orgânica futura herde uma campanha paga antiga, e
funciona igual em webview do Instagram/Facebook (storage já é efêmero por aba lá).

**Guarda "Frankenstein UTM"**: quando qualquer UTM nova chega na URL, as 5 chaves
(`utm_source/medium/campaign/content/term`) são limpas *antes* de gravar as novas — evita
misturar `utm_content`/`utm_term` de uma campanha antiga com a campanha nova.

`fbp`/`fbc` vêm dos cookies `_fbp`/`_fbc`; se o cookie `_fbc` não existir, é reconstruído a
partir do `fbclid` + timestamp salvos no `sessionStorage`.

## 4) Fluxo de envio de dados (fim a fim)

### 4.1 Ao carregar a página

1. `index.html` cria `window.__trackingIds.pageview` (ID único do pageview) e dispara
   `fbq("track", "PageView", ..., { eventID })`.
2. `src/main.tsx` chama `trackPageView()`.
3. `trackPageView()` (em `tracking.ts`) envia `lp_page_view` para o `dataLayer` com o mesmo
   `event_id`, e `PageView` para o endpoint de leads.

### 4.2 Ao abrir o modal de WhatsApp

1. CTA chama `openWhatsAppModal(url, context)` (`whatsappModal.ts`).
2. O modal abre e dispara `trackWhatsAppModalOpen(...)`:
   - `whatsapp_modal_open` → `dataLayer`.
   - `fbq("trackCustom", "WhatsAppModalOpen")`.
   - `whatsapp_modal_open` → endpoint de leads.

### 4.3 Ao clicar para continuar no WhatsApp

1. Usuário preenche telefone no modal → salvo em `sessionStorage` (`lead_phone`).
2. `trackWhatsAppClick(payload)` roda:
   - `whatsapp_click` → `dataLayer`, com `event_id`, `cta_location`, `cta_label`,
     `destination_url` (trigger GTM: Custom Event `whatsapp_click`).
   - Meta `Lead` + `Contact`, mesmo `eventID`. `Contact` é **suprimido** por 4h por
     campanha (`localStorage: contact_dedup_ts` + `contact_dedup_campaign`), para não
     inflar o Pixel em recliques.
   - `whatsapp_click` → endpoint de leads.
3. Navegação para o WhatsApp **no mesmo tick do clique** (`openWhatsAppDestination` em
   `whatsappModal.ts`): tenta `window.open(url, "_blank")`; se o browser bloquear popup,
   cai para `window.location.assign(url)` na mesma aba.
4. Se o modal React ainda não estiver registrado (caso raro), `openWhatsAppModal` dispara
   o mesmo par `trackWhatsAppClick` + `openWhatsAppDestination` direto.

### 4.4 Ao clicar para ir ao catálogo/site externo

`trackSiteClick(...)`: `site_click` → `dataLayer`, `fbq("track", "ViewContent")`,
`site_click` → endpoint de leads.

### 4.5 Envio ao endpoint de leads

`postLead()` faz `fetch(LEADS_ENDPOINT, { keepalive: true, mode: "cors" })`; se não
confirmar em 1.5s, cai para `navigator.sendBeacon` como reserva — garante entrega mesmo
que a aba feche logo após o clique.

## 5) Eventos padrão e destinos

| Evento app | Google (GTM/dataLayer) | Meta (fbq) | Endpoint leads |
|---|---|---|---|
| PageView inicial | `lp_page_view` | `PageView` | `PageView` |
| Modal WhatsApp aberto | `whatsapp_modal_open` | `trackCustom: WhatsAppModalOpen` | `whatsapp_modal_open` |
| Clique WhatsApp (conversão) | `whatsapp_click` | `Lead` + `Contact` | `whatsapp_click` |
| Clique site/catálogo (conversão) | `site_click` | `ViewContent` | `site_click` |

**Não existe evento `purchase` disparado pela LP.** O funil dela termina em
`whatsapp_click`; a venda é fechada no WhatsApp e, se o pedido for concluído, na loja
(Nuvemshop) — outro domínio, outra medição. `whatsapp_click` é o único evento que
corresponde a um lead real, e é deduplicado por 4h dentro da mesma campanha.

Estágios de CRM (`lead_qualificado`, `lead_convertido`) **não existem no código** — não há
regra de negócio ou integração que os produza. Isso é intencional, não um bug: para
preenchê-los seria preciso primeiro definir, no atendimento do WhatsApp, o que qualifica
e o que converte um lead (ver [`cro/atendimento.md`](cro/atendimento.md)). O
`token_rastreio` (campo `wa_tracking_token`, enviado dentro da mensagem do WhatsApp) já
existe para costurar o lead do site com a conversa.

## 6) Campos enviados no payload

Comuns a todos os eventos (quando disponíveis):

```
event, event_id, timestamp, url, referrer
first_landing_url, session_referrer, session_start_ts
fbclid, gclid, fbp, fbc
utm_source, utm_medium, utm_campaign, utm_content, utm_term
src, sck
```

> `src`/`sck` são campos legados de UTMify que o payload ainda envia por compatibilidade
> com o backend de leads, mas nenhum script os popula hoje (não há UTMify carregado) — na
> prática chegam vazios, a não ser que outra integração volte a escrevê-los.

Eventos de clique adicionam:

```
cta_location, cta_label, destination_url
phone            → só após o modal (whatsapp_click)
```

Campos exclusivos das LPs de anúncio (`ad-lps`) no `whatsapp_click`:

```
lp_slug, product_id, product_name, product_price
delivery_intent, price_range_key, price_range_label
meta_event_name ("Contact"), lead_stage ("whatsapp_click")
meta_event_id_contact, capi_event_id   → == event_id, chave pronta para CAPI server-side
token_rastreio, status ("pendente_whatsapp")
```

## 7) Onde os eventos são disparados na UI

**Landing principal (home)**

CTAs de WhatsApp: Hero (`falar_no_whatsapp`) · Navbar mobile (`falar_no_whatsapp`) ·
Footer ícone WhatsApp (`icone_whatsapp`) · WhatsApp FAB (`floating_button`) · dentro do
modal (`continuar_no_whatsapp`).

CTAs de site/catálogo: Hero (`ver_catalogo`) · Navbar desktop/mobile (`ver_catalogo`) ·
Categorias (`ver_no_site`) · Why Choose (`conheca_nosso_catalogo`) · Final CTA
(`acessar_o_site`) · Footer (`link_site`).

`cta_location` possíveis: `hero`, `navbar_desktop`, `navbar_mobile`, `categorias`,
`why_choose`, `final_cta`, `footer`, `whatsapp_fab`, `whatsapp_modal`.

**LPs de anúncio (`ad-lps`)**

`cta_location` possíveis: `hero`, `vitrine`, `faq`, `sticky`, `como_funciona`, `final`,
`guarantee`.

`cta_label` possíveis:
- `produto_whatsapp` — cards de produto (inclui `product_id`/`product_name`/`product_price`).
- `hero_whatsapp`, `sticky_whatsapp` etc. — CTAs genéricos que abrem o seletor de faixa de
  preço.
- `hero_guided_whatsapp` — botão secundário "Pedir ajuda no WhatsApp" (ex.: `/reconciliacao`).

## 8) Cookbook — "Quero rastrear..."

**Toda ida ao WhatsApp com o número completo** → `destination_url` contém `wa.me`, evento
`whatsapp_click`.
```
GTM → Trigger: Custom Event = whatsapp_click
GTM → Variável: {{DLV - destination_url}}
```

**Só quem abriu o modal (ainda não clicou)** → evento `whatsapp_modal_open`.

**Cliques para o site/catálogo** → evento `site_click` (Meta: `ViewContent`, já automático).

**Qual botão específico foi clicado** → `cta_label` (ver seção 7).
```
GTM → Variável: {{DLV - cta_label}}
```

**De qual seção da página veio o clique** → `cta_location` (ver seção 7).
```
GTM → Variável: {{DLV - cta_location}}
```

**Origem de campanha** → `utm_source`/`utm_campaign` (Leads endpoint), `fbclid` presente =
veio de anúncio Meta, `gclid` presente = veio de anúncio Google.

**Telefone digitado** → campo `phone`, só em `whatsapp_click` após o modal.

**Primeira URL de entrada do usuário** → `first_landing_url` (fixo desde a primeira visita
da sessão, não muda com a navegação).

**Site externo de origem** → `session_referrer` (capturado na primeira visita da sessão).

**Cruzar o mesmo evento entre GTM, Meta e o backend** → `event_id`, gerado uma vez por
clique e enviado aos três destinos (no Meta: `eventID`, usado para deduplicação
server-side).

**Melhorar o match de atribuição do Meta** → `fbp`/`fbc`, enviados automaticamente ao
endpoint e ao Pixel; usar no seu servidor para a Conversions API.

## 9) Configurar variável no GTM

```
Variable Type: Data Layer Variable
Data Layer Variable Name: cta_location   ← troque pelo campo desejado
Data Layer Version: Version 2
```

## 10) Regras operacionais e checklist

- Manter Google 100% via GTM — não reintroduzir `gtag()` hard-coded para os mesmos eventos.
- Manter Meta no código nesta fase.
- Em GA4, manter `lp_page_view` como evento analítico e marcar conversão apenas em
  `whatsapp_click` e `site_click`.
- Sempre validar no GTM Preview + GA4 DebugView + Meta Pixel Helper após qualquer mudança.

Checklist rápido após mudança:

- [ ] `lp_page_view` aparece 1x no GTM Preview ao carregar.
- [ ] `whatsapp_modal_open` aparece ao abrir o modal.
- [ ] `whatsapp_click` aparece 1x ao confirmar no modal (com `phone` preenchido).
- [ ] `site_click` aparece ao clicar em catálogo.
- [ ] Meta Pixel Helper mostra `PageView`, `Lead`, `Contact`, `ViewContent`.
- [ ] Network tab mostra `POST` para `planteumaflor.gestaoonline.app.br/api/leads/` com o
      payload e o `event` corretos.

## Histórico de correções

- **2026-08-03** — confirmado (via leitura do código) que GA4/Google Ads não estão mais
  hard-coded no `index.html`; migraram para dentro do contêiner GTM. Documentos antigos
  (`AGENTS.md`, `.claude/data-flow-anuncio.md`, agora removidos/corrigidos) ainda
  descreviam UTMify + `gtag.js` direto — isso não reflete o código desde a migração para
  GTM.
