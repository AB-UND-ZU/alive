import { populateInventory } from "../../../bindings/creation";
import { INVENTORY } from "../../../engine/components/inventory";
import { POSITION } from "../../../engine/components/position";
import { spriteRef } from "../../assets/spriteIds";
import { brewingRecipes } from "../../balancing/brewing";
import { getChickSprite } from "../../balancing/units";
import { NPC } from "../../../engine/components/npc";
import { POPUP } from "../../../engine/components/popup";
import { getStackable } from "../../../engine/systems/collect";
import { placeTownPet } from "../../../engine/systems/petCare";
import { isWalkable } from "../../../engine/systems/movement";
import { getIdentifierAndComponents } from "../../../engine/utils";
import { townSize } from "../../levels/island/areas";
import { signedDistance } from "../../math/std";
import { createSnapshot } from "../../../engine/snapshot";
import { rock1, rock2 } from "../../assets/sprites";
import type { SaveGame } from "..";
import { restoreLegacySpriteWorld } from "../upgradeSprites";

export default function upgrade(save: SaveGame): SaveGame {
  const world = restoreLegacySpriteWorld(save.snapshot);
  for (const entity of world.metadata.ecs.entities) {
    if (entity[NPC]?.type === "chick" && entity.STATS && entity.STATS.hp > 0) {
      const raw = { stackable: "raw", amount: 1 } as const;
      const chick = world.assertComponents(entity, [INVENTORY, POSITION]);
      if (!getStackable(world, chick, raw)) {
        chick.SPRITE = spriteRef(getChickSprite());
        populateInventory(world, chick, [raw]);
      }
    }
    const popup = entity[POPUP];
    // New recipe and ingredient options are appended, preserving saved selection indices.
    if (entity.BREWABLE && popup?.tabs.includes("brew")) popup.recipes = brewingRecipes;
    if (entity[NPC]?.type !== "fireDruid" || popup?.deals[0]?.prices[0]?.stackable !== "crystal")
      continue;

    for (const line of popup.lines[popup.tabs.indexOf("quest")] ?? []) {
      const index = line.findIndex((sprite) => sprite.id === rock1.id);
      if (index >= 0) line[index] = rock2;
    }
  }
  const level = world.metadata.gameEntity.LEVEL;
  const town = getIdentifierAndComponents(world, "earth_town", [POSITION]);
  if (town && !level.cellPositions.pet?.length && !world.getEntity(["TAMEABLE"])) {
    const streets = (level.cellPositions.path || []).filter(p =>
      Math.abs(signedDistance(town.POSITION.x, p.x, level.size)) < townSize.x / 2 &&
      Math.abs(signedDistance(town.POSITION.y, p.y, level.size)) < townSize.y / 2 &&
      level.cells[p.x][p.y] === "path" && isWalkable(world, p)
    );
    placeTownPet(world, streets);
  }
  return { ...save, snapshot: createSnapshot(world) };
}
