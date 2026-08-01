import { openPriceRangeSelector } from "@/lib/price-ranges";
import { WHATSAPP_URL } from "@/lib/config";

const NAMORADOS_SLUG = "dia-dos-namorados";

type NamoradosCtaOrigin =
  | "hero"
  | "navbar_mobile"
  | "footer"
  | "whatsapp_fab"
  | "final_cta";

/** Abre o seletor de faixa preservando a origem da CTA de Dia dos Namorados. */
export function openNamoradosWhatsApp(origin: NamoradosCtaOrigin, ctaLabel: string) {
  openPriceRangeSelector({
    lp_slug: NAMORADOS_SLUG,
    cta_location: origin,
    cta_label: ctaLabel,
    destination_url: WHATSAPP_URL,
  });
}
