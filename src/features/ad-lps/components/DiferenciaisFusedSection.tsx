import { Camera, Gift, MessageCircle, Sprout } from "lucide-react";
import { DifferentialCard, type DifferentialPillar } from "./DifferentialCard";

/**
 * Funde "Por que somos diferentes" e "Por que nos escolher?" num bloco só.
 * As duas seções repetiam foto-antes-da-entrega, cartão grátis e garantia em
 * pontos distantes da página; junto, o argumento cabe numa rolagem.
 */
const MERGED_DIFFERENTIALS: DifferentialPillar[] = [
  {
    num: "01",
    Icon: Sprout,
    title: "Flores direto do produtor",
    body:
      "Recebidas 3× por semana, montamos na hora com a mesma flor que colocaríamos na nossa casa.",
  },
  {
    num: "02",
    Icon: Camera,
    title: "Foto antes da entrega",
    body:
      "Mandamos a foto real do arranjo pronto no WhatsApp. Só sai depois que você aprova.",
  },
  {
    num: "03",
    Icon: Gift,
    title: "Embalagem artesanal + cartão grátis",
    body:
      "Papel artesanal, fita de cetim e o recado escrito à mão, por conta da casa.",
  },
  {
    num: "04",
    Icon: MessageCircle,
    title: "Atendimento humano e garantia",
    body:
      "Quem responde no WhatsApp é da floricultura. Não gostou? Refazemos, trocamos ou devolvemos no mesmo dia.",
  },
];

export function DiferenciaisFusedSection() {
  return (
    <section id="diferenciais" className="ad-lp-process" aria-label="Por que somos diferentes">
      <header className="ad-lp-section-head">
        <h2>Por que somos diferentes</h2>
        <p>O cuidado de uma floricultura tradicional, com o frescor e a transparência que você merece.</p>
      </header>
      <ol className="ad-lp-process__grid ad-lp-process__grid--four">
        {MERGED_DIFFERENTIALS.map((pillar) => (
          <DifferentialCard pillar={pillar} key={pillar.num} />
        ))}
      </ol>
    </section>
  );
}
