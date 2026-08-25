import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackToTop from "@/components/floating/BackToTop";

const { useScrollThreshold } = vi.hoisted(() => ({
  useScrollThreshold: vi.fn(),
}));

vi.mock("@/hooks/use-scroll-threshold", () => ({ useScrollThreshold }));

afterEach(cleanup);

describe("BackToTop", () => {
  it("stays hidden before the scroll threshold", () => {
    useScrollThreshold.mockReturnValue(false);
    render(<BackToTop />);
    expect(screen.queryByRole("button", { name: "Voltar ao topo" })).not.toBeInTheDocument();
  });

  it("scrolls smoothly to the top when visible", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    useScrollThreshold.mockReturnValue(true);
    render(<BackToTop />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(useScrollThreshold).toHaveBeenCalledWith(400);
  });
});
