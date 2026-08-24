import { describe, expect, it } from "vitest";
import { resolveDeliveryTiming } from "@/features/ad-lps/lib/urgency";

describe("mensagem do horário de entrega", () => {
  it.each([
    ["antes da abertura", "2026-08-24T09:00:00Z", "before-opening", "abre às 8h"],
    ["segunda ativa", "2026-08-24T18:20:00Z", "active", "Faltam 2h 40min"],
    ["segunda após 18h", "2026-08-24T22:00:00Z", "after-cutoff", "encerraram às 18h"],
    ["sábado ativo", "2026-08-22T14:00:00Z", "active", "Faltam 2h"],
    ["sábado após 13h", "2026-08-22T17:00:00Z", "after-cutoff", "encerraram às 13h"],
    ["domingo", "2026-08-23T15:00:00Z", "closed", "fechada aos domingos"],
  ])("resolve %s no fuso de São Paulo", (_label, iso, status, message) => {
    const timing = resolveDeliveryTiming(new Date(iso));
    expect(timing.status).toBe(status);
    expect(timing.message).toContain(message);
  });

  it("não promete uma data específica no domingo", () => {
    const timing = resolveDeliveryTiming(new Date("2026-08-23T15:00:00Z"));
    expect(timing.message).not.toMatch(/amanhã|segunda-feira|próximo dia útil/i);
  });
});
