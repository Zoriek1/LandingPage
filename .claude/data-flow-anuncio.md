# Fluxo de Dados — Usuário vindo de Anúncio

Simulação completa de uma pessoa que clicou em um anúncio do Facebook/Meta e converteu no WhatsApp.

---

## O Anúncio (ponto de partida)

O usuário vê um anúncio no Instagram e clica. O Facebook gera a URL de destino assim:

```
https://www.planteumaflor.com
  ?fbclid=IwAR3xK2mNpQrstUvWxYz...   ← Facebook Click ID (gerado pelo FB por clique)
  &utm_source=facebook
  &utm_medium=paid_social
  &utm_campaign=buques-romanticos
  &utm_content=video-buque-rosa
  &utm_term=flores+presente
```

---

## Fase 1 — Chegada na Página (Page Load)

```mermaid
sequenceDiagram
    participant URL as URL do Anúncio
    participant Browser as Browser
    participant HTML as index.html
    participant UTMify as UTMify Script
    participant FB as Meta Pixel Script
    participant GG as Google Ads Script
    participant SS as sessionStorage
    participant LS as localStorage

    URL->>Browser: Usuário clica no anúncio
    Browser->>HTML: GET /?fbclid=IwAR3...&utm_source=facebook...

    Note over HTML: Scripts carregam em paralelo

    HTML->>FB: fbq('init', '370300471997593')
    FB-->>FB: Cria cookie _fbp (browser fingerprint)
    FB-->>FB: Cria cookie _fbc (baseado no fbclid da URL)
    FB->>FB: fbq('track', 'PageView')
    Note over FB: Evento PageView enviado ao Facebook

    HTML->>UTMify: script utms/latest.js carrega
    UTMify->>LS: localStorage.setItem('utm_source', 'facebook')
    UTMify->>LS: localStorage.setItem('utm_medium', 'paid_social')
    UTMify->>LS: localStorage.setItem('utm_campaign', 'buques-romanticos')
    UTMify->>LS: localStorage.setItem('utm_content', 'video-buque-rosa')
    UTMify->>LS: localStorage.setItem('utm_term', 'flores+presente')
    UTMify->>LS: localStorage.setItem('src', 'facebook')
    UTMify->>LS: localStorage.setItem('sck', '...')

    HTML->>GG: gtag.js carrega (AW-11455088769 + GT-PJ5LRCW6)
    GG-->>GG: Registra sessão no Google Ads

    HTML->>Browser: React app monta (main.tsx)
    Browser->>SS: tracking.ts lê ?fbclid=IwAR3... da URL
    SS-->>SS: sessionStorage.setItem('fbclid', 'IwAR3xK2mN...')
```

### O que está armazenado após o page load:

| Storage | Chave | Valor | Origem |
|---------|-------|-------|--------|
| `sessionStorage` | `fbclid` | `IwAR3xK2mNpQrstUvWxYz...` | URL do anúncio |
| `localStorage` | `utm_source` | `facebook` | UTMify |
| `localStorage` | `utm_medium` | `paid_social` | UTMify |
| `localStorage` | `utm_campaign` | `buques-romanticos` | UTMify |
| `localStorage` | `utm_content` | `video-buque-rosa` | UTMify |
| `localStorage` | `utm_term` | `flores+presente` | UTMify |
| `localStorage` | `src` | `facebook` | UTMify |
| `cookie` | `_fbp` | `fb.1.1234567890.987654321` | Meta Pixel (gerado) |
| `cookie` | `_fbc` | `fb.1.1234567890.IwAR3xK2mN...` | Meta Pixel (do fbclid) |

---

## Fase 2 — Usuário navega e clica no WhatsApp

