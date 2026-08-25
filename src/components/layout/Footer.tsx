import BusinessFooter from "@/components/layout/BusinessFooter";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";

export type FooterConfig = {
  tagline: string;
  whatsAppLpSlug?: string;
};

type FooterProps = {
  config?: FooterConfig;
};

const defaultConfig: FooterConfig = {
  tagline: "Flores que transformam momentos em memorias.",
};

const Footer = ({ config = defaultConfig }: FooterProps) => {
  const onWhatsAppClick = config.whatsAppLpSlug
    ? () =>
        openPriceRangeSelector({
          lp_slug: config.whatsAppLpSlug,
          cta_location: "footer",
          cta_label: "icone_whatsapp",
          destination_url: WHATSAPP_URL,
        })
    : undefined;

  return <BusinessFooter tagline={config.tagline} onWhatsAppClick={onWhatsAppClick} />;
};

export default Footer;
