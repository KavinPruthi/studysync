// app/demo/page.tsx
// A public, read-only look at the overlap heatmap.
//
// Without an account a visitor saw nothing but a login wall, so the one part of
// the app worth looking at was invisible to anyone evaluating it.
//
// This route touches NO auth and NO database. computeOverlap() takes a plain
// array of availability rows and knows nothing about Supabase, so the demo hands
// it fixed data and renders the same component the real page renders. It
// therefore cannot break when the database is asleep or a session has expired.
//
// Read-only by design: the real page renders an editable grid wired to a server
// action, and a public page that let strangers write would need authorisation
// rules this does not have.

import Link from "next/link";
import { Heatmap, bestTimesFrom } from "@/components/Heatmap";
import { DEMO_MEMBERS, DEMO_MEMBER_COUNT, DEMO_ROWS } from "@/lib/demo-data";
import {
  DAY_LABELS,
  SLOTS_PER_DAY,
  computeOverlap,
  mergeSlots,
  slotLabel,
} from "@/lib/availability";

export const metadata = {
  title: "Demo · StudySync",
  description:
    "See how StudySync finds the times a whole study group is free. No account needed.",
};

export default function DemoPage() {
  const heatmap = computeOverlap(DEMO_ROWS);
  const maxOverlap = bestTimesFrom(heatmap);

  const bestTimes: { day: number; start: number; end: number }[] = [];
  heatmap.forEach((daySlots, day) => {
    const hits = daySlots
      .map((c, slot) => (c === maxOverlap ? slot : -1))
      .filter((s) => s >= 0);
    for (const r of mergeSlots(hits)) bestTimes.push({ day, start: r.start, end: r.end });
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="text-[14px] text-muted transition-colors hover:text-ink">
        ← StudySync
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="display text-[34px] leading-tight">Group overlap</h1>
        <span className="rounded-full border border-line px-3 py-1 text-[12px] text-muted-2">
          Example data
        </span>
      </div>

      <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">
        A made-up group of {DEMO_MEMBER_COUNT} students, so you can see how this
        works without signing in. Everyone marks when they are free. The darkest
        cells are when the most people can make it.
      </p>

      {bestTimes.length > 0 && (
        <div className="mt-8 border-y border-line py-5">
          <div className="label">
            Everyone free · {maxOverlap} of {DEMO_MEMBER_COUNT}
          </div>
          <ul className="nums mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[15px] text-accent">
            {bestTimes.map((b, i) => (
              <li key={i}>
                {DAY_LABELS[b.day]} {slotLabel(b.start)} – {slotLabel(b.end)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {DEMO_MEMBERS.map((m) => (
          <span
            key={m.name} className="rounded-full border border-line px-3 py-1 text-[13px] text-muted"
          >
            {m.name}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <p className="mb-4 text-[13px] text-muted-2">
          Darker means more people free. Hover a cell for the count.
        </p>
        <Heatmap
          heatmap={heatmap}
          totalMembers={DEMO_MEMBER_COUNT}
          maxOverlap={maxOverlap}
        />
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <h2 className="text-[15px] font-medium">How the overlap is worked out</h2>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          The week is split into 30-minute slots, a 7 × {SLOTS_PER_DAY} grid, so{" "}
          {7 * SLOTS_PER_DAY} in total. Each person&apos;s free block adds one to
          every slot it covers. Once everyone is counted, each cell holds the
          number of people free then, and the highest counts are the best times.
        </p>
        <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
          Counting this way is linear in the amount of availability data, rather
          than comparing every member against every other member.
        </p>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <p className="text-[15px] text-muted">
          Sign in to make a real group, invite classmates with a code, and push
          sessions to Google Calendar.
        </p>
        <Link
          href="/" className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-90"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
