import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "@/components/layout/Navbar";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";
import { WHATSAPP_URL } from "@/lib/config";

const { openGuidedWhatsApp, openPriceRangeSelector } = vi.hoisted(() => ({
  openGuidedWhatsApp: vi.fn(),
  openPriceRangeSelector: vi.fn(),
}));

vi.mock("@/hooks/use-scroll-threshold", () => ({
  useScrollThreshold: () => false,
}));

vi.mock("@/lib/landing-whatsapp", () => ({ openGuidedWhatsApp }));
vi.mock("@/lib/price-ranges", () => ({ openPriceRangeSelector }));

afterEach(cleanup);

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves the home links and guided CTA", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: "Sobre" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Me ajude a escolher" })[0]);
    expect(openGuidedWhatsApp).toHaveBeenCalledWith(
      expect.objectContaining({ pageSlug: "home", ctaLocation: "navbar_desktop" }),
    );
  });

  it.each([
    [MOTHERS_DAY_CONFIG.navbar, "dia-das-maes", undefined],
    [NAMORADOS_CONFIG.navbar, "dia-dos-namorados", "dia-dos-namorados"],
  ])("uses campaign navigation and mobile tracking", (config, pageSlug, mobileLpSlug) => {
    render(<Navbar config={config} />);

    expect(screen.queryByRole("link", { name: "Sobre" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Falar no WhatsApp" }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      ...(mobileLpSlug ? { lp_slug: mobileLpSlug } : {}),
      cta_location: "navbar_mobile",
      cta_label: "falar_no_whatsapp",
      destination_url: WHATSAPP_URL,
    });
    expect(config.guided.pageSlug).toBe(pageSlug);
  });
});
