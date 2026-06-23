import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { saveAvailability } from "./actions";
import {
  DAY_LABELS,
  SLOTS_PER_DAY,
  timeToSlot,
  slotLabel,
  computeOverlap,
  mergeSlots,
} from "@/lib/availability";

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href={`/groups/${id}`}
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← {group?.name ?? "Back to group"}
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
        Weekly availability
      </h1>

      {/* Editable grid */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="font-bold text-zinc-900 dark:text-white">
          Your free time
        </h2>
        <p className="mt-1 mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Click and drag to mark when you&apos;re usually free, then save.
        </p>
        <AvailabilityGrid
          groupId={id}
          initialSelected={initialSelected}
          action={saveAvailability}
        />
      </div>

      {/* Overlap heatmap */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="font-bold text-zinc-900 dark:text-white">
          Group overlap
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Darker green = more people free. Based on {totalMembers}{" "}
          {totalMembers === 1 ? "member" : "members"}.
        </p>

        {maxOverlap > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/30">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              ⭐ Best times — {maxOverlap} of {totalMembers} free
            </p>
            <ul className="mt-1 flex flex-wrap gap-x-4 text-sm text-emerald-700 dark:text-emerald-400">
              {bestTimes.map((b, i) => (
                <li key={i}>
                  {DAY_LABELS[b.day]} {slotLabel(b.start)} – {slotLabel(b.end)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-16"></th>
                {DAY_LABELS.map((d) => (
                  <th
                    key={d}
                    className="px-1 pb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => (
                <tr key={slot}>
                  <td className="pr-2 text-right align-top text-[10px] leading-5 text-zinc-400">
                    {slot % 2 === 0 ? slotLabel(slot) : ""}
                  </td>
                  {DAY_LABELS.map((dayLabel, day) => {
                    const count = heatmap[day][slot];
                    const ratio = totalMembers > 0 ? count / totalMembers : 0;
                    const isBest = maxOverlap > 0 && count === maxOverlap;
                    return (
                      <td key={day} className="p-0">
                        <div
                          title={`${count}/${totalMembers} free — ${dayLabel} ${slotLabel(
                            slot
                          )}`}
                          className={
                            "h-5 w-10 border border-zinc-200 dark:border-zinc-700/60 " +
                            (isBest
                              ? "ring-2 ring-inset ring-emerald-600 dark:ring-emerald-400"
                              : "")
                          }
                          style={{
                            backgroundColor:
                              count === 0
                                ? undefined
                                : `rgba(16, 185, 129, ${0.15 + 0.85 * ratio})`,
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
