# StudySync 📅

**Find a time that actually works for everyone.**

StudySync is a full-stack web app where students create study groups for their
courses, schedule sessions, and use a When2meet-style availability overlap tool
to find times that work for the whole group. RSVPing "going" to a session adds
it straight to the student's Google Calendar.

> Built with Next.js (App Router), TypeScript, Tailwind CSS, Supabase
> (PostgreSQL), NextAuth, and the Google Calendar API.

<!-- Add a screenshot or two here once deployed:
![Dashboard](docs/dashboard.png)
![Availability heatmap](docs/heatmap.png)
-->

---

## Features

- **Google sign-in** via NextAuth (OAuth 2.0).
- **Study groups** — create a group per course, share an invite code, join with one.
- **Sessions & RSVPs** — schedule sessions (title, time, location/link) and RSVP going / maybe / can't go.
- **Availability heatmap** — each member paints their weekly free time on a grid; the app computes and visualizes when the most people overlap, and suggests the best meeting times.
- **Google Calendar sync** — RSVPing "going" creates the event on your calendar; backing out removes it.
- **Dashboard** — all your groups at a glance, each color-coded by course.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React Server Components |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| Auth | NextAuth (Auth.js v5) + Google OAuth |
| External API | Google Calendar API |
| Hosting | Vercel |

## The availability overlap algorithm

The core feature. Each member's free time is stored as weekly time **ranges**
(e.g. `Tue 09:30–17:00`). To find the best meeting time:

1. **Discretize** the week into 30-minute slots (a 7 × 28 grid).
2. **Tally:** for every member's every free block, add `+1` to each slot that
   block covers. After all members, `heatmap[day][slot]` holds how many people
   are free in that slot.
3. **Find the peak:** the slot(s) with the highest count are the best times.
4. **Render:** each cell's color intensity = `count / memberCount` (darker =
   more people free), and tied-for-best slots are merged back into readable
   ranges for a "best times" suggestion.

It runs in **O(members × blocks × slots-per-block)** — linear in the amount of
availability data. See [`lib/availability.ts`](lib/availability.ts).

## Architecture highlights

- **Server Components + Server Actions** — pages render on the server and read
  the session with `auth()`; mutations (create group, RSVP, save availability)
  are server actions, no hand-written API endpoints.
- **Security** — every table has Row Level Security enabled with no policies, so
  the public Supabase key can't touch the database; all access goes through the
  server using the service-role key, and every action re-checks authorization.
- **Google tokens** are stored server-side (in the DB, never exposed to the
  browser) and refreshed automatically when they expire.

## Local development

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A Google Cloud project with OAuth credentials + the Calendar API enabled

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
#    then fill in the values (see .env.example for what each one is)

# 3. Create the database schema
#    Paste db/schema.sql into the Supabase SQL Editor and run it,
#    then run each file in db/migrations/ in order.

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000.

For Google sign-in locally, add this Authorized redirect URI to your OAuth
client: `http://localhost:3000/api/auth/callback/google`.

### Project layout

```
app/                     # routes (App Router)
  page.tsx               # landing
  dashboard/             # your groups
  groups/[id]/           # group detail, availability grid, new session
  sessions/[id]/         # session detail + RSVP
  api/auth/              # NextAuth handlers
lib/                     # supabase client, availability algorithm, helpers
db/                      # schema.sql + migrations
components/              # shared UI (header)
```

## License

MIT — personal learning project.
