# Plante Uma Flor — Landing Page

Landing page de geração de leads para a floricultura Plante Uma Flor (Goiânia, GO),
com foco em conversão de tráfego pago para WhatsApp.

- Site principal: https://www.planteumaflor.com
- WhatsApp: +5562996503403

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
