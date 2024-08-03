import * as components from "../components";
import { Map, MAP } from "../components/map";
import { Renderable, RENDERABLE } from "../components/renderable";
import { World } from "../ecs";

export default function createMetadata(
  world: World,
  entity: {
    [MAP]: Map;
    [RENDERABLE]: Renderable;
  }
) {
  const metadataEntity = world.createEntity();

  components.addMap(world, metadataEntity, entity[MAP]);
  components.addRenderable(world, metadataEntity, entity[RENDERABLE]);

  return metadataEntity;
}
