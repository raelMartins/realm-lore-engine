"use client";

import React from "react";
import { Compass, X } from "lucide-react";

interface ExplorationProgressProps {
  explored: number;
  total: number;
  onClear?: () => void;
}

export const ExplorationProgress: React.FC<ExplorationProgressProps> = ({
  explored,
  total,
  onClear,
}) => {
  const safeTotal = Math.max(total, 0);
  const safeExplored = Math.min(Math.max(explored, 0), safeTotal || 0);
  const pct = safeTotal > 0 ? (safeExplored / safeTotal) * 100 : 0;
  const complete = safeTotal > 0 && safeExplored >= safeTotal;
  const canClear = Boolean(onClear) && safeExplored > 0;

  return (
    <div
      className="exploration-progress-panel glass-panel pointer-events-none flex w-[min(100vw-2rem,280px)] flex-col gap-1.5 rounded-2xl px-3.5 py-2.5"
      role="status"
      aria-label={`Realm exploration ${safeExplored} of ${safeTotal}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-realm-teal-soft">
          <Compass className="h-3 w-3" />
          Realm exploration
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono text-[11px] tabular-nums ${
              complete ? "text-teal-300" : "text-realm-mist"
            }`}
          >
            {safeExplored} / {safeTotal}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={!canClear}
              aria-label="Clear exploration progress"
              title="Clear exploration progress"
              className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/25 text-realm-mist transition hover:border-teal-400/40 hover:bg-teal-950/50 hover:text-teal-200 disabled:pointer-events-none disabled:opacity-30"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/35">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
            complete
              ? "bg-gradient-to-r from-teal-400 to-amber-200"
              : "bg-gradient-to-r from-teal-600 to-teal-300"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
