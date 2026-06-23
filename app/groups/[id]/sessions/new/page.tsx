import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSession } from "@/app/sessions/actions";

export default async function NewSessionPage({
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

  const inputClasses =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        href={`/groups/${id}`}
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back to group
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-violet-500" />
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Schedule a study session
          </h1>

          <form action={createSession} className="mt-6 flex flex-col gap-5">
            <input type="hidden" name="group_id" value={id} />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Title
              </span>
              <input
                name="title"
                required
                placeholder="e.g. Midterm review"
                className={inputClasses}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Location or link{" "}
                <span className="text-zinc-400 dark:text-zinc-500">
                  (optional)
                </span>
              </span>
              <input
                name="location_or_link"
                placeholder="e.g. WALC 2087, or a Zoom link"
                className={inputClasses}
              />
            </label>

            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Starts
                </span>
                <input
                  type="datetime-local"
                  name="start_time"
                  required
                  className={inputClasses}
                />
              </label>

              <label className="flex flex-1 flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ends
                </span>
                <input
                  type="datetime-local"
                  name="end_time"
                  required
                  className={inputClasses}
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create session
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
