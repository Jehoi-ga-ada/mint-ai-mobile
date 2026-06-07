import { useEffect, useState } from 'react';

import type { Segment } from './segments';

/** Shared tap-to-inspect selection for a donut and its legend: tapping a slice
 * or legend row selects it everywhere, tapping it again (or the donut hole)
 * clears, and fresh data (range change, refresh) resets the selection. */
export function useSliceSelection(segments: Segment[]) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Callers rebuild the segments array every render, so reset on a stable
  // fingerprint of the data — not array identity, which would clear the
  // selection immediately after every tap.
  const fingerprint = segments.map((s) => `${s.key}:${s.value}`).join('|');
  useEffect(() => {
    setSelectedKey(null);
  }, [fingerprint]);

  const toggle = (key: string | null) =>
    setSelectedKey((current) => (key === null || current === key ? null : key));

  return { selectedKey, toggle };
}
