import type { CSSProperties } from "react";

/**
 * Map coordinate system (Phase 1)
 * --------------------------------
 * The realm map image is 1024×531 (ratio ≈ 1.9284).
 *
 * All interactive layers share ONE space:
 *   - Pin `coordinates.x` / `coordinates.y` are percentages 0–100
 *   - SVG overlays use viewBox="0 0 100 100" with the same percentages
 *   - (0,0) = top-left of the map art · (100,100) = bottom-right
 *   - (50,50) = geometric image center (in the channel; visual mid-strait ≈ 52–55%)
 *
 * Dual-realm placement (Phases 2–3):
 *   - Adventurer pins: prefer x ≲ 45 (left island)
 *   - Company pins: prefer x ≳ 58 (right island)
 *
 * The MapStage is sized with CSS `aspect-ratio` matching the image and
 * `object-fit: fill` (not cover), so nothing is cropped. Pins/trails/SVGs
 * therefore stay locked to the painted geography under pan/zoom.
 */

export const MAP_IMAGE_WIDTH = 1024;
export const MAP_IMAGE_HEIGHT = 531;
export const MAP_ASPECT_RATIO = MAP_IMAGE_WIDTH / MAP_IMAGE_HEIGHT; // ≈ 1.9284

/** CSS aspect-ratio value for the map stage */
export const MAP_ASPECT_RATIO_CSS = `${MAP_IMAGE_WIDTH} / ${MAP_IMAGE_HEIGHT}`;

/**
 * Contain the map stage inside the viewport while preserving aspect ratio.
 * Equivalent to: width = min(100vw, 100vh * aspect), height follows ratio.
 */
export const MAP_STAGE_SIZE_STYLE: CSSProperties = {
  width: `min(100dvw, 100vw, calc(100dvh * ${MAP_ASPECT_RATIO}), calc(100vh * ${MAP_ASPECT_RATIO}))`,
  aspectRatio: MAP_ASPECT_RATIO_CSS,
};

/** Toggle the Phase 1 calibration crosshair at (50, 50). */
export const SHOW_MAP_CALIBRATION = false;

/** Soft horizontal guide for dual-realm placement (not a hard split). */
export const REALM_SPLIT_HINT_X = 52;
