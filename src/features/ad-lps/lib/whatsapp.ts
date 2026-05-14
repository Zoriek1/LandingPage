import { openWhatsAppModal } from "@/lib/whatsappModal";
import { WHATSAPP_BASE_URL, type LPConfig, type Product } from "@/features/ad-lps/data/configs";

type CtaOrigin =
  | "hero"
  | "vitrine"
  | "faq"
  | "sticky"
  | "como_funciona"
  | "final"
  | "guarantee";

type OpenAdLpWhatsAppArgs = {
  config: LPConfig;
  origin: CtaOrigin;
  product?: Product;
};

export function buildAdLpWhatsAppUrl(_config?: LPConfig, _product?: Product) {
  return WHATSAPP_BASE_URL;
}

export function openAdLpWhatsApp({ config, origin, product }: OpenAdLpWhatsAppArgs) {
  openWhatsAppModal(
    WHATSAPP_BASE_URL,
    {
      lp_slug: config.slug,
      cta_location: origin,
      cta_label: product ? "produto_whatsapp" : `${origin}_whatsapp`,
      destination_url: WHATSAPP_BASE_URL,
      product_id: product?.id,
      product_name: product?.name,
      product_price: product?.priceBrl,
    },
    undefined,
    `pagina=${config.slug}`,
  );
}
