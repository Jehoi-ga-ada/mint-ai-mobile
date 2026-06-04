import { donutArcs, linePoints, pointsToString } from '../src/components/charts/geometry';

describe('donutArcs', () => {
  it('splits the circumference proportionally and chains offsets', () => {
    const arcs = donutArcs([25, 75], 100);

    expect(arcs[0].dash).toBeCloseTo(25);
    expect(arcs[0].gap).toBeCloseTo(75);
    expect(arcs[0].offset).toBe(-0); // first arc starts at 0
    expect(arcs[1].dash).toBeCloseTo(75);
    expect(arcs[1].offset).toBeCloseTo(-25); // after the first 25%
  });

  it('handles all-zero values without dividing by zero', () => {
    const arcs = donutArcs([0, 0], 100);
    expect(arcs.every((a) => a.dash === 0)).toBe(true);
  });

  it('shrinks each arc by the separator and insets its start by half', () => {
    const arcs = donutArcs([25, 75], 100, 4);

    expect(arcs[0].dash).toBeCloseTo(21); // 25 - 4
    expect(arcs[0].offset).toBeCloseTo(-2); // inset by separator / 2
    expect(arcs[1].dash).toBeCloseTo(71); // 75 - 4
    expect(arcs[1].offset).toBeCloseTo(-27); // -25 - 2
  });

  it('skips the separator when only one segment is visible', () => {
    const arcs = donutArcs([100, 0], 100, 4);

    expect(arcs[0].dash).toBeCloseTo(100); // full ring, no notch
    expect(arcs[0].offset).toBeCloseTo(-0);
  });

  it('clamps slices smaller than the separator to zero instead of negative', () => {
    const arcs = donutArcs([1, 99], 100, 4);

    expect(arcs[0].dash).toBe(0);
    expect(arcs[1].dash).toBeCloseTo(95);
  });
});

describe('linePoints', () => {
  it('spreads points across width and inverts y (higher value = smaller y)', () => {
    const pts = linePoints([0, 10], 100, 100, 0);
    expect(pts[0]).toEqual({ x: 0, y: 100 });
    expect(pts[1]).toEqual({ x: 100, y: 0 });
  });

  it('centers a single point', () => {
    const pts = linePoints([5], 100, 100, 0);
    expect(pts[0].x).toBe(50);
  });

  it('keeps a flat series mid-box rather than dividing by zero', () => {
    const pts = linePoints([5, 5, 5], 100, 100, 0);
    expect(pts.every((p) => p.y === 100)).toBe(true); // span defaults to 1
  });

  it('serializes points for SVG', () => {
    expect(pointsToString([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe('1,2 3,4');
  });
});
