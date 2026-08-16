import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { deleteGroup } from "../actions";
import { DeleteGroupButton } from "./DeleteGroupButton";
import { formatDateTimeRange } from "@/lib/dates";
import { courseBadgeStyle, courseMarkStyle } from "@/lib/colors";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const supabase = createAdminClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, course_code, description, created_at, invite_code")
    .eq("id", id)
    .single();
  if (!group) notFound();

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) redirect("/");

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

  const { data: members } = await supabase
    .from("group_members")
    .select("role, joined_at, users ( id, name, email, image )")
    .eq("group_id", id)
    .order("joined_at")
    .returns<MemberRow[]>();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, location_or_link, start_time, end_time")
    .eq("group_id", id)
    .gte("end_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/dashboard" className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Dashboard
      </Link>

      {/* Group header card */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-sm backdrop-blur">
        <div className="h-1 w-full" style={courseMarkStyle(group.course_code)} />
        <div className="p-6">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={courseBadgeStyle(
              group.course_code
            )}
          >
            {group.course_code}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
            {group.name}
          </h1>
          {group.description && (
            <p className="mt-2 text-muted">
              {group.description}
            </p>
          )}

          {/* Invite code */}
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-2/80 px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Invite code
            </span>
            <span className="font-mono text-lg font-bold tracking-widest text-ink">
              {group.invite_code}
            </span>
            <span className="text-xs text-muted-2">
              Share so classmates can join
            </span>
          </div>
        </div>
      </div>

      {/* Find a time */}
      <Link
        href={`/groups/${id}/availability`} className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-surface/70 p-5 shadow-sm backdrop-blur transition-all hover:shadow-md"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2">
          🗓️
        </div>
        <div>
          <p className="font-semibold text-ink">
            Find a time that works
          </p>
          <p className="text-sm text-muted">
            Set your availability and see when everyone overlaps.
          </p>
        </div>
        <span className="ml-auto text-muted-2">→</span>
      </Link>

      {/* Sessions */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            Upcoming sessions
          </h2>
          <Link
            href={`/groups/${id}/sessions/new`} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-bg transition-all"
          >
            + New session
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            No upcoming sessions yet.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sessions/${s.id}`} className="flex items-center gap-4 rounded-xl border border-line bg-surface/70 px-4 py-3 shadow-sm backdrop-blur transition-all hover:shadow-md"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent">
                    📚
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      {s.title}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTimeRange(s.start_time, s.end_time)}
                    </p>
                    {s.location_or_link && (
                      <p className="truncate text-xs text-muted-2">
                        {s.location_or_link}
                      </p>
                    )}
                  </div>
                  <span className="ml-auto text-muted-2">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Members */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-ink">
          Members ({members?.length ?? 0})
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          {members?.map((m) => (
            <li
              key={m.users.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3 backdrop-blur"
            >
              {m.users.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.users.image}
                  alt="" className="h-9 w-9 rounded-full"
                />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-sm font-medium text-muted">
                  {(m.users.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">
                  {m.users.name}
                </p>
                <p className="truncate text-sm text-muted">
                  {m.users.email}
                </p>
              </div>
              {m.role === "admin" && (
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
                  admin
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Admin-only controls */}
      {membership.role === "admin" && (
        <section className="mt-10 rounded-2xl border border-danger/40 bg-danger/10 p-5">
          <h2 className="text-sm font-semibold text-danger">
            Danger zone
          </h2>
          <p className="mt-1 mb-3 text-sm text-danger">
            Deleting this group removes it for every member. This can&apos;t be
            undone.
          </p>
          <DeleteGroupButton groupId={group.id} action={deleteGroup} />
        </section>
      )}
    </main>
  );
}
