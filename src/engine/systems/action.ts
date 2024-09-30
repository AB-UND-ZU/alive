import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { getCell } from "./map";
import { Entity } from "ecs";
import { QUEST } from "../components/quest";
import { ACTIONABLE } from "../components/actionable";

export const getQuest = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) => QUEST in entity) as
    | Entity
    | undefined;

export default function setupAction(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER]);

    if (!hero || world.metadata.gameEntity[LEVEL].map.length === 0) return;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    let quest: Entity | undefined = undefined;

    // check any adjacent quest
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const delta = { x: offsetX, y: offsetY };
        const targetPosition = add(hero[POSITION], delta);
        const questEntity = getQuest(world, targetPosition);

        if (!quest && questEntity) quest = questEntity;
      }
    }

    hero[ACTIONABLE].quest = quest && world.getEntityId(quest)
  };

  return { onUpdate };
}
