# Plante Uma Flor — Landing Page

Guia prático de tracking para quem configura GTM, Meta, ou analisa os dados de leads.

---

## Arquitetura em uma linha

```
Ação do usuário → app dispara evento → dataLayer (GTM) + fbq (Meta) + endpoint de leads
```

Cada clique gera um `event_id` único compartilhado entre os três destinos. Isso permite reconciliar o mesmo evento no GA4, no Meta e no seu backend.

---

## Cookbook — "Quero rastrear..."

### Cliques e conversões

---

**Quero rastrear toda ida ao WhatsApp com o número completo**

Use `destination_url` contém `wa.me`
- Evento: `whatsapp_click`
- Campo: `destination_url` → ex: `https://wa.me/+5562996503403?text=...`

```
GTM → Trigger: Custom Event = whatsapp_click
GTM → Variável: {{DLV - destination_url}}
```

---

**Quero rastrear apenas quem abriu o modal (não clicou ainda)**

Use evento `whatsapp_modal_open`

```
GTM → Trigger: Custom Event = whatsapp_modal_open
Meta → evento customizado WhatsAppModalOpen (já disparado automaticamente)
```

---

**Quero rastrear cliques para o site / catálogo**

Use evento `site_click`

```
GTM → Trigger: Custom Event = site_click
Meta → evento ViewContent (já disparado automaticamente)
```

---

**Quero saber qual botão específico o usuário clicou**

Use `cta_label`

| `cta_label` | O que é |
|---|---|
| `falar_no_whatsapp` | Botão WhatsApp do Hero e Navbar mobile |
| `ver_catalogo` | Botão catálogo do Hero e Navbar |
| `floating_button` | Botão flutuante de WhatsApp |
| `icone_whatsapp` | Ícone do WhatsApp no Footer |
| `link_site` | Link do site no Footer |
| `ver_no_site` | CTA da seção de Categorias |
| `conheca_nosso_catalogo` | CTA da seção Why Choose |
| `acessar_o_site` | CTA da seção Final |
| `continuar_no_whatsapp` | Botão de confirmar no modal |

```
GTM → Variável: {{DLV - cta_label}}
Filtro: cta_label equals floating_button
```

---

**Quero saber de qual seção da página o clique veio**

Use `cta_location`

| `cta_location` | Onde fica |
|---|---|
| `hero` | Banner principal |
| `navbar_desktop` | Menu topo (desktop) |
| `navbar_mobile` | Menu topo (mobile) |
| `categorias` | Seção de categorias |
| `why_choose` | Seção "Por que nos escolher" |
| `final_cta` | Seção final de chamada |
| `footer` | Rodapé |
| `whatsapp_fab` | Botão flutuante fixo |
| `whatsapp_modal` | Dentro do modal de WhatsApp |

```
GTM → Variável: {{DLV - cta_location}}
Filtro: cta_location equals hero
```

---

### Origem de campanha

---

**Quero saber se o lead veio do Instagram**

Use `utm_source` = `instagram`

```
Leads endpoint → campo utm_source
GTM → Variável: {{DLV - utm_source}}
```

---

**Quero filtrar por campanha específica**

Use `utm_campaign` = nome da campanha

```
Leads endpoint → campo utm_campaign
```

---

**Quero saber se o lead veio de um anúncio do Facebook/Instagram (Ads)**

Use `fbclid` preenchido — só existe quando o usuário clicou em um anúncio Meta

```
Leads endpoint → campo fbclid (presente = veio de anúncio Meta)
```

---

**Quero saber se o lead veio de um anúncio do Google Ads**

Use `gclid` preenchido — só existe quando o usuário clicou em um anúncio Google

```
Leads endpoint → campo gclid (presente = veio de anúncio Google)
```

---

### Dados do lead

---

**Quero ver o número de telefone que o usuário digitou**

Use `phone` — preenchido após o usuário confirmar no modal

```
Leads endpoint → campo phone
Disponível apenas em: whatsapp_click (após o modal)
```

