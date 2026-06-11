import { openWhatsAppModal } from "@/lib/whatsappModal";
import { WHATSAPP_URL } from "@/lib/config";

const NAMORADOS_SLUG = "dia-dos-namorados";

type NamoradosCtaOrigin =
  | "hero"
  | "navbar_mobile"
  | "footer"
  | "whatsapp_fab"
  | "final_cta";

/**
 * Abre o WhatsApp da LP de Dia dos Namorados sempre carimbando a origem.
 *
 * - `lp_slug` vai no tracking (Meta/GA/lead API).
 * - `extraRef` vira "· pagina=dia-dos-namorados" no fim da mensagem que o
 *   cliente envia, pra o atendimento saber de onde o lead veio.
 */
export function openNamoradosWhatsApp(origin: NamoradosCtaOrigin, ctaLabel: string) {
  openWhatsAppModal(
    WHATSAPP_URL,
    {
      lp_slug: NAMORADOS_SLUG,
      cta_location: origin,
      cta_label: ctaLabel,
      destination_url: WHATSAPP_URL,
    },
    undefined,
    `pagina=${NAMORADOS_SLUG}`,
  );
}
