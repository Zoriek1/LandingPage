# Performance das Landing Pages de Anuncio

> Documento gerado pelo plano `lp-lcp-ssg-white-screen`, tarefa T12.
> Numeros medidos com Lighthouse 12.8.2, preset mobile (Moto G Power, 360x640, DPR 2, 1.6 Mbps / 150 ms, 4x CPU).

## TL;DR

As 10 landing pages de anuncio ja eram pre-renderizadas em build (SSG via `scripts/prerender-ad-lps.mjs`). O que impedia FCP e LCP aceitaveis era o CSS da folha LP (29,8 kB) bloqueando o parse do HTML, o preload de fonte competindo com a imagem LCP, e o PriceRangeSelector/Radix Dialog (32 kB) sendo carregado no primeiro paint. Quatro mudancas cirurgicas (D1-D4) tiraram tudo isso do caminho critico: CTA como `<a>` funcional sem JS, CSS critico inline, fonte sem preload, e dialog em `React.lazy`.

**Baseline (T3, antes de D1-D4):** Performance 84, FCP 1.883 ms, LCP 2.350 ms, TBT 497 ms, CLS 0,000.

**Apos D1-D4 (T11):** TBT caiu 26% (497 → 366 ms), mas LCP ficou em 2.425 ms (regrediu 75 ms) e FCP regrediu 235 ms (1.883 → 2.118 ms). O gargalo mudou de CSS para execucao de JS (857 ms de script evaluation). O objetivo F2 (LCP ≤ 1.500 ms) nao foi atingido. Recomenda-se um plano de follow-up (D6-D9) atacando `renderToPipeableStream`, preload WebP, e code-split do carrossel.

## Arquitetura

```
Build (npm run build)
  vite build (SSR) → entry-server renderToString → 10 <slug>.html
  → adLandingStaticHtml() injeta:
      <style>{critical.css}</style>          ← CSS inline, ~7,2 kB
      <link rel="preload" as="image">        ← hero AVIF
      <link rel="stylesheet" media="print">  ← folha LP (nao-bloqueante)
  → CTA renderiza como <a href="wa.me/...">  ← funcional sem JS
  → PriceRangeSelector via React.lazy        ← radix-dialog fora do caminho critico
```

### Pecas-chave

| Peca | Arquivo | O que faz |
|------|---------|-----------|
| Pre-render por slug | `scripts/prerender-ad-lps.mjs` | Gera 10 HTMLs com `#root` preenchido |
| Plugin Vite | `vite.config.ts` (`adLandingStaticHtml`) | Injeta preload, inline critical CSS, defere folha LP |
| CSS critico | `src/features/ad-lps/critical.css` | ~7,2 kB: reset Tailwind, fontes `@font-face`, variaveis, hero, CTA |
| CTA sem JS | `src/features/ad-lps/AdLandingPage.tsx` (`useHydrated`) | SSR: `<a href="wa.me/...">` / pos-hidratacao: `<button>` com `onClick` |
| Dialog lazy | `src/features/ad-lps/AdLandingPage.tsx` (`React.lazy`) | `radix-dialog` (32 kB) so carrega no clique do CTA |
| Servidor de medicao | `scripts/perf/static-server.mjs` | Espelha `public/.htaccess` (rewrite, cache, gzip) |
| Runner Lighthouse | `scripts/perf/lighthouse-run.mjs` | N auditorias mobile, JSON em `perf-artifacts/` |

## Antes vs depois (mediana de 5 Lighthouse mobile)

| Metrica | Antes (T3) | Depois (T11) | Delta |
|---------|------------|--------------|-------|
| Performance | 84 | 87 | +3,6% (melhora) |
| FCP | 1.883 ms | 2.118 ms | +12,5% (regressao) |
| LCP | 2.350 ms | 2.425 ms | +3,2% (regressao) |
| TBT | 497 ms | 366 ms | −26,4% (melhora) |
| CLS | 0,000 | 0,000 | inalterado |
| Speed Index | 1.883 ms | 2.118 ms | +12,5% (regressao) |

