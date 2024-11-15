import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { Layer, SPRITE, Sprite } from "../../engine/components/sprite";
import { World } from "../../engine";
import { Segment } from "./Stack";
import { Entity } from "ecs";
import { Equippable, EQUIPPABLE } from "../../engine/components/equippable";
import { LayerProps } from "./Layer";
import {
  Consumable,
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
  ironArmor,
  ironKey,
  ironSword,
  map,
  none,
  woodArmor,
  woodStick,
} from "../../game/assets/sprites";

export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

// odd values because i don't want to recalculate brightness values
export const terrainHeight = 0 * stackHeight;
export const unitHeight = 1 * stackHeight;
export const lootHeight = 1.1 * stackHeight;
export const decayHeight = 1.8 * stackHeight;
export const immersibleHeight = 2 * stackHeight;
export const lightHeight = 3 * stackHeight;
export const wallHeight = 4 * stackHeight;
export const oreHeight = 4.5 * stackHeight;
export const floatHeight = 5 * stackHeight;
export const shadowHeight = 6 * stackHeight;
export const fogHeight = 7 * stackHeight;
export const tooltipHeight = 8 * stackHeight;
export const focusHeight = 9 * stackHeight;
export const dialogHeight = 9.5 * stackHeight;
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
  const isAir = entity[FOG]?.type === "air";
  const isFloat = entity[FOG]?.type === "float";
  const isUnit = entity[FOG]?.type === "unit";
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

  // from back to front: armor, body, spell, melee
  const orderedSegments: Segment[] = [];

  // 1. armor
  const armorEntity =
    entity[EQUIPPABLE]?.armor && world.getEntityById(entity[EQUIPPABLE].armor);
  if (armorEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].armor,
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
  orderedSegments.push({
    id: world.getEntityId(entity),
    sprite: entity[SPRITE],
    facing: entity[ORIENTABLE]?.facing,
    offsetX: 0,
    offsetY: 0,
    offsetZ,
    layerProps,
  });

  // 4. melee
  const meleeEntity =
    entity[EQUIPPABLE]?.melee && world.getEntityById(entity[EQUIPPABLE].melee);
  if (meleeEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].melee,
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

  return orderedSegments;
};

export const createSprite = (world: World, entityId: number) => {
  const layers: Layer[] = [];
  const entity = world.assertById(entityId);
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
  1.1: 1.46,
  1.5: 1.77,
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
    wood: woodArmor,
    iron: ironArmor,
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
