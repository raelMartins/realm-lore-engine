"use client";

import { useState } from "react";
import { getCompanyData } from "@/lib/getCompanyData";
import { MapCanvas } from "@/components/MapCanvas";
import { LorePin } from "@/types/world";

export default function Home() {
  const worldData = getCompanyData();
  const [selectedPin, setSelectedPin] = useState<LorePin | null>(null);

  return (
    <main className="w-full h-screen overflow-hidden bg-slate-950">
      <MapCanvas
        data={worldData}
        selectedPinId={selectedPin?.id || null}
        onSelectPin={(pin) => setSelectedPin(pin)}
      />
    </main>
  );
}
