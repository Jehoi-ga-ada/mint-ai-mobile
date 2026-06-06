import { useEffect, useRef, useState } from 'react';

const TICK_MS = 40;
const MIN_CHARS_PER_TICK = 2;
const CATCH_UP_DIVISOR = 12;

/** Characters to reveal this tick: a smooth ~50 chars/sec tail, but
 * proportionally faster the further behind we are, so big model chunks catch
 * up in under half a second instead of teleporting in as a blob. */
export function revealStep(remaining: number): number {
  return Math.max(MIN_CHARS_PER_TICK, Math.round(remaining / CATCH_UP_DIVISOR));
}

/** ChatGPT-style typewriter: returns a prefix of `text` that grows over time,
 * chasing the live-streamed value. When `animate` is false (hydrated or
 * already-complete messages) it returns the full text immediately. */
export function useTypewriter(text: string, animate: boolean): string {
  const [visible, setVisible] = useState(animate ? 0 : text.length);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (!animate) {
      return;
    }
    if (visibleRef.current >= text.length) {
      return;
    }
    const timer = setInterval(() => {
      setVisible((current) => {
        const next = Math.min(text.length, current + revealStep(text.length - current));
        if (next >= text.length) {
          clearInterval(timer);
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [text, animate]);

  return animate ? text.slice(0, Math.min(visible, text.length)) : text;
}
