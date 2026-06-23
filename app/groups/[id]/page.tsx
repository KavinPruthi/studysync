import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { deleteGroup } from "../actions";
import { DeleteGroupButton } from "./DeleteGroupButton";

// In Next.js 15+, `params` is a Promise, so the component is async and we await it.
// The [id] from the folder name arrives here as params.id.
export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const supabase = createAdminClient();

  // Load the group itself.
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, course_code, description, created_at, invite_code")
    .eq("id", id)
    .single();

  if (!group) notFound(); // shows the 404 page if no group has this id

  // Authorization: is the current user actually a member of this group?
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!membership) redirect("/"); // not a member → bounce them out

  // Each membership joins to exactly one user, so `users` is a single object.
  type MemberRow = {
    role: string;
    joined_at: string;
    users: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };

  // Load the member list, joining each row to its user record.
  // The "users ( ... )" part follows the foreign key from group_members.user_id.
  const { data: members } = await supabase
    .from("group_members")
    .select("role, joined_at, users ( id, name, email, image )")
    .eq("group_id", id)
    .order("joined_at")
    .returns<MemberRow[]>();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Dashboard
      </Link>

      <div className="mt-4">
        <span className="inline-block rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {group.course_code}
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {group.name}
        </h1>
        {group.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {group.description}
          </p>
        )}
      </div>

      <section className="mt-8 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Invite code</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-zinc-900 dark:text-zinc-100">
          {group.invite_code}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Share this code so classmates can join from their dashboard.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Members ({members?.length ?? 0})
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {members?.map((m) => (
            <li
              key={m.users.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700"
            >
              {/* Avatar from Google, falling back to a gray circle */}
              {m.users.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.users.image}
                  alt=""
                  className="h-9 w-9 rounded-full"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              )}
              <div className="flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {m.users.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {m.users.email}
                </p>
              </div>
              <span className="text-xs font-medium uppercase text-zinc-400 dark:text-zinc-500">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Placeholders for features we build next. */}
      <section className="mt-10 rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Study sessions (Phase 3) and the availability grid (Phase 4) will live
        here.
      </section>

      {/* Admin-only controls. membership.role comes from the auth check above. */}
      {membership.role === "admin" && (
        <section className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Admin
          </h2>
          <p className="mt-1 mb-3 text-sm text-zinc-500 dark:text-zinc-500">
            Deleting this group removes it for every member. This can&apos;t be
            undone.
          </p>
          <DeleteGroupButton groupId={group.id} action={deleteGroup} />
        </section>
      )}
    </main>
  );
}
