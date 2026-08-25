import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import BenefitsSection from "@/components/sections/BenefitsSection";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";

afterEach(cleanup);

describe("BenefitsSection", () => {
  it("preserves the home content when no campaign config is provided", () => {
    render(<BenefitsSection />);

    expect(screen.getByText("Por que a Plante Uma Flor")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cuidado em cada detalhe" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });

  it.each([
    [MOTHERS_DAY_CONFIG.benefits, "Escolha no catálogo. O resto a gente resolve.", "Montado à mão, no dia"],
    [
      NAMORADOS_CONFIG.benefits,
      "Surpresa garantida, sem stress de última hora.",
      "Cartão escrito à mão grátis",
    ],
  ])("renders the campaign content through config", (config, title, campaignBenefit) => {
    render(<BenefitsSection config={config} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: campaignBenefit })).toBeInTheDocument();
    expect(screen.queryByText("Por que a Plante Uma Flor")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
  });
});
