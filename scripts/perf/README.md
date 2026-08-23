# scripts/perf

Tooling de medição de performance das LPs de anúncio.

- `static-server.mjs` — servidor Node que espelha `public/.htaccess` para medição local.
- `lighthouse-run.mjs` — roda N auditorias Lighthouse mobile, salva JSON em
  `perf-artifacts/` (gitignored).

Arquitetura, peças-chave e como reproduzir a medição:
[`docs/performance/lp-performance.md`](../../docs/performance/lp-performance.md).
