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
import { useFeaturedProducts } from "@/features/mothers-day/hooks/useFeaturedProducts";
import type { FeaturedProduct } from "@/features/mothers-day/types";
import { SITE_URL } from "@/lib/config";
import { trackSiteClick } from "@/lib/tracking";

const fallbackImages = [catBuques, catCestas, catPlantas, heroImg];

const getFallbackImage = (product: FeaturedProduct, index: number) =>
  product.imageUrl || fallbackImages[index % fallbackImages.length];

const FeaturedProductsSection = () => {
  const { products, isRefreshing } = useFeaturedProducts();

  return (
    <section id="produtos-destaque" className="bg-background py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-2xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              <Sparkles size={14} />
              Atalho para compra direta
            </span>
            <h2 className="font-display text-3xl font-semibold text-primary md:text-4xl">
              Mais pedidos para presentear agora
            </h2>
            <p className="mt-3 max-w-xl font-body text-sm leading-7 text-muted-foreground md:text-base">
              Escolha um dos favoritos e va direto para a pagina do produto com foto, preco e link prontos para compra.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-body">
              {isRefreshing ? "Atualizando a vitrine da loja..." : "Precos sincronizados no build."}
            </span>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-primary/15 bg-transparent px-4 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackSiteClick({
                    cta_location: "featured_products_header",
                    cta_label: "open_catalog",
                    destination_url: SITE_URL,
                  })
                }
              >
                Ver catalogo completo
              </a>
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
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackSiteClick({
                        cta_location: "featured_products",
                        cta_label: "open_product",
                        destination_url: product.url,
                        product_name: product.title,
                        product_price: product.priceLabel,
                      })
                    }
                    className="group block h-full overflow-hidden rounded-[28px] border border-[#1a231d]/12 bg-[#f6f3eb] shadow-[0_24px_60px_rgba(15,27,22,0.08)] transition-transform duration-500 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={getFallbackImage(product, index)}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                        Mais pedido
                      </div>
                    </div>
                    <div className="border-t border-[#1a231d]/12 bg-[#f6f3eb] px-4 py-4 md:px-5 md:py-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-display text-[1.42rem] leading-[0.95] tracking-[-0.015em] text-[#1a231d] md:text-[1.62rem]">
                          {product.title}
                        </p>
                        <ArrowUpRight
                          className="mt-1 shrink-0 text-[#1a231d]/88 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          size={20}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1a231d]/70">
                            Preco no site
                          </p>
                          <p className="font-body text-[1.66rem] font-semibold leading-none text-[#121915] md:text-[1.85rem]">
                            {product.priceLabel}
                          </p>
                        </div>

                        {product.pixPriceLabel ? (
                          <div className="rounded-full border border-[#1a231d]/22 bg-white px-3 py-1.5 text-xs font-semibold text-[#121915]">
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
                  className="bottom-3 left-3 top-auto hidden border-white/15 bg-[#0e1813]/72 text-white hover:bg-[#0e1813] hover:text-white lg:flex"
                />
                <CarouselNext
                  aria-label="Proximo produto"
                  className="bottom-3 right-3 top-auto hidden border-white/15 bg-[#0e1813]/72 text-white hover:bg-[#0e1813] hover:text-white lg:flex"
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
