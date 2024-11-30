import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { rerenderEntity } from "./renderer";
import { ENTERABLE } from "../components/enterable";
import { PLAYER } from "../components/player";
import { LEVEL } from "../components/level";
import { add, copy, signedDistance } from "../../game/math/std";
import { LIGHT } from "../components/light";
import { FOG } from "../components/fog";

export const isEnterable = (world: World, entity: Entity) =>
  ENTERABLE in entity;

export const getEnterable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isEnterable(world, entity)
  ) as Entity | undefined;

export const isOpaque = (world: World, entity: Entity) =>
  LIGHT in entity && entity[LIGHT].darkness > 0;

export const isOutside = (world: World, entity: Entity) =>
  (!isEnterable(world, entity) && isOpaque(world, entity)) ||
  (!entity[ENTERABLE]?.inside &&
    (isOpaque(world, entity) || entity[FOG]?.type === "float"));

export default function setupEnter(world: World) {
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
      PLAYER,
      POSITION,
      MOVABLE,
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

      const size = world.metadata.gameEntity[LEVEL].size;
      const enterable = getEnterable(world, entity[POSITION]);
      const currentInside = !!enterable && !entity[PLAYER].flying;
      const previousInside = entity[PLAYER].inside;

      if (currentInside !== previousInside) {
        entity[PLAYER].inside = currentInside;
        rerenderEntity(world, entity);
        let enterableEntities: Entity[] = [];

        if (enterable && currentInside) {
          enterableEntities.push(enterable);

          // find left edge of building
          let leftCursor = copy(enterable[POSITION]);
          while (true) {
            const target = getEnterable(
              world,
              add(leftCursor, { x: -1, y: 0 })
            );

            if (!target) break;

            leftCursor = target[POSITION];
            enterableEntities.push(target);
          }

          // find right edge of building
          let rightCursor = copy(enterable[POSITION]);
          while (true) {
            const target = getEnterable(
              world,
              add(rightCursor, { x: 1, y: 0 })
            );

            if (!target) break;

            rightCursor = target[POSITION];
            enterableEntities.push(target);
          }

          // fill remaining part of building
          let upCursor = copy(leftCursor);
          while (true) {
            const position =
              signedDistance(upCursor.x, rightCursor.x, size) === 0
                ? { x: leftCursor.x, y: upCursor.y - 1 }
                : add(upCursor, { x: 1, y: 0 });
            const target = getEnterable(world, position);

            if (!target) break;

            upCursor = target[POSITION];
            enterableEntities.push(target);
          }
        } else {
          // reset enterable entities
          enterableEntities = world.getEntities([ENTERABLE, RENDERABLE]);
        }

        for (const enterableEntity of enterableEntities) {
          enterableEntity[ENTERABLE].inside = currentInside;
          rerenderEntity(world, enterableEntity);
        }
      }
    }
  };

  return { onUpdate };
}
