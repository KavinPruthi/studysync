import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatDateTimeRange } from "@/lib/dates";
import { setRsvp } from "@/app/sessions/actions";

const RSVP_OPTIONS = [
  {
    value: "going",
    label: "Going",
    active: "bg-accent text-bg",
    idle: "border border-line-strong text-muted hover:border-accent hover:text-accent",
  },
  {
    value: "maybe",
    label: "Maybe",
    active: "bg-muted text-bg",
    idle: "border border-line-strong text-muted hover:border-line-strong hover:text-ink",
  },
  {
    value: "no",
    label: "Can't go",
    active: "bg-danger text-bg",
    idle: "border border-line-strong text-muted hover:border-danger hover:text-danger",
  },
] as const;

type RsvpRow = {
  status: string;
  users: { id: string; name: string | null; image: string | null };
};

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const supabase = createAdminClient();

  const { data: sess } = await supabase
    .from("sessions")
    .select("id, title, location_or_link, start_time, end_time, group_id")
    .eq("id", id)
    .maybeSingle();
  if (!sess) notFound();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, course_code")
    .eq("id", sess.group_id)
    .single();

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", sess.group_id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) redirect("/");

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("status, users ( id, name, image )")
    .eq("session_id", id)
    .returns<RsvpRow[]>();

  const myRsvp = rsvps?.find((r) => r.users.id === session.user.id)?.status;
  const byStatus = (s: string) => (rsvps ?? []).filter((r) => r.status === s);
  const isLink = sess.location_or_link?.startsWith("http");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href={`/groups/${sess.group_id}`} className="text-sm text-muted transition-colors hover:text-ink dark:text-muted-2"
      >
        ← {group?.name ?? "Back to group"}
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-sm backdrop-blur dark:border-line dark:bg-ink/60">
        
        <div className="p-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            {sess.title}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-muted">
            <span>🕒</span>
            {formatDateTimeRange(sess.start_time, sess.end_time)}
          </p>
          {sess.location_or_link && (
            <p className="mt-1 flex items-center gap-2 text-muted">
              <span>📍</span>
              {isLink ? (
                <a
                  href={sess.location_or_link}
                  target="_blank"
                  rel="noopener noreferrer" className="text-accent underline"
                >
                  {sess.location_or_link}
                </a>
              ) : (
                sess.location_or_link
              )}
            </p>
          )}

          {/* RSVP */}
          <div className="mt-6">
            <h2 className="text-sm font-medium text-muted">
              Your RSVP
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {RSVP_OPTIONS.map((opt) => {
                const active = myRsvp === opt.value;
                return (
                  <form key={opt.value} action={setRsvp}>
                    <input type="hidden" name="session_id" value={sess.id} />
                    <input type="hidden" name="status" value={opt.value} />
                    <button
                      type="submit"
                      className={
                        "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all " +
                        (active ? opt.active : opt.idle)
                      }
                    >
                      {opt.label}
                    </button>
                  </form>
                );
              })}
            </div>
            {myRsvp === "going" && (
              <p className="mt-2 text-xs text-accent">
                ✓ Added to your Google Calendar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Attendees */}
      <section className="mt-8 flex flex-col gap-6">
        {RSVP_OPTIONS.map((opt) => {
          const people = byStatus(opt.value);
          return (
            <div key={opt.value}>
              <h3 className="text-sm font-semibold text-ink">
                {opt.label}{" "}
                <span className="text-muted-2">
                  ({people.length})
                </span>
              </h3>
              {people.length === 0 ? (
                <p className="mt-1 text-sm text-muted-2">
                  No one yet.
                </p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {people.map((r) => (
                    <li
                      key={r.users.id} className="flex items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pl-1 pr-3 backdrop-blur dark:border-line dark:bg-ink/60"
                    >
                      {r.users.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.users.image}
                          alt="" className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-surface-2 text-xs font-medium text-muted">
                          {(r.users.name ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-muted">
                        {r.users.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
