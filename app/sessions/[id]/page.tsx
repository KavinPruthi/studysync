import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatDateTimeRange } from "@/lib/dates";
import { setRsvp } from "@/app/sessions/actions";

// The three RSVP choices, with the label shown on each button.
const RSVP_OPTIONS = [
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "Can't go" },
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

  // Load the session (no join — keeps the types simple).
  const { data: sess } = await supabase
    .from("sessions")
    .select("id, title, location_or_link, start_time, end_time, group_id")
    .eq("id", id)
    .maybeSingle();
  if (!sess) notFound();

  // Load its group, and use it to authorize the viewer.
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
  if (!membership) redirect("/"); // not in the group → not allowed to see it

  // All RSVPs for this session, joined to each responder's user record.
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("status, users ( id, name, image )")
    .eq("session_id", id)
    .returns<RsvpRow[]>();

  // The current user's own RSVP (so we can highlight their choice).
  const myRsvp = rsvps?.find((r) => r.users.id === session.user.id)?.status;

  // Split responders into buckets for display.
  const byStatus = (s: string) => (rsvps ?? []).filter((r) => r.status === s);

  const isLink = sess.location_or_link?.startsWith("http");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link
        href={`/groups/${sess.group_id}`}
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← {group?.name ?? "Back to group"}
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {sess.title}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {formatDateTimeRange(sess.start_time, sess.end_time)}
      </p>
      {sess.location_or_link && (
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {isLink ? (
            <a
              href={sess.location_or_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline dark:text-blue-400"
            >
              {sess.location_or_link}
            </a>
          ) : (
            sess.location_or_link
          )}
        </p>
      )}

      {/* RSVP buttons. Each is a tiny form posting to the setRsvp action. */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Your RSVP
        </h2>
        <div className="mt-2 flex gap-2">
          {RSVP_OPTIONS.map((opt) => {
            const active = myRsvp === opt.value;
            return (
              <form key={opt.value} action={setRsvp}>
                <input type="hidden" name="session_id" value={sess.id} />
                <input type="hidden" name="status" value={opt.value} />
                <button
                  type="submit"
                  className={
                    "rounded-full px-5 py-2.5 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800")
                  }
                >
                  {opt.label}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      {/* Attendee lists, one bucket per status. */}
      <section className="mt-10 flex flex-col gap-6">
        {RSVP_OPTIONS.map((opt) => {
          const people = byStatus(opt.value);
          return (
            <div key={opt.value}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {opt.label} ({people.length})
              </h3>
              {people.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  No one yet.
                </p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-3">
                  {people.map((r) => (
                    <li
                      key={r.users.id}
                      className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 dark:border-zinc-700"
                    >
                      {r.users.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.users.image}
                          alt=""
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      )}
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
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
