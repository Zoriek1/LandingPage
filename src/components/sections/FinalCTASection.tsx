import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export type FinalCTASectionConfig = {
  eyebrow?: string;
  title: string;
  description: string;
  buttonLabel: string;
  tracking: {
    lpSlug?: string;
    ctaLabel: string;
  };
};

type FinalCTASectionProps = {
  config?: FinalCTASectionConfig;
};

const defaultConfig: FinalCTASectionConfig = {
  title: "Escolha agora seu buquê e fale com a gente",
  description:
    "A gente responde rápido no WhatsApp, confirma a data e o endereço e manda foto do arranjo antes da entrega.",
  buttonLabel: "Encomendar pelo WhatsApp",
  tracking: {
    ctaLabel: "encomendar_no_whatsapp",
  },
};

const FinalCTASection = ({ config = defaultConfig }: FinalCTASectionProps) => (
  <section className="relative overflow-hidden bg-primary py-section-y">
    {/* Círculos decorativos */}
    <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full border border-accent/10" />
    <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full border border-accent/10" />

    <div className="container relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        {config.eyebrow && (
          <span className="mb-5 inline-block rounded-full bg-accent px-4 py-1.5 font-body text-eyebrow font-semibold uppercase text-accent-foreground">
            {config.eyebrow}
          </span>
        )}
        <h2 className="mx-auto mb-6 max-w-2xl font-display text-h1 font-semibold leading-tight text-primary-foreground">
          {config.title}
        </h2>
        <p className="mx-auto mb-10 max-w-lg font-body text-lg text-primary-foreground/70">
          {config.description}
        </p>
        <Button
          type="button"
          size="xl"
          variant="accent"
          onClick={() =>
            openPriceRangeSelector({
              ...(config.tracking.lpSlug ? { lp_slug: config.tracking.lpSlug } : {}),
              cta_location: "final_cta",
              cta_label: config.tracking.ctaLabel,
              destination_url: WHATSAPP_URL,
            })
          }
        >
          <WhatsAppIcon size={20} />
          {config.buttonLabel}
          <ArrowRight size={18} />
        </Button>
      </motion.div>
    </div>
  </section>
);

export default FinalCTASection;
