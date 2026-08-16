"use client";

import React, { createContext, useContext } from "react";
import { useControls } from "react-zoom-pan-pinch";

export type MapZoomApi = {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetTransform: (animationTime?: number, animationType?: string) => void;
};

const MapZoomContext = createContext<MapZoomApi | null>(null);

/** Publishes zoom controls from inside TransformWrapper. */
export function MapZoomBridge({
  onReady,
}: {
  onReady?: (api: MapZoomApi) => void;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  React.useEffect(() => {
    const api: MapZoomApi = { zoomIn, zoomOut, resetTransform };
    onReady?.(api);
  }, [zoomIn, zoomOut, resetTransform, onReady]);

  return null;
}

export function useMapZoom(): MapZoomApi | null {
  return useContext(MapZoomContext);
}

export function MapZoomProvider({
  api,
  children,
}: {
  api: MapZoomApi | null;
  children: React.ReactNode;
}) {
  return (
    <MapZoomContext.Provider value={api}>{children}</MapZoomContext.Provider>
  );
}
