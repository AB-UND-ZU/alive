import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Focusable, FOCUSABLE } from "../components/focusable";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createFocus(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [FOCUSABLE]: Focusable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const focusEntity = world.createEntity();

  components.addAnimatable(world, focusEntity, entity[ANIMATABLE]);
  components.addFocusable(world, focusEntity, entity[FOCUSABLE]);
  components.addPosition(world, focusEntity, entity[POSITION]);
  components.addSprite(world, focusEntity, entity[SPRITE]);
  components.addRenderable(world, focusEntity, entity[RENDERABLE]);

  return focusEntity;
}
