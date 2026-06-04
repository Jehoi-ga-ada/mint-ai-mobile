/** Pure geometry for SVG charts — kept separate so it can be unit-tested. */

export interface DonutArc {
  dash: number; // length of the colored arc
  gap: number; // remaining circumference
  offset: number; // strokeDashoffset to position this arc after the previous
}

/** Convert segment values into stroke-dash arcs around a circle.
 * `separator` carves that many circumference units out of each slice (half per
 * side) so the background shows through between adjacent slices — keeps
 * neighbors readable even when their colors are close. Skipped when only one
 * slice is visible, since a lone full ring would just show a notch. */
export function donutArcs(
  values: number[],
  circumference: number,
  separator = 0,
): DonutArc[] {
  const total = values.reduce((s, v) => s + Math.max(v, 0), 0);
  const visibleCount = values.filter((v) => v > 0).length;
  const inset = visibleCount > 1 ? separator : 0;
  let acc = 0;
  return values.map((v) => {
    const frac = total > 0 ? Math.max(v, 0) / total : 0;
    const dash = Math.max(frac * circumference - inset, 0);
    const offset = -(acc * circumference + (dash > 0 ? inset / 2 : 0));
    acc += frac;
    return { dash, gap: circumference - dash, offset };
  });
}

export interface Point {
  x: number;
  y: number;
}

/** Map a series of values to (x,y) points within a width×height box (y inverted). */
export function linePoints(
  values: number[],
  width: number,
  height: number,
  pad = 0,
): Point[] {
  const n = values.length;
  if (n === 0) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  return values.map((v, i) => ({
    x: pad + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    y: pad + innerH - ((v - min) / span) * innerH,
  }));
}

export function pointsToString(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}
