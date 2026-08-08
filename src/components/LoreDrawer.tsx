"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LorePin } from "@/types/world";
import { X, ExternalLink, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";

interface LoreDrawerProps {
  pin: LorePin | null;
  onClose: () => void;
}

const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  // @ts-ignore dynamic lookup
  const IconComponent = Icons[name] || Icons.MapPin;
  return <IconComponent className={className} />;
};

export const LoreDrawer: React.FC<LoreDrawerProps> = ({ pin, onClose }) => {
  return (
    <AnimatePresence>
      {pin && (
        <>
          {/* Backdrop overlay for mobile / focus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:bg-transparent md:backdrop-blur-none pointer-events-auto"
          />

          {/* Slide-over Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900/95 border-l border-amber-500/30 text-slate-100 p-6 z-50 overflow-y-auto shadow-2xl backdrop-blur-md flex flex-col justify-between"
          >
            <div>
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-6">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                    <DynamicIcon name={pin.iconName} className="w-5 h-5" />
                  </span>
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                    {pin.content.badge || pin.category}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl font-bold text-amber-100">{pin.title}</h2>
              <p className="text-sm text-slate-400 mb-6">{pin.subtitle}</p>

              {/* Description Body */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-300 mb-6">
                {pin.content.description}
              </div>

              {/* Attribute Stats Bar Component */}
              {pin.content.stats && pin.content.stats.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Attributes & Proficiency
                  </h3>
                  <div className="space-y-3">
                    {pin.content.stats.map((stat) => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{stat.label}</span>
                          <span className="text-amber-400 font-mono font-bold">
                            {stat.value}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.value}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {pin.content.tags && pin.content.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
                    Key Tech & Concepts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {pin.content.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-slate-800 text-amber-200/90 px-2.5 py-1 rounded-md border border-amber-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Call to Action & External Links */}
            <div className="pt-6 border-t border-amber-500/20 space-y-3">
              {pin.content.externalLink && (
                <a
                  href={pin.content.externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/30 font-medium text-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  {pin.content.externalLink.label}
                </a>
              )}

              {pin.content.callToAction && (
                <a
                  href={pin.content.callToAction.target}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  {pin.content.callToAction.label}
                </a>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
