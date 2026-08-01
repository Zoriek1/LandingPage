import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { openNamoradosWhatsApp } from "@/features/namorados/lib/whatsapp";
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
          Não deixa pra última hora. Garante a surpresa de 12/06.
        </h2>
        <p className="font-body text-primary-foreground/85 max-w-xl mx-auto mb-10 leading-relaxed">
          Manda mensagem no WhatsApp e a gente confirma tudo: arranjo, mensagem do cartão, endereço e horário. Em minutos seu pedido está fechado.
        </p>

        <Button
          type="button"
          size="xl"
          variant="accent"
          onClick={() => openNamoradosWhatsApp("final_cta", "encomendar_agora")}
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
