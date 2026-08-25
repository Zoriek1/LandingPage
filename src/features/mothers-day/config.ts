import { Camera, MapPin, MessageCircle, Sparkles, Truck } from "lucide-react";
import type { BenefitsSectionConfig } from "@/components/sections/BenefitsSection";
import type { CategoriesSectionConfig } from "@/components/sections/CategoriesSection";
import type { FAQSectionConfig } from "@/components/sections/FAQSection";
import type { FinalCTASectionConfig } from "@/components/sections/FinalCTASection";
import type { TestimonialsSectionConfig } from "@/components/sections/TestimonialsSection";
import type { NavbarConfig } from "@/components/layout/Navbar";
import type { FooterConfig } from "@/components/layout/Footer";
import type { WhatsAppFABConfig } from "@/components/floating/WhatsAppFAB";
import type { FeaturedProductsSectionConfig } from "@/components/sections/FeaturedProductsSection";
import type { HeroSectionConfig } from "@/components/sections/HeroSection";
import type { FeaturedProduct } from "@/types/featured-product";
import mothersDayProducts from "@/features/mothers-day/data/featured-products.snapshot.json";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";

export const MOTHERS_DAY_CONFIG = {
  hero: {
    imageAlt: "Buquê para o Dia das Mães",
    eyebrow: "10 de Maio · Montado à mão em Goiânia",
    title: "Buquês, cestas e plantas para o Dia das Mães em Goiânia",
    highlight: "A partir de R$ 99,90 · Pix com 5% off · Foto do arranjo antes da entrega",
    description:
      "Você escolhe pelo catálogo e encomenda pelo WhatsApp. A gente confirma endereço, horário e pagamento na hora, com foto do pedido antes da entrega.",
    primaryButtonLabel: "Encomendar pelo WhatsApp",
    primaryButtonVariant: "accent",
    countdownTarget: new Date("2026-05-10T00:00:00-03:00").getTime(),
    hideBadgesOnMobile: true,
    badges: [
      { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
      { icon: Truck, label: "Entrega no domingo, 10 de maio" },
      { icon: MessageCircle, label: "Confirmação rápida no WhatsApp" },
    ],
    tracking: {
      ctaLabel: "pedir_pelo_whatsapp",
    },
  } satisfies HeroSectionConfig,
  benefits: {
    title: "Escolha no catálogo. O resto a gente resolve.",
    description: "Pedido direto, confirmação rápida e entrega no horário combinado.",
    items: [
      {
        icon: Truck,
        title: "Entrega no Dia das Mães",
        description:
          "Depois que você escolhe no catálogo, a gente confirma endereço, frete e janela de entrega no WhatsApp.",
      },
      {
        icon: Camera,
        title: "Foto antes de despachar",
        description:
          "Mandamos a foto do pedido pronto antes de sair para entrega, para você conferir que está como o catálogo prometia.",
      },
      {
        icon: Sparkles,
        title: "Montado à mão, no dia",
        description:
          "Flores selecionadas e arranjo montado no mesmo dia da entrega. Se algo chegar fora do padrão prometido, refazemos sem custo.",
      },
      {
        icon: MapPin,
        title: "Atendemos toda Goiânia",
        description:
          "Entregamos em toda a cidade. O frete depende do bairro e a gente confirma na hora da encomenda, antes de você fechar o pedido.",
      },
    ],
  } satisfies BenefitsSectionConfig,
  categories: {
    title: "Escolha com ajuda da floricultura",
    description: "Toque em uma categoria e a gente ajuda a escolher pelo WhatsApp.",
    columns: 3,
    tracking: {
      pageSlug: "dia-das-maes",
      pageLabel: "Dia das Maes",
    },
    items: [
      {
        image: catBuques,
        title: "Buques para Mae",
        description: "Lirios, rosas, girassois e arranjos mistos, montados a mao.",
      },
      {
        image: catCestas,
        title: "Cestas Especiais",
        description:
          "Flores combinadas com chocolate, vinho, cafe da manha ou kit cuidado.",
      },
      {
        image: catPlantas,
        title: "Plantas e Vasos",
        description: "Para maes que preferem ter o presente vivo por mais tempo.",
      },
    ],
  } satisfies CategoriesSectionConfig,
  faq: {
    title: "Perguntas frequentes",
    items: [
      {
        question: "Até quando posso encomendar para entregar no Dia das Mães?",
        answer:
          "O ideal é até 7 de maio para garantir a entrega no domingo (10/05). Pedido de última hora depende da disponibilidade. Manda no WhatsApp e a gente confirma na hora.",
      },
      {
        question: "Vocês entregam no domingo de Dia das Mães?",
        answer:
          "Sim. Fazemos entregas ao longo do domingo. No WhatsApp, a gente confirma a melhor janela para o seu endereço.",
      },
      {
        question: "Quais bairros de Goiânia vocês atendem?",
        answer:
          "Toda Goiânia. O frete varia por região e a gente informa na hora da encomenda. Em alguns bairros centrais, frete grátis acima de um valor mínimo.",
      },
      {
        question: "Como funciona o pagamento?",
        answer:
          "Pix, cartão (parcelado em até 3x) ou dinheiro na entrega. A forma de pagamento é confirmada no WhatsApp antes de fechar o pedido.",
      },
      {
        question: "E se minha mãe não estiver em casa na hora da entrega?",
        answer:
          "A gente entra em contato e combina um novo horário, ou entrega para porteiro ou vizinho de confiança com a sua autorização.",
      },
      {
        question: "Como sei que vai chegar bonito?",
        answer:
          "Antes de sair para entrega, mandamos a foto do pedido pronto no seu WhatsApp para você conferir que ele está como o catálogo prometia. Se algo fugir desse padrão, a gente corrige antes de enviar.",
      },
    ],
  } satisfies FAQSectionConfig,
  finalCta: {
    eyebrow: "Últimos dias para encomendar",
    title: "Escolha o buquê e a gente entrega no domingo.",
    description:
      "Você manda o produto pelo WhatsApp e a gente confirma endereço, horário e pagamento na hora.",
    buttonLabel: "Encomendar pelo WhatsApp",
    tracking: {
      ctaLabel: "pedir_pelo_whatsapp",
    },
  } satisfies FinalCTASectionConfig,
  testimonials: {
    title: "Histórias de quem já presenteou pelo Dia das Mães",
    description: "Famílias que voltaram pra um segundo Dia das Mães com a gente.",
    columns: 4,
    items: [
      {
        reviewId: "camila-r-maes",
        authorName: "Camila R.",
        rating: 5,
        comment:
          "Encomendei pro Dia das Mães do ano passado. Chegou no horário e minha mãe chorou. Ano que vem peço de novo.",
        reviewCountLabel: "Maio/2025",
      },
      {
        reviewId: "ana-paula-s-maes",
        authorName: "Ana Paula S.",
        rating: 5,
        comment:
          "Comprei pra minha sogra e foi um sucesso. Mandaram a foto antes de entregar, achei super profissional. Recomendo demais.",
        reviewCountLabel: "Maio/2025",
      },
      {
        reviewId: "rodrigo-m-maes",
        authorName: "Rodrigo M.",
        rating: 5,
        comment:
          "Moro fora de Goiânia e queria surpreender minha mãe. Combinamos tudo pelo WhatsApp e a entrega saiu certinha.",
        reviewCountLabel: "Junho/2025",
      },
      {
        reviewId: "fernanda-l-maes",
        authorName: "Fernanda L.",
        rating: 5,
        comment:
          "Cesta linda, bem caprichada. Minha mãe adorou os chocolates junto com o buquê. Atendimento de primeira.",
        reviewCountLabel: "Maio/2024",
      },
    ],
  } satisfies TestimonialsSectionConfig,
  navbar: {
    links: [
      { label: "Categorias", href: "#categorias" },
      { label: "Depoimentos", href: "#depoimentos" },
      { label: "FAQ", href: "#faq" },
    ],
    overlay: "gradient",
    guided: {
      pageSlug: "dia-das-maes",
      pageLabel: "Dia das Maes",
      request: "Pode me ajudar a escolher por estilo, faixa de preco e data de entrega?",
    },
  } satisfies NavbarConfig,
  footer: {
    tagline: "Floricultura em Goiania. Montado a mao, entregue no horario.",
  } satisfies FooterConfig,
  whatsAppFab: {
    tooltip: "Encomende aqui 💬",
    ariaLabel: "Encomendar pelo WhatsApp",
    appearance: "accent",
    showOnMobile: true,
  } satisfies WhatsAppFABConfig,
  featuredProducts: {
    eyebrow: "Atalho para compra direta",
    title: "Mais pedidos para presentear agora",
    description:
      "Escolha um dos favoritos e fale direto no WhatsApp com produto, preco e origem da pagina.",
    syncedLabel: "Precos sincronizados no build.",
    helpButtonLabel: "Quero ajuda para escolher",
    source: {
      endpoint: "/dia-das-maes/featured-products.json",
      snapshot: mothersDayProducts as FeaturedProduct[],
    },
    tracking: {
      pageSlug: "dia-das-maes",
      pageLabel: "Dia das Maes",
      guidedRequest: "Pode me ajudar a escolher por estilo, faixa de preco e data de entrega?",
      deliveryIntent: "entrega na data combinada",
    },
  } satisfies FeaturedProductsSectionConfig,
};
