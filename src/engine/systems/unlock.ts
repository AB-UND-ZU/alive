import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { PLAYER } from "../components/player";
import { isDead } from "./damage";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { LOCKABLE } from "../components/lockable";
import { LIGHT } from "../components/light";
import { EQUIPPABLE } from "../components/equippable";

export const getLockable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => LOCKABLE in entity
  ) as Entity | undefined;

export const isLocked = (world: World, position: Position) =>
  !!getLockable(world, position)?.[LOCKABLE]?.locked;

export default function setupUnlock(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle player collecting
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      PLAYER,
      INVENTORY,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if entity already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      // skip if dead
      if (isDead(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getLockable(world, targetPosition);

      if (!targetEntity || !isLocked(world, targetPosition)) continue;

      // mark as interacted
      entity[MOVABLE].lastInteraction = entityReference;

      // handle unlocking
      const keyIndex = entity[INVENTORY].items.findIndex(
        (item: Entity) => world.getEntityById(item)[ITEM].slot === "key"
      );

      if (keyIndex === -1) continue;

      // unlock door
      targetEntity[LOCKABLE].locked = false;
      targetEntity[ORIENTABLE].facing = "down";
      targetEntity[LIGHT].darkness = 0;
      rerenderEntity(world, targetEntity);

      // remove key
      world.removeEntity(keyIndex);
      entity[INVENTORY].items.splice(keyIndex, 1);
      entity[EQUIPPABLE].key = undefined;
      rerenderEntity(world, entity);
    }
  };

  return { onUpdate };
}
