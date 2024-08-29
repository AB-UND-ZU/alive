import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { unregisterEntity } from "./map";
import { ATTACKABLE } from "../components/attackable";
import { isEmpty } from "./collect";
import { SPRITE } from "../components/sprite";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { PLAYER } from "../components/player";
import { INVENTORY } from "../components/inventory";

export default function setupDrop(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([ATTACKABLE, RENDERABLE])) {
      // remove entity on death
      if (
        isDead(world, entity) &&
        isEmpty(world, entity) &&
        !(PLAYER in entity)
      ) {
        unregisterEntity(world, entity);
        world.removeEntity(entity);
      } else if (isDead(world, entity) && LOOTABLE in entity) {
        entity[SPRITE] = world.getEntityById(entity[INVENTORY].items[0])[
          SPRITE
        ];
      }
    }
  };

  return { onUpdate };
}
