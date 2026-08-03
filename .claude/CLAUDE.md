# bloom-bridge — Contexto do Projeto

**Landing page de geração de leads para a floricutura "Plante Uma Flor".**

- Site principal: https://www.planteumaflor.com
- WhatsApp: +5562996503403 (Goiás, Brasil)
- API de leads: https://gestaopedidos.planteumaflor.online/api/leads/

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
| `index.html` | HTML raiz. Contém os snippets de Meta Pixel e Google Tag Manager. **Se mudar rastreamento, mexa aqui primeiro.** |
| `src/main.tsx` | Monta o React. Desativa `console.*` em produção. |
| `src/App.tsx` | Root com QueryClientProvider, Toasters, BrowserRouter e rotas. |
| `src/pages/Index.tsx` | Orquestra todas as seções da landing page. **Se adicionar/remover seção, edite aqui.** |

### Rastreamento — tudo está acoplado

> **Regra:** Se tocar em qualquer ponto de conversão (botão WhatsApp, "Ver Catálogo"), verifique `tracking.ts` e `index.html`.

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/tracking.ts` | **Centro de rastreamento.** `trackWhatsAppClick()` e `trackSiteClick()` — disparam Meta Pixel, push no `dataLayer` (GTM) e POST à API de leads. Captura fbclid, gclid, _fbp, _fbc, UTMs. Não chama `gtag` diretamente. |
| `src/lib/whatsappModal.ts` | Registra e abre o modal de captura de telefone. Qualquer botão WhatsApp chama `openWhatsAppModal()` daqui. |
| `index.html` | Meta Pixel init + listener de cliques WhatsApp + verificação de domínio Facebook. |

**Fluxo de conversão:**
```
Clique WhatsApp
  → openWhatsAppModal()          [whatsappModal.ts]
  → WhatsAppLeadModal captura tel
  → trackWhatsAppClick(phone)    [tracking.ts]
      → Meta Pixel "Contact"
      → dataLayer.push("whatsapp_click")  → GTM decide GA4/Google Ads
      → POST /api/leads/          [payload: phone, UTMs, fbclid, _fbp, _fbc]
  → Abre wa.me em nova aba
```

**Payload da API de leads:**
```typescript
{
  event, url, referrer,
  fbclid, fbp, fbc,    // Facebook
  phone,               // capturado no modal
  utm_source, utm_medium, utm_campaign, utm_content, utm_term,
  src, sck             // UTMify
}
```

### Componentes da Página

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

> Se tocar num **botão WhatsApp** em qualquer componente, certifique-se de que chama `openWhatsAppModal()` — nunca abra `wa.me` diretamente.

> Se tocar num **botão "Ver Catálogo"** (link para o site), certifique-se de que chama `trackSiteClick()` antes de navegar.

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

### Assets (`src/assets/`)

| Arquivo | Onde é usado |
|---------|-------------|
| `logo.png` | Navbar, Footer |
| `hero-flowers.jpg` | HeroSection (background) |
| `fachada.jpg` | OurStorySection |
| `why-choose.jpg` | WhyChooseSection |
| `cat-buques.jpg` | CategoriesSection |
| `cat-presentes.jpg` | CategoriesSection |
| `cat-cestas.jpg` | CategoriesSection |
| `cat-plantas.jpg` | CategoriesSection |
| `cat-datas.jpg` | CategoriesSection |

### Hooks Customizados

| Hook | Uso |
|------|-----|
| `hooks/use-mobile.tsx` | Detecta breakpoint mobile — usado para comportamentos responsivos |
| `hooks/use-toast.ts` | Notificações toast |

### Config & Infra

| Arquivo | O que configura |
|---------|----------------|
| `vite.config.ts` | Dev em porta 8080, alias `@` → `src/`, HMR overlay desativado |
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
| API Leads | `https://gestaopedidos.planteumaflor.online/api/leads/` | `tracking.ts` |
| Meta Pixel ID | `370300471997593` | `index.html` |
| GTM Container | `GTM-KCRTLDV4` | `index.html`, `dia-das-maes/index.html`, `dia-dos-namorados/index.html` |
| FB Domain Token | `neezjodfejjwka6crvfsxpfcwhq7gj` | `index.html` |

> **Google Ads e GA4 não estão no código-fonte.** O `index.html` carrega
> apenas Meta Pixel e GTM; qualquer tag de GA4 (`GT-…`/`G-…`) ou de conversão
> do Google Ads (`AW-…`) vive dentro do contêiner `GTM-KCRTLDV4` e é editada no
> painel do GTM, não aqui. O mesmo vale para o CookieHub. Procurar esses IDs no
> repositório não retorna nada — não é sinal de que sumiram.

---

## Relações Críticas — "Se mexer em X, olhe Y"

| Se mexer em... | Também verifique... |
|---------------|---------------------|
| Qualquer botão WhatsApp | `whatsappModal.ts`, `tracking.ts`, `WhatsAppLeadModal.tsx` |
| `tracking.ts` | `index.html` (pixel init), todos os componentes com CTAs |
| `WhatsAppLeadModal.tsx` | `whatsappModal.ts` (callback de abertura), `tracking.ts` (chamada no submit) |
| `index.html` | `tracking.ts` (scripts carregados devem bater com o que o tracking usa) |
| Botões "Ver Catálogo" | `tracking.ts` → `trackSiteClick()` |
| `tailwind.config.ts` | `index.css` (vars CSS devem estar em sincronia) |
| `Index.tsx` (ordem das seções) | `Navbar.tsx` (links de âncora `#section-id`) |
| Assets de imagem | Componente que importa + otimização de tamanho |
| `.github/workflows/deploy.yml` | Secrets do GitHub repo |
| `vite.config.ts` | `tsconfig.app.json` (paths devem ser espelhados) |

---

## Comandos

```bash
npm run dev       # Dev server em localhost:8080
npm run build     # Build de produção → dist/
npm run preview   # Preview do build
npm run lint      # ESLint
npm run test      # Vitest (unitários)
```

Deploy acontece automaticamente ao fazer push na branch `main`.
