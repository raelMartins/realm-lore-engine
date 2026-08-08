"use client";

import React from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { CompanyLoreConfig, LorePin } from "@/types/world";
import * as Icons from "lucide-react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { soundFx } from "@/lib/audio";
import { QuestTrail } from "@/components/QuestTrail";
import { RealmHitLayer } from "@/components/RealmHitLayer";
import {
  MAP_STAGE_SIZE_STYLE,
  SHOW_MAP_CALIBRATION,
} from "@/lib/mapCoordinates";
import { RealmSide } from "@/types/world";
import { getAvatarById } from "@/config/avatars";
import type { HireMotion } from "@/lib/hire";

export type CameraCommand =
  | {
      type: "focus-pin";
      pinId: string;
      scale?: number;
      durationMs?: number;
      token: number;
    }
  | { type: "reset"; token: number; durationMs?: number };

interface MapCanvasProps {
  data: CompanyLoreConfig;
  selectedPinId: string | null;
  onSelectPin: (pin: LorePin) => void;
  selectedRealm: RealmSide | null;
  onSelectRealm: (realm: RealmSide) => void;
  mapImageUrl?: string;
  /** When true, clicks on the map stage pick guild placement coords. */
  placementMode?: boolean;
  onPlaceAttempt?: (coords: { x: number; y: number }) => void;
  /** Briefly animate this pin id after creation. */
  spawnPinId?: string | null;
  /** Shared alliance look across both isles. */
  united?: boolean;
  /** Pin playing exit motion (departure). */
  exitPinId?: string | null;
  exitMotion?: HireMotion | null;
  /** Pin playing enter motion (arrival). */
  enterPinId?: string | null;
  enterMotion?: HireMotion | null;
  /** True while hire cinematic is playing — soft-locks map chrome. */
  hireBusy?: boolean;
  /** Hide pin visually but keep it in the DOM for camera focus. */
  hiddenPinId?: string | null;
  /** One-shot camera instructions for hire cinematic / restore. */
  cameraCommand?: CameraCommand | null;
}

const CanvasControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="glass-panel pointer-events-auto absolute bottom-6 right-6 z-30 flex flex-col gap-1.5 rounded-2xl p-1.5">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="glass-btn rounded-xl p-2.5 text-realm-mist hover:text-realm-silver"
        title="Zoom In"
      >
        <ZoomIn className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className="glass-btn rounded-xl p-2.5 text-realm-mist hover:text-realm-silver"
        title="Zoom Out"
      >
        <ZoomOut className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => resetTransform(400, "easeOut")}
        className="glass-btn rounded-xl p-2.5 text-realm-mist hover:text-realm-silver"
        title="Reset Map View"
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </div>
  );
};

/** Invisible focus targets for zoomToElement — sized to each island. */
const RealmFocusTargets = () => (
  <>
    <div
      id="realm-focus-adventurer"
      className="pointer-events-none absolute"
      style={{ left: "12%", top: "8%", width: "34%", height: "82%" }}
      aria-hidden
    />
    <div
      id="realm-focus-company"
      className="pointer-events-none absolute"
      style={{ left: "56%", top: "12%", width: "40%", height: "84%" }}
      aria-hidden
    />
  </>
);

/**
 * Realm overview zoom, plus hire-cinematic camera commands.
 */
const MapFocusController = ({
  selectedRealm,
  cameraCommand,
  cinematicLock,
}: {
  selectedRealm: RealmSide | null;
  cameraCommand?: CameraCommand | null;
  cinematicLock?: boolean;
}) => {
  const { zoomToElement, resetTransform } = useControls();
  const previousRealm = React.useRef<RealmSide | null>(null);
  const lastToken = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!cameraCommand || cameraCommand.token === lastToken.current) return;
    lastToken.current = cameraCommand.token;

    if (cameraCommand.type === "reset") {
      resetTransform(cameraCommand.durationMs ?? 420, "easeOut");
      previousRealm.current = null;
      return;
    }

    const id = `pin-focus-${cameraCommand.pinId}`;
    const scale = cameraCommand.scale ?? 2.65;
    const duration = cameraCommand.durationMs ?? 560;
    const t = window.setTimeout(() => {
      zoomToElement(id, scale, duration, "easeOut");
    }, 50);
    return () => window.clearTimeout(t);
  }, [cameraCommand, zoomToElement, resetTransform]);

  React.useEffect(() => {
    if (cinematicLock || cameraCommand) return;

    if (selectedRealm) {
      const id = `realm-focus-${selectedRealm}`;
      const t = window.setTimeout(() => {
        zoomToElement(id, 2.15, 480, "easeOut");
      }, 40);
      previousRealm.current = selectedRealm;
      return () => window.clearTimeout(t);
    }

    if (previousRealm.current) {
      resetTransform(420, "easeOut");
      previousRealm.current = null;
    }
  }, [
    selectedRealm,
    cinematicLock,
    cameraCommand,
    zoomToElement,
    resetTransform,
  ]);

  return null;
};

