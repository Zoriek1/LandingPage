// Marco A analytics wire contract. Keep this file dependency-free (Node 24 type stripping).
export const PROJECT_ID = 'plante-uma-flor-lp' as const;
export const SCHEMA_VERSION = 1 as const;

export const EVENT_TYPES = ['page_view', 'heartbeat', 'visibility_change', 'scroll_depth', 'cta_click', 'whatsapp_click', 'catalog_click', 'store_phone_click', 'store_directions_click', 'offer_variant_seen'] as const;
export type EventType = typeof EVENT_TYPES[number];
export type DeviceClass = 'mobile' | 'tablet' | 'desktop';
export type EntryType = 'main' | 'ad_lp' | 'physical_store';
export type Consent = { analytics: 'granted'; policy_version: string; scope_id: string; collected_at: string };
export type Attribution = {
  session_entry?: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
  current?: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
  referrer_host?: string;
};
export type EventProps = Record<string, string | number | boolean | null>;
export type EventPropsByType = {
  page_view: { navigation_reason: 'initial' | 'reload' | 'consent_grant' | 'spa_navigation' | 'bfcache_restore'; storage_mode: 'session' | 'memory'; scrollable: boolean };
  heartbeat: { visibility_state: 'visible' | 'hidden'; active: boolean; active_time_delta_ms: number; idle_ms: number; reason: 'initial' | 'interval' | 'visibility_change' | 'navigation'; scrollable: boolean };
  visibility_change: { state: 'visible' | 'hidden' };
  scroll_depth: { threshold_pct: 25 | 50 | 75 | 90; scroll_source: 'user' | 'anchor' };
  cta_click: { cta_id: string; cta_location: string; position?: number; action: 'open_selector' | 'internal_navigation'; product_id?: string };
  whatsapp_click: { cta_id: string; cta_location: string; position?: number; product_id?: string; price_range_key?: string; intent_key?: string; interaction_id?: string };
  catalog_click: { cta_id: string; cta_location: string; position?: number; destination: 'catalog'; product_id?: string };
  store_phone_click: { cta_id: string; cta_location: string; phone_role: 'store' | 'backup' };
  store_directions_click: { cta_id: string; cta_location: string; map_provider: 'google_maps' | 'waze' };
  offer_variant_seen: { variant_param: string; variant_key: string; variant_state: 'base' | 'configured' | 'invalid_fallback'; variant_product_id?: string };
};
export type AnalyticsEvent = {
  schema_version: 1; event_id: string; event_type: EventType; occurred_at: string;
  session_id: string; tab_id: string; pageview_id: string; client_seq?: number;
  release_sha: string; path: string; lp_slug?: string; entry_type?: EntryType;
  device_class?: DeviceClass; attribution?: Attribution; consent: Consent; props: EventProps;
};
export type AnalyticsEnvelope = { schema_version: 1; project_id: typeof PROJECT_ID; batch_id: string; events: AnalyticsEvent[] };
export type AckResult = { index: number; event_id: string | null; status: 'accepted' | 'duplicate' | 'rejected'; code?: string };
export type AnalyticsAck = { schema_version: 1; batch_id: string; committed_at: string; results: AckResult[]; counts: { accepted: number; duplicate: number; rejected: number } };

