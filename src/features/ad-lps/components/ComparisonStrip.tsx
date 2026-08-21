import type { LPConfig } from "@/features/ad-lps/data/configs";

type ComparisonStripConfig = NonNullable<LPConfig["comparisonStrip"]>;

export function ComparisonStrip({ strip }: { strip: ComparisonStripConfig }) {
  return (
    <div className="ad-lp-comparison" data-testid="ad-lp-comparison-strip">
      {strip.title ? <p className="ad-lp-comparison__title">{strip.title}</p> : null}
      <div className="ad-lp-comparison__options">
        {strip.options.map((option) => (
          <article
            className={`ad-lp-comparison__option${option.highlight ? " ad-lp-comparison__option--highlight" : ""}`}
            key={option.name}
          >
            <h3 className="ad-lp-comparison__name">{option.name}</h3>
            <p className="ad-lp-comparison__price">{option.priceRange}</p>
            <p className="ad-lp-comparison__description">{option.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
