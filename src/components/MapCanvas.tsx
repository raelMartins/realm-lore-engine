'use client';

import React from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { CompanyLoreConfig, LorePin } from '@/types/world';
import * as Icons from 'lucide-react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MapCanvasProps {
  data: CompanyLoreConfig;
  selectedPinId: string | null;
  onSelectPin: (pin: LorePin) => void;
  mapImageUrl?: string;
}

const CanvasControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-amber-500/30 shadow-2xl">
      <button
        type="button"
        onClick={() => zoomIn()}
        className="p-2.5 text-amber-200 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className="p-2.5 text-amber-200 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className="p-2.5 text-amber-200 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors"
        title="Reset Map View"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
};

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[name] || Icons.MapPin;
  return <IconComponent className={className} />;
};

/** Styled parchment + grid shown when no custom map PNG is available. */
const ParchmentFallback = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 1400 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden
  >
    <defs>
      <linearGradient id="parchment-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#292524" />
        <stop offset="45%" stopColor="#1c1917" />
        <stop offset="100%" stopColor="#0c0a09" />
      </linearGradient>
      <radialGradient id="parchment-glow" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#b45309" stopOpacity="0.22" />
        <stop offset="55%" stopColor="#78350f" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
      </radialGradient>
      <pattern id="parchment-grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path
          d="M 48 0 L 0 0 0 48"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="0.6"
          opacity="0.18"
        />
      </pattern>
      <pattern id="parchment-dots" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#fbbf24" opacity="0.12" />
      </pattern>
    </defs>
    <rect width="1400" height="900" fill="url(#parchment-base)" />
    <rect width="1400" height="900" fill="url(#parchment-glow)" />
    <rect width="1400" height="900" fill="url(#parchment-grid)" />
    <rect width="1400" height="900" fill="url(#parchment-dots)" />
    <path
      d="M80 120 C220 80, 380 160, 520 110 S820 40, 980 130 S1220 220, 1320 160"
      fill="none"
      stroke="#d97706"
      strokeWidth="1.2"
      opacity="0.2"
    />
    <path
      d="M100 720 C260 680, 420 760, 600 700 S920 620, 1100 710 S1280 780, 1340 740"
      fill="none"
      stroke="#b45309"
      strokeWidth="1"
      opacity="0.16"
    />
    <circle cx="320" cy="280" r="90" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.12" />
    <circle cx="980" cy="520" r="140" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.1" />
  </svg>
);

export const MapCanvas: React.FC<MapCanvasProps> = ({
  data,
  selectedPinId,
  onSelectPin,
  mapImageUrl,
}) => {
  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
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
              wrapperClassName="!w-full !h-full"
              contentClassName="!w-full !h-full flex items-center justify-center"
            >
              <div className="relative w-[1400px] h-[900px] rounded-2xl shadow-2xl overflow-hidden border border-amber-900/40 bg-slate-900">
                <div className="absolute inset-0">
                  <ParchmentFallback />
                  {mapImageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                      style={{ backgroundImage: `url(${mapImageUrl})` }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-amber-950/20 mix-blend-color pointer-events-none" />
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                </div>

                <div className="absolute inset-0">
                  {data.pins.map((pin) => {
                    const isSelected = selectedPinId === pin.id;

                    return (
                      <button
                        key={pin.id}
                        type="button"
                        onClick={() => onSelectPin(pin)}
                        style={{
                          left: `${pin.coordinates.x}%`,
                          top: `${pin.coordinates.y}%`,
                        }}
                        className={`group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 focus:outline-none z-10 ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                        }`}
                      >
                        <div
                          className={`absolute -inset-3 rounded-full blur-md transition-opacity duration-300 ${
                            isSelected
                              ? 'bg-amber-400 opacity-80 animate-pulse'
                              : 'bg-amber-500/40 opacity-0 group-hover:opacity-100'
                          }`}
                        />

                        <div
                          className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 shadow-xl transition-all duration-300 ${
                            isSelected
                              ? 'bg-amber-500 border-amber-200 text-slate-950 shadow-amber-500/50'
                              : 'bg-slate-900/90 border-amber-500/60 text-amber-300 group-hover:border-amber-400'
                          }`}
                        >
                          <DynamicIcon name={pin.iconName} className="w-6 h-6" />
                        </div>

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-40">
                          <div className="bg-slate-900/95 border border-amber-500/40 px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap text-center">
                            <p className="text-xs font-bold text-amber-200">{pin.title}</p>
                            <p className="text-[10px] text-slate-400">{pin.subtitle}</p>
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
