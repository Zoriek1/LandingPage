/**
 * Fonte única de cálculo monetário das LPs de anúncio. `priceBrl` nos produtos
 * é sempre a string de exibição ("R$ 199,90"); tudo que precisa do número
 * (parcelamento, preço mínimo de uma vitrine) passa por aqui em vez de
 * reimplementar o parse/format em cada config.
 */

export function parsePriceBrl(priceBrl: string): number {
  // Só dígitos e a vírgula decimal sobrevivem — o "." de milhar ("R$ 1.234,50")
  // some junto com o resto, então não há risco de virar um segundo separador
  // decimal quando a vírgula for convertida.
  const cleaned = priceBrl.replace(/[^\d,]/g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function formatBrl(valueInReais: number): string {
  const rounded = Math.round(valueInReais * 100) / 100;
  const [intPart, centsPart] = rounded.toFixed(2).split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${withThousands},${centsPart}`;
}

/**
 * "3x s/ juros de R$ X" — divisão simples (total / count), a mesma convenção
 * das strings originais escritas à mão. O total de `count × valor exibido`
 * pode divergir do preço em até `count - 1` centavos por arredondamento;
 * é o padrão varejista de "parcela única exibida", não um erro.
 */
export function formatInstallments(priceBrl: string, count = 3): string {
  const perInstallment = parsePriceBrl(priceBrl) / count;
  return `${count}x s/ juros de ${formatBrl(perInstallment)}`;
}

export function minPriceLabel(prices: string[]): string {
  const min = Math.min(...prices.map(parsePriceBrl));
  return formatBrl(min);
}
