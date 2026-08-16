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
    "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-muted-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        href={`/groups/${id}`} className="text-sm text-muted transition-colors hover:text-ink dark:text-muted-2"
      >
        ← Back to group
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-sm backdrop-blur dark:bg-ink/60">
        
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Schedule a study session
          </h1>

          <form action={createSession} className="mt-6 flex flex-col gap-5">
            <input type="hidden" name="group_id" value={id} />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">
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
              <span className="text-sm font-medium text-muted">
                Location or link{" "}
                <span className="text-muted-2">
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
                <span className="text-sm font-medium text-muted">
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
                <span className="text-sm font-medium text-muted">
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
              type="submit" className="mt-1 w-full rounded-xl bg-ink px-6 py-3 font-semibold text-bg transition-colors hover:shadow-xl"
            >
              Create session
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
