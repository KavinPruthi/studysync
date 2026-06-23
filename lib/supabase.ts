import { createClient } from "@supabase/supabase-js";

// Creates a Supabase client authenticated with the SECRET (service_role) key.
//
// This key bypasses Row Level Security, so this client can read/write any row.
// That power is fine on the SERVER, but dangerous in the browser — so only ever
// import this from server-side code (server components, server actions, route
// handlers). Never from a file marked "use client".
export function createAdminClient() {
  // The "!" is a TypeScript "non-null assertion": it tells the compiler
  // "I promise these env vars exist." We set them in .env.local.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, serviceKey, {
    // We don't want this server client trying to persist a browser session.
    auth: { persistSession: false },
  });
}
