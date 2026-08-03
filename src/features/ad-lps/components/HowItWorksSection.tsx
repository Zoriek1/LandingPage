import type { ReactNode } from "react";

const PROCESS_STEPS = [
  {
    num: "1",
    title: "Escolha seu arranjo",
    body: "Passe pela vitrine e escolha o que combina com a ocasião.",
  },
  {
    num: "2",
    title: "Fale no WhatsApp",
    body: "Clique em Comprar no WhatsApp e mande o recado do cartão.",
  },
  {
    num: "3",
    title: "Aprove a foto",
    body: "Antes de sair, a gente manda a foto do buquê pronto para você aprovar.",
  },
  {
    num: "4",
    title: "Receba hoje",
    body: "Entregamos em Goiânia ainda hoje (ou na data combinada).",
  },
];

export function HowItWorksSection({ cta }: { cta?: ReactNode }) {
  return (
    <section id="como-funciona" className="ad-lp-steps" aria-label="Como funciona">
      <header className="ad-lp-section-head">
        <h2>Como funciona</h2>
        <p>Quatro passos entre escolher a flor e ela tocar a campainha.</p>
      </header>
      <ol className="ad-lp-steps__grid">
        {PROCESS_STEPS.map((step) => (
          <li className="ad-lp-steps__item" key={step.num}>
            <span className="ad-lp-steps__num" aria-hidden="true">{step.num}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
      {cta ? <div className="ad-lp-steps__cta">{cta}</div> : null}
    </section>
  );
}
