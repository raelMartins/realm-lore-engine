"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { prefersReducedMotion } from "@/lib/hire";

interface ConfettiProps {
  active: boolean;
  durationMs?: number;
  /** Particle count multiplier — celebrate uses a denser burst. */
  intensity?: "normal" | "heavy";
}

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
  drift: number;
  kind: "rect" | "ribbon" | "dot";
};

const COLORS = [
  "#2dd4bf",
  "#5eead4",
  "#99f6e4",
  "#e8eef2",
  "#f59e0b",
  "#fbbf24",
  "#fde68a",
  "#fdba74",
  "#cbd5e1",
  "#a7f3d0",
  "#fecdd3",
];

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  durationMs = 3200,
  intensity = "normal",
}) => {
  const [show, setShow] = useState(false);
  const reduced = prefersReducedMotion();
  const count = intensity === "heavy" ? 320 : 48;

  const particles = useMemo<Particle[]>(() => {
    if (reduced) return [];
    return Array.from({ length: count }, (_, i) => {
      const kindRoll = hashish(i);
      const kind: Particle["kind"] =
        kindRoll < 0.2 ? "dot" : kindRoll < 0.55 ? "ribbon" : "rect";
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * (intensity === "heavy" ? 1.6 : 0.6),
        duration: 2.4 + Math.random() * (intensity === "heavy" ? 2.4 : 1.6),
        color: COLORS[i % COLORS.length],
        size:
          kind === "ribbon"
            ? 3 + Math.random() * 4
            : kind === "dot"
              ? 3 + Math.random() * 5
              : 4 + Math.random() * (intensity === "heavy" ? 10 : 6),
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * (intensity === "heavy" ? 40 : 18),
        kind,
      };
    });
  }, [reduced, active, count, intensity]);

  useEffect(() => {
    if (!active) {
      setShow(false);
      return;
    }
    setShow(true);
    const t = window.setTimeout(() => setShow(false), durationMs);
    return () => window.clearTimeout(t);
  }, [active, durationMs]);

  return (
    <AnimatePresence>
      {show && !reduced && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute top-[-10%]"
              style={
                {
                  left: `${p.left}%`,
                  width: p.kind === "ribbon" ? p.size * 0.45 : p.size,
                  height:
                    p.kind === "ribbon"
                      ? p.size * 2.8
                      : p.kind === "dot"
                        ? p.size
                        : p.size * 0.55,
                  borderRadius:
                    p.kind === "dot"
                      ? "9999px"
                      : p.kind === "ribbon"
                        ? "2px"
                        : "1px",
                  background: p.color,
                  transform: `rotate(${p.rotate}deg)`,
                  animation: `hire-confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
                  ["--confetti-drift" as string]: `${p.drift}px`,
                  boxShadow: `0 0 10px ${p.color}66`,
                } as React.CSSProperties
              }
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function hashish(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
