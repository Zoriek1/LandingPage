import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const FinalCTASection = () => (
  <section className="relative overflow-hidden bg-primary py-20 md:py-28">
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
        <h2 className="mx-auto mb-6 max-w-2xl font-display text-3xl font-bold leading-tight text-primary-foreground md:text-5xl">
          Escolha agora seu buquê e fale com a gente
        </h2>
        <p className="mx-auto mb-10 max-w-lg font-body text-lg text-primary-foreground/70">
          A gente responde rápido no WhatsApp, confirma a data e o endereço e manda foto do arranjo antes da entrega.
        </p>
        <Button
          type="button"
          size="xl"
          variant="accent"
          onClick={() =>
            openPriceRangeSelector({
              cta_location: "final_cta",
              cta_label: "encomendar_no_whatsapp",
              destination_url: WHATSAPP_URL,
            })
          }
        >
          <WhatsAppIcon size={20} />
          Encomendar pelo WhatsApp
          <ArrowRight size={18} />
        </Button>
      </motion.div>
    </div>
  </section>
);

export default FinalCTASection;
