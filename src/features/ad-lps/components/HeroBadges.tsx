import { CalendarCheck2, Camera, MapPin, Sparkles, Truck } from "lucide-react";
import type { HeroBadge, LPConfig } from "@/features/ad-lps/data/configs";

const DEFAULT_BADGES: HeroBadge[] = [
  { text: "Entrega ou agendamento em Goiânia", icon: "truck" },
  { text: "Encomenda com data combinada", icon: "calendar" },
  { text: "Embalagem caprichada e cartão grátis", icon: "sparkles" },
];

const URGENCIA_BADGES: HeroBadge[] = [
  { text: "Entrega hoje em Goiânia", icon: "truck" },
  ...DEFAULT_BADGES.slice(1),
];

const ICONS = {
  truck: Truck,
  calendar: CalendarCheck2,
  sparkles: Sparkles,
  camera: Camera,
  "map-pin": MapPin,
} as const;

export function HeroBadges({ config }: { config: LPConfig }) {
  const badges =
    config.heroBadges ??
    (config.slug === "urgencia" ? URGENCIA_BADGES : DEFAULT_BADGES);

  return (
    <ul className="ad-lp-hero__badges" aria-label="Diferenciais">
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon ?? "sparkles"];
        return (
          <li key={badge.text}>
            <Icon size={16} aria-hidden="true" />
            {badge.text}
          </li>
        );
      })}
    </ul>
  );
}
