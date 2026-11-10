import { Sprite } from "../engine/components/sprite";
import { codePage437 } from "./assets/characters";
import { orderedColors } from "./assets/colors";

const storageKey = "alive.sprites";

export const loadSpritePack = (fallback: Sprite[]): Sprite[] => {
  try {
    const sprites: unknown = JSON.parse(
      localStorage.getItem(storageKey) || "null"
    );
    if (
      Array.isArray(sprites) &&
      sprites.every(
        (sprite) =>
          sprite &&
          typeof sprite.name === "string" &&
          Array.isArray(sprite.layers) &&
          sprite.layers.every(
            (layer: Sprite["layers"][number]) =>
              layer &&
              codePage437.includes(layer.char) &&
              orderedColors.includes(layer.color)
          )
      )
    )
      return sprites.map((sprite) => ({
        name: sprite.name,
        layers: sprite.layers.map((layer: Sprite["layers"][number]) => ({
          char: layer.char,
          color: layer.color,
        })),
      }));
  } catch {}
  return fallback;
};

export const saveSpritePack = (sprites: Sprite[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sprites));
  } catch {}
};
