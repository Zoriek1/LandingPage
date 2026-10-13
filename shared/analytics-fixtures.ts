import { PROJECT_ID, SCHEMA_VERSION, type AnalyticsEnvelope } from './analytics-contract.ts';

// Synthetic, PII-free fixture for contract consumers and tests.
export const validAnalyticsEnvelope: AnalyticsEnvelope = {
  schema_version: SCHEMA_VERSION,
  project_id: PROJECT_ID,
  batch_id: 'e65845b0-807d-44c6-a457-4e7751bb4e5a',
  events: [{
    schema_version: SCHEMA_VERSION,
    event_id: '8f18f280-d013-4214-94fd-1a5fb1b290e1',
    event_type: 'page_view',
    occurred_at: '2026-10-12T22:00:00.000Z',
    session_id: 'b11d612c-ae2e-42d3-ac39-08f53adf7e69',
    tab_id: '4d2fabdc-0a41-4b7f-8adc-f045d55b6234',
    pageview_id: '2b4bc294-9e27-43f5-8ab6-bf6a975ba596',
    client_seq: 1,
    release_sha: '2b2a937846e09e6603733fe7b725882503685d58',
    path: '/lirios-apt',
    lp_slug: 'lirios-apt',
    entry_type: 'ad_lp',
    device_class: 'mobile',
    attribution: { session_entry: { utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'lirios-outubro' }, current: { utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'lirios-outubro' }, referrer_host: 'instagram.com' },
    consent: { analytics: 'granted', policy_version: 'analytics-v1', scope_id: '12440710-801c-4fb3-a5b2-b2bd5f9e5362', collected_at: '2026-10-12T22:00:00.000Z' },
    props: { navigation_reason: 'initial', storage_mode: 'session', scrollable: true },
  }],
};
