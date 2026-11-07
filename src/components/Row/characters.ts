import font from "../../game/assets/font.json";
import { Layer } from "../../engine/components/sprite";

export const characterWidth = 9;
export const characterHeight = 16;
const glyphs = font.glyphs as Record<string, { o?: string }>;
const masks = new Map<string, boolean[]>();
const images = new Map<string, string>();

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

export const composeCharacterPixels = (layers: Layer[], amount?: number) => {
  const pixels: (string | undefined)[] = Array(
    characterWidth * characterHeight
  ).fill(undefined);
  for (const layer of layers) {
    const mask = characterMask(layer.char);
    for (let i = 0; i < mask.length; i++) if (mask[i]) pixels[i] = layer.color;
  }
  if (amount !== undefined && amount > 1)
    for (let i = 0; i < Math.min(amount, 10); i++)
      pixels[(i < 5 ? 13 : 15) * characterWidth + (i % 5) * 2] = "#c0c0c0";
  return pixels;
};

export const characterMarkup = (layers: Layer[], amount?: number) => {
  const key = JSON.stringify([layers, amount]);
  const cached = images.get(key);
  if (cached) return cached;
  const pixels = composeCharacterPixels(layers, amount);
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
  const markup = rects.join("");
  images.set(key, markup);
  return markup;
};
