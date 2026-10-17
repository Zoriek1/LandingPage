import { SESSION_IDLE_MS, type Attribution } from '../../shared/analytics-contract.ts';
import { generateUuid } from './uuid.ts';
import { readStorage, writeStorage, removeStorage, getStorageMode } from './storage.ts';
import { getConsentState, getConsentDetails } from './consent.ts';
import { extractCurrentUtms } from './attribution.ts';

const SESSION_STORAGE_KEY = '_puf_analytics_v1_session';

interface SessionState {
  sessionId: string;
  tabId: string;
  pageviewId: string;
  clientSeq: number;
  lastUserActivityAt: number;
  sessionEntryAttribution?: Attribution['session_entry'];
}

let activeSession: SessionState | null = null;
let broadcastChannel: BroadcastChannel | null = null;
let currentInstanceId: string | null = null;

function getInstanceId(): string {
  if (!currentInstanceId) {
    currentInstanceId = generateUuid();
  }
  return currentInstanceId;
}

type DuplicateTabListener = () => void;
const duplicateTabListeners = new Set<DuplicateTabListener>();

export function onTabDuplicated(listener: DuplicateTabListener): () => void {
  duplicateTabListeners.add(listener);
  return () => duplicateTabListeners.delete(listener);
}

let sessionBroadcastChannelName = 'puf_analytics_v1_tab';

export function setBroadcastChannelNameForTesting(name: string): void {
  sessionBroadcastChannelName = name;
  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch {
      // ignore
    }
    broadcastChannel = null;
  }
}

function initBroadcastChannel(): void {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') return;
  if (broadcastChannel) return;

  try {
    broadcastChannel = new BroadcastChannel(sessionBroadcastChannelName);
    broadcastChannel.onmessage = (event) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      const myInstId = getInstanceId();
      if (data.type === 'claim_tab' && activeSession) {
        if (data.tabId === activeSession.tabId && data.instanceId !== myInstId) {
          // Deterministic tie-breaker: instance with smaller lexicographical ID wins
          if (myInstId < data.instanceId) {
            broadcastChannel?.postMessage({
              type: 'tab_collision',
              tabId: activeSession.tabId,
              instanceId: myInstId,
              winnerInstanceId: myInstId,
            });
          } else {
            // Loser tab: brand new isolated session, tabId, pageviewId
            activeSession.sessionId = generateUuid();
            activeSession.tabId = generateUuid();
            activeSession.pageviewId = generateUuid();
            activeSession.clientSeq = 1;
            persistSession();
            for (const listener of duplicateTabListeners) {
              listener();
            }
          }
        }
      } else if (data.type === 'tab_collision' && activeSession) {
        if (
          data.tabId === activeSession.tabId &&
          data.instanceId !== myInstId &&
          data.winnerInstanceId !== myInstId
        ) {
          // Lost resolution: this tab was cloned/duplicated.
          // Brand new session, tabId, pageviewId
          activeSession.sessionId = generateUuid();
          activeSession.tabId = generateUuid();
          activeSession.pageviewId = generateUuid();
          activeSession.clientSeq = 1;
          persistSession();
          for (const listener of duplicateTabListeners) {
            listener();
          }
        }
      }
    };
  } catch {
    // BroadcastChannel unsupported or restricted
  }
}

function announceTab(): void {
  if (!broadcastChannel || !activeSession) return;
  try {
    broadcastChannel.postMessage({
      type: 'claim_tab',
      tabId: activeSession.tabId,
      instanceId: getInstanceId(),
    });
  } catch {
    // ignore
  }
}

export function getActiveSession(): SessionState | null {
  if (getConsentState() !== 'granted') return null;

  if (activeSession) {
    return activeSession;
  }

  // Try reading from storage
  const storedStr = readStorage(SESSION_STORAGE_KEY, true);
  if (storedStr) {
    try {
      const parsed = JSON.parse(storedStr);
      if (
        parsed &&
        typeof parsed.sessionId === 'string' &&
        typeof parsed.tabId === 'string' &&
        typeof parsed.clientSeq === 'number' &&
        typeof parsed.lastUserActivityAt === 'number'
      ) {
        // Verify session hasn't expired (30 min idle)
        const isExpired = Date.now() - parsed.lastUserActivityAt > SESSION_IDLE_MS;
        if (!isExpired) {
          activeSession = {
            sessionId: parsed.sessionId,
            tabId: parsed.tabId,
            pageviewId: generateUuid(), // each presentation gets its own pageviewId
            clientSeq: parsed.clientSeq,
            lastUserActivityAt: parsed.lastUserActivityAt,
            sessionEntryAttribution: parsed.sessionEntryAttribution,
          };
          initBroadcastChannel();
          announceTab();
          persistSession();
          return activeSession;
        }
      }
    } catch {
      // Malformed storage
    }
  }

  // Create new session
  return startNewSession();
}

export function startNewSession(): SessionState | null {
  if (getConsentState() !== 'granted') return null;

  const currentUtms = extractCurrentUtms();
  activeSession = {
    sessionId: generateUuid(),
    tabId: generateUuid(),
    pageviewId: generateUuid(),
    clientSeq: 1,
    lastUserActivityAt: Date.now(),
    sessionEntryAttribution: currentUtms,
  };

  initBroadcastChannel();
  announceTab();
  persistSession();
  return activeSession;
}

export function rotatePageview(): string | null {
  if (!activeSession) return null;
  activeSession.pageviewId = generateUuid();
  persistSession();
  return activeSession.pageviewId;
}

export function nextClientSeq(): number {
  if (!activeSession) return 1;
  const seq = activeSession.clientSeq;
  activeSession.clientSeq += 1;
  persistSession();
  return seq;
}

export function touchUserActivity(): boolean {
  if (!activeSession) return false;

  const now = Date.now();
  const idle = now - activeSession.lastUserActivityAt;

  if (idle > SESSION_IDLE_MS) {
    // Session expired due to > 30m idle!
    startNewSession();
    return true; // Indicates session renewed
  }

  activeSession.lastUserActivityAt = now;
  persistSession();
  return false;
}

export function getLastUserActivityAt(): number {
  return activeSession ? activeSession.lastUserActivityAt : Date.now();
}

export function persistSession(): void {
  if (getConsentState() !== 'granted' || !activeSession) return;
  const data = JSON.stringify({
    sessionId: activeSession.sessionId,
    tabId: activeSession.tabId,
    clientSeq: activeSession.clientSeq,
    lastUserActivityAt: activeSession.lastUserActivityAt,
    sessionEntryAttribution: activeSession.sessionEntryAttribution,
  });
  writeStorage(SESSION_STORAGE_KEY, data, true);
}

export function clearSession(): void {
  activeSession = null;
  currentInstanceId = null;
  removeStorage(SESSION_STORAGE_KEY);
  if (broadcastChannel) {
    try {
      broadcastChannel.close();
    } catch {
      // ignore
    }
    broadcastChannel = null;
  }
}

export function resetSessionForTesting(): void {
  clearSession();
  duplicateTabListeners.clear();
}
