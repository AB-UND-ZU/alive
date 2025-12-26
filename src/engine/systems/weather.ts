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
import { DropSequence, SEQUENCABLE } from "../components/sequencable";
import { createSequence } from "./sequence";
import { Level, LEVEL } from "../components/level";
import { VIEWABLE } from "../components/viewable";
import { getActiveViewable } from "../../bindings/hooks";

export const createDrop = (
  world: World,
  position: Position,
  parallax: number,
  type: NonNullable<Level["weather"]>
) => {
  const dropEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "object" },
    [LIQUID]: { type },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"drop", DropSequence>(
    world,
    dropEntity,
    "drop",
    "weatherDrop",
    {
      height: 12,
      fast: parallax > 0,
      type,
    }
  );
  registerEntity(world, dropEntity);
};

export const calculateWeatherIntensity = (
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

const weatherDrops: Record<NonNullable<Level["weather"]>, number> = {
  rain: 10,
  snow: 2,
};

export const getWeather = (
  world: World,
  position: Position
): { perma: boolean; disable: boolean; weather: Level["weather"] } => {
  const level = world.metadata.gameEntity[LEVEL].name;

  return {
    perma: level === "LEVEL_MENU",
    disable: level === "LEVEL_TUTORIAL",
    weather: level === "LEVEL_MENU" ? "snow" : "rain",
  };
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
    const viewable = getActiveViewable(viewables);

    if (worldGeneration === currentWorldGeneration || !viewable) return;

    worldGeneration = currentWorldGeneration;

    const { perma, disable, weather } = getWeather(
      world,
      viewable?.[POSITION] || { x: 0, y: 0 }
    );

    // schedule weather in normal worlds
    if (!entityReferences[worldId] && !disable) {
      entityReferences[worldId] =
        currentWorldGeneration + (perma ? 10 : random(350, 2000));
      delete entityDurations[worldId];
    }

    // start weather
    if (
      !world.metadata.gameEntity[LEVEL].weather &&
      worldId in entityReferences &&
      entityReferences[worldId] < currentWorldGeneration
    ) {
      world.metadata.gameEntity[LEVEL].weather = weather;
      entityDurations[worldId] = perma ? Infinity : random(150, 350);
    }

    const currentWeather = world.metadata.gameEntity[LEVEL].weather;
    if (currentWeather) {
      // stop weather
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
        calculateWeatherIntensity(
          entityDurations[worldId],
          currentWorldGeneration - entityReferences[worldId],
          weatherDrops[currentWeather]
        );
        i += 1
      ) {
        const offset = { x: random(-18, 18), y: random(-8, 8) };
        createDrop(
          world,
          add(viewable[POSITION], offset),
          offset.y,
          currentWeather
        );
      }
    }
  };

  return { onUpdate };
}
