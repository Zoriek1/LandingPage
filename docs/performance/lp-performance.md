# Performance das Landing Pages de Anúncio

Medido com Lighthouse 12.8.2, preset mobile (Moto G Power, 360x640, DPR 2, 1.6 Mbps /
150 ms, 4x CPU).

## Arquitetura

```
Build (npm run build)
  vite build (SSR) → entry-server renderToString → <slug>.html por LP de anúncio
  → adLandingStaticHtml() injeta:
      <style>{critical.css}</style>          ← CSS inline, ~7,2 kB
      <link rel="preload" as="image">        ← hero AVIF
      <link rel="stylesheet" media="print">  ← folha LP (não-bloqueante)
  → CTA renderiza como <a href="wa.me/...">  ← funcional sem JS
  → PriceRangeSelector via React.lazy        ← radix-dialog fora do caminho crítico
```

### Peças-chave

| Peça | Arquivo | O que faz |
|------|---------|-----------|
| Pré-render por slug | `scripts/prerender-ad-lps.mjs` | Gera um HTML por slug com `#root` preenchido |
| Plugin Vite | `vite.config.ts` (`adLandingStaticHtml`) | Injeta preload, inline critical CSS, defere folha LP |
| CSS crítico | `src/features/ad-lps/critical.css` | ~7,2 kB: reset Tailwind, fontes `@font-face`, variáveis, hero, CTA |
| CTA sem JS | `src/features/ad-lps/AdLandingPage.tsx` (`useHydrated`) | SSR: `<a href="wa.me/...">` / pós-hidratação: `<button>` com `onClick` |
| Dialog lazy | `src/features/ad-lps/AdLandingPage.tsx` (`React.lazy`) | `radix-dialog` (32 kB) só carrega no clique do CTA |
| Servidor de medição | `scripts/perf/static-server.mjs` | Espelha `public/.htaccess` (rewrite, cache, gzip) |
| Runner Lighthouse | `scripts/perf/lighthouse-run.mjs` | N auditorias mobile, JSON em `perf-artifacts/` |

## Como reproduzir a medição

### 1. Build de produção

```bash
npm run build
```

### 2. Subir servidor fiel

```bash
node scripts/perf/static-server.mjs dist 4178
```

### 3. Rodar Lighthouse (5 execuções mobile)

Em outro terminal:

```bash
node scripts/perf/lighthouse-run.mjs http://127.0.0.1:4178/lirios-apt 5 perf-artifacts/run
```

Os JSONs ficam em `perf-artifacts/run/` (gitignored). O script imprime a tabela de
mediana no final.

### 4. Comparar com um baseline salvo

```bash
ls perf-artifacts/baseline/
ls perf-artifacts/run/
```

## Caveats

- **Suspense SSR template:** React 18 `renderToString` não suporta Suspense nativamente.
  Cada HTML carrega ~600 bytes de `<template data-msg="...renderToString...Suspense...">`
  escondido. Não afeta LCP/FCP/CLS. Resolveria com `renderToPipeableStream`.
- **Servidor de medição:** `scripts/perf/static-server.mjs` é um servidor Node fiel ao
  `.htaccess`, usado só para medição local. Em produção, o Apache na Hostinger serve via
  `public/.htaccess`.
- **Lighthouse variância:** rodadas mobile têm variância de ~300 ms no LCP. Usar mediana
  de 5 execuções, não valor único.
- **`perf-artifacts/`:** diretório gitignored. Os JSONs do Lighthouse ficam localmente e
  não vão para o repositório.
- **`fetchPriority` warning:** React emite "React does not recognize the `fetchPriority`
  prop" no console. Warning pré-existente, intencionalmente ignorado (a prop é necessária
  para o LCP e funciona no browser).

---

## Histórico — otimização D1-D4 (2026-08-03)

As LPs de anúncio já eram pré-renderizadas em build. O que impedia FCP e LCP aceitáveis
era o CSS da folha LP (29,8 kB) bloqueando o parse do HTML, o preload de fonte competindo
com a imagem LCP, e o `PriceRangeSelector`/Radix Dialog (32 kB) sendo carregado no
primeiro paint. Quatro mudanças (D1-D4, descritas abaixo) tiraram tudo isso do caminho
crítico.

