import type pg from 'pg';
import { PROJECT_ID, SCHEMA_VERSION, canonicalPath, safeDimension, type OverviewSnapshot, type AdminEventsResponse, type AdminEventItem, type DeviceClass } from '../../shared/analytics-contract.ts';

export class InputError extends Error {}
type Filters = OverviewSnapshot['filters'];
type Query = { from: string; to: string; filters: Filters; limit: number; cursor?: string };
const iso = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === (value.includes('.') ? value : value.replace('Z', '.000Z'));
function parseQuery(input: unknown, events: boolean): Query {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('invalid_filters');
  const q = input as Record<string, unknown>;
  const keys = ['project_id','from','to','path','utm_source','utm_campaign','device_class', ...(events ? ['limit','cursor'] : [])];
  if (Object.keys(q).some(k => !keys.includes(k)) || ('project_id' in q && q.project_id !== PROJECT_ID)) throw new InputError('invalid_filters');
  if (!iso(q.from) || !iso(q.to) || Date.parse(q.to) <= Date.parse(q.from) || Date.parse(q.to) - Date.parse(q.from) > 31 * 86_400_000) throw new InputError('invalid_window_max_31_days');
  const filters: Filters = {};
  if ('path' in q) { if (canonicalPath(q.path) !== q.path) throw new InputError('invalid_path'); filters.path = q.path as string; }
  for (const key of ['utm_source','utm_campaign'] as const) if (key in q) { if (!safeDimension(q[key])) throw new InputError('invalid_dimension'); filters[key] = q[key]; }
  if ('device_class' in q) { if (!['mobile','tablet','desktop'].includes(q.device_class as string)) throw new InputError('invalid_device'); filters.device_class = q.device_class as DeviceClass; }
  const limit = q.limit === undefined ? 50 : Number(q.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (q.limit !== undefined && !/^\d+$/.test(String(q.limit)))) throw new InputError('invalid_limit');
  if (q.cursor !== undefined && (typeof q.cursor !== 'string' || q.cursor.length > 2048)) throw new InputError('invalid_cursor');
  return { from: new Date(q.from).toISOString(), to: new Date(q.to).toISOString(), filters, limit, cursor: q.cursor as string | undefined };
}
function dimensions(filters: Filters, values: unknown[]) {
  const clauses = ['project_id=$1'];
  for (const key of ['path','device_class','utm_source','utm_campaign'] as const) if (filters[key] !== undefined) {
    values.push(filters[key]);
    const column = key.startsWith('utm_') ? `attribution->'session_entry'->>'${key}'` : key;
    clauses.push(`${column}=$${values.length}`);
  }
  return clauses.join(' AND ');
}
const eligible = "event_type NOT IN ('heartbeat','visibility_change','offer_variant_seen')";
const action = "event_type IN ('cta_click','whatsapp_click','catalog_click','store_phone_click','store_directions_click')";
// A hidden/idle closing signal can carry a valid preceding visible slice.
const active = "CASE WHEN event_type='heartbeat' THEN LEAST(15000,GREATEST(0,(props->>'active_time_delta_ms')::int)) ELSE 0 END";
async function transaction<T>(pool: pg.Pool, read: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try { await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); const result = await read(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function revision(client: pg.PoolClient) {
  const result = await client.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1', [PROJECT_ID]);
  return Number(result.rows[0]?.data_revision ?? 0);
}
export async function readOverview(pool: pg.Pool, input: unknown): Promise<OverviewSnapshot> {
  const q = parseQuery(input, false);
  return transaction(pool, async client => {
    const generated_at = new Date().toISOString();
    const values: unknown[] = [PROJECT_ID];
    const base = dimensions(q.filters, values);
    const presenceValues = [...values, generated_at];
    values.push(q.from, q.to);
    const where = `${base} AND effective_at >= $${values.length - 1} AND effective_at < $${values.length}`;
    const metrics = await client.query(`SELECT
      count(DISTINCT pageview_id) FILTER(WHERE event_type='page_view')::int pageviews,
      count(DISTINCT session_id) FILTER(WHERE ${eligible})::int observed_sessions,
      coalesce(sum(${active}),0)::float8 active_time_ms,
      count(*) FILTER(WHERE event_type='whatsapp_click')::int whatsapp_clicks,
      count(*) FILTER(WHERE event_type='catalog_click')::int site_clicks,
      count(*) FILTER(WHERE event_type IN ('store_phone_click','store_directions_click'))::int store_actions,
      count(*) FILTER(WHERE event_type='cta_click')::int cta_clicks,
      count(*) FILTER(WHERE late)::int delayed_events,
      count(*) FILTER(WHERE NOT clock_valid)::int invalid_clock_events
      FROM analytics_events WHERE ${where}`, values);
    const current = await client.query(`SELECT count(DISTINCT session_id)::int online_sessions FROM analytics_presence WHERE ${base}
      AND visible AND last_seen > $${presenceValues.length}::timestamptz - interval '60 seconds'`, presenceValues);
    const pages = await client.query(`SELECT path,
      count(DISTINCT pageview_id) FILTER(WHERE event_type='page_view')::int pageviews,
      count(DISTINCT session_id) FILTER(WHERE ${eligible})::int observed_sessions,
      coalesce(sum(${active}),0)::float8 active_time_ms,
      count(*) FILTER(WHERE event_type='whatsapp_click')::int whatsapp_clicks
      FROM analytics_events WHERE ${where} GROUP BY path ORDER BY observed_sessions DESC,path LIMIT 100`, values);
    const series = await client.query(`SELECT date_trunc('minute',effective_at) AS minute,
      count(DISTINCT pageview_id) FILTER(WHERE event_type='page_view')::int pageviews,
      count(*) FILTER(WHERE ${action})::int actions FROM analytics_events WHERE ${where}
      GROUP BY 1 ORDER BY 1`, values);
    const campaigns = await client.query(`SELECT attribution->'session_entry'->>'utm_source' AS utm_source,
      attribution->'session_entry'->>'utm_campaign' AS utm_campaign,
      count(DISTINCT session_id) FILTER(WHERE ${eligible})::int observed_sessions,
      count(DISTINCT pageview_id) FILTER(WHERE event_type='page_view')::int pageviews,
      count(*) FILTER(WHERE event_type='whatsapp_click')::int whatsapp_clicks
      FROM analytics_events WHERE ${where} GROUP BY 1,2
      ORDER BY observed_sessions DESC,1 NULLS LAST,2 NULLS LAST LIMIT 100`, values);
    const actions = await client.query(`SELECT event_type,count(*)::int clicks,
      count(DISTINCT session_id)::int observed_sessions FROM analytics_events
      WHERE ${where} AND ${action} GROUP BY event_type ORDER BY clicks DESC,event_type`, values);
    const scroll = await client.query(`WITH contexts AS (
      SELECT session_id,path,
        bool_or(event_type='page_view' AND props->>'scrollable'='true') AS scrollable,
        max(CASE WHEN event_type='scroll_depth' THEN (props->>'threshold_pct')::int ELSE 0 END) AS depth
      FROM analytics_events WHERE ${where} GROUP BY session_id,path
    ) SELECT threshold AS threshold_pct,
      count(*) FILTER(WHERE scrollable AND depth>=threshold)::int reached_contexts,
      count(*) FILTER(WHERE scrollable)::int eligible_contexts
      FROM (VALUES(25),(50),(75),(90)) AS thresholds(threshold)
      LEFT JOIN contexts ON true GROUP BY threshold ORDER BY threshold`, values);
    const last = await client.query(`SELECT max(received_at) last_received_at FROM analytics_events WHERE ${base}`, values.slice(0,-2));
    const m = metrics.rows[0];
    return {
      schema_version: SCHEMA_VERSION, project_id: PROJECT_ID, data_revision: await revision(client), generated_at,
      window: { from: q.from, to: q.to }, filters: q.filters,
      metrics: { pageviews: m.pageviews, observed_sessions: m.observed_sessions, online_sessions: current.rows[0].online_sessions,
        active_time_ms: m.active_time_ms, whatsapp_clicks: m.whatsapp_clicks, site_clicks: m.site_clicks, store_actions: m.store_actions, cta_clicks: m.cta_clicks },
      coverage: { source: 'own_collector', traffic_class: 'observed' },
      freshness: { last_received_at: last.rows[0].last_received_at?.toISOString() ?? null },
      pages: pages.rows,
      campaigns: campaigns.rows, actions: actions.rows, scroll: scroll.rows,
      series: series.rows.map(row => ({ ...row, minute: row.minute.toISOString() })),
      quality: { delayed_events: m.delayed_events, invalid_clock_events: m.invalid_clock_events },
    };
  });
}
type Cursor = { fingerprint: string; as_of: string; received_at: string; event_id: string };
export async function readEvents(pool: pg.Pool, input: unknown): Promise<AdminEventsResponse> {
  const q = parseQuery(input, true);
  const fingerprint = JSON.stringify({ project: PROJECT_ID, from: q.from, to: q.to, filters: q.filters, limit: q.limit });
  let cursor: Cursor | undefined;
  if (q.cursor) {
    try {
      if (!/^[\w-]+$/.test(q.cursor)) throw new Error();
      cursor = JSON.parse(Buffer.from(q.cursor, 'base64url').toString('utf8')) as Cursor;
      if (!cursor || Object.keys(cursor).sort().join() !== 'as_of,event_id,fingerprint,received_at' || cursor.fingerprint !== fingerprint ||
        !iso(cursor.as_of) || !iso(cursor.received_at) || !/^[a-f0-9-]{36}$/i.test(cursor.event_id) ||
        Date.parse(cursor.received_at) > Date.parse(cursor.as_of) || Date.parse(cursor.as_of) > Date.now() + 1000) throw new Error();
    } catch { throw new InputError('invalid_cursor'); }
  }
  const as_of = cursor?.as_of ?? new Date().toISOString();
  return transaction(pool, async client => {
    const values: unknown[] = [PROJECT_ID];
    let where = dimensions(q.filters, values);
    values.push(q.from, q.to, as_of);
    where += ` AND effective_at >= $${values.length-2} AND effective_at < $${values.length-1} AND received_at <= $${values.length} AND event_type NOT IN ('heartbeat','visibility_change')`;
    if (cursor) { values.push(cursor.received_at,cursor.event_id); where += ` AND (received_at,event_id) < ($${values.length-1}::timestamptz,$${values.length}::uuid)`; }
    values.push(q.limit+1);
    const result = await client.query(`SELECT event_id,event_type,path,session_id,occurred_at,received_at,effective_at,late delayed,clock_valid,props FROM analytics_events
      WHERE ${where} ORDER BY received_at DESC,event_id DESC LIMIT $${values.length}`, values);
    const has_more = result.rows.length > q.limit;
    const rows = result.rows.slice(0,q.limit);
    const items: AdminEventItem[] = rows.map(row => ({ ...row, occurred_at: row.occurred_at.toISOString(), received_at: row.received_at.toISOString(), effective_at: row.effective_at.toISOString() }));
    const last = items.at(-1);
    return { items, has_more, as_of, generated_at: new Date().toISOString(), data_revision: await revision(client),
      next_cursor: has_more && last ? Buffer.from(JSON.stringify({ fingerprint, as_of, received_at: last.received_at, event_id: last.event_id })).toString('base64url') : null };
  });
}
