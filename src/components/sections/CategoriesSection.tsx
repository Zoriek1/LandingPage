import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import catBuques from "@/assets/cat-buques.jpg";
import catPresentes from "@/assets/cat-presentes.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import catDatas from "@/assets/cat-datas.jpg";
import { openGuidedWhatsApp } from "@/lib/landing-whatsapp";

export type CategoryItem = {
  image: string;
  title: string;
  description?: string;
  featured?: boolean;
};

export type CategoriesSectionConfig = {
  eyebrow?: string;
  title: string;
  description: string;
  columns: 3 | 4;
  tracking: {
    pageSlug: string;
    pageLabel: string;
  };
  items: readonly CategoryItem[];
};

type CategoriesSectionProps = {
  config?: CategoriesSectionConfig;
};

const defaultConfig: CategoriesSectionConfig = {
  eyebrow: "Nossas Categorias",
  title: "Para cada momento, o arranjo certo",
  description: "Chame no WhatsApp e receba sugestoes por ocasiao, faixa de preco e data.",
  columns: 4,
  tracking: {
    pageSlug: "home",
    pageLabel: "buques",
  },
  items: [
    { image: catBuques, title: "Buques Romanticos", featured: true },
    { image: catPresentes, title: "Flores para Presente" },
    { image: catCestas, title: "Cestas & Kits Especiais" },
    { image: catPlantas, title: "Plantas & Arranjos" },
    { image: catDatas, title: "Datas Especiais" },
  ],
};

const CategoriesSection = ({ config = defaultConfig }: CategoriesSectionProps) => (
  <section id="categorias" className="bg-secondary/30 py-section-y">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-14 text-center md:mb-16"
      >
        {config.eyebrow && (
          <span className="mb-4 inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 font-body text-eyebrow font-semibold uppercase text-accent">
            {config.eyebrow}
          </span>
        )}
        <h2 className="mb-4 font-display text-h2 font-semibold text-primary">
          {config.title}
        </h2>
        <p className="mx-auto max-w-md font-body text-muted-foreground">
          {config.description}
        </p>
      </motion.div>

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 ${config.columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
      >
        {config.items.map((category, index) => (
          <motion.button
            key={category.title}
            type="button"
            onClick={() => {
              openGuidedWhatsApp({
                ...config.tracking,
                ctaLocation: "categorias",
                ctaLabel: `categoria_${category.title.toLowerCase().replace(/\s+/g, "_")}`,
                request: `Quero ver opcoes de ${category.title}. Pode me ajudar por faixa de preco e ocasiao?`,
              });
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className={`group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-0 p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${category.featured ? "lg:col-span-2 lg:row-span-2" : ""}`}
          >
            <img
              src={category.image}
              alt={category.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="mb-2 font-display text-h3 font-semibold text-primary-foreground">
                {category.title}
              </h3>
              {category.description && (
                <p className="mb-3 font-body text-sm leading-relaxed text-primary-foreground/85">
                  {category.description}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:bg-white/35">
                Quero ajuda
                <ArrowUpRight size={14} />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  </section>
);

export default CategoriesSection;
