import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import { Viewable, VIEWABLE } from "../components/viewable";
import type { World } from "../ecs";

export default function createViewpoint(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [VIEWABLE]: Viewable;
  }
) {
  const viewpointEntity = world.createEntity();

  components.addAnimatable(world, viewpointEntity, entity[ANIMATABLE]);
  components.addPosition(world, viewpointEntity, entity[POSITION]);
  components.addRenderable(world, viewpointEntity, entity[RENDERABLE]);
  components.addSprite(world, viewpointEntity, entity[SPRITE]);
  components.addViewable(world, viewpointEntity, entity[VIEWABLE]);

  return viewpointEntity;
}
