"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { prefersReducedMotion } from "@/lib/hire";

interface ConfettiProps {
  active: boolean;
  durationMs?: number;
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

const COLORS = ["#2dd4bf", "#5eead4", "#e8eef2", "#f59e0b", "#99f6e4", "#cbd5e1"];

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  durationMs = 3200,
}) => {
  const [show, setShow] = useState(false);
  const reduced = prefersReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    if (reduced) return [];
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.4,
      color: COLORS[i % COLORS.length],
      size: 4 + Math.random() * 6,
      rotate: Math.random() * 360,
    }));
  }, [reduced, active]);

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
