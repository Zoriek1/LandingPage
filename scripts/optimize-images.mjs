/**
 * Gera as variantes de imagem que o bundle consome.
 *
 * Antes deste script os arquivos de src/assets/generated/ eram produzidos à mão,
 * o que explicava a fachada-900.avif com 81 KB para uma imagem de 900x675 — o
 * dobro do necessário, e ela é o elemento LCP das LPs no mobile.
 *
 *   npm run images
 *
 * Fontes:
 *   src/assets/fachada.jpg          -> fachada-{480,900}.{avif,webp}
 *   src/assets/logo.png             -> logo-240.webp
 *   assets-src/heros/<slug>.<ext>   -> hero-<slug>-{480,900}.{avif,webp}
 *                                      public/lpb/heros/<slug>.jpg  (og:image)
 *
 * Um slug sem foto em assets-src/heros/ simplesmente não gera nada; a LP
 * correspondente continua caindo na fachada (ver HERO_IMAGES em
 * src/features/ad-lps/AdLandingPage.tsx).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const GENERATED_DIR = join(root, "src/assets/generated");
const HERO_SOURCE_DIR = join(root, "assets-src/heros");
const OG_DIR = join(root, "public/lpb/heros");

/** Larguras servidas pelo <picture> do hero e da seção Nossa História. */
const HERO_WIDTHS = [480, 900];
const HERO_HEIGHT_RATIO = 675 / 900;

/**
 * Calibrado contra o aviso do PageSpeed: em q42 a fachada-900.avif sai com
 * ~40 KiB, exatamente a meta apontada (era 79,4 KiB). A margem existe porque a
 * imagem do hero fica atrás do overlay escuro, então artefato fino não aparece.
 * WebP é só o fallback de quem não tem AVIF e comprime bem pior.
 */
const AVIF = { quality: 42, effort: 6 };
const WEBP = { quality: 65, effort: 6 };

const SOURCE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function kib(path) {
  return `${(statSync(path).size / 1024).toFixed(1)} KiB`;
}

/** Emite as quatro variantes (2 larguras x avif/webp) de uma imagem. */
async function emitResponsiveVariants(sourcePath, outputPrefix) {
  const written = [];

  for (const width of HERO_WIDTHS) {
    const height = Math.round(width * HERO_HEIGHT_RATIO);
    const resized = sharp(sourcePath).resize(width, height, { fit: "cover" });

    const avifPath = join(GENERATED_DIR, `${outputPrefix}-${width}.avif`);
    const webpPath = join(GENERATED_DIR, `${outputPrefix}-${width}.webp`);

    await resized.clone().avif(AVIF).toFile(avifPath);
    await resized.clone().webp(WEBP).toFile(webpPath);

    written.push(avifPath, webpPath);
  }

  return written;
}

/** Preview de compartilhamento: o caminho que LPConfig.heroImage já declara. */
async function emitOgImage(sourcePath, slug) {
  ensureDir(OG_DIR);
  const target = join(OG_DIR, `${slug}.jpg`);
  await sharp(sourcePath)
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target);
  return target;
}

/** Lista canônica das LPs, lida do manifesto de rotas. */
function readAdLpSlugs() {
  const manifest = readFileSync(join(root, "src/routes/routeManifest.ts"), "utf8");
  const block = manifest.match(/AD_LP_SLUGS\s*=\s*\[([\s\S]*?)\]/);
  if (!block) throw new Error("AD_LP_SLUGS não encontrado em src/routes/routeManifest.ts");
  return [...block[1].matchAll(/"([a-z0-9-]+)"/g)].map((match) => match[1]);
}

function findHeroSources() {
  if (!existsSync(HERO_SOURCE_DIR)) return [];

  return readdirSync(HERO_SOURCE_DIR)
    .filter((file) => SOURCE_EXTENSIONS.includes(extname(file).toLowerCase()))
    .map((file) => ({
      slug: basename(file, extname(file)),
      path: join(HERO_SOURCE_DIR, file),
    }));
}

async function main() {
  ensureDir(GENERATED_DIR);

  const fachada = join(root, "src/assets/fachada.jpg");
  const written = await emitResponsiveVariants(fachada, "fachada");

  // Preview de compartilhamento das LPs sem foto própria; sem ele o og:image
  // dessas páginas responde 404 (ver OG_FALLBACK_PATH em AdLandingPage.tsx).
  written.push(await emitOgImage(fachada, "default"));

  const logoSource = join(root, "src/assets/logo.png");
  const logoTarget = join(GENERATED_DIR, "logo-240.webp");
  await sharp(logoSource).resize(240).webp(WEBP).toFile(logoTarget);
  written.push(logoTarget);

  const heroes = findHeroSources();
  for (const hero of heroes) {
    written.push(...(await emitResponsiveVariants(hero.path, `hero-${hero.slug}`)));
    written.push(await emitOgImage(hero.path, hero.slug));
  }

  for (const path of written) {
    process.stdout.write(`  ${path.slice(root.length + 1).replace(/\\/g, "/")}  ${kib(path)}\n`);
  }

  // Sem esta lista fica-se às cegas: uma LP sem foto não quebra nada, ela
  // apenas continua mostrando a fachada da loja — em silêncio.
  const slugs = readAdLpSlugs();
  const withPhoto = new Set(heroes.map((hero) => hero.slug));
  const missing = slugs.filter((slug) => !withPhoto.has(slug));
  const unknown = [...withPhoto].filter((slug) => !slugs.includes(slug));

  process.stdout.write(
    `\n${slugs.length - missing.length}/${slugs.length} LPs com foto própria.\n`,
  );

  if (missing.length) {
    process.stdout.write(
      `\nAinda na fachada (adicione assets-src/heros/<slug>.jpg e rode de novo):\n` +
        missing.map((slug) => `  ${slug}\n`).join(""),
    );
  }

  if (unknown.length) {
    process.stdout.write(
      `\nIgnorados — não batem com nenhuma rota de AD_LP_SLUGS:\n` +
        unknown.map((slug) => `  ${slug}\n`).join(""),
    );
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
