import { describe, expect, it } from "vitest";
import { FALLBACK_REVIEWS } from "@/features/ad-lps/lib/reviews";
import { LP_CONFIGS, PRODUCTS } from "@/features/ad-lps/data/configs";

/**
 * Estas invariantes teriam pego o bug do vitrineHighlightId órfão de girassol
 * (apontava pra um produto fora da própria vitrine, então o destaque nunca
 * aparecia) e os 9 testimonialOrder com IDs inexistentes — silenciosamente,
 * sem quebrar nada visivelmente. Rodam para as 17 rotas, não só as 3 em
 * escopo, porque a mesma classe de erro pode voltar em qualquer config nova.
 */
const FALLBACK_REVIEW_IDS = new Set(FALLBACK_REVIEWS.map((review) => review.reviewId));

describe("ad-lp config invariants", () => {
  it("every product id in vitrineProductIds exists in PRODUCTS", () => {
    for (const config of Object.values(LP_CONFIGS)) {
      for (const id of config.vitrineProductIds) {
        expect({ slug: config.slug, id, exists: id in PRODUCTS }).toEqual({
          slug: config.slug,
          id,
          exists: true,
        });
      }
    }
  });

  it("vitrineHighlightId, when set, is one of the LP's own vitrineProductIds", () => {
    for (const config of Object.values(LP_CONFIGS)) {
      if (!config.vitrineHighlightId) continue;
      expect({
        slug: config.slug,
        highlightId: config.vitrineHighlightId,
        inOwnList: config.vitrineProductIds.includes(config.vitrineHighlightId),
      }).toEqual({
        slug: config.slug,
        highlightId: config.vitrineHighlightId,
        inOwnList: true,
      });
    }
  });

  it("every testimonialOrder id resolves to a real, always-available review", () => {
    for (const config of Object.values(LP_CONFIGS)) {
      for (const id of config.testimonialOrder) {
        expect({ slug: config.slug, id, isReal: FALLBACK_REVIEW_IDS.has(id) }).toEqual({
          slug: config.slug,
          id,
          isReal: true,
        });
      }
    }
  });

  it("variant overrides only ever point at real products and pillars", () => {
    for (const config of Object.values(LP_CONFIGS)) {
      if (!config.variants) continue;
      for (const [key, variant] of Object.entries(config.variants)) {
        if (variant.variantProductId) {
          expect({
            slug: config.slug,
            variant: key,
            productId: variant.variantProductId,
            exists: variant.variantProductId in PRODUCTS,
          }).toEqual({
            slug: config.slug,
            variant: key,
            productId: variant.variantProductId,
            exists: true,
          });
        }
        if (variant.vitrineHighlightId) {
          expect({
            slug: config.slug,
            variant: key,
            highlightId: variant.vitrineHighlightId,
            inOwnList: config.vitrineProductIds.includes(variant.vitrineHighlightId),
          }).toEqual({
            slug: config.slug,
            variant: key,
            highlightId: variant.vitrineHighlightId,
            inOwnList: true,
          });
        }
      }
    }
  });

  it("girassol highlights a sunflower product, not the orphaned buque-flor-campo-m", () => {
    expect(LP_CONFIGS.girassol.vitrineHighlightId).toBe("buque-girassois-g");
    expect(LP_CONFIGS.girassol.vitrineProductIds).toContain(
      LP_CONFIGS.girassol.vitrineHighlightId,
    );
  });

  it("girassol features the on-time-delivery review instead of the rosas one", () => {
    expect(LP_CONFIGS.girassol.testimonialOrder[0]).toBe("marcos-vinicius");
  });
});
