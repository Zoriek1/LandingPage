import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initAnalytics,
  navigateAnalytics,
  onAnalyticsPageView,
  recordAnalytics,
  registerAnalyticsConsentAdapter,
  resetCollectorForTesting,
  type AnalyticsConsentAdapter,
  type ConsentState,
} from './index.ts';
import { getConsentDetails, resetConsentForTesting } from './consent.ts';
import { clearQueue, enqueueEvent, getQueueLength, markBatchFailed, peekBatch } from './queue.ts';
import { getActiveSession, setBroadcastChannelNameForTesting } from './session.ts';
import { flushQueue } from './transport.ts';
import { resetStorageModeForTesting } from './storage.ts';
import {
  EVENT_TTL_MS,
  MAX_ATTEMPTS,
  MAX_BATCH_BYTES,
  MAX_EVENTS_PER_BATCH,
  QUEUE_MAX_BYTES,
  QUEUE_MAX_EVENTS,
  type AnalyticsAck,
  type AnalyticsEnvelope,
  type AnalyticsEvent,
} from '../../shared/analytics-contract.ts';
import { validAnalyticsEnvelope } from '../../shared/analytics-fixtures.ts';

const QUEUE_KEY = '_puf_analytics_v1_queue';
const SESSION_KEY = '_puf_analytics_v1_session';
const utf8Bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

