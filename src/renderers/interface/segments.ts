import { ORIENTABLE } from "../../engine/components/orientable";
import { Layer, Sprite, SPRITE } from "../../engine/components/sprite";
import { World } from "../../engine";
import { requireComponent, TypedEntity } from "../../engine/entities";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { LIGHT } from "../../engine/components/light";
import { FOG } from "../../engine/components/fog";
import { TRACKABLE } from "../../engine/components/trackable";
import { ENTERABLE } from "../../engine/components/enterable";
import { PLAYER } from "../../engine/components/player";
import { PROJECTILE } from "../../engine/components/projectile";
import { ITEM } from "../../engine/components/item";
import { isSwimming } from "../../engine/systems/immersion";
import { fogOfWar, none, shadow, snowCover, snowFogOfWar } from "../../game/assets/sprites";
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

const defaultFog = { sprite: fogOfWar, offsetZ: fogHeight };
// Draw the snow dots just above the matching black dots on the underlying surface.
const snowFog = {
  sprite: snowFogOfWar,
  offsetZ: fogHeight + stackHeight / stack,
};
export const getFogOverlay = (sprite?: Sprite) =>
  sprite === snowCover ? snowFog : defaultFog;

export type RenderLayerProps = {
  isTransparent: boolean;
  receiveShadow: boolean;
};

export type Segment<Props extends RenderLayerProps = RenderLayerProps> = {
  id: number;
  sprite: Sprite;
  facing?: import("../../engine/components/orientable").Orientation;
  amount?: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: Props;
};

export const dotCount = 5;

export const getLayerCount = (segments: Segment[]) =>
  segments.reduce(
    (total, segment) =>
      total +
      getFacingLayers(segment.sprite, segment.facing, segment.amount).length,
    0
  );

export const getSegments = <Props extends RenderLayerProps>(
  world: World,
  entity: TypedEntity,
  layerProps: Props,
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
  const isFixed = isFloat && requireComponent(entity, FOG).fixed;
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
    ? entity[SPRITE] === snowCover
      ? objectHeight + 0.05
      : objectHeight
    : terrainHeight;

  const visibleProps = isFixed
    ? { ...layerProps, receiveShadow: false, isTransparent: false }
    : layerProps;

  // from back to front: shadow, backdrop, offhand, body, weapon
  const orderedSegments: Segment<Props>[] = [];

  // 1. shadow
  if (
    (isUnit || isNpc(world, entity)) &&
    !swimming &&
    !isLiquid &&
    !isLootable &&
    !(entity[NPC]?.type === "wormBoss" && entity[SPRITE] === none)
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
      id: world.getEntityId(offhandEntity),
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
  const sprite = (inside && entity[ENTERABLE]?.sprite) || requireComponent(entity, SPRITE);
  orderedSegments.push({
    id: world.getEntityId(entity),
    sprite,
    facing: entity[ORIENTABLE]?.facing,
    amount: isLiquid
      ? requireComponent(entity, LIQUID).amount
      : isHarvestable &&
        sprite.amounts &&
        requireComponent(entity, HARVESTABLE).amount < requireComponent(entity, HARVESTABLE).maximum
      ? 1 +
        Math.floor(
          (requireComponent(entity, HARVESTABLE).amount / (requireComponent(entity, HARVESTABLE).maximum || 1)) * 3
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
      id: world.getEntityId(swordEntity),
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

// scalar value factor for colors in shadow
export const shadowFactor = 0.125;
