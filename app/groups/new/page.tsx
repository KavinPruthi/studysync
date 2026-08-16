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
    "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-muted-2 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        href="/dashboard" className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Dashboard
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface/70 shadow-sm backdrop-blur">
        
        <div className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Create a study group
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Start a group for one of your courses. You can invite classmates
            next.
          </p>

          <form action={createGroup} className="mt-6 flex flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted">
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
              <span className="text-sm font-medium text-muted">
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
              <span className="text-sm font-medium text-muted">
                Description{" "}
                <span className="text-muted-2">
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
              type="submit" className="mt-1 w-full rounded-xl bg-ink px-6 py-3 font-semibold text-bg transition-colors hover:shadow-xl"
            >
              Create group
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
