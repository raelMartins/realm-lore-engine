"use client";

import React from "react";
import {
  Compass,
  Hand,
  MapPinPlus,
  MousePointer2,
  Music,
  Music2,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { MapInteractMode } from "@/components/MapInteractToolbar";
import { useMapZoom } from "@/components/MapZoomContext";

export type MapActionBanner = {
  title: string;
  body: string;
  hint?: string | null;
  onCancel?: () => void;
  cancelLabel?: string;
};

interface MapBottomDockProps {
  explored: number;
  total: number;
  onClearExploration?: () => void;
  mode: MapInteractMode;
  onModeChange: (mode: MapInteractMode) => void;
  /** Chart / move require guild steward unlock. */
  guildEnabled: boolean;
  onRequestUnlock?: (intent: "move" | "chart") => void;
  onChartPin?: () => void;
  chartActive?: boolean;
  isMuted: boolean;
  musicOn: boolean;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  disabled?: boolean;
  actionBanner?: MapActionBanner | null;
}

/**
 * Bottom-center HUD: action info above a single horizontal pill
 * (audio · exploration · interact · zoom).
 */
export function MapBottomDock({
  explored,
  total,
  onClearExploration,
  mode,
  onModeChange,
  guildEnabled,
  onRequestUnlock,
  onChartPin,
  chartActive = false,
  isMuted,
  musicOn,
  onToggleMute,
  onToggleMusic,
  disabled = false,
  actionBanner = null,
}: MapBottomDockProps) {
  const zoom = useMapZoom();

  const safeTotal = Math.max(total, 0);
  const safeExplored = Math.min(Math.max(explored, 0), safeTotal || 0);
  const pct = safeTotal > 0 ? (safeExplored / safeTotal) * 100 : 0;
  const complete = safeTotal > 0 && safeExplored >= safeTotal;
  const canClear = Boolean(onClearExploration) && safeExplored > 0;

  const toolBtn = (active: boolean) =>
    `pointer-events-auto glass-btn flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40 ${
      active
        ? "border border-teal-400/40 text-teal-100"
        : "text-realm-mist hover:text-realm-silver"
    }`;

  const selectMove = () => {
    if (disabled) return;
    if (!guildEnabled) {
      onRequestUnlock?.("move");
      return;
    }
    onModeChange("move");
  };

  const selectChart = () => {
    if (disabled) return;
    if (!guildEnabled) {
      onRequestUnlock?.("chart");
      return;
    }
    onChartPin?.();
  };

  return (
    <div className="pointer-events-none absolute left-1/2 z-30 flex w-[min(100%-1.25rem,42rem)] -translate-x-1/2 flex-col items-stretch gap-2 hud-safe-bc">
      {actionBanner && (
        <div className="glass-panel-strong pointer-events-auto rounded-2xl px-3.5 py-2.5 text-[11px] leading-snug text-realm-mist">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-realm-silver">
                {actionBanner.title}
              </p>
              <p className="mt-0.5 text-realm-silver-muted">
                {actionBanner.body}
              </p>
              {actionBanner.hint && (
                <p className="mt-1.5 text-amber-200/90">{actionBanner.hint}</p>
              )}
            </div>
            {actionBanner.onCancel && (
              <button
                type="button"
                onClick={actionBanner.onCancel}
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-realm-teal-soft hover:text-realm-silver"
              >
                {actionBanner.cancelLabel ?? "Cancel"}
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="exploration-progress-panel glass-panel pointer-events-none flex items-center gap-1.5 rounded-full px-1.5 py-1.5 sm:gap-2 sm:px-2"
        role="group"
        aria-label="Map tools and exploration"
      >
        {/* Audio */}
        <div
          className="flex shrink-0 items-center gap-0.5 pl-0.5"
          role="toolbar"
          aria-label="Audio"
        >
          <button
            type="button"
            onClick={onToggleMute}
            disabled={disabled}
            className={toolBtn(false)}
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleMusic}
            disabled={disabled}
            className={toolBtn(false)}
            title={musicOn ? "Mute music" : "Play music"}
          >
            {musicOn ? (
              <Music2 className="h-4 w-4" />
            ) : (
              <Music className="h-4 w-4 opacity-50" />
            )}
          </button>
        </div>

        <div className="h-7 w-px shrink-0 bg-white/15" aria-hidden />

        {/* Exploration */}
        <div
          className="flex min-w-0 flex-1 items-center gap-2 px-1 sm:px-1.5"
          role="status"
          aria-label={`Realm exploration ${safeExplored} of ${safeTotal}`}
        >
          <Compass className="h-3.5 w-3.5 shrink-0 text-realm-teal-soft" />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-realm-teal-soft sm:inline">
                Exploration
              </span>
              <span
                className={`font-mono text-[10px] tabular-nums sm:text-[11px] ${
                  complete ? "text-teal-300" : "text-realm-mist"
                }`}
              >
                {safeExplored}/{safeTotal}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-black/35">
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
          {onClearExploration && (
            <button
              type="button"
              onClick={onClearExploration}
              disabled={!canClear}
              aria-label="Clear exploration progress"
              title="Clear exploration progress"
              className="pointer-events-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/25 text-realm-mist transition hover:border-teal-400/40 hover:bg-teal-950/50 hover:text-teal-200 disabled:pointer-events-none disabled:opacity-30"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="h-7 w-px shrink-0 bg-white/15" aria-hidden />

        {/* Interact + zoom */}
        <div
          className="flex shrink-0 items-center gap-0.5 pr-0.5"
          role="toolbar"
          aria-label="Map tools"
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModeChange("explore")}
            aria-pressed={mode === "explore" && !chartActive}
            title="Explore — pan, zoom, open lore"
            className={toolBtn(mode === "explore" && !chartActive)}
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={selectMove}
            aria-pressed={mode === "move"}
            title={
              guildEnabled
                ? "Move — drag guild pins on shore land"
                : "Unlock guild chart to move pins"
            }
            className={toolBtn(mode === "move")}
          >
            <Hand className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={selectChart}
            aria-pressed={chartActive}
            title={
              guildEnabled
                ? "Chart a pin on Guild Shore"
                : "Unlock guild chart to place pins"
            }
            className={toolBtn(chartActive)}
          >
            <MapPinPlus className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-white/15" aria-hidden />

          <button
            type="button"
            onClick={() => zoom?.zoomIn()}
            disabled={disabled || !zoom}
            className={toolBtn(false)}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom?.zoomOut()}
            disabled={disabled || !zoom}
            className={toolBtn(false)}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom?.resetTransform(400, "easeOut")}
            disabled={disabled || !zoom}
            className={toolBtn(false)}
            title="Reset Map View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
