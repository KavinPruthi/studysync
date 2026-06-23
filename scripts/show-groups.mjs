// Print all groups and their members.
// Run: node --env-file=.env.local scripts/show-groups.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: groups, error } = await supabase
  .from("groups")
  .select(
    "id, name, course_code, description, created_at, group_members ( role, users ( name, email ) )"
  )
  .order("created_at");

if (error) {
  console.error("Error:", error.message);
  process.exit(1);
}

console.log(`\ngroups table has ${groups.length} row(s):\n`);
for (const g of groups) {
  console.log(`  ${g.name}  [${g.course_code}]`);
  console.log(`    id:          ${g.id}`);
  console.log(`    description: ${g.description ?? "(none)"}`);
  console.log(`    members:`);
  for (const m of g.group_members) {
    console.log(`      - ${m.users.name} (${m.users.email}) — ${m.role}`);
  }
  console.log("");
}
