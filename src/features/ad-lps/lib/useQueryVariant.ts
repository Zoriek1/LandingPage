import { useEffect, useMemo, useState } from "react";
import type { LPConfig } from "@/features/ad-lps/data/configs";
import { onAnalyticsPageView, recordAnalytics } from "@/analytics";
import { safeDimension } from "../../../../shared/analytics-contract";

/**
 * `undefined` no SSR e na primeira renderização do cliente (o prerender roda em
 * Node, sem `window`, e o `useEffect` só executa depois do mount) — batendo
 * sempre com o HTML estático. O valor real só chega depois de montado, num
 * único re-render, o mesmo padrão já usado por `useHydrated`/`useGoogleReviews`
 * em AdLandingPage.tsx.
 */
export function useQueryParam(name: string, resetKey?: string): string | null | undefined {
  const [value, setValue] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const read = () => setValue(new URLSearchParams(window.location.search).get(name));
    read();
    // Voltar/avançar no histórico muda só a query sem remontar a LP.
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [name, resetKey]);

  return value;
}

/**
 * Resolve a config final da LP a partir do parâmetro de variante da URL.
 * Parâmetro ausente ou valor sem variante configurada devolve `config`
 * inalterada — nunca quebra, nunca inventa produto.
 */
export function useResolvedConfig(config: LPConfig): LPConfig {
  const raw = useQueryParam(config.variantParam ?? "oferta", config.slug);

  return useMemo(() => {
    const variant = raw ? config.variants?.[raw] : undefined;
    return variant ? { ...config, ...variant } : config;
  }, [config, raw]);
}

/**
 * Evento próprio do coletor, emitido só com a oferta resolvida (parâmetro lido
 * no cliente, nunca no SSR) e a página visível. Tenta de novo a cada page_view
 * real do coletor (consentimento concedido, navegação SPA, restauração) e ao
 * voltar a ficar visível; a deduplicação por pageview/param/key/state é do
 * coletor. Independe do trackVariantSeen comercial (dataLayer).
 */
export function useOfferVariantSeen(config: LPConfig): void {
  const param = config.variantParam ?? "oferta";
  const raw = useQueryParam(param, config.slug);

  useEffect(() => {
    if (raw === undefined) return;
    const key = raw && config.variants?.[raw] ? raw : undefined;
    const productId = key ? config.variants?.[key]?.variantProductId : undefined;
    const props = {
      variant_param: safeDimension(param) ? param : "oferta",
      variant_key: key && safeDimension(key) ? key : raw ? "invalid" : "base",
      variant_state: key && safeDimension(key) ? "configured" : raw ? "invalid_fallback" : "base",
      ...(productId && safeDimension(productId) ? { variant_product_id: productId } : {}),
    };
    const attempt = () => {
      if (document.visibilityState !== "visible") return;
      try {
        recordAnalytics("offer_variant_seen", props);
      } catch {
        /* Analytics nunca quebra a página. */
      }
    };

    attempt();
    const unsubscribe = onAnalyticsPageView(attempt);
    document.addEventListener("visibilitychange", attempt);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", attempt);
    };
  }, [raw, config, param]);
}
