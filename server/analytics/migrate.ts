import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || process.env.ANALYTICS_TEST_DATABASE_URL });
try {
 for (const file of (await readdir(new URL('./migrations/', import.meta.url))).filter(x => x.endsWith('.sql')).sort()) {
  const version = Number(file.slice(0,3)); const sql = await readFile(new URL(`./migrations/${file}`, import.meta.url),'utf8');
   const c = await pool.connect(); try { await c.query('BEGIN'); await c.query("SELECT pg_advisory_xact_lock(hashtext('landing-analytics-migrations'))"); await c.query('CREATE TABLE IF NOT EXISTS schema_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())'); const exists=await c.query('SELECT 1 FROM schema_migrations WHERE version=$1',[version]); if (!exists.rowCount) { await c.query(sql); await c.query('INSERT INTO schema_migrations(version) VALUES($1)',[version]); } await c.query('COMMIT'); } catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
 }
} finally { await pool.end(); }
