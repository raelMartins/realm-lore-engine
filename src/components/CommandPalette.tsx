"use client";

import React, { useEffect, useState } from "react";
import { LorePin } from "@/types/world";
import { Search, MapPin, X } from "lucide-react";

interface CommandPaletteProps {
  pins: LorePin[];
  onSelectPin: (pin: LorePin) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  pins,
  onSelectPin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Toggle modal on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredPins =
    query === ""
      ? pins
      : pins.filter((pin) => {
          const searchText =
            `${pin.title} ${pin.subtitle} ${pin.content.tags?.join(" ") || ""}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-6 left-6 z-20 flex items-center gap-3 bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 px-4 py-2.5 rounded-xl text-slate-400 text-xs shadow-2xl backdrop-blur-md transition-all group"
      >
        <Search className="w-4 h-4 text-amber-400" />
        <span>Search map lore & nodes...</span>
        <kbd className="bg-slate-800 border border-slate-700 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-amber-500/20">
          <Search className="w-5 h-5 text-amber-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a topic, skill, or node title..."
            className="w-full bg-transparent text-amber-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredPins.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">
              No matching lore nodes found.
            </p>
          ) : (
            filteredPins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => {
                  onSelectPin(pin);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-amber-500/10 hover:border hover:border-amber-500/30 transition-all text-left group"
              >
                <div className="p-2 bg-slate-800 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-200">
                    {pin.title}
                  </p>
                  <p className="text-xs text-slate-400">{pin.subtitle}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
