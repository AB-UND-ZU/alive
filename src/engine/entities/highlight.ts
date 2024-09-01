import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Focusable, FOCUSABLE } from "../components/focusable";
import { Movable, MOVABLE } from "../components/movable";
import { POSITION, Position } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import type { World } from "../ecs";

export default function createHighlight(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [FOCUSABLE]: Focusable;
    [MOVABLE]: Movable;
    [POSITION]: Position;
    [SPRITE]: Sprite;
    [RENDERABLE]: Renderable;
  }
) {
  const highlightEntity = world.createEntity();

  components.addAnimatable(world, highlightEntity, entity[ANIMATABLE]);
  components.addFocusable(world, highlightEntity, entity[FOCUSABLE]);
  components.addMovable(world, highlightEntity, entity[MOVABLE]);
  components.addPosition(world, highlightEntity, entity[POSITION]);
  components.addSprite(world, highlightEntity, entity[SPRITE]);
  components.addRenderable(world, highlightEntity, entity[RENDERABLE]);

  return highlightEntity;
}
