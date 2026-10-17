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
 *   assets-src/loja-fisica/fachada-rua.jpg
 *                                   -> loja-fachada-mobile-{480,900} e
 *                                      loja-fachada-lado-{960,1360}.{avif,webp}
 *   assets-src/loja-fisica/categorias/<cat>-<n>.<ext>
 *                                   cat em vasos, adubos, terras, plantas; n = 1..N
 *                                   -> loja-cat-<cat>-<n>-{480,960}.{avif,webp}
 *                                      recorte cover 4:5 retrato (centralizado)
 *   assets-src/loja-fisica/faixas/<faixa>-<n>.<ext>
 *                                   faixa em ornamentais, vasos, historia, avaliacoes
 *                                   -> loja-faixa-<faixa>-<n>-{640,1200}.{avif,webp}
 *                                      recorte cover na proporção da tabela
 *                                      STORE_STRIP_RATIOS (uma por foto)
 *
 * As fotos da loja são lidas já orientadas pelo EXIF (foto de celular em pé
 * não sai deitada) e saem sem metadados. Nome fora do padrão, categoria ou
 * faixa desconhecida, foto sem proporção na tabela e numeração com buraco
 * aparecem no fim do log, porque a página referencia os nomes à mão.
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

const STORE_SOURCE_DIR = join(root, "assets-src/loja-fisica");

/**
 * Recortes da foto da rua para o hero de /loja-fisica/, em frações da foto.
 * O mobile fecha no portão aberto e no letreiro e deixa a fiação de fora.
 * O "lado" é a foto da metade direita do topo a partir de 640 px: portão,
 * corredor e letreiro, com a cerca da esquerda caindo na zona que dissolve
 * no creme. 1360 é a largura real da área na foto, então nada é ampliado.
 */
const STORE_FACADE_CROPS = [
  { name: "mobile", area: { left: 0.37, top: 0.3, width: 0.52, height: 0.69 }, widths: [480, 900] },
  { name: "lado", area: { left: 0.22, top: 0.25, width: 0.68, height: 0.75 }, widths: [960, 1360] },
];

/** Carrosséis das categorias: retrato 4:5, 480 px no celular e 960 px no desktop/retina. */
const STORE_CATEGORIES = ["vasos", "adubos", "terras", "plantas"];
const STORE_CATEGORY_WIDTHS = [480, 960];
const STORE_CATEGORY_RATIO = [4, 5];

/**
 * Faixas da loja: a proporção é por foto (largura:altura), porque cada faixa
 * mistura retrato e paisagem de propósito. Foto nova de faixa entra aqui antes
 * de entrar em assets-src/loja-fisica/faixas/.
 */
const STORE_STRIP_WIDTHS = [640, 1200];
const STORE_STRIP_RATIOS = {
  "ornamentais-1": [3, 2],
  "ornamentais-2": [4, 5],
  "ornamentais-3": [4, 5],
  "vasos-1": [4, 5],
  "vasos-2": [4, 5],
  "vasos-3": [4, 5],
  "vasos-4": [4, 5],
  "vasos-5": [4, 5],
  "historia-1": [4, 3],
  "historia-2": [4, 5],
  "historia-3": [4, 5],
  "avaliacoes-1": [4, 3],
};

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

/** Emite AVIF/WebP de uma área da foto (frações) nas larguras pedidas. */
async function emitCroppedVariants(sourcePath, area, widths, outputPrefix) {
  const { width, height } = await sharp(sourcePath).metadata();
  const region = {
    left: Math.round(area.left * width),
    top: Math.round(area.top * height),
    width: Math.round(area.width * width),
    height: Math.round(area.height * height),
  };
  const written = [];

  for (const target of widths) {
    const resized = sharp(sourcePath).extract(region).resize(target);
    const avifPath = join(GENERATED_DIR, `${outputPrefix}-${target}.avif`);
    const webpPath = join(GENERATED_DIR, `${outputPrefix}-${target}.webp`);
    await resized.clone().avif(AVIF).toFile(avifPath);
    await resized.clone().webp(WEBP).toFile(webpPath);
    written.push(avifPath, webpPath);
  }

  return written;
}

