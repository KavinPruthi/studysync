import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// NextAuth() is configured once here and exports four helpers we use elsewhere:
//   handlers → the GET/POST API routes that handle the OAuth round-trip
//   signIn   → start a login (we call this from a button/server action)
//   signOut  → end a session
//   auth     → read the current session (works in server components, etc.)
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // The Google provider knows how to talk to Google's OAuth servers.
    // It reads our app's identity from these two env vars.
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // Default session strategy is "jwt": the session is stored in an encrypted
  // cookie (signed with AUTH_SECRET), not in our database. Simple and fast —
  // we'll sync the user into our own `users` table in the next step.
});
