import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createGroup } from "../actions";

export default async function NewGroupPage() {
  // Guard the page: only signed-in users can create groups.
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  // Shared input styling. Note the dark: variants give inputs a solid dark
  // background and light text so they're easy to see and type into.
  const inputClasses =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-300";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create a study group
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Start a group for one of your courses. You can invite classmates next.
        </p>
      </div>

      {/* Submitting this form runs the createGroup server action. */}
      <form action={createGroup} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description{" "}
            <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
          </span>
          <textarea
            name="description"
            rows={3}
            placeholder="What's this group for?"
            className={inputClasses}
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create group
        </button>
      </form>
    </main>
  );
}
