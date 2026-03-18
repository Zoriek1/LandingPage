import { motion } from "framer-motion";
import { Search, CreditCard, Heart } from "lucide-react";

const steps = [
  { icon: Search, num: "01", title: "Escolha no Site", desc: "Navegue pelo nosso catálogo e encontre o arranjo perfeito." },
  { icon: CreditCard, num: "02", title: "Finalize seu Pedido", desc: "Compra rápida e segura com diversas formas de pagamento." },
  { icon: Heart, num: "03", title: "Encante quem Você Ama", desc: "Entregamos com cuidado para surpreender quem importa." },
];

const ProcessSection = () => (
  <section className="py-20 md:py-28 bg-background">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Como Funciona
        </h2>
        <p className="font-body text-muted-foreground max-w-md mx-auto">
          Três passos simples para presentear com flores especiais.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="text-center relative"
          >
            <div className="text-accent/20 font-display text-7xl font-bold mb-2">{s.num}</div>
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 -mt-10 relative z-10">
              <s.icon size={28} className="text-accent" />
            </div>
            <h3 className="font-display text-xl font-semibold text-primary mb-2">{s.title}</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProcessSection;