export const MAX_EVENTS_PER_BATCH = 50;
export const MAX_BATCH_BYTES = 32 * 1024;
export const MAX_EVENT_BYTES = 4 * 1024;
export const MAX_UTM_LENGTH = 100;
export const QUEUE_MAX_EVENTS = 100;
export const QUEUE_MAX_BYTES = 128 * 1024;
export const EVENT_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const ACTIVE_IDLE_MS = 30 * 1000;
export const HEARTBEAT_MS = 15 * 1000;
export const PRESENCE_TTL_MS = 60 * 1000;
export const PATH_ALLOWLIST = ['/', '/loja-fisica/', ...[
  'dia-das-maes','dia-dos-namorados','urgencia','aniversario','rosas-apt','lirios-apt','carro-low','carro-high','presente-hoje','tradicao-comprovacao','qual-b','so-porque-sim','buque-real','reconciliacao','girassol','catalogo-precos'
].map((slug) => `/${slug}`)] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/;
const SHA = /^(?:[0-9a-f]{40}|development|test)$/i;
const OBJECT = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, allowed: readonly string[], required: readonly string[]) => Object.keys(v).every(k => allowed.includes(k)) && required.every(k => k in v);
const utc = (v: unknown): v is string => {
  if (typeof v !== 'string' || !UTC.test(v) || !Number.isFinite(Date.parse(v))) return false;
  const normalized = v.includes('.') ? v.replace(/\.(\d{1,3})Z$/, (_, fraction: string) => `.${fraction.padEnd(3, '0')}Z`) : v.replace('Z', '.000Z');
  return new Date(v).toISOString() === normalized;
};
const oneOf = (value: unknown, values: readonly string[]) => typeof value === 'string' && values.includes(value);
export function safeDimension(value: unknown): value is string { return typeof value === 'string' && value.length > 0 && value.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(value) && !/\d{7,}/.test(value); }
const bounded = (v: unknown, n = MAX_UTM_LENGTH): v is string => typeof v === 'string' && v.length > 0 && v.length <= n && [...v].every(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127 && c !== '<' && c !== '>');
export function canonicalPath(path: unknown): string | null {
  if (typeof path !== 'string' || path.includes('?') || path.includes('#') || path.includes('\\')) return null;
  let p = path === '/index.html' ? '/' : path;
  if (p === '/loja-fisica' || p === '/loja-fisica/index.html') p = '/loja-fisica/';
  else if (p !== '/') { p = p.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, ''); }
  if (p === '/sem-erro') return null; // route manifest slug redirects; not an analytics page.
  return (PATH_ALLOWLIST as readonly string[]).includes(p) || (PATH_ALLOWLIST as readonly string[]).includes(`${p}/`) ? ((PATH_ALLOWLIST as readonly string[]).includes(p) ? p : `${p}/`) : null;
}
const attributionKeys = ['session_entry','current','referrer_host'] as const;
function validAttribution(v: unknown): boolean {
  if (!OBJECT(v) || !exact(v, attributionKeys, [])) return false;
  for (const group of ['session_entry','current'] as const) if (group in v) {
    const a = v[group]; if (!OBJECT(a) || !exact(a, ['utm_source','utm_medium','utm_campaign'], [])) return false;
    if (Object.values(a).some(x => !safeDimension(x))) return false;
  }
  return !('referrer_host' in v) || typeof v.referrer_host === 'string' && v.referrer_host.length <= 253 && /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(v.referrer_host) && !/\d{7,}/.test(v.referrer_host);
}
const PROP_KEYS: Record<EventType, readonly string[]> = {
  page_view: ['navigation_reason','storage_mode','scrollable'], heartbeat: ['visibility_state','active','active_time_delta_ms','idle_ms','reason','scrollable'],
  visibility_change: ['state'], scroll_depth: ['threshold_pct','scroll_source'],
  cta_click: ['cta_id','cta_location','position','action','product_id'], whatsapp_click: ['cta_id','cta_location','position','product_id','price_range_key','intent_key','interaction_id'],
  catalog_click: ['cta_id','cta_location','position','destination','product_id'], store_phone_click: ['cta_id','cta_location','phone_role'], store_directions_click: ['cta_id','cta_location','map_provider'],
  offer_variant_seen: ['variant_param','variant_key','variant_state','variant_product_id'],
};
function validProps(type: EventType, p: Record<string, unknown>): boolean {
  const schemas: Record<EventType, Record<string, (v: unknown) => boolean>> = {
    page_view: { navigation_reason: v => ['initial','reload','consent_grant','spa_navigation','bfcache_restore'].includes(String(v)), storage_mode: v => ['session','memory'].includes(String(v)), scrollable: v => typeof v === 'boolean' },
    heartbeat: { visibility_state: v => ['visible','hidden'].includes(String(v)), active: v => typeof v === 'boolean', active_time_delta_ms: v => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 15000, idle_ms: v => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= ACTIVE_IDLE_MS, reason: v => ['initial','interval','visibility_change','navigation'].includes(String(v)), scrollable: v => typeof v === 'boolean' },
    visibility_change: { state: v => ['visible','hidden'].includes(String(v)) }, scroll_depth: { threshold_pct: v => typeof v === 'number' && [25,50,75,90].includes(v), scroll_source: v => ['user','anchor'].includes(String(v)) },
    cta_click: { cta_id: safeDimension, cta_location: safeDimension, position: v => Number.isInteger(v) && Number(v) >= 0, action: v => ['open_selector','internal_navigation'].includes(String(v)), product_id: safeDimension },
    whatsapp_click: { cta_id: safeDimension, cta_location: safeDimension, position: v => Number.isInteger(v) && Number(v) >= 0, product_id: safeDimension, price_range_key: safeDimension, intent_key: safeDimension, interaction_id: v => typeof v === 'string' && UUID.test(v) },
    catalog_click: { cta_id: safeDimension, cta_location: safeDimension, position: v => Number.isInteger(v) && Number(v) >= 0, destination: v => v === 'catalog', product_id: safeDimension },
    store_phone_click: { cta_id: safeDimension, cta_location: safeDimension, phone_role: v => ['store','backup'].includes(String(v)) }, store_directions_click: { cta_id: safeDimension, cta_location: safeDimension, map_provider: v => ['google_maps','waze'].includes(String(v)) },
    offer_variant_seen: { variant_param: safeDimension, variant_key: safeDimension, variant_state: v => ['base','configured','invalid_fallback'].includes(String(v)), variant_product_id: safeDimension },
  };
  const schema = schemas[type];
  const required: Record<EventType, string[]> = {
    page_view: ['navigation_reason','storage_mode','scrollable'],
    heartbeat: ['visibility_state','active','active_time_delta_ms','idle_ms','reason','scrollable'],
    visibility_change: ['state'], scroll_depth: ['threshold_pct','scroll_source'],
    cta_click: ['cta_id','cta_location','action'], whatsapp_click: ['cta_id','cta_location'],
    catalog_click: ['cta_id','cta_location','destination'],
    store_phone_click: ['cta_id','cta_location','phone_role'],
    store_directions_click: ['cta_id','cta_location','map_provider'],
    offer_variant_seen: ['variant_param','variant_key','variant_state'],
  };
  return exact(p, Object.keys(schema), required[type]) && Object.entries(p).every(([k,v]) =>
    (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') && schema[k](v),
  );
}
export function validateEvent(value: unknown): value is AnalyticsEvent {
  if (!OBJECT(value)) return false;
  try { if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_EVENT_BYTES) return false; } catch { return false; }
  const type = value.event_type;
  if (!(EVENT_TYPES as readonly unknown[]).includes(type)) return false;
  const eventType = type as EventType;
  const keys = ['schema_version','event_id','event_type','occurred_at','session_id','tab_id','pageview_id','release_sha','path','consent','props','client_seq','lp_slug','entry_type','device_class','attribution'];
  if (!exact(value, keys, ['schema_version','event_id','event_type','occurred_at','session_id','tab_id','pageview_id','release_sha','path','consent','props'])) return false;
  if (value.schema_version !== SCHEMA_VERSION || typeof value.event_id !== 'string' || !UUID.test(value.event_id) || !utc(value.occurred_at) || ![value.session_id,value.tab_id,value.pageview_id].every(x => typeof x === 'string' && UUID.test(x)) || typeof value.release_sha !== 'string' || !SHA.test(value.release_sha) || canonicalPath(value.path) !== value.path) return false;
  if ('client_seq' in value && (!Number.isSafeInteger(value.client_seq) || (value.client_seq as number) < 0)) return false;
  if ('lp_slug' in value && (!safeDimension(value.lp_slug) || `/${value.lp_slug}` !== String(value.path).replace(/\/$/, ''))) return false;
  if ('entry_type' in value && !oneOf(value.entry_type, ['main','ad_lp','physical_store'])) return false;
  if ('device_class' in value && !oneOf(value.device_class, ['mobile','tablet','desktop'])) return false;
  if ('attribution' in value && !validAttribution(value.attribution)) return false;
  const c = value.consent;
  if (!OBJECT(c) || !exact(c, ['analytics','policy_version','scope_id','collected_at'], ['analytics','policy_version','scope_id','collected_at']) || c.analytics !== 'granted' || c.policy_version !== 'analytics-v1' || typeof c.scope_id !== 'string' || !UUID.test(c.scope_id) || !utc(c.collected_at)) return false;
  const p = value.props;
  if (!OBJECT(p) || !validProps(eventType, p)) return false;
  return BufferlessByteLength(JSON.stringify(value)) <= MAX_EVENT_BYTES;
}
function BufferlessByteLength(s: string): number { return new TextEncoder().encode(s).length; }
export function validateEnvelope(value: unknown): value is AnalyticsEnvelope {
  if (!OBJECT(value) || !exact(value, ['schema_version','project_id','batch_id','events'], ['schema_version','project_id','batch_id','events']) || value.schema_version !== SCHEMA_VERSION || value.project_id !== PROJECT_ID || typeof value.batch_id !== 'string' || !UUID.test(value.batch_id) || !Array.isArray(value.events) || value.events.length < 1 || value.events.length > MAX_EVENTS_PER_BATCH || value.events.some(e => !OBJECT(e))) return false;
  const ids = value.events.map(e => (e as Record<string, unknown>).event_id);
  if (ids.some(id => typeof id === 'string' && UUID.test(id)) && new Set(ids).size !== ids.length) return false;
  return BufferlessByteLength(JSON.stringify(value)) <= MAX_BATCH_BYTES;
}
export function canonicalizeEvent(event: AnalyticsEvent): string {
  const sort = (v: unknown): unknown => Array.isArray(v) ? v.map(sort) : OBJECT(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(event));
}

