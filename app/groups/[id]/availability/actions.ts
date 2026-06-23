"use server";

import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { mergeSlots, slotToTime } from "@/lib/availability";

export async function saveAvailability(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const groupId = String(formData.get("group_id") ?? "");
  const slotsRaw = String(formData.get("slots") ?? "[]");
  if (!groupId) {
    throw new Error("Missing group id.");
  }

  // `slots` is a JSON array of "day-slot" strings, e.g. ["1-4","1-5","3-10"].
  let keys: string[] = [];
  try {
    keys = JSON.parse(slotsRaw);
  } catch {
    throw new Error("Bad availability data.");
  }

  const supabase = createAdminClient();

  // Authorization: must be a member of the group.
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) {
    throw new Error("You are not a member of this group.");
  }

  // Group the selected slot indices by day of week.
  const byDay = new Map<number, number[]>();
  for (const key of keys) {
    const [day, slot] = key.split("-").map(Number);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(slot);
  }

  // Merge each day's slots into ranges, then build availability rows.
  const rows = [];
  for (const [day, slots] of byDay) {
    for (const range of mergeSlots(slots)) {
      rows.push({
        user_id: session.user.id,
        group_id: groupId,
        day_of_week: day,
        start_time: slotToTime(range.start),
        end_time: slotToTime(range.end),
      });
    }
  }

  // Replace this user's availability for this group: delete the old, insert new.
  // (Simple and correct — we just rewrite their whole selection each save.)
  const { error: delErr } = await supabase
    .from("availability")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", session.user.id);
  if (delErr) throw new Error(delErr.message);

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("availability").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath(`/groups/${groupId}/availability`);
}
