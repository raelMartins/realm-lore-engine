"use client";

import React, { useState } from "react";
import { RealmSide } from "@/types/world";
import { REALM_HIT_LABELS, REALM_HIT_PATHS } from "@/config/realmHitPaths";

interface RealmHitLayerProps {
  labels?: {
    adventurer?: string;
    company?: string;
  };
  selectedRealm: RealmSide | null;
  onSelectRealm: (realm: RealmSide) => void;
}

const REALM_FILL: Record<
  RealmSide,
  { idle: string; hover: string; selected: string; stroke: string; strokeIdle: string }
> = {
  adventurer: {
    idle: "rgba(45, 212, 191, 0.12)",
    hover: "rgba(45, 212, 191, 0.38)",
    selected: "rgba(45, 212, 191, 0.42)",
    stroke: "rgba(94, 234, 212, 0.95)",
    strokeIdle: "rgba(94, 234, 212, 0.45)",
  },
  company: {
    idle: "rgba(251, 191, 36, 0.1)",
    hover: "rgba(245, 158, 11, 0.36)",
    selected: "rgba(245, 158, 11, 0.4)",
    stroke: "rgba(253, 230, 138, 0.95)",
    strokeIdle: "rgba(253, 230, 138, 0.4)",
  },
};

const DEFAULT_NAMES: Record<RealmSide, string> = {
  adventurer: "Adventurer's Reach",
  company: "Guild Shore",
};

export const RealmHitLayer: React.FC<RealmHitLayerProps> = ({
  labels,
  selectedRealm,
  onSelectRealm,
}) => {
  const [hovered, setHovered] = useState<RealmSide | null>(null);

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
        const active = hovered === realm || selectedRealm === realm;
        const fill = REALM_FILL[realm];
        const label = labels?.[realm] || DEFAULT_NAMES[realm];
        const anchor = REALM_HIT_LABELS[realm];

        return (
          <g key={realm}>
            <path
              d={REALM_HIT_PATHS[realm]}
              data-realm-hit={realm}
              fill={
                selectedRealm === realm
                  ? fill.selected
                  : hovered === realm
                    ? fill.hover
                    : fill.idle
              }
              stroke={active ? fill.stroke : fill.strokeIdle}
              strokeWidth={active ? 2.5 : 1.5}
              vectorEffect="non-scaling-stroke"
              filter={active ? "url(#realm-hover-glow)" : undefined}
              className="cursor-pointer transition-[fill,stroke-width] duration-200"
              onMouseEnter={() => setHovered(realm)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRealm(realm);
              }}
            />
            <text
              x={anchor.x}
              y={anchor.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none"
              fill={active ? "#f8fafc" : "rgba(226, 232, 240, 0.7)"}
              fontSize={2.4}
              fontFamily="var(--font-cinzel), serif"
              letterSpacing="0.06"
              style={{
                textShadow: "0 1px 3px rgba(0,0,0,0.75)",
              }}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
