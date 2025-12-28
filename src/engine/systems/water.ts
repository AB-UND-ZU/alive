import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { disposeEntity, getCell, registerEntity } from "./map";
import { Liquid, LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { bubble, water, waterDeep } from "../../game/assets/sprites";
import { add, copy, getDistance, random } from "../../game/math/std";
import { play } from "../../game/sound";
import { PLAYER } from "../components/player";
import { LAYER } from "../components/layer";
import { LEVEL } from "../components/level";
import { getImmersible, isImmersible, isSubmerged } from "./immersion";
import { getFragment } from "./enter";
import { rerenderEntity } from "./renderer";
import { lerp } from "three/src/math/MathUtils";
import { SEQUENCABLE } from "../components/sequencable";

export type Weather = "rain" | "snow";

export const getLiquids = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter((entity) => LIQUID in entity);

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

export const weatherIntensity: Record<Weather, number> = {
  rain: 10,
  snow: 2,
};

export const bubbleSound = (
  world: World,
  position: Position,
  type: Liquid["type"]
) => {
  const hero = world.getEntity([PLAYER, POSITION, LAYER]);
  const size = world.metadata.gameEntity[LEVEL].size;
  const distance = hero
    ? getDistance(hero[POSITION], position, size, 0.45)
    : Infinity;

  if (hero && distance < 10 && (type !== "drop" || random(0, 4) === 0)) {
    play(type === "drop" ? "rain" : "bubble", {
      proximity: 1 / (distance + 1),
      variant: type === "bubble" ? 1 : 2,
      delay: random(0, 100),
      intensity: hero[LAYER].structure ? 0.5 : 1,
    });
  }
};

export const createBubble = (
  world: World,
  position: Position,
  bubbleType: "rain" | "water"
) => {
  const immersed = isImmersible(world, position);

  if (bubbleType === "water" && !immersed) {
    console.warn("Bubble not in water! Position:", position);
    return;
  }
  const droppedType =
    bubbleType === "water"
      ? "bubble"
      : bubbleType === "rain" && immersed
      ? "splash"
      : "drop";

  // play sound in proximity
  bubbleSound(world, position, droppedType);

  // don't show drops in buildings
  if (getFragment(world, position)) return;

  const bubbleEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "object" },
    [LIQUID]: { type: droppedType, amount: 0 },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: bubble,
  });
  registerEntity(world, bubbleEntity);
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
  (world.metadata.gameEntity[LEVEL].cellPositions["water"] || []).forEach(
    (cell) => {
      applyWaterCell(world, cell);
    }
  );
};

const waterTick = 250;

export default function setupWater(world: World) {
  let elapsed = 0;

  const onUpdate = (delta: number) => {
    elapsed += delta;

    for (const entity of world.getEntities([
      LIQUID,
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      // apply timestamp
      if (!entity[LIQUID].timestamp) {
        entity[LIQUID].timestamp = elapsed;
      }
      const amount = Math.floor(
        (elapsed - entity[LIQUID].timestamp) / waterTick
      );
      const endAmount = entity[LIQUID].type === "drop" ? 2 : 3;

      if (amount > endAmount) {
        disposeEntity(world, entity);
        continue;
      }
      if (amount !== entity[LIQUID].amount) {
        entity[LIQUID].amount = amount;
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
