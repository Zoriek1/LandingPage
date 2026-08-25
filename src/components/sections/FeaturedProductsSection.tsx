import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";
import heroImg from "@/assets/hero-flowers.jpg";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  useFeaturedProducts,
  type FeaturedProductsSource,
} from "@/hooks/useFeaturedProducts";
import type { FeaturedProduct } from "@/types/featured-product";
import { WHATSAPP_URL } from "@/lib/config";
import { openGuidedWhatsApp, openProductWhatsApp } from "@/lib/landing-whatsapp";

const fallbackImages = [catBuques, catCestas, catPlantas, heroImg];

const getProductImage = (product: FeaturedProduct, index: number) =>
  product.imageUrl || fallbackImages[index % fallbackImages.length];

export type FeaturedProductsSectionConfig = {
  eyebrow: string;
  title: string;
  description: string;
  syncedLabel: string;
  helpButtonLabel: string;
  source?: FeaturedProductsSource;
  tracking: {
    pageSlug: string;
    pageLabel: string;
    guidedRequest: string;
    deliveryIntent: string;
  };
};

type FeaturedProductsSectionProps = {
  config?: FeaturedProductsSectionConfig;
};

const defaultConfig: FeaturedProductsSectionConfig = {
  eyebrow: "Mais pedidos da semana",
  title: "Os buques que mais saem em Goiania",
  description: "Foto e preco prontos para voce escolher e encomendar pelo WhatsApp em minutos.",
  syncedLabel: "Precos direto da loja.",
  helpButtonLabel: "Me ajude a escolher",
  tracking: {
    pageSlug: "home",
    pageLabel: "buques",
    guidedRequest: "Pode me ajudar a escolher por faixa de preco e ocasiao?",
    deliveryIntent: "entrega hoje ou agendada",
  },
};

const FeaturedProductsSection = ({ config = defaultConfig }: FeaturedProductsSectionProps) => {
  const { products, isRefreshing } = useFeaturedProducts(config.source);

  if (!products.length) return null;

  return (
    <section id="produtos-destaque" className="bg-background py-section-y">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-body text-eyebrow font-semibold uppercase text-accent">
              <Sparkles size={14} />
              {config.eyebrow}
            </span>
            <h2 className="font-display text-h2 font-semibold text-primary">
              {config.title}
            </h2>
            <p className="mt-3 max-w-xl font-body text-sm leading-7 text-muted-foreground md:text-base">
              {config.description}
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-body">
              {isRefreshing ? "Atualizando a vitrine da loja..." : config.syncedLabel}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openGuidedWhatsApp({
                  pageSlug: config.tracking.pageSlug,
                  pageLabel: config.tracking.pageLabel,
                  ctaLocation: "featured_products_header",
                  ctaLabel: "ajuda_escolher",
                  request: config.tracking.guidedRequest,
                })
              }
              className="rounded-full border-primary/15 bg-transparent px-4 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {config.helpButtonLabel}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
        >
          <Carousel
            opts={{
              align: "start",
              loop: products.length > 3,
            }}
            className="mx-auto"
          >
            <CarouselContent className="-ml-3 md:-ml-5">
              {products.map((product, index) => (
                <CarouselItem
                  key={product.slug}
                  className="pl-3 sm:basis-[58%] md:pl-5 lg:basis-[40%] xl:basis-[32%]"
                >
                  <a
                    href={WHATSAPP_URL}
                    onClick={(event) => {
                      event.preventDefault();
                      openProductWhatsApp({
                        pageSlug: config.tracking.pageSlug,
                        pageLabel: config.tracking.pageLabel,
                        ctaLocation: "featured_products",
                        productId: product.slug,
                        productName: product.title,
                        productPrice: product.priceLabel,
                        deliveryIntent: config.tracking.deliveryIntent,
                      });
                    }}
                    className="group block h-full overflow-hidden rounded-[28px] border border-primary/15 bg-secondary shadow-[0_24px_60px_hsl(var(--primary)_/_0.08)] transition-transform duration-500 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={getProductImage(product, index)}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute left-5 top-5 rounded-full border border-primary-foreground/20 bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground backdrop-blur-sm">
                        Mais pedido
                      </div>
                    </div>
                    <div className="border-t border-primary/15 bg-secondary px-4 py-4 md:px-5 md:py-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-display text-[1.42rem] leading-[0.95] tracking-[-0.015em] text-primary md:text-[1.62rem]">
                          {product.title}
                        </p>
                        <ArrowUpRight
                          className="mt-1 shrink-0 text-primary/90 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          size={20}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                            Preco
                          </p>
                          <p className="font-body text-[1.66rem] font-semibold leading-none text-foreground md:text-[1.85rem]">
                            {product.priceLabel}
                          </p>
                        </div>

                        {product.pixPriceLabel ? (
                          <div className="rounded-full border border-primary/20 bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
                            Pix: {product.pixPriceLabel}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>

            {products.length > 1 ? (
              <>
                <CarouselPrevious
                  aria-label="Produto anterior"
                  className="bottom-3 left-3 top-auto hidden border-primary-foreground/15 bg-primary/70 text-primary-foreground hover:bg-primary hover:text-primary-foreground lg:flex"
                />
                <CarouselNext
                  aria-label="Proximo produto"
                  className="bottom-3 right-3 top-auto hidden border-primary-foreground/15 bg-primary/70 text-primary-foreground hover:bg-primary hover:text-primary-foreground lg:flex"
                />
              </>
            ) : null}
          </Carousel>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