```mermaid
sequenceDiagram
    participant User as Usuário
    participant FAB as WhatsAppFAB.tsx
    participant Modal as whatsappModal.ts
    participant LeadModal as WhatsAppLeadModal.tsx
    participant SS as sessionStorage

    User->>FAB: Clica no botão flutuante verde
    FAB->>Modal: openWhatsAppModal(waUrl)
    Modal->>LeadModal: _show(waUrl) → setOpen(true)
    LeadModal-->>User: Modal aparece pedindo telefone

    User->>LeadModal: Digita "(62) 9 9999-1234" + clica "Continuar"
    LeadModal->>LeadModal: formatPhone → remove máscara → "62999991234"
    LeadModal->>SS: setLeadPhone("62999991234")
    SS-->>SS: sessionStorage.setItem('lead_phone', '62999991234')
```

---

## Fase 3 — Disparo de Tracking (o momento crítico)

```mermaid
sequenceDiagram
    participant LeadModal as WhatsAppLeadModal.tsx
    participant Track as tracking.ts
    participant SS as sessionStorage
    participant LS as localStorage
    participant Cookies as document.cookie
    participant FB as window.fbq (Meta Pixel)
    participant GG as window.gtag (Google Ads)
    participant API as API /api/leads/
    participant WA as WhatsApp (wa.me)

    LeadModal->>Track: trackWhatsAppClick()

    Note over Track: Coleta todos os dados disponíveis

    Track->>GG: gtag('event', 'conversion', {send_to: 'AW-11455088769'})
    GG-->>GG: Marca conversão no Google Ads ✓

    Track->>GG: gtag('event', 'whatsapp_click')
    GG-->>GG: Evento customizado registrado ✓

    Track->>SS: sessionStorage.getItem('fbclid')
    SS-->>Track: 'IwAR3xK2mNpQrstUvWxYz...'

    Track->>SS: sessionStorage.getItem('lead_phone')
    SS-->>Track: '62999991234'

    Track->>Cookies: document.cookie → extrai _fbp
    Cookies-->>Track: 'fb.1.1234567890.987654321'

    Track->>Cookies: document.cookie → extrai _fbc
    Cookies-->>Track: 'fb.1.1234567890.IwAR3xK2mN...'

    Track->>LS: getItem('utm_source', 'utm_medium', ...)
    LS-->>Track: { utm_source: 'facebook', utm_medium: 'paid_social', ... }

    Track->>API: POST /api/leads/ (fetch keepalive)
    Note over API: Payload completo (ver abaixo)
    API-->>Track: 200 OK (ou falha → sendBeacon fallback)

    LeadModal->>WA: window.open('https://wa.me/+5562996503403?text=...', '_blank')
```

---

## Payload Completo enviado à API

```json
{
  "event":        "whatsapp_click",
  "url":          "https://www.planteumaflor.com/?fbclid=IwAR3xK2mN...&utm_source=facebook&...",
  "referrer":     "https://www.instagram.com/",
  "fbclid":       "IwAR3xK2mNpQrstUvWxYz...",
  "fbp":          "fb.1.1234567890.987654321",
  "fbc":          "fb.1.1234567890.IwAR3xK2mNpQrstUvWxYz...",
  "phone":        "62999991234",
  "utm_source":   "facebook",
  "utm_medium":   "paid_social",
  "utm_campaign": "buques-romanticos",
  "utm_content":  "video-buque-rosa",
  "utm_term":     "flores+presente",
  "src":          "facebook",
  "sck":          "..."
}
```

---

## Grafo de Destinos dos Dados

