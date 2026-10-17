import type {
  AnalyticsAck,
  AnalyticsEnvelope,
  AnalyticsEvent,
  Attribution,
  Consent,
  DeviceClass,
  EntryType,
  EventType,
} from '../../shared/analytics-contract.ts';

export type ConsentState = 'granted' | 'denied' | 'unknown';

export interface AnalyticsConsentAdapter {
  getConsent(): ConsentState;
  subscribe(listener: () => void): () => void;
  policyVersion?: string;
}

export interface StoredSession {
  sessionId: string;
  tabId: string;
  scopeId: string;
  clientSeq: number;
  sessionEntryAttribution?: Attribution['session_entry'];
  lastUserActivityAt: number;
}

export interface QueuedItem {
  event: AnalyticsEvent;
  attemptCount: number;
  firstQueuedAt: number;
}
