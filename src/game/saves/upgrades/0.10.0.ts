import { NPC } from "../../../engine/components/npc";
import { POPUP } from "../../../engine/components/popup";
import { createSnapshot } from "../../../engine/snapshot";
import { rock1, rock2 } from "../../assets/sprites";
import type { SaveGame } from "..";
import { restoreLegacySpriteWorld } from "../upgradeSprites";

export default function upgrade(save: SaveGame): SaveGame {
  const world = restoreLegacySpriteWorld(save.snapshot);
  for (const entity of world.metadata.ecs.entities) {
    const popup = entity[POPUP];
    if (entity[NPC]?.type !== "fireDruid" || popup?.deals[0]?.prices[0]?.stackable !== "crystal")
      continue;

    for (const line of popup.lines[popup.tabs.indexOf("quest")] ?? []) {
      const index = line.findIndex((sprite) => sprite.id === rock1.id);
      if (index >= 0) line[index] = rock2;
    }
  }
  return { ...save, snapshot: createSnapshot(world) };
}
