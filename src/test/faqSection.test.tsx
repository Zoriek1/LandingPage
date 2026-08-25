import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import FAQSection from "@/components/sections/FAQSection";
import { MOTHERS_DAY_CONFIG } from "@/features/mothers-day/config";
import { NAMORADOS_CONFIG } from "@/features/namorados/config";

afterEach(cleanup);

describe("FAQSection", () => {
  it("preserves the five home questions by default", () => {
    render(<FAQSection />);

    expect(screen.getByRole("heading", { name: "Perguntas Frequentes" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it.each([
    [MOTHERS_DAY_CONFIG.faq, "Até quando posso encomendar para entregar no Dia das Mães?"],
    [NAMORADOS_CONFIG.faq, "O cartão escrito à mão é grátis?"],
  ])("renders campaign questions through config", (config, question) => {
    render(<FAQSection config={config} />);

    expect(screen.getByRole("button", { name: question })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(6);
  });
});