const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const icons = Icons as unknown as Record<
    string,
    React.ComponentType<{ className?: string }>
  >;
  const IconComponent = icons[name] || Icons.MapPin;
  return <IconComponent className={className} />;
};

/** Soft teal atlas grid shown when no custom map PNG is available. */
const AtlasFallback = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    aria-hidden
  >
    <defs>
      <linearGradient id="atlas-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a1a22" />
        <stop offset="45%" stopColor="#071319" />
        <stop offset="100%" stopColor="#040a0e" />
      </linearGradient>
      <radialGradient id="atlas-glow" cx="45%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.16" />
        <stop offset="50%" stopColor="#0d9488" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#atlas-base)" />
    <rect width="100" height="100" fill="url(#atlas-glow)" />
  </svg>
);

/**
 * Phase 1 calibration: crosshair at map (50, 50).
 * Should sit in the water channel between the two islands.
 */
const CalibrationMarker = () => (
  <div
    className="pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-1/2"
    style={{ left: "50%", top: "50%" }}
    aria-hidden
  >
    <div className="relative flex h-10 w-10 items-center justify-center">
      <span className="absolute h-px w-10 bg-teal-300/90" />
      <span className="absolute h-10 w-px bg-teal-300/90" />
      <span className="absolute h-2.5 w-2.5 rounded-full border border-teal-200 bg-teal-400/40 shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
    </div>
    <p className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-2 py-0.5 font-mono text-[9px] text-teal-200">
      50, 50
    </p>
  </div>
);

