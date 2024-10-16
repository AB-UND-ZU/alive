import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell, updateWalkable } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { COUNTABLE } from "../components/countable";
import { entities } from "..";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { rerenderEntity } from "./renderer";
import { isTradable } from "./action";
import { removeFromInventory } from "./trigger";

export const isLootable = (world: World, entity: Entity) =>
  LOOTABLE in entity &&
  INVENTORY in entity &&
  !isEmpty(world, entity) &&
  !isTradable(world, entity);

export const getLootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isLootable(world, entity)
  ) as Entity | undefined;

export const isEmpty = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  LOOTABLE in entity &&
  entity[INVENTORY].items.length === 0 &&
  !entity[ANIMATABLE]?.states.collect;

export const isFull = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  entity[INVENTORY].items.length >= entity[INVENTORY].size;

export const collectItem = (world: World, entity: Entity, target: Entity) => {
  // handle pick up
  for (
    let itemIndex = target[INVENTORY].items.length - 1;
    itemIndex >= 0;
    itemIndex -= 1
  ) {
    const itemId = target[INVENTORY].items[itemIndex];
    const itemEntity = world.getEntityById(itemId);
    // reduce counter items
    const counter = itemEntity[ITEM].counter;
    const slot = itemEntity[ITEM].slot;
    const consume = itemEntity[ITEM].consume;
    if (counter) {
      // skip if counter exceeded
      if (
        entity[COUNTABLE][counter] >= 99 ||
        (["hp", "mp"].includes(counter) &&
          entity[COUNTABLE][counter] >= entity[COUNTABLE].xp)
      )
        continue;

      itemEntity[ITEM].amount -= 1;
    } else if (slot && isFull(world, entity)) {
      // skip if inventory full
      continue;
    }

    // remove from target inventory
    if (slot || consume || (counter && itemEntity[ITEM].amount === 0)) {
      removeFromInventory(world, target, itemEntity);
    }

    // assign new carrier on discrete items
    if (!counter){
      itemEntity[ITEM].carrier = world.getEntityId(entity)
    }

    // initiate collecting animation on player
    const animationEntity = entities.createFrame(world, {
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
      args: { origin: target[POSITION], itemId },
      particles: {},
    };

    // update walkable
    updateWalkable(world, target[POSITION]);

    rerenderEntity(world, target);
    break;
  }
};

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

      if (!targetEntity) continue;

      collectItem(world, entity, targetEntity);

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
