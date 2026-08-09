"use client";

import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";

const STORAGE_KEY = "realm-desktop-hint-dismissed";
const PHONE_MIN_EDGE = 768;

function shouldShowHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return false;
  } catch {
    /* private mode — still allow the hint */
  }
  const { innerWidth: w, innerHeight: h } = window;
  const phoneIsh = Math.min(w, h) < PHONE_MIN_EDGE;
  const portrait = h > w;
  // Portrait phones already see the rotate gate; hint is for landscape use.
  return phoneIsh && !portrait;
}

/**
 * Soft notice that the realm is tuned for desktop — dismissible, persisted.
 */
export function DesktopHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(shouldShowHint());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))] z-40 flex justify-center px-3"
      role="status"
    >
      <div className="pointer-events-auto glass-panel-strong flex max-w-[min(100%,22rem)] items-start gap-2.5 rounded-2xl px-3.5 py-2.5 text-left shadow-lg">
        <Monitor
          className="mt-0.5 h-4 w-4 shrink-0 text-teal-300/90"
          aria-hidden
        />
        <p className="min-w-0 flex-1 text-[11px] leading-snug text-realm-mist">
          Best on a desktop screen. Mobile works in landscape, but some details
          and controls are tighter.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="glass-btn -mr-1 -mt-0.5 shrink-0 rounded-full p-1.5 text-realm-mist hover:text-realm-silver"
          aria-label="Dismiss desktop hint"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
