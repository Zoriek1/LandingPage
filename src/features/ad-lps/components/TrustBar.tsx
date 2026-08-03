import { CalendarCheck2, Camera, CreditCard, Star, Store } from "lucide-react";
import { GLOBAL_CONFIG, type LPConfig } from "@/features/ad-lps/data/configs";

/**
 * Faixa de confiança do hero. Vive acima da dobra porque cada item responde uma
 * objeção que aparecia no WhatsApp antes do primeiro "quanto custa".
 */
export function TrustBar({ config }: { config: LPConfig }) {
  const items = [
    {
      key: "rating",
      icon: <Star size={15} fill="currentColor" aria-hidden="true" />,
      label: `${GLOBAL_CONFIG.googleRating} no Google (${GLOBAL_CONFIG.googleReviewsCount} avaliações)`,
    },
    {
      key: "store",
      icon: <Store size={15} aria-hidden="true" />,
      label: "Loja física em Goiânia",
    },
    {
      key: "photo",
      icon: <Camera size={15} aria-hidden="true" />,
      label: "Você aprova a foto",
    },
    {
      key: "payment",
      icon: <CreditCard size={15} aria-hidden="true" />,
      label: "Pix ou parcelado em 3x",
    },
  ];

  if (config.trustBarNote) {
    items.push({
      key: "note",
      icon: <CalendarCheck2 size={15} aria-hidden="true" />,
      label: config.trustBarNote,
    });
  }

  return (
    <ul className="ad-lp-trustbar" data-testid="ad-lp-trustbar" aria-label="Motivos para confiar">
      {items.map((item) => (
        <li className="ad-lp-trustbar__item" key={item.key}>
          <span className="ad-lp-trustbar__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
