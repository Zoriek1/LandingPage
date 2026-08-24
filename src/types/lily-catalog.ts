export type LilyProductSize = "P" | "M" | "G";

export type LilyProductFamilyKey = "arranjo" | "buque";

export type LilyProductSnapshot = {
  id: string;
  family: LilyProductFamilyKey;
  size: LilyProductSize;
  storeSlug: string;
  name: string;
  priceBrl: string;
  image: string;
  waText: string;
};

export type LilyFamilySnapshot = {
  sourceUrl: string;
  products: [LilyProductSnapshot, LilyProductSnapshot, LilyProductSnapshot];
};

export type LilyCatalogSnapshot = {
  schemaVersion: 1;
  families: Record<LilyProductFamilyKey, LilyFamilySnapshot>;
};
