"use client";

import React, { useMemo } from "react";
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

/** Deterministic 0–1 from string (stable endpoints across renders). */
function hash01(input: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function pickGuildTarget(seed: string): Point {
  // Prefer inland guild shore samples
  for (let attempt = 0; attempt < 40; attempt++) {
    const x =
      GUILD_BOUNDS.minX +
      8 +
      hash01(seed, attempt * 3) * (GUILD_BOUNDS.maxX - GUILD_BOUNDS.minX - 16);
    const y =
      GUILD_BOUNDS.minY +
      10 +
      hash01(seed, attempt * 3 + 1) * (GUILD_BOUNDS.maxY - GUILD_BOUNDS.minY - 20);
    const p = { x, y };
    if (isOnGuildLand(p)) return p;
  }
  return { x: 78, y: 52 };
}

function curvePath(from: Point, to: Point, bend: number): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular bulge toward channel / north
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend * 12;
  const cy = my + ny * bend * 12 - 4;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

/**
 * Curved skill-transfer arcs from adventurer pins onto Guild Shore.
 * Drawn in map % space so they stay locked to geography under pan/zoom.
 */
export const AllianceTransferTrails: React.FC<AllianceTransferTrailsProps> = ({
  pins,
  active,
}) => {
  const arcs = useMemo(() => {
    const sources = pins.filter(
      (p) => p.realm === "adventurer" && p.category !== "easter_egg",
    );
    return sources.map((pin, index) => {
      const from = pin.coordinates;
      const to = pickGuildTarget(pin.id);
      const bend = (hash01(pin.id, 9) - 0.5) * 1.4;
      return {
        id: pin.id,
        d: curvePath(from, to, bend),
        to,
        delay: 0.08 + index * 0.12,
        duration: 1.35 + hash01(pin.id, 2) * 0.7,
      };
    });
  }, [pins]);

  if (!active || arcs.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="transfer-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#fde68a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.9" />
        </linearGradient>
        <filter id="transfer-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {arcs.map((arc) => (
        <g key={arc.id}>
          <path
            d={arc.d}
            fill="none"
            stroke="url(#transfer-arc-grad)"
            strokeWidth={0.55}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter="url(#transfer-glow)"
            className="alliance-transfer-arc"
            pathLength={1}
            style={{
              animationDelay: `${arc.delay}s`,
              animationDuration: `${arc.duration}s`,
            }}
          />
          <circle
            cx={arc.to.x}
            cy={arc.to.y}
            r={0.55}
            fill="#5eead4"
            className="alliance-transfer-dot"
            style={{
              animationDelay: `${arc.delay + arc.duration * 0.85}s`,
            }}
          />
        </g>
      ))}
    </svg>
  );
};
