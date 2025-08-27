import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { registerEntity } from "./map";
import { LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { none } from "../../game/assets/sprites";
import { add, copy, random } from "../../game/math/std";
import { RainSequence, SEQUENCABLE } from "../components/sequencable";
import { createSequence } from "./sequence";
import { LEVEL } from "../components/level";
import { VIEWABLE } from "../components/viewable";

export const createDrop = (world: World, position: Position) => {
  const dropEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "unit" },
    [LIQUID]: { type: "rain" },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"rain", RainSequence>(world, dropEntity, "rain", "rainDrop", {
    height: 12,
  });
  registerEntity(world, dropEntity);
};

export default function setupWeather(world: World) {
  const entityReferences: Record<string, number> = {};
  let worldGeneration = -1;

  const onUpdate = (delta: number) => {
    const currentWorldGeneration =
      world.metadata.gameEntity[RENDERABLE].generation;
    const worldId = world.getEntityId(world.metadata.gameEntity);
    const viewables = world.getEntities([VIEWABLE, POSITION]);
    const viewable = viewables
      .filter((entity) => entity[VIEWABLE].active)
      .sort(
        (left, right) => right[VIEWABLE].priority - left[VIEWABLE].priority
      )[0];

    if (worldGeneration === currentWorldGeneration || !viewable) return;

    worldGeneration = currentWorldGeneration;

    // schedule rain
    if (!entityReferences[worldId]) {
      entityReferences[worldId] = currentWorldGeneration + random(350, 2000);
    }

    // start rain
    if (
      !world.metadata.gameEntity[LEVEL].weather &&
      (world.metadata.gameEntity[LEVEL].name === "LEVEL_OVERWORLD" ||
        entityReferences[worldId] < currentWorldGeneration)
    ) {
      world.metadata.gameEntity[LEVEL].weather = "rain";
      entityReferences[worldId] = currentWorldGeneration + random(150, 350);
    }

    if (world.metadata.gameEntity[LEVEL].weather === "rain") {
      // stop rain
      if (entityReferences[worldId] < currentWorldGeneration) {
        world.metadata.gameEntity[LEVEL].weather = undefined;
        delete entityReferences[worldId];
        return;
      }

      // generate several drops per world tick
      for (let i = 0; i < 10; i += 1) {
        const offset = { x: random(-15, 15), y: random(-15, 15) };
        createDrop(world, add(viewable[POSITION], offset));
      }
    }
  };

  return { onUpdate };
}
