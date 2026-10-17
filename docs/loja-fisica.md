# Loja física — implementação e operação

Plano aprovado na conversa: HTML independente em `/loja-fisica/`, mantendo a home e as campanhas existentes. Público local buscando retirada de vasos, insumos e plantas. Conversões principais: ligação e rota GPS.

## Registro de execução

- Escopo: frontend estático, tracking dataLayer e endpoint público restrito à Plante no Gestor.
- Decisão autorizada: trabalhar no checkout atual, sem worktree. README previamente commitado em `aabd442`.
- Interface: POST `/api/landing/distancia-loja`, JSON `{latitude, longitude}` → `{success, distancia_km, duracao_min, provider: "google_routes"}`. Não há fallback em linha reta.
- Estado: implementação validada; publicação e ativação do serviço dependem dos gates abaixo.

## Direção da página

Superfície de decisão rápida. Identidade já existente, fundo claro, Fraunces/Jost, verde botânico para rota e ação neutra para ligação. Headline e ações à esquerda, fachada real à direita no desktop; ações antes da foto no mobile. Categorias sem links comerciais adicionais. Mapa e horário juntos na seção de visita. Barra inferior mobile com duas ações iguais em largura.

## Publicação

1. Publicar primeiro as alterações do Gestor: `core.py`, `google_routes.py` e `landing_distance.py`. Não há migration desta funcionalidade.
2. Configurar no servidor `GOOGLE_MAPS_API_KEY` com Geocoding API e Routes API habilitadas/restritas ao backend. Não colocar chave em variável `VITE_*`.
3. Manter `RATELIMIT_ENABLED=true` e `RATELIMIT_STORAGE_URI` em Redis compartilhado (`redis://` ou `rediss://`). O endpoint recusa consultas se o limiter estiver desligado, em fallback ou sem armazenamento compartilhado na produção. Limites de 5/min por IP e 60/min globais; o geocode da loja é cacheado por processo por 24h (falhas por 60s).
4. Confirmar `APP_BASE_DOMAIN=gestaoonline.app.br`, loja ativa de slug `planteumaflor` e origem CORS `https://lpb.planteumaflor.com`. Hosts desconhecidos/outras lojas não podem usar o endpoint.
5. Validar uma rota real e o destino geocodificado no endereço **Rua 132, 289, Setor Sul, Goiânia**. O código rejeita geocode aproximado, mas essa checagem visual continua sendo um gate de publicação. Consultas pagas não foram feitas na implementação.
6. Auditar o GTM conforme `docs/tracking.md`: os links no DOM são genéricos; a origem fica em memória e é usada só na abertura do Maps. Não capturar localização em tags ou instrumentação extra. Publicação/configuração de tags não está incluída.
7. Depois dos gates, construir a landing com `VITE_STORE_DISTANCE_ENABLED=true`. Sem essa variável, o botão apenas obtém a localização e prepara o link para consultar distância no Google Maps; não chama o backend. O mapa, ligações e rotas continuam disponíveis sem JavaScript.

Não há detecção por IP. A permissão de localização é pedida só ao clicar. A origem não é gravada no navegador/CRM e não passa pelo logger de rotas. Não habilitar captura de corpos de requisição para este endpoint no proxy/APM. Recusa, timeout, 429 e indisponibilidade preservam os links de rota. A duração é estimativa de carro, sem previsão de trânsito ao vivo.

## Verificação reproduzível

- Unitários: `npx vitest run src/test/physicalStore.test.ts src/test/physicalStoreTracking.test.ts`.
- Tipos: `npm run typecheck`.
- Build local sem sincronização externa de produtos: `npx vite build`.
- Navegador: servidor Vite com `VITE_STORE_DISTANCE_ENABLED=true`, porta 4179; `playwright-cli -s=loja-fisica run-code --filename=scripts/qa-loja-fisica.cjs`. O script bloqueia GTM/Meta/leads e simula apenas o serviço de distância, nunca o mapa incorporado.
- Evidências locais: `.impeccable/review/` em desktop 1280, mobile 375 e tablet 768. Não houve overflow horizontal; botões/links têm pelo menos 48px de altura; barra mobile visível apenas abaixo de 768px. Sucesso, erro 503 e recusa de permissão foram exercitados. O Google Maps real exibiu o pin da loja.
- Backend: `BACKEND_IMAGE=gestor-landing-test:local bash scripts/run-test-bands.sh --picked` no Gestor, exclusivamente PostgreSQL descartável. A imagem de teste precisa ter **código atual** e dependências compatíveis: a imagem antiga não tinha `leads.status_changed_at`; uma reconstrução sem lock instalou SQLAlchemy 2.1 e tentou usar `psycopg` ausente. A validação usa as dependências da imagem local previamente funcional com o código atual copiado sobre ela, sem alteração de requirements.

## Rulings

- Preservar fontes e tokens Plante em vez de introduzir uma segunda identidade — decisão aprovada no plano.
- Distância dentro da página fica atrás do gate de deploy — evita disponibilizar uma chamada para endpoint ainda não publicado; rotas permanecem funcionais.
- Usar revisão independente generalista com capturas e contrato visual — o tipo de agente nomeado do Impeccable não está disponível neste harness.

## Resultado final

- 15 testes frontend passaram; typecheck e build final passaram. Alterações de navegação após revisão foram verificadas no navegador.
- 20 testes do endpoint passaram no PostgreSQL descartável, incluindo CORS/host com a aplicação real. Auditoria pública adicional: 5 passaram, 1 não pertence à banda rollback.
- Build padrão (distância desativada) verificado sem chamadas ao backend, com storage bloqueado e com JavaScript desativado.
- Revisão independente concluída após correções de privacidade e contraste, sem pendências materiais. Registro visual: `docs/loja-fisica.design.md`. Detector automático executou em modo degradado, sem avaliar contraste computado; não representa auditoria completa de acessibilidade.
- Nenhum token gerado, home ou campanha existente foi substituído. Alterações externas do usuário foram preservadas. Deploy e publicação de tags não fizeram parte da validação local.
