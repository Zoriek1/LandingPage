# Medições de CRO — LPs de Anúncio

Log de medição por ciclo de campanha. Definição estável dos campos usados aqui
(`cta_location`, `cta_label`, `event`/`lead_stage`, UTMs/fbclid/fbp/fbc) está em
[`../tracking.md`](../tracking.md) — não repetida neste arquivo. SOP de atendimento e
taxonomia de perdas em [`atendimento.md`](atendimento.md).

## Fontes de medição (independentes — não misturar)

| Fonte | O que mede | Observações |
|-------|-----------|-------------|
| Meta Ads | Impressões, cliques, CTR, CPC, custo por resultado | Resultado = conversão "Contact" (WhatsApp) |
| GA4 | Page views, engajamento, eventos `whatsapp_click` via dataLayer | Análise de origem por `cta_location`/`cta_label` |
| API de leads (`/api/leads/`) | Eventos de conversão com UTMs, fbclid, fbp/fbc, produto e posição do CTA | É a fonte primária para funil pós-clique |
| WhatsApp da loja | WhatsApp→lead, lead→compra, receita | Registro manual + gestão |

**Regra:** Meta e GA4 são fontes separadas e válidas. Não somar/duplicar; comparar cada uma com o seu próprio baseline.

## Ritual

- **Antes de cada mudança relevante de LP:** fechar o baseline com os valores dos 7 dias anteriores ao deploy.
- **A cada 7 dias após o deploy:** atualizar a mesma tabela em coluna nova, abaixo do ciclo anterior.
- **Decisão:** comparar cada fonte consigo mesma; só agir com o volume mínimo definido em cada ciclo.

## Análise por posição de CTA

Com os campos `cta_location`/`cta_label` da API de leads, montar por período:

1. Cliques e WhatsApps por `cta_location` (hero, vitrine, sticky, faq, final) e por `cta_label`.
2. Compras por `product_id` + tamanho (P/M/G) — cruzar com a receita do sistema de gestão.
3. Funil por origem: página → WhatsApp → lead → compra.

## Análise por produto

`product_id` é enviado nos cliques de card. Comparar conversão por faixa de preço e por
categoria de produto para validar mudanças de posicionamento/oferta.

---

## Ciclo 2026-08-20 — Fases P0/P1/P3 do Plano CRO v1.1

Baseline fechado em 20/08/2026, antes do deploy das Fases P1/P3.

### `/lirios-apt` (anúncio `[PREÇO][LIRIOS][ESTATICO][V1]`)

| Métrica | Meta | GA4 | Observações |
|---------|------|-----|-------------|
| Investimento (spend) | R$ 613,37 | — | Período analisado 09–20/08 |
| Page views | — | 685 | Landing page views |
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

#### Fase P3 — quebra de objeções pré-clique

A queda de WhatsApp→lead (53,8% → 43,5%) indicou que quem clica chega na conversa com
objeção ainda de pé, e o atendimento absorvia o atrito. Cada item abaixo tinha uma
hipótese verificável e um efeito esperado sobre uma métrica específica.

| Item | O que mudou | Hipótese | Métrica que deve reagir |
|------|-------------|----------|-------------------------|
| P3.1 | `urgencyWindow` no hero + `subheadline` sem "entrega hoje" cravado | A página prometia entrega hoje às 22h de domingo. Quem chegava fora da janela ouvia "não dá" no WhatsApp | WhatsApp→lead; perdas `data_horario_indisponivel` |
| P3.2 | Faixa de tranquilidade no topo da vitrine (frete, foto, cor do dia, pagamento), sempre visível | Frete não aparecia em ponto nenhum da página — o custo total só era descoberto na conversa | Página→WhatsApp; perdas `frete` e `preco` |
| P3.3 | FAQ do rodapé com frete, corte de horário e pagamento antes do `COMMON_FAQ` | A LP tinha `faq: []`: só perguntas genéricas, nenhuma sobre custo ou logística | WhatsApp→lead |
| P3.4 | `showGoogleReviewsLink` ligado | Nota 4,9 verificável pesa mais que nota que exige fé | Página→WhatsApp |

**Não mudou** (decisão explícita, para não contaminar a leitura): o seletor de faixa de
preço do CTA do hero, o texto "Comprar no WhatsApp" e a ordem das seções.

Critérios de sucesso — os mesmos limites do P1, mais:

| Métrica | Alvo |
|---------|------|
| WhatsApp→lead | ≥ 50% (recuperar o patamar anterior) |
| Página→WhatsApp | ≥ 7,0% |
| Perdas `frete` + `data_horario_indisponivel` | queda vs. distribuição do período anterior |

> A leitura de `frete` depende do registro manual de perdas descrito em
> [`atendimento.md`](atendimento.md). Sem essa classificação, o P3.2 fica sem evidência
> direta — só o efeito agregado em Página→WhatsApp.

**Pendência:** a copy de frete comunica o *processo* ("informamos o valor exato antes de
você fechar") porque o valor varia por bairro e não há faixa registrada. Quando a loja
fechar a faixa real por região, trocar por número — número quebra objeção melhor que
promessa de transparência.

### `/reconciliacao` (anúncio `[DESCULPA][ERREI][ESTATICO][V1]`)

| Métrica | Meta | GA4 | Observações |
|---------|------|-----|-------------|
| Investimento | R$ 41,07 | — | |
| Page views | — | 69 | |
| CTR | 3,70% | | |
| Página→WhatsApp | 2,9% | | 2 WhatsApps / 69 views |
| Compras | 1 | | |
| Receita | R$ 54,90 | | |
| ROAS | 1,34 | | |

**Critérios de decisão (antes×depois, sem A/B):** mínimo ~300 page views e ~20 conversas
no período pós-deploy; decisão baseada em compra exige ~10 compras; após 4 semanas sem
volume → tratar compra/ROAS como direcional.
