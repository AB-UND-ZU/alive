import { ORIENTABLE } from "../../engine/components/orientable";
import { Layer, SPRITE } from "../../engine/components/sprite";
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
import { ITEM } from "../../engine/components/item";
import { isSwimming } from "../../engine/systems/immersion";
import { shadow } from "../../game/assets/sprites";
import { LIQUID } from "../../engine/components/liquid";
import { LOOTABLE } from "../../engine/components/lootable";
import {
  unitBackdrops,
  unitSwimmingBackdrops,
} from "../../game/balancing/units";
import { NPC, NpcType } from "../../engine/components/npc";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { ClassKey } from "../../game/balancing/classes";
import { isDead, isNpc } from "../../engine/systems/damage";
import { colors } from "../../game/assets/colors";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { getFacingLayers } from "../../game/assets/ui";

export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

// odd values because i don't want to recalculate brightness values
export const terrainHeight = 0 * stackHeight;
export const effectHeight = 0.3 * stackHeight;
export const objectHeight = 0.5 * stackHeight;
export const unitHeight = 1 * stackHeight;
export const playerHeight = 1.3 * stackHeight;
export const lootHeight = 1.5 * stackHeight;
export const decayHeight = 1.8 * stackHeight;
export const immersibleHeight = 2 * stackHeight;
export const wireHeight = 2.2 * stackHeight;
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
export const interactHeight = 9.1 * stackHeight;
export const particleHeight = 9.2 * stackHeight;
export const dialogHeight = 9.5 * stackHeight;
export const popupHeight = 10 * stackHeight;
export const overlayHeight = 10.2 * stackHeight;
export const selectionHeight = 10.5 * stackHeight;
export const transientHeight = 11 * stackHeight;
export const cameraHeight = 12 * stackHeight;

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
  const isUnit = entity[FOG]?.type === "unit";
  const isObject = entity[FOG]?.type === "object";
  const isLiquid = !!entity[LIQUID];
  const isHarvestable = !!entity[HARVESTABLE];
  const isLootable = !!entity[LOOTABLE];
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const isFixed = isFloat && entity[FOG].fixed;
  const swimming = isSwimming(world, entity);

  const offsetZ = isFixed
    ? fixedHeight
    : isOpaque
    ? wallHeight
    : isPlayer
    ? playerHeight
    : isUnit || entity[PROJECTILE]
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

  // from back to front: shadow, backdrop, offhand, body, weapon
  const orderedSegments: Segment[] = [];

  // 1. shadow
  if (
    (isUnit || isNpc(world, entity)) &&
    !swimming &&
    !isLiquid &&
    !isLootable
  ) {
    orderedSegments.push({
      id: -2,
      sprite: shadow,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...visibleProps,
        isTransparent: false,
      },
    });
  }

  // 2. backdrop
  const unitKey = (entity[NPC]?.type || entity[SPAWNABLE]?.classKey) as
    | NpcType
    | ClassKey;
  const hairColor = (entity[SPAWNABLE]?.hairColor || colors.white) as string;
  const backdrop = swimming
    ? unitSwimmingBackdrops[unitKey]?.[hairColor]
    : unitBackdrops[unitKey]?.[hairColor];
  if (backdrop && !isDead(world, entity)) {
    orderedSegments.push({
      id: -1,
      sprite: backdrop,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: visibleProps,
    });
  }

  // 3. offhand
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE]?.offhand,
    [ITEM, SPRITE]
  );
  if (offhandEntity && offhandEntity[ITEM].amount > 0) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].offhand,
      sprite: offhandEntity[SPRITE],
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        ...visibleProps,
        isTransparent: false,
      },
    });
  }

  // 4. body
  const sprite = (inside && entity[ENTERABLE]?.sprite) || entity[SPRITE];
  orderedSegments.push({
    id: world.getEntityId(entity),
    sprite,
    facing: entity[ORIENTABLE]?.facing,
    amount: isLiquid
      ? entity[LIQUID].amount
      : isHarvestable &&
        sprite.amounts &&
        entity[HARVESTABLE].amount < entity[HARVESTABLE].maximum
      ? 1 +
        Math.floor(
          (entity[HARVESTABLE].amount / (entity[HARVESTABLE].maximum || 1)) * 3
        )
      : undefined,
    offsetX: 0,
    offsetY: 0,
    offsetZ,
    layerProps: visibleProps,
  });

  // 5. weapon
  const swordEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE]?.weapon,
    [ITEM, SPRITE, ORIENTABLE]
  );
  if (swordEntity && swordEntity[ITEM].amount > 0) {
    orderedSegments.push({
      id: entity[EQUIPPABLE].weapon,
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
