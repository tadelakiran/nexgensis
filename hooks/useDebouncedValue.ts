"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Used by the search box: the input itself stays instant (it is a controlled
 * local state value), and only the *debounced* value is written to the URL, which
 * in turn triggers the request. Typing "phone" therefore costs one API call
 * instead of five.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Clearing on every change is what actually debounces: each new keystroke
    // cancels the pending update and restarts the clock.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
