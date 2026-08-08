"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Aperture, CalendarDays } from "lucide-react";

interface AllianceBannerProps {
  open: boolean;
  onClose: () => void;
  united: boolean;
  busy?: boolean;
  onForge: () => void;
  onSchedule?: () => void;
  schedulingAvailable?: boolean;
}

export const AllianceBanner: React.FC<AllianceBannerProps> = ({
  open,
  onClose,
  united,
  busy = false,
  onForge,
  onSchedule,
  schedulingAvailable = false,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="pointer-events-none fixed top-24 left-1/2 z-[75] w-[min(100%-2rem,400px)] -translate-x-1/2"
        >
          <div className="glass-panel-strong pointer-events-auto rounded-[1.35rem] px-5 py-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-300/90">
                  <Sparkles className="h-3 w-3" />
                  Achievement
                </p>
                <h2 className="font-display mt-1 text-xl text-realm-silver">
                  {united ? "Alliance Forged" : "Forge the Alliance"}
                </h2>
                <p className="mt-1 text-sm leading-snug text-realm-silver-muted">
                  {united
                    ? "Replay the portal, book a call, or close to return home."
                    : "The adventurer portals out, the camera follows, then portals in on Guild Shore."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="glass-btn shrink-0 rounded-full p-2 text-realm-silver-muted hover:text-realm-silver disabled:opacity-40"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onForge}
                className="glass-btn flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold text-realm-silver disabled:opacity-50"
              >
                <Aperture className="h-4 w-4 text-teal-300" />
                {united ? "Replay portal crossing" : "Cross via Portal"}
              </button>

              {united && schedulingAvailable && onSchedule && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSchedule}
                  className="glass-btn flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-realm-mist disabled:opacity-50"
                >
                  <CalendarDays className="h-4 w-4 text-amber-200/90" />
                  Chart a meeting
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
