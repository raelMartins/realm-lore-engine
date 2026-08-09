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
  /** Total ms from activate → last arc finish (calendar open). */
  spanMs?: number;
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
 * Pick guild destinations near each source's Y so arcs stay roughly parallel
 * (no top→bottom criss-cross). Spread X for spacing.
 */
function packYAlignedTargets(sources: Point[], seeds: string[]): Point[] {
  const land = GUILD_LAND_SAMPLES;
  if (land.length === 0 || sources.length === 0) return [];

  const picks: Point[] = [];
  const order = sources
    .map((from, index) => ({ from, index, seed: seeds[index] ?? `t-${index}` }))
    .sort((a, b) => a.from.y - b.from.y);

  const placed: Point[] = [];

  for (const item of order) {
    const preferY = item.from.y;
    const jitter = (hash01(item.seed, 3) - 0.5) * 3;
    const targetY = preferY + jitter;
    const xBias = 68 + hash01(item.seed, 4) * 18;

    let best: Point | null = null;
    let bestScore = -Infinity;

    for (const p of land) {
      const dy = Math.abs(p.y - targetY);
      // Hard-ish Y band — reject far vertical jumps.
      if (dy > 10) continue;

      let dmin = Infinity;
      for (const q of placed) {
        dmin = Math.min(dmin, Math.hypot(p.x - q.x, p.y - q.y));
      }
      if (dmin < 5.5 && placed.length > 0) continue;

      // Prefer close Y match, decent spacing, mid-east X.
      const score =
        -dy * 3.2 +
        Math.min(dmin, 14) * 0.9 -
        Math.abs(p.x - xBias) * 0.08;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    // Fallback: nearest land by Y if band was empty.
    if (!best) {
      best = land.reduce((b, p) =>
        Math.abs(p.y - targetY) < Math.abs(b.y - targetY) ? p : b,
      );
    }

    placed.push(best);
    picks[item.index] = best;
  }

  return picks;
}

/** Origin ring geometry (viewBox %). Path starts on the outer stroke edge. */
const ORIGIN_RING_R = 0.9;
const ORIGIN_RING_STROKE = 0.3;
const ORIGIN_RIM_R = ORIGIN_RING_R + ORIGIN_RING_STROKE / 2;
const TRAIL_STROKE = 0.34;
/** Map % Y treated as vertical “middle” for curve bias. */
const CURVE_MID_Y = 48;

function pointOnRay(from: Point, toward: Point, distance: number): Point {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: from.x + (dx / len) * distance,
    y: from.y + (dy / len) * distance,
  };
}

/**
 * Quadratic arc with Y-aware bow:
 * top → bow upward, bottom → bow downward, mid → gentler same-side bow.
 * Path begins on the origin ring rim (not the center).
 */
function curvePath(
  center: Point,
  to: Point,
  bend: number,
): { d: string; angle: number; start: Point } {
  const dx0 = to.x - center.x;
  const dy0 = to.y - center.y;
  const len0 = Math.hypot(dx0, dy0) || 1;
  const nx = -dy0 / len0;
  const ny = dx0 / len0;

  // Control from center→target mid, then heavy Y-aware offset.
  const mx0 = (center.x + to.x) / 2;
  const my0 = (center.y + to.y) / 2;
  const cx = mx0 + nx * bend * 14;
  const cy = my0 + ny * bend * 14;

  // Leave along the curve tangent (toward control) so the stroke meets the rim.
  const start = pointOnRay(center, { x: cx, y: cy }, ORIGIN_RIM_R);

  const angle = (Math.atan2(to.y - cy, to.x - cx) * 180) / Math.PI;
  return {
    d: `M ${start.x} ${start.y} Q ${cx} ${cy} ${to.x} ${to.y}`,
    angle,
    start,
  };
}

/** Bend amount/sign from source Y: extremes curve more toward their side. */
function bendForY(y: number, seed: string): number {
  const t = Math.max(-1, Math.min(1, (y - CURVE_MID_Y) / 36));
  // |t| near 0 → mild mid curve; near ±1 → strong top/bottom bow.
  const magnitude = 0.55 + Math.abs(t) * 1.15 + hash01(seed, 9) * 0.2;
  const sign = t >= 0 ? 1 : -1;
  return sign * magnitude;
}

