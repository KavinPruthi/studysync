import Link from "next/link";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4">
        <Link
          href={session?.user ? "/dashboard" : "/"} className="text-[15px] font-medium tracking-tight"
        >
          StudySync
        </Link>

        {session?.user && (
          <nav className="flex items-center gap-6 text-[14px]">
            <Link href="/dashboard" className="text-muted transition-colors hover:text-ink">
              Groups
            </Link>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          {session?.user ? (
            <>
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt="" className="h-7 w-7 rounded-full"
                />
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="text-[14px] text-muted transition-colors hover:text-ink">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/demo" className="text-[14px] text-muted transition-colors hover:text-ink"
            >
              Demo
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
