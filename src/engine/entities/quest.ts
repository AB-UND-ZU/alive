import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { POSITION, Position } from "../components/position";
import { Reference, REFERENCE } from "../components/reference";
import { RENDERABLE, Renderable } from "../components/renderable";
import { SPRITE, Sprite } from "../components/sprite";
import { Tooltip, TOOLTIP } from "../components/tooltip";
import type { World } from "../ecs";

export default function createQuest(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [POSITION]: Position;
    [REFERENCE]: Reference;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TOOLTIP]: Tooltip;
  }
) {
  const focusEntity = world.createEntity();

  components.addAnimatable(world, focusEntity, entity[ANIMATABLE]);
  components.addPosition(world, focusEntity, entity[POSITION]);
  components.addReference(world, focusEntity, entity[REFERENCE]);
  components.addRenderable(world, focusEntity, entity[RENDERABLE]);
  components.addSprite(world, focusEntity, entity[SPRITE]);
  components.addTooltip(world, focusEntity, entity[TOOLTIP]);

  return focusEntity;
}
