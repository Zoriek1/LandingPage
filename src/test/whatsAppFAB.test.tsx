import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WhatsAppFAB from "@/components/floating/WhatsAppFAB";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";
import { WHATSAPP_URL } from "@/lib/config";

const { openPriceRangeSelector } = vi.hoisted(() => ({
  openPriceRangeSelector: vi.fn(),
}));

vi.mock("@/lib/price-ranges", () => ({ openPriceRangeSelector }));

afterEach(cleanup);

describe("WhatsAppFAB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [undefined, "Falar no WhatsApp", undefined],
    [MOTHERS_DAY_CONFIG.whatsAppFab, "Encomendar pelo WhatsApp", undefined],
    [NAMORADOS_CONFIG.whatsAppFab, "Encomendar pelo WhatsApp", "dia-dos-namorados"],
  ])("renders and tracks the configured floating CTA", (config, ariaLabel, lpSlug) => {
    render(<WhatsAppFAB config={config} />);
    fireEvent.click(screen.getByRole("button", { name: ariaLabel }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      ...(lpSlug ? { lp_slug: lpSlug } : {}),
      cta_location: "whatsapp_fab",
      cta_label: "floating_button",
      destination_url: WHATSAPP_URL,
    });
  });
});