```mermaid
flowchart TD
    AD[🎯 Anúncio Facebook/Instagram]

    AD -->|URL com parâmetros| PAGE[Landing Page]

    PAGE -->|fbclid extraído da URL| SS_FBCLID[sessionStorage\nfbclid]
    PAGE -->|script UTMify| LS_UTMS[localStorage\nutm_source / medium\ncampaign / content / term\nsrc / sck]
    PAGE -->|Meta Pixel init| COOKIES[Cookies do browser\n_fbp  _fbc]
    PAGE -->|fbq PageView| FB_PIXEL[Meta Pixel\n📊 Facebook Ads Manager\nPageView]

    USER[👤 Usuário clica WhatsApp]
    PAGE --> USER

    USER -->|openWhatsAppModal| MODAL[WhatsAppLeadModal]
    MODAL -->|phone digitado| SS_PHONE[sessionStorage\nlead_phone]

    MODAL -->|trackWhatsAppClick| TRACK[tracking.ts]

    SS_FBCLID -->|getFbclid| TRACK
    LS_UTMS -->|getUtmsFromStorage| TRACK
    COOKIES -->|getFbCookies| TRACK
    SS_PHONE -->|getPhone| TRACK

    TRACK -->|gtag conversion| GOOGLE_ADS[Google Ads\n📊 AW-11455088769\nConversão registrada]
    TRACK -->|gtag whatsapp_click| GOOGLE_ANALYTICS[Google Analytics\n📊 GT-PJ5LRCW6\nEvento customizado]
    TRACK -->|POST fetch / sendBeacon| LEADS_API[🗄️ API Interna\ngestaopedidos.planteumaflor.online\n/api/leads/]

    LEADS_API -->|Armazena lead completo| DB[(Database\nLead com telefone\n+ atribuição completa)]

    MODAL -->|window.open| WA[💬 WhatsApp\nwa.me/+5562996503403]
    USER --> WA

    style AD fill:#1877F2,color:#fff
    style FB_PIXEL fill:#1877F2,color:#fff
    style GOOGLE_ADS fill:#4285F4,color:#fff
    style GOOGLE_ANALYTICS fill:#4285F4,color:#fff
    style LEADS_API fill:#1a2e22,color:#fff
    style DB fill:#1a2e22,color:#fff
    style WA fill:#25D366,color:#fff
    style USER fill:#f5e6d3,color:#1a2e22
    style MODAL fill:#f5e6d3,color:#1a2e22
```

---

## Grafo de Origem de Cada Campo

```mermaid
flowchart LR
    subgraph ORIGEM["Origem dos dados"]
        URL_AD["URL do anúncio\n?fbclid=...&utm_source=..."]
        UTMIFY["UTMify Script\n(lê a URL e persiste)"]
        META_SCRIPT["Meta Pixel Script\n(cria cookies)"]
        USER_INPUT["Usuário digita\no telefone"]
        BROWSER_ENV["Browser\n(URL atual, referrer)"]
    end

    subgraph PAYLOAD["Payload → /api/leads/"]
        P_EVENT["event: 'whatsapp_click'"]
        P_URL["url: página atual"]
        P_REF["referrer: de onde veio"]
        P_FBCLID["fbclid: IwAR3..."]
        P_FBP["fbp: fb.1.xxx"]
        P_FBC["fbc: fb.1.xxx.IwAR3"]
        P_PHONE["phone: 62999991234"]
        P_UTM_S["utm_source: facebook"]
        P_UTM_M["utm_medium: paid_social"]
        P_UTM_C["utm_campaign: buques..."]
        P_UTM_CO["utm_content: video..."]
        P_UTM_T["utm_term: flores..."]
        P_SRC["src: facebook"]
        P_SCK["sck: ..."]
    end

    URL_AD --> P_FBCLID
    URL_AD --> P_UTM_S
    URL_AD --> P_UTM_M
    URL_AD --> P_UTM_C
    URL_AD --> P_UTM_CO
    URL_AD --> P_UTM_T

    UTMIFY --> P_SRC
    UTMIFY --> P_SCK

    META_SCRIPT --> P_FBP
    META_SCRIPT --> P_FBC

    USER_INPUT --> P_PHONE

    BROWSER_ENV --> P_EVENT
    BROWSER_ENV --> P_URL
    BROWSER_ENV --> P_REF
```

---

## Linha do Tempo (timeline)

