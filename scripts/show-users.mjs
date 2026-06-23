// Quick helper to print everyone in the users table.
// Run: node --env-file=.env.local scripts/show-users.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await supabase
  .from("users")
  .select("id, name, email, image, created_at")
  .order("created_at");

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log(`\nusers table has ${data.length} row(s):\n`);
for (const u of data) {
  console.log(`  id:      ${u.id}`);
  console.log(`  name:    ${u.name}`);
  console.log(`  email:   ${u.email}`);
  console.log(`  image:   ${u.image ? u.image.slice(0, 55) + "..." : "(none)"}`);
  console.log(`  created: ${u.created_at}\n`);
}
