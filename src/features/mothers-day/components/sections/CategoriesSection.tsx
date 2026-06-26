import { motion } from "framer-motion";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import { WHATSAPP_URL } from "@/lib/config";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";

const categories = [
  {
    img: catBuques,
    title: "Buques para Mae",
    desc: "Lirios, rosas, girassois e arranjos mistos, montados a mao.",
  },
  {
    img: catCestas,
    title: "Cestas Especiais",
    desc: "Flores combinadas com chocolate, vinho, cafe da manha ou kit cuidado.",
  },
  {
    img: catPlantas,
    title: "Plantas e Vasos",
    desc: "Para maes que preferem ter o presente vivo por mais tempo.",
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
          Escolha com ajuda da floricultura
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          Toque em uma categoria e a gente ajuda a escolher pelo WhatsApp.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat, i) => (
          <motion.a
            key={cat.title}
            href={WHATSAPP_URL}
            onClick={(event) => {
              event.preventDefault();
              openGuidedWhatsApp({
                pageSlug: "dia-das-maes",
                pageLabel: "Dia das Maes",
                ctaLocation: "categorias",
                ctaLabel: `categoria_${cat.title.toLowerCase().replace(/\s+/g, "_")}`,
                request: `Quero ver opcoes de ${cat.title}. Pode me ajudar por faixa de preco e ocasiao?`,
              });
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative aspect-[4/5] overflow-hidden rounded"
          >
            
            <img
              src={cat.img}
              alt={cat.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="mb-2 font-display text-xl font-semibold text-primary-foreground md:text-2xl">
                {cat.title}
              </h3>
              <p className="font-body text-sm text-primary-foreground/85 mb-3 leading-relaxed">{cat.desc}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:bg-white/35">
                Quero ajuda
                
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
