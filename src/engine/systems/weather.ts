import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { registerEntity } from "./map";
import { LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { none } from "../../game/assets/sprites";
import { add, copy, lerp, random } from "../../game/math/std";
import { RainSequence, SEQUENCABLE } from "../components/sequencable";
import { createSequence } from "./sequence";
import { LEVEL } from "../components/level";
import { VIEWABLE } from "../components/viewable";

export const createDrop = (
  world: World,
  position: Position,
  parallax: number
) => {
  const dropEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "object" },
    [LIQUID]: { type: "rain" },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"rain", RainSequence>(world, dropEntity, "rain", "rainDrop", {
    height: 12,
    fast: parallax > 0,
  });
  registerEntity(world, dropEntity);
};

export const calculateRainIntensity = (
  duration: number,
  current: number,
  scale: number
): number => {
  if (current < 0 || current > duration) return 0;

  if (!Number.isFinite(duration)) return Math.min(current / 10, scale);

  const attack = 0.1 * duration;
  const release = 0.9 * duration;

  if (current <= attack) {
    return lerp(0, scale, current / attack);
  }
  if (current <= release) {
    return scale;
  }
  return lerp(scale, 0, (current - release) / (duration - release));
};

export default function setupWeather(world: World) {
  const entityReferences: Record<string, number> = {};
  const entityDurations: Record<string, number> = {};
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

    const permaRain = world.metadata.gameEntity[LEVEL].name === "LEVEL_MENU";
    const noRain = world.metadata.gameEntity[LEVEL].name === "LEVEL_TUTORIAL";

    // schedule rain in forest
    if (!entityReferences[worldId] && !noRain) {
      entityReferences[worldId] =
        currentWorldGeneration + (permaRain ? 10 : random(350, 2000));
      delete entityDurations[worldId];
    }

    // start rain
    if (
      !world.metadata.gameEntity[LEVEL].weather &&
      entityReferences[worldId] < currentWorldGeneration
    ) {
      world.metadata.gameEntity[LEVEL].weather = "rain";
      entityDurations[worldId] = permaRain ? Infinity : random(150, 350);
    }

    if (world.metadata.gameEntity[LEVEL].weather === "rain") {
      // stop rain
      if (
        currentWorldGeneration >
        entityReferences[worldId] + entityDurations[worldId]
      ) {
        world.metadata.gameEntity[LEVEL].weather = undefined;
        delete entityReferences[worldId];
        delete entityDurations[worldId];
        return;
      }

      // generate several drops per world tick
      for (
        let i = 0;
        i <
        calculateRainIntensity(
          entityDurations[worldId],
          currentWorldGeneration - entityReferences[worldId],
          10
        );
        i += 1
      ) {
        const offset = { x: random(-18, 18), y: random(-8, 8) };
        createDrop(world, add(viewable[POSITION], offset), offset.y);
      }
    }
  };

  return { onUpdate };
}
