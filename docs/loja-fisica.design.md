# Loja física — registro de design

Escopo: somente `/loja-fisica/`. Modo: Persuade. Registro da revisão final de 24/09/2026; decisões implementadas, sem substituir a identidade das demais páginas.

## Identidade e hierarquia

- Fontes locais existentes: Fraunces nos títulos e Jost no corpo, importadas de `src/routes/home-fonts.css`.
- Cores provenientes de `src/styles/tokens.generated.css`, cuja fonte é o design system Plante. Rota usa `--color-action-brand-primary`; ligação usa `--color-action-primary`; legenda da fachada usa superfície inversa e texto sobre escuro. Nenhum token gerado foi alterado.
- Hero apresenta produtos, prova social fornecida no briefing, ligação e rota antes da fotografia no fluxo mobile. A fachada real identifica o destino; nota e quantidade de avaliações não são dados consultados ao vivo.
- Desktop organiza texto e fachada em duas colunas. As quatro categorias passam de uma coluna no mobile a duas no tablet e quatro no desktop. As ilustrações decorativas acompanham títulos e descrições explícitos.
- Endereço, horários, telefones, mapa e navegação ficam na seção de visita. WhatsApp permanece secundário no header. A barra mobile divide ligação e rota em duas metades e respeita a área segura inferior.

## Acessibilidade e comportamento

- Títulos sem etiquetas decorativas acima deles; ordem semântica de headings, link para pular ao conteúdo, foco visível, imagem com texto alternativo e iframe com título.
- Texto descritivo das categorias usa o foreground existente sobre a superfície alternativa. A revisão corrigiu a combinação anterior de texto muted, cujo contraste calculado era inferior a 4,5:1. Isso não equivale a uma auditoria completa de contraste da página.
- Controles principais têm altura mínima de 48 px pelas utilidades existentes; a barra mobile usa 64 px. Resultados de localização são anunciados por região de status; carregamento desabilita temporariamente o botão e erros permitem continuar pelos mapas.
- Horário calculado em `America/Sao_Paulo`, acompanhado de ressalva para feriados. Links nativos de telefone e mapas permanecem disponíveis sem JavaScript.
- Localização somente após ação e permissão. Coordenadas ficam na memória do módulo, nunca nos hrefs do DOM. O clique primário comum constrói a rota personalizada; cliques com modificadores mantêm o link genérico. Eventos próprios de conversão não incluem coordenadas.
- Cálculo de distância permanece desativado por padrão até os gates de backend e publicação. As capturas de QA exercitam também a variante habilitada com respostas simuladas; não comprovam disponibilidade do provedor real.

## Evidência e limites

Revisão visual das capturas em `.impeccable/review/desktop.png`, `tablet.png`, `mobile-viewport.png` e `mobile-map.png`, além das capturas completas e de viewport produzidas na mesma rodada. A captura separada do mapa demonstra seu conteúdo; áreas vazias em full-page podem decorrer da composição lazy do iframe.

Confirmação final por leitura do código e das capturas: corrigidas a exposição de coordenadas em hrefs, a combinação de contraste das categorias e as etiquetas decorativas. A coordenação informou sucesso da rodada de navegador com links genéricos, abertura personalizada simulada, eventos limpos e ausência de chamadas ao CRM. Esta revisão não repetiu testes nem build.

Disposição visual/frontend: ship, condicionada à conclusão dos gates de integração e publicação. Sem novos problemas materiais identificados na confirmação. Não julgados nesta revisão: configuração efetiva do GTM, Redis de produção, consulta paga ao Google, precisão da rota real, deploy e auditoria completa de acessibilidade.
