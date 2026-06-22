import { auth, signIn, signOut } from "@/auth";

// This is a Server Component, so we can `await auth()` right here on the server
// to find out whether the visitor is logged in — no loading spinner needed.
export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
          StudySync
        </h1>
        <p className="max-w-md text-lg text-zinc-600">
          Create study groups for your courses, schedule sessions, and find
          times that actually work for everyone.
        </p>
      </div>

      {session?.user ? (
        // ── Logged in: greet them and offer sign-out ──────────────
        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-700">
            Signed in as{" "}
            <span className="font-medium">{session.user.email}</span>
          </p>
          {/* A <form> whose action is a Server Action ("use server").
              Clicking the button runs signOut() on the server. */}
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button className="rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100">
              Sign out
            </button>
          </form>
        </div>
      ) : (
        // ── Logged out: the real Google sign-in button ────────────
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button className="rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700">
            Sign in with Google
          </button>
        </form>
      )}
    </main>
  );
}
