export const BUSINESS_INFO = {
  legalName: "FLORICULTURA PLANTE UMA FLOR LTDA",
  tradeName: "PLANTE UMA FLOR",
  taxId: "65.625.103/0001-92",
  taxRegime: "Simples nacional",
  address: {
    street: "Rua 132, 289",
    district: "Setor Sul",
    city: "Goiania",
    state: "GO",
    zipCode: "74093-210",
    full: "Rua 132, 289 - Setor Sul - Goiania - GO - CEP 74093-210",
  },
  phone: "(62) 3281-9367",
  mobile: "(62) 99321-9814",
  whatsapp: "(62) 99650-3403",
  fiscalEmail: "financeiro@planteumaflor.com",
  businessHours: "Segunda a sexta, 08h-18h. Sabado, 08h-13h.",
  regions: "Goiania, Aparecida de Goiania e Senador Canedo",
  googleReviewsUrl: "https://share.google/QZylItqH7aT9MFXYA",
} as const;

/**
 * Frete por distância de carro até a loja, definido pelo cliente em 24/10/2026:
 * R$ 5,00 a menos que o entregador cobra em cada faixa. Fonte única: quem
 * precisar do valor consome daqui, não copia a string. O limite de cada faixa
 * entra nela (4,01 km já é a faixa seguinte).
 */
export const DELIVERY_FEES: { label: string; value: string }[] = [
  { label: "Até 4 km da loja", value: "R$ 10,00" },
  { label: "De 4 a 9 km", value: "R$ 15,00" },
  { label: "De 9 a 14 km", value: "R$ 20,00" },
  { label: "De 14 a 20 km", value: "R$ 25,00" },
  { label: "De 20 a 25 km", value: "R$ 30,00" },
  { label: "De 25 a 30 km", value: "R$ 40,00" },
];

export const DELIVERY_FEE_GUIDANCE =
  "O frete depende da distância de carro até a loja, no Setor Sul: R$ 10,00 até 4 km e R$ 15,00 até 9 km.";
