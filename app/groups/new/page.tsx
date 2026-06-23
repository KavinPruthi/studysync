import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createGroup } from "../actions";

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const inputClasses =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Dashboard
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Create a study group
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            Start a group for one of your courses. You can invite classmates
            next.
          </p>

          <form action={createGroup} className="mt-6 flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Group name
              </span>
              <input
                name="name"
                required
                placeholder="e.g. CS 180 Study Crew"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Course code
              </span>
              <input
                name="course_code"
                required
                placeholder="e.g. CS 180"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description{" "}
                <span className="text-zinc-400 dark:text-zinc-500">
                  (optional)
                </span>
              </span>
              <textarea
                name="description"
                rows={3}
                placeholder="What's this group for?"
                className={inputClasses}
              />
            </label>

            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create group
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
