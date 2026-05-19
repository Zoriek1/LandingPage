import { motion } from "framer-motion";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import { trackSiteClick } from "@/lib/tracking";
import { NAMORADOS_URL } from "@/lib/config";

const categories = [
  {
    img: catBuques,
    title: "Buquês românticos",
    desc: "Rosas vermelhas, brancas, lírios e mistos. Montados à mão no dia da entrega.",
  },
  {
    img: catCestas,
    title: "Cestas com vinho & bombons",
    desc: "Flores combinadas com vinho, chocolates Lindt, espumante ou café da manhã romântico.",
  },
  {
    img: catPlantas,
    title: "Surpresas combo",
    desc: "Buquê + cartão escrito à mão + balão metalizado ou pelúcia. Pronto para emocionar.",
  },
];

const CategoriesSection = () => (
  <section id="categorias" className="py-20 md:py-28 bg-secondary/30">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
          Escolha a surpresa que combina com vocês
        </h2>
        <p className="font-body text-muted-foreground max-w-lg mx-auto">
          Do clássico buquê de rosas ao combo completo com vinho e cartão. Tudo entregue pronto, com foto antes.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 md:gap-8">
        {categories.map((c, i) => (
          <motion.a
            key={c.title}
            href={NAMORADOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackSiteClick({
                cta_location: "categories",
                cta_label: `categoria_${c.title.toLowerCase().replace(/\s+/g, "_")}`,
                destination_url: NAMORADOS_URL,
              })
            }
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="group relative overflow-hidden rounded bg-background shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={c.img}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-primary mb-2">{c.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
