import { requireComponent, hasComponent, TypedEntity } from "../entities";
import { resolveSprite, spriteRef } from "../../game/assets/spriteIds";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { disposeEntity, getCellEntities, registerEntity } from "./map";
import { Liquid, LIQUID } from "../components/liquid";
import { entities } from "..";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import {
  bubble,
  shadow,
  waterShallow,
  waterDeep,
  sand,
  beach,
  soilWet,
} from "../../game/assets/sprites";
import { add, combine, copy, lerp, random } from "../../game/math/std";
import { play } from "../../game/sound";
import { LEVEL } from "../components/level";
import { getImmersible, hasWater, isImmersible, isSubmerged } from "./immersion";
import { getEnterable } from "./enter";
import { rerenderEntity } from "./renderer";
import { SEQUENCABLE } from "../components/sequencable";
import { IMMERSIBLE } from "../components/immersible";
import { createCell } from "../../bindings/creation";
import { ENTERABLE } from "../components/enterable";
import { LOCKABLE } from "../components/lockable";
import { TEMPO } from "../components/tempo";
import { REFILLABLE } from "../components/refillable";
import { MOVABLE } from "../components/movable";
import { mergeSprites } from "../../game/assets/ui";
import { COLLIDABLE } from "../components/collidable";
import { trenchResources } from "../../game/balancing/harvesting";
import { HARVESTABLE } from "../components/harvestable";
import { getFarmable } from "./harvest";
import { FARMABLE } from "../components/farmable";
import { extinguishEntity, getBurnables } from "./burn";
import { BURNABLE } from "../components/burnable";
import { getAffectables } from "./magic";
import { createSequence, getSequence } from "./sequence";
import { AFFECTABLE } from "../components/affectable";

export type Weather = "rain" | "snow";

export const getLiquids = (world: World, position: Position) =>
  getCellEntities(world, position).filter((entity) => hasComponent(entity, LIQUID));

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
  entity: TypedEntity,
  type: Liquid["type"]
) => {
  if (type !== "drop" || random(0, 4) === 0) {
    play(world, entity, type === "drop" ? "rain" : "bubble", {
      variant: type === "bubble" ? 1 : 2,
      delay: random(0, 100),
    });
  }
};

export const createBubble = (
  world: World,
  position: Position,
  bubbleType: "rain" | "water",
  audible = true
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

  // water soil
  const soil = getFarmable(world, position);
  if (
    bubbleType === "rain" &&
    soil &&
    !soil[FARMABLE].watered &&
    !soil[FARMABLE].planted
  ) {
    soil[SPRITE] = spriteRef(soilWet);
    soil[FARMABLE].watered = true;
    rerenderEntity(world, soil);
  }

  // extinguish fire
  const burnables = getBurnables(world, position).filter(
    (cell) => cell[BURNABLE].burning && !cell[BURNABLE].simmer
  );
  const affectables = getAffectables(world, position).filter(
    (cell) => requireComponent(cell, AFFECTABLE).burn > 0
  );
  [...burnables, ...affectables].forEach((cell) => {
    extinguishEntity(world, cell);
  });

  // don't show drops in buildings
  const roof = getEnterable(world, position);
  if (roof) {
    if (audible) bubbleSound(world, roof, droppedType);
    return;
  }

  const bubbleEntity = entities.createSplash(world, {
    [FOG]: { visibility: "hidden", type: "object" },
    [LIQUID]: { type: droppedType, amount: 0 },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: bubble,
  });
  createSequence<"splash", Record<string, never>>(
    world,
    bubbleEntity,
    "splash",
    "bubbleSplash",
    {}
  );
  registerEntity(world, bubbleEntity);
  if (audible) bubbleSound(world, bubbleEntity, droppedType);
};

export const applyWaterCell = (world: World, position: Position) => {
  if (!hasWater(world, position)) return false;
  const { x, y } = position;
  const cells = world.metadata.gameEntity[LEVEL].cells;
  const deep = isSubmerged(world, position);
  if (["water", "water_shallow", "water_deep"].includes(cells[x][y])) {
    cells[x][y] = deep ? "water_deep" : "water_shallow";
  }
  const water = getImmersible(world, position);
  if (water && requireComponent(water, IMMERSIBLE).deep !== deep) {
    requireComponent(water, IMMERSIBLE).deep = deep;
    water[SPRITE] = spriteRef(deep ? waterDeep : waterShallow);
    rerenderEntity(world, water);
  }
  return true;
};

export const applyWaterMap = (world: World) => {
  (world.metadata.gameEntity[LEVEL].cellPositions["water"] || []).forEach(
    (cell) => {
      applyWaterCell(world, cell);
    }
  );
};

export const updateShoreline = (world: World, position: Position) => {
  const level = world.metadata.gameEntity[LEVEL];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const target = combine(level.size, position, { x: dx, y: dy });
      const { x, y } = target;
      const kind = level.cells[x][y];
      if (applyWaterCell(world, target)) continue;

      const nearbyWater = [-1, 0, 1].some((x) =>
        [-1, 0, 1].some((y) => hasWater(world, add(target, { x, y })))
      );
      const ground = nearbyWater ? "beach" : "sand";
      const cells = getCellEntities(world, target);
      const paving = cells.find((cell) =>
        cell[HARVESTABLE] && trenchResources.includes(cell[HARVESTABLE].resource)
      );
      if (paving) {
        if (requireComponent(paving, HARVESTABLE).resource !== ground) {
          requireComponent(paving, HARVESTABLE).resource = ground;
          paving[SPRITE] = spriteRef(nearbyWater ? beach : sand);
          rerenderEntity(world, paving);
        }
      } else if (!level.initialized[x][y]) {
        if (
          !(trenchResources.includes(kind) || (nearbyWater && kind === "air"))
        )
          continue;
      } else {
        if (
          !nearbyWater ||
          cells.some(
            (cell) =>
              (hasComponent(cell, TEMPO) && hasComponent(cell, SPRITE)) ||
              hasComponent(cell, REFILLABLE) ||
              hasComponent(cell, ENTERABLE) ||
              hasComponent(cell, LOCKABLE) ||
              hasComponent(cell, COLLIDABLE)
          )
        )
          continue;
        const soil = getFarmable(world, target);
        if (soil) {
          const plant = world.getEntityByIdAndComponents(
            soil[FARMABLE].sapling,
            [HARVESTABLE]
          );
          if (plant) {
            plant[HARVESTABLE].amount = 0;
            rerenderEntity(world, plant);
          }
          disposeEntity(world, soil);
        }
        for (const cell of cells) {
          if (
            cell[FOG]?.type === "object" &&
            !hasComponent(cell, MOVABLE) &&
            cell[SPRITE]
          ) {
            cell[SPRITE] = spriteRef(
              mergeSprites(shadow, resolveSprite(cell[SPRITE]))
            );
            rerenderEntity(world, cell);
          }
        }
        registerEntity(
          world,
          createCell(world, target, ground, "hidden", false).cell
        );
      }
      level.cells[x][y] = ground;
    }
  }
};

// Upgrade the transient liquid effects of older saves to sequence-owned lifetimes.
export const resumeLiquidEffects = (world: World) => {
  for (const entity of world.getEntities([LIQUID, SEQUENCABLE, RENDERABLE])) {
    if (getSequence(world, entity, "splash")) continue;
    createSequence<"splash", Record<string, never>>(
      world,
      entity,
      "splash",
      "bubbleSplash",
      {}
    );
    entity[SEQUENCABLE].states.splash!.elapsed = entity[LIQUID].amount * 250;
  }
};
