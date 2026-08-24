/** `caption` sobrescreve a legenda padrão; sem ela nada muda para as outras LPs. */
export function StoreFooter({ caption }: { caption?: string } = {}) {
  return (
    <figcaption className="ad-lp-historia__caption">
      {caption ?? "Loja física em Goiânia · 40 anos de tradição · entrega própria"}
    </figcaption>
  );
}
