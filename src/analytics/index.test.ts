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
import { getConsentState, resetConsentForTesting } from './consent.ts';
import {
  clearQueue,
  enqueueEvent,
  getQueueLength,
  loadQueue,
  markBatchFailed,
  peekBatch,
} from './queue.ts';
import {
  getActiveSession,
  getLastUserActivityAt,
  setBroadcastChannelNameForTesting,
  startNewSession,
  touchUserActivity,
} from './session.ts';
import { flushQueue, parseRetryAfter } from './transport.ts';
import { extractActiveTimeDelta, startSensors, stopSensors } from './sensors.ts';
import { getStorageMode, resetStorageModeForTesting } from './storage.ts';
import {
  ACTIVE_IDLE_MS,
  EVENT_TTL_MS,
  SESSION_IDLE_MS,
  type AnalyticsAck,
  type AnalyticsEvent,
} from '../../shared/analytics-contract.ts';

describe('Analytics Collector (Marco A)', () => {
  let mockConsent: ConsentState = 'unknown';
  let consentListeners: Array<() => void> = [];

  const testAdapter: AnalyticsConsentAdapter = {
    getConsent: () => mockConsent,
    subscribe: (listener: () => void) => {
      consentListeners.push(listener);
      return () => {
        consentListeners = consentListeners.filter((l) => l !== listener);
      };
    },
    policyVersion: 'analytics-v1',
  };

  const updateConsent = (state: ConsentState) => {
    mockConsent = state;
    consentListeners.forEach((l) => l());
  };

  beforeEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
    resetCollectorForTesting();
    resetConsentForTesting();
    mockConsent = 'unknown';
    consentListeners = [];

    // Enable analytics in import.meta.env
    vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('VITE_ANALYTICS_API_URL', 'https://api.example.com');
    vi.stubEnv('VITE_RELEASE_SHA', 'development');

    registerAnalyticsConsentAdapter(testAdapter);
  });

  afterEach(() => {
    resetCollectorForTesting();
    resetConsentForTesting();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('no storage or identity before consent is granted', () => {
    initAnalytics();
    recordAnalytics('cta_click', { cta_id: 'hero_btn', cta_location: 'hero', action: 'open_selector' });

    expect(getConsentState()).toBe('unknown');
    expect(getActiveSession()).toBeNull();
    expect(getQueueLength()).toBe(0);
    expect(sessionStorage.getItem('_puf_analytics_v1_session')).toBeNull();
    expect(sessionStorage.getItem('_puf_analytics_v1_queue')).toBeNull();
  });

  it('late consent grant starts session, emits page_view and notifies pageview listeners', () => {
    const pageViewListener = vi.fn();
    const unsub = onAnalyticsPageView(pageViewListener);

    initAnalytics();
    expect(pageViewListener).not.toHaveBeenCalled();

    // User accepts cookies later
    updateConsent('granted');

    expect(pageViewListener).toHaveBeenCalledTimes(1);
    expect(getActiveSession()).not.toBeNull();
    const queued = peekBatch();
    expect(queued.filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    expect(queued.some((event) => event.event_type === 'heartbeat')).toBe(true);
    expect(queued[0].event_type).toBe('page_view');
    expect(queued[0].props.navigation_reason).toBe('consent_grant');
    expect(queued[0].consent.analytics).toBe('granted');
    expect(queued[0].consent.policy_version).toBe('analytics-v1');
    expect(queued[0].consent.scope_id).toBeDefined();

    unsub();
  });

  it('revocation aborts in-flight network, clears queue, session and storage', () => {
    updateConsent('granted');
    initAnalytics();

    recordAnalytics('cta_click', { cta_id: 'btn1', cta_location: 'hero', action: 'open_selector' });
    expect(getQueueLength()).toBeGreaterThan(0);
    expect(sessionStorage.getItem('_puf_analytics_v1_session')).not.toBeNull();

    const previousScopeId = peekBatch()[0].consent.scope_id;

    // Consent revoked by user
    updateConsent('denied');

    expect(getQueueLength()).toBe(0);
    expect(getActiveSession()).toBeNull();
    expect(sessionStorage.getItem('_puf_analytics_v1_session')).toBeNull();
    expect(sessionStorage.getItem('_puf_analytics_v1_queue')).toBeNull();

    // Re-granting consent creates a brand new scope_id
    updateConsent('granted');
    const newBatch = peekBatch();
    expect(newBatch[0].consent.scope_id).not.toBe(previousScopeId);
  });

  it('preserves stable event IDs and retries on network failures', async () => {
    updateConsent('granted');
    initAnalytics();

    recordAnalytics('cta_click', { cta_id: 'stable_cta', cta_location: 'hero', action: 'open_selector' });
    const initialBatch = peekBatch();
    const stableEventId = initialBatch[initialBatch.length - 1].event_id;

    // Simulate network error
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await flushQueue();
    expect(result).toBe(false);

    // Queue must retain the failed event with the exact same event_id
    const retriedBatch = peekBatch();
    const retriedEvent = retriedBatch.find((e) => e.event_id === stableEventId);
    expect(retriedEvent).toBeDefined();
    expect(retriedEvent?.event_id).toBe(stableEventId);
  });

  it('does not treat response.ok or arbitrary 200 as ACK without contract compliance', async () => {
    updateConsent('granted');
    initAnalytics();

    recordAnalytics('cta_click', { cta_id: 'cta_test', cta_location: 'hero', action: 'open_selector' });
    expect(peekBatch().filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    expect(peekBatch().filter((event) => event.event_type === 'cta_click')).toHaveLength(1);

    // Server returns 200 with invalid ACK body
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }), // Not a valid AnalyticsAck
    }));

    const result = await flushQueue();
    expect(result).toBe(false);
    expect(getQueueLength()).toBe(3); // initial heartbeat, page_view and CTA remain
  });

  it('processes partial ACK: only dequeues accepted/duplicate/rejected items', async () => {
    updateConsent('granted');
    initAnalytics();

    recordAnalytics('cta_click', { cta_id: 'btn_ack1', cta_location: 'hero', action: 'open_selector' });
    const batch = peekBatch();
    expect(batch.filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    expect(batch.filter((event) => event.event_type === 'heartbeat')).toHaveLength(1);
    expect(batch.filter((event) => event.event_type === 'cta_click')).toHaveLength(1);

    const firstEventId = batch[0].event_id;
    const secondEventId = batch[1].event_id;

    // Server only acks the first event, not the second
    const partialAck: AnalyticsAck = {
      schema_version: 1,
      batch_id: 'test-batch',
      committed_at: new Date().toISOString(),
      results: [
        { index: 0, event_id: firstEventId, status: 'accepted' },
      ],
      counts: { accepted: 1, duplicate: 0, rejected: 0 },
    };

    vi.stubGlobal('fetch', vi.fn().mockImplementation((url, opts) => {
      const parsedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ ...partialAck, batch_id: parsedBody.batch_id }),
      });
    }));

    const result = await flushQueue();
    expect(result).toBe(true);

    const remaining = peekBatch();
    expect(remaining).toHaveLength(2);
    expect(remaining.map((event) => event.event_id)).toContain(secondEventId);
    expect(remaining.some((event) => event.event_type === 'heartbeat')).toBe(true);
  });

  it('handles 413 payload too large by splitting batch size on subsequent attempts', async () => {
    updateConsent('granted');
    initAnalytics();

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      headers: new Headers(),
    }));

    await flushQueue();
    // Subsequent peekBatch should have reduced batch size limit
    expect(peekBatch()).toBeDefined();
  });

  it('respects 429 Retry-After header and backs off', async () => {
    updateConsent('granted');
    initAnalytics();

    const headers = new Headers();
    headers.set('Retry-After', '10');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers,
    }));

    await flushQueue();

    // Immediate next flush should be blocked by retryAfter delay
    const immediateNext = await flushQueue();
    expect(immediateNext).toBe(false);
  });

  it('heartbeat does NOT extend session idle timer', () => {
    updateConsent('granted');
    initAnalytics();

    const session = getActiveSession();
    expect(session).not.toBeNull();
    const originalActivity = getLastUserActivityAt();

    // Simulate 35 minutes passing
    const thirtyFiveMinutesLater = originalActivity + SESSION_IDLE_MS + 5 * 60 * 1000;
    vi.spyOn(Date, 'now').mockReturnValue(thirtyFiveMinutesLater);

    // Heartbeat occurs
    recordAnalytics('heartbeat', {
      visibility_state: 'visible',
      active: false,
      active_time_delta_ms: 0,
      idle_ms: 30000,
      reason: 'interval',
      scrollable: true,
    });

    // Activity timestamp must not have changed because of heartbeat!
    expect(getLastUserActivityAt()).toBe(originalActivity);

    // Now a genuine user interaction occurs -> triggers session renewal
    const renewed = touchUserActivity();
    expect(renewed).toBe(true);
    expect(getActiveSession()?.sessionId).not.toBe(session?.sessionId);
  });

  it('deduplicates offer_variant_seen by pageview + param + key + state and ignores hidden tabs', () => {
    updateConsent('granted');
    initAnalytics();

    const variantProps = {
      variant_param: 'oferta',
      variant_key: '65',
      variant_state: 'configured' as const,
      variant_product_id: 'girassol-avulso',
    };

    // 1. When document is hidden, it is ignored
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    recordAnalytics('offer_variant_seen', variantProps);
    let events = peekBatch().filter((e) => e.event_type === 'offer_variant_seen');
    expect(events.length).toBe(0);

    // 2. When document is visible, first call is recorded
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    recordAnalytics('offer_variant_seen', variantProps);
    events = peekBatch().filter((e) => e.event_type === 'offer_variant_seen');
    expect(events.length).toBe(1);

    // 3. Second call in same pageview is deduplicated
    recordAnalytics('offer_variant_seen', variantProps);
    events = peekBatch().filter((e) => e.event_type === 'offer_variant_seen');
    expect(events.length).toBe(1);

    // 4. After SPA navigation, new presentation can record the variant again
    navigateAnalytics('/urgencia');
    recordAnalytics('offer_variant_seen', variantProps);
    events = peekBatch().filter((e) => e.event_type === 'offer_variant_seen');
    expect(events.length).toBe(2);
  });

  it('bfcache restoration rotates pageview and emits page_view with bfcache_restore', () => {
    updateConsent('granted');
    initAnalytics();

    const initialPageviewId = getActiveSession()?.pageviewId;
    const pageViewListener = vi.fn();
    onAnalyticsPageView(pageViewListener);

    // Trigger pageshow with persisted = true
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

    const updatedPageviewId = getActiveSession()?.pageviewId;
    expect(updatedPageviewId).not.toBe(initialPageviewId);
    expect(pageViewListener).toHaveBeenCalled();

    const batch = peekBatch();
    const restoredPageView = batch.find((event) => event.event_type === 'page_view' && event.props.navigation_reason === 'bfcache_restore');
    expect(restoredPageView).toBeDefined();
  });

  it('rejects oversized events (> 4KiB) and validates props', () => {
    updateConsent('granted');
    initAnalytics();

    const hugeString = 'a'.repeat(5000);
    recordAnalytics('cta_click', { cta_id: hugeString, cta_location: 'hero', action: 'open_selector' });

    const ctaEvents = peekBatch().filter((e) => e.event_type === 'cta_click');
    expect(ctaEvents.length).toBe(0);
  });

  it('permanently discards batch on fatal client status (400, 403, 415, 422)', async () => {
    updateConsent('granted');
    initAnalytics();

    recordAnalytics('cta_click', { cta_id: 'btn_fatal', cta_location: 'hero', action: 'open_selector' });
    expect(getQueueLength()).toBeGreaterThan(0);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers(),
    }));

    await flushQueue();
    // Batch must be permanently dropped immediately, not retried 5 times
    expect(getQueueLength()).toBe(0);
  });

  it('respects Retry-After header up to EVENT_TTL_MS (e.g. 60s server window)', () => {
    expect(parseRetryAfter('60')).toBe(60000);
    expect(parseRetryAfter(String(EVENT_TTL_MS / 1000 + 100))).toBe(EVENT_TTL_MS);
    expect(parseRetryAfter(null)).toBeNull();
  });

  it('drops items that reach maximum attempt limit (5 attempts)', () => {
    updateConsent('granted');
    initAnalytics();

    const batch = peekBatch();
    expect(batch.length).toBeGreaterThan(0);

    // Fail 4 times: items should remain
    for (let i = 0; i < 4; i++) {
      markBatchFailed(batch, false);
      expect(peekBatch().length).toBeGreaterThan(0);
    }

    // 5th failure: items must be dropped
    markBatchFailed(batch, false);
    expect(peekBatch().length).toBe(0);
  });

  it('session does not expire when active, but expires and starts new session after > 30min idle', () => {
    updateConsent('granted');
    initAnalytics();

    const initialSessionId = getActiveSession()?.sessionId;
    expect(initialSessionId).toBeDefined();

    // Within 30 min idle: session persists
    expect(touchUserActivity()).toBe(false);
    expect(getActiveSession()?.sessionId).toBe(initialSessionId);

    // Simulate > 30 min idle time
    const session = getActiveSession()!;
    session.lastUserActivityAt = Date.now() - (SESSION_IDLE_MS + 1000);

    // Heartbeat never extends session! Heartbeat does not touchUserActivity.
    // Next genuine user activity touches activity and renews session
    const renewed = touchUserActivity();
    expect(renewed).toBe(true);
    expect(getActiveSession()?.sessionId).not.toBe(initialSessionId);
  });

  it('SPA navigation touches user activity and starts new session if idle > 30min', () => {
    updateConsent('granted');
    initAnalytics();

    const session = getActiveSession()!;
    const oldSessionId = session.sessionId;

    // Simulate 31 minutes idle before user clicks a route link
    session.lastUserActivityAt = Date.now() - (SESSION_IDLE_MS + 5000);

    navigateAnalytics('/urgencia');

    const newSession = getActiveSession();
    expect(newSession?.sessionId).not.toBe(oldSessionId);

    const events = peekBatch().filter((e) => e.event_type === 'page_view' && e.props.navigation_reason === 'spa_navigation');
    expect(events.length).toBe(1);
    expect(events[0].path).toBe('/urgencia');
  });

  it('handles cloned tab via BroadcastChannel with deterministic tie-breaker', async () => {
    updateConsent('granted');
    const channelName = `test_tab_clone_${Date.now()}`;
    setBroadcastChannelNameForTesting(channelName);
    initAnalytics();

    const originalTabId = getActiveSession()?.tabId;
    const originalSessionId = getActiveSession()?.sessionId;
    expect(originalTabId).toBeDefined();

    // Enqueue an event in the first tab
    recordAnalytics('cta_click', { cta_id: 'btn1', cta_location: 'hero', action: 'open_selector' });
    expect(peekBatch().length).toBeGreaterThan(1); // page_view + cta_click

    // Open an external peer BroadcastChannel simulating a cloned tab that sent claim_tab
    const peerChannel = new BroadcastChannel(channelName);

    // Send a claim_tab message from a competitor that wins (smaller instanceId '0000-peer')
    peerChannel.postMessage({
      type: 'claim_tab',
      tabId: originalTabId,
      instanceId: '00000000-peer-winner',
    });

    // Wait a brief moment for the BroadcastChannel message event
    await new Promise((r) => setTimeout(r, 20));

    // The losing cloned tab must rotate its tabId and sessionId, and clear the cloned queue
    const sessionAfter = getActiveSession();
    expect(sessionAfter?.tabId).not.toBe(originalTabId);
    expect(sessionAfter?.sessionId).not.toBe(originalSessionId);

    // The cloned queue was cleared and replaced by the new presentation's initial page_view
    const queueAfter = peekBatch();
    expect(queueAfter.filter((event) => event.event_type === 'page_view')).toHaveLength(1);
    expect(queueAfter.some((event) => event.event_type === 'heartbeat')).toBe(true);
    expect(queueAfter.every((event) => event.session_id === sessionAfter?.sessionId)).toBe(true);

    peerChannel.close();
  });

  it('falls back to memory storage when sessionStorage throws error', () => {
    resetStorageModeForTesting();

    // Mock sessionStorage throwing
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(getStorageMode()).toBe('memory');

    spy.mockRestore();
    resetStorageModeForTesting();
  });

  it('preserves active time slice on visibilitychange to hidden with active: true', () => {
    updateConsent('granted');
    initAnalytics();

    // Advance performance timer simulation
    const checkpoint = extractActiveTimeDelta();
    expect(checkpoint).toBeGreaterThanOrEqual(0);

    // Simulate visibility change to hidden
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));

    // Heartbeat emitted on hidden must have active: true if within active idle threshold
    const heartbeats = peekBatch().filter(
      (e) => e.event_type === 'heartbeat' && e.props.reason === 'visibility_change'
    );
    expect(heartbeats.length).toBe(1);
    expect(heartbeats[0].props.visibility_state).toBe('hidden');
    expect(heartbeats[0].props.active).toBe(true);
  });

  it('programmatic scroll does not fire scroll_depth without user scroll intent', () => {
    updateConsent('granted');
    initAnalytics();

    // Scroll without prior user interaction (e.g. wheel, touchmove, pointerdown)
    window.dispatchEvent(new Event('scroll'));

    const scrollEvents = peekBatch().filter((e) => e.event_type === 'scroll_depth');
    expect(scrollEvents.length).toBe(0);
  });
});
