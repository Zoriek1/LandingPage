import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsPastCutoff } from "@/features/ad-lps/lib/useCutoffCopy";

// A garantia "SSR-safe" (nunca diverge do HTML pré-renderizado) é validada
// em adLandingSsr.test.ts: sob renderToString não há window, o useEffect
// nunca roda, e a página sempre sai com o estado padrão "antes do corte".
// Aqui só cobrimos que o hook converge pro valor certo depois de montado —
// renderHook/act do React 18 já flusha o primeiro efeito antes de devolver
// o resultado, então não dá pra observar o instante pré-efeito num teste.
describe("useIsPastCutoff", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("flips to true after mount when the real time is past 18h America/Sao_Paulo", async () => {
    vi.useFakeTimers();
    // 22:00 UTC = 19:00 America/Sao_Paulo (UTC-3)
    vi.setSystemTime(new Date("2026-08-10T22:00:00Z"));

    const { result } = renderHook(() => useIsPastCutoff());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe(true);
  });

  it("stays false after mount when the real time is before 18h America/Sao_Paulo", async () => {
    // 19:00 UTC = 16:00 America/Sao_Paulo
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T19:00:00Z"));

    const { result } = renderHook(() => useIsPastCutoff());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe(false);
  });
});
