import { Entity } from "ecs";
import {
  Orientable,
  ORIENTABLE,
  Orientation,
} from "../../engine/components/orientable";
import { Layer, Sprite, SPRITE } from "../../engine/components/sprite";
import { isDead } from "../../engine/systems/damage";
import { World } from "../../engine";
import { isEmpty } from "../../engine/systems/collect";
import { ANIMATABLE } from "../../engine/components/animatable";
import { LOOTABLE } from "../../engine/components/lootable";
import { INVENTORY } from "../../engine/components/inventory";

export const pixels = 16;
export const textSize = 18 / 25;
export const stack = 1000;
export const stackHeight = 1;

export const getFacingLayers = (world: World, entity: Entity) => {
  const sprite = entity[SPRITE] as Sprite;

  // prevent picked up items from setting orientation
  const isBeingPickedUp = entity[ANIMATABLE]?.states.decay?.args.timestamp;
  const collectedItem = entity[INVENTORY]?.items[0];
  const itemOrientation: Orientation | undefined =
    entity[LOOTABLE]?.accessible &&
    collectedItem &&
    world.getEntityById(collectedItem)[ORIENTABLE]?.facing;
  const preventFacing =
    isDead(world, entity) &&
    !isEmpty(world, entity) &&
    isBeingPickedUp &&
    !itemOrientation;
  const facing = !preventFacing && (entity[ORIENTABLE] as Orientable)?.facing;

  if (facing && sprite.facing?.[facing])
    return sprite.facing[facing] as Layer[];

  return sprite.layers;
};
