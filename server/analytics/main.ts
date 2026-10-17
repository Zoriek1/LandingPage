import { buildApp } from './app.ts';
if (process.env.NODE_ENV === 'production' && (!process.env.DATABASE_URL || !process.env.ANALYTICS_ADMIN_ORIGIN || !process.env.ANALYTICS_PUBLIC_ORIGINS)) throw new Error('Analytics production configuration incomplete');
const app=buildApp();
await app.listen({port:Number(process.env.ANALYTICS_PORT||8787),host:process.env.ANALYTICS_HOST||'127.0.0.1'});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
