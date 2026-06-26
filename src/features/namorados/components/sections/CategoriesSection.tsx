import { motion } from "framer-motion";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import { WHATSAPP_URL } from "@/lib/config";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";

const categories = [
  {
    img: catBuques,
    title: "Buques romanticos",
    desc: "Rosas vermelhas, brancas, lirios e mistos. Montados a mao no dia da entrega.",
  },
  {
    img: catCestas,
    title: "Cestas com vinho & bombons",
    desc: "Flores combinadas com vinho, chocolates Lindt, espumante ou cafe da manha romantico.",
  },
  {
    img: catPlantas,
    title: "Surpresas combo",
    desc: "Buque + cartao escrito a mao + balao metalizado ou pelucia. Pronto para emocionar.",
  },
];

const CategoriesSection = () => (
  <section id="categorias" className="bg-secondary/30 py-20 md:py-28">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center md:mb-16"
      >
        
        <h2 className="mb-4 font-display text-3xl font-semibold text-primary md:text-4xl">
          Escolha a surpresa que combina com voces
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          Do buque classico ao combo completo. A gente ajuda a comparar no WhatsApp.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {categories.map((cat, i) => (
          <motion.a
            key={cat.title}
            href={WHATSAPP_URL}
            onClick={(event) => {
              event.preventDefault();
              openGuidedWhatsApp({
                pageSlug: "dia-dos-namorados",
                pageLabel: "Dia dos Namorados",
                ctaLocation: "categorias",
                ctaLabel: `categoria_${cat.title.toLowerCase().replace(/\s+/g, "_")}`,
                request: `Quero ver opcoes de ${cat.title}. Pode me ajudar por faixa de preco e ocasiao?`,
              });
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded bg-background shadow-md transition-shadow hover:shadow-xl"
          >
            <div className="aspect-[4/5] overflow-hidden">
            <img
              src={cat.img}
              alt={cat.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              decoding="async"
            />
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-primary mb-2">
                {cat.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
              
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
