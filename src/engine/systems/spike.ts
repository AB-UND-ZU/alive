import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { calculateDamage, isDead } from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { rerenderEntity } from "./renderer";
import { createSequence } from "./sequence";
import { HitSequence } from "../components/sequencable";
import { STATS } from "../components/stats";
import { SPIKABLE } from "../components/spikable";

export const isSpikable = (world: World, entity: Entity) =>
  SPIKABLE in entity && !isDead(world, entity);

export const getSpikable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isSpikable(world, entity)
  ) as Entity | undefined;

export const stingEntity = (world: World, entity: Entity, target: Entity) => {
  const attack = entity[SPIKABLE].damage;

  const { damage, hp } = calculateDamage(
    "magic",
    attack,
    0,
    entity[STATS],
    target[STATS]
  );

  target[STATS].hp = hp;

  // animate sting hit
  createSequence<"hit", HitSequence>(world, target, "hit", "damageHit", {
    damage,
  });

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
      EQUIPPABLE,
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

      // skip if dead
      if (isDead(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getSpikable(world, targetPosition);

      if (!targetEntity) continue;

      stingEntity(world, targetEntity, entity);
    }
  };

  return { onUpdate };
}