export type OverviewSnapshot = {
  schema_version: number;
  project_id: string;
  data_revision: number;
  generated_at: string;
  window: { from: string; to: string };
  filters: { path?: string; utm_source?: string; utm_campaign?: string; device_class?: DeviceClass };
  metrics: {
    pageviews: number;
    observed_sessions: number;
    online_sessions: number;
    active_time_ms: number;
    whatsapp_clicks: number;
    site_clicks: number;
    store_actions: number;
    cta_clicks: number;
  };
  coverage: { source: 'own_collector'; traffic_class: 'observed' };
  freshness: { last_received_at: string | null };
  pages: Array<{ path: string; pageviews: number; observed_sessions: number; active_time_ms: number; whatsapp_clicks: number }>;
  campaigns: Array<{ utm_source: string | null; utm_campaign: string | null; observed_sessions: number; pageviews: number; whatsapp_clicks: number }>;
  actions: Array<{ event_type: EventType; clicks: number; observed_sessions: number }>;
  scroll: Array<{ threshold_pct: number; reached_contexts: number; eligible_contexts: number }>;
  series: Array<{ minute: string; pageviews: number; actions: number }>;
  quality: { delayed_events: number; invalid_clock_events: number };
};
export type AdminEventItem = { event_id: string; event_type: EventType; path: string; session_id: string; occurred_at: string; received_at: string; effective_at: string; delayed: boolean; clock_valid: boolean; props: EventProps };
export type AdminEventsResponse = { items: AdminEventItem[]; next_cursor: string | null; has_more: boolean; as_of: string; generated_at: string; data_revision: number };
export type AdminEventFilters = { from: string; to: string; path?: string; utm_source?: string; utm_campaign?: string; device_class?: DeviceClass; limit?: number; cursor?: string };
export type AdminLoginRequest = { username: string; password: string };
export type AdminSessionResponse = { username: string; csrf_token: string; expires_at: string };
export type AdminStreamEventName = 'ready' | 'invalidate';
// site_clicks = catalog_click; store_actions = store_phone_click + store_directions_click.
export type AdminStreamPayload = { data_revision: number; generated_at: string };
