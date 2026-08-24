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
 * Frete por faixa, confirmado pelo cliente em 23/08/2026. Fonte única: quem
 * precisar do valor consome daqui, não copia a string. A tabela não cobre a
 * faixa entre o Setor Sul e os 20 km — quem exibe fecha com a frase do CEP em
 * vez de preencher a lacuna por conta própria.
 */
export const DELIVERY_FEES: { label: string; value: string }[] = [
  { label: "Setor Sul e Marista", value: "R$ 10,00" },
  { label: "Demais bairros, até 20 km", value: "R$ 25,00" },
  { label: "De 20 a 30 km", value: "R$ 30,00" },
];
