import { Camera, CreditCard, Flower2, Truck } from "lucide-react";
import type { Reassurance } from "@/features/ad-lps/data/configs";

const ICONS = {
  truck: Truck,
  camera: Camera,
  flower: Flower2,
  card: CreditCard,
} as const;

/**
 * As objeções de um visitante frio (frete, prova do produto, disponibilidade,
 * pagamento) ficam abertas por padrão, sem `<details>`: escondidas atrás de um
 * clique elas não quebram objeção nenhuma. Fica no topo da vitrine — o ponto em
 * que a pessoa começa a comparar preço.
 */
export function ReassuranceStrip({ items }: { items: Reassurance[] }) {
  return (
    <ul className="ad-lp-reassure" data-testid="ad-lp-reassurance-strip">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li className="ad-lp-reassure__item" key={item.title}>
            <span className="ad-lp-reassure__icon" aria-hidden="true">
              <Icon size={20} strokeWidth={1.8} />
            </span>
            <h3 className="ad-lp-reassure__title">{item.title}</h3>
            <p className="ad-lp-reassure__body">{item.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
