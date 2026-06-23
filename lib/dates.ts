// Formats a session's start/end into a friendly string like
// "Wed, Jun 25, 3:00 PM – 5:00 PM".
//
// NOTE: this runs on the server, so it uses the server's timezone. In local
// dev that's your machine's timezone (correct for you). Doing timezones
// properly for production users is a Phase 6 polish item.
export function formatDateTimeRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);

  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };

  const startDate = start.toLocaleDateString(undefined, dateOpts);
  const startTime = start.toLocaleTimeString(undefined, timeOpts);
  const endTime = end.toLocaleTimeString(undefined, timeOpts);

  return `${startDate}, ${startTime} – ${endTime}`;
}
