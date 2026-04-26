import { motion } from "framer-motion";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import { trackSiteClick } from "@/lib/tracking";
import { SITE_URL } from "@/lib/config";

const categories = [
  {
    img: catBuques,
    title: "Buquês para Mãe",
    desc: "Lírios, rosas, girassóis e arranjos mistos, montados à mão.",
  },
  {
    img: catCestas,
    title: "Cestas Especiais",
    desc: "Flores combinadas com chocolate, vinho, café da manhã ou kit cuidado.",
  },
  {
    img: catPlantas,
    title: "Plantas e Vasos",
    desc: "Para mães que preferem ter o presente vivo por mais tempo.",
  },
];

const CategoriesSection = () => (
  <section id="categorias" className="py-20 md:py-28 bg-secondary/30">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Escolha pelo catálogo
        </h2>
        <p className="font-body text-muted-foreground max-w-md mx-auto">
          Toque para ver os arranjos e os preços.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat, i) => (
          <motion.a
            key={cat.title}
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackSiteClick({
                cta_location: "categorias",
                cta_label: "ver_no_site",
                destination_url: SITE_URL,
              })
            }
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded aspect-[4/5]"
          >
            <img
              src={cat.img}
              alt={cat.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-display text-xl md:text-2xl font-semibold text-primary-foreground mb-2">
                {cat.title}
              </h3>
              <p className="font-body text-sm text-primary-foreground/85 mb-3 leading-relaxed">
                {cat.desc}
              </p>
              <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full group-hover:bg-white/35 transition-colors">
                Ver no site →
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
