import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HeroSection from "@/components/sections/HeroSection";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";
import { WHATSAPP_URL } from "@/lib/config";

const { openPriceRangeSelector } = vi.hoisted(() => ({
  openPriceRangeSelector: vi.fn(),
}));

vi.mock("@/lib/price-ranges", () => ({
  openPriceRangeSelector,
}));

describe("HeroSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the canonical home content by default", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("heading", {
        name: "Buquês e arranjos sob encomenda, entregues com cuidado em Goiânia",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /encomendar pelo whatsapp/i }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      cta_location: "hero",
      cta_label: "encomendar_no_whatsapp",
      destination_url: WHATSAPP_URL,
    });
  });

  it("renders Mothers Day content and tracking from config", () => {
    render(<HeroSection config={MOTHERS_DAY_CONFIG.hero} />);

    expect(
      screen.getByRole("heading", {
        name: "Buquês, cestas e plantas para o Dia das Mães em Goiânia",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /encomendar pelo whatsapp/i }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      cta_location: "hero",
      cta_label: "pedir_pelo_whatsapp",
      destination_url: WHATSAPP_URL,
    });
  });

  it("preserves the Namorados landing-page slug in conversion tracking", () => {
    render(<HeroSection config={NAMORADOS_CONFIG.hero} />);

    expect(
      screen.getByRole("heading", {
        name: "Surpreenda no Dia dos Namorados, sem stress de última hora",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /encomendar pelo whatsapp/i }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      lp_slug: "dia-dos-namorados",
      cta_location: "hero",
      cta_label: "pedir_pelo_whatsapp",
      destination_url: WHATSAPP_URL,
    });
  });
});
