import { useEffect, useMemo, useState } from "react";
import type { LPConfig } from "@/features/ad-lps/data/configs";

/**
 * `null` no SSR e na primeira renderização do cliente (o prerender roda em
 * Node, sem `window`, e o `useEffect` só executa depois do mount) — batendo
 * sempre com o HTML estático. O valor real só chega depois de montado, num
 * único re-render, o mesmo padrão já usado por `useHydrated`/`useGoogleReviews`
 * em AdLandingPage.tsx.
 */
export function useQueryParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);

  return value;
}

/**
 * Resolve a config final da LP a partir do parâmetro de variante da URL.
 * Parâmetro ausente ou valor sem variante configurada devolve `config`
 * inalterada — nunca quebra, nunca inventa produto.
 */
export function useResolvedConfig(config: LPConfig): LPConfig {
  const raw = useQueryParam(config.variantParam ?? "oferta");

  return useMemo(() => {
    const variant = raw ? config.variants?.[raw] : undefined;
    return variant ? { ...config, ...variant } : config;
  }, [config, raw]);
}
