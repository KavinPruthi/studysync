"use server";

// "use server" at the top marks every export here as a Server Action —
// a function the browser can call, but whose code only ever runs on the server.

import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createGroup(formData: FormData) {
  // 1. Who's asking? Must be a signed-in user.
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to create a group.");
  }

  // 2. Pull the submitted form fields out of FormData.
  const name = String(formData.get("name") ?? "").trim();
  const courseCode = String(formData.get("course_code") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  // 3. Basic validation (never trust the browser to enforce it).
  if (!name || !courseCode) {
    throw new Error("Group name and course code are required.");
  }

  const supabase = createAdminClient();

  // 4. Insert the group, owned by the current user.
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      course_code: courseCode,
      description: description || null, // store NULL, not "", when empty
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (groupError || !group) {
    throw new Error(groupError?.message ?? "Could not create the group.");
  }

  // 5. The creator should also be a member — and an admin of their own group.
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: session.user.id,
    role: "admin",
  });

  if (memberError) {
    throw new Error(memberError.message);
  }

  // 6. Send the user to their new group's page. redirect() ends the action.
  redirect(`/groups/${group.id}`);
}

export async function deleteGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  const groupId = String(formData.get("group_id") ?? "");
  if (!groupId) {
    throw new Error("Missing group id.");
  }

  const supabase = createAdminClient();

  // Authorization: the current user must be an ADMIN of this group.
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (membership?.role !== "admin") {
    throw new Error("Only a group admin can delete this group.");
  }

  // Delete the group. Because our foreign keys use ON DELETE CASCADE, this
  // automatically removes the group's members, sessions, rsvps, and
  // availability too — no orphaned rows left behind.
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) {
    throw new Error(error.message);
  }

  // Tell Next.js the dashboard data changed, then send the user there.
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function joinGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in.");
  }

  // Normalize the code: trim spaces and uppercase, since codes are uppercase.
  const code = String(formData.get("invite_code") ?? "").trim().toUpperCase();
  if (!code) {
    redirect("/dashboard?error=" + encodeURIComponent("Enter an invite code."));
  }

  const supabase = createAdminClient();

  // Find the group with this code.
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", code)
    .maybeSingle();

  if (!group) {
    redirect(
      "/dashboard?error=" + encodeURIComponent(`No group found with code "${code}".`)
    );
  }

  // Are they already a member? If so, don't insert again — just go there.
  const { data: existing } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", group.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!existing) {
    // New member joins with the default role of 'member'.
    const { error } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: session.user.id,
      role: "member",
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}
