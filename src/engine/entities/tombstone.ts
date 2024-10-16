import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Fog, FOG } from "../components/fog";
import { Position, POSITION } from "../components/position";
import { RENDERABLE, Renderable } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import { Swimmable, SWIMMABLE } from "../components/swimmable";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createTombstone(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [FOG]: Fog;
    [POSITION]: Position;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [SWIMMABLE]: Swimmable;
    [TOOLTIP]: Tooltip;
  }
) {
  const tombstoneEntity = world.createEntity();

  components.addAnimatable(world, tombstoneEntity, entity[ANIMATABLE]);
  components.addFog(world, tombstoneEntity, entity[FOG]);
  components.addPosition(world, tombstoneEntity, entity[POSITION]);
  components.addRenderable(world, tombstoneEntity, entity[RENDERABLE]);
  components.addSprite(world, tombstoneEntity, entity[SPRITE]);
  components.addSwimmable(world, tombstoneEntity, entity[SWIMMABLE]);
  components.addTooltip(world, tombstoneEntity, entity[TOOLTIP]);

  return tombstoneEntity;
}
