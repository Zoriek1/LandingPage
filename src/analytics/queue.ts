import {
  EVENT_TTL_MS,
  MAX_ATTEMPTS,
  MAX_BATCH_BYTES,
  MAX_EVENTS_PER_BATCH,
  MAX_EVENT_BYTES,
  QUEUE_MAX_BYTES,
  QUEUE_MAX_EVENTS,
  validateEvent,
  type AnalyticsAck,
  type AnalyticsEvent,
} from '../../shared/analytics-contract.ts';
import type { QueuedItem } from './types.ts';
import { readStorage, writeStorage, removeStorage } from './storage.ts';
import { getConsentDetails, getConsentState } from './consent.ts';

const QUEUE_STORAGE_KEY = '_puf_analytics_v1_queue';

let memoryQueue: QueuedItem[] = [];
let batchLimit = MAX_EVENTS_PER_BATCH;

function stringByteLength(str: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str).length;
  }
  return str.length;
}

export function loadQueue(): QueuedItem[] {
  if (getConsentState() !== 'granted') {
    memoryQueue = [];
    return memoryQueue;
  }

  const stored = readStorage(QUEUE_STORAGE_KEY, true);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        memoryQueue = parsed.filter((item: QueuedItem) => {
          if (!item || !item.event) return false;
          const age = Date.now() - (item.firstQueuedAt || Date.parse(item.event.occurred_at));
          return age >= 0 && age <= EVENT_TTL_MS && item.attemptCount < MAX_ATTEMPTS && validateEvent(item.event) && item.event.consent.scope_id === getConsentDetails()?.scopeId;
        });
        return memoryQueue;
      }
    } catch {
      // Malformed queue
    }
  }
  memoryQueue = [];
  return memoryQueue;
}

export function saveQueue(): void {
  if (getConsentState() !== 'granted') {
    removeStorage(QUEUE_STORAGE_KEY);
    return;
  }
  try {
    writeStorage(QUEUE_STORAGE_KEY, JSON.stringify(memoryQueue), true);
  } catch {
    // Memory fallback
  }
}

export function enqueueEvent(event: AnalyticsEvent): boolean {
  if (getConsentState() !== 'granted') return false;

  // Validate event against contract
  if (!validateEvent(event)) return false;

  const eventJson = JSON.stringify(event);
  const eventBytes = stringByteLength(eventJson);
  if (eventBytes > MAX_EVENT_BYTES) {
    return false;
  }

  loadQueue();

  // Prune expired or dead items
  const now = Date.now();
  memoryQueue = memoryQueue.filter((item) => {
    const age = now - item.firstQueuedAt;
    return age <= EVENT_TTL_MS && item.attemptCount < MAX_ATTEMPTS;
  });

  // Calculate current queue byte size
  let currentBytes = memoryQueue.reduce((acc, item) => acc + stringByteLength(JSON.stringify(item.event)), 0);

  // Evict oldest items if exceeding limits
  while (
    (memoryQueue.length >= QUEUE_MAX_EVENTS || currentBytes + eventBytes > QUEUE_MAX_BYTES) &&
    memoryQueue.length > 0
  ) {
    const removed = memoryQueue.shift();
    if (removed) {
      currentBytes -= stringByteLength(JSON.stringify(removed.event));
    }
  }

  memoryQueue.push({
    event,
    attemptCount: 0,
    firstQueuedAt: now,
  });

  saveQueue();
  return true;
}

export function peekBatch(): AnalyticsEvent[] {
  loadQueue();
  if (memoryQueue.length === 0) return [];

  const now = Date.now();
  // Filter out expired items
  memoryQueue = memoryQueue.filter((item) => {
    const age = now - item.firstQueuedAt;
    return age <= EVENT_TTL_MS && item.attemptCount < MAX_ATTEMPTS;
  });

  const maxItems = batchLimit;

  const batch: AnalyticsEvent[] = [];
  let batchBytes = 200; // Fixed envelope fields, including a UUID batch_id.

  for (const item of memoryQueue) {
    if (batch.length >= maxItems) break;

    const itemBytes = stringByteLength(JSON.stringify(item.event));
    if (batchBytes + itemBytes + 1 > MAX_BATCH_BYTES) {
      break;
    }

    batch.push(item.event);
    batchBytes += itemBytes + 1;
  }

  return batch;
}

export function handleAck(ack: AnalyticsAck, sentEvents: AnalyticsEvent[]): void {
  loadQueue();
  batchLimit = MAX_EVENTS_PER_BATCH;

  const ackMap = new Map<string, 'accepted' | 'duplicate' | 'rejected'>();
  // O índice do resultado aponta para o evento enviado (event_id pode ser null em rejected).
  for (const res of ack.results) {
    const sent = sentEvents[res.index];
    if (sent) ackMap.set(sent.event_id, res.status);
  }

  memoryQueue = memoryQueue.filter((item) => {
    const status = ackMap.get(item.event.event_id);
    if (status === 'accepted' || status === 'duplicate' || status === 'rejected') {
      return false; // Dequeued!
    }
    return true; // Keep in queue for retry
  });

  saveQueue();
  // An incomplete ACK does not grant unlimited attempts to omitted events.
  markBatchFailed(sentEvents.filter((event) => !ackMap.has(event.event_id)), false);
}

/** Descarte imediato de lote rejeitado definitivamente (e.g. HTTP 400, 403, 415, 422). */
export function dropBatchPermanently(sentEvents: AnalyticsEvent[]): void {
  loadQueue();
  const sentIdSet = new Set(sentEvents.map((e) => e.event_id));
  memoryQueue = memoryQueue.filter((item) => !sentIdSet.has(item.event.event_id));
  saveQueue();
}

export function markBatchFailed(sentEvents: AnalyticsEvent[], isPayloadTooLarge: boolean): void {
  loadQueue();

  if (isPayloadTooLarge) {
    if (sentEvents.length === 1) {
      dropBatchPermanently(sentEvents);
      return;
    }
    batchLimit = Math.max(1, Math.floor(sentEvents.length / 2));
    // Reshaping a rejected batch is bounded by its size, not delivery attempts.
    return;
  }

  const sentIdSet = new Set(sentEvents.map((e) => e.event_id));
  for (const item of memoryQueue) {
    if (sentIdSet.has(item.event.event_id)) {
      item.attemptCount += 1;
    }
  }

  // Filter out any that reached max attempts
  memoryQueue = memoryQueue.filter((item) => item.attemptCount < MAX_ATTEMPTS);
  saveQueue();
}

export function clearQueue(): void {
  memoryQueue = [];
  batchLimit = MAX_EVENTS_PER_BATCH;
  removeStorage(QUEUE_STORAGE_KEY);
}

export function getQueueLength(): number {
  return memoryQueue.length;
}
