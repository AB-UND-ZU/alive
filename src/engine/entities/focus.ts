import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createFocus(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const focusEntity = world.createEntity();

  components.addAnimatable(world, focusEntity, entity[ANIMATABLE]);
  components.addPosition(world, focusEntity, entity[POSITION]);
  components.addSprite(world, focusEntity, entity[SPRITE]);
  components.addRenderable(world, focusEntity, entity[RENDERABLE]);

  return focusEntity;
}
