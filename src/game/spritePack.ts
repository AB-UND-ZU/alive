import { Sprite, SpriteArtwork } from "../engine/components/sprite";
import { codePage437 } from "./assets/characters";
import { orderedColors } from "./assets/colors";

const storageKey = "alive.sprites";

export function identifyPack(
  artworks: (SpriteArtwork & { id?: string })[]
): Sprite[] {
  const used = new Set<string>();
  return artworks.map((artwork, index) => {
    let id = artwork.id;
    if (!id || !/^sprite_[1-9][0-9]*$/.test(id) || used.has(id)) {
      let number = index + 1;
      do {
        id = `sprite_${number++}`;
      } while (used.has(id));
    }
    used.add(id);
    return { ...artwork, id };
  });
}

export const loadSpritePack = (fallback: SpriteArtwork[]): Sprite[] => {
  try {
    const sprites: unknown = JSON.parse(
      localStorage.getItem(storageKey) || "null"
    );
    if (
      Array.isArray(sprites) &&
      sprites.every(
        (sprite) =>
          sprite &&
          (sprite.name === undefined || typeof sprite.name === "string") &&
          Array.isArray(sprite.layers) &&
          sprite.layers.every(
            (layer: Sprite["layers"][number]) =>
              layer &&
              codePage437.includes(layer.char) &&
              orderedColors.includes(layer.color)
          )
      )
    )
      return identifyPack(
        sprites.map((sprite) => ({
          id: typeof sprite.id === "string" ? sprite.id : undefined,
          name: sprite.name,
          layers: sprite.layers.map((layer: Sprite["layers"][number]) => ({
            char: layer.char,
            color: layer.color,
          })),
        }))
      );
  } catch {}
  return identifyPack(fallback);
};

export const saveSpritePack = (sprites: Sprite[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(sprites));
  } catch {}
};
