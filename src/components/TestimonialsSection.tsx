import { motion } from "framer-motion";
import { Star } from "lucide-react";

const STAR_SLOTS = [0, 1, 2, 3, 4];

const testimonials = [
  {
    name: "Camila R.",
    text: "Chegou impecável e ficou ainda mais bonito do que eu esperava. Minha mãe amou!",
    stars: 5,
  },
  {
    name: "Rodrigo M.",
    text: "Atendimento excelente e flores lindíssimas. Surpreendi minha esposa no aniversário.",
    stars: 5,
  },
  {
    name: "Ana Paula S.",
    text: "Comprei para presentear minha sogra e foi um sucesso absoluto. Super recomendo!",
    stars: 5,
  },
  {
    name: "Fernanda L.",
    text: "Praticidade incrível! Escolhi pelo site, paguei em minutos e chegou perfeito.",
    stars: 5,
  },
];

const TestimonialsSection = () => (
  <section id="depoimentos" className="py-20 md:py-28 bg-primary">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary-foreground mb-4">
          O que nossos clientes dizem
        </h2>
        <p className="font-body text-primary-foreground/60 max-w-md mx-auto">
          A satisfação de quem confia na Plante Uma Flor.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-primary-foreground/10 backdrop-blur-sm rounded p-6"
          >
            <div className="flex gap-1 mb-4">
              {STAR_SLOTS.map((j) =>
                j < t.stars ? <Star key={j} size={16} className="fill-accent text-accent" /> : null,
              )}
            </div>
            <p className="font-body text-primary-foreground/80 text-sm leading-relaxed mb-4 italic">
              "{t.text}"
            </p>
            <p className="font-body text-accent text-sm font-semibold">{t.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
