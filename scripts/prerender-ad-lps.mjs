import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");

const ROOT_DIV_PATTERN = /<div id="root"><\/div>/;

function escapeHtmlAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Injeta o title/OG/canonical de `meta` no `<head>` já existente do HTML —
 * cada tag precisa já existir no index.html base (ver index.html), essa
 * função só troca o conteúdo. og:url/og:image não existem no index.html base
 * (só fazem sentido por slug), então são inseridas logo depois de og:type.
 */
function injectMetaTags(html, meta) {
  let result = html;

  const replaceOrThrow = (pattern, replacement, label) => {
    if (!pattern.test(result)) {
      throw new Error(`Âncora "${label}" não encontrada no HTML da LP para injetar meta tags`);
    }
    result = result.replace(pattern, replacement);
  };

  replaceOrThrow(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtmlAttr(meta.title)}</title>`,
    "<title>",
  );
  replaceOrThrow(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
    'meta[name="description"]',
  );
  replaceOrThrow(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.ogTitle)}" />`,
    'meta[property="og:title"]',
  );
  replaceOrThrow(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:description" content="${escapeHtmlAttr(meta.ogDescription)}" />`,
    'meta[property="og:description"]',
  );
  replaceOrThrow(
    /<meta property="og:type" content="website" \/>/,
    `<meta property="og:type" content="website" />\n    ` +
      `<meta property="og:url" content="${escapeHtmlAttr(meta.ogUrl)}" />\n    ` +
      `<meta property="og:image" content="${escapeHtmlAttr(meta.ogImage)}" />`,
    'meta[property="og:type"]',
  );
  replaceOrThrow(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${escapeHtmlAttr(meta.canonical)}" />`,
    'link[rel="canonical"]',
  );

  return result;
}

/**
 * O preload do hero (injetado por adLandingStaticHtml em vite.config.ts) e o
 * <source type="image/avif"> que o SSR acabou de escrever precisam apontar
 * para o MESMO arquivo com hash — senão o navegador baixa a imagem duas vezes
 * (uma via preload, outra via o <picture> real) e o preload não serve pra nada.
 * Falha alto e cedo em vez de confiar que os dois builds bateram por acaso.
 */
function assertHeroPreloadMatchesPicture(html, slug) {
  const preloadMatch = html.match(
    /<link rel="preload" as="image" fetchpriority="high" type="image\/avif"[^>]*imagesrcset="([^"]+)" imagesizes="([^"]+)"/,
  );
  if (!preloadMatch) {
    throw new Error(`Preload do hero não encontrado no HTML de /${slug}`);
  }

  const pictureMatch = html.match(/<source type="image\/avif" srcSet="([^"]+)" sizes="([^"]+)"/);
  if (!pictureMatch) {
    throw new Error(`<source type="image/avif"> do hero não encontrado no HTML SSR de /${slug}`);
  }

  // O `sizes` também precisa bater: com valores diferentes o navegador pode
  // escolher outra largura no <picture> e o preload vira um download a mais.
  // HERO_SIZES_BY_SLUG (vite.config.ts) e HERO_SPLIT_SIZES (AdLandingPage.tsx)
  // são os dois lados desta conta.
  if (preloadMatch[2] !== pictureMatch[2]) {
    throw new Error(
      `Preload e <picture> do hero de /${slug} usam sizes diferentes:\n` +
        `  preload: ${preloadMatch[2]}\n  picture: ${pictureMatch[2]}`,
    );
  }

  const preloadSrcset = preloadMatch[1].replace(/^\//, "");
  const pictureSrcset = pictureMatch[1].replace(/^\//, "").replace(/^\/*/, "");
  // Normaliza barra inicial: o preload sempre usa "/assets/..."; o <picture>
  // SSR pode ou não ter a barra dependendo de como o import resolveu a URL.
  const normalize = (value) =>
    value
      .split(", ")
      .map((entry) => entry.replace(/^\/+/, ""))
      .sort()
      .join(", ");

  if (normalize(preloadSrcset) !== normalize(pictureSrcset)) {
    throw new Error(
      `Preload e <picture> do hero de /${slug} apontam para arquivos diferentes:\n` +
        `  preload: ${preloadMatch[1]}\n  picture: ${pictureMatch[1]}`,
    );
  }
}

function assertContentPresent(html, slug) {
  // O h1 pode trazer marcação inline (`headlineMark` em configs.ts destaca uma
  // palavra com <em>), então o que se exige aqui é texto de verdade dentro da
  // tag, não um nó de texto único.
  const heading = html.match(/<h1 class="ad-lp-hero__title">([\s\S]*?)<\/h1>/);
  const headingText = heading ? heading[1].replace(/<[^>]+>/g, "").trim() : "";
  if (headingText.length < 10) {
    throw new Error(`H1 do hero não encontrado no HTML pré-renderizado de /${slug}`);
  }
  if (!html.includes('data-testid="ad-lp-cta-hero"')) {
    throw new Error(`CTA do hero não encontrado no HTML pré-renderizado de /${slug}`);
  }
}

export async function prerenderAdLps({ distDir = join(rootDir, "dist"), ssrDir = join(rootDir, "dist-ssr") } = {}) {
  const ssrEntry = join(ssrDir, "entry-server.js");
  if (!existsSync(ssrEntry)) {
    throw new Error(
      `Bundle SSR não encontrado: ${ssrEntry}. Rode antes: ` +
        `vite build --ssr src/features/ad-lps/entry-server.tsx --outDir dist-ssr`,
    );
  }

  const { render, renderMeta } = await import(`file://${ssrEntry}`);

  // Cada slug pré-renderizável já tem seu <slug>.html escrito por
  // adLandingStaticHtml (vite.config.ts) — dia-das-maes/dia-dos-namorados têm
  // entrada HTML própria e não aparecem aqui. Não reimplementa a lista de
  // slugs: reage ao que o build já escreveu.
  const slugFiles = readdirSync(distDir).filter(
    (file) => file.endsWith(".html") && file !== "index.html",
  );
  if (!slugFiles.length) {
    throw new Error(`Nenhum HTML de LP encontrado em ${distDir}`);
  }

  const written = [];

  for (const file of slugFiles) {
    const slug = file.replace(/\.html$/, "");
    const filePath = join(distDir, file);
    const originalHtml = readFileSync(filePath, "utf8");

    if (!ROOT_DIV_PATTERN.test(originalHtml)) {
      throw new Error(`<div id="root"></div> não encontrado em ${file} — já foi pré-renderizado?`);
    }

    const ssrMarkup = render(slug);
    const meta = renderMeta(slug);

    let html = originalHtml.replace(ROOT_DIV_PATTERN, `<div id="root">${ssrMarkup}</div>`);
    html = injectMetaTags(html, meta);

    assertHeroPreloadMatchesPicture(html, slug);
    assertContentPresent(html, slug);

    writeFileSync(filePath, html);
    written.push(file);
  }

  rmSync(ssrDir, { recursive: true, force: true });

  return { written };
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";
if (currentFile === invokedFile) {
  const { written } = await prerenderAdLps();
  process.stdout.write(`PASS prerender: ${written.length} HTML(s) pré-renderizados: ${written.join(", ")}\n`);
}
