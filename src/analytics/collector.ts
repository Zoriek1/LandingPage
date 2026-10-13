import {
  canonicalPath,
  PROJECT_ID,
  SCHEMA_VERSION,
  type AnalyticsEvent,
  type EventType,
} from '../../shared/analytics-contract.ts';
import { buildEventAttribution } from './attribution.ts';
import {
  getConsentDetails,
  getConsentPolicyVersion,
  getConsentState,
  onConsentStateChange,
  registerConsentAdapter,
} from './consent.ts';
import type { AnalyticsConsentAdapter } from './types.ts';
import { detectDeviceClass, resolveEntryInfo } from './device.ts';
import { clearQueue, enqueueEvent } from './queue.ts';
import {
  extractActiveTimeDelta,
  isPageScrollable,
  resetScrollThresholds,
  startSensors,
  stopSensors,
} from './sensors.ts';
import {
  clearSession,
  getActiveSession,
  nextClientSeq,
  onTabDuplicated,
  rotatePageview,
  startNewSession,
  touchUserActivity,
} from './session.ts';
import { clearAnalyticsStorage, getStorageMode } from './storage.ts';
import { abortInFlight, flushQueue, startFlushLoop, stopFlushLoop } from './transport.ts';
import { generateUuid } from './uuid.ts';

const pageViewCallbacks = new Set<() => void>();
const seenOfferVariants = new Set<string>();

let isInitialized = false;
let currentPath: string | null = null;

function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_ANALYTICS_ENABLED === 'true'
  );
}

function getReleaseSha(): string {
  const sha =
    typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_RELEASE_SHA
      : undefined;
  if (typeof sha === 'string' && /^(?:[0-9a-f]{40}|development|test)$/i.test(sha)) {
    return sha;
  }
  return 'development';
}

function notifyPageViewCallbacks(): void {
  for (const cb of pageViewCallbacks) {
    try {
      cb();
    } catch {
      // Listener error isolation
    }
  }
}


/** Monta o evento omitindo chaves opcionais indefinidas (o validador estrito checa presença da chave). */
function buildEvent(
  eventType: EventType,
  props: Record<string, unknown>,
  resolvedPath: string,
): AnalyticsEvent | null {
  const session = getActiveSession();
  const consentInfo = getConsentDetails();
  if (!session || !consentInfo) return null;

  const entryInfo = resolveEntryInfo(resolvedPath);
  const attribution = buildEventAttribution(session.sessionEntryAttribution);

  const event: AnalyticsEvent = {
    schema_version: SCHEMA_VERSION,
    event_id: generateUuid(),
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    session_id: session.sessionId,
    tab_id: session.tabId,
    pageview_id: session.pageviewId,
    client_seq: nextClientSeq(),
    release_sha: getReleaseSha(),
    path: resolvedPath,
    entry_type: entryInfo.entry_type,
    device_class: detectDeviceClass(),
    consent: {
      analytics: 'granted',
      policy_version: getConsentPolicyVersion(),
      scope_id: consentInfo.scopeId,
      collected_at: consentInfo.collectedAt,
    },
    props: props as AnalyticsEvent['props'],
  };
  if (entryInfo.lp_slug) event.lp_slug = entryInfo.lp_slug;
  if (attribution) event.attribution = attribution;
  return event;
}

function emitPageView(
  reason: 'initial' | 'reload' | 'consent_grant' | 'spa_navigation' | 'bfcache_restore',
  pathOverride?: string,
): void {
  if (getConsentState() !== 'granted') return;

  const rawPath = pathOverride || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const resolved = canonicalPath(rawPath);
  if (!resolved) return;

  currentPath = resolved;
  resetScrollThresholds();
  seenOfferVariants.clear();

  const event = buildEvent(
    'page_view',
    { navigation_reason: reason, storage_mode: getStorageMode(), scrollable: isPageScrollable() },
    resolved,
  );
  // O envio fica a cargo do loop de flush (2s); nada de rede síncrona aqui.
  if (event && enqueueEvent(event)) {
    recordAnalyticsInternal('heartbeat', { visibility_state: document.visibilityState === 'hidden' ? 'hidden' : 'visible', active: document.visibilityState !== 'hidden', active_time_delta_ms: 0, idle_ms: 0, reason: 'initial', scrollable: isPageScrollable() });
    notifyPageViewCallbacks();
  }
}

function handleConsentChange(newState: 'granted' | 'denied' | 'unknown', oldState: 'granted' | 'denied' | 'unknown'): void {
  if (newState === 'granted') {
    if (isInitialized) {
      if (!getActiveSession()) startNewSession();
      startSensors({
        emitHeartbeat: (props) => recordAnalyticsInternal('heartbeat', props),
        emitVisibility: (props) => recordAnalyticsInternal('visibility_change', props),
        emitScroll: (props) => recordAnalyticsInternal('scroll_depth', props),
        onBfcacheRestore: () => handleBfcacheRestore(),
        onSessionRenewed: () => emitPageView('initial'),
      });
      startFlushLoop();
      emitPageView('consent_grant');
    }
  } else if (oldState === 'granted') {
    // Revocation: teardown sensors, cancel network, clear storage & queue
    abortInFlight();
    stopSensors();
    stopFlushLoop();
    clearQueue();
    clearSession();
    clearAnalyticsStorage();
    currentPath = null;
    seenOfferVariants.clear();
  }
}

