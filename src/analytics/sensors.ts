import {
  ACTIVE_IDLE_MS,
  HEARTBEAT_MS,
  SESSION_IDLE_MS,
  type EventPropsByType,
} from '../../shared/analytics-contract.ts';
import { getLastUserActivityAt, touchUserActivity } from './session.ts';

export type HeartbeatEmitter = (props: EventPropsByType['heartbeat']) => void;
export type VisibilityEmitter = (props: EventPropsByType['visibility_change']) => void;
export type ScrollEmitter = (props: EventPropsByType['scroll_depth']) => void;
export type BfcacheHandler = () => void;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let lastHeartbeatTime = 0;
let lastActiveCheckpoint = 0;
let accumulatedActiveTime = 0;
let lastVisibilityState: 'visible' | 'hidden' = 'visible';
let lastUserScrollIntentAt = 0;

const scrollThresholds = [25, 50, 75, 90] as const;
const firedScrollThresholds = new Set<number>();

let isSensorsActive = false;
let removeEventListeners: (() => void) | null = null;

export function resetScrollThresholds(): void {
  firedScrollThresholds.clear();
}

export function isPageScrollable(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  return (
    document.documentElement.scrollHeight > window.innerHeight ||
    (document.body && document.body.scrollHeight > window.innerHeight)
  );
}

function getVisibilityState(): 'visible' | 'hidden' {
  if (typeof document === 'undefined') return 'visible';
  return document.visibilityState === 'hidden' ? 'hidden' : 'visible';
}

function updateActiveTimeAccumulator(overrideWasVisible?: boolean): void {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (lastActiveCheckpoint === 0) {
    lastActiveCheckpoint = now;
    lastVisibilityState = getVisibilityState();
    return;
  }

  const elapsed = now - lastActiveCheckpoint;
  lastActiveCheckpoint = now;

  const wasVisible = overrideWasVisible !== undefined ? overrideWasVisible : lastVisibilityState === 'visible';
  const timeSinceActivity = Date.now() - getLastUserActivityAt();
  if (wasVisible) {
    // Count the eligible part when the 30s boundary crosses this slice.
    accumulatedActiveTime += Math.max(0, Math.min(elapsed, ACTIVE_IDLE_MS - timeSinceActivity + elapsed));
  }
}

export function extractActiveTimeDelta(): number {
  updateActiveTimeAccumulator();
  const delta = Math.min(15000, Math.max(0, Math.round(accumulatedActiveTime)));
  accumulatedActiveTime = 0;
  return delta;
}

