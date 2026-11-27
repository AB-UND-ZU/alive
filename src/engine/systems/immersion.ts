import { hasComponent, TypedEntity } from "../entities";
import { IMMERSIBLE } from "../components/immersible";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { SWIMMABLE } from "../components/swimmable";
import { World } from "../ecs";
import { getCellEntities } from "./map";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { REFERENCE } from "../components/reference";
import { SPRITE } from "../components/sprite";
import { getOverlappingCell } from "../../game/math/matrix";
import { LEVEL } from "../components/level";

export const getImmersible = (world: World, position: Position) =>
  getCellEntities(world, position).find((entity) => hasComponent(entity, IMMERSIBLE));

export const isImmersible = (world: World, position: Position) =>
  !!getImmersible(world, position);

export const isSwimmable = (world: World, entity: TypedEntity) =>
  hasComponent(entity, SWIMMABLE);

export const isSwimming = (world: World, entity: TypedEntity) =>
  entity[SWIMMABLE]?.swimming;

export const getSwimmables = (world: World, position: Position) =>
  getCellEntities(world, position).filter((entity) =>
    isSwimmable(world, entity)
  );

export const hasWater = (world: World, position: Position) => {
  const level = world.metadata.gameEntity[LEVEL];
  return isImmersible(world, position) || (
    !getOverlappingCell(level.initialized, position.x, position.y) &&
    ["water", "water_shallow", "water_deep"].includes(
      getOverlappingCell(level.cells, position.x, position.y)
    )
  );
};

export const isSubmerged = (world: World, position: Position) =>
  hasWater(world, position) &&
  [-1, 0, 1].every((x) => [-1, 0, 1].every((y) =>
    hasWater(world, { x: position.x + x, y: position.y + y })
  ));

export default function setupImmersion(world: World) {
  let referencesGeneration = -1;
  const entityGenerations: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([POSITION, SWIMMABLE, SPRITE])) {
      const entityId = world.getEntityId(entity);
      const entityGeneration = getEntityGeneration(world, entity);

      if (entityGenerations[entityId] === entityGeneration) continue;

      entityGenerations[entityId] = entityGeneration;

      const isSwimming = entity[SWIMMABLE].swimming;
      const shouldSwim = isImmersible(world, entity[POSITION]);

      if (isSwimming !== shouldSwim) {
        entity[SWIMMABLE].swimming = shouldSwim;

        const swapSprite = entity[SWIMMABLE].sprite;
        if (swapSprite) {
          entity[SWIMMABLE].sprite = entity[SPRITE];
          entity[SPRITE] = swapSprite;
        }
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
