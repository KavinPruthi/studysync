import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createAdminClient } from "@/lib/supabase";

// NextAuth() is configured once here and exports four helpers we use elsewhere:
//   handlers → the GET/POST API routes that handle the OAuth round-trip
//   signIn   → start a login (we call this from a button/server action)
//   signOut  → end a session
//   auth     → read the current session (works in server components, etc.)
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // The Google provider knows how to talk to Google's OAuth servers.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  // Callbacks are functions NextAuth runs at specific moments. We use two:
  callbacks: {
    // jwt() runs whenever the session token is created or updated.
    // `profile` is ONLY present on the initial sign-in (the moment Google
    // hands us the user's details) — the perfect time to save them to our DB.
    async jwt({ token, profile }) {
      if (profile?.email) {
        const supabase = createAdminClient();

        // upsert = "insert, or update if it already exists."
        // onConflict: "email" means: if a row with this email already exists,
        // update it instead of erroring (email is UNIQUE in our schema).
        const { data, error } = await supabase
          .from("users")
          .upsert(
            {
              email: profile.email,
              name: profile.name,
              image: profile.picture,
            },
            { onConflict: "email" }
          )
          .select("id") // ask the DB to return the row's id
          .single(); // we expect exactly one row back

        // Stash our database user id inside the token so every future
        // request carries it without another DB lookup.
        if (!error && data) {
          token.userId = data.id;
        }
      }
      return token;
    },

    // session() shapes what your app sees when it calls auth().
    // We copy the DB id from the token onto session.user.id.
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
