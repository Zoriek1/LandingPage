import featuredProductsSnapshot from "@/features/namorados/data/featured-products.snapshot.json";
import type { FeaturedProduct } from "@/features/namorados/types";

export const FEATURED_PRODUCTS_ENDPOINT = "/dia-dos-namorados/featured-products.json";
export const FEATURED_PRODUCTS_SNAPSHOT = featuredProductsSnapshot as FeaturedProduct[];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isFeaturedProduct = (value: unknown): value is FeaturedProduct => {
  if (!isRecord(value)) {
    return false;
  }

  const pixPriceLabel = value.pixPriceLabel;

  return (
    isNonEmptyString(value.slug) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.url) &&
    typeof value.imageUrl === "string" &&
    isNonEmptyString(value.priceLabel) &&
    (pixPriceLabel === undefined || isNonEmptyString(pixPriceLabel))
  );
};

export const isFeaturedProductArray = (value: unknown): value is FeaturedProduct[] =>
  Array.isArray(value) && value.every(isFeaturedProduct);
