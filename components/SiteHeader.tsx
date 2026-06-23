import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/70 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href={session?.user ? "/dashboard" : "/"}
          className="flex items-center gap-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white shadow-md shadow-indigo-500/30">
            S
          </span>
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            StudySync
          </span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-800"
              />
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
