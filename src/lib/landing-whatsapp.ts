import { WHATSAPP_URL } from "@/lib/config";
import { openWhatsAppModal } from "@/lib/whatsappModal";
import { openPriceRangeSelector } from "@/lib/price-ranges";
import type { TrackingParams } from "@/lib/tracking";

type ProductWhatsAppArgs = {
  pageSlug: string;
  pageLabel: string;
  ctaLocation: string;
  ctaLabel?: string;
  productId?: string;
  productName: string;
  productPrice: string;
  deliveryIntent: string;
  extraTracking?: TrackingParams;
};

type GuidedWhatsAppArgs = {
  pageSlug: string;
  pageLabel: string;
  ctaLocation: string;
  ctaLabel: string;
  request: string;
  extraTracking?: TrackingParams;
};

export function buildProductWhatsAppMessage({
  pageLabel,
  productName,
  productPrice,
  deliveryIntent,
}: Pick<ProductWhatsAppArgs, "pageLabel" | "productName" | "productPrice" | "deliveryIntent">) {
  return `Ola! Vi a pagina de ${pageLabel} e quero encomendar: ${productName} - ${productPrice}. Gostaria de confirmar disponibilidade para ${deliveryIntent}.`;
}

export function buildGuidedWhatsAppMessage({
  pageLabel,
  request,
}: Pick<GuidedWhatsAppArgs, "pageLabel" | "request">) {
  return `Ola! Vi a pagina de ${pageLabel} e quero ajuda pelo WhatsApp. ${request}`;
}

export function openProductWhatsApp({
  pageSlug,
  pageLabel,
  ctaLocation,
  ctaLabel = "produto_whatsapp",
  productId,
  productName,
  productPrice,
  deliveryIntent,
  extraTracking = {},
}: ProductWhatsAppArgs) {
  openWhatsAppModal(
    WHATSAPP_URL,
    {
      lp_slug: pageSlug,
      cta_location: ctaLocation,
      cta_label: ctaLabel,
      destination_url: WHATSAPP_URL,
      product_id: productId,
      product_name: productName,
      product_price: productPrice,
      delivery_intent: deliveryIntent,
      ...extraTracking,
    },
    buildProductWhatsAppMessage({
      pageLabel,
      productName,
      productPrice,
      deliveryIntent,
    }),
    `pagina=${pageSlug}`,
  );
}

export function openGuidedWhatsApp({
  pageSlug,
  ctaLocation,
  ctaLabel,
  extraTracking = {},
}: GuidedWhatsAppArgs) {
  openPriceRangeSelector({
    lp_slug: pageSlug,
    cta_location: ctaLocation,
    cta_label: ctaLabel,
    destination_url: WHATSAPP_URL,
    ...extraTracking,
  });
}
