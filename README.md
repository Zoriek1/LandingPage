# Plante Uma Flor — Landing Page

Landing page de geração de leads para a floricultura Plante Uma Flor (Goiânia, GO),
com foco em conversão de tráfego pago para WhatsApp.

- Site principal: https://www.planteumaflor.com
- WhatsApp: +5562996503403

## URLs e landing pages

Este repositório publica a landing principal e 17 landing pages de anúncios no domínio
`lpb.planteumaflor.com`. A rota `/` é montada por [`src/pages/Index.tsx`](src/pages/Index.tsx).
As demais rotas são declaradas em
[`src/routes/routeManifest.ts`](src/routes/routeManifest.ts), recebem conteúdo de
[`src/features/ad-lps/data/configs.ts`](src/features/ad-lps/data/configs.ts) e compartilham
o renderizador [`src/features/ad-lps/AdLandingPage.tsx`](src/features/ad-lps/AdLandingPage.tsx).

Estado verificado em **24/09/2026** com resposta HTTP e carregamento em navegador real.
“Ativa” significa que a URL renderizou seu título e conteúdo próprios, sem página de erro.

| Nome | URL pública | Slug/rota | Estado | Onde está no código |
|------|-------------|-----------|--------|---------------------|
| Landing principal | https://lpb.planteumaflor.com | `/` | Ativa | [`src/pages/Index.tsx`](src/pages/Index.tsx) |
| Dia das Mães | https://lpb.planteumaflor.com/dia-das-maes | `dia-das-maes` | Ativa | [`LP_CONFIGS["dia-das-maes"]`](src/features/ad-lps/data/configs.ts) |
| Dia dos Namorados | https://lpb.planteumaflor.com/dia-dos-namorados | `dia-dos-namorados` | Ativa | [`LP_CONFIGS["dia-dos-namorados"]`](src/features/ad-lps/data/configs.ts) |
| Entrega urgente/hoje | https://lpb.planteumaflor.com/urgencia | `urgencia` | Ativa | [`LP_CONFIGS.urgencia`](src/features/ad-lps/data/configs.ts) |
| Aniversário | https://lpb.planteumaflor.com/aniversario | `aniversario` | Ativa | [`LP_CONFIGS.aniversario`](src/features/ad-lps/data/configs.ts) |
| Buquê de rosas acessível | https://lpb.planteumaflor.com/rosas-apt | `rosas-apt` | Ativa | [`LP_CONFIGS["rosas-apt"]`](src/features/ad-lps/data/configs.ts) |
| Lírios acessíveis | https://lpb.planteumaflor.com/lirios-apt | `lirios-apt` | Ativa | [`LP_CONFIGS["lirios-apt"]`](src/features/ad-lps/data/configs.ts) |
| Arranjos até R$ 149,90 | https://lpb.planteumaflor.com/carro-low | `carro-low` | Ativa | [`LP_CONFIGS["carro-low"]`](src/features/ad-lps/data/configs.ts) |
| Buquês premium | https://lpb.planteumaflor.com/carro-high | `carro-high` | Ativa | [`LP_CONFIGS["carro-high"]`](src/features/ad-lps/data/configs.ts) |
| Presente para hoje | https://lpb.planteumaflor.com/presente-hoje | `presente-hoje` | Ativa | [`LP_CONFIGS["presente-hoje"]`](src/features/ad-lps/data/configs.ts) |
| Tradição e comprovação | https://lpb.planteumaflor.com/tradicao-comprovacao | `tradicao-comprovacao` | Ativa | [`LP_CONFIGS["tradicao-comprovacao"]`](src/features/ad-lps/data/configs.ts) |
| Presente sem erro | https://lpb.planteumaflor.com/sem-erro | `sem-erro` | Redirecionada (301) para `/so-porque-sim` | [`LP_CONFIGS["sem-erro"]`](src/features/ad-lps/data/configs.ts) |
| Buquês de campo e girassol | https://lpb.planteumaflor.com/qual-b | `qual-b` | Ativa | [`LP_CONFIGS["qual-b"]`](src/features/ad-lps/data/configs.ts) |
| Só porque sim | https://lpb.planteumaflor.com/so-porque-sim | `so-porque-sim` | Ativa | [`LP_CONFIGS["so-porque-sim"]`](src/features/ad-lps/data/configs.ts) |
| Buquê real com foto | https://lpb.planteumaflor.com/buque-real | `buque-real` | Ativa | [`LP_CONFIGS["buque-real"]`](src/features/ad-lps/data/configs.ts) |
| Reconciliação | https://lpb.planteumaflor.com/reconciliacao | `reconciliacao` | Ativa | [`LP_CONFIGS.reconciliacao`](src/features/ad-lps/data/configs.ts) |
| Girassóis | https://lpb.planteumaflor.com/girassol | `girassol` | Ativa | [`LP_CONFIGS.girassol`](src/features/ad-lps/data/configs.ts) |
| Catálogo de preços | https://lpb.planteumaflor.com/catalogo-precos | `catalogo-precos` | Ativa | [`LP_CONFIGS["catalogo-precos"]`](src/features/ad-lps/data/configs.ts) |

