export type Coordinates = { latitude: number; longitude: number };

export const STORE_DESTINATION = "Rua 132 289 Setor Sul Goiania GO";
export const DISTANCE_ENDPOINT = "https://planteumaflor.gestaoonline.app.br/api/landing/distancia-loja";

export function googleDirections(origin?: Coordinates): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", STORE_DESTINATION);
  url.searchParams.set("travelmode", "driving");
  if (origin) url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  return url.href;
}

export function getStoreStatus(now = new Date()): { open: boolean; label: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (key: string) => parts.find((p) => p.type === key)?.value;
  const day = part("weekday");
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  const closing = day === "Sat" ? 13 : 18;
  const open = day !== "Sun" && minutes >= 8 * 60 && minutes < closing * 60;
  if (open) return { open, label: `Loja aberta hoje até ${closing}h` };
  if (day !== "Sun" && minutes < 8 * 60) return { open, label: "Loja fechada · abre hoje às 08h" };
  const next = day === "Fri" ? "sábado" : day === "Sat" || day === "Sun" ? "segunda" : "amanhã";
  return { open, label: `Loja fechada · abre ${next} às 08h` };
}

export async function calculateDrivingDistance(origin: Coordinates): Promise<{ distance: number; duration?: number }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(DISTANCE_ENDPOINT, {
      method: "POST", credentials: "omit", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(origin), signal: controller.signal, cache: "no-store",
    });
    if (!response.ok) throw new Error(response.status === 429 ? "limit" : "unavailable");
    const data = await response.json();
    if (!data.success || data.provider !== "google_routes" || typeof data.distancia_km !== "number" || !Number.isFinite(data.distancia_km) || data.distancia_km < 0) {
      throw new Error("unavailable");
    }
    return {
      distance: data.distancia_km,
      duration: typeof data.duracao_min === "number" && Number.isFinite(data.duracao_min) && data.duracao_min >= 0 ? data.duracao_min : undefined,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
