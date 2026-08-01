import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const FinalCTASection = () => (
  <section className="py-20 md:py-28 bg-primary relative overflow-hidden">
    <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full border border-accent/10" />
    <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full border border-accent/10" />

    <div className="container relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <span className="inline-block bg-accent text-accent-foreground px-4 py-1.5 rounded-full font-body text-xs font-bold tracking-widest uppercase mb-5">
          Últimos dias para encomendar
        </span>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6 max-w-2xl mx-auto leading-tight">
          Escolha o buquê e a gente entrega no domingo.
        </h2>
        <p className="font-body text-primary-foreground/70 text-lg mb-10 max-w-lg mx-auto">
          Você manda o produto pelo WhatsApp e a gente confirma endereço, horário e pagamento na hora.
        </p>
        <Button
          type="button"
          size="xl"
          variant="accent"
          onClick={() =>
            openPriceRangeSelector({
              cta_location: "final_cta",
              cta_label: "pedir_pelo_whatsapp",
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
