# StudySync

Finding a time that works for six people is the part of a study group that
actually kills it. StudySync is a web app where students make a group for a
course, everyone paints in the hours they are free, and the app works out when
the most people overlap. RSVP "going" to a session and it lands on your Google
Calendar.

There is a public demo at `/demo` that needs no account, so you can see the
heatmap before deciding whether to sign in.

## What it does

Sign in with Google through NextAuth.

Make a group per course, share the invite code, and people join with it.

Schedule sessions with a title, a time and a place or a link, and RSVP going,
maybe or can't go.

Paint your weekly free time on a grid. The app tallies everyone's and shows
where the overlap is deepest, then suggests the best times to meet.

RSVP going and the event is created on your Google Calendar. Back out and it is
removed.

The dashboard shows every group you are in, colour-coded by course.

## Stack

| Layer | What |
|---|---|
| Framework | Next.js, App Router, React Server Components |
| Language | TypeScript |
| Styling | Tailwind |
| Database | Postgres via Supabase |
| Auth | NextAuth (Auth.js v5) with Google OAuth |
| External API | Google Calendar |
| Hosting | Vercel |

## How the overlap is worked out

This is the part worth reading. Each member's free time is stored as weekly
ranges, something like Tuesday 09:30 to 17:00. To turn that into a best meeting
time:

1. Cut the week into 30-minute slots, giving a 7 by 28 grid.
2. For every free block a member has, add one to each slot that block covers.
   Once everyone is counted, `heatmap[day][slot]` is how many people are free
   then.
3. The slots with the highest count are the best times.
4. Each cell is shaded by count over member count, so darker means more people
   free, and slots tied for best are merged back into readable ranges for the
   suggestion.

It runs linearly in the amount of availability data, members times blocks times
slots per block. The code is in [`lib/availability.ts`](lib/availability.ts),
and the grid itself is [`components/Heatmap.tsx`](components/Heatmap.tsx), which
both the real page and the demo render so the two cannot drift apart.

## Notes on the structure

Pages render on the server and read the session with `auth()`. Mutations, so
creating a group, RSVPing, saving availability, are server actions rather than
hand-written API routes.

On security: every table has row-level security on with no policies at all,
which means the public Supabase key cannot read or write anything. All access
goes through the server with the service-role key, and each action re-checks
that the caller is allowed to do what they asked.

Google tokens are kept server-side in the database, never handed to the browser,
and refreshed when they expire.

## Running it locally

You need Node 20 or newer, a Supabase project, and a Google Cloud project with
OAuth credentials and the Calendar API turned on.

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`. `.env.example` says what each value is.

Create the schema by pasting `db/schema.sql` into the Supabase SQL editor and
running it, then run each file in `db/migrations/` in order.

```bash
npm run dev
```

That serves on http://localhost:3000.

For Google sign-in to work locally, add
`http://localhost:3000/api/auth/callback/google` as an authorised redirect URI
on your OAuth client.

## Layout

```
app/
  page.tsx          landing
  demo/             public demo, no account needed
  dashboard/        your groups
  groups/[id]/      group detail, availability grid, new session
  sessions/[id]/    session detail and RSVP
  api/auth/         NextAuth handlers
lib/                supabase client, the availability algorithm, helpers
components/         shared UI, the heatmap, the theme toggle
db/                 schema.sql and migrations
```

## License

MIT. It is a personal learning project.
