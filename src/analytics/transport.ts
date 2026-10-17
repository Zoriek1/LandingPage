import {
  EVENT_TTL_MS,
  PROJECT_ID,
  SCHEMA_VERSION,
  type AnalyticsAck,
  type AnalyticsEnvelope,
  type AnalyticsEvent,
} from '../../shared/analytics-contract.ts';
import { generateUuid } from './uuid.ts';
import { dropBatchPermanently, handleAck, markBatchFailed, peekBatch } from './queue.ts';

const TIMEOUT_MS = 5000;
const MAX_BACKOFF_MS = 30000;
const BASE_BACKOFF_MS = 2000;

let flushTimer: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;
let retryAfterUntil = 0;
let consecutiveFailures = 0;
let activeAbortController: AbortController | null = null;
let transportGeneration = 0;

function getEndpointUrl(): string {
  const base =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANALYTICS_API_URL) ||
    '';
  return `${base.replace(/\/$/, '')}/collect`;
}

export function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  // If numeric seconds: respect up to EVENT_TTL_MS (e.g. server 60s rate limit window)
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds) && seconds >= 0) {
    return Math.min(EVENT_TTL_MS, seconds * 1000);
  }
  // If HTTP date
  const dateMs = Date.parse(header);
  if (!isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    return Math.min(EVENT_TTL_MS, Math.max(0, diff));
  }
  return null;
}

/**
 * Só um ACK íntegro conta como persistência: schema, batch_id, índices dentro
 * do lote, event_id coerente com o índice e contadores batendo com os resultados.
 * Resultado parcial é válido (os itens ausentes continuam na fila).
 */
export function isValidAck(value: unknown, batchId: string, sent: AnalyticsEvent[]): value is AnalyticsAck {
  const ack = value as Partial<AnalyticsAck> | null;
  if (!ack || ack.schema_version !== SCHEMA_VERSION || ack.batch_id !== batchId) return false;
  if (typeof ack.committed_at !== 'string' || !Number.isFinite(Date.parse(ack.committed_at))) return false;
  if (!Array.isArray(ack.results) || ack.results.length > sent.length) return false;
  const counts = ack.counts;
  if (!counts || typeof counts !== 'object') return false;

  const seenIndexes = new Set<number>();
  const tally = { accepted: 0, duplicate: 0, rejected: 0 };
  for (const result of ack.results) {
    if (!result || !Number.isInteger(result.index) || result.index < 0 || result.index >= sent.length) return false;
    if (seenIndexes.has(result.index)) return false;
    seenIndexes.add(result.index);
    if (!Object.prototype.hasOwnProperty.call(tally, result.status)) return false;
    tally[result.status as keyof typeof tally] += 1;
    const expectedId = sent[result.index].event_id;
    if (result.status === 'rejected') {
      if (result.event_id !== null && result.event_id !== expectedId) return false;
    } else if (result.event_id !== expectedId) {
      return false;
    }
  }
  return (
    counts.accepted === tally.accepted &&
    counts.duplicate === tally.duplicate &&
    counts.rejected === tally.rejected
  );
}

export async function flushQueue(): Promise<boolean> {
  if (isFlushing) return false;
  if (Date.now() < retryAfterUntil) return false;

  const batch = peekBatch();
  if (batch.length === 0) return false;

  isFlushing = true;
  const generation = transportGeneration;

  const batchId = generateUuid();
  const envelope: AnalyticsEnvelope = {
    schema_version: SCHEMA_VERSION,
    project_id: PROJECT_ID,
    batch_id: batchId,
    events: batch,
  };

  const controller = new AbortController();
  activeAbortController = controller;
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(getEndpointUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
      keepalive: true,
      signal: controller.signal,
    });

    if (generation !== transportGeneration) return false;

    // Fatal client or schema/envelope errors: permanent discard, never retry 5 times
    if (response.status === 400 || response.status === 403 || response.status === 415 || response.status === 422) {
      dropBatchPermanently(batch);
      consecutiveFailures = 0;
      return false;
    }

    if (response.status === 413) {
      // Payload too large, mark batch failed with 413 so next batch splits
      markBatchFailed(batch, true);
      consecutiveFailures += 1;
      const jitter = Math.random() * 500;
      retryAfterUntil = Date.now() + Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS + jitter);
      return false;
    }

    if (response.status === 429) {
      markBatchFailed(batch, false);
      const retryHeader = response.headers.get('Retry-After');
      const retryMs = parseRetryAfter(retryHeader) ?? BASE_BACKOFF_MS;
      retryAfterUntil = Date.now() + retryMs;
      consecutiveFailures += 1;
      return false;
    }

    if (!response.ok) {
      markBatchFailed(batch, false);
      consecutiveFailures += 1;
      const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.min(4, consecutiveFailures)));
      const jitter = Math.random() * 1000;
      retryAfterUntil = Date.now() + backoff + jitter;
      return false;
    }

    // Response status is 200/2xx. MUST validate ACK structure!
    // Never assume response.ok is ACK. Keep timeout active until parsed.
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      if (generation !== transportGeneration) return false;
      // Malformed JSON response
      markBatchFailed(batch, false);
      consecutiveFailures += 1;
      const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.min(4, consecutiveFailures)));
      const jitter = Math.random() * 1000;
      retryAfterUntil = Date.now() + backoff + jitter;
      return false;
    }

    if (generation !== transportGeneration) return false;

    if (!isValidAck(parsed, batchId, batch)) {
      // Invalid ACK contract! Retain events.
      markBatchFailed(batch, false);
      consecutiveFailures += 1;
      const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.min(4, consecutiveFailures)));
      const jitter = Math.random() * 1000;
      retryAfterUntil = Date.now() + backoff + jitter;
      return false;
    }

    // Valid ACK received!
    handleAck(parsed as AnalyticsAck, batch);
    consecutiveFailures = 0;
    retryAfterUntil = 0;
    return true;
  } catch {
    if (generation !== transportGeneration) return false;
    markBatchFailed(batch, false);
    consecutiveFailures += 1;
    const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.min(4, consecutiveFailures)));
    const jitter = Math.random() * 1000;
    retryAfterUntil = Date.now() + backoff + jitter;
    return false;
  } finally {
    clearTimeout(timeoutId);
    if (generation === transportGeneration) {
      isFlushing = false;
      activeAbortController = null;
    }
  }
}

export function startFlushLoop(intervalMs = 2000): () => void {
  stopFlushLoop();
  flushTimer = setInterval(() => {
    flushQueue().catch(() => {});
  }, intervalMs);

  return stopFlushLoop;
}

export function stopFlushLoop(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

export function abortInFlight(): void {
  transportGeneration += 1;
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // ignore
    }
    activeAbortController = null;
  }
  isFlushing = false;
  retryAfterUntil = 0;
  consecutiveFailures = 0;
}
