-- ════════════════════════════════════════════════════════════════
--  StudySync database schema
--  How to run: Supabase Dashboard → SQL Editor → New query →
--  paste this whole file → Run. Safe to run more than once.
-- ════════════════════════════════════════════════════════════════

-- gen_random_uuid() comes from this extension. Supabase usually has it
-- enabled already; this line just makes sure.
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
--  users — one row per signed-in person.
--  NextAuth will insert/update a row here when someone logs in with Google.
-- ─────────────────────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null unique,   -- Google email; UNIQUE lets us "upsert" by it
  image       text,                   -- profile picture URL from Google
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
--  groups — a study group for a course.
-- ─────────────────────────────────────────────────────────────
create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  course_code text not null,
  description text,
  -- created_by points at a user. ON DELETE CASCADE => if that user is
  -- deleted, their groups go too (no orphaned rows pointing at nobody).
  created_by  uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
--  group_members — which users are in which groups (a many-to-many link).
--  A composite primary key (group_id, user_id) means a given user can
--  appear in a given group at most once.
-- ─────────────────────────────────────────────────────────────
create table if not exists group_members (
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  -- A CHECK constraint is how we fake an "enum": only these two strings allowed.
  role      text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
--  sessions — a scheduled study session inside a group.
--  start_time/end_time are full timestamps (a specific date AND time).
-- ─────────────────────────────────────────────────────────────
create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid not null references groups(id) on delete cascade,
  title            text not null,
  location_or_link text,
  start_time       timestamptz not null,
  end_time         timestamptz not null,
  created_by       uuid not null references users(id) on delete cascade,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
--  rsvps — a user's response to a session.
--  Composite PK (session_id, user_id) => one RSVP per person per session.
-- ─────────────────────────────────────────────────────────────
create table if not exists rsvps (
  session_id uuid not null references sessions(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  status     text not null check (status in ('going','maybe','no')),
  updated_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
--  availability — weekly recurring free-time blocks a user submits for a group.
--  day_of_week: 0 = Sunday ... 6 = Saturday.
--  start_time/end_time are TIME-of-day only (no date), because the block
--  repeats every week — e.g. "free Tuesdays 14:00–16:00".
-- ─────────────────────────────────────────────────────────────
create table if not exists availability (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  group_id    uuid not null references groups(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time  time not null,
  end_time    time not null
);

-- ─────────────────────────────────────────────────────────────
--  Indexes — speed up the lookups we'll do most often.
--  (A foreign key alone doesn't create an index on the child side.)
-- ─────────────────────────────────────────────────────────────
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_sessions_group      on sessions(group_id);
create index if not exists idx_availability_group  on availability(group_id);

-- ─────────────────────────────────────────────────────────────
--  Security: turn ON Row Level Security but add NO policies.
--  Effect: the public "publishable" key cannot read or write these tables
--  at all. Our Next.js server uses the SECRET (service_role) key, which
--  bypasses RLS — so every data access goes through our own trusted
--  server code, where we'll check permissions ourselves.
-- ─────────────────────────────────────────────────────────────
alter table users         enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
alter table sessions      enable row level security;
alter table rsvps         enable row level security;
alter table availability  enable row level security;
