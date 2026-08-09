"use client";

import React, { useEffect, useRef, useState } from "react";
import type { LorePin } from "@/types/world";
import {
  GUILD_BOUNDS,
  isOnGuildLand,
  type Point,
} from "@/lib/world/placement";

interface AllianceTransferTrailsProps {
  pins: LorePin[];
  active: boolean;
}

interface TransferArc {
  id: string;
  d: string;
  from: Point;
  to: Point;
  angle: number;
  delay: number;
  duration: number;
}

/** Deterministic 0–1 from string. */
function hash01(input: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Sample guild-land candidates once (map % space). */
const GUILD_LAND_SAMPLES: Point[] = (() => {
  const land: Point[] = [];
  for (let y = GUILD_BOUNDS.minY + 4; y <= GUILD_BOUNDS.maxY - 4; y += 2.5) {
    for (let x = GUILD_BOUNDS.minX + 4; x <= GUILD_BOUNDS.maxX - 4; x += 2.5) {
      const p = { x, y };
      if (isOnGuildLand(p)) land.push(p);
    }
  }
  return land;
})();

/**
 * Greedy farthest-point packing so destinations spread across the isle.
 */
function packEvenTargets(count: number, seeds: string[]): Point[] {
  const land = GUILD_LAND_SAMPLES;
  if (land.length === 0 || count <= 0) return [];

  const picks: Point[] = [];
  picks.push(land.reduce((best, p) => (p.y < best.y ? p : best), land[0]));

  while (picks.length < count) {
    let best: Point | null = null;
    let bestScore = -1;
    const seed = seeds[picks.length] ?? `t-${picks.length}`;
    const biasX = (hash01(seed, 1) - 0.5) * 4;
    const biasY = (hash01(seed, 2) - 0.5) * 4;

    for (const p of land) {
      let dmin = Infinity;
      for (const q of picks) {
        dmin = Math.min(dmin, Math.hypot(p.x - q.x, p.y - q.y));
      }
      const score =
        dmin + Math.hypot(p.x - (78 + biasX), p.y - (55 + biasY)) * -0.02;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (!best) break;
    picks.push(best);
  }

  return picks.slice(0, count);
}

function curvePath(from: Point, to: Point, bend: number): {
  d: string;
  angle: number;
} {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend * 12;
  const cy = my + ny * bend * 12 - 4;
  const angle = (Math.atan2(to.y - cy, to.x - cx) * 180) / Math.PI;
  return {
    d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
    angle,
  };
}

function buildArcs(pins: LorePin[]): TransferArc[] {
  // Projects + achievements only — jobs/characters stay put visually.
  const sources = pins.filter(
    (p) =>
      p.realm === "adventurer" &&
      (p.category === "project" || p.category === "achievement"),
  );
  const targets = packEvenTargets(
    sources.length,
    sources.map((p) => p.id),
  );

  return sources.map((pin, index) => {
    const from = pin.coordinates;
    const to = targets[index] ?? { x: 78, y: 52 };
    const bend = (hash01(pin.id, 9) - 0.5) * 1.2;
    const { d, angle } = curvePath(from, to, bend);
    return {
      id: pin.id,
      d,
      from,
      to,
      angle,
      // Tight stagger — fewer arcs, quicker cascade.
      delay: index * 0.045,
      duration: 0.95 + hash01(pin.id, 2) * 0.2,
    };
  });
}

/**
 * Curved skill-transfer arcs from adventurer project/achievement pins
 * onto Guild Shore. Geometry freezes on activate; CSS stroke draw only
 * (no SMIL / animateMotion) so the cinematic stays smooth under pan/zoom.
 */
export const AllianceTransferTrails: React.FC<AllianceTransferTrailsProps> = ({
  pins,
  active,
}) => {
  const [arcs, setArcs] = useState<TransferArc[] | null>(null);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;

  useEffect(() => {
    if (!active) {
      setArcs(null);
      return;
    }
    // Capture once at activation — ignore subsequent pin identity churn.
    setArcs((prev) => prev ?? buildArcs(pinsRef.current));
  }, [active]);

  if (!active || !arcs || arcs.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      style={{ contain: "strict" }}
    >
      {arcs.map((arc) => (
        <g key={arc.id}>
          <circle
            cx={arc.from.x}
            cy={arc.from.y}
            r={0.9}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={0.3}
            className="alliance-transfer-origin-ring"
            style={{ animationDelay: `${arc.delay}s` }}
          />
          <circle
            cx={arc.from.x}
            cy={arc.from.y}
            r={0.28}
            fill="#2dd4bf"
            className="alliance-transfer-origin-core"
            style={{ animationDelay: `${arc.delay}s` }}
          />

          <path
            d={arc.d}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={0.65}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            strokeDashoffset={1}
            pathLength={1}
            className="alliance-transfer-stroke"
            style={{
              animationDelay: `${arc.delay}s`,
              animationDuration: `${arc.duration}s`,
            }}
          />

          <g
            transform={`translate(${arc.to.x} ${arc.to.y}) rotate(${arc.angle})`}
            className="alliance-transfer-arrow"
            style={{
              animationDelay: `${arc.delay + arc.duration * 0.82}s`,
            }}
          >
            <path
              d="M -1.1 -0.85 L 1.35 0 L -1.1 0.85 L -0.55 0 Z"
              fill="#2dd4bf"
            />
          </g>
        </g>
      ))}
    </svg>
  );
};
