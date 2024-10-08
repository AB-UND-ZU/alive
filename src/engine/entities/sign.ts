import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createSign(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
  }
) {
  const signEntity = world.createEntity();

  components.addAnimatable(world, signEntity, entity[ANIMATABLE]);
  components.addCollidable(world, signEntity, entity[COLLIDABLE]);
  components.addFog(world, signEntity, entity[FOG]);
  components.addPosition(world, signEntity, entity[POSITION]);
  components.addRenderable(world, signEntity, entity[RENDERABLE]);
  components.addSprite(world, signEntity, entity[SPRITE]);
  components.addTooltip(world, signEntity, entity[TOOLTIP]);

  return signEntity;
}
