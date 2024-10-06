import { Entity } from "ecs";
import { World } from "../ecs";

export type Fog = {
  visibility: "hidden" | "fog" | "visible" | "fixed";
  type: "air" | "terrain" | "unit" | "float";
};

export const FOG = "FOG";

export default function addFog(world: World, entity: Entity, fog: Fog) {
  world.addComponentToEntity(entity, FOG, fog);
}
