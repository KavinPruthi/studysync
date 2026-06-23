"use server";

import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getValidAccessToken,
  addCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

export async function createSession(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const groupId = String(formData.get("group_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location_or_link") ?? "").trim();
  const startRaw = String(formData.get("start_time") ?? "");
  const endRaw = String(formData.get("end_time") ?? "");

  if (!groupId || !title || !startRaw || !endRaw) {
    throw new Error("Title, start time, and end time are required.");
  }

  // datetime-local inputs give a string like "2026-06-25T15:00".
  // new Date() interprets it, and we store the standard ISO form.
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date/time.");
  }
  if (end <= start) {
    throw new Error("End time must be after the start time.");
  }

  const supabase = createAdminClient();

  // Authorization: only a member of the group may add a session to it.
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) {
    throw new Error("You are not a member of this group.");
  }

  const { data: created, error } = await supabase
    .from("sessions")
    .insert({
      group_id: groupId,
      title,
      location_or_link: location || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not create the session.");
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/sessions/${created.id}`);
}

export async function setRsvp(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const sessionId = String(formData.get("session_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!sessionId || !["going", "maybe", "no"].includes(status)) {
    throw new Error("Invalid RSVP.");
  }

  const supabase = createAdminClient();

  // Find which group this session belongs to...
  const { data: sess } = await supabase
    .from("sessions")
    .select("group_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!sess) {
    throw new Error("Session not found.");
  }

  // ...so we can confirm the user is a member of that group before RSVPing.
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", sess.group_id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!membership) {
    throw new Error("You are not a member of this group.");
  }

  // upsert => insert the RSVP, or update it if this user already RSVP'd.
  // onConflict matches the composite primary key (session_id, user_id).
  const { error } = await supabase.from("rsvps").upsert(
    {
      session_id: sessionId,
      user_id: session.user.id,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id" }
  );
  if (error) {
    throw new Error(error.message);
  }

  // ── Google Calendar sync (best-effort: never block the RSVP) ──────────
  try {
    const accessToken = await getValidAccessToken(session.user.id);
    if (accessToken) {
      // Did this user already have a calendar event for this session?
      const { data: rsvpRow } = await supabase
        .from("rsvps")
        .select("google_event_id")
        .eq("session_id", sessionId)
        .eq("user_id", session.user.id)
        .maybeSingle();
      const existingEventId = rsvpRow?.google_event_id ?? null;

      if (status === "going" && !existingEventId) {
        // Add the session to their calendar.
        const { data: detail } = await supabase
          .from("sessions")
          .select("title, location_or_link, start_time, end_time")
          .eq("id", sessionId)
          .single();
        if (detail) {
          const eventId = await addCalendarEvent(accessToken, {
            summary: detail.title,
            location: detail.location_or_link,
            description: "Study session via StudySync",
            startISO: detail.start_time,
            endISO: detail.end_time,
          });
          if (eventId) {
            await supabase
              .from("rsvps")
              .update({ google_event_id: eventId })
              .eq("session_id", sessionId)
              .eq("user_id", session.user.id);
          }
        }
      } else if (status !== "going" && existingEventId) {
        // They backed out — remove the calendar event we created.
        await deleteCalendarEvent(accessToken, existingEventId);
        await supabase
          .from("rsvps")
          .update({ google_event_id: null })
          .eq("session_id", sessionId)
          .eq("user_id", session.user.id);
      }
    }
  } catch (e) {
    console.error("Calendar sync failed:", e);
  }

  // Re-render the session page so the new RSVP shows immediately.
  revalidatePath(`/sessions/${sessionId}`);
}

