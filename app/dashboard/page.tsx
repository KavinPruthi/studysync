import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import { joinGroup } from "../groups/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  // searchParams carries ?error=... that joinGroup may redirect back with.
  const { error } = await searchParams;

  const supabase = createAdminClient();

  // Describe the shape we expect back. `groups` is a single object (not an
  // array) because each membership points to exactly one group.
  type MembershipRow = {
    role: string;
    groups: {
      id: string;
      name: string;
      course_code: string;
      description: string | null;
    };
  };

  // Find every group the current user belongs to. We start from group_members
  // (filtered to this user) and follow the foreign key to each group's details.
  // .returns<T>() overrides Supabase's default (array) typing with our shape.
  const { data: memberships } = await supabase
    .from("group_members")
    .select("role, groups ( id, name, course_code, description )")
    .eq("user_id", session.user.id)
    .order("joined_at", { ascending: false })
    .returns<MembershipRow[]>();

  // Flatten into a simple list of groups, carrying the user's role along.
  const groups = (memberships ?? [])
    .filter((m) => m.groups) // guard against any dangling rows
    .map((m) => ({ ...m.groups, role: m.role }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Your groups
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Welcome back, {session.user.name ?? session.user.email}.
          </p>
        </div>
        <Link
          href="/groups/new"
          className="shrink-0 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New group
        </Link>
      </div>

      {/* Join-by-code form. Submitting runs the joinGroup server action. */}
      <form
        action={joinGroup}
        className="mt-6 flex gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
      >
        <input
          name="invite_code"
          placeholder="Have a code? Join a group"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-300"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Join
        </button>
      </form>

      {/* Error banner (e.g. bad invite code). */}
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {groups.length === 0 ? (
        // ── Empty state: no groups yet ──────────────────────────────
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">
            You&apos;re not in any groups yet.
          </p>
          <Link
            href="/groups/new"
            className="mt-3 inline-block font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Create your first group
          </Link>
        </div>
      ) : (
        // ── Grid of group cards ─────────────────────────────────────
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="flex h-full flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
              >
                <span className="inline-block w-fit rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {g.course_code}
                </span>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {g.name}
                </h2>
                {g.description && (
                  <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {g.description}
                  </p>
                )}
                <span className="mt-auto pt-2 text-xs font-medium uppercase text-zinc-400 dark:text-zinc-500">
                  {g.role}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
