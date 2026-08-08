"use client";

import { useEffect, useState } from "react";
import { getCompanyData } from "@/lib/getCompanyData";
import { MapCanvas } from "@/components/MapCanvas";
import { LoreDrawer } from "@/components/LoreDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { RealmOverview } from "@/components/RealmOverview";
import { CompanyLoreConfig, LorePin, RealmSide } from "@/types/world";
import { musicFx, soundFx } from "@/lib/audio";
import { Volume2, VolumeX, Music2, Music } from "lucide-react";

type WorldApiResponse = CompanyLoreConfig & {
  _meta?: { source: string; worldId: string };
};

export default function Home() {
  const [worldData, setWorldData] = useState<CompanyLoreConfig | null>(null);
  const [selectedPin, setSelectedPin] = useState<LorePin | null>(null);
  const [selectedRealm, setSelectedRealm] = useState<RealmSide | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);

  useEffect(() => {
    void musicFx.start();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/world");
        if (!res.ok) throw new Error(`World API ${res.status}`);
        const json = (await res.json()) as WorldApiResponse;
        const { _meta: _ignored, ...data } = json;
        if (!cancelled) setWorldData(data);
      } catch (error) {
        console.error("Failed to load /api/world, using local fallback:", error);
        if (!cancelled) setWorldData(getCompanyData());
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectPin = (pin: LorePin) => {
    soundFx.playSelectSound();
    setSelectedRealm(null);
    setSelectedPin(pin);
  };

  const handleSelectRealm = (realm: RealmSide) => {
    soundFx.playHoverSound();
    setSelectedPin(null);
    setSelectedRealm(realm);
  };

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = async () => {
    const enabled = await musicFx.toggle();
    setMusicOn(enabled);
  };

  if (!worldData) {
    return (
      <main className="realm-atmosphere relative flex h-screen w-full items-center justify-center overflow-hidden">
        <p className="font-display text-sm tracking-[0.2em] text-realm-mist/80 uppercase">
          Charting the realm…
        </p>
      </main>
    );
  }

  return (
    <main className="realm-atmosphere relative h-screen w-full overflow-hidden">
      <CommandPalette
        pins={worldData.pins}
        onSelectPin={handleSelectPin}
        realmLabels={worldData.realmLabels}
      />

      <div className="pointer-events-none absolute top-6 right-6 z-30 flex items-start gap-3">
        <div className="glass-panel pointer-events-auto hidden items-center gap-2.5 rounded-full px-3.5 py-2 text-xs text-realm-mist sm:flex">
          <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse" />
          <span className="font-semibold tracking-wide text-realm-silver">
            {worldData.companyName}
          </span>
        </div>

        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="glass-panel glass-btn rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
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
            onClick={() => void handleToggleMusic()}
            className="glass-panel glass-btn rounded-full p-2.5 text-realm-mist hover:text-realm-silver"
            title={musicOn ? "Mute music" : "Play music"}
          >
            {musicOn ? (
              <Music2 className="h-4 w-4" />
            ) : (
              <Music className="h-4 w-4 opacity-50" />
            )}
          </button>
        </div>
      </div>

      <MapCanvas
        data={worldData}
        selectedPinId={selectedPin?.id || null}
        onSelectPin={handleSelectPin}
        selectedRealm={selectedRealm}
        onSelectRealm={handleSelectRealm}
        mapImageUrl="/maps/realm-map.png"
      />

      <RealmOverview
        realm={selectedRealm}
        data={worldData}
        onClose={() => setSelectedRealm(null)}
        onSelectPin={handleSelectPin}
      />

      <LoreDrawer pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </main>
  );
}
