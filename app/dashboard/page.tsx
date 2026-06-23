import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { joinGroup } from "../groups/actions";
import { courseBadge, courseGradient } from "@/lib/colors";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { error } = await searchParams;

  const supabase = createAdminClient();

  type MembershipRow = {
    role: string;
    groups: {
      id: string;
      name: string;
      course_code: string;
      description: string | null;
    };
  };

  const { data: memberships } = await supabase
    .from("group_members")
    .select("role, groups ( id, name, course_code, description )")
    .eq("user_id", session.user.id)
    .order("joined_at", { ascending: false })
    .returns<MembershipRow[]>();

  const groups = (memberships ?? [])
    .filter((m) => m.groups)
    .map((m) => ({ ...m.groups, role: m.role }));

  const firstName = (session.user.name ?? session.user.email ?? "").split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Welcome back{firstName ? `, ${firstName}` : ""} 👋
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Your groups
          </h1>
        </div>
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40"
        >
          + New group
        </Link>
      </div>

      {/* Join by code */}
      <form
        action={joinGroup}
        className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white/60 p-2 pl-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Got an invite code?
        </span>
        <input
          name="invite_code"
          placeholder="e.g. A3F8B2C1"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm uppercase tracking-wider text-zinc-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Join
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white/40 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl shadow-lg shadow-indigo-500/30">
            👥
          </div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            You&apos;re not in any groups yet.
          </p>
          <Link
            href="/groups/new"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            Create your first group
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${courseGradient(
                    g.course_code
                  )}`}
                />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span
                    className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${courseBadge(
                      g.course_code
                    )}`}
                  >
                    {g.course_code}
                  </span>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {g.name}
                  </h2>
                  {g.description && (
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {g.description}
                    </p>
                  )}
                  <span className="mt-auto pt-3 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    {g.role}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
