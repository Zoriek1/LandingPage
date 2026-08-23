# bloom-bridge — Contexto do Projeto

**Landing page de geração de leads para a floricultura "Plante Uma Flor".**

- Site principal: https://www.planteumaflor.com
- WhatsApp: +5562996503403 (Goiás, Brasil)
- API de leads: https://planteumaflor.gestaoonline.app.br/api/leads/

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework UI | React 18 + TypeScript |
| Build | Vite 5 + SWC |
| Estilo | Tailwind CSS 3 + shadcn/ui + Framer Motion |
| Formulários | React Hook Form + Zod |
| Roteamento | React Router DOM 6 |
| Testes | Vitest + Playwright |
| Deploy | GitHub Actions → FTP → Hostinger |

---

## Mapa de Arquivos

### Entradas

| Arquivo | O que faz |
|---------|-----------|
| `index.html` | HTML raiz. Contém os snippets de Meta Pixel e Google Tag Manager. **Se mudar rastreamento, mexa aqui primeiro** e veja `docs/tracking.md`. |
| `src/main.tsx` | Monta o React (landing principal). Desativa `console.*` em produção. |
| `src/App.tsx` | Root com QueryClientProvider, Toasters, BrowserRouter e rotas — landing principal (`/`) + as 17 LPs de anúncio de `src/routes/routeManifest.ts`. |
| `src/pages/Index.tsx` | Orquestra todas as seções da landing principal. **Se adicionar/remover seção, edite aqui.** |
| `src/features/ad-lps/AdLandingPage.tsx` | Componente único que renderiza qualquer LP de anúncio a partir de `data/configs.ts` (um config por slug). Servido tanto via rota SPA quanto via HTML estático pré-renderizado por slug (`dist/<slug>.html`). |
| `src/mothers-day/main.tsx`, `src/namorados/main.tsx` | Entry points Vite próprios para `dia-das-maes/index.html`/`dia-dos-namorados/index.html` — montam `AdLandingPage` (do sistema `ad-lps`), **não** os componentes em `src/features/mothers-day`/`src/features/namorados` (ver nota de código legado abaixo). |

### Rastreamento — tudo está acoplado

