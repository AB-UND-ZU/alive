import { POPUP } from "../../engine/components/popup";
import { restoreSnapshot, WorldSnapshot } from "../../engine/snapshot";
import { identifyPack } from "../spritePack";
import type { SpriteArtwork } from "../../engine/components/sprite";
import { parseSprite, spriteDefinition, spriteRef } from "../assets/spriteIds";

// 0.9 stored the drawing instructions in the ID, both on full sprites
// (such as dialog text) and on compact SPRITE component references.
export function readLegacyCustomSprite(value: object) {
  if (!("id" in value) || typeof value.id !== "string") return;
  if (!value.id || value.id.charCodeAt(0) >= 16) return;
  if ("layers" in value)
    return parseSprite(spriteDefinition(value as SpriteArtwork));
  if ("custom" in value && value.custom === true)
    return spriteRef(parseSprite(value.id));
}

export function restoreLegacySpriteWorld(snapshot: WorldSnapshot) {
  const world = restoreSnapshot(snapshot, readLegacyCustomSprite);
  for (const entity of world.getEntities([POPUP])) {
    const editor = entity[POPUP].sprite;
    if (editor) editor.sprites = identifyPack(editor.sprites);
  }
  return world;
}
