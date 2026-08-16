// components/Heatmap.tsx
// The overlap grid, in one place.
//
// It was previously written out twice, once on the real availability page and
// once on the demo, which is exactly how two copies of a thing drift apart.
// Both now render this.
//
// Green intensity is the only colour in the app and it encodes one thing: how
// many people are free. A cell is never green for decoration.

import { DAY_LABELS, SLOTS_PER_DAY, slotLabel } from "@/lib/availability";
import type { Heatmap as HeatmapData } from "@/lib/availability";

export function Heatmap({
  heatmap,
  totalMembers,
  maxOverlap,
  compact = false,
}: {
  heatmap: HeatmapData;
  totalMembers: number;
  maxOverlap: number;
  /** Smaller cells and no hour labels, for the landing-page preview. */
  compact?: boolean;
}) {
  const cell = compact ? "h-3 w-6" : "h-5 w-10";

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className={compact ? "w-10" : "w-16"}></th>
            {DAY_LABELS.map((d) => (
              <th
                key={d} className="px-1 pb-2 text-[11px] font-medium text-muted-2"
              >
                {compact ? d[0] : d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SLOTS_PER_DAY }).map((_, slot) => (
            <tr key={slot}>
              <td className="nums pr-2 text-right align-top text-[10px] leading-[1.2] text-muted-2">
                {slot % (compact ? 4 : 2) === 0 ? slotLabel(slot) : ""}
              </td>
              {DAY_LABELS.map((dayLabel, day) => {
                const count = heatmap[day][slot];
                const ratio = totalMembers > 0 ? count / totalMembers : 0;
                const isBest = maxOverlap > 0 && count === maxOverlap;
                return (
                  <td key={day} className="p-0">
                    <div
                      title={`${count}/${totalMembers} free · ${dayLabel} ${slotLabel(slot)}`}
                      className={`${cell} border border-line ${
                        isBest ? "ring-2 ring-inset ring-accent" : ""
                      }`}
                      style={{
                        // Empty cells stay the surface colour rather than a pale
                        // green, so "nobody is free" reads as absence.
                        backgroundColor:
                          count === 0
                            ? undefined
                            : `color-mix(in srgb, var(--accent) ${Math.round(
                                18 + 82 * ratio,
                              )}%, transparent)`,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Peak overlap and the runs of slots that hit it. */
export function bestTimesFrom(heatmap: HeatmapData) {
  let maxOverlap = 0;
  for (const day of heatmap) {
    for (const c of day) if (c > maxOverlap) maxOverlap = c;
  }
  return maxOverlap;
}
