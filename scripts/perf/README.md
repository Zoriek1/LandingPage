# scripts/perf

Performance measurement tooling for the landing page.

## Files

- **`static-server.mjs`** — Node HTTP server that faithfully mirrors `public/.htaccess` rewrite semantics (slug→slug.html, SPA fallback, caching, gzip). Used for local Lighthouse measurement since `vite preview` does not apply rewrites.
- **`lighthouse-run.mjs`** — Runs N mobile Lighthouse audits against a URL, saves JSON results to `perf-artifacts/`, and prints a median summary table.

## Output

Lighthouse JSON results are written to `perf-artifacts/` (gitignored at the repo root). This directory is created automatically by the runner.