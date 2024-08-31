import * as components from "../components";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { Item, ITEM } from "../components/item";
import { Orientable, ORIENTABLE } from "../components/orientable";
import { Renderable, RENDERABLE } from "../components/renderable";
import { Sprite, SPRITE } from "../components/sprite";
import { Trackable, TRACKABLE } from "../components/trackable";
import type { World } from "../ecs";

export default function createCompass(
  world: World,
  entity: {
    [ANIMATABLE]: Animatable;
    [ITEM]: Item;
    [ORIENTABLE]: Orientable;
    [RENDERABLE]: Renderable;
    [SPRITE]: Sprite;
    [TRACKABLE]: Trackable;
  }
) {
  const compassEntity = world.createEntity();

  components.addAnimatable(world, compassEntity, entity[ANIMATABLE]);
  components.addItem(world, compassEntity, entity[ITEM]);
  components.addOrientable(world, compassEntity, entity[ORIENTABLE]);
  components.addRenderable(world, compassEntity, entity[RENDERABLE]);
  components.addSprite(world, compassEntity, entity[SPRITE]);
  components.addTrackable(world, compassEntity, entity[TRACKABLE]);

  return compassEntity;
}
