import { motion } from "framer-motion";
import { Truck, Heart, CalendarHeart, MousePointerClick } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Entrega Rápida",
    desc: "Seus arranjos chegam frescos e no horário, com todo o cuidado que você espera.",
  },
  {
    icon: Heart,
    title: "Feitos com Carinho",
    desc: "Cada arranjo é montado à mão com flores selecionadas e atenção aos detalhes.",
  },
  {
    icon: CalendarHeart,
    title: "Todas as Ocasiões",
    desc: "Aniversários, datas especiais ou simplesmente porque sim — temos o arranjo ideal.",
  },
  {
    icon: MousePointerClick,
    title: "Compra Prática",
    desc: "Escolha pelo nosso site com facilidade e finalize seu pedido em poucos cliques.",
  },
];

const BenefitsSection = () => (
  <section className="py-20 md:py-28 bg-background">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Por que nos escolher?
        </h2>
        <p className="font-body text-muted-foreground max-w-md mx-auto">
          Cada detalhe é pensado para que sua experiência seja especial do início ao fim.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-secondary/50 rounded p-5 md:p-8 text-center group hover:shadow-lg transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <b.icon size={24} className="text-accent" />
            </div>
            <h3 className="font-display text-lg font-semibold text-primary mb-2">{b.title}</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