function handleBfcacheRestore(): void {
  if (getConsentState() !== 'granted') return;
  if (!touchUserActivity()) rotatePageview();
  emitPageView('bfcache_restore');
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled()) return;
  if (isInitialized) return;
  isInitialized = true;
  window.addEventListener('pagehide', flushBeforeLeave);
  document.addEventListener('visibilitychange', flushWhenHidden);

  onTabDuplicated(() => {
    // Cloned tab detected: clear cloned in-memory queue and emit fresh page_view for the new presentation
    clearQueue();
    emitPageView('initial');
  });

  onConsentStateChange((newState, oldState) => {
    handleConsentChange(newState, oldState);
  });

  if (getConsentState() === 'granted') {
    if (!getActiveSession()) startNewSession();
    startSensors({
      emitHeartbeat: (props) => recordAnalyticsInternal('heartbeat', props),
      emitVisibility: (props) => recordAnalyticsInternal('visibility_change', props),
      emitScroll: (props) => recordAnalyticsInternal('scroll_depth', props),
      onBfcacheRestore: () => handleBfcacheRestore(),
      onSessionRenewed: () => emitPageView('initial'),
    });
    startFlushLoop();
    emitPageView('initial');
  }
}

export function navigateAnalytics(path?: string): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;

  const raw = path || window.location.pathname;
  const resolved = canonicalPath(raw);
  if (!resolved) return;

  // Ignore same-path duplicate hydrate init
  if (currentPath === resolved) return;

  if (getConsentState() !== 'granted') return;

  // Close the preceding page's measured slice before replacing its identity.
  if (currentPath) {
    const delta = extractActiveTimeDelta();
    const closing = buildEvent('heartbeat', {
      visibility_state: document.visibilityState === 'hidden' ? 'hidden' : 'visible',
      active: delta > 0,
      active_time_delta_ms: delta,
      idle_ms: 0,
      reason: 'navigation',
      scrollable: isPageScrollable(),
    }, currentPath);
    if (closing) enqueueEvent(closing);
  }

  // SPA navigation is a genuine user interaction: touch user activity.
  // If > 30min idle, touchUserActivity() starts a new session and returns true.
  const renewed = touchUserActivity();
  if (!renewed) {
    rotatePageview();
  }

  emitPageView('spa_navigation', resolved);
}

type LooseProps = Record<string, unknown>;

function recordAnalyticsInternal(eventType: EventType, props?: LooseProps): void {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;
  if (getConsentState() !== 'granted') return;

  const session = getActiveSession();
  if (!session) return;

  const rawPath = currentPath || window.location.pathname;
  const resolved = canonicalPath(rawPath);
  if (!resolved) return;

  // offer_variant_seen dedupe and visibility requirements:
  let offerDedupeKey: string | null = null;
  if (eventType === 'offer_variant_seen') {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return; // Ignore if document is hidden; hook will re-attempt when visible
    }

    offerDedupeKey = `${session.pageviewId}:${props?.variant_param}:${props?.variant_key}:${props?.variant_state}`;
    if (seenOfferVariants.has(offerDedupeKey)) {
      return; // One exposure per presentation
    }
  }

  const event = buildEvent(eventType, props || {}, resolved);
  if (event && enqueueEvent(event)) {
    if (offerDedupeKey) {
      seenOfferVariants.add(offerDedupeKey);
    }
  }
}

/** Props são validados em runtime por validateEvent (evento inválido é descartado). */
export function recordAnalytics(eventType: EventType, props?: LooseProps): void {
  try {
    if (isAnalyticsEnabled() && getConsentState() === 'granted' && ['cta_click','whatsapp_click','catalog_click','store_phone_click','store_directions_click'].includes(eventType)) {
      if (touchUserActivity()) emitPageView('initial');
    }
    recordAnalyticsInternal(eventType, props);
  } catch {
    // Never throws, never breaks caller or conversion
  }
}

export function onAnalyticsPageView(callback: () => void): () => void {
  pageViewCallbacks.add(callback);
  return () => {
    pageViewCallbacks.delete(callback);
  };
}

export function registerAnalyticsConsentAdapter(adapter: AnalyticsConsentAdapter): void {
  if (!isAnalyticsEnabled()) return;
  registerConsentAdapter(adapter);
}

function flushBeforeLeave(): void { void flushQueue(); }
function flushWhenHidden(): void { if (document.visibilityState === 'hidden') queueMicrotask(flushBeforeLeave); }

export function resetCollectorForTesting(): void {
  window.removeEventListener('pagehide', flushBeforeLeave);
  document.removeEventListener('visibilitychange', flushWhenHidden);
  abortInFlight();
  stopSensors();
  stopFlushLoop();
  clearQueue();
  clearSession();
  clearAnalyticsStorage();
  pageViewCallbacks.clear();
  seenOfferVariants.clear();
  isInitialized = false;
  currentPath = null;
}
