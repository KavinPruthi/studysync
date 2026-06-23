-- ════════════════════════════════════════════════════════════════
--  Migration 002 — Google Calendar sync support
--  Run in Supabase: SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- Store each user's Google tokens server-side (RLS-locked; only our server,
-- using the service_role key, can read these). Never exposed to the browser.
alter table users add column if not exists google_access_token  text;
alter table users add column if not exists google_refresh_token text;
alter table users add column if not exists google_token_expiry   timestamptz;

-- Remember the calendar event we created for a given RSVP, so we can delete it
-- if the person later changes their RSVP away from "going".
alter table rsvps add column if not exists google_event_id text;
