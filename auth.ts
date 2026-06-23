import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createAdminClient } from "@/lib/supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Ask for calendar-event access on top of basic profile/email.
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
          // access_type=offline + prompt=consent => Google returns a
          // refresh_token, so we can renew the access token later without
          // the user signing in again.
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    // `account` is present only on the initial sign-in and holds the OAuth
    // tokens. `profile` holds the Google profile. We use this moment to save
    // both the user and their tokens to our database.
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        const supabase = createAdminClient();

        const updates: Record<string, unknown> = {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          google_access_token: account.access_token ?? null,
          // expires_at is epoch SECONDS; store it as a real timestamp.
          google_token_expiry: account.expires_at
            ? new Date(account.expires_at * 1000).toISOString()
            : null,
        };
        // Only overwrite the refresh token if Google actually sent one
        // (it might not on a repeat login — don't clobber the saved one).
        if (account.refresh_token) {
          updates.google_refresh_token = account.refresh_token;
        }

        const { data } = await supabase
          .from("users")
          .upsert(updates, { onConflict: "email" })
          .select("id")
          .single();

        if (data) token.userId = data.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
