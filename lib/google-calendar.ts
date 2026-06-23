import { createAdminClient } from "@/lib/supabase";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Returns a usable access token for the user, refreshing it first if it's
// expired (or about to be). Returns null if the user hasn't connected Google
// Calendar (no tokens stored).
export async function getValidAccessToken(
  userId: string
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("google_access_token, google_refresh_token, google_token_expiry")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.google_access_token) return null;

  const expiry = user.google_token_expiry
    ? new Date(user.google_token_expiry).getTime()
    : 0;

  // Still valid for at least another minute? Use it as-is.
  if (Date.now() < expiry - 60_000) {
    return user.google_access_token;
  }

  // Expired and no refresh token — best we can do is try the old one.
  if (!user.google_refresh_token) return user.google_access_token;

  // Exchange the refresh token for a fresh access token.
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: user.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  const newAccessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) ?? 3600; // seconds
  const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

  // Persist the refreshed token so we don't refresh again next time.
  await supabase
    .from("users")
    .update({
      google_access_token: newAccessToken,
      google_token_expiry: newExpiry,
    })
    .eq("id", userId);

  return newAccessToken;
}

// Creates an event on the user's primary calendar. Returns the new event's id
// (so we can delete it later), or null on failure.
export async function addCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    location?: string | null;
    description?: string;
    startISO: string;
    endISO: string;
  }
): Promise<string | null> {
  const res = await fetch(CALENDAR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      location: event.location ?? undefined,
      description: event.description,
      start: { dateTime: event.startISO },
      end: { dateTime: event.endISO },
    }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  return (data.id as string) ?? null;
}

// Deletes an event from the user's primary calendar (best-effort).
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  await fetch(`${CALENDAR_URL}/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
