"use client";

import React, { useRef, useState } from "react";
import { RealmSide } from "@/types/world";
import { REALM_HIT_LABELS, REALM_HIT_PATHS } from "@/config/realmHitPaths";

export type RealmColorPhase = "idle" | "celebrate" | "aligning" | "aligned";

interface RealmHitLayerProps {
  labels?: {
    adventurer?: string;
    company?: string;
  };
  selectedRealm: RealmSide | null;
  onSelectRealm: (realm: RealmSide) => void;
  /** Alliance cinematic / lasting color alignment. */
  colorPhase?: RealmColorPhase;
  /** Notify parent so labels can lift above pins while hovered. */
  onHoverChange?: (realm: RealmSide | null) => void;
}

interface RealmLabelOverlayProps {
  labels?: {
    adventurer?: string;
    company?: string;
  };
  selectedRealm: RealmSide | null;
  hoveredRealm: RealmSide | null;
  colorPhase?: RealmColorPhase;
}

/** Adventurer = amber · Guild = teal (swapped from earlier teal-west / amber-east). */
const REALM_FILL: Record<
  RealmSide,
  { idle: string; hover: string; selected: string; stroke: string; strokeIdle: string }
> = {
  adventurer: {
    idle: "rgba(251, 191, 36, 0.1)",
    hover: "rgba(245, 158, 11, 0.36)",
    selected: "rgba(245, 158, 11, 0.4)",
    stroke: "rgba(253, 230, 138, 0.95)",
    strokeIdle: "rgba(253, 230, 138, 0.4)",
  },
  company: {
    idle: "rgba(45, 212, 191, 0.12)",
    hover: "rgba(45, 212, 191, 0.38)",
    selected: "rgba(45, 212, 191, 0.42)",
    stroke: "rgba(94, 234, 212, 0.95)",
    strokeIdle: "rgba(94, 234, 212, 0.45)",
  },
};

const DEFAULT_NAMES: Record<RealmSide, string> = {
  adventurer: "Adventurer's Reach",
  company: "Guild Shore",
};

const CLICK_MOVE_THRESHOLD_PX = 8;

function paletteFor(
  realm: RealmSide,
  phase: RealmColorPhase,
): (typeof REALM_FILL)[RealmSide] {
  if (realm === "adventurer" && (phase === "aligning" || phase === "aligned")) {
    return REALM_FILL.company;
  }
  return REALM_FILL[realm];
}

function realmLabel(
  realm: RealmSide,
  labels?: RealmHitLayerProps["labels"],
): string {
  return labels?.[realm] || DEFAULT_NAMES[realm];
}

export const RealmHitLayer: React.FC<RealmHitLayerProps> = ({
  labels,
  selectedRealm,
  onSelectRealm,
  colorPhase = "idle",
  onHoverChange,
}) => {
  const [hovered, setHovered] = useState<RealmSide | null>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const forceHover = colorPhase === "celebrate" || colorPhase === "aligning";
  const slowAlign = colorPhase === "aligning";

  const setHover = (realm: RealmSide | null) => {
    setHovered(realm);
    onHoverChange?.(realm);
  };

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-label="Realm territories"
    >
      <defs>
        <filter id="realm-hover-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {(["adventurer", "company"] as RealmSide[]).map((realm) => {
        const fill = paletteFor(realm, colorPhase);
        const active =
          forceHover || hovered === realm || selectedRealm === realm;
        const fillColor = forceHover
          ? fill.hover
          : selectedRealm === realm
            ? fill.selected
            : hovered === realm
              ? fill.hover
              : fill.idle;

        return (
          <path
            key={realm}
            d={REALM_HIT_PATHS[realm]}
            data-realm-hit={realm}
            fill={fillColor}
            stroke={active ? fill.stroke : fill.strokeIdle}
            strokeWidth={active ? 2.5 : 1.5}
            vectorEffect="non-scaling-stroke"
            filter={active ? "url(#realm-hover-glow)" : undefined}
            className={`cursor-pointer active:cursor-grabbing ${
              slowAlign && realm === "adventurer"
                ? "transition-[fill,stroke,stroke-width,filter] duration-[2800ms] ease-in-out"
                : "transition-[fill,stroke,stroke-width] duration-200"
            }`}
            onMouseEnter={() => setHover(realm)}
            onMouseLeave={() => setHover(null)}
            onPointerDown={(e) => {
              pointerDown.current = { x: e.clientX, y: e.clientY };
            }}
            onClick={(e) => {
              e.stopPropagation();
              const start = pointerDown.current;
              pointerDown.current = null;
              if (start) {
                const moved = Math.hypot(
                  e.clientX - start.x,
                  e.clientY - start.y,
                );
                if (moved > CLICK_MOVE_THRESHOLD_PX) return;
              }
              onSelectRealm(realm);
            }}
          />
        );
      })}

      {/* Idle labels stay under pins; elevated copy renders in RealmLabelOverlay */}
      {(["adventurer", "company"] as RealmSide[]).map((realm) => {
        const elevated =
          forceHover || hovered === realm || selectedRealm === realm;
        if (elevated) return null;
        const anchor = REALM_HIT_LABELS[realm];
        return (
          <text
            key={`idle-${realm}`}
            x={anchor.x}
            y={anchor.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none select-none"
            fill="rgba(226, 232, 240, 0.7)"
            fontSize={1.55}
            fontFamily="var(--font-cinzel), serif"
            letterSpacing="0.05"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.75)" }}
          >
            {realmLabel(realm, labels)}
          </text>
        );
      })}
    </svg>
  );
};

/** Island names drawn above pins while hovered / selected / celebrating. */
export const RealmLabelOverlay: React.FC<RealmLabelOverlayProps> = ({
  labels,
  selectedRealm,
  hoveredRealm,
  colorPhase = "idle",
}) => {
  const forceHover = colorPhase === "celebrate" || colorPhase === "aligning";

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[3] h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {(["adventurer", "company"] as RealmSide[]).map((realm) => {
        const active =
          forceHover || hoveredRealm === realm || selectedRealm === realm;
        if (!active) return null;
        const anchor = REALM_HIT_LABELS[realm];
        return (
          <text
            key={realm}
            x={anchor.x}
            y={anchor.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="select-none"
            fill="#f8fafc"
            fontSize={1.55}
            fontFamily="var(--font-cinzel), serif"
            letterSpacing="0.05"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.75)" }}
          >
            {realmLabel(realm, labels)}
          </text>
        );
      })}
    </svg>
  );
};