export const MapCanvas: React.FC<MapCanvasProps> = ({
  data,
  selectedPinId,
  onSelectPin,
  selectedRealm,
  onSelectRealm,
  mapImageUrl,
  placementMode = false,
  onPlaceAttempt,
  spawnPinId = null,
  united = false,
  exitPinId = null,
  exitMotion = null,
  enterPinId = null,
  enterMotion = null,
  hireBusy = false,
  hiddenPinId = null,
  cameraCommand = null,
}) => {
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode || !onPlaceAttempt) return;
    const stage = e.currentTarget;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlaceAttempt({ x, y });
  };

  return (
    <div
      className={`absolute inset-0 z-0 select-none overflow-hidden bg-realm-void ${
        united ? "realm-united" : ""
      }`}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        limitToBounds
        doubleClick={{ disabled: true }}
        panning={{
          disabled: placementMode,
          excluded: ["button", "[data-realm-hit]"],
        }}
        wheel={{ step: 0.08 }}
      >
        {() => (
          <>
            <CanvasControls />
            <MapFocusController
              selectedRealm={selectedRealm}
              cameraCommand={cameraCommand}
              cinematicLock={hireBusy}
            />
            <TransformComponent
              wrapperClass="!flex !h-full !w-full !items-center !justify-center"
              contentClass="!w-auto !h-auto"
            >
              {/*
                MapStage — fixed aspect matching realm-map.png (1024×531).
                Pin % and SVG 0–100 viewBox both refer to this box only.
              */}
              <div
                className={`relative overflow-hidden bg-[#1a1410] shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] ${
                  placementMode ? "cursor-crosshair" : ""
                }`}
                style={MAP_STAGE_SIZE_STYLE}
                data-map-stage
                onClick={handleStageClick}
              >
                <RealmFocusTargets />
                {/* Map art — never steal clicks from realm hits / pins */}
                <div className="pointer-events-none absolute inset-0">
                  {mapImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mapImageUrl}
                        alt="Realm map"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-fill select-none"
                        style={{
                          filter:
                            "sepia(0.42) contrast(1.12) saturate(0.78) brightness(0.92) hue-rotate(-8deg)",
                        }}
                      />
                      <div className="absolute inset-0 bg-[#c4a574]/18 mix-blend-multiply" />
                      <div className="absolute inset-0 bg-[#2a1f14]/25 mix-blend-overlay" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,6,4,0.55)_100%)]" />
                    </>
                  ) : (
                    <>
                      <AtlasFallback />
                      <div className="absolute inset-0 bg-[#c4a574]/12 mix-blend-multiply" />
                      <div className="absolute inset-0 bg-teal-950/15 mix-blend-color" />
                    </>
                  )}
                </div>

                <div className="pointer-events-none absolute inset-0 z-[4] shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />

                {/* Island hit regions — above map art, below pin buttons */}
                <div
                  className={`absolute inset-0 z-[1] ${
                    placementMode ? "pointer-events-none" : ""
                  }`}
                >
                  <RealmHitLayer
                    labels={data.realmLabels}
                    selectedRealm={selectedRealm}
                    onSelectRealm={onSelectRealm}
                  />
                </div>

                {/* Quest routes — same 0–100 space as pins */}
                <QuestTrail pins={data.pins} united={united} />

                {united && (
                  <div
                    className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_30%_45%,rgba(45,212,191,0.14),transparent_45%),radial-gradient(ellipse_at_75%_50%,rgba(245,158,11,0.12),transparent_48%)] mix-blend-screen"
                    aria-hidden
                  />
                )}

                {/* Pin layer passes events through empty space to realms */}
                <div className="pointer-events-none absolute inset-0 z-[2]">
                  {data.pins.map((pin) => {
                    const isSelected = selectedPinId === pin.id;
                    const isCompany = pin.realm === "company";
                    const avatar = getAvatarById(pin.avatarId);
                    const showAvatar =
                      pin.category === "character" && Boolean(avatar);
                    const isSpawn = spawnPinId === pin.id;
                    const isExiting =
                      exitPinId === pin.id && Boolean(exitMotion);
                    const isEntering =
                      enterPinId === pin.id && Boolean(enterMotion);
                    const exitClass =
                      exitMotion === "portal"
                        ? "hire-exit-portal"
                        : exitMotion === "burst"
                          ? "hire-exit-burst"
                          : exitMotion === "shrink"
                            ? "hire-exit-shrink"
                            : "";
                    const enterClass =
                      enterMotion === "portal"
                        ? "hire-enter-portal"
                        : enterMotion === "burst"
                          ? "hire-enter-burst"
                          : enterMotion === "shrink"
                            ? "hire-enter-shrink"
                            : "";

                    const isHidden = hiddenPinId === pin.id;

                    return (
                      <button
                        key={pin.id}
                        id={`pin-focus-${pin.id}`}
                        type="button"
                        data-pin-id={pin.id}
                        data-realm={pin.realm}
                        onClick={(e) => {
                          if (placementMode || hireBusy || isHidden) {
                            e.stopPropagation();
                            return;
                          }
                          onSelectPin(pin);
                        }}
                        onMouseEnter={() => {
                          if (!placementMode && !hireBusy && !isHidden) {
                            soundFx.playHoverSound();
                          }
                        }}
                        style={{
                          left: `${pin.coordinates.x}%`,
                          top: `${pin.coordinates.y}%`,
                          opacity: isHidden ? 0 : 1,
                        }}
                        className={`group pointer-events-auto absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none ${
                          isSelected ? "z-30 scale-125" : "hover:scale-110"
                        } ${isExiting || isEntering || isHidden || hireBusy || placementMode ? "" : "transition-all duration-300"} ${
                          placementMode || hireBusy || isHidden
                            ? "pointer-events-none"
                            : ""
                        } ${
                          united && isCompany
                            ? "ring-1 ring-teal-300/30"
                            : ""
                        }`}
                        aria-hidden={isHidden}
                      >
                        <div
                          key={`${pin.id}-${
                            isExiting
                              ? `exit-${exitMotion}`
                              : isEntering
                                ? `enter-${enterMotion}`
                                : isSpawn
                                  ? "spawn"
                                  : "idle"
                          }`}
                          className={
                            [
                              isSpawn && !isEntering
                                ? "animate-[pin-spawn_0.7s_ease-out]"
                                : "",
                              isExiting ? exitClass : "",
                              isEntering ? enterClass : "",
                            ]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                        >
                        <div
                          className={`absolute -inset-3 rounded-full blur-md transition-opacity duration-300 ${
                            isSelected
                              ? isCompany
                                ? "bg-amber-300/60 opacity-80 animate-pulse"
                                : "bg-teal-400/70 opacity-80 animate-pulse"
                              : isCompany
                                ? "bg-amber-200/25 opacity-0 group-hover:opacity-100"
                                : "bg-teal-400/30 opacity-0 group-hover:opacity-100"
                          }`}
                        />

                        <div
                          className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border shadow-xl transition-all duration-300 ${
                            isSelected
                              ? isCompany
                                ? "border-white/60 bg-gradient-to-br from-slate-100 to-amber-400 text-slate-900 shadow-amber-400/35"
                                : "border-white/60 bg-gradient-to-br from-teal-300 to-teal-600 text-teal-950 shadow-teal-400/40"
                              : isCompany
                                ? "glass-btn border-amber-200/35 text-realm-mist group-hover:border-amber-300/55"
                                : "glass-btn border-white/25 text-realm-teal-soft group-hover:border-teal-300/50"
                          }`}
                        >
                          {showAvatar && avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatar.src}
                              alt=""
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <DynamicIcon
                              name={pin.iconName}
                              className="h-5 w-5"
                            />
                          )}
                        </div>

                        <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-3 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                          <div className="glass-panel-strong rounded-2xl px-3.5 py-2 text-center whitespace-nowrap shadow-2xl">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-realm-teal-soft">
                              {pin.category}
                              {" · "}
                              {pin.realm === "company"
                                ? data.realmLabels?.company || "Guild Shore"
                                : data.realmLabels?.adventurer ||
                                  "Adventurer's Reach"}
                            </p>
                            <p className="text-xs font-semibold text-realm-silver">
                              {pin.title}
                            </p>
                            <p className="text-[10px] text-realm-silver-muted">
                              {pin.subtitle}
                            </p>
                          </div>
                        </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {SHOW_MAP_CALIBRATION && <CalibrationMarker />}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
