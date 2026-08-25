import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Footer from "@/components/layout/Footer";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";
import { WHATSAPP_URL } from "@/lib/config";

const { openPriceRangeSelector } = vi.hoisted(() => ({
  openPriceRangeSelector: vi.fn(),
}));

vi.mock("@/lib/price-ranges", () => ({ openPriceRangeSelector }));

afterEach(cleanup);

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    [undefined, "Flores que transformam momentos em memorias."],
    [MOTHERS_DAY_CONFIG.footer, "Floricultura em Goiania. Montado a mao, entregue no horario."],
    [NAMORADOS_CONFIG.footer, "Floricultura em Goiania. Montado a mao, entregue no horario."],
  ])("renders the configured tagline", (config, tagline) => {
    render(<Footer config={config} />);
    expect(screen.getByText(tagline)).toBeInTheDocument();
  });

  it("preserves the Namorados WhatsApp campaign slug", () => {
    render(<Footer config={NAMORADOS_CONFIG.footer} />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));

    expect(openPriceRangeSelector).toHaveBeenCalledWith({
      lp_slug: "dia-dos-namorados",
      cta_location: "footer",
      cta_label: "icone_whatsapp",
      destination_url: WHATSAPP_URL,
    });
  });
});
