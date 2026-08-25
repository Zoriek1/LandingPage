import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/config";
import {
  PRICE_RANGE_CONFIGS,
  PRICE_RANGE_SELECTOR_EVENT,
  type IntentOption,
  type PriceRange,
  type PriceRangeRoute,
  type PriceRangeSelectorRequest,
} from "@/lib/price-ranges";
import { openPriceRangeWhatsApp } from "@/lib/whatsappModal";
import { openProductWhatsApp } from "@/lib/landing-whatsapp";

export function PriceRangeSelector({ route }: { route: PriceRangeRoute }) {
  const [request, setRequest] = useState<PriceRangeSelectorRequest | null>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const selectingRef = useRef(false);
  const config = PRICE_RANGE_CONFIGS[route];

  useEffect(() => {
    const handleOpen = (event: Event) => {
      openerRef.current = document.activeElement as HTMLElement | null;
      selectingRef.current = false;
      setRequest((event as CustomEvent<PriceRangeSelectorRequest>).detail);
    };

    window.addEventListener(PRICE_RANGE_SELECTOR_EVENT, handleOpen);
    return () => window.removeEventListener(PRICE_RANGE_SELECTOR_EVENT, handleOpen);
  }, []);

  const choices: readonly (PriceRange | IntentOption)[] = config.intents ?? config.ranges;

  const handleSelection = (choice: PriceRange | IntentOption) => {
    if (!request || selectingRef.current) return;
    selectingRef.current = true;
    const tracking = request;
    setRequest(null);

    const productId = "productId" in choice ? choice.productId : undefined;
    if (productId) {
      const intent = choice as IntentOption;
      openProductWhatsApp({
        pageSlug: config.lpSlug,
        pageLabel: config.messageContext.replace(/\s*—\s*$/, ""),
        ctaLocation: String(tracking.cta_location ?? "price_range_selector"),
        ctaLabel: "intent_whatsapp",
        productId: intent.productId,
        productName: intent.productName ?? intent.label,
        productPrice: intent.productPrice ?? "",
        deliveryIntent: "entrega hoje em Goiânia e região",
        extraTracking: { ...tracking, lp_slug: config.lpSlug, intent_key: intent.key },
      });
      return;
    }

    openPriceRangeWhatsApp(
      WHATSAPP_URL,
      {
        ...tracking,
        lp_slug: config.lpSlug,
        price_range_key: choice.key,
        price_range_label: choice.label,
      },
      config.messageContext,
      choice.label,
    );
  };

  return (
    <Dialog.Root
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) setRequest(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="price-range-backdrop"
          className="fixed inset-0 z-[100] bg-primary/75 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />
        <Dialog.Content
          className="fixed inset-x-3 bottom-3 z-[101] max-h-[calc(100dvh-1.5rem)] overscroll-contain overflow-y-auto rounded-[28px] border border-accent/35 bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 text-primary shadow-[0_28px_90px_hsl(var(--primary)_/_0.32)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4 motion-reduce:animate-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-7 sm:pb-7 sm:pt-7"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            firstChoiceRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
          }}
        >
          <Dialog.Close
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 text-primary/70 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Fechar seletor de faixa de preço"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>

          <div className="pr-12">
            <p className="mb-2 font-body text-[0.68rem] font-bold uppercase tracking-[0.2em] text-accent">
              Vamos por partes
            </p>
            <Dialog.Title className="font-display text-[1.75rem] font-semibold leading-tight text-primary sm:text-3xl">
              {config.intents ? "Como podemos ajudar?" : "Qual faixa combina com o seu presente?"}
            </Dialog.Title>
            <Dialog.Description className="mt-2 font-body text-sm leading-6 text-muted-foreground">
              {config.intents
                ? "Escolha uma opção e continue o pedido pelo WhatsApp."
                : "Escolha um orçamento para ver opções que façam sentido para a ocasião."}
            </Dialog.Description>
          </div>

          <fieldset className="mt-6 grid min-w-0 gap-3 border-0 p-0">
            <legend className="sr-only">{config.intents ? "Opções" : "Faixas de preço"}</legend>
            {choices.map((choice, index) => (
              <button
                key={choice.key}
                ref={index === 0 ? firstChoiceRef : undefined}
                type="button"
                onClick={() => handleSelection(choice)}
                className="group grid min-h-[5.25rem] grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-primary/15 bg-card px-5 py-4 text-left shadow-[0_8px_24px_hsl(var(--primary)_/_0.06)] transition-transform hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_12px_30px_hsl(var(--primary)_/_0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
                aria-label={`${choice.label}. ${choice.outcome}`}
              >
                <span>
                  <strong className="block font-display text-xl font-semibold text-primary">
                    {choice.label}
                  </strong>
                  <span className="mt-1 block font-body text-xs leading-5 text-muted-foreground sm:text-sm">
                    {choice.outcome}
                  </span>
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-accent group-hover:text-accent-foreground" aria-hidden="true">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </fieldset>

          <p className="mt-5 text-center font-body text-[0.7rem] leading-5 text-muted-foreground">
            Você só abre o WhatsApp depois de escolher.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
