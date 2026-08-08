"use client";

import React from "react";
import { LorePin, RealmSide } from "@/types/world";

interface QuestTrailProps {
  pins: LorePin[];
  united?: boolean;
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
    const side = i % 2 === 0 ? 1 : -1;
    const bend = 0.22;
    const cx = mx - dy * bend * side;
    const cy = my + dx * bend * side;
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x} ${b.y}`;
  }

  return d;
}

const REALM_TRAIL: Record<
  RealmSide,
  { glow: string; gradientId: string; stops: [string, string, string] }
> = {
  adventurer: {
    glow: "rgba(45, 212, 191, 0.3)",
    gradientId: "quest-trail-adventurer",
    stops: ["#5eead4", "#2dd4bf", "#99f6e4"],
  },
  company: {
    glow: "rgba(245, 158, 11, 0.28)",
    gradientId: "quest-trail-company",
    stops: ["#e8eef2", "#f59e0b", "#5eead4"],
  },
};

function RealmPath({
  pins,
  realm,
  styleOverride,
}: {
  pins: LorePin[];
  realm: RealmSide;
  styleOverride?: (typeof REALM_TRAIL)[RealmSide];
}) {
  const pathD = buildQuestPath(pins);
  if (!pathD) return null;

  const style = styleOverride ?? REALM_TRAIL[realm];

  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={style.glow}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#quest-trail-glow)"
      />
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${style.gradientId})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="animate-quest-trail"
      />
    </g>
  );
}

const ALLIANCE_TRAIL = {
  glow: "rgba(94, 234, 212, 0.35)",
  gradientId: "quest-trail-alliance",
  stops: ["#5eead4", "#e8eef2", "#f59e0b"] as [string, string, string],
};

/**
 * Dual-realm quest trails — one route per island, same 0–100 map space.
 * When united, both trails share the alliance palette.
 */
export const QuestTrail: React.FC<QuestTrailProps> = ({
  pins,
  united = false,
}) => {
  const adventurerPins = pins.filter((p) => p.realm === "adventurer");
  const companyPins = pins.filter((p) => p.realm === "company");

  if (adventurerPins.length < 2 && companyPins.length < 2) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={REALM_TRAIL.adventurer.gradientId}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          {REALM_TRAIL.adventurer.stops.map((color, i) => (
            <stop
              key={color}
              offset={`${(i / 2) * 100}%`}
              stopColor={color}
              stopOpacity={0.75}
            />
          ))}
        </linearGradient>
        <linearGradient
          id={REALM_TRAIL.company.gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {REALM_TRAIL.company.stops.map((color, i) => (
            <stop
              key={color}
              offset={`${(i / 2) * 100}%`}
              stopColor={color}
              stopOpacity={0.8}
            />
          ))}
        </linearGradient>
        <linearGradient
          id={ALLIANCE_TRAIL.gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          {ALLIANCE_TRAIL.stops.map((color, i) => (
            <stop
              key={color}
              offset={`${(i / 2) * 100}%`}
              stopColor={color}
              stopOpacity={0.85}
            />
          ))}
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

      {adventurerPins.length >= 2 && (
        <RealmPath
          pins={adventurerPins}
          realm="adventurer"
          styleOverride={united ? ALLIANCE_TRAIL : undefined}
        />
      )}
      {companyPins.length >= 2 && (
        <RealmPath
          pins={companyPins}
          realm="company"
          styleOverride={united ? ALLIANCE_TRAIL : undefined}
        />
      )}
    </svg>
  );
};
