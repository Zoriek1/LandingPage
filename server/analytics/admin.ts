import pg from 'pg';
import { passwordHash } from './auth.ts';
const [command, username] = process.argv.slice(2);
if (!['create','reset','revoke','disable'].includes(command) || !/^[a-zA-Z0-9_.-]{1,80}$/.test(username ?? '')) throw new Error('Usage: analytics:admin create|reset|revoke|disable USER (password via stdin or ANALYTICS_ADMIN_PASSWORD)');
let password = process.env.ANALYTICS_ADMIN_PASSWORD;
if (command === 'create' || command === 'reset') {
  if (!password) {
    if (process.stdin.isTTY) throw new Error('Pipe a password via stdin; interactive echo is disabled');
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) { chunks.push(Buffer.from(chunk)); if (Buffer.concat(chunks).length > 1024) throw new Error('Password input too large'); }
    password = Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
  }
  if (password.length < 12 || password.length > 256) throw new Error('Password must contain 12–256 characters');
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  if (command === 'create') await client.query('INSERT INTO analytics_admins(username,password_hash) VALUES($1,$2)', [username, await passwordHash(password!)]);
  else {
    const found = await client.query('SELECT username FROM analytics_admins WHERE username=$1 FOR UPDATE', [username]);
    if (!found.rowCount) throw new Error('Administrator not found');
    if (command === 'reset') await client.query('UPDATE analytics_admins SET password_hash=$2 WHERE username=$1', [username, await passwordHash(password!)]);
    if (command === 'disable') await client.query('UPDATE analytics_admins SET disabled=true WHERE username=$1', [username]);
    await client.query('DELETE FROM analytics_admin_sessions WHERE username=$1', [username]);
  }
  await client.query('COMMIT');
  console.log(`Administrator ${command} completed`);
} catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await pool.end(); }
