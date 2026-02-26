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
import { isControllable } from "./freeze";
import { CLICKABLE } from "../components/clickable";
import { PLAYER } from "../components/player";
import { rerenderEntity } from "./renderer";
import { isFragment } from "./enter";
import { FRAGMENT } from "../components/fragment";

export const isClickable = (world: World, entity: Entity) =>
  CLICKABLE in entity;

export const getClickables = (world: World, position: Position) =>
  Object.values(getCell(world, position))
    .map((entity) => {
      if (isClickable(world, entity)) return entity;
      if (isFragment(world, entity)) {
        const structurableEntity = world.assertById(entity[FRAGMENT].structure);
        if (isClickable(world, structurableEntity)) return structurableEntity;
      }

      return undefined;
    })
    .filter(Boolean) as Entity[];

export const getClickable = (world: World, position: Position) =>
  getClickables(world, position).find(
    (clickable) => !clickable[CLICKABLE].clicked
  );

export const clickEntity = (
  world: World,
  hero: Entity,
  target: Entity,
  orientation: Orientation
) => {
  hero[ORIENTABLE].facing = orientation;
  hero[MOVABLE].bumpGeneration = hero[RENDERABLE].generation;
  hero[MOVABLE].bumpOrientation = orientation;
  target[CLICKABLE].clicked = true;
  rerenderEntity(world, hero);
};

export default function setupClick(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle player clicking entities
    for (const entity of world.getEntities([POSITION, MOVABLE])) {
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

      // skip if unable to interact
      if (!isControllable(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].momentum ||
        entity[MOVABLE].orientations[0] ||
        entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getClickable(world, targetPosition);

      if (
        !targetEntity ||
        targetEntity[CLICKABLE].clicked ||
        (targetEntity[CLICKABLE].player && !(PLAYER in entity))
      )
        continue;

      clickEntity(world, entity, targetEntity, targetOrientation);

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