**Baseline (antes de D1-D4):** Performance 84, FCP 1.883 ms, LCP 2.350 ms, TBT 497 ms,
CLS 0,000.

**Depois de D1-D4:** TBT caiu 26% (497 → 366 ms), mas LCP ficou em 2.425 ms (regrediu
75 ms) e FCP regrediu 235 ms (1.883 → 2.118 ms). O gargalo mudou de CSS para execução de
JS (857 ms de script evaluation). O objetivo de LCP ≤ 1.500 ms **não foi atingido**.

### Antes vs. depois (mediana de 5 Lighthouse mobile)

| Métrica | Antes | Depois | Delta |
|---------|------------|--------------|-------|
| Performance | 84 | 87 | +3,6% (melhora) |
| FCP | 1.883 ms | 2.118 ms | +12,5% (regressão) |
| LCP | 2.350 ms | 2.425 ms | +3,2% (regressão) |
| TBT | 497 ms | 366 ms | −26,4% (melhora) |
| CLS | 0,000 | 0,000 | inalterado |
| Speed Index | 1.883 ms | 2.118 ms | +12,5% (regressão) |

### Por que cada mudança

**D1 — CTA como `<a>` no SSR.** `CtaButton` em `AdLandingPage.tsx` renderiza
`<a href="https://wa.me/5562996503403" target="_blank">` quando `useHydrated() === false`
(SSR e primeiro render). Com JS desligado, o clique abre o WhatsApp direto. Após
hidratação, vira `<button>` e dispara `openAdLpWhatsApp` (abre `PriceRangeSelector`).
Garante que o CTA principal funciona mesmo sem JavaScript, eliminando a "tela branca"
para usuários com JS bloqueado ou lento.

**D2 — CSS crítico inline + folha LP não-bloqueante.** `critical.css` (~2,4 kB gzipped) é
injetado como `<style>` inline no `<head>` de cada `<slug>.html`. A folha completa
(29,8 kB) passa a carregar com `media="print" onload="this.media='all'"`. Tira 29,8 kB do
caminho crítico de parsing/render — ganho direto em FCP e LCP.

**D3 — Preload de fonte removido.** O `<link rel="preload" as="font">` do Playfair
Display foi removido; as fontes já estão disponíveis via `@font-face` com
`font-display: swap` dentro do `critical.css` inline. No throttling mobile (1,6 Mbps), o
preload só competia com a imagem LCP pelo budget de banda.

**D4 — `PriceRangeSelector` como `React.lazy`.** O componente (que depende do
`radix-dialog`, ~32 kB) virou lazy; durante SSR, o `Suspense fallback` renderiza um
placeholder vazio. 32 kB de JS saem do grafo de hidratação — ganho direto em TBT.

### Veredito

O plano D1-D4 **não atingiu o objetivo de LCP ≤ 1.500 ms** (ficou em 2.425 ms, 75 ms pior
que o baseline). O CSS crítico inline continua bloqueando render, e o gargalo passou a
ser execução de JS no main thread (857 ms de script evaluation) — algo que este plano não
atacou.

**O que funcionou:** TBT caiu 26%, confirmando que `React.lazy` no `PriceRangeSelector`
tirou o `radix-dialog` do grafo de hidratação. O CTA funciona sem JS. A infra de medição
(servidor Node + runner) está pronta para reuso.

**Ideias de follow-up ainda não implementadas:**

1. Trocar `renderToString` por `renderToPipeableStream` em
   `src/features/ad-lps/entry-server.tsx` — remove o placeholder `<template>` de 600
   bytes e permite streaming limpo do Suspense. Ganho estimado: 50-100 ms no LCP.
2. Pré-carregar WebP além do AVIF no hero — hoje só o AVIF tem preload; se o browser
   rejeitar AVIF, o WebP é buscado a frio. Ganho estimado: 50-100 ms no LCP.
3. Code-split do carrossel/`SocialProofSection` — o `useEffect` com `setInterval`
   contribui para o TBT. Ganho estimado: 100-150 ms no TBT.