> Fonte baseline: `.omo/evidence/lp-lcp-ssg-white-screen/task-3.md`. Fonte depois: `.omo/evidence/lp-lcp-ssg-white-screen/task-11.md`.

### Medidas do baseline (T3, por execucao)

| Run | Perf | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|-----|------|----------|----------|----------|-----|
| 1 | 84 | 1.819 | 2.269 | 528 | 0,000 |
| 2 | 81 | 1.883 | 2.350 | 603 | 0,000 |
| 3 | 83 | 2.115 | 2.565 | 464 | 0,000 |
| 4 | 85 | 1.819 | 2.270 | 497 | 0,000 |
| 5 | 84 | 2.007 | 2.575 | 443 | 0,000 |

### Medidas pos-otimizacao (T11, por execucao)

| Run | Perf | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|-----|------|----------|----------|----------|-----|
| 1   | 87   | 2.119    | 2.432    | 376      | 0,000 |
| 2   | 86   | 2.118    | 2.417    | 369      | 0,000 |
| 3   | 87   | 2.119    | 2.432    | 376      | 0,000 |
| 4   | 88   | 2.115    | 2.425    | 349      | 0,000 |
| 5   | 87   | 2.113    | 2.422    | 361      | 0,000 |

> Fonte: `.omo/evidence/lp-lcp-ssg-white-screen/task-11.md`.

## Por que cada mudanca

### D1 — CTA como `<a>` no SSR

`CtaButton` em `AdLandingPage.tsx` renderiza `<a href="https://wa.me/5562996503403" target="_blank">` quando `useHydrated() === false` (SSR e primeiro render). Com JS desligado, o clique abre o WhatsApp direto. Apos hidratacao, vira `<button>` e dispara `openAdLpWhatsApp` (abre `PriceRangeSelector`). O `data-testid` e preservado nos dois estados.

**Por que:** Garante que o CTA principal funciona mesmo sem JavaScript, eliminando a "tela branca" para usuarios com JS bloqueado ou lento.

### D2 — CSS critico inline + folha LP nao-bloqueante

`critical.css` (7.411 bytes raw, ~2.405 gzipped) e injetado como `<style>` inline no `<head>` de cada `<slug>.html` pelo plugin `adLandingStaticHtml` em `vite.config.ts`. Contem: reset Tailwind, `@font-face` para Montserrat/Playfair, variaveis CSS, estilos do hero, CTA, brand-bar, breakpoints e `prefers-reduced-motion`.

A folha completa (`AdLandingPage-*.css`, 29,8 kB) passa a carregar com `media="print" onload="this.media='all'"`, seguida de `<noscript>` fallback.

**Por que:** Tira 29,8 kB do caminho critico de parsing/render. O browser nao precisa baixar e parsear a folha inteira antes de pintar o hero. Ganho direto em FCP e LCP.

### D3 — Preload de fonte removido

O `<link rel="preload" as="font">` do Playfair Display foi removido do `<head>` de `index.html`. As fontes ja estao disponiveis via `@font-face` com `font-display: swap` dentro do `critical.css` inline. O preload so competia com a imagem LCP no budget de banda do throttling mobile.

**Por que:** No throttling mobile (1,6 Mbps), o browser tem budget limitado para requests paralelos no inicio do carregamento. Remover o preload libera banda para a hero AVIF, que e o elemento LCP.

### D4 — PriceRangeSelector como `React.lazy`

`PriceRangeSelector` (que depende do `radix-dialog`, ~32 kB) foi trocado por `React.lazy(() => import(...))` em `AdLandingPage.tsx`. Durante SSR, o `<Suspense fallback>` renderiza um `<div class="ad-lp-price-selector-placeholder">` vazio. O chunk so e baixado quando o usuario clica no CTA.

**Por que:** 32 kB de JS saem do grafo de hidratação. O browser nao precisa parsear o dialog antes de atingir FCP/LCP. Ganho direto em TBT e tempo de main-thread.

## Como reproduzir a medicao

