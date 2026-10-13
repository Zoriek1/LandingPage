import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OverviewSnapshot } from '../../shared/analytics-contract';
import Dashboard from './Dashboard';

const mockSnapshot: OverviewSnapshot = {
  data_revision: 10,
  generated_at: '2026-10-13T12:00:00.000Z',
  project_id: 'plante-uma-flor-lp',
  schema_version: 1,
  window: { from: '2026-10-13T03:00:00.000Z', to: '2026-10-13T12:00:00.000Z' },
  filters: {},
  coverage: { source: 'own_collector', traffic_class: 'observed' },
  metrics: {
    pageviews: 120,
    observed_sessions: 80,
    online_sessions: 5,
    active_time_ms: 120000,
    whatsapp_clicks: 12,
    site_clicks: 8,
    store_actions: 0,
    cta_clicks: 0,
  },
  freshness: { last_received_at: '2026-10-13T12:00:00.000Z' },
  pages: [{ path: '/', pageviews: 120, observed_sessions: 80, active_time_ms: 120000, whatsapp_clicks: 12 }],
  series: [],
  campaigns: [
    { utm_source: null, utm_campaign: null, observed_sessions: 3, pageviews: 4, whatsapp_clicks: 1 },
  ],
  actions: [{ event_type: 'whatsapp_click', clicks: 12, observed_sessions: 9 }],
  scroll: [
    { threshold_pct: 50, reached_contexts: 1, eligible_contexts: 4 },
    { threshold_pct: 90, reached_contexts: 0, eligible_contexts: 0 },
  ],
  quality: { delayed_events: 0, invalid_clock_events: 0 },
};

