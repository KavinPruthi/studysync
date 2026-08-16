import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { saveAvailability } from "./actions";
import {
  DAY_LABELS,
  timeToSlot,
  slotLabel,
  computeOverlap,
  mergeSlots,
} from "@/lib/availability";
import { Heatmap } from "@/components/Heatmap";

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const supabase = createAdminClient();

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) redirect("/");

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", id)
    .single();

  const { data: myRows } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("group_id", id)
    .eq("user_id", session.user.id);

  const initialSelected: string[] = [];
  for (const row of myRows ?? []) {
    const startSlot = timeToSlot(row.start_time);
    const endSlot = timeToSlot(row.end_time);
    for (let s = startSlot; s < endSlot; s++) {
      initialSelected.push(`${row.day_of_week}-${s}`);
    }
  }

  const { data: allRows } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time")
    .eq("group_id", id);

  const { count: memberCount } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", id);

  const heatmap = computeOverlap(allRows ?? []);
  const totalMembers = memberCount ?? 1;

  let maxOverlap = 0;
  for (const day of heatmap) {
    for (const c of day) if (c > maxOverlap) maxOverlap = c;
  }

  const bestTimes: { day: number; start: number; end: number }[] = [];
  if (maxOverlap > 0) {
    heatmap.forEach((daySlots, day) => {
      const bestSlots = daySlots
        .map((c, slot) => (c === maxOverlap ? slot : -1))
        .filter((s) => s >= 0);
      for (const r of mergeSlots(bestSlots)) {
        bestTimes.push({ day, start: r.start, end: r.end });
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link
        href={`/groups/${id}`} className="text-[14px] text-muted transition-colors hover:text-ink"
      >
        ← {group?.name ?? "Back to group"}
      </Link>

      <h1 className="display mt-5 text-[34px] leading-tight">
        Weekly availability
      </h1>

      {/* Editable grid */}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-[15px] font-medium">
          Your free time
        </h2>
        <p className="mt-1 mb-4 text-[14px] text-muted">
          Click and drag to mark when you&apos;re usually free, then save.
        </p>
        <AvailabilityGrid
          groupId={id}
          initialSelected={initialSelected}
          action={saveAvailability}
        />
      </div>

      {/* Overlap heatmap */}
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-[15px] font-medium">
          Group overlap
        </h2>
        <p className="mt-1 text-[14px] text-muted">
          Darker green = more people free. Based on {totalMembers}{" "}
          {totalMembers === 1 ? "member" : "members"}.
        </p>

        {maxOverlap > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="label">
              Everyone free · {maxOverlap} of {totalMembers}
            </p>
            <ul className="nums mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-accent">
              {bestTimes.map((b, i) => (
                <li key={i}>
                  {DAY_LABELS[b.day]} {slotLabel(b.start)} – {slotLabel(b.end)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <Heatmap
            heatmap={heatmap}
            totalMembers={totalMembers}
            maxOverlap={maxOverlap}
          />
        </div>
      </div>
    </main>
  );
}
