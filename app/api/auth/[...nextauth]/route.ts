// This wires NextAuth's request handlers into Next.js's App Router.
// Every request to /api/auth/* (e.g. /api/auth/callback/google — the exact
// redirect URI we registered in Google Cloud) is handled by these.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
