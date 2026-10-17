import Fastify, { type FastifyRequest } from 'fastify';
import pg from 'pg';
import { randomBytes, createHash } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import { PROJECT_ID, SCHEMA_VERSION, MAX_BATCH_BYTES, validateEnvelope } from '../../shared/analytics-contract.ts';
import { collect } from './ingest.ts';
import { authRoutes, findSession } from './auth.ts';
import { readOverview, readEvents, InputError } from './queries.ts';

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function originOf(value: unknown): string | null {
  try { return typeof value === 'string' ? new URL(value).origin : null; } catch { return null; }
}

export function buildApp(options: { pool?: pg.Pool } = {}) {
  const adminOrigin = process.env.ANALYTICS_ADMIN_ORIGIN ?? '';
  const publicOrigins = new Set((process.env.ANALYTICS_PUBLIC_ORIGINS ?? '').split(',').map(x => x.trim()).filter(Boolean));
  const production = process.env.NODE_ENV === 'production';
  const secure = process.env.ANALYTICS_SECURE_COOKIE === 'true';
  const release = process.env.RELEASE_SHA || 'development';
  if (production && (!process.env.DATABASE_URL || !secure || !/^[a-f0-9]{40}$/i.test(release) ||
    !adminOrigin.startsWith('https://') || originOf(adminOrigin) !== adminOrigin || !publicOrigins.size ||
    [...publicOrigins].some(o => originOf(o) !== o || !o.startsWith('https://')))) {
    throw new Error('Incomplete analytics production configuration');
  }
  const pool = options.pool ?? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  const app = Fastify({ bodyLimit: MAX_BATCH_BYTES, logger: false, trustProxy: false });
  const csrfKey = randomBytes(32); // Restart deliberately invalidates CSRF; session endpoint refreshes it.
  const limits = new Map<string, { count: number; expires: number }>();
  function allow(key: string, maximum: number, cost = 1) {
    const now = Date.now();
    for (const [k, v] of limits) if (v.expires <= now) limits.delete(k);
    if (!limits.has(key) && limits.size >= 5000) return false;
    const value = limits.get(key) ?? { count: 0, expires: now + 60_000 };
    value.count += cost;
    limits.set(key, value);
    return value.count <= maximum;
  }
  const streams = new Set<{ response: ServerResponse; tokenHash: string; timer: NodeJS.Timeout; close: () => void }>();
  const originAllowed = (req: FastifyRequest, mutation = false) => Boolean(adminOrigin) &&
    (req.headers.origin ? req.headers.origin === adminOrigin : !mutation && originOf(req.headers.referer) === adminOrigin);
  const closeSessions = (tokenHash: string) => { for (const s of streams) if (s.tokenHash === tokenHash) s.close(); };
  async function revision() {
    const result = await pool.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1', [PROJECT_ID]);
    return Number(result.rows[0]?.data_revision ?? 0);
  }
  function invalidate(data_revision: number) {
    const data = `event: invalidate\ndata: ${JSON.stringify({ data_revision, generated_at: new Date().toISOString() })}\n\n`;
    for (const s of streams) if (!s.response.write(data)) s.close();
  }
  app.addHook('onRequest', async (req, reply) => {
    const admin = req.url.startsWith('/admin/');
    const origin = req.headers.origin;
    reply.header('vary', 'Origin');
    if (admin) reply.header('cache-control', 'no-store');
    if (origin && (admin ? origin === adminOrigin : publicOrigins.has(origin))) {
      reply.header('access-control-allow-origin', origin);
      if (admin) reply.header('access-control-allow-credentials', 'true');
    }
  });
  app.options('/*', async (req, reply) => {
    const admin = req.url.startsWith('/admin/');
    const allowed = req.headers.origin && (admin ? req.headers.origin === adminOrigin : req.url === '/collect' && publicOrigins.has(req.headers.origin));
    if (!allowed) return reply.code(403).send({ error: 'forbidden' });
    return reply.header('access-control-allow-methods', admin ? 'GET, POST, OPTIONS' : 'POST, OPTIONS')
      .header('access-control-allow-headers', admin ? 'content-type,x-analytics-admin,x-csrf-token' : 'content-type').code(204).send();
  });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof InputError) return reply.code(400).send({ error: error.message });
    const status = (error as { statusCode?: number }).statusCode;
    return reply.code(status && status >= 400 && status < 500 ? status : 503).send({ error: status && status < 500 ? 'invalid_request' : 'temporarily_unavailable' });
  });
  app.post('/collect', async (req, reply) => {
    if (!req.headers.origin || !publicOrigins.has(req.headers.origin)) return reply.code(403).send({ error: 'forbidden' });
    if (!req.headers['content-type']?.startsWith('application/json') || req.headers['content-encoding']) return reply.code(415).send({ error: 'json_required' });
    const body = req.body;
    if (body && typeof body === 'object' && 'schema_version' in body && body.schema_version !== SCHEMA_VERSION) return reply.code(422).send({ error: 'unsupported_schema' });
    if (!validateEnvelope(body)) return reply.code(400).send({ error: 'invalid_envelope' });
    const sessions = new Map<string, number>();
    for (const e of body.events) {
      if (e && typeof e.session_id === 'string') sessions.set(e.session_id, (sessions.get(e.session_id) ?? 0) + 1);
    }
    if (!allow('collect-global', 600) || !allow(`collect-ip:${hash(req.ip)}`, 60) ||
      [...sessions].some(([id, count]) => !allow(`session:${id}`, 300, count))) {
      return reply.code(429).header('retry-after', '60').send({ error: 'rate_limited' });
    }
    const result = await collect(pool, body);
    if (result.ack.counts.accepted) invalidate(result.revision);
    return result.ack;
  });
  app.get('/health', async () => ({ ok: true, release, schema: SCHEMA_VERSION }));
  app.get('/health/ready', async (_req, reply) => {
    try {
      const result = await pool.query('SELECT (SELECT max(version) FROM schema_migrations) migration, (SELECT data_revision FROM analytics_meta WHERE project_id=$1) revision', [PROJECT_ID]);
      const ready = Number(result.rows[0]?.migration) >= 2 && result.rows[0]?.revision != null;
      return reply.code(ready ? 200 : 503).send({ ok: ready, release, schema: SCHEMA_VERSION, data_revision: Number(result.rows[0]?.revision ?? 0) });
    } catch { return reply.code(503).send({ ok: false, release, schema: SCHEMA_VERSION }); }
  });
  authRoutes(app, { pool, secure, csrfKey, originAllowed, allow, closeSessions });
  for (const route of ['overview', 'events'] as const) {
    app.get(`/admin/${route}`, async (req, reply) => {
      if (!originAllowed(req) || !await findSession(pool, req, csrfKey)) return reply.code(401).send({ error: 'unauthorized' });
      if (!allow(`read:${hash(req.ip)}`, 300)) return reply.code(429).header('retry-after', '60').send({ error: 'rate_limited' });
      return route === 'overview' ? readOverview(pool, req.query) : readEvents(pool, req.query);
    });
  }
  app.get('/admin/stream', async (req, reply) => {
    const session = originAllowed(req) ? await findSession(pool, req, csrfKey) : null;
    if (!session) return reply.code(401).send({ error: 'unauthorized' });
    if (streams.size >= 100 || [...streams].filter(s => s.tokenHash === session.tokenHash).length >= 3) return reply.code(429).send({ error: 'stream_limit' });
    const data_revision = await revision();
    reply.hijack();
    for (const [name, value] of Object.entries(reply.getHeaders())) if (value !== undefined) reply.raw.setHeader(name, value);
    reply.raw.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-accel-buffering': 'no', connection: 'keep-alive' });
    reply.raw.write(`event: ready\ndata: ${JSON.stringify({ data_revision, generated_at: new Date().toISOString(), release })}\n\n`);
    const stream = { response: reply.raw, tokenHash: session.tokenHash, timer: undefined as unknown as NodeJS.Timeout, close: () => {
      clearInterval(stream.timer); streams.delete(stream); reply.raw.end();
    } };
    let checking = false;
    stream.timer = setInterval(async () => {
      if (checking) return;
      checking = true;
      try {
        if (!await findSession(pool, req, csrfKey) || !reply.raw.write(': keepalive\n\n')) stream.close();
      } catch { stream.close(); } finally { checking = false; }
    }, 15_000);
    streams.add(stream);
    reply.raw.on('close', stream.close);
    // Close the read/register race: a commit between the initial revision read and
    // stream registration is not broadcast to this stream, so reconcile once registered.
    try {
      const currentRevision = await revision();
      if (currentRevision > data_revision) {
        stream.response.write(`event: invalidate\ndata: ${JSON.stringify({ data_revision: currentRevision, generated_at: new Date().toISOString() })}\n\n`);
      }
    } catch { stream.close(); }
  });
  app.addHook('preClose', async () => { for (const stream of streams) stream.close(); });
  app.addHook('onClose', async () => { if (!options.pool) await pool.end(); });
  return app;
}
