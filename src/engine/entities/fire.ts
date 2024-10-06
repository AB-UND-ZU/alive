import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Burnable, BURNABLE } from "../components/burnable";
import { Collidable, COLLIDABLE } from "../components/collidable";
import { FOG, Fog } from "../components/fog";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createFire(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [BURNABLE]: Burnable;
    [COLLIDABLE]: Collidable;
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
  }
) {
  const fireEntity = world.createEntity();

  components.addAnimatable(world, fireEntity, entity[ANIMATABLE]);
  components.addBurnable(world, fireEntity, entity[BURNABLE]);
  components.addCollidable(world, fireEntity, entity[COLLIDABLE]);
  components.addFog(world, fireEntity, entity[FOG]);
  components.addPosition(world, fireEntity, entity[POSITION]);
  components.addRenderable(world, fireEntity, entity[RENDERABLE]);
  components.addSprite(world, fireEntity, entity[SPRITE]);
  components.addTooltip(world, fireEntity, entity[TOOLTIP]);

  return fireEntity;
}
