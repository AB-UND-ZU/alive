import { Entity } from "ecs";
import { World } from "../ecs";

export type Fog = {
  visibility: 'hidden' | 'fog' | 'visible'
};

export const FOG = "FOG";

export default function addLight(world: World, entity: Entity, fog: Fog) {
  world.addComponentToEntity(entity, FOG, fog);
}
