import { useEffect, useState } from "react";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * `false` no SSR e na primeira renderização do cliente — os anúncios só
 * rodam em horário comercial, então "antes do corte" é o estado seguro pra
 * não divergir do HTML pré-renderizado. O valor real só chega depois do
 * primeiro `useEffect`, mesmo padrão de useHydrated/useResolvedConfig.
 */
export function useIsPastCutoff(cutoffHour = 18): boolean {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const update = () => {
      const hour = Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Sao_Paulo",
          hour: "numeric",
          hour12: false,
        }).format(new Date()),
      );
      setIsPast(hour >= cutoffHour);
    };

    update();
    const id = window.setInterval(update, FIVE_MINUTES_MS);
    return () => window.clearInterval(id);
  }, [cutoffHour]);

  return isPast;
}
