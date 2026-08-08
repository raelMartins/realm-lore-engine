"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface SecretToastProps {
  message: string | null;
}

export const SecretToast: React.FC<SecretToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none fixed bottom-8 left-1/2 z-[85] w-[min(100%-2rem,360px)] -translate-x-1/2"
        >
          <div className="glass-panel-strong flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm text-realm-silver shadow-2xl">
            <Sparkles className="h-4 w-4 shrink-0 text-teal-300" />
            <p>{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
