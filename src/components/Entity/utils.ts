import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { Layer, SPRITE, Sprite } from "../../engine/components/sprite";
import { World } from "../../engine";
import { Segment } from "./Stack";
import { Entity } from "ecs";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { isLootable } from "../../engine/systems/collect";
import { LOOTABLE } from "../../engine/components/lootable";
import { LayerProps } from "./Layer";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LIGHT } from "../../engine/components/light";
import { FOG } from "../../engine/components/fog";
import { TRACKABLE } from "../../engine/components/trackable";

export const pixels = 16;
export const textSize = 18 / 25 + 0.001;

export const stack = 1000;
export const stackHeight = 1;

export const terrainHeight = 0 * stackHeight;
export const lightHeight = 1 * stackHeight;
export const wallHeight = 2 * stackHeight;
export const shadowHeight = 3 * stackHeight;
export const tooltipHeight = 4 * stackHeight;
export const unitHeight = 5 * stackHeight;
export const fogHeight = 6 * stackHeight;
export const particleHeight = 7 * stackHeight;
export const immersibleHeight = 8 * stackHeight;
export const barHeight = 9 * stackHeight;
export const cameraHeight = 10 * stackHeight;

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
  const isUnit = entity[FOG]?.type === "unit";
  const isVisible = visibility === "visible";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;

  const offsetZ = isOpaque
    ? wallHeight
    : isUnit
    ? unitHeight
    : isAir
    ? fogHeight
    : terrainHeight;

  // from back to front: armor, body, spell, melee, loot
  const orderedSegments: Segment[] = [];

  // 1. armor
  const armorEntity =
    entity[EQUIPPABLE]?.armor && world.getEntityById(entity[EQUIPPABLE].armor);
  if (armorEntity) {
    orderedSegments.push({
      sprite: armorEntity[SPRITE],
      facing: armorEntity[ORIENTABLE].facing,
      offsetX: 0,
      offsetY: 0,
      offsetZ,
      layerProps: {
        isTransparent: false,
        receiveShadow: layerProps.receiveShadow,
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
        isTransparent: false,
        receiveShadow: layerProps.receiveShadow,
      },
    });
  }

  // 5. loot
  if (
    isLootable(world, entity) &&
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
