import { motion } from "framer-motion";
import { Search, MessageCircle, Heart } from "lucide-react";

const steps = [
  { icon: Search, num: "01", title: "Escolha no Catálogo", desc: "Navegue pelo nosso catálogo e encontre o arranjo perfeito." },
  { icon: MessageCircle, num: "02", title: "Encomende no WhatsApp", desc: "Confirme data, endereço e mensagem do cartão. A gente cuida do resto." },
  { icon: Heart, num: "03", title: "Encante quem Você Ama", desc: "Mandamos foto do arranjo pronto antes de sair pra entrega." },
];

const ProcessSection = () => (
  <section className="bg-background py-20 md:py-28">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center md:mb-16"
      >
        <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Como Funciona
        </span>
        <h2 className="mb-4 font-display text-3xl font-semibold text-primary md:text-4xl">
          Três passos simples
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          Do catálogo à entrega, sem complicação.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3 md:gap-12">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="relative text-center"
          >
            <div className="mb-2 font-display text-7xl font-bold text-accent/20">{s.num}</div>
            <div className="relative z-10 mx-auto -mt-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <s.icon size={28} className="text-accent" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-primary">{s.title}</h3>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProcessSection;
