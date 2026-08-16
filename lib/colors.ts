// Deterministically map a course code to a colour, so "CS 180" always looks the
// same and two courses in a list are easy to tell apart.
//
// These hues exist to DISTINGUISH courses from each other, which is a different
// job from the green used for availability. They are held at a single low
// saturation and matching lightness so no course shouts louder than another,
// and so none of them competes with the heatmap — which is the only place in
// the app where colour carries a measurement.

const HUES = [212, 265, 158, 32, 348, 190];

function hash(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = (h * 31 + code.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** A stable hue for one course code. */
export function courseHue(code: string): number {
  return HUES[hash(code) % HUES.length];
}

/** Inline styles for a small pill badge. Inline rather than Tailwind classes
 *  because the hue is computed at runtime and Tailwind cannot see it. */
export function courseBadgeStyle(code: string): React.CSSProperties {
  const h = courseHue(code);
  return {
    backgroundColor: `hsl(${h} 42% 92%)`,
    color: `hsl(${h} 55% 28%)`,
  };
}

/** A flat marker colour for rails, dots and avatars. */
export function courseMarkStyle(code: string): React.CSSProperties {
  return { backgroundColor: `hsl(${courseHue(code)} 45% 45%)` };
}
