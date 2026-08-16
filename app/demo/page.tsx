// app/demo/page.tsx
// A public, read-only look at the overlap heatmap.
//
// Why this exists: without an account a visitor saw nothing but a login wall,
// so the one genuinely interesting thing the app does was invisible to anyone
// evaluating it.
//
// This route touches NO auth and NO database. computeOverlap() takes a plain
// array of availability rows and knows nothing about Supabase, so the demo just
// hands it fixed data and renders the same heatmap the real page renders. That
// also means it cannot break when the database is asleep or a session expires.
//
// It is deliberately read-only: the real page renders an editable grid wired to
// a server action, and a public page that let strangers write would need auth
// rules this does not have.

import Link from "next/link";
import {
  DAY_LABELS,
  SLOTS_PER_DAY,
  computeOverlap,
  mergeSlots,
  slotLabel,
  slotToTime,
} from "@/lib/availability";

export const metadata = {
  title: "Demo — StudySync",
  description:
    "See how StudySync finds the times a whole study group is free. No account needed.",
};

// A believable five-person group. Times are built from slot indices via
// slotToTime() rather than hardcoded strings, so this data stays correct if the
// grid's hours or slot size ever change.
const MEMBERS = [
  {
    name: "Aisha",
    blocks: [
      { day: 1, from: 18, to: 24 }, // Mon late afternoon
      { day: 2, from: 4, to: 10 },
      { day: 3, from: 18, to: 26 },
      { day: 4, from: 6, to: 12 },
    ],
  },
  {
    name: "Ben",
    blocks: [
      { day: 1, from: 20, to: 26 },
      { day: 3, from: 20, to: 26 },
      { day: 5, from: 2, to: 8 },
      { day: 6, from: 8, to: 16 },
    ],
  },
  {
    name: "Chloe",
    blocks: [
      { day: 1, from: 19, to: 25 },
      { day: 2, from: 2, to: 8 },
      { day: 3, from: 19, to: 25 },
      { day: 6, from: 10, to: 18 },
    ],
  },
  {
    name: "Diego",
    blocks: [
      { day: 1, from: 20, to: 24 },
      { day: 3, from: 21, to: 26 },
      { day: 4, from: 14, to: 20 },
      { day: 6, from: 12, to: 20 },
    ],
  },
  {
    name: "Priya",
    blocks: [
      { day: 1, from: 16, to: 24 },
      { day: 3, from: 20, to: 24 },
      { day: 5, from: 4, to: 10 },
      { day: 6, from: 6, to: 14 },
    ],
  },
];

const TOTAL_MEMBERS = MEMBERS.length;

const ROWS = MEMBERS.flatMap((m) =>
  m.blocks.map((b) => ({
    day_of_week: b.day,
    start_time: slotToTime(b.from),
    end_time: slotToTime(b.to),
  })),
);

export default function DemoPage() {
  // Exactly the same call the real availability page makes.
  const heatmap = computeOverlap(ROWS);

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
        href="/"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← StudySync
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Group overlap
        </h1>
        <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Example data
        </span>
      </div>

      <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
        This is the core of StudySync, using a made-up group of{" "}
        {TOTAL_MEMBERS} students so you can see it without signing in. Everyone
        marks when they are free, and the darkest cells are when the most people
        can make it.
      </p>

      {/* Best times */}
      {maxOverlap > 0 && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/30">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Best times · {maxOverlap} of {TOTAL_MEMBERS} free
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

      {/* Who is in the group */}
      <div className="mt-6 flex flex-wrap gap-2">
        {MEMBERS.map((m) => (
          <span
            key={m.name}
            className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
          >
            {m.name}
          </span>
        ))}
      </div>

      {/* Heatmap */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Darker green = more people free.
        </p>
        <div className="overflow-x-auto">
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
                    const ratio = TOTAL_MEMBERS > 0 ? count / TOTAL_MEMBERS : 0;
                    const isBest = maxOverlap > 0 && count === maxOverlap;
                    return (
                      <td key={day} className="p-0">
                        <div
                          title={`${count}/${TOTAL_MEMBERS} free — ${dayLabel} ${slotLabel(
                            slot,
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

      {/* How it works — the thing worth explaining to anyone evaluating this */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm leading-relaxed text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
        <h2 className="font-bold text-zinc-900 dark:text-white">
          How the overlap is worked out
        </h2>
        <p className="mt-2">
          The week is split into 30-minute slots, a 7 × {SLOTS_PER_DAY} grid, so{" "}
          {7 * SLOTS_PER_DAY} slots in total. For each member&apos;s free block,
          every slot it covers gets one added to it. Once everyone is counted,
          each cell holds the number of people free at that time, and the highest
          counts are the best times to meet.
        </p>
        <p className="mt-2">
          Counting like this is linear in the amount of availability data, rather
          than comparing every member against every other member.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          Sign in to make a real group, invite classmates with a code, and push
          sessions to your Google Calendar.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
        >
          Get started →
        </Link>
      </div>
    </main>
  );
}
