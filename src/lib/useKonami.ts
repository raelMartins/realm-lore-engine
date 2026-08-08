"use client";

import { useEffect, useRef } from "react";
import { KONAMI_SEQUENCE } from "@/lib/secrets";

/**
 * Listens for the Konami code. Ignores input focused in fields.
 */
export function useKonami(onUnlock: () => void, enabled = true): void {
  const index = useRef(0);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const expected = KONAMI_SEQUENCE[index.current];
      const code = e.code;

      if (code === expected) {
        index.current += 1;
        if (index.current >= KONAMI_SEQUENCE.length) {
          index.current = 0;
          onUnlockRef.current();
        }
        return;
      }

      // Allow restarting if the first key is pressed again mid-sequence
      if (code === KONAMI_SEQUENCE[0]) {
        index.current = 1;
      } else {
        index.current = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
