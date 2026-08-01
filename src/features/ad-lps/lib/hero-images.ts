import fachadaUrl from "@/assets/fachada.jpg";
import fachadaAvif480Url from "@/assets/generated/fachada-480.avif";
import fachadaAvif900Url from "@/assets/generated/fachada-900.avif";
import fachadaWebp480Url from "@/assets/generated/fachada-480.webp";
import fachadaWebp900Url from "@/assets/generated/fachada-900.webp";
import type { LPConfig } from "@/features/ad-lps/data/configs";

export type PictureSources = {
  avif480: string;
  avif900: string;
  webp480: string;
  webp900: string;
  fallbackSrc: string;
};

/** Preview de compartilhamento das LPs que ainda não têm foto própria. */
export const OG_FALLBACK_PATH = "/lpb/heros/default.jpg";

/** A fachada da loja: correta em Nossa História, e o fallback do hero. */
export const FACHADA_SOURCES: PictureSources = {
  avif480: fachadaAvif480Url,
  avif900: fachadaAvif900Url,
  webp480: fachadaWebp480Url,
  webp900: fachadaWebp900Url,
  fallbackSrc: fachadaUrl,
};

/**
 * Variantes de hero por LP, geradas por `npm run images` a partir de
 * assets-src/heros/<slug>.jpg. O glob é resolvido em tempo de build, então
 * slugs sem foto simplesmente não aparecem aqui.
 */
const HERO_VARIANTS = import.meta.glob<string>(
  "../../../assets/generated/hero-*.{avif,webp}",
  { eager: true, query: "?url", import: "default" },
);

function heroVariant(slug: string, width: 480 | 900, format: "avif" | "webp") {
  return HERO_VARIANTS[`../../../assets/generated/hero-${slug}-${width}.${format}`];
}

/**
 * Só o slug com as quatro variantes emitidas usa foto própria; os demais caem
 * na fachada. É o que permite migrar uma LP de cada vez conforme as fotos
 * chegam, sem quebrar as outras.
 */
export function getHeroSources(slug: string): PictureSources {
  const avif480 = heroVariant(slug, 480, "avif");
  const avif900 = heroVariant(slug, 900, "avif");
  const webp480 = heroVariant(slug, 480, "webp");
  const webp900 = heroVariant(slug, 900, "webp");

  if (!avif480 || !avif900 || !webp480 || !webp900) return FACHADA_SOURCES;
  return { avif480, avif900, webp480, webp900, fallbackSrc: webp900 };
}

export function hasOwnHeroImage(slug: string) {
  return getHeroSources(slug) !== FACHADA_SOURCES;
}

/**
 * config.heroImage aponta para /lpb/heros/<slug>.jpg, que só existe depois que
 * `npm run images` processa a foto daquela LP — e o script emite o jpg junto
 * com as variantes do <picture>, então a presença de uma implica a da outra.
 * Sem isso, o og:image caía num 404 e todo link compartilhado no WhatsApp
 * aparecia sem imagem.
 */
export function resolveOgImagePath(config: LPConfig) {
  return hasOwnHeroImage(config.slug) ? config.heroImage : OG_FALLBACK_PATH;
}
