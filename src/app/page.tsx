"use client";

import { useEffect, useMemo, useState } from "react";
import { getCompanyData } from "@/lib/getCompanyData";
import { MapCanvas } from "@/components/MapCanvas";
import { LoreDrawer } from "@/components/LoreDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { RealmOverview } from "@/components/RealmOverview";
import { GuildChartControls } from "@/components/GuildChartControls";
import { ExplorationProgress } from "@/components/ExplorationProgress";
import { CompanyLoreConfig, LorePin, RealmSide } from "@/types/world";
import { musicFx, soundFx } from "@/lib/audio";
import {
  PLACEMENT_ERROR_MESSAGE,
  validateGuildPlacement,
} from "@/lib/world/placement";
import {
  countExploredDiscoverable,
  loadExploredPinIds,
  markPinExplored,
} from "@/lib/exploration";
import { Volume2, VolumeX, Music2, Music } from "lucide-react";

type WorldApiResponse = CompanyLoreConfig & {
  _meta?: { source: string; worldId: string };
};

export default function Home() {
  const [worldData, setWorldData] = useState<CompanyLoreConfig | null>(null);
  const [worldId, setWorldId] = useState("default");
  const [selectedPin, setSelectedPin] = useState<LorePin | null>(null);
  const [selectedRealm, setSelectedRealm] = useState<RealmSide | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);

  const [unlocked, setUnlocked] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<{
    coordinates: { x: number; y: number };
  } | null>(null);
  const [placeHint, setPlaceHint] = useState<string | null>(null);
  const [spawnPinId, setSpawnPinId] = useState<string | null>(null);
  const [exploredIds, setExploredIds] = useState<Set<string>>(() => new Set());

  const refreshWorld = async () => {
    const res = await fetch("/api/world");
    if (!res.ok) throw new Error(`World API ${res.status}`);
    const json = (await res.json()) as WorldApiResponse;
    const { _meta, ...data } = json;
    if (_meta?.worldId) setWorldId(_meta.worldId);
    setWorldData(data);
    return { data, worldId: _meta?.worldId ?? "default" };
  };

  useEffect(() => {
    void musicFx.start();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, worldId: id } = await refreshWorld();
        if (cancelled) return;
        setWorldData(data);
        setWorldId(id);
        setExploredIds(loadExploredPinIds(id));
      } catch (error) {
        console.error("Failed to load /api/world, using local fallback:", error);
        if (!cancelled) {
          setWorldData(getCompanyData());
          setExploredIds(loadExploredPinIds("default"));
        }
      }

      try {
        const unlockRes = await fetch("/api/guild/unlock");
        if (unlockRes.ok) {
          const status = (await unlockRes.json()) as { unlocked?: boolean };
          if (!cancelled && status.unlocked) setUnlocked(true);
        }
      } catch {
        /* explore-only if unlock status fails */
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const exploration = useMemo(() => {
    if (!worldData) return { explored: 0, total: 0 };
    return countExploredDiscoverable(worldData.pins, exploredIds);
  }, [worldData, exploredIds]);

  const handleSelectPin = (pin: LorePin) => {
    if (placing) return;
    soundFx.playSelectSound();
    setSelectedRealm(null);
    setSelectedPin(pin);
    setExploredIds((prev) => markPinExplored(worldId, pin, prev));
  };

  const handleSelectRealm = (realm: RealmSide) => {
    if (placing) return;
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

  const handlePlaceAttempt = (coords: { x: number; y: number }) => {
    if (!worldData) return;
    const guildPins = worldData.pins.filter((p) => p.realm === "company");
    const error = validateGuildPlacement(coords, guildPins);
    if (error) {
      setPlaceHint(PLACEMENT_ERROR_MESSAGE[error]);
      soundFx.playHoverSound();
      return;
    }
    setPlaceHint(null);
    setPlacing(false);
    setDraft({
      coordinates: {
        x: Math.round(coords.x * 10) / 10,
        y: Math.round(coords.y * 10) / 10,
      },
    });
    soundFx.playSelectSound();
  };

  const handlePinCreated = async (pinId: string) => {
    try {
      await refreshWorld();
      setSpawnPinId(pinId);
      window.setTimeout(() => setSpawnPinId(null), 900);
      soundFx.playSelectSound();
    } catch (error) {
      console.error("Failed to refresh world after pin create:", error);
    }
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
      <div className="pointer-events-none absolute top-6 left-6 z-30 flex flex-col items-start gap-2">
        <div className="pointer-events-auto">
          <CommandPalette
            pins={worldData.pins}
            onSelectPin={handleSelectPin}
            realmLabels={worldData.realmLabels}
          />
        </div>
        <ExplorationProgress
          explored={exploration.explored}
          total={exploration.total}
        />
      </div>

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
        placementMode={placing}
        onPlaceAttempt={handlePlaceAttempt}
        spawnPinId={spawnPinId}
      />

      <GuildChartControls
        unlocked={unlocked}
        onUnlocked={() => setUnlocked(true)}
        placing={placing}
        onStartPlace={() => {
          setSelectedPin(null);
          setSelectedRealm(null);
          setPlaceHint(null);
          setPlacing(true);
        }}
        onCancelPlace={() => {
          setPlacing(false);
          setPlaceHint(null);
        }}
        draft={draft}
        onClearDraft={() => setDraft(null)}
        onPinCreated={(pinId) => void handlePinCreated(pinId)}
        placeHint={placeHint}
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
