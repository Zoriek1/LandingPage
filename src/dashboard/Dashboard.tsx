import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AdminEventItem,
  AdminEventsResponse,
  AdminSessionResponse,
  AdminStreamPayload,
  OverviewSnapshot,
} from '../../shared/analytics-contract';
import { PATH_ALLOWLIST } from '../../shared/analytics-contract';
import { displayTime, periodRange, type Period } from './time';

const api = (import.meta.env.VITE_ANALYTICS_API_URL || '').replace(/\/$/, '');

const request = async <T,>(path: string, init?: RequestInit, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(`${api}/admin/${path}`, {
    ...init,
    signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Sua sessão expirou. Entre novamente.'
        : response.status === 429
          ? 'Muitas tentativas. Aguarde e tente novamente.'
          : 'Não foi possível atualizar os dados.';
    throw Object.assign(new Error(message), { status: response.status });
  }

  return response.json();
};

const PAGE_OPTIONS = [...new Set(PATH_ALLOWLIST)];
const periodLabels: Record<Period, string> = {
  today: 'Hoje',
  '60m': '60 minutos',
  '7d': '7 dias',
  custom: 'Personalizado',
};

const eventTypeLabels: Record<string, string> = {
  page_view: 'Visualização de página',
  whatsapp_click: 'Clique no WhatsApp',
  catalog_click: 'Clique no catálogo',
  store_phone_click: 'Clique em telefone da loja',
  store_directions_click: 'Clique em rota da loja',
  cta_click: 'Clique em CTA',
  scroll_depth: 'Profundidade de rolagem',
  visibility_change: 'Mudança de visibilidade',
  offer_variant_seen: 'Variante de oferta vista',
  heartbeat: 'Sinal de presença',
};

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

interface FeedQueryParams {
  from: string;
  to: string;
  path?: string;
}

export default function Dashboard() {
  const [session, setSession] = useState<AdminSessionResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [period, setPeriod] = useState<Period>('today');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [path, setPath] = useState('');

  const [snapshot, setSnapshot] = useState<OverviewSnapshot | null>(null);
  const [feed, setFeed] = useState<AdminEventItem[]>([]);
  const feedRef = useRef<AdminEventItem[]>([]);
  feedRef.current = feed;
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);
  const [problem, setProblem] = useState('');
  const [paused, setPaused] = useState(false);
  const [arrivals, setArrivals] = useState(0);
  const [streamState, setStreamState] = useState('Conectando atualização ao vivo');

  const busyRef = useRef(false);
  const pausedRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const revisionRef = useRef(-1);
  const pendingRevisionRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const pendingEventIdsRef = useRef<Set<string>>(new Set());
  const frozenFeedQueryRef = useRef<FeedQueryParams | null>(null);
  const refreshRef = useRef<(append?: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    request<AdminSessionResponse>('session')
      .then(setSession)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const refresh = useCallback(
    async (append = false) => {
      if (!session) return;
      if (busyRef.current) {
        if (!append) {
          pendingRevisionRef.current = Math.max(
            pendingRevisionRef.current ?? -1,
            revisionRef.current + 1,
          );
        }
        return;
      }

      busyRef.current = true;
      setBusy(true);
      setProblem('');

      const controller = new AbortController();
      if (!append) {
        abortRef.current?.abort();
        abortRef.current = controller;
      }

      const generation = generationRef.current;
      const initialRevision = revisionRef.current;

      try {
        if (period === 'custom' && (!from || !to || from > to)) {
          throw new Error('Escolha datas válidas para o período.');
        }

        const range = periodRange(
          period,
          new Date(),
          period === 'custom' ? { from, to } : undefined,
        );

        const overviewQuery = new URLSearchParams({
          from: range.from,
          to: range.to,
        });
        if (path) overviewQuery.set('path', path);

        if (!append && !pausedRef.current) {
          frozenFeedQueryRef.current = {
            from: range.from,
            to: range.to,
            ...(path ? { path } : {}),
          };
        }

        const feedWindow = append
          ? (frozenFeedQueryRef.current ?? {
              from: range.from,
              to: range.to,
              ...(path ? { path } : {}),
            })
          : { from: range.from, to: range.to, ...(path ? { path } : {}) };
        const feedQuery = new URLSearchParams({
          from: feedWindow.from,
          to: feedWindow.to,
        });
        if (feedWindow.path) {
          feedQuery.set('path', feedWindow.path);
        }
        if (append && cursorRef.current) {
          feedQuery.set('cursor', cursorRef.current);
        }

        if (append) {
          pausedRef.current = true;
          setPaused(true);
          const events = await request<AdminEventsResponse>(
            `events?${feedQuery}`,
            {},
            controller.signal,
          );

          if (controller.signal.aborted || generation !== generationRef.current) return;

          const fresh = events.items.filter(item => item.event_type !== 'heartbeat');
          const known = new Set(feedRef.current.map(item => item.event_id));
          const unique = fresh.filter(item => !known.has(item.event_id));
          const combined = [...feedRef.current, ...unique];
          feedRef.current = combined;
          setFeed(combined);
          cursorRef.current = events.next_cursor;
          setCursor(events.next_cursor);
          setHasMore(events.has_more);
          setStale(false);
          setProblem('');
          return;
        }

        const [overview, events] = await Promise.all([
          request<OverviewSnapshot>(`overview?${overviewQuery}`, {}, controller.signal),
          request<AdminEventsResponse>(`events?${feedQuery}`, {}, controller.signal),
        ]);

        if (controller.signal.aborted || generation !== generationRef.current) return;
        if (overview.data_revision < revisionRef.current) return;

        revisionRef.current = overview.data_revision;
        setSnapshot(overview);

        const fresh = events.items.filter(item => item.event_type !== 'heartbeat');

        const knownEvents = new Set(feedRef.current.map(item => item.event_id));
        if (pausedRef.current) {
          fresh.forEach(item => {
            if (!knownEvents.has(item.event_id)) pendingEventIdsRef.current.add(item.event_id);
          });
          setArrivals(pendingEventIdsRef.current.size);
          setFeed(old => old);
        } else {
          pendingEventIdsRef.current.clear();
          setArrivals(0);
          feedRef.current = fresh;
          setFeed(fresh);
          cursorRef.current = events.next_cursor;
          setCursor(events.next_cursor);
          setHasMore(events.has_more);
          frozenFeedQueryRef.current = {
            from: range.from,
            to: range.to,
            ...(path ? { path } : {}),
          };
        }


        setStale(false);
        setProblem('');
      } catch (error) {
        if (controller.signal.aborted) return;
        const e = error as Error & { status?: number };
        setStale(true);
        setProblem(e.message);
        if (e.status === 401) {
          setSession(null);
          setSnapshot(null);
          setFeed([]);
        }
      } finally {
        if (generation === generationRef.current) {
          busyRef.current = false;
          setBusy(false);

          if (pendingRevisionRef.current !== null) {
            const target = pendingRevisionRef.current;
            pendingRevisionRef.current = null;
            if (target > initialRevision) {
              void refreshRef.current();
            }
          }
        }
      }
    },
    [session, period, from, to, path],
  );

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    generationRef.current += 1;
    abortRef.current?.abort();
    busyRef.current = false;
    revisionRef.current = -1;
    setBusy(false);
    pendingRevisionRef.current = null;
    pendingEventIdsRef.current.clear();
    setArrivals(0);
    pausedRef.current = false;
    setPaused(false);
    frozenFeedQueryRef.current = null;

    if (session) {
      feedRef.current = [];
      setFeed([]);
      setCursor(null);
      cursorRef.current = null;
      setSnapshot(null);
      void refresh();
    }
  }, [session, period, from, to, path, refresh]);

  useEffect(() => {
    if (!session) return;
    if (typeof EventSource === 'undefined') {
      setStreamState('Atualização periódica (30s)');
      return;
    }

    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    let failures = 0;
    let fallback: ReturnType<typeof setInterval> | undefined;

    const connect = () => {
      if (stopped) return;
      source = new EventSource(`${api}/admin/stream`, { withCredentials: true });

      source.addEventListener('ready', () => {
        failures = 0;
        clearInterval(fallback);
        fallback = undefined;
        setStreamState('Ao vivo');
        void refreshRef.current();
      });

      source.addEventListener('invalidate', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as AdminStreamPayload;
          if (payload.data_revision <= revisionRef.current) return;
          pendingRevisionRef.current = Math.max(
            pendingRevisionRef.current ?? -1,
            payload.data_revision,
          );
        } catch {
          // payload ausente ou inválido: agenda releitura de segurança
        }

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void refreshRef.current();
        }, 300);
      });

      source.onerror = () => {
        source?.close();
        setStreamState('Reconectando…');
        failures += 1;
        if (failures >= 3 && !fallback) {
          setStreamState('Atualização por consulta periódica (5s)');
          fallback = setInterval(() => {
            void refreshRef.current();
          }, 5000);
        }
        timer = setTimeout(
          connect,
          Math.min(30000, 1000 * 2 ** Math.min(failures, 5)),
        );
      };
    };

    connect();

    return () => {
      stopped = true;
      source?.close();
      clearTimeout(timer);
      clearInterval(fallback);
      clearTimeout(debounceRef.current);
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      void refreshRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const id = setInterval(() => {
      if (snapshot && Date.now() - Date.parse(snapshot.generated_at) > 60000) {
        setStale(true);
      }
    }, 10000);
    return () => clearInterval(id);
  }, [snapshot]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');
    try {
      const s = await request<AdminSessionResponse>('login', {
        method: 'POST',
        headers: { 'X-Analytics-Admin': '1' },
        body: JSON.stringify({ username, password }),
      });
      setPassword('');
      setSession(s);
    } catch {
      setLoginError('Não foi possível entrar. Confira os dados e tente novamente.');
    }
  };

  const logout = async () => {
    generationRef.current += 1;
    abortRef.current?.abort();
    busyRef.current = false;
    clearTimeout(debounceRef.current);

    try {
      await request('logout', {
        method: 'POST',
        headers: { 'X-CSRF-Token': session?.csrf_token || '' },
      });
      setSession(null);
      setSnapshot(null);
      setFeed([]);
      setCursor(null);
      cursorRef.current = null;
      frozenFeedQueryRef.current = null;
    } catch {
      setProblem('Não foi possível encerrar a sessão no servidor. Tente novamente.');
    }
  };

  const togglePause = () => {
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      pendingEventIdsRef.current.clear();
      setArrivals(0);
      frozenFeedQueryRef.current = null;
      void refresh(false);
    } else {
      pausedRef.current = true;
      setPaused(true);
    }
  };

  const loadMore = () => {
    if (hasMore && !busy) {
      void refresh(true);
    }
  };

  if (checking) {
    return (
      <main className="dash-login">
        <p role="status">Verificando sessão…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="dash-login">
        <section className="login-card">
          <p className="eyebrow">Plante Uma Flor · Inteligência</p>
          <h1>Analytics</h1>
          <p className="muted">Entre para acompanhar sinais observados do site.</p>
          <form onSubmit={login}>
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              autoComplete="username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {loginError && (
              <p role="alert" className="error">
                {loginError}
              </p>
            )}
            <button className="primary" type="submit">
              Entrar
            </button>
          </form>
        </section>
      </main>
    );
  }

  const metrics = snapshot?.metrics;
  const format = (n?: number) =>
    n === undefined ? '—' : new Intl.NumberFormat('pt-BR').format(n);

  const cards = [
    [
      'Sessões observadas',
      format(metrics?.observed_sessions),
      'Sessões com eventos observados pelo coletor neste período.',
    ],
    [
      'Online agora',
      format(metrics?.online_sessions),
      'Sessões ativas nos últimos 60s (abas observadas, não pessoas).',
    ],
    [
      'Cliques no WhatsApp',
      format(metrics?.whatsapp_clicks),
      'Cliques observados no botão; não representam conversas ou vendas.',
    ],
    [
      'Pageviews',
      format(metrics?.pageviews),
      'Visualizações registradas pelo coletor neste período.',
    ],
    [
      'Tempo ativo estimado',
      metrics?.active_time_ms === undefined
        ? '—'
        : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(metrics.active_time_ms / 60000) + ' min',
      'Tempo ativo agregado estimado a partir de sinais observados.',
    ],
    [
      'Cliques no catálogo',
      format(metrics?.site_clicks),
      'Navegações com intenção de ver catálogo ou loja.',
    ],
  ] as const;

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Plante Uma Flor · Analytics Operacional</p>
          <h2 className="dashboard-title">Agora &amp; resumo</h2>
        </div>
        <div className="top-actions">
          <span className={`status ${stale ? 'stale' : ''}`}>{streamState}</span>
          <button className="quiet" type="button" onClick={logout}>
            Sair ({session.username})
          </button>
        </div>
      </header>

      {problem && (
        <div role="alert" className="notice error">
          {problem}
        </div>
      )}

      <section className="controls" aria-label="Filtros do painel">
        <label htmlFor="period-select">
          Período
          <select
            id="period-select"
            value={period}
            onChange={e => setPeriod(e.target.value as Period)}
          >
            {(Object.keys(periodLabels) as Period[]).map(key => (
              <option key={key} value={key}>
                {periodLabels[key]}
              </option>
            ))}
          </select>
        </label>

        {period === 'custom' && (
          <>
            <label htmlFor="from-date">
              Início
              <input
                id="from-date"
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </label>
            <label htmlFor="to-date">
              Fim
              <input
                id="to-date"
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </label>
          </>
        )}

        <label htmlFor="path-select">
          Página
          <select
            id="path-select"
            value={path}
            onChange={e => setPath(e.target.value)}
          >
            <option value="">Todas as páginas permitidas</option>
            {PAGE_OPTIONS.map(page => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
        </label>

        <span className="timezone">Horário: América/São Paulo (UTC-3)</span>
      </section>

      <section className="metrics" aria-label="Métricas principais">
        {cards.map(([title, val, desc]) => (
          <article className="metric" key={title}>
            <span>{title}</span>
            <strong>{val}</strong>
            <small>{desc}</small>
          </article>
        ))}
      </section>

      <div className="data-grid">
        <section className="panel" aria-label="Ranking de páginas">
          <header className="panel-heading">
            <div>
              <p className="eyebrow">Distribuição</p>
              <h2>Páginas com mais sessões</h2>
            </div>
            <span className="source">
              Sessões observadas no filtro selecionado
            </span>
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Página</th>
                  <th scope="col">Sessões observadas</th>
                  <th scope="col">Pageviews</th>
                  <th scope="col">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {snapshot?.pages && snapshot.pages.length > 0 ? (
                  snapshot.pages.map(row => (
                    <tr key={row.path}>
                      <td>
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => setPath(row.path)}
                        >
                          {row.path}
                        </button>
                      </td>
                      <td>{format(row.observed_sessions)}</td>
                      <td>{format(row.pageviews)}</td>
                      <td>{format(row.whatsapp_clicks)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="muted">
                      Ainda não há dados neste período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            Presença online do bloco &quot;Agora&quot; permanece em tempo real
            mesmo ao filtrar períodos passados.
          </p>
        </section>

        <section className="panel" aria-label="Feed de eventos recentes">
          <header className="panel-heading">
            <div>
              <p className="eyebrow">Auditoria operacional</p>
              <h2>Feed de eventos recentes</h2>
            </div>
            <button type="button" className="quiet" onClick={togglePause}>
              {paused
                ? `Retomar (${arrivals} novos)`
                : 'Pausar fluxo'}
            </button>
          </header>

          <ol className="event-list">
            {feed.map(item => (
              <li key={item.event_id}>
                <div>
                  <span className="event-type">
                    {eventTypeLabels[item.event_type] || item.event_type.replace(/_/g, ' ')}
                  </span>{' '}
                  <span className="muted">{item.path}</span>
                </div>
                <time dateTime={item.occurred_at}>
                  {displayTime(item.occurred_at)}
                </time>
                <small>
                  Sessão: {item.session_id.slice(0, 8)}…
                  {item.delayed ? ' · Entrega atrasada' : ''}
                </small>
              </li>
            ))}
          </ol>

          {feed.length === 0 && (
            <p className="muted">Ainda não há eventos no feed.</p>
          )}

          {hasMore && (
            <button
              className="load-more"
              type="button"
              disabled={busy}
              onClick={loadMore}
            >
              {busy ? 'Carregando mais…' : 'Carregar eventos mais antigos'}
            </button>
          )}
        </section>
      </div>

      {snapshot && (
        <div className="data-grid">
          <section className="panel" aria-label="Campanhas">
            <header className="panel-heading">
              <h2>Campanhas</h2>
              <span className="source">Origem e campanha da sessão</span>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Origem / campanha</th>
                    <th scope="col">Sessões</th>
                    <th scope="col">Pageviews</th>
                    <th scope="col">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.campaigns.length > 0 ? (
                    snapshot.campaigns.map(c => (
                      <tr key={`${c.utm_source}|${c.utm_campaign}`}>
                        <td>
                          {c.utm_source ?? 'Origem desconhecida'} /{' '}
                          {c.utm_campaign ?? 'Campanha desconhecida'}
                        </td>
                        <td>{format(c.observed_sessions)}</td>
                        <td>{format(c.pageviews)}</td>
                        <td>{format(c.whatsapp_clicks)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="muted">
                        Ainda não há dados neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-label="Ações">
            <header className="panel-heading">
              <h2>Ações</h2>
              <span className="source">Cliques, não conversas nem vendas</span>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Ação</th>
                    <th scope="col">Cliques</th>
                    <th scope="col">Sessões</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.actions.length > 0 ? (
                    snapshot.actions.map(a => (
                      <tr key={a.event_type}>
                        <td>{eventTypeLabels[a.event_type] ?? a.event_type}</td>
                        <td>{format(a.clicks)}</td>
                        <td>{format(a.observed_sessions)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="muted">
                        Ainda não há dados neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-label="Rolagem">
            <header className="panel-heading">
              <h2>Rolagem</h2>
              <span className="source">
                Contextos sessão+página com rolagem possível
              </span>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Profundidade</th>
                    <th scope="col">Alcançaram</th>
                    <th scope="col">Elegíveis</th>
                    <th scope="col">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.scroll.length > 0 ? (
                    snapshot.scroll.map(s => (
                      <tr key={s.threshold_pct}>
                        <td>{s.threshold_pct}%</td>
                        <td>{format(s.reached_contexts)}</td>
                        <td>{format(s.eligible_contexts)}</td>
                        <td>
                          {s.eligible_contexts > 0
                            ? `${nf.format((s.reached_contexts / s.eligible_contexts) * 100)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="muted">
                        Sem contextos elegíveis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel" aria-label="Últimos minutos">
            <header className="panel-heading">
              <h2>Últimos minutos</h2>
              <span className="source">Horário de São Paulo</span>
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Minuto</th>
                    <th scope="col">Pageviews</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.series.length > 0 ? (
                    snapshot.series.slice(-15).map(m => (
                      <tr key={m.minute}>
                        <td>{displayTime(m.minute)}</td>
                        <td>{format(m.pageviews)}</td>
                        <td>{format(m.actions)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="muted">
                        Ainda não há dados neste período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {snapshot && (
        <p className="footnote">
          Janela: {displayTime(snapshot.window.from)} →{' '}
          {displayTime(snapshot.window.to)} · gerado em{' '}
          {displayTime(snapshot.generated_at)} · último evento recebido:{' '}
          {snapshot.freshness.last_received_at
            ? displayTime(snapshot.freshness.last_received_at)
            : '—'}
          . Cobertura: apenas o coletor próprio; bloqueadores e falta de
          consentimento podem reduzir a contagem.
        </p>
      )}

      <footer>
        Plante Uma Flor · Painel de Inteligência · Operação sem rastreadores de
        terceiros
      </footer>
    </div>
  );
}