/** Emite AVIF/WebP em recorte cover (centralizado) na proporção [largura, altura]. */
async function emitCoverVariants(sourcePath, ratio, widths, outputPrefix) {
  const written = [];

  for (const width of widths) {
    const height = Math.round((width * ratio[1]) / ratio[0]);
    // rotate() sem ângulo aplica a orientação do EXIF antes do recorte.
    const resized = sharp(sourcePath).rotate().resize(width, height, { fit: "cover" });
    const avifPath = join(GENERATED_DIR, `${outputPrefix}-${width}.avif`);
    const webpPath = join(GENERATED_DIR, `${outputPrefix}-${width}.webp`);
    await resized.clone().avif(AVIF).toFile(avifPath);
    await resized.clone().webp(WEBP).toFile(webpPath);
    written.push(avifPath, webpPath);
  }

  return written;
}

/**
 * Lê <pasta>/<grupo>-<n>.<ext>. A página referencia esses nomes à mão, então
 * o que foge do padrão vai para `issues` em vez de sumir em silêncio.
 * `problemWith(grupo, nome)` devolve o motivo de recusa ou null.
 */
function listNumberedPhotos(folder, problemWith, issues) {
  const dir = join(STORE_SOURCE_DIR, folder);
  if (!existsSync(dir)) return [];

  const photos = [];
  for (const file of readdirSync(dir).sort()) {
    if (!SOURCE_EXTENSIONS.includes(extname(file).toLowerCase())) continue;

    const key = basename(file, extname(file));
    const match = key.match(/^([a-z]+)-(\d+)$/);
    const problem = match ? problemWith(match[1], key) : "nome fora do padrão <grupo>-<n>";
    if (problem) {
      issues.push(`${folder}/${file}: ${problem}`);
      continue;
    }

    photos.push({ key, group: match[1], n: Number(match[2]), path: join(dir, file) });
  }

  const numbersByGroup = new Map();
  for (const { group, n } of photos) numbersByGroup.set(group, [...(numbersByGroup.get(group) ?? []), n]);
  for (const [group, numbers] of numbersByGroup) {
    numbers.sort((a, b) => a - b);
    if (numbers.some((n, index) => n !== index + 1)) {
      issues.push(`${folder}/${group}: numeração com buraco ou repetida (${numbers.join(", ")}), esperado 1..${numbers.length}`);
    }
  }

  return photos;
}

/** Hero, categorias e faixas da loja física; pasta ausente não gera nada. */
async function emitStoreVariants() {
  const written = [];
  const issues = [];

  const facade = join(STORE_SOURCE_DIR, "fachada-rua.jpg");
  if (existsSync(facade)) {
    for (const crop of STORE_FACADE_CROPS) {
      written.push(...(await emitCroppedVariants(facade, crop.area, crop.widths, `loja-fachada-${crop.name}`)));
    }
  }

  const categoryPhotos = listNumberedPhotos(
    "categorias",
    (group) => (STORE_CATEGORIES.includes(group) ? null : `categoria desconhecida (use ${STORE_CATEGORIES.join(", ")})`),
    issues,
  );
  for (const photo of categoryPhotos) {
    written.push(...(await emitCoverVariants(photo.path, STORE_CATEGORY_RATIO, STORE_CATEGORY_WIDTHS, `loja-cat-${photo.key}`)));
  }

  const stripPhotos = listNumberedPhotos(
    "faixas",
    (group, key) => (Object.hasOwn(STORE_STRIP_RATIOS, key) ? null : "sem proporção em STORE_STRIP_RATIOS"),
    issues,
  );
  for (const photo of stripPhotos) {
    written.push(...(await emitCoverVariants(photo.path, STORE_STRIP_RATIOS[photo.key], STORE_STRIP_WIDTHS, `loja-faixa-${photo.key}`)));
  }

  const countBy = (photos, groups) =>
    groups.map((group) => `${group} ${photos.filter((photo) => photo.group === group).length}`).join(", ");
  const stripGroups = [...new Set(Object.keys(STORE_STRIP_RATIOS).map((key) => key.replace(/-\d+$/, "")))];
  const summary =
    `Loja física, categorias: ${countBy(categoryPhotos, STORE_CATEGORIES)}.\n` +
    `Loja física, faixas: ${countBy(stripPhotos, stripGroups)}.`;

  return { written, issues, summary };
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

  const store = await emitStoreVariants();
  written.push(...store.written);

  for (const path of written) {
    process.stdout.write(`  ${path.slice(root.length + 1).replace(/\\/g, "/")}  ${kib(path)}\n`);
  }

  process.stdout.write(`\n${store.summary}\n`);

  if (store.issues.length) {
    process.stdout.write(
      `\nFotos da loja ignoradas ou com problema (assets-src/loja-fisica/):\n` +
        store.issues.map((issue) => `  ${issue}\n`).join(""),
    );
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