describe('Analytics collector: limits, retry and lifecycle proofs', () => {
  let mockConsent: ConsentState = 'unknown';
  let listeners: Array<() => void> = [];

  const adapter: AnalyticsConsentAdapter = {
    getConsent: () => mockConsent,
    subscribe: (listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    policyVersion: 'analytics-v1',
  };

  const setConsent = (state: ConsentState) => {
    mockConsent = state;
    listeners.forEach((l) => l());
  };

  /** Valid event; `compact` drops the optional attribution/lp_slug to stay small. */
  const makeEvent = (compact = false): AnalyticsEvent => {
    const base = validAnalyticsEnvelope.events[0];
    const event: AnalyticsEvent = {
      ...base,
      event_id: crypto.randomUUID(),
      event_type: 'cta_click',
      consent: {
        analytics: 'granted',
        policy_version: 'analytics-v1',
        scope_id: getConsentDetails().scopeId,
        collected_at: getConsentDetails().collectedAt,
      },
      props: {
        cta_id: 'a',
        cta_location: 'b',
        action: 'open_selector',
      },
    };
    if (compact) {
      delete event.attribution;
      delete event.lp_slug;
      event.path = '/';
      event.entry_type = 'main';
    }
    return event;
  };

  const ackFor = (envelope: AnalyticsEnvelope, accepted = envelope.events.length): AnalyticsAck => ({
    schema_version: 1,
    batch_id: envelope.batch_id,
    committed_at: new Date().toISOString(),
    results: envelope.events.slice(0, accepted).map((e, index) => ({ index, event_id: e.event_id, status: 'accepted' as const })),
    counts: { accepted, duplicate: 0, rejected: 0 },
  });

  const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

  const sentEnvelope = (fetchMock: ReturnType<typeof vi.fn>, call: number): AnalyticsEnvelope =>
    JSON.parse(fetchMock.mock.calls[call][1].body);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T22:00:00.000Z'));
    sessionStorage.clear();
    resetCollectorForTesting();
    resetConsentForTesting();
    resetStorageModeForTesting();
    mockConsent = 'unknown';
    listeners = [];
    vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('VITE_ANALYTICS_API_URL', 'https://api.example.com');
    registerAnalyticsConsentAdapter(adapter);
  });

  afterEach(() => {
    resetCollectorForTesting();
    resetConsentForTesting();
    resetStorageModeForTesting();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('queue keeps at most 100 events / 128 KiB, evicting the oldest first', () => {
    setConsent('granted');
    const events: AnalyticsEvent[] = [];
    for (let i = 0; i < QUEUE_MAX_EVENTS + 20; i += 1) {
      const event = makeEvent(true);
      event.event_id = `${String(i).padStart(8, '0')}-0000-4000-8000-000000000000`;
      events.push(event);
      expect(enqueueEvent(event)).toBe(true);
    }

    expect(getQueueLength()).toBe(QUEUE_MAX_EVENTS);
    const stored: Array<{ event: AnalyticsEvent }> = JSON.parse(sessionStorage.getItem(QUEUE_KEY));
    const storedIds = stored.map((item) => item.event.event_id);
    expect(storedIds).toEqual(events.slice(20).map((e) => e.event_id));
    expect(utf8Bytes(stored.map((item) => item.event))).toBeLessThanOrEqual(QUEUE_MAX_BYTES);

    // Size, not count, also evicts when near-limit events exceed 128 KiB first.
    clearQueue();
    const largeEvents: AnalyticsEvent[] = [];
    for (let i = 0; i < QUEUE_MAX_EVENTS; i += 1) {
      const event = makeEvent(false);
      event.event_id = `${String(i + 100).padStart(8, '0')}-0000-4000-8000-000000000000`;
      event.props.cta_id = `x${i}`;
      event.occurred_at = new Date(Date.now() + i).toISOString();
      event.client_seq = i + 1;
      event.attribution = {
        session_entry: { utm_source: 's'.repeat(80), utm_medium: 'm'.repeat(80), utm_campaign: 'c'.repeat(100) },
        current: { utm_source: 's'.repeat(80), utm_medium: 'm'.repeat(80), utm_campaign: 'c'.repeat(100) },
        referrer_host: `${'r'.repeat(240)}.com`,
      };
      largeEvents.push(event);
      expect(enqueueEvent(event), `event ${i}, bytes=${utf8Bytes(event)}`).toBe(true);
    }
    const largeStored: Array<{ event: AnalyticsEvent }> = JSON.parse(sessionStorage.getItem(QUEUE_KEY));
    const largeBytes = utf8Bytes(largeStored.map((item) => item.event));
    expect(largeBytes).toBeLessThanOrEqual(QUEUE_MAX_BYTES);
    expect(largeBytes).toBeGreaterThan(QUEUE_MAX_BYTES * 0.75);
    expect(largeStored.length).toBeLessThan(QUEUE_MAX_EVENTS);
    expect(largeStored[0].event.event_id).toBe(largeEvents[QUEUE_MAX_EVENTS - largeStored.length].event_id);
  }, 30_000);

  it('a batch holds at most 50 events and, when events are larger, stays under 32 KiB of UTF-8 envelope', () => {
    setConsent('granted');
    Array.from({ length: 60 }, () => makeEvent(true)).forEach((e) => enqueueEvent(e));
    const small = peekBatch();
    const smallEnvelope = { schema_version: 1, project_id: validAnalyticsEnvelope.project_id, batch_id: crypto.randomUUID(), events: small };
    expect(small).toHaveLength(MAX_EVENTS_PER_BATCH);
    expect(utf8Bytes(smallEnvelope)).toBeLessThanOrEqual(MAX_BATCH_BYTES);

    // Larger events: byte limit (not the count) must be what ends the batch.
    sessionStorage.clear();
    resetCollectorForTesting();
    resetConsentForTesting();
    mockConsent = 'unknown';
    registerAnalyticsConsentAdapter(adapter);
    setConsent('granted');
    Array.from({ length: 80 }, () => makeEvent(false)).forEach((e) => enqueueEvent(e));
    const big = peekBatch();
    const envelope = { schema_version: 1, project_id: validAnalyticsEnvelope.project_id, batch_id: crypto.randomUUID(), events: big };
    expect(big.length).toBeGreaterThan(0);
    expect(big.length).toBeLessThan(MAX_EVENTS_PER_BATCH);
    expect(utf8Bytes(envelope)).toBeLessThanOrEqual(MAX_BATCH_BYTES);
  });

  it('drops events older than 10 min and stops retrying an event after 5 attempts', () => {
    setConsent('granted');
    const stale = makeEvent();
    enqueueEvent(stale);
    vi.setSystemTime(Date.now() + EVENT_TTL_MS + 1);
    expect(peekBatch()).toEqual([]);

    const flaky = makeEvent();
    enqueueEvent(flaky);
    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt += 1) {
      markBatchFailed([flaky], false);
      expect(peekBatch().map((e) => e.event_id)).toEqual([flaky.event_id]);
    }
    markBatchFailed([flaky], false);
    expect(peekBatch()).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem(QUEUE_KEY))).toEqual([]);
  });

  it('413 splits the next batch in half and keeps the same event IDs', async () => {
    setConsent('granted');
    const events = Array.from({ length: 40 }, (_, index) => {
      const event = makeEvent(false);
      event.props.cta_id = `split-${index}`;
      event.attribution = {
        session_entry: { utm_source: 's'.repeat(80), utm_medium: 'm'.repeat(80), utm_campaign: 'c'.repeat(100) },
        current: { utm_source: 's'.repeat(80), utm_medium: 'm'.repeat(80), utm_campaign: 'c'.repeat(100) },
        referrer_host: `${'r'.repeat(240)}.com`,
      };
      event.event_id = `${String(index + 100).padStart(8, '0')}-0000-4000-8000-000000000000`;
      event.occurred_at = new Date(Date.now() + index).toISOString();
      event.client_seq = index + 1;
      return event;
    });
    events.forEach((e) => expect(enqueueEvent(e), `413 event ${e.client_seq}`).toBe(true));

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 413 }))
      .mockImplementation(async (_url, init) => jsonResponse(ackFor(JSON.parse(init.body))));
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal('fetch', fetchMock);

    await flushQueue();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentEnvelope(fetchMock, 0).events.length).toBeGreaterThan(1);
    const sentIds = sentEnvelope(fetchMock, 0).events.map((event) => event.event_id);
    expect(getQueueLength()).toBe(40);
    expect(sentIds.every((id) => events.some((event) => event.event_id === id))).toBe(true);

    await vi.advanceTimersByTimeAsync(31_000);
    await flushQueue();
    const retried = sentEnvelope(fetchMock, 1).events;
    expect(retried.length).toBeLessThanOrEqual(MAX_EVENTS_PER_BATCH / 2);
    expect(retried.map((e) => e.event_id)).toEqual(events.slice(0, retried.length).map((e) => e.event_id));
    expect(getQueueLength()).toBe(40 - retried.length);
  });

  it('repeated 413 shrinks the batch down to 1 without losing IDs; a singleton ACK removes only that event', async () => {
    setConsent('granted');
    const events = Array.from({ length: MAX_EVENTS_PER_BATCH }, (_, index) => {
      const event = makeEvent(true);
      event.event_id = `${String(index + 100).padStart(8, '0')}-0000-4000-8000-000000000000`;
      event.occurred_at = new Date(Date.now() + index).toISOString();
      event.client_seq = index + 1;
      return event;
    });
    events.forEach((e) => expect(enqueueEvent(e), `event ${e.client_seq}`).toBe(true));
    const allIds = events.map((e) => e.event_id);
    const storedIds = () =>
      (JSON.parse(sessionStorage.getItem(QUEUE_KEY)) as Array<{ event: AnalyticsEvent }>).map((item) => item.event.event_id);

    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      const { events: sent } = JSON.parse(init.body);
      return sent.length > 1 ? new Response('', { status: 413 }) : jsonResponse(ackFor(JSON.parse(init.body)));
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    vi.stubGlobal('fetch', fetchMock);

    // Keep shrinking on every 413 (each halves the *actual* sent size) until a singleton goes out.
    const sentSizes: number[] = [];
    for (let call = 0; call < 10 && (sentSizes.at(-1) ?? Infinity) > 1; call += 1) {
      await flushQueue();
      const envelope = sentEnvelope(fetchMock, call);
      sentSizes.push(envelope.events.length);
      // Every 413 leaves the whole queue intact and in the same order.
      if (envelope.events.length > 1) {
        expect(storedIds()).toEqual(allIds);
        expect(getQueueLength()).toBe(allIds.length);
        await vi.advanceTimersByTimeAsync(31_000);
      }
    }

    expect(sentSizes[0]).toBeGreaterThan(1);
    sentSizes.slice(1).forEach((size, i) => expect(size).toBe(Math.floor(sentSizes[i] / 2)));
    expect(sentSizes.at(-1)).toBe(1);
    expect(sentSizes.length).toBeGreaterThan(MAX_ATTEMPTS - 1);

    // The singleton was ACKed: exactly that one event is gone, all the others are preserved.
    const singleton = sentEnvelope(fetchMock, sentSizes.length - 1).events[0];
    expect(singleton.event_id).toBe(allIds[0]);
    expect(getQueueLength()).toBe(allIds.length - 1);
    expect(storedIds()).toEqual(allIds.slice(1));
  });

  it('429 waits for Retry-After before the next request and keeps the queue', async () => {
    setConsent('granted');
    const event = makeEvent();
    enqueueEvent(event);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '10' } }))
      .mockImplementation(async (_url, init) => jsonResponse(ackFor(JSON.parse(init.body))));
    vi.stubGlobal('fetch', fetchMock);

    await flushQueue();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(9_000);
    await flushQueue();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getQueueLength()).toBe(1);

    await vi.advanceTimersByTimeAsync(1_100);
    await flushQueue();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentEnvelope(fetchMock, 1).events[0].event_id).toBe(event.event_id);
    expect(getQueueLength()).toBe(0);
  });

  it('a late ACK from a revoked scope does not touch the regranted scope or its transport lock', async () => {
    initAnalytics();
    setConsent('granted');
    const firstScopeEvent = peekBatch()[0];
    expect(firstScopeEvent.event_type).toBe('page_view');
    recordAnalytics('cta_click', { cta_id: 'old_scope', cta_location: 'hero', action: 'open_selector' });
    const oldScopeQueueIds = peekBatch().map((event) => event.event_id);
    expect(oldScopeQueueIds).toHaveLength(3);
    expect(oldScopeQueueIds).toContain(firstScopeEvent.event_id);

    let resolveOld: (response: Response) => void;
    const fetchMock = vi.fn().mockImplementationOnce(
      () => new Promise<Response>((resolve) => { resolveOld = resolve; }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const oldFlush = flushQueue();
    const oldEnvelope = sentEnvelope(fetchMock, 0);

    setConsent('denied');
    expect(getQueueLength()).toBe(0);
    expect(sessionStorage.getItem(QUEUE_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();

    setConsent('granted');
    const newScopeEvents = peekBatch();
    expect(newScopeEvents.filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    const newScopeEvent = newScopeEvents.find((event) => event.event_type === 'page_view')!;
    expect(newScopeEvents.every((event) => event.consent.scope_id === newScopeEvent.consent.scope_id)).toBe(true);
    expect(newScopeEvent.consent.scope_id).not.toBe(firstScopeEvent.consent.scope_id);
    expect(newScopeEvent.session_id).not.toBe(firstScopeEvent.session_id);
    expect(newScopeEvents.some((event) => oldScopeQueueIds.includes(event.event_id))).toBe(false);

    // Old request answers late with a valid-looking ACK for the old batch.
    resolveOld(jsonResponse(ackFor(oldEnvelope)));
    await oldFlush;

    expect(peekBatch().filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    expect(peekBatch().some((event) => event.event_id === newScopeEvent.event_id)).toBe(true);
    expect(peekBatch().some((event) => oldScopeQueueIds.includes(event.event_id))).toBe(false);

    // The old request must not leave the lock held: the new scope can send.
    fetchMock.mockImplementation(async (_url, init) => jsonResponse(ackFor(JSON.parse(init.body))));
    await flushQueue();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentEnvelope(fetchMock, 1).events[0].event_id).toBe(newScopeEvent.event_id);
    expect(getQueueLength()).toBe(0);
  });

  it('keeps session and queue in memory when sessionStorage is unavailable, flagging storage_mode', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('denied', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('denied', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('denied', 'SecurityError'); });

    initAnalytics();
    setConsent('granted');
    recordAnalytics('cta_click', { cta_id: 'hero_button', cta_location: 'hero', action: 'open_selector' });

    const session = getActiveSession();
    expect(session).not.toBeNull();
    const batch = peekBatch();
    expect(batch.filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    expect(batch.some((event) => event.event_type === 'heartbeat')).toBe(true);
    expect(batch.some((event) => event.event_type === 'cta_click')).toBe(true);
    expect(batch[0].props).toMatchObject({ storage_mode: 'memory' });
    expect(batch.every((e) => e.session_id === session.sessionId)).toBe(true);

    vi.restoreAllMocks();
    expect(sessionStorage.getItem(QUEUE_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('SPA navigation closes the old page slice on the old path/pageview; the new pageview starts at delta 0', () => {
    // Fake performance.now() starts at 0, which sensors.ts uses as an "unset" checkpoint sentinel.
    vi.advanceTimersByTime(1);
    initAnalytics();
    setConsent('granted');
    const oldPageView = peekBatch().find((event) => event.event_type === 'page_view')!;

    window.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.advanceTimersByTime(5_000);
    navigateAnalytics('/urgencia');

    const queued = peekBatch();
    const closing = queued.find((e) => e.event_type === 'heartbeat' && (e.props as { reason?: string }).reason === 'navigation')!;
    expect(closing).toBeDefined();
    expect(closing.path).toBe(oldPageView.path);
    expect(closing.pageview_id).toBe(oldPageView.pageview_id);
    expect((closing.props as { active_time_delta_ms: number }).active_time_delta_ms).toBeGreaterThan(0);

    const newPageView = queued.filter((e) => e.event_type === 'page_view').find((e) => e.path === '/urgencia')!;
    expect(newPageView).toBeDefined();
    expect(newPageView.pageview_id).not.toBe(oldPageView.pageview_id);
    const newHeartbeats = queued.filter((e) => e.event_type === 'heartbeat' && e.pageview_id === newPageView.pageview_id);
    expect(newHeartbeats.length).toBeGreaterThan(0);
    newHeartbeats.forEach((e) => expect((e.props as { active_time_delta_ms: number }).active_time_delta_ms).toBe(0));
  });

  it('reload keeps the session but starts a new pageview', async () => {
    setBroadcastChannelNameForTesting(`reload-before-${crypto.randomUUID()}`);
    initAnalytics();
    setConsent('granted');
    const before = getActiveSession();
    const storedBefore: Array<{ event: AnalyticsEvent }> = JSON.parse(sessionStorage.getItem(QUEUE_KEY));
    expect(storedBefore.filter((item) => item.event.event_type === 'page_view')).toHaveLength(1);
    const pending = makeEvent(false);
    pending.props.cta_id = 'reload_pending';
    expect(enqueueEvent(pending)).toBe(true);
    const queueBeforeReload: Array<{ event: AnalyticsEvent }> = JSON.parse(sessionStorage.getItem(QUEUE_KEY));
    expect(queueBeforeReload.map((item) => item.event.event_id)).toContain(pending.event_id);

    // Simulate reload: fresh JS modules, same-tab sessionStorage.
    vi.resetModules();
    const reloaded = await import('./index.ts');
    const reloadedSession = await import('./session.ts');
    reloadedSession.setBroadcastChannelNameForTesting(`reload-after-${crypto.randomUUID()}`);
    reloaded.registerAnalyticsConsentAdapter(adapter);
    reloaded.initAnalytics();

    const after = reloadedSession.getActiveSession();
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.pageviewId).not.toBe(before.pageviewId);

    const storedAfter: Array<{ event: AnalyticsEvent }> = JSON.parse(sessionStorage.getItem(QUEUE_KEY));
    const pageViews = storedAfter.map((i) => i.event).filter((e) => e.event_type === 'page_view');
    expect(storedAfter.some((item) => item.event.event_id === pending.event_id)).toBe(true);
    expect(storedAfter.some((item) => item.event.event_type === 'heartbeat')).toBe(true);
    expect(pageViews).toHaveLength(2);
    expect(new Set(pageViews.map((e) => e.pageview_id)).size).toBe(2);
    expect(new Set(pageViews.map((e) => e.session_id)).size).toBe(1);
    expect(pageViews[1].props).toMatchObject({ navigation_reason: 'initial' });

    reloaded.resetCollectorForTesting();
  });

  it('with the flag absent nothing runs: no listeners, storage, session or network', async () => {
    vi.stubEnv('VITE_ANALYTICS_ENABLED', undefined);
    mockConsent = 'granted';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const pageViewListener = vi.fn();
    onAnalyticsPageView(pageViewListener);

    initAnalytics();
    navigateAnalytics('/urgencia');
    recordAnalytics('cta_click', { cta_id: 'hero_button', cta_location: 'hero', action: 'open_selector' });
    setConsent('granted');
    await vi.advanceTimersByTimeAsync(60_000);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pageViewListener).not.toHaveBeenCalled();
    expect(getQueueLength()).toBe(0);
    expect(sessionStorage.getItem(QUEUE_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
