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

interface MapCanvasProps {
  data: CompanyLoreConfig;
  selectedPinId: string | null;
  onSelectPin: (pin: LorePin) => void;
  mapImageUrl?: string;
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
        onClick={() => resetTransform()}
        className="glass-btn rounded-xl p-2.5 text-realm-mist hover:text-realm-silver"
        title="Reset Map View"
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    </div>
  );
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
    viewBox="0 0 1400 900"
    preserveAspectRatio="xMidYMid slice"
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
      <radialGradient id="atlas-silver" cx="75%" cy="25%" r="40%">
        <stop offset="0%" stopColor="#e8eef2" stopOpacity="0.07" />
        <stop offset="100%" stopColor="#e8eef2" stopOpacity="0" />
      </radialGradient>
      <pattern
        id="atlas-grid"
        width="48"
        height="48"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M 48 0 L 0 0 0 48"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.55"
          opacity="0.16"
        />
      </pattern>
      <pattern
        id="atlas-dots"
        width="24"
        height="24"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1" fill="#5eead4" opacity="0.14" />
      </pattern>
    </defs>
    <rect width="1400" height="900" fill="url(#atlas-base)" />
    <rect width="1400" height="900" fill="url(#atlas-glow)" />
    <rect width="1400" height="900" fill="url(#atlas-silver)" />
    <rect width="1400" height="900" fill="url(#atlas-grid)" />
    <rect width="1400" height="900" fill="url(#atlas-dots)" />
    <path
      d="M80 120 C220 80, 380 160, 520 110 S820 40, 980 130 S1220 220, 1320 160"
      fill="none"
      stroke="#5eead4"
      strokeWidth="1.1"
      opacity="0.18"
    />
    <path
      d="M100 720 C260 680, 420 760, 600 700 S920 620, 1100 710 S1280 780, 1340 740"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="1"
      opacity="0.14"
    />
    <circle
      cx="320"
      cy="280"
      r="90"
      fill="none"
      stroke="#2dd4bf"
      strokeWidth="0.8"
      opacity="0.14"
    />
    <circle
      cx="980"
      cy="520"
      r="140"
      fill="none"
      stroke="#cbd5e1"
      strokeWidth="0.8"
      opacity="0.1"
    />
  </svg>
);

export const MapCanvas: React.FC<MapCanvasProps> = ({
  data,
  selectedPinId,
  onSelectPin,
  mapImageUrl,
}) => {
  return (
    <div className="absolute inset-0 z-0 select-none overflow-hidden bg-realm-void">
      <TransformWrapper
        initialScale={1}
        minScale={0.8}
        maxScale={3}
        centerOnInit
        limitToBounds={false}
      >
        {() => (
          <>
            <CanvasControls />
            <TransformComponent
              wrapperClassName="!h-full !w-full"
              contentClassName="!h-full !w-full"
            >
              <div className="relative h-screen w-screen overflow-hidden bg-realm-deep">
                <div className="absolute inset-0">
                  <AtlasFallback />
                  {mapImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                      style={{ backgroundImage: `url(${mapImageUrl})` }}
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-teal-950/15 mix-blend-color" />
                  <div className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[radial-gradient(#5eead4_1px,transparent_1px)] [background-size:22px_22px]" />
                </div>

                <div className="absolute inset-0">
                  {data.pins.map((pin) => {
                    const isSelected = selectedPinId === pin.id;

                    return (
                      <button
                        key={pin.id}
                        type="button"
                        data-pin-id={pin.id}
                        onClick={() => onSelectPin(pin)}
                        onMouseEnter={() => soundFx.playHoverSound()}
                        style={{
                          left: `${pin.coordinates.x}%`,
                          top: `${pin.coordinates.y}%`,
                        }}
                        className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 focus:outline-none ${
                          isSelected ? "z-30 scale-125" : "hover:scale-110"
                        }`}
                      >
                        <div
                          className={`absolute -inset-3 rounded-full blur-md transition-opacity duration-300 ${
                            isSelected
                              ? "bg-teal-400/70 opacity-80 animate-pulse"
                              : "bg-teal-400/30 opacity-0 group-hover:opacity-100"
                          }`}
                        />

                        <div
                          className={`relative flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition-all duration-300 ${
                            isSelected
                              ? "border-white/60 bg-gradient-to-br from-teal-300 to-teal-600 text-teal-950 shadow-teal-400/40"
                              : "glass-btn border-white/25 text-realm-teal-soft group-hover:border-teal-300/50"
                          }`}
                        >
                          <DynamicIcon
                            name={pin.iconName}
                            className="h-6 w-6"
                          />
                        </div>

                        <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-3 -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                          <div className="glass-panel-strong rounded-2xl px-3.5 py-2 text-center whitespace-nowrap shadow-2xl">
                            <p className="text-xs font-semibold text-realm-silver">
                              {pin.title}
                            </p>
                            <p className="text-[10px] text-realm-silver-muted">
                              {pin.subtitle}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
