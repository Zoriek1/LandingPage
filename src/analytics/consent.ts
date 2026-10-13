import type { ConsentState, AnalyticsConsentAdapter } from './types.ts';

export type { AnalyticsConsentAdapter };
import { generateUuid } from './uuid.ts';
import { readStorage, writeStorage, removeStorage, clearAnalyticsStorage } from './storage.ts';

const SCOPE_KEY = '_puf_analytics_v1_consent';

let registeredAdapter: AnalyticsConsentAdapter | null = null;
let unsubscribeAdapter: (() => void) | null = null;
let currentScopeId: string | null = null;
let consentCollectedAt: string | null = null;

type ConsentChangeListener = (newState: ConsentState, oldState: ConsentState) => void;
const consentListeners = new Set<ConsentChangeListener>();

let lastObservedState: ConsentState = 'unknown';

export function getConsentState(): ConsentState {
  if (!registeredAdapter) return 'unknown';
  try {
    return registeredAdapter.getConsent();
  } catch {
    return 'unknown';
  }
}

export function getConsentPolicyVersion(): string {
  // Always returns 'analytics-v1' as mandated by shared contract
  return 'analytics-v1';
}

export function getConsentDetails(): { scopeId: string; collectedAt: string } | null {
  if (getConsentState() !== 'granted' || !currentScopeId || !consentCollectedAt) {
    return null;
  }
  return {
    scopeId: currentScopeId,
    collectedAt: consentCollectedAt,
  };
}

export function onConsentStateChange(listener: ConsentChangeListener): () => void {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
}

function handleStateTransition(nextState: ConsentState): void {
  const previousState = lastObservedState;
  if (nextState === previousState) return;

  lastObservedState = nextState;

  if (nextState === 'granted') {
    currentScopeId = generateUuid();
    consentCollectedAt = new Date().toISOString();
    // Reload in the same granted tab keeps the scope of pending events.
    try {
      const stored = JSON.parse(readStorage(SCOPE_KEY, true) || 'null');
      if (stored && /^[a-f0-9-]{36}$/i.test(stored.scopeId) && Number.isFinite(Date.parse(stored.collectedAt))) {
        currentScopeId = stored.scopeId;
        consentCollectedAt = stored.collectedAt;
      }
    } catch { /* Invalid stored consent is replaced, never treated as permission. */ }
    writeStorage(SCOPE_KEY, JSON.stringify({ scopeId: currentScopeId, collectedAt: consentCollectedAt }), true);
  } else {
    currentScopeId = null;
    consentCollectedAt = null;
    removeStorage(SCOPE_KEY);
    if (nextState === 'denied') clearAnalyticsStorage();
  }

  for (const listener of consentListeners) {
    try {
      listener(nextState, previousState);
    } catch {
      // Listener isolation
    }
  }
}

export function registerConsentAdapter(adapter: AnalyticsConsentAdapter): void {
  if (unsubscribeAdapter) {
    unsubscribeAdapter();
    unsubscribeAdapter = null;
  }
  registeredAdapter = adapter;

  const current = getConsentState();
  handleStateTransition(current);

  try {
    unsubscribeAdapter = adapter.subscribe(() => {
      const next = getConsentState();
      handleStateTransition(next);
    });
  } catch {
    // Adapter subscription failure
  }
}

export function resetConsentForTesting(): void {
  if (unsubscribeAdapter) {
    unsubscribeAdapter();
    unsubscribeAdapter = null;
  }
  registeredAdapter = null;
  lastObservedState = 'unknown';
  currentScopeId = null;
  consentCollectedAt = null;
  consentListeners.clear();
}
