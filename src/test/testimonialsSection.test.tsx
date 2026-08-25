import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";

afterEach(cleanup);

describe("TestimonialsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("keeps Google reviews with a static fallback on the home page", () => {
    render(<TestimonialsSection />);

    expect(screen.getByText(/Google 4.9 · 203 avaliações/i)).toBeInTheDocument();
    expect(screen.getByText("Camila R.")).toBeInTheDocument();
  });

  it.each([
    [MOTHERS_DAY_CONFIG.testimonials, "Histórias de quem já presenteou pelo Dia das Mães", 4],
    [NAMORADOS_CONFIG.testimonials, "Quem encomendou no ano passado", 3],
  ])("renders static campaign testimonials without fetching", (config, title, itemCount) => {
    render(<TestimonialsSection config={config} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(itemCount);
    expect(fetch).not.toHaveBeenCalled();
  });
});
