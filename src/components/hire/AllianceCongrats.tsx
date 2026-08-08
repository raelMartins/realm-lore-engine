"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AllianceCongratsProps {
  open: boolean;
  companyName?: string;
}

export const AllianceCongrats: React.FC<AllianceCongratsProps> = ({
  open,
  companyName = "the Guild",
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative w-[min(100%,420px)] overflow-hidden rounded-[1.25rem] px-7 py-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            style={{
              background:
                "linear-gradient(160deg, #f3e6c8 0%, #e8d4a8 42%, #dcc28a 100%)",
              border: "1px solid rgba(120, 80, 30, 0.35)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.55), 0 24px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
              }}
              aria-hidden
            />
            <p
              className="relative font-display text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "rgba(90, 55, 20, 0.75)" }}
            >
              Scroll of Accord
            </p>
            <h2
              className="relative mt-3 font-display text-[1.85rem] leading-tight sm:text-[2.1rem]"
              style={{ color: "#3b2410" }}
            >
              Congratulations
            </h2>
            <p
              className="relative mx-auto mt-3 max-w-[28ch] text-sm leading-relaxed"
              style={{ color: "rgba(70, 45, 18, 0.88)" }}
            >
              The alliance with {companyName} is sealed. The shores brighten as
              your colors join theirs…
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
