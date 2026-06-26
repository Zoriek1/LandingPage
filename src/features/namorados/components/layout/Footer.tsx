import BusinessFooter from "@/components/layout/BusinessFooter";
import { openNamoradosWhatsApp } from "@/features/namorados/lib/whatsapp";

const Footer = () => (
  <BusinessFooter
    tagline="Floricultura em Goiania. Montado a mao, entregue no horario."
    onWhatsAppClick={() => openNamoradosWhatsApp("footer", "icone_whatsapp")}
  />
);

export default Footer;
