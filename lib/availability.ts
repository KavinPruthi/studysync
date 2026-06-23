// Shared config + helpers for the weekly availability grid.
// Pure functions and constants only — safe to import in client OR server code.

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// The grid covers this window of each day, split into 30-minute slots.
export const START_HOUR = 8; // 8:00 AM
export const END_HOUR = 22; // 10:00 PM
export const SLOT_MINUTES = 30;

// Number of slots per day, e.g. (22 - 8) * 60 / 30 = 28.
export const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

// Slot index (0..SLOTS_PER_DAY) -> "HH:MM:SS" Postgres time string.
export function slotToTime(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:00`;
}

// "HH:MM:SS" -> slot index. The inverse of slotToTime().
export function timeToSlot(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h * 60 + m - START_HOUR * 60) / SLOT_MINUTES;
}

// A friendly label for a slot's start, e.g. "8:00 AM", "1:30 PM".
export function slotLabel(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * SLOT_MINUTES;
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Merge a day's selected slot indices into contiguous [start, end) runs.
// Example: [2,3,4,7,8] -> [{start:2,end:5},{start:7,end:9}]
// `end` is exclusive — it's the slot just AFTER the last selected one, which
// maps cleanly to an end time (e.g. slots 2,3,4 = 9:00–10:30).
export function mergeSlots(slots: number[]): { start: number; end: number }[] {
  if (slots.length === 0) return [];

  const sorted = [...slots].sort((a, b) => a - b);
  const ranges: { start: number; end: number }[] = [];

  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i]; // still part of the current run
    } else {
      ranges.push({ start, end: prev + 1 }); // run ended; record it
      start = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push({ start, end: prev + 1 }); // record the final run
  return ranges;
}

// ── The overlap algorithm (the heart of the feature) ──────────────────────
// heatmap[day][slot] = how many members are free during that 30-minute slot.
export type Heatmap = number[][];

// Given EVERY member's availability blocks for a group, build the heatmap.
export function computeOverlap(
  rows: { day_of_week: number; start_time: string; end_time: string }[]
): Heatmap {
  // 1. Start with a 7 x SLOTS_PER_DAY grid full of zeros.
  const heatmap: Heatmap = DAY_LABELS.map(() =>
    new Array<number>(SLOTS_PER_DAY).fill(0)
  );

  // 2. For each person's free block, add 1 to every slot the block covers.
  //    Each member's saved blocks never overlap each other, so nobody is
  //    double-counted within a single slot.
  for (const row of rows) {
    const startSlot = timeToSlot(row.start_time);
    const endSlot = timeToSlot(row.end_time); // exclusive
    for (let slot = startSlot; slot < endSlot; slot++) {
      heatmap[row.day_of_week][slot] += 1;
    }
  }

  // 3. Done — each cell now holds its overlap count.
  return heatmap;
}

