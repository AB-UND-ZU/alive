import { Entity } from "ecs";
import { World } from "../ecs";

export type Fog = {
  visibility: "hidden" | "fog" | "visible";
  type: "air" | "terrain" | "unit";
};

export const FOG = "FOG";

export default function addFog(world: World, entity: Entity, fog: Fog) {
  world.addComponentToEntity(entity, FOG, fog);
}
