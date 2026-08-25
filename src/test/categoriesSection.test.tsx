import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CategoriesSection from "@/components/sections/CategoriesSection";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";

const { openGuidedWhatsApp } = vi.hoisted(() => ({
  openGuidedWhatsApp: vi.fn(),
}));

vi.mock("@/lib/landing-whatsapp", () => ({
  openGuidedWhatsApp,
}));

afterEach(cleanup);

describe("CategoriesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves the home content and tracking when no campaign config is provided", () => {
    render(<CategoriesSection />);

    expect(screen.getByText("Nossas Categorias")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: /Buques Romanticos/i }));

    expect(openGuidedWhatsApp).toHaveBeenCalledWith({
      pageSlug: "home",
      pageLabel: "buques",
      ctaLocation: "categorias",
      ctaLabel: "categoria_buques_romanticos",
      request:
        "Quero ver opcoes de Buques Romanticos. Pode me ajudar por faixa de preco e ocasiao?",
    });
  });

  it.each([
    [
      MOTHERS_DAY_CONFIG.categories,
      "Escolha com ajuda da floricultura",
      "Buques para Mae",
      "dia-das-maes",
    ],
    [
      NAMORADOS_CONFIG.categories,
      "Escolha a surpresa que combina com voces",
      "Surpresas combo",
      "dia-dos-namorados",
    ],
  ])(
    "renders and tracks campaign categories through config",
    (config, title, categoryTitle, pageSlug) => {
      render(<CategoriesSection config={config} />);

      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: categoryTitle })).toBeInTheDocument();
      expect(screen.queryByText("Nossas Categorias")).not.toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);

      fireEvent.click(screen.getByRole("button", { name: new RegExp(categoryTitle, "i") }));
      expect(openGuidedWhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({ pageSlug, ctaLocation: "categorias" }),
      );
    },
  );
});