> **Regra:** Se tocar em qualquer ponto de conversão (botão WhatsApp, "Ver Catálogo"),
> leia [`docs/tracking.md`](docs/tracking.md) e verifique `tracking.ts` e `index.html`.
> Esse é o documento canônico do fluxo de eventos, payloads e destinos — não duplique
> essa explicação aqui.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/tracking.ts` | **Centro de rastreamento.** `trackWhatsAppClick()` e `trackSiteClick()` — disparam Meta Pixel, push no `dataLayer` (GTM) e POST à API de leads. Captura fbclid, gclid, `_fbp`, `_fbc`, UTMs. Não chama `gtag` diretamente. |
| `src/lib/attribution.ts` | Fonte única de UTM/campanha: URL do clique vence, `sessionStorage` é fallback só na mesma aba. |
| `src/lib/whatsappModal.ts` | Registra e abre o modal de captura de telefone. Qualquer botão WhatsApp chama `openWhatsAppModal()` daqui. |
| `index.html` | Meta Pixel init + Google Tag Manager (`GTM-KCRTLDV4`). |

> Se tocar num **botão WhatsApp** em qualquer componente, certifique-se de que chama
> `openWhatsAppModal()` — nunca abra `wa.me` diretamente.
>
> Se tocar num **botão "Ver Catálogo"** (link para o site), certifique-se de que chama
> `trackSiteClick()` antes de navegar.

### Componentes da Landing Principal

Ordem de renderização em `Index.tsx`:

| Componente | Seção |
|-----------|-------|
| `Navbar.tsx` | Nav fixo com logo, links e "Ver Catálogo" |
| `HeroSection.tsx` | Banner principal — CTA primário, badges |
| `BenefitsSection.tsx` | 4 cards de benefícios |
| `CategoriesSection.tsx` | Grid de 5 categorias de produto |
| `WhyChooseSection.tsx` | Story da marca com imagem |
| `TestimonialsSection.tsx` | 4 depoimentos |
| `ProcessSection.tsx` | 3 passos de compra |
| `OurStorySection.tsx` | História + foto da fachada |
| `FAQSection.tsx` | 5 perguntas (accordion) |
| `FinalCTASection.tsx` | CTA final → site principal |
| `Footer.tsx` | Logo, redes sociais, copyright |
| `WhatsAppFAB.tsx` | FAB flutuante (sempre visível) |
| `WhatsAppLeadModal.tsx` | Modal de captura de telefone |
| `BackToTop.tsx` | Botão voltar ao topo |

### LPs de anúncio (`src/features/ad-lps`)

Sistema separado da landing principal, usado pelas 17 rotas de tráfego pago listadas em
`src/routes/routeManifest.ts` (inclui `dia-das-maes`/`dia-dos-namorados`, que **não** são
páginas à parte — são slugs dentro deste mesmo sistema).

- `data/configs.ts` — fonte de verdade de conteúdo por slug (headline, hero, seções,
  CTAs, produtos da vitrine, FAQ, garantias).
- `AdLandingPage.tsx` — monta as seções, CTAs de WhatsApp, vitrine filtrável, provas
  sociais, sticky CTA, seletor de faixa de preço (lazy).
- `lib/useQueryVariant.ts` — variantes via query param (`?oferta=`/`?criativo=`, nome
  configurável por config) que reordenam a vitrine e trocam CTAs; dispara
  `trackVariantSeen` (evento `offer_variant_seen`, sem conversão).
- `entry-server.tsx` + `scripts/prerender-ad-lps.mjs` — SSR/prerender por slug após o
  build (`npm run prerender:ad-lps`), gera `dist/<slug>.html` com critical CSS inline e
  preload do hero.

**Código legado, não usado em produção:** `src/features/mothers-day/` e
`src/features/namorados/` são árvores completas de componentes (Navbar, Footer, seções,
hooks próprios) de uma implementação anterior de "Dia das Mães"/"Dia dos Namorados",
substituída pelo sistema `ad-lps` acima. Nenhum entry point real as importa — só aparecem
em `src/test/mothersDayPage.test.tsx`. Candidatas a remoção; confirmar com o time antes de
apagar (os scripts `sync:mothers-day-products`/`sync:namorados-products` do `build`
continuam rodando e podem alimentar outra coisa — verificar antes).

### Estilo & Design

| Arquivo | O que define |
|---------|-------------|
| `tailwind.config.ts` | Cores customizadas (verde escuro, dourado/tan, creme), fontes, animações |
| `src/index.css` | CSS variables, fontes (Playfair Display + Montserrat), utilitários globais |
| `components.json` | Config do shadcn/ui — aliases de paths |

**Paleta:**
- Primary: verde escuro florestal (`hsl(148, 30%, 15%)`)
- Accent: dourado/tan (`hsl(40, 45%, 56%)`)
- Background: creme quente (`hsl(40, 33%, 98%)`)

**Fontes:**
- Títulos: Playfair Display (serif)
- Corpo: Montserrat (sans-serif)

### Assets

| Pasta | O que tem |
|-------|-----------|
| `src/assets/` | Imagens/fontes da landing principal; `src/assets/generated/` tem os AVIF/WebP responsivos gerados por `npm run images`. |
| `assets-src/heros/` | Fotos-fonte dos heroes das LPs de anúncio — ver [`assets-src/heros/README.md`](assets-src/heros/README.md). |

### Hooks Customizados

| Hook | Uso |
|------|-----|
| `hooks/use-mobile.tsx` | Detecta breakpoint mobile — usado para comportamentos responsivos |
| `hooks/use-toast.ts` | Notificações toast |

### Config & Infra

| Arquivo | O que configura |
|---------|----------------|
| `vite.config.ts` | Dev em porta 8080, alias `@` → `src/`, HMR overlay desativado, multi-entry (landing + `dia-das-maes`/`dia-dos-namorados` + SSR de `ad-lps`), plugin `adLandingStaticHtml` (gera `dist/<slug>.html`) |
| `tsconfig.app.json` | TypeScript sem strict mode (não alterar sem testar bem) |
| `.github/workflows/deploy.yml` | CI/CD: push na `main` → `npm run build` → FTP para Hostinger |

**Secrets do CI/CD (GitHub):** `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`

---

## IDs & Endpoints Hard-coded

> Não há `.env`. Tudo está no código-fonte:

| Constante | Valor | Localização |
|-----------|-------|------------|
| WhatsApp URL | `wa.me/+5562996503403?text=...` | múltiplos componentes |
| Site URL | `https://www.planteumaflor.com` | múltiplos componentes |
| API Leads | `https://planteumaflor.gestaoonline.app.br/api/leads/` | `src/lib/tracking.ts` |
| Meta Pixel ID | `370300471997593` | `index.html` |
| GTM Container | `GTM-KCRTLDV4` | `index.html`, `dia-das-maes/index.html`, `dia-dos-namorados/index.html` |
| FB Domain Token | `neezjodfejjwka6crvfsxpfcwhq7gj` | `index.html` |

