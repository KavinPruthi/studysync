import Link from "next/link";
import { auth, signIn } from "@/auth";
import { Heatmap, bestTimesFrom } from "@/components/Heatmap";
import { DEMO_ROWS, DEMO_MEMBER_COUNT } from "@/lib/demo-data";
import {
  DAY_LABELS,
  computeOverlap,
  mergeSlots,
  slotLabel,
} from "@/lib/availability";

export default async function Home() {
  const session = await auth();

  // The real function on real-shaped data. The landing page shows the product
  // rather than a description of it, and it cannot drift out of date because it
  // is the same code path the app uses.
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
    <main className="flex-1">
      <section className="mx-auto grid max-w-5xl gap-12 px-6 pt-16 pb-20 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-16">
        {/* Left: the pitch */}
        <div className="max-w-lg">
          <h1 className="display text-[42px] leading-[1.08]">
            Find a time that works for everyone.
          </h1>

          <p className="mt-5 text-[17px] leading-relaxed text-muted">
            Everyone marks when they are free. StudySync shows you the slots the
            whole group can make, and puts the session on their calendars.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard" className="rounded-full bg-ink px-6 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-90"
              >
                Go to your dashboard
              </Link>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <button className="flex items-center gap-2.5 rounded-full bg-ink px-6 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-90">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 11v2.8h4c-.2 1-1.3 3-4 3a3.8 3.8 0 0 1 0-7.6c1.2 0 2 .5 2.5.95l1.9-1.85C15.1 6.2 13.7 5.6 12 5.6a6.4 6.4 0 1 0 0 12.8c3.7 0 6.1-2.6 6.1-6.25 0-.42-.05-.74-.1-1.05H12z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </form>
            )}

            <Link
              href="/demo" className="rounded-full border border-line-strong px-6 py-2.5 text-[15px] text-muted transition-colors hover:text-ink"
            >
              See it working
            </Link>
          </div>

          <p className="mt-4 text-[13px] text-muted-2">
            No account needed to look around.
          </p>

          {/* Three things, stated plainly. No icons: the words are the content. */}
          <dl className="mt-12 space-y-5 border-t border-line pt-8">
            {[
              [
                "Overlap, not guesswork",
                "The week is split into half-hour slots. Every slot counts how many people are free, so the best time is the one with the highest count.",
              ],
              [
                "Groups by course",
                "Make a group, share a code, and classmates join. No email chains.",
              ],
              [
                "On the calendar",
                "RSVP going and the session appears in Google Calendar. Back out and it disappears.",
              ],
            ].map(([title, desc]) => (
              <div key={title}>
                <dt className="text-[15px] font-medium">{title}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-muted">
                  {desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: the actual thing */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[14px] font-medium">A group of {DEMO_MEMBER_COUNT}</span>
              <span className="label">example</span>
            </div>

            <div className="mt-4">
              <Heatmap
                heatmap={heatmap}
                totalMembers={DEMO_MEMBER_COUNT}
                maxOverlap={maxOverlap}
                compact
              />
            </div>

            {bestTimes.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <div className="label">
                  Everyone free · {maxOverlap} of {DEMO_MEMBER_COUNT}
                </div>
                <ul className="nums mt-2 space-y-1 text-[13px] text-accent">
                  {bestTimes.map((b, i) => (
                    <li key={i}>
                      {DAY_LABELS[b.day]} {slotLabel(b.start)} – {slotLabel(b.end)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
