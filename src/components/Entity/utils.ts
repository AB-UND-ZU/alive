import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { Layer, SPRITE, Sprite } from "../../engine/components/sprite";
import { World } from "../../engine";
import { Segment } from "./Stack";
import { Entity } from "ecs";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { LayerProps } from "./Layer";
import { LIGHT } from "../../engine/components/light";
import { FOG } from "../../engine/components/fog";
import { TRACKABLE } from "../../engine/components/trackable";
import { ENTERABLE } from "../../engine/components/enterable";
import { PLAYER } from "../../engine/components/player";
import { PROJECTILE } from "../../engine/components/projectile";

export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

// odd values because i don't want to recalculate brightness values
export const terrainHeight = 0 * stackHeight;
export const objectHeight = 0.1 * stackHeight;
export const effectHeight = 0.5 * stackHeight;
export const unitHeight = 1 * stackHeight;
export const playerHeight = 1.3 * stackHeight;
export const lootHeight = 1.5 * stackHeight;
export const decayHeight = 1.8 * stackHeight;
export const immersibleHeight = 2 * stackHeight;
export const dotsHeight = 2.5 * stackHeight;
export const lightHeight = 3 * stackHeight;
export const wallHeight = 4 * stackHeight;
export const oreHeight = 4.5 * stackHeight;
export const floatHeight = 5 * stackHeight;
export const shadowHeight = 6 * stackHeight;
export const fogHeight = 7 * stackHeight;
export const fixedHeight = 7.5 * stackHeight;
export const idleHeight = 8 * stackHeight;
export const tooltipHeight = 8.5 * stackHeight;
export const focusHeight = 9 * stackHeight;
export const dialogHeight = 9.2 * stackHeight;
export const particleHeight = 9.5 * stackHeight;
export const popupHeight = 10 * stackHeight;
export const selectionHeight = 10.1 * stackHeight;
export const transientHeight = 10.5 * stackHeight;
export const cameraHeight = 11 * stackHeight;

export const getFacingLayers = (
  sprite: Sprite,
  facing?: Orientation,
  amount?: number
) => {
  let layers;
  if (facing && sprite.facing?.[facing]) layers = sprite.facing[facing];

  if (amount && sprite.amounts && amount > 0) {
    if (amount === 1) layers = sprite.amounts.single;
    else if (amount === 2) layers = sprite.amounts.double;
    else layers = sprite.amounts.multiple;
  }

  return layers || sprite.layers;
};

export const getLayerCount = (segments: Segment[]) =>
  segments.reduce(
    (total, segment) =>
      total +
      getFacingLayers(segment.sprite, segment.facing, segment.amount).length,
    0
  );

export const getSegments = (
  world: World,
  entity: Entity,
  layerProps: LayerProps,
  inside?: boolean
) => {
  const isPlayer = !!entity[PLAYER];
  const isAir = entity[FOG]?.type === "air";
  const isFloat = entity[FOG]?.type === "float";
  const isUnit = entity[FOG]?.type === "unit" || entity[PROJECTILE];
  const isObject = entity[FOG]?.type === "object";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const isFixed = isFloat && entity[FOG].fixed;

  const offsetZ = isFixed
    ? fixedHeight
    : isOpaque
    ? wallHeight
    : isPlayer
    ? playerHeight
    : isUnit
    ? unitHeight
    : isAir
    ? fogHeight
    : isFloat
    ? floatHeight
    : isObject
    ? objectHeight
    : terrainHeight;

  const visibleProps = isFixed
    ? { ...layerProps, receiveShadow: false, isTransparent: false }
    : layerProps;

  // from back to front: shield, body, spell, sword
  const orderedSegments: Segment[] = [];

  // 1. shield
  const shieldEntity =
    entity[EQUIPPABLE]?.shield &&
    world.getEntityById(entity[EQUIPPABLE].shield);
  if (shieldEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].shield,
      sprite: shieldEntity[SPRITE],
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...visibleProps,
        isTransparent: false,
      },
    });
  }

  // 2. body
  orderedSegments.push({
    id: world.getEntityId(entity),
    sprite: (inside && entity[ENTERABLE]?.sprite) || entity[SPRITE],
    facing: entity[ORIENTABLE]?.facing,
    offsetX: 0,
    offsetY: 0,
    offsetZ,
    layerProps: visibleProps,
  });

  // 4. sword
  const swordEntity =
    entity[EQUIPPABLE]?.sword && world.getEntityById(entity[EQUIPPABLE].sword);
  if (swordEntity) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].sword,
      sprite: swordEntity[SPRITE],
      facing: swordEntity[ORIENTABLE].facing,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...visibleProps,
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
  1.3: 1.6,
  1.5: 1.77,
};

// scalar value factor for colors in shadow
export const shadowFactor = 0.125;