export function startSensors(callbacks: {
  emitHeartbeat: HeartbeatEmitter;
  emitVisibility: VisibilityEmitter;
  emitScroll: ScrollEmitter;
  onBfcacheRestore: BfcacheHandler;
  onSessionRenewed: () => void;
}): () => void {
  if (isSensorsActive) return stopSensors;
  isSensorsActive = true;

  lastActiveCheckpoint = typeof performance !== 'undefined' ? performance.now() : Date.now();
  accumulatedActiveTime = 0;
  lastHeartbeatTime = Date.now();
  lastVisibilityState = getVisibilityState();
  lastUserScrollIntentAt = 0;

  const userActionHandler = () => {
    updateActiveTimeAccumulator();
    const renewed = touchUserActivity();
    if (renewed) {
      callbacks.onSessionRenewed();
    }
  };

  const scrollIntentHandler = () => {
    lastUserScrollIntentAt = Date.now();
    userActionHandler();
  };

  const scrollHandler = (event?: Event) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Não considerar scroll puro/programático como human activity.
    // Exigir intenção humana prévia e um evento de scroll confiável.
    const hasRecentScrollIntent = Date.now() - lastUserScrollIntentAt <= 1500;
    const isTrustedScroll = event ? Boolean((event as UIEvent).isTrusted) : false;
    if (!hasRecentScrollIntent || !isTrustedScroll) {
      return;
    }

    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    const maxScroll = scrollHeight - clientHeight;
    const pct = maxScroll > 0 ? Math.round(((scrollTop + clientHeight) / scrollHeight) * 100) : 100;

    for (const threshold of scrollThresholds) {
      if (pct >= threshold && !firedScrollThresholds.has(threshold)) {
        firedScrollThresholds.add(threshold);
        callbacks.emitScroll({
          threshold_pct: threshold,
          scroll_source: 'user',
        });
      }
    }
  };

  const visibilityHandler = () => {
    const previousState = lastVisibilityState;
    const currentState = getVisibilityState();
    if (previousState === currentState) return;
    lastVisibilityState = currentState;

    // Contabiliza o slice transcorrido antes da mudança de visibilidade com o estado anterior
    updateActiveTimeAccumulator(previousState === 'visible');
    callbacks.emitVisibility({ state: currentState });

    if (currentState === 'hidden') {
      const timeSinceActivity = Date.now() - getLastUserActivityAt();
      const isActive = timeSinceActivity <= ACTIVE_IDLE_MS;
      const activeDelta = extractActiveTimeDelta();
      const idleMs = Math.min(ACTIVE_IDLE_MS, Math.max(0, Math.floor(timeSinceActivity)));

      // active=true se houve activeDelta > 0 ou o usuário estava ativo,
      // preservando a contabilização de segundos ativos em readOverview do backend
      callbacks.emitHeartbeat({
        visibility_state: 'hidden',
        active: activeDelta > 0 || isActive,
        active_time_delta_ms: activeDelta,
        idle_ms: idleMs,
        reason: 'visibility_change',
        scrollable: isPageScrollable(),
      });
    }
  };

  const pageShowHandler = (event: PageTransitionEvent) => {
    if (event.persisted) {
      callbacks.onBfcacheRestore();
    }
  };

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const interactionEvents = ['click', 'keydown', 'touchstart', 'pointerdown'];
    interactionEvents.forEach((ev) => window.addEventListener(ev, userActionHandler, { passive: true }));

    const scrollIntentEvents = ['wheel', 'touchmove', 'pointerdown', 'keydown'];
    scrollIntentEvents.forEach((ev) => window.addEventListener(ev, scrollIntentHandler, { passive: true }));

    window.addEventListener('scroll', scrollHandler, { passive: true });
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('pageshow', pageShowHandler);

    removeEventListeners = () => {
      interactionEvents.forEach((ev) => window.removeEventListener(ev, userActionHandler));
      scrollIntentEvents.forEach((ev) => window.removeEventListener(ev, scrollIntentHandler));
      window.removeEventListener('scroll', scrollHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
      window.removeEventListener('pageshow', pageShowHandler);
    };
  }

  // Periodic heartbeat every 15s
  heartbeatTimer = setInterval(() => {
    const state = getVisibilityState();
    const timeSinceActivity = Date.now() - getLastUserActivityAt();
    const isVisible = state === 'visible';
    const isActive = isVisible && timeSinceActivity <= ACTIVE_IDLE_MS;
    const activeDelta = extractActiveTimeDelta();
    if (!isVisible || timeSinceActivity >= SESSION_IDLE_MS) return;
    const idleMs = Math.min(ACTIVE_IDLE_MS, Math.max(0, Math.floor(timeSinceActivity)));

    callbacks.emitHeartbeat({
      visibility_state: state,
      active: isActive,
      active_time_delta_ms: activeDelta,
      idle_ms: idleMs,
      reason: 'interval',
      scrollable: isPageScrollable(),
    });
  }, HEARTBEAT_MS);

  return stopSensors;
}

export function stopSensors(): void {
  isSensorsActive = false;
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (removeEventListeners) {
    removeEventListeners();
    removeEventListeners = null;
  }
  accumulatedActiveTime = 0;
  lastActiveCheckpoint = 0;
}
