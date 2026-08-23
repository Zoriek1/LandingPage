# Claude Code

`AGENTS.md` é a documentação canônica do projeto. Leia somente as seções
relacionadas à tarefa antes de alterar código, tracking, build ou conteúdo.

## Objetivo

Landing pages da Plante Uma Flor voltadas à conversão de tráfego pago.
Preserve o que já funciona e não proponha redesign apenas por preferência estética.

## Conversão e conteúdo

- Mantenha uma ação primária clara e evite destinos concorrentes.
- Preserve o fluxo atual: cards de produto levam o produto e a faixa escolhida
  ao WhatsApp; CTAs genéricos seguem o seletor/modal existente.
- Use urgência verdadeira e específica, como horário limite, disponibilidade,
  entrega em Goiânia e preço real.
- Construa confiança com provas concretas e autoridade operacional, sem tom
  institucional genérico.
- Nunca invente avaliações, números, descontos, escassez, garantias ou resultados.
- Escreva em português do Brasil, sem clichês, hipérboles ou travessões.
- Não altere afirmações e dados reais apenas para deixar o texto mais persuasivo.

## UI

- Preserve a identidade existente: verde, dourado, creme, Playfair e Montserrat.
- Priorize mobile, legibilidade, velocidade e CTA visível.
- Use hierarquia e espaçamento antes de adicionar containers ou Cards.
- Evite estética genérica de IA: glow, glassmorphism, gradientes decorativos,
  excesso de pills, badges, ícones genéricos e seções repetitivas.
- Use fotos reais e não introduza imagens com aparência artificial.
- Preserve acessibilidade, foco visível, contraste e redução de movimento.

## Tracking

- Não altere eventos, `cta_label`, `cta_location`, UTMs, `event_id`, pixels,
  endpoints ou fluxo do WhatsApp sem revisar `tracking.ts`, `index.html`,
  os helpers existentes e seus testes.
- Não crie links diretos paralelos quando já existir helper de conversão.
- Toda mudança de CTA deve preservar atribuição e deduplicação.

## Skills

- Criação ou redesign: `frontend-design`.
- Auditoria de UI, UX e acessibilidade: `web-design-guidelines`.
- Performance ou refatoração React: `vercel-react-best-practices`.
- Documentação de biblioteca: `find-docs`.
- Use apenas a skill necessária para a tarefa.

## Validação

Execute `npm run check`. Para mudanças em rotas, imagens, SSR, prerender,
critical CSS ou build, execute também `npm run check:build`.
