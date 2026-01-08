import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import {
  calculateDamage,
  createAmountMarker,
  getEntityStats,
  isFightable,
} from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { rerenderEntity } from "./renderer";
import { STATS } from "../components/stats";
import { ATTACKABLE } from "../components/attackable";
import { MELEE } from "../components/melee";
import { relativeOrientations } from "../../game/math/path";
import { isControllable } from "./freeze";
import { play } from "../../game/sound";
import { CONDITIONABLE } from "../components/conditionable";

export const isSpikable = (world: World, entity: Entity) => {
  if (!isFightable(world, entity)) return false;

  const entityStats = getEntityStats(world, entity);

  return entityStats.spike > 0;
};

export const getSpikable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isSpikable(world, entity)
  ) as Entity | undefined;

export const stingEntity = (world: World, entity: Entity, target: Entity) => {
  let displayedDamage = 0;

  // burst active bubble
  if (target[CONDITIONABLE]?.block) {
    delete target[CONDITIONABLE].block;
  } else {
    const entityStats = getEntityStats(world, entity);
    const attack = entityStats.spike;

    const { damage, hp } = calculateDamage(
      world,
      { true: attack },
      entity,
      target
    );

    target[STATS].hp = hp;

    play("magic", { intensity: damage, proximity: 0.5 });
    displayedDamage = damage;
  }

  const orientation = relativeOrientations(
    world,
    entity[POSITION],
    target[POSITION]
  )[0];
  // animate sting hit
  createAmountMarker(world, target, -displayedDamage, orientation, "magic");

  rerenderEntity(world, target);
};

export default function setupSpike(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle entities running into spikes
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      STATS,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if not controllable or flying
      if (!isControllable(world, entity) || entity[MOVABLE].flying) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getSpikable(world, targetPosition);

      if (!targetEntity) continue;

      stingEntity(world, targetEntity, entity);

      // already mark as interacted if not able to attack
      if (
        targetEntity[ATTACKABLE] &&
        !(entity[MELEE] && entity[EQUIPPABLE]?.sword)
      ) {
        entity[MOVABLE].pendingOrientation = undefined;
        entity[MOVABLE].lastInteraction = entityReference;
      }
    }
  };

  return { onUpdate };
}
