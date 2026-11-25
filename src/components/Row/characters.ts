import font from "../../game/assets/font.json";
import { Layer } from "../../engine/components/sprite";

export const characterWidth = 9;
export const characterHeight = 16;
const glyphs = font.glyphs as Record<string, { o?: string }>;
const masks = new Map<string, boolean[]>();

export const characterMask = (char: string) => {
  const cached = masks.get(char);
  if (cached) return cached;
  const outline = (glyphs[char]?.o || "").trim().split(/\s+/);
  const polygons: [number, number][][] = [];
  for (let i = 0; i < outline.length; i += 3) {
    if (outline[i] === "m") polygons.push([]);
    if (outline[i] === "m" || outline[i] === "l")
      polygons[polygons.length - 1].push([
        Math.round(Number(outline[i + 1]) / 87),
        12 - Math.round(Number(outline[i + 2]) / 87),
      ]);
  }
  const mask = Array.from(
    { length: characterWidth * characterHeight },
    (_, index) => {
      const x = (index % characterWidth) + 0.5,
        y = Math.floor(index / characterWidth) + 0.5;
      let inside = false;
      for (const polygon of polygons)
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [xi, yi] = polygon[i],
            [xj, yj] = polygon[j];
          const above = yi > y;
          const previousAbove = yj > y;
          const crosses = above !== previousAbove;
          if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
            inside = !inside;
        }
      return inside;
    }
  );
  masks.set(char, mask);
  return mask;
};

export const composeCharacterPixels = (layers: Layer[], dots?: number) => {
  const pixels: (string | undefined)[] = Array(
    characterWidth * characterHeight
  ).fill(undefined);
  for (const layer of layers) {
    const mask = characterMask(layer.char);
    for (let i = 0; i < mask.length; i++) if (mask[i]) pixels[i] = layer.color;
  }
  if (dots)
    for (let i = 0; i < Math.min(dots, 10); i++)
      pixels[(i < 5 ? 13 : 15) * characterWidth + (i % 5) * 2] = "#c0c0c0";
  return pixels;
};

export const characterMarkup = (layers: Layer[], dots?: number) => {
  const pixels = composeCharacterPixels(layers, dots);
  const rects: string[] = [];
  for (let y = 0; y < characterHeight; y++)
    for (let x = 0; x < characterWidth; ) {
      const color = pixels[y * characterWidth + x];
      let end = x + 1;
      while (end < characterWidth && pixels[y * characterWidth + end] === color)
        end++;
      if (color)
        rects.push(
          `<rect x="${x}" y="${y}" width="${
            end - x
          }" height="1" fill="${color}"/>`
        );
      x = end;
    }
  return rects.join("");
};

const images = new Map<string, string>();

export const characterImage = (layers: Layer[], dots?: number) => {
  const count = dots && Math.min(dots, 10);
  const key = JSON.stringify([layers, count]);
  let image = images.get(key);
  if (!image) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" preserveAspectRatio="none" shape-rendering="crispEdges">${characterMarkup(
      layers,
      count
    )}</svg>`;
    image = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    images.set(key, image);
  }
  return image;
};
