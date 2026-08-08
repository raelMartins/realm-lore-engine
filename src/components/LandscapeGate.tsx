"use client";

import { useEffect, useState } from "react";
import { RotateCw, Smartphone } from "lucide-react";

const PHONE_MIN_EDGE = 768;

function shouldBlockLandscape(): boolean {
  if (typeof window === "undefined") return false;
  const { innerWidth: w, innerHeight: h } = window;
  const portrait = h > w;
  const phoneIsh = Math.min(w, h) < PHONE_MIN_EDGE;
  return portrait && phoneIsh;
}

/**
 * Full-screen gate for phone portrait — browsers cannot force landscape,
 * so we ask the traveler to rotate before exploring.
 */
export function LandscapeGate() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Prefer the React gate; hide the static CSS fallback once hydrated.
    document
      .getElementById("landscape-gate-fallback")
      ?.setAttribute("hidden", "");

    const update = () => setBlocked(shouldBlockLandscape());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!blocked) return null;

  return (
    <div
      className="landscape-gate fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 px-8 text-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-gate-title"
      aria-live="polite"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <Smartphone
          className="h-14 w-14 text-teal-200/90"
          strokeWidth={1.25}
          aria-hidden
        />
        <RotateCw
          className="landscape-gate-spin absolute -right-1 -top-1 h-7 w-7 text-amber-200/90"
          aria-hidden
        />
      </div>
      <div className="max-w-[18rem] space-y-2">
        <h2
          id="landscape-gate-title"
          className="font-display text-xl tracking-wide text-realm-silver"
        >
          Rotate to explore
        </h2>
        <p className="text-sm leading-relaxed text-realm-mist/85">
          This realm is built for landscape. Turn your device sideways to chart
          the map.
        </p>
      </div>
    </div>
  );
}
