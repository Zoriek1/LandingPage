import { CalendarCheck2, Sparkles, Truck } from "lucide-react";
import type { LPConfig } from "@/features/ad-lps/data/configs";

export function HeroBadges({ config }: { config: LPConfig }) {
  return (
    <ul className="ad-lp-hero__badges" aria-label="Diferenciais">
      <li>
        <Truck size={16} aria-hidden="true" />
        {config.slug === "urgencia"
          ? "Entrega hoje em Goiânia"
          : "Entrega ou agendamento em Goiânia"}
      </li>
      <li>
        <CalendarCheck2 size={16} aria-hidden="true" />
        Encomenda com data combinada
      </li>
      <li>
        <Sparkles size={16} aria-hidden="true" />
        Embalagem caprichada e cartão grátis
      </li>
    </ul>
  );
}
