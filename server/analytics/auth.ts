import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type pg from 'pg';

const derive = promisify(scrypt);
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const usernameValid = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(value);
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(password, salt, 64) as Buffer).toString('hex')}`;
}
export async function findSession(pool: pg.Pool, request: FastifyRequest, key: Buffer) {
  const token = request.headers.cookie?.match(/(?:^|;\s*)analytics_session=([A-Za-z0-9_-]{43})(?:;|$)/)?.[1];
  if (!token) return null;
  const tokenHash = digest(token);
  const result = await pool.query<{ username: string; expires_at: Date }>(`SELECT s.username,s.expires_at FROM analytics_admin_sessions s
    JOIN analytics_admins a USING(username) WHERE token_hash=$1 AND expires_at>now() AND NOT a.disabled`, [tokenHash]);
  const session = result.rows[0];
  return session ? { username: session.username, expires_at: session.expires_at.toISOString(), csrf_token: createHmac('sha256', key).update(token).digest('hex'), tokenHash } : null;
}
type AuthOptions = {
  pool: pg.Pool; secure: boolean; csrfKey: Buffer;
  originAllowed: (request: FastifyRequest, mutation?: boolean) => boolean;
  allow: (key: string, cap: number) => boolean;
  closeSessions: (tokenHash: string) => void;
};
export function authRoutes(app: FastifyInstance, { pool, secure, csrfKey, originAllowed, allow, closeSessions }: AuthOptions) {
  const cookie = (token: string, age: number) => `analytics_session=${token}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const publicSession = (s: NonNullable<Awaited<ReturnType<typeof findSession>>>) => ({ username: s.username, csrf_token: s.csrf_token, expires_at: s.expires_at });
  app.post('/admin/login', async (request, reply) => {
    if (!originAllowed(request, true) || request.headers['x-analytics-admin'] !== '1' || !request.headers['content-type']?.startsWith('application/json')) return reply.code(403).send({ error: 'forbidden' });
    if (!allow(`login-ip:${digest(request.ip)}`, 10) || !allow('login-global', 100)) return reply.code(429).header('retry-after', '60').send({ error: 'rate_limited' });
    const body = request.body as Record<string, unknown> | null;
    if (!body || Object.keys(body).some(k => !['username', 'password'].includes(k)) || !usernameValid(body.username) || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) return reply.code(401).send({ error: 'invalid_credentials' });
    const found = await pool.query<{ password_hash: string }>('SELECT password_hash FROM analytics_admins WHERE username=$1 AND NOT disabled', [body.username]);
    const [salt, stored] = (found.rows[0]?.password_hash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const computed = await derive(body.password, salt, 64) as Buffer;
    const expected = Buffer.from(stored, 'hex');
    if (expected.length !== computed.length || !timingSafeEqual(computed, expected) || !found.rowCount) return reply.code(401).send({ error: 'invalid_credentials' });
    const token = randomBytes(32).toString('base64url');
    const tokenHash = digest(token);
    const csrf_token = createHmac('sha256', csrfKey).update(token).digest('hex');
    const expires_at = new Date(Date.now() + 8 * 60 * 60_000).toISOString();
    await pool.query('DELETE FROM analytics_admin_sessions WHERE expires_at<=now()');
    await pool.query('INSERT INTO analytics_admin_sessions(token_hash,username,csrf_hash,expires_at) VALUES($1,$2,$3,$4)', [tokenHash, body.username, digest(csrf_token), expires_at]);
    reply.header('set-cookie', cookie(token, 8 * 60 * 60));
    return { username: body.username, csrf_token, expires_at };
  });
  app.get('/admin/session', async (request, reply) => {
    const session = originAllowed(request) ? await findSession(pool, request, csrfKey) : null;
    return session ? publicSession(session) : reply.code(401).send({ error: 'unauthorized' });
  });
  app.post('/admin/logout', async (request, reply) => {
    if (!originAllowed(request, true)) return reply.code(403).send({ error: 'forbidden' });
    const session = await findSession(pool, request, csrfKey);
    if (!session) return reply.code(401).send({ error: 'unauthorized' });
    const csrf = request.headers['x-csrf-token'];
    if (typeof csrf !== 'string' || !/^[a-f0-9]{64}$/.test(csrf) || Buffer.byteLength(csrf, 'utf8') !== Buffer.byteLength(session.csrf_token, 'utf8') || !timingSafeEqual(Buffer.from(csrf, 'utf8'), Buffer.from(session.csrf_token, 'utf8'))) return reply.code(403).send({ error: 'csrf' });
    await pool.query('DELETE FROM analytics_admin_sessions WHERE token_hash=$1', [session.tokenHash]);
    closeSessions(session.tokenHash);
    reply.header('set-cookie', cookie('', 0));
    return { ok: true };
  });
}
