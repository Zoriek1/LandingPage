import { Camera, Heart, MapPin, MessageCircle, Truck } from "lucide-react";
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
import namoradosProducts from "@/features/namorados/data/featured-products.snapshot.json";
import catBuques from "@/assets/cat-buques.jpg";
import catCestas from "@/assets/cat-cestas.jpg";
import catPlantas from "@/assets/cat-plantas.jpg";

export const NAMORADOS_CONFIG = {
  hero: {
    imageAlt: "Buquê para o Dia dos Namorados",
    eyebrow: "12 de Junho · Entrega com foto · Goiânia",
    title: "Surpreenda no Dia dos Namorados, sem stress de última hora",
    highlight:
      "Agenda de entregas do dia 12/06 fechando · Pix 5% off · Cartão à mão grátis",
    description:
      "Você escolhe pelo catálogo e encomenda pelo WhatsApp. Confirmamos endereço, horário, mensagem do cartão e mandamos foto do arranjo pronto antes de sair pra entrega.",
    primaryButtonLabel: "Encomendar pelo WhatsApp",
    primaryButtonVariant: "accent",
    countdownTarget: new Date("2026-06-12T00:00:00-03:00").getTime(),
    hideBadgesOnMobile: true,
    badges: [
      { icon: Camera, label: "Foto do arranjo antes de sair pra entrega" },
      { icon: Truck, label: "Entrega no dia 12 de junho" },
      { icon: MessageCircle, label: "Confirmação rápida no WhatsApp" },
    ],
    tracking: {
      lpSlug: "dia-dos-namorados",
      ctaLabel: "pedir_pelo_whatsapp",
    },
  } satisfies HeroSectionConfig,
  benefits: {
    title: "Surpresa garantida, sem stress de última hora.",
    description:
      "Pedido direto pelo WhatsApp, confirmação rápida e entrega no horário combinado.",
    items: [
      {
        icon: Truck,
        title: "Entrega no Dia dos Namorados",
        description:
          "Você escolhe pelo catálogo e a gente confirma endereço, frete e janela de entrega no WhatsApp — antes ou no dia 12/06.",
      },
      {
        icon: Camera,
        title: "Foto antes de despachar",
        description:
          "Mandamos a foto do pedido pronto antes de sair pra entrega, pra você ver o arranjo que vai surpreender.",
      },
      {
        icon: Heart,
        title: "Cartão escrito à mão grátis",
        description:
          "Manda a mensagem pelo WhatsApp e a gente escreve no cartão. Sem cobrar a parte e sem custar a emoção da surpresa.",
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
    title: "Escolha a surpresa que combina com voces",
    description:
      "Do buque classico ao combo completo. A gente ajuda a comparar no WhatsApp.",
    columns: 3,
    tracking: {
      pageSlug: "dia-dos-namorados",
      pageLabel: "Dia dos Namorados",
    },
    items: [
      {
        image: catBuques,
        title: "Buques romanticos",
        description:
          "Rosas vermelhas, brancas, lirios e mistos. Montados a mao no dia da entrega.",
      },
      {
        image: catCestas,
        title: "Cestas com vinho & bombons",
        description:
          "Flores combinadas com vinho, chocolates Lindt, espumante ou cafe da manha romantico.",
      },
      {
        image: catPlantas,
        title: "Surpresas combo",
        description:
          "Buque + cartao escrito a mao + balao metalizado ou pelucia. Pronto para emocionar.",
      },
    ],
  } satisfies CategoriesSectionConfig,
  faq: {
    title: "Perguntas frequentes",
    description: "As dúvidas mais comuns de quem encomenda no Dia dos Namorados.",
    items: [
      {
        question: "Até quando posso encomendar para entregar no Dia dos Namorados?",
        answer:
          "O ideal é até 10 de junho para garantir a entrega no dia 12/06. Pedido em cima da hora depende da disponibilidade — manda no WhatsApp que a gente confirma na mesma hora.",
      },
      {
        question: "Vocês entregam na sexta-feira, dia 12 de junho?",
        answer:
          "Sim. Fazemos entregas ao longo do dia 12/06 com janelas de horário. No WhatsApp, a gente combina a melhor janela para o seu endereço (manhã, almoço ou fim da tarde).",
      },
      {
        question: "Consigo entregar surpresa no trabalho dela(e)?",
        answer:
          "Sim — é o pedido mais comum no Dia dos Namorados. Você só precisa passar o nome da pessoa, empresa, endereço, andar/setor e o melhor horário. A gente entrega direto.",
      },
      {
        question: "Quanto custa o frete?",
        answer:
          "Depende do bairro. Em alguns bairros centrais, frete grátis acima de um valor mínimo. A gente confirma o frete na hora da encomenda, antes de você fechar o pedido.",
      },
      {
        question: "O cartão escrito à mão é grátis?",
        answer:
          "Sim. Você manda a mensagem pelo WhatsApp e a gente escreve à mão no cartão. Sem cobrar a parte.",
      },
      {
        question: "Posso pagar pelo Pix?",
        answer: "Pode. Pix tem 5% de desconto. Também aceitamos crédito, débito e link de pagamento.",
      },
    ],
  } satisfies FAQSectionConfig,
  finalCta: {
    eyebrow: "Últimos dias para encomendar",
    title: "Não deixa pra última hora. Garante a surpresa de 12/06.",
    description:
      "Manda mensagem no WhatsApp e a gente confirma tudo: arranjo, mensagem do cartão, endereço e horário. Em minutos seu pedido está fechado.",
    buttonLabel: "Encomendar pelo WhatsApp",
    tracking: {
      lpSlug: "dia-dos-namorados",
      ctaLabel: "encomendar_agora",
    },
  } satisfies FinalCTASectionConfig,
  testimonials: {
    title: "Quem encomendou no ano passado",
    description: "Depoimentos reais de clientes do Dia dos Namorados anterior.",
    columns: 3,
    items: [
      {
        reviewId: "lucas-m-namorados",
        authorName: "Lucas M.",
        rating: 5,
        comment:
          "Encomendei pra surpreender minha namorada no trabalho. Chegou no horário combinado, com a foto antes pra eu conferir o cartão. Ela se emocionou demais.",
        reviewCountLabel: "Junho/2025",
      },
      {
        reviewId: "mariana-p-namorados",
        authorName: "Mariana P.",
        rating: 5,
        comment:
          "Comprei pro meu namorado, fora do óbvio. Pediram a mensagem do cartão, mandaram foto do arranjo pronto e ele me ligou emocionado quando chegou no trabalho. Recomendo de olhos fechados.",
        reviewCountLabel: "Junho/2025",
      },
      {
        reviewId: "diego-r-namorados",
        authorName: "Diego R.",
        rating: 5,
        comment:
          "Esqueci do Dia dos Namorados (eu sei, eu sei). Pedi no fim da tarde pelo WhatsApp e eles entregaram no mesmo dia. Salvaram meu casamento.",
        reviewCountLabel: "Junho/2025",
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
      pageSlug: "dia-dos-namorados",
      pageLabel: "Dia dos Namorados",
      request: "Pode me ajudar a escolher uma surpresa romantica por faixa de preco e estilo?",
    },
    mobileWhatsAppLpSlug: "dia-dos-namorados",
  } satisfies NavbarConfig,
  footer: {
    tagline: "Floricultura em Goiania. Montado a mao, entregue no horario.",
    whatsAppLpSlug: "dia-dos-namorados",
  } satisfies FooterConfig,
  whatsAppFab: {
    tooltip: "Encomende aqui 💬",
    ariaLabel: "Encomendar pelo WhatsApp",
    appearance: "accent",
    showOnMobile: true,
    lpSlug: "dia-dos-namorados",
  } satisfies WhatsAppFABConfig,
  featuredProducts: {
    eyebrow: "Atalho para compra direta",
    title: "Os mais pedidos para o Dia dos Namorados",
    description:
      "Buques e combos romanticos com foto, preco e atendimento direto pelo WhatsApp.",
    syncedLabel: "Precos sincronizados no build.",
    helpButtonLabel: "Quero ajuda para escolher",
    source: {
      endpoint: "/dia-dos-namorados/featured-products.json",
      snapshot: namoradosProducts as FeaturedProduct[],
    },
    tracking: {
      pageSlug: "dia-dos-namorados",
      pageLabel: "Dia dos Namorados",
      guidedRequest:
        "Pode me ajudar a escolher uma surpresa romantica por faixa de preco e estilo?",
      deliveryIntent: "entrega no dia combinado",
    },
  } satisfies FeaturedProductsSectionConfig,
};
