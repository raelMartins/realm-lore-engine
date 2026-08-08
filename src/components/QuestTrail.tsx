"use client";

import React from "react";
import { LorePin } from "@/types/world";

interface QuestTrailProps {
  pins: LorePin[];
}

/**
 * Builds a curved SVG path through pin percentage coords (0–100 space).
 * Quadratic mid-point control offsets give a soft "caravan route" arc.
 */
function buildQuestPath(pins: LorePin[]): string {
  if (pins.length < 2) return "";

  const pts = pins.map((p) => ({
    x: p.coordinates.x,
    y: p.coordinates.y,
  }));

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // Alternate curve direction so the route feels organic
    const side = i % 2 === 0 ? 1 : -1;
    const bend = 0.22;
    const cx = mx - dy * bend * side;
    const cy = my + dx * bend * side;
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x} ${b.y}`;
  }

  return d;
}

export const QuestTrail: React.FC<QuestTrailProps> = ({ pins }) => {
  const pathD = buildQuestPath(pins);

  if (!pathD) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="quest-trail-stroke"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.55" />
        </linearGradient>
        <filter
          id="quest-trail-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="0.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Soft under-glow path */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(245, 158, 11, 0.28)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#quest-trail-glow)"
      />

      {/* Animated dashed quest trail — dasharray/animation from CSS */}
      <path
        d={pathD}
        fill="none"
        stroke="url(#quest-trail-stroke)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="animate-quest-trail"
      />
    </svg>
  );
};
