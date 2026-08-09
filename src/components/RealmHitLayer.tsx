"use client";

import React, { useRef, useState } from "react";
import { RealmSide } from "@/types/world";
import { REALM_HIT_LABELS, REALM_HIT_PATHS } from "@/config/realmHitPaths";

export type RealmColorPhase =
  | "idle"
  | "celebrate"
  | "aligning"
  | "aligned"
  | "reverting";

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

/** Adventurer = soft amethyst · Guild = teal (cool complements; silver stays UI chrome). */
const REALM_FILL: Record<
  RealmSide,
  { idle: string; hover: string; selected: string; stroke: string; strokeIdle: string }
> = {
  adventurer: {
    idle: "rgba(167, 139, 250, 0.12)",
    hover: "rgba(167, 139, 250, 0.34)",
    selected: "rgba(139, 110, 230, 0.4)",
    stroke: "rgba(221, 214, 254, 0.95)",
    strokeIdle: "rgba(196, 181, 253, 0.45)",
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
  selectedRealm,
  onSelectRealm,
  colorPhase = "idle",
  onHoverChange,
}) => {
  const [hovered, setHovered] = useState<RealmSide | null>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);
  const forceHover = colorPhase === "celebrate" || colorPhase === "aligning";
  const slowAlign =
    colorPhase === "aligning" || colorPhase === "reverting";

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
                : "transition-[fill,stroke,stroke-width,filter] duration-200 ease-out"
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
    </svg>
  );
};

/** Island names above pins — idle muted, brighten on hover with a quick fade. */
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
      <defs>
        <filter
          id="realm-label-shadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="0.25"
            stdDeviation="0.35"
            floodColor="#000000"
            floodOpacity="0.75"
          />
        </filter>
      </defs>
      {(["adventurer", "company"] as RealmSide[]).map((realm) => {
        const active =
          forceHover || hoveredRealm === realm || selectedRealm === realm;
        const anchor = REALM_HIT_LABELS[realm];
        return (
          <text
            key={realm}
            x={anchor.x}
            y={anchor.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`realm-isle-label select-none ${
              active ? "realm-isle-label-active" : ""
            }`}
            fontSize={1.55}
            fontFamily="var(--font-cinzel), serif"
            letterSpacing="0.05"
            paintOrder="stroke fill"
            filter="url(#realm-label-shadow)"
          >
            {realmLabel(realm, labels)}
          </text>
        );
      })}
    </svg>
  );
};