const mockEvents = {
  items: [
    {
      event_id: 'evt-1',
      event_type: 'whatsapp_click',
      path: '/',
      session_id: 's-1',
      occurred_at: '2026-10-13T11:59:00.000Z',
      received_at: '2026-10-13T11:59:01.000Z',
      effective_at: '2026-10-13T11:59:00.000Z',
      delayed: false,
      clock_valid: true,
      props: {},
    },
  ],
  next_cursor: null,
  has_more: false,
  as_of: '2026-10-13T12:00:00.000Z',
  generated_at: '2026-10-13T12:00:00.000Z',
  data_revision: 10,
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exibe tela de login quando não há sessão ativa', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    render(<Dashboard />);
    expect(await screen.findByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

    it('autentica, consulta métricas e renderiza os dados observados', async () => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/admin/session')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
        } as Response);
      }
      if (url.includes('/admin/login')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ username: 'admin', csrf_token: 'csrf-123', expires_at: '2026-10-14T00:00:00Z' }),
        } as Response);
      }
      if (url.includes('/admin/overview')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockSnapshot,
        } as Response);
      }
      if (url.includes('/admin/events')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockEvents,
        } as Response);
      }
      return Promise.reject(new Error(`Unexpected call: ${url}`));
    });

    render(<Dashboard />);
    await screen.findByRole('heading', { name: 'Analytics' });

    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'gestor' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('heading', { name: /Agora/ })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Páginas com mais sessões/ })).toBeInTheDocument();
    expect(screen.getAllByRole('cell').some(cell => cell.textContent === '80')).toBe(true);

    // campanhas sem UTM, ações em PT, rolagem sem elegíveis => "—"
    expect(await screen.findByText(/Origem desconhecida \/ Campanha desconhecida/)).toBeInTheDocument();
    expect(screen.getAllByText('Clique no WhatsApp').length).toBeGreaterThan(0);
    expect(screen.getByText('25%')).toBeInTheDocument();
    const row90 = screen.getByText('90%').closest('tr')!;
    expect(row90.textContent).toContain('—');

    // clicar no path do ranking aplica o filtro de página
    fireEvent.click(screen.getByRole('button', { name: '/' }));
    await waitFor(() => {
      const urls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(c => String(c[0]));
      expect(urls.some(u => u.includes('/admin/overview') && u.includes('path=%2F'))).toBe(true);
    });
  });

  it('conta chegadas únicas durante pausa usando a janela corrente', async () => {
    const event = (id: string) => ({ ...mockEvents.items[0], event_id: id });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const payload = url.includes('/admin/session')
        ? { ok: true, status: 200, json: async () => ({ username: 'admin', csrf_token: 'csrf', expires_at: '2026-10-14T00:00:00Z' }) }
        : url.includes('/admin/overview')
          ? { ok: true, status: 200, json: async () => mockSnapshot }
          : url.includes('/admin/events')
            ? { ok: true, status: 200, json: async () => ({ ...mockEvents, items: [event('evt-1')] }) }
            : { ok: true, status: 200, json: async () => ({}) };
      return Promise.resolve(payload as Response);
    });
    globalThis.fetch = fetchMock;
    render(<Dashboard />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByRole('heading', { name: /Agora/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar fluxo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    const queries = fetchMock.mock.calls.filter(([url]) => String(url).includes('/admin/events'));
    expect(queries.length).toBeGreaterThan(0);
    expect(String(queries.at(-1)?.[0])).toMatch(/\/admin\/events\?from=.*&to=/);
    expect(await screen.findByRole('button', { name: 'Retomar (0 novos)' })).toBeInTheDocument();
    vi.useRealTimers();
  }, 15000);

  it('conta chegadas únicas durante pausa e mantém janela congelada ao carregar histórico', async () => {
    const extraEvent = (id: string) => ({ ...mockEvents.items[0], event_id: id });
    const calls: string[] = [];
    let eventRequest = 0;
    let reconcile: (() => void) | undefined;
    const originalSetInterval = globalThis.setInterval;
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((callback: TimerHandler, delay?: number) => {
      if (delay === 30000 && typeof callback === 'function') reconcile = callback as () => void;
      return originalSetInterval(callback, delay);
    }) as typeof setInterval);

    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      const body = url.includes('/admin/session')
        ? { username: 'admin', csrf_token: 'csrf', expires_at: '2026-10-14T00:00:00Z' }
        : url.includes('/admin/overview')
          ? { ...mockSnapshot, data_revision: 11 }
          : url.includes('/admin/events')
            ? (() => {
                if (url.includes('cursor=')) return {
                  ...mockEvents, has_more: true, next_cursor: 'older-cursor', items: [extraEvent('older')],
                };
                eventRequest += 1;
                return {
                  ...mockEvents, has_more: true, next_cursor: 'cursor-next',
                  items: eventRequest === 1 ? [extraEvent('evt-1')] : [extraEvent('new-one'), extraEvent('new-one')],
                };
              })()
            : {};
      return Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);
    });
    render(<Dashboard />);
    await screen.findByRole('button', { name: 'Pausar fluxo' });
    fireEvent.click(screen.getByRole('button', { name: 'Pausar fluxo' }));
    await act(async () => { reconcile?.(); await Promise.resolve(); await Promise.resolve(); });
    expect(await screen.findByRole('button', { name: 'Retomar (1 novos)' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Carregar eventos mais antigos' }));
    await waitFor(() => expect(calls.some(url => url.includes('cursor='))).toBe(true));
    await screen.findAllByText('Clique no WhatsApp');
    const appendUrl = calls.find(url => url.includes('cursor='));
    expect(appendUrl).toContain('cursor=cursor-next');
    const liveUrl = calls.find(url => url.includes('/admin/events') && !url.includes('cursor='));
    expect(new URL(appendUrl!, 'http://localhost').searchParams.get('to')).toBe(
      new URL(liveUrl!, 'http://localhost').searchParams.get('to'),
    );
    expect(screen.getByRole('button', { name: 'Retomar (1 novos)' })).toBeInTheDocument();
  }, 15000);

  it('trata erro 401 em dados voltando para tela de login', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ username: 'admin', csrf_token: 'csrf-123', expires_at: '2026-10-14T00:00:00Z' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

    render(<Dashboard />);
    expect(await screen.findByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
  });

  it('aceita revisão menor após logout/login (ex.: banco restaurado) em vez de manter dados vazios', async () => {
    const session = { username: 'admin', csrf_token: 'csrf', expires_at: '2026-10-14T00:00:00Z' };
    let overviewCalls = 0;
    const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);
    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/admin/session')) return ok(session);
      if (url.includes('/admin/login')) return ok(session);
      if (url.includes('/admin/logout')) return ok({});
      if (url.includes('/admin/overview')) {
        overviewCalls += 1;
        // 1ª sessão: revisão alta. 2ª sessão: banco restaurado, revisão baixa e métrica distinta.
        return overviewCalls === 1
          ? ok({ ...mockSnapshot, data_revision: 1000 })
          : ok({
              ...mockSnapshot,
              data_revision: 5,
              metrics: { ...mockSnapshot.metrics, observed_sessions: 33 },
              pages: [{ ...mockSnapshot.pages[0], observed_sessions: 33 }],
            });
      }
      if (url.includes('/admin/events')) return ok(mockEvents);
      return Promise.reject(new Error(`Unexpected call: ${url}`));
    }) as typeof fetch;

    render(<Dashboard />);
    await screen.findByRole('heading', { name: /Páginas com mais sessões/ });
    await waitFor(() =>
      expect(screen.getAllByRole('cell').some(cell => cell.textContent === '80')).toBe(true),
    );

    fireEvent.click(screen.getByRole('button', { name: /Sair/ }));
    await screen.findByLabelText('Usuário');

    // sessão do servidor passa a exigir novo login
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'gestor' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getAllByRole('cell').some(cell => cell.textContent === '33')).toBe(true),
    );
    expect(screen.queryAllByRole('cell').some(cell => cell.textContent === '80')).toBe(false);
  });
});
