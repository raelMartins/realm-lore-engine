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
};

const COLORS = ["#2dd4bf", "#5eead4", "#e8eef2", "#f59e0b", "#99f6e4", "#fbbf24", "#cbd5e1", "#fde68a"];

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  durationMs = 3200,
  intensity = "normal",
}) => {
  const [show, setShow] = useState(false);
  const reduced = prefersReducedMotion();
  const count = intensity === "heavy" ? 140 : 48;

  const particles = useMemo<Particle[]>(() => {
    if (reduced) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * (intensity === "heavy" ? 1.1 : 0.6),
      duration: 2.2 + Math.random() * 1.8,
      color: COLORS[i % COLORS.length],
      size: 4 + Math.random() * (intensity === "heavy" ? 9 : 6),
      rotate: Math.random() * 360,
    }));
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
              className="absolute top-[-8%] rounded-sm"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size * 0.55,
                background: p.color,
                transform: `rotate(${p.rotate}deg)`,
                animation: `hire-confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
                boxShadow: `0 0 8px ${p.color}55`,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
