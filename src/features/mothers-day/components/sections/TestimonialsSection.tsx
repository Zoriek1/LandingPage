import { motion } from "framer-motion";
import { Star } from "lucide-react";

const STAR_SLOTS = [0, 1, 2, 3, 4];

const testimonials = [
  {
    name: "Camila R.",
    date: "Maio/2025",
    text: "Encomendei pro Dia das Mães do ano passado. Chegou no horário e minha mãe chorou. Ano que vem peço de novo.",
    stars: 5,
  },
  {
    name: "Ana Paula S.",
    date: "Maio/2025",
    text: "Comprei pra minha sogra e foi um sucesso. Mandaram a foto antes de entregar, achei super profissional. Recomendo demais.",
    stars: 5,
  },
  {
    name: "Rodrigo M.",
    date: "Junho/2025",
    text: "Moro fora de Goiânia e queria surpreender minha mãe. Combinamos tudo pelo WhatsApp e a entrega saiu certinha.",
    stars: 5,
  },
  {
    name: "Fernanda L.",
    date: "Maio/2024",
    text: "Cesta linda, bem caprichada. Minha mãe adorou os chocolates junto com o buquê. Atendimento de primeira.",
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
          Histórias de quem já presenteou pelo Dia das Mães
        </h2>
        <p className="font-body text-primary-foreground/60 max-w-md mx-auto">
          Famílias que voltaram pra um segundo Dia das Mães com a gente.
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
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-body text-accent text-sm font-semibold">{t.name}</p>
              <span className="font-body text-primary-foreground/40 text-xs">{t.date}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
