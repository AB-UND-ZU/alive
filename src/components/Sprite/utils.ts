import { Entity } from "ecs";
import { Orientable, ORIENTABLE } from "../../engine/components/orientable";
import { Layer, Sprite, SPRITE } from "../../engine/components/sprite";
import { isDead } from "../../engine/systems/damage";
import { World } from "../../engine";
import { isEmpty } from "../../engine/systems/collect";
import { ANIMATABLE } from "../../engine/components/animatable";

export const pixels = 16;
export const textSize = 18 / 25;
export const stack = 1000;
export const stackHeight = 1;

export const getFacingLayers = (world: World, entity: Entity) => {
  const sprite = entity[SPRITE] as Sprite;

  // prevent picked up items from setting orientation
  const preventFacing = isDead(world, entity) && !isEmpty(world, entity) && entity[ANIMATABLE]?.states.decay?.args.timestamp;
  const facing = !preventFacing && (entity[ORIENTABLE] as Orientable)?.facing;

  if (facing && sprite.facing?.[facing])
    return sprite.facing[facing] as Layer[];

  return sprite.layers;
};
