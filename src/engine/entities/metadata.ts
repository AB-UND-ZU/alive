import * as components from "../components";
import { Map, MAP } from "../components/map";
import { World } from "../ecs";

export default function createMetadata(
  world: World,
  entity: {
    [MAP]: Map;
  }
) {
  const metadataEntity = world.createEntity();

  components.addMap(world, metadataEntity, entity[MAP]);

  return metadataEntity;
}
