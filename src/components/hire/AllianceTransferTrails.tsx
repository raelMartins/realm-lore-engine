"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { LorePin } from "@/types/world";
import { ADVENTURER_PIN_ID } from "@/lib/hire";
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
function sampleGuildLand(): Point[] {
  const land: Point[] = [];
  for (let y = GUILD_BOUNDS.minY + 4; y <= GUILD_BOUNDS.maxY - 4; y += 1.5) {
    for (let x = GUILD_BOUNDS.minX + 4; x <= GUILD_BOUNDS.maxX - 4; x += 1.5) {
      const p = { x, y };
      if (isOnGuildLand(p)) land.push(p);
    }
  }
  return land;
}

/**
 * Greedy farthest-point packing so destinations spread across the isle.
 */
function packEvenTargets(count: number, seeds: string[]): Point[] {
  const land = sampleGuildLand();
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

function curvePath(from: Point, to: Point, bend: number): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bend * 12;
  const cy = my + ny * bend * 12 - 4;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

function buildArcs(pins: LorePin[]): TransferArc[] {
  // Character pin portals itself — no transfer arc from it.
  const sources = pins.filter(
    (p) =>
      p.realm === "adventurer" &&
      p.category !== "easter_egg" &&
      p.id !== ADVENTURER_PIN_ID,
  );
  const targets = packEvenTargets(
    sources.length,
    sources.map((p) => p.id),
  );

  return sources.map((pin, index) => {
    const from = pin.coordinates;
    const to = targets[index] ?? { x: 78, y: 52 };
    const bend = (hash01(pin.id, 9) - 0.5) * 1.2;
    return {
      id: pin.id,
      d: curvePath(from, to, bend),
      from,
      to,
      delay: index * 0.1,
      duration: 1.55 + hash01(pin.id, 2) * 0.45,
    };
  });
}

/**
 * Curved skill-transfer arcs from adventurer pins onto Guild Shore.
 * Drawn in map % space so they stay locked to geography under pan/zoom.
 * Geometry freezes when activated so portal migration doesn't move origins.
 */
export const AllianceTransferTrails: React.FC<AllianceTransferTrailsProps> = ({
  pins,
  active,
}) => {
  const liveArcs = useMemo(() => buildArcs(pins), [pins]);
  const [frozenArcs, setFrozenArcs] = useState<TransferArc[] | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (active) {
      setFrozenArcs((prev) => prev ?? liveArcs);
    } else {
      setFrozenArcs(null);
      setSettled(false);
    }
  }, [active, liveArcs]);

  useEffect(() => {
    if (!active || !frozenArcs || frozenArcs.length === 0) return;
    const maxMs =
      Math.max(...frozenArcs.map((a) => a.delay + a.duration)) * 1000 + 40;
    const id = window.setTimeout(() => setSettled(true), maxMs);
    return () => window.clearTimeout(id);
  }, [active, frozenArcs]);

  const arcs = frozenArcs;
  if (!active || !arcs || arcs.length === 0) return null;

  // Matched CSS ease-out: cubic-bezier(0, 0, 0.58, 1)
  const easeOutSpline = "0 0 0.58 1";

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {arcs.map((arc) => (
        <g key={arc.id}>
          <circle
            cx={arc.from.x}
            cy={arc.from.y}
            r={1.15}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={0.35}
            opacity={1}
            className={settled ? undefined : "alliance-transfer-origin-ring"}
            style={settled ? undefined : { animationDelay: `${arc.delay}s` }}
          />
          <circle
            cx={arc.from.x}
            cy={arc.from.y}
            r={0.35}
            fill="#2dd4bf"
            opacity={1}
            className={settled ? undefined : "alliance-transfer-origin-core"}
            style={settled ? undefined : { animationDelay: `${arc.delay}s` }}
          />

          {settled ? (
            <>
              <path
                d={arc.d}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth={0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g transform={`translate(${arc.to.x} ${arc.to.y})`}>
                {/* Approximate end orientation: aim from mid-curve toward target */}
                <path
                  d="M -1.1 -0.85 L 1.35 0 L -1.1 0.85 L -0.55 0 Z"
                  fill="#2dd4bf"
                  transform={`rotate(${arrowAngleDeg(arc.d, arc.to)})`}
                />
              </g>
            </>
          ) : (
            <>
              <path
                d={arc.d}
                fill="none"
                stroke="#2dd4bf"
                strokeOpacity={1}
                strokeWidth={0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={1}
                strokeDashoffset={1}
                pathLength={1}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur={`${arc.duration}s`}
                  begin={`${arc.delay}s`}
                  fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines={easeOutSpline}
                />
              </path>

              <g>
                <path
                  d="M -1.1 -0.85 L 1.35 0 L -1.1 0.85 L -0.55 0 Z"
                  fill="#2dd4bf"
                  opacity={0}
                >
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur="0.12s"
                    begin={`${arc.delay}s`}
                    fill="freeze"
                  />
                </path>
                <animateMotion
                  dur={`${arc.duration}s`}
                  begin={`${arc.delay}s`}
                  fill="freeze"
                  rotate="auto"
                  path={arc.d}
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines={easeOutSpline}
                />
              </g>
            </>
          )}
        </g>
      ))}
    </svg>
  );
};

/** Heading of the path at its end (degrees), for settled arrow placement. */
function arrowAngleDeg(d: string, to: Point): number {
  const match = d.match(
    /M\s*([\d.-]+)\s+([\d.-]+)\s+Q\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/,
  );
  if (!match) return 0;
  const cx = Number(match[3]);
  const cy = Number(match[4]);
  return (Math.atan2(to.y - cy, to.x - cx) * 180) / Math.PI;
}
