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
    <main className="realm-atmosphere relative h-screen w-full overflow-hidden">
      <CommandPalette pins={worldData.pins} onSelectPin={handleSelectPin} />

      <div className="pointer-events-none absolute top-6 right-6 z-30 flex items-center gap-3">
        <div className="glass-panel pointer-events-auto hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-xs text-realm-mist sm:flex">
          <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse" />
          <span className="font-semibold tracking-wide text-realm-silver">
            {worldData.companyName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleMute}
          className="glass-panel glass-btn pointer-events-auto rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
          title={isMuted ? "Unmute Audio" : "Mute Audio"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <MapCanvas
        data={worldData}
        selectedPinId={selectedPin?.id || null}
        onSelectPin={handleSelectPin}
      />

      <LoreDrawer pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </main>
  );
}
