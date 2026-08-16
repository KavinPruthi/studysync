// lib/demo-data.ts
// A fixed five-person group, used by the public /demo page and by the preview
// on the landing page.
//
// Shared on purpose: the landing page shows the REAL heatmap computed by the
// real function, not a picture of one. If computeOverlap ever changes, the
// marketing page changes with it and cannot drift into advertising something
// the app no longer does.
//
// Times are derived from slot indices via slotToTime() rather than hardcoded
// strings, so this stays correct if the grid's hours or slot size change.

import { slotToTime } from "./availability";

export interface DemoMember {
  name: string;
  blocks: { day: number; from: number; to: number }[];
}

export const DEMO_MEMBERS: DemoMember[] = [
  {
    name: "Aisha",
    blocks: [
      { day: 1, from: 18, to: 24 },
      { day: 2, from: 4, to: 10 },
      { day: 3, from: 18, to: 26 },
      { day: 4, from: 6, to: 12 },
    ],
  },
  {
    name: "Ben",
    blocks: [
      { day: 1, from: 20, to: 26 },
      { day: 3, from: 20, to: 26 },
      { day: 5, from: 2, to: 8 },
      { day: 6, from: 8, to: 16 },
    ],
  },
  {
    name: "Chloe",
    blocks: [
      { day: 1, from: 19, to: 25 },
      { day: 2, from: 2, to: 8 },
      { day: 3, from: 19, to: 25 },
      { day: 6, from: 10, to: 18 },
    ],
  },
  {
    name: "Diego",
    blocks: [
      { day: 1, from: 20, to: 24 },
      { day: 3, from: 21, to: 26 },
      { day: 4, from: 14, to: 20 },
      { day: 6, from: 12, to: 20 },
    ],
  },
  {
    name: "Priya",
    blocks: [
      { day: 1, from: 16, to: 24 },
      { day: 3, from: 20, to: 24 },
      { day: 5, from: 4, to: 10 },
      { day: 6, from: 6, to: 14 },
    ],
  },
];

export const DEMO_MEMBER_COUNT = DEMO_MEMBERS.length;

/** The same row shape the database returns, so computeOverlap cannot tell the
 *  difference between this and a real group. */
export const DEMO_ROWS = DEMO_MEMBERS.flatMap((m) =>
  m.blocks.map((b) => ({
    day_of_week: b.day,
    start_time: slotToTime(b.from),
    end_time: slotToTime(b.to),
  })),
);
