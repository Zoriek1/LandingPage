# Baseline de Medição — CRO das LPs de Anúncio

> Fase P0 do Plano CRO (v1.1, 2026-08-20). Este documento fecha a medição **antes** do deploy das mudanças (Fases P1/P2), para que toda decisão posterior seja comparada contra uma linha de base registrada.

## Fontes de medição (independentes — não misturar)

| Fonte | O que mede | Observações |
|-------|-----------|-------------|
| Meta Ads | Impressões, cliques, CTR, CPC, custo por resultado | Resultado = conversão "Contact" (WhatsApp) |
| GA4 | Page views, engajamento, eventos `whatsapp_click` via dataLayer | Análise de origem por `cta_location`/`cta_label` |
| API de leads (`/api/leads/`) | Eventos de conversão com UTMs, fbclid, fbp/fbc, produto e posição do CTA | É a fonte primária para funil pós-clique |
| WhatsApp da loja | WhatsApp→lead, lead→compra, receita | Registro manual + gestão |

**Regra:** Meta e GA4 são fontes separadas e válidas. Não somar/duplicar; comparar cada uma com o seu próprio baseline.

## Como os eventos chegam na API de leads (nomes reais do código)

O front envia no payload de cada conversão os campos:

- `cta_location` — posição do clique: `hero`, `vitrine`, `faq`, `sticky`, `como_funciona`, `final`, `guarantee`
- `cta_label` — tipo de clique:
  - `produto_whatsapp` (cards de produto — inclui `product_id`, `product_name`, `product_price`)
  - `hero_whatsapp`, `sticky_whatsapp`, etc. (CTAs genéricos que abrem o seletor de faixa de preço)
  - `hero_guided_whatsapp` (botão secundário "Pedir ajuda no WhatsApp" da /reconciliacao)
- `event` / `lead_stage` — `whatsapp_click` no clique; o sistema de leads segue com os estágios seguintes (lead, compra)
- UTMs, `fbclid`, `fbp`, `fbc`, `src`, `sck` — para cruzar com Meta Ads e identificar campanha/anúncio

Ou seja: a medição por posição de CTA (P1.6) **já existe na camada de dados**. O que falta é a análise.

## Baseline por página

Registrar os valores de **7 dias anteriores ao deploy** de cada fase. Preencher as colunas com as duas fontes onde aplicável (Meta e GA4).

### /lirios-apt (anúncio `[PREÇO][LIRIOS][ESTATICO][V1]`)

| Métrica | Meta | GA4 | Observações |
|---------|------|-----|-------------|
| Investimento (spend) | R$ 613,37 | — | Período analisado 09–20/08 |
| Page views | — | 685 | Landing page views |
| CTR | | | Preencher antes do deploy |
| Página→WhatsApp | — | 7,54% | Evolução recente: 6,84% → 7,54% |
| WhatsApps (resultados) | 49 | | Custo/resultado ≈ R$ 12,52 |
| WhatsApp→lead | 43,5% | | Caiu de 53,8% (−10,3pp) |
| lead→compra | 40,0% | | Era 42,9% |
| Compras | 10 | | |
| Receita | R$ 1.699,31 | | |
| CPA | R$ 67,30 | | Era R$ 57,36 |
| ROAS | 2,77 | | Estável ~2,75 |

**Critérios de sucesso da Fase P1** (reavaliar com ≥300 page views novos; decisões de compra com ≥10 compras):

| Métrica | Alvo |
|---------|------|
| Página→WhatsApp | ≥ 7,0% |
| Custo por resultado | ≤ R$ 13,50 |
| CPA | ≤ R$ 70,00 |
| ROAS | ≥ 2,50 |
| Mobile | Sem regressão vs. baseline |

Se ≥2 limites forem furados → reverter a Fase P1 e testar os componentes separadamente.

### /reconciliacao (anúncio `[DESCULPA][ERREI][ESTATICO][V1]`)

| Métrica | Meta | GA4 | Observações |
|---------|------|-----|-------------|
| Investimento | R$ 41,07 | — | |
| Page views | — | 69 | |
| CTR | 3,70% | | |
| Página→WhatsApp | 2,9% | | 2 WhatsApps / 69 views |
| Compras | 1 | | |
| Receita | R$ 54,90 | | |
| ROAS | 1,34 | | |

**Critérios de decisão (antes×depois, sem A/B):** mínimo ~300 page views e ~20 conversas no período pós-deploy; decisão baseada em compra exige ~10 compras; após 4 semanas sem volume → tratar compra/ROAS como direcional.

## Análise por posição de CTA (P1.6)

Com os campos `cta_location`/`cta_label` da API de leads, montar por período:

1. Cliques e WhatsApps por `cta_location` (hero, vitrine, sticky, faq, final) e por `cta_label`
2. Compras por `product_id` + tamanho (P/M/G) — cruzar com a receita do sistema de gestão
3. Funil por origem: página → WhatsApp → lead → compra

## Análise por produto

`product_id` é enviado nos cliques de card. Comparar conversão dos Arranjos (R$ 159,90–289,90) vs Buquês (R$ 299,90–459,90) para validar a faixa comparativa (P1.2) e os rótulos de tamanho (P1.3).

## Ritual

- **Antes do deploy:** preencher as tabelas acima (baseline fechado).
- **A cada 7 dias após o deploy:** atualizar a mesma tabela em coluna nova.
- **Decisão:** comparar cada fonte consigo mesma; só agir com o volume mínimo definido acima.