`/sem-erro` continua declarada no manifesto e possui configuração própria, mas não é
mais uma página pública independente: [`public/.htaccess`](public/.htaccess) aplica o
redirecionamento permanente para `/so-porque-sim` antes de o HTML da LP ser servido.

### Destinos externos relacionados

Estes endereços fazem parte da presença pública da Plante Uma Flor, mas não são páginas
implementadas por este repositório:

| Destino | URL | Estado em 24/09/2026 |
|---------|-----|----------------------|
| Site principal | https://www.planteumaflor.com | Ativo |
| Catálogo de buquês | https://www.planteumaflor.com/buques | Ativo |
| Instagram | https://www.instagram.com/planteumaflor.floricultura/ | Ativo |

## Stack

React 18 + TypeScript, Vite 5 + SWC, Tailwind CSS 3 + shadcn/ui, React Router DOM 6,
Vitest + Playwright. Deploy automático (GitHub Actions → FTP → Hostinger) a cada push na
`main`.

## Começando

```bash
npm install
npm run dev        # http://localhost:8080
```

```bash
npm run check       # typecheck + lint + test — rodar antes de qualquer PR
npm run check:build   # check + build completo (necessário para mudanças em rotas,
                        # imagens, SSR, prerender, critical CSS ou build)
```

## Documentação

| Doc | Cobre |
|-----|-------|
| [`AGENTS.md`](AGENTS.md) | Arquitetura: mapa de arquivos, componentes, sistema de LPs de anúncio, estilo, config/infra, comandos. Leia antes de mexer no código. |
| [`docs/tracking.md`](docs/tracking.md) | Rastreamento de conversão: eventos, payloads, GTM, Meta Pixel, API de leads. Leia antes de mexer em qualquer CTA. |
| [`docs/cro/atendimento.md`](docs/cro/atendimento.md) | SOP de atendimento do WhatsApp e taxonomia de perdas. |
| [`docs/cro/medicoes.md`](docs/cro/medicoes.md) | Log de medição de campanhas (CRO) por ciclo. |
| [`docs/performance/lp-performance.md`](docs/performance/lp-performance.md) | Arquitetura de performance das LPs de anúncio (SSG, critical CSS) e como medir. |
| [`docs/backlog.md`](docs/backlog.md) | Ideias futuras de conversão ainda não implementadas. |
| [`assets-src/heros/README.md`](assets-src/heros/README.md) | Como adicionar fotos de hero por LP de anúncio. |
| [`CLAUDE.md`](CLAUDE.md) | Diretrizes de comportamento para o Claude Code neste repositório. |

## Convenções

- Preserve o fluxo de conversão existente (WhatsApp como destino principal). Qualquer
  mudança em CTA passa por `docs/tracking.md` primeiro.
- Português do Brasil, sem clichês/hipérboles, sem inventar dados de avaliação/desconto.
- Identidade visual: verde escuro, dourado, creme, Playfair Display + Montserrat.

Detalhes completos em `CLAUDE.md` e `AGENTS.md`.
