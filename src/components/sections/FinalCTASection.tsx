import { motion } from "framer-motion";
import { trackSiteClick } from "@/lib/tracking";
import { CATALOG_URL } from "@/lib/config";

const FinalCTASection = () => (
  <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
    {/* Decorative circle */}
    <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full border border-accent/10" />
    <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full border border-accent/10" />

    <div className="container relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6 max-w-2xl mx-auto leading-tight">
          Escolha agora o presente perfeito no nosso site
        </h2>
        <p className="font-body text-primary-foreground/70 text-lg mb-10 max-w-lg mx-auto">
          Veja o catálogo completo e encontre flores especiais para cada momento.
        </p>
        <a
          href={CATALOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackSiteClick({
              cta_location: "final_cta",
              cta_label: "acessar_o_site",
              destination_url: CATALOG_URL,
            })
          }
          className="inline-block bg-accent text-accent-foreground px-10 py-5 rounded font-body text-base font-bold tracking-widest uppercase hover:brightness-110 transition-all shadow-lg"
        >
          Acessar o Site
        </a>
      </motion.div>
    </div>
  </section>
);

export default FinalCTASection;
