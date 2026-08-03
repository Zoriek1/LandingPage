import type { LucideIcon } from "lucide-react";

export type DifferentialPillar = {
  num: string;
  Icon: LucideIcon;
  title: string;
  body: string;
};

export function DifferentialCard({ pillar }: { pillar: DifferentialPillar }) {
  return (
    <li className="ad-lp-process__item">
      <span className="ad-lp-process__num" aria-hidden="true">{pillar.num}</span>
      <span className="ad-lp-process__icon" aria-hidden="true">
        <pillar.Icon size={26} strokeWidth={1.6} />
      </span>
      <h3>{pillar.title}</h3>
      <p>{pillar.body}</p>
    </li>
  );
}