> **Google Ads e GA4 não estão no código-fonte.** O `index.html` carrega apenas Meta
> Pixel e GTM; qualquer tag de GA4 (`GT-…`/`G-…`) ou de conversão do Google Ads (`AW-…`)
> vive dentro do contêiner `GTM-KCRTLDV4` e é editada no painel do GTM, não aqui. O mesmo
> vale para o CookieHub. Procurar esses IDs no repositório não retorna nada — não é sinal
> de que sumiram. Detalhe completo em [`docs/tracking.md`](docs/tracking.md).

---

## Relações Críticas — "Se mexer em X, olhe Y"

| Se mexer em... | Também verifique... |
|---------------|---------------------|
| Qualquer botão WhatsApp | `whatsappModal.ts`, `tracking.ts`, `WhatsAppLeadModal.tsx`, `docs/tracking.md` |
| `tracking.ts` / `attribution.ts` | `index.html` (pixel init), todos os componentes com CTAs, `docs/tracking.md` |
| `WhatsAppLeadModal.tsx` | `whatsappModal.ts` (callback de abertura), `tracking.ts` (chamada no submit) |
| `index.html` | `tracking.ts` (scripts carregados devem bater com o que o tracking usa) |
| Botões "Ver Catálogo" | `tracking.ts` → `trackSiteClick()` |
| `src/features/ad-lps/data/configs.ts` | `AdLandingPage.tsx`, `src/routes/routeManifest.ts` |
| `tailwind.config.ts` | `index.css` (vars CSS devem estar em sincronia) |
| `Index.tsx` (ordem das seções) | `Navbar.tsx` (links de âncora `#section-id`) |
| Assets de imagem | Componente que importa + otimização de tamanho |
| `.github/workflows/deploy.yml` | Secrets do GitHub repo |
| `vite.config.ts` | `tsconfig.app.json` (paths devem ser espelhados) |

---

## Comandos

```bash
npm run dev             # Dev server em localhost:8080
npm run build            # Sync de produtos + build de produção + prerender das LPs de anúncio → dist/
npm run build:dev        # Sync de produtos + build em modo development, sem prerender
npm run preview          # Preview do build
npm run lint              # ESLint
npm run typecheck         # TypeScript (app + node), sem emitir
npm run test               # Vitest (unitários)
npm run check               # typecheck + lint + test
npm run check:build          # check + build completo + testes de dist + inspeção do bundle
npm run images                # Gera AVIF/WebP responsivos a partir de assets-src/heros
```

Deploy acontece automaticamente ao fazer push na branch `main`.
