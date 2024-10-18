import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { Layer, SPRITE, Sprite } from "../../engine/components/sprite";
import { World } from "../../engine";
import { Segment } from "./Stack";
import { Entity } from "ecs";
import { Equippable, EQUIPPABLE } from "../../engine/components/equippable";
import { isLootable } from "../../engine/systems/collect";
import { LOOTABLE } from "../../engine/components/lootable";
import { LayerProps } from "./Layer";
import { INVENTORY } from "../../engine/components/inventory";
import {
  Consumable,
  ITEM,
  Material,
  Materialized,
} from "../../engine/components/item";
import { LIGHT } from "../../engine/components/light";
import { FOG } from "../../engine/components/fog";
import { TRACKABLE } from "../../engine/components/trackable";
import {
  compass,
  doorClosedFire,
  doorClosedGold,
  doorClosedIron,
  doorClosedWood,
  fireSword,
  goldKey,
  goldSword,
  ironKey,
  ironShield,
  ironSword,
  map,
  none,
  woodShield,
  woodStick,
} from "../../game/assets/sprites";
import { isTradable } from "../../engine/systems/action";

export const pixels = 16;
export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

export const terrainHeight = 0 * stackHeight;
export const unitHeight = 1 * stackHeight;
export const decayHeight = 1.5 * stackHeight; // i don't want to recalculate brightness values.
export const immersibleHeight = 2 * stackHeight;
export const lightHeight = 3 * stackHeight;
export const wallHeight = 4 * stackHeight;
export const floatHeight = 5 * stackHeight;
export const shadowHeight = 6 * stackHeight;
export const fogHeight = 7 * stackHeight;
export const tooltipHeight = 8 * stackHeight;
export const focusHeight = 9 * stackHeight;
export const particleHeight = 10 * stackHeight;
export const cameraHeight = 11 * stackHeight;

export const getFacingLayers = (
  world: World,
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) => {
  let layers;
  if (facing && sprite.facing?.[facing]) layers = sprite.facing[facing];

  if (amount && sprite.amounts) {
    if (amount === 1) layers = sprite.amounts.single;
    else if (amount === 2) layers = sprite.amounts.double;
    else layers = sprite.amounts.multiple;
  }

  return layers || sprite.layers;
};

export const getSegments = (
  world: World,
  entity: Entity,
  layerProps: LayerProps
) => {
  const visibility = entity[FOG]?.visibility;
  const isAir = entity[FOG]?.type === "air";
  const isTerrain = entity[FOG]?.type === "terrain";
  const isFloat = entity[FOG]?.type === "float";
  const isUnit = entity[FOG]?.type === "unit";
  const isVisible = visibility === "visible";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;

  const offsetZ = isOpaque
    ? wallHeight
    : isUnit
    ? unitHeight
    : isAir
    ? fogHeight
    : isFloat
    ? floatHeight
    : terrainHeight;

  // from back to front: armor, body, spell, melee, loot
  const orderedSegments: Segment[] = [];

  // 1. armor
  const armorEntity =
    entity[EQUIPPABLE]?.armor && world.getEntityById(entity[EQUIPPABLE].armor);
  if (armorEntity) {
    orderedSegments.push({
      sprite: armorEntity[SPRITE],
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...layerProps,
        isTransparent: false,
      },
    });
  }

  // 2. body
  if (!isLootable(world, entity) || !entity[LOOTABLE]?.disposable) {
    orderedSegments.push({
      sprite: entity[SPRITE],
      facing: entity[ORIENTABLE]?.facing,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps,
    });
  }

  // 4. melee
  const meleeEntity =
    entity[EQUIPPABLE]?.melee && world.getEntityById(entity[EQUIPPABLE].melee);
  if (meleeEntity) {
    orderedSegments.push({
      sprite: meleeEntity[SPRITE],
      facing: meleeEntity[ORIENTABLE].facing,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...layerProps,
        isTransparent: false,
      },
    });
  }

  // 5. loot
  if (
    (isLootable(world, entity) || isTradable(world, entity)) &&
    (isVisible || !isTerrain || (isTerrain && isOpaque))
  ) {
    for (const itemId of entity[INVENTORY]!.items) {
      const item = world.getEntityById(itemId);
      orderedSegments.push({
        sprite: item[SPRITE],
        facing: item[ORIENTABLE]?.facing,
        amount: item[ITEM].amount,
        offsetX: 0,
        offsetY: 0,
        offsetZ,
        layerProps,
      });
    }
  }

  return orderedSegments;
};

export const createSprite = (world: World, entityId: number) => {
  const layers: Layer[] = [];
  const entity = world.getEntityById(entityId);
  const segments = getSegments(world, entity, {
    isTransparent: false,
    receiveShadow: false,
  });

  segments.forEach((segment) => {
    layers.push(
      ...getFacingLayers(
        world,
        segment.sprite,
        entity[TRACKABLE] ? segment.facing : undefined
      )
    );
  });

  return {
    name: "sprite_generic",
    layers,
  };
};

// depending on the distance between camera, object and light,
// the brightness might need to be adjusted to match the original
export const offsetFactors: Record<number, number> = {
  1: 1.41,
};

const entitySprites: Record<
  keyof Equippable | Consumable | Materialized,
  Partial<Record<Material, Sprite>>
> = {
  melee: {
    wood: woodStick,
    iron: ironSword,
    fire: fireSword,
    gold: goldSword,
  },
  armor: {
    wood: woodShield,
    iron: ironShield,
  },
  compass: {
    wood: compass,
  },
  map: {
    wood: map,
  },
  key: {
    wood: none,
    iron: ironKey,
    gold: goldKey,
  },
  door: {
    wood: doorClosedWood,
    iron: doorClosedIron,
    gold: doorClosedGold,
    fire: doorClosedFire,
  },
};

export const getMaterialSprite = (
  lookup?: keyof typeof entitySprites,
  material?: Material
) => {
  if (!lookup) return none;

  return entitySprites[lookup][material || "wood"] || none;
};
