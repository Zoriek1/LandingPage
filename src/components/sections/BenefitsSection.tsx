import { motion } from "framer-motion";
import { Truck, Heart, CalendarHeart, MousePointerClick } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Entrega Cuidadosa",
    desc: "Seus arranjos chegam frescos e no horário combinado, com todo o cuidado que você espera.",
  },
  {
    icon: Heart,
    title: "Feitos com Carinho",
    desc: "Cada arranjo é montado à mão com flores selecionadas e atenção aos detalhes.",
  },
  {
    icon: CalendarHeart,
    title: "Todas as Ocasiões",
    desc: "Aniversários, datas especiais ou simplesmente porque sim. Temos o arranjo ideal.",
  },
  {
    icon: MousePointerClick,
    title: "Compra Prática",
    desc: "Escolha pelo catálogo e confirme pelo WhatsApp em poucos minutos.",
  },
];

const BenefitsSection = () => (
  <section className="bg-background py-20 md:py-28">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-14 text-center md:mb-16"
      >
        <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Por que a Plante Uma Flor
        </span>
        <h2 className="mb-4 font-display text-3xl font-semibold text-primary md:text-4xl">
          Cuidado em cada detalhe
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          Pensamos cada etapa para que sua experiência seja especial do início ao fim.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group rounded-2xl border border-border bg-secondary/40 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_18px_40px_rgba(15,27,22,0.08)] md:p-8"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
              <b.icon size={24} className="text-accent" />
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold text-primary">{b.title}</h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
