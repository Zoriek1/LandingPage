import snapshotJson from "@/data/lily-products.snapshot.json";
import type {
  LilyCatalogSnapshot,
  LilyProductFamilyKey,
  LilyProductSnapshot,
  LilyProductSize,
} from "@/types/lily-catalog";

const SIZE_ORDER: LilyProductSize[] = ["P", "M", "G"];

function isCompleteFamily(family: LilyCatalogSnapshot["families"][LilyProductFamilyKey]) {
  return (
    family?.products?.length === 3 &&
    SIZE_ORDER.every((size) =>
      family.products.some(
        (product) =>
          product.size === size &&
          /^R\$ \d{1,3}(?:\.\d{3})*,\d{2}$/.test(product.priceBrl) &&
          /^https:\/\//.test(product.image),
      ),
    )
  );
}

const parsedSnapshot = snapshotJson as LilyCatalogSnapshot;

if (
  parsedSnapshot.schemaVersion !== 1 ||
  !isCompleteFamily(parsedSnapshot.families.arranjo) ||
  !isCompleteFamily(parsedSnapshot.families.buque)
) {
  throw new Error("Snapshot de lírios incompleto ou inválido");
}

export const LILY_CATALOG_SNAPSHOT = parsedSnapshot;

export const LILY_PRODUCTS: LilyProductSnapshot[] = (["arranjo", "buque"] as const).flatMap(
  (family) =>
    [...LILY_CATALOG_SNAPSHOT.families[family].products].sort(
      (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size),
    ),
);

export const LILY_PRODUCTS_BY_ID = Object.fromEntries(
  LILY_PRODUCTS.map((product) => [product.id, product]),
) as Record<string, LilyProductSnapshot>;

export function lilyFamilyProducts(family: LilyProductFamilyKey) {
  return LILY_PRODUCTS.filter((product) => product.family === family);
}
