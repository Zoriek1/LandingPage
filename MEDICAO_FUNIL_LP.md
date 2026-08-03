# Medição do funil — LPs de anúncio (P3)

Levantamento feito a partir do código, em 03/08/2026. Cobre o que a landing
page **dispara**. O que acontece depois do `dataLayer` (tags do GTM, GA4,
Google Ads, CAPI) mora no contêiner `GTM-KCRTLDV4` e no backend, fora deste
repositório — os pontos que dependem disso estão marcados como **não
verificável aqui**.

## Onde cada camada é instalada

| Camada | Onde | Quantas vezes |
| --- | --- | ---: |
| Meta Pixel `370300471997593` | `index.html` (snippet inline) | 1 `init` + 1 `PageView` |
| Google Tag Manager `GTM-KCRTLDV4` | `index.html` (snippet inline + `noscript`) | 1 |
| GA4 / Google Ads | **não existem no código-fonte** — só podem estar como tags dentro do GTM | — |
| API de leads | `src/lib/tracking.ts` → `POST https://gestaopedidos.planteumaflor.online/api/leads/` | 1 por evento |

Não há instalação duplicada de Pixel nem de GTM no repositório: cada um aparece
uma única vez por documento HTML (`index.html`, `dia-das-maes/index.html`,
`dia-dos-namorados/index.html`, que são páginas distintas e nunca carregam
juntas). O `AGENTS.md`/`CLAUDE.md` afirma que Google Ads (`AW-11455088769`) e
GA4 (`GT-PJ5LRCW6`) estão no `index.html`; **isso está desatualizado** — eles
saíram do HTML e hoje só podem estar dentro do contêiner do GTM. Se o contêiner
também dispara um Meta Pixel próprio, aí sim haveria duplicidade de `PageView`
e de `Contact`; é o primeiro item a conferir no Tag Assistant.

## Tabela de eventos

| Evento | Gatilho | Origem técnica | Parâmetros enviados | Destino | Evento principal? | Deduplicação |
| --- | --- | --- | --- | --- | --- | --- |
| `PageView` (Meta) | carregamento do documento | `index.html`, inline | `eventID = window.__trackingIds.pageview` | Meta Pixel | definido no Gerenciador de Anúncios | `eventID` gerado no HTML e reaproveitado pelo lead `PageView` → serve de chave para a CAPI |
| `gtm.js` | carregamento do documento | `index.html`, inline | `gtm.start` | dataLayer → GTM | não | — |
| `lp_page_view` | `trackPageView()` no bootstrap do React | `src/main.tsx` → `src/lib/tracking.ts` | `event_id` (o mesmo `__trackingIds.pageview`) | dataLayer → GTM | **não verificável aqui** (depende do GTM/GA4) | mesmo `event_id` do `PageView` do Pixel |
| `PageView` (lead) | idem acima, na mesma chamada | `tracking.ts` → `sendLead()` | `event`, `event_id`, `timestamp`, `url`, `referrer`, `fbclid`, `gclid`, `fbp`, `fbc`, `utm_source/medium/campaign/content/term`, `src`, `sck`, `first_landing_url`, `session_referrer`, `session_start_ts` | API de leads (`sendBeacon`, com `fetch keepalive` de reserva) | — | `event_id` |
| `whatsapp_click` | clique em **qualquer** CTA de WhatsApp da LP (hero, vitrine, FAQ, sticky, como funciona, final, garantia) e na escolha de faixa de preço | `openAdLpWhatsApp()` → `openProductWhatsApp()`/`openPriceRangeWhatsApp()` → `whatsappModal.ts` → `trackWhatsAppClick()` | `event_id`, `meta_event_name: "Contact"`, `lead_stage: "whatsapp_click"`, `meta_event_id_contact`, `capi_event_id`, `lp_slug`, `cta_location`, `cta_label`, `product_id`, `product_name`, `product_price`, `delivery_intent`, `price_range_key/label`, `destination_url`, `token_rastreio`, `status: "pendente_whatsapp"` | dataLayer → GTM | **não verificável aqui** | `event_id` compartilhado com o Pixel e com a API (`meta_event_id_contact` = `capi_event_id` = `event_id`) |
| `Contact` (Meta) | idem `whatsapp_click` | `tracking.ts` → `fbq("track","Contact",{},{eventID})` | só `eventID` | Meta Pixel | definido no Gerenciador de Anúncios | `eventID`; além disso a chamada é **suprimida** por uma janela de 4 h por campanha (`localStorage: contact_dedup_ts` + `contact_dedup_campaign`) |
| `whatsapp_click` (lead) | idem, na mesma chamada | `tracking.ts` → `sendLead()` | tudo do `whatsapp_click` + os campos de atribuição do `PageView` | API de leads | — | mesma janela de 4 h + `event_id` |
| `site_click` | clique em link externo do rodapé de negócio | `BusinessFooter.tsx` → `trackSiteClick()` | `event_id` + payload do chamador | dataLayer → GTM | não | `event_id` |
| `ViewContent` (Meta) | idem `site_click` | `tracking.ts` | `eventID` | Meta Pixel | não | `eventID` |
| `site_click` (lead) | idem | `sendLead()` | idem `site_click` + atribuição | API de leads | — | `event_id` |
| `purchase` | **não existe na LP** | — | — | — | — | — |

Observações que mudam a leitura do relatório do GA4:

1. **Não existe `purchase` disparado por esta landing page.** O funil dela
   termina no `whatsapp_click`; a venda acontece no WhatsApp e, quando o
   pedido é fechado, na loja (Nuvemshop) — que é outro domínio, com outra
   medição. Os 2 usuários no público `Purchasers` não podem ter vindo daqui.
   Logo, não há como conferir "se `purchase` usa identificador consistente para
   deduplicação" no escopo desta LP: o evento não é emitido aqui.
2. **Os 341 "eventos principais" não são 341 leads.** Todo carregamento de
   página dispara `PageView`/`lp_page_view`. Com 279 usuários ativos, um
   volume de 341 é compatível com "eventos principais" incluindo algo de
   pageview, não com 341 contatos.
3. **`whatsapp_click` é o único evento que corresponde a um lead real** — e ele
   é deduplicado por 4 horas dentro da mesma campanha. Isso é ótimo para o
   Meta (evita inflar `Contact`) mas significa que a contagem de cliques do
   GA4 é sempre menor ou igual à de intenções reais.
4. **`0 leads qualificados` e `0 leads convertidos` estão corretos**: esses são
   estados de ciclo de vida de CRM e não existe nenhuma regra de negócio ou
   integração no código que os produza. Conforme pedido, **não foram criados**.
   Para preenchê-los seria preciso primeiro definir, no atendimento do
   WhatsApp, o que qualifica e o que converte um lead — e o `token_rastreio`
   (`wa_tracking_token`, enviado dentro da mensagem) já existe justamente para
   costurar o lead do site com a conversa.

## O que precisa ser conferido fora do repositório

- Quais destes eventos estão marcados como principais no GA4 (Admin → Eventos).
- Se o contêiner do GTM instala um segundo Meta Pixel ou um segundo GA4.
- Se existe CAPI no backend consumindo `meta_event_id_contact`; se existir, a
  chave de deduplicação já está pronta e é consistente.
- O 403 do `cdn.cookiehub.eu`: **não há CookieHub neste repositório**. O script
  só pode estar sendo injetado pelo contêiner do GTM, então a correção
  (domínio autorizado no painel do CookieHub) é feita lá, não no código.
