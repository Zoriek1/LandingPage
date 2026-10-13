import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { buildApp } from './app.ts';
import { validAnalyticsEnvelope } from '../../shared/analytics-fixtures.ts';
import { PROJECT_ID } from '../../shared/analytics-contract.ts';

const ORIGIN = 'http://localhost:8080';
const UUID = () => randomUUID();
const cookieOf = (r: { headers: Record<string, unknown> }) => String(r.headers['set-cookie']).split(';')[0]!;
const envelope = (event: object = structuredClone(validAnalyticsEnvelope.events[0])) => ({ schema_version: 1, project_id: PROJECT_ID, batch_id: UUID(), events: [event] });
const cloneEvent = () => ({ ...structuredClone(validAnalyticsEnvelope.events[0]), event_id: UUID(), session_id: UUID(), tab_id: UUID(), pageview_id: UUID(), occurred_at: new Date().toISOString() });
const win = () => `from=${encodeURIComponent(new Date(Date.now() - 86_400_000).toISOString())}&to=${encodeURIComponent(new Date(Date.now() + 86_400_000).toISOString())}`;
const expectCounts = (r: { statusCode: number; json: () => { counts: Record<string, number>; results: unknown[] } }, want: { accepted?: number; duplicate?: number; rejected?: number }) => {
  assert.equal(r.statusCode, 200); const ack = r.json();
  for (const [k, v] of Object.entries(want)) assert.equal(ack.counts[k], v, `ACK counts.${k}`);
  assert.equal(ack.results.length, Object.values(ack.counts).reduce((a, b) => a + b, 0), 'ACK results match counts');
};
const base = (extra: Record<string, unknown> = {}) => ({ origin: ORIGIN, ...extra });

