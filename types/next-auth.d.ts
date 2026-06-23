import { DefaultSession } from "next-auth";

// "Module augmentation": we're adding fields to types that another library
// (next-auth) already defined, instead of replacing them. TypeScript merges
// our declarations with theirs.

declare module "next-auth" {
  // Add `id` to the user object on the session.
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]; // keep the built-in name/email/image too
  }
}

declare module "next-auth/jwt" {
  // Add `userId` to the token (what we stored in the jwt callback).
  interface JWT {
    userId?: string;
  }
}
