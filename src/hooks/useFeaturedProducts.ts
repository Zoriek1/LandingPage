import { useEffect, useState } from "react";
import {
  FEATURED_PRODUCTS_ENDPOINT,
  FEATURED_PRODUCTS_SNAPSHOT,
  isFeaturedProductArray,
} from "@/lib/featured-products";
import type { FeaturedProduct } from "@/types/featured-product";

type UseFeaturedProductsResult = {
  products: FeaturedProduct[];
  isRefreshing: boolean;
};

export type FeaturedProductsSource = {
  endpoint: string;
  snapshot: FeaturedProduct[];
};

const defaultSource: FeaturedProductsSource = {
  endpoint: FEATURED_PRODUCTS_ENDPOINT,
  snapshot: FEATURED_PRODUCTS_SNAPSHOT,
};

export const useFeaturedProducts = (
  source: FeaturedProductsSource = defaultSource,
): UseFeaturedProductsResult => {
  const { endpoint, snapshot } = source;
  const [products, setProducts] = useState<FeaturedProduct[]>(snapshot);
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    setProducts(snapshot);
    setIsRefreshing(true);
    let isMounted = true;
    const controller = new AbortController();

    const syncProducts = async () => {
      try {
        const response = await fetch(endpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Unable to load featured products: ${response.status}`);
        }

        const nextProducts: unknown = await response.json();

        if (!isFeaturedProductArray(nextProducts)) {
          throw new Error("Invalid featured products payload");
        }

        if (isMounted) {
          setProducts(nextProducts);
        }
      } catch {
        if (isMounted) {
          setProducts(snapshot);
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    };

    void syncProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [endpoint, snapshot]);

  return { products, isRefreshing };
};
