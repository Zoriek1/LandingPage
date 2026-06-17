import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import catBuques from "@/assets/cat-buques.jpg";
import catPresentes from "@/assets/cat-presentes.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import catDatas from "@/assets/cat-datas.jpg";
import { trackSiteClick } from "@/lib/tracking";
import { CATALOG_URL } from "@/lib/config";

const categories = [
  { img: catBuques, title: "Buquês Românticos", span: "lg:col-span-2 lg:row-span-2" },
  { img: catPresentes, title: "Flores para Presente", span: "" },
  { img: catCestas, title: "Cestas & Kits Especiais", span: "" },
  { img: catPlantas, title: "Plantas & Arranjos", span: "" },
  { img: catDatas, title: "Datas Especiais", span: "" },
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
        <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Nossas Categorias
        </span>
        <h2 className="mb-4 font-display text-3xl font-semibold text-primary md:text-4xl">
          Para cada momento, o arranjo certo
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          Explore o catálogo e encontre o presente perfeito.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <motion.a
            key={cat.title}
            href={CATALOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackSiteClick({
                cta_location: "categorias",
                cta_label: "ver_no_site",
                destination_url: CATALOG_URL,
              })
            }
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`group relative aspect-[4/5] overflow-hidden rounded-2xl ${cat.span}`}
          >
            <img
              src={cat.img}
              alt={cat.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="mb-2 font-display text-xl font-semibold text-primary-foreground md:text-2xl">
                {cat.title}
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:bg-white/35">
                Ver no site
                <ArrowUpRight size={14} />
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
