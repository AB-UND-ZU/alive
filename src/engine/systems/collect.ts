import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { PLAYER } from "../components/player";
import { isDead } from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { COUNTABLE } from "../components/countable";
import { entities } from "..";
import { Animatable, ANIMATABLE } from "../components/animatable";

export const isLootable = (world: World, entity: Entity) =>
  LOOTABLE in entity && entity[LOOTABLE].accessible && INVENTORY in entity && !isEmpty(world, entity);

export const getLootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isLootable(world, entity)
  ) as Entity | undefined;

export const isEmpty = (world: World, entity: Entity) =>
  !(INVENTORY in entity) ||
  !(LOOTABLE in entity) ||
  entity[INVENTORY].items.length === 0;

export default function setupCollect(world: World) {
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
      EQUIPPABLE,
      INVENTORY,
      COUNTABLE,
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
      const targetEntity = getLootable(world, targetPosition);

      if (!targetEntity || !targetEntity[LOOTABLE].accessible) continue;

      // handle pick up
      const itemId = targetEntity[INVENTORY].items[0];

      if (!itemId) continue;

      // initiate collecting animation on player
      const itemEntity = world.getEntityById(itemId);
      const animationEntity = entities.createAnimation(world, {
        [REFERENCE]: {
          tick: -1,
          delta: 0,
          suspended: false,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: 1 },
      });
      (entity[ANIMATABLE] as Animatable).states.collect = {
        name: "itemCollect",
        reference: world.getEntityId(animationEntity),
        elapsed: 0,
        args: { facing: targetOrientation, itemId },
        particles: {},
      };

      // reduce counter items
      if (itemEntity[ITEM].counter) {
        itemEntity[ITEM].amount -= 1;
      }

      // remove from target inventory
      if (itemEntity[ITEM].slot || itemEntity[ITEM].amount === 0) {
        itemEntity[ITEM].carrier = entityId;
        targetEntity[INVENTORY].items.splice(
          targetEntity[INVENTORY].items.indexOf(itemId),
          1
        );
      }

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
