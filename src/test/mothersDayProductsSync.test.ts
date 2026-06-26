// @vitest-environment node

import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import sources from "@/features/mothers-day/data/featured-product-sources.json";
import { buildFeaturedProductsData } from "../../scripts/mothers-day-products/sync.mjs";
import { parseFeaturedProductPage } from "../../scripts/mothers-day-products/product-parser.mjs";

const fixturePath = fileURLToPath(
  new URL("./fixtures/mothers-day-product.fixture.html", import.meta.url),
);

const loadFixture = async () => fs.readFile(fixturePath, "utf-8");

const titleFromUrl = (url: string) =>
  new URL(url)
    .pathname
    .split("/")
    .filter(Boolean)
    .at(-1)!
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");

const formatPrice = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const buildFixtureVariant = async (index: number, url: string) => {
  const html = await loadFixture();
  const price = 189.9 + index * 10;
  const pixPrice = Number((price * 0.97).toFixed(2));
  const expectedTitle = titleFromUrl(url);

  return html
    .replaceAll("Buque de Teste", expectedTitle)
    .replaceAll("R$189,90", formatPrice(price))
    .replaceAll("R$184,20", formatPrice(pixPrice))
    .replaceAll(
      "https://cdn.planteumaflor.com/imagens/buque-teste.webp",
      `https://cdn.planteumaflor.com/imagens/buque-teste-${index + 1}.webp`,
    )
    .replaceAll("https://www.planteumaflor.com/produtos/buque-de-teste/", url);
};

describe("mothers-day product sync", () => {
  it("extracts title, image, price and pix price from a product page", async () => {
    const html = await loadFixture();

    const product = parseFeaturedProductPage({
      html,
      url: "https://www.planteumaflor.com/produtos/buque-de-teste/",
    });

    expect(product).toEqual({
      slug: "buque-de-teste",
      title: "Buque de Teste",
      url: "https://www.planteumaflor.com/produtos/buque-de-teste/",
      canonicalUrl: "https://www.planteumaflor.com/produtos/buque-de-teste/",
      imageUrl: "https://cdn.planteumaflor.com/imagens/buque-teste.webp",
      priceLabel: "R$ 189,90",
      pixPriceLabel: "R$ 184,20",
    });
  });

  it("builds a valid dataset for the six curated products", async () => {
    const snapshot = sources.map((source, index) => ({
      slug: `fallback-${index + 1}`,
      title: `Fallback ${index + 1}`,
      url: source.url,
      imageUrl: "",
      priceLabel: "R$ 100,00",
    }));

    const dataset = await buildFeaturedProductsData({
      sources,
      snapshot,
      fetchHtml: async (url: string) => {
        const index = sources.findIndex((source) => source.url === url);
        return buildFixtureVariant(index, url);
      },
      logger: {
        info: () => {},
        warn: () => {},
      },
    });

    expect(dataset).toHaveLength(6);
    expect(dataset[0]).toEqual(
      expect.objectContaining({
        slug: new URL(sources[0].url).pathname.split("/").filter(Boolean).at(-1),
        title: titleFromUrl(sources[0].url),
        url: sources[0].url,
      }),
    );

    dataset.forEach((product) => {
      expect(product.slug).toBeTruthy();
      expect(product.title).toBeTruthy();
      expect(product.url.startsWith("https://www.planteumaflor.com/produtos/")).toBe(true);
      expect(product.priceLabel.startsWith("R$ ")).toBe(true);
    });
  });

  it("falls back to the snapshot when the fetched page does not match the requested product", async () => {
    const fallbackProduct = {
      slug: "buque-de-teste",
      title: "Fallback correto",
      url: "https://www.planteumaflor.com/produtos/buque-de-teste/",
      imageUrl: "https://cdn.planteumaflor.com/imagens/fallback.webp",
      priceLabel: "R$ 149,90",
    };

    const dataset = await buildFeaturedProductsData({
      sources: [{ url: fallbackProduct.url }],
      snapshot: [fallbackProduct],
      fetchHtml: async () => {
        const html = await loadFixture();
        return html.replaceAll("Buque de Teste", "Produto errado");
      },
      logger: {
        info: () => {},
        warn: () => {},
      },
    });

    expect(dataset).toEqual([fallbackProduct]);
  });
});
