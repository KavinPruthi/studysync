"use client";

// A Client Component (runs in the browser). We need the browser here because
// confirm() — the native "Are you sure?" popup — only exists on the client.
// Server Components can't use it.

export function DeleteGroupButton({
  groupId,
  action,
}: {
  groupId: string;
  // The server action is passed in as a prop from the (server) page.
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        // If the user clicks "Cancel" in the popup, stop the submit.
        if (
          !confirm(
            "Delete this group? This permanently removes it for everyone and can't be undone."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      {/* The server action reads this hidden field to know which group to delete. */}
      <input type="hidden" name="group_id" value={groupId} />
      <button
        type="submit" className="rounded-full border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
      >
        Delete group
      </button>
    </form>
  );
}
