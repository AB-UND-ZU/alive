import * as THREE from "three";
import { stack, stackHeight, textSize } from "./utils";

/**
 * Shared geometries that are never disposed. Every glyph and box looks the
 * same for all entities, so building one per mounted mesh only costs CPU
 * (triangulation on every mount) and GPU buffers.
 */

export const fontUrl = `${process.env.PUBLIC_URL}/fonts/MostPerfectDOSVGA.json`;

type Font = {
  generateShapes: (text: string, size: number) => THREE.Shape[];
};

const glyphHeight = stackHeight / stack;
const glyphCache = new Map<string, THREE.BufferGeometry>();

// the orthographic camera only ever sees the top face of an extruded glyph,
// so only the face is built and placed where the extruded top would be
export const getGlyphGeometry = (font: Font, char: string) => {
  let geometry = glyphCache.get(char);

  if (!geometry) {
    geometry = new THREE.ShapeGeometry(font.generateShapes(char, textSize), 8);
    geometry.translate(0, 0, glyphHeight);
    geometry.computeBoundingSphere();
    glyphCache.set(char, geometry);
  }

  return geometry;
};

const boxCache = new Map<string, THREE.BoxGeometry>();

export const getBoxGeometry = (
  width: number,
  height: number,
  depth: number
) => {
  const key = `${width}:${height}:${depth}`;
  let geometry = boxCache.get(key);

  if (!geometry) {
    geometry = new THREE.BoxGeometry(width, height, depth);
    boxCache.set(key, geometry);
  }

  return geometry;
};
