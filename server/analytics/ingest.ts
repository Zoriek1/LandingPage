import type pg from 'pg';
import { createHash } from 'node:crypto';
import { PROJECT_ID, SCHEMA_VERSION, validateEvent, canonicalizeEvent, type AnalyticsEnvelope, type AnalyticsAck, type AckResult } from '../../shared/analytics-contract.ts';

export async function collect(pool: pg.Pool, envelope: AnalyticsEnvelope): Promise<{ ack: AnalyticsAck; revision: number }> {
  const client = await pool.connect();
  const results: AckResult[] = [];
  const received = new Date();
  try {
    await client.query('BEGIN');
    // A single project lock gives stable write ordering and commit/revision sequencing in the MVP.
    await client.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1 FOR UPDATE', [PROJECT_ID]);
    for (const [index, raw] of envelope.events.entries()) {
      const event_id = raw && typeof raw.event_id === 'string' ? raw.event_id : null;
      if (!validateEvent(raw)) { results.push({ index, event_id, status: 'rejected', code: 'INVALID_EVENT' }); continue; }
      const e = raw;
      const digest = createHash('sha256').update(canonicalizeEvent(e)).digest('hex');
      const age = received.getTime() - Date.parse(e.occurred_at);
      const validClock = age >= -120_000 && age <= 86_400_000;
      const late = validClock && age > 60_000;
      const effective = validClock ? e.occurred_at : received.toISOString();
      const inserted = await client.query(`INSERT INTO analytics_events
        (project_id,event_id,canonical_hash,event_type,occurred_at,received_at,effective_at,session_id,tab_id,pageview_id,path,lp_slug,entry_type,device_class,attribution,consent,props,late,clock_valid,release_sha,client_seq)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        ON CONFLICT(project_id,event_id) DO NOTHING RETURNING event_id`,
      [PROJECT_ID,e.event_id,digest,e.event_type,e.occurred_at,received,effective,e.session_id,e.tab_id,e.pageview_id,e.path,e.lp_slug,e.entry_type,e.device_class,e.attribution??{},e.consent,e.props,late,validClock,e.release_sha,e.client_seq??null]);
      if (!inserted.rowCount) {
        const old = await client.query('SELECT canonical_hash FROM analytics_events WHERE project_id=$1 AND event_id=$2', [PROJECT_ID,e.event_id]);
        results.push({ index, event_id, status: old.rows[0]?.canonical_hash === digest ? 'duplicate' : 'rejected', ...(old.rows[0]?.canonical_hash === digest ? {} : { code: 'ID_REUSE_MISMATCH' }) });
        continue;
      }
      results.push({ index, event_id, status: 'accepted' });
      // Presence is a recent visibility observation, never a delayed click or duplicate.
      const signal = e.event_type === 'heartbeat' || e.event_type === 'visibility_change';
      if (signal && validClock && age >= -5_000 && age <= 60_000) {
        const visible = e.event_type === 'heartbeat' ? e.props.visibility_state === 'visible' : e.props.state === 'visible';
        await client.query(`INSERT INTO analytics_presence(project_id,session_id,tab_id,pageview_id,path,device_class,attribution,last_seen,visible,signal_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT(project_id,session_id,tab_id) DO UPDATE SET pageview_id=excluded.pageview_id,path=excluded.path,device_class=excluded.device_class,
          attribution=excluded.attribution,last_seen=excluded.last_seen,visible=excluded.visible,signal_at=excluded.signal_at
          WHERE analytics_presence.signal_at < excluded.signal_at
             OR (analytics_presence.signal_at = excluded.signal_at AND NOT excluded.visible)`,
        [PROJECT_ID,e.session_id,e.tab_id,e.pageview_id,e.path,e.device_class,e.attribution??{},received,visible,e.occurred_at]);
      }
    }
    const accepted = results.filter(r => r.status === 'accepted').length;
    const revisionResult = accepted
      ? await client.query('UPDATE analytics_meta SET data_revision=data_revision+1 WHERE project_id=$1 RETURNING data_revision', [PROJECT_ID])
      : await client.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1', [PROJECT_ID]);
    await client.query('COMMIT');
    return { revision: Number(revisionResult.rows[0]?.data_revision ?? 0), ack: {
      schema_version: SCHEMA_VERSION, batch_id: envelope.batch_id, committed_at: new Date().toISOString(), results,
      counts: { accepted, duplicate: results.filter(r => r.status === 'duplicate').length, rejected: results.filter(r => r.status === 'rejected').length },
    } };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
