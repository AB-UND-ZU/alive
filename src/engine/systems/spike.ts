import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { calculateDamage, createAmountMarker, isDead } from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { rerenderEntity } from "./renderer";
import { STATS } from "../components/stats";
import { SPIKABLE } from "../components/spikable";
import { ATTACKABLE } from "../components/attackable";
import { MELEE } from "../components/melee";
import { relativeOrientations } from "../../game/math/path";

export const isSpikable = (world: World, entity: Entity) =>
  SPIKABLE in entity && !isDead(world, entity);

export const getSpikable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isSpikable(world, entity)
  ) as Entity | undefined;

export const stingEntity = (world: World, entity: Entity, target: Entity) => {
  const attack = entity[SPIKABLE].damage;

  const { damage, hp } = calculateDamage(
    "true",
    attack,
    0,
    entity[STATS],
    target[STATS]
  );

  target[STATS].hp = hp;

  const orientation = relativeOrientations(
    world,
    entity[POSITION],
    target[POSITION]
  )[0];
  // animate sting hit
  createAmountMarker(world, target, -damage, orientation);

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

    // handle player running into spikes
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

      // skip if entity already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      // skip if dead or flying
      if (isDead(world, entity) || entity[MOVABLE].flying) continue;

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
