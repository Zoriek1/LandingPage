# Fotos de hero das LPs de anúncio

Coloque aqui a foto de cada landing page com o **slug como nome do arquivo**:

```
assets-src/heros/lirios-apt.jpg
assets-src/heros/rosas-apt.jpg
assets-src/heros/carro-low.jpg
```

Depois rode:

```bash
npm run images
```

O script recorta e gera, para cada foto:

- `src/assets/generated/hero-<slug>-{480,900}.{avif,webp}` — o `<picture>` do hero;
- `public/lpb/heros/<slug>.jpg` (1200×630) — o `og:image` que aparece quando o
  link é compartilhado no WhatsApp ou no Facebook.

**Um slug sem foto aqui continua mostrando a fachada da loja**, sem quebrar
nada — dá para migrar uma LP de cada vez.

## Slugs disponíveis

A lista completa e atual está em
[`src/routes/routeManifest.ts`](../../src/routes/routeManifest.ts) — não duplicada aqui
para não ficar desatualizada quando uma LP nova for adicionada.

## Recomendações

- Enquadramento **horizontal**, com espaço livre no centro/esquerda: o texto do
  hero fica por cima.
- Mande a maior resolução que tiver (mínimo 1800px de largura). O script cuida
  de reduzir e comprimir.
- `.jpg`, `.jpeg`, `.png` e `.webp` são aceitos.
