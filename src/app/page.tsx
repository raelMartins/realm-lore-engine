"use client";

import { useState } from "react";
import { getCompanyData } from "@/lib/getCompanyData";
import { MapCanvas } from "@/components/MapCanvas";
import { LoreDrawer } from "@/components/LoreDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { LorePin } from "@/types/world";
import { soundFx } from "@/lib/audio";
import { Volume2, VolumeX } from "lucide-react";

export default function Home() {
  const worldData = getCompanyData();
  const [selectedPin, setSelectedPin] = useState<LorePin | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleSelectPin = (pin: LorePin) => {
    soundFx.playSelectSound();
    setSelectedPin(pin);
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  return (
    <main className="w-full h-screen overflow-hidden bg-slate-950 relative">
      {/* Top Left: Search Command Palette */}
      <CommandPalette pins={worldData.pins} onSelectPin={handleSelectPin} />

      {/* Top Right: Sound Toggle Button & Company Tagline Badge */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl text-amber-200 text-xs shadow-2xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold">{worldData.companyName}</span>
        </div>

        <button
          onClick={handleToggleMute}
          className="p-2.5 bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 text-amber-300 rounded-xl shadow-2xl backdrop-blur-md transition-all"
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Interactive Canvas */}
      <MapCanvas
        data={worldData}
        selectedPinId={selectedPin?.id || null}
        onSelectPin={handleSelectPin}
      />

      {/* Slide-over Drawer */}
      <LoreDrawer pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </main>
  );
}
