import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FinalCTASection from "@/components/sections/FinalCTASection";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";
import { WHATSAPP_URL } from "@/lib/config";

const { openPriceRangeSelector } = vi.hoisted(() => ({
  openPriceRangeSelector: vi.fn(),
}));

vi.mock("@/lib/price-ranges", () => ({
  openPriceRangeSelector,
}));

afterEach(cleanup);

describe("FinalCTASection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [undefined, "Escolha agora seu buquê e fale com a gente", undefined, "encomendar_no_whatsapp"],
    [
      MOTHERS_DAY_CONFIG.finalCta,
      "Escolha o buquê e a gente entrega no domingo.",
      undefined,
      "pedir_pelo_whatsapp",
    ],
    [
      NAMORADOS_CONFIG.finalCta,
      "Não deixa pra última hora. Garante a surpresa de 12/06.",
      "dia-dos-namorados",
      "encomendar_agora",
    ],
  ])("renders and tracks each configured CTA", (config, title, lpSlug, ctaLabel) => {
    render(<FinalCTASection config={config} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Encomendar pelo WhatsApp/i }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      ...(lpSlug ? { lp_slug: lpSlug } : {}),
      cta_location: "final_cta",
      cta_label: ctaLabel,
      destination_url: WHATSAPP_URL,
    });
  });
});