/** Assign overlapping but unique start/end times across the cinematic window. */
function assignTimings(
  ids: string[],
  spanMs: number,
): { delay: number; duration: number }[] {
  const n = ids.length;
  if (n === 0) return [];

  const spanSec = Math.max(spanMs, 1200) / 1000;
  // Starts scatter through the first ~45%; ends through the last ~40%.
  const starts = ids.map((id, i) => {
    const jitter = hash01(id, 11);
    // Slight order by index so they don't all clump, but not a strict queue.
    const base = (i / Math.max(n, 1)) * 0.28;
    return Math.min(0.42, base + jitter * 0.22) * spanSec;
  });

  const ends = ids.map((id, i) => {
    const jitter = hash01(id, 17);
    const base = 0.62 + (i / Math.max(n - 1, 1)) * 0.28;
    return Math.min(spanSec, Math.max(spanSec * 0.55, (base + jitter * 0.12) * spanSec));
  });

  // Guarantee the slowest arc finishes at the window end.
  let latest = 0;
  let latestIdx = 0;
  for (let i = 0; i < n; i++) {
    if (ends[i] > latest) {
      latest = ends[i];
      latestIdx = i;
    }
  }
  ends[latestIdx] = spanSec;

  return ids.map((id, i) => {
    const minDur = 2.4 + hash01(id, 19) * 0.8;
    let delay = starts[i];
    let end = ends[i];
    if (end - delay < minDur) {
      delay = Math.max(0, end - minDur);
    }
    return { delay, duration: Math.max(1.8, end - delay) };
  });
}

function buildArcs(pins: LorePin[], spanMs: number): TransferArc[] {
  // Projects + achievements only — jobs/characters stay put visually.
  const sources = pins.filter(
    (p) =>
      p.realm === "adventurer" &&
      (p.category === "project" || p.category === "achievement"),
  );
  const targets = packYAlignedTargets(
    sources.map((p) => p.coordinates),
    sources.map((p) => p.id),
  );
  const timings = assignTimings(
    sources.map((p) => p.id),
    spanMs,
  );

  return sources.map((pin, index) => {
    const from = pin.coordinates;
    const to = targets[index] ?? { x: 78, y: from.y };
    const bend = bendForY(from.y, pin.id);
    const { d, angle } = curvePath(from, to, bend);
    const timing = timings[index] ?? { delay: 0, duration: spanMs / 1000 };
    return {
      id: pin.id,
      d,
      from,
      to,
      angle,
      delay: timing.delay,
      duration: timing.duration,
    };
  });
}

/**
 * Curved skill-transfer arcs from adventurer project/achievement pins
 * onto Guild Shore. Geometry freezes on activate; CSS stroke draw only
 * so the cinematic stays smooth under pan/zoom.
 */
export const AllianceTransferTrails: React.FC<AllianceTransferTrailsProps> = ({
  pins,
  active,
  spanMs = 9000,
}) => {
  const [arcs, setArcs] = useState<TransferArc[] | null>(null);
  const pinsRef = useRef(pins);
  const spanRef = useRef(spanMs);
  pinsRef.current = pins;
  spanRef.current = spanMs;

  useEffect(() => {
    if (!active) {
      setArcs(null);
      return;
    }
    // Capture once at activation — ignore subsequent pin identity churn.
    setArcs((prev) => prev ?? buildArcs(pinsRef.current, spanRef.current));
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
            r={ORIGIN_RING_R}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={ORIGIN_RING_STROKE}
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
            strokeWidth={TRAIL_STROKE}
            strokeLinecap="butt"
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
              animationDelay: `${arc.delay + arc.duration * 0.92}s`,
            }}
          >
            {/* Short equilateral-ish head — wide base, modest length */}
            <path d="M -0.95 -1.15 L 1.15 0 L -0.95 1.15 Z" fill="#2dd4bf" />
          </g>
        </g>
      ))}
    </svg>
  );
};
