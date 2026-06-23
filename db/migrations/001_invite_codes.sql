-- ════════════════════════════════════════════════════════════════
--  Migration 001 — add invite codes to groups
--  Run in Supabase: SQL Editor → New query → paste → Run.
-- ════════════════════════════════════════════════════════════════

-- 1. Add the column. Nullable at first, so we can fill in existing rows.
alter table groups add column if not exists invite_code text;

-- 2. Backfill: give every existing group a code.
--    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)) =>
--    take a random UUID, strip dashes, keep the first 8 chars, uppercase it
--    => a friendly code like "A3F8B2C1".
update groups
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

-- 3. New groups should generate a code automatically on insert.
alter table groups
  alter column invite_code
  set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

-- 4. Now that every row has one, require it and make it unique
--    (two groups must never share a code).
alter table groups alter column invite_code set not null;
create unique index if not exists idx_groups_invite_code on groups(invite_code);
