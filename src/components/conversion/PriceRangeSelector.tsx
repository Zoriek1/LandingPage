import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/config";
import {
  PRICE_RANGE_CONFIGS,
  PRICE_RANGE_SELECTOR_EVENT,
  type PriceRange,
  type PriceRangeRoute,
  type PriceRangeSelectorRequest,
} from "@/lib/price-ranges";
import { openPriceRangeWhatsApp } from "@/lib/whatsappModal";

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

  const handleSelection = (range: PriceRange) => {
    if (!request || selectingRef.current) return;
    selectingRef.current = true;
    const tracking = request;
    setRequest(null);

    openPriceRangeWhatsApp(
      WHATSAPP_URL,
      {
        ...tracking,
        lp_slug: config.lpSlug,
        price_range_key: range.key,
        price_range_label: range.label,
      },
      config.messageContext,
      range.label,
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
          className="fixed inset-0 z-[100] bg-[#10231c]/75 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
        />
        <Dialog.Content
          className="fixed inset-x-3 bottom-3 z-[101] max-h-[calc(100dvh-1.5rem)] overscroll-contain overflow-y-auto rounded-[28px] border border-[#c6a15b]/35 bg-[#fcfaf4] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 text-[#1b3328] shadow-[0_28px_90px_rgba(5,20,14,0.32)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4 motion-reduce:animate-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-7 sm:pb-7 sm:pt-7"
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
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1b3328]/15 text-[#1b3328]/70 hover:bg-[#1b3328]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a15b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfaf4]"
            aria-label="Fechar seletor de faixa de preço"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>

          <div className="pr-12">
            <p className="mb-2 font-body text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#73531c]">
              Vamos por partes
            </p>
            <Dialog.Title className="font-display text-[1.75rem] font-semibold leading-tight text-[#1b3328] sm:text-3xl">
              Qual faixa combina com o seu presente?
            </Dialog.Title>
            <Dialog.Description className="mt-2 font-body text-sm leading-6 text-[#43584e]">
              Escolha um orçamento para ver opções que façam sentido para a ocasião.
            </Dialog.Description>
          </div>

          <fieldset className="mt-6 grid min-w-0 gap-3 border-0 p-0">
            <legend className="sr-only">Faixas de preço</legend>
            {config.ranges.map((range, index) => (
              <button
                key={range.key}
                ref={index === 0 ? firstChoiceRef : undefined}
                type="button"
                onClick={() => handleSelection(range)}
                className="group grid min-h-[5.25rem] grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-[#1b3328]/14 bg-white px-5 py-4 text-left shadow-[0_8px_24px_rgba(27,51,40,0.06)] transition-transform hover:-translate-y-0.5 hover:border-[#c6a15b] hover:shadow-[0_12px_30px_rgba(27,51,40,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a15b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfaf4] active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
                aria-label={`${range.label}. ${range.outcome}`}
              >
                <span>
                  <strong className="block font-display text-xl font-semibold text-[#1b3328]">
                    {range.label}
                  </strong>
                  <span className="mt-1 block font-body text-xs leading-5 text-[#5d6e65] sm:text-sm">
                    {range.outcome}
                  </span>
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1b3328] text-[#fcfaf4] group-hover:bg-[#c6a15b] group-hover:text-[#1b3328]" aria-hidden="true">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </fieldset>

          <p className="mt-5 text-center font-body text-[0.7rem] leading-5 text-[#65766d]">
            Você só abre o WhatsApp depois de escolher.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
