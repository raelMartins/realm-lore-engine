"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompanyLoreConfig, LorePin, RealmSide } from "@/types/world";
import { X, MapPin, Compass } from "lucide-react";

interface RealmOverviewProps {
  realm: RealmSide | null;
  data: CompanyLoreConfig;
  onClose: () => void;
  onSelectPin: (pin: LorePin) => void;
}

const DEFAULT_LABELS: Record<RealmSide, string> = {
  adventurer: "Adventurer's Reach",
  company: "Guild Shore",
};

export const RealmOverview: React.FC<RealmOverviewProps> = ({
  realm,
  data,
  onClose,
  onSelectPin,
}) => {
  useEffect(() => {
    if (!realm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [realm, onClose]);

  const pins = realm ? data.pins.filter((p) => p.realm === realm) : [];
  const title = realm
    ? data.realmLabels?.[realm] || DEFAULT_LABELS[realm]
    : "";
  const blurb =
    realm === "adventurer"
      ? "Western isles — craft, shipped relics, and the adventurer's path."
      : `Eastern shore — ${data.companyName}, allies, and the main quest.`;

  return (
    <AnimatePresence>
      {realm && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss realm overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#040a0e]/35 backdrop-blur-[2px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="realm-overview-title"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="glass-panel-strong fixed top-1/2 left-1/2 z-50 flex max-h-[min(85dvh,72vh,520px)] w-[min(100%-2rem,340px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.35rem]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-3.5 pt-5">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/25 bg-teal-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-realm-teal-soft">
                  <Compass className="h-3 w-3" />
                  {realm === "adventurer" ? "West" : "East"}
                </span>
                <h2
                  id="realm-overview-title"
                  className="font-display mt-2 text-xl font-semibold tracking-wide text-realm-silver"
                >
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-snug text-realm-silver-muted">
                  {blurb}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="glass-btn shrink-0 rounded-full p-2 text-realm-silver-muted hover:text-realm-silver"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto parchment-scroll px-3 py-3">
              {pins.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-realm-silver-muted">
                  No nodes charted in this realm yet.
                </p>
              ) : (
                pins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => {
                      onSelectPin(pin);
                      onClose();
                    }}
                    className="group flex w-full items-start gap-3 rounded-2xl border border-transparent px-2.5 py-2.5 text-left transition-all hover:border-realm-teal/25 hover:bg-white/5"
                  >
                    <div className="glass-btn rounded-xl p-2 text-realm-teal">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-realm-silver">
                        {pin.title}
                      </p>
                      <p className="text-xs text-realm-silver-muted">
                        {pin.subtitle}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
