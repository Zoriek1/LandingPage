import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";

const GuaranteeSection = () => (
  <section className="bg-secondary/40 py-20 md:py-28">
    <div className="container">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mx-auto flex max-w-3xl flex-col items-center rounded-[28px] border border-accent/20 bg-background px-6 py-12 text-center shadow-[0_24px_60px_rgba(15,27,22,0.08)] md:px-12 md:py-14"
      >
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/12 text-accent">
          <ShieldCheck size={34} strokeWidth={1.6} />
        </span>
        <span className="mb-4 inline-flex items-center rounded-full border border-accent/25 bg-accent/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Garantia Plante Uma Flor
        </span>
        <h2 className="mb-4 max-w-xl font-display text-2xl font-semibold text-primary md:text-3xl">
          Você aprova a foto antes da entrega.
        </h2>
        <p className="mb-9 max-w-xl font-body text-sm leading-7 text-muted-foreground md:text-base">
          Antes de sair da loja, mandamos a foto real do arranjo pronto. Se algo não sair como combinado, resolvemos no mesmo dia pelo WhatsApp.
        </p>
        <button
          onClick={() =>
            openPriceRangeSelector({
              cta_location: "guarantee",
              cta_label: "ver_detalhes_garantia",
              destination_url: WHATSAPP_URL,
            })
          }
          className="inline-flex items-center justify-center rounded-2xl border border-primary/20 bg-transparent px-8 py-4 font-body text-sm font-semibold uppercase tracking-wide text-primary transition-all hover:bg-primary hover:text-primary-foreground"
        >
          Ver detalhes da garantia
        </button>
      </motion.div>
    </div>
  </section>
);

export default GuaranteeSection;
