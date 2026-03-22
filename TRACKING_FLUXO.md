# Documentacao de Tracking - Landing Page (Bloom Bridge)

Ultima atualizacao: 2026-03-21

## 1) Arquitetura atual

- Google: eventos enviados via `dataLayer` para o container GTM `GTM-KCRTLDV4`.
- Meta: eventos enviados via `fbq` no codigo (Pixel ID `370300471997593`).
- Backend de leads: eventos enviados para `https://gestaopedidos.planteumaflor.online/api/leads/`.
- Nao existe mais `gtag.js` hardcoded para Google Ads/GA4 no HTML.

Resumo pratico:
- Google = GTM.
- Meta = fbq no frontend.
- Leads internos = endpoint `gestaopedidos`.

## 2) Scripts carregados na pagina

No `index.html`:
- Meta Pixel base + `fbq("track", "PageView")`.
- Google Tag Manager (script no `<head>` e `noscript` no `<body>`).
- Fix de debug para visibilidade do Tag Assistant quando query string tem `_dbg` ou `gtm_debug`.

Arquivos principais:
- `index.html`
- `src/main.tsx`
- `src/lib/tracking.ts`

## 3) Fluxo de envio de dados (fim a fim)

## 3.1) Ao carregar a pagina

1. `index.html` cria `window.__trackingIds.pageview` (ID unico do pageview).
2. `index.html` dispara `fbq("track", "PageView", ..., { eventID })`.
3. `src/main.tsx` chama `trackPageView()`.
4. `trackPageView()` (em `src/lib/tracking.ts`):
   - envia `lp_page_view` para `dataLayer` com `event_id`.
   - envia `PageView` para o endpoint de leads com o mesmo `event_id`.

## 3.2) Ao abrir modal de WhatsApp

1. CTA chama `openWhatsAppModal(url, context)`.
2. Se o modal estiver registrado, ele abre e dispara `trackWhatsAppModalOpen(...)`.
3. `trackWhatsAppModalOpen(...)`:
   - envia `whatsapp_modal_open` para `dataLayer`.
   - envia `fbq("trackCustom", "WhatsAppModalOpen")`.
   - envia `whatsapp_modal_open` para o endpoint de leads.

## 3.3) Ao clicar para continuar no WhatsApp

1. Usuario preenche telefone no modal.
2. Telefone e salvo em `sessionStorage` (`lead_phone`).
3. `trackWhatsAppClick(payload, { eventCallback })` e executado:
   - envia `whatsapp_click` para `dataLayer` com `event_id`, `cta_location`, `cta_label`, `destination_url`.
   - envia Meta `Lead` e `Contact` com o mesmo `eventID`.
   - envia `whatsapp_click` para o endpoint de leads.
4. Navegacao para WhatsApp:
   - abre popup `about:blank` imediatamente.
   - a URL final e aplicada no `event_callback` (ou fallback por timeout de 1200ms).
   - objetivo: reduzir perda de conversao em clique com redirecionamento externo.

## 3.4) Ao clicar para ir ao catalogo/site externo

1. CTAs de catalogo chamam `trackSiteClick(...)`.
2. `trackSiteClick(...)`:
   - envia `site_click` para `dataLayer`.
   - envia `fbq("track", "ViewContent")`.
   - envia `site_click` para o endpoint de leads.

## 4) Eventos padrao e destinos

| Evento app | Google (GTM/dataLayer) | Meta (fbq) | Endpoint leads |
|---|---|---|---|
| PageView inicial | `lp_page_view` | `PageView` | `PageView` |
| Modal WhatsApp aberto | `whatsapp_modal_open` | `trackCustom: WhatsAppModalOpen` | `whatsapp_modal_open` |
| Clique WhatsApp (conversao) | `whatsapp_click` | `Lead` + `Contact` | `whatsapp_click` |
| Clique site/catalogo (conversao) | `site_click` | `ViewContent` | `site_click` |

## 5) Campos enviados no payload

Campos comuns (quando disponiveis):
- `event`, `event_id`
- `url`, `referrer`
- `phone` (se capturado no modal)
- `fbclid`, `fbp`, `fbc`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- contexto do CTA (`cta_location`, `cta_label`, `destination_url`)

Observacao importante sobre UTM:
- O frontend le UTM do `localStorage`, mas hoje nao existe escrita dessas UTM no codigo atual.
- Se nenhum outro script escrever UTM em `localStorage`, esses campos irao vazios no endpoint de leads.

## 6) Onde os eventos sao disparados na UI

CTAs de WhatsApp:
- Hero (`falar_no_whatsapp`)
- Navbar mobile (`falar_no_whatsapp`)
- Footer icone WhatsApp (`icone_whatsapp`)
- WhatsApp FAB (`floating_button`)

CTAs de site/catalogo:
- Hero (`ver_catalogo`)
- Navbar desktop/mobile (`ver_catalogo`)
- Categorias (`ver_no_site`)
- Why Choose (`conheca_nosso_catalogo`)
- Final CTA (`acessar_o_site`)
- Footer (`link_site`)

## 7) Regras operacionais recomendadas

- Manter Google 100% via GTM (sem reintroduzir `gtag()` hardcoded para os mesmos eventos).
- Manter Meta no codigo nesta fase.
- Em GA4, manter `lp_page_view` como evento analitico e marcar conversao apenas:
  - `whatsapp_click`
  - `site_click`
- Sempre validar no GTM Preview + GA4 DebugView + Meta Pixel Helper apos mudancas.

## 8) Checklist rapido de verificacao

- `lp_page_view` aparece 1x por carregamento no debug.
- `whatsapp_modal_open` aparece ao abrir modal.
- `whatsapp_click` aparece 1x por clique em continuar.
- `site_click` aparece 1x por clique de catalogo.
- Meta `PageView`, `Lead`, `Contact`, `ViewContent` continuam ativos.
- Endpoint de leads recebe payload com `event` correto e contexto do CTA.

