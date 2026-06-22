// One-off script to verify our database schema is in place.
// Run with:  node --env-file=.env.local scripts/check-db.mjs
// (Node's --env-file flag loads the variables from .env.local for us.)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing env vars — are you running with --env-file=.env.local ?");
  process.exit(1);
}

// We use the SECRET (service_role) key here because this runs on our
// trusted machine/server. It bypasses Row Level Security so we can read freely.
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const tables = ["users", "groups", "group_members", "sessions", "rsvps", "availability"];

let allOk = true;
for (const t of tables) {
  // head:true => don't return any rows, just the count. Cheapest way to ask
  // "does this table exist and how many rows are in it?"
  const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
  if (error) {
    allOk = false;
    console.log(`✗ ${t.padEnd(14)} ERROR: ${error.message}`);
  } else {
    console.log(`✓ ${t.padEnd(14)} exists (rows: ${count})`);
  }
}

console.log(allOk ? "\n✅ All 6 tables verified — your schema is live." : "\n❌ Something's off — re-check the SQL ran without errors.");
process.exit(allOk ? 0 : 1);
