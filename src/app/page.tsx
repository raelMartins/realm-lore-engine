"use client";

import { useState } from "react";
import { getCompanyData } from "@/lib/getCompanyData";
import { MapCanvas } from "@/components/MapCanvas";
import { LoreDrawer } from "@/components/LoreDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { LorePin } from "@/types/world";

export default function Home() {
  const worldData = getCompanyData();
  const [selectedPin, setSelectedPin] = useState<LorePin | null>(null);

  return (
    <main className="w-full h-screen overflow-hidden bg-slate-950 relative">
      {/* Top Left Search Palette Button / Modal Trigger */}
      <CommandPalette
        pins={worldData.pins}
        onSelectPin={(pin) => setSelectedPin(pin)}
      />

      {/* Main Interactive Map Canvas */}
      <MapCanvas
        data={worldData}
        selectedPinId={selectedPin?.id || null}
        onSelectPin={(pin) => setSelectedPin(pin)}
      />

      {/* Right Slide-Over Lore Drawer */}
      <LoreDrawer pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </main>
  );
}
