CREATE TABLE IF NOT EXISTS schema_migrations(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS analytics_meta(project_id text PRIMARY KEY, data_revision bigint NOT NULL DEFAULT 0);
INSERT INTO analytics_meta(project_id) VALUES ('plante-uma-flor-lp') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS analytics_events(
 project_id text NOT NULL, event_id uuid NOT NULL, canonical_hash text NOT NULL, event_type text NOT NULL,
 occurred_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), effective_at timestamptz NOT NULL,
 session_id uuid NOT NULL, tab_id uuid NOT NULL, pageview_id uuid NOT NULL, path text NOT NULL,
 lp_slug text, entry_type text, device_class text, attribution jsonb, consent jsonb NOT NULL, props jsonb NOT NULL,
 late boolean NOT NULL DEFAULT false, clock_valid boolean NOT NULL DEFAULT true, PRIMARY KEY(project_id,event_id));
CREATE INDEX IF NOT EXISTS analytics_events_received ON analytics_events(project_id,received_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_effective ON analytics_events(project_id,effective_at,path);
CREATE TABLE IF NOT EXISTS analytics_presence(project_id text NOT NULL, session_id uuid NOT NULL, tab_id uuid NOT NULL, pageview_id uuid NOT NULL, path text NOT NULL, device_class text, attribution jsonb, last_seen timestamptz NOT NULL, visible boolean NOT NULL, PRIMARY KEY(project_id,session_id,tab_id));
CREATE TABLE IF NOT EXISTS analytics_admins(username text PRIMARY KEY, password_hash text NOT NULL);
CREATE TABLE IF NOT EXISTS analytics_admin_sessions(token_hash text PRIMARY KEY, username text NOT NULL, csrf_hash text NOT NULL, expires_at timestamptz NOT NULL);
