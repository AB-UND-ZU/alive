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
import { LIGHT } from "../components/light";
import { FOG } from "../components/fog";
import { FRAGMENT } from "../components/fragment";
import { STRUCTURABLE } from "../components/structurable";

export const isFragment = (world: World, entity: Entity) => FRAGMENT in entity;

export const isStructurable = (world: World, entity: Entity) =>
  STRUCTURABLE in entity;

export const isEnterable = (world: World, entity: Entity) =>
  ENTERABLE in entity;

export const getEnterable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isEnterable(world, entity)
  ) as Entity | undefined;

export const getFragment = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isFragment(world, entity)
  ) as Entity | undefined;

export const isOpaque = (world: World, entity: Entity) =>
  LIGHT in entity && entity[LIGHT].darkness > 0;

export const getOpaque = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isOpaque(world, entity)
  ) as Entity | undefined;

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

      const fragment = getFragment(world, entity[POSITION]);
      const enterable = getEnterable(world, entity[POSITION]);
      const currentStructure =
        enterable && !entity[MOVABLE].flying && fragment
          ? fragment[FRAGMENT].structure
          : undefined;
      const previousStructure = entity[PLAYER].structure;

      if (currentStructure !== previousStructure) {
        entity[PLAYER].structure = currentStructure;
        rerenderEntity(world, entity);

        const enterableEntities = world
          .getEntities([ENTERABLE, RENDERABLE, FRAGMENT])
          .filter(
            (building) =>
              building[FRAGMENT].structure ===
              (currentStructure || previousStructure)
          );

        for (const enterableEntity of enterableEntities) {
          enterableEntity[ENTERABLE].inside = currentStructure;
          rerenderEntity(world, enterableEntity);
        }
      }
    }
  };

  return { onUpdate };
}
