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

  // Only members of this group may schedule a session in it.
  const supabase = createAdminClient();
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) redirect("/");

  const inputClasses =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-300";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <Link
          href={`/groups/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to group
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Schedule a study session
        </h1>
      </div>

      <form action={createSession} className="flex flex-col gap-5">
        {/* The action reads this to know which group the session belongs to. */}
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
            <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
          </span>
          <input
            name="location_or_link"
            placeholder="e.g. WALC 2087, or a Zoom link"
            className={inputClasses}
          />
        </label>

        <div className="flex gap-4">
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
          className="mt-2 rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create session
        </button>
      </form>
    </main>
  );
}