### 1. Build de producao

```bash
npm run build
```

### 2. Subir servidor fiel

```bash
node scripts/perf/static-server.mjs dist 4178
```

### 3. Rodar Lighthouse (5 execucoes mobile)

Em outro terminal:

```bash
node scripts/perf/lighthouse-run.mjs http://127.0.0.1:4178/lirios-apt 5 perf-artifacts/run
```

Os JSONs ficam em `perf-artifacts/run/` (gitignored). O script imprime a tabela de mediana no final.

### 4. Comparar com baseline

```bash
# Baseline (antes de D1-D4):
ls perf-artifacts/baseline/

# Resultado (apos D1-D4):
ls perf-artifacts/run/
```

## Veredito

O plano D1-D4 **nao atingiu o objetivo F2** (LCP ≤ 1.500 ms). O LCP ficou em 2.425 ms — 75 ms pior que o baseline de 2.350 ms. O FCP tambem regrediu 235 ms (1.883 → 2.118 ms). Nenhum threshold estrito foi batido alem do CLS.

**O que funcionou:** TBT caiu 26% (497 → 366 ms), confirmando que `React.lazy` no PriceRangeSelector tirou o `radix-dialog` do grafo de hidratacao. O CTA funciona sem JS (defensivo, nao aparece no Lighthouse). A infra de medicao (servidor Node + runner + 134 testes) esta pronta para reuso.

**O que nao funcionou:** O CSS critico inline (7,2 kB) continua bloqueando render — o browser precisa parsea-lo antes de pintar o hero. Pior: o gargalo agora e execucao de JS (857 ms de script evaluation no main thread), que este plano nao atacou. A folha LP deferida (29,8 kB) ainda dispara reflow ao carregar.

**Proximos passos recomendados (plano follow-up D6-D9):**

1. **Trocar `renderToString` por `renderToPipeableStream`** em `src/features/ad-lps/entry-server.tsx` (~2-4 h, risco medio). Remove o placeholder `<template>` de 600 bytes do HTML e permite que Suspense faca streaming limpo. Ganho estimado: 50-100 ms no LCP.
2. **Pre-carregar WebP alem do AVIF no hero** (~30 min, risco baixo). Hoje so o AVIF tem `<link rel="preload">`. Se o browser rejeitar AVIF, o WebP e buscado a frio. Ganho estimado: 50-100 ms no LCP.
3. **Code-split do carrossel/SocialProofSection** (~3-5 h, risco medio). A secao tem `useEffect` com `setInterval` que contribui para o TBT (366 ms ainda e alto). Deferir ~10-15 kB de JS para depois do FCP. Ganho estimado: 100-150 ms no TBT.

**Conclusao:** Nao declarar este plano como sucesso de performance. As melhorias arquiteturais sao reais (TBT, CTA sem JS, infra de medicao), mas o LCP nao mexeu. Um plano follow-up focado em streaming SSR e code-split tem chance real de chegar a LCP ≤ 2.000 ms.

## Caveats

- **Suspense SSR template:** React 18 `renderToString` nao suporta Suspense nativamente. Cada HTML carrega ~600 bytes de `<template data-msg="...renderToString...Suspense...">` escondido. Nao afeta LCP/FCP/CLS. Resolveria com `renderToPipeableStream` (fora do escopo deste plano).
- **Servidor de medicao:** `scripts/perf/static-server.mjs` e um servidor Node fiel ao `.htaccess`, usado so para medição local. Em producao, o Apache na Hostinger serve via `public/.htaccess`.
- **Lighthouse variancia:** Rodadas mobile tem varianca de ~300 ms no LCP. Usar mediana de 5 execucoes, nao valor unico.
- **`perf-artifacts/`:** diretorio gitignored. Os JSONs do Lighthouse ficam localmente e nao vao para o repositorio.
- **`fetchPriority` warning:** React emite "React does not recognize the `fetchPriority` prop" no console. Warning pre-existente, intencionalmente ignorado (a prop e necessaria para o LCP e funciona no browser).
