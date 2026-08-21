import type { LPConfig } from "@/features/ad-lps/data/configs";

const WEEKDAY_CUTOFF_MINUTES: Record<string, number> = {
  "seg.": 18 * 60,
  "ter.": 18 * 60,
  "qua.": 18 * 60,
  "qui.": 18 * 60,
  "sex.": 18 * 60,
  "sab.": 13 * 60,
};

function saoPauloParts(now: Date): { weekday: string; minutesSinceMidnight: number } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const weekday = value("weekday")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const minutesSinceMidnight = Number(value("hour")) * 60 + Number(value("minute"));

  return { weekday, minutesSinceMidnight };
}

export function resolveUrgencyMessage(config: LPConfig, now: Date = new Date()): string | null {
  const window = config.urgencyWindow;
  if (!window) return null;

  const { weekday, minutesSinceMidnight } = saoPauloParts(now);

  if (weekday === "dom.") return window.afterCutoff;

  const cutoff = WEEKDAY_CUTOFF_MINUTES[weekday];
  if (cutoff === undefined) return window.afterCutoff;

  return minutesSinceMidnight < cutoff ? window.beforeCutoff : window.afterCutoff;
}
