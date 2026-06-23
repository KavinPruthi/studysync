// Adds (or removes) a few demo classmates with availability, so the overlap
// heatmap has something to show while you're testing solo.
//
//   Add:    node --env-file=.env.local scripts/seed-demo-members.mjs
//   Remove: node --env-file=.env.local scripts/seed-demo-members.mjs --remove
//
// It targets your first group. Safe to run repeatedly.
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const remove = process.argv.includes("--remove");

const DEMOS = [
  {
    name: "Demo Alice",
    email: "demo.alice@example.com",
    avail: [
      { day_of_week: 2, start_time: "10:00:00", end_time: "12:00:00" }, // Tue
      { day_of_week: 2, start_time: "13:00:00", end_time: "15:00:00" },
      { day_of_week: 3, start_time: "09:00:00", end_time: "11:00:00" }, // Wed
    ],
  },
  {
    name: "Demo Bob",
    email: "demo.bob@example.com",
    avail: [
      { day_of_week: 2, start_time: "10:30:00", end_time: "11:30:00" }, // Tue
      { day_of_week: 1, start_time: "16:30:00", end_time: "17:30:00" }, // Mon
      { day_of_week: 3, start_time: "09:00:00", end_time: "12:00:00" }, // Wed
    ],
  },
  {
    name: "Demo Carol",
    email: "demo.carol@example.com",
    avail: [
      { day_of_week: 2, start_time: "10:00:00", end_time: "11:00:00" }, // Tue
      { day_of_week: 3, start_time: "10:00:00", end_time: "11:00:00" }, // Wed
    ],
  },
];

// Grab the first group to attach demo members to.
const { data: group, error: gErr } = await supabase
  .from("groups")
  .select("id, name")
  .limit(1)
  .single();
if (gErr || !group) {
  console.error("No group found. Create a group first.");
  process.exit(1);
}

if (remove) {
  const emails = DEMOS.map((d) => d.email);
  // Deleting the users cascades to their memberships + availability.
  const { error } = await supabase.from("users").delete().in("email", emails);
  if (error) {
    console.error("Error removing demo members:", error.message);
    process.exit(1);
  }
  console.log("Removed demo members.");
  process.exit(0);
}

console.log(`Seeding demo members into "${group.name}"...\n`);

for (const demo of DEMOS) {
  // Upsert the user (by unique email).
  const { data: user, error: uErr } = await supabase
    .from("users")
    .upsert({ name: demo.name, email: demo.email }, { onConflict: "email" })
    .select("id")
    .single();
  if (uErr) {
    console.error(`  ${demo.name}: ${uErr.message}`);
    continue;
  }

  // Ensure they're a member of the group.
  await supabase
    .from("group_members")
    .upsert(
      { group_id: group.id, user_id: user.id, role: "member" },
      { onConflict: "group_id,user_id" }
    );

  // Replace their availability for this group.
  await supabase
    .from("availability")
    .delete()
    .eq("group_id", group.id)
    .eq("user_id", user.id);
  await supabase.from("availability").insert(
    demo.avail.map((a) => ({ ...a, group_id: group.id, user_id: user.id }))
  );

  console.log(`  ✓ ${demo.name}`);
}

console.log("\nDone. Reload the availability page to see the heatmap.");
