# Plano consolidado

**Projeto:** Plante Uma Flor / `Zoriek1/LandingPage`

**Data do planejamento:** 12/10/2026

**Status:** planejamento consolidado; implementação e validações pendentes.

## Objetivo e estratégia

Executar o dashboard de comportamento e marketing em tempo real usando a documentação existente como especificação. Este documento consolida a sequência de execução e a divisão do trabalho; os contratos detalhados permanecem nos documentos de referência.

A primeira entrega será o **Marco A completo**, da coleta ao painel autenticado em ambiente real. Depois avançar para B e C. Integrações externas permanecem no Marco D.

Priorizar uso e engajamento das páginas, com ações de contato como objetivo secundário. A coleta própria será a fonte do dashboard, independente do GA4.

A preparação deste plano incluiu duas pesquisas delegadas, somente leitura, sobre coleta/tracking e backend/entrega. Não foram executados testes, acessados serviços externos ou implementados os módulos aqui descritos.

## 1. Base documental

| Documento | Papel na execução |
| --- | --- |
| [Plano geral](../plano-dashboard-tempo-real.md) | Arquitetura, escopo e marcos |
| [01 — Coleta e métricas](01-coleta-eventos-e-metricas.md) | Eventos, consentimento, sessões, transporte e fórmulas |
| [02 — API, banco e segurança](02-api-banco-seguranca-e-deploy.md) | Persistência, contratos, autenticação e implantação |
| [03 — Dashboard](03-dashboard-produto-e-decisoes.md) | Telas, indicadores, filtros e estados |
| [04 — Execução](04-execucao-validacao-e-operacao.md) | Backlog A01–C05 e critérios de aceite |
| [Tracking](../../tracking.md), [medições](../medicoes.md) e [atendimento](../atendimento.md) | Preservação das conversões e distinção entre clique, conversa e venda |

Quando documentação e código divergirem, primeiro confirmar o comportamento real. Não implementar uma suposição antiga.

## 2. Pontos encontrados na pesquisa

- **O dashboard e o backend ainda não estão implementados.** O deploy atual publica somente arquivos estáticos por FTPS.
- **O helper `openWhatsAppModal()` não apresenta formulário atualmente.** Ele rastreia e abre o destino: [`src/lib/whatsappModal.ts`](../../../src/lib/whatsappModal.ts), função na linha 178 da versão pesquisada. A documentação precisa refletir isso, sem recriar um modal removido.
- **O clique comportamental não pode depender da deduplicação comercial.** O tracking atual suprime Contact/lead durante quatro horas, mas interações reais repetidas devem continuar observáveis no dashboard: [`src/lib/tracking.ts`](../../../src/lib/tracking.ts), função `trackWhatsAppClick` na linha 254 da versão pesquisada.
- **O manifesto atual declara Vite 8 e React Router 7**, diferentemente do contexto antigo. Trabalhar com as versões atuais, sem migração de stack.
- **VPS, DNS, banco, autenticação e integração efetiva do CookieHub continuam pendentes de confirmação.** Desenvolvimento isolado pode avançar; coleta pública e publicação não devem presumir essas condições.

Esses achados descrevem a pesquisa preparatória. Revalidar o estado do repositório ao iniciar A01, especialmente se houver alterações posteriores.

## 3. Ordem de construção

### Etapa 1 — Inventário e contrato V1 · A01–A02

Antes de dividir a implementação:

- [ ] Confirmar recursos e serviços existentes na VPS, domínio/API, persistência, backups e mecanismo de deploy.
- [ ] Verificar a API real de consentimento do CookieHub/GTM, incluindo concessão e revogação.
- [ ] Definir administrador inicial, método de login, recuperação e expiração.
- [ ] Consolidar eventos, envelope, ACK por evento, respostas administrativas e fórmulas das métricas.
- [ ] Fixar exemplos de referência usados nos testes do coletor, servidor e dashboard.
- [ ] Corrigir divergências factuais nos documentos existentes.

**Aceite:** nenhum implementador precisa inventar nomes de eventos, denominadores, respostas da API ou callbacks do CMP.

O manifesto não contém Fastify nem cliente PostgreSQL. Runtime e dependências de servidor precisam ser decididos explicitamente nesta etapa; não serão adicionados por conveniência.

### Etapa 2 — Construção por pacotes delegáveis · A03–A11

| Pacote | Responsabilidade e arquivos | Aceite principal |
| --- | --- | --- |
| **Coletor** | `src/analytics/`: consentimento, identidade por aba, sessão, sensores, fila e transporte | Sem coleta antes do consentimento; revogação limpa fila; retries preservam IDs; storage indisponível não quebra a página |
| **Backend** | `server/analytics/`: migrações, ingestão, autenticação, consultas e SSE | ACK somente após commit; duplicatas não repetem efeitos; endpoints e stream protegidos |
| **Dashboard** | `src/dashboard/` e `admin/marketing/index.html` | Tela “Agora e resumo”, login, filtros básicos, estados reais e atualização recuperável |
| **Integração pública** | Entradas React, cliente prerenderizado, campanhas, loja física e helpers compartilhados | Cobertura das famílias públicas sem duplicar pageviews ou alterar conversões existentes |
| **Infraestrutura** | `infra/analytics/` | HTTPS, volume persistente, backup e restauração básica verificados |

