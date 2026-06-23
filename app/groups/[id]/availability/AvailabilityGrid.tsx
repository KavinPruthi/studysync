"use client";

import { useState } from "react";
import { DAY_LABELS, SLOTS_PER_DAY, slotLabel } from "@/lib/availability";

export function AvailabilityGrid({
  groupId,
  initialSelected,
  action,
}: {
  groupId: string;
  initialSelected: string[];
  action: (formData: FormData) => Promise<void>;
}) {
  // The set of selected "day-slot" cells, e.g. {"1-4", "1-5"}.
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected)
  );
  // While dragging: true = we're turning cells ON, false = turning them OFF,
  // null = not currently dragging.
  const [painting, setPainting] = useState<boolean | null>(null);

  const keyFor = (day: number, slot: number) => `${day}-${slot}`;

  function paint(key: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  // Mouse down on a cell: start a drag. Whether we add or remove depends on
  // the cell we started on (if it was off, we're adding; if on, removing).
  function handleDown(key: string) {
    const turningOn = !selected.has(key);
    setPainting(turningOn);
    paint(key, turningOn);
  }

  // Entering a cell while dragging: apply the same on/off as the drag started.
  function handleEnter(key: string) {
    if (painting !== null) paint(key, painting);
  }

  const stop = () => setPainting(null);

  return (
    <form action={action}>
      {/* Hidden fields carry the data to the server action on submit. */}
      <input type="hidden" name="group_id" value={groupId} />
      <input
        type="hidden"
        name="slots"
        value={JSON.stringify([...selected])}
      />

      {/* select-none stops the browser from highlighting text while dragging. */}
      <div
        className="select-none overflow-x-auto"
        onMouseUp={stop}
        onMouseLeave={stop}
      >
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-16"></th>
              {DAY_LABELS.map((d) => (
                <th
                  key={d}
                  className="px-1 pb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => (
              <tr key={slot}>
                {/* Show the time only on the hour (every 2nd 30-min slot). */}
                <td className="pr-2 text-right align-top text-[10px] leading-5 text-zinc-400">
                  {slot % 2 === 0 ? slotLabel(slot) : ""}
                </td>
                {DAY_LABELS.map((_, day) => {
                  const key = keyFor(day, slot);
                  const on = selected.has(key);
                  return (
                    <td key={day} className="p-0">
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleDown(key);
                        }}
                        onMouseEnter={() => handleEnter(key)}
                        className={
                          "h-5 w-10 cursor-pointer border border-zinc-200 dark:border-zinc-700 " +
                          (on
                            ? "bg-green-500"
                            : "bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800")
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="submit"
        className="mt-4 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Save my availability
      </button>
    </form>
  );
}
