import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { rerenderEntity } from "./renderer";
import { ENTERABLE } from "../components/enterable";
import { LIGHT } from "../components/light";
import { FRAGMENT } from "../components/fragment";
import { STRUCTURABLE } from "../components/structurable";
import { VIEWABLE } from "../components/viewable";
import { LAYER } from "../components/layer";
import { PLAYER } from "../components/player";
import { getLockable } from "./action";

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

export const isOutside = (world: World, entity: Entity, structure?: number) =>
  !!structure && entity[LAYER]?.structure !== structure;

export default function setupEnter(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle entities entering and leaving structures
    for (const entity of world.getEntities([LAYER, POSITION, RENDERABLE])) {
      const entityId = world.getEntityId(entity);
      const entityReference = entity[MOVABLE]
        ? world.assertByIdAndComponents(entity[MOVABLE].reference, [
            RENDERABLE,
          ])[RENDERABLE].generation
        : entity[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const fragment = getFragment(world, entity[POSITION]);
      const lockable = getLockable(world, entity[POSITION]);
      const previousStructure = entity[LAYER].structure;
      const currentStructure =
        !entity[MOVABLE]?.flying &&
        fragment &&
        world.getEntityByIdAndComponents(fragment[FRAGMENT].structure, [
          STRUCTURABLE,
        ])?.[VIEWABLE] &&
        !(previousStructure && lockable)
          ? fragment[FRAGMENT].structure
          : undefined;

      if (currentStructure !== previousStructure) {
        entity[LAYER].structure = currentStructure;
        rerenderEntity(world, entity);

        // trigger rerender for enterables
        if (entity[PLAYER]) {
          const enterableEntities = world
            .getEntities([ENTERABLE, RENDERABLE, FRAGMENT, LAYER])
            .filter(
              (building) =>
                building[FRAGMENT].structure === currentStructure ||
                building[FRAGMENT].structure === previousStructure
            );

          for (const enterableEntity of enterableEntities) {
            rerenderEntity(world, enterableEntity);
          }

          // center viewpoint in building
          if (currentStructure) {
            const currentEntity = world.assertByIdAndComponents(
              currentStructure,
              [STRUCTURABLE, VIEWABLE]
            );
            currentEntity[VIEWABLE].active = true;
          } else if (previousStructure) {
            const previousEntity = world.assertByIdAndComponents(
              previousStructure,
              [STRUCTURABLE, VIEWABLE]
            );
            previousEntity[VIEWABLE].active = false;
          }
        }
      }
    }
  };

  return { onUpdate };
}
