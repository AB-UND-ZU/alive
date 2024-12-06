import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import { disposeEntity, registerEntity } from "./map";
import { LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { none } from "../../game/assets/sprites";
import { copy } from "../../game/math/std";
import {
  BubbleSequence,
  SEQUENCABLE,
  WaveSequence,
} from "../components/sequencable";
import { createSequence, getSequences } from "./sequence";

export const isStill = (world: World, entity: Entity) =>
  LIQUID in entity && getSequences(world, entity).length === 0;

export const createBubble = (world: World, position: Position) => {
  const bubbleEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "unit" },
    [LIQUID]: {},
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"bubble", BubbleSequence>(
    world,
    bubbleEntity,
    "bubble",
    "bubbleSplash",
    { width: 0 }
  );
  registerEntity(world, bubbleEntity);
};

export const createWave = (world: World, position: Position) => {
  const waveEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "unit" },
    [LIQUID]: {},
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"wave", WaveSequence>(
    world,
    waveEntity,
    "wave",
    "waterWave",
    { innerRadius: 0, outerRadius: 0 }
  );
  registerEntity(world, waveEntity);
};

export default function setupWater(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;

    if (referenceGenerations === worldGeneration) return;

    referenceGenerations = worldGeneration;

    for (const entity of world.getEntities([
      LIQUID,
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      if (isStill(world, entity)) {
        disposeEntity(world, entity);
        continue;
      }
    }
  };

  return { onUpdate };
}
