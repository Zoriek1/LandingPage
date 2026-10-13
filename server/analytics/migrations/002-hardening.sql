ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS clock_valid boolean NOT NULL DEFAULT true;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS release_sha text;
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS client_seq bigint;
ALTER TABLE analytics_presence ADD COLUMN IF NOT EXISTS signal_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE analytics_admins ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS analytics_events_history ON analytics_events(project_id, received_at DESC, event_id DESC);
CREATE INDEX IF NOT EXISTS analytics_admin_sessions_expiry ON analytics_admin_sessions(expires_at);