```mermaid
gantt
    title Linha do tempo de um lead (t=0 = clique no anúncio)
    dateFormat  X
    axisFormat %ss

    section Page Load
    Usuário chega na página         :milestone, 0, 0
    UTMify salva UTMs no localStorage :active, 0, 1
    Meta Pixel cria cookies _fbp _fbc :active, 0, 1
    tracking.ts salva fbclid no sessionStorage :active, 0, 1
    fbq PageView enviado ao Facebook  :milestone, 1, 1

    section Engajamento
    Usuário rola a página            :2, 15
    Usuário clica no FAB WhatsApp    :milestone, 15, 15

    section Conversão
    Modal de captura abre            :15, 16
    Usuário digita telefone          :16, 25
    Usuário clica "Continuar"        :milestone, 25, 25
    phone salvo no sessionStorage    :25, 25
    trackWhatsAppClick() dispara     :25, 25
    gtag conversion → Google Ads     :25, 26
    POST /api/leads/ enviado         :25, 26
    WhatsApp abre em nova aba        :milestone, 26, 26
```

---

## Caso especial: Usuário clica "Só quero ver"

Se o usuário pular o modal sem digitar telefone:

```mermaid
flowchart TD
    SKIP[Clica 'Só quero ver, obrigado'] -->|proceed skip=true| TRACK[trackWhatsAppClick]
    TRACK -->|phone undefined| API[POST /api/leads/]
    API -->|Payload SEM campo phone| DB[(Lead incompleto\nmas com UTMs + fbclid\nrastreamento de atribuição mantido)]
    TRACK --> WA[WhatsApp abre normalmente]
```

O lead ainda é rastreado — apenas sem o telefone. Os dados de atribuição do anúncio (UTMs, fbclid, fbp, fbc) continuam sendo enviados.

---

## Evento "Ver Catálogo" (trackSiteClick)

Quando o usuário clica em "Ver Catálogo" em vez de WhatsApp:

```mermaid
flowchart LR
    BTN[Botão 'Ver Catálogo'\nNavbar / Hero / Footer]
    BTN --> TRACK[trackSiteClick]
    TRACK -->|fbq ViewContent| META[Meta Pixel\nViewContent]
    TRACK -->|gtag site_click| GOOGLE[Google Ads\nEvento customizado]
    TRACK -->|POST /api/leads/ event=site_click| API[API Interna]
    BTN --> SITE[planteumaflor.com\nSite principal]
```

---

## Resumo de Destinos

| Dado | sessionStorage | localStorage | Cookie | Meta Pixel | Google Ads | API /api/leads/ |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| `fbclid` | ✅ | | ✅ (_fbc) | | | ✅ |
| `utm_source/medium/...` | | ✅ | | | | ✅ |
| `_fbp` | | | ✅ | ✅ (gerado) | | ✅ |
| `_fbc` | | | ✅ | ✅ (gerado) | | ✅ |
| `phone` | ✅ | | | | | ✅ |
| `PageView` | | | | ✅ | | |
| `Contact` | | | | ✅ | | |
| `ViewContent` | | | | ✅ | | |
| Conversão WA | | | | | ✅ | ✅ |
| `src` / `sck` | | ✅ | | | | ✅ |

---

## Pontos de Atenção

**fbclid só vive na sessão** — se o usuário fechar e reabrir o browser, o `fbclid` some do `sessionStorage`. O cookie `_fbc` persiste mais tempo (gerado pelo Meta Pixel).

**UTMs vivem no localStorage** — sobrevivem a fechar/abrir o browser. Cuidado: uma segunda visita por outro canal pode sobrescrever as UTMs do anúncio original se o UTMify não tiver lógica de "first touch".

**fetch com fallback sendBeacon** — se o `fetch` falhar (conexão instável no mobile), o `sendBeacon` dispara. O `sendBeacon` não garante ordem de chegada, mas garante entrega mesmo após o browser fechar a aba.

**Dois listeners de clique WhatsApp no index.html** — um abre o link (trusted click), outro dispara o `fbq Contact`. São independentes do modal React.
