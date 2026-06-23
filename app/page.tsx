import Link from "next/link";
import { auth, signIn } from "@/auth";

const FEATURES = [
  {
    icon: "👥",
    gradient: "from-indigo-500 to-violet-500",
    title: "Study groups",
    desc: "Spin up a group for each course and invite classmates with a simple code.",
  },
  {
    icon: "🗓️",
    gradient: "from-violet-500 to-fuchsia-500",
    title: "Sessions & RSVPs",
    desc: "Schedule sessions, RSVP in a click, and sync them to your Google Calendar.",
  },
  {
    icon: "⚡",
    gradient: "from-blue-500 to-cyan-500",
    title: "Overlap heatmap",
    desc: "Everyone marks their free time; instantly see the best slot for the whole group.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          📅 Study scheduling, simplified
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
          Find a time that{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            actually works
          </span>{" "}
          for everyone.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          StudySync helps you and your classmates form study groups, schedule
          sessions, and instantly see when everyone&apos;s free — synced right
          to your Google Calendar.
        </p>

        <div className="mt-10 flex items-center justify-center">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              Go to your dashboard →
            </Link>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#fff"
                    d="M12 11v2.8h4c-.2 1-1.3 3-4 3a3.8 3.8 0 0 1 0-7.6c1.2 0 2 .5 2.5.95l1.9-1.85C15.1 6.2 13.7 5.6 12 5.6a6.4 6.4 0 1 0 0 12.8c3.7 0 6.1-2.6 6.1-6.25 0-.42-.05-.74-.1-1.05H12z"
                  />
                </svg>
                Sign in with Google
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.gradient} text-2xl shadow-md`}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