test('Marco A HTTP/PostgreSQL integration', async (t) => {
  const url = process.env.ANALYTICS_TEST_DATABASE_URL;
  if (!url) { t.skip('Set ANALYTICS_TEST_DATABASE_URL to run isolated PostgreSQL integration suite'); return; }
  process.env.NODE_ENV = 'test';
  process.env.ANALYTICS_PUBLIC_ORIGINS = ORIGIN;
  process.env.ANALYTICS_ADMIN_ORIGIN = ORIGIN;
  process.env.ANALYTICS_SESSION_SECRET = 'integration-test-only-session-key';
  execFileSync(process.execPath, ['server/analytics/migrate.ts'], { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  const pool = new pg.Pool({ connectionString: url, max: 8 });
  const tables = await pool.query("SELECT to_regclass('public.analytics_events') events, to_regclass('public.analytics_meta') meta");
  assert.ok(tables.rows[0].events && tables.rows[0].meta, 'run analytics migration against test DB before suite');
  const app = buildApp({ pool }); await app.ready();
  const req = (method: 'GET' | 'POST', path: string, payload?: object, headers: Record<string, string> = {}) => app.inject({ method, url: path, payload, headers: base(headers) });
  const password = 'integration-password-strong';
  const clear = async () => {
    await pool.query('TRUNCATE analytics_events, analytics_presence, analytics_admin_sessions, analytics_admins');
    await pool.query('UPDATE analytics_meta SET data_revision=0 WHERE project_id=$1', [PROJECT_ID]);
    const salt = randomBytes(16).toString('hex');
    await pool.query('INSERT INTO analytics_admins(username,password_hash) VALUES($1,$2)', ['tester', `${salt}:${scryptSync(password, salt, 64).toString('hex')}`]);
  };
  const loginCookie = async (a: typeof app = app) => {
    const r = await a.inject({ method: 'POST', url: '/admin/login', payload: { username: 'tester', password }, headers: base({ 'x-analytics-admin': '1' }) });
    assert.equal(r.statusCode, 200, 'fixture admin login must succeed');
    return { cookie: cookieOf(r), csrf: r.json().csrf_token as string };
  };
  try {
    await clear();
    await t.test('admin APIs deny anonymous access', async () => {
      for (const path of ['/admin/overview?from=2026-10-01T00:00:00Z&to=2026-10-02T00:00:00Z', '/admin/events?from=2026-10-01T00:00:00Z&to=2026-10-02T00:00:00Z', '/admin/stream', '/admin/session']) assert.equal((await req('GET', path)).statusCode, 401, path);
    });
    await t.test('login requires origin/header, gives generic errors and returns session csrf', async () => {
      assert.equal((await app.inject({ method:'POST',url:'/admin/login',headers:{origin:ORIGIN},payload:{username:'tester',password} })).statusCode,403);
      assert.equal((await app.inject({ method:'POST',url:'/admin/login',headers:{origin:'http://evil.example','x-analytics-admin':'1'},payload:{username:'tester',password} })).statusCode,403);
      const bad=await req('POST','/admin/login',{username:'missing',password:'wrong-password-123'},{'x-analytics-admin':'1'}); assert.equal(bad.statusCode,401); assert.deepEqual(bad.json(),{error:'invalid_credentials'});
      const wrong=await req('POST','/admin/login',{username:'tester',password:'wrong-password-123'},{'x-analytics-admin':'1'}); assert.equal(wrong.statusCode,401); assert.deepEqual(wrong.json(),bad.json());
      const login=await req('POST','/admin/login',{username:'tester',password},{'x-analytics-admin':'1'}); assert.equal(login.statusCode,200); const body=login.json(); assert.equal(body.username,'tester'); assert.ok(body.csrf_token); assert.ok(Date.parse(body.expires_at)>Date.now());
      const cookie=cookieOf(login);
      const session=await req('GET','/admin/session',undefined,{cookie}); assert.equal(session.statusCode,200); assert.equal(session.json().csrf_token,body.csrf_token); assert.equal(session.json().username,'tester');
      assert.equal((await req('POST','/admin/logout',{}, {cookie})).statusCode,403);
      assert.equal((await req('POST','/admin/logout',{}, {cookie,'x-csrf-token':'bad'})).statusCode,403);
      const multibyte='é'.repeat(64); assert.equal(multibyte.length,64); assert.equal((await req('POST','/admin/logout',{}, {cookie,'x-csrf-token':multibyte})).statusCode,403,'64 UTF-16 chars with multibyte UTF-8 must not throw');
      assert.equal((await req('POST','/admin/logout',{}, {cookie,'x-csrf-token':body.csrf_token})).statusCode,200);
      assert.equal((await req('GET','/admin/session',undefined,{cookie})).statusCode,401);
    });
    await t.test('collection validates envelope and partially acknowledges with stable IDs/revision', async () => {
      const malformed=await req('POST','/collect',{schema_version:1,project_id:PROJECT_ID,batch_id:'bad',events:[]}); assert.equal(malformed.statusCode,400);
      const valid=cloneEvent(), invalid={...cloneEvent(),event_type:'page_view',props:{navigation_reason:'bogus',storage_mode:'session',scrollable:true}};
      const mixed={...envelope(valid),events:[valid,invalid]}; const response=await req('POST','/collect',mixed); assert.equal(response.statusCode,200); const ack=response.json(); assert.equal(ack.results.length,2); assert.deepEqual(ack.results.map((x:{index:number})=>x.index),[0,1]); assert.equal(ack.results[0].status,'accepted'); assert.equal(ack.results[1].status,'rejected'); assert.ok(ack.results[1].code);
      const revision=Number((await pool.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1',[PROJECT_ID])).rows[0].data_revision);
      const retry=await req('POST','/collect',mixed); assert.equal(retry.statusCode,200); assert.equal(retry.json().results[0].status,'duplicate'); assert.equal(Number((await pool.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1',[PROJECT_ID])).rows[0].data_revision),revision);
      const reuse=structuredClone(valid); reuse.props.navigation_reason='reload'; const reused=await req('POST','/collect',envelope(reuse)); assert.equal(reused.statusCode,200); assert.equal(reused.json().results[0].code,'ID_REUSE_MISMATCH');
      const repeated=structuredClone(valid); assert.equal((await req('POST','/collect',{...envelope(valid),events:[valid,repeated]})).statusCode,400);
    });
    await t.test('concurrent retries commit exactly once and DB failure rolls batch back', async () => {
      await clear(); const event=cloneEvent(), payload=envelope(event);
      const [a,b]=await Promise.all([req('POST','/collect',payload),req('POST','/collect',payload)]); assert.equal(a.statusCode,200);assert.equal(b.statusCode,200);assert.deepEqual([a.json().results[0].status,b.json().results[0].status].sort(),['accepted','duplicate']);assert.equal(Number((await pool.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1',[PROJECT_ID])).rows[0].data_revision),1);
      await clear(); const one=cloneEvent(), two=cloneEvent();
      await pool.query("CREATE OR REPLACE FUNCTION analytics_test_abort() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.event_id = '"+two.event_id+"'::uuid THEN RAISE EXCEPTION 'test rollback'; END IF; RETURN NEW; END $$; CREATE TRIGGER analytics_test_abort BEFORE INSERT ON analytics_events FOR EACH ROW EXECUTE FUNCTION analytics_test_abort()");
      try { const result=await req('POST','/collect',{...envelope(one),events:[one,two]}); assert.notEqual(result.statusCode,200); assert.equal(Number((await pool.query('SELECT count(*) n FROM analytics_events WHERE project_id=$1',[PROJECT_ID])).rows[0].n),0); assert.equal(Number((await pool.query('SELECT data_revision FROM analytics_meta WHERE project_id=$1',[PROJECT_ID])).rows[0].data_revision),0); }
      finally { await pool.query('DROP TRIGGER IF EXISTS analytics_test_abort ON analytics_events; DROP FUNCTION IF EXISTS analytics_test_abort()'); }
    });
    await t.test('overview snapshot fields, first-touch UTC filters; cursor binds filters and pages in order', async () => {
      await clear(); const { cookie }=await loginCookie();
      const empty=await req('GET',`/admin/overview?${win()}`,undefined,{cookie}); assert.equal(empty.statusCode,200); const snap=empty.json();
      for(const k of ['schema_version','project_id','data_revision','generated_at','window','filters','metrics','coverage','freshness','pages','series','quality'])assert.ok(k in snap,k);
      assert.ok('active_time_ms' in snap.metrics); assert.ok(!('engaged_sessions' in snap.metrics)); assert.equal(snap.metrics.pageviews,0); assert.deepEqual(snap.pages,[]);
      const e=cloneEvent(); e.attribution={ ...e.attribution, session_entry:{utm_source:'testsource',utm_campaign:'testcampaign'}, current:{utm_source:'othersource',utm_campaign:'othercampaign'} };
      expectCounts(await req('POST','/collect',envelope(e)),{accepted:1});
      const filtered=(extra: string)=>req('GET',`/admin/overview?${win()}&${extra}`,undefined,{cookie});
      const hit=await filtered('path=%2Flirios-apt&device_class=mobile&utm_source=testsource&utm_campaign=testcampaign'); assert.equal(hit.statusCode,200); assert.equal(hit.json().metrics.pageviews,1); assert.equal(hit.json().pages[0].path,'/lirios-apt');
      assert.equal((await filtered('utm_source=othersource')).json().metrics.pageviews,0,'UTM filters use first-touch session_entry, not current');
      assert.equal((await filtered('device_class=desktop')).json().metrics.pageviews,0);
      assert.equal((await filtered('path=%2F')).json().metrics.pageviews,0);
      const page=cloneEvent(); const second:Record<string,unknown>={...cloneEvent(),path:'/',entry_type:'main'}; delete second.lp_slug;
      expectCounts(await req('POST','/collect',envelope(page)),{accepted:1}); expectCounts(await req('POST','/collect',envelope(second)),{accepted:1});
      const query=`/admin/events?${win()}&limit=1`; const first=await req('GET',query,undefined,{cookie});assert.equal(first.statusCode,200);assert.equal(first.json().items.length,1);assert.ok(first.json().has_more);const cursor=first.json().next_cursor;assert.ok(cursor);
      const next=await req('GET',query+'&cursor='+encodeURIComponent(cursor),undefined,{cookie});assert.equal(next.statusCode,200);assert.equal(next.json().items.length,1);assert.notEqual(next.json().items[0].event_id,first.json().items[0].event_id);assert.ok(next.json().items[0].received_at<=first.json().items[0].received_at);
      assert.equal((await req('GET',query.replace('limit=1','limit=1&path=%2F')+'&cursor='+encodeURIComponent(cursor),undefined,{cookie})).statusCode,400,'cursor bound to filters');
      const ids=new Set<string>(); let c:string|null=null; for(let i=0;i<5;i++){ const r=await req('GET',query+(c?'&cursor='+encodeURIComponent(c):''),undefined,{cookie}); assert.equal(r.statusCode,200); for(const it of r.json().items){ assert.ok(!ids.has(it.event_id),'no duplicate across pages'); ids.add(it.event_id); } c=r.json().next_cursor; if(!r.json().has_more)break; }
      assert.equal(ids.size,3);
    });
    await t.test('presence: initial heartbeat opens, hidden clears, stale retry never resurrects; clock-impossible does not open', async () => {
      await clear(); const { cookie }=await loginCookie();
      const overview=()=>req('GET',`/admin/overview?${win()}`,undefined,{cookie});
      const online=async()=>(await overview()).json().metrics.online_sessions;
      const view=cloneEvent(); expectCounts(await req('POST','/collect',envelope(view)),{accepted:1});
      const heartbeat=(props: object,at=new Date().toISOString())=>({...structuredClone(view),event_id:UUID(),event_type:'heartbeat',props:{visibility_state:'visible',active:true,active_time_delta_ms:0,idle_ms:0,reason:'initial',scrollable:true,...props},occurred_at:at});
      expectCounts(await req('POST','/collect',envelope(heartbeat({}))),{accepted:1}); assert.equal(await online(),1,'initial visible heartbeat opens presence');
      const tieTime=new Date().toISOString();
      const hidden={...structuredClone(view),event_id:UUID(),event_type:'visibility_change',props:{state:'hidden'},occurred_at:tieTime};
      expectCounts(await req('POST','/collect',envelope(hidden)),{accepted:1}); assert.equal(await online(),0,'hidden retires presence');
      const tiedVisible={...structuredClone(view),event_id:UUID(),event_type:'visibility_change',props:{state:'visible'},occurred_at:tieTime};
      expectCounts(await req('POST','/collect',envelope(tiedVisible)),{accepted:1}); assert.equal(await online(),0,'same-timestamp visible must not override hidden');
      const staleVisible={...structuredClone(view),event_id:UUID(),event_type:'visibility_change',props:{state:'visible'},occurred_at:new Date(Date.now()-5*60_000).toISOString()};
      assert.equal((await req('POST','/collect',envelope(staleVisible))).statusCode,200); assert.equal(await online(),0,'delayed retry must not reopen presence');
      expectCounts(await req('POST','/collect',envelope(heartbeat({reason:'interval',active_time_delta_ms:5000}))),{accepted:1});
      const m=(await overview()).json().metrics; assert.equal(m.active_time_ms,5000,'active time sums heartbeat deltas');
      assert.equal(m.pageviews,1); assert.equal(m.observed_sessions,1,'heartbeat/visibility events are not observations of their own');
      const before=await online();
      const future={...cloneEvent(),occurred_at:new Date(Date.now()+3600_000).toISOString()}; const f=await req('POST','/collect',envelope(future)); assert.equal(f.statusCode,200);
      const stored=await pool.query('SELECT clock_valid FROM analytics_events WHERE event_id=$1',[future.event_id]);
      assert.ok(f.json().results[0].status==='rejected'||stored.rows[0]?.clock_valid===false,'future-clock event must be rejected or flagged clock_valid=false');
      assert.equal((await pool.query('SELECT 1 FROM analytics_presence WHERE session_id=$1',[future.session_id])).rowCount,0,'clock-impossible event never opens presence');
      assert.equal(await online(),before);
    });
    await t.test('overview rankings: first-touch campaigns, actions, scroll contexts', async () => {
      await clear(); const { cookie }=await loginCookie();
      const overview=async()=>{ const r=await req('GET',`/admin/overview?${win()}`,undefined,{cookie}); assert.equal(r.statusCode,200); return r.json(); };
      const empty=await overview();
      assert.deepEqual(empty.campaigns,[]); assert.deepEqual(empty.actions,[]);
      assert.deepEqual(empty.scroll,[25,50,75,90].map(threshold_pct=>({threshold_pct,reached_contexts:0,eligible_contexts:0})),'empty snapshot keeps four thresholds with zero denominators');
      const batch=(events: object[])=>({ schema_version: 1, project_id: PROJECT_ID, batch_id: UUID(), events });
      const entry={ utm_source:'entrysource', utm_campaign:'entrycampaign' }, current={ utm_source:'currentsource', utm_campaign:'currentcampaign' };
      const s1={ ...cloneEvent(), attribution:{ session_entry:entry, current } };
      const ev=(type: string, props: object, over: Record<string,unknown>={})=>({ ...structuredClone(s1), ...over, event_id:UUID(), event_type:type, props, occurred_at:new Date().toISOString() });
      const pv2=UUID();
      const events=[
        ev('page_view',{navigation_reason:'initial',storage_mode:'session',scrollable:true},{ pageview_id:s1.pageview_id }),
        ev('page_view',{navigation_reason:'reload',storage_mode:'session',scrollable:true},{ pageview_id:pv2 }),
        ev('scroll_depth',{threshold_pct:25,scroll_source:'user'},{ pageview_id:pv2 }),
        ev('scroll_depth',{threshold_pct:75,scroll_source:'user'},{ pageview_id:pv2 }),
        ev('whatsapp_click',{cta_id:'hero',cta_location:'hero'},{ pageview_id:pv2 }),
        ev('whatsapp_click',{cta_id:'footer',cta_location:'footer'},{ pageview_id:pv2 }),
        ev('cta_click',{cta_id:'pick',cta_location:'hero',action:'open_selector'},{ pageview_id:pv2 }),
      ];
      expectCounts(await req('POST','/collect',batch(events)),{accepted:events.length});
      // Non-scrollable page in another session (default fixture attribution) must be excluded from the scroll denominator.
      const s2=cloneEvent(); s2.props={navigation_reason:'initial',storage_mode:'session',scrollable:false};
      expectCounts(await req('POST','/collect',envelope(s2)),{accepted:1});
      // Retrying the exact same events is acknowledged as duplicates and must not double-count actions.
      expectCounts(await req('POST','/collect',batch(events)),{duplicate:events.length,accepted:0});
      const snap=await overview();
      const pageviews=snap.metrics.pageviews; assert.equal(pageviews,3,'two reload pageviews + one other session');
      const first=snap.campaigns.find((c:{utm_source:string|null})=>c.utm_source==='entrysource');
      assert.ok(first,'campaign grouped by session_entry (first touch)'); assert.equal(first.utm_campaign,'entrycampaign');
      assert.equal(first.pageviews,2); assert.equal(first.observed_sessions,1); assert.equal(first.whatsapp_clicks,2);
      assert.ok(!snap.campaigns.some((c:{utm_source:string|null})=>c.utm_source==='currentsource'),'current attribution never forms a campaign row');
      const action=(type: string)=>snap.actions.find((a:{event_type:string})=>a.event_type===type);
      assert.deepEqual(action('whatsapp_click'),{event_type:'whatsapp_click',clicks:2,observed_sessions:1},'all distinct clicks counted once even after retry');
      assert.deepEqual(action('cta_click'),{event_type:'cta_click',clicks:1,observed_sessions:1});
      assert.equal(action('page_view'),undefined,'only click actions are listed');
      const row=(pct: number)=>snap.scroll.find((r:{threshold_pct:number})=>r.threshold_pct===pct);
      assert.deepEqual(snap.scroll.map((r:{threshold_pct:number})=>r.threshold_pct),[25,50,75,90]);
      for(const pct of [25,50,75]) assert.deepEqual(row(pct),{threshold_pct:pct,reached_contexts:1,eligible_contexts:1},`threshold ${pct}: max depth 75 reaches lower thresholds; reload views share one session/path context`);
      assert.deepEqual(row(90),{threshold_pct:90,reached_contexts:0,eligible_contexts:1},'depth 75 does not reach 90; non-scrollable context excluded');
    });
    await t.test('overview window is bounded to 31 days', async () => {
      await clear(); const { cookie }=await loginCookie();
      const bad=await req('GET','/admin/overview?from=2026-10-01T00:00:00Z&to=2026-12-01T00:00:00Z',undefined,{cookie}); assert.equal(bad.statusCode,400,'window > 31 days');
      const edge=await req('GET','/admin/overview?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z',undefined,{cookie}); assert.equal(edge.statusCode,200,'exactly 31 days is allowed');
    });
    await t.test('expired and disabled admin sessions are rejected', async () => {
      await clear(); const { cookie }=await loginCookie();
      assert.equal((await req('GET','/admin/session',undefined,{cookie})).statusCode,200);
      await pool.query("UPDATE analytics_admin_sessions SET expires_at=now()-interval '1 minute'");
      assert.equal((await req('GET','/admin/session',undefined,{cookie})).statusCode,401,'expired');
      assert.equal((await req('GET','/admin/overview?from=2026-10-12T00:00:00Z&to=2026-10-13T00:00:00Z',undefined,{cookie})).statusCode,401,'expired overview');
      await clear(); const second=await loginCookie();
      assert.equal((await req('GET','/admin/session',undefined,{cookie:second.cookie})).statusCode,200);
      await pool.query("UPDATE analytics_admins SET disabled=true WHERE username='tester'");
      assert.equal((await req('GET','/admin/session',undefined,{cookie:second.cookie})).statusCode,401,'disabled admin session');
      const login=await req('POST','/admin/login',{username:'tester',password},{'x-analytics-admin':'1'}); assert.equal(login.statusCode,401,'disabled admin cannot log in');
    });
    await t.test('production configuration fails closed', () => {
      const keys=['NODE_ENV','DATABASE_URL','ANALYTICS_PUBLIC_ORIGINS','ANALYTICS_ADMIN_ORIGIN','ANALYTICS_SECURE_COOKIE','RELEASE_SHA'] as const;
      const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
      const good={NODE_ENV:'production',DATABASE_URL:url,ANALYTICS_PUBLIC_ORIGINS:'https://www.planteumaflor.com',ANALYTICS_ADMIN_ORIGIN:'https://admin.planteumaflor.com',ANALYTICS_SECURE_COOKIE:'true',RELEASE_SHA:'2b2a937846e09e6603733fe7b725882503685d58'};
      const attempt=(over: Record<string,string|undefined>)=>{
        for(const k of keys){ const v=k in over?over[k]:good[k]; if(v===undefined) delete process.env[k]; else process.env[k]=v; }
        return buildApp({ pool });
      };
      try {
        for(const bad of [{RELEASE_SHA:undefined},{RELEASE_SHA:'development'},{ANALYTICS_SECURE_COOKIE:undefined},{ANALYTICS_SECURE_COOKIE:'false'},{ANALYTICS_ADMIN_ORIGIN:undefined},{ANALYTICS_ADMIN_ORIGIN:'http://admin.planteumaflor.com'},{ANALYTICS_PUBLIC_ORIGINS:undefined},{ANALYTICS_PUBLIC_ORIGINS:'http://www.planteumaflor.com'}])
          assert.throws(()=>attempt(bad),Error,JSON.stringify(bad));
        // A complete production configuration is accepted (control: failures above are caused by the missing/insecure value).
        void attempt({}).close();
      } finally { for(const k of keys){ if(saved[k]===undefined) delete process.env[k]; else process.env[k]=saved[k]; } }
    });
    await t.test('real SSE stream: ready, invalidate after commit, logout closes', async () => {
      await clear();
      const sse=buildApp({ pool }); const address=await sse.listen({ port: 0, host: '127.0.0.1' });
      const abort=new AbortController(); const guard=setTimeout(()=>abort.abort(),8000);
      let reader: ReadableStreamDefaultReader<Uint8Array>|undefined;
      try {
        const { cookie, csrf }=await loginCookie(sse);
        const response=await fetch(address+'/admin/stream',{ headers:{ cookie, origin: ORIGIN }, signal: abort.signal });
        assert.equal(response.status,200); assert.match(response.headers.get('content-type')??'',/text\/event-stream/); assert.match(response.headers.get('cache-control')??'',/no-store/);
        reader=response.body!.getReader(); const decoder=new TextDecoder(); let buffer='';
        const next=async (name: string) => {
          const deadline=Date.now()+2000;
          for(;;){
            const match=buffer.match(new RegExp(`event: ${name}\\ndata: (.*)\\n\\n`));
            if(match){ buffer=buffer.slice(buffer.indexOf(match[0])+match[0].length); return JSON.parse(match[1]!) as { data_revision: number; generated_at: string }; }
            const left=deadline-Date.now(); assert.ok(left>0,`timed out waiting for SSE ${name}`);
            const chunk=await Promise.race([reader!.read(), new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error(`timed out waiting for SSE ${name}`)),left))]);
            assert.ok(!chunk.done,'stream ended early'); buffer+=decoder.decode(chunk.value,{stream:true});
          }
        };
        const ready=await next('ready'); assert.equal(ready.data_revision,0); assert.ok(Date.parse(ready.generated_at));
        expectCounts(await sse.inject({ method:'POST', url:'/collect', payload: envelope(cloneEvent()), headers: base() }),{accepted:1});
        const invalidate=await next('invalidate'); assert.equal(invalidate.data_revision,1); assert.ok(Date.parse(invalidate.generated_at));
        const out=await sse.inject({ method:'POST', url:'/admin/logout', payload:{}, headers: base({ cookie, 'x-csrf-token': csrf }) }); assert.equal(out.statusCode,200);
        const end=await Promise.race([reader.read(), new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('stream not closed after logout')),2000))]);
        assert.ok(end.done,'logout must close the stream');
        assert.equal((await fetch(address+'/admin/stream',{ headers:{ cookie, origin: ORIGIN }, signal: abort.signal })).status,401);
      } finally { clearTimeout(guard); await reader?.cancel().catch(()=>undefined); abort.abort(); await sse.close(); }
    });
  } finally { await clear(); await app.close(); await pool.end(); }
});
