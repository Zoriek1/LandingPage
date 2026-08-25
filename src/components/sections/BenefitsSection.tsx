import { motion } from "framer-motion";
import {
  Truck,
  Heart,
  CalendarHeart,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";

export type BenefitItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type BenefitsSectionConfig = {
  eyebrow?: string;
  title: string;
  description: string;
  items: readonly BenefitItem[];
};

type BenefitsSectionProps = {
  config?: BenefitsSectionConfig;
};

const defaultConfig: BenefitsSectionConfig = {
  eyebrow: "Por que a Plante Uma Flor",
  title: "Cuidado em cada detalhe",
  description: "Pensamos cada etapa para que sua experiência seja especial do início ao fim.",
  items: [
    {
      icon: Truck,
      title: "Entrega Cuidadosa",
      description:
        "Seus arranjos chegam frescos e no horário combinado, com todo o cuidado que você espera.",
    },
    {
      icon: Heart,
      title: "Feitos com Carinho",
      description: "Cada arranjo é montado à mão com flores selecionadas e atenção aos detalhes.",
    },
    {
      icon: CalendarHeart,
      title: "Todas as Ocasiões",
      description:
        "Aniversários, datas especiais ou simplesmente porque sim. Temos o arranjo ideal.",
    },
    {
      icon: MousePointerClick,
      title: "Compra Prática",
      description: "Escolha pelo catálogo e confirme pelo WhatsApp em poucos minutos.",
    },
  ],
};

const BenefitsSection = ({ config = defaultConfig }: BenefitsSectionProps) => (
  <section className="bg-background py-section-y">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 text-center md:mb-16"
      >
        {config.eyebrow && (
          <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-eyebrow font-semibold uppercase text-accent">
            {config.eyebrow}
          </span>
        )}
        <h2 className="mb-4 font-display text-h2 font-semibold text-primary">
          {config.title}
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          {config.description}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {config.items.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group rounded-2xl border border-border bg-secondary/40 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_18px_40px_hsl(var(--primary)_/_0.08)] md:p-8"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
              <benefit.icon size={24} className="text-accent" />
            </div>
            <h3 className="mb-2 font-display text-h5 font-semibold text-primary">
              {benefit.title}
            </h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
