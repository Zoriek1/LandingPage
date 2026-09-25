import { afterEach, describe, expect, it, vi } from "vitest";
import { getStoreStatus, googleDirections, calculateDrivingDistance } from "../loja-fisica/store";

afterEach(() => vi.unstubAllGlobals());

describe("horário da loja em Goiânia", () => {
  it.each([
    ["2026-09-25T10:59:00Z", false, "08h"],
    ["2026-09-25T11:00:00Z", true, "18h"],
    ["2026-09-25T21:00:00Z", false, "sábado"],
    ["2026-09-26T15:59:00Z", true, "13h"],
    ["2026-09-26T16:00:00Z", false, "segunda"],
    ["2026-09-27T15:00:00Z", false, "segunda"],
    ["2026-09-28T02:00:00Z", false, "segunda"],
  ])("%s", (date, open, label) => {
    const status = getStoreStatus(new Date(date));
    expect(status.open).toBe(open);
    expect(status.label).toContain(label);
  });
});

it("mantém o destino fixo e só inclui origem quando autorizada", () => {
  const anonymous = new URL(googleDirections());
  expect(anonymous.searchParams.has("origin")).toBe(false);
  const located = new URL(googleDirections({ latitude: -16.7, longitude: -49.2 }));
  expect(located.searchParams.get("origin")).toBe("-16.7,-49.2");
  expect(located.searchParams.get("destination")).toBe("Rua 132 289 Setor Sul Goiania GO");
  expect(located.searchParams.get("travelmode")).toBe("driving");
});

it("retorna a distância de carro sem persistir coordenadas", async () => {
  const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, distancia_km: 4.2, duracao_min: 12, provider: "google_routes" }) });
  vi.stubGlobal("fetch", request);
  const result = await calculateDrivingDistance({ latitude: -16.7, longitude: -49.2 });
  expect(result).toEqual({ distance: 4.2, duration: 12 });
  expect(request.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "omit", body: '{"latitude":-16.7,"longitude":-49.2}' });
});

it.each([
  { success: true, distancia_km: 4.2, provider: "haversine" },
  { success: true, distancia_km: -1, provider: "google_routes" },
  { success: false },
])("não apresenta resultado inválido como distância de carro", async (payload) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
  await expect(calculateDrivingDistance({ latitude: 0, longitude: 0 })).rejects.toThrow();
});

it.each([429, 503])("trata HTTP %s sem inventar distância", async (status) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
  await expect(calculateDrivingDistance({ latitude: 0, longitude: 0 })).rejects.toThrow();
});
