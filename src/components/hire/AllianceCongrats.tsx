"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AllianceCongratsProps {
  open: boolean;
  companyName?: string;
}

function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6 H78 M122 6 H196"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M88 6 C94 2 100 2 100 6 C100 10 106 10 112 6"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="100" cy="6" r="1.6" fill="currentColor" opacity="0.75" />
    </svg>
  );
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
          transition={{ duration: 0.5 }}
          aria-live="polite"
        >
          {/* Soft vignette behind the scroll */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(20,12,4,0.15) 0%, rgba(4,8,12,0.55) 70%)",
            }}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.9, rotate: -1.2 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            className="relative w-[min(100%,460px)]"
          >
            {/* Drop shadow plate */}
            <div
              className="absolute -inset-1 rounded-[1.4rem] opacity-60 blur-md"
              style={{ background: "rgba(40, 22, 6, 0.45)" }}
              aria-hidden
            />

            <div
              className="relative overflow-hidden rounded-[1.35rem] px-6 py-9 text-center sm:px-9 sm:py-10"
              style={{
                background:
                  "linear-gradient(165deg, #f7ecd4 0%, #efdfb8 38%, #e2c894 78%, #d4b67a 100%)",
                border: "1px solid rgba(92, 58, 22, 0.4)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(120,70,20,0.18), 0 28px 70px rgba(0,0,0,0.5)",
              }}
            >
              {/* Parchment fiber noise */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.22]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
                }}
                aria-hidden
              />

              {/* Inner ornamental frame */}
              <div
                className="pointer-events-none absolute inset-3 rounded-[1rem]"
                style={{
                  border: "1px solid rgba(110, 70, 28, 0.28)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-4 rounded-[0.85rem]"
                style={{ border: "1px dashed rgba(110, 70, 28, 0.18)" }}
                aria-hidden
              />

              {/* Corner ticks */}
              {(
                [
                  "top-5 left-5",
                  "top-5 right-5",
                  "bottom-5 left-5",
                  "bottom-5 right-5",
                ] as const
              ).map((pos) => (
                <span
                  key={pos}
                  className={`pointer-events-none absolute h-3 w-3 ${pos}`}
                  style={{
                    borderColor: "rgba(90, 55, 20, 0.45)",
                    borderStyle: "solid",
                    borderWidth: pos.includes("top")
                      ? pos.includes("left")
                        ? "1.5px 0 0 1.5px"
                        : "1.5px 1.5px 0 0"
                      : pos.includes("left")
                        ? "0 0 1.5px 1.5px"
                        : "0 1.5px 1.5px 0",
                  }}
                  aria-hidden
                />
              ))}

              <motion.p
                className="relative font-display text-[10px] uppercase tracking-[0.32em] sm:text-[11px]"
                style={{ color: "rgba(90, 55, 20, 0.72)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.45 }}
              >
                By ink &amp; tide · Scroll of Accord
              </motion.p>

              <div
                className="relative mx-auto mt-4 h-3 w-44"
                style={{ color: "rgba(90, 55, 20, 0.55)" }}
              >
                <Flourish className="h-full w-full" />
              </div>

              <motion.h2
                className="relative mt-4 font-display text-[2.15rem] leading-[1.05] tracking-wide sm:text-[2.55rem]"
                style={{
                  color: "#2c1808",
                  textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.5 }}
              >
                Congratulations
              </motion.h2>

              <motion.p
                className="relative mx-auto mt-2 font-display text-base italic tracking-wide sm:text-lg"
                style={{ color: "rgba(90, 50, 18, 0.88)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
              >
                An alliance is forged
              </motion.p>

              <div
                className="relative mx-auto mt-4 h-3 w-36"
                style={{ color: "rgba(90, 55, 20, 0.45)" }}
              >
                <Flourish className="h-full w-full" />
              </div>

              <motion.p
                className="relative mx-auto mt-4 max-w-[34ch] text-[13px] leading-relaxed sm:text-sm"
                style={{ color: "rgba(65, 40, 16, 0.92)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.5 }}
              >
                Your deeds cross the channel to{" "}
                <span className="font-semibold">{companyName}</span>. Skills,
                stories, and hard-won markers flow east as the shores share one
                color — and one cause.
              </motion.p>

              <motion.p
                className="relative mx-auto mt-3 max-w-[32ch] font-display text-[12px] leading-snug tracking-wide sm:text-[13px]"
                style={{ color: "rgba(90, 55, 20, 0.7)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.55 }}
              >
                “Two maps. One voyage.”
              </motion.p>

              {/* Wax seal */}
              <motion.div
                className="relative mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #e11d48 0%, #9f1239 55%, #7f1d1d 100%)",
                  boxShadow:
                    "inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.35), 0 6px 14px rgba(80,10,20,0.35)",
                }}
                initial={{ opacity: 0, scale: 0.4, rotate: -25 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.75,
                  type: "spring",
                  stiffness: 260,
                  damping: 16,
                }}
                aria-hidden
              >
                <span
                  className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase"
                  style={{
                    color: "rgba(255, 230, 200, 0.92)",
                    textShadow: "0 1px 1px rgba(0,0,0,0.35)",
                  }}
                >
                  Seal
                </span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
