import { useEffect, useState } from "react";
import {
  FEATURED_PRODUCTS_ENDPOINT,
  FEATURED_PRODUCTS_SNAPSHOT,
  isFeaturedProductArray,
} from "@/features/mothers-day/lib/featured-products";
import type { FeaturedProduct } from "@/features/mothers-day/types";

type UseFeaturedProductsResult = {
  products: FeaturedProduct[];
  isRefreshing: boolean;
};

export const useFeaturedProducts = (): UseFeaturedProductsResult => {
  const [products, setProducts] = useState<FeaturedProduct[]>(FEATURED_PRODUCTS_SNAPSHOT);
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const syncProducts = async () => {
      try {
        const response = await fetch(FEATURED_PRODUCTS_ENDPOINT, {
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
          setProducts(FEATURED_PRODUCTS_SNAPSHOT);
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
  }, []);

  return { products, isRefreshing };
};
