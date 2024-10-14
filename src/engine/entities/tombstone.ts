import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Light, LIGHT } from "../components/light";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Spawnable, SPAWNABLE } from "../components/spawnable";
import { Sprite, SPRITE } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import { Viewable, VIEWABLE } from "../components/viewable";
import type { World } from "../ecs";

export default function createTombstone(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [LIGHT]: Light;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPAWNABLE]: Spawnable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
    [VIEWABLE]: Viewable;
  }
) {
  const tombstoneEntity = world.createEntity();

  components.addAnimatable(world, tombstoneEntity, entity[ANIMATABLE]);
  components.addLight(world, tombstoneEntity, entity[LIGHT]);
  components.addPosition(world, tombstoneEntity, entity[POSITION]);
  components.addRenderable(world, tombstoneEntity, entity[RENDERABLE]);
  components.addSpawnable(world, tombstoneEntity, entity[SPAWNABLE]);
  components.addSprite(world, tombstoneEntity, entity[SPRITE]);
  components.addTooltip(world, tombstoneEntity, entity[TOOLTIP]);
  components.addViewable(world, tombstoneEntity, entity[VIEWABLE]);

  return tombstoneEntity;
}
