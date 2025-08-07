import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import { disposeEntity, registerEntity } from "./map";
import { Liquid, LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { none } from "../../game/assets/sprites";
import { copy } from "../../game/math/std";
import { BubbleSequence, SEQUENCABLE } from "../components/sequencable";
import { createSequence, getSequence } from "./sequence";

export const isStill = (world: World, entity: Entity) =>
  entity[LIQUID]?.type === "bubble" && !getSequence(world, entity, "bubble");

export const isFallen = (world: World, entity: Entity) =>
  entity[LIQUID]?.type === "rain" && !getSequence(world, entity, "rain");

export const createBubble = (
  world: World,
  position: Position,
  type: Liquid["type"] = "bubble"
) => {
  const bubbleEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "unit" },
    [LIQUID]: { type: "bubble" },
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
    { width: 0, type }
  );
  registerEntity(world, bubbleEntity);
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
      if (isFallen(world, entity)) {
        disposeEntity(world, entity);
        createBubble(world, entity[POSITION], "rain");
        continue;
      } else if (isStill(world, entity)) {
        disposeEntity(world, entity);
        continue;
      }
    }
  };

  return { onUpdate };
}