**Dependências e paralelismo:**

- Contrato V1 vem primeiro.
- Backend, coletor e estrutura do dashboard podem avançar separadamente depois disso.
- Fixtures servem para desenvolvimento e testes; não contam como entrega funcional.
- A integração pública depende do coletor e do consentimento validado.
- Infraestrutura depende do inventário, sem reinstalar a VPS nem substituir serviços existentes.

Arquivos compartilhados como `package.json`, lockfile, configurações TypeScript, `vite.config.ts` e workflow ficam sob **um único responsável pela integração**.

- [ ] Concluir coletor e testes do contrato de consentimento, sessão e transporte.
- [ ] Concluir backend com persistência real, autenticação, consultas e SSE.
- [ ] Concluir a entrada administrativa e a tela inicial.
- [ ] Integrar as entradas públicas e os helpers compartilhados.
- [ ] Verificar infraestrutura, persistência, backup e restauração básica.

### Etapa 3 — Primeiro fluxo completo

Antes de ampliar telas, validar:

**Navegação autorizada → evento → PostgreSQL → consulta autenticada → painel atualizado.**

A entrega A incluirá:

- Visitas, sessões observadas, presença, scroll e tempo ativo estimado.
- CTAs principais, variantes e atribuição permitida.
- Rankings de páginas, campanhas e ações.
- SSE como sinal de atualização, snapshots após reconexão e polling como fallback.
- Horário da última atualização, cobertura parcial e denominadores visíveis.

O painel terá entrada própria, **sem Pixel, GTM ou coletor de marketing**. Seus gráficos não poderão aumentar o bundle das landings.

A nova analytics não acrescentará espera de rede ao WhatsApp ou ao catálogo, nem copiará indiscriminadamente telefone, mensagem, token ou payload comercial.

- [ ] Demonstrar o fluxo completo com evento real persistido e exibido após autenticação.

### Etapa 4 — Publicação coordenada e validação · A12–A13

Executar na seguinte ordem:

1. Validar testes, tipos, lint, build e prerender.
2. Preparar artefatos identificados pelo mesmo SHA.
3. Aplicar migração compatível com a versão anterior.
4. Publicar backend e verificar prontidão.
5. Somente então publicar o frontend dependente por FTPS.
6. Executar roteiro ponta a ponta e verificar recuperação.

**Backend indisponível bloqueia a publicação do frontend dependente.** Rollback de código não pode apagar eventos nem depender de migração destrutiva.

- [ ] Concluir A12 com publicação coordenada e recuperação verificadas.
- [ ] Concluir A13 com evidências dos critérios de aceite do Marco A.

## 4. Critérios para encerrar o Marco A

- [ ] Home, LPs, entradas sazonais e loja física cobertas.
- [ ] Navegação, reload, voltar e reconexão sem contagem duplicada indevida.
- [ ] Aba oculta/inativa não infla tempo ativo.
- [ ] Reenvio, concorrência e ACK perdido não duplicam efeitos no banco.
- [ ] Recusa/revogação interrompem a nova coleta.
- [ ] API indisponível não impede os CTAs.
- [ ] Sem autenticação, consultas e SSE não entregam dados; logout/expiração encerram o acesso.
- [ ] Dashboard sem trackers de marketing; landings sem chunks administrativos.
- [ ] Histórico preservado após reinício; backup restaurado em ambiente separado.
- [ ] Latência medida, incluindo a meta proposta de **p95 até 5 segundos entre persistência e exibição**, sem tratá-la como SLA comprovado.

Na implementação, usar os comandos existentes `npm run check` e `npm run check:build`, acrescentando cobertura específica de contrato, PostgreSQL e jornadas Playwright. O build completo de publicação deve preservar as sincronizações e o prerender atuais.

## 5. Marcos seguintes

### B — Comportamento completo · B01–B06

- [ ] Instrumentar exposições de seções/produtos, filtros, FAQ e seletor de preço.
- [ ] Entregar as cinco telas, jornadas, funis e comparações.
- [ ] Validar cobertura dos eventos B nas famílias de páginas.

Só calcular taxas quando o denominador estiver instrumentado.

### C — Operação ampliada · C01–C05

- [ ] Validar capacidade e otimizar consultas conforme medições.
- [ ] Ampliar diagnósticos e entregar exportação autorizada.
- [ ] Ampliar retenção e recuperação, com runbook validado.

Backup e segurança básicos já pertencem ao Marco A.

### D — Integrações opcionais

Gestor, conversas confirmadas, vendas, receita, custos e replay têm contratos e aceites próprios. Não preencher essas métricas com cliques ou números simulados.

## 6. Como usar `/delegate`

No agente executor, se `/delegate` estiver disponível, cada pacote deve receber:

- IDs do backlog e documentos aplicáveis.
- Arquivos sob sua responsabilidade e arquivos proibidos.
- Dependências previamente concluídas.
- Testes e critérios de aceite.
- Obrigação de informar evidências e pendências.

A delegação não deve autorizar publicação ou alterações externas implicitamente. Integração, revisão e liberação permanecem centralizadas.

**Ponto de partida da execução:** A01–A02, mantendo o Marco A como primeira entrega.
