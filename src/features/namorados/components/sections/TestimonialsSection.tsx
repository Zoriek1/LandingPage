import { motion } from "framer-motion";
import { Star } from "lucide-react";

const STAR_SLOTS = [0, 1, 2, 3, 4];

const testimonials = [
  {
    name: "Lucas M.",
    date: "Junho/2025",
    text: "Encomendei pra surpreender minha namorada no trabalho. Chegou no horário combinado, com a foto antes pra eu conferir o cartão. Ela se emocionou demais.",
    stars: 5,
  },
  {
    name: "Mariana P.",
    date: "Junho/2025",
    text: "Comprei pro meu namorado, fora do óbvio. Pediram a mensagem do cartão, mandaram foto do arranjo pronto e ele me ligou emocionado quando chegou no trabalho. Recomendo de olhos fechados.",
    stars: 5,
  },
  {
    name: "Diego R.",
    date: "Junho/2025",
    text: "Esqueci do Dia dos Namorados (eu sei, eu sei). Pedi no fim da tarde pelo WhatsApp e eles entregaram no mesmo dia. Salvaram meu casamento.",
    stars: 5,
  },
];

const TestimonialsSection = () => (
  <section id="depoimentos" className="py-20 md:py-28 bg-background">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-3">
          Quem encomendou no ano passado
        </h2>
        <p className="font-body text-muted-foreground max-w-md mx-auto">
          Depoimentos reais de clientes do Dia dos Namorados anterior.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="bg-secondary/40 rounded p-7 flex flex-col gap-4"
          >
            <div className="flex gap-1">
              {STAR_SLOTS.map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={s < t.stars ? "fill-accent text-accent" : "text-muted"}
                />
              ))}
            </div>
            <blockquote className="font-body text-sm leading-relaxed text-foreground/85">
              “{t.text}”
            </blockquote>
            <figcaption className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t.name} · {t.date}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