---

**Quero saber de qual URL o lead entrou no site pela primeira vez**

Use `first_landing_url` — salvo na primeira visita, não muda mesmo que o usuário navegue

```
Leads endpoint → campo first_landing_url
```

---

**Quero saber de qual site externo o usuário veio**

Use `session_referrer` — referrer capturado na primeira visita

```
Leads endpoint → campo session_referrer
Ex: https://www.instagram.com → veio do Instagram orgânico
```

---

**Quero saber o horário exato do evento**

Use `timestamp` — formato ISO 8601

```
Leads endpoint → campo timestamp
Ex: 2026-03-22T14:35:00.000Z
```

---

**Quero cruzar o mesmo evento entre GTM, Meta e meu backend**

Use `event_id` — gerado uma vez por clique, enviado para os três destinos

```
GTM → {{DLV - event_id}}
Meta → eventID (usado para deduplicação server-side)
Leads endpoint → campo event_id
```

---

### Atribuição Meta (Pixel)

---

**Quero melhorar o match de atribuição do Meta**

Os campos abaixo são enviados automaticamente ao endpoint e ao Pixel:

| Campo | O que é |
|---|---|
| `fbp` | ID do navegador do usuário (cookie `_fbp`) |
| `fbc` | ID do clique no anúncio (cookie `_fbc` ou construído do `fbclid`) |

```
Leads endpoint → campos fbp e fbc
Use no seu servidor para enviar via Conversions API
```

---

## Eventos × Destinos

| Evento | GTM / dataLayer | Meta (fbq) | Endpoint leads |
|---|---|---|---|
| Página carregou | `lp_page_view` | `PageView` | `PageView` |
| Modal WhatsApp abriu | `whatsapp_modal_open` | `WhatsAppModalOpen` (custom) | `whatsapp_modal_open` |
| Clique WhatsApp (conversão) | `whatsapp_click` | `Lead` + `Contact` | `whatsapp_click` |
| Clique catálogo/site | `site_click` | `ViewContent` | `site_click` |

---

## Campos disponíveis por evento

Todos os eventos incluem:

```
event              → nome do evento
event_id           → ID único (reconciliação entre sistemas)
timestamp          → data/hora ISO do disparo
url                → URL atual da página
referrer           → referrer da visita atual
first_landing_url  → URL da primeira visita do usuário
session_referrer   → referrer da primeira visita
session_start_ts   → timestamp da primeira visita (ms)
utm_source         → origem da campanha
utm_medium         → mídia da campanha
utm_campaign       → nome da campanha
utm_content        → conteúdo do anúncio
utm_term           → termo de busca
fbclid             → ID do clique Meta Ads (se vier de anúncio)
gclid              → ID do clique Google Ads (se vier de anúncio)
fbp                → ID do navegador Meta
fbc                → ID do clique Meta (cookie ou construído)
```

Eventos de clique adicionam:

```
cta_location       → seção da página onde o botão está
cta_label          → identificador do botão específico
destination_url    → URL de destino do clique
phone              → telefone digitado (só após modal)
```

---

## Configurar variável no GTM

Para usar qualquer campo acima no GTM, crie uma variável do tipo **Data Layer Variable**:

```
Variable Type: Data Layer Variable
Data Layer Variable Name: cta_location   ← troque pelo campo desejado
Data Layer Version: Version 2
```

---

## Checklist rápido após qualquer mudança

- [ ] `lp_page_view` aparece 1x no GTM Preview ao carregar
- [ ] `whatsapp_modal_open` aparece ao abrir o modal
- [ ] `whatsapp_click` aparece ao confirmar no modal (com `phone` preenchido)
- [ ] `site_click` aparece ao clicar em catálogo
- [ ] Meta Pixel Helper mostra `PageView`, `Lead`, `Contact`, `ViewContent`
- [ ] Network tab mostra POST para `gestaopedidos.planteumaflor.online/api/leads/` com payload correto
