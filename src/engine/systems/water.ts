import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import { disposeEntity, getCell, registerEntity } from "./map";
import { Liquid, LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { none, water, waterDeep } from "../../game/assets/sprites";
import { add, copy, getDistance, random } from "../../game/math/std";
import { BubbleSequence, SEQUENCABLE } from "../components/sequencable";
import { createSequence, getSequence } from "./sequence";
import { play } from "../../game/sound";
import { PLAYER } from "../components/player";
import { LAYER } from "../components/layer";
import { LEVEL } from "../components/level";
import { getImmersible, isImmersible, isSubmerged } from "./immersion";
import { getFragment } from "./enter";
import { coverSnow } from "./freeze";
import { rerenderEntity } from "./renderer";

export const isStill = (world: World, entity: Entity) =>
  entity[LIQUID]?.type === "bubble" && !getSequence(world, entity, "bubble");

export const isFallen = (world: World, entity: Entity) =>
  LIQUID in entity &&
  entity[LIQUID].type !== "bubble" &&
  !getSequence(world, entity, "drop");

export const createBubble = (
  world: World,
  position: Position,
  type: Liquid["type"] = "bubble"
) => {
  const droppedType =
    type === "bubble" || (type === "rain" && isImmersible(world, position))
      ? "bubble"
      : "rain";
  const bubbleEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "object" },
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
    { width: 0, type: droppedType }
  );
  registerEntity(world, bubbleEntity);

  // play sound in proximity
  const hero = world.getEntity([PLAYER, POSITION, LAYER]);
  const size = world.metadata.gameEntity[LEVEL].size;
  const distance = hero
    ? getDistance(hero[POSITION], position, size)
    : Infinity;

  if (
    hero &&
    distance < 9 &&
    (droppedType === "bubble" || random(0, 8) === 0)
  ) {
    play(droppedType === "bubble" ? "bubble" : "rain", {
      proximity: 1 / (distance + 1),
      variant: type === "bubble" ? 1 : 2,
      delay: random(0, 100),
      intensity: hero[LAYER].structure ? 0.5 : 1,
    });
  }
};

export const applyWaterCell = (world: World, position: Position) => {
  const waterEntity = getImmersible(world, position);
  if (!waterEntity) return;

  if (isSubmerged(world, position) && waterEntity[SPRITE] !== waterDeep) {
    waterEntity[SPRITE] = waterDeep;
    rerenderEntity(world, waterEntity);
  } else if (!isSubmerged(world, position) && waterEntity[SPRITE] !== water) {
    waterEntity[SPRITE] = water;
    rerenderEntity(world, waterEntity);
  }
};

export const updateWaterCell = (world: World, position: Position) => {
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      applyWaterCell(world, add(position, { x, y }));
    }
  }
};

export const applyWaterMap = (world: World) => {
  world.metadata.gameEntity[LEVEL].cells["water"].forEach((cell) => {
    applyWaterCell(world, cell);
  });
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

        // don't drop weather inside buildings
        if (
          !getFragment(world, entity[POSITION]) &&
          !Object.values(getCell(world, entity[POSITION])).some(
            (cell) => cell[FOG]?.visibility === "hidden"
          )
        ) {
          if (entity[LIQUID].type === "rain") {
            createBubble(world, entity[POSITION], "rain");
          } else if (
            entity[LIQUID].type === "snow" &&
            world.metadata.gameEntity[LEVEL].name !== "LEVEL_MENU"
          ) {
            coverSnow(world, entity[POSITION]);
          }
        }
        continue;
      } else if (isStill(world, entity)) {
        disposeEntity(world, entity);
        continue;
      }
    }
  };

  return { onUpdate };
}
